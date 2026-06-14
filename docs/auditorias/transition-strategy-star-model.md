# Estrategia de Transición al Modelo Estrella - Garantizando Limpieza del Modelo Nuevo

**Fecha:** 2026-04-05  
**Objetivo:** Definir estrategia de migración que mantenga el modelo dimensional nuevo limpio e independiente del legado

---

## Principio Rector

**El modelo nuevo debe nacer limpio y autónomo:**

- ✅ El modelo dimensional nuevo NO depende estructuralmente del legado
- ✅ Los IDs del modelo nuevo son independientes (no se reutilizan IDs legacy)
- ✅ El legado permanece intacto como respaldo y fuente de migración
- ✅ Presupuesto vigente y Actual histórico se migran con transformación completa
- ✅ El modelo nuevo es la única fuente de verdad operativa post-migración

---

## 1. Estrategia de Transición General

### 1.1 Filosofía: Corte Limpio con Respaldo Fuerte

**Principio rector:**

El modelo nuevo nace independiente y autónomo. El legado permanece como **fuente de datos y respaldo**, no como arquitectura paralela operativa.

```
LEGACY (Respaldo)          MIGRACIÓN (Una vez)         MODELO NUEVO (Operativo)
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ IngresoBase      │───┐   │                  │       │ dim_account      │
│ Ahorro           │   │   │  Scripts ETL     │──────▶│ dim_scenario     │
│ Subscription     │   ├──▶│  (Temporal)      │       │ dim_time         │
│ ActualEntry      │   │   │                  │       │ fact_financial   │
│ Presupuesto*     │───┘   │  Validación      │       │                  │
│ (etc.)           │       │                  │       │ (IDs propios)    │
└──────────────────┘       └──────────────────┘       └──────────────────┘
     │                              │                         │
     │                              │                         │
     ▼                              ▼                         ▼
 Read-Only                    Se elimina               Frontend/Backend
 (Backup SQL)                post-migración              operan aquí
```

**No hay convivencia permanente:** Solo un proceso de migración puntual, luego el modelo nuevo es la única fuente de verdad.

### 1.2 Fases de Migración Simplificadas

**Fase 1 - Preparación (1 semana):**
- Backup completo de legacy (SQL dump + CSV exports)
- Crear schema nuevo (tablas vacías)
- Diseñar scripts de migración
- **Legacy sigue operativo** (usuario puede seguir trabajando)

**Fase 2 - Carga Inicial (1-2 semanas):**
- Popular dimensiones: `dim_account`, `dim_scenario`, `dim_time`
- Generar IDs nuevos (secuencias independientes)
- Migrar facts: Presupuesto 2026 + Actual 2025-2026
- Migrar catálogos activos
- Validar integridad (totales, FKs, grano)

**Fase 3 - Cutover (1 semana):**
- Freeze legacy (congelar escritura)
- Activar modelo nuevo como operativo
- Migrar endpoints de API (legacy → nuevo)
- Validar UX completo

**Fase 4 - Consolidación (1 semana):**
- Archivar legacy como respaldo (SQL dump, schema `legacy_archive`)
- Eliminar código/endpoints legacy deprecados
- Limpiar artefactos temporales de migración
- Documentar acceso a legacy solo para auditoría

### 1.3 Política de No-Contaminación

**Reglas estrictas:**

❌ **NUNCA hacer esto:**
- Crear FK desde modelo nuevo hacia modelo legacy
- Usar IDs legacy como primary key en modelo nuevo
- Agregar columnas `legacy_*` en tablas dimensionales nuevas
- Mantener lógica de migración embebida en código operativo
- Permitir escritura bidireccional (legacy ↔ nuevo)
- Usar tabla de mapeo legacy→nuevo en endpoints operativos
- Mantener vistas híbridas como parte del MVP

✅ **SIEMPRE hacer esto:**
- Generar IDs nuevos con secuencias AUTOINCREMENT independientes
- Scripts de migración como proceso batch separado (no en runtime)
- Migración unidireccional: legacy → nuevo (una sola vez)
- Validación post-migración automática
- Eliminar artefactos de migración después del cutover validado
- Legacy como respaldo en formato dump/export, no operativo

---

## 2. Datos del Legado que DEBEN Migrarse

### 2.1 Presupuesto Vigente (Alta Prioridad)

**Definición:** Presupuesto del año en curso (2026) que está activo.

| Tabla Legacy | Condición de Migración | Destino en Modelo Nuevo |
|--------------|------------------------|-------------------------|
| **PresupuestoIngreso** | `anio = 2026` | `fact_financial` (scenario: BUDGET) |
| **PresupuestoAhorro** | `anio = 2026` | `fact_financial` (scenario: BUDGET) |
| **PresupuestoServicioBasico** | `anio = 2026` | `fact_financial` (scenario: BUDGET) |
| **SupermercadoPresupuesto** | `anio = 2026` | `fact_financial` (scenario: BUDGET) |
| **Subscription** | `activo = TRUE` (calcular 2026) | `fact_financial` (scenario: BUDGET) |
| **Obligacion** | Vigente en 2026 | `fact_financial` (scenario: BUDGET) |
| **MortgagePayment** | `fechaVencimiento IN (2026)` | `fact_financial` (scenario: BUDGET) |
| **MortgageInsurance** | `mesAnio LIKE '2026-%'` | `fact_financial` (scenario: BUDGET) |

