# Vista Anual Tenpo - Dos Gráficos Coordinados

**Fecha:** 6 de Marzo 2026  
**Alcance:** Vista `/presupuesto/tenpo`  
**Objetivo:** Mejorar la experiencia analítica mediante la separación del análisis temporal y categorial en dos gráficos coordinados

---

## 🎯 Objetivo del Cambio

Transformar la vista anual de Tenpo de un gráfico stacked bar complejo (que mezclaba demasiadas categorías en el eje temporal) a un sistema de **dos gráficos coordinados** que permite:

1. **Análisis temporal limpio** sin contaminación de categorías
2. **Análisis categorial tipo Pareto** ordenado por importancia
3. **Filtrado progresivo**: primero por mes, luego por categoría  
4. **Visibilidad clara** de compras sin categorizar (como indicador de trabajo pendiente)
5. **Tabla filtrada dinámicamente** según la combinación de filtros activos

---

## ❌ Problema del Gráfico Anterior (Stacked Bar)

### Vista Anterior: AnnualCategoryStackedChart

```
┌─────────────────────────────────────────────────────────┐
│ Gráfico Stacked Bar Anual                               │
│ ┌───────────────────────────────────────────────────┐   │
│ │ Ene  Feb  Mar  Apr  May  Jun  Jul  Ago  Sep  Oct │   │
│ │ ███  ███  ███  ███  ███  ███  ███  ███  ███  ███ │   │
│ │ Stack de todas las categorías mezcladas en cada   │   │
│ │ mes con colores diferentes                        │   │
│ └───────────────────────────────────────────────────┘   │
│ Leyenda: [Cat1] [Cat2] [Cat3] ... [Sin Categoría]      │
└─────────────────────────────────────────────────────────┘
```

#### Problemas identificados:

1. **Sobrecarga visual:**  
   - Si hay 10+ categorías, el gráfico se vuelve ilegible
   - Cada mes tiene una barra con stack de colores pequeños y difíciles de distinguir
   - El tooltip muestra demasiada información a la vez

2. **Mezcla de dimensiones de análisis:**
   - El eje temporal (meses) y el eje categorial (categorías) están comprimidos en un solo gráfico
   - Dificulta responder preguntas simples como "¿Cuánto gasto en total en marzo?" (hay que sumar mentalmente)
   - No hay orden de importancia: las categorías aparecen alfabéticamente o por primera aparición

3. **"Sin Categoría" contaminante:**
   - Aparecía como una categoría más dentro del stack
   - En etapas iniciales de uso, domina el gráfico (muchas compras sin categorizar)
   - Dificulta ver el análisis real de categorías asignadas

4. **Interacción confusa:**
   - Click en barra → selecciona mes, pero ¿qué categoría?
   - Click en leyenda → selecciona categoría, pero visualmente el filtro no es obvio
   - No hay forma clara de ver qué filtros están activos

---

## ✅ Por Qué Se Eligió Separación Temporal vs Categoría

### Principio de diseño: **Separar dimensiones de análisis**

La información financiera tiene dos ejes fundamentales:
- **Tiempo:** ¿Cuándo ocurren los gastos?
- **Categoría:** ¿En qué se gasta?

Mezclar ambas en un solo gráfico crea conflictos visuales y cognitivos.

### Solución propuesta: Dos gráficos coordinados

```
┌─────────────────────────────────────────────────────────────────┐
│ FILTROS ACTIVOS                                                 │
│ 🔍 Mostrando: [Mar 2026] [Cata] [Limpiar todos]               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────┬─────────────────────────────────────┐
│ GRÁFICO 1: TEMPORAL     │ GRÁFICO 2: CATEGORÍAS (Pareto)      │
│                         │                                      │
│ 📊 Proyección Mensual   │ 📈 Categorías (Pareto) - Mar 2026   │
│ ┌─────┐                 │                                      │
│ │     │ ┌─────┐         │ Supermercado ████████████ $450k     │
│ │ Ene │ │ Feb │         │ Cata          █████████   $320k     │
│ └─────┘ └─────┘         │ Transporte    ████        $180k     │
│         [Mar]★          │ Servicios     ███         $120k     │
│                         │                                      │
│ Click → filtrar mes     │ ⚠️ Sin Categoría                    │
│                         │ 12 compras · $235.000               │
│                         │ [Click para ver]                     │
│                         │                                      │
│                         │ Click → filtrar categoría            │
└─────────────────────────┴─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TABLA FILTRADA (Mar 2026 + Cata)                               │
│ Comercio | Categoría | Fecha | Total | Cuotas | Acciones       │
└─────────────────────────────────────────────────────────────────┘
```

### Ventajas de esta separación:

