# Especificación MVP: Modelo de Planning & Control Financiero Mensual

**Fecha:** 2026-03-15  
**Estado:** Especificación Técnica Definitiva - NO IMPLEMENTAR  
**Objetivo:** Definir el modelo de datos MVP para un sistema de planificación y control financiero mensual con múltiples presupuestos

---

## 1. Decisión de Negocio Confirmada

### 1.1 Naturaleza del Sistema

**Finanzapp es una aplicación de PLANIFICACIÓN Y CONTROL FINANCIERO MENSUAL, NO una app de tracking transaccional diario.**

**Características Definitivas:**
- ✅ **Granularidad mensual:** Cada registro representa un valor mensual
- ✅ **Planning & Control:** Compara presupuesto (BUDGET) vs real (ACTUAL)
- ✅ **No es un libro contable:** No registra transacciones bancarias diarias como unidad principal
- ✅ **No es una app de finanzas personales tipo Mint/YNAB:** No sincroniza con bancos para importar movimientos diarios

**Ejemplos de Uso:**
- "En marzo 2026, presupuesté $350K en Supermercado (BUDGET) y gasté $380K (ACTUAL)"
- "Mi sueldo mensual es $3.5M (BUDGET), recibí $3.5M (ACTUAL)"
- "Netflix cuesta $12K/mes (BUDGET), pagué $12K (ACTUAL)"

**NO son casos de uso:**
- "Hoy 15 de marzo compré pan por $2.500 en el almacén"
- "Registrar cada compra individual del supermercado"
- "Importar movimientos diarios desde cuenta bancaria"

### 1.2 Implicaciones Conceptuales

| Aspecto                | Sistema Mensual (Finanzapp)           | Sistema Transaccional Diario      |
|------------------------|---------------------------------------|-----------------------------------|
| **Granularidad**       | Mes (agregado)                        | Día/Hora (detalle)                |
| **Registro típico**    | "Supermercado Marzo: $350K"           | "Compra Jumbo 15/03: $45K"        |
| **Comparación**        | Plan vs Real mensual                  | Presupuesto vs suma de transacciones |
| **Entrada de datos**   | Manual mensual o importación agregada | Automática desde banco/tarjeta    |
| **Objetivo**           | Control presupuestario mensual        | Tracking detallado de gastos      |

---

## 2. Impacto en el Naming del Modelo

### 2.1 Problema con el Nombre "Transaction"

El nombre `Transaction` es **semánticamente incorrecto** para un sistema de planning mensual:

**Ventajas de "Transaction":**
- ✅ Término genérico y conocido en desarrollo
- ✅ Compatible con literatura técnica (ACID transactions, database transactions)
- ✅ No requiere explicación adicional en equipo técnico

**Desventajas de "Transaction":**
- ❌ **Confusión semántica:** Sugiere transacciones bancarias diarias
- ❌ **Expectativa incorrecta:** Usuarios/stakeholders pueden esperar funcionalidad transaccional
- ❌ **Ambigüedad:** En el dominio financiero, "transaction" = movimiento bancario individual
- ❌ **Documentación confusa:** "Una transacción por mes" suena contradictorio
- ❌ **Futuro:** Si alguna vez se implementa tracking diario, habrá colisión conceptual

### 2.2 Alternativas Evaluadas

#### Opción 1: `MonthlyEntry`
**Ventajas:**
- ✅ Explícito: deja claro que cada registro es mensual
- ✅ Alineado con el dominio: "entrada mensual" = valor del mes
- ✅ Sin ambigüedad: no se confunde con transacción bancaria
- ✅ Escalable: si en el futuro se agrega tracking diario, no hay colisión

**Desventajas:**
- ⚠️ Más largo que "Transaction"
- ⚠️ Menos genérico (específico para granularidad mensual)

#### Opción 2: `FinanceEntry`
**Ventajas:**
- ✅ Genérico: abarca múltiples casos
- ✅ Neutral: no especifica granularidad
- ✅ Extensible: permite cambios futuros

**Desventajas:**
- ❌ Ambiguo: no indica que es mensual
- ❌ Demasiado genérico: podría ser cualquier cosa financiera

#### Opción 3: `BudgetEntry`
**Ventajas:**
- ✅ Alineado con "Budget" (presupuesto)
- ✅ Semánticamente correcto para planning

