# Especificación: Jerarquía de Presupuesto Flexible MVP

**Fecha:** 2026-03-15  
**Estado:** Análisis Técnico - NO IMPLEMENTAR  
**Objetivo:** Diseñar una jerarquía de presupuesto que sea ordenada pero flexible para soportar múltiples presupuestos

---

## 1. Contexto

### Situación Actual
Finanzapp maneja presupuesto mediante categorías planas definidas en código, con agrupación visual limitada en frontend. No existe una jerarquía formal de presupuesto que permita:
- Organización multi-nivel (Ingresos → Remuneraciones → Sueldo Líquido)
- Comparación estructurada entre presupuestos (Hogar vs Personal)
- Agregación flexible (ver gastos totales, o solo gastos recurrentes, etc.)

### Caso de Uso MVP
Soportar dos presupuestos independientes:
- **Presupuesto Hogar** (gastos compartidos del hogar)
- **Presupuesto Personal Seba** (gastos individuales)

**Requisitos funcionales:**
1. Poder cambiar entre presupuestos sin perder contexto
2. Comparar presupuestos lado a lado (Hogar vs Personal)
3. Mantener claridad visual de la estructura (Ingresos, Gastos, sub-categorías)
4. Permitir crecimiento futuro (agregar más niveles si es necesario)

### Restricciones
- ❌ No implementar multi-usuario con permisos complejos
- ❌ No inventar jerarquías rígidas tipo SAP (dimensiones, centros de costo, etc.)
- ✅ Enfocarse en flexibilidad para uso personal/familiar

---

## 2. Hallazgos del Modelo Actual

### 2.1 Estructura Backend

#### Categorías Planas (enum `ActualCategory`)
```typescript
// node-version/client/src/types/actual.ts
export enum ActualCategory {
  INGRESOS = 'INGRESOS',
  SUSCRIPCIONES = 'SUSCRIPCIONES',
  OBLIGACIONES = 'OBLIGACIONES',
  HIPOTECARIO = 'HIPOTECARIO',
  SERVICIOS_BASICOS = 'SERVICIOS_BASICOS',
  SUPERMERCADO = 'SUPERMERCADO',
  PAGO_TC = 'PAGO_TC',
  AJUSTES = 'AJUSTES',
  AHORROS = 'AHORROS'
}
```

**Características:**
- ❌ **Jerarquía:** No hay padre/hijo, todas al mismo nivel
- ❌ **Agrupación:** No existe concepto de "Gastos Recurrentes" vs "Gastos Variables"
- ✅ **Simpleza:** Fácil de entender y mantener
- ⚠️ **Rigidez:** Agregar nuevas categorías requiere modificar enum + migración

#### Tablas de Presupuesto Especializadas
Cada categoría tiene su propia tabla:
```prisma
model PresupuestoIngreso {
  ingresoId  Int
  anio       Int
  enero      Float
  // ... resto de meses
}

model PresupuestoServicioBasico {
  servicioId Int
  anio       Int
  enero      Float
  // ... resto de meses
}

// Similar para: Subscription, Obligacion, SupermercadoPresupuesto, PresupuestoAhorro
```

**Características:**
- ✅ **Tipado fuerte:** Cada tabla tiene estructura específica
- ❌ **Fragmentación:** No hay tabla unificada de presupuesto
- ❌ **Difícil agregar categorías:** Requiere nueva tabla + migración

#### Servicio de Consolidación
```typescript
// node-version/src/services/consolidado.ts
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
- ✅ **Centralizado:** Un solo punto para obtener presupuesto completo
- ❌ **Plano:** No refleja jerarquía (Ingresos vs Gastos)
- ⚠️ **Hardcoded:** Cada categoría requiere lógica específica

### 2.2 Estructura Frontend

#### Jerarquía Visual Implícita (Presupuesto.tsx)

**Nivel 1:**
```
INGRESOS (expandible)
  ├─ Sueldo Líquido
  ├─ Bonos
  └─ ...

GASTOS (grupo expandible)
  ├─ Suscripciones (expandible)
  │   ├─ Netflix
  │   ├─ Spotify
  │   └─ ...
  ├─ Créditos y Seguros (expandible)
  ├─ Hipotecario (expandible)
  ├─ Servicios Básicos (expandible)
  ├─ Supermercado (expandible)
  └─ Ahorros (expandible)

BALANCE (calculado)
```

**Código:**
```tsx
// INGRESOS (nivel 1)
<tr onClick={() => setExpandido('ingresos')}>
  <td>INGRESOS</td>
  {/* ... valores mensuales ... */}
</tr>

// GASTOS (grupo nivel 1)
<tr onClick={() => setGastosExpanded(!gastosExpanded)}>
  <td>Gastos</td>
  {/* ... valores mensuales ... */}
</tr>

