# Soporte de `feeMissing` para Compras Antiguas

**Fecha:** 31 enero 2025  
**Versión:** 1.0  
**Autor:** Sistema  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen Ejecutivo

Se ha implementado el campo `feeMissing` para **distinguir compras antiguas sin fee capturado** de compras con fee explícitamente definido (incluso si es 0%).

Este campo permite:
1. **Transparencia:** Indicar al usuario que el fee aún no se ha confirmado
2. **No inventar datos:** Evitar asumir un 2% por defecto cuando no hay información
3. **Trazabilidad:** Marcar compras que requieren actualización manual con datos del estado de cuenta

---

## 🎯 Problema Resuelto

### Antes de `feeMissing`

**Situación:** Compras antiguas sin `metadata.feePct` se mostraban sin ninguna indicación de fee.

**Problemas:**
1. ❌ No se diferenciaba entre "sin fee" (0%) y "fee no capturado" (?)
2. ❌ Usuario podía asumir que no hay comisión cuando en realidad sí la hay
3. ❌ No había señal visual de que faltan datos

**Ejemplo visual:**
```
┌───────────────────────────────────┐
│ Capital:           $218,365       │
│ Interés por cuotas: +$13,824     │
│ Total financiado:  $232,189       │
└───────────────────────────────────┘
```
❌ **Problema:** No se muestra que falta el fee (podría ser $4,367)

---

### Después de `feeMissing`

**Situación:** Compras antiguas se marcan con `feeMissing=true` y se muestra mensaje sutil.

**Beneficios:**
1. ✅ Se diferencia claramente "sin fee" vs "fee pendiente"
2. ✅ Usuario sabe que debe confirmar con estado de cuenta
3. ✅ Señal visual de que faltan datos sin alarmar

**Ejemplo visual:**
```
┌────────────────────────────────────────────────────┐
│ Capital:           $218,365                        │
│ Comisión:          pendiente (se confirmará con   │
│                    estado de cuenta)               │
│ Interés por cuotas: +$13,824                      │
│ Total financiado:  $232,189                        │
└────────────────────────────────────────────────────┘
```
✅ **Solución:** Se indica que el fee está pendiente de confirmación

---

## 🔧 Reglas de Negocio

### Backend (Node.js/TypeScript)

**Archivo:** `node-version/src/routes/tenpo.ts`  
**Endpoint:** `GET /api/tenpo/purchases`

#### Regla 1: Modo ESTIMADO con feePct definido

**Condición:**
```typescript
purchase.modoMonto === 'ESTIMADO' && feePct !== null
```

**Acción:**
```typescript
feeMissing = false;
feeAmountClp = Math.round(purchase.amountTotalClp * feePct);
financedBaseClp = purchase.amountTotalClp + feeAmountClp;
```

**Casos:**
- `feePct = 0.02` (2%) → `feeAmountClp = capital × 0.02`, `feeMissing = false`
- `feePct = 0` (sin fee) → `feeAmountClp = 0`, `feeMissing = false`

---

#### Regla 2: Modo ESTIMADO sin feePct (compra antigua)

**Condición:**
```typescript
purchase.modoMonto === 'ESTIMADO' && feePct === null
```

**Acción:**
```typescript
feeMissing = true;
feeAmountClp = null;
financedBaseClp = purchase.amountTotalClp; // Fallback: solo capital
```

**Interpretación:**
- No hay datos de fee capturados
- Base financiada = capital (asume sin fee por ahora)
- Se marca `feeMissing = true` para indicar al frontend

---

#### Regla 3: Modo REAL

**Condición:**
```typescript
purchase.modoMonto === 'REAL'
```

**Acción:**
```typescript
feeMissing = false;
feePct = null;
feeAmountClp = null;
financedBaseClp = purchase.amountTotalClp;
```

**Razón:**
- Modo REAL usa valor confirmado del banco (ya incluye todo)
- No se desglosa fee en modo REAL
- `feeMissing = false` porque no aplica (no es estimación)

---

### Frontend (React/TypeScript)

**Archivo:** `node-version/client/src/pages/Tenpo.tsx`

#### Renderizado Condicional

##### Caso 1: Fee definido y presente

**Condición:**
```tsx
purchase.feePct !== null && 
purchase.feePct !== undefined && 
purchase.feeAmountClp !== null
```

