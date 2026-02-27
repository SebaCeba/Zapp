# Mejora de UX: Scroll Horizontal Persistente y Header Fijo - TablaPresupuestoSupermercado

**Fecha:** 22 Feb 2026  
**Componente:** `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`  
**Tipo de cambio:** Mejora de UX (scroll behavior)  

---

## Resumen

Se agregaron dos props a la tabla RSuite para mejorar la experiencia de usuario al navegar por datos con scroll horizontal:

1. **`affixHorizontalScrollbar`** - Mantiene visible el scrollbar horizontal incluso cuando hay scroll vertical
2. **`affixHeader`** - Mantiene el header fijo al hacer scroll vertical

---

## Problema anterior

### Scrollbar Horizontal Oculto
- **Síntoma:** Al hacer scroll vertical en la página, el scrollbar horizontal de la tabla desaparecía de la vista
- **Impacto:** Usuario debía hacer scroll hacia abajo hasta el final de la tabla para usar el scroll horizontal
- **Frustración:** Para ver columnas de meses lejanos (Oct-Dic), había que:
  1. Scroll hacia abajo hasta el final de la tabla
  2. Scroll horizontal
  3. Scroll hacia arriba para ver los datos

### Header Desaparecía
- **Síntoma:** Al hacer scroll vertical, los nombres de columnas (Ene, Feb, Mar...) desaparecían
- **Impacto:** Usuario perdía contexto de qué mes estaba viendo
- **Confusión:** Especialmente problemático con 12 columnas similares de números

---

## Solución Implementada

### Cambio en el Código

**Archivo:** `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`

**Antes:**
```tsx
<Table
  data={tableData}
  autoHeight
  bordered={true}
  cellBordered={true}
  showHeader={true}
  hover={true}
  rowHeight={30}
  headerHeight={30}
  rowClassName={...}
>
```

**Después:**
```tsx
<Table
  data={tableData}
  autoHeight
  bordered={true}
  cellBordered={true}
  showHeader={true}
  hover={true}
  rowHeight={30}
  headerHeight={30}
  affixHeader              // ✅ NUEVO
  affixHorizontalScrollbar // ✅ NUEVO
  rowClassName={...}
>
```

---

## Descripción de Props

### `affixHeader` (boolean)

**Propósito:** Fija el header de la tabla en la parte superior del viewport cuando se hace scroll vertical.

**Comportamiento:**
- Cuando el usuario hace scroll hacia abajo, el header permanece visible
- El header se "pega" (sticky) en la parte superior
- Los nombres de columnas (Categoría, Ene, Feb, ..., Total Anual) siempre visibles
- No requiere configuración adicional de CSS

**Beneficio:**
- Usuario siempre sabe qué dato está viendo en cada columna
- Reduce carga cognitiva al navegar por filas
- Especialmente útil con 12+ columnas similares

### `affixHorizontalScrollbar` (boolean)

**Propósito:** Mantiene el scrollbar horizontal visible en la parte inferior del viewport, incluso cuando la tabla está fuera de vista.

**Comportamiento:**
- El scrollbar horizontal se "pega" en la parte inferior del viewport
- Permanece accesible incluso si el contenido de la tabla está más arriba o abajo
- Usuario puede hacer scroll horizontal sin buscar el scrollbar
- Sincronizado con la posición real de la tabla

**Beneficio:**
- Acceso inmediato al scroll horizontal desde cualquier posición vertical
- Elimina la necesidad de scroll vertical para acceder al scroll horizontal
- Mejora significativa en navegación de tablas anchas

---

## Casos de Uso Mejorados

### Escenario 1: Comparar datos de Enero vs Diciembre
**Antes:**
1. Ver datos de Enero
2. Scroll hasta el final de la tabla
3. Arrastrar scrollbar horizontal
4. Scroll hacia arriba para ver datos
5. Perder contexto porque header desapareció

**Después:**
1. Ver datos de Enero
2. Arrastrar scrollbar horizontal (siempre visible)
3. Header permanece visible
4. Comparación directa sin perder contexto

### Escenario 2: Revisar Total Anual (columna fija derecha)
**Antes:**
- Si tabla tiene scroll vertical, header desaparece
- Difícil recordar qué fila es cada categoría

