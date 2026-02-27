# Análisis Detallado - Página "Actual vs Presupuesto"

## 📍 Información General

- **URL**: `http://localhost:5173/actual?year=2026&month=3`
- **Ruta Frontend**: `/actual`
- **Componente Principal**: `node-version/client/src/pages/Actual.tsx`
- **API Backend**: `node-version/src/routes/actual.ts`

---

## 🎯 Propósito de la Página

página que muestra una comparación entre el **Presupuesto** planificado y el gasto/ingreso **Real (Actual)** para un mes y año específico. Permite:

1. **Visualizar diferencias** entre lo presupuestado y lo real
2. **Editar montos reales** inline (doble clic o botón ✏️)
3. **Calcular automáticamente** deltas y porcentajes de ejecución
4. **Ver balance global** (Total Ingresos - Total Gastos)

---

## 📊 Estructura de Datos

### Endpoint Principal
```
GET /api/actual/summary?year=2026&month=3
```

### Respuesta del Backend
```json
{
  "year": 2026,
  "month": 3,
  "totalIngresos": 3551910,
  "totalGastos": 3150309,
  "balance": 401601,
  "categories": [
    {
      "name": "INGRESOS",
      "budgetClp": 15050000,
      "actualClp": 3551910,
      "deltaClp": -11498090,
      "pctExec": 23.6,
      "lines": [
        {
          "itemKey": "sueldo_liquido",
          "itemName": "Sueldo líquido",
          "budgetClp": 2900000,
          "actualClp": 3001910,
          "deltaClp": 101910,
          "pctExec": 103.5,
          "isPaid": true
        }
      ]
    }
  ]
}
```

### Categorías Disponibles (en orden)
1. **INGRESOS** → "Ingresos"
2. **SUSCRIPCIONES** → "Suscripciones"
3. **OBLIGACIONES** → "Créditos y Seguros"
4. **HIPOTECARIO** → "Hipotecario"
5. **SERVICIOS_BASICOS** → "Servicios Básicos"
6. **SUPERMERCADO** → "Supermercado"
7. **PAGO_TC** → "PAGO_TC"
8. **AJUSTES** → "Ajustes"

---

## 🧩 Arquitectura de Componentes

### 1. Página Principal: `Actual.tsx`
**Ubicación**: `node-version/client/src/pages/Actual.tsx`

**Responsabilidades**:
- Controla año/mes actual mediante hook `useYearMonth()`
- Carga datos desde API (`fetchActualSummary`)
- Renderiza sección de balance global
- Renderiza cada categoría mediante `<ActualTable>`
- Gestiona actualización optimista del estado tras editar items

**Estados clave**:
```tsx
const [summary, setSummary] = useState<ActualSummary | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
```

**Layout usado**:
```tsx
<MainLayout>
  <div className="container">
    <PageTitleSection ... />
    {balance-section}
    {categories.map -> <ActualTable />}
  </div>
</MainLayout>
```

---

### 2. Componente Layout: `MainLayout.tsx`
**Ubicación**: `node-version/client/src/layout/MainLayout.tsx`

**Estructura**:
```tsx
<div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
  <Sidebar />
  <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
    {children}
  </main>
</div>
```

- Sidebar fijo a la izquierda (usando RSuite)
- Main ocupa el resto del espacio con scroll vertical

---

### 3. Componente Header: `PageTitleSection.tsx`
**Ubicación**: `node-version/client/src/layout/PageTitleSection.tsx`

**Uso**:
```tsx
<PageTitleSection
  title="Actual vs Presupuesto"
  actions={
    <YearMonthPicker 
      year={year} 
      month={month} 
      onChangeYear={setYear} 
      onChangeMonth={setMonth} 
    />
  }
/>
```

**Estructura HTML**:
```html
<div class="page-title-section">
  <div class="page-title-content">
    <h1 class="page-title">Actual vs Presupuesto</h1>
  </div>
  <div class="page-actions">
    {YearMonthPicker}
  </div>
</div>
```

**Estilos CSS** (`index.css`):
```css
.page-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}
.page-title {
  font-size: 2rem;
  font-weight: 500;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}
```

---

### 4. Selector de Período: `YearMonthPicker.tsx`
**Ubicación**: `node-version/client/src/components/common/YearMonthPicker.tsx`

**Librería usada**: RSuite (`SelectPicker`)

