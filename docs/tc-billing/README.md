# TC Billing Cycles (Ciclos de Facturación)

Sistema de gestión de ciclos de facturación para tarjetas de crédito, que calcula automáticamente las fechas de vencimiento de cuotas basándose en el día de cierre y días hasta vencimiento configurados.

---

## 📋 Documentos

### 📐 Diseño del Sistema
**[tc-billing-cycle-design.md](tc-billing-cycle-design.md)**
- Diseño completo del sistema
- Lógica de cálculo de fechas
- Reglas de negocio (ajuste fin de semana, etc.)
- Casos de uso y ejemplos
- Modelo de datos

**Estado:** 📐 DISEÑO

---

### 🔧 Implementación Backend
**[tc-billing-cycle-backend.md](tc-billing-cycle-backend.md)**
- Implementación Prisma + Express
- API endpoints completos
- Service layer (tcBillingCycle.service.ts)
- Lógica de recalculación masiva
- Testing y validación

**Estado:** ✅ IMPLEMENTADO

---

### 🎨 Implementación UI
**[tc-billing-cycle-ui.md](tc-billing-cycle-ui.md)**
- Página ConfiguracionTC.tsx
- Componentes React:
  - TcConfigForm
  - TcAnnualCyclesTable
  - TcOverridesTable
  - TcRecalculationPanel
- CSS Modules
- Flujo de usuario completo

**Estado:** ✅ IMPLEMENTADO

---

### 🔍 Auditoría
**[auditoria-routing-configuracion-tc.md](auditoria-routing-configuracion-tc.md)**
- Auditoría de routing y configuración
- Verificación de implementación
- Issues encontrados y soluciones
- Testing checklist

**Estado:** ✅ COMPLETADO

---

## 🎯 Propósito del Sistema

### Problema que Resuelve
Las tarjetas de crédito tienen ciclos de facturación fijos (ej: día 5 de cada mes) y días de pago fijos después del cierre. Sin este sistema, calcular manualmente las fechas de vencimiento de cuotas mensuales es propenso a errores.

### Solución
Automatizar el cálculo de fechas de vencimiento basándose en:
- **Día de cierre** (ej: 5)
- **Días hasta vencimiento** (ej: 20 días después del cierre)
- **Ajuste de fines de semana** (mover al lunes siguiente)
- **Overrides manuales** (para casos especiales)

---

## 🏗️ Arquitectura

```
Frontend (React)
    ↓
API /api/tc-billing/:tcKey
    ↓
tcBillingCycle.service.ts
    ↓
Prisma ORM
    ↓
SQLite Database
    ├── TcBillingConfig
    ├── TcBillingCycleEntry
    └── TcBillingOverride
```

---

## 📊 Modelos de Datos

### TcBillingConfig
Configuración base de una tarjeta:
```typescript
{
  tcKey: string             // "tenpo", "bci", etc.
  closingDay: number        // 1-31
  daysUntilDue: number      // ej: 20
}
```

### TcBillingCycleEntry
Ciclo específico de un mes:
```typescript
{
  tcKey: string
  year: number
  month: number
  closingDate: DateTime
  dueDate: DateTime
}
```

### TcBillingOverride
Override manual de fecha:
```typescript
{
  tcKey: string
  year: number
  month: number
  newDueDate: DateTime
  reason: string?
}
```

---

## 🔄 Flujos Principales

### 1. Crear/Actualizar Configuración
```
Usuario → FormulariConfig → POST /api/tc-billing/:tcKey
→ Validar datos
→ Guardar config
→ Recalcular 12 meses del año actual
→ Retornar ciclos generados
```

### 2. Override de Fecha
```
Usuario → TablaOverrides → POST /api/tc-billing/:tcKey/override
→ Guardar override
→ Actualizar CycleEntry correspondiente
→ Recalcular cuotas Tenpo afectadas
→ Retornar cambios
```

### 3. Recalculación Masiva
```
Usuario → Panel Recalculación → POST /api/tc-billing/:tcKey/recalculate
→ Borrar ciclos del año
→ Regenerar desde config + overrides
→ Actualizar cuotas Tenpo del año
→ Retornar resumen de cambios
```

---

## 🎨 Componentes UI

| Componente | Propósito |
|------------|-----------|
| **TcConfigForm** | Formulario configuración base (closing day, days until due) |
| **TcAnnualCyclesTable** | Tabla con 12 meses y fechas calculadas |
| **TcOverridesTable** | Gestión de overrides manuales |
| **TcRecalculationPanel** | Panel para recalcular todo el año |

---

## 📅 Ejemplo de Cálculo

**Configuración:**
- Closing day: 5
- Days until due: 20

**Resultado para Febrero 2026:**
1. Fecha cierre: 2026-02-05 (jueves)
2. Fecha vencimiento: 2026-02-05 + 20 días = 2026-02-25 (miércoles)
3. No cae en fin de semana → Fecha final: **2026-02-25**

**Resultado para Marzo 2026:**
1. Fecha cierre: 2026-03-05 (jueves)
2. Fecha vencimiento: 2026-03-05 + 20 días = 2026-03-25 (miércoles)
3. No cae en fin de semana → Fecha final: **2026-03-25**

**Si cae en sábado:**
- Se mueve al lunes siguiente

---

## 🧪 Testing

### Casos de Prueba Principales
1. ✅ Config nueva genera 12 ciclos
2. ✅ Override actualiza fecha correctamente
3. ✅ Recalculación regenera todo
4. ✅ Ajuste de fin de semana funciona
5. ✅ Cuotas Tenpo se actualizan al recalcular
6. ✅ UI muestra cambios en tiempo real

Ver: [auditoria-routing-configuracion-tc.md](auditoria-routing-configuracion-tc.md)

---

## 🔗 Integración con Tenpo

Este sistema se integra con el módulo Tenpo para actualizar automáticamente las fechas de vencimiento de cuotas cuando hay cambios en el ciclo de facturación.

**Flujo:**
1. Usuario recalcula billing cycle
2. Backend detecta cambios en fechas
3. Backend actualiza `TenpoInstallment.dueDate` para todas las cuotas afectadas
4. Frontend refresca datos

---

## 📚 Flujo de Lectura Sugerido

### Para entender el sistema:
1. [tc-billing-cycle-design.md](tc-billing-cycle-design.md) → Diseño y lógica
2. [tc-billing-cycle-backend.md](tc-billing-cycle-backend.md) → Implementación backend
3. [tc-billing-cycle-ui.md](tc-billing-cycle-ui.md) → Implementación frontend

### Para verificar implementación:
1. [auditoria-routing-configuracion-tc.md](auditoria-routing-configuracion-tc.md) → Auditoría completa

---

## 🔗 Enlaces Relacionados

- [../ARQUITECTURA.md](../ARQUITECTURA.md) - Arquitectura completa del sistema
- [../tenpo/](../tenpo/) - Integración Tenpo (usa este sistema)
- [../tenpo/tenpo_calendar_override.md](../tenpo/tenpo_calendar_override.md) - Overrides en Tenpo

---

**Total documentos:** 4  
**Última actualización:** 21 de Febrero, 2026  
**Estado:** ✅ Sistema en producción
