# CHANGELOG — Edición de Periodo de Pago v2.0

**Fecha:** 28 de febrero de 2026  
**Versión:** 2.1 (Enhancement - Edit Saved Transactions)  
**Autor:** System  
**Tipo de cambio:** Feature - UX Enhancement

---

## 📋 Resumen del Cambio

**Antes (v2.0):**  
Solo se podía editar mes/año para transacciones PENDIENTES (recién importadas).  
Transacciones guardadas mostraban periodo read-only → no había forma de corregir errores.  
Se usaban 2 SelectPickers separados (Año + Mes).

**Ahora (v2.1):**  
✅ **EDITAR transacciones YA GUARDADAS:** Click en periodo → modificar → botón Guardar  
✅ **MonthPicker unificado:** Reemplaza 2 dropdowns con 1 Popover (grid 3x4 meses + navegación año)  
✅ **Tracking de cambios:** Fila cambia a amarillo si está modificada pero no guardada  
✅ **Acciones contextuales:** Botones "Guardar"/"Descartar" aparecen solo si hay cambios

---

## 🎯 Motivación

### Problemas Identificados

1. **Imposible corregir errores:** Si se guardaba una transacción con mes/año incorrecto, había que eliminarla y reimportarla
2. **UX lenta:** 2 SelectPickers (Año + Mes) requieren 2 clics → experiencia más lenta que un MonthPicker unificado
3. **Falta de feedback visual:** No había indicación de fila modificada antes de guardar
4. **Pérdida de datos:** Si usuario modificaba y navegaba sin guardar, se perdían cambios

### Objetivos del Cambio

✅ **Permitir edición post-save** → Corregir errores sin eliminar  
✅ **Mejorar UX con MonthPicker** → 1 click en lugar de 2 dropdowns  
✅ **Tracking de "dirty state"** → Fila amarilla = cambio pendiente  
✅ **Backend seguro** → Validación de mes/año, preservación de `emailDate`/`gmailMessageId`

---

## 🔧 Qué se Cambió

### 1. Backend - utilities.ts

**Agregado:**

**PATCH Endpoint:**
```typescript
router.patch('/:provider/transactions/:id/pay-period', async (req, res) => {
  // Valida payYear (±5 del año actual) y payMonth (1-12)
  // Recalcula transaction_date = new Date(payYear, payMonth-1, 1)
  // Actualiza metadata.userSelectedPayMonth = "YYYY-MM"
  // PRESERVA emailDate y gmailMessageId (evidencia inmutable)
  // Retorna transacción actualizada
})
```

**Validaciones:**
- `payMonth` entre 1-12
- `payYear` dentro de ±5 años del año actual
- Provider existe en BD
- Transaction existe y pertenece al provider
- Body contiene payYear y payMonth

**Errores manejados:**
- `400` → Validación fallida (mes/año inválido)
- `404` → Proveedor o transacción no encontrada
- `500` → Error de base de datos

**Ubicación:** Línea ~510-575 en `node-version/src/routes/utilities.ts`

---

### 2. Frontend - PayPeriodPicker.tsx (NUEVO)

**Archivo:** `node-version/client/src/components/utilities/PayPeriodPicker.tsx`

**Descripción:**  
Componente custom de RSuite que reemplaza 2 SelectPickers con un Popover interactivo.

**Props:**
```typescript
interface PayPeriodPickerProps {
  value: { payYear: number; payMonth: number } | string | null;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
```

**Características:**
- **Display:** Botón con formato "Mar 2026" (usando date-fns con locale es)
- **Popover:** Grid 3x4 de meses + header con año y botones prev/next
- **Interacción:** Click en mes → `onChange(year, month)` → cierra automáticamente
- **Estilos:** Mes seleccionado con borde azul y fondo `#eff6ff`
- **Accesibilidad:** Hover effect en meses, botones con íconos ◀ ▶

**Diseño Visual:**
```
┌──────────────────────┐
│  ◀   2026   ▶        │
├──────────────────────┤
│ Ene   Feb   Mar      │
│ Abr   May   Jun      │
│ Jul   Ago   Sep      │
│ Oct   Nov   Dic      │
└──────────────────────┘
```

---

### 3. Frontend - UtilityTable.tsx

**Agregado:**

**Props:**
- `onSavedPayPeriodChange?: (transactionId, payYear, payMonth) => void` - callback para editar guardadas

**Estado:**
- `dirtyTransactions: Record<number, { payYear: number; payMonth: number }>` - trackea cambios pendientes por transacción