**Renderizado:**
```tsx
<span style={{ color: '#6b7280' }}>
  Comisión ({(purchase.feePct * 100).toFixed(2)}%):
</span>
<span style={{ fontWeight: '500', color: '#dc2626' }}>
  +${Math.round(purchase.feeAmountClp).toLocaleString('es-CL')}
</span>
```

**Visual:**
```
Comisión (2.00%): +$4,367
```

---

##### Caso 2: Fee faltante (compra antigua)

**Condición:**
```tsx
purchase.feeMissing === true
```

**Renderizado:**
```tsx
<span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
  Comisión:
</span>
<span style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '0.8125rem' }}>
  pendiente (se confirmará con estado de cuenta)
</span>
```

**Visual:**
```
Comisión: pendiente (se confirmará con estado de cuenta)
```

**Estilo:**
- Color gris claro (#9ca3af) → menos prominente, no alarma
- Fuente itálica → indica información provisional
- Texto explicativo → clarifica que es temporal

---

##### Caso 3: Sin fee explícito (feePct = 0)

**Condición:**
```tsx
purchase.feePct === 0 && purchase.feeAmountClp === 0
```

**Renderizado:**
```tsx
<span style={{ color: '#6b7280' }}>
  Comisión (0.00%):
</span>
<span style={{ fontWeight: '500', color: '#6b7280' }}>
  $0
</span>
```

**Visual:**
```
Comisión (0.00%): $0
```

**Diferencia con Caso 2:**
- Aquí se SABE que no hay fee (explícito)
- En Caso 2 NO se sabe (pendiente)

---

## 📊 Tabla Comparativa de Estados

| Estado | `modoMonto` | `metadata.feePct` | `feeMissing` | `feeAmountClp` | `financedBaseClp` | UI Muestra |
|--------|-------------|-------------------|--------------|----------------|-------------------|------------|
| **1. Compra nueva con fee** | ESTIMADO | 0.02 | false | $4,367 | $222,732 | "Comisión (2.00%): +$4,367" |
| **2. Compra nueva sin fee** | ESTIMADO | 0 | false | $0 | $218,365 | "Comisión (0.00%): $0" |
| **3. Compra antigua sin metadata** | ESTIMADO | null | **true** | null | $218,365 | "Comisión: pendiente (...)" |
| **4. Compra confirmada** | REAL | null | false | null | $218,365 | (no muestra comisión) |

---

## 🔍 Ejemplos Antes/Después

### Ejemplo 1: Compra con Fee (normal)

**Datos:**
- Capital: $100,000
- `metadata.feePct`: 0.02
- `modoMonto`: ESTIMADO

**Backend Response:**
```json
{
  "id": 123,
  "amountTotalClp": 100000,
  "modoMonto": "ESTIMADO",
  "metadata": "{\"feePct\": 0.02}",
  "feePct": 0.02,
  "feeAmountClp": 2000,
  "financedBaseClp": 102000,
  "feeMissing": false
}
```

**UI:**
```
Capital:              $100,000
Comisión (2.00%):     +$2,000
Base financiada:      $102,000
Interés por cuotas:   +$6,459
Total financiado:     $108,459
```

---

### Ejemplo 2: Compra sin Fee Explícito (feePct = 0)

**Datos:**
- Capital: $50,000
- `metadata.feePct`: 0
- `modoMonto`: ESTIMADO

**Backend Response:**
```json
{
  "id": 124,
  "amountTotalClp": 50000,
  "modoMonto": "ESTIMADO",
  "metadata": "{\"feePct\": 0}",
  "feePct": 0,
  "feeAmountClp": 0,
  "financedBaseClp": 50000,
  "feeMissing": false
}
```

**UI:**
```
Capital:              $50,000
Comisión (0.00%):     $0
Interés por cuotas:   +$3,165
Total financiado:     $53,165
```

---

### Ejemplo 3: Compra Antigua sin Metadata (🆕 ANTES vs DESPUÉS)

**Datos:**
- Capital: $200,000
- `metadata`: null
- `modoMonto`: ESTIMADO

#### ANTES de `feeMissing`

**Backend Response:**
```json
{
  "id": 125,
  "amountTotalClp": 200000,
  "modoMonto": "ESTIMADO",
  "metadata": null,
  "feePct": null,
  "feeAmountClp": 0,
  "financedBaseClp": 200000
}
```

**UI (ANTES):**
```
Capital:              $200,000
Interés por cuotas:   +$12,660
Total financiado:     $212,660
```

❌ **Problema:** No se indica que el fee está pendiente. Usuario asume que no hay comisión.

---

#### DESPUÉS de `feeMissing`

**Backend Response:**
```json
{
  "id": 125,
  "amountTotalClp": 200000,
  "modoMonto": "ESTIMADO",
  "metadata": null,
  "feePct": null,
  "feeAmountClp": null,
  "financedBaseClp": 200000,
  "feeMissing": true  // ← NUEVO
}
```

**UI (DESPUÉS):**
```
Capital:              $200,000
Comisión:             pendiente (se confirmará con estado de cuenta)
Interés por cuotas:   +$12,660
Total financiado:     $212,660
```

✅ **Solución:** Se indica claramente que el fee está pendiente de confirmación.

---

### Ejemplo 4: Compra Confirmada (modo REAL)

**Datos:**
- Capital: $150,000
- Cuota confirmada: $52,000/mes × 3
- `modoMonto`: REAL

**Backend Response:**
```json
{
  "id": 126,
  "amountTotalClp": 150000,
  "modoMonto": "REAL",
  "metadata": null,
  "feePct": null,
  "feeAmountClp": null,
  "financedBaseClp": 150000,
  "feeMissing": false
}
```

**UI:**
```
✓ Confirmado  [REAL]

Capital:              $150,000
Interés por cuotas:   +$6,000
Total financiado:     $156,000
```

**Nota:** No se muestra línea de comisión porque el total ya está confirmado por el banco (incluye todo).

---

## 🎨 Diseño de Interfaz

### Estilos Aplicados

**Cuando `feeMissing = true`:**

```tsx
// Label
<span style={{ 
  color: '#9ca3af',      // Gris claro (Tailwind gray-400)
  fontStyle: 'italic'    // Itálica para indicar provisional
}}>
  Comisión:
</span>

// Valor
<span style={{ 
  fontStyle: 'italic', 
  color: '#9ca3af',      // Gris claro
  fontSize: '0.8125rem'  // 13px (ligeramente más pequeño)
}}>
  pendiente (se confirmará con estado de cuenta)
</span>
```

**Contraste con fee definido:**

```tsx
// Label
<span style={{ 
  color: '#6b7280'       // Gris medio (Tailwind gray-500)
}}>
  Comisión (2.00%):
</span>

// Valor
<span style={{ 
  fontWeight: '500', 
  color: '#dc2626'       // Rojo (Tailwind red-600)
}}>
  +$4,367
</span>
```

**Rationale:**
- Gris más claro (#9ca3af vs #6b7280) → menos prominente
- Itálica → señal visual de información provisional
- Texto explicativo → clarifica sin alarmar
- Sin signo "+" → no es un cargo confirmado

---

## 🔄 Flujo de Actualización

### 1. Compra Sincronizada (nuevo)

```
Gmail → Parser → POST /sync
                    ↓
         metadata.feePct = null (default)
                    ↓
         feeMissing = true (automático)
                    ↓
         UI: "Comisión: pendiente (...)"
```

### 2. Usuario Confirma Fee

**Opción A: Editar metadata manualmente**
```sql
UPDATE TenpoPurchase 
SET metadata = '{"feePct": 0.02}' 
WHERE id = 125;
```

**Opción B: Confirmar con valor real del estado de cuenta**
```
POST /api/tenpo/purchases/125/confirmar-real
Body: { cuotaReal: 79000 }
     ↓
modoMonto = 'REAL'
feeMissing = false
```

### 3. Recálculo (si aún en modo ESTIMADO)

```
POST /api/tenpo/purchases/125/recalculate
     ↓
Lee metadata.feePct (ahora 0.02)
     ↓
Calcula feeAmountClp = $4,000
Calcula financedBaseClp = $204,000
     ↓
feeMissing = false (ya tiene fee)
     ↓
UI: "Comisión (2.00%): +$4,000"
```

---

## ✅ Checklist de Validación

### Backend

- [x] Endpoint GET /purchases calcula `feeMissing`
- [x] **Regla 1:** `modoMonto='ESTIMADO'` + `feePct !== null` → `feeMissing = false`
- [x] **Regla 2:** `modoMonto='ESTIMADO'` + `feePct === null` → `feeMissing = true`
- [x] **Regla 3:** `modoMonto='REAL'` → `feeMissing = false` (no aplica)
- [x] `feeAmountClp` es `null` cuando `feeMissing = true`
- [x] `financedBaseClp` usa fallback `amountTotalClp` cuando `feeMissing = true`

### Frontend

- [x] Interface `Purchase` incluye `feeMissing?: boolean`
- [x] Renderizado condicional para fee definido vs fee missing
- [x] Estilo diferenciado (gris claro + itálica) para `feeMissing`
- [x] Mensaje explicativo: "pendiente (se confirmará con estado de cuenta)"
- [x] NO se inventa 2% por defecto cuando falta fee
- [x] Diferencia entre `feePct = 0` (explícito) y `feeMissing = true` (pendiente)

### Testing Manual

- [ ] Crear compra antigua sin metadata → verificar UI muestra "pendiente"
- [ ] Agregar `metadata.feePct` a compra antigua → verificar UI muestra monto
- [ ] Confirmar con valor real → verificar `feeMissing = false`
- [ ] Compra nueva (POST /sync) → verificar `feeMissing = true` por defecto

---

## 🚀 Próximos Pasos (Opcional)

### 1. Bulk Update de Compras Antiguas

**Script para actualizar compras sin metadata:**

```typescript
// scripts/update-missing-fees.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMissingFees() {
  // Buscar compras ESTIMADO sin metadata
  const comprasSinFee = await prisma.tenpoPurchase.findMany({
    where: {
      modoMonto: 'ESTIMADO',
      metadata: null
    }
  });

  console.log(`Encontradas ${comprasSinFee.length} compras sin fee`);

  // Opción 1: Agregar fee default 2%
  for (const compra of comprasSinFee) {
    await prisma.tenpoPurchase.update({
      where: { id: compra.id },
      data: {
        metadata: JSON.stringify({ feePct: 0.02 })
      }
    });
    console.log(`✅ Compra ${compra.id}: fee 2% agregado`);
  }

  // Opción 2: Marcar como sin fee (0%)
  // data: { metadata: JSON.stringify({ feePct: 0 }) }
}

updateMissingFees()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

### 2. Indicador Visual en Tabla Principal

Agregar badge en la columna de comercio:

```tsx
{purchase.feeMissing && (
  <span style={{
    backgroundColor: '#fef3c7',  // Amarillo claro
    color: '#92400e',            // Marrón oscuro
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontSize: '0.7rem',
    fontWeight: '600',
    marginLeft: '0.5rem'
  }}>
    ⚠️ FEE PENDIENTE
  </span>
)}
```

---

### 3. Filtro en Frontend

Agregar botón "Solo compras con fee pendiente":

```tsx
const [soloFeePendiente, setSoloFeePendiente] = useState(false);

const filteredPurchases = purchases.filter(p => {
  if (soloFeePendiente && !p.feeMissing) return false;
  return true;
});
```

---

## 📚 Referencias

- [tenpo_addon_fee_base.md](./tenpo_addon_fee_base.md) - Integración de fee en base financiada
- [tenpo_fee_exposure.md](./tenpo_fee_exposure.md) - Fase 1: Exposición de fee vía metadata
- [tenpo_ui_desglose.md](./tenpo_ui_desglose.md) - UI de desglose de costos
- [tenpo.ts](../node-version/src/routes/tenpo.ts) - Endpoint GET /purchases
- [Tenpo.tsx](../node-version/client/src/pages/Tenpo.tsx) - Componente React

---

## 📝 Notas Técnicas

### Por qué `feeAmountClp = null` (no 0) cuando `feeMissing = true`

**Razón semántica:**
- `null` = "no hay información"
- `0` = "hay información y es cero"

**Ejemplo:**
- `feePct = 0, feeAmountClp = 0` → "Compra SIN comisión" (explícito)
- `feePct = null, feeAmountClp = null, feeMissing = true` → "No se sabe si hay comisión" (pendiente)

**Beneficio:**
- Evita confusión en lógica de negocio
- Facilita filtros (ej: "compras con fee pendiente")

### Por qué `financedBaseClp = amountTotalClp` cuando `feeMissing = true`

**Razón práctica:**
- Se necesita un valor para `financedBaseClp` (no puede ser null)
- Mejor asumir sin fee (conservador) que inventar 2%
- Cuando se confirme el fee, se recalculará correctamente

**Consecuencia:**
- Total financiado puede estar **ligeramente subestimado** si hay fee
- Al confirmar fee real, se actualizará automáticamente

**Alternativa rechazada:**
- NO asumir 2% por defecto (genera expectativas falsas)
- NO mostrar "Base financiada: PENDIENTE" (confunde más)

---

**FIN DEL DOCUMENTO**
