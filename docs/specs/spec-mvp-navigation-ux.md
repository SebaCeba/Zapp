# Especificación MVP: Navegación y UX

**Fecha:** 2026-03-15  
**Estado:** Especificación de UX - NO IMPLEMENTAR AÚN  
**Versión:** 1.0  
**Propósito:** Definir la navegación, vistas y flujos UX mínimos para el MVP de Finanzapp

---

## 1. Resumen Ejecutivo

### 1.1 Principios de UX del MVP

**Premisas Funcionales:**
- ✅ **Dashboard global primero:** Punto de entrada = lista de presupuestos del usuario
- ✅ **Contexto de presupuesto activo:** Usuario selecciona presupuesto y navega dentro de ese contexto
- ✅ **Mensual, no diario:** UI enfocada en meses, no días/transacciones individuales
- ✅ **Comparación BUDGET vs ACTUAL:** Vista principal muestra plan vs real lado a lado
- ✅ **Categorías editables:** Usuario puede modificar árbol de categorías de su presupuesto
- ✅ **Simplicidad máxima:** Solo vistas esenciales, sin features avanzadas

**Restricciones MVP:**
- ❌ **NO autenticación compleja:** Login simplificado (email solamente)
- ❌ **NO roles complejos:** Todos los usuarios con acceso son OWNER
- ❌ **NO onboarding elaborado:** Wizard mínimo al crear presupuesto
- ❌ **NO comparación entre presupuestos:** Cada presupuesto se ve por separado

---

## 2. Sitemap del MVP

### 2.1 Mapa de Navegación

```
/
├── /dashboard (Dashboard Global - PUNTO DE ENTRADA)
│   │
│   ├── [+ Crear Presupuesto] → /budgets/new
│   │
│   └── [Tarjeta: Presupuesto "Hogar"] → /budgets/:budgetId
│       │
│       ├── /budgets/:budgetId/monthly (Vista Mensual - VISTA PRINCIPAL)
│       │   ├── Selector de mes/año (ej: Marzo 2026)
│       │   ├── Tabla de categorías con BUDGET y ACTUAL
│       │   ├── Balance y resúmenes
│       │   └── [Editar entrada] → Modal inline
│       │
│       ├── /budgets/:budgetId/categories (Gestión de Categorías)
│       │   ├── Vista de árbol de categorías
│       │   ├── [+ Agregar categoría]
│       │   ├── [✏️ Editar categoría]
│       │   └── [🗑️ Eliminar categoría]
│       │
│       └── /budgets/:budgetId/settings (Configuración del Presupuesto)
│           ├── Información básica (nombre, descripción)
│           ├── Usuarios con acceso (MVP: solo listar, sin editar)
│           └── [Archivar presupuesto]
│
├── /budgets/new (Crear Nuevo Presupuesto)
│   ├── Formulario: Nombre, Tipo (Personal/Compartido)
│   ├── Confirmación de clonación de plantilla base
│   └── → Redirige a /budgets/:newBudgetId/monthly
│
└── /profile (Perfil de Usuario - OPCIONAL MVP)
    ├── Información personal (nombre, email)
    └── [Cerrar sesión]
```

---

### 2.2 Jerarquía de Navegación

**Nivel 0: Entrada**
- `/` → Redirección automática a `/dashboard`

**Nivel 1: Dashboard Global**
- `/dashboard` → Lista de presupuestos del usuario + botón crear

**Nivel 2: Contexto de Presupuesto**
- `/budgets/:budgetId/monthly` → Vista principal (default)
- `/budgets/:budgetId/categories` → Gestión de categorías
- `/budgets/:budgetId/settings` → Configuración

**Nivel 3: Acciones/Modales**
- Modal de edición de MonthlyEntry (inline, no ruta)
- Modal de agregar/editar categoría (inline, no ruta)
- Formulario de crear presupuesto (`/budgets/new`)

---

## 3. Vistas Mínimas del MVP

### 3.1 Vista: Dashboard Global

**Ruta:** `/dashboard`  
**Propósito:** Punto de entrada - listar presupuestos del usuario

**Componentes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💰 Finanzapp                          [Crear +]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Mis Presupuestos                                           │
│  ═══════════════                                            │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 🏠 Hogar         │  │ 👤 Seba          │               │
│  │ Compartido       │  │ Personal         │               │
│  │ ─────────────    │  │ ─────────────    │               │
│  │ Balance Mar 26:  │  │ Balance Mar 26:  │               │
│  │ $250.000 ✅      │  │ -$50.000 ⚠️      │               │
│  │                  │  │                  │               │
│  │ Ingresos: $6.3M  │  │ Ingresos: $2.5M  │               │
│  │ Gastos: $6.05M   │  │ Gastos: $2.55M   │               │
│  │                  │  │                  │               │
│  │ [Ver detalle →]  │  │ [Ver detalle →]  │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ 👤 Mona          │                                      │
│  │ Personal         │                                      │
│  │ ─────────────    │                                      │
│  │ Balance Mar 26:  │                                      │
│  │ $100.000 ✅      │                                      │
│  │                  │                                      │
│  │ Ingresos: $2.8M  │                                      │
│  │ Gastos: $2.7M    │                                      │
│  │                  │                                      │
│  │ [Ver detalle →]  │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

**Información por Tarjeta:**
- **Icono + Nombre** del presupuesto
- **Tipo:** Compartido o Personal
- **Balance del mes actual:** Comparación ACTUAL vs BUDGET
- **Indicador visual:** ✅ Positivo, ⚠️ Negativo, ℹ️ Neutro
- **Totales:** Ingresos y Gastos del mes actual (ACTUAL)
- **Acción:** Botón "Ver detalle" → `/budgets/:id/monthly`

