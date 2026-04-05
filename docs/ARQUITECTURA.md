# Arquitectura del Sistema Zapps

**Fecha:** 21 de Febrero, 2026 (actualizado 05 de Abril, 2026)  
**Versión:** 3.0 - Post-desmontaje  
**Autor:** Documentación del Sistema

---

## ⚠️ Nota de Versión 3.0

**Actualizado:** 05 de Abril de 2026  
**Cambio:** Eliminación de 8 módulos (Tenpo TC, Bonos, TC Billing, Analytics)  
Ver: [plan-desmontaje-modulos-zapp.md](plan-desmontaje-modulos-zapp.md)

---

## 📋 Resumen Ejecutivo

Zapps es un **sistema de gestión financiera personal** desarrollado en **Node.js + TypeScript** con frontend **React**. Permite planificar ingresos y egresos mensuales/anuales, gestión de créditos, hipotecario, servicios básicos, y seguimiento de presupuesto vs actual.

### Características Principales
- 📅 Suscripciones periódicas con calendario
- 🏠 Cálculo hipotecario con tabla de amortización
- 💰 Gestión de ingresos (salarios)
- 🔧 Servicios básicos mensuales (importación Gmail)
- 🛒 Presupuesto de supermercado
- 💾 Gestión de ahorros
- 📊 Módulo "Actual" (presupuesto vs realidad)
- 📧 OAuth2 Gmail para procesamiento de emails

---

## 🏗️ Stack Tecnológico

### Backend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| **Runtime** | Node.js | 18+ | Servidor JavaScript |
| **Framework** | Express.js | 4.x | API REST |
| **Lenguaje** | TypeScript | 5.x | Type safety |
| **ORM** | Prisma | 5.x | Acceso a BD |
| **Base de Datos** | SQLite | 3.x | Almacenamiento (dev) |
| **Autenticación** | Google OAuth2 | 2.x | Gmail API |
| **Email Parsing** | Custom Gmail API | - | Procesamiento facturas |

### Frontend
| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| **Framework** | React | 18.x | UI Library |
| **Lenguaje** | TypeScript | 5.x | Type safety |
| **Build Tool** | Vite | 5.x | Bundler |
| **Router** | React Router | 7.x | Navegación SPA |
| **Gráficos** | Recharts | 2.x | Visualizaciones |
| **Estilos** | CSS Vanilla | - | Estilos custom |
| **Date Utils** | date-fns | 3.x | Manejo de fechas |

### Herramientas de Desarrollo
- **Linter**: ESLint + TypeScript ESLint
- **Package Manager**: npm
- **Version Control**: Git
- **Debugging**: VS Code + Chrome DevTools

---

## 📁 Estructura del Proyecto

