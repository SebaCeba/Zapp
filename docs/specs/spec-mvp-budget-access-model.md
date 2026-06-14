# Especificación MVP: Modelo de Presupuestos con Acceso Compartido

**Fecha:** 2026-03-15  
**Estado:** Especificación Técnica - NO IMPLEMENTAR  
**Objetivo:** Definir el modelo de datos MVP exacto para soportar múltiples presupuestos con acceso compartido

---

## 1. Contexto y Decisiones Funcionales

### Casos de Uso Específicos
El sistema debe soportar los siguientes presupuestos:
- **Hogar**: Presupuesto compartido entre Seba y Mona (gastos del hogar)
- **Seba**: Presupuesto personal de Seba (gastos individuales)
- **Mona**: Presupuesto personal de Mona (gastos individuales, opcional)

### Decisiones Técnicas ya Tomadas

1. **Múltiples presupuestos por usuario:**
   - Un usuario puede tener acceso a varios presupuestos
   - Ejemplos: Seba accede a "Hogar" y "Seba"; Mona accede a "Hogar" y "Mona"

2. **Transacciones separadas:**
   - Los presupuestos NO comparten transacciones
   - Cada transacción pertenece a un solo presupuesto
   - No hay "asignación" de gastos entre presupuestos (simplificación MVP)

3. **Jerarquía global de categorías:**
   - Las categorías NO dependen del presupuesto
   - Categorías son globales y compartidas
   - Un presupuesto puede usar cualquier categoría
   - Ejemplo: "Supermercado" existe como categoría única, usable en Hogar o Seba

4. **Presupuestos compartidos:**
   - Un presupuesto puede tener varios usuarios con acceso
   - Control de acceso básico (owner/editor/viewer)
   - No hay invitaciones por correo ni flujo complejo de sharing

5. **Plan vs Real (futuro):**
   - Considerar desde ya un campo `scenario` para diferenciar:
     - `BUDGET` (presupuesto/plan)
     - `ACTUAL` (real/ejecutado)
   - Esto evita tener tablas separadas `PresupuestoX` y `ActualX`

---

## 2. Modelo Actual Resumido

### Estructura Actual (Problemática)
```
NO EXISTE:
- Tabla User
- Tabla Budget
- Concepto de acceso compartido

EXISTEN (fragmentadas):
- PresupuestoIngreso, PresupuestoServicioBasico, PresupuestoAhorro → por año + mes
- ActualEntry → datos reales por año/mes/categoría
- TenpoPurchase, TenpoPayment → compras/pagos TC sin FK a presupuesto
- UtilityTransaction → transacciones de servicios básicos
- Catálogos: IngresoBase, ServicioBasico, Ahorro → globales
```

**Problemas:**
- ❌ Sin concepto de usuario o multi-usuario
- ❌ Sin presupuesto como entidad raíz
- ❌ Fragmentación: N tablas de presupuesto especializadas
- ❌ No permite presupuestos compartidos
- ❌ No permite comparar Plan vs Real de forma estructurada

---

## 3. Modelo Recomendado MVP

### 3.1 Entidades Core

#### **User** (Usuarios del sistema)
```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  name        String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  budgetAccess BudgetAccess[]
  
  @@map("users")
}
```

**Decisiones:**
- ❌ **NO** password: sin autenticación compleja en MVP
- ❌ **NO** roles globales: solo permisos por presupuesto
- ✅ **Simpleza:** email + nombre suficiente para MVP

---

#### **Budget** (Presupuestos)
```prisma
model Budget {
  id          Int      @id @default(autoincrement())
  name        String   // "Hogar", "Seba", "Mona"
  description String?
  budgetType  String   @default("PERSONAL") @map("budget_type") // "PERSONAL" | "SHARED"
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  access       BudgetAccess[]
  transactions Transaction[]
  
  @@map("budgets")
}
```

**Decisiones:**
- ✅ `budgetType`: Identifica si es personal o compartido (informativo)
- ✅ `isActive`: Permite "archivar" presupuestos sin eliminarlos
- ❌ **NO** color, icon, etc.: simplificación MVP
- ❌ **NO** budget owner único: el owner se define en BudgetAccess

---

#### **BudgetAccess** (Acceso a Presupuestos)
```prisma
model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("VIEWER") // "OWNER" | "EDITOR" | "VIEWER"
  createdAt DateTime @default(now()) @map("created_at")
  
  budget    Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, userId])
  @@index([userId])
  @@map("budget_access")
}
```

