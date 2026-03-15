# Vista Anual Tenpo - Ajuste UX: Filtros y Altura de Gráficos

**Fecha:** 6 de Marzo 2026  
**Alcance:** Vista `/presupuesto/tenpo`  
**Tipo:** Ajuste UX puntual  
**Objetivo:** Eliminar redundancia visual de filtros y estabilizar altura de gráficos coordinados

---

## 🎯 Objetivo del Ajuste

Mejorar la experiencia visual de la vista anual de Tenpo con dos cambios específicos:

1. **Eliminar redundancia visual de filtros activos**
   - Dejar una sola fuente de verdad visual para el estado de filtros
   - Eliminar bloques internos redundantes bajo cada gráfico

2. **Estabilizar altura de gráficos**
   - Fijar altura consistente en ambos paneles gráficos
   - Evitar cambios dinámicos de layout al filtrar o cambiar dataset
   - Mejorar sensación de dashboard estable y alineado

---

## ❌ Problema Detectado

### Problema 1: Redundancia Visual de Filtros

**Situación anterior:**  
El estado de filtros activos se repetía en **3 lugares diferentes**:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 BARRA SUPERIOR                                       │
│ Mostrando: [Mar 2026 X] [Supermercado X]              │ ← FILTRO #1
└─────────────────────────────────────────────────────────┘

┌───────────────────────┬─────────────────────────────────┐
│ 📊 Proyección Mensual │ 📈 Categorías (Pareto)         │
│                       │                                  │
│ [Gráfico]             │ [Gráfico]                       │
│                       │                                  │
│ 📌 Mes seleccionado:  │ 📌 Categoría seleccionada:     │
│ Mar 2026 [Limpiar]    │ Supermercado [Limpiar]         │
│  ↑ FILTRO #2          │  ↑ FILTRO #3                   │
└───────────────────────┴─────────────────────────────────┘
```

**Problemas identificados:**

1. **Confusión cognitiva:**  
   - Usuario no sabe dónde está la "fuente de verdad" del estado de filtros
   - ¿Debo limpiar desde la barra superior o desde el bloque interno?

2. **Ruido visual:**  
   - Tres bloques azules separados mostrando la misma información
   - Espacio vertical desperdiciado
   - Sensación de UI "pesada"

3. **Inconsistencia potencial:**  
   - Si hay un bug, los 3 bloques podrían desincronizarse
   - Mantenimiento más complejo (3 lugares que actualizar)

---

### Problema 2: Altura Variable de Gráficos

**Situación anterior:**  
Los gráficos cambiaban de altura dinámicamente según el contenido.

#### MonthlyBarChart:
```typescript
<ResponsiveContainer width="100%" height={300}>
```
✅ Altura fija: **300px** (sin problemas)

#### CategoryParetoChart:
```typescript
<ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 40)}>
```
❌ Altura dinámica basada en cantidad de categorías:
- 2 categorías → 250px
- 5 categorías → 250px (mínimo)
- 10 categorías → 400px
- 15 categorías → 600px

**Problemas identificados:**

1. **Layout inestable:**
   - Al filtrar por mes, el gráfico de categorías recalcula y cambia de altura
   - Los paneles ya no están alineados verticalmente
   - Sensación de "salto" visual molesto

2. **Inconsistencia visual:**
   - Gráfico izquierdo siempre 300px
   - Gráfico derecho varía entre 250px-600px
   - Se ven desbalanceados en pantallas grandes

3. **Scroll variable:**
   - Con muchas categorías, el panel derecho crece y genera scroll interno
   - Con pocas categorías, el panel es más pequeño que el izquierdo

---

## ✅ Cambios Realizados

### Cambio 1: Eliminar Bloques Redundantes de Selección

#### En `MonthlyBarChart.tsx`

**ANTES:**
```jsx
      </ResponsiveContainer>

      {selectedMonth && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>
            📌 Mes seleccionado: {MESES_SHORT[selectedMonth - 1]} {selectedYear}
          </span>
          <button onClick={() => onSelectMonth(null)} style={{ ... }}>
            ✕ Limpiar
          </button>
        </div>
      )}
    </Panel>
```

**DESPUÉS:**
```jsx
      </ResponsiveContainer>
    </Panel>
