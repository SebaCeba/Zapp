# Diseño: API v2 para Suscripciones en Modelo Dimensional

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Estado:** 🔵 Diseño - Pendiente de implementación

---

## 🎯 Objetivo

Migrar el módulo de suscripciones desde el modelo legacy (`subscriptions` table) al modelo dimensional (`dim_account` + `fact_financial`), permitiendo:

1. **Integración Total:** Suscripciones aparecen en resumen de presupuesto
2. **Escenarios:** Distinguir entre presupuesto planificado (BUDGET) vs gastos reales (ACTUAL)
3. **Jerarquía:** Suscripciones bajo `GAS.SUS` en el árbol de cuentas
4. **Periodicidad:** Generar hechos mensuales correctos según periodicidad

---

## 📊 Mapeo: Legacy → Dimensional

### Modelo Legacy (Actual)

```prisma
model Subscription {
  id             Int       @id
  name           String    // "Netflix"
  price          Float     // 10000
  periodicity    String    // "monthly", "quarterly", etc.
  startDate      DateTime  // "2026-01-15"
  startDateId    Int       // FK a calendar
  priceOverrides PriceOverride[]
}
```

**Características:**
- Tabla independiente del presupuesto
- Un registro por suscripción
- Price overrides en tabla aparte

---

### Modelo Dimensional (Nuevo)

**dim_account:**
```
GAS.SUS (agrupador)
  ├── GAS.SUS.001 - Netflix
  ├── GAS.SUS.002 - Spotify
  ├── GAS.SUS.003 - Office 365
  └── ...
```

**Campos importantes:**
```typescript
{
  accountCode: "GAS.SUS.001",
  accountName: "Netflix",
  isBaseMember: true,
  accountType: "GASTO",
  parentId: 210, // GAS.SUS
  level: 3
}
```

**fact_financial:**
```typescript
// Por cada mes activo según periodicidad:
{
  scenarioId: 1 o 2, // BUDGET o ACTUAL
  timeId: xxx,       // 2026-01, 2026-02, etc.
  accountBaseId: yyy, // GAS.SUS.001
  amountClp: 10000,
  amountUsd: 0,
  exchangeRateCLP_USD: null
}
```

**Ejemplo: Netflix mensual, $10,000, inicia enero 2026**
→ Genera 12 hechos (uno por mes) en scenario BUDGET

---

## 🔌 Diseño de API v2

### Ruta Base

```
/api/v2/subscriptions
```

---

### 1. GET /api/v2/subscriptions?scenario=BUDGET&year=2026

**Descripción:** Obtiene todas las suscripciones con su información agregada

**Query Params:**
- `scenario` (opcional): "BUDGET" | "ACTUAL" | "BOTH" (default: "BUDGET")
- `year` (requerido): Año a consultar

**Response:**
```typescript
{
  subscriptions: [
    {
      accountId: 211,
      accountCode: "GAS.SUS.001",
      accountName: "Netflix",
      periodicity: "monthly",      // Inferido de hechos
      startDate: "2026-01-15",     // Primer mes con hechos
      monthlyPrice: 10000,         // Precio común (o null si varía)
      activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12],
      totalAnnual: 120000,
      hasActuals: true,            // Si tiene hechos en ACTUAL
      hasBudget: true,             // Si tiene hechos en BUDGET
      lastModified: "2026-01-15T10:00:00Z"
    },
    {
      accountId: 212,
      accountCode: "GAS.SUS.002",
      accountName: "Spotify",
      periodicity: "quarterly",
      startDate: "2026-01-01",
      monthlyPrice: 5000,
      activeMonths: [1,4,7,10],
      totalAnnual: 20000,
      hasActuals: false,
      hasBudget: true,
      lastModified: "2026-01-01T12:00:00Z"
    }
  ],
  summary: {
    totalSubscriptions: 2,
    totalAnnualBudget: 140000,
    totalAnnualActual: 120000 // Solo Netflix tiene actuals
  }
}
```

---

### 2. POST /api/v2/subscriptions

