import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { SelectPicker, Input, InputNumber, DatePicker } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { showToast } from '../components/Toast';
import GmailSyncStatusBanner from '../components/common/GmailSyncStatusBanner';
import { mapLegacyAuthState } from '../types/gmailIntegration';
import MonthlyBarChart from '../components/presupuesto/MonthlyBarChart';
import CategoryParetoChart from '../components/presupuesto/CategoryParetoChart';
import AnnualTenpoTable from '../components/presupuesto/AnnualTenpoTable';
import PurchaseDetailModal from '../components/presupuesto/PurchaseDetailModal';

interface Purchase {
  id: number;
  merchant: string;
  purchaseDate: string;
  amountTotalClp: number;
  installmentsCount: number;
  tieneInteres: boolean;
  modoMonto: 'ESTIMADO' | 'REAL';
  totalFinanciadoEstimado: number | null;
  interesTotalEstimado: number | null;
  feePct?: number | null;
  feeAmountClp?: number | null;
  financedBaseClp?: number | null;
  feeMissing?: boolean;
  scheduleMode?: 'AUTO' | 'MANUAL';
  firstDueDateOverride?: string | null;
  installments: Installment[];
}

interface Installment {
  id: number;
  installmentNumber: number;
  baseAmountClp: number;
  dueDate: string;
  payDateEstimated: string;
  overrideInterestRate: number | null;
  overrideMonthlyAmountClp: number | null;
  finalMonthlyAmountClp: number;
  estado: 'ESTIMADO' | 'REAL';
}

interface Payment {
  id: number;
  payDate: string;
  amountClp: number;
  paymentMethod: string;
  transactionCode: string;
}