**Desventajas:**
- ❌ Confusión: un "BudgetEntry" también almacena ACTUAL (real), no solo BUDGET (plan)
- ❌ Inconsistencia: "BudgetEntry con scenario=ACTUAL" es contradictorio

#### Opción 4: `PlanEntry` / `ControlEntry`
**Ventajas:**
- ✅ Alineado con "Planning & Control"

**Desventajas:**
- ❌ Poco intuitivo: "PlanEntry" no deja claro que también almacena ACTUAL
- ❌ Demasiado abstracto

---

### 2.3 Recomendación de Naming

**Nombre Recomendado: `MonthlyEntry`**

**Justificación:**
1. **Claridad semántica:** Deja explícito que cada registro representa un valor mensual
2. **Alineación con el negocio:** "Entrada mensual" refleja la naturaleza del sistema
3. **Sin ambigüedad:** No se confunde con transacciones bancarias diarias
4. **Escalabilidad futura:** Si algún día se implementa tracking diario, sería otra entidad (`DailyTransaction`)
5. **Consistencia:** Código más autodocumentado (`MonthlyEntry` vs `Transaction`)

**Implementación:**
```prisma
model MonthlyEntry {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  categoryCode String   @map("category_code")
  
  itemKey      String   @map("item_key")
  itemName     String   @map("item_name")
  
  year         Int
  month        Int      // 1-12
  amount       Float    // CLP
  
  scenario     String   @default("BUDGET") // "BUDGET" | "ACTUAL"
  
  notes        String?
  metadata     String?
  
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  category     Category @relation(fields: [categoryCode], references: [code])
  
  @@unique([budgetId, scenario, categoryCode, itemKey, year, month])
  @@index([budgetId, year, month, scenario])
  @@map("monthly_entries")
}
```

---

## 3. Modelo MVP Ajustado

### 3.1 Entidades Core

#### **User** (sin cambios)
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

#### **Budget** (sin cambios)
```prisma
model Budget {
  id            Int            @id @default(autoincrement())
  name          String
  description   String?
  budgetType    String         @default("PERSONAL") @map("budget_type")
  isActive      Boolean        @default(true) @map("is_active")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  access        BudgetAccess[]
  monthlyEntries MonthlyEntry[] // ← CAMBIO: era "transactions"
  
  @@map("budgets")
}
```

#### **BudgetAccess** (sin cambios)
```prisma
model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("OWNER")
  createdAt DateTime @default(now()) @map("created_at")
  
  budget    Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, userId])
  @@index([userId])
  @@map("budget_access")
}
```

#### **Category** (sin cambios)
```prisma
model Category {
  id             Int            @id @default(autoincrement())
  code           String         @unique
  name           String
  parentCode     String?        @map("parent_code")
  parent         Category?      @relation("CategoryTree", fields: [parentCode], references: [code], onDelete: NoAction, onUpdate: NoAction)
  children       Category[]     @relation("CategoryTree")
  categoryType   String         @map("category_type")
  isSystem       Boolean        @default(false) @map("is_system")
  isGroup        Boolean        @default(false) @map("is_group")
  order          Int            @default(0)
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  
  monthlyEntries MonthlyEntry[] // ← CAMBIO: era "transactions"
  
  @@index([parentCode])
  @@map("categories")
}
```

#### **MonthlyEntry** (antes Transaction)
```prisma
model MonthlyEntry {
  id           Int      @id @default(autoincrement())
  budgetId     Int      @map("budget_id")
  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  categoryCode String   @map("category_code")
  category     Category @relation(fields: [categoryCode], references: [code])
  
  itemKey      String   @map("item_key") // "sueldo_liquido", "netflix", "supermercado"
  itemName     String   @map("item_name") // "Sueldo Líquido", "Netflix", "Supermercado"
  
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
  @@map("monthly_entries")
}
```

**Cambios respecto a "Transaction":**
1. **Nombre:** `MonthlyEntry` en lugar de `Transaction`
2. **Table name:** `monthly_entries` en lugar de `transactions`
3. **Relaciones:** Budget y Category apuntan a `MonthlyEntry[]`
4. **Semántica:** Cada registro representa un **valor mensual agregado**, NO una transacción individual

---

### 3.2 Significado de los Campos

