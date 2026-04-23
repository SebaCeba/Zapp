/**
 * Utilidades para cálculo de periodicidad de suscripciones
 * 
 * Este módulo contiene la lógica para determinar en qué meses del año
 * una suscripción tiene cargo, basándose en su periodicidad y fecha de inicio.
 */

export type Periodicity = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

interface SubscriptionWithPeriodicity {
  startDate: string; // ISO date string
  periodicity: string;
  price: number;
}

/**
 * Calcula los meses (1-12) en los que una suscripción tiene cargo para un año dado
 * 
 * Reglas de periodicidad:
 * - monthly: Todos los meses (12 cargos)
 * - quarterly: Cada 3 meses desde startDate (4 cargos)
 * - semiannual: Cada 6 meses desde startDate (2 cargos)
 * - annual: Solo en el mes de startDate (1 cargo)
 * - weekly: Convertimos a mensual (aproximación: 52 semanas / 12 meses ≈ 4.33 semanas por mes)
 * 
 * @param startDate - Fecha de inicio en formato ISO (YYYY-MM-DD)
 * @param periodicity - Tipo de periodicidad
 * @param year - Año para el cual calcular
 * @returns Array de números de mes (1-12) donde aplica el cargo
 */
export function getActiveMonths(
  startDate: string,
  periodicity: string,
  year: number
): number[] {
  const start = new Date(startDate);
  const startMonth = start.getMonth() + 1; // 1-12
  const startYear = start.getFullYear();

  // Si la suscripción empieza después del año solicitado, no tiene cargos
  if (startYear > year) {
    return [];
  }

  switch (periodicity.toLowerCase()) {
    case 'monthly':
      // Si empieza en el año solicitado, desde el mes de inicio hasta diciembre
      if (startYear === year) {
        return Array.from({ length: 13 - startMonth }, (_, i) => startMonth + i);
      }
      // Si empezó antes, todos los meses
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    case 'quarterly':
      return getQuarterlyMonths(startMonth, startYear, year);

    case 'semiannual':
      return getSemiannualMonths(startMonth, startYear, year);

    case 'annual':
      // Solo si empezó en o antes del año solicitado
      if (startYear <= year) {
        return [startMonth];
      }
      return [];

    case 'weekly':
      // Aproximación: asumimos 4 semanas por mes, cobramos mensualmente
      // Esta es una simplificación; semanal es complejo de modelar mensualmente
      if (startYear === year) {
        return Array.from({ length: 13 - startMonth }, (_, i) => startMonth + i);
      }
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    default:
      // Si no reconocemos la periodicidad, asumimos mensual
      console.warn(`Periodicidad desconocida: ${periodicity}, asumiendo monthly`);
      if (startYear === year) {
        return Array.from({ length: 13 - startMonth }, (_, i) => startMonth + i);
      }
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }
}

/**
 * Calcula meses activos para periodicidad trimestral
 */
function getQuarterlyMonths(startMonth: number, startYear: number, targetYear: number): number[] {
  const activeMonths: number[] = [];
  
  // Calcular cuántos trimestres han pasado desde el inicio hasta el año objetivo
  const monthsFromStart = (targetYear - startYear) * 12;
  
  for (let offset = 0; offset < 12; offset += 3) {
    const candidateMonth = ((startMonth - 1 + offset) % 12) + 1;
    const candidateMonthAbsolute = monthsFromStart + offset;
    
    // Solo incluir si es múltiplo de 3 desde el inicio
    if (candidateMonthAbsolute % 3 === 0) {
      activeMonths.push(candidateMonth);
    }
  }
  
  // Filtrar solo meses válidos (1-12) y eliminar duplicados
  return [...new Set(activeMonths.filter(m => m >= 1 && m <= 12))].sort((a, b) => a - b);
}

/**
 * Calcula meses activos para periodicidad semestral
 */
function getSemiannualMonths(startMonth: number, startYear: number, targetYear: number): number[] {
  const activeMonths: number[] = [];
  
  // Calcular cuántos meses han pasado desde el inicio hasta el año objetivo
  const monthsFromStart = (targetYear - startYear) * 12;
  
  for (let offset = 0; offset < 12; offset += 6) {
    const candidateMonth = ((startMonth - 1 + offset) % 12) + 1;
    const candidateMonthAbsolute = monthsFromStart + offset;
    
    // Solo incluir si es múltiplo de 6 desde el inicio
    if (candidateMonthAbsolute % 6 === 0) {
      activeMonths.push(candidateMonth);
    }
  }
  
  return [...new Set(activeMonths.filter(m => m >= 1 && m <= 12))].sort((a, b) => a - b);
}

/**
 * Calcula el gasto total anual de una suscripción
 * 
 * @param subscription - Suscripción con startDate, periodicity, price
 * @param year - Año para calcular
 * @returns Monto total del año
 */
export function calculateAnnualCost(
  subscription: SubscriptionWithPeriodicity,
  year: number
): number {
  const activeMonths = getActiveMonths(subscription.startDate, subscription.periodicity, year);
  return subscription.price * activeMonths.length;
}

/**
 * Calcula el gasto mensual agregado de múltiples suscripciones para un año dado
 * 
 * @param subscriptions - Array de suscripciones
 * @param year - Año para calcular
 * @returns Array de 12 números (gasto por mes, indexado 0-11 para ENE-DIC)
 */
export function calculateMonthlyTotals(
  subscriptions: SubscriptionWithPeriodicity[],
  year: number
): number[] {
  const monthlyTotals = Array(12).fill(0);
  
  subscriptions.forEach(sub => {
    const activeMonths = getActiveMonths(sub.startDate, sub.periodicity, year);
    activeMonths.forEach(month => {
      monthlyTotals[month - 1] += sub.price; // month es 1-12, array es 0-11
    });
  });
  
  return monthlyTotals;
}

/**
 * Verifica si una suscripción tiene cargo en un mes específico
 * 
 * @param subscription - Suscripción con startDate, periodicity
 * @param year - Año
 * @param month - Mes (1-12)
 * @returns true si la suscripción tiene cargo ese mes
 */
export function isActiveInMonth(
  subscription: SubscriptionWithPeriodicity,
  year: number,
  month: number
): boolean {
  const activeMonths = getActiveMonths(subscription.startDate, subscription.periodicity, year);
  return activeMonths.includes(month);
}
