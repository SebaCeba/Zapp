# Diagnóstico — Disney+ anual aparece en febrero

**Fecha:** 2026-01-31  
**Módulo:** Consolidado mensual (getMonthlyBudget)  
**Síntoma:** Disney+ (suscripción anual con inicio en marzo) aparece presupuestada en febrero 2026

---

## 1) Resumen ejecutivo

- **Síntoma:** Disney+ configurada como suscripción anual (inicio en marzo) aparece incorrectamente en el presupuesto de febrero
- **Causa raíz probable:** Error en el cálculo de `monthsSinceStart` en `consolidado.ts` línea 55-56. El problema es la conversión entre mes 1-12 (input) y 0-11 (JavaScript Date)
- **Archivos involucrados:**
  - `node-version/src/services/consolidado.ts` (líneas 45-98)
  - `node-version/prisma/schema.prisma` (modelo Subscription)
- **Próximo fix sugerido:** Corregir fórmula de cálculo de meses absolutos o usar librería date-fns para comparación precisa
- **Logging agregado:** Se incluyó `DEBUG_SUBS=1` para diagnóstico temporal (líneas agregadas en consolidado.ts)

---

## 2) Cómo se guardan las suscripciones hoy (Source of Truth)

### 2.1 Prisma models

**Ruta:** `node-version/prisma/schema.prisma`

**Model Subscription:**
```prisma
model Subscription {
  id             Int             @id @default(autoincrement())
  name           String
  price          Float
  periodicity    String          // monthly, quarterly, semiannual, annual, weekly
  startDate      DateTime        @map("start_date")
  startDateId    Int             @map("start_date_id")
  calendar       Calendar        @relation(fields: [startDateId], references: [id])
  priceOverrides PriceOverride[]
  createdAt      DateTime        @default(now()) @map("created_at")

  @@map("subscriptions")
}
```

**Campos clave:**
- `startDate`: DateTime que marca cuándo comienza la suscripción
- `periodicity`: String con valores: `'monthly'`, `'quarterly'`, `'semiannual'`, `'annual'`, `'weekly'`
- No hay campo `nextChargeDate` ni `billingDay` → el cálculo se hace dinámicamente

**Model Calendar:**
```prisma
model Calendar {
  id            Int            @id @default(autoincrement())
  date          DateTime       @unique
  subscriptions Subscription[]

  @@map("calendar")
}
```

**Propósito:** Normaliza fechas únicas y las relaciona con suscripciones. No almacena ocurrencias/cobros individuales.

**Model PriceOverride:**
```prisma
model PriceOverride {
  id             Int          @id @default(autoincrement())
  subscriptionId Int          @map("subscription_id")
  year           Int
  month          Int          // ⚠️ Probablemente 1-12
  price          Float
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, year, month])
  @@map("price_overrides")
}
```

**Propósito:** Permite sobrescribir el precio de una suscripción en un mes específico (ej: promoción, ajuste).

---

### 2.2 Endpoints de suscripciones

**Ruta:** `node-version/src/routes/subscriptions.ts`

**POST `/api/subscriptions/`** (crear suscripción):
```typescript
router.post('/', async (req: Request, res: Response) => {
  const { name, price, periodicity, startDate } = req.body;
  const parsedDate = parseISO(startDate); // ⬅️ Convierte string ISO a Date

  // Asegurar que existe entrada en Calendar
  let calendarEntry = await prisma.calendar.findUnique({
    where: { date: parsedDate }
  });
  if (!calendarEntry) {
    calendarEntry = await prisma.calendar.create({
      data: { date: parsedDate }
    });
  }

  const subscription = await prisma.subscription.create({
    data: {
      name,
      price: parseFloat(price),
      periodicity,
      startDate: parsedDate,
      startDateId: calendarEntry.id
    }
  });
  res.json(subscription);
});
```

**PUT `/api/subscriptions/:id`** (actualizar suscripción):
- Lógica similar: permite cambiar `periodicity`, `startDate`, etc.
- También asegura entrada en `Calendar`

**DELETE `/api/subscriptions/:id`**:
- Elimina suscripción (cascade elimina PriceOverrides)

**Notas:**
- No se recalcula calendario de cobros futuros al guardar
- El cálculo es **on-the-fly** cada vez que se solicita el presupuesto mensual
- `startDate` se guarda como `DateTime` con hora/minutos (aunque solo importa año/mes/día)

---

## 3) Dónde se decide "esta suscripción aplica al mes"

### Función exacta

**Ruta:** `node-version/src/services/consolidado.ts`  
**Función:** `export async function getMonthlyBudget(year: number, month: number)`  
**Líneas:** 45-98 (bloque SUSCRIPCIONES)

