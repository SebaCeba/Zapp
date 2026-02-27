# Auditoría Consolidado PAGO_TC

## 📅 Fecha: 27 de Febrero de 2026

## 🔍 Análisis Técnico del Servicio de Consolidación

Se revisó el flujo de datos en `consolidado.ts` y `src/routes/actual.ts` para determinar por qué las transacciones de tarjeta de crédito podrían no aparecer o sumarse incorrectamente.

### 1. Suma de ActualEntry por Categoría
- **Hallazgo**: La suma no ocurre en `consolidado.ts`. Este archivo solo provee la estructura base del presupuesto (`getMonthlyBudget`).
- **Ubicación**: La fusión y suma ocurre en **`src/routes/actual.ts`** (endpoint `GET /summary`).
- **Mecanismo**: El backend itera sobre las categorías válidas, obtiene las líneas de presupuesto y luego busca coincidencias en `ActualEntry`. Finalmente, agrega cualquier `ActualEntry` que no tenga correspondencia en el presupuesto.

### 2. Condición de Descarte de ActualEntry
- **Hallazgo**: Un registro se descarta si su campo `category` en la base de datos no coincide **exactamente** con el string definido en `VALID_CATEGORIES`.
- **Código Crítico**:
  ```typescript
  // src/routes/actual.ts
  actualEntries.filter(e => e.category === categoryName && !processedKeys.has(e.itemKey))
  ```

### 3. Requisito de ItemKey Previo
- **Hallazgo**: **NO** se requiere que el `itemKey` exista previamente en el presupuesto.
- **Lógica**: El código maneja explícitamente "líneas adicionales" (como `AJUSTES` o `PAGO_TC`) que solo existen en la realidad y no en la planificación.

### 4. Categorías con Presupuesto 0
- **Hallazgo**: **NO** se ignoran.
- **Lógica**: Si el array de líneas de presupuesto para `PAGO_TC` está vacío, el bucle de presupuesto se salta, pero el bucle de `ActualEntry` (mencionado en el punto 2) se ejecuta igual, añadiendo las transacciones reales.

### 5. Suma de amountClp para Gastos
- **Hallazgo**: Correcto.
- **Lógica**: La categoría `PAGO_TC` es tratada como cualquier otra categoría de gastos (diferente a `INGRESOS`). Su `actualClp` se suma al `totalGastos` global.

---

## 🚨 Diagnóstico de Falla Potencial

### Línea Exacta de Descarte
`node-version/src/routes/actual.ts`, línea ~213:
```typescript
.filter(e => e.category === categoryName && !processedKeys.has(e.itemKey))
```

### Motivo Técnico
Existe una **discrepancia de nomenclatura** entre el frontend antiguo (o manual) y el backend:
- **Frontend (Legacy/Manual)**: Podría haber estado enviando `"Pago Tarjeta de Crédito"`.
- **Backend (Espera)**: Espera estrictamente `"PAGO_TC"`.

Al no coincidir los strings, la comparación `e.category === "PAGO_TC"` retorna `false` y la transacción desaparece del reporte.

---

## ✅ Solución Implementada

1. **Frontend (`MonthlyPaymentPanel.tsx`)**: Se corrigió el payload del `fetch` para enviar `category: 'PAGO_TC'`.
2. **Backend**: Se validó que `PAGO_TC` esté en la lista `VALID_CATEGORIES`.

### Acción Correctiva para Datos Antiguos (SQL)
Si existen registros huérfanos en la base de datos, ejecutar:
```sql
UPDATE "ActualEntry" 
SET category = 'PAGO_TC' 
WHERE category = 'Pago Tarjeta de Crédito';
```
