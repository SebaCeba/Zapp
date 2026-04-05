# API Endpoint: Listar Labels de Gmail

**Fecha:** 2026-02-27  
**Estado:** ✅ Implementado  
**Versión:** 1.0

---

## 1. INFORMACIÓN DEL ENDPOINT

### 1.1 Descripción

Endpoint para listar los labels (etiquetas) reales del Gmail autenticado mediante OAuth2. Solo retorna labels creados por el usuario, excluyendo labels del sistema (INBOX, SENT, DRAFT, etc.).

**Caso de uso principal:** Configuración de integraciones automáticas (ej: asociar provider de servicios básicos con su label de Gmail).

### 1.2 Datos Técnicos

| Campo | Valor |
|-------|-------|
| **Método** | `GET` |
| **Ruta** | `/api/gmail/labels` |
| **Autenticación** | OAuth2 (Gmail API) |
| **Scope requerido** | `gmail.readonly` |
| **Archivo de implementación** | `node-version/src/routes/gmail.ts` |

---

## 2. RESPUESTA ESPERADA

### 2.1 Success (200 OK)

```json
[
  {
    "id": "Label_123456789",
    "name": "Facturación ENEL",
    "type": "user"
  },
  {
    "id": "Label_987654321",
    "name": "Tenpo/Compras TC Tenpo",
    "type": "user"
  },
  {
    "id": "Label_456789123",
    "name": "Tenpo/Pagos TC Tenpo",
    "type": "user"
  }
]
```

**Características:**
- Array de objetos con labels de usuario
- Ordenados alfabéticamente por `name`
- Solo labels con `type: "user"`
- Vacío `[]` si no hay labels de usuario

### 2.2 Error 401 (No Autenticado)

```json
{
  "error": "No autenticado con Google. Conecta Google desde Integraciones."
}
```

**Causas:**
- No existe token de autenticación en base de datos
- Token revocado por el usuario desde Google Account
- Refresh token inválido o expirado (hardening OAuth aplicado)

### 2.3 Error 500 (Error Interno)

```json
{
  "error": "Error al obtener labels de Gmail. Intenta nuevamente."
}
```

**Causas:**
- Error de comunicación con Gmail API
- Rate limiting de Gmail API
- Problemas de red/conectividad

---

## 3. REGLAS DE FILTRADO

### 3.1 Labels Incluidos

✅ **Solo labels de usuario** (`type: "user"`):
- Labels creados manualmente por el usuario
- Labels creados por filtros de Gmail
- Labels anidados (ej: `Categoría/Subcategoría`)

### 3.2 Labels Excluidos

❌ **Labels del sistema** (`type: "system"`):
- `INBOX`
- `SENT`
- `DRAFT`
- `TRASH`
- `SPAM`
- `IMPORTANT`
- `STARRED`
- `UNREAD`
- `CATEGORY_*` (Categorías de Gmail: Social, Promociones, etc.)
- Otros labels internos de Gmail

**Nota:** El filtrado se hace usando el campo `type` retornado por Gmail API. No es necesario filtrar por nombre.

### 3.3 Ordenamiento

Labels ordenados **alfabéticamente ascendente** por el campo `name`:

```javascript
labels.sort((a, b) => a.name.localeCompare(b.name));
```

**Resultado:**
```
"Facturación ENEL"
"Facturación VTR"
"Tenpo/Compras TC Tenpo"
"Tenpo/Pagos TC Tenpo"
```

---

## 4. FLUJO DE AUTENTICACIÓN

### 4.1 Diagrama

```
┌──────────────────────────────┐
│ Frontend llama:              │
│ GET /api/gmail/labels        │
└──────────┬───────────────────┘
           ▼
┌──────────────────────────────┐
│ gmailService.getAuthStatus() │
└──────────┬───────────────────┘
           ▼
     ┌─────┴──────┐
     │ Autenticado?│
     └─────┬──┬────┘
        NO │  │ SÍ
           ▼  ▼
       401   ┌────────────────────────┐
             │ getAuthenticatedClient()│
             │ (con auto-refresh)      │
             └────────┬───────────────┘
                      ▼
             ┌────────────────────────┐
             │ gmail.users.labels.list│
             │ ({ userId: 'me' })     │
             └────────┬───────────────┘
                      ▼
             ┌────────────────────────┐
             │ Filtrar type === 'user'│
             │ Ordenar alfabéticamente│
             └────────┬───────────────┘
                      ▼
                  200 OK
```

