# Implementación: Estado Reusable de Sincronización Gmail (GmailSyncStatus)

**Fecha:** 2026-03-06  
**Tipo:** Abstracción reutilizable + Componente visual  
**Alcance:** Frontend - Framework reusable para integraciones Gmail

---

## 🎯 Objetivo

Crear una abstracción reutilizable para el estado de sincronización Gmail que pueda ser usada en **cualquier integración basada en Gmail**, no solo en Tenpo TC.

### Por qué genérico para Gmail y no específico de Tenpo

**Motivación:**
- Actualmente existen múltiples flujos que leen emails de Gmail (Tenpo, Servicios Básicos, potenciales futuras integraciones)
- Todas estas integraciones comparten el mismo problema: estado de autenticación OAuth con Gmail
- El token es global para la app (una sola autenticación Gmail sirve para todas las integraciones)
- Duplicar lógica de estado y UI en cada integración genera:
  - Código redundante
  - Inconsistencia visual
  - Mayor riesgo de bugs
  - Dificultad de mantenimiento

**Solución:**
- Definir un modelo de estado normalizado que cualquier integración pueda usar
- Crear un componente visual reusable que se adapte al contexto
- Permitir extensibilidad sin reescribir lógica base

---

## 📊 Estados Definidos

### Set mínimo para MVP: 4 estados

```typescript
type GmailSyncStatus = 
  | 'ok'           // Token válido, puede sincronizar
  | 'expired'      // Token expirado, necesita re-autorización
  | 'error'        // Error de conexión o API
  | 'unavailable'; // No hay token (primera vez)
```

### Por qué estos 4 estados

| Estado | Cuándo se usa | Acción del usuario | Feedback visual |
|--------|---------------|-------------------|-----------------|
| **ok** | Token válido y no expirado | Puede sincronizar normalmente | Sin banner (todo OK) |
| **expired** | Token expiró (revocado o tiempo) | Debe re-autorizar con Google | Banner amarillo warning |
| **unavailable** | Nunca se autenticó o token eliminado | Debe autorizar por primera vez | Banner azul info |
| **error** | Fallo de red o API al verificar | Reintentar o contactar soporte | Banner rojo error |

**Estados descartados:**
- `never_synced`: No aporta valor funcional diferenciado de `unavailable`. Ambos requieren autorización.
- `syncing`: Es estado de UI local, no de integración global. Cada vista maneja su propio spinner.
- `partial`: Complejiza sin beneficio claro en MVP. Si hay datos parciales, es responsabilidad del componente específico.

---

## 📁 Archivos Modificados

### Archivos Nuevos Creados

1. ✅ `node-version/client/src/types/gmailIntegration.ts`
   - Tipos y helpers reusables para integraciones Gmail

2. ✅ `node-version/client/src/components/common/GmailSyncStatusBanner.tsx`
   - Componente visual reusable para mostrar estado de sincronización

### Archivos Modificados

3. ✅ `node-version/client/src/pages/Tenpo.tsx`
   - Implementación del nuevo componente

4. ✅ `node-version/client/src/pages/ActualTenpo.tsx`
   - Implementación del nuevo componente

---

## 🔧 Cambios por Archivo

### 1. `types/gmailIntegration.ts` (NUEVO)

**Propósito:** Definir tipos y helpers para normalizar estados de integración Gmail.

**Contenido:**

```typescript
// Tipo principal de estado normalizado
export type GmailSyncStatus = 'ok' | 'expired' | 'error' | 'unavailable';

// Estado completo de integración
export interface GmailIntegrationState {
  status: GmailSyncStatus;
  canSync: boolean;
  lastSync?: Date | null;
  errorMessage?: string;
}

// Response del backend /api/integrations/google/status
export interface GmailAuthStatusResponse {
  authenticated: boolean;
  tokenExpired: boolean;
  expiryDate: Date | null;
}

// Mapper: backend response → estado normalizado
export function mapGmailAuthStatus(...)

// Mapper legacy: para migración gradual desde estados booleanos
export function mapLegacyAuthState(...)
```

**Decisiones de diseño:**
- **Separación clara:** Tipos de backend vs tipos de frontend normalizados
- **Mapper explícito:** No hay conversión mágica, siempre se pasa por `mapGmailAuthStatus()`
- **Legacy mapper:** Permite migración gradual sin romper código existente
- **Extensibilidad:** Fácil agregar nuevos estados si se necesita

