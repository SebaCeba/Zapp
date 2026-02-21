# Configuración TC - Documentación de UI

**Fecha:** 2025-01-XX  
**Autor:** GitHub Copilot  
**Versión:** 1.0

---

## 1. Resumen

Este documento describe la implementación del frontend para la **página de Configuración de Ciclos de Facturación por Tarjeta de Crédito** (`ConfiguracionTC`).

La UI permite gestionar:
- Configuración general de cada TC (día de cierre, día de vencimiento, regla de día hábil)
- Visualización de ciclos anuales con períodos DESDE/HASTA
- Overrides mensuales para casos excepcionales
- Recalculación de cuotas pendientes cuando cambia la configuración

---

## 2. Ruta y Acceso

**URL:** `/configuracion-tc/:tcKey`

**Parámetro dinámico:** `tcKey` (string) - Identificador único de la tarjeta de crédito (ej: "TENPO")

**Ejemplo:** `http://localhost:5173/configuracion-tc/TENPO`

La ruta está integrada en [router.tsx](../client/src/router.tsx).

### 2.1. Acceso desde Tenpo

La página es accesible desde la interfaz principal de Tenpo mediante un botón dedicado:

**Ubicación:** [Tenpo.tsx](../client/src/pages/Tenpo.tsx) - Header de la página

**Botón:** "📅 Configuración TC" (estilo verde)
- **Acción:** Navega a `/configuracion-tc/TENPO`
- **Posición:** Al lado del botón "⚙️ Configurar Tasa" (azul)

**Nota:** Los dos botones tienen funcionalidades diferentes:
- **Configurar Tasa** → Gestión de tasas de interés (CAE, tasa mensual) en `/presupuesto/tenpo/config`
- **Configuración TC** → Gestión de ciclos de facturación (closingDay, dueDay, overrides) en `/configuracion-tc/TENPO`

---

## 3. Estructura de Componentes

### 3.1. Página Principal: `ConfiguracionTC.tsx`

**Ubicación:** `client/src/pages/ConfiguracionTC.tsx`

**Responsabilidades:**
- Recibe `tcKey` desde el parámetro de URL (`useParams`)
- Gestiona sistema de pestañas (tabs) para alternar entre vistas
- Coordina el refresh de componentes cuando hay cambios (vía `refreshTrigger`)
- Muestra toast notifications (éxito/error) sin bloquear la UI
- Renderiza el panel de recalculación siempre visible al final

**Tabs disponibles:**
1. **Configuración General:** Formulario para editar closingDay, dueDay, businessDayRule
2. **Ciclos Anuales:** Tabla de solo lectura con 12 meses del año seleccionado
3. **Overrides Mensuales:** Tabla editable para establecer fechas de cierre excepcionales

**Estado:**
```tsx
- activeTab: TabType ('config' | 'cycles' | 'overrides')
- refreshTrigger: number (se incrementa para forzar reload de componentes hijos)
- toast: Toast | null (mensaje temporal de feedback)
```

**Flujo de actualización:**
1. Usuario guarda cambio en TcConfigForm → `handleConfigUpdate()` → incrementa `refreshTrigger` → TcAnnualCyclesTable recarga
2. Usuario guarda override → `handleOverridesUpdate()` → incrementa `refreshTrigger` → TcAnnualCyclesTable muestra nuevos ciclos
3. Usuario aplica recalculación → `handleRecalculated()` → incrementa `refreshTrigger`

---

### 3.2. Componente: `TcConfigForm.tsx`

**Ubicación:** `client/src/components/TcConfigForm.tsx`

**Responsabilidad:** Formulario para editar configuración base de la TC.

**Props:**
```tsx
{
  tcKey: string;
  onUpdate: () => void;  // Callback cuando se guarda exitosamente
  onError: (message: string) => void;
}
```

**Campos:**
- `closingDay` (1-28): Día nominal de cierre del ciclo
- `dueDay` (1-28): Día nominal de vencimiento de la cuota
- `businessDayRule` ('NONE' | 'NEXT' | 'PREVIOUS'): Regla para ajustar cierres en fines de semana/feriados

**API consumida:**
- `GET /api/tc-billing/config/:tcKey` (al montar)
- `PUT /api/tc-billing/config` (al guardar)

**UX:**
- Botón "Guardar" inline (sin modal)
- Disabled durante guardado
- Llama `onUpdate()` para refrescar tabla de ciclos

---

### 3.3. Componente: `TcAnnualCyclesTable.tsx`

**Ubicación:** `client/src/components/TcAnnualCyclesTable.tsx`

