# Plan de Implementación: MVP Finanzapp

**Fecha:** 2026-03-15  
**Estado:** Plan de Ejecución - NO IMPLEMENTAR TODAVÍA  
**Versión:** 1.0  
**Propósito:** Definir el plan de implementación por fases para el MVP de Finanzapp con menor riesgo posible

---

## 1. Resumen Ejecutivo

### 1.1 Objetivo del MVP

Implementar un **sistema de planificación y control financiero mensual multi-presupuesto** con:
- Dashboard global como punto de entrada
- Múltiples presupuestos (Hogar, Personal Seba, Personal Mona)
- Categorías jerárquicas por presupuesto
- Comparación mensual BUDGET vs ACTUAL
- Acceso compartido entre usuarios

### 1.2 Alcance Total Estimado

**Tiempo Total:** 8-10 semanas  
**Fases:** 6 (Fase 0-5)  
**Archivos Nuevos:** ~30-40 archivos  
**Archivos Modificados:** ~10-15 archivos existentes  
**Líneas de Código Estimadas:** ~8,000-10,000 LOC

---

## 2. Estructura de Fases

```
FASE 0: Preparación y Auditoría Final (1 semana)
  │
  ├─> FASE 1: Schema y Migraciones Prisma (1 semana)
  │     │
  │     ├─> FASE 2: Backend API (2-3 semanas)
  │     │     │
  │     │     ├─> FASE 3: Frontend MVP (3-4 semanas)
  │     │     │     │
  │     │     │     └─> FASE 5: QA y Testing (1 semana)
  │     │     │
  │     │     └─> FASE 4: Migración de Datos Legacy (1-2 semanas) [PARALELO]
  │     │
  │     └─> Checkpoint: Schema validado antes de continuar
  │
  └─> Checkpoint: Especificaciones aprobadas antes de comenzar
```

**Nota:** Fase 4 (Migración de Datos Legacy) puede ejecutarse en paralelo con Fase 3 (Frontend)

---

## 3. Fase 0: Preparación y Auditoría Final

### 3.1 Objetivo

**Validar especificaciones técnicas y preparar entorno de desarrollo antes de escribir código.**

### 3.2 Tareas

#### **T0.1: Revisión de Especificaciones**
- [ ] Revisar `architecture-decisions-finanzapp-mvp.md` con stakeholders
- [ ] Revisar `spec-final-mvp-data-model.md` con equipo técnico
- [ ] Revisar `spec-mvp-navigation-ux.md` con usuarios finales (Seba, Mona)
- [ ] Obtener aprobación formal de todas las decisiones

**Entregable:** ✅ Especificaciones aprobadas por escrito

#### **T0.2: Preparación de Entorno**
- [ ] Crear branch `feature/mvp-multi-budget` desde `master`
- [ ] Configurar base de datos de desarrollo (SQLite nueva, NO tocar la actual)
- [ ] Actualizar dependencias de Prisma si es necesario
- [ ] Configurar variables de entorno para desarrollo (`DATABASE_URL_MVP`)

**Entregable:** ✅ Entorno de desarrollo aislado funcionando

#### **T0.3: Fixture de Plantilla Base**
- [ ] Crear `node-version/fixtures/default-categories.ts` con categorías base
- [ ] Validar estructura de plantilla con usuarios
- [ ] Documentar cómo se usará la plantilla en seed

**Entregable:** ✅ Archivo de plantilla validado (sin implementar aún)

#### **T0.4: Análisis de Riesgo Final**
- [ ] Identificar componentes críticos del frontend actual
- [ ] Evaluar estrategia de migración incremental vs big bang
- [ ] Definir plan de rollback si algo falla

**Entregable:** ✅ Documento de mitigación de riesgos

---

### 3.3 Archivos a Crear/Modificar

**Crear:**
- `node-version/fixtures/default-categories.ts`
- `docs/migration-rollback-plan.md` (opcional)
- `.env.development.mvp` (variables de entorno)

**Modificar:**
- `README.md` (actualizar instrucciones de desarrollo)
- `.gitignore` (ignorar `dev-mvp.db` si se usa SQLite)

---

### 3.4 Criterios de Aceptación

- ✅ Todas las especificaciones revisadas y aprobadas
- ✅ Branch `feature/mvp-multi-budget` creado
- ✅ Base de datos de desarrollo configurada y aislada de producción
- ✅ Fixture de plantilla base validada
- ✅ Plan de rollback documentado

---

### 3.5 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Especificaciones incompletas | 🔴 Alta | Revisión exhaustiva antes de comenzar |
| Stakeholders no disponibles para aprobación | 🟡 Media | Agendar reuniones con anticipación |
| Entorno de desarrollo conflictivo | 🟡 Media | Usar base de datos separada (`dev-mvp.db`) |

---

### 3.6 Estimación de Tiempo

**Duración:** 1 semana (5 días hábiles)

---

---

## 4. Fase 1: Schema y Migraciones Prisma

### 4.1 Objetivo

**Definir y aplicar el schema de base de datos MVP en un entorno aislado, validar sin afectar datos actuales.**

### 4.2 Tareas

