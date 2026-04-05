# Plan de Desmontaje de Módulos - Zapp

**Fecha:** 05 de abril de 2026  
**Objetivo:** Eliminar módulos marcados para desmontaje (frontend + backend)  
**Versión:** 1.0  
**Estado:** Pendiente de ejecución

---

## 🎯 Módulos a Desmontar

Basado en la auditoría funcional, se eliminarán **8 módulos completos**:

| # | Módulo | Razón | Impacto |
|---|--------|-------|---------|
| 1 | **Tenpo TC - Compras** | Ya no se usa Tenpo como TC principal | Alto - módulo más complejo del sistema |
| 2 | **Tenpo - Categorías** | Depende 100% de Tenpo Compras | Alto - 924 líneas de UI compleja |
| 3 | **Tenpo - Tasa Cuotas** | Depende 100% de Tenpo Compras | Medio - configuración específica |
| 4 | **Bonos y Repartos** | Funcionalidad no utilizada | Bajo - módulo hijo de Ingresos |
| 5 | **Actual Tenpo** | Vista de Tenpo, sin Tenpo no tiene sentido | Alto - vista crítica pero dependiente |
| 6 | **Presupuesto Resumen** | Vista consolidada a reconstruir | Alto - vista principal |
| 7 | **TC Billing Cycles** | Usado solo por Tenpo | Medio - lógica compleja de días hábiles |
| 8 | **Analytics y Reportes** | Duplicado con Flask, obsoleto | Bajo - poco usado |

---

## 📂 Archivos a Eliminar

### Frontend (React/TypeScript)

#### Páginas Completas (eliminar)
```
node-version/client/src/pages/
├─ ActualTenpo.tsx                    ❌ ELIMINAR (Módulo 5: Actual Tenpo)
├─ Tenpo.tsx                          ❌ ELIMINAR (Módulo 1: Tenpo Compras - Vista Presupuesto)
├─ TenpoConfig.tsx                    ❌ ELIMINAR (Módulo 3: Tenpo Config Tasa)
├─ TenpoCategories.tsx                ❌ ELIMINAR (Módulo 2: Categorías - 924 líneas)
├─ TenpoMerchantAssignment.tsx        ❌ ELIMINAR (Módulo 2: Asignación Comercios)
├─ Presupuesto.tsx                    ❌ ELIMINAR (Módulo 6: Presupuesto Resumen)
├─ ConfiguracionTC.tsx                ❌ ELIMINAR (Módulo 7: TC Billing Cycles)
```

#### Componentes Específicos (eliminar)
```
node-version/client/src/components/
├─ GestionarBonosModal.tsx            ❌ ELIMINAR (Módulo 4: Bonos y Repartos)
├─ Dashboard.tsx                      ❌ ELIMINAR (Módulo 6: Presupuesto Resumen)
├─ DashboardObligaciones.tsx          ❌ ELIMINAR (Módulo 6: Presupuesto Resumen)
├─ TcConfigForm.tsx                   ❌ ELIMINAR (Módulo 7: TC Billing Config)
├─ TcConfigForm.module.css            ❌ ELIMINAR (Módulo 7: TC Billing styles)
├─ TcAnnualCyclesTable.tsx            ❌ ELIMINAR (Módulo 7: TC Cycles)
├─ TcAnnualCyclesTable.module.css     ❌ ELIMINAR (Módulo 7: TC Cycles styles)
├─ TcOverridesTable.tsx               ❌ ELIMINAR (Módulo 7: TC Overrides)
├─ TcOverridesTable.module.css        ❌ ELIMINAR (Módulo 7: TC Overrides styles)
├─ TcRecalculationPanel.tsx           ❌ ELIMINAR (Módulo 7: TC Recalc)
├─ TcRecalculationPanel.module.css    ❌ ELIMINAR (Módulo 7: TC Recalc styles)
```

#### Componentes Compartidos (revisar uso)
```
node-version/client/src/components/actual/
└─ (verificar si hay componentes exclusivos de ActualTenpo)
```

### Backend (Node.js/TypeScript)

