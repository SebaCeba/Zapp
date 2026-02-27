# Análisis: Categorías del Presupuesto y Actual

**Fecha**: 27 de febrero de 2026  
**Autor**: Análisis técnico del sistema de categorías  
**Objetivo**: Evaluar la estructura actual de categorías y qué implicaría convertirlas en un árbol jerárquico

---

## 📊 Resumen Ejecutivo

**Estado Actual**: Las categorías de Presupuesto/Actual funcionan como un **enum plano de 8 valores fijos**.

**Propuesta**: Convertirlas en una **estructura jerárquica de árbol** similar al sistema ya implementado para categorías de Tenpo.

**Nivel de Complejidad**: ⚠️ **ALTO** - Requiere refactorización profunda de backend, frontend, base de datos y lógica de negocio.

---

## 🔍 1. Estado Actual del Sistema de Categorías

### 1.1. Definición de Categorías (Enum Plano)

Las categorías se definen como un **enum TypeScript** con valores fijos:

#### Frontend: `node-version/client/src/types/actual.ts`
```typescript
export enum ActualCategory {
  INGRESOS = 'INGRESOS',
  SUSCRIPCIONES = 'SUSCRIPCIONES',
  OBLIGACIONES = 'OBLIGACIONES',
  HIPOTECARIO = 'HIPOTECARIO',
  SERVICIOS_BASICOS = 'SERVICIOS_BASICOS',
  SUPERMERCADO = 'SUPERMERCADO',
  PAGO_TC = 'PAGO_TC',
  AJUSTES = 'AJUSTES'
}
```

#### Backend: `node-version/src/routes/actual.ts`
```typescript
const VALID_CATEGORIES = [
  'INGRESOS',
  'SUSCRIPCIONES',
  'OBLIGACIONES',
  'HIPOTECARIO',
  'SERVICIOS_BASICOS',
  'SUPERMERCADO',
  'PAGO_TC',
  'AJUSTES'
];
```

#### Base de Datos: `node-version/prisma/schema.prisma`
```prisma
model ActualEntry {
  id         Int      @id @default(autoincrement())
  year       Int
  month      Int
  category   String   // ⚠️ String libre, NO enum nativo
  itemKey    String
  label      String?
  amountClp  Int
  isPaid     Boolean  @default(false)
  isLocked   Boolean  @default(false)
  
  @@unique([year, month, category, itemKey])
}
```

**❗Nota importante**: SQLite **no soporta enums nativos**, por lo que se almacena como `String` y la validación se hace en código.

---

### 1.2. Uso de Categorías en el Sistema

#### 🌐 Backend Service: `node-version/src/services/consolidado.ts`

La función `getMonthlyBudget()` construye el presupuesto mensual agregando datos de múltiples fuentes:

```typescript
interface MonthlyBudget {
  INGRESOS: MonthlyBudgetLine[];          // → presupuestoIngreso
  SUSCRIPCIONES: MonthlyBudgetLine[];     // → subscription
  OBLIGACIONES: MonthlyBudgetLine[];      // → obligacion
  HIPOTECARIO: MonthlyBudgetLine[];       // → mortgagePayment + mortgageInsurance
  SERVICIOS_BASICOS: MonthlyBudgetLine[]; // → presupuestoServicioBasico
  SUPERMERCADO: MonthlyBudgetLine[];      // → supermercadoPresupuesto
  PAGO_TC: MonthlyBudgetLine[];           // → vacío (se llena con ActualEntry)
  AJUSTES: MonthlyBudgetLine[];           // → vacío (manual)
}
```

**Cada categoría obtiene datos de tablas específicas de Prisma:**

| Categoría           | Tabla(s) en Prisma                           | Lógica                                    |
|---------------------|---------------------------------------------|------------------------------------------|
| `INGRESOS`          | `PresupuestoIngreso` + `IngresoBase`         | Presupuestos mensuales por tipo de ingreso |
| `SUSCRIPCIONES`     | `Subscription` + `PriceOverride`             | Calcula periodicidad (mensual/anual/trimestral) |
| `OBLIGACIONES`      | `Obligacion`                                 | Cuotas de créditos y seguros              |
| `HIPOTECARIO`       | `MortgagePayment` + `MortgageInsurance`      | Dividendos + seguros en UF/CLP            |
| `SERVICIOS_BASICOS` | `PresupuestoServicioBasico` + `ServicioBasico` | Presupuestos mensuales por servicio      |
| `SUPERMERCADO`      | `SupermercadoPresupuesto`                    | Presupuesto mensual global                |
| `PAGO_TC`           | –                                            | Solo en Actual (no hay presupuesto)       |
| `AJUSTES`           | –                                            | Solo manual (usuario agrega entries)      |

