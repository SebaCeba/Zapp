# Auditoría de Routing - Configuración TC

**Fecha:** 2026-02-01  
**Autor:** Frontend Architect  
**Estado:** DIAGNÓSTICO COMPLETO

---

## 1. Resumen Ejecutivo

**CAUSA RAÍZ IDENTIFICADA:** PATH MISMATCH

El botón "Configurar Tasa" en la página Tenpo navega a `/presupuesto/tenpo/config` (TenpoConfig - gestión de tasas de interés), pero la nueva página ConfiguracionTC está registrada en `/configuracion-tc/:tcKey` (gestión de ciclos de facturación).

**Son dos funcionalidades diferentes que coexisten:**
- **TenpoConfig:** Configuración de tasas de interés mensuales (CAE, tasa mensual)
- **ConfiguracionTC:** Configuración de ciclos de facturación (closingDay, dueDay, overrides)

**Estado actual:** La página ConfiguracionTC existe, está correctamente registrada, pero NO tiene ningún botón de navegación desde la UI principal.

---

## 2. Archivos Revisados

### 2.1. Routing Core
- ✅ `node-version/client/src/main.tsx` → Renderiza `<Router />` correctamente
- ✅ `node-version/client/src/router.tsx` → Define todas las rutas (flat structure, sin anidación)
- ✅ `node-version/client/src/App.tsx` → Solo usado para `/app` (suscripciones), no afecta routing global

### 2.2. Layouts
- ✅ `node-version/client/src/layout/MainLayout.tsx` → Wrapper simple con Sidebar + children
- ✅ `node-version/client/src/components/Sidebar.tsx` → Contiene enlaces principales

### 2.3. Páginas Tenpo
- ✅ `node-version/client/src/pages/Tenpo.tsx` → Página principal de TC Tenpo
- ✅ `node-version/client/src/pages/TenpoConfig.tsx` → Configuración de tasas de interés
- ✅ `node-version/client/src/pages/ConfiguracionTC.tsx` → Nueva página de ciclos de facturación

### 2.4. Componentes ConfiguracionTC
- ✅ `node-version/client/src/components/TcConfigForm.tsx`
- ✅ `node-version/client/src/components/TcAnnualCyclesTable.tsx`
- ✅ `node-version/client/src/components/TcOverridesTable.tsx`
- ✅ `node-version/client/src/components/TcRecalculationPanel.tsx`

### 2.5. API y Tipos
- ✅ `node-version/client/src/api/tcBillingApi.ts`
- ✅ `node-version/client/src/types/tcBilling.ts`

---

## 3. Análisis de Routing

### 3.1. Rutas Registradas (router.tsx)

```tsx
<Route path="/" element={<Home />} />
<Route path="/presupuesto" element={<Presupuesto />} />
<Route path="/actual" element={<Actual />} />
<Route path="/app" element={<App />} />
<Route path="/creditos" element={<Creditos />} />
<Route path="/hipotecario" element={<Hipotecario />} />
<Route path="/servicios-basicos" element={<ServiciosBasicos />} />
<Route path="/ingresos" element={<Ingresos />} />
<Route path="/supermercado" element={<Supermercado />} />
<Route path="/presupuesto/tenpo" element={<Tenpo />} />
<Route path="/presupuesto/tenpo/config" element={<TenpoConfig />} />
<Route path="/configuracion-tc/:tcKey" element={<ConfiguracionTC />} />  ← REGISTRADA
```

**Conclusión:** ✅ Ruta `/configuracion-tc/:tcKey` está correctamente registrada en router.tsx

### 3.2. Layout Structure

**Estructura actual:** FLAT (sin anidación)
- Todas las rutas están al mismo nivel en `<Routes>`
- No hay `<Route>` wrapper con outlet
- No hay guards ni redirects
- Cada página importa MainLayout individualmente

**Conclusión:** ✅ No hay layout bloqueando la navegación. ConfiguracionTC puede renderizar MainLayout internamente si lo necesita.