#### Rutas Completas (eliminar)
```
node-version/src/routes/
├─ tenpo.ts                           ❌ ELIMINAR (Módulos 1, 3, 5: ~950 líneas)
├─ merchant-categories.ts             ❌ ELIMINAR (Módulo 2: Categorías)
├─ merchant-mappings.ts               ❌ ELIMINAR (Módulo 2: Merchant Mappings)
├─ tc-billing.ts                      ❌ ELIMINAR (Módulo 7: TC Billing Cycles)
├─ analytics.ts                       ❌ ELIMINAR (Módulo 8: Analytics legacy)
```

#### Servicios (eliminar)
```
node-version/src/services/
├─ tenpo-parser.service.ts            ❌ ELIMINAR (Módulo 1: Parser emails Tenpo)
├─ tenpo-calculator.service.ts        ❌ ELIMINAR (Módulo 1: Cálculo intereses)
├─ tenpo-config.service.ts            ❌ ELIMINAR (Módulo 3: Config tasa)
├─ tcBillingCycle.service.ts          ❌ ELIMINAR (Módulo 7: Billing cycles)
```

#### API Clients (frontend)
```
node-version/client/src/api/
├─ tcBillingApi.ts                    ❌ ELIMINAR (Módulo 7: TC Billing API client)
```

### Modelo de Datos (Prisma)

#### Modelos a Eliminar de `schema.prisma`
```prisma
# Módulo 1, 3, 5: Tenpo TC
model TenpoEmail { ... }              ❌ ELIMINAR
model TenpoPurchase { ... }           ❌ ELIMINAR
model TenpoInstallment { ... }        ❌ ELIMINAR
model TenpoPayment { ... }            ❌ ELIMINAR
model TenpoTasaCuotas { ... }         ❌ ELIMINAR

# Módulo 2: Categorías Tenpo
model MerchantCategory { ... }        ❌ ELIMINAR
model MerchantMapping { ... }         ❌ ELIMINAR

# Módulo 4: Bonos
model Bono { ... }                    ❌ ELIMINAR
model RepartoBono { ... }             ❌ ELIMINAR

# Módulo 7: TC Billing
model TcBillingConfig { ... }         ❌ ELIMINAR
model TcBillingOverride { ... }       ❌ ELIMINAR
```

### Archivos Compartidos (modificar, NO eliminar)

#### Router (quitar rutas)
```
node-version/client/src/router.tsx
```
**Rutas a eliminar:**
- `/presupuesto/tenpo`
- `/presupuesto/tenpo/config`
- `/tenpo/categorias`
- `/tenpo/asignacion`
- `/actual/tenpo`
- `/configuracion-tc/:tcKey`
- `/presupuesto/resumen`

#### Menú de Navegación (quitar items)
```
node-version/client/src/navigation/menuConfig.ts
```
**Items a eliminar:**
- `Presupuesto > Resumen`
- `Presupuesto > Tenpo TC`
- `Actual > Tenpo TC`
- `Configuración > Tenpo TC`
- `Configuración > Categorías Tenpo`
- `Configuración > Asignación Comercios`

#### Backend Index (quitar imports y routes)
```
node-version/src/index.ts
```
**Imports/routes a eliminar:**
- `import tenpoRoutes from './routes/tenpo'`
- `import merchantCategoriesRoutes from './routes/merchant-categories'`
- `import merchantMappingsRoutes from './routes/merchant-mappings'`
- `import tcBillingRoutes from './routes/tc-billing'`
- `import analyticsRoutes from './routes/analytics'`
- `app.use('/api/tenpo', tenpoRoutes)`
- `app.use('/api/tenpo', merchantCategoriesRoutes)`
- `app.use('/api/tenpo', merchantMappingsRoutes)`
- `app.use('/api/tc-billing', tcBillingRoutes)`
- `app.use('/api/analytics', analyticsRoutes)`
- `await tenpoConfigService.inicializarTasaDefault()` (en initializeDefaults)

#### Ingresos Routes (quitar endpoints de bonos)
```
node-version/src/routes/ingresos.ts
```
**Endpoints a eliminar:**
- `GET /api/ingresos/bonos/:anio`
- `GET /api/ingresos/bonos/:id/detalle`
- Cualquier otro endpoint relacionado con Bono/RepartoBono

#### Ingresos Frontend (quitar componente bonos)
```
node-version/client/src/pages/Ingresos.tsx
```
**Secciones a eliminar:**
- Import de `GestionarBonosModal`
- Uso del modal de bonos
- Botones/acciones relacionados con bonos

---

## 🗄️ Migraciones de Base de Datos