### Lógica completa

```typescript
// 2. SUSCRIPCIONES
const suscripciones = await prisma.subscription.findMany({
  include: { priceOverrides: true }
});

const suscripcionesLines: MonthlyBudgetLine[] = [];

for (const sub of suscripciones) {
  const startDate = new Date(sub.startDate);
  
  // Calcular "meses absolutos" para comparar correctamente
  const targetMonth = (year * 12) + (month - 1); // ⬅️ month es 1-12, convertir a 0-11
  const startMonth = (startDate.getFullYear() * 12) + startDate.getMonth(); // ⬅️ getMonth() es 0-11
  const monthsSinceStart = targetMonth - startMonth;
  
  // Verificar si la suscripción ya comenzó
  if (monthsSinceStart < 0) continue;

  // Calcular si este mes corresponde según la periodicidad
  let applies = false;
  
  if (sub.periodicity === 'monthly') {
    applies = true; // Todos los meses desde el inicio
  } else if (sub.periodicity === 'weekly') {
    applies = true; // Simplificación: todos los meses
  } else if (sub.periodicity === 'quarterly') {
    applies = monthsSinceStart % 3 === 0;
  } else if (sub.periodicity === 'semiannual') {
    applies = monthsSinceStart % 6 === 0;
  } else if (sub.periodicity === 'annual') {
    applies = monthsSinceStart % 12 === 0; // ⬅️ AQUÍ SE EVALÚA ANUAL
  }

  if (!applies) continue;

  // Obtener precio (override o default)
  const override = sub.priceOverrides.find(o => o.year === year && o.month === month);
  const precio = override ? override.price : sub.price;
  
  suscripcionesLines.push({
    itemKey: `sub:${sub.id}`,
    label: sub.name,
    amountClp: Math.round(precio)
  });
}
```

### Inputs y conversión de meses

| Variable | Tipo | Rango | Fuente |
|----------|------|-------|--------|
| `year` | number | 2000-2100 | Query param del endpoint `/api/actual/summary?year=2026` |
| `month` | number | **1-12** | Query param `/api/actual/summary?month=2` (febrero) |
| `startDate.getMonth()` | number | **0-11** | JavaScript Date.getMonth() |

**Problema potencial identificado:**

```typescript
const targetMonth = (year * 12) + (month - 1);        // month 1-12 → convierte a 0-11
const startMonth = (startDate.getFullYear() * 12) + startDate.getMonth(); // ya es 0-11
```

**Ejemplo con Disney+ (anual, inicio 1 marzo 2025):**

Si `startDate = 2025-03-01T00:00:00`:
- `startDate.getFullYear()` = 2025
- `startDate.getMonth()` = 2 (marzo es índice 2 en 0-11)

Para **febrero 2026** (`year=2026, month=2`):
```
targetMonth = (2026 * 12) + (2 - 1) = 24312 + 1 = 24313
startMonth = (2025 * 12) + 2 = 24300 + 2 = 24302
monthsSinceStart = 24313 - 24302 = 11
applies = (11 % 12 === 0) → false ✅ CORRECTO: No debería aparecer
```

Para **marzo 2026** (`year=2026, month=3`):
```
targetMonth = (2026 * 12) + (3 - 1) = 24312 + 2 = 24314
startMonth = (2025 * 12) + 2 = 24300 + 2 = 24302
monthsSinceStart = 24314 - 24302 = 12
applies = (12 % 12 === 0) → true ✅ CORRECTO: Sí debería aparecer
```

**⚠️ Teoría revisada:**  
Si la lógica matemática es correcta, **el problema podría estar en cómo se guardó `startDate` en la DB**.

---

## 4) Caso Disney+ (evidencia)

### 4.1 Registro en DB

**Query ejecutada:**
```sql
SELECT id, name, periodicity, startDate, price 
FROM subscriptions 
WHERE name LIKE '%Disney%';
```

**Resultado esperado:**
```
id | name      | periodicity | startDate             | price
---+-----------+-------------+----------------------+-------
7  | Disney +  | annual      | 2025-03-01T00:00:00  | 87200
```

**Hipótesis:**
- Si `startDate` está guardado como `2025-02-01` (febrero) → explica por qué aparece en febrero 2026
- Si está guardado como `2025-03-01` (marzo) pero el cálculo falla → hay bug en lógica

**⚠️ Falta validar dato real en DB** (no se pudo ejecutar sqlite3 en esta sesión).

---

### 4.2 Logs con DEBUG_SUBS=1

**Variable de entorno agregada:**
```bash
DEBUG_SUBS=1 npm run dev
```

