# Guardrails para Modo REAL - Protección contra Recálculo

**Fecha:** 31 enero 2025  
**Versión:** 1.0  
**Autor:** Sistema  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen Ejecutivo

Se han implementado **guardrails (protecciones)** en todas las funciones de recálculo para asegurar que las compras en **modo REAL nunca se recalculen**.

**Principio fundamental:**
> Una compra en modo REAL tiene valores **confirmados con el banco**. Estos valores son **inmutables** y representan la realidad financiera del cliente. Cualquier recálculo sobrescribiría datos reales con estimaciones, lo cual es un error crítico.

---

## 🎯 Objetivos

1. ✅ **Proteger datos confirmados:** Evitar que valores reales sean sobrescritos por cálculos estimados
2. ✅ **Prevenir inconsistencias:** Mantener integridad entre modo REAL y valores almacenados
3. ✅ **Facilitar debugging:** Logs claros cuando se bloquea un recálculo por guardrail
4. ✅ **Defensa en profundidad:** Múltiples capas de validación (endpoint → servicio → función)

---

## 🛡️ Guardrails Implementados

### Backend (Node.js/TypeScript)

#### 1. `recalcularCompra()` (Servicio)

**Archivo:** `node-version/src/services/tenpo-calculator.service.ts`  
**Líneas:** 135-153

**Guardrail:**
```typescript
/**
 * GUARDRAIL: Compras en modo REAL nunca se recalculan
 */
async recalcularCompra(purchaseId: number) {
  const purchase = await prisma.tenpoPurchase.findUnique({
    where: { id: purchaseId },
    include: { installments: true }
  });

  if (!purchase) {
    throw new Error(`Compra no encontrada: ${purchaseId}`);
  }

  // GUARDRAIL: No recalcular si está en modo REAL
  if (purchase.modoMonto === 'REAL') {
    console.log(`🛡️  [GUARDRAIL] Compra ${purchaseId} está en modo REAL - Recálculo bloqueado`);
    console.log(`    Merchant: ${purchase.merchant}, Total confirmado: $${purchase.totalFinanciadoEstimado?.toLocaleString('es-CL') || 'N/A'}`);
    return purchase;
  }

  // ... continúa con recálculo solo si modoMonto='ESTIMADO'
}
```

**Qué previene:**
- ✅ Sobrescribir `totalFinanciadoEstimado` con valor calculado
- ✅ Modificar `interesTotalEstimado` basado en tasa
- ✅ Actualizar `installments.baseAmountClp` y `finalMonthlyAmountClp`
- ✅ Cambiar estado de cuotas de `'REAL'` a `'ESTIMADO'`

**Log de debug:**
```
🛡️  [GUARDRAIL] Compra 123 está en modo REAL - Recálculo bloqueado
    Merchant: Amazon, Total confirmado: $236,831
```

---

#### 2. `recalcularTodasEstimadas()` (Servicio)

**Archivo:** `node-version/src/services/tenpo-calculator.service.ts`  
**Líneas:** 216-250

**Guardrail Primario (Query):**
```typescript
const comprasEstimadas = await prisma.tenpoPurchase.findMany({
  where: { modoMonto: 'ESTIMADO' }  // ← Solo busca ESTIMADO
});
```

**Guardrail Secundario (Doble verificación):**
```typescript
for (const compra of comprasEstimadas) {
  try {
    // GUARDRAIL: Doble verificación - no recalcular si de alguna manera es REAL
    if (compra.modoMonto === 'REAL') {
      console.log(`🛡️  [GUARDRAIL] Compra ${compra.id} marcada como REAL - Saltada por seguridad`);
      saltadas++;
      continue;
    }
    
    await this.recalcularCompra(compra.id);
    recalculadas++;
  } catch (error) {
    console.error(`❌ Error recalculando compra ${compra.id}:`, error);
  }
}
```

**Qué previene:**
- ✅ Recálculo masivo accidental de compras REAL
- ✅ Race conditions donde una compra cambia a REAL durante el proceso
- ✅ Errores en el filtro SQL que podrían incluir compras REAL

**Log de debug:**
```
🔄 Recalculando 45 compras estimadas...
🛡️  [GUARDRAIL] Compra 789 marcada como REAL - Saltada por seguridad
✅ 44 compras recalculadas exitosamente
🛡️  1 compras REAL saltadas por guardrail
```