**Interacciones:**
1. **Click en tarjeta** → Navega a `/budgets/:id/monthly`
2. **Click en [Crear +]** → Navega a `/budgets/new`

**Queries Necesarias:**
```typescript
// GET /api/budgets?userId=:userId
{
  budgets: [
    {
      id: 1,
      name: "Hogar",
      budgetType: "SHARED",
      currentMonthBalance: {
        year: 2026,
        month: 3,
        budgetTotal: 0,      // BUDGET: ingresos - gastos - ahorros
        actualTotal: 250000, // ACTUAL: ingresos - gastos - ahorros
        income: 6300000,     // ACTUAL ingresos
        expense: 6050000     // ACTUAL gastos
      },
      userCount: 2 // Cuántos usuarios tienen acceso (para mostrar "Compartido")
    },
    // ... más presupuestos
  ]
}
```

---

### 3.2 Vista: Detalle de Presupuesto (Mensual)

**Ruta:** `/budgets/:budgetId/monthly`  
**Propósito:** Vista principal - tabla mensual con BUDGET vs ACTUAL por categoría

**Componentes:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ ← Dashboard │ 🏠 Hogar          [← Marzo 2026 →]  [⚙️ Config] │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Tabs: [Mensual] [Categorías] [Configuración]                      │
│        ▔▔▔▔▔▔▔                                                      │
│                                                                     │
│  Resumen del Mes                                                    │
│  ════════════════                                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ INGRESOS      BUDGET: $6.3M   ACTUAL: $6.3M    ✅ $0        │   │
│  │ GASTOS        BUDGET: $6.2M   ACTUAL: $6.05M   ✅ -$150K    │   │
│  │ AHORROS       BUDGET: $100K   ACTUAL: $100K    ✅ $0        │   │
│  │ ─────────────────────────────────────────────────────────── │   │
│  │ BALANCE       BUDGET: $0      ACTUAL: $250K    ✅ +$250K    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Detalle por Categoría                                              │
│  ══════════════════════                                             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Categoría             │ BUDGET    │ ACTUAL    │ Variación     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ ▼ INGRESOS            │ $6.3M     │ $6.3M     │ $0       ✅   │ │
│  │   ▼ Remuneraciones    │ $6.3M     │ $6.3M     │ $0       ✅   │ │
│  │     Sueldo Seba       │ $3.5M     │ $3.5M     │ $0       ✅ ✏️│ │
│  │     Sueldo Mona       │ $2.8M     │ $2.8M     │ $0       ✅ ✏️│ │
│  │                                                                │ │
│  │ ▼ GASTOS              │ $6.2M     │ $6.05M    │ -$150K   ✅   │ │
│  │   ▼ Suscripciones     │ $24K      │ $24K      │ $0       ✅   │ │
│  │     Netflix           │ $12K      │ $12K      │ $0       ✅ ✏️│ │
│  │     Spotify           │ $12K      │ $12K      │ $0       ✅ ✏️│ │
│  │   ▼ Servicios Básicos │ $150K     │ $148.5K   │ -$1.5K   ✅   │ │
│  │     Luz (Enel)        │ $45K      │ $48.5K    │ +$3.5K   ⚠️ ✏️│ │
│  │     Agua              │ $50K      │ $50K      │ $0       ✅ ✏️│ │
│  │     Gas               │ $55K      │ $50K      │ -$5K     ✅ ✏️│ │
│  │   Supermercado        │ $350K     │ $380K     │ +$30K    ⚠️ ✏️│ │
│  │   Hipotecario         │ $5.5M     │ $5.5M     │ $0       ✅ ✏️│ │
│  │                                                                │ │
│  │ ▼ AHORROS             │ $100K     │ $100K     │ $0       ✅   │ │
│  │   Ahorro Mensual      │ $100K     │ $100K     │ $0       ✅ ✏️│ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Características:**
- **Selector de mes/año:** Navegación entre meses (← Marzo 2026 →)
- **Breadcrumb superior:** Navegación rápida al dashboard
- **Tabs horizontales:** [Mensual] [Categorías] [Configuración]
- **Resumen agregado:** Totales por tipo (INGRESOS, GASTOS, AHORROS, BALANCE)
- **Tabla jerárquica expandible:** Árbol de categorías con indentación visual
- **Columnas:**
  - **Categoría:** Nombre con indentación (▼ para expandir/colapsar)
  - **BUDGET:** Monto presupuestado
  - **ACTUAL:** Monto real
  - **Variación:** Diferencia con indicador visual (✅ ⚠️)
  - **[✏️ Editar]:** Solo en categorías hoja

**Interacciones:**
1. **Click en ▼ (categoría grupo)** → Expandir/colapsar hijos
2. **Click en [✏️] (categoría hoja)** → Abrir modal de edición de entrada
3. **← → (selector mes)** → Cambiar mes/año, recargar datos
4. **Click en [Categorías]** → Navega a `/budgets/:id/categories`
5. **Click en [Configuración]** → Navega a `/budgets/:id/settings`
6. **Click en [← Dashboard]** → Volver a `/dashboard`

