# CHANGELOG — Importación Inline con Asignación de Mes/Año

**Fecha:** 28 de febrero de 2026  
**Versión:** 2.0 (MVP - Inline Editing para Pendientes)  
**Autor:** System  
**Tipo de cambio:** Feature - UX Improvement

---

## 📋 Resumen del Cambio

**Antes (v1.0):**  
Importar desde Gmail → Modal de confirmación → Editar mes/año en modal → Confirmar → Persistir

**Ahora (v2.0):**  
Importar desde Gmail → Items aparecen en tabla como "pendientes" → Editar mes/año inline en tabla → Guardar cambios → Persistir

---

## 🎯 Motivación

### Problema Identificado

1. **Modal bloqueante:** Usuario debía confirmar inmediatamente o perder contexto
2. **No editable post-import:** Una vez guardado, no había forma de corregir mes/año sin eliminar y reimportar
3. **Separación de evidencia y modelo contable:**
   - `emailDate` = evidencia inmutable (cuándo llegó el correo)
   - `payYear`/`payMonth` = decisión contable del usuario (en qué mes registrar el pago)
   - `transaction_date` = derivado (primer día del mes elegido)

### Objetivos del Cambio

✅ **Eliminar modal bloqueante** → Flujo más natural  
✅ **Edición inline en tabla** → Contexto visual completo  
✅ **Separar evidencia de modelo contable** → Claridad conceptual  
✅ **Permitir batch editing** → Importar múltiples veces antes de guardar  
✅ **Barra sticky para acción global** → UX clara

---

## 🔧 Qué se Cambió

### 1. Frontend - UtilityProviderPanel.tsx

**Eliminado:**
- Import de `ImportPreviewModal`
- Estado `showPreviewModal`
- Función `handleConfirmImport` (reemplazada por `handleSavePending`)

**Agregado:**
- Estado `pendingSelections: Record<string, { payYear: number; payMonth: number }>`
- Función `handleDiscardPending()` - descarta transacciones pendientes
- Función `handleApplyFirstToAll()` - copia mes/año de primera fila a todas
- Función `handleSavePending()` - guarda pendientes en backend
- Banner de pendientes (card amarillo con info y botones)
- Barra sticky inferior (visible solo si hay pendientes)
- Validación: botón Guardar deshabilitado si faltan selecciones

**Modificado:**
- `handleImportEmail()`:
  - Ya no abre modal
  - Inicializa `pendingSelections` con `suggestedPayMonth` o mes/año actual
  - Agrega items a `previewItems` para renderizar en tabla

### 2. Frontend - UtilityTable.tsx

**Agregado:**
- Props:
  - `pendingItems?: PendingItem[]` - items pendientes por guardar
  - `pendingSelections?: Record<...>` - selecciones de mes/año
  - `onPendingSelectionChange?: (gmailMessageId, field, value) => void` - callback para editar
- Interface `PendingItem` con campos del preview
- Sección "PENDIENTES POR GUARDAR" en tabla (fondo amarillo claro)
- Columnas adicionales: "Año Pago" y "Mes Pago" (visibles para todas las filas)
- SelectPickers inline para editar payYear/payMonth en filas pendientes
- Tag "NUEVO" en filas pendientes
- Separador visual entre pendientes y guardadas

**Modificado:**
- Tabla ahora tiene 8 columnas (antes 6):
  - Info | Fecha | Monto | Descripción | **Año Pago** | **Mes Pago** | Origen | Acciones
- Filas guardadas muestran año/mes read-only (no editable aún - v2 futura)
- Metadata expandible ahora muestra `emailDate` y `userSelectedPayMonth`
- Margin bottom dinámico: `5rem` si hay pendientes (espacio para barra sticky), `1rem` si no

### 3. Backend (Sin cambios)

✅ Endpoints mantienen la misma firma:
- `POST /api/utilities/:provider/import-email/preview` - retorna items parseados sin guardar
- `POST /api/utilities/:provider/import-email/confirm` - recibe items con `payYear`/`payMonth` y persiste

✅ Deduplicación por `gmailMessageId` - igual que antes  
✅ Metadata enriquecido con `emailDate` y `userSelectedPayMonth` - igual que antes

---

## 🎨 Diseño Visual

### Banner de Pendientes

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Tienes 3 transacciones pendientes                        │
│ Asigna el mes/año de pago en la tabla inferior y luego...  │
│ [📌 Aplicar primer mes/año a todos] [🗑️ Descartar]        │
│                                                             │
│ ⚠️ Algunas transacciones no tienen mes/año asignado        │
└─────────────────────────────────────────────────────────────┘
```

**Estilo:**
- Fondo: `#fef3c7` (amarillo claro)
- Borde: `2px solid #fbbf24` (amarillo)
- Texto: `#92400e` (marrón oscuro)

### Tabla con Pendientes