**Return actualizado:**
```typescript
return { 
  total: comprasEstimadas.length, 
  recalculadas, 
  saltadas  // ← Nuevo campo
};
```

---

#### 3. `PATCH /purchases/:id/interes` (Endpoint)

**Archivo:** `node-version/src/routes/tenpo.ts`  
**Líneas:** 600-632

**Guardrail:**
```typescript
router.patch('/purchases/:id/interes', async (req, res) => {
  // ... validaciones previas
  
  // Obtener compra actual
  const purchase = await prisma.tenpoPurchase.findUnique({
    where: { id: parseInt(id) }
  });

  if (!purchase) {
    return res.status(404).json({ error: 'Compra no encontrada' });
  }

  // GUARDRAIL: No recalcular si está en modo REAL
  if (purchase.modoMonto === 'REAL') {
    console.log(`🛡️  [GUARDRAIL] Intento de modificar tieneInteres en compra REAL bloqueado`);
    console.log(`    Compra ID: ${id}, Merchant: ${purchase.merchant}`);
    return res.status(400).json({ 
      error: 'No se puede modificar compra en modo REAL. Los valores fueron confirmados con el banco y no deben cambiar.' 
    });
  }

  // ... continúa con actualización solo si ESTIMADO
});
```

**Qué previene:**
- ✅ Toggle de `tieneInteres` en compra confirmada
- ✅ Recálculo derivado después del toggle
- ✅ Inconsistencia entre modo REAL y valores calculados

**HTTP Response:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "No se puede modificar compra en modo REAL. Los valores fueron confirmados con el banco y no deben cambiar."
}
```

**Log de debug:**
```
🛡️  [GUARDRAIL] Intento de modificar tieneInteres en compra REAL bloqueado
    Compra ID: 456, Merchant: Mercado Libre
```

---

#### 4. `generarCalendarioCuotas()` (Documentación)

**Archivo:** `node-version/src/services/tenpo-calculator.service.ts`  
**Líneas:** 89-107

**Guardrail (Documentación):**
```typescript
/**
 * Genera calendario de cuotas con ajuste en última cuota
 * para que la suma sea exactamente igual al total financiado
 * 
 * Usa TenpoAddOnV1 (interés simple) como método por defecto para estimaciones
 * Soporta fee: si feePct es provisto, calcula base financiada = capital + fee
 * 
 * NOTA: Esta función NO debe llamarse para compras en modo REAL.
 * Las compras REAL usan valores confirmados del banco, no cálculos estimados.
 */
generarCalendarioCuotas(
  capital: number,
  // ... parámetros
): { cuotas: number[]; totalFinanciado: number; interesTotal: number; feeAmountClp: number }
```

**Qué previene:**
- ✅ Uso incorrecto de la función en contexto REAL
- ✅ Confusión sobre cuándo usar valores calculados vs confirmados
- ✅ Bugs futuros al agregar nuevos endpoints

**Nota:** Esta función es de bajo nivel y no recibe objetos Purchase, solo valores primitivos. La validación de modo REAL debe hacerse en las capas superiores (endpoints y servicios).

---

## 🚫 Escenarios Prevenidos

### Escenario 1: Toggle Accidental de Interés

**Sin guardrail:**
```
Usuario → Frontend → PATCH /purchases/123/interes { tieneInteres: false }
                          ↓
                  recalcularCompra(123)
                          ↓
          Sobrescribe cuotas REALES con cálculo ESTIMADO
                          ↓
                   ❌ DATOS PERDIDOS
```

**Con guardrail:**
```
Usuario → Frontend → PATCH /purchases/123/interes { tieneInteres: false }
                          ↓
           Guardrail detecta modoMonto='REAL'
                          ↓
           🛡️ Retorna 400 Bad Request
                          ↓
          Frontend muestra: "No se puede modificar compra confirmada"
                          ↓
                   ✅ DATOS PROTEGIDOS