**Queries Necesarias:**
```typescript
// GET /api/budgets/:budgetId/monthly/:year/:month
{
  budget: { id: 1, name: "Hogar" },
  year: 2026,
  month: 3,
  categories: [
    {
      code: "INGRESOS",
      name: "Ingresos",
      categoryType: "INCOME",
      isLeaf: false,
      children: [
        {
          code: "INGRESOS.REMUNERACIONES",
          name: "Remuneraciones",
          isLeaf: false,
          children: [
            {
              code: "INGRESOS.REMUNERACIONES.SUELDO",
              name: "Sueldo Líquido",
              isLeaf: true,
              entries: [
                { itemKey: "sueldo_seba", itemName: "Sueldo Seba", budget: 3500000, actual: 3500000 },
                { itemKey: "sueldo_mona", itemName: "Sueldo Mona", budget: 2800000, actual: 2800000 }
              ]
            }
          ]
        }
      ]
    },
    // ... resto de categorías
  ],
  summary: {
    income: { budget: 6300000, actual: 6300000 },
    expense: { budget: 6200000, actual: 6050000 },
    savings: { budget: 100000, actual: 100000 },
    balance: { budget: 0, actual: 250000 }
  }
}
```

---

### 3.3 Modal: Editar Entrada Mensual

**Trigger:** Click en [✏️] en categoría hoja  
**Propósito:** Editar/crear MonthlyEntry para BUDGET y ACTUAL

**Componente:**
```
┌─────────────────────────────────────────────────┐
│  Editar: Supermercado - Marzo 2026         [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Categoría: GASTOS.SUPERMERCADO (no editable)  │
│  Mes: Marzo 2026 (no editable)                  │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ PRESUPUESTO (BUDGET)                    │   │
│  │ ─────────────────────────────────────   │   │
│  │ Monto: [$350,000        ] CLP           │   │
│  │ Notas: [                                ]│   │
│  │        [                                ]│   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ REAL (ACTUAL)                           │   │
│  │ ─────────────────────────────────────   │   │
│  │ Monto: [$380,000        ] CLP           │   │
│  │ Notas: [Compramos extra para visitas   ]│   │
│  │        [                                ]│   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Variación: +$30,000 (8.6% sobre presupuesto)  │
│                                                 │
│  [Cancelar]                      [Guardar ✓]   │
└─────────────────────────────────────────────────┘
```

**Campos:**
- **Categoría:** Solo display (no editable, viene del contexto)
- **Mes/Año:** Solo display (no editable, viene del selector)
- **BUDGET:**
  - Monto (número, formato CLP)
  - Notas (opcional, textarea)
- **ACTUAL:**
  - Monto (número, formato CLP)
  - Notas (opcional, textarea)
- **Variación:** Cálculo automático (ACTUAL - BUDGET)

**Validaciones:**
- Monto debe ser >= 0
- Si es categoría EXPENSE, considerar montos positivos (no negativos)
- Formato CLP automático con separadores de miles

**API:**
```typescript
// PUT /api/budgets/:budgetId/entries
{
  categoryCode: "GASTOS.SUPERMERCADO",
  year: 2026,
  month: 3,
  budget: { amount: 350000, notes: "" },
  actual: { amount: 380000, notes: "Compramos extra para visitas" }
}

// Internamente crea/actualiza 2 MonthlyEntry:
// 1. scenario=BUDGET, amount=350000
// 2. scenario=ACTUAL, amount=380000
```

---

### 3.4 Vista: Gestión de Categorías

**Ruta:** `/budgets/:budgetId/categories`  
**Propósito:** Administrar árbol de categorías del presupuesto

**Componentes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ← Dashboard │ 🏠 Hogar                    [⚙️ Config] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Tabs: [Mensual] [Categorías] [Configuración]              │
│                   ▔▔▔▔▔▔▔▔▔▔                                │
│                                                             │
│  Categorías del Presupuesto          [+ Agregar Categoría] │
│  ══════════════════════════                                 │
│                                                             │
│  ⚠️ Las categorías GRUPO no pueden tener montos.           │
│     Solo las categorías HOJA pueden recibir valores.        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Código                    │ Nombre            │ Tipo  │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ ▼ INGRESOS               │ Ingresos          │ GRUPO │ │
│  │   ▼ INGRESOS.REMUN...    │ Remuneraciones    │ GRUPO │ │
│  │     INGRESOS.REMUN.SUE.. │ Sueldo Líquido    │ HOJA  │✏️│ 🗑️│
│  │     INGRESOS.REMUN.BON.. │ Bonos             │ HOJA  │✏️│ 🗑️│
│  │                                                        │ │
│  │ ▼ GASTOS                 │ Gastos            │ GRUPO │ │
│  │   ▼ GASTOS.SUSCRIPCIONES │ Suscripciones     │ GRUPO │ │
│  │     GASTOS.SUSCRIPC.NE.. │ Netflix           │ HOJA  │✏️│ 🗑️│
│  │     GASTOS.SUSCRIPC.SP.. │ Spotify           │ HOJA  │✏️│ 🗑️│
│  │       [+ Agregar sub-categoría de Suscripciones]      │ │
│  │   ▼ GASTOS.SERVICIOS     │ Servicios Básicos │ GRUPO │ │
│  │     GASTOS.SERVICIOS.LUZ │ Luz (Enel)        │ HOJA  │✏️│ 🗑️│
│  │     GASTOS.SERVICIOS.AGU │ Agua              │ HOJA  │✏️│ 🗑️│
│  │     GASTOS.SERVICIOS.GAS │ Gas               │ HOJA  │✏️│ 🗑️│
│  │   GASTOS.SUPERMERCADO    │ Supermercado      │ HOJA  │✏️│ 🗑️│
│  │                                                        │ │
│  │ ▼ AHORROS                │ Ahorros           │ GRUPO │ │
│  │   AHORROS.AHORRO_MENSUAL │ Ahorro Mensual    │ HOJA  │✏️│ 🗑️│
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Características:**
- **Vista de árbol expandible:** Muestra jerarquía completa
- **Códigos abreviados:** Para no ocupar mucho espacio (con tooltip completo)
- **Tipo:** GRUPO (no puede tener montos) vs HOJA (puede tener montos)
- **Acciones por categoría hoja:**
  - [✏️ Editar]: Cambiar nombre (código NO se puede cambiar)
  - [🗑️ Eliminar]: Solo si no tiene MonthlyEntry asociadas
