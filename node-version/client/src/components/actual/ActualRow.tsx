import { useState, useRef } from 'react';
import { ActualLine, ActualCategory } from '../../types/actual';
import { upsertActualEntry } from '../../api/actualApi';

interface ActualRowProps {
  line: ActualLine;
  year: number;
  month: number;
  category: ActualCategory;
  onSaved: (newAmount: number) => void;
}

export default function ActualRow({ line, year, month, category, onSaved }: ActualRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setInputValue(String(line.actualClp));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleSave = async () => {
    const amount = parseInputValue(inputValue);
    if (amount === null) {
      setError('Valor inválido');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await upsertActualEntry({
        year,
        month,
        category,
        itemKey: line.itemKey,
        amountClp: amount
      });
      setIsEditing(false);
      onSaved(amount);
    } catch (err: any) {
      if (err.status === 423) {
        setError('Mes bloqueado');
      } else {
        setError('Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setError('');
    }
  };

  function parseInputValue(value: string): number | null {
    const sanitized = value.replace(/\./g, '').replace(',', '.').trim();
    if (!sanitized || sanitized === '-') return null;
    const num = parseFloat(sanitized);
    return isNaN(num) ? null : Math.round(num);
  }

  const formatMonto = (monto: number) => {
    return monto.toLocaleString('es-CL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const deltaClp = line.deltaClp;
  const pctExecDisplay = line.pctExec !== null 
    ? `${line.pctExec.toFixed(1)}%` 
    : 'N/A';

  // Color para delta: positivo en ingresos es bueno, en gastos es malo
  const isIncome = category === ActualCategory.INGRESOS;
  const deltaClass = deltaClp === 0 ? 'text-slate-500' : 
                     (isIncome ? (deltaClp > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold') : 
                                 (deltaClp < 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'));

  return (
    <tr className="hover:bg-surface-container/30 transition-colors">
      <td className="px-4 py-2 text-sm text-on-surface">{line.itemName}</td>
      <td className="px-4 py-2 text-right tabular-nums text-sm text-on-surface-variant">{formatMonto(line.budgetClp)}</td>
      <td className="px-4 py-2 text-right">
        {!isEditing ? (
          <div className="group/cell cursor-pointer transition-colors hover:bg-primary/5 py-1 px-2 rounded inline-block" onClick={handleEdit}>
            <span className="group-hover/cell:hidden tabular-nums text-sm">
              {formatMonto(line.actualClp)}
            </span>
            <span className="hidden group-hover/cell:inline text-primary/80 tabular-nums text-sm">
              <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">edit</span>
              {formatMonto(line.actualClp)}
            </span>
          </div>
        ) : (
          <div className="relative inline-block min-w-[120px]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className={`w-full text-right text-sm font-bold tabular-nums bg-primary/10 border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary ${
                error ? 'border-error' : 'border-primary/40'
              }`}
              placeholder="0"
              inputMode="numeric"
            />
            {error && (
              <span className="absolute top-full left-0 mt-1 bg-error text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-lg">
                {error}
              </span>
            )}
          </div>
        )}
      </td>
      <td className={`px-4 py-2 text-right tabular-nums text-sm ${deltaClass}`}>
        {formatMonto(deltaClp)}
      </td>
      <td className="px-4 py-2 text-center text-sm text-on-surface-variant">{pctExecDisplay}</td>
    </tr>
  );
}
