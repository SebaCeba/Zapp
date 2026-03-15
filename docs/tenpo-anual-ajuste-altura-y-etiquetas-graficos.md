# Vista Anual Tenpo - Ajuste de Altura y Etiquetas en Gráficos

**Fecha:** 6 de Marzo 2026  
**Alcance:** Vista `/presupuesto/tenpo`  
**Tipo:** Ajuste visual puntual  
**Objetivo:** Aumentar altura de gráficos y agregar etiquetas de datos para mejorar legibilidad

---

## 🎯 Objetivo del Ajuste

Mejorar la legibilidad de los dos gráficos coordinados mediante:

1. **Aumentar altura fija de ambos gráficos**
   - La altura actual (300px) quedó un poco justa
   - Necesitamos más espacio para etiquetas y mejor visualización

2. **Agregar etiquetas de datos visibles**
   - Gráfico mensual: valores sobre cada barra
   - Gráfico de categorías (Pareto): valores al final de cada barra horizontal
   - Formato abreviado para legibilidad ($850k, $1.2M)

3. **Mantener consistencia**
   - Misma altura en ambos paneles
   - Misma funcionalidad de filtrado
   - Barra superior como única fuente de verdad visual

---

## ❌ Problema Detectado

### Problema 1: Altura Insuficiente

**Situación anterior:**  
Altura fija de **300px** en ambos gráficos.

**Problemas identificados:**

1. **Espacio vertical justo:**
   - Gráfico mensual: 12 barras en 300px → ~25px por barra
   - Gráfico Pareto: 5-7 categorías en 300px → ~43-60px por barra
   - Poco espacio para agregar etiquetas de datos

2. **Márgenes ajustados:**
   - Margin top de 20px en gráfico mensual
   - No hay espacio para etiquetas encima de las barras más altas

3. **Sensación de compresión:**
   - Los gráficos se sienten "apretados"
   - Difícil distinguir categorías con nombres similares en Pareto

---

### Problema 2: Falta de Etiquetas de Datos

**Situación anterior:**  
Los gráficos **NO** mostraban valores numéricos directamente.

**Consecuencias:**

1. **Dependencia del tooltip:**
   - Usuario debe hacer hover para ver valores exactos
   - No se puede comparar visualmente varios valores a la vez

2. **Análisis más lento:**
   - Para responder "¿Cuánto gasté en marzo?", hay que hacer hover
   - Para comparar categorías, hay que hacer hover en cada una

3. **Menor densidad de información:**
   - Espacio visual desaprovechado
   - Dashboard menos informativo sin necesidad de interacción

---

## ✅ Cambios Realizados

### Cambio 1: Aumentar Altura de Ambos Gráficos

#### Altura anterior vs nueva:

| Componente | Altura Anterior | Altura Nueva | Incremento |
|------------|-----------------|--------------|------------|
| MonthlyBarChart | 300px | 360px | +60px (+20%) |
| CategoryParetoChart | 300px | 360px | +60px (+20%) |

---

#### En `MonthlyBarChart.tsx`

**ANTES:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart 
    data={chartData}
    onClick={handleBarClick}
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
  >
```

**DESPUÉS:**
```typescript
<ResponsiveContainer width="100%" height={360}>
  <BarChart 
    data={chartData}
    onClick={handleBarClick}
    margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
  >
```

**Cambios:**
- ✅ Altura: 300px → **360px**
- ✅ Margin top: 20px → **30px** (espacio para etiquetas encima de barras)

---

#### En `CategoryParetoChart.tsx`

**ANTES:**
```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart 
    data={chartData}
    onClick={handleBarClick}
    layout="vertical"
    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
  >
```

**DESPUÉS:**
```typescript
<ResponsiveContainer width="100%" height={360}>
  <BarChart 
    data={chartData}
    onClick={handleBarClick}
    layout="vertical"
    margin={{ top: 5, right: 80, left: 120, bottom: 5 }}
  >
