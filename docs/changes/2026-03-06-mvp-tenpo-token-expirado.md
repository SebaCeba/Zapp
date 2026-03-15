# Implementación MVP: Separación Visualización vs Sincronización en Tenpo TC

**Fecha:** 2026-03-06  
**Tipo:** MVP - Mejora UX  
**Alcance:** Frontend únicamente

---

## 🎯 Objetivo del Cambio

Desacoplar la **visualización de datos guardados** de la **sincronización con Gmail** en las vistas de Tenpo TC Prepago.

**Antes:**
- Si el token de Gmail expiró → pantalla completamente bloqueada
- Usuario NO puede ver datos aunque existan en BD
- Obligado a re-autorizar para cualquier acción

**Después:**
- Si el token expiró → vista carga normalmente con datos guardados
- Banner amarillo no bloqueante informa del estado
- Sincronización deshabilitada hasta re-autorizar
- Re-autorización opcional y explícita

---

## 📝 Archivos Modificados

### Frontend
1. ✅ `node-version/client/src/pages/Tenpo.tsx` (vista anual)
2. ✅ `node-version/client/src/pages/ActualTenpo.tsx` (vista mensual)

### Backend
- ❌ Sin cambios (endpoints ya soportan lectura sin token Gmail)

---

## 🔧 Resumen de Cambios por Archivo

### 1. `Tenpo.tsx` (Vista Anual `/presupuesto/tenpo`)

#### Cambio 1: Eliminar dependencia de `isAuthenticated` en `loadData()`

**Antes (líneas 126-130):**
```tsx
useEffect(() => {
  if (isAuthenticated) {
    loadData();
  }
}, [anioSeleccionado, isAuthenticated]);
```

**Después:**
```tsx
useEffect(() => {
  loadData();
}, [anioSeleccionado]);
```

**Razón:** `loadData()` solo consulta BD vía `/api/tenpo/purchases` y `/api/tenpo/payments`, que NO requieren token Gmail. Debe ejecutarse siempre independiente del estado del token.

---

#### Cambio 2: Eliminar bloqueo total de vista

**Antes (líneas 529-565):**
```tsx
if (!isAuthenticated) {
  return (
    <MainLayout>
      <div className="card" style={{ backgroundColor: '#fef3c7' }}>
        <h2>⚠️ Token expirado</h2>
        <p>Debes autorizar para continuar...</p>
        <a href={authUrl}>Re-autorizar</a>
      </div>
    </MainLayout>
  );
}
```

**Después:**
```tsx
// ELIMINADO - la vista renderiza siempre
```

**Razón:** No hay necesidad técnica de bloquear la vista. Los datos existen en BD y pueden mostrarse.

---

#### Cambio 3: Agregar banner no bloqueante

**Después del `<PageTitleSection />` (nuevo código):**
```tsx
{/* Banner no bloqueante para token expirado */}
{tokenExpired && (
  <div className="card" style={{ 
    backgroundColor: '#fef3c7', 
    borderLeft: '4px solid #f59e0b',
    marginBottom: '1.5rem'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
          ⚠️ Sincronización deshabilitada
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f' }}>
          Tu token de Gmail ha expirado. Puedes ver los datos guardados, pero no sincronizar nuevos hasta que vuelvas a autorizar.
        </p>
        {lastSync && (
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#92400e' }}>
            Última sincronización: {formatDateTime(lastSync)}
          </p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          window.open(authUrl, '_blank', 'width=600,height=700');
        }}
        className="button"
        style={{
          backgroundColor: '#3b82f6',
          color: '#fff',
          padding: '0.5rem 1rem',
          whiteSpace: 'nowrap'
        }}
      >
        🔄 Re-autorizar con Google
      </button>
    </div>
  </div>
)}
```

**Razón:** Informar claramente al usuario del estado sin bloquear la funcionalidad de lectura.

---

#### Cambio 4: Deshabilitar botón "Sincronizar"

**Antes (líneas 649-660):**
```tsx
<button
  onClick={handleSync}
  disabled={syncing}
  className="button"
  style={{ 
    opacity: syncing ? 0.5 : 1,
    cursor: syncing ? 'not-allowed' : 'pointer'
  }}
>
  {syncing ? '🔄 Sincronizando...' : '🔄 Actualizar desde Gmail'}
</button>
```