**Responsabilidad:** Mostrar tabla de 12 meses con períodos DESDE/HASTA calculados.

**Props:**
```tsx
{
  tcKey: string;
  refreshTrigger: number;  // Cuando cambia, recarga datos
}
```

**Features:**
- Selector de año (año actual ±2)
- Tabla con columnas: Mes | Desde | Día | Hasta | Día | Cierre Nominal | Estado
- Badges:
  - 🟦 "Regla aplicada" (azul) si `ruleApplied === true`
  - 🟧 "Override" (naranja) si `overrideApplied === true`
- Formato de fechas: `dd-MMM-yyyy` con nombres de días (Lun, Mar, etc.)

**API consumida:**
- `GET /api/tc-billing/cycles/:tcKey/:year`

**UX:**
- Solo lectura (no se edita directamente)
- Se recarga automáticamente cuando cambia `tcKey`, `year` o `refreshTrigger`

---

### 3.4. Componente: `TcOverridesTable.tsx`

**Ubicación:** `client/src/components/TcOverridesTable.tsx`

**Responsabilidad:** Tabla editable de overrides mensuales (uno por mes del año).

**Props:**
```tsx
{
  tcKey: string;
  onUpdate: () => void;      // Callback para refrescar ciclos anuales
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}
```

**Features:**
- Selector de año (año actual ±2)
- 12 filas (una por mes)
- Columnas:
  - **Mes:** Nombre del mes
  - **Cierre por defecto:** Fecha calculada según `closingDay` (referencia)
  - **Override:** Input de tipo `date` (editable inline)
  - **Acciones:** Botones "Guardar" y "Eliminar" (si existe override)

**API consumida:**
- `GET /api/tc-billing/config/:tcKey` (al montar, para cargar overrides)
- `PUT /api/tc-billing/override` (al guardar)
- `DELETE /api/tc-billing/override/:tcKey/:year/:month` (al eliminar)

**UX:**
- Edición inline (no modal)
- Botón "Guardar" habilitado solo si hay fecha ingresada
- Botón "Eliminar" solo visible si ya existe override para ese mes
- Confirmación antes de eliminar
- Después de guardar/eliminar → llama `onUpdate()` para refrescar tabla de ciclos

---

### 3.5. Componente: `TcRecalculationPanel.tsx`

**Ubicación:** `client/src/components/TcRecalculationPanel.tsx`

**Responsabilidad:** Panel para recalcular cuotas pendientes (solo installmentNumber=1).

**Props:**
```tsx
{
  tcKey: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onRecalculated: () => void;  // Callback tras aplicar cambios
}
```

**Features:**
- **Botón "Vista previa (dry-run)":**
  - Llama `POST /api/tc-billing/recalculate` con `{ tcKey, dryRun: true }`
  - Muestra cantidad de registros que se modificarán
  - Muestra muestra de hasta 5 cambios (purchaseTransactionId, installmentId, oldDueDate → newDueDate)
  - Si affectedCount = 0 → mensaje "No hay cuotas que requieran actualización"

- **Botón "Aplicar cambios":**
  - Solo habilitado si hay preview con affectedCount > 0
  - Confirmación explícita (confirm dialog)
  - Llama `POST /api/tc-billing/recalculate` con `{ tcKey, dryRun: false }`
  - Después de aplicar → llama `onRecalculated()` para refrescar UI

**API consumida:**
- `POST /api/tc-billing/recalculate`

**UX:**
- 2 pasos: dry-run → confirmar → apply
- Warning visual: "Esta acción es IRREVERSIBLE"
- No modifica MANUAL purchases (garantizado por backend)

---

## 4. API Consumida

Todas las llamadas API están centralizadas en [api/tcBillingApi.ts](../client/src/api/tcBillingApi.ts).

| Función | Endpoint | Método | Descripción |
|---------|----------|--------|-------------|
| `fetchTcConfig(tcKey)` | `/api/tc-billing/config/:tcKey` | GET | Obtiene configuración + overrides |
| `upsertTcConfig(config)` | `/api/tc-billing/config` | PUT | Guarda/actualiza configuración |
| `fetchAnnualCycles(tcKey, year)` | `/api/tc-billing/cycles/:tcKey/:year` | GET | Obtiene 12 ciclos del año |
| `upsertOverride(override)` | `/api/tc-billing/override` | PUT | Guarda override mensual |
| `deleteOverride(tcKey, year, month)` | `/api/tc-billing/override/:tcKey/:year/:month` | DELETE | Elimina override |
| `recalculateCycles(request)` | `/api/tc-billing/recalculate` | POST | Recalcula cuotas (dry-run o apply) |

