-- ===================================================================
-- SCRIPT 04: Migrar Actual 2025-2026 → fact_financial
-- ===================================================================
-- Fecha: 2026-04-05
-- Descripción: Migra gastos/ingresos reales ejecutados
-- desde ActualEntry (ya normalizado, más simple que presupuesto)
-- ===================================================================

ATTACH DATABASE './prisma/dev.db' AS legacy;

-- ===================================================================
-- 1. MIGRAR ActualEntry 2025-2026
-- ===================================================================

INSERT INTO fact_financial (
  time_id, 
  scenario_id, 
  account_base_id, 
  amount_clp, 
  is_paid,
  source, 
  created_at, 
  updated_at
)
SELECT 
  t.time_id,
  2 AS scenario_id, -- ACTUAL
  m.new_account_id AS account_base_id,
  ae.amount_clp,
  ae.is_paid,
  'migrated_legacy' AS source,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.actual_entries ae
JOIN dim_time t ON t.year = ae.year AND t.month = ae.month
JOIN legacy_account_mapping m ON m.legacy_category = ae.category AND m.legacy_item_key = ae.item_key
WHERE ae.year >= 2025;

-- ===================================================================
-- 2. CASOS ESPECIALES: AJUSTES (sin itemKey fijo)
-- ===================================================================
-- Ajustes tienen label libre, todos van al mismo account_base_id genérico

INSERT INTO fact_financial (
  time_id, 
  scenario_id, 
  account_base_id, 
  amount_clp, 
  is_paid,
  source, 
  created_at, 
  updated_at
)
SELECT 
  t.time_id,
  2,
  (SELECT new_account_id FROM legacy_account_mapping WHERE legacy_type = 'AJUSTES'),
  ae.amount_clp,
  ae.is_paid,
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.actual_entries ae
JOIN dim_time t ON t.year = ae.year AND t.month = ae.month
WHERE ae.year >= 2025
  AND ae.category = 'AJUSTES'
  AND NOT EXISTS (
    SELECT 1 FROM legacy_account_mapping m 
    WHERE m.legacy_category = ae.category 
      AND m.legacy_item_key = ae.item_key
  );

-- ===================================================================
-- 3. VERIFICACIÓN ACTUAL 2025-2026
-- ===================================================================

SELECT '=== RESUMEN MIGRACIÓN ACTUAL 2025-2026 ===' AS titulo;

-- Total por año
SELECT 
  t.year,
  COUNT(*) AS facts_creados,
  SUM(f.amount_clp) AS total_anual,
  SUM(CASE WHEN f.is_paid = 1 THEN 1 ELSE 0 END) AS pagados,
  SUM(CASE WHEN f.is_paid = 0 THEN 1 ELSE 0 END) AS pendientes
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2 
  AND t.year >= 2025
  AND f.source = 'migrated_legacy'
GROUP BY t.year;

-- Total por categoría
SELECT 
  CASE 
    WHEN da.account_code LIKE 'ING.%' THEN 'INGRESOS'
    WHEN da.account_code LIKE 'AHO.%' THEN 'AHORROS'
    WHEN da.account_code LIKE 'GAS.SUS.%' THEN 'SUSCRIPCIONES'
    WHEN da.account_code LIKE 'GAS.SER.%' THEN 'SERVICIOS_BASICOS'
    WHEN da.account_code LIKE 'GAS.OBL.%' THEN 'OBLIGACIONES'
    WHEN da.account_code LIKE 'GAS.HIP.%' THEN 'HIPOTECARIO'
    WHEN da.account_code LIKE 'GAS.SUP.%' THEN 'SUPERMERCADO'
    WHEN da.account_code LIKE 'GAS.AJU.%' THEN 'AJUSTES'
  END AS categoria,
  COUNT(*) AS facts_creados,
  SUM(f.amount_clp) AS total
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2 
  AND t.year >= 2025
  AND f.source = 'migrated_legacy'
GROUP BY categoria;

-- Comparar count legacy vs nuevo
SELECT 
  'Total ActualEntry legacy 2025-2026:' AS descripcion,
  COUNT(*) AS total_legacy
FROM legacy.actual_entries
WHERE year >= 2025
UNION ALL
SELECT 
  'Total fact_financial migrado:',
  COUNT(*)
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2 
  AND t.year >= 2025
  AND f.source = 'migrated_legacy';

DETACH DATABASE legacy;
