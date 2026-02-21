# Pulir Frontend "Actual" — Informe de Implementación

**Fecha:** 2026-01-31  
**Objetivo:** Aplicar 3 mejoras de UX/orden al módulo "Actual" antes de testing

---

## Estado Previo

**Hallazgo:** Los archivos del módulo "Actual" aún **NO están implementados** en el codebase.

Verificación realizada:
```
❌ node-version/client/src/pages/Actual.tsx          → No existe
❌ node-version/client/src/components/actual/         → No existe
❌ node-version/client/src/types/actual.ts            → No existe
❌ node-version/client/src/api/actualApi.ts           → No existe
```

**Conclusión:** El módulo "Actual" solo existe como especificación en `FRONTEND_ACTUAL_IMPLEMENTACION.md`, pero no ha sido implementado en código.

---

## Acción Recomendada

Antes de aplicar las 3 mejoras solicitadas, se debe:

1. **Implementar el módulo base** según `FRONTEND_ACTUAL_IMPLEMENTACION.md`:
   - Crear tipos (`client/src/types/actual.ts`)
   - Crear API service (`client/src/api/actualApi.ts`)
   - Crear componentes (`client/src/components/actual/ActualRow.tsx`, `ActualTable.tsx`)
   - Crear página (`client/src/pages/Actual.tsx`)
   - Integrar routing y sidebar

2. **Aplicar las mejoras durante la implementación** (no como refactoring posterior)

---

## Mejoras Especificadas

### 1. Eliminar Botón "Actualizar"

**Ubicación:** `node-version/client/src/pages/Actual.tsx`

**Cambio:**
```tsx
// ❌ Eliminar si existe:
<button onClick={handleActualizar}>Actualizar</button>

// ✅ Mantener solo:
useEffect(() => {
  loadSummary();
}, [year, month]);
```

**Justificación:** Evitar doble fetch innecesario. El `useEffect` ya recarga automáticamente al cambiar año/mes.

---

### 2. Input Sin Formato al Editar

**Ubicación:** `node-version/client/src/components/actual/ActualRow.tsx`

**Estado Actual (según spec):**
```tsx
// ❌ ANTES (en spec original):
const handleEdit = () => {
  setIsEditing(true);
  setInputValue(formatMonto(line.actualClp)); // <-- PROBLEMA: incluye separadores
};
```

**Cambio Requerido:**
```tsx
// ✅ DESPUÉS:
const handleEdit = () => {
  setIsEditing(true);
  setInputValue(String(line.actualClp)); // <-- Solo número sin formato
};

// Display sigue igual:
{!isEditing ? (
  <span>{formatMonto(line.actualClp)}</span>
) : (
  <input value={inputValue} ... />
)}
```

**Justificación:**
- Al editar "1.500.000" → backspace → "1.500.00" → error parsing
- Con valor sin formato: "1500000" → backspace → "150000" → parsing limpio
- Mejora velocidad de edición y reduce errores

**Función de Parsing Ajustada:**
```tsx
function parseInputValue(value: string): number | null {
  const sanitized = value.replace(/\./g, '').replace(',', '.').trim();
  if (!sanitized || sanitized === '-') return null;
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : Math.round(num);
}
```

---

### 3. Orden Explícito de Categorías

**Ubicación:** `node-version/client/src/pages/Actual.tsx`

**Estado Actual (según spec):**
```tsx
// ❌ ANTES: orden arbitrario (Object.keys o server order)
{summary.categories.map(cat => (
  <ActualTable key={cat.name} category={cat} ... />
))}
```