1. **Claridad temporal:**
   - Gráfico izquierdo muestra **una barra por mes** sin divisiones internas
   - Responde de inmediato: "¿Cuánto gasto en total en marzo?" → altura de barra
   - Sin confusión de colores o stacks

2. **Análisis categorial ordenado:**
   - Gráfico derecho muestra categorías **ordenadas por importancia** (mayor a menor)
   - Pareto permite identificar qué categorías concentran el gasto
   - Se recalcula dinámicamente según el mes seleccionado (si hay filtro activo)

3. **Flujo de análisis natural:**
   - Usuario primero explora temporalmente: "¿Qué meses tienen más gasto?"
   - Luego profundiza categorialmente: "En marzo, ¿en qué gasté?"
   - Finalmente ve detalle de compras en tabla filtrada

4. **Filtros progresivos y reversibles:**
   - Click en mes → gráfico derecho se recalcula para ESE mes
   - Click en categoría → tabla filtra por mes + categoría
   - Botones X individuales para limpiar filtros parciales
   - Botón "Limpiar todos" para reset completo

---

## 📊 Por Qué Se Eligió Pareto (Barra Horizontal Ordenada)

### Definición de Pareto

Un gráfico Pareto ordena los datos **de mayor a menor** por magnitud, facilitando identificar qué elementos concentran el mayor impacto (regla 80/20).

### Implementación actual:

- **Barra horizontal** (no vertical) para tener espacio para nombres largos de categorías
- **Ordenamiento descendente** por monto total
- **Solo categorías reales** (no incluye "Sin Categoría" dentro del gráfico)
- **Colores persistentes** según el color asignado a cada categoría

### Por qué barra horizontal:

| Característica | Barra Vertical | Barra Horizontal ✓ |
|----------------|----------------|--------------------|
| Nombres de categorías largos | Se cortan o rotan | Se leen completos |
| Ordenamiento visual | Natural (top-down) | Natural (top-down) |
| Escalabilidad | Limitada (max ~10 items) | Mejor (hasta ~15 items) |
| Legibilidad en mobile | Mala | Buena |

### Por qué Pareto y no gráfico de torta (pie chart):

- **Comparación precisa:** En barras se compara longitud (preciso), en torta se compara ángulo (impreciso)
- **Ordenamiento explícito:** Pareto siempre está ordenado, torta no tiene orden inherente
- **Escala:** Pareto funciona con 15+ categorías, torta se satura con 7+

### Ejemplo visual del Pareto implementado:

```
📈 Categorías (Pareto) - 2026

Supermercado  ████████████████████  $1.250.000 (22 compras)
Cata          ████████████████      $980.000   (15 compras)
Transporte    ██████████            $620.000   (8 compras)
Servicios     ████████              $480.000   (4 compras)
Hogar         █████                 $320.000   (6 compras)
...

⚠️ Sin Categoría
12 compras · $412.300
[Click para ver]
```

---

## 📁 Archivos Modificados

### Nuevos componentes creados:

#### 1. `MonthlyBarChart.tsx`
- **Ubicación:** `node-version/client/src/components/presupuesto/`
- **Función:** Gráfico temporal simple con una barra por mes
- **Props:**
  - `purchases`: array de compras
  - `selectedYear`: año actual
  - `selectedMonth`: mes seleccionado (null = ninguno)
  - `onSelectMonth`: callback para cambiar mes seleccionado
- **Características:**
  - Barras verticales simples (sin stack)
  - Color azul sólido con énfasis en barra seleccionada
  - Opacidad reducida en barras no seleccionadas
  - Tooltip simple mostrando total del mes
  - Panel de confirmación con botón "Limpiar" cuando hay selección

#### 2. `CategoryParetoChart.tsx`
- **Ubicación:** `node-version/client/src/components/presupuesto/`
- **Función:** Gráfico Pareto horizontal + bloque "Sin Categoría"
- **Props:**
  - `purchases`: array de compras
  - `selectedYear`: año actual
  - `selectedMonth`: mes seleccionado (null = año completo)
  - `selectedCategory`: categoría seleccionada (null = ninguna)
  - `onSelectCategory`: callback para cambiar categoría seleccionada
- **Características:**
  - Barra horizontal ordenada descendente por monto
  - Solo incluye categorías reales (excluye "Sin Categoría")
  - Colores por categoría (del `category.color` de la BD)
  - Tooltip con: nombre, número de compras, monto total
  - Altura dinámica según cantidad de categorías (min 250px, +40px por categoría)
  - **Bloque separado "Sin Categoría":**
    - Aparece debajo del gráfico Pareto
    - Diseño tipo "alert" con icono ⚠️
    - Muestra: contador de compras + monto total
    - Clickeable para filtrar por `category = null`
    - Estilo amarillo destacado
    - Reacciona al filtro mensual (recalcula conteo/monto solo del mes seleccionado)