**Roles MVP:**
- **OWNER:** Puede editar presupuesto, gestionar acceso, eliminar presupuesto
- **EDITOR:** Puede editar transacciones y presupuesto (MVP: igual que OWNER sin gestionar acceso)
- **VIEWER:** Solo lectura (MVP: dejar fuera inicialmente, implementar solo OWNER)

**Decisiones:**
- ✅ N:M entre Budget y User
- ✅ Un presupuesto puede tener varios OWNER (simplificación MVP)
- ⚠️ **MVP mínimo:** Solo implementar role="OWNER", dejar EDITOR/VIEWER para futuro

---

#### **Category** (Categorías Globales)
```prisma
model Category {
  id           Int      @id @default(autoincrement())
  code         String   @unique // "INGRESOS", "GASTOS.SUSCRIPCIONES", "GASTOS.SERVICIOS"
  name         String              // "Ingresos", "Suscripciones", "Servicios Básicos"
  parentCode   String?  @map("parent_code")
  parent       Category? @relation("CategoryTree", fields: [parentCode], references: [code], onDelete: NoAction, onUpdate: NoAction)
  children     Category[] @relation("CategoryTree")
  categoryType String   @map("category_type") // "INCOME" | "EXPENSE" | "SAVINGS"
  isSystem     Boolean  @default(false) @map("is_system") // true para categorías base
  isGroup      Boolean  @default(false) @map("is_group")  // true si tiene hijos
  order        Int      @default(0)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  transactions Transaction[]
  
  @@index([parentCode])
  @@map("categories")
}
```

**Decisiones:**
- ✅ **Jerarquía global:** Categorías compartidas entre todos los presupuestos
- ✅ **Árbol recursivo:** Soporta N niveles (prácticamente limitado a 3-4)
- ✅ `code` dot-notation: Facilita queries jerárquicas (WHERE code LIKE 'GASTOS.%')
- ✅ `isSystem`: Categorías base (INGRESOS, GASTOS, AHORROS) no se pueden eliminar
- ❌ **NO** budgetId: Las categorías son globales, no específicas de un presupuesto

**Categorías del Sistema (seed inicial):**
```
INGRESOS (isSystem=true, isGroup=true)
GASTOS (isSystem=true, isGroup=true)
  GASTOS.SUSCRIPCIONES (isSystem=true, isGroup=true)
  GASTOS.SERVICIOS (isSystem=true, isGroup=true)
  GASTOS.SUPERMERCADO (isSystem=true, isGroup=false)
  GASTOS.OBLIGACIONES (isSystem=true, isGroup=true)
  GASTOS.HIPOTECARIO (isSystem=true, isGroup=false)
AHORROS (isSystem=true, isGroup=true)
```

---

#### **Transaction** (Transacciones Unificadas)
```prisma
model Transaction {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  categoryCode String   @map("category_code")
  category     Category @relation(fields: [categoryCode], references: [code])
  
  itemKey      String   @map("item_key") // "sueldo_liquido", "netflix", "luz_marzo"
  itemName     String   @map("item_name") // "Sueldo Líquido", "Netflix", "Luz (ENEL)"
  
  year         Int
  month        Int      // 1-12
  amount       Float    // CLP (o moneda base)
  
  scenario     String   @default("BUDGET") // "BUDGET" | "ACTUAL"
  
  notes        String?
  metadata     String?  // JSON string para extensibilidad
  
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  @@unique([budgetId, scenario, categoryCode, itemKey, year, month])
  @@index([budgetId, year, month, scenario])
  @@index([budgetId, categoryCode, scenario])
  @@map("transactions")
}
```

**Decisiones Clave:**

1. **Tabla unificada:** Reemplaza todas las tablas fragmentadas
   - `PresupuestoIngreso` → `Transaction(scenario=BUDGET, categoryCode=INGRESOS)`
   - `ActualEntry` → `Transaction(scenario=ACTUAL, categoryCode=...)`
   - `TenpoPurchase` → `Transaction(scenario=ACTUAL, categoryCode=GASTOS.TC, metadata={...})`

2. **Campo `scenario`:**
   - ✅ `BUDGET`: Transacción es presupuesto/plan
   - ✅ `ACTUAL`: Transacción es real/ejecutada
   - Permite comparar Plan vs Real con misma estructura
   - Evita duplicación de tablas

