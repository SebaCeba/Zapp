# Auditoría: Simplificación del Modelo de Datos

**Fecha:** 2026-04-05  
**Objetivo:** Simplificar el modelo hacia dos tablas operativas principales: `budget_entries` y `actual_entries`

---

## 1. Inventario Actual

### 1.1 Tablas de Presupuesto (Budget)

| Tabla | Tipo | Estructura | Uso |
|-------|------|-----------|-----|
| **PresupuestoIngreso** | Budget por categoría | `ingresoId` + año + 12 columnas mensuales | Presupuesto de ingresos recurrentes |
| **PresupuestoAhorro** | Budget por categoría | `ahorroId` + año + 12 columnas mensuales | Presupuesto de ahorros |
| **PresupuestoServicioBasico** | Budget por categoría | `servicioId` + año + 12 columnas mensuales | Presupuesto de servicios (agua, luz, etc.) |
| **SupermercadoPresupuesto** | Budget global | año + 12 columnas mensuales | Presupuesto de supermercado |
| **Subscription** + **PriceOverride** | Budget calculado | Periodicidad + overrides mensuales | Suscripciones con cálculo dinámico |
| **Obligacion** | Budget calculado | Cuota fija + rango de vigencia | Créditos y préstamos |
| **MortgagePayment** + **MortgageInsurance** | Budget calculado | Dividendos + seguros por fecha | Hipotecario |

**Total:** 7 fuentes de presupuesto con 4 patrones diferentes:
- Patrón 1: Catálogo + Presupuesto con 12 columnas (Ingresos, Ahorros, Servicios)
- Patrón 2: Presupuesto directo con 12 columnas (Supermercado)
- Patrón 3: Cálculo dinámico con reglas (Suscripciones, Obligaciones)
- Patrón 4: Importación externa (Hipotecario)

### 1.2 Tablas de Actual

| Tabla | Tipo | Estructura | Uso |
|-------|------|-----------|-----|
| **ActualEntry** | Actual unificado | `year + month + category + itemKey` → monto | Gastos/ingresos reales registrados |
| **UtilityTransaction** | Actual raw | `providerKey + transactionDate + amount + metadata` | Transacciones de servicios básicos importadas |

**Total:** 1 tabla unificada + 1 tabla de datos crudos

### 1.3 Tablas Auxiliares/Catálogo

| Tabla | Propósito | Relaciones |
|-------|-----------|-----------|
| **IngresoBase** | Catálogo de tipos de ingreso | → PresupuestoIngreso |
| **Ahorro** | Catálogo de cuentas de ahorro | → PresupuestoAhorro |
| **ServicioBasico** | Catálogo de servicios básicos | → PresupuestoServicioBasico + UtilityTransaction |
| **Calendar** | Calendario de referencia | → Subscription |
| **SupuestoAnual** | Supuestos UF/CLP por año | Usado en cálculos hipotecarios |

### 1.4 Endpoints y Servicios Afectados

**Rutas de presupuesto:**
- `/api/ingresos/presupuesto/:anio`
- `/api/ahorros/presupuesto/:anio`
- `/api/servicios-basicos/presupuesto/:anio`
- `/api/supermercado/presupuesto/:anio`
- `/api/subscriptions/` (cálculo dinámico)
- `/api/obligaciones/` (cálculo dinámico)
- `/api/hipotecario/` (importación)

**Rutas de actual:**
- `/api/actual/summary` → consolida budget vs actual
- `/api/actual/entry` → upsert de actual
- `/api/utilities/:provider` → actual de servicios básicos

**Servicio consolidador:**
- `src/services/consolidado.ts::getMonthlyBudget()` → lee de todas las fuentes de presupuesto

---

## 2. Problemas del Modelo Actual

### 2.1 Fragmentación de Presupuesto

❌ **Múltiples tablas** con estructura similar pero sin unificar:
- `PresupuestoIngreso`, `PresupuestoAhorro`, `PresupuestoServicioBasico` tienen exactamente la misma estructura (año + 12 columnas)
- Cada cambio requiere replicar lógica en 3 lugares (routes, services, frontend)
- Imposible hacer consultas consolidadas simples