{/* Categorías dentro de GASTOS (nivel 2) */}
{gastosExpanded && (
  <tr onClick={() => setExpandido('suscripciones')}>
    <td style={{ paddingLeft: '2rem' }}>Suscripciones</td>
  </tr>
)}
```

**Características:**
- ✅ **Jerarquía visual:** 2 niveles (INGRESOS/GASTOS → sub-categorías)
- ✅ **Colapsable:** Mejora UX en tablas grandes
- ❌ **Implementación ad-hoc:** Lógica hardcoded en componente
- ❌ **No extensible:** Agregar nivel 3 requiere modificar componente

### 2.3 Análisis de Jerarquía Actual

**Jerarquía Implícita Detectada:**
```
Nivel 0 (Root)
├─ Nivel 1: INGRESOS
│   └─ Nivel 2: Líneas específicas (Sueldo, Bonos, etc.)
│
├─ Nivel 1: GASTOS (grupo visual)
│   ├─ Nivel 2: SUSCRIPCIONES
│   │   └─ Nivel 3: Netflix, Spotify, etc.
│   ├─ Nivel 2: SERVICIOS_BASICOS
│   │   └─ Nivel 3: Luz, Agua, Gas, etc.
│   ├─ Nivel 2: SUPERMERCADO
│   ├─ Nivel 2: HIPOTECARIO
│   ├─ Nivel 2: OBLIGACIONES
│   └─ Nivel 2: AHORROS
│
└─ Nivel 1: BALANCE (calculado)
```

**Observaciones:**
1. **Jerarquía inconsistente:** Algunas categorías tienen 3 niveles (SUSCRIPCIONES), otras solo 2 (SUPERMERCADO)
2. **No formalizada:** La jerarquía existe solo en UI, no en modelo de datos
3. **Agregación manual:** Totales de "Gastos" se calculan sumando categorías hardcodeadas
4. **Difícil de extender:** Agregar "Gastos Variables" vs "Gastos Fijos" requiere refactor mayor

---

## 3. Alternativas de Diseño Jerárquico

### Alternativa 1: **Jerarquía Rígida (Pre-definida)**

#### Descripción
Definir una estructura de árbol fija de 3-4 niveles pre-establecidos en el sistema.

#### Modelo de Datos
```prisma
model BudgetHierarchyNode {
  id          Int      @id @default(autoincrement())
  code        String   @unique  // "ING", "ING.REM", "ING.REM.SUELDO"
  name        String              // "Ingresos", "Remuneraciones", "Sueldo Líquido"
  level       Int                 // 1, 2, 3, 4
  parentCode  String?             // "ING.REM"
  parent      BudgetHierarchyNode? @relation("Hierarchy", fields: [parentCode], references: [code])
  children    BudgetHierarchyNode[] @relation("Hierarchy")
  nodeType    String              // "GROUP" | "LEAF" (solo LEAF tiene presupuesto)
  accountType String              // "INCOME" | "EXPENSE" | "SAVINGS"
  order       Int     @default(0)
  isSystem    Boolean @default(true) // No se puede eliminar
  
  budgetLines BudgetLine[]
  
  @@map("budget_hierarchy_nodes")
}

model BudgetLine {
  id          Int      @id @default(autoincrement())
  budgetId    Int      // FK a Budget (del análisis anterior)
  nodeCode    String   // FK a BudgetHierarchyNode
  node        BudgetHierarchyNode @relation(fields: [nodeCode], references: [code])
  year        Int
  month       Int      // 1-12
  amount      Float
  
  @@unique([budgetId, nodeCode, year, month])
  @@map("budget_lines")
}

