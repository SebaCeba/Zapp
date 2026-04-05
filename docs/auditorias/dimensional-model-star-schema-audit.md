# Auditoría: Migración a Modelo Dimensional Estrella Puro

**Fecha:** 2026-04-05  
**Objetivo:** Evaluar migración del modelo actual a un modelo estrella con una sola tabla de hechos `fact_financial` y dimensiones jerárquicas

---

## Principio Rector

**Una sola gran base de hechos para toda la operación financiera:**

- ✅ Presupuesto y Actual son **escenarios**, no tablas separadas
- ✅ Toda operación contra `account_base_id` (ID de miembro base), no categorías textuales
- ✅ Jerarquía de cuentas en `dim_account`, no embebida en hechos
- ✅ Imports, reglas, conectores = tablas auxiliares, no facts ni dimensión principal
- ✅ Navegación actual = vistas filtradas de la misma base por escenario y rama de Account

---

## 1. Propuesta: dim_account (Dimensión Jerárquica)

### 1.1 Estructura de la Jerarquía

La jerarquía de cuentas debe reflejar la estructura de negocio actual:

```
ROOT (Raíz Conceptual)
├── INGRESOS
│   ├── Ingresos Recurrentes
│   │   ├── [Sueldo Principal] ← miembro base
│   │   ├── [Sueldo Cónyuge] ← miembro base
│   │   └── [Otros Ingresos Mensuales] ← miembro base
│   └── Ingresos No Recurrentes
│       ├── [Bonos] ← miembro base
│       └── [Devoluciones] ← miembro base
│
├── GASTOS
│   ├── Gastos Fijos
│   │   ├── Suscripciones
│   │   │   ├── [Netflix] ← miembro base
│   │   │   ├── [Spotify] ← miembro base
│   │   │   └── [Disney+] ← miembro base
│   │   ├── Servicios Básicos
│   │   │   ├── [Luz (ENEL)] ← miembro base
│   │   │   ├── [Agua (Aguas Andinas)] ← miembro base
│   │   │   ├── [Gas (Metrogas)] ← miembro base
│   │   │   └── [Internet (VTR)] ← miembro base
│   │   ├── Obligaciones
│   │   │   ├── [Préstamo Auto] ← miembro base
│   │   │   ├── [Tarjeta Ripley] ← miembro base
│   │   │   └── [Seguro Vida] ← miembro base
│   │   └── Hipotecario
│   │       ├── [Dividendo Hipotecario] ← miembro base
│   │       └── [Seguro Desgravamen] ← miembro base
│   └── Gastos Variables
│       ├── [Supermercado] ← miembro base
│       └── [Ajustes] ← miembro base (categoría catch-all)
│
└── AHORROS
    ├── [AFP] ← miembro base
    ├── [Cuenta Vista] ← miembro base
    └── [Inversiones] ← miembro base
```

### 1.2 Tabla dim_account

```sql
CREATE TABLE dim_account (
  account_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  account_code      TEXT NOT NULL UNIQUE,  -- 'ING.REC.001', 'GAS.FIJ.SUS.001', etc.
  account_name      TEXT NOT NULL,          -- 'Sueldo Principal', 'Netflix', 'Luz (ENEL)'
  parent_id         INTEGER,                -- FK a dim_account
  level             INTEGER NOT NULL,       -- 0=ROOT, 1=INGRESOS/GASTOS/AHORROS, 2=Subcategoría, 3=Miembro base
  is_base_member    BOOLEAN NOT NULL,       -- TRUE solo para hojas editables
  account_type      TEXT,                   -- 'INGRESO' | 'GASTO' | 'AHORRO' (nivel 1)
  sort_order        INTEGER DEFAULT 0,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES dim_account(account_id)
);

CREATE INDEX idx_account_parent ON dim_account(parent_id);
CREATE INDEX idx_account_type ON dim_account(account_type);
CREATE INDEX idx_account_base ON dim_account(is_base_member);
```

### 1.3 Ejemplo de Registros