```

**Cambios:**
- ✅ Altura: 300px → **360px**
- ✅ Margin right: 30px → **80px** (espacio para etiquetas a la derecha de barras)

---

### Cambio 2: Agregar Etiquetas de Datos con LabelList

#### Componente de Recharts utilizado: `<LabelList>`

`LabelList` es un componente de Recharts que permite mostrar etiquetas de datos directamente en las barras del gráfico.

**Documentación oficial:**  
https://recharts.org/en-US/api/LabelList

---

#### En `MonthlyBarChart.tsx`

**Import actualizado:**
```typescript
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList  // ← Nuevo
} from 'recharts';
```

**Implementación dentro de `<Bar>`:**
```typescript
<Bar 
  dataKey="total" 
  radius={[8, 8, 0, 0]}
>
  {chartData.map((entry, index) => (
    <Cell 
      key={`cell-${index}`} 
      fill={...}
      opacity={...}
      stroke={...}
      cursor="pointer"
    />
  ))}
  
  {/* ← NUEVO: Etiquetas de datos */}
  <LabelList 
    dataKey="total" 
    position="top" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '11px', fill: '#374151', fontWeight: '500' }}
  />
</Bar>
```

**Configuración:**
- `dataKey="total"`: Campo de datos a mostrar
- `position="top"`: Etiquetas encima de las barras
- `formatter`: Usa `formatK()` para formato abreviado ($850k, $1.2M)
- Oculta etiquetas si `value === 0`
- Estilo: 11px, gris oscuro (#374151), semi-negrita

---

#### En `CategoryParetoChart.tsx`

**Import actualizado:**
```typescript
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList  // ← Nuevo
} from 'recharts';
```

**Implementación dentro de `<Bar>`:**
```typescript
<Bar 
  dataKey="total" 
  radius={[0, 8, 8, 0]}
>
  {chartData.map((entry, index) => (
    <Cell 
      key={`cell-${index}`} 
      fill={...}
      opacity={...}
      stroke={...}
      cursor="pointer"
    />
  ))}
  
  {/* ← NUEVO: Etiquetas de datos */}
  <LabelList 
    dataKey="total" 
    position="right" 
    formatter={(value: number) => value > 0 ? formatK(value) : ''}
    style={{ fontSize: '11px', fill: '#374151', fontWeight: '500' }}
  />
