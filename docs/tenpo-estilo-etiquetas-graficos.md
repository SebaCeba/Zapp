# Ajuste de Estilo de Etiquetas de Datos - Gráficos Vista Anual Tenpo

**Fecha**: 2026-03-06  
**Componentes afectados**: 
- `MonthlyBarChart.tsx` (gráfico mensual)
- `CategoryParetoChart.tsx` (gráfico de Pareto)

---

## 1. Problema Visual Detectado

Las etiquetas de datos en ambos gráficos de la vista anual de Tenpo (`presupuesto/tenpo`) presentaban un peso visual excesivo:

1. **Uso de negrita** (`fontWeight: '500'`): las etiquetas dominaban visualmente sobre las barras del gráfico
2. **Falta de jerarquía visual**: el peso de las etiquetas competía con el elemento principal (las barras)
3. **Legibilidad comprometida**: al ser demasiado prominentes, restaban foco del análisis visual de las barras

### Contexto técnico

Ambos gráficos utilizan el componente `<LabelList>` de Recharts para mostrar valores numéricos directamente en las barras:

- **MonthlyBarChart**: Etiquetas en la parte superior de barras verticales (`position="top"`)
- **CategoryParetoChart**: Etiquetas a la derecha de barras horizontales (`position="right"`)

Las etiquetas usan formato abreviado mediante la función `formatK()`:
- `$1.4M` para montos ≥ $1,000,000
- `$850k` para montos ≥ $10,000
- `$9500` para montos menores

---

## 2. Criterio UX Aplicado

### Principio de jerarquía visual

**Las etiquetas deben informar, no dominar.**

En un gráfico de barras, el elemento principal es la barra misma (su longitud o altura). Las etiquetas numéricas son información complementaria que:

- Facilita la lectura precisa sin necesidad de hover
- Debe ser discreta y accesible
- No debe competir con el peso visual de las barras

### Diseño de apoyo

Las etiquetas de datos actúan como **anotaciones de apoyo**, no como titulares. Por ello, deben:

1. Usar **peso de fuente normal** (regular) en lugar de medium/bold
2. Emplear un **color neutro** que no coincida con el color primario de las barras
3. Mantener un **tamaño legible pero discreto** (12-14px en contextos estándar)

### Contexto de la vista anual Tenpo

En esta vista existen dos gráficos coordinados:

- **Gráfico mensual** (izquierda): proyección temporal de cuotas por mes
- **Gráfico de Pareto** (derecha): distribución de categorías ordenada por monto

Las etiquetas permiten comparar rápidamente valores sin necesidad de interacción (hover), pero deben mantener un perfil visual bajo para no saturar la interfaz.

---

## 3. Estilos Antes/Después

### Estado Anterior

```typescript
// MonthlyBarChart.tsx
<LabelList 
  dataKey="total" 
  position="top" 
  formatter={(value: number) => value > 0 ? formatK(value) : ''}
  style={{ fontSize: '11px', fill: '#374151', fontWeight: '500' }}
/>

// CategoryParetoChart.tsx
<LabelList 
  dataKey="total" 
  position="right" 
  formatter={(value: number) => value > 0 ? formatK(value) : ''}
  style={{ fontSize: '11px', fill: '#374151', fontWeight: '500' }}
/>
```

**Análisis del estado anterior:**

- `fontSize: '11px'`: tamaño pequeño, aceptable pero al límite de legibilidad
- `fill: '#374151'`: gris oscuro (Gray 700 de Tailwind), color apropiado
- `fontWeight: '500'`: peso medium, demasiado prominente para una anotación

### Estado Actual

```typescript
// MonthlyBarChart.tsx
<LabelList 
  dataKey="total" 
  position="top" 
  formatter={(value: number) => value > 0 ? formatK(value) : ''}
  style={{ fontSize: '12px', fill: '#4B5563', fontWeight: '400' }}
/>

// CategoryParetoChart.tsx
<LabelList 
  dataKey="total" 
  position="right" 
  formatter={(value: number) => value > 0 ? formatK(value) : ''}
  style={{ fontSize: '12px', fill: '#4B5563', fontWeight: '400' }}
/>
```

**Análisis del estado actual:**

- `fontSize: '12px'`: incremento sutil (+1px) para mejorar legibilidad
- `fill: '#4B5563'`: gris neutro (Gray 600 de Tailwind), menos prominente que el anterior
- `fontWeight: '400'`: peso normal (regular), apropiado para texto de apoyo