#### **T1.1: Definir Schema Prisma**
- [ ] Crear archivo `node-version/prisma/schema-mvp.prisma` (o renombrar actual a `schema-legacy.prisma`)
- [ ] Definir modelo `User`
- [ ] Definir modelo `Budget`
- [ ] Definir modelo `BudgetAccess`
- [ ] Definir modelo `BudgetCategory`
- [ ] Definir modelo `MonthlyEntry`
- [ ] Configurar relaciones y constraints

**Entregable:** ✅ Schema Prisma completo según `spec-final-mvp-data-model.md`

#### **T1.2: Generar Migración Inicial**
- [ ] Ejecutar `npx prisma migrate dev --name init_mvp_schema`
- [ ] Revisar SQL generado en `prisma/migrations/`
- [ ] Validar que no afecta tablas legacy (usar base de datos separada)

**Entregable:** ✅ Migración SQL generada y revisada

#### **T1.3: Aplicar Migración en Dev**
- [ ] Aplicar migración en base de datos de desarrollo
- [ ] Verificar que todas las tablas se crearon correctamente
- [ ] Verificar constraints (UNIQUEs, FKs, INDEXes)

**Entregable:** ✅ Base de datos MVP creada y validada

#### **T1.4: Crear Seed Inicial**
- [ ] Crear `node-version/prisma/seed-mvp.ts`
- [ ] Seed de usuarios iniciales (Seba, Mona)
- [ ] Seed de presupuestos iniciales (Hogar, Seba, Mona)
- [ ] Seed de BudgetAccess (permisos)
- [ ] Seed de categorías base (usando fixture de Fase 0)
- [ ] Ejecutar `npx prisma db seed`

**Entregable:** ✅ Datos iniciales cargados en base de datos dev

#### **T1.5: Generar Prisma Client**
- [ ] Ejecutar `npx prisma generate`
- [ ] Verificar que tipos TypeScript se generaron correctamente
- [ ] Crear types adicionales si es necesario (`node-version/src/types/mvp.ts`)

**Entregable:** ✅ Prisma Client listo para usar en backend

---

### 4.3 Archivos a Crear/Modificar

**Crear:**
- `node-version/prisma/schema-mvp.prisma` (o renombrar actual)
- `node-version/prisma/migrations/XXXXXX_init_mvp_schema/migration.sql`
- `node-version/prisma/seed-mvp.ts`
- `node-version/src/types/mvp.ts`

**Modificar:**
- `node-version/package.json` (configurar script de seed)
- `node-version/prisma/schema.prisma` → renombrar a `schema-legacy.prisma` (mantener como backup)

---

### 4.4 Criterios de Aceptación

- ✅ Schema Prisma define las 5 tablas exactamente según especificación
- ✅ Migración aplicada exitosamente en base de datos dev
- ✅ Constraints funcionando (unique, FK, indexes)
- ✅ Seed ejecutado con datos iniciales correctos
- ✅ Prisma Client generado sin errores
- ✅ No hay conflictos con schema legacy (bases de datos separadas)

---

### 4.5 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Conflicto con schema legacy | 🔴 Alta | Usar base de datos separada para MVP |
| Migración falla por constraints inválidos | 🟡 Media | Revisar SQL generado manualmente antes de aplicar |
| Seed falla por datos inválidos | 🟢 Baja | Validar fixture antes de seed |
| Foreign keys compuestas causan problemas | 🟡 Media | Probar relaciones con queries de prueba |

---

### 4.6 Estimación de Tiempo

**Duración:** 1 semana (5 días hábiles)

**Desglose:**
- Día 1-2: Definir schema y generar migración
- Día 3: Aplicar migración y validar
- Día 4: Crear y ejecutar seed
- Día 5: Testing de schema, generar client, documentar

---

### 4.7 Checkpoint Crítico

**⚠️ NO CONTINUAR A FASE 2 SI:**
- Schema no refleja exactamente la especificación
- Migración falla o genera errores
- Seed no carga datos correctamente
- Prisma Client genera errores de tipos

**✅ Continuar solo cuando:**
- Schema validado por revisor técnico
- Seed ejecuta sin errores
- Queries de prueba básicas funcionan

---

---

## 5. Fase 2: Backend API

### 5.1 Objetivo

**Implementar endpoints REST para soportar todas las operaciones del MVP frontend.**

### 5.2 Tareas

#### **T2.1: Estructura de Servicios**
- [ ] Crear `node-version/src/services/budget.service.ts`
- [ ] Crear `node-version/src/services/category.service.ts`
- [ ] Crear `node-version/src/services/monthly-entry.service.ts`
- [ ] Crear `node-version/src/services/user.service.ts` (opcional si no existe)

**Entregable:** ✅ Capa de servicios estructurada

#### **T2.2: Endpoints de Presupuestos**
- [ ] `GET /api/budgets?userId=:userId` - Listar presupuestos del usuario
- [ ] `GET /api/budgets/:id` - Obtener un presupuesto específico
- [ ] `POST /api/budgets` - Crear presupuesto (con clonación de plantilla)
- [ ] `PUT /api/budgets/:id` - Actualizar información básica
- [ ] `PATCH /api/budgets/:id/archive` - Archivar presupuesto

**Archivos:** `node-version/src/routes/budgets.ts`

**Entregable:** ✅ CRUD de presupuestos funcionando

