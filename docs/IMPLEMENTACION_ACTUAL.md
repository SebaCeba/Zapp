# Implementación Módulo "Actual" - Backend + Prisma

## 1. Modelo Prisma

### 1.1. Agregar al schema.prisma

**Ubicación:** `node-version/prisma/schema.prisma`

```prisma
model ActualEntry {
  id          String   @id @default(cuid())
  year        Int
  month       Int      // 1-12
  category    String   // INGRESOS, SUSCRIPCIONES, OBLIGACIONES, HIPOTECARIO, SERVICIOS_BASICOS, SUPERMERCADO, AJUSTES
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

**Notas:**
- `itemKey` sigue el formato: `sub:<id>`, `obl:<id>`, `sb:<id>`, `ing:<id>`, `hip:total`, `sm:total`, `man:<uuid>`
- `amountClp` es Int (centavos o pesos enteros, según convenga)
- `isPaid` útil para tracking de suscripciones/obligaciones (pagado/no pagado)
- Índice compuesto unique asegura un solo registro por combinación

### 1.2. Generar Migración

```bash
cd node-version
npx prisma migrate dev --name add_actual_entries
```

Esto creará el archivo de migración en `prisma/migrations/`.

---

## 2. Router de Actual

### 2.1. Crear archivo `node-version/src/routes/actual.ts`

```typescript
import { Router, Request, Response } from 'express';
import prisma from '../db';
import { getMonthlyBudget } from '../services/consolidado';

const router = Router();

// Validar categorías permitidas
const VALID_CATEGORIES = [
  'INGRESOS',
  'SUSCRIPCIONES',
  'OBLIGACIONES',
  'HIPOTECARIO',
  'SERVICIOS_BASICOS',
  'SUPERMERCADO',
  'AJUSTES'
];

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

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ 
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
      });
    }

    if (!Number.isInteger(amountClp) || amountClp < 0) {
      return res.status(400).json({ error: 'Invalid amountClp (must be non-negative integer)' });
    }

    // Validar que AJUSTES tenga label
    if (category === 'AJUSTES' && !label) {
      return res.status(400).json({ error: 'Label is required for AJUSTES category' });
    }

    // Upsert
    const entry = await prisma.actualEntry.upsert({
      where: {
        year_month_category_itemKey: {
          year,
          month,
          category,
          itemKey
        }
      },
      update: {
        label,
        amountClp,
        isPaid,
        updatedAt: new Date()
      },
      create: {
        year,
        month,
        category,
        itemKey,
        label,
        amountClp,
        isPaid
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

    // 1. Obtener presupuesto del mes
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
        const pctExec = budgetClp > 0 ? Math.round((actualClp / budgetClp) * 10000) / 100 : 0;

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
            pctExec: 0,
            isPaid: entry.isPaid
          });
        }
      });

      // Calcular totales de categoría
      const totalBudget = lines.reduce((sum, l) => sum + l.budgetClp, 0);
      const totalActual = lines.reduce((sum, l) => sum + l.actualClp, 0);
      const totalDelta = totalActual - totalBudget;
      const totalPctExec = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 10000) / 100 : 0;

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
    const category = req.query.category as string | undefined;

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

---

## 3. Servicio de Consolidado

### 3.1. Crear archivo `node-version/src/services/consolidado.ts`

Este servicio reutiliza la lógica del resumen consolidado pero filtra por mes específico.

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

