# Especificación Final: Modelo de Datos MVP Finanzapp

**Fecha:** 2026-03-15  
**Estado:** Modelo de Datos Definitivo - NO IMPLEMENTAR AÚN  
**Versión:** 1.0  
**Propósito:** Definir el modelo de datos final recomendado para el MVP de Finanzapp, listo para implementar en Prisma

---

## 1. Resumen Ejecutivo

### 1.1 Entidades del Modelo

El modelo MVP consta de **5 entidades principales**:

1. **`users`** - Usuarios del sistema
2. **`budgets`** - Presupuestos (permanentes, multi-año)
3. **`budget_access`** - Acceso compartido entre usuarios y presupuestos
4. **`budget_categories`** - Categorías jerárquicas por presupuesto
5. **`monthly_entries`** - Entradas mensuales (plan y real)

**NO se incluyen tablas separadas de template** - La plantilla base se implementa como seed/fixture de datos que se clona al crear un presupuesto.

### 1.2 Decisiones Arquitectónicas Clave

- ✅ **Categorías por presupuesto** (NO globales): Cada presupuesto tiene su propio árbol de categorías
- ✅ **Plantilla como seed**: La plantilla base es código/datos iniciales, NO una tabla separada
- ✅ **Clonación al crear**: Al crear un presupuesto, se copian las categorías de la plantilla
- ✅ **Árbol jerárquico**: Self-referencing con `parent_code` + `budget_id`
- ✅ **Solo hojas tienen monto**: Constraint `is_leaf = true` para crear `monthly_entries`
- ✅ **Escenarios unificados**: Campo `scenario` (BUDGET/ACTUAL) en lugar de tablas separadas

---

## 2. Entidades y Estructura de Datos

### 2.1 Tabla: `users`

**Propósito:** Almacenar usuarios del sistema.

**Estructura:**
```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  avatar      String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  budgetAccess BudgetAccess[]
  
  @@map("users")
}
```

**Campos:**

| Campo       | Tipo     | Requerido | Descripción                              |
|-------------|----------|-----------|------------------------------------------|
| `id`        | Int      | ✅        | PK autoincremental                       |
| `email`     | String   | ✅        | Email único del usuario                  |
| `name`      | String   | ✅        | Nombre display                           |
| `avatar`    | String?  | ❌        | URL de avatar (opcional)                 |
| `createdAt` | DateTime | ✅        | Timestamp de creación                    |
| `updatedAt` | DateTime | ✅        | Timestamp de última actualización        |

**Constraints:**
- `UNIQUE(email)`: No pueden existir dos usuarios con mismo email
- `NOT NULL` en `email` y `name`

**Notas MVP:**
- ❌ **NO** password: Sin autenticación en MVP (solo identificación por email)
- ❌ **NO** roles globales: Permisos solo a nivel de presupuesto
- ⚠️ **Simplificación extrema:** En producción agregar autenticación robusta

---

### 2.2 Tabla: `budgets`

**Propósito:** Almacenar presupuestos permanentes (no atados a un año).

**Estructura:**
```prisma
model Budget {
  id            Int      @id @default(autoincrement())
  name          String
  description   String?
  budgetType    String   @default("PERSONAL") @map("budget_type")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  access         BudgetAccess[]   @relation("BudgetToAccess")
  categories     BudgetCategory[] @relation("BudgetToCategories")
  monthlyEntries MonthlyEntry[]   @relation("BudgetToEntries")
  
  @@map("budgets")
}
```

**Campos:**

| Campo         | Tipo     | Requerido | Valores                  | Descripción                          |
|---------------|----------|-----------|--------------------------|--------------------------------------|
| `id`          | Int      | ✅        | -                        | PK autoincremental                   |
| `name`        | String   | ✅        | -                        | Nombre del presupuesto (ej: "Hogar") |
| `description` | String?  | ❌        | -                        | Descripción opcional                 |
| `budgetType`  | String   | ✅        | PERSONAL \| SHARED       | Tipo de presupuesto                  |
| `isActive`    | Boolean  | ✅        | true \| false            | Si está activo o archivado           |
| `createdAt`   | DateTime | ✅        | -                        | Timestamp de creación                |
| `updatedAt`   | DateTime | ✅        | -                        | Timestamp de última actualización    |

**Constraints:**
- `NOT NULL` en `name`, `budgetType`, `isActive`
- `DEFAULT "PERSONAL"` en `budgetType`
- `DEFAULT true` en `isActive`

**Reglas de Negocio:**
- ✅ Un presupuesto es **permanente**: NO tiene campo `year`
- ✅ Puede contener datos de múltiples años (el año está en `monthly_entries`)
- ✅ `budgetType` es informativo: "PERSONAL" (individual) o "SHARED" (compartido)
- ✅ `isActive = false` permite "archivar" presupuestos sin eliminarlos

**Notas MVP:**
- ❌ **NO** color, icon, currency: Simplificación MVP (todas las budgets usan CLP)
- ❌ **NO** soft delete: Usar `isActive` para archivar

---

### 2.3 Tabla: `budget_access`

**Propósito:** Manejar acceso compartido entre usuarios y presupuestos (tabla N:M).

**Estructura:**
```prisma
model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("OWNER")
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relaciones
  budget Budget @relation("BudgetToAccess", fields: [budgetId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, userId])
  @@index([userId])
  @@index([budgetId])
  @@map("budget_access")
}
```

**Campos:**

| Campo       | Tipo     | Requerido | Valores      | Descripción                           |
|-------------|----------|-----------|--------------|---------------------------------------|
| `id`        | Int      | ✅        | -            | PK autoincremental                    |
| `budgetId`  | Int      | ✅        | FK → budgets | Presupuesto al que da acceso          |
| `userId`    | Int      | ✅        | FK → users   | Usuario que tiene acceso              |
| `role`      | String   | ✅        | OWNER        | Rol del usuario en el presupuesto     |
| `createdAt` | DateTime | ✅        | -            | Timestamp de cuando se otorgó acceso  |