### 4.2 Manejo de Token Expirado

Si el access token está expirado:
1. `getAuthenticatedClient()` detecta expiración
2. Ejecuta auto-refresh con `refreshAccessToken()`
3. Actualiza token en base de datos
4. Continúa con la petición normalmente

Si el refresh token está **revocado**:
1. `refreshAccessToken()` falla
2. Catch block elimina token de DB
3. Lanza error con mensaje claro
4. Endpoint retorna **401** con instrucción de re-autenticación

---

## 5. CÓDIGOS DE ERROR

| Código | Escenario | Acción del Usuario |
|--------|-----------|-------------------|
| **200** | Success | - |
| **401** | No autenticado / Token revocado | Ir a "Integraciones" → Conectar Google |
| **500** | Error interno / API de Gmail | Reintentar en unos minutos |

---

## 6. CÓMO PROBAR

### 6.1 Requisitos Previos

1. Backend corriendo: `cd node-version && npm run dev`
2. OAuth configurado (`.env` con `GOOGLE_CLIENT_ID`, etc.)
3. Usuario autenticado con Gmail (usar `/api/integrations/google/auth-url`)

### 6.2 Prueba con cURL

```bash
# Listar labels de usuario
curl -X GET http://localhost:3000/api/gmail/labels

# Respuesta esperada (ejemplo):
# [
#   {"id":"Label_123","name":"Facturación ENEL","type":"user"},
#   {"id":"Label_456","name":"Tenpo/Compras TC Tenpo","type":"user"}
# ]
```

### 6.3 Prueba con Browser (DevTools)

```javascript
fetch('http://localhost:3000/api/gmail/labels')
  .then(r => r.json())
  .then(labels => {
    console.table(labels);
  });
```

### 6.4 Prueba sin Autenticación

```bash
# 1. Eliminar token de base de datos
sqlite3 node-version/prisma/dev.db "DELETE FROM google_auth_tokens;"

# 2. Intentar listar labels
curl -X GET http://localhost:3000/api/gmail/labels

# Respuesta esperada:
# {
#   "error": "No autenticado con Google. Conecta Google desde Integraciones."
# }
```

### 6.5 Prueba con Token Revocado

```bash
# 1. Revocar acceso desde Google Account:
# https://myaccount.google.com/permissions

# 2. Forzar expiración del access token
sqlite3 node-version/prisma/dev.db "UPDATE google_auth_tokens SET expiry_date = '2020-01-01';"

# 3. Intentar listar labels
curl -X GET http://localhost:3000/api/gmail/labels

# Resultado:
# - Backend intenta refresh
# - Refresh falla (token revocado)
# - Token eliminado de DB
# - Respuesta 401: "No autenticado con Google..."
```

---

## 7. ARCHIVOS MODIFICADOS/CREADOS

### 7.1 Nuevos Archivos

| Archivo | Descripción |
|---------|-------------|
| `node-version/src/routes/gmail.ts` | Ruta del endpoint `/api/gmail/labels` |
| `docs/api_gmail_labels.md` | Este documento (documentación del endpoint) |

### 7.2 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `node-version/src/index.ts` | Agregado import y registro de `gmailRoutes` |

**Cambios específicos en `index.ts`:**

```typescript
// Import agregado (línea ~13)
import gmailRoutes from './routes/gmail';

// Registro agregado (línea ~40)
app.use('/api/gmail', gmailRoutes);
```

---

## 8. INTEGRACIÓN CON OTROS ENDPOINTS

### 8.1 Endpoints Relacionados

Este endpoint complementa la suite de integraciones de Gmail:

| Endpoint | Propósito |
|----------|-----------|
| `/api/integrations/google/auth-url` | Obtener URL de OAuth2 |
| `/api/integrations/google/callback` | Callback OAuth2 |
| `/api/integrations/google/status` | Estado de autenticación |
| `/api/gmail/labels` | **Listar labels del usuario** ← NUEVO |
| `/api/tenpo/debug/labels` | Debug (todos los labels, incluye system) |

### 8.2 Uso en Frontend

**Ejemplo: Componente de configuración de servicios básicos**