**🔑 Punto clave**: Cada categoría está **hardcodeada** con lógica específica de consulta a diferentes tablas.

---

#### 🎨 Frontend

**Página `/actual`** (`node-version/client/src/pages/Actual.tsx`):
- Usa el enum `ActualCategory` para tipado
- Renderiza `ActualConsolidatedTable` con todas las categorías
- Orden fijo definido en `CATEGORY_ORDER`

**Componente `ActualConsolidatedTable.tsx`**:
```typescript
const CATEGORY_LABELS: Record<ActualCategory, string> = {
  [ActualCategory.INGRESOS]: 'Ingresos',
  [ActualCategory.SUSCRIPCIONES]: 'Suscripciones',
  [ActualCategory.OBLIGACIONES]: 'Créditos y Seguros',
  [ActualCategory.HIPOTECARIO]: 'Hipotecario',
  [ActualCategory.SERVICIOS_BASICOS]: 'Servicios Básicos',
  [ActualCategory.SUPERMERCADO]: 'Supermercado',
  [ActualCategory.PAGO_TC]: 'Pagos TC',
  [ActualCategory.AJUSTES]: 'Ajustes'
};

const CATEGORY_ORDER: ActualCategory[] = [
  ActualCategory.INGRESOS,
  ActualCategory.SUSCRIPCIONES,
  // ... orden fijo
];
```

**Página `/presupuesto/resumen`** (`node-version/client/src/pages/Presupuesto.tsx`):
- Usa categorías fijas para renderizar filas expandibles
- Cada categoría tiene lógica de colores y comportamiento específico

---

### 1.3. Diagrama del Flujo Actual

