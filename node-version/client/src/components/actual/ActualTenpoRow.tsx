import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Installment {
  id: number;
  installmentNumber: number;
  baseAmountClp: number;
  dueDate: string;
  payDateEstimated: string;
  overrideInterestRate: number | null;
  overrideMonthlyAmountClp: number | null;
  finalMonthlyAmountClp: number;
  estado: 'ESTIMADO' | 'REAL';
}

interface Purchase {
  id: number;
  merchant: string;
  purchaseDate: string;
  amountTotalClp: number;
  installmentsCount: number;
  tieneInteres: boolean;
  modoMonto: 'ESTIMADO' | 'REAL';
  totalFinanciadoEstimado: number | null;
  interesTotalEstimado: number | null;
  feePct?: number | null;
  feeAmountClp?: number | null;
  financedBaseClp?: number | null;
  feeMissing?: boolean;
  scheduleMode?: 'AUTO' | 'MANUAL';
  firstDueDateOverride?: string | null;
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  installments: Installment[];
}

interface ActualTenpoRowProps {
  purchase: Purchase;
  monthInstallments: Installment[];
  monthTotal: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ActualTenpoRow({ 
  purchase, 
  monthInstallments, 
  monthTotal,
  isSelected,
  onSelect
}: ActualTenpoRowProps) {
  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  return (
    <tr style={{ backgroundColor: isSelected ? '#f3e8ff' : 'transparent' }}>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
        />
      </td>
      <td>{purchase.merchant}</td>
      <td style={{ fontSize: '0.85rem' }}>
        {purchase.category ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>{purchase.category.icon || '🏷️'}</span>
            <span style={{ color: purchase.category.color || '#4b5563', fontWeight: 500 }}>
              {purchase.category.name}
            </span>
          </div>
        ) : (
          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.8rem' }}>
            Sin categoría
          </span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>{formatDate(purchase.purchaseDate)}</td>
      <td className="monto">{formatMonto(purchase.amountTotalClp)}</td>
      <td style={{ textAlign: 'center' }}>
        {purchase.installmentsCount} cuota{purchase.installmentsCount !== 1 ? 's' : ''}
      </td>
      <td className="monto">{formatMonto(monthTotal)}</td>
      <td style={{ textAlign: 'center' }}>
        <span style={{
          fontSize: '0.75rem',
          padding: '0.125rem 0.5rem',
          borderRadius: '4px',
          fontWeight: '600',
          backgroundColor: purchase.modoMonto === 'REAL' ? '#d1fae5' : '#fef3c7',
          color: purchase.modoMonto === 'REAL' ? '#065f46' : '#78350f'
        }}>
          {purchase.modoMonto === 'REAL' ? 'CONFIRMADO' : 'ESTIMADO'}
        </span>
      </td>
      <td style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
        {monthInstallments.map(inst => `#${inst.installmentNumber}`).join(', ')}
      </td>
    </tr>
  );
}
