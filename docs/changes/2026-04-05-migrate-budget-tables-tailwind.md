# Migración de Componentes de Presupuesto y Actual de RSuite a Tailwind

**Fecha**: 2026-04-05  
**Tipo**: Refactor - Migración UI  
**Impacto**: Medium - Cambios visuales mínimos, mejora de mantenibilidad  
**Branch**: `refactor/remove-tenpo-bonos-tc-modules`

## Resumen

Migración completa de:
- 4 componentes de tablas de presupuesto
- 4 componentes de tracking de gastos reales (/actual)

Total: **8 componentes** migrados de RSuite a Tailwind + primitivos reutilizables, cumpliendo con las reglas de arquitectura UI de Zapp.

## Cambios Realizados

### 1. Componente Reusable Creado

**Ubicación**: [`node-version/client/src/components/ui/EditableCell.tsx`](../../node-version/client/src/components/ui/EditableCell.tsx)

- Celda de tabla editable inline para valores monetarios
- Tailwind-first, sin dependencias de RSuite
- Funcionalidades:
  - Click para editar
  - Enter/blur para guardar
  - Escape para cancelar
  - Estados: editing, saving, error
  - Formateo CLP con guion para $0
- **Interfaz**:
  ```typescript
  interface EditableCellProps {
    value: number;
    onSave: (newValue: number) => Promise<void>;
    disabled?: boolean;
    className?: string;
  }
  ```

### 2. Componentes Migrados

#### ✅ TablaPresupuestoIngresos
- **Antes**: RSuite Table + Input + Button
- **Ahora**: HTML table + EditableCell + primitivos Button
- **Endpoint**: `GET /api/ingresos/presupuesto/:anio`, `PATCH /api/ingresos/presupuesto/:id/:anio/:mes`
- **Features**: Sticky headers, sticky total column, Material icons

#### ✅ TablaPresupuestoAhorros
- **Antes**: RSuite Table + Input + Button
- **Ahora**: HTML table + EditableCell + primitivos Button
- **Endpoint**: `GET /api/ahorros/presupuesto/:anio`, `PATCH /api/ahorros/presupuesto/:id/:anio/:mes`
- **Features**: Sticky headers, sticky total column, tertiary color scheme

#### ✅ TablaPresupuestoServicios
- **Antes**: RSuite Table + Input + Button
- **Ahora**: HTML table + EditableCell + primitivos Button
- **Endpoint**: `GET /api/servicios-basicos/presupuesto/:anio`, `PATCH /api/servicios-basicos/presupuesto/:id/:anio/:mes`
- **Features**: Sticky headers, secondary color scheme

#### ✅ TablaPresupuestoSupermercado
- **Antes**: RSuite Table únicamente
- **Ahora**: HTML table + EditableCell + primitivos
- **Endpoint**: `GET /api/supermercado/presupuesto/:anio`, `PATCH /api/supermercado/presupuesto/:anio/:mes`
- **Features**: Fila única de datos + fila total, diseño simplificado

### 3. Componentes /actual Migrados

#### ✅ ActualEditableCell
- **Antes**: Inline styles con div/input
- **Ahora**: Tailwind classes con Material icons
- **Endpoint**: `POST /api/actual/`, `PATCH /api/actual/:id`
- **Features**: Edición inline con validación de mes bloqueado, icono hover, API integration

#### ✅ ActualRow
- **Antes**: Inline styles para delta calculation display
- **Ahora**: Tailwind classes con colores semánticos (success/error)
- **Features**: Delta calculado (budget vs actual), porcentaje de ejecución, colores favorable/unfavorable

#### ✅ CategoryBarChart
- **Antes**: RSuite Panel/Button/Stack + Recharts
- **Ahora**: Tailwind divs + primitives/Button + Recharts
- **Endpoint**: Datos agregados desde actualData prop
- **Features**: Gráfico de barras por categoría, clickable bars para filtrado, botón clear filter

#### ✅ MonthlyPaymentPanel
- **Antes**: RSuite Panel/Button/InputNumber/Input/Divider/Stack/Table/IconButton
- **Ahora**: Tailwind divs + primitives/Button + primitives/Input + HTML table
- **Endpoint**: `GET /api/actual/:year/:month/:category`, `POST /api/actual/`, `DELETE /api/actual/:id`
- **Features**: 
  - Total summary con bg-success
  - Pago por selección con validación
  - Agregar pago manual
  - Historial de pagos con tabla scrollable
  - Material Symbol 'delete' icon para eliminar

## Mejoras Arquitectónicas

### ❌ Removido (Presupuesto)
- `import { Table, Input, Button } from 'rsuite'`
- Wrappers `CompactCell` y `CompactHeaderCell`
- Funciones `prepararDatosTabla()` - ya no se necesitan con renderizado directo
- Estados `editando` y `guardando` (manejados por EditableCell)
- Conversión de string a número en componentes (se hace en EditableCell)

### ❌ Removido (/actual)
- `import { Panel, Button, Stack } from 'rsuite'` (CategoryBarChart)
- `import { Panel, Button, InputNumber, Input, Divider, Stack, Table, IconButton } from 'rsuite'` (MonthlyPaymentPanel)
- `import TrashIcon from '@rsuite/icons/Trash'`
- Inline styles en ActualEditableCell y ActualRow
- RSuite Table/Column/HeaderCell/Cell components