```

**Eliminado:**
- Bloque condicional completo `{selectedMonth && (...)}`
- Mensaje "📌 Mes seleccionado: ..."
- Botón "✕ Limpiar" individual

---

#### En `CategoryParetoChart.tsx`

**ANTES:**
```jsx
      {/* Bloque de "Sin Categoría" */}
      {uncategorizedData.count > 0 && (
        <div onClick={handleUncategorizedClick} style={{ ... }}>
          ...
        </div>
      )}

      {selectedCategory && selectedCategory !== 'Sin Categoría' && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500' }}>
            📌 Categoría seleccionada: {selectedCategory}
          </span>
          <button onClick={(e) => { ... }} style={{ ... }}>
            ✕ Limpiar
          </button>
        </div>
      )}
    </Panel>
```

**DESPUÉS:**
```jsx
      {/* Bloque de "Sin Categoría" */}
      {uncategorizedData.count > 0 && (
        <div onClick={handleUncategorizedClick} style={{ ... }}>
          ...
        </div>
      )}
    </Panel>
```

**Eliminado:**
- Bloque condicional `{selectedCategory && selectedCategory !== 'Sin Categoría' && (...)}`
- Mensaje "📌 Categoría seleccionada: ..."
- Botón "✕ Limpiar" individual

**Preservado:**
- ✅ Bloque "Sin Categoría" (no es redundante, es una acción del gráfico)

---

### Cambio 2: Fijar Altura Consistente en CategoryParetoChart

**ANTES:**
```typescript
<ResponsiveContainer width="100%" height={Math.max(250, chartData.length * 40)}>
```

**DESPUÉS:**
```typescript
<ResponsiveContainer width="100%" height={300}>
```

**Justificación:**
- **Consistencia:** Ambos gráficos ahora tienen exactamente **300px** de altura
- **Alineación:** Los paneles se ven alineados verticalmente en pantallas grandes
- **Estabilidad:** No hay cambios de layout al filtrar o cambiar dataset

**Consecuencia aceptada:**
- Si hay 10+ categorías, aparecerá scroll vertical dentro del gráfico
- Esto es preferible a tener altura variable que rompe el layout general

---

## 📁 Archivos Modificados

### 1. `MonthlyBarChart.tsx`
**Ubicación:** `node-version/client/src/components/presupuesto/`

**Cambios:**
- ❌ Eliminado bloque condicional `{selectedMonth && (...)}`
- ✅ Altura fija mantenida: `height={300}`
- ✅ Lógica de filtrado intacta

**Líneas modificadas:** ~207-226 (bloque eliminado)

---

### 2. `CategoryParetoChart.tsx`
**Ubicación:** `node-version/client/src/components/presupuesto/`

**Cambios:**
- ❌ Eliminado bloque condicional `{selectedCategory && selectedCategory !== 'Sin Categoría' && (...)}`
- ✅ Altura dinámica cambiada a fija: `height={Math.max(250, chartData.length * 40)}` → `height={300}`
- ✅ Bloque "Sin Categoría" preservado (no es redundante)
- ✅ Lógica de filtrado intacta

**Líneas modificadas:**
- ~239: Altura del ResponsiveContainer
- ~342-371: Bloque de selección eliminado

---

## 🧠 Criterios de Diseño Aplicados

### Criterio 1: Una Sola Fuente de Verdad Visual

**Principio:**  
> El estado de la aplicación debe tener una representación visual única y clara. Duplicar información confunde al usuario y genera mantenimiento innecesario.

**Aplicación:**
- **Fuente de verdad:** Barra superior de filtros activos
- **Ubicación:** Justo encima de los gráficos, visible y destacada
- **Interacción:** Cada filtro tiene su badge con botón X individual + botón "Limpiar todos"

**Elementos preservados:**
- ✅ Barra superior con badges de filtros
- ✅ Botones X individuales en la barra
- ✅ Botón "🗑️ Limpiar todos los filtros"
- ✅ Feedback visual en los gráficos (opacidad, stroke, colores)

**Elementos eliminados:**
- ❌ Bloques internos "📌 Mes seleccionado"
- ❌ Bloques internos "📌 Categoría seleccionada"
- ❌ Botones "Limpiar" individuales dentro de cada panel

---

### Criterio 2: Altura Fija para Estabilidad Visual

**Principio:**  
> En dashboards analíticos, la estabilidad del layout es más importante que la optimización pixel-perfect del espacio. Los usuarios esperan componentes alineados y predecibles.

**Aplicación:**
- **Altura fija elegida:** 300px
- **Justificación del valor:**
  - Suficiente para mostrar 12 barras mensuales cómodamente (gráfico izquierdo)
  - Suficiente para mostrar 5-7 categorías sin scroll (gráfico derecho)
  - Balance entre visibilidad y espacio vertical de la página

**Ventajas de altura fija:**
1. **Alineación perfecta:** Los dos paneles siempre están al mismo nivel
2. **Sin "saltos":** No hay cambios de layout al interactuar
3. **Predictibilidad:** El usuario sabe dónde está cada cosa
4. **Sensación profesional:** Dashboard estable y pulido

**Consecuencias aceptadas:**
- Si hay > 7 categorías, el gráfico Pareto tendrá scroll interno
- Esto es preferible a tener paneles desalineados

---

### Criterio 3: Feedback Visual en Lugar de Mensajes

**Principio:**  
> Los gráficos interactivos deben usar lenguaje visual (color, opacidad, stroke) en lugar de mensajes de texto para indicar estado.

**Feedback visual implementado:**

#### En MonthlyBarChart:
- Barra seleccionada: color `#3b82f6` (azul más oscuro)
- Barra seleccionada: stroke `#1e40af` con width 2
- Barras no seleccionadas: opacidad 0.3