3. **Clave única compuesta:**
   - `(budgetId, scenario, categoryCode, itemKey, year, month)`
   - Permite tener presupuesto Y real del mismo item en el mismo mes
   - Ejemplo: "Netflix" en "Hogar" puede tener:
     - `BUDGET: $12,000` (presupuestado)
     - `ACTUAL: $12,000` (pagado)

4. **Metadata extensible:**
   - Campo JSON para datos específicos de tipo de transacción
   - Ejemplo Tenpo: `{ "merchant": "UBER", "installments": 3, "purchaseId": 123 }`
   - Ejemplo Utilidad: `{ "provider": "ENEL", "invoiceNumber": "123456" }`

---

### 3.2 Relaciones entre Entidades

```
User (1) ←→ (N) BudgetAccess (N) ←→ (1) Budget
  └─ Un usuario puede tener acceso a varios presupuestos
  └─ Un presupuesto puede tener varios usuarios con acceso

Budget (1) ←→ (N) Transaction
  └─ Un presupuesto tiene muchas transacciones
  └─ Una transacción pertenece a un solo presupuesto

Category (1) ←→ (N) Transaction
  └─ Una categoría puede usarse en muchas transacciones
  └─ Una transacción pertenece a una sola categoría

Category (1) ←→ (N) Category (parent-child)
  └─ Una categoría puede tener categoría padre
  └─ Una categoría puede tener varias categorías hijas
```

**Diagrama Simplificado:**
```
┌─────────┐         ┌──────────────┐         ┌────────┐
│  User   │◄───N:N──┤ BudgetAccess ├──N:N───►│ Budget │
└─────────┘         └──────────────┘         └────┬───┘
                                                   │
                                                   │ 1:N
                                                   │
                                              ┌────▼────────┐
                                              │ Transaction │
                                              └────┬────────┘
                                                   │ N:1
                                                   │
                                              ┌────▼─────┐
                                              │ Category │
                                              └──────────┘
```

---

## 4. Ejemplo Concreto: Hogar / Seba / Mona

### 4.1 Usuarios
```sql
INSERT INTO users (id, email, name) VALUES
  (1, 'seba@example.com', 'Seba'),
  (2, 'mona@example.com', 'Mona');
```

### 4.2 Presupuestos
```sql
INSERT INTO budgets (id, name, budget_type) VALUES
  (1, 'Hogar', 'SHARED'),
  (2, 'Seba', 'PERSONAL'),
  (3, 'Mona', 'PERSONAL');
```

### 4.3 Acceso a Presupuestos
```sql
-- Seba tiene acceso a "Hogar" y "Seba"
INSERT INTO budget_access (budget_id, user_id, role) VALUES
  (1, 1, 'OWNER'), -- Seba es owner de Hogar
  (2, 1, 'OWNER'); -- Seba es owner de Seba

-- Mona tiene acceso a "Hogar" y "Mona"
INSERT INTO budget_access (budget_id, user_id, role) VALUES
  (1, 2, 'OWNER'), -- Mona es owner de Hogar (compartido)
  (3, 2, 'OWNER'); -- Mona es owner de Mona
```

### 4.4 Categorías (globales)
```sql
INSERT INTO categories (code, name, category_type, is_system, is_group) VALUES
  ('INGRESOS', 'Ingresos', 'INCOME', true, true),
  ('GASTOS', 'Gastos', 'EXPENSE', true, true),
  ('GASTOS.SUPERMERCADO', 'Supermercado', 'EXPENSE', true, false),
  ('GASTOS.SUSCRIPCIONES', 'Suscripciones', 'EXPENSE', true, true),
  ('GASTOS.SUSCRIPCIONES.NETFLIX', 'Netflix', 'EXPENSE', false, false),
  ('AHORROS', 'Ahorros', 'SAVINGS', true, true);
```

### 4.5 Transacciones

#### Presupuesto Hogar (compartido Seba y Mona)
```sql
-- Presupuesto: Supermercado en Hogar
INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
VALUES (1, 'GASTOS.SUPERMERCADO', 'super_marzo', 'Supermercado Marzo', 2026, 3, 350000, 'BUDGET');

-- Real: Supermercado en Hogar
INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
VALUES (1, 'GASTOS.SUPERMERCADO', 'super_marzo', 'Supermercado Marzo', 2026, 3, 380000, 'ACTUAL');
```

#### Presupuesto Personal Seba
```sql
-- Presupuesto: Netflix en Seba (personal)
INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
VALUES (2, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'BUDGET');

-- Real: Netflix en Seba
INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
VALUES (2, 'GASTOS.SUSCRIPCIONES.NETFLIX', 'netflix', 'Netflix', 2026, 3, 12000, 'ACTUAL');
```

