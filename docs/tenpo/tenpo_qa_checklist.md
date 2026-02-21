# Checklist QA Manual - TenpoAddOnV1 con Fee Base

**Fecha:** 31 enero 2025  
**Versión:** 1.0  
**Sistema:** Módulo Tenpo con TenpoAddOnV1 + Fee Integration  
**Objetivo:** Validar cálculos, desglose UI, y manejo de casos edge

---

## 🎯 Resumen de Validación

Este checklist valida:

1. ✅ **TenpoAddOnV1** calcula correctamente intereses (método interest simple)
2. ✅ **Fee base** se integra en `financedBaseClp = capital + fee`
3. ✅ **Modo ESTIMADO vs REAL** se comportan diferente en UI
4. ✅ **Compras 1 cuota** no muestran interés por cuotas
5. ✅ **feeMissing** se detecta y muestra para compras antiguas

---

## 📋 Casos de Prueba

### Caso 1: Compra Multi-Cuota Conocida (Modo ESTIMADO → REAL)

**Objetivo:** Validar que cálculo estimado es preciso y modo REAL respeta valores confirmados.

#### 1.1 Preparación

**Crear compra nueva:**
```http
POST /api/tenpo/purchases
Content-Type: application/json

{
  "merchant": "Amazon",
  "amountTotalClp": 218365,
  "installmentsCount": 6,
  "purchaseDate": "2025-01-15",
  "tieneInteres": true
}
```

**Estado esperado:**
- `modoMonto`: `'ESTIMADO'` (por defecto)
- `metadata`: `null` o `{}` (sin fee capturada aún)

---

#### 1.2 Validar Modo ESTIMADO

**Acción:** Abrir `/tenpo` en frontend y localizar compra "Amazon"

**Verificaciones visuales:**

| Elemento UI | Valor Esperado | Ubicación |
|-------------|----------------|-----------|
| Badge "ESTIMADO" | 🟡 Naranja | Junto al total |
| Capital | $218,365 | Primera línea desglose |
| Fee operación | $0 (o "No capturada") | Segunda línea desglose |
| Interés total | ~$11,000 - $14,000 | Tercera línea desglose |
| Total estimado | ~$229,365 - $232,365 | Suma visible |
| ⚠️ Advertencia | "Este monto es estimado..." | Tooltip o mensaje |

**Verificaciones backend:**

```bash
# Consultar compra en DB
cd node-version
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.tenpoPurchase.findFirst({
  where: { merchant: 'Amazon', amountTotalClp: 218365 }
}).then(p => console.log(JSON.stringify(p, null, 2)));
"
```

**Campos esperados:**
```json
{
  "id": 123,
  "merchant": "Amazon",
  "amountTotalClp": 218365,
  "installmentsCount": 6,
  "modoMonto": "ESTIMADO",
  "totalFinanciadoEstimado": 230000,  // ← Aproximado
  "interesTotalEstimado": 11635,       // ← TenpoAddOnV1
  "metadata": null,                    // ← Sin fee
  "tieneInteres": true
}
```

**✅ Checklist:**
- [ ] Badge ESTIMADO visible
- [ ] Desglose muestra capital + fee + interés
- [ ] Total estimado es aproximado
- [ ] Advertencia de estimación visible
- [ ] `modoMonto='ESTIMADO'` en DB

---

#### 1.3 Agregar Fee Capturada

**Acción:** Actualizar metadata con fee real (ejemplo: 2%)

```http
PATCH /api/tenpo/purchases/123
Content-Type: application/json

{
  "metadata": {
    "feePct": 0.02
  }
}
```

**O via función backend:**
```bash
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.tenpoPurchase.update({
  where: { id: 123 },
  data: { metadata: { feePct: 0.02 } }
}).then(() => console.log('✅ Fee actualizada'));
"
```

**Recalcular compra:**
```http
POST /api/tenpo/purchases/123/recalcular
```

**Valores esperados después del recálculo:**
```javascript
// Cálculo manual de referencia:
const capital = 218365;
const feePct = 0.02;
const n = 6;
const tasaMensual = 0.0299; // Ejemplo, verificar con GET /api/tenpo/config

// Paso 1: Fee
const feeAmount = Math.round(capital * feePct); // = 4367

// Paso 2: Base financiada
const financedBase = capital + feeAmount; // = 222732

// Paso 3: Interés total (TenpoAddOnV1)
const interesTotal = Math.round(financedBase * tasaMensual * n); // ≈ 39,946

// Paso 4: Total financiado
const totalFinanciado = financedBase + interesTotal; // ≈ 262,678
```

