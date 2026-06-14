-- ===================================================================
-- SCRIPT 03: Migrar Presupuesto 2026 → fact_financial
-- ===================================================================
-- Fecha: 2026-04-05
-- Descripción: Migra presupuesto vigente (2026) desde tablas legacy
-- Transforma 12 columnas mensuales → 12 registros por cada ítem
-- Precondición: dim_account, dim_scenario, dim_time, mapping table listos
-- ===================================================================

-- Attachar base de datos legacy
ATTACH DATABASE './prisma/dev.db' AS legacy;

-- Variable de escenario BUDGET
-- scenario_id para BUDGET (será 1)
-- SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET';

-- ===================================================================
-- 1. PRESUPUESTO INGRESOS 2026
-- ===================================================================

-- Enero
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.enero) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 1
WHERE p.anio = 2026 AND p.enero > 0;

-- Febrero
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.febrero) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 2
WHERE p.anio = 2026 AND p.febrero > 0;

-- Marzo
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.marzo) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 3
WHERE p.anio = 2026 AND p.marzo > 0;

-- Abril
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.abril) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 4
WHERE p.anio = 2026 AND p.abril > 0;

-- Mayo
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.mayo) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 5
WHERE p.anio = 2026 AND p.mayo > 0;

-- Junio
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.junio) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 6
WHERE p.anio = 2026 AND p.junio > 0;

-- Julio
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.julio) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 7
WHERE p.anio = 2026 AND p.julio > 0;

-- Agosto
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.agosto) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 8
WHERE p.anio = 2026 AND p.agosto > 0;

-- Septiembre
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.septiembre) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 9
WHERE p.anio = 2026 AND p.septiembre > 0;

-- Octubre
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.octubre) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 10
WHERE p.anio = 2026 AND p.octubre > 0;

-- Noviembre
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.noviembre) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 11
WHERE p.anio = 2026 AND p.noviembre > 0;

-- Diciembre
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
SELECT 
  t.time_id,
  (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'),
  m.new_account_id,
  CAST(ROUND(p.diciembre) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = 12
WHERE p.anio = 2026 AND p.diciembre > 0;

-- Progress
SELECT 'INGRESOS 2026 migrados' AS status, COUNT(*) AS facts_creados
FROM fact_financial 
WHERE source = 'migrated_legacy' 
  AND scenario_id = (SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET')
  AND account_base_id IN (SELECT new_account_id FROM legacy_account_mapping WHERE legacy_type = 'INGRESOS');

-- ===================================================================
-- Continúa en migrate_03b para AHORROS, SERVICIOS, SUPERMERCADO
-- (archivo separado por extensión)
-- ===================================================================

-- Detach legacy database
DETACH DATABASE legacy;