// Seed inicial:
// ING (Ingresos, level 1)
//   ING.REM (Remuneraciones, level 2)
//     ING.REM.SUELDO (Sueldo Líquido, level 3)
//     ING.REM.BONOS (Bonos, level 3)
// GAST (Gastos, level 1)
//   GAST.REC (Gastos Recurrentes, level 2)
//     GAST.REC.SUBS (Suscripciones, level 3)
//       GAST.REC.SUBS.NETFLIX (Netflix, level 4) ← Usuario puede crear
//     GAST.REC.SERV (Servicios Básicos, level 3)
//   GAST.VAR (Gastos Variables, level 2)
//     GAST.VAR.SUPER (Supermercado, level 3)
```

#### Ventajas
- ✅ **Estructura clara:** Jerarquía bien definida (Ingresos → Remuneraciones → Sueldo)
- ✅ **Agregación automática:** Fácil sumar "Gastos Recurrentes" vs "Gastos Variables"
- ✅ **Comparabilidad:** Misma estructura para todos los presupuestos (Hogar vs Personal)
- ✅ **Reportabilidad:** Consultas SQL simples con recursión o joins

#### Desventajas
- ❌ **Rigidez extrema:** Usuario forzado a usar categorías pre-definidas
- ❌ **Sobreingenieería:** Estructura tipo ERP para app personal
- ❌ **Migración compleja:** Mapear datos actuales a nueva estructura
- ❌ **Overhead de mantenimiento:** Mantener árbol de nodos

#### Impacto Frontend
- **Alto:** Requiere componente de árbol recursivo
- **Complejidad:** Media-Alta (renderizado recursivo, drag-and-drop opcional)
- **UX:** Más potente pero también más complejo para usuario casual

#### Impacto Reportabilidad
- ✅ **Excelente:** Consultas por nivel (todos los gastos recurrentes, solo remuneraciones, etc.)
- ✅ **Comparaciones:** Fácil comparar Hogar vs Personal al mismo nivel

#### Ejemplo de Uso
```typescript
// Obtener todos los gastos recurrentes del presupuesto Hogar en 2026-03
const lines = await prisma.budgetLine.findMany({
  where: {
    budgetId: hogarBudgetId,
    year: 2026,
    month: 3,
    node: {
      code: { startsWith: 'GAST.REC' } // Todos los hijos de Gastos Recurrentes
    }
  }
});
```

---

### Alternativa 2: **Jerarquía Híbrida (Categorías Base + Personalización)**

#### Descripción
Mantener categorías base del sistema (INGRESOS, GASTOS) pero permitir que usuario cree sub-categorías flexibles.

#### Modelo de Datos
```prisma
model BudgetCategory {
  id          Int      @id @default(autoincrement())
  budgetId    Int?     // NULL = categoría global del sistema
  budget      Budget?  @relation(fields: [budgetId], references: [id])
  code        String   // "INGRESOS", "GASTOS.SUSCRIPCIONES", "GASTOS.HOGAR.LUZ"
  name        String
  parentCode  String?  
  parent      BudgetCategory? @relation("CategoryTree", fields: [parentCode], references: [code])
  children    BudgetCategory[] @relation("CategoryTree")
  categoryType String  // "INCOME" | "EXPENSE" | "SAVINGS"
  isSystem    Boolean @default(false) // true para INGRESOS, GASTOS, etc.
  isGroup     Boolean @default(false) // true si tiene hijos, false si es hoja
  order       Int     @default(0)
  createdAt   DateTime @default(now())
  
  budgetLines BudgetLine[]
  
  @@unique([budgetId, code]) // code único por presupuesto
  @@map("budget_categories")
}

model BudgetLine {
  id          Int      @id @default(autoincrement())
  budgetId    Int
  budget      Budget   @relation(fields: [budgetId], references: [id])
  categoryCode String
  category    BudgetCategory @relation(fields: [categoryCode], references: [code])
  itemKey     String   // "sueldo", "netflix", etc.
  itemName    String
  year        Int
  month       Int
  amount      Float
  
  @@unique([budgetId, categoryCode, itemKey, year, month])
  @@map("budget_lines")
}

// Categorías del sistema (budgetId = NULL):
// INGRESOS (isSystem=true, isGroup=true)
// GASTOS (isSystem=true, isGroup=true)
// AHORROS (isSystem=true, isGroup=true)

// Usuario puede crear:
// GASTOS.HOGAR (budgetId=1, isGroup=true)
//   GASTOS.HOGAR.LUZ (budgetId=1, isGroup=false) ← hoja, puede tener BudgetLine
// GASTOS.PERSONAL (budgetId=1, isGroup=true)
//   GASTOS.PERSONAL.SUSCRIPCIONES (budgetId=1, isGroup=false)
```

#### Ventajas
- ✅ **Equilibrio:** Estructura base clara + flexibilidad usuario
- ✅ **Migración moderada:** Mapear categorías actuales a base del sistema
- ✅ **Extensible:** Usuario agrega categorías sin modificar código
- ✅ **Menos overhead:** Solo 2 tablas (BudgetCategory + BudgetLine)

#### Desventajas
- ⚠️ **Jerarquía libre:** Usuario puede crear estructuras inconsistentes entre presupuestos
- ⚠️ **Validación:** Requiere lógica para evitar categorías huérfanas o ciclos
- ⚠️ **Comparabilidad limitada:** Si Hogar tiene "Hogar.Luz" y Personal tiene "Servicios.Luz", difícil comparar

#### Impacto Frontend
- **Medio:** Componente de árbol + CRUD de categorías
- **Complejidad:** Media (árbol recursivo estándar)
- **UX:** Más flexible, pero requiere educación del usuario

#### Impacto Reportabilidad
- ✅ **Buena:** Consultas por categoría base (todos los gastos, todos los ingresos)
- ⚠️ **Comparaciones:** Posible si usuario mantiene estructuras similares

#### Ejemplo de Uso
```typescript
// Usuario crea categoría personalizada
await prisma.budgetCategory.create({
  data: {
    budgetId: hogarBudgetId,
    code: 'GASTOS.SERVICIOS',
    name: 'Servicios del Hogar',
    parentCode: 'GASTOS',
    categoryType: 'EXPENSE',
    isGroup: true
  }
});