**Contratos detallados:** Ver [tc-billing-cycle-backend.md](./tc-billing-cycle-backend.md) sección "5. Contratos de API".

---

## 5. Tipos TypeScript

Definidos en [types/tcBilling.ts](../client/src/types/tcBilling.ts):

```tsx
interface TcBillingConfig {
  id?: number;
  tcKey: string;
  closingDay: number;       // 1-28
  dueDay: number;           // 1-28
  businessDayRule: 'NONE' | 'NEXT' | 'PREVIOUS';
  overrides: TcBillingOverride[];
  createdAt?: string;
  updatedAt?: string;
}

interface TcBillingOverride {
  id?: number;
  tcKey: string;
  year: number;
  month: number;            // 1-12
  effectiveCloseDate: string; // 'YYYY-MM-DD'
  createdAt?: string;
}

interface BillingCycle {
  year: number;
  month: number;
  nominalCloseDay: number;
  desde: string;            // 'YYYY-MM-DD'
  hasta: string;            // 'YYYY-MM-DD'
  overrideApplied: boolean;
  ruleApplied: boolean;
}

interface RecalculateRequest {
  tcKey: string;
  dryRun: boolean;
}

interface RecalculateResponse {
  affectedCount: number;
  sample?: Array<{
    purchaseTransactionId: string;
    installmentId: number;
    oldDueDate: string;
    newDueDate: string;
  }>;
}
```

---

## 6. Decisiones de UX

### 6.1. Sin Modales Bloqueantes
- Toda la edición es **inline** (formularios, inputs, botones)
- Feedback mediante **toast notifications** (4 segundos, esquina superior derecha)
- Única excepción: `confirm()` nativo para acciones destructivas (eliminar override, aplicar recalculación)

### 6.2. Refresh Inteligente
- **Patrón usado:** `refreshTrigger: number` incrementado por padre
- Cuando se guarda config → tabla de ciclos recarga automáticamente
- Cuando se guarda/elimina override → tabla de ciclos recarga automáticamente
- Cuando se aplica recalculación → tabla de ciclos recarga automáticamente

### 6.3. UX Avanzada (No Tutorial)
- Sin tooltips excesivos o wizards
- Usuario se asume familiarizado con conceptos de facturación
- Texto de ayuda mínimo (solo en RecalculationPanel para advertir irreversibilidad)
- Estados claros: loading, disabled buttons, badges informativos

### 6.4. Multi-TC desde Día 1
- URL dinámica con `:tcKey` parameter
- Mismo componente sirve para cualquier TC
- Backend devuelve configuración específica por TC

---

## 7. Estilos CSS

- **Estrategia:** CSS Modules (archivos `.module.css`)
- **Convención de nombres:** BEM-like (`.componentName__element`, `.componentName__element--modifier`)
- **Paleta de colores:**
  - Azul (`#2196F3`): Badges de "Regla aplicada", botón preview
  - Naranja (`#FF9800`): Badges de "Override", botón aplicar
  - Verde (`#4CAF50`): Botones guardar, mensajes éxito
  - Rojo (`#f44336`): Botones eliminar, mensajes error
  - Grises: Fondos, bordes, texto secundario

---

## 8. Flujo Completo del Usuario

### Escenario típico:

1. **Navegar a** `/configuracion-tc/TC_TENPO`
2. **Ver tab "Configuración General"** (por defecto)
   - Formulario muestra `closingDay=15`, `dueDay=5`, `businessDayRule=NEXT`
   - Usuario cambia `closingDay` a `20`
   - Click "Guardar" → Toast "Configuración actualizada" → Tab "Ciclos Anuales" se refresca automáticamente

3. **Cambiar a tab "Ciclos Anuales"**
   - Tabla muestra 12 meses con nuevos períodos DESDE/HASTA
   - Usuario nota que algunos meses tienen badge "Regla aplicada" (porque cierre cayó en fin de semana)

4. **Cambiar a tab "Overrides Mensuales"**
   - Usuario ve que Diciembre 2024 tiene override a `2024-12-28` (caso excepcional)
   - Usuario decide cambiar Enero 2025 a `2025-01-18` (en vez del 20 nominal)
   - Ingresa fecha en input → Click "Guardar" → Toast "Override guardado para Enero"
   - Vuelve a tab "Ciclos Anuales" → ve que Enero ahora tiene badge "Override"

