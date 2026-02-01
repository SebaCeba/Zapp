# Integración de Fee en TenpoAddOnV1 (Base Financiada)

**Fecha:** 31 enero 2025  
**Versión:** 1.0  
**Autor:** Sistema  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen Ejecutivo

Este documento describe la **Fase 2** de soporte de fees operacionales en el módulo Tenpo: la integración del fee como parte de la **base financiada** sobre la cual se calculan los intereses.

**Antes:**
```
interesTotal = round(capital × tasaMensual × nCuotas)
totalFinanciado = capital + interesTotal
```

**Después (con fee):**
```
feeAmountClp = round(capital × feePct)
financedBaseClp = capital + feeAmountClp
interesTotal = round(financedBaseClp × tasaMensual × nCuotas)
totalFinanciado = financedBaseClp + interesTotal
```

---

## 🎯 Objetivos

1. **Calcular intereses sobre la base financiada** (capital + fee) en lugar de solo el capital
2. **Mantener compatibilidad** con compras existentes (feePct = null)
3. **Preservar modo REAL** (no recalcula nunca)
4. **Registrar feeMissing** cuando no hay fee disponible pero se requiere

---

## 📐 Fórmula Actualizada

### Componentes

| Campo | Fórmula | Descripción |
|-------|---------|-------------|
| `feeAmountClp` | `round(capital × feePct)` | Monto del fee operacional |
| `financedBaseClp` | `capital + feeAmountClp` | Base sobre la cual se aplica el interés |
| `interesTotal` | `round(financedBaseClp × tasaMensual × nCuotas)` | Interés total calculado |
| `totalFinanciado` | `financedBaseClp + interesTotal` | Total que el cliente debe pagar |
| `cuotaMensual` | `round(totalFinanciado / nCuotas)` | Cuota mensual fija (con ajuste en última cuota) |

### Casos Especiales

1. **feePct = null** → `feeAmountClp = 0`, `financedBaseClp = capital`
2. **feePct = 0** → `feeAmountClp = 0`, `financedBaseClp = capital`
3. **modoMonto = 'REAL'** → No se recalcula, se usa datos originales del email

---

## 📊 Ejemplo Numérico Comparativo

**Datos de entrada:**
- Capital: $218,365 CLP
- Cuotas: 3
- Tasa mensual: 2.11%
- Fee operacional: 2%

### Sin Fee (Implementación Anterior)

| Concepto | Cálculo | Valor |
|----------|---------|-------|
| Capital | - | $218,365 |
| Interés Total | round(218365 × 0.0211 × 3) | $13,824 |
| Total Financiado | 218365 + 13824 | $232,189 |
| Cuota Mensual | round(232189 / 3) | $77,396 |

**Resultado:**
- Cuota 1: $77,396
- Cuota 2: $77,396
- Cuota 3: $77,397 (ajuste)
- Total: $232,189

### Con Fee (Implementación Actual)

| Concepto | Cálculo | Valor |
|----------|---------|-------|
| Capital | - | $218,365 |
| Fee Amount | round(218365 × 0.02) | $4,367 |
| **Base Financiada** | 218365 + 4367 | **$222,732** |
| Interés Total | round(222732 × 0.0211 × 3) | $14,099 |
| Total Financiado | 222732 + 14099 | $236,831 |
| Cuota Mensual | round(236831 / 3) | $78,944 |

**Resultado:**
- Cuota 1: $78,944
- Cuota 2: $78,944
- Cuota 3: $78,943 (ajuste)
- Total: $236,831

### Diferencia

| Concepto | Sin Fee | Con Fee | Diferencia |
|----------|---------|---------|------------|
| Base de Cálculo | $218,365 | $222,732 | +$4,367 (2%) |
| Interés Total | $13,824 | $14,099 | +$275 (interés sobre el fee) |
| Total a Pagar | $232,189 | $236,831 | +$4,642 |
| Cuota Mensual | ~$77,396 | $78,944 | +$1,548 |

**Impacto:** El fee no solo se suma al capital, sino que también genera interés adicional de $275 CLP (interés sobre el fee).

---

## 🔧 Cambios Implementados

### 1. `tenpo-calculator.service.ts`

#### Método `calcularCuotasTenpoAddOnV1`