| Campo         | Significado                                                                 | Ejemplo                                      |
|---------------|-----------------------------------------------------------------------------|----------------------------------------------|
| `budgetId`    | Presupuesto al que pertenece                                                | `1` (Hogar)                                  |
| `categoryCode`| Categoría jerárquica                                                        | `GASTOS.SUPERMERCADO`                        |
| `itemKey`     | Identificador único del ítem dentro de la categoría                         | `supermercado_marzo`                         |
| `itemName`    | Nombre display del ítem                                                     | `Supermercado Marzo`                         |
| `year`        | Año del período mensual                                                     | `2026`                                       |
| `month`       | Mes del período (1-12)                                                      | `3` (Marzo)                                  |
| `amount`      | **Monto mensual agregado** (NO suma de transacciones diarias)               | `350000` (CLP)                               |
| `scenario`    | `BUDGET` (presupuestado/plan) o `ACTUAL` (real/ejecutado)                   | `BUDGET` o `ACTUAL`                          |
| `notes`       | Notas adicionales                                                           | "Incluye compras en Jumbo y Santa Isabel"    |
| `metadata`    | JSON con datos específicos (opcional)                                       | `{ "source": "manual", "confirmed": true }`  |

---

### 3.3 Relaciones entre Entidades

```
User (1) ←→ (N) BudgetAccess (N) ←→ (1) Budget
  └─ Un usuario puede tener acceso a varios presupuestos
  └─ Un presupuesto puede tener varios usuarios con acceso

Budget (1) ←→ (N) MonthlyEntry
  └─ Un presupuesto tiene muchas entradas mensuales
  └─ Una entrada mensual pertenece a un solo presupuesto

Category (1) ←→ (N) MonthlyEntry
  └─ Una categoría puede usarse en muchas entradas mensuales
  └─ Una entrada mensual pertenece a una sola categoría

Category (1) ←→ (N) Category (parent-child)
  └─ Árbol jerárquico de categorías
```

---

## 4. Ejemplo Completo del Registro Mensual

### 4.1 Caso: Supermercado en Presupuesto Hogar (Marzo 2026)

**Presupuesto (BUDGET):**
```sql
INSERT INTO monthly_entries (
  budget_id, 
  category_code, 
  item_key, 
  item_name, 
  year, 
  month, 
  amount, 
  scenario,
  notes
) VALUES (
  1,                              -- Hogar
  'GASTOS.SUPERMERCADO',          -- Categoría
  'supermercado',                 -- itemKey (único en categoría+mes)
  'Supermercado',                 -- itemName
  2026,                           -- Año
  3,                              -- Marzo
  350000,                         -- $350K presupuestados
  'BUDGET',                       -- Es el plan
  'Presupuesto mensual estimado'  -- Notas
);
```

**Real (ACTUAL):**
```sql
INSERT INTO monthly_entries (
  budget_id, 
  category_code, 
  item_key, 
  item_name, 
  year, 
  month, 
  amount, 
  scenario,
  notes,
  metadata
) VALUES (
  1,                              -- Hogar
  'GASTOS.SUPERMERCADO',          -- Misma categoría
  'supermercado',                 -- Mismo itemKey
  'Supermercado',                 -- Mismo itemName
  2026,                           -- Mismo año
  3,                              -- Mismo mes
  380000,                         -- $380K gastados (real)
  'ACTUAL',                       -- Es el real
  'Suma de compras del mes',      -- Notas
  '{"source": "manual", "storeBreakdown": {"Jumbo": 250000, "Santa Isabel": 130000}}' -- Metadata
);
```

**Interpretación:**
- **Planificación:** En marzo 2026, el presupuesto Hogar tiene $350K asignados a Supermercado
- **Ejecución:** En marzo 2026, se gastaron $380K en Supermercado (variación: +$30K)
- **Agregación:** Los $380K pueden ser la suma de múltiples compras, pero el sistema solo registra el total mensual
- **Metadata (opcional):** Se puede guardar detalle adicional en JSON (ej: desglose por tienda)

### 4.2 Comparación Plan vs Real

