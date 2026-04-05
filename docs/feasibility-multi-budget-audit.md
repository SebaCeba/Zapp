# Auditoría de Factibilidad: Múltiples Presupuestos

**Fecha:** 2026-03-15  
**Estado:** Análisis Técnico - NO IMPLEMENTAR  
**Objetivo:** Evaluar la viabilidad de soportar múltiples presupuestos (ej: "Presupuesto Hogar", "Presupuesto Personal Seba")

---

## 1. Contexto del Problema

### Situación Actual
La aplicación Finanzapp actualmente opera bajo el supuesto de un **único presupuesto global implícito**. No existe concepto de "usuario", "presupuesto" o "contexto activo" en el modelo de datos. Toda la información presupuestaria se almacena directamente sin referencia a quién o qué presupuesto pertenece.

### Objetivo Funcional
Permitir que un usuario maneje múltiples presupuestos independientes y pueda cambiar entre ellos. Casos de uso:
- **Presupuesto Hogar** (gastos compartidos)
- **Presupuesto Personal Seba** (gastos individuales)

---

## 2. Hallazgos del Modelo Actual

### 2.1 Estructura de Datos Actual (Schema Prisma)

#### ❌ **NO EXISTE:**
- Tabla `User` o `Usuario`
- Tabla `Budget` o `Presupuesto` (como entidad raíz)
- Foreign keys hacia un presupuesto padre
- Concepto de "presupuesto activo" o "contexto"

#### ✅ **EXISTEN (fragmentados):**

**Tablas de Presupuesto por Categoría:**
- `PresupuestoIngreso` → vinculada a `IngresoBase` + año
- `PresupuestoServicioBasico` → vinculada a `ServicioBasico` + año
- `PresupuestoAhorro` → vinculada a `Ahorro` + año
- `SupermercadoPresupuesto` → tabla standalone por año
- `Subscription` → maneja sus propias fechas/periodicidad
- `Obligacion` → autónomas con mes/año inicio
- `MortgagePayment` → datos hipotecarios standalone

**Tablas de Datos Reales (Actual):**
- `ActualEntry` → datos reales sin FK a presupuesto
- `TenpoPurchase` → compras TC sin FK a presupuesto
- `TenpoPayment` → pagos TC sin FK a presupuesto
- `UtilityTransaction` → transacciones servicios básicos sin FK a presupuesto

**Catálogos y Configuraciones:**
- `IngresoBase`, `ServicioBasico`, `Ahorro` → catálogos globales
- `MerchantCategory`, `MerchantMapping` → categorización global
- `TcBillingConfig`, `TenpoTasaCuotas` → configuración global

---

### 2.2 Supuestos Actuales que Bloquean Multi-Presupuesto

#### Backend (`node-version/src/`)

**Servicio Consolidado (`services/consolidado.ts`):**
```typescript
export async function getMonthlyBudget(year: number, month: number): Promise<MonthlyBudget>
```
- ❌ No recibe parámetro `budgetId`
- ❌ Asume un único presupuesto global
- ❌ Consulta directa: `prisma.presupuestoIngreso.findMany({ where: { anio: year } })`

**Rutas API:**
- `GET /api/ingresos/presupuesto/:anio` → no requiere budgetId
- `GET /api/servicios-basicos/presupuesto/:anio` → no requiere budgetId
- `GET /api/supermercado/presupuesto/:anio` → no requiere budgetId
- `GET /api/ahorros/presupuesto/:anio` → no requiere budgetId
- `GET /api/actual/:year/:month` → no requiere budgetId

**Consultas Prisma:**
```typescript
// Ejemplo en routes/ingresos.ts
const presupuestos = await prisma.presupuestoIngreso.findMany({
  where: { anio: year }
  // ❌ Falta: budgetId: currentBudgetId
});
```

#### Frontend (`node-version/client/src/`)

**Páginas:**
- `Presupuesto.tsx` → carga datos sin especificar presupuesto
- `Actual.tsx` → compara actual vs presupuesto sin contexto
- `Ingresos.tsx`, `ServiciosBasicos.tsx`, `Supermercado.tsx`, etc. → todas asumen un único presupuesto

**Navegación:**
- `Sidebar.tsx` → sin selector de presupuesto
- `menuConfig.ts` → menú sin contexto de presupuesto

