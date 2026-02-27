import { useState } from 'react';
import { ActualSummary, ActualCategory, CategorySummary } from '../../types/actual';
import ActualEditableCell from './ActualEditableCell';

interface ActualConsolidatedTableProps {
  summary: ActualSummary;
  year: number;
  month: number;
  onEntryUpdated: (categoryName: string, itemKey: string, newAmount: number) => void;
}

const CATEGORY_LABELS: Record<ActualCategory, string> = {
  [ActualCategory.INGRESOS]: 'Ingresos',
  [ActualCategory.SUSCRIPCIONES]: 'Suscripciones',
  [ActualCategory.OBLIGACIONES]: 'Créditos y Seguros',
  [ActualCategory.HIPOTECARIO]: 'Hipotecario',
  [ActualCategory.SERVICIOS_BASICOS]: 'Servicios Básicos',
  [ActualCategory.SUPERMERCADO]: 'Supermercado',
  [ActualCategory.PAGO_TC]: 'Pagos TC',
  [ActualCategory.AJUSTES]: 'Ajustes'
};

const CATEGORY_ORDER: ActualCategory[] = [
  ActualCategory.INGRESOS,
  ActualCategory.SUSCRIPCIONES,
  ActualCategory.OBLIGACIONES,
  ActualCategory.HIPOTECARIO,
  ActualCategory.SERVICIOS_BASICOS,
  ActualCategory.SUPERMERCADO,
  ActualCategory.PAGO_TC,
  ActualCategory.AJUSTES
];

