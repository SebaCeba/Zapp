import { Card } from '../primitives';

interface MonthlyEvolutionChartProps {
  year: number;
  monthlyData: {
    month: string;
    amount: number;
  }[];
}

/**
 * Simple bar chart showing monthly subscription spending evolution
 */
export function MonthlyEvolutionChart({ year, monthlyData }: MonthlyEvolutionChartProps) {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total for the year
  const totalYear = monthlyData.reduce((sum, month) => sum + month.amount, 0);

  return (
    <Card className="border border-[#F1EFE9]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Evolución Mensual</h3>
          <p className="text-sm text-slate-500">Gasto proyectado para el {year}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">CLP Total</p>
          <p className="text-2xl font-black text-primary tabular-nums">{formatCurrency(totalYear)}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-3">
        {monthlyData.map((data) => {
          const percentage = (data.amount / maxAmount) * 100;
          
          return (
            <div key={data.month} className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase w-10">{data.month}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                  style={{ width: `${percentage}%` }}
                >
                  {data.amount > 0 && (
                    <span className="text-xs font-bold text-white tabular-nums">
                      {formatCurrency(data.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
