-- ===================================================================
-- Script de Población Inicial de Dimensiones
-- Modelo Estrella - Zapp Financial Atelier
-- Fecha: 2026-04-05
-- ===================================================================

-- ===================================================================
-- 1. POBLAR dim_scenario (Escenarios: BUDGET, ACTUAL)
-- ===================================================================

INSERT INTO dim_scenario (scenario_code, scenario_name, scenario_type, description, is_active)
VALUES 
  ('BUDGET', 'Presupuesto', 'PLAN', 'Presupuesto planificado mensual/anual', 1),
  ('ACTUAL', 'Real', 'ACTUAL', 'Gastos e ingresos reales ejecutados', 1);

-- ===================================================================
-- 2. POBLAR dim_time (2020-2030, granularidad mensual)
-- ===================================================================

-- Generar 132 meses (11 años * 12 meses)
.mode list

-- Año 2020
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2020, 1, '2020-01', 'Enero', 1), (2020, 2, '2020-02', 'Febrero', 1), (2020, 3, '2020-03', 'Marzo', 1),
  (2020, 4, '2020-04', 'Abril', 2), (2020, 5, '2020-05', 'Mayo', 2), (2020, 6, '2020-06', 'Junio', 2),
  (2020, 7, '2020-07', 'Julio', 3), (2020, 8, '2020-08', 'Agosto', 3), (2020, 9,'2020-09', 'Septiembre', 3),
  (2020, 10, '2020-10', 'Octubre', 4), (2020, 11, '2020-11', 'Noviembre', 4), (2020, 12, '2020-12', 'Diciembre', 4);

-- Año 2021
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2021, 1, '2021-01', 'Enero', 1), (2021, 2, '2021-02', 'Febrero', 1), (2021, 3, '2021-03', 'Marzo', 1),
  (2021, 4, '2021-04', 'Abril', 2), (2021, 5, '2021-05', 'Mayo', 2), (2021, 6, '2021-06', 'Junio', 2),
  (2021, 7, '2021-07', 'Julio', 3), (2021, 8, '2021-08', 'Agosto', 3), (2021, 9, '2021-09', 'Septiembre', 3),
  (2021, 10, '2021-10', 'Octubre', 4), (2021, 11, '2021-11', 'Noviembre', 4), (2021, 12, '2021-12', 'Diciembre', 4);

-- Año 2022
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2022, 1, '2022-01', 'Enero', 1), (2022, 2, '2022-02', 'Febrero', 1), (2022, 3, '2022-03', 'Marzo', 1),
  (2022, 4, '2022-04', 'Abril', 2), (2022, 5, '2022-05', 'Mayo', 2), (2022, 6, '2022-06', 'Junio', 2),
  (2022, 7, '2022-07', 'Julio', 3), (2022, 8, '2022-08', 'Agosto', 3), (2022, 9, '2022-09', 'Septiembre', 3),
  (2022, 10, '2022-10', 'Octubre', 4), (2022, 11, '2022-11', 'Noviembre', 4), (2022, 12, '2022-12', 'Diciembre', 4);

-- Año 2023
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2023, 1, '2023-01', 'Enero', 1), (2023, 2, '2023-02', 'Febrero', 1), (2023, 3, '2023-03', 'Marzo', 1),
  (2023, 4, '2023-04', 'Abril', 2), (2023, 5, '2023-05', 'Mayo', 2), (2023, 6, '2023-06', 'Junio', 2),
  (2023, 7, '2023-07', 'Julio', 3), (2023, 8, '2023-08', 'Agosto', 3), (2023, 9, '2023-09', 'Septiembre', 3),
  (2023, 10, '2023-10', 'Octubre', 4), (2023, 11, '2023-11', 'Noviembre', 4), (2023, 12, '2023-12', 'Diciembre', 4);

-- Año 2024
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2024, 1, '2024-01', 'Enero', 1), (2024, 2, '2024-02', 'Febrero', 1), (2024, 3, '2024-03', 'Marzo', 1),
  (2024, 4, '2024-04', 'Abril', 2), (2024, 5, '2024-05', 'Mayo', 2), (2024, 6, '2024-06', 'Junio', 2),
  (2024, 7, '2024-07', 'Julio', 3), (2024, 8, '2024-08', 'Agosto', 3), (2024, 9, '2024-09', 'Septiembre', 3),
  (2024, 10, '2024-10', 'Octubre', 4), (2024, 11, '2024-11', 'Noviembre', 4), (2024, 12, '2024-12', 'Diciembre', 4);

-- Año 2025
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2025, 1, '2025-01', 'Enero', 1), (2025, 2, '2025-02', 'Febrero', 1), (2025, 3, '2025-03', 'Marzo', 1),
  (2025, 4, '2025-04', 'Abril', 2), (2025, 5, '2025-05', 'Mayo', 2), (2025, 6, '2025-06', 'Junio', 2),
  (2025, 7, '2025-07', 'Julio', 3), (2025, 8, '2025-08', 'Agosto', 3), (2025, 9, '2025-09', 'Septiembre', 3),
  (2025, 10, '2025-10', 'Octubre', 4), (2025, 11, '2025-11', 'Noviembre', 4), (2025, 12, '2025-12', 'Diciembre', 4);

-- Año 2026
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2026, 1, '2026-01', 'Enero', 1), (2026, 2, '2026-02', 'Febrero', 1), (2026, 3, '2026-03', 'Marzo', 1),
  (2026, 4, '2026-04', 'Abril', 2), (2026, 5, '2026-05', 'Mayo', 2), (2026, 6, '2026-06', 'Junio', 2),
  (2026, 7, '2026-07', 'Julio', 3), (2026, 8, '2026-08', 'Agosto', 3), (2026, 9, '2026-09', 'Septiembre', 3),
  (2026, 10, '2026-10', 'Octubre', 4), (2026, 11, '2026-11', 'Noviembre', 4), (2026, 12, '2026-12', 'Diciembre', 4);