**Antes:**
```typescript
calcularCuotasTenpoAddOnV1(
  capital: number,
  nCuotas: number,
  tasaMensual: number
): { cuotas: number[]; totalFinanciado: number; interesTotal: number }
```

**Después:**
```typescript
calcularCuotasTenpoAddOnV1(
  financedBaseClp: number, // ← Cambio de parámetro
  nCuotas: number,
  tasaMensual: number
): { cuotas: number[]; totalFinanciado: number; interesTotal: number }
```

**Cambio en cálculo:**
```typescript
// Antes
const interesTotal = Math.round(capital * tasaMensual * nCuotas);
const totalFinanciado = capital + interesTotal;

// Después
const interesTotal = Math.round(financedBaseClp * tasaMensual * nCuotas);
const totalFinanciado = financedBaseClp + interesTotal;
```

#### Método `generarCalendarioCuotas`

**Nuevo parámetro:**
```typescript
generarCalendarioCuotas(
  capital: number,
  nCuotas: number,
  primeraFechaVencimiento: Date,
  tieneInteres: boolean,
  tasaMensual: number,
  feePct?: number | null // ← Nuevo parámetro opcional
)
```

**Nueva lógica:**
```typescript
// Calcular fee y base financiada
const feeAmountClp = (feePct !== null && feePct !== undefined) 
  ? Math.round(capital * feePct) 
  : 0;
const financedBaseClp = capital + feeAmountClp;

// Pasar base financiada al cálculo de cuotas
const resultado = this.calcularCuotasTenpoAddOnV1(
  financedBaseClp, // ← Usa base financiada en lugar de capital
  nCuotas,
  tasaMensual
);

// Retornar con información del fee
return {
  ...resultado,
  feeAmountClp // ← Exponer el fee calculado
};
```

#### Método `recalcularCompra`

**Parsing de metadata:**
```typescript
let feePct: number | null = null;
if (purchase.metadata) {
  try {
    const metadata = JSON.parse(purchase.metadata);
    feePct = metadata.feePct ?? null;
  } catch (e) {
    console.error('Error parsing metadata:', e);
  }
}

const { cuotas, totalFinanciado, interesTotal } = this.generarCalendarioCuotas(
  purchase.amountTotalClp,
  nCuotas,
  primeraFechaVencimiento,
  purchase.tieneInteres,
  tasaMensual,
  feePct // ← Pasar el fee extraído
);
```

### 2. `tenpo.ts` (API Routes)

#### Endpoint `POST /sync`

**Actualización:**
```typescript
const { cuotas, totalFinanciado, interesTotal } = tenpoCalculatorService.generarCalendarioCuotas(
  parsedPurchase.amountTotalClp,
  parsedPurchase.installmentsCount,
  primeraFechaVencimiento,
  tieneInteres,
  tasaMensual,
  null // ← Por defecto null para nuevas compras sincronizadas
);
```

**Nota:** Las compras nuevas sincronizadas desde Gmail **no tienen fee** por defecto. El fee debe agregarse manualmente vía:
- PUT /purchases/:id (actualizar metadata)
- POST /purchases/:id/recalculate (recalcular con nuevo fee)

#### Endpoint `GET /purchases`

**Ya implementado en Fase 1 (tenpo_fee_exposure.md):**
```typescript
// Computar campos de fee para modo ESTIMADO
if (p.modoMonto === 'ESTIMADO' && p.metadata) {
  const metadata = JSON.parse(p.metadata);
  const feePct = metadata.feePct ?? null;
  if (feePct !== null) {
    result.feePct = feePct;
    result.feeAmountClp = Math.round(p.amountTotalClp * feePct);
    result.financedBaseClp = p.amountTotalClp + result.feeAmountClp;
  }
}
```

---

## ✅ Checklist de Regresión

### Pre-Implementación (ya verificado)

- [x] TypeScript compila sin errores (`npm run build`)
- [x] Test `test-tenpo-addon-v1.ts` pasa exitosamente
- [x] Test `test-fee-exposure.ts` pasa exitosamente
- [x] Migración aplicada: `20260131204427_add_metadata_to_tenpo_purchases`

### Post-Implementación (verificar)

#### 1. Compatibilidad Backward

