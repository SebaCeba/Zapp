# Fase 3: Tablas Complejas - Diagnóstico y Plan

**Fecha:** 21 de Febrero, 2026  
**Estado:** 🔵 PLANIFICACIÓN  
**Tiempo estimado:** 32-40 horas (4-5 días)  
**Prioridad:** 🔴 ALTA

---

## 📋 Resumen Ejecutivo

La Fase 3 se enfoca en la migración de todos los componentes de tabla desde HTML `<table>` tradicional a `<Table>` de RSuite. Actualmente tenemos **4 tablas principales** que utilizan HTML custom con estilos CSS modulares o globales, sin features avanzadas como sorting, paginación, o virtual scrolling.

**Objetivos:**
- ✅ Migrar todas las tablas a `<Table>` de RSuite
- ✅ Implementar sorting en columnas clave
- ✅ Mejorar accesibilidad y responsive design
- ✅ Agregar loading states con `<Loader>`
- ✅ Implementar inline editing cuando sea necesario
- ✅ Eliminar CSS custom de tablas (~80-100 líneas)

**Impacto esperado:**
- 📦 Bundle: +~80KB (Table component)
- ⚡ Performance: Mejor con virtual scrolling para datasets grandes
- 🎨 UI: Consistencia visual con RSuite design system
- 🛠️ DX: Menos código custom, más features out-of-the-box

---

## 📊 Inventario de Tablas - Análisis Detallado

### 1. **SubscriptionTable.tsx** 🔴 Alta Prioridad

**Ubicación:** `node-version/client/src/components/SubscriptionTable.tsx`  
**Tamaño:** 178 líneas  
**Complejidad:** ⭐⭐⭐ Media-Alta

#### Estado Actual

```tsx
// HTML tradicional con inline editing
<table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Precio</th>
      <th>Periodicidad</th>
      <th>Inicio</th>
      <th>Acción</th>
    </tr>
  </thead>
  <tbody>
    {subscriptions.map((sub) => (
      <tr key={sub.id}>
        {editId === sub.id ? (
          <>
            <td><Input value={editData.name} onChange={...} /></td>
            <td><InputNumber value={editData.price} prefix="$" /></td>
            <td><SelectPicker data={PERIODICITY_OPTIONS} /></td>
            <td><DatePicker value={editData.startDate} /></td>
            <td>
              <Button appearance="primary">Guardar</Button>
              <Button>Cancelar</Button>
            </td>
          </>
        ) : (
          <>
            <td>{sub.name}</td>
            <td>${sub.price.toLocaleString('es-CL')}</td>
            <td>{PERIODICITY_LABELS[sub.periodicity]}</td>
            <td>{new Date(sub.startDate).toLocaleDateString('es-CL')}</td>
            <td>
              <Button onClick={() => handleEdit(sub)}>Editar</Button>
              <Button color="red" onClick={() => handleDelete(sub.id)}>Eliminar</Button>
            </td>
          </>
        )}
      </tr>
    ))}
  </tbody>
</table>
```

#### Features actuales
- ✅ Inline editing con RSuite inputs (ya migrados en Fase 1)
- ✅ CRUD operations (edit, delete)
- ✅ Formateo de moneda y fechas
- ✅ Loading state (`<div className="loading">`)
- ❌ Sin sorting
- ❌ Sin búsqueda/filtros
- ❌ Responsive deficiente en mobile

#### Problemas identificados
1. **HTML legacy**: Estructura `<table>` HTML con clases CSS custom
2. **No responsive**: En mobile requiere scroll horizontal
3. **Sin sorting**: No se puede ordenar por columnas
4. **Inline editing complejo**: Lógica mezclada en JSX, difícil de mantener
5. **Loading state básico**: Solo un `<div>` con texto

#### Plan de migración
- ✅ Reemplazar `<table>` por `<Table>` RSuite
- ✅ Implementar sorting por nombre, precio y fecha
- ✅ Loading state con `<Loader>` en overlay
- ✅ Inline editing con `<Table>` editable
- ✅ Acciones con `<ButtonGroup size="xs">`
- ✅ Iconos con `@rsuite/icons` (EditIcon, TrashIcon)

---

### 2. **TcAnnualCyclesTable.tsx** 🔴 Alta Prioridad

**Ubicación:** `node-version/client/src/components/TcAnnualCyclesTable.tsx`  
**Tamaño:** 142 líneas  
**Complejidad:** ⭐⭐⭐ Media

