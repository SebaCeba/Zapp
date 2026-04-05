# Hardening OAuth - Manejo de Refresh Token Revocado

**Fecha:** 2026-02-27  
**Estado:** ✅ Implementado  
**Criticidad:** ALTA

---

## 1. CONTEXTO DEL PROBLEMA

### 1.1 Situación Inicial

La implementación original de `GmailService.getAuthenticatedClient()` ejecutaba `refreshAccessToken()` sin manejo de errores. Si el refresh token era **revocado**, **inválido** o **expirado**, la aplicación fallaba de forma silenciosa o con errores genéricos.

**Escenarios problemáticos:**
- Usuario revoca permisos desde su cuenta de Google
- Google invalida el refresh token por políticas de seguridad
- Token corrupto o mal formado en la base de datos
- Credenciales de OAuth cambiadas sin re-autenticación

**Consecuencia:** La aplicación quedaba en estado inconsistente con un token inválido en DB, requiriendo intervención manual para limpiar la base de datos.

### 1.2 Riesgo Identificado

Sin manejo apropiado:
- ❌ Errores 500 genéricos sin contexto claro
- ❌ Token inválido permanece en DB
- ❌ Usuario no sabe que debe re-autenticarse
- ❌ Endpoints de Gmail fallan sin indicación de causa raíz

---

## 2. ARCHIVO MODIFICADO

**Ruta:** `node-version/src/services/gmail.service.ts`  
**Método:** `GmailService.getAuthenticatedClient()`  
**Líneas:** ~60-72 (bloque de refresh token)

---

## 3. CAMBIOS IMPLEMENTADOS

### 3.1 ANTES (Código Original)

```typescript
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
```

**Problemas:**
- No captura excepción si `refreshAccessToken()` falla
- Token inválido se queda en DB
- Error propagado sin contexto de re-autenticación

### 3.2 DESPUÉS (Código Hardened)

```typescript
// Verificar si el token expiró y refrescarlo
if (new Date() >= tokenRecord.expiryDate) {
  try {
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    await prisma.googleAuthToken.update({
      where: { id: tokenRecord.id },
      data: {
        accessToken: credentials.access_token!,
        expiryDate: new Date(credentials.expiry_date!),
      }
    });

    this.oauth2Client.setCredentials(credentials);

  } catch (error) {
    console.error('[OAuth] Refresh token inválido o revocado:', error);
    
    // Eliminar token corrupto de la base de datos
    await prisma.googleAuthToken.deleteMany({});
    
    throw new Error('Autenticación expirada o revocada. Por favor vuelve a autenticarte.');
  }
}

return google.gmail({ version: 'v1', auth: this.oauth2Client });
```

**Mejoras:**
- ✅ Captura error de refresh token
- ✅ Limpia DB eliminando token inválido
- ✅ Lanza error descriptivo para el usuario
- ✅ Logging con prefijo `[OAuth]` para troubleshooting

---

## 4. FLUJO DE ERROR NUEVO

### 4.1 Diagrama de Flujo

```
┌─────────────────────────────────────┐
│ Usuario llama endpoint que usa     │
│ Gmail API (ej: /api/tenpo/sync)    │
└─────────────┬───────────────────────┘
              ▼
┌─────────────────────────────────────┐
│ GmailService.getAuthenticatedClient()│
└─────────────┬───────────────────────┘
              ▼
┌─────────────────────────────────────┐
│ ¿Token expirado?                    │
└─────────────┬───────────────────────┘
              ▼
         ┌────┴─────┐
         │ NO       │ SÍ
         ▼          ▼
    Return       Try Refresh
    Client       ┌──────────┐
                 │ ¿Success?│
                 └──┬───┬───┘
              SÍ │   │ NO
                 ▼   ▼
            Update  ┌──────────────────────┐
            Token   │ catch (error)        │
            Return  │ - Log error          │
            Client  │ - Delete token from DB│
                    │ - Throw clear error  │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Endpoint captura error│
                    │ Retorna 401/500      │
                    │ con mensaje claro    │
                    └──────────────────────┘
```