### Archivos modificados:

#### 3. `Tenpo.tsx`
- **Ubicación:** `node-version/client/src/pages/`
- **Cambios principales:**

##### Imports actualizados:
```typescript
// ❌ Removido:
import AnnualCategoryStackedChart from '../components/presupuesto/AnnualCategoryStackedChart';

// ✅ Agregados:
import MonthlyBarChart from '../components/presupuesto/MonthlyBarChart';
import CategoryParetoChart from '../components/presupuesto/CategoryParetoChart';
```

##### Funciones de manejo de filtros refactorizadas:
```typescript
// ❌ Antes: Una sola función con dos parámetros
const handleSelectSegment = (month: number | null, category: string | null) => {
  setSelectedMonth(month);
  setSelectedCategory(category);
};

// ✅ Ahora: Dos funciones separadas
const handleSelectMonth = (month: number | null) => {
  setSelectedMonth(month);
};

const handleSelectCategory = (category: string | null) => {
  setSelectedCategory(category);
};

// ✅ Nueva función para limpiar todos los filtros
const handleClearFilters = () => {
  setSelectedMonth(null);
  setSelectedCategory(null);
};
```

##### JSX restructurado:

**ANTES:**
```jsx
<AnnualCategoryStackedChart
  purchases={purchases}
  selectedYear={anioSeleccionado}
  selectedMonth={selectedMonth}
  selectedCategory={selectedCategory}
  onSelectSegment={handleSelectSegment}
/>
```

**AHORA:**
```jsx
{/* Franja de filtros activos */}
{(selectedMonth || selectedCategory) && (
  <div style={{ /* estilo de franja azul */ }}>
    <div>
      🔍 Mostrando:
      {selectedMonth && <Badge>{mes} {año} [X]</Badge>}
      {selectedCategory && <Badge>{categoría} [X]</Badge>}
    </div>
    <button onClick={handleClearFilters}>
      🗑️ Limpiar todos los filtros
    </button>
  </div>
)}

{/* Layout de dos columnas con gráficos */}
<div style={{ 
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
  gap: '1.5rem'
}}>
  <MonthlyBarChart
    purchases={purchases}
    selectedYear={anioSeleccionado}
    selectedMonth={selectedMonth}
    onSelectMonth={handleSelectMonth}
  />
  <CategoryParetoChart
    purchases={purchases}
    selectedYear={anioSeleccionado}
    selectedMonth={selectedMonth}
    selectedCategory={selectedCategory}
    onSelectCategory={handleSelectCategory}
  />
</div>
```

---

## 🔗 Cambios por Archivo

### 1. MonthlyBarChart.tsx

**Responsabilidad:** Análisis temporal simple

#### Lógica de procesamiento:
```typescript
const chartData = useMemo(() => {
  // Inicializar 12 meses con total = 0
  const monthsData: MonthData[] = MESES_SHORT.map((mes, idx) => ({
    month: mes,
    monthIndex: idx + 1,
    total: 0
  }));

  // Acumular cuotas del año seleccionado por mes
  purchases.forEach(purchase => {
    purchase.installments.forEach(inst => {
      const dueDate = new Date(inst.dueDate);
      if (dueDate.getFullYear() === selectedYear) {
        const monthIdx = dueDate.getMonth(); // 0-11
        monthsData[monthIdx].total += inst.finalMonthlyAmountClp;
      }
    });
  });

  return monthsData;
}, [purchases, selectedYear]);
```

#### Componente Recharts:
- `<BarChart>` con layout vertical (default)
- Una sola serie: `<Bar dataKey="total">`
- `<Cell>` para cada barra con:
  - Color azul sólido (`#6366f1` default, `#3b82f6` seleccionado)
  - Opacidad 0.3 si hay selección y no es la barra seleccionada
  - Stroke azul oscuro (`#1e40af`) si está seleccionada
- onClick en barra → toggle de selección de mes
- Tooltip simple con mes y total

#### Panel de confirmación:
```jsx
{selectedMonth && (
  <div style={{ /* estilo de panel azul claro */ }}>
    📌 Mes seleccionado: {mes} {año}
    <button onClick={() => onSelectMonth(null)}>✕ Limpiar</button>
  </div>
)}
```

---

### 2. CategoryParetoChart.tsx

**Responsabilidad:** Análisis categorial ordenado + gestión de "Sin Categoría"

