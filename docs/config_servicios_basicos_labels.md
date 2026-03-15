# Configuración de Servicios Básicos - Asociar Labels de Gmail

**Fecha:** 2026-02-27  
**Estado:** ✅ Implementado  
**Versión:** 1.0

---

## 1. RESUMEN

Panel de configuración para asociar labels de Gmail a cada servicio básico (Luz, Agua, Gas, Internet, etc.), permitiendo la importación automática de facturas desde email.

**Características:**
- ✅ Conexión OAuth2 con Google (single-user)
- ✅ Listar labels reales de Gmail (solo user labels)
- ✅ Configuración dinámica por provider (Tabs)
- ✅ Validación de labels contra Gmail API
- ✅ Toggle para habilitar/deshabilitar email connector
- ✅ Persistencia en base de datos (SQLite)

---

## 2. RUTA DE LA UI

**URL:** `/config/servicios-basicos`

**Ubicación en menú:**
```
Sidebar → Configuración → Servicios Básicos
```

**Acceso directo:**
```
http://localhost:5173/config/servicios-basicos
```

---

## 3. FLUJO DE USUARIO

### 3.1 Primera Vez (Sin Google Conectado)

```
┌────────────────────────────────────┐
│ Usuario accede a                   │
│ /config/servicios-basicos         │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Panel muestra:                     │
│ ❌ Google No Conectado             │
│ [Botón: Conectar Google]           │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Usuario hace clic en               │
│ "Conectar Google"                  │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Abre popup OAuth2                  │
│ (reutiliza flujo existente)        │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Usuario autoriza en Google         │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Popup cierra, recarga página       │
│ Labels de Gmail se cargan          │
└────────────────────────────────────┘
```

### 3.2 Configurando un Provider

```
┌────────────────────────────────────┐
│ Usuario selecciona Tab (ej: "Luz") │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ 1. Activa Toggle                   │
│    "Habilitar Email Connector"     │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ 2. Selector de Label se habilita   │
│    Muestra labels de Gmail         │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ 3. Selecciona label                │
│    (ej: "Facturación ENEL")        │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ 4. Clic en "Guardar Configuración" │
└──────────────┬─────────────────────┘
               ▼
┌────────────────────────────────────┐
│ Backend valida label contra Gmail  │
│ - Si existe: ✅ Guarda config      │
│ - Si no existe: ❌ Error 400       │
└────────────────────────────────────┘
```

### 3.3 Estados del Toggle y Label

**Caso 1: Toggle OFF**
- Selector de label: **deshabilitado**
- Al guardar: `hasEmailConnector = false`, `gmailLabel = null`
- No se importará nada

**Caso 2: Toggle ON + Label vacío**
- Selector de label: **habilitado** pero sin valor
- Al guardar: ⚠️ Warning "Habilitado sin label: no importará nada hasta que selecciones uno"
- Permite guardar: `hasEmailConnector = true`, `gmailLabel = null`

**Caso 3: Toggle ON + Label seleccionado**
- Selector de label: **habilitado** con valor
- Backend valida que el label exista en Gmail
- Si existe: ✅ Guarda configuración
- Si no existe: ❌ Error 400 "Label no existe en Gmail"

**Caso 4: Toggle ON → OFF**
- Al desactivar toggle, el label se limpia automáticamente (frontend)
- Al guardar: `gmailLabel = null`

---

## 4. ENDPOINTS USADOS

### 4.1 Frontend → Backend

#### **GET /api/utilities/providers**
Lista todos los providers de servicios básicos.

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Luz",
    "hasEmailConnector": false,
    "gmailLabel": null
  },
  {
    "id": 2,
    "nombre": "Agua",
    "hasEmailConnector": true,
    "gmailLabel": "Facturación Aguas Andinas"
  }
]
```

#### **GET /api/integrations/google/status**
Verifica estado de autenticación OAuth2.

**Respuesta:**
```json
{
  "authenticated": true,
  "tokenExpired": false,
  "expiryDate": "2026-03-27T15:30:00.000Z"
}
```

#### **GET /api/integrations/google/auth-url**
Obtiene URL para iniciar flujo OAuth2.

**Respuesta:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
}
```

