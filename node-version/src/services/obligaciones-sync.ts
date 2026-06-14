/**
 * Servicio de sincronización: Obligaciones → fact_financial (estrella)
 *
 * Cada vez que se crea o elimina una obligación en la tabla legacy `obligaciones`,
 * este servicio refleja los cambios en el modelo dimensional:
 *
 * - dim_account: crea/elimina la cuenta GAS.OBL.<id> para cada obligación
 * - fact_financial (BUDGET): inserta/elimina un hecho por cada mes de cuota
 *
 * Convención de código: GAS.OBL.<id> (usa el id de la tabla legacy como sufijo
 * para garantizar estabilidad y trazabilidad).
 */

import prisma from '../db';
import prismaStar from '../db-star';

// Años para los que se proyectan los hechos en fact_financial
const TARGET_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

interface ObligacionData {
  id: number;
  nombre: string;
  tipo: string;
  moneda: string;
  montoCuota: number;
  cuotasTotales: number;
  mesInicio: number;
  anioInicio: number;
}

/** Código dim_account para una obligación */
function accountCode(obligacionId: number): string {
  return `GAS.OBL.${String(obligacionId).padStart(3, '0')}`;
}

/**
 * Calcula el monto en CLP de una cuota dado el supuesto UF del año.
 * Si la moneda es CLP devuelve el monto directamente.
 */
async function cuotaClp(obl: ObligacionData, year: number): Promise<number> {
  if (obl.moneda === 'CLP') return Math.round(obl.montoCuota);

  // UF: buscar el supuesto del año, fallback 37000
  const supuesto = await prisma.supuestoAnual.findUnique({ where: { anio: year } });
  const uf = supuesto?.valorUfBase ?? 37000;
  return Math.round(obl.montoCuota * uf);
}

/**
 * Inserta en fact_financial todos los hechos BUDGET para una obligación.
 * Itera mes a mes desde (mesInicio, anioInicio) por cuotasTotales meses
 * y crea un hecho por cada mes que caiga en TARGET_YEARS.
 */
export async function syncObligacionToFact(obl: ObligacionData): Promise<void> {
  const code = accountCode(obl.id);

  // 1. Cuenta padre GAS.OBL
  const parent = await prismaStar.dimAccount.findUnique({ where: { accountCode: 'GAS.OBL' } });
  if (!parent) throw new Error('Cuenta padre GAS.OBL no encontrada en dim_account');

  // 2. Upsert dim_account para esta obligación
  const existing = await prismaStar.dimAccount.findUnique({ where: { accountCode: code } });
  const account = existing
    ? await prismaStar.dimAccount.update({
        where: { accountCode: code },
        data: { accountName: obl.nombre, isActive: true },
      })
    : await prismaStar.dimAccount.create({
        data: {
          accountCode: code,
          accountName: obl.nombre,
          parentId: parent.accountId,
          level: 3,
          isBaseMember: true,
          accountType: 'GASTO',
          sortOrder: obl.id,
          isActive: true,
        },
      });

  // 3. Escenario BUDGET
  const scenario = await prismaStar.dimScenario.findUnique({ where: { scenarioCode: 'BUDGET' } });
  if (!scenario) throw new Error('Escenario BUDGET no encontrado en dim_scenario');

  // 4. Borrar hechos BUDGET anteriores para esta cuenta (para re-sincronizar limpio)
  await prismaStar.factFinancial.deleteMany({
    where: { accountBaseId: account.accountId, scenarioId: scenario.scenarioId },
  });

  // 5. Calcular y crear hechos para cada cuota
  let y = obl.anioInicio;
  let m = obl.mesInicio;

  for (let i = 0; i < obl.cuotasTotales; i++) {
    if (TARGET_YEARS.includes(y)) {
      const yearMonth = `${y}-${String(m).padStart(2, '0')}`;
      const timeEntry = await prismaStar.dimTime.findUnique({ where: { yearMonth } });

      if (timeEntry) {
        const amountClp = await cuotaClp(obl, y);
        await prismaStar.factFinancial.upsert({
          where: {
            unique_fact: {
              timeId: timeEntry.timeId,
              scenarioId: scenario.scenarioId,
              accountBaseId: account.accountId,
            },
          },
          update: { amountClp, source: 'calculated' },
          create: {
            timeId: timeEntry.timeId,
            scenarioId: scenario.scenarioId,
            accountBaseId: account.accountId,
            amountClp,
            source: 'calculated',
          },
        });
      }
    }

    // Avanzar al siguiente mes
    m++;
    if (m > 12) { m = 1; y++; }
    if (y > Math.max(...TARGET_YEARS)) break;
  }
}

/**
 * Elimina de fact_financial y dim_account todos los registros
 * de una obligación.
 */
export async function removeObligacionFromFact(obligacionId: number): Promise<void> {
  const code = accountCode(obligacionId);

  const account = await prismaStar.dimAccount.findUnique({ where: { accountCode: code } });
  if (!account) return; // Ya no existe, nada que hacer

  const scenario = await prismaStar.dimScenario.findUnique({ where: { scenarioCode: 'BUDGET' } });
  if (scenario) {
    await prismaStar.factFinancial.deleteMany({
      where: { accountBaseId: account.accountId, scenarioId: scenario.scenarioId },
    });
  }

  // Marcar como inactiva en lugar de eliminar físicamente para preservar integridad referencial
  await prismaStar.dimAccount.update({
    where: { accountCode: code },
    data: { isActive: false },
  });
}

/**
 * Re-sincroniza TODAS las obligaciones existentes en la tabla legacy
 * con fact_financial. Útil para la migración inicial.
 */
export async function syncAllObligaciones(): Promise<void> {
  const obligaciones = await prisma.obligacion.findMany();
  for (const obl of obligaciones) {
    await syncObligacionToFact(obl);
  }
  console.log(`[obligaciones-sync] Sincronizadas ${obligaciones.length} obligaciones.`);
}