### 3.3. Navegación desde Tenpo.tsx

**Botón encontrado (línea 649):**
```tsx
<button
  onClick={() => navigate('/presupuesto/tenpo/config')}
  style={{...}}
>
  ⚙️ Configurar Tasa
</button>
```

**Destino actual:** `/presupuesto/tenpo/config` → `TenpoConfig` (configuración de tasas)

**Destino esperado (según docs):** `/configuracion-tc/TC_TENPO` → `ConfiguracionTC` (ciclos de facturación)

**Conclusión:** ❌ PATH MISMATCH - El botón navega a la página equivocada

---

## 4. Análisis de Componentes

### 4.1. ConfiguracionTC.tsx

**Import:**
```tsx
import ConfiguracionTC from './pages/ConfiguracionTC';  // ✅ Correcto en router.tsx línea 12
```

**Export:**
```tsx
export default function ConfiguracionTC() { ... }  // ✅ Default export correcto
```

**Errores de TypeScript detectados:**
1. ❌ `import React` no usado (warning menor)
2. ❌ Prop mismatch en TcConfigForm: usa `onUpdate` pero el componente espera `onSave`
3. ⚠️ CSS Module importado pero archivo existe (puede ser false positive de IDE)

**Renderización:** Componente tiene lógica completa, pero props incorrectas causarán errores en runtime.

### 4.2. TcConfigForm.tsx

**Props esperadas (línea 5-9):**
```tsx
interface TcConfigFormProps {
  tcKey: string;
  onSave: () => void;        ← Espera onSave
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}
```

**Props recibidas desde ConfiguracionTC.tsx (línea 104):**
```tsx
<TcConfigForm
  tcKey={tcKey}
  onUpdate={handleConfigUpdate}  ← Envía onUpdate
  onError={showError}
/>
```

**Conclusión:** ❌ PROP MISMATCH - ConfiguracionTC usa `onUpdate` pero TcConfigForm espera `onSave` + `onSuccess`

---

## 5. Análisis de Navegación

### 5.1. Sidebar.tsx

**Enlaces disponibles:**
```tsx
{ label: 'Tenpo TC', href: '/presupuesto/tenpo' }
```

**Conclusión:** ❌ No existe enlace a `/configuracion-tc/:tcKey` en el sidebar

### 5.2. Acceso Manual

**URL esperada:** `http://localhost:5173/configuracion-tc/TC_TENPO`

**Test teórico:** Si el usuario ingresa esta URL manualmente:
1. ✅ Router encontrará la ruta (está registrada)
2. ⚠️ ConfiguracionTC se renderizará
3. ❌ TcConfigForm fallará por prop mismatch
4. ❌ CSS Module puede causar error si no está compilado

**Conclusión:** La página es accesible por URL directa, pero tendrá errores de runtime.

---

## 6. Diferencias entre TenpoConfig y ConfiguracionTC

| Aspecto | TenpoConfig | ConfiguracionTC |
|---------|-------------|-----------------|
| **Ruta** | `/presupuesto/tenpo/config` | `/configuracion-tc/:tcKey` |
| **Funcionalidad** | Gestión de tasas de interés (CAE, tasa mensual) | Gestión de ciclos de facturación (closingDay, dueDay) |
| **Parámetro** | - | `:tcKey` (ej: TC_TENPO) |
| **Botón acceso** | ✅ "Configurar Tasa" en Tenpo.tsx | ❌ No existe botón |
| **Backend API** | `/api/tenpo/config/tasa` | `/api/tc-billing/*` |
| **Estado** | ✅ Funcional y en uso | ⚠️ Implementada pero no accesible desde UI |

---

## 7. Diagnóstico Final

### 7.1. Causas Identificadas

1. **PRINCIPAL: No hay navegación hacia ConfiguracionTC**
   - Ningún botón en la UI apunta a `/configuracion-tc/:tcKey`
   - El botón "Configurar Tasa" apunta a TenpoConfig (funcionalidad diferente)
   - No existe enlace en Sidebar