**Razón:** Usuario necesita continuar operando con presupuesto 2026 sin interrupción.

**Transformación:**

```sql
-- Ejemplo: PresupuestoIngreso → fact_financial
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET') AS scenario_id, -- Lookup por código semántico
  m.new_account_id AS account_base_id,
  ROUND(pres.enero) AS amount_clp,
  'migrated_legacy' AS source
FROM PresupuestoIngreso pres
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = pres.ingresoId
JOIN dim_time t ON t.year = pres.anio AND t.month = 1
WHERE pres.anio = 2026;
-- Repetir para feb-dic
```

### 2.2 Actual Histórico Relevante (Alta Prioridad)

**Definición:** Gastos/ingresos reales registrados en año en curso y año anterior (para comparaciones).

| Tabla Legacy | Condición de Migración | Destino en Modelo Nuevo |
|--------------|------------------------|-------------------------|
| **ActualEntry** | `year IN (2025, 2026)` | `fact_financial` (scenario: ACTUAL) |
| **UtilityTransaction** | `transactionDate >= '2025-01-01'` | `fact_financial` (scenario: ACTUAL, agregado mensual) |

**Razón:** 
- 2026: Comparación presupuesto vs actual año en curso
- 2025: Análisis año anterior para proyecciones

**Transformación:**

```sql
-- Ejemplo: ActualEntry → fact_financial
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, is_paid, source)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'ACTUAL') AS scenario_id, -- Lookup por código semántico
  m.new_account_id AS account_base_id,
  ae.amountClp AS amount_clp,
  ae.isPaid AS is_paid,
  'migrated_legacy' AS source
FROM ActualEntry ae
JOIN dim_time t ON t.year = ae.year AND t.month = ae.month
JOIN legacy_account_mapping m ON m.legacy_category = ae.category AND m.legacy_item_key = ae.itemKey
WHERE ae.year >= 2025;
```

### 2.3 Catálogos Activos (Alta Prioridad)

**Definición:** Catálogos de ítems editables que el usuario sigue usando.

| Tabla Legacy | Condición de Migración | Destino en Modelo Nuevo |
|--------------|------------------------|-------------------------|
| **IngresoBase** | `activo = TRUE` | `dim_account` (parent: nodo INGRESOS, is_base_member=TRUE) |
| **Ahorro** | `activo = TRUE` | `dim_account` (parent: nodo AHORROS, is_base_member=TRUE) |
| **ServicioBasico** | `activo = TRUE` | `dim_account` (parent: nodo SERVICIOS_BASICOS, is_base_member=TRUE) |
| **Subscription** | Todos (activos + inactivos) | `dim_account` (parent: nodo SUSCRIPCIONES, is_base_member=TRUE) + `budget_rules` |
| **Obligacion** | Todos | `dim_account` (parent: nodo OBLIGACIONES, is_base_member=TRUE) + `budget_rules` |
| **MortgageInsurance** | Todos | `dim_account` (parent: nodo HIPOTECARIO, is_base_member=TRUE) |

**Razón:** Usuario necesita poder editar/agregar ítems en catálogos post-migración.

**Transformación:**

```sql
-- Ejemplo: IngresoBase → dim_account
-- Paso 1: Obtener account_id del nodo padre INGRESOS
SELECT @parent_ingresos_id := account_id FROM dim_account WHERE account_code = 'INGRESOS';

-- Paso 2: Insertar miembros base
INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member, account_type, sort_order, is_active)
SELECT 
  'ING.' || LPAD(ROW_NUMBER() OVER (ORDER BY orden, id), 3, '0') AS account_code,
  nombre AS account_name,
  @parent_ingresos_id AS parent_id, -- Relación al nodo INGRESOS
  2 AS level,
  TRUE AS is_base_member,
  'INGRESO' AS account_type,
  orden AS sort_order,
  activo AS is_active
FROM IngresoBase
ORDER BY orden, id;

-- Guardar mapeo legacy→nuevo (usando account_code para lookup semántico)
INSERT INTO legacy_account_mapping (legacy_type, legacy_id, new_account_id, legacy_name)
SELECT 
  'INGRESOS' AS legacy_type,
  ib.id AS legacy_id,
  da.account_id AS new_account_id,
  ib.nombre AS legacy_name
FROM IngresoBase ib
JOIN dim_account da ON da.account_name = ib.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS');
```

### 2.4 Configuraciones y Supuestos (Media Prioridad)

| Tabla Legacy | Condición de Migración | Destino en Modelo Nuevo |
|--------------|------------------------|-------------------------|
| **SupuestoAnual** | Todos | Tabla auxiliar nueva `assumptions` o config JSON |
| **MortgageBudgetConfig** | Último registro | Tabla auxiliar nueva `budget_config` |
| **GoogleAuthToken** | Último válido | Mantener en tabla auxiliar (no dimensional) |

**Razón:** Configuraciones operativas necesarias para cálculos.

---

## 3. Datos del Legado que SE GUARDAN APARTE (No Entran al Modelo Nuevo)

