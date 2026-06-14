-- ===================================================================
-- SCRIPT 05: Validación Completa de Migración
-- ===================================================================
-- Fecha: 2026-04-05
-- Descripción: Valida integridad de datos migrados
-- Compara totales legacy vs nuevo modelo
-- ===================================================================

ATTACH DATABASE './prisma/dev.db' AS legacy;

-- ===================================================================
-- 1. VALIDACIÓN: dim_account
-- ===================================================================

SELECT '=== 1. VALIDACIÓN dim_account ===' AS seccion;

-- Contar nodos totales
SELECT 
  'Total nodos dim_account:' AS descripcion,
  COUNT(*) AS total
FROM dim_account;

-- Contar miembros base
SELECT 
  'Miembros base (is_base_member=TRUE):' AS descripcion,
  COUNT(*) AS total
FROM dim_account
WHERE is_base_member = 1;

-- Validar jerarquía (no ciclos, parent_id válidos)
SELECT 
  'Nodos huérfanos (parent_id inválido):' AS descripcion,
  COUNT(*) AS total
FROM dim_account da
WHERE da.parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM dim_account parent 
    WHERE parent.account_id = da.parent_id
  );

-- Esperado: 0 nodos huérfanos

-- ===================================================================
-- 2. VALIDACIÓN: Mapeo Legacy
-- ===================================================================

SELECT '=== 2. VALIDACIÓN legacy_account_mapping ===' AS seccion;

-- Total mapeos creados
SELECT 
  legacy_type,
  COUNT(*) AS cantidad
FROM legacy_account_mapping
GROUP BY legacy_type
ORDER BY legacy_type;

-- Validar que todos los new_account_id existen
SELECT 
  'Mapeos con new_account_id inválido:' AS descripcion,
  COUNT(*) AS total
FROM legacy_account_mapping m
WHERE NOT EXISTS (
  SELECT 1 FROM dim_account da 
  WHERE da.account_id = m.new_account_id
);

-- Esperado: 0

-- ===================================================================
-- 3. VALIDACIÓN: Presupuesto 2026
-- ===================================================================

SELECT '=== 3. VALIDACIÓN Presupuesto 2026 ===' AS seccion;

-- Comparar total INGRESOS 2026
SELECT 
  'INGRESOS 2026 - Total Legacy:' AS descripcion,
  CAST(SUM(enero + febrero + marzo + abril + mayo + junio + julio + agosto + septiembre + octubre + noviembre + diciembre) AS INTEGER) AS total
FROM legacy.presupuestos_ingresos
WHERE anio = 2026
UNION ALL
SELECT 
  'INGRESOS 2026 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1
  AND t.year = 2026
  AND da.account_code LIKE 'ING.%';

-- Comparar total AHORROS 2026
SELECT 
  'AHORROS 2026 - Total Legacy:' AS descripcion,
  CAST(SUM(enero + febrero + marzo + abril + mayo + junio + julio + agosto + septiembre + octubre + noviembre + diciembre) AS INTEGER) AS total
FROM legacy.presupuestos_ahorros
WHERE anio = 2026
UNION ALL
SELECT 
  'AHORROS 2026 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1
  AND t.year = 2026
  AND da.account_code LIKE 'AHO.%';

-- Comparar total SERVICIOS BÁSICOS 2026
SELECT 
  'SERVICIOS BÁSICOS 2026 - Total Legacy:' AS descripcion,
  CAST(SUM(enero + febrero + marzo + abril + mayo + junio + julio + agosto + septiembre + octubre + noviembre + diciembre) AS INTEGER) AS total
FROM legacy.presupuestos_servicios_basicos
WHERE anio = 2026
UNION ALL
SELECT 
  'SERVICIOS BÁSICOS 2026 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1
  AND t.year = 2026
  AND da.account_code LIKE 'GAS.SER.%';

-- Comparar total SUPERMERCADO 2026
SELECT 
  'SUPERMERCADO 2026 - Total Legacy:' AS descripcion,
  CAST(SUM(enero + febrero + marzo + abril + mayo + junio + julio + agosto + septiembre + octubre + noviembre + diciembre) AS INTEGER) AS total
FROM legacy.supermercado_presupuesto
WHERE anio = 2026
UNION ALL
SELECT 
  'SUPERMERCADO 2026 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1
  AND t.year = 2026
  AND da.account_code LIKE 'GAS.SUP.%';

-- ===================================================================
-- 4. VALIDACIÓN: Actual 2025-2026
-- ===================================================================

SELECT '=== 4. VALIDACIÓN Actual 2025-2026 ===' AS seccion;

-- Comparar COUNT
SELECT 
  'ActualEntry Legacy 2025-2026 - COUNT:' AS descripcion,
  COUNT(*) AS total
FROM legacy.actual_entries
WHERE year >= 2025
UNION ALL
SELECT 
  'fact_financial Nuevo 2025-2026 - COUNT:',
  COUNT(*)
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2
  AND t.year >= 2025
  AND f.source = 'migrated_legacy';

-- Comparar SUM por año
SELECT 
  'Actual 2025 - Total Legacy:' AS descripcion,
  SUM(amount_clp) AS total
FROM legacy.actual_entries
WHERE year = 2025
UNION ALL
SELECT 
  'Actual 2025 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2
  AND t.year = 2025
  AND f.source = 'migrated_legacy';