**Constraints:**
- `UNIQUE(budgetId, userId)`: Un usuario no puede tener acceso duplicado al mismo presupuesto
- `FK budgetId → budgets.id ON DELETE CASCADE`: Si se elimina el presupuesto, se eliminan los accesos
- `FK userId → users.id ON DELETE CASCADE`: Si se elimina el usuario, se eliminan sus accesos
- `INDEX(userId)`: Para queries "presupuestos del usuario X"
- `INDEX(budgetId)`: Para queries "usuarios con acceso al presupuesto Y"

**Reglas de Negocio:**
- ✅ **MVP: Solo rol OWNER**: Todos los usuarios con acceso pueden editar todo
- ✅ **Multi-owner permitido**: Un presupuesto puede tener múltiples OWNER
- ✅ **Multi-budget permitido**: Un usuario puede tener acceso a múltiples presupuestos
- ❌ **NO roles EDITOR/VIEWER en MVP**: Dejar para futuro

**Ejemplo de Datos:**
```sql
-- Seba tiene acceso a "Hogar" y "Seba"
INSERT INTO budget_access (budget_id, user_id, role) VALUES
  (1, 1, 'OWNER'), -- Seba → Hogar
  (2, 1, 'OWNER'); -- Seba → Seba

-- Mona tiene acceso a "Hogar" y "Mona"  
INSERT INTO budget_access (budget_id, user_id, role) VALUES
  (1, 2, 'OWNER'), -- Mona → Hogar
  (3, 2, 'OWNER'); -- Mona → Mona
```

---

### 2.4 Tabla: `budget_categories`

**Propósito:** Almacenar categorías jerárquicas por presupuesto.

**Estructura:**
```prisma
model BudgetCategory {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  code         String
  name         String
  parentCode   String?  @map("parent_code")
  categoryType String   @map("category_type")
  isLeaf       Boolean  @default(true) @map("is_leaf")
  order        Int      @default(0)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  budget   Budget           @relation("BudgetToCategories", fields: [budgetId], references: [id], onDelete: Cascade)
  parent   BudgetCategory?  @relation("CategoryTree", fields: [budgetId, parentCode], references: [budgetId, code], onDelete: NoAction, onUpdate: NoAction)
  children BudgetCategory[] @relation("CategoryTree")
  
  monthlyEntries MonthlyEntry[] @relation("CategoryToEntries")
  
  @@unique([budgetId, code])
  @@index([budgetId, parentCode])
  @@index([budgetId, categoryType])
  @@map("budget_categories")
}
```

**Campos:**

| Campo          | Tipo     | Requerido | Valores                       | Descripción                                         |
|----------------|----------|-----------|-------------------------------|-----------------------------------------------------|
| `id`           | Int      | ✅        | -                             | PK autoincremental                                  |
| `budgetId`     | Int      | ✅        | FK → budgets                  | Presupuesto al que pertenece la categoría           |
| `code`         | String   | ✅        | -                             | Código único dentro del presupuesto (dot-notation)  |
| `name`         | String   | ✅        | -                             | Nombre display de la categoría                      |
| `parentCode`   | String?  | ❌        | -                             | Código del padre (NULL si es raíz)                  |
| `categoryType` | String   | ✅        | INCOME \| EXPENSE \| SAVINGS  | Tipo de categoría                                   |
| `isLeaf`       | Boolean  | ✅        | true \| false                 | Si es hoja (puede tener montos) o grupo             |
| `order`        | Int      | ✅        | 0-999                         | Orden de visualización                              |
| `createdAt`    | DateTime | ✅        | -                             | Timestamp de creación                               |
| `updatedAt`    | DateTime | ✅        | -                             | Timestamp de última actualización                   |

**Constraints:**
- `UNIQUE(budgetId, code)`: Código único dentro del presupuesto
- `FK budgetId → budgets.id ON DELETE CASCADE`: Si se elimina presupuesto, se eliminan categorías
- `FK (budgetId, parentCode) → (budgetId, code)`: Self-referencing para árbol
- `INDEX(budgetId, parentCode)`: Para queries de árbol
- `INDEX(budgetId, categoryType)`: Para queries por tipo

**Reglas de Negocio:**

#### **RN-CAT-001: Solo hojas pueden tener montos**
```typescript
// Validación al crear MonthlyEntry
if (category.isLeaf === false) {
  throw new Error("No se pueden crear entradas monetarias en categorías grupo");
}
```

#### **RN-CAT-002: Códigos con dot-notation**
- Formato: `NIVEL1.NIVEL2.NIVEL3`
- Ejemplos:
  - Raíz: `INGRESOS`, `GASTOS`, `AHORROS`
  - Nivel 2: `GASTOS.SUSCRIPCIONES`, `GASTOS.SERVICIOS`
  - Nivel 3: `GASTOS.SUSCRIPCIONES.NETFLIX`

#### **RN-CAT-003: Árbol de categorías por presupuesto**
- Cada presupuesto tiene su propio árbol independiente
- Modificar categorías en "Hogar" NO afecta "Seba"
- Al clonar, se crea una copia completa del árbol

#### **RN-CAT-004: Tipos de categoría**
- `INCOME`: Ingresos (sueldos, bonos, etc.)
- `EXPENSE`: Gastos (suscripciones, servicios, etc.)
- `SAVINGS`: Ahorros (ahorro mensual, inversiones, etc.)