#### **GET /api/gmail/labels**
Lista labels reales de Gmail (solo user labels, ordenados alfabéticamente).

**Respuesta:**
```json
[
  {
    "id": "Label_123456",
    "name": "Facturación ENEL",
    "type": "user"
  },
  {
    "id": "Label_789012",
    "name": "Tenpo/Compras TC Tenpo",
    "type": "user"
  }
]
```

#### **PATCH /api/utilities/providers/:provider/config** ← NUEVO
Actualiza configuración de email connector para un provider.

**Body:**
```json
{
  "hasEmailConnector": true,
  "gmailLabel": "Facturación ENEL"
}
```

**Respuesta exitosa (200):**
```json
{
  "id": 1,
  "nombre": "Luz",
  "esBase": true,
  "orden": 0,
  "hasEmailConnector": true,
  "gmailLabel": "Facturación ENEL"
}
```

**Errores:**

| Código | Escenario | Respuesta |
|--------|-----------|-----------|
| 400 | Label no existe en Gmail | `{ "error": "El label \"Fake Label\" no existe en Gmail. Por favor verifica el nombre exacto." }` |
| 401 | No autenticado con Google | `{ "error": "No autenticado con Google. Conecta Google primero para validar labels." }` |
| 404 | Provider no encontrado | `{ "error": "Provider no encontrado" }` |
| 500 | Error interno | `{ "error": "Error message" }` |

---

## 5. VALIDACIÓN LABEL CONTRA GMAIL

### 5.1 Flujo de Validación (Backend)

```typescript
// node-version/src/routes/utilities.ts

if (hasEmailConnector && gmailLabel) {
  // 1. Validar que el label existe en Gmail
  const labelId = await gmailService.getLabelIdByName(gmailLabel);
  
  if (!labelId) {
    return res.status(400).json({ 
      error: `El label "${gmailLabel}" no existe en Gmail. Por favor verifica el nombre exacto.`
    });
  }
  
  // 2. Si existe, guardar
  finalGmailLabel = gmailLabel;
}
```

### 5.2 Método `getLabelIdByName()`

**Ubicación:** `node-version/src/services/gmail.service.ts` (líneas 112-127)

**Comportamiento:**
- Llama Gmail API: `gmail.users.labels.list({ userId: 'me' })`
- Busca label por nombre exacto (case-sensitive)
- Si encuentra match: retorna `label.id`
- Si no encuentra: retorna `null`

**Ejemplo:**
```typescript
await gmailService.getLabelIdByName('Facturación ENEL');
// ✅ Retorna: "Label_123456" (si existe)
// ❌ Retorna: null (si no existe)
```

### 5.3 Sensibilidad de Nombres

⚠️ **El nombre del label es case-sensitive y debe coincidir exactamente:**

| Label en Gmail | Input Usuario | ¿Válido? |
|----------------|---------------|----------|
| `Facturación ENEL` | `Facturación ENEL` | ✅ Sí |
| `Facturación ENEL` | `facturación enel` | ❌ No |
| `Facturación ENEL` | `Facturación ENEL ` | ❌ No (espacio extra) |
| `Tenpo/Compras TC Tenpo` | `Tenpo/Compras TC Tenpo` | ✅ Sí |

**Solución en UI:**
- SelectPicker con búsqueda permite buscar sin case-sensitive
- Al seleccionar, se guarda el nombre exacto del label
- Frontend muestra labels tal cual vienen de Gmail API

---

## 6. REGLAS DE UI

### 6.1 Estados del Componente

| Estado | Toggle | Selector Label | Botón Guardar |
|--------|--------|---------------|---------------|
| **Inicial (sin cambios)** | Según DB | Habilitado si toggle ON | **Deshabilitado** |
| **Toggle OFF** | OFF | **Deshabilitado** | Habilitado si hay cambios |
| **Toggle ON + Sin Label** | ON | Habilitado | Habilitado si hay cambios |
| **Toggle ON + Con Label** | ON | Habilitado | Habilitado si hay cambios |
| **Guardando** | - | - | **Loading** |

### 6.2 Validaciones Frontend