**Verificaciones visuales:**

| Elemento UI | Valor Esperado | Nota |
|-------------|----------------|------|
| Capital | $218,365 | Sin cambio |
| Fee operación (2%) | $4,367 | Calculado |
| Interés total | ~$39,946 | Con base = capital + fee |
| Total estimado | ~$262,678 | Suma visible |
| Badge | 🟡 ESTIMADO | Aún no confirmado |

**✅ Checklist:**
- [ ] Fee se muestra en desglose
- [ ] Interés total refleja base financiada (capital + fee)
- [ ] Total estimado aumentó por fee
- [ ] Badge sigue siendo ESTIMADO

---

#### 1.4 Confirmar con Total Real

**Acción:** Confirmar con total real del estado de cuenta bancario

**Supuesto:** Banco confirmó total = $232,518 (6 cuotas × $38,753)

```http
POST /api/tenpo/purchases/123/confirmar-real
Content-Type: application/json

{
  "totalConfirmadoClp": 232518,
  "cuotasReales": [38753, 38753, 38753, 38753, 38753, 38753]
}
```

**Estado esperado después:**
- `modoMonto`: `'REAL'`
- `totalFinanciadoEstimado`: `232518` (valor real)
- `interesTotalEstimado`: `232518 - 218365 - 4367 = 9786`

**Verificaciones visuales:**

| Elemento UI | Valor Esperado | Ubicación |
|-------------|----------------|-----------|
| Badge "CONFIRMADO" | 🟢 Verde | Junto al total |
| Capital | $218,365 | Primera línea |
| Fee operación (2%) | $4,367 | Segunda línea |
| Interés total | $9,786 | Tercera línea (REAL del banco) |
| Total confirmado | **$232,518** | Suma exacta en negrita |
| ❌ Sin advertencia | - | No hay tooltip de estimación |
| Calendario cuotas | 6 × $38,753 | Tabla de cuotas |

**Diferencia ESTIMADO vs REAL:**
```
Total ESTIMADO (con fee 2%): $262,678
Total REAL (del banco):       $232,518
Diferencia:                   -$30,160
```

**Razón de diferencia:**
- Tasa estimada puede ser mayor que tasa real aplicada por banco
- Fee estimada puede diferir de fee real
- TenpoAddOnV1 es aproximación, banco usa su propio método

**✅ Checklist:**
- [ ] Badge cambió a CONFIRMADO (verde)
- [ ] Total muestra valor exacto del banco ($232,518)
- [ ] Interés total se derivó de: total - capital - fee
- [ ] No hay advertencia de estimación
- [ ] Calendario muestra 6 cuotas × $38,753
- [ ] `modoMonto='REAL'` en DB

---

#### 1.5 Validar Guardrail de Recálculo

**Acción:** Intentar recalcular compra REAL

```http
POST /api/tenpo/purchases/123/recalcular
```

**Comportamiento esperado:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 123,
  "merchant": "Amazon",
  "totalFinanciadoEstimado": 232518  // ← Sin cambios
}
```

**Log esperado en terminal backend:**
```
🛡️  [GUARDRAIL] Compra 123 está en modo REAL - Recálculo bloqueado
    Merchant: Amazon, Total confirmado: $232,518
```

**Intentar modificar tieneInteres:**
```http
PATCH /api/tenpo/purchases/123/interes
Content-Type: application/json

{ "tieneInteres": false }
```

**Comportamiento esperado:**
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "No se puede modificar compra en modo REAL. Los valores fueron confirmados con el banco y no deben cambiar."
}
```

**Log esperado:**
```
🛡️  [GUARDRAIL] Intento de modificar tieneInteres en compra REAL bloqueado
    Compra ID: 123, Merchant: Amazon
```

**✅ Checklist:**
- [ ] Recálculo no modifica valores REAL
- [ ] Log de guardrail aparece con 🛡️
- [ ] PATCH /interes retorna 400 error
- [ ] Frontend muestra mensaje de error apropiado

---

### Caso 2: Compra 1 Cuota con Fee

**Objetivo:** Validar que compras de 1 cuota NO muestran interés por cuotas (n=1).

#### 2.1 Preparación

**Crear compra 1 cuota:**
```http
POST /api/tenpo/purchases
Content-Type: application/json

{
  "merchant": "Spotify",
  "amountTotalClp": 5990,
  "installmentsCount": 1,
  "purchaseDate": "2025-01-20",
  "tieneInteres": false,
  "metadata": {
    "feePct": 0.015  // 1.5% fee
  }
}
```

