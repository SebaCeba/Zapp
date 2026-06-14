/**
 * API v2 - Subscriptions Router
 * 
 * Endpoints para gestión de suscripciones usando modelo dimensional.
 * Las suscripciones se almacenan como cuentas en dim_account (GAS.SUS.*)
 * con hechos financieros en fact_financial.
 */

import { Router, Request, Response } from 'express';
import prismaStar from '../../db-star';
import { 
  getActiveMonths, 
  calculateAnnualCost, 
  inferPeriodicity 
} from '../../utils/subscriptionPeriodicity';

const router = Router();

// ===================================================================
// TIPOS Y INTERFACES
// ===================================================================

interface SubscriptionResponse {
  accountId: number;
  accountCode: string;
  accountName: string;
  periodicity: string;
  startDate: string;
  monthlyPrice: number | null;
  activeMonths: number[];
  totalAnnual: number;
  hasActuals: boolean;
  hasBudget: boolean;
  lastModified: string;
}

interface CreateSubscriptionRequest {
  name: string;
  periodicity: string;
  startDate: string;
  price: number;
  year: number;
  scenario?: 'BUDGET' | 'ACTUAL';
}

interface UpdateSubscriptionRequest {
  name?: string;
  price?: number;
  year: number;
  scenario: 'BUDGET' | 'ACTUAL';
}

interface ActualRequest {
  year: number;
  month: number;
  amount: number;
}

// ===================================================================
// FUNCIONES HELPER
// ===================================================================

/**
 * Genera el siguiente código de suscripción disponible (GAS.SUS.XXX)
 */
async function getNextSubscriptionCode(): Promise<string> {
  const existingCount = await prismaStar.dimAccount.count({
    where: { 
      accountCode: { startsWith: 'GAS.SUS.' },
      isBaseMember: true
    }
  });
  
  let attempt = existingCount + 1;
  while (true) {
    const code = `GAS.SUS.${String(attempt).padStart(3, '0')}`;
    const exists = await prismaStar.dimAccount.findUnique({
      where: { accountCode: code }
    });
    if (!exists) return code;
    attempt++;
    if (attempt > 999) {
      throw new Error('Se alcanzó el límite de códigos de suscripción (999)');
    }
  }
}

/**
 * Obtiene información agregada de una suscripción desde dim_account + facts
 */
async function getSubscriptionInfo(
  accountCode: string,
  year: number,
  scenario?: 'BUDGET' | 'ACTUAL' | 'BOTH'
): Promise<SubscriptionResponse | null> {
  const account = await prismaStar.dimAccount.findUnique({
    where: { accountCode }
  });

  if (!account || !account.isBaseMember) {
    return null;
  }

  // Obtener hechos del año
  const facts = await prismaStar.factFinancial.findMany({
    where: {
      accountBaseId: account.accountId,
      time: {
        year: year
      }
    },
    include: {
      time: true,
      scenario: true
    }
  });

  // Separar por escenario
  const budgetFacts = facts.filter(f => f.scenario.scenarioCode === 'BUDGET');
  const actualFacts = facts.filter(f => f.scenario.scenarioCode === 'ACTUAL');

  // Determinar qué hechos usar para inferir periodicidad
  const relevantFacts = scenario === 'ACTUAL' ? actualFacts : budgetFacts;
  
  if (relevantFacts.length === 0) {
    return null; // No hay hechos para este escenario
  }

  // Extraer meses activos
  const activeMonths = relevantFacts.map(f => f.time.month).sort((a, b) => a - b);
  
  // Inferir periodicidad
  const periodicity = inferPeriodicity(activeMonths);
  
  // Calcular precio mensual (asumiendo precio constante)
  const prices = relevantFacts.map(f => f.amountClp);
  const monthlyPrice = prices.length > 0 ? prices[0] : null;
  const pricesMatch = prices.every(p => p === monthlyPrice);
  
  // Fecha de inicio: primer mes con hechos
  const firstFact = relevantFacts.sort((a, b) => 
    new Date(a.time.yearMonth).getTime() - new Date(b.time.yearMonth).getTime()
  )[0];
  const startDate = `${firstFact.time.year}-${String(firstFact.time.month).padStart(2, '0')}-01`;
  
  // Calcular total anual
  const totalAnnual = relevantFacts.reduce((sum, f) => sum + f.amountClp, 0);
  
  // Última modificación
  const lastModified = new Date().toISOString(); // TODO: agregar campo updatedAt a fact_financial

  return {
    accountId: account.accountId,
    accountCode: account.accountCode,
    accountName: account.accountName,
    periodicity,
    startDate,
    monthlyPrice: pricesMatch ? monthlyPrice : null,
    activeMonths,
    totalAnnual,
    hasActuals: actualFacts.length > 0,
    hasBudget: budgetFacts.length > 0,
    lastModified
  };
}

