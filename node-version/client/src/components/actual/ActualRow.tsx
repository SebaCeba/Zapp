import { useState } from 'react';
import type { KeyboardEvent } from 'react';
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

  const handleEdit = () => {
    setIsEditing(true);
    // Sin formato: solo el número
    setInputValue(String(line.actualClp));
  };

  const handleSave = async () => {
    const amount = parseInputValue(inputValue);
    if (amount === null) {
      setError('Valor inválido');
      return;
    }

    try {
      await upsertActualEntry({
        year,
        month,
        category,
        itemKey: line.itemKey,
        amountClp: amount
      });
      setIsEditing(false);
      setError('');
      onSaved(amount);
    } catch (err: any) {
      if (err.status === 423) {
        setError('Mes bloqueado');
      } else {
        setError('Error al guardar');
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
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
  const deltaClass = deltaClp === 0 ? '' : 
                     (isIncome ? (deltaClp > 0 ? 'favorable' : 'unfavorable') : 
                                 (deltaClp < 0 ? 'favorable' : 'unfavorable'));

  return (
    <tr>
      <td>{line.itemName}</td>
      <td className="monto">{formatMonto(line.budgetClp)}</td>
      <td className="monto actual-cell">
        {!isEditing ? (
          <>
            <span onDoubleClick={handleEdit} style={{ cursor: 'pointer' }}>
              {formatMonto(line.actualClp)}
            </span>
            <button onClick={handleEdit} style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
              ✏️
            </button>
          </>
        ) : (
          <div className="edit-mode" style={{ position: 'relative' }}>
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ width: '100%', padding: '0.25rem' }}
            />
            {error && (
              <span className="error-tooltip" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: '#ef4444',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                {error}
              </span>
            )}
          </div>
        )}
      </td>
      <td className={`monto delta ${deltaClass}`}>
        {formatMonto(deltaClp)}
      </td>
      <td className="percent">{pctExecDisplay}</td>
    </tr>
  );
}