const MESES_KEYS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export async function getMonthlyBudget(year: number, month: number): Promise<MonthlyBudget> {
  const mesKey = MESES_KEYS[month - 1];
  
  // Cargar todas las fuentes de datos
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
    prisma.ingresoBase.findMany({
      where: { activo: true },
      include: {
        presupuestos: {
          where: { anio: year }
        }
      }
    }),
    prisma.servicioBasico.findMany({
      where: { activo: true },
      include: {
        presupuestos: {
          where: { anio: year }
        }
      }
    }),
    prisma.bono.findMany({
      where: { anio: year },
      include: { repartos: true }
    }),
    prisma.subscription.findMany(),
    prisma.obligacion.findMany(),
    prisma.mortgagePayment.findMany(),
    prisma.mortgageInsurance.findMany(),
    prisma.supuestoAnual.findUnique({
      where: { anio: year }
    }),
    prisma.supermercadoPresupuesto.findUnique({
      where: { anio: year }
    })
  ]);

  const valorUF = supuestoData?.valorUfBase || 37000;

  // ========== INGRESOS ==========
  const ingresosLines: BudgetLine[] = [];

  ingresosData.forEach(ingreso => {
    const presupuesto = ingreso.presupuestos?.[0];
    const monto = presupuesto?.[mesKey as keyof typeof presupuesto] as number || 0;
    
    if (monto > 0) {
      ingresosLines.push({
        itemKey: `ing:${ingreso.id}`,
        label: ingreso.nombre,
        amountClp: Math.round(monto)
      });
    }
  });

  // Bonos del mes (incluye apoyo mensual distribuido)
  let totalBonosMes = 0;
  bonosData.forEach(bono => {
    if (bono.mes === month) {
      totalBonosMes += bono.monto;
    }

    bono.repartos?.forEach(reparto => {
      if (reparto.destino === 'apoyo_mensual' && reparto.mesesDistribucion) {
        const distribucion = reparto.monto / reparto.mesesDistribucion;
        for (let i = 0; i < reparto.mesesDistribucion; i++) {
          const mesDistribucion = ((bono.mes + i - 1) % 12) + 1;
          if (mesDistribucion === month) {
            totalBonosMes += distribucion;
          }
        }
      }
    });
  });

  if (totalBonosMes > 0) {
    ingresosLines.push({
      itemKey: `bono:${year}-${month}`,
      label: 'Bonos y Apoyo Mensual',
      amountClp: Math.round(totalBonosMes)
    });
  }

  // ========== SUSCRIPCIONES ==========
  const suscripcionesLines: BudgetLine[] = [];

  subscriptionsData.forEach(sub => {
    const startDate = new Date(sub.startDate);
    const yearStart = new Date(year, month - 1, 1);
    
    if (startDate > yearStart) return;
    
    const monthsDiff = (year - startDate.getFullYear()) * 12 + (month - 1 - startDate.getMonth());
    
    let applies = false;
    switch (sub.periodicity) {
      case 'monthly':
        applies = monthsDiff >= 0;
        break;
      case 'quarterly':
        applies = monthsDiff >= 0 && monthsDiff % 3 === 0;
        break;
      case 'semiannual':
        applies = monthsDiff >= 0 && monthsDiff % 6 === 0;
        break;
      case 'annual':
        applies = monthsDiff >= 0 && monthsDiff % 12 === 0;
        break;
      case 'weekly':
        applies = monthsDiff >= 0;
        break;
    }
    
    if (applies) {
      suscripcionesLines.push({
        itemKey: `sub:${sub.id}`,
        label: sub.name,
        amountClp: Math.round(sub.price)
      });
    }
  });

  // ========== OBLIGACIONES (Créditos + Seguros) ==========
  const obligacionesLines: BudgetLine[] = [];

  obligacionesData.forEach(obl => {
    const mesesTranscurridos = (year - obl.anioInicio) * 12 + (month - obl.mesInicio);
    
    if (mesesTranscurridos >= 0 && mesesTranscurridos < obl.cuotasTotales) {
      const cuota = obl.moneda === 'UF' ? obl.montoCuota * valorUF : obl.montoCuota;
      
      obligacionesLines.push({
        itemKey: `obl:${obl.id}`,
        label: obl.nombre,
        amountClp: Math.round(cuota)
      });
    }
  });

  // ========== HIPOTECARIO ==========
  const hipotecarioLines: BudgetLine[] = [];

  // Cuotas hipotecarias
  let totalCuotaHipo = 0;
  paymentsData.forEach(payment => {
    const fechaVencimiento = new Date(payment.fechaVencimiento);
    if (fechaVencimiento.getFullYear() === year && 
        fechaVencimiento.getMonth() + 1 === month) {
      totalCuotaHipo += payment.totalDivUf * valorUF;
    }
  });

  if (totalCuotaHipo > 0) {
    hipotecarioLines.push({
      itemKey: 'hip:cuota',
      label: 'Cuota Hipotecaria',
      amountClp: Math.round(totalCuotaHipo)
    });
  }

  // Seguros hipotecarios
  let totalSegurosHipo = 0;
  const mesAnio = `${year}-${month.toString().padStart(2, '0')}`;
  segurosData.forEach(seguro => {
    if (seguro.mesAnio === mesAnio) {
      const montoSeguro = seguro.moneda === 'UF' ? seguro.monto * valorUF : seguro.monto;
      totalSegurosHipo += montoSeguro;
    }
  });

  if (totalSegurosHipo > 0) {
    hipotecarioLines.push({
      itemKey: 'hip:seguros',
      label: 'Seguros Hipotecarios',
      amountClp: Math.round(totalSegurosHipo)
    });
  }

  // ========== SERVICIOS BÁSICOS ==========
  const serviciosLines: BudgetLine[] = [];

  serviciosData.forEach(servicio => {
    const presupuesto = servicio.presupuestos?.[0];
    const monto = presupuesto?.[mesKey as keyof typeof presupuesto] as number || 0;
    
    if (monto > 0) {
      serviciosLines.push({
        itemKey: `sb:${servicio.id}`,
        label: servicio.nombre,
        amountClp: Math.round(monto)
      });
    }
  });

  // ========== SUPERMERCADO ==========
  const supermercadoLines: BudgetLine[] = [];

  const montoSupermercado = supermercadoData?.[mesKey as keyof typeof supermercadoData] as number || 0;
  if (montoSupermercado > 0) {
    supermercadoLines.push({
      itemKey: 'sm:total',
      label: 'Supermercado',
      amountClp: Math.round(montoSupermercado)
    });
  }

  return {
    INGRESOS: ingresosLines,
    SUSCRIPCIONES: suscripcionesLines,
    OBLIGACIONES: obligacionesLines,
    HIPOTECARIO: hipotecarioLines,
    SERVICIOS_BASICOS: serviciosLines,
    SUPERMERCADO: supermercadoLines,
    AJUSTES: [] // Siempre vacío en presupuesto
  };
}
```

---

## 4. Registrar Router en Index

### 4.1. Modificar `node-version/src/index.ts`

Agregar import y registro del router:

```typescript
import actualRouter from './routes/actual';

