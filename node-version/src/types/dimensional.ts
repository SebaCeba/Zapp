/**
 * Tipos TypeScript para el Modelo Dimensional Estrella
 * 
 * Estos tipos facilitan el trabajo con el modelo dimensional
 * y proporcionan intellisense mejorado.
 */

// ===================================================================
// CÓDIGOS DE DIMENSIONES
// ===================================================================

/**
 * Códigos válidos de escenarios
 */
export type ScenarioCode = 'BUDGET' | 'ACTUAL';

/**
 * Códigos de monedas soportadas
 */
export type CurrencyCode = 'CLP' | 'USD' | 'EUR';

/**
 * Tipos de cuenta según jerarquía
 */
export type AccountType = 'INGRESO' | 'GASTO' | 'AHORRO' | 'NEUTRAL';

// ===================================================================
// FILTROS DIMENSIONALES
// ===================================================================

/**
 * Filtro para período de tiempo
 */
export interface TimeFilter {
  year?: number;
  month?: number;
  yearMonth?: string; // Formato: "2026-01"
  startYear?: number;
  endYear?: number;
  startMonth?: number;
  endMonth?: number;
}

/**
 * Filtro para cuentas
 */
export interface AccountFilter {
  accountId?: number;
  accountCode?: string;
  accountCodePrefix?: string; // Ej: "GAS.SUS" filtra todas las suscripciones
  hierarchyLevel?: number;
  parentId?: number;
  accountType?: AccountType;
  isBaseMember?: boolean;
}

/**
 * Filtro completo para hechos financieros
 */
export interface FactFilter {
  scenario?: ScenarioCode;
  time?: TimeFilter;
  account?: AccountFilter;
  currency?: CurrencyCode;
  minAmount?: number;
  maxAmount?: number;
}

// ===================================================================
// RESPUESTAS DE QUERIES
// ===================================================================

/**
 * Hecho financiero con dimensiones completas (denormalizado)
 */
export interface FactWithDimensions {
  factId: number;
  
  // Dimensión temporal
  year: number;
  month: number;
  yearMonth: string;
  
  // Dimensión escenario
  scenarioCode: ScenarioCode;
  scenarioName: string;
  
  // Dimensión cuenta
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  hierarchyLevel: number;
  parentAccountCode?: string;
  
  // Métricas
  amountClp: number;
  amountUsd?: number;
  amountEur?: number;
  exchangeRateCLP_USD?: number;
  exchangeRateCLP_EUR?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Agregación por período
 */
export interface TimeAggregation {
  year: number;
  month?: number;
  yearMonth: string;
  totalClp: number;
  totalUsd?: number;
  count: number;
}

/**
 * Agregación por cuenta
 */
export interface AccountAggregation {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalClp: number;
  totalUsd?: number;
  count: number;
  children?: AccountAggregation[];
}

/**
 * Agregación por escenario
 */
export interface ScenarioAggregation {
  scenarioCode: ScenarioCode;
  scenarioName: string;
  totalClp: number;
  totalUsd?: number;
  count: number;
}

/**
 * Comparación presupuesto vs actual
 */
export interface BudgetVsActualComparison {
  year: number;
  month: number;
  yearMonth: string;
  accountCode: string;
  accountName: string;
  budgetClp: number;
  actualClp: number;
  varianceClp: number;
  variancePercent: number;
  status: 'OVER_BUDGET' | 'UNDER_BUDGET' | 'ON_TARGET';
}

/**
 * Jerarquía de cuenta con totales
 */
export interface AccountHierarchyNode {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  hierarchyLevel: number;
  isBaseMember: boolean;
  totalClp: number;
  count: number;
  children: AccountHierarchyNode[];
}

// ===================================================================
// REQUESTS DE API
// ===================================================================

/**
 * Request para obtener hechos financieros
 */
export interface GetFactsRequest {
  scenario?: ScenarioCode;
  year?: number;
  month?: number;
  accountCodePrefix?: string;
  limit?: number;
  offset?: number;
}

/**
 * Request para obtener totales agregados
 */
export interface GetTotalsRequest {
  scenario: ScenarioCode;
  year: number;
  month?: number;
  groupBy?: 'account' | 'month' | 'scenario';
}

/**
 * Request para comparación presupuesto vs actual
 */
export interface GetComparisonRequest {
  year: number;
  month?: number;
  accountCodePrefix?: string;
}

/**
 * Request para crear/actualizar hecho
 */
export interface UpsertFactRequest {
  scenario: ScenarioCode;
  year: number;
  month: number;
  accountCode: string; // Se resolverá a account_base_id
  amountClp: number;
  amountUsd?: number;
  exchangeRateCLP_USD?: number;
}

// ===================================================================
// RESPUESTAS DE API
// ===================================================================

/**
 * Respuesta paginada genérica
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Respuesta de error estándar
 */
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

// ===================================================================
// HELPERS DE TRANSFORMACIÓN
// ===================================================================

/**
 * Convierte fact_financial de Prisma a FactWithDimensions
 */
export function toFactWithDimensions(fact: any): FactWithDimensions {
  return {
    factId: fact.fact_id,
    
    year: fact.time.year,
    month: fact.time.month,
    yearMonth: fact.time.year_month_str,
    
    scenarioCode: fact.scenario.scenario_code as ScenarioCode,
    scenarioName: fact.scenario.scenario_name,
    
    accountId: fact.account.account_id,
    accountCode: fact.account.account_code,
    accountName: fact.account.account_name,
    accountType: (fact.account.account_type || 'NEUTRAL') as AccountType,
    hierarchyLevel: fact.account.hierarchy_level,
    parentAccountCode: fact.account.parent?.account_code,
    
    amountClp: fact.amount_clp,
    amountUsd: fact.amount_usd,
    amountEur: fact.amount_eur,
    exchangeRateCLP_USD: fact.exchange_rate_clp_usd,
    exchangeRateCLP_EUR: fact.exchange_rate_clp_eur,
    
    createdAt: fact.created_at,
    updatedAt: fact.updated_at
  };
}

/**
 * Formatea monto CLP a string con separadores de miles
 */
export function formatClp(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`;
}

/**
 * Calcula variación porcentual
 */
export function calculateVariance(budget: number, actual: number): number {
  if (budget === 0) return actual === 0 ? 0 : 100;
  return ((actual - budget) / budget) * 100;
}

/**
 * Determina estado de presupuesto
 */
export function getBudgetStatus(
  budgetClp: number, 
  actualClp: number, 
  tolerance: number = 5
): 'OVER_BUDGET' | 'UNDER_BUDGET' | 'ON_TARGET' {
  const variance = calculateVariance(budgetClp, actualClp);
  if (Math.abs(variance) <= tolerance) return 'ON_TARGET';
  return variance > 0 ? 'OVER_BUDGET' : 'UNDER_BUDGET';
}