**Props**:
```tsx
{
  year: number;
  month: number;
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
  minYear?: number;
  maxYear?: number;
}
```

**Renderizado**:
```tsx
<Stack spacing={10}>
  <SelectPicker 
    data={years} 
    value={year} 
    style={{ width: 100 }}
  />
  <SelectPicker 
    data={MESES} 
    value={month} 
    style={{ width: 140 }}
  />
</Stack>
```

---

### 5. Sección de Balance Global
**Ubicación**: Inline en `Actual.tsx`

**Código**:
```tsx
<div className="balance-section" style={{
  display: 'flex',
  justifyContent: 'space-between',
  padding: '1.5rem',
  background: 'white',
  borderRadius: '8px',
  marginBottom: '2rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}}>
  <div>
    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
      Total Ingresos
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
      {formatMonto(summary.totalIngresos)}
    </div>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
      Total Gastos
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--danger)' }}>
      {formatMonto(summary.totalGastos)}
    </div>
  </div>
  <div>
    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
      Balance
    </div>
    <div style={{ 
      fontSize: '1.5rem', 
      fontWeight: '700',
      color: summary.balance >= 0 ? 'var(--success)' : 'var(--danger)'
    }}>
      {formatMonto(summary.balance)}
    </div>
  </div>
</div>
```

**Variables CSS usadas**:
```css
--success: #10b981;  /* Verde para positivo */
--danger: #ef4444;   /* Rojo para negativo */
--gray-700: #374151;
```

---

### 6. Tabla por Categoría: `ActualTable.tsx`
**Ubicación**: `node-version/client/src/components/actual/ActualTable.tsx`

**Props**:
```tsx
{
  category: CategorySummary;
  year: number;
  month: number;
  onEntryUpdated: (categoryName, itemKey, newAmount) => void;
}
```

**Estructura**:
1. **Header colapsable** (clic para expandir/colapsar)
2. **Tabla HTML** con líneas de ítems

**Header HTML**:
```tsx
<div 
  className="category-header" 
  onClick={() => setExpanded(!expanded)}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    background: 'var(--gray-100)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  }}
>
  <div>
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
```

**Tabla HTML**:
```tsx
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
    {category.lines.map(line => (
      <ActualRow 
        key={line.itemKey}
        line={line}
        year={year}
        month={month}
        category={category.name}
        onSaved={(newAmount) => onEntryUpdated(...)}
      />
    ))}
  </tbody>
</table>
```

**Estilos aplicados** (de `index.css`):
```css
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  background: var(--gray-50);
}
th {
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--gray-700);
  border-bottom: 2px solid var(--gray-200);
}
td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.875rem;
}
tr:hover {
  background: var(--gray-50);
}
```

**Nota**: La clase `.tabla-presupuesto` no está definida en CSS, pero se renderiza. Se podría agregar estilos específicos.

---

### 7. Fila Editable: `ActualRow.tsx`
**Ubicación**: `node-version/client/src/components/actual/ActualRow.tsx`

**Props**:
```tsx
{
  line: ActualLine;
  year: number;
  month: number;
  category: ActualCategory;
  onSaved: (newAmount: number) => void;
}
```

**Funcionalidad**:
- Modo **vista**: muestra monto con botón ✏️
- Modo **edición**: input text para modificar monto
- Guardar: al blur del input o Enter
- Cancelar: al presionar Escape
- Error visual si falla guardado (tooltip rojo)

**Renderizado**:
```tsx
<tr>
  <td>{line.itemName}</td>
  <td className="monto">{formatMonto(line.budgetClp)}</td>
  <td className="monto actual-cell">
    {!isEditing ? (
      <>
        <span onDoubleClick={handleEdit}>{formatMonto(line.actualClp)}</span>
        <button onClick={handleEdit}>✏️</button>
      </>
    ) : (
      <div className="edit-mode">
        <input 
          type="text"
          value={inputValue}
          onChange={...}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {error && <span className="error-tooltip">{error}</span>}
      </div>
    )}
  </td>
  <td className={`monto delta ${deltaClass}`}>
    {formatMonto(deltaClp)}
  </td>
  <td className="percent">{pctExecDisplay}</td>
</tr>
```

