/**
 * Helpers para Queries Dimensionales
 * 
 * Funciones utilitarias para consultar el modelo dimensional estrella
 * de manera eficiente y consistente.
 */

import prismaStar from '../db-star';
import type {
  ScenarioCode,
  AccountType,
  FactFilter,
  TimeFilter,
  AccountFilter,
  FactWithDimensions,
  TimeAggregation,
  AccountAggregation,
  BudgetVsActualComparison,
  AccountHierarchyNode,
  toFactWithDimensions
} from '../types/dimensional';

// ===================================================================
// HELPERS DE FILTRADO
// ===================================================================

/**
 * Construye filtro Prisma para dim_time basado en TimeFilter
 */
export function buildTimeFilter(filter?: TimeFilter) {
  if (!filter) return {};

  const where: any = {};

  if (filter.year !== undefined) {
    where.year = filter.year;
  }

  if (filter.month !== undefined) {
    where.month = filter.month;
  }

  if (filter.yearMonth) {
    where.year_month_str = filter.yearMonth;
  }

  if (filter.startYear !== undefined || filter.endYear !== undefined) {
    where.year = {
      ...(filter.startYear !== undefined && { gte: filter.startYear }),
      ...(filter.endYear !== undefined && { lte: filter.endYear })
    };
  }

  return where;
}

/**
 * Construye filtro Prisma para dim_account basado en AccountFilter
 */
export function buildAccountFilter(filter?: AccountFilter) {
  if (!filter) return {};

  const where: any = {};

  if (filter.accountId !== undefined) {
    where.accountId = filter.accountId;
  }

  if (filter.accountCode) {
    where.accountCode = filter.accountCode;
  }

  if (filter.accountCodePrefix) {
    where.accountCode = {
      startsWith: filter.accountCodePrefix
    };
  }

  if (filter.hierarchyLevel !== undefined) {
    where.level = filter.hierarchyLevel;
  }

  if (filter.parentId !== undefined) {
    where.parentId = filter.parentId;
  }

  if (filter.accountType) {
    where.accountType = filter.accountType;
  }

  if (filter.isBaseMember !== undefined) {
    where.isBaseMember = filter.isBaseMember;
  }

  return where;
}

// ===================================================================
// QUERIES DE HECHOS
// ===================================================================

/**
 * Obtiene hechos financieros con filtros dimensionales
 */
export async function getFacts(filter: FactFilter = {}) {
  const where: any = {};

  // Filtro de escenario
  if (filter.scenario) {
    where.scenario = {
      scenarioCode: filter.scenario
    };
  }

  // Filtro de tiempo
  if (filter.time) {
    where.time = buildTimeFilter(filter.time);
  }

  // Filtro de cuenta
  if (filter.account) {
    where.account = buildAccountFilter(filter.account);
  }

  // Filtro de montos
  if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
    where.amountClp = {
      ...(filter.minAmount !== undefined && { gte: filter.minAmount }),
      ...(filter.maxAmount !== undefined && { lte: filter.maxAmount })
    };
  }

  const facts = await prismaStar.factFinancial.findMany({
    where,
    include: {
      scenario: true,
      time: true,
      account: {
        include: {
          parent: true
        }
      }
    },
    orderBy: [
      { time: { year: 'asc' } },
      { time: { month: 'asc' } },
      { account: { accountCode: 'asc' } }
    ]
  });

  return facts;
}

/**
 * Obtiene un hecho específico por ID
 */
export async function getFactById(factId: number) {
  return prismaStar.factFinancial.findUnique({
    where: { factId: factId },
    include: {
      scenario: true,
      time: true,
      account: {
        include: {
          parent: true
        }
      }
    }
  });
}

// ===================================================================
// QUERIES DE TOTALES
// ===================================================================

/**
 * Obtiene total por escenario
 */
