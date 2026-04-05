import { Router, Request, Response } from 'express';
import {
  getTotalsByMonth,
  getTotalsByAccount,
  compareBudgetVsActual
} from '../../helpers/dimensional';

const router = Router();

// ===================================================================
// GET BUDGET MONTHLY TOTALS
// ===================================================================

/**
 * GET /api/v2/budget/monthly/:year
 * 
 * Obtiene totales de presupuesto mes a mes para un año
 * 
 * Params:
 * - year: número (ej: 2026)
 * 
 * Response:
 * [
 *   { year: 2026, month: 1, yearMonth: "2026-01", totalClp: 5000000, count: 20 },
 *   { year: 2026, month: 2, yearMonth: "2026-02", totalClp: 5100000, count: 20 },
 *   ...
 * ]
 */
router.get('/monthly/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    const totals = await getTotalsByMonth('BUDGET', year);

    res.json(totals);
  } catch (error: any) {
    console.error('Error en GET /api/v2/budget/monthly/:year:', error);
    res.status(500).json({ error: 'Error al obtener totales mensuales' });
  }
});

// ===================================================================
// GET BUDGET BY ACCOUNT
// ===================================================================

/**
 * GET /api/v2/budget/by-account/:year/:month?
 * 
 * Obtiene presupuesto agrupado por cuenta
 * 
 * Params:
 * - year: número (ej: 2026)
 * - month: número 1-12 (opcional, si se omite trae el año completo)
 * 
 * Query params:
 * - accountPrefix: filtrar por prefijo (ej: "GAS.SUS")
 */
router.get('/by-account/:year/:month?', async (req: Request, res: Response) => {
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

    const totals = await getTotalsByAccount('BUDGET', year, month, accountPrefix);

    res.json(totals);
  } catch (error: any) {
    console.error('Error en GET /api/v2/budget/by-account:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto por cuenta' });
  }
});

// ===================================================================
// GET BUDGET DETAIL FOR MONTH
// ===================================================================

/**
 * GET /api/v2/budget/:year/:month
 * 
 * Obtiene presupuesto detallado para un mes específico
 * 
 * Params:
 * - year: número (ej: 2026)
 * - month: número 1-12
 * 
 * Query params:
 * - accountPrefix: filtrar por prefijo (opcional)
 */
router.get('/:year/:month', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const accountPrefix = req.query.accountPrefix as string | undefined;

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Mes inválido (1-12)' });
    }

    const filter: any = {
      scenario: 'BUDGET',
      time: { year, month }
    };

    if (accountPrefix) {
      filter.account = { accountCodePrefix: accountPrefix };
    }

    // Importar getFacts aquí para evitar dependencia circular
    const { getFacts } = await import('../../helpers/dimensional');
    const facts = await getFacts(filter);

    res.json(facts);
  } catch (error: any) {
    console.error('Error en GET /api/v2/budget/:year/:month:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto del mes' });
  }
});

export default router;