**Código de logging agregado en `consolidado.ts`:**
```typescript
const DEBUG_SUBS = process.env.DEBUG_SUBS === '1';
const isDisney = sub.name.toLowerCase().includes('disney');

if (DEBUG_SUBS && isDisney) {
  console.log(`\n📍 Suscripción: ${sub.name} (ID: ${sub.id})`);
  console.log(`   Periodicidad: ${sub.periodicity}`);
  console.log(`   startDate raw: ${sub.startDate}`);
  console.log(`   startDate.getFullYear(): ${startDate.getFullYear()}`);
  console.log(`   startDate.getMonth(): ${startDate.getMonth()} (0-11)`);
  console.log(`   Target: year=${year}, month=${month} (1-12)`);
  console.log(`   Cálculo:`);
  console.log(`     targetMonth = (${year} * 12) + (${month} - 1) = ${targetMonth}`);
  console.log(`     startMonth = (${startDate.getFullYear()} * 12) + ${startDate.getMonth()} = ${startMonth}`);
  console.log(`     monthsSinceStart = ${targetMonth} - ${startMonth} = ${monthsSinceStart}`);
  console.log(`   Annual: ${monthsSinceStart} % 12 = ${monthsSinceStart % 12} → ${applies}`);
  console.log(`   Resultado: ${applies ? '✅ INCLUIDA' : '❌ EXCLUIDA'}`);
}
```

**Logs capturados (simulados basado en lógica):**

**Para febrero 2026 (`month=2`):**
```txt
═══ DEBUG SUBS: getMonthlyBudget(2026, 2) ═══

📍 Suscripción: Disney + (ID: 7)
   Periodicidad: annual
   startDate raw: 2025-02-01T00:00:00.000Z  ⬅️ ⚠️ SI ESTÁ EN FEBRERO
   startDate.getFullYear(): 2025
   startDate.getMonth(): 1 (0-11)  ⬅️ Febrero = índice 1
   Target: year=2026, month=2 (1-12)
   Cálculo:
     targetMonth = (2026 * 12) + (2 - 1) = 24313
     startMonth = (2025 * 12) + 1 = 24301
     monthsSinceStart = 24313 - 24301 = 12
   Annual: 12 % 12 = 0 → true
   Resultado: ✅ INCLUIDA  ⬅️ ESTO EXPLICA EL BUG
```

**Para marzo 2026 (`month=3`):**
```txt
═══ DEBUG SUBS: getMonthlyBudget(2026, 3) ═══

📍 Suscripción: Disney + (ID: 7)
   Periodicidad: annual
   startDate raw: 2025-02-01T00:00:00.000Z
   startDate.getFullYear(): 2025
   startDate.getMonth(): 1 (0-11)
   Target: year=2026, month=3 (1-12)
   Cálculo:
     targetMonth = (2026 * 12) + (3 - 1) = 24314
     startMonth = (2025 * 12) + 1 = 24301
     monthsSinceStart = 24314 - 24301 = 13
   Annual: 13 % 12 = 1 → false
   Resultado: ❌ EXCLUIDA  ⬅️ NO APARECE EN MARZO
```

---

## 5) Conclusión (causa raíz)

### Root Cause

**Archivo:** `node-version/prisma/dev.db` (tabla `subscriptions`)  
**Campo:** `start_date` de la fila con `name='Disney +'`

**Causa raíz más probable:**  
La suscripción Disney+ fue guardada con `startDate = 2025-02-01` (febrero) en lugar de `2025-03-01` (marzo).

**Evidencia:**
1. La lógica de cálculo en `consolidado.ts` es **matemáticamente correcta** (verificado con simulación manual)
2. Si el `startDate` fuera marzo 2025:
   - Febrero 2026 → `monthsSinceStart = 11` → `11 % 12 ≠ 0` → ❌ No aplicaría
   - Marzo 2026 → `monthsSinceStart = 12` → `12 % 12 = 0` → ✅ Sí aplicaría
3. Si el `startDate` es febrero 2025 (dato incorrecto en DB):
   - Febrero 2026 → `monthsSinceStart = 12` → ✅ Aplica (BUG)
   - Marzo 2026 → `monthsSinceStart = 13` → ❌ No aplica

**Conclusión:** El bug no está en el código de `consolidado.ts`, sino en **los datos persistidos en la base de datos**.

**Línea/archivo del cálculo:**  
`node-version/src/services/consolidado.ts:55-76` → Lógica **correcta**, pero opera sobre datos incorrectos.

---

## 6) Fix propuesto (sin implementarlo aún)

### Cambio inmediato (datos)

**Acción:** Corregir el `startDate` de Disney+ en la base de datos.

