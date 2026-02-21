# Auditoría: Integración de Compras Manuales Tenpo en Totales Mensuales

**Fecha:** 2026-02-01  
**Scope:** Backend + Frontend + Base de Datos  
**Objetivo:** Identificar el punto de inyección para compras manuales de Tenpo en los totales mensuales del sistema Actual vs Presupuesto

---

## Resumen Ejecutivo

El sistema actual calcula totales mensuales mediante dos flujos independientes:

1. **Flujo Tenpo (automático):** Sincroniza emails de Gmail → parsea compras → genera cuotas → proyecta por mes
2. **Flujo Actual (manual):** Usuario ingresa gastos manualmente por categoría y mes

**Gap identificado:** Las compras de Tenpo NO se integran automáticamente al módulo "Actual vs Presupuesto". Ambos flujos están desconectados.

**Riesgo principal:** Duplicación de datos si el usuario ingresa manualmente lo que ya está en Tenpo, y falta de visibilidad consolidada de gastos reales.

**Recomendación:** Crear categoría "TENPO" en el sistema Actual que se alimente automáticamente desde las cuotas de TenpoInstallment agrupadas por mes de vencimiento (campo `dueDate`).

---

## Backend: Archivos y Funciones Clave

### 1. Rutas Tenpo (`node-version/src/routes/tenpo.ts`)

**Endpoints principales:**

- **POST /api/tenpo/sync**  
  Sincroniza emails de Gmail con etiquetas "Tenpo/Compras TC Tenpo" y "Tenpo/Pagos TC Tenpo"  
  - Crea registros en `TenpoEmail`, `TenpoPurchase`, `TenpoInstallment`, `TenpoPayment`
  - No interactúa con la tabla `ActualEntry`

- **GET /api/tenpo/purchases**  
  Lista todas las compras con sus cuotas calculadas  
  - Incluye campos computed para fee (feePct, feeAmountClp, financedBaseClp)
  - No agrupa por mes ni genera totales

- **GET /api/tenpo/installments?year=YYYY&month=M**  
  Lista cuotas filtradas por mes de vencimiento (`dueDate`)  
  - **Punto clave:** Este endpoint ya filtra por mes, pero solo devuelve lista sin totalizar

- **GET /api/tenpo/forecast?months=12**  
  Proyección de cuotas por mes (líneas 303-357)  
  - Calcula `totalEstimated` sumando `finalMonthlyAmountClp` de todas las cuotas con `dueDate` en el rango
  - Calcula `totalPaid` sumando `amountClp` de pagos con `payDate` en el rango
  - **Punto crítico:** Esta lógica de suma por mes es exactamente lo que se necesita para "Actual"

### 2. Rutas Actual (`node-version/src/routes/actual.ts`)

**Endpoints principales:**

- **GET /api/actual/summary?year=YYYY&month=M** (líneas 94-212)  
  - Llama a `getMonthlyBudget(year, month)` para obtener presupuesto
  - Busca en `ActualEntry` las entradas manuales del mes
  - Hace merge de presupuesto con actual
  - Calcula totales por categoría y balance global
  - **No consulta datos de Tenpo**

- **PUT /api/actual/entry** (líneas 18-85)  
  Upsert manual de una entrada (categoría + itemKey + monto)  
  - Valida categorías: `INGRESOS`, `SUSCRIPCIONES`, `OBLIGACIONES`, `HIPOTECARIO`, `SERVICIOS_BASICOS`, `SUPERMERCADO`, `AJUSTES`
  - **No existe categoría "TENPO"**

### 3. Servicio Consolidado (`node-version/src/services/consolidado.ts`)

**Función principal:**

- **getMonthlyBudget(year, month)** (líneas 27-238)  
  - Genera presupuesto mensual consolidado por categoría
  - Fuentes: Ingresos, Suscripciones, Obligaciones, Hipotecario, Servicios Básicos, Supermercado
  - Retorna objeto `MonthlyBudget` con 7 categorías
  - **No consulta TenpoPurchase ni TenpoInstallment**

### 4. Servicios Tenpo

- **tenpo-parser.service.ts**: Parseo de emails (fecha, comercio, monto, cuotas)
- **tenpo-calculator.service.ts**: Cálculo de cuotas usando método TenpoAddOnV1 (interés simple)
- **tenpo-config.service.ts**: Gestión de tasas de interés históricas
- **gmail.service.ts**: Integración con API de Gmail