### 3.1 Histórico Antiguo (Baja Prioridad)

**Qué:** Datos anteriores a 2025 (presupuesto y actual de 2024, 2023, etc.)

| Tabla Legacy | Datos a Archivar | Destino |
|--------------|------------------|---------|
| **PresupuestoIngreso** | `anio < 2025` | Schema `legacy_archive` (read-only) |
| **PresupuestoAhorro** | `anio < 2025` | Schema `legacy_archive` |
| **PresupuestoServicioBasico** | `anio < 2025` | Schema `legacy_archive` |
| **ActualEntry** | `year < 2025` | Schema `legacy_archive` |
| **UtilityTransaction** | `transactionDate < '2025-01-01'` | Schema `legacy_archive` |

**Razón:**
- No es crítico para operación actual
- Usuario puede verlo en modo lectura si necesita (queries legacy)
- Puede migrarse incrementalmente después (ver sección 7)

**Acción:**
```sql
-- Mover a schema de archivo (no eliminar)
CREATE SCHEMA IF NOT EXISTS legacy_archive;
CREATE TABLE legacy_archive.PresupuestoIngreso AS SELECT * FROM PresupuestoIngreso WHERE anio < 2025;
CREATE TABLE legacy_archive.ActualEntry AS SELECT * FROM ActualEntry WHERE year < 2025;
-- etc.
```

### 3.2 Catálogos Inactivos (Baja Prioridad)

**Qué:** Ítems desactivados que ya no se usan.

| Tabla Legacy | Datos a Archivar | Destino |
|--------------|------------------|---------|
| **IngresoBase** | `activo = FALSE` | Schema `legacy_archive` |
| **Ahorro** | `activo = FALSE` | Schema `legacy_archive` |
| **ServicioBasico** | `activo = FALSE` | Schema `legacy_archive` |

**Razón:**
- No están en uso actual
- Si reaparecen en facts históricos, se resuelve con nombre literal (not FK)

**Excepción:** Si un ítem inactivo tiene facts en 2025-2026, DEBE migrarse a dim_account con `is_active=FALSE`.

### 3.3 Metadatos de Auditoría Legacy (Baja Prioridad)

**Qué:** Campos de auditoría legacy (`createdAt`, `updatedAt` de tablas viejas)

**Razón:**
- El modelo nuevo tiene sus propios timestamps (`created_at`, `updated_at`)
- No es relevante cuándo se creó en el modelo viejo

**Acción:** No migrar, solo conservar en legacy_archive si necesario para trazabilidad.

### 3.4 Reglas de Cálculo Embebidas (Media Prioridad)

**Qué:** Lógica de periodicidad en `Subscription`, cálculo de cuotas en `Obligacion`.

**Destino:** Tabla auxiliar nueva `budget_rules` (fuera de dimensiones).

**Razón:**
- Reglas de negocio no van en dimensiones (tablas auxiliares)
- Permiten recalcular presupuesto si cambia regla

```sql
CREATE TABLE budget_rules (
  rule_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id    INTEGER NOT NULL, -- FK a dim_account
  rule_type     TEXT NOT NULL,    -- 'subscription' | 'loan' | 'import'
  rule_config   TEXT,             -- JSON con periodicidad, cuotas, etc.
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (account_id) REFERENCES dim_account(account_id)
);
```

**Migración:**

```sql
-- Ejemplo: Subscription → budget_rules
INSERT INTO budget_rules (account_id, rule_type, rule_config)
SELECT 
  m.new_account_id,
  'subscription' AS rule_type,
  json_object(
    'periodicity', s.periodicity,
    'price', s.price,
    'startDate', s.startDate,
    'priceOverrides', (SELECT json_group_array(json_object('year', year, 'month', month, 'price', price)) 
                       FROM PriceOverride WHERE subscriptionId = s.id)
  ) AS rule_config
FROM Subscription s
JOIN legacy_account_mapping m ON m.legacy_type = 'SUSCRIPCIONES' AND m.legacy_id = s.id;
```

### 3.5 Datos Crudos de Imports (Staging)

**Qué:** `UtilityTransaction` como tabla de staging.

**Destino:** Tabla auxiliar nueva `raw_imports` (fuera de fact).

**Razón:**
- Facts solo contienen datos agregados mensuales
- Transacciones individuales son staging/auditoría

```sql
CREATE TABLE raw_imports (
  import_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  source          TEXT NOT NULL,       -- 'gmail' | 'csv'
  source_type     TEXT NOT NULL,       -- 'utilities' | 'banking'
  raw_data        TEXT,                -- JSON del mensaje/archivo original
  parsed_data     TEXT,                -- JSON parseado
  account_id      INTEGER,             -- FK a dim_account (si se pudo mapear)
  transaction_date DATETIME,
  amount          REAL,
  status          TEXT DEFAULT 'pending', -- 'pending' | 'processed' | 'error'
  processed_at    DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (account_id) REFERENCES dim_account(account_id)
);
```

**Migración:**

