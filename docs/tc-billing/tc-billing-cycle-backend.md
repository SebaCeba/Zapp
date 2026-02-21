# Configuración de Ciclos de Facturación TC - Backend

**Fecha:** 1 febrero 2026  
**Versión:** 1.0  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen Ejecutivo

Implementación backend completa del sistema de **Configuración de Ciclos de Facturación** por tarjeta de crédito (TC), permitiendo:

1. Configurar ciclos de facturación por TC (TENPO, BCI, etc.)
2. Definir overrides mensuales para casos excepcionales
3. Generar tabla anual de ciclos (DESDE/HASTA)
4. Recalcular fechas de compras según configuración de ciclos

**Componentes implementados:**
- ✅ Modelos Prisma (TcBillingConfig, TcBillingOverride)
- ✅ Servicio de dominio (tcBillingCycle.service.ts)
- ✅ API REST (/api/tc-billing)
- ✅ Algoritmo de recálculo con guardrails

---

## 🗄️ Modelos de Datos (Prisma)

### TcBillingConfig

Configuración base de ciclo de facturación por TC.

```prisma
model TcBillingConfig {
  id                    Int                      @id @default(autoincrement())
  tcKey                 String                   @unique @map("tc_key")
  closingDay            Int                      @default(21) @map("closing_day")
  dueDay                Int                      @default(5) @map("due_day")
  businessDayRule       String                   @default("PREVIOUS") @map("business_day_rule")
  createdAt             DateTime                 @default(now()) @map("created_at")
  updatedAt             DateTime                 @updatedAt @map("updated_at")
  overrides             TcBillingOverride[]

  @@map("tc_billing_configs")
}
```

**Campos:**

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `tcKey` | String | - | Identificador único de TC (ej: "TENPO") |
| `closingDay` | Int | 21 | Día nominal de cierre (1..31) |
| `dueDay` | Int | 5 | Día de vencimiento en mes siguiente (1..31) |
| `businessDayRule` | String | "PREVIOUS" | Regla de ajuste: PREVIOUS / NEXT / NONE |

**¿Por qué este modelo?**
- ✅ Permite múltiples TC con configuraciones independientes
- ✅ `tcKey` como unique constraint evita duplicados
- ✅ `dueDay` permite diferentes días de vencimiento por TC (ej: TENPO=5, BCI=10)
- ✅ `businessDayRule` estandariza ajuste de días hábiles
- ✅ Relación 1:N con overrides

**🔄 Cambio (v1.1 - 1 feb 2026):**
> Se agregó campo `dueDay` para soportar múltiples TC con diferentes días de vencimiento. Anteriormente estaba hardcoded a 5 para TENPO. El default de 5 mantiene compatibilidad con registros existentes.

### TcBillingOverride

Overrides mensuales para casos excepcionales (feriados, ajustes bancarios).

```prisma
model TcBillingOverride {
  id                    Int                @id @default(autoincrement())
  tcKey                 String             @map("tc_key")
  year                  Int
  month                 Int
  effectiveCloseDate    DateTime           @map("effective_close_date")
  config                TcBillingConfig    @relation(fields: [tcKey], references: [tcKey], onDelete: Cascade)
  createdAt             DateTime           @default(now()) @map("created_at")
  updatedAt             DateTime           @updatedAt @map("updated_at")

  @@unique([tcKey, year, month])
  @@map("tc_billing_overrides")
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tcKey` | String | FK a TcBillingConfig |
| `year` | Int | Año del override |
| `month` | Int | Mes del override (1..12) |
| `effectiveCloseDate` | DateTime | Fecha de cierre efectiva (sobrescribe regla general) |

**¿Por qué este modelo?**
- ✅ UNIQUE(tcKey, year, month) evita duplicados por mes
- ✅ FK con onDelete: Cascade limpia overrides al borrar config
- ✅ Prioridad sobre configuración general
- ✅ `effectiveCloseDate` ya incluye ajuste (no se recalcula)

---

## 🔧 API REST - Contratos de Endpoints

Base URL: `/api/tc-billing`

### A) GET /config

**Descripción:** Obtiene configuración y overrides de una TC.

**Request:**
```http
GET /api/tc-billing/config?tcKey=TENPO
```