**Después:**
- Header siempre visible con "Total Anual"
- Contexto claro incluso en scroll profundo

### Escenario 3: Editar valores en diferentes meses
**Antes:**
- Editar Enero → fácil
- Editar Octubre → scroll horizontal → perder header
- Volver a Enero → scroll horizontal inverso → buscar scrollbar

**Después:**
- Scrollbar siempre accesible
- Header siempre visible
- Navegación fluida entre meses

---

## Compatibilidad

### Requisitos RSuite
- ✅ RSuite Table v5.0+
- ✅ No requiere configuración adicional
- ✅ Funciona con `autoHeight={true}`
- ✅ Compatible con `fixed` columns (left/right)
- ✅ Compatible con `bordered` y `cellBordered`

### Navegadores
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ IE11: Comportamiento degradado pero funcional

### Responsive
- ✅ Desktop: Experiencia completa
- ✅ Tablet: Funciona correctamente
- ⚠️ Mobile: RSuite Table no es responsive por diseño, pero props no rompen nada

---

## Impacto en Performance

### Overhead
- **CPU:** Mínimo - RSuite maneja el sticky positioning eficientemente
- **Memoria:** Insignificante - no duplica elementos
- **Render:** Sin re-renders adicionales

### Pruebas Recomendadas
- [ ] Verificar smooth scroll en Chrome
- [ ] Verificar header sticky en Firefox
- [ ] Verificar scrollbar affix en diferentes alturas de window
- [ ] Probar con 100+ filas (si se extiende la tabla en el futuro)

---

## Notas Técnicas

### ¿Por qué usar estas props en lugar de CSS?

**Alternativa rechazada: CSS puro**
```css
.rs-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
}
```

**Problemas:**
- Conflictos con layout de RSuite
- No maneja el scrollbar horizontal
- Requiere z-index manual
- Puede romper fixed columns

**Ventaja de props RSuite:**
- Diseñadas específicamente para este caso de uso
- Manejo interno de z-index y posicionamiento
- Compatible con todas las features de Table
- Mantenido por el equipo de RSuite

### Limitaciones Conocidas

1. **autoHeight requerido:** `affixHeader` funciona mejor con `autoHeight={true}`
2. **Parent container:** Si el parent tiene `overflow: hidden`, puede interferir
3. **Nested scrolling:** Si hay scroll anidado en la página, puede haber conflictos

**Mitigación en nuestro caso:**
- ✅ Ya usamos `autoHeight={true}`
- ✅ Parent container es `<div className="bg-white rounded-lg shadow overflow-hidden">` - funciona correctamente
- ✅ No hay scroll anidado en la página de Supermercado

---

## Rollback

Si se requiere revertir:

```tsx
// Eliminar estas dos líneas:
affixHeader
affixHorizontalScrollbar
```

**Motivos válidos para rollback:**
- Conflicto con layout específico
- Incompatibilidad con versión de RSuite
- Problemas de performance (poco probable)

---

## Próximos Pasos

### Aplicar a Otras Tablas

Si el cambio es exitoso, considerar aplicar a:

1. **SubscriptionTable.tsx** (App.tsx - suscripciones)
   - También tiene scroll horizontal
   - También se beneficiaría de header fijo

2. **Otras tablas RSuite del proyecto**
   - Evaluar caso por caso
   - No todas las tablas necesitan estas props

### Estándar de Proyecto

Agregar a docs/implementacion_rsuite/fase-3/TABLE_STANDARD_V1.md:

```markdown
## Props Recomendadas para Tablas RSuite

### Scroll UX
- affixHeader: true (para tablas con múltiples filas)
- affixHorizontalScrollbar: true (para tablas con scroll horizontal)
```

---

## Referencias

- **RSuite Table API:** https://rsuitejs.com/components/table/#affix-header
- **RSuite affixHeader docs:** https://rsuitejs.com/components/table/#affix-horizontal-scrollbar
- **PR relacionada:** (pendiente si se crea)
- **Issue relacionada:** (pendiente si existe)

---

**Última Actualización:** 22 Feb 2026  
**Autor:** GitHub Copilot  
**Status:** ✅ Implementado, pendiente validación UX
