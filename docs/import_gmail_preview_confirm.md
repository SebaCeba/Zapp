# Flujo Preview/Confirm para Importación desde Gmail

**Fecha:** 27 de febrero de 2026  
**Autor:** System  
**Versión:** 2.0

---

## 📋 Resumen

Implementación del flujo de dos pasos (preview → confirm) para importación de transacciones desde Gmail. Permite al usuario revisar y ajustar el mes/año de pago antes de guardar en la base de datos.

---

## 🎯 Motivación del Cambio

### Problema Anterior (v1.0)

En la versión original, el flujo era directo:
1. Usuario hace click en "Importar desde Gmail"
2. Backend parsea emails y guarda inmediatamente en DB
3. `transaction_date` se calculaba automáticamente desde `payMonth` del parser

**Limitaciones:**
- ❌ Usuario no podía revisar ni ajustar la fecha antes de guardar
- ❌ Si el parser calculaba mal el `payMonth`, no había forma de corregirlo sin editar la DB
- ❌ No había oportunidad de validar visualmente los datos parseados

### Solución Nueva (v2.0)

Flujo de dos pasos con modal de confirmación:
1. Usuario hace click en "Importar (preparar registros)"
2. Backend parsea emails y retorna **preview** (NO guarda)
3. Modal muestra tabla con datos parseados
4. Usuario selecciona mes/año de pago por cada transacción (con sugerencia del parser)
5. Usuario confirma → Backend guarda con las fechas elegidas

**Ventajas:**
- ✅ Usuario revisa datos antes de guardar
- ✅ Puede ajustar mes/año de pago manualmente
- ✅ Puede aplicar mismo mes/año a todos los registros de un lote
- ✅ Fecha del email se preserva en metadata para auditoría

---

## 🔌 API Endpoints

### 1. POST /api/utilities/:provider/import-email/preview

**Propósito:** Obtener lista de transacciones parseadas desde Gmail SIN guardar en BD.

**Request:**
```http
POST /api/utilities/Agua/import-email/preview
Content-Type: application/json
```

**Response (200 OK):**
```json
{
  "success": true,
  "items": [
    {
      "gmailMessageId": "18df123abc456",
      "emailDate": "2026-02-15T10:30:00.000Z",
      "amount": 52153,
      "description": "Factura Agua - Marzo 2026 (Cuenta: 662836-2)",
      "metadata": {
        "address": "LOS PLATANOS 2071-G 42, MACUL",
        "accountNumber": "662836-2",
        "periodStart": "20/01/2026",
        "periodEnd": "17/02/2026",
        "payMonth": "2026-03",
        "gmailMessageId": "18df123abc456",
        "emailDate": "2026-02-15T10:30:00.000Z"
      },
      "suggestedPayMonth": "2026-03"
    },
    {
      "gmailMessageId": "18df456xyz789",
      "emailDate": "2026-01-18T14:20:00.000Z",
      "amount": 48000,
      "description": "Factura Agua - Febrero 2026 (Cuenta: 662836-2)",
      "metadata": {
        "address": "LOS PLATANOS 2071-G 42, MACUL",
        "accountNumber": "662836-2",
        "periodStart": "18/12/2025",
        "periodEnd": "15/01/2026",
        "payMonth": "2026-02",
        "gmailMessageId": "18df456xyz789",
        "emailDate": "2026-01-18T14:20:00.000Z"
      },
      "suggestedPayMonth": "2026-02"
    }
  ],
  "gmailLabel": "Agua/Facturas",
  "totalFound": 5,
  "duplicates": 3,
  "message": "2 transacciones listas para confirmar"
}
```

**Campos del Item:**
- `gmailMessageId` (string): ID único del email en Gmail
- `emailDate` (string ISO): Fecha en que llegó el email
- `amount` (number): Monto en CLP
- `description` (string): Descripción generada por el parser
- `metadata` (object): Datos adicionales parseados (dirección, cuenta, período, etc.)
- `suggestedPayMonth` (string | null): Mes sugerido por el parser (formato YYYY-MM)

**Deduplicación:**
- Verifica `gmailMessageId` contra transacciones existentes en DB
- Filtra automáticamente duplicados
- Retorna solo items nuevos en `items[]`

---

### 2. POST /api/utilities/:provider/import-email/confirm

