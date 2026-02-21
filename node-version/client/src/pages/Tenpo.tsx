import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import { showToast } from '../components/Toast';

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

interface MonthlyData {
  estimated: number;
  paid: number;
  gap: number;
}

export default function Tenpo() {
  const navigate = useNavigate();
  const anioActual = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [cuotaRealInput, setCuotaRealInput] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDateInput, setScheduleDateInput] = useState('');
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

  const MESES = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [anioSeleccionado, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/integrations/google/status');
      const data = await response.json();
      setIsAuthenticated(data.authenticated && !data.tokenExpired);
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('Ingresa un texto para buscar', 'info');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/debug/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      console.log('🔍 Resultados de búsqueda:', data);

      if (data.emailsFound === 0 && data.purchasesFound === 0) {
        showToast(`No se encontró "${searchQuery}" en emails ni compras`, 'info');
      } else {
        showToast(`Encontrado: ${data.emailsFound} emails, ${data.purchasesFound} compras. Ver consola (F12) para detalles.`, 'success');
      }
    } catch (error) {
      console.error('Error buscando:', error);
      showToast('Error al buscar', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleToggleInteres = async (purchaseId: number, currentValue: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${purchaseId}/interes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tieneInteres: !currentValue })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar interés');
      }

      showToast(`Interés ${!currentValue ? 'activado' : 'desactivado'} y cuotas recalculadas`, 'success');
      
      await loadData();
    } catch (error: any) {
      console.error('Error toggling interés:', error);
      showToast(error.message || 'Error al cambiar interés', 'error');
    }
  };

  const handleAdjustSchedule = (purchaseId: number) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const currentOverride = purchase.firstDueDateOverride 
      ? new Date(purchase.firstDueDateOverride).toISOString().split('T')[0]
      : '';

    setSelectedPurchaseId(purchaseId);
    setScheduleDateInput(currentOverride);
    setScheduleModalOpen(true);
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

  const handleApplySchedule = async () => {
    if (!selectedPurchaseId) return;

    // Usuario quiere volver a AUTO (string vacío)
    if (!scheduleDateInput || scheduleDateInput.trim() === '') {
      try {
        const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${selectedPurchaseId}/schedule`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduleMode: 'AUTO' })
        });

        if (!response.ok) {
          let errorMessage = 'Error al cambiar calendario';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Error del servidor (${response.status}): Endpoint no disponible`;
          }
          throw new Error(errorMessage);
        }

        showToast('Calendario vuelto a modo automático', 'success');
        
        setScheduleModalOpen(false);
        setScheduleDateInput('');
        setSelectedPurchaseId(null);
        await loadData();
        return;
      } catch (error: any) {
        console.error('Error:', error);
        showToast(error.message || 'Error al cambiar calendario', 'error');
        return;
      }
    }

    // Usuario ingresó nueva fecha
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${selectedPurchaseId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scheduleMode: 'MANUAL',
          firstDueDateOverride: scheduleDateInput
        })
      });

      if (!response.ok) {
        let errorMessage = 'Error al cambiar calendario';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no es JSON, puede ser HTML (404 o error del servidor)
          errorMessage = `Error del servidor (${response.status}): Endpoint no disponible`;
        }
        throw new Error(errorMessage);
      }

      showToast('Calendario ajustado - Las cuotas se recalcularon con la nueva fecha', 'success');
      
      setScheduleModalOpen(false);
      setScheduleDateInput('');
      setSelectedPurchaseId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error:', error);
      showToast(error.message || 'Error al cambiar calendario', 'error');
    }
  };

  const handleConfirmarReal = async () => {
    if (!selectedPurchaseId || !cuotaRealInput) {
      showToast('Ingresa el monto de la cuota', 'error');
      return;
    }

    const cuotaReal = parseInt(cuotaRealInput);
    if (isNaN(cuotaReal) || cuotaReal <= 0) {
      showToast('Monto inválido', 'error');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/purchases/${selectedPurchaseId}/confirmar-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuotaReal })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al confirmar');
      }

      showToast('Valor real confirmado - Las cuotas ya no se recalcularán automáticamente', 'success');
      
      setConfirmModalOpen(false);
      setCuotaRealInput('');
      setSelectedPurchaseId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error confirmando:', error);
      showToast(error.message || 'Error al confirmar valor real', 'error');
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

  const getMonthlyData = (purchaseId: number, month: number): MonthlyData => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return { estimated: 0, paid: 0, gap: 0 };

    // Calcular estimado: suma de cuotas que vencen en este mes DEL AÑO SELECCIONADO
    const estimated = purchase.installments
      .filter(inst => {
        const dueDate = new Date(inst.dueDate);
        return dueDate.getFullYear() === anioSeleccionado && 
               dueDate.getMonth() + 1 === month;
      })
      .reduce((sum, inst) => sum + inst.finalMonthlyAmountClp, 0);

    // Calcular pagado: pagos asociados a este mes
    // (En Tenpo no hay relación directa purchase-payment, así que calculamos proporcionalmente)
    const paid = 0; // Por ahora, necesitaríamos más lógica para asociar pagos

    const gap = estimated - paid;

    return { estimated, paid, gap };
  };

  const getMonthlyTotal = (month: number): MonthlyData => {
    const totals = purchases.reduce(
      (acc, purchase) => {
        const monthData = getMonthlyData(purchase.id, month);
        acc.estimated += monthData.estimated;
        acc.paid += monthData.paid;
        acc.gap += monthData.gap;
        return acc;
      },
      { estimated: 0, paid: 0, gap: 0 }
    );

    return totals;
  };

  const getPurchaseTotal = (purchaseId: number): number => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return 0;
    
    // Solo sumar cuotas que vencen en el año seleccionado
    return purchase.installments
      .filter(inst => {
        const dueYear = new Date(inst.dueDate).getFullYear();
        return dueYear === anioSeleccionado;
      })
      .reduce((sum, inst) => sum + inst.finalMonthlyAmountClp, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  const formatDateLong = (date: Date) => {
    return format(date, "EEEE dd 'de' MMMM", { locale: es });
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container">
          <h1 style={{ marginBottom: '1.5rem', color: '#1e40af' }}>💳 Tenpo - TC Prepago</h1>
          <div className="card" style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              {tokenExpired ? '⚠️ Token expirado' : '🔐 Autenticación requerida'}
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              {tokenExpired 
                ? 'Tu sesión con Gmail ha expirado. Debes autorizar nuevamente el acceso para continuar sincronizando.'
                : 'Para sincronizar con Gmail, debes autorizar el acceso a tu cuenta.'}
            </p>
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              style={{ display: 'inline-block', padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none' }}
              onClick={(e) => {
                // Asegurar que se abre en ventana nueva
                e.preventDefault();
                window.open(authUrl, '_blank', 'width=600,height=700');
              }}
            >
              {tokenExpired ? '🔄 Re-autorizar con Google' : '✅ Autorizar con Google'}
            </a>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
              💡 Se abrirá una ventana emergente. Si no aparece, verifica que tu navegador no esté bloqueando pop-ups.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalAnualEstimado = MESES.reduce((sum, _, idx) => {
    return sum + getMonthlyTotal(idx + 1).estimated;
  }, 0);

  const totalAnualPagado = MESES.reduce((sum, _, idx) => {
    return sum + getMonthlyTotal(idx + 1).paid;
  }, 0);

  return (
    <MainLayout>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💳 Tenpo - TC Prepago</h1>
            <p style={{ marginBottom: '0', color: '#666', fontSize: '1rem' }}>
              Gestión de compras con tarjeta de crédito Tenpo - Proyección de cuotas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/presupuesto/tenpo/config')}
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
              ⚙️ Configurar Tasa
            </button>
            <button
              onClick={() => navigate('/configuracion-tc/TENPO')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: '#fff',
                borderRadius: '6px',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📅 Configuración TC
            </button>
          </div>
        </div>

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="select"
                style={{ width: 'auto', minWidth: '100px' }}
              >
                {aniosDisponibles.map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="button"
              style={{ 
                opacity: syncing ? 0.5 : 1,
                cursor: syncing ? 'not-allowed' : 'pointer'
              }}
            >
              {syncing ? '🔄 Sincronizando...' : '🔄 Actualizar desde Gmail'}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar compra..."
                className="input"
                style={{ width: '250px' }}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="button"
                style={{ 
                  opacity: searching ? 0.5 : 1,
                  cursor: searching ? 'not-allowed' : 'pointer'
                }}
              >
                {searching ? '🔍 Buscando...' : '🔍 Buscar'}
              </button>
            </div>

            <div style={{ 
              marginLeft: 'auto', 
              display: 'flex', 
              gap: '1rem', 
              fontSize: '0.875rem',
              color: '#666'
            }}>
              <span>
                Total Estimado: <strong style={{ color: '#ef4444' }}>{formatCurrency(totalAnualEstimado)}</strong>
              </span>
              <span>
                Total Pagado: <strong style={{ color: '#10b981' }}>{formatCurrency(totalAnualPagado)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Información del ciclo de facturación */}
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

        {/* Tabla principal */}
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={{ minWidth: '250px', position: 'sticky', left: 0, backgroundColor: '#f9fafb', zIndex: 10 }}>
                  Compra
                </th>
                <th rowSpan={2} style={{ minWidth: '100px' }}>Fecha</th>
                <th rowSpan={2} style={{ minWidth: '100px' }}>Cuotas</th>
                <th rowSpan={2} style={{ minWidth: '120px' }}>Total Compra</th>
                {MESES.map((mes, idx) => (
                  <th key={`header-${idx}`} colSpan={1} style={{ minWidth: '100px', textAlign: 'center' }}>
                    {mes}
                  </th>
                ))}
                <th rowSpan={2} style={{ minWidth: '120px' }}>Total Año</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={MESES.length + 5} style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No hay compras registradas para {anioSeleccionado}
                  </td>
                </tr>
              ) : (
                <>
                  {purchases.map((purchase) => (
                    <React.Fragment key={purchase.id}>
                      <tr
                        style={{ cursor: 'pointer', backgroundColor: expandido === purchase.id ? '#eff6ff' : undefined }}
                        onClick={() => setExpandido(expandido === purchase.id ? null : purchase.id)}
                      >
                        <td style={{ position: 'sticky', left: 0, backgroundColor: expandido === purchase.id ? '#eff6ff' : '#fff', zIndex: 9 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{expandido === purchase.id ? '▼' : '▶'}</span>
                            <div>
                              <div style={{ fontWeight: '500' }}>{purchase.merchant}</div>
                              <div style={{ fontSize: '0.75rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{purchase.installments.length} cuotas</span>
                                {purchase.modoMonto === 'REAL' ? (
                                  <span style={{ 
                                    backgroundColor: '#10b981', 
                                    color: '#fff', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600'
                                  }}>
                                    CONFIRMADO
                                  </span>
                                ) : (
                                  <span style={{ 
                                    backgroundColor: '#fbbf24', 
                                    color: '#78350f', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: '600'
                                  }}>
                                    ESTIMADO
                                  </span>
                                )}
                                {purchase.tieneInteres && purchase.interesTotalEstimado && (
                                  <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>
                                    +${Math.round(purchase.interesTotalEstimado).toLocaleString('es-CL')} interés
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(purchase.purchaseDate)}</td>
                        <td style={{ textAlign: 'center' }}>{purchase.installmentsCount}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '600' }}>
                            {formatCurrency(purchase.amountTotalClp)}
                          </div>
                          {purchase.tieneInteres && purchase.totalFinanciadoEstimado && (
                            <div style={{ fontSize: '0.75rem', color: purchase.modoMonto === 'REAL' ? '#059669' : '#666' }}>
                              {purchase.modoMonto === 'REAL' && '✓ '}
                              Total: ${Math.round(purchase.totalFinanciadoEstimado).toLocaleString('es-CL')}
                              {purchase.modoMonto === 'ESTIMADO' && ' (est.)'}
                            </div>
                          )}
                        </td>
                        {MESES.map((_, idx) => {
                          const monthData = getMonthlyData(purchase.id, idx + 1);
                          return (
                            <td key={`purchase-${purchase.id}-month-${idx}`} style={{ textAlign: 'right', backgroundColor: monthData.estimated > 0 ? '#fef3c7' : undefined }}>
                              {monthData.estimated > 0 ? formatCurrency(monthData.estimated) : '-'}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>
                          {formatCurrency(getPurchaseTotal(purchase.id))}
                        </td>
                      </tr>

                      {/* Detalle de cuotas */}
                      {expandido === purchase.id && (
                        <React.Fragment>
                          {/* Fila de controles */}
                          <tr style={{ backgroundColor: '#f3f4f6' }}>
                            <td colSpan={MESES.length + 5} style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={purchase.tieneInteres}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleToggleInteres(purchase.id, purchase.tieneInteres);
                                    }}
                                    disabled={purchase.modoMonto === 'REAL'}
                                    style={{ 
                                      width: '18px', 
                                      height: '18px',
                                      cursor: purchase.modoMonto === 'REAL' ? 'not-allowed' : 'pointer'
                                    }}
                                  />
                                  <span style={{ fontWeight: '500' }}>Con interés (2.11% mensual)</span>
                                </label>

                                {purchase.modoMonto === 'ESTIMADO' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPurchaseId(purchase.id);
                                        setConfirmModalOpen(true);
                                      }}
                                      className="button"
                                      style={{ 
                                        fontSize: '0.875rem',
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#10b981',
                                        color: '#fff'
                                      }}
                                    >
                                      ✓ Confirmar valor real
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAdjustSchedule(purchase.id);
                                      }}
                                      className="button"
                                      style={{ 
                                        fontSize: '0.875rem',
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#6366f1',
                                        color: '#fff'
                                      }}
                                    >
                                      📅 Ajustar mes de pago
                                    </button>

                                    {purchase.scheduleMode === 'MANUAL' && purchase.firstDueDateOverride && (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        padding: '0.375rem 0.625rem',
                                        backgroundColor: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: '0.375rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}>
                                        📅 Calendario manual (desde {format(new Date(purchase.firstDueDateOverride), 'MMM yyyy', { locale: es })})
                                      </span>
                                    )}
                                  </>
                                )}

                                {purchase.tieneInteres && (
                                  <div style={{ 
                                    fontSize: '0.875rem', 
                                    color: '#374151',
                                    backgroundColor: '#f9fafb',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    border: '1px solid #e5e7eb',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.375rem'
                                  }}>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      marginBottom: '0.25rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      {purchase.modoMonto === 'REAL' ? (
                                        <>
                                          <span style={{ color: '#059669' }}>✓ Confirmado</span>
                                          <span style={{ 
                                            backgroundColor: '#d1fae5', 
                                            color: '#065f46',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                          }}>
                                            REAL
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span style={{ color: '#6b7280' }}>Proyección</span>
                                          <span style={{ 
                                            backgroundColor: '#f3f4f6', 
                                            color: '#6b7280',
                                            padding: '0.125rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                          }}>
                                            ESTIMADO
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1rem', fontSize: '0.875rem' }}>
                                      <span style={{ color: '#6b7280' }}>Capital:</span>
                                      <span style={{ fontWeight: '500' }}>${Math.round(purchase.amountTotalClp).toLocaleString('es-CL')}</span>
                                      
                                      {/* Caso 1: Fee definido y presente */}
                                      {purchase.feePct !== null && purchase.feePct !== undefined && purchase.feeAmountClp !== null && purchase.feeAmountClp !== undefined && (
                                        <>
                                          <span style={{ color: '#6b7280' }}>
                                            Comisión ({(purchase.feePct * 100).toFixed(2)}%):
                                          </span>
                                          <span style={{ fontWeight: '500', color: '#dc2626' }}>
                                            +${Math.round(purchase.feeAmountClp).toLocaleString('es-CL')}
                                          </span>
                                        </>
                                      )}
                                      
                                      {/* Caso 2: Fee faltante (compra antigua sin metadata.feePct) */}
                                      {purchase.feeMissing && (
                                        <>
                                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Comisión:</span>
                                          <span style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '0.8125rem' }}>
                                            pendiente (se confirmará con estado de cuenta)
                                          </span>
                                        </>
                                      )}
                                      
                                      {purchase.financedBaseClp && purchase.financedBaseClp !== purchase.amountTotalClp && (
                                        <>
                                          <span style={{ color: '#6b7280' }}>Base financiada:</span>
                                          <span style={{ fontWeight: '600', color: '#1f2937' }}>
                                            ${Math.round(purchase.financedBaseClp).toLocaleString('es-CL')}
                                          </span>
                                        </>
                                      )}
                                      
                                      {purchase.installmentsCount > 1 && (
                                        <>
                                          <span style={{ color: '#6b7280' }}>Interés por cuotas:</span>
                                          <span style={{ fontWeight: '500', color: '#dc2626' }}>
                                            +${Math.round(purchase.interesTotalEstimado || 0).toLocaleString('es-CL')}
                                          </span>
                                        </>
                                      )}
                                      
                                      <span style={{ color: '#6b7280', fontWeight: '600' }}>Total financiado:</span>
                                      <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: '#1f2937' }}>
                                        ${Math.round(purchase.totalFinanciadoEstimado || 0).toLocaleString('es-CL')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Cuotas individuales */}
                          {purchase.installments.map((inst) => {
                          const dueDate = new Date(inst.dueDate);
                          const dueMonth = dueDate.getMonth();
                          
                          return (
                            <tr key={`inst-${inst.id}`} style={{ backgroundColor: '#f9fafb', fontSize: '0.875rem' }}>
                              <td style={{ paddingLeft: '3rem', position: 'sticky', left: 0, backgroundColor: '#f9fafb', zIndex: 9 }}>
                                Cuota {inst.installmentNumber}/{purchase.installmentsCount}
                                {inst.overrideInterestRate && inst.overrideInterestRate > 0 && (
                                  <span style={{ marginLeft: '0.5rem', color: '#ef4444', fontSize: '0.75rem' }}>
                                    (+{inst.overrideInterestRate.toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                              <td>{formatDate(inst.dueDate)}</td>
                              <td style={{ textAlign: 'center' }}>-</td>
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(inst.baseAmountClp)}
                              </td>
                              {MESES.map((_, idx) => (
                                <td 
                                  key={`inst-${inst.id}-month-${idx}`}
                                  style={{ 
                                    textAlign: 'right',
                                    backgroundColor: idx === dueMonth ? '#dbeafe' : undefined,
                                    fontWeight: idx === dueMonth ? '600' : undefined
                                  }}
                                >
                                  {idx === dueMonth ? formatCurrency(inst.finalMonthlyAmountClp) : '-'}
                                </td>
                              ))}
                              <td style={{ textAlign: 'right' }}>
                                {formatCurrency(inst.finalMonthlyAmountClp)}
                              </td>
                            </tr>
                          );
                        })}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Fila de totales */}
                  <tr style={{ backgroundColor: '#1e40af', color: '#fff', fontWeight: '700' }}>
                    <td colSpan={4} style={{ position: 'sticky', left: 0, backgroundColor: '#1e40af', zIndex: 10 }}>
                      TOTAL MENSUAL
                    </td>
                    {MESES.map((_, idx) => {
                      const monthData = getMonthlyTotal(idx + 1);
                      return (
                        <td key={`total-month-${idx}`} style={{ textAlign: 'right' }}>
                          {monthData.estimated > 0 ? formatCurrency(monthData.estimated) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(totalAnualEstimado)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmar valor real */}
      {confirmModalOpen && (
        <div 
          style={{
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
          }}
          onClick={() => {
            setConfirmModalOpen(false);
            setCuotaRealInput('');
            setSelectedPurchaseId(null);
          }}
        >
          <div 
            className="card"
            style={{ 
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>Confirmar Valor Real</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Ingresa el <strong>valor EXACTO de la cuota</strong> que aparece en tu estado de cuenta de Tenpo.
              Una vez confirmado, esta compra quedará marcada como CONFIRMADA y no se recalculará automáticamente.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Valor de cada cuota (CLP)
              </label>
              <input
                type="number"
                value={cuotaRealInput}
                onChange={(e) => setCuotaRealInput(e.target.value)}
                placeholder="Ej: 15000"
                className="input"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setCuotaRealInput('');
                  setSelectedPurchaseId(null);
                }}
                className="button"
                style={{ backgroundColor: '#6b7280', color: '#fff' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarReal}
                className="button"
                style={{ backgroundColor: '#10b981', color: '#fff' }}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajustar calendario */}
      {scheduleModalOpen && (
        <div
          style={{
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
          }}
          onClick={() => {
            setScheduleModalOpen(false);
            setScheduleDateInput('');
            setSelectedPurchaseId(null);
          }}
        >
          <div
            className="card"
            style={{ 
              maxWidth: '500px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>📅 Ajustar Mes de Pago</h3>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Ingresa la <strong>fecha de la primera cuota</strong> según tu estado de cuenta.
              El calendario completo se recalculará automáticamente desde esta fecha.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Fecha de primera cuota
              </label>
              <input
                type="date"
                value={scheduleDateInput}
                onChange={(e) => setScheduleDateInput(e.target.value)}
                className="input"
                style={{ width: '100%', fontSize: '1rem', padding: '0.625rem' }}
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Ejemplo: 2026-03-05
              </p>
            </div>

            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#dbeafe', 
              borderRadius: '0.375rem',
              marginBottom: '1rem'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                💡 <strong>Tip:</strong> Deja el campo vacío para volver al modo automático
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setScheduleModalOpen(false);
                  setScheduleDateInput('');
                  setSelectedPurchaseId(null);
                }}
                className="button"
                style={{ backgroundColor: '#6b7280', color: '#fff' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleApplySchedule}
                className="button"
                style={{ backgroundColor: '#6366f1', color: '#fff' }}
              >
                ✓ Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

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
                <input
                  type="date"
                  value={manualForm.purchaseDate}
                  onChange={(e) => setManualForm({ ...manualForm, purchaseDate: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Comercio *
                </label>
                <input
                  type="text"
                  value={manualForm.merchant}
                  onChange={(e) => setManualForm({ ...manualForm, merchant: e.target.value })}
                  placeholder="Ej: Tienda XYZ"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Monto total (CLP) *
                </label>
                <input
                  type="number"
                  value={manualForm.amountTotalClp}
                  onChange={(e) => setManualForm({ ...manualForm, amountTotalClp: e.target.value })}
                  placeholder="30000"
                  className="input"
                  style={{ width: '100%' }}
                  min="1"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Número de cuotas *
                </label>
                <input
                  type="number"
                  value={manualForm.installmentsCount}
                  onChange={(e) => setManualForm({ ...manualForm, installmentsCount: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                  min="1"
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
                <input
                  type="date"
                  value={manualForm.firstDueDateOverride}
                  onChange={(e) => setManualForm({ ...manualForm, firstDueDateOverride: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
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
