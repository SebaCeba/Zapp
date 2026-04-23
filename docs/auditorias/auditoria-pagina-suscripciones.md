# Auditoría: Página de Suscripciones `/suscripciones`

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Estado:** 🔴 Desactualizada - Usa modelo legacy, no integrada con modelo dimensional

---

## 📍 Ubicación y Arquitectura

### Frontend
**Página Principal:** `node-version/client/src/pages/Subscriptions.tsx`  
**Ruta:** `/suscripciones`  
**Layout:** MainLayout

**Componentes Utilizados:**
- ✅ `components/subscriptions/NewSubscriptionForm.tsx` - Formulario de nueva suscripción (Tailwind)
- ✅ `components/subscriptions/AnnualPlanningTable.tsx` - Tabla de planificación anual (Tailwind)
- ✅ `components/subscriptions/MonthlyEvolutionChart.tsx` - Gráfico de evolución mensual (Tailwind)
- ✅ `components/subscriptions/NextPaymentCard.tsx` - Tarjeta de próximo pago (Tailwind)
- ❌ `components/SubscriptionTable.tsx` - **USA RSUITE** (legacy, no se usa en Subscriptions.tsx)

**Componentes UI Base:**
- `components/primitives/Card`, `Input`, `Select`, `Button` (Tailwind ✅)
- `components/ui/MetricCard` (Tailwind ✅)

### Backend
**API Endpoint:** `/api/subscriptions`  
**Router:** `node-version/src/routes/subscriptions.ts`  
**Base de Datos:** **LEGACY** (`prisma`, `schema.prisma`, `dev.db`)

---

## 🗄️ Modelo de Datos

### Modelo Legacy (Actualmente en Uso)

**Tabla:** `subscriptions` (schema.prisma)

```prisma
model Subscription {
  id             Int             @id @default(autoincrement())
  name           String
  price          Float
  periodicity    String          // monthly, quarterly, semiannual, annual, weekly
  startDate      DateTime
  startDateId    Int
  calendar       Calendar        @relation(fields: [startDateId], references: [id])
  priceOverrides PriceOverride[]
  createdAt      DateTime        @default(now())
}
```

**Tablas Relacionadas:**
- `calendar` - Fechas de calendario
- `price_overrides` - Sobrescrituras de precio por mes/año

**Características:**
- ✅ Tabla independiente del presupuesto principal
- ✅ Soporta periodicidad (semanal, mensual, trimestral, semestral, anual)
- ✅ Soporta sobrescrituras de precio por mes
- ❌ NO integrada con el modelo dimensional
- ❌ NO usa jerarquía de cuentas
- ❌ NO distingue entre BUDGET y ACTUAL

---

### Modelo Dimensional (Debería Usar)

**Tabla:** `dim_account` + `fact_financial` (schema_star.prisma)

**Cuentas de Suscripciones Actuales:**
```
GAS.SUS           | Suscripciones      | is_base_member=0 (agrupador)
GAS.SUS.001       | Crunchyroll        | is_base_member=1 (transaccional)
GAS.SUS.002       | Google One         | is_base_member=1
GAS.SUS.003       | Lightroom          | is_base_member=1
GAS.SUS.004       | Spotify Familiar   | is_base_member=1
GAS.SUS.005       | YouTube Premium    | is_base_member=1
GAS.SUS.006       | Office 365         | is_base_member=1
GAS.SUS.007       | Disney +           | is_base_member=1
GAS.SUS.008       | Uber One           | is_base_member=1
```

**Estado en fact_financial:**
- ✅ 26 transacciones ACTUAL para 2026 (gastos reales)
- ❌ 0 transacciones BUDGET para 2026 (sin presupuesto)

---

## 🔍 Funcionalidad Actual

### Página `/suscripciones`

**1. Métrica Principal:**
- Muestra "Gasto Anual Proyectado"
- Cálculo: Suma de `price * 12` de todas las suscripciones
- ⚠️ **Simplificado:** Asume todo mensual, ignora periodicidad