❌ **Denormalización extrema** (12 columnas por mes):
- Dificulta consultas (`WHERE enero > 0 OR febrero > 0 OR ...`)
- Impide agregaciones eficientes (SUM, AVG por mes requiere UNION múltiple)
- Complica edición inline (UPDATE de columna dinámica)

❌ **Mixing de lógica de cálculo**:
- Algunas categorías se guardan (Ingresos, Ahorros)
- Otras se calculan en runtime (Suscripciones, Obligaciones)
- Dificulta vistas unificadas de presupuesto

### 2.2 Dependencias Complejas

❌ **Catálogos no reutilizables**:
- `IngresoBase`, `Ahorro`, `ServicioBasico` son 3 tablas con la misma estructura (nombre, activo, orden)
- No hay forma de agregar nuevas categorías sin migración

❌ **Datos crudos mezclados con operativos**:
- `UtilityTransaction` es tabla de importación cruda, pero se relaciona con `ServicioBasico` operativo
- Falta separación clara entre raw data → staging → operational

### 2.3 Dificultad de Comparación Budget vs Actual

❌ **Shapes inconsistentes**:
- Budget: 12 columnas por registro
- Actual: 1 columna por registro (normalizado)
- Frontend debe transformar para comparar

❌ **Servicio consolidador complejo**:
- `consolidado.ts::getMonthlyBudget()` tiene 250+ líneas mezclando:
  - Consultas a 7+ tablas
  - Lógica de cálculo de periodicidad (suscripciones)
  - Validaciones de vigencia (obligaciones)
  - Conversiones UF→CLP (hipotecario)

---

## 3. Propuesta: Modelo Mínimo Unificado

### 3.1 Tablas Operativas (Core)

#### **budget_entries**

Almacena **todas** las entradas de presupuesto, reemplazando:
- `PresupuestoIngreso`
- `PresupuestoAhorro`
- `PresupuestoServicioBasico`
- `SupermercadoPresupuesto`

```typescript
model BudgetEntry {
  id          Int      @id @default(autoincrement())
  year        Int
  month       Int      // 1-12
  category    String   // INGRESOS | AHORROS | SERVICIOS_BASICOS | SUPERMERCADO | SUSCRIPCIONES | OBLIGACIONES | HIPOTECARIO
  itemKey     String   // "ingreso:1" | "ahorro:2" | "serv:3" | "sm:total" | "sub:1" | "oblig:1" | "hip:dividendo"
  label       String   // Display name (ej: "Sueldo Principal", "AFP", "Luz")
  amountClp   Int      // Monto en pesos (sin decimales)
  source      String   @default("manual") // manual | calculated | imported
  metadata    String?  // JSON para info adicional (ej: {"uf": 2.5, "periodicity": "quarterly"})
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([year, month, category, itemKey])
  @@index([year, month])
  @@index([category])
}
```

**Ejemplo de registros:**

```json
// Ingreso mensual
{
  "year": 2026, "month": 4, "category": "INGRESOS",
  "itemKey": "ingreso:1", "label": "Sueldo Principal",
  "amountClp": 2500000, "source": "manual"
}

// Ahorro mensual
{
  "year": 2026, "month": 4, "category": "AHORROS",
  "itemKey": "ahorro:2", "label": "AFP",
  "amountClp": 300000, "source": "manual"
}

// Servicio básico
{
  "year": 2026, "month": 4, "category": "SERVICIOS_BASICOS",
  "itemKey": "serv:3", "label": "Luz (ENEL)",
  "amountClp": 45000, "source": "manual"
}

// Suscripción calculada
{
  "year": 2026, "month": 4, "category": "SUSCRIPCIONES",
  "itemKey": "sub:5", "label": "Netflix",
  "amountClp": 12990, "source": "calculated",
  "metadata": "{\"periodicity\":\"monthly\",\"subscriptionId\":5}"
}

// Supermercado
{
  "year": 2026, "month": 4, "category": "SUPERMERCADO",
  "itemKey": "sm:total", "label": "Supermercado",
  "amountClp": 300000, "source": "manual"
}
```

