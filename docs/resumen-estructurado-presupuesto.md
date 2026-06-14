# Análisis: Resumen Estructurado de Presupuesto

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Objetivo:** Analizar el estado actual del resumen de presupuesto y proponer visualización jerárquica

---

## 🎯 Jerarquía Funcional Confirmada

Esta es la estructura jerárquica real del sistema:

### Nivel 1: Grupos Raíz
- **INGRESOS** (accountType = 'INGRESO')
- **GASTOS** (accountType = 'GASTO')
- **AHORROS** (accountType = 'AHORRO')

### Nivel 2: Tipos

#### Para INGRESOS → Tipo (sin subtipo)
Ejemplos:
- Sueldo
- Bonos
- Arriendo

#### Para GASTOS → Tipo
Ejemplos:
- Suscripciones
- Servicios Básicos
- Obligaciones
- Hipotecario
- Supermercado

#### Para AHORROS → Tipo (sin subtipo)
Ejemplos:
- AFP
- Fondo de emergencia
- Inversiones

### Nivel 3: Subtipos (SOLO para GASTOS)

Solo los **GASTOS** tienen un tercer nivel de detalle:
- Suscripciones → Disney+, Netflix, Spotify
- Servicios Básicos → Luz, Agua, Gas, Internet
- Obligaciones → Préstamo Auto, Tarjeta Ripley

### Resumen Visual

```
INGRESOS (nivel 1)
└── Tipo (nivel 2)

GASTOS (nivel 1)
└── Tipo (nivel 2)
    └── Subtipo (nivel 3)

AHORROS (nivel 1)
└── Tipo (nivel 2)
```

### ⚠️ IMPORTANTE: Conceptos que NO existen

- ❌ **NO existe** "Gastos Fijos" / "Gastos Variables" como agrupadores
- ❌ **NO existe** nivel 3 para Ingresos
- ❌ **NO existe** nivel 3 para Ahorros
- ✅ **SOLO Gastos** tiene 3 niveles visuales

---

## 📊 Estado Actual del Resumen

### 1. Arquitectura Actual

Existen **dos sistemas paralelos** para mostrar resumen de presupuesto:

#### A. Sistema Legacy (consolidado.ts)
- **Ubicación:** `node-version/src/services/consolidado.ts`
- **Función principal:** `getMonthlyBudget(year, month)`
- **Usado por:** Página "Actual" (comparación presupuesto vs real)
- **Enfoque:** Queries directas a múltiples tablas legacy

#### B. Sistema Nuevo (v2 API + dimensional)
- **Ubicación:** `node-version/src/routes/v2/budget.ts`
- **Helpers:** `node-version/src/helpers/dimensional.ts`
- **Usado por:** `PresupuestoResumenNew.tsx`
- **Enfoque:** Consulta tabla de hechos dimensional `fact_financial` con escenario `BUDGET`

---

## 🗂️ Archivos y Fuentes de Datos Involucradas

### Backend

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `src/services/consolidado.ts` | Lógica consolidación legacy | ✅ Activo |
| `src/routes/actual.ts` | API `/api/actual/summary` (usa consolidado.ts) | ✅ Activo |
| `src/routes/v2/budget.ts` | API v2 `/api/v2/budget/*` (dimensional) | ✅ Activo |
| `src/helpers/dimensional.ts` | Queries a `fact_financial` y `dim_account` | ✅ Activo |

### Frontend

| Archivo | Propósito | Sistema |
|---------|-----------|---------|
| `client/src/pages/PresupuestoResumenNew.tsx` | Resumen anual presupuesto | v2 (dimensional) |
| `client/src/pages/Actual.tsx` | Comparación Presupuesto vs Actual mensual | Legacy (consolidado.ts) |
| `client/src/components/actual/ActualConsolidatedTable.tsx` | Tabla consolidada con categorías | Legacy |
| `client/src/api/v2Api.ts` | Cliente API v2 | v2 |
| `client/src/api/actualApi.ts` | Cliente API legacy | Legacy |

### Modelo de Datos

