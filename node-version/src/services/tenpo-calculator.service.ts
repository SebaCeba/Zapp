import prisma from '../db';
import { tenpoConfigService } from './tenpo-config.service';
import { addMonths } from 'date-fns';

/**
 * Servicio para cálculos financieros de compras en cuotas
 */
export class TenpoCalculatorService {
  /**
   * Calcula cuota mensual usando sistema francés (anualidad)
   * Fórmula: cuota = C × i / (1 − (1 + i)^(-n))
   * 
   * @deprecated Usar calcularCuotasTenpoAddOnV1() para estimaciones Tenpo
   * Este método se mantiene por compatibilidad legacy
   */
  calcularCuotaFrancesa(capital: number, nCuotas: number, tasaMensual: number): number {
    if (nCuotas === 1) return capital;
    
    const i = tasaMensual;
    const n = nCuotas;
    
    const cuota = capital * i / (1 - Math.pow(1 + i, -n));
    
    return Math.round(cuota); // Redondear al peso
  }

  /**
   * Calcula cuota simple (sin interés)
   */
  calcularCuotaSimple(capital: number, nCuotas: number): number {
    return Math.round(capital / nCuotas);
  }

  /**
   * Calcula cuotas usando método TenpoAddOnV1 (interés simple add-on)
   * 
   * Fórmula (con fee integrado):
   * - Base financiada = financedBaseClp (capital + fee)
   * - interesTotal = round(base * tasaMensual * nCuotas)
   * - totalFinanciado = base + interesTotal
   * - cuotaBase = round(totalFinanciado / nCuotas)
   * - cuotas[0..n-2] = cuotaBase
   * - cuotas[n-1] = totalFinanciado - cuotaBase * (nCuotas - 1)
   * 
   * Este método refleja mejor el cálculo real usado por Tenpo vs Sistema Francés
   * 
   * @param financedBaseClp - Base financiada (capital + fee)
   * @param nCuotas - Número de cuotas
   * @param tasaMensual - Tasa mensual (ej: 0.0211 para 2.11%)
   * @returns Array de montos de cuotas con ajuste en última cuota
   */
  calcularCuotasTenpoAddOnV1(
    financedBaseClp: number,
    nCuotas: number,
    tasaMensual: number
  ): { cuotas: number[]; totalFinanciado: number; interesTotal: number } {
    // Caso especial: 1 cuota sin interés
    if (nCuotas === 1) {
      return {
        cuotas: [financedBaseClp],
        totalFinanciado: financedBaseClp,
        interesTotal: 0
      };
    }

    // Cálculo de interés simple (add-on) sobre la base financiada
    const interesTotal = Math.round(financedBaseClp * tasaMensual * nCuotas);
    const totalFinanciado = financedBaseClp + interesTotal;
    
    // Cuota base redondeada
    const cuotaBase = Math.round(totalFinanciado / nCuotas);
    
    // Generar array de cuotas (todas iguales inicialmente)
    const cuotas: number[] = new Array(nCuotas).fill(cuotaBase);
    
    // Ajustar última cuota para que la suma sea exacta
    const sumaActual = cuotaBase * (nCuotas - 1);
    cuotas[nCuotas - 1] = totalFinanciado - sumaActual;

    return {
      cuotas,
      totalFinanciado,
      interesTotal
    };
  }

