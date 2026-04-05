import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';
import {
  fetchComparisonLines,
  fetchComparisonSummary,
  fetchActualMonthly,
  ComparisonLine,
  ComparisonSummary,
  MonthlyTotal,
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

type GroupKey = 'all' | 'ING' | 'GAS' | 'AHO';
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'ING', label: 'Ingresos' },
  { key: 'GAS', label: 'Gastos' },
  { key: 'AHO', label: 'Ahorros' },
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

export function ComparacionPage() {
  const [selectedMonth, setSelectedMonth] = useState(NOW_MONTH);
  const [group, setGroup] = useState<GroupKey>('GAS');
  const [actualMonthly, setActualMonthly] = useState<MonthlyTotal[]>([]);
  const [lines, setLines] = useState<ComparisonLine[]>([]);
  const [summary, setSummary] = useState<ComparisonSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMonth, setLoadingMonth] = useState(false);

  useEffect(() => {
    fetchActualMonthly(NOW_YEAR).then(setActualMonthly);
  }, []);

  useEffect(() => {
    setLoadingMonth(true);
    Promise.all([
      fetchComparisonLines(NOW_YEAR, selectedMonth),
      fetchComparisonSummary(NOW_YEAR, selectedMonth),
    ]).then(([l, s]) => {
      setLines(l);
      setSummary(s);
      setLoadingMonth(false);
      setLoading(false);
    });
  }, [selectedMonth]);

  const monthsWithData = actualMonthly.filter(m => m.totalClp > 0).map(m => m.month);

  const filteredLines = lines.filter(l =>
    group === 'all' ? true : l.accountCode.startsWith(group)
  );

  const sortedLines = [...filteredLines].sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));

  // For GAS % ejecucion
  const gasLines = lines.filter(l => l.accountCode.startsWith('GAS'));
  const gasBudget = gasLines.reduce((s, l) => s + l.budgetAmount, 0);
  const gasActual = gasLines.reduce((s, l) => s + l.actualAmount, 0);
  const execPct = gasBudget > 0 ? (gasActual / gasBudget) * 100 : 0;

  const headerProps = { year: NOW_YEAR };

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

      {/* KPI Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="hero" padding="lg" className="col-span-2 md:col-span-1 bg-navy-dark text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
            Gasto Real
          </p>
          <p className="text-3xl font-black tabular-nums">
            {loading ? '—' : clp(summary?.actualTotal ?? 0)}
          </p>
          <p className="text-xs mt-2 opacity-60">{MONTH_NAMES_FULL[selectedMonth - 1]} {NOW_YEAR}</p>
        </Card>

        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Presupuesto
          </p>
          <p className="text-3xl font-black tabular-nums text-navy-dark">
            {loading ? '—' : clp(summary?.budgetTotal ?? 0)}
          </p>
          <div className="mt-2 w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${execPct > 100 ? 'bg-red-400' : 'bg-primary'}`}
              style={{ width: `${Math.min(execPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{execPct.toFixed(1)}% gastos ejecutados</p>
        </Card>

        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Varianza Total
          </p>
          <p className={`text-3xl font-black tabular-nums ${(summary?.variancePercent ?? 0) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {loading ? '—' : clp(summary?.varianceTotal ?? 0)}
          </p>
          <p className={`text-xs font-bold mt-2 ${(summary?.variancePercent ?? 0) <= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {summary ? pctStr(summary.variancePercent) : '—'} vs presupuesto
          </p>
        </Card>

        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Cuentas
          </p>
          <div className="flex gap-4 mt-1">
            <div>
              <p className="text-2xl font-black text-red-500">{loading ? '—' : summary?.overBudgetCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Sobre</p>
            </div>
            <div className="w-px bg-surface-container-high" />
            <div>
              <p className="text-2xl font-black text-emerald-600">{loading ? '—' : summary?.underBudgetCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Bajo</p>
            </div>
            <div className="w-px bg-surface-container-high" />
            <div>
              <p className="text-2xl font-black text-slate-400">{loading ? '—' : summary?.onTargetCount}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ok</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Comparison table */}
      <Card variant="hero" padding="none">
        {/* Table header + group filter */}
        <div className="px-6 py-5 border-b border-surface-container-low flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-navy-dark">
              Presupuesto vs Real — {MONTH_NAMES_FULL[selectedMonth - 1]} {NOW_YEAR}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {filteredLines.length} cuentas • Ordenado por mayor desviación
            </p>
          </div>
          <div className="flex gap-1 bg-surface-container/50 rounded-xl p-1 shrink-0">
            {GROUPS.map(g => (
              <button
                key={g.key}
                onClick={() => setGroup(g.key)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all',
                  group === g.key
                    ? 'bg-white text-navy-dark shadow-sm'
                    : 'text-slate-500 hover:text-navy-dark',
                ].join(' ')}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/20">
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
                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  % vs Presup.
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ejecución
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low text-sm">
              {loadingMonth ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-4 bg-surface-container animate-pulse rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : sortedLines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
                    Sin datos para este mes
                  </td>
                </tr>
              ) : (
                sortedLines.map(line => {
                  const isOver = line.status === 'over';
                  const isOk = line.status === 'on_target';
                  const execW = line.budgetAmount > 0
                    ? Math.min((line.actualAmount / line.budgetAmount) * 100, 100)
                    : 0;
                  const isIncome = line.accountCode.startsWith('ING');
                  // For income: positive variance = good (got more than budgeted)
                  const goodVariance = isIncome ? line.variance >= 0 : line.variance <= 0;
                  return (
                    <tr key={line.accountCode} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-bold text-navy-dark text-xs">{line.accountName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{line.accountCode}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-500 text-xs">
                        {clp(line.budgetAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black tabular-nums text-navy-dark text-xs">
                        {clp(line.actualAmount)}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black tabular-nums text-xs ${goodVariance ? 'text-emerald-600' : 'text-red-500'}`}>
                        {clp(line.variance)}
                      </td>
                      <td className={`px-4 py-3.5 text-right font-black tabular-nums text-xs ${goodVariance ? 'text-emerald-600' : 'text-red-500'}`}>
                        {line.budgetAmount ? pctStr(line.variancePercent) : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOver ? 'bg-red-400' : isOk ? 'bg-slate-300' : 'bg-primary'}`}
                              style={{ width: `${execW}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold w-8 text-right tabular-nums">
                            {execW.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOver
                            ? 'bg-red-100 text-red-600'
                            : isOk
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span className="material-symbols-outlined text-[11px]">
                            {isOver ? 'arrow_upward' : isOk ? 'remove' : 'arrow_downward'}
                          </span>
                          {isOver ? 'Sobre' : isOk ? 'Ok' : 'Bajo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loadingMonth && sortedLines.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container/30 border-t-2 border-surface-container-high">
                  <td className="px-6 py-3 text-xs font-black text-navy-dark uppercase tracking-wider">
                    Total ({filteredLines.length} cuentas)
                  </td>
                  <td className="px-4 py-3 text-right font-black tabular-nums text-slate-600 text-xs">
                    {clp(filteredLines.reduce((s, l) => s + l.budgetAmount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-black tabular-nums text-navy-dark text-xs">
                    {clp(filteredLines.reduce((s, l) => s + l.actualAmount, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right font-black tabular-nums text-xs ${
                    filteredLines.reduce((s, l) => s + l.variance, 0) <= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {clp(filteredLines.reduce((s, l) => s + l.variance, 0))}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </MainLayout>
  );
}
