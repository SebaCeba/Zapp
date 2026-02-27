import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { showToast } from '../components/Toast';
import ActualTenpoTable from '../components/actual/ActualTenpoTable';
import DashboardTenpo from '../components/actual/DashboardTenpo';
import CategoryBarChart from '../components/actual/CategoryBarChart';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => currentYear - 5 + i
  );

  // Guardar año/mes en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('actualTenpoPeriod', JSON.stringify({ year, month }));
  }, [year, month]);

  // Reset category filter when month/year changes
  useEffect(() => {
    setSelectedCategory(null);
  }, [year, month]);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [year, month, isAuthenticated]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar todas las compras
      const purchasesRes = await fetch('http://localhost:3000/api/tenpo/purchases');
      const purchasesData = await purchasesRes.json();
      
      // Filtrar compras que tengan cuotas en el mes/año seleccionado
      const filteredPurchases = purchasesData.filter((p: any) => {
        return p.installments.some((inst: any) => {
          const dueDate = new Date(inst.dueDate);
          return dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;
        });
      });
      
      setPurchases(filteredPurchases);
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      showToast('Error al cargar datos de Tenpo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!selectedCategory) return purchases;
    return purchases.filter(p => {
      const catName = p.category?.name || 'Sin Categoría';
      return catName === selectedCategory;
    });
  }, [purchases, selectedCategory]);

  if (!isAuthenticated && !loading) {
    return (
      <MainLayout>
        <div className="container">
          <PageTitleSection title="Actual - Tenpo" />
          <div className="card" style={{ backgroundColor: '#fef3c7', borderColor: '#fbbf24' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
              {tokenExpired ? '⚠️ Token expirado' : '🔐 Autenticación requerida'}
            </h2>
            <p style={{ marginBottom: '1rem', color: '#666' }}>
              {tokenExpired 
                ? 'Tu sesión con Gmail ha expirado. Debes autorizar nuevamente el acceso para continuar.'
                : 'Para ver datos de Tenpo, debes autorizar el acceso a tu cuenta de Gmail.'}
            </p>
            <a
              href={authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button"
              style={{ display: 'inline-block', padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none' }}
              onClick={(e) => {
                e.preventDefault();
                window.open(authUrl, '_blank', 'width=600,height=700');
              }}
            >
              {tokenExpired ? '🔄 Re-autorizar con Google' : '✅ Autorizar con Google'}
            </a>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Actual - Tenpo TC"
          description={`Cuotas de Tenpo programadas para ${MESES[month - 1]} ${year}`}
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

        {loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Cargando...
          </div>
        )}

        {!loading && (
          <>
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
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}
