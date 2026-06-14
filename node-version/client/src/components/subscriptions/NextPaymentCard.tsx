import { Card } from '../primitives';

interface NextPaymentCardProps {
  serviceName: string;
  daysUntilPayment: number;
  amount: number;
}

/**
 * Card showing the next subscription payment due
 */
export function NextPaymentCard({ serviceName, daysUntilPayment, amount }: NextPaymentCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border border-[#F1EFE9] bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <span className="material-symbols-outlined text-2xl">schedule</span>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          En {daysUntilPayment} días
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          Próximo Vencimiento
        </p>
        <h3 className="text-xl font-black text-slate-900">
          {serviceName}
        </h3>
        <p className="text-2xl font-black text-primary tabular-nums">
          {formatCurrency(amount)}
        </p>
      </div>
    </Card>
  );
}
