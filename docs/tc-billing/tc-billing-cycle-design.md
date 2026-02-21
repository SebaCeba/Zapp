# Configuración de Ciclos de Facturación - TC (Diseño)

**Fecha:** 1 febrero 2026  
**Versión:** 1.0  
**Autor:** Senior Backend Architect  
**Estado:** 📐 DISEÑO (Sin implementar)

---

## 📋 Resumen Ejecutivo

Este documento define el modelo base y las reglas de negocio para soportar la **Configuración de Ciclos de Facturación** por tarjeta de crédito (TC), con ajuste por días hábiles.

**Objetivo:**
> Permitir configurar el ciclo de facturación de cada TC (ej: Tenpo hoy, otras TC mañana) para que el sistema recalcule automáticamente las fechas de vencimiento (`dueDate` / `payDateEstimated`) según reglas definidas, reduciendo la necesidad de overrides manuales mensuales.

**Alcance:**
- ✅ Auditoría del estado actual
- ✅ Diseño del modelo de datos
- ✅ Definición de reglas de negocio
- ✅ Algoritmo conceptual de recálculo
- ❌ Sin implementación de código productivo
- ❌ Sin endpoints ni UI
- ❌ Sin migraciones

**Principios clave:**
1. Las compras en cuotas NO cambian de mes salvo la **PRIMERA CUOTA** (installmentNumber = 1)
2. El ajuste de ciclo afecta SOLO:
   - Compras SIN cuotas (installmentsCount = 1)
   - Primera cuota (installmentNumber = 1) de compras EN cuotas
3. El recálculo mueve **FECHAS**, NO montos
4. Día hábil = lunes a viernes (sin feriados por ahora)
5. Overrides mensuales mandan sobre la regla general
6. Este modelo debe **reducir** overrides futuros, no aumentarlos

---

## 🔍 Auditoría Técnica del Estado Actual

### 1.1 Archivos Clave Identificados