---

### 2. `components/common/GmailSyncStatusBanner.tsx` (NUEVO)

**Propósito:** Componente visual reusable para mostrar estado de integración Gmail.

**Interfaz:**

```typescript
interface GmailSyncStatusBannerProps {
  status: GmailSyncStatus;
  serviceName: string;        // "Tenpo TC", "Servicios Básicos", etc.
  lastSync?: Date | null;
  onReauthorize?: () => void;
  className?: string;
  style?: React.CSSProperties;
}
```

**Características:**
- ✅ **No renderiza nada si `status === 'ok'`** (banner solo para estados problemas)
- ✅ **Adapta mensaje según el servicio:** usa prop `serviceName` dinámicamente
- ✅ **Usa RSuite `Message`:** consistencia con componentes existentes
- ✅ **Colores semánticos:**
  - `warning` (amarillo) para `expired`
  - `info` (azul) para `unavailable`
  - `error` (rojo) para `error`
- ✅ **Botón de acción:** solo aparece si `onReauthorize` está definido y el estado lo requiere
- ✅ **Muestra última sincronización:** si `lastSync` está disponible
- ✅ **Sin referencias a Tenpo:** 100% genérico, puede usarse en cualquier integración

**Ejemplo de uso:**

```tsx
<GmailSyncStatusBanner
  status="expired"
  serviceName="Tenpo TC"
  lastSync={lastSyncDate}
  onReauthorize={() => window.open(authUrl, '_blank')}
/>
```

**Decisiones de diseño:**
- **Componente controlado:** recibe estado por props, no maneja estado interno
- **Responsabilidad única:** solo mostrar, no decidir lógica de autorización
- **Extensible:** props opcionales permiten customización sin cambiar API

---

### 3. `pages/Tenpo.tsx`

**Cambios realizados:**

#### Cambio 1: Agregar imports

```tsx
import GmailSyncStatusBanner from '../components/common/GmailSyncStatusBanner';
import { mapLegacyAuthState } from '../types/gmailIntegration';
```

#### Cambio 2: Reemplazar banner custom por componente reusable

**Antes (50+ líneas de código inline):**
```tsx
{tokenExpired && (
  <div className="card" style={{ 
    backgroundColor: '#fef3c7', 
    borderLeft: '4px solid #f59e0b',
    marginBottom: '1.5rem'
  }}>
    <div style={{ display: 'flex', ... }}>
      {/* ... 45 líneas más de JSX hardcodeado ... */}
    </div>
  </div>
)}
```

**Después (5 líneas):**
```tsx
<GmailSyncStatusBanner
  status={mapLegacyAuthState(tokenExpired, !!authUrl, lastSync).status}
  serviceName="Tenpo TC"
  lastSync={lastSync}
  onReauthorize={() => window.open(authUrl, '_blank', 'width=600,height=700')}
/>
```

**Beneficios:**
- ✅ Reducción de ~45 líneas de código duplicado
- ✅ Lógica de presentación centralizada
- ✅ Fácil de testear
- ✅ Reutilizable en otras vistas

---

### 4. `pages/ActualTenpo.tsx`

**Cambios realizados:**

#### Cambio 1: Agregar imports

```tsx
import GmailSyncStatusBanner from '../components/common/GmailSyncStatusBanner';
import { mapLegacyAuthState } from '../types/gmailIntegration';
```

#### Cambio 2: Reemplazar banner custom por componente reusable

**Antes (40+ líneas):**
```tsx
{tokenExpired && (
  <div className="card" style={{ ... }}>
    {/* ... banner custom ... */}
  </div>
)}
```

**Después (5 líneas):**
```tsx
<GmailSyncStatusBanner
  status={mapLegacyAuthState(tokenExpired, !!authUrl, null).status}
  serviceName="Tenpo TC"
  onReauthorize={() => window.open(authUrl, '_blank', 'width=600,height=700')}
/>
```

**Nota:** No se pasa `lastSync` porque `ActualTenpo` no trackea sincronización (solo carga datos del mes).

---

## 🧠 Decisiones de Diseño

### 1. Usar `mapLegacyAuthState` en lugar de `mapGmailAuthStatus`

**Decisión:** Para MVP, usar el mapper legacy que toma booleanos (`tokenExpired`, `hasAuthUrl`).

