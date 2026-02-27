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
import { Panel, Button, Stack } from 'rsuite';

// Re-using interfaces locally since they are not exported from a common type file yet
// ideally this should be in types.ts
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

interface CategoryBarChartProps {
  purchases: Purchase[];
  selectedYear: number;
  selectedMonth: number;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

interface CategoryBarData {
  name: string;
  total: number;
  color: string;
}

export default function CategoryBarChart({
  purchases,
  selectedYear,
  selectedMonth,
  selectedCategory,
  onSelectCategory
}: CategoryBarChartProps) {

  const data = useMemo(() => {
    const map = new Map<string, CategoryBarData>();

    purchases.forEach(purchase => {
      // 1. Filtrar cuotas del mes
      const monthInstallments = purchase.installments.filter(inst => {
        const dueDate = new Date(inst.dueDate);
        // Ajuste de zona horaria si fuera necesario, pero asumiendo fecha local/ISO simple
        // Ojo: getMonth() es 0-11, selectedMonth es 1-12
        return dueDate.getFullYear() === selectedYear && (dueDate.getMonth() + 1) === selectedMonth;
      });

      // 2. Sumar monto del mes
      const totalMonth = monthInstallments.reduce((sum, inst) => sum + inst.finalMonthlyAmountClp, 0);

      if (totalMonth === 0) return;

      // 3. Resolver Categoría
      const catName = purchase.category?.name || 'Sin Categoría';
      const catColor = purchase.category?.color || '#9ca3af';

      // 4. Agregar al acumulador
      if (map.has(catName)) {
        const entry = map.get(catName)!;
        entry.total += totalMonth;
      } else {
        map.set(catName, { name: catName, total: totalMonth, color: catColor });
      }
    });

    const sortedData = Array.from(map.values()).sort((a, b) => b.total - a.total);

    // 6. Agregar barra de Total
    const grandTotal = sortedData.reduce((acc, curr) => acc + curr.total, 0);
    
    // Solo agregar Total si hay datos
    if (sortedData.length > 0) {
      // Usamos un nombre especial que identificaremos luego
      sortedData.push({
        name: "Total",
        total: grandTotal,
        color: "#111827" 
      });
    }

    return sortedData;
  }, [purchases, selectedYear, selectedMonth]);

  const formatMonto = (val: number) => {
    return '$' + new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(val));
  };

  const formatK = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  // Calcula el porcentaje respecto al total (excluyendo la barra 'Total' del cálculo base si se quisiera, 
  // pero aquí el requerimiento es sobre el grandTotal). 
  // Ojo: La barra "Total" tendrá 100% consigo misma si usamos su propio total, 
  // o podemos ocultar el % para la barra Total como pide el requerimiento.
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const item = data[index];
    
    // Encontrar el grandTotal real (que es el valor de la última barra 'Total')
    const totalItem = data.find(d => d.name === 'Total');
    const grandTotal = totalItem ? totalItem.total : value; 

    // Si es la barra "Total", solo mostrar monto
    if (item.name === 'Total') {
      return (
        <text x={x + width / 2} y={y - 5} fill="#374151" textAnchor="middle" fontSize={11}>
          {formatMonto(value)}
        </text>
      );
    }

    // Para las demás, mostrar monto y %
    const percent = grandTotal > 0 ? (value / grandTotal) * 100 : 0;
    
    return (
      <text x={x + width / 2} y={y - 5} fill="#374151" textAnchor="middle" fontSize={11}>
        <tspan x={x + width / 2} dy="-1.2em">{formatMonto(value)}</tspan>
        <tspan x={x + width / 2} dy="1.2em" fill="#6b7280" fontSize={10}>({percent.toFixed(1)}%)</tspan>
      </text>
    );
  };

  const handleClick = (entry: any) => {
    if (entry && entry.name) {
      // Si es Total, limpiar filtro
      if (entry.name === 'Total') {
        onSelectCategory(null);
        return;
      }

      if (selectedCategory === entry.name) {
        onSelectCategory(null);
      } else {
        onSelectCategory(entry.name);
      }
    }
  };

  if (data.length === 0) return null;

  return (
    <Panel bordered style={{ background: '#fff', marginBottom: '1.5rem' }}>
      <Stack justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
        <h5 style={{ margin: 0 }}>Composición por Categoría</h5>
        {selectedCategory && (
          <Button appearance="subtle" size="xs" onClick={() => onSelectCategory(null)} color="red">
            Limpiar filtro: <b>{selectedCategory}</b>
          </Button>
        )}
      </Stack>
      
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 25, right: 30, left: 10, bottom: 5 }} // Más top margin para etiquetas
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              interval={0} 
              height={40} 
              tick={{ fontSize: 11, fill: '#4b5563' }}
              // Si hay muchas categorías, Recharts puede ocultar etiquetas si no caben con interval 0.
              // Para asegurar que se vean todas, a veces se usa un tick formatter truncado o rotate si son demasiadas.
              // El prompt pide eliminar rotación diagonal.
            />
            <YAxis 
              tickFormatter={formatK}
              axisLine={false}
              tickLine={false}
              width={45}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip 
              formatter={(value: number) => [formatMonto(value), 'Monto']}
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="total" onClick={handleClick} cursor="pointer" radius={[4, 4, 0, 0]}>
              <LabelList content={renderCustomLabel} />
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  opacity={
                    entry.name === 'Total' 
                      ? 1 
                      : (selectedCategory && selectedCategory !== entry.name ? 0.3 : 1)
                  }
                  stroke={selectedCategory === entry.name ? '#333' : 'none'}
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