// Agregar línea de presupuesto
await prisma.budgetLine.create({
  data: {
    budgetId: hogarBudgetId,
    categoryCode: 'GASTOS.SERVICIOS',
    itemKey: 'luz',
    itemName: 'Luz (ENEL)',
    year: 2026,
    month: 3,
    amount: 35000
  }
});
```

---

### Alternativa 3: **Jerarquía Flexible (Tags + Vistas Dinámicas)**

#### Descripción
Eliminar jerarquía rígida. Cada línea de presupuesto tiene tags/etiquetas que permiten agruparla dinámicamente.

#### Modelo de Datos
```prisma
model BudgetLine {
  id          Int      @id @default(autoincrement())
  budgetId    Int
  budget      Budget   @relation(fields: [budgetId], references: [id])
  itemKey     String   // "sueldo_liquido", "netflix", "luz_enel"
  itemName    String   // "Sueldo Líquido", "Netflix", "Luz (ENEL)"
  year        Int
  month       Int
  amount      Float
  lineType    String   // "INCOME" | "EXPENSE" | "SAVINGS"
  
  tags        BudgetLineTag[]
  
  @@unique([budgetId, itemKey, year, month])
  @@map("budget_lines")
}

model Tag {
  id          Int      @id @default(autoincrement())
  name        String   @unique  // "Recurrente", "Variable", "Hogar", "Personal", "Servicios", etc.
  color       String?  // Hex color
  isSystem    Boolean  @default(false)
  
  budgetLines BudgetLineTag[]
  
  @@map("tags")
}

model BudgetLineTag {
  id          Int         @id @default(autoincrement())
  lineId      Int         @map("line_id")
  tagId       Int         @map("tag_id")
  line        BudgetLine  @relation(fields: [lineId], references: [id], onDelete: Cascade)
  tag         Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@unique([lineId, tagId])
  @@map("budget_line_tags")
}

// Vistas dinámicas (guardadas por usuario)
model BudgetView {
  id          Int      @id @default(autoincrement())
  budgetId    Int
  budget      Budget   @relation(fields: [budgetId], references: [id])
  name        String   // "Gastos Recurrentes", "Gastos del Hogar", etc.
  filterTags  String   // JSON: ["Recurrente", "Hogar"]
  groupBy     String   // "lineType" | "tag" | "month"
  createdAt   DateTime @default(now())
  
  @@map("budget_views")
}

// Ejemplo de uso:
// Línea: Sueldo Líquido
//   tags: ["Ingreso", "Recurrente", "Mensual"]
// Línea: Netflix
//   tags: ["Gasto", "Recurrente", "Suscripción", "Hogar"]
// Línea: Luz (ENEL)
//   tags: ["Gasto", "Variable", "Servicio", "Hogar"]

// Vista: "Gastos Recurrentes del Hogar"
//   filterTags: ["Gasto", "Recurrente", "Hogar"]
//   → Muestra solo Netflix (Luz es Variable)
```

#### Ventajas
- ✅ **Máxima flexibilidad:** Usuario organiza como quiera
- ✅ **Sin jerarquía fija:** No hay niveles predefinidos
- ✅ **Multi-dimensional:** Una línea puede estar en "Recurrente" Y "Hogar" Y "Suscripción"
- ✅ **Vistas personalizadas:** Usuario crea sus propias vistas

#### Desventajas
- ❌ **Complejidad conceptual:** Tags pueden ser confusos para usuarios no técnicos
- ❌ **Inconsistencia:** Cada presupuesto puede tener estructura totalmente diferente
- ❌ **Agregación compleja:** Requiere joins múltiples para consultas
- ❌ **Reportabilidad:** Difícil comparar presupuestos si usan tags diferentes

#### Impacto Frontend
- **Alto:** Requiere UI de tags (tipo Gmail/Notion)
- **Complejidad:** Alta (tag selector, filtros dinámicos, vistas guardadas)
- **UX:** Potente pero con curva de aprendizaje

#### Impacto Reportabilidad
- ⚠️ **Variable:** Depende de consistencia de tags del usuario
- ❌ **Comparaciones:** Difícil si presupuestos usan taxonomías diferentes

#### Ejemplo de Uso
```typescript
// Crear línea con tags
const line = await prisma.budgetLine.create({
  data: {
    budgetId: hogarBudgetId,
    itemKey: 'netflix',
    itemName: 'Netflix',
    year: 2026,
    month: 3,
    amount: 12000,
    lineType: 'EXPENSE',
    tags: {
      create: [
        { tag: { connect: { name: 'Recurrente' } } },
        { tag: { connect: { name: 'Suscripción' } } },
        { tag: { connect: { name: 'Hogar' } } }
      ]
    }
  }
});

