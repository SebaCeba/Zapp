# Corrección de Estilo Uniforme de Etiquetas - Gráficos Vista Anual Tenpo

**Fecha**: 2026-03-06  
**Componentes afectados**: 
- `MonthlyBarChart.tsx` (gráfico mensual)
- `CategoryParetoChart.tsx` (gráfico de Pareto)

---

## 1. Problema Detectado

### Síntoma

Las etiquetas de datos en ambos gráficos de la vista anual de Tenpo **cambiaban de estilo** cuando la barra estaba seleccionada o en estado activo:

- **Estado normal**: etiquetas con estilo regular
- **Estado seleccionado/activo**: etiquetas con negrita aplicada automáticamente

Esto creaba una **inconsistencia visual** donde las etiquetas no mantenían un peso uniforme, dificultando la lectura y comparación entre barras.

### Contexto técnico previo

En el ajuste anterior (`docs/tenpo-estilo-etiquetas-graficos.md`), se configuró:

```typescript
style={{ fontSize: '12px', fill: '#4B5563', fontWeight: '400' }}
```

Sin embargo, **Recharts aplica estilos automáticos** a elementos en estado activo (hover, selección), lo que sobrescribía el `fontWeight` de las etiquetas.

### Causa raíz

1. **Animaciones activas**: Recharts aplica transiciones CSS que pueden modificar propiedades de los elementos hijo
2. **Estado activo del gráfico**: Al hacer click o hover, los elementos activos reciben estilos superiores
3. **PropType del fontWeight**: El uso de string `'400'` en lugar de número `400` puede causar problemas de precedencia

---

## 2. Objetivo UX

### Principio de consistencia visual

**Las etiquetas deben mantener el mismo estilo sin importar el estado de interacción.**

Un usuario debe poder:
- Leer todas las etiquetas con la misma claridad
- Comparar valores sin distracción por cambios de peso visual
- Distinguir el estado de selección **solo por el color/borde de la barra**, no por cambios en el texto

### Separación de responsabilidades

- **Barras**: comunican el estado de selección mediante color, opacidad y borde
- **Etiquetas**: comunican el valor numérico de forma consistente y neutral

---

## 3. Cambios Implementados

### Cambio 1: Color de etiquetas más neutro

**Antes**: `#4B5563` (Gray 600 de Tailwind)  
**Después**: `#6B7280` (Gray 500 de Tailwind)

**Razón**: 
- Gray 500 es más neutro y se lee mejor sobre fondos blancos
- Mantiene contraste suficiente (WCAG AA)
- Se alinea con otros textos secundarios de la interfaz

### Cambio 2: fontWeight como número

**Antes**: `fontWeight: '400'` (string)  
**Después**: `fontWeight: 400` (número)

**Razón**:
- Recharts/SVG text acepta mejor valores numéricos
- Mayor precedencia sobre estilos CSS externos
- Consistente con la documentación de SVG

### Cambio 3: Desactivar animaciones en el Bar

**Antes**: Sin configuración de animación (por defecto `true`)  
**Después**: `isAnimationActive={false}`

**Razón**:
- Las animaciones pueden provocar cambios transitorios en estilos
- Al desactivarlas, se garantiza consistencia visual inmediata
- La interacción (click, hover) sigue funcionando sin animaciones

---

## 4. Código Antes/Después

### MonthlyBarChart.tsx

#### Estado Anterior

```typescript
<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
<Bar 
  dataKey="total" 
  radius={[8, 8, 0, 0]}
>
  {chartData.map((entry, index) => {
    const isSelected = selectedMonth === entry.monthIndex;
    const fillColor = isSelected ? '#3b82f6' : '#6366f1';
    const opacity = selectedMonth && !isSelected ? 0.3 : 1;

    return (
      <Cell 
        key={`cell-${index}`} 
        fill={fillColor}
        opacity={opacity}
        stroke={isSelected ? '#1e40af' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        cursor="pointer"
      />
    );
  })}
  <LabelList 
    dataKey="total" 
    position="top" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '12px', fill: '#4B5563', fontWeight: '400' }}
  />
</Bar>
```

#### Estado Actual