### Crear Migración de Eliminación
```bash
# Desde node-version/
npx prisma migrate dev --name remove_tenpo_bonos_tc_billing_modules
```

**Contenido de la migración (generación automática después de editar schema.prisma):**
```sql
-- Eliminar tablas de Tenpo
DROP TABLE IF EXISTS tenpo_installments;
DROP TABLE IF EXISTS tenpo_purchases;
DROP TABLE IF EXISTS tenpo_payments;
DROP TABLE IF EXISTS tenpo_emails;
DROP TABLE IF EXISTS tenpo_tasa_cuotas;

-- Eliminar tablas de Categorías Tenpo
DROP TABLE IF EXISTS merchant_mappings;
DROP TABLE IF EXISTS merchant_categories;

-- Eliminar tablas de Bonos
DROP TABLE IF EXISTS repartos_bonos;
DROP TABLE IF EXISTS bonos;

-- Eliminar tablas de TC Billing
DROP TABLE IF EXISTS tc_billing_overrides;
DROP TABLE IF EXISTS tc_billing_configs;
```

### ⚠️ Backup Obligatorio ANTES de Migrar
```bash
# Backup de base de datos
cp node-version/dev.db node-version/dev.db.backup-$(date +%Y%m%d-%H%M%S)

# O con PowerShell
Copy-Item node-version\dev.db -Destination "node-version\dev.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

---

## 📋 Plan de Ejecución Paso a Paso

### Fase 1: Preparación y Backup
```bash
# 1. Crear rama de trabajo
git checkout -b refactor/remove-tenpo-bonos-tc-modules

# 2. Verificar estado limpio
git status

# 3. Backup de base de datos
Copy-Item node-version\dev.db -Destination "node-version\dev.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 4. Backup de schema actual
Copy-Item node-version\prisma\schema.prisma -Destination "node-version\prisma\schema.prisma.backup"
```

### Fase 2: Eliminar Backend

#### Paso 1: Eliminar archivos de rutas
```bash
# Desde raíz del proyecto
Remove-Item node-version\src\routes\tenpo.ts
Remove-Item node-version\src\routes\merchant-categories.ts
Remove-Item node-version\src\routes\merchant-mappings.ts
Remove-Item node-version\src\routes\tc-billing.ts
Remove-Item node-version\src\routes\analytics.ts
```

#### Paso 2: Eliminar servicios
```bash
Remove-Item node-version\src\services\tenpo-parser.service.ts
Remove-Item node-version\src\services\tenpo-calculator.service.ts
Remove-Item node-version\src\services\tenpo-config.service.ts
Remove-Item node-version\src\services\tcBillingCycle.service.ts
```

#### Paso 3: Limpiar index.ts
**Manual** - Editar `node-version/src/index.ts`:
- Eliminar imports de rutas desmontadas
- Eliminar `app.use()` de rutas desmontadas
- Eliminar `tenpoConfigService.inicializarTasaDefault()` de initializeDefaults

#### Paso 4: Limpiar routes/ingresos.ts
**Manual** - Editar `node-version/src/routes/ingresos.ts`:
- Eliminar endpoints de bonos (GET /bonos/:anio, GET /bonos/:id/detalle)

### Fase 3: Eliminar Frontend

#### Paso 1: Eliminar páginas completas
```bash
# Páginas Tenpo
Remove-Item node-version\client\src\pages\ActualTenpo.tsx
Remove-Item node-version\client\src\pages\Tenpo.tsx
Remove-Item node-version\client\src\pages\TenpoConfig.tsx
Remove-Item node-version\client\src\pages\TenpoCategories.tsx
Remove-Item node-version\client\src\pages\TenpoMerchantAssignment.tsx

# Páginas Presupuesto Resumen
Remove-Item node-version\client\src\pages\Presupuesto.tsx

# Páginas TC Billing
Remove-Item node-version\client\src\pages\ConfiguracionTC.tsx
Remove-Item node-version\client\src\pages\ConfiguracionTC.module.css
```

#### Paso 2: Eliminar componentes
```bash
# Bonos
Remove-Item node-version\client\src\components\GestionarBonosModal.tsx

# Presupuesto Resumen
Remove-Item node-version\client\src\components\Dashboard.tsx
Remove-Item node-version\client\src\components\DashboardObligaciones.tsx