**2. Formulario de Nueva Suscripción:**
- Campos: Nombre, Precio Mensual (CLP), Categoría, Periodicidad, Fecha de Próximo Cobro
- Categorías: Streaming, Productividad, Salud, Gaming, Storage, Educación, Otro
- ✅ Componente Tailwind (sin RSuite)
- Periodicidades: Semanal, Mensual, Trimestral, Semestral, Anual

**3. Gráfico de Evolución Mensual:**
- Barras horizontales mostrando gasto por mes
- ⚠️ **Simplificado:** Muestra mismo precio todos los meses
- ⚠️ **No usa periodicidad:** Debería calcular qué meses aplican según la periodicidad

**4. Tarjeta de Próximo Pago:**
- Muestra próxima suscripción a vencer
- ⚠️ **Mock data:** "En 3 días" es hardcoded

**5. Tabla de Planificación Anual:**
- 12 columnas (ENE-DIC)
- Filas: una por suscripción
- ⚠️ **Simplificado:** Muestra mismo precio en todos los meses
- ✅ Sticky header + sticky primera columna
- ✅ Diseño responsive con scroll horizontal
- ✅ Componente Tailwind

**6. Botones de Acción:**
- "Descartar" (sin funcionalidad)
- "Guardar Plan {year}" (sin funcionalidad)
- ⚠️ No guardan nada, aparentemente UI placeholder

---

## 🔌 API Endpoints

### `GET /api/subscriptions`
**Función:** Obtener todas las suscripciones  
**Query:** `prisma.subscription.findMany()`  
**Incluye:** `calendar` relation  
**Ordenamiento:** Por nombre ascendente  
**Usado en:** Subscriptions.tsx, SubscriptionTable.tsx

### `POST /api/subscriptions`
**Función:** Crear nueva suscripción  
**Body:** `{ name, price, periodicity, startDate }`  
**Lógica:**
1. Crea/busca entrada en `calendar` para la fecha
2. Crea `subscription` con relación a `calendar`
**Conversión:** `price` parseado a Float, `startDate` parseado con `date-fns`

### `PUT /api/subscriptions/:id`
**Función:** Actualizar suscripción existente  
**Body:** `{ name, price, periodicity, startDate }`  
**Lógica:** Similar a POST, actualiza registro existente

### `DELETE /api/subscriptions/:id`
**Función:** Eliminar suscripción  
**Response:** 204 No Content

---

## 🎨 UI/UX - Componentes

### ✅ Migrados a Tailwind

**1. NewSubscriptionForm.tsx**
- ✅ Usa `Input`, `Select`, `Button` de `primitives`
- ✅ Sin dependencias de RSuite
- ✅ Diseño coherente con design system

