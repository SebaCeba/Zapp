# Auditoría OAuth y Gmail API - Repositorio Zapps

**Fecha:** 2026-02-27  
**Estado:** ✅ OAuth2 y Gmail API Ya Implementados

---

## 1. RESUMEN EJECUTIVO

El repositorio **YA TIENE** implementado OAuth2 y acceso a Gmail API de manera funcional. La implementación actual es **single-user** (cuenta única del propietario) con almacenamiento de tokens en base de datos SQLite y refresco automático de access tokens.

**Scope actual:** `gmail.readonly` ✅  
**Librería:** `googleapis` (Google APIs Node.js Client)  
**Almacenamiento:** SQLite (tabla `google_auth_tokens`)  
**Refresh token:** ✅ Implementado con auto-refresh

---

## 2. IMPLEMENTACIÓN OAUTH - BACKEND

### 2.1 Archivos y Rutas Relevantes

#### **Servicio Principal**
- **Archivo:** `node-version/src/services/gmail.service.ts`
- **Clase:** `GmailService`
- **Responsabilidades:**
  - Generar URL de autorización OAuth2
  - Manejar callback y almacenar tokens
  - Proveer cliente autenticado de Gmail API
  - Auto-refresh de access token cuando expira
  - Obtener emails por label
  - Parsear contenido de emails

#### **Rutas de Autenticación**
- **Archivo:** `node-version/src/routes/google-integration.ts`
- **Endpoints:**

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/integrations/google/status` | Verifica si hay token activo y si expiró |
| `GET` | `/api/integrations/google/auth-url` | Devuelve URL para iniciar flujo OAuth2 |
| `GET` | `/api/integrations/google/callback` | Callback OAuth2 (recibe code, guarda tokens) |
| `DELETE` | `/api/integrations/google/auth` | Elimina token de autenticación |

**Registrado en:** `node-version/src/index.ts` (línea 38)
```typescript
app.use('/api/integrations/google', googleIntegrationRoutes);
```

### 2.2 Configuración Ambiente (.env)

**Archivo:** `node-version/.env.example`

```env
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

**Ubicación en código:** `node-version/src/services/gmail.service.ts` (líneas 10-14)

```typescript
this.oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback'
);
```

### 2.3 Scopes Configurados

**Archivo:** `node-version/src/services/gmail.service.ts` (línea 4)

```typescript
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
```

**Scope Actual:**
- ✅ `gmail.readonly` - Lectura de emails y labels

**Nota:** Este scope es **suficiente** para:
- Leer mensajes
- Listar labels
- Buscar por labels/queries
- Obtener metadatos de emails

**No permite:**
- ❌ Modificar emails
- ❌ Enviar emails
- ❌ Eliminar emails
- ❌ Crear/modificar labels

### 2.4 Almacenamiento de Tokens

**Tabla:** `google_auth_tokens` (tabla única, single-user)

**Schema Prisma:** `node-version/prisma/schema.prisma` (líneas 225-235)

```prisma
model GoogleAuthToken {
  id           Int      @id @default(autoincrement())
  accessToken  String   @map("access_token")
  refreshToken String   @map("refresh_token")
  expiryDate   DateTime @map("expiry_date")
  scope        String
  tokenType    String   @default("Bearer") @map("token_type")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("google_auth_tokens")
}
```

**Características:**
- ✅ Solo un token activo a la vez (se borra el anterior al autenticar)
- ✅ Almacena `access_token` y `refresh_token`
- ✅ Guarda fecha de expiración (`expiryDate`)
- ✅ Registra scope otorgado

**Método de guardado:** `node-version/src/services/gmail.service.ts` (líneas 25-38)

```typescript
async handleCallback(code: string) {
  const { tokens } = await this.oauth2Client.getToken(code);
  
  // Guardar tokens en DB
  await prisma.googleAuthToken.deleteMany({}); // Solo un token activo
  await prisma.googleAuthToken.create({
    data: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: new Date(tokens.expiry_date!),
      scope: tokens.scope!,
      tokenType: tokens.token_type || 'Bearer'
    }
  });

  return tokens;
}
```

