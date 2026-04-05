import { PrismaClient } from '@prisma/client-star';

/**
 * Cliente Prisma para el modelo dimensional estrella
 * 
 * Este cliente se conecta a la base de datos dev_star.db que contiene:
 * - dim_scenario: 2 escenarios (BUDGET, ACTUAL)
 * - dim_time: 132 períodos mensuales (2020-2030)
 * - dim_account: 72 nodos jerárquicos (10 estructura + 62 base members)
 * - fact_financial: 288 hechos financieros (208 BUDGET + 80 ACTUAL)
 * 
 * USO:
 * ```ts
 * import prismaStar from './db-star';
 * 
 * const budgetData = await prismaStar.factFinancial.findMany({
 *   where: {
 *     scenario: { scenario_code: 'BUDGET' },
 *     time: { year: 2026 }
 *   },
 *   include: {
 *     scenario: true,
 *     time: true,
 *     account: true
 *   }
 * });
 * ```
 */
const prismaStar = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_STAR || 'file:./prisma/dev_star.db'
    }
  }
});

export default prismaStar;