#### Presupuesto Personal Mona
```sql
-- Presupuesto: Ahorro en Mona (personal)
INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
VALUES (3, 'AHORROS', 'ahorro_emergencia', 'Ahorro Emergencias', 2026, 3, 100000, 'BUDGET');
```

---

## 5. Tablas Actuales: Mantener, Migrar o Deprecar

### 5.1 Tablas a MIGRAR a `Transaction`

| Tabla Actual                    | Categoría Destino          | Migración                                  |
|--------------------------------|----------------------------|--------------------------------------------|
| `PresupuestoIngreso`           | `INGRESOS`                 | → `Transaction(scenario=BUDGET)`           |
| `PresupuestoServicioBasico`    | `GASTOS.SERVICIOS`         | → `Transaction(scenario=BUDGET)`           |
| `PresupuestoAhorro`            | `AHORROS`                  | → `Transaction(scenario=BUDGET)`           |
| `SupermercadoPresupuesto`      | `GASTOS.SUPERMERCADO`      | → `Transaction(scenario=BUDGET)`           |
| `ActualEntry`                  | Varias (según category)    | → `Transaction(scenario=ACTUAL)`           |
| `TenpoPurchase`                | `GASTOS.TC` (nueva cat.)   | → `Transaction(scenario=ACTUAL, metadata)` |
| `TenpoPayment`                 | `GASTOS.PAGO_TC`           | → `Transaction(scenario=ACTUAL, metadata)` |
| `UtilityTransaction`           | `GASTOS.SERVICIOS`         | → `Transaction(scenario=ACTUAL, metadata)` |

**Transformación Ejemplo:**
```typescript
// PresupuestoIngreso (antes)
{
  id: 1,
  ingresoId: 5,
  anio: 2026,
  enero: 3500000,
  febrero: 3500000,
  // ...
}

// Transaction (después) - UNA fila por mes
{
  budgetId: 1, // "Hogar"
  categoryCode: 'INGRESOS',
  itemKey: 'ingreso:5',
  itemName: 'Sueldo Líquido',
  year: 2026,
  month: 1,
  amount: 3500000,
  scenario: 'BUDGET'
}
```

**Ventajas de la migración:**
- ✅ Modelo unificado: 1 tabla en lugar de 8+
- ✅ Plan vs Real en misma estructura
- ✅ Fácil agregar nuevas categorías (no requiere nueva tabla)
- ✅ Queries consistentes

**Desventajas:**
- ⚠️ Pérdida de tipado fuerte (todos los campos en JSON metadata)
- ⚠️ Migración compleja (normalizar de 12 columnas mensuales a 12 filas)

---

### 5.2 Tablas a MANTENER (sin cambios inmediatos)

| Tabla                     | Razón                                                      |
|---------------------------|------------------------------------------------------------|
| `Subscription`            | Lógica de periodicidad compleja (mensual/anual/trimestral) |
| `Obligacion`              | Lógica de cuotas y fechas específica                       |
| `MortgagePayment`         | Datos hipotecarios específicos (UF, amortización, etc.)    |
| `MortgageInsurance`       | Seguros hipotecarios con lógica específica                 |
| `Bono`, `RepartoBono`     | Lógica de bonos y repartos específica                      |
| `GoogleAuthToken`         | Autenticación OAuth (independiente de presupuesto)         |
| `TenpoEmail`              | Emails originales de Tenpo (auditoría)                     |
| `MerchantCategory`        | Categorización de comercios (independiente)                |
| `TcBillingConfig`         | Configuración de ciclos de facturación TC                  |
| `SupuestoAnual`           | Supuestos de conversión UF/CLP                             |

**Decisión:**
- Mantener estas tablas en MVP
- Generar `Transaction` a partir de ellas cuando se requiera presupuesto consolidado
- Ejemplo: `Subscription` → genera `Transaction` mensual al consultar presupuesto

---

### 5.3 Tablas a DEPRECAR (eliminar eventualmente)

| Tabla                         | Razón                                  | Cuándo eliminar                          |
|-------------------------------|----------------------------------------|------------------------------------------|
| `IngresoBase`                 | Catálogo redundante con `Category`     | Después de migrar a `Category`           |
| `ServicioBasico`              | Catálogo redundante con `Category`     | Después de migrar a `Category`           |
| `Ahorro`                      | Catálogo redundante con `Category`     | Después de migrar a `Category`           |