**Ejemplo de Datos (Presupuesto "Hogar", budgetId=1):**
```sql
INSERT INTO budget_categories (budget_id, code, name, parent_code, category_type, is_leaf, "order") VALUES
  -- Raíz
  (1, 'INGRESOS', 'Ingresos', NULL, 'INCOME', false, 1),
  (1, 'GASTOS', 'Gastos', NULL, 'EXPENSE', false, 2),
  (1, 'AHORROS', 'Ahorros', NULL, 'SAVINGS', false, 3),
  
  -- Nivel 2 - Ingresos
  (1, 'INGRESOS.REMUNERACIONES', 'Remuneraciones', 'INGRESOS', 'INCOME', false, 1),
  
  -- Nivel 3 - Ingresos (hojas)
  (1, 'INGRESOS.REMUNERACIONES.SUELDO', 'Sueldo Líquido', 'INGRESOS.REMUNERACIONES', 'INCOME', true, 1),
  (1, 'INGRESOS.REMUNERACIONES.BONOS', 'Bonos', 'INGRESOS.REMUNERACIONES', 'INCOME', true, 2),
  
  -- Nivel 2 - Gastos
  (1, 'GASTOS.SUSCRIPCIONES', 'Suscripciones', 'GASTOS', 'EXPENSE', false, 1),
  (1, 'GASTOS.SERVICIOS', 'Servicios Básicos', 'GASTOS', 'EXPENSE', false, 2),
  (1, 'GASTOS.SUPERMERCADO', 'Supermercado', 'GASTOS', 'EXPENSE', true, 3),
  
  -- Nivel 3 - Gastos (hojas)
  (1, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'Netflix', 'GASTOS.SUSCRIPCIONES', 'EXPENSE', true, 1),
  (1, 'GASTOS.SUSCRIPCIONES.SPOTIFY', 'Spotify', 'GASTOS.SUSCRIPCIONES', 'EXPENSE', true, 2),
  (1, 'GASTOS.SERVICIOS.LUZ', 'Luz (Enel)', 'GASTOS.SERVICIOS', 'EXPENSE', true, 1),
  (1, 'GASTOS.SERVICIOS.AGUA', 'Agua (Aguas Andinas)', 'GASTOS.SERVICIOS', 'EXPENSE', true, 2);
```

**Consulta Recursiva (Obtener árbol completo):**
```sql
-- PostgreSQL / SQLite con CTE recursivo
WITH RECURSIVE category_tree AS (
  -- Raíces
  SELECT * FROM budget_categories WHERE budget_id = 1 AND parent_code IS NULL
  UNION ALL
  -- Hijos
  SELECT c.* FROM budget_categories c
  INNER JOIN category_tree ct ON c.budget_id = ct.budget_id AND c.parent_code = ct.code
)
SELECT * FROM category_tree ORDER BY "order";
```

---

### 2.5 Tabla: `monthly_entries`

**Propósito:** Almacenar entradas mensuales (plan y real) por categoría.

**Estructura:**
```prisma
model MonthlyEntry {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  categoryCode String   @map("category_code")
  itemKey      String   @map("item_key")
  itemName     String   @map("item_name")
  year         Int
  month        Int
  amount       Float
  scenario     String   @default("BUDGET")
  notes        String?
  metadata     String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relaciones
  budget   Budget         @relation("BudgetToEntries", fields: [budgetId], references: [id], onDelete: Cascade)
  category BudgetCategory @relation("CategoryToEntries", fields: [budgetId, categoryCode], references: [budgetId, code])
  
  @@unique([budgetId, scenario, categoryCode, itemKey, year, month])
  @@index([budgetId, year, month, scenario])
  @@index([budgetId, categoryCode, scenario])
  @@map("monthly_entries")
}
```

**Campos:**

| Campo          | Tipo     | Requerido | Valores             | Descripción                                    |
|----------------|----------|-----------|---------------------|------------------------------------------------|
| `id`           | Int      | ✅        | -                   | PK autoincremental                             |
| `budgetId`     | Int      | ✅        | FK → budgets        | Presupuesto al que pertenece                   |
| `categoryCode` | String   | ✅        | FK → budget_categories | Categoría (debe ser hoja)                   |
| `itemKey`      | String   | ✅        | -                   | Identificador del ítem (ej: "netflix")         |
| `itemName`     | String   | ✅        | -                   | Nombre display (ej: "Netflix")                 |
| `year`         | Int      | ✅        | 2020-2100           | Año del período mensual                        |
| `month`        | Int      | ✅        | 1-12                | Mes del período mensual                        |
| `amount`       | Float    | ✅        | -                   | Monto en CLP                                   |
| `scenario`     | String   | ✅        | BUDGET \| ACTUAL    | Plan (BUDGET) o Real (ACTUAL)                  |
| `notes`        | String?  | ❌        | -                   | Notas adicionales                              |
| `metadata`     | String?  | ❌        | JSON string         | Metadatos extensibles                          |
| `createdAt`    | DateTime | ✅        | -                   | Timestamp de creación                          |
| `updatedAt`    | DateTime | ✅        | -                   | Timestamp de última actualización              |

**Constraints:**
- `UNIQUE(budgetId, scenario, categoryCode, itemKey, year, month)`: Evita duplicados
- `FK budgetId → budgets.id ON DELETE CASCADE`: Cascada al eliminar budget
- `FK (budgetId, categoryCode) → (budgetId, code)`: FK compuesta a categoría
- `INDEX(budgetId, year, month, scenario)`: Para queries mensuales
- `INDEX(budgetId, categoryCode, scenario)`: Para queries por categoría
- `CHECK(month >= 1 AND month <= 12)`: Validar mes válido

**Reglas de Negocio:**

#### **RN-ENTRY-001: Solo categorías hoja**
```typescript
// Validación antes de crear entrada
const category = await prisma.budgetCategory.findUnique({
  where: { budgetId_code: { budgetId, code: categoryCode } }
});

if (!category.isLeaf) {
  throw new Error(`Categoría ${categoryCode} es grupo, solo hojas pueden tener montos`);
}
```