```
Zapps/
├── node-version/                    # Aplicación principal (Node.js)
│   ├── prisma/                      # Prisma ORM
│   │   ├── schema.prisma           # Schema de base de datos
│   │   ├── migrations/             # Migraciones SQL
│   │   └── dev.db                  # SQLite database (dev)
│   │
│   ├── src/                        # Backend (Express + TypeScript)
│   │   ├── index.ts                # Entry point del servidor
│   │   ├── db.ts                   # Cliente Prisma
│   │   ├── routes/                 # Endpoints API
│   │   │   ├── subscriptions.ts   # CRUD suscripciones
│   │   │   ├── obligaciones.ts    # Créditos y seguros
│   │   │   ├── hipotecario.ts     # Gestión hipotecario
│   │   │   ├── ingresos.ts        # Gestión ingresos
│   │   │   ├── servicios-basicos.ts
│   │   │   ├── supermercado.ts
│   │   │   ├── google-integration.ts # Gmail OAuth
│   │   │   └── actual.ts          # Módulo Actual
│   │   │
│   │   └── services/               # Lógica de negocio
│   │       └── (servicios varios)
│   │
│   ├── client/                     # Frontend (React + TypeScript)
│   │   ├── src/
│   │   │   ├── main.tsx            # Entry point React
│   │   │   ├── App.tsx             # Componente App (legacy)
│   │   │   ├── router.tsx          # Configuración de rutas
│   │   │   ├── index.css           # Estilos globales
│   │   │   │
│   │   │   ├── api/                # Clients API
│   │   │   │   └── (varios clients)
│   │   │   │
│   │   │   ├── layout/             # Layouts
│   │   │   │   └── MainLayout.tsx  # Layout principal
│   │   │   │
│   │   │   ├── pages/              # Páginas (rutas)
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Presupuesto.tsx
│   │   │   │   ├── Actual.tsx
│   │   │   │   ├── Creditos.tsx
│   │   │   │   ├── Hipotecario.tsx
│   │   │   │   ├── Ingresos.tsx
│   │   │   │   ├── ServiciosBasicos.tsx
│   │   │   │   └── Supermercado.tsx
│   │   │   │
│   │   │   ├── components/         # Componentes reutilizables
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── AddSubscriptionForm.tsx
│   │   │   │   ├── SubscriptionTable.tsx
│   │   │   │   ├── ObligacionForm.tsx
│   │   │   │   ├── TablaObligaciones.tsx
│   │   │   │   ├── VistaPreviaObligacion.tsx
│   │   │   │   ├── TablaPresupuesto*.tsx
│   │   │   │   ├── YearAndUFSelector.tsx
│   │   │   │   ├── GestionarIngresosModal.tsx
│   │   │   │   ├── GestionarCatalogoModal.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── actual/         # Componentes módulo Actual
│   │   │   │       ├── ActualRow.tsx
│   │   │   │       └── ...
│   │   │   │
│   │   │   └── types/              # TypeScript types
│   │   │       └── actual.ts
│   │   │
│   │   ├── index.html              # HTML template
│   │   ├── vite.config.ts          # Configuración Vite
│   │   └── package.json            # Dependencias frontend
│   │
│   ├── package.json                # Dependencias backend
│   └── tsconfig.json               # Config TypeScript
│
├── src/                            # Python legacy (NO EN USO)
│   └── planificador/
│
├── docs/                           # Documentación
│   ├── ARQUITECTURA.md             # Este documento
│   ├── FASE_0_RSUITE_PREPARACION.md
│   ├── PLAN_IMPLEMENTACION_RSUITE.md
│   ├── README.md                   # Índice documentación
│   ├── DESARROLLO.md               # Guía desarrollo
│   ├── CREDENCIALES_GOOGLE.md      # Setup Gmail OAuth
│   └── archive/                    # Documentación obsoleta
│
├── scripts/                        # Scripts utilidades
│   └── run.ps1
│
├── start.ps1                       # Script inicio rápido
├── start.bat                       # Script inicio rápido (bat)
├── README.md                       # README principal
└── README-INICIO.md                # Guía inicio rápido

```

---

## 🗄️ Modelo de Datos (Prisma Schema)

### Entidades Principales

#### 1. **Suscripciones** (`Subscription`)
Servicios periódicos (Netflix, Spotify, etc.)

```prisma
model Subscription {
  id             Int
  name           String
  price          Float
  periodicity    String          // weekly, monthly, quarterly, semiannual, annual
  startDate      DateTime
  startDateId    Int
  priceOverrides PriceOverride[]
}
```

**Relaciones:**
- `priceOverrides`: Permite sobrescribir precio en meses específicos

---

#### 2. **Obligaciones** (`Obligacion`)
Créditos de consumo y seguros con cuota fija conocida

```prisma
model Obligacion {
  id            Int
  nombre        String
  tipo          String    // hipotecario, consumo, seguro
  moneda        String    // CLP, UF
  montoCuota    Float
  cuotasTotales Int
  mesInicio     Int      // 1-12
  anioInicio    Int
}
```

**Lógica:**
- Sistema calcula automáticamente en qué meses aplica cada cuota
- Soporta UF con conversión automática

---

#### 3. **Hipotecario** (`MortgagePayment`)
Tabla de amortización completa del crédito hipotecario

```prisma
model MortgagePayment {
  id                Int
  numDiv            Int
  amortizacionUf    Float
  interesUf         Float
  comDIn            Float
  totalDivUf        Float
  fechaVencimiento  DateTime
  saldoInsolutoUf   Float
}
```

**Features:**
- Importación desde CSV
- Cálculo mensual con proyección UF
- Seguros adicionales por mes

---

#### 4. **Ingresos** (`IngresoBase`, `PresupuestoIngreso`)
Gestión de ingresos recurrentes

```prisma
model IngresoBase {
  id           Int
  nombre       String
  activo       Boolean
  esRecurrente Boolean
  presupuestos PresupuestoIngreso[]
}

model PresupuestoIngreso {
  id        Int
  ingresoId Int
  anio      Int
  enero     Float
  febrero   Float
  // ... resto de meses
}
```

---

#### 5. **Servicios Básicos** (`ServicioBasico`, `PresupuestoServicioBasico`)
Gastos mensuales fijos/variables (luz, agua, internet, etc.)

```prisma
model ServicioBasico {
  id          Int
  nombre      String
  activo      Boolean
  esBase      Boolean  // Servicio base del catálogo
  orden       Int
  presupuestos PresupuestoServicioBasico[]
}

model PresupuestoServicioBasico {
  id         Int
  servicioId Int
  anio       Int
  enero      Float
  // ... resto de meses
}
```