// ===================================================================
// ENDPOINTS
// ===================================================================

/**
 * GET /api/v2/subscriptions?scenario=BUDGET&year=2026
 * 
 * Obtiene todas las suscripciones con información agregada
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const scenario = (req.query.scenario as string) || 'BUDGET';
    const year = parseInt(req.query.year as string);

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year requerido (2000-2100)' });
    }

    if (!['BUDGET', 'ACTUAL', 'BOTH'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET, ACTUAL o BOTH' });
    }

    // Obtener todas las cuentas de suscripciones
    const accounts = await prismaStar.dimAccount.findMany({
      where: {
        accountCode: { startsWith: 'GAS.SUS.' },
        isBaseMember: true,
        isActive: true
      },
      orderBy: { accountCode: 'asc' }
    });

    // Obtener info de cada suscripción
    const subscriptions: SubscriptionResponse[] = [];
    for (const account of accounts) {
      const info = await getSubscriptionInfo(account.accountCode, year, scenario as any);
      if (info) {
        subscriptions.push(info);
      }
    }

    // Calcular resumen
    const summary = {
      totalSubscriptions: subscriptions.length,
      totalAnnualBudget: subscriptions
        .filter(s => s.hasBudget)
        .reduce((sum, s) => sum + s.totalAnnual, 0),
      totalAnnualActual: subscriptions
        .filter(s => s.hasActuals)
        .reduce((sum, s) => sum + s.totalAnnual, 0)
    };

    res.json({ subscriptions, summary });
  } catch (error: any) {
    console.error('Error en GET /api/v2/subscriptions:', error);
    res.status(500).json({ error: 'Error al obtener suscripciones' });
  }
});

/**
 * POST /api/v2/subscriptions
 * 
 * Crea nueva suscripción (cuenta + hechos presupuestados)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      periodicity, 
      startDate, 
      price, 
      year,
      scenario = 'BUDGET'
    }: CreateSubscriptionRequest = req.body;

    // Validaciones
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name requerido' });
    }

    if (!periodicity || !['monthly', 'quarterly', 'semiannual', 'annual', 'weekly'].includes(periodicity.toLowerCase())) {
      return res.status(400).json({ error: 'periodicity inválida' });
    }

    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return res.status(400).json({ error: 'startDate debe ser formato YYYY-MM-DD' });
    }

    if (!price || price <= 0 || !Number.isInteger(price)) {
      return res.status(400).json({ error: 'price debe ser entero positivo' });
    }

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year inválido (2000-2100)' });
    }

    // 1. Verificar parent GAS.SUS
    const parentAccount = await prismaStar.dimAccount.findUnique({
      where: { accountCode: 'GAS.SUS' }
    });

    if (!parentAccount) {
      return res.status(500).json({ error: 'Cuenta padre GAS.SUS no encontrada' });
    }

    // 2. Generar código único
    const newCode = await getNextSubscriptionCode();

    // 3. Crear cuenta dimensional
    const dimAccount = await prismaStar.dimAccount.create({
      data: {
        accountCode: newCode,
        accountName: name.trim(),
        parentId: parentAccount.accountId,
        level: 3,
        isBaseMember: true,
        accountType: 'GASTO',
        sortOrder: 0,
        isActive: true
      }
    });

    // 4. Resolver scenario
    const scenarioRecord = await prismaStar.dimScenario.findUnique({
      where: { scenarioCode: scenario }
    });

    if (!scenarioRecord) {
      return res.status(500).json({ error: `Escenario ${scenario} no encontrado` });
    }

    // 5. Calcular meses activos
    const activeMonths = getActiveMonths(startDate, periodicity, year);

    // 6. Crear hechos para cada mes activo
    let factsCreated = 0;
    for (const month of activeMonths) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      
      const timeEntry = await prismaStar.dimTime.findUnique({
        where: { yearMonth }
      });

      if (!timeEntry) {
        console.warn(`Mes ${yearMonth} no encontrado en dim_time, saltando`);
        continue;
      }

      await prismaStar.factFinancial.create({
        data: {
          scenarioId: scenarioRecord.scenarioId,
          timeId: timeEntry.timeId,
          accountBaseId: dimAccount.accountId,
          amountClp: price,
          source: 'manual'
        }
      });

      factsCreated++;
    }

    res.status(201).json({
      subscription: {
        accountId: dimAccount.accountId,
        accountCode: dimAccount.accountCode,
        accountName: dimAccount.accountName,
        periodicity,
        startDate,
        monthlyPrice: price,
        factsCreated
      }
    });
  } catch (error: any) {
    console.error('Error en POST /api/v2/subscriptions:', error);
    res.status(500).json({ error: 'Error al crear suscripción' });
  }
});

/**
 * GET /api/v2/subscriptions/:accountCode?year=2026
 * 
 * Obtiene detalle de una suscripción específica
 */