- **[+ Agregar]:** Botón global o contextual dentro de grupo

**Interacciones:**
1. **Click en ▼** → Expandir/colapsar
2. **Click en [+ Agregar Categoría]** → Modal de crear categoría
3. **Click en [+ Agregar sub-categoría de X]** → Modal con padre pre-seleccionado
4. **Click en [✏️]** → Modal de editar categoría
5. **Click en [🗑️]** → Confirmación + eliminar (con validación de entries)

**Validaciones:**
- ❌ **NO eliminar** si tiene MonthlyEntry asociadas → Mostrar error "Categoría tiene X entradas asociadas"
- ❌ **NO cambiar código** después de creada (es FK)
- ✅ **SÍ cambiar nombre** (solo display)
- ✅ **SÍ cambiar is_leaf** si no tiene hijos ni entries

---

### 3.5 Modal: Crear/Editar Categoría

**Trigger:** Click en [+ Agregar] o [✏️]  
**Propósito:** Crear nueva categoría o editar existente

**Componente (Crear):**
```
┌─────────────────────────────────────────────────┐
│  Nueva Categoría                           [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Categoría Padre:                               │
│  [▼ GASTOS.SUSCRIPCIONES                    ]  │
│                                                 │
│  Código:                                        │
│  [GASTOS.SUSCRIPCIONES.DISNEY               ]  │
│                                                 │
│  Nombre:                                        │
│  [Disney+                                   ]  │
│                                                 │
│  Tipo:                                          │
│  ( ) Grupo (puede tener sub-categorías)        │
│  (•) Hoja (puede tener montos)                 │
│                                                 │
│  Orden:                                         │
│  [3                                         ]  │
│                                                 │
│  ⚠️ El código no se puede cambiar después de   │
│     crear la categoría.                         │
│                                                 │
│  [Cancelar]                      [Crear ✓]     │
└─────────────────────────────────────────────────┘
```

**Componente (Editar - solo HOJA):**
```
┌─────────────────────────────────────────────────┐
│  Editar Categoría: Netflix                 [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Código: GASTOS.SUSCRIPCIONES.NETFLIX           │
│  (no se puede cambiar)                          │
│                                                 │
│  Categoría Padre: GASTOS.SUSCRIPCIONES          │
│  (no se puede cambiar)                          │
│                                                 │
│  Nombre:                                        │
│  [Netflix Premium                           ]  │
│                                                 │
│  Orden:                                         │
│  [1                                         ]  │
│                                                 │
│  [Cancelar]                    [Guardar ✓]     │
└─────────────────────────────────────────────────┘
```

**Campos:**
- **Categoría Padre:** Dropdown con árbol de categorías (solo GRUPO)
- **Código:** Text input (obligatorio, único, solo en creación)
- **Nombre:** Text input (obligatorio)
- **Tipo:** Radio buttons (Grupo/Hoja, solo en creación)
- **Orden:** Number input (para ordenamiento visual)

**Validaciones:**
- Código único dentro del presupuesto
- Código debe seguir formato dot-notation (PADRE.HIJO)
- No permitir crear categoría hoja si ya tiene hijos
- No permitir cambiar código después de creada

---

### 3.6 Vista: Configuración del Presupuesto

**Ruta:** `/budgets/:budgetId/settings`  
**Propósito:** Ver/editar configuración del presupuesto

**Componentes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                     │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ← Dashboard │ 🏠 Hogar                    [⚙️ Config] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Tabs: [Mensual] [Categorías] [Configuración]              │
│                                  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔             │
│                                                             │
│  Información del Presupuesto                                │
│  ═══════════════════════════                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Nombre:       [Hogar                             ] ✏️ │ │
│  │ Descripción:  [Gastos compartidos del hogar      ] ✏️ │ │
│  │               [                                  ]    │ │
│  │ Tipo:         Compartido (SHARED)                     │ │
│  │ Creado:       15 Marzo 2026                           │ │
│  │ Estado:       ✅ Activo                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Usuarios con Acceso (2)                                    │
│  ═══════════════════════                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Usuario         │ Email               │ Rol   │       │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ Seba            │ seba@example.com    │ OWNER │       │ │
│  │ Mona            │ mona@example.com    │ OWNER │       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️ MVP: No se pueden agregar/quitar usuarios desde UI.    │
│     Esto se hará mediante seed/admin directo.               │
│                                                             │
│  Acciones                                                   │
│  ═══════                                                    │
│  [📦 Archivar Presupuesto]                                 │
│  (El presupuesto quedará oculto pero no se eliminará)      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidad MVP:**
- ✅ **Editar nombre/descripción:** Inline o modal simple
- ✅ **Ver usuarios con acceso:** Solo lectura (no editar en MVP)
- ✅ **Archivar presupuesto:** Marcar `is_active = false`
- ❌ **NO gestión de usuarios:** Agregar/quitar usuarios fuera de MVP
- ❌ **NO roles:** Todos son OWNER en MVP

---

### 3.7 Vista: Crear Nuevo Presupuesto

**Ruta:** `/budgets/new`  
**Propósito:** Wizard simple para crear presupuesto desde plantilla

