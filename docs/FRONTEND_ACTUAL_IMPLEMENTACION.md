# Implementación Frontend - Página Actual (Presupuesto vs Actual)

## 1. Tipos TypeScript

### 1.1. Crear archivo `node-version/client/src/types/actual.ts`

```typescript
export enum ActualCategory {
  INGRESOS = 'INGRESOS',
  SUSCRIPCIONES = 'SUSCRIPCIONES',
  OBLIGACIONES = 'OBLIGACIONES',
  HIPOTECARIO = 'HIPOTECARIO',
  SERVICIOS_BASICOS = 'SERVICIOS_BASICOS',
  SUPERMERCADO = 'SUPERMERCADO',
  AJUSTES = 'AJUSTES'
}

export interface ActualLine {
  itemKey: string;
  label: string;
  budgetClp: number;
  actualClp: number;
  deltaClp: number;
  pctExec: number | null;
  isPaid?: boolean;
}

export interface ActualCategoryData {
  category: ActualCategory;
  totalBudget: number;
  totalActual: number;
  totalDelta: number;
  totalPctExec: number | null;
  lines: ActualLine[];
}

export interface ActualSummary {
  year: number;
  month: number;
  categories: ActualCategoryData[];
}

export interface ActualEntryPayload {
  year: number;
  month: number;
  category: ActualCategory;
  itemKey: string;
  label?: string;
  amountClp: number;
  isPaid?: boolean;
}

export interface ActualEntry {
  id: string;
  year: number;
  month: number;
  category: ActualCategory;
  itemKey: string;
  label: string | null;
  amountClp: number;
  isPaid: boolean | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Servicio API

### 2.1. Crear archivo `node-version/client/src/services/actualApi.ts`

```typescript
import { ActualSummary, ActualEntryPayload, ActualEntry } from '../types/actual';

const API_BASE_URL = 'http://localhost:3000/api/actual';

export async function fetchActualSummary(year: number, month: number): Promise<ActualSummary> {
  const response = await fetch(`${API_BASE_URL}/summary?year=${year}&month=${month}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch actual summary: ${response.statusText}`);
  }
  
  return response.json();
}

export async function upsertActualEntry(payload: ActualEntryPayload): Promise<ActualEntry> {
  const response = await fetch(`${API_BASE_URL}/entry`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    if (response.status === 423) {
      throw new Error('LOCKED');
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to update actual entry');
  }
  
  return response.json();
}

export async function deleteActualEntry(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/entry/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    if (response.status === 423) {
      throw new Error('LOCKED');
    }
    throw new Error('Failed to delete actual entry');
  }
}
```

---

## 3. Componente ActualRow

### 3.1. Crear archivo `node-version/client/src/components/actual/ActualRow.tsx`

```typescript
import React, { useState } from 'react';
import { ActualLine, ActualCategory } from '../../types/actual';

interface ActualRowProps {
  line: ActualLine;
  category: ActualCategory;
  year: number;
  month: number;
  onUpdate: (itemKey: string, newAmount: number) => Promise<void>;
  disabled?: boolean;
}