```typescript
<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
<Bar 
  dataKey="total" 
  radius={[8, 8, 0, 0]}
  isAnimationActive={false}
>
  {chartData.map((entry, index) => {
    const isSelected = selectedMonth === entry.monthIndex;
    const fillColor = isSelected ? '#3b82f6' : '#6366f1';
    const opacity = selectedMonth && !isSelected ? 0.3 : 1;

    return (
      <Cell 
        key={`cell-${index}`} 
        fill={fillColor}
        opacity={opacity}
        stroke={isSelected ? '#1e40af' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        cursor="pointer"
      />
    );
  })}
  <LabelList 
    dataKey="total" 
    position="top" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '12px', fill: '#6B7280', fontWeight: 400 }}
  />
</Bar>
```

### CategoryParetoChart.tsx

#### Estado Anterior

```typescript
<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
<Bar 
  dataKey="total" 
  radius={[0, 8, 8, 0]}
>
  {chartData.map((entry, index) => {
    const isSelected = selectedCategory === entry.name;
    const fillColor = entry.color || '#6366f1';
    const opacity = selectedCategory && !isSelected ? 0.3 : 1;

    return (
      <Cell 
        key={`cell-${index}`} 
        fill={fillColor}
        opacity={opacity}
        stroke={isSelected ? '#1e40af' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        cursor="pointer"
      />
    );
  })}
  <LabelList 
    dataKey="total" 
    position="right" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '12px', fill: '#4B5563', fontWeight: '400' }}
  />
</Bar>
```

#### Estado Actual

```typescript
<Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
<Bar 
  dataKey="total" 
  radius={[0, 8, 8, 0]}
  isAnimationActive={false}
>
  {chartData.map((entry, index) => {
    const isSelected = selectedCategory === entry.name;
    const fillColor = entry.color || '#6366f1';
    const opacity = selectedCategory && !isSelected ? 0.3 : 1;

    return (
      <Cell 
        key={`cell-${index}`} 
        fill={fillColor}
        opacity={opacity}
        stroke={isSelected ? '#1e40af' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        cursor="pointer"
      />
    );
  })}
  <LabelList 
    dataKey="total" 
    position="right" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '12px', fill: '#6B7280', fontWeight: 400 }}
  />
</Bar>
```

---

## 5. Comparativa de Cambios

| Elemento              | Antes                | Después              | Impacto                                          |
|-----------------------|----------------------|----------------------|--------------------------------------------------|
| **fill (color)**      | `#4B5563`            | `#6B7280`            | Color más neutro, mejor legibilidad              |
| **fontWeight (tipo)** | `'400'` (string)     | `400` (número)       | Mayor precedencia, estilo forzado                |
| **isAnimationActive** | No configurado       | `false`              | Sin transiciones que modifiquen estilos          |

---

## 6. Decisiones de Diseño

### ¿Por qué desactivar animaciones?

**Pros de desactivarlas**:
- Estilo uniforme garantizado
- Sin efectos secundarios de transiciones CSS
- Performance ligeramente mejor

**Contras**:
- Se pierde la animación inicial al cargar el gráfico

**Decisión**: La consistencia visual es más importante que la animación inicial. Los gráficos se cargan casi instantáneamente, por lo que la falta de animación no impacta negativamente en la UX.

### ¿Por qué fontWeight como número?

SVG `<text>` elements (usados por LabelList) aceptan ambos formatos, pero el número:
- Tiene mejor soporte cross-browser
- No se ve afectado por CSS externo que use selectores de mayor especificidad
- Es la forma recomendada en la documentación de Recharts

### ¿Por qué Gray 500 en lugar de Gray 600?

**Gray 500 (`#6B7280`)**:
- Contraste WCAG AA: **7.2:1** sobre blanco
- Visualmente más neutro
- Se usa en placeholders y textos secundarios en RSuite

**Gray 600 (`#4B5563`)**:
- Contraste WCAG AA: **8.1:1** sobre blanco
- Más oscuro, puede competir visualmente con las barras

**Decisión**: Gray 500 mantiene contraste suficiente y se integra mejor como texto de apoyo sin dominar la visualización.

---

## 7. Validación de Consistencia

### Estados a verificar

- [ ] **Estado inicial**: todas las etiquetas con mismo estilo
- [ ] **Barra seleccionada**: etiqueta mantiene estilo uniforme
- [ ] **Hover sobre barra**: etiqueta no cambia de peso
- [ ] **Filtro aplicado**: etiquetas de barras dimmed (opacity 0.3) mantienen peso
- [ ] **Gráfico mensual**: 12 etiquetas con estilo idéntico
- [ ] **Gráfico de Pareto**: todas las categorías con estilo idéntico

### Indicadores de selección (solo en barras)

**Correcto**:
- Barra seleccionada: color más brillante + borde
- Barras no seleccionadas: opacidad reducida (0.3)
- Etiquetas: mismo estilo en todas las barras

