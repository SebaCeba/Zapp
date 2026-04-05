# Documentación Zapps

**Última actualización:** 5 de Enero, 2026 (Post-desmontaje módulos)  
Índice de toda la documentación técnica del proyecto.

> **Nota:** El 5 de enero de 2026 se eliminaron 8 módulos (Tenpo, TC Billing, Analytics, Bonos, Presupuesto Resumen).  
> Ver [zapp-functional-audit-classification.md](auditorias/zapp-functional-audit-classification.md) para detalles.

---

## 🎯 Inicio Rápido

### Nuevo en el Proyecto?
1. Lee **[ARQUITECTURA.md](ARQUITECTURA.md)** - Documento maestro con arquitectura completa
2. Revisa **[DESARROLLO.md](DESARROLLO.md)** - Comandos y setup de desarrollo
3. Explora el resto según tu necesidad

### Quieres Implementar RSuite?
1. **[PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md)** - Plan completo 7 fases
2. **[FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md)** - Guía paso a paso Fase 0

---

## 📚 Documentación por Categoría

### 🏗️ Arquitectura y Desarrollo

| Documento | Descripción |
|-----------|-------------|
| **[ARQUITECTURA.md](ARQUITECTURA.md)** ⭐ | Documento maestro: arquitectura completa del sistema |
| **[DESARROLLO.md](DESARROLLO.md)** | Comandos útiles, variables de entorno, debugging |
| **[CREDENCIALES_GOOGLE.md](CREDENCIALES_GOOGLE.md)** | Configuración OAuth2 y Gmail API |
| **[PAGE_TITLE_STANDARD.md](PAGE_TITLE_STANDARD.md)** | Estándar de títulos de página y componentes |

---

### 🔍 Auditorías y Análisis

**📁 [auditorias/](auditorias/)** - Auditorías técnicas y análisis del sistema

| Documento Principal | Descripción |
|--------------------|-------------|
| **[zapp-functional-audit-classification.md](auditorias/zapp-functional-audit-classification.md)** ⭐ | Auditoría funcional completa de 19 módulos originales |
| **[auditoria_oauth_gmail.md](auditorias/auditoria_oauth_gmail.md)** | Auditoría del sistema OAuth con Gmail |
| **[feasibility-multi-budget-audit.md](auditorias/feasibility-multi-budget-audit.md)** | Análisis de viabilidad multi-presupuesto |

Ver [auditorias/README.md](auditorias/README.md) para lista completa.

---

### 📋 Especificaciones MVP

**📁 [specs/](specs/)** - Especificaciones técnicas y decisiones arquitecturales

| Documento Principal | Descripción |
|--------------------|-------------|
| **[architecture-decisions-finanzapp-mvp.md](specs/architecture-decisions-finanzapp-mvp.md)** ⭐ | Decisiones arquitecturales del MVP |
| **[spec-final-mvp-data-model.md](specs/spec-final-mvp-data-model.md)** | Modelo de datos final del MVP |

Ver [specs/README.md](specs/README.md) para las 6 especificaciones completas.

---

### 🚀 Planes de Implementación

**📁 [implementacion/](implementacion/)** - Planes de implementación y diseños técnicos

| Documento Principal | Descripción |
|--------------------|-------------|
| **[plan-desmontaje-modulos-zapp.md](implementacion/plan-desmontaje-modulos-zapp.md)** ⭐ | Plan ejecutado de desmontaje (commit c6db140) |
| **[git-branching-zapp-front-rebuild.md](implementacion/git-branching-zapp-front-rebuild.md)** | Estrategia de branching para rebuild |
| **[import_gmail_preview_confirm.md](implementacion/import_gmail_preview_confirm.md)** | Diseño flujo preview/confirm Gmail |

Ver [implementacion/README.md](implementacion/README.md) para lista completa.

---

### ⚙️ Configuraciones Técnicas

**📁 [config/](config/)** - Configuraciones técnicas específicas

| Documento | Descripción |
|-----------|-------------|
| **[api_gmail_labels.md](config/api_gmail_labels.md)** | API de labels de Gmail y su uso |
| **[config_servicios_basicos_labels.md](config/config_servicios_basicos_labels.md)** | Configuración labels para servicios básicos |
| **[parser_aguas_andinas.md](config/parser_aguas_andinas.md)** | Parser específico Aguas Andinas |
| **[servicios-basicos_architectura.md](config/servicios-basicos_architectura.md)** | Arquitectura módulo servicios básicos |

---

### 📝 Registro de Cambios

**📁 [changes/](changes/)** - Registro histórico cronológico de cambios (13 documentos por fecha)

**📁 [changelogs/](changelogs/)** - Changelogs específicos de features

| Documento | Descripción |
|-----------|-------------|
| **[CHANGELOG_import_inline_mes_anio.md](changelogs/CHANGELOG_import_inline_mes_anio.md)** | Cambios en importación inline |
| **[CHANGELOG_payperiod_edit_v2.md](changelogs/CHANGELOG_payperiod_edit_v2.md)** | Cambios en edición de periodos v2 |