### 4.2 Respuesta HTTP en Endpoints

Los endpoints que usan Gmail API (ej: `/api/tenpo/sync`, `/api/utilities/:provider/import-email`) ya tienen manejo de errores genérico:

```typescript
try {
  await gmailService.getAuthenticatedClient();
  // ... uso de Gmail API
} catch (error: any) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message }); // ← Aquí llega el mensaje claro
}
```

**Resultado final para el usuario:**
```json
{
  "error": "Autenticación expirada o revocada. Por favor vuelve a autenticarte."
}
```

---

## 5. CÓMO PROBAR MANUALMENTE

### 5.1 Método 1: Simulación con Token Corrupto

```bash
# 1. Entrar al directorio del proyecto
cd C:\Users\sceba\Python\Proyectos\Zapps\node-version

# 2. Corromper el refresh token en la base de datos
sqlite3 prisma/dev.db "UPDATE google_auth_tokens SET refresh_token = 'TOKEN_INVALIDO' WHERE id = 1;"

# 3. Forzar expiración del access token
sqlite3 prisma/dev.db "UPDATE google_auth_tokens SET expiry_date = '2020-01-01 00:00:00' WHERE id = 1;"

# 4. Intentar sincronizar desde el frontend o con curl
curl -X POST http://localhost:3000/api/tenpo/sync

# RESULTADO ESPERADO:
# {
#   "error": "Autenticación expirada o revocada. Por favor vuelve a autenticarte."
# }

# 5. Verificar que el token fue eliminado de DB
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM google_auth_tokens;"
# Debería retornar: 0
```

### 5.2 Método 2: Revocación Real desde Google

```bash
# 1. Obtener el access token actual
sqlite3 prisma/dev.db "SELECT access_token FROM google_auth_tokens;"

# 2. Ir a Google Account Permissions:
# https://myaccount.google.com/permissions

# 3. Buscar la app "Zapps" o el nombre configurado en Google Cloud Console

# 4. Hacer clic en "Remove access"

# 5. Esperar a que el access token expire (o forzar expiración en DB):
sqlite3 prisma/dev.db "UPDATE google_auth_tokens SET expiry_date = '2020-01-01 00:00:00' WHERE id = 1;"

# 6. Intentar endpoint que use Gmail:
curl -X POST http://localhost:3000/api/tenpo/sync

# RESULTADO ESPERADO:
# - Error "Autenticación expirada o revocada"
# - Token eliminado de DB
# - Log en consola del backend: "[OAuth] Refresh token inválido o revocado: ..."
```

### 5.3 Verificación en Logs del Backend

Al producirse el error, deberías ver en la consola del servidor:

```
[OAuth] Refresh token inválido o revocado: Error: invalid_grant
  Request had invalid authentication credentials. Expected OAuth 2 access token...
```

---

## 6. RIESGOS MITIGADOS

### 6.1 ✅ Estado Inconsistente de DB

**Antes:** Token inválido permanecía en DB indefinidamente.  
**Después:** Token corrupto se elimina automáticamente al detectarse.

### 6.2 ✅ Errores Crípticos para el Usuario

**Antes:**
```json
{
  "error": "invalid_grant"
}
```

**Después:**
```json
{
  "error": "Autenticación expirada o revocada. Por favor vuelve a autenticarte."
}
```

### 6.3 ✅ Debugging Complejo

**Antes:** Sin logs, difícil identificar causa raíz.  
**Después:** Log explícito `[OAuth] Refresh token inválido o revocado:` con stack trace.

### 6.4 ✅ Recuperación Manual Requerida

**Antes:** Administrador debía ejecutar SQL para limpiar tokens.  
**Después:** Auto-limpieza automática, usuario solo necesita re-autenticarse desde UI.

---

## 7. IMPACTO EN OTROS COMPONENTES

### 7.1 ✅ Sin Cambios en Frontend

El frontend ya maneja errores 500 mostrando el mensaje de error:

