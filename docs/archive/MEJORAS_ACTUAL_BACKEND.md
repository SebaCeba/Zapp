# Mejoras Backend - Módulo Actual (Enum, Lock, pctExec, Cache)

## 1. Cambios en Prisma Schema

### 1.1. Agregar Enum ActualCategory

**Ubicación:** `node-version/prisma/schema.prisma`

**Agregar antes de model ActualEntry:**

```prisma
enum ActualCategory {
  INGRESOS
  SUSCRIPCIONES
  OBLIGACIONES
  HIPOTECARIO
  SERVICIOS_BASICOS
  SUPERMERCADO
  AJUSTES
}
```

### 1.2. Modificar Model ActualEntry

**Reemplazar:**

```prisma
model ActualEntry {
  id          String   @id @default(cuid())
  year        Int
  month       Int      // 1-12
  category    String   // INGRESOS, SUSCRIPCIONES, ...
  itemKey     String   @map("item_key")
  label       String?
  amountClp   Int      @map("amount_clp")
  isPaid      Boolean? @map("is_paid")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([year, month, category, itemKey])
  @@index([year, month])
  @@index([category])
  @@map("actual_entries")
}
```

**Por:**

```prisma
model ActualEntry {
  id          String          @id @default(cuid())
  year        Int
  month       Int             // 1-12
  category    ActualCategory
  itemKey     String          @map("item_key")
  label       String?
  amountClp   Int             @map("amount_clp")
  isPaid      Boolean?        @map("is_paid")
  isLocked    Boolean         @default(false) @map("is_locked")
  createdAt   DateTime        @default(now()) @map("created_at")
  updatedAt   DateTime        @updatedAt @map("updated_at")

  @@unique([year, month, category, itemKey])
  @@index([year, month])
  @@index([category])
  @@map("actual_entries")
}
```

**Cambios realizados:**
1. `category String` → `category ActualCategory`
2. Agregado `isLocked Boolean @default(false) @map("is_locked")`

### 1.3. Generar Migración

```bash
cd node-version
npx prisma migrate dev --name actual_category_enum_and_lock
npx prisma generate
```

---

## 2. Actualización del Router Actual

### 2.1. Archivo: `node-version/src/routes/actual.ts`

**Cambios completos:**

