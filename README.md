# Zapps - Sistema de Gestión Financiera Personal

Sistema completo de planificación y gestión financiera que incluye:

## 🌟 Características

- 📅 **Suscripciones**: Gestión de suscripciones periódicas con calendario
- 💳 **Integración Tenpo**: Procesamiento automático de emails de compras y pagos
- 🏠 **Hipotecario**: Cálculo y seguimiento de dividendos hipotecarios
- 💰 **Ingresos**: Gestión de ingresos, bonos y repartos
- 🔧 **Servicios Básicos**: Seguimiento de servicios (agua, luz, gas, internet, etc.)
- 🛒 **Supermercado**: Control de gastos de supermercado
- 📊 **Módulo Actual**: Presupuesto mensual actualizable con estado de pagos
- 📧 **Integración Gmail**: Autenticación OAuth2 para procesamiento de emails

## 🚀 Inicio Rápido

### Inicio Automático

**Opción 1 - Script PowerShell:**
```powershell
.\start.ps1
```

**Opción 2 - Batch file:**
```cmd
start.bat
```

Esto iniciará automáticamente:
- **Backend** (API Node.js) en `http://localhost:3000`
- **Frontend** (React + Vite) en `http://localhost:5173`

### Inicio Manual

Si prefieres controlar los servicios individualmente:

```powershell
# Backend
cd node-version
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (nueva terminal)
cd node-version/client
npm install
npm run dev
```

## 📁 Estructura del Proyecto

```
Zapps/
├── node-version/           # Stack principal (Node.js + TypeScript + React)
│   ├── src/               # Backend Express + Prisma
│   │   ├── routes/        # Endpoints API REST
│   │   ├── services/      # Lógica de negocio
│   │   └── security/      # OAuth, tokens, seguridad
│   ├── client/            # Frontend React + TypeScript + Vite
│   │   └── src/
│   │       ├── components/ # Componentes React reutilizables
│   │       ├── pages/     # Páginas principales
│   │       └── api/       # Cliente API (fetch)
│   └── prisma/            # Schema DB y migraciones
├── docs/                  # Documentación técnica y arquitectura
├── start.ps1              # Script de inicio automático
└── CHANGELOG.md           # Historial de cambios
```

## 📚 Documentación

Consulta la carpeta [docs/](docs/) para documentación detallada:

### Arquitectura y Desarrollo
- [ARQUITECTURA.md](docs/ARQUITECTURA.md) - Visión general del sistema
- [DESARROLLO.md](docs/DESARROLLO.md) - Guías de desarrollo
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios consolidado

### Integraciones
- [Tenpo](docs/tenpo/) - Documentación completa de integración Tenpo
- [Gmail OAuth](docs/auditoria_oauth_gmail.md) - Autenticación Gmail API
- [Servicios Básicos](docs/servicios-basicos_architectura.md) - Arquitectura de servicios

### Componentes Específicos
- [TC Billing](docs/tc-billing/) - Sistema de facturación tarjeta de crédito
- [UI/RSuite](docs/ui/) - Migraciones de componentes UI
- [Product](docs/product/) - Definición de producto y roadmap

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Prisma, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Base de Datos**: SQLite (dev), PostgreSQL (prod ready)
- **APIs**: Google Gmail API, OAuth2