**Antes de enviar request:**
```typescript
if (config.hasEmailConnector && !config.gmailLabel) {
  showToast('Advertencia: Email connector habilitado sin label...', 'warning');
  // Pero PERMITE guardar (no bloquea)
}
```

**Detección de cambios:**
```typescript
const hasChanges = (provider: string): boolean => {
  const config = configs[provider];
  const original = providers.find(p => p.nombre === provider);
  
  return config.hasEmailConnector !== original.hasEmailConnector ||
         config.gmailLabel !== original.gmailLabel;
};
```

### 6.3 Mensajes al Usuario

**Caso 1: Google no conectado**
```
⚠️ Conecta Google primero para poder seleccionar labels de Gmail y validar la configuración.
```

**Caso 2: Toggle OFF**
```
(Placeholder del selector): "Habilita el Email Connector primero para seleccionar un label"
```

**Caso 3: Toggle ON pero sin label**
```
ℹ️ Sin label configurado: El conector no importará nada hasta que selecciones un label de Gmail.
```

**Caso 4: Label no existe (error backend)**
```
❌ El label "Fake Label" no existe en Gmail. Por favor verifica el nombre exacto.
```

**Caso 5: Guardado exitoso**
```
✅ Configuración guardada para Luz
```

### 6.4 Layout y UX

**Estructura:**
```
┌─────────────────────────────────────────────┐
│ Panel: Estado de Google OAuth              │
│ [Conectar Google] o "✅ Google Conectado"  │
└─────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ Tabs: Luz | Agua | Gas | Internet | ...    │
│                                             │
│  Tab Content (ej: "Luz"):                  │
│  ┌──────────────────────────────────────┐  │
│  │ Toggle: Habilitar Email Connector    │  │
│  │                                      │  │
│  │ SelectPicker: Gmail Label            │  │
│  │ (searchable, cleanable)              │  │
│  │                                      │  │
│  │ [Guardar Configuración]              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────┐
│ Footer: Tips de uso                        │
└─────────────────────────────────────────────┘
```

**Sin scroll doble:**
- MainLayout maneja el scroll principal
- Panel con Tabs no genera overflow interno
- Contenido de cada Tab tiene padding apropiado

---

## 7. ARCHIVOS MODIFICADOS/CREADOS

### 7.1 Backend

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `node-version/src/routes/utilities.ts` | ✏️ **Modificado** | Agregado endpoint `PATCH /api/utilities/providers/:provider/config` |

**Cambios específicos:**
- Líneas ~83-152: Nuevo endpoint con validación de label contra Gmail API
- Usa `gmailService.getLabelIdByName()` para validar
- Reglas: toggle OFF → label null, toggle ON + label → validar contra Gmail

### 7.2 Frontend

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `node-version/client/src/pages/ConfigServiciosBasicos.tsx` | ✅ **Nuevo** | Página de configuración con Tabs dinámicos |
| `node-version/client/src/router.tsx` | ✏️ **Modificado** | Agregada ruta `/config/servicios-basicos` |
| `node-version/client/src/navigation/menuConfig.ts` | ✏️ **Modificado** | Agregada sección "Configuración" con link |

**Detalle de cambios:**

**router.tsx:**
```typescript
// Import agregado
import ConfigServiciosBasicos from './pages/ConfigServiciosBasicos';

// Ruta agregada
<Route path="/config/servicios-basicos" element={<ConfigServiciosBasicos />} />
```

**menuConfig.ts:**
```typescript
{
  key: 'configuracion',
  label: 'Configuración',
  children: [
    { key: '/config/servicios-basicos', label: 'Servicios Básicos' }, // ← NUEVO
    { key: '/presupuesto/tenpo/config', label: 'Tenpo TC' },
    { key: '/tenpo/categorias', label: 'Categorías Tenpo' },
    { key: '/tenpo/asignacion', label: 'Asignación Comercios' },
  ],
}
```

### 7.3 Documentación

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `docs/config_servicios_basicos_labels.md` | ✅ **Nuevo** | Este documento |

---

## 8. ESTRUCTURA DE DATOS

### 8.1 Schema Prisma (Existente)