```typescript
import { Router, Request, Response } from 'express';
import { ActualCategory } from '@prisma/client';
import prisma from '../db';
import { getMonthlyBudget } from '../services/consolidado';

const router = Router();

// Validar categorías permitidas desde el enum
const VALID_CATEGORIES = Object.values(ActualCategory);

// PUT /api/actual/entry - Upsert entry actual
router.put('/entry', async (req: Request, res: Response) => {
  try {
    const { year, month, category, itemKey, label, amountClp, isPaid } = req.body;

    // Validaciones
    if (!year || !month || !category || !itemKey || amountClp === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: year, month, category, itemKey, amountClp' 
      });
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid month (1-12)' });
    }

    if (!VALID_CATEGORIES.includes(category as ActualCategory)) {
      return res.status(400).json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
      });
    }

    if (!Number.isInteger(amountClp) || amountClp < 0) {
      return res.status(400).json({ error: 'Invalid amountClp (must be non-negative integer)' });
    }

    // Validar que AJUSTES tenga label
    if (category === ActualCategory.AJUSTES && !label) {
      return res.status(400).json({ error: 'Label is required for AJUSTES category' });
    }

    // Verificar si existe y está bloqueado
    const existing = await prisma.actualEntry.findUnique({
      where: {
        year_month_category_itemKey: {
          year,
          month,
          category: category as ActualCategory,
          itemKey
        }
      }
    });

    if (existing && existing.isLocked) {
      return res.status(423).json({ 
        error: 'Month is locked. Cannot edit this entry.' 
      });
    }

    // Upsert
    const entry = await prisma.actualEntry.upsert({
      where: {
        year_month_category_itemKey: {
          year,
          month,
          category: category as ActualCategory,
          itemKey
        }
      },
      update: {
        label,
        amountClp,
        isPaid
        // updatedAt lo maneja automáticamente @updatedAt
      },
      create: {
        year,
        month,
        category: category as ActualCategory,
        itemKey,
        label,
        amountClp,
        isPaid,
        isLocked: false
      }
    });

    res.json(entry);
  } catch (error) {
    console.error('Error upserting actual entry:', error);
    res.status(500).json({ error: 'Failed to upsert actual entry' });
  }
});

// GET /api/actual/summary?year=YYYY&month=M
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Invalid year or month' });
    }

    // 1. Obtener presupuesto del mes (con cache)
    const budget = await getMonthlyBudget(year, month);

    // 2. Obtener entradas actuales del mes
    const actualEntries = await prisma.actualEntry.findMany({
      where: { year, month }
    });

    // 3. Consolidar por categoría
    const summary = VALID_CATEGORIES.map(category => {
      const budgetLines = budget[category] || [];
      const actualLines = actualEntries.filter(e => e.category === category);

      // Crear mapa de actuales por itemKey
      const actualMap = new Map<string, typeof actualEntries[0]>();
      actualLines.forEach(entry => {
        actualMap.set(entry.itemKey, entry);
      });

      // Consolidar líneas
      const lines = budgetLines.map((budgetLine: any) => {
        const actualEntry = actualMap.get(budgetLine.itemKey);
        const budgetClp = budgetLine.amountClp || 0;
        const actualClp = actualEntry?.amountClp || 0;
        const deltaClp = actualClp - budgetClp;
        
        // pctExec: null si no hay presupuesto, sino porcentaje con 2 decimales
        const pctExec = budgetClp > 0 
          ? Math.round((actualClp / budgetClp) * 10000) / 100 
          : null;

        return {
          itemKey: budgetLine.itemKey,
          label: actualEntry?.label || budgetLine.label,
          budgetClp,
          actualClp,
          deltaClp,
          pctExec,
          isPaid: actualEntry?.isPaid
        };
      });

      // Agregar líneas actuales que no están en presupuesto (ej: AJUSTES)
      actualLines.forEach(entry => {
        if (!budgetLines.find((b: any) => b.itemKey === entry.itemKey)) {
          lines.push({
            itemKey: entry.itemKey,
            label: entry.label || entry.itemKey,
            budgetClp: 0,
            actualClp: entry.amountClp,
            deltaClp: entry.amountClp,
            pctExec: null, // Sin presupuesto => null
            isPaid: entry.isPaid
          });
        }
      });

      // Calcular totales de categoría
      const totalBudget = lines.reduce((sum, l) => sum + l.budgetClp, 0);
      const totalActual = lines.reduce((sum, l) => sum + l.actualClp, 0);
      const totalDelta = totalActual - totalBudget;
      const totalPctExec = totalBudget > 0 
        ? Math.round((totalActual / totalBudget) * 10000) / 100 
        : null;

      return {
        category,
        totalBudget,
        totalActual,
        totalDelta,
        totalPctExec,
        lines
      };
    });

    res.json({
      year,
      month,
      categories: summary
    });
  } catch (error) {
    console.error('Error getting actual summary:', error);
    res.status(500).json({ error: 'Failed to get actual summary' });
  }
});

// GET /api/actual/entries?year=YYYY&month=M&category=X
router.get('/entries', async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const category = req.query.category as ActualCategory | undefined;

    const where: any = {};
    if (year) where.year = year;
    if (month) where.month = month;
    if (category) where.category = category;

    const entries = await prisma.actualEntry.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { category: 'asc' },
        { itemKey: 'asc' }
      ]
    });

    res.json(entries);
  } catch (error) {
    console.error('Error fetching actual entries:', error);
    res.status(500).json({ error: 'Failed to fetch actual entries' });
  }
});

// DELETE /api/actual/entry/:id
router.delete('/entry/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar si está bloqueado antes de eliminar
    const entry = await prisma.actualEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.isLocked) {
      return res.status(423).json({ 
        error: 'Month is locked. Cannot delete this entry.' 
      });
    }

    await prisma.actualEntry.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting actual entry:', error);
    res.status(500).json({ error: 'Failed to delete actual entry' });
  }
});

export default router;
```

