# Auditoría: Eliminación de Bloqueo por Token Expirado en Vista "Tenpo TC Prepago"

**Fecha:** 2026-03-06  
**Objetivo:** Separar visualización de datos existentes vs sincronización Gmail  
**Alcance:** Vistas `/presupuesto/tenpo` y `/actual/tenpo`

---

## 📁 Archivos Revisados

### Frontend
- ✅ `node-version/client/src/pages/Tenpo.tsx` (vista principal anual)
- ✅ `node-version/client/src/pages/ActualTenpo.tsx` (vista mensual)
- ✅ `node-version/client/src/router.tsx` (rutas)
- ✅ `node-version/client/src/navigation/menuConfig.ts` (menú)

### Backend
- ✅ `node-version/src/routes/tenpo.ts` (endpoints de datos)
- ✅ `node-version/src/routes/google-integration.ts` (OAuth status)
- ✅ `node-version/src/services/gmail.service.ts` (servicio Gmail)
- ✅ `node-version/prisma/schema.prisma` (modelo de datos)

---

## 🔍 Flujo Actual Detectado

### 1. Secuencia de carga (Tenpo.tsx)

```
Usuario entra a /presupuesto/tenpo
    ↓
useEffect() → checkAuthStatus()
    ↓
GET /api/integrations/google/status
    ↓
Backend verifica token en BD (GoogleAuthToken)
    ↓
¿Token existe y NO expirado?
    ├─ SÍ → setIsAuthenticated(true)
    │       → useEffect() → loadData()
    │       → GET /api/tenpo/purchases
    │       → GET /api/tenpo/payments
    │       → Renderiza vista completa
    │
    └─ NO → setIsAuthenticated(false)
            → setTokenExpired(true)
            → BLOQUEO TOTAL DE LA VISTA
            → Muestra pantalla de re-autorización
            → Usuario DEBE autorizar para ver datos
```

### 2. Lógica de bloqueo frontend

**Archivo:** `Tenpo.tsx` (líneas 128-144)
```tsx
const checkAuthStatus = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/integrations/google/status');
    const data = await response.json();
    setIsAuthenticated(data.authenticated && !data.tokenExpired);
    setTokenExpired(data.tokenExpired || false);

    if (!data.authenticated || data.tokenExpired) {
      const authResponse = await fetch('http://localhost:3000/api/integrations/google/auth-url');
      const authData = await authResponse.json();
      setAuthUrl(authData.authUrl);
    }
  } catch (error) {
    console.error('Error verificando autenticación:', error);
  }
};
```

**Archivo:** `Tenpo.tsx` (líneas 529-565)
```tsx
if (!isAuthenticated) {
  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection title="Tenpo - TC Prepago" />
        <div className="card" style={{ backgroundColor: '#fef3c7' }}>
          <h2>⚠️ Token expirado</h2>
          <p>Debes autorizar nuevamente el acceso para continuar...</p>
          <a href={authUrl} target="_blank">
            🔄 Re-autorizar con Google
          </a>
        </div>
      </div>
    </MainLayout>
  );
}
```

**⚠️ PUNTO CRÍTICO:** El `return` temprano impide que se ejecute `loadData()` aunque los datos YA EXISTEN en la BD.

---

## 🔎 Hallazgos Frontend

### Tenpo.tsx (`/presupuesto/tenpo`)

| Aspecto | Estado Actual | Líneas |
|---------|--------------|--------|
| **Estado `isAuthenticated`** | Controla renderizado completo | 59 |
| **Estado `tokenExpired`** | Flag visual, no funcional diferenciado | 60 |
| **Estado `authUrl`** | URL para OAuth2 redirect | 61 |
| **Función `checkAuthStatus()`** | Verifica token, bloquea si expiró | 128-144 |
| **Función `handleSync()`** | Sincroniza con Gmail (POST /sync) | 146-177 |
| **Función `loadData()`** | Carga datos desde BD (NO requiere Gmail) | 413-458 |
| **Renderizado condicional** | `if (!isAuthenticated) return ...` | 529-565 |
| **Botón "Sincronizar"** | Llama a `handleSync()`, requiere token | 639-652 |

**🔴 Problema identificado:**
- `loadData()` solo consulta `/api/tenpo/purchases` y `/api/tenpo/payments`
- Estos endpoints NO requieren autenticación Gmail
- Sin embargo, el componente bloquea la ejecución de `loadData()` si el token expiró