```sql
-- UtilityTransaction → raw_imports
INSERT INTO raw_imports (source, source_type, account_id, transaction_date, amount, status, created_at)
SELECT 
  ut.source,
  'utilities' AS source_type,
  m.new_account_id,
  ut.transactionDate,
  ut.amount,
  'processed' AS status, -- ya fueron procesados en legacy
  ut.createdAt
FROM UtilityTransaction ut
JOIN ServicioBasico sb ON ut.providerKey = sb.nombre
JOIN legacy_account_mapping m ON m.legacy_type = 'SERVICIOS_BASICOS' AND m.legacy_id = sb.id
WHERE ut.transactionDate >= '2025-01-01';
```

---

## 4. Resguardo de Presupuesto Vigente y Gastos Registrados

### 4.1 Backup Pre-Migración (Obligatorio)

**Antes de cualquier migración:**

```bash
# Backup completo de base de datos legacy
sqlite3 dev.db ".backup dev_backup_pre_migration_$(date +%Y%m%d).db"

# Exportar a SQL para trazabilidad
sqlite3 dev.db ".dump" > legacy_full_dump_$(date +%Y%m%d).sql

# Exportar presupuesto vigente a CSV (validación manual)
sqlite3 dev.db -csv -header \
  "SELECT * FROM PresupuestoIngreso WHERE anio = 2026" \
  > validation/presupuesto_ingresos_2026.csv

sqlite3 dev.db -csv -header \
  "SELECT * FROM ActualEntry WHERE year >= 2025" \
  > validation/actual_entries_2025_2026.csv
```

**Validación post-backup:**

```sql
-- Verificar integridad del backup
SELECT COUNT(*) FROM PresupuestoIngreso WHERE anio = 2026;  -- Anotar resultado
SELECT COUNT(*) FROM ActualEntry WHERE year >= 2025;        -- Anotar resultado
```

### 4.2 Freeze Legacy (Después del Cutover Validado)

⚠️ **IMPORTANTE:** No congelar legacy demasiado pronto. Secuencia:

1. Backup legacy
2. Diseñar modelo nuevo
3. Crear scripts de migración
4. Cargar modelo nuevo
5. Validar integridad
6. **CUTOVER:** Activar modelo nuevo como operativo
7. **RECIÉN AQUÍ:** Congelar legacy

**Congelación post-cutover:**

```sql
-- Solo después de validar que modelo nuevo funciona correctamente
-- Prevenir UPDATE/DELETE/INSERT en tablas legacy
CREATE TRIGGER prevent_write_presupuesto_ingreso
BEFORE INSERT ON PresupuestoIngreso
BEGIN
  SELECT RAISE(FAIL, 'Tabla legacy congelada. Use modelo dimensional.');
END;
-- Repetir para todas las tablas operativas legacy
```

**Deprecar endpoints legacy:**

```typescript
// src/routes/ingresos.ts (después del cutover)
router.post('/presupuesto', async (req, res) => {
  return res.status(410).json({ 
    error: 'Endpoint deprecado. Use /api/v2/financial/budget' 
  });
});
```

**Archivar legacy:**

```bash
# Mover legacy a schema de archivo read-only
sqlite3 dev.db ".dump" > legacy_archive_$(date +%Y%m%d).sql
# Crear schema separado si se quiere mantener acceso read-only
```

### 4.3 Validación de Migración de Presupuesto

**Script de validación automática:**

```sql
-- Comparar totales migrados vs legacy (Presupuesto 2026)
SELECT 
  'LEGACY' AS source,
  SUM(enero + febrero + marzo + abril + mayo + junio + julio + agosto + septiembre + octubre + noviembre + diciembre) AS total
FROM PresupuestoIngreso WHERE anio = 2026
UNION ALL
SELECT 
  'NUEVO' AS source,
  SUM(amount_clp) AS total
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year = 2026 AND s.scenario_code = 'BUDGET';

-- Resultado esperado: mismo total
```

**Validación por categoría:**

```sql
-- Comparar INGRESOS presupuestados 2026
SELECT 
  ib.nombre,
  SUM(pi.enero + pi.febrero + ... + pi.diciembre) AS total_legacy
FROM PresupuestoIngreso pi
JOIN IngresoBase ib ON pi.ingresoId = ib.id
WHERE pi.anio = 2026
GROUP BY ib.nombre
-- VS
SELECT 
  da.account_name,
  SUM(f.amount_clp) AS total_nuevo
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year = 2026 AND s.scenario_code = 'BUDGET' 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS')
GROUP BY da.account_name;
```

**Criterio de éxito:** Diferencia < 0.1% (tolerancia por redondeo).

### 4.4 Validación de Migración de Actual

**Script de validación:**

```sql
-- Comparar totales migrados vs legacy (Actual 2025-2026)
SELECT 
  year, month, category, SUM(amountClp) AS total_legacy
FROM ActualEntry
WHERE year >= 2025
GROUP BY year, month, category
-- VS
SELECT 
  t.year, t.month, da.account_type, SUM(f.amount_clp) AS total_nuevo
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year >= 2025 AND s.scenario_code = 'ACTUAL'
GROUP BY t.year, t.month, da.account_type;
```

**Validación de isPaid:**

