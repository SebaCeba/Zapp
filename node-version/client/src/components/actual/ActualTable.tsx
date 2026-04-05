import { useState } from 'react';
import { CategorySummary, ActualCategory } from '../../types/actual';
import ActualRow from './ActualRow';

interface ActualTableProps {
  category: CategorySummary;
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
  [ActualCategory.PAGO_TC]: 'Pago TC',
  [ActualCategory.AJUSTES]: 'Ajustes',
  [ActualCategory.AHORROS]: 'Ahorros'
};

export default function ActualTable({ category, year, month, onEntryUpdated }: ActualTableProps) {
  const [expanded, setExpanded] = useState(true);

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const pctExecDisplay = category.pctExec !== null 
    ? `${category.pctExec.toFixed(1)}%` 
    : 'N/A';

  const categoryLabel = CATEGORY_LABELS[category.name] || category.name;

  return (
    <div className="category-section" style={{ marginBottom: '2rem' }}>
      <div 
        className="category-header" 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: 'var(--gray-100)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          marginBottom: expanded ? '0.5rem' : 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{expanded ? '▼' : '▶'}</span>
          <span>{categoryLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
          <span>Presupuesto: {formatMonto(category.budgetClp)}</span>
          <span>Actual: {formatMonto(category.actualClp)}</span>
          <span>Delta: {formatMonto(category.deltaClp)}</span>
          <span>Ejec: {pctExecDisplay}</span>
        </div>
      </div>

      {expanded && category.lines.length > 0 && (
        <table className="tabla-presupuesto" style={{ width: '100%', marginTop: '0.5rem' }}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="monto">Presupuesto</th>
              <th className="monto">Actual</th>
              <th className="monto">Delta</th>
              <th className="percent">% Ejec</th>
            </tr>
          </thead>
          <tbody>
            {category.lines.map((line) => (
              <ActualRow
                key={line.itemKey}
                line={line}
                year={year}
                month={month}
                category={category.name}
                onSaved={(newAmount) => onEntryUpdated(category.name, line.itemKey, newAmount)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