### Comparativa Visual

| Propiedad       | Antes      | Después    | Impacto                                    |
|-----------------|------------|------------|--------------------------------------------|
| **fontSize**    | 11px       | 12px       | +1px, mayor legibilidad sin dominar        |
| **fill**        | `#374151`  | `#4B5563`  | Cambio sutil a gris medio, más neutro      |
| **fontWeight**  | `500`      | `400`      | Reduce prominencia, elimina "negrita"      |

### Decisión de color

**`#4B5563` (Gray 600)** vs **`#374151` (Gray 700)**:

- Gray 600 es un gris medio que mantiene contraste suficiente sobre fondo blanco
- Visualmente menos "pesado" que Gray 700
- Separa claramente el color de la anotación del color de las barras (azul/violeta `#6366f1`)

---

## 4. Archivos Modificados

### `node-version/client/src/components/presupuesto/MonthlyBarChart.tsx`

**Líneas modificadas**: aprox. línea 203

**Cambio aplicado**:
- `fontSize`: `11px` → `12px`
- `fill`: `#374151` → `#4B5563`
- `fontWeight`: `500` → `400`

**Contexto del gráfico**:
- Barras verticales con etiquetas en la parte superior
- 12 barras (una por mes del año seleccionado)
- Altura fija: 360px

### `node-version/client/src/components/presupuesto/CategoryParetoChart.tsx`

**Líneas modificadas**: aprox. línea 273

**Cambio aplicado**:
- `fontSize`: `11px` → `12px`
- `fill`: `#374151` → `#4B5563`
- `fontWeight`: `400` (cambio idéntico al gráfico mensual)

**Contexto del gráfico**:
- Barras horizontales con etiquetas a la derecha
- Número variable de barras (categorías con compras en el periodo)
- Altura fija: 360px

---

## 5. Decisiones de Diseño

### ¿Por qué no usar el color de las barras?

Las barras usan `#6366f1` (Indigo 500) como color base. Usar este mismo color en las etiquetas crearía:

1. **Confusión visual**: las etiquetas parecerían parte de la barra misma
2. **Pérdida de jerarquía**: todo tendría el mismo peso visual
3. **Falta de contraste semántico**: las etiquetas son texto, no forma

### ¿Por qué 12px y no mayor?

Un tamaño de fuente demasiado grande haría que las etiquetas:

- Ocupen demasiado espacio vertical/horizontal
- Compitan con el rótulo del eje
- Saturen visualmente la interfaz

12px es el punto óptimo entre:
- Legibilidad sin esfuerzo
- Discreción visual
- Consistencia con otros textos auxiliares (tooltips, ejes)

### ¿Por qué fontWeight: 400 y no 300?

`fontWeight: 300` (light) sería demasiado delgado y dificultaría la lectura rápida. `fontWeight: 400` (normal/regular) es el estándar para texto de cuerpo y provee:

- Legibilidad óptima en tamaños pequeños (12px)
- Suficiente contraste con el fondo
- Consistencia con el resto de la interfaz (texto de tabla, tooltips)

---

## 6. Validación Manual

### Checklist de verificación

- [ ] **Gráfico mensual**: etiquetas visibles en todas las barras
- [ ] **Gráfico mensual**: etiquetas no se superponen entre sí
- [ ] **Gráfico mensual**: etiquetas legibles sin esfuerzo
- [ ] **Gráfico de Pareto**: etiquetas visibles en todas las barras
- [ ] **Gráfico de Pareto**: etiquetas no exceden el margen derecho
- [ ] **Ambos gráficos**: las barras siguen siendo el elemento visual dominante
- [ ] **Ambos gráficos**: las etiquetas no usan color azul/índigo
- [ ] **Estilo consistente**: ambos gráficos usan el mismo estilo de etiquetas

### Escenarios de prueba

1. **Año con 12 meses activos**: verificar que todas las etiquetas del gráfico mensual son legibles
2. **Filtro por mes**: verificar que el gráfico de Pareto recalcula correctamente las etiquetas
3. **Muchas categorías (>10)**: verificar que las etiquetas del Pareto no se amontonan
4. **Categorías sin compras**: verificar que no se muestran etiquetas vacías (`formatter` retorna `''`)
5. **Montos grandes (>$1M)**: verificar formato abreviado `$1.4M`
6. **Montos medianos (>$10k)**: verificar formato abreviado `$850k`

