import { Router, Request, Response } from 'express';
import prismaStar from '../../db-star';
import { getAccountHierarchyWithTotals } from '../../helpers/dimensional';
import type { ScenarioCode } from '../../types/dimensional';

const router = Router();

// ===================================================================
// GET ALL ACCOUNTS
// ===================================================================

/**
 * GET /api/v2/accounts
 * 
 * Obtiene todas las cuentas (plano, sin jerarquía)
 * 
 * Query params:
 * - prefix: filtrar por prefijo de código
 * - baseMembersOnly: true para solo cuentas base (default: false)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const prefix = req.query.prefix as string | undefined;
    const baseMembersOnly = req.query.baseMembersOnly === 'true';

    const where: any = {};

    if (prefix) {
      where.accountCode = { startsWith: prefix };
    }

    if (baseMembersOnly) {
      where.isBaseMember = true;
    }

    const accounts = await prismaStar.dimAccount.findMany({
      where,
      orderBy: [
        { level: 'asc' },
        { accountCode: 'asc' }
      ],
      include: {
        parent: {
          select: {
            accountId: true,
            accountCode: true,
            accountName: true
          }
        }
      }
    });

    res.json(accounts);
  } catch (error: any) {
    console.error('Error en GET /api/v2/accounts:', error);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
});

// ===================================================================
// GET ACCOUNT BY ID
// ===================================================================

/**
 * GET /api/v2/accounts/:id
 * 
 * Obtiene una cuenta específica por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(req.params.id);

    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const account = await prismaStar.dimAccount.findUnique({
      where: { accountId: accountId },
      include: {
        parent: true,
        children: true
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    res.json(account);
  } catch (error: any) {
    console.error('Error en GET /api/v2/accounts/:id:', error);
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
});

// ===================================================================
// GET ACCOUNT HIERARCHY WITH TOTALS
// ===================================================================

/**
 * GET /api/v2/accounts/hierarchy/:scenario/:year/:month?
 * 
 * Obtiene jerarquía de cuentas con totales acumulados
 * 
 * Params:
 * - scenario: BUDGET | ACTUAL
 * - year: número (ej: 2026)
 * - month: número 1-12 (opcional)
 * 
 * Query params:
 * - rootAccountId: ID de cuenta raíz (opcional, default: ROOT)
 * 
 * Response: Árbol jerárquico con totales en cada nodo
 */
router.get('/hierarchy/:scenario/:year/:month?', async (req: Request, res: Response) => {
  try {
    const scenario = req.params.scenario.toUpperCase() as ScenarioCode;
    const year = parseInt(req.params.year);
    const month = req.params.month ? parseInt(req.params.month) : undefined;
    const rootAccountId = req.query.rootAccountId 
      ? parseInt(req.query.rootAccountId as string)
      : undefined;

    if (!['BUDGET', 'ACTUAL'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET o ACTUAL' });
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Año inválido (2000-2100)' });
    }

    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Mes inválido (1-12)' });
    }

    const hierarchy = await getAccountHierarchyWithTotals(
      scenario,
      year,
      month,
      rootAccountId
    );

    res.json(hierarchy);
  } catch (error: any) {
    console.error('Error en GET /api/v2/accounts/hierarchy:', error);
    res.status(500).json({ error: 'Error al obtener jerarquía de cuentas' });
  }
});

// ===================================================================
// SEARCH ACCOUNTS
// ===================================================================

/**
 * GET /api/v2/accounts/search?q=...
 * 
 * Busca cuentas por código o nombre
 * 
 * Query params:
 * - q: término de búsqueda
 * - limit: número máximo de resultados (default: 20)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query debe tener al menos 2 caracteres' });
    }

    const accounts = await prismaStar.dimAccount.findMany({
      where: {
        OR: [
          { accountCode: { contains: query } },
          { accountName: { contains: query } }
        ]
      },
      take: limit,
      orderBy: { accountCode: 'asc' },
      include: {
        parent: {
          select: {
            accountCode: true,
            accountName: true
          }
        }
      }
    });

    res.json(accounts);
  } catch (error: any) {
    console.error('Error en GET /api/v2/accounts/search:', error);
    res.status(500).json({ error: 'Error al buscar cuentas' });
  }
});

export default router;