// ... otros imports ...

// Registrar rutas
app.use('/api/actual', actualRouter);
```

**Ubicación exacta:** Después de los otros `app.use('/api/...')` existentes.

---

## 5. Ejemplos de Request/Response

### 5.1. PUT /api/actual/entry (Crear/Actualizar entrada)

**Request:**
```http
PUT /api/actual/entry
Content-Type: application/json

{
  "year": 2026,
  "month": 1,
  "category": "SUPERMERCADO",
  "itemKey": "sm:total",
  "label": "Supermercado",
  "amountClp": 450000,
  "isPaid": true
}
```

**Response 200:**
```json
{
  "id": "clxxx123456789",
  "year": 2026,
  "month": 1,
  "category": "SUPERMERCADO",
  "itemKey": "sm:total",
  "label": "Supermercado",
  "amountClp": 450000,
  "isPaid": true,
  "createdAt": "2026-01-31T12:00:00.000Z",
  "updatedAt": "2026-01-31T12:00:00.000Z"
}
```

**Response 400 (error):**
```json
{
  "error": "Invalid month (1-12)"
}
```

---

### 5.2. GET /api/actual/summary?year=2026&month=1

**Request:**
```http
GET /api/actual/summary?year=2026&month=1
```

**Response 200:**
```json
{
  "year": 2026,
  "month": 1,
  "categories": [
    {
      "category": "INGRESOS",
      "totalBudget": 3500000,
      "totalActual": 3500000,
      "totalDelta": 0,
      "totalPctExec": 100,
      "lines": [
        {
          "itemKey": "ing:1",
          "label": "Sueldo Principal",
          "budgetClp": 2800000,
          "actualClp": 2800000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        },
        {
          "itemKey": "ing:2",
          "label": "Freelance",
          "budgetClp": 700000,
          "actualClp": 700000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        }
      ]
    },
    {
      "category": "SUSCRIPCIONES",
      "totalBudget": 45000,
      "totalActual": 42000,
      "totalDelta": -3000,
      "totalPctExec": 93.33,
      "lines": [
        {
          "itemKey": "sub:1",
          "label": "Netflix",
          "budgetClp": 15000,
          "actualClp": 15000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        },
        {
          "itemKey": "sub:2",
          "label": "Spotify",
          "budgetClp": 10000,
          "actualClp": 10000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        },
        {
          "itemKey": "sub:3",
          "label": "Amazon Prime",
          "budgetClp": 20000,
          "actualClp": 17000,
          "deltaClp": -3000,
          "pctExec": 85,
          "isPaid": true
        }
      ]
    },
    {
      "category": "OBLIGACIONES",
      "totalBudget": 250000,
      "totalActual": 250000,
      "totalDelta": 0,
      "totalPctExec": 100,
      "lines": [
        {
          "itemKey": "obl:1",
          "label": "Crédito Consumo",
          "budgetClp": 150000,
          "actualClp": 150000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        },
        {
          "itemKey": "obl:2",
          "label": "Seguro Auto",
          "budgetClp": 100000,
          "actualClp": 100000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        }
      ]
    },
    {
      "category": "HIPOTECARIO",
      "totalBudget": 850000,
      "totalActual": 850000,
      "totalDelta": 0,
      "totalPctExec": 100,
      "lines": [
        {
          "itemKey": "hip:cuota",
          "label": "Cuota Hipotecaria",
          "budgetClp": 800000,
          "actualClp": 800000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        },
        {
          "itemKey": "hip:seguros",
          "label": "Seguros Hipotecarios",
          "budgetClp": 50000,
          "actualClp": 50000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        }
      ]
    },
    {
      "category": "SERVICIOS_BASICOS",
      "totalBudget": 180000,
      "totalActual": 195000,
      "totalDelta": 15000,
      "totalPctExec": 108.33,
      "lines": [
        {
          "itemKey": "sb:1",
          "label": "Luz",
          "budgetClp": 50000,
          "actualClp": 58000,
          "deltaClp": 8000,
          "pctExec": 116,
          "isPaid": true
        },
        {
          "itemKey": "sb:2",
          "label": "Agua",
          "budgetClp": 30000,
          "actualClp": 32000,
          "deltaClp": 2000,
          "pctExec": 106.67,
          "isPaid": true
        },
        {
          "itemKey": "sb:3",
          "label": "Gas",
          "budgetClp": 40000,
          "actualClp": 45000,
          "deltaClp": 5000,
          "pctExec": 112.5,
          "isPaid": true
        },
        {
          "itemKey": "sb:4",
          "label": "Internet",
          "budgetClp": 60000,
          "actualClp": 60000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        }
      ]
    },
    {
      "category": "SUPERMERCADO",
      "totalBudget": 400000,
      "totalActual": 450000,
      "totalDelta": 50000,
      "totalPctExec": 112.5,
      "lines": [
        {
          "itemKey": "sm:total",
          "label": "Supermercado",
          "budgetClp": 400000,
          "actualClp": 450000,
          "deltaClp": 50000,
          "pctExec": 112.5,
          "isPaid": null
        }
      ]
    },
    {
      "category": "AJUSTES",
      "totalBudget": 0,
      "totalActual": 25000,
      "totalDelta": 25000,
      "totalPctExec": 0,
      "lines": [
        {
          "itemKey": "man:clxxx999888",
          "label": "Reparación inesperada",
          "budgetClp": 0,
          "actualClp": 25000,
          "deltaClp": 25000,
          "pctExec": 0,
          "isPaid": null
        }
      ]
    }
  ]
}
```

---

### 5.3. GET /api/actual/entries?year=2026&month=1

**Request:**
```http
GET /api/actual/entries?year=2026&month=1
```

**Response 200:**
```json
[
  {
    "id": "clxxx123456789",
    "year": 2026,
    "month": 1,
    "category": "SUPERMERCADO",
    "itemKey": "sm:total",
    "label": "Supermercado",
    "amountClp": 450000,
    "isPaid": null,
    "createdAt": "2026-01-31T12:00:00.000Z",
    "updatedAt": "2026-01-31T12:00:00.000Z"
  },
  {
    "id": "clxxx987654321",
    "year": 2026,
    "month": 1,
    "category": "SERVICIOS_BASICOS",
    "itemKey": "sb:1",
    "label": "Luz",
    "amountClp": 58000,
    "isPaid": true,
    "createdAt": "2026-01-31T11:30:00.000Z",
    "updatedAt": "2026-01-31T11:30:00.000Z"
  }
]
```

---

### 5.4. DELETE /api/actual/entry/:id

**Request:**
```http
DELETE /api/actual/entry/clxxx123456789
```

**Response 204:** (sin contenido)

---

## 6. Pasos de Implementación

### 6.1. Fase 1: Modelo y Migración

```bash
# 1. Agregar modelo ActualEntry al schema.prisma
# 2. Generar migración
cd node-version
npx prisma migrate dev --name add_actual_entries