# TC Billing
Remove-Item node-version\client\src\components\TcConfigForm.tsx
Remove-Item node-version\client\src\components\TcConfigForm.module.css
Remove-Item node-version\client\src\components\TcAnnualCyclesTable.tsx
Remove-Item node-version\client\src\components\TcAnnualCyclesTable.module.css
Remove-Item node-version\client\src\components\TcOverridesTable.tsx
Remove-Item node-version\client\src\components\TcOverridesTable.module.css
Remove-Item node-version\client\src\components\TcRecalculationPanel.tsx
Remove-Item node-version\client\src\components\TcRecalculationPanel.module.css
```

#### Paso 3: Eliminar API clients
```bash
Remove-Item node-version\client\src\api\tcBillingApi.ts
```

#### Paso 4: Limpiar router.tsx
**Manual** - Editar `node-version/client/src/router.tsx`:
- Eliminar imports de páginas desmontadas
- Eliminar rutas correspondientes

#### Paso 5: Limpiar menuConfig.ts
**Manual** - Editar `node-version/client/src/navigation/menuConfig.ts`:
- Eliminar items de menú relacionados

#### Paso 6: Limpiar pages/Ingresos.tsx
**Manual** - Editar `node-version/client/src/pages/Ingresos.tsx`:
- Eliminar import de GestionarBonosModal
- Eliminar secciones de bonos

### Fase 4: Limpiar Schema Prisma

#### Paso 1: Editar schema.prisma
**Manual** - Editar `node-version/prisma/schema.prisma`:

Eliminar modelos:
- `TenpoEmail`
- `TenpoPurchase`
- `TenpoInstallment`
- `TenpoPayment`
- `TenpoTasaCuotas`
- `MerchantCategory`
- `MerchantMapping`
- `Bono`
- `RepartoBono`
- `TcBillingConfig`
- `TcBillingOverride`

#### Paso 2: Generar migración
```bash
cd node-version
npx prisma migrate dev --name remove_tenpo_bonos_tc_billing_modules
```

**Revisar migración generada antes de ejecutar**

#### Paso 3: Regenerar cliente Prisma
```bash
npx prisma generate
```

### Fase 5: Validación

#### Paso 1: Verificar errores de compilación TypeScript
```bash
# Backend
cd node-version
npm run build

# Frontend
cd client
npm run build
```

#### Paso 2: Buscar referencias huérfanas
```bash
# Buscar referencias a Tenpo en código
Get-ChildItem -Path node-version -Recurse -Include *.ts,*.tsx | Select-String -Pattern "tenpo|Tenpo" -CaseSensitive

# Buscar referencias a Bono
Get-ChildItem -Path node-version -Recurse -Include *.ts,*.tsx | Select-String -Pattern "bono|Bono" -CaseSensitive

# Buscar referencias a TC Billing
Get-ChildItem -Path node-version -Recurse -Include *.ts,*.tsx | Select-String -Pattern "tcBilling|TcBilling|tc-billing" -CaseSensitive
```

#### Paso 3: Probar localmente
```bash
# Backend
cd node-version
npm run dev

# Frontend (nueva terminal)
cd node-version/client
npm run dev
```

**Validaciones manuales:**
- ✅ Menú de navegación sin items rotos
- ✅ Home carga correctamente
- ✅ Módulos que SE QUEDAN funcionan
- ✅ No hay errores 404 en consola
- ✅ No hay imports rotos

### Fase 6: Commit y Documentación

```bash
# Stage cambios
git add .

# Commit descriptivo
git commit -m "refactor: remove Tenpo, Bonos, TC Billing and Analytics modules

- Remove Tenpo TC complete ecosystem (purchases, categories, config)
- Remove Bonos y Repartos from Ingresos
- Remove TC Billing Cycles configuration
- Remove legacy Analytics module
- Remove Presupuesto Resumen (to be rebuilt)
- Update router and navigation menu
- Drop database tables via Prisma migration
- Clean up unused services and components

BREAKING CHANGE: Tenpo TC functionality is no longer available"