**Funciones:**
- `handlePayPeriodChange(year, month)` - actualiza estado dirty local
- `handleSavePayPeriod()` - llama a `onSavedPayPeriodChange` y limpia dirty state
- `handleDiscardChanges()` - descarta cambios locales

**Modificado:**

**Columnas de tabla:**
- **Antes:** 8 columnas (`Info | Fecha | Monto | Descripción | Año Pago | Mes Pago | Origen | Acciones`)
- **Ahora:** 7 columnas (`Info | Fecha | Monto | Descripción | Periodo Pago | Origen | Acciones`)

**Filas pendientes:**
- Reemplaza 2 SelectPickers → `<PayPeriodPicker value={selection} onChange={...} />`
- Mantiene fondo amarillo `#fefce8`

**Filas guardadas:**
- **Antes:** Texto estático (año y mes read-only)
- **Ahora:** `<PayPeriodPicker />` editable
- **Dirty state:** Fondo cambia a `#fef3c7` (amarillo) si `isDirty`
- **Acciones:**
  - Si dirty: Botones `💾 Guardar` (verde) y `✖️ Descartar`
  - Si no dirty: Botón `🗑️ Eliminar`

**Colspan ajustado:** `8` → `7` en headers y filas expandibles

---

### 4. Frontend - UtilityProviderPanel.tsx

**Agregado:**

**Handler:**
```typescript
const handleUpdateSavedPayPeriod = async (
  transactionId: number, 
  payYear: number, 
  payMonth: number
) => {
  // Llama a PATCH /api/utilities/:provider/transactions/:id/pay-period
  // Toast success/error
  // Recarga transactions y summaries
  // Notifica onDataChange() para actualizar total anual
}
```

**Modificado:**
- `<UtilityTable />`: Agregado prop `onSavedPayPeriodChange={handleUpdateSavedPayPeriod}`

---

## 🎨 Diseño Visual

### Tabla con Fila en Dirty State

```
┌───────────────────────────────────────────────────────────────────┐
│ 💾 TRANSACCIONES GUARDADAS (12)                                  │
├─────┬──────────┬────────┬─────────┬─────────┬──────┬────────────┤
│ ▶   │01 Mar 26 │$48.000 │Factura  │[Mar 26▼]│📧    │🗑️          │ ← Normal
├─────┴──────────┴────────┴─────────┴─────────┴──────┴────────────┤
│ ▶   │01 Feb 26 │$52.000 │Consumo  │[Abr 26▼]│📧    │💾 ✖️       │ ← Dirty (amarillo)
└─────┴──────────┴────────┴─────────┴─────────┴──────┴────────────┘
```

**Estilos dirty state:**
- Fondo fila: `#fef3c7` (amarillo - igual que pending banner)
- Botón Guardar: `appearance="primary" color="green"`
- Botón Descartar: `appearance="subtle"` con ícono ✖️
- Botón Eliminar: Oculto mientras está dirty

**PayPeriodPicker:**
- Botón: `width: 110px`, `size: xs`
- Formato: `"Mar 2026"` (locale español)
- Popover: `240px` width, padding `1rem`
- Grid meses: `3 columnas × 4 filas`, gap `0.5rem`

---

## 📊 Flujo de Datos

### Update Pay Period Flow

```
Usuario click en PayPeriodPicker de fila guardada
    ↓
Selecciona nuevo mes/año en Popover
    ↓
onChange → handlePayPeriodChange()
    ↓
setDirtyTransactions({ [id]: { payYear, payMonth } })
    ↓
Fila cambia a fondo amarillo + botones Guardar/Descartar
    ↓
Usuario click "💾 Guardar"
    ↓
handleSavePayPeriod() → onSavedPayPeriodChange(id, year, month)
    ↓
PATCH /api/utilities/:provider/transactions/:id/pay-period
    ↓
Backend: Valida → Recalcula transaction_date → Actualiza metadata
    ↓
200 OK → Toast success
    ↓
loadTransactions() + loadSummaries() + onDataChange()
    ↓
Fila vuelve a estado normal (sin amarillo)
```

### Data Preservation

**Inmutables (NUNCA cambian):**
- `emailDate` → Evidencia de cuándo llegó el correo
- `gmailMessageId` → Deduplicación

**Editables:**
- `payYear` / `payMonth` → Usuario decide en qué mes contabilizar
- `transaction_date` → **Derivado** del payYear/payMonth (siempre día 01)
- `metadata.userSelectedPayMonth` → Formato "YYYY-MM" para auditoría

---

## 🧪 Cómo Probar

