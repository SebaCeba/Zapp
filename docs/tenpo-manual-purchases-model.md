# Modelo de Compras Manuales Tenpo

**Fecha:** 2026-02-01  
**Objetivo:** Permitir creación de compras Tenpo sin origen en emails de Gmail, manteniendo compatibilidad con sincronización automática.

---

## Cambios en el Modelo TenpoPurchase

### Campo `emailId` (ahora nullable)

**Antes:**
```prisma
emailId  Int  @map("email_id")
```

**Después:**
```prisma
emailId  Int?  @map("email_id")
```

**Razón:**
- Las compras sincronizadas desde Gmail requieren emailId (FK a TenpoEmail)
- Las compras creadas manualmente NO tienen email asociado
- Al hacer nullable, ambos flujos son posibles

**Implicaciones:**
- Relación con TenpoEmail cambia de `TenpoEmail` a `TenpoEmail?` (opcional)
- onDelete: Cascade se mantiene → si se borra el email, se borra la compra (solo para compras gmail)
- Queries deben considerar `emailId IS NULL` para filtrar compras manuales

### Campo `source` (nuevo)

**Definición:**
```prisma
source  String  @default("gmail")  // gmail | manual
```

**Valores permitidos:**
- `"gmail"`: Compra sincronizada desde Gmail via /api/tenpo/sync
- `"manual"`: Compra creada manualmente por el usuario

**Default:** `"gmail"` para mantener compatibilidad con código existente

**Uso:**
- Identificar origen de la compra sin depender de emailId
- Filtrar compras manuales: `WHERE source = 'manual'`
- Badge UI: mostrar "Auto" vs "Manual" según source

**Validación recomendada (backend):**
```typescript
if (source === 'gmail' && !emailId) {
  throw new Error('Compras gmail requieren emailId');
}
if (source === 'manual' && emailId) {
  console.warn('Compra manual con emailId, se ignora');
}
```

---

## Relaciones y Compatibilidad

### Relación TenpoPurchase → TenpoEmail

**Antes:**
```prisma
email  TenpoEmail  @relation(fields: [emailId], references: [id], onDelete: Cascade)
```

**Después:**
```prisma
email  TenpoEmail?  @relation(fields: [emailId], references: [id], onDelete: Cascade)
```

**Cambios:**
- `TenpoEmail?` indica relación opcional
- onDelete: Cascade se mantiene activo cuando emailId existe
- Compras manuales (emailId = null) no tienen email asociado

**Compatibilidad con sync actual:**
- /api/tenpo/sync sigue funcionando igual
- Siempre crea emailId y source='gmail' (default)
- No requiere cambios en código de sincronización

### Relación TenpoPurchase → TenpoInstallment

**Sin cambios:**
```prisma
installments  TenpoInstallment[]
```

- Todas las compras (gmail o manual) tienen cuotas
- TenpoInstallment.dueDate sigue siendo la fecha contable
- TenpoInstallment.finalMonthlyAmountClp sigue siendo el monto a sumar

---

## Por Qué dueDate es la Fecha Contable para Cuotas

### Contexto

Una compra con 3 cuotas genera 3 registros TenpoInstallment, cada uno con:
- `dueDate`: Fecha de vencimiento de la cuota
- `finalMonthlyAmountClp`: Monto de la cuota (con interés y overrides)

### Lógica Contable

**Para calcular totales mensuales:**
- ✅ Agrupar por: `strftime('%Y-%m', dueDate)`
- ✅ Sumar: `SUM(finalMonthlyAmountClp)`
- ❌ NO usar: `purchaseDate` (fecha de compra)

**Ejemplo:**
```
Compra: 2026-01-15, $30.000, 3 cuotas
- Cuota 1: dueDate = 2026-02-05, monto = $10.300
- Cuota 2: dueDate = 2026-03-05, monto = $10.300
- Cuota 3: dueDate = 2026-04-05, monto = $10.300

Total Feb 2026: $10.300 (1 cuota)
Total Mar 2026: $10.300 (1 cuota)
Total Abr 2026: $10.300 (1 cuota)
```

**Por qué NO usar purchaseDate:**
- purchaseDate = 2026-01-15 (día de compra)
- Si agrupamos por purchaseDate, todos los $30.900 aparecen en Enero
- ❌ Incorrecto: no refleja el flujo de caja mensual real