#### Estado Actual

```tsx
<table className={styles.tcAnnualCycles__table}>
  <thead>
    <tr>
      <th>Mes</th>
      <th>Desde</th>
      <th>Día</th>
      <th>Hasta</th>
      <th>Día</th>
      <th>Cierre Nominal</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    {cycles.map((cycle) => (
      <tr key={cycle.month}>
        <td>{MONTH_NAMES[cycle.month - 1]}</td>
        <td>
          {format(parse(cycle.fromDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}
          <span className={styles.tcAnnualCycles__dayName}>
            {getDayName(cycle.fromDate)}
          </span>
        </td>
        <td>{getDay(cycle.fromDate)}</td>
        <td>{format(parse(cycle.toDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}</td>
        <td>{getDay(cycle.toDate)}</td>
        <td>{format(parse(cycle.nominalToDate, 'yyyy-MM-dd', new Date()), 'dd-MMM', { locale: es })}</td>
        <td>
          {cycle.overrideApplied && <span className="badge">Override</span>}
          {cycle.ruleApplied && <span className="badge">Regla</span>}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### Features actuales
- ✅ 12 filas (1 por mes)
- ✅ Formateo de fechas con `date-fns`
- ✅ Badges para estados (Override, Regla)
- ✅ Year selector con `<select>` HTML
- ✅ CSS modular (`TcAnnualCyclesTable.module.css`)
- ❌ Sin sorting
- ❌ Sin highlight de mes actual
- ❌ Sticky header no implementado

#### Problemas identificados
1. **Muchas columnas**: 7 columnas requieren scroll horizontal en mobile
2. **Formateo manual**: Lógica de formateo dispersa en el componente
3. **Year selector HTML**: Usar `<SelectPicker>` RSuite
4. **Sin sticky header**: En scroll, header se pierde
5. **CSS modular obsoleto**: Puede eliminarse con RSuite

#### Plan de migración
- ✅ Migrar a `<Table>` RSuite con `autoHeight`
- ✅ Implementar sticky header con prop `affixHeader`
- ✅ Year selector → `<SelectPicker>` RSuite
- ✅ Badges → `<Tag>` con colores custom
- ✅ Highlight mes actual con `rowClassName`
- ✅ Responsive con `<Table>` scroll horizontal automático

---

### 3. **TcOverridesTable.tsx** 🟡 Media Prioridad

**Ubicación:** `node-version/client/src/components/TcOverridesTable.tsx`  
**Tamaño:** 207 líneas  
**Complejidad:** ⭐⭐⭐⭐ Alta

#### Estado Actual

```tsx
<table className={styles.tcOverrides__table}>
  <thead>
    <tr>
      <th>Mes</th>
      <th>Cierre por defecto</th>
      <th>Override</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>
    {monthsData.map((monthData) => (
      <tr key={monthData.month}>
        <td>{MONTH_NAMES[monthData.month - 1]}</td>
        <td>{format(parse(getDefaultCloseDate(monthData.month), 'yyyy-MM-dd', new Date()), 'dd-MMM-yyyy')}</td>
        <td>
          <input
            type="date"
            value={monthData.effectiveCloseDate || ''}
            onChange={(e) => handleDateChange(monthData.month, e.target.value)}
            onFocus={() => setEditingMonth(monthData.month)}
            className={styles.tcOverrides__input}
          />
        </td>
        <td>
          <button onClick={() => handleSave(monthData.month)} disabled={...}>
            {savingMonth === monthData.month ? 'Guardando...' : 'Guardar'}
          </button>
          {monthData.hasOverride && (
            <button onClick={() => handleDelete(monthData.month)}>Eliminar</button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### Features actuales
- ✅ 12 filas (1 por mes)
- ✅ Inline editing con `<input type="date">` HTML
- ✅ Acciones inline (Guardar, Eliminar)
- ✅ Loading states por fila (`savingMonth`, `deletingMonth`)
- ✅ Year selector con `<select>` HTML
- ✅ CSS modular
- ❌ DatePicker HTML legacy (no RSuite)
- ❌ Buttons HTML legacy (no RSuite)

#### Problemas identificados
1. **Input type="date" HTML**: Usar `<DatePicker>` RSuite
2. **Buttons HTML**: Migrar a `<Button>` RSuite
3. **Loading state manual**: Usar `loading` prop de Button
4. **CSS modular**: Eliminar en favor de RSuite

#### Plan de migración
- ✅ Migrar a `<Table>` RSuite
- ✅ `<input type="date">` → `<DatePicker>` inline en celdas
- ✅ Buttons → `<Button>` con `loading` prop
- ✅ Year selector → `<SelectPicker>`
- ✅ Helper text → `<HelpBlock>` o `<Message>`
- ⚠️ **Desafío**: DatePicker inline en Table (puede requerir custom cell)

---

### 4. **ActualTable.tsx** 🟢 Baja Prioridad

**Ubicación:** `node-version/client/src/components/actual/ActualTable.tsx`  
**Tamaño:** Desconocido (por revisar)  
**Complejidad:** ⭐⭐ Baja-Media (estimado)

#### Estado
- ⚠️ Pendiente de análisis detallado
- Probablemente similar en estructura a las otras tablas
- Prioridad baja por ser módulo "Actual" (menos usado)

#### Plan
- 📝 Analizar en profundidad antes de migrar
- 🔄 Aplicar patrones de las tablas anteriores
- ⏰ Migrar al final de la fase

---

## 🎯 Features RSuite Table a Implementar

### 1. **Sorting** ⭐ Prioridad Alta

```tsx
const [sortColumn, setSortColumn] = useState<string>();
const [sortType, setSortType] = useState<'asc' | 'desc'>();

const handleSortColumn = (dataKey: string, sortType: 'asc' | 'desc') => {
  setSortColumn(dataKey);
  setSortType(sortType);
};

<Table
  data={sortedData}
  sortColumn={sortColumn}
  sortType={sortType}
  onSortColumn={handleSortColumn}
>
  <Column sortable>
    <HeaderCell>Nombre</HeaderCell>
    <Cell dataKey="name" />
  </Column>
</Table>
```

**Aplicable a:**
- ✅ SubscriptionTable (nombre, precio, fecha)
- ✅ TcAnnualCyclesTable (mes, fechas)
- ❌ TcOverridesTable (no necesario, orden fijo por mes)

---

### 2. **Loading States** ⭐ Prioridad Alta

```tsx
<Table loading={loading} data={data}>
  {/* columns */}
</Table>
```

**Aplicable a:**
- ✅ Todas las tablas (reemplaza `<div className="loading">`)

---

### 3. **Sticky Header** ⭐ Prioridad Media

```tsx
<Table affixHeader affixHorizontalScrollbar>
  {/* columns */}
</Table>
```

**Aplicable a:**
- ✅ TcAnnualCyclesTable (scroll vertical en datasets grandes)
- ⚠️ SubscriptionTable (si hay muchas suscripciones)

---

### 4. **Custom Cell Rendering** ⭐ Prioridad Alta

```tsx
<Column>
  <HeaderCell>Precio</HeaderCell>
  <Cell>
    {rowData => `$${rowData.price.toLocaleString('es-CL')}`}
  </Cell>
</Column>
```

**Aplicable a:**
- ✅ SubscriptionTable (formateo de moneda y fechas)
- ✅ TcAnnualCyclesTable (formateo de fechas)
- ✅ TcOverridesTable (formateo de fechas)

---

### 5. **Action Columns** ⭐ Prioridad Alta

```tsx
import { ButtonGroup, IconButton } from 'rsuite';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';

<Column width={120} fixed="right">
  <HeaderCell>Acciones</HeaderCell>
  <Cell>
    {rowData => (
      <ButtonGroup size="xs">
        <IconButton
          icon={<EditIcon />}
          onClick={() => handleEdit(rowData)}
          appearance="primary"
          size="xs"
        />
        <IconButton
          icon={<TrashIcon />}
          onClick={() => handleDelete(rowData.id)}
          appearance="primary"
          color="red"
          size="xs"
        />
      </ButtonGroup>
    )}
  </Cell>
</Column>
```

**Aplicable a:**
- ✅ SubscriptionTable (edit/delete)
- ✅ TcOverridesTable (save/delete)

---

### 6. **Inline Editing** ⭐⭐ Complejo

**Opción A: RSuite `EditableCell` (no nativo)**
- Requiere implementación custom
- Mayor flexibilidad

**Opción B: Modal para edición**
- Más simple
- Mejor UX en mobile
- Recomendado para SubscriptionTable

**Opción C: Fila expandible con Form**
```tsx
<Table
  renderRowExpanded={rowData => (
    <div style={{ padding: 20 }}>
      <Form formValue={editData} onChange={setEditData}>
        {/* form fields */}
      </Form>
    </div>
  )}
>
  {/* columns */}
</Table>
```

**Decisión:** Evaluar caso por caso
- SubscriptionTable: **Opción B** (Modal)
- TcOverridesTable: **Opción C** (Inline con DatePicker en celda)

---

### 7. **Row Styling** ⭐ Prioridad Media

```tsx
<Table
  rowClassName={(rowData) => {
    if (rowData.month === currentMonth) return 'highlight-current';
    return '';
  }}
>
```

**Aplicable a:**
- ✅ TcAnnualCyclesTable (highlight mes actual)
- ✅ SubscriptionTable (highlight próximos vencimientos)

---

### 8. **Responsive Handling** ⭐ Prioridad Alta

```tsx
<Table autoHeight style={{ width: '100%' }}>
```

RSuite Table es horizontal-scrollable por defecto en mobile.

**Consideraciones:**
- ⚠️ TcAnnualCyclesTable (7 columnas, mucho scroll)
- ✅ SubscriptionTable (5 columnas, manejable)
- ✅ TcOverridesTable (4 columnas, ok)

---

## 📝 Plan de Ejecución - Orden Propuesto

### **Paso 1: SubscriptionTable.tsx** (12-16 horas)

**Por qué primero:**
- Tabla más crítica (módulo Suscripciones es core)
- Inline editing ya usa RSuite inputs (simplifica migración)
- Buen caso de referencia para otras tablas

**Tareas:**
1. ✅ Crear branch `feat/rsuite-phase-3-tables`
2. ✅ Migrar estructura HTML → `<Table>` RSuite
3. ✅ Implementar columnas con `<Column>` y `<Cell>`
4. ✅ Custom cell rendering (currency, dates)
5. ✅ Action column con `<IconButton>`
6. ✅ Sorting por nombre, precio, fecha
7. ✅ Loading state con `<Table loading>`
8. ✅ **Decisión inline editing**: Modal vs inline
9. ✅ Testing funcional completo
10. ✅ Commit: `feat(tables): migrate SubscriptionTable to RSuite`

---

### **Paso 2: TcAnnualCyclesTable.tsx** (8-12 horas)

**Por qué segundo:**
- Read-only (sin edición), más simple
- Buen caso para sticky header y badges

**Tareas:**
1. ✅ Migrar HTML → `<Table>` RSuite
2. ✅ Implementar 7 columnas
3. ✅ Custom cell para fechas con `date-fns`
4. ✅ Badges → `<Tag>` RSuite
5. ✅ Year selector → `<SelectPicker>`
6. ✅ Sticky header con `affixHeader`
7. ✅ Highlight mes actual con `rowClassName`
8. ✅ Eliminar `TcAnnualCyclesTable.module.css`
9. ✅ Testing
10. ✅ Commit: `feat(tables): migrate TcAnnualCyclesTable to RSuite`

---

### **Paso 3: TcOverridesTable.tsx** (10-14 horas)

**Por qué tercero:**
- Inline editing complejo (DatePicker + acciones)
- Requiere custom cells avanzadas

**Tareas:**
1. ✅ Migrar HTML → `<Table>` RSuite
2. ✅ Implementar 4 columnas
3. ✅ Custom cell con `<DatePicker>` inline
4. ✅ Action cell con `<Button loading>`
5. ✅ Year selector → `<SelectPicker>`
6. ✅ Helper text → `<Message>` o `<HelpBlock>`
7. ✅ Eliminar `TcOverridesTable.module.css`
8. ✅ Testing CRUD operations
9. ✅ Commit: `feat(tables): migrate TcOverridesTable to RSuite`

---

### **Paso 4: ActualTable.tsx** (4-6 horas)

**Por qué último:**
- Prioridad baja
- Aplicar patrones ya establecidos

**Tareas:**
1. ✅ Analizar estructura actual
2. ✅ Aplicar patrón de tablas anteriores
3. ✅ Testing
4. ✅ Commit: `feat(tables): migrate ActualTable to RSuite`

---

### **Paso 5: Limpieza CSS** (2-4 horas)

**Tareas:**
1. ✅ Eliminar clases CSS de tablas en `index.css`:
   - `.table-container`
   - `.loading`
   - Estilos de `<table>`, `<th>`, `<td>`
2. ✅ Eliminar archivos `.module.css` de tablas
3. ✅ Verificar que no hay clases huérfanas
4. ✅ Commit: `chore(css): remove table custom styles`

---

### **Paso 6: Testing Final y Merge** (2-4 horas)

**Tareas:**
1. ✅ Testing funcional de todas las tablas
2. ✅ Testing responsive (mobile/tablet/desktop)
3. ✅ Verificar sorting funciona en todas
4. ✅ Performance check (datasets grandes)
5. ✅ Review de código
6. ✅ Update `FASE_3_RESULTADOS.md`
7. ✅ Merge a `main` o `develop`

---

## 🔍 Decisiones Técnicas Clave

### 1. **Inline Editing: Modal vs Custom Cell**

**Contexto:**
- SubscriptionTable tiene inline editing con 4 campos
- TcOverridesTable tiene inline editing con 1 campo (DatePicker)

**Decisión:**
- **SubscriptionTable**: Usar **Modal** para edición
  - ✅ Mejor UX en mobile
  - ✅ Más espacio para form fields
  - ✅ Validación más clara
  - ❌ Requiere click extra
  
- **TcOverridesTable**: Mantener **inline editing**
  - ✅ Solo 1 campo (DatePicker)
  - ✅ UX más rápida (sin modal)
  - ⚠️ Requiere custom cell con DatePicker

---

### 2. **Sorting: Client-side vs Server-side**

**Contexto:**
- Actualmente no hay sorting
- Datasets son pequeños (~10-50 filas max)

**Decisión:**
- **Client-side sorting** con RSuite `onSortColumn`
  - ✅ Más rápido (sin API calls)
  - ✅ Suficiente para datasets actuales
  - Future: Migrar a server-side si datasets crecen

---

### 3. **Sticky Header: Todas vs Selectivas**

**Decisión:**
- **Solo tablas con scroll vertical significativo**
  - ✅ TcAnnualCyclesTable (12 filas fijas, pero en dashboard largo)
  - ❌ SubscriptionTable (pocas filas usualmente)
  - ❌ TcOverridesTable (12 filas fijas)

---

### 4. **Iconos en acciones: Siempre o Texto**

**Decisión:**
- **Iconos + Tooltip** en tablas compactas
  - ✅ SubscriptionTable: `<IconButton>` con EditIcon/TrashIcon
  - ✅ TcOverridesTable: `<Button>` con texto (acciones contextuales)

---

### 5. **CSS Modules: Eliminar o Mantener**

**Decisión:**
- **Eliminar todos los CSS modules de tablas**
  - ✅ RSuite maneja estilos base
  - ✅ Custom styles vía inline `style` o clases globales mínimas
  - Archivos a eliminar:
    - `TcAnnualCyclesTable.module.css`
    - `TcOverridesTable.module.css`

---

## 📦 Componentes RSuite Nuevos a Usar

### Imports necesarios

```typescript
// Table components
import { Table, Column, HeaderCell, Cell } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

// Icons
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';

// Other components
import { Tag, Loader, ButtonGroup, IconButton, Tooltip, Whisper } from 'rsuite';
```

---

## 🎨 Ejemplo Completo: Antes vs Después

### **Antes: HTML + CSS Custom**

```tsx
// SubscriptionTable.tsx (fragmento)
<div className="card">
  <h2>📋 Suscripciones Activas</h2>
  <div className="table-container">
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Periodicidad</th>
          <th>Inicio</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.map((sub) => (
          <tr key={sub.id}>
            <td>{sub.name}</td>
            <td>${sub.price.toLocaleString('es-CL')}</td>
            <td>{PERIODICITY_LABELS[sub.periodicity]}</td>
            <td>{new Date(sub.startDate).toLocaleDateString('es-CL')}</td>
            <td>
              <button className="btn btn-primary" onClick={() => handleEdit(sub)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(sub.id)}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### **Después: RSuite Table**

```tsx
// SubscriptionTable.tsx (versión RSuite)
import { Table, Column, HeaderCell, Cell, IconButton, ButtonGroup, Panel, Loader } from 'rsuite';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';

const { Column, HeaderCell, Cell } = Table;

export default function SubscriptionTable({ refreshKey, onDelete }: SubscriptionTableProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // ... fetch logic

  const sortedData = [...subscriptions].sort((a, b) => {
    const x = a[sortColumn as keyof Subscription];
    const y = b[sortColumn as keyof Subscription];
    if (sortType === 'asc') {
      return x > y ? 1 : -1;
    }
    return x < y ? 1 : -1;
  });

  return (
    <Panel bordered header="📋 Suscripciones Activas">
      <Table
        data={sortedData}
        loading={loading}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortColumn={(dataKey, sortType) => {
          setSortColumn(dataKey);
          setSortType(sortType);
        }}
        autoHeight
      >
        <Column width={200} sortable>
          <HeaderCell>Nombre</HeaderCell>
          <Cell dataKey="name" />
        </Column>

        <Column width={120} align="right" sortable>
          <HeaderCell>Precio</HeaderCell>
          <Cell>
            {rowData => `$${rowData.price.toLocaleString('es-CL')}`}
          </Cell>
        </Column>

        <Column width={150}>
          <HeaderCell>Periodicidad</HeaderCell>
          <Cell>
            {rowData => PERIODICITY_LABELS[rowData.periodicity] || rowData.periodicity}
          </Cell>
        </Column>

        <Column width={120} sortable>
          <HeaderCell>Inicio</HeaderCell>
          <Cell>
            {rowData => new Date(rowData.startDate).toLocaleDateString('es-CL')}
          </Cell>
        </Column>

        <Column width={120} fixed="right">
          <HeaderCell>Acciones</HeaderCell>
          <Cell>
            {rowData => (
              <ButtonGroup size="xs">
                <IconButton
                  icon={<EditIcon />}
                  onClick={() => handleEdit(rowData)}
                  appearance="primary"
                  size="xs"
                />
                <IconButton
                  icon={<TrashIcon />}
                  onClick={() => handleDelete(rowData.id)}
                  appearance="primary"
                  color="red"
                  size="xs"
                />
              </ButtonGroup>
            )}
          </Cell>
        </Column>
      </Table>
    </Panel>
  );
}
```

### **Mejoras visuales:**
- ✅ Loading state integrado (overlay con spinner)
- ✅ Sorting visual en headers (íconos de flechas)
- ✅ Iconos de acción más claros
- ✅ Fixed action column (siempre visible en scroll)
- ✅ Better responsive (scroll horizontal automático)
- ✅ Hover states en filas (por defecto en RSuite)

---

## ⚠️ Desafíos y Riesgos

### 1. **DatePicker inline en Table**
**Riesgo:** RSuite `<DatePicker>` puede tener issues dentro de `<Cell>`  
**Mitigación:** 
- Probar en TcOverridesTable primero
- Alternativa: Input HTML con `type="date"` + estilos RSuite

### 2. **Performance con datasets grandes**
**Riesgo:** Tablas con +100 filas pueden tener lag  
**Mitigación:**
- Implementar `virtualized` prop en `<Table>`
- Paginación con `<Pagination>` RSuite (Fase futura)

### 3. **Export a Excel (feature no implementada aún)**
**Nota:** Actualmente no hay export, pero puede agregarse en futuro  
**Preparación:** Mantener data en formato exportable

### 4. **Inline editing complejo en SubscriptionTable**
**Riesgo:** 4 campos inline pueden complicar UX  
**Mitigación:** Usar Modal (ya decidido)

---

## 📈 Métricas de Éxito

### **Antes de la Fase 3:**
- 4 tablas con HTML `<table>` custom
- ~80-100 líneas CSS custom para tablas
- 0 features avanzadas (sorting, loading, sticky)
- Inline editing con estado manual complejo

### **Después de la Fase 3:**
- ✅ 4 tablas con `<Table>` RSuite
- ✅ ~10 líneas CSS custom (solo overrides necesarios)
- ✅ Sorting en 2+ tablas
- ✅ Loading states consistentes
- ✅ Sticky header donde corresponde
- ✅ Action columns con iconos
- ✅ Mejor responsive design

---

## 🚀 Próximos Pasos

1. **Crear branch:** `feat/rsuite-phase-3-tables`
2. **Commit inicial:** Add phase 3 planning docs
3. **Comenzar con SubscriptionTable.tsx**
4. **Documentar en `FASE_3_RESULTADOS.md`** cada commit

---

## 📚 Referencias

- [RSuite Table Docs](https://rsuitejs.com/components/table/)
- [RSuite Table Sortable Example](https://rsuitejs.com/components/table/#sortable)
- [RSuite Table Custom Cell](https://rsuitejs.com/components/table/#custom-cell)
- [@rsuite/icons Gallery](https://rsuitejs.com/resources/icons/)

---

**Estado:** 📝 Documento completo  
**Listo para:** Iniciar implementación cuando se apruebe  
**Siguiente archivo:** `FASE_3_RESULTADOS.md` (crear durante ejecución)
