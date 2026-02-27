# Ajustes Financieros - Vista Consolidada Actual

**Fecha**: 2026-02-27  
**Objetivo**: Refinar la Vista Consolidada de /actual con enfoque financiero y limpieza visual.

---

## 📋 Resumen de Cambios

Se refinó la Vista Consolidada para hacerla más profesional y financiera, eliminando alertas visuales distractoras y agregando métricas clave:

1. **Delta Inteligente**: Color de texto según tipo de categoría y signo
2. **Columna % ING**: Porcentaje de cada gasto sobre ingresos totales
3. **Totalizador de Gastos**: Fila final con suma de todos los gastos
4. **Limpieza Visual**: Eliminación de fondos de alerta (amarillo/rojo)
5. **Formato Numérico**: Porcentajes con 1 decimal y coma

---

## 🎨 1. Delta Inteligente

### Lógica de Color

El color del delta se determina según:
- **Tipo de categoría** (INGRESOS vs GASTOS)
- **Signo del delta** (positivo, negativo, cero)

### Reglas Aplicadas

#### Para INGRESOS:
```
deltaClp > 0  → delta--good   (verde #15803d)
deltaClp < 0  → delta--bad    (rojo #b91c1c)
deltaClp = 0  → delta--neutral (gris #6b7280)
```

**Razón**: En ingresos, ganar más de lo presupuestado es bueno.

#### Para GASTOS (todas las demás categorías):
```
deltaClp < 0  → delta--good   (verde #15803d)
deltaClp > 0  → delta--bad    (rojo #b91c1c)
deltaClp = 0  → delta--neutral (gris #6b7280)
```

**Razón**: En gastos, gastar menos de lo presupuestado es bueno.

### Implementación

**Función en componente**:
```tsx
const getDeltaClass = (deltaClp: number, isIncome: boolean) => {
  if (deltaClp === 0) return 'delta--neutral';
  if (isIncome) {
    return deltaClp > 0 ? 'delta--good' : 'delta--bad';
  } else {
    return deltaClp < 0 ? 'delta--good' : 'delta--bad';
  }
};
```

**Aplicación**:
```tsx
<td className={`monto ${getDeltaClass(category.deltaClp, isIncome)}`}>
  {formatMonto(category.deltaClp)}
</td>
```

**CSS**:
```css
.delta--good {
  color: #15803d;
  font-weight: 600;
}

.delta--bad {
  color: #b91c1c;
  font-weight: 600;
}

.delta--neutral {
  color: var(--gray-500);
}
```

---

## 📊 2. Columna "% ING"

### Propósito

Mostrar qué porcentaje representan los gastos sobre el ingreso total del mes.

### Fórmula

```
% ING = (actualClp / summary.totalIngresos) × 100
```

### Reglas de Visualización

| Condición | Valor Mostrado |
|-----------|----------------|
| Categoría = INGRESOS | "—" |
| summary.totalIngresos = 0 | "—" |
| Otra categoría | % con 1 decimal y coma |

### Implementación

**Función de formato**:
```tsx
const formatPctIncome = (actualClp: number) => {
  if (summary.totalIngresos === 0) return '—';
  const pct = (actualClp / summary.totalIngresos) * 100;
  return pct.toFixed(1).replace('.', ',') + '%';
};
```

**Renderizado en columna**:
```tsx
<td className="percent-income">
  {isIncome ? '—' : formatPctIncome(category.actualClp)}
</td>
```

**Header de tabla**:
```tsx
<th className="percent-income">% ING</th>
```

### Ejemplo de Cálculo

| Categoría | Actual | Total Ingresos | % ING |
|-----------|--------|----------------|-------|
| Servicios Básicos | 768.886 | 3.551.910 | 21,7% |
| Supermercado | 1.182.524 | 3.551.910 | 33,3% |
| TOTAL GASTOS | 3.150.309 | 3.551.910 | 88,7% |

---

## 🧮 3. Totalizador de Gastos

### Propósito

Mostrar suma consolidada de **todas las categorías de gastos** (excluyendo INGRESOS).

### Fila Agregada

**Concepto**: "TOTAL GASTOS"  
**Ubicación**: Última fila de `<tbody>`  
**Estilo**: `.total-row`