**Lógica de color del delta**:
```tsx
const isIncome = category === ActualCategory.INGRESOS;
const deltaClass = deltaClp === 0 ? '' : 
  (isIncome ? 
    (deltaClp > 0 ? 'favorable' : 'unfavorable') : 
    (deltaClp < 0 ? 'favorable' : 'unfavorable')
  );
```

**Significado**:
- En **INGRESOS**: Delta positivo = favorable (mayor ingreso real)
- En **GASTOS**: Delta negativo = favorable (gastaste menos)

**Clases CSS**: `.favorable` y `.unfavorable` **NO están definidas** en `index.css`. Se podrían agregar:
```css
.delta.favorable { color: var(--success); }
.delta.unfavorable { color: var(--danger); }
```

---

## 🎨 Sistema de Estilos

### Variables CSS (`:root`)
```css
--primary: #2563eb;
--primary-dark: #1d4ed8;
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-700: #374151;
--gray-900: #111827;
--success: #10b981;
--danger: #ef4444;
```

### Clases Clave
- `.container`: max-width 1400px, padding 2rem
- `.page-title-section`: flex, justify-between
- `.balance-section`: flex inline styles (no en CSS)
- `.category-header`: inline styles (no en CSS)
- `.tabla-presupuesto`: sin estilos específicos (hereda de `table`)
- `.monto`: sin定義 (se usa como className pero no hay CSS)
- `.percent`: sin定義
- `.favorable` / `.unfavorable`: sin定義

### Librerías UI Usadas
- **RSuite 6.1.2**: Para `SelectPicker`, `Sidenav`, `Stack`
- **React Router**: Para navegación

---

## 🔄 Flujo de Interacción del Usuario

### Al Cargar la Página
1. Hook `useYearMonth()` lee año/mes de URL params o usa defaults
2. `useEffect` ejecuta `loadSummary()` al cambiar año/mes
3. `fetchActualSummary(year, month)` llama a `/api/actual/summary`
4. Backend:
   - Lee presupuesto del mes (`getMonthlyBudget`)
   - Lee entradas actuales de DB (`prisma.actualEntry.findMany`)
   - Merge y calcula deltas/porcentajes
5. Frontend actualiza `summary` y renderiza

### Al Cambiar Año/Mes
1. Usuario selecciona en `YearMonthPicker`
2. Se ejecuta `setYear` / `setMonth`
3. Hook `useYearMonth` actualiza URL params
4. `useEffect` detecta cambio y recarga datos

### Al Editar un Monto
1. Usuario hace doble clic o presiona ✏️ en celda "Actual"
2. `ActualRow` entra en modo edición (`isEditing = true`)
3. Input se muestra con valor actual
4. Usuario modifica y presiona Enter o blur
5. `handleSave` llama a `upsertActualEntry` (PUT `/api/actual/entry`)
6. Backend valida, verifica lock, y guarda en DB
7. Frontend:
   - Si OK: ejecuta `onSaved(newAmount)` → actualización optimista en `Actual.tsx`
   - Si error 423: muestra "Mes bloqueado"
   - Si otro error: muestra "Error al guardar"

---

## 🚀 APIs Backend

### 1. PUT/POST `/api/actual/entry`
**Request Body**:
```json
{
  "year": 2026,
  "month": 3,
  "category": "SERVICIOS_BASICOS",
  "itemKey": "luz",
  "label": "Luz",
  "amountClp": 52153,
  "isPaid": true
}
```

**Validaciones**:
- Año: 2000-2100
- Mes: 1-12
- Category: debe estar en `VALID_CATEGORIES`
- itemKey: string no vacío
- amountClp: entero >= 0
- label: requerido para category "AJUSTES"

**Lock Check**: Si `isLocked = true` en entry existente → 423 "Mes bloqueado"

**Operación**: Upsert en `actualEntry` (crea o actualiza)

---

### 2. GET `/api/actual/summary?year=2026&month=3`
**Response**: Ver estructura JSON arriba

**Lógica**:
1. Lee presupuesto del mes (de múltiples tablas)
2. Lee actual entries (tabla `actualEntry`)
3. Merge línea por línea:
   - Si existe en budget → presupuesto conocido
   - Si existe en actual → monto real
   - Si solo en actual → línea de ajuste
4. Calcula deltas (`actualClp - budgetClp`)
5. Calcula % ejecución (`actualClp / budgetClp * 100`)
6. Suma por categoría y global

---