```sql
-- Verificar que flags de pago se migraron correctamente
SELECT 
  year, month, COUNT(*) AS total, SUM(CASE WHEN isPaid THEN 1 ELSE 0 END) AS pagados
FROM ActualEntry
WHERE year = 2026
-- VS
SELECT 
  t.year, t.month, COUNT(*) AS total, SUM(CASE WHEN f.is_paid THEN 1 ELSE 0 END) AS pagados
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year = 2026 AND s.scenario_code = 'ACTUAL';
```

---

## 5. Validación de Carga al Modelo Nuevo

### 5.1 Checklist de Validación Pre-Cutover

**Antes de activar modelo nuevo como operativo, validar:**

- [ ] **Dimensión dim_account:**
  - [ ] Nodos padre creados (cantidad esperada: ROOT, INGRESOS, GASTOS, subcategorías, AHORROS)
  - [ ] Miembros base creados desde catálogos legacy (count match)
  - [ ] Jerarquía navegable (parent_id correctos, no ciclos)
  - [ ] account_code únicos
  - [ ] is_base_member TRUE solo para hojas

- [ ] **Dimensión dim_scenario:**
  - [ ] 2 escenarios mínimos: scenario_code='BUDGET', scenario_code='ACTUAL'
  - [ ] scenario_code únicos

- [ ] **Dimensión dim_time:**
  - [ ] Rango 2020-2030 populado (132 meses)
  - [ ] year_month únicos
  - [ ] No gaps en secuencia

- [ ] **Fact fact_financial:**
  - [ ] Grano correcto: (time_id, scenario_id, account_base_id) único
  - [ ] Todos los time_id referencian dim_time válido
  - [ ] Todos los scenario_id referencian dim_scenario válido
  - [ ] Todos los account_base_id referencian dim_account válido (is_base_member=TRUE)
  - [ ] amount_clp >= 0 (sin negativos, usar signo según account_type)
  - [ ] source in ('manual', 'calculated', 'imported', 'migrated_legacy')

- [ ] **Integridad Referencial:**
  - [ ] FK fact_financial → dim_time (no huérfanos)
  - [ ] FK fact_financial → dim_scenario (no huérfanos)
  - [ ] FK fact_financial → dim_account (no huérfanos)

- [ ] **Totales:**
  - [ ] SUM(amount_clp) BUDGET 2026 == suma legacy presupuesto 2026 (±0.1%)
  - [ ] SUM(amount_clp) ACTUAL 2025-2026 == suma legacy actual 2025-2026 (±0.1%)
  - [ ] COUNT(*) facts BUDGET 2026 == estimado (N_cuentas * 12 meses)
  - [ ] COUNT(*) facts ACTUAL 2025-2026 == COUNT(*) ActualEntry 2025-2026

### 5.2 Tests Automáticos

**Script de validación integral:**

```sql
-- Test 1: Jerarquía dim_account sin ciclos
WITH RECURSIVE account_path AS (
  SELECT account_id, parent_id, 1 AS depth, account_id::TEXT AS path
  FROM dim_account WHERE parent_id IS NULL
  UNION ALL
  SELECT a.account_id, a.parent_id, p.depth + 1, p.path || '→' || a.account_id
  FROM dim_account a
  JOIN account_path p ON a.parent_id = p.account_id
  WHERE p.depth < 10  -- Prevenir loops infinitos
)
SELECT * FROM account_path WHERE depth > 5; -- No debería haber más de 5 niveles
-- Resultado esperado: 0 filas

-- Test 2: FKs válidos en fact_financial
SELECT COUNT(*) FROM fact_financial f
LEFT JOIN dim_account a ON f.account_base_id = a.account_id
WHERE a.account_id IS NULL;
-- Resultado esperado: 0

-- Test 3: Solo miembros base en facts
SELECT COUNT(*) FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id
WHERE a.is_base_member = FALSE;
-- Resultado esperado: 0

-- Test 4: Unicidad de grano
SELECT time_id, scenario_id, account_base_id, COUNT(*)
FROM fact_financial
GROUP BY time_id, scenario_id, account_base_id
HAVING COUNT(*) > 1;
-- Resultado esperado: 0 filas

-- Test 5: Comparación totales legacy vs nuevo (resumido)
SELECT 
  (SELECT SUM(enero+feb+mar+abr+may+jun+jul+ago+sep+oct+nov+dic) FROM PresupuestoIngreso WHERE anio=2026) AS legacy_total,
  (SELECT SUM(amount_clp) FROM fact_financial f JOIN dim_time t ON f.time_id=t.time_id JOIN dim_scenario s ON f.scenario_id=s.scenario_id WHERE t.year=2026 AND s.scenario_code='BUDGET') AS nuevo_total,
  ABS((legacy_total - nuevo_total) / legacy_total * 100) AS diff_pct;
-- Resultado esperado: diff_pct < 0.1
```

### 5.3 Validación UX (Smoke Tests)

**Queries que debe poder hacer el frontend:**