router.get('/:accountCode', async (req: Request, res: Response) => {
  try {
    const { accountCode } = req.params;
    const year = parseInt(req.query.year as string);

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year requerido (2000-2100)' });
    }

    // Obtener cuenta
    const account = await prismaStar.dimAccount.findUnique({
      where: { accountCode: accountCode.toUpperCase() }
    });

    if (!account || !account.isBaseMember) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Obtener hechos del año (ambos escenarios)
    const facts = await prismaStar.factFinancial.findMany({
      where: {
        accountBaseId: account.accountId,
        time: { year }
      },
      include: {
        time: true,
        scenario: true
      },
      orderBy: { time: { month: 'asc' } }
    });

    // Agrupar por mes
    const monthlyDetails = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const budgetFact = facts.find(f => f.time.month === month && f.scenario.scenarioCode === 'BUDGET');
      const actualFact = facts.find(f => f.time.month === month && f.scenario.scenarioCode === 'ACTUAL');

      const budget = budgetFact ? budgetFact.amountClp : null;
      const actual = actualFact ? actualFact.amountClp : null;
      const variance = (budget !== null && actual !== null) ? actual - budget : null;

      return { month, budget, actual, variance };
    });

    // Calcular totales
    const budgetAnnual = monthlyDetails.reduce((sum, m) => sum + (m.budget || 0), 0);
    const actualAnnual = monthlyDetails.reduce((sum, m) => sum + (m.actual || 0), 0);
    const variance = actualAnnual - budgetAnnual;

    // Inferir periodicidad desde budget
    const budgetMonths = monthlyDetails.filter(m => m.budget !== null).map(m => m.month);
    const periodicity = inferPeriodicity(budgetMonths);

    // Fecha de inicio
    const firstBudgetMonth = budgetMonths.length > 0 ? Math.min(...budgetMonths) : 1;
    const startDate = `${year}-${String(firstBudgetMonth).padStart(2, '0')}-01`;

    res.json({
      subscription: {
        accountId: account.accountId,
        accountCode: account.accountCode,
        accountName: account.accountName,
        periodicity,
        startDate,
        isActive: account.isActive,
        monthlyDetails,
        totals: {
          budgetAnnual,
          actualAnnual,
          variance
        }
      }
    });
  } catch (error: any) {
    console.error('Error en GET /api/v2/subscriptions/:accountCode:', error);
    res.status(500).json({ error: 'Error al obtener detalle de suscripción' });
  }
});

/**
 * PUT /api/v2/subscriptions/:accountCode
 * 
 * Actualiza suscripción existente
 */
router.put('/:accountCode', async (req: Request, res: Response) => {
  try {
    const { accountCode } = req.params;
    const { name, price, year, scenario }: UpdateSubscriptionRequest = req.body;

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year requerido (2000-2100)' });
    }

    if (!scenario || !['BUDGET', 'ACTUAL'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET o ACTUAL' });
    }

    // Obtener cuenta
    const account = await prismaStar.dimAccount.findUnique({
      where: { accountCode: accountCode.toUpperCase() }
    });

    if (!account || !account.isBaseMember) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    let factsUpdated = 0;

    // Actualizar nombre si presente
    if (name && typeof name === 'string' && name.trim().length > 0) {
      await prismaStar.dimAccount.update({
        where: { accountId: account.accountId },
        data: { accountName: name.trim() }
      });
    }

    // Actualizar precio si presente
    if (price !== undefined && price > 0 && Number.isInteger(price)) {
      // Resolver scenario
      const scenarioRecord = await prismaStar.dimScenario.findUnique({
        where: { scenarioCode: scenario }
      });

      if (!scenarioRecord) {
        return res.status(500).json({ error: `Escenario ${scenario} no encontrado` });
      }

      // Actualizar todos los hechos del año para este escenario
      const result = await prismaStar.factFinancial.updateMany({
        where: {
          accountBaseId: account.accountId,
          scenarioId: scenarioRecord.scenarioId,
          time: { year }
        },
        data: { amountClp: price }
      });

      factsUpdated = result.count;
    }

    res.json({
      subscription: {
        accountCode: account.accountCode,
        accountName: name || account.accountName,
        factsUpdated
      }
    });
  } catch (error: any) {
    console.error('Error en PUT /api/v2/subscriptions/:accountCode:', error);
    res.status(500).json({ error: 'Error al actualizar suscripción' });
  }
});