#### **T2.3: Endpoints de Vista Mensual**
- [ ] `GET /api/budgets/:budgetId/monthly/:year/:month` - Obtener datos mensuales (categorías + entries + summary)
- [ ] `PUT /api/budgets/:budgetId/entries` - Actualizar/crear MonthlyEntry (BUDGET y ACTUAL)
- [ ] `GET /api/budgets/:budgetId/entries?categoryCode=X&year=Y&month=M` - Obtener entry específica

**Archivos:** `node-version/src/routes/monthly.ts`

**Entregable:** ✅ API de vista mensual completa

#### **T2.4: Endpoints de Categorías**
- [ ] `GET /api/budgets/:budgetId/categories` - Listar árbol de categorías
- [ ] `POST /api/budgets/:budgetId/categories` - Crear categoría
- [ ] `PUT /api/budgets/:budgetId/categories/:code` - Actualizar categoría
- [ ] `DELETE /api/budgets/:budgetId/categories/:code` - Eliminar categoría (con validación)

**Archivos:** `node-version/src/routes/categories.ts`

**Entregable:** ✅ CRUD de categorías funcionando

#### **T2.5: Lógica de Clonación de Plantilla**
- [ ] Implementar función `cloneCategoriesFromTemplate(budgetId, templateCategories)`
- [ ] Integrar en `POST /api/budgets`
- [ ] Testing de clonación completa

**Archivos:** `node-version/src/services/budget.service.ts`

**Entregable:** ✅ Clonación de plantilla automática al crear presupuesto

#### **T2.6: Validaciones de Negocio**
- [ ] Validar que solo categorías hoja (`isLeaf=true`) pueden tener entries
- [ ] Validar que categoría pertenece al presupuesto correcto
- [ ] Validar mes válido (1-12)
- [ ] Validar que usuario tiene acceso al presupuesto
- [ ] Validar que no se elimine categoría con entries asociadas

**Archivos:** `node-version/src/middleware/validators.ts`

**Entregable:** ✅ Validaciones implementadas en todos los endpoints

#### **T2.7: Agregaciones y Resúmenes**
- [ ] Implementar cálculo de balance mensual (ingresos - gastos - ahorros)
- [ ] Implementar totales por tipo de categoría (INCOME, EXPENSE, SAVINGS)
- [ ] Implementar resumen en `GET /api/budgets/:budgetId/monthly/:year/:month`

**Archivos:** `node-version/src/services/monthly-entry.service.ts`

**Entregable:** ✅ Resúmenes calculados correctamente

---

### 5.3 Archivos a Crear/Modificar

**Crear (10-15 archivos):**
```
node-version/src/
├── services/
│   ├── budget.service.ts
│   ├── category.service.ts
│   ├── monthly-entry.service.ts
│   └── user.service.ts
├── routes/
│   ├── budgets.ts
│   ├── monthly.ts
│   └── categories.ts
├── middleware/
│   ├── validators.ts
│   └── auth.ts (simplificado para MVP)
└── types/
    └── mvp.ts (si no creado en Fase 1)
```

**Modificar:**
- `node-version/src/index.ts` - Registrar nuevas rutas
- `node-version/src/routes/index.ts` - Exportar nuevas rutas

---

### 5.4 Criterios de Aceptación

**Presupuestos:**
- ✅ Crear presupuesto clona categorías de plantilla automáticamente
- ✅ Listar presupuestos retorna solo los que el usuario tiene acceso
- ✅ Archivar presupuesto marca `is_active = false`

**Vista Mensual:**
- ✅ Endpoint mensual retorna árbol de categorías con entries embebidas
- ✅ Resumen incluye totales de INCOME, EXPENSE, SAVINGS, BALANCE
- ✅ Actualizar entry crea/actualiza ambos records (BUDGET y ACTUAL)

**Categorías:**
- ✅ CRUD completo funciona correctamente
- ✅ Validación impide eliminar categoría con entries asociadas
- ✅ Validación impide crear entry en categoría grupo (`isLeaf=false`)

**Validaciones:**
- ✅ Usuario sin acceso a presupuesto recibe error 403
- ✅ Mes inválido (>12 o <1) rechazado con error 400
- ✅ Categoría inexistente retorna error 404

---

### 5.5 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Queries recursivas lentas (árbol de categorías) | 🟡 Media | Usar materialized path (dot-notation) en lugar de recursión |
| Agregaciones complejas causan performance issues | 🟡 Media | Optimizar queries, agregar índices si es necesario |
| Validaciones incompletas permiten datos inválidos | 🔴 Alta | Testing exhaustivo de casos límite |
| Clonación de plantilla falla parcialmente | 🟡 Media | Usar transacción para asegurar atomicidad |

---

### 5.6 Estimación de Tiempo

**Duración:** 2-3 semanas (10-15 días hábiles)

**Desglose:**
- Semana 1: Servicios + Endpoints de presupuestos + Vista mensual básica
- Semana 2: Endpoints de categorías + Validaciones + Clonación de plantilla
- Semana 3: Agregaciones + Resúmenes + Testing + Fixes

---

### 5.7 Testing de Backend

**Herramientas:** Jest + Supertest (o similar)

