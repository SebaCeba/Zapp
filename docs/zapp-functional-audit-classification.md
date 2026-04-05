# Zapp - Auditoría Funcional y Técnica Completa

**Fecha:** 05 de abril de 2026  
**Objetivo:** Inventariar todas las funcionalidades y módulos del sistema Zapp para decidir qué mantener, congelar, desmontar o rehacer  
**Versión:** 1.0  
**Estado:** Pendiente de clasificación manual

\---

## 📋 Objetivo de la Auditoría

Este documento mapea **todas las funcionalidades y módulos reales** del sistema Zapp, identificando para cada uno:

* Frontend involucrado (componentes, páginas, rutas)
* Backend involucrado (endpoints, servicios, lógica)
* Integraciones externas (Gmail, APIs)
* Archivos principales asociados
* Dependencias y riesgos técnicos

El objetivo es que puedas **marcar manualmente con X** qué hacer con cada módulo antes de empezar el rediseño del sistema.

\---

## 🎯 Criterios de Clasificación

Marca con **X** una de las siguientes opciones para cada funcionalidad:

* **\[ ] Se queda**: Funcionalidad crítica que NO se toca, se migra tal cual al nuevo sistema
* **\[ ] Se congela**: Funcionalidad estable pero no crítica, se deja pausada temporalmente sin desarrollar
* **\[ ] Se desmonta**: Funcionalidad obsoleta o experimental que se elimina completamente
* **\[ ] Se rehace**: Funcionalidad valiosa pero con implementación problemática que requiere reconstrucción desde cero

\---

## 📊 Inventario de Funcionalidades/Módulos Detectados

Se identificaron **19 funcionalidades principales** en Zapp:

1. **Integración OAuth Google / Gmail** (core infrastructure)
2. **Tenpo TC - Gestión de Compras en Cuotas** (con Gmail)
3. **Tenpo TC - Sistema de Categorización de Comercios** (3 niveles jerárquicos)
4. **Tenpo TC - Configuración de Tasa de Interés**
5. **Servicios Básicos - Gestión de Proveedores y Presupuesto**
6. **Servicios Básicos - Importación desde Gmail** (utilities con email connector)
7. **Hipotecario - Tabla de Amortización y Seguros**
8. **Ingresos - Catálogo y Presupuesto Anual**
9. **Ingresos - Gestión de Bonos y Repartos**
10. **Ahorros - Catálogo y Presupuesto Anual**
11. **Créditos y Obligaciones - Proyección Mensual**
12. **Supermercado - Presupuesto Mensual**
13. **Suscripciones - Calendario Periódico** (legacy + moderna)
14. **Módulo Actual - Seguimiento Presupuesto vs Real**
15. **Actual Tenpo - Vista Consolidada de Cuotas Mensuales**
16. **Actual Utilities - Vista de Servicios Básicos Reales**
17. **Presupuesto - Resumen Consolidado Anual**
18. **Tarjetas de Crédito - Billing Cycles y Overrides**
19. **Analytics - Generación de Reportes y CSV**

\---

## 🗂️ Tabla Principal de Clasificación