```sql
-- Query 1: Comparar Presupuesto vs Actual de Abril 2026
SELECT 
  a.account_name,
  MAX(CASE WHEN s.scenario_code = 'BUDGET' THEN f.amount_clp END) AS presupuesto,
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

-- Query 2: Total Ingresos presupuestados 2026
SELECT SUM(f.amount_clp) AS total_ingresos_2026
FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE t.year = 2026 AND s.scenario_code = 'BUDGET' AND a.account_type = 'INGRESO';

-- Query 3: Navegación jerárquica (total Gastos Fijos)
WITH RECURSIVE account_tree AS (
  SELECT account_id FROM dim_account WHERE account_code = 'GAS.FIJ'
  UNION ALL
  SELECT a.account_id FROM dim_account a JOIN account_tree t ON a.parent_id = t.account_id
)
SELECT SUM(f.amount_clp) AS total_gastos_fijos
FROM fact_financial f
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.account_base_id IN (SELECT account_id FROM account_tree WHERE is_base_member = TRUE)
  AND s.scenario_code = 'BUDGET' 
  AND t.year = 2026 AND t.month = 4; -- Lookup por semántica (año/mes), no por ID técnico
```

**Criterio de éxito:** Todas las queries retornan en <100ms y resultados coinciden con expectativa legacy.

---

## 6. Política de IDs del Modelo Nuevo

### 6.1 Generación de IDs Propios (Sin Dependencia de Legacy)

**Principio:** IDs del modelo nuevo se generan con secuencias AUTOINCREMENT propias.

**NO usar:**
- IDs legacy como primary key
- Offsets basados en IDs legacy (ej: 100+IngresoBase.id)
- Fórmulas derivadas de fechas/años (ej: year*100+month)

**Estrategia:**

1. **dim_account:** AUTOINCREMENT puro (sin semántica de negocio)
   - **account_id:** Técnico, generado por AUTOINCREMENT (SQLite asigna secuencia: 1, 2, 3, 4, ...)
   - **account_code:** Semántico, identifica categoría de negocio ('INGRESOS', 'ING.001', 'GAS.FIJ', etc.)
   - **parent_id:** Relación lógica (apunta a otro account_id), no rangos ni convenciones numéricas
   
   ```sql
   -- Ejemplo ilustrativo: Crear nodo padre INGRESOS
   INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member)
   VALUES ('INGRESOS', 'Ingresos', NULL, 0, FALSE);
   -- SQLite asigna account_id técnico (ej: 5)
   
   -- Crear miembros base bajo INGRESOS (parent_id apunta al registro padre)
   INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member)
   SELECT 
     'ING.001' AS account_code,
     'Sueldo Principal' AS account_name,
     (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS') AS parent_id,
     2 AS level,
     TRUE AS is_base_member;
   -- SQLite asigna account_id técnico (ej: 6, 7, 8, ...)
   -- parent_id = 5 (relación al nodo INGRESOS), no por convención numérica sino por lookup
   ```

2. **dim_scenario:** AUTOINCREMENT técnico
   - scenario_id generado automáticamente (1, 2, 3, ...)
   - scenario_code lleva semántica ('BUDGET', 'ACTUAL')

3. **dim_time:** AUTOINCREMENT secuencial
   
   ```sql
   -- Secuencia técnica limpia, no derivada de fechas/años
   INSERT INTO dim_time (year, month, year_month, quarter)
   VALUES (2026, 1, '2026-01', 1);
   -- time_id se genera automáticamente: 1, 2, 3, ... (técnico)
   -- year_month ('2026-01') lleva semántica de negocio
   ```

4. **fact_financial:** AUTOINCREMENT (PK técnica, grano es composite unique)

**Resultado:** Modelo nuevo con identidad técnica propia. Toda semántica de negocio vive en columnas `*_code`, `*_name`, no en `*_id`.

### 6.2 Tabla de Mapeo Temporal (Solo Durante Migración)

⚠️ **TEMPORAL - No forma parte de la arquitectura final**

**Tabla auxiliar para scripts de migración:**

```sql
CREATE TABLE legacy_account_mapping (
  map_id            INTEGER PRIMARY KEY AUTOINCREMENT,
  legacy_type       TEXT NOT NULL,    -- 'INGRESOS' | 'AHORROS' | 'SUSCRIPCIONES' | etc.
  legacy_id         INTEGER NOT NULL, -- ID en tabla legacy (IngresoBase.id, Ahorro.id, etc.)
  legacy_category   TEXT,             -- Para ActualEntry: 'INGRESOS', 'SUSCRIPCIONES', etc.
  legacy_item_key   TEXT,             -- Para ActualEntry: 'ingreso:1', 'sub:5', etc.
  legacy_name       TEXT,             -- Nombre legacy (para debugging)
  new_account_id    INTEGER NOT NULL, -- ID en dim_account
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(legacy_type, legacy_id),
  UNIQUE(legacy_category, legacy_item_key),
  FOREIGN KEY (new_account_id) REFERENCES dim_account(account_id)
);
```

**Uso durante migración:**

```sql
-- Paso 1: Popular dim_account desde catálogos legacy
INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member, account_type)
SELECT ...FROM IngresoBase;

-- Paso 2: Guardar mapeo legacy→nuevo (lookup por relación lógica, no ID hardcodeado)
INSERT INTO legacy_account_mapping (legacy_type, legacy_id, new_account_id, legacy_name)
SELECT 
  'INGRESOS',
  ib.id,
  da.account_id,
  ib.nombre
FROM IngresoBase ib
JOIN dim_account da ON da.account_name = ib.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS');

-- Paso 3: Usar mapeo para migrar facts
INSERT INTO fact_financial (...)
SELECT ...
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = pres.ingresoId;
```

