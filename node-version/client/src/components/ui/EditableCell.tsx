import { useState, useRef } from 'react';

/**
 * Formateo corto para montos (muestra guion para 0)
 */
function clpShort(n: number): string {
  if (n === 0) return '\u2014';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);
}

interface EditableCellProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

/**
 * Celda de tabla editable inline para valores monetarios.
 * Click para editar, Enter/blur para guardar, Escape para cancelar.
 * Parte del sistema de componentes Tailwind-first de Zapp.
 */
export function EditableCell({ 
  value, 
  onSave, 
  disabled = false,
  className = '' 
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    if (disabled) return;
    setDraft(value === 0 ? '' : String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = async () => {
    const parsed = parseInt(draft.replace(/\D/g, '')) || 0;
    if (parsed === value) { 
      setEditing(false); 
      return; 
    }
    
    setSaving(true);
    setError(false);
    
    try {
      await onSave(parsed);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => setEditing(false);

  if (editing) {
    return (
      <td className={`px-2 py-0 text-right ${className}`}>
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
          className={`w-full text-right text-xs font-bold tabular-nums bg-primary/10 border rounded px-2 py-3 focus:outline-none focus:ring-1 focus:ring-primary ${
            error ? 'border-red-400' : 'border-primary/40'
          }`}
          disabled={saving}
          placeholder="0"
          type="text"
          inputMode="numeric"
        />
      </td>
    );
  }

  return (
    <td
      className={`px-3 py-3 text-right tabular-nums text-xs cursor-pointer group/cell transition-colors hover:bg-primary/5 whitespace-nowrap ${
        value === 0 ? 'text-slate-300' : 'text-on-surface-variant'
      } ${saving ? 'opacity-40' : ''} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      onClick={startEdit}
      title={disabled ? '' : 'Clic para editar'}
    >
      <span className="group-hover/cell:hidden">{clpShort(value)}</span>
      <span className="hidden group-hover/cell:inline text-primary/60">
        <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">edit</span>
        {clpShort(value)}
      </span>
    </td>
  );
}