---

## Prisma: Modelos Relevantes

### Modelo TenpoPurchase (líneas 103-128)
```prisma
model TenpoPurchase {
  id                        Int       @id @default(autoincrement())
  emailId                   Int
  purchaseDate              DateTime  // Fecha de compra
  merchant                  String
  amountTotalClp            Float     // Capital original
  installmentsCount         Int
  tieneInteres              Boolean   @default(true)
  modoMonto                 String    @default("ESTIMADO") // ESTIMADO | REAL
  totalFinanciadoEstimado   Float?
  interesTotalEstimado      Float?
  metadata                  String?   // JSON: { feePct, ... }
  scheduleMode              String    @default("AUTO") // AUTO | MANUAL
  firstDueDateOverride      DateTime?
  installments              TenpoInstallment[]
  email                     TenpoEmail @relation(...)
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
}
```

**Campos críticos:**
- `purchaseDate`: Fecha de compra (NO usar para agrupar por mes)
- `installmentsCount`: Número de cuotas
- `modoMonto`: ESTIMADO (calculado) vs REAL (confirmado con banco)

### Modelo TenpoInstallment (líneas 130-147)
```prisma
model TenpoInstallment {
  id                       Int           @id @default(autoincrement())
  purchaseId               Int
  installmentNumber        Int           // 1, 2, 3, ...
  baseAmountClp            Float         // Cuota base calculada
  dueDate                  DateTime      // ⚠️ Fecha de vencimiento (USAR ESTE)
  payDateEstimated         DateTime
  estado                   String        @default("ESTIMADO")
  overrideInterestRate     Float?
  overrideMonthlyAmountClp Float?
  finalMonthlyAmountClp    Float         // ⚠️ Monto final a usar
  purchase                 TenpoPurchase @relation(...)
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
}
```

**Campos críticos para totales mensuales:**
- `dueDate`: Fecha de vencimiento de la cuota → **ESTE es el campo para agrupar por mes**
- `finalMonthlyAmountClp`: Monto final de la cuota (incluye interés y overrides) → **SUMAR ESTE**

### Modelo TenpoPayment (líneas 149-163)
```prisma
model TenpoPayment {
  id              Int        @id @default(autoincrement())
  emailId         Int
  payDate         DateTime   // Fecha de pago
  amountClp       Float      // Monto pagado
  paymentMethod   String
  transactionCode String
  periodPay       String?    // Periodo de pago
  periodBill      String?    // Periodo de factura
  email           TenpoEmail @relation(...)
  createdAt       DateTime   @default(now())
}
```

**Uso:** Pagos realizados (para comparar con lo estimado), NO para calcular gastos mensuales.

### Modelo ActualEntry (líneas 281-295)
```prisma
model ActualEntry {
  id         Int      @id @default(autoincrement())
  year       Int      // Año
  month      Int      // Mes (1-12)
  category   String   // Categoría
  itemKey    String   // Identificador único dentro de categoría
  label      String?  // Nombre visible
  amountClp  Int      // Monto en CLP
  isPaid     Boolean  @default(false)
  isLocked   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([year, month, category, itemKey])
}
```

**Restricción actual:** Categorías válidas en código (línea 8-15 de actual.ts):
```typescript
const VALID_CATEGORIES = [
  'INGRESOS', 'SUSCRIPCIONES', 'OBLIGACIONES', 'HIPOTECARIO',
  'SERVICIOS_BASICOS', 'SUPERMERCADO', 'AJUSTES'
];
```

**Falta:** Categoría "TENPO" o "COMPRAS_TENPO"

---

## Frontend: Páginas y Componentes Relevantes

### 1. Página Tenpo (`node-version/client/src/pages/Tenpo.tsx`)

**Funcionalidad:**
- Muestra compras sincronizadas con Gmail
- Permite toggle de interés, ajuste de calendario, confirmación de monto real
- **NO muestra totales mensuales consolidados**, solo lista de compras individuales

**Endpoints consumidos:**
- POST /api/tenpo/sync
- GET /api/tenpo/purchases
- GET /api/tenpo/payments
- PATCH /api/tenpo/purchases/:id/interes
- POST /api/tenpo/purchases/:id/confirmar-real

### 2. Página Actual (`node-version/client/src/pages/Actual.tsx`)