**Response (200 OK):**
```json
{
  "id": 1,
  "tcKey": "TENPO",
  "closingDay": 21,
  "dueDay": 5,
  "businessDayRule": "PREVIOUS",
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-01T10:00:00.000Z",
  "overrides": [
    {
      "id": 1,
      "tcKey": "TENPO",
      "year": 2026,
      "month": 2,
      "effectiveCloseDate": "2026-02-20T00:00:00.000Z",
      "createdAt": "2026-02-01T10:00:00.000Z",
      "updatedAt": "2026-02-01T10:00:00.000Z"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "error": "No existe configuración para TC: TENPO"
}
```

---

### B) PUT /config

**Descripción:** Crea o actualiza configuración de una TC.

**Request:**
```http
PUT /api/tc-billing/config
Content-Type: application/json

{
  "tcKey": "TENPO",
  "closingDay": 21,
  "dueDay": 5,
  "businessDayRule": "PREVIOUS"
}
```

**Validaciones:**
- `closingDay`: debe estar entre 1 y 31
- `dueDay`: debe estar entre 1 y 31
- `businessDayRule`: debe ser PREVIOUS, NEXT o NONE

**Response (200 OK):**
```json
{
  "id": 1,
  "tcKey": "TENPO",
  "closingDay": 21,
  "dueDay": 5,
  "businessDayRule": "PREVIOUS",
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-01T10:00:00.000Z"
}
```

---

### C) GET /cycles

**Descripción:** Genera tabla anual de ciclos (12 meses) con DESDE/HASTA.

**Request:**
```http
GET /api/tc-billing/cycles?tcKey=TENPO&year=2026
```

**Response (200 OK):**
```json
{
  "tcKey": "TENPO",
  "year": 2026,
  "cycles": [
    {
      "month": 1,
      "fromDate": "2025-12-22",
      "toDate": "2026-01-21",
      "nominalToDate": "2026-01-21",
      "ruleApplied": false,
      "overrideApplied": false
    },
    {
      "month": 2,
      "fromDate": "2026-01-22",
      "toDate": "2026-02-20",
      "nominalToDate": "2026-02-21",
      "ruleApplied": true,
      "overrideApplied": false
    }
  ]
}
```

**Campos de cada ciclo:**
- `fromDate`: Inicio del período (DESDE)
- `toDate`: Cierre efectivo (HASTA)
- `nominalToDate`: Cierre nominal (antes de ajustar)
- `ruleApplied`: Si se ajustó por día hábil (ver nota abajo)
- `overrideApplied`: Si se usó override mensual

**🔄 Nota sobre `ruleApplied` (Corregido v1.1):**

`ruleApplied` indica si **realmente se aplicó un ajuste** por la regla de día hábil.

**Condiciones para `ruleApplied = true`:**
1. ✅ `businessDayRule != 'NONE'` (hay una regla configurada)
2. ✅ `nominalToDate` requería ajuste (caía sábado o domingo)
3. ✅ `toDate` final difiere de `nominalToDate` (el ajuste se aplicó)

**Casos especiales:**
- Si `overrideApplied = true` → `ruleApplied = false` (porque se usó override, no regla)
- Si `businessDayRule = 'NONE'` → `ruleApplied = false` (no hay regla a aplicar)
- Si nominal cae en día hábil (Lun-Vie) → `ruleApplied = false` (no se necesita ajuste)

**Ejemplo:**
```
Febrero 2026: closingDay=21 (sábado)
- businessDayRule = "PREVIOUS"
- nominalToDate = 2026-02-21 (sáb)
- toDate = 2026-02-20 (vie)
- ruleApplied = true ✅ (se aplicó PREVIOUS)

Marzo 2026: closingDay=21 (viernes)
- businessDayRule = "PREVIOUS"
- nominalToDate = 2026-03-21 (vie)
- toDate = 2026-03-21 (vie)
- ruleApplied = false ❌ (no se necesitó ajuste, ya era hábil)
```

**¿Por qué se corrigió?**
> Versión anterior indicaba `ruleApplied = true` solo si "caía fin de semana", sin verificar si la regla efectivamente cambió la fecha. Esto causaba inconsistencias cuando `businessDayRule = 'NONE'`.