#### **RN-ENTRY-002: Clave única compuesta**
- No pueden coexistir dos entries con mismo `(budgetId, scenario, categoryCode, itemKey, year, month)`
- **SÍ** pueden coexistir BUDGET y ACTUAL del mismo ítem/mes (diferente `scenario`)

**Ejemplo:**
```sql
-- Netflix en Hogar - Marzo 2026 - BUDGET
INSERT INTO monthly_entries (budget_id, category_code, item_key, item_name, year, month, amount, scenario) VALUES
  (1, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'BUDGET');

-- Netflix en Hogar - Marzo 2026 - ACTUAL
INSERT INTO monthly_entries (budget_id, category_code, item_key, item_name, year, month, amount, scenario) VALUES
  (1, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'ACTUAL');
```

#### **RN-ENTRY-003: Moneda única CLP**
- `amount` siempre es CLP
- UI formatea: `$12.000`

#### **RN-ENTRY-004: Escenarios mutuamente comparables**
```sql
-- Comparar Plan vs Real de Netflix en Marzo 2026
SELECT 
  b.amount AS presupuestado,
  a.amount AS real,
  (a.amount - b.amount) AS variacion
FROM monthly_entries b
LEFT JOIN monthly_entries a
  ON b.budget_id = a.budget_id
  AND b.category_code = a.category_code
  AND b.item_key = a.item_key
  AND b.year = a.year
  AND b.month = a.month
  AND a.scenario = 'ACTUAL'
WHERE 
  b.scenario = 'BUDGET'
  AND b.budget_id = 1
  AND b.year = 2026
  AND b.month = 3;
```

**Ejemplo de Datos (Presupuesto "Hogar", Marzo 2026):**
```sql
INSERT INTO monthly_entries (budget_id, category_code, item_key, item_name, year, month, amount, scenario, notes) VALUES
  -- INGRESOS - BUDGET
  (1, 'INGRESOS.REMUNERACIONES.SUELDO', 'sueldo_seba', 'Sueldo Seba', 2026, 3, 3500000, 'BUDGET', NULL),
  (1, 'INGRESOS.REMUNERACIONES.SUELDO', 'sueldo_mona', 'Sueldo Mona', 2026, 3, 2800000, 'BUDGET', NULL),
  
  -- INGRESOS - ACTUAL
  (1, 'INGRESOS.REMUNERACIONES.SUELDO', 'sueldo_seba', 'Sueldo Seba', 2026, 3, 3500000, 'ACTUAL', NULL),
  (1, 'INGRESOS.REMUNERACIONES.SUELDO', 'sueldo_mona', 'Sueldo Mona', 2026, 3, 2800000, 'ACTUAL', NULL),
  
  -- GASTOS - BUDGET
  (1, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'BUDGET', NULL),
  (1, 'GASTOS.SERVICIOS.LUZ', 'luz', 'Luz (Enel)', 2026, 3, 45000, 'BUDGET', NULL),
  (1, 'GASTOS.SUPERMERCADO', 'supermercado', 'Supermercado', 2026, 3, 350000, 'BUDGET', NULL),
  
  -- GASTOS - ACTUAL
  (1, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'ACTUAL', NULL),
  (1, 'GASTOS.SERVICIOS.LUZ', 'luz', 'Luz (Enel)', 2026, 3, 48500, 'ACTUAL', 'Mes más frío'),
  (1, 'GASTOS.SUPERMERCADO', 'supermercado', 'Supermercado', 2026, 3, 380000, 'ACTUAL', 'Compramos extra');
```

---

## 3. Relaciones entre Entidades

### 3.1 Diagrama Entidad-Relación

```
┌──────────┐                ┌────────────────┐                ┌──────────┐
│  User    │                │ BudgetAccess   │                │  Budget  │
│──────────│                │────────────────│                │──────────│
│ id (PK)  │◄──────────────►│ id (PK)        │◄──────────────►│ id (PK)  │
│ email    │     1:N        │ user_id (FK)   │     N:1        │ name     │
│ name     │                │ budget_id (FK) │                │ ...      │
└──────────┘                │ role           │                └────┬─────┘
                            └────────────────┘                     │
                                                                   │ 1:N
                                                                   │
                            ┌────────────────────┐                │
                            │  BudgetCategory    │◄───────────────┘
                            │────────────────────│
                       ┌───►│ id (PK)            │
                       │    │ budget_id (FK)     │
                       │    │ code               │
                       │    │ parent_code        │◄──┐
                       │    │ is_leaf            │   │
                       │    └──────────┬─────────┘   │
                       │               │             │
                       │               │ 1:N         │ Self-referencing
                       │               │             │ (tree structure)
                       │               ▼             │
                       │    ┌────────────────────┐   │
                       │    │  MonthlyEntry      │   │
                       │    │────────────────────│   │
                       └────│ id (PK)            │   │
                       1:N  │ budget_id (FK)     │   │
                            │ category_code (FK) │───┘
                            │ year, month        │
                            │ amount             │
                            │ scenario           │
                            └────────────────────┘
```

### 3.2 Matriz de Relaciones

| Desde              | Hacia              | Tipo | Cardinalidad | Descripción                                     |
|--------------------|--------------------|------|--------------|--------------------------------------------------|
| User               | BudgetAccess       | 1:N  | 1 → N        | Un usuario puede tener acceso a N presupuestos   |
| Budget             | BudgetAccess       | 1:N  | 1 → N        | Un presupuesto puede tener N usuarios            |
| Budget             | BudgetCategory     | 1:N  | 1 → N        | Un presupuesto tiene N categorías                |
| BudgetCategory     | BudgetCategory     | 1:N  | 1 → N        | Self-ref: categoría padre tiene N hijos          |
| Budget             | MonthlyEntry       | 1:N  | 1 → N        | Un presupuesto tiene N entradas mensuales        |
| BudgetCategory     | MonthlyEntry       | 1:N  | 1 → N        | Una categoría (hoja) tiene N entradas mensuales  |

