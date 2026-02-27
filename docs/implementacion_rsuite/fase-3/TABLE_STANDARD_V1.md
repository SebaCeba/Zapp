# Estándar de Tablas Mensuales v1

**Fecha:** 22 Feb 2026  
**Estado:** ✅ Implementado  
**Versión:** 1.0

---

## Decisión: Ancho de Columnas Mensuales

**Ancho estándar de mes:** `90px`  
**Variable CSS:** `--month-column-width: 90px`

### Motivo

Se eligió 90px como compromiso entre:
- ✅ **Legibilidad:** Suficiente espacio para montos formateados ($999.999)
- ✅ **Densidad:** Permite mostrar 12 meses + columna izquierda + total sin scroll excesivo
- ✅ **Consistencia:** Valor intermedio entre los 80px-110px que existían previamente
- ✅ **Responsive:** En pantallas 1366px+ se ven todas las columnas cómodamente

### Cálculo del Ancho Total

Con la nueva estandarización:
- Columna izquierda: 160px (estándar)
- 12 meses × 90px: 1080px
- Columna derecha total: 120px
- **Total mínimo:** 1360px

Esto funciona bien en resoluciones ≥1440px sin scroll horizontal.

---

## Valores Estandarizados

### Variables CSS (index.css)

```css
:root {
  --month-column-width: 90px;
}
```

### Anchos por Tipo de Columna

| Tipo de Columna | Ancho | Variable CSS | Notas |
|-----------------|-------|--------------|-------|
| Mes (Ene-Dic) | **90px** | `var(--month-column-width)` | ✅ Usar siempre la variable |
| Columna izquierda estándar | **160px** | - | Categoría, Nombre, Concepto |
| Columna derecha total | **120px** | - | "Total Año", "Total Anual" |
| Casos especiales | Variable | - | Ej: Tenpo usa 250px para columna izquierda (nombre + badges) |

---

## Archivos Modificados

### 1. CSS Global

**Archivo:** `node-version/client/src/index.css`

**Cambios:**
- ✅ Agregada variable `--month-column-width: 90px` en `:root`
- ✅ `.monthly-table th, td`: `min-width: 80px` → `min-width: var(--month-column-width)`
- ✅ `.monthly-table th:first-child, td:first-child`: `min-width: 150px` → `min-width: 160px`

**Afecta automáticamente a:**
- `TablaPresupuestoIngresos.tsx`
- `TablaPresupuestoServicios.tsx`
- `Dashboard.tsx`

---

### 2. RSuite Table

**Archivo:** `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`

**Cambios:**
```tsx
// Columna izquierda (Categoría):
<Column width={150} fixed> → <Column width={160} fixed>

// Columnas de meses:
<Column key={mes} width={100} align="right"> → <Column key={mes} width={90} align="right">

// Columna Total (ya estaba correcto):
<Column width={120} align="right" fixed="right">
```

**Resultado:** ✅ **Cumple 100% con Estándar v1**
- Columna izquierda: 160px
- Meses: 90px
- Total Anual: 120px
- Headers: className="app-table-header"
- Scroll: Contenido en wrapper con overflow-hidden

**Motivo:** RSuite Table no usa CSS variables, requiere valores numéricos.

---

### 3. HTML Tables con Inline Styles

#### Presupuesto.tsx

**Archivo:** `node-version/client/src/pages/Presupuesto.tsx`

**Cambios:**
```tsx
// Columna izquierda (Concepto):
minWidth: '180px' → minWidth: '160px'

// Columnas de meses:
minWidth: '110px' → minWidth: 'var(--month-column-width)'
```

**Contexto:** Dashboard de resumen anual con filas expandibles.

---

#### Tenpo.tsx

**Archivo:** `node-version/client/src/pages/Tenpo.tsx`

**Cambios:**
```tsx
// Columnas de meses:
minWidth: '100px' → minWidth: 'var(--month-column-width)'
```

**No modificado:**
- Columna izquierda "Compra": mantiene 250px (caso especial para nombre + badges de estado)
- Otras columnas (Fecha, Cuotas, Total Compra): mantienen sus anchos específicos

**Contexto:** Tabla de cuotas de tarjeta de crédito Tenpo con detalle expandible.

---

## Resumen de Impacto

### Tablas Afectadas

| # | Componente | Tipo | Cambio |
|---|------------|------|--------|
| 1 | TablaPresupuestoSupermercado.tsx | RSuite Table | ✅ Izq: 150→160px, Meses: 100→90px, Total: 120px (OK) |
| 2 | TablaPresupuestoIngresos.tsx | HTML + CSS | Clase .monthly-table (afectada por CSS global) |
| 3 | TablaPresupuestoServicios.tsx | HTML + CSS | Clase .monthly-table (afectada por CSS global) |
| 4 | Presupuesto.tsx | HTML inline | minWidth: '110px' → var(--month-column-width) |
| 5 | Tenpo.tsx | HTML inline | minWidth: '100px' → var(--month-column-width) |
| 6 | Dashboard.tsx | HTML + CSS | Clase .monthly-table (afectada por CSS global) |

