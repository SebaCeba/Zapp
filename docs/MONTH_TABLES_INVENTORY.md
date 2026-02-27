# Inventario de Tablas Mensuales (12 Columnas)

**Generado:** 22 Feb 2026  
**Objetivo:** Identificar todas las tablas con 12 columnas de meses (Ene-Dic) para análisis de estandarización de ancho de columna.

---

## Resumen Ejecutivo

- **Total de tablas mensuales:** 7
- **RSuite Table:** 1
- **HTML table:** 6
- **Editables:** 3
- **Con fixed left:** 6
- **Con fixed right total:** 7

---

## Inventario Detallado

| # | Archivo | Página/Uso | Tipo | Fixed Left | Fixed Right Total | Editable | Ancho/Mes | Observaciones |
|---|---------|------------|------|------------|-------------------|----------|-----------|---------------|
| 1 | `TablaPresupuestoSupermercado.tsx` | Supermercado | **RSuite Table** | **Sí** (150px) | **Sí** (120px) | **Sí** (inline edit) | **100px** | ✅ Migrado a RSuite Fase 3. Usa EditableMonthCell custom. |
| 2 | `TablaPresupuestoIngresos.tsx` | Ingresos | HTML table | **Sí** (sticky left 0) | **Sí** (bg gray-100) | **Sí** (inline edit) | **min-width: 80px** | Usa Input de RSuite para editar. Sticky via inline style. |
| 3 | `TablaPresupuestoServicios.tsx` | Servicios Básicos | HTML table | **Sí** (sticky left 0) | **Sí** (bg gray-100) | **Sí** (inline edit) | **min-width: 80px** | Misma implementación que Ingresos. Input inline. |
| 4 | `Presupuesto.tsx` | Presupuesto (Dashboard resumen) | HTML table | **Sí** (sticky left 0, 180px) | **Sí** (bg gray-100, 120px) | No | **minWidth: 110px** | Tabla de resumen consolidada. Filas expandibles (▼/▶). minWidth global: 1600px. |
| 5 | `Tenpo.tsx` | Tenpo - TC Prepago | HTML table | **Sí** (sticky left 0, 250px) | **Sí** (Total Año, 120px) | No | **minWidth: 100px** | Muestra cuotas mensuales. Filas expandibles para detalle de cuotas. minWidth: 100%. |
| 6 | `Dashboard.tsx` | App (dentro de componente global) | HTML table | **Sí** (sticky left 0) | **Sí** (Total Año, fontWeight 700) | No | **Clase: monthly-table (min-width: 80px)** | Tabla "💰 Por Suscripción". Headers abreviados (Ene/Feb/Mar). Usa clase global .monthly-table. |
| 7 | `VistaPreviaObligacion.tsx` | Créditos y Seguros (modal preview) | HTML table | No | No | No | **Sin definir** | Vista previa temporal antes de guardar. Solo fila de datos. Headers textAlign center. |

---

## Análisis por Tipo

### RSuite Table (1)
- ✅ **TablaPresupuestoSupermercado.tsx**
  - Estado: Migrado en Fase 3
  - Columnas: `<Column width={100}>` para meses
  - Fixed: Left (Categoría 150px), Right (Total 120px)
  - Editable: Sí, con `EditableMonthCell` custom
  - HeaderCell: Clase `.app-table-header` estandarizada
  - Nota: Referencia de implementación correcta

### HTML table (6)

#### Con sticky left + right total (5)
1. **TablaPresupuestoIngresos.tsx**
   - Style: `position: sticky, left: 0, background: var(--gray-50)`
   - Celda: min-width 80px (CSS global `.monthly-table`)
   - Total: `background: var(--gray-100)`
   - Edit: Input inline con onClick

2. **TablaPresupuestoServicios.tsx**
   - Idéntica implementación a Ingresos
   - Style: Inline sticky + background
   - Edit: Input inline

3. **Presupuesto.tsx**
   - Style: Sticky left con zIndex 2, right con minWidth 120px
   - Columna izq: minWidth 180px (más ancha para "Concepto")
   - Meses: minWidth 110px (más anchas que otras)
   - Tabla global: minWidth 1600px (requiere scroll horizontal)
   - Observación: Filas expandibles con detalle nested

4. **Tenpo.tsx**
   - Style: Sticky left zIndex 10, backgroundColor #f9fafb
   - Columna izq: minWidth 250px (más ancha, contiene nombre + badges)
   - Meses: minWidth 100px, textAlign center
   - Tabla: minWidth 100%
   - Observación: Headers con rowSpan=2, filas expandibles complejas

5. **Dashboard.tsx**
   - Style: Sticky left, background white
   - Usa clase global `.monthly-table`
   - minWidth 80px por columna (CSS global)
   - Headers: Abreviados a 3 letras
   - Total: fontWeight 700, background gray-50

#### Sin sticky/fixed (1)
6. **VistaPreviaObligacion.tsx**
   - Style: width 100%, borderCollapse collapse, fontSize 0.9rem
   - Headers: textAlign center, fontSize 0.85rem
   - Sin sticky, sin fixed right
   - Solo 1 fila de datos (Monto CLP)
   - Background condicional según monto > 0