**Tests Mínimos:**
- [ ] Test de creación de presupuesto con clonación
- [ ] Test de vista mensual con datos
- [ ] Test de actualización de entry (BUDGET + ACTUAL)
- [ ] Test de validaciones (categoría hoja, permisos, etc.)
- [ ] Test de eliminación de categoría con entries (debe fallar)
- [ ] Test de cálculo de balance mensual

**Cobertura Mínima:** 70% de código crítico

---

---

## 6. Fase 3: Frontend MVP

### 6.1 Objetivo

**Implementar las 5 vistas principales del MVP con navegación funcional.**

### 6.2 Tareas

#### **T3.1: Estructura de Componentes**
- [ ] Crear carpeta `node-version/client/src/pages-mvp/`
- [ ] Crear carpeta `node-version/client/src/components-mvp/`
- [ ] Crear carpeta `node-version/client/src/contexts/`
- [ ] Crear carpeta `node-version/client/src/hooks/mvp/`

**Entregable:** ✅ Estructura de carpetas MVP

#### **T3.2: Contexto y Estado Global**
- [ ] Crear `contexts/BudgetContext.tsx` - Contexto de presupuesto activo
- [ ] Crear `hooks/mvp/useBudget.ts` - Hook para presupuesto actual
- [ ] Crear `hooks/mvp/useMonthlyData.ts` - Hook para datos mensuales con cache

**Archivos:**
```
node-version/client/src/
├── contexts/
│   └── BudgetContext.tsx
└── hooks/mvp/
    ├── useBudget.ts
    └── useMonthlyData.ts
```

**Entregable:** ✅ Estado global de presupuesto funcionando

#### **T3.3: Vista 1 - Dashboard Global**
- [ ] Crear `pages-mvp/DashboardView.tsx`
- [ ] Crear `components-mvp/BudgetCard.tsx`
- [ ] Integrar con `GET /api/budgets?userId=:userId`
- [ ] Mostrar balance del mes actual por presupuesto

**Entregable:** ✅ Dashboard global funcionando

#### **T3.4: Vista 2 - Detalle Mensual**
- [ ] Crear `pages-mvp/BudgetMonthlyView.tsx`
- [ ] Crear `components-mvp/MonthSelector.tsx`
- [ ] Crear `components-mvp/CategoryTreeTable.tsx`
- [ ] Crear `components-mvp/MonthlyEntryModal.tsx`
- [ ] Integrar con `GET /api/budgets/:id/monthly/:year/:month`
- [ ] Implementar expandir/colapsar categorías
- [ ] Implementar modal de edición de entry

**Entregable:** ✅ Vista mensual con edición inline funcionando

#### **T3.5: Vista 3 - Gestión de Categorías**
- [ ] Crear `pages-mvp/CategoryManagementView.tsx`
- [ ] Crear `components-mvp/CategoryFormModal.tsx`
- [ ] Crear `components-mvp/CategoryTreeView.tsx`
- [ ] Integrar con `GET /api/budgets/:id/categories`
- [ ] Implementar CRUD de categorías

**Entregable:** ✅ Gestión de categorías funcionando

#### **T3.6: Vista 4 - Configuración**
- [ ] Crear `pages-mvp/BudgetSettingsView.tsx`
- [ ] Crear `components-mvp/BudgetInfoForm.tsx`
- [ ] Integrar con `PUT /api/budgets/:id`
- [ ] Implementar edición de nombre/descripción
- [ ] Implementar archivar presupuesto

**Entregable:** ✅ Configuración básica funcionando

#### **T3.7: Vista 5 - Crear Presupuesto**
- [ ] Crear `pages-mvp/CreateBudgetWizard.tsx`
- [ ] Crear `components-mvp/TemplatePreview.tsx`
- [ ] Implementar wizard de 2 pasos
- [ ] Integrar con `POST /api/budgets`

**Entregable:** ✅ Creación de presupuesto con preview de plantilla

#### **T3.8: Navegación y Routing**
- [ ] Modificar `router.tsx` para rutas MVP
- [ ] Implementar rutas anidadas `/budgets/:id/...`
- [ ] Crear layout con tabs [Mensual][Categorías][Configuración]
- [ ] Implementar breadcrumbs

**Archivos:**
```
node-version/client/src/
├── router-mvp.tsx (o modificar router.tsx)
└── layout/
    └── BudgetLayout.tsx
```

**Entregable:** ✅ Navegación completa funcionando

#### **T3.9: Formateo y Utilidades**
- [ ] Crear `utils/currency.ts` - Formateo CLP
- [ ] Crear `utils/date.ts` - Formateo de fechas y manejo de meses
- [ ] Crear `utils/tree.ts` - Helpers para árbol de categorías

**Entregable:** ✅ Utilidades reutilizables

---

### 6.3 Archivos a Crear/Modificar

