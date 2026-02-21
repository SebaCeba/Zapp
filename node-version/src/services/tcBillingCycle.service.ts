import prisma from '../db';
import { 
  addMonths, 
  setDate, 
  previousFriday, 
  nextMonday, 
  isSaturday, 
  isSunday,
  startOfDay,
  addDays
} from 'date-fns';

interface BillingCycle {
  year: number;
  month: number;
  fromDate: Date;
  toDate: Date;
  nominalToDate: Date;
  ruleApplied: boolean;
  overrideApplied: boolean;
}

interface RecalculateRequest {
  tcKey: string;
  year: number;
  scope: 'FUTURE_ONLY' | 'ALL_NON_REAL_NON_MANUAL';
  dryRun?: boolean;
}

interface RecalculateResult {
  wouldChangeCount?: number;
  changedCount?: number;
  sampleChanges?: Array<{
    purchaseId: number;
    installmentId: number;
    oldDate: Date;
    newDate: Date;
  }>;
}

export class TcBillingCycleService {
  /**
   * Obtiene configuración y overrides de una TC
   */
  async getConfig(tcKey: string) {
    const config = await prisma.tcBillingConfig.findUnique({
      where: { tcKey },
      include: {
        overrides: {
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        }
      }
    });

    return config;
  }

  /**
   * Calcula la fecha de cierre nominal (sin ajuste por día hábil)
   */
  computeNominalCloseDate(year: number, month: number, closingDay: number): Date {
    // Crear fecha con el día de cierre nominal
    const date = new Date(year, month - 1, closingDay);
    return startOfDay(date);
  }

  /**
   * Ajusta una fecha al día hábil más cercano según la regla
   * @param date Fecha a ajustar
   * @param rule PREVIOUS (viernes anterior) | NEXT (lunes siguiente) | NONE (no ajustar)
   */
  adjustToBusinessDay(date: Date, rule: string): Date {
    if (rule === 'NONE') {
      return date;
    }

    if (isSaturday(date) || isSunday(date)) {
      if (rule === 'PREVIOUS') {
        return previousFriday(date);
      } else if (rule === 'NEXT') {
        return nextMonday(date);
      }
    }

    return date;
  }

  /**
   * Obtiene la fecha de cierre efectiva para un mes específico
   * Prioridad: override mensual > regla general
   */
  async getEffectiveCloseDate(tcKey: string, year: number, month: number): Promise<Date> {
    // Buscar override mensual
    const override = await prisma.tcBillingOverride.findUnique({
      where: {
        tcKey_year_month: { tcKey, year, month }
      }
    });

    if (override) {
      return startOfDay(override.effectiveCloseDate);
    }

    // Si no hay override, usar configuración general
    const config = await prisma.tcBillingConfig.findUnique({
      where: { tcKey }
    });

    if (!config) {
      throw new Error(`No existe configuración para TC: ${tcKey}`);
    }

    const nominalDate = this.computeNominalCloseDate(year, month, config.closingDay);
    return this.adjustToBusinessDay(nominalDate, config.businessDayRule);
  }

  /**
   * Construye ciclos de facturación para un año completo
   * Cada ciclo tiene DESDE (fromDate) y HASTA (toDate)
   * DESDE = día siguiente al HASTA del ciclo anterior
   */
  async buildAnnualCycles(tcKey: string, year: number): Promise<BillingCycle[]> {
    const config = await prisma.tcBillingConfig.findUnique({
      where: { tcKey },
      include: {
        overrides: {
          where: { year }
        }
      }
    });

    if (!config) {
      throw new Error(`No existe configuración para TC: ${tcKey}`);
    }

    const cycles: BillingCycle[] = [];

    // Obtener HASTA del mes anterior (diciembre del año anterior) para calcular DESDE de enero
    const prevYearDecemberToDate = await this.getEffectiveCloseDate(tcKey, year - 1, 12);

    for (let month = 1; month <= 12; month++) {
      // Calcular fecha nominal de cierre
      const nominalToDate = this.computeNominalCloseDate(year, month, config.closingDay);

      // Verificar si hay override para este mes
      const override = config.overrides.find(o => o.month === month);
      
      let toDate: Date;
      let overrideApplied = false;
      let ruleApplied = false;

      if (override) {
        // Usar fecha de override
        toDate = startOfDay(override.effectiveCloseDate);
        overrideApplied = true;
        ruleApplied = false; // Si hay override, no se aplica regla
      } else {
        // Aplicar regla de día hábil
        toDate = this.adjustToBusinessDay(nominalToDate, config.businessDayRule);
        // ruleApplied = true solo si:
        // - businessDayRule != 'NONE'
        // - nominalToDate requería ajuste (era sábado o domingo)
        // - toDate resultante difiere del nominalToDate
        const needsAdjustment = isSaturday(nominalToDate) || isSunday(nominalToDate);
        const wasAdjusted = toDate.getTime() !== nominalToDate.getTime();
        ruleApplied = config.businessDayRule !== 'NONE' && needsAdjustment && wasAdjusted;
      }

      // Calcular DESDE: día siguiente al HASTA del ciclo anterior
      let fromDate: Date;
      if (month === 1) {
        // Enero: DESDE = día siguiente al HASTA de diciembre del año anterior
        fromDate = addDays(prevYearDecemberToDate, 1);
      } else {
        // Otros meses: DESDE = día siguiente al HASTA del mes anterior
        fromDate = addDays(cycles[month - 2].toDate, 1);
      }

      cycles.push({
        year,
        month,
        fromDate,
        toDate,
        nominalToDate,
        ruleApplied,
        overrideApplied
      });
    }

    return cycles;
  }