```sql
SELECT 
  b.amount AS presupuestado,
  a.amount AS real,
  (a.amount - b.amount) AS variacion,
  ROUND((a.amount - b.amount) / b.amount * 100, 2) AS variacion_pct
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

**Resultado:**
```
presupuestado | real   | variacion | variacion_pct
350000        | 380000 | 30000     | 8.57
```

---

## 5. Ajustes al Modelo vs Especificación Anterior

### 5.1 Cambios Principales

| Aspecto                  | Especificación Anterior         | Especificación Ajustada           |
|--------------------------|---------------------------------|-----------------------------------|
| **Nombre entidad**       | `Transaction`                   | `MonthlyEntry`                    |
| **Nombre tabla**         | `transactions`                  | `monthly_entries`                 |
| **Semántica**            | Transacciones (ambiguo)         | Entradas mensuales (explícito)    |
| **Descripción**          | "Transacciones unificadas"      | "Entradas mensuales de planning"  |
| **Relación Budget**      | `transactions Transaction[]`    | `monthlyEntries MonthlyEntry[]`   |
| **Relación Category**    | `transactions Transaction[]`    | `monthlyEntries MonthlyEntry[]`   |

### 5.2 Documentación Ajustada

**Antes:**
> "Tabla `Transaction` almacena todas las transacciones del presupuesto..."

**Después:**
> "Tabla `MonthlyEntry` almacena las entradas mensuales de planificación y control. Cada registro representa un valor mensual agregado para un ítem específico en un presupuesto."

**Antes:**
> "Una transacción pertenece a un solo presupuesto"

**Después:**
> "Una entrada mensual pertenece a un solo presupuesto y representa el valor de un mes específico"

---

## 6. Migración de Tablas Legacy

### 6.1 Mapeo Conceptual

**Las tablas actuales ya son mensuales**, por lo que la migración es directa:

| Tabla Actual                 | Estructura Actual                | Migración a `MonthlyEntry`                     |
|------------------------------|----------------------------------|------------------------------------------------|
| `PresupuestoIngreso`         | 1 fila = 1 año, 12 columnas      | 12 filas (1 por mes), scenario=BUDGET          |
| `PresupuestoServicioBasico`  | 1 fila = 1 año, 12 columnas      | 12 filas (1 por mes), scenario=BUDGET          |
| `SupermercadoPresupuesto`    | 1 fila = 1 año, 12 columnas      | 12 filas (1 por mes), scenario=BUDGET          |
| `ActualEntry`                | 1 fila = 1 mes                   | 1 fila, scenario=ACTUAL                        |

**Ejemplo de Transformación:**
```typescript
// PresupuestoIngreso (antes) - 1 fila por año
{
  id: 1,
  ingresoId: 5,
  anio: 2026,
  enero: 3500000,
  febrero: 3500000,
  marzo: 3500000,
  // ... resto de meses
}

// MonthlyEntry (después) - 12 filas (1 por mes)
[
  {
    budgetId: 1,
    categoryCode: 'INGRESOS',
    itemKey: 'ingreso:5',
    itemName: 'Sueldo Líquido',
    year: 2026,
    month: 1,  // Enero
    amount: 3500000,
    scenario: 'BUDGET'
  },
  {
    budgetId: 1,
    categoryCode: 'INGRESOS',
    itemKey: 'ingreso:5',
    itemName: 'Sueldo Líquido',
    year: 2026,
    month: 2,  // Febrero
    amount: 3500000,
    scenario: 'BUDGET'
  },
  // ... resto de meses
]
```

**Ventajas de esta transformación:**
- ✅ Más normalizado: cada mes es un registro independiente
- ✅ Más flexible: fácil agregar/modificar un mes específico
- ✅ Queries más simples: `WHERE month = 3` en lugar de acceder columna `marzo`

---

## 7. Ventajas y Riesgos del Modelo Mensual

### 7.1 Ventajas de `MonthlyEntry`

1. **Claridad semántica:**
   - Nombre autodocumentado
   - No hay confusión con transacciones bancarias

2. **Alineación con el negocio:**
   - Refleja la naturaleza mensual del sistema
   - Stakeholders entienden "entrada mensual" mejor que "transacción"

3. **Escalabilidad conceptual:**
   - Si en el futuro se agrega tracking diario, sería `DailyTransaction` (entidad separada)
   - No hay colisión de nombres

4. **Código autodocumentado:**
   - `getMonthlyEntries(budgetId, year, month)` es más claro que `getTransactions(...)`
   - `createMonthlyEntry(...)` vs `createTransaction(...)` → el primero es explícito

5. **Previene errores de expectativa:**
   - Desarrolladores nuevos no asumirán que es un sistema transaccional
   - No se intentará implementar funcionalidad de tracking diario incorrectamente

### 7.2 Riesgos y Mitigaciones

| Riesgo                                           | Severidad | Mitigación                                        |
|--------------------------------------------------|-----------|---------------------------------------------------|
| Nombre más largo (`MonthlyEntry` vs `Transaction`) | 🟢 Baja   | Beneficio de claridad supera el costo             |
| Menos familiar para desarrolladores              | 🟢 Baja   | Documentación clara + naming autodocumentado      |
| Posible refactor si se cambia a diario          | 🟡 Media  | Extremadamente improbable; el sistema es mensual por diseño |

---

## 8. Recomendación Final para MVP

### 8.1 Modelo Definitivo

**Entidades Core:**
```
User ←→ BudgetAccess ←→ Budget → MonthlyEntry → Category
```

**Cambios respecto a especificación anterior:**
- ✅ Renombrar `Transaction` → `MonthlyEntry`
- ✅ Tabla `transactions` → `monthly_entries`
- ✅ Relaciones actualizadas en Budget y Category
- ✅ Documentación ajustada para reflejar naturaleza mensual

### 8.2 Implementación MVP

**Incluir:**
- ✅ Tablas: `users`, `budgets`, `budget_access`, `categories`, `monthly_entries`
- ✅ Campo `scenario` (BUDGET, ACTUAL)
- ✅ Jerarquía de categorías global
- ✅ Solo role `OWNER`
- ✅ Migración de tablas legacy (12 columnas → 12 filas)
- ✅ Backend: CRUD de budgets, monthly entries, budget access
- ✅ Frontend: Selector de presupuesto + comparación Plan vs Real

**Dejar Fuera:**
- ❌ Tracking transaccional diario
- ❌ Importación automática desde bancos
- ❌ Registro de compras individuales
- ❌ Roles EDITOR/VIEWER (solo OWNER en MVP)

### 8.3 Ejemplo de API

**Antes (con Transaction):**
```typescript
// Confuso: ¿es una transacción bancaria?
GET /api/budgets/:id/transactions?year=2026&month=3