// Consultar gastos recurrentes del hogar
const lines = await prisma.budgetLine.findMany({
  where: {
    budgetId: hogarBudgetId,
    year: 2026,
    month: 3,
    tags: {
      some: {
        tag: { name: { in: ['Recurrente', 'Hogar'] } }
      }
    }
  }
});
```

---

## 4. Análisis Comparativo

| Criterio                     | Rígida              | Híbrida             | Flexible (Tags)     |
|------------------------------|---------------------|---------------------|---------------------|
| **Complejidad Modelo**       | Alta                | Media               | Media               |
| **Complejidad Frontend**     | Media-Alta          | Media               | Alta                |
| **Flexibilidad Usuario**     | ❌ Baja             | ✅ Media            | ✅✅ Alta           |
| **Curva Aprendizaje**        | Media               | Baja                | Alta                |
| **Migración Datos**          | Compleja            | Moderada            | Simple              |
| **Agregación/Totales**       | ✅✅ Excelente      | ✅ Buena            | ⚠️ Compleja         |
| **Comparabilidad**           | ✅✅ Excelente      | ✅ Buena            | ⚠️ Variable         |
| **Reportabilidad SQL**       | ✅✅ Simple         | ✅ Moderada         | ⚠️ Compleja         |
| **Extensibilidad Futura**    | ❌ Requiere código  | ✅ Usuario crea     | ✅✅ Usuario crea   |
| **Riesgo Over-engineering**  | 🔴 Alto             | 🟡 Medio            | 🟡 Medio            |
| **Fit para Uso Personal**    | ⚠️ Overkill         | ✅ Balanceado       | ⚠️ Puede ser mucho  |

---

## 5. Recomendación MVP

### **Opción Recomendada: Alternativa 2 (Jerarquía Híbrida)**

#### Justificación

1. **Balance óptimo:**
   - Tiene estructura base clara (INGRESOS, GASTOS, AHORROS)
   - Permite personalización sin perder orden
   - No es ni demasiado rígida ni demasiado caótica

2. **Migración manejable:**
   - Categorías actuales se mapean a estructura base
   - Usuario puede crear sub-categorías según necesidad
   - Compatibilidad con datos existentes

3. **Comparabilidad presupuestos:**
   - Estructura base garantiza comparabilidad mínima
   - Usuario puede alinear sub-categorías si quiere comparar en detalle
   - Reportes agregados funcionan out-of-the-box

4. **Extensibilidad:**
   - Usuario agrega categorías sin modificar código
   - Frontend recursivo soporta N niveles
   - Escalable a futuro (multi-usuario, permisos, etc.)

5. **Evita over-engineering:**
   - No es ERP (Alternativa 1)
   - No requiere UI compleja de tags (Alternativa 3)
   - Curva de aprendizaje baja

#### Por qué NO Alternativa 1 (Rígida)
- Demasiado estructurada para app personal
- Fuerza taxonomía que puede no aplicar a todos los usuarios
- Difícil justificar complejidad para caso de uso MVP

#### Por qué NO Alternativa 3 (Tags)
- Tags son potentes pero confusos para usuarios casuales
- Dificulta comparaciones si cada presupuesto usa tags diferentes
- Overhead de UI (tag picker, filtros dinámicos, vistas guardadas)

---

## 6. Diseño MVP Detallado (Alternativa 2)

### 6.1 Árbol de Categorías Propuesto

```
ROOT (implícito)
│
├─ INGRESOS (isSystem=true, isGroup=true, budgetId=NULL)
│   ├─ REMUNERACIONES (budgetId=NULL o específico, isGroup=true)
│   │   ├─ Sueldo Líquido (isGroup=false) ← BudgetLine
│   │   └─ Bonos (isGroup=false) ← BudgetLine
│   └─ OTROS_INGRESOS (isGroup=true)
│       └─ Intereses (isGroup=false) ← BudgetLine
│
├─ GASTOS (isSystem=true, isGroup=true, budgetId=NULL)
│   ├─ RECURRENTES (isGroup=true)
│   │   ├─ Suscripciones (isGroup=true)
│   │   │   ├─ Netflix (isGroup=false) ← BudgetLine
│   │   │   └─ Spotify (isGroup=false) ← BudgetLine
│   │   ├─ Servicios Básicos (isGroup=true)
│   │   │   ├─ Luz (isGroup=false) ← BudgetLine
│   │   │   ├─ Agua (isGroup=false) ← BudgetLine
│   │   │   └─ Internet (isGroup=false) ← BudgetLine
│   │   └─ Obligaciones (isGroup=true)
│   │       ├─ Crédito Auto (isGroup=false) ← BudgetLine
│   │       └─ Seguro Vida (isGroup=false) ← BudgetLine
│   │
│   ├─ VARIABLES (isGroup=true)
│   │   ├─ Supermercado (isGroup=false) ← BudgetLine
│   │   ├─ Restaurantes (isGroup=false) ← BudgetLine
│   │   └─ Transporte (isGroup=false) ← BudgetLine
│   │
│   └─ VIVIENDA (isGroup=true)
│       ├─ Dividendo Hipotecario (isGroup=false) ← BudgetLine
│       └─ Seguros Hogar (isGroup=false) ← BudgetLine
│
└─ AHORROS (isSystem=true, isGroup=true, budgetId=NULL)
    ├─ Ahorro Vacaciones (isGroup=false) ← BudgetLine
    └─ Ahorro Emergencias (isGroup=false) ← BudgetLine
