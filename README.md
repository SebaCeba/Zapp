# Zapps - Sistema de Gestión Financiera Personal

Sistema completo de planificación y gestión financiera personal con modelo dimensional y arquitectura moderna.

> **Nota Arquitectónica:** Se migró a un modelo dimensional (star schema) con v2 API. Los módulos Tenpo TC, Bonos y TC Billing fueron eliminados como parte de la simplificación arquitectónica (Enero-Abril 2026).

## 🌟 Características

- 📅 **Suscripciones**: Gestión de suscripciones periódicas con calendario
- 🏠 **Hipotecario**: Cálculo y seguimiento de dividendos hipotecarios
- 💰 **Ingresos**: Gestión de ingresos con modelo dimensional
- 🔧 **Servicios Básicos**: Seguimiento de servicios (agua, luz, gas, internet, etc.)
- 🛒 **Supermercado**: Control de gastos de supermercado
- 📊 **Módulo Actual**: Presupuesto mensual actualizable con estado de pagos
- 💳 **Créditos**: Gestión de tarjetas de crédito y cuotas
- 📧 **Integración Gmail**: Autenticación OAuth2 para procesamiento de facturas
- 🎨 **Financial Atelier Design System**: Interfaz moderna con Tailwind CSS

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
- [DATABASE_MODEL.md](docs/DATABASE_MODEL.md) - Modelo dimensional (star schema)
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios consolidado

### Integraciones
- [Gmail OAuth](docs/auditorias/auditoria_oauth_gmail.md) - Autenticación Gmail API
- [Servicios Básicos](docs/servicios-basicos_architectura.md) - Arquitectura de servicios

### Componentes y Migraciones
- [UI/Tailwind](docs/MIGRACION_RSUITE_TAILWIND.md) - Migración RSuite → Tailwind
- [Auditorías](docs/auditorias/) - Auditorías técnicas y de arquitectura
- [Changelogs](docs/changelogs/) - Logs de cambios detallados

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Prisma, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Base de Datos**: SQLite (dev), PostgreSQL (prod ready)
- **APIs**: Google Gmail API, OAuth2
