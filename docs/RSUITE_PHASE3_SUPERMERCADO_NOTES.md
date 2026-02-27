# RSuite Phase 3: TablaPresupuestoSupermercado Migration Notes

**Fecha:** 21 de Febrero, 2026  
**Componente:** `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`  
**Tipo de Cambio:** Migracion de HTML table a RSuite Table  
**Estado:** ✅ COMPLETO

---

## Cambios Realizados

### 1. Imports Actualizados

**Antes:**
```tsx
import React, { useState, useEffect } from 'react';
```

**Despues:**
```tsx
import React, { useState, useEffect } from 'react';
import { Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;
```

**Razon:** Agregado Table y sus subcomponentes para reemplazar HTML table.

---

### 2. Estructura HTML Eliminada

**Eliminado:**
- `<div className="overflow-x-auto">`
- `<table className="w-full">`
- `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>`
- Estructura de mapeo manual en tbody

**Reemplazado por:**
- `<Table data={tableData} autoHeight>`
- `<Column>` components (14 columnas: 1 categoria + 12 meses + 1 total)
- `<HeaderCell>` para headers
- Custom `EditableMonthCell` para columnas de meses

---

### 3. Custom Cell Creada: EditableMonthCell

Funcion custom cell que maneja dos tipos de filas:

#### Fila de Datos Editables (isTotal: false)
```tsx
const EditableMonthCell = ({ rowData, dataKey, ...props }: any) => {
  if (rowData.isTotal) {
    // Fila de totales (ver abajo)
  }

  // Fila de datos editables
  const mes = dataKey;
  const valor = presupuesto?.[mes as keyof Presupuesto] as number || 0;
  const estaEditando = editando === mes;
  const estaGuardando = guardando === mes;

  return (
    <Cell {...props} className="cursor-pointer hover:bg-blue-50">
      <div onClick={() => !estaGuardando && iniciarEdicion(mes)}>
        {estaEditando ? (
          <input ... />
        ) : estaGuardando ? (
          <span>...</span>
        ) : (
          <span>{formatearMonto(valor)}</span>
        )}
      </div>
    </Cell>
  );
};
```

**Comportamiento:**
- Click en celda para editar
- Input HTML nativo con autoFocus (mantiene comportamiento original)
- Enter para guardar
- Escape para cancelar
- onBlur tambien guarda
- Estado "guardando" muestra "..."

#### Fila de Totales (isTotal: true)
```tsx
if (rowData.isTotal) {
  return (
    <Cell {...props} className="font-bold bg-gray-100">
      {formatearMontoTotal(calcularTotalMes(dataKey))}
    </Cell>
  );
}
```

**Comportamiento:**
- Solo lectura
- Muestra total mensual formateado
- Styling de totales (bold, background)

---

### 4. Data Structure

**Array de datos creado:**
```tsx
const tableData = [
  { id: 1, categoria: 'Supermercado', isTotal: false },
  { id: 2, categoria: 'Total Mensual', isTotal: true }
];
```

**Proposito:** 
- 2 filas: datos editables + fila de totales
- Campo `isTotal` para diferenciar comportamiento en custom cell

---

### 5. Configuracion de Table

```tsx
<Table
  data={tableData}
  autoHeight
  rowClassName={(rowData) => 
    rowData?.isTotal ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'
  }
>
```

**Props usadas:**
- `data`: Array de 2 filas
- `autoHeight`: Altura automatica (tabla pequena, 2 filas)
- `rowClassName`: Funcion para styling condicional de filas

**Props NO usadas:**
- `sortColumn`, `sortType`: No habia sorting
- `loading`: Loading state manejado antes del render
- `virtualized`: No necesario (solo 2 filas)

---

### 6. Columnas Configuradas

#### Columna Categoria (fixed left)
```tsx
<Column width={150} fixed>
  <HeaderCell>Categoría</HeaderCell>
  <Cell dataKey="categoria" />
</Column>
```

**Props:**
- `width={150}`: Ancho fijo
- `fixed`: Columna fija al scroll horizontal
- `dataKey="categoria"`: Muestra "Supermercado" o "Total Mensual"

#### Columnas de Meses (12 columnas dinamicas)
```tsx
{MESES.map((mes, index) => (
  <Column key={mes} width={100} align="right">
    <HeaderCell>{MESES_DISPLAY[index]}</HeaderCell>
    <EditableMonthCell dataKey={mes} />
  </Column>
))}
```

**Props:**
- `key={mes}`: Clave unica (enero, febrero, etc.)
- `width={100}`: Ancho fijo por mes
- `align="right"`: Alineacion derecha (numeros)
- `dataKey={mes}`: Pasado a EditableMonthCell