**Estado de la Aplicación:**
- ❌ No existe contexto global para el presupuesto activo
- ❌ No hay selector/switcher de presupuesto en UI
- ❌ No se persiste "último presupuesto usado"

**APIs Frontend:**
```typescript
// Ejemplo en api/actualApi.ts
export async function fetchActualSummary(year: number, month: number): Promise<ActualSummary> {
  const response = await fetch(`http://localhost:3000/api/actual/${year}/${month}`);
  // ❌ Falta: ?budgetId=${currentBudgetId}
}
```

---

## 3. Opciones de Diseño para Múltiples Presupuestos

### Opción 1: **Mínima (Budget as Metadata)**

#### Descripción
Agregar campo `budgetName` a cada tabla de presupuesto existente como string. Sin normalización.

#### Cambios de Backend
```prisma
model PresupuestoIngreso {
  // ... campos actuales
  budgetName String @default("default") @map("budget_name")
  
  @@unique([ingresoId, anio, budgetName]) // Cambio de índice
}

model PresupuestoServicioBasico {
  // ... campos actuales
  budgetName String @default("default") @map("budget_name")
  
  @@unique([servicioId, anio, budgetName])
}

// Repetir para: PresupuestoAhorro, SupermercadoPresupuesto
// Agregar budgetName a: ActualEntry, TenpoPurchase, UtilityTransaction
```

**Servicios:**
```typescript
export async function getMonthlyBudget(
  year: number, 
  month: number, 
  budgetName: string = "default"
): Promise<MonthlyBudget>
```

**Rutas:**
```typescript
router.get('/presupuesto/:anio', async (req, res) => {
  const budgetName = req.query.budgetName as string || "default";
  // Agregar where: { budgetName } a todas las queries
});
```

#### Cambios de Frontend
- Estado global: `useBudgetContext()` con `currentBudget` ("Hogar" | "Personal Seba")
- Selector en `Sidebar.tsx`: dropdown para cambiar presupuesto
- Todas las llamadas API agregan `?budgetName=${currentBudget}`
- LocalStorage para persistir último presupuesto seleccionado

#### Riesgos
- ⚠️ Denormalización: budgetName repetido en múltiples tablas
- ⚠️ No hay validación de budgets existentes
- ⚠️ Difícil renombrar presupuestos (updates en cascada manual)
- ⚠️ No hay metadata del presupuesto (color, descripción, fecha creación)

#### Compatibilidad con Datos Actuales
- ✅ Buena: Migración agrega `budgetName = "default"` a registros existentes
- ✅ Los datos actuales quedan bajo presupuesto "default"

#### Complejidad Estimada
- **Backend:** 3 días (migración + servicios + rutas)
- **Frontend:** 2 días (contexto + selector + integración)
- **Total:** 1 semana

---

### Opción 2: **Intermedia (Budget Tabla Normalizada)**

#### Descripción
Crear tabla `Budget` central con foreign keys desde todas las tablas de presupuesto. Catálogos siguen siendo globales (compartidos entre presupuestos).

#### Cambios de Backend
```prisma
model Budget {
  id                    Int      @id @default(autoincrement())
  name                  String   @unique // "Hogar", "Personal Seba"
  description           String?
  color                 String?  // Hex color para UI
  isDefault             Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  presupuestosIngresos  PresupuestoIngreso[]
  presupuestosServicios PresupuestoServicioBasico[]
  presupuestosAhorros   PresupuestoAhorro[]
  presupuestosSuper     SupermercadoPresupuesto[]
  actualEntries         ActualEntry[]
  tenpoPurchases        TenpoPurchase[]
  utilityTransactions   UtilityTransaction[]
  
  @@map("budgets")
}

model PresupuestoIngreso {
  // ... campos actuales
  budgetId Int @map("budget_id")
  budget   Budget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  
  @@unique([budgetId, ingresoId, anio])
}

