# Decisiones de Arquitectura: Finanzapp MVP

**Fecha:** 2026-03-15  
**Estado:** Documento Maestro de Decisiones - NO IMPLEMENTAR  
**Versión:** 1.0  
**Propósito:** Consolidar todas las decisiones funcionales y estructurales tomadas para el MVP de Finanzapp

---

## 1. Propósito del Sistema

### 1.1 Definición de Producto

**Finanzapp es una aplicación web de planificación y control financiero mensual para uso personal y familiar.**

**Características Core:**
- ✅ **Granularidad mensual:** El sistema opera a nivel de mes, no de transacciones diarias
- ✅ **Planning & Control:** Compara plan (BUDGET) vs real (ACTUAL) mes a mes
- ✅ **Multi-presupuesto:** Soporta múltiples presupuestos independientes (ej: Hogar, Personal Seba, Personal Mona)
- ✅ **Acceso compartido:** Un presupuesto puede ser compartido entre usuarios (ej: Hogar compartido por Seba y Mona)
- ✅ **Categorías jerárquicas:** Organización estructurada de ingresos/gastos/ahorros

**NO es:**
- ❌ Un sistema de tracking transaccional diario (tipo Mint, YNAB)
- ❌ Una app de sincronización bancaria automática
- ❌ Un libro contable de partida doble
- ❌ Una herramienta de inversión o portfolio management

### 1.2 Casos de Uso MVP

**Presupuestos a soportar:**
1. **Hogar** (compartido): Gastos del hogar compartidos entre Seba y Mona
2. **Seba** (personal): Gastos individuales de Seba
3. **Mona** (personal): Gastos individuales de Mona

**Flujo típico de usuario:**
1. Usuario ingresa a dashboard global (punto de entrada)
2. Selecciona presupuesto (Hogar/Seba/Mona)
3. Ingresa/edita valores mensuales por categoría
4. Compara plan vs real mensualmente
5. Visualiza resúmenes y balances

---

## 2. Decisiones Cerradas (Implementar en MVP)

### 2.1 Modelo de Datos

#### **Entidad Principal: `MonthlyEntry`**

**Decisión:** La entidad principal del sistema será `MonthlyEntry`, NO `Transaction`.

**Justificación:**
- Refleja la naturaleza mensual del sistema
- Evita confusión con transacciones bancarias diarias
- Cada registro representa un valor mensual agregado (ej: "Supermercado Marzo 2026: $350K")