### 3.3 Relaciones con Foreign Keys Compuestas

**BudgetCategory → BudgetCategory (self-referencing):**
```sql
FOREIGN KEY (budget_id, parent_code) REFERENCES budget_categories(budget_id, code)
```
**Razón:** El árbol de categorías es **por presupuesto**, no global.

**MonthlyEntry → BudgetCategory:**
```sql
FOREIGN KEY (budget_id, category_code) REFERENCES budget_categories(budget_id, code)
```
**Razón:** Garantiza que la categoría existe en el presupuesto correcto.

---

## 4. Plantilla Base y Clonación

### 4.1 ¿Tabla Separada de Templates?

**Pregunta:** ¿Conviene tener `budget_templates` y `budget_template_categories` como tablas separadas?

**Análisis de Opciones:**

#### **Opción A: Tablas Separadas**
```prisma
model BudgetTemplate {
  id          Int
  name        String  // "Default", "Freelancer", "Simple"
  description String?
  categories  BudgetTemplateCategory[]
}

model BudgetTemplateCategory {
  id         Int
  templateId Int
  code       String
  name       String
  // ... resto de campos
}
```

**Ventajas:**
- ✅ Múltiples plantillas (Default, Freelancer, Simple, etc.)
- ✅ Editable en UI (usuario puede crear sus propias plantillas)
- ✅ Versionable (historial de cambios en plantillas)

**Desventajas:**
- ❌ Complejidad innecesaria para MVP (solo 1 plantilla base)
- ❌ Overhead de gestión de templates
- ❌ Requiere CRUD completo de templates
- ❌ FK adicionales y complejidad de esquema

---

#### **Opción B: Seed/Fixture (SIN tabla)**
```typescript
// seed.ts o fixtures/default-categories.ts
const DEFAULT_CATEGORIES = [
  { code: 'INGRESOS', name: 'Ingresos', parentCode: null, categoryType: 'INCOME', isLeaf: false, order: 1 },
  { code: 'INGRESOS.REMUNERACIONES', name: 'Remuneraciones', parentCode: 'INGRESOS', categoryType: 'INCOME', isLeaf: false, order: 1 },
  { code: 'INGRESOS.REMUNERACIONES.SUELDO', name: 'Sueldo Líquido', parentCode: 'INGRESOS.REMUNERACIONES', categoryType: 'INCOME', isLeaf: true, order: 1 },
  // ... resto
];

export function getDefaultCategories() {
  return DEFAULT_CATEGORIES;
}
```

**Ventajas:**
- ✅ Simplicidad máxima para MVP
- ✅ No requiere tablas adicionales
- ✅ Versión controlada en código (Git)
- ✅ Fácil de modificar (editar archivo)

**Desventajas:**
- ⚠️ Solo 1 plantilla (suficiente para MVP)
- ⚠️ No editable en UI (aceptable para MVP)
- ⚠️ Requiere deploy para cambiar (mitigable con código)

---

**Recomendación: Opción B (Seed/Fixture)**

**Justificación:**
1. MVP requiere **solo 1 plantilla base**
2. Complejidad de templates múltiples NO justificada en fase inicial
3. Si en futuro se necesitan múltiples templates, es fácil migrar a Opción A
4. Código más simple = menos bugs, más rápido

---

### 4.2 Implementación de Clonación

**Algoritmo de Clonación al Crear Presupuesto:**

```typescript
// services/budget-service.ts

import { getDefaultCategories } from '../fixtures/default-categories';

async function createBudget(name: string, userId: number, budgetType: string = 'PERSONAL') {
  // 1. Crear presupuesto
  const budget = await prisma.budget.create({
    data: {
      name,
      budgetType,
    }
  });
  
  // 2. Otorgar acceso al usuario creador
  await prisma.budgetAccess.create({
    data: {
      budgetId: budget.id,
      userId,
      role: 'OWNER'
    }
  });
  
  // 3. Clonar categorías desde plantilla base
  const templateCategories = getDefaultCategories();
  
  for (const cat of templateCategories) {
    await prisma.budgetCategory.create({
      data: {
        budgetId: budget.id,
        code: cat.code,
        name: cat.name,
        parentCode: cat.parentCode,
        categoryType: cat.categoryType,
        isLeaf: cat.isLeaf,
        order: cat.order
      }
    });
  }
  
  // 4. Retornar presupuesto con categorías
  return prisma.budget.findUnique({
    where: { id: budget.id },
    include: {
      categories: { orderBy: { order: 'asc' } },
      access: { include: { user: true } }
    }
  });
}
```