```

---

### Escenario 2: Recálculo Masivo por Cambio de Tasa

**Sin guardrail secundario:**
```
Admin → POST /recalcular-estimadas
            ↓
   Query WHERE modoMonto='ESTIMADO'
            ↓
   [Compra A (ESTIMADO), Compra B (ESTIMADO), Compra C (REAL?)]
            ↓
   Race condition: Compra C cambió a REAL durante query
            ↓
   recalcularCompra(C) → Sobrescribe valores reales
            ↓
          ❌ INCONSISTENCIA
```

**Con guardrail secundario:**
```
Admin → POST /recalcular-estimadas
            ↓
   Query WHERE modoMonto='ESTIMADO'
            ↓
   [Compra A (ESTIMADO), Compra B (ESTIMADO), Compra C (REAL?)]
            ↓
   For each compra:
     if (compra.modoMonto === 'REAL') {
       🛡️ Saltada por seguridad
       continue;
     }
            ↓
   Compra C NO se recalcula
            ↓
          ✅ DATOS PROTEGIDOS
```

---

### Escenario 3: Sincronización Duplicada desde Gmail

**Sin guardrail:**
```
POST /sync → Parsea email con compra ya existente
                          ↓
         Encuentra compra existente (REAL)
                          ↓
         Intenta actualizar con datos parseados
                          ↓
         Sobrescribe valores confirmados
                          ↓
                   ❌ DATOS PERDIDOS
```

**Con guardrail (actual):**
```
POST /sync → Parsea email
                ↓
   Verifica si gmailMessageId ya existe
                ↓
   Si existe → skip (no procesa)
                ↓
   Si no existe → crear compra ESTIMADO
                ↓
          ✅ NO SOBRESCRIBE REAL
```

**Nota:** POST /sync solo crea compras nuevas en modo ESTIMADO, no actualiza existentes. El guardrail implícito es que nunca toca compras REAL porque solo crea, no actualiza.

---

### Escenario 4: Llamada Programática Directa

**Sin guardrail en `recalcularCompra()`:**
```
Script interno → tenpoCalculatorService.recalcularCompra(123)
                          ↓
                 purchaseId = 123 (REAL)
                          ↓
          Recalcula sin verificar modoMonto
                          ↓
                   ❌ DATOS PERDIDOS
```

**Con guardrail:**
```
Script interno → tenpoCalculatorService.recalcularCompra(123)
                          ↓
                 purchaseId = 123 (REAL)
                          ↓
         🛡️ Guardrail detecta modoMonto='REAL'
                          ↓
         Log: "Compra 123 está en modo REAL - Recálculo bloqueado"
                          ↓
                 return purchase (sin cambios)
                          ↓
                   ✅ DATOS PROTEGIDOS
```

---

## 📊 Matriz de Protección

| Función/Endpoint | Guardrail Primario | Guardrail Secundario | Log de Debug | HTTP Response |
|------------------|-------------------|----------------------|--------------|---------------|
| `recalcularCompra()` | ✅ Check `modoMonto='REAL'` | - | ✅ Sí | - |
| `recalcularTodasEstimadas()` | ✅ Query `WHERE modoMonto='ESTIMADO'` | ✅ Loop check `modoMonto='REAL'` | ✅ Sí | - |
| `PATCH /interes` | ✅ Check `modoMonto='REAL'` | Delega a `recalcularCompra()` | ✅ Sí | ✅ 400 Bad Request |
| `POST /confirmar-real` | ✅ Cambia a modo REAL | - | ✅ Sí | - |
| `generarCalendarioCuotas()` | - | ⚠️ Documentación | - | - |

**Leyenda:**
- ✅ Implementado
- ⚠️ Advertencia documentada
- `-` No aplica

---

## 🔍 Ejemplos de Logs

### 1. Intento de Recálculo Individual Bloqueado

```
🛡️  [GUARDRAIL] Compra 456 está en modo REAL - Recálculo bloqueado
    Merchant: Amazon, Total confirmado: $236,831
```

### 2. Intento de Modificación vía API Bloqueado

```
🛡️  [GUARDRAIL] Intento de modificar tieneInteres en compra REAL bloqueado
    Compra ID: 789, Merchant: Mercado Libre