**Crear (~25-30 archivos):**
```
node-version/client/src/
├── pages-mvp/
│   ├── DashboardView.tsx
│   ├── BudgetMonthlyView.tsx
│   ├── CategoryManagementView.tsx
│   ├── BudgetSettingsView.tsx
│   └── CreateBudgetWizard.tsx
├── components-mvp/
│   ├── BudgetCard.tsx
│   ├── MonthSelector.tsx
│   ├── CategoryTreeTable.tsx
│   ├── MonthlyEntryModal.tsx
│   ├── CategoryFormModal.tsx
│   ├── CategoryTreeView.tsx
│   ├── BudgetInfoForm.tsx
│   └── TemplatePreview.tsx
├── contexts/
│   └── BudgetContext.tsx
├── hooks/mvp/
│   ├── useBudget.ts
│   └── useMonthlyData.ts
├── layout/
│   └── BudgetLayout.tsx
└── utils/
    ├── currency.ts
    ├── date.ts
    └── tree.ts
```

**Modificar:**
- `node-version/client/src/router.tsx` - Agregar rutas MVP
- `node-version/client/src/main.tsx` - Envolver con `BudgetProvider`

---

### 6.4 Criterios de Aceptación

**Dashboard Global:**
- ✅ Muestra todas las presupuestos del usuario
- ✅ Muestra balance del mes actual correctamente
- ✅ Click en tarjeta navega a vista mensual

**Vista Mensual:**
- ✅ Tabla jerárquica muestra categorías expandibles
- ✅ Muestra BUDGET y ACTUAL correctamente
- ✅ Variación calculada correctamente
- ✅ Modal de edición guarda BUDGET y ACTUAL
- ✅ Selector de mes cambia datos

**Gestión de Categorías:**
- ✅ Árbol de categorías se visualiza correctamente
- ✅ Crear categoría funciona
- ✅ Editar nombre de categoría funciona
- ✅ Eliminar categoría con entries muestra error

**Configuración:**
- ✅ Editar nombre/descripción funciona
- ✅ Archivar presupuesto lo oculta del dashboard

**Crear Presupuesto:**
- ✅ Wizard muestra preview de plantilla
- ✅ Crear presupuesto redirige a vista mensual
- ✅ Categorías clonadas automáticamente

---

### 6.5 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Performance con árbol grande de categorías | 🟡 Media | Implementar virtualización si es necesario |
| Estado desincronizado entre vistas | 🟡 Media | Usar Context API correctamente, refrescar al navegar |
| Modal de edición no guarda correctamente | 🔴 Alta | Testing exhaustivo de formulario |
| Expansión/colapso de árbol con bugs | 🟡 Media | Usar librería probada o implementar con cuidado |

---

### 6.6 Estimación de Tiempo

**Duración:** 3-4 semanas (15-20 días hábiles)

**Desglose:**
- Semana 1: Estructura + Contexto + Dashboard + Navegación básica
- Semana 2: Vista mensual (70% del esfuerzo frontend)
- Semana 3: Categorías + Configuración + Crear presupuesto
- Semana 4: Polish + Responsive + Fixes

---

---

## 7. Fase 4: Migración de Datos Legacy

### 7.1 Objetivo

**Migrar datos históricos desde tablas legacy al nuevo modelo MVP (opcional para MVP inicial).**

### 7.2 Decisión: ¿Migrar o Empezar de Cero?

**Opción A: Empezar de Cero (RECOMENDADO PARA MVP)**
- ✅ Menos riesgo
- ✅ Validar MVP con datos limpios
- ✅ Migrar después si MVP es exitoso
- ❌ Pierde datos históricos temporalmente

**Opción B: Migrar Datos Legacy**
- ✅ Mantiene continuidad de datos
- ❌ Alto riesgo de bugs en transformación
- ❌ Retrasa validación del MVP
- ❌ Requiere script complejo de transformación

**Recomendación:** Opción A para MVP inicial, Opción B como Fase 4 post-MVP

---

### 7.3 Tareas (Si se decide migrar)

#### **T4.1: Análisis de Datos Legacy**
- [ ] Auditar tablas actuales (PresupuestoIngreso, PresupuestoServicioBasico, etc.)
- [ ] Mapear categorías legacy a categorías MVP
- [ ] Identificar datos que no tienen equivalente en MVP

**Entregable:** ✅ Documento de mapeo de datos

#### **T4.2: Script de Transformación**
- [ ] Crear `node-version/scripts/migrate-legacy-to-mvp.ts`
- [ ] Transformar tablas de presupuesto (12 columnas → 12 filas)
- [ ] Transformar `ActualEntry` a `MonthlyEntry`
- [ ] Crear categorías faltantes si es necesario

**Entregable:** ✅ Script de migración probado

#### **T4.3: Ejecución de Migración**
- [ ] Backup completo de base de datos actual
- [ ] Ejecutar script en entorno de staging
- [ ] Validar datos migrados (queries de verificación)
- [ ] Ejecutar en producción si validación es exitosa

**Entregable:** ✅ Datos legacy migrados correctamente

#### **T4.4: Validación Post-Migración**
- [ ] Comparar totales (ingresos, gastos) antes y después
- [ ] Verificar que no se perdieron datos
- [ ] Probar carga de datos en frontend

**Entregable:** ✅ Validación completa de datos migrados

---

### 7.4 Archivos a Crear

**Crear:**
- `node-version/scripts/migrate-legacy-to-mvp.ts`
- `docs/legacy-data-mapping.md`
- `node-version/scripts/validate-migration.ts`

---

### 7.5 Criterios de Aceptación