---

**🔧 Fix: Primera Cuota (v1.1)**

En el algoritmo de recálculo, se corrigió un bug potencial en la búsqueda de la primera cuota.

**Problema anterior:**
```typescript
const firstInstallment = purchase.installments[0]; // ❌ Asume orden
```

**Solución actual:**
```typescript
const firstInstallment = purchase.installments.find(i => i.installmentNumber === 1); // ✅ Explícito
```

**¿Por qué era un bug?**
- `installments[0]` asume que el array está ordenado por `installmentNumber`
- Si el query no incluye `orderBy` o los datos están corruptos, `installments[0]` podría no ser la cuota 1
- La búsqueda explícita por `installmentNumber = 1` es robusta incluso si el array viene desordenado

**Mitigación adicional:**
> El query de compras ahora incluye `orderBy: { installmentNumber: 'asc' }` para garantizar orden, pero la búsqueda explícita agrega una segunda capa de seguridad.

---

## 🧮 Algoritmo: buildAnnualCycles (DESDE/HASTA)

**Descripción:** Crea o actualiza override mensual.

**Request:**
```http
PUT /api/tc-billing/overrides
Content-Type: application/json

{
  "tcKey": "TENPO",
  "year": 2026,
  "month": 2,
  "effectiveCloseDate": "2026-02-20"
}
```

**Validaciones:**
- `month`: debe estar entre 1 y 12
- `effectiveCloseDate`: debe ser fecha válida (formato ISO)

**Response (200 OK):**
```json
{
  "id": 1,
  "tcKey": "TENPO",
  "year": 2026,
  "month": 2,
  "effectiveCloseDate": "2026-02-20T00:00:00.000Z",
  "createdAt": "2026-02-01T10:00:00.000Z",
  "updatedAt": "2026-02-01T10:00:00.000Z"
}
```

---

### E) DELETE /overrides

**Descripción:** Elimina override mensual.

**Request:**
```http
DELETE /api/tc-billing/overrides?tcKey=TENPO&year=2026&month=2
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Override eliminado para TENPO 2026-2"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Override no encontrado"
}
```

---

### F) POST /recalculate

**Descripción:** Recalcula fechas de compras según ciclos de facturación.

**Request (Preview - dryRun):**
```http
POST /api/tc-billing/recalculate
Content-Type: application/json

{
  "tcKey": "TENPO",
  "year": 2026,
  "scope": "FUTURE_ONLY",
  "dryRun": true
}
```

**Request (Aplicar cambios):**
```http
POST /api/tc-billing/recalculate
Content-Type: application/json

{
  "tcKey": "TENPO",
  "year": 2026,
  "scope": "ALL_NON_REAL_NON_MANUAL",
  "dryRun": false
}
```

**Parámetros:**
- `scope`:
  - `FUTURE_ONLY`: Solo compras futuras (desde hoy)
  - `ALL_NON_REAL_NON_MANUAL`: Todas las compras estimadas y auto
- `dryRun`:
  - `true`: Preview sin modificar DB
  - `false`: Aplicar cambios

**Response (dryRun=true):**
```json
{
  "dryRun": true,
  "wouldChangeCount": 15,
  "sampleChanges": [
    {
      "purchaseId": 123,
      "installmentId": 456,
      "oldDate": "2026-02-05",
      "newDate": "2026-03-05"
    }
  ]
}
```

**Response (dryRun=false):**
```json
{
  "success": true,
  "changedCount": 15,
  "message": "15 cuotas recalculadas correctamente"
}
```

---

## 🧮 Algoritmo: buildAnnualCycles (DESDE/HASTA)

### Objetivo

Generar 12 ciclos consecutivos para un año, donde cada ciclo tiene:
- **HASTA (toDate):** Fecha de cierre efectiva
- **DESDE (fromDate):** Día siguiente al HASTA del ciclo anterior

### Algoritmo Paso a Paso