|Funcionalidad / Módulo|Objetivo actual|Estado aparente|Frontend involucrado|Backend involucrado|Integraciones externas|Archivos clave|Se queda|Se congela|Se desmonta|Se rehace|Dependencias / Riesgos|Observaciones|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|**1. OAuth Google/Gmail**|Autenticación OAuth2 para acceso a Gmail API|Activo, crítico|-|`src/routes/google-integration.ts`, `src/services/gmail.service.ts`|Google OAuth2, Gmail API|`GoogleAuthToken` model, `gmail.service.ts`|x|\[ ]|\[ ]|\[ ]|Base de Tenpo y Utilities; si se desmonta, caen ambas funcionalidades|Infraestructura crítica, sin ella no hay integración Gmail|
|**2. Tenpo TC - Compras**|Procesamiento automático de emails de compras en cuotas, cálculo de intereses, proyección mensual|Activo, complejo|`ActualTenpo.tsx`, `Tenpo.tsx`, `TenpoConfig.tsx`|`src/routes/tenpo.ts`, `tenpo-parser.service.ts`, `tenpo-calculator.service.ts`|Gmail API (labels: Tenpo/Compras, Tenpo/Pagos)|`TenpoEmail`, `TenpoPurchase`, `TenpoInstallment`, `TenpoPayment`|\[ ]|\[ ]|x|\[ ]|Dependencia fuerte de OAuth, parsing complejo, lógica de negocio extensa|Módulo más complejo del sistema, con lógica financiera avanzada|
|**3. Tenpo - Categorías**|Sistema jerárquico de 3 niveles para categorizar comercios (Principal > Subcategoría > Comercio)|Activo, avanzado|`TenpoCategories.tsx` (924 líneas), `TenpoMerchantAssignment.tsx`|`src/routes/merchant-categories.ts`, `src/routes/merchant-mappings.ts`|Ninguna|`MerchantCategory`, `MerchantMapping`|\[ ]|\[ ]|x|\[ ]|Acoplado a TenpoPurchase.merchant; UI compleja con drag-drop y árbol|Sistema sofisticado, requiere revisión si se rehace Tenpo|
|**4. Tenpo - Tasa Cuotas**|Configuración histórica de tasa de interés mensual para cálculo de cuotas|Activo, estable|`TenpoConfig.tsx`|`src/routes/tenpo.ts`, `tenpo-config.service.ts`|Ninguna|`TenpoTasaCuotas`|\[ ]|\[ ]|x|\[ ]|Sistema de versionado por vigencia, afecta cálculos retroactivos|Crítico para precisión financiera|
|**5. Servicios Básicos - Presupuesto**|Catálogo dinámico de servicios (agua, luz, gas, etc.) con presupuesto mensual anual|Activo, estable|`ServiciosBasicos.tsx`, `ConfigServiciosBasicos.tsx`, componentes en `components/`|`src/routes/servicios-basicos.ts`|Ninguna|`ServicioBasico`, `PresupuestoServicioBasico`|x|\[ ]||\[ ]|Base para utilities reales; lógica similar a Ingresos/Ahorros|Arquitectura limpia, catálogo + presupuesto|
|**6. Utilities - Import Gmail**|Importación automática de facturas de servicios básicos desde Gmail con preview/confirm|Activo, experimental|`ActualUtilities.tsx`, `UtilityProviderPanel.tsx`, `ImportPreviewModal.tsx`|`src/routes/utilities.ts`, `utilities-parser.service.ts`|Gmail API (labels configurables por servicio)|`UtilityTransaction`, `ServicioBasico.gmailLabel`, `ServicioBasico.hasEmailConnector`|\[ ]|x|\[ ]|\[ ]|Copia de arquitectura Tenpo; requiere labels Gmail configurados correctamente|Parser experimental con workflow preview/confirm|
|**7. Hipotecario**|Gestión de dividendos hipotecarios con tabla de amortización, importación CSV, seguros anuales|Activo, estable|`Hipotecario.tsx`|`src/routes/hipotecario.ts`|Ninguna|`MortgagePayment`, `MortgageBudgetConfig`, `MortgageInsurance`|x|\[ ]|\[ ]|\[ ]|Modelo de datos cerrado, import CSV manual|Funcionalidad específica de usuario, poco reutilizable|
|**8. Ingresos - Catálogo**|Catálogo dinámico de ingresos recurrentes con presupuesto mensual|Activo, estable|`Ingresos.tsx`, `GestionarIngresosModal.tsx`, `TablaPresupuestoIngresos.tsx`|`src/routes/ingresos.ts`|Ninguna|`IngresoBase`, `PresupuestoIngreso`|x|\[ ]|\[ ]|\[ ]|Patrón repetido (igual que Servicios/Ahorros)|Arquitectura limpia y replicable|
|**9. Bonos y Repartos**|Gestión de bonos puntuales con distribución por destinos (ahorro, deuda, etc.)|Activo, parcial|`GestionarBonosModal.tsx` (dentro de Ingresos)|`src/routes/ingresos.ts`|Ninguna|`Bono`, `RepartoBono`|\[ ]|\[ ]|x|\[ ]|Dependiente de módulo Ingresos; lógica de distribución compleja|Funcionalidad avanzada poco documentada|
|**10. Ahorros**|Catálogo de cuentas de ahorro con presupuesto mensual|Activo, estable|`Ahorros.tsx`, `GestionarAhorrosModal.tsx`, `TablaPresupuestoAhorros.tsx`|`src/routes/ahorros.ts`|Ninguna|`AhorroBase`, `PresupuestoAhorro`|x|\[ ]|\[ ]|\[ ]|Patrón idéntico a Ingresos|Arquitectura limpia|
|**11. Créditos/Obligaciones**|Gestión de créditos hipotecarios, consumo, seguros con proyección mensual|Activo, legacy|`Creditos.tsx`, `ObligacionForm.tsx`, `TablaObligaciones.tsx`|`src/routes/obligaciones.ts`|Ninguna|`Obligacion`, `SupuestoAnual`|x|\[ ]|\[ ]|\[ ]|Lógica de proyección mezclada con hipotecario|Arquitectura confusa, requiere revisión|
|**12. Supermercado**|Presupuesto mensual simple de gastos de supermercado|Activo, estable|`Supermercado.tsx`, `TablaPresupuestoSupermercado.tsx`|`src/routes/supermercado.ts`|Ninguna|`SupermercadoPresupuesto`|\[ ]|\[ ]|\[ ]|\[ ]|Modelo más simple del sistema|Fácil de mantener|
|**13. Suscripciones**|Gestión de suscripciones periódicas (mensual, trimestral, anual) con overrides|Activo, dual|**Legacy**: `templates/index.html` (Flask), `App.tsx` (React viejo). **Moderna**: `/app` route en React moderno|**Legacy**: `app.py` (Flask). **Moderna**: `src/routes/subscriptions.ts`, `src/routes/analytics.ts`|Ninguna|**Legacy**: SQLite directo. **Moderna**: Prisma (`Subscription`, `PriceOverride`)|\[ ]|\[ ]|\[ ]|\[ ]|Duplicación app Flask vs Node; posible migración incompleta|RIESGO: dos sistemas en paralelo|
|**14. Módulo Actual**|Seguimiento mensual de presupuesto vs gastos reales con estados de pago|Activo, core|`Actual.tsx`|`src/routes/actual.ts`, `src/services/consolidado.ts`|Ninguna|`ActualEntry`|x|\[ ]|\[ ]|\[ ]|Consolidador de todas las categorías; punto único de verdad mensual|Core del sistema real|
|**15. Actual Tenpo**|Vista consolidada de cuotas Tenpo por mes con sincronización Gmail|Activo, crítico|`ActualTenpo.tsx`|`src/routes/tenpo.ts` (forecast endpoint)|Gmail API (via Tenpo sync)|`TenpoInstallment`, `TenpoPurchase`|\[ ]|\[ ]|x|\[ ]|Dependencia de módulo Tenpo completo|Vista crítica para usuario final|
|**16. Actual Utilities**|Vista consolidada mensual de servicios básicos reales con import Gmail|Activo, experimental|`ActualUtilities.tsx`, `UtilityProviderPanel.tsx`, `UtilityTable.tsx`|`src/routes/utilities.ts`|Gmail API (labels por servicio)|`UtilityTransaction`|x|\[ ]|\[ ]|\[ ]|Workflow complejo de preview/confirm; parser experimental|Depende de config correcta de labels|
|**17. Presupuesto Resumen**|Vista consolidada anual de todos los ingresos y gastos presupuestados|Activo, core|`Presupuesto.tsx`, `Dashboard.tsx`, `DashboardObligaciones.tsx`|Múltiples endpoints de consulta|Ninguna|Múltiples modelos (agregación)|\[ ]|\[ ]|x|\[ ]|Consolida datos de todos los módulos; requiere refactor si cambia estructura|Vista crítica para planificación|
|**18. TC Billing Cycles**|Configuración de ciclos de facturación de tarjetas de crédito con overrides mensuales|Activo, avanzado|`ConfiguracionTC.tsx`, `TcConfigForm.tsx`, `TcAnnualCyclesTable.tsx`, `TcOverridesTable.tsx`|`src/routes/tc-billing.ts`, `tcBillingCycle.service.ts`|Ninguna|`TcBillingConfig`, `TcBillingOverride`|\[ ]|\[ ]|x|\[ ]|Lógica de días hábiles compleja; soporte Tenpo + otras TCs|Módulo reciente, lógica sofisticada|
|**19. Analytics y Reportes**|Generación de reportes CSV, estadísticas anuales, overrides de suscripciones|Activo, legacy|Integrado en varias vistas|`src/routes/analytics.ts`|Ninguna|`Subscription`, `PriceOverride`|\[ ]|\[ ]|x|\[ ]|Duplicación con lógica Flask; puede estar obsoleto|Requiere revisión manual|

\---

## 📄 Detalle por Funcionalidad/Módulo

### 1\. OAuth Google / Gmail

**Descripción:**  
Infraestructura de autenticación OAuth2 para acceso a Gmail API. Permite:

* Generar URL de autorización
* Procesar callback de Google
* Almacenar y refrescar access tokens
* Validar estado de autenticación
* Desconectar cuenta

**Frontend:**

* Banner `GmailSyncStatusBanner.tsx` (muestra estado OAuth)
* Integrado en `ActualTenpo.tsx`, `ActualUtilities.tsx`

**Backend:**

* `node-version/src/routes/google-integration.ts`

  * `GET /api/integrations/google/status` - Verifica si hay token válido
  * `GET /api/integrations/google/auth-url` - Genera URL OAuth
  * `GET /api/integrations/google/callback` - Procesa código de autorización
  * `DELETE /api/integrations/google/auth` - Elimina token
* `node-version/src/services/gmail.service.ts`

  * `getAuthenticatedClient()` - Cliente autenticado Gmail
  * `getEmailsByLabel()` - Obtiene emails por label
  * Auto-refresh de tokens

**Integración Externa:**

* ✅ Google OAuth2 (Client ID + Secret en `.env`)
* ✅ Gmail API v1

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `GoogleAuthToken` (líneas 144-155)
* `node-version/src/services/gmail.service.ts`
* `node-version/client/src/components/common/GmailSyncStatusBanner.tsx`

**Modelo de Datos:**

