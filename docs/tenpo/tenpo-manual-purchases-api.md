# API: Compras Tenpo Manuales

**Fecha:** 2026-02-01  
**Endpoint:** POST /api/tenpo/purchases/manual  
**Objetivo:** Crear compras Tenpo sin origen en emails de Gmail, generando cuotas con la misma lógica del flujo automático.

---

## Endpoint: POST /api/tenpo/purchases/manual

### Request

**URL:** `POST /api/tenpo/purchases/manual`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```typescript
{
  "purchaseDate": string,         // YYYY-MM-DD (requerido)
  "merchant": string,             // Nombre del comercio (requerido)
  "amountTotalClp": number,       // Monto total en CLP (requerido, > 0)
  "installmentsCount": number,    // Número de cuotas (requerido, >= 1)
  "tieneInteres": boolean,        // Si aplica interés (opcional, default: true)
  "scheduleMode": string,         // "AUTO" | "MANUAL" (opcional, default: "AUTO")
  "firstDueDateOverride": string  // YYYY-MM-DD (opcional, requerido si scheduleMode="MANUAL")
}
```

**Validaciones:**
- `purchaseDate`: Fecha válida en formato ISO (YYYY-MM-DD)
- `merchant`: String no vacío
- `amountTotalClp`: Número > 0
- `installmentsCount`: Entero >= 1
- `scheduleMode`: Solo "AUTO" o "MANUAL"
- Si `scheduleMode = "MANUAL"`, `firstDueDateOverride` es obligatorio

### Response

**Status:** 201 Created

**Body:**
```typescript
{
  "id": number,
  "emailId": null,
  "source": "manual",
  "purchaseDate": string,          // ISO datetime
  "merchant": string,
  "amountTotalClp": number,
  "installmentsCount": number,
  "tieneInteres": boolean,
  "modoMonto": "ESTIMADO",
  "totalFinanciadoEstimado": number,
  "interesTotalEstimado": number,
  "metadata": null,
  "scheduleMode": string,
  "firstDueDateOverride": string | null,
  "createdAt": string,             // ISO datetime
  "updatedAt": string,             // ISO datetime
  "installments": [
    {
      "id": number,
      "purchaseId": number,
      "installmentNumber": number,  // 1, 2, 3, ...
      "baseAmountClp": number,
      "dueDate": string,            // ISO datetime (fecha de vencimiento)
      "payDateEstimated": string,   // ISO datetime
      "estado": "ESTIMADO",
      "overrideInterestRate": null,
      "overrideMonthlyAmountClp": null,
      "finalMonthlyAmountClp": number,  // Monto final a pagar
      "createdAt": string,
      "updatedAt": string
    }
    // ... resto de cuotas
  ]
}
```

### Errores

**400 Bad Request:**
```json
{
  "error": "Campos requeridos: purchaseDate, merchant, amountTotalClp, installmentsCount"
}
```

```json
{
  "error": "amountTotalClp debe ser mayor a 0"
}
```

```json
{
  "error": "installmentsCount debe ser entero >= 1"
}
```

```json
{
  "error": "scheduleMode debe ser AUTO o MANUAL"
}
```

```json
{
  "error": "scheduleMode MANUAL requiere firstDueDateOverride"
}
```

```json
{
  "error": "purchaseDate inválida"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message"
}
```

---

## Lógica de Creación

### 1. Validación de Campos
- Verifica presencia de campos requeridos
- Valida rangos (amountTotalClp > 0, installmentsCount >= 1)
- Valida formato de fechas (ISO)
- Valida coherencia scheduleMode + firstDueDateOverride

### 2. Obtención de Tasa
```typescript
const tasaConfig = await tenpoConfigService.getTasaVigente(purchaseDate);
const tasaMensual = tasaConfig?.tasaMensual || 0.0211; // Fallback 2.11%
```

### 3. Cálculo de Primera Fecha de Vencimiento

**Modo AUTO (default):**
```typescript
primeraFechaVencimiento = tenpoParserService.calculateDueDate(purchaseDate);
```
- Sistema calcula automáticamente según reglas Tenpo (día 5 del mes siguiente, ajustando fin de semana)

**Modo MANUAL:**
```typescript
primeraFechaVencimiento = new Date(firstDueDateOverride);
```
- Usuario especifica explícitamente la fecha de primera cuota