# 3. Generar cliente Prisma actualizado
npx prisma generate
```

### 6.2. Fase 2: Servicios y Rutas

```bash
# 1. Crear servicio consolidado
# node-version/src/services/consolidado.ts

# 2. Crear router actual
# node-version/src/routes/actual.ts

# 3. Registrar router en index.ts
```

### 6.3. Fase 3: Testing

```bash
# Iniciar servidor
npm run dev

# Probar endpoints con Postman/curl/Thunder Client
```

**Ejemplos de prueba:**

```bash
# 1. Crear entrada actual
curl -X PUT http://localhost:3000/api/actual/entry \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 1,
    "category": "SUPERMERCADO",
    "itemKey": "sm:total",
    "amountClp": 450000
  }'

# 2. Obtener resumen
curl "http://localhost:3000/api/actual/summary?year=2026&month=1"

# 3. Listar entradas
curl "http://localhost:3000/api/actual/entries?year=2026&month=1"
```

---

## 7. Archivo de Documentación

### 7.1. Crear `node-version/docs/actual.md`

```markdown
# Módulo Actual - Seguimiento de Gastos e Ingresos Reales

## Descripción

El módulo "Actual" permite registrar montos reales (ejecutados) de ingresos y egresos mes a mes, comparándolos con el presupuesto planificado.