**Propósito:** Guardar transacciones con mes/año de pago elegido por el usuario.

**Request:**
```http
POST /api/utilities/Agua/import-email/confirm
Content-Type: application/json

{
  "items": [
    {
      "gmailMessageId": "18df123abc456",
      "emailDate": "2026-02-15T10:30:00.000Z",
      "payYear": 2026,
      "payMonth": 3,
      "amount": 52153,
      "description": "Factura Agua - Marzo 2026 (Cuenta: 662836-2)",
      "metadata": {
        "address": "LOS PLATANOS 2071-G 42, MACUL",
        "accountNumber": "662836-2",
        "periodStart": "20/01/2026",
        "periodEnd": "17/02/2026",
        "payMonth": "2026-03",
        "gmailMessageId": "18df123abc456",
        "emailDate": "2026-02-15T10:30:00.000Z"
      }
    }
  ]
}
```

**Validaciones:**
- `items` debe ser array no vacío
- Cada item debe tener: `gmailMessageId`, `payYear`, `payMonth`, `amount`
- Se valida nuevamente contra duplicados (por `gmailMessageId`)

**Response (201 Created):**
```json
{
  "success": true,
  "imported": 2,
  "skipped": 0,
  "mode": "cashflow_actual",
  "message": "Importadas 2 transacciones confirmadas"
}
```

**Lógica de Guardado:**
```typescript
// Crear transactionDate = primer día del mes elegido
const transactionDate = new Date(payYear, payMonth - 1, 1);

// Agregar emailDate y selección de usuario al metadata
const metadata = {
  ...item.metadata,
  emailDate: item.emailDate,
  gmailMessageId: item.gmailMessageId,
  userSelectedPayMonth: `${payYear}-${String(payMonth).padStart(2, '0')}`
};

// Guardar en utility_transactions
await prisma.utilityTransaction.create({
  data: {
    providerKey: provider,
    transactionDate,      // Primer día del mes elegido
    amount: item.amount,
    description: item.description,
    source: 'gmail',
    metadata: JSON.stringify(metadata)
  }
});
```

---

### 3. POST /api/utilities/:provider/import-email (DEPRECATED)

**Status:** 410 Gone

**Response:**
```json
{
  "error": "Endpoint deprecado. Usar /import-email/preview seguido de /import-email/confirm"
}
```

---

## 📊 Estructura de Datos

### Modelo `utility_transactions`

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `provider_key` | STRING | FK a ServicioBasico.nombre | "Agua" |
| `transaction_date` | DATETIME | **Primer día del mes elegido por usuario** | 2026-03-01 00:00:00 |
| `amount` | FLOAT | Monto en CLP | 52153 |
| `description` | STRING | Descripción generada | "Factura Agua - Marzo 2026..." |
| `source` | STRING | "gmail" | "gmail" |
| `metadata` | STRING (JSON) | Ver estructura abajo | {...} |

### Estructura JSON de `metadata` (Versión 2.0)

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

**Campos clave:**
- `emailDate` (string ISO): **Fecha del correo** → dato fuente, nunca cambia
- `payMonth` (string YYYY-MM): Mes sugerido por el parser (si aplica)
- `userSelectedPayMonth` (string YYYY-MM): **Mes elegido por el usuario** en el modal
- `gmailMessageId` (string): ID único para deduplicación

**¿Por qué guardar tanto `emailDate` como `userSelectedPayMonth`?**
- `emailDate`: **Auditoría** - cuándo llegó el email original
- `userSelectedPayMonth`: **Trazabilidad** - qué mes eligió el usuario (puede diferir de `payMonth` sugerido)
- `transaction_date`: **Flujo de caja** - fecha efectiva usada para reportes mensuales

---

## 🎨 Frontend: Flujo UX

### 1. UtilityProviderPanel.tsx

**Cambios:**
- Botón: "📧 Importar (preparar registros)"
- Al hacer click:
  1. Llama a `POST /import-email/preview`
  2. Si hay items, abre `ImportPreviewModal`
  3. Si no hay items, muestra toast informativo