**Componentes:**
```
┌─────────────────────────────────────────────────────────────┐
│  Crear Nuevo Presupuesto                        [X Cancelar]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paso 1 de 2: Información Básica                            │
│  ═══════════════════════════════                            │
│                                                             │
│  Nombre del Presupuesto:                                    │
│  [                                                      ]   │
│  Ejemplo: "Hogar", "Personal 2026", "Negocio"               │
│                                                             │
│  Descripción (opcional):                                    │
│  [                                                      ]   │
│  [                                                      ]   │
│                                                             │
│  Tipo:                                                      │
│  (•) Personal - Solo yo tengo acceso                        │
│  ( ) Compartido - Puede ser usado por varias personas       │
│                                                             │
│  [Siguiente →]                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Paso 2 de 2: Categorías Iniciales                          │
│  ═══════════════════════════                                │
│                                                             │
│  ✅ Se crearán las siguientes categorías base:             │
│                                                             │
│  ▼ INGRESOS                                                 │
│    ▼ Remuneraciones                                         │
│      • Sueldo Líquido                                       │
│      • Bonos                                                │
│                                                             │
│  ▼ GASTOS                                                   │
│    ▼ Suscripciones                                          │
│      • Netflix, Spotify                                     │
│    ▼ Servicios Básicos                                      │
│      • Luz, Agua, Gas                                       │
│    • Supermercado                                           │
│    • Hipotecario                                            │
│                                                             │
│  ▼ AHORROS                                                  │
│    • Ahorro Mensual                                         │
│                                                             │
│  ℹ️ Podrás agregar, editar o eliminar categorías después.  │
│                                                             │
│  [← Atrás]                           [Crear Presupuesto ✓] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Flujo:**
1. **Paso 1:** Nombre, Descripción, Tipo → [Siguiente]
2. **Paso 2:** Mostrar preview de plantilla base → [Crear]
3. **Backend:** Crear Budget + Clonar categorías + Asignar acceso
4. **Redirección:** → `/budgets/:newBudgetId/monthly`

**Validaciones:**
- Nombre obligatorio
- Nombre único por usuario (o permitir duplicados, decisión pendiente)

---

## 4. Flujos de Usuario Principales

### 4.1 Flujo: Entrar al Sistema y Ver Presupuestos

```
Usuario                      Sistema
  │
  ├─> Navega a "/"
  │                          Redirige a /dashboard
  │
  ├─> Carga /dashboard
  │                          GET /api/budgets?userId=:currentUserId
  │                          Calcula balances del mes actual
  │                          Renderiza tarjetas de presupuestos
  │
  ├─> Ve lista de presupuestos con balances
  │
  └─> Puede:
      • Click en tarjeta → Ver detalle
      • Click en [Crear +] → Crear presupuesto
```

**Queries:**
```typescript
// GET /api/budgets?userId=1
// Retorna: lista de presupuestos + balance del mes actual
```

---

### 4.2 Flujo: Crear Nuevo Presupuesto

```
Usuario                      Sistema
  │
  ├─> Click en [Crear +] desde Dashboard
  │                          Navega a /budgets/new
  │
  ├─> Completa Paso 1: Nombre, Tipo
  │   Click en [Siguiente →]
  │
  ├─> Ve Paso 2: Preview de categorías base
  │   Click en [Crear Presupuesto ✓]
  │                          POST /api/budgets
  │                          {
  │                            name: "Mi Presupuesto",
  │                            budgetType: "PERSONAL",
  │                            userId: 1
  │                          }
  │                          
  │                          Backend:
  │                          1. Crea Budget
  │                          2. Clona categorías de plantilla
  │                          3. Asigna acceso (BudgetAccess)
  │                          
  │                          Retorna: { budgetId: 4 }
  │                          Redirige a /budgets/4/monthly
  │
  ├─> Llega a vista mensual vacía
  │   (sin entries aún, solo categorías)
  │
  └─> Puede comenzar a agregar montos
```

---

### 4.3 Flujo: Ver Detalle de Presupuesto (Mensual)

```
Usuario                      Sistema
  │
  ├─> Click en [Ver detalle] desde Dashboard
  │                          Navega a /budgets/1/monthly
  │                          Por defecto: mes actual
  │
  ├─> Carga vista mensual
  │                          GET /api/budgets/1/monthly/2026/3
  │                          Retorna:
  │                          • Árbol de categorías
  │                          • MonthlyEntry (BUDGET y ACTUAL)
  │                          • Resumen agregado
  │
  ├─> Ve tabla jerárquica con:
  │   • Categorías expandibles
  │   • BUDGET vs ACTUAL
  │   • Variaciones
  │
  └─> Puede:
      • Expandir/colapsar categorías
      • Cambiar mes/año
      • Click en [✏️] para editar entrada
```

---

### 4.4 Flujo: Editar MonthlyEntry (BUDGET y ACTUAL)

```
Usuario                      Sistema
  │
  ├─> Click en [✏️] junto a "Supermercado"
  │                          Abre modal con datos existentes
  │                          GET /api/budgets/1/entries?
  │                              categoryCode=GASTOS.SUPERMERCADO
  │                              &year=2026&month=3
  │                          
  │                          Si existe:
  │                          {
  │                            budget: { amount: 350000, notes: "" },
  │                            actual: { amount: 380000, notes: "..." }
  │                          }
  │                          
  │                          Si NO existe: Campos vacíos
  │
  ├─> Edita montos:
  │   BUDGET: $350.000
  │   ACTUAL: $380.000
  │   Notas ACTUAL: "Compramos extra"
  │   
  │   Click en [Guardar ✓]
  │                          PUT /api/budgets/1/entries
  │                          {
  │                            categoryCode: "GASTOS.SUPERMERCADO",
  │                            year: 2026,
  │                            month: 3,
  │                            budget: { amount: 350000, notes: "" },
  │                            actual: { amount: 380000, notes: "Compramos extra" }
  │                          }
  │                          
  │                          Backend:
  │                          • UPSERT MonthlyEntry (scenario=BUDGET)
  │                          • UPSERT MonthlyEntry (scenario=ACTUAL)
  │                          
  │                          Retorna: 200 OK
  │                          Cierra modal
  │                          Recarga datos de tabla (refresh)
  │
  ├─> Ve tabla actualizada con nuevos montos
  │   Variación recalculada: +$30.000
  │
  └─> Continúa editando otras categorías