| account_id | account_code | account_name | parent_id | level | is_base_member | account_type |
|------------|--------------|--------------|-----------|-------|----------------|--------------|
| 1 | ROOT | Root | NULL | 0 | FALSE | NULL |
| 10 | ING | Ingresos | 1 | 1 | FALSE | INGRESO |
| 11 | ING.REC | Ingresos Recurrentes | 10 | 2 | FALSE | INGRESO |
| 101 | ING.REC.001 | Sueldo Principal | 11 | 3 | **TRUE** | INGRESO |
| 102 | ING.REC.002 | Sueldo Cónyuge | 11 | 3 | **TRUE** | INGRESO |
| 20 | GAS | Gastos | 1 | 1 | FALSE | GASTO |
| 21 | GAS.FIJ | Gastos Fijos | 20 | 2 | FALSE | GASTO |
| 211 | GAS.FIJ.SUS | Suscripciones | 21 | 3 | FALSE | GASTO |
| 2101 | GAS.FIJ.SUS.001 | Netflix | 211 | 4 | **TRUE** | GASTO |
| 2102 | GAS.FIJ.SUS.002 | Spotify | 211 | 4 | **TRUE** | GASTO |
| 212 | GAS.FIJ.SER | Servicios Básicos | 21 | 3 | FALSE | GASTO |
| 2121 | GAS.FIJ.SER.001 | Luz (ENEL) | 212 | 4 | **TRUE** | GASTO |
| 2122 | GAS.FIJ.SER.002 | Agua (Aguas Andinas) | 212 | 4 | **TRUE** | GASTO |
| 30 | AHO | Ahorros | 1 | 1 | FALSE | AHORRO |
| 301 | AHO.001 | AFP | 30 | 2 | **TRUE** | AHORRO |
| 302 | AHO.002 | Cuenta Vista | 30 | 2 | **TRUE** | AHORRO |

**Notas:**
- `is_base_member = TRUE` → hoja editable, nivel operativo
- `is_base_member = FALSE` → nodo agrupador, solo para jerarquía/navegación
- `account_code` → código jerárquico legible (facilita debugging, opcional)
- `parent_id` → permite navegación recursiva

---

## 2. Propuesta: dim_scenario (Dimensión de Escenarios)

### 2.1 Concepto

**Presupuesto y Actual son escenarios distintos de la misma realidad financiera.**

En lugar de tener dos tablas (`budget_entries` y `actual_entries`), todo vive en `fact_financial` diferenciado por `scenario_id`.

### 2.2 Tabla dim_scenario

```sql
CREATE TABLE dim_scenario (
  scenario_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_code     TEXT NOT NULL UNIQUE,   -- 'BUDGET', 'ACTUAL'
  scenario_name     TEXT NOT NULL,          -- 'Presupuesto', 'Real/Actual'
  scenario_type     TEXT NOT NULL,          -- 'PLAN' | 'ACTUAL'
  description       TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 Escenarios Mínimos

| scenario_id | scenario_code | scenario_name | scenario_type | description |
|-------------|---------------|---------------|---------------|-------------|
| 1 | BUDGET | Presupuesto | PLAN | Presupuesto planificado mensual/anual |
| 2 | ACTUAL | Real | ACTUAL | Gastos e ingresos reales ejecutados |

**Extensiones futuras posibles (no implementar ahora):**
- `FORECAST` → ajuste de presupuesto durante el año
- `PREVIOUS_YEAR` → histórico año anterior
- `SCENARIO_A`, `SCENARIO_B` → análisis de sensibilidad

**Regla operativa:**
- Todo ingreso/gasto se escribe con `scenario_id = 1` (BUDGET) o `scenario_id = 2` (ACTUAL)
- Comparación Presupuesto vs Actual = `WHERE time_id = X` y hacer `PIVOT scenario_id`

---

## 3. Propuesta: dim_time (Dimensión de Tiempo)

### 3.1 Concepto

Granularidad = **mensual** (año + mes).

La mayoría de operaciones en Zapp son mensuales.

### 3.2 Tabla dim_time

```sql
CREATE TABLE dim_time (
  time_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  year              INTEGER NOT NULL,
  month             INTEGER NOT NULL,      -- 1..12
  year_month        TEXT NOT NULL UNIQUE,  -- '2026-04' formato ISO
  month_name        TEXT,                  -- 'Abril'
  quarter           INTEGER,               -- 1..4
  is_current_month  BOOLEAN DEFAULT FALSE,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_year_month UNIQUE (year, month)
);