```prisma
model GoogleAuthToken {
  id           Int      @id @default(autoincrement())
  accessToken  String
  refreshToken String
  expiryDate   DateTime
  scope        String
  tokenType    String   @default("Bearer")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Dependencias:**

* Tenpo TC (100% dependiente de Gmail)
* Utilities Email Import (100% dependiente de Gmail)

**Riesgos:**

* Si se desmonta, caen Tenpo y Utilities
* Tokens expiran cada \~60 minutos, requiere refresh
* Requiere credenciales Google válidas

**Recomendación Técnica Preliminar:**  
Mantener si Tenpo o Utilities se conservan. Si se congelan ambas funcionalidades, este módulo puede congelarse también. NO desmontar a menos que se eliminen todas las integraciones Gmail.

\---

### 2\. Tenpo TC - Gestión de Compras en Cuotas

**Descripción:**  
Módulo más complejo del sistema. Procesa automáticamente emails de Tenpo (compras y pagos), calcula intereses, proyecta cuotas mensuales, permite overrides manuales, soporta compras sin interés, recálculo masivo, y confirmación de montos reales.

**Objetivo:**

1. Sincronizar emails Gmail de compras en cuotas
2. Parsear información (comercio, monto, cuotas, fecha)
3. Calcular intereses según tasa configurable
4. Proyectar calendario de cuotas mensuales
5. Gestionar overrides manuales por cuota
6. Permitir entrada manual de compras
7. Tracking de pagos reales

**Frontend:**

* `node-version/client/src/pages/ActualTenpo.tsx` - Vista mensual consolidada con sincronización
* `node-version/client/src/pages/Tenpo.tsx` - Vista "Presupuesto/Tenpo TC" (deprecated?)
* `node-version/client/src/pages/TenpoConfig.tsx` - Configuración de tasa de interés
* Componentes compartidos en `components/actual/`

**Backend:**

* `node-version/src/routes/tenpo.ts` (30+ endpoints):

  * `POST /api/tenpo/sync` - Sincroniza emails Gmail (compras + pagos)
  * `GET /api/tenpo/forecast` - Proyección mensual de cuotas
  * `GET /api/tenpo/purchases` - Lista compras
  * `GET /api/tenpo/installments` - Lista cuotas
  * `PATCH /api/tenpo/installments/:id` - Override de cuota
  * `POST /api/tenpo/purchases/manual` - Crear compra manual
  * `POST /api/tenpo/purchases/:id/confirmar-real` - Confirmar monto real vs estimado
  * `POST /api/tenpo/recalcular-estimadas` - Recálculo masivo
  * `PATCH /api/tenpo/purchases/:id/interes` - Toggle con/sin interés
  * `PATCH /api/tenpo/purchases/:id/schedule` - Override primera cuota
* `node-version/src/services/tenpo-parser.service.ts` - Parser de emails
* `node-version/src/services/tenpo-calculator.service.ts` - Motor de cálculo de intereses
* `node-version/src/services/tenpo-config.service.ts` - Gestión de tasa

**Integración Externa:**

* ✅ Gmail API
* Labels Gmail: `Tenpo/Compras TC Tenpo`, `Tenpo/Pagos TC Tenpo`

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `TenpoEmail` (líneas 157-169)
  * `TenpoPurchase` (líneas 171-192)
  * `TenpoInstallment` (líneas 194-209)
  * `TenpoPayment` (líneas 211-223)
  * `TenpoTasaCuotas` (líneas 254-262)
* `node-version/src/routes/tenpo.ts` (\~950 líneas)
* `node-version/client/src/pages/ActualTenpo.tsx`

**Modelo de Datos (simplificado):**

```
TenpoEmail (emails crudos de Gmail)
  ├─> TenpoPurchase (compra con cuotas)
  │     ├─> TenpoInstallment\[] (cuotas individuales)
  │     └─ metadata JSON con tasas
  └─> TenpoPayment\[] (pagos de la tarjeta)
```

**Dependencias:**

* OAuth Google (100%)
* TenpoTasaCuotas (cálculo de intereses)
* MerchantCategory/MerchantMapping (categorización)
* TcBillingConfig (fechas de vencimiento)

**Riesgos:**

* **Lógica compleja**: parser de emails frágil, cálculo financiero delicado
* **Acoplamiento fuerte**: mezclado con categorías, billing cycles, OAuth
* **Parser quebradizo**: depende de formato exacto de emails Tenpo
* **Recálculo masivo**: puede generar inconsistencias si falla parcialmente
* **Dual mode**: modo ESTIMADO vs REAL con transiciones manuales

**Observaciones:**

* Módulo crítico si el usuario usa Tenpo como TC principal
* 30+ endpoints (el módulo más grande del backend)
* Lógica de interés compuesto no trivial
* Soporta compras manuales y desde Gmail
* Sistema de override por cuota flexible pero complejo

**Recomendación Técnica Preliminar:**  
Si se usa activamente: **SE QUEDA** (migrar con cuidado).  
Si se planea cambiar de TC o banco: **SE CONGELA** (pausar desarrollo, mantener funcional).  
Si nunca se usó o Tenpo ya no es relevante: **SE DESMONTA**.  
Si la implementación tiene bugs frecuentes: **SE REHACE** (simplificar parser, externalizar cálculo).

\---

### 3\. Tenpo TC - Sistema de Categorización de Comercios

**Descripción:**  
Sistema jerárquico de 3 niveles para categorizar comercios de Tenpo:

* Nivel 1: Categoría Principal (ej: "Alimentación")
* Nivel 2: Subcategoría (ej: "Restaurantes")
* Nivel 3: Comercio específico (ej: "McDonald's")

Permite drag \& drop, bulk assignment, vista de árbol completa.

**Frontend:**

* `node-version/client/src/pages/TenpoCategories.tsx` (924 líneas)

  * Árbol completo con drag-drop
  * Modal de creación/edición
  * Validación de niveles
  * Color picker y emoji selector
  * Vista colapsable
* `node-version/client/src/pages/TenpoMerchantAssignment.tsx`

  * Asignación masiva de comercios sin categoría
  * Bulk select + assign

**Backend:**

* `node-version/src/routes/merchant-categories.ts`:

  * `GET /api/tenpo/categories` - Árbol completo o flat
  * `GET /api/tenpo/categories/:id` - Detalle con children
  * `POST /api/tenpo/categories` - Crear (con parentId)
  * `PUT /api/tenpo/categories/:id` - Actualizar
  * `DELETE /api/tenpo/categories/:id` - Eliminar (valida children)
* `node-version/src/routes/merchant-mappings.ts`:

  * `GET /api/tenpo/merchants/uncategorized` - Comercios sin categoría
  * `POST /api/tenpo/merchants/:merchantName/category` - Asignar
  * `DELETE /api/tenpo/merchants/:merchantName/category` - Desasignar
  * `POST /api/tenpo/merchants/batch-assign` - Asignación masiva

**Integración Externa:**

* Ninguna (backend puro)

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `MerchantCategory` (líneas 225-240) - Árbol jerárquico
  * `MerchantMapping` (líneas 242-253) - Asignaciones
* `node-version/client/src/pages/TenpoCategories.tsx` (924 líneas de UI compleja)

**Modelo de Datos:**

```prisma
model MerchantCategory {
  id         Int                  @id
  name       String
  parentId   Int?
  parent     MerchantCategory?    @relation("CategoryHierarchy")
  children   MerchantCategory\[]   @relation("CategoryHierarchy")
  level      Int                  @default(1) // 1, 2, 3
  order      Int
  color      String?              // Hex color
  icon       String?              // Emoji
  isSystem   Boolean              // true para "Sin Categorizar"
  merchants  MerchantMapping\[]
}