```

---

### 4.5 Flujo: Gestionar Categorías del Presupuesto

```
Usuario                      Sistema
  │
  ├─> Desde vista mensual, click en tab [Categorías]
  │                          Navega a /budgets/1/categories
  │
  ├─> Carga gestión de categorías
  │                          GET /api/budgets/1/categories
  │                          Retorna árbol completo de categorías
  │
  ├─> Ve árbol expandible
  │   Puede:
  │   • Expandir/colapsar
  │   • Ver tipo (GRUPO/HOJA)
  │
  ├─> Click en [+ Agregar Categoría]
  │                          Abre modal de crear
  │
  ├─> Completa:
  │   Padre: GASTOS.SUSCRIPCIONES
  │   Código: GASTOS.SUSCRIPCIONES.DISNEY
  │   Nombre: Disney+
  │   Tipo: Hoja
  │   Orden: 3
  │   
  │   Click en [Crear ✓]
  │                          POST /api/budgets/1/categories
  │                          {
  │                            budgetId: 1,
  │                            code: "GASTOS.SUSCRIPCIONES.DISNEY",
  │                            name: "Disney+",
  │                            parentCode: "GASTOS.SUSCRIPCIONES",
  │                            categoryType: "EXPENSE",
  │                            isLeaf: true,
  │                            order: 3
  │                          }
  │                          
  │                          Validaciones:
  │                          • Código único en presupuesto
  │                          • Padre existe y es GRUPO
  │                          
  │                          Retorna: 201 Created
  │                          Cierra modal
  │                          Recarga árbol
  │
  ├─> Ve categoría "Disney+" en árbol
  │   bajo "Suscripciones"
  │
  └─> Vuelve a vista mensual
      Nueva categoría aparece vacía (sin entries)
```

---

### 4.6 Flujo: Cambiar de Mes en Vista Mensual

```
Usuario                      Sistema
  │
  ├─> En /budgets/1/monthly (mostrando Marzo 2026)
  │   Click en [→] del selector de mes
  │                          Navega a /budgets/1/monthly?year=2026&month=4
  │                          O actualiza estado local (según implementación)
  │
  ├─> Carga datos de Abril 2026
  │                          GET /api/budgets/1/monthly/2026/4
  │                          Retorna categorías + entries de Abril
  │
  ├─> Ve tabla con datos de Abril 2026
  │   (pueden estar vacíos si no hay entries)
  │
  └─> Puede editar entries del nuevo mes
```

---

## 5. Navegación del MVP

### 5.1 Navegación Principal (Header/Breadcrumb)

**Propuesta de Header Unificado:**

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Finanzapp   │   [← Dashboard]   │   🏠 Hogar   │   ⚙️    │
└─────────────────────────────────────────────────────────────┘
```

**Elementos:**
- **Logo/Título:** "💰 Finanzapp" (siempre visible, click → dashboard)
- **Breadcrumb:** `[← Dashboard]` cuando está dentro de presupuesto
- **Presupuesto Activo:** `🏠 Hogar` (solo cuando está dentro de presupuesto)
- **Configuración:** `⚙️` (botón rápido a `/budgets/:id/settings`)

---

### 5.2 Navegación Secundaria (Tabs)

**Cuando está dentro de un presupuesto:**

```
Tabs: [Mensual] [Categorías] [Configuración]
```

**Comportamiento:**
- Tab activo subrayado
- Click en tab → Navega a ruta correspondiente
- Estado del presupuesto persiste (no se pierde contexto)

---

### 5.3 Selector de Presupuesto (Opcional - Fuera de MVP)

**Ubicación sugerida:** Header, junto a nombre del presupuesto

```
┌─────────────────────────────────────┐
│ Presupuesto: [▼ Hogar        ]     │
│              • Hogar                │
│              • Seba                 │
│              • Mona                 │
└─────────────────────────────────────┘
```

**Funcionalidad:**
- Dropdown con lista de presupuestos del usuario
- Cambiar presupuesto sin volver al dashboard
- **Estado:** 🟡 OPCIONAL para MVP - Priorizar navegación vía dashboard

---

## 6. Componentes Impactados

### 6.1 Componentes Existentes que SE PUEDEN REUTILIZAR

#### **Componentes RSuite Actuales:**
- ✅ **`<Sidenav>`**: Podría convertirse en el navigation tabs o mantenerse para secundario
- ✅ **`<Table>`**: Para tabla de categorías jerárquicas (con `Tree` o manual)
- ✅ **`<Modal>`**: Para editar entries, crear categorías
- ✅ **`<Form>` + `<Input>`**: Formularios de edición
- ✅ **`<IconButton>`**: Botones de acción (✏️, 🗑️)
- ✅ **`<Panel>`**: Para tarjetas de dashboard
- ✅ **`<Breadcrumb>`**: Para navegación superior

#### **Lógica de Negocio:**
- ⚠️ **Cálculo de balances**: Reutilizable pero adaptar a BUDGET vs ACTUAL
- ⚠️ **Formateo de montos CLP**: Reutilizable directamente
- ⚠️ **Navegación con `useNavigate`**: Reutilizable

---

### 6.2 Componentes Existentes que HAY QUE REHACER

