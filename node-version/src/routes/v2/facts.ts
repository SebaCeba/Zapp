import { Router, Request, Response } from 'express';
import prismaStar from '../../db-star';
import {
  getFacts,
  getFactById,
  getTotalByScenario,
  getTotalsByMonth,
  getTotalsByAccount,
  resolveAccountId,
  resolveTimeId,
  resolveScenarioId
} from '../../helpers/dimensional';
import type {
  ScenarioCode,
  GetFactsRequest,
  UpsertFactRequest,
  PaginatedResponse,
  FactWithDimensions,
  toFactWithDimensions
} from '../../types/dimensional';

const router = Router();

// ===================================================================
// GET ALL FACTS - Con filtros dimensionales
// ===================================================================

/**
 * GET /api/v2/facts
 * 
 * Obtiene hechos financieros con filtros opcionales
 * 
 * Query params:
 * - scenario: BUDGET | ACTUAL
 * - year: número (ej: 2026)
 * - month: número 1-12
 * - accountCode: código exacto (ej: "ING.001")
 * - accountPrefix: prefijo (ej: "GAS.SUS" para todas las suscripciones)
 * - limit: número de resultados (default: 100, max: 1000)
 * - offset: para paginación (default: 0)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      scenario,
      year,
      month,
      accountCode,
      accountPrefix,
      limit = 100,
      offset = 0
    } = req.query;

    // Validaciones
    if (scenario && !['BUDGET', 'ACTUAL'].includes(scenario as string)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET o ACTUAL' });
    }

    const parsedYear = year ? parseInt(year as string) : undefined;
    const parsedMonth = month ? parseInt(month as string) : undefined;
    const parsedLimit = Math.min(parseInt(limit as string), 1000);
    const parsedOffset = parseInt(offset as string);

    if (parsedMonth && (parsedMonth < 1 || parsedMonth > 12)) {
      return res.status(400).json({ error: 'month debe estar entre 1 y 12' });
    }

    // Construir filtro
    const filter: any = {};

    if (scenario) {
      filter.scenario = scenario as ScenarioCode;
    }

    if (parsedYear || parsedMonth) {
      filter.time = {};
      if (parsedYear) filter.time.year = parsedYear;
      if (parsedMonth) filter.time.month = parsedMonth;
    }

    if (accountCode || accountPrefix) {
      filter.account = {};
      if (accountCode) filter.account.accountCode = accountCode as string;
      if (accountPrefix) filter.account.accountCodePrefix = accountPrefix as string;
    }

    // Ejecutar query
    const facts = await getFacts(filter);

    // Paginación manual (Prisma groupBy no soporta skip/take con includes)
    const total = facts.length;
    const paginatedFacts = facts.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      data: paginatedFacts,
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      }
    });
  } catch (error: any) {
    console.error('Error en GET /api/v2/facts:', error);
    res.status(500).json({ error: 'Error al obtener hechos financieros' });
  }
});

// ===================================================================
// GET FACT BY ID
// ===================================================================

/**
 * GET /api/v2/facts/:id
 * 
 * Obtiene un hecho específico por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const factId = parseInt(req.params.id);

    if (isNaN(factId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const fact = await getFactById(factId);

    if (!fact) {
      return res.status(404).json({ error: 'Hecho no encontrado' });
    }

    res.json(fact);
  } catch (error: any) {
    console.error('Error en GET /api/v2/facts/:id:', error);
    res.status(500).json({ error: 'Error al obtener hecho' });
  }
});

// ===================================================================
// CREATE/UPDATE FACT (UPSERT)
// ===================================================================

/**
 * PUT /api/v2/facts
 * 
 * Crea o actualiza un hecho financiero
 * 
 * Body (JSON):
 * {
 *   "scenario": "BUDGET" | "ACTUAL",
 *   "year": 2026,
 *   "month": 1,
 *   "accountCode": "ING.001",
 *   "amountClp": 1000000,
 *   "amountUsd": 1200 (opcional),
 *   "exchangeRateCLP_USD": 833.33 (opcional)
 * }
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const {
      scenario,
      year,
      month,
      accountCode,
      amountClp,
      amountUsd,
      exchangeRateCLP_USD
    }: UpsertFactRequest = req.body;

    // Validaciones
    if (!scenario || !['BUDGET', 'ACTUAL'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET o ACTUAL' });
    }

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year inválido (2000-2100)' });
    }

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'month inválido (1-12)' });
    }

    if (!accountCode || accountCode.trim() === '') {
      return res.status(400).json({ error: 'accountCode requerido' });
    }

    if (amountClp === undefined || amountClp < 0 || !Number.isInteger(amountClp)) {
      return res.status(400).json({ error: 'amountClp debe ser entero >= 0' });
    }

    // Resolver IDs de dimensiones
    const accountId = await resolveAccountId(accountCode);
    if (!accountId) {
      return res.status(404).json({ error: `Cuenta no encontrada: ${accountCode}` });
    }

    // Verificar que es cuenta base
    const account = await prismaStar.dimAccount.findUnique({
      where: { accountId: accountId }
    });

    if (!account?.isBaseMember) {
      return res.status(400).json({ 
        error: `La cuenta ${accountCode} no es una cuenta base (no puede tener transacciones directas)` 
      });
    }

    const timeId = await resolveTimeId(year, month);
    if (!timeId) {
      return res.status(404).json({ error: `Período no encontrado: ${year}-${month}` });
    }

    const scenarioId = await resolveScenarioId(scenario);
    if (!scenarioId) {
      return res.status(404).json({ error: `Escenario no encontrado: ${scenario}` });
    }

    // Upsert (buscar por grano único, actualizar o crear)
    const existingFact = await prismaStar.factFinancial.findFirst({
      where: {
        timeId: timeId,
        scenarioId: scenarioId,
        accountBaseId: accountId
      }
    });

    let fact;
    if (existingFact) {
      // Actualizar
      fact = await prismaStar.factFinancial.update({
        where: { factId: existingFact.factId },
        data: {
          amountClp: amountClp,
          updatedAt: new Date()
        },
        include: {
          scenario: true,
          time: true,
          account: true
        }
      });
    } else {
      // Crear
      fact = await prismaStar.factFinancial.create({
        data: {
          timeId: timeId,
          scenarioId: scenarioId,
          accountBaseId: accountId,
          amountClp: amountClp
        },
        include: {
          scenario: true,
          time: true,
          account: true
        }
      });
    }

    res.json(fact);
  } catch (error: any) {
    console.error('Error en PUT /api/v2/facts:', error);
    res.status(500).json({ error: 'Error al guardar hecho financiero' });
  }
});

// ===================================================================
// DELETE FACT
// ===================================================================

/**
 * DELETE /api/v2/facts/:id
 * 
 * Elimina un hecho específico
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const factId = parseInt(req.params.id);

    if (isNaN(factId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await prismaStar.factFinancial.delete({
      where: { factId: factId }
    });

    res.json({ message: 'Hecho eliminado exitosamente', factId });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Hecho no encontrado' });
    }
    console.error('Error en DELETE /api/v2/facts/:id:', error);
    res.status(500).json({ error: 'Error al eliminar hecho' });
  }
});

// ===================================================================
// GET TOTALS
// ===================================================================

/**
 * GET /api/v2/facts/totals/:scenario
 * 
 * Obtiene totales agregados por escenario
 * 
 * Params:
 * - scenario: BUDGET | ACTUAL
 * 
 * Query params:
 * - year: número (opcional)
 * - month: número 1-12 (opcional)
 */
router.get('/totals/:scenario', async (req: Request, res: Response) => {
  try {
    const scenario = req.params.scenario.toUpperCase() as ScenarioCode;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!['BUDGET', 'ACTUAL'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET o ACTUAL' });
    }

    const totals = await getTotalByScenario(scenario, year, month);

    res.json(totals);
  } catch (error: any) {
    console.error('Error en GET /api/v2/facts/totals/:scenario:', error);
    res.status(500).json({ error: 'Error al obtener totales' });
  }
});

export default router;