CREATE INDEX idx_time_year ON dim_time(year);
CREATE INDEX idx_time_quarter ON dim_time(quarter);
```

### 3.3 Ejemplo de Registros

| time_id | year | month | year_month | month_name | quarter |
|---------|------|-------|------------|------------|---------|
| 1 | 2025 | 1 | 2025-01 | Enero | 1 |
| 2 | 2025 | 2 | 2025-02 | Febrero | 1 |
| ... | ... | ... | ... | ... | ... |
| 16 | 2026 | 4 | 2026-04 | Abril | 2 |
| 17 | 2026 | 5 | 2026-05 | Mayo | 2 |

**Notas:**
- Pre-popular con rango de años (ej: 2020-2030)
- `year_month` → lookup rápido desde frontend
- Permite agregaciones por trimestre/año sin parsear fechas

---

## 4. Propuesta: fact_financial (Tabla de Hechos Unificada)

### 4.1 Concepto

**Una sola tabla de hechos para todo:**
- Presupuesto de ingresos → `scenario_id=1`, `account_base_id=101` (Sueldo Principal)
- Presupuesto de gastos → `scenario_id=1`, `account_base_id=2101` (Netflix)
- Actual de ingresos → `scenario_id=2`, `account_base_id=101`
- Actual de gastos → `scenario_id=2`, `account_base_id=2101`

### 4.2 Tabla fact_financial

```sql
CREATE TABLE fact_financial (
  fact_id           INTEGER PRIMARY KEY AUTOINCREMENT,
  time_id           INTEGER NOT NULL,       -- FK a dim_time
  scenario_id       INTEGER NOT NULL,       -- FK a dim_scenario
  account_base_id   INTEGER NOT NULL,       -- FK a dim_account (solo base members)
  
  amount_clp        INTEGER NOT NULL,       -- Monto en pesos chilenos (sin decimales)
  
  -- Metadatos operativos (solo para ACTUAL, NULL en BUDGET)
  is_paid           BOOLEAN DEFAULT FALSE,  -- ¿Ya se pagó? (solo ACTUAL)
  payment_date      DATE,                   -- Fecha de pago real (solo ACTUAL)
  
  -- Auditoría
  source            TEXT DEFAULT 'manual',  -- 'manual' | 'import_gmail' | 'calculated'
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (time_id) REFERENCES dim_time(time_id),
  FOREIGN KEY (scenario_id) REFERENCES dim_scenario(scenario_id),
  FOREIGN KEY (account_base_id) REFERENCES dim_account(account_id),
  
  CONSTRAINT unique_fact UNIQUE (time_id, scenario_id, account_base_id)
);

CREATE INDEX idx_fact_time ON fact_financial(time_id);
CREATE INDEX idx_fact_scenario ON fact_financial(scenario_id);
CREATE INDEX idx_fact_account ON fact_financial(account_base_id);
CREATE INDEX idx_fact_time_scenario ON fact_financial(time_id, scenario_id);
```

### 4.3 Grano de la Tabla

**Grano:** Un registro = monto de una cuenta base (`account_base_id`) en un mes (`time_id`) para un escenario (`scenario_id`)

**Ejemplos:**

| fact_id | time_id | scenario_id | account_base_id | amount_clp | is_paid | source |
|---------|---------|-------------|-----------------|------------|---------|--------|
| 1 | 16 | 1 | 101 | 2500000 | NULL | manual |
| 2 | 16 | 2 | 101 | 2500000 | TRUE | manual |
| 3 | 16 | 1 | 2101 | 12990 | NULL | calculated |
| 4 | 16 | 2 | 2101 | 12990 | TRUE | manual |
| 5 | 16 | 1 | 2121 | 45000 | NULL | manual |
| 6 | 16 | 2 | 2121 | 48500 | TRUE | import_gmail |

**Interpretación:**
- Fila 1: Presupuesto de Sueldo Principal en Abril 2026 = $2,500,000
- Fila 2: Actual de Sueldo Principal en Abril 2026 = $2,500,000 (pagado)
- Fila 3: Presupuesto de Netflix en Abril 2026 = $12,990 (calculado desde regla de suscripción)
- Fila 4: Actual de Netflix en Abril 2026 = $12,990 (pagado manualmente)
- Fila 5: Presupuesto de Luz en Abril 2026 = $45,000
- Fila 6: Actual de Luz en Abril 2026 = $48,500 (importado desde Gmail)

### 4.4 Consultas Típicas

**Comparar Presupuesto vs Actual para un mes:**

```sql
SELECT 
  a.account_name,
  MAX(CASE WHEN s.scenario_code = 'BUDGET' THEN f.amount_clp END) AS budget,
  MAX(CASE WHEN s.scenario_code = 'ACTUAL' THEN f.amount_clp END) AS actual,
  MAX(CASE WHEN s.scenario_code = 'ACTUAL' THEN f.amount_clp END) - 
  MAX(CASE WHEN s.scenario_code = 'BUDGET' THEN f.amount_clp END) AS delta
FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE t.year = 2026 AND t.month = 4
GROUP BY a.account_id, a.account_name
ORDER BY a.account_code;
```

**Total de Ingresos presupuestados en 2026:**

```sql
SELECT 
  SUM(f.amount_clp) AS total_ingresos_budget_2026
FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE t.year = 2026
  AND s.scenario_code = 'BUDGET'
  AND a.account_type = 'INGRESO';
```

**Navegación jerárquica (total Gastos Fijos):**

```sql
-- Primero obtener IDs de todos los miembros base bajo "Gastos Fijos"
WITH RECURSIVE account_tree AS (
  -- Nodo raíz: Gastos Fijos
  SELECT account_id FROM dim_account WHERE account_code = 'GAS.FIJ'
  UNION ALL
  -- Recursión: todos los hijos
  SELECT a.account_id
  FROM dim_account a
  JOIN account_tree t ON a.parent_id = t.account_id
)
SELECT 
  SUM(f.amount_clp) AS total_gastos_fijos