## Modelo de Datos

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

**Índices:**
- Unique: `(year, month, category, itemKey)` - Un solo registro por combinación
- Index: `(year, month)` - Consultas rápidas por periodo
- Index: `(category)` - Filtrado por categoría

### Formato de itemKey

El `itemKey` identifica unívocamente una línea presupuestaria:

| Prefijo | Descripción | Ejemplo |
|---------|-------------|---------|
| `ing:` | Ingreso Base | `ing:1`, `ing:2` |
| `bono:` | Bono anual | `bono:2026-3` |
| `sub:` | Suscripción | `sub:5`, `sub:12` |
| `obl:` | Obligación/Crédito | `obl:3` |
| `hip:` | Hipotecario | `hip:cuota`, `hip:seguros` |
| `sb:` | Servicio Básico | `sb:1`, `sb:4` |
| `sm:` | Supermercado | `sm:total` |
| `man:` | Ajuste Manual | `man:clxxx123` (CUID generado) |

## API Endpoints

### PUT /api/actual/entry

Crea o actualiza una entrada actual (upsert).

**Request Body:**
```json
{
  "year": 2026,
  "month": 1,
  "category": "SERVICIOS_BASICOS",
  "itemKey": "sb:1",
  "label": "Luz",
  "amountClp": 58000,
  "isPaid": true
}
```

**Validaciones:**
- `year`: entero entre 2000-2100
- `month`: entero entre 1-12
- `category`: uno de los valores válidos
- `itemKey`: string no vacío
- `amountClp`: entero >= 0
- `label`: obligatorio si `category === 'AJUSTES'`

