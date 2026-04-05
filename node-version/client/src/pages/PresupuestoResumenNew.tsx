import { MainLayout } from '../components/layout';
import { Card, Badge } from '../components/primitives';

interface MonthData {
  month: string;
  enero: string;
  febrero: string;
  marzo: string;
  anualEst: string;
  estado: 'estable' | 'variante' | 'fijo' | 'critico' | 'ocasional';
}

const monthlyData: MonthData[] = [
  {
    month: 'Ingresos Totales',
    enero: '$10,400',
    febrero: '$10,400',
    marzo: '$10,400',
    anualEst: '$124,800',
    estado: 'estable',
  },
  {
    month: 'Servicios Básicos',
    enero: '$450.00',
    febrero: '$482.00',
    marzo: '$440.00',
    anualEst: '$5,400.00',
    estado: 'variante',
  },
  {
    month: 'Suscripciones',
    enero: '$120.00',
    febrero: '$120.00',
    marzo: '$120.00',
    anualEst: '$1,440.00',
    estado: 'fijo',
  },
  {
    month: 'Gastos Flexibles',
    enero: '$1,200.00',
    febrero: '$1,550.00',
    marzo: '$1,100.00',
    anualEst: '$15,000.00',
    estado: 'critico',
  },
  {
    month: 'Mantenimiento',
    enero: '$0.00',
    febrero: '$250.00',
    marzo: '$0.00',
    anualEst: '$2,000.00',
    estado: 'ocasional',
  },
];

const estadoBadgeVariant = {
  estable: 'success' as const,
  variante: 'warning' as const,
  fijo: 'neutral' as const,
  critico: 'error' as const,
  ocasional: 'neutral' as const,
};

export function PresupuestoResumenPage() {
  const headerProps = {
    year: 2026,
    title: 'Annual Budget Overview',
  };

  return (
    <MainLayout headerProps={headerProps}>
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Annual Income */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-primary-container/10 rounded-2xl text-primary-container">
              <span className="material-symbols-outlined">payments</span>
            </div>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
              Target
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Annual Income</p>
          <h3 className="text-2xl font-black tabular-nums text-navy-dark">$124,500.00</h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>+4.2% vs 2025</span>
          </div>
        </Card>

        {/* Card 2: Planned Expenses */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-tertiary-fixed/40 rounded-2xl text-tertiary">
              <span className="material-symbols-outlined">shopping_bag</span>
            </div>
            <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">
              Budgeted
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Planned Expenses</p>
          <h3 className="text-2xl font-black tabular-nums text-navy-dark">$82,300.00</h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="material-symbols-outlined text-sm">query_stats</span>
            <span>66% of income</span>
          </div>
        </Card>

        {/* Card 3: Projected Savings */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-secondary-container/30 rounded-2xl text-secondary">
              <span className="material-symbols-outlined">savings</span>
            </div>
            <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">
              Estimate
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Projected Savings</p>
          <h3 className="text-2xl font-black tabular-nums text-navy-dark">$42,200.00</h3>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <span className="material-symbols-outlined text-sm">auto_graph</span>
            <span>On track</span>
          </div>
        </Card>

        {/* Card 4: Savings Rate */}
        <Card variant="rounded" padding="md" className="hover:shadow-md transition-shadow border border-[#F1EFE9]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-on-tertiary-fixed-variant/10 rounded-2xl text-on-tertiary-fixed-variant">
              <span className="material-symbols-outlined">percent</span>
            </div>
            <span className="text-[10px] font-bold text-on-tertiary-fixed-variant tracking-widest uppercase">
              Efficiency
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Savings Rate</p>
          <h3 className="text-2xl font-black tabular-nums text-navy-dark">33.9%</h3>
          <div className="mt-4 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="w-[33.9%] h-full bg-primary-container"></div>
          </div>
        </Card>
      </div>

      {/* Main Chart: Budget Trajectory */}
      <Card variant="hero" padding="lg" className="border border-[#F1EFE9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h4 className="text-lg font-bold text-navy-dark">Budget Trajectory</h4>
            <p className="text-sm text-slate-400 font-medium">
              Comparison of Planned vs Actual growth over 2026
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary-container"></span>
              <span className="text-xs font-semibold text-slate-600">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-outline-variant"></span>
              <span className="text-xs font-semibold text-slate-600">Actual</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full flex items-end justify-between gap-4 px-2">
          {/* Chart Bars */}
          {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'].map(
            (month, idx) => {
              const heights = [60, 65, 70, 72, 75, 78, 80, 82, 85, 88, 92, 95];
              const actuals = [85, 90, 75, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              const isActual = idx < 3;
              
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-3">
                  <div className="w-full flex flex-col justify-end gap-1 h-[200px]">
                    <div
                      className={`w-full bg-primary-container/20 rounded-lg relative overflow-hidden group ${
                        !isActual ? 'opacity-50' : ''
                      }`}
                      style={{ height: `${heights[idx]}%` }}
                    >
                      {isActual && (
                        <div
                          className="absolute bottom-0 w-full bg-primary-container rounded-t-lg transition-all hover:brightness-110"
                          style={{ height: `${actuals[idx]}%` }}
                        ></div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {month}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </Card>

      {/* Detailed Table Section */}
      <Card variant="hero" padding="none" className="border border-[#F1EFE9] overflow-hidden">
        <div className="p-8 flex items-center justify-between border-b border-surface-container-low">
          <div>
            <h4 className="text-lg font-bold text-navy-dark">Monthly Breakdown</h4>
            <p className="text-sm text-slate-400 font-medium">
              Comparative analysis of monthly category performance
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-surface-container hover:bg-surface-container-high text-secondary font-bold text-sm rounded-xl transition-all">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/30">
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Categoría
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Enero
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Febrero
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Marzo
                </th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Anual Est.
                </th>
                <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {monthlyData.map((row, idx) => (
                <tr
                  key={idx}
                  className={`${
                    idx % 2 === 0 ? '' : 'bg-surface-container/10'
                  } hover:bg-surface-container-low transition-colors`}
                >
                  <td className="px-8 py-4 font-bold text-navy-dark">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        {idx === 0 ? 'payments' : idx === 1 ? 'lightbulb' : idx === 2 ? 'subscriptions' : idx === 3 ? 'shopping_cart' : 'home_repair_service'}
                      </span>
                      <span>{row.month}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold text-slate-600">
                    {row.enero}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold text-slate-600">
                    {row.febrero}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-semibold text-slate-600">
                    {row.marzo}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums font-bold text-navy-dark">
                    {row.anualEst}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <Badge variant={estadoBadgeVariant[row.estado]} size="md">
                      {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-navy-dark text-white">
                <td className="px-8 py-5 font-bold text-sm uppercase tracking-widest">
                  Balance Neto
                </td>
                <td className="px-6 py-5 text-right tabular-nums font-bold text-base">$8,630</td>
                <td className="px-6 py-5 text-right tabular-nums font-bold text-base">$7,998</td>
                <td className="px-6 py-5 text-right tabular-nums font-bold text-base">$8,740</td>
                <td className="px-6 py-5 text-right tabular-nums font-black text-xl">$100,920</td>
                <td className="px-8 py-5 text-right">
                  <Badge className="bg-white/20 text-white" size="md">Superávit</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </MainLayout>
  );
}