FROM fact_financial f
WHERE f.account_base_id IN (
  SELECT account_id FROM account_tree WHERE is_base_member = TRUE
)
  AND f.scenario_id = 1  -- BUDGET
  AND f.time_id = 16;     -- Abril 2026
```

---

## 5. Identificación de Miembros Base Actuales

### 5.1 Mapeo de Entidades Actuales → account_base_id

| Tabla Actual | Campo ID | Ejemplo | Nuevo account_base_id | Rama en dim_account |
|--------------|----------|---------|----------------------|---------------------|
| **IngresoBase** | `id` | `1 → "Sueldo Principal"` | `101` | `INGRESOS > Ingresos Recurrentes > [Sueldo Principal]` |
| **IngresoBase** | `id` | `2 → "Sueldo Cónyuge"` | `102` | `INGRESOS > Ingresos Recurrentes > [Sueldo Cónyuge]` |
| **Subscription** | `id` | `5 → "Netflix"` | `2101` | `GASTOS > Gastos Fijos > Suscripciones > [Netflix]` |
| **Subscription** | `id` | `6 → "Spotify"` | `2102` | `GASTOS > Gastos Fijos > Suscripciones > [Spotify]` |
| **ServicioBasico** | `id` | `3 → "Luz (ENEL)"` | `2121` | `GASTOS > Gastos Fijos > Servicios Básicos > [Luz]` |
| **ServicioBasico** | `id` | `4 → "Agua"` | `2122` | `GASTOS > Gastos Fijos > Servicios Básicos > [Agua]` |
| **Obligacion** | `id` | `2 → "Préstamo Auto"` | `2131` | `GASTOS > Gastos Fijos > Obligaciones > [Préstamo Auto]` |
| **MortgagePayment** | (único) | `"Dividendo"` | `2141` | `GASTOS > Gastos Fijos > Hipotecario > [Dividendo]` |
| **MortgageInsurance** | `id` | `1 → "Seguro Desgravamen"` | `2142` | `GASTOS > Gastos Fijos > Hipotecario > [Seguro Desgravamen]` |
| **SupermercadoPresupuesto** | (único) | `"Supermercado"` | `2201` | `GASTOS > Gastos Variables > [Supermercado]` |
| **Ahorro** | `id` | `1 → "AFP"` | `301` | `AHORROS > [AFP]` |
| **Ahorro** | `id` | `2 → "Cuenta Vista"` | `302` | `AHORROS > [Cuenta Vista]` |

### 5.2 Categoría "AJUSTES"

**Problema:** `ActualEntry` tiene categoría `AJUSTES` con `label` libre (no hay catálogo).

**Solución:**
- Crear nodo en dim_account: `GAS.ADJ` → "Ajustes"
- Opción A: Un solo miembro base genérico `2999` → "Ajustes Varios" (label se guarda en fact como metadata)
- Opción B: Crear miembros base dinámicos al agregar ajuste (requiere escritura en dim_account)

**Recomendación:** Opción A (simplicidad), con campo `note` en fact para label libre.

---

## 6. Mapeo Tabla por Tabla → fact_financial

### 6.1 PresupuestoIngreso → fact_financial

**Estructura actual:**
```sql
PresupuestoIngreso {
  id, ingresoId, anio, enero, febrero, marzo, ..., diciembre
}
```

**Transformación:**

1. Explotar 12 columnas mensuales → 12 registros en `fact_financial`
2. Lookup `time_id` desde `dim_time` con `(anio, mes)`
3. `scenario_id = 1` (BUDGET)
4. `account_base_id` = lookup desde mapeo `ingresoId → account_base_id`

**Ejemplo:**

Registro actual:
```
id=1, ingresoId=1 (Sueldo Principal), anio=2026,
enero=2500000, febrero=2500000, marzo=2500000, ..., diciembre=2500000
```

Se convierte en 12 registros:

| time_id | scenario_id | account_base_id | amount_clp |
|---------|-------------|-----------------|------------|
| 13 | 1 | 101 | 2500000 |
| 14 | 1 | 101 | 2500000 |
| 15 | 1 | 101 | 2500000 |
| 16 | 1 | 101 | 2500000 |
| ... | ... | ... | ... |
| 24 | 1 | 101 | 2500000 |

### 6.2 PresupuestoAhorro → fact_financial

**Similar a PresupuestoIngreso:**

- Explotar 12 columnas → 12 registros
- `scenario_id = 1`
- `account_base_id` = lookup desde `ahorroId → account_base_id`

### 6.3 PresupuestoServicioBasico → fact_financial

**Similar a PresupuestoIngreso:**

- Explotar 12 columnas → 12 registros
- `scenario_id = 1`
- `account_base_id` = lookup desde `servicioId → account_base_id`

### 6.4 SupermercadoPresupuesto → fact_financial

**Actual:**
```sql
SupermercadoPresupuesto {
  id, anio, enero, febrero, ..., diciembre
}
```

**Transformación:**

- Explotar 12 columnas → 12 registros
- `scenario_id = 1`
- `account_base_id = 2201` (Supermercado, miembro base único)

### 6.5 Subscription → fact_financial

**Actual:** Cálculo dinámico basado en `periodicity` + `startDate` + `PriceOverride`

**Transformación:**

**Opción A: Materializar en fact_financial**
- Ejecutar cálculo mensual (ej: via job nocturno)
- Escribir resultados en `fact_financial` con `source='calculated'`
- `scenario_id = 1` (BUDGET)
- `account_base_id` = lookup desde `subscriptionId → account_base_id`

**Opción B: Mantener como tabla auxiliar + vista**
- `Subscription` + `PriceOverride` permanecen como auxiliares
- Vista SQL o servicio que calcula on-demand
- No se escribe en fact (solo lectura)

**Recomendación:** Opción A (materializar) → simplicidad de queries, fact es fuente única de verdad

### 6.6 Obligacion → fact_financial

**Similar a Subscription:**

- Calcular cuotas mensuales según vigencia
- Materializar en `fact_financial` con `source='calculated'`
- `scenario_id = 1`
- `account_base_id` = lookup desde `obligacionId → account_base_id`

### 6.7 MortgagePayment + MortgageInsurance → fact_financial

**Actual:** Importación de tabla de hipotecario

**Transformación:**

- Cada dividendo mensual → `fact_financial` con `source='imported'`
- `scenario_id = 1` (BUDGET, porque es plan de pago)
- `account_base_id = 2141` (Dividendo Hipotecario)
- Cada seguro → `account_base_id = 2142` (Seguro Desgravamen)

### 6.8 ActualEntry → fact_financial

**Actual:**
```sql
ActualEntry {
  id, year, month, category, itemKey, label, amountClp, isPaid, isLocked
}
```

**Transformación:**

1. Lookup `time_id` desde `dim_time` con `(year, month)`
2. `scenario_id = 2` (ACTUAL)
3. Parse `itemKey` para obtener `account_base_id`:
   - `"ingreso:1"` → `account_base_id = 101`
   - `"sub:5"` → `account_base_id = 2101`
   - `"serv:3"` → `account_base_id = 2121`
4. `amount_clp = amountClp`
5. `is_paid = isPaid`
6. Desechar `category`, `label` (redundantes, obtenibles desde dim_account)

**Ejemplo:**

Registro actual:
```
id=100, year=2026, month=4, category='INGRESOS', itemKey='ingreso:1',
label='Sueldo Principal', amountClp=2500000, isPaid=true
```

Se convierte en:

| time_id | scenario_id | account_base_id | amount_clp | is_paid | source |
|---------|-------------|-----------------|------------|---------|--------|
| 16 | 2 | 101 | 2500000 | TRUE | manual |

### 6.9 UtilityTransaction → fact_financial (via staging)

**Actual:**
```sql
UtilityTransaction {
  id, providerKey, transactionDate, amount, description, source, metadata
}
```

**Transformación:**

**Flujo recomendado:**

1. Import Gmail → tabla auxiliar `raw_imports` (datos crudos)
2. Parser → `UtilityTransaction` (staging)
3. Agregación mensual → `fact_financial` (operativo)

**Pasos:**

1. Lookup `account_base_id` desde `providerKey` (ej: "ENEL" → `2121`)
2. Agrupar por `(account_base_id, year-month)` → sumar montos
3. Escribir en `fact_financial`:
   - `time_id` = lookup desde `(year, month)` de `transactionDate`
   - `scenario_id = 2` (ACTUAL)
   - `account_base_id` = desde providerKey
   - `amount_clp` = sum(amount)
   - `source = 'import_gmail'`

**Nota:** Mantener `UtilityTransaction` como auxiliar para trazabilidad transaccional, pero fact es agregado mensual.

---

## 7. Campos Textuales que Deben Dejar de Ser Clave Operativa

### 7.1 Problemas Actuales

❌ **category (string)** en `ActualEntry`:
- Valores hardcodeados: `'INGRESOS'`, `'SUSCRIPCIONES'`, `'SERVICIOS_BASICOS'`
- Imposibilita jerarquías dinámicas
- Dificulta refactoring (rename requiere UPDATE masivo)
- No soporta múltiples niveles de agrupación

❌ **itemKey (string)** en `ActualEntry`:
- Formato adhoc: `'ingreso:1'`, `'sub:5'`, `'serv:3'`
- Parsing string en cada query
- No hay integridad referencial (FK)
- Código frágil ante cambios de ID

❌ **label (string)** en `ActualEntry`:
- Denormalización: duplica nombre de `dim_account`
- Inconsistencias si label cambia en catálogo pero no en fact
- Desperdicio de almacenamiento

❌ **providerKey (string)** en `UtilityTransaction`:
- String libre, no hay FK
- Riesgo de typos (`"ENEL"` vs `"Enel"` vs `"enel"`)

### 7.2 Migración a IDs

✅ **Reemplazar con account_base_id (INTEGER):**

**Antes:**
```sql
SELECT * FROM ActualEntry 
WHERE category = 'INGRESOS' AND itemKey = 'ingreso:1';
```

**Después:**
```sql
SELECT * FROM fact_financial 
WHERE account_base_id = 101;  -- FK a dim_account
```

**Ventajas:**
- Integridad referencial (no puedes escribir `account_base_id = 9999` si no existe)
- JOIN eficiente (index en INTEGER)
- Labels desde dim_account (única fuente de verdad)
- Jerarquía navegable (parent_id)

### 7.3 Labels Solo desde dim_account

**Actual (bad):**
```typescript
// Frontend tiene que conocer categorías hardcodeadas
const CATEGORY_LABELS = {
  'INGRESOS': 'Ingresos',
  'SUSCRIPCIONES': 'Suscripciones',
  'SERVICIOS_BASICOS': 'Servicios Básicos'
};
```

**Nuevo (good):**
```typescript
// Frontend lee desde API que consulta dim_account
const accounts = await fetch('/api/accounts/hierarchy');
// Respuesta:
[
  { account_id: 10, account_name: 'Ingresos', parent_id: 1, level: 1 },
  { account_id: 20, account_name: 'Gastos', parent_id: 1, level: 1 },
  { account_id: 211, account_name: 'Suscripciones', parent_id: 21, level: 3 }
]
```

**Cambio de nombre:** Un solo UPDATE en `dim_account`, no en millones de hechos.

---

## 8. Riesgos de Mantener Presupuesto y Actual en Bases Separadas

### 8.1 Fragmentación de Lógica

❌ **Dos tablas = dos schemas que deben mantenerse sincronizados:**

**Actual:**
- `PresupuestoIngreso` tiene estructura diferente a `ActualEntry`
- Agregar nueva categoría requiere:
  1. Crear tabla `PresupuestoXXX` (nueva migración)
  2. Crear ruta `/api/xxx/presupuesto/:anio`
  3. Agregar lógica en `consolidado.ts`
  4. Agregar enum `ActualCategory.XXX`
  5. Agregar componente frontend `TablaPresupuestoXXX.tsx`

**Con modelo dimensional:**
- Solo agregar nodo en `dim_account`
- Escribir facts con nuevo `account_base_id`
- Vistas y queries ya funcionan (genéricas)

### 8.2 Complejidad de Comparación

❌ **Shapes diferentes → transformación constante:**

**Actual:**
```typescript
// consolidado.ts tiene 250+ líneas para unificar
async function getMonthlyBudget(year, month) {
  // Consultar 7+ tablas diferentes
  // Transformar 12 columnas → array de 12 elementos
  // Aplicar cálculos de periodicidad
  // Formatear itemKey adhoc
  // ...
  return {
    INGRESOS: [...],
    SUSCRIPCIONES: [...],
    // etc.
  };
}
```

**Con modelo dimensional:**
```sql
-- Una query para todo
SELECT 
  a.account_name,
  s.scenario_name,
  f.amount_clp
FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE t.year = 2026 AND t.month = 4;
```

### 8.3 Rigidez para Evolución

❌ **Agregar nuevos escenarios es imposible:**

**Casos de uso bloqueados:**
- "Quiero ver presupuesto del año pasado vs actual de este año"
- "Quiero hacer un forecast ajustado"
- "Quiero comparar escenario optimista vs pesimista"

**Con dim_scenario:** Solo agregar nuevos registros, fact sigue igual.

### 8.4 Redundancia de Código

❌ **Patrón repetido 3 veces:**

**Actual:**
- `TablaPresupuestoIngresos.tsx` (270 líneas)
- `TablaPresupuestoAhorros.tsx` (270 líneas, 95% duplicado)
- `TablaPresupuestoServicios.tsx` (270 líneas, 95% duplicado)

**Con modelo dimensional:**
- `TablaPresupuesto.tsx` (1 componente genérico)
- Props: `{ accountRootId, scenarioId, timeId }`
- Reutilizable para cualquier rama de jerarquía

### 8.5 Dificultad de Auditoría

❌ **No hay historial de cambios:**

**Actual:**
- Editas presupuesto de Enero → UPDATE sobreescribe valor
- No sabes cuándo cambió ni por qué
- No hay log de versiones

**Con fact + temporal:**
- Agregar `valid_from`, `valid_to` a fact
- Cada cambio es un nuevo registro (slowly changing dimension tipo 2)
- Auditoría completa de evolución presupuestaria

---

## 9. Propuesta Mínima de Transición Sin Romper UI Actual

### 9.1 Estrategia: Dual-Mode con Feature Flag

**Objetivo:** Implementar modelo dimensional en paralelo, migrar gradualmente sin downtime.

### 9.2 Fases de Migración

#### **Fase 0: Preparación (1 semana)**

1. **Crear tablas dimensionales:**
   - `dim_account` (con jerarquía completa poblada)
   - `dim_scenario` (BUDGET, ACTUAL)
   - `dim_time` (2020-2030)
   - `fact_financial` (vacía inicialmente)

2. **Script de mapeo:**
   - Crear mapeo `old_entity_id → account_base_id`
   - Ejemplo: `ingresos` → `{1: 101, 2: 102, ...}`
   - Guardar en tabla auxiliar `legacy_account_mapping`

3. **Script de migración de datos (read-only):**
   - Copiar datos de tablas viejas → `fact_financial`
   - Validar integridad: `COUNT(*) before vs after`
   - No borrar tablas viejas aún

#### **Fase 1: Backend Dual-Mode (2 semanas)**

4. **Endpoints v2 (nuevos):**
   ```
   POST /api/v2/financial/fact
   GET  /api/v2/financial/facts?time_id=16&scenario_id=1
   GET  /api/v2/accounts/hierarchy
   GET  /api/v2/accounts/base-members?parent_id=211
   ```

5. **Feature flag:**
   ```typescript
   const USE_DIMENSIONAL_MODEL = process.env.DIMENSIONAL_MODEL === 'true';
   
   if (USE_DIMENSIONAL_MODEL) {
     return getFactsFromDimensionalModel(year, month);
   } else {
     return getMonthlyBudget(year, month); // legacy
   }
   ```

6. **Wrapper de compatibilidad:**
   - Convertir respuesta dimensional → formato legacy
   - Frontend no se entera del cambio
   - Ejemplo:
   ```typescript
   // Consultar fact_financial
   const facts = await queryFactFinancial(timeId, scenarioId);
   
   // Transformar a formato legacy
   return {
     INGRESOS: facts.filter(f => f.account_type === 'INGRESO').map(legacy),
     SUSCRIPCIONES: facts.filter(f => f.parent_code === 'GAS.FIJ.SUS').map(legacy),
     // ...
   };
   ```

#### **Fase 2: Frontend Gradual (3 semanas)**

7. **Componentes nuevos (usando v2 API):**
   - `PresupuestoGenerico.tsx` (consume `/api/v2/financial/facts`)
   - `ActualGenerico.tsx`
   - `ComparacionEscenarios.tsx`

8. **Reemplazar vistas una por una:**
   - Semana 1: Ingresos
   - Semana 2: Servicios Básicos
   - Semana 3: Suscripciones, Ahorros

9. **Feature flag frontend:**
   ```typescript
   const useDimensionalUI = import.meta.env.VITE_DIMENSIONAL_UI === 'true';
   
   if (useDimensionalUI) {
     return <PresupuestoGenerico accountRootId={10} />;
   } else {
     return <Ingresos />; // legacy
   }
   ```

#### **Fase 3: Validación y Ajuste (1 semana)**

10. **Testing A/B:**
    - Habilitar modelo dimensional para subset de usuarios
    - Comparar output de queries legacy vs dimensional
    - Validar que montos coincidan

11. **Performance tuning:**
    - Analizar slow queries
    - Agregar indexes faltantes
    - Optimizar navegación jerárquica (materialized path si es necesario)

#### **Fase 4: Cutover y Deprecation (1 semana)**

12. **Activar modelo dimensional por defecto:**
    - `DIMENSIONAL_MODEL=true` en producción
    - Mantener endpoints v1 como read-only (no permitir escritura)

13. **Eliminar código legacy (gradual):**
    - No borrar inmediatamente (grace period 1 mes)
    - Deprecar endpoints v1 con warning
    - Eliminar tablas viejas después de validar estabilidad

### 9.3 Compatibilidad con UI Actual

**No es necesario cambiar toda la UI de golpe.**

**Mapeo de vistas actuales a modelo dimensional:**

| Vista Actual | Consulta Dimensional | account_root_id |
|--------------|---------------------|-----------------|
| `/ingresos` | `WHERE account_base_id IN (SELECT id FROM dim_account WHERE parent_id = 10)` | `10` (Ingresos) |
| `/ahorros` | `WHERE account_base_id IN (SELECT id FROM dim_account WHERE parent_id = 30)` | `30` (Ahorros) |
| `/servicios-basicos` | `WHERE account_base_id IN (SELECT id FROM dim_account WHERE parent_id = 212)` | `212` (Servicios Básicos) |
| `/suscripciones` | `WHERE account_base_id IN (SELECT id FROM dim_account WHERE parent_id = 211)` | `211` (Suscripciones) |

**UI actual solo necesita:**
1. Obtener `account_root_id` correspondiente a la vista
2. Llamar API `/api/v2/financial/facts?account_root=211&scenario=1&time=16`
3. Renderizar igual que antes

**Ventaja:** Mismo look & feel, arquitectura mejorada por debajo.

### 9.4 Orden de Prioridad de Migración

**Más fácil → más difícil:**

1. ✅ **Ingresos** (simple, pocos miembros base, sin cálculos)
2. ✅ **Ahorros** (simple, pocos miembros base)
3. ✅ **Servicios Básicos** (moderado, importación Gmail ya existe)
4. 🟡 **Suscripciones** (moderado, requiere materializar cálculos)
5. 🟡 **Supermercado** (fácil, solo un miembro base)
6. 🟡 **Obligaciones** (moderado, cálculo de cuotas)
7. 🔴 **Hipotecario** (complejo, importación externa + seguros)
8. 🔴 **Actual** (crítico, refactoring de toda la lógica de comparación)

**Recomendación:** Comenzar por Ingresos + Ahorros (quick wins), luego abordar Suscripciones.

---

## 10. Resumen Ejecutivo

### 10.1 Principios del Modelo Dimensional

✅ **Una sola tabla de hechos (`fact_financial`) para toda la operación:**
- Presupuesto y Actual = escenarios (`dim_scenario`), no tablas separadas
- Comparación directa: mismo grano, mismo schema

✅ **Jerarquía en dimensión (`dim_account`), no embebida en hechos:**
- Navegación flexible (desde "Total Gastos" hasta "Netflix")
- Agregar categorías sin migración

✅ **Operación por IDs base (`account_base_id`), no strings:**
- Integridad referencial (FK)
- Performance (index en INTEGER)
- Labels desde dim_account (única fuente de verdad)

✅ **Auxiliares para complejidad técnica:**
- `Subscription`, `Obligacion` → reglas de cálculo
- `UtilityTransaction` → staging de imports
- `raw_imports` → datos crudos
- Fact es operativo, limpio, simple

### 10.2 Beneficios

**Simplicidad:**
- 1 tabla de hechos vs 7+ tablas de presupuesto
- Queries unificadas (no 7 UNION)
- Componentes reutilizables (no duplicados)

**Flexibilidad:**
- Agregar categorías/subcategorías sin migración
- Comparar escenarios múltiples (presupuesto, actual, forecast)
- Navegación jerárquica dinámica

**Performance:**
- Indexes eficientes (time_id, scenario_id, account_base_id)
- Agregaciones rápidas (SUM por jerarquía)
- Sin parsear strings en queries

**Mantenibilidad:**
- Schema claro: facts + dimensions + auxiliary
- Labels centralizados (dim_account)
- No duplicación de código

### 10.3 Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Migración de datos incorrecta** | 🔴 Alto | Script de validación + backup completo + rollback plan |
| **Performance de navegación jerárquica** | 🟡 Medio | Materialized path o closure table si CTE recursivo es lento |
| **Complejidad de materialización de cálculos** | 🟡 Medio | Job nocturno + validación de resultados vs legacy |
| **Resistencia al cambio (UI)** | 🟢 Bajo | Dual-mode + feature flag + migración gradual |

### 10.4 Tiempo Estimado

**Total:** 8-10 semanas (2-2.5 meses)

- Fase 0 (preparación): 1 semana
- Fase 1 (backend dual-mode): 2 semanas
- Fase 2 (frontend gradual): 3 semanas
- Fase 3 (validación): 1 semana
- Fase 4 (cutover): 1 semana
- Buffer: 1-2 semanas

### 10.5 Recomendación

✅ **PROCEDER** con migración a modelo dimensional:

**Justificación:**
1. Elimina fragmentación actual (7+ tablas de presupuesto → 1 fact)
2. Habilita comparación Presupuesto vs Actual simple
3. Preparación para evolución futura (múltiples escenarios, forecasting)
4. Reducción de código duplicado (componentes, rutas, servicios)
5. Modelo escalable y mantenible

**Criterio de éxito:**
- [ ] fact_financial contiene 100% de datos (presupuesto + actual)
- [ ] Queries de comparación < 100ms
- [ ] dim_account navegable recursivamente
- [ ] UI mantiene misma UX (sin regresiones)
- [ ] Código legacy eliminado (grace period cumplido)

---

**Fin del documento**