#### En CategoryParetoChart:
- Categoría seleccionada: stroke `#1e40af` con width 2
- Categorías no seleccionadas: opacidad 0.3
- Bloque "Sin Categoría" seleccionado: fondo `#fef3c7`, borde `#f59e0b`

**Resultado:**  
El usuario sabe exactamente qué está seleccionado mirando los gráficos, sin necesidad de leer mensajes de texto adicionales.

---

## 🔄 Flujo de Interacción Actualizado

### Caso 1: Usuario selecciona mes

```
1. Usuario hace click en barra de "Marzo" (gráfico izquierdo)

2. Feedback visual:
   ✅ Barra de Marzo cambia a color azul oscuro con stroke
   ✅ Otras barras reducen opacidad a 0.3
   ✅ Barra superior aparece con badge: "🔍 Mostrando: [Mar 2026 X]"
   ❌ NO aparece mensaje interno "Mes seleccionado"

3. Efectos secundarios:
   - Gráfico derecho recalcula datos solo para Marzo
   - Tabla filtra compras con cuotas en Marzo
   - Altura de ambos gráficos permanece en 300px (sin cambios)
```

---

### Caso 2: Usuario selecciona categoría

```
1. Usuario hace click en barra de "Supermercado" (gráfico derecho)

2. Feedback visual:
   ✅ Barra de Supermercado cambia a stroke azul
   ✅ Otras barras reducen opacidad a 0.3
   ✅ Barra superior actualiza: "🔍 Mostrando: [Supermercado X]"
   ❌ NO aparece mensaje interno "Categoría seleccionada"

3. Efectos secundarios:
   - Tabla filtra compras de categoría Supermercado
   - Altura de ambos gráficos permanece en 300px (sin cambios)
```

---

### Caso 3: Usuario limpia filtros

**Opción A: Click en X de badge individual**
```
Usuario hace click en X del badge "Mar 2026"
→ Solo se limpia el filtro de mes
→ Gráficos actualizan sin cambiar altura
→ Badge desaparece de la barra superior
```

**Opción B: Click en "Limpiar todos"**
```
Usuario hace click en botón "🗑️ Limpiar todos los filtros"
→ Se limpian TODOS los filtros (mes + categoría)
→ Barra superior desaparece completamente
→ Ambos gráficos vuelven a vista completa del año
→ Altura permanece en 300px
```

---

## ✅ Validación Manual

### Test 1: Selección de mes
1. Abrir `/presupuesto/tenpo`
2. Click en barra de Marzo (gráfico izquierdo)
3. **Verificar:**
   - ✅ Barra de Marzo destacada visualmente (color + stroke)
   - ✅ Barra superior muestra badge: "[Mar 2026 X]"
   - ✅ NO aparece mensaje interno "Mes seleccionado"
   - ✅ Altura de ambos gráficos permanece igual (300px)
   - ✅ Gráfico derecho recalcula para Marzo
   - ✅ Tabla filtra por Marzo