### 2.5 Auto-Refresh de Tokens

**Archivo:** `node-version/src/services/gmail.service.ts` (líneas 42-74)

```typescript
async getAuthenticatedClient() {
  const tokenRecord = await prisma.googleAuthToken.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!tokenRecord) {
    throw new Error('No hay tokens de autenticación. Debe autenticarse primero.');
  }

  this.oauth2Client.setCredentials({
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken,
    expiry_date: tokenRecord.expiryDate.getTime(),
    scope: tokenRecord.scope,
    token_type: tokenRecord.tokenType
  });

  // Verificar si el token expiró y refrescarlo
  if (new Date() >= tokenRecord.expiryDate) {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    await prisma.googleAuthToken.update({
      where: { id: tokenRecord.id },
      data: {
        accessToken: credentials.access_token!,
        expiryDate: new Date(credentials.expiry_date!),
      }
    });

    this.oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: this.oauth2Client });
}
```

**Características:**
- ✅ Verifica expiración automáticamente
- ✅ Refresca token si está expirado
- ✅ Actualiza base de datos con nuevo `access_token`
- ✅ Mantiene `refresh_token` intacto

---

## 3. IMPLEMENTACIÓN OAUTH - FRONTEND

### 3.1 Archivos Relevantes

**Páginas con Integración OAuth:**

1. **ActualTenpo.tsx** - `node-version/client/src/pages/ActualTenpo.tsx`
   - Líneas 102-110: Obtiene `authUrl` al montar componente
   - Línea 293: Abre ventana popup para autenticación

2. **Tenpo.tsx** - `node-version/client/src/pages/Tenpo.tsx`
   - Línea 140: Obtiene `authUrl` desde backend

### 3.2 Flujo de Autenticación Frontend

```typescript
// 1. Obtener URL de autenticación
useEffect(() => {
  fetch('/api/integrations/google/auth-url')
    .then(r => r.json())
    .then(d => {
      if (d.authUrl) setAuthUrl(d.authUrl);
    })
    .catch(console.error);
}, []);

// 2. Abrir popup cuando usuario hace clic
window.open(authUrl, '_blank', 'width=600,height=700');

// 3. Callback cierra popup y recarga ventana padre (node-version/src/routes/google-integration.ts líneas 50-84)
```

**Ventana de Callback:**
- Muestra mensaje de éxito/error
- Cierra automáticamente después de 2 segundos
- Recarga la ventana padre (`window.opener.location.reload()`)

---

## 4. USO ACTUAL DE GMAIL API EN EL REPO

### 4.1 Módulo Tenpo (Tarjeta de Crédito)

**Archivo:** `node-version/src/routes/tenpo.ts`

**Endpoints:**

| Método | Ruta | Descripción | Uso Gmail |
|--------|------|-------------|-----------|
| `GET` | `/api/tenpo/debug/labels` | Lista todas las etiquetas Gmail | ✅ `gmailService.getAuthenticatedClient()` |
| `POST` | `/api/tenpo/sync` | Sincroniza emails Tenpo | ✅ `gmailService.getEmailsByLabel()` |

**Labels utilizados:**
- `Tenpo/Compras TC Tenpo` - Emails de compras con cuotas
- `Tenpo/Pagos TC Tenpo` - Emails de pagos de tarjeta

**Flujo de Sincronización:**

1. Obtener emails por label (línea 178):
   ```typescript
   const comprasMessages = await gmailService.getEmailsByLabel(comprasLabel);
   ```

2. Verificar duplicados (línea 186):
   ```typescript
   const exists = await prisma.tenpoEmail.findUnique({
     where: { gmailMessageId }
   });
   ```

3. Parsear contenido (línea 195):
   ```typescript
   const rawBody = gmailService.extractBodyFromMessage(message);
   const emailDate = gmailService.getMessageDate(message);
   ```

4. Guardar en DB con `gmailMessageId` único

**Tabla asociada:** `tenpo_emails` (líneas 238-250 schema.prisma)

