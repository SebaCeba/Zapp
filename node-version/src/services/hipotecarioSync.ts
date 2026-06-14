/**
 * Servicio de Sincronización: Hipotecario → fact_financial
 * 
 * Sincroniza datos de MortgagePayment y MortgageInsurance hacia la tabla FACT
 * para que aparezcan en la vista resumen de presupuesto.
 * 
 * Estrategia:
 * - Borra todos los facts con source='hipotecario' para el año proyectado
 * - Regenera facts mes a mes para dividendo + seguros
 * - Es idempotente: puede ejecutarse múltiples veces sin duplicar
 */

import prisma from '../db';
import prismaStar from '../db-star';

interface SyncResult {
  success: boolean;
  year: number;
  factsCreated: number;
  factsDeleted: number;
  errors: string[];
}

/**
 * Calcula valor UF proyectado para un mes específico
 * 
 * IMPORTANTE: Esta función debe coincidir exactamente con la usada en Hipotecario.tsx
 * para garantizar que los valores en FACT coincidan con los mostrados en la página.
 * 
 * Usa variación SIMPLE mensual (no compuesta): variaciónAnual / 12
 * Ejemplo: Si variación anual es 5%, la mensual es 5/12 = 0.4167%
 * 
 * @param year - Año a calcular
 * @param month - Mes (1-12) a calcular
 * @param ufBase - Valor UF base para enero del año base
 * @param ufVariation - Variación anual en % (ej: 5 para 5%)
 * @param baseYear - Año base de referencia
 * @returns Valor UF proyectado para ese mes específico
 */
function calcularUfParaMes(
  year: number,
  month: number,
  ufBase: number,
  ufVariation: number,
  baseYear: number
): number {
  // Validar inputs
  if (!ufBase || isNaN(ufBase) || ufBase <= 0) {
    throw new Error(`ufBase inválido: ${ufBase}`);
  }
  if (isNaN(ufVariation)) {
    throw new Error(`ufVariation inválido: ${ufVariation}`);
  }
  
  // Calcular meses transcurridos desde enero del año base
  const mesesDesdeBase = (year - baseYear) * 12 + (month - 1);
  
  // Aplicar variación SIMPLE mensual
  const variacionMensual = ufVariation / 12 / 100;
  
  return ufBase * Math.pow(1 + variacionMensual, mesesDesdeBase);
}

/**
 * Sincroniza datos hipotecarios hacia fact_financial
 * 
 * @param year - Año a sincronizar (opcional, usa año proyectado de config si no se especifica)
 * @returns Resultado de la sincronización
 */
