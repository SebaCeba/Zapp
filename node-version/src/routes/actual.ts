import { Router, Request, Response } from 'express';
import prisma from '../db';
import { getMonthlyBudget } from '../services/consolidado';

const router = Router();

const VALID_CATEGORIES = [
  'INGRESOS',
  'SUSCRIPCIONES',
  'OBLIGACIONES',
  'HIPOTECARIO',
  'SERVICIOS_BASICOS',
  'SUPERMERCADO',
  'PAGO_TC',
  'AJUSTES',
  'AHORROS'
];

function validateActualEntryPayload(body: any) {
  const { year, month, category, itemKey, label, amountClp, isPaid } = body;

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: 'Anio invalido (2000-2100)' };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: 'Mes invalido (1-12)' };
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return { error: 'Categoria invalida' };
  }
  if (!itemKey || typeof itemKey !== 'string' || itemKey.trim() === '') {
    return { error: 'itemKey requerido' };
  }
  if (!Number.isInteger(amountClp) || amountClp < 0) {
    return { error: 'amountClp debe ser entero >= 0' };
  }
  if (isPaid !== undefined && typeof isPaid !== 'boolean') {
    return { error: 'isPaid debe ser boolean' };
  }
  if (category === 'AJUSTES' && (!label || label.trim() === '')) {
    return { error: 'label requerido para AJUSTES' };
  }

  return {
    value: {
      year,
      month,
      category,
      itemKey: itemKey.trim(),
      label,
      amountClp,
      isPaid
    }
  };
}

// PUT /api/actual/entry - Upsert entry
router.put('/entry', async (req: Request, res: Response) => {
  try {
    const validation = validateActualEntryPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { year, month, category, itemKey, label, amountClp, isPaid } = req.body;

    // Validaciones
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'AÃ±o invÃ¡lido (2000-2100)' });
    }
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Mes invÃ¡lido (1-12)' });
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'CategorÃ­a invÃ¡lida' });
    }
    if (!itemKey || typeof itemKey !== 'string' || itemKey.trim() === '') {
      return res.status(400).json({ error: 'itemKey requerido' });
    }
    if (amountClp === undefined || amountClp < 0 || !Number.isInteger(amountClp)) {
      return res.status(400).json({ error: 'amountClp debe ser entero >= 0' });
    }
    if (category === 'AJUSTES' && (!label || label.trim() === '')) {
      return res.status(400).json({ error: 'label requerido para AJUSTES' });
    }

    // Lock check
    const existing = await prisma.actualEntry.findUnique({
      where: {
        year_month_category_itemKey: {
          year,
          month,
          category,
          itemKey
        }
      }
    });

    if (existing && existing.isLocked) {
      return res.status(423).json({ error: 'Mes bloqueado' });
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
        label: label || undefined,
        amountClp,
        isPaid: isPaid !== undefined ? isPaid : false
      },
      create: {
        year,
        month,
        category,
        itemKey,
        label: label || null,
        amountClp,
        isPaid: isPaid !== undefined ? isPaid : false
      }
    });

    res.json(entry);
  } catch (error: any) {
    console.error('Error en PUT /entry:', error);
    res.status(500).json({ error: 'Error al guardar entry' });
  }
});