export async function getTotalByScenario(
  scenario: ScenarioCode,
  year?: number,
  month?: number
) {
  const where: any = {
    scenario: { scenarioCode: scenario }
  };

  if (year !== undefined) {
    where.time = { year };
    if (month !== undefined) {
      where.time.month = month;
    }
  }

  const result = await prismaStar.factFinancial.aggregate({
    where,
    _sum: {
      amountClp: true
    },
    _count: true
  });

  return {
    totalClp: result._sum.amountClp || 0,
    totalUsd: 0,
    count: result._count
  };
}

/**
 * Obtiene totales agrupados por mes
 */
export async function getTotalsByMonth(
  scenario: ScenarioCode,
  year: number
): Promise<TimeAggregation[]> {
  const facts = await prismaStar.factFinancial.groupBy({
    by: ['timeId'],
    where: {
      scenario: { scenarioCode: scenario },
      time: { year }
    },
    _sum: {
      amountClp: true
    },
    _count: true
  });

  // Enriquecer con datos de dim_time
  const timeIds = facts.map(f => f.timeId);
  const timeRecords = await prismaStar.dimTime.findMany({
    where: {
      timeId: {
        in: timeIds
      }
    }
  });

  const timeMap = new Map(timeRecords.map(t => [t.timeId, t]));

  return facts.map(f => {
    const time = timeMap.get(f.timeId)!;
    return {
      year: time.year,
      month: time.month,
      yearMonth: time.yearMonth,
      totalClp: f._sum.amountClp || 0,
      totalUsd: 0,
      count: f._count
    };
  }).sort((a, b) => a.month - b.month);
}

/**
 * Obtiene totales agrupados por cuenta
 */
export async function getTotalsByAccount(
  scenario: ScenarioCode,
  year: number,
  month?: number,
  accountPrefix?: string
): Promise<AccountAggregation[]> {
  const where: any = {
    scenario: { scenarioCode: scenario },
    time: { year }
  };

  if (month !== undefined) {
    where.time.month = month;
  }

  if (accountPrefix) {
    where.account = {
      accountCode: { startsWith: accountPrefix }
    };
  }

  const facts = await prismaStar.factFinancial.groupBy({
    by: ['accountBaseId'],
    where,
    _sum: {
      amountClp: true
    },
    _count: true
  });

  // Enriquecer con datos de dim_account
  const accountIds = facts.map(f => f.accountBaseId);
  const accountRecords = await prismaStar.dimAccount.findMany({
    where: {
      accountId: {
        in: accountIds
      }
    }
  });

  const accountMap = new Map(accountRecords.map(a => [a.accountId, a]));

  return facts.map(f => {
    const account = accountMap.get(f.accountBaseId)!;
    return {
      accountId: account.accountId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: (account.accountType || 'NEUTRAL') as AccountType,
      totalClp: f._sum.amountClp || 0,
      totalUsd: 0,
      count: f._count
    };
  }).sort((a, b) => b.totalClp - a.totalClp);
}

// ===================================================================
// COMPARACIONES PRESUPUESTO VS ACTUAL
// ===================================================================

/**
 * Compara presupuesto vs actual para un período
 */
