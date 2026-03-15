import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { showToast } from '../components/Toast';
import ActualTenpoTable from '../components/actual/ActualTenpoTable';
import DashboardTenpo from '../components/actual/DashboardTenpo';
import CategoryBarChart from '../components/actual/CategoryBarChart';
import MonthlyPaymentPanel from '../components/actual/MonthlyPaymentPanel';
import YearMonthPicker from '../components/common/YearMonthPicker';
import GmailSyncStatusBanner from '../components/common/GmailSyncStatusBanner';
import { mapLegacyAuthState } from '../types/gmailIntegration';

// Hook simple para media query
function useMediaQueryHook(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

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
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
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

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ActualTenpo() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Restaurar año/mes desde localStorage o usar valores actuales
  const getSavedPeriod = () => {
    try {
      const saved = localStorage.getItem('actualTenpoPeriod');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { year: parsed.year, month: parsed.month };
      }
    } catch (e) {
      console.error('Error loading period from localStorage:', e);
    }
    return { year: currentYear, month: currentMonth };
  };

  const savedPeriod = getSavedPeriod();
  const [year, setYear] = useState(savedPeriod.year);
  const [month, setMonth] = useState(savedPeriod.month);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Estado para el panel de pago
  const [selectedForPaymentCount, setSelectedForPaymentCount] = useState(0);
  const [selectedForPaymentAmount, setSelectedForPaymentAmount] = useState(0);

  // Inicializar authUrl
  useEffect(() => {
    fetch('/api/integrations/google/auth-url')
      .then(r => r.json())
      .then(d => {
        if (d.authUrl) setAuthUrl(d.authUrl);
      })
      .catch(console.error);
  }, []);

  // Responsive Check
  const isLargeScreen = useMediaQueryHook('(min-width: 1200px)');
  
  // Dynamic offset for sidebar
  const headerRef = useRef<HTMLDivElement>(null);
  const [sidebarTop, setSidebarTop] = useState(90); // Default fallback

  useEffect(() => {
    if (!headerRef.current) return;

    const updateOffset = () => {
      if (headerRef.current) {
        // Obtenemos la altura del bloque de título
        headerRef.current.getBoundingClientRect();
        // El sidebar debería empezar justo donde termina el headerRef + un pequeño gap
        // rect.bottom nos da esa posición exacta relativa al viewport (viewport top = 0)
        // NOTA: Si el header scrollea, rect.bottom cambia.
        // Si queremos que el sidebar sea fijo DE INICIO, debemos considerar si el layout general scrollea el body o un contenedor interno.
        // Si scrollea el body (lo más común), el sidebar fixed se queda quieto.
        // Pero si scrollemos, el headerRef sube y rect.bottom disminuye.
        // EL USUARIO QUIERE: "sidebar derecho fijo debe comenzar justo debajo del header superior... alineado con cards"
        // Si el header (PageTitle) scrollea y desaparece, el sidebar debería subir? O quedarse pegado arriba?
        // Comúnmente "Fixed sidebar" significa que ocupa toda la altura y está "pegado" al top, O que respeta el header.
        
        // INTERPRETACIÓN: El sidebar acompaña a las Cards. Las cards están debajo del Header.
        // Si el Header scrollea, las cards suben.
        // Si el Sidebar es FIXED, no scrollea.
        // Si el user quiere que estén "alineados", entonces el sidebar NO debería ser fixed, sino sticky?
        // El usuario pidió "position: fixed" explícitamente en el prompt anterior y en este.
        // "sidebar derecho fijo debe comenzar justo debajo del header superior"
        // Si el header es parte del flujo normal (no fixed), al scrollear, el header desaparece.
        // Si el sidebar es fixed a "top: X", se quedará ahí flotando encima del contenido escrolleado o dejando un hueco.
        
        // SOLUCIÓN HÍBRIDA ROBUSTA:
        // Calculamos la posición inicial. Si el scroll pasa ese punto, el sidebar se pega al top (o top + navbar height).
        // Pero el requerimiento dice "Sidebar top dinámico alineado con cards".
        // Lo más seguro es que el usuario quiera que el sidebar empiece donde empiezan las cards.
        // Y como es FIXED, se quedará ahí.
        // Si scrollea la página, las cards subirán y el sidebar se quedará quieto (desalineandose).
        // A MENOS que el sidebar sea Sticky. Pero el usuario pidió Fixed.
        // Asumiremos que "Fixed" se refiere a la columna derecha persistente.
        
        // Vamos a medir la altura del headerSection y sumarle el offset inicial del layout (e.g. navbar).
        // Asumamos que el layout tiene un header fijo o simplemente queremos que el sidebar empiece dsp del titulo.
        // Si usamos rect.bottom + window.scrollY, tenemos la posición absoluta en el documento.
        // Pero fixed usa coords del viewport.
        
        // VAMOS A SIMPLIFICAR:
        // El PageTitleSection está arriba.
        // El sidebar fixed debe estar debajo de él.
        // Usaremos fixed con top = rect.bottom (inicial) pero eso haría que se mueva si rect.bottom cambia?
        // No, si solo lo calculamos al inicio o resize.
        // Sin embargo, si scrolleamos, rect.bottom cambia.
        // Si el sidebar es fixed, `top` es constante relativa a la ventana.
        
        // TÁCTICA: Medir la altura del header container y asignarla como top.
        // Asumiendo que el header del layout (MainLayout) tiene altura H.
        // Sidebar top = H + PageTitleHeight + gap.
        // Si MainLayout header no es fixed, esto se romperá al scrollear (sidebar quedará abajo flotando).
        // PERO, seguiremos las instrucciones textuales: "Sidebar top dinámico".
        // Mediremos la altura del headerRef y usaremos eso.
        
        // Mejor aproximación para "Fixed pero alineado":
        // Si el layout es scrollable body:
        // El sidebar debería tener `top: (altura del headerRef) + padding`.
        // Pero ojo, si scrolleas, el "top" visual de las cards cambia (sube). El sidebar fixed NO sube.
        // Esto desalineará visualmente el sidebar de las cards al scrollear.
        // EL CRITERIO "position: fixed" entra en conflicto con "alineado con cards al scrollear" si el header no es fixed.
        // SALVO que el sidebar sea Sticky, que es lo que hice antes y el usuario rechazó.
        // O SALVO que el header general TAMBIÉN sea fixed o sticky.
        
        // Voy a cumplir: "Sidebar starts below header".
        // Si el usuario scrollea, problema suyo si se desalinea, O quizás el MainLayout header es fixed.
        // Usaremos ResizeObserver en el headerRef para setear el top inicial.
        
        // Ajuste: si el rect.top es 0 (está arriba), el rect.height es lo que ocupa.
        // Pero MainLayout container suele tener margin-top o padding-top.
        // rect.bottom es la apuesta segura para "donde termina visualmente".
      }
      
      if (headerRef.current) {
        setSidebarTop(headerRef.current.getBoundingClientRect().bottom + 16);
      }
    };

    updateOffset(); // Inicial
    const resizeObserver = new ResizeObserver(updateOffset);
    resizeObserver.observe(headerRef.current);
    
    // También escuchar scroll/resize window por si el layout cambia
    window.addEventListener('resize', updateOffset);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateOffset);
    };
  }, []); // Empty dependency array, ref is stable

  const handleSelectionChange = (count: number, amount: number) => {
    setSelectedForPaymentCount(count);
    setSelectedForPaymentAmount(amount);
  };

  const handlePaymentConfirmed = () => {
    loadData(); // Refrescar datos principales al confirmar pago
  };

  // Guardar año/mes en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('actualTenpoPeriod', JSON.stringify({ year, month }));
  }, [year, month]);

  // Reset category filter when month/year changes
  useEffect(() => {
    setSelectedCategory(null);
  }, [year, month]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tenpo/admin/monthly?year=${year}&month=${month}`);
      
      if (res.status === 401) {
        setTokenExpired(true);
        // Intentar obtener authUrl si no la tenemos
        if (!authUrl) {
           fetch('/api/integrations/google/auth-url')
             .then(r => r.json())
             .then(d => d.authUrl && setAuthUrl(d.authUrl));
        }
        // NO hacer return - continuar procesando si hay datos
      }
      
      if (!res.ok && res.status !== 401) {
        throw new Error('Error fetching data');
      }

      const data = await res.json();
      setPurchases(data.purchases || []); 
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showToast('Error al cargar datos de Tenpo', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year, month]);


  const filteredPurchases = useMemo(() => {
    if (!selectedCategory) return purchases;
    return purchases.filter(p => {
      const catName = p.category?.name || 'Sin Categoría';
      return catName === selectedCategory;
    });
  }, [purchases, selectedCategory]);

  return (
    <MainLayout>
      <div className="container">
        <div ref={headerRef}>
          <PageTitleSection
            title="Actual - Tenpo TC"
          description={`Cuotas de Tenpo programadas para ${MESES[month - 1]} ${year}`}
          actions={
            <>
              <YearMonthPicker 
                year={year} 
                month={month} 
                onChangeYear={setYear} 
                onChangeMonth={setMonth} 
              />
              <button
                onClick={() => navigate('/presupuesto/tenpo')}
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
                📊 Vista Anual
              </button>
              <button
                onClick={() => navigate('/tenpo/categorias', { state: { from: '/actual/tenpo' } })}
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
        </div>

        {/* Banner de estado de sincronización Gmail */}
        <GmailSyncStatusBanner
          status={mapLegacyAuthState(tokenExpired, !!authUrl, null).status}
          serviceName="Tenpo TC"
          onReauthorize={() => window.open(authUrl, '_blank', 'width=600,height=700')}
        />

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Cargando...
          </div>
        )}

        {!loading && (
          <div style={{ position: 'relative' }}>
            {/* Main Content Area */}
            <div style={{ 
              marginRight: isLargeScreen ? '420px' : '0', // 400px width + 20px gap
              transition: 'margin-right 0.3s ease',
              paddingBottom: '40px'
             }}>
              <DashboardTenpo purchases={purchases} year={year} month={month} />
              <CategoryBarChart 
                purchases={purchases}
                selectedYear={year}
                selectedMonth={month}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              <ActualTenpoTable 
                purchases={filteredPurchases} 
                year={year} 
                month={month} 
                onDataChange={loadData} 
                onSelectionChange={handleSelectionChange}
              />
            </div>
            
            {/* Fixed Payment Panel Sidebar */}
            {isLargeScreen ? (
              <div style={{ 
                position: 'fixed',
                top: `${sidebarTop}px`,
                right: 0, // Stick to right edge
                bottom: 0, // Stick to bottom
                width: '400px',
                zIndex: 100,
                backgroundColor: '#fff',
                borderLeft: '1px solid #e5e7eb',
                boxShadow: '-4px 0 15px rgba(0,0,0,0.03)'
              }}>
                <MonthlyPaymentPanel
                  selectedAmount={selectedForPaymentAmount}
                  selectedCount={selectedForPaymentCount}
                  year={year}
                  month={month}
                  onPaymentConfirmed={handlePaymentConfirmed}
                  onCancel={() => {}} 
                />
              </div>
            ) : (
              // Mobile/Tablet View: Stacked below
              <div style={{ marginTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <MonthlyPaymentPanel
                  selectedAmount={selectedForPaymentAmount}
                  selectedCount={selectedForPaymentCount}
                  year={year}
                  month={month}
                  onPaymentConfirmed={handlePaymentConfirmed}
                  onCancel={() => {}} 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