```
┌─────────────────────────────────────────────────────────────┐
│                    CATEGORÍAS PLANAS (Enum)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   BACKEND     │    │   DATABASE    │    │   FRONTEND    │
│               │    │               │    │               │
│ • VALID_      │    │ ActualEntry   │    │ ActualCategory│
│   CATEGORIES  │───▶│ .category     │───▶│ (TypeScript   │
│   (array)     │    │ (String)      │    │  enum)        │
│               │    │               │    │               │
│ • Monthly     │    │ 13 tablas     │    │ CATEGORY_     │
│   Budget      │───▶│ específicas   │───▶│ LABELS        │
│   (hardcoded) │    │ por categoría │    │ (Record)      │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## 🌳 2. Sistema de Categorías Jerárquicas de Tenpo (Referencia)

### 2.1. ¿Qué Ya Existe?

Tu aplicación **YA TIENE** un sistema de categorías jerárquicas completo implementado para **Tenpo**:

#### Modelo en Prisma: `node-version/prisma/schema.prisma`
```prisma
model MerchantCategory {
  id              Int                  @id @default(autoincrement())
  name            String
  parentId        Int?                 @map("parent_id")
  parent          MerchantCategory?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        MerchantCategory[]   @relation("CategoryHierarchy")
  level           Int                  @default(1) // 1, 2, o 3
  order           Int                  @default(0)
  color           String?
  icon            String?
  isSystem        Boolean              @default(false)
  merchants       MerchantMapping[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}
```

**Características**:
- ✅ **Self-referential relation** (`parentId` → `parent`)
- ✅ **Recursivo**: `children` contiene subcategorías anidadas
- ✅ **Máximo 3 niveles** de profundidad
- ✅ **Orden visual** configurable (`order`)
- ✅ **Metadatos UI** (color, icono)
- ✅ **Categoría sistema** para "Sin Categorizar"

#### API Completa: `node-version/src/routes/merchant-categories.ts`
```typescript
GET    /api/tenpo/categories           // Árbol completo o flat=true
GET    /api/tenpo/categories/:id       // Detalle con children
POST   /api/tenpo/categories           // Crear (con parentId)
PUT    /api/tenpo/categories/:id       // Actualizar
DELETE /api/tenpo/categories/:id       // Eliminar (valida children)
```

#### Frontend: `node-version/client/src/pages/TenpoCategories.tsx`
- ✅ **Drag & Drop** para reorganizar árbol
- ✅ **Asignación en batch** de comercios
- ✅ **Visualización jerárquica** con indentación
- ✅ **924 líneas** de código completo y funcional

---

### 2.2. Ejemplo de Árbol Tenpo

```
📊 Gastos Personales (Level 1, parentId: null)
    ├─ 🍔 Alimentación (Level 2, parentId: 1)
    │   ├─ McDonald's (Level 3, parentId: 2)
    │   └─ Subway (Level 3, parentId: 2)
    │
    ├─ 🎮 Entretenimiento (Level 2, parentId: 1)
    │   ├─ Netflix (Level 3, parentId: 3)
    │   └─ Spotify (Level 3, parentId: 3)
    │
    └─ 🚗 Transporte (Level 2, parentId: 1)
        ├─ Uber (Level 3, parentId: 4)
        └─ Combustible (Level 3, parentId: 4)
```

**Estructura JSON del árbol**:
```json
{
  "id": 1,
  "name": "Gastos Personales",
  "parentId": null,
  "level": 1,
  "children": [
    {
      "id": 2,
      "name": "Alimentación",
      "parentId": 1,
      "level": 2,
      "children": [
        { "id": 5, "name": "McDonald's", "parentId": 2, "level": 3, "children": [] },
        { "id": 6, "name": "Subway", "parentId": 2, "level": 3, "children": [] }
      ]
    }
  ]
}
```

---

## 🛠️ 3. Propuesta: Categorías Jerárquicas para Presupuesto/Actual

### 3.1. Estructura de Árbol Propuesta

```
📊 INGRESOS (Level 1)
    ├─ Sueldos (Level 2)
    │   ├─ Sueldo Base (Level 3)
    │   ├─ Bono Desempeño (Level 3)
    │   └─ Horas Extra (Level 3)
    │
    └─ Otros Ingresos (Level 2)
        ├─ Arriendo Depto (Level 3)
        └─ Venta Freelance (Level 3)

📊 GASTOS FIJOS (Level 1)
    ├─ Vivienda (Level 2)
    │   ├─ Hipotecario (Level 3)
    │   │   ├─ Dividendo (Level 4)
    │   │   └─ Seguros (Level 4)
    │   └─ Servicios Básicos (Level 3)
    │       ├─ Luz (Level 4)
    │       ├─ Agua (Level 4)
    │       └─ Internet (Level 4)
    │
    ├─ Transporte (Level 2)
    │   ├─ Crédito Auto (Level 3)
    │   └─ TAG (Level 3)
    │
    └─ Suscripciones (Level 2)
        ├─ Netflix (Level 3)
        ├─ Spotify (Level 3)
        └─ Gimnasio (Level 3)

📊 GASTOS VARIABLES (Level 1)
    ├─ Alimentación (Level 2)
    │   ├─ Supermercado (Level 3)
    │   └─ Restaurants (Level 3)
    │
    └─ Discrecionales (Level 2)
        ├─ Ropa (Level 3)
        └─ Entretenimiento (Level 3)
```

---

### 3.2. Cambios en Base de Datos

#### Nuevo Modelo: `BudgetCategory`

```prisma
model BudgetCategory {
  id              Int                  @id @default(autoincrement())
  name            String
  parentId        Int?                 @map("parent_id")
  parent          BudgetCategory?      @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        BudgetCategory[]     @relation("CategoryHierarchy")
  level           Int                  @default(1)
  order           Int                  @default(0)
  isIncome        Boolean              @default(false) @map("is_income")
  color           String?
  icon            String?
  isSystem        Boolean              @default(false) @map("is_system")
  
  // Relaciones con tablas de presupuesto
  budgetItems     BudgetItem[]
  actualEntries   ActualEntry[]
  
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@map("budget_categories")
}

// Nueva tabla intermedia para items de presupuesto
model BudgetItem {
  id                Int              @id @default(autoincrement())
  categoryId        Int              @map("category_id")
  category          BudgetCategory   @relation(fields: [categoryId], references: [id])
  itemKey           String           @map("item_key")
  name              String
  sourceType        String           @map("source_type") // SUBSCRIPTION, INGRESO, SERVICIO, etc.
  sourceId          Int?             @map("source_id")   // ID de la tabla original
  createdAt         DateTime         @default(now()) @map("created_at")
  
  @@unique([categoryId, itemKey])
  @@map("budget_items")
}
```

#### Migración de `ActualEntry`

```prisma
model ActualEntry {
  // ... campos existentes ...
  
  // CAMBIO: Reemplazar category String por relación
  categoryId    Int              @map("category_id")
  category      BudgetCategory   @relation(fields: [categoryId], references: [id])
  
  @@unique([year, month, categoryId, itemKey]) // ⚠️ Cambiar constraint
}
```

---

### 3.3. Cambios en Backend

#### 3.3.1. Nueva API de Categorías

**Archivo**: `node-version/src/routes/budget-categories.ts`

```typescript
// Similar a merchant-categories.ts pero para presupuesto
GET    /api/budget/categories           // Árbol completo
GET    /api/budget/categories/:id       // Detalle + children
POST   /api/budget/categories           // Crear (parentId, level, isIncome)
PUT    /api/budget/categories/:id       // Actualizar
DELETE /api/budget/categories/:id       // Eliminar (valida children y items)
POST   /api/budget/categories/reorder   // Cambiar orden
```

#### 3.3.2. Refactorizar `consolidado.ts`

**ANTES** (hardcoded):
```typescript
interface MonthlyBudget {
  INGRESOS: MonthlyBudgetLine[];
  SUSCRIPCIONES: MonthlyBudgetLine[];
  // ... 8 categorías fijas
}
```

**DESPUÉS** (dinámico):
```typescript
interface MonthlyBudget {
  categories: CategoryBudget[];
}

interface CategoryBudget {
  id: number;
  name: string;
  level: number;
  parentId: number | null;
  isIncome: boolean;
  lines: MonthlyBudgetLine[];
  children: CategoryBudget[]; // Recursivo
}
```

**Nueva función**:
```typescript
export async function getMonthlyBudgetTree(
  year: number, 
  month: number
): Promise<CategoryBudget[]> {
  // 1. Obtener árbol de categorías
  const categories = await prisma.budgetCategory.findMany({
    where: { level: 1 },
    include: {
      children: {
        include: {
          children: true // Hasta 3 niveles
        }
      }
    }
  });
  
  // 2. Para cada categoría, consultar items según sourceType
  for (const cat of categories) {
    const items = await prisma.budgetItem.findMany({
      where: { categoryId: cat.id }
    });
    
    for (const item of items) {
      // Consultar tabla original según sourceType
      switch (item.sourceType) {
        case 'INGRESO':
          // Query a PresupuestoIngreso
        case 'SUBSCRIPTION':
          // Query a Subscription
        case 'SERVICIO':
          // Query a PresupuestoServicioBasico
        // etc...
      }
    }
  }
  
  return categories;
}
```

⚠️ **PROBLEMA**: Esta función será **mucho más compleja** que la actual, con múltiples queries anidadas.

---

#### 3.3.3. Refactorizar `/api/actual/summary`

```typescript
// ANTES: Loop sobre VALID_CATEGORIES array
const categories = VALID_CATEGORIES.map(categoryName => { ... });

// DESPUÉS: Construir árbol jerárquico
const categoryTree = await buildCategoryTree(year, month);
const flatCategories = flattenTree(categoryTree); // Para backward compatibility
```

---

### 3.4. Cambios en Frontend

#### 3.4.1. Nuevo Tipo TypeScript

**Archivo**: `node-version/client/src/types/budget.ts`

```typescript
export interface BudgetCategory {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  order: number;
  isIncome: boolean;
  color: string | null;
  icon: string | null;
  children?: BudgetCategory[];
}

export interface CategorySummary {
  id: number;
  name: string;
  level: number;
  parentId: number | null;
  budgetClp: number;
  actualClp: number;
  deltaClp: number;
  pctExec: number | null;
  lines: ActualLine[];
  children: CategorySummary[]; // Recursivo
}
```

#### 3.4.2. Nueva Página de Gestión

**Archivo**: `node-version/client/src/pages/BudgetCategories.tsx`

- Clonar `TenpoCategories.tsx` (924 líneas)
- Adaptar para categorías de presupuesto
- Agregar funcionalidad para asociar items de presupuesto

#### 3.4.3. Refactorizar `ActualConsolidatedTable`

```typescript
// ANTES: Map sobre CATEGORY_ORDER fijo
sortedCategories.map(category => { ... })

// DESPUÉS: Renderizar árbol recursivo
const renderCategoryTree = (categories: CategorySummary[], depth = 0) => {
  return categories.map(category => (
    <>
      <tr style={{ paddingLeft: `${depth * 1.5}rem` }}>
        {/* Renderizar categoría */}
      </tr>
      {category.children.length > 0 && renderCategoryTree(category.children, depth + 1)}
    </>
  ));
};
```

#### 3.4.4. Refactorizar Página Presupuesto

- Convertir filas fijas en renderizado recursivo
- Agregar/remover categorías dinámicamente
- Mantener lógica de expansión por nivel

---

### 3.5. Migración de Datos

#### Script de Migración: `scripts/migrate-categories-to-tree.ts`

```typescript
// 1. Crear categorías de nivel 1 (raíz)
const ingresos = await prisma.budgetCategory.create({
  data: { name: 'INGRESOS', level: 1, isIncome: true, order: 1 }
});

const gastosFijos = await prisma.budgetCategory.create({
  data: { name: 'GASTOS FIJOS', level: 1, isIncome: false, order: 2 }
});

// 2. Crear categorías de nivel 2 (hijas)
const sueldos = await prisma.budgetCategory.create({
  data: { 
    name: 'Sueldos', 
    level: 2, 
    parentId: ingresos.id, 
    isIncome: true 
  }
});

// 3. Mapear ActualEntry existentes a nueva estructura
const entries = await prisma.actualEntry.findMany();
for (const entry of entries) {
  const newCategoryId = categoryMap[entry.category]; // Mapeo manual
  await prisma.actualEntry.update({
    where: { id: entry.id },
    data: { categoryId: newCategoryId }
  });
}

// 4. Crear BudgetItems para vincular con tablas originales
await prisma.budgetItem.createMany({
  data: ingresos.map(ing => ({
    categoryId: sueldos.id,
    itemKey: `ingreso:${ing.id}`,
    name: ing.nombre,
    sourceType: 'INGRESO',
    sourceId: ing.id
  }))
});
```

---

## 📊 4. Impacto y Complejidad

### 4.1. Archivos a Modificar

| Componente | Archivos Afectados | Estimación Líneas |
|------------|-------------------|-------------------|
| **Prisma Schema** | `schema.prisma` | +60 líneas |
| **Migraciones** | Nueva migración SQL | +200 líneas |
| **Backend API** | `budget-categories.ts` (nuevo) | +400 líneas |
| | `consolidado.ts` (refactor) | ~300 líneas modificadas |
| | `actual.ts` (refactor) | ~150 líneas modificadas |
| **Frontend Types** | `budget.ts` (nuevo) | +80 líneas |
| **Frontend Pages** | `BudgetCategories.tsx` (nuevo) | +900 líneas |
| | `Actual.tsx` (refactor) | ~100 líneas modificadas |
| **Frontend Components** | `ActualConsolidatedTable.tsx` | ~200 líneas modificadas |
| | `Presupuesto.tsx` | ~300 líneas modificadas |
| **Scripts** | `migrate-categories-to-tree.ts` | +300 líneas |
| **Documentación** | Actualizar docs | +500 líneas |

**TOTAL ESTIMADO**: ~3,500 líneas de código nuevo/modificado

---

### 4.2. Riesgos y Desafíos

#### 🔴 **Riesgo Alto**

1. **Migración de datos existentes**
   - Tienes datos históricos en `ActualEntry` con categorías planas
   - Mapeo manual de categorías viejas → nuevas ID
   - Riesgo de pérdida o corrupción de datos

2. **Lógica de negocio hardcodeada**
   - Cada categoría actual tiene lógica específica en `consolidado.ts`
   - Difícil generalizar para árbol dinámico
   - Ejemplo: Hipotecario calcula UF, Suscripciones calcula periodicidad

3. **Rendimiento de queries**
   - Árbol recursivo requiere múltiples queries anidadas
   - Posible N+1 problem si no se usa eager loading correcto
   - Base de datos SQLite puede no ser óptima para árboles profundos

#### 🟡 **Riesgo Medio**

4. **Complejidad en UI**
   - Renderizado recursivo de tablas con indentación
   - Mantener expansión/colapso por nivel
   - Drag & Drop complicado en tabla consolidada

5. **Backward compatibility**
   - API actual puede romper si frontend no se actualiza
   - Necesitas mantener ambas APIs durante transición

6. **Testing exhaustivo**
   - Casos de borde: categorías huérfanas, ciclos, nivel > 3
   - Validación de constraints (no permitir más de 3 niveles)

---

### 4.3. Comparación con Sistema Tenpo

| Aspecto | Tenpo Categories | Presupuesto Actual | Propuesta Árbol |
|---------|------------------|-------------------|-----------------|
| **Complejidad DB** | Baja (1 modelo) | Muy Alta (13 tablas) | Alta (2 modelos + refactor) |
| **Lógica Business** | Simple (asignación) | Compleja (cálculos) | Muy Compleja (mantener cálculos) |
| **UI Drag & Drop** | ✅ Implementado | ❌ No aplica | ⚠️ Complicado en tabla |
| **Migración** | No aplica (nuevo) | ⚠️ Datos históricos | 🔴 Alto riesgo |
| **Mantenibilidad** | Alta | Baja (hardcoded) | Media (requiere docs) |

---

## 🎯 5. Alternativas y Recomendaciones

### 5.1. Opción A: Árbol Completo (Lo que pediste)

**PROs**:
- ✅ Máxima flexibilidad para organizar presupuesto
- ✅ Escalable a cualquier estructura futura
- ✅ UI más intuitiva y moderna

**CONs**:
- ❌ 3-4 semanas de desarrollo full-time
- ❌ Alto riesgo de bugs en migración
- ❌ Requiere testing exhaustivo
- ❌ Posibles problemas de performance

**Estimación**: 120-160 horas de trabajo

---

### 5.2. Opción B: Árbol Parcial (2 niveles)

**Implementación simplificada**:
- Mantener categorías de nivel 1 como están (enum)
- Agregar solo 1 nivel de subcategorías editables
- No tocar lógica de `consolidado.ts`

```
INGRESOS (fijo)
  ├─ Sueldos (editable)
  └─ Otros Ingresos (editable)

SUSCRIPCIONES (fijo)
  ├─ Streaming (editable)
  └─ Productividad (editable)
```

**PROs**:
- ✅ Menor riesgo, menor complejidad
- ✅ Migración más simple
- ✅ Mantiene lógica actual de presupuesto

**CONs**:
- ⚠️ Menos flexible que árbol completo
- ⚠️ Aún requiere refactoring significativo

**Estimación**: 40-60 horas de trabajo

---

### 5.3. Opción C: Etiquetas/Tags (No jerárquico)

En lugar de árbol, agregar **tags libres** a items de presupuesto:

```prisma
model BudgetTag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String?
  entries   ActualEntry[]
}