**Estrategia:**
1. **MVP:** Mantener catálogos + crear `Category` en paralelo
2. **Post-MVP:** Migrar catálogos a `Category`
3. **Futuro:** Eliminar `IngresoBase`, `ServicioBasico`, `Ahorro`

---

## 6. Campo `scenario`: Presupuesto vs Real

### 6.1 Ventajas de `scenario` desde MVP

**Justificación:**
- ✅ **Evita duplicación de tablas:** No necesitas `PresupuestoX` y `ActualX`
- ✅ **Comparabilidad directa:** Plan vs Real con mismo modelo
- ✅ **Queries simples:**
  ```sql
  -- Obtener presupuesto
  SELECT * FROM transactions WHERE scenario = 'BUDGET' AND year = 2026 AND month = 3;
  
  -- Obtener real
  SELECT * FROM transactions WHERE scenario = 'ACTUAL' AND year = 2026 AND month = 3;
  
  -- Comparar Plan vs Real
  SELECT 
    budget.amount as budgeted,
    actual.amount as actual,
    (actual.amount - budget.amount) as variance
  FROM transactions budget
  LEFT JOIN transactions actual
    ON budget.budget_id = actual.budget_id
    AND budget.category_code = actual.category_code
    AND budget.item_key = actual.item_key
    AND budget.year = actual.year
    AND budget.month = actual.month
    AND actual.scenario = 'ACTUAL'
  WHERE budget.scenario = 'BUDGET';
  ```

### 6.2 Valores de `scenario`

```typescript
enum TransactionScenario {
  BUDGET = 'BUDGET',  // Presupuesto/Plan
  ACTUAL = 'ACTUAL'   // Real/Ejecutado
}
```

**Futuro (Post-MVP):**
- `FORECAST`: Proyección/Forecast
- `REVISED`: Presupuesto revisado
- (No implementar en MVP)

---

## 7. Permisos MVP: Owner / Editor / Viewer

### 7.1 Roles Propuestos

| Role     | Permisos                                                                 |
|----------|--------------------------------------------------------------------------|
| `OWNER`  | Full control: editar presupuesto, transacciones, gestionar acceso, eliminar |
| `EDITOR` | Editar transacciones y presupuesto, NO puede gestionar acceso              |
| `VIEWER` | Solo lectura (consultar presupuesto y transacciones)                       |

### 7.2 Recomendación MVP

**Versión Mínima (MVP):**
- ✅ **Solo implementar `OWNER`**
- Todos los usuarios con acceso son `OWNER` por defecto
- No hay diferenciación de permisos
- Simplifica lógica de autorización

**Justificación:**
- Caso de uso principal: Hogar compartido entre Seba y Mona (ambos necesitan editar)
- Presupuestos personales: solo un usuario (Seba o Mona)
- No hay necesidad de VIEWER en MVP (no hay terceros consultando)

**Versión Recomendada (Post-MVP):**
- ✅ Implementar `OWNER` + `EDITOR`
- `OWNER`: puede agregar/quitar otros usuarios
- `EDITOR`: puede editar pero no gestionar acceso
- Dejar `VIEWER` para futuro (caso de uso: invitar contador, asesor financiero)

### 7.3 Implementación MVP: Solo OWNER

```prisma
model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("OWNER") // Solo "OWNER" en MVP
  createdAt DateTime @default(now()) @map("created_at")
  
  // ... relations
}
```

**Backend Middleware (simplificado):**
```typescript
async function checkBudgetAccess(userId: number, budgetId: number): Promise<boolean> {
  const access = await prisma.budgetAccess.findUnique({
    where: {
      budgetId_userId: { budgetId, userId }
    }
  });
  
  return access !== null; // En MVP, tener acceso = puede hacer todo
}
```

**Post-MVP: Agregar roles:**
```typescript
async function checkBudgetPermission(
  userId: number, 
  budgetId: number, 
  action: 'read' | 'write' | 'manage'
): Promise<boolean> {
  const access = await prisma.budgetAccess.findUnique({
    where: { budgetId_userId: { budgetId, userId } }
  });
  
  if (!access) return false;
  
  if (action === 'read') return true; // Todos pueden leer
  if (action === 'write') return ['OWNER', 'EDITOR'].includes(access.role);
  if (action === 'manage') return access.role === 'OWNER';
  
  return false;
}
```

---

## 8. Estrategia de Migración (Alto Nivel)