**Descripción:** Crea nueva suscripción (cuenta + hechos presupuestados)

**Body:**
```typescript
{
  name: string,              // "Disney+"
  periodicity: string,       // "monthly" | "quarterly" | "semiannual" | "annual"
  startDate: string,         // "2026-04-01" (ISO date)
  price: number,             // 8000 (precio por periodo)
  year: number,              // 2026 (año para generar hechos)
  scenario: "BUDGET"         // Por defecto crea presupuesto
}
```

**Validaciones:**
- `name`: string no vacío
- `periodicity`: uno de los valores válidos
- `startDate`: fecha válida ISO
- `price`: entero positivo
- `year`: año >= 2000, <= 2100

**Proceso:**
1. Crear cuenta en `dim_account`:
   - Parent: GAS.SUS (accountId 210)
   - Generar código auto: GAS.SUS.009, GAS.SUS.010, etc.
   - `isBaseMember = true`
   - `level = 3`

2. Calcular meses activos según periodicidad usando `getActiveMonths()`

3. Crear hechos en `fact_financial` por cada mes activo:
   - `scenarioId`: BUDGET (1)
   - `timeId`: resolver desde `dim_time`
   - `accountBaseId`: nueva cuenta
   - `amountClp`: price
   
**Response:**
```typescript
{
  subscription: {
    accountId: 219,
    accountCode: "GAS.SUS.009",
    accountName: "Disney+",
    periodicity: "monthly",
    startDate: "2026-04-01",
    monthlyPrice: 8000,
    factsCreated: 9  // ABR-DIC
  }
}
```

---

### 3. PUT /api/v2/subscriptions/:accountCode

**Descripción:** Actualiza suscripción existente

**Params:**
- `accountCode`: GAS.SUS.001, GAS.SUS.002, etc.

**Body:**
```typescript
{
  name?: string,             // Nuevo nombre (opcional)
  price?: number,            // Nuevo precio (opcional)
  year: number,              // Año a actualizar (requerido)
  scenario: "BUDGET" | "ACTUAL"  // Qué escenario actualizar
}
```

**Proceso:**
1. Si `name` presente: actualizar `dim_account.accountName`
2. Si `price` presente: actualizar `fact_financial.amountClp` para todos los meses del año
3. No modifica periodicidad ni startDate (solo via recreación)

**Response:**
```typescript
{
  subscription: {
    accountCode: "GAS.SUS.001",
    accountName: "Netflix Premium",  // Actualizado
    factsUpdated: 12
  }
}
```

---

### 4. DELETE /api/v2/subscriptions/:accountCode?year=2026&scenario=BUDGET

**Descripción:** Elimina hechos de presupuesto para un año específico

**Params:**
- `accountCode`: GAS.SUS.001, etc.

**Query:**
- `year`: Año a eliminar (requerido)
- `scenario`: "BUDGET" | "ACTUAL" | "BOTH" (default: "BUDGET")

**Notas:**
- NO elimina la cuenta `dim_account` (solo marca `isActive = false` si no quedan hechos)
- Elimina solo los hechos del año/escenario especificado
- Si `scenario=BOTH`, elimina presupuesto y actuals del año

**Response:**
```typescript
{
  accountCode: "GAS.SUS.001",
  factsDeleted: 12,
  accountDeactivated: false  // true si se marcó isActive=false
}
```

---

### 5. POST /api/v2/subscriptions/:accountCode/actuals

**Descripción:** Registra gasto real (ACTUAL) para un mes específico

**Params:**
- `accountCode`: GAS.SUS.001, etc.

**Body:**
```typescript
{
  year: number,      // 2026
  month: number,     // 1-12
  amount: number     // 10500 (puede diferir del presupuesto)
}
```

**Proceso:**
1. Resolver `accountId`, `scenarioId` (ACTUAL), `timeId`
2. Upsert fact en `fact_financial`

**Response:**
```typescript
{
  fact: {
    factId: 12345,
    accountCode: "GAS.SUS.001",
    year: 2026,
    month: 4,
    amountClp: 10500,
    scenario: "ACTUAL"
  }
}
```