**Response:**
```json
{
  "id": "clxxx123",
  "year": 2026,
  "month": 1,
  "category": "SERVICIOS_BASICOS",
  "itemKey": "sb:1",
  "label": "Luz",
  "amountClp": 58000,
  "isPaid": true,
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T10:00:00.000Z"
}
```

---

### GET /api/actual/summary

Obtiene el resumen consolidado de presupuesto vs actual para un mes específico.

**Query Parameters:**
- `year` (required): año (ej: 2026)
- `month` (required): mes (1-12)

**Response:**
```json
{
  "year": 2026,
  "month": 1,
  "categories": [
    {
      "category": "INGRESOS",
      "totalBudget": 3500000,
      "totalActual": 3500000,
      "totalDelta": 0,
      "totalPctExec": 100,
      "lines": [
        {
          "itemKey": "ing:1",
          "label": "Sueldo",
          "budgetClp": 2800000,
          "actualClp": 2800000,
          "deltaClp": 0,
          "pctExec": 100,
          "isPaid": true
        }
      ]
    },
    {
      "category": "SERVICIOS_BASICOS",
      "totalBudget": 180000,
      "totalActual": 195000,
      "totalDelta": 15000,
      "totalPctExec": 108.33,
      "lines": [...]
    }
  ]
}
```

**Campos por línea:**
- `budgetClp`: monto presupuestado
- `actualClp`: monto real ejecutado
- `deltaClp`: diferencia (actual - budget)
- `pctExec`: porcentaje de ejecución (actual/budget * 100)

---

### GET /api/actual/entries

Lista entradas actuales con filtros opcionales.

**Query Parameters:**
- `year` (optional): filtrar por año
- `month` (optional): filtrar por mes
- `category` (optional): filtrar por categoría

**Response:**
```json
[
  {
    "id": "clxxx123",
    "year": 2026,
    "month": 1,
    "category": "SUPERMERCADO",
    "itemKey": "sm:total",
    "label": "Supermercado",
    "amountClp": 450000,
    "isPaid": null,
    "createdAt": "2026-01-31T10:00:00.000Z",
    "updatedAt": "2026-01-31T10:00:00.000Z"
  }
]
```

---

### DELETE /api/actual/entry/:id

Elimina una entrada actual.

**Response:** 204 No Content

---

## Flujo de Trabajo

### Caso de Uso 1: Registrar Gasto Real

1. Usuario ingresa monto pagado en categoría (ej: Luz = $58,000)
2. Frontend envía PUT `/api/actual/entry`:
   ```json
   {
     "year": 2026,
     "month": 1,
     "category": "SERVICIOS_BASICOS",
     "itemKey": "sb:1",
     "amountClp": 58000,
     "isPaid": true
   }
   ```
3. Backend hace upsert en `ActualEntry`
4. Responde con el registro creado/actualizado

### Caso de Uso 2: Ver Comparativo Presupuesto vs Actual

1. Usuario selecciona año/mes en UI
2. Frontend solicita GET `/api/actual/summary?year=2026&month=1`
3. Backend:
   - Obtiene presupuesto del mes (desde `getMonthlyBudget`)
   - Obtiene entradas actuales del mes
   - Calcula deltas y % de ejecución
4. Responde con categorías consolidadas
5. Frontend renderiza tabla comparativa

### Caso de Uso 3: Agregar Gasto No Presupuestado

1. Usuario agrega ítem manual (ej: "Reparación inesperada")
2. Frontend genera `itemKey` único: `man:${cuid()}`
3. Envía PUT con `category: "AJUSTES"`:
   ```json
   {
     "year": 2026,
     "month": 1,
     "category": "AJUSTES",
     "itemKey": "man:clxxx999",
     "label": "Reparación inesperada",
     "amountClp": 25000
   }
   ```
4. Aparece en resumen con `budgetClp: 0` y `deltaClp: 25000`

---

## Evolución Futura

### Fase 1: Importadores Automáticos

**Tenpo TC (Tarjeta de Crédito):**
- Parsear emails de compras/pagos desde Gmail API
- Extraer monto, comercio, fecha
- Proponer categorización automática (ML/reglas)
- Crear entradas actuales automáticas