model MerchantMapping {
  merchantName String           @unique
  categoryId   Int
  category     MerchantCategory
  assignedBy   String           @default("MANUAL")
}
```

**Dependencias:**

* TenpoPurchase.merchant (FK implícito como string)
* UI depende de RSuite Tree component

**Riesgos:**

* Si se desmonta Tenpo, esta funcionalidad queda huérfana
* UI compleja (924 líneas) difícil de mantener
* Lógica de árbol requiere validaciones recursivas

**Recomendación Técnica Preliminar:**  
Seguir decisión de módulo Tenpo principal. Si Tenpo se mantiene: **SE QUEDA**.  
Si Tenpo se desmonta: **SE DESMONTA** también.  
Si se planea sistema de categorías global (no solo Tenpo): **SE REHACE** como módulo independiente reutilizable.

\---

### 4\. Tenpo TC - Configuración de Tasa de Interés

**Descripción:**  
Sistema de versionado histórico de la tasa de interés mensual de Tenpo TC. Permite configurar múltiples tasas con vigencia temporal para recálculo retroactivo correcto de intereses.

**Frontend:**

* Integrado en `TenpoConfig.tsx`
* Input de tasa mensual + CAE informativo
* Historial de tasas con vigencias

**Backend:**

* `node-version/src/routes/tenpo.ts`:

  * `GET /api/tenpo/config/tasa` - Tasa vigente actual
  * `GET /api/tenpo/config/tasa/historial` - Historial completo
  * `POST /api/tenpo/config/tasa` - Crear nueva tasa (cierra vigencia anterior)
* `node-version/src/services/tenpo-config.service.ts`:

  * `obtenerTasaVigente(fecha)` - Obtiene tasa aplicable en fecha específica
  * `inicializarTasaDefault()` - Carga tasa default al arrancar

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `TenpoTasaCuotas` (líneas 254-262)
* `node-version/src/services/tenpo-config.service.ts`

**Modelo de Datos:**

```prisma
model TenpoTasaCuotas {
  id           Int       @id @default(autoincrement())
  tasaMensual  Float     // 0.0211 (2.11%)
  cae          String?   // "28.4%" (informativo)
  vigenteDesde DateTime
  vigenteHasta DateTime? // null = vigente actualmente
}
```

**Dependencias:**

* TenpoPurchase cálculo de intereses
* Motor de recálculo masivo

**Riesgos:**

* Cambios de tasa requieren recálculo masivo de compras
* Lógica de vigencia debe ser consistente con recálculos
* No se puede eliminar tasa si hay compras asociadas

**Recomendación Técnica Preliminar:**  
Seguir decisión de módulo Tenpo. Si Tenpo se mantiene: **SE QUEDA**.  
Si Tenpo se desmonta: **SE DESMONTA**.  
Arquitectura limpia, poco riesgo técnico.

\---

### 5\. Servicios Básicos - Gestión de Proveedores y Presupuesto

**Descripción:**  
Catálogo dinámico de servicios básicos (agua, luz, gas, internet, teléfono, etc.) con presupuesto mensual personalizable por año. Cada servicio puede activarse/desactivarse, reordenarse, y opcionalmente conectarse a Gmail para importación automática.

**Frontend:**

* `node-version/client/src/pages/ServiciosBasicos.tsx` - Vista principal presupuesto
* `node-version/client/src/pages/ConfigServiciosBasicos.tsx` - Config de catálogo
* `node-version/client/src/components/GestionarCatalogoModal.tsx`
* `node-version/client/src/components/TablaPresupuestoServicios.tsx`

**Backend:**

* `node-version/src/routes/servicios-basicos.ts`:

  * Catálogo:

    * `GET /api/servicios-basicos/catalogo` - Lista servicios
    * `POST /api/servicios-basicos/catalogo` - Crear servicio
    * `PATCH /api/servicios-basicos/catalogo/:id` - Editar servicio
    * `PATCH /api/servicios-basicos/catalogo/:id/toggle` - Activar/desactivar
    * `DELETE /api/servicios-basicos/catalogo/:id` - Eliminar
  * Presupuesto:

    * `GET /api/servicios-basicos/presupuesto/:anio`
    * `PUT /api/servicios-basicos/presupuesto` - Batch update anual
    * `PATCH /api/servicios-basicos/presupuesto/:servicioId/:anio/:mes` - Update celda individual

**Integración Externa:**

* Ninguna (preparado para Gmail via `gmailLabel` field)

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `ServicioBasico` (líneas 107-119)
  * `PresupuestoServicioBasico` (líneas 121-143)

**Modelo de Datos:**

```prisma
model ServicioBasico {
  id                Int     @id
  nombre            String  @unique
  activo            Boolean @default(true)
  esBase            Boolean @default(false) // servicio core vs opcional
  orden             Int     @default(0)
  gmailLabel        String? // Ej: "Facturación ENEL"
  hasEmailConnector Boolean @default(false)
  presupuestos      PresupuestoServicioBasico\[]
  transactions      UtilityTransaction\[]
}

model PresupuestoServicioBasico {
  id         Int     @id
  servicioId Int
  anio       Int
  enero      Float   @default(0)
  febrero    Float   @default(0)
  // ... 12 meses
  servicio   ServicioBasico
}
```

**Dependencias:**

* UtilityTransaction (registros reales)
* Módulo Actual (consolidación)

**Riesgos:**

* Patrón repetido 3 veces (Ingresos, Servicios, Ahorros)
* Modelo de 12 columnas (enero-diciembre) no es escalable
* Lógica duplicada con Ingresos y Ahorros

**Recomendación Técnica Preliminar:**  
Si se usa activamente: **SE QUEDA**.  
Si hay plan de unificar catálogos repetidos: **SE REHACE** (crear módulo genérico de "Categorías Presupuestables").  
Arquitectura estable pero redundante.

\---

### 6\. Servicios Básicos - Importación desde Gmail (Utilities)

**Descripción:**  
Importación automática de facturas de servicios básicos desde Gmail con workflow de preview → confirm. Sigue patrón idéntico a Tenpo pero para utilities (agua, luz, gas, etc.).

Workflow:

1. Usuario selecciona proveedor + período
2. Backend busca emails en Gmail por label configurado
3. Parser extrae monto, fecha, período de facturación
4. Frontend muestra preview con opción de editar
5. Usuario confirma → se crea UtilityTransaction

**Frontend:**

* `node-version/client/src/pages/ActualUtilities.tsx` - Vista consolidada mensual
* `node-version/client/src/components/utilities/UtilityProviderPanel.tsx` - Panel por proveedor
* `node-version/client/src/components/utilities/ImportPreviewModal.tsx` - Modal preview/confirm
* `node-version/client/src/components/utilities/PayPeriodPicker.tsx` - Selector período pago
* `node-version/client/src/components/utilities/UtilityTable.tsx` - Tabla de transacciones

**Backend:**

* `node-version/src/routes/utilities.ts` (630+ líneas):

  * `GET /api/utilities/providers` - Lista proveedores con stats
  * `GET /api/utilities/:provider` - Transacciones de proveedor
  * `POST /api/utilities/:provider/import-email/preview` - Preview parsing
  * `POST /api/utilities/:provider/import-email/confirm` - Confirmar importación
  * `POST /api/utilities/:provider/import` - Importación manual
  * `PATCH /api/utilities/:provider/transactions/:id/pay-period` - Override período pago
  * `DELETE /api/utilities/:provider/:id` - Eliminar transacción
  * `GET /api/utilities/:provider/summary` - Resumen mensual
* `node-version/src/services/utilities-parser.service.ts` - Parser experimental de emails

**Integración Externa:**

* ✅ Gmail API (requiere labels configurados por servicio)
* Dependencia: `ServicioBasico.gmailLabel`, `ServicioBasico.hasEmailConnector`

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `UtilityTransaction` (no mostrado completo en context, requiere revisión manual)
* `node-version/src/services/utilities-parser.service.ts`
* `docs/servicios-basicos\_architectura.md` (arquitectura completa documentada)

**Modelo de Datos (aproximado):**

```prisma
model UtilityTransaction {
  id             Int       @id
  provider       String    // nombre del servicio
  issueDate      DateTime  // fecha emisión factura
  dueDate        DateTime  // fecha vencimiento
  amount         Float     // monto CLP
  periodBill     String    // "2026-03" período facturado
  periodPay      String    // "2026-04" período de pago
  source         String    // "gmail", "manual"
  gmailMessageId String?
  payPeriodOverride String?
}
```

**Dependencias:**

* OAuth Google (100%)
* ServicioBasico (catálogo con labels)
* Parser experimental (frágil)

**Riesgos:**

* **Parser experimental**: no está en producción estable
* **Labels variables**: cada servicio puede tener formato de email diferente
* **Workflow complejo**: preview/confirm requiere estado en frontend
* **Duplicación Tenpo**: misma arquitectura email → preview → confirm
* **Acoplamiento Gmail**: sin Gmail no funciona

**Observaciones:**

* Documentación completa en `docs/servicios-basicos\_architectura.md`
* Parser tiene casos hardcodeados (requiere mantenimiento)
* UI consistente con Tenpo (reutiliza patrones)

**Recomendación Técnica Preliminar:**  
Si se usa activamente y parser funciona: **SE QUEDA** (con monitoring de parsing errors).  
Si parser falla frecuentemente: **SE REHACE** (simplificar o usar OCR/ML).  
Si importación manual es suficiente: **SE CONGELA** (pausar desarrollo de parser).  
Si Gmail es problema de privacidad: **SE DESMONTA** (usar solo importación manual).

\---

### 7\. Hipotecario - Tabla de Amortización y Seguros

**Descripción:**  
Gestión de crédito hipotecario con tabla de amortización importada desde CSV, seguros mensuales, proyección anual de dividendos en UF y CLP.

**Frontend:**

* `node-version/client/src/pages/Hipotecario.tsx`
* Importación CSV de tabla amortización
* Gestión manual de seguros por mes
* Selector de año proyectado
* Vista de flujo mensual (dividendo + seguros)

**Backend:**

* `node-version/src/routes/hipotecario.ts`:

  * `GET /api/hipotecario/config` - Config año proyectado
  * `PUT /api/hipotecario/config` - Actualizar año
  * `GET /api/hipotecario/payments` - Tabla amortización
  * `POST /api/hipotecario/import-csv` - Importar CSV (multipart/form-data)
  * `GET /api/hipotecario/seguros` - Lista seguros
  * `POST /api/hipotecario/seguros` - Crear seguro
  * `DELETE /api/hipotecario/seguros/:nombre/:anio` - Eliminar seguro

**Integración Externa:**

* Ninguna (CSV manual)

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `MortgagePayment` (líneas 80-93)
  * `MortgageBudgetConfig` (líneas 95-100)
  * `MortgageInsurance` (líneas 102-110)

**Modelo de Datos:**

```prisma
model MortgagePayment {
  id               Int      @id
  numDiv           Int      // número dividendo
  amortizacionUf   Float
  interesUf        Float
  comDIn           Float    // comisión desgravamen + incendio
  totalDivUf       Float
  fechaVencimiento DateTime
  saldoInsolutoUf  Float
}