---

### 6. GET /api/v2/subscriptions/:accountCode

**Descripción:** Detalle de una suscripción específica

**Params:**
- `accountCode`: GAS.SUS.001, etc.

**Query:**
- `year`: Año a consultar (requerido)

**Response:**
```typescript
{
  subscription: {
    accountId: 211,
    accountCode: "GAS.SUS.001",
    accountName: "Netflix",
    periodicity: "monthly",
    startDate: "2026-01-15",
    isActive: true,
    monthlyDetails: [
      { month: 1, budget: 10000, actual: 10000, variance: 0 },
      { month: 2, budget: 10000, actual: 10000, variance: 0 },
      { month: 3, budget: 10000, actual: null, variance: null },
      // ...
    ],
    totals: {
      budgetAnnual: 120000,
      actualAnnual: 20000,  // Solo ENE-FEB
      variance: 100000
    }
  }
}
```

---

### 7. POST /api/v2/subscriptions/bulk-generate

**Descripción:** Genera hechos de presupuesto para un año completo basándose en definiciones existentes

**Body:**
```typescript
{
  year: number,              // 2027
  sourceYear: number,        // 2026 (copiar periodicidad desde este año)
  accountCodes?: string[],   // Opcional: solo estas cuentas (default: todas GAS.SUS.*)
  priceAdjustment?: number   // Opcional: % de ajuste (+5 = +5%)
}
```

**Uso:** Generar presupuesto 2027 basándose en suscripciones de 2026

**Proceso:**
1. Obtener todas las cuentas GAS.SUS.* con hechos en `sourceYear`
2. Calcular periodicidad desde distribución de meses
3. Generar hechos para `year` con misma periodicidad
4. Aplicar ajuste de precio si especificado

**Response:**
```typescript
{
  subscriptionsProcessed: 8,
  factsCreated: 96,
  summary: {
    "GAS.SUS.001": 12, // facts creados
    "GAS.SUS.002": 4,  // quarterly
    // ...
  }
}
```

---

## 🔧 Funciones Helper Necesarias

### Backend (TypeScript)

**1. `getActiveMonths()` - Ya existe en frontend, portar a backend**

```typescript
// node-version/src/utils/subscriptionPeriodicity.ts
export function getActiveMonths(
  startDate: string,
  periodicity: string,
  year: number
): number[] {
  // Misma lógica que frontend
  // Retorna array de meses 1-12
}
```

**2. `inferPeriodicity()` - Inferir periodicidad desde hechos existentes**

```typescript
export function inferPeriodicity(activeMonths: number[]): string {
  const count = activeMonths.length;
  if (count === 12) return 'monthly';
  if (count === 4) return 'quarterly';
  if (count === 2) return 'semiannual';
  if (count === 1) return 'annual';
  // Fallback: analizar patrón de intervalos
  return 'monthly';
}
```

**3. `resolveAccountCode()` - Generar siguiente código disponible**

```typescript
async function getNextSubscriptionCode(): Promise<string> {
  const existingCount = await prismaStar.dimAccount.count({
    where: { accountCode: { startsWith: 'GAS.SUS.' } }
  });
  
  let attempt = existingCount + 1;
  while (true) {
    const code = `GAS.SUS.${String(attempt).padStart(3, '0')}`;
    const exists = await prismaStar.dimAccount.findUnique({
      where: { accountCode: code }
    });
    if (!exists) return code;
    attempt++;
  }
}
```

---

## 📋 Script de Migración de Datos

### Objetivo

Migrar suscripciones existentes desde tabla `subscriptions` a `dim_account` + `fact_financial`.

### Proceso