### ActualTenpo.tsx (`/actual/tenpo`)

| Aspecto | Estado Actual | Líneas |
|---------|--------------|--------|
| **Estado `isAuthenticated`** | Controla renderizado completo | 89 |
| **Estado `tokenExpired`** | Flag visual | 90 |
| **Función `loadData()`** | Carga datos vía `/api/tenpo/admin/monthly` | 219-257 |
| **Renderizado condicional** | `if (!isAuthenticated && !loading) return ...` | 272-304 |
| **Manejo de 401** | Si backend devuelve 401, bloquea vista | 233-240 |

**🔴 Problema identificado:**
- Similar a Tenpo.tsx, pero esta vista SÍ maneja respuesta 401 del backend
- Si el backend devuelve 401, setea `isAuthenticated(false)` y bloquea
- Sin embargo, el endpoint `/api/tenpo/admin/monthly` NO requiere autenticación Gmail

---

## 🔎 Hallazgos Backend

### Endpoints de Lectura (NO requieren Gmail)

| Endpoint | Método | Requiere Gmail | Descripción |
|----------|--------|----------------|-------------|
| `/api/tenpo/purchases` | GET | ❌ NO | Lista todas las compras de BD |
| `/api/tenpo/payments` | GET | ❌ NO | Lista todos los pagos de BD |
| `/api/tenpo/admin/monthly` | GET | ❌ NO | Compras con cuotas en mes/año |
| `/api/tenpo/config/tasa` | GET | ❌ NO | Tasa vigente actual |
| `/api/tenpo/purchases/:id/interes` | PATCH | ❌ NO | Toggle interés |
| `/api/tenpo/purchases/:id/confirmar-real` | POST | ❌ NO | Confirmar monto real |
| `/api/tenpo/purchases/:id/schedule` | PATCH | ❌ NO | Ajustar calendario |

### Endpoints de Escritura (SÍ requieren Gmail)

| Endpoint | Método | Requiere Gmail | Descripción |
|----------|--------|----------------|-------------|
| `/api/tenpo/sync` | POST | ✅ SÍ | Sincroniza emails de Gmail |
| `/api/tenpo/debug/labels` | GET | ✅ SÍ | Lista etiquetas Gmail (debug) |
| `/api/tenpo/debug/search` | GET | ✅ SÍ | Busca en emails Gmail (debug) |

### Servicio Gmail (`gmail.service.ts`)

**Método `getAuthStatus()` (líneas 97-116):**
```ts
async getAuthStatus(): Promise<{ authenticated: boolean; tokenExpired: boolean; expiryDate: Date | null }> {
  try {
    const tokenRecord = await prisma.googleAuthToken.findFirst();
    
    if (!tokenRecord) {
      return { authenticated: false, tokenExpired: false, expiryDate: null };
    }

    const isExpired = new Date() >= tokenRecord.expiryDate;
    
    return {
      authenticated: true,
      tokenExpired: isExpired,
      expiryDate: tokenRecord.expiryDate
    };
  } catch {
    return { authenticated: false, tokenExpired: false, expiryDate: null };
  }
}
```

**🔴 Problema identificado:**
- El servicio devuelve `tokenExpired: true` si el token expiró
- Pero NO lanza excepción ni impide consultas a BD
- El bloqueo es puramente una decisión del frontend

---

## 🎯 Punto Exacto del Bloqueo

### Frontend: Tenpo.tsx

**Línea 529:** `if (!isAuthenticated) {`

```tsx
// Bloqueo actual
if (!isAuthenticated) {
  return (
    <MainLayout>
      <div className="card" style={{ backgroundColor: '#fef3c7' }}>
        <h2>{tokenExpired ? '⚠️ Token expirado' : '🔐 Autenticación requerida'}</h2>
        <p>Debes autorizar para continuar...</p>
        <a href={authUrl}>Re-autorizar</a>
      </div>
    </MainLayout>
  );
}
```

### Frontend: ActualTenpo.tsx

**Línea 272:** `if (!isAuthenticated && !loading) {`

```tsx
// Bloqueo actual
if (!isAuthenticated && !loading) {
  return (
    <MainLayout>
      <div className="card" style={{ backgroundColor: '#fef3c7' }}>
        <h2>{tokenExpired ? '⚠️ Token expirado' : '🔐 Autenticación requerida'}</h2>
        <a href={authUrl}>Re-autorizar</a>
      </div>
    </MainLayout>
  );
}
```