```typescript
async buildAnnualCycles(tcKey: string, year: number): Promise<BillingCycle[]> {
  // 1. Obtener configuración base y overrides del año
  const config = await getConfig(tcKey);
  const overrides = config.overrides.filter(o => o.year === year);

  // 2. Obtener HASTA del mes anterior (diciembre año-1)
  const prevYearDecToDate = await getEffectiveCloseDate(tcKey, year - 1, 12);

  const cycles = [];

  // 3. Para cada mes (1..12)
  for (let month = 1; month <= 12; month++) {
    // 3.1. Calcular HASTA nominal
    const nominalToDate = new Date(year, month - 1, config.closingDay);

    // 3.2. Verificar si hay override para este mes
    const override = overrides.find(o => o.month === month);

    let toDate: Date;
    let overrideApplied = false;
    let ruleApplied = false;

    if (override) {
      // Usar fecha de override (ya incluye ajuste)
      toDate = override.effectiveCloseDate;
      overrideApplied = true;
    } else {
      // Ajustar por día hábil según businessDayRule
      toDate = adjustToBusinessDay(nominalToDate, config.businessDayRule);
      ruleApplied = (isSaturday(nominalToDate) || isSunday(nominalToDate));
    }

    // 3.3. Calcular DESDE
    let fromDate: Date;
    if (month === 1) {
      // Enero: DESDE = HASTA(diciembre año-1) + 1 día
      fromDate = addDays(prevYearDecToDate, 1);
    } else {
      // Otros meses: DESDE = HASTA(mes anterior) + 1 día
      fromDate = addDays(cycles[month - 2].toDate, 1);
    }

    // 3.4. Agregar ciclo
    cycles.push({
      year,
      month,
      fromDate,
      toDate,
      nominalToDate,
      ruleApplied,
      overrideApplied
    });
  }

  return cycles;
}
```

### Ejemplo Visual

**Configuración:**
- closingDay: 21
- businessDayRule: PREVIOUS

**Resultado:**

| Mes | DESDE | HASTA Nominal | HASTA Efectivo | Ajuste |
|-----|-------|---------------|----------------|--------|
| Ene | 22-dic-2025 | 21-ene | 21-ene | - |
| Feb | 22-ene | 21-feb (Sáb) | **20-feb (Vie)** | PREVIOUS |
| Mar | **21-feb** | 21-mar (Vie) | 21-mar | - |

**Observaciones clave:**
1. ✅ DESDE de febrero es 22-ene (día siguiente al HASTA de enero)
2. ✅ HASTA de febrero se ajusta de 21 → 20 (sábado → viernes)
3. ✅ DESDE de marzo es 21-feb (día siguiente al HASTA ajustado de febrero)
4. ✅ Los ciclos son **consecutivos sin gaps**

---

## 🔄 Algoritmo de Recálculo

### Alcance Exacto

**✅ QUÉ SE RECALCULA:**

1. **Compras SIN cuotas** (`installmentsCount = 1`):
   - Se recalcula `dueDate` y `payDateEstimated` del único installment

2. **Primera cuota de compras EN cuotas** (`installmentNumber = 1`):
   - Se recalcula `dueDate` y `payDateEstimated` de la cuota 1
   - Las cuotas 2..N se recalculan **en cascada** (mantener espaciado mensual)

**❌ QUÉ NO SE MODIFICA:**

- ❌ Montos (`baseAmountClp`, `finalMonthlyAmountClp`)
- ❌ Tasas de interés
- ❌ Compras en modo `modoMonto = 'REAL'`
- ❌ Compras en modo `scheduleMode = 'MANUAL'`
- ❌ Cuotas 2..N **individualmente** (se mueven en cascada, no se reclasifican)

### Flujo del Algoritmo