**Razón:**
- Las vistas actuales aún usan estado booleano disperso
- Cambiar todo el flujo de estado requeriría modificar `checkAuthStatus()`
- El mapper legacy permite migración gradual sin romper nada
- Futuro: cuando se centralice el estado de auth, migrar a `mapGmailAuthStatus`

**Trade-off aceptado:** Un poco menos elegante, pero seguro y no invasivo.

---

### 2. No agregar estado global de autenticación

**Decisión:** Mantener estado de auth (`tokenExpired`, `authUrl`) local en cada vista.

**Razón:**
- Agregar Context API o Redux para un solo estado es over-engineering
- Las vistas ya tienen lógica de `checkAuthStatus()` que funciona
- El componente `GmailSyncStatusBanner` es stateless, solo recibe props
- Futuro: si más vistas necesitan compartir estado, considerar Context

**Trade-off aceptado:** Duplicación de `checkAuthStatus()` en cada vista. Refactor futuro si se vuelve problemático.

---

### 3. Banner solo muestra si `status !== 'ok'`

**Decisión:** No mostrar banner verde "✅ Todo OK" cuando la sincronización funciona.

**Razón:**
- Reduce ruido visual
- Usuario asume que si no hay aviso, todo está bien
- Consistente con patrones UX estándar (solo mostrar problemas)
- Si se necesita feedback positivo, usar toast al sincronizar

**Alternativa considerada:** Mostrar badge "🟢 Sync OK" en header. Rechazada por ruido visual.

---

### 4. Usar RSuite `Message` en lugar de crearcustom alert

**Decisión:** Aprovechar componente existente de RSuite.

**Razón:**
- Ya está disponible en el proyecto
- Consistencia visual automática
- Soporta tipos semánticos (`warning`, `info`, `error`)
- Ahorra tiempo de desarrollo
- Evita crear nuevos estilos custom

---

### 5. Props opcionales para extensibilidad

**Decisión:** `lastSync`, `onReauthorize`, `className`, `style` son opcionales.

**Razón:**
- No todas las vistas trackean `lastSync` (ej: ActualTenpo)
- No siempre se quiere botón de acción (ej: vista solo lectura)
- Permite styling custom sin modificar componente base
- Componente funciona con mínimo de props: `status` y `serviceName`

---

## 🔄 Cómo Reutilizarlo en Integraciones por Etiquetas Gmail

### Ejemplo: Servicios Básicos (basado en etiquetas)

**Contexto:** Lee emails de "Utilidades/Aguas Andinas", "Utilidades/CGE", etc.

**Implementación:**

```tsx
// En ConfigServiciosBasicos.tsx
import GmailSyncStatusBanner from '../components/common/GmailSyncStatusBanner';
import { mapLegacyAuthState } from '../types/gmailIntegration';

function ConfigServiciosBasicos() {
  const [tokenExpired, setTokenExpired] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [lastImportDate, setLastImportDate] = useState<Date | null>(null);

  // ... checkAuthStatus() igual que Tenpo ...

  return (
    <MainLayout>
      <PageTitleSection title="Servicios Básicos" />
      
      {/* Banner reusable */}
      <GmailSyncStatusBanner
        status={mapLegacyAuthState(tokenExpired, !!authUrl, lastImportDate).status}
        serviceName="Servicios Básicos"
        lastSync={lastImportDate}
        onReauthorize={() => window.open(authUrl, '_blank')}
      />

      {/* ... resto del contenido ... */}
    </MainLayout>
  );
}
```

**Sin cambios en el componente:** Solo cambia el `serviceName` y la fecha de última sincronización.

---

### Ejemplo: Nueva integración Gmail personalizada

**Contexto:** Lee emails de etiqueta "Facturas/Proveedor X"

```tsx
<GmailSyncStatusBanner
  status={mapLegacyAuthState(tokenExpired, !!authUrl, lastFetch).status}
  serviceName="Facturas de Proveedor X"
  lastSync={lastFetch}
  onReauthorize={handleReauth}
/>
```

**Zero modificaciones necesarias.** El componente es 100% reutilizable.

---

## ⚠️ Riesgos / Límites del MVP

### 1. Mapper legacy no es la solución ideal

**Riesgo:** El uso de `mapLegacyAuthState` con booleanos dispersos es temporal.