### Cálculos

#### Presupuesto Total
```tsx
const expenseCategories = sortedCategories.filter(c => c.name !== ActualCategory.INGRESOS);
const totalExpensesBudget = expenseCategories.reduce((sum, c) => sum + c.budgetClp, 0);
```

#### Actual Total
```tsx
const totalExpensesActual = expenseCategories.reduce((sum, c) => sum + c.actualClp, 0);
```

#### Delta Total
```tsx
const totalExpensesDelta = totalExpensesActual - totalExpensesBudget;
```

#### % Ejecución
```tsx
const totalExpensesPctExec = totalExpensesBudget > 0 
  ? (totalExpensesActual / totalExpensesBudget) * 100 
  : null;
```

#### % ING
```tsx
// Usa formatPctIncome(totalExpensesActual)
// Fórmula: (totalExpensesActual / summary.totalIngresos) * 100
```

### Renderizado

```tsx
<tr className="total-row">
  <td>TOTAL GASTOS</td>
  <td className="monto">{formatMonto(totalExpensesBudget)}</td>
  <td className="monto">{formatMonto(totalExpensesActual)}</td>
  <td className={`monto ${getDeltaClass(totalExpensesDelta, false)}`}>
    {formatMonto(totalExpensesDelta)}
  </td>
  <td className="percent">
    {totalExpensesPctExec !== null ? formatPctExec(totalExpensesPctExec) : '—'}
  </td>
  <td className="percent-income">
    {formatPctIncome(totalExpensesActual)}
  </td>
</tr>
```

### CSS

```css
.tabla-consolidada .total-row {
  font-weight: 700;
  border-top: 2px solid var(--gray-300);
  background: var(--gray-50);
}
```

### Ejemplo con Datos Reales

| Concepto | Presupuesto | Actual | Delta | % Ejec | % ING |
|----------|-------------|--------|-------|--------|-------|
| TOTAL GASTOS | 5.500.000 | 3.150.309 | -2.349.691 | 57,3% | 88,7% |

**Interpretación**:
- Se gastó 57,3% del presupuesto total de gastos (favorable)
- Los gastos representan 88,7% de los ingresos del mes

---

## 🧹 4. Limpieza Visual

### Cambios Realizados

#### Eliminado:
- ❌ `.row-warning` (fondo amarillo)
- ❌ `.row-critical` (fondo rojo)
- ❌ Gradientes en `.group-row`
- ❌ Lógica de `getRowClass()` y `getLineRowClass()` con alertas de fondo

#### Actualizado:

**Fila de grupo**:
```css
.tabla-consolidada .group-row {
  background: var(--gray-100);  /* Sin gradiente */
  font-weight: 600;
  border-top: 1px solid var(--gray-200);
  border-bottom: 2px solid var(--gray-200);
}

.tabla-consolidada .group-row:hover {
  background: var(--gray-200);  /* Hover más discreto */
}
```

**Fila de sub-item**:
```css
.tabla-consolidada .sub-row {
  background: white;
  /* Sin alertas de fondo */
}
```

### Principio de Diseño

**"Solo escala de grises, color solo en texto"**

- Fondos: grises neutros
- Alertas visuales: solo mediante color de texto en delta
- Enfoque financiero: sobrio, claro, no distractivo

---

## 🔢 5. Formato Numérico

### Porcentajes

**Formato**: 1 decimal con coma como separador

**Implementación**:
```tsx
const formatPctExec = (pctExec: number | null) => {
  if (pctExec === null) return '—';
  return pctExec.toFixed(1).replace('.', ',') + '%';
};
```

**Ejemplos**:
- `23.6%` → `23,6%`
- `100.0%` → `100,0%`
- `null` → `—`

### Montos

**Formato**: Sin decimales, separador de miles según es-CL

**Implementación**:
```tsx
const formatMonto = (monto: number) => {
  return monto.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
```

**Ejemplos**:
- `3551910` → `3.551.910`
- `768886` → `768.886`

---

## 📂 Archivos Modificados

### 1. `ActualConsolidatedTable.tsx`
**Ubicación**: `node-version/client/src/components/actual/ActualConsolidatedTable.tsx`