### 3. GET `/api/actual/entries?year=2026&month=3&category=INGRESOS`
**Response**: Array de entries de DB

**Uso**: Listar todas las entradas (opcional, no usado en UI actual)

---

### 4. DELETE `/api/actual/entry/:id`
**Uso**: Eliminar entry (opcional, no usado en UI actual)

---

## ⚠️ Puntos de Mejora Detectados

### 1. **Estilos Faltantes**
- `.tabla-presupuesto` sin estilos específicos
- `.monto`, `.percent` sin estilos (probablemente necesitan text-align: right)
- `.favorable`, `.unfavorable` sin estilos (necesitan colores)
- `.actual-cell` sin estilos

**Solución**: Agregar en `index.css`:
```css
.tabla-presupuesto .monto {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.tabla-presupuesto .percent {
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.delta.favorable {
  color: var(--success);
  font-weight: 500;
}
.delta.unfavorable {
  color: var(--danger);
  font-weight: 500;
}
```

---

### 2. **UX del Modo Edición**
- Botón ✏️ podría ser más visible o estilizado
- Input en modo edición muy básico (sin borde claro)
- Error tooltip puede quedar oculto si tabla tiene scroll

**Solución**:
- Botón con hover state
- Input con borde destacado
- Mejorar posicionamiento del tooltip

---

### 3. **Categoría "PAGO_TC"**
- El label "PAGO_TC" no es user-friendly (debería ser "Pagos TC" o similar)

**Solución**: Agregar en `CATEGORY_LABELS`:
```tsx
[ActualCategory.PAGO_TC]: 'Pagos TC',
```

---

### 4. **Responsividad**
- Balance section con `flexbox` puede romperse en móvil
- Tablas sin scroll horizontal en pantallas pequeñas
- Header de categoría con múltiples spans puede verse apretado

**Solución**:
- Media queries para balance section (stack vertical en móvil)
- Wrapper con `overflow-x: auto` en tablas
- Breakpoint para header de categoría

---

### 5. **Loading State**
- "Cargando..." muy simple (sin spinner)

**Solución**: Usar spinner de RSuite:
```tsx
import { Loader } from 'rsuite';
<Loader size="lg" content="Cargando datos..." center />
```

---

### 6. **Accesibilidad**
- Botón ✏️ sin `aria-label`
- Input sin `aria-label` en modo edición
- Headers de tabla podrían tener mejor semántica

---

### 7. **Formato de Números**
- Usa `toLocaleString('es-CL')` que funciona bien
- Pero no hay separador de miles en input al editar (confuso para usuarios)

**Solución**: Input con formato real-time o placeholder con ejemplo

---

### 8. **Performance**
- `loadSummary()` se ejecuta en cada cambio de año/mes (OK)
- Pero si cambian rápido (ej: clicking múltiple) no hay debounce
- No hay cache de datos

**Solución**:
- Implementar cache simple con React Query o similar
- Mostrar datos previos mientras carga nuevos

---

### 9. **Feedback de Guardado**
- No hay confirmación visual de que el save fue exitoso
- Solo error si falla

**Solución**: Toast success al guardar

---

### 10. **Inconsistencia Visual**
- Balance section usa inline styles
- Category header usa inline styles
- Mezcla de enfoques (CSS clases vs inline)

**Solución**: Refactor a CSS classes o styled-components

---

## 📱 Comportamiento Mobile

**Estado Actual**:
- Sidebar RSuite se adapta (colapsa)
- Tablas pueden desbordar sin scroll
- Balance section puede verse apretado
- SelectPickers de RSuite son mobile-friendly

**Recomendaciones**:
1. Agregar `.table-container` con `overflow-x: auto`
2. Balance section:
   ```css
   @media (max-width: 768px) {
     .balance-section {
       flex-direction: column !important;
       gap: 1rem;
     }
   }
   ```
3. Category header: stack en mobile

---

## 🎯 Ejemplo de Mejora Visual

### Antes (Actual)
```tsx
<div className="balance-section" style={{ ... }}>
  <div>
    <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
      Total Ingresos
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
      3.551.910
    </div>
  </div>
  ...
</div>
```