#### Lógica de procesamiento:
```typescript
const { chartData, uncategorizedData } = useMemo(() => {
  const categoryMap: Record<string, CategoryData> = {};
  const uncategorized: UncategorizedData = { count: 0, total: 0, purchaseIds: [] };

  purchases.forEach(purchase => {
    const catName = purchase.category?.name;

    // Filtrar cuotas del año seleccionado y mes (si aplica)
    const relevantInstallments = purchase.installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      if (dueDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth && dueDate.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });

    if (relevantInstallments.length === 0) return;

    const purchaseTotal = relevantInstallments.reduce(
      (sum, inst) => sum + inst.finalMonthlyAmountClp,
      0
    );

    if (!catName) {
      // Sin categoría
      uncategorized.count++;
      uncategorized.total += purchaseTotal;
      uncategorized.purchaseIds.push(purchase.id);
    } else {
      // Categoría real
      if (!categoryMap[catName]) {
        categoryMap[catName] = {
          name: catName,
          total: 0,
          color: catColor,
          purchaseCount: 0
        };
      }
      categoryMap[catName].total += purchaseTotal;
      categoryMap[catName].purchaseCount++;
    }
  });

  // Ordenar descendente (Pareto)
  const categoriesList = Object.values(categoryMap)
    .sort((a, b) => b.total - a.total);

  return { chartData: categoriesList, uncategorizedData: uncategorized };
}, [purchases, selectedYear, selectedMonth]);
```

#### Componente Recharts:
- `<BarChart layout="vertical">` (barras horizontales)
- `<XAxis type="number">` (eje de valores)
- `<YAxis type="category" dataKey="name">` (eje de categorías)
- Altura dinámica: `Math.max(250, chartData.length * 40)`
- Margin left: 120px para nombres largos
- `<Cell>` con color de categoría y opacidad según selección
- onClick en barra → toggle de selección de categoría

#### Bloque "Sin Categoría":
```jsx
{uncategorizedData.count > 0 && (
  <div 
    onClick={handleUncategorizedClick}
    style={{
      padding: '1rem',
      backgroundColor: selectedCategory === 'Sin Categoría' ? '#fef3c7' : '#f9fafb',
      border: `2px solid ${selectedCategory === 'Sin Categoría' ? '#f59e0b' : '#e5e7eb'}`,
      cursor: 'pointer',
      borderRadius: '8px'
    }}
  >
    <div>
      <div>⚠️ Sin Categoría</div>
      <div>{count} compras · {formatCurrency(total)}</div>
    </div>
    <button>
      {selectedCategory === 'Sin Categoría' ? '✓ Seleccionado' : 'Click para ver'}
    </button>
  </div>
)}
```

**Comportamiento del bloque:**
- Visible solo si `uncategorizedData.count > 0`
- Muestra contador y monto **del periodo activo** (año completo o mes seleccionado)
- Al hacer click, llama a `onSelectCategory('Sin Categoría')`
- Cuando está seleccionado, cambia a estilo amarillo destacado
- Hover effect con `onMouseEnter` / `onMouseLeave` (cambio de borde y fondo)

---

### 3. Tenpo.tsx

#### Cambio en la franja de filtros activos:

**Diseño visual:**
- Franja azul claro (`#f0f9ff`) con borde azul (`#0ea5e9`)
- Visible solo si hay al menos un filtro activo
- Layout flex con wrap para responsividad
- Badges individuales para mes y categoría con botón X para limpiar
- Botón "Limpiar todos" a la derecha

**Código:**
```jsx
{(selectedMonth || selectedCategory) && (
  <div style={{ 
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '2px solid #0ea5e9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
      <span style={{ fontWeight: '600', color: '#0369a1' }}>🔍 Mostrando:</span>
      
      {selectedMonth && (
        <div style={{ /* badge style */ }}>
          <span>{mes} {año}</span>
          <button onClick={() => setSelectedMonth(null)}>✕</button>
        </div>
      )}
      
      {selectedCategory && (
        <div style={{ /* badge style */ }}>
          <span>{categoría}</span>
          <button onClick={() => setSelectedCategory(null)}>✕</button>
        </div>
      )}
    </div>
    
    <button onClick={handleClearFilters}>
      🗑️ Limpiar todos los filtros
    </button>
  </div>
)}
```

#### Cambio en el layout de gráficos:

**Diseño responsivo:**
- Grid con `repeat(auto-fit, minmax(450px, 1fr))`
- Gap de 1.5rem entre gráficos
- Width mínimo 450px por panel → en pantallas chicas se apilan verticalmente
- En pantallas grandes, se muestran lado a lado