#### **actual_entries** (ya existe, mantener)

```typescript
model ActualEntry {
  id        Int      @id @default(autoincrement())
  year      Int
  month     Int
  category  String   // INGRESOS | SUSCRIPCIONES | OBLIGACIONES | HIPOTECARIO | SERVICIOS_BASICOS | SUPERMERCADO | AJUSTES | AHORROS | PAGO_TC
  itemKey   String
  label     String?
  amountClp Int
  isPaid    Boolean  @default(false)
  isLocked  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([year, month, category, itemKey])
  @@index([year, month])
}
```

**Shape idéntico** permite comparación directa y JOIN simple.

### 3.2 Tablas Auxiliares (Catálogos y Configuración)

#### **categories** (nueva)

Reemplaza la necesidad de tener múltiples catálogos:

```typescript
model Category {
  id        Int      @id @default(autoincrement())
  type      String   // INGRESOS | AHORROS | SERVICIOS_BASICOS | etc.
  itemKey   String   // "ingreso:1" | "ahorro:2" | "serv:3"
  name      String   // "Sueldo Principal" | "AFP" | "Luz (ENEL)"
  active    Boolean  @default(true)
  order     Int      @default(0)
  metadata  String?  // JSON: {"esRecurrente": true, "gmailLabel": "Facturación ENEL"}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([type, itemKey])
  @@index([type, active])
}
```

**Reemplaza:**
- `IngresoBase`
- `Ahorro`
- `ServicioBasico`

**Ventajas:**
- ✅ Agregar nueva categoría sin migración (solo config)
- ✅ Misma estructura para todas las categorías
- ✅ Consultas unificadas

#### **budget_rules** (nueva)

Define reglas de cálculo para categorías calculadas:

```typescript
model BudgetRule {
  id           Int      @id @default(autoincrement())
  category     String   // SUSCRIPCIONES | OBLIGACIONES | HIPOTECARIO
  itemKey      String   // "sub:5" | "oblig:2" | "hip:dividendo"
  ruleType     String   // subscription | loan | import
  ruleConfig   String   // JSON con periodicidad, startDate, cuotas, etc.
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@unique([category, itemKey])
}
```

**Ejemplo de configuración:**

```json
// Suscripción Netflix
{
  "category": "SUSCRIPCIONES",
  "itemKey": "sub:5",
  "ruleType": "subscription",
  "ruleConfig": {
    "name": "Netflix",
    "price": 12990,
    "periodicity": "monthly",
    "startDate": "2025-01-15",
    "priceOverrides": {
      "2026-12": 14990
    }
  }
}

// Préstamo consumo
{
  "category": "OBLIGACIONES",
  "itemKey": "oblig:2",
  "ruleType": "loan",
  "ruleConfig": {
    "nombre": "Préstamo Banco X",
    "montoCuota": 150000,
    "cuotasTotales": 24,
    "mesInicio": 1,
    "anioInicio": 2026
  }
}
```

**Reemplaza:**
- `Subscription` + `PriceOverride`
- `Obligacion`
- Lógica de cálculo hardcodeada

#### **raw_imports** (nueva)

Almacena datos crudos de imports (Gmail, CSV, etc.):

```typescript
model RawImport {
  id           Int      @id @default(autoincrement())
  source       String   // gmail | csv | api
  sourceType   String   // utilities | banking | cc_statement
  rawData      String   // JSON completo del mensaje/archivo
  parsedData   String?  // JSON parseado (staging)
  status       String   @default("pending") // pending | processed | error
  processedAt  DateTime?
  createdAt    DateTime @default(now())
  
  @@index([source, status])
}
```

**Reemplaza:**
- `UtilityTransaction` (que mezcla raw + operational)

**Ventajas:**
- ✅ Separación clara: raw → staging → operational (`actual_entries`)
- ✅ Auditoría de imports (revertir, re-parsear)
- ✅ No contamina tablas operativas