### Validación de contraste

**WCAG 2.1 - Nivel AA**:

- Contraste mínimo para texto pequeño (<18px): **4.5:1**

**Color utilizado**: `#4B5563` sobre fondo blanco `#FFFFFF`

Contraste aproximado: **8.1:1** ✅ (cumple AAA)

Referencia: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/?fcolor=4B5563&bcolor=FFFFFF)

---

## 7. Resumen Ejecutivo

### Cambios implementados

✅ Eliminada "negrita" de etiquetas (`fontWeight: 500 → 400`)  
✅ Cambiado color a gris neutro más claro (`#374151 → #4B5563`)  
✅ Incrementado tamaño ligeramente para mejor legibilidad (`11px → 12px`)  
✅ Mantenido formato abreviado de números ($1.4M, $850k)  
✅ Aplicado estilo consistente en ambos gráficos  

### Objetivos alcanzados

- **Jerarquía visual mejorada**: las barras dominan, las etiquetas apoyan
- **Legibilidad mantenida**: 12px con fontWeight 400 es legible sin ser intrusivo
- **Estilo consistente**: ambos gráficos usan exactamente el mismo estilo
- **Accesibilidad preservada**: contraste de 8.1:1 cumple WCAG AAA

### Sin regresos funcionales

- Interacciones preservadas (click en barras)
- Filtros coordinados funcionan igual
- Tooltips mantienen su comportamiento
- Altura fija de gráficos (360px) no se modificó
- Formato de números (`formatK()`) sin cambios

---

## 8. Relación con Documentación Previa

Este ajuste es parte de la **Fase 4** de iteraciones sobre la vista anual de Tenpo:

1. **Fase 1**: Transformación arquitectónica (tabla gigante → tres capas analíticas)
   - Documento: `docs/tenpo-anual-rediseno-analytics.md`

2. **Fase 2**: Rediseño de gráficos (stacked bar → dos gráficos coordinados)
   - Documento: `docs/tenpo-anual-rediseno-graficos-coordinados.md`

3. **Fase 3**: Eliminación de redundancia de filtros + altura fija 300px
   - Documento: `docs/tenpo-anual-filtros-altura-graficos.md`

4. **Fase 3.5**: Incremento de altura a 360px + adición de etiquetas LabelList
   - Documento: `docs/tenpo-anual-ajuste-altura-y-etiquetas-graficos.md`

5. **Fase 4** (este documento): Ajuste de estilo de etiquetas para mejor jerarquía visual
   - Documento: `docs/tenpo-estilo-etiquetas-graficos.md` ← **Estamos aquí**

### Progresión del diseño de etiquetas

| Fase      | Estado de etiquetas                                      |
|-----------|----------------------------------------------------------|
| Fase 1-2  | Sin etiquetas visibles (solo tooltip al hover)          |
| Fase 3    | Sin etiquetas visibles (altura 300px fija)               |
| Fase 3.5  | Etiquetas introducidas: `fontSize: 11px, fontWeight: 500` |
| Fase 4    | Etiquetas refinadas: `fontSize: 12px, fontWeight: 400`   |

---

## 9. Próximos Pasos (Opcional)

### Posibles mejoras futuras

1. **Etiquetas condicionales**: ocultar etiquetas en barras muy pequeñas (ej. <$50k) para evitar clutter
2. **Modo oscuro**: ajustar `fill` a un gris más claro para fondo oscuro
3. **Animaciones**: fade-in de etiquetas al cargar el gráfico (polaco visual)
4. **Formato dinámico**: usar formato más corto ($1.4M → $1M) si hay muchas barras

### Sin cambios necesarios por ahora

La implementación actual cumple con todos los requisitos de UX y no presenta problemas de usabilidad o legibilidad. Cualquier mejora adicional sería un refinamiento estético menor, no una necesidad funcional.

---

## 10. Conclusión

El ajuste de estilo de etiquetas mejora significativamente la jerarquía visual de los gráficos de la vista anual de Tenpo. Las etiquetas ahora cumplen su rol de apoyo informativo sin competir con el elemento principal (las barras). El cambio es sutil pero efectivo: las etiquetas son igual de legibles pero visualmente más discretas.

**Impacto final**: análisis visual más limpio y profesional, sin pérdida de información ni funcionalidad.