SELECT 
  'Actual 2026 - Total Legacy:' AS descripcion,
  SUM(amount_clp) AS total
FROM legacy.actual_entries
WHERE year = 2026
UNION ALL
SELECT 
  'Actual 2026 - Total Nuevo:',
  SUM(f.amount_clp)
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2
  AND t.year = 2026
  AND f.source = 'migrated_legacy';

-- ===================================================================
-- 5. VALIDACIÓN: Integridad Referencial
-- ===================================================================

SELECT '=== 5. VALIDACIÓN Integridad Referencial ===' AS seccion;

-- Facts huérfanos (time_id inválido)
SELECT 
  'Facts con time_id inválido:' AS descripcion,
  COUNT(*) AS total
FROM fact_financial f
WHERE NOT EXISTS (SELECT 1 FROM dim_time t WHERE t.time_id = f.time_id);

-- Facts huérfanos (scenario_id inválido)
SELECT 
  'Facts con scenario_id inválido:' AS descripcion,
  COUNT(*) AS total
FROM fact_financial f
WHERE NOT EXISTS (SELECT 1 FROM dim_scenario s WHERE s.scenario_id = f.scenario_id);

-- Facts huérfanos (account_base_id inválido)
SELECT 
  'Facts con account_base_id inválido:' AS descripcion,
  COUNT(*) AS total
FROM fact_financial f
WHERE NOT EXISTS (SELECT 1 FROM dim_account a WHERE a.account_id = f.account_base_id);

-- Facts con account_base_id que NO es base member (error)
SELECT 
  'Facts apuntando a nodos NO base:' AS descripcion,
  COUNT(*) AS total
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
WHERE da.is_base_member = 0;

-- ===================================================================
-- 6. VALIDACIÓN: Grano de fact_financial
-- ===================================================================

SELECT '=== 6. VALIDACIÓN Grano Único ===' AS seccion;

-- Detectar duplicados (violación de grano)
SELECT 
  'Facts duplicados (time+scenario+account):' AS descripcion,
  COUNT(*) AS total
FROM (
  SELECT time_id, scenario_id, account_base_id, COUNT(*) as cnt
  FROM fact_financial
  GROUP BY time_id, scenario_id, account_base_id
  HAVING COUNT(*) > 1
);

-- Esperado: 0

-- ===================================================================
-- 7. RESUMEN FINAL
-- ===================================================================

SELECT '=== RESUMEN FINAL MIGRACIÓN ===' AS seccion;

SELECT 
  'Total facts creados (BUDGET 2026):' AS descripcion,
  COUNT(*) AS total,
  SUM(amount_clp) AS monto_total
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 1 AND t.year = 2026;

SELECT 
  'Total facts creados (ACTUAL 2025-2026):' AS descripcion,
  COUNT(*) AS total,
  SUM(amount_clp) AS monto_total
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
WHERE f.scenario_id = 2 AND t.year >= 2025;

SELECT 
  'GRAND TOTAL facts en fact_financial:' AS descripcion,
  COUNT(*) AS total,
  SUM(amount_clp) AS monto_total
FROM fact_financial;

-- ===================================================================
-- 8. CRITERIO DE ÉXITO
-- ===================================================================

SELECT '=== CRITERIO DE ÉXITO (CHECKLIST) ===' AS seccion;

SELECT 
  'Nodos huérfanos = 0' AS validacion,
  CASE 
    WHEN (SELECT COUNT(*) FROM dim_account da WHERE da.parent_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dim_account p WHERE p.account_id = da.parent_id)) = 0 
    THEN '✓ PASS' 
    ELSE '✗ FAIL' 
  END AS resultado;

SELECT 
  'Facts con FK inválidos = 0',
  CASE 
    WHEN (SELECT COUNT(*) FROM fact_financial f WHERE NOT EXISTS (SELECT 1 FROM dim_time t WHERE t.time_id = f.time_id)) = 0
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END;

SELECT 
  'Facts duplicados = 0',
  CASE 
    WHEN (SELECT COUNT(*) FROM (SELECT time_id, scenario_id, account_base_id FROM fact_financial GROUP BY 1,2,3 HAVING COUNT(*)>1)) = 0
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END;

SELECT 
  'Total presupuesto 2026 coincide (±1%)',
  CASE 
    WHEN ABS(
      (SELECT CAST(SUM(enero+feb+mar+abr+may+jun+jul+ago+sep+oct+nov+dic) AS REAL) FROM legacy.presupuestos_ingresos WHERE anio=2026) -
      (SELECT SUM(amount_clp) FROM fact_financial f JOIN dim_time t ON f.time_id=t.time_id WHERE f.scenario_id=1 AND t.year=2026)
    ) / (SELECT SUM(enero+feb+mar+abr+may+jun+jul+ago+sep+oct+nov+dic) FROM legacy.presupuestos_ingresos WHERE anio=2026) < 0.01
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END;

SELECT 
  'Total actual 2025-2026 coincide',
  CASE 
    WHEN (SELECT SUM(amount_clp) FROM legacy.actual_entries WHERE year>=2025) = 
         (SELECT SUM(amount_clp) FROM fact_financial f JOIN dim_time t ON f.time_id=t.time_id WHERE f.scenario_id=2 AND t.year>=2025)
    THEN '✓ PASS'
    ELSE '✗ FAIL'
  END;

DETACH DATABASE legacy;

-- FIN DE VALIDACIÓN