**Implementación sugerida:**
```typescript
// services/tenpo-import.service.ts
async function importTenpoTransactions(year: number, month: number) {
  // 1. Obtener emails Tenpo del mes
  const emails = await getTenpoEmailsByMonth(year, month);
  
  // 2. Parsear transacciones
  const transactions = emails.map(parseTransaction);
  
  // 3. Categorizar (por comercio, monto, etc.)
  const categorized = transactions.map(categorizeTenpo);
  
  // 4. Crear entradas actuales
  for (const tx of categorized) {
    await prisma.actualEntry.upsert({
      where: { ... },
      create: { ... }
    });
  }
}
```

**Categorización inteligente:**
- "Unimarc", "Lider", "Jumbo" → SUPERMERCADO
- "Enel", "Aguas Andinas", "Metrogas" → SERVICIOS_BASICOS
- "Netflix", "Spotify" → SUSCRIPCIONES (match por monto)
- Otros → AJUSTES (requiere revisión manual)

---

### Fase 2: Dashboard de Varianzas

**Métricas clave:**
- % de ejecución total del mes
- Top 3 categorías con mayor desvío
- Alertas de gastos >110% del presupuesto
- Proyección de balance mensual

**Visualizaciones:**
- Gráfico de barras: Presupuesto vs Actual por categoría
- Gráfico de línea: Evolución mensual del % ejecución
- Heatmap: Desvíos por categoría/mes (año completo)

---

### Fase 3: Proyecciones y Recomendaciones

**Basadas en históricos:**
- "En Servicios Básicos, tus gastos reales suelen ser 8% mayores que tu presupuesto"
- "Ajusta presupuesto de Luz a $55,000 (promedio últimos 6 meses)"
- "Ahorro proyectado del mes: $X (basado en tus patrones actuales)"

**Machine Learning:**
- Clustering de meses similares (estacionalidad)
- Predicción de gastos futuros por categoría
- Detección de anomalías (gastos inusuales)

---

### Fase 4: Multi-usuario y Consolidación Familiar

**Extensiones al modelo:**
```prisma
model ActualEntry {
  // ... campos actuales
  userId      String?  // Quién registró el gasto
  sharedWith  String[] // IDs de usuarios con acceso
  isShared    Boolean  @default(false)
}
```

**Casos de uso:**
- Gastos compartidos (hogar)
- Distribución por % (ej: 60%-40%)
- Consolidación de balance conjunto

---

### Fase 5: Integración con Bancos (Open Banking)

**APIs bancarias chilenas:**
- BancoEstado, Santander, BCI, etc.
- Autenticación OAuth2
- Obtención automática de transacciones
- Categorización y matching con presupuesto

**Desafíos:**
- Seguridad y almacenamiento de credenciales
- Rate limits y disponibilidad de APIs
- Conciliación de transacciones duplicadas

---

## Consideraciones Técnicas

### Performance

**Optimizaciones recomendadas:**
- Cache de `getMonthlyBudget` (Redis/in-memory)
- Índices compuestos en queries frecuentes
- Paginación en `/entries` para grandes volúmenes

### Seguridad

**Autenticación requerida:**
- Agregar middleware de auth en rutas `/api/actual/*`
- Validar que usuario solo acceda a sus datos
- Sanitización de inputs (SQL injection, XSS)

### Validaciones Adicionales

**Reglas de negocio:**
- No permitir fechas futuras (excepto para planificación)
- Validar que `itemKey` exista en presupuesto (excepto AJUSTES)
- Alertar si monto actual > 200% del presupuesto

---

## Testing

### Unit Tests

```typescript
// __tests__/actual.service.test.ts
describe('ActualEntry Service', () => {
  it('should calculate correct delta and pctExec', () => {
    const budget = 100000;
    const actual = 120000;
    const delta = actual - budget; // 20000
    const pctExec = (actual / budget) * 100; // 120
    
    expect(delta).toBe(20000);
    expect(pctExec).toBe(120);
  });
  
  it('should handle zero budget correctly', () => {
    const budget = 0;
    const actual = 25000;
    const pctExec = budget > 0 ? (actual / budget) * 100 : 0;
    
    expect(pctExec).toBe(0);
  });
});
```

