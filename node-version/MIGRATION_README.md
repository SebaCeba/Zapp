# Migración al Modelo Dimensional Estrella

## 📋 Resumen

Esta carpeta contiene todos los scripts necesarios para migrar desde el modelo legacy fragmentado (7+ tablas de presupuesto) al modelo dimensional estrella unificado.

**Fecha de creación:** 2026-04-05  
**Estado actual:** ✅ Fase 1 completada (Preparación)

---

## 🎯 Objetivo

Transformar el modelo de datos de Zapp desde:

**ANTES (Legacy):**
- 7+ tablas de presupuesto con 12 columnas mensuales cada una
- `ActualEntry` separado del presupuesto
- Categorías como strings hardcodeados
- Sin jerarquía de cuentas

**DESPUÉS (Modelo Estrella):**
- 1 tabla de hechos unificada (`fact_financial`)
- Presupuesto y Actual como escenarios (no tablas separadas)
- Jerarquía de cuentas navegable (`dim_account`)
- IDs técnicos puros con AUTOINCREMENT

---

## 📁 Estructura de Archivos

```
prisma/
├── schema_star.prisma              # Schema del modelo dimensional nuevo
├── dev_star.db                     # Base de datos dimensional (generada)
├── dev.db                          # Base de datos legacy (respaldo)
├── dev_backup_pre_star_migration_*.db  # Backup pre-migración
└── migrations/
    ├── populate_dimensions.sql     # Poblar dim_scenario, dim_time, estructura dim_account
    ├── migrate_01_populate_dim_account.sql   # Miembros base desde catálogos legacy
    ├── migrate_02_create_mapping_table.sql   # Tabla de mapeo temporal
    ├── migrate_03_budget_2026_complete.sql   # Presupuesto 2026 → facts
    ├── migrate_04_actual_2025_2026.sql       # Actual 2025-2026 → facts
    └── migrate_05_validation.sql             # Validación de integridad

scripts/
└── run_migration.ps1               # Script maestro para ejecutar toda la migración

validation/
├── presupuesto_ingresos_2026.csv   # Export para validación manual
├── actual_entries_2025_2026.csv    # Export para validación manual
└── validation_counts.txt           # Conteos de registros legacy
```

---

## 🔧 Pre-requisitos

1. **Backup completado** ✅
   - `dev_backup_pre_star_migration_*.db` creado
   - SQL dump `legacy_full_dump_*.sql` exportado

2. **Schema nuevo creado** ✅
   - `schema_star.prisma` listo
   - Base de datos `dev_star.db` inicializada

3. **Dimensiones base pobladas** ✅
   - `dim_scenario`: 2 escenarios (BUDGET, ACTUAL)
   - `dim_time`: 132 meses (2020-2030)
   - `dim_account`: 10 nodos jerárquicos base

---

## 🚀 Ejecución de la Migración

### Opción A: Script Maestro (Recomendado)

```powershell
cd node-version
.\scripts\run_migration.ps1
```

Este script ejecuta automáticamente todos los pasos en orden y muestra resultados de validación.

### Opción B: Ejecución Manual (Paso a Paso)

```powershell
cd node-version

# Paso 1: Popular dim_account con miembros base
Get-Content prisma\migrations\migrate_01_populate_dim_account.sql | sqlite3 prisma\dev_star.db

# Paso 2: Crear tabla de mapeo temporal
Get-Content prisma\migrations\migrate_02_create_mapping_table.sql | sqlite3 prisma\dev_star.db

# Paso 3: Migrar Presupuesto 2026
Get-Content prisma\migrations\migrate_03_budget_2026_complete.sql | sqlite3 prisma\dev_star.db

# Paso 4: Migrar Actual 2025-2026
Get-Content prisma\migrations\migrate_04_actual_2025_2026.sql | sqlite3 prisma\dev_star.db

# Paso 5: Validación completa
Get-Content prisma\migrations\migrate_05_validation.sql | sqlite3 prisma\dev_star.db
```

---

## ✅ Validación Post-Migración

### Checklist de Validación

- [ ] **Nodos huérfanos = 0** (parent_id válidos)
- [ ] **Facts con FK inválidos = 0** (time_id, scenario_id, account_base_id)
- [ ] **Facts duplicados = 0** (grano único: time+scenario+account)
- [ ] **Total presupuesto 2026 coincide** con legacy (±1% tolerancia)
- [ ] **Total actual 2025-2026 coincide** con legacy (exacto)
- [ ] **Miembros base creados** = cantidad esperada desde catálogos

### Queries de Validación Rápida

```sql
-- Verificar totales presupuesto 2026
SELECT SUM(amount_clp) FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year = 2026 AND s.scenario_code = 'BUDGET';

-- Verificar totales actual 2025-2026
SELECT t.year, SUM(f.amount_clp) as total
FROM fact_financial f
JOIN dim_time t ON f.time_id = t.time_id
JOIN dim_scenario s ON f.scenario_id = s.scenario_id
WHERE t.year >= 2025 AND s.scenario_code = 'ACTUAL'
GROUP BY t.year;

-- Ver distribución de facts por categoría
SELECT 
  CASE 
    WHEN da.account_code LIKE 'ING.%' THEN 'INGRESOS'
    WHEN da.account_code LIKE 'AHO.%' THEN 'AHORROS'
    WHEN da.account_code LIKE 'GAS.SUS.%' THEN 'SUSCRIPCIONES'
    WHEN da.account_code LIKE 'GAS.SER.%' THEN 'SERVICIOS_BASICOS'
    ELSE 'OTROS'
  END AS categoria,
  COUNT(*) as cantidad_facts
FROM fact_financial f
JOIN dim_account da ON f.account_base_id = da.account_id
GROUP BY categoria;
```

