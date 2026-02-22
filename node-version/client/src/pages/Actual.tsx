import { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { ActualCategory, ActualSummary, CategorySummary } from '../types/actual';
import { fetchActualSummary } from '../api/actualApi';
import ActualTable from '../components/actual/ActualTable';

const CATEGORY_ORDER: ActualCategory[] = [
  ActualCategory.INGRESOS,
  ActualCategory.SUSCRIPCIONES,
  ActualCategory.OBLIGACIONES,
  ActualCategory.HIPOTECARIO,
  ActualCategory.SERVICIOS_BASICOS,
  ActualCategory.SUPERMERCADO,
  ActualCategory.AJUSTES
];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function Actual() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState<ActualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => currentYear - 5 + i
  );

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchActualSummary(year, month);
      setSummary(data);
    } catch (err: any) {
      console.error('Error al cargar resumen:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const getSortedCategories = (categories: CategorySummary[]) => {
    const categoryMap = new Map(categories.map(c => [c.name, c]));
    return CATEGORY_ORDER
      .map(name => categoryMap.get(name))
      .filter((c): c is CategorySummary => c !== undefined);
  };

  const handleEntryUpdated = (categoryName: string, itemKey: string, newAmount: number) => {
    if (!summary) return;

    // Actualización optimista del estado local
    const updatedCategories = summary.categories.map(cat => {
      if (cat.name !== categoryName) return cat;

      const updatedLines = cat.lines.map(line => {
        if (line.itemKey !== itemKey) return line;

        const deltaClp = newAmount - line.budgetClp;
        const pctExec = line.budgetClp === 0 ? null : (newAmount / line.budgetClp) * 100;

        return {
          ...line,
          actualClp: newAmount,
          deltaClp,
          pctExec
        };
      });

      const actualClp = updatedLines.reduce((sum, l) => sum + l.actualClp, 0);
      const budgetClp = updatedLines.reduce((sum, l) => sum + l.budgetClp, 0);
      const deltaClp = actualClp - budgetClp;
      const pctExec = budgetClp === 0 ? null : (actualClp / budgetClp) * 100;

      return {
        ...cat,
        actualClp,
        deltaClp,
        pctExec,
        lines: updatedLines
      };
    });

    const totalIngresos = updatedCategories.find(c => c.name === 'INGRESOS')?.actualClp || 0;
    const totalGastos = updatedCategories
      .filter(c => c.name !== 'INGRESOS')
      .reduce((sum, c) => sum + c.actualClp, 0);
    const balance = totalIngresos - totalGastos;

    setSummary({
      ...summary,
      totalIngresos,
      totalGastos,
      balance,
      categories: updatedCategories
    });
  };

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Actual vs Presupuesto"
          actions={
            <>
              <select 
                value={year} 
                onChange={e => setYear(+e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--gray-300)',
                  fontSize: '1rem'
                }}
              >
                {aniosDisponibles.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select 
                value={month} 
                onChange={e => setMonth(+e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: '1px solid var(--gray-300)',
                  fontSize: '1rem'
                }}
              >
                {MESES.map((mes, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {mes}
                  </option>
                ))}
              </select>
            </>
          }
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Cargando...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            background: '#fee2e2', 
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="balance-section" style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              marginBottom: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  Total Ingresos
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                  {formatMonto(summary.totalIngresos)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  Total Gastos
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
                  {formatMonto(summary.totalGastos)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                  Balance
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: summary.balance >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {formatMonto(summary.balance)}
                </div>
              </div>
            </div>

            {getSortedCategories(summary.categories).map(cat => (
              <ActualTable
                key={cat.name}
                category={cat}
                year={year}
                month={month}
                onEntryUpdated={handleEntryUpdated}
              />
            ))}
          </>
        )}
      </div>
    </MainLayout>
  );
}