```typescript
// Obtener labels disponibles para asociar a un provider
async function fetchGmailLabels() {
  try {
    const response = await fetch('/api/gmail/labels');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Mostrar botón de "Conectar Gmail"
        setAuthRequired(true);
        return;
      }
      throw new Error('Error al cargar labels');
    }
    
    const labels = await response.json();
    setAvailableLabels(labels);
    
  } catch (error) {
    showToast('Error al cargar labels de Gmail', 'error');
  }
}

// Renderizar selector
<select onChange={(e) => setSelectedLabel(e.target.value)}>
  <option value="">-- Selecciona un label --</option>
  {availableLabels.map(label => (
    <option key={label.id} value={label.name}>
      {label.name}
    </option>
  ))}
</select>
```

---

## 9. CONSIDERACIONES DE SEGURIDAD

### 9.1 ✅ Implementado

- **Verificación de autenticación previa** antes de llamar Gmail API
- **Manejo de token revocado** (hardening OAuth aplicado)
- **Filtrado de labels del sistema** (solo exponer labels de usuario)
- **Mensajes de error genéricos** (no exponer detalles internos)

### 9.2 ⚠️ Futuro

- **Rate limiting:** Limitar requests por usuario/IP para evitar abuso
- **Caché:** Cachear lista de labels por X minutos (labels no cambian frecuentemente)
- **Logging:** Registrar accesos para auditoría

---

## 10. LIMITACIONES Y EDGE CASES

### 10.1 Labels Anidados

Gmail soporta jerarquías usando `/`:
```
"Tenpo/Compras TC Tenpo"
"Tenpo/Pagos TC Tenpo"
```

**Comportamiento actual:** Se retornan tal cual (con el `/` en el nombre).

**Consideración futura:** Si se requiere vista jerárquica en frontend, parsear el `/` y construir árbol.

### 10.2 Sin Labels de Usuario

Si el usuario no tiene labels personalizados:
```json
[]
```

**No es un error**, simplemente un array vacío.

### 10.3 Límite de Gmail API

Gmail API tiene límites de cuota:
- **250 queries/usuario/segundo**
- **1 billón queries/día**

Para listado de labels (operación liviana), no debería ser problema. Considerar rate limiting en frontend si se llama frecuentemente (ej: cada vez que se abre un modal).

---

## 11. TESTING

### 11.1 Test Manual Checklist

- [ ] Endpoint retorna 200 con labels válidos
- [ ] Labels de usuario solamente (sin INBOX, SENT, etc.)
- [ ] Labels ordenados alfabéticamente
- [ ] Retorna 401 sin autenticación
- [ ] Retorna 401 con token revocado
- [ ] Auto-refresh funciona cuando token expira
- [ ] Logs en backend muestran `[Gmail API]` para debugging

### 11.2 Test Automatizado Sugerido (Futuro)

```typescript
// tests/routes/gmail.test.ts

describe('GET /api/gmail/labels', () => {
  it('should return 401 when not authenticated', async () => {
    // Eliminar tokens
    await prisma.googleAuthToken.deleteMany({});
    
    const res = await request(app).get('/api/gmail/labels');
    
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('No autenticado');
  });

  it('should return user labels only', async () => {
    // Mock gmail.users.labels.list
    const mockLabels = [
      { id: 'INBOX', name: 'INBOX', type: 'system' },
      { id: 'Label_1', name: 'Custom Label', type: 'user' }
    ];
    
    jest.spyOn(gmailService, 'getAuthenticatedClient')
      .mockResolvedValue({
        users: {
          labels: {
            list: jest.fn().mockResolvedValue({ data: { labels: mockLabels } })
          }
        }
      });
    
    const res = await request(app).get('/api/gmail/labels');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Custom Label');
  });

  it('should return labels sorted alphabetically', async () => {
    // Test ordenamiento
  });
});
```

---

## 12. REFERENCIAS

- **Gmail API - Labels:** https://developers.google.com/gmail/api/reference/rest/v1/users.labels/list
- **OAuth2 Audit:** `docs/auditoria_oauth_gmail.md`
- **Hardening OAuth:** `docs/hardening_oauth_refresh.md`
- **GmailService:** `node-version/src/services/gmail.service.ts`

---

**Implementado por:** GitHub Copilot  
**Fecha:** 2026-02-27  
**Versión:** 1.0