**Código:**
```jsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
  gap: '1.5rem',
  marginBottom: '1.5rem'
}}>
  <MonthlyBarChart
    purchases={purchases}
    selectedYear={anioSeleccionado}
    selectedMonth={selectedMonth}
    onSelectMonth={handleSelectMonth}
  />
  <CategoryParetoChart
    purchases={purchases}
    selectedYear={anioSeleccionado}
    selectedMonth={selectedMonth}
    selectedCategory={selectedCategory}
    onSelectCategory={handleSelectCategory}
  />
</div>
```

---

## 🔄 Lógica de Coordinación Entre Gráficos

### Flujo de interacción completo:

#### 1. Estado inicial (sin filtros):
```
selectedMonth = null
selectedCategory = null

MonthlyBarChart: muestra 12 meses del año completo
CategoryParetoChart: muestra categorías del año completo
AnnualTenpoTable: muestra todas las compras del año
Franja de filtros: oculta
```

#### 2. Usuario hace click en "Marzo" (gráfico izquierdo):
```
onSelectMonth(3) → setSelectedMonth(3)

MonthlyBarChart: 
  - Barra de Marzo destacada (stroke azul, color #3b82f6)
  - Otras barras con opacidad 0.3
  - Panel inferior: "📌 Mes seleccionado: Mar 2026 [Limpiar]"

CategoryParetoChart:
  - **RECALCULA datos solo con cuotas de Marzo**
  - Header cambia a: "📈 Categorías (Pareto) - Mar 2026"
  - Bloque "Sin Categoría" muestra solo compras de Marzo sin categorizar

AnnualTenpoTable:
  - Filtra compras para mostrar solo las que tienen cuotas en Marzo

Franja de filtros:
  - Aparece con badge: "🔍 Mostrando: [Mar 2026 X]"
```

#### 3. Usuario hace click en "Supermercado" (gráfico derecho):
```
onSelectCategory('Supermercado') → setSelectedCategory('Supermercado')

MonthlyBarChart:
  - Mantiene selección de Marzo (sin cambios)

CategoryParetoChart:
  - Barra "Supermercado" con stroke azul
  - Otras barras con opacidad 0.3
  - Panel inferior: "📌 Categoría seleccionada: Supermercado [Limpiar]"

AnnualTenpoTable:
  - Filtra compras para mostrar solo:
    - Cuotas en Marzo (filtro de mes)
    - Y categoría = Supermercado (filtro de categoría)

Franja de filtros:
  - Actualiza a: "🔍 Mostrando: [Mar 2026 X] [Supermercado X] [Limpiar todos]"
```

#### 4. Usuario hace click en X de "Mar 2026":
```
setSelectedMonth(null)

MonthlyBarChart:
  - Todas las barras vuelven a opacidad 1
  - Panel inferior desaparece

CategoryParetoChart:
  - **RECALCULA datos con año completo de nuevo**
  - Header cambia a: "📈 Categorías (Pareto) - 2026"
  - Mantiene selección de "Supermercado"
  - Bloque "Sin Categoría" muestra compras del año completo

AnnualTenpoTable:
  - Filtra compras solo por categoría = Supermercado (sin filtro de mes)

Franja de filtros:
  - Actualiza a: "🔍 Mostrando: [Supermercado X] [Limpiar todos]"
```

#### 5. Usuario hace click en "Limpiar todos":
```
handleClearFilters() → setSelectedMonth(null) + setSelectedCategory(null)

MonthlyBarChart: vuelve a estado inicial
CategoryParetoChart: vuelve a estado inicial (año completo, sin selección)
AnnualTenpoTable: muestra todas las compras del año
Franja de filtros: se oculta
```

### Flujo especial: Click en bloque "Sin Categoría"

```
Usuario click en bloque amarillo ⚠️ Sin Categoría

onSelectCategory('Sin Categoría') → setSelectedCategory('Sin Categoría')

CategoryParetoChart:
  - Bloque "Sin Categoría" cambia a estilo seleccionado (fondo #fef3c7, borde #f59e0b)
  - Texto del botón cambia a "✓ Seleccionado"
  - El gráfico Pareto permanece visible (muestra categorías reales)

AnnualTenpoTable:
  - Filtra compras donde `category === null`
  - Si hay mes seleccionado, aplica ambos filtros

Franja de filtros:
  - Badge: "🔍 Mostrando: [Sin Categoría X]"
  - (o "[Mar 2026 X] [Sin Categoría X]" si hay mes activo)
```

---

## 🧮 Lógica de Filtrado Aplicada a la Tabla

### Componente: AnnualTenpoTable.tsx

**Nota:** Este componente ya existía del diseño anterior y NO fue modificado en este cambio. Su lógica de filtrado ya soportaba `selectedMonth` y `selectedCategory`.

