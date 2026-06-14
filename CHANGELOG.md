# Changelog - Zapps

Registro consolidado de cambios significativos en el proyecto.

---

## [Febrero-Marzo 2026] - Migraciones y Mejoras UX

### 🎨 Migración Visual Frontend
- **2026-02-22**: Rollout de estándar COMPACT_MONTH_TABLE a todas las tablas RSuite
  - Migradas 4 tablas HTML → RSuite (Ingresos, Servicios, Dashboard, VistaPreviaObligacion)
  - Columna "Total Anual" fija a la derecha con scroll horizontal
  - Font-size optimizado para mejor legibilidad en tablas

### 💳 Módulo Tenpo - Sistema de Pagos TC
- **2026-02-27**: Implementación completa del sistema de pagos Tenpo V2
  - Panel lateral permanente (MonthlyPaymentPanel) con diseño sticky
  - Gestión de pagos: historial, selección múltiple, registro manual
  - Sincronización real con backend (Prisma + PostgreSQL)
  - Endpoint `/api/actual/entries` con filtros y ordenamiento
  - Categoría `PAGO_TC` integrada en consolidado presupuestario
  - UX mejorada: scroll controlado, sidebar nativo sin flotar

### 🔧 Backend - API y Servicios
- **2026-02-27**: Endpoints de gestión Actual
  - `GET /api/actual/entries` - Listado con filtros (year, month, category)
  - `POST /api/actual/entry` - Crear entrada
  - `DELETE /api/actual/entry/:id` - Eliminar entrada
  - Auditoría y corrección del flujo de consolidación de categorías

### 📊 Vista Consolidada Actual
- **2026-02-27**: Implementación de vista consolidada presupuesto vs actual
  - Integración de ajustes financieros
  - Mejoras en visualización de datos mensuales

### 🔄 Sincronización Gmail
- **2026-03-06**: Componente reutilizable GmailSyncStatusBanner
- **2026-03-06**: Manejo de tokens expirados Tenpo (MVP)

---

## Archivos Históricos

Los documentos detallados de implementación previos a esta consolidación están archivados en:
- `docs/archive-backup-YYYYMMDD.zip` - Análisis y auditorías técnicas antiguas
- Commits de Git - Historial completo de cambios en el código

---

## Formato

Este changelog sigue principios de [Keep a Changelog](https://keepachangelog.com/):
- **Added** para nuevas funcionalidades
- **Changed** para cambios en funcionalidad existente
- **Deprecated** para funcionalidades próximas a ser eliminadas
- **Removed** para funcionalidades eliminadas
- **Fixed** para correcciones de bugs
- **Security** para vulnerabilidades

---

_Última actualización: Junio 2026_