export default function ActualRow({ 
  line, 
  category, 
  year, 
  month, 
  onUpdate,
  disabled = false 
}: ActualRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatMonto = (monto: number): string => {
    if (monto === 0) return '0';
    return Math.round(monto).toLocaleString('es-CL');
  };

  const formatPctExec = (pct: number | null): string => {
    if (pct === null) return 'N/A';
    return `${pct.toFixed(2)}%`;
  };

  const parseInputValue = (value: string): number => {
    // Remover separadores de miles (puntos) y reemplazar coma decimal por punto
    const cleaned = value.replace(/\./g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  };

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setInputValue(formatMonto(line.actualClp));
    setError(null);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const newAmount = parseInputValue(inputValue);
    
    // Si no cambió, solo cerrar
    if (newAmount === line.actualClp) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onUpdate(line.itemKey, newAmount);
      setIsEditing(false);
    } catch (err: any) {
      if (err.message === 'LOCKED') {
        setError('Mes bloqueado. No puedes editar.');
        // Revertir valor
        setInputValue(formatMonto(line.actualClp));
      } else {
        setError('Error al guardar');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setError(null);
    }
  };

  const getDeltaColor = (delta: number): string => {
    if (category === 'INGRESOS') {
      // Para ingresos: más es mejor (verde)
      return delta >= 0 ? '#16a34a' : '#dc2626';
    } else {
      // Para egresos: menos es mejor (verde)
      return delta <= 0 ? '#16a34a' : '#dc2626';
    }
  };

  const getPctExecColor = (pct: number | null): string => {
    if (pct === null) return '#6b7280';
    
    if (category === 'INGRESOS') {
      // Ingresos: >=100% es verde
      if (pct >= 100) return '#16a34a';
      if (pct >= 90) return '#f59e0b';
      return '#dc2626';
    } else {
      // Egresos: <=100% es verde
      if (pct <= 100) return '#16a34a';
      if (pct <= 110) return '#f59e0b';
      return '#dc2626';
    }
  };

  return (
    <tr style={{ cursor: 'default' }}>
      {/* Concepto */}
      <td style={{ 
        position: 'sticky', 
        left: 0, 
        background: 'white', 
        paddingLeft: '2rem',
        fontSize: '0.875rem' 
      }}>
        {line.label}
      </td>

      {/* Presupuesto (readonly) */}
      <td style={{ textAlign: 'right', color: '#6b7280' }}>
        ${formatMonto(line.budgetClp)}
      </td>

      {/* Actual (editable) */}
      <td style={{ textAlign: 'right' }}>
        {isEditing ? (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="input"
              style={{
                width: '100%',
                padding: '0.25rem 0.5rem',
                textAlign: 'right',
                fontSize: '0.875rem',
                border: error ? '2px solid #dc2626' : '1px solid #d1d5db'
              }}
            />
            {error && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.25rem',
                padding: '0.25rem 0.5rem',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '0.75rem',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                {error}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              transition: 'background 0.2s',
              fontWeight: '500',
              opacity: disabled ? 0.5 : 1
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--gray-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            onClick={handleStartEdit}
          >
            {isSaving ? (
              <span style={{ color: 'var(--primary)' }}>...</span>
            ) : (
              `$${formatMonto(line.actualClp)}`
            )}
          </div>
        )}
      </td>

      {/* Delta */}
      <td style={{ 
        textAlign: 'right', 
        color: getDeltaColor(line.deltaClp),
        fontWeight: '500'
      }}>
        {line.deltaClp >= 0 ? '+' : ''}${formatMonto(line.deltaClp)}
      </td>

      {/* % Ejecución */}
      <td style={{ 
        textAlign: 'right', 
        color: getPctExecColor(line.pctExec),
        fontWeight: '500'
      }}>
        {formatPctExec(line.pctExec)}
      </td>
    </tr>
  );
}
```

---

## 4. Componente ActualTable

### 4.1. Crear archivo `node-version/client/src/components/actual/ActualTable.tsx`

```typescript
import React, { useState } from 'react';
import { ActualCategoryData, ActualCategory } from '../../types/actual';
import ActualRow from './ActualRow';
import { upsertActualEntry } from '../../services/actualApi';

interface ActualTableProps {
  categoryData: ActualCategoryData;
  year: number;
  month: number;
  onUpdate: () => void;
}

const CATEGORY_LABELS: Record<ActualCategory, string> = {
  INGRESOS: 'Ingresos',
  SUSCRIPCIONES: 'Suscripciones',
  OBLIGACIONES: 'Créditos y Seguros',
  HIPOTECARIO: 'Hipotecario',
  SERVICIOS_BASICOS: 'Servicios Básicos',
  SUPERMERCADO: 'Supermercado',
  AJUSTES: 'Ajustes Manuales'
};

const CATEGORY_COLORS: Record<ActualCategory, { bg: string; header: string }> = {
  INGRESOS: { bg: '#ecfdf5', header: '#d1fae5' },
  SUSCRIPCIONES: { bg: '#fef2f2', header: '#fee2e2' },
  OBLIGACIONES: { bg: '#fef2f2', header: '#fee2e2' },
  HIPOTECARIO: { bg: '#fef2f2', header: '#fee2e2' },
  SERVICIOS_BASICOS: { bg: '#fef2f2', header: '#fee2e2' },
  SUPERMERCADO: { bg: '#fef2f2', header: '#fee2e2' },
  AJUSTES: { bg: '#fefce8', header: '#fef3c7' }
};

export default function ActualTable({ categoryData, year, month, onUpdate }: ActualTableProps) {
  const [expanded, setExpanded] = useState(true);

  const formatMonto = (monto: number): string => {
    if (monto === 0) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const formatPctExec = (pct: number | null): string => {
    if (pct === null) return 'N/A';
    return `${pct.toFixed(2)}%`;
  };

  const handleUpdateLine = async (itemKey: string, newAmount: number) => {
    const line = categoryData.lines.find(l => l.itemKey === itemKey);
    if (!line) return;

    await upsertActualEntry({
      year,
      month,
      category: categoryData.category,
      itemKey,
      label: line.label,
      amountClp: newAmount
    });

    // Actualizar datos
    onUpdate();
  };

  const colors = CATEGORY_COLORS[categoryData.category];
  const isIncome = categoryData.category === ActualCategory.INGRESOS;

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      {/* Header de categoría (expandible) */}
      <div
        style={{
          background: colors.header,
          padding: '0.75rem 1rem',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: '600', fontSize: '1rem' }}>
            {expanded ? '▼' : '▶'} {CATEGORY_LABELS[categoryData.category]}
          </span>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            ({categoryData.lines.length} línea{categoryData.lines.length !== 1 ? 's' : ''})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: '#6b7280' }}>Presupuesto: </span>
            <strong>{formatMonto(categoryData.totalBudget)}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Actual: </span>
            <strong>{formatMonto(categoryData.totalActual)}</strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Δ: </span>
            <strong style={{ 
              color: isIncome 
                ? (categoryData.totalDelta >= 0 ? '#16a34a' : '#dc2626')
                : (categoryData.totalDelta <= 0 ? '#16a34a' : '#dc2626')
            }}>
              {categoryData.totalDelta >= 0 ? '+' : ''}{formatMonto(categoryData.totalDelta)}
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>%: </span>
            <strong>{formatPctExec(categoryData.totalPctExec)}</strong>
          </div>
        </div>
      </div>

      {/* Tabla de líneas */}
      {expanded && categoryData.lines.length > 0 && (
        <div className="table-container">
          <table className="monthly-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: '2rem' }}>Concepto</th>
                <th style={{ textAlign: 'right' }}>Presupuesto</th>
                <th style={{ textAlign: 'right' }}>Actual</th>
                <th style={{ textAlign: 'right' }}>Δ</th>
                <th style={{ textAlign: 'right' }}>%</th>
              </tr>
            </thead>
            <tbody style={{ background: colors.bg }}>
              {categoryData.lines.map((line) => (
                <ActualRow
                  key={line.itemKey}
                  line={line}
                  category={categoryData.category}
                  year={year}
                  month={month}
                  onUpdate={handleUpdateLine}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sin líneas */}
      {expanded && categoryData.lines.length === 0 && (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          No hay líneas presupuestadas para esta categoría
        </div>
      )}
    </div>
  );
}
```

---

## 5. Página Principal Actual

### 5.1. Crear archivo `node-version/client/src/pages/Actual.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import { ActualSummary } from '../types/actual';
import { fetchActualSummary } from '../services/actualApi';
import ActualTable from '../components/actual/ActualTable';

export default function Actual() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [summary, setSummary] = useState<ActualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Años disponibles: últimos 3 + actual + siguiente
  const currentYear = currentDate.getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActualSummary(year, month);
      setSummary(data);
    } catch (err: any) {
      console.error('Error loading actual summary:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const formatMonto = (monto: number): string => {
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calculateTotals = () => {
    if (!summary) return { budget: 0, actual: 0, delta: 0 };

    const ingresos = summary.categories.find(c => c.category === 'INGRESOS');
    const egresos = summary.categories.filter(c => c.category !== 'INGRESOS');

    const totalIngresos = ingresos?.totalActual || 0;
    const totalEgresos = egresos.reduce((sum, cat) => sum + cat.totalActual, 0);
    const balance = totalIngresos - totalEgresos;

    return { 
      ingresos: totalIngresos, 
      egresos: totalEgresos, 
      balance 
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          Cargando...
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container">
          <div className="card" style={{ 
            padding: '2rem', 
            textAlign: 'center',
            background: '#fee2e2',
            color: '#dc2626'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={loadSummary}
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totals = calculateTotals();

  return (
    <MainLayout>
      <div className="container">
        {/* Header */}
        <h1 style={{ marginBottom: '1rem', color: '#1e40af' }}>
          📊 Presupuesto vs Actual
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Registra tus gastos e ingresos reales y compáralos con el presupuesto planificado
        </p>

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            {/* Selectores */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="select"
                  style={{ width: 'auto', minWidth: '100px' }}
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: '500', color: '#374151' }}>Mes:</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="select"
                  style={{ width: 'auto', minWidth: '130px' }}
                >
                  {MESES.map((mes, idx) => (
                    <option key={idx + 1} value={idx + 1}>{mes}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={loadSummary}
                className="btn"
                style={{ fontSize: '0.875rem' }}
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Balance */}
            <div style={{ 
              display: 'flex', 
              gap: '1.5rem', 
              fontSize: '0.875rem',
              color: '#666'
            }}>
              <div>
                <span style={{ color: '#6b7280' }}>Ingresos: </span>
                <strong style={{ color: '#16a34a', fontSize: '1rem' }}>
                  {formatMonto(totals.ingresos)}
                </strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Egresos: </span>
                <strong style={{ color: '#dc2626', fontSize: '1rem' }}>
                  {formatMonto(totals.egresos)}
                </strong>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Balance: </span>
                <strong style={{ 
                  color: totals.balance >= 0 ? '#16a34a' : '#dc2626',
                  fontSize: '1.125rem'
                }}>
                  {formatMonto(totals.balance)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="card" style={{ 
          marginBottom: '1.5rem', 
          background: '#dbeafe', 
          borderLeft: '4px solid #3b82f6',
          padding: '0.75rem 1rem'
        }}>
          <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.875rem' }}>
            💡 <strong>Tip:</strong> Haz clic en cualquier monto "Actual" para editarlo. 
            Los cambios se guardan automáticamente al presionar Enter o al salir del campo.
          </p>
        </div>

        {/* Tablas por categoría */}
        {summary?.categories.map((categoryData) => (
          <ActualTable
            key={categoryData.category}
            categoryData={categoryData}
            year={year}
            month={month}
            onUpdate={loadSummary}
          />
        ))}

        {/* Footer info */}
        <div className="card" style={{ 
          marginTop: '2rem', 
          background: '#f9fafb',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <strong>Leyenda:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            <li><strong>Presupuesto:</strong> Monto planificado para el mes</li>
            <li><strong>Actual:</strong> Monto real ejecutado (editable)</li>
            <li><strong>Δ (Delta):</strong> Diferencia entre Actual y Presupuesto</li>
            <li><strong>%:</strong> Porcentaje de ejecución (Actual/Presupuesto × 100). "N/A" si no hay presupuesto.</li>
            <li>
              <strong>Colores:</strong> 
              <span style={{ color: '#16a34a', fontWeight: '600' }}> Verde</span> = favorable, 
              <span style={{ color: '#f59e0b', fontWeight: '600' }}> Amarillo</span> = advertencia, 
              <span style={{ color: '#dc2626', fontWeight: '600' }}> Rojo</span> = desfavorable
            </li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
}
```

---

## 6. Registro de Ruta

### 6.1. Modificar `node-version/client/src/router.tsx`

**Agregar import:**

```typescript
import Actual from './pages/Actual';
```

**Agregar ruta dentro de `<Routes>`:**

```typescript
<Route path="/presupuesto/actual" element={<Actual />} />
```

**Ubicación sugerida:** Después de la ruta `/presupuesto`

**Resultado esperado:**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Creditos from './pages/Creditos';
import Hipotecario from './pages/Hipotecario';
import Home from './pages/Home';
import ServiciosBasicos from './pages/ServiciosBasicos';
import Ingresos from './pages/Ingresos';
import Presupuesto from './pages/Presupuesto';
import Supermercado from './pages/Supermercado';
import Tenpo from './pages/Tenpo';
import TenpoConfig from './pages/TenpoConfig';
import Actual from './pages/Actual';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presupuesto" element={<Presupuesto />} />
        <Route path="/presupuesto/actual" element={<Actual />} />
        <Route path="/app" element={<App />} />
        <Route path="/creditos" element={<Creditos />} />
        <Route path="/hipotecario" element={<Hipotecario />} />
        <Route path="/servicios-basicos" element={<ServiciosBasicos />} />
        <Route path="/ingresos" element={<Ingresos />} />
        <Route path="/supermercado" element={<Supermercado />} />
        <Route path="/presupuesto/tenpo" element={<Tenpo />} />
        <Route path="/presupuesto/tenpo/config" element={<TenpoConfig />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 7. Actualizar Sidebar (Opcional)

### 7.1. Modificar `node-version/client/src/components/Sidebar.tsx`

**Si existe menú "Presupuesto" con submenu, agregar:**

```typescript
const menuItems = [
  {
    label: 'Home',
    href: '/',
    icon: '🏠'
  },
  {
    label: 'Presupuesto',
    href: '/presupuesto',
    icon: '📊',
    submenu: [
      { label: 'Resumen Anual', href: '/presupuesto' },
      { label: 'Actual', href: '/presupuesto/actual' }, // ← NUEVO
      { label: 'Tenpo TC', href: '/presupuesto/tenpo' }
    ]
  },
  // ... resto de menús
];
```

---

## 8. Estilos CSS (Si no existen clases)

### 8.1. Verificar o agregar a `node-version/client/src/index.css`

```css
/* Si no existen, agregar */

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.monthly-table {
  width: 100%;
  border-collapse: collapse;
}

.monthly-table th {
  background: var(--gray-50, #f9fafb);
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.monthly-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.monthly-table tbody tr:hover {
  background: #f9fafb;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  background: #f3f4f6;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-primary:hover {
  background: #2563eb;
}

.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
}

.input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Variables CSS (si no existen) */
:root {
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --primary: #3b82f6;
}
```

---

## 9. Flujo de Datos

### 9.1. Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│                    Página Actual                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Año Selector + Mes Selector → loadSummary()     │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   fetchActualSummary(year, month)                  │ │
│  │   GET /api/actual/summary?year=YYYY&month=M        │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   setState(summary)                                │ │
│  │   Renderizar categorías con ActualTable           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  USER EDITS MONTO                                        │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   ActualRow: onUpdate(itemKey, newAmount)         │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   upsertActualEntry(payload)                       │ │
│  │   PUT /api/actual/entry                            │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                    ┌──────┴──────┐                       │
│                    ▼              ▼                       │
│              ┌─────────┐    ┌─────────┐                  │
│              │ Success │    │ Error   │                  │
│              │ 200 OK  │    │ 423/400 │                  │
│              └─────────┘    └─────────┘                  │
│                    │              │                       │
│                    ▼              ▼                       │
│              ┌─────────┐    ┌──────────┐                 │
│              │ Refetch │    │ Show Err │                 │
│              │ Summary │    │ Revert   │                 │
│              └─────────┘    └──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Comportamiento de Edición

### 10.1. Proceso de Edición de Monto

**Estado Inicial:**
```
Presupuesto: $450,000 (readonly, gris)
Actual:      $450,000 (editable, click para editar)
Δ:           $0
%:           100.00%
```

**Click en Actual:**
1. Campo se convierte en input
2. Valor actual se carga en input como texto con formato
3. Input tiene autofocus

**Usuario escribe:** `480000` o `480.000`

**Presiona Enter o hace Blur:**
1. Input se deshabilita (isSaving = true)
2. Se parsea input: `480000` → `480000`
3. Se llama `upsertActualEntry()`
4. Request: `PUT /api/actual/entry`
   ```json
   {
     "year": 2026,
     "month": 1,
     "category": "SUPERMERCADO",
     "itemKey": "sm:total",
     "amountClp": 480000
   }
   ```

**Si responde 200 OK:**
1. Se llama `onUpdate()` (refetch summary)
2. Nueva data actualiza la línea:
   ```
   Presupuesto: $450,000
   Actual:      $480,000
   Δ:           +$30,000 (rojo, porque es gasto)
   %:           106.67% (rojo, >100%)
   ```

**Si responde 423 Locked:**
1. Mostrar error: "Mes bloqueado. No puedes editar."
2. Revertir input a valor original
3. No cerrar input (dejar visible el error)

**Si responde 400/500:**
1. Mostrar error: "Error al guardar"
2. Mantener input abierto
3. Usuario puede corregir o presionar Escape

---

## 11. Manejo de Casos Especiales

### 11.1. pctExec null (Sin Presupuesto)

**Escenario:** Categoría AJUSTES con línea manual sin presupuesto

**Datos:**
```json
{
  "itemKey": "man:clxxx123",
  "label": "Gasto inesperado",
  "budgetClp": 0,
  "actualClp": 35000,
  "deltaClp": 35000,
  "pctExec": null
}
```

**Renderizado:**
```
Presupuesto: $0
Actual:      $35,000
Δ:           +$35,000
%:           N/A         ← Mostrar "N/A", NO "0%"
```

**Color de %:** Gris (#6b7280) cuando es null

---

### 11.2. Primera Edición (Crear Entry)

**Escenario:** Línea solo tiene presupuesto, nunca se registró actual

**Datos iniciales:**
```json
{
  "budgetClp": 50000,
  "actualClp": 0,
  "deltaClp": -50000,
  "pctExec": 0
}
```

**Usuario edita Actual a:** `48000`

**Request:**
```json
PUT /api/actual/entry
{
  "year": 2026,
  "month": 1,
  "category": "SERVICIOS_BASICOS",
  "itemKey": "sb:1",
  "label": "Luz",
  "amountClp": 48000
}
```

**Backend hace upsert:**
- No existe entry → `create`
- Existe entry → `update`

**Resultado:**
```
Presupuesto: $50,000
Actual:      $48,000
Δ:           -$2,000 (verde, ahorro)
%:           96.00% (verde)
```

---

### 11.3. Limpiar Valor (Poner en 0)

**Usuario borra todo el input y presiona Enter:**

**Input value:** `""` (vacío)

**Parse:** `parseInputValue("") → 0`

**Request:**
```json
{
  "amountClp": 0
}
```

**Resultado:**
```
Presupuesto: $50,000
Actual:      $0
Δ:           -$50,000
%:           0.00%
```

---

## 12. Testing Manual

### 12.1. Checklist de Pruebas

#### Test 1: Carga Inicial
- [ ] Navegar a `/presupuesto/actual`
- [ ] Ver selectores de Año y Mes
- [ ] Ver categorías con datos (si hay presupuesto configurado)
- [ ] Ver balance en el header

#### Test 2: Cambiar Periodo
- [ ] Cambiar Año → recarga datos
- [ ] Cambiar Mes → recarga datos
- [ ] Ver loading state mientras carga

#### Test 3: Editar Monto (Primera Vez)
- [ ] Click en campo "Actual" (inicialmente $0)
- [ ] Input aparece con valor "0"
- [ ] Escribir `50000`
- [ ] Presionar Enter
- [ ] Ver "..." mientras guarda
- [ ] Ver nuevo valor, Δ y % actualizados

#### Test 4: Editar Monto (Update)
- [ ] Click en campo "Actual" con valor existente
- [ ] Modificar valor (ej: `50000` → `55000`)
- [ ] Hacer blur (click fuera)
- [ ] Ver actualización sin refrescar página completa

#### Test 5: pctExec null
- [ ] Buscar línea con budgetClp=0 (ej: AJUSTES)
- [ ] Verificar que % muestra "N/A", NO "0%"
- [ ] Color gris, no verde ni rojo

#### Test 6: Error 423 (Mes Bloqueado)
- [ ] En backend, hacer UPDATE actual_entries SET is_locked=1 WHERE...
- [ ] Intentar editar ese registro
- [ ] Ver mensaje: "Mes bloqueado. No puedes editar."
- [ ] Valor se revierte al original

#### Test 7: Formato de Números
- [ ] Pegar `450000` → debe parsear correctamente
- [ ] Pegar `450.000` → debe parsear correctamente
- [ ] Escribir `450000` → al guardar muestra `$450,000`
- [ ] Escribir `1234567` → muestra `$1,234,567`

#### Test 8: Colores
- [ ] INGRESOS: Δ positivo = verde, negativo = rojo
- [ ] EGRESOS: Δ negativo = verde (ahorro), positivo = rojo (exceso)
- [ ] %: 
   - Ingresos ≥100% = verde
   - Egresos ≤100% = verde
   - Otros casos = amarillo/rojo

#### Test 9: Expandir/Colapsar Categorías
- [ ] Click en header de categoría
- [ ] Tabla se oculta/muestra
- [ ] Icono cambia ▼/▶

#### Test 10: Navegación
- [ ] Sidebar muestra enlace "Actual" bajo "Presupuesto"
- [ ] Click en enlace navega correctamente
- [ ] URL es `/presupuesto/actual`

---

## 13. Estructura de Archivos Creados

```
node-version/client/src/
├── types/
│   └── actual.ts                          [NUEVO]
├── services/
│   └── actualApi.ts                       [NUEVO]
├── components/
│   └── actual/
│       ├── ActualTable.tsx                [NUEVO]
│       └── ActualRow.tsx                  [NUEVO]
├── pages/
│   └── Actual.tsx                         [NUEVO]
└── router.tsx                             [MODIFICADO]

node-version/client/src/components/
└── Sidebar.tsx                            [MODIFICADO - opcional]
```

---

## 14. Dependencias

**No se requieren nuevas dependencias.** Todo usa lo que ya está instalado:
- React 18
- TypeScript
- React Router DOM
- CSS modules (estilos existentes)

---

## 15. Mejoras Futuras (No en MVP)

### 15.1. Optimización de Updates
**Actual:** Cada update refetch completo del summary

**Mejora:** Update optimista
```typescript
// En ActualRow, después de guardar exitoso:
// 1. Actualizar solo la línea local sin refetch
const newLine = {
  ...line,
  actualClp: newAmount,
  deltaClp: newAmount - line.budgetClp,
  pctExec: line.budgetClp > 0 ? (newAmount / line.budgetClp) * 100 : null
};
// 2. Propagar a padre para actualizar totales
```

---

### 15.2. Filtros y Búsqueda
- Filtrar por categorías específicas
- Buscar por nombre de línea
- Mostrar solo líneas con desvío >10%

---

### 15.3. Acciones Batch
- Checkbox para seleccionar múltiples líneas
- Copiar actual desde presupuesto (bulk)
- Marcar como pagado (bulk)

---

### 15.4. Indicador de Cambios No Guardados
- Si usuario sale de la página con input abierto
- Confirmación: "¿Descartar cambios?"

---

### 15.5. Historial de Cambios
- Modal mostrando auditoría de ediciones
- Quién editó, cuándo, valor anterior/nuevo

---

### 15.6. Importación CSV
- Subir archivo con montos reales
- Mapear columnas a itemKey
- Importar batch

---

### 15.7. Dashboard y Gráficos
- Gráfico de barras: Presupuesto vs Actual
- Gráfico de pastel: Distribución de egresos
- Trend line: Evolución mensual

---

## 16. Consideraciones de Performance

### 16.1. Refetch Completo
**Actual:** Cada update llama `loadSummary()` completo (9 queries en backend)

**Impacto:** Con cache de 1 min en backend, no es crítico

**Si se necesita optimizar:**
```typescript
// Opción A: Update local sin refetch
const updateLineLocally = (itemKey: string, newAmount: number) => {
  setSummary(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.category !== category) return cat;
        return {
          ...cat,
          lines: cat.lines.map(line => {
            if (line.itemKey !== itemKey) return line;
            const deltaClp = newAmount - line.budgetClp;
            const pctExec = line.budgetClp > 0 
              ? (newAmount / line.budgetClp) * 100 
              : null;
            return {
              ...line,
              actualClp: newAmount,
              deltaClp,
              pctExec
            };
          })
        };
      })
    };
  });
};

// Opción B: Refetch solo después de X segundos de inactividad (debounce)
```

---

### 16.2. Renderizado de Tablas
**No hay problema con performance** porque:
- Max ~50 líneas por categoría
- React optimiza re-renders con keys correctas
- No hay scroll virtual necesario (aún)

---

## 17. Resumen de Criterios de Aceptación

✅ **Cargar página muestra datos del summary**
- GET /api/actual/summary funciona
- Categorías se renderizan correctamente

✅ **Editar un monto y salir del input hace PUT**
- onBlur o Enter → upsertActualEntry()
- Estado local se actualiza

✅ **pctExec null se muestra como "N/A"**
- Función `formatPctExec()` retorna "N/A" si null
- Color gris para null

✅ **Error 423 muestra aviso y revierte valor**
- try/catch captura error con message "LOCKED"
- Muestra tooltip rojo con mensaje
- Input mantiene valor original

✅ **Formato de números es-CL**
- `toLocaleString('es-CL')` para display
- Parse robusto para input (acepta puntos y comas)

✅ **Layout consistente con resto de páginas**
- Usa `<MainLayout>`
- Estilos reutilizan clases existentes

---

## 18. Notas Finales

### 18.1. Backend Debe Estar Running
```bash
cd node-version
npm run dev
# Server en http://localhost:3000
```

### 18.2. Frontend Dev Server
```bash
cd node-version/client
npm run dev
# App en http://localhost:5173
```

### 18.3. Testing con Datos de Prueba
Si no hay presupuesto configurado, primero:
1. Ir a `/ingresos` y configurar ingresos
2. Ir a `/servicios-basicos` y configurar servicios
3. Ir a `/supermercado` y configurar gastos
4. Luego ir a `/presupuesto/actual` para ver líneas

---

## Conclusión

La implementación proporciona una interfaz completa para ingresar y comparar montos reales vs presupuesto. La edición inline con validación de errores (especialmente lock) asegura una UX fluida. El código es modular y extensible para futuras mejoras como gráficos y dashboard.
