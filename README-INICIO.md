# Zapps - Planificador de Suscripciones y Presupuesto

## 🚀 Inicio Rápido

### Para iniciar la aplicación Node/React (versión actual):

**Opción 1 - Doble clic:**
- Simplemente haz doble clic en `start.bat`

**Opción 2 - PowerShell:**
```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

Este script iniciará automáticamente:
- **Backend** (API Node.js con Express + Prisma) en http://localhost:3000
- **Frontend** (React + Vite + TypeScript) en http://localhost:5173

### Inicio Manual

Si prefieres iniciar los servicios manualmente:

#### Backend (API):
```powershell
cd node-version
npm run dev
```

#### Frontend (React):
```powershell
cd node-version/client
npm run dev
```

## 📁 Estructura del Proyecto

```
Zapps/
├── start.ps1                    # Script para iniciar la aplicación
├── node-version/                # Versión Node/React (ACTUAL)
│   ├── src/                     # Backend Node.js
│   │   ├── index.ts            # Servidor Express
│   │   ├── routes/             # Rutas de la API
│   │   └── db.ts               # Configuración Prisma
│   ├── client/                  # Frontend React
│   │   └── src/
│   │       ├── components/     # Componentes React
│   │       └── pages/          # Páginas
│   └── prisma/                  # Esquema y migraciones de BD
├── app.py                       # Versión Flask (legacy)
└── src/planificador/            # Versión Python (legacy)
```

## 🛠️ Tecnologías

### Versión Actual (Node/React)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite
- **Frontend**: React, Vite, TypeScript, React Router, Recharts

### Versión Legacy (Python/Flask)
- Flask, SQLite, Jinja2 Templates

## 📝 Comandos Útiles

### Base de Datos (Prisma)
```powershell
cd node-version
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio (GUI)
npm run db:seed           # Poblar BD con datos de prueba
```

### Build para Producción
```powershell
# Backend
cd node-version
npm run build
npm start

# Frontend
cd node-version/client
npm run build
```