**Estado esperado:**
- `modoMonto`: `'ESTIMADO'`
- `tieneInteres`: `false`
- `metadata.feePct`: `0.015`

---

#### 2.2 Validar Cálculo 1 Cuota

**Cálculo manual:**
```javascript
const capital = 5990;
const feePct = 0.015;
const n = 1;

// Fee
const feeAmount = Math.round(capital * feePct); // = 90

// Base financiada
const financedBase = capital + feeAmount; // = 6080

// Interés total (con n=1 y tieneInteres=false)
const interesTotal = 0; // ← No hay interés por cuotas

// Total
const totalFinanciado = financedBase + interesTotal; // = 6080
```

**Verificaciones visuales:**

| Elemento UI | Valor Esperado | Nota |
|-------------|----------------|------|
| Capital | $5,990 | Original |
| Fee operación (1.5%) | $90 | Calculado |
| Interés por cuotas | **❌ No mostrar** | n=1, no aplica |
| Total estimado | $6,080 | Capital + fee |
| Badge | 🟡 ESTIMADO | Aún no confirmado |
| Cuotas | 1 × $6,080 | Una sola cuota |

**✅ Checklist:**
- [ ] Fee se muestra ($90)
- [ ] NO se muestra línea de "Interés por cuotas"
- [ ] Total = capital + fee (sin interés adicional)
- [ ] Calendario muestra 1 sola cuota

---

#### 2.3 Confirmar Total Real (1 Cuota)

**Supuesto:** Banco confirmó cuota única = $6,100

```http
POST /api/tenpo/purchases/456/confirmar-real
Content-Type: application/json

{
  "totalConfirmadoClp": 6100,
  "cuotasReales": [6100]
}
```

**Verificaciones visuales:**

| Elemento UI | Valor Esperado |
|-------------|----------------|
| Badge | 🟢 CONFIRMADO |
| Capital | $5,990 |
| Fee operación | $110 (derivado: 6100 - 5990) |
| Interés por cuotas | ❌ No mostrar |
| Total confirmado | **$6,100** |

**Nota:** Si hay diferencia entre fee estimada ($90) y fee real ($110), el sistema puede:
- Opción A: Mostrar fee real derivada ($110)
- Opción B: Mantener fee estimada y mostrar "Ajustes" como línea extra ($20)

**✅ Checklist:**
- [ ] Badge CONFIRMADO
- [ ] Total exacto del banco
- [ ] Interés por cuotas NO aparece
- [ ] Fee o ajustes reflejan diferencia

---

### Caso 3: Compra Antigua sin feePct (feeMissing=true)

**Objetivo:** Validar que compras sin fee capturada muestran indicador `feeMissing`.

#### 3.1 Preparación

**Simular compra antigua (sin metadata):**

**Opción A: Crear compra sin metadata:**
```http
POST /api/tenpo/purchases
Content-Type: application/json

{
  "merchant": "Mercado Libre",
  "amountTotalClp": 150000,
  "installmentsCount": 3,
  "purchaseDate": "2024-12-01",  // ← Antes de implementar fee
  "tieneInteres": true,
  "metadata": null  // ← Sin fee
}
```

**Opción B: Actualizar compra existente para remover metadata:**
```bash
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.tenpoPurchase.update({
  where: { id: 789 },
  data: { metadata: null }
}).then(() => console.log('✅ Metadata removida'));
"
```

---

#### 3.2 Validar Respuesta API

**Consultar compra:**
```http
GET /api/tenpo/purchases/789
```

**Respuesta esperada:**
```json
{
  "id": 789,
  "merchant": "Mercado Libre",
  "amountTotalClp": 150000,
  "installmentsCount": 3,
  "modoMonto": "ESTIMADO",
  "totalFinanciadoEstimado": 163470,
  "interesTotalEstimado": 13470,
  "metadata": null,
  
  // ← Campos computados
  "feePct": null,
  "feeAmountClp": 0,
  "financedBaseClp": 150000,
  "feeMissing": true  // ← Indicador presente
}
```

**✅ Checklist:**
- [ ] `feeMissing: true` en respuesta JSON
- [ ] `feePct: null`
- [ ] `feeAmountClp: 0`
- [ ] `financedBaseClp = capital` (sin fee)

---

#### 3.3 Validar UI

**Verificaciones visuales:**