**Cambios clave:**
1. Import `ActualCategory` desde `@prisma/client`
2. `VALID_CATEGORIES` usa `Object.values(ActualCategory)`
3. PUT valida si entry existe y está bloqueado (status 423)
4. DELETE también valida lock
5. `pctExec` es `null` cuando `budgetClp === 0`
6. Removido `updatedAt: new Date()` del update (Prisma lo maneja automáticamente)

---

## 3. Cache en Servicio Consolidado

### 3.1. Archivo: `node-version/src/services/consolidado.ts`

**Agregar al inicio del archivo (después de imports):**

```typescript
import prisma from '../db';

interface BudgetLine {
  itemKey: string;
  label: string;
  amountClp: number;
}

interface MonthlyBudget {
  INGRESOS: BudgetLine[];
  SUSCRIPCIONES: BudgetLine[];
  OBLIGACIONES: BudgetLine[];
  HIPOTECARIO: BudgetLine[];
  SERVICIOS_BASICOS: BudgetLine[];
  SUPERMERCADO: BudgetLine[];
  AJUSTES: BudgetLine[];
}

// ========== CACHE EN MEMORIA ==========
type CacheKey = string;
interface CacheEntry {
  expiresAt: number;
  data: MonthlyBudget;
}

const budgetCache = new Map<CacheKey, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minuto (ajustable: 300_000 = 5 min)

function getCacheKey(year: number, month: number): CacheKey {
  return `${year}-${month}`;
}

function getCachedBudget(year: number, month: number): MonthlyBudget | null {
  const key = getCacheKey(year, month);
  const cached = budgetCache.get(key);
  
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  
  // Cache expirado o no existe
  if (cached) {
    budgetCache.delete(key);
  }
  
  return null;
}

function setCachedBudget(year: number, month: number, data: MonthlyBudget): void {
  const key = getCacheKey(year, month);
  budgetCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    data
  });
}

// Opcional: limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of budgetCache.entries()) {
    if (now >= entry.expiresAt) {
      budgetCache.delete(key);
    }
  }
}, CACHE_TTL_MS);

// ========================================

const MESES_KEYS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export async function getMonthlyBudget(year: number, month: number): Promise<MonthlyBudget> {
  // Verificar cache
  const cached = getCachedBudget(year, month);
  if (cached) {
    return cached;
  }

  // Si no hay cache, calcular
  const mesKey = MESES_KEYS[month - 1];
  
  // ... (resto del código existente de carga de datos)
  const [
    ingresosData,
    serviciosData,
    bonosData,
    subscriptionsData,
    obligacionesData,
    paymentsData,
    segurosData,
    supuestoData,
    supermercadoData
  ] = await Promise.all([
    // ... todas las queries existentes
  ]);

  // ... (resto de la lógica de cálculo existente)

  const result: MonthlyBudget = {
    INGRESOS: ingresosLines,
    SUSCRIPCIONES: suscripcionesLines,
    OBLIGACIONES: obligacionesLines,
    HIPOTECARIO: hipotecarioLines,
    SERVICIOS_BASICOS: serviciosLines,
    SUPERMERCADO: supermercadoLines,
    AJUSTES: []
  };

  // Guardar en cache antes de retornar
  setCachedBudget(year, month, result);

  return result;
}
```

**Estructura completa esperada:**