---

#### 6. **Módulo Actual** (`ActualCategory`, `ActualEntry`)
Seguimiento de presupuesto vs realidad

```prisma
model ActualCategory {
  id      Int
  key     String      // subscriptions, obligaciones, etc.
  name    String
  items   ActualItem[]
}

model ActualItem {
  id         Int
  categoryId Int
  itemKey    String   // ID del item en sistema original
  label      String
  entries    ActualEntry[]
}

model ActualEntry {
  id         Int
  itemId     Int
  year       Int
  month      Int
  amount     Float
  isPaid     Boolean
  notes      String?
}
```

---

## 🔄 Flujo de Datos

### 1. Flujo de Suscripciones

```
Usuario → AddSubscriptionForm
            ↓
        POST /api/subscriptions
            ↓
        Prisma.subscription.create()
            ↓
        SQLite Database
            ↓
        GET /api/analytics/year-data
            ↓
        Cálculo de totales mensuales
            ↓
        Dashboard visualiza gráfico
```

### 2. Flujo de Presupuesto Consolidado

```
GET /api/actual/consolidated-budget?year=2026
            ↓
    Backend consulta en paralelo:
    - Subscriptions
    - Obligaciones
    - Hipotecario
    - Servicios Básicos
    - Supermercado
    - Ingresos
            ↓
    Cálculo por mes (12 meses)
            ↓
    Conversión UF → CLP
            ↓
    Response: {
      categories: [...]
      monthlyTotals: [...]
      ingresos: [...]
      egresos: [...]
      saldos: [...]
    }
            ↓
    Frontend Actual.tsx renderiza tabla
```

---

## 📡 API Endpoints

### Subscriptions
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Listar todas |
| POST | `/api/subscriptions` | Crear nueva |
| DELETE | `/api/subscriptions/:id` | Eliminar |

### Analytics
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/analytics/year-data?year=2026` | Totales por año |
| POST | `/api/analytics/set-override` | Override precio mes |
| GET | `/api/analytics/download-csv?year=2026` | Descargar CSV |

### Obligaciones
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/obligaciones` | Listar todas |
| POST | `/api/obligaciones` | Crear nueva |
| DELETE | `/api/obligaciones/:id` | Eliminar |
| GET | `/api/obligaciones/preview` | Preview de cuotas |

### Hipotecario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/hipotecario/import-csv` | Importar tabla amortización |
| GET | `/api/hipotecario/proyeccion` | Proyección anual |
| POST | `/api/hipotecario/seguros` | Gestionar seguros |

### Ingresos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/ingresos` | Catálogo ingresos |
| POST | `/api/ingresos` | Crear ingreso base |
| GET | `/api/ingresos/presupuesto/:anio` | Presupuesto por año |
| POST | `/api/ingresos/presupuesto` | Guardar presupuesto |

### Servicios Básicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/servicios-basicos` | Catálogo servicios |
| POST | `/api/servicios-basicos` | Crear servicio |
| GET | `/api/servicios-basicos/presupuesto/:anio` | Presupuesto año |
| POST | `/api/servicios-basicos/presupuesto` | Guardar presupuesto |

### Supermercado
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/supermercado/presupuesto/:anio` | Presupuesto año |
| POST | `/api/supermercado/presupuesto` | Guardar presupuesto |

### Google Integration
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/google/auth-url` | URL autenticación OAuth |
| GET | `/api/google/oauth2callback` | Callback OAuth2 |
| DELETE | `/api/google/revoke` | Revocar token |

### Actual (Presupuesto vs Real)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/actual/consolidated-budget?year=2026` | Presupuesto consolidado |
| POST | `/api/actual/entry` | Guardar/actualizar entry |
| GET | `/api/actual/summary/:year/:month` | Resumen mes |

---

## 🎨 Frontend - Páginas y Componentes