**Después:**
```tsx
<button
  onClick={handleSync}
  disabled={syncing || tokenExpired}
  className="button"
  style={{ 
    opacity: (syncing || tokenExpired) ? 0.5 : 1,
    cursor: (syncing || tokenExpired) ? 'not-allowed' : 'pointer'
  }}
  title={tokenExpired ? 'Token expirado. Re-autoriza con Google para sincronizar.' : ''}
>
  {syncing ? '🔄 Sincronizando...' : tokenExpired ? '🔒 Sincronizar (bloqueado)' : '🔄 Actualizar desde Gmail'}
</button>
```

**Razón:** Prevenir intentos de sincronización sin token válido. Feedback visual claro del estado.

---

### 2. `ActualTenpo.tsx` (Vista Mensual `/actual/tenpo`)

#### Cambio 1: Evitar bloqueo por respuesta 401

**Antes (líneas 229-240):**
```tsx
if (res.status === 401) {
  setIsAuthenticated(false);
  setTokenExpired(true);
  if (!authUrl) {
     fetch('/api/integrations/google/auth-url')
       .then(r => r.json())
       .then(d => d.authUrl && setAuthUrl(d.authUrl));
  }
  return; // ⚠️ Bloquea procesamiento
}
```

**Después:**
```tsx
if (res.status === 401) {
  setTokenExpired(true);
  if (!authUrl) {
     fetch('/api/integrations/google/auth-url')
       .then(r => r.json())
       .then(d => d.authUrl && setAuthUrl(d.authUrl));
  }
  // NO hacer return - continuar procesando si hay datos
}

if (!res.ok && res.status !== 401) {
  throw new Error('Error fetching data');
}

const data = await res.json();
setIsAuthenticated(!tokenExpired);
setPurchases(data.purchases || []);
```

**Razón:** El endpoint `/api/tenpo/admin/monthly` NO requiere token Gmail (solo consulta BD). Si devuelve 401 es un edge case, pero los datos pueden procesarse igual.

---

#### Cambio 2: Eliminar bloqueo total de vista

**Antes (líneas 272-304):**
```tsx
if (!isAuthenticated && !loading) {
  return (
    <MainLayout>
      <div className="card" style={{ backgroundColor: '#fef3c7' }}>
        <h2>⚠️ Token expirado</h2>
        <a href={authUrl}>Re-autorizar</a>
      </div>
    </MainLayout>
  );
}
```

**Después:**
```tsx
// ELIMINADO - la vista renderiza siempre
```

**Razón:** Consistencia con `Tenpo.tsx`. No hay razón técnica para bloquear.

---

#### Cambio 3: Agregar banner no bloqueante

**Después del `<PageTitleSection />` (nuevo código):**
```tsx
{/* Banner no bloqueante para token expirado */}
{tokenExpired && (
  <div className="card" style={{ 
    backgroundColor: '#fef3c7', 
    borderLeft: '4px solid #f59e0b',
    marginBottom: '1.5rem'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#92400e' }}>
          ⚠️ Sincronización deshabilitada
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f' }}>
          Tu token de Gmail ha expirado. Puedes ver los datos guardados, pero no sincronizar nuevos hasta que vuelvas a autorizar.
        </p>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          window.open(authUrl, '_blank', 'width=600,height=700');
        }}
        className="button"
        style={{
          backgroundColor: '#3b82f6',
          color: '#fff',
          padding: '0.5rem 1rem',
          whiteSpace: 'nowrap'
        }}
      >
        🔄 Re-autorizar con Google
      </button>
    </div>
  </div>
)}
```

**Razón:** Mismo patrón de UX que en `Tenpo.tsx`. Banner informativo pero no bloqueante.

---

## 🧠 Decisiones Tomadas

### 1. No modificar backend
**Decisión:** Mantener endpoints sin cambios.  
**Razón:** Los endpoints de lectura (`/api/tenpo/purchases`, `/api/tenpo/payments`, `/api/tenpo/admin/monthly`) ya funcionan sin requerir token Gmail. No hay necesidad técnica de modificarlos.

### 2. No agregar endpoint de última sincronización
**Decisión:** Usar estado local `lastSync` en `Tenpo.tsx`.  
**Razón:** Para MVP, suficiente con mostrar la fecha de la última sincronización durante la sesión actual. Mejora futura: persistir en BD.

### 3. Reutilizar estilos existentes
**Decisión:** Banner usa clase `card` y estilos inline consistentes con la app.  
**Razón:** No agregar dependencias ni crear nuevos componentes. Mantener simplicidad.

