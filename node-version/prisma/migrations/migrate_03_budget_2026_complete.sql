-- ===================================================================
-- SCRIPT 03 COMPLETO: Migrar TODO el Presupuesto 2026
-- ===================================================================
-- Fecha: 2026-04-05
-- Versión optimizada: Todas las categorías en un solo script
-- ===================================================================

ATTACH DATABASE './prisma/dev.db' AS legacy;

-- Helper: Obtener scenario_id BUDGET (será 1)
-- SELECT scenario_id FROM dim_scenario WHERE scenario_code = 'BUDGET'; -- = 1

-- ===================================================================
-- FUNCIÓN HELPER: Insertar 12 meses para una categoría
-- ===================================================================

-- Macro para evitar repetición: INGRESOS
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
WITH months(month, column_name) AS (
  VALUES (1, 'enero'), (2, 'febrero'), (3, 'marzo'), (4, 'abril'), (5, 'mayo'), (6, 'junio'),
         (7, 'julio'), (8, 'agosto'), (9, 'septiembre'), (10, 'octubre'), (11, 'noviembre'), (12, 'diciembre')
)
SELECT 
  t.time_id,
  1 AS scenario_id, -- BUDGET
  m.new_account_id,
  CAST(ROUND(
    CASE months.month
      WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
      WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
      WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
    END
  ) AS INTEGER) AS amount_clp,
  'migrated_legacy' AS source,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ingresos p
CROSS JOIN months
JOIN legacy_account_mapping m ON m.legacy_type = 'INGRESOS' AND m.legacy_id = p.ingreso_id
JOIN dim_time t ON t.year = 2026 AND t.month = months.month
WHERE p.anio = 2026
  AND CASE months.month
    WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
    WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
    WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
  END > 0;

-- AHORROS
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
WITH months(month) AS (
  VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
)
SELECT 
  t.time_id,
  1,
  m.new_account_id,
  CAST(ROUND(
    CASE months.month
      WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
      WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
      WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
    END
  ) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_ahorros p
CROSS JOIN months
JOIN legacy_account_mapping m ON m.legacy_type = 'AHORROS' AND m.legacy_id = p.ahorro_id
JOIN dim_time t ON t.year = 2026 AND t.month = months.month
WHERE p.anio = 2026
  AND CASE months.month
    WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
    WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
    WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
  END > 0;

-- SERVICIOS BÁSICOS
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
WITH months(month) AS (
  VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
)
SELECT 
  t.time_id,
  1,
  m.new_account_id,
  CAST(ROUND(
    CASE months.month
      WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
      WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
      WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
    END
  ) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.presupuestos_servicios_basicos p
CROSS JOIN months
JOIN legacy_account_mapping m ON m.legacy_type = 'SERVICIOS_BASICOS' AND m.legacy_id = p.servicio_id
JOIN dim_time t ON t.year = 2026 AND t.month = months.month
WHERE p.anio = 2026
  AND CASE months.month
    WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
    WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
    WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
  END > 0;

-- SUPERMERCADO
INSERT INTO fact_financial (time_id, scenario_id, account_base_id, amount_clp, source, created_at, updated_at)
WITH months(month) AS (
  VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10), (11), (12)
)
SELECT 
  t.time_id,
  1,
  (SELECT new_account_id FROM legacy_account_mapping WHERE legacy_type = 'SUPERMERCADO'),
  CAST(ROUND(
    CASE months.month
      WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
      WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
      WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
    END
  ) AS INTEGER),
  'migrated_legacy',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM legacy.supermercado_presupuesto p
CROSS JOIN months
JOIN dim_time t ON t.year = 2026 AND t.month = months.month
WHERE p.anio = 2026
  AND CASE months.month
    WHEN 1 THEN p.enero WHEN 2 THEN p.febrero WHEN 3 THEN p.marzo WHEN 4 THEN p.abril
    WHEN 5 THEN p.mayo WHEN 6 THEN p.junio WHEN 7 THEN p.julio WHEN 8 THEN p.agosto
    WHEN 9 THEN p.septiembre WHEN 10 THEN p.octubre WHEN 11 THEN p.noviembre WHEN 12 THEN p.diciembre
  END > 0;

-- ===================================================================
-- VERIFICACIÓN PRESUPUESTO 2026
-- ===================================================================

SELECT '=== RESUMEN MIGRACIÓN PRESUPUESTO 2026 ===' AS titulo;

SELECT 
  CASE 
    WHEN da.account_code LIKE 'ING.%' THEN 'INGRESOS'
    WHEN da.account_code LIKE 'AHO.%' THEN 'AHORROS'
    WHEN da.account_code LIKE 'GAS.SER.%' THEN 'SERVICIOS_BASICOS'
    WHEN da.account_code LIKE 'GAS.SUP.%' THEN 'SUPERMERCADO'
  END AS categoria,
  COUNT(*) AS facts_creados,
  SUM(f.amount_clp) AS total_anual
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1 
  AND t.year = 2026
  AND f.source = 'migrated_legacy'
GROUP BY categoria;

DETACH DATABASE legacy;