**Línea 233:** Manejo de respuesta 401 del backend

```tsx
if (res.status === 401) {
  setIsAuthenticated(false);
  setTokenExpired(true);
  // ... obtener authUrl
  return; // ⚠️ Bloquea carga de datos
}
```

**🔴 Causa raíz:**
1. Backend devuelve status 200 para endpoints de lectura (no verifican token Gmail)
2. Backend solo devuelve 401 si el endpoint específicamente llama a `gmailService.getAuthenticatedClient()`
3. Frontend asume que `tokenExpired` implica que NO puede cargar datos
4. Frontend bloquea vista completa aunque `loadData()` funcionaría perfectamente

---

## 💾 Datos Disponibles para Modo Lectura

### Modelo de Datos (schema.prisma)

**Tabla `TenpoPurchase` (líneas 253-277)**
- ✅ `id`, `purchaseDate`, `merchant`
- ✅ `amountTotalClp` (capital)
- ✅ `installmentsCount` (número de cuotas)
- ✅ `tieneInteres` (flag si aplica interés)
- ✅ `modoMonto` (ESTIMADO | REAL)
- ✅ `totalFinanciadoEstimado`, `interesTotalEstimado`
- ✅ `metadata` (JSON: `{ feePct: 0.02 }`)
- ✅ `scheduleMode` (AUTO | MANUAL)
- ✅ `firstDueDateOverride` (fecha override)
- ✅ Relación con `installments[]`

**Tabla `TenpoInstallment` (líneas 279-297)**
- ✅ `installmentNumber`, `baseAmountClp`
- ✅ `dueDate`, `payDateEstimated`
- ✅ `estado` (ESTIMADO | REAL)
- ✅ `finalMonthlyAmountClp` (monto cuota calculado)

**Tabla `TenpoPayment` (líneas 299-312)**
- ✅ `payDate`, `amountClp`
- ✅ `paymentMethod`, `transactionCode`
- ✅ `periodPay`, `periodBill`

**Tabla `MerchantCategory` + `MerchantMapping`**
- ✅ Categorías asignadas por comercio
- ✅ Usado para enrichment en endpoints de lectura

### Última Sincronización

**⚠️ NO EXISTE CAMPO DE TRACKING:**
- No hay campo `lastSyncDate` en `TenpoPurchase` ni global
- El frontend usa estado local `lastSync` (línea 67) que se resetea al recargar
- El campo `createdAt` de `TenpoEmail` podría servir como proxy

**Solución propuesta:**
- Usar `max(createdAt)` de `TenpoEmail` para mostrar "Última sincronización"
- O agregar campo global `lastSyncDate` en nueva tabla de configuración

---

## ✅ Recomendación MVP

### Estrategia: "Always Show, Sync Optional"

#### 1. Cambios Frontend Mínimos

**Archivo: `Tenpo.tsx`**

**Cambio 1:** Eliminar bloqueo condicional (líneas 529-565)
```tsx
// ANTES
if (!isAuthenticated) {
  return <BloqueoCompleto />;
}

// DESPUÉS - Siempre cargar datos
useEffect(() => {
  loadData(); // Ya no depende de isAuthenticated
}, [anioSeleccionado]); // Ejecutar siempre
```

**Cambio 2:** Agregar banner no bloqueante (arriba de la vista)
```tsx
{tokenExpired && (
  <div className="banner-warning" style={{ backgroundColor: '#fef3c7', padding: '1rem', marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong>⚠️ Sincronización deshabilitada</strong>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          El token de Gmail expiró. Puedes ver datos guardados, pero no sincronizar nuevos.
          <span style={{ marginLeft: '0.5rem' }}>
            Última actualización: {lastSyncDisplay || 'Desconocida'}
          </span>
        </p>
      </div>
      <a href={authUrl} onClick={(e) => { e.preventDefault(); window.open(authUrl, '_blank'); }}>
        <button className="button-primary">
          🔄 Re-autorizar Gmail
        </button>
      </a>
    </div>
  </div>
)}
```