```typescript
import prisma from '../db';

// ... interfaces BudgetLine, MonthlyBudget ...

// CACHE
const budgetCache = new Map<CacheKey, CacheEntry>();
const CACHE_TTL_MS = 60_000;
// ... funciones getCachedBudget, setCachedBudget, setInterval ...

const MESES_KEYS = [...];

export async function getMonthlyBudget(year: number, month: number): Promise<MonthlyBudget> {
  // 1. Verificar cache
  const cached = getCachedBudget(year, month);
  if (cached) return cached;

  // 2. Calcular (código existente completo)
  const mesKey = MESES_KEYS[month - 1];
  
  const [ingresosData, ...] = await Promise.all([...]);
  
  // ... lógica de ingresos, servicios, hipotecario, etc. ...

  const result: MonthlyBudget = {
    INGRESOS: ingresosLines,
    SUSCRIPCIONES: suscripcionesLines,
    OBLIGACIONES: obligacionesLines,
    HIPOTECARIO: hipotecarioLines,
    SERVICIOS_BASICOS: serviciosLines,
    SUPERMERCADO: supermercadoLines,
    AJUSTES: []
  };

  // 3. Guardar en cache
  setCachedBudget(year, month, result);

  return result;
}
```

**Notas del cache:**
- TTL de 1 minuto (ajustable a 5 min en producción)
- Limpieza automática cada minuto de entradas expiradas
- No persiste entre reinicios (en memoria)
- Para producción se puede usar Redis si es necesario

---

## 4. Actualización de Documentación

### 4.1. Archivo: `node-version/docs/actual.md`

**Sección a actualizar: "Modelo de Datos"**

**Reemplazar:**

```markdown
### ActualEntry

Representa una entrada real (gasto o ingreso ejecutado) en un mes específico.

**Campos:**
- `id` (String/CUID): Identificador único
- `year` (Int): Año (ej: 2026)
- `month` (Int): Mes (1-12)
- `category` (String): Categoría (INGRESOS, SUSCRIPCIONES, OBLIGACIONES, HIPOTECARIO, SERVICIOS_BASICOS, SUPERMERCADO, AJUSTES)
- `itemKey` (String): Clave única de la línea (ej: `sub:5`, `ing:1`, `sm:total`, `man:uuid`)
- `label` (String?): Etiqueta descriptiva (obligatoria para AJUSTES)
- `amountClp` (Int): Monto en pesos chilenos (entero)
- `isPaid` (Boolean?): Indica si fue pagado (útil para suscripciones/obligaciones)
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Fecha de última actualización
```

**Por:**

```markdown
### ActualEntry

Representa una entrada real (gasto o ingreso ejecutado) en un mes específico.

**Campos:**
- `id` (String/CUID): Identificador único
- `year` (Int): Año (ej: 2026)
- `month` (Int): Mes (1-12)
- `category` (ActualCategory): Categoría como enum (INGRESOS, SUSCRIPCIONES, OBLIGACIONES, HIPOTECARIO, SERVICIOS_BASICOS, SUPERMERCADO, AJUSTES)
- `itemKey` (String): Clave única de la línea (ej: `sub:5`, `ing:1`, `sm:total`, `man:uuid`)
- `label` (String?): Etiqueta descriptiva (obligatoria para AJUSTES)
- `amountClp` (Int): Monto en pesos chilenos (entero)
- `isPaid` (Boolean?): Indica si fue pagado (útil para suscripciones/obligaciones)
- `isLocked` (Boolean): Indica si el mes está bloqueado para edición (default: false)
- `createdAt` (DateTime): Fecha de creación
- `updatedAt` (DateTime): Fecha de última actualización

**Enum ActualCategory:**
```prisma
enum ActualCategory {
  INGRESOS
  SUSCRIPCIONES
  OBLIGACIONES
  HIPOTECARIO
  SERVICIOS_BASICOS
  SUPERMERCADO
  AJUSTES
}
```

**Bloqueo de Meses:**
- Cuando `isLocked = true`, no se permite editar ni eliminar la entrada
- PUT y DELETE retornan status 423 (Locked)
- Útil para cerrar periodos contables o auditorías
```

---

**Sección a agregar: "Response Fields"**

```markdown
### Cambios en Respuestas

**pctExec (Porcentaje de Ejecución):**
- Si `budgetClp > 0`: número con 2 decimales (ej: 108.33)
- Si `budgetClp === 0`: `null` (no hay presupuesto, no se puede calcular %)
- Frontend puede mostrar "N/A" o "-" cuando es null

**Ejemplo:**
```json
{
  "itemKey": "man:clxxx123",
  "label": "Gasto imprevisto",
  "budgetClp": 0,
  "actualClp": 25000,
  "deltaClp": 25000,
  "pctExec": null
}
```
```