2. **BLOQUEANTE: Prop mismatch en TcConfigForm**
   - ConfiguracionTC pasa `onUpdate` pero componente espera `onSave` + `onSuccess`
   - Causará error en runtime si se accede a la página

3. **MENOR: CSS Module path**
   - Error de compilación por CSS Module no encontrado (puede ser false positive)

4. **ARQUITECTURA: Dos sistemas coexisten**
   - TenpoConfig (tasas) y ConfiguracionTC (ciclos) son independientes
   - Ambos son necesarios, no se reemplazan entre sí

### 7.2. Ruta NO está bloqueada por:
- ❌ Layout incorrecto (no hay anidación que bloquee)
- ❌ Guards o redirects (no existen)
- ❌ Falta de registro de ruta (está registrada en router.tsx línea 30)
- ❌ Problema de import/export (import es correcto)

---

## 8. Recomendaciones de Fix

### 8.1. Fix Inmediato (Bloquea renderización)

**Archivo:** `node-version/client/src/pages/ConfiguracionTC.tsx`

**Cambio:** Ajustar props de TcConfigForm
```tsx
// ANTES:
<TcConfigForm
  tcKey={tcKey}
  onUpdate={handleConfigUpdate}
  onError={showError}
/>

// DESPUÉS:
<TcConfigForm
  tcKey={tcKey}
  onSave={handleConfigUpdate}
  onError={showError}
  onSuccess={showSuccess}
/>
```

### 8.2. Fix de Acceso (Permite navegar)

**Opción A: Agregar botón en Tenpo.tsx**

Agregar botón separado junto a "Configurar Tasa":
```tsx
<button onClick={() => navigate('/configuracion-tc/TC_TENPO')}>
  📅 Ciclos de Facturación
</button>
```

**Opción B: Agregar enlace en Sidebar.tsx**

Agregar entrada en array de enlaces:
```tsx
{ label: 'Config TC', href: '/configuracion-tc/TC_TENPO' }
```

**Opción C: Tab en TenpoConfig**

Convertir TenpoConfig en página con tabs:
- Tab 1: Tasas de Interés (actual)
- Tab 2: Ciclos de Facturación (nuevo)

### 8.3. Fix de CSS Module (Menor)

Verificar que archivo existe:
- `node-version/client/src/pages/ConfiguracionTC.module.css`

Si no existe, mover desde ubicación actual o quitar import y usar inline styles.

### 8.4. Validación Post-Fix

Después de aplicar fixes, verificar:
1. ✅ Navegación desde UI llega a ConfiguracionTC
2. ✅ Página renderiza sin errores de props
3. ✅ Formulario guarda correctamente
4. ✅ Tabs funcionan
5. ✅ Recalculación se ejecuta

---

## 9. Priorización

| Fix | Prioridad | Bloquea funcionalidad | Esfuerzo |
|-----|-----------|----------------------|----------|
| Prop mismatch TcConfigForm | 🔴 CRÍTICO | SÍ (runtime error) | 2 min |
| Agregar navegación UI | 🟠 ALTA | SÍ (no accesible) | 5 min |
| CSS Module path | 🟡 MEDIA | Parcial (puede romper styles) | 1 min |
| Documentar coexistencia | 🟢 BAJA | NO | 10 min |

---

## 10. Conclusión

**La página ConfiguracionTC existe y está correctamente registrada en el router, pero:**
1. No tiene ningún botón de acceso desde la UI
2. Tiene un error de props que causa runtime error
3. Es una funcionalidad separada de TenpoConfig (no la reemplaza)

**Para que sea accesible se requiere:**
1. Corregir prop mismatch en ConfiguracionTC.tsx
2. Agregar botón/enlace de navegación en Tenpo.tsx o Sidebar.tsx
3. Validar que CSS Module esté en la ubicación correcta

**No hay problemas de routing, guards, ni estructura de layouts.**

---

**Fin del diagnóstico.**