  /**
   * Genera calendario de cuotas con ajuste en última cuota
   * para que la suma sea exactamente igual al total financiado
   * 
   * Usa TenpoAddOnV1 (interés simple) como método por defecto para estimaciones
   * Soporta fee: si feePct es provisto, calcula base financiada = capital + fee
   * 
   * NOTA: Esta función NO debe llamarse para compras en modo REAL.
   * Las compras REAL usan valores confirmados del banco, no cálculos estimados.
   */
  generarCalendarioCuotas(
    capital: number,
    nCuotas: number,
    fechaPrimeraCuota: Date,
    tieneInteres: boolean,
    tasaMensual: number,
    feePct?: number | null
  ): { cuotas: number[]; totalFinanciado: number; interesTotal: number; feeAmountClp: number } {
    
    // Calcular fee si aplica
    const feeAmountClp = (feePct !== null && feePct !== undefined) ? Math.round(capital * feePct) : 0;
    const financedBaseClp = capital + feeAmountClp;
    
    if (tieneInteres) {
      // Usar TenpoAddOnV1 (interés simple) sobre base financiada
      const result = this.calcularCuotasTenpoAddOnV1(financedBaseClp, nCuotas, tasaMensual);
      return {
        ...result,
        feeAmountClp
      };
    } else {
      // Sin interés: dividir base financiada entre cuotas
      const cuotaMensual = this.calcularCuotaSimple(financedBaseClp, nCuotas);
      const cuotas: number[] = new Array(nCuotas).fill(cuotaMensual);
      
      // Ajustar última cuota para suma exacta
      const sumaActual = cuotas.reduce((sum, c) => sum + c, 0);
      const diferencia = financedBaseClp - sumaActual;
      cuotas[nCuotas - 1] += diferencia;

      return {
        cuotas,
        totalFinanciado: financedBaseClp,
        interesTotal: 0,
        feeAmountClp
      };
    }
  }