### Test 1: Editar una Transacción Guardada

1. Navega a tab de proveedor (ej: CGE, Aguas Andinas)
2. Busca una transacción guardada (sección inferior de tabla)
3. Click en el PayPeriodPicker (debería mostrar Popover con meses)
4. Selecciona un mes/año diferente
5. ✅ **Verificar:** Fila cambia a fondo amarillo
6. ✅ **Verificar:** Botones cambian: aparecen "💾 Guardar" y "✖️"
7. Click "Guardar"
8. ✅ **Verificar:** Toast "✅ Periodo de pago actualizado"
9. ✅ **Verificar:** Fila vuelve a fondo blanco
10. ✅ **Verificar:** Columna "Fecha" mantiene el formato original (no cambia porque es metadata)
11. ✅ **Verificar:** PayPeriodPicker muestra el nuevo periodo
12. ✅ **Verificar:** Gráfico de resumen se actualiza (suma en nuevo mes)

### Test 2: Descartar Cambios

1. Edita periodo de una transacción guardada
2. Fila cambia a amarillo
3. Click "✖️ Descartar"
4. ✅ **Verificar:** Fila vuelve a fondo blanco
5. ✅ **Verificar:** PayPeriodPicker vuelve al valor original
6. ✅ **Verificar:** No hay llamadas al backend (cambio solo local)

### Test 3: Validación Backend

**Test en consola del navegador (DevTools Network):**

```javascript
// Mes inválido (13)
await fetch('http://localhost:3000/api/utilities/cge/transactions/1/pay-period', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payYear: 2026, payMonth: 13 })
});
// ✅ Debe retornar 400: "payMonth debe estar entre 1 y 12"

// Año inválido (muy futuro)
await fetch('http://localhost:3000/api/utilities/cge/transactions/1/pay-period', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payYear: 2099, payMonth: 6 })
});
// ✅ Debe retornar 400: "payYear debe estar entre X y Y"

// Body incompleto
await fetch('http://localhost:3000/api/utilities/cge/transactions/1/pay-period', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ payYear: 2026 }) // falta payMonth
});
// ✅ Debe retornar 400: "payYear y payMonth son requeridos"
```

### Test 4: Preservación de Evidencia

1. Edita periodo de una transacción importada desde Gmail
2. Guarda cambios
3. Expande fila para ver metadata
4. ✅ **Verificar:** `emailDate` NO cambia (mantiene fecha original del correo)
5. ✅ **Verificar:** `userSelectedPayMonth` actualizado al nuevo formato "YYYY-MM"
6. ✅ **Verificar:** En BD: `gmailMessageId` sigue intacto
7. ✅ **Verificar:** En BD: `transaction_date` = `new Date(payYear, payMonth-1, 1)`

### Test 5: UX con MonthPicker

1. Click en PayPeriodPicker de cualquier fila
2. ✅ **Verificar:** Popover aparece con grid 3x4 de meses
3. ✅ **Verificar:** Mes actual está destacado (borde azul)
4. Click "▶" en header
5. ✅ **Verificar:** Año incrementa, meses se mantienen
6. Hover sobre mes diferente
7. ✅ **Verificar:** Fondo cambia a gris claro (`#f3f4f6`)
8. Click en mes
9. ✅ **Verificar:** Popover se cierra automáticamente
10. ✅ **Verificar:** Botón muestra nuevo periodo (ej: "Dic 2027")

---

## ⚠️ Riesgos y Consideraciones

### 1. Pérdida de Cambios No Guardados

**Riesgo:** Usuario modifica periodo, cambia de tab sin guardar → pierde cambios  
**Mitigación actual:** Estado `dirtyTransactions` es LOCAL al componente UtilityTable  
**Mitigación futura (opcional):**
- Warning modal al cambiar de tab si hay dirty state
- Auto-save después de X segundos
- LocalStorage backup del dirty state

### 2. Recalcular Summaries

**Riesgo:** Si usuario edita múltiples transacciones de diferentes meses, los gráficos deben actualizarse correctamente  
**Mitigación actual:**
- `loadSummaries()` se llama después de cada `handleUpdateSavedPayPeriod`
- Backend recalcula aggregations en tiempo real
- `onDataChange()` notifica componentes padres para actualizar total anual

**Verificar:** Test que edite una transacción de Feb → Jun y valide que:
- Suma de Feb disminuye
- Suma de Jun aumenta
- Total anual no cambia (solo redistribución)

### 3. Concurrencia