```typescript
// node-version/scripts/migrate-subscriptions-to-dimensional.ts

import prisma from '../src/db';  // Legacy
import prismaStar from '../src/db-star';  // Dimensional
import { getActiveMonths } from '../src/utils/subscriptionPeriodicity';

async function migrateSubscriptions(year: number = 2026) {
  console.log(`Migrando suscripciones para año ${year}...`);
  
  // 1. Obtener todas las suscripciones legacy
  const legacySubs = await prisma.subscription.findMany();
  console.log(`Encontradas ${legacySubs.length} suscripciones legacy`);
  
  // 2. Verificar que existe GAS.SUS como parent
  const parentAccount = await prismaStar.dimAccount.findUnique({
    where: { accountCode: 'GAS.SUS' }
  });
  if (!parentAccount) {
    throw new Error('Cuenta padre GAS.SUS no encontrada');
  }
  
  // 3. Obtener scenario BUDGET
  const budgetScenario = await prismaStar.dimScenario.findUnique({
    where: { scenarioCode: 'BUDGET' }
  });
  if (!budgetScenario) {
    throw new Error('Escenario BUDGET no encontrado');
  }
  
  for (const legacySub of legacySubs) {
    console.log(`\nMigrando: ${legacySub.name}`);
    
    // 4. Generar código único
    const newCode = await getNextSubscriptionCode();
    
    // 5. Crear cuenta dimensional
    const dimAccount = await prismaStar.dimAccount.create({
      data: {
        accountCode: newCode,
        accountName: legacySub.name,
        parentId: parentAccount.accountId,
        level: 3,
        isBaseMember: true,
        accountType: 'GASTO',
        sortOrder: 0,
        isActive: true
      }
    });
    console.log(`  Creada cuenta: ${newCode}`);
    
    // 6. Calcular meses activos
    const startDate = legacySub.startDate.toISOString().split('T')[0];
    const activeMonths = getActiveMonths(
      startDate,
      legacySub.periodicity,
      year
    );
    console.log(`  Meses activos (${activeMonths.length}): ${activeMonths.join(',')}`);
    
    // 7. Crear hechos para cada mes
    for (const month of activeMonths) {
      const timeEntry = await prismaStar.dimTime.findUnique({
        where: { yearMonth: `${year}-${String(month).padStart(2, '0')}` }
      });
      
      if (!timeEntry) {
        console.warn(`  ⚠️  Mes ${year}-${month} no encontrado en dim_time, saltando`);
        continue;
      }
      
      await prismaStar.factFinancial.create({
        data: {
          scenarioId: budgetScenario.scenarioId,
          timeId: timeEntry.timeId,
          accountBaseId: dimAccount.accountId,
          amountClp: Math.round(legacySub.price),
          amountUsd: 0,
          exchangeRateCLP_USD: null
        }
      });
    }
    console.log(`  ✅ Creados ${activeMonths.length} hechos`);
  }
  
  console.log(`\n✅ Migración completada para ${legacySubs.length} suscripciones`);
}

// Ejecutar
migrateSubscriptions(2026)
  .then(() => {
    console.log('Éxito');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
```

### Ejecución

```powershell
cd node-version
npx tsx scripts/migrate-subscriptions-to-dimensional.ts
```

---

## 🎨 Cambios en Frontend

### 1. Actualizar `Subscriptions.tsx`

**Cambios:**
- Fetch desde `/api/v2/subscriptions?scenario=BUDGET&year={selectedYear}`
- Agregar selector BUDGET/ACTUAL
- Botón "Guardar Plan" crea hechos via POST
- Botón "Registrar Gasto Real" abre modal para actuals

**Nuevo Estado:**
```typescript
const [scenario, setScenario] = useState<'BUDGET' | 'ACTUAL'>('BUDGET');
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
```

**Fetch:**
```typescript
const response = await fetch(`/api/v2/subscriptions?scenario=${scenario}&year=${selectedYear}`);
```

---

### 2. Actualizar `NewSubscriptionForm.tsx`

**Cambios:**
- POST a `/api/v2/subscriptions` en lugar de `/api/subscriptions`
- Agregar campo `year` (default: current year)
- Body incluye periodicidad y genera hechos

---

### 3. Agregar Selector de Escenario

**Componente Nuevo:** `ScenarioSelector.tsx`