```typescript
async recalculate(tcKey, year, scope, dryRun) {
  // 1. Construir ciclos anuales
  const cycles = await buildAnnualCycles(tcKey, year);

  // 2. Identificar compras afectadas
  const purchases = await prisma.tenpoPurchase.findMany({
    where: {
      modoMonto: 'ESTIMADO',     // Guardrail: NO REAL
      scheduleMode: 'AUTO',       // Guardrail: NO MANUAL
      purchaseDate: { gte: startOfYear, lte: endOfYear }
    },
    include: { installments: true }
  });

  const changes = [];

  // 3. Para cada compra
  for (const purchase of purchases) {
    // 3.1. Determinar ciclo al que pertenece
    const cycle = findCycleForDate(cycles, purchase.purchaseDate);
    // Regla: purchase.purchaseDate >= cycle.fromDate AND <= cycle.toDate

    // 3.2. Calcular nueva fecha de vencimiento
    // dueDay = 5 (hardcoded para Tenpo por ahora)
    let newDueDate = setDate(addMonths(cycle, 1), 5);
    newDueDate = adjustToBusinessDay(newDueDate, businessDayRule);

    // 3.3. Recalcular primera cuota (installmentNumber = 1)
    const firstInstallment = purchase.installments[0];
    if (firstInstallment.dueDate !== newDueDate) {
      if (!dryRun) {
        // Actualizar primera cuota
        await prisma.tenpoInstallment.update({
          where: { id: firstInstallment.id },
          data: {
            dueDate: newDueDate,
            payDateEstimated: newDueDate
          }
        });

        // 3.4. Recalcular cuotas 2..N en cascada
        for (let i = 1; i < purchase.installments.length; i++) {
          const cascadeDate = addMonths(newDueDate, i);
          await prisma.tenpoInstallment.update({
            where: { id: purchase.installments[i].id },
            data: {
              dueDate: cascadeDate,
              payDateEstimated: cascadeDate
            }
          });
        }
      }

      changes.push({ purchaseId, installmentId, oldDate, newDate });
    }
  }

  // 4. Retornar resultado
  return dryRun 
    ? { wouldChangeCount: changes.length, sampleChanges }
    : { changedCount: changes.length };
}
```

### Ejemplo de Recálculo

**Antes:**
```
Compra: 25-ene-2026 (3 cuotas)
- Cuota 1: 05-feb-2026
- Cuota 2: 05-mar-2026
- Cuota 3: 05-abr-2026
```

**Cambio de configuración:**
- Override: febrero cierra 20-feb (en lugar de 21-feb)
- Compra 25-ene ahora pertenece al ciclo de febrero (DESDE: 22-ene, HASTA: 20-feb)
- Nuevo vencimiento: 05-mar-2026 (mes siguiente al cierre)

**Después del recálculo:**
```
Compra: 25-ene-2026 (3 cuotas)
- Cuota 1: 05-mar-2026  ← Recalculada (movida 1 mes)
- Cuota 2: 05-abr-2026  ← Cascada: addMonths(cuota1, 1)
- Cuota 3: 05-may-2026  ← Cascada: addMonths(cuota1, 2)
```

**⚠️ Importante:**
- Las cuotas 2..N NO deciden su propio ciclo
- Solo se mueven en cascada desde la cuota 1
- El espaciado mensual se mantiene

---

## 🧪 Casos de Prueba

### Caso 1: Cierre cae sábado → se adelanta viernes

**Setup:**
```http
PUT /api/tc-billing/config
{
  "tcKey": "TEST_TC",
  "closingDay": 21,
  "businessDayRule": "PREVIOUS"
}
```

**Test:**
```http
GET /api/tc-billing/cycles?tcKey=TEST_TC&year=2026
```

**Verificar:**
- Febrero 2026: 21-feb es sábado
- HASTA efectivo debe ser 20-feb (viernes)
- `ruleApplied: true`

**Comando de prueba:**
```bash
curl -X GET "http://localhost:3000/api/tc-billing/cycles?tcKey=TEST_TC&year=2026"
```

---

### Caso 2: Override mensual

**Setup:**
```http
PUT /api/tc-billing/config
{
  "tcKey": "TEST_TC",
  "closingDay": 21,
  "businessDayRule": "PREVIOUS"
}

PUT /api/tc-billing/overrides
{
  "tcKey": "TEST_TC",
  "year": 2026,
  "month": 1,
  "effectiveCloseDate": "2026-01-22"
}
```

**Test:**
```http
GET /api/tc-billing/cycles?tcKey=TEST_TC&year=2026
```

**Verificar:**
- Enero 2026: HASTA debe ser 22-ene (override)
- `overrideApplied: true`
- `ruleApplied: false`
- Febrero 2026: DESDE debe ser 23-ene (día siguiente al override)