### 4. Generación de Cuotas

**Servicio:**
```typescript
const { cuotas, totalFinanciado, interesTotal } = tenpoCalculatorService.generarCalendarioCuotas(
  amountTotalClp,
  installmentsCount,
  primeraFechaVencimiento,
  tieneInteres,
  tasaMensual,
  null  // feePct: null por defecto
);
```

**Resultado:**
- Array `cuotas`: montos mensuales calculados (n elementos)
- `totalFinanciado`: capital + interés total
- `interesTotal`: interés acumulado de todas las cuotas

**Método de cálculo:** TenpoAddOnV1 (interés simple add-on)
- Igual al usado en flujo Gmail automático
- Garantiza consistencia entre compras manuales y automáticas

### 5. Creación en Base de Datos

**TenpoPurchase:**
- `emailId = null` (sin origen Gmail)
- `source = "manual"` (identificador de origen)
- `modoMonto = "ESTIMADO"` (calculado, no confirmado con banco)
- Resto de campos según input

**TenpoInstallment (n registros):**
- `installmentNumber`: 1, 2, 3, ..., n
- `dueDate`: primeraFechaVencimiento + (installmentNumber - 1) meses
- `finalMonthlyAmountClp`: monto de la cuota (calculado con interés)
- `estado = "ESTIMADO"`

---

## Compatibilidad con Flujo Gmail

### Endpoints GET Existentes

**GET /api/tenpo/purchases**
- ✅ Incluye compras manuales (no filtra por emailId)
- Response incluye campo `source: "gmail" | "manual"`
- Campo `email` será null para compras manuales

**GET /api/tenpo/installments?year=YYYY&month=M**
- ✅ Incluye cuotas de compras manuales
- Filtra solo por `dueDate`, no por origen de compra
- Totalización funciona igual para ambos orígenes

**GET /api/tenpo/forecast?months=12**
- ✅ Incluye proyección de compras manuales
- Suma todas las cuotas por mes, independiente del source

### Endpoint POST /api/tenpo/sync

**Sin cambios:**
- Sigue creando `emailId` (no null)
- Sigue usando `source = "gmail"` (default)
- Lógica de sincronización no afectada
- No hay conflicto con compras manuales

### Diferencias Clave

| Aspecto | Gmail (Automático) | Manual |
|---------|-------------------|--------|
| `source` | "gmail" | "manual" |
| `emailId` | ID válido | null |
| `email` (relación) | TenpoEmail object | null |
| Creación | POST /api/tenpo/sync | POST /api/tenpo/purchases/manual |
| Parsing | tenpoParserService.parsePurchaseEmail() | Validación directa de request body |
| Origen de datos | rawBody de Gmail API | Input manual del usuario |

### Similitudes (Garantizadas)

| Aspecto | Implementación Común |
|---------|---------------------|
| Cálculo de cuotas | tenpoCalculatorService.generarCalendarioCuotas() |
| Fecha de vencimiento | tenpoParserService.calculateDueDate() (modo AUTO) |
| Tasa de interés | tenpoConfigService.getTasaVigente() |
| Estructura de cuotas | TenpoInstallment con dueDate + finalMonthlyAmountClp |
| Totalización mensual | Agrupación por dueDate, suma de finalMonthlyAmountClp |

---

## Ejemplos de Uso

### Ejemplo 1: Compra en 3 cuotas con interés (AUTO)

**Request:**
```http
POST /api/tenpo/purchases/manual
Content-Type: application/json

{
  "purchaseDate": "2026-01-15",
  "merchant": "Tienda XYZ",
  "amountTotalClp": 30000,
  "installmentsCount": 3,
  "tieneInteres": true
}
```

**Response:**
```json
{
  "id": 42,
  "emailId": null,
  "source": "manual",
  "purchaseDate": "2026-01-15T00:00:00.000Z",
  "merchant": "Tienda XYZ",
  "amountTotalClp": 30000,
  "installmentsCount": 3,
  "tieneInteres": true,
  "modoMonto": "ESTIMADO",
  "totalFinanciadoEstimado": 31899,
  "interesTotalEstimado": 1899,
  "scheduleMode": "AUTO",
  "firstDueDateOverride": null,
  "installments": [
    {
      "id": 101,
      "installmentNumber": 1,
      "dueDate": "2026-02-05T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    },
    {
      "id": 102,
      "installmentNumber": 2,
      "dueDate": "2026-03-05T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    },
    {
      "id": 103,
      "installmentNumber": 3,
      "dueDate": "2026-04-05T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    }
  ]
}
```