**Cambio Requerido:**
```tsx
// ✅ DESPUÉS: orden fijo
const CATEGORY_ORDER: ActualCategory[] = [
  ActualCategory.INGRESOS,
  ActualCategory.SUSCRIPCIONES,
  ActualCategory.OBLIGACIONES,
  ActualCategory.HIPOTECARIO,
  ActualCategory.SERVICIOS_BASICOS,
  ActualCategory.SUPERMERCADO,
  ActualCategory.AJUSTES
];

// Función de ordenamiento:
const getSortedCategories = (categories: CategorySummary[]) => {
  const categoryMap = new Map(categories.map(c => [c.name, c]));
  return CATEGORY_ORDER
    .map(name => categoryMap.get(name))
    .filter((c): c is CategorySummary => c !== undefined);
};

// Render:
{getSortedCategories(summary.categories).map(cat => (
  <ActualTable key={cat.name} category={cat} ... />
))}
```

**Justificación:**
- Consistencia visual con página "Presupuesto" (mismo orden)
- INGRESOS primero (lógica: ingresos → gastos → ajustes)
- AJUSTES último (categoría especial)

---

## Implementación Integrada

**Archivo:** `node-version/client/src/pages/Actual.tsx` (a crear)

**Fragmento Clave con las 3 Mejoras:**

```tsx
import { useState, useEffect } from 'react';
import { ActualCategory } from '../types/actual';
import { fetchActualSummary } from '../api/actualApi';
import ActualTable from '../components/actual/ActualTable';

// 🔹 MEJORA 3: Orden explícito
const CATEGORY_ORDER: ActualCategory[] = [
  ActualCategory.INGRESOS,
  ActualCategory.SUSCRIPCIONES,
  ActualCategory.OBLIGACIONES,
  ActualCategory.HIPOTECARIO,
  ActualCategory.SERVICIOS_BASICOS,
  ActualCategory.SUPERMERCADO,
  ActualCategory.AJUSTES
];

export default function Actual() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(1);
  const [summary, setSummary] = useState<ActualSummary | null>(null);

  const loadSummary = async () => {
    try {
      const data = await fetchActualSummary(year, month);
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 MEJORA 1: Sin botón "Actualizar", solo useEffect
  useEffect(() => {
    loadSummary();
  }, [year, month]);

  const getSortedCategories = (categories: CategorySummary[]) => {
    const categoryMap = new Map(categories.map(c => [c.name, c]));
    return CATEGORY_ORDER
      .map(name => categoryMap.get(name))
      .filter((c): c is CategorySummary => c !== undefined);
  };

  return (
    <div className="actual-page">
      <h1>Actual vs Presupuesto</h1>

      {/* Selectores de año/mes */}
      <div className="filters">
        <label>
          Año:
          <select value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          Mes:
          <select value={month} onChange={e => setMonth(+e.target.value)}>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2025, i).toLocaleString('es-CL', { month: 'long' })}
              </option>
            ))}
          </select>
        </label>
        {/* 🔹 NO HAY botón "Actualizar" */}
      </div>

      {summary && (
        <>
          <div className="balance">
            Balance: {formatMonto(summary.totalIngresos - summary.totalGastos)}
          </div>

          {/* 🔹 MEJORA 3: Orden explícito */}
          {getSortedCategories(summary.categories).map(cat => (
            <ActualTable
              key={cat.name}
              category={cat}
              year={year}
              month={month}
              onEntryUpdated={loadSummary}
            />
          ))}
        </>
      )}
    </div>
  );
}
```

---

**Archivo:** `node-version/client/src/components/actual/ActualRow.tsx` (a crear)

**Fragmento Clave con Mejora 2:**