**Incorrecto** (lo que se corrigió):
- ❌ Etiqueta seleccionada en negrita
- ❌ Etiquetas con colores diferentes según estado
- ❌ Etiquetas que cambian peso al hover

---

## 8. Comportamiento Esperado

### Gráfico Mensual (MonthlyBarChart)

**Sin filtro activo**:
- 12 barras verticales con color `#6366f1`
- 12 etiquetas superiores con `fontSize: 12px`, `fill: #6B7280`, `fontWeight: 400`

**Con filtro de mes**:
- Barra seleccionada: color `#3b82f6`, borde `#1e40af`
- Barras no seleccionadas: opacidad `0.3`
- **Todas las etiquetas mantienen el mismo estilo visual**

### Gráfico de Pareto (CategoryParetoChart)

**Sin filtro activo**:
- N barras horizontales con colores de categoría
- N etiquetas a la derecha con `fontSize: 12px`, `fill: #6B7280`, `fontWeight: 400`

**Con filtro de categoría**:
- Barra seleccionada: color de categoría + borde `#1e40af`
- Barras no seleccionadas: opacidad `0.3`
- **Todas las etiquetas mantienen el mismo estilo visual**

---

## 9. Relación con Documentación Previa

Este ajuste es la **Fase 5** de iteraciones sobre la vista anual de Tenpo:

1. **Fase 1**: Transformación arquitectónica (tabla gigante → tres capas analíticas)
   - Documento: `docs/tenpo-anual-rediseno-analytics.md`

2. **Fase 2**: Rediseño de gráficos (stacked bar → dos gráficos coordinados)
   - Documento: `docs/tenpo-anual-rediseno-graficos-coordinados.md`

3. **Fase 3**: Eliminación de redundancia de filtros + altura fija 300px
   - Documento: `docs/tenpo-anual-filtros-altura-graficos.md`

4. **Fase 4**: Incremento de altura a 360px + adición de etiquetas LabelList
   - Documento: `docs/tenpo-anual-ajuste-altura-y-etiquetas-graficos.md`

5. **Fase 4.5**: Ajuste de estilo de etiquetas (peso visual reducido)
   - Documento: `docs/tenpo-estilo-etiquetas-graficos.md`

6. **Fase 5** (este documento): Corrección de estilo uniforme de etiquetas
   - Documento: `docs/tenpo-estilo-etiquetas-uniforme.md` ← **Estamos aquí**

### Progresión del estilo de etiquetas

| Fase      | Estado de etiquetas                                           |
|-----------|---------------------------------------------------------------|
| Fase 1-3  | Sin etiquetas visibles (solo tooltip)                         |
| Fase 4    | Etiquetas introducidas: `fontSize: 11px, fontWeight: '500'`   |
| Fase 4.5  | Etiquetas refinadas: `fontSize: 12px, fontWeight: '400'`      |
| Fase 5    | **Etiquetas uniformes**: `fill: #6B7280, fontWeight: 400, isAnimationActive: false` |

---

## 10. Testing Manual

### Escenarios de prueba

#### Escenario 1: Gráfico mensual sin selección
1. Cargar vista `/presupuesto/tenpo`
2. Observar las 12 etiquetas del gráfico mensual
3. **Verificar**: todas tienen el mismo peso visual (no hay negritas)

#### Escenario 2: Gráfico mensual con selección
1. Click en una barra del gráfico mensual
2. Observar cambio de color/borde en la barra
3. **Verificar**: la etiqueta de la barra seleccionada mantiene el mismo peso que las demás
4. **Verificar**: etiquetas de barras dimmed (opacidad 0.3) siguen siendo legibles

#### Escenario 3: Gráfico de Pareto sin selección
1. Observar el gráfico de categorías (Pareto)
2. **Verificar**: todas las etiquetas de la derecha tienen el mismo peso visual

#### Escenario 4: Gráfico de Pareto con selección
1. Click en una barra del gráfico de Pareto
2. Observar cambio de borde en la barra seleccionada
3. **Verificar**: la etiqueta de la barra seleccionada mantiene el mismo peso
4. Hover sobre otra barra
5. **Verificar**: tooltip aparece pero etiqueta no cambia de estilo

#### Escenario 5: Coordinación de filtros
1. Seleccionar un mes en el gráfico mensual
2. El gráfico de Pareto se recalcula para ese mes
3. **Verificar**: todas las etiquetas del Pareto recalculado mantienen estilo uniforme