```prisma
model ServicioBasico {
  id                Int                              @id @default(autoincrement())
  nombre            String                           @unique
  activo            Boolean                          @default(true)
  esBase            Boolean                          @default(false) @map("es_base")
  orden             Int                              @default(0)
  gmailLabel        String?                          @map("gmail_label")        // ← Campo usado
  hasEmailConnector Boolean                          @default(false)           // ← Campo usado
  createdAt         DateTime                         @default(now())
  updatedAt         DateTime                         @updatedAt
  presupuestos      PresupuestoServicioBasico[]
  transactions      UtilityTransaction[]
}
```

### 8.2 Estado Frontend (ConfigServiciosBasicos.tsx)

```typescript
// Estado por provider
configs: {
  [providerName: string]: {
    hasEmailConnector: boolean;
    gmailLabel: string | null;
    saving: boolean;
  }
}

// Ejemplo:
{
  "Luz": {
    hasEmailConnector: true,
    gmailLabel: "Facturación ENEL",
    saving: false
  },
  "Agua": {
    hasEmailConnector: false,
    gmailLabel: null,
    saving: false
  }
}
```

---

## 9. CÓMO PROBAR

### 9.1 Requisitos Previos

1. ✅ Backend corriendo: `cd node-version && npm run dev`
2. ✅ Frontend corriendo: `cd node-version/client && npm run dev`
3. ✅ OAuth configurado (`.env` con `GOOGLE_CLIENT_ID`, etc.)
4. ✅ Al menos un provider en DB (tabla `servicios_basicos`)

### 9.2 Test Manual - Flujo Completo

#### **Paso 1: Acceder a la página**
```
http://localhost:5173/config/servicios-basicos
```

**Resultado esperado:**
- Panel muestra "❌ Google No Conectado"
- Botón "Conectar Google" visible
- Tabs con nombres de providers (Luz, Agua, Gas, etc.)

#### **Paso 2: Conectar Google**
1. Clic en "Conectar Google"
2. Popup OAuth2 se abre
3. Autorizar acceso
4. Popup se cierra

**Resultado esperado:**
- Panel muestra "✅ Google Conectado"
- SelectPickers se habilitan con labels reales

#### **Paso 3: Configurar un provider (ej: "Luz")**
1. Seleccionar Tab "Luz"
2. Activar Toggle "Habilitar Email Connector"
3. Selector de label se habilita
4. Seleccionar label (ej: "Facturación ENEL")
5. Clic en "Guardar Configuración"

**Resultado esperado:**
- Toast: "✅ Configuración guardada para Luz"
- Botón "Guardar" se deshabilita (no hay cambios)

#### **Paso 4: Verificar en Backend**
```bash
sqlite3 node-version/prisma/dev.db "SELECT nombre, has_email_connector, gmail_label FROM servicios_basicos WHERE nombre = 'Luz';"
```

**Resultado esperado:**
```
Luz|1|Facturación ENEL
```

#### **Paso 5: Probar validación (label inválido)**
1. En frontend, escribir manualmente un label que no existe (truco: borrar y escribir)
   - **Nota:** Como usamos SelectPicker, solo permite seleccionar de la lista
   - Para testear validación backend, usar curl:

```bash
curl -X PATCH http://localhost:3000/api/utilities/providers/Luz/config \
  -H "Content-Type: application/json" \
  -d '{"hasEmailConnector": true, "gmailLabel": "Label Falso"}'
```

**Resultado esperado:**
```json
{
  "error": "El label \"Label Falso\" no existe en Gmail. Por favor verifica el nombre exacto."
}
```

#### **Paso 6: Probar toggle OFF**
1. Desactivar Toggle "Habilitar Email Connector"
2. Selector de label se deshabilita automáticamente
3. Clic en "Guardar Configuración"

**Resultado esperado:**
- Toast: "✅ Configuración guardada para Luz"
- En DB: `has_email_connector = 0`, `gmail_label = NULL`

### 9.3 Test de Regresión

**Verificar que no se rompió nada:**

1. ✅ `/api/utilities/providers` sigue funcionando
2. ✅ `/api/utilities/:provider/import-email` sigue funcionando
3. ✅ `/actual/utilities` (vista Actual) sigue funcionando
4. ✅ OAuth en `/actual/tenpo` sigue funcionando

---