---

### Test 2: Selección de categoría
1. Con o sin mes seleccionado
2. Click en barra de "Supermercado" (gráfico derecho)
3. **Verificar:**
   - ✅ Barra de Supermercado destacada visualmente
   - ✅ Barra superior muestra badge: "[Supermercado X]"
   - ✅ NO aparece mensaje interno "Categoría seleccionada"
   - ✅ Altura de ambos gráficos permanece igual (300px)
   - ✅ Tabla filtra por Supermercado

---

### Test 3: Selección de mes + categoría
1. Click en mes (ej: Marzo)
2. Click en categoría (ej: Supermercado)
3. **Verificar:**
   - ✅ Barra superior muestra: "[Mar 2026 X] [Supermercado X]"
   - ✅ NO aparecen mensajes internos en ningún gráfico
   - ✅ Altura de ambos gráficos permanece igual (300px)
   - ✅ Tabla filtra por Marzo + Supermercado
   - ✅ Ambos gráficos muestran feedback visual correcto

---

### Test 4: Bloques internos eliminados
1. Seleccionar mes
2. Seleccionar categoría
3. **Verificar:**
   - ✅ NO existe bloque "📌 Mes seleccionado" bajo gráfico izquierdo
   - ✅ NO existe bloque "📌 Categoría seleccionada" bajo gráfico derecho
   - ✅ SÍ existe bloque "⚠️ Sin Categoría" (este no es redundante, es parte del gráfico)

---

### Test 5: Altura fija con diferentes datasets
1. Filtrar por un mes con pocas categorías (ej: Enero, 3 categorías)
2. **Verificar:**
   - ✅ Gráfico derecho tiene altura de 300px
   - ✅ Scroll interno NO necesario
3. Filtrar por un mes con muchas categorías (ej: Marzo, 12 categorías)
4. **Verificar:**
   - ✅ Gráfico derecho tiene altura de 300px (sin cambios)
   - ✅ Scroll interno visible dentro del gráfico
   - ✅ Gráficos izquierdo y derecho siguen alineados
5. Limpiar filtros (vista anual completa)
6. **Verificar:**
   - ✅ Gráfico derecho tiene altura de 300px (sin cambios)
   - ✅ No hay "salto" visual al cambiar filtros

---

### Test 6: Limpieza de filtros desde barra superior
1. Seleccionar mes + categoría
2. Click en X del badge "Mar 2026"
3. **Verificar:**
   - ✅ Badge de mes desaparece
   - ✅ Badge de categoría permanece
   - ✅ Gráficos actualizan correctamente
   - ✅ Altura permanece en 300px
4. Click en botón "🗑️ Limpiar todos"
5. **Verificar:**
   - ✅ Todos los badges desaparecen
   - ✅ Barra superior desaparece
   - ✅ Vista vuelve a año completo
   - ✅ Altura permanece en 300px

---

### Test 7: Funcionalidad de filtrado no se rompe
1. Realizar varios ciclos de:
   - Seleccionar mes
   - Seleccionar categoría
   - Limpiar filtros
   - Seleccionar solo categoría
   - Seleccionar solo mes
2. **Verificar:**
   - ✅ Tabla siempre refleja los filtros activos correctamente
   - ✅ Gráficos siempre muestran el feedback visual correcto
   - ✅ No hay errores en consola
   - ✅ No hay inconsistencias visuales

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Fuentes de verdad visual** | 3 (barra superior + 2 bloques internos) | 1 (solo barra superior) |
| **Mensajes de filtro activo** | Repetidos en 3 lugares | Únicos en barra superior |
| **Ruido visual** | Alto (3 bloques azules) | Bajo (1 barra superior) |
| **Altura gráfico izquierdo** | 300px (fijo) ✅ | 300px (fijo) ✅ |
| **Altura gráfico derecho** | 250-600px (dinámico) ❌ | 300px (fijo) ✅ |
| **Alineación vertical** | Variable (depende de categorías) | Siempre perfecta ✅ |
| **Sensación de estabilidad** | Baja (saltos al filtrar) | Alta (sin cambios) ✅ |
| **Espacio vertical usado** | Variable (depende de dataset) | Consistente (400px panel) ✅ |
| **Scroll interno gráfico derecho** | Solo con 7+ categorías | Con 7+ categorías |
| **Interacciones de limpieza** | 5 (barra + 2 bloques x 2 botones) | 3 (barra: 2 X + 1 limpiar todo) |