**Comando de prueba:**
```bash
curl -X GET "http://localhost:3000/api/tc-billing/cycles?tcKey=TEST_TC&year=2026" | jq '.cycles[0]'
```

---

### Caso 3: Recálculo afecta solo primera cuota

**Setup:**
```sql
-- Insertar compra de prueba (3 cuotas)
INSERT INTO tenpo_purchases (
  purchase_date, merchant, amount_total_clp,
  installments_count, modo_monto, schedule_mode
) VALUES (
  '2026-01-25', 'TEST_MERCHANT', 90000,
  3, 'ESTIMADO', 'AUTO'
);

-- Insertar cuotas
INSERT INTO tenpo_installments (
  purchase_id, installment_number, base_amount_clp,
  due_date, pay_date_estimated, final_monthly_amount_clp
) VALUES
  (1, 1, 30000, '2026-02-05', '2026-02-05', 30000),
  (1, 2, 30000, '2026-03-05', '2026-03-05', 30000),
  (1, 3, 30000, '2026-04-05', '2026-04-05', 30000);
```

**Cambio de configuración:**
```http
PUT /api/tc-billing/overrides
{
  "tcKey": "TENPO",
  "year": 2026,
  "month": 2,
  "effectiveCloseDate": "2026-02-19"
}
```

**Preview de recálculo:**
```http
POST /api/tc-billing/recalculate
{
  "tcKey": "TENPO",
  "year": 2026,
  "scope": "ALL_NON_REAL_NON_MANUAL",
  "dryRun": true
}
```

**Verificar:**
- `wouldChangeCount: 3` (cuota 1 + cascada de cuotas 2 y 3)
- Cuota 1: oldDate = 2026-02-05, newDate = 2026-03-05
- Cuota 2: oldDate = 2026-03-05, newDate = 2026-04-05
- Cuota 3: oldDate = 2026-04-05, newDate = 2026-05-05

**Aplicar recálculo:**
```http
POST /api/tc-billing/recalculate
{
  "tcKey": "TENPO",
  "year": 2026,
  "scope": "ALL_NON_REAL_NON_MANUAL",
  "dryRun": false
}
```

**Verificar en DB:**
```sql
SELECT 
  installment_number,
  due_date,
  base_amount_clp
FROM tenpo_installments
WHERE purchase_id = 1
ORDER BY installment_number;
```

**Resultado esperado:**
```
installment_number | due_date   | base_amount_clp
-------------------|------------|----------------
1                  | 2026-03-05 | 30000  ← Recalculada
2                  | 2026-04-05 | 30000  ← Cascada
3                  | 2026-05-05 | 30000  ← Cascada
```

**✅ Validaciones:**
- Montos NO cambiaron (30000 en todas)
- Solo fechas se modificaron
- Espaciado mensual se mantuvo (1 mes entre cuotas)

---

## 📚 Referencias

### Archivos Relacionados
- [tc-billing-cycle-design.md](tc-billing-cycle-design.md) - Diseño conceptual original
- [tenpo_calendar_override.md](tenpo_calendar_override.md) - Override manual por compra
- [tenpo_real_guardrails.md](tenpo_real_guardrails.md) - Guardrails para compras REAL

### Código Implementado
- [node-version/prisma/schema.prisma](../node-version/prisma/schema.prisma) - Modelos TcBillingConfig y TcBillingOverride
- [node-version/src/services/tcBillingCycle.service.ts](../node-version/src/services/tcBillingCycle.service.ts) - Servicio de dominio
- [node-version/src/routes/tc-billing.ts](../node-version/src/routes/tc-billing.ts) - Endpoints REST

### Próximos Pasos (Fuera de Alcance Actual)

1. **Agregar dueDay configurable** (actualmente hardcoded a 5)
2. **Soporte para feriados bancarios** (integración con API externa)
3. **UI para gestión de configuraciones** (frontend)
4. **Tests automatizados** (Jest + Supertest)
5. **Logging estructurado** (Winston o similar)
6. **Validación contra EECC reales** (comparar con PDFs bancarios)

---

**Fin del Documento**

Para ejecutar la migración:
```bash
cd node-version
npx prisma migrate dev --name add_tc_billing_config
```

Para probar los endpoints:
```bash
npm run dev
```
