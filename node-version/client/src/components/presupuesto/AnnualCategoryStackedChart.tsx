import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { Panel, Button, Stack } from 'rsuite';

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

interface AnnualCategoryStackedChartProps {
  purchases: Purchase[];
  selectedYear: number;
  selectedMonth: number | null;
  selectedCategory: string | null;
  onSelectSegment: (month: number | null, category: string | null) => void;
}

interface MonthData {
  month: string;
  monthIndex: number;
  total: number;
  [category: string]: number | string;
}

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function AnnualCategoryStackedChart({
  purchases,
  selectedYear,
  selectedMonth,
  selectedCategory,
  onSelectSegment
}: AnnualCategoryStackedChartProps) {

  // Procesar datos para el gráfico stacked
  const { chartData, categories, categoryColors } = useMemo(() => {
    // Inicializar estructura de datos por mes
    const monthsData: MonthData[] = MESES_SHORT.map((mes, idx) => ({
      month: mes,
      monthIndex: idx + 1,
      total: 0
    }));

    // Recopilar todas las categorías únicas y sus colores
    const categoriesSet = new Set<string>();
    const catColors: Record<string, string> = {};

    purchases.forEach(purchase => {
      const catName = purchase.category?.name || 'Sin Categoría';
      const catColor = purchase.category?.color || '#9ca3af';
      
      categoriesSet.add(catName);
      if (!catColors[catName]) {
        catColors[catName] = catColor;
      }

      // Filtrar cuotas del año seleccionado
      purchase.installments.forEach(inst => {
        const dueDate = new Date(inst.dueDate);
        if (dueDate.getFullYear() === selectedYear) {
          const monthIdx = dueDate.getMonth(); // 0-11
          const monthData = monthsData[monthIdx];
          
          // Acumular por categoría
          if (!monthData[catName]) {
            monthData[catName] = 0;
          }
          monthData[catName] = (monthData[catName] as number) + inst.finalMonthlyAmountClp;
          monthData.total += inst.finalMonthlyAmountClp;
        }
      });
    });

    const categoriesList = Array.from(categoriesSet).sort((a, b) => {
      // "Sin Categoría" al final
      if (a === 'Sin Categoría') return 1;
      if (b === 'Sin Categoría') return -1;
      return a.localeCompare(b);
    });

    return {
      chartData: monthsData,
      categories: categoriesList,
      categoryColors: catColors
    };
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
    
    // Si hay categoría activa en el stack clickeado, usar esa
    // Recharts no nos da fácilmente qué segmento del stack se clickeó
    // Por simplicidad, al hacer click en una barra, seleccionamos el mes completo
    // y permitimos que el usuario clickee la leyenda para filtrar categoría
    
    if (selectedMonth === clickedMonth) {
      // Deseleccionar
      onSelectSegment(null, null);
    } else {
      // Seleccionar mes, mantener categoría si existe
      onSelectSegment(clickedMonth, selectedCategory);
    }
  };

  const handleLegendClick = (entry: any) => {
    const categoryName = entry.value;
    
    if (selectedCategory === categoryName) {
      // Deseleccionar categoría
      onSelectSegment(selectedMonth, null);
    } else {
      // Seleccionar categoría
      onSelectSegment(selectedMonth, categoryName);
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
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {payload.map((entry: any, idx: number) => {
            if (entry.dataKey === 'total') return null;
            const value = entry.value as number;
            if (value === 0 || !value) return null;
            
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '10px', 
                    height: '10px', 
                    backgroundColor: entry.color,
                    borderRadius: '2px'
                  }} />
                  {entry.name}
                </span>
                <span style={{ fontWeight: '500', color: '#111827' }}>{formatCurrency(value)}</span>
              </div>
            );
          })}
        </div>
        <div style={{ 
          borderTop: '1px solid #e5e7eb', 
          marginTop: '0.5rem', 
          paddingTop: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: '600',
          color: '#111827'
        }}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '0.75rem', 
        justifyContent: 'center',
        marginTop: '1rem'
      }}>
        {payload.map((entry: any, index: number) => {
          const isSelected = selectedCategory === entry.value;
          const isOtherSelected = selectedCategory && selectedCategory !== entry.value;
          
          return (
            <div
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                backgroundColor: isOtherSelected ? '#f9fafb' : '#fff',
                opacity: isOtherSelected ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                backgroundColor: entry.color,
                borderRadius: '2px'
              }} />
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: isSelected ? '600' : '400',
                color: isSelected ? '#111827' : '#6b7280'
              }}>
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (chartData.every(m => m.total === 0)) {
    return (
      <Panel bordered style={{ background: '#fff', marginBottom: '1.5rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: '#6b7280' }}>
          No hay datos de cuotas para {selectedYear}
        </div>
      </Panel>
    );
  }

  return (
    <Panel bordered style={{ background: '#fff', marginBottom: '1.5rem' }}>
      <Stack justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>Proyección Anual por Categoría - {selectedYear}</h5>
        {(selectedMonth || selectedCategory) && (
          <Button 
            appearance="subtle" 
            size="xs" 
            onClick={() => onSelectSegment(null, null)} 
            color="red"
          >
            Limpiar filtro
            {selectedMonth && ` (${MESES_SHORT[selectedMonth - 1]})`}
            {selectedCategory && ` - ${selectedCategory}`}
          </Button>
        )}
      </Stack>
      
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
            onClick={handleBarClick}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#4b5563' }}
            />
            <YAxis 
              tickFormatter={formatK}
              axisLine={false}
              tickLine={false}
              width={60}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Legend content={renderLegend} />
            
            {categories.map((category) => (
              <Bar
                key={`bar-${category}`}
                dataKey={category}
                stackId="a"
                fill={categoryColors[category]}
                cursor="pointer"
                opacity={
                  selectedCategory 
                    ? (selectedCategory === category ? 1 : 0.3)
                    : 1
                }
              >
                {chartData.map((entry, index) => {
                  const isSelectedMonth = selectedMonth === entry.monthIndex;
                  return (
                    <Cell
                      key={`cell-${category}-${index}`}
                      stroke={isSelectedMonth ? '#111827' : 'none'}
                      strokeWidth={isSelectedMonth ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Indicador de estado */}
      {selectedMonth && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#eff6ff',
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#1e40af',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          📊 Mostrando: {MESES_SHORT[selectedMonth - 1]} {selectedYear}
          {selectedCategory && ` - Categoría: ${selectedCategory}`}
        </div>
      )}
    </Panel>
  );
}
