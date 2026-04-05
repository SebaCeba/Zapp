import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';
import {
  fetchBudgetMonthly,
  fetchBudgetByAccount,
  fetchActualByAccount,
  fetchComparisonSummary,
  MonthlyTotal,
  AccountTotal,
  ComparisonSummary,
} from '../api/v2Api';

const NOW_YEAR = 2026;
const NOW_MONTH = 3; // Marzo 2026 (último mes con datos actuales)
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function clp(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n);
}

function pct(a: number, b: number): string {
  if (!b) return '—';
  return `${((a / b) * 100).toFixed(1)}%`;
}

export function HomePage() {
  const [budgetMonthly, setBudgetMonthly] = useState<MonthlyTotal[]>([]);
  const [budgetAccounts, setBudgetAccounts] = useState<AccountTotal[]>([]);
  const [actualAccounts, setActualAccounts] = useState<AccountTotal[]>([]);
  const [comparison, setComparison] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBudgetMonthly(NOW_YEAR),
      fetchBudgetByAccount(NOW_YEAR, NOW_MONTH),
      fetchActualByAccount(NOW_YEAR, NOW_MONTH),
      fetchComparisonSummary(NOW_YEAR, NOW_MONTH),
    ]).then(([bm, ba, aa, cmp]) => {
      setBudgetMonthly(bm);
      setBudgetAccounts(ba);
      setActualAccounts(aa);
      setComparison(cmp);
    }).finally(() => setLoading(false));
  }, []);

  // KPIs del mes actual
  const budgetMes = budgetAccounts.filter(a => a.accountCode.startsWith('GAS.')).reduce((s, a) => s + a.totalClp, 0);
  const actualMes = actualAccounts.filter(a => a.accountCode.startsWith('GAS.')).reduce((s, a) => s + a.totalClp, 0);
  const ingresosBudget = budgetAccounts.filter(a => a.accountCode.startsWith('ING.')).reduce((s, a) => s + a.totalClp, 0);
  const ahorrosBudget = budgetAccounts.filter(a => a.accountCode.startsWith('AHO.')).reduce((s, a) => s + a.totalClp, 0);

  // Top gastos del mes (actual)
  const topCuentas = actualAccounts
    .filter(a => a.accountCode.startsWith('GAS.') && a.totalClp > 0)
    .sort((a, b) => b.totalClp - a.totalClp)
    .slice(0, 5);

  // Barra mensual
  const maxMonthly = Math.max(...budgetMonthly.map(m => m.totalClp), 1);

  const headerProps = { year: NOW_YEAR, title: 'Dashboard' };

  return (
    <MainLayout headerProps={headerProps}>
      {/* ── Hero: Presupuesto vs Actual del mes ─────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="lg:col-span-2 bg-primary text-white p-8 rounded-[32px] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">
              {MONTH_NAMES[NOW_MONTH - 1]} {NOW_YEAR}
            </p>
            {loading ? (
              <div className="h-14 w-48 bg-white/20 rounded-xl animate-pulse mt-1" />
            ) : (
              <h2 className="text-5xl font-black tabular-nums tracking-tight">
                {clp(actualMes)}
              </h2>
            )}
            <p className="text-xs opacity-60 mt-1 mb-6">Gasto real del mes</p>

            <div className="flex items-center gap-4 flex-wrap">
              {comparison && !loading && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur ${
                  comparison.varianceTotal <= 0
                    ? 'bg-emerald-400/30 text-emerald-100'
                    : 'bg-red-400/30 text-red-100'
                }`}>
                  <span className="material-symbols-outlined text-sm">
                    {comparison.varianceTotal <= 0 ? 'trending_down' : 'trending_up'}
                  </span>
                  <span>
                    {comparison.varianceTotal <= 0 ? 'Bajo presupuesto' : 'Sobre presupuesto'}{' '}
                    {Math.abs(comparison.variancePercent).toFixed(1)}%
                  </span>
                </div>
              )}
              {!loading && (
                <p className="text-xs opacity-60">
                  Presupuestado: {clp(budgetMes)}
                </p>
              )}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 transform translate-x-12 translate-y-4">
            <span className="material-symbols-outlined text-[12rem]">account_balance_wallet</span>
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos</p>
              {loading
                ? <div className="h-5 w-20 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className="text-base font-black tabular-nums text-navy-dark">{clp(ingresosBudget)}</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ahorro</p>
              {loading
                ? <div className="h-5 w-20 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className="text-base font-black tabular-nums text-navy-dark">{clp(ahorrosBudget)}</p>}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div className="w-10 h-10 bg-error/10 text-error rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sobre</p>
              {loading
                ? <div className="h-5 w-10 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className="text-base font-black tabular-nums text-error">{comparison?.overBudgetCount ?? '—'}</p>}
              <p className="text-[10px] text-slate-400">cuentas</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 flex flex-col justify-between shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bajo</p>
              {loading
                ? <div className="h-5 w-10 bg-slate-100 rounded animate-pulse mt-1" />
                : <p className="text-base font-black tabular-nums text-emerald-600">{comparison?.underBudgetCount ?? '—'}</p>}
              <p className="text-[10px] text-slate-400">cuentas</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento: Top gastos + Evolución anual ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Top gastos del mes */}
        <Card className="md:col-span-5" variant="hero" padding="lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-navy-dark">Top gastos — {MONTH_NAMES[NOW_MONTH - 1]}</h3>
            <Link to="/actual" className="text-xs font-bold text-primary hover:underline">Ver todo</Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 bg-surface-container-high rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topCuentas.map(cuenta => {
                const budgetCuenta = budgetAccounts.find(b => b.accountCode === cuenta.accountCode);
                const budgetAmt = budgetCuenta?.totalClp ?? 0;
                const usedPct = budgetAmt > 0 ? Math.min((cuenta.totalClp / budgetAmt) * 100, 100) : 100;
                const isOver = budgetAmt > 0 && cuenta.totalClp > budgetAmt;
                return (
                  <div key={cuenta.accountBaseId} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium truncate pr-2">{cuenta.accountName}</span>
                      <span className={`tabular-nums font-bold shrink-0 ${isOver ? 'text-error' : 'text-navy-dark'}`}>
                        {clp(cuenta.totalClp)}
                        {budgetAmt > 0 && (
                          <span className="text-slate-400 font-normal"> / {clp(budgetAmt)}</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-error' : 'bg-primary-container'}`}
                        style={{ width: `${usedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && comparison && (
            <div className="mt-6 pt-5 border-t border-surface-container-low flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Varianza total</p>
                <p className={`text-xl font-black tabular-nums ${comparison.varianceTotal <= 0 ? 'text-emerald-600' : 'text-error'}`}>
                  {comparison.varianceTotal <= 0 ? '' : '+'}{clp(comparison.varianceTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Ejecución</p>
                <p className="text-xl font-black tabular-nums text-navy-dark">
                  {pct(actualMes, budgetMes)}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Evolución mensual */}
        <Card className="md:col-span-7" variant="hero" padding="lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-navy-dark">Presupuesto mensual {NOW_YEAR}</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Total presupuestado por mes</p>
            </div>
            <Link to="/presupuesto" className="text-xs font-bold text-primary hover:underline">Ver detalle</Link>
          </div>

          <div className="h-[200px] w-full flex items-end justify-between gap-1.5 px-1">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthNum = idx + 1;
              const data = budgetMonthly.find(m => m.month === monthNum);
              const heightPct = data ? (data.totalClp / maxMonthly) * 100 : 0;
              const isCurrent = monthNum === NOW_MONTH;
              const isPast = monthNum < NOW_MONTH;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex flex-col justify-end h-[160px] relative">
                    {data && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-navy-dark text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                        {clp(data.totalClp)}
                      </div>
                    )}
                    {loading ? (
                      <div className="w-full bg-surface-container-high rounded-t-lg animate-pulse" style={{ height: '60%' }} />
                    ) : (
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isCurrent
                            ? 'bg-primary'
                            : isPast
                            ? 'bg-primary-container/60 hover:bg-primary-container'
                            : 'bg-surface-container-high hover:bg-surface-container-highest'
                        }`}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-tighter ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>
                    {['E','F','M','A','M','J','J','A','S','O','N','D'][idx]}
                  </span>
                </div>
              );
            })}
          </div>

          {!loading && (
            <div className="mt-5 pt-4 border-t border-surface-container-low flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Total anual presupuestado</span>
              <span className="font-black tabular-nums text-navy-dark text-lg">
                {clp(budgetMonthly.reduce((s, m) => s + m.totalClp, 0))}
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick Links ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/presupuesto" className="bg-white hover:shadow-md transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm group">
          <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ver</p>
            <p className="text-sm font-bold text-navy-dark">Presupuesto</p>
          </div>
        </Link>

        <Link to="/actual" className="bg-white hover:shadow-md transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm group">
          <div className="w-11 h-11 bg-tertiary/10 text-tertiary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ver</p>
            <p className="text-sm font-bold text-navy-dark">Actual</p>
          </div>
        </Link>

        <Link to="/ahorros" className="bg-white hover:shadow-md transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm group">
          <div className="w-11 h-11 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">savings</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ver</p>
            <p className="text-sm font-bold text-navy-dark">Ahorros</p>
          </div>
        </Link>

        <Link to="/creditos" className="bg-white hover:shadow-md transition-all p-5 rounded-2xl flex items-center gap-4 shadow-sm group">
          <div className="w-11 h-11 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">credit_card</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ver</p>
            <p className="text-sm font-bold text-navy-dark">Créditos</p>
          </div>
        </Link>
      </section>
    </MainLayout>
  );
}