| Archivo | Responsabilidad | Observaciones |
|---------|-----------------|---------------|
| [node-version/prisma/schema.prisma](node-version/prisma/schema.prisma#L234-L280) | Modelos de datos (TenpoPurchase, TenpoInstallment) | Define `scheduleMode`, `firstDueDateOverride` para override manual |
| [node-version/src/services/tenpo-parser.service.ts](node-version/src/services/tenpo-parser.service.ts#L145-L172) | Cálculo de `dueDate` según reglas Tenpo | **Hardcoded:** cierre día 21, vencimiento día 5 |
| [node-version/src/services/tenpo-calculator.service.ts](node-version/src/services/tenpo-calculator.service.ts#L140-L227) | Recálculo de cuotas y fechas | Usa override manual si `scheduleMode='MANUAL'`, respeta REAL |
| [node-version/src/routes/tenpo.ts](node-version/src/routes/tenpo.ts#L75-L125) | Sincronización desde Gmail | Crea compras con fechas calculadas automáticamente |

### 1.2 Lógica Actual de Cálculo de Fechas

#### Método: `calculateDueDate()` (tenpo-parser.service.ts)

**Reglas actuales (hardcoded):**
```typescript
// Líneas 145-172 de tenpo-parser.service.ts
calculateDueDate(purchaseDate: Date): Date {
  const purchaseDay = purchaseDate.getDate();
  
  // Determinar mes de factura
  let billMonth: Date;
  if (purchaseDay <= 21) {  // ← HARDCODED: día de cierre
    billMonth = purchaseDate;
  } else {
    billMonth = addMonths(purchaseDate, 1);
  }

  // Vencimiento: día 5 del mes siguiente a la factura  ← HARDCODED: día de vencimiento
  let dueDate = setDate(addMonths(billMonth, 1), 5);

  // Ajustar si cae fin de semana  ← SOLO sábado/domingo
  if (isSaturday(dueDate) || isSunday(dueDate)) {
    dueDate = previousFriday(dueDate);  // ← HARDCODED: PREVIOUS
  }

  return dueDate;
}
```

**Observaciones:**
- ✅ Ya implementa ajuste por fin de semana (sábado/domingo → viernes anterior)
- ❌ Cierre día **21** está hardcoded
- ❌ Vencimiento día **5** está hardcoded
- ❌ Regla de ajuste **PREVIOUS** está hardcoded (no permite NEXT o NONE)
- ❌ No considera feriados
- ❌ Solo aplica a TC Tenpo (no extensible a otras TC)

### 1.3 Diferenciación de Compras con/sin Cuotas

**Modelo actual:**

```prisma
model TenpoPurchase {
  installmentsCount         Int                // Número de cuotas (1 = sin cuotas)
  installments              TenpoInstallment[]
}

model TenpoInstallment {
  installmentNumber        Int           // 1..N
  dueDate                  DateTime
  payDateEstimated         DateTime
}
```

**Identificación:**
- Compras **SIN cuotas**: `installmentsCount = 1` (un solo registro en `TenpoInstallment`)
- Compras **EN cuotas**: `installmentsCount > 1` (múltiples registros en `TenpoInstallment`)
- **Primera cuota**: `installmentNumber = 1` (independiente del valor de `installmentsCount`)

**Recálculo actual:**
- Todas las cuotas se recalculan cuando se ajusta `firstDueDateOverride` (Calendar Override)
- El método `recalcularCompra()` actualiza todas las fechas sumando meses desde la primera cuota

### 1.4 Override Manual Existente (Calendar Override)

**Campos actuales:**
- `scheduleMode`: `'AUTO'` (calculado) o `'MANUAL'` (override)
- `firstDueDateOverride`: Fecha manual para la primera cuota (solo si `scheduleMode='MANUAL'`)

**Comportamiento:**
- Cuando `scheduleMode='MANUAL'`, se usa `firstDueDateOverride` para calcular todas las fechas
- Todas las cuotas subsiguientes se calculan sumando meses: `addMonths(firstDueDateOverride, i)`

**Limitaciones:**
- Requiere intervención manual por compra
- No escala a múltiples TC
- No tiene regla de negocio persistente (solo override puntual)

---

## 🏗️ Modelo de Datos Propuesto (Sin Implementar)

### 2.1 Nuevos Modelos Prisma

#### Modelo: TcBillingConfig

Define la configuración de ciclo de facturación por TC.

```prisma
model TcBillingConfig {
  id                    Int                        @id @default(autoincrement())
  tcName                String                     @unique @map("tc_name") // "TENPO", "BCI", "SANTANDER", etc.
  closingDay            Int                        @map("closing_day") // 1..31
  dueDay                Int                        @map("due_day") // 1..31 (día de vencimiento en mes siguiente)
  businessDayRule       String                     @default("PREVIOUS") @map("business_day_rule") // PREVIOUS | NEXT | NONE
  active                Boolean                    @default(true)
  createdAt             DateTime                   @default(now()) @map("created_at")
  updatedAt             DateTime                   @updatedAt @map("updated_at")
  overrides             TcBillingCycleOverride[]

  @@map("tc_billing_configs")
}
```

**Campos:**

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `tcName` | String | - | Identificador de la TC (ej: "TENPO") |
| `closingDay` | Int | - | Día de cierre del mes (ej: 21) |
| `dueDay` | Int | - | Día de vencimiento en el mes siguiente (ej: 5) |
| `businessDayRule` | String | "PREVIOUS" | Regla de ajuste por día hábil: `PREVIOUS` (viernes anterior), `NEXT` (lunes siguiente), `NONE` (no ajustar) |
| `active` | Boolean | true | Si la configuración está activa |

**Ejemplo de registro (Tenpo):**
```json
{
  "tcName": "TENPO",
  "closingDay": 21,
  "dueDay": 5,
  "businessDayRule": "PREVIOUS",
  "active": true
}
```

#### Modelo: TcBillingCycleOverride

Define overrides mensuales específicos que **mandan sobre la regla general**.

```prisma
model TcBillingCycleOverride {
  id                    Int                @id @default(autoincrement())
  configId              Int                @map("config_id")
  year                  Int
  month                 Int                // 1..12
  effectiveClosingDay   Int?               @map("effective_closing_day") // Sobrescribe closingDay
  effectiveDueDay       Int?               @map("effective_due_day") // Sobrescribe dueDay
  reason                String?            // Motivo del override (ej: "feriado bancario")
  config                TcBillingConfig    @relation(fields: [configId], references: [id], onDelete: Cascade)
  createdAt             DateTime           @default(now()) @map("created_at")

  @@unique([configId, year, month])
  @@map("tc_billing_cycle_overrides")
}
```

**Campos:**

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `configId` | Int | No | Relación con TcBillingConfig |
| `year` | Int | No | Año del override (ej: 2026) |
| `month` | Int | No | Mes del override (1..12) |
| `effectiveClosingDay` | Int | Sí | Día de cierre efectivo (sobrescribe `closingDay` si no es null) |
| `effectiveDueDay` | Int | Sí | Día de vencimiento efectivo (sobrescribe `dueDay` si no es null) |
| `reason` | String | Sí | Razón del override (documentación) |

**Ejemplo de override (Tenpo enero 2026):**
```json
{
  "configId": 1,
  "year": 2026,
  "month": 1,
  "effectiveClosingDay": 22,  // ← En lugar de 21
  "effectiveDueDay": 7,        // ← En lugar de 5
  "reason": "Feriado bancario 5-6 enero 2026"
}
```

### 2.2 Relación con TenpoPurchase

**NO se agrega FK directa** en esta iteración. Se usa **naming convention** en `tcName`:

```prisma
model TenpoPurchase {
  id                        Int                @id @default(autoincrement())
  // ... campos existentes ...
  tcName                    String?            @map("tc_name") // "TENPO" (null = Tenpo por defecto legacy)
  // ... resto de campos ...
}
```

**Regla de negocio:**
- Si `tcName = null` → Se asume "TENPO" (compatibilidad con compras existentes)
- Si `tcName = "TENPO"` → Buscar configuración con `tcName = "TENPO"`
- Si `tcName = "BCI"` → Buscar configuración con `tcName = "BCI"`

**Ventajas:**
- ✅ No rompe compras existentes
- ✅ Permite múltiples TC en el futuro
- ✅ Migración incremental

### 2.3 Concepto: Ciclo de Facturación Anual

#### ¿Qué es un Ciclo de Facturación?

Un **ciclo de facturación** es un **período de tiempo** durante el cual se acumulan las compras que serán facturadas juntas. En un Estado de Cuenta (EECC) real, cada ciclo siempre se define como:

```
CICLO = [DESDE, HASTA]
```

**Características clave:**
- Un ciclo es un **intervalo cerrado**: `DESDE <= fecha_compra <= HASTA`
- Todos los ciclos son **consecutivos** sin gaps
- Una compra pertenece al ciclo si su fecha está dentro del período

#### Definición Formal: HASTA (Cierre Efectivo)

**HASTA** es la fecha de **cierre efectivo del período de facturación**.

**Cálculo:**
```
HASTA = closingDay del mes (ej: día 21)
        + ajuste por override mensual (si existe)
        + ajuste por día hábil (businessDayRule)
```

**Reglas:**
- ✅ **SÍ se configura** (`closingDay` en TcBillingConfig)
- ✅ **SÍ se ajusta por día hábil** según `businessDayRule`
- ✅ **SÍ permite override mensual** (`effectiveClosingDay` en TcBillingCycleOverride)
- ✅ **ES la fecha visible** en el EECC como "Fecha de cierre"

**Ejemplo (Tenpo, closingDay=21, businessDayRule=PREVIOUS):**

| Mes | closingDay Nominal | Día Semana | HASTA Efectivo | Ajuste Aplicado |
|-----|-------------------|------------|----------------|------------------|
| Enero 2026 | 21-ene | Miércoles | 21-ene | Ninguno |
| Febrero 2026 | 21-feb | Sábado | **19-feb** | PREVIOUS (viernes) |
| Marzo 2026 | 21-mar | Sábado | **20-mar** | PREVIOUS (viernes) |

#### Definición Formal: DESDE (Inicio del Período)

**DESDE** es la fecha de **inicio del período de facturación**.

**Cálculo:**
```
DESDE(ciclo_N) = HASTA(ciclo_N-1) + 1 día
```

**Reglas:**
- ❌ **NO se configura** (se deriva automáticamente)
- ❌ **NO se ajusta por día hábil** (puede caer en fin de semana)
- ❌ **NO permite override** (solo se mueve si HASTA anterior cambia)
- ✅ **Siempre es consecutivo** al ciclo anterior

**Ejemplo (continuación):**

| Ciclo | DESDE | HASTA | Observación |
|-------|-------|-------|-------------|
| Enero 2026 | 22-dic-2025 | 21-ene-2026 | DESDE puede ser lunes-domingo |
| Febrero 2026 | **22-ene-2026** (sábado) | 19-feb-2026 | DESDE cayó en sábado (OK) |
| Marzo 2026 | **20-feb-2026** (jueves) | 20-mar-2026 | DESDE depende del HASTA ajustado |

**Implicación clave:**
> Si el HASTA de febrero se adelanta 2 días (21 → 19), el DESDE de marzo también se adelanta 2 días (22 → 20). Los ciclos siempre son consecutivos.

#### Tabla Anual Conceptual (Ejemplo Tenpo 2026)

**Configuración base:**
- closingDay: 21
- businessDayRule: PREVIOUS
- Overrides: enero (effectiveClosingDay=22)

| Mes | DESDE | Día | HASTA | Día | Regla Aplicada | Override/Motivo |
|-----|-------|-----|-------|-----|----------------|------------------|
| Ene | 22-dic-2025 | Lun | **22-ene** | Jue | NONE | Override: 22 (feriado 21-ene) |
| Feb | 23-ene | Vie | **20-feb** | Vie | PREVIOUS | 21-feb es sábado |
| Mar | 21-feb | Sáb | **21-mar** | Vie | NONE | 21-mar es viernes (OK) |
| Abr | 22-mar | Sáb | **21-abr** | Lun | NONE | 21-abr es lunes (OK) |
| May | 22-abr | Mar | **21-may** | Jue | NONE | 21-may es jueves (OK) |
| Jun | 22-may | Vie | **19-jun** | Vie | PREVIOUS | 21-jun es domingo |
| Jul | 20-jun | Sáb | **21-jul** | Lun | NONE | 21-jul es lunes (OK) |
| Ago | 22-jul | Mar | **21-ago** | Jue | NONE | 21-ago es jueves (OK) |
| Sep | 22-ago | Vie | **19-sep** | Vie | PREVIOUS | 21-sep es domingo |
| Oct | 20-sep | Sáb | **21-oct** | Mar | NONE | 21-oct es martes (OK) |
| Nov | 22-oct | Jue | **20-nov** | Vie | PREVIOUS | 21-nov es sábado |
| Dic | 21-nov | Sáb | **21-dic** | Lun | NONE | 21-dic es lunes (OK) |

**Observaciones de la tabla:**
1. ✅ DESDE puede caer en **cualquier día** (incluso sábado/domingo)
2. ✅ HASTA siempre es día hábil (ajustado por PREVIOUS)
3. ✅ Override de enero (22 en lugar de 21) afecta DESDE de febrero
4. ✅ Cada ajuste de HASTA propaga al DESDE siguiente
5. ✅ Esta tabla sirve como **preview conceptual** del algoritmo de ciclos

---

## 📐 Reglas de Negocio Explícitas

### 3.1 Qué se Recalcula

**✅ Se recalcula `dueDate` y `payDateEstimated` para:**

1. **Compras SIN cuotas:**
   - `installmentsCount = 1`
   - Se recalcula el único registro en `TenpoInstallment`

2. **Primera cuota de compras EN cuotas:**
   - `installmentNumber = 1` (de compras con `installmentsCount > 1`)
   - Las cuotas 2..N se recalculan como `addMonths(nuevaPrimeraFecha, i-1)`

**❌ NO se recalcula:**

- ❌ Montos (`baseAmountClp`, `finalMonthlyAmountClp`, `totalFinanciadoEstimado`)
- ❌ Tasas de interés
- ❌ Cuotas intermedias 2..N **individualmente** (se recalculan en cascada desde la primera, pero NO se mueven a otros meses)
- ❌ Compras en modo `modoMonto = 'REAL'` (guardrail estricto)

**Aclaraciones importantes:**

**Sobre compras SIN cuotas:**
- El recálculo **solo reclasifica la fecha de vencimiento** según el ciclo
- El monto NO cambia
- La compra puede "moverse" de un mes de pago a otro si cambió el ciclo

**Sobre compras EN cuotas:**
- El recálculo **solo afecta la primera cuota** (installmentNumber = 1)
- Las cuotas 2..N mantienen su **espaciado mensual** relativo a la primera
- Si la primera cuota se mueve de febrero a marzo, las demás avanzan en cascada
- **NO se mueven cuotas intermedias** fuera de su secuencia mensual
- El **número de cuotas por mes** puede cambiar, pero **el total de cuotas** se mantiene

**Ejemplo de cascada:**
```
Antes del recálculo:
- Cuota 1: 05-feb-2026
- Cuota 2: 05-mar-2026
- Cuota 3: 05-abr-2026

Después del recálculo (primera cuota se movió a marzo):
- Cuota 1: 05-mar-2026  ← Recalculada por cambio de ciclo
- Cuota 2: 05-abr-2026  ← Cascada: addMonths(nueva primera, 1)
- Cuota 3: 05-may-2026  ← Cascada: addMonths(nueva primera, 2)
```

### 3.2 Cómo una Compra se Asigna a un Ciclo (DESDE/HASTA)

**Regla formal:**

```
Una compra pertenece a un ciclo si:
  purchaseDate >= DESDE AND purchaseDate <= HASTA
```

**Algoritmo de asignación:**

```
1. Determinar el año-mes de la compra
2. Calcular HASTA del ciclo:
   - Obtener closingDay (config base o override)
   - Ajustar por businessDayRule si cae fin de semana
3. Calcular DESDE del ciclo:
   - DESDE = HASTA(ciclo anterior) + 1 día
4. Verificar:
   - Si purchaseDate >= DESDE AND purchaseDate <= HASTA:
     → La compra pertenece a este ciclo
   - Si purchaseDate > HASTA:
     → La compra pertenece al ciclo SIGUIENTE
```

**Ejemplo (Tenpo 2026: closingDay=21, businessDayRule=PREVIOUS):**

| Fecha Compra | DESDE Ciclo | HASTA Ciclo | ¿Pertenece? | Vencimiento (dueDay=5) |
|--------------|-------------|-------------|-------------|-------------------------|
| 10-ene-2026 | 22-dic-2025 | 21-ene-2026 | ✅ Sí (10 ∈ [22-dic, 21-ene]) | 05-feb-2026 |
| 21-ene-2026 | 22-dic-2025 | 21-ene-2026 | ✅ Sí (21 = HASTA) | 05-feb-2026 |
| 22-ene-2026 | 22-ene-2026 | 20-feb-2026 | ✅ Sí (22 = DESDE) | 05-mar-2026 |
| 25-ene-2026 | 22-ene-2026 | 20-feb-2026 | ✅ Sí (25 ∈ [22-ene, 20-feb]) | 05-mar-2026 |
| 20-feb-2026 | 22-ene-2026 | 20-feb-2026 | ✅ Sí (20 = HASTA) | 05-mar-2026 |
| 21-feb-2026 | 21-feb-2026 | 21-mar-2026 | ✅ Sí (21 = DESDE) | 05-abr-2026 |

**Observaciones:**
- ✅ HASTA puede variar según ajuste de día hábil (20-feb en lugar de 21-feb)
- ✅ DESDE siempre es consecutivo (21-feb sigue a 20-feb)
- ✅ Una compra el día HASTA pertenece al ciclo actual
- ✅ Una compra el día DESDE pertenece al ciclo actual (nuevo)
- ✅ Esta regla aplica tanto a compras SIN cuotas como a la clasificación de la PRIMERA cuota

### 3.3 Cómo Actúan los Overrides

**Prioridad (de mayor a menor):**

1. **Override manual por compra** (`scheduleMode = 'MANUAL'` + `firstDueDateOverride`)
   - ⚠️ Desactiva el cálculo automático por ciclo
   - Usado solo para casos excepcionales

2. **Override mensual en TcBillingCycleOverride** (año-mes específico)
   - Sobrescribe `closingDay` y/o `dueDay` para ese mes
   - Todos los cálculos automáticos usan el override

3. **Configuración general en TcBillingConfig**
   - Regla por defecto si no hay override mensual

**Ejemplo de evaluación:**

```
Compra: 2026-01-25 en TC Tenpo

1. ¿Tiene scheduleMode='MANUAL'? NO → Continuar
2. ¿Existe override para 2026-01 en TcBillingCycleOverride? SÍ → usar effectiveClosingDay=22
3. Si no, usar closingDay=21 de TcBillingConfig

Resultado: purchaseDay (25) > closingDay (22) → Factura 2026-02 → Vencimiento 2026-03-05
```

### 3.4 Ajuste por Día Hábil

**Definición de día hábil:**
- Lunes a viernes (1..5 en JavaScript Date.getDay())
- **NO considera feriados** en esta iteración (futuro)

**Reglas según `businessDayRule`:**

| Regla | Comportamiento |
|-------|----------------|
| `PREVIOUS` | Si vencimiento cae sábado/domingo → viernes anterior |
| `NEXT` | Si vencimiento cae sábado/domingo → lunes siguiente |
| `NONE` | No ajustar (mantener fecha calculada) |

**Algoritmo:**
```
dueDate = setDate(billMonth + 1, dueDay)

if businessDayRule == 'PREVIOUS':
  if isSaturday(dueDate) or isSunday(dueDate):
    dueDate = previousFriday(dueDate)

if businessDayRule == 'NEXT':
  if isSaturday(dueDate) or isSunday(dueDate):
    dueDate = nextMonday(dueDate)

if businessDayRule == 'NONE':
  # No modificar dueDate
```

### 3.5 Seguridad sobre Históricos

**Guardrail estricto: NO recalcular compras REAL**

```
if purchase.modoMonto === 'REAL':
  console.log('🛡️ [GUARDRAIL] Compra confirmada - Recálculo bloqueado')
  return // No modificar nada
```

**Otros guardrails:**
- ✅ Registrar en log todas las fechas modificadas
- ✅ Permitir preview antes de aplicar cambios masivos
- ✅ No modificar compras con `scheduleMode='MANUAL'` (respeto al override manual)
- ✅ Mantener auditoría (`updatedAt`) en cada cambio

---

## 🔄 Algoritmo Conceptual de Recálculo

### 4.1 Recalcular una Compra Individual

**Entrada:**
- `purchaseId`: ID de la compra a recalcular

**Proceso:**

```
1. Obtener compra + installments desde DB

2. GUARDRAIL: Si modoMonto == 'REAL' → Abortar

3. GUARDRAIL: Si scheduleMode == 'MANUAL' → Abortar (respeta override manual)

4. Determinar tcName (default: "TENPO")

5. Obtener configuración de ciclo:
   - Buscar TcBillingConfig donde tcName = compra.tcName
   - Verificar si hay override para el mes de compra en TcBillingCycleOverride

6. Calcular nueva primera fecha:
   - Aplicar lógica de cierre (closingDay / effectiveClosingDay)
   - Aplicar lógica de vencimiento (dueDay / effectiveDueDay)
   - Ajustar por día hábil según businessDayRule

7. Recalcular fechas de cuotas:
   - installmentNumber = 1 → nueva primera fecha
   - installmentNumber > 1 → addMonths(primeraFecha, installmentNumber - 1)

8. Actualizar DB:
   - TenpoInstallment.dueDate
   - TenpoInstallment.payDateEstimated
   - TenpoPurchase.updatedAt

9. Log de auditoría:
   - "Compra ${purchaseId} recalculada: ${N} cuotas afectadas"
   - Registrar fechas antiguas → fechas nuevas
```

**NO modificar:**
- Montos (`baseAmountClp`, `finalMonthlyAmountClp`)
- Tasas de interés
- Metadata
- Campos de negocio (merchant, amountTotalClp, etc.)

### 4.2 Recálculo Masivo (Preview + Aplicar)

**Caso de uso:**
> Usuario crea/edita configuración de ciclo para una TC. Sistema debe recalcular todas las compras afectadas.

**Flujo:**

```
1. Usuario edita TcBillingConfig (ej: cambia closingDay de 21 a 22)

2. Sistema identifica compras afectadas:
   - WHERE tcName = "TENPO"
   - AND modoMonto = 'ESTIMADO'
   - AND scheduleMode = 'AUTO'
   - AND estado en installments = 'ESTIMADO'

3. Sistema calcula preview:
   - "Se modificarán N compras"
   - "Total de cuotas afectadas: M"
   - Lista de fechas que cambiarán

4. Usuario revisa preview:
   - Aprueba → Ejecutar recálculo
   - Cancela → No hacer nada

5. Si aprobado:
   - Iterar sobre compras afectadas
   - Aplicar algoritmo de recálculo individual (sección 4.1)
   - Registrar en log de auditoría

6. Resultado final:
   - "✅ ${N} compras recalculadas correctamente"
   - "⚠️ ${M} compras saltadas (REAL o MANUAL)"
```

**Seguridad:**
- Preview obligatorio antes de cambios masivos
- Log detallado de todas las modificaciones
- Posibilidad de rollback (futuro: guardar snapshot antes de recálculo)

---

## ⚠️ Riesgos y Decisiones Conscientes

### 5.1 Riesgos Identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Recalcular compras REAL por error** | ALTO | Guardrail estricto: verificar `modoMonto='REAL'` en múltiples puntos |
| **Sobrescribir overrides manuales** | MEDIO | Verificar `scheduleMode='MANUAL'` antes de recalcular |
| **Inconsistencias con datos históricos** | MEDIO | Mantener auditoría (updatedAt), logs detallados |
| **Feriados no considerados** | BAJO | Documentar limitación, implementar en iteración futura |
| **Usuario edita configuración sin preview** | MEDIO | UI debe forzar preview antes de aplicar |
| **Migración de compras legacy sin tcName** | BAJO | Default a "TENPO" si tcName=null |

### 5.2 Decisiones Conscientes

**✅ Decisión: NO implementar FK directa TenpoPurchase → TcBillingConfig**
- **Razón:** Permite migración incremental sin modificar todas las compras
- **Trade-off:** Requiere lógica de lookup por `tcName` (más flexible, menos rígido)

**✅ Decisión: NO considerar feriados en esta iteración**
- **Razón:** Simplifica implementación inicial, requiere data de feriados
- **Trade-off:** Algunos vencimientos pueden caer en feriados (override manual)

**✅ Decisión: Overrides mensuales mandan sobre configuración general**
- **Razón:** Permite ajustes puntuales sin cambiar regla base
- **Trade-off:** Requiere gestión manual de overrides (UI futura)

**✅ Decisión: Mantener `scheduleMode='MANUAL'` como escape hatch**
- **Razón:** Casos excepcionales siempre existirán (compras internacionales, etc.)
- **Trade-off:** Usuario puede abusar de manual en lugar de ajustar configuración

**✅ Decisión: Recálculo de cuotas 2..N en cascada desde primera cuota**
- **Razón:** Mantiene consistencia con lógica actual (addMonths)
- **Trade-off:** No permite ajustar cuotas intermedias individualmente (no es necesario según reglas de negocio)

---

## 🚫 Qué NO se Hace en Esta Iteración

**Fuera de alcance (explícitamente):**

1. ❌ **Implementación de código productivo**
   - No crear servicios, controladores, ni lógica de recálculo
   - Solo diseño y documentación

2. ❌ **Creación de UI**
   - No implementar página "Configuración TC"
   - No crear formularios ni vistas

3. ❌ **Endpoints API**
   - No crear rutas REST para CRUD de configuraciones
   - No implementar endpoint de recálculo

4. ❌ **Migraciones Prisma**
   - No ejecutar `prisma migrate dev`
   - Solo propuesta de modelos

5. ❌ **Consideración de feriados**
   - Solo días hábiles lunes-viernes
   - Feriados bancarios quedan para iteración futura

6. ❌ **Validación con datos reales**
   - No probar con compras históricas
   - No verificar consistencia con banco

7. ❌ **Soporte multi-usuario**
   - Configuración global, no por usuario
   - Permisos/roles quedan para futuro

8. ❌ **Auditoría avanzada**
   - No implementar log de cambios históricos completo
   - Solo `updatedAt` básico

---

## 📝 Próximos Pasos (Fuera de Alcance Actual)

**Iteraciones futuras:**

### Iteración 2: Implementación Backend
- Crear modelos Prisma (migración)
- Implementar servicio de configuración de ciclos
- Implementar lógica de recálculo
- Crear endpoints API CRUD

### Iteración 3: UI Básica
- Crear página "Configuración TC"
- Formulario para editar closingDay, dueDay, businessDayRule
- Tabla de overrides mensuales
- Preview de recálculo antes de aplicar

### Iteración 4: Features Avanzadas
- Soporte para feriados (integración con data externa)
- Múltiples TC con UI multi-tenant
- Auditoría completa (log de cambios históricos)
- Rollback de recálculos

### Iteración 5: Validación y Testing
- Tests unitarios de lógica de ciclos
- Tests de integración con datos reales
- Validación contra estados de cuenta reales
- QA con compras históricas

---

## 📚 Referencias

### Documentos Relacionados
- [tenpo_calendar_override.md](tenpo_calendar_override.md) - Override manual actual (Calendar Override)
- [tenpo_addon_fee_base.md](tenpo_addon_fee_base.md) - Cálculo de intereses con fee
- [tenpo_real_guardrails.md](tenpo_real_guardrails.md) - Guardrails para compras confirmadas
- [TENPO_INTEGRATION.md](TENPO_INTEGRATION.md) - Integración con Gmail API

### Archivos Técnicos Auditados
- [node-version/prisma/schema.prisma](node-version/prisma/schema.prisma) - Modelos de datos actuales
- [node-version/src/services/tenpo-parser.service.ts](node-version/src/services/tenpo-parser.service.ts) - Lógica de parsing y cálculo de fechas
- [node-version/src/services/tenpo-calculator.service.ts](node-version/src/services/tenpo-calculator.service.ts) - Cálculo de cuotas y recálculo
- [node-version/src/routes/tenpo.ts](node-version/src/routes/tenpo.ts) - Endpoints de sincronización

---

**Fin del Documento**

Este diseño debe ser revisado y aprobado antes de proceder con la implementación.  
Cualquier cambio en las reglas de negocio debe documentarse explícitamente.