#### Lógica de filtrado (ya existente):
```typescript
const filteredData = useMemo(() => {
  const rows: PurchaseRow[] = [];

  purchases.forEach(purchase => {
    // 1. Filtrar cuotas por año y mes (si aplica)
    let relevantInstallments = purchase.installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      if (dueDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth && dueDate.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });

    // 2. Si hay mes seleccionado, excluir compras sin cuotas en ese mes
    if (selectedMonth && relevantInstallments.length === 0) return;

    // 3. Filtrar por categoría
    const catName = purchase.category?.name || 'Sin Categoría';
    if (selectedCategory && catName !== selectedCategory) return;

    // 4. Calcular monto total del periodo
    const monthTotal = relevantInstallments.reduce(
      (sum, inst) => sum + inst.finalMonthlyAmountClp,
      0
    );

    rows.push({
      purchase,
      merchant: purchase.merchant,
      category: catName,
      monthTotal,
      cuotasEnMes: relevantInstallments.length,
      // ... otros campos
    });
  });

  return rows.sort(...); // sorting logic
}, [purchases, selectedYear, selectedMonth, selectedCategory, sortColumn, sortType]);
```

#### Casos de filtrado:

| selectedMonth | selectedCategory | Resultado en tabla |
|---------------|------------------|--------------------|
| `null` | `null` | Todas las compras del año |
| `3` (Marzo) | `null` | Compras con cuotas en Marzo |
| `null` | `'Supermercado'` | Compras de categoría Supermercado (año completo) |
| `3` | `'Supermercado'` | Compras de Supermercado con cuotas en Marzo |
| `null` | `'Sin Categoría'` | Compras sin categoría asignada (año completo) |
| `3` | `'Sin Categoría'` | Compras sin categoría con cuotas en Marzo |

---

## ⚠️ Riesgos / Límites del MVP

### 1. **Performance con muchas categorías**

**Riesgo:** Si hay 30+ categorías, el gráfico Pareto se vuelve muy alto.

**Mitigación actual:**
- Altura dinámica: `Math.max(250, chartData.length * 40)`
- Scroll automático del Panel de RSuite si supera viewport

**Si se vuelve problema:**
- Limitar a top 15 categorías
- Agregar collapse/expand para ver más
- Agregar paginación en el gráfico

---

### 2. **Categorías con nombres muy largos**

**Riesgo:** Si una categoría se llama "Servicios Básicos del Hogar y Mantenimiento", no cabe en el eje Y.

**Mitigación actual:**
- Margin left de 120px en el gráfico
- Recharts trunca automáticamente con `...`

**Si se necesita:**
- Tooltip en eje Y mostrando nombre completo
- Rotar texto 45°
- Abreviaciones automáticas (ej: "Servicios Básicos...")

---

### 3. **"Sin Categoría" domina en usuarios nuevos**

**Riesgo:** Un usuario nuevo puede tener 90% de compras sin categorizar.

**Situación actual:**
- El bloque "Sin Categoría" es muy visible (diseño amarillo con ⚠️)
- Está separado del gráfico Pareto, no contamina el análisis de categorías reales
- Al hacer click, filtra la tabla para ver SOLO sin categoría → facilita clasificación masiva

**Mejora futura:**
- Desde la tabla filtrada de "Sin Categoría", permitir selección múltiple (checkboxes)
- Asignación masiva de categoría a varias compras a la vez

---

### 4. **Mobile: Layout de dos columnas se rompe**

**Riesgo:** En pantallas < 950px, los dos gráficos se apilan verticalmente.

**Situación actual:**
- Grid con `repeat(auto-fit, minmax(450px, 1fr))`
- Si width < 950px, cada gráfico ocupa 100% width y se apilan
- Funcional pero puede ser confuso tener que hacer scroll entre gráficos

**Mejora futura:**
- Tabs en mobile: "Temporal" | "Categorías"
- O accordion colapsable

---

### 5. **Pareto recalcula con cada cambio de mes**

**Riesgo:** Si hay miles de compras, el recalculo puede ser lento.

**Mitigación actual:**
- `useMemo` con dependencias `[purchases, selectedYear, selectedMonth]`
- Solo recalcula si cambia el dataset o los filtros
- Recharts es performante hasta ~100 barras

**Si se vuelve problema:**
- Precalcular datos por mes en backend
- Endpoint `/api/tenpo/category-summary?year=2026&month=3`
- Cachear resultados

---

## ✅ Validación Manual

### Test 1: Vista inicial sin filtros
1. Abrir `/presupuesto/tenpo`
2. **Verificar:**
   - ✅ Gráfico izquierdo muestra 12 barras (Ene-Dic)
   - ✅ Gráfico derecho muestra categorías del año ordenadas descendente
   - ✅ Si hay compras sin categorizar, aparece bloque "⚠️ Sin Categoría"
   - ✅ Tabla muestra todas las compras del año
   - ✅ Franja de filtros NO visible