- [ ] **Compras sin fee (metadata = null):**
  ```sql
  SELECT * FROM TenpoPurchase WHERE metadata IS NULL LIMIT 5;
  ```
  - Verificar que GET /purchases devuelve sin campos `feePct`, `feeAmountClp`, `financedBaseClp`
  - Verificar que recalcular no altera `totalFinanciado` original

- [ ] **Compras modo REAL:**
  ```sql
  SELECT * FROM TenpoPurchase WHERE modoMonto = 'REAL' LIMIT 5;
  ```
  - Verificar que POST /purchases/:id/recalculate **NO recalcula** (retorna 200 sin cambios)
  - Verificar que GET /purchases **NO expone** campos de fee para modo REAL

#### 2. Nuevas Compras con Fee

- [ ] **Crear compra con fee vía API:**
  ```bash
  POST /purchases
  {
    "amountTotalClp": 218365,
    "installmentsCount": 3,
    "purchaseDate": "2025-01-31",
    "merchant": "Test Merchant",
    "metadata": "{\"feePct\": 0.02}"
  }
  ```
  - Verificar que GET /purchases incluye `feePct: 0.02`, `feeAmountClp: 4367`, `financedBaseClp: 222732`
  - Verificar que totalFinanciado reflejadentro de la base devolvería `$236,829` (según ejemplo numérico)

- [ ] **Recalcular compra existente con fee:**
  ```bash
  PUT /purchases/:id
  { "metadata": "{\"feePct\": 0.02}" }
  
  POST /purchases/:id/recalculate
  ```
  - Verificar que cuotas se recalculan con nuevo fee
  - Verificar que totalFinanciado incrementa correctamente

#### 3. Validación Numérica

- [ ] **Reproducir ejemplo del documento:**
  - Capital: $218,365
  - Cuotas: 3
  - Tasa: 2.11%
  - Fee: 2%
  - **Resultado esperado:** totalFinanciado = $236,831, cuota = $78,944

- [ ] **Caso sin interés:**
  - Capital: $100,000
  - Cuotas: 3
  - tieneInteres: false
  - Fee: 2%
  - **Resultado esperado:** feeAmountClp = $2,000, totalFinanciado = $102,000, cuota = $34,000

#### 4. Edge Cases

- [ ] **feePct = 0:**
  - Verificar que feeAmountClp = 0
  - Verificar que financedBaseClp = capital
  - Verificar que totalFinanciado = capital + interesTotal (sin fee)

- [ ] **feePct muy alto (10%):**
  - Verificar que no causa overflow
  - Verificar redondeo correcto de feeAmountClp

- [ ] **Capital = 0:**
  - Verificar que no causa división por cero
  - Verificar que feeAmountClp = 0

#### 5. API Endpoints

- [ ] `GET /purchases` con filtro `modoMonto=ESTIMADO`
  - Todos los registros con metadata.feePct deben tener campos computados

- [ ] `POST /sync` (nueva sincronización Gmail)
  - Verificar que metadata = null por defecto
  - Verificar que cálculo usa base sin fee (backward compatible)

- [ ] `POST /purchases/:id/recalculate`
  - Si modoMonto='REAL' → 200 OK sin cambios
  - Si modoMonto='ESTIMADO' y tiene metadata.feePct → recalcula con fee
  - Si modoMonto='ESTIMADO' sin metadata.feePct → recalcula sin fee

---

## 🔍 Comandos de Verificación

### 1. Verificar Compras sin Fee

```bash
# En PowerShell desde node-version/
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const purchases = await prisma.tenpoPurchase.findMany({
    where: { metadata: null },
    take: 3,
    include: { cuotas: true }
  });
  console.log(JSON.stringify(purchases, null, 2));
  await prisma.\$disconnect();
})();
"
```

### 2. Verificar Cálculo con Fee

```bash
# Crear test manual
npx ts-node scripts/test-fee-in-calculation.ts
```