```
┌────────────────────────────────────────────────────────────────────┐
│ 🗓️ PENDIENTES POR GUARDAR (3)                                     │
├─────┬──────────┬────────┬─────────┬────────┬─────────┬──────┬─────┤
│NUEVO│15 Feb 26 │$52.153 │Factura..│ [2026▼]│[Marzo▼] │📧    │  -  │
│     │Correo    │        │Cuenta:  │        │         │      │     │
│     │recibido  │        │662836-2 │        │         │      │     │
├─────┴──────────┴────────┴─────────┴────────┴─────────┴──────┴─────┤
│ 💾 TRANSACCIONES GUARDADAS (12)                                   │
├─────┬──────────┬────────┬─────────┬────────┬─────────┬──────┬─────┤
│ ▶   │01 Mar 26 │$48.000 │Factura..│ 2026   │Marzo    │📧    │🗑️  │
│     │Pago reg. │        │         │        │         │      │     │
└─────┴──────────┴────────┴─────────┴────────┴─────────┴──────┴─────┘
```

**Estilos:**
- Fila pendiente: fondo `#fefce8` (amarillo muy claro)
- Tag "NUEVO": fondo `#fbbf24` (amarillo), texto blanco
- Separador: fondo `#e5e7eb` (gris claro)

### Barra Sticky Inferior

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Pendientes: 3          [Descartar] [💾 Guardar cambios]  │
└─────────────────────────────────────────────────────────────┘
```

**Estilo:**
- Fondo: `#1e40af` (azul oscuro)
- Texto: blanco
- Position: `fixed bottom: 0`
- Z-index: `1000`
- Botón Guardar: `color="green"`, deshabilitado si faltan selecciones

---

## 🧪 Cómo Probar

### Caso de Uso 1: Importación Simple

1. Ir a Servicios Básicos → Actual → Tab "Agua"
2. Click en "📧 Importar (preparar registros)"
3. **Verificar:** Banner amarillo aparece arriba con "X transacciones pendientes"
4. **Verificar:** Tabla muestra sección "PENDIENTES POR GUARDAR" con filas amarillas
5. **Verificar:** Cada fila tiene SelectPickers para año/mes
6. **Verificar:** Barra sticky azul aparece abajo con "Pendientes: X"
7. Editar mes/año en SelectPickers
8. Click en "💾 Guardar cambios"
9. **Verificar:** Toast de éxito
10. **Verificar:** Pendientes desaparecen, barra sticky desaparece
11. **Verificar:** Transacciones aparecen en sección "GUARDADAS"

### Caso de Uso 2: Aplicar a Todos

1. Importar múltiples transacciones (ej: 5 boletas)
2. Editar mes/año de la **primera fila**
3. Click en "📌 Aplicar primer mes/año a todos"
4. **Verificar:** Todas las filas ahora tienen el mismo mes/año de la primera
5. Guardar cambios

### Caso de Uso 3: Descartar Pendientes

1. Importar transacciones
2. Editar algunas selecciones
3. Click en "🗑️ Descartar pendientes"
4. **Verificar:** Confirmación de navegador
5. Confirmar
6. **Verificar:** Todas las pendientes desaparecen
7. **Verificar:** Banner y barra sticky desaparecen

### Caso de Uso 4: Validación de Selecciones Faltantes

1. Importar transacciones
2. **No** editar mes/año (o borrar selección)
3. **Verificar:** Banner muestra mensaje amarillo "Algunas transacciones sin mes/año"
4. **Verificar:** Botón "Guardar cambios" está deshabilitado
5. Completar selecciones
6. **Verificar:** Mensaje desaparece, botón se habilita

### Caso de Uso 5: Importar Múltiples Veces

1. Importar 3 transacciones → No guardar
2. Importar otras 2 transacciones → **Verificar:** ahora hay 5 pendientes
3. Editar o aplicar a todos
4. Guardar todo junto
5. **Verificar:** Las 5 se guardan en un solo batch

### Caso de Uso 6: Ver Metadata en Filas Guardadas

1. Después de guardar, click en "▶" de una fila guardada
2. **Verificar:** Metadata expandible muestra:
   - 📍 Dirección
   - 🔢 N° Cuenta
   - 📅 Período Facturación
   - 📧 Fecha Correo (nuevo)
   - 💰 Mes Asignado por Usuario (nuevo)

---

## 📊 Datos y Flujo Técnico

### Estado en UtilityProviderPanel

```typescript
// Items del preview (no guardados)
previewItems: PreviewItem[] = [
  {
    gmailMessageId: "18df123abc456",
    emailDate: "2026-02-15T10:30:00.000Z",
    amount: 52153,
    description: "Factura Agua - Marzo 2026",
    metadata: { address, accountNumber, ... },
    suggestedPayMonth: "2026-03"
  }
]

// Selecciones del usuario (editable inline)
pendingSelections: Record<string, { payYear: number; payMonth: number }> = {
  "18df123abc456": { payYear: 2026, payMonth: 3 }
}
```

### Flujo de Guardado

