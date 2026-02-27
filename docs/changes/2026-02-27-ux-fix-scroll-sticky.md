# Fix UX: MonthlyPaymentPanel

**Fecha:** 2026-02-27
**Objetivo:** Mejorar la experiencia de usuario (UX) del panel de pagos, haciéndolo siempre visible y evitando scrolls verticales anidados molestos.

## 📄 Archivos Modificados

### 1. `client/src/pages/ActualTenpo.tsx`
*   **Contenedor Sticky:** Se configura el contenedor del panel con `position: sticky`, `top: 20px`, y `height: calc(100vh - 40px)`. Esto asegura que el panel ocupe exactamente la altura visible de la pantalla (menos márgenes) y no se desplace con el contenido principal.

### 2. `client/src/components/actual/MonthlyPaymentPanel.tsx`
*   **Estructura Flex:** Se cambia la estructura interna del panel a un `flex-direction: column`.
*   **Overflow Controlado:**
    *   El contenedor principal del panel tiene `overflow: hidden` para evitar scrollbar en todo el componente.
    *   **Secciones Fijas:** Header, Total Pagado, Selección Actual y Agregar Manual tienen tamaño fijo (`flex-shrink: 0`).
    *   **Sección Scrollable:** La tabla de Historial tiene `flex: 1` y `overflow-y: auto`. Esto significa que si la lista de pagos crece, solo esa parte del panel tendrá scrollbar, mientras que los controles de agregar pago y el resumen total permanecen visibles y fijos.
*   **Mejora Visual:**
    *   Se compactaron los inputs y botones (usando `size="sm"`).
    *   Se eliminaron márgenes excesivos.
    *   La sección "Selección Actual" ahora está siempre visible, mostrando un estado deshabilitado si no hay selección, sirviendo como guía de uso.

## ✅ Estado Final
*   El panel acompaña al usuario mientras hace scroll en la tabla de cuotas.
*   Nunca aparece doble scrollbar en la página principal.
*   El usuario siempre tiene a la vista:
    1.  Cuánto ha pagado en total.
    2.  La opción de pagar lo que seleccione.
    3.  La opción de agregar un pago manual.
    4.  El historial (con su propio scroll si es muy largo).