---

### Test 2: Selección de mes
1. Click en barra de Marzo (gráfico izquierdo)
2. **Verificar:**
   - ✅ Barra de Marzo destacada (stroke azul, color más oscuro)
   - ✅ Otras barras con opacidad reducida
   - ✅ Panel interno muestra "📌 Mes seleccionado: Mar 2026 [Limpiar]"
   - ✅ Gráfico derecho recalcula y muestra categorías SOLO de Marzo
   - ✅ Header del gráfico derecho dice "Mar 2026"
   - ✅ Bloque "Sin Categoría" muestra contador y monto SOLO de Marzo
   - ✅ Tabla filtra compras con cuotas en Marzo
   - ✅ Franja de filtros aparece con badge "[Mar 2026 X]"

---

### Test 3: Selección de categoría (con mes ya seleccionado)
1. Con Marzo seleccionado, click en "Supermercado" (gráfico derecho)
2. **Verificar:**
   - ✅ Barra "Supermercado" destacada (stroke, color más oscuro)
   - ✅ Otras barras con opacidad reducida
   - ✅ Panel interno muestra "📌 Categoría seleccionada: Supermercado [Limpiar]"
   - ✅ Tabla filtra: Mar 2026 + Supermercado
   - ✅ Franja de filtros muestra: "[Mar 2026 X] [Supermercado X]"

---

### Test 4: Limpiar filtro de mes (categoría sigue activa)
1. Click en X del badge "Mar 2026" en la franja de filtros
2. **Verificar:**
   - ✅ Gráfico izquierdo vuelve a mostrar todas las barras sin énfasis
   - ✅ Gráfico derecho recalcula con año completo (header dice "2026")
   - ✅ Tabla filtra solo por Supermercado (sin mes)
   - ✅ Franja de filtros muestra solo: "[Supermercado X]"

---

### Test 5: Limpiar todos los filtros
1. Click en botón "🗑️ Limpiar todos los filtros"
2. **Verificar:**
   - ✅ Ambos gráficos vuelven a estado inicial
   - ✅ Tabla muestra todas las compras del año
   - ✅ Franja de filtros desaparece

---