---

## Patrones Detectados

### Nomenclatura de Meses
- **Arrays de datos:** `'enero', 'febrero', ... 'diciembre'` (lowercase, español completo)
- **Headers display:** `'Ene', 'Feb', 'Mar', ... 'Dic'` (3 letras, español)
- **Constantes:** `MESES` (datos), `MESES_DISPLAY` (UI), `MONTHS` (Dashboard, ingles)

### Anchos de Columna
- **80px:** Mínimo para celdas mensuales (CSS global `.monthly-table`)
- **100px:** Estándar en RSuite Table (TablaPresupuestoSupermercado) y Tenpo
- **110px:** Presupuesto.tsx (más espacioso para resumen)
- **150px:** Columna izquierda típica (nombre/categoría)
- **180px:** Columna izquierda en Presupuesto (concepto más largo)
- **250px:** Columna izquierda en Tenpo (nombre + metadata)
- **120px:** Columna derecha total (consistente en 3 tablas)

### Fixed Left Implementation
**RSuite:**
```tsx
<Column width={150} fixed>
```

**HTML:**
```tsx
style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 1 }}
```

### Fixed Right Implementation
**RSuite:**
```tsx
<Column width={120} align="right" fixed="right">
```

**HTML:**
```tsx
style={{ textAlign: 'right', background: 'var(--gray-100)', minWidth: '120px' }}
```

### Editabilidad
- **RSuite:** Custom Cell component (`EditableMonthCell`)
- **HTML:** Input de RSuite con `autoFocus`, `onBlur`, `onKeyDown` (Enter)
- Pattern: Click para editar → Input autoFocus → Blur/Enter para guardar

---

## Problemas Identificados

### Inconsistencia de Anchos
- ❌ Rango: 80px - 110px para columnas mensuales
- ❌ No hay estándar único
- ❌ CSS global define min-width 80px, pero algunos componentes lo sobrescriben

### Scroll Horizontal Doble
- ⚠️ **Presupuesto.tsx:** `minWidth: 1600px` en tabla + `.table-container` con `overflowX: auto`
- ⚠️ **Tenpo.tsx:** `minWidth: 100%` puede causar scroll si contenido supera viewport
- ⚠️ **Dashboard.tsx:** Usa `.table-container` que tiene `overflow-x: auto`

### Sticky Inconsistente
- ⚠️ VistaPreviaObligacion NO usa sticky (pero es vista previa temporal, puede ser OK)
- ⚠️ zIndex varía: 1, 2, 9, 10 (no estandarizado)
- ⚠️ Background colors varían: `white`, `var(--gray-50)`, `#f9fafb`, `#fff`

### HTML vs RSuite
- ❌ 6 de 7 tablas aún usan HTML table
- ❌ Solo Supermercado migrada a RSuite
- ⚠️ RSuite Table ofrece mejor manejo de scroll, fixed columns, accesibilidad

---

## Recomendaciones

### Corto Plazo
1. **Estandarizar ancho de mes:** Definir si usar 80px, 90px, o 100px
2. **CSS Variable:** Crear `--month-column-width: 90px` en index.css
3. **Documentar decisión:** Anotar en PAGE_TITLE_STANDARD.md o crear TABLES_STANDARD.md

### Mediano Plazo
4. **Migrar a RSuite Table:**
   - Prioridad: TablaPresupuestoIngresos (es editable, alta complejidad)
   - Prioridad: TablaPresupuestoServicios (es editable, alta complejidad)
   - Considerar: Presupuesto.tsx (dashboard crítico, filas expandibles)

5. **Unificar EditableCell:**
   - Extraer EditableMonthCell como componente reutilizable
   - Usar en las 3 tablas editables

### Largo Plazo
6. **zIndex Strategy:**
   - Documentar niveles: 1 (base), 5 (overlays), 10 (modals)
   - Aplicar consistentemente

7. **Responsive Design:**
   - Considerar ocultar meses en móviles (mostrar solo Q1, Q2, Q3, Q4)
   - O scroll horizontal más elegante

---

## Archivos Leídos

- ✅ `node-version/client/src/pages/Presupuesto.tsx`
- ✅ `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`
- ✅ `node-version/client/src/components/TablaPresupuestoIngresos.tsx`
- ✅ `node-version/client/src/components/TablaPresupuestoServicios.tsx`
- ✅ `node-version/client/src/pages/Tenpo.tsx`
- ✅ `node-version/client/src/components/Dashboard.tsx`
- ✅ `node-version/client/src/components/VistaPreviaObligacion.tsx`
- ✅ `node-version/client/src/index.css` (estilos globales)

---

## Notas Adicionales

- **GestionarBonosModal.tsx:** Descartado (solo SelectPicker de meses, no tabla)
- **Actual.tsx:** Descartado (usa selector de mes individual, no tabla mensual)
- **ConfiguracionTC.tsx:** No contiene tabla mensual (solo configuración de parámetros)

**Total de búsquedas:** 5 grep searches, 10 file reads  
**Criterio de exclusión:** Solo tablas con las 12 columnas de meses simultáneamente en pantalla.