```tsx
const handleImportEmail = async () => {
  setImportingEmail(true);
  const response = await fetch(`/api/utilities/${provider}/import-email/preview`, {
    method: 'POST'
  });
  const result = await response.json();
  
  if (result.items?.length > 0) {
    setPreviewItems(result.items);
    setShowPreviewModal(true);
  } else {
    showToast(result.message || 'No hay transacciones nuevas', 'info');
  }
  setImportingEmail(false);
};
```

### 2. ImportPreviewModal.tsx (NUEVO)

**Componente:** Modal con tabla RSuite.

**Características:**
- Tabla con columnas:
  - Fecha Correo (read-only)
  - Monto (read-only)
  - Descripción (read-only)
  - Año Pago (SelectPicker)
  - Mes Pago (SelectPicker)
  
- Botón "📌 Aplicar primer mes/año a todos":
  - Copia la selección de la primera fila a todas las demás
  - Útil cuando todas las boletas son del mismo mes

- Botón "✅ Confirmar y Guardar (N)":
  - Llama a `onConfirm(confirmedItems)`
  - `confirmedItems` = items con `payYear` y `payMonth` seleccionados

**Estado inicial:**
- Si `suggestedPayMonth` existe, lo usa como valor inicial
- Si no, usa mes/año actual

```tsx
const [selectedDates, setSelectedDates] = useState(() => {
  const initial = {};
  items.forEach(item => {
    if (item.suggestedPayMonth) {
      const [year, month] = item.suggestedPayMonth.split('-').map(Number);
      initial[item.gmailMessageId] = { payYear: year, payMonth: month };
    } else {
      initial[item.gmailMessageId] = { 
        payYear: currentYear, 
        payMonth: currentMonth 
      };
    }
  });
  return initial;
});
```

### 3. Confirmación

Al hacer click en "Confirmar y Guardar":
1. Modal construye payload con items confirmados
2. Llama a `onConfirm(confirmedItems)`
3. `UtilityProviderPanel` llama a `POST /import-email/confirm`
4. Si exitoso:
   - Muestra toast "✅ N transacciones importadas"
   - Cierra modal
   - Recarga transacciones (`loadTransactions()`)

---

## 🔄 Cálculo de `transaction_date`

### Regla Principal

> **`transaction_date` = primer día del mes elegido por el usuario**

### Implementación (Backend)

```typescript
const transactionDate = new Date(payYear, payMonth - 1, 1);
```

**Ejemplos:**
- Usuario elige: Año 2026, Mes 3 (Marzo)
  - `transaction_date` = `2026-03-01 00:00:00`

- Usuario elige: Año 2025, Mes 12 (Diciembre)
  - `transaction_date` = `2025-12-01 00:00:00`

### ¿Por qué primer día del mes?

- **Compatibilidad:** El sistema de reportes agrupa por mes/año usando `transaction_date`
- **Simplicidad:** No se necesita día exacto para flujo de caja mensual
- **Consistencia:** Todas las transacciones del mismo mes tienen prefijo de fecha idéntico

---

## 🔍 Deduplicación por `gmailMessageId`

### Estrategia

**ID Único:** `gmailMessageId` (proporcionado por Gmail API).

**Proceso:**
1. En `/preview`:
   - Consulta DB: transacciones con `source='gmail'` del mismo provider
   - Extrae `gmailMessageId` del campo `metadata` (JSON)
   - Filtra items del preview que ya existen

2. En `/confirm`:
   - Vuelve a verificar contra DB (por si hubo imports concurrentes)
   - Solo guarda items cuyo `gmailMessageId` no existe