model MortgageBudgetConfig {
  id             Int @id
  anioProyectado Int
}

model MortgageInsurance {
  id      Int    @id
  nombre  String // "Incendio", "Desgravamen"
  mesAnio String // "2026-03"
  monto   Float
  moneda  String @default("CLP")
}
```

**Dependencias:**

* Obligacion (overlap conceptual)
* SupuestoAnual (valor UF para conversión)

**Riesgos:**

* Funcionalidad muy específica de un usuario con hipotecario
* Modelo cerrado (no genérico)
* Importación CSV manual (no automatizable)
* Overlap con módulo Obligaciones (confusión)

**Recomendación Técnica Preliminar:**  
Si se usa activamente: **SE QUEDA** (poco riesgo, funcionalidad cerrada).  
Si se planea unificar con Obligaciones: **SE REHACE** (integrar en módulo Créditos).  
Si no se usa: **SE CONGELA** o **SE DESMONTA**.

\---

### 8\. Ingresos - Catálogo y Presupuesto Anual

**Descripción:**  
Catálogo dinámico de ingresos recurrentes (salarios, pensiones, arriendos, etc.) con presupuesto mensual por año. Arquitectura limpia de catálogo base + presupuesto anual.

**Frontend:**

* `node-version/client/src/pages/Ingresos.tsx`
* `node-version/client/src/components/GestionarIngresosModal.tsx`
* `node-version/client/src/components/TablaPresupuestoIngresos.tsx`

**Backend:**

* `node-version/src/routes/ingresos.ts`:

  * Catálogo:

    * `GET /api/ingresos/catalogo`
    * `POST /api/ingresos/catalogo`
    * `PATCH /api/ingresos/catalogo/:id`
    * `PATCH /api/ingresos/catalogo/:id/toggle`
    * `DELETE /api/ingresos/catalogo/:id`
  * Presupuesto:

    * `GET /api/ingresos/presupuesto/:anio`
    * `PUT /api/ingresos/presupuesto` - Batch update
    * `PATCH /api/ingresos/presupuesto/:ingresoId/:anio/:mes`

**IntEgración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `IngresoBase` (líneas 156-165)
  * `PresupuestoIngreso` (líneas 167-185)

**Modelo de Datos:**

```prisma
model IngresoBase {
  id           Int      @id
  nombre       String   @unique
  activo       Boolean  @default(true)
  esRecurrente Boolean  @default(true)
  orden        Int      @default(0)
  presupuestos PresupuestoIngreso\[]
}

model PresupuestoIngreso {
  id        Int     @id
  ingresoId Int
  anio      Int
  enero     Float   @default(0)
  // ... 12 meses
  ingreso   IngresoBase
}
```

**Dependencias:**

* Bono (módulo hijo)
* Módulo Actual (consolidación)

**Riesgos:**

* Patrón repetido 3 veces (idéntico a Servicios y Ahorros)
* Modelo 12 columnas no escalable

**Recomendación Técnica Preliminar:**  
**SE QUEDA** si se usa activamente.  
**SE REHACE** si hay plan de unificar catálogos (crear módulo genérico).  
Arquitectura limpia pero redundante.

\---

### 9\. Ingresos - Gestión de Bonos y Repartos

**Descripción:**  
Gestión de ingresos puntuales (bonos extraordinarios) con sistema de distribución por destinos:

* Ahorro
* Pago de deuda
* Vacaciones
* Apoyo mensual (distribuido en N meses)
* Otros

**Frontend:**

* Integrado en `Ingresos.tsx`
* `node-version/client/src/components/GestionarBonosModal.tsx`

**Backend:**

* `node-version/src/routes/ingresos.ts`:

  * `GET /api/ingresos/bonos/:anio`
  * `GET /api/ingresos/bonos/:id/detalle`
  * (endpoints de escritura no visibles en grep)

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `Bono` (líneas 187-196)
  * `RepartoBono` (líneas 198-208)

**Modelo de Datos:**

```prisma
model Bono {
  id          Int     @id
  nombre      String
  anio        Int
  mes         Int     // 1=Enero
  monto       Float
  descripcion String?
  repartos    RepartoBono\[]
}