### ✅ Agregado (Presupuesto)
- Componente reutilizable `EditableCell`
- Exports en `components/ui/index.ts`
- HTML semántico (`<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`)
- Tailwind utilities para toda la estética
- Design tokens de Zapp (primary, secondary, tertiary)
- Estados vacíos con `EmptyState` component
- Loading con `LoadingSpinner` component

### ✅ Agregado (/actual)
- `import { Button } from '../primitives'` (CategoryBarChart, MonthlyPaymentPanel)
- `import { Input } from '../primitives'` (MonthlyPaymentPanel)
- Tailwind classes consistentes (bg-white, rounded-[24px], shadow-sm, p-6, etc.)
- Material Symbols icon 'delete' para eliminar pagos
- HTML table semántica en MonthlyPaymentPanel
- Estados de loading y empty mejorados
- Colores semánticos (success, error, info) para validaciones

## Clases Tailwind Usadas

### Presupuesto
```css
/* Table base */
.bg-white .rounded-[24px] .shadow-sm .overflow-hidden

/* Headers */
.sticky .top-0 .bg-surface-container .z-10

/* Cells */
.px-4 .py-2 /* spacing */
.text-xs /* font size */
.border-b .border-outline-variant /* bordes */
.hover:bg-surface-container/50 /* interacción */
.tabular-nums /* números alineados */

/* Sticky columns */
.sticky .right-0 .backdrop-blur-sm /* columna total fija */

/* Total row */
.bg-primary-container/20 /* ingresos */
.bg-tertiary-container/20 /* ahorros */
.bg-secondary-container/20 /* servicios */
.border-t-2 .border-primary /* separador */
```

### /actual
```css
/* Panel containers */
.bg-white .h-full .flex .flex-col .overflow-hidden

/* Charts */
.bg-white .rounded-[24px] .shadow-sm .p-6 .mb-6 .border .border-outline-variant/30

/* Payment panel sections */
.px-4 .py-3 .flex-shrink-0
.bg-surface-container/20 /* summary background */
.bg-info-container/15 .border-info/30 /* selection active */
.bg-success /* total pagado color */

/* Dividers */
.border-outline-variant/20

/* Tables */
.divide-y .divide-outline-variant/20
.hover:bg-surface-container/10 .transition-colors

/* Icons */
.material-symbols-outlined .text-base
.text-error .hover:bg-error/10 /* delete button */
```

## Patrones de Color

| Tabla | Color Principal | Uso |
|-------|----------------|-----|
| Ingresos | `primary` (#175ab1) | Fila total, highlights |
| Ahorros | `tertiary` | Fila total, highlights |
| Servicios | `secondary` | Fila total, highlights |
| Supermercado | `primary` | Fila total |

## Testing Requerido

### Funcionalidad
- [ ] Edición inline de celdas (click, Enter, Escape)
- [ ] Guardado de valores (commit on blur)
- [ ] Cálculo de totales mensuales
- [ ] Cálculo de total anual
- [ ] Sticky header en scroll vertical
- [ ] Sticky columna total en scroll horizontal
- [ ] Estados vacíos (sin datos)
- [ ] Loading states

### Visual
- [ ] Consistencia de spacing
- [ ] Hover states en celdas
- [ ] Colores de tokens correctos
- [ ] Responsive (overflow-x-auto)
- [ ] Formato CLP correcto

## Impacto en Usuarios

### Cambios Visibles
- ⚠️ Mínimos cambios visuales (mismo layout)
- ✅ Mejor contraste en filas totales
- ✅ Hover más suave (Tailwind transitions)
- ✅ Icons de Material Symbols (en EmptyState)

### Mejoras UX
- ✅ Edición inline más fluída
- ✅ Feedback visual mejorado (estados hover)
- ✅ Estados vacíos más claros
- ✅ Performance mejorada (menos JS, más CSS)

## Compatibilidad

- ✅ APIs sin cambios
- ✅ Props de componentes iguales
- ✅ Lógica de negocio intacta
- ✅ Endpoints idénticos

## Próximos Pasos

Esta migración es parte del esfuerzo mayor de remover RSuite completamente. Componentes restantes con RSuite (10 componentes):

- `SubscriptionTable.tsx`
- `AddSubscriptionForm.tsx`
- `ObligacionForm.tsx`
- `VistaPreviaObligacion.tsx`
- `GestionarAhorrosModal.tsx`
- `GestionarCatalogoModal.tsx`
- `GestionarIngresosModal.tsx`
- `YearAndUFSelector.tsx`
- `Sidebar.tsx`
- `TablaObligaciones.tsx`

**Componentes completamente limpios de RSuite** (8 componentes):
- ✅ TablaPresupuestoIngresos
- ✅ TablaPresupuestoAhorros
- ✅ TablaPresupuestoServicios
- ✅ TablaPresupuestoSupermercado
- ✅ ActualEditableCell
- ✅ ActualRow
- ✅ CategoryBarChart
- ✅ MonthlyPaymentPanel

## Referencias

- [UI Architecture Rules](../../.github/instructions/ui-architecture-zapp.instructions.md)
- [UI Components Standards](../../.github/instructions/ui-components-zapp.instructions.md)
- [Component Lifecycle](vscode-userdata:/c%3A/Users/sceba/AppData/Roaming/Code/User/prompts/component-lifecycle.instructions.md)