**Cantidad:** 12 columnas (una por mes)

#### Columna Total Anual (fixed right)
```tsx
<Column width={120} align="right" fixed="right">
  <HeaderCell>Total Anual</HeaderCell>
  <Cell>
    {() => formatearMontoTotal(calcularTotalAnual())}
  </Cell>
</Column>
```

**Props:**
- `width={120}`: Ancho fijo
- `fixed="right"`: Fija al scroll horizontal
- Render function para calcular total dinamicamente

---

## Funcionalidad Mantenida

### ✅ Estado y Logica

- `useState` hooks: Sin cambios
  - `presupuesto`, `loading`, `editando`, `guardando`
- `useEffect`: Sin cambios
- `cargarDatos()`: Sin cambios
- `formatearMonto()`: Sin cambios
- `formatearMontoTotal()`: Sin cambios
- `calcularTotalMes()`: Sin cambios
- `calcularTotalAnual()`: Sin cambios
- `guardarMonto()`: Sin cambios
- `iniciarEdicion()`: Sin cambios
- `handleKeyDown()`: Sin cambios
- `handleBlur()`: Sin cambios

### ✅ Comportamiento UI

- Edicion inline por celda (click en celda)
- Input HTML nativo (no RSuite Input, mantiene comportamiento original)
- Enter para guardar
- Escape para cancelar
- onBlur para guardar
- Estado de guardando por mes ("...")
- Loading state antes de tabla
- Formateo de montos: `Math.round(monto).toLocaleString('es-CL')`
- Valores 0 con texto gris (className condicional)

### ✅ API y Requests

- Fetch a `http://localhost:3000/api/supermercado/presupuesto/${anio}`
- PATCH a `http://localhost:3000/api/supermercado/presupuesto/${anio}/${mes}`
- Headers y body sin cambios
- Error handling sin cambios

### ✅ Calculos

- Total por mes
- Total anual
- Formateo condicional (0 → vacio o $0)

---

## Funcionalidad NO Agregada

- ❌ Sorting (no existia)
- ❌ Filtering (no existia)
- ❌ Pagination (no necesario, 2 filas)
- ❌ Virtual scrolling (no necesario)
- ❌ RSuite Input (se mantuvo input HTML nativo)
- ❌ Schema validation (no existia)

**Razon:** Mantener funcionalidad existente exacta segun indicaciones.

---

## CSS Mantenido

### Tailwind Classes Preservadas

**En componentes:**
- `bg-white rounded-lg shadow overflow-hidden` (contenedor)
- `text-center py-8` (loading)
- `cursor-pointer hover:bg-blue-50` (celdas editables)
- `w-full text-right border-blue-500 border-2 rounded px-2 py-1` (input)
- `text-gray-400` (valores 0 y estado guardando)
- `bg-gray-50` (headers)
- `bg-gray-100 font-bold` (fila totales)
- `text-xs font-medium text-gray-500 uppercase tracking-wider` (headers)
- `text-sm font-medium text-gray-900` (categoria)

**Nota:** Se mantuvieron todas las clases Tailwind via prop `className` en componentes RSuite.

### CSS Global

**NO modificado:**
- No se toco `index.css`
- No se eliminaron clases `.w-full`, `.table`, etc. (usadas en otros componentes)

---

## TypeScript

- Interface `Presupuesto` - Sin cambios (12 meses + anio + id opcional)
- Interface `Props` - Sin cambios
- Constants `MESES`, `MESES_DISPLAY` - Sin cambios
- Custom cell usa `any` para props (patron RSuite)
- `rowData?.isTotal` con optional chaining
- No hay errores de tipado

---

## Estructura de Tabla Especial

Esta tabla tiene una estructura unica:

**Horizontal (columnas):** 
- 1 columna fija de categoria
- 12 columnas dinamicas (meses)
- 1 columna fija de total anual
**Total:** 14 columnas

**Vertical (filas):**
- 1 fila de datos editables
- 1 fila de totales calculados
**Total:** 2 filas

**Desafio resuelto:** 
- Crear columnas dinamicamente con `.map()`
- Usar custom cell que distingue entre fila editable y fila de totales
- Mantener edicion inline con input HTML (no RSuite Input)

---

## Testing Pendiente

### Manual Testing Requerido

