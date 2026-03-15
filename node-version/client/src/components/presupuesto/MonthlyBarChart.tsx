import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { Panel } from 'rsuite';

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
  category?: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  installments: Installment[];
}

interface MonthlyBarChartProps {
  purchases: Purchase[];
  selectedYear: number;
  selectedMonth: number | null;
  onSelectMonth: (month: number | null) => void;
}

interface MonthData {
  month: string;
  monthIndex: number;
  total: number;
}

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function MonthlyBarChart({
  purchases,
  selectedYear,
  selectedMonth,
  onSelectMonth
}: MonthlyBarChartProps) {

  // Procesar datos: una barra simple por mes
  const chartData = useMemo(() => {
    // Inicializar 12 meses
    const monthsData: MonthData[] = MESES_SHORT.map((mes, idx) => ({
      month: mes,
      monthIndex: idx + 1,
      total: 0
    }));

    // Acumular cuotas del año seleccionado por mes
    purchases.forEach(purchase => {
      purchase.installments.forEach(inst => {
        const dueDate = new Date(inst.dueDate);
        if (dueDate.getFullYear() === selectedYear) {
          const monthIdx = dueDate.getMonth(); // 0-11
          monthsData[monthIdx].total += inst.finalMonthlyAmountClp;
        }
      });
    });

    return monthsData;
  }, [purchases, selectedYear]);

  const formatCurrency = (amount: number) => {
    return '$' + new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount));
  };

  const formatK = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const handleBarClick = (data: any) => {
    if (!data || !data.activePayload) return;

    const monthData = data.activePayload[0]?.payload;
    if (!monthData) return;

    const clickedMonth = monthData.monthIndex;
    
    if (selectedMonth === clickedMonth) {
      // Deseleccionar
      onSelectMonth(null);
    } else {
      // Seleccionar mes
      onSelectMonth(clickedMonth);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const total = data.total;

    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '0.75rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
          {data.month} {selectedYear}
        </div>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: '500',
          color: '#111827'
        }}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    );
  };

  return (
    <Panel 
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '1rem' }}>📊 Proyección Mensual {selectedYear}</span>
        </div>
      }
      bordered
      style={{ marginBottom: '1.5rem' }}
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart 
          data={chartData}
          onClick={handleBarClick}
          margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#d1d5db"
          />
          <YAxis 
            tickFormatter={formatK}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            stroke="#d1d5db"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
          <Bar 
            dataKey="total" 
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => {
              const isSelected = selectedMonth === entry.monthIndex;
              const fillColor = isSelected ? '#3b82f6' : '#6366f1';
              const opacity = selectedMonth && !isSelected ? 0.3 : 1;

              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={fillColor}
                  opacity={opacity}
                  stroke={isSelected ? '#1e40af' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                  cursor="pointer"
                />
              );
            })}
            <LabelList 
              dataKey="total" 
              position="top" 
              formatter={(value: number) => value > 0 ? formatK(value) : ''}
              style={{ fontSize: '12px', fill: '#6B7280', fontWeight: 400 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
