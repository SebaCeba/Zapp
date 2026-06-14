import { useState, useRef } from 'react';
import { ActualCategory } from '../../types/actual';
import { upsertActualEntry } from '../../api/actualApi';

interface ActualEditableCellProps {
  value: number;
  year: number;
  month: number;
  category: ActualCategory;
  itemKey: string;
  itemName: string;
  onSaved: (newAmount: number) => void;
}

export default function ActualEditableCell({
  value,
  year,
  month,
  category,
  itemKey,
  itemName,
  onSaved
}: ActualEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setIsEditing(true);
    setInputValue(String(value));
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
        itemKey,
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

  function parseInputValue(val: string): number | null {
    const sanitized = val.replace(/\./g, '').replace(',', '.').trim();
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

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className={`w-full text-right text-xs font-bold tabular-nums bg-primary/10 border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary ${
            error ? 'border-error' : 'border-primary/40'
          }`}
          placeholder="0"
          inputMode="numeric"
          aria-label={`Editar ${itemName}`}
        />
        {error && (
          <span className="absolute top-full left-0 mt-1 bg-error text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10 shadow-lg">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="group/cell cursor-pointer transition-colors hover:bg-primary/5 py-1 px-2 rounded" onClick={handleEdit}>
      <span className="group-hover/cell:hidden tabular-nums">
        {formatMonto(value)}
      </span>
      <span className="hidden group-hover/cell:inline text-primary/80 tabular-nums">
        <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">edit</span>
        {formatMonto(value)}
      </span>
    </div>
  );
}