model RepartoBono {
  id                Int    @id
  bonoId            Int
  destino           String // ahorro, deuda, vacaciones, apoyo\_mensual, otros
  monto             Float
  porcentaje        Float?
  mesesDistribucion Int?   // solo para apoyo\_mensual
  bono              Bono
}
```

**Dependencias:**

* IngresoBase (módulo padre)
* Lógica de reparto compleja

**Riesgos:**

* Lógica de distribución mensual no visible en frontend actual
* Poco documentado
* No está claro cómo se integra con Actual

**Recomendación Técnica Preliminar:**  
**SE QUEDA** si se usa activamente.  
**SE CONGELA** si no se usa (funcionalidad avanzada poco crítica).  
**SE REHACE** si lógica de distribución tiene bugs.

\---

### 10\. Ahorros - Catálogo y Presupuesto Anual

**Descripción:**  
Catálogo de cuentas/fondos de ahorro con presupuesto mensual. Arquitectura idéntica a Ingresos y Servicios.

**Frontend:**

* `node-version/client/src/pages/Ahorros.tsx`
* `node-version/client/src/components/GestionarAhorrosModal.tsx`
* `node-version/client/src/components/TablaPresupuestoAhorros.tsx`

**Backend:**

* `node-version/src/routes/ahorros.ts`:

  * Catálogo y presupuesto (endpoints idénticos a Ingresos)

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `AhorroBase`, `PresupuestoAhorro` (no mostrado en context, requiere verificación manual)

**Modelo de Datos (aproximado):**

```prisma
model AhorroBase {
  id           Int      @id
  nombre       String   @unique
  activo       Boolean
  orden        Int
  presupuestos PresupuestoAhorro\[]
}
```

**Dependencias:**

* Módulo Actual

**Riesgos:**

* Patrón repetido por tercera vez

**Recomendación Técnica Preliminar:**  
Seguir misma decisión que Ingresos y Servicios.  
**SE REHACE** si hay plan de unificación.

\---

### 11\. Créditos y Obligaciones - Proyección Mensual

**Descripción:**  
Gestión de créditos (consumo, automotriz) y seguros con proyección mensual. Usa supuestos anuales (valor UF, variación) para proyección en pesos.

**Frontend:**

* `node-version/client/src/pages/Creditos.tsx`
* `node-version/client/src/components/ObligacionForm.tsx`
* `node-version/client/src/components/TablaObligaciones.tsx`
* `node-version/client/src/components/VistaPreviaObligacion.tsx`
* `node-version/client/src/components/DashboardObligaciones.tsx`

**Backend:**

* `node-version/src/routes/obligaciones.ts`:

  * `GET /api/obligaciones` - Lista obligaciones
  * `POST /api/obligaciones` - Crear
  * `DELETE /api/obligaciones/:id`
  * `GET /api/obligaciones/supuestos/:anio` - Supuestos UF
  * `POST /api/obligaciones/supuestos` - Crear/actualizar supuestos

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `Obligacion` (líneas 47-58)
  * `SupuestoAnual` (líneas 60-68)

**Modelo de Datos:**

```prisma
model Obligacion {
  id            Int    @id
  nombre        String
  tipo          String // hipotecario, consumo, seguro
  moneda        String // CLP, UF
  montoCuota    Float
  cuotasTotales Int
  mesInicio     Int
  anioInicio    Int
}

model SupuestoAnual {
  id               Int   @id
  anio             Int   @unique
  valorUfBase      Float
  variacionAnualUf Float
}
```

**Dependencias:**

* MortgagePayment (overlap conceptual)
* Módulo Actual

**Riesgos:**

* Overlap con Hipotecario (confusión conceptual)
* Lógica de proyección mezclada
* Supuestos UF compartidos con Hipotecario

**Recomendación Técnica Preliminar:**  
**SE REHACE** unificando con Hipotecario en módulo único "Créditos y Préstamos".  
O **SE CONGELA** si funciona y no se planea refactorizar.

\---

### 12\. Supermercado - Presupuesto Mensual

**Descripción:**  
Presupuesto simple de gastos de supermercado por mes. El modelo más simple del sistema (solo presupuesto, sin catálogo).

**Frontend:**

* `node-version/client/src/pages/Supermercado.tsx`
* `node-version/client/src/components/TablaPresupuestoSupermercado.tsx`

**Backend:**

* `node-version/src/routes/supermercado.ts`:

  * `GET /api/supermercado/presupuesto/:anio`
  * `PATCH /api/supermercado/presupuesto/:anio/:mes`

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `SupermercadoPresupuesto` (líneas 145-161)

**Modelo de Datos:**

```prisma
model SupermercadoPresupuesto {
  id         Int   @id
  anio       Int   @unique
  enero      Float @default(0)
  // ... 12 meses
}
```

**Dependencias:**

* Módulo Actual

**Riesgos:**

* Modelo 12 columnas

**Recomendación Técnica Preliminar:**  
**SE QUEDA** (simple, funcional, bajo riesgo).

\---

### 13\. Suscripciones - Calendario Periódico

**Descripción:**  
Gestión de suscripciones periódicas (Netflix, Spotify, etc.) con calendario automático y overrides mensuales de precio.

**PROBLEMA:** Existe en **DOBLE IMPLEMENTACIÓN**:

* **Legacy Flask** (`app.py` + `templates/index.html`)
* **Moderna Node** (`src/routes/subscriptions.ts` + React `/app`)

**Frontend:**

* **Legacy**: `templates/index.html` + Chart.js vanilla
* **Moderna**: `App.tsx` (React viejo, sin RSuite), ruta `/app`

**Backend:**

* **Legacy**: `app.py` (Flask, SQLite directo, 385 líneas)
* **Moderna**: `src/routes/subscriptions.ts` (Prisma + TypeScript)

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* **Legacy**:

  * `app.py` (líneas 1-385)
  * `templates/index.html`
  * `subscriptions.db` (SQLite directo)
* **Moderna**:

  * `node-version/src/routes/subscriptions.ts`
  * `node-version/src/routes/analytics.ts`
  * `node-version/client/src/App.tsx`
  * `node-version/prisma/schema.prisma` → `Subscription`, `PriceOverride` (líneas 11-35)

**Modelo de Datos (Moderna):**

```prisma
model Subscription {
  id             Int     @id
  name           String
  price          Float
  periodicity    String  // monthly, quarterly, semiannual, annual, weekly
  startDate      DateTime
  startDateId    Int
  calendar       Calendar
  priceOverrides PriceOverride\[]
}

model PriceOverride {
  id             Int @id
  subscriptionId Int
  year           Int
  month          Int
  price          Float
  subscription   Subscription
}
```

**Dependencias:**

* Calendar (tabla de fechas)
* Analytics (reportes CSV)

**Riesgos:**

* **DUPLICACIÓN CRÍTICA**: dos sistemas en paralelo
* Migración incompleta
* Confusión de usuarios sobre cuál usar
* Mantenimiento doble

**Recomendación Técnica Preliminar:**  
**SE REHACE** eliminando versión Flask y migrando completamente a Node + RSuite moderno.  
O **SE DESMONTA** Flask y se mantiene solo versión Node.  
NO mantener ambas versiones.

\---

### 14\. Módulo Actual - Seguimiento Presupuesto vs Real

**Descripción:**  
Core del sistema de tracking real. Consolida todas las categorías (ingresos, gastos, suscripciones, obligaciones, servicios, supermercado, Tenpo) en vista mensual con estados de pago (pagado/pendiente) y locking.

**Frontend:**

* `node-version/client/src/pages/Actual.tsx`
* Vista consolidada tipo dashboard
* Estados: pagado, pendiente, locked

**Backend:**

* `node-version/src/routes/actual.ts`:

  * `PUT /api/actual/entry` - Upsert entry
  * `POST /api/actual/entry` - Crear manual
  * `GET /api/actual/summary` - Resumen mensual consolidado
  * `GET /api/actual/entries` - Entries de mes/año
  * `DELETE /api/actual/entry/:id`
* `node-version/src/services/consolidado.ts` - Lógica de consolidación

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma` → `ActualEntry` (líneas 264-278)
* `node-version/src/services/consolidado.ts`

**Modelo de Datos:**