**Por qué usar dueDate:**
- Refleja el mes en que se PAGA la cuota
- Coincide con el sistema de facturación Tenpo (cierre día 21, pago día 5 siguiente)
- ✅ Correcto: permite proyectar gastos mensuales reales

### Query SQL de Referencia

```sql
-- Total Tenpo por mes (para integración en Actual)
SELECT 
  strftime('%Y', ti.dueDate) AS year,
  CAST(strftime('%m', ti.dueDate) AS INTEGER) AS month,
  SUM(ti.finalMonthlyAmountClp) AS totalTenpo
FROM tenpo_installments ti
JOIN tenpo_purchases tp ON ti.purchaseId = tp.id
WHERE strftime('%Y-%m', ti.dueDate) = '2026-02'
GROUP BY year, month;
```

---

## Migración Aplicada

**Archivo:** `prisma/migrations/20260201133531_add_manual_purchase_support/migration.sql`

**Cambios SQL:**
1. Recrear tabla `tenpo_purchases` con:
   - `email_id` ahora nullable (INTEGER → INTEGER NULL)
   - Nuevo campo `source TEXT NOT NULL DEFAULT 'gmail'`
2. Migrar datos existentes:
   - Todos los registros existentes mantienen su emailId
   - Todos reciben source='gmail' (default)
3. Foreign key `email_id → tenpo_emails(id)` se mantiene con ON DELETE CASCADE

**Compatibilidad hacia atrás:**
- Todas las compras existentes tienen emailId (no null)
- Todas tienen source='gmail' (migración automática)
- Código existente sigue funcionando sin cambios

---

## Impacto en Código Existente

### Backend - Sin cambios obligatorios

**Routes que siguen funcionando igual:**
- POST /api/tenpo/sync → siempre crea emailId + source='gmail'
- GET /api/tenpo/purchases → incluye campo source en response
- PATCH /api/tenpo/purchases/:id/interes → no depende de emailId

**TypeScript - Tipos actualizados:**
```typescript
interface Purchase {
  id: number;
  emailId: number | null;  // ⬅️ ahora nullable
  source: 'gmail' | 'manual';  // ⬅️ nuevo
  merchant: string;
  // ... resto de campos
}
```

**Queries - Considerar null:**
```typescript
// Filtrar solo compras gmail
const gmailPurchases = await prisma.tenpoPurchase.findMany({
  where: { source: 'gmail' }
});

// Filtrar solo compras manuales
const manualPurchases = await prisma.tenpoPurchase.findMany({
  where: { source: 'manual' }
});

// Incluir email solo si existe
const purchase = await prisma.tenpoPurchase.findUnique({
  where: { id },
  include: { 
    email: true,  // puede ser null
    installments: true 
  }
});
```

### Frontend - Sin cambios obligatorios

- Páginas existentes (Tenpo.tsx) siguen funcionando
- Campo `source` estará disponible en response de /api/tenpo/purchases
- Opcional: mostrar badge "Gmail" vs "Manual" en UI

---

## Próximos Pasos (NO implementados en este cambio)

1. **Endpoint para crear compra manual:**
   - POST /api/tenpo/purchases/manual
   - Body: { merchant, amount, installments, purchaseDate }
   - source='manual', emailId=null

2. **UI para compras manuales:**
   - Botón "Agregar Compra Manual" en Tenpo.tsx
   - Modal con form: comercio, monto, cuotas, fecha

3. **Validación adicional:**
   - Guardrail: si source='gmail', validar emailId NOT NULL
   - Guardrail: si source='manual', rechazar emailId

4. **Integración en Actual:**
   - Agregar categoría TENPO en getMonthlyBudget()
   - Sumar TenpoInstallment por dueDate (sin filtrar por source)
   - Ambas fuentes (gmail + manual) se totalizan igual

---

## Resumen de Archivos Modificados

1. **prisma/schema.prisma:**
   - TenpoPurchase.emailId: Int → Int?
   - TenpoPurchase.source: nuevo campo (String, default 'gmail')
   - TenpoPurchase.email: TenpoEmail → TenpoEmail?

2. **prisma/migrations/20260201133531_add_manual_purchase_support/migration.sql:**
   - ALTER TABLE tenpo_purchases (redefinición en SQLite)
   - Migración de datos existentes con source='gmail'

3. **Este documento (tenpo-manual-purchases-model.md):**
   - Explicación de cambios y razones
   - Documentación de dueDate como fecha contable
   - Guía de compatibilidad y próximos pasos