// Repetir FK budgetId para todas las tablas de presupuesto
```

**Catálogos siguen siendo globales:**
- `IngresoBase`, `ServicioBasico`, `Ahorro` → NO tienen budgetId
- Un mismo `IngresoBase` puede tener múltiples `PresupuestoIngreso` (uno por budget)

**Servicios:**
```typescript
export async function getMonthlyBudget(
  budgetId: number, 
  year: number, 
  month: number
): Promise<MonthlyBudget> {
  const ingresos = await prisma.presupuestoIngreso.findMany({
    where: { budgetId, anio: year },
    include: { ingreso: true }
  });
  // ...
}
```

**Rutas:**
```typescript
router.get('/presupuesto/:anio', async (req, res) => {
  const budgetId = parseInt(req.query.budgetId as string);
  const presupuestos = await prisma.presupuestoIngreso.findMany({
    where: { budgetId, anio: parseInt(req.params.anio) },
    include: { ingreso: true }
  });
  res.json(presupuestos);
});
```

#### Cambios de Frontend
- Estado global: `useBudgetContext()` con `currentBudgetId`
- Selector en `Sidebar.tsx`: dropdown con lista de budgets desde `GET /api/budgets`
- Todas las llamadas API agregan `?budgetId=${currentBudgetId}`
- LocalStorage almacena `lastBudgetId`

**Nuevas páginas:**
- `/configuracion/presupuestos` → CRUD de presupuestos

#### Riesgos
- ⚠️ Migración compleja: crear budget "default" y asociar todos los registros existentes
- ⚠️ Todas las queries requieren budgetId (posible overhead)
- ⚠️ Catálogos compartidos pueden generar confusión (¿IngresoBase "Sueldo" aplica a ambos presupuestos?)

#### Compatibilidad con Datos Actuales
- ✅ Buena: Migración crea `Budget(id=1, name="default")` y asigna `budgetId=1` a todos los registros existentes
- ⚠️ Requiere script de migración cuidadoso

#### Complejidad Estimada
- **Backend:** 5 días (migración + modelo + servicios + rutas + tests)
- **Frontend:** 3 días (contexto + selector + CRUD presupuestos + integración)
- **Total:** 1.5-2 semanas

---

### Opción 3: **Escalable (Budget + User Multi-Tenant)**

#### Descripción
Sistema completo multi-usuario con autenticación. Cada usuario puede tener múltiples presupuestos. Incluye permisos, compartir presupuestos, etc.

#### Cambios de Backend
```prisma
model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  createdAt     DateTime @default(now())
  
  budgets       Budget[]
  budgetShares  BudgetShare[] // Presupuestos compartidos
  
  @@map("users")
}

model Budget {
  id            Int      @id @default(autoincrement())
  name          String
  description   String?
  color         String?
  ownerId       Int      @map("owner_id")
  owner         User     @relation(fields: [ownerId], references: [id])
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  
  shares        BudgetShare[]
  // ... relaciones con presupuestos
  
  @@unique([ownerId, name])
  @@map("budgets")
}