| Tabla/Modelo | Uso |
|--------------|-----|
| `presupuestoIngreso` | Ingresos mensuales (legacy) |
| `subscription` | Suscripciones con periodicidad |
| `obligacion` | Créditos y seguros |
| `mortgagePayment` | Dividendos hipotecarios |
| `mortgageInsurance` | Seguros hipotecarios |
| `presupuestoServicioBasico` | Servicios básicos mensuales |
| `supermercadoPresupuesto` | Presupuesto de supermercado |
| `presupuestoAhorro` | Ahorros mensuales |
| `fact_financial` | Hechos financieros (dimensional, nuevo) |
| `dim_account` | Jerarquía de cuentas (dimensional, nuevo) |
| `dim_scenario` | Escenarios BUDGET/ACTUAL (dimensional, nuevo) |
| `dim_time` | Dimensión tiempo (dimensional, nuevo) |

---

## 🏗️ Cómo Están Modeladas las Cuentas y Niveles

### Sistema Legacy (consolidado.ts)

**Estructura:** Enum plano de 9 categorías fijas

```typescript
interface MonthlyBudget {
  INGRESOS: MonthlyBudgetLine[];
  SUSCRIPCIONES: MonthlyBudgetLine[];
  OBLIGACIONES: MonthlyBudgetLine[];
  HIPOTECARIO: MonthlyBudgetLine[];
  SERVICIOS_BASICOS: MonthlyBudgetLine[];
  SUPERMERCADO: MonthlyBudgetLine[];
  PAGO_TC: MonthlyBudgetLine[];
  AJUSTES: MonthlyBudgetLine[];
  AHORROS: MonthlyBudgetLine[];
}
```

**Características:**
- ❌ Sin jerarquía - categorías al mismo nivel
- ❌ Hardcoded - no se pueden crear categorías dinámicamente
- ✅ Funcional - cubre casos de uso actuales
- ✅ Totales calculados on-the-fly

**Ejemplo de línea:**
```typescript
{
  itemKey: "ingreso:1",
  label: "Sueldo Principal",
  amountClp: 2500000
}
```

### Sistema Dimensional (dim_account)

**Estructura:** Árbol jerárquico según funcionalidad confirmada

```
ROOT (level 0)
├── INGRESOS (level 1, type=INGRESO)
│   ├── ING.001 (level 2, isBaseMember=true) "Sueldo Principal"
│   ├── ING.002 (level 2, isBaseMember=true) "Sueldo Cónyuge"
│   └── ING.003 (level 2, isBaseMember=true) "Bonos"
│
├── GASTOS (level 1, type=GASTO)
│   ├── GAS.SUS (level 2) "Suscripciones"
│   │   ├── GAS.SUS.001 (level 3, isBaseMember=true) "Netflix"
│   │   ├── GAS.SUS.002 (level 3, isBaseMember=true) "Spotify"
│   │   └── GAS.SUS.003 (level 3, isBaseMember=true) "Disney+"
│   ├── GAS.SER (level 2) "Servicios Básicos"
│   │   ├── GAS.SER.001 (level 3, isBaseMember=true) "Luz"
│   │   ├── GAS.SER.002 (level 3, isBaseMember=true) "Agua"
│   │   ├── GAS.SER.003 (level 3, isBaseMember=true) "Gas"
│   │   └── GAS.SER.004 (level 3, isBaseMember=true) "Internet"
│   ├── GAS.OBL (level 2) "Obligaciones"
│   │   ├── GAS.OBL.001 (level 3, isBaseMember=true) "Préstamo Auto"
│   │   └── GAS.OBL.002 (level 3, isBaseMember=true) "Tarjeta Ripley"
│   ├── GAS.HIP (level 2) "Hipotecario"
│   │   ├── GAS.HIP.001 (level 3, isBaseMember=true) "Dividendo"
│   │   └── GAS.HIP.002 (level 3, isBaseMember=true) "Seguro Desgravamen"
│   └── GAS.SUP (level 2) "Supermercado"
│       └── GAS.SUP.001 (level 3, isBaseMember=true) "Supermercado"
│
└── AHORROS (level 1, type=AHORRO)
    ├── AHO.001 (level 2, isBaseMember=true) "AFP"
    ├── AHO.002 (level 2, isBaseMember=true) "Cuenta Vista"
    └── AHO.003 (level 2, isBaseMember=true) "Fondo de Emergencia"
```