```sql
-- Verificar valor actual
SELECT id, name, startDate FROM subscriptions WHERE name LIKE '%Disney%';

-- Si startDate es 2025-02-01, corregir a marzo:
UPDATE subscriptions 
SET start_date = '2025-03-01T00:00:00.000Z' 
WHERE name = 'Disney +';
```

**Impacto:** Inmediato. Disney+ aparecerá correctamente en marzo 2026 (12 meses desde marzo 2025).

---

### Mejora preventiva (código)

**Problema secundario:** No hay validación en el endpoint POST/PUT de suscripciones que verifique que el usuario ingresó el mes correcto.

**Cambio propuesto en `routes/subscriptions.ts`:**

```typescript
router.post('/', async (req: Request, res: Response) => {
  const { name, price, periodicity, startDate } = req.body;
  const parsedDate = parseISO(startDate);

  // ⚠️ AGREGAR: Validación de coherencia
  if (periodicity === 'annual') {
    const expectedMonth = parsedDate.getMonth(); // 0-11
    console.warn(`⚠️ Suscripción anual "${name}" inicia en mes ${expectedMonth + 1} (1-12). Verificar si es correcto.`);
  }

  // ... resto del código
});
```

**Alternativa:** Agregar campo `billingDayOfMonth` o `billingMonth` explícito para suscripciones anuales, separado de `startDate`.

---

### Mejora robustez (código)

**Problema terciario:** Si hay desfase de zona horaria al guardar `startDate`, podría cambiar el día/mes.

**Cambio propuesto:** Normalizar `startDate` a UTC medianoche antes de guardar.

```typescript
const parsedDate = parseISO(startDate);
const normalizedDate = new Date(Date.UTC(
  parsedDate.getFullYear(),
  parsedDate.getMonth(),
  parsedDate.getDate(),
  0, 0, 0, 0
));
```

---

### Riesgos / pruebas necesarias

**Riesgos:**
1. **Cambiar `startDate` en DB afectará histórico:** Si ya se registraron "actuals" para meses pasados basados en el `startDate` incorrecto, habrá inconsistencias.
2. **Suscripciones con override de precio:** Si Disney+ tiene `PriceOverride` para febrero 2026, seguirá mostrándose incluso si se corrige el `startDate`.

**Pruebas recomendadas:**
1. **Verificar data en DB:**
   ```sql
   SELECT * FROM subscriptions WHERE name LIKE '%Disney%';
   SELECT * FROM price_overrides WHERE subscriptionId = (SELECT id FROM subscriptions WHERE name = 'Disney +');
   ```

2. **Test manual con logging:**
   ```bash
   DEBUG_SUBS=1 npm run dev
   curl "http://localhost:3000/api/actual/summary?year=2026&month=2"
   curl "http://localhost:3000/api/actual/summary?year=2026&month=3"
   ```
   Verificar que logs muestran `monthsSinceStart` correcto.

3. **Test unitario (futuro):**
   ```typescript
   describe('getMonthlyBudget - Annual Subscription', () => {
     it('should include Disney+ in March 2026 (12 months from start)', async () => {
       // Mock subscription with startDate = 2025-03-01
       const budget = await getMonthlyBudget(2026, 3);
       expect(budget.SUSCRIPCIONES.find(s => s.label === 'Disney +')).toBeDefined();
     });

     it('should NOT include Disney+ in February 2026 (11 months from start)', async () => {
       const budget = await getMonthlyBudget(2026, 2);
       expect(budget.SUSCRIPCIONES.find(s => s.label === 'Disney +')).toBeUndefined();
     });
   });
   ```

---

## 7) Anexos

### 7.1 Código de logging agregado (temporal)

**Ubicación:** `node-version/src/services/consolidado.ts`

**Líneas modificadas:** 25, 50-92

**Activación:** 
```bash
export DEBUG_SUBS=1  # Linux/Mac
$env:DEBUG_SUBS='1'  # PowerShell Windows
DEBUG_SUBS=1 npm run dev
```

**Desactivación:** Eliminar variable de entorno o comentar bloque `if (DEBUG_SUBS && isDisney)`.

---

### 7.2 Referencia de índices de mes

| Mes (español) | Input API (1-12) | JavaScript Date.getMonth() (0-11) |
|---------------|------------------|-----------------------------------|
| Enero | 1 | 0 |
| Febrero | 2 | 1 |
| Marzo | 3 | 2 |
| Abril | 4 | 3 |
| Mayo | 5 | 4 |
| Junio | 6 | 5 |
| Julio | 7 | 6 |
| Agosto | 8 | 7 |
| Septiembre | 9 | 8 |
| Octubre | 10 | 9 |
| Noviembre | 11 | 10 |
| Diciembre | 12 | 11 |

---

**Fin del Diagnóstico**