export default function Tenpo() {
  const navigate = useNavigate();
  const anioActual = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Nuevos estados para filtros y modal
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    merchant: '',
    amountTotalClp: '',
    installmentsCount: '1',
    tieneInteres: true,
    firstDueDateOverride: ''
  });

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  // Calcular ciclo de facturación actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  
  // Si estamos antes del día 21, el cierre es este mes
  // Si estamos después del día 21, el cierre es el mes siguiente
  const closingMonth = currentDay <= 21 ? currentMonth : currentMonth + 1;
  const closingDate = new Date(now.getFullYear(), closingMonth, 21);
  
  // Fecha de vencimiento: 5 del mes siguiente al cierre
  const dueMonth = closingMonth + 1;
  const dueDate = new Date(now.getFullYear(), dueMonth, 5);
  
  // Ajustar si cae en fin de semana (mover a viernes anterior)
  const adjustForWeekend = (date: Date): Date => {
    const day = date.getDay();
    if (day === 0) { // Domingo
      date.setDate(date.getDate() - 2);
    } else if (day === 6) { // Sábado
      date.setDate(date.getDate() - 1);
    }
    return date;
  };
  
  const adjustedDueDate = adjustForWeekend(new Date(dueDate));

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    loadData();
  }, [anioSeleccionado]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/integrations/google/status');
      const data = await response.json();
      setTokenExpired(data.tokenExpired || false);

      if (!data.authenticated || data.tokenExpired) {
        const authResponse = await fetch('http://localhost:3000/api/integrations/google/auth-url');
        const authData = await authResponse.json();
        setAuthUrl(authData.authUrl);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('http://localhost:3000/api/tenpo/sync', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setLastSync(new Date());
        
        const newItems = data.newCompras + data.newPagos;
        const skippedItems = (data.skippedCompras || 0) + (data.skippedPagos || 0);
        
        let message = `✅ Sincronización exitosa!\n`;
        if (newItems > 0) {
          message += `📥 Nuevos: ${data.newCompras} compras, ${data.newPagos} pagos\n`;
        }
        if (skippedItems > 0) {
          message += `⏭️ Ya existían: ${data.skippedCompras || 0} compras, ${data.skippedPagos || 0} pagos`;
        }
        
        showToast(message, 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      showToast('Error al sincronizar con Gmail', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectMonth = (month: number | null) => {
    setSelectedMonth(month);
  };

  const handleSelectCategory = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleClearFilters = () => {
    setSelectedMonth(null);
    setSelectedCategory(null);
  };

  const handlePurchaseClick = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setDetailModalOpen(true);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedPurchase(null);
  };

  const handleCreateManualPurchase = async () => {
    if (!manualForm.merchant || !manualForm.amountTotalClp || !manualForm.installmentsCount) {
      showToast('Completa todos los campos requeridos', 'error');
      return;
    }

    const amountClp = parseFloat(manualForm.amountTotalClp);
    const installments = parseInt(manualForm.installmentsCount);

    if (isNaN(amountClp) || amountClp <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }

    if (isNaN(installments) || installments < 1) {
      showToast('El número de cuotas debe ser mayor o igual a 1', 'error');
      return;
    }

    try {
      const body: any = {
        purchaseDate: manualForm.purchaseDate,
        merchant: manualForm.merchant,
        amountTotalClp: amountClp,
        installmentsCount: installments,
        tieneInteres: manualForm.tieneInteres
      };

      if (manualForm.firstDueDateOverride) {
        body.scheduleMode = 'MANUAL';
        body.firstDueDateOverride = manualForm.firstDueDateOverride;
      }

      const response = await fetch('http://localhost:3000/api/tenpo/purchases/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear compra');
      }

      showToast('✅ Compra manual creada exitosamente', 'success');

      setManualModalOpen(false);
      setManualForm({
        purchaseDate: new Date().toISOString().split('T')[0],
        merchant: '',
        amountTotalClp: '',
        installmentsCount: '1',
        tieneInteres: true,
        firstDueDateOverride: ''
      });
      await loadData();
    } catch (error: any) {
      console.error('Error creando compra manual:', error);
      showToast(error.message || 'Error al crear compra', 'error');
    }
  };

  const loadData = async () => {
    try {
      console.log('🔍 Cargando compras con cuotas del año:', anioSeleccionado);
      
      // Cargar todas las compras (sin filtrar por año de compra)
      const purchasesRes = await fetch('http://localhost:3000/api/tenpo/purchases');
      const purchasesData = await purchasesRes.json();
      
      console.log('📦 Total compras recibidas:', purchasesData.length);
      
      // Filtrar compras que tengan AL MENOS UNA cuota que vence en el año seleccionado
      const filteredPurchases = purchasesData.filter((p: any) => {
        const hasInstallmentInYear = p.installments.some((inst: any) => {
          const dueYear = new Date(inst.dueDate).getFullYear();
          return dueYear === anioSeleccionado;
        });
        
        if (hasInstallmentInYear) {
          const purchaseYear = new Date(p.purchaseDate).getFullYear();
          console.log(`✅ Compra "${p.merchant}" (${purchaseYear}) tiene cuotas en ${anioSeleccionado}`);
        }
        
        return hasInstallmentInYear;
      });
      
      console.log(`✅ Compras con cuotas en ${anioSeleccionado}:`, filteredPurchases.length);
      
      setPurchases(filteredPurchases);

      // Cargar todos los pagos
      const paymentsRes = await fetch('http://localhost:3000/api/tenpo/payments');
      const paymentsData = await paymentsRes.json();
      
      console.log('💰 Total pagos recibidos:', paymentsData.length);
      
      // Filtrar pagos del año seleccionado
      const filteredPayments = paymentsData.filter((p: any) => {
        const payYear = new Date(p.payDate).getFullYear();
        return payYear === anioSeleccionado;
      });
      
      console.log('✅ Pagos filtrados para', anioSeleccionado, ':', filteredPayments.length);
      
      setPayments(filteredPayments);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  const formatDateLong = (date: Date) => {
    return format(date, "EEEE dd 'de' MMMM", { locale: es });
  };

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Tenpo - TC Prepago"
          description="Gestión de compras con tarjeta de crédito Tenpo - Vista analítica anual"
          actions={
            <>
              <button
                onClick={() => navigate('/actual/tenpo')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📊 Vista Mensual
              </button>
              <button
                onClick={() => navigate('/presupuesto/tenpo/config')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Configurar Tasa
              </button>
              <button
                onClick={() => navigate('/tenpo/categorias', { state: { from: '/presupuesto/tenpo' } })}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#8b5cf6',
                  color: '#fff',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                🏷️ Categorías
              </button>
            </>
          }
        />

        {/* Banner de estado de sincronización Gmail */}
        <GmailSyncStatusBanner
          status={mapLegacyAuthState(tokenExpired, !!authUrl, lastSync).status}
          serviceName="Tenpo TC"
          lastSync={lastSync}
          onReauthorize={() => window.open(authUrl, '_blank', 'width=600,height=700')}
        />

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
              <SelectPicker
                value={anioSeleccionado}
                onChange={(value) => value && setAnioSeleccionado(value)}
                data={aniosDisponibles.map(anio => ({ label: anio.toString(), value: anio }))}
                searchable={false}
                cleanable={false}
                style={{ width: '120px' }}
              />
            </div>

            <button
              onClick={handleSync}
              disabled={syncing || tokenExpired}
              className="button"
              style={{ 
                opacity: (syncing || tokenExpired) ? 0.5 : 1,
                cursor: (syncing || tokenExpired) ? 'not-allowed' : 'pointer'
              }}
              title={tokenExpired ? 'Token expirado. Re-autoriza con Google para sincronizar.' : ''}
            >
              {syncing ? '🔄 Sincronizando...' : tokenExpired ? '🔒 Sincronizar (bloqueado)' : '🔄 Actualizar desde Gmail'}
            </button>

            <button
              onClick={() => setManualModalOpen(true)}
              className="button"
              style={{ 
                backgroundColor: '#10b981',
                color: '#fff'
              }}
            >
              ➕ Agregar compra manual
            </button>
          </div>
        </div>

        {/* Información resumida */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              📅 Cierre de Ciclo
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}>
              {formatDateLong(closingDate)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              Día 21 de cada mes
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              💳 Fecha de Vencimiento
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#92400e', marginBottom: '0.25rem' }}>
              {formatDateLong(adjustedDueDate)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              Día 5 del mes siguiente (ajustado por fin de semana)
            </div>
          </div>

          <div className="card" style={{ backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              🔄 Última Sincronización
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>
              {lastSync ? formatDateTime(lastSync) : 'Nunca'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {purchases.length} compras · {payments.length} pagos
            </div>
          </div>
        </div>

        {/* Filtros activos */}
        {(selectedMonth || selectedCategory) && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '2px solid #0ea5e9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#0369a1' }}>🔍 Mostrando:</span>
              {selectedMonth && (
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #7dd3fc',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][selectedMonth - 1]} {anioSeleccionado}
                  </span>
                  <button
                    onClick={() => setSelectedMonth(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '1rem',
                      padding: 0,
                      marginLeft: '0.25rem'
                    }}
                    title="Quitar filtro de mes"
                  >
                    ✕
                  </button>
                </div>
              )}
              {selectedCategory && (
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  border: '1px solid #7dd3fc',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                    {selectedCategory}
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      fontSize: '1rem',
                      padding: 0,
                      marginLeft: '0.25rem'
                    }}
                    title="Quitar filtro de categoría"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#0ea5e9',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🗑️ Limpiar todos los filtros
            </button>
          </div>
        )}

        {/* Gráficos coordinados */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <MonthlyBarChart
            purchases={purchases}
            selectedYear={anioSeleccionado}
            selectedMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
          />
          <CategoryParetoChart
            purchases={purchases}
            selectedYear={anioSeleccionado}
            selectedMonth={selectedMonth}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Tabla filtrada */}
        <AnnualTenpoTable
          purchases={purchases}
          selectedYear={anioSeleccionado}
          selectedMonth={selectedMonth}
          selectedCategory={selectedCategory}
          onPurchaseClick={handlePurchaseClick}
        />

        {/* Modal de detalle de compra */}
        <PurchaseDetailModal
          purchase={selectedPurchase}
          open={detailModalOpen}
          onClose={handleDetailModalClose}
          onDataChange={loadData}
        />
      </div>

      {/* Modal para crear compra manual */}
      {manualModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              ➕ Agregar Compra Manual
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Fecha de compra *
                </label>
                <DatePicker
                  value={manualForm.purchaseDate ? new Date(manualForm.purchaseDate) : null}
                  onChange={(value) => setManualForm({ ...manualForm, purchaseDate: value ? format(value, 'yyyy-MM-dd') : '' })}
                  format="yyyy-MM-dd"
                  style={{ width: '100%' }}
                  oneTap
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Comercio *
                </label>
                <Input
                  value={manualForm.merchant}
                  onChange={(value) => setManualForm({ ...manualForm, merchant: value })}
                  placeholder="Ej: Tienda XYZ"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Monto total (CLP) *
                </label>
                <InputNumber
                  value={manualForm.amountTotalClp ? parseFloat(manualForm.amountTotalClp) : undefined}
                  onChange={(value) => setManualForm({ ...manualForm, amountTotalClp: value?.toString() || '' })}
                  placeholder="30000"
                  style={{ width: '100%' }}
                  min={1}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Número de cuotas *
                </label>
                <InputNumber
                  value={manualForm.installmentsCount ? parseInt(manualForm.installmentsCount) : undefined}
                  onChange={(value) => setManualForm({ ...manualForm, installmentsCount: value?.toString() || '' })}
                  style={{ width: '100%' }}
                  min={1}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="tieneInteres"
                  checked={manualForm.tieneInteres}
                  onChange={(e) => setManualForm({ ...manualForm, tieneInteres: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="tieneInteres" style={{ fontWeight: '500', cursor: 'pointer' }}>
                  Tiene interés
                </label>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Fecha primera cuota (opcional)
                </label>
                <DatePicker
                  value={manualForm.firstDueDateOverride ? new Date(manualForm.firstDueDateOverride) : null}
                  onChange={(value) => setManualForm({ ...manualForm, firstDueDateOverride: value ? format(value, 'yyyy-MM-dd') : '' })}
                  format="yyyy-MM-dd"
                  style={{ width: '100%' }}
                  oneTap
                />
                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Dejar vacío para calcular automáticamente
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  onClick={handleCreateManualPurchase}
                  className="button"
                  style={{ 
                    flex: 1,
                    backgroundColor: '#10b981',
                    color: '#fff'
                  }}
                >
                  ✅ Crear
                </button>
                <button
                  onClick={() => {
                    setManualModalOpen(false);
                    setManualForm({
                      purchaseDate: new Date().toISOString().split('T')[0],
                      merchant: '',
                      amountTotalClp: '',
                      installmentsCount: '1',
                      tieneInteres: true,
                      firstDueDateOverride: ''
                    });
                  }}
                  className="button"
                  style={{ flex: 1 }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
