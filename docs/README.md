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
├── README.md                          # Este archivo - Índice principal
├── ARQUITECTURA.md                    # ⭐ Documento maestro
├── ANALISIS_DOCUMENTACION.md          # Análisis de documentación
├── DESARROLLO.md                      # Comandos y desarrollo
├── CREDENCIALES_GOOGLE.md            # Setup Gmail OAuth
│
├── 🎨 implementacion_rsuite/          # Migración a RSuite
│   ├── README.md
│   ├── PLAN_IMPLEMENTACION_RSUITE.md
│   └── FASE_0_RSUITE_PREPARACION.md
│
├── 💳 tenpo/                          # 17 documentos Tenpo
│   ├── README.md                      # ⭐ Índice completo
│   ├── TENPO_INTEGRATION.md
│   └── ... (16 documentos más)
│
├── 🏦 tc-billing/                     # 5 documentos TC Billing
│   ├── README.md
│   ├── tc-billing-cycle-design.md
│   └── ... (4 documentos más)
│
└── 🗄️ archive/                        # 7 documentos obsoletos
    ├── FRONTEND_ACTUAL_IMPLEMENTACION.md
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