/**
 * DELETE /api/v2/subscriptions/:accountCode?year=2026&scenario=BUDGET
 * 
 * Elimina hechos de presupuesto para un año específico
 */
router.delete('/:accountCode', async (req: Request, res: Response) => {
  try {
    const { accountCode } = req.params;
    const year = parseInt(req.query.year as string);
    const scenario = (req.query.scenario as string) || 'BUDGET';

    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year requerido (2000-2100)' });
    }

    if (!['BUDGET', 'ACTUAL', 'BOTH'].includes(scenario)) {
      return res.status(400).json({ error: 'scenario debe ser BUDGET, ACTUAL o BOTH' });
    }

    // Obtener cuenta
    const account = await prismaStar.dimAccount.findUnique({
      where: { accountCode: accountCode.toUpperCase() }
    });

    if (!account || !account.isBaseMember) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Resolver escenarios a eliminar
    const scenarioCodes = scenario === 'BOTH' ? ['BUDGET', 'ACTUAL'] : [scenario];
    const scenarios = await prismaStar.dimScenario.findMany({
      where: { scenarioCode: { in: scenarioCodes } }
    });

    const scenarioIds = scenarios.map(s => s.scenarioId);

    // Eliminar hechos
    const result = await prismaStar.factFinancial.deleteMany({
      where: {
        accountBaseId: account.accountId,
        scenarioId: { in: scenarioIds },
        time: { year }
      }
    });

    // Verificar si quedan hechos
    const remainingFacts = await prismaStar.factFinancial.count({
      where: { accountBaseId: account.accountId }
    });

    let accountDeactivated = false;
    if (remainingFacts === 0) {
      await prismaStar.dimAccount.update({
        where: { accountId: account.accountId },
        data: { isActive: false }
      });
      accountDeactivated = true;
    }

    res.json({
      accountCode: account.accountCode,
      factsDeleted: result.count,
      accountDeactivated
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/v2/subscriptions/:accountCode:', error);
    res.status(500).json({ error: 'Error al eliminar suscripción' });
  }
});

/**
 * POST /api/v2/subscriptions/:accountCode/actuals
 * 
 * Registra gasto real (ACTUAL) para un mes específico
 */
router.post('/:accountCode/actuals', async (req: Request, res: Response) => {
  try {
    const { accountCode } = req.params;
    const { year, month, amount }: ActualRequest = req.body;

    // Validaciones
    if (!year || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year inválido (2000-2100)' });
    }

    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'month inválido (1-12)' });
    }

    if (!amount || amount < 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ error: 'amount debe ser entero >= 0' });
    }

    // Obtener cuenta
    const account = await prismaStar.dimAccount.findUnique({
      where: { accountCode: accountCode.toUpperCase() }
    });

    if (!account || !account.isBaseMember) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Resolver scenario ACTUAL
    const actualScenario = await prismaStar.dimScenario.findUnique({
      where: { scenarioCode: 'ACTUAL' }
    });

    if (!actualScenario) {
      return res.status(500).json({ error: 'Escenario ACTUAL no encontrado' });
    }

    // Resolver time
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    const timeEntry = await prismaStar.dimTime.findUnique({
      where: { yearMonth }
    });

    if (!timeEntry) {
      return res.status(404).json({ error: `Mes ${yearMonth} no encontrado en dim_time` });
    }

    // Upsert fact
    const existingFact = await prismaStar.factFinancial.findFirst({
      where: {
        scenarioId: actualScenario.scenarioId,
        timeId: timeEntry.timeId,
        accountBaseId: account.accountId
      }
    });

    let fact;
    if (existingFact) {
      fact = await prismaStar.factFinancial.update({
        where: { factId: existingFact.factId },
        data: { amountClp: amount }
      });
    } else {
      fact = await prismaStar.factFinancial.create({
        data: {
          scenarioId: actualScenario.scenarioId,
          timeId: timeEntry.timeId,
          accountBaseId: account.accountId,
          amountClp: amount,
          source: 'manual'
        }
      });
    }

    res.json({
      fact: {
        factId: fact.factId,
        accountCode: account.accountCode,
        year,
        month,
        amountClp: fact.amountClp,
        scenario: 'ACTUAL'
      }
    });
  } catch (error: any) {
    console.error('Error en POST /api/v2/subscriptions/:accountCode/actuals:', error);
    res.status(500).json({ error: 'Error al registrar gasto real' });
  }
});

export default router;
