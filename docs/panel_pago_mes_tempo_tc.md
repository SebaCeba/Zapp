# Diseño Arquitectónico: Panel de Pago del Mes (Tenpo TC) - Rediseño v2

Este documento define la arquitectura para implementar el flujo de "Pago del Mes", permitiendo conciliar y registrar el pago de la facturación de la tarjeta de crédito seleccionando las cuotas correspondientes y gestionando el impacto financiero real.

## 1. Modelo de Datos Financiero

Se requiere una entidad robusta que no solo marque cuotas como "checadas", sino que registre el movimiento financiero real (egreso de caja).

### Nueva Entidad: `MonthlyBillPayment`

```typescript
type PaymentStatus = 'DRAFT' | 'PARTIAL' | 'PAID' | 'OVERPAID';

interface MonthlyBillPayment {
  id: string; // UUID
  year: number;
  month: number;
  status: PaymentStatus;
  
  // Financiero
  totalBillAmount: number;      // Suma teórica de las cuotas seleccionadas
  actualPaidAmount: number;     // Monto real que salió de la cuenta (editable)
  differenceAmount: number;     // actualPaidAmount - totalBillAmount
  
  // Relación con cuotas conciliadas
  reconciledInstallmentIds: number[]; // IDs de las cuotas cubiertas por este pago
  
  // Auditoría
  paymentDate: string;         // Fecha de transacción
  notes?: string;
  sourceAccount?: string;      // (Futuro) Cuenta de origen (ej. Cuenta Rut, Tenpo Saldo)
  createdAt: string;
  updatedAt: string;
}
```

## 2. Flujo Financiero Completo

El objetivo no es solo "tachar" cuotas, sino generar un registro de gasto que se refleje en el módulo de "Actual vs Presupuesto".

1.  **Selección:** Usuario selecciona las cuotas en la tabla (Total Seleccionado: $150.000).
2.  **Ajuste:** Usuario confirma el total, pero puede ajustar el monto real pagado (ej. pagó $155.000 por intereses de mora o $100.000 parcial).
3.  **Registro:** Al confirmar:
    *   Se crea el `MonthlyBillPayment`.
    *   (Futuro) Se genera una transacción de egreso en el módulo de Cuentas/Presupuesto.
4.  **Conciliación:** Las cuotas seleccionadas quedan marcadas como "Conciliadas" para ese mes.

## 3. Firma TypeScript Propuesta (Hook)

```typescript
interface UseMonthlyPaymentReturn {
  // Estado
  billPayment: MonthlyBillPayment | null;
  reconciledIds: Set<number>;
  
  // Formulario
  draftAmount: number; // Monto editable por el usuario
  setDraftAmount: (amount: number) => void;
  
  // Acciones
  toggleInstallment: (id: number) => void;
  selectAll: () => void;
  savePayment: () => Promise<void>;
  resetPayment: () => void;
  
  // Cálculos derivados
  selectionTotal: number;       // Suma de installmenmts checkeados
  paymentDifference: number;    // draftAmount - selectionTotal
}
```

## 4. Impacto en Módulo Actual (Vista General)

Este pago mensual de la TC es, en sí mismo, un "Gasto Real" que debe aparecer en el flujo de caja global del usuario.

*   **Antes:** Tenpo TC era una "caja negra" de muchas cuotas futuras.
*   **Ahora:** Al cerrar el mes, se transforma en 1 (o N) registros de egreso consolidados.
*   **Visualización:** En la vista de "Presupuesto Mensual", debe aparecer una línea "Pago Tenpo TC" con el `actualPaidAmount` registrado aquí.

## 5. UI: Panel de Pago (Sidebar)

**Componentes:**
1.  **Header:** "Pago Facturación {Mes} {Año}".
2.  **Lista Resumen:** "X cuotas seleccionadas".
3.  **Montos:**
    *   `Total a Pagar (Sugerido)`: Suma de selección (Readonly).
    *   `Monto Real Pagado`: Input numérico (Default = Sugerido).
    *   `Diferencia`: Indicador visual (Verde=0, Rojo=Deuda, Azul=Pago extra).
4.  **Acciones:** Botón "Registrar Pago" (Primary), "Cancelar" (Subtle).