```

### 6.2 Reglas de Negocio

1. **Categorías del Sistema (isSystem=true):**
   - No se pueden eliminar: INGRESOS, GASTOS, AHORROS
   - Son globales (budgetId=NULL)
   - Heredadas por todos los presupuestos

2. **Categorías de Usuario:**
   - Pueden ser globales (budgetId=NULL) o específicas de un presupuesto
   - Usuario puede crear/editar/eliminar (si no tienen BudgetLines)
   - Máximo 4 niveles de profundidad (configurable)

3. **Hojas vs Grupos:**
   - Solo hojas (isGroup=false) pueden tener BudgetLines
   - Grupos (isGroup=true) solo contienen categorías hijas
   - Totales de grupos se calculan sumando hojas recursivamente

4. **Códigos:**
   - Formato dot-notation: `GASTOS.RECURRENTES.SUSCRIPCIONES`
   - Únicos dentro de cada presupuesto
   - Facilitan queries jerárquicas (WHERE code LIKE 'GASTOS.%')

### 6.3 Modelo de Datos Completo

```prisma
model Budget {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  color       String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  categories  BudgetCategory[]
  lines       BudgetLine[]
  
  @@map("budgets")
}

model BudgetCategory {
  id          Int      @id @default(autoincrement())
  budgetId    Int?     @map("budget_id") // NULL = categoría global del sistema
  budget      Budget?  @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  code        String   // "INGRESOS", "GASTOS.RECURRENTES.SUSCRIPCIONES"
  name        String   // "Ingresos", "Suscripciones"
  parentCode  String?  @map("parent_code")
  parent      BudgetCategory? @relation("CategoryTree", fields: [parentCode, budgetId], references: [code, budgetId], onDelete: NoAction, onUpdate: NoAction)
  children    BudgetCategory[] @relation("CategoryTree")
  categoryType String  @map("category_type") // "INCOME" | "EXPENSE" | "SAVINGS"
  isSystem    Boolean @default(false) @map("is_system")
  isGroup     Boolean @default(false) @map("is_group")
  order       Int     @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  lines       BudgetLine[]
  
  @@unique([budgetId, code])
  @@index([parentCode, budgetId])
  @@map("budget_categories")
}