**Cambios**:
- ✅ Agregada función `formatPctIncome()`
- ✅ Agregada función `getDeltaClass()`
- ✅ Actualizada función `formatPctExec()` para usar coma
- ✅ Eliminadas funciones `getRowClass()` y `getLineRowClass()`
- ✅ Agregada columna "% ING" en header y todas las filas
- ✅ Aplicadas clases delta inteligente en todas las celdas Delta
- ✅ Calculados totales de gastos (budget, actual, delta, %ejec, %ing)
- ✅ Agregada fila `<tr className="total-row">` con totalizador
- ✅ Clases de fila simplificadas: `group-row` y `sub-row` (sin alertas)

### 2. `index.css`
**Ubicación**: `node-version/client/src/index.css`

**Cambios**:
- ✅ Agregada variable `--gray-500: #6b7280;` en `:root`
- ✅ Eliminadas clases `.row-warning` y `.row-critical`
- ✅ Actualizada clase `.group-row` (sin gradiente)
- ✅ Actualizado hover de `.group-row` (más discreto)
- ✅ Agregadas clases `.delta--good`, `.delta--bad`, `.delta--neutral`
- ✅ Agregada clase `.percent-income`
- ✅ Agregada clase `.total-row`

---

## 🧪 Testing Manual

### 1. Verificar Delta Inteligente

**Pasos**:
1. Ir a /actual en Vista Consolidada
2. Expandir categoría "Ingresos"
3. Verificar:
   - "Sueldo líquido" (delta +101.910) → verde
   - "Bono MIP" (delta -11.600.000) → rojo

4. Expandir categoría "Servicios Básicos"
5. Verificar:
   - "Luz" (delta +14.705) → rojo (gasto mayor)
   - "Agua" (delta -1.992) → verde (gasto menor)

### 2. Verificar Columna % ING

**Pasos**:
1. Verificar que columna "% ING" existe en header
2. En categoría "Ingresos": Verificar que muestra "—"
3. En categoría "Servicios Básicos":
   - Actual: 768.886
   - Total Ingresos: 3.551.910
   - % ING esperado: (768.886 / 3.551.910) * 100 = 21,7%
   - Verificar formato con coma: "21,7%"

### 3. Verificar Totalizador de Gastos

**Pasos**:
1. Scroll hasta final de tabla
2. Verificar que última fila dice "TOTAL GASTOS"
3. Verificar que:
   - Presupuesto es suma de todas las categorías excepto Ingresos
   - Actual es suma de todos los gastos
   - Delta tiene color según getDeltaClass (false = gastos)
   - % Ejec se calcula correctamente
   - % ING se muestra y es coherente

**Con datos ejemplo**:
- Total Gastos Actual: 3.150.309
- Total Ingresos: 3.551.910
- % ING esperado: 88,7%

### 4. Verificar Limpieza Visual

**Pasos**:
1. Verificar que NO hay fondos amarillos ni rojos
2. Verificar que group-row tiene fondo gris uniforme (sin gradiente)
3. Verificar que hover es discreto
4. Verificar que sub-row tiene fondo blanco

### 5. Verificar Formato Numérico

**Pasos**:
1. Verificar que todos los porcentajes usan coma: "23,6%" no "23.6%"
2. Verificar que montos usan separador de miles: "3.551.910"

---

## 🎯 Casos Edge

### 1. Total Ingresos = 0

**Escenario**: Mes sin ingresos registrados

**Comportamiento**:
- Columna "% ING" muestra "—" en todas las filas
- No hay división por cero

**Verificación**:
```tsx
if (summary.totalIngresos === 0) return '—';
```

### 2. Presupuesto = 0 en Categoría

**Escenario**: Categoría PAGO_TC con budget 0

**Comportamiento**:
- % Ejec muestra "—"
- Delta sigue mostrando valor con color
- % ING se calcula normalmente (es gasto)

**Verificación**:
```tsx
const totalExpensesPctExec = totalExpensesBudget > 0 
  ? (totalExpensesActual / totalExpensesBudget) * 100 
  : null;
```

### 3. Delta = 0

**Escenario**: Monto actual igual a presupuesto

