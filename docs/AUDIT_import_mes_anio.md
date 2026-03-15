# AUDITORÍA — Flujo Importación Mes/Año

**Fecha:** 28 de febrero de 2026  
**Autor:** System Audit  
**Objetivo:** Auditar el flujo actual de importación desde Gmail, enfocándose en cómo se asigna mes/año antes de persistir en "Actual"

---

## 1. Archivos Involucrados

### Frontend

| Archivo | Ruta | Propósito |
|---------|------|-----------|
| **ActualUtilities.tsx** | `client/src/pages/ActualUtilities.tsx` | Página principal con tabs por provider y selector de año |
| **UtilityProviderPanel.tsx** | `client/src/components/utilities/UtilityProviderPanel.tsx` | Panel por provider: contiene tabla, gráficos, botones de importación |
| **ImportPreviewModal.tsx** | `client/src/components/utilities/ImportPreviewModal.tsx` | Modal para confirmar importación con edición de mes/año |
| **UtilityTable.tsx** | `client/src/components/utilities/UtilityTable.tsx` | Tabla plana HTML con filas expandibles para metadata |
| **UtilityImportCard.tsx** | `client/src/components/utilities/UtilityImportCard.tsx` | Card con botones de importación (Gmail, CSV, Manual) |

### Backend

| Archivo | Ruta | Propósito |
|---------|------|-----------|
| **utilities.ts** | `src/routes/utilities.ts` | Endpoints de API para transacciones |
| **utilities-parser.service.ts** | `src/services/utilities-parser.service.ts` | Parser de emails con lógica de extracción |
| **gmail.service.ts** | `src/services/gmail.service.ts` | Servicio para conectar con Gmail API |

---

## 2. Flujo Actual (Paso a Paso)

### Diagrama Textual