**Funcionalidad (líneas 1-243):**
- Selector de año/mes
- Llama a `fetchActualSummary(year, month)` → GET /api/actual/summary
- Muestra tabla por categoría con columnas:
  - Presupuesto
  - Actual (editable)
  - Delta
  - % Ejecución
- Totales: Ingresos, Gastos, Balance
- **NO consume datos de Tenpo**

**API consumida:**
- `actualApi.ts`: `fetchActualSummary()`, `upsertActualEntry()`

### 3. Componente ActualRow (`node-version/client/src/components/actual/ActualRow.tsx`)

**Funcionalidad:**
- Render de una línea de la tabla Actual
- Input editable para monto "Actual"
- Al guardar: llama `upsertActualEntry()` → PUT /api/actual/entry

---

## Punto de Inyección Recomendado

### Opción A: Integración en getMonthlyBudget() [RECOMENDADA]

**Ubicación:** `node-version/src/services/consolidado.ts`, función `getMonthlyBudget()`

**Lógica a agregar (después de línea 219, antes del return):**

```typescript
// 8. TENPO (cuotas de compras con TC)
const tenpoLines: MonthlyBudgetLine[] = [];

const tenpoInstallments = await prisma.tenpoInstallment.findMany({
  where: {
    dueDate: {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1)
    }
  },
  include: {
    purchase: true
  }
});

// Agrupar por compra (opcional) o sumar todo en una línea
const totalTenpo = tenpoInstallments.reduce((sum, inst) => sum + inst.finalMonthlyAmountClp, 0);

if (totalTenpo > 0) {
  tenpoLines.push({
    itemKey: 'tenpo:cuotas',
    label: 'Cuotas Tenpo TC',
    amountClp: Math.round(totalTenpo)
  });
}

// Agregar al return
return {
  INGRESOS: ingresosLines,
  SUSCRIPCIONES: suscripcionesLines,
  OBLIGACIONES: obligacionesLines,
  HIPOTECARIO: hipotecarioLines,
  SERVICIOS_BASICOS: serviciosLines,
  SUPERMERCADO: supermercadoLines,
  TENPO: tenpoLines,  // ⬅️ NUEVO
  AJUSTES: ajustesLines
};
```

**Actualizar interface MonthlyBudget (líneas 10-18):**
```typescript
interface MonthlyBudget {
  INGRESOS: MonthlyBudgetLine[];
  SUSCRIPCIONES: MonthlyBudgetLine[];
  OBLIGACIONES: MonthlyBudgetLine[];
  HIPOTECARIO: MonthlyBudgetLine[];
  SERVICIOS_BASICOS: MonthlyBudgetLine[];
  SUPERMERCADO: MonthlyBudgetLine[];
  TENPO: MonthlyBudgetLine[];  // ⬅️ NUEVO
  AJUSTES: MonthlyBudgetLine[];
}
```

**Actualizar VALID_CATEGORIES en actual.ts (líneas 8-15):**
```typescript
const VALID_CATEGORIES = [
  'INGRESOS',
  'SUSCRIPCIONES',
  'OBLIGACIONES',
  'HIPOTECARIO',
  'SERVICIOS_BASICOS',
  'SUPERMERCADO',
  'TENPO',  // ⬅️ NUEVO
  'AJUSTES'
];
```

**Ventajas:**
- Integración transparente en el flujo existente
- Aparece automáticamente en página "Actual vs Presupuesto"
- Mantiene separación de responsabilidades
- Usuario puede override manual si es necesario (editando en Actual)

**Desventajas:**
- Requiere agregar categoría TENPO al enum ActualCategory en frontend
- Riesgo de duplicación si usuario ingresa manualmente lo mismo

### Opción B: Endpoint híbrido en actual.ts

Crear nuevo endpoint `/api/actual/summary-with-tenpo` que:
1. Llama a `getMonthlyBudget()`
2. Consulta `TenpoInstallment` por mes
3. Agrega categoría TENPO dinámicamente al response

**Ventaja:** No modifica función consolidado.ts  
**Desventaja:** Duplicación de lógica, más complejo mantener

---

## Riesgos Identificados

### 1. Duplicación de Datos
**Problema:** Si usuario ingresa manualmente en Actual lo que ya está en Tenpo  
**Mitigación:** 
- Mensaje de advertencia en UI de Actual si categoría TENPO tiene datos automáticos
- Lock parcial: permitir solo override manual si usuario confirma