### Después (Propuesto)
```tsx
<div className="balance-cards">
  <div className="balance-card balance-card--income">
    <div className="balance-card__label">Total Ingresos</div>
    <div className="balance-card__value">3.551.910</div>
    <div className="balance-card__icon">💰</div>
  </div>
  <div className="balance-card balance-card--expense">
    <div className="balance-card__label">Total Gastos</div>
    <div className="balance-card__value">3.150.309</div>
    <div className="balance-card__icon">💸</div>
  </div>
  <div className="balance-card balance-card--balance balance-card--positive">
    <div className="balance-card__label">Balance</div>
    <div className="balance-card__value">401.601</div>
    <div className="balance-card__icon">✅</div>
  </div>
</div>
```

**CSS**:
```css
.balance-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}
.balance-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.balance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.balance-card__label {
  font-size: 0.875rem;
  color: var(--gray-600);
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.balance-card__value {
  font-size: 1.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.balance-card__icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 2rem;
  opacity: 0.2;
}
.balance-card--income .balance-card__value {
  color: var(--success);
}
.balance-card--expense .balance-card__value {
  color: var(--danger);
}
.balance-card--positive .balance-card__value {
  color: var(--success);
}
.balance-card--negative .balance-card__value {
  color: var(--danger);
}

@media (max-width: 768px) {
  .balance-cards {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎨 Propuesta de Mejora de Tablas

### Header de Categoría con Badge de % Ejecución

```tsx
<div className="category-header" onClick={...}>
  <div className="category-header__left">
    <span className="category-header__icon">{expanded ? '▼' : '▶'}</span>
    <span className="category-header__name">{categoryLabel}</span>
    <span className={`category-header__badge ${getBadgeClass(pctExec)}`}>
      {pctExecDisplay}
    </span>
  </div>
  <div className="category-header__stats">
    <div className="category-stat">
      <span className="category-stat__label">Presupuesto</span>
      <span className="category-stat__value">{formatMonto(category.budgetClp)}</span>
    </div>
    <div className="category-stat">
      <span className="category-stat__label">Actual</span>
      <span className="category-stat__value">{formatMonto(category.actualClp)}</span>
    </div>
    <div className="category-stat">
      <span className="category-stat__label">Delta</span>
      <span className={`category-stat__value ${getDeltaClass(category.deltaClp)}`}>
        {formatMonto(category.deltaClp)}
      </span>
    </div>
  </div>
</div>
```

**CSS**:
```css
.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
  border: 1px solid var(--gray-200);
}
.category-header:hover {
  background: var(--gray-100);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.category-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.category-header__icon {
  font-size: 0.875rem;
  color: var(--gray-600);
}
.category-header__badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.category-header__badge--excellent {
  background: #d1fae5;
  color: #065f46;
}
.category-header__badge--good {
  background: #fef3c7;
  color: #92400e;
}
.category-header__badge--warning {
  background: #fee2e2;
  color: #991b1b;
}
.category-header__stats {
  display: flex;
  gap: 2rem;
  font-size: 0.875rem;
}
.category-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}
.category-stat__label {
  font-size: 0.75rem;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.category-stat__value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 968px) {
  .category-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .category-header__stats {
    justify-content: space-between;
  }
}
```

---

## 🔍 Mejora de Tabla Items

### Propuesta Visual

```css
/* Tabla mejorada */
.tabla-presupuesto {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.tabla-presupuesto thead {
  background: var(--gray-50);
}

.tabla-presupuesto th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--gray-700);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--gray-200);
}

.tabla-presupuesto td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--gray-100);
  font-size: 0.875rem;
  vertical-align: middle;
}

.tabla-presupuesto tbody tr {
  transition: background-color 0.15s;
}

.tabla-presupuesto tbody tr:hover {
  background: var(--gray-50);
}

.tabla-presupuesto tbody tr:last-child td {
  border-bottom: none;
}