**Eliminación obligatoria post-migración:**

```sql
-- Después de validar migración exitosa, ELIMINAR tabla de mapeo
DROP TABLE legacy_account_mapping;
-- Ya no es necesaria, modelo nuevo es autónomo
```

⚠️ **CRÍTICO:**
- Esta tabla NO debe usarse en runtime
- NO debe ser usada por frontend
- NO debe ser usada por endpoints del modelo nuevo (solo por scripts de migración)
- Debe eliminarse completamente una vez terminada y validada la migración
- Si se mantiene por auditoría, mover a schema `migration_archive` (fuera de operación)

### 6.3 No-Dependencias Estructurales

**❌ NUNCA hacer:**

```sql
-- Mal: FK desde modelo nuevo hacia legacy
CREATE TABLE dim_account (
  account_id INTEGER PRIMARY KEY,
  legacy_ingreso_id INTEGER, -- ❌ Contamina dimensión
  FOREIGN KEY (legacy_ingreso_id) REFERENCES IngresoBase(id) -- ❌ Dependencia estructural
);

-- Mal: Columna de mapeo permanente
ALTER TABLE dim_account ADD COLUMN legacy_source_table TEXT; -- ❌ Metadata legacy en modelo nuevo

-- Mal: Reutilizar IDs legacy
INSERT INTO dim_account (account_id, ...) 
SELECT id, ... FROM IngresoBase; -- ❌ account_id = IngresoBase.id
```

**✅ SIEMPRE hacer:**

```sql
-- Bien: Generación independiente, mapeo temporal en tabla puente
INSERT INTO dim_account (account_code, account_name, ...)
SELECT DISTINCT nombre, ... FROM IngresoBase;
-- IDs generados automáticamente, sin relación con IDs legacy

-- Usar tabla puente solo durante migración
SELECT m.new_account_id 
FROM legacy_account_mapping m 
WHERE m.legacy_type = 'INGRESOS' AND m.legacy_id = ?;
-- Eliminar tabla puente después
```

---

## 7. Criterio para Histórico Adicional (Post-Migración)

### 7.1 Definición de Histórico Adicional

**Qué es:** Datos anteriores a 2025 que NO se migraron en fase inicial.

**Ejemplo:**
- Presupuesto 2020-2024
- Actual 2020-2024
- Catálogos obsoletos con ítems usados en años pasados

### 7.2 Criterio de Decisión: Migrar o No

**Migrar SI:**

1. **Usuario lo solicita explícitamente:**
   - "Necesito ver presupuesto vs actual de 2023 para comparar tendencias"
   - Migración incremental bajo demanda

2. **Análisis de tendencias requiere histórico:**
   - Promedio de gasto en servicios básicos últimos 3 años
   - Crecimiento anual de ingresos

3. **Auditoría o compliance:**
   - Regulación requiere mantener histórico accesible en modelo operativo

**NO migrar SI:**

1. **Solo consulta esporádica:**
   - Usuario quiere ver "cuánto gasté en Netflix en 2022"
   - Solución: Query directo a legacy_archive (read-only)

2. **Datos incompletos o de baja calidad:**
   - Años donde hubo pocos registros (uso experimental)
   - Datos sin validar

3. **Catálogos obsoletos sin uso actual:**
   - Ítems que existieron en 2021 pero ya no están activos y no aparecen en facts recientes

### 7.3 Estrategia de Migración Incremental

**Fase 1: Migración Base (YA HECHA)**
- Presupuesto 2026
- Actual 2025-2026
- Catálogos activos

**Fase 2: Migración Incremental (Bajo Demanda)**

```sql
-- Script parametrizado para migrar año adicional
-- Parámetro: @target_year (ej: 2024)

-- Paso 1: Migrar presupuesto del año
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source)
SELECT 
  t.time_id, 
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'), 
  m.new_account_id, 
  ROUND(pres.enero), 
  'migrated_legacy_incremental'
FROM PresupuestoIngreso pres
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = pres.ingresoId
JOIN dim_time t ON t.year = @target_year AND t.month = 1
WHERE pres.anio = @target_year;
-- Repetir para demás categorías y meses

-- Paso 2: Migrar actual del año
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, is_paid, source)
SELECT 
  t.time_id, 
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'ACTUAL'), 
  m.new_account_id, 
  ae.amountClp, 
  ae.isPaid, 
  'migrated_legacy_incremental'
FROM ActualEntry ae
JOIN dim_time t ON t.year = ae.year AND t.month = ae.month
JOIN legacy_account_mapping m ON m.legacy_category = ae.category AND m.legacy_item_key = ae.itemKey
WHERE ae.year = @target_year;

-- Paso 3: Validar migración
SELECT 
  (SELECT SUM(...) FROM legacy WHERE year = @target_year) AS legacy_total,
  (SELECT SUM(...) FROM fact_financial WHERE year = @target_year) AS nuevo_total,
  ABS(legacy_total - nuevo_total) / legacy_total * 100 AS diff_pct;
```

