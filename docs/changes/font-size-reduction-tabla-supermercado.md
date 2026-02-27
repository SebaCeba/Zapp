# Reducción de Tamaño de Fuente en Celdas - TablaPresupuestoSupermercado

**Fecha:** 22 Feb 2026  
**Componente:** `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`  
**Tipo de cambio:** Ajuste visual (fontSize)  

---

## Resumen

Se redujo el tamaño de fuente de las celdas de contenido (no headers) de la tabla RSuite en TablaPresupuestoSupermercado de **~14px** (default) a **12px** para mejorar la densidad visual y aprovechar mejor el espacio disponible.

---

## Motivación

1. **Mayor densidad de información:** Con estilo compact (rowHeight: 30px, padding: 4px), el tamaño de fuente default (~14px) dejaba poco espacio vertical
2. **Consistencia visual:** Alinearse con el diseño compacto ya aplicado a nivel de tabla
3. **Legibilidad mantenida:** 12px es suficientemente legible para datos numéricos en tablas
4. **Aprovechamiento de espacio:** Permite mostrar más contenido sin scroll excesivo

---

## Cambio Implementado

### Archivo Modificado

**`node-version/client/src/components/TablaPresupuestoSupermercado.tsx`**

### Código Anterior

```tsx
const CompactCell = (props: any) => 
  <Cell {...props} style={{ padding: '4px', ...props.style }} />;
```

### Código Nuevo

```tsx
const CompactCell = (props: any) => (
  <Cell
    {...props}
    style={{
      padding: '4px',
      fontSize: '12px',    // ✅ NUEVO
      ...props.style
    }}
  />
);
```

---

## Impacto

### Afectado
- ✅ Todas las celdas de datos (Categoría, Ene-Dic, Total Anual)
- ✅ Fila de datos editables (Supermercado)
- ✅ Fila de totales (Total Mensual)
- ✅ Inputs de edición inline (heredan el tamaño del contexto)

### NO Afectado
- ❌ Headers (CompactHeaderCell mantiene tamaño original)
- ❌ CSS global (`.app-table-header`, `.text-sm`, etc.)
- ❌ Otras tablas del proyecto
- ❌ Lógica de edición, API calls, validaciones

---

## Resultado Visual

| Elemento | Antes | Después | Cambio |
|----------|-------|---------|--------|
| **Celda de dato** | ~14px | 12px | -2px (-14%) |
| **Header** | 13px | 13px | Sin cambio |
| **Padding celda** | 4px | 4px | Sin cambio |
| **Row height** | 30px | 30px | Sin cambio |
| **Header height** | 30px | 30px | Sin cambio |

**Densidad final:** Tabla más compacta sin sacrificar legibilidad

---

## Consideraciones Técnicas

### Por qué 12px

- **Mínimo recomendado para contenido:** 12px es el tamaño mínimo generalmente aceptado para texto en interfaces web (según WCAG 2.1)
- **Tablas de datos:** Comúnmente usan 11-13px para maximizar densidad
- **Contexto numérico:** Los números son inherentemente más legibles que texto corrido, permitiendo tamaños menores
- **Combinación con padding 4px:** El espacio blanco compensa la reducción de tamaño

### Alternativas Consideradas

1. **11px:** Demasiado pequeño, podría afectar legibilidad en pantallas de menor resolución
2. **13px:** Mejora ligera pero insuficiente para el objetivo de densidad
3. **Ajustar rowHeight:** Descartado porque rompería la proporción con headers

---

## Testing Recomendado

### Checklist Visual

- [ ] Verificar legibilidad de números de 6+ dígitos ($999.999)
- [ ] Verificar que inputs de edición inline NO se vean cortados
- [ ] Verificar que fila de totales (negrita) se vea clara
- [ ] Verificar que valores con color gris (#9ca3af) sean legibles
- [ ] Probar en resoluciones: 1366x768, 1920x1080, 2560x1440

### Dispositivos

- [ ] Desktop (Chrome, Firefox, Edge)
- [ ] Laptop (resolución estándar 1920x1080)
- [ ] Monitor 4K con scaling 125-150%

---

## Rollback

Si se requiere revertir el cambio:

```tsx
// Volver a:
const CompactCell = (props: any) => 
  <Cell {...props} style={{ padding: '4px', ...props.style }} />;

// O aumentar a 13px si 12px resulta muy pequeño:
fontSize: '13px',
```

---

## Próximos Pasos

Si el cambio es exitoso, considerar:

1. **Aplicar a otras tablas RSuite:** SubscriptionTable.tsx en App.tsx
2. **Documentar como estándar:** Agregar fontSize guideline a TABLE_STANDARD_V1.md
3. **Crear CompactTable component:** Componente reutilizable con estos estilos por defecto

---

## Referencias

- **Estilo Compact Implementado:** [COMPACT_TABLE_STYLE.md](../implementacion_rsuite/fase-3/COMPACT_TABLE_STYLE.md)
- **Estándar de Tablas:** [TABLE_STANDARD_V1.md](../implementacion_rsuite/fase-3/TABLE_STANDARD_V1.md)
- **WCAG 2.1 Font Size:** https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html

---

**Última Actualización:** 22 Feb 2026  
**Autor:** GitHub Copilot  
**Status:** ✅ Implementado, pendiente validación visual