model ActualEntry {
  // ... campos existentes ...
  tags      BudgetTag[]  // Many-to-many
}
```

**PROs**:
- ✅ Muy flexible (un item puede tener múltiples tags)
- ✅ No requiere migración compleja
- ✅ Fácil de filtrar/agrupar en UI

**CONs**:
- ⚠️ No es estructura de árbol (no cumple requisito)
- ⚠️ Difícil mostrar totales por categoría padre

**Estimación**: 20-30 horas de trabajo

---

### 5.4. Opción D: Mantener Actual + Vista Virtual

Crear una **capa de visualización** que agrupe categorías existentes sin cambiar DB:

```typescript
// Archivo de configuración JSON
const categoryTree = {
  "Vivienda": {
    children: ["HIPOTECARIO", "SERVICIOS_BASICOS"]
  },
  "Consumo": {
    children: ["SUPERMERCADO", "SUSCRIPCIONES"]
  }
};
```

**PROs**:
- ✅ Zero riesgo (no toca DB ni backend)
- ✅ Rápido de implementar
- ✅ Reversible

**CONs**:
- ❌ No es árbol real, solo agrupación visual
- ❌ Limitado a 2 niveles fijos
- ❌ No permite crear categorías nuevas

**Estimación**: 8-12 horas de trabajo

---

## 📋 6. Plan de Implementación (Opción A)

**Si decides ir por el árbol completo (3-4 semanas)**:

### Fase 1: Base de Datos (Semana 1)
- [ ] Diseñar schema `BudgetCategory` y `BudgetItem`
- [ ] Crear migración Prisma
- [ ] Escribir script de migración de datos
- [ ] Testing en DB de desarrollo
- [ ] Backup de producción antes de migrar

### Fase 2: Backend API (Semana 2)
- [ ] Implementar CRUD de categorías (`budget-categories.ts`)
- [ ] Refactorizar `consolidado.ts` para árbol
- [ ] Actualizar `/api/actual/summary` con árbol
- [ ] Agregar endpoints de reordenamiento
- [ ] Testing de APIs con Postman/Thunder

### Fase 3: Frontend Core (Semana 3)
- [ ] Crear tipos TypeScript para árbol
- [ ] Implementar página `BudgetCategories.tsx`
- [ ] Refactorizar `ActualConsolidatedTable` para recursión
- [ ] Agregar drag & drop (opcional)
- [ ] Testing manual de CRUD

### Fase 4: Integración y Pulido (Semana 4)
- [ ] Refactorizar página Presupuesto
- [ ] Migrar datos de producción
- [ ] Testing end-to-end
- [ ] Documentar cambios
- [ ] Capacitación de usuario (si aplica)

---

## 🤔 7. Decisión Final

### Pregunta clave para ti:

**¿Qué problema estás tratando de resolver?**

- **Problema**: "Quiero controlar el Leer más categorías personalizadas"
  - → **Opción C** (Tags) es suficiente

- **Problema**: "Necesito agrupar visualmente categorías existentes"
  - → **Opción D** (Vista Virtual) es la más rápida

- **Problema**: "Quiero subcategorías editables pero simples"
  - → **Opción B** (2 niveles) es el balance

- **Problema**: "Necesito árbol completo de 3+ niveles como Tenpo"
  - → **Opción A** (Árbol Completo) pero prepárate para 1 mes de trabajo

---

## 📚 8. Referencias de Código Existentes

Para implementar Opción A, puedes **clonar y adaptar** estos archivos:

### Backend
- `node-version/src/routes/merchant-categories.ts` (306 líneas)
  - Lógica de árbol y validaciones
- `node-version/prisma/schema.prisma` (líneas 307-340)
  - Modelo MerchantCategory

### Frontend
- `node-version/client/src/pages/TenpoCategories.tsx` (924 líneas)
  - UI completa con drag & drop
- `node-version/client/src/pages/TenpoMerchantAssignment.tsx`
  - Ejemplo de árbol recursivo con RSuite Tree

### Documentación
- `docs/tenpo/tenpo-category-structure-analysis.md`
  - Análisis completo del sistema Tenpo

---

## ✅ Conclusión

**Lo que tienes ahora**: Sistema de categorías **plano y hardcodeado** que funciona pero no es flexible.

**Lo que propones**: Sistema de categorías **jerárquico y dinámico** como Tenpo.

**Realidad**: Es un proyecto de refactorización **grande y complejo** que requiere:
- Modificar 13+ archivos críticos
- Migrar datos históricos con cuidado
- Refactorizar lógica de negocio compleja
- Testing exhaustivo para no romper nada

**Mi recomendación**: 
1. Define **exactamente qué flexibilidad necesitas**
2. Si es solo agrupar visualmente → Opción D (12 horas)
3. Si necesitas subcategorías editables → Opción B (60 horas)
4. Si necesitas árbol completo → Opción A (160 horas) **pero prepárate**

---

**¿Siguiente paso?**  
Dime cuál es tu caso de uso específico y puedo elaborar el plan detallado de la opción que elijas.
