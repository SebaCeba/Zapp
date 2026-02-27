# Documentación Zapps

**Última actualización:** 27 de Febrero, 2026  
Índice de toda la documentación técnica del proyecto.

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

### 📝 Diseño y Análisis Activos

| Documento | Descripción |
|-----------|-------------|
| **[ANALISIS_CATEGORIAS_PRESUPUESTO.md](ANALISIS_CATEGORIAS_PRESUPUESTO.md)** | Análisis de categorías de presupuesto |
| **[panel_pago_mes_tempo_tc.md](panel_pago_mes_tempo_tc.md)** | Diseño panel mensual de pagos TC |
| **[registro_pagos_tc_diseno.md](registro_pagos_tc_diseno.md)** | Diseño registro de pagos TC |

---

### 📋 Registro de Cambios

**📁 [changes/](changes/)** - Registro histórico de cambios e implementaciones

Documentos recientes (2026-02-27):
- Vista consolidada de pagos actual
- Implementación Tenpo v2 con cuotas
- Refactor panel mensual de pagos
- Mejoras UX (scroll sticky, sidebar)
- Endpoint lista de pagos TC
- Ajustes financieros consolidados

---

### 🎨 Migración RSuite (En Curso)

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| **[PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md)** ⭐ | 📋 Planificado | Plan completo de migración a RSuite (7 fases) |
| **[FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md)** ⭐ | 🚀 Listo | Guía paso a paso para Fase 0 (preparación) |

---

### 💳 Integración Tenpo

**📁 [tenpo/](tenpo/)** - 17 documentos sobre integración Tenpo + Gmail

| Documento Principal | Descripción |
|--------------------|-------------|
| **[tenpo/TENPO_INTEGRATION.md](tenpo/TENPO_INTEGRATION.md)** ⭐ | Overview completo de integración |
| **[tenpo/README.md](tenpo/README.md)** | Índice con todos los documentos organizados |

**Temas cubiertos:**
- Cálculo de intereses (Add-On V1, fees, sistema francés)
- UI y desglose de costos
- Compras manuales
- Calendario y overrides
- Validación y auditoría
- QA y testing

---

### 🏦 TC Billing Cycles (Tarjetas de Crédito)

**📁 [tc-billing/](tc-billing/)** - 5 documentos sobre ciclos de facturación

| Documento Principal | Descripción |
|--------------------|-------------|
| **[tc-billing/tc-billing-cycle-design.md](tc-billing/tc-billing-cycle-design.md)** ⭐ | Diseño completo del sistema |
| **[tc-billing/README.md](tc-billing/README.md)** | Índice con todos los documentos |

**Temas cubiertos:**
- Diseño del sistema
- Implementación backend y frontend
- Auditoría de implementación

---

### 🗄️ Documentación Archivada

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
| [PRESUPUESTO_RESUMEN_TECNICO.md](archive/PRESUPUESTO_RESUMEN_TECNICO.md) | Info consolidada en ARQUITECTURA.md |

**Auditorías y análisis puntuales (archivados 27/02/2026):**
| Documento | Razón |
|-----------|-------|
| [PAGE_TITLE_AUDIT.md](archive/PAGE_TITLE_AUDIT.md) | ✅ Auditoría de migración de títulos completada |
| [RSUITE_CURRENT_STATE_AUDIT.md](archive/RSUITE_CURRENT_STATE_AUDIT.md) | Auditoría del 21 feb, superada por cambios del 27 |
| [MONTH_TABLES_INVENTORY.md](archive/MONTH_TABLES_INVENTORY.md) | Inventario para estandarización ya completado |
| [auditoria_grafico_categoria_tempo_tc.md](archive/auditoria_grafico_categoria_tempo_tc.md) | Auditoría puntual, implementación completada |
| [modelo_datos_bar_chart_categoria_tempo_tc.md](archive/modelo_datos_bar_chart_categoria_tempo_tc.md) | Modelo específico ya implementado |
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
├── 📝 Diseño y Análisis
│   ├── ANALISIS_CATEGORIAS_PRESUPUESTO.md
│   ├── panel_pago_mes_tempo_tc.md
│   └── registro_pagos_tc_diseno.md
│
├── 📋 changes/                        # Registro histórico de cambios
│   ├── 2026-02-27-*.md               # Cambios recientes (11 docs)
│   └── 2026-02-22-*.md               # Cambios anteriores
│
├── 🎨 implementacion_rsuite/          # Migración a RSuite
│   ├── README.md
│   ├── PLAN_IMPLEMENTACION_RSUITE.md
│   └── fase-*/                        # Fases 0-3
│
├── 💳 tenpo/                          # 17 documentos Tenpo
│   ├── README.md                      # ⭐ Índice completo
│   ├── TENPO_INTEGRATION.md
│   └── ...
│
├── 🏦 tc-billing/                     # 5 documentos TC Billing
│   ├── README.md
│   ├── tc-billing-cycle-design.md
│   └── ...
│
└── 🗄️ archive/                        # 16 documentos obsoletos
    ├── FRONTEND_ACTUAL_IMPLEMENTACION.md
    ├── PAGE_TITLE_AUDIT.md
    └── ...
```

---

## 📝 Guía de Navegación Rápida

### Por Caso de Uso

| Necesito... | Ve a... |
|-------------|---------|
| Entender arquitectura completa | [ARQUITECTURA.md](ARQUITECTURA.md) |
| Empezar a desarrollar | [DESARROLLO.md](DESARROLLO.md) |
| Implementar RSuite | [PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md) |
| Entender Tenpo | [tenpo/TENPO_INTEGRATION.md](tenpo/TENPO_INTEGRATION.md) → [tenpo/README.md](tenpo/README.md) |
| Entender TC Billing | [tc-billing/tc-billing-cycle-design.md](tc-billing/tc-billing-cycle-design.md) → [tc-billing/README.md](tc-billing/README.md) |
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
