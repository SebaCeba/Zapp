import { useState } from 'react';
import type { KeyboardEvent } from 'react';
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

  const handleEdit = () => {
    setIsEditing(true);
    setInputValue(String(value));
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
        itemKey,
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

  if (!isEditing) {
    return (
      <>
        <span onDoubleClick={handleEdit} style={{ cursor: 'pointer' }}>
          {formatMonto(value)}
        </span>
        <button 
          onClick={handleEdit} 
          style={{ marginLeft: '0.5rem', fontSize: '0.875rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
          aria-label={`Editar ${itemName}`}
        >
          ✏️
        </button>
      </>
    );
  }

  return (
    <div className="edit-mode" style={{ position: 'relative' }}>
      <input
        type="text"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{ width: '100%', padding: '0.25rem' }}
        aria-label={`Editar ${itemName}`}
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
  );
}