```prisma
model TenpoEmail {
  id             Int             @id @default(autoincrement())
  gmailMessageId String          @unique @map("gmail_message_id")
  labelType      String          @map("label_type") // COMPRAS or PAGOS
  rawBody        String          @map("raw_body")
  emailDate      DateTime        @map("email_date")
  parsedOk       Boolean         @default(false) @map("parsed_ok")
  parseError     String?         @map("parse_error")
  createdAt      DateTime        @default(now()) @map("created_at")
  purchases      TenpoPurchase[]
  payments       TenpoPayment[]
}
```

### 4.2 Módulo Servicios Básicos (Luz, Agua, Gas, Internet)

**Archivo:** `node-version/src/routes/utilities.ts`

**Endpoint:**

| Método | Ruta | Descripción | Uso Gmail |
|--------|------|-------------|-----------|
| `POST` | `/api/utilities/:provider/import-email` | Importa facturas desde Gmail | ✅ `gmailService.getEmailsByLabel()` |

**Configuración por Provider:**

Cada servicio básico puede tener:
- `gmailLabel` - Label de Gmail donde están las facturas (ej: "Facturación ENEL")
- `hasEmailConnector` - Flag para habilitar importación automática

**Schema:** `node-version/prisma/schema.prisma` (líneas 106-116)

```prisma
model ServicioBasico {
  id                Int                              @id @default(autoincrement())
  nombre            String                           @unique
  activo            Boolean                          @default(true)
  esBase            Boolean                          @default(false) @map("es_base")
  orden             Int                              @default(0)
  gmailLabel        String?                          @map("gmail_label") // Ej: "Facturación ENEL"
  hasEmailConnector Boolean                          @default(false) @map("has_email_connector")
  createdAt         DateTime                         @default(now()) @map("created_at")
  updatedAt         DateTime                         @updatedAt @map("updated_at")
  presupuestos      PresupuestoServicioBasico[]
  transactions      UtilityTransaction[]
}
```

**Flujo de Importación:**

1. Verificar autenticación (línea 110):
   ```typescript
   const authStatus = await gmailService.getAuthStatus();
   if (!authStatus.authenticated) {
     return res.status(401).json({ error: 'No autenticado' });
   }
   ```

2. Obtener emails (línea 121):
   ```typescript
   const messages = await gmailService.getEmailsByLabel(gmailLabel, 50);
   ```

3. Parsear emails (línea 135-138):
   ```typescript
   const transactions = await utilitiesParserService.parseEmails(
     messages,
     provider,
     (msg) => gmailService.extractBodyFromMessage(msg),
     (msg) => gmailService.getMessageDate(msg)
   );
   ```

4. Filtrar duplicados (línea 151-158):
   ```typescript
   const existing = await prisma.utilityTransaction.findMany({
     where: {
       providerKey: provider,
       source: 'gmail'
     }
   });
   ```

5. Guardar transacciones nuevas (línea 193-202):
   ```typescript
   const created = await prisma.utilityTransaction.createMany({
     data: newTransactions.map(t => ({
       providerKey: provider,
       transactionDate: t.transactionDate,
       amount: t.amount,
       description: t.description || '',
       source: 'gmail',
       metadata: JSON.stringify(t.metadata || {})
     }))
   });
   ```

**Tabla asociada:** `utility_transactions` (líneas 439-452 schema.prisma)

```prisma
model UtilityTransaction {
  id                Int             @id @default(autoincrement())
  providerKey       String          @map("provider_key") // "Luz", "Agua", etc.
  provider          ServicioBasico  @relation(fields: [providerKey], references: [nombre])
  transactionDate   DateTime        @map("transaction_date")
  amount            Float           // Monto en CLP
  description       String?
  source            String          @default("manual") // manual | gmail | csv
  metadata          String?         // JSON string para extensibilidad
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")
}
```

### 4.3 Parser Service

**Archivo:** `node-version/src/services/utilities-parser.service.ts`

**Método principal:**
```typescript
parseUtilityEmail(body: string, emailDate: Date, providerKey: string): ParsedUtility | null
```

