import { Router, Request, Response } from 'express';
import { compareBudgetVsActual } from '../../helpers/dimensional';

const router = Router();

// ===================================================================
// COMPARE BUDGET VS ACTUAL
// ===================================================================

/**
 * GET /api/v2/comparison/:year/:month?
 * 
 * Compara presupuesto vs gastos reales
 * 
 * Params:
 * - year: número (ej: 2026)
 * - month: número 1-12 (opcional, si se omite compara todo el año)
 * 
 * Query params:
 * - accountPrefix: filtrar por prefijo (ej: "GAS.SUS")
 * 
 * Response:
 * [
 *   {
 *     year: 2026,
 *     month: 1,
 *     yearMonth: "2026-01",
 *     accountCode: "GAS.SUS.001",
 *     accountName: "Netflix",
 *     budgetClp: 10000,
 *     actualClp: 9500,
 *     varianceClp: -500,
 *     variancePercent: -5.0,
 *     status: "ON_TARGET"
 *   },
 *   ...
 * ]
 */
router.get('/:year/:month?', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const month = req.params.month ? parseInt(req.params.month) : undefined;
    const accountPrefix = req.query.accountPrefix as string | undefined;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Mes inválido (1-12)' });
    }

    const comparison = await compareBudgetVsActual(year, month, accountPrefix);

    res.json(comparison);
  } catch (error: any) {
    console.error('Error en GET /api/v2/comparison/:year/:month:', error);
    res.status(500).json({ error: 'Error al comparar presupuesto vs actual' });
  }
});

// ===================================================================
// GET SUMMARY COMPARISON
// ===================================================================

/**
 * GET /api/v2/comparison/summary/:year/:month?
 * 
 * Obtiene resumen de comparación (totales generales)
 * 
 * Params:
 * - year: número (ej: 2026)
 * - month: número 1-12 (opcional)
 * 
 * Response:
 * {
 *   budgetTotal: 5000000,
 *   actualTotal: 4800000,
 *   varianceTotal: -200000,
 *   variancePercent: -4.0,
 *   overBudgetCount: 5,
 *   underBudgetCount: 15,
 *   onTargetCount: 3
 * }
 */
router.get('/summary/:year/:month?', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const month = req.params.month ? parseInt(req.params.month) : undefined;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Mes inválido (1-12)' });
    }

    const comparison = await compareBudgetVsActual(year, month);

    // Calcular resumen
    const budgetTotal = comparison.reduce((sum, c) => sum + c.budgetClp, 0);
    const actualTotal = comparison.reduce((sum, c) => sum + c.actualClp, 0);
    const varianceTotal = actualTotal - budgetTotal;
    const variancePercent = budgetTotal === 0 
      ? 0 
      : (varianceTotal / budgetTotal) * 100;

    const overBudgetCount = comparison.filter(c => c.status === 'OVER_BUDGET').length;
    const underBudgetCount = comparison.filter(c => c.status === 'UNDER_BUDGET').length;
    const onTargetCount = comparison.filter(c => c.status === 'ON_TARGET').length;

    res.json({
      budgetTotal,
      actualTotal,
      varianceTotal,
      variancePercent,
      overBudgetCount,
      underBudgetCount,
      onTargetCount
    });
  } catch (error: any) {
    console.error('Error en GET /api/v2/comparison/summary:', error);
    res.status(500).json({ error: 'Error al calcular resumen de comparación' });
  }
});

export default router;
