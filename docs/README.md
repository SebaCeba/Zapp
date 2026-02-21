# Documentación Zapps

**Última actualización:** 21 de Febrero, 2026  
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
| **[ANALISIS_DOCUMENTACION.md](ANALISIS_DOCUMENTACION.md)** | Análisis y reorganización de documentación |

---

### 🎨 Migración RSuite (En Curso)

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| **[PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md)** ⭐ | 📋 Planificado | Plan completo de migración a RSuite (7 fases) |
| **[FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md)** ⭐ | 🚀 Listo | Guía paso a paso para Fase 0 (preparación) |

---

### 💳 Integración Tenpo

| Documento | Descripción |
|-----------|-------------|
| **[TENPO_INTEGRATION.md](TENPO_INTEGRATION.md)** | Overview de integración con Tenpo + Gmail |
| **[tenpo_addon_v1_impl.md](tenpo_addon_v1_impl.md)** | Implementación cálculo de intereses Add-On V1 |
| **[tenpo_addon_fee_base.md](tenpo_addon_fee_base.md)** | Fórmulas de cálculo con fee incluido |
| **[tenpo_addon_fee_base_wiring.md](tenpo_addon_fee_base_wiring.md)** | Wiring completo del sistema de fees |
| **[tenpo_fee_exposure.md](tenpo_fee_exposure.md)** | Exposición de campos fee en API |
| **[tenpo_fee_missing.md](tenpo_fee_missing.md)** | Manejo de casos sin fee |
| **[tenpo_ui_desglose.md](tenpo_ui_desglose.md)** | UI desglose de costos financiados |
| **[tenpo_calendar_override.md](tenpo_calendar_override.md)** | Sistema de override de calendario |
| **[tenpo_real_guardrails.md](tenpo_real_guardrails.md)** | Validaciones de datos reales vs estimados |
| **[tenpo_auditoria.md](tenpo_auditoria.md)** | Auditoría completa del sistema Tenpo |
| **[tenpo_qa_checklist.md](tenpo_qa_checklist.md)** | Checklist de QA para Tenpo |

#### Compras Manuales Tenpo
| Documento | Descripción |
|-----------|-------------|
| **[tenpo-manual-purchases-api.md](tenpo-manual-purchases-api.md)** | API para compras manuales |
| **[tenpo-manual-purchases-model.md](tenpo-manual-purchases-model.md)** | Modelo de datos de compras manuales |
| **[tenpo-manual-purchases-ui.md](tenpo-manual-purchases-ui.md)** | UI para crear compras manuales |
| **[tenpo-manual-purchases-audit.md](tenpo-manual-purchases-audit.md)** | Auditoría de compras manuales |

#### Correcciones Históricas
| Documento | Descripción |
|-----------|-------------|
| **[cuotas_interes_fix.md](cuotas_interes_fix.md)** | Fix histórico: cálculo de intereses |

---

### 🏦 TC Billing Cycles (Tarjetas de Crédito)

| Documento | Descripción |
|-----------|-------------|
| **[tc-billing-cycle-design.md](tc-billing-cycle-design.md)** | Diseño del sistema de ciclos de facturación |
| **[tc-billing-cycle-backend.md](tc-billing-cycle-backend.md)** | Implementación backend de billing cycles |
| **[tc-billing-cycle-ui.md](tc-billing-cycle-ui.md)** | Implementación UI de configuración TC |
| **[auditoria-routing-configuracion-tc.md](auditoria-routing-configuracion-tc.md)** | Auditoría de routing y configuración |

---

### 🗄️ Documentación Archivada

Los siguientes documentos fueron movidos a `archive/` por estar obsoletos o completamente implementados:

| Documento | Razón |
|-----------|-------|
| [IMPLEMENTACION_ACTUAL.md](archive/IMPLEMENTACION_ACTUAL.md) | ✅ Implementado, info migrada a ARQUITECTURA.md |
| [FRONTEND_ACTUAL_IMPLEMENTACION.md](archive/FRONTEND_ACTUAL_IMPLEMENTACION.md) | ✅ Implementado |
| [RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md](archive/RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md) | Consolidado en ARQUITECTURA.md |
| [RESUMEN_IMPLEMENTACION_FRONTEND_ACTUAL.md](archive/RESUMEN_IMPLEMENTACION_FRONTEND_ACTUAL.md) | Consolidado en ARQUITECTURA.md |
| [MEJORAS_ACTUAL_BACKEND.md](archive/MEJORAS_ACTUAL_BACKEND.md) | Propuestas antiguas, algunas implementadas |
| [PULIR_FRONTEND_ACTUAL.md](archive/PULIR_FRONTEND_ACTUAL.md) | Obsoleto por plan RSuite |
| [PRESUPUESTO_RESUMEN_TECNICO.md](archive/PRESUPUESTO_RESUMEN_TECNICO.md) | Info consolidada en ARQUITECTURA.md |

---

## 🔗 Enlaces Útiles

- [README Principal](../README.md)
- [README Inicio](../README-INICIO.md)
- [Node Version README](../node-version/README.md)

---

## 📊 Estructura de Documentación

```
docs/
├── README.md                          # Este archivo
├── ARQUITECTURA.md                    # ⭐ Documento maestro
├── ANALISIS_DOCUMENTACION.md          # Análisis de docs
│
├── Desarrollo/
│   ├── DESARROLLO.md
│   └── CREDENCIALES_GOOGLE.md
│
├── implementacion_rsuite/
│   ├── PLAN_IMPLEMENTACION_RSUITE.md
│   └── FASE_0_RSUITE_PREPARACION.md
│
├── Tenpo/                            # 15 documentos
├── TC Billing/                       # 4 documentos
└── archive/                          # 7 documentos obsoletos
```

---

## 📝 Guía de Navegación Rápida

### Por Caso de Uso

| Necesito... | Ve a... |
|-------------|---------|
| Entender arquitectura completa | [ARQUITECTURA.md](ARQUITECTURA.md) |
| Empezar a desarrollar | [DESARROLLO.md](DESARROLLO.md) |
| Implementar RSuite | [PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md) |
| Entender Tenpo | [TENPO_INTEGRATION.md](TENPO_INTEGRATION.md) |
| Entender TC Billing | [tc-billing-cycle-design.md](tc-billing-cycle-design.md) |
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
**Versión docs:** 2.0 (reorganizado 21/02/2026)