### Fase 1: Crear Nuevas Entidades (Sin Romper Existente)
1. Crear tablas: `users`, `budgets`, `budget_access`, `categories`, `transactions`
2. Seed:
   - Usuario default: `user(id=1, email='admin@local', name='Admin')`
   - Budget default: `budget(id=1, name='Default')`
   - BudgetAccess: `(budgetId=1, userId=1, role='OWNER')`
   - Categorías del sistema: INGRESOS, GASTOS, AHORROS + sub-categorías
3. **NO tocar tablas existentes todavía**

### Fase 2: Migración de Datos (Script)
1. Migrar `PresupuestoIngreso` → `Transaction`:
   ```sql
   INSERT INTO transactions (budget_id, category_code, item_key, item_name, year, month, amount, scenario)
   SELECT 
     1 as budget_id, -- Default budget
     'INGRESOS' as category_code,
     CONCAT('ingreso:', ingreso_id) as item_key,
     i.nombre as item_name,
     p.anio as year,
     1 as month, -- Enero
     p.enero as amount,
     'BUDGET' as scenario
   FROM presupuestos_ingresos p
   JOIN ingresos_base i ON p.ingreso_id = i.id
   WHERE p.enero > 0;
   -- Repetir para cada mes (febrero, marzo, ...)
   ```

2. Repetir para:
   - `PresupuestoServicioBasico` → `Transaction(category='GASTOS.SERVICIOS')`
   - `SupermercadoPresupuesto` → `Transaction(category='GASTOS.SUPERMERCADO')`
   - `ActualEntry` → `Transaction(scenario='ACTUAL')`
   - etc.

3. Validar totales (SUM antes = SUM después)

### Fase 3: Backend - Migrar Servicios
1. Crear `BudgetService`:
   - `getUserBudgets(userId): Budget[]`
   - `getBudgetTransactions(budgetId, year, month, scenario): Transaction[]`
   - `createTransaction(...)`, `updateTransaction(...)`, etc.

2. Actualizar `ConsolidadoService`:
   - `getMonthlyBudget(budgetId, year, month)` → usa `Transaction` en lugar de tablas legacy

3. Crear rutas:
   - `GET /api/budgets` → listar presupuestos del usuario
   - `GET /api/budgets/:id/transactions` → transacciones del presupuesto
   - `POST /api/budgets/:id/transactions` → crear transacción
   - `GET /api/budgets/:id/summary/:year/:month` → resumen Plan vs Real

### Fase 4: Frontend - Migrar UI
1. Crear `BudgetContext`:
   ```tsx
   const { currentBudget, budgets, setCurrentBudget } = useBudget();
   ```

2. Agregar selector de presupuesto en `Sidebar`:
   ```tsx
   <BudgetSelector
     budgets={budgets}
     current={currentBudget}
     onChange={setCurrentBudget}
   />
   ```

3. Actualizar páginas:
   - `Presupuesto.tsx` → usa `budgetId` del contexto
   - `Actual.tsx` → usa `budgetId` para comparar Plan vs Real
   - Resto de páginas → agregan `budgetId` a queries

### Fase 5: Deprecar Tablas Legacy (Post-MVP)
1. Marcar en código como `@deprecated`
2. Monitorear queries a tablas legacy (logs)
3. Cuando queries = 0, eliminar tablas en migración futura

---

## 9. Riesgos Identificados

### 9.1 Riesgos Técnicos

| Riesgo                                    | Severidad | Mitigación                                        |
|-------------------------------------------|-----------|---------------------------------------------------|
| Migración de datos pierde información     | 🔴 Alta   | Script con validación SUM antes/después           |
| Performance con tabla `Transaction` grande| 🟡 Media  | Índices adecuados + particionamiento por año      |
| Metadata JSON dificulta queries           | 🟡 Media  | Limitar uso de metadata, preferir columnas reales |
| Compatibilidad con datos Tenpo existentes | 🟡 Media  | Mantener `TenpoPurchase` en paralelo en MVP       |

### 9.2 Riesgos Funcionales

| Riesgo                                    | Severidad | Mitigación                                        |
|-------------------------------------------|-----------|---------------------------------------------------|
| Confusión entre Plan (BUDGET) y Real (ACTUAL) | 🟡 Media | UI clara: tabs "Presupuesto" vs "Real"       |
| Usuarios eliminan presupuesto compartido por error | 🟡 Media | Confirmación + soft delete (isActive=false) |
| Jerarquía de categorías crece incontrolable | 🟢 Baja | Limitar a 4 niveles + validación                 |