```typescript
interface ScenarioSelectorProps {
  value: 'BUDGET' | 'ACTUAL';
  onChange: (value: 'BUDGET' | 'ACTUAL') => void;
}

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
      <button
        onClick={() => onChange('BUDGET')}
        className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
          value === 'BUDGET'
            ? 'bg-primary text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Presupuesto
      </button>
      <button
        onClick={() => onChange('ACTUAL')}
        className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${
          value === 'ACTUAL'
            ? 'bg-secondary text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        Real
      </button>
    </div>
  );
}
```

---

## ✅ Validación de Integración

### Casos de Prueba

**1. Crear suscripción mensual desde enero**
- POST a `/api/v2/subscriptions`
- Verificar: 12 hechos creados en fact_financial
- Verificar: Aparece en `/presupuesto/resumen` bajo "Gastos → Suscripciones"

**2. Registrar gasto real diferente al presupuesto**
- POST a `/api/v2/subscriptions/GAS.SUS.001/actuals`
- Verificar: Hecho ACTUAL creado
- Verificar: Varianza visible en comparación budget vs actual

**3. Crear suscripción trimestral**
- Verificar: Solo 4 hechos creados (ENE, ABR, JUL, OCT)
- Verificar: Tabla anual muestra precio solo en esos meses

**4. Migrar suscripciones legacy**
- Ejecutar script de migración
- Verificar: Cuentas creadas en dim_account
- Verificar: Hechos creados en fact_financial
- Verificar: Visibles en `/presupuesto/resumen`

---

## 📊 Beneficios vs Modelo Legacy

| Aspecto | Legacy | Dimensional (v2) |
|---------|--------|------------------|
| **Integración Presupuesto** | ❌ Desconectado | ✅ Unificado |
| **Visible en Resumen** | ❌ No | ✅ Sí (bajo GAS.SUS) |
| **Escenarios** | ❌ No | ✅ BUDGET / ACTUAL |
| **Jerarquía** | ❌ Plano | ✅ Árbol navegable |
| **Varianza Budget vs Actual** | ❌ No | ✅ Automática |
| **Reportes Consolidados** | ❌ Manual | ✅ Query unificado |
| **Sobrescrituras** | ✅ Tabla separada | ✅ Hechos individuales |
| **Periodicidad** | ✅ Campo | ✅ Inferida de hechos |

---

## 🚧 Limitaciones Conocidas

1. **Periodicidad semanal:** Sigue siendo aproximación mensual
2. **Price overrides:** Tabla legacy no se migra automáticamente (sobreescribir hechos manualmente)
3. **Fin de suscripción:** No hay campo `endDate`, requiere marcar `isActive=false` manualmente
4. **Cambio de precio histórico:** Requiere actualizar hechos mes por mes

---

## 📅 Plan de Implementación

### Fase 1: Backend (2-3 días)
- ✅ Crear archivo `node-version/src/routes/v2/subscriptions.ts`
- ✅ Portar `subscriptionPeriodicity.ts` a backend
- ✅ Implementar endpoints GET, POST, PUT, DELETE
- ✅ Testing con Postman/curl

### Fase 2: Migración (1 día)
- ✅ Crear script `migrate-subscriptions-to-dimensional.ts`
- ✅ Ejecutar migración en dev
- ✅ Validar datos migrados

### Fase 3: Frontend (2 días)
- ✅ Actualizar `Subscriptions.tsx` para usar API v2
- ✅ Crear `ScenarioSelector.tsx`
- ✅ Actualizar `NewSubscriptionForm.tsx`
- ✅ Actualizar `AnnualPlanningTable.tsx` para mostrar BUDGET/ACTUAL

### Fase 4: Testing (1 día)
- ✅ Casos de prueba E2E
- ✅ Validar integración con `/presupuesto/resumen`
- ✅ Verificar cálculos de periodicidad

### Fase 5: Documentación (1 día)
- ✅ Actualizar README con nuevos endpoints
- ✅ Guía de migración para usuarios
- ✅ Documento de diseño final

**Total Estimado:** 7-8 días

---

**Autor:** GitHub Copilot  
**Diseño:** 2026-04-21  
**Estado:** Pendiente de aprobación