-- Año 2027
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2027, 1, '2027-01', 'Enero', 1), (2027, 2, '2027-02', 'Febrero', 1), (2027, 3, '2027-03', 'Marzo', 1),
  (2027, 4, '2027-04', 'Abril', 2), (2027, 5, '2027-05', 'Mayo', 2), (2027, 6, '2027-06', 'Junio', 2),
  (2027, 7, '2027-07', 'Julio', 3), (2027, 8, '2027-08', 'Agosto', 3), (2027, 9, '2027-09', 'Septiembre', 3),
  (2027, 10, '2027-10', 'Octubre', 4), (2027, 11, '2027-11', 'Noviembre', 4), (2027, 12, '2027-12', 'Diciembre', 4);

-- Año 2028
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2028, 1, '2028-01', 'Enero', 1), (2028, 2, '2028-02', 'Febrero', 1), (2028, 3, '2028-03', 'Marzo', 1),
  (2028, 4, '2028-04', 'Abril', 2), (2028, 5, '2028-05', 'Mayo', 2), (2028, 6, '2028-06', 'Junio', 2),
  (2028, 7, '2028-07', 'Julio', 3), (2028, 8, '2028-08', 'Agosto', 3), (2028, 9, '2028-09', 'Septiembre', 3),
  (2028, 10, '2028-10', 'Octubre', 4), (2028, 11, '2028-11', 'Noviembre', 4), (2028, 12, '2028-12', 'Diciembre', 4);

-- Año 2029
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2029, 1, '2029-01', 'Enero', 1), (2029, 2, '2029-02', 'Febrero', 1), (2029, 3, '2029-03', 'Marzo', 1),
  (2029, 4, '2029-04', 'Abril', 2), (2029, 5, '2029-05', 'Mayo', 2), (2029, 6, '2029-06', 'Junio', 2),
  (2029, 7, '2029-07', 'Julio', 3), (2029, 8, '2029-08', 'Agosto', 3), (2029, 9, '2029-09', 'Septiembre', 3),
  (2029, 10, '2029-10', 'Octubre', 4), (2029, 11, '2029-11', 'Noviembre', 4), (2029, 12, '2029-12', 'Diciembre', 4);

-- Año 2030
INSERT INTO dim_time (year, month, year_month, month_name, quarter) VALUES
  (2030, 1, '2030-01', 'Enero', 1), (2030, 2, '2030-02', 'Febrero', 1), (2030, 3, '2030-03', 'Marzo', 1),
  (2030, 4, '2030-04', 'Abril', 2), (2030, 5, '2030-05', 'Mayo', 2), (2030, 6, '2030-06', 'Junio', 2),
  (2030, 7, '2030-07', 'Julio', 3), (2030, 8, '2030-08', 'Agosto', 3), (2030, 9, '2030-09', 'Septiembre', 3),
  (2030, 10, '2030-10', 'Octubre', 4), (2030, 11, '2030-11', 'Noviembre', 4), (2030, 12, '2030-12', 'Diciembre', 4);

-- Marcar mes actual (abril 2026)
UPDATE dim_time SET is_current_month = 1 WHERE year = 2026 AND month = 4;

-- ===================================================================
-- 3. POBLAR dim_account (Estructura Jerárquica Base)
-- ===================================================================

-- Nivel 0: ROOT
INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member, account_type, sort_order, is_active, created_at, updated_at)
VALUES ('ROOT', 'Root', NULL, 0, 0, NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nivel 1: Categorías principales
INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member, account_type, sort_order, is_active, created_at, updated_at)
VALUES 
  ('INGRESOS', 'Ingresos', (SELECT account_id FROM dim_account WHERE account_code = 'ROOT'), 1, 0, 'INGRESO', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GASTOS', 'Gastos', (SELECT account_id FROM dim_account WHERE account_code = 'ROOT'), 1, 0, 'GASTO', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('AHORROS', 'Ahorros', (SELECT account_id FROM dim_account WHERE account_code = 'ROOT'), 1, 0, 'AHORRO', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Nivel 2: Subcategorías de GASTOS
INSERT INTO dim_account (account_code, account_name, parent_id, level, is_base_member, account_type, sort_order, is_active, created_at, updated_at)
VALUES 
  ('GAS.SUS', 'Suscripciones', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GAS.SER', 'Servicios Básicos', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 2, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GAS.OBL', 'Obligaciones', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GAS.HIP', 'Hipotecario', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GAS.SUP', 'Supermercado', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('GAS.AJU', 'Ajustes', (SELECT account_id FROM dim_account WHERE account_code = 'GASTOS'), 2, 0, 'GASTO', 6, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===================================================================
-- 4. POBLAR assumptions (Supuestos UF - Copiar desde supuestos_anuales legacy)
-- ===================================================================
-- Nota: Este script se ejecutará junto con la migración de datos legacy

-- ===================================================================
-- 5. VERIFICACIÓN
-- ===================================================================

-- Contar registros insertados
SELECT 'dim_scenario' AS tabla, COUNT(*) AS registros FROM dim_scenario
UNION ALL
SELECT 'dim_time', COUNT(*) FROM dim_time
UNION ALL
SELECT 'dim_account (estructura base)', COUNT(*) FROM dim_account
ORDER BY tabla;

-- Verificar jerarquía de cuentas
SELECT 
  account_code, 
  account_name, 
  level, 
  is_base_member, 
  account_type
FROM dim_account
ORDER BY level, sort_order;