---

### 🎨 Migración RSuite (En Curso)

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| **[PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md)** ⭐ | 📋 Planificado | Plan completo de migración a RSuite (7 fases) |
| **[FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md)** ⭐ | 🚀 Listo | Guía paso a paso para Fase 0 (preparación) |

---

### ️ Documentación Archivada

Los siguientes documentos fueron movidos a `archive/` por estar obsoletos o completamente implementados:

**Implementaciones completadas:**
| Documento | Razón |
|-----------|-------|
| [IMPLEMENTACION_ACTUAL.md](archive/IMPLEMENTACION_ACTUAL.md) | ✅ Implementado, info migrada a ARQUITECTURA.md |
| [FRONTEND_ACTUAL_IMPLEMENTACION.md](archive/FRONTEND_ACTUAL_IMPLEMENTACION.md) | ✅ Implementado |
| [RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md](archive/RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md) | Consolidado en ARQUITECTURA.md |
| [RESUMEN_IMPLEMENTACION_FRONTEND_ACTUAL.md](archive/RESUMEN_IMPLEMENTACION_FRONTEND_ACTUAL.md) | Consolidado en ARQUITECTURA.md |
| [MEJORAS_ACTUAL_BACKEND.md](archive/MEJORAS_ACTUAL_BACKEND.md) | Propuestas antiguas, algunas implementadas |
| [PULIR_FRONTEND_ACTUAL.md](archive/PULIR_FRONTEND_ACTUAL.md) | Obsoleto por plan RSuite |

**Auditorías y análisis puntuales (archivados 27/02/2026):**
| Documento | Razón |
|-----------|-------|
| [PAGE_TITLE_AUDIT.md](archive/PAGE_TITLE_AUDIT.md) | ✅ Auditoría de migración de títulos completada |
| [RSUITE_CURRENT_STATE_AUDIT.md](archive/RSUITE_CURRENT_STATE_AUDIT.md) | Auditoría del 21 feb, superada por cambios del 27 |
| [MONTH_TABLES_INVENTORY.md](archive/MONTH_TABLES_INVENTORY.md) | Inventario para estandarización ya completado |
| [RSUITE_PHASE3_SUBSCRIPTIONTABLE_NOTES.md](archive/RSUITE_PHASE3_SUBSCRIPTIONTABLE_NOTES.md) | Notas de fase 3 completada |
| [RSUITE_PHASE3_SUPERMERCADO_NOTES.md](archive/RSUITE_PHASE3_SUPERMERCADO_NOTES.md) | Notas de fase 3 completada |
| [ANALISIS_DOCUMENTACION.md](archive/ANALISIS_DOCUMENTACION.md) | Análisis del 21 feb, superado por limpieza del 27 |
| [analisis-detallado-pagina-actual.md](archive/analisis-detallado-pagina-actual.md) | Análisis pre-implementación, vista consolidada ya implementada |

---

## 🔗 Enlaces Útiles

- [README Principal](../README.md)
- [README Inicio](../README-INICIO.md)
- [Node Version README](../node-version/README.md)

---

## 📊 Estructura de Documentación

```
docs/
├── README.md                          # Este archivo - Índice principal
├── ARQUITECTURA.md                    # ⭐ Documento maestro
├── DESARROLLO.md                      # Comandos y desarrollo
├── CREDENCIALES_GOOGLE.md            # Setup Gmail OAuth
├── PAGE_TITLE_STANDARD.md            # Estándar de títulos
│
├── � changes/                        # Registro histórico de cambios
│   └── (ver carpeta para lista completa)
│
├── 🎨 implementacion_rsuite/          # Migración a RSuite
│   ├── README.md
│   ├── PLAN_IMPLEMENTACION_RSUITE.md
│   └── fase-*/                        # Fases 0-3
│
└── 🗄️ archive/                        # Documentos obsoletos/implementados
    └── (ver sección anterior para lista completa)
```

---

## 📝 Guía de Navegación Rápida

### Por Caso de Uso

| Necesito... | Ve a... |
|-------------|---------|
| Entender arquitectura completa | [ARQUITECTURA.md](ARQUITECTURA.md) |
| Empezar a desarrollar | [DESARROLLO.md](DESARROLLO.md) |
| Implementar RSuite | [PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md) |
| Ver cambios recientes | [changes/](changes/) - últimas implementaciones |
| Configurar Gmail | [CREDENCIALES_GOOGLE.md](CREDENCIALES_GOOGLE.md) |
| Ver docs antiguas | [archive/](archive/) |

---

## 🎯 Próximos Pasos

1. **Implementar RSuite Fase 0** - Ver [FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md)
2. **Continuar con Fases 1-7** - Ver [PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md)
3. **Testing automatizado** - Pendiente de documentar
4. **Deploy a producción** - Pendiente de documentar

---

**Mantenedor:** Sistema Zapps  
**Contacto:** Ver README principal  
**Versión docs:** 3.0 (limpieza y reorganización 27/02/2026)