| Elemento UI | Valor Esperado | Ubicación |
|-------------|----------------|-----------|
| Capital | $150,000 | Desglose |
| Fee operación | ⚠️ "No capturada" | Badge amarillo o texto warning |
| Interés total | ~$13,470 | Solo sobre capital |
| Total estimado | ~$163,470 | Capital + interés (sin fee) |
| Tooltip/Mensaje | "Esta compra no tiene fee registrada..." | Hover sobre fee |

**Ejemplo implementación UI:**
```tsx
{feeMissing && (
  <div className="fee-warning">
    <span className="badge badge-warning">⚠️  Fee no capturada</span>
    <p className="text-muted small">
      Esta compra fue creada antes de implementar captura de fees.
      El cálculo usa solo capital + interés.
    </p>
  </div>
)}
```

**✅ Checklist:**
- [ ] Badge o indicador ⚠️ visible
- [ ] Mensaje explica por qué no hay fee
- [ ] Total estimado NO incluye fee
- [ ] Cálculo usa solo capital como base

---

#### 3.4 Actualizar con Fee Retroactivamente

**Acción:** Agregar fee manualmente a compra antigua

```http
PATCH /api/tenpo/purchases/789
Content-Type: application/json

{
  "metadata": {
    "feePct": 0.02
  }
}
```

**Recalcular:**
```http
POST /api/tenpo/purchases/789/recalcular
```

**Verificaciones post-actualización:**

| Elemento UI | Antes | Después |
|-------------|-------|---------|
| feeMissing | `true` | `false` |
| feeAmountClp | `0` | `$3,000` |
| financedBaseClp | `$150,000` | `$153,000` |
| interesTotalEstimado | `$13,470` | `$13,739` (recalculado) |
| totalFinanciadoEstimado | `$163,470` | `$166,739` |

**✅ Checklist:**
- [ ] `feeMissing` cambió a `false`
- [ ] Fee ahora visible en desglose
- [ ] Interés recalculado con nueva base
- [ ] Total aumentó por fee + interés adicional

---

## 🔍 Verificaciones Globales

### Backend Health Check

**1. Verificar tasas vigentes:**
```http
GET /api/tenpo/config
```

**Respuesta esperada:**
```json
{
  "tasaMensual": 0.0299,
  "metodoPorDefecto": "TenpoAddOnV1",
  "feeDefaultPct": 0.02
}
```

**2. Verificar consistencia de datos:**
```bash
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function auditoria() {
  const compras = await prisma.tenpoPurchase.findMany({
    select: {
      id: true,
      merchant: true,
      modoMonto: true,
      totalFinanciadoEstimado: true,
      metadata: true
    }
  });

  console.log('📊 Auditoría de Compras:');
  console.log('========================');
  
  const stats = {
    total: compras.length,
    estimadas: compras.filter(c => c.modoMonto === 'ESTIMADO').length,
    reales: compras.filter(c => c.modoMonto === 'REAL').length,
    conFee: compras.filter(c => c.metadata?.feePct).length,
    sinFee: compras.filter(c => !c.metadata?.feePct).length
  };

  console.log(JSON.stringify(stats, null, 2));
}

auditoria();
"
```

**Valores esperados:**
```json
{
  "total": 50,
  "estimadas": 30,
  "reales": 20,
  "conFee": 40,
  "sinFee": 10  // ← Compras antiguas
}
```

---

### Frontend Visual Tests

**1. Navegación:**
- [ ] `/tenpo` muestra lista de compras
- [ ] Cada compra tiene badge (ESTIMADO o CONFIRMADO)
- [ ] Click en compra expande desglose

**2. Desglose expandido:**
- [ ] Capital siempre visible
- [ ] Fee visible si `feePct` presente
- [ ] Interés visible si `tieneInteres=true`
- [ ] Total suma correcta
- [ ] Badge color correcto (🟡 naranja / 🟢 verde)

**3. Casos edge:**
- [ ] Compra 1 cuota no muestra interés por cuotas
- [ ] Compra sin fee muestra "⚠️ No capturada"
- [ ] Compra REAL no permite modificación (botones deshabilitados)

---

### Logs de Guardrails

**Ejecutar recálculo masivo:**
```http
POST /api/tenpo/recalcular-estimadas
```

**Logs esperados:**
```
🔄 Recalculando 30 compras estimadas...
🛡️  [GUARDRAIL] Compra 123 marcada como REAL - Saltada por seguridad
🛡️  [GUARDRAIL] Compra 456 marcada como REAL - Saltada por seguridad
✅ 28 compras recalculadas exitosamente
🛡️  2 compras REAL saltadas por guardrail
```