export async function syncHipotecarioToFact(year?: number): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    year: year || new Date().getFullYear(),
    factsCreated: 0,
    factsDeleted: 0,
    errors: []
  };

  try {
    // 1. Obtener año proyectado desde config si no se especificó
    if (!year) {
      const config = await prisma.mortgageBudgetConfig.findFirst();
      if (config) {
        result.year = config.anioProyectado;
      }
    }

    console.log(`[HipotecarioSync] Sincronizando año ${result.year}...`);

    // 2. Obtener supuestos anuales (UF)
    const supuesto = await prisma.supuestoAnual.findFirst({
      where: { anio: result.year }
    });

    if (!supuesto) {
      result.errors.push(`No se encontraron supuestos anuales para ${result.year}`);
      console.log(`[HipotecarioSync] ⚠️ ${result.errors[0]}`);
      return result;
    }

    const ufBase = supuesto.valorUfBase;
    const ufVariation = supuesto.variacionAnualUf;

    // 3. Obtener escenario BUDGET
    const budgetScenario = await prismaStar.dimScenario.findUnique({
      where: { scenarioCode: 'BUDGET' }
    });

    if (!budgetScenario) {
      result.errors.push('Escenario BUDGET no encontrado en dim_scenario');
      console.log(`[HipotecarioSync] ❌ ${result.errors[0]}`);
      return result;
    }

    // 4. Obtener cuenta padre GAS.HIP
    const parentAccount = await prismaStar.dimAccount.findUnique({
      where: { accountCode: 'GAS.HIP' }
    });

    if (!parentAccount) {
      result.errors.push('Cuenta padre GAS.HIP no encontrada');
      console.log(`[HipotecarioSync] ❌ ${result.errors[0]}`);
      return result;
    }

    // 5. Obtener cuenta dividendo
    const cuentaDividendo = await prismaStar.dimAccount.findUnique({
      where: { accountCode: 'GAS.HIP.DIV' }
    });

    if (!cuentaDividendo) {
      result.errors.push('Cuenta GAS.HIP.DIV no encontrada');
      console.log(`[HipotecarioSync] ❌ ${result.errors[0]}`);
      return result;
    }

    // 6. Borrar facts existentes del año con source='hipotecario'
    const deleted = await prismaStar.factFinancial.deleteMany({
      where: {
        source: 'hipotecario',
        scenarioId: budgetScenario.scenarioId,
        time: { year: result.year }
      }
    });

    result.factsDeleted = deleted.count;
    console.log(`[HipotecarioSync] 🗑️  ${result.factsDeleted} facts anteriores eliminados`);

    // 7. Cargar cuotas hipotecarias del año
    const payments = await prisma.mortgagePayment.findMany({
      orderBy: { numDiv: 'asc' }
    });

    const cuotasDelAnio = payments.filter(p => {
      const fecha = new Date(p.fechaVencimiento);
      return fecha.getFullYear() === result.year;
    });

    console.log(`[HipotecarioSync] 📋 ${cuotasDelAnio.length} cuotas encontradas para ${result.year}`);

    // 8. Cargar seguros del año
    const seguros = await prisma.mortgageInsurance.findMany({
      where: {
        mesAnio: { startsWith: `${result.year}-` }
      },
      orderBy: { mesAnio: 'asc' }
    });

    console.log(`[HipotecarioSync] 🛡️  ${seguros.length} registros de seguros encontrados`);

    // 9. Generar facts para cada mes (1-12)
    for (let month = 1; month <= 12; month++) {
      const mesAnio = `${result.year}-${String(month).padStart(2, '0')}`;
      
      // 9.1 Obtener time_id
      const timeEntry = await prismaStar.dimTime.findUnique({
        where: { yearMonth: mesAnio }
      });

      if (!timeEntry) {
        console.log(`[HipotecarioSync] ⚠️  Mes ${mesAnio} no encontrado en dim_time`);
        continue;
      }

      // 9.2 Procesar dividendo (si existe cuota ese mes)
      const cuotaMes = cuotasDelAnio.find(c => {
        const fecha = new Date(c.fechaVencimiento);
        return fecha.getMonth() + 1 === month;
      });

      if (cuotaMes) {
        const ufMes = calcularUfParaMes(result.year, month, ufBase, ufVariation, result.year);
        const cuotaClp = cuotaMes.totalDivUf * ufMes;  // SIN redondear

        await prismaStar.factFinancial.create({
          data: {
            scenarioId: budgetScenario.scenarioId,
            timeId: timeEntry.timeId,
            accountBaseId: cuentaDividendo.accountId,
            amountClp: cuotaClp,  // Guardar sin redondear
            source: 'hipotecario'
          }
        });

        result.factsCreated++;
        console.log(`[HipotecarioSync] ✅ Dividendo ${mesAnio}: $${Math.round(cuotaClp).toLocaleString()}`);
      }

      // 9.3 Procesar seguros del mes
      const segurosMes = seguros.filter(s => s.mesAnio === mesAnio);
      
      // Agrupar seguros por nombre (evitar duplicados)
      const segurosUnicos = new Map<string, { monto: number; moneda: string }>();
      
      for (const seguro of segurosMes) {
        const existing = segurosUnicos.get(seguro.nombre);
        if (!existing) {
          segurosUnicos.set(seguro.nombre, {
            monto: seguro.monto,
            moneda: seguro.moneda
          });
        }
      }

      // Crear facts para cada seguro único
      for (const [nombreSeguro, datos] of segurosUnicos) {
        // Buscar o crear cuenta para este seguro
        let cuentaSeguro = await prismaStar.dimAccount.findFirst({
          where: {
            accountName: nombreSeguro,
            parentId: parentAccount.accountId,
            isBaseMember: true
          }
        });

        if (!cuentaSeguro) {
          // Generar código único para seguro
          const existingCount = await prismaStar.dimAccount.count({
            where: { 
              accountCode: { startsWith: 'GAS.HIP.SEG.' }
            }
          });

          const newCode = `GAS.HIP.SEG.${String(existingCount + 1).padStart(3, '0')}`;

          cuentaSeguro = await prismaStar.dimAccount.create({
            data: {
              accountCode: newCode,
              accountName: nombreSeguro,
              parentId: parentAccount.accountId,
              level: 3,
              isBaseMember: true,
              accountType: 'GASTO',
              sortOrder: 0,
              isActive: true
            }
          });

          console.log(`[HipotecarioSync] 📝 Cuenta creada: ${newCode} (${nombreSeguro})`);
        }

        // Calcular monto en CLP
        let montoClp = datos.monto;
        if (datos.moneda === 'UF') {
          const ufMes = calcularUfParaMes(result.year, month, ufBase, ufVariation, result.year);
          montoClp = datos.monto * ufMes;  // SIN redondear
        }
        // Si ya está en CLP, usarlo tal cual (sin redondear)

        await prismaStar.factFinancial.create({
          data: {
            scenarioId: budgetScenario.scenarioId,
            timeId: timeEntry.timeId,
            accountBaseId: cuentaSeguro.accountId,
            amountClp: montoClp,  // Guardar sin redondear
            source: 'hipotecario'
          }
        });

        result.factsCreated++;
        console.log(`[HipotecarioSync] ✅ Seguro ${mesAnio} (${nombreSeguro}): $${Math.round(montoClp).toLocaleString()}`);
      }
    }

    result.success = true;
    console.log(`[HipotecarioSync] ✅ Sincronización completada: ${result.factsCreated} facts creados`);

  } catch (error: any) {
    result.errors.push(error.message || 'Error desconocido');
    console.error('[HipotecarioSync] ❌ Error:', error);
  }

  return result;
}