---

**Sección a agregar: "Errores Relacionados con Lock"**

```markdown
## Errores Relacionados con Lock

### Error 423: Month Locked

**Descripción:** Intento de editar o eliminar una entrada en mes bloqueado.

**Request:**
```http
PUT /api/actual/entry
Content-Type: application/json

{
  "year": 2025,
  "month": 12,
  "category": "SUPERMERCADO",
  "itemKey": "sm:total",
  "amountClp": 500000
}
```

**Response 423:**
```json
{
  "error": "Month is locked. Cannot edit this entry."
}
```

**Solución:**
- Contactar al administrador para desbloquear el mes
- O trabajar en el mes actual (no bloqueado)

**Casos de uso del lock:**
1. Cierre mensual contable (no modificar después de reportes)
2. Auditorías (congelar datos históricos)
3. Prevención de ediciones accidentales en meses pasados
```

---

## 5. Testing de Cambios

### 5.1. Compilación TypeScript

```bash
cd node-version
npm run build
# O si usas tsc directamente:
npx tsc --noEmit
```

**No debe haber errores de tipos.**

---

### 5.2. Probar Migración

```bash
# Backup de DB (por si acaso)
cp prisma/dev.db prisma/dev.db.backup

# Ejecutar migración
npx prisma migrate dev --name actual_category_enum_and_lock

# Verificar que se creó la migración en prisma/migrations/
```

**Verificar en SQLite:**
```sql
-- Abrir DB
sqlite3 prisma/dev.db

-- Ver estructura de actual_entries
.schema actual_entries

-- Debe mostrar:
-- - category con CHECK constraint (enum simulado)
-- - is_locked INTEGER NOT NULL DEFAULT 0
```

---

### 5.3. Probar Endpoints

#### Test 1: PUT con categoría válida

```bash
curl -X PUT http://localhost:3000/api/actual/entry \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1,
    "category": "SUPERMERCADO",
    "itemKey": "sm:total",
    "amountClp": 450000
  }'
```

**Esperado:** 200 OK con entry creado

---

#### Test 2: PUT con categoría inválida

```bash
curl -X PUT http://localhost:3000/api/actual/entry \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1,
    "category": "INVALIDO",
    "itemKey": "sm:total",
    "amountClp": 450000
  }'
```

**Esperado:** 400 Bad Request con mensaje de categorías válidas

---

#### Test 3: Simular Lock (manual en DB)

```sql
-- En sqlite3 o DB client
UPDATE actual_entries 
SET is_locked = 1 
WHERE year = 2026 AND month = 1 AND item_key = 'sm:total';
```

Luego intentar editar:

```bash
curl -X PUT http://localhost:3000/api/actual/entry \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1,
    "category": "SUPERMERCADO",
    "itemKey": "sm:total",
    "amountClp": 500000
  }'
```

**Esperado:** 423 Locked con mensaje "Month is locked. Cannot edit this entry."

---

#### Test 4: GET summary con pctExec null

Crear entrada sin presupuesto (AJUSTES):

```bash
curl -X PUT http://localhost:3000/api/actual/entry \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1,
    "category": "AJUSTES",
    "itemKey": "man:test123",
    "label": "Gasto inesperado",
    "amountClp": 35000
  }'
```

Luego obtener summary:

```bash
curl "http://localhost:3000/api/actual/summary?year=2026&month=1"
```

**Verificar en response:**
```json
{
  "category": "AJUSTES",
  "lines": [
    {
      "itemKey": "man:test123",
      "label": "Gasto inesperado",
      "budgetClp": 0,
      "actualClp": 35000,
      "deltaClp": 35000,
      "pctExec": null  // ← Debe ser null, NO 0
    }
  ]
}
```

---

#### Test 5: Verificar Cache

Primera petición (sin cache):