### 2. Timezone y Fecha de Vencimiento
**Problema:** `dueDate` podría tener hora UTC, agrupar por mes puede fallar en bordes (día 1 y 30/31)  
**Mitigación:**
- Usar `startOfMonth()` y `endOfMonth()` de `date-fns` (ya usado en forecast)
- Normalizar dueDate a medianoche local al calcular

### 3. Formato CLP vs Float
**Problema:** `ActualEntry.amountClp` es Int, `TenpoInstallment.finalMonthlyAmountClp` es Float  
**Mitigación:**
- Usar `Math.round()` al sumar (ya se hace en consolidado.ts línea 46)

### 4. Compras en modo ESTIMADO vs REAL
**Problema:** Cuotas en modo ESTIMADO pueden cambiar, las REAL están confirmadas  
**Consideración:**
- Mostrar flag en UI indicando si total Tenpo incluye estimaciones
- Opcional: filtrar solo modo REAL para "Actual" y dejar ESTIMADO como "Presupuesto"

### 5. Override Manual de Cuotas
**Problema:** Usuario puede modificar `overrideMonthlyAmountClp` en Tenpo, debe reflejarse en totales  
**Solución:** Ya resuelto, `finalMonthlyAmountClp` es el campo correcto (incluye overrides)

### 6. Compras con firstDueDateOverride
**Problema:** Usuario puede mover fecha de primera cuota (modo MANUAL)  
**Solución:** Ya resuelto, el sistema recalcula `dueDate` de todas las cuotas cuando hay override

---

## Recomendación Técnica

### Enfoque Claro: Opción A - Integración en getMonthlyBudget()

**Pasos de implementación:**

1. **Backend - Modificar consolidado.ts:**
   - Agregar categoría TENPO a interface MonthlyBudget
   - Agregar query de TenpoInstallment por mes (filtro dueDate)
   - Sumar `finalMonthlyAmountClp` de todas las cuotas del mes
   - Retornar línea con itemKey: "tenpo:cuotas"

2. **Backend - Modificar actual.ts:**
   - Agregar 'TENPO' a VALID_CATEGORIES
   - No requiere cambios adicionales (el endpoint /summary ya maneja dinámicamente)

3. **Frontend - Actualizar tipos:**
   - Agregar TENPO al enum ActualCategory (`node-version/client/src/types/actual.ts`)
   - Agregar orden en CATEGORY_ORDER de Actual.tsx

4. **Opcional - UX:**
   - Badge "Auto-calculado" en líneas de TENPO para indicar que viene de Tenpo sync
   - Mensaje informativo si usuario intenta editar manualmente una línea auto-generada

5. **Testing:**
   - Crear compra de prueba con 3 cuotas
   - Verificar que aparezca en mes correcto según dueDate
   - Confirmar que suma coincide con GET /api/tenpo/forecast para el mismo mes
   - Probar override manual en Actual (debe permitir ajustes si hay descuadres)

**Criterios de éxito:**
- Total Tenpo en Actual.tsx coincide con forecast del mismo mes
- No hay duplicación visible en UI
- Usuario puede agregar ajustes manuales en categoría AJUSTES si hay descuadres

---

## Anexo: Queries SQL Útiles (Debug)

```sql
-- Ver cuotas de un mes específico
SELECT 
  ti.id,
  ti.dueDate,
  ti.finalMonthlyAmountClp,
  tp.merchant,
  tp.purchaseDate
FROM tenpo_installments ti
JOIN tenpo_purchases tp ON ti.purchaseId = tp.id
WHERE strftime('%Y-%m', ti.dueDate) = '2026-02'
ORDER BY ti.dueDate;

-- Total por mes (equivalente a forecast)
SELECT 
  strftime('%Y-%m', ti.dueDate) AS mes,
  SUM(ti.finalMonthlyAmountClp) AS total
FROM tenpo_installments ti
GROUP BY mes
ORDER BY mes;

-- Verificar que no haya entradas manuales duplicadas
SELECT * FROM actual_entries
WHERE year = 2026 AND month = 2 AND category = 'TENPO';
```

---

**Conclusión:** La integración es técnicamente directa. El punto de inyección es `getMonthlyBudget()` sumando `TenpoInstallment.finalMonthlyAmountClp` filtrado por `dueDate`. El riesgo principal es la duplicación por ingreso manual, mitigable con UX clara (badge auto-calculado) y permisos de edición.