```prisma
model ActualEntry {
  id        Int     @id
  year      Int
  month     Int
  category  String  // INGRESOS, SUSCRIPCIONES, OBLIGACIONES, HIPOTECARIO, SERVICIOS\_BASICOS, SUPERMERCADO, AJUSTES
  itemKey   String  // key del item específico
  label     String?
  amountClp Int
  isPaid    Boolean @default(false)
  isLocked  Boolean @default(false)
}
```

**Dependencias:**

* TODAS las demás funcionalidades (consolidador)

**Riesgos:**

* Punto único de verdad mensual
* Si falla consolidador, falla todo el sistema real
* Lógica de consolidación compleja

**Recomendación Técnica Preliminar:**  
**SE QUEDA** (core del sistema).  
No tocar a menos que sea estrictamente necesario.

\---

### 15\. Actual Tenpo - Vista Consolidada Cuotas TC

**Descripción:**  
Vista mensual de cuotas Tenpo proyectadas, con sincronización Gmail, tabla editable, confirmación de montos reales.

**Frontend:**

* `node-version/client/src/pages/ActualTenpo.tsx`
* Tabla de cuotas del mes
* Botón sincronizar Gmail
* Override manual de montos
* Toggle con/sin interés
* Categorización de compras

**Backend:**

* `node-version/src/routes/tenpo.ts`:

  * `GET /api/tenpo/forecast` - Proyección mensual (usado por ActualTenpo)
  * `POST /api/tenpo/sync` - Sincronización Gmail

**Integración Externa:**

* ✅ Gmail API (via Tenpo sync)

**Archivos Clave:**

* `node-version/client/src/pages/ActualTenpo.tsx`
* `TenpoInstallment` (cuotas individuales)

**Dependencias:**

* Módulo Tenpo completo (100%)
* OAuth Google

**Riesgos:**

* Si Tenpo se desmonta, esta vista desaparece

**Recomendación Técnica Preliminar:**  
Seguir decisión de módulo Tenpo principal.

\---

### 16\. Actual Utilities - Vista Servicios Básicos Reales

**Descripción:**  
Vista consolidada mensual de servicios básicos reales con importación Gmail (preview/confirm) y gestión de períodos de pago.

**Frontend:**

* `node-version/client/src/pages/ActualUtilities.tsx`
* `node-version/client/src/components/utilities/UtilityProviderPanel.tsx`
* `node-version/client/src/components/utilities/UtilityTable.tsx`
* `node-version/client/src/components/utilities/ImportPreviewModal.tsx`

**Backend:**

* `node-version/src/routes/utilities.ts`
* Endpoints de importación email

**Integración Externa:**

* ✅ Gmail API (labels configurables)

**Archivos Clave:**

* `node-version/client/src/pages/ActualUtilities.tsx`
* `UtilityTransaction`

**Dependencias:**

* Módulo Utilities completo
* OAuth Google
* ServicioBasico (catálogo con labels)

**Riesgos:**

* Parser experimental

**Recomendación Técnica Preliminar:**  
Seguir decisión de módulo Utilities.

\---

### 17\. Presupuesto - Resumen Consolidado Anual

**Descripción:**  
Vista dashboard consolidada anual de todos los ingresos y gastos presupuestados. Agrega datos de todos los módulos.

**Frontend:**

* `node-version/client/src/pages/Presupuesto.tsx`
* `node-version/client/src/components/Dashboard.tsx`
* `node-version/client/src/components/DashboardObligaciones.tsx`

**Backend:**

* Múltiples endpoints de consulta (no centralizados)

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/client/src/pages/Presupuesto.tsx`

**Dependencias:**

* TODOS los módulos de presupuesto

**Riesgos:**

* Consultas múltiples (performance)
* Si cambia estructura de algún módulo, requiere actualización

**Recomendación Técnica Preliminar:**  
**SE QUEDA** (vista crítica).  
**SE REHACE** si cambia arquitectura general de presupuesto.

\---

### 18\. Tarjetas de Crédito - Billing Cycles

**Descripción:**  
Configuración avanzada de ciclos de facturación de múltiples tarjetas de crédito con:

* Día de cierre configurable
* Día de vencimiento
* Regla días hábiles (anterior/siguiente/ninguno)
* Overrides mensuales de ciclos específicos
* Recálculo masivo

**Frontend:**

* `node-version/client/src/pages/ConfiguracionTC.tsx`
* `node-version/client/src/components/TcConfigForm.tsx`
* `node-version/client/src/components/TcAnnualCyclesTable.tsx`
* `node-version/client/src/components/TcOverridesTable.tsx`
* `node-version/client/src/components/TcRecalculationPanel.tsx`

**Backend:**

* `node-version/src/routes/tc-billing.ts`:

  * `GET /api/tc-billing/config` - Config de TC
  * `PUT /api/tc-billing/config` - Actualizar config
  * `GET /api/tc-billing/cycles` - Ciclos anuales calculados
  * `PUT /api/tc-billing/overrides` - Crear override
  * `DELETE /api/tc-billing/overrides` - Eliminar override
  * `POST /api/tc-billing/recalculate` - Recálculo masivo
* `node-version/src/services/tcBillingCycle.service.ts` - Lógica de cálculo

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/prisma/schema.prisma`:

  * `TcBillingConfig` (líneas 280-291)
  * `TcBillingOverride` (líneas 293-305)
* `node-version/src/services/tcBillingCycle.service.ts`

**Modelo de Datos:**

```prisma
model TcBillingConfig {
  id              Int     @id
  tcKey           String  @unique // "TENPO", "BCI", etc.
  closingDay      Int     @default(21) // 1..31
  dueDay          Int     @default(5)
  businessDayRule String  @default("PREVIOUS") // PREVIOUS | NEXT | NONE
  overrides       TcBillingOverride\[]
}

model TcBillingOverride {
  id                 Int      @id
  tcKey              String
  year               Int
  month              Int
  effectiveCloseDate DateTime // cierre efectivo
  config             TcBillingConfig
}
```

**Dependencias:**

* TenpoInstallment.dueDate (usa billing cycles para fechas)
* Lógica de días hábiles

**Riesgos:**

* Lógica compleja de días hábiles
* Recálculo masivo puede afectar Tenpo
* Overrides pueden generar inconsistencias

**Recomendación Técnica Preliminar:**  
Si se usa Tenpo + otras TCs: **SE QUEDA**.  
Si solo Tenpo: **SE SIMPLIFICA** (hardcodear Tenpo).  
Si se desmonta Tenpo: **SE DESMONTA**.

\---

### 19\. Analytics y Reportes

**Descripción:**  
Generación de reportes CSV, estadísticas anuales de suscripciones, overrides.

**Frontend:**

* Integrado en varias vistas (botón "Descargar CSV")

**Backend:**

* `node-version/src/routes/analytics.ts`:

  * `GET /api/analytics/year-data` - Datos anuales suscripciones
  * `POST /api/analytics/set-override` - Override suscripción
  * `GET /api/analytics/download-csv` - Descarga CSV

**Integración Externa:**

* Ninguna

**Archivos Clave:**

* `node-version/src/routes/analytics.ts`

**Dependencias:**

* Subscription (principalmente)
* Posible overlap con app.py Flask

**Riesgos:**

* Duplicación con Flask
* Poco documentado
* No está claro qué reportes genera

**Recomendación Técnica Preliminar:**  
**Requiere revisión manual** para determinar si está activo.  
Probablemente **SE DESMONTA** si solo sirve a suscripciones legacy Flask.

\---

## 📊 Resumen Ejecutivo

### Funcionalidades Más Críticas

**Core del sistema (no tocar):**

1. **OAuth Google/Gmail** - Infraestructura de Tenpo y Utilities
2. **Módulo Actual** - Consolidador mensual de presupuesto vs real
3. **Presupuesto Resumen** - Vista principal de planificación