### Query de Verificación

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
  existingTransactions
    .map(t => {
      try {
        const meta = JSON.parse(t.metadata);
        return meta.gmailMessageId;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

// Filtrar duplicados
const newItems = items.filter(item => 
  !existingMessageIds.has(item.gmailMessageId)
);
```

---

## 📝 Ejemplo Completo de Flujo

### Paso 1: Usuario hace click en botón

**UI:** Botón "📧 Importar (preparar registros)" en `UtilityProviderPanel`

### Paso 2: Backend retorna preview

**Request:**
```http
POST /api/utilities/Agua/import-email/preview
```

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "gmailMessageId": "abc123",
      "emailDate": "2026-02-15T10:30:00.000Z",
      "amount": 52153,
      "description": "Factura Agua - Marzo 2026",
      "suggestedPayMonth": "2026-03",
      "metadata": { ... }
    }
  ],
  "totalFound": 1,
  "duplicates": 0
}
```

### Paso 3: Modal se abre con tabla

**Vista:**
```
┌────────────────────────────────────────────────────────────┐
│ Confirmar Importación - Agua                               │
├────────────────────────────────────────────────────────────┤
│ 📋 1 transacción encontrada                               │
│ 💡 Importante: Selecciona el mes/año en que registrarás  │
│    cada pago en tu flujo de caja "Actual".                │
│                                                            │
│ [📌 Aplicar primer mes/año a todos]                       │
│                                                            │
│ ┌───────────┬────────┬─────────────┬───────┬──────────┐  │
│ │Fecha Email│ Monto  │ Descripción │ Año   │ Mes Pago │  │
│ ├───────────┼────────┼─────────────┼───────┼──────────┤  │
│ │15 Feb 26  │$52.153 │Factura Agua │[2026▼]│[Marzo▼]  │  │
│ └───────────┴────────┴─────────────┴───────┴──────────┘  │
│                                                            │
│ [Cancelar]              [✅ Confirmar y Guardar (1)]      │
└────────────────────────────────────────────────────────────┘
```

### Paso 4: Usuario revisa y confirma

- Usuario ve que sugiere "2026-03 (Marzo)"
- Decide cambiarlo a "2026-04 (Abril)"
- Selecciona Año: 2026, Mes: Abril
- Click en "Confirmar y Guardar"

### Paso 5: Frontend envía confirmación

**Request:**
```http
POST /api/utilities/Agua/import-email/confirm
Content-Type: application/json

{
  "items": [
    {
      "gmailMessageId": "abc123",
      "emailDate": "2026-02-15T10:30:00.000Z",
      "payYear": 2026,
      "payMonth": 4,
      "amount": 52153,
      "description": "Factura Agua - Marzo 2026",
      "metadata": { ... }
    }
  ]
}
```

### Paso 6: Backend guarda en DB

```sql
INSERT INTO utility_transactions (
  provider_key,
  transaction_date,
  amount,
  description,
  source,
  metadata
) VALUES (
  'Agua',
  '2026-04-01 00:00:00',  -- Primer día del mes elegido
  52153,
  'Factura Agua - Marzo 2026',
  'gmail',
  '{
    "emailDate": "2026-02-15T10:30:00.000Z",
    "userSelectedPayMonth": "2026-04",
    "gmailMessageId": "abc123",
    ...
  }'
);
```

### Paso 7: UI actualiza

- Modal se cierra
- Toast: "✅ 1 transacción importada"
- Tabla de transacciones se recarga
- Transacción aparece en columna "Abril 2026"

---

## 🎯 Ventajas del Nuevo Flujo

### 1. Control del Usuario
- ✅ Usuario decide cuándo registrar cada pago
- ✅ Puede corregir sugerencias automáticas del parser
- ✅ Puede agrupar múltiples boletas en un solo mes

### 2. Flexibilidad
- ✅ Parser sugiere `payMonth` pero no lo impone
- ✅ Usuario puede mover pagos entre meses si cambió estrategia de flujo de caja
- ✅ Funciona incluso si parser no puede calcular `payMonth`

### 3. Auditoría Completa
- ✅ `emailDate` preserva fecha original del correo
- ✅ `userSelectedPayMonth` registra decisión del usuario
- ✅ `payMonth` (del parser) queda para referencia

### 4. UX Mejorada
- ✅ Vista previa antes de guardar
- ✅ Botón "Aplicar a todos" para lotes
- ✅ Tabla clara con toda la información

---

## 🔧 Compatibilidad

### Modelo de Datos
- ✅ No requiere cambios en schema Prisma
- ✅ `metadata` ya es JSON string (extensible)
- ✅ `transaction_date` sigue siendo primer día del mes

### Sistema de Reportes
- ✅ Reportes mensuales siguen usando `transaction_date` sin cambios
- ✅ Agrupación por mes/año funciona igual que antes
- ✅ Totales anuales no se ven afectados

### Parsers Existentes
- ✅ Parser de Aguas Andinas sigue calculando `payMonth`
- ✅ Parser genérico funciona sin cambios
- ✅ Nuevos parsers pueden omitir `payMonth` (usuario elegirá manualmente)

---

## 📊 Métricas y Logs

### Logs del Backend

**Preview:**
```
📧 Preview de Gmail label: "Agua/Facturas" para provider: Agua
📬 Encontrados 5 emails con label "Agua/Facturas"
✅ Parseados 5/5 emails de Agua
✅ 2 items para preview (3 duplicados ignorados)
```

**Confirm:**
```
✅ Confirmadas 2 transacciones para Agua
```

### Respuestas API

**Preview exitoso:**
```json
{
  "success": true,
  "items": [...],
  "totalFound": 5,
  "duplicates": 3,
  "message": "2 transacciones listas para confirmar"
}
```

**Confirm exitoso:**
```json
{
  "success": true,
  "imported": 2,
  "skipped": 0,
  "mode": "cashflow_actual",
  "message": "Importadas 2 transacciones confirmadas"
}
```

---

## 🔄 Migración desde v1.0

### ¿Qué cambió?

| Aspecto | v1.0 (Anterior) | v2.0 (Actual) |
|---------|-----------------|---------------|
| Endpoint | `POST /import-email` (directo) | `POST /import-email/preview` + `/confirm` |
| Flujo | Un solo paso (guardar inmediato) | Dos pasos (preview → confirm) |
| `transaction_date` | Calculado por parser | Elegido por usuario en modal |
| `emailDate` | No guardado | Guardado en metadata |
| UX | Sin vista previa | Modal con tabla editable |

### Datos Existentes

- ✅ Transacciones importadas con v1.0 siguen funcionando
- ✅ NO tienen `emailDate` en metadata (campo opcional)
- ✅ NO tienen `userSelectedPayMonth` (campo opcional)
- ⚠️ No se puede saber si fueron ajustadas manualmente o automáticas

### Endpoint Deprecado

- `POST /api/utilities/:provider/import-email` retorna HTTP 410 Gone
- Frontend debe actualizar a `/preview` + `/confirm`

---

## 📞 Troubleshooting

### ¿Qué pasa si cierro el modal sin confirmar?

- ❌ Nada se guarda
- ✅ Puedes volver a hacer click en "Importar" y aparecerán los mismos items

### ¿Puedo importar el mismo email dos veces?

- ❌ No, deduplicación por `gmailMessageId`
- ✅ Si ya existe, se filtra automáticamente en `/preview`

### ¿Qué pasa si cambio de opinión sobre el mes de pago?

- ⚠️ Una vez confirmado y guardado, no hay UI para editarlo
- 🔧 Solución temporal: eliminar transacción y volver a importar
- 🔮 Futuro: agregar UI de edición de `transaction_date`

### ¿El parser puede sugerir mes incorrecto?

- ✅ Sí, por eso el modal permite ajustar
- ✅ Usuario tiene control final

---

## 📁 Archivos Afectados

### Backend
1. **node-version/src/routes/utilities.ts**
   - ✅ Creado: `POST /import-email/preview`
   - ✅ Creado: `POST /import-email/confirm`
   - ✅ Deprecado: `POST /import-email` (retorna 410)

2. **node-version/src/services/utilities-parser.service.ts**
   - ✅ Modificado: `parseMultipleEmails()` agrega `emailDate` a metadata

### Frontend
3. **node-version/client/src/components/utilities/UtilityProviderPanel.tsx**
   - ✅ Modificado: `handleImportEmail()` llama a `/preview`
   - ✅ Agregado: `handleConfirmImport()` llama a `/confirm`
   - ✅ Agregado: Estado `showPreviewModal` y `previewItems`
   - ✅ Agregado: Render de `<ImportPreviewModal>`

4. **node-version/client/src/components/utilities/ImportPreviewModal.tsx** (NUEVO)
   - ✅ Creado: Modal con tabla RSuite
   - ✅ SelectPicker para año/mes por fila
   - ✅ Botón "Aplicar a todos"
   - ✅ Manejo de confirmación

5. **node-version/client/src/components/utilities/UtilityImportCard.tsx**
   - ✅ Modificado: Texto del botón → "Importar (preparar registros)"

### Documentación
6. **docs/import_gmail_preview_confirm.md** (ESTE ARCHIVO)
   - ✅ Creado: Documentación completa del flujo

---

**Fin de la documentación**