- ✅ Todas las categorías legacy mapeadas a categorías MVP
- ✅ Todos los presupuestos mensuales legacy convertidos a MonthlyEntry
- ✅ Totales antes y después de migración coinciden (±1% tolerancia por redondeo)
- ✅ Frontend carga datos migrados sin errores

---

### 7.6 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Pérdida de datos durante migración | 🔴 Alta | Backup completo antes de migrar |
| Mapeo incorrecto de categorías | 🔴 Alta | Revisión manual de mapeo + testing en staging |
| Script falla a mitad de ejecución | 🟡 Media | Usar transacciones, implementar rollback |
| Datos inconsistentes post-migración | 🟡 Media | Scripts de validación exhaustivos |

---

### 7.7 Estimación de Tiempo

**Duración:** 1-2 semanas (5-10 días hábiles)

**Desglose:**
- Día 1-2: Análisis de datos legacy y mapeo
- Día 3-5: Desarrollo de script de migración
- Día 6-7: Testing en staging
- Día 8-9: Ejecución en producción + validación
- Día 10: Fixes y documentación

**Nota:** Esta fase puede ejecutarse en PARALELO con Fase 3 (Frontend)

---

---

## 8. Fase 5: QA y Testing

### 8.1 Objetivo

**Validar que el MVP cumple todos los requisitos funcionales y no tiene bugs críticos.**

### 8.2 Tareas

#### **T5.1: Testing Funcional**
- [ ] Crear presupuesto desde cero
- [ ] Agregar/editar/eliminar categorías
- [ ] Crear entries mensuales (BUDGET y ACTUAL)
- [ ] Navegar entre meses
- [ ] Archivar presupuesto
- [ ] Verificar cálculos de balance
- [ ] Verificar acceso compartido (usuario Seba y Mona ven "Hogar")

**Entregable:** ✅ Checklist de funcionalidad validada

#### **T5.2: Testing de Validaciones**
- [ ] Intentar crear entry en categoría grupo (debe fallar)
- [ ] Intentar eliminar categoría con entries (debe fallar)
- [ ] Intentar acceder a presupuesto sin permisos (debe fallar)
- [ ] Verificar validación de mes (1-12)

**Entregable:** ✅ Validaciones funcionando correctamente

#### **T5.3: Testing de Performance**
- [ ] Cargar presupuesto con 100+ categorías
- [ ] Cargar vista mensual con 12 meses de datos
- [ ] Medir tiempo de carga de dashboard
- [ ] Identificar cuellos de botella

**Entregable:** ✅ Reporte de performance

#### **T5.4: Testing Cross-Browser**
- [ ] Chrome (principal)
- [ ] Firefox
- [ ] Safari (si aplica)
- [ ] Edge

**Entregable:** ✅ Compatibilidad validada

#### **T5.5: Testing de UX**
- [ ] Validar con usuarios finales (Seba, Mona)
- [ ] Recopilar feedback
- [ ] Identificar mejoras críticas vs nice-to-have

**Entregable:** ✅ Feedback de usuarios documentado

#### **T5.6: Fixes de Bugs Críticos**
- [ ] Priorizar bugs encontrados (crítico/alto/medio/bajo)
- [ ] Arreglar bugs críticos y altos
- [ ] Documentar bugs medios/bajos para backlog

**Entregable:** ✅ Bugs críticos resueltos

---

### 8.3 Criterios de Aceptación

- ✅ Todas las funcionalidades del MVP funcionan correctamente
- ✅ No hay bugs críticos (que impidan usar el sistema)
- ✅ Validaciones funcionan en todos los casos
- ✅ Performance aceptable (<2s carga de vista mensual)
- ✅ Compatible con navegadores principales
- ✅ Usuarios finales aprueban el MVP

---

### 8.4 Riesgos

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Bugs críticos descubiertos tarde | 🔴 Alta | Testing continuo durante desarrollo |
| Performance inaceptable | 🟡 Media | Profiling y optimización antes de QA |
| Usuarios rechazan UX | 🟡 Media | Validar wireframes antes de implementar |

---

### 8.5 Estimación de Tiempo

**Duración:** 1 semana (5 días hábiles)

**Desglose:**
- Día 1-2: Testing funcional + validaciones
- Día 3: Testing de performance + cross-browser
- Día 4: Testing con usuarios finales
- Día 5: Fixes de bugs críticos

---

---

## 9. Orden de Implementación Recomendado

### 9.1 Enfoque de Menor Riesgo

**Estrategia:** Implementación incremental validando cada fase antes de continuar