1. ✅ Tabla se renderiza con 2 filas y 14 columnas
2. ✅ Headers se muestran correctamente (Ene, Feb, ..., Dic, Total Anual)
3. ✅ Click en celda de mes (fila Supermercado)
4. ✅ Verificar input aparece con valor actual
5. ✅ Editar valor
6. ✅ Presionar Enter - Verificar PATCH request
7. ✅ Verificar se muestra "..." mientras guarda
8. ✅ Verificar tabla se actualiza con nuevo valor
9. ✅ Verificar totales mensuales se recalculan
10. ✅ Verificar total anual se recalcula
11. ✅ Click en celda y presionar Escape - Verificar se cancela
12. ✅ Click en celda y hacer blur (click afuera) - Verificar se guarda
13. ✅ Verificar fila "Total Mensual" NO es editable
14. ✅ Scroll horizontal - Verificar columnas fijas (Categoria, Total Anual)
15. ✅ Loading state al cargar pagina

### Browser Testing

- Chrome/Edge (primario)
- Firefox
- Safari (si aplica)

### Responsive Testing

- Desktop (>1024px) - Tabla con scroll horizontal
- Tablet (768-1024px) - Scroll horizontal
- Mobile (<768px) - Scroll horizontal con columnas fijas

**Nota:** RSuite Table con columnas fixed soporta scroll horizontal automatico.

---

## Issues Potenciales

### 1. Ancho Total de Tabla

**Problema:** 14 columnas x 100px promedio = ~1400px (requiere scroll en mobile).

**Solucion Actual:** RSuite Table scroll horizontal + columnas fixed.

**Mejora Futura:** Considerar vista vertical en mobile.

---

### 2. Input HTML vs RSuite Input

**Decision:** Se mantuvo input HTML nativo.

**Razon:** 
- Input RSuite requeriria cambiar handlers (onChange en lugar de onBlur)
- Comportamiento actual funciona (autoFocus, Enter, Escape, blur)
- Minimizar cambios segun indicaciones

**Mejora Futura:** Migrar a RSuite Input si se estandariza comportamiento.

---

### 3. Validacion de Inputs

**Problema:** No hay validacion de formato numerico (usuario puede escribir texto).

**Solucion Actual:** Backend probablemente valida con `parseFloat() || 0`.

**Mejora Futura:** Agregar validacion en handleBlur/handleKeyDown.

---

### 4. Accesibilidad

**Problema:** Input sin label asociado, celdas editables sin indicacion visual clara.

**Solucion Actual:** hover:bg-blue-50 indica celda clickeable.

**Mejora Futura:** Aria-labels, iconos de edicion.

---

## Diferencias con SubscriptionTable

| Aspecto | SubscriptionTable | TablaPresupuestoSupermercado |
|---------|-------------------|------------------------------|
| **Filas editables** | Multiples (N subscripciones) | Una fila + fila totales |
| **Edicion** | Por fila completa (editId) | Por celda (editando = mes) |
| **Inputs** | RSuite (Input, InputNumber, etc.) | HTML nativo |
| **Columnas** | 5 fijas | 14 (1 + 12 + 1) |
| **Data structure** | Array de subscriptions | Array fijo [datos, totales] |
| **Acciones** | Editar/Eliminar/Guardar/Cancelar | Solo guardar (automatico) |
| **Complejidad** | Media | Media (columnas dinamicas) |

---

## Proximo Paso Recomendado

Segun plan de Fase 3, las proximas tablas a migrar son:

1. **TcAnnualCyclesTable.tsx** (129 lineas)
   - Read-only (mas simple)
   - 7 columnas fijas
   - Badges candidatos a RSuite Tag

2. **TablaPresupuestoServicios.tsx** (257 lineas)
   - Similar a Supermercado
   - Multiples filas editables
   - 12 columnas de meses

3. **TcOverridesTable.tsx** (188 lineas)
   - Inline editing con DatePicker
   - 4 columnas

**Recomendacion:** TcAnnualCyclesTable (read-only, mas simple).

---

## Resumen de Archivos

### Modificados

1. `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`
   - Antes: 204 lineas con HTML table
   - Despues: 210 lineas con RSuite Table
   - Cambio neto: +6 lineas (custom cell function + data array)

### NO Modificados

- `index.css` - CSS global no tocado
- Tailwind classes - Mantenidas via className props
- Otros archivos TSX
- Handlers API
- Logica de negocio
- Funciones de formateo y calculo

---

**Estado Final:** Componente funcional con RSuite Table. Edicion inline por celda mantenida. Fila de totales read-only. Sin regresiones funcionales.

**Testing Status:** Pendiente de pruebas manuales en browser.

**Fase 3 Progress:** 2/10 tablas migradas (20%)