```

### 3. Recálculo Masivo con Compras Saltadas

```
🔄 Recalculando 50 compras estimadas...
🛡️  [GUARDRAIL] Compra 123 marcada como REAL - Saltada por seguridad
🛡️  [GUARDRAIL] Compra 456 marcada como REAL - Saltada por seguridad
✅ 48 compras recalculadas exitosamente
🛡️  2 compras REAL saltadas por guardrail
```

### 4. Recálculo Normal (ESTIMADO)

```
✅ Compra 789 recalculada: 3 cuotas, Total: $236,831
```

---

## ✅ Checklist de Validación

### Guardrails Implementados

- [x] `recalcularCompra()` valida `modoMonto='REAL'`
- [x] `recalcularTodasEstimadas()` filtra por `modoMonto='ESTIMADO'`
- [x] `recalcularTodasEstimadas()` doble verificación en loop
- [x] `PATCH /interes` valida `modoMonto='REAL'`
- [x] `generarCalendarioCuotas()` tiene advertencia en JSDoc

### Logs de Debug

- [x] Log cuando se bloquea recálculo por modo REAL
- [x] Log incluye merchant y total confirmado
- [x] Log distingue guardrail de otros skips
- [x] Log resume compras saltadas en recálculo masivo

### HTTP Responses

- [x] `PATCH /interes` retorna 400 con mensaje explicativo
- [x] Mensaje indica por qué no se puede modificar
- [x] Frontend puede mostrar error al usuario

### Testing Manual

- [ ] Intentar recalcular compra REAL individual → debe bloquearse
- [ ] Intentar modificar `tieneInteres` en compra REAL → debe retornar 400
- [ ] Ejecutar recálculo masivo con mix REAL/ESTIMADO → solo recalcula ESTIMADO
- [ ] Verificar logs aparecen correctamente en consola

---

## 🚀 Próximos Pasos (Opcional)

### 1. Endpoint de Solo Lectura para Verificación

```typescript
/**
 * GET /api/tenpo/purchases/:id/verificar-modo
 * Verifica el modo de una compra sin modificarla
 */
router.get('/purchases/:id/verificar-modo', async (req, res) => {
  const { id } = req.params;
  
  const purchase = await prisma.tenpoPurchase.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      merchant: true,
      modoMonto: true,
      totalFinanciadoEstimado: true,
      interesTotalEstimado: true,
      installmentsCount: true
    }
  });

  if (!purchase) {
    return res.status(404).json({ error: 'Compra no encontrada' });
  }

  const esModificable = purchase.modoMonto === 'ESTIMADO';

  res.json({
    ...purchase,
    esModificable,
    razon: esModificable 
      ? 'Compra en modo ESTIMADO - puede recalcularse'
      : 'Compra en modo REAL - valores confirmados e inmutables'
  });
});
```

---

### 2. Test Unitario de Guardrails

```typescript
// tests/guardrails/tenpo-real-protection.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { TenpoCalculatorService } from '../../src/services/tenpo-calculator.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const calculator = new TenpoCalculatorService();

describe('Guardrails de Modo REAL', () => {
  let purchaseRealId: number;
  let purchaseEstimadoId: number;

  beforeEach(async () => {
    // Crear compra REAL
    const purchaseReal = await prisma.tenpoPurchase.create({
      data: {
        merchant: 'Test Merchant REAL',
        amountTotalClp: 100000,
        installmentsCount: 3,
        modoMonto: 'REAL',
        totalFinanciadoEstimado: 106000,
        interesTotalEstimado: 6000,
        // ... otros campos
      }
    });
    purchaseRealId = purchaseReal.id;

    // Crear compra ESTIMADO
    const purchaseEstimado = await prisma.tenpoPurchase.create({
      data: {
        merchant: 'Test Merchant ESTIMADO',
        amountTotalClp: 100000,
        installmentsCount: 3,
        modoMonto: 'ESTIMADO',
        totalFinanciadoEstimado: 106330,
        interesTotalEstimado: 6330,
        // ... otros campos
      }
    });
    purchaseEstimadoId = purchaseEstimado.id;
  });

  it('NO debe recalcular compra REAL', async () => {
    const antesRecalculo = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseRealId }
    });

    await calculator.recalcularCompra(purchaseRealId);

    const despuesRecalculo = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseRealId }
    });

    // Valores NO deben cambiar
    expect(despuesRecalculo?.totalFinanciadoEstimado).toBe(antesRecalculo?.totalFinanciadoEstimado);
    expect(despuesRecalculo?.interesTotalEstimado).toBe(antesRecalculo?.interesTotalEstimado);
  });

  it('SÍ debe recalcular compra ESTIMADO', async () => {
    const antesRecalculo = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseEstimadoId }
    });

    await calculator.recalcularCompra(purchaseEstimadoId);

    const despuesRecalculo = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseEstimadoId }
    });

    // Valores PUEDEN cambiar (depende de tasa vigente)
    expect(despuesRecalculo).toBeDefined();
  });

  it('recalcularTodasEstimadas() debe saltar compras REAL', async () => {
    const resultado = await calculator.recalcularTodasEstimadas();

    expect(resultado.saltadas).toBeGreaterThanOrEqual(0);
    
    // Verificar que compra REAL no cambió
    const purchaseReal = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseRealId }
    });
    expect(purchaseReal?.totalFinanciadoEstimado).toBe(106000);
  });
});
```

---

### 3. Dashboard de Auditoría

Agregar endpoint para revisar estado de compras:

```typescript
/**
 * GET /api/tenpo/auditoria/modos
 * Resumen de compras por modo
 */