#### **Vista: Presupuesto.tsx (actual)**
- ❌ **Problema:** Asume presupuesto único global, estructura hardcodeada
- ✅ **Rehacer como:** 
  - `BudgetMonthlyView.tsx` con árbol dinámico desde categorías
  - Tabla jerárquica desde API en lugar de hardcoded

#### **Vista: Actual.tsx (actual)**
- ❌ **Problema:** Fragmentado en múltiples vistas (Tenpo, Utilities, etc.)
- ✅ **Rehacer como:** 
  - Integrar directamente en `BudgetMonthlyView.tsx`
  - ACTUAL como columna adicional, no vista separada

#### **Componente: Sidebar.tsx**
- ⚠️ **Decisión:** Evaluar si mantener sidebar o reemplazar con tabs
- **Opción A:** Convertir a tabs horizontales (más moderno)
- **Opción B:** Mantener sidebar pero adaptar a contexto de presupuesto
- **Recomendación MVP:** Opción A (tabs horizontales)

#### **Rutas: router.tsx**
- ❌ **Problema:** Rutas planas sin contexto de presupuesto
- ✅ **Rehacer como:** 
  - Rutas anidadas con `:budgetId`
  - Dashboard como default (`/`)
  - Presupuestos como subrutas (`/budgets/:id/...`)

---

### 6.3 Componentes Nuevos a Crear

#### **Dashboard Global:**
- `DashboardView.tsx`: Vista principal con tarjetas de presupuestos
- `BudgetCard.tsx`: Tarjeta individual de presupuesto con resumen

#### **Vista Mensual:**
- `BudgetMonthlyView.tsx`: Tabla jerárquica mensual
- `MonthSelector.tsx`: Selector de mes/año con navegación
- `CategoryTreeTable.tsx`: Tabla expandible con categorías
- `MonthlyEntryModal.tsx`: Modal de edición de BUDGET/ACTUAL

#### **Gestión de Categorías:**
- `CategoryManagementView.tsx`: Vista de árbol de categorías
- `CategoryFormModal.tsx`: Modal crear/editar categoría
- `CategoryTreeView.tsx`: Árbol expandible de categorías

#### **Configuración:**
- `BudgetSettingsView.tsx`: Vista de configuración
- `BudgetInfoForm.tsx`: Formulario de información básica

#### **Crear Presupuesto:**
- `CreateBudgetWizard.tsx`: Wizard de 2 pasos
- `TemplatePreview.tsx`: Preview de categorías base

#### **Contexto/Estado:**
- `BudgetContext.tsx`: Context API para presupuesto activo
- `useBudget.ts`: Hook para acceder a presupuesto actual
- `useMonthlyData.ts`: Hook para datos mensuales con cache

---

## 7. Arquitectura de Estado (Frontend)

### 7.1 Contexto Global de Presupuesto

```typescript
// contexts/BudgetContext.tsx

interface BudgetContextValue {
  currentBudgetId: number | null;
  currentBudget: Budget | null;
  budgets: Budget[];
  setCurrentBudget: (budgetId: number) => void;
  refreshBudgets: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }) {
  const [currentBudgetId, setCurrentBudgetId] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Lógica de carga y sincronización
  
  return (
    <BudgetContext.Provider value={{ ... }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
}
```

---

### 7.2 Estado Local de Vista Mensual

```typescript
// hooks/useMonthlyData.ts

interface MonthlyData {
  year: number;
  month: number;
  categories: CategoryNode[];
  summary: MonthlySummary;
  loading: boolean;
  error: Error | null;
}

export function useMonthlyData(budgetId: number, year: number, month: number) {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch data from API
    // Cache en localStorage o React Query
  }, [budgetId, year, month]);
  
  const updateEntry = async (categoryCode, entryData) => {
    // PUT /api/budgets/:id/entries
    // Actualizar cache local
  };
  
  return { ...data, updateEntry };
}
```

---

## 8. APIs Requeridas (Backend)

### 8.1 Presupuestos

```typescript
// Listar presupuestos del usuario
GET /api/budgets?userId=:userId
Response: {
  budgets: [
    {
      id: 1,
      name: "Hogar",
      budgetType: "SHARED",
      isActive: true,
      currentMonthBalance: { year: 2026, month: 3, budget: 0, actual: 250000 },
      userCount: 2
    }
  ]
}

// Crear presupuesto
POST /api/budgets
Body: { name: "Mi Presupuesto", budgetType: "PERSONAL", userId: 1 }
Response: { budgetId: 4 }

// Actualizar presupuesto
PUT /api/budgets/:id
Body: { name: "Hogar Actualizado", description: "..." }
Response: { success: true }

// Archivar presupuesto
PATCH /api/budgets/:id/archive
Response: { success: true }
```

---

### 8.2 Vista Mensual

```typescript
// Obtener datos mensuales
GET /api/budgets/:budgetId/monthly/:year/:month
Response: {
  budget: { id: 1, name: "Hogar" },
  year: 2026,
  month: 3,
  categories: [ ... ], // Árbol con entries embebidas
  summary: {
    income: { budget: 6300000, actual: 6300000 },
    expense: { budget: 6200000, actual: 6050000 },
    savings: { budget: 100000, actual: 100000 },
    balance: { budget: 0, actual: 250000 }
  }
}

// Actualizar entrada mensual (BUDGET + ACTUAL)
PUT /api/budgets/:budgetId/entries
Body: {
  categoryCode: "GASTOS.SUPERMERCADO",
  year: 2026,
  month: 3,
  budget: { amount: 350000, notes: "" },
  actual: { amount: 380000, notes: "..." }
}
Response: { success: true }
```

---

### 8.3 Categorías