**Mitigación:** Documentado como `@deprecated`. Migrar a `mapGmailAuthStatus` cuando se centralice el estado.

**Impacto:** Bajo - funciona correctamente, solo no es la arquitectura final.

---

### 2. Sin polling de estado de token

**Riesgo:** Si el token se renueva en otra ventana/tab, la vista actual no lo detecta.

**Ejemplo:** Usuario tiene `/presupuesto/tenpo` y `/actual/tenpo` abiertos. Re-autoriza desde una. La otra sigue mostrando "expirado" hasta refresh manual.

**Mitigación futura:** Implementar polling cada 60 segundos de `checkAuthStatus()`.

**Decisión MVP:** Aceptable. Caso edge poco común. Usuario puede refrescar manualmente.

---

### 3. Estado de autenticación duplicado en cada vista

**Riesgo:** Código duplicado de `checkAuthStatus()`, `tokenExpired`, `authUrl` en múltiples vistas.

**Mitigación futura:** Context API o custom hook `useGmailAuth()`.

**Decisión MVP:** Aceptable. Poca duplicación, refactor fácil después si se necesita.

---

### 4. Componente no maneja retry automático

**Riesgo:** Si hay error de red al verificar token, el usuario debe refrescar manualmente.

**Mitigación futura:** Botón "Reintentar" en banner de error.

**Decisión MVP:** Estado `error` existe pero no se dispara actualmente (el `catch` en `checkAuthStatus()` solo loguea). Implementar si se vuelve necesario.

---

### 5. Sin soporte para múltiples tokens Gmail

**Riesgo:** Si en el futuro se quisiera soportar múltiples cuentas Gmail, este modelo no lo soporta.

**Limitación:** El backend actual (`GoogleAuthToken`) solo almacena un token global.

**Mitigación:** Fuera de alcance de MVP. Rediseño mayor si se requiere.

---

## ✅ Validación Manual

### Escenario A: Gmail OK en Tenpo

**Setup:**
1. Token Gmail válido y no expirado
2. Datos sincronizados previamente

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Verificar que NO aparece banner (estado `ok`)
3. ✅ Botón "Actualizar desde Gmail" habilitado
4. Navegar a `/actual/tenpo`
5. ✅ Verificar que NO aparece banner

**Resultado esperado:** Sin banner, UI limpia, funcionalidad normal.

---

### Escenario B: Gmail expirado en Tenpo con datos existentes

**Setup:**
1. Token expirado o revocado
2. Datos históricos en BD

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Verificar que aparece banner amarillo: "⚠️ Sincronización deshabilitada"
3. ✅ Banner menciona "Tenpo TC" (serviceName dinámico)
4. ✅ Banner muestra "Última sincronización: [fecha]" si disponible
5. ✅ Botón "🔄 Re-autorizar con Google" visible
6. ✅ Click en botón abre popup OAuth
7. ✅ Completar autorización
8. ✅ Banner desaparece después de reload
9. Navegar a `/actual/tenpo`
10. ✅ Mismo comportamiento (banner amarillo + datos visibles)

**Resultado esperado:** Banner informativo pero no bloqueante. Datos visibles.

---

### Escenario C: Gmail expirado sin datos

**Setup:**
1. BD vacía (sin compras)
2. Token expirado

**Pasos:**
1. Navegar a `/presupuesto/tenpo`
2. ✅ Banner amarillo aparece
3. ✅ Tabla vacía (sin compras)
4. ✅ Botón "Sincronizar" disabled
5. ✅ Click en "Re-autorizar"
6. ✅ Completar OAuth
7. ✅ Banner desaparece
8. ✅ Click en "Actualizar desde Gmail"
9. ✅ Sincroniza y carga datos

**Resultado esperado:** Guía clara al usuario (autorizar → sincronizar).

---

### Escenario D: Componente reusable no tiene texto hardcodeado

**Validación de código:**

1. ✅ Abrir `GmailSyncStatusBanner.tsx`
2. ✅ Buscar menciones de "Tenpo" → **0 resultados**
3. ✅ Buscar hardcoded service names → **0 resultados**
4. ✅ Verificar que usa `{serviceName}` dinámicamente → **✓ Confirmado**
5. ✅ Props permiten customización completa → **✓ Confirmado**

**Resultado esperado:** Componente 100% genérico y reusable.

---

### Escenario E: Estructura permite reutilización en etiquetas Gmail