## 6. Edge Cases Financieros

1.  **Pago Parcial (Underpayment):**
    *   Usuario selecciona cuotas por $100k pero paga $50k.
    *   Sistema alerta: "Estás pagando menos del total seleccionado".
    *   Se permite guardar, pero el `MonthlyBillPayment` queda con estado `PARTIAL`.
    *   Las cuotas *no* se marcan como 100% pagadas, o se requiere lógica de "remanente" (complejo para MVP). 
    *   *Simplificación MVP:* Si usuario paga menos, debe deseleccionar cuotas manualmente hasta que coincida con su capacidad de pago, o asumir que la diferencia queda como deuda "flotante" no asignada a cuotas específicas.

2.  **Pago Extra (Overpayment):**
    *   Usuario paga $110k por deuda de $100k (intereses, castigos, o error).
    *   Se registra la diferencia positiva.
    *   Las cuotas seleccionadas quedan 100% pagadas.

3.  **Re-pago (Pago en cuotas dentro del mes):**
    *   Usuario hace 2 pagos en el mes (quincena y fin de mes).
    *   El modelo `MonthlyBillPayment` debe permitir múltiples instancias para un mismo mes, o un solo objeto con array de `transactions`.
    *   *Simplificación MVP:* Solo 1 pago por mes. Si paga de nuevo, edita el monto y agrega más cuotas a la selección.

## 7. Recomendación de Persistencia Adaptativa

**Fase 1: LocalStorage (Validación UX)**
*   Key: `tenpo_payment_v2_{year}_{month}`
*   Value: JSON del objeto `MonthlyBillPayment`.
*   Al cargar la tabla, leer este objeto para "pintar" las filas ya pagadas y bloquear su selección.

**Fase 2: Backend (Integración)**
*   Tabla SQL dedicada `monthly_bill_payments`.
*   API `POST /api/tenpo/pay` que recibe el objeto y actualiza el estado.

## 8. Integración con Módulo Actual

Al confirmar un pago de TC, el sistema debe "materializar" ese pago como un gasto real en el presupuesto general.

### Generación Automática de Transacción
Cuando `MonthlyBillPayment` pasa a estado `PAID`:
1.  El sistema busca si ya existe una transacción vinculada (usando `externalId`).
2.  Si no existe, crea una nueva transacción de egreso.
3.  Si existe, la actualiza con el nuevo monto/fecha.

### Contrato de Transacción (Campos Mínimos)

La transacción creada en el módulo "Actual" debe tener:

```typescript
interface ActualTransaction {
  id: string;              // UUID propio
  date: string;            // Fecha del pago (paymentDate)
  amount: number;          // Monto real pagado (actualPaidAmount)
  description: string;     // "Pago Tenpo TC - {Mes}/{Año}"
  category: string;        // "Pago Tarjeta de Crédito" (Categoría especial o 'Deuda')
  account: string;         // Cuenta de origen (ej. 'Cuenta Rut')
  type: 'EXPENSE';
  
  // Link para evitar duplicados
  externalId: string;      // ID del MonthlyBillPayment (monthly_bill_payment:{uuid})
  isAutoGenerated: boolean; // true
}
```

### Prevención de Duplicados
*   **Clave de Idempotencia:** El campo `externalId` es la clave.
*   Antes de crear, siempre consultar: `findTransactionByExternalId('monthly_bill_payment:' + paymentId)`.

### Manejo de Edición
Si el usuario edita el `MonthlyBillPayment` (cambia el monto de 100k a 105k):
1.  Se busca la transacción vinculada por `externalId`.
2.  Se actualiza su `amount` y `date`.
3.  Se mantiene el resto de los campos manuales si el usuario los hubiese editado en el otro módulo (a menos que se fuerce la sincronización).

### Manejo de Eliminación
Si el usuario elimina o anula el pago de la TC (`DRAFT`):
1.  Se busca la transacción vinculada.
2.  Se elimina físicamente o se marca como anulada (`deletedAt`), para que desaparezca del flujo de caja.

---
**Plan de Acción Inmediato:**
Implementar el Panel Lateral con estado local y persistencia en LocalStorage para validar el flujo "Seleccionar -> Ajustar Monto -> Confirmar".