**Tabla dim_account:**
```sql
CREATE TABLE dim_account (
  account_id        INTEGER PRIMARY KEY,
  account_code      TEXT UNIQUE,       -- 'ING.001', 'GAS.SUS', 'GAS.SUS.001'
  account_name      TEXT,              -- 'Sueldo Principal', 'Suscripciones', 'Netflix'
  parent_id         INTEGER,           -- FK a dim_account
  level             INTEGER,           -- 0=ROOT, 1=ING/GAS/AHO, 2=Tipo (3=Subtipo solo para Gastos)
  is_base_member    BOOLEAN,           -- TRUE = hoja editable
  account_type      TEXT,              -- 'INGRESO' | 'GASTO' | 'AHORRO'
  sort_order        INTEGER,
  is_active         BOOLEAN
)
```

**Características:**
- ✅ Jerarquía funcional confirmada
- ✅ Ingresos: 2 niveles (Grupo → Tipo)
- ✅ Gastos: 3 niveles (Grupo → Tipo → Subtipo)
- ✅ Ahorros: 2 niveles (Grupo → Tipo)
- ✅ Código jerárquico - facilita filtrado (ej: `GAS.SUS%` para todas las suscripciones)
- ✅ Separación hojas (base members) vs nodos agrupadores
- ⚠️ Requiere migración de datos legacy

---

## 💡 Propuesta: Resumen Agrupado por Ingresos / Gastos / Ahorros

### Objetivo

Mostrar el resumen de presupuesto con **agrupación jerárquica visual** en 3 niveles principales:
1. **INGRESOS** (agrupador)
2. **GASTOS** (agrupador)
3. **AHORROS** (agrupador)

Dentro de cada grupo, expandir/colapsar subcategorías.

### Diseño Funcional

#### Vista Anual (PresupuestoResumenNew.tsx)

**Estado Actual:**
- Muestra totales anuales: Ingresos, Gastos, Ahorros, Tasa de ahorro
- Gráfico de barras mensual
- Tabla plana de cuentas (sin jerarquía visual)

**Propuesta:**
- ✅ Mantener cards de resumen (ya están agrupados por `ING.`, `GAS.`, `AHO.`)
- ✅ Agregar vista de tabla jerárquica con expand/collapse
- ✅ Toggle entre vista "Anual" y "Mensual"

**Estructura de tabla propuesta:**

```
┌─ � INGRESOS                    [12,000,000]  ▼
│   ├─ Sueldo Principal           [8,000,000]
│   ├─ Sueldo Cónyuge             [3,500,000]
│   └─ Bonos                        [500,000]
│
├─ 💸 GASTOS                     [10,500,000]  ▼
│   ├─ Suscripciones                [240,000]  ▼
│   │   ├─ Netflix                   [80,000]
│   │   ├─ Spotify                   [80,000]
│   │   └─ Disney+                   [80,000]
│   ├─ Servicios Básicos            [600,000]  ▼
│   │   ├─ Luz                      [150,000]
│   │   ├─ Agua                     [150,000]
│   │   ├─ Gas                      [150,000]
│   │   └─ Internet                 [150,000]
│   ├─ Obligaciones               [1,800,000]  ▼
│   │   ├─ Préstamo Auto          [1,200,000]
│   │   └─ Tarjeta Ripley           [600,000]
│   ├─ Hipotecario                [5,360,000]  ▼
│   │   ├─ Dividendo              [5,000,000]
│   │   └─ Seguro Desgravamen       [360,000]
│   └─ Supermercado               [2,500,000]  ▼
│       └─ Supermercado           [2,500,000]
│
└─ 🏦 AHORROS                     [1,500,000]  ▼
    ├─ AFP                          [800,000]
    ├─ Cuenta Vista                 [500,000]
    └─ Fondo de Emergencia          [200,000]
```

#### Vista Mensual (Actual.tsx)