### Test 6: Click en bloque "Sin Categoría"
1. Click en el bloque amarillo "⚠️ Sin Categoría"
2. **Verificar:**
   - ✅ Bloque cambia a estilo seleccionado (fondo #fef3c7, borde #f59e0b)
   - ✅ Texto del botón cambia a "✓ Seleccionado"
   - ✅ Tabla filtra para mostrar SOLO compras sin categoría
   - ✅ Franja de filtros muestra: "[Sin Categoría X]"

---

### Test 7: Coordinación mes + sin categoría
1. Seleccionar Marzo (gráfico izquierdo)
2. Click en bloque "Sin Categoría"
3. **Verificar:**
   - ✅ Tabla filtra: Mar 2026 + Sin Categoría
   - ✅ Franja de filtros: "[Mar 2026 X] [Sin Categoría X]"
   - ✅ Bloque "Sin Categoría" muestra contador y monto SOLO de Marzo

---

### Test 8: Hover en bloque "Sin Categoría" no seleccionado
1. Pasar mouse sobre bloque amarillo (sin hacer click)
2. **Verificar:**
   - ✅ Borde cambia a #f59e0b (naranja)
   - ✅ Fondo cambia a #fef3c7 (amarillo claro)
   - ✅ Cursor pointer visible

---

### Test 9: Tooltip del gráfico Pareto
1. Hover sobre barra de "Supermercado" en gráfico derecho
2. **Verificar:**
   - ✅ Tooltip muestra:
     - Nombre de categoría
     - Número de compras
     - Monto total formateado ($xxx.xxx)
   - ✅ Tooltip tiene estilo card blanco con sombra

---

### Test 10: Responsividad mobile
1. Reducir ancho de ventana a < 950px
2. **Verificar:**
   - ✅ Gráficos se apilan verticalmente (uno debajo del otro)
   - ✅ Ambos gráficos ocupan 100% width
   - ✅ Interacción sigue funcionando
   - ✅ Franja de filtros se ajusta con wrap

---

## 🎨 Resumen de Diseño Visual

### Paleta de colores:

| Elemento | Color | Uso |
|----------|-------|-----|
| Gráfico mensual (default) | `#6366f1` (índigo) | Barras no seleccionadas |
| Gráfico mensual (seleccionado) | `#3b82f6` (azul) | Barra seleccionada |
| Gráfico mensual (stroke) | `#1e40af` (azul oscuro) | Borde de barra seleccionada |
| Gráfico Pareto | `category.color` | Color asignado a cada categoría |
| Bloque "Sin Categoría" (default) | `#f9fafb` (gris claro) | Fondo no seleccionado |
| Bloque "Sin Categoría" (hover/selected) | `#fef3c7` (amarillo claro) | Fondo seleccionado |
| Bloque "Sin Categoría" (borde selected) | `#f59e0b` (naranja) | Borde seleccionado |
| Franja de filtros | `#f0f9ff` (azul muy claro) | Fondo |
| Franja de filtros (borde) | `#0ea5e9` (azul cielo) | Borde |

### Iconos utilizados:

- 📊 Proyección Mensual
- 📈 Categorías (Pareto)
- 🔍 Mostrando (filtros activos)
- ✕ Limpiar filtro individual
- 🗑️ Limpiar todos los filtros
- ⚠️ Sin Categoría
- 📌 Mes/Categoría seleccionada
- ✓ Seleccionado

---

## 🚀 Siguiente Paso Recomendado

### Prioridad 1: Asignación masiva de categorías desde "Sin Categoría"

**Problema:**  
Cuando un usuario nuevo tiene 50+ compras sin categorizar, tiene que ir una por una.

**Solución propuesta:**

1. Cuando `selectedCategory === 'Sin Categoría'`:
   - Mostrar checkbox en cada fila de `AnnualTenpoTable`
   - Botón flotante: "Asignar categoría a X seleccionadas"
   
2. Al hacer click en botón:
   - Abrir modal con TreePicker de categorías
   - Aplicar categoría a todas las compras seleccionadas
   - Endpoint: `PATCH /api/tenpo/purchases/batch-category`

**Impacto:** Reduce de minutos a segundos la tarea de clasificar compras pendientes.

---

### Prioridad 2: Exportar vista filtrada

**Petición común:**  
"Quiero exportar a Excel las compras de Supermercado de Marzo"

**Solución:**

- Botón "📥 Exportar" en header de `AnnualTenpoTable`
- Exporta `filteredData` actual (respeta filtros activos)
- Formato CSV o XLSX (librería `xlsx`)

---

### Prioridad 3: Guardar filtros en URL

**Problema:**  
Si el usuario recarga la página, pierde el estado de filtros.

**Solución:**

```typescript
// En Tenpo.tsx
const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  const month = searchParams.get('month');
  const category = searchParams.get('category');
  if (month) setSelectedMonth(parseInt(month));
  if (category) setSelectedCategory(category);
}, []);

const handleSelectMonth = (month: number | null) => {
  setSelectedMonth(month);
  if (month) {
    searchParams.set('month', month.toString());
  } else {
    searchParams.delete('month');
  }
  setSearchParams(searchParams);
};
```

**Beneficio:** URLs compartibles: `/presupuesto/tenpo?month=3&category=Supermercado`

---

## 📊 Comparación Antes vs Después

| Métrica | Antes (Stacked Bar) | Después (Dos gráficos) |
|---------|---------------------|------------------------|
| **Legibilidad temporal** | Media (stack confunde) | Alta (barra simple) |
| **Legibilidad categorial** | Baja (stack mezclado) | Alta (Pareto ordenado) |
| **"Sin Categoría" visible** | No (mezclado) | Sí (bloque separado) |
| **Filtrado progresivo** | No | Sí (mes → categoría) |
| **Claridad de filtros activos** | Baja | Alta (franja dedicada) |
| **Ordenamiento categorial** | Alfabético | Por importancia (Pareto) |
| **Espacio vertical** | 350px | 300px + 250-600px (dinámico) |
| **Componentes** | 1 | 2 |
| **Claridad analítica** | Media | Alta |

---

## 🎯 Conclusión

El rediseño de dos gráficos coordinados logra:

1. ✅ **Separar dimensiones de análisis:** Tiempo y categoría son ejes independientes
2. ✅ **Claridad temporal:** Gráfico mensual simple sin contaminación de categorías
3. ✅ **Análisis categorial ordenado:** Pareto muestra qué categorías dominan el gasto
4. ✅ **"Sin Categoría" como indicador de trabajo:** Bloque separado y destacado
5. ✅ **Filtrado progresivo e intuitivo:** Mes → Categoría → Tabla
6. ✅ **Reversibilidad total:** Botones X individuales + "Limpiar todos"
7. ✅ **Franja de filtros activos clara:** Usuario siempre sabe qué está viendo

**Próximos pasos:**
1. Validación manual completa
2. Feedback de usuario sobre usabilidad
3. Implementar asignación masiva de categorías
4. Considerar exportación de datos filtrados

---

**Fin del documento**