### Integration Tests

```typescript
// __tests__/actual.api.test.ts
describe('GET /api/actual/summary', () => {
  it('should return correct summary structure', async () => {
    const response = await request(app)
      .get('/api/actual/summary?year=2026&month=1');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('year', 2026);
    expect(response.body).toHaveProperty('month', 1);
    expect(response.body.categories).toBeInstanceOf(Array);
  });
  
  it('should reject invalid month', async () => {
    const response = await request(app)
      .get('/api/actual/summary?year=2026&month=13');
    
    expect(response.status).toBe(400);
  });
});
```

---

## Troubleshooting

### Error: "Unique constraint failed"

**Causa:** Intentando crear entrada duplicada para misma combinación (year, month, category, itemKey).

**Solución:** El endpoint PUT hace upsert automáticamente. Verificar que `itemKey` sea correcto.

---

### Error: "Budget not found for month"

**Causa:** No existe presupuesto configurado para el año/mes solicitado.

**Solución:** Crear presupuesto base en módulos de Ingresos/Servicios/etc. antes de registrar actuales.

---

### Performance lento en /summary

**Causa:** Múltiples queries a diferentes tablas.

**Solución:** Implementar cache en `getMonthlyBudget` o pre-calcular en background job.

---

## Conclusión

El módulo "Actual" proporciona la base para seguimiento detallado de ejecución presupuestaria. La arquitectura modular permite extensiones futuras sin romper funcionalidad existente. Las fases de evolución sugeridas agregan valor progresivamente según necesidades del usuario.
```

---

## 8. Checklist de Implementación Completa

### Backend
- [ ] Agregar modelo `ActualEntry` a `schema.prisma`
- [ ] Ejecutar migración: `npx prisma migrate dev --name add_actual_entries`
- [ ] Crear servicio `src/services/consolidado.ts`
- [ ] Crear router `src/routes/actual.ts`
- [ ] Registrar router en `src/index.ts`
- [ ] Crear documentación `docs/actual.md`

### Testing
- [ ] Probar PUT `/api/actual/entry` con Postman/curl
- [ ] Probar GET `/api/actual/summary` con datos de prueba
- [ ] Probar GET `/api/actual/entries` con filtros
- [ ] Probar DELETE `/api/actual/entry/:id`
- [ ] Validar cálculos de delta y pctExec

### Validaciones
- [ ] Verificar restricción unique (year, month, category, itemKey)
- [ ] Validar rangos de year (2000-2100) y month (1-12)
- [ ] Validar categorías válidas
- [ ] Validar amountClp >= 0
- [ ] Validar label obligatorio para AJUSTES

### Documentación
- [ ] Actualizar README con enlace a `docs/actual.md`
- [ ] Agregar ejemplos de uso en Postman collection
- [ ] Documentar formato de itemKey en comentarios de código

---

## 9. Próximos Pasos (Post-Backend)

### Frontend (No incluido en este prompt)

**Componentes a crear:**
- `TablaActual.tsx` - Tabla editable similar a TablaPresupuesto
- `ComparativoPresupuestoActual.tsx` - Vista lado a lado
- `DashboardVarianzas.tsx` - Gráficos y métricas
- Modal de ajustes manuales

**Rutas:**
- `/presupuesto/actual` - Entrada de datos actual
- `/presupuesto/comparativo` - Presupuesto vs Actual
- `/presupuesto/varianzas` - Dashboard de análisis

---

## Conclusión

Esta implementación proporciona la base backend completa para el módulo "Actual". Los endpoints están diseñados para ser consumidos fácilmente desde el frontend, y la estructura permite extensiones futuras (importadores automáticos, ML, etc.) sin romper funcionalidad existente.

La arquitectura reutiliza la lógica del consolidado existente (`getMonthlyBudget`) y agrega una capa de datos reales independiente (`ActualEntry`), manteniendo separación de concerns y facilidad de mantenimiento.