# Push a rama remota
git push -u origin refactor/remove-tenpo-bonos-tc-modules
```

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Pérdida de datos Tenpo** | 🔴 ALTA | Backup obligatorio de `dev.db` antes de migración |
| **Referencias huérfanas en código** | 🟠 MEDIA | Búsqueda exhaustiva con grep, validación de build |
| **Módulo Actual roto** | 🟠 MEDIA | Validar que ActualEntry no depende de Tenpo |
| **OAuth Google huérfano** | 🟡 BAJA | OAuth se mantiene para Utilities (congelado) |
| **Rollback complejo** | 🟡 BAJA | Rama Git dedicada, backup de schema y DB |
| **Build roto** | 🟠 MEDIA | Validar `npm run build` antes de commit |

---

## 🔍 Checklist de Validación Final

### Backend
- [ ] `npm run build` sin errores
- [ ] No hay imports de módulos eliminados
- [ ] `index.ts` limpio (sin rutas eliminadas)
- [ ] Base de datos migrada correctamente
- [ ] No quedan referencias a Tenpo, Bono, TcBilling en código

### Frontend
- [ ] `npm run build` sin errores
- [ ] Router sin rutas huérfanas
- [ ] Menú de navegación actualizado
- [ ] No hay imports de componentes eliminados
- [ ] No hay errores en consola del navegador

### Funcional
- [ ] Home carga correctamente
- [ ] Servicios Básicos funciona
- [ ] Ingresos funciona (sin bonos)
- [ ] Ahorros funciona
- [ ] Hipotecario funciona
- [ ] Créditos/Obligaciones funciona
- [ ] Módulo Actual funciona
- [ ] Actual Utilities funciona
- [ ] No hay links rotos en navegación

### Documentación
- [ ] Commit descriptivo creado
- [ ] Rama pusheada a remoto
- [ ] Este documento actualizado con cambios reales ejecutados
- [ ] CHANGELOG.md actualizado (opcional)

---

## 📊 Resumen de Impacto

### Archivos Frontend Eliminados
- **Páginas**: 7 archivos (.tsx)
- **Componentes**: 11 archivos (.tsx + .css)
- **API Clients**: 1 archivo (.ts)
- **Total Frontend**: ~19 archivos

### Archivos Backend Eliminados
- **Rutas**: 5 archivos (.ts)
- **Servicios**: 4 archivos (.ts)
- **Total Backend**: ~9 archivos

### Archivos Modificados (no eliminados)
- `router.tsx` - quitar 7 rutas
- `menuConfig.ts` - quitar 6 items
- `index.ts` - quitar 5 route mounts + init
- `ingresos.ts` - quitar 2+ endpoints
- `Ingresos.tsx` - quitar sección bonos
- `schema.prisma` - quitar 10 modelos

### Modelos Prisma Eliminados
- **10 modelos** completos
- **Estimado**: ~300-400 líneas de schema eliminadas

### Líneas de Código Eliminadas (aproximado)
- **Frontend**: ~3,000-4,000 líneas
- **Backend**: ~2,000-2,500 líneas
- **Total**: ~5,000-6,500 líneas de código eliminadas

---

## 🚀 Próximos Pasos Después del Desmontaje

Una vez completado el desmontaje:

1. **Revisar Supermercado** (no marcado)
   - Decidir si se queda, congela o desmonta
   
2. **Revisar Suscripciones** (no marcado, pero tiene duplicación Flask)
   - Resolver duplicación Flask vs Node
   - Migrar a versión única moderna

3. **Reconstruir vista Home/Resumen** (Presupuesto.tsx fue eliminado)
   - Diseñar nueva vista consolidada
   - Implementar con módulos que SE QUEDAN

4. **Unificar catálogos repetidos** (Servicios/Ingresos/Ahorros)
   - Evaluar si se justifica módulo genérico
   - Mantener como está o refactorizar

5. **Evaluar Utilities Import Gmail** (congelado)
   - Si parser falla mucho: desmontar
   - Si funciona bien: reactivar desarrollo

---

## 📝 Notas Importantes

- **NO ejecutar este plan todavía** - Primero revisar y aprobar
- **Backup es OBLIGATORIO** - Sin backup no proceder
- **Validar build en cada fase** - No continuar si hay errores de compilación
- **Rama Git dedicada** - NO hacer cambios directamente en master
- **Rollback preparado** - Tener plan B si algo falla

---

**Autor:** GitHub Copilot  
**Fecha:** 05 de abril de 2026  
**Estado:** Plan listo para revisión y ejecución  
**Confirmación:** NO se han realizado cambios de código todavía