**Estado Actual (ActualConsolidatedTable.tsx):**
- Muestra comparación Presupuesto vs Real por categoría
- Ya tiene agrupación básica: INGRESOS, GASTOS (grupo visual), AHORROS
- Expand/collapse por categoría

**Mejora Propuesta:**
- ✅ Mantener estructura actual (funciona bien)
- ✅ Renderizar jerarquía real:
  - INGRESOS → Tipos directos (sin subcategorías)
  - GASTOS → Tipos → Subtipos (3 niveles)
  - AHORROS → Tipos directos (sin subcategorías)

---

## 🌳 Visualización por Niveles Jerárquicos

### Opción 1: Migrar a dim_account (Recomendada a largo plazo)

**Ventajas:**
- ✅ Jerarquía real en base de datos
- ✅ Queries recursivas eficientes
- ✅ Totales agregados calculables por nivel
- ✅ Extensible a futuros niveles

**Desventajas:**
- ⚠️ Requiere migración completa de datos
- ⚠️ Refactor de consolidado.ts → queries a fact_financial
- ⚠️ Riesgo medio-alto

**Implementación:**
```typescript
// Ejemplo de query jerárquica
const hierarchy = await prisma.dimAccount.findMany({
  where: { level: 1 },
  include: {
    children: {
      include: {
        children: {
          include: { children: true }
        }
      }
    }
  }
});
```

### Opción 2: Vista Virtual (Recomendada a corto plazo)

**Ventajas:**
- ✅ Zero cambios en backend/DB
- ✅ Rápido de implementar (1-2 días)
- ✅ Sin riesgo de regresión

**Desventajas:**
- ⚠️ Jerarquía hardcoded en frontend
- ⚠️ No escalable más allá de 2-3 niveles

**Implementación:**
```typescript
// Configuración de agrupación (frontend)
const HIERARCHY_CONFIG = {
  INGRESOS: {
    label: 'Ingresos',
    icon: '💰',
    maxLevels: 2,  // Grupo → Tipo
    children: ['INGRESOS'] // categoría legacy
  },
  GASTOS: {
    label: 'Gastos',
    icon: '💸',
    maxLevels: 3,  // Grupo → Tipo → Subtipo
    children: {
      'Suscripciones': ['SUSCRIPCIONES'],
      'Servicios Básicos': ['SERVICIOS_BASICOS'],
      'Obligaciones': ['OBLIGACIONES'],
      'Hipotecario': ['HIPOTECARIO'],
      'Supermercado': ['SUPERMERCADO'],
      'Ajustes': ['AJUSTES'],
      'Pago TC': ['PAGO_TC']
    }
  },
  AHORROS: {
    label: 'Ahorros',
    icon: '🏦',
    maxLevels: 2,  // Grupo → Tipo
    children: ['AHORROS']
  }
};
```

---

## 📋 Reglas Funcionales

### Totales y Agregaciones

1. **Total por Grupo (nivel 1):**
   - INGRESOS = Suma de todos los tipos de ingresos
   - GASTOS = Suma de todos los tipos de gastos
   - AHORROS = Suma de todos los tipos de ahorros

2. **Total por Tipo (nivel 2):**
   - Para Ingresos: Suma directa de montos (sin nivel 3)
   - Para Gastos: Suma de todos los subtipos bajo ese tipo
   - Para Ahorros: Suma directa de montos (sin nivel 3)

3. **Total por Subtipo (nivel 3, solo Gastos):**
   - Suscripciones = Suma de (Netflix + Spotify + Disney+ + ...)
   - Servicios Básicos = Suma de (Luz + Agua + Gas + Internet + ...)
   - Obligaciones = Suma de (Préstamo Auto + Tarjetas + Seguros + ...)
   - Etc.

4. **Balance:**
   - Balance = INGRESOS - GASTOS
   - Tasa de Ahorro = (AHORROS / INGRESOS) * 100

### Comportamiento de Expand/Collapse

1. **Default:** Grupos principales expandidos, subgrupos colapsados
2. **Persistencia:** Guardar estado en localStorage por usuario
3. **Click en fila:** Toggle expand/collapse
4. **Icono visual:** ▼ (expandido) / ▶ (colapsado)

### Orden de Visualización