#### **Tablas auxiliares a mantener**

```typescript
model Calendar // Mantener (usado por date lookups)
model SupuestoAnual // Mantener (config UF/CLP)
model GoogleAuthToken // Mantener (auth)
model MortgageBudgetConfig // Mantener (config)
```

---

## 4. Mapeo: Tabla Actual → Tabla Destino

### 4.1 Migración de Presupuesto

| Tabla Origen | Tabla Destino | Transformación |
|--------------|---------------|----------------|
| **PresupuestoIngreso** | `budget_entries` | Explotar 12 columnas → 12 registros con `month=1..12`, `category="INGRESOS"`, `itemKey="ingreso:{ingresoId}"` |
| **PresupuestoAhorro** | `budget_entries` | Explotar 12 columnas → 12 registros con `month=1..12`, `category="AHORROS"`, `itemKey="ahorro:{ahorroId}"` |
| **PresupuestoServicioBasico** | `budget_entries` | Explotar 12 columnas → 12 registros con `month=1..12`, `category="SERVICIOS_BASICOS"`, `itemKey="serv:{servicioId}"` |
| **SupermercadoPresupuesto** | `budget_entries` | Explotar 12 columnas → 12 registros con `month=1..12`, `category="SUPERMERCADO"`, `itemKey="sm:total"` |
| **Subscription** + **PriceOverride** | `budget_rules` + `budget_entries` | Config → `budget_rules`, cálculo → `budget_entries` (pre-calcular o calcular on-demand) |
| **Obligacion** | `budget_rules` + `budget_entries` | Config → `budget_rules`, cálculo → `budget_entries` |
| **MortgagePayment** + **MortgageInsurance** | `budget_entries` | Calcular y escribir en `budget_entries` con `source="imported"` |

### 4.2 Migración de Catálogos

| Tabla Origen | Tabla Destino | Transformación |
|--------------|---------------|----------------|
| **IngresoBase** | `categories` | `type="INGRESOS"`, `itemKey="ingreso:{id}"`, `metadata={"esRecurrente": ...}` |
| **Ahorro** | `categories` | `type="AHORROS"`, `itemKey="ahorro:{id}"` |
| **ServicioBasico** | `categories` | `type="SERVICIOS_BASICOS"`, `itemKey="serv:{id}"`, `metadata={"gmailLabel": ..., "hasEmailConnector": ...}` |

### 4.3 Migración de Actual

| Tabla Origen | Tabla Destino | Transformación |
|--------------|---------------|----------------|
| **ActualEntry** | `actual_entries` | **SIN CAMBIOS** (ya normalizada) |
| **UtilityTransaction** | `raw_imports` + `actual_entries` | Raw → `raw_imports`, procesado → `actual_entries` |

---

## 5. Riesgos de Migración

### 5.1 Riesgos de Datos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Pérdida de datos históricos** | 🔴 Alta | Backup completo pre-migración + script de rollback |
| **Inconsistencia en conversion 12 cols → 12 rows** | 🟡 Media | Script de validación: COUNT(*) antes vs después |
| **Pérdida de metadata en JSON** | 🟡 Media | Validar campos opcionales (gmailLabel, esRecurrente) migran correctamente |
| **Cálculos de suscripciones diferentes** | 🟡 Media | Test comparativo: `getMonthlyBudget()` viejo vs nuevo (sample 12 meses) |

### 5.2 Riesgos de Frontend

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Componentes acoplados a modelo viejo** | 🔴 Alta | Auditoría de componentes (ver lista abajo) |
| **Endpoints deprecados invocados** | 🟡 Media | Mantener endpoints viejos como wrappers (deprecation grace period) |
| **Performance en vistas consolidadas** | 🟢 Baja | Index en `(year, month)` y `category` |

