import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';
import {
  fetchActualMonthly,
  fetchComparisonLines,
  fetchComparisonSummary,
  MonthlyTotal,
  ComparisonLine,
  ComparisonSummary,
} from '../api/v2Api';

const NOW_YEAR = 2026;
const NOW_MONTH = 3;
const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function clp(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n);
}

function pctStr(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export function ActualPage() {
  const [selectedMonth, setSelectedMonth] = useState(NOW_MONTH);
  const [actualMonthly, setActualMonthly] = useState<MonthlyTotal[]>([]);
  const [compLines, setCompLines] = useState<ComparisonLine[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Load annual monthly chart once
  useEffect(() => {
    fetchActualMonthly(NOW_YEAR).then(setActualMonthly);
  }, []);

  // Load month-specific data when month changes
  useEffect(() => {
    setLoadingMonth(true);
    Promise.all([
      fetchComparisonLines(NOW_YEAR, selectedMonth),
      fetchComparisonSummary(NOW_YEAR, selectedMonth),
    ]).then(([lines, sum]) => {
      setCompLines(lines);
      setSummary(sum);
      setLoadingMonth(false);
      setLoading(false);
    });
  }, [selectedMonth]);

  // Months with actual data (where actualMonthly has totalClp > 0)
  const monthsWithData = actualMonthly
    .filter(m => m.totalClp > 0)
    .map(m => m.month);

  const maxBar = Math.max(...actualMonthly.map(m => m.totalClp), 1);

  // GAS accounts only for % ejecución
  const execPct = summary && summary.budgetTotal > 0
    ? (summary.actualTotal / summary.budgetTotal) * 100
    : 0;

  const gasLines = compLines.filter(l => l.accountCode.startsWith('GAS'));
  const headerProps = {
    year: NOW_YEAR,
  };


  return (
    <MainLayout headerProps={headerProps}>
      {/* Month selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const hasData = monthsWithData.includes(m);
          const isSelected = m === selectedMonth;
          return (
            <button
              key={m}
              disabled={!hasData}
              onClick={() => setSelectedMonth(m)}
              className={[
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0',
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : hasData
                    ? 'bg-surface-container text-navy-dark hover:bg-surface-container-high'
                    : 'bg-surface-container/40 text-slate-300 cursor-not-allowed',
              ].join(' ')}
            >
              {MONTH_NAMES[m - 1]}
            </button>
          );
        })}
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gasto Real */}
        <Card variant="hero" padding="lg" className="col-span-2 md:col-span-1 bg-navy-dark text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
            Gasto Real
          </p>
          <p className="text-3xl font-black tabular-nums">
            {loading ? '—' : clp(summary?.actualTotal ?? 0)}
          </p>
          <p className="text-xs mt-2 opacity-60">
            {MONTH_NAMES_FULL[selectedMonth - 1]} {NOW_YEAR}
          </p>
        </Card>

        {/* Presupuesto */}
        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Presupuesto
          </p>
          <p className="text-3xl font-black tabular-nums text-navy-dark">
            {loading ? '—' : clp(summary?.budgetTotal ?? 0)}
          </p>
          <div className="mt-2 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${execPct > 100 ? 'bg-error' : 'bg-primary'}`}
              style={{ width: `${Math.min(execPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{execPct.toFixed(1)}% ejecutado</p>
        </Card>

        {/* Varianza */}
        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Varianza
          </p>
          <p className={`text-3xl font-black tabular-nums ${(summary?.variancePercent ?? 0) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {loading ? '—' : clp(summary?.varianceTotal ?? 0)}
          </p>
          <p className={`text-xs font-bold mt-2 ${(summary?.variancePercent ?? 0) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {summary ? pctStr(summary.variancePercent) : '—'} vs presupuesto
          </p>
        </Card>

        {/* Sobre/Bajo presupuesto */}
        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Cuentas
          </p>
          <div className="flex gap-4 mt-1">
            <div>
              <p className="text-2xl font-black text-red-500">{summary?.overBudgetCount ?? '—'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sobre</p>
            </div>
            <div className="w-px bg-surface-container-high" />
            <div>
              <p className="text-2xl font-black text-emerald-600">{summary?.underBudgetCount ?? '—'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Bajo</p>
            </div>
            <div className="w-px bg-surface-container-high" />
            <div>
              <p className="text-2xl font-black text-slate-400">{summary?.onTargetCount ?? '—'}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ok</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Main content: chart + table */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly bar chart */}
        <Card variant="hero" padding="lg" className="lg:col-span-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Evolución anual {NOW_YEAR}
          </p>
          <div className="flex items-end gap-1 h-36">
            {Array.from({ length: 12 }, (_, i) => {
              const m = actualMonthly.find(x => x.month === i + 1);
              const val = m?.totalClp ?? 0;
              const heightPct = (val / maxBar) * 100;
              const isCurrent = i + 1 === selectedMonth;
              const hasDat = val > 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                  onClick={() => hasDat && setSelectedMonth(i + 1)}
                >
                  <div className="w-full flex flex-col justify-end h-32">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isCurrent
                          ? 'bg-primary'
                          : hasDat
                            ? 'bg-primary/30 group-hover:bg-primary/50'
                            : 'bg-surface-container'
                      }`}
                      style={{ height: `${heightPct}%`, minHeight: val > 0 ? '4px' : '2px' }}
                    />
                  </div>
                  <span className={`text-[8px] font-black uppercase ${isCurrent ? 'text-primary' : 'text-slate-400'}`}>
                    {MONTH_NAMES[i]}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-3 pt-3 border-t border-surface-container-low">
            Clic en una barra para ver ese mes
          </p>
        </Card>

        {/* Comparison table */}
        <Card variant="hero" padding="none" className="lg:col-span-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-container-low flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-navy-dark">
                Presupuesto vs Real — {MONTH_NAMES_FULL[selectedMonth - 1]}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Solo gastos (GAS.*)
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30">
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Cuenta
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Presupuesto
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Real
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                    Varianza
                  </th>
                  <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low text-sm">
                {loadingMonth ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-surface-container animate-pulse rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : gasLines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm font-medium">
                      Sin datos para este mes
                    </td>
                  </tr>
                ) : (
                  gasLines
                    .sort((a, b) => b.actualAmount - a.actualAmount)
                    .map(line => {
                      const isOver = line.status === 'over';
                      const execW = line.budgetAmount > 0
                        ? Math.min((line.actualAmount / line.budgetAmount) * 100, 100)
                        : 0;
                      return (
                        <tr key={line.accountCode} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-bold text-navy-dark text-xs">{line.accountName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{line.accountCode}</p>
                            <div className="mt-1 w-full h-1 bg-surface-container rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isOver ? 'bg-red-400' : 'bg-primary/60'}`}
                                style={{ width: `${execW}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-500 text-xs">
                            {clp(line.budgetAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-black tabular-nums text-navy-dark text-xs">
                            {clp(line.actualAmount)}
                          </td>
                          <td className={`px-4 py-3 text-right font-black tabular-nums text-xs ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>
                            {clp(line.variance)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isOver
                                ? 'bg-red-100 text-red-600'
                                : line.status === 'on_target'
                                  ? 'bg-slate-100 text-slate-500'
                                  : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              <span className="material-symbols-outlined text-[12px]">
                                {isOver ? 'arrow_upward' : line.status === 'on_target' ? 'remove' : 'arrow_downward'}
                              </span>
                              {isOver ? 'Sobre' : line.status === 'on_target' ? 'Ok' : 'Bajo'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </MainLayout>
  );
}