  /**
   * Recalcula fechas de compras según ciclos de facturación
   * NO modifica montos, solo fechas (dueDate / payDateEstimated)
   */
  async recalculate(request: RecalculateRequest): Promise<RecalculateResult> {
    const { tcKey, year, scope, dryRun = false } = request;

    // Construir ciclos anuales para este año
    const cycles = await this.buildAnnualCycles(tcKey, year);

    // Identificar compras afectadas
    const whereConditions: any = {
      modoMonto: 'ESTIMADO', // NO tocar REAL
      scheduleMode: 'AUTO',  // NO tocar MANUAL
      purchaseDate: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31)
      }
    };

    if (scope === 'FUTURE_ONLY') {
      whereConditions.purchaseDate.gte = new Date();
    }

    const purchases = await prisma.tenpoPurchase.findMany({
      where: whereConditions,
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' }
        }
      }
    });

    const changes: Array<{
      purchaseId: number;
      installmentId: number;
      oldDate: Date;
      newDate: Date;
    }> = [];

    // Procesar cada compra
    for (const purchase of purchases) {
      // Determinar a qué ciclo pertenece la compra
      const purchaseDate = new Date(purchase.purchaseDate);
      const cycle = this.findCycleForDate(cycles, purchaseDate);

      if (!cycle) {
        console.warn(`No se encontró ciclo para compra ${purchase.id} (${purchaseDate})`);
        continue;
      }

      // Obtener configuración para usar dueDay
      const config = await prisma.tcBillingConfig.findUnique({ where: { tcKey } });
      if (!config) {
        console.warn(`No se encontró configuración para TC: ${tcKey}`);
        continue;
      }

      // Calcular nueva fecha de vencimiento usando dueDay de config
      let newDueDate = setDate(addMonths(new Date(cycle.year, cycle.month - 1, 1), 1), config.dueDay);
      
      // Ajustar si cae fin de semana (usar misma regla que cierre)
      newDueDate = this.adjustToBusinessDay(newDueDate, config.businessDayRule);

      // Recalcular solo primera cuota (installmentNumber = 1)
      // IMPORTANTE: Buscar explícitamente installmentNumber=1, no asumir installments[0]
      const firstInstallment = purchase.installments.find(i => i.installmentNumber === 1);
      
      if (firstInstallment) {
        const oldDate = new Date(firstInstallment.dueDate);
        
        if (oldDate.getTime() !== newDueDate.getTime()) {
          changes.push({
            purchaseId: purchase.id,
            installmentId: firstInstallment.id,
            oldDate,
            newDate: newDueDate
          });

          if (!dryRun) {
            // Actualizar primera cuota
            await prisma.tenpoInstallment.update({
              where: { id: firstInstallment.id },
              data: {
                dueDate: newDueDate,
                payDateEstimated: newDueDate
              }
            });

            // Recalcular cuotas 2..N en cascada (mantener espaciado mensual)
            for (let i = 1; i < purchase.installments.length; i++) {
              const installment = purchase.installments[i];
              const cascadeDate = addMonths(newDueDate, i);
              
              await prisma.tenpoInstallment.update({
                where: { id: installment.id },
                data: {
                  dueDate: cascadeDate,
                  payDateEstimated: cascadeDate
                }
              });

              changes.push({
                purchaseId: purchase.id,
                installmentId: installment.id,
                oldDate: new Date(installment.dueDate),
                newDate: cascadeDate
              });
            }

            // Actualizar timestamp de la compra
            await prisma.tenpoPurchase.update({
              where: { id: purchase.id },
              data: { updatedAt: new Date() }
            });
          }
        }
      }
    }

    if (dryRun) {
      return {
        wouldChangeCount: changes.length,
        sampleChanges: changes.slice(0, 10) // Primeras 10 como muestra
      };
    }

    return {
      changedCount: changes.length
    };
  }

  /**
   * Encuentra el ciclo al que pertenece una fecha
   * Una fecha pertenece a un ciclo si: fromDate <= fecha <= toDate
   */
  private findCycleForDate(cycles: BillingCycle[], date: Date): BillingCycle | null {
    for (const cycle of cycles) {
      const dateTime = date.getTime();
      const fromTime = cycle.fromDate.getTime();
      const toTime = cycle.toDate.getTime();

      if (dateTime >= fromTime && dateTime <= toTime) {
        return cycle;
      }
    }

    return null;
  }

  /**
   * Upsert de configuración de TC
   */
  async upsertConfig(tcKey: string, closingDay: number, dueDay: number, businessDayRule: string) {
    return await prisma.tcBillingConfig.upsert({
      where: { tcKey },
      update: {
        closingDay,
        dueDay,
        businessDayRule
      },
      create: {
        tcKey,
        closingDay,
        dueDay,
        businessDayRule
      }
    });
  }

  /**
   * Upsert de override mensual
   */
  async upsertOverride(tcKey: string, year: number, month: number, effectiveCloseDate: Date) {
    // Asegurar que la config existe
    const config = await prisma.tcBillingConfig.findUnique({
      where: { tcKey }
    });

    if (!config) {
      throw new Error(`No existe configuración para TC: ${tcKey}. Créela primero.`);
    }

    return await prisma.tcBillingOverride.upsert({
      where: {
        tcKey_year_month: { tcKey, year, month }
      },
      update: {
        effectiveCloseDate: startOfDay(effectiveCloseDate)
      },
      create: {
        tcKey,
        year,
        month,
        effectiveCloseDate: startOfDay(effectiveCloseDate)
      }
    });
  }

  /**
   * Eliminar override mensual
   */
  async deleteOverride(tcKey: string, year: number, month: number) {
    return await prisma.tcBillingOverride.delete({
      where: {
        tcKey_year_month: { tcKey, year, month }
      }
    });
  }
}

export const tcBillingCycleService = new TcBillingCycleService();