**Cambio 3:** Deshabilitar botón "Sincronizar" si token expirado
```tsx
<button
  onClick={handleSync}
  disabled={tokenExpired || syncing}
  className="button"
  style={{
    opacity: tokenExpired ? 0.5 : 1,
    cursor: tokenExpired ? 'not-allowed' : 'pointer'
  }}
>
  {tokenExpired ? '🔒 Sincronización bloqueada' : '🔄 Sincronizar'}
</button>
```

**Cambio 4:** Agregar indicador visual de estado de sincronización
```tsx
<div className="sync-status-badge">
  {tokenExpired ? (
    <span style={{ color: '#dc2626' }}>🔴 Sync Expirado</span>
  ) : (
    <span style={{ color: '#059669' }}>🟢 Sync OK</span>
  )}
</div>
```

**Archivo: `ActualTenpo.tsx`**

**Cambio 1:** Remover bloqueo 401 (líneas 233-240)
```tsx
// ANTES
if (res.status === 401) {
  setIsAuthenticated(false);
  setTokenExpired(true);
  return; // ⚠️ Bloquea
}

// DESPUÉS
if (res.status === 401) {
  setTokenExpired(true);
  // NO setear isAuthenticated(false)
  // Continuar procesando datos
}
```

**Cambio 2:** Remover bloqueo condicional (líneas 272-304)
```tsx
// ELIMINAR completamente este bloque
if (!isAuthenticated && !loading) {
  return <BloqueoCompleto />;
}
```

**Cambio 3:** Agregar banner similar a Tenpo.tsx

#### 2. Cambios Backend Mínimos

**✅ NO SE REQUIEREN CAMBIOS EN BACKEND**

Los endpoints de lectura (`/api/tenpo/purchases`, `/api/tenpo/payments`, `/api/tenpo/admin/monthly`) ya funcionan correctamente sin autenticación Gmail.

