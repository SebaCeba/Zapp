-- ===================================================================
-- SCRIPT 01: Popular dim_account con Miembros Base desde Legacy
-- ===================================================================
-- Fecha: 2026-04-05
-- Descripción: Migra catálogos legacy a dim_account (miembros base)
-- Precondición: Estructura base de dim_account ya creada (ROOT, categorías)
-- ===================================================================

-- Attachar base de datos legacy para consultas
ATTACH DATABASE './prisma/dev.db' AS legacy;

-- ===================================================================
-- 1. INGRESOS: Desde IngresoBase
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'ING.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY orden, id)) AS account_code,
  nombre AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'INGRESOS') AS parent_id,
  2 AS level,
  1 AS is_base_member,
  'INGRESO' AS account_type,
  orden AS sort_order,
  activo AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.ingresos_base
ORDER BY orden, id;

-- ===================================================================
-- 2. AHORROS: Desde Ahorro
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'AHO.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY orden, id)) AS account_code,
  nombre AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'AHORROS') AS parent_id,
  2 AS level,
  1 AS is_base_member,
  'AHORRO' AS account_type,
  orden AS sort_order,
  activo AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.ahorros
ORDER BY orden, id;

-- ===================================================================
-- 3. SUSCRIPCIONES: Desde Subscription
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'GAS.SUS.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY id)) AS account_code,
  name AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SUS') AS parent_id,
  3 AS level,
  1 AS is_base_member,
  'GASTO' AS account_type,
  ROW_NUMBER() OVER (ORDER BY id) AS sort_order,
  1 AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.subscriptions
ORDER BY id;

-- ===================================================================
-- 4. SERVICIOS BÁSICOS: Desde ServicioBasico
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'GAS.SER.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY orden, id)) AS account_code,
  nombre AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SER') AS parent_id,
  3 AS level,
  1 AS is_base_member,
  'GASTO' AS account_type,
  orden AS sort_order,
  activo AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.servicios_basicos
ORDER BY orden, id;

-- ===================================================================
-- 5. OBLIGACIONES: Desde Obligacion
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'GAS.OBL.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY id)) AS account_code,
  nombre AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.OBL') AS parent_id,
  3 AS level,
  1 AS is_base_member,
  'GASTO' AS account_type,
  ROW_NUMBER() OVER (ORDER BY id) AS sort_order,
  1 AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.obligaciones
ORDER BY id;

-- ===================================================================
-- 6. HIPOTECARIO - Dividendo (único, fijo)
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
VALUES (
  'GAS.HIP.DIV',
  'Dividendo Hipotecario',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.HIP'),
  3,
  1,
  'GASTO',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ===================================================================
-- 7. HIPOTECARIO - Seguros: Desde MortgageInsurance
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
SELECT 
  'GAS.HIP.SEG.' || printf('%03d', ROW_NUMBER() OVER (ORDER BY id)) AS account_code,
  nombre AS account_name,
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.HIP') AS parent_id,
  3 AS level,
  1 AS is_base_member,
  'GASTO' AS account_type,
  ROW_NUMBER() OVER (ORDER BY id) + 1 AS sort_order, -- +1 porque DIV es sort_order=1
  1 AS is_active,
  CURRENT_TIMESTAMP AS created_at,
  CURRENT_TIMESTAMP AS updated_at
FROM legacy.mortgage_insurance
ORDER BY id;

-- ===================================================================
-- 8. SUPERMERCADO (único, fijo)
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
VALUES (
  'GAS.SUP.TOT',
  'Supermercado',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.SUP'),
  3,
  1,
  'GASTO',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ===================================================================
-- 9. AJUSTES (único, genérico)
-- ===================================================================

INSERT INTO dim_account (
  account_code, 
  account_name, 
  parent_id, 
  level, 
  is_base_member, 
  account_type, 
  sort_order, 
  is_active,
  created_at,
  updated_at
)
VALUES (
  'GAS.AJU.MAN',
  'Ajustes Manuales',
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS.AJU'),
  3,
  1,
  'GASTO',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ===================================================================
-- 10. VERIFICACIÓN
-- ===================================================================

SELECT 
  'Miembros base creados:' AS descripcion,
  COUNT(*) AS total
FROM dim_account
WHERE is_base_member = 1;

SELECT 
  'Por categoría:' AS descripcion,
  CASE 
    WHEN account_code LIKE 'ING.%' THEN 'INGRESOS'
    WHEN account_code LIKE 'AHO.%' THEN 'AHORROS'
    WHEN account_code LIKE 'GAS.SUS.%' THEN 'SUSCRIPCIONES'
    WHEN account_code LIKE 'GAS.SER.%' THEN 'SERVICIOS_BASICOS'
    WHEN account_code LIKE 'GAS.OBL.%' THEN 'OBLIGACIONES'
    WHEN account_code LIKE 'GAS.HIP.%' THEN 'HIPOTECARIO'
    WHEN account_code LIKE 'GAS.SUP.%' THEN 'SUPERMERCADO'
    WHEN account_code LIKE 'GAS.AJU.%' THEN 'AJUSTES'
  END AS categoria,
  COUNT(*) AS cantidad
FROM dim_account
WHERE is_base_member = 1
GROUP BY categoria;

-- Detach legacy database
DETACH DATABASE legacy;