5. **Scroll down al panel "Recalculación de Ciclos"**
   - Click "Vista previa (dry-run)"
   - Sistema responde: "Se modificarán 23 registros"
   - Muestra 5 ejemplos de cambios
   - Click "Aplicar cambios" → Confirmación → Click "OK"
   - Toast "✓ Recalculación aplicada: 23 registros actualizados"
   - Tabla de ciclos se refresca (ya sin cambios pendientes)

---

## 9. Qué NO Hace Esta UI

Esta página **NO** permite:

1. ❌ **Ver/editar compras Tenpo directamente** (eso está en `/presupuesto/tenpo`)
2. ❌ **Ver/editar cuotas individuales** (solo se recalculan por lote)
3. ❌ **Crear/eliminar TCs** (se asume que `tcKey` ya existe)
4. ❌ **Configurar múltiples TCs simultáneamente** (solo una a la vez)
5. ❌ **Gestionar feriados** (la regla de día hábil es genérica: sábados/domingos)
6. ❌ **Auditoría de cambios** (no hay historial de quién modificó qué)
7. ❌ **Validación compleja de lógica de negocio** (eso es responsabilidad del backend)

---

## 10. Testing Manual Sugerido

### 10.1. Happy Path
- [ ] Acceder a URL con tcKey válido → carga correctamente
- [ ] Cambiar closingDay → guardar → tabla de ciclos se actualiza
- [ ] Agregar override en un mes → guardar → badge "Override" aparece en tabla
- [ ] Eliminar override → confirmar → badge desaparece
- [ ] Hacer dry-run → ver preview → aplicar → cuotas actualizadas

### 10.2. Edge Cases
- [ ] URL sin tcKey → muestra error
- [ ] tcKey inexistente → backend devuelve 404 → toast error
- [ ] Cambiar año en selector → tabla se recarga con datos correctos
- [ ] Intentar guardar override sin fecha → botón "Guardar" disabled
- [ ] Aplicar recalculación sin preview → botón "Aplicar" disabled
- [ ] Backend devuelve error → toast error con mensaje descriptivo

### 10.3. UX
- [ ] Toast desaparece después de 4 segundos automáticamente
- [ ] Cambiar de tab → tab activo resaltado correctamente
- [ ] Botones loading muestran "Guardando..." / "Eliminando..." durante operación
- [ ] Hover en filas de tabla → fondo gris suave
- [ ] Responsive (no prioritario, pero tabla debería scrollear horizontalmente en móvil)

---

## 11. Mejoras Futuras (Out of Scope V1)

1. **Historial de cambios:** Auditoría de quién modificó configuración/overrides y cuándo
2. **Calendario de feriados:** Integración con API de feriados nacionales para regla de días hábiles
3. **Configuración multi-TC:** UI para gestionar múltiples TCs en una sola vista
4. **Previsualización visual:** Timeline gráfico de ciclos en vez de tabla
5. **Notificaciones:** Enviar email/alerta cuando se recalculan cuotas
6. **Validación avanzada:** Prevenir configuraciones que generen solapamiento de ciclos
7. **Export:** Descargar tabla de ciclos en CSV/Excel
8. **Undo/Redo:** Revertir cambios recientes

---

## 12. Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `client/src/types/tcBilling.ts` | Interfaces TypeScript |
| `client/src/api/tcBillingApi.ts` | Funciones de API |
| `client/src/components/TcConfigForm.tsx` | Formulario de configuración |
| `client/src/components/TcConfigForm.module.css` | Estilos del formulario |
| `client/src/components/TcAnnualCyclesTable.tsx` | Tabla de ciclos anuales |
| `client/src/components/TcAnnualCyclesTable.module.css` | Estilos de tabla |
| `client/src/components/TcOverridesTable.tsx` | Tabla de overrides |
| `client/src/components/TcOverridesTable.module.css` | Estilos de overrides |
| `client/src/components/TcRecalculationPanel.tsx` | Panel de recalculación |
| `client/src/components/TcRecalculationPanel.module.css` | Estilos del panel |
| `client/src/pages/ConfiguracionTC.tsx` | Página principal |
| `client/src/pages/ConfiguracionTC.module.css` | Estilos de página |
| `client/src/router.tsx` | Actualizado con ruta `/configuracion-tc/:tcKey` |
| `docs/tc-billing-cycle-ui.md` | Esta documentación |

---

## 13. Referencias

- **Backend:** [tc-billing-cycle-backend.md](./tc-billing-cycle-backend.md)
- **Diseño:** [tc-billing-cycle-design.md](./tc-billing-cycle-design.md)
- **Integración Tenpo:** [TENPO_INTEGRATION.md](./TENPO_INTEGRATION.md)

---

**Fin del documento.**
