import { Router, Request, Response } from 'express';
import {
  getTotalsByMonth,
  getTotalsByAccount,
  getFacts
} from '../../helpers/dimensional';

const router = Router();

// ===================================================================
// GET ACTUAL MONTHLY TOTALS
// ===================================================================

/**
 * GET /api/v2/actual/monthly/:year
 * 
 * Obtiene totales de gastos reales mes a mes para un año
 * 
 * Params:
 * - year: número (ej: 2026)
 */
router.get('/monthly/:year', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    const totals = await getTotalsByMonth('ACTUAL', year);

    res.json(totals);
  } catch (error: any) {
    console.error('Error en GET /api/v2/actual/monthly/:year:', error);
    res.status(500).json({ error: 'Error al obtener totales mensuales' });
  }
});

// ===================================================================
// GET ACTUAL BY ACCOUNT
// ===================================================================

/**
 * GET /api/v2/actual/by-account/:year/:month?
 * 
 * Obtiene gastos reales agrupados por cuenta
 * 
 * Params:
 * - year: número (ej: 2026)
 * - month: número 1-12 (opcional)
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

    const totals = await getTotalsByAccount('ACTUAL', year, month, accountPrefix);

    res.json(totals);
  } catch (error: any) {
    console.error('Error en GET /api/v2/actual/by-account:', error);
    res.status(500).json({ error: 'Error al obtener gastos por cuenta' });
  }
});

// ===================================================================
// GET ACTUAL DETAIL FOR MONTH
// ===================================================================

/**
 * GET /api/v2/actual/:year/:month
 * 
 * Obtiene gastos reales detallados para un mes específico
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
      scenario: 'ACTUAL',
      time: { year, month }
    };

    if (accountPrefix) {
      filter.account = { accountCodePrefix: accountPrefix };
    }

    const facts = await getFacts(filter);

    res.json(facts);
  } catch (error: any) {
    console.error('Error en GET /api/v2/actual/:year/:month:', error);
    res.status(500).json({ error: 'Error al obtener gastos del mes' });
  }
});

export default router;