</Bar>
```

**Configuración:**
- `dataKey="total"`: Campo de datos a mostrar
- `position="right"`: Etiquetas a la derecha de las barras horizontales
- `formatter`: Usa `formatK()` para formato abreviado
- Oculta etiquetas si `value === 0`
- Estilo: 11px, gris oscuro (#374151), semi-negrita

---

## 🧮 Criterio de Altura Elegida

### Por qué 360px

**Análisis de opciones:**

| Altura | Ventajas | Desventajas |
|--------|----------|-------------|
| 300px (actual) | Compacta | Altura justa, poco espacio para etiquetas |
| 340px | Mejora marginal | Incremento insuficiente para notar diferencia |
| **360px** ✅ | **+20% espacio, suficiente para etiquetas, alineación perfecta con grid de 60px** | **Ocupa 60px más de vertical** |
| 380px | Muy cómoda | Demasiado espacio, sensación de desperdicio |
| 400px | Holgada | Excesiva para dashboard compacto |

**Justificación de 360px:**

1. **Balance perfecto:**
   - +60px es suficiente para etiquetas sin ser excesivo
   - +20% respecto a altura original

2. **Divisibilidad:**
   - 360px es múltiplo de 60 (360 = 60 × 6)
   - Facilita cálculos de grid y alineación

3. **Espacio para etiquetas:**
   - Margin top 30px en gráfico mensual
   - Margin right 80px en gráfico Pareto
   - Etiquetas de 11px caben cómodamente

4. **Sensación visual:**
   - Gráficos más "respirables"
   - No se sienten apretados ni excesivamente grandes
   - Dashboard sigue siendo compacto

5. **Scroll interno manejable:**
   - En gráfico Pareto con 10+ categorías, scroll sigue siendo mínimo
   - Área visible suficiente para ver 7-8 categorías sin scroll

---

## 🔤 Implementación de Etiquetas de Datos

### Formato de Etiquetas: `formatK()`

**Función existente reutilizada:**
```typescript
const formatK = (val: number) => {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
  return `$${val}`;
};
```

**Ejemplos de formato:**

| Valor | Formateo |
|-------|----------|
| 850,000 | $850k |
| 1,250,000 | $1.3M |
| 320,000 | $320k |
| 5,000 | $5000 |
| 0 | (oculto) |

**Ventajas:**
- ✅ Formato abreviado legible
- ✅ Consistente con otros componentes de la app
- ✅ No ocupa demasiado espacio
- ✅ Fácil de leer de un vistazo

---

### Estrategia de Visibilidad

**Decisión de diseño:**  
Mostrar todas las etiquetas siempre, excepto si el valor es 0.

**Implementación:**
```typescript
formatter={(value: number) => value > 0 ? formatK(value) : ''}
```

**Casos especiales:**

1. **Barras con valor 0:**
   - Etiqueta oculta (string vacío)
   - Evita ruido visual innecesario

2. **Todas las demás barras:**
   - Etiqueta siempre visible
   - Usuario puede ver valores de un vistazo sin hover

**Superposición (no aplica en este caso):**
- En gráfico mensual: barras verticales separadas, no hay superposición
- En gráfico Pareto: barras horizontales con margin right 80px, espacio suficiente

---

### Estilo Visual de Etiquetas

**Configuración de estilo:**
```typescript
style={{ 
  fontSize: '11px', 
  fill: '#374151',      // Gris oscuro (Tailwind gray-700)
  fontWeight: '500'     // Semi-negrita (medium)
}}
```

**Criterios de diseño:**

1. **Tamaño: 11px**
   - Legible pero no invasivo
   - No compite visualmente con las barras
   - Consistente con otros textos del gráfico (ticks son 12px)

2. **Color: #374151 (gris oscuro)**
   - Suficiente contraste con fondo blanco
   - No tan oscuro como #000 (sería muy pesado)
   - Consistente con otros textos secundarios de la UI

3. **Peso: 500 (medium)**
   - Semi-negrita para visibilidad
   - No tan ligero que se pierda
   - No tan negrita que domine visualmente

**Resultado visual:**
- Etiquetas se integran naturalmente con el gráfico
- No generan ruido excesivo
- Fáciles de leer de un vistazo
- Complementan (no reemplazan) el tooltip

---

## 📁 Archivos Modificados

### 1. `MonthlyBarChart.tsx`
**Ubicación:** `node-version/client/src/components/presupuesto/`

**Cambios:**
- ✅ Import de `LabelList` agregado
- ✅ Altura: 300px → **360px**
- ✅ Margin top: 20px → **30px**
- ✅ `<LabelList>` agregado con `position="top"`
- ✅ Formatter con `formatK()` y ocultamiento de valores 0

**Líneas modificadas:**
- Línea 9: Import de LabelList
- Línea 164: Altura ResponsiveContainer
- Línea 167: Margin top actualizado
- Líneas 190-195: LabelList agregado

---

### 2. `CategoryParetoChart.tsx`
**Ubicación:** `node-version/client/src/components/presupuesto/`

**Cambios:**
- ✅ Import de `LabelList` agregado
- ✅ Altura: 300px → **360px**
- ✅ Margin right: 30px → **80px**
- ✅ `<LabelList>` agregado con `position="right"`
- ✅ Formatter con `formatK()` y ocultamiento de valores 0

**Líneas modificadas:**
- Línea 9: Import de LabelList
- Línea 234: Altura ResponsiveContainer
- Línea 237: Margin right actualizado
- Líneas 262-267: LabelList agregado

---

## 🧠 Decisiones UX

### Decisión 1: Misma Altura en Ambos Gráficos

**Principio:**  
> Los componentes de un dashboard analítico deben estar alineados verticalmente para generar sensación de estabilidad y orden.

**Aplicación:**
- Ambos gráficos tienen altura de **360px**
- Los paneles de RSuite que los contienen tienen la misma altura total
- Alineación perfecta en vista desktop

**Beneficio:**
- Sensación de dashboard profesional y pulido
- Usuario puede comparar visualmente las alturas relativas sin distracción
- Grid visual implícito que facilita escaneo

---

### Decisión 2: Etiquetas Siempre Visibles (No Condicionales)

**Principio:**  
> La información debe estar visible sin requerir interacción (hover), cuando no genera ruido excesivo.

**Aplicación:**
- Todas las etiquetas visibles (excepto valores 0)
- No se ocultan según espacio disponible
- No se ocultan según opacidad de barra

**Alternativa descartada:**
- Ocultar etiquetas de barras con opacidad 0.3 (no seleccionadas)
- **Por qué se descartó:** Usuario perdería información útil al filtrar

**Beneficio:**
- Usuario puede ver todos los valores de un vistazo
- No necesita hover para análisis rápido
- Mantiene densidad de información alta

---

### Decisión 3: Formato Abreviado (k, M) en Lugar de Completo

**Principio:**  
> En contextos financieros con cifras grandes, el formato abreviado mejora legibilidad sin pérdida de precisión práctica.

**Aplicación:**
- $850,000 → **$850k**
- $1,250,000 → **$1.3M**

**Alternativa descartada:**
- Mostrar valores completos con separadores de miles
- **Por qué se descartó:** Etiquetas muy largas, difíciles de escanear

**Beneficio:**
- Etiquetas compactas y fáciles de leer
- Usuario entiende magnitudes rápidamente
- Consistente con otros componentes de la app

---

### Decisión 4: Etiquetas Fuera de Barras (No Dentro)

**Principio:**  
> Las etiquetas dentro de barras pueden ser ilegibles si la barra es corta o tiene color oscuro.

**Aplicación:**
- Gráfico mensual: etiquetas `position="top"` (encima)
- Gráfico Pareto: etiquetas `position="right"` (a la derecha)

**Alternativa descartada:**
- Etiquetas `position="inside"` o `position="center"`
- **Por qué se descartó:** Problemas de contraste y legibilidad en barras cortas

**Beneficio:**
- Etiquetas siempre legibles con contraste adecuado
- No dependen del color de la barra
- Espacio dedicado fuera de la barra

---

### Decisión 5: No Eliminar Tooltip

**Principio:**  
> Las etiquetas de datos y el tooltip son complementarios, no mutuamente excluyentes.

**Aplicación:**
- Etiquetas de datos muestran valor total abreviado
- Tooltip sigue existiendo y muestra información adicional:
  - Nombre completo del mes/categoría
  - Valor total con formato completo
  - Número de compras (solo en Pareto)

**Alternativa descartada:**
- Eliminar tooltip porque "ya hay etiquetas"
- **Por qué se descartó:** Tooltip ofrece contexto adicional valioso

**Beneficio:**
- Etiquetas: análisis rápido de un vistazo
- Tooltip: exploración detallada con hover
- Experiencia UX óptima para ambos casos de uso

---

## ✅ Validación Manual

### Test 1: Altura fija consistente
1. Abrir `/presupuesto/tenpo`
2. **Verificar:**
   - ✅ Ambos gráficos tienen la misma altura visual
   - ✅ Paneles están perfectamente alineados horizontalmente
   - ✅ No hay diferencia de altura entre gráfico izquierdo y derecho

---

### Test 2: Altura mejoró legibilidad
1. Comparar con captura de pantalla anterior (si existe)
2. **Verificar:**
   - ✅ Gráficos se ven más "respirables"
   - ✅ Hay más espacio vertical para cada elemento
   - ✅ Sensación de menos compresión

---

### Test 3: Etiquetas en gráfico mensual
1. Ver gráfico mensual (izquierdo)
2. **Verificar:**
   - ✅ Cada barra (excepto las de valor 0) tiene etiqueta encima
   - ✅ Etiquetas usan formato abreviado ($850k, $1.2M)
   - ✅ Etiquetas no se superponen con barras
   - ✅ Etiquetas son legibles (11px, gris oscuro)

---

### Test 4: Etiquetas en gráfico Pareto
1. Ver gráfico de categorías (derecho)
2. **Verificar:**
   - ✅ Cada barra horizontal tiene etiqueta a la derecha
   - ✅ Etiquetas usan formato abreviado
   - ✅ Etiquetas no se cortan por falta de espacio (margin right 80px)
   - ✅ Etiquetas son legibles

---

### Test 5: Etiquetas no generan ruido excesivo
1. Ver ambos gráficos en conjunto
2. **Verificar:**
   - ✅ Las etiquetas se integran naturalmente
   - ✅ No dominan visualmente sobre las barras
   - ✅ Color gris oscuro proporciona contraste adecuado sin ser invasivo
   - ✅ Dashboard sigue viéndose limpio y profesional

---

### Test 6: Filtrado con etiquetas visibles
1. Seleccionar un mes (ej: Marzo)
2. **Verificar:**
   - ✅ Barras no seleccionadas reducen opacidad a 0.3
   - ✅ Etiquetas de barras no seleccionadas SIGUEN VISIBLES
   - ✅ Usuario puede comparar valores incluso de barras con opacidad reducida
   - ✅ Barra seleccionada destaca con stroke y color más oscuro

---

### Test 7: Tooltip complementa etiquetas
1. Hacer hover sobre una barra con etiqueta
2. **Verificar:**
   - ✅ Tooltip aparece correctamente
   - ✅ Tooltip muestra información adicional (mes/categoría + valor completo)
   - ✅ Etiqueta y tooltip no se superponen visualmente
   - ✅ Experiencia UX fluida

---

### Test 8: Funcionalidad de filtrado intacta
1. Realizar varios ciclos de:
   - Seleccionar mes
   - Seleccionar categoría
   - Limpiar filtros
2. **Verificar:**
   - ✅ Filtros funcionan igual que antes
   - ✅ Etiquetas se mantienen visibles en todo momento
   - ✅ No hay errores en consola
   - ✅ Tabla se filtra correctamente
   - ✅ Barra superior sigue siendo la única fuente de verdad visual

---

### Test 9: Altura estable con diferentes datasets
1. Filtrar por mes con pocas categorías (ej: 3 categorías)
2. **Verificar:**
   - ✅ Gráfico Pareto mantiene altura de 360px
3. Filtrar por mes con muchas categorías (ej: 10+ categorías)
4. **Verificar:**
   - ✅ Gráfico Pareto mantiene altura de 360px
   - ✅ Scroll interno aparece si es necesario
   - ✅ Etiquetas siguen visibles en todas las categorías (incluso con scroll)
5. Limpiar filtros
6. **Verificar:**
   - ✅ No hay "salto" visual al cambiar altura

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes (300px sin etiquetas) | Después (360px con etiquetas) |
|---------|----------------------------|-------------------------------|
| **Altura gráfico izquierdo** | 300px | 360px (+20%) |
| **Altura gráfico derecho** | 300px | 360px (+20%) |
| **Margin top (izquierdo)** | 20px | 30px |
| **Margin right (derecho)** | 30px | 80px |
| **Etiquetas en barras mensuales** | ❌ No | ✅ Sí (encima) |
| **Etiquetas en barras Pareto** | ❌ No | ✅ Sí (derecha) |
| **Formato de etiquetas** | N/A | $850k, $1.2M (abreviado) |
| **Valores visibles sin hover** | ❌ No | ✅ Sí |
| **Análisis rápido visual** | ❌ Requiere hover | ✅ De un vistazo |
| **Sensación de espacio** | Comprimida | Respirable ✅ |
| **Legibilidad general** | Media | Alta ✅ |
| **Densidad de información** | Baja (solo barras) | Alta (barras + valores) ✅ |
| **Funcionalidad de filtrado** | ✅ Funciona | ✅ Funciona |

---

## 🎨 Resumen Visual del Cambio

### ANTES (300px sin etiquetas):
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Mostrando: [Mar 2026 X] [Supermercado X] [Limpiar todo]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────────────┐
│ 📊 Proyección Mensual   │ 📈 Categorías (Pareto)           │
│ ┌─────────────────────┐ │ ┌─────────────────────────────┐   │
│ │                     │ │ │                             │   │
│ │   [Gráfico 300px]   │ │ │   [Gráfico 300px]          │   │
│ │   Sin etiquetas     │ │ │   Sin etiquetas             │   │
│ │                     │ │ │                             │   │
│ └─────────────────────┘ │ └─────────────────────────────┘   │
└─────────────────────────┴───────────────────────────────────┘
   ↑ Hover para ver valores     ↑ Hover para ver valores
```

