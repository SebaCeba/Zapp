# Modelo de Datos para Gráfico de Barras (Actual Tenpo)

Este documento define la lógica de transformación de datos para visualizar la composición de gastos por categoría en un gráfico de barras verticales.

## 1. Lógica de Identificación de Cuotas

Para asegurar la consistencia entre el gráfico y la tabla, se debe replicar la lógica exacta de filtrado de cuotas que ya existe en `ActualTenpoTable`.

*   **Entidad Base:** `Purchase` (Compra)
*   **Entidad Hoja:** `Installment` (Cuota)
*   **Criterio de Match:**
    *   Una cuota pertenece al mes seleccionado si su `dueDate` (convertido a objeto Date) coincide en `year` y `month` con la selección del usuario.
    *   **Importante:** `month` en la UI suele ser 1-12, mientras quue `Date.getMonth()` es 0-11. La lógica existente ajusta esto con `getMonth() + 1 === month`.

## 2. Pseudocódigo

```text
FUNCION getCategoryBarData(purchases, selectedYear, selectedMonth):
  
  MAPA_AGREGACION = {}  // Clave: nombre_categoria, Valor: { total, color }

  PARA CADA compra EN purchases:
    
    // 1. Filtrar cuotas del mes
    cuotas_del_mes = compra.installments FILTRAR DONDE:
       fecha = NEW DATE(cuota.dueDate)
       fecha.YEAR == selectedYear Y (fecha.MONTH + 1) == selectedMonth

    // 2. Sumar monto del mes
    total_compra_mes = SUMAR(c.finalMonthlyAmountClp PARA c EN cuotas_del_mes)

    SI total_compra_mes == 0:
       CONTINUAR (Saltar a siguiente compra)

    // 3. Resolver Categoría
    nombre_cat = compra.category ? compra.category.name : "Sin Categoría"
    color_cat = compra.category ? compra.category.color : "#9ca3af" // Gris por defecto

    // 4. Agregar al acumulador
    SI existe MAPA_AGREGACION[nombre_cat]:
       MAPA_AGREGACION[nombre_cat].total += total_compra_mes
    SINO:
       MAPA_AGREGACION[nombre_cat] = { total: total_compra_mes, color: color_cat }

  // 5. Convertir a Array y Ordenar
  RESULTADO = CONVERTIR_MAPA_A_ARRAY(MAPA_AGREGACION)
  
  ORDENAR RESULTADO DESCENDENTE POR total

  RETORNAR RESULTADO
```

## 3. Firma TypeScript

```typescript
export interface CategoryBarData {
  name: string;
  total: number; // Monto en CLP
  color: string;
}

export const aggregatePurchasesByCategory = (
  purchases: Purchase[],
  selectedYear: number,
  selectedMonth: number
): CategoryBarData[] => {
  // Implementación...
}
```

## 4. Ejemplo Simplificado (Input)

**Contexto:** Año 2026, Mes 2 (Febrero)

```javascript
/* Input */
const purchases = [
  {
    merchant: "Uber Eats",
    category: { name: "Comida", color: "#FF5733" },
    installments: [
      { dueDate: "2026-02-15", finalMonthlyAmountClp: 15000 }, // Match
      { dueDate: "2026-03-15", finalMonthlyAmountClp: 15000 }  // No match
    ]
  },
  {
    merchant: "Lider",
    category: { name: "Supermercado", color: "#33FF57" },
    installments: [
      { dueDate: "2026-02-05", finalMonthlyAmountClp: 50000 } // Match
    ]
  },
  {
    merchant: "Spotify",
    category: null, // Sin categoría
    installments: [
      { dueDate: "2026-02-28", finalMonthlyAmountClp: 4500 } // Match
    ]
  },
  {
    merchant: "Compra Antigua",
    category: { name: "Tecnología", color: "#3357FF" },
    installments: [
      { dueDate: "2025-12-01", finalMonthlyAmountClp: 100000 } // No match
    ]
  }
];
```

## 5. Ejemplo Output

```javascript
/* Output esperado */
[
  { name: "Supermercado", total: 50000, color: "#33FF57" },
  { name: "Comida", total: 15000, color: "#FF5733" },
  { name: "Sin Categoría", total: 4500, color: "#9ca3af" }
]
```

*Nota: "Tecnología" no aparece porque su total en Febrero 2026 es 0.*

## 6. Manejo de Edge Cases

*   **Compras sin cuotas en el mes:**
    *   La suma de `monthInstallments` será 0.
    *   Se ignoran en el paso de agregación (no se suman al mapa).
    *   Resultado: La categoría no aparece, o no incrementa su valor.
*   **Category es `null` o `undefined`:**
    *   Se agrupa bajo la key `"Sin Categoría"`.
    *   Se asigna un color gris neutro (`#9ca3af`) o el que defina el sistema de diseño.
*   **Color es `null`:**
    *   Si la categoría existe pero no tiene color, usar color fallback (mismo gris o uno generado).
*   **Múltiples cuotas en el mismo mes:**
    *   Aunque es raro en modelos de cuotas mensuales standard, si hubiese más de una `installments` con fecha en el mismo mes, el `.reduce` las suma correctamente.
*   **Mes sin datos:**
    *   Retorna array vacío `[]`.
    *   El gráfico debe manejar esto mostrando un estado vacío o no renderizándose.

## 7. Performance

*   Esta transformación debe envolverse en un `useMemo` dentro del componente React.
*   Dependencias: `[purchases, selectedYear, selectedMonth]`.
*   Complejidad: O(N*M) donde N = compras y M = cuotas promedio (bajo, ~1-24). Para < 1000 compras, el cálculo es despreciable (< 1ms).

## 8. Justificación UX: Barras Verticales vs Donut

Para este caso de uso ("Composición de gastos por categoría"), las **Barras Verticales** son superiores al Donut/Pie chart por las siguientes razones:

1.  **Comparación Precisa:** El ojo humano compara longitudes (barras) mucho mejor que ángulos o áreas (donut). Es más fácil ver qué categoría gastó más entre dos valores cercanos.
2.  **Etiquetas Legibles:** Un gráfico de barras permite poner las etiquetas (nombres de categorías) en el eje X (o rotados) o en tooltip, sin el problema de solapamiento que ocurre en los Donuts cuando hay "rebanadas" pequeñas.
3.  **Manejo de "Muchos Pocos":** Si hay 10 categorías pequeñas ("Long tail"), en un Donut se vuelven invisibles o ilegibles. En barras, simplemente son barras cortas pero visibles y comparables.
4.  **Escalabilidad:** Si el usuario llega a tener 15 categorías, un Donut es ininteligible. Un gráfico de barras puede tener scroll horizontal o simplemente mostrar más barras sin perder sentido.
5.  **Cero es Cero:** Las barras parten de un eje cero claro, dando una representación honesta de la magnitud del gasto.