// POST /api/actual/entry - Crear/Actualizar entry (alias de PUT para semÃ¡ntica de creaciÃ³n)
router.post('/entry', async (req: Request, res: Response) => {
  try {
    const validation = validateActualEntryPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const { year, month, category, itemKey, label, amountClp } = req.body;

    // Reutilizamos la validaciÃ³n y lÃ³gica de upsert del PUT
    // PodrÃ­amos refactorizar en una funciÃ³n comÃºn, pero por ahora duplico la validaciÃ³n bÃ¡sica
    // o simplemente hago un redirect interno a la lÃ³gica, pero Express no permite eso fÃ¡cilmente sin middleware.
    // Voy a copiar la lÃ³gica esencial ya que es un requerimiento especÃ­fico tener POST.

    if (!year || year < 2000 || year > 2100) return res.status(400).json({ error: 'AÃ±o invÃ¡lido' });
    if (!month || month < 1 || month > 12) return res.status(400).json({ error: 'Mes invÃ¡lido' });
    if (!category || !VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'CategorÃ­a invÃ¡lida' });
    if (!itemKey) return res.status(400).json({ error: 'itemKey requerido' });
    
    // Upsert para garantizar idempotencia (si pago varias veces el mismo mes, actualiza)
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
        label: label,
        amountClp,
        isPaid: true // Asumimos que si viene de POST /entry (pago explicito) es pagado
      },
      create: {
        year,
        month,
        category,
        itemKey,
        label,
        amountClp,
        isPaid: true
      }
    });

    res.json(entry);
  } catch (error: any) {
    console.error('Error en POST /entry:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

// GET /api/actual/summary?year=YYYY&month=M
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string);
    const month = parseInt(req.query.month as string);

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'AÃ±o invÃ¡lido' });
    }
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Mes invÃ¡lido' });
    }

    // Obtener budget
    const budget = await getMonthlyBudget(year, month);

    // Obtener actual entries
    const actualEntries = await prisma.actualEntry.findMany({
      where: { year, month }
    });

    const actualMap = new Map<string, typeof actualEntries[0]>();
    actualEntries.forEach(entry => {
      const key = `${entry.category}:${entry.itemKey}`;
      actualMap.set(key, entry);
    });

    // Construir summary por categorÃ­a
    const categories = VALID_CATEGORIES.map(categoryName => {
      const budgetLines = budget[categoryName as keyof typeof budget] || [];
      const lines: any[] = [];

      // Merge budget con actual
      const processedKeys = new Set<string>();

      budgetLines.forEach(budgetLine => {
        const key = `${categoryName}:${budgetLine.itemKey}`;
        const actualEntry = actualMap.get(key);
        
        const actualClp = actualEntry ? actualEntry.amountClp : 0;
        const deltaClp = actualClp - budgetLine.amountClp;
        const pctExec = budgetLine.amountClp === 0 
          ? null 
          : (actualClp / budgetLine.amountClp) * 100;

        lines.push({
          itemKey: budgetLine.itemKey,
          itemName: actualEntry?.label || budgetLine.label,
          budgetClp: budgetLine.amountClp,
          actualClp,
          deltaClp,
          pctExec,
          isPaid: actualEntry?.isPaid || false
        });

        processedKeys.add(budgetLine.itemKey);
      });

      // Agregar lÃ­neas que solo estÃ©n en actual (ej: AJUSTES)
      actualEntries
        .filter(e => e.category === categoryName && !processedKeys.has(e.itemKey))
        .forEach(entry => {
          const deltaClp = entry.amountClp - 0;
          const pctExec = null;

          lines.push({
            itemKey: entry.itemKey,
            itemName: entry.label || entry.itemKey,
            budgetClp: 0,
            actualClp: entry.amountClp,
            deltaClp,
            pctExec,
            isPaid: entry.isPaid
          });
        });

      // Totales de categorÃ­a
      const budgetClp = lines.reduce((sum, l) => sum + l.budgetClp, 0);
      const actualClp = lines.reduce((sum, l) => sum + l.actualClp, 0);
      const deltaClp = actualClp - budgetClp;
      const pctExec = budgetClp === 0 ? null : (actualClp / budgetClp) * 100;

      return {
        name: categoryName,
        budgetClp,
        actualClp,
        deltaClp,
        pctExec,
        lines
      };
    });

    // Calcular totales globales
    const totalIngresos = categories.find(c => c.name === 'INGRESOS')?.actualClp || 0;
    const totalGastos = categories
      .filter(c => c.name !== 'INGRESOS' && c.name !== 'AHORROS')
      .reduce((sum, c) => sum + c.actualClp, 0);
    const balance = totalIngresos - totalGastos;

    res.json({
      year,
      month,
      totalIngresos,
      totalGastos,
      balance,
      categories
    });
  } catch (error: any) {
    console.error('Error en GET /summary:', error);
    res.status(500).json({ error: 'Error al cargar resumen' });
  }
});

// GET /api/actual/entries - Listar entries
router.get('/entries', async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    const category = req.query.category as string | undefined;

    const where: any = {};
    if (year) where.year = year;
    if (month) where.month = month;
    if (category && VALID_CATEGORIES.includes(category)) {
      where.category = category;
    }

    const entries = await prisma.actualEntry.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(entries);
  } catch (error) {
    console.error('Error al listar entries:', error);
    res.status(500).json({ error: 'Error al listar entries' });
  }
});

// DELETE /api/actual/entry/:id - Eliminar entry (opcional)
router.delete('/entry/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const entry = await prisma.actualEntry.findUnique({ where: { id } });
    if (!entry) {
      return res.status(404).json({ error: 'Entry no encontrado' });
    }

    if (entry.isLocked) {
      return res.status(423).json({ error: 'Mes bloqueado' });
    }

    await prisma.actualEntry.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar entry' });
  }
});

export default router;