**Opcional (mejora futura):** Agregar endpoint para obtener última sincronización
```ts
// GET /api/tenpo/sync/status
router.get('/sync/status', async (req, res) => {
  try {
    const lastEmail = await prisma.tenpoEmail.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    
    const authStatus = await gmailService.getAuthStatus();
    
    res.json({
      lastSync: lastEmail?.createdAt || null,
      canSync: authStatus.authenticated && !authStatus.tokenExpired,
      tokenExpired: authStatus.tokenExpired
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 3. Secuencia de Implementación MVP

**Paso 1:** Modificar `Tenpo.tsx`
- [ ] Eliminar bloqueo condicional (`if (!isAuthenticated) return ...`)
- [ ] Agregar banner no bloqueante
- [ ] Deshabilitar botón "Sincronizar" si `tokenExpired`
- [ ] Agregar badge de estado sync

**Paso 2:** Modificar `ActualTenpo.tsx`
- [ ] Eliminar bloqueo condicional
- [ ] Remover manejo de 401 que bloquea
- [ ] Agregar banner no bloqueante

**Paso 3:** Testing
- [ ] Token válido: todo funciona normal (sync + visualización)
- [ ] Token expirado: visualización OK, sync bloqueado, banner visible
- [ ] Sin token: visualización OK, sync bloqueado, mensaje diferenciado

**Paso 4 (opcional):** Backend - Endpoint de última sincronización
- [ ] Crear `/api/tenpo/sync/status`
- [ ] Integrar en frontend para mostrar fecha real

---

## ⚠️ Riesgos / Dudas Abiertas

### 1. UX: Usuario confundido por datos "viejos"

**Riesgo:** Usuario ve datos de hace 2 semanas, no se da cuenta que no están actualizados.

**Mitigación:**
- Banner amarillo siempre visible si token expirado
- Mostrar "Última sincronización: [fecha]" prominente
- Badge "🔴 Sync Expirado" en header

### 2. Backend: ¿Algún endpoint devuelve 401 sin necesidad?

**Riesgo:** El endpoint `/api/tenpo/admin/monthly` podría tener lógica interna que llame a Gmail.

**Validación realizada:**
- ✅ Revisado código: NO llama a `gmailService`
- ✅ Solo consulta Prisma directamente
- ✅ Enrichment de categorías es local (BD)

### 3. Seguridad: ¿Se expone información sin autenticación?

**Riesgo:** Al eliminar el bloqueo, cualquier usuario con acceso a localhost:3000 podría ver los datos.

**Contexto:**
- App es monousuario (localhost)
- No hay multi-tenancy
- No hay autenticación de usuarios (solo OAuth con Google)
- El token Gmail no es para "autenticar usuario", sino para "sincronizar datos"

**Conclusión:** ✅ NO HAY RIESGO DE SEGURIDAD en este contexto.

### 4. Regresión: ¿Rompe flujo de primera vez?

**Escenario:** Usuario nuevo que nunca ha sincronizado.

**Estado actual:**
- No hay token → bloquea vista → usuario autoriza → sincroniza → ve datos

**Estado propuesto:**
- No hay token → muestra vista vacía + banner → usuario autoriza → sincroniza → ve datos

**Validación:**
- Si `purchases.length === 0` y `tokenExpired === false`, mostrar mensaje "No hay compras. Sincroniza para comenzar."
- Si `purchases.length === 0` y `tokenExpired === true`, mostrar banner "Autoriza para sincronizar"

### 5. Datos parciales: ¿Qué pasa si solo se sincronizó un año?

**Escenario:** Usuario sincronizó 2025, pero ahora está en 2026 y token expiró.

**Estado propuesto:**
- Vista 2025: muestra datos OK
- Vista 2026: vacía + banner "Token expirado, no hay datos de 2026"
- Usuario entiende que debe re-autorizar para obtener datos nuevos

**Mitigación:** Banner explica claramente "Última sincronización: [fecha]"

### 6. Performance: ¿Consultas innecesarias al backend?

**Riesgo:** Si `loadData()` se ejecuta siempre, puede generar consultas aunque no haya token.

**Validación:**
- `loadData()` solo hace GET a endpoints de BD (rápido)
- No hay overhead significativo
- Prisma es eficiente para queries simples

**Conclusión:** ✅ NO HAY IMPACTO DE PERFORMANCE

---

## 🎯 Resumen Ejecutivo

### Problema Actual
- Vista "Tenpo TC" bloquea completamente si el token de Gmail expiró
- Usuario NO puede ver datos ya guardados en la BD
- Debe re-autorizar obligatoriamente, aunque solo quiera consultar

### Causa Raíz
- Bloqueo es 100% en el frontend (líneas 529-565 en `Tenpo.tsx`)
- Backend ya soporta lectura sin token Gmail
- Endpoints de lectura NO requieren autenticación Gmail

### Solución MVP
1. **Eliminar bloqueo condicional** en `Tenpo.tsx` y `ActualTenpo.tsx`
2. **Agregar banner no bloqueante** con aviso de token expirado
3. **Deshabilitar botón "Sincronizar"** si token expirado
4. **Mostrar estado visual** (🟢 Sync OK | 🔴 Sync Expirado)
5. **No requiere cambios en backend**

### Impacto
- ✅ Usuario puede ver datos guardados siempre
- ✅ Sincronización sigue requiriendo token válido
- ✅ UX mejorada: separación clara de lectura vs escritura
- ✅ Cambios mínimos, bajo riesgo de regresión

### Esfuerzo Estimado
- Frontend: **2-3 horas** (cambios simples, mayormente condicionales y UI)
- Backend: **0 horas** (no requiere cambios)
- Testing: **1 hora** (3 escenarios: token válido, expirado, sin token)
- **Total: 3-4 horas**

---

## 📋 Checklist Pre-Implementación

Antes de ejecutar cambios, verificar:

- [ ] Confirmar que usuario quiere esta estrategia ("Always Show")
- [ ] Definir texto exacto del banner no bloqueante
- [ ] Decidir si mostrar "Última sincronización" (requiere query adicional o estado local)
- [ ] Validar manejo de primer uso (sin datos en BD)
- [ ] Confirmar colores/íconos de badges de estado sync

---

## 🔗 Archivos Clave para Siguiente Prompt

Si el usuario aprueba implementación:

**Frontend - Modificar:**
1. `node-version/client/src/pages/Tenpo.tsx` (líneas 59-67, 128-144, 529-565, 639-652)
2. `node-version/client/src/pages/ActualTenpo.tsx` (líneas 89-91, 233-240, 272-304)

**Backend - Opcional (mejora futura):**
3. `node-version/src/routes/tenpo.ts` (agregar endpoint `/sync/status`)

**Testing - Validar:**
4. Navegación: `/presupuesto/tenpo` y `/actual/tenpo`
5. Estados: token válido, token expirado, sin token, sin datos, con datos antiguos

---

**Fin del documento de auditoría.**