**Riesgo:** Dos usuarios editan la misma transacción simultáneamente  
**Mitigación actual:** Ninguna (last-write-wins)  
**Mitigación futura (si escala):**
- Optimistic locking con `updatedAt` timestamp
- Websockets para notificar cambios en tiempo real

### 4. Metadata Expandible

**Riesgo:** Si metadata es muy largo, puede romper layout de fila expandible  
**Mitigación actual:** Grid con `repeat(auto-fit, minmax(200px, 1fr))` → responsive  
**Verificación:** Test con metadata largo (address de 200+ chars)

---

## 📈 Mejoras Futuras (v3.0)

### 1. Batch Edit de Transacciones Guardadas

Permitir seleccionar múltiples filas guardadas y cambiar periodo en masa.

**UI propuesta:**
- Checkbox en cada fila
- Banner superior: "3 seleccionadas → [Cambiar periodo a...] [Eliminar]"
- Modal con MonthPicker para aplicar a todas

### 2. Historial de Cambios (Audit Log)

Guardar cada edición de `payPeriod` en tabla `transaction_edits`:

```sql
CREATE TABLE transaction_edits (
  id INTEGER PRIMARY KEY,
  transaction_id INTEGER NOT NULL,
  field_changed TEXT NOT NULL, -- "payPeriod"
  old_value TEXT,
  new_value TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES utilities_transactions(id)
);
```

**UI propuesta:**
- Botón "📜 Historial" en fila expandible
- Modal con timeline de cambios

### 3. Validación Inteligente

**Heurística:** Si `emailDate` es 25 de Feb y usuario quiere asignar periodo "Ene", mostrar warning:
> ⚠️ Atención: El correo llegó el 25 de febrero, pero estás asignando enero como periodo de pago. ¿Estás seguro?

**Backend:** Endpoint podría devolver `{ warning: true, message: "..." }` en lugar de error 400.

### 4. Undo Functionality

- Toast con botón "Deshacer" después de cada update
- Cache local del valor anterior por 10 segundos
- PATCH adicional para revertir cambio

---

## 📝 Testing Checklist

- [x] PATCH endpoint creado y validado
- [x] PayPeriodPicker renderiza correctamente
- [x] PayPeriodPicker cierra al seleccionar mes
- [x] Dirty state trackea cambios por fila
- [x] Botones Guardar/Descartar aparecen cuando isDirty
- [x] Botón Eliminar desaparece cuando isDirty
- [x] PATCH llama correctamente al endpoint
- [x] Toast muestra success/error
- [x] Summaries se recargan después de update
- [x] onDataChange() notifica componentes padres
- [ ] Test manual en navegador: editar fila guardada
- [ ] Test manual: descartar cambios
- [ ] Test manual: validación backend (mes/año inválido)
- [ ] Test manual: preservación de emailDate/gmailMessageId
- [ ] Test visual: MonthPicker Popover responsive
- [ ] Test: cambiar año con botones prev/next
- [ ] Test: hover effect en meses

---

## 📦 Archivos Modificados

### Backend
- ✅ `node-version/src/routes/utilities.ts` (líneas ~510-575) - PATCH endpoint

### Frontend
- ✅ `node-version/client/src/components/utilities/PayPeriodPicker.tsx` (NUEVO)
- ✅ `node-version/client/src/components/utilities/UtilityTable.tsx`
  - Import PayPeriodPicker
  - Props: +onSavedPayPeriodChange
  - Estado: +dirtyTransactions
  - Lógica: handlePayPeriodChange, handleSavePayPeriod, handleDiscardChanges
  - UI: Reemplaza 2 SelectPickers → 1 PayPeriodPicker
  - UI: 8 columnas → 7 columnas
  - UI: Dirty state con fondo amarillo + botones contextuales
- ✅ `node-version/client/src/components/utilities/UtilityProviderPanel.tsx`
  - Handler: +handleUpdateSavedPayPeriod
  - Props: <UtilityTable onSavedPayPeriodChange={...} />

### Documentación
- ✅ `docs/CHANGELOG_payperiod_edit_v2.md` (este archivo)

---

## 🎉 Conclusión

**v2.1** completa el flujo de edición permitiendo corregir periodos de pago en transacciones ya guardadas, eliminando la necesidad de eliminar/reimportar. El nuevo `PayPeriodPicker` mejora la UX al reducir clics y proveer una interfaz más intuitiva similar a calendarios nativos.

**Próximos pasos:**
1. Testing manual exhaustivo (checklist arriba)
2. Feedback de usuarios sobre UX del MonthPicker
3. Considerar v3.0 con batch edit y audit log