---

## 10. Recomendación MVP Final

### 10.1 Versión Mínima (MVP Absoluto)

**Incluir:**
- ✅ Tablas: `User`, `Budget`, `BudgetAccess`, `Category`, `Transaction`
- ✅ Campo `scenario` (BUDGET, ACTUAL)
- ✅ Jerarquía de categorías global (3 niveles máximo)
- ✅ Solo role `OWNER` (sin EDITOR/VIEWER)
- ✅ Migración de `PresupuestoIngreso`, `PresupuestoServicioBasico`, `ActualEntry`
- ✅ Backend: CRUD de budgets, transactions, budgetAccess
- ✅ Frontend: Selector de presupuesto + contexto

**Dejar Fuera:**
- ❌ Roles EDITOR/VIEWER (agregar post-MVP)
- ❌ Invitaciones por correo
- ❌ Compartir presupuesto con link
- ❌ Plantillas de presupuesto
- ❌ Importación masiva de transacciones
- ❌ Categorías personalizadas por presupuesto (global solo)

**Estimación:** 2-3 semanas

---

### 10.2 Versión Recomendada (MVP + Extras)

**Agregar sobre MVP Mínimo:**
- ✅ Role `EDITOR` (puede editar, no gestionar acceso)
- ✅ Gestión de acceso en UI (agregar/quitar usuarios)
- ✅ Migración completa de todas las tablas legacy
- ✅ Búsqueda y filtrado de transacciones
- ✅ Exportar presupuesto a CSV/Excel

**Estimación:** 3-4 semanas

---

### 10.3 Fuera del MVP (Post-MVP)

**Para versiones futuras:**
- Role `VIEWER` (solo lectura)
- Invitaciones por correo con link de confirmación
- Multi-moneda (USD, UF, EUR, etc.)
- Plantillas de presupuesto (aplicar a nuevo presupuesto)
- Categorías personalizadas por presupuesto (fork de global)
- Scenarios adicionales: FORECAST, REVISED
- Alertas y notificaciones (presupuesto excedido)
- Comparación visual de presupuestos (Hogar vs Seba)
- Análisis de tendencias (gastos últimos 12 meses)

---

## 11. Lista de Archivos Probablemente Impactados

### Backend (~25 archivos)

**Schema & Migraciones:**
- `prisma/schema.prisma` → agregar `User`, `Budget`, `BudgetAccess`, `Category`, `Transaction`
- `prisma/migrations/YYYYMMDDHHMMSS_add_multi_budget_model/migration.sql`
- `prisma/migrations/YYYYMMDDHHMMSS_migrate_legacy_data/migration.sql`
- `prisma/seed.ts` → seed usuarios, presupuestos, categorías

**Servicios:**
- **NUEVO:** `src/services/budget.service.ts` → CRUD budgets
- **NUEVO:** `src/services/budget-access.service.ts` → gestión de acceso
- **NUEVO:** `src/services/category.service.ts` → CRUD categorías
- **NUEVO:** `src/services/transaction.service.ts` → CRUD transacciones
- `src/services/consolidado.ts` → migrar a usar `Transaction`
- **NUEVO:** `src/services/auth.service.ts` → autenticación simple (opcional MVP)

**Middleware:**
- **NUEVO:** `src/middleware/auth.middleware.ts` → validar usuario autenticado
- **NUEVO:** `src/middleware/budget-access.middleware.ts` → validar acceso a presupuesto

**Rutas:**
- **NUEVO:** `src/routes/users.ts` → CRUD usuarios
- **NUEVO:** `src/routes/budgets.ts` → CRUD presupuestos
- **NUEVO:** `src/routes/budget-access.ts` → gestionar acceso
- **NUEVO:** `src/routes/categories.ts` → CRUD categorías
- **NUEVO:** `src/routes/transactions.ts` → CRUD transacciones
- `src/routes/actual.ts` → migrar a usar `budgetId` + `Transaction`
- `src/routes/ingresos.ts` → migrar o marcar deprecated
- `src/routes/servicios-basicos.ts` → migrar o marcar deprecated
- `src/routes/supermercado.ts` → migrar o marcar deprecated
- `src/routes/ahorros.ts` → migrar o marcar deprecated

**Index:**
- `src/index.ts` → registrar nuevas rutas + middleware

**Scripts:**
- **NUEVO:** `scripts/migrate-legacy-data.ts` → script de migración de datos