### Páginas (Rutas)

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Home.tsx` | Dashboard principal con resumen |
| `/presupuesto` | `Presupuesto.tsx` | Vista general presupuesto |
| `/actual` | `Actual.tsx` | Módulo presupuesto vs actual |
| `/app` | `App.tsx` (legacy) | Gestión suscripciones |
| `/creditos` | `Creditos.tsx` | Créditos y seguros |
| `/hipotecario` | `Hipotecario.tsx` | Gestión hipotecario |
| `/ingresos` | `Ingresos.tsx` | Gestión ingresos y bonos |
| `/servicios-basicos` | `ServiciosBasicos.tsx` | Servicios básicos |
| `/supermercado` | `Supermercado.tsx` | Presupuesto supermercado |
| `/presupuesto/tenpo` | `Tenpo.tsx` | Compras y pagos Tenpo |
| `/presupuesto/tenpo/config` | `TenpoConfig.tsx` | Config tasas Tenpo |
| `/configuracion-tc/:tcKey` | `ConfiguracionTC.tsx` | Config billing cycles TC |

### Componentes Clave

#### Compartidos
- **`Sidebar.tsx`**: Navegación lateral con menú jerárquico
- **`MainLayout.tsx`**: Layout principal (sidebar + content)
- **`Toast.tsx`**: Notificaciones temporales
- **`YearAndUFSelector.tsx`**: Selector año + UF base + variación

#### Dashboards
- **`Dashboard.tsx`**: Dashboard de suscripciones (gráfico Recharts)
- **`DashboardObligaciones.tsx`**: Dashboard créditos/seguros

#### Formularios
- **`AddSubscriptionForm.tsx`**: Form crear suscripción
- **`ObligacionForm.tsx`**: Form crear obligación
- **`TcConfigForm.tsx`**: Form config TC billing

#### Tablas
- **`SubscriptionTable.tsx`**: Tabla suscripciones con delete
- **`TablaObligaciones.tsx`**: Tabla obligaciones activas
- **`TcAnnualCyclesTable.tsx`**: Tabla ciclos TC anuales
- **`TcOverridesTable.tsx`**: Tabla overrides fechas

#### Modales
- **`GestionarBonosModal.tsx`**: Modal gestión bonos (includes repartos)
- **`GestionarIngresosModal.tsx`**: Modal gestión ingresos
- **`GestionarCatalogoModal.tsx`**: Modal gestión catálogo servicios

#### Vista Previa
- **`VistaPreviaObligacion.tsx`**: Preview cuotas antes de crear

---

## 🔐 Seguridad y Autenticación

### Google OAuth2 (Gmail Integration)

```typescript
// Flujo OAuth2
1. Usuario click "Conectar Gmail"
2. Frontend → GET /api/google/auth-url
3. Redirect a consent screen de Google
4. Usuario autoriza
5. Google redirect → /api/google/oauth2callback?code=XXX
6. Backend intercambia code por tokens
7. Tokens guardados en filesystem (tokens.json)
8. Frontend puede hacer /api/tenpo/sync
```

**Scopes requeridos:**
- `https://www.googleapis.com/auth/gmail.readonly`

**Token refresh:**
- Automático en cada request si está expirado
- Refresh token guardado persistentemente

### Seguridad General
- ⚠️ **NO HAY AUTENTICACIÓN DE USUARIO** (app personal)
- SQLite local (no exposición externa)
- Gmail tokens en filesystem (no en DB)
- CORS configurado para localhost

---

## 🧮 Lógica de Negocio Clave

### 1. Cálculo de Interés Tenpo (Add-On V1)

```typescript
// Sistema Add-On: interés sobre base financiada decreciente
// Fórmula: I[n] = (baseFinanciada - sumAmortPrevia) * tasaMensual

function calcularCuotasTenpoAddOnV1(params) {
  const baseFinanciada = capitalClp + (feeClp || 0);
  const tasaMensual = tasaMensualPct / 100;
  const cuotaBase = baseFinanciada / numCuotas;
  
  for (let i = 1; i <= numCuotas; i++) {
    const saldoPendiente = baseFinanciada - (cuotaBase * (i - 1));
    const interes = saldoPendiente * tasaMensual;
    const cuotaTotal = cuotaBase + interes;
    
    // Ajuste de redondeo en última cuota
    if (i === numCuotas) {
      cuotaTotal += diferencia; // para que sume exacto
    }
  }
}
```

**Documentación:** `docs/tenpo_addon_v1_impl.md`

---

### 2. Conversión UF → CLP

```typescript
// UF mensual con variación anual
function calcularUfMensual(ufBase: number, variacionAnual: number) {
  const monthly = [];
  const variacionMensual = Math.pow(1 + variacionAnual / 100, 1 / 12) - 1;
  
  for (let mes = 0; mes < 12; mes++) {
    const ufMes = ufBase * Math.pow(1 + variacionMensual, mes);
    monthly.push(ufMes);
  }
  
  return monthly;
}
```

---

### 3. TC Billing Cycles (Cálculo de Vencimientos)

