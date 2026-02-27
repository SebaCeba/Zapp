# Refactor MonthlyPaymentPanel: Gestor de Pagos Tenpo

**Fecha:** 2026-02-27
**Objetivo:** Transformar el panel de pagos mensual (`MonthlyPaymentPanel`) de un simple confirmador de selección a un gestor completo de pagos (historial, manual, y selección) para la tarjeta Tenpo.

## 📄 Archivos Modificados

### 1. `client/src/api/actualApi.ts`
Se actualizó la capa de API para soportar operaciones CRUD sobre las entradas de "Actual".

*   **Eliminado:** `upsertActualEntry` (PUT).
*   **Agregado `fetchActualEntries`:** GET `/api/actual/entries?year=Y&month=M&category=PAGO_TC`. Devuelve la lista de pagos existentes.
*   **Agregado `createActualEntry`:** POST `/api/actual/entry`. Crea un nuevo pago.
*   **Agregado `deleteActualEntry`:** DELETE `/api/actual/entry/:id`. Elimina un pago específico.

### 2. `client/src/components/actual/MonthlyPaymentPanel.tsx`
Reescritura completa del componente para manejar el estado de los pagos localmente.

*   **Hook de Carga:** Uso de `useEffect` para cargar la lista de pagos (`fetchActualEntries`) cada vez que cambia el año/mes.
*   **Visualización de Total:** Se calcula dinámicamente la suma de `amountClp` de todos los pagos listados y se muestra destacado al inicio.
*   **Tabla de Historial:**
    *   Implementada con `rsuite/Table`.
    *   Columnas: Fecha (formateada), Descripción, Monto (CLP), Acciones.
    *   Botón de eliminar con confirmación.
*   **Formulario de Ingreso Manual:**
    *   Inputs para Descripción y Monto.
    *   Genera un `itemKey` único: `TENPO_PAY_${crypto.randomUUID()}`.
    *   Refresca la lista y el total automáticamente al guardar.
*   **Integración Legacy (Selección de Cuotas):**
    *   La lógica para pagar el monto total de las cuotas seleccionadas en la tabla principal se movió al final del panel.
    *   Permite editar el "Monto Real a Pagar" antes de confirmar.

### 3. `client/src/pages/ActualTenpo.tsx`
*   El panel ahora es **siempre visible** como una barra lateral derecha (sticky), eliminando la lógica condicional que lo ocultaba si no había selección.

## ✅ Estado Final
*   El usuario puede ver cuánto ha pagado en total en el mes seleccionado.
*   El usuario puede ver el desglose de pagos individuales (historial).
*   El usuario puede corregir errores eliminando pagos individuales.
*   El usuario puede registrar abonos manuales sin seleccionar cuotas.
*   El flujo original de "Pagar cuotas seleccionadas" sigue disponible.