⚠️ **IMPORTANTE:** Si se requiere migración incremental futura:
- **Opción A (Recomendada):** Recrear tabla de mapeo temporalmente solo durante la migración incremental, luego eliminarla nuevamente
- **Opción B:** Si legacy está archivado como SQL dump, hacer mapeo por nombre (account_name match) en lugar de IDs legacy
- **Nunca:** Mantener tabla de mapeo como parte permanente de la arquitectura

### 7.4 Consultas a Histórico No Migrado (Plan B - No MVP)

⚠️ **NO es parte del diseño base:** Vistas híbridas y consultas federadas son contingencia, no arquitectura principal.

**MVP:** Modelo nuevo opera independiente con datos 2025-2026. Histórico anterior está en legacy_archive (read-only backup).

**Si eventualmente se necesita histórico anterior:**

**Opción 1 (Recomendada):** Migración incremental bajo demanda
- Ejecutar script de migración para año específico
- Incorporar datos a modelo nuevo
- Eliminar dependencia de legacy

**Opción 2 (Contingencia):** Query directo a legacy_archive
```sql
-- Usuario quiere ver datos de 2023 (no migrado)
SELECT * FROM legacy_archive.ActualEntry WHERE year = 2023;
-- Respuesta directa, sin integrar al modelo nuevo
```

**Opción 3 (Última Alternativa):** Vista unificada temporal
```sql
-- Solo si migración incremental no es viable
CREATE VIEW vw_actual_historical AS
SELECT t.year, t.month, a.account_name, f.amount_clp FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_account a ON f.account_base_id = a.account_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE s.scenario_code = 'ACTUAL' -- Lookup por código semántico, no ID técnico
UNION ALL
SELECT year, month, label, amountClp FROM legacy_archive.ActualEntry WHERE year < 2025;
```

**Preferencia:** Migrar incrementalmente si es necesario, no mantener convivencia permanente.

---

## 8. Resumen Ejecutivo

### 8.1 Modelo Nuevo: Autónomo y Limpio

✅ **Independencia total:**
- IDs propios con AUTOINCREMENT (sin offsets ni dependencia de IDs legacy)
- Sin FKs hacia tablas legacy
- Sin columnas `legacy_*` en dimensiones
- Sin tablas de mapeo en arquitectura final

✅ **Migración como proceso puntual:**
- Legacy → Nuevo (una sola vez, batch ETL)
- Scripts de migración separados del código operativo
- Tabla de mapeo temporal (eliminar obligatoriamente post-migración)
- Legacy queda como respaldo (SQL dump, CSV exports, schema archive)

### 8.2 Datos Migrados vs. Archivados

**Migrados al modelo nuevo (Alta prioridad):**
- Presupuesto 2026 (año vigente)
- Actual 2025-2026 (comparación año actual + anterior)
- Catálogos activos (operación continua)

**Archivados en legacy (Baja prioridad, acceso read-only):**
- Presupuesto 2020-2024 (histórico antiguo)
- Actual 2020-2024 (histórico antiguo)
- Catálogos inactivos
- Metadatos de auditoría legacy

**Tablas auxiliares (Fuera de modelo dimensional):**
- `budget_rules` (reglas de cálculo: periodicidad, cuotas)
- `raw_imports` (staging de imports: Gmail, CSV)
- `assumptions` (supuestos UF, configuraciones)

### 8.3 Validación de Integridad

**Checklist obligatorio pre-cutover:**
- [ ] Backup completo legacy
- [ ] Dimensiones completas (account, scenario, time)
- [ ] Facts migrados (presupuesto + actual)
- [ ] Validación totales (±0.1%)
- [ ] Validación FKs (sin huérfanos)
- [ ] Tests de queries UX
- [ ] Smoke tests frontend

**Checklist post-cutover (después de activar modelo nuevo):**
- [ ] Congelación escritura legacy (triggers)
- [ ] Deprecar endpoints legacy
- [ ] Archivar legacy como respaldo
- [ ] Eliminar tabla de mapeo temporal
- [ ] Cleanup código legacy

### 8.4 Histórico Adicional (Opcional)

**Criterio:** Migrar histórico adicional (<2025) solo si:
1. Usuario lo solicita explícitamente
2. Análisis requiere tendencias multi-año
3. Compliance/auditoría lo requiere

**Estrategia preferida:**
- Migración incremental (script parametrizado por año)
- Incorporar al modelo nuevo definitivamente
- No mantener vistas híbridas permanentes

**Plan B:** Query directo a legacy_archive para consultas esporádicas

### 8.5 Timeline Simplificado

| Fase | Duración | Actividades Clave |
|------|----------|-------------------|
| **Preparación** | 1 semana | Backup legacy (SQL dump + CSV), crear schema nuevo, diseñar scripts |
| **Carga Inicial** | 1-2 semanas | Popular dimensiones, migrar facts (2026 + 2025-2026), validar integridad |
| **Cutover** | 1 semana | Freeze legacy, activar modelo nuevo, migrar endpoints, validar UX |
| **Consolidación** | 1 semana | Archivar legacy, eliminar artefactos temporales (tabla mapeo), cleanup código |

**Total:** 4-5 semanas

**Nota:** Legacy solo se congela en Fase 3 (post-cutover validado), no antes.

---

**Fin del documento**