**Patrones de extracción:**
- **Monto:** Regex para `$52.153`, `Total: $52.153`, `Monto a pagar: $52.153`
- **Fecha:** Prioriza "Fecha de vencimiento" sobre "Fecha de emisión"
- **Validaciones:** Monto entre $1.000 y $10.000.000, fecha dentro de ±2 años

**Metadata almacenada:**
```typescript
{
  transactionDate: Date,
  amount: number,
  description: string,
  metadata: {
    gmailMessageId: string,
    gmailLabel: string,
    rawBody?: string // Solo en debug
  }
}
```

---

## 5. CÓMO OBTENER UN CLIENTE AUTENTICADO DE GMAIL

### 5.1 Desde Cualquier Servicio o Ruta

```typescript
import { gmailService } from '../services/gmail.service';

// Opción 1: Obtener cliente Gmail autenticado
const gmail = await gmailService.getAuthenticatedClient();
const response = await gmail.users.messages.list({ userId: 'me', maxResults: 10 });

// Opción 2: Usar métodos helper de gmailService
const messages = await gmailService.getEmailsByLabel('MiLabel', 50);
const bodyText = gmailService.extractBodyFromMessage(message);
const emailDate = gmailService.getMessageDate(message);
```

### 5.2 Verificar Estado de Autenticación

```typescript
const { authenticated, tokenExpired, expiryDate } = await gmailService.getAuthStatus();

if (!authenticated) {
  // Redirigir a flujo OAuth
  const authUrl = gmailService.getAuthUrl();
  // ...
}
```

### 5.3 Métodos Disponibles en GmailService

| Método | Descripción | Retorno |
|--------|-------------|---------|
| `getAuthUrl()` | Genera URL OAuth2 | `string` |
| `handleCallback(code)` | Maneja callback y guarda tokens | `Promise<tokens>` |
| `getAuthenticatedClient()` | Retorna cliente Gmail con auto-refresh | `Promise<gmail_v1.Gmail>` |
| `isAuthenticated()` | Verifica si hay token | `Promise<boolean>` |
| `getAuthStatus()` | Estado detallado de autenticación | `Promise<{authenticated, tokenExpired, expiryDate}>` |
| `clearAuth()` | Elimina token de DB | `Promise<void>` |
| `getLabelIdByName(name)` | Convierte nombre label → ID | `Promise<string \| null>` |
| `getEmailsByLabel(label, max)` | Obtiene emails de un label | `Promise<any[]>` |
| `extractBodyFromMessage(msg)` | Extrae texto plano/HTML | `string` |
| `getMessageDate(msg)` | Obtiene fecha del email | `Date` |

---

## 6. ASOCIACIÓN TOKEN ↔ USUARIO

### 6.1 Modelo Actual: **SINGLE-USER**

La implementación actual está diseñada para **una sola cuenta de Google** (la del propietario de la app).

**Evidencia:**
- Solo un registro en `google_auth_tokens` (se borra el anterior al autenticar)
- No hay campo `userId` en la tabla
- Método `deleteMany({})` borra todos los tokens previos (línea 29 gmail.service.ts)

### 6.2 Cómo Identificar la Cuenta

**No hay asociación explícita de usuario en DB**, pero puedes obtener el email del token:

```typescript
const gmail = await gmailService.getAuthenticatedClient();
const profile = await gmail.users.getProfile({ userId: 'me' });
console.log('Email autenticado:', profile.data.emailAddress);
```

**Gmail API también retorna:**
- `profile.data.messagesTotal`
- `profile.data.threadsTotal`
- `profile.data.historyId`

### 6.3 Migración a Multi-User (Futuro)

Si necesitas soportar múltiples usuarios, cambios requeridos:

1. **Agregar campo `userId` a `GoogleAuthToken`:**
   ```prisma
   model GoogleAuthToken {
     id           Int      @id @default(autoincrement())
     userId       String   @map("user_id") // Email o ID del usuario
     accessToken  String   @map("access_token")
     refreshToken String   @map("refresh_token")
     // ...
     @@unique([userId])
   }
   ```