**Estructura:**
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
  metadata     String?  // JSON extensible
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  budget       Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  category     Category @relation(fields: [categoryCode], references: [code])
  
  @@unique([budgetId, scenario, categoryCode, itemKey, year, month])
  @@index([budgetId, year, month, scenario])
  @@map("monthly_entries")
}
```

**Campos Clave:**
- `scenario`: Distingue entre plan (BUDGET) y real (ACTUAL)
- `year` + `month`: El tiempo vive en `MonthlyEntry`, NO en el presupuesto
- `amount`: Siempre en CLP (moneda única MVP)

---

#### **Presupuesto Permanente (No Anual)**

**Decisión:** Un presupuesto es una entidad permanente, NO está atado a un año específico.

**Implicaciones:**
- ✅ Budget NO tiene campo `year`
- ✅ El año está en cada `MonthlyEntry`
- ✅ Un presupuesto puede contener datos de múltiples años (2025, 2026, 2027...)
- ✅ No se requiere "Crear presupuesto 2027" - simplemente se agregan entries del 2027

**Estructura:**
```prisma
model Budget {
  id            Int            @id @default(autoincrement())
  name          String         // "Hogar", "Seba", "Mona"
  description   String?
  budgetType    String         @default("PERSONAL") @map("budget_type") // "PERSONAL" | "SHARED"
  isActive      Boolean        @default(true) @map("is_active")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  access        BudgetAccess[]
  monthlyEntries MonthlyEntry[]
  categories    Category[]     // ← CATEGORÍAS POR PRESUPUESTO
  
  @@map("budgets")
}
```

---

#### **Categorías por Presupuesto (No Globales)**

**Decisión:** Las categorías pertenecen a cada presupuesto, NO son globales.

**Justificación:**
- ✅ Cada presupuesto puede tener estructura de categorías personalizada
- ✅ "Hogar" puede tener categorías diferentes a "Seba"
- ✅ No se fuerza a todos los presupuestos a usar las mismas categorías

**⚠️ CAMBIO IMPORTANTE vs Especificaciones Anteriores:**
- Los documentos `spec-mvp-budget-access-model.md` y `spec-budget-hierarchy-mvp.md` proponían categorías **globales**
- Esta decisión contradice esas especificaciones
- **Decisión final confirmada:** Categorías POR presupuesto

**Estructura:**
```prisma
model Category {
  id           Int            @id @default(autoincrement())
  budgetId     Int            @map("budget_id")  // ← NUEVO: FK a Budget
  code         String         // "INGRESOS", "GASTOS.SUSCRIPCIONES", etc.
  name         String
  parentCode   String?        @map("parent_code")
  parent       Category?      @relation("CategoryTree", fields: [parentCode, budgetId], references: [code, budgetId])
  children     Category[]     @relation("CategoryTree")
  categoryType String         @map("category_type") // "INCOME" | "EXPENSE" | "SAVINGS"
  isLeaf       Boolean        @default(true) @map("is_leaf")  // Solo hojas pueden tener monto
  order        Int            @default(0)
  createdAt    DateTime       @default(now()) @map("created_at")
  updatedAt    DateTime       @updatedAt @map("updated_at")
  
  budget       Budget         @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  monthlyEntries MonthlyEntry[]
  
  @@unique([budgetId, code])
  @@index([budgetId, parentCode])
  @@map("categories")
}
```

**Reglas de Negocio:**
- ✅ **Solo categorías hoja pueden tener monto:** Si `isLeaf = false`, no se pueden crear MonthlyEntry
- ✅ **Jerarquía por presupuesto:** Árbol de categorías es independiente por budget
- ✅ **Dot-notation:** Códigos usan punto para indicar jerarquía (ej: `GASTOS.SUSCRIPCIONES.NETFLIX`)

---

#### **Plantilla Base Clonable**

**Decisión:** Cada presupuesto nuevo se crea a partir de una plantilla base que se clona.

**Implementación:**
- ✅ Existe un "Budget Template" o seed de categorías base
- ✅ Al crear un nuevo presupuesto, se clonan las categorías de la plantilla
- ✅ El usuario puede modificar/agregar/eliminar categorías después del clonado

**Flujo de Creación:**
```typescript
// Pseudocódigo
async function createBudget(name: string, userId: number) {
  const budget = await prisma.budget.create({ data: { name, budgetType: 'PERSONAL' } });
  
  // Clonar categorías desde plantilla base
  const templateCategories = await getTemplateCategoriesSeeds();
  for (const cat of templateCategories) {
    await prisma.category.create({
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
  
  // Asignar acceso al usuario
  await prisma.budgetAccess.create({
    data: { budgetId: budget.id, userId, role: 'OWNER' }
  });
  
  return budget;
}
```

**Plantilla Base Inicial:**
```
INGRESOS (isLeaf=false)
  INGRESOS.REMUNERACIONES (isLeaf=false)
    INGRESOS.REMUNERACIONES.SUELDO (isLeaf=true)
    INGRESOS.REMUNERACIONES.BONOS (isLeaf=true)

GASTOS (isLeaf=false)
  GASTOS.SUSCRIPCIONES (isLeaf=false)
    GASTOS.SUSCRIPCIONES.NETFLIX (isLeaf=true)
    GASTOS.SUSCRIPCIONES.SPOTIFY (isLeaf=true)
  GASTOS.SERVICIOS (isLeaf=false)
    GASTOS.SERVICIOS.LUZ (isLeaf=true)
    GASTOS.SERVICIOS.AGUA (isLeaf=true)
    GASTOS.SERVICIOS.GAS (isLeaf=true)
  GASTOS.SUPERMERCADO (isLeaf=true)
  GASTOS.OBLIGACIONES (isLeaf=false)
  GASTOS.HIPOTECARIO (isLeaf=true)

AHORROS (isLeaf=false)
  AHORROS.AHORRO_MENSUAL (isLeaf=true)
```

---

#### **Moneda Única: CLP**

**Decisión:** El MVP solo soporta CLP (Pesos Chilenos).

**Implicaciones:**
- ✅ Campo `amount` en `MonthlyEntry` es siempre CLP
- ✅ No hay tabla de monedas ni conversiones
- ✅ UI muestra montos con formato chileno (ej: "$350.000")
- ❌ No se soporta multi-moneda en MVP

**Futura Extensión (fuera de MVP):**
- Agregar campo `currency` a `MonthlyEntry`
- Tabla `ExchangeRate` para conversiones
- Campo `baseCurrency` en `Budget`

---

### 2.2 Acceso Multi-Usuario

#### **Modelo de Acceso Compartido**

**Decisión:** Implementar acceso compartido básico mediante tabla `BudgetAccess`.

**Estructura:**
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

model BudgetAccess {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   @default("OWNER") // Solo "OWNER" en MVP
  createdAt DateTime @default(now()) @map("created_at")
  
  budget    Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, userId])
  @@index([userId])
  @@map("budget_access")
}
```

**Reglas MVP:**
- ✅ Rol único: `OWNER` (editor completo)
- ✅ Un presupuesto puede tener múltiples OWNER
- ✅ Un usuario puede tener acceso a múltiples presupuestos
- ❌ **NO** roles EDITOR/VIEWER en MVP (dejar para futuro)
- ❌ **NO** invitaciones por email en MVP
- ❌ **NO** flujo de aceptación/rechazo de acceso

**Ejemplo de Setup Inicial:**
```sql
-- Usuarios
INSERT INTO users (email, name) VALUES 
  ('seba@example.com', 'Seba'),
  ('mona@example.com', 'Mona');

-- Presupuestos
INSERT INTO budgets (name, budget_type) VALUES 
  ('Hogar', 'SHARED'),
  ('Seba', 'PERSONAL'),
  ('Mona', 'PERSONAL');

-- Accesos
INSERT INTO budget_access (budget_id, user_id, role) VALUES
  (1, 1, 'OWNER'), -- Seba → Hogar
  (1, 2, 'OWNER'), -- Mona → Hogar
  (2, 1, 'OWNER'), -- Seba → Seba
  (3, 2, 'OWNER'); -- Mona → Mona
```

---

### 2.3 Interfaz de Usuario

#### **Dashboard Global como Punto de Entrada**

**Decisión:** El sistema inicia con un dashboard global que muestra resumen de todos los presupuestos.

**Funcionalidad:**
- ✅ Muestra lista de presupuestos del usuario
- ✅ Tarjeta por presupuesto con resumen (balance, total ingresos, total gastos)
- ✅ Selector/botón para entrar a cada presupuesto
- ✅ Indicadores visuales (iconos, colores) para diferenciar presupuestos

**Wireframe Conceptual:**
```
┌─────────────────────────────────────────┐
│ Finanzapp - Mis Presupuestos           │
├─────────────────────────────────────────┤
│                                         │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ 🏠 Hogar     │  │ 👤 Seba      │     │
│ │ Compartido   │  │ Personal     │     │
│ │              │  │              │     │
│ │ Balance:     │  │ Balance:     │     │
│ │ $250.000     │  │ -$50.000     │     │
│ │              │  │              │     │
│ │ [Ver detalle]│  │ [Ver detalle]│     │
│ └──────────────┘  └──────────────┘     │
│                                         │
│ ┌──────────────┐                        │
│ │ 👤 Mona      │                        │
│ │ Personal     │                        │
│ │              │                        │
│ │ Balance:     │                        │
│ │ $100.000     │                        │
│ │              │                        │
│ │ [Ver detalle]│                        │
│ └──────────────┘                        │
└─────────────────────────────────────────┘
```

**Navegación:**
- Dashboard → Seleccionar presupuesto → Vista mensual detallada
- Header siempre muestra selector de presupuesto activo
- Breadcrumbs: "Dashboard > Hogar > Marzo 2026"

---

## 3. Decisiones Fuera de Alcance MVP (Postergadas)

### 3.1 Funcionalidad Pospuesta

| Funcionalidad                      | Razón para Postponer                     | Consideración Futura           |
|------------------------------------|------------------------------------------|--------------------------------|
| **Roles EDITOR/VIEWER**            | Complejidad innecesaria para 2 usuarios  | Implementar cuando haya >3 usuarios por presupuesto |
| **Multi-moneda**                   | Caso de uso no validado                  | Agregar cuando sea necesario   |
| **Importación desde bancos**       | Complejidad alta, requiere APIs externas | Evaluar en fase 2              |
| **Tracking transaccional diario**  | Fuera del propósito del sistema          | Probablemente nunca            |
| **Presupuestos recurrentes/templates** | MVP parte con clonado manual         | Automatizar si hay demanda     |
| **Notificaciones/alertas**         | No crítico para MVP                      | Agregar después de MVP estable |
| **Reportes avanzados (PDF/Excel)** | Caso de uso no validado                  | Evaluar según feedback         |
| **Categorías personalizadas ilimitadas** | Plantilla base suficiente para MVP | Permitir CRUD completo en fase 2 |
| **Autenticación/autorización robusta** | Solo 2 usuarios conocidos          | Implementar OAuth2 en producción |
| **Comparación entre presupuestos** | Complejidad de UI/UX alta                | Fase 2 si hay demanda          |
| **Metas/objetivos financieros**    | Fuera del scope de planning mensual      | Evaluar como feature separada  |

---

### 3.2 Migraciones Pospuestas

**Decisión:** El MVP partirá con base de datos nueva (schema limpio).

**Migración de datos legacy:**
- ❌ **NO migrar automáticamente** en MVP
- ✅ Mantener base de datos actual intacta
- ✅ Desarrollar MVP en paralelo con schema nuevo
- ⚠️ Migración de datos será manual o semi-automática en fase post-MVP

**Justificación:**
- Evitar complejidad de transformación de datos fragmentados
- Permitir iteración rápida en modelo MVP
- Validar modelo con datos de prueba antes de migrar datos reales

---

## 4. Riesgos y Dudas Pendientes

### 4.1 Riesgos Técnicos Abiertos

#### **Riesgo 1: Gestión de Categorías por Presupuesto**

**Descripción:** Tener categorías por presupuesto implica duplicación entre presupuestos similares.

**Escenario Problemático:**
- Usuario crea "Hogar" con 50 categorías
- Usuario quiere crear "Hogar 2" con las mismas categorías
- Debe clonar manualmente o confiar solo en plantilla base

**Posibles Soluciones:**
1. **Opción A:** Permitir "clonar categorías desde otro presupuesto"
2. **Opción B:** Volver a categorías globales con flags por presupuesto
3. **Opción C:** Mantener decisión actual y aceptar duplicación

**Estado:** ⚠️ PENDIENTE DE DECISIÓN - Requiere validación con caso de uso real

---

#### **Riesgo 2: Plantilla Base Demasiado Rígida**

**Descripción:** La plantilla base puede no cubrir todos los casos de uso personales.

**Escenario Problemático:**
- Usuario Mona tiene estructura de gastos muy diferente a la plantilla
- Debe eliminar/agregar muchas categorías manualmente
- Experiencia de onboarding subóptima

**Posibles Soluciones:**
1. **Opción A:** Ofrecer múltiples plantillas (Simple, Completa, Freelancer, etc.)
2. **Opción B:** Wizard de setup inicial que pregunta preferencias
3. **Opción C:** Permitir partir con presupuesto vacío

**Estado:** ⚠️ PENDIENTE DE DECISIÓN - Evaluar en testing de UX

---

#### **Riesgo 3: Performance con Categorías Jerárquicas**

**Descripción:** Consultas recursivas de árbol de categorías pueden ser lentas.

**Escenario Problemático:**
- Presupuesto con 100+ categorías en 4-5 niveles
- Vista mensual requiere cargar todo el árbol
- Consultas SQL recursivas pueden ser ineficientes en SQLite

**Posibles Soluciones:**
1. **Opción A:** Usar materialized path (dot-notation ya implementado)
2. **Opción B:** Caché de árbol en memoria (Redis/in-memory)
3. **Opción C:** Limitar profundidad de árbol a 3 niveles

**Estado:** ⚠️ BAJO IMPACTO - Monitorear en desarrollo, SQLite probablemente será suficiente

---

### 4.2 Dudas Funcionales Abiertas

#### **Duda 1: ¿Cómo manejar edición de categorías compartidas?**

**Contexto:**
- "Hogar" es compartido entre Seba y Mona (ambos OWNER)
- Seba agrega categoría "GASTOS.MASCOTA"
- ¿Mona ve el cambio inmediatamente?

**Opciones:**
1. **Sincronización automática:** Cambio se refleja inmediatamente (requiere WebSockets o polling)
2. **Refresh manual:** Usuario debe recargar página
3. **Versionado:** Cada usuario tiene snapshot temporal, se sincronizan al guardar

**Estado:** ⚠️ PENDIENTE - Definir en fase de implementación, probablemente Opción 2 para MVP

---

#### **Duda 2: ¿Permitir eliminar categorías con datos?**

**Contexto:**
- Categoría "GASTOS.NETFLIX" tiene 12 MonthlyEntry
- Usuario quiere eliminarla

**Opciones:**
1. **Bloquear eliminación:** Mostrar error "Categoría tiene datos asociados"
2. **Soft delete:** Marcar como eliminada pero mantener datos
3. **Cascada:** Eliminar categoría Y todas sus entries (peligroso)
4. **Reasignar:** Permitir mover entries a otra categoría antes de eliminar

**Estado:** ⚠️ PENDIENTE - Opción 2 (soft delete) probablemente más segura

---

#### **Duda 3: ¿Dashboard muestra mes actual o configurable?**

**Contexto:**
- Dashboard global muestra resumen de presupuestos
- ¿Balance del mes actual? ¿Año completo? ¿Configurable?

**Opciones:**
1. **Mes actual:** Siempre muestra balance del mes en curso
2. **Año actual:** Suma todo el año en curso
3. **Últimos 12 meses:** Rolling year
4. **Configurable:** Usuario elige período

**Estado:** ⚠️ PENDIENTE - Probablemente Opción 1 para MVP (mes actual)

---

## 5. Resumen del Modelo Conceptual Final

### 5.1 Diagrama Entidad-Relación

```
User (1) ←→ (N) BudgetAccess (N) ←→ (1) Budget
                                       │
                                       ├─ (1) ←→ (N) Category
                                       │              │
                                       │              └─ (self-referencing tree)
                                       │
                                       └─ (1) ←→ (N) MonthlyEntry
                                                      │
                                                      └─→ (1) Category
```

**Relaciones:**
1. **User ↔ BudgetAccess ↔ Budget** (N:M con tabla intermedia)
   - Un usuario tiene acceso a múltiples presupuestos
   - Un presupuesto es accesible por múltiples usuarios

2. **Budget → Category** (1:N)
   - Un presupuesto tiene múltiples categorías
   - Las categorías son específicas de cada presupuesto (NO globales)

3. **Category → Category** (self-referencing tree)
   - Árbol jerárquico ilimitado
   - Solo categorías hoja (`isLeaf=true`) pueden tener montos

4. **Budget → MonthlyEntry** (1:N)
   - Un presupuesto contiene múltiples entradas mensuales

5. **Category → MonthlyEntry** (1:N)
   - Una categoría puede tener múltiples entradas mensuales
   - Constraint: Solo si `Category.isLeaf = true`

---

### 5.2 Flujo de Datos Conceptual

```
1. Usuario se loguea
   ↓
2. Sistema carga presupuestos del usuario (JOIN User → BudgetAccess → Budget)
   ↓
3. Dashboard muestra tarjetas de presupuestos con balances
   ↓
4. Usuario selecciona "Hogar"
   ↓
5. Sistema carga:
   - Categorías del presupuesto (Budget → Category, árbol completo)
   - Entradas mensuales del mes actual (Budget → MonthlyEntry WHERE year=2026, month=3)
   ↓
6. Vista mensual renderiza:
   - Árbol de categorías (jerárquico, colapsable)
   - Montos BUDGET y ACTUAL por categoría hoja
   - Balances calculados
   ↓
7. Usuario edita monto (ej: "Supermercado BUDGET Marzo 2026 = $400K")
   ↓
8. Sistema actualiza MonthlyEntry correspondiente
   ↓
9. UI recalcula balances y muestra cambios
```

---

### 5.3 Reglas de Negocio Core

#### **RN-001: Solo categorías hoja tienen montos**
- **Regla:** `MonthlyEntry.categoryCode` debe apuntar a una categoría con `isLeaf = true`
- **Validación:** Backend rechaza creación de MonthlyEntry si Category.isLeaf = false
- **Agregación:** Montos de categorías padre se calculan sumando hijos

#### **RN-002: Clave única de entrada mensual**
- **Regla:** No pueden existir dos entradas con mismo `(budgetId, scenario, categoryCode, itemKey, year, month)`
- **Implementación:** Constraint único en DB
- **Ejemplo:** "Netflix BUDGET Marzo 2026" en "Hogar" existe una sola vez

#### **RN-003: Escenarios mutuamente excluyentes**
- **Regla:** Para un mismo `(budgetId, categoryCode, itemKey, year, month)` pueden existir:
  - 1 entrada con `scenario = BUDGET`
  - 1 entrada con `scenario = ACTUAL`
- **Comparación:** Sistema compara parejas BUDGET vs ACTUAL

#### **RN-004: Categorías clonan desde plantilla**
- **Regla:** Al crear un presupuesto nuevo, se clonan categorías de plantilla base
- **Personalización:** Usuario puede modificar categorías después del clonado
- **Independencia:** Cambios en un presupuesto NO afectan otros presupuestos

#### **RN-005: Moneda única CLP**
- **Regla:** Todos los montos son en CLP
- **Restricción:** No se permiten montos en otras monedas en MVP
- **Display:** UI muestra formato chileno (ej: "$1.234.567")

#### **RN-006: Presupuesto permanente**
- **Regla:** Un presupuesto NO está atado a un año específico
- **Timeline:** Un presupuesto puede contener datos de cualquier año
- **Longevidad:** Presupuestos persisten indefinidamente (hasta eliminación manual)

---

## 6. Contradicciones Detectadas

### 6.1 Contradicción: Categorías Globales vs Por Presupuesto

**Documentos Anteriores:**
- `spec-mvp-budget-access-model.md` especifica **categorías globales** compartidas entre presupuestos
- `spec-budget-hierarchy-mvp.md` diseña modelo con categorías globales

**Decisión Actual:**
- **Categorías POR presupuesto** (NOT globales)

**Impacto:**
- ✅ **Resolución:** Se adopta la decisión actual (categorías por presupuesto)
- ⚠️ **Acción requerida:** Documentos anteriores deben ser marcados como obsoletos en la sección de categorías
- ✅ **Modelo final:** `Category` tiene FK `budgetId`

**Justificación del Cambio:**
- Mayor flexibilidad: cada presupuesto puede tener estructura única
- Evita contaminación: categorías irrelevantes no aparecen en presupuestos personales
- Alineado con plantilla clonable: cada presupuesto parte con su propia copia

---

### 6.2 No se Detectan Vacíos Críticos

**Cobertura del Diseño:**
- ✅ Modelo de datos completo (User, Budget, BudgetAccess, Category, MonthlyEntry)
- ✅ Reglas de negocio definidas
- ✅ Casos de uso cubiertos
- ✅ UI/UX conceptualizada (dashboard + vista mensual)

**Áreas con Detalle Pendiente (No Bloqueantes):**
- ⚠️ Especificación exacta de API REST endpoints (definir en fase de implementación)
- ⚠️ Diseño visual/mockups de UI (wireframes conceptuales suficientes para MVP)
- ⚠️ Autenticación/autorización (simplificado en MVP, robustecer post-MVP)
- ⚠️ Testing strategy (definir en desarrollo)

---

## 7. Próximos Pasos (NO Implementar Todavía)

### 7.1 Validaciones Pendientes

1. **Validar estructura de categorías con usuarios finales:**
   - ¿La plantilla base cubre necesidades de Seba y Mona?
   - ¿Se necesitan múltiples plantillas?

2. **Mockups de UI:**
   - Dashboard global
   - Vista mensual con árbol de categorías
   - Selector de presupuesto

3. **Decisiones abiertas (sección 4.2):**
   - Definir comportamiento de edición concurrente
   - Definir política de eliminación de categorías
   - Definir período del dashboard

### 7.2 Orden de Implementación Sugerido

**Fase 1: Backend Core** (1-2 semanas)
1. Setup Prisma con schema completo
2. Seeders de plantilla base
3. CRUD de Budget, User, BudgetAccess
4. CRUD de Category (con validación de árbol)
5. CRUD de MonthlyEntry (con validaciones de negocio)

**Fase 2: API REST** (1 semana)
1. Endpoints de autenticación básica
2. Endpoints de presupuestos
3. Endpoints de categorías
4. Endpoints de monthly entries
5. Endpoint de resumen/balance

**Fase 3: Frontend Core** (2-3 semanas)
1. Setup React + RSuite
2. Dashboard global
3. Selector de presupuesto (header)
4. Vista mensual con categorías
5. Formularios de edición

**Fase 4: Integración y Testing** (1 semana)
1. Testing end-to-end
2. Validación con usuarios reales (Seba, Mona)
3. Ajustes de UX
4. Fixes de bugs

**Total Estimado:** 5-7 semanas

---

## 8. Conclusión

Este documento consolida todas las decisiones tomadas para el MVP de Finanzapp. El sistema será una aplicación de **planificación y control financiero mensual** con soporte para **múltiples presupuestos compartidos**.

**Decisiones Core Cerradas:**
- ✅ Entidad principal: `MonthlyEntry`
- ✅ Presupuesto permanente (no anual)
- ✅ Categorías por presupuesto (no globales)
- ✅ Plantilla base clonable
- ✅ Solo categorías hoja pueden tener monto
- ✅ Moneda única: CLP
- ✅ Acceso compartido multi-usuario
- ✅ Dashboard global como punto de entrada

**Riesgos Abiertos:**
- ⚠️ Gestión de categorías duplicadas entre presupuestos
- ⚠️ Plantilla base puede no cubrir todos los casos
- ⚠️ Performance de queries recursivas (bajo impacto)

**Contradicciones Resueltas:**
- ✅ Categorías globales → Categorías por presupuesto (decisión final confirmada)

**Estado del Proyecto:**
- Diseño conceptual completo
- Modelo de datos definido
- Listo para implementación (cuando se autorice)

---

**FIN DEL DOCUMENTO**

**Versión:** 1.0  
**Autor:** Consolidación automática de especificaciones previas  
**Documentsos Fuente:**
- `feasibility-multi-budget-audit.md`
- `spec-budget-hierarchy-mvp.md`
- `spec-mvp-budget-access-model.md`
- `spec-mvp-monthly-planning-model.md`