**Efecto en totales mensuales:**
- Febrero 2026: +$10,633
- Marzo 2026: +$10,633
- Abril 2026: +$10,633

### Ejemplo 2: Compra en 1 cuota sin interés

**Request:**
```http
POST /api/tenpo/purchases/manual
Content-Type: application/json

{
  "purchaseDate": "2026-02-01",
  "merchant": "Restaurant ABC",
  "amountTotalClp": 15000,
  "installmentsCount": 1,
  "tieneInteres": false
}
```

**Response:**
```json
{
  "id": 43,
  "source": "manual",
  "amountTotalClp": 15000,
  "installmentsCount": 1,
  "tieneInteres": false,
  "totalFinanciadoEstimado": 15000,
  "interesTotalEstimado": 0,
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-03-05T00:00:00.000Z",
      "finalMonthlyAmountClp": 15000
    }
  ]
}
```

**Efecto en totales mensuales:**
- Marzo 2026: +$15,000

### Ejemplo 3: Compra con calendario manual

**Request:**
```http
POST /api/tenpo/purchases/manual
Content-Type: application/json

{
  "purchaseDate": "2026-01-20",
  "merchant": "Farmacia DEF",
  "amountTotalClp": 60000,
  "installmentsCount": 6,
  "tieneInteres": true,
  "scheduleMode": "MANUAL",
  "firstDueDateOverride": "2026-03-10"
}
```

**Response:**
```json
{
  "id": 44,
  "source": "manual",
  "scheduleMode": "MANUAL",
  "firstDueDateOverride": "2026-03-10T00:00:00.000Z",
  "installments": [
    {
      "installmentNumber": 1,
      "dueDate": "2026-03-10T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    },
    {
      "installmentNumber": 2,
      "dueDate": "2026-04-10T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    },
    // ... cuotas 3-5
    {
      "installmentNumber": 6,
      "dueDate": "2026-08-10T00:00:00.000Z",
      "finalMonthlyAmountClp": 10633
    }
  ]
}
```

**Nota:** Primera cuota cae el día 10 (no el día 5), según override manual.

---

## Notas de Implementación

### Campos Calculados vs Almacenados

**Almacenados en DB:**
- `totalFinanciadoEstimado`: Suma de todas las cuotas
- `interesTotalEstimado`: Interés total acumulado
- `finalMonthlyAmountClp`: Monto final de cada cuota (incluye interés)

**Calculados on-the-fly:**
- `feePct`, `feeAmountClp`, `financedBaseClp`: En GET /api/tenpo/purchases (si existe metadata)

### Recalculación de Cuotas

Las compras manuales son editables como las de Gmail:
- PATCH /api/tenpo/purchases/:id/interes → Toggle interés
- POST /api/tenpo/purchases/:id/confirmar-real → Modo REAL
- PATCH /api/tenpo/purchases/:id/schedule → Cambiar calendario

**Restricción:** Solo compras en modo ESTIMADO son recalculables.

### Integración con Actual vs Presupuesto

Las cuotas de compras manuales:
- ✅ Se incluyen en GET /api/tenpo/installments
- ✅ Se totalizan por `dueDate` (fecha contable)
- ✅ Aparecerán en categoría TENPO cuando se implemente (ver docs/tenpo-manual-purchases-audit.md)

---

## Resumen

**Funcionalidad implementada:**
- ✅ Endpoint POST /api/tenpo/purchases/manual
- ✅ Validaciones completas de input
- ✅ Generación de cuotas con lógica existente (tenpoCalculatorService)
- ✅ Almacenamiento con source="manual" y emailId=null
- ✅ Compatibilidad total con endpoints GET existentes
- ✅ No afecta flujo de sincronización Gmail

**Uso recomendado:**
- Compras no detectadas por Gmail (comercios sin notificación)
- Ajustes manuales de cuotas
- Proyección de compras futuras
- Testing de escenarios sin necesidad de emails reales