**Componentes frontend afectados:**
- `Ingresos.tsx`, `GestionarIngresosModal.tsx` → leer de `categories` en vez de endpoint `/catalogo`
- `Ahorros.tsx`, `GestionarAhorrosModal.tsx` → leer de `categories`
- `ServiciosBasicos.tsx`, `ConfigServiciosBasicos.tsx` → leer de `categories`
- `TablaPresupuestoIngresos.tsx`, `TablaPresupuestoAhorros.tsx`, `TablaPresupuestoServicios.tsx` → unificar en `TablaPresupuestoGenerico.tsx`
- `ActualUtilities.tsx` → leer de `raw_imports` + `actual_entries`

### 5.3 Riesgos de Servicios

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Servicio `consolidado.ts` rompe** | 🔴 Alta | Reescribir antes de migración, probar con datos migrados en staging |
| **Recalculo de suscripciones inconsistente** | 🟡 Media | Materializar budget en vez de calcular on-demand |
| **Imports Gmail dejan de funcionar** | 🟡 Media | Migrar `UtilityTransaction` primero, validar pipeline |

---

## 6. Orden Recomendado de Implementación

### Fase 1: Preparación (Sin Breaking Changes)

**Objetivo:** Crear nuevo modelo sin romper el existente

1. ✅ **Crear tablas nuevas** (en paralelo al modelo viejo):
   - `budget_entries`
   - `categories`
   - `budget_rules`
   - `raw_imports`

2. ✅ **Script de migración bidireccional**:
   - Escribir script que copia datos de tablas viejas → nuevas
   - Validar integridad (COUNT, SUM por categoría)
   - Ejecutar en staging

3. ✅ **Endpoints dual-mode**:
   - Nuevos endpoints `/api/v2/budget` que leen de `budget_entries`
   - Mantener endpoints viejos activos
   - Feature flag para cambiar entre v1/v2

### Fase 2: Migración de Backend (Breaking Changes Controlados)

**Objetivo:** Reescribir servicios core

4. ✅ **Reescribir `consolidado.ts`**:
   - Simplificar `getMonthlyBudget()` para leer de `budget_entries`
   - Eliminar lógica de cálculo de suscripciones (mover a job separado)
   - Test: comparar output v1 vs v2 en 12 meses

5. ✅ **Materializar budget calculado**:
   - Job que calcula suscripciones/obligaciones → escribe en `budget_entries`
   - Ejecutar 1 vez al día (o al editar regla)
   - Marcar con `source="calculated"`

6. ✅ **Migrar pipeline de imports**:
   - Gmail → `raw_imports` → parser → `actual_entries`
   - Deprecar `UtilityTransaction` (mover datos)

### Fase 3: Migración de Frontend (Breaking Changes en UI)

**Objetivo:** Unificar componentes

7. ✅ **Componente genérico de presupuesto**:
   - `TablaPresupuestoGenerico.tsx` que recibe `category` como prop
   - Reemplaza `TablaPresupuestoIngresos`, `TablaPresupuestoAhorros`, `TablaPresupuestoServicios`

8. ✅ **Componente genérico de gestión de catálogo**:
   - `GestionarCategoriaModal.tsx` que recibe `type` como prop
   - Reemplaza `GestionarIngresosModal`, `GestionarAhorrosModal`

9. ✅ **Vista unificada de comparación**:
   - `PresupuestoVsActual.tsx` que hace JOIN de `budget_entries` y `actual_entries`
   - Elimina lógica de transformación frontend

### Fase 4: Limpieza (Deprecation)

**Objetivo:** Eliminar código legacy

10. ✅ **Eliminar tablas viejas**:
    - `PresupuestoIngreso`, `PresupuestoAhorro`, `PresupuestoServicioBasico`, `SupermercadoPresupuesto`
    - `IngresoBase`, `Ahorro`, `ServicioBasico` (si no se usan en otros contextos)
    - `Subscription`, `PriceOverride`, `Obligacion` (después de validar `budget_rules`)

11. ✅ **Eliminar endpoints v1**:
    - `/api/ingresos/presupuesto/:anio` → deprecated
    - `/api/ahorros/presupuesto/:anio` → deprecated
    - etc.