**Fixture de Plantilla Base:**
```typescript
// fixtures/default-categories.ts

export interface CategorySeed {
  code: string;
  name: string;
  parentCode: string | null;
  categoryType: 'INCOME' | 'EXPENSE' | 'SAVINGS';
  isLeaf: boolean;
  order: number;
}

export function getDefaultCategories(): CategorySeed[] {
  return [
    // ══════════════════════════════════════════════════════════
    // INGRESOS
    // ══════════════════════════════════════════════════════════
    {
      code: 'INGRESOS',
      name: 'Ingresos',
      parentCode: null,
      categoryType: 'INCOME',
      isLeaf: false,
      order: 1
    },
    {
      code: 'INGRESOS.REMUNERACIONES',
      name: 'Remuneraciones',
      parentCode: 'INGRESOS',
      categoryType: 'INCOME',
      isLeaf: false,
      order: 1
    },
    {
      code: 'INGRESOS.REMUNERACIONES.SUELDO',
      name: 'Sueldo Líquido',
      parentCode: 'INGRESOS.REMUNERACIONES',
      categoryType: 'INCOME',
      isLeaf: true,
      order: 1
    },
    {
      code: 'INGRESOS.REMUNERACIONES.BONOS',
      name: 'Bonos',
      parentCode: 'INGRESOS.REMUNERACIONES',
      categoryType: 'INCOME',
      isLeaf: true,
      order: 2
    },
    
    // ══════════════════════════════════════════════════════════
    // GASTOS
    // ══════════════════════════════════════════════════════════
    {
      code: 'GASTOS',
      name: 'Gastos',
      parentCode: null,
      categoryType: 'EXPENSE',
      isLeaf: false,
      order: 2
    },
    {
      code: 'GASTOS.SUSCRIPCIONES',
      name: 'Suscripciones',
      parentCode: 'GASTOS',
      categoryType: 'EXPENSE',
      isLeaf: false,
      order: 1
    },
    {
      code: 'GASTOS.SUSCRIPCIONES.NETFLIX',
      name: 'Netflix',
      parentCode: 'GASTOS.SUSCRIPCIONES',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 1
    },
    {
      code: 'GASTOS.SUSCRIPCIONES.SPOTIFY',
      name: 'Spotify',
      parentCode: 'GASTOS.SUSCRIPCIONES',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 2
    },
    {
      code: 'GASTOS.SERVICIOS',
      name: 'Servicios Básicos',
      parentCode: 'GASTOS',
      categoryType: 'EXPENSE',
      isLeaf: false,
      order: 2
    },
    {
      code: 'GASTOS.SERVICIOS.LUZ',
      name: 'Luz (Enel)',
      parentCode: 'GASTOS.SERVICIOS',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 1
    },
    {
      code: 'GASTOS.SERVICIOS.AGUA',
      name: 'Agua (Aguas Andinas)',
      parentCode: 'GASTOS.SERVICIOS',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 2
    },
    {
      code: 'GASTOS.SERVICIOS.GAS',
      name: 'Gas (Lipigas)',
      parentCode: 'GASTOS.SERVICIOS',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 3
    },
    {
      code: 'GASTOS.SUPERMERCADO',
      name: 'Supermercado',
      parentCode: 'GASTOS',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 3
    },
    {
      code: 'GASTOS.OBLIGACIONES',
      name: 'Obligaciones',
      parentCode: 'GASTOS',
      categoryType: 'EXPENSE',
      isLeaf: false,
      order: 4
    },
    {
      code: 'GASTOS.HIPOTECARIO',
      name: 'Hipotecario',
      parentCode: 'GASTOS',
      categoryType: 'EXPENSE',
      isLeaf: true,
      order: 5
    },
    
    // ══════════════════════════════════════════════════════════
    // AHORROS
    // ══════════════════════════════════════════════════════════
    {
      code: 'AHORROS',
      name: 'Ahorros',
      parentCode: null,
      categoryType: 'SAVINGS',
      isLeaf: false,
      order: 3
    },
    {
      code: 'AHORROS.AHORRO_MENSUAL',
      name: 'Ahorro Mensual',
      parentCode: 'AHORROS',
      categoryType: 'SAVINGS',
      isLeaf: true,
      order: 1
    }
  ];
}
```

---

## 5. Constraints y Validaciones

### 5.1 Constraints de Base de Datos

#### **Constraint 1: Solo hojas tienen montos**
```sql
-- Trigger (PostgreSQL) o validación en app (SQLite no soporta triggers complejos)
CREATE OR REPLACE FUNCTION validate_leaf_category()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM budget_categories 
    WHERE budget_id = NEW.budget_id 
      AND code = NEW.category_code 
      AND is_leaf = false
  ) THEN
    RAISE EXCEPTION 'No se pueden crear entradas en categorías grupo (is_leaf=false)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_leaf_before_insert
BEFORE INSERT ON monthly_entries
FOR EACH ROW EXECUTE FUNCTION validate_leaf_category();
```

**Implementación en Código (recomendado para MVP):**
```typescript
// En service o middleware
async function validateLeafCategory(budgetId: number, categoryCode: string) {
  const category = await prisma.budgetCategory.findUnique({
    where: { budgetId_code: { budgetId, code: categoryCode } }
  });
  
  if (!category) {
    throw new Error(`Categoría ${categoryCode} no existe en presupuesto ${budgetId}`);
  }
  
  if (!category.isLeaf) {
    throw new Error(`Categoría ${categoryCode} es grupo, solo hojas pueden tener montos`);
  }
}
```

---

#### **Constraint 2: Mes válido (1-12)**
```sql
ALTER TABLE monthly_entries
ADD CONSTRAINT check_valid_month
CHECK (month >= 1 AND month <= 12);
```

---

#### **Constraint 3: Año razonable**
```sql
ALTER TABLE monthly_entries
ADD CONSTRAINT check_valid_year
CHECK (year >= 2000 AND year <= 2100);
```

---

#### **Constraint 4: Scenario válido**
```sql
ALTER TABLE monthly_entries
ADD CONSTRAINT check_valid_scenario
CHECK (scenario IN ('BUDGET', 'ACTUAL'));
```

---

#### **Constraint 5: Category Type válido**
```sql
ALTER TABLE budget_categories
ADD CONSTRAINT check_valid_category_type
CHECK (category_type IN ('INCOME', 'EXPENSE', 'SAVINGS'));
```

---

#### **Constraint 6: Budget Type válido**
```sql
ALTER TABLE budgets
ADD CONSTRAINT check_valid_budget_type
CHECK (budget_type IN ('PERSONAL', 'SHARED'));
```