```
┌──────────────────────────────────────────────────────┐
│ FASE 0: Preparación (1 semana)                       │
│ - Aprobar especificaciones                           │
│ - Preparar entorno aislado                           │
│ - Validar plantilla base                             │
└──────────────────────────────────────────────────────┘
          │
          ▼ CHECKPOINT: Especificaciones aprobadas
          │
┌──────────────────────────────────────────────────────┐
│ FASE 1: Schema y Migraciones (1 semana)              │
│ - Definir Prisma schema                              │
│ - Aplicar migración en DB dev                        │
│ - Seed de datos iniciales                            │
└──────────────────────────────────────────────────────┘
          │
          ▼ CHECKPOINT: Schema validado, seed funciona
          │
┌──────────────────────────────────────────────────────┐
│ FASE 2: Backend API (2-3 semanas)                    │
│ - Servicios y endpoints                              │
│ - Validaciones de negocio                            │
│ - Testing de backend                                 │
└──────────────────────────────────────────────────────┘
          │
          ▼ CHECKPOINT: APIs funcionan con Postman/curl
          │
┌──────────────────────────────────────────────────────┐
│ FASE 3: Frontend MVP (3-4 semanas)                   │
│ - 5 vistas principales                               │
│ - Navegación completa                                │
│ - Integración con backend                            │
└──────────────────────────────────────────────────────┘
          │
          ├─────────────────────────────────────────────┐
          │                                             │
          ▼                                             ▼
┌──────────────────────────────┐       ┌────────────────────────────┐
│ FASE 4: Migración Legacy     │       │ FASE 5: QA y Testing       │
│ (1-2 semanas, OPCIONAL)      │       │ (1 semana)                 │
│ - Script de migración        │       │ - Testing funcional        │
│ - Validación de datos        │       │ - Testing con usuarios     │
└──────────────────────────────┘       │ - Fixes de bugs            │
          │                            └────────────────────────────┘
          │                                             │
          └─────────────────┬───────────────────────────┘
                            │
                            ▼ CHECKPOINT FINAL: MVP aprobado
                            │
                  ┌─────────────────────┐
                  │ PRODUCCIÓN          │
                  └─────────────────────┘
```

---

### 9.2 Hitos Críticos

| Hito | Semana | Entregable | Decisión |
|------|--------|------------|----------|
| **H0** | 1 | Especificaciones aprobadas | GO/NO-GO para desarrollo |
| **H1** | 2 | Schema aplicado y validado | GO/NO-GO para backend |
| **H2** | 4-5 | APIs funcionando | GO/NO-GO para frontend |
| **H3** | 8-9 | MVP frontend completo | GO/NO-GO para QA |
| **H4** | 9-10 | QA aprobado | GO/NO-GO para producción |

---

### 9.3 Plan de Rollback

**Si algo falla en producción:**

1. **Inmediato:** Revertir deploy a versión anterior (legacy app)
2. **Corto plazo:** Investigar causa raíz en entorno de staging
3. **Mediano plazo:** Fix del bug + re-testing + re-deploy

**Requisitos para rollback seguro:**
- Base de datos MVP separada de legacy (NO sobrescribir datos actuales)
- Backup completo antes de cambiar producción
- Script de rollback probado en staging

---

---

## 10. Fuera de Alcance del MVP

### 10.1 Funcionalidades Excluidas Explícitamente

#### **❌ NO Implementar:**

**Autenticación Compleja:**
- ❌ Login con password (solo identificación por email)
- ❌ OAuth2 (Google, Facebook, etc.)
- ❌ Recuperación de contraseña
- ❌ Verificación de email
- ❌ Sesiones seguras con JWT

**Roles y Permisos Avanzados:**
- ❌ Roles EDITOR/VIEWER (solo OWNER en MVP)
- ❌ Permisos granulares por categoría
- ❌ Invitaciones por email
- ❌ Flujo de aceptación/rechazo de acceso

**Multi-Moneda:**
- ❌ Soporte de USD, EUR, etc.
- ❌ Tabla de tasas de cambio
- ❌ Conversión automática
- ❌ Campo `currency` en MonthlyEntry

**Importación/Exportación:**
- ❌ Importar desde CSV/Excel
- ❌ Exportar a PDF
- ❌ Exportar a Excel
- ❌ Sincronización con bancos

**Tracking Transaccional Diario:**
- ❌ Registro de compras diarias
- ❌ Libro mayor / libro diario
- ❌ Conciliación bancaria
- ❌ Escaneo de boletas

**Features Avanzadas:**
- ❌ Gráficos y visualizaciones
- ❌ Reportes avanzados
- ❌ Comparación entre presupuestos
- ❌ Vista anual consolidada
- ❌ Presupuestos recurrentes (plantillas adicionales)
- ❌ Notificaciones (email, push)
- ❌ Alertas de sobregasto
- ❌ Metas financieras
- ❌ Predicciones con IA

**UX Avanzada:**
- ❌ Modo oscuro (dark mode)
- ❌ PWA / App móvil
- ❌ Selector de presupuesto en header (solo navegación via dashboard)
- ❌ Búsqueda global
- ❌ Filtros avanzados
- ❌ Copiar mes anterior
- ❌ Vista de spreadsheet editable

**Performance/Escalabilidad:**
- ❌ Paginación de categorías (asumir <200 categorías por presupuesto)
- ❌ Virtualización de listas largas
- ❌ Cache avanzado (Redis)
- ❌ CDN para assets

---

### 10.2 Razón de Exclusión

**Justificación:** MVP debe validar el concepto core:
- ✅ Múltiples presupuestos funcionan?
- ✅ Categorías por presupuesto son útiles?
- ✅ Comparación BUDGET vs ACTUAL es clara?
- ✅ Acceso compartido funciona bien?

**Features excluidas pueden agregarse DESPUÉS de validar el core.**

---

---

## 11. Resumen de Recursos