```
handleSavePending()
  ↓
Validar: ¿todas las filas tienen payYear/payMonth?
  ↓
Construir confirmedItems = previewItems.map(item => ({
  ...item,
  payYear: pendingSelections[item.gmailMessageId].payYear,
  payMonth: pendingSelections[item.gmailMessageId].payMonth
}))
  ↓
POST /api/utilities/:provider/import-email/confirm
  body: { items: confirmedItems }
  ↓
Backend: transaction_date = new Date(payYear, payMonth-1, 1)
  ↓
Backend: metadata += { emailDate, userSelectedPayMonth }
  ↓
Frontend: limpiar pendientes, recargar tabla, toast éxito
```

---

## 🚀 Qué Queda para V2

**Fuera del alcance de este MVP:**

❌ **Edición post-guardado:** Poder editar mes/año de transacciones ya guardadas  
❌ **Migración completa a RSuite Table:** Tabla aún usa HTML plano con SelectPickers agregados  
❌ **Edición de otros campos:** Monto, descripción, etc.  
❌ **Undo/Redo granular:** Solo hay "Descartar todo", no undo por fila  
❌ **Validación avanzada:** Ej: alertar si mes es muy distinto a suggestedPayMonth

**Posibles mejoras futuras:**

💡 **Columna "Estado":** Tag visual "Sugerido: Marzo / Asignado: Abril" cuando difieren  
💡 **Drag & drop para reordenar:** Útil si se importan muchas filas  
💡 **Filtros/búsqueda:** En tabla de pendientes si hay muchos items  
💡 **Modo de edición masiva:** Select múltiple + acción batch (ej: "Cambiar mes de 5 filas")  
💡 **Confirmación con preview de cambios:** Antes de guardar, mostrar resumen de lo que se guardará

---

## 🐛 Problemas Conocidos

### Limitaciones Actuales

1. **No hay autosave:** Si cierras la pestaña con pendientes, se pierden (navegador podría advertir con `beforeunload`)
2. **SelectPickers pequeños:** En pantallas móviles puede ser difícil clickear
3. **Sin indicador de loading:** Al guardar, no hay spinner (solo toast al final)
4. **Barra sticky cubre contenido:** Si tabla es muy larga, últimas filas pueden quedar ocultas bajo barra sticky
5. **No hay paginación:** Si importas 100+ items, la tabla se hará muy larga

### Errores Potenciales

⚠️ **Si `suggestedPayMonth` es null:** Se inicializa con mes/año actual (puede no ser lo deseado si el correo es antiguo)  
⚠️ **Si backend retorna error 500:** Frontend solo muestra toast genérico, no hay retry automático  
⚠️ **Si hay duplicados en lote:** Backend filtra silenciosamente, usuario no sabe cuáles se descartaron (podría agregarse lista en toast)

---

## 📚 Referencias

**Archivos modificados:**
- `client/src/components/utilities/UtilityProviderPanel.tsx` - Lógica de pendientes y guardado
- `client/src/components/utilities/UtilityTable.tsx` - UI con SelectPickers inline

**Archivos relacionados (sin cambios):**
- `src/routes/utilities.ts` - Endpoints `/preview` y `/confirm` (compatibles)
- `src/services/utilities-parser.service.ts` - Parser de emails (sin cambios)
- `client/src/components/utilities/ImportPreviewModal.tsx` - **Deprecado** (ya no usado, puede eliminarse)

**Documentación relacionada:**
- [docs/AUDIT_import_mes_anio.md](./AUDIT_import_mes_anio.md) - Auditoría del flujo anterior
- [docs/import_gmail_preview_confirm.md](./import_gmail_preview_confirm.md) - Arquitectura de endpoints preview/confirm

---

## 🎓 Lecciones Aprendidas

### Decisiones de Diseño

**¿Por qué no migrar a RSuite Table completa?**  
→ Migración incremental: agregar columnas editables a tabla HTML plano es menos riesgoso que reescribir toda la tabla. V2 puede hacer migración completa.

**¿Por qué barra sticky en vez de botones en banner?**  
→ Barra sticky siempre visible mientras usuario hace scroll, mejora accesibilidad del botón Guardar.

**¿Por qué "Aplicar a todos" solo copia de primera fila?**  
→ Simplicidad: caso de uso común es que todas las boletas sean del mismo mes. Si usuario necesita más control, puede editar individualmente.

**¿Por qué validación bloqueante (deshabilitar botón)?**  
→ Previene errores: mejor que permitir guardar y luego mostrar error de backend.

### Impacto en UX

✅ **Positivo:**
- Usuario puede importar y revisar sin presión de confirmar inmediatamente
- Vista completa del contexto (pendientes + guardadas en misma pantalla)
- Feedback visual claro (colores, tags, barra sticky)

⚠️ **Neutral:**
- Más pasos (importar → editar → guardar) vs. antes (importar → confirmar). Pero cada paso es más claro.

❌ **Riesgos:**
- Si usuario olvida guardar y cierra tab, pierde trabajo (mitigable con warning)
- Tabla más compleja visualmente (más columnas)

---

**Fin del Changelog**