---

#### **Constraint 7: Role válido**
```sql
ALTER TABLE budget_access
ADD CONSTRAINT check_valid_role
CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER'));
```
*Nota: MVP solo usa OWNER, pero ya queda preparado para futuro.*

---

### 5.2 Validaciones de Aplicación

#### **Validación 1: Categoría pertenece al presupuesto**
```typescript
async function validateCategoryBelongsToBudget(budgetId: number, categoryCode: string) {
  const category = await prisma.budgetCategory.findUnique({
    where: { budgetId_code: { budgetId, code: categoryCode } }
  });
  
  if (!category) {
    throw new Error(`Categoría ${categoryCode} no pertenece al presupuesto ${budgetId}`);
  }
}
```

---

#### **Validación 2: Usuario tiene acceso al presupuesto**
```typescript
async function validateUserHasAccess(userId: number, budgetId: number, requiredRole: string = 'OWNER') {
  const access = await prisma.budgetAccess.findUnique({
    where: { budgetId_userId: { budgetId, userId } }
  });
  
  if (!access) {
    throw new Error(`Usuario ${userId} no tiene acceso al presupuesto ${budgetId}`);
  }
  
  // En MVP todos son OWNER, pero ya queda preparado
  if (access.role !== requiredRole && requiredRole !== 'VIEWER') {
    throw new Error(`Usuario requiere rol ${requiredRole}`);
  }
}
```

---

#### **Validación 3: No eliminar categoría con entries**
```typescript
async function validateCategoryHasNoEntries(budgetId: number, categoryCode: string) {
  const count = await prisma.monthlyEntry.count({
    where: { budgetId, categoryCode }
  });
  
  if (count > 0) {
    throw new Error(
      `No se puede eliminar categoría ${categoryCode}: tiene ${count} entradas asociadas. ` +
      `Elimina primero las entradas o usa soft-delete.`
    );
  }
}
```

---

## 6. Recomendación Final de Naming

### 6.1 Convenciones de Naming

#### **Nombres de Tablas:**
- ✅ **snake_case** plural: `users`, `budgets`, `budget_access`, `budget_categories`, `monthly_entries`
- ✅ Razón: Consistente con estándares SQL

#### **Nombres de Campos:**
- ✅ **snake_case**: `budget_id`, `category_code`, `is_leaf`, `created_at`
- ✅ Prisma mapping: `@map("snake_case")` para compatibilidad

#### **Nombres de Modelos Prisma:**
- ✅ **PascalCase** singular: `User`, `Budget`, `BudgetAccess`, `BudgetCategory`, `MonthlyEntry`
- ✅ Razón: Convención TypeScript/JavaScript

#### **Nombres de Relaciones:**
- ✅ **camelCase** plural: `budgetAccess`, `categories`, `monthlyEntries`
- ✅ Singular para 1:1: `budget`, `category`, `user`

---

### 6.2 Tabla Completa de Naming

| Concepto            | Tabla (DB)          | Modelo (Prisma)    | Relación            | Campo FK           |
|---------------------|---------------------|--------------------|---------------------|--------------------|
| Usuario             | `users`             | `User`             | `budgetAccess`      | -                  |
| Presupuesto         | `budgets`           | `Budget`           | `access`, `categories`, `monthlyEntries` | -   |
| Acceso compartido   | `budget_access`     | `BudgetAccess`     | `budget`, `user`    | `budget_id`, `user_id` |
| Categoría           | `budget_categories` | `BudgetCategory`   | `budget`, `parent`, `children`, `monthlyEntries` | `budget_id`, `parent_code` |
| Entrada mensual     | `monthly_entries`   | `MonthlyEntry`     | `budget`, `category`| `budget_id`, `category_code` |

---

## 7. Schema Conceptual Final (Prisma)

```prisma
// ════════════════════════════════════════════════════════════════
// FINANZAPP MVP - SCHEMA CONCEPTUAL FINAL
// ════════════════════════════════════════════════════════════════

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // O "postgresql" en producción
  url      = env("DATABASE_URL")
}

// ────────────────────────────────────────────────────────────────
// 1. USERS
// ────────────────────────────────────────────────────────────────

model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  avatar      String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  budgetAccess BudgetAccess[]
  
  @@map("users")
}

// ────────────────────────────────────────────────────────────────
// 2. BUDGETS
// ────────────────────────────────────────────────────────────────

model Budget {
  id            Int      @id @default(autoincrement())
  name          String
  description   String?
  budgetType    String   @default("PERSONAL") @map("budget_type")
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  access         BudgetAccess[]   @relation("BudgetToAccess")
  categories     BudgetCategory[] @relation("BudgetToCategories")
  monthlyEntries MonthlyEntry[]   @relation("BudgetToEntries")
  
  @@map("budgets")
}

// ────────────────────────────────────────────────────────────────
// 3. BUDGET ACCESS (N:M entre Users y Budgets)
// ────────────────────────────────────────────────────────────────

model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("OWNER")
  createdAt DateTime @default(now()) @map("created_at")
  
  budget Budget @relation("BudgetToAccess", fields: [budgetId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, userId])
  @@index([userId])
  @@index([budgetId])
  @@map("budget_access")
}

// ────────────────────────────────────────────────────────────────
// 4. BUDGET CATEGORIES (Árbol jerárquico por presupuesto)
// ────────────────────────────────────────────────────────────────

model BudgetCategory {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  code         String
  name         String
  parentCode   String?  @map("parent_code")
  categoryType String   @map("category_type")
  isLeaf       Boolean  @default(true) @map("is_leaf")
  order        Int      @default(0)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  budget   Budget           @relation("BudgetToCategories", fields: [budgetId], references: [id], onDelete: Cascade)
  parent   BudgetCategory?  @relation("CategoryTree", fields: [budgetId, parentCode], references: [budgetId, code], onDelete: NoAction, onUpdate: NoAction)
  children BudgetCategory[] @relation("CategoryTree")
  
  monthlyEntries MonthlyEntry[] @relation("CategoryToEntries")
  
  @@unique([budgetId, code])
  @@index([budgetId, parentCode])
  @@index([budgetId, categoryType])
  @@map("budget_categories")
}

// ────────────────────────────────────────────────────────────────
// 5. MONTHLY ENTRIES (Entradas mensuales - Plan y Real)
// ────────────────────────────────────────────────────────────────

model MonthlyEntry {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  categoryCode String   @map("category_code")
  itemKey      String   @map("item_key")
  itemName     String   @map("item_name")
  year         Int
  month        Int
  amount       Float
  scenario     String   @default("BUDGET")
  notes        String?
  metadata     String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  budget   Budget         @relation("BudgetToEntries", fields: [budgetId], references: [id], onDelete: Cascade)
  category BudgetCategory @relation("CategoryToEntries", fields: [budgetId, categoryCode], references: [budgetId, code])
  
  @@unique([budgetId, scenario, categoryCode, itemKey, year, month])
  @@index([budgetId, year, month, scenario])
  @@index([budgetId, categoryCode, scenario])
  @@map("monthly_entries")
}
```