2. **Modificar métodos de GmailService:**
   - Agregar parámetro `userId` a `getAuthenticatedClient(userId)`
   - Filtrar tokens por `userId` en queries
   - Asociar tokens a sesión de usuario (cookies/JWT)

3. **Frontend:**
   - Guardar `userId` en contexto/estado global
   - Pasar `userId` en headers de API requests

---

## 7. RIESGOS Y PENDIENTES IDENTIFICADOS

### 7.1 ⚠️ CRÍTICO

#### A) **Falta Configuración de Variables de Entorno**

**Riesgo:** Si `.env` no tiene valores reales, OAuth fallará silenciosamente.

**Verificar:**
```bash
# En node-version/
cat .env | grep GOOGLE_CLIENT_ID
```

**Acción:**
- Confirmar que existen valores reales (no "tu-client-id")
- Si no existen, obtenerlos de [Google Cloud Console](https://console.cloud.google.com/)

#### B) **No Hay Manejo de Errores de Refresh Token Inválido**

**Problema:** Si el usuario revoca permisos en Google, `refreshAccessToken()` fallará.

**Ubicación:** `node-version/src/services/gmail.service.ts` (línea 62)

**Solución Recomendada:**
```typescript
try {
  const { credentials } = await this.oauth2Client.refreshAccessToken();
  // ... actualizar DB
} catch (error) {
  // Token revocado o inválido → borrar de DB y requerir re-autenticación
  await prisma.googleAuthToken.deleteMany({});
  throw new Error('Autenticación expirada. Por favor vuelve a autenticarte.');
}
```

#### C) **No Hay Rate Limiting para Gmail API**

**Problema:** Gmail API tiene límites (250 queries/usuario/segundo, 1 billón queries/día).

**Riesgo:** Si se hacen muchas sync, puede bloquearse temporalmente.

**Solución:**
- Implementar exponential backoff en requests
- Cachear lista de labels
- Limitar cantidad de emails descargados por sync (ya existe `maxResults`, pero no tiene límite superior)

### 7.2 ⚠️ MEDIO

#### A) **Scope Insuficiente para Crear Labels**

**Scope Actual:** `gmail.readonly`

**Limitación:** No se pueden crear/modificar labels automáticamente.

**Si necesitas crear labels:**
```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels' // ← AGREGAR
];
```

**Nota:** Requiere re-autenticación del usuario.

#### B) **No Hay Logging de Actividad OAuth**

**Recomendación:** Agregar logs a:
- Intentos de autenticación (éxito/fallo)
- Refresh de tokens
- Errores de Gmail API

**Ejemplo:**
```typescript
console.log(`[OAuth] Usuario autenticado: ${email} - Token expira: ${expiryDate}`);
console.log(`[OAuth] Refresh exitoso - Nuevo expiry: ${newExpiryDate}`);
```

#### C) **Falta Endpoint para Ver Información del Token Actual**

**Recomendación:** Agregar endpoint:
```typescript
GET /api/integrations/google/token-info
→ { email, expiryDate, scopes, createdAt }
```

### 7.3 ℹ️ BAJO

#### A) **UI No Muestra Fecha de Expiración del Token**

**Mejora UX:** Mostrar en frontend:
- "Autenticado como: sebaceba@gmail.com"
- "Token válido hasta: 2026-03-15 14:30"
- Botón "Renovar" si está próximo a expirar

#### B) **No Hay Tests para OAuth Flow**

**Recomendación:** Agregar tests unitarios/integración para:
- `handleCallback()` con códigos válidos e inválidos
- `getAuthenticatedClient()` con tokens expirados
- Auto-refresh de tokens

#### C) **Paginación de Gmail Puede Ser Lenta**

**Observación:** `getEmailsByLabel()` obtiene TODOS los emails (línea 146-163 gmail.service.ts).

**Optimización:**
- Si un label tiene 5000+ emails, puede tomar minutos
- Agregar progress tracking (`console.log` ya existe)
- Considerar procesamiento asíncrono/background jobs

---

## 8. DEPENDENCIAS Y LIBRERÍAS

### 8.1 Backend (package.json)

```json
{
  "dependencies": {
    "googleapis": "^170.0.0",  // ← Cliente oficial Google APIs
    "dotenv": "^16.4.5",       // Variables de entorno
    "@prisma/client": "^5.22.0", // ORM para SQLite
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "date-fns": "^3.6.0"       // Manipulación de fechas
  }
}
```

### 8.2 Librería googleapis

**Documentación:** https://github.com/googleapis/google-api-nodejs-client

**Módulos utilizados:**
- `google.auth.OAuth2` - Cliente OAuth2
- `google.gmail({ version: 'v1', auth })` - Gmail API v1

**Métodos Gmail API usados:**
- `gmail.users.labels.list()` - Listar labels
- `gmail.users.messages.list()` - Listar IDs de mensajes
- `gmail.users.messages.get()` - Obtener mensaje completo
- `gmail.users.getProfile()` - Info del usuario (no usado actualmente)

---

## 9. CHECKLIST DE VERIFICACIÓN

### ✅ Implementado y Funcional

- [x] OAuth2 con Google
- [x] Callback endpoint
- [x] Almacenamiento de tokens en DB
- [x] Auto-refresh de access token
- [x] Scope `gmail.readonly`
- [x] Obtener emails por label
- [x] Parsear contenido de emails
- [x] Frontend con popup OAuth
- [x] Sincronización Tenpo (compras/pagos)
- [x] Importación servicios básicos (Luz, Agua, etc.)
- [x] Prevención de duplicados (gmailMessageId único)
- [x] Paginación para labels grandes

### ❌ Falta o No Implementado

- [ ] Multi-user support
- [ ] Manejo de refresh token revocado
- [ ] Rate limiting / exponential backoff
- [ ] Logging de actividad OAuth
- [ ] UI mostrando estado del token
- [ ] Tests automatizados
- [ ] Scope `gmail.labels` (si se necesita crear labels)
- [ ] Background jobs para sync masivos
- [ ] Webhook/push notifications (Gmail Pub/Sub)

---

## 10. CONCLUSIÓN Y RECOMENDACIONES

### ✅ Estado Actual: LISTO PARA USAR

La implementación OAuth/Gmail API es **sólida y funcional** para el caso de uso single-user. El código está bien estructurado, con separación de responsabilidades y auto-refresh implementado.

### 🎯 Próximos Pasos Recomendados (Prioridad)

1. **ALTA:** Verificar que `.env` tiene credenciales reales
2. **ALTA:** Agregar try-catch para refresh token revocado
3. **MEDIA:** Implementar logging de OAuth events
4. **MEDIA:** Agregar endpoint `/token-info` para debugging
5. **BAJA:** Considerar UI para mostrar estado del token

### 🚀 Lo Que Ya Puedes Hacer

Con la implementación actual, puedes:

1. **Leer emails de cualquier label**
2. **Parsear facturas/notificaciones automáticamente**
3. **Sincronizar datos de Gmail a DB local**
4. **Extender a nuevos providers** (ej: Telefonía, Seguros) duplicando el patrón de Utilities

### 📝 Para Nuevas Integraciones

**Template para agregar un nuevo provider con Gmail:**

1. Agregar label a Gmail: `"Categoría/Proveedor"`
2. Crear provider en `servicios_basicos` con `gmailLabel` y `hasEmailConnector = true`
3. Agregar lógica de parsing específica en `utilities-parser.service.ts`
4. (Opcional) Crear endpoint custom si el flujo es muy diferente a Utilities

**Ejemplo concreto:**
- Provider: "Telefonía Entel"
- Label: "Facturación Entel"
- Parser: Extraer monto, período, consumo datos/minutos
- Endpoint de importación ya existe: `POST /api/utilities/Telefonía Entel/import-email`

---

**Documento generado:** 2026-02-27  
**Última auditoría:** 2026-02-27  
**Próxima revisión sugerida:** Cada 3 meses o antes de migrar a multi-user
