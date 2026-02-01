# Configuración de Desarrollo

Este archivo contiene comandos útiles y configuraciones para el desarrollo del proyecto.

## Variables de Entorno

### Backend (node-version/.env)
```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development
```

### Frontend (node-version/client/.env)
```env
VITE_API_URL=http://localhost:3000
```

## Comandos Útiles

### Inicio Rápido
```powershell
# Iniciar todo (backend + frontend)
.\start.ps1

# O manualmente:
# Terminal 1 - Backend
cd node-version
npm run dev

# Terminal 2 - Frontend
cd node-version/client
npm run dev
```

### Base de Datos (Prisma)
```powershell
cd node-version

# Generar cliente Prisma
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Ver base de datos en navegador
npx prisma studio

# Resetear base de datos (¡CUIDADO!)
npx prisma migrate reset

# Ejecutar seed
npm run db:seed
```

### TypeScript
```powershell
cd node-version

# Compilar
npm run build

# Verificar tipos
npx tsc --noEmit

# Ejecutar en producción
npm start
```

### Limpieza
```powershell
# Limpiar node_modules y reinstalar
cd node-version
Remove-Item -Recurse -Force node_modules
npm install

# Limpiar cache de Prisma
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate

# Limpiar archivos temporales Python
Get-ChildItem -Recurse -Include "__pycache__","*.pyc" | Remove-Item -Recurse -Force
```

## Debugging

### Backend
1. En VS Code, agregar breakpoint en el código
2. Ejecutar: `tsx watch src/index.ts`
3. O usar configuración de debug de VS Code

### Frontend
1. Abrir DevTools del navegador
2. Usar React DevTools para inspeccionar componentes
3. Ver console.log() en la consola del navegador

## Testing

### Verificar errores de parsing (Tenpo)
```powershell
cd node-version
node scripts/check-parse-errors.js
```

### Analizar compras con interés
```powershell
cd node-version
node scripts/analizar-compras-interes.js
```

### Verificar estado de integración Tenpo
```powershell
cd node-version
node scripts/check-tenpo-status.js
```

## Puertos

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Prisma Studio**: http://localhost:5555

## Estructura de URLs API

- `GET /api/subscriptions` - Lista de suscripciones
- `GET /api/actual/entries` - Entradas del módulo Actual
- `GET /api/tenpo/emails` - Emails de Tenpo
- `POST /api/google/auth` - Autenticación Google
- Ver `node-version/src/routes/` para más endpoints