**2. AnnualPlanningTable.tsx**
- ✅ Tabla HTML nativa con Tailwind
- ✅ Sticky header y columna
- ✅ Responsive con scroll horizontal
- ✅ Diseño consistente (border-[#F1EFE9], bg-surface-container-low)

**3. MonthlyEvolutionChart.tsx**
- ✅ Gráfico de barras con divs + Tailwind
- ✅ Sin librerías de charts
- ✅ Animaciones CSS (transition-all duration-500)

**4. NextPaymentCard.tsx**
- ✅ Card con gradiente (from-primary/5 to-secondary/5)
- ✅ Material Icons
- ✅ Diseño coherente

**5. Subscriptions.tsx (página principal)**
- ✅ Usa MainLayout
- ✅ MetricCard de `components/ui`
- ✅ Grid responsive (lg:grid-cols-2)
- ✅ Formato consistente (titulo + subtitulo)

### ❌ Legacy con RSuite

**SubscriptionTable.tsx**
- ❌ Usa RSuite: `Input`, `InputNumber`, `SelectPicker`, `DatePicker`, `Button`, `Table`
- ❌ NO se usa en `Subscriptions.tsx` actual
- ⚠️ Probablemente componente antiguo que quedó
- ✅ Tiene edición inline (buen patrón a migrar)

---

## ⚠️ Problemas Identificados

### 🔴 Críticos

**1. Desconexión del Modelo Dimensional**
- ❌ Usa tabla `subscriptions` legacy, NO usa `dim_account` + `fact_financial`
- ❌ No integrada con el resumen de presupuesto
- ❌ No distingue entre BUDGET (planificado) y ACTUAL (real)
- **Impacto:** Datos duplicados, inconsistencia con el resto de la app

**2. Lógica de Periodicidad No Implementada**
- ❌ Guarda `periodicity` pero no la usa en cálculos
- ❌ Tabla anual muestra mismo precio todos los meses (incorrecto para trimestral, semestral, anual)
- ❌ Gráfico de evolución ignora periodicidad
- **Impacto:** Proyecciones anuales incorrectas

**3. Próximo Pago Mockeado**
- ❌ "En 3 días" es hardcoded
- ❌ No calcula próximo vencimiento real desde `startDate` + `periodicity`
- **Impacto:** Funcionalidad inutilizable para planificación real

### 🟡 Moderados

**4. Botones "Guardar Plan" / "Descartar" Sin Función**
- ❌ No tienen `onClick` implementado
- ⚠️ UI placeholder o funcionalidad incompleta
- **Impacto:** Confusión del usuario (botones que no hacen nada)

**5. Categoría No Se Usa**
- ✅ Se captura en formulario
- ❌ NO se guarda en base de datos (model Subscription no tiene campo `category`)
- ❌ Se muestra en tabla anual pero con valor por defecto 'other'
- **Impacto:** Feature parcialmente implementada

**6. SubscriptionTable.tsx Obsoleto**
- ❌ Componente legacy con RSuite
- ❌ No se usa en la página actual
- ⚠️ Debería migrarse o eliminarse
- **Impacto:** Código muerto que confunde

### 🟢 Menores

**7. `price_overrides` No Tiene UI**
- ✅ Modelo existe en schema.prisma
- ❌ No hay UI para crear/editar sobrescrituras
- **Impacto:** Feature avanzada no accesible

**8. Formato de Moneda Inconsistente**
- ⚠️ Algunos lugares usan `toLocaleString('es-CL')`, otros `Intl.NumberFormat`
- ⚠️ Inconsistencia menor pero afecta UX

---

## 🎯 Recomendaciones

### Prioridad 1: Integración con Modelo Dimensional

**Objetivo:** Unificar suscripciones con el modelo dimensional

**Cambios Necesarios:**

1. **Backend - Deprecar API Legacy:**
   - Crear endpoint `/api/v2/subscriptions` que use `dim_account` + `fact_financial`
   - Flujo:
     - GET: Retornar cuentas `GAS.SUS.*` desde `dim_account` + totales desde `fact_financial`
     - POST: Crear nueva cuenta en `dim_account` (GAS.SUS.009, GAS.SUS.010, etc.)
     - PUT: Actualizar `dim_account.account_name`
     - DELETE: Marcar `is_active=false` en `dim_account`

2. **Migración de Datos:**
   - Script SQL para migrar `subscriptions` → `dim_account` + `fact_financial`
   - Mapear:
     - `subscriptions.name` → `dim_account.account_name`
     - `subscriptions.price` → `fact_financial.amount_clp` (mensualizado según periodicidad)
     - Crear hechos para BUDGET (planificado) y ACTUAL (real)

3. **Frontend - Actualizar Página:**
   - Cambiar fetch de `/api/subscriptions` a `/api/v2/subscriptions`
   - Agregar selector BUDGET vs ACTUAL
   - Mostrar jerarquía: GAS.SUS → GAS.SUS.001, GAS.SUS.002, etc.

**Beneficios:**
- ✅ Datos unificados con el resto del presupuesto
- ✅ Visible en resumen de presupuesto
- ✅ Consistencia entre módulos
- ✅ Soporte para escenarios (BUDGET/ACTUAL)

---

### Prioridad 2: Implementar Lógica de Periodicidad

**Objetivo:** Calcular correctamente qué meses aplican según periodicidad

**Cambios Necesarios:**

1. **Función de Cálculo:**
```typescript
// Calcular meses activos según periodicidad
function getActiveMonths(startDate: Date, periodicity: string, year: number): number[] {
  // monthly: todos los meses
  // quarterly: cada 3 meses desde startDate
  // semiannual: cada 6 meses
  // annual: solo mes de startDate
  // weekly: agregar suma semanal
}
```

2. **Actualizar AnnualPlanningTable.tsx:**
   - Usar `getActiveMonths()` para determinar qué celdas mostrar precio
   - Celdas sin actividad: mostrar vacías o "-"

3. **Actualizar MonthlyEvolutionChart.tsx:**
   - Calcular montos reales por mes considerando periodicidad
   - Totales correctos (no todos iguales)

**Beneficios:**
- ✅ Proyecciones anuales correctas
- ✅ Gráfico realista
- ✅ Planificación confiable

---

### Prioridad 3: Calcular Próximo Pago Real

**Objetivo:** Mostrar próxima fecha de vencimiento real

**Cambios Necesarios:**

1. **Backend - Nuevo Endpoint:**
```typescript
GET /api/v2/subscriptions/next-payment
// Retorna { serviceName, nextDate, amount }
// Lógica: calcular siguiente fecha desde startDate + periodicity
```

2. **Frontend - Actualizar NextPaymentCard:**
   - Fetch desde endpoint
   - Calcular `daysUntilPayment` desde `nextDate` - hoy
   - Mostrar fecha exacta

**Beneficios:**
- ✅ Funcionalidad útil para planificación
- ✅ Alertas reales de vencimientos

---

### Prioridad 4: Agregar Campo Categoría a Modelo

**Objetivo:** Guardar y usar categoría de suscripciones

**Opciones:**

**Opción A: Agregar campo a schema.prisma (legacy)**
```prisma
model Subscription {
  category String? @default("other")
}
```

**Opción B: Usar modelo dimensional (recomendado)**
- Crear subcategorías en `dim_account`:
  - `GAS.SUS.STR` - Streaming (padre de Netflix, Disney+, etc.)
  - `GAS.SUS.PRO` - Productividad (padre de Office 365, etc.)
  - Mantener nivel 4: `GAS.SUS.STR.001` - Netflix

**Recomendación:** Opción B (más consistente con jerarquía)

---

### Prioridad 5: Migrar o Eliminar SubscriptionTable.tsx

**Opción A: Migrar a Tailwind**
- Reemplazar RSuite por componentes primitivos
- Mantener funcionalidad de edición inline
- Integrar en página principal como tabla alternativa

**Opción B: Eliminar**
- Si no se usa, eliminar para reducir confusión
- Dejar solo AnnualPlanningTable.tsx

**Recomendación:** Opción A si se necesita edición inline rápida, Opción B si no

---

### Prioridad 6: Implementar Botones de Acción

**"Guardar Plan {year}":**
- Crear hechos en `fact_financial` para BUDGET
- Iterar todas las suscripciones y crear registros mensuales según periodicidad

**"Descartar":**
- Resetear formularios o navegar de vuelta

---

## 📊 Comparación: Legacy vs Dimensional

| Aspecto | Modelo Legacy (Actual) | Modelo Dimensional (Recomendado) |
|---------|------------------------|----------------------------------|
| **Tabla Principal** | `subscriptions` | `dim_account` (GAS.SUS.*) |
| **Transacciones** | N/A (solo meta) | `fact_financial` |
| **Jerarquía** | ❌ No | ✅ Sí (GAS → GAS.SUS → GAS.SUS.001) |
| **Escenarios** | ❌ No | ✅ BUDGET / ACTUAL |
| **Periodicidad** | ✅ Campo existe | ⚠️ Calcular en hechos mensuales |
| **Sobrescrituras** | ✅ `price_overrides` | ✅ Hechos individuales por mes |
| **Integración Presupuesto** | ❌ Desconectado | ✅ Unificado |
| **Visible en Resumen** | ❌ No | ✅ Sí |
| **API** | `/api/subscriptions` | `/api/v2/subscriptions` (a crear) |

---

## 🚧 Estimación de Esfuerzo

### Migración Completa a Modelo Dimensional

**Fase 1: Backend (2-3 días)**
- Crear endpoints `/api/v2/subscriptions/*`
- Script de migración de datos
- Testing de API

**Fase 2: Frontend (2 días)**
- Actualizar fetch a v2
- Agregar selector BUDGET/ACTUAL
- Integrar con jerarquía

**Fase 3: Lógica de Periodicidad (1 día)**
- Implementar `getActiveMonths()`
- Actualizar tabla y gráfico

**Fase 4: Próximo Pago (1 día)**
- Endpoint de cálculo
- Actualizar card

**Fase 5: Categorías como Subcategorías (2 días)**
- Extender jerarquía a nivel 4
- Migrar datos
- Actualizar UI

**Total Estimado:** 8-10 días

---

## 🔗 Archivos Involucrados

### Frontend
```
node-version/client/src/
├── pages/
│   └── Subscriptions.tsx                           (página principal)
├── components/
│   ├── SubscriptionTable.tsx                       (legacy RSuite, no usado)
│   └── subscriptions/
│       ├── AnnualPlanningTable.tsx                 (tabla anual ✅)
│       ├── MonthlyEvolutionChart.tsx               (gráfico ✅)
│       ├── NewSubscriptionForm.tsx                 (formulario ✅)
│       ├── NextPaymentCard.tsx                     (próximo pago ⚠️)
│       └── index.ts
```

### Backend
```
node-version/src/
├── routes/
│   └── subscriptions.ts                            (API legacy)
└── index.ts                                        (router mount)
```

### Schema
```
node-version/prisma/
├── schema.prisma                                   (legacy: Subscription, Calendar, PriceOverride)
└── schema_star.prisma                              (dimensional: dim_account GAS.SUS.*)
```

---

## 📝 Decisiones de Arquitectura Pasadas (Inferidas)

1. **Tabla Separada:** Se creó `subscriptions` como módulo independiente del presupuesto principal
   - **Pro:** Desarrollo rápido, aislado
   - **Contra:** Duplicación de datos, inconsistencia con modelo dimensional

2. **Modelo de Sobrescrituras:** Se previó necesidad de ajustar precios por mes (`price_overrides`)
   - **Pro:** Flexibilidad para casos especiales
   - **Contra:** No tiene UI, no se usa

3. **Periodicidad String:** Se guardó como texto libre en lugar de enum
   - **Pro:** Flexible
   - **Contra:** Validación débil, cálculos complejos

4. **Calendar como Tabla:** Se creó tabla `calendar` para normalizar fechas
   - **Pro:** Relaciones limpias
   - **Contra:** Complejidad innecesaria (solo para subscriptions)

---

## 🎬 Conclusión

**Estado Actual:** Página funcional para CRUD básico de suscripciones, pero **desconectada del modelo dimensional** y con **lógica de periodicidad no implementada**.

**Prioridad:** Si se quiere que las suscripciones sean parte integral del presupuesto (visible en resumen, consolidado, reportes), **migrar a modelo dimensional es mandatorio**.

**Alternativa:** Si se quiere mantener como módulo independiente, al menos **implementar periodicidad correctamente** y **calcular próximo pago real**.

**Recomendación:** **Migración completa a modelo dimensional** para unificar datos y aprovechar jerarquía + escenarios.

---

**Autor:** GitHub Copilot  
**Auditoría realizada:** 2026-04-21