### Frontend (~30 archivos)

**Contexto:**
- **NUEVO:** `contexts/AuthContext.tsx` → estado de usuario autenticado
- **NUEVO:** `contexts/BudgetContext.tsx` → presupuesto activo
- **NUEVO:** `contexts/CategoryContext.tsx` → caché de categorías

**Componentes:**
- **NUEVO:** `components/budget/BudgetSelector.tsx` → dropdown selector
- **NUEVO:** `components/budget/BudgetCard.tsx` → tarjeta de presupuesto
- **NUEVO:** `components/budget/BudgetAccessManager.tsx` → gestionar usuarios
- **NUEVO:** `components/category/CategoryTree.tsx` → árbol de categorías
- **NUEVO:** `components/category/CategorySelector.tsx` → selector de categoría
- **NUEVO:** `components/transaction/TransactionForm.tsx` → crear/editar transacción
- **NUEVO:** `components/transaction/TransactionList.tsx` → lista de transacciones
- **NUEVO:** `components/transaction/TransactionRow.tsx` → fila de transacción
- `components/Sidebar.tsx` → agregar `BudgetSelector`

**Páginas:**
- **NUEVO:** `pages/Budgets.tsx` → listar presupuestos del usuario
- **NUEVO:** `pages/BudgetDetail.tsx` → detalle de presupuesto
- **NUEVO:** `pages/BudgetSettings.tsx` → configuración + acceso
- **NUEVO:** `pages/Categories.tsx` → gestión de categorías
- **NUEVO:** `pages/Transactions.tsx` → lista/búsqueda de transacciones
- `pages/Presupuesto.tsx` → migrar a usar `budgetId` + `Transaction`
- `pages/Actual.tsx` → migrar a comparar Plan (BUDGET) vs Real (ACTUAL)
- `pages/Ingresos.tsx` → migrar o marcar deprecated
- `pages/ServiciosBasicos.tsx` → migrar o marcar deprecated
- `pages/Supermercado.tsx` → migrar o marcar deprecated
- `pages/Ahorros.tsx` → migrar o marcar deprecated

**APIs:**
- **NUEVO:** `api/budgetApi.ts` → fetch budgets
- **NUEVO:** `api/budgetAccessApi.ts` → gestión de acceso
- **NUEVO:** `api/categoryApi.ts` → fetch/create categorías
- **NUEVO:** `api/transactionApi.ts` → fetch/create transacciones
- `api/actualApi.ts` → migrar a usar `budgetId` + `scenario`

**Tipos:**
- **NUEVO:** `types/user.ts` → interfaces User
- **NUEVO:** `types/budget.ts` → interfaces Budget, BudgetAccess
- **NUEVO:** `types/category.ts` → interfaces Category, CategoryTree
- **NUEVO:** `types/transaction.ts` → interfaces Transaction, TransactionScenario
- `types/actual.ts` → migrar o deprecar

**Navegación:**
- `navigation/menuConfig.ts` → agregar sección "Presupuestos"
- `router.tsx` → agregar rutas nuevas

**Total Estimado:** ~55 archivos (~25 backend + ~30 frontend)

---

## 12. Conclusión

### Estado Actual
- ✅ **Sistema funcional** con presupuesto único implícito
- ❌ **Bloqueador:** Sin modelo de usuario, presupuesto, ni acceso compartido
- ❌ **Fragmentación:** Tablas especializadas por categoría, difícil de escalar

### Modelo Recomendado MVP
```
User ←→ BudgetAccess ←→ Budget → Transaction → Category
```

**Características Clave:**
- ✅ **Multi-presupuesto:** Hogar (compartido), Seba (personal), Mona (personal)
- ✅ **Acceso compartido:** Varios usuarios por presupuesto (role=OWNER en MVP)
- ✅ **Jerarquía global:** Categorías compartidas entre presupuestos
- ✅ **Plan vs Real:** Campo `scenario` en misma tabla
- ✅ **Tabla unificada:** `Transaction` reemplaza 8+ tablas fragmentadas

### Próximos Pasos (No implementar aún)
1. Validar modelo con stakeholders (Seba, Mona)
2. Diseñar UI detallado (mockups de selector, comparación Plan vs Real)
3. Estimar en detalle (desglosar en tickets)
4. Implementar en fases:
   - Fase 1: Schema + seed
   - Fase 2: Migración de datos
   - Fase 3: Backend
   - Fase 4: Frontend

---

**FIN DEL DOCUMENTO**