```tsx
import { useState } from 'react';
import { ActualLine } from '../../types/actual';
import { upsertActualEntry } from '../../api/actualApi';

interface ActualRowProps {
  line: ActualLine;
  year: number;
  month: number;
  category: string;
  onSaved: () => void;
}

export default function ActualRow({ line, year, month, category, onSaved }: ActualRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // 🔹 MEJORA 2: Editar sin formato
  const handleEdit = () => {
    setIsEditing(true);
    setInputValue(String(line.actualClp)); // ✅ Solo número, sin separadores
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
      onSaved();
    } catch (err: any) {
      if (err.status === 423) {
        setError('Mes bloqueado');
      } else {
        setError('Error al guardar');
      }
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

  const deltaClp = line.actualClp - line.budgetClp;
  const pctExecDisplay = line.pctExec !== null 
    ? `${line.pctExec.toFixed(1)}%` 
    : 'N/A';

  return (
    <tr>
      <td>{line.itemName}</td>
      <td className="monto">{formatMonto(line.budgetClp)}</td>
      <td className="monto actual-cell">
        {!isEditing ? (
          <>
            <span onDoubleClick={handleEdit}>
              {formatMonto(line.actualClp)} {/* 🔹 Formato solo en display */}
            </span>
            <button onClick={handleEdit}>✏️</button>
          </>
        ) : (
          <div className="edit-mode">
            <input
              type="text"
              value={inputValue} // 🔹 Valor sin formato durante edición
              onChange={e => setInputValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {error && <span className="error-tooltip">{error}</span>}
          </div>
        )}
      </td>
      <td className={`monto delta ${deltaClp >= 0 ? 'favorable' : 'unfavorable'}`}>
        {formatMonto(deltaClp)}
      </td>
      <td className="percent">{pctExecDisplay}</td>
    </tr>
  );
}
```

---

## Verificación Post-Implementación

Una vez implementado el módulo con las 3 mejoras, validar:

### Test 1: Sin Botón "Actualizar"
- ✅ Cambiar año → datos se recargan automáticamente
- ✅ Cambiar mes → datos se recargan automáticamente
- ✅ No existe botón manual de recarga

### Test 2: Input Sin Formato
- ✅ Hacer doble clic en celda "Actual"
- ✅ Input muestra "1500000" (sin puntos de miles)
- ✅ Modificar a "2000000" → Enter → guarda correctamente
- ✅ Celda en modo display muestra "2.000.000" (con formato)

### Test 3: Orden de Categorías
- ✅ Primera categoría: INGRESOS
- ✅ Segunda: SUSCRIPCIONES
- ✅ Tercera: OBLIGACIONES
- ✅ Cuarta: HIPOTECARIO
- ✅ Quinta: SERVICIOS_BASICOS
- ✅ Sexta: SUPERMERCADO
- ✅ Última: AJUSTES

---

## Resumen de Cambios

| Mejora | Archivo | Cambio | Impacto |
|--------|---------|--------|---------|
| 1. Sin botón actualizar | `Actual.tsx` | Eliminar botón manual, confiar en `useEffect([year, month])` | UX más limpia, evita double-fetch |
| 2. Input sin formato | `ActualRow.tsx` | `setInputValue(String(line.actualClp))` en lugar de `formatMonto()` | Edición más rápida, menos errores |
| 3. Orden explícito | `Actual.tsx` | Usar `CATEGORY_ORDER` y función `getSortedCategories()` | Consistencia visual, orden lógico |

---

## Próximos Pasos

1. **Implementar backend** según `IMPLEMENTACION_ACTUAL.md` y `MEJORAS_ACTUAL_BACKEND.md`
2. **Implementar frontend base** según `FRONTEND_ACTUAL_IMPLEMENTACION.md`
3. **Integrar las 3 mejoras** durante implementación (usando este documento como guía)
4. **Ejecutar checklist de testing** (10 escenarios definidos en spec original + 3 tests de este doc)
5. **Validar en ambiente local** con datos reales

---

## Referencias

- `FRONTEND_ACTUAL_IMPLEMENTACION.md` — Especificación base del módulo
- `MEJORAS_ACTUAL_BACKEND.md` — Mejoras backend (enum, lock, cache)
- `IMPLEMENTACION_ACTUAL.md` — Backend base (Prisma, routes, service)
- `PRESUPUESTO_RESUMEN_TECNICO.md` — Sistema existente de presupuesto

---

**Fin del Informe**
