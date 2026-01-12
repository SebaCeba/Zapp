import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import Toast from '../components/Toast';

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
  const [authUrl, setAuthUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
  const [cuotaRealInput, setCuotaRealInput] = useState('');

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
      setIsAuthenticated(data.authenticated);

      if (!data.authenticated) {
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
        
        setToast({
          message,
          type: 'success'
        });
        loadData();
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
      setToast({
        message: 'Error al sincronizar con Gmail',
        type: 'error'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setToast({
        message: 'Ingresa un texto para buscar',
        type: 'info'
      });
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/debug/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      console.log('🔍 Resultados de búsqueda:', data);

      if (data.emailsFound === 0 && data.purchasesFound === 0) {
        setToast({
          message: `No se encontró "${searchQuery}" en emails ni compras`,
          type: 'info'
        });
      } else {
        setToast({
          message: `Encontrado: ${data.emailsFound} emails, ${data.purchasesFound} compras. Ver consola (F12) para detalles.`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error buscando:', error);
      setToast({
        message: 'Error al buscar',
        type: 'error'
      });
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

      setToast({
        message: `Interés ${!currentValue ? 'activado' : 'desactivado'} y cuotas recalculadas`,
        type: 'success'
      });
      
      await loadData();
    } catch (error: any) {
      console.error('Error toggling interés:', error);
      setToast({
        message: error.message || 'Error al cambiar interés',
        type: 'error'
      });
    }
  };

  const handleConfirmarReal = async () => {
    if (!selectedPurchaseId || !cuotaRealInput) {
      setToast({
        message: 'Ingresa el monto de la cuota',
        type: 'error'
      });
      return;
    }

    const cuotaReal = parseInt(cuotaRealInput);
    if (isNaN(cuotaReal) || cuotaReal <= 0) {
      setToast({
        message: 'Monto inválido',
        type: 'error'
      });
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

      setToast({
        message: 'Valor real confirmado - Las cuotas ya no se recalcularán automáticamente',
        type: 'success'
      });
      
      setConfirmModalOpen(false);
      setCuotaRealInput('');
      setSelectedPurchaseId(null);
      await loadData();
    } catch (error: any) {
      console.error('Error confirmando:', error);
      setToast({
        message: error.message || 'Error al confirmar valor real',
        type: 'error'
      });
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
              Autenticación requerida
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              Para sincronizar con Gmail, debes autorizar el acceso a tu cuenta.
            </p>
            <a
              href={authUrl}
              className="button"
              style={{ display: 'inline-block', padding: '0.5rem 1.5rem' }}
            >
              Autorizar con Google
            </a>
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
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              Total: ${Math.round(purchase.totalFinanciadoEstimado).toLocaleString('es-CL')}
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
                                )}

                                {purchase.tieneInteres && (
                                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    Capital: ${Math.round(purchase.amountTotalClp).toLocaleString('es-CL')} → 
                                    Total financiado: ${Math.round(purchase.totalFinanciadoEstimado || 0).toLocaleString('es-CL')} 
                                    (+ ${Math.round(purchase.interesTotalEstimado || 0).toLocaleString('es-CL')} interés)
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

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </MainLayout>
  );
}