/* Columnas numéricas */
.tabla-presupuesto .monto {
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.tabla-presupuesto .percent {
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

/* Celda editable */
.tabla-presupuesto .actual-cell {
  position: relative;
}

.tabla-presupuesto .actual-cell button {
  margin-left: 0.5rem;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.4;
  transition: opacity 0.2s, transform 0.2s;
}

.tabla-presupuesto tbody tr:hover .actual-cell button {
  opacity: 1;
}

.tabla-presupuesto .actual-cell button:hover {
  transform: scale(1.2);
}

/* Input en modo edición */
.tabla-presupuesto .edit-mode input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid var(--primary);
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: right;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tabla-presupuesto .edit-mode input:focus {
  outline: none;
  border-color: var(--primary-dark);
}

/* Error tooltip */
.error-tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.25rem;
  background: var(--danger);
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.error-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  right: 1rem;
  border: 5px solid transparent;
  border-bottom-color: var(--danger);
}

/* Delta colors */
.delta.favorable {
  color: var(--success);
  font-weight: 600;
}

.delta.unfavorable {
  color: var(--danger);
  font-weight: 600;
}

/* Responsive table */
@media (max-width: 768px) {
  .tabla-presupuesto {
    font-size: 0.8125rem;
  }
  .tabla-presupuesto th,
  .tabla-presupuesto td {
    padding: 0.625rem 0.75rem;
  }
}
```

---

## 📦 Resumen de Archivos Involucrados

### Frontend
```
node-version/client/src/
├── pages/
│   └── Actual.tsx                    # Página principal
├── components/
│   ├── actual/
│   │   ├── ActualTable.tsx           # Tabla por categoría
│   │   └── ActualRow.tsx             # Fila editable
│   ├── common/
│   │   └── YearMonthPicker.tsx       # Selector de período
│   └── Sidebar.tsx                    # Menú lateral
├── layout/
│   ├── MainLayout.tsx                 # Layout con sidebar
│   └── PageTitleSection.tsx           # Header de página
├── api/
│   └── actualApi.ts                   # Funciones API
├── types/
│   └── actual.ts                      # TypeScript types
├── hooks/
│   └── useYearMonth.tsx               # Hook para año/mes
└── index.css                          # Estilos globales
```

### Backend
```
node-version/src/
├── routes/
│   └── actual.ts                      # Router API
└── services/
    └── consolidado.ts                 # getMonthlyBudget()
```

### Base de Datos
```
prisma/schema.prisma:
  model ActualEntry {
    id         Int      @id @default(autoincrement())
    year       Int
    month      Int
    category   String
    itemKey    String
    label      String?
    amountClp  Int
    isPaid     Boolean  @default(false)
    isLocked   Boolean  @default(false)
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt
    
    @@unique([year, month, category, itemKey])
  }
```

---

## 🎯 Quick Wins (Mejoras Rápidas)

### 1. Agregar estilos faltantes (5 min)
```css
/* Agregar a index.css */
.tabla-presupuesto .monto {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.tabla-presupuesto .percent {
  text-align: center;
}
.delta.favorable { color: var(--success); font-weight: 500; }
.delta.unfavorable { color: var(--danger); font-weight: 500; }
```

### 2. Cambiar label "PAGO_TC" (2 min)
```tsx
// En ActualTable.tsx, agregar a CATEGORY_LABELS:
[ActualCategory.PAGO_TC]: 'Pagos TC',
```

### 3. Mejorar loading (3 min)
```tsx
import { Loader } from 'rsuite';
// Reemplazar en Actual.tsx:
{loading && <Loader size="lg" content="Cargando datos..." center />}
```

### 4. Toast de éxito al guardar (5 min)
```tsx
// En ActualRow.tsx, después de save exitoso:
import { showToast } from '../Toast';
await upsertActualEntry(...);
showToast('success', 'Guardado correctamente');
setIsEditing(false);
```

### 5. Accesibilidad botón ✏️ (2 min)
```tsx
<button 
  onClick={handleEdit} 
  aria-label={`Editar ${line.itemName}`}
>
  ✏️
</button>
```

---

## 🚀 Mejoras de Mediano Plazo

1. **Responsive completo**: Media queries para tablas y balance
2. **Cards mejorados**: Diseño propuesto arriba para balance section
3. **Headers mejorados**: Badges de % ejecución con colores
4. **Animaciones**: Transitions suaves al expandir/colapsar
5. **Gráficos**: Agregar mini charts en headers de categoría (sparklines)
6. **Filtros**: Poder filtrar categorías o buscar ítems
7. **Export**: Botón para descargar CSV/Excel del mes
8. **Comparación**: Ver mes anterior en columna adicional

---

## 🎬 Flujo de Datos Completo

```
Usuario selecciona Marzo 2026
  ↓
YearMonthPicker actualiza state
  ↓
useYearMonth hook actualiza URL (?year=2026&month=3)
  ↓
useEffect detecta cambio
  ↓
loadSummary() → fetchActualSummary(2026, 3)
  ↓
GET /api/actual/summary?year=2026&month=3
  ↓
Backend:
  1. getMonthlyBudget(2026, 3) → lee presupuesto de todas las tablas
  2. prisma.actualEntry.findMany({ where: { year: 2026, month: 3 }}) → lee datos reales
  3. Merge línea por línea
  4. Calcula deltas y % ejecución
  5. Retorna JSON con categories[]
  ↓
Frontend actualiza state:
  setSummary(data)
  ↓
Renderiza:
  - Balance global (totalIngresos, totalGastos, balance)
  - 8 categorías (ActualTable por cada una)
    - Cada categoría renderiza N ActualRow
  ↓
Usuario hace doble clic en "Luz"
  ↓
ActualRow entra en modo edición
  ↓
Usuario escribe "52153" y presiona Enter
  ↓
handleSave() → upsertActualEntry({...})
  ↓
PUT /api/actual/entry
  ↓
Backend:
  1. Valida datos
  2. Verifica lock
  3. Upsert en DB
  4. Retorna entry actualizado
  ↓
Frontend:
  1. onSaved(52153)
  2. handleEntryUpdated() actualiza state optimistically
  3. Recalcula deltas y totales
  4. Re-renderiza
```

---

## 📊 Ejemplo de Datos Reales (Marzo 2026)

### Balance Global
- **Total Ingresos**: $ 3.551.910
- **Total Gastos**: $ 3.150.309
- **Balance**: $ 401.601 ✅

### Categoría: INGRESOS
- **Presupuesto**: $ 15.050.000
- **Actual**: $ 3.551.910
- **Delta**: $ -11.498.090
- **% Ejecución**: 23.6%

| Concepto | Presupuesto | Actual | Delta | % Ejec |
|----------|-------------|--------|-------|--------|
| Sueldo líquido | 2.900.000 | 3.001.910 | +101.910 | 103.5% |
| Extras | 550.000 | 550.000 | 0 | 100.0% |
| Bono MIP | 11.600.000 | 0 | -11.600.000 | 0.0% |

### Categoría: SERVICIOS_BASICOS
- **Presupuesto**: $ 4.485.810
- **Actual**: $ 768.886
- **Delta**: $ -3.716.924
- **% Ejecución**: 17.1%

| Concepto | Presupuesto | Actual | Delta | % Ejec |
|----------|-------------|--------|-------|--------|
| Luz | 37.448 | 52.153 | +14.705 | 139.3% |
| Gastos Comunes | 50.000 | 50.000 | 0 | 100.0% |
| Internet | 25.990 | 25.990 | 0 | 100.0% |
| Agua | 17.582 | 15.590 | -1.992 | 88.7% |
| Bencina | 180.000 | 150.000 | -30.000 | 83.3% |
| Colegio | 3.410.000 | 0 | -3.410.000 | 0.0% |

### Categoría: SUPERMERCADO
- **Presupuesto**: $ 600.000
- **Actual**: $ 1.182.524
- **Delta**: $ +582.524
- **% Ejecución**: 197.1% ⚠️

### Categoría: PAGO_TC
- **Presupuesto**: $ 0
- **Actual**: $ 196.370
- **Delta**: $ +196.370
- **% Ejecución**: N/A

| Concepto | Presupuesto | Actual |
|----------|-------------|--------|
| Pago por selección (7 cuotas) | 0 | 101.432 |
| Pago por selección (1 cuotas) | 0 | 45.000 |
| Pago por selección (1 cuotas) | 0 | 49.938 |

---

## 🏁 Conclusión

La página **Actual vs Presupuesto** es funcional y cumple su propósito principal: permitir comparar presupuesto vs realidad de manera visual y editable. Sin embargo, hay varias **oportunidades de mejora** en:

1. **Estilos**: Clases CSS faltantes o no aplicadas
2. **UX**: Feedback visual, responsividad, accesibilidad
3. **Diseño**: Modernizar con cards, badges, colores más prominentes
4. **Performance**: Cache, optimistic updates más robustos

Las **mejoras propuestas** se pueden implementar de forma incremental, priorizando "Quick Wins" para impacto inmediato.

---

## 🔗 Referencias

- RSuite Docs: https://rsuite.github.io/
- React Router: https://reactrouter.com/
- Prisma: https://www.prisma.io/
