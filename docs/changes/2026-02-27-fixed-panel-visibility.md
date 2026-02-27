# Fix: Panel de Pagos Siempre Visible

**Fecha:** 2026-02-27
**Objetivo:** Hacer que el `MonthlyPaymentPanel` sea parte permanente del layout en la vista `ActualTenpo`, eliminando su dependencia de la selección de cuotas.

## 📄 Archivos Modificados

### 1. `client/src/pages/ActualTenpo.tsx`
*   **Layout Grid:** Se cambió `gridTemplateColumns` para ser siempre `minmax(0, 1fr) 350px`.
*   **Eliminación de Condicionales:** Se eliminó la lógica `paymentPanelVisible ? ... : ...` y la variable de estado `paymentPanelVisible` ya no controla el renderizado (aunque aún puede existir, no afecta la UI).
*   **Prop `onCancel`:** Se pasa una función vacía (`() => {}`) ya que el concepto de "Cancelar/Cerrar panel" deja de existir.

## ✅ Estado Final
*   El panel aparece siempre a la derecha.
*   Si no hay selección, muestra el Total Pagado, Historial y Formulario Manual.
*   Si hay selección, aparece adicionalmente el bloque "Pagar Selección Actual".
*   El diseño es `sticky` para acompañar el scroll.
