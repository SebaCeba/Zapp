import prisma from '../db';
import { tenpoConfigService } from './tenpo-config.service';

/**
 * Servicio para cálculos financieros de compras en cuotas
 */
export class TenpoCalculatorService {
  /**
   * Calcula cuota mensual usando sistema francés (anualidad)
   * Fórmula: cuota = C × i / (1 − (1 + i)^(-n))
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
   * Genera calendario de cuotas con ajuste en última cuota
   * para que la suma sea exactamente igual al total financiado
   */
  generarCalendarioCuotas(
    capital: number,
    nCuotas: number,
    fechaPrimeraCuota: Date,
    tieneInteres: boolean,
    tasaMensual: number
  ): { cuotas: number[]; totalFinanciado: number; interesTotal: number } {
    
    let cuotaMensual: number;
    let totalFinanciado: number;

    if (tieneInteres) {
      cuotaMensual = this.calcularCuotaFrancesa(capital, nCuotas, tasaMensual);
      totalFinanciado = cuotaMensual * nCuotas;
    } else {
      cuotaMensual = this.calcularCuotaSimple(capital, nCuotas);
      totalFinanciado = capital;
    }

    // Generar array de cuotas
    const cuotas: number[] = new Array(nCuotas).fill(cuotaMensual);

    // Ajustar última cuota para suma exacta
    const sumaActual = cuotas.reduce((sum, c) => sum + c, 0);
    const diferencia = totalFinanciado - sumaActual;
    cuotas[nCuotas - 1] += diferencia;

    const interesTotal = totalFinanciado - capital;

    return {
      cuotas,
      totalFinanciado,
      interesTotal
    };
  }

  /**
   * Recalcula todas las cuotas de una compra según su estado tieneInteres
   */
  async recalcularCompra(purchaseId: number) {
    const purchase = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });

    if (!purchase) {
      throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    // No recalcular si está en modo REAL
    if (purchase.modoMonto === 'REAL') {
      console.log(`⏭️  Compra ${purchaseId} en modo REAL, no se recalcula`);
      return purchase;
    }

    // Obtener tasa vigente a la fecha de compra
    const tasaConfig = await tenpoConfigService.getTasaVigente(purchase.purchaseDate);
    const tasaMensual = tasaConfig?.tasaMensual || 0.0211; // Fallback 2.11%

    // Generar calendario
    const primeraFechaVencimiento = purchase.installments[0]?.dueDate || new Date();
    const { cuotas, totalFinanciado, interesTotal } = this.generarCalendarioCuotas(
      purchase.amountTotalClp,
      purchase.installmentsCount,
      primeraFechaVencimiento,
      purchase.tieneInteres,
      tasaMensual
    );

    // Actualizar purchase
    await prisma.tenpoPurchase.update({
      where: { id: purchaseId },
      data: {
        totalFinanciadoEstimado: totalFinanciado,
        interesTotalEstimado: interesTotal
      }
    });

    // Actualizar cada installment
    for (let i = 0; i < purchase.installments.length; i++) {
      const installment = purchase.installments[i];
      await prisma.tenpoInstallment.update({
        where: { id: installment.id },
        data: {
          baseAmountClp: cuotas[i],
          finalMonthlyAmountClp: cuotas[i],
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
   */
  async recalcularTodasEstimadas() {
    const comprasEstimadas = await prisma.tenpoPurchase.findMany({
      where: { modoMonto: 'ESTIMADO' }
    });

    console.log(`🔄 Recalculando ${comprasEstimadas.length} compras estimadas...`);

    let recalculadas = 0;
    for (const compra of comprasEstimadas) {
      try {
        await this.recalcularCompra(compra.id);
        recalculadas++;
      } catch (error) {
        console.error(`❌ Error recalculando compra ${compra.id}:`, error);
      }
    }

    console.log(`✅ ${recalculadas} compras recalculadas exitosamente`);
    return recalculadas;
  }

  /**
   * Marca una compra como REAL y ajusta sus cuotas según valor confirmado
   */
  async confirmarValorReal(purchaseId: number, cuotaReal: number) {
    const purchase = await prisma.tenpoPurchase.findUnique({
      where: { id: purchaseId },
      include: { installments: true }
    });

    if (!purchase) {
      throw new Error(`Compra no encontrada: ${purchaseId}`);
    }

    const totalReal = cuotaReal * purchase.installmentsCount;

    // Actualizar purchase a modo REAL
    await prisma.tenpoPurchase.update({
      where: { id: purchaseId },
      data: {
        modoMonto: 'REAL',
        totalFinanciadoEstimado: totalReal,
        interesTotalEstimado: totalReal - purchase.amountTotalClp
      }
    });

    // Actualizar todas las cuotas con el valor real
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
