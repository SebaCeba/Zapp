-- ===================================================================
-- SCRIPT 02: Crear Tabla de Mapeo Legacy → Nuevo Modelo
-- ===================================================================
-- Fecha: 2026-04-05
-- Descripción: Genera mapeo temporal entre IDs legacy y account_id nuevo
-- Precondición: dim_account poblada con miembros base (script 01)
-- Postcondición: legacy_account_mapping lista para migración de facts
-- ⚠️ TEMPORAL: Esta tabla debe eliminarse post-migración
-- ===================================================================

-- Attachar base de datos legacy
ATTACH DATABASE './prisma/dev.db' AS legacy;

-- ===================================================================
-- 1. MAPEO: IngresoBase → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'INGRESOS' AS legacy_type,
  ib.id AS legacy_id,
  'INGRESOS' AS legacy_category,
  'ingreso:' || ib.id AS legacy_item_key,
  ib.nombre AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.ingresos_base ib
JOIN dim_account da ON da.account_name = ib.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS')
  AND da.is_base_member = 1;

-- ===================================================================
-- 2. MAPEO: Ahorro → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'AHORROS' AS legacy_type,
  a.id AS legacy_id,
  'AHORROS' AS legacy_category,
  'ahorro:' || a.id AS legacy_item_key,
  a.nombre AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.ahorros a
JOIN dim_account da ON da.account_name = a.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'AHORROS')
  AND da.is_base_member = 1;

-- ===================================================================
-- 3. MAPEO: Subscription → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'SUSCRIPCIONES' AS legacy_type,
  s.id AS legacy_id,
  'SUSCRIPCIONES' AS legacy_category,
  'sub:' || s.id AS legacy_item_key,
  s.name AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.subscriptions s
JOIN dim_account da ON da.account_name = s.name 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SUS')
  AND da.is_base_member = 1;

-- ===================================================================
-- 4. MAPEO: ServicioBasico → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'SERVICIOS_BASICOS' AS legacy_type,
  sb.id AS legacy_id,
  'SERVICIOS_BASICOS' AS legacy_category,
  'serv:' || sb.id AS legacy_item_key,
  sb.nombre AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.servicios_basicos sb
JOIN dim_account da ON da.account_name = sb.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SER')
  AND da.is_base_member = 1;

-- ===================================================================
-- 5. MAPEO: Obligacion → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'OBLIGACIONES' AS legacy_type,
  o.id AS legacy_id,
  'OBLIGACIONES' AS legacy_category,
  'oblig:' || o.id AS legacy_item_key,
  o.nombre AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.obligaciones o
JOIN dim_account da ON da.account_name = o.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'GAS.OBL')
  AND da.is_base_member = 1;

-- ===================================================================
-- 6. MAPEO: Dividendo Hipotecario (único, fijo)
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
VALUES (
  'HIPOTECARIO',
  NULL,
  'HIPOTECARIO',
  'hip:dividendo',
  'Dividendo Hipotecario',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.HIP.DIV')
);

-- ===================================================================
-- 7. MAPEO: MortgageInsurance → dim_account
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
SELECT 
  'HIPOTECARIO_SEGURO' AS legacy_type,
  mi.id AS legacy_id,
  'HIPOTECARIO' AS legacy_category,
  'hip:seguro:' || mi.id AS legacy_item_key,
  mi.nombre AS legacy_name,
  da.account_id AS new_account_id
FROM legacy.mortgage_insurance mi
JOIN dim_account da ON da.account_name = mi.nombre 
  AND da.parent_id = (SELECT account_id FROM dim_account WHERE account_code = 'GAS.HIP')
  AND da.is_base_member = 1;

-- ===================================================================
-- 8. MAPEO: Supermercado (único, fijo)
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
VALUES (
  'SUPERMERCADO',
  NULL,
  'SUPERMERCADO',
  'sm:total',
  'Supermercado',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SUP.TOT')
);

-- ===================================================================
-- 9. MAPEO: Ajustes (único, genérico)
-- ===================================================================

INSERT INTO legacy_account_mapping (
  legacy_type,
  legacy_id,
  legacy_category,
  legacy_item_key,
  legacy_name,
  new_account_id
)
VALUES (
  'AJUSTES',
  NULL,
  'AJUSTES',
  NULL, -- Ajustes no tienen itemKey fijo (label libre)
  'Ajustes Manuales',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.AJU.MAN')
);

-- ===================================================================
-- 10. VERIFICACIÓN
-- ===================================================================

SELECT 
  '=== RESUMEN DE MAPEO LEGACY → NUEVO ===' AS titulo;

SELECT 
  legacy_type,
  COUNT(*) AS cantidad_mapeos
FROM legacy_account_mapping
GROUP BY legacy_type
ORDER BY legacy_type;

-- Verificar que todos los nuevos account_id son válidos
SELECT 
  'Validación FK: Todos los new_account_id existen en dim_account' AS validacion,
  COUNT(*) AS mapeos_validos
FROM legacy_account_mapping m
WHERE EXISTS (
  SELECT 1 FROM dim_account da 
  WHERE da.account_id = m.new_account_id 
    AND da.is_base_member = 1
);

-- Total esperado igual a total de mapeos
SELECT 
  'Total mapeos creados:' AS descripcion,
  COUNT(*) AS total
FROM legacy_account_mapping;

-- Detach legacy database
DETACH DATABASE legacy;