```typescript
// Listar categorías del presupuesto
GET /api/budgets/:budgetId/categories
Response: {
  categories: [
    {
      id: 1,
      code: "INGRESOS",
      name: "Ingresos",
      parentCode: null,
      categoryType: "INCOME",
      isLeaf: false,
      order: 1,
      children: [ ... ]
    }
  ]
}

// Crear categoría
POST /api/budgets/:budgetId/categories
Body: {
  code: "GASTOS.SUSCRIPCIONES.DISNEY",
  name: "Disney+",
  parentCode: "GASTOS.SUSCRIPCIONES",
  categoryType: "EXPENSE",
  isLeaf: true,
  order: 3
}
Response: { categoryId: 42 }

// Actualizar categoría
PUT /api/budgets/:budgetId/categories/:code
Body: { name: "Netflix Premium", order: 1 }
Response: { success: true }

// Eliminar categoría
DELETE /api/budgets/:budgetId/categories/:code
Response: { success: true } | { error: "Categoría tiene entradas asociadas" }
```

---

## 9. Recomendación UX Final

### 9.1 Prioridades de Implementación

**Fase 1: Core MVP (2-3 semanas)**
1. ✅ Dashboard global con tarjetas de presupuestos
2. ✅ Vista mensual con tabla jerárquica (BUDGET vs ACTUAL)
3. ✅ Modal de edición de MonthlyEntry
4. ✅ Selector de mes/año
5. ✅ Crear presupuesto (wizard básico)

**Fase 2: Gestión (1 semana)**
6. ✅ Gestión de categorías (listar, crear, editar, eliminar)
7. ✅ Configuración de presupuesto (nombre, descripción, archivar)

**Fase 3: Polish (1 semana)**
8. ✅ Mejoras de UX (loading states, validaciones, mensajes de error)
9. ✅ Responsive design básico
10. ✅ Testing y fixes de bugs

**Total Estimado:** 4-5 semanas

---

### 9.2 Decisiones de UX Clave

#### **✅ Dashboard primero, contexto después**
- Punto de entrada = lista de presupuestos
- Usuario cambia entre presupuestos volviendo al dashboard
- Evita complejidad de selector de presupuesto en header (MVP)

#### **✅ Tabs horizontales en lugar de sidebar**
- Más moderno y limpio
- Menos espacio vertical
- Mejor para responsive

#### **✅ Modal inline para editar entries**
- Evita navegación adicional
- Experiencia más fluida
- Edición rápida de BUDGET y ACTUAL en mismo formulario

#### **✅ Categorías jerárquicas expandibles**
- Vista de árbol clara
- Indentación visual para jerarquía
- Expandir/colapsar para navegar fácilmente

#### **✅ Plantilla base con preview**
- Usuario ve qué categorías se crearán antes de confirmar
- Reduce fricción de onboarding
- Puede editar después si necesita

---

### 9.3 Riesgos de UX Identificados

#### **Riesgo 1: Cambiar de presupuesto es tedioso**
- **Problema:** Usuario debe volver a dashboard cada vez
- **Mitigación MVP:** Aceptable para 2-3 presupuestos
- **Mitigación Futura:** Agregar selector en header

#### **Riesgo 2: Tabla mensual puede ser muy larga**
- **Problema:** Muchas categorías = mucho scroll
- **Mitigación MVP:** Expandir/colapsar grupos
- **Mitigación Futura:** Búsqueda/filtros, categorías fijas colapsadas

#### **Riesgo 3: Editar múltiples meses es repetitivo**
- **Problema:** Usuario debe cambiar mes, editar, cambiar mes, editar...
- **Mitigación MVP:** Aceptable para uso mensual típico
- **Mitigación Futura:** Vista anual tipo spreadsheet, copiar mes anterior

---

## 10. Resumen Ejecutivo

### 10.1 Vistas Mínimas del MVP

1. **Dashboard Global** (`/dashboard`)
2. **Vista Mensual** (`/budgets/:id/monthly`)
3. **Gestión de Categorías** (`/budgets/:id/categories`)
4. **Configuración** (`/budgets/:id/settings`)
5. **Crear Presupuesto** (`/budgets/new`)

**Total:** 5 vistas principales

---

### 10.2 Componentes a Crear

**Nuevos (15 componentes):**
- DashboardView, BudgetCard
- BudgetMonthlyView, MonthSelector, CategoryTreeTable, MonthlyEntryModal
- CategoryManagementView, CategoryFormModal, CategoryTreeView
- BudgetSettingsView, BudgetInfoForm
- CreateBudgetWizard, TemplatePreview
- BudgetContext, useBudget, useMonthlyData

**Reutilizar (8 componentes RSuite):**
- Table, Modal, Form, Input, Panel, Button, IconButton, Breadcrumb

---

### 10.3 Navegación Propuesta

```
/                              → Redirección a /dashboard
/dashboard                     → Dashboard global (punto de entrada)
/budgets/new                   → Crear presupuesto
/budgets/:id/monthly           → Vista mensual (principal)
/budgets/:id/categories        → Gestión de categorías
/budgets/:id/settings          → Configuración
```

**Navegación interna:** Tabs horizontales [Mensual] [Categorías] [Configuración]

---

### 10.4 Checklist Pre-Implementación

- [ ] ✅ Revisar sitemap con stakeholders
- [ ] ✅ Validar flujos de usuario principales
- [ ] ✅ Confirmar estructura de componentes
- [ ] ✅ Definir estrategia de estado (Context API + local state)
- [ ] ✅ Mockear APIs backend antes de integrar
- [ ] ✅ Crear wireframes de baja fidelidad (opcional)

---

**FIN DEL DOCUMENTO**

**Versión:** 1.0  
**Estado:** Listo para revisión  
**Siguiente Paso:** Validar → Aprobar → Implementar frontend