```typescript
// Ejemplo de ActualTenpo.tsx
try {
  const response = await fetch('/api/tenpo/sync', { method: 'POST' });
  const data = await response.json();
  
  if (!response.ok) {
    showToast(data.error || 'Error al sincronizar', 'error'); // ← Muestra mensaje claro
    return;
  }
  // ...
} catch (error) {
  showToast('Error de conexión', 'error');
}
```

### 7.2 ✅ Endpoints Dependientes Heredan la Mejora

Todos los endpoints que usan `gmailService` obtienen el beneficio automáticamente:

- ✅ `/api/tenpo/sync`
- ✅ `/api/tenpo/debug/labels`
- ✅ `/api/utilities/:provider/import-email`
- ✅ Cualquier endpoint futuro que use Gmail API

### 7.3 ⚠️ Consideración de UX

**Mejora futura recomendada:** Agregar botón de re-autenticación en el mensaje de error del frontend:

```typescript
if (error.includes('vuelve a autenticarte')) {
  showToast(
    'Tu sesión de Gmail expiró. Haz clic en "Conectar Gmail" de nuevo.',
    'warning'
  );
  // Mostrar botón de OAuth prominentemente
}
```

---

## 8. TESTEO AUTOMATIZADO RECOMENDADO (FUTURO)

### 8.1 Test Unitario Sugerido

```typescript
// tests/services/gmail.service.test.ts

describe('GmailService - Refresh Token Handling', () => {
  it('should delete token from DB when refresh fails', async () => {
    // 1. Mock oauth2Client.refreshAccessToken() to throw error
    jest.spyOn(gmailService['oauth2Client'], 'refreshAccessToken')
      .mockRejectedValue(new Error('invalid_grant'));

    // 2. Insert expired token in DB
    await prisma.googleAuthToken.create({
      data: {
        accessToken: 'expired_token',
        refreshToken: 'invalid_refresh',
        expiryDate: new Date('2020-01-01'),
        scope: 'gmail.readonly',
        tokenType: 'Bearer'
      }
    });

    // 3. Call getAuthenticatedClient()
    await expect(gmailService.getAuthenticatedClient())
      .rejects
      .toThrow('Autenticación expirada o revocada');

    // 4. Verify token was deleted
    const count = await prisma.googleAuthToken.count();
    expect(count).toBe(0);
  });

  it('should NOT delete token when refresh succeeds', async () => {
    // Test del happy path (no debe eliminar token si refresh funciona)
  });
});
```

---

## 9. ROLLBACK (Si es Necesario)

Si este cambio causa problemas inesperados, revertir a la versión anterior:

```bash
cd node-version/src/services

# Ver commit antes de este cambio
git log --oneline gmail.service.ts

# Revertir a commit anterior (reemplazar HASH_COMMIT)
git checkout HASH_COMMIT -- gmail.service.ts
```

O manualmente, reemplazar el bloque try-catch por la versión original sin manejo de errores.

---

## 10. PRÓXIMOS PASOS RECOMENDADOS

### 10.1 ALTA PRIORIDAD

- [ ] **Monitorear logs de producción** para ver frecuencia de revocaciones
- [ ] **Agregar métrica/alerting** si se detectan múltiples revocaciones (posible ataque)

### 10.2 MEDIA PRIORIDAD

- [ ] **Mejorar UI** para mostrar botón de re-autenticación después de error
- [ ] **Agregar endpoint** `/api/integrations/google/reauth-required` para verificar estado
- [ ] **Implementar tests unitarios** para este flujo

### 10.3 BAJA PRIORIDAD

- [ ] **Rate limiting** en intentos de refresh fallidos
- [ ] **Email notification** al usuario cuando se revoca su token
- [ ] **Dashboard admin** para ver historial de revocaciones

---

## 11. REFERENCIAS

- **Google OAuth2 Error Codes:** https://developers.google.com/identity/protocols/oauth2/web-server#handlingresponse
- **googleapis Node.js Client:** https://github.com/googleapis/google-api-nodejs-client
- **Auditoría OAuth previa:** `docs/auditoria_oauth_gmail.md`

---

**Implementado por:** GitHub Copilot  
**Revisado:** 2026-02-27  
**Versión del documento:** 1.0