**Anual (PresupuestoResumenNew):**
1. INGRESOS (siempre primero)
2. GASTOS (medio)
3. AHORROS (último)

**Mensual (Actual):**
1. INGRESOS (primero)
2. Línea de separador
3. GASTOS (expandible con subgrupos)
4. Total GASTOS (bold)
5. Línea de separador
6. AHORROS (último)

---

## 🔧 Archivos Potencialmente Impactados

### Opción 1: Migración a dim_account

#### Backend
- ✏️ `src/services/consolidado.ts` — Reemplazar queries legacy por queries a `fact_financial`
- ✏️ `src/routes/actual.ts` — Adaptar response shape para incluir jerarquía
- ✏️ `src/helpers/dimensional.ts` — Agregar función `getHierarchicalBudget()`
- ➕ `src/routes/v2/hierarchy.ts` — Nuevo endpoint `/api/v2/accounts/hierarchy`

#### Frontend
- ✏️ `client/src/pages/PresupuestoResumenNew.tsx` — Consumir jeraquía del backend
- ✏️ `client/src/components/actual/ActualConsolidatedTable.tsx` — Renderizar árbol recursivo
- ➕ `client/src/components/budget/HierarchicalTable.tsx` — Componente reutilizable de tabla jerárquica
- ✏️ `client/src/types/actual.ts` — Agregar tipos para jerarquía
- ✏️ `client/src/api/v2Api.ts` — Agregar `fetchAccountHierarchy()`

#### Base de Datos
- ✏️ `prisma/schema_star.prisma` — Ya existe `dim_account`, validar estructura
- ➕ `prisma/migrations/seed_dim_account.sql` — Migrar datos legacy a dim_account
- ➕ `prisma/migrations/populate_fact_financial.sql` — Poblar hechos desde tablas legacy

**Riesgo:** ⚠️ **ALTO** — Requiere testing exhaustivo, posible downtime

---

### Opción 2: Vista Virtual (Sin cambios en backend)

#### Frontend
- ✏️ `client/src/pages/PresupuestoResumenNew.tsx` — Agregar lógica de agrupación jerárquica
- ✏️ `client/src/components/actual/ActualConsolidatedTable.tsx` — Renderizar jerarquía correcta (3 niveles para Gastos)
- ➕ `client/src/components/budget/GroupedCategoryRow.tsx` — Componente de fila agrupada
- ➕ `client/src/config/categoryHierarchy.ts` — Configuración de jerarquía funcional

**Riesgo:** ✅ **BAJO** — Cambios solo en presentación

---

## ⚠️ Riesgos y Dudas

### Riesgos Técnicos

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Regresión en totales después de migración | Alto | Media | Testing exhaustivo con datos de producción |
| Performance degradado con queries recursivas | Medio | Baja | Índices en `parent_id`, límite de niveles a 4-5 |
| Datos legacy inconsistentes al migrar | Alto | Media | Script de validación pre-migración |
| Frontend no soporta árbol de N niveles | Bajo | Baja | Implementar renderizado recursivo (React) |

### Dudas Funcionales

1. **¿Permitir al usuario crear categorías personalizadas?**
   - Si NO → Opción 2 (vista virtual) es suficiente
   - Si SÍ → Requiere Opción 1 (dim_account)

2. **¿La jerarquía actual es definitiva?**
   - Confirmada: Ingresos (2 niveles), Gastos (3 niveles), Ahorros (2 niveles)
   - Si cambia: Solo Opción 1 (dim_account) soporta cambios sin refactor

3. **¿Qué pasa con PAGO_TC y AJUSTES (categorías sin presupuesto)?**
   - Son "catch-all" para gastos no planificados
   - Propuesta: Mantenerlas como Tipos de nivel 2 bajo GASTOS, sin subtipos

4. **¿Cómo manejar cuentas inactivas (is_active=false)?**
   - No mostrar en resumen por default
   - Agregar toggle "Ver cuentas inactivas" (opcional)

5. **¿Sincronizar consolidado.ts con dim_account al agregar nueva fuente?**
   - Si NO se migra: Mantener doble lógica (actual)
   - Si SÍ se migra: Nueva fuente = nuevos registros en `dim_account` + `fact_financial`