  /**
   * Recalcula todas las cuotas de una compra según su estado tieneInteres
   * 
   * GUARDRAIL: Compras en modo REAL nunca se recalculan
   */
  async recalcularCompra(purchaseId: number) {
    const purchase = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });

    if (!purchase) {
      throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    // GUARDRAIL: No recalcular si está en modo REAL
    if (purchase.modoMonto === 'REAL') {
      console.log(`🛡️  [GUARDRAIL] Compra ${purchaseId} está en modo REAL - Recálculo bloqueado`);
      console.log(`    Merchant: ${purchase.merchant}, Total confirmado: $${purchase.totalFinanciadoEstimado?.toLocaleString('es-CL') || 'N/A'}`);
      return purchase;
    }

    // Obtener tasa vigente a la fecha de compra
    const tasaConfig = await tenpoConfigService.getTasaVigente(purchase.purchaseDate);
    const tasaMensual = tasaConfig?.tasaMensual || 0.0211; // Fallback 2.11%

    // Parsear feePct desde metadata si existe
    let feePct: number | null = null;
    if (purchase.metadata) {
      try {
        const metadata = JSON.parse(purchase.metadata);
        feePct = metadata.feePct ?? null;
      } catch (error) {
        console.warn(`Error parsing metadata for purchase ${purchase.id}:`, error);
      }
    }

    // Determinar fecha primera cuota: usar override si scheduleMode='MANUAL'
    let primeraFechaVencimiento: Date;
    if (purchase.scheduleMode === 'MANUAL' && purchase.firstDueDateOverride) {
      primeraFechaVencimiento = new Date(purchase.firstDueDateOverride);
      console.log(`📅 [CALENDAR OVERRIDE] Compra ${purchaseId} usa fecha manual: ${primeraFechaVencimiento.toISOString().split('T')[0]}`);
      console.log(`    scheduleMode: ${purchase.scheduleMode}, firstDueDateOverride: ${purchase.firstDueDateOverride}`);
    } else {
      primeraFechaVencimiento = purchase.installments[0]?.dueDate || new Date();
      console.log(`📅 [CALENDAR AUTO] Compra ${purchaseId} usa fecha automática: ${primeraFechaVencimiento.toISOString().split('T')[0]}`);
    }

    // Generar calendario con fee si aplica
    const { cuotas, totalFinanciado, interesTotal } = this.generarCalendarioCuotas(
      purchase.amountTotalClp,
      purchase.installmentsCount,
      primeraFechaVencimiento,
      purchase.tieneInteres,
      tasaMensual,
      feePct
    );

    // Actualizar purchase
    await prisma.tenpoPurchase.update({
      where: { id: purchaseId },
      data: {
        totalFinanciadoEstimado: totalFinanciado,
        interesTotalEstimado: interesTotal
      }
    });

    // Actualizar cada installment con fechas recalculadas
    for (let i = 0; i < purchase.installments.length; i++) {
      const installment = purchase.installments[i];
      const nuevaFecha = addMonths(primeraFechaVencimiento, i);
      
      console.log(`  📆 Cuota ${i + 1}: ${nuevaFecha.toISOString().split('T')[0]} (monto: $${Math.round(cuotas[i]).toLocaleString('es-CL')})`);
      
      await prisma.tenpoInstallment.update({
        where: { id: installment.id },
        data: {
          baseAmountClp: cuotas[i],
          finalMonthlyAmountClp: cuotas[i],
          dueDate: nuevaFecha,
          payDateEstimated: nuevaFecha,
          estado: 'ESTIMADO'
        }
      });
    }

    console.log(`✅ Compra ${purchaseId} recalculada: ${cuotas.length} cuotas, Total: $${totalFinanciado.toLocaleString('es-CL')}`);

    return await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });
  }

  /**
   * Recalcula todas las compras ESTIMADAS (útil cuando cambia la tasa global)
   * 
   * GUARDRAIL: Solo recalcula compras ESTIMADAS, nunca REAL
   */
  async recalcularTodasEstimadas() {
    const comprasEstimadas = await prisma.tenpoPurchase.findMany({
      where: { modoMonto: 'ESTIMADO' }
    });

    console.log(`🔄 Recalculando ${comprasEstimadas.length} compras estimadas...`);

    let recalculadas = 0;
    let saltadas = 0;
    
    for (const compra of comprasEstimadas) {
      try {
        // GUARDRAIL: Doble verificación - no recalcular si de alguna manera es REAL
        if (compra.modoMonto === 'REAL') {
          console.log(`🛡️  [GUARDRAIL] Compra ${compra.id} marcada como REAL - Saltada por seguridad`);
          saltadas++;
          continue;
        }
        
        await this.recalcularCompra(compra.id);
        recalculadas++;
      } catch (error) {
        console.error(`❌ Error recalculando compra ${compra.id}:`, error);
      }
    }

    console.log(`✅ ${recalculadas} compras recalculadas exitosamente`);
    if (saltadas > 0) {
      console.log(`🛡️  ${saltadas} compras REAL saltadas por guardrail`);
    }
    
    return { total: comprasEstimadas.length, recalculadas, saltadas };
  }

  /**
   * Marca una compra como REAL y ajusta sus cuotas según valor confirmado
   * 
   * REGLA CRÍTICA:
   * - Cuando se confirma el valor real, NO se recalcula desde la tasa
   * - Se usa EXACTAMENTE el valor confirmado por el usuario
   * - total_financiado = cuota_real × n_cuotas
   * - interes_total = total_financiado - capital
   * 
   * Esto resuelve el problema de sobrestimación del Sistema Francés
   */
  async confirmarValorReal(purchaseId: number, cuotaReal: number) {
    const purchase = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });

    if (!purchase) {
      throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    // Calcular valores desde la cuota confirmada (NO desde tasa)
    const totalReal = cuotaReal * purchase.installmentsCount;
    const interesReal = totalReal - purchase.amountTotalClp;

    console.log(`📊 Confirmando valor real:`);
    console.log(`   Capital: $${purchase.amountTotalClp.toLocaleString('es-CL')}`);
    console.log(`   Cuota real: $${cuotaReal.toLocaleString('es-CL')}`);
    console.log(`   Total real: $${totalReal.toLocaleString('es-CL')}`);
    console.log(`   Interés real: $${interesReal.toLocaleString('es-CL')}`);

    // Actualizar purchase a modo REAL con valores desde cuota confirmada
    await prisma.tenpoPurchase.update({
      where: { id: purchaseId },
      data: {
        modoMonto: 'REAL',
        // IMPORTANTE: Guardar los valores reales, NO estimados
        totalFinanciadoEstimado: totalReal,  // Ahora contiene el valor REAL
        interesTotalEstimado: interesReal     // Ahora contiene el valor REAL
      }
    });

    // Actualizar todas las cuotas con el valor real exacto
    for (const installment of purchase.installments) {
      await prisma.tenpoInstallment.update({
        where: { id: installment.id },
        data: {
          baseAmountClp: cuotaReal,
          finalMonthlyAmountClp: cuotaReal,
          estado: 'REAL'
        }
      });
    }

    console.log(`✅ Compra ${purchaseId} confirmada como REAL: $${cuotaReal.toLocaleString('es-CL')}/cuota`);

    return await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });
  }
}

export const tenpoCalculatorService = new TenpoCalculatorService();