router.get('/auditoria/modos', async (req, res) => {
  const [estimadas, reales] = await Promise.all([
    prisma.tenpoPurchase.count({ where: { modoMonto: 'ESTIMADO' } }),
    prisma.tenpoPurchase.count({ where: { modoMonto: 'REAL' } })
  ]);

  const totalCapitalReal = await prisma.tenpoPurchase.aggregate({
    where: { modoMonto: 'REAL' },
    _sum: { totalFinanciadoEstimado: true }
  });

  res.json({
    estimadas,
    reales,
    total: estimadas + reales,
    porcentajeConfirmado: (reales / (estimadas + reales)) * 100,
    totalCapitalConfirmado: totalCapitalReal._sum.totalFinanciadoEstimado || 0
  });
});
```

---

## 📚 Referencias

- [tenpo_auditoria.md](./tenpo_auditoria.md) - Auditoría inicial con 10 hallazgos
- [tenpo_addon_v1_impl.md](./tenpo_addon_v1_impl.md) - Implementación de TenpoAddOnV1
- [tenpo_addon_fee_base_wiring.md](./tenpo_addon_fee_base_wiring.md) - Auditoría de puntos de cálculo
- [tenpo-calculator.service.ts](../node-version/src/services/tenpo-calculator.service.ts) - Servicio con guardrails
- [tenpo.ts](../node-version/src/routes/tenpo.ts) - Endpoints con guardrails

---

## 📝 Notas Técnicas

### Por qué Múltiples Capas de Guardrails

**Defensa en profundidad:**
- Endpoint valida antes de llamar servicio
- Servicio valida antes de modificar DB
- Loop valida cada iteración en recálculos masivos

**Beneficios:**
1. Protección contra bugs en una sola capa
2. Facilita debugging (logs en cada capa)
3. Previene race conditions
4. Documenta intención en cada nivel

### Por qué NO Usar Constraint de DB

**Opción rechazada:**
```sql
ALTER TABLE TenpoPurchase ADD CONSTRAINT check_no_update_real
CHECK (
  (modoMonto = 'REAL' AND OLD.totalFinanciadoEstimado = NEW.totalFinanciadoEstimado)
  OR modoMonto = 'ESTIMADO'
);
```

**Razones:**
1. SQLite tiene soporte limitado de CHECK constraints complejos
2. Difícil expresar "no actualizar si REAL" en SQL
3. Error message menos claro para debugging
4. Más difícil de testear

**Alternativa elegida:** Validación en capa de aplicación con logs claros.

### Diferencia entre `return` y `throw`

**Uso de `return`:**
```typescript
if (purchase.modoMonto === 'REAL') {
  console.log(`🛡️ Guardrail...`);
  return purchase; // ← Retorna sin cambios, NO es error
}
```

**Razón:** No es un error que una compra esté en modo REAL. Es un estado válido que simplemente no requiere recálculo.

**Si fuera `throw`:**
```typescript
if (purchase.modoMonto === 'REAL') {
  throw new Error('No se puede recalcular compra REAL');
}
```
→ Causaría rollback de transacciones, logs de error innecesarios, y fallos en recálculos masivos.

---

**FIN DEL DOCUMENTO**