---

### DESPUÉS (360px con etiquetas):
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Mostrando: [Mar 2026 X] [Supermercado X] [Limpiar todo]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────┬───────────────────────────────────┐
│ 📊 Proyección Mensual   │ 📈 Categorías (Pareto)           │
│ ┌─────────────────────┐ │ ┌─────────────────────────────┐   │
│ │  $850k $1.2M $320k  │ │ │ Supermercado ████ $1.2M     │   │
│ │    ↓    ↓    ↓      │ │ │ Cata         ███  $850k     │   │
│ │   [Gráfico 360px]   │ │ │ Transporte   ██   $320k     │   │
│ │   Con etiquetas     │ │ │             MÁS              │   │
│ │                     │ │ │        RESPIRACIÓN           │   │
│ │   MÁS ESPACIO       │ │ │                             │   │
│ └─────────────────────┘ │ └─────────────────────────────┘   │
└─────────────────────────┴───────────────────────────────────┘
   ↑ Valores visibles sin hover ↑ Valores visibles sin hover
```

---

## 🚀 Beneficios Logrados

### 1. Mayor Legibilidad
- ✅ +20% espacio vertical en ambos gráficos
- ✅ Sensación de mayor "respiración"
- ✅ Más fácil distinguir categorías y meses

### 2. Análisis Más Rápido
- ✅ Valores visibles de un vistazo sin hover
- ✅ Comparación visual inmediata entre meses/categorías
- ✅ Menor fricción en el flujo de análisis

### 3. Mayor Densidad de Información
- ✅ Gráficos muestran más información sin ocupar más espacio efectivo
- ✅ Dashboard más informativo manteniendo limpieza

### 4. Experiencia UX Mejorada
- ✅ Etiquetas + tooltip = análisis rápido + exploración detallada
- ✅ No se pierde funcionalidad previa
- ✅ Dashboard sigue limpio y profesional

### 5. Consistencia Mantenida
- ✅ Ambos gráficos siguen teniendo la misma altura
- ✅ Filtrado funciona igual que antes
- ✅ Barra superior sigue siendo única fuente de verdad visual

---

## ⚠️ Consecuencias Aceptadas

### Mayor Espacio Vertical Consumido

**Situación:**  
Los gráficos ahora ocupan 360px en lugar de 300px → +60px por gráfico.

**Por qué es aceptable:**
1. Mejora significativa en legibilidad justifica el espacio adicional
2. +60px es un incremento razonable (20%)
3. Dashboard sigue siendo navegable sin scroll excesivo
4. Prioridad: legibilidad > compactación

---

### Scroll Interno en Gráfico Pareto Más Frecuente

**Situación:**  
Con altura fija de 360px, el scroll interno aparece con 7-8+ categorías (antes aparecía con 8-9+).

**Por qué es aceptable:**
1. Etiquetas compensan el scroll mostrando valores sin hover
2. Usuario puede ver valores incluso sin hacer scroll (etiquetas visibles)
3. Scroll interno es intuitivo y no rompe UX
4. Casos con 10+ categorías siguen siendo menos comunes

---

## 🎯 Conclusión

Este ajuste visual puntual logró:

1. ✅ **Aumentar altura:** De 300px a 360px en ambos gráficos (+20%)
2. ✅ **Agregar etiquetas de datos:** Valores visibles sin hover en ambos gráficos
3. ✅ **Mantener consistencia:** Misma altura en ambos paneles
4. ✅ **Mejorar legibilidad:** Mayor espacio + información visible = análisis más rápido
5. ✅ **Preservar funcionalidad:** Filtrado funciona igual, barra superior sigue siendo única fuente de verdad
6. ✅ **Mantener limpieza:** Dashboard sigue profesional sin ruido visual

**Resultado:** Vista anual de Tenpo más legible y analítica, manteniendo toda la funcionalidad y limpieza visual.

---

**Fin del documento**