## 10. INTEGRACIÓN CON IMPORTACIÓN DE FACTURAS

### 10.1 Flujo Completo: Config → Importación

```
┌─────────────────────────────────────────┐
│ 1. Usuario configura en                 │
│    /config/servicios-basicos            │
│    - Toggle ON para "Luz"               │
│    - Label: "Facturación ENEL"          │
│    - Guarda configuración               │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 2. Usuario va a                         │
│    /actual/utilities                    │
│    - Ve provider "Luz"                  │
│    - Clic en "Importar desde Gmail"     │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 3. Frontend llama:                      │
│    POST /api/utilities/Luz/import-email │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────────────────┐
│ 4. Backend:                             │
│    - Lee config de "Luz" desde DB       │
│    - Obtiene gmailLabel="Facturación     │
│      ENEL"                              │
│    - Llama gmailService.getEmailsByLabel│
│    - Parsea emails                      │
│    - Guarda transacciones               │
└─────────────────────────────────────────┘
```

### 10.2 Código en utilities.ts (Importación)

```typescript
// Línea ~105-109
if (!servicioBasico.gmailLabel) {
  return res.status(400).json({ 
    error: 'Este provider no tiene Gmail label configurado' 
  });
}

const gmailLabel = servicioBasico.gmailLabel;
const messages = await gmailService.getEmailsByLabel(gmailLabel, 50);
```

**Prerequisito:** `hasEmailConnector = true` y `gmailLabel != null`

---

## 11. MEJORAS FUTURAS SUGERIDAS

### 11.1 ALTA PRIORIDAD

- [ ] **Caché de labels:** Cachear lista de labels por X minutos (evitar requests repetidos)
- [ ] **Test automático:** Agregar test unitario para endpoint PATCH
- [ ] **Dry run:** Botón "Probar Label" que muestra cuántos emails se encontrarían sin importar

### 11.2 MEDIA PRIORIDAD

- [ ] **Multi-label:** Permitir asociar múltiples labels a un provider (OR logic)
- [ ] **Preview de emails:** Mostrar últimos 3 emails del label seleccionado
- [ ] **Historial de cambios:** Auditoría de cambios en configuración

### 11.3 BAJA PRIORIDAD

- [ ] **Auto-detección:** Sugerir labels basado en nombre del provider (ML/heuristics)
- [ ] **Bulk config:** Configurar múltiples providers a la vez
- [ ] **Export/Import config:** Exportar configuración como JSON

---

## 12. TROUBLESHOOTING

### 12.1 "Labels no cargan"

**Problema:** Selector muestra "No results"

**Causas posibles:**
1. No autenticado con Google → Solución: Clic en "Conectar Google"
2. No existen labels de usuario en Gmail → Normal si no hay labels personalizados
3. Error en Gmail API → Ver logs del backend

**Debug:**
```bash
# Ver logs del backend
# Debería mostrar: "📬 Buscando mensajes con labelId: ..."
```

### 12.2 "Error al guardar: Label no existe"

**Problema:** Backend rechaza label con 400

**Causas:**
1. Nombre del label con typo (case-sensitive)
2. Label fue eliminado de Gmail entre carga y guardado
3. Token de Gmail expiró/revocado

**Solución:**
1. Clic en "Recargar Labels"
2. Verificar que el label existe en Gmail web
3. Si persiste, desconectar y reconectar Google

### 12.3 "Toggle no se puede activar"

**Problema:** Toggle vuelve a OFF al hacer clic

**Causa:** Probablemente problema de estado (no debería pasar con React)

**Debug:**
```javascript
// En DevTools Console
console.log(configs);
// Verificar que el estado se actualiza
```

---

## 13. REFERENCIAS

- **OAuth Audit:** `docs/auditoria_oauth_gmail.md`
- **Hardening OAuth:** `docs/hardening_oauth_refresh.md`
- **API Gmail Labels:** `docs/api_gmail_labels.md`
- **Utilities Parser:** `node-version/src/services/utilities-parser.service.ts`
- **Gmail Service:** `node-version/src/services/gmail.service.ts`

---

**Implementado por:** GitHub Copilot  
**Fecha:** 2026-02-27  
**Versión:** 1.0
