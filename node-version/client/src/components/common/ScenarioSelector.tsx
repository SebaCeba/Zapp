import { ReactNode } from 'react';

export type ScenarioType = 'BUDGET' | 'ACTUAL';

interface ScenarioSelectorProps {
  value: ScenarioType;
  onChange: (scenario: ScenarioType) => void;
  className?: string;
}

/**
 * Toggle selector for BUDGET vs ACTUAL scenarios.
 * Used for switching between budgeted and actual financial data.
 * 
 * @example
 * ```tsx
 * <ScenarioSelector 
 *   value={scenario} 
 *   onChange={setScenario} 
 * />
 * ```
 */
export function ScenarioSelector({ 
  value, 
  onChange, 
  className = '' 
}: ScenarioSelectorProps) {
  return (
    <div className={`inline-flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange('BUDGET')}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            value === 'BUDGET'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            account_balance_wallet
          </span>
          Presupuesto
        </span>
      </button>
      
      <button
        type="button"
        onClick={() => onChange('ACTUAL')}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all
          ${
            value === 'ACTUAL'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }
        `}
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base">
            receipt_long
          </span>
          Real
        </span>
      </button>
    </div>
  );
}