---

## 8. Queries Clave del MVP

### 8.1 Obtener Presupuestos de un Usuario

```typescript
const userBudgets = await prisma.budget.findMany({
  where: {
    access: {
      some: { userId: currentUserId }
    }
  },
  include: {
    access: {
      include: { user: true }
    }
  }
});
```

---

### 8.2 Obtener Categorías de un Presupuesto (Árbol Completo)

```typescript
const categories = await prisma.budgetCategory.findMany({
  where: { budgetId },
  orderBy: { order: 'asc' }
});

// Construir árbol en memoria
function buildTree(categories: BudgetCategory[], parentCode: string | null = null) {
  return categories
    .filter(cat => cat.parentCode === parentCode)
    .map(cat => ({
      ...cat,
      children: buildTree(categories, cat.code)
    }));
}

const tree = buildTree(categories);
```

---

### 8.3 Obtener Entradas Mensuales (Plan vs Real)

```typescript
const entries = await prisma.monthlyEntry.findMany({
  where: {
    budgetId,
    year: 2026,
    month: 3
  },
  include: {
    category: true
  }
});

// Agrupar por itemKey
const grouped = entries.reduce((acc, entry) => {
  const key = `${entry.categoryCode}:${entry.itemKey}`;
  if (!acc[key]) {
    acc[key] = { budget: null, actual: null, categoryName: entry.category.name };
  }
  if (entry.scenario === 'BUDGET') {
    acc[key].budget = entry.amount;
  } else {
    acc[key].actual = entry.amount;
  }
  return acc;
}, {});
```

---

### 8.4 Calcular Balance de un Presupuesto (Mes Específico)

```typescript
async function getMonthlyBalance(budgetId: number, year: number, month: number) {
  const entries = await prisma.monthlyEntry.findMany({
    where: { budgetId, year, month },
    include: { category: true }
  });
  
  let budgetIncome = 0, budgetExpense = 0, budgetSavings = 0;
  let actualIncome = 0, actualExpense = 0, actualSavings = 0;
  
  entries.forEach(entry => {
    const amount = entry.amount;
    const type = entry.category.categoryType;
    
    if (entry.scenario === 'BUDGET') {
      if (type === 'INCOME') budgetIncome += amount;
      else if (type === 'EXPENSE') budgetExpense += amount;
      else if (type === 'SAVINGS') budgetSavings += amount;
    } else {
      if (type === 'INCOME') actualIncome += amount;
      else if (type === 'EXPENSE') actualExpense += amount;
      else if (type === 'SAVINGS') actualSavings += amount;
    }
  });
  
  return {
    budget: {
      income: budgetIncome,
      expense: budgetExpense,
      savings: budgetSavings,
      balance: budgetIncome - budgetExpense - budgetSavings
    },
    actual: {
      income: actualIncome,
      expense: actualExpense,
      savings: actualSavings,
      balance: actualIncome - actualExpense - actualSavings
    }
  };
}
```

---

## 9. Resumen y Próximos Pasos

### 9.1 Decisiones Finales Confirmadas

✅ **5 tablas principales:** `users`, `budgets`, `budget_access`, `budget_categories`, `monthly_entries`

✅ **NO tablas de template:** Plantilla base implementada como seed/fixture

✅ **Categorías por presupuesto:** Cada presupuesto tiene su propio árbol

✅ **Clonación al crear:** Función `createBudget()` clona categorías de plantilla

✅ **Solo hojas tienen monto:** Validación en código + futura DB constraint

✅ **Naming consistente:** snake_case en DB, PascalCase en Prisma, camelCase en relaciones

### 9.2 Checklist Pre-Implementación

- [ ] Revisar schema Prisma propuesto
- [ ] Validar fixture de plantilla base con stakeholders (Seba, Mona)
- [ ] Definir estructura de proyecto (carpetas services/, fixtures/, etc.)
- [ ] Preparar seeds iniciales (usuarios, primeros presupuestos)
- [ ] Definir estrategia de testing (unit + integration)

### 9.3 NO Implementar Todavía

- ❌ No generar migración Prisma
- ❌ No crear endpoints API
- ❌ No desarrollar UI
- ❌ No escribir código de producción

**Razón:** Este documento es solo especificación. Esperar aprobación antes de implementar.

---

**FIN DEL DOCUMENTO**

**Versión:** 1.0  
**Estado:** Listo para revisión y aprobación  
**Siguiente Paso:** Validar con stakeholders → Aprobar → Implementar