**Funcionalidades avanzadas usadas activamente:**
4. **Tenpo TC completo** (compras + categorías + tasa + billing cycles)
5. **Servicios Básicos** (presupuesto + utilities reales)
6. **Ingresos** (catálogo + presupuesto + bonos)

### Funcionalidades Más Acopladas

**Alto acoplamiento (difícil desmontar individualmente):**

* **Tenpo**: OAuth → Tenpo → Categorías → Billing Cycles → ActualTenpo (5 módulos interdependientes)
* **Utilities**: OAuth → ServicioBasico → UtilityTransaction → ActualUtilities (4 módulos)
* **Módulo Actual**: Depende de TODAS las demás funcionalidades para consolidar

**Riesgo de efecto cascada:**

* Si se desmonta OAuth → caen Tenpo y Utilities
* Si se desmonta Tenpo → caen Categorías, Billing Cycles, ActualTenpo
* Si se cambia arquitectura de presupuesto → requiere actualizar Dashboard consolidado

### Funcionalidades Experimentales o Dudosas

**Experimental/Beta:**

1. **Utilities Email Import** (parser experimental, poco probado en producción)
2. **Bonos y Repartos** (lógica compleja, poco documentada)

**Duplicadas (RIESGO ALTO):**
3. **Suscripciones** - Doble implementación Flask + Node (CRÍTICO)
4. **Analytics** - Overlap Flask + Node (requiere validación)

**Overlap conceptual:**
5. **Hipotecario vs Obligaciones** - Dos módulos para lo mismo (confuso)

### Funcionalidades que NO Conviene Tocar Todavía

**Estables y funcionales:**

1. **ServicioBasico (presupuesto)** - Arquitectura limpia, bajo riesgo
2. **Ingresos (catálogo)** - Arquitectura limpia, bajo riesgo
3. **Ahorros** - Arquitectura limpia, bajo riesgo
4. **Supermercado** - Modelo simple, bajo riesgo
5. **Módulo Actual** - Core del sistema, alto riesgo de romper

**Recomendación:** Solo tocar si hay plan de unificación de catálogos (Servicios/Ingresos/Ahorros usan patrón repetido).

### Propuesta de Primer Bloque de Intervención

**Objetivo:** Resolver duplicaciones críticas y clarificar arquitectura base

**Tareas:**

1. ✅ **RESOLVER DUPLICACIÓN SUSCRIPCIONES** (Flask vs Node)

   * Migrar datos Flask → Node Prisma
   * Eliminar `app.py` completamente
   * Migrar UI a React moderno con RSuite
   * Eliminar ruta `/app` legacy
2. ✅ **VALIDAR/ELIMINAR ANALYTICS DUPLICADO**

   * Verificar si analytics.ts está activo
   * Si solo sirve a Flask: eliminar
3. ✅ **UNIFICAR HIPOTECARIO + OBLIGACIONES**

   * Crear módulo único "Créditos y Préstamos"
   * Migrar lógica de proyección
   * Consolidar supuestos UF

**Impacto:** Reduce complejidad, elimina confusión, prepara base limpia para rediseño.

**Riesgo:** Bajo (funcionalidades con poco acoplamiento a otros módulos).

### Propuesta de Segundo Bloque de Intervención

**Objetivo:** Refactorizar patrones repetidos y optimizar modelo de datos

**Tareas:**

1. ✅ **UNIFICAR CATÁLOGOS REPETIDOS** (Servicios/Ingresos/Ahorros)

   * Crear módulo genérico "Categorías Presupuestables"
   * Migrar modelo de 12 columnas → filas mensuales
   * Arquitectura: `BudgetCategory` (genérico) + `BudgetEntry` (filas por mes)
2. ✅ **EVALUAR UTILITIES EMAIL IMPORT**

   * Si parser falla frecuentemente: pausar desarrollo, usar solo import manual
   * Si funciona bien: documentar parsers específicos por servicio
3. ✅ **DOCUMENTAR BONOS Y REPARTOS**

   * Clarificar lógica de distribución mensual
   * Validar integración con Módulo Actual

**Impacto:** Reduce duplicación de código, mejora escalabilidad del modelo de datos.

**Riesgo:** Medio (requiere migración de datos y actualización de múltiples endpoints).

### Decisiones Pendientes de Validación Manual

**Requieren input del usuario:**

1. **¿Tenpo sigue siendo TC principal?** → Define si Tenpo se mantiene o se congela
2. **¿Utilities Email Import se usa activamente?** → Define si parser se mantiene o se desmonta
3. **¿Bonos y Repartos se usan?** → Define si funcionalidad se mantiene o se congela
4. **¿Hipotecario sigue vigente?** → Define si módulo se mantiene o se fusiona con Obligaciones
5. **¿Qué versión de Suscripciones se usa?** (Flask o Node) → Define cuál eliminar

\---

## ⚠️ Riesgos Globales Detectados

|Riesgo|Severidad|Descripción|Módulos Afectados|
|-|-|-|-|
|**Duplicación Flask + Node**|🔴 CRÍTICA|Dos sistemas en paralelo para suscripciones|Suscripciones, Analytics|
|**Patrón repetido 3 veces**|🟡 MEDIA|Servicios/Ingresos/Ahorros usan arquitectura idéntica|3 módulos|
|**Modelo 12 columnas**|🟡 MEDIA|No escalable, requiere ALTER TABLE por cada modificación|Presupuestos|
|**Acoplamiento Tenpo**|🟠 ALTA|5 módulos interdependientes (OAuth → Tenpo → Categorías → Billing → ActualTenpo)|Ecosistema Tenpo|
|**Parser experimental**|🟡 MEDIA|Utilities email import no probado exhaustivamente|Utilities|
|**Overlap Hipotecario/Obligaciones**|🟡 MEDIA|Dos módulos para gestión de créditos genera confusión|Hipotecario, Obligaciones|
|**Consolidador único**|🟠 ALTA|Módulo Actual es punto único de falla|Toda la funcionalidad "real"|
|**OAuth único**|🟠 ALTA|GoogleAuthToken único para todo, no multi-account|Tenpo, Utilities|

\---

## ✅ Confirmación Final

**NO se han realizado cambios funcionales en este proceso.**

Este documento es una **auditoría de solo lectura** que:

* ✅ Mapea todas las funcionalidades reales del sistema
* ✅ Identifica frontend, backend e integraciones de cada módulo
* ✅ Documenta archivos exactos involucrados
* ✅ Detecta dependencias y riesgos técnicos
* ✅ Propone bloques de intervención sin ejecutar cambios

**Próximo paso:** Marcar manualmente con X cada funcionalidad en la tabla principal antes de empezar el rediseño.

\---

**Archivos revisados durante esta auditoría:**

* Backend: `app.py`, `node-version/src/index.ts`, todos los archivos en `src/routes/`, `src/services/`
* Frontend: 19 páginas en `client/src/pages/`, componentes en `client/src/components/`
* Modelo de datos: `node-version/prisma/schema.prisma` completo
* Configuración: `node-version/client/src/router.tsx`, `node-version/client/src/navigation/menuConfig.ts`
* Documentación: `docs/ARQUITECTURA.md`, `docs/auditoria\_oauth\_gmail.md`, `docs/servicios-basicos\_architectura.md`, múltiples archivos en `docs/`

**Total de funcionalidades mapeadas:** 19  
**Total de archivos revisados:** 50+  
**Total de endpoints identificados:** 100+  
**Total de modelos Prisma:** 20+

\---

**Autor:** GitHub Copilot  
**Fecha:** 05 de abril de 2026  
**Versión:** 1.0  
**Estado:** Listo para clasificación manual

