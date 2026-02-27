# Fase 3: Tablas Complejas

**Estado:** 🔵 PLANIFICACIÓN  
**Tiempo estimado:** 32-40 horas (4-5 días)  
**Fecha de inicio:** Pendiente

---

## 📄 Documentos

### [FASE_3_DIAGNOSTICO.md](./FASE_3_DIAGNOSTICO.md)
Diagnóstico completo de todas las tablas actuales, análisis de problemas, y plan detallado de migración a RSuite `<Table>`.

**Contenido:**
- 📊 Inventario de 4 tablas con análisis detallado
- 🔍 Problemas identificados (HTML legacy, sin features avanzadas)
- 🎯 Features RSuite Table a implementar
- 📝 Plan de ejecución paso a paso
- 🎨 Ejemplos antes/después
- ⚠️ Desafíos y riesgos

### FASE_3_RESULTADOS.md
*Pendiente de crear durante la ejecución*

Documentará:
- Commits realizados
- Componentes migrados
- Features implementadas
- Problemas encontrados y soluciones
- Testing realizado

---

## 🎯 Objetivos de la Fase

1. ✅ Migrar 4 tablas de HTML `<table>` a RSuite `<Table>`
2. ✅ Implementar sorting en tablas clave
3. ✅ Agregar loading states con `<Loader>`
4. ✅ Implementar inline editing donde corresponda
5. ✅ Eliminar ~80-100 líneas de CSS custom

---

## 📊 Tablas a Migrar

| Tabla | Líneas | Complejidad | Prioridad | Features |
|-------|--------|-------------|-----------|----------|
| **SubscriptionTable.tsx** | 178 | ⭐⭐⭐ | 🔴 Alta | Sorting, Actions, Modal editing |
| **TcAnnualCyclesTable.tsx** | 142 | ⭐⭐⭐ | 🔴 Alta | Sticky header, Badges, Highlight |
| **TcOverridesTable.tsx** | 207 | ⭐⭐⭐⭐ | 🟡 Media | Inline editing, DatePicker cells |
| **ActualTable.tsx** | ? | ⭐⭐ | 🟢 Baja | Por analizar |

---

## 🔄 Orden de Ejecución

1. **SubscriptionTable.tsx** (12-16h)
   - Tabla crítica, buen caso de referencia
   - Migrar a Modal para edición

2. **TcAnnualCyclesTable.tsx** (8-12h)
   - Read-only, más simple
   - Sticky header + badges

3. **TcOverridesTable.tsx** (10-14h)
   - Inline editing complejo
   - Custom cells con DatePicker

4. **ActualTable.tsx** (4-6h)
   - Aplicar patrones establecidos

5. **Limpieza CSS** (2-4h)
   - Eliminar CSS obsoleto
   - Limpieza de `.module.css`

6. **Testing y Merge** (2-4h)
   - Testing funcional y responsive
   - Merge a main/develop

---

## 🛠️ Stack Técnico

### Componentes RSuite
- `<Table>`, `<Column>`, `<HeaderCell>`, `<Cell>`
- `<Tag>` (para badges)
- `<IconButton>`, `<ButtonGroup>`
- `<Loader>` (loading states)
- `<SelectPicker>` (year selectors)

### Iconos
- `@rsuite/icons/Edit`
- `@rsuite/icons/Trash`

### Features
- Sorting con `sortColumn` + `sortType`
- Custom cell rendering
- Action columns con iconos
- Sticky headers con `affixHeader`
- Row styling con `rowClassName`

---

## 📚 Referencias Útiles

- [RSuite Table Documentation](https://rsuitejs.com/components/table/)
- [Table Sortable Example](https://rsuitejs.com/components/table/#sortable)
- [Table Custom Cell](https://rsuitejs.com/components/table/#custom-cell)
- [Table Fixed Columns](https://rsuitejs.com/components/table/#fixed-column)

---

## ✅ Checklist Pre-Inicio

- [ ] Review completo de `FASE_3_DIAGNOSTICO.md`
- [ ] Crear branch `feat/rsuite-phase-3-tables`
- [ ] Verificar que Fase 1 y 2 están mergeadas
- [ ] Tener acceso a documentación RSuite Table
- [ ] Preparar testing environment

---

**Estado del documento:** ✅ Completo  
**Listo para comenzar:** Cuando se apruebe el plan