### 11.1 Estimación de Esfuerzo Total

| Fase | Duración | Esfuerzo (persona-semanas) |
|------|----------|----------------------------|
| Fase 0: Preparación | 1 semana | 1 semana |
| Fase 1: Schema | 1 semana | 1 semana |
| Fase 2: Backend | 2-3 semanas | 2-3 semanas |
| Fase 3: Frontend | 3-4 semanas | 3-4 semanas |
| Fase 4: Migración Legacy (opcional) | 1-2 semanas | 1-2 semanas |
| Fase 5: QA | 1 semana | 1 semana |
| **TOTAL MVP (sin migración)** | **8-10 semanas** | **8-10 semanas** |
| **TOTAL con migración** | **9-12 semanas** | **9-12 semanas** |

**Nota:** Fase 4 puede ejecutarse en paralelo con Fase 3, reduciendo tiempo total.

---

### 11.2 Archivos Estimados

**Nuevos:**
- Backend: ~15 archivos
- Frontend: ~30 archivos
- Prisma: ~5 archivos
- Fixtures/Seeds: ~3 archivos
- **Total:** ~50-55 archivos nuevos

**Modificados:**
- ~10-15 archivos existentes

**Total General:** ~60-70 archivos tocados

---

### 11.3 Líneas de Código Estimadas

| Capa | LOC Estimadas |
|------|---------------|
| Backend (servicios + routes + validaciones) | ~3,000-4,000 |
| Frontend (componentes + vistas + hooks) | ~4,000-5,000 |
| Prisma (schema + seeds) | ~500-800 |
| Tests | ~1,000-1,500 |
| **TOTAL** | **~8,500-11,300 LOC** |

---

---

## 12. Recomendación Final

### 12.1 Estrategia Recomendada

**Enfoque de Menor Riesgo:**

1. ✅ **Validar antes de codear:** Fase 0 crítica para evitar retrabajo
2. ✅ **Entorno aislado:** Base de datos separada para no afectar producción actual
3. ✅ **Backend primero:** Validar modelo de datos con APIs antes de frontend
4. ✅ **Testing continuo:** No esperar a Fase 5 para probar
5. ✅ **Empezar sin migración:** Validar MVP con datos limpios, migrar después

**NO Recomendado:**
- ❌ Big bang (implementar todo y probar al final)
- ❌ Modificar base de datos actual directamente
- ❌ Desarrollar frontend sin backend listo
- ❌ Migrar datos legacy antes de validar MVP

---

### 12.2 Decisión Crítica: ¿Migrar Datos Legacy?

**Recomendación:** NO migrar en MVP inicial

**Razones:**
- ✅ Validar MVP con datos limpios
- ✅ Reducir riesgo de bugs de migración
- ✅ Acelerar time-to-market
- ✅ Migrar después si MVP es exitoso

**Alternativa:** Mantener legacy app disponible para consulta histórica mientras se usa MVP para nuevos datos.

---

### 12.3 Criterio de Éxito del MVP

**El MVP es exitoso si:**
- ✅ Usuarios (Seba, Mona) pueden crear y usar presupuestos
- ✅ Comparación BUDGET vs ACTUAL es clara y útil
- ✅ Categorías personalizables por presupuesto funcionan bien
- ✅ Acceso compartido a "Hogar" funciona sin problemas
- ✅ No hay bugs críticos que impidan uso diario

**Si esto funciona:** Continuar con features adicionales (gráficos, reportes, multi-moneda, etc.)

**Si no funciona:** Iterar en diseño antes de invertir más tiempo

---

---

## 13. Checklist Pre-Inicio

### 13.1 Antes de Comenzar Fase 0

- [ ] ✅ Todos los documentos de especificación finalizados:
  - [ ] `architecture-decisions-finanzapp-mvp.md`
  - [ ] `spec-final-mvp-data-model.md`
  - [ ] `spec-mvp-navigation-ux.md`
  - [ ] `implementation-plan-mvp-finanzapp.md` (este documento)
- [ ] ✅ Stakeholders (Seba, Mona) han revisado y aprobado especificaciones
- [ ] ✅ Equipo técnico ha revisado y validado factibilidad
- [ ] ✅ Hay tiempo/recursos disponibles para 8-10 semanas de desarrollo
- [ ] ✅ Decisión tomada sobre migración de datos legacy (SI/NO)
- [ ] ✅ Entorno de desarrollo configurado (Node.js, Prisma, React, SQLite)
- [ ] ✅ Sistema de control de versiones listo (Git)

---

### 13.2 Aprobación Final

**Firmar (metafóricamente) antes de comenzar:**

```
Yo, [NOMBRE], apruebo el inicio del desarrollo del MVP Finanzapp
según el plan definido en este documento.

Entiendo que:
- El MVP tomará 8-10 semanas
- Se desarrollará en entorno aislado (sin afectar producción actual)
- Features fuera de alcance NO se implementarán en MVP
- El MVP debe validarse antes de migrar datos legacy

Fecha: _______________
Firma: _______________
```

---

**FIN DEL DOCUMENTO**

**Versión:** 1.0  
**Estado:** Plan de implementación listo para ejecutar  
**Próximo Paso:** Obtener aprobación → Comenzar Fase 0