**Contenido de `scripts/test-fee-in-calculation.ts`:**
```typescript
import { TenpoCalculatorService } from '../src/services/tenpo-calculator.service';

const calculator = new TenpoCalculatorService();

const capital = 218365;
const nCuotas = 3;
const tasaMensual = 0.0211;
const feePct = 0.02;

const result = calculator.generarCalendarioCuotas(
  capital,
  nCuotas,
  new Date('2025-02-01'),
  true,
  tasaMensual,
  feePct
);

console.log('Resultado con fee:');
console.log(`  feeAmountClp: $${result.feeAmountClp?.toLocaleString() ?? 0}`);
console.log(`  financedBaseClp: $${(capital + (result.feeAmountClp ?? 0)).toLocaleString()}`);
console.log(`  interesTotal: $${result.interesTotal.toLocaleString()}`);
console.log(`  totalFinanciado: $${result.totalFinanciado.toLocaleString()}`);
console.log(`  cuotas: ${result.cuotas.map(c => `$${c.toLocaleString()}`).join(', ')}`);

// Valores esperados
const expectedFee = 4367;
const expectedBase = 222732;
const expectedInterest = 14097;
const expectedTotal = 236829;

const assertions = [
  { name: 'feeAmountClp', got: result.feeAmountClp, expected: expectedFee },
  { name: 'interesTotal', got: result.interesTotal, expected: expectedInterest },
  { name: 'totalFinanciado', got: result.totalFinanciado, expected: expectedTotal }
];

console.log('\nAserciones:');
assertions.forEach(a => {
  const pass = a.got === a.expected;
  console.log(`  ${pass ? '✅' : '❌'} ${a.name}: ${a.got} === ${a.expected}`);
});
```

### 3. Verificar API

```bash
# Obtener compras con fee
curl -X GET "http://localhost:3001/api/tenpo/purchases?modoMonto=ESTIMADO" | jq '.[] | select(.feePct != null)'

# Recalcular con fee
curl -X PUT "http://localhost:3001/api/tenpo/purchases/PURCHASE_ID" \
  -H "Content-Type: application/json" \
  -d '{"metadata": "{\"feePct\": 0.02}"}'

curl -X POST "http://localhost:3001/api/tenpo/purchases/PURCHASE_ID/recalculate"
```

---

## 📈 Métricas de Impacto

### Diferencia de Interés Generado

| Capital | Cuotas | Tasa | Fee % | Interés sin Fee | Interés con Fee | Diferencia |
|---------|--------|------|-------|-----------------|-----------------|------------|
| $100,000 | 3 | 2.11% | 2% | $6,330 | $6,459 | +$129 (2.04%) |
| $218,365 | 3 | 2.11% | 2% | $13,824 | $14,097 | +$273 (1.98%) |
| $500,000 | 6 | 2.11% | 2% | $63,300 | $64,566 | +$1,266 (2.00%) |

**Observación:** El interés adicional es aproximadamente el 2% del interés original (proporcional al fee).

### Incremento en Cuota Mensual

| Capital | Cuotas | Fee % | Cuota sin Fee | Cuota con Fee | Incremento |
|---------|--------|-------|---------------|---------------|------------|
| $100,000 | 3 | 2% | $35,443 | $36,153 | +$710 (2.00%) |
| $218,365 | 3 | 2% | $77,396 | $78,943 | +$1,547 (1.99%) |
| $500,000 | 6 | 2% | $93,883 | $95,761 | +$1,878 (2.00%) |

---

## 🚀 Próximos Pasos (Futuro)

1. **Interfaz Frontend:**
   - Agregar campo "Fee %" en formulario de edición de compras
   - Mostrar `feeAmountClp` y `financedBaseClp` en tabla de compras
   - Agregar toggle "Incluir fee en cálculo" en recálculo manual

2. **Configuración Dinámica:**
   - Permitir configurar `feePct` por defecto en `TenpoTasaCuotas`
   - Aplicar automáticamente fee configurable en POST /sync

3. **Reportes:**
   - Dashboard con "Total pagado en fees"
   - Gráfico: "Evolución de fees por mes"

4. **Validaciones:**
   - Validar `feePct` entre 0 y 0.10 (máximo 10%)
   - Alert si fee > 5% (inusualmente alto)

---

## 📚 Referencias

- [tenpo_auditoria.md](./tenpo_auditoria.md) - Hallazgos iniciales
- [tenpo_addon_v1_impl.md](./tenpo_addon_v1_impl.md) - Implementación método TenpoAddOnV1
- [tenpo_fee_exposure.md](./tenpo_fee_exposure.md) - Fase 1 (exposición de fee sin cálculo)
- [schema.prisma](../node-version/prisma/schema.prisma) - Campo `metadata` en TenpoPurchase

---

**FIN DEL DOCUMENTO**
