import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../components/layout';
import {
  fetchBudgetByAccount,
  upsertFact,
  AccountTotal,
} from '../api/v2Api';

const NOW_YEAR = 2026;
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// matrix[accountCode][month 1..12] = amountClp
type Matrix = Record<string, Record<number, number>>;

function clp(n: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n);
}

function clpShort(n: number): string {
  if (n === 0) return 'â€”';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(n);
}

// Editable Cell component
interface EditableCellProps {
  value: number;
  accountCode: string;
  month: number;
  onSave: (accountCode: string, month: number, newValue: number) => Promise<void>;
}

function EditableCell({ value, accountCode, month, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value === 0 ? '' : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = async () => {
    const parsed = parseInt(draft.replace(/\D/g, '')) || 0;
    if (parsed === value) { setEditing(false); return; }
    setSaving(true);
    setError(false);
    try {
      await onSave(accountCode, month, parsed);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <td className="px-3 py-0 text-right">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className={`w-full text-right text-xs font-bold tabular-nums bg-primary/10 border rounded px-2 py-4 focus:outline-none focus:ring-1 focus:ring-primary ${error ? 'border-red-400' : 'border-primary/40'}`}
          disabled={saving}
          placeholder="0"
          type="text"
          inputMode="numeric"
        />
      </td>
    );
  }

  return (
    <td
      className={`px-4 py-5 text-right tabular-nums text-xs cursor-pointer group/cell transition-colors hover:bg-primary/5 ${
        value === 0 ? 'text-slate-300' : 'text-on-surface-variant'
      } ${saving ? 'opacity-40' : ''}`}
      onClick={startEdit}
      title="Clic para editar"
    >
      <span className="group-hover/cell:hidden">{clpShort(value)}</span>
      <span className="hidden group-hover/cell:inline text-primary/60">
        <span className="material-symbols-outlined text-[11px] align-middle mr-0.5">edit</span>
        {clpShort(value)}
      </span>
    </td>
  );
}

export function PresupuestoIngresosPage() {
  const [accounts, setAccounts] = useState<AccountTotal[]>([]);
  // matrix[accountCode][month] = amountClp
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [saveCount, setSaveCount] = useState(0); // tracks unsaved optimistic updates

  useEffect(() => {
    const monthCalls = Array.from({ length: 12 }, (_, i) =>
      fetchBudgetByAccount(NOW_YEAR, i + 1, 'ING').then(rows => ({ month: i + 1, rows }))
    );
    fetchBudgetByAccount(NOW_YEAR, undefined, 'ING').then(annualRows => {
      setAccounts(annualRows.filter(a => a.totalClp > 0));
    });
    Promise.all(monthCalls).then(results => {
      const m: Matrix = {};
      results.forEach(({ month, rows }) => {
        rows.forEach(row => {
          if (!m[row.accountCode]) m[row.accountCode] = {};
          m[row.accountCode][month] = row.totalClp;
        });
      });
      setMatrix(m);
      setLoading(false);
    });
  }, []);

  const getValue = (accountCode: string, month: number) =>
    matrix[accountCode]?.[month] ?? 0;

  const getRowTotal = (accountCode: string) =>
    Array.from({ length: 12 }, (_, i) => getValue(accountCode, i + 1))
      .reduce((s, v) => s + v, 0);

  const getColTotal = (month: number) =>
    accounts.reduce((s, a) => s + getValue(a.accountCode, month), 0);

  const grandTotal = accounts.reduce((s, a) => s + getRowTotal(a.accountCode), 0);

  const maxCol = Math.max(...Array.from({ length: 12 }, (_, i) => getColTotal(i + 1)), 1);

  const handleSave = async (accountCode: string, month: number, newValue: number) => {
    // Optimistic update
    setMatrix(prev => ({
      ...prev,
      [accountCode]: { ...(prev[accountCode] ?? {}), [month]: newValue },
    }));
    setSaveCount(c => c + 1);
    try {
      await upsertFact({
        scenario: 'BUDGET',
        year: NOW_YEAR,
        month,
        accountCode,
        amountClp: newValue,
      });
    } catch (err) {
      // Rollback no es necesario ya que el error se muestra en la celda
      throw err;
    } finally {
      setSaveCount(c => c - 1);
    }
  };

  const headerProps = { year: NOW_YEAR };

  return (
    <MainLayout headerProps={headerProps}>
      {/* Page title row */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">
            PRESUPUESTO {NOW_YEAR}
          </p>
          <h1 className="text-3xl font-black text-navy-dark tracking-tight">
            Planificador de Ingresos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saveCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary animate-pulse">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              Guardandoâ€¦
            </span>
          )}
          {saveCount === 0 && !loading && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="material-symbols-outlined text-[14px]">cloud_done</span>
              Al dÃ­a
            </span>
          )}
        </div>
      </div>

      {/* Insights row */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Seasonality chart */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-surface-container-high">
            <h4 className="text-sm font-black text-navy-dark mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">trending_up</span>
              Estacionalidad Mensual
            </h4>
            <p className="text-xs text-slate-400 mb-5">Distribución de ingresos presupuestados por mes</p>
            <div className="flex items-end gap-2 h-24">
              {Array.from({ length: 12 }, (_, i) => {
                const val = getColTotal(i + 1);
                const hPct = (val / maxCol) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end h-20">
                      <div
                        className="w-full rounded-t-lg bg-secondary-container hover:bg-primary/40 transition-all"
                        style={{ height: `${Math.max(hPct, val > 0 ? 6 : 2)}%` }}
                        title={clpShort(val)}
                      />
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-400">{MONTHS[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-secondary-fixed p-6 rounded-2xl flex flex-col justify-between">
            <div className="w-12 h-12 bg-white/40 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary-container text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <div>
              <h4 className="text-on-secondary-fixed font-black text-base mb-2">
                Total {NOW_YEAR}
              </h4>
              <p className="text-3xl font-black tabular-nums text-navy-dark mb-1">
                {clp(grandTotal)}
              </p>
              <p className="text-xs text-on-secondary-fixed-variant">
                {accounts.length} fuentes · prom. {clp(Math.round(grandTotal / 12))}/mes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-surface-container-high">
        <table className="w-full text-left border-collapse" style={{ minWidth: '1100px' }}>
          <thead>
            <tr className="bg-surface-container-low">
              <th className="py-5 px-6 text-xs font-black text-on-surface-variant uppercase tracking-widest w-56 sticky left-0 bg-surface-container-low z-10">
                Tipo de Ingreso
              </th>
              {MONTHS.map(m => (
                <th key={m} className="py-5 px-4 text-xs font-black text-on-surface-variant uppercase tracking-widest text-right">
                  {m}
                </th>
              ))}
              <th className="py-5 px-6 text-xs font-black text-primary uppercase tracking-widest text-right bg-secondary-container/20">
                Total Anual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="py-5 px-6 sticky left-0 bg-white">
                    <div className="h-4 w-32 bg-surface-container animate-pulse rounded" />
                  </td>
                  {Array.from({ length: 13 }).map((__, j) => (
                    <td key={j} className="py-5 px-4">
                      <div className="h-4 w-16 bg-surface-container animate-pulse rounded ml-auto" />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              accounts.map(account => (
                <tr key={account.accountCode} className="hover:bg-brand-atelier-bg transition-colors group">
                  <td className="py-5 px-6 sticky left-0 bg-white group-hover:bg-brand-atelier-bg transition-colors z-10">
                    <p className="font-semibold text-sm text-on-surface">{account.accountName}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{account.accountCode}</p>
                  </td>
                  {Array.from({ length: 12 }, (_, i) => (
                    <EditableCell
                      key={i + 1}
                      value={getValue(account.accountCode, i + 1)}
                      accountCode={account.accountCode}
                      month={i + 1}
                      onSave={handleSave}
                    />
                  ))}
                  <td className="py-5 px-6 text-right font-bold tabular-nums text-on-surface text-sm bg-secondary-container/10">
                    {clpShort(getRowTotal(account.accountCode))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && (
            <tfoot>
              <tr className="bg-primary-container text-on-primary-container">
                <td className="py-6 px-6 font-black uppercase tracking-widest text-sm sticky left-0 bg-primary-container z-10">
                  Total Ingresos
                </td>
                {Array.from({ length: 12 }, (_, i) => (
                  <td key={i} className="py-6 px-4 text-right font-bold tabular-nums text-sm">
                    {clpShort(getColTotal(i + 1))}
                  </td>
                ))}
                <td className="py-6 px-6 text-right text-lg font-black tabular-nums bg-on-primary-fixed/20">
                  {clp(grandTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-[11px] text-slate-400 font-medium -mt-2">
        <span className="material-symbols-outlined text-[12px] align-middle mr-1">edit</span>
        Clic en cualquier celda para editar - Enter para confirmar - Esc para cancelar
      </p>
    </MainLayout>
  );
}