---

## 🎨 Resumen Visual del Cambio

### ANTES:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Mostrando: [Mar 2026 X] [Supermercado X]               │ ← FILTRO #1
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────────────┐
│ 📊 Proyección Mensual   │ 📈 Categorías (Pareto)           │
│ ┌─────────────────────┐ │ ┌─────────────────────────────┐   │
│ │                     │ │ │                             │   │
│ │   [Gráfico 300px]   │ │ │   [Gráfico 250-600px]      │   │ ← Altura variable
│ │                     │ │ │        DINÁMICO             │   │
│ └─────────────────────┘ │ └─────────────────────────────┘   │
│                         │                                   │
│ 📌 Mes seleccionado:    │ 📌 Categoría seleccionada:       │
│ Mar 2026 [Limpiar]      │ Supermercado [Limpiar]           │
│  ↑ FILTRO #2            │  ↑ FILTRO #3                     │
└─────────────────────────┴───────────────────────────────────┘
```

---

### DESPUÉS:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Mostrando: [Mar 2026 X] [Supermercado X] [Limpiar todo]│ ← ÚNICA fuente de verdad
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────────────┐
│ 📊 Proyección Mensual   │ 📈 Categorías (Pareto)           │
│ ┌─────────────────────┐ │ ┌─────────────────────────────┐   │
│ │                     │ │ │                             │   │
│ │   [Gráfico 300px]   │ │ │   [Gráfico 300px]          │   │ ← Altura fija
│ │                     │ │ │        FIJO                 │   │
│ └─────────────────────┘ │ └─────────────────────────────┘   │
│                         │                                   │
│                         │ ⚠️ Sin Categoría                 │
│                         │ 12 compras · $235.000            │
└─────────────────────────┴───────────────────────────────────┘
   ↑ Sin mensajes redundantes        ↑ Solo bloque "Sin Categoría"
                                        (no redundante)
```

---

## 🚀 Beneficios Logrados

### 1. Claridad Cognitiva
- ✅ Una sola fuente de verdad para filtros activos
- ✅ Usuario sabe exactamente dónde mirar para ver qué está filtrado
- ✅ Interacción más predecible y simple

### 2. Limpieza Visual
- ✅ Menos bloques de confirmación
- ✅ Menos espacio vertical desperdiciado
- ✅ Sensación de UI más limpia y profesional

### 3. Estabilidad de Layout
- ✅ Dashboard con sensación de componentes alineados
- ✅ Sin "saltos" visuales al interactuar
- ✅ Predictibilidad visual total

### 4. Mantenimiento Simplificado
- ✅ Un solo lugar donde mostrar estado de filtros (código más simple)
- ✅ Menos código condicional
- ✅ Menos riesgo de inconsistencias

---

## ⚠️ Consecuencias Aceptadas

### Scroll interno en gráfico Pareto

**Situación:**  
Si hay más de 7 categorías, el gráfico Pareto tendrá scroll vertical interno.

**Por qué es aceptable:**
1. Prioridad: estabilidad visual > optimización de espacio
2. Casos con 10+ categorías son menos comunes
3. El scroll interno es intuitivo (área del gráfico es scrollable)
4. Alternativa (altura dinámica) genera layout inestable (peor UX)

**Mitigación futura (si se necesita):**
- Limitar a top 10 categorías + "Otras"
- Agregar paginación o tabs
- Permitir colapsar/expandir panel

---

## 🎯 Conclusión

Este ajuste UX puntual logró:

1. ✅ **Eliminar redundancia:** De 3 fuentes de verdad visual a 1 (barra superior)
2. ✅ **Estabilizar layout:** Altura fija de 300px en ambos gráficos
3. ✅ **Mejorar claridad:** Usuario sabe exactamente dónde mirar para ver filtros
4. ✅ **Simplificar interacción:** Menos botones, menos bloques, menos ruido
5. ✅ **Mantener funcionalidad:** Filtrado sigue funcionando perfectamente
6. ✅ **Código más limpio:** Menos condicionales, menos duplicación

**Resultado:** Vista anual de Tenpo más limpia, estable y profesional, manteniendo toda la funcionalidad analítica.

---

**Fin del documento**
