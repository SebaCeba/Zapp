# Zapps - Sistema de Gestión Financiera Personal

Sistema completo de planificación y gestión financiera que incluye:

> **Nota:** El 5 de enero de 2026 se eliminaron 8 módulos (Tenpo, TC Billing, Analytics, Bonos, Presupuesto Resumen) como parte de una simplificación del sistema.

## 🌟 Características

- 📅 **Suscripciones**: Gestión de suscripciones periódicas con calendario
- 🏠 **Hipotecario**: Cálculo y seguimiento de dividendos hipotecarios
- 💰 **Ingresos**: Gestión de ingresos
- 🔧 **Servicios Básicos**: Seguimiento de servicios (agua, luz, gas, internet, etc.)
- 🛒 **Supermercado**: Control de gastos de supermercado
- 📊 **Módulo Actual**: Presupuesto mensual actualizable con estado de pagos
- 💳 **Créditos**: Gestión de tarjetas de crédito y cuotas
- 📧 **Integración Gmail**: Autenticación OAuth2 para procesamiento de facturas por email

## 🚀 Inicio Rápido

### Versión Node.js (Principal)

```powershell
# Iniciar backend y frontend
.\start.ps1

# O manualmente:
cd node-version
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (en otra terminal)
cd node-version/client
npm install
npm run dev
```

### Versión Python (Legacy)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

## 📁 Estructura del Proyecto

```
├── node-version/           # Versión principal (Node.js + TypeScript)
│   ├── src/               # Backend Express + Prisma
│   │   ├── routes/        # Endpoints API
│   │   └── services/      # Lógica de negocio
│   ├── client/            # Frontend React + TypeScript
│   │   └── src/           # Componentes y páginas
│   └── prisma/            # Schema y migraciones
├── src/                   # Versión Python (legacy)
│   └── planificador/      # Módulos Python
├── docs/                  # Documentación técnica
├── scripts/               # Scripts de utilidad
└── templates/             # Templates HTML (Python)
```

## 📚 Documentación

Consulta la carpeta [docs/](docs/) para documentación detallada:
- [Índice de Documentación](docs/README.md)
- [Arquitectura del Sistema](docs/ARQUITECTURA.md)
- [Guía de Desarrollo](docs/DESARROLLO.md)
- [Credenciales Google](docs/CREDENCIALES_GOOGLE.md)

## 🛠️ Tecnologías

- **Backend**: Node.js, Express, Prisma, TypeScript
- **Frontend**: React, TypeScript, Vite
- **Base de Datos**: SQLite (dev), PostgreSQL (prod ready)
- **APIs**: Google Gmail API, OAuth2