export default function ActualConsolidatedTable({
  summary,
  year,
  month,
  onEntryUpdated
}: ActualConsolidatedTableProps) {
  // Estado para colapsar/expandir categorías (default todas expandidas)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORY_ORDER)
  );
  
  // Estado para expandir/colapsar grupo GASTOS
  const [gastosExpanded, setGastosExpanded] = useState(true);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const formatPctExec = (pctExec: number | null) => {
    if (pctExec === null) return '—';
    return pctExec.toFixed(1).replace('.', ',') + '%';
  };

  const formatPctIncome = (actualClp: number) => {
    if (summary.totalIngresos === 0) return '—';
    const pct = (actualClp / summary.totalIngresos) * 100;
    return pct.toFixed(1).replace('.', ',') + '%';
  };

  const getDeltaClass = (deltaClp: number, isIncome: boolean) => {
    if (deltaClp === 0) return 'delta--neutral';
    if (isIncome) {
      return deltaClp > 0 ? 'delta--good' : 'delta--bad';
    } else {
      return deltaClp < 0 ? 'delta--good' : 'delta--bad';
    }
  };

  const getSortedCategories = () => {
    const categoryMap = new Map(summary.categories.map(c => [c.name, c]));
    return CATEGORY_ORDER
      .map(name => categoryMap.get(name))
      .filter((c): c is CategorySummary => c !== undefined);
  };

  const sortedCategories = getSortedCategories();

  // Separar INGRESOS de GASTOS
  const ingresosCategory = sortedCategories.find(c => c.name === ActualCategory.INGRESOS);
  const expenseCategories = sortedCategories.filter(c => c.name !== ActualCategory.INGRESOS);
  
  // Cálculo de totales de gastos
  const totalExpensesBudget = expenseCategories.reduce((sum, c) => sum + c.budgetClp, 0);
  const totalExpensesActual = expenseCategories.reduce((sum, c) => sum + c.actualClp, 0);
  const totalExpensesDelta = totalExpensesActual - totalExpensesBudget;
  const totalExpensesPctExec = totalExpensesBudget > 0 
    ? (totalExpensesActual / totalExpensesBudget) * 100 
    : null;

  return (
    <div className="table-container">
      <table className="tabla-consolidada">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="monto">Presupuesto</th>
            <th className="monto">Real</th>
            <th className="monto">Δ</th>
            <th className="percent">% Ejec</th>
            <th className="percent-income">% ING</th>
          </tr>
        </thead>
        <tbody>
          {/* INGRESOS */}
          {ingresosCategory && (() => {
            const isExpanded = expandedCategories.has(ingresosCategory.name);
            const categoryLabel = CATEGORY_LABELS[ingresosCategory.name as ActualCategory];
            
            return (
              <>
                {/* Fila de grupo INGRESOS */}
                <tr 
                  key={`group-${ingresosCategory.name}`} 
                  className="group-row"
                  onClick={() => toggleCategory(ingresosCategory.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <span style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {categoryLabel}
                  </td>
                  <td className="monto">{formatMonto(ingresosCategory.budgetClp)}</td>
                  <td className="monto">{formatMonto(ingresosCategory.actualClp)}</td>
                  <td className={`monto ${getDeltaClass(ingresosCategory.deltaClp, true)}`}>
                    {formatMonto(ingresosCategory.deltaClp)}
                  </td>
                  <td className="percent">{formatPctExec(ingresosCategory.pctExec)}</td>
                  <td className="percent-income">—</td>
                </tr>

                {/* Filas hijas de INGRESOS */}
                {isExpanded && ingresosCategory.lines.map(line => (
                  <tr 
                    key={`line-${ingresosCategory.name}-${line.itemKey}`}
                    className="sub-row"
                  >
                    <td style={{ paddingLeft: '2.5rem' }}>{line.itemName}</td>
                    <td className="monto">{formatMonto(line.budgetClp)}</td>
                    <td className="monto actual-cell">
                      <ActualEditableCell
                        value={line.actualClp}
                        year={year}
                        month={month}
                        category={ingresosCategory.name}
                        itemKey={line.itemKey}
                        itemName={line.itemName}
                        onSaved={(newAmount) => onEntryUpdated(ingresosCategory.name, line.itemKey, newAmount)}
                      />
                    </td>
                    <td className={`monto ${getDeltaClass(line.deltaClp, true)}`}>
                      {formatMonto(line.deltaClp)}
                    </td>
                    <td className="percent">{formatPctExec(line.pctExec)}</td>
                    <td className="percent-income">—</td>
                  </tr>
                ))}
              </>
            );
          })()}

          {/* GRUPO GASTOS */}
          <tr 
            className="group-row"
            onClick={() => setGastosExpanded(!gastosExpanded)}
            style={{ cursor: 'pointer', fontWeight: '600' }}
          >
            <td>
              <span style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}>
                {gastosExpanded ? '▼' : '▶'}
              </span>
              Gastos
            </td>
            <td className="monto">{formatMonto(totalExpensesBudget)}</td>
            <td className="monto">{formatMonto(totalExpensesActual)}</td>
            <td className={`monto ${getDeltaClass(totalExpensesDelta, false)}`}>
              {formatMonto(totalExpensesDelta)}
            </td>
            <td className="percent">
              {totalExpensesPctExec !== null ? formatPctExec(totalExpensesPctExec) : '—'}
            </td>
            <td className="percent-income">
              {formatPctIncome(totalExpensesActual)}
            </td>
          </tr>

          {/* Categorías de GASTOS (indentadas) */}
          {gastosExpanded && expenseCategories.map(category => {
            const isExpanded = expandedCategories.has(category.name);
            const categoryLabel = CATEGORY_LABELS[category.name as ActualCategory] || category.name;

            return (
              <>
                {/* Fila de categoría de gasto */}
                <tr 
                  key={`group-${category.name}`} 
                  className="group-row"
                  onClick={() => toggleCategory(category.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ paddingLeft: '1.5rem' }}>
                    <span style={{ marginRight: '0.5rem', fontSize: '0.75rem' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                    {categoryLabel}
                  </td>
                  <td className="monto">{formatMonto(category.budgetClp)}</td>
                  <td className="monto">{formatMonto(category.actualClp)}</td>
                  <td className={`monto ${getDeltaClass(category.deltaClp, false)}`}>
                    {formatMonto(category.deltaClp)}
                  </td>
                  <td className="percent">{formatPctExec(category.pctExec)}</td>
                  <td className="percent-income">
                    {formatPctIncome(category.actualClp)}
                  </td>
                </tr>

                {/* Filas hijas de categoría de gasto */}
                {isExpanded && category.lines.map(line => (
                  <tr 
                    key={`line-${category.name}-${line.itemKey}`}
                    className="sub-row"
                  >
                    <td style={{ paddingLeft: '4rem' }}>{line.itemName}</td>
                    <td className="monto">{formatMonto(line.budgetClp)}</td>
                    <td className="monto actual-cell">
                      <ActualEditableCell
                        value={line.actualClp}
                        year={year}
                        month={month}
                        category={category.name}
                        itemKey={line.itemKey}
                        itemName={line.itemName}
                        onSaved={(newAmount) => onEntryUpdated(category.name, line.itemKey, newAmount)}
                      />
                    </td>
                    <td className={`monto ${getDeltaClass(line.deltaClp, false)}`}>
                      {formatMonto(line.deltaClp)}
                    </td>
                    <td className="percent">{formatPctExec(line.pctExec)}</td>
                    <td className="percent-income">
                      {formatPctIncome(line.actualClp)}
                    </td>
                  </tr>
                ))}
              </>
            );
          })}

          {/* Fila totalizador de gastos */}
          {gastosExpanded && <tr className="total-row">
            <td style={{ paddingLeft: '1.5rem' }}>Total Gastos</td>
            <td className="monto">{formatMonto(totalExpensesBudget)}</td>
            <td className="monto">{formatMonto(totalExpensesActual)}</td>
            <td className={`monto ${getDeltaClass(totalExpensesDelta, false)}`}>
              {formatMonto(totalExpensesDelta)}
            </td>
            <td className="percent">
              {totalExpensesPctExec !== null ? formatPctExec(totalExpensesPctExec) : '—'}
            </td>
            <td className="percent-income">
              {formatPctIncome(totalExpensesActual)}
            </td>
          </tr>}
        </tbody>
      </table>
    </div>
  );
}