model BudgetLine {
  id          Int      @id @default(autoincrement())
  budgetId    Int      @map("budget_id")
  budget      Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  categoryId  Int      @map("category_id")
  category    BudgetCategory @relation(fields: [categoryId], references: [id])
  itemKey     String   @map("item_key") // "sueldo_liquido", "netflix"
  itemName    String   @map("item_name") // "Sueldo Líquido", "Netflix"
  year        Int
  month       Int      // 1-12
  amount      Float
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  @@unique([budgetId, categoryId, itemKey, year, month])
  @@index([budgetId, year, month])
  @@map("budget_lines")
}
```

### 6.4 Ejemplos de Queries

#### Obtener árbol completo de categorías
```typescript
const tree = await prisma.budgetCategory.findMany({
  where: {
    OR: [
      { budgetId: null }, // Categorías globales
      { budgetId: hogarBudgetId } // Categorías específicas
    ]
  },
  include: {
    children: {
      include: {
        children: {
          include: {
            children: true // Hasta 4 niveles
          }
        }
      }
    }
  },
  orderBy: { order: 'asc' }
});
```

#### Obtener total de gastos recurrentes
```typescript
const total = await prisma.budgetLine.aggregate({
  where: {
    budgetId: hogarBudgetId,
    year: 2026,
    month: 3,
    category: {
      code: { startsWith: 'GASTOS.RECURRENTES' }
    }
  },
  _sum: { amount: true }
});
```

#### Comparar presupuestos
```typescript
const comparison = await prisma.budgetLine.groupBy({
  by: ['budgetId', 'categoryId'],
  where: {
    budgetId: { in: [hogarId, personalId] },
    year: 2026,
    month: 3
  },
  _sum: { amount: true }
});
```

---

## 7. Plan de Migración (Alto Nivel)

### Fase 1: Modelo de Datos
1. Crear tablas `Budget`, `BudgetCategory`, `BudgetLine`
2. Seed categorías del sistema (INGRESOS, GASTOS, AHORROS + sub-categorías base)
3. Migrar datos actuales:
   - Crear budget "default"
   - Mapear `PresupuestoIngreso` → `BudgetLine` con `categoryCode='INGRESOS'`
   - Mapear `Subscription` → `BudgetLine` con `categoryCode='GASTOS.RECURRENTES.SUSCRIPCIONES'`
   - (Repetir para todas las categorías)

### Fase 2: Backend
1. Crear servicio `BudgetHierarchyService`:
   - `getCategoryTree(budgetId): TreeNode[]`
   - `getBudgetByCategory(budgetId, categoryCode, year, month): BudgetLine[]`
   - `aggregateBudget(budgetId, categoryCode, year, month): number`
2. Actualizar rutas API:
   - `GET /api/budgets/:id/categories` → árbol de categorías
   - `GET /api/budgets/:id/lines?year=2026&month=3&category=GASTOS` → líneas filtradas
   - `POST /api/budgets/:id/categories` → crear categoría personalizada
   - `POST /api/budgets/:id/lines` → crear línea de presupuesto

### Fase 3: Frontend
1. Crear componente `BudgetTreeView`:
   - Renderizado recursivo de categorías
   - Colapsable/expandible
   - Mostrar totales agregados
2. Actualizar `Presupuesto.tsx`:
   - Usar `BudgetTreeView` en lugar de tabla hardcoded
   - Selector de presupuesto (dropdown)
3. Crear página `/presupuesto/categorias`:
   - CRUD de categorías personalizadas
   - Drag & drop para reordenar (opcional)

---

## 8. Archivos Impactados

### Backend (~15 archivos)

**Modelo de Datos:**
- `prisma/schema.prisma` → agregar `Budget`, `BudgetCategory`, `BudgetLine`
- `prisma/migrations/YYYYMMDDHHMMSS_add_budget_hierarchy/migration.sql`
- `prisma/seed.ts` → seed de categorías del sistema

**Servicios:**
- **NUEVO:** `src/services/budget-hierarchy.service.ts` → lógica de árbol
- `src/services/consolidado.ts` → migrar a usar `BudgetLine`

**Rutas:**
- **NUEVO:** `src/routes/budgets.ts` → CRUD budgets
- **NUEVO:** `src/routes/budget-categories.ts` → CRUD categorías
- **NUEVO:** `src/routes/budget-lines.ts` → CRUD líneas de presupuesto
- `src/routes/ingresos.ts` → migrar a usar `BudgetLine`
- `src/routes/servicios-basicos.ts` → migrar a usar `BudgetLine`
- `src/routes/supermercado.ts` → migrar a usar `BudgetLine`
- `src/routes/ahorros.ts` → migrar a usar `BudgetLine`
- `src/routes/actual.ts` → actualizar para usar categorías jerárquicas

**Index:**
- `src/index.ts` → registrar nuevas rutas

### Frontend (~20 archivos)

**Contexto:**
- **NUEVO:** `contexts/BudgetContext.tsx` → estado global del presupuesto activo
- **NUEVO:** `contexts/BudgetHierarchyContext.tsx` → caché del árbol de categorías

**Componentes:**
- **NUEVO:** `components/budget/BudgetTreeView.tsx` → árbol recursivo
- **NUEVO:** `components/budget/CategoryNode.tsx` → nodo individual
- **NUEVO:** `components/budget/BudgetLineRow.tsx` → línea de presupuesto editable
- **NUEVO:** `components/budget/BudgetSelector.tsx` → dropdown cambio de presupuesto
- **NUEVO:** `components/budget/CategoryManageModal.tsx` → CRUD categorías
- `components/Sidebar.tsx` → agregar selector de presupuesto

**Páginas:**
- `pages/Presupuesto.tsx` → reescribir con `BudgetTreeView`
- `pages/Actual.tsx` → actualizar para usar categorías jerárquicas
- **NUEVO:** `pages/ConfiguracionCategorias.tsx` → gestión de categorías
- `pages/Ingresos.tsx` → migrar a usar `BudgetLine`
- `pages/ServiciosBasicos.tsx` → migrar a usar `BudgetLine`
- `pages/Supermercado.tsx` → migrar a usar `BudgetLine`
- `pages/Ahorros.tsx` → migrar a usar `BudgetLine`

**APIs:**
- **NUEVO:** `api/budgetApi.ts` → fetch budgets
- **NUEVO:** `api/budgetCategoryApi.ts` → fetch/create categorías
- **NUEVO:** `api/budgetLineApi.ts` → fetch/create líneas
- `api/actualApi.ts` → actualizar para categorías jerárquicas

**Tipos:**
- **NUEVO:** `types/budget.ts` → interfaces Budget, BudgetCategory, BudgetLine
- **NUEVO:** `types/budgetTree.ts` → TreeNode para árbol recursivo
- `types/actual.ts` → actualizar para usar categorías jerárquicas

**Total Estimado:** ~35 archivos (~15 backend + ~20 frontend)

---

## 9. Ejemplo Visual de UI Propuesta

### Vista Presupuesto con Jerarquía

```
┌─────────────────────────────────────────────────────────────────┐
│ Presupuesto: [Hogar ▼]  Año: [2026 ▼]                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ▼ INGRESOS                      Ene     Feb     Mar    ...     │
│   ├─ ▶ Remuneraciones         3.500K   3.500K  3.500K          │
│   └─ ▶ Otros Ingresos            50K      50K     50K          │
│   ─────────────────────────────────────────────────────────────│
│   TOTAL INGRESOS               3.550K   3.550K  3.550K          │
│                                                                 │
│ ▼ GASTOS                                                        │
│   ├─ ▼ Recurrentes             1.200K   1.200K  1.200K          │
│   │   ├─ ▶ Suscripciones          30K      30K     30K          │
│   │   ├─ ▶ Servicios Básicos     150K     150K    150K          │
│   │   └─ ▶ Obligaciones          500K     500K    500K          │
│   ├─ ▶ Variables                 800K     800K    800K          │
│   └─ ▶ Vivienda                  650K     650K    650K          │
│   ─────────────────────────────────────────────────────────────│
│   TOTAL GASTOS                 2.650K   2.650K  2.650K          │
│                                                                 │
│ ▶ AHORROS                        300K     300K    300K          │
│                                                                 │
│ ═════════════════════════════════════════════════════════════  │
│ BALANCE                          600K     600K    600K          │
└─────────────────────────────────────────────────────────────────┘