export async function compareBudgetVsActual(
  year: number,
  month?: number,
  accountPrefix?: string
): Promise<BudgetVsActualComparison[]> {
  const where: any = {
    time: { year }
  };

  if (month !== undefined) {
    where.time.month = month;
  }

  if (accountPrefix) {
    where.account = {
      accountCode: { startsWith: accountPrefix }
    };
  }

  // Obtener presupuesto
  const budgetFacts = await prismaStar.factFinancial.findMany({
    where: {
      ...where,
      scenario: { scenarioCode: 'BUDGET' }
    },
    include: {
      time: true,
      account: true
    }
  });

  // Obtener actual
  const actualFacts = await prismaStar.factFinancial.findMany({
    where: {
      ...where,
      scenario: { scenarioCode: 'ACTUAL' }
    },
    include: {
      time: true,
      account: true
    }
  });

  // Crear mapa de actual por clave
  const actualMap = new Map<string, number>();
  actualFacts.forEach(f => {
    const key = `${f.time.yearMonth}_${f.account.accountCode}`;
    actualMap.set(key, f.amountClp);
  });

  // Generar comparaciones
  const comparisons: BudgetVsActualComparison[] = budgetFacts.map(budget => {
    const key = `${budget.time.yearMonth}_${budget.account.accountCode}`;
    const actualClp = actualMap.get(key) || 0;
    const varianceClp = actualClp - budget.amountClp;
    const variancePercent = budget.amountClp === 0 
      ? (actualClp === 0 ? 0 : 100)
      : (varianceClp / budget.amountClp) * 100;

    let status: 'OVER_BUDGET' | 'UNDER_BUDGET' | 'ON_TARGET';
    if (Math.abs(variancePercent) <= 5) {
      status = 'ON_TARGET';
    } else {
      status = varianceClp > 0 ? 'OVER_BUDGET' : 'UNDER_BUDGET';
    }

    return {
      year: budget.time.year,
      month: budget.time.month,
      yearMonth: budget.time.yearMonth,
      accountCode: budget.account.accountCode,
      accountName: budget.account.accountName,
      budgetClp: budget.amountClp,
      actualClp,
      varianceClp,
      variancePercent,
      status
    };
  });

  return comparisons.sort((a, b) => Math.abs(b.varianceClp) - Math.abs(a.varianceClp));
}

// ===================================================================
// JERARQUÍAS DE CUENTAS
// ===================================================================

/**
 * Obtiene jerarquía de cuentas con totales
 */
export async function getAccountHierarchyWithTotals(
  scenario: ScenarioCode,
  year: number,
  month?: number,
  rootAccountId?: number
): Promise<AccountHierarchyNode[]> {
  // Obtener todas las cuentas
  const accounts = await prismaStar.dimAccount.findMany({
    where: rootAccountId !== undefined ? {
      OR: [
        { accountId: rootAccountId },
        { parentId: rootAccountId }
      ]
    } : {},
    orderBy: [
      { level: 'asc' },
      { accountCode: 'asc' }
    ]
  });

  // Obtener totales por cuenta
  const totals = await getTotalsByAccount(scenario, year, month);
  const totalsMap = new Map(totals.map(t => [t.accountId, t]));

  // Construir jerarquía
  function buildNode(account: any): AccountHierarchyNode {
    const total = totalsMap.get(account.accountId);
    const children = accounts
      .filter(a => a.parentId === account.accountId)
      .map(buildNode);

    return {
      accountId: account.accountId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      accountType: (account.accountType || 'NEUTRAL') as AccountType,
      hierarchyLevel: account.level,
      isBaseMember: account.isBaseMember,
      totalClp: total?.totalClp || 0,
      count: total?.count || 0,
      children
    };
  }

  const rootAccounts = accounts.filter(a => 
    rootAccountId !== undefined 
      ? a.accountId === rootAccountId
      : a.parentId === null
  );

  return rootAccounts.map(buildNode);
}

// ===================================================================
// HELPERS DE RESOLUCIÓN
// ===================================================================

/**
 * Resuelve account_id desde account_code
 */
export async function resolveAccountId(accountCode: string): Promise<number | null> {
  const account = await prismaStar.dimAccount.findFirst({
    where: { accountCode: accountCode }
  });
  return account?.accountId || null;
}

/**
 * Resuelve time_id desde year y month
 */
export async function resolveTimeId(year: number, month: number): Promise<number | null> {
  const time = await prismaStar.dimTime.findFirst({
    where: { year, month }
  });
  return time?.timeId || null;
}

/**
 * Resuelve scenario_id desde scenario_code
 */
export async function resolveScenarioId(scenarioCode: ScenarioCode): Promise<number | null> {
  const scenario = await prismaStar.dimScenario.findFirst({
    where: { scenarioCode: scenarioCode }
  });
  return scenario?.scenarioId || null;
}
