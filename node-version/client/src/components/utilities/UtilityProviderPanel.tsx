import { useState, useEffect } from 'react';
import { showToast } from '../Toast';
import { Button, Message } from 'rsuite';
import UtilityImportCard from './UtilityImportCard';
import UtilityTable from './UtilityTable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Transaction {
  id: number;
  providerKey: string;
  transactionDate: string;
  amount: number;
  description: string | null;
  source: string;
  createdAt: string;
  metadata?: string | null; // JSON string con metadata adicional
  provider: {
    id: number;
    nombre: string;
  };
}

interface MonthlySummary {
  month: number;
  total: number;
  count: number;
}

interface UtilityProviderPanelProps {
  provider: string;
  providerConfig?: {
    id: number;
    nombre: string;
    hasEmailConnector: boolean;
    gmailLabel: string | null;
  };
  year: number;
  onDataChange?: () => void;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function UtilityProviderPanel({ provider, providerConfig, year, onDataChange }: UtilityProviderPanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summaryCurrentYear, setSummaryCurrentYear] = useState<MonthlySummary[]>([]);
  const [summaryPreviousYear, setSummaryPreviousYear] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingEmail, setImportingEmail] = useState(false);
  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [pendingSelections, setPendingSelections] = useState<Record<string, { payYear: number; payMonth: number }>>({});

  useEffect(() => {
    loadTransactions();
    loadSummaries();
  }, [provider, year]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}?year=${year}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTransactions(data);
      } else {
        console.error('Response is not an array:', data);
        setTransactions([]);
        showToast('Error: respuesta inválida del servidor', 'error');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      showToast('Error al cargar transacciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSummaries = async () => {
    try {
      const [currentResponse, previousResponse] = await Promise.all([
        fetch(`http://localhost:3000/api/utilities/${provider}/summary?year=${year}`),
        fetch(`http://localhost:3000/api/utilities/${provider}/summary?year=${year - 1}`)
      ]);

      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setSummaryCurrentYear(currentData);
      }

      if (previousResponse.ok) {
        const previousData = await previousResponse.json();
        setSummaryPreviousYear(previousData);
      }
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  };

  const handleImportEmail = async () => {
    if (!providerConfig?.hasEmailConnector) return;

    setImportingEmail(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}/import-email/preview`,
        { method: 'POST' }
      );

      const result = await response.json();

      if (response.ok) {
        if (result.items && result.items.length > 0) {
          setPreviewItems(result.items);
          
          // Inicializar pendingSelections con suggestedPayMonth o mes/año actual
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;
          const initialSelections: Record<string, { payYear: number; payMonth: number }> = {};
          
          result.items.forEach((item: any) => {
            if (item.suggestedPayMonth) {
              const [year, month] = item.suggestedPayMonth.split('-').map(Number);
              initialSelections[item.gmailMessageId] = { payYear: year, payMonth: month };
            } else {
              initialSelections[item.gmailMessageId] = { payYear: currentYear, payMonth: currentMonth };
            }
          });
          
          setPendingSelections(initialSelections);
          showToast(`📋 ${result.items.length} transacciones pendientes agregadas a la tabla`, 'info');
        } else {
          showToast(result.message || 'No hay transacciones nuevas para importar', 'info');
        }
      } else {
        showToast(result.error || 'Error al obtener preview desde Gmail', 'error');
      }
    } catch (error) {
      console.error('Error importing from Gmail:', error);
      showToast('Error al obtener preview desde Gmail', 'error');
    } finally {
      setImportingEmail(false);
    }
  };

  const handleDiscardPending = () => {
    if (!confirm('¿Descartar todas las transacciones pendientes?')) return;
    setPreviewItems([]);
    setPendingSelections({});
    showToast('Transacciones pendientes descartadas', 'info');
  };

  const handleApplyFirstToAll = () => {
    if (previewItems.length === 0) return;
    const firstItem = previewItems[0];
    const firstSelection = pendingSelections[firstItem.gmailMessageId];
    
    if (!firstSelection) {
      showToast('La primera fila no tiene mes/año asignado', 'warning');
      return;
    }

    const newSelections: Record<string, { payYear: number; payMonth: number }> = {};
    previewItems.forEach(item => {
      newSelections[item.gmailMessageId] = { ...firstSelection };
    });
    
    setPendingSelections(newSelections);
    showToast(`Mes/año aplicado a ${previewItems.length} transacciones`, 'success');
  };

  const handleSavePending = async () => {
    // Validar que todas las filas tengan selección
    const missingSelections = previewItems.filter(
      item => !pendingSelections[item.gmailMessageId] ||
              !pendingSelections[item.gmailMessageId].payYear ||
              !pendingSelections[item.gmailMessageId].payMonth
    );

    if (missingSelections.length > 0) {
      showToast(`${missingSelections.length} transacciones sin mes/año asignado`, 'error');
      return;
    }

    // Construir confirmedItems
    const confirmedItems = previewItems.map(item => {
      const selection = pendingSelections[item.gmailMessageId];
      return {
        gmailMessageId: item.gmailMessageId,
        emailDate: item.emailDate,
        payYear: selection.payYear,
        payMonth: selection.payMonth,
        amount: item.amount,
        description: item.description,
        metadata: item.metadata
      };
    });

    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}/import-email/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: confirmedItems })
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(`✅ ${result.imported} transacciones guardadas en Actual`, 'success');
        setPreviewItems([]);
        setPendingSelections({});
        loadTransactions();
        loadSummaries();
        onDataChange?.();
      } else {
        showToast(result.error || 'Error al guardar transacciones', 'error');
      }
    } catch (error) {
      console.error('Error saving pending transactions:', error);
      showToast('Error al guardar transacciones', 'error');
    }
  };

  const handleUpdateSavedPayPeriod = async (transactionId: number, payYear: number, payMonth: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}/transactions/${transactionId}/pay-period`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payYear, payMonth })
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Periodo de pago actualizado', 'success');
        loadTransactions();
        loadSummaries();
        onDataChange?.();
      } else {
        showToast(result.error || 'Error al actualizar periodo', 'error');
      }
    } catch (error) {
      console.error('Error updating pay period:', error);
      showToast('Error al actualizar periodo de pago', 'error');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showToast('El archivo CSV debe tener al menos una línea de datos', 'error');
        return;
      }

      const transactions = lines.slice(1).map(line => {
        const [date, amount, description] = line.split(',').map(s => s.trim());
        return { date, amount, description: description || '' };
      });

      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions })
        }
      );

      const result = await response.json();

      if (response.ok) {
        showToast(`✅ ${result.imported} transacciones importadas`, 'success');
        loadTransactions();
        loadSummaries();
        onDataChange?.();
      } else {
        showToast(result.error || 'Error al importar', 'error');
      }
    } catch (error) {
      console.error('Error importing:', error);
      showToast('Error al importar CSV', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta transacción?')) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}/${id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        showToast('Transacción eliminada', 'success');
        loadTransactions();
        loadSummaries();
        onDataChange?.();
      } else {
        showToast('Error al eliminar', 'error');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('Error al eliminar transacción', 'error');
    }
  };

  const handleAddManual = async () => {
    const date = prompt('Fecha (YYYY-MM-DD):');
    if (!date) return;

    const amount = prompt('Monto (CLP):');
    if (!amount) return;

    const description = prompt('Descripción (opcional):') || '';

    try {
      const response = await fetch(
        `http://localhost:3000/api/utilities/${provider}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, amount: parseFloat(amount), description })
        }
      );

      if (response.ok) {
        showToast('Transacción agregada', 'success');
        loadTransactions();
        loadSummaries();
        onDataChange?.();
      } else {
        const error = await response.json();
        showToast(error.error || 'Error al agregar', 'error');
      }
    } catch (error) {
      console.error('Error adding manual transaction:', error);
      showToast('Error al agregar transacción', 'error');
    }
  };

  // Calcular KPIs
  const totalYear = transactions.reduce((sum, t) => sum + t.amount, 0);
  const monthsWithData = summaryCurrentYear.filter(m => m.count > 0).length;
  const averageMonth = monthsWithData > 0 ? totalYear / monthsWithData : 0;
  
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );
  const lastPayment = sortedTransactions[0];

  const mostExpensiveMonth = summaryCurrentYear.reduce((max, curr) => 
    curr.total > max.total ? curr : max
  , { month: 0, total: 0, count: 0 });

  // Preparar datos para el gráfico YoY
  const chartData = MESES.map((monthName, index) => {
    const currentMonth = summaryCurrentYear.find(m => m.month === index + 1);
    const previousMonth = summaryPreviousYear.find(m => m.month === index + 1);

    return {
      month: monthName,
      [year.toString()]: currentMonth?.total || 0,
      [(year - 1).toString()]: previousMonth?.total || 0
    };
  });

  const hasPending = previewItems.length > 0;
  const allSelectionsValid = previewItems.every(
    item => pendingSelections[item.gmailMessageId]?.payYear && pendingSelections[item.gmailMessageId]?.payMonth
  );

  return (
    <div>
      {/* Card de importación */}
      <UtilityImportCard
        provider={provider}
        hasEmailConnector={providerConfig?.hasEmailConnector || false}
        gmailLabel={providerConfig?.gmailLabel || null}
        onImport={handleImport}
        onImportEmail={handleImportEmail}
        onAddManual={handleAddManual}
        importingEmail={importingEmail}
      />

      {/* Banner de pendientes */}
      {hasPending && (
        <div className="card" style={{ 
          marginTop: '1rem', 
          marginBottom: '1rem',
          backgroundColor: '#fef3c7',
          border: '2px solid #fbbf24'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                ⚠️ Tienes {previewItems.length} {previewItems.length === 1 ? 'transacción pendiente' : 'transacciones pendientes'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                Asigna el mes/año de pago en la tabla inferior y luego haz click en "Guardar cambios" para registrar en Actual.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button size="sm" appearance="ghost" onClick={handleApplyFirstToAll}>
                📌 Aplicar primer mes/año a todos
              </Button>
              <Button size="sm" appearance="subtle" onClick={handleDiscardPending}>
                🗑️ Descartar pendientes
              </Button>
            </div>
          </div>
          {!allSelectionsValid && (
            <Message type="warning" style={{ marginTop: '0.75rem' }}>
              ⚠️ Algunas transacciones no tienen mes/año asignado. Completa la información para poder guardar.
            </Message>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="card" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Año</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
              ${Math.round(totalYear).toLocaleString('es-CL')}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Promedio Mensual</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>
              ${Math.round(averageMonth).toLocaleString('es-CL')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              ({monthsWithData} {monthsWithData === 1 ? 'mes' : 'meses'} con data)
            </div>
          </div>

          {lastPayment && (
            <div style={{ padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Último Pago</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#92400e' }}>
                ${Math.round(lastPayment.amount).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                {new Date(lastPayment.transactionDate).toLocaleDateString('es-CL')}
              </div>
            </div>
          )}

          {mostExpensiveMonth.month > 0 && (
            <div style={{ padding: '1rem', backgroundColor: '#fce7f3', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Mes Más Caro</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9f1239' }}>
                ${Math.round(mostExpensiveMonth.total).toLocaleString('es-CL')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                {MESES[mostExpensiveMonth.month - 1]} {year}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico YoY */}
      {summaryCurrentYear.some(m => m.total > 0) && (
        <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Evolución Mensual (YoY)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `$${Math.round(value).toLocaleString('es-CL')}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={year.toString()} 
                stroke="#3b82f6" 
                strokeWidth={2}
                name={year.toString()}
              />
              <Line 
                type="monotone" 
                dataKey={(year - 1).toString()} 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name={`${year - 1} (anterior)`}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de transacciones */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Cargando transacciones...</p>
        </div>
      ) : (
        <UtilityTable
          transactions={transactions}
          pendingItems={previewItems}
          pendingSelections={pendingSelections}
          onPendingSelectionChange={(gmailMessageId: string, field: 'payYear' | 'payMonth', value: number) => {
            setPendingSelections(prev => ({
              ...prev,
              [gmailMessageId]: {
                ...prev[gmailMessageId],
                [field]: value
              }
            }));
          }}
          onSavedPayPeriodChange={handleUpdateSavedPayPeriod}
          onDelete={handleDelete}
        />
      )}

      {/* Barra sticky inferior */}
      {hasPending && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1e40af',
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
            📋 Pendientes: {previewItems.length}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button 
              appearance="subtle" 
              onClick={handleDiscardPending}
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              Descartar
            </Button>
            <Button 
              appearance="primary" 
              color="green"
              onClick={handleSavePending}
              disabled={!allSelectionsValid}
            >
              💾 Guardar cambios ({previewItems.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
