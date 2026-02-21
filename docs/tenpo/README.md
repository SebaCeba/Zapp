# Integración Tenpo

Documentación completa de la integración con Tenpo (Tarjeta de Crédito) y procesamiento automático de emails Gmail.

---

## 📋 Documentos Principales

### 🎯 Overview
**[TENPO_INTEGRATION.md](TENPO_INTEGRATION.md)**
- Visión general de la integración
- Flujo completo: Gmail → Parser → Base de datos
- Setup OAuth2
- Arquitectura del sistema

---

## 🧮 Cálculo de Intereses

### Sistema Add-On V1 (Actual)
**[tenpo_addon_v1_impl.md](tenpo_addon_v1_impl.md)**
- Implementación del sistema Add-On V1
- Fórmula: interés sobre base decreciente
- Comparación con sistema francés
- Casos de uso y ejemplos

**[tenpo_addon_fee_base.md](tenpo_addon_fee_base.md)**
- Cálculo con fee incluido
- Fórmula: base financiada = capital + fee
- Impacto del fee en intereses

**[tenpo_addon_fee_base_wiring.md](tenpo_addon_fee_base_wiring.md)**
- Wiring completo del sistema
- Integración frontend-backend
- Flujo de datos completo

### Exposición y Manejo de Fees
**[tenpo_fee_exposure.md](tenpo_fee_exposure.md)**
- Cómo se exponen los fees en la API
- Campos adicionales en responses
- UI desglose de costos

**[tenpo_fee_missing.md](tenpo_fee_missing.md)**
- Manejo de casos sin fee
- Lógica de fallback
- Compras con fee null vs 0

---

## 🎨 Frontend e UI

**[tenpo_ui_desglose.md](tenpo_ui_desglose.md)**
- UI de desglose de costos financiados
- Badge ESTIMADO vs REAL
- Transparencia financiera
- Paleta de colores

---

## 📅 Calendario y Fechas

**[tenpo_calendar_override.md](tenpo_calendar_override.md)**
- Sistema de override de fechas de vencimiento
- TC Billing Cycles
- Ajuste manual de fechas

---

## ✅ Validación y Auditoría

**[tenpo_real_guardrails.md](tenpo_real_guardrails.md)**
- Validaciones de datos reales
- Guardrails para confirmar montos
- Prevención de errores

**[tenpo_auditoria.md](tenpo_auditoria.md)**
- Auditoría completa del sistema
- Estado de implementación
- Issues encontrados y resueltos

**[tenpo_qa_checklist.md](tenpo_qa_checklist.md)**
- Checklist de QA/Testing
- Casos de prueba
- Validaciones manuales

---

## 📝 Compras Manuales

**[tenpo-manual-purchases-api.md](tenpo-manual-purchases-api.md)**
- API para crear compras manuales
- Endpoints y payloads
- Integración con sistema existente

**[tenpo-manual-purchases-model.md](tenpo-manual-purchases-model.md)**
- Modelo de datos para compras manuales
- Diferencias vs compras de Gmail
- Campo `source`

**[tenpo-manual-purchases-ui.md](tenpo-manual-purchases-ui.md)**
- UI para crear compras manuales
- Formulario y validaciones
- Modal de creación

**[tenpo-manual-purchases-audit.md](tenpo-manual-purchases-audit.md)**
- Auditoría de compras manuales
- Segregación de totales
- Testing E2E

---

## 🔧 Correcciones Históricas

**[cuotas_interes_fix.md](cuotas_interes_fix.md)**
- Fix histórico: cálculo de intereses
- Bug encontrado y solución
- Impacto en compras existentes

---

## 🗂️ Estructura de Archivos

```
tenpo/
├── README.md                          # Este archivo
│
├── TENPO_INTEGRATION.md              # ⭐ Documento principal
│
├── Cálculo Intereses/
│   ├── tenpo_addon_v1_impl.md
│   ├── tenpo_addon_fee_base.md
│   ├── tenpo_addon_fee_base_wiring.md
│   ├── tenpo_fee_exposure.md
│   └── tenpo_fee_missing.md
│
├── UI/
│   └── tenpo_ui_desglose.md
│
├── Calendario/
│   └── tenpo_calendar_override.md
│
├── Validación/
│   ├── tenpo_real_guardrails.md
│   ├── tenpo_auditoria.md
│   └── tenpo_qa_checklist.md
│
├── Compras Manuales/
│   ├── tenpo-manual-purchases-api.md
│   ├── tenpo-manual-purchases-model.md
│   ├── tenpo-manual-purchases-ui.md
│   └── tenpo-manual-purchases-audit.md
│
└── Fixes/
    └── cuotas_interes_fix.md
```

---

## 🔑 Conceptos Clave

### 1. Sistema Add-On V1
Sistema de cálculo de intereses donde el interés se aplica sobre la base financiada decreciente (no sobre el total como en sistema francés).

### 2. Fee
Comisión operacional del banco que se suma al capital y sobre la cual también se cobran intereses.

### 3. Gmail Sync
Proceso automático que parsea emails de Tenpo para extraer compras y pagos.

### 4. TC Billing Cycles
Sistema que calcula automáticamente las fechas de vencimiento basándose en el día de cierre de la tarjeta.

### 5. Compras Manuales
Compras creadas manualmente (no vienen de Gmail) para casos donde no hay email o el email no se parseó correctamente.

---

## 📚 Flujo de Lectura Sugerido

### Para entender la integración completa:
1. [TENPO_INTEGRATION.md](TENPO_INTEGRATION.md) → Overview
2. [tenpo_addon_v1_impl.md](tenpo_addon_v1_impl.md) → Cálculo de intereses
3. [tenpo_addon_fee_base_wiring.md](tenpo_addon_fee_base_wiring.md) → Wiring completo
4. [tenpo_ui_desglose.md](tenpo_ui_desglose.md) → UI

### Para implementar compras manuales:
1. [tenpo-manual-purchases-model.md](tenpo-manual-purchases-model.md) → Modelo
2. [tenpo-manual-purchases-api.md](tenpo-manual-purchases-api.md) → API
3. [tenpo-manual-purchases-ui.md](tenpo-manual-purchases-ui.md) → UI
4. [tenpo-manual-purchases-audit.md](tenpo-manual-purchases-audit.md) → Testing

### Para debugging:
1. [tenpo_auditoria.md](tenpo_auditoria.md) → Estado completo
2. [tenpo_qa_checklist.md](tenpo_qa_checklist.md) → Checklist
3. [cuotas_interes_fix.md](cuotas_interes_fix.md) → Fixes históricos

---

## 🔗 Enlaces Relacionados

- [../ARQUITECTURA.md](../ARQUITECTURA.md) - Arquitectura completa del sistema
- [../CREDENCIALES_GOOGLE.md](../CREDENCIALES_GOOGLE.md) - Setup OAuth2 Gmail
- [../tc-billing/](../tc-billing/) - TC Billing Cycles (relacionado)

---

**Total documentos:** 16  
**Última actualización:** 21 de Febrero, 2026  
**Estado:** ✅ Sistema en producción
