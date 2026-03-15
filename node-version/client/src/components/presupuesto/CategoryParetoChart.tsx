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

interface CategoryParetoChartProps {
  purchases: Purchase[];
  selectedYear: number;
  selectedMonth: number | null;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

interface CategoryData {
  name: string;
  total: number;
  color: string;
  purchaseCount: number;
}

interface UncategorizedData {
  count: number;
  total: number;
  purchaseIds: number[];
}

export default function CategoryParetoChart({
  purchases,
  selectedYear,
  selectedMonth,
  selectedCategory,
  onSelectCategory
}: CategoryParetoChartProps) {

  // Procesar datos: categorías reales + uncategorized separado
  const { chartData, uncategorizedData } = useMemo(() => {
    const categoryMap: Record<string, CategoryData> = {};
    const uncategorized: UncategorizedData = {
      count: 0,
      total: 0,
      purchaseIds: []
    };

    // Track which purchases we've counted to avoid duplicates
    const countedPurchases = new Set<number>();

    purchases.forEach(purchase => {
      const catName = purchase.category?.name;
      const catColor = purchase.category?.color || '#6366f1';

      // Filtrar cuotas del año seleccionado y mes (si aplica)
      const relevantInstallments = purchase.installments.filter(inst => {
        const dueDate = new Date(inst.dueDate);
        if (dueDate.getFullYear() !== selectedYear) return false;
        if (selectedMonth && dueDate.getMonth() + 1 !== selectedMonth) return false;
        return true;
      });

      // Si no hay cuotas relevantes, omitir esta compra
      if (relevantInstallments.length === 0) return;

      // Calcular total de esta compra en el periodo
      const purchaseTotal = relevantInstallments.reduce(
        (sum, inst) => sum + inst.finalMonthlyAmountClp,
        0
      );

      if (!catName) {
        // Sin categoría
        uncategorized.count++;
        uncategorized.total += purchaseTotal;
        uncategorized.purchaseIds.push(purchase.id);
      } else {
        // Categoría real
        if (!categoryMap[catName]) {
          categoryMap[catName] = {
            name: catName,
            total: 0,
            color: catColor,
            purchaseCount: 0
          };
        }
        categoryMap[catName].total += purchaseTotal;
        
        // Count unique purchases per category
        if (!countedPurchases.has(purchase.id)) {
          categoryMap[catName].purchaseCount++;
          countedPurchases.add(purchase.id);
        }
      }
    });

    // Convertir a array y ordenar descendente por monto (Pareto)
    const categoriesList = Object.values(categoryMap)
      .sort((a, b) => b.total - a.total);

    return {
      chartData: categoriesList,
      uncategorizedData: uncategorized
    };
  }, [purchases, selectedYear, selectedMonth]);

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

    const categoryData = data.activePayload[0]?.payload;
    if (!categoryData) return;

    const clickedCategory = categoryData.name;
    
    if (selectedCategory === clickedCategory) {
      // Deseleccionar
      onSelectCategory(null);
    } else {
      // Seleccionar categoría
      onSelectCategory(clickedCategory);
    }
  };

  const handleUncategorizedClick = () => {
    if (selectedCategory === 'Sin Categoría') {
      onSelectCategory(null);
    } else {
      onSelectCategory('Sin Categoría');
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '0.75rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
          {data.name}
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
          {data.purchaseCount} {data.purchaseCount === 1 ? 'compra' : 'compras'}
        </div>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: '500',
          color: '#111827'
        }}>
          <span>Total:</span>
          <span>{formatCurrency(data.total)}</span>
        </div>
      </div>
    );
  };

  const periodLabel = selectedMonth 
    ? `${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][selectedMonth - 1]} ${selectedYear}`
    : `${selectedYear}`;

  return (
    <Panel 
      header={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '1rem' }}>📈 Categorías (Pareto) - {periodLabel}</span>
        </div>
      }
      bordered
      style={{ marginBottom: '1.5rem' }}
    >
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={360}>
          <BarChart 
            data={chartData}
            onClick={handleBarClick}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number"
              tickFormatter={formatK}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#d1d5db"
            />
            <YAxis 
              type="category"
              dataKey="name" 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              stroke="#d1d5db"
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
            <Bar 
              dataKey="total" 
              radius={[0, 8, 8, 0]}
              isAnimationActive={false}
            >
              {chartData.map((entry, index) => {
                const isSelected = selectedCategory === entry.name;
                const fillColor = entry.color || '#6366f1';
                const opacity = selectedCategory && !isSelected ? 0.3 : 1;

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
                position="right" 
                formatter={(value: number) => value > 0 ? formatK(value) : ''}
                style={{ fontSize: '12px', fill: '#6B7280', fontWeight: 400 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          No hay categorías con compras en este periodo
        </div>
      )}

      {/* Bloque de "Sin Categoría" separado */}
      {uncategorizedData.count > 0 && (
        <div 
          onClick={handleUncategorizedClick}
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: selectedCategory === 'Sin Categoría' ? '#fef3c7' : '#f9fafb',
            borderRadius: '8px',
            border: `2px solid ${selectedCategory === 'Sin Categoría' ? '#f59e0b' : '#e5e7eb'}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== 'Sin Categoría') {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.backgroundColor = '#fef3c7';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategory !== 'Sin Categoría') {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <span>Sin Categoría</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#78716c' }}>
                {uncategorizedData.count} {uncategorizedData.count === 1 ? 'compra' : 'compras'} · {formatCurrency(uncategorizedData.total)}
              </div>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedCategory === 'Sin Categoría' ? '#f59e0b' : '#fff',
              color: selectedCategory === 'Sin Categoría' ? '#fff' : '#92400e',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: `1px solid ${selectedCategory === 'Sin Categoría' ? '#f59e0b' : '#fed7aa'}`
            }}>
              {selectedCategory === 'Sin Categoría' ? '✓ Seleccionado' : 'Click para ver'}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