**Validación conceptual:**

1. ✅ ¿El componente asume que es Tenpo? **NO**
2. ✅ ¿El componente asume formato específico de datos? **NO**
3. ✅ ¿El componente puede recibir diferentes `serviceName`? **SÍ**
4. ✅ ¿El mapper funciona para cualquier estado de autenticación Gmail? **SÍ**
5. ✅ ¿Puedo usarlo en ConfigServiciosBasicos sin modificar código? **SÍ**

**Resultado esperado:** Arquitectura permite extensión sin modificación (Open/Closed Principle).

---

## 📊 Comparación Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas de código UI** | ~50 líneas x 2 vistas = 100 | ~5 líneas x 2 vistas = 10 |
| **Duplicación de lógica** | Banner custom en cada vista | Componente reusable centralizado |
| **Extensibilidad** | Copiar/pegar banner cada vez | Import + 5 líneas |
| **Testabilidad** | Difícil (lógica inline) | Fácil (componente aislado) |
| **Consistencia visual** | Mantenida manualmente | Automática |
| **Mantenimiento** | Cambio requiere tocar N vistas | Cambio en 1 lugar |
| **Lógica de estado** | Booleanos dispersos | Tipo normalizado |
| **Reutilización otras integraciones** | No preparado | 100% listo |

---

## 🚀 Próximos Pasos Sugeridos (Fuera de MVP)

### Mejora 1: Migrar a `mapGmailAuthStatus` oficial

**Acción:**
1. Modificar `checkAuthStatus()` para guardar response completo del backend
2. Reemplazar `tokenExpired` booleano por `GmailIntegrationState` completo
3. Actualizar componente para usar `mapGmailAuthStatus()`

**Beneficio:** Estado más robusto y type-safe.

---

### Mejora 2: Context API para estado compartido

**Acción:**
1. Crear `GmailAuthContext`
2. Provider en `App.tsx`
3. Hook `useGmailAuth()` para acceder al estado
4. Eliminar duplicación de `checkAuthStatus()` en cada vista

**Beneficio:** DRY, estado sincronizado entre vistas.

---

### Mejora 3: Implementar polling de token

**Acción:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    checkAuthStatus(); // Refrescar cada 60s
  }, 60000);
  return () => clearInterval(interval);
}, []);
```

**Beneficio:** Detecta renovación de token en otras ventanas.

---

### Mejora 4: Manejo de estado `error`

**Acción:**
1. Modificar `checkAuthStatus()` para setear `status: 'error'` en catch
2. Banner mostrar botón "Reintentar"
3. Log de errores a servicio de monitoreo

**Beneficio:** Mejor debugging y UX ante fallos de red.

---

### Mejora 5: Usar en ConfigServiciosBasicos

**Acción:**
1. Importar `GmailSyncStatusBanner` y `mapLegacyAuthState`
2. Reemplazar banner actual
3. Validar que funciona con etiquetas Gmail

**Beneficio:** Demuestra reutilización real del componente.

---

## 📦 Resumen Ejecutivo

### ✅ Creado
- Tipo normalizado `GmailSyncStatus` con 4 estados (`ok`, `expired`, `error`, `unavailable`)
- Interface `GmailIntegrationState` para estado completo
- Mappers: `mapGmailAuthStatus` (ideal) y `mapLegacyAuthState` (migración gradual)
- Componente `<GmailSyncStatusBanner />` 100% reusable y genérico
- Implementación en Tenpo.tsx y ActualTenpo.tsx

### 🎯 Resultado
- Reducción de ~90 líneas de código duplicado
- Base extensible para cualquier integración Gmail (etiquetas, parsing, etc.)
- Mantiene funcionalidad existente sin regresiones
- UI consistente y mantenible
- Zero dependencias nuevas (usa RSuite existente)

### ⏱️ Esfuerzo Real
- Tiempo de implementación: ~45 minutos
- Archivos nuevos: 2 (types + componente)
- Archivos modificados: 2 (vistas Tenpo)
- Complejidad: Media-baja (abstracción simple, sin over-engineering)

### 🔮 Reutilización Futura
- ✅ ConfigServiciosBasicos (etiquetas Gmail)
- ✅ Cualquier integración basada en Gmail OAuth
- ✅ Extensible a otras APIs con patrón similar (token + sync)

---

**Fin del documento de implementación.**