**✅ Checklist:**
- [ ] Solo compras ESTIMADO se recalculan
- [ ] Compras REAL muestran log de guardrail con 🛡️
- [ ] Resumen final muestra `saltadas` count

---

## 📊 Tabla Resumen de Casos

| # | Caso | modoMonto | installmentsCount | metadata.feePct | feeMissing | Interés Visible | Total |
|---|------|-----------|-------------------|-----------------|------------|----------------|-------|
| 1.1 | Amazon inicial | ESTIMADO | 6 | `null` | `true` | ✅ Sí | ~$229k |
| 1.3 | Amazon con fee | ESTIMADO | 6 | `0.02` | `false` | ✅ Sí | ~$263k |
| 1.4 | Amazon confirmado | REAL | 6 | `0.02` | `false` | ✅ Sí | $232,518 |
| 2.1 | Spotify 1 cuota | ESTIMADO | 1 | `0.015` | `false` | ❌ No | $6,080 |
| 2.3 | Spotify confirmado | REAL | 1 | `0.015` | `false` | ❌ No | $6,100 |
| 3.1 | Mercado Libre antiguo | ESTIMADO | 3 | `null` | `true` | ✅ Sí | ~$163k |
| 3.4 | ML con fee agregada | ESTIMADO | 3 | `0.02` | `false` | ✅ Sí | ~$167k |

---

## ✅ Checklist Final

### Funcionalidad Core

- [ ] TenpoAddOnV1 calcula interés simple correctamente
- [ ] Fee se integra en base financiada (capital + fee)
- [ ] Modo ESTIMADO muestra valores calculados con advertencia
- [ ] Modo REAL muestra valores exactos del banco
- [ ] Guardrails previenen recálculo de compras REAL

### UI/UX

- [ ] Badge ESTIMADO (🟡 naranja) vs CONFIRMADO (🟢 verde)
- [ ] Desglose muestra capital, fee, interés, total
- [ ] Compras 1 cuota NO muestran interés por cuotas
- [ ] Compras sin fee muestran "⚠️ No capturada"
- [ ] Advertencia de estimación visible en ESTIMADO
- [ ] Botones deshabilitados en modo REAL

### Backend

- [ ] API retorna campos computados (feePct, feeAmountClp, feeMissing)
- [ ] Recálculo respeta guardrails con logs 🛡️
- [ ] PATCH /interes retorna 400 en modo REAL
- [ ] Endpoints de confirmación cambian modoMonto a REAL

### Edge Cases

- [ ] Compra sin metadata → feeMissing=true
- [ ] Compra 1 cuota → sin interés por cuotas
- [ ] Recálculo masivo salta compras REAL
- [ ] Fee retroactiva actualiza cálculos correctamente

---

## 🐛 Reportar Issues

Si encuentras discrepancias durante QA, reportar con:

**Template:**
```markdown
### Bug: [Título descriptivo]

**Caso:** Caso 1.3 - Amazon con fee

**Esperado:**
- Total estimado: $262,678
- Interés total: $39,946

**Obtenido:**
- Total estimado: $265,000
- Interés total: $42,268

**Reproducción:**
1. POST /purchases con capital 218365, n=6
2. PATCH metadata { feePct: 0.02 }
3. POST /recalcular
4. GET /purchases/:id

**Logs:**
```
✅ Compra 123 recalculada: Total $265,000
```

**Base de datos:**
```json
{
  "totalFinanciadoEstimado": 265000,
  "interesTotalEstimado": 42268
}
```

**Navegador:** Chrome 120
**Backend:** Node.js 20.x
**Fecha:** 2025-01-31
```

---

## 📚 Referencias

- [tenpo_addon_v1_impl.md](./tenpo_addon_v1_impl.md) - Implementación TenpoAddOnV1
- [tenpo_fee_exposure.md](./tenpo_fee_exposure.md) - Fee metadata
- [tenpo_addon_fee_base.md](./tenpo_addon_fee_base.md) - Fee integration
- [tenpo_ui_desglose.md](./tenpo_ui_desglose.md) - UI desglose
- [tenpo_fee_missing.md](./tenpo_fee_missing.md) - feeMissing support
- [tenpo_real_guardrails.md](./tenpo_real_guardrails.md) - Guardrails

---

**FIN DEL CHECKLIST**