**Comportamiento**:
- Clase `delta--neutral` aplicada
- Color gris (#6b7280)

**Ejemplo**: "Gastos Comunes" (50.000 presupuesto, 50.000 actual)

---

## 📐 Fórmulas Utilizadas

### Delta
```
Delta = Actual - Presupuesto
```

### % Ejecución
```
% Ejec = (Actual / Presupuesto) × 100
```
*Si Presupuesto = 0 → "—"*

### % ING
```
% ING = (Actual / TotalIngresos) × 100
```
*Solo para gastos; si TotalIngresos = 0 → "—"*

### Total Gastos - Presupuesto
```
Σ (budgetClp de categorías ≠ INGRESOS)
```

### Total Gastos - Actual
```
Σ (actualClp de categorías ≠ INGRESOS)
```

### Total Gastos - Delta
```
Total Gastos Actual - Total Gastos Presupuesto
```

### Total Gastos - % Ejec
```
(Total Gastos Actual / Total Gastos Presupuesto) × 100
```

### Total Gastos - % ING
```
(Total Gastos Actual / Total Ingresos) × 100
```

---

## 🔐 Restricciones Cumplidas

- ✅ No se modificó backend
- ✅ No se cambió shape de summary
- ✅ Vista por categoría no fue tocada
- ✅ No se agregaron dependencias nuevas
- ✅ Tipado TypeScript estricto mantenido
- ✅ No se usa `any`
- ✅ No se introdujo estado global nuevo
- ✅ Edición inline preservada (usa ActualEditableCell)
- ✅ onEntryUpdated() sigue funcionando igual

---

## 📊 Comparación: Antes vs Después

### Antes
- ❌ Sin métricas de % sobre ingresos
- ❌ Sin totalizador de gastos
- ❌ Fondos amarillos/rojos distractores
- ❌ Delta sin semántica de color
- ❌ Porcentajes con punto decimal

### Después
- ✅ Columna % ING para análisis de carga financiera
- ✅ Fila TOTAL GASTOS con todas las métricas
- ✅ Solo escala de grises en fondos
- ✅ Delta con color inteligente (bueno/malo)
- ✅ Porcentajes con formato regional (coma)
- ✅ Totalizador permite ver panorama completo

---

## 🎬 Flujo de Datos: Cálculo de % ING

```
Usuario carga mes Marzo 2026
  ↓
Backend retorna summary
  - totalIngresos: 3.551.910
  - categories: [...]
  ↓
Componente renderiza cada categoría
  ↓
Para "Servicios Básicos" (actualClp: 768.886)
  ↓
formatPctIncome(768.886)
  ↓
summary.totalIngresos > 0? → SÍ
  ↓
pct = (768.886 / 3.551.910) * 100 = 21.652...
  ↓
pct.toFixed(1) = "21.7"
  ↓
.replace('.', ',') = "21,7"
  ↓
+ '%' = "21,7%"
  ↓
Renderiza en celda con clase .percent-income
```

---

## 💡 Interpretación de Métricas

### % ING

**Rango saludable**: < 100%  
**Rango ajustado**: 80-95%  
**Rango crítico**: > 100% (gastos > ingresos)

**Ejemplo**:
- Total Gastos: 88,7% → Saludable (quedan 11,3% disponibles)
- Servicios Básicos: 21,7% → Razonable
- Supermercado: 33,3% → Alto pero manejable

### TOTAL GASTOS

**Uso**:
- Comparar rápidamente presupuesto vs actual total
- Ver % ejecución consolidado de gastos
- Analizar carga financiera sobre ingresos

**Decisiones basadas en métricas**:
- Si % ING total > 95% → Buscar reducción de gastos
- Si % Ejec total < 80% → Gastos bajo control
- Si % Ejec total > 110% → Revisar categorías con sobregasto

---

## 🚀 Próximos Pasos (Fuera de Scope)

**NO implementados, pero podrían agregarse**:

1. **Gráfico de % ING**: Chart.js mostrando distribución de gastos
2. **Alertas de % ING**: Warning si categoría > 30% de ingresos
3. **Comparación Mes Anterior**: Columna adicional con % ING del mes previo
4. **Export Excel**: Descargar tabla consolidada con formato
5. **Filtros**: Ocultar categorías con actual = 0

---

**Fin del Documento**