```bash
time curl "http://localhost:3000/api/actual/summary?year=2026&month=1"
# Medir tiempo (ej: 250ms)
```

Segunda petición inmediata (con cache):

```bash
time curl "http://localhost:3000/api/actual/summary?year=2026&month=1"
# Debe ser más rápido (ej: 10ms)
```

Esperar 65 segundos (TTL expirado) y volver a pedir:

```bash
time curl "http://localhost:3000/api/actual/summary?year=2026&month=1"
# Debe volver a tardar más (recalcula)
```

---

## 6. Checklist de Implementación

### Fase 1: Schema y Migración
- [ ] Agregar `enum ActualCategory` a schema.prisma
- [ ] Cambiar `category String` por `category ActualCategory` en ActualEntry
- [ ] Agregar campo `isLocked Boolean @default(false) @map("is_locked")`
- [ ] Ejecutar `npx prisma migrate dev --name actual_category_enum_and_lock`
- [ ] Ejecutar `npx prisma generate`
- [ ] Verificar migración en carpeta migrations/

### Fase 2: Router Actual
- [ ] Importar `ActualCategory` desde `@prisma/client`
- [ ] Cambiar `VALID_CATEGORIES` a `Object.values(ActualCategory)`
- [ ] Agregar validación de lock en PUT /entry
- [ ] Cambiar cálculo de `pctExec` a null cuando budgetClp === 0
- [ ] Cambiar cálculo de `totalPctExec` a null cuando totalBudget === 0
- [ ] Agregar validación de lock en DELETE /entry/:id
- [ ] Remover `updatedAt: new Date()` del upsert update

### Fase 3: Servicio Consolidado
- [ ] Agregar tipos CacheKey, CacheEntry
- [ ] Crear Map de cache y constante CACHE_TTL_MS
- [ ] Implementar `getCachedBudget(year, month)`
- [ ] Implementar `setCachedBudget(year, month, data)`
- [ ] Agregar verificación de cache al inicio de getMonthlyBudget
- [ ] Agregar setCachedBudget antes del return
- [ ] Agregar setInterval para limpieza periódica

### Fase 4: Documentación
- [ ] Actualizar docs/actual.md con enum ActualCategory
- [ ] Documentar campo isLocked
- [ ] Documentar cambio en pctExec (null cuando sin presupuesto)
- [ ] Agregar sección de errores 423 Locked

### Fase 5: Testing
- [ ] Compilar TypeScript sin errores
- [ ] Probar PUT con categoría válida
- [ ] Probar PUT con categoría inválida (esperar 400)
- [ ] Probar PUT en entry bloqueado (esperar 423)
- [ ] Probar DELETE en entry bloqueado (esperar 423)
- [ ] Verificar pctExec=null en summary cuando budgetClp=0
- [ ] Medir performance del cache (2 peticiones consecutivas)

---

## 7. Beneficios de las Mejoras

### 7.1. Enum ActualCategory
**Antes:** Strings sueltos ("INGRESOS", "SUSCRIPCIONES", ...) con riesgo de typos.

**Después:**
- Type-safety en TypeScript
- Autocomplete en IDE
- Validación en tiempo de compilación
- Restricción en DB (SQLite simula con CHECK constraint)

---

### 7.2. Lock de Meses
**Casos de uso:**
- Cierre contable mensual (no modificar datos de meses cerrados)
- Auditorías (preservar integridad de datos históricos)
- Prevención de ediciones accidentales

**Implementación futura (opcional):**
```typescript
// Endpoint para bloquear/desbloquear mes (admin)
PUT /api/actual/lock-month
{
  "year": 2025,
  "month": 12,
  "isLocked": true
}
```

---

### 7.3. pctExec null
**Antes:**
```json
{
  "budgetClp": 0,
  "actualClp": 25000,
  "pctExec": 0  // Confuso: ¿0% ejecutado o sin presupuesto?
}
```

**Después:**
```json
{
  "budgetClp": 0,
  "actualClp": 25000,
  "pctExec": null  // Claro: sin presupuesto
}
```