[+ Agregar Categoría]  [Gestionar Categorías]
```

### Vista Expandida de Categoría

```
▼ GASTOS > Recurrentes
  ├─ ▼ Suscripciones (30K)
  │   ├─ Netflix (12K)          [✏️ Editar] [🗑️]
  │   ├─ Spotify (8K)           [✏️ Editar] [🗑️]
  │   └─ Disney+ (10K)          [✏️ Editar] [🗑️]
  │   [+ Agregar Suscripción]
  │
  ├─ ▶ Servicios Básicos (150K)
  └─ ▶ Obligaciones (500K)
```

---

## 10. Consideraciones Finales

### 10.1 Riesgos Identificados

1. **Complejidad de Migración:**
   - Mapear datos actuales a nueva estructura requiere cuidado
   - Validar que totales coinciden antes/después de migración

2. **Performance:**
   - Consultas recursivas pueden ser lentas con muchos niveles
   - Considerar desnormalizar totales (campo `totalAmount` en categorías)

3. **Curva de Aprendizaje:**
   - Usuario necesita entender concepto de categorías vs líneas
   - Documentación y onboarding importantes

### 10.2 Extensiones Futuras (Post-MVP)

1. **Plantillas de Categorías:**
   - Usuario puede crear plantilla de categorías y aplicarla a nuevo presupuesto
   - Ejemplo: "Plantilla Hogar" → aplicar a "Presupuesto Hogar 2027"

2. **Categorías Compartidas:**
   - Categorías globales compartidas entre presupuestos
   - Usuario decide si categoría es global o específica

3. **Drag & Drop:**
   - Reordenar categorías arrastrando
   - Mover líneas entre categorías

4. **Importación/Exportación:**
   - Exportar estructura de categorías a JSON
   - Importar desde Excel/CSV

5. **Análisis Comparativo:**
   - Dashboard que compara Hogar vs Personal
   - Gráficos por categoría (barras, pie charts)

---

## 11. Conclusión

### Estado Actual
- ✅ **Sistema funcional** con categorías planas
- ⚠️ **Jerarquía implícita** solo en UI, no en modelo de datos
- ❌ **No escalable** para múltiples presupuestos con estructura ordenada

### Recomendación Final

**Implementar Alternativa 2 (Jerarquía Híbrida)** para MVP de múltiples presupuestos:

1. **Estructura base clara:** INGRESOS, GASTOS, AHORROS
2. **Flexibilidad media:** Usuario crea sub-categorías según necesidad
3. **Comparabilidad garantizada:** Estructura base permite comparar presupuestos
4. **Migración manejable:** ~35 archivos, 2-3 semanas de desarrollo
5. **Balance costo/beneficio:** Evita over-engineering sin sacrificar extensibilidad

**Próximos Pasos (No implementar aún):**
1. Validar con usuario que la jerarquía propuesta cubre sus casos de uso
2. Diseñar UX detallado (mockups de `BudgetTreeView`)
3. Estimar en detalle (desglosar en tickets)
4. Implementar en fases (Backend → Migración → Frontend)

---

**FIN DEL DOCUMENTO**