**Total:** 6 tablas mensuales estandarizadas

**Cumplimiento del Estándar v1:**
- ✅ TablaPresupuestoSupermercado.tsx: 100% conforme (160px/90px/120px)

---

## Tabla Excluida

**VistaPreviaObligacion.tsx:**
- ❌ No modificada
- Motivo: Vista previa temporal en modal, no define minWidth explícitos
- Hereda estilos de padres, funcionará correctamente sin cambios

---

## Guía de Uso

### Para Nuevas Tablas Mensuales

#### RSuite Table

```tsx
import { Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

<Table data={data}>
  {/* Columna izquierda */}
  <Column width={160} fixed>
    <HeaderCell>Categoría</HeaderCell>
    <Cell dataKey="category" />
  </Column>

  {/* Meses */}
  {MESES.map(mes => (
    <Column key={mes} width={90} align="right">
      <HeaderCell>{mes}</HeaderCell>
      <Cell dataKey={mes} />
    </Column>
  ))}

  {/* Total */}
  <Column width={120} align="right" fixed="right">
    <HeaderCell>Total Año</HeaderCell>
    <Cell dataKey="total" />
  </Column>
</Table>
```

#### HTML Table con Clase Global

```tsx
<table className="monthly-table">
  <thead>
    <tr>
      <th>Categoría</th>
      {MESES.map(mes => <th key={mes}>{mes}</th>)}
      <th>Total Año</th>
    </tr>
  </thead>
  <tbody>
    {/* ... */}
  </tbody>
</table>
```

**Nota:** Los anchos se aplican automáticamente vía CSS.

#### HTML Table con Inline Styles

```tsx
<table>
  <thead>
    <tr>
      <th style={{ minWidth: '160px' }}>Categoría</th>
      {MESES.map(mes => (
        <th key={mes} style={{ minWidth: 'var(--month-column-width)' }}>
          {mes}
        </th>
      ))}
      <th style={{ minWidth: '120px' }}>Total Año</th>
    </tr>
  </thead>
</table>
```

---

## Beneficios de la Estandarización

1. **Consistencia Visual:** Todas las tablas mensuales tienen el mismo aspecto
2. **Mantenibilidad:** Cambio centralizado en variable CSS
3. **Predictibilidad:** Desarrolladores saben exactamente qué anchos usar
4. **Responsive:** Ancho calculado permite planificar breakpoints
5. **Accesibilidad:** Espacio suficiente para zoom de texto sin overflow

---

## Próximos Pasos (Futuro)

### Fase 2: Migración a RSuite Table
- [ ] Migrar TablaPresupuestoIngresos.tsx (editable, alta complejidad)
- [ ] Migrar TablaPresupuestoServicios.tsx (editable, alta complejidad)
- [ ] Considerar Presupuesto.tsx (dashboard crítico con filas expandibles)

### Fase 3: Responsive Design
- [ ] Definir breakpoints para ocultar meses en móviles
- [ ] Implementar vista Q1/Q2/Q3/Q4 para tablets
- [ ] Mejorar scroll horizontal en pantallas pequeñas

### Fase 4: Optimización de zIndex
- [ ] Documentar estrategia de zIndex (1, 5, 10)
- [ ] Aplicar consistentemente en todas las tablas con sticky columns

---

## Validación

### Checklist de Implementación

- ✅ Variable CSS creada en index.css
- ✅ Clase .monthly-table actualizada
- ✅ RSuite Table actualizada (Supermercado)
- ✅ HTML tables inline actualizadas (Presupuesto, Tenpo)
- ✅ Sin errores de TypeScript
- ✅ Documentación creada

### Testing Manual

Para validar los cambios:
1. Abrir cada página con tabla mensual
2. Verificar que columnas de meses tengan 90px de ancho (aproximadamente)
3. Verificar que no haya overflow no deseado
4. Probar en diferentes resoluciones (1366px, 1440px, 1920px)
5. Verificar que scroll horizontal funcione correctamente

---

## Referencias

- **Inventario Completo:** [docs/MONTH_TABLES_INVENTORY.md](./MONTH_TABLES_INVENTORY.md)
- **Análisis Anterior:** Ver sección "Anchos de Columna" en inventario
- **Decisión Original:** 80-110px → 90px como compromiso

---

**Última Actualización:** 22 Feb 2026  
**Autor:** GitHub Copilot  
**Revisión:** Pendiente de validación visual en navegador