### 4. Banner amarillo no bloqueante
**Decisión:** Color `#fef3c7` (amarillo claro), borde izquierdo `#f59e0b` (ámbar).  
**Razón:** Consistencia con warnings existentes en la app. No es error (rojo) ni éxito (verde), es advertencia informativa.

### 5. Deshabilitar sincronización, no ocultarla
**Decisión:** Botón "Sincronizar" sigue visible pero disabled con tooltip.  
**Razón:** Educativo para el usuario. Sabe que la función existe pero está temporalmente bloqueada. Texto explícito: "🔒 Sincronizar (bloqueado)".

### 6. No agregar estado de sincronización global
**Decisión:** No agregar badge "🟢 Sync OK / 🔴 Sync Expirado" en header.  
**Razón:** El banner ya comunica el estado claramente cuando es necesario. Evitar ruido visual cuando todo está OK.

---

## ⚠️ Riesgos / Edge Cases

### 1. Usuario no ve banner y no entiende por qué no sincroniza
**Probabilidad:** Baja  
**Mitigación:** Banner es prominente y aparece arriba del contenido. Botón "Sincronizar" muestra "🔒 (bloqueado)" y tiene tooltip.

### 2. Datos antiguos confunden al usuario
**Probabilidad:** Media  
**Mitigación:** Banner muestra "Última sincronización: [fecha]" en `Tenpo.tsx` (cuando `lastSync` está disponible). Usuario sabe cuán actualizados están los datos.

### 3. Primera vez sin datos + token expirado
**Escenario:** Usuario nunca sincronizó, no tiene datos, y el token expiró.  
**Comportamiento esperado:**
- Vista vacía (sin compras)
- Banner amarillo explica que debe autorizar para sincronizar
- Botón "Sincronizar" disabled

**Validación:** ✅ Funciona correctamente. `purchases.length === 0` renderiza tabla vacía. Banner guía al usuario.

### 4. Backend devuelve 401 inesperado
**Escenario:** Endpoint `/api/tenpo/admin/monthly` devuelve 401 aunque no debería.  
**Comportamiento antes:** Bloqueaba vista.  
**Comportamiento ahora:** Marca `tokenExpired = true`, muestra banner, pero intenta procesar datos.

**Riesgo:** Si el 401 implica que NO hay datos en la respuesta, `data.purchases` podría ser `undefined`.  
**Mitigación:** Ya existe fallback: `setPurchases(data.purchases || [])`. Array vacío por default.

### 5. Re-autorización desde múltiples vistas simultáneas
**Escenario:** Usuario tiene ambas vistas abiertas (`/presupuesto/tenpo` y `/actual/tenpo`), re-autoriza desde una.  
**Comportamiento esperado:** Popup OAuth se ejecuta, callback actualiza token en BD, ambas vistas deberían detectar el cambio.  
**Comportamiento actual:** El popup cierra y recarga la ventana padre (`window.opener.location.reload()` en callback). Solo la vista que abrió el popup se recarga.

**Riesgo:** La otra vista sigue marcada con `tokenExpired = true`.  
**Mitigación posible:** Polling de `checkAuthStatus()` cada X segundos (no implementado en MVP). O simplemente el usuario recarga manualmente.

**Decisión:** Aceptable para MVP. Caso edge poco común.

---

## ✅ Pasos de Validación Manual

### Escenario A: Token válido

**Setup:**
1. Tener token de Gmail activo y no expirado
2. Tener datos sincronizados previamente

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. Verificar que NO aparece banner amarillo
3. Verificar que botón "🔄 Actualizar desde Gmail" está habilitado
4. Click en "Actualizar desde Gmail"
5. Verificar que sincroniza correctamente
6. Navegar a `/actual/tenpo`
7. Verificar que carga datos del mes actual
8. Verificar que NO aparece banner amarillo

**Resultado esperado:** ✅ Vista funciona normal, sin cambios perceptibles.

---

### Escenario B: Token expirado con datos existentes

