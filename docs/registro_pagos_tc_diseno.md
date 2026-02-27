# Diseño Técnico: Registro de Pagos TC Múltiples

## 📅 Fecha
27 de Febrero de 2026

## 🎯 Objetivo
Habilitar el registro de múltiples pagos parciales o manuales para la Tarjeta de Crédito (Tenpo) en un mismo mes, permitiendo listar, editar y eliminar cada transacción individualmente, reflejando la suma total en el prespuesto "Actual vs Presupuesto".

---

## 📂 Archivos Relevantes

### Backend
- `node-version/src/routes/actual.ts`: Endpoints actuales `GET /summary`, `POST /entry`. Lógica de consolidación.
- `node-version/prisma/schema.prisma`: Modelo `ActualEntry`.

### Frontend
- `node-version/client/src/components/actual/MonthlyPaymentPanel.tsx`: UI actual de pago único.
- `node-version/client/src/pages/ActualTenpo.tsx`: Vista principal que orquesta el panel.
- `node-version/client/src/api/actualApi.ts`: Cliente HTTP para endpoints de presupuesto.

---

## 🔍 Diagnóstico del Estado Actual

### Limitación Principal: Un Pago por Mes
Actualmente, el sistema asume un modelo de **"Pago Consolidado Único"**.
- **Frontend**: Genera un `itemKey` fijo: `TENPO_{year}_{month}`.
- **Backend**: El endpoint `POST /api/actual/entry` utiliza `upsert` basado en `(year, month, category, itemKey)`.

**Consecuencia**: Si el usuario registra un segundo pago en el mismo mes, **sobrescribe** el anterior en lugar de sumarse. No existe historial de pagos parciales.

---

## 🛠️ Diseño Propuesto

### 1. Modelo de Datos (`ActualEntry`)
No se requieren cambios de esquema en base de datos. Se aprovechará el campo `itemKey` para diferenciar pagos.

- **Category**: `PAGO_TC` (Invariable)
- **ItemKey**: Formato dinámico `TENPO_PAY_{uuid}` o `TENPO_PAY_{timestamp}`.
  - *Antes*: `TENPO_2026_03` (Fijo por mes)
  - *Propuesta*: `TENPO_PAY_550e8400-e29b-41d4-a716-446655440000` (Único por transacción)
- **Label**: Descripción del pago (ej: "Abono 1", "Pago total").

### 2. Endpoints Backend (`src/routes/actual.ts`)

#### A. Listar Pagos del Mes (`GET`)
Necesario para mostrar la tabla de historial en el panel lateral.
- **Ruta**: `GET /api/actual/entries`
- **Query Params**: `year`, `month`, `category=PAGO_TC`
- **Output**: Array de `ActualEntry`.

#### B. Crear/Editar Pago (`POST` existente)
- **Ruta**: `POST /api/actual/entry`
- **Cambio**: El frontend debe generar un UUID para `itemKey` en cada nuevo pago.
- **Validación**: Permitir `upsert` normal. Si el `itemKey` existe, actualiza; si no, crea.

#### C. Eliminar Pago (`DELETE`)
Actualmente existe `DELETE /api/actual/entry/:id`. Se debe asegurar que esté expuesto y funcional para eliminar pagos erróneos.

#### D. Consolidación en Resumen (`GET /summary`)
La lógica actual de `summary` ya soporta múltiples entradas para una categoría sin presupuesto (`PAGO_TC`).
- **Comportamiento Actual**: Itera sobre `actualEntries`.
- **Resultado**: Sumará automáticamente todos los registros con `category === 'PAGO_TC'`, mostrando el total acumulado en la columna "Actual".
- **Visualización**: En el desglose del resumen, aparecerán múltiples filas bajo "Pago Tarjeta de Crédito", una por cada pago realizado. Esto es aceptable y deseable.

### 3. Interfaz de Usuario (Frontend)

El `MonthlyPaymentPanel` dejará de ser solo un "confirmador" para convertirse en un **Gestor de Pagos**.

#### Componentes Nuevos/Modificados:
1.  **Header**: Total Deuda del Mes vs Total Pagado (Suma de pagos).
2.  **Lista de Pagos (Tabla RSuite)**:
    - Columnas: Fecha, Descripción, Monto, Acciones (Editar/Borrar).
    - Data source: `GET /api/actual/entries?category=PAGO_TC...`
3.  **Formulario de Pago**:
    - Inputs: Monto, Fecha, Descripción.
    - Botón "Agregar Pago": Genera UUID y llama a `POST`.
4.  **Lógica**: Al guardar/borrar, recargar la lista de pagos y actualizar el "Total Pagado".

---

## 🚀 Plan de Implementación

### Fase 1: Backend
1. Verificar que `GET /api/actual/entries` soporte filtrado por categoría, año y mes.
2. Verificar que `DELETE /api/actual/entry/:id` funcione correctamente.
3. Asegurar que `GET /summary` agrupe visualmente o sume correctamente múltiples líneas de `PAGO_TC`.

### Fase 2: Frontend (API & Hooks)
1. Actualizar `actualApi.ts` con métodos `fetchActualEntries` y `deleteActualEntry`.
2. Crear hook `useTenpoPayments(year, month)` para encapsular la carga y cálculo del total pagado.

### Fase 3: Frontend (UI)
1. Refactorizar `MonthlyPaymentPanel.tsx`:
   - Eliminar lógica de "Pago Único".
   - Integrar tabla de historial.
   - Implementar formulario de nuevo pago.
   - Calcular saldo pendiente (Deuda Total - Suma Pagos).

---

## ⚠️ Riesgos y Decisiones

1.  **Migración de Datos**: El registro antiguo (`TENPO_{year}_{month}`) coexistirá con los nuevos. El sistema los sumará correctamente. Se recomienda que el frontend permita editar/eliminar también este registro legado.
2.  **Idempotencia**: Al usar UUIDs en el frontend, se evitan duplicados si el usuario presiona "Guardar" dos veces (siempre que se mantenga el mismo UUID para esa sesión de edición).
3.  **Visualización en Resumen**: Si hay 10 pagos parciales, el resumen mostrará 10 líneas.
    - *Decisión*: Aceptable por ahora. Futura mejora: Agrupar visualmente en el endpoint `summary` si se desea menos ruido.
