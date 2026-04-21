import { Card } from '../primitives';

interface Subscription {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface AnnualPlanningTableProps {
  year: number;
  subscriptions: Subscription[];
  onExport?: () => void;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  productivity: 'Productividad',
  health: 'Salud',
  gaming: 'Gaming',
  storage: 'Storage',
  education: 'Educación',
  other: 'Otro',
};

/**
 * Annual subscription planning table showing all subscriptions distributed by month
 */
export function AnnualPlanningTable({ year, subscriptions, onExport }: AnnualPlanningTableProps) {
  // Calculate monthly totals (for now showing same price every month - need backend logic for periodicity)
  const monthlyTotals = MONTHS.map(() => {
    return subscriptions.reduce((sum, sub) => sum + sub.price, 0);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border border-[#F1EFE9] overflow-hidden" padding="none">
      {/* Header */}
      <div className="p-6 bg-white/50 border-b border-[#F1EFE9] flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Planeación Anual {year}</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar
          </button>
        )}
      </div>

      {/* Table Container with horizontal scroll */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-container-low sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest sticky left-0 bg-surface-container-low z-20 min-w-[200px]">
                Servicio
              </th>
              {MONTHS.map((month) => (
                <th key={month} className="px-4 py-4 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest min-w-[100px]">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-5xl opacity-30">subscriptions</span>
                    <p className="text-sm">No hay suscripciones registradas</p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {subscriptions.map((sub, idx) => (
                  <tr key={sub.id} className={`hover:bg-slate-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-sm">{sub.name}</span>
                        <span className="text-[11px] text-slate-500">{CATEGORY_LABELS[sub.category] || sub.category}</span>
                      </div>
                    </td>
                    {MONTHS.map((month) => (
                      <td key={month} className="px-4 py-4 text-center">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatCurrency(sub.price)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-primary/5 font-bold border-t-2 border-primary/20">
                  <td className="px-6 py-4 text-sm uppercase tracking-wider text-primary sticky left-0 bg-primary/5 z-10 border-r border-primary/20">
                    Total Mensual
                  </td>
                  {monthlyTotals.map((total, idx) => (
                    <td key={idx} className="px-4 py-4 text-center">
                      <span className="text-sm font-black text-primary tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