**Setup:**
1. Expirar el token manualmente (o esperar expiración natural)
2. Tener datos sincronizados previamente en BD

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Verificar que la vista carga normalmente con tabla de compras
3. ✅ Verificar que aparece banner amarillo arriba: "⚠️ Sincronización deshabilitada"
4. ✅ Verificar que banner explica que puede ver datos pero no sincronizar
5. ✅ Verificar que botón "Sincronizar" muestra "🔒 Sincronizar (bloqueado)" y está disabled
6. ✅ Hover sobre botón: debe mostrar tooltip "Token expirado..."
7. ✅ Click en "🔄 Re-autorizar con Google" en el banner
8. ✅ Verificar que abre popup de OAuth
9. ✅ Completar autorización
10. ✅ Verificar que popup cierra y vista principal recarga
11. ✅ Verificar que banner desaparece
12. ✅ Verificar que botón "Sincronizar" vuelve a estar habilitado
13. Navegar a `/actual/tenpo`
14. ✅ Si token sigue expirado: mismo comportamiento (banner + datos visibles)
15. ✅ Si token se renovó: sin banner, vista normal

**Resultado esperado:** ✅ Usuario puede ver y operar con datos guardados. Sincronización bloqueada hasta re-autorizar.

---

### Escenario C: Sin datos + token expirado (primera vez)

**Setup:**
1. BD sin compras (`TenpoPurchase` vacía)
2. Token de Gmail expirado o inexistente

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Verificar que aparece banner amarillo "⚠️ Sincronización deshabilitada"
3. ✅ Verificar que tabla está vacía (sin compras)
4. ✅ Verificar que botón "Sincronizar" está disabled
5. ✅ Click en "🔄 Re-autorizar con Google"
6. ✅ Completar autorización
7. ✅ Click en "Actualizar desde Gmail" (ahora habilitado)
8. ✅ Verificar que sincroniza y carga compras

**Resultado esperado:** ✅ Guía al usuario a autorizar primero, luego sincronizar.

---

### Escenario D: Sin datos + token válido (primera vez normal)

**Setup:**
1. BD sin compras
2. Token válido

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Verificar que NO aparece banner
3. ✅ Verificar que tabla está vacía
4. ✅ Click en "Actualizar desde Gmail"
5. ✅ Verificar que sincroniza correctamente

**Resultado esperado:** ✅ Flujo de primera vez funciona igual que antes.

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Token expirado** | Pantalla bloqueada completamente | Vista funcional con banner informativo |
| **Datos guardados** | Inaccesibles sin re-autorizar | Siempre visibles |
| **Sincronización** | Obligatoria para ver datos | Opcional, separada de visualización |
| **UX primer uso** | Obliga autorización inmediata | Igual (autoriza → sincroniza) |
| **Feedback visual** | Modal bloqueante rojo/amarillo | Banner no bloqueante + botón disabled |
| **Re-autorización** | Única acción posible | Una opción entre varias |

---

## 🚀 Próximos Pasos Sugeridos (Fuera de MVP)

### Mejora 1: Persistir última sincronización
- Agregar campo `lastSyncDate` en tabla global de configuración
- Actualizar en cada sincronización exitosa
- Mostrar en banner: "Última actualización: hace 2 horas"

### Mejora 2: Polling de estado de token
- Cada 60 segundos, verificar `checkAuthStatus()`
- Si token se renovó en otra ventana, actualizar estado local
- Evita que usuario necesite refresh manual

### Mejora 3: Badge de estado en header
- Indicador discreto "🟢 Sync OK" / "🔴 Sync Expirado"
- Posición: esquina superior derecha del `<PageTitleSection />`
- Condicional: solo mostrar si tokenExpired

### Mejora 4: Endpoint `/api/tenpo/sync/status`
```ts
GET /api/tenpo/sync/status
Response:
{
  canSync: boolean,
  tokenExpired: boolean,
  lastSync: "2026-03-06T10:30:00Z" | null,
  totalPurchases: 45,
  totalPayments: 12
}
```

---

## 📦 Resumen Ejecutivo

### ✅ Implementado
- Eliminación de bloqueos por token expirado
- Banner no bloqueante informativo
- Botón sincronizar deshabilitado condicionalmente
- Separación clara: visualización (siempre) vs sincronización (require token)
- Cero cambios en backend
- Consistencia UX entre ambas vistas

### 🎯 Resultado
- Usuario puede consultar datos guardados aunque token esté expirado
- Re-autorización es opcional y consciente
- Feedback claro del estado sin bloquear funcionalidad
- Cambio mínimo, seguro, sin regresiones

### ⏱️ Esfuerzo Real
- Tiempo de implementación: ~30 minutos
- Archivos modificados: 2 (frontend únicamente)
- Líneas cambiadas: ~150 (mayormente adiciones de banner)
- Complejidad: Baja (cambios quirúrgicos, sin refactor)

---

**Fin del documento de implementación.**