POST /api/budgets/:id/transactions
{
  categoryCode: "GASTOS.SUPERMERCADO",
  amount: 350000,
  scenario: "BUDGET"
}
```

**Después (con MonthlyEntry):**
```typescript
// Claro: es una entrada mensual de planning
GET /api/budgets/:id/monthly-entries?year=2026&month=3

POST /api/budgets/:id/monthly-entries
{
  categoryCode: "GASTOS.SUPERMERCADO",
  itemKey: "supermercado",
  itemName: "Supermercado",
  amount: 350000,
  year: 2026,
  month: 3,
  scenario: "BUDGET"
}
```

---

## 9. Comparación: Transaction vs MonthlyEntry

### 9.1 Tabla Comparativa

| Criterio                       | Transaction              | MonthlyEntry             | Ganador         |
|--------------------------------|--------------------------|--------------------------|-----------------|
| **Claridad semántica**         | ⚠️ Ambiguo               | ✅ Explícito             | MonthlyEntry    |
| **Alineación con negocio**     | ❌ Sugiere transacciones | ✅ Refleja planning mensual | MonthlyEntry |
| **Longitud del nombre**        | ✅ Corto (11 chars)      | ⚠️ Largo (12 chars)      | Transaction     |
| **Familiaridad desarrolladores**| ✅ Conocido             | ⚠️ Menos común           | Transaction     |
| **Prevención de confusión**    | ❌ Puede confundir       | ✅ No hay confusión      | MonthlyEntry    |
| **Escalabilidad conceptual**   | ⚠️ Colisión si se agrega diario | ✅ Permite DailyTransaction futuro | MonthlyEntry |
| **Código autodocumentado**     | ⚠️ Requiere contexto     | ✅ Autodocumentado       | MonthlyEntry    |

### 9.2 Conclusión

**MonthlyEntry es el nombre superior para este caso de uso específico.**

**Justificación final:**
- La claridad semántica supera la brevedad del nombre
- El sistema es mensual por definición de negocio, no por limitación técnica
- Previene malentendidos futuros
- El código es más mantenible y autodocumentado

---

## 10. Próximos Pasos (No Implementar Aún)

1. **Validar decisión de naming con stakeholders**
2. **Actualizar especificación técnica oficial** con `MonthlyEntry`
3. **Diseñar UI** que refleje naturaleza mensual (grillas mensuales, no listas de transacciones)
4. **Implementar en fases:**
   - Fase 1: Schema con `monthly_entries`
   - Fase 2: Migración de datos (12 columnas → 12 filas)
   - Fase 3: Backend con servicios `MonthlyEntryService`
   - Fase 4: Frontend con componentes mensuales

---

**FIN DEL DOCUMENTO**
