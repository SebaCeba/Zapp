# Script Maestro de Migracion - Modelo Estrella
# Ejecuta todos los scripts de migracion en orden
# Fecha: 2026-04-05

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " MIGRACION COMPLETA: LEGACY -> MODELO DIMENSIONAL ESTRELLA" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$DB_STAR = "prisma\dev_star.db"
$DB_LEGACY = "prisma\dev.db"
$SCRIPTS_DIR = "prisma\migrations"

# Verificar que bases de datos existen
if (-Not (Test-Path $DB_STAR)) {
    Write-Host "ERROR: Base de datos star no encontrada: $DB_STAR" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path $DB_LEGACY)) {
    Write-Host "ERROR: Base de datos legacy no encontrada: $DB_LEGACY" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Bases de datos verificadas:" -ForegroundColor Green
Write-Host "  - Legacy: $DB_LEGACY"
Write-Host "  - Star:   $DB_STAR"
Write-Host ""

# Funcion helper para ejecutar script SQL
function Invoke-SqlScript {
    param(
        [string]$ScriptPath,
        [string]$Description
    )
    
    Write-Host "[$Description]" -ForegroundColor Yellow
    Write-Host "  Ejecutando: $ScriptPath"
    
    try {
        Get-Content $ScriptPath | sqlite3 $DB_STAR 2>&1 | Out-String | Write-Host
        Write-Host "  OK Completado" -ForegroundColor Green
    } catch {
        Write-Host "  ERROR: $_" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

# ===================================================================
# PASO 1: Popular dim_account con miembros base
# ===================================================================

Invoke-SqlScript `
    -ScriptPath "$SCRIPTS_DIR\migrate_01_populate_dim_account.sql" `
    -Description "PASO 1: Popular dim_account desde catalogos legacy"

# ===================================================================
# PASO 2: Crear tabla de mapeo temporal
# ===================================================================

Invoke-SqlScript `
    -ScriptPath "$SCRIPTS_DIR\migrate_02_create_mapping_table.sql" `
    -Description "PASO 2: Crear tabla de mapeo legacy -> nuevo"

# ===================================================================
# PASO 3: Migrar Presupuesto 2026
# ===================================================================

Invoke-SqlScript `
    -ScriptPath "$SCRIPTS_DIR\migrate_03_budget_2026_complete.sql" `
    -Description "PASO 3: Migrar Presupuesto 2026 -> fact_financial"

# ===================================================================
# PASO 4: Migrar Actual 2025-2026
# ===================================================================

Invoke-SqlScript `
    -ScriptPath "$SCRIPTS_DIR\migrate_04_actual_2025_2026.sql" `
    -Description "PASO 4: Migrar Actual 2025-2026 -> fact_financial"

# ===================================================================
# PASO 5: Validacion Completa
# ===================================================================

Write-Host "[PASO 5: VALIDACION COMPLETA]" -ForegroundColor Yellow
Write-Host "  Ejecutando validaciones de integridad..."
Write-Host ""

Get-Content "$SCRIPTS_DIR\migrate_05_validation.sql" | sqlite3 $DB_STAR | Out-String | Write-Host

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " MIGRACION COMPLETADA" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Green
Write-Host "  1. Revisar resultados de validacion arriba"
Write-Host "  2. Si todo OK: Commit de cambios"
Write-Host "  3. Si hay errores: Revisar logs y corregir"
Write-Host ""
Write-Host "Archivos generados:" -ForegroundColor Cyan
$backupFile = Get-ChildItem -Path "prisma" -Filter "dev_backup_pre_star_migration_*.db" | Select-Object -First 1
Write-Host "  - Base de datos star: $DB_STAR"
if ($backupFile) {
    Write-Host "  - Backup legacy: $($backupFile.Name)"
}
Write-Host ""
