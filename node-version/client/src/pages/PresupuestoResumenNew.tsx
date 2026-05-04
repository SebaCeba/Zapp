import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';
import {
  fetchBudgetMonthly,
  fetchBudgetByAccount,
  MonthlyTotal,
  AccountTotal,
} from '../api/v2Api';


const MONTH_LABELS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function clp(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

function groupByPrefix(accounts: AccountTotal[], prefix: string): number {
  return accounts
    .filter(a => a.accountCode.startsWith(prefix))
    .reduce((sum, a) => sum + a.totalClp, 0);
}

type ViewMode = 'anual' | 'mensual';

interface AccountMonthlyData {
  accountBaseId: number;
  accountCode: string;
  accountName: string;
  monthlyAmounts: number[]; // 12 months
  totalClp: number;
}

// Mapeo de códigos de tipos de gasto a nombres conocidos
// Usado cuando el tipo padre no existe en los datos (solo existen los subtipos)
const EXPENSE_TYPE_NAMES: Record<string, string> = {
  'GAS.SUS': 'Suscripciones',
  'GAS.SER': 'Servicios Básicos',
  'GAS.OBL': 'Créditos / Obligaciones',
  'GAS.HIP': 'Hipotecario',
  'GAS.SUP': 'Supermercado',
  'GAS.AJU': 'Ajustes',
};

// Estructura jerárquica para renderizado
interface HierarchyNode {
  code: string;
  name: string;
  level: number; // 1=Grupo raíz, 2=Tipo, 3=Subtipo
  totalClp: number;
  accountBaseId?: number; // Solo para hojas
  children: HierarchyNode[];
}

// Estructura jerárquica para vista mensual
interface HierarchyNodeMonthly {
  code: string;
  name: string;
  level: number;
  monthlyAmounts: number[]; // 12 months
  totalClp: number;
  accountBaseId?: number;
  children: HierarchyNodeMonthly[];
}

/**
 * Agrupa cuentas jerárquicamente según su accountCode
 * Jerarquía funcional:
 * - Ingresos: 2 niveles (ING. → ING.001)
 * - Gastos: 3 niveles (GAS. → GAS.SUS → GAS.SUS.001)
 * - Ahorros: 2 niveles (AHO. → AHO.001)
 */
function buildHierarchy(accounts: AccountTotal[]): HierarchyNode[] {
  const rootNodes: Map<string, HierarchyNode> = new Map();

  // Inicializar nodos raíz
  const ingresosNode: HierarchyNode = { code: 'ING', name: 'Ingresos', level: 1, totalClp: 0, children: [] };
  const gastosNode: HierarchyNode = { code: 'GAS', name: 'Gastos', level: 1, totalClp: 0, children: [] };
  const ahorrosNode: HierarchyNode = { code: 'AHO', name: 'Ahorros', level: 1, totalClp: 0, children: [] };

  rootNodes.set('ING', ingresosNode);
  rootNodes.set('GAS', gastosNode);
  rootNodes.set('AHO', ahorrosNode);

  // Procesar cada cuenta
  accounts.forEach(acc => {
    const parts = acc.accountCode.split('.');
    const rootPrefix = parts[0]; // ING, GAS, AHO

    const rootNode = rootNodes.get(rootPrefix);
    if (!rootNode) return; // Ignorar códigos no reconocidos

    rootNode.totalClp += acc.totalClp;

    if (rootPrefix === 'ING' || rootPrefix === 'AHO') {
      // 2 niveles: Grupo → Tipo (directo)
      // La cuenta misma es el tipo
      const typeNode: HierarchyNode = {
        code: acc.accountCode,
        name: acc.accountName,
        level: 2,
        totalClp: acc.totalClp,
        accountBaseId: acc.accountBaseId,
        children: []
      };
      rootNode.children.push(typeNode);
    } else if (rootPrefix === 'GAS') {
      // 3+ niveles: Grupo → Tipo → Subtipo(s)
      // Soporta GAS.HIP.DIV (3 partes) y GAS.HIP.SEG.001 (4 partes)
      if (parts.length === 2) {
        // GAS.SUS = Tipo (nivel 2)
        const typeCode = parts.slice(0, 2).join('.');
        let typeNode = rootNode.children.find(c => c.code === typeCode);
        if (!typeNode) {
          typeNode = {
            code: typeCode,
            name: acc.accountName, // Si la cuenta es GAS.SUS, su nombre es "Suscripciones"
            level: 2,
            totalClp: 0,
            children: []
          };
          rootNode.children.push(typeNode);
        }
        typeNode.totalClp += acc.totalClp;
        
        // Si es una hoja directa (sin subtipo), agregar como hoja
        const subtypeNode: HierarchyNode = {
          code: acc.accountCode,
          name: acc.accountName,
          level: 3,
          totalClp: acc.totalClp,
          accountBaseId: acc.accountBaseId,
          children: []
        };
        typeNode.children.push(subtypeNode);
      } else if (parts.length >= 3) {
        // GAS.SUS.001 = Subtipo (nivel 3)
        // GAS.HIP.SEG.001 = Subtipo (nivel 3, aunque tenga 4 partes)
        const typeCode = parts.slice(0, 2).join('.');
        let typeNode = rootNode.children.find(c => c.code === typeCode);
        if (!typeNode) {
          // Crear tipo si no existe (usando nombre del mapeo o fallback genérico)
          const typeName = EXPENSE_TYPE_NAMES[typeCode] || `Tipo ${typeCode}`;
          typeNode = {
            code: typeCode,
            name: typeName,
            level: 2,
            totalClp: 0,
            children: []
          };
          rootNode.children.push(typeNode);
        }
        typeNode.totalClp += acc.totalClp;

        const subtypeNode: HierarchyNode = {
          code: acc.accountCode,
          name: acc.accountName,
          level: 3,
          totalClp: acc.totalClp,
          accountBaseId: acc.accountBaseId,
          children: []
        };
        typeNode.children.push(subtypeNode);
      }
    }
  });

  // Ordenar children por monto descendente
  [ingresosNode, gastosNode, ahorrosNode].forEach(root => {
    root.children.sort((a, b) => b.totalClp - a.totalClp);
    root.children.forEach(child => {
      child.children.sort((a, b) => b.totalClp - a.totalClp);
    });
  });

  return [ingresosNode, gastosNode, ahorrosNode];
}

/**
 * Agrupa datos mensuales jerárquicamente
 */
function buildHierarchyMonthly(monthlyData: AccountMonthlyData[]): HierarchyNodeMonthly[] {
  const rootNodes: Map<string, HierarchyNodeMonthly> = new Map();

  // Inicializar nodos raíz
  const ingresosNode: HierarchyNodeMonthly = { 
    code: 'ING', 
    name: 'Ingresos', 
    level: 1, 
    monthlyAmounts: Array(12).fill(0),
    totalClp: 0, 
    children: [] 
  };
  const gastosNode: HierarchyNodeMonthly = { 
    code: 'GAS', 
    name: 'Gastos', 
    level: 1, 
    monthlyAmounts: Array(12).fill(0),
    totalClp: 0, 
    children: [] 
  };
  const ahorrosNode: HierarchyNodeMonthly = { 
    code: 'AHO', 
    name: 'Ahorros', 
    level: 1, 
    monthlyAmounts: Array(12).fill(0),
    totalClp: 0, 
    children: [] 
  };

  rootNodes.set('ING', ingresosNode);
  rootNodes.set('GAS', gastosNode);
  rootNodes.set('AHO', ahorrosNode);

  // Procesar cada cuenta
  monthlyData.forEach(acc => {
    const parts = acc.accountCode.split('.');
    const rootPrefix = parts[0];

    const rootNode = rootNodes.get(rootPrefix);
    if (!rootNode) return;

    // Acumular montos mensuales al root
    acc.monthlyAmounts.forEach((amount, idx) => {
      rootNode.monthlyAmounts[idx] += amount;
    });
    rootNode.totalClp += acc.totalClp;

    if (rootPrefix === 'ING' || rootPrefix === 'AHO') {
      // 2 niveles
      const typeNode: HierarchyNodeMonthly = {
        code: acc.accountCode,
        name: acc.accountName,
        level: 2,
        monthlyAmounts: [...acc.monthlyAmounts],
        totalClp: acc.totalClp,
        accountBaseId: acc.accountBaseId,
        children: []
      };
      rootNode.children.push(typeNode);
    } else if (rootPrefix === 'GAS') {
      // 3+ niveles: Soporta GAS.HIP.DIV (3 partes) y GAS.HIP.SEG.001 (4 partes)
      if (parts.length === 2) {
        const typeCode = parts.slice(0, 2).join('.');
        let typeNode = rootNode.children.find(c => c.code === typeCode);
        if (!typeNode) {
          typeNode = {
            code: typeCode,
            name: acc.accountName,
            level: 2,
            monthlyAmounts: Array(12).fill(0),
            totalClp: 0,
            children: []
          };
          rootNode.children.push(typeNode);
        }
        typeNode.monthlyAmounts = typeNode.monthlyAmounts.map((v, i) => v + acc.monthlyAmounts[i]);
        typeNode.totalClp += acc.totalClp;
        
        const subtypeNode: HierarchyNodeMonthly = {
          code: acc.accountCode,
          name: acc.accountName,
          level: 3,
          monthlyAmounts: [...acc.monthlyAmounts],
          totalClp: acc.totalClp,
          accountBaseId: acc.accountBaseId,
          children: []
        };
        typeNode.children.push(subtypeNode);
      } else if (parts.length >= 3) {
        // GAS.HIP.DIV (3 partes) o GAS.HIP.SEG.001 (4 partes)
        const typeCode = parts.slice(0, 2).join('.');
        let typeNode = rootNode.children.find(c => c.code === typeCode);
        if (!typeNode) {
          // Crear tipo si no existe (usando nombre del mapeo o fallback genérico)
          const typeName = EXPENSE_TYPE_NAMES[typeCode] || `Tipo ${typeCode}`;
          typeNode = {
            code: typeCode,
            name: typeName,
            level: 2,
            monthlyAmounts: Array(12).fill(0),
            totalClp: 0,
            children: []
          };
          rootNode.children.push(typeNode);
        }
        typeNode.monthlyAmounts = typeNode.monthlyAmounts.map((v, i) => v + acc.monthlyAmounts[i]);
        typeNode.totalClp += acc.totalClp;

        const subtypeNode: HierarchyNodeMonthly = {
          code: acc.accountCode,
          name: acc.accountName,
          level: 3,
          monthlyAmounts: [...acc.monthlyAmounts],
          totalClp: acc.totalClp,
          accountBaseId: acc.accountBaseId,
          children: []
        };
        typeNode.children.push(subtypeNode);
      }
    }
  });

  // Ordenar children por monto descendente
  [ingresosNode, gastosNode, ahorrosNode].forEach(root => {
    root.children.sort((a, b) => b.totalClp - a.totalClp);
    root.children.forEach(child => {
      child.children.sort((a, b) => b.totalClp - a.totalClp);
    });
  });

  return [ingresosNode, gastosNode, ahorrosNode];
}

export function PresupuestoResumenPage() {
  const year = 2026;

  const [monthly, setMonthly] = useState<MonthlyTotal[]>([]);
  const [accounts, setAccounts] = useState<AccountTotal[]>([]);
  const [accountsMonthlyData, setAccountsMonthlyData] = useState<AccountMonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('anual');
  
  // Estado de nodos expandidos/colapsados (Set de códigos de nodos)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Cargar estado desde localStorage
    try {
      const saved = localStorage.getItem('presupuesto-resumen-expanded-nodes');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error loading expanded nodes from localStorage:', e);
    }
    // Estado inicial: grupos raíz expandidos, tipos de gasto colapsados
    return new Set(['ING', 'GAS', 'AHO']);
  });

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('presupuesto-resumen-expanded-nodes', JSON.stringify([...expandedNodes]));
    } catch (e) {
      console.warn('Error saving expanded nodes to localStorage:', e);
    }
  }, [expandedNodes]);

  // Función para expandir/colapsar un nodo
  const toggleNode = (nodeCode: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeCode)) {
        next.delete(nodeCode);
      } else {
        next.add(nodeCode);
      }
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBudgetMonthly(year),
      fetchBudgetByAccount(year),
    ])
      .then(([m, a]) => {
        setMonthly(m);
        setAccounts(a);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [year]);

  // Load monthly data for accounts when switching to mensual view
  useEffect(() => {
    if (viewMode === 'mensual' && accountsMonthlyData.length === 0 && !loadingMonthly) {
      loadMonthlyAccountData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const loadMonthlyAccountData = async () => {
    setLoadingMonthly(true);
    try {
      // 1. Primero obtener TODAS las cuentas del año (sin especificar mes)
      const allYearAccounts = await fetchBudgetByAccount(year);
      console.log('[DEBUG] Cuentas del año completo:', allYearAccounts.length, allYearAccounts);
      
      // 2. Crear un mapa con todas las cuentas, inicializadas con 0 en todos los meses
      // Usar accountCode como clave (es único y estable)
      const accountMap = new Map<string, AccountMonthlyData>();
      
      allYearAccounts.forEach(acc => {
        accountMap.set(acc.accountCode, {
          accountBaseId: acc.accountBaseId,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          monthlyAmounts: Array(12).fill(0),
          totalClp: 0,
        });
      });
      
      console.log('[DEBUG] Mapa inicial de cuentas:', accountMap.size, 'keys:', Array.from(accountMap.keys()).slice(0, 5));
      
      // 3. Obtener datos para cada mes y llenar los montos correspondientes
      const monthlyPromises = Array.from({ length: 12 }, (_, i) => 
        fetchBudgetByAccount(year, i + 1)
      );
      
      const monthlyResults = await Promise.all(monthlyPromises);
      console.log('[DEBUG] Resultados mensuales:', monthlyResults.map((m, i) => ({ month: i+1, accounts: m.length })));
      
      monthlyResults.forEach((monthData, monthIndex) => {
        monthData.forEach(acc => {
          const existing = accountMap.get(acc.accountCode);
          if (existing) {
            existing.monthlyAmounts[monthIndex] = acc.totalClp;
          }
        });
      });
      
      // 4. Recalcular totales
      accountMap.forEach(acc => {
        acc.totalClp = acc.monthlyAmounts.reduce((sum, amount) => sum + amount, 0);
      });
      
      const finalData = Array.from(accountMap.values());
      console.log('[DEBUG] Datos finales:', finalData.length, 'primeros 3:', finalData.slice(0, 3));
      setAccountsMonthlyData(finalData);
    } catch (err: any) {
      console.error('Error loading monthly account data:', err);
      setError(err.message);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Derived metrics
  const mergedAccounts = accounts;
  const mergedAccountsMonthly = accountsMonthlyData;
  const totalAnual = monthly.reduce((s, m) => s + m.totalClp, 0);
  const totalIngresos = groupByPrefix(accounts, 'ING.');
  const totalGastos = groupByPrefix(accounts, 'GAS.');
  const totalAhorros = groupByPrefix(accounts, 'AHO.');
  const savingsRate = totalIngresos > 0 ? (totalAhorros / totalIngresos) * 100 : 0;

  // Bar chart: normalize relative to max month
  const maxMonthly = Math.max(...monthly.map(m => m.totalClp), 1);
  const monthlyMap = new Map(monthly.map(m => [m.month, m]));

  const headerProps = {
    year,
    title: 'Presupuesto Anual',
  };

  if (error) {
    return (
      <MainLayout headerProps={headerProps}>
        <div className="flex items-center gap-3 p-6 bg-error-container/20 rounded-2xl text-error">
          <span className="material-symbols-outlined">error</span>
          <p className="font-semibold">Error al cargar presupuesto: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout headerProps={headerProps}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Ingresos */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-container/10 rounded-2xl text-primary-container">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Ingresos</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Ingresos Anuales</p>
          {loading ? (
            <div className="h-8 w-32 bg-surface-container-high rounded-lg animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-black tabular-nums text-navy-dark">{clp(totalIngresos)}</h3>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>{year}</span>
          </div>
        </Card>

        {/* Gastos */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary-fixed/40 rounded-2xl text-tertiary">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">Gastos</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Gastos Planificados</p>
          {loading ? (
            <div className="h-8 w-32 bg-surface-container-high rounded-lg animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-black tabular-nums text-navy-dark">{clp(totalGastos)}</h3>
          )}
          {!loading && totalIngresos > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="material-symbols-outlined text-sm">query_stats</span>
              <span>{((totalGastos / totalIngresos) * 100).toFixed(1)}% de ingresos</span>
            </div>
          )}
        </Card>

        {/* Ahorros */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-container/30 rounded-2xl text-secondary">
              <span className="material-symbols-outlined">savings</span>
            </div>
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">Ahorro</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Ahorro Proyectado</p>
          {loading ? (
            <div className="h-8 w-32 bg-surface-container-high rounded-lg animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-black tabular-nums text-navy-dark">{clp(totalAhorros)}</h3>
          )}
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">auto_graph</span>
            <span>Meta planificada</span>
          </div>
        </Card>

        {/* Tasa de ahorro */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-on-tertiary-fixed-variant/10 rounded-2xl text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined">percent</span>
            </div>
            <span className="text-[10px] font-bold text-on-tertiary-fixed-variant tracking-widest uppercase">Eficiencia</span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Tasa de Ahorro</p>
          {loading ? (
            <div className="h-8 w-20 bg-surface-container-high rounded-lg animate-pulse mt-1" />
          ) : (
            <h3 className="text-2xl font-black tabular-nums text-navy-dark">{savingsRate.toFixed(1)}%</h3>
          )}
          <div className="mt-4 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-700"
              style={{ width: `${Math.min(savingsRate, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Bar Chart: Presupuesto mensual */}
      <Card variant="hero" padding="lg" className="border border-[#F1EFE9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h4 className="text-lg font-bold text-navy-dark">Presupuesto Mensual</h4>
            <p className="text-sm text-slate-400 font-medium">Total presupuestado por mes — {year}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="material-symbols-outlined text-primary text-sm">bar_chart</span>
            <span>Total anual: {loading ? '...' : clp(totalAnual)}</span>
          </div>
        </div>

        <div className="h-[260px] w-full flex items-end justify-between gap-2 px-2">
          {MONTH_LABELS.map((label, idx) => {
            const monthNum = idx + 1;
            const data = monthlyMap.get(monthNum);
            const heightPct = data ? (data.totalClp / maxMonthly) * 100 : 0;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex flex-col justify-end h-[200px] relative">
                  {/* Tooltip */}
                  {data && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-dark text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                      {clp(data.totalClp)}
                    </div>
                  )}
                  {loading ? (
                    <div className="w-full bg-surface-container-high rounded-t-lg animate-pulse" style={{ height: `${40 + Math.random() * 40}%` }} />
                  ) : (
                    <div
                      className="w-full bg-primary-container/30 hover:bg-primary-container/60 rounded-t-lg transition-all duration-300 cursor-default"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Table: Cuentas con mayor presupuesto */}
      <Card variant="hero" padding="none" className="border border-[#F1EFE9] overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-surface-container-low">
          <div>
            <h4 className="text-lg font-bold text-navy-dark">Detalle por Cuenta</h4>
            <p className="text-sm text-slate-400 font-medium">
              {viewMode === 'anual' 
                ? 'Presupuesto anual desglosado por cuenta' 
                : 'Presupuesto mensual por cuenta'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              {loading ? '...' : `${mergedAccounts.length} cuentas`}
            </span>
            
            {/* Toggle View Mode */}
            <div className="flex items-center gap-2 bg-surface-container/30 rounded-xl p-1">
              <button
                onClick={() => setViewMode('anual')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'anual'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Anual
              </button>
              <button
                onClick={() => setViewMode('mensual')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  viewMode === 'mensual'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Mensual
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'anual' ? (
          /* Vista Anual - Tabla Jerárquica */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30">
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Cuenta</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Total Anual</th>
                  <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">% del Total</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-container-low">
                      <td className="px-8 py-4"><div className="h-4 w-40 bg-surface-container-high rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-4 w-28 bg-surface-container-high rounded animate-pulse ml-auto" /></td>
                      <td className="px-8 py-4 text-right"><div className="h-4 w-12 bg-surface-container-high rounded animate-pulse ml-auto" /></td>
                    </tr>
                  ))
                ) : (() => {
                  const hierarchy = buildHierarchy(mergedAccounts);
                  const rows: JSX.Element[] = [];
                  let rowIdx = 0;

                  // Función recursiva para renderizar nodos
                  const renderNode = (node: HierarchyNode, depth: number = 0) => {
                    const pct = totalAnual > 0 ? (node.totalClp / totalAnual) * 100 : 0;
                    const paddingLeft = depth === 0 ? '2rem' : `${1.5 + depth * 1.5}rem`;
                    const isGroupRoot = node.level === 1;
                    const isType = node.level === 2;
                    const isSubtype = node.level === 3;
                    const hasChildren = node.children.length > 0;
                    const isExpanded = expandedNodes.has(node.code);

                    const bgClass = isGroupRoot 
                      ? 'bg-surface-container-high font-bold' 
                      : rowIdx % 2 === 0 ? '' : 'bg-surface-container/10';

                    rows.push(
                      <tr
                        key={`${node.code}-${rowIdx}`}
                        className={`${bgClass} hover:bg-surface-container-low transition-colors border-b border-surface-container-low/50`}
                      >
                        <td className="px-8 py-3" style={{ paddingLeft }}>
                          <div className="flex items-center gap-2">
                            {hasChildren && (
                              <button
                                onClick={() => toggleNode(node.code)}
                                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                              >
                                <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                              </button>
                            )}
                            {!hasChildren && <span className="w-4" />}
                            <span 
                              className={`${isGroupRoot ? 'font-black text-base' : isType ? 'font-semibold' : 'font-normal'} text-navy-dark ${hasChildren ? 'cursor-pointer' : ''}`}
                              onClick={() => hasChildren && toggleNode(node.code)}
                            >
                              {isGroupRoot && (
                                <span className="mr-2">
                                  {node.code === 'ING' && '💰'}
                                  {node.code === 'GAS' && '💸'}
                                  {node.code === 'AHO' && '🏦'}
                                </span>
                              )}
                              {node.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`font-mono text-xs ${isGroupRoot ? 'font-bold text-navy-dark' : 'text-slate-400'}`}>
                            {node.code}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`tabular-nums ${isGroupRoot ? 'font-black text-base' : isType ? 'font-bold' : 'font-normal'} text-navy-dark`}>
                            {clp(node.totalClp)}
                          </span>
                        </td>
                        <td className="px-8 py-3 text-right">
                          {isGroupRoot ? (
                            <span className="text-sm font-black text-navy-dark tabular-nums">{pct.toFixed(1)}%</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${isType ? 'bg-primary-container' : 'bg-primary-container/60'} rounded-full`} 
                                  style={{ width: `${Math.min(pct * 3, 100)}%` }} 
                                />
                              </div>
                              <span className={`text-xs ${isType ? 'font-bold' : 'font-normal'} text-slate-500 tabular-nums w-10 text-right`}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );

                    rowIdx++;

                    // Renderizar children solo si el nodo está expandido
                    if (node.children.length > 0 && isExpanded) {
                      node.children.forEach(child => renderNode(child, depth + 1));
                    }
                  };

                  // Renderizar toda la jerarquía
                  hierarchy.forEach(root => renderNode(root, 0));

                  return rows;
                })()}
              </tbody>
              {!loading && (
                <tfoot>
                  <tr className="bg-navy-dark text-white">
                    <td className="px-8 py-5 font-bold text-sm uppercase tracking-widest" colSpan={2}>Total Presupuesto Anual</td>
                    <td className="px-6 py-5 text-right tabular-nums font-black text-xl">{clp(totalAnual)}</td>
                    <td className="px-8 py-5 text-right font-bold text-sm">100%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* Vista Mensual - Nueva Tabla */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-surface-container/30">
                  <th className="sticky left-0 z-10 bg-surface-container/30 px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">
                    Cuenta
                  </th>
                  <th className="px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[100px]">
                    Código
                  </th>
                  {MONTH_LABELS.map(month => (
                    <th key={month} className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right min-w-[90px]">
                      {month}
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 bg-surface-container/30 px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right min-w-[120px]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loadingMonthly ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-container-low">
                      <td className="sticky left-0 z-10 bg-white px-6 py-3">
                        <div className="h-4 w-36 bg-surface-container-high rounded animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 w-20 bg-surface-container-high rounded animate-pulse" />
                      </td>
                      {Array.from({ length: 12 }).map((_, j) => (
                        <td key={j} className="px-3 py-3 text-right">
                          <div className="h-4 w-16 bg-surface-container-high rounded animate-pulse ml-auto" />
                        </td>
                      ))}
                      <td className="sticky right-0 z-10 bg-white px-6 py-3 text-right">
                        <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : mergedAccountsMonthly.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <span className="material-symbols-outlined text-4xl text-slate-300">hourglass_empty</span>
                        <p className="text-sm text-slate-400 font-medium">Cargando datos mensuales...</p>
                      </div>
                    </td>
                  </tr>
                ) : (() => {
                  const hierarchy = buildHierarchyMonthly(mergedAccountsMonthly);
                  const rows: JSX.Element[] = [];
                  let rowIdx = 0;

                  const renderNodeMonthly = (node: HierarchyNodeMonthly, depth: number = 0) => {
                    const paddingLeft = depth === 0 ? '1.5rem' : `${1 + depth * 1.5}rem`;
                    const isGroupRoot = node.level === 1;
                    const isType = node.level === 2;
                    const isSubtype = node.level === 3;
                    const hasChildren = node.children.length > 0;
                    const isExpanded = expandedNodes.has(node.code);

                    const bgClass = isGroupRoot 
                      ? 'bg-surface-container-high font-bold' 
                      : rowIdx % 2 === 0 ? 'bg-white' : 'bg-surface-container/10';

                    rows.push(
                      <tr
                        key={`${node.code}-${rowIdx}`}
                        className={`${bgClass} hover:bg-surface-container-low transition-colors border-b border-surface-container-low/50`}
                      >
                        <td className={`sticky left-0 z-10 ${bgClass} px-6 py-3`} style={{ paddingLeft }}>
                          <div className="flex items-center gap-2">
                            {hasChildren && (
                              <button
                                onClick={() => toggleNode(node.code)}
                                className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none flex-shrink-0"
                                aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                              >
                                <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                              </button>
                            )}
                            {!hasChildren && <span className="w-4 flex-shrink-0" />}
                            <span 
                              className={`${isGroupRoot ? 'font-black text-base' : isType ? 'font-semibold' : 'font-normal'} text-navy-dark ${hasChildren ? 'cursor-pointer' : ''}`}
                              onClick={() => hasChildren && toggleNode(node.code)}
                            >
                              {isGroupRoot && (
                                <span className="mr-2">
                                  {node.code === 'ING' && '💰'}
                                  {node.code === 'GAS' && '💸'}
                                  {node.code === 'AHO' && '🏦'}
                                </span>
                              )}
                              {node.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-xs ${isGroupRoot ? 'font-bold text-navy-dark' : 'text-slate-400'}`}>
                            {node.code}
                          </span>
                        </td>
                        {node.monthlyAmounts.map((amount, monthIdx) => (
                          <td key={monthIdx} className={`px-3 py-3 text-right tabular-nums ${isGroupRoot ? 'font-bold' : 'text-xs'}`}>
                            {amount > 0 ? clp(amount) : '—'}
                          </td>
                        ))}
                        <td className={`sticky right-0 z-10 ${isGroupRoot ? 'bg-surface-container-highest' : 'bg-surface-container-highest'} px-6 py-3 text-right tabular-nums ${isGroupRoot ? 'font-black text-base' : isType ? 'font-bold' : 'font-normal'} text-navy-dark`}>
                          {clp(node.totalClp)}
                        </td>
                      </tr>
                    );

                    rowIdx++;

                    // Renderizar children solo si el nodo está expandido
                    if (node.children.length > 0 && isExpanded) {
                      node.children.forEach(child => renderNodeMonthly(child, depth + 1));
                    }
                  };

                  hierarchy.forEach(root => renderNodeMonthly(root, 0));
                  return rows;
                })()}
              </tbody>
              {!loadingMonthly && mergedAccountsMonthly.length > 0 && (
                <tfoot>
                  <tr className="bg-navy-dark text-white">
                    <td className="sticky left-0 z-10 bg-navy-dark px-6 py-5 font-bold text-sm uppercase tracking-widest" colSpan={2}>
                      Total Mensual
                    </td>
                    {Array.from({ length: 12 }).map((_, monthIdx) => {
                      const monthTotal = mergedAccountsMonthly.reduce(
                        (sum, acc) => sum + acc.monthlyAmounts[monthIdx],
                        0
                      );
                      return (
                        <td key={monthIdx} className="px-3 py-5 text-right tabular-nums font-bold text-sm">
                          {clp(monthTotal)}
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-navy-dark px-6 py-5 text-right tabular-nums font-black text-xl">
                      {clp(mergedAccountsMonthly.reduce((sum, acc) => sum + acc.totalClp, 0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>
    </MainLayout>
  );
}
