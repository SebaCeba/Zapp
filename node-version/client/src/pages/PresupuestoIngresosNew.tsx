import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives';
import {
  fetchBudgetByAccount,
  AccountTotal,
} from '../api/v2Api';

const NOW_YEAR = 2026;
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

interface MonthData {
  month: number;
  accounts: AccountTotal[];
  total: number;
}

export function PresupuestoIngresosPage() {
  const [annualAccounts, setAnnualAccounts] = useState<AccountTotal[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load annual data + all 12 months in parallel
    const monthCalls = Array.from({ length: 12 }, (_, i) =>
      fetchBudgetByAccount(NOW_YEAR, i + 1, 'ING')
        .then(accounts => ({
          month: i + 1,
          accounts,
          total: accounts.reduce((s, a) => s + a.totalClp, 0),
        }))
    );

    Promise.all([
      fetchBudgetByAccount(NOW_YEAR, undefined, 'ING'),
      ...monthCalls,
    ]).then(([annual, ...months]) => {
      setAnnualAccounts(annual as AccountTotal[]);
      setMonthlyData(months as MonthData[]);
      setLoading(false);
    });
  }, []);

  const totalAnual = annualAccounts.reduce((s, a) => s + a.totalClp, 0);
  const monthsWithData = monthlyData.filter(m => m.total > 0);
  const avgMensual = monthsWithData.length > 0
    ? monthsWithData.reduce((s, m) => s + m.total, 0) / monthsWithData.length
    : 0;
  const maxBar = Math.max(...monthlyData.map(m => m.total), 1);

  // Accounts to show in the table
  const activeMonth = selectedMonth !== null
    ? monthlyData.find(m => m.month === selectedMonth)
    : null;
  const tableAccounts = activeMonth ? activeMonth.accounts : annualAccounts;
  const tableTotal = tableAccounts.reduce((s, a) => s + a.totalClp, 0);
  const maxTableVal = Math.max(...tableAccounts.map(a => a.totalClp), 1);

  const headerProps = { year: NOW_YEAR };

  return (
    <MainLayout headerProps={headerProps}>
      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="hero" padding="lg" className="bg-navy-dark text-white">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
            Ingresos Anuales {NOW_YEAR}
          </p>
          {loading ? (
            <div className="h-9 w-40 bg-white/10 animate-pulse rounded-lg" />
          ) : (
            <p className="text-4xl font-black tabular-nums">{clp(totalAnual)}</p>
          )}
          <p className="text-xs opacity-50 mt-2">{annualAccounts.length} fuentes de ingreso</p>
        </Card>

        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Promedio Mensual
          </p>
          {loading ? (
            <div className="h-9 w-36 bg-surface-container animate-pulse rounded-lg" />
          ) : (
            <p className="text-4xl font-black tabular-nums text-navy-dark">{clp(avgMensual)}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">{monthsWithData.length} meses presupuestados</p>
        </Card>

        <Card variant="hero" padding="lg">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Mes Seleccionado
          </p>
          {loading ? (
            <div className="h-9 w-36 bg-surface-container animate-pulse rounded-lg" />
          ) : selectedMonth ? (
            <>
              <p className="text-4xl font-black tabular-nums text-navy-dark">
                {clp(activeMonth?.total ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-2">{MONTH_NAMES_FULL[selectedMonth - 1]}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-slate-300">—</p>
              <p className="text-xs text-slate-400 mt-2">Clic en una barra para seleccionar</p>
            </>
          )}
        </Card>
      </section>

      {/* Monthly Bar Chart */}
      <Card variant="hero" padding="lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-base font-black text-navy-dark">Ingresos por Mes</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {NOW_YEAR} — clic para filtrar la tabla
            </p>
          </div>
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-xs font-black text-primary hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              Ver anual
            </button>
          )}
        </div>

        <div className="flex items-end gap-2 h-40">
          {Array.from({ length: 12 }, (_, i) => {
            const md = monthlyData[i];
            const val = md?.total ?? 0;
            const hPct = (val / maxBar) * 100;
            const isSelected = selectedMonth === i + 1;
            const hasData = val > 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                onClick={() => hasData && setSelectedMonth(isSelected ? null : i + 1)}
              >
                <div className="w-full flex flex-col justify-end h-32">
                  {loading ? (
                    <div className="w-full bg-surface-container animate-pulse rounded-t-lg" style={{ height: '60%' }} />
                  ) : (
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        isSelected
                          ? 'bg-primary'
                          : hasData
                            ? 'bg-primary/25 group-hover:bg-primary/50'
                            : 'bg-surface-container/50'
                      }`}
                      style={{ height: `${Math.max(hPct, val > 0 ? 4 : 2)}%` }}
                    />
                  )}
                </div>
                <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                  {MONTH_NAMES[i]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Account Breakdown Table */}
      <Card variant="hero" padding="none">
        <div className="px-6 py-5 border-b border-surface-container-low flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-navy-dark">
              {selectedMonth
                ? `Ingresos — ${MONTH_NAMES_FULL[selectedMonth - 1]}`
                : `Ingresos Anuales ${NOW_YEAR}`}
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {tableAccounts.filter(a => a.totalClp > 0).length} cuentas con presupuesto
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-navy-dark">
            {loading ? '—' : clp(tableTotal)}
          </p>
        </div>

        <div className="divide-y divide-surface-container-low">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-4 bg-surface-container animate-pulse rounded-lg" />
              </div>
            ))
          ) : tableAccounts.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
              Sin datos para este período
            </div>
          ) : (
            tableAccounts
              .filter(a => a.totalClp > 0)
              .sort((a, b) => b.totalClp - a.totalClp)
              .map(account => {
                const barW = (account.totalClp / maxTableVal) * 100;
                const pct = tableTotal > 0 ? (account.totalClp / tableTotal) * 100 : 0;
                return (
                  <div key={account.accountCode} className="px-6 py-4 hover:bg-surface-container-low/40 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold text-navy-dark">{account.accountName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{account.accountCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black tabular-nums text-navy-dark">{clp(account.totalClp)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{pct.toFixed(1)}% del total</p>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </Card>
    </MainLayout>
  );
}