12. ✅ **Eliminar componentes legacy**:
    - Archivos `.old.tsx` o código comentado

---

## 7. Propuesta de Shape JSON Final

### **budget_entries**

```typescript
interface BudgetEntry {
  id: number;
  year: number;              // 2026
  month: number;             // 1-12
  category: string;          // "INGRESOS" | "AHORROS" | "SERVICIOS_BASICOS" | "SUPERMERCADO" | "SUSCRIPCIONES" | "OBLIGACIONES" | "HIPOTECARIO"
  itemKey: string;           // "ingreso:1" | "ahorro:2" | "serv:3" | "sm:total" | "sub:5" | "oblig:2" | "hip:dividendo"
  label: string;             // "Sueldo Principal"
  amountClp: number;         // 2500000 (int, sin decimales)
  source: string;            // "manual" | "calculated" | "imported"
  metadata?: Record<string, any>; // {"uf": 2.5, "periodicity": "quarterly"}
  createdAt: string;         // ISO datetime
  updatedAt: string;         // ISO datetime
}
```

### **actual_entries** (sin cambios)

```typescript
interface ActualEntry {
  id: number;
  year: number;
  month: number;
  category: string;
  itemKey: string;
  label?: string;
  amountClp: number;
  isPaid: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### **categories**

```typescript
interface Category {
  id: number;
  type: string;              // "INGRESOS" | "AHORROS" | "SERVICIOS_BASICOS" | etc.
  itemKey: string;           // "ingreso:1"
  name: string;              // "Sueldo Principal"
  active: boolean;
  order: number;
  metadata?: Record<string, any>; // {"esRecurrente": true, "gmailLabel": "Facturación ENEL"}
  createdAt: string;
  updatedAt: string;
}
```

### **budget_rules**

```typescript
interface BudgetRule {
  id: number;
  category: string;          // "SUSCRIPCIONES" | "OBLIGACIONES" | "HIPOTECARIO"
  itemKey: string;           // "sub:5"
  ruleType: string;          // "subscription" | "loan" | "import"
  ruleConfig: Record<string, any>; // Configuración específica del tipo
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. Resumen Ejecutivo

### Beneficios

✅ **Simplicidad:**
- Frontend solo necesita 2 endpoints: `/api/budget?year=X&month=Y` y `/api/actual?year=X&month=Y`
- Comparación directa: mismo shape → JOIN simple
- Componentes React reutilizables (eliminar duplicación)

✅ **Flexibilidad:**
- Agregar nuevas categorías sin migración (solo config en `categories`)
- Modificar reglas de cálculo sin cambiar schema (JSON en `budget_rules`)
- Importar nuevas fuentes de datos (solo agregar en `raw_imports`)

✅ **Performance:**
- Consultas simples: `SELECT * FROM budget_entries WHERE year=2026 AND month=4`
- Index en `(year, month, category)` → consultas rápidas
- Materializar budget calculado → eliminar cálculos en runtime

✅ **Mantenibilidad:**
- Modelo claro: operational (`budget_entries`, `actual_entries`) vs config (`categories`, `budget_rules`) vs raw (`raw_imports`)
- Reducción de código: 3 rutas de presupuesto → 1
- Testing más fácil: shapes consistentes

### Complejidad de Migración

🟡 **Media-Alta:**
- Requiere reescribir `consolidado.ts` (core service)
- Afecta múltiples componentes frontend (pero unificación reduce complejidad futura)
- Migración de datos requiere validación exhaustiva

**Tiempo estimado:** 2-3 semanas
- Semana 1: Fase 1 + 2 (backend)
- Semana 2: Fase 3 (frontend)
- Semana 3: Testing + ajustes + deprecation

### Recomendación

✅ **PROCEDER** con la migración siguiendo el orden propuesto:
1. Crear modelo nuevo en paralelo
2. Dual-mode con feature flag
3. Migrar frontend gradualmente
4. Deprecar modelo viejo

Esta simplificación es **crítica** antes de conectar nuevas vistas o módulos, para evitar replicar la fragmentación actual.

---

**Fin del documento**