---

## 📊 Datos Migrados

### Presupuesto Vigente (Alta Prioridad)
- ✅ `PresupuestoIngreso` 2026 → `fact_financial` (scenario=BUDGET)
- ✅ `PresupuestoAhorro` 2026 → `fact_financial`
- ✅ `PresupuestoServicioBasico` 2026 → `fact_financial`
- ✅ `SupermercadoPresupuesto` 2026 → `fact_financial`

### Actual Histórico Relevante (Alta Prioridad)
- ✅ `ActualEntry` 2025-2026 → `fact_financial` (scenario=ACTUAL)

### Catálogos Activos (Alta Prioridad)
- ✅ `IngresoBase` → `dim_account` (parent: INGRESOS)
- ✅ `Ahorro` → `dim_account` (parent: AHORROS)
- ✅ `ServicioBasico` → `dim_account` (parent: GAS.SER)
- ✅ `Subscription` → `dim_account` (parent: GAS.SUS)
- ✅ `Obligacion` → `dim_account` (parent: GAS.OBL)
- ✅ `MortgageInsurance` → `dim_account` (parent: GAS.HIP)

### Datos NO Migrados (Archivados como Respaldo)
- ❌ Presupuesto anterior a 2026 (histórico antiguo)
- ❌ Actual anterior a 2025 (consultar legacy si necesario)
- ❌ Catálogos inactivos (activo=FALSE)
- ❌ Metadatos de auditoría legacy (createdAt/updatedAt viejos)

---

## ⚠️ Artefactos Temporales

### ⚠️ Tabla `legacy_account_mapping`

**Estado:** Temporal, debe eliminarse post-cutover  
**Propósito:** Mapeo legacy_id → account_id nuevo (solo para migración)  
**No usar en:** Runtime, endpoints API, frontend

**Eliminación:**
```sql
-- Solo después de validar migración exitosa
DROP TABLE legacy_account_mapping;
```

---

## 🔄 Rollback (Si es Necesario)

Si la migración falla o tiene problemas:

```powershell
# Restaurar desde backup
cd node-version
Copy-Item prisma\dev_backup_pre_star_migration_*.db -Destination prisma\dev_star.db -Force
```

O recrear desde cero:

```powershell
# Eliminar base de datos star
Remove-Item prisma\dev_star.db -Force

# Recrear schema
$env:DATABASE_URL_STAR="file:./dev_star.db"
npx prisma migrate dev --schema=prisma/schema_star.prisma --skip-generate

# Re-ejecutar migración
.\scripts\run_migration.ps1
```

---

## 📖 Documentación de Referencia

- [Estrategia de Transición Completa](../../docs/auditorias/transition-strategy-star-model.md)
- [Modelo Dimensional Estrella](../../docs/auditorias/dimensional-model-star-schema-audit.md)
- [Árbol MVP de dim_account](../../docs/auditorias/dim-account-mvp-tree.md)
- [Simplificación del Modelo](../../docs/auditorias/database-simplification-audit.md)

---

## 🎯 Próximos Pasos (Post-Migración)

1. **Validar todos los checkpoints** ✅
2. **Generar cliente Prisma** para modelo nuevo:
   ```powershell
   npx prisma generate --schema=prisma/schema_star.prisma
   ```
3. **Crear endpoints v2** que lean de `fact_financial`
4. **Adaptar frontend** para consumir nueva API
5. **Testing A/B** (legacy vs nuevo)
6. **Cutover** (activar modelo nuevo como operativo)
7. **Archivar legacy** como respaldo read-only
8. **Eliminar tabla de mapeo temporal**
9. **Cleanup** de código legacy

---

## 🐛 Troubleshooting

### Error: "unable to open database"
- Verificar que estás en el directorio `node-version/`
- Verificar rutas: `prisma/dev_star.db` y `prisma/dev.db` existen

### Error: "no such table: dim_account"
- Ejecutar primero `populate_dimensions.sql`
- Verificar que migración inicial del schema se aplicó correctamente

### Error: "UNIQUE constraint failed"
- Limpiar base de datos star y empezar de nuevo
- Verificar que no hay datos previos en `dev_star.db`

### Totales no coinciden (validación falla)
- Revisar logs de migración
- Comparar CSVs exportados manualmente
- Verificar que `legacy_account_mapping` tiene todos los mapeos necesarios

---

## 📝 Log de Cambios

### 2026-04-05 - Fase 1 Completada
- ✅ Backup completo de legacy creado
- ✅ Schema dimensional (`schema_star.prisma`) creado
- ✅ Base de datos `dev_star.db` inicializada
- ✅ Dimensiones base pobladas (scenario, time, account estructura)
- ✅ Scripts de migración completos creados
- 🔄 Pendiente: Ejecutar migración completa

---

**Autor:** Sistema de migración automática  
**Última actualización:** 2026-04-05