```
┌─────────────────────────────────────────────────────────────────┐
│ ActualUtilities.tsx (Página Principal)                         │
│ - Nav Tabs: [Luz │ Agua │ Gas │ ...]                           │
│ - SelectPicker: Año (ej: 2026)                                 │
│ - Renderiza: <UtilityProviderPanel provider="Agua" year={2026}>│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ UtilityProviderPanel.tsx (Panel del Provider Activo)           │
│                                                                 │
│ Componentes hijos:                                              │
│  1. UtilityImportCard                                           │
│     - Botón: "📧 Importar (preparar registros)"                │
│     - onClick → handleImportEmail()                            │
│                                                                 │
│  2. UtilityTable                                                │
│     - Muestra transacciones del año seleccionado               │
│     - Columnas: Info | Fecha | Monto | Descripción | Origen    │
│                                                                 │
│  3. ImportPreviewModal (condicional)                            │
│     - open={showPreviewModal}                                  │
│     - items={previewItems}                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Usuario hace click en botón
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: handleImportEmail()                                     │
│ - Estado: setImportingEmail(true)                              │
│ - Fetch: POST /api/utilities/Agua/import-email/preview         │
│ - Backend:                                                      │
│   1. Valida provider y Gmail connector                         │
│   2. Obtiene emails con gmailService.getEmailsByLabel()        │
│   3. Parsea emails con utilitiesParserService                  │
│   4. Filtra duplicados por gmailMessageId                      │
│   5. Retorna items SIN guardar en BD                           │
│ - Frontend recibe:                                              │
│   {                                                             │
│     success: true,                                              │
│     items: [                                                    │
│       {                                                         │
│         gmailMessageId: "abc123",                              │
│         emailDate: "2026-02-15T10:30:00.000Z",                 │
│         amount: 52153,                                          │
│         description: "Factura Agua - Marzo 2026",              │
│         metadata: { address, accountNumber, ... },             │
│         suggestedPayMonth: "2026-03"  // <-- Parser lo calcula │
│       }                                                         │
│     ]                                                           │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Si items.length > 0
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Abrir Modal de Confirmación                            │
│ - setPreviewItems(result.items)                                │
│ - setShowPreviewModal(true)                                    │
│ - Renderiza: <ImportPreviewModal>                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: ImportPreviewModal.tsx (UX de Confirmación)            │
│                                                                 │
│ Estado Local:                                                   │
│ - selectedDates: Record<gmailMessageId, {payYear, payMonth}>   │
│                                                                 │
│ Inicialización (useEffect):                                    │
│ - Por cada item:                                                │
│   - Si tiene suggestedPayMonth → usarlo                        │
│   - Si no → usar mes/año actual                                │
│                                                                 │
│ UI: RSuite Table con columnas:                                 │
│ ┌──────────────┬────────┬───────────────┬────────┬──────────┐ │
│ │Fecha Correo  │ Monto  │ Descripción   │Año Pago│Mes Pago  │ │
│ ├──────────────┼────────┼───────────────┼────────┼──────────┤ │
│ │15 Feb 26     │$52.153 │Factura Agua...│[2026▼] │[Marzo▼]  │ │
│ │   (read-only)│(r.o)   │(read-only)    │EDITABLE│EDITABLE  │ │
│ └──────────────┴────────┴───────────────┴────────┴──────────┘ │
│                                                                 │
│ Controles:                                                      │
│ - SelectPicker Año: años ±2 desde actual                       │
│ - SelectPicker Mes: 1-12 (Enero-Diciembre en español)          │
│ - Botón: "📌 Aplicar primer mes/año a todos"                   │
│                                                                 │
│ Usuario edita mes/año:                                          │
│ - onChange → handleYearChange() / handleMonthChange()          │
│ - Actualiza: selectedDates[gmailMessageId]                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Usuario hace click: "✅ Confirmar y Guardar"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: handleConfirm() (en ImportPreviewModal)                │
│ - Construye array confirmedItems:                              │
│   - Por cada item:                                              │
│     - Copia: gmailMessageId, emailDate, amount, description    │
│     - Agrega: payYear, payMonth (desde selectedDates)          │
│     - Copia: metadata                                           │
│ - Llama: onConfirm(confirmedItems)                             │
│   → Callback a UtilityProviderPanel.handleConfirmImport()     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: handleConfirmImport() (en UtilityProviderPanel)        │
│ - Fetch: POST /api/utilities/Agua/import-email/confirm         │
│ - Body: { items: confirmedItems }                              │
│ - Backend:                                                      │
│   1. Valida estructura de items                                │
│   2. Filtra duplicados por gmailMessageId                      │
│   3. Por cada item:                                             │
│      - Calcula: transactionDate = new Date(payYear, payMonth-1, 1)│
│      - Agrega al metadata:                                      │
│        * emailDate (preserva fecha del correo)                 │
│        * gmailMessageId (deduplicación)                        │
│        * userSelectedPayMonth (mes elegido por usuario)        │
│   4. Guarda: prisma.utilityTransaction.createMany()           │
│ - Frontend recibe:                                              │
│   {                                                             │
│     success: true,                                              │
│     imported: 2,                                                │
│     message: "Importadas 2 transacciones confirmadas"          │
│   }                                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 6: Post-importación                                       │
│ - showToast("✅ N transacciones importadas", 'success')        │
│ - setShowPreviewModal(false) → Cierra modal                    │
│ - loadTransactions() → Recarga tabla                           │
│ - loadSummaries() → Recarga gráficos                           │
│ - onDataChange?.() → Notifica a página principal               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 7: UtilityTable.tsx (Renderiza transacciones guardadas)   │
│ - Lee transactions[] pasadas como prop                         │
│ - Renderiza tabla HTML (no RSuite Table)                       │
│ - Filas expandibles con metadata                               │
│ - NO permite edición inline de mes/año                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Datos Actual

### 3.1. Estructura de `PreviewItem` (Modal)

**Ubicación:** `ImportPreviewModal.tsx` - Interface

| Campo | Tipo | Propósito | Fuente |
|-------|------|-----------|--------|
| `gmailMessageId` | `string` | ID único del email en Gmail (deduplicación) | Gmail API |
| `emailDate` | `string` (ISO) | Fecha en que llegó el email | Gmail API |
| `amount` | `number` | Monto en CLP | Parser |
| `description` | `string` | Descripción generada | Parser |
| `metadata` | `any` | Datos adicionales (dirección, cuenta, período) | Parser |
| `suggestedPayMonth` | `string \| null` | Mes sugerido por el parser (formato YYYY-MM) | Parser |

### 3.2. Estructura de `selectedDates` (Estado Local)

**Ubicación:** `ImportPreviewModal.tsx` - useState

```typescript
Record<string, { payYear: number; payMonth: number }>
```

**Ejemplo:**
```json
{
  "18df123abc456": { "payYear": 2026, "payMonth": 3 },
  "18df456xyz789": { "payYear": 2026, "payMonth": 2 }
}
```

**Propósito:** Almacenar temporalmente las selecciones de mes/año del usuario **antes** de confirmar.

### 3.3. Estructura de `confirmedItems` (Payload al Backend)

**Ubicación:** `ImportPreviewModal.handleConfirm()` → `UtilityProviderPanel.handleConfirmImport()`

| Campo | Tipo | Propósito | Fuente |
|-------|------|-----------|--------|
| `gmailMessageId` | `string` | ID único del email | previewItem |
| `emailDate` | `string` (ISO) | Fecha del correo | previewItem |
| `payYear` | `number` | Año elegido por usuario | selectedDates |
| `payMonth` | `number` | Mes elegido por usuario (1-12) | selectedDates |
| `amount` | `number` | Monto | previewItem |
| `description` | `string` | Descripción | previewItem |
| `metadata` | `any` | Metadata original | previewItem |

### 3.4. Estructura en Base de Datos (`utility_transactions`)

**Ubicación:** Tabla SQLite - Modelo Prisma

| Campo | Tipo | Valor Final | Cálculo |
|-------|------|-------------|---------|
| `provider_key` | STRING | "Agua" | params.provider |
| `transaction_date` | DATETIME | `2026-03-01 00:00:00` | `new Date(payYear, payMonth-1, 1)` |
| `amount` | FLOAT | 52153 | item.amount |
| `description` | STRING | "Factura Agua - Marzo 2026..." | item.description |
| `source` | STRING | "gmail" | Hardcoded |
| `metadata` | STRING (JSON) | Ver tabla abajo | Ver tabla abajo |

**Estructura de `metadata` (almacenado como JSON string):**

| Campo en metadata | Tipo | Propósito | Fuente |
|-------------------|------|-----------|--------|
| `address` | string | Dirección de la propiedad | Parser |
| `accountNumber` | string | Número de cuenta | Parser |
| `periodStart` | string | Inicio del período facturado (DD/MM/YYYY) | Parser |
| `periodEnd` | string | Fin del período facturado | Parser |
| `payMonth` | string | Mes sugerido por el parser (YYYY-MM) | Parser |
| `gmailMessageId` | string | **ID único para deduplicación** | Gmail API |
| `emailDate` | string (ISO) | **Fecha del correo (auditoría)** | Gmail API |
| `userSelectedPayMonth` | string | **Mes elegido por el usuario (YYYY-MM)** | Modal |

**Ejemplo:**
```json
{
  "address": "LOS PLATANOS 2071-G 42, MACUL",
  "accountNumber": "662836-2",
  "periodStart": "20/01/2026",
  "periodEnd": "17/02/2026",
  "payMonth": "2026-03",
  "gmailMessageId": "18df123abc456",
  "emailDate": "2026-02-15T10:30:00.000Z",
  "userSelectedPayMonth": "2026-03"
}
```

---

## 4. Persistencia

### 4.1. Endpoint de Preview (Solo Lectura)

**Ruta:** `POST /api/utilities/:provider/import-email/preview`  
**Archivo:** `src/routes/utilities.ts` (líneas ~169-266)

**Validaciones:**
- ✅ Provider existe en BD
- ✅ Provider tiene `hasEmailConnector = true`
- ✅ Provider tiene `gmailLabel` configurado
- ✅ Usuario autenticado con Gmail

**Proceso:**
1. Obtiene emails desde Gmail API con `gmailLabel`
2. Parsea emails con `utilitiesParserService.parseMultipleEmails()`
3. Filtra duplicados consultando BD por `gmailMessageId` en metadata
4. Retorna items **sin guardar**

**Response exitoso:**
```json
{
  "success": true,
  "items": [ /* PreviewItem[] */ ],
  "gmailLabel": "Facturación Aguas Andinas",
  "totalFound": 8,
  "duplicates": 3,
  "message": "5 transacciones listas para confirmar"
}
```

### 4.2. Endpoint de Confirmación (Escritura)

**Ruta:** `POST /api/utilities/:provider/import-email/confirm`  
**Archivo:** `src/routes/utilities.ts` (líneas ~268-395)

**Request Body:**
```json
{
  "items": [
    {
      "gmailMessageId": "abc123",
      "emailDate": "2026-02-15T10:30:00.000Z",
      "payYear": 2026,
      "payMonth": 3,
      "amount": 52153,
      "description": "Factura Agua - Marzo 2026",
      "metadata": { /* ... */ }
    }
  ]
}
```

**Validaciones:**
- ✅ `items` es array no vacío
- ✅ Cada item tiene: `gmailMessageId`, `payYear`, `payMonth`, `amount`
- ✅ Provider existe en BD
- ✅ No hay duplicados (verifica `gmailMessageId` nuevamente)

**Proceso:**
1. Filtra items que ya existen en BD
2. Por cada item nuevo:
   - Calcula: `transactionDate = new Date(payYear, payMonth - 1, 1)`
   - Construye metadata enriquecido con:
     - `emailDate` (fecha del correo)
     - `userSelectedPayMonth` (mes elegido por usuario)
     - `gmailMessageId` (deduplicación)
3. Ejecuta: `prisma.utilityTransaction.createMany()`

**Response exitoso:**
```json
{
  "success": true,
  "imported": 2,
  "skipped": 0,
  "mode": "cashflow_actual",
  "message": "Importadas 2 transacciones confirmadas"
}
```

### 4.3. Deduplicación

**Mecanismo:** Comparación de `gmailMessageId` en campo `metadata` (JSON).

**Limitación detectada:** No hay índice en `metadata` → búsqueda full-table-scan.

**Query actual (ineficiente):**
```typescript
const existingTransactions = await prisma.utilityTransaction.findMany({
  where: {
    providerKey: provider,
    source: 'gmail'
  },
  select: {
    metadata: true
  }
});