model BudgetShare {
  id        Int      @id @default(autoincrement())
  budgetId  Int      @map("budget_id")
  userId    Int      @map("user_id")
  role      String   // viewer, editor, admin
  budget    Budget   @relation(fields: [budgetId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([budgetId, userId])
  @@map("budget_shares")
}

// Todas las tablas de presupuesto tienen budgetId (como Opción 2)
```

**Autenticación:**
- JWT tokens
- Middleware de autenticación en todas las rutas
- Session management

**Rutas:**
```typescript
// Middleware de autenticación
router.use(authMiddleware);

router.get('/presupuesto/:anio', async (req, res) => {
  const userId = req.user.id; // Del JWT
  const budgetId = parseInt(req.query.budgetId as string);
  
  // Validar que el usuario tiene acceso al presupuesto
  const access = await checkBudgetAccess(userId, budgetId);
  if (!access) return res.status(403).json({ error: 'Forbidden' });
  
  // Query normal...
});
```

#### Cambios de Frontend
- **Login/Registro:** páginas de autenticación
- **Estado global:** `useAuth()` + `useBudgetContext()`
- **Selector de presupuesto:** dropdown filtrado por presupuestos del usuario
- **Gestión de presupuestos:** CRUD completo + compartir
- **Permisos:** UI condicional según rol (viewer/editor/admin)

#### Riesgos
- 🔴 Cambio arquitectónico mayor
- 🔴 Overhead de desarrollo significativo (autenticación, permisos, UX multi-usuario)
- 🔴 Migración compleja: crear usuario "default" y asignar todos los datos
- 🔴 Requiere decisiones de producto: ¿registro abierto? ¿invitaciones? ¿pricing?

#### Compatibilidad con Datos Actuales
- ⚠️ Moderada: Migración crea `User(id=1, email="admin@local")` y `Budget(id=1, ownerId=1, name="default")`
- ⚠️ Todos los datos existentes quedan bajo usuario/budget default

#### Complejidad Estimada
- **Backend:** 10-15 días (auth + permisos + migración + servicios + rutas + tests)
- **Frontend:** 7-10 días (auth UI + contexto + permisos + CRUD + integración)
- **Total:** 3-5 semanas

---

## 4. Análisis Comparativo

| Criterio                  | Opción 1: Mínima | Opción 2: Intermedia | Opción 3: Escalable |
|---------------------------|------------------|----------------------|---------------------|
| **Tiempo Desarrollo**     | 1 semana         | 1.5-2 semanas        | 3-5 semanas         |
| **Complejidad Backend**   | Baja             | Media                | Alta                |
| **Complejidad Frontend**  | Baja             | Media                | Alta                |
| **Normalización Datos**   | ❌ No            | ✅ Sí                | ✅ Sí               |
| **Escalabilidad**         | ⚠️ Limitada      | ✅ Buena             | ✅ Excelente        |
| **Multi-Usuario**         | ❌ No            | ❌ No                | ✅ Sí               |
| **Compartir Presupuesto** | ❌ No            | ❌ No                | ✅ Sí               |
| **Compatibilidad Datos**  | ✅ Excelente     | ✅ Buena             | ⚠️ Moderada         |
| **Riesgo de Migración**   | 🟢 Bajo          | 🟡 Medio             | 🔴 Alto             |
| **ROI Corto Plazo**       | ✅ Alto          | ✅ Medio             | ❌ Bajo             |

---

## 5. Recomendación para MVP

### **Opción Recomendada: Opción 2 (Budget Tabla Normalizada)**

#### Justificación
1. **Balance costo/beneficio:** Resuelve el caso de uso sin over-engineering
2. **Normalización adecuada:** Modelo de datos limpio y escalable
3. **Sin multi-usuario complejo:** Evita overhead de autenticación (no es requisito inicial)
4. **Migración manejable:** Riesgo medio pero controlable
5. **Fundación sólida:** Si en el futuro se necesita multi-usuario, la Opción 3 se construye sobre esta

#### Por qué NO Opción 1
- Denormalización riesgosa
- Difícil de escalar o extender
- Renombrar presupuestos sería un caos

#### Por qué NO Opción 3
- Over-engineering para el caso de uso actual
- Multi-usuario no es requisito MVP
- Tiempo de desarrollo 3-5x mayor
- Complejidad innecesaria (autenticación, permisos, compartir)

---

## 6. Plan de Implementación Recomendado (Opción 2)

### Fase 1: Modelo de Datos (2 días)
1. Crear modelo `Budget` en Prisma
2. Escribir migración que:
   - Crea tabla `budgets`
   - Inserta budget default: `{ id: 1, name: "default", isDefault: true }`
   - Agrega columna `budgetId` a todas las tablas de presupuesto
   - Asigna `budgetId = 1` a todos los registros existentes
   - Crea foreign keys y constraints
3. Probar migración en copia de BD

### Fase 2: Backend (3 días)
1. Actualizar servicios:
   - `getMonthlyBudget(budgetId, year, month)`
   - Todos los servicios de consolidado
2. Actualizar rutas:
   - Agregar parámetro `budgetId` a todas las rutas de presupuesto
   - Crear CRUD de budgets: `POST /api/budgets`, `GET /api/budgets`, `PATCH /api/budgets/:id`, `DELETE /api/budgets/:id`
3. Tests unitarios

### Fase 3: Frontend (3 días)
1. Crear `BudgetContext` y `useBudgetContext()`:
   ```typescript
   interface BudgetContextValue {
     currentBudgetId: number;
     budgets: Budget[];
     setCurrentBudget: (id: number) => void;
     loadBudgets: () => Promise<void>;
   }
   ```
2. Agregar selector de presupuesto en `Sidebar.tsx`
3. Actualizar todas las llamadas API para incluir `budgetId`
4. Persistir `lastBudgetId` en LocalStorage
5. Crear página `/configuracion/presupuestos` para gestionar budgets

### Fase 4: Testing & QA (1 día)
1. Pruebas end-to-end: cambio de presupuesto, creación, eliminación
2. Validar migración de datos
3. Verificar que presupuesto "default" funciona igual que antes

---

## 7. Lista de Archivos a Tocar (Opción 2)

### Backend (`node-version/`)

**Schema & Migraciones:**
- `prisma/schema.prisma` → agregar modelo `Budget` + FK en todas las tablas
- `prisma/migrations/YYYYMMDDHHMMSS_add_multi_budget/migration.sql` → nueva migración

**Servicios:**
- `src/services/consolidado.ts` → agregar parámetro `budgetId`

**Rutas:**
- `src/routes/ingresos.ts` → agregar filtro `budgetId`
- `src/routes/servicios-basicos.ts` → agregar filtro `budgetId`
- `src/routes/supermercado.ts` → agregar filtro `budgetId`
- `src/routes/ahorros.ts` → agregar filtro `budgetId`
- `src/routes/actual.ts` → agregar filtro `budgetId`
- `src/routes/tenpo.ts` → agregar filtro `budgetId` (si aplica)
- `src/routes/utilities.ts` → agregar filtro `budgetId`
- **NUEVO:** `src/routes/budgets.ts` → CRUD de presupuestos

**Seed:**
- `src/seed.ts` → crear budget "default" automáticamente

### Frontend (`node-version/client/src/`)

**Contexto:**
- **NUEVO:** `contexts/BudgetContext.tsx` → estado global de presupuesto

**Navegación:**
- `components/Sidebar.tsx` → agregar selector de presupuesto
- `navigation/menuConfig.ts` → (opcional) filtrar menú por presupuesto

**Páginas:**
- `pages/Presupuesto.tsx` → usar `budgetId` en llamadas API
- `pages/Actual.tsx` → usar `budgetId` en llamadas API
- `pages/Ingresos.tsx` → usar `budgetId`
- `pages/ServiciosBasicos.tsx` → usar `budgetId`
- `pages/Supermercado.tsx` → usar `budgetId`
- `pages/Ahorros.tsx` → usar `budgetId`
- `pages/ActualTenpo.tsx` → usar `budgetId`
- `pages/ActualUtilities.tsx` → usar `budgetId`
- **NUEVO:** `pages/ConfiguracionPresupuestos.tsx` → CRUD de budgets

**APIs:**
- `api/actualApi.ts` → agregar parámetro `budgetId`
- (todas las funciones de fetch deben agregar `?budgetId=${budgetId}`)

**Tipos:**
- **NUEVO:** `types/budget.ts` → interfaces de Budget

**Total Estimado de Archivos:**
- Backend: ~12 archivos
- Frontend: ~15 archivos
- **Total: ~27 archivos**

---

## 8. Datos de Prueba para Validación

### Escenarios de Prueba Post-Implementación

1. **Presupuesto Default:**
   - Verificar que datos existentes funcionan igual que antes
   - Budget "default" (id=1) contiene todos los registros actuales

2. **Crear Nuevo Presupuesto:**
   - Crear "Presupuesto Hogar"
   - Agregar ingresos/gastos específicos
   - Verificar aislamiento de datos (no contamina "default")

3. **Cambio de Presupuesto:**
   - Cambiar entre "default" y "Hogar"
   - Verificar que UI se actualiza correctamente
   - Verificar que LocalStorage persiste selección

4. **Eliminar Presupuesto:**
   - Eliminar presupuesto vacío → ✅ OK
   - Intentar eliminar presupuesto con datos → ❌ Error o confirmación con cascade

5. **Presupuesto Compartido (futuro):**
   - Base para Opción 3 si se implementa multi-usuario

---

## 9. Conclusiones

### Estado Actual
- ✅ **Sistema funcional** con presupuesto único implícito
- ❌ **Bloqueador:** Modelo de datos sin concepto de presupuesto como entidad
- ⚠️ **Deuda técnica moderada:** Fragmentación de tablas de presupuesto

### Factibilidad
- ✅ **Técnicamente factible** con Opción 2
- ⚠️ **Requiere migración cuidadosa** de datos existentes
- ✅ **ROI positivo** para el caso de uso (Hogar vs Personal)

### Próximos Pasos (No implementar aún)
1. **Validar caso de uso:** Confirmar que múltiples presupuestos resuelven el problema real
2. **Aprobar Opción 2:** Validar que la recomendación es correcta
3. **Estimar en detalle:** Desglosar tareas en issues/tickets
4. **Planificar migración:** Backup + script de migración + rollback plan
5. **Implementar en fases:** Backend → Migración → Frontend

---

**FIN DEL DOCUMENTO**