```typescript
// Given: closingDay (ej: 5), daysUntilDue (ej: 20)
// Calcula fecha de vencimiento para cada cuota mensual

function generarCiclosAnuales(tcConfig, year) {
  const cycles = [];
  
  for (let month = 1; month <= 12; month++) {
    // Fecha cierre: día X del mes actual
    let closingDate = new Date(year, month - 1, tcConfig.closingDay);
    
    // Ajustar si cae en fin de semana
    closingDate = ajustarFinDeSemana(closingDate);
    
    // Fecha vencimiento: closingDate + daysUntilDue
    let dueDate = addDays(closingDate, tcConfig.daysUntilDue);
    dueDate = ajustarFinDeSemana(dueDate);
    
    cycles.push({ month, closingDate, dueDate });
  }
  
  return cycles;
}
```

**Documentación:** `docs/tc-billing-cycle-design.md`

---

## 📊 Estado de Implementación

### ✅ Implementado y Funcionando
- [x] Suscripciones (CRUD + analytics)
- [x] Obligaciones (créditos + seguros)
- [x] Hipotecario (import CSV + proyección)
- [x] Ingresos (catálogo + presupuesto + bonos)
- [x] Servicios Básicos (catálogo + presupuesto)
- [x] Supermercado (presupuesto)
- [x] Tenpo (Gmail sync + compras + pagos)
- [x] Tenpo (compras manuales)
- [x] Tenpo (cálculo interés Add-On V1)
- [x] TC Billing Cycles (config + overrides)
- [x] Módulo Actual (presupuesto vs real)
- [x] Gmail OAuth2

### 🚧 En Progreso / Pendiente
- [ ] RSuite migration (Fase 0 en preparación)
- [ ] Testing automatizado (E2E)
- [ ] Deploy a producción
- [ ] Multi-usuario

---

## 🔄 Ciclo de Desarrollo

### Flujo de Trabajo

```bash
# 1. Modificar schema si es necesario
nano node-version/prisma/schema.prisma

# 2. Crear migración
cd node-version
npx prisma migrate dev --name add_new_feature

# 3. Implementar backend
nano src/routes/nueva-feature.ts

# 4. Implementar frontend
cd client/src
nano pages/NuevaFeature.tsx

# 5. Testing manual
# Terminal 1: npm run dev (backend)
# Terminal 2: npm run client:dev (frontend)

# 6. Commit
git add .
git commit -m "feat: nueva feature implementada"
git push
```

### Comandos Comunes

```powershell
# Backend
cd node-version
npm run dev              # Dev server
npm run build            # Build prod
npx prisma studio        # DB GUI
npx prisma migrate dev   # Nueva migración

# Frontend
cd node-version/client
npm run dev              # Dev server (Vite)
npm run build            # Build prod
npm run preview          # Preview build

# Full stack
.\start.ps1              # Inicia todo
```

---

## 📚 Documentación Relacionada

### Implementación
- [DESARROLLO.md](DESARROLLO.md) - Guía de desarrollo
- [TENPO_INTEGRATION.md](TENPO_INTEGRATION.md) - Integración Tenpo
- [CREDENCIALES_GOOGLE.md](CREDENCIALES_GOOGLE.md) - Setup Gmail OAuth

### TC Billing Cycle
- [tc-billing-cycle-design.md](tc-billing-cycle-design.md) - Diseño sistema
- [tc-billing-cycle-backend.md](tc-billing-cycle-backend.md) - Implementación backend
- [tc-billing-cycle-ui.md](tc-billing-cycle-ui.md) - Implementación UI

### Tenpo
- [tenpo-manual-purchases-api.md](tenpo-manual-purchases-api.md) - API compras manuales
- [tenpo-manual-purchases-model.md](tenpo-manual-purchases-model.md) - Modelo datos
- [tenpo-manual-purchases-ui.md](tenpo-manual-purchases-ui.md) - UI compras
- [tenpo_addon_v1_impl.md](tenpo_addon_v1_impl.md) - Cálculo interés Add-On
- [tenpo_ui_desglose.md](tenpo_ui_desglose.md) - UI desglose costos

### Futuro
- [PLAN_IMPLEMENTACION_RSUITE.md](implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md) - Plan migración RSuite
- [FASE_0_RSUITE_PREPARACION.md](implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md) - Preparación Fase 0

---

## 🏁 Conclusión

Zapps es un sistema robusto y modular de gestión financiera personal construido con tecnologías modernas. La arquitectura separa claramente frontend y backend, utiliza TypeScript para type safety, y Prisma para manejo de datos. La integración con Gmail permite automatización real del tracking de tarjetas de crédito.

**Próximo milestone:** Migración a RSuite para mejorar UI/UX y acelerar desarrollo futuro.

---

**Última actualización:** 21 de Febrero, 2026  
**Mantenedor:** Sistema Zapps  
**Contacto:** Ver README principal
