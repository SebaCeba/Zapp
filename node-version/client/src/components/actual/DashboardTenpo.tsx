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
  installments: Array<{
    id: number;
    installmentNumber: number;
    baseAmountClp: number;
    dueDate: string;
    payDateEstimated: string;
    overrideInterestRate: number | null;
    overrideMonthlyAmountClp: number | null;
    finalMonthlyAmountClp: number;
    estado: 'ESTIMADO' | 'REAL';
  }>;
}

interface DashboardTenpoProps {
  purchases: Purchase[];
  year: number;
  month: number;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function DashboardTenpo({ purchases, year, month }: DashboardTenpoProps) {
  const getInstallmentsForMonth = (purchase: Purchase) => {
    return purchase.installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      return dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;
    });
  };

  // Calcular estadísticas
  const totalMonth = purchases.reduce((sum, purchase) => {
    const monthInstallments = getInstallmentsForMonth(purchase);
    return sum + monthInstallments.reduce((s, inst) => s + inst.finalMonthlyAmountClp, 0);
  }, 0);

  const comprasActivas = purchases.length;

  const cuotasTotales = purchases.reduce((sum, purchase) => {
    return sum + getInstallmentsForMonth(purchase).length;
  }, 0);

  const comprasConInteres = purchases.filter(p => p.tieneInteres).length;

  const totalInteres = purchases.reduce((sum, purchase) => {
    const monthInstallments = getInstallmentsForMonth(purchase);
    if (!purchase.tieneInteres || monthInstallments.length === 0) return sum;
    
    // Calcular proporción de interés para las cuotas de este mes
    const totalCuotas = purchase.installments.length;
    const cuotasEsteMes = monthInstallments.length;
    const interesEstimado = purchase.interesTotalEstimado || 0;
    const interesProporcional = (interesEstimado / totalCuotas) * cuotasEsteMes;
    
    return sum + interesProporcional;
  }, 0);

  const comprasConfirmadas = purchases.filter(p => p.modoMonto === 'REAL').length;

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
      <div className="stat-card">
        <div className="stat-label">Total {MESES[month - 1]}</div>
        <div className="stat-value" style={{ color: '#1e40af' }}>
          ${formatMonto(totalMonth)}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
          {cuotasTotales} cuota{cuotasTotales !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Compras Activas</div>
        <div className="stat-value" style={{ color: '#059669' }}>
          {comprasActivas}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
          {comprasConInteres} con interés
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Interés del Mes</div>
        <div className="stat-value" style={{ color: '#dc2626' }}>
          ${formatMonto(totalInteres)}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
          Estimado proporcional
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-label">Estado Confirmación</div>
        <div className="stat-value" style={{ fontSize: '1.5rem' }}>
          {comprasConfirmadas}/{comprasActivas}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
          {comprasActivas > 0 
            ? `${Math.round((comprasConfirmadas / comprasActivas) * 100)}% confirmadas`
            : 'Sin compras'}
        </div>
      </div>
    </div>
  );
}
