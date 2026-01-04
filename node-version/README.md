# 💳 Zapps - Node.js Version

Migración de la aplicación Python Flask a Node.js con TypeScript, Express, PostgreSQL, Prisma y React.

## 🏗️ Stack Tecnológico

**Backend:**
- Node.js + TypeScript
- Express.js (API REST)
- Prisma ORM
- PostgreSQL

**Frontend:**
- React + TypeScript
- Vite
- Recharts (gráficos)

## 📦 Instalación

### Pre-requisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm o pnpm

### 1. Configurar Backend

```powershell
cd node-version

# Instalar dependencias
npm install

# Configurar PostgreSQL
# Crear base de datos: createdb zapps
# Copiar .env.example a .env y configurar DATABASE_URL

# Ejecutar migraciones
npm run prisma:migrate

# Generar cliente Prisma
npm run prisma:generate

# Poblar datos de ejemplo
npm run db:seed
```

### 2. Configurar Frontend

```powershell
cd client
npm install
```

## 🚀 Ejecución

### Desarrollo

**Terminal 1 - Backend:**
```powershell
npm run dev
# Server en http://localhost:3000
```

**Terminal 2 - Frontend:**
```powershell
npm run client:dev
# Frontend en http://localhost:5173
```

### Producción

```powershell
# Build backend
npm run build

# Build frontend
npm run client:build

# Run
npm start
```

## 📡 API Endpoints

### Subscriptions
- `GET /api/subscriptions` - Listar todas
- `POST /api/subscriptions` - Crear nueva
- `DELETE /api/subscriptions/:id` - Eliminar

**Body POST:**
```json
{
  "name": "Netflix",
  "price": 9990,
  "periodicity": "monthly",
  "startDate": "2026-01-15"
}
```

### Analytics
- `GET /api/analytics/year-data?year=2026` - Datos agregados por año
- `POST /api/analytics/set-override` - Modificar precio específico mes
- `GET /api/analytics/download-csv?year=2026` - Descargar CSV

**Response year-data:**
```json
{
  "year": 2026,
  "monthlyTotals": [50000, 52000, ...],
  "monthlyCounts": [6, 6, ...],
  "cumulative": [50000, 102000, ...],
  "perSubscription": [
    { "name": "Netflix", "total": 119880 }
  ],
  "perSubscriptionMonthly": [...]
}
```

## 🗄️ Schema de Base de Datos

```prisma
model Calendar {
  id            Int
  date          DateTime @unique
}

model Subscription {
  id             Int
  name           String
  price          Float
  periodicity    String  // weekly, monthly, quarterly, semiannual, annual
  startDate      DateTime
  startDateId    Int
  priceOverrides PriceOverride[]
}

model PriceOverride {
  id             Int
  subscriptionId Int
  year           Int
  month          Int
  price          Float
  
  @@unique([subscriptionId, year, month])
}
```

## 🔧 Utilidades

```powershell
# Ver base de datos con UI
npm run prisma:studio

# Resetear DB
npx prisma migrate reset

# Nueva migración
npx prisma migrate dev --name descripcion
```

## 🎯 Características

- ✅ CRUD completo de suscripciones
- ✅ Cálculo automático de recurrencias (semanal, mensual, trimestral, semestral, anual)
- ✅ Dashboard con estadísticas y gráficos
- ✅ Exportación a CSV
- ✅ Price overrides (modificar precio en mes específico)
- ✅ Persistencia en PostgreSQL
- ✅ TypeScript end-to-end
- ✅ API REST documentada

## 📁 Estructura

```
node-version/
├── prisma/
│   └── schema.prisma       # Schema DB
├── src/
│   ├── index.ts            # Entry point
│   ├── db.ts               # Prisma client
│   ├── seed.ts             # Seed data
│   └── routes/
│       ├── subscriptions.ts
│       └── analytics.ts
├── client/                 # Frontend React
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── index.css
│   └── package.json
├── package.json
└── tsconfig.json
```

## 🔄 Diferencias con versión Python

| Aspecto | Python (Flask) | Node.js (Express) |
|---------|---------------|------------------|
| DB | SQLite | PostgreSQL |
| ORM | SQL directo | Prisma |
| Frontend | Jinja2 templates | React SPA |
| Tipado | Opcional | TypeScript |
| Deploy | gunicorn | Node/PM2 |

## 📝 Notas

- El frontend usa proxy a `/api` para desarrollo (ver [vite.config.ts](client/vite.config.ts))
- Los datos de calendario se generan automáticamente para 2025-2028
- Formato de precios: pesos chilenos sin decimales en UI
- CSV usa `;` como delimitador y `,` para decimales (formato Excel español)