---

## 🎯 Recomendación de Implementación

### Fase 1: Quick Win (1-2 días) — Vista Virtual

**Objetivo:** Mejorar UX sin tocar backend

**Tareas:**
1. ✅ Crear `categoryHierarchy.ts` con configuración de jerarquía funcional
2. ✅ Modificar `ActualConsolidatedTable.tsx`:
   - Renderizar Ingresos con 2 niveles (Grupo → Tipo)
   - Renderizar Gastos con 3 niveles (Grupo → Tipo → Subtipo)
   - Renderizar Ahorros con 2 niveles (Grupo → Tipo)
   - Expand/collapse por tipo y subtipo
3. ✅ Modificar `PresupuestoResumenNew.tsx`:
   - Agregar toggle "Vista Plana" vs "Vista Jerárquica"
   - En vista jerárquica, renderizar árbol según jerarquía funcional
4. ✅ Testing con datos reales
5. ✅ Deploy

**Entregables:**
- ✅ UI jerárquica funcional correcta
- ✅ Sin cambios en backend
- ✅ Sin migración de datos

---

### Fase 2: Migración a dim_account (2-3 semanas) — Fundación a largo plazo

**Objetivo:** Implementar jerarquía real en base de datos

**Tareas:**
1. ✅ Validar schema `schema_star.prisma`
2. ✅ Crear script de migración:
   - Poblar `dim_account` desde tablas legacy
   - Poblar `fact_financial` desde presupuestos legacy
   - Validar totales (before/after)
3. ✅ Refactorizar `consolidado.ts`:
   - Reemplazar queries legacy por queries a `fact_financial`
   - Mantener misma firma de función (backwards compatibility)
4. ✅ Crear endpoint `/api/v2/accounts/hierarchy`
5. ✅ Actualizar frontend para consumir jeraquía del backend
6. ✅ Testing A/B: Legacy vs Dimensional (comparar totales)
7. ✅ Deploy progresivo (feature flag)
8. ✅ Deprecar consolidado.ts

**Entregables:**
- ✅ Modelo dimensional operativo
- ✅ Jerarquía extensible
- ✅ Backend unificado (una sola fuente de verdad)

---

## 📌 Conclusión

**Estado Actual:**
- Sistema dual: consolidado.ts (legacy) + v2/budget.ts (dimensional)
- Categorías planas en legacy, jerarquía en dimensional
- Frontend mixto: `PresupuestoResumenNew` usa v2, `Actual` usa legacy

**Jerarquía Funcional Confirmada:**
- Ingresos: 2 niveles (Grupo → Tipo)
- Gastos: 3 niveles (Grupo → Tipo → Subtipo)
- Ahorros: 2 niveles (Grupo → Tipo)

**Propuesta Corto Plazo (Opción 2):**
- Agregar visualización jerárquica en frontend sin tocar backend
- Riesgo bajo, impacto inmediato en UX
- Respetar jerarquía funcional confirmada

**Propuesta Largo Plazo (Opción 1):**
- Migrar completamente a modelo dimensional
- Deprecar consolidado.ts
- Jerarquía real y extensible

**Siguiente Paso:**
- Implementar Fase 1 (vista virtual) para validar UX con usuarios
- Planificar Fase 2 (migración) basado en feedback

---

## 📚 Referencias

- [docs/auditorias/dimensional-model-star-schema-audit.md](auditorias/dimensional-model-star-schema-audit.md) — Diseño del modelo dimensional
- [docs/changelogs/2026-04-05-frontend-migration-v2-api.md](changelogs/2026-04-05-frontend-migration-v2-api.md) — Migración a API v2
- [docs/archive/RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md](archive/RESUMEN_IMPLEMENTACION_BACKEND_ACTUAL.md) — Implementación módulo Actual
- [node-version/prisma/schema_star.prisma](../node-version/prisma/schema_star.prisma) — Schema dimensional

---

**Autor:** GitHub Copilot  
**Revisión:** 2026-04-21 - Jerarquía funcional confirmada y corregida  
**Estado:** ✅ Revisado - Base funcional correcta