const existingMessageIds = new Set(
  existingTransactions.map(t => JSON.parse(t.metadata).gmailMessageId)
);
```

---

## 5. Riesgos Detectados

### 5.1. Riesgos Funcionales

| # | Riesgo | Probabilidad | Impacto | Descripción |
|---|--------|--------------|---------|-------------|
| **R1** | **Filas sin mes/año asignado** | Baja | Alto | Si `selectedDates` falla al inicializar, item no tendrá `payYear`/`payMonth` → error al confirmar |
| **R2** | **Modal cerrado sin confirmar** | Alta | Medio | Usuario abre modal, edita fechas, cierra sin confirmar → cambios se pierden (sin warning) |
| **R3** | **Duplicación silenciosa** | Baja | Medio | Si 2 usuarios importan simultáneamente, ambos pasan validación de preview pero uno duplica |
| **R4** | **Mes/año no editable post-import** | Alta | Medio | Usuario no puede corregir mes/año después de guardar → debe eliminar y re-importar |
| **R5** | **Dependencia fuerte del modal** | Media | Alto | Toda la lógica de asignación de mes/año está en modal → no se puede reutilizar en otros flujos |

### 5.2. Riesgos Técnicos

| # | Riesgo | Probabilidad | Impacto | Descripción |
|---|--------|--------------|---------|-------------|
| **R6** | **Estado duplicado** | Media | Bajo | `previewItems` + `selectedDates` → estado espejado puede desincronizarse |
| **R7** | **Parse de metadata ineficiente** | Alta | Bajo | Cada deduplicación hace `JSON.parse()` de toda la tabla → lento con muchas filas |
| **R8** | **useEffect loop potencial** | Baja | Medio | `useEffect` con deps `[items, currentYear, currentMonth]` → re-render innecesario si mes/año cambian |
| **R9** | **Falta validación de rango** | Media | Bajo | SelectPicker permite años fuera de rango razonable (ej: 2099) |
| **R10** | **Sin escape de cierre de modal** | Alta | Alto | No hay `onBeforeClose` que valide si hay cambios sin confirmar |

### 5.3. Riesgos de UX

| # | Riesgo | Probabilidad | Impacto | Descripción |
|---|--------|--------------|---------|-------------|
| **R11** | **Modal bloquea flujo de trabajo** | Alta | Medio | Usuario debe confirmar inmediatamente o perder contexto → no puede "importar y revisar después" |
| **R12** | **No hay preview de cambios** | Media | Bajo | Usuario no ve cómo quedará la tabla antes de confirmar (ej: mes/año en contexto de la fila) |
| **R13** | **Tabla post-import no editable** | Alta | Alto | Usuario ve la fila guardada pero no puede editar `transaction_date` directamente |
| **R14** | **Botón "Aplicar a todos" poco claro** | Media | Bajo | Texto no especifica que copia el **primer** mes/año → confusión |

---

## 6. Oportunidad de Mejora

### 6.1. Propuesta Conceptual: Edición Inline en Tabla

**Contexto:**
- Actualmente: Modal → Editar mes/año → Confirmar → Persistir
- Limitación: No se puede editar después de guardar

**Propuesta:**
1. **Eliminar modal de confirmación**
2. **Agregar transacciones a tabla como "pendientes"** (sin persistir aún)
3. **Permitir edición inline de mes/año** en la tabla
4. **Barra sticky con botón "Guardar Todo"**

### 6.2. Flujo Propuesto (High-Level)

```
┌─────────────────────────────────────────────────────────────────┐
│ Usuario hace click: "📧 Importar (preparar registros)"         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: POST /import-email/preview                              │
│ - Backend retorna items parseados (igual que ahora)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Frontend agrega items a tabla como "pendientes"         │
│ - Estado: pendingTransactions = [...previewItems]              │
│ - Renderiza: UtilityTable con items pendientes + guardados     │
│ - Visual: filas pendientes con fondo amarillo (#fef3c7)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: Usuario edita mes/año INLINE en la tabla                │
│ - Columna "Mes Pago": RSuite SelectPicker inline               │
│ - Columna "Año Pago": RSuite SelectPicker inline               │
│ - onChange → actualiza pendingTransactions[index]              │
│ - Sin persistir aún                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: Barra Sticky aparece cuando hay pendientes              │
│ - Position: fixed bottom con z-index alto                      │
│ - Contenido:                                                    │
│   "⚠️ 3 transacciones pendientes por guardar"                  │
│   [Descartar]  [💾 Guardar Todo]                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Usuario hace click: "Guardar Todo"
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PASO 5: POST /import-email/confirm                              │
│ - Envía: pendingTransactions con mes/año editados              │
│ - Backend: guarda como ahora                                    │
│ - Frontend: limpia pendientes, recarga tabla                    │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3. Ventajas de la Propuesta

| Ventaja | Descripción |
|---------|-------------|
| ✅ **No modal bloqueante** | Usuario puede importar y seguir trabajando |
| ✅ **Edición post-import** | Se puede editar mes/año de **cualquier** transacción (no solo nuevas) |
| ✅ **Vista en contexto** | Usuario ve las filas pendientes junto a las guardadas → mejor decisión |
| ✅ **Batch save** | Puede importar varias veces y guardar todo junto |
| ✅ **Deshacer fácil** | Botón "Descartar" limpia pendientes sin afectar BD |
| ✅ **Reusable** | Mismo patrón puede usarse para edición de filas existentes en futuro |

### 6.4. Cambios Necesarios (Estimación)

**NO implementar ahora.** Solo referencia para futura decisión:

| Archivo | Cambio Estimado |
|---------|-----------------|
| **UtilityProviderPanel.tsx** | Agregar estado `pendingTransactions`, eliminar `showPreviewModal` |
| **UtilityTable.tsx** | Cambiar a RSuite Table, agregar columnas editables con SelectPicker |
| **StickyActionBar.tsx** | Crear nuevo componente para barra sticky |
| **ImportPreviewModal.tsx** | **ELIMINAR** (ya no se usa) |
| **utilities.ts** | Sin cambios (endpoints son compatibles) |

### 6.5. Riesgos de la Propuesta

| Riesgo | Mitigación |
|--------|------------|
| **Tabla más compleja** | Usar RSuite Table con `<Cell>` editables |
| **Estado pendiente grande** | Limitar a 50 items pendientes máximo |
| **Usuario cierra tab sin guardar** | `beforeunload` warning si hay pendientes |
| **Confusión visual** | Colores claros: amarillo para pendientes, blanco para guardadas |

---

## 7. Conclusiones

### 7.1. Estado Actual (Resumen)

✅ **Funcionando:**
- Importación desde Gmail con preview
- Asignación de mes/año antes de guardar
- Deduplicación por `gmailMessageId`
- Metadata enriquecido con fecha de email y selección de usuario

❌ **Limitaciones:**
- Modal bloquea flujo de trabajo
- No se puede editar mes/año después de guardar
- Tabla post-import no es editable
- Formato de tabla es HTML plano (no RSuite)

### 7.2. Recomendación

**Corto plazo:** Mantener flujo actual (estable y funcional).

**Mediano plazo:** Evaluar propuesta de edición inline si:
- Usuarios reportan necesidad de editar mes/año después de importar
- Se requiere edición masiva de transacciones existentes
- Se planea agregar más campos editables (ej: monto, descripción)

**Largo plazo:** Migrar a RSuite Table con edición inline para consistencia con resto de la app.

---

## Anexo: Puntos de Integración Identificados

### A.1. Página Principal: ActualUtilities.tsx

**Componente raíz:** `ActualUtilities.tsx`  
**Layout:** `MainLayout` + `PageTitleSection` + Card con Nav Tabs  
**Punto ideal para integración:** Renderiza `<UtilityProviderPanel>` según tab activo.

**Posible mejora futura:**
- Agregar botón global "💾 Guardar Cambios Pendientes" en PageTitleSection
- Estado compartido de `pendingTransactions` a nivel de página

### A.2. Tabla Principal: UtilityTable.tsx

**Tipo actual:** Tabla HTML plana (`<table>`, `<tr>`, `<td>`)  
**Características:**
- Filas expandibles con metadata
- Botón de eliminar por fila
- No usa RSuite Table

**Punto ideal para edición inline:**
- Migrar a `<Table>` de RSuite
- Agregar columnas:
  - `<Cell>` con SelectPicker para año
  - `<Cell>` con SelectPicker para mes
- Estado de edición: `editMode` por fila

### A.3. Modal de Preview: ImportPreviewModal.tsx

**Estado:** Completamente funcional, listo para uso.

**Posible deprecación futura:** Si se implementa edición inline en tabla, este modal ya no sería necesario.

---

**Fin de la Auditoría**