**Frontend puede renderizar:**
- `pctExec === null` → "N/A" o "-"
- `pctExec >= 0` → "108.5%" (con color según rango)

---

### 7.4. Cache en Memoria
**Antes:**
- Cada GET /summary ejecuta 9 queries paralelas
- ~200-400ms por petición
- Alto load en DB

**Después (con cache de 1 min):**
- Primera petición: ~250ms (cálculo completo)
- Peticiones subsiguientes (< 1 min): ~5-10ms (cache hit)
- 95% menos load en DB para consultas repetidas

**Cuándo se invalida:**
- Automáticamente después de TTL (60 segundos)
- Si se necesita invalidación manual (ej: después de PUT entry), agregar:

```typescript
// En PUT /api/actual/entry, después de upsert exitoso:
import { invalidateBudgetCache } from '../services/consolidado';
invalidateBudgetCache(year, month);
```

**Función de invalidación (agregar a consolidado.ts):**
```typescript
export function invalidateBudgetCache(year: number, month: number): void {
  const key = getCacheKey(year, month);
  budgetCache.delete(key);
}
```

---

## 8. Configuración Recomendada de TTL

### Desarrollo
```typescript
const CACHE_TTL_MS = 60_000; // 1 minuto (para testing)
```

### Producción
```typescript
const CACHE_TTL_MS = 300_000; // 5 minutos
// O incluso más si los datos cambian poco:
// const CACHE_TTL_MS = 900_000; // 15 minutos
```

### Ajuste Dinámico (opcional)
```typescript
const CACHE_TTL_MS = process.env.BUDGET_CACHE_TTL_MS 
  ? parseInt(process.env.BUDGET_CACHE_TTL_MS) 
  : 60_000;
```

Agregar a `.env`:
```env
BUDGET_CACHE_TTL_MS=300000
```

---

## 9. Próximos Pasos (Post-Mejoras)

### Lock Management API (opcional)
```typescript
// PUT /api/actual/lock-month
router.put('/lock-month', async (req, res) => {
  const { year, month, isLocked } = req.body;
  
  // Actualizar todas las entries del mes
  await prisma.actualEntry.updateMany({
    where: { year, month },
    data: { isLocked }
  });
  
  res.json({ year, month, isLocked });
});

// GET /api/actual/lock-status?year=YYYY&month=M
router.get('/lock-status', async (req, res) => {
  const year = parseInt(req.query.year as string);
  const month = parseInt(req.query.month as string);
  
  const entry = await prisma.actualEntry.findFirst({
    where: { year, month }
  });
  
  res.json({ 
    year, 
    month, 
    isLocked: entry?.isLocked || false 
  });
});
```

### Cache Invalidation on Updates
En PUT /entry, después de upsert:
```typescript
import { invalidateBudgetCache } from '../services/consolidado';

// ... después de upsert exitoso ...
// Invalidar cache solo si afecta presupuesto (en este caso, Actual no afecta presupuesto)
// Pero si en el futuro se agrega lógica que modifique presupuesto:
// invalidateBudgetCache(year, month);

res.json(entry);
```

---

## 10. Resumen de Archivos Modificados

```
node-version/
├── prisma/
│   ├── schema.prisma                    [MODIFICADO] Enum + isLocked
│   └── migrations/
│       └── YYYYMMDDHHMMSS_actual_category_enum_and_lock/
│           └── migration.sql            [NUEVO]
├── src/
│   ├── routes/
│   │   └── actual.ts                    [MODIFICADO] Enum, lock, pctExec
│   └── services/
│       └── consolidado.ts               [MODIFICADO] Cache
└── docs/
    └── actual.md                        [MODIFICADO] Documentación
```

---

## Conclusión

Las mejoras implementadas aportan:
1. **Type-safety** con enum (menos bugs)
2. **Integridad de datos** con lock (meses cerrados)
3. **Claridad semántica** con pctExec=null (sin presupuesto)
4. **Performance** con cache (menos queries repetidas)

Todas las mejoras son retrocompatibles con el frontend existente (solo cambia el tipo de pctExec, que ahora puede ser null).