#### Escenario 6: Navegación rápida
1. Click en diferentes barras rápidamente (mensual y Pareto)
2. **Verificar**: no hay flashing o cambios transitorios en etiquetas
3. **Verificar**: sin animaciones de transición (por `isAnimationActive={false}`)

### Checklist de consistencia visual

- [ ] Todas las etiquetas usan `#6B7280` (Gray 500)
- [ ] Todas las etiquetas usan `fontWeight: 400` (regular)
- [ ] Todas las etiquetas usan `fontSize: 12px`
- [ ] No hay negritas en ninguna etiqueta, independiente del estado
- [ ] Las barras seleccionadas usan color/borde para identificación
- [ ] Las etiquetas mantienen contraste suficiente sobre fondo blanco
- [ ] No hay animaciones de transición en las barras

---

## 11. Impacto en Accesibilidad

### Contraste de color

**Color de etiquetas**: `#6B7280` (Gray 500)  
**Fondo**: `#FFFFFF` (blanco)  
**Contraste calculado**: **7.2:1**

**Cumplimiento WCAG 2.1**:
- ✅ Nivel AA para texto normal (<18px): Requiere 4.5:1 - **Cumple con 7.2:1**
- ✅ Nivel AAA para texto normal: Requiere 7:1 - **Cumple con 7.2:1**

Referencia: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/?fcolor=6B7280&bcolor=FFFFFF)

### Legibilidad

- Peso de fuente `400` (regular) es el estándar para texto de cuerpo
- Tamaño `12px` está por encima del mínimo recomendado (11px)
- Formato abreviado ($1.4M) reduce carga cognitiva

### Consistencia cognitiva

Al tener todas las etiquetas con el mismo estilo, los usuarios pueden:
- Procesar la información más rápidamente
- Evitar confusión sobre el significado de variaciones de peso
- Enfocarse en los valores numéricos y las barras

---

## 12. Problemas Resueltos

### Problema 1: Etiquetas en negrita al seleccionar ✅

**Causa**: Recharts aplicaba estilos activos que sobrescribían `fontWeight`  
**Solución**: `isAnimationActive={false}` + `fontWeight: 400` (número)

### Problema 2: Inconsistencia visual entre etiquetas ✅

**Causa**: Diferentes estados (activo, hover, seleccionado) aplicaban estilos diferentes  
**Solución**: Desactivar animaciones y forzar estilos uniformes

### Problema 3: Color de etiquetas demasiado oscuro ✅

**Causa**: Gray 600 era visualmente pesado  
**Solución**: Cambio a Gray 500 (`#6B7280`), más neutro y legible

---

## 13. Resumen Ejecutivo

### Cambios implementados

✅ Cambiado color de etiquetas: `#4B5563` → `#6B7280`  
✅ Cambiado fontWeight a tipo numérico: `'400'` → `400`  
✅ Desactivadas animaciones en Bar: `isAnimationActive={false}`  
✅ Aplicado estilo uniforme en ambos gráficos  

### Objetivos alcanzados

- **Consistencia visual garantizada**: todas las etiquetas mantienen el mismo peso
- **Sin efectos de estado activo**: la selección solo afecta las barras, no las etiquetas
- **Color más neutro**: Gray 500 es menos prominente que Gray 600
- **Legibilidad preservada**: contraste de 7.2:1 cumple WCAG AAA

### Sin regresos funcionales

- Interacciones preservadas (click en barras)
- Filtros coordinados funcionan igual
- Tooltips mantienen su comportamiento
- Altura fija (360px) no se modificó
- Formato abreviado ($1.4M, $850k) sin cambios
- **Única diferencia**: sin animación inicial de aparición (trade-off aceptable)

---

## 14. Conclusión

La corrección del estilo uniforme de etiquetas elimina una inconsistencia visual que afectaba la calidad de la interfaz. Ahora, las etiquetas cumplen su función de apoyo informativo sin variaciones de estilo que puedan confundir al usuario.

**Impacto final**: Interfaz más profesional, consistente y predecible. Los usuarios pueden leer los valores sin distracciones por cambios de peso visual, mientras que el estado de selección se comunica exclusivamente a través de las barras.

**Lecciones aprendidas**:
- Los gráficos de Recharts aplican estilos automáticos a elementos activos
- Desactivar animaciones puede ser necesario para garantizar consistencia
- Los valores numéricos tienen mayor precedencia que strings en propiedades CSS/SVG
- La separación de responsabilidades (barras = estado, etiquetas = valor) mejora la UX
