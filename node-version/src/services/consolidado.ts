import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MonthlyBudgetLine {
  itemKey: string;
  label: string;
  amountClp: number;
}

interface MonthlyBudget {
  INGRESOS: MonthlyBudgetLine[];
  SUSCRIPCIONES: MonthlyBudgetLine[];
  OBLIGACIONES: MonthlyBudgetLine[];
  HIPOTECARIO: MonthlyBudgetLine[];
  SERVICIOS_BASICOS: MonthlyBudgetLine[];
  SUPERMERCADO: MonthlyBudgetLine[];
  PAGO_TC: MonthlyBudgetLine[];
  AJUSTES: MonthlyBudgetLine[];
  AHORROS: MonthlyBudgetLine[];
}

const MESES_MAP: Record<number, string> = {
  1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril', 
  5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
  9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
};

export async function getMonthlyBudget(year: number, month: number): Promise<MonthlyBudget> {
  const mesNombre = MESES_MAP[month];
  
  const DEBUG_SUBS = process.env.DEBUG_SUBS === '1';
  
  if (DEBUG_SUBS) {
    console.log(`\n═══ DEBUG SUBS: getMonthlyBudget(${year}, ${month}) ═══`);
  }
  
  // 1. INGRESOS
  const ingresos = await prisma.presupuestoIngreso.findMany({
    where: { anio: year },
    include: { ingreso: true }
  });
  
  const ingresosLines: MonthlyBudgetLine[] = ingresos
    .filter(p => p.ingreso.activo)
    .map(p => ({
      itemKey: `ingreso:${p.ingresoId}`,
      label: p.ingreso.nombre,
      amountClp: Math.round((p as any)[mesNombre] || 0)
    }))
    .filter(l => l.amountClp > 0);

  // 2. SUSCRIPCIONES
  const suscripciones = await prisma.subscription.findMany({
    include: { priceOverrides: true }
  });

  const suscripcionesLines: MonthlyBudgetLine[] = [];
  
  for (const sub of suscripciones) {
    const isDisney = sub.name.toLowerCase().includes('disney');
    const startDate = new Date(sub.startDate);
    
    // Calcular "meses absolutos" para comparar correctamente
    const targetMonth = (year * 12) + (month - 1); // month es 1-12, convertir a 0-11
    const startMonth = (startDate.getFullYear() * 12) + startDate.getMonth(); // getMonth() es 0-11
    const monthsSinceStart = targetMonth - startMonth;
    
    if (DEBUG_SUBS && isDisney) {
      console.log(`\n📍 Suscripción: ${sub.name} (ID: ${sub.id})`);
      console.log(`   Periodicidad: ${sub.periodicity}`);
      console.log(`   startDate raw: ${sub.startDate}`);
      console.log(`   startDate.getFullYear(): ${startDate.getFullYear()}`);
      console.log(`   startDate.getMonth(): ${startDate.getMonth()} (0-11)`);
      console.log(`   Target: year=${year}, month=${month} (1-12)`);
      console.log(`   Cálculo:`);
      console.log(`     targetMonth = (${year} * 12) + (${month} - 1) = ${targetMonth}`);
      console.log(`     startMonth = (${startDate.getFullYear()} * 12) + ${startDate.getMonth()} = ${startMonth}`);
      console.log(`     monthsSinceStart = ${targetMonth} - ${startMonth} = ${monthsSinceStart}`);
    }
    
    // Verificar si la suscripción ya comenzó
    if (monthsSinceStart < 0) {
      if (DEBUG_SUBS && isDisney) {
        console.log(`   ❌ NO APLICA: monthsSinceStart < 0 (suscripción aún no comienza)`);
      }
      continue;
    }

    // Calcular si este mes corresponde según la periodicidad
    let applies = false;
    
    if (sub.periodicity === 'monthly') {
      applies = true; // Todos los meses desde el inicio
    } else if (sub.periodicity === 'weekly') {
      // Para semanal, calcular todas las semanas del mes (simplificación: aplicar todos los meses)
      applies = true;
    } else if (sub.periodicity === 'quarterly') {
      applies = monthsSinceStart % 3 === 0;
      if (DEBUG_SUBS && isDisney) {
        console.log(`   Quarterly: ${monthsSinceStart} % 3 = ${monthsSinceStart % 3} → ${applies}`);
      }
    } else if (sub.periodicity === 'semiannual') {
      applies = monthsSinceStart % 6 === 0;
      if (DEBUG_SUBS && isDisney) {
        console.log(`   Semiannual: ${monthsSinceStart} % 6 = ${monthsSinceStart % 6} → ${applies}`);
      }
    } else if (sub.periodicity === 'annual') {
      applies = monthsSinceStart % 12 === 0;
      if (DEBUG_SUBS && isDisney) {
        console.log(`   Annual: ${monthsSinceStart} % 12 = ${monthsSinceStart % 12} → ${applies}`);
      }
    }

    if (DEBUG_SUBS && isDisney) {
      console.log(`   Resultado: ${applies ? '✅ INCLUIDA' : '❌ EXCLUIDA'}`);
    }

    if (!applies) continue;

    // Obtener precio (override o default)
    const override = sub.priceOverrides.find(o => o.year === year && o.month === month);
    const precio = override ? override.price : sub.price;
    
    suscripcionesLines.push({
      itemKey: `sub:${sub.id}`,
      label: sub.name,
      amountClp: Math.round(precio)
    });
  }

  // 3. OBLIGACIONES (créditos y seguros)
  const obligaciones = await prisma.obligacion.findMany();
  
  const obligacionesLines: MonthlyBudgetLine[] = obligaciones
    .filter(ob => {
      const mesInicio = new Date(ob.anioInicio, ob.mesInicio - 1);
      const mesActual = new Date(year, month - 1);
      const mesFin = new Date(ob.anioInicio, ob.mesInicio - 1);
      mesFin.setMonth(mesFin.getMonth() + ob.cuotasTotales);
      
      return mesActual >= mesInicio && mesActual < mesFin;
    })
    .map(ob => ({
      itemKey: `oblig:${ob.id}`,
      label: ob.nombre,
      amountClp: Math.round(ob.montoCuota)
    }));

  // 4. HIPOTECARIO
  const hipotecarioLines: MonthlyBudgetLine[] = [];
  
  // Dividendos hipotecarios
  const payments = await prisma.mortgagePayment.findMany({
    where: {
      fechaVencimiento: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      }
    }
  });

  if (payments.length > 0) {
    const totalDivUf = payments.reduce((sum, p) => sum + p.totalDivUf, 0);
    const supuesto = await prisma.supuestoAnual.findUnique({ where: { anio: year } });
    const valorUf = supuesto?.valorUfBase || 37000;
    
    hipotecarioLines.push({
      itemKey: 'hip:dividendo',
      label: 'Dividendo Hipotecario',
      amountClp: Math.round(totalDivUf * valorUf)
    });
  }

  // Seguros hipotecarios
  const seguros = await prisma.mortgageInsurance.findMany({
    where: { mesAnio: `${year}-${month.toString().padStart(2, '0')}` }
  });

  for (const seg of seguros) {
    let monto = seg.monto;
    if (seg.moneda === 'UF') {
      const supuesto = await prisma.supuestoAnual.findUnique({ where: { anio: year } });
      const valorUf = supuesto?.valorUfBase || 37000;
      monto = monto * valorUf;
    }
    
    hipotecarioLines.push({
      itemKey: `hip:seguro:${seg.id}`,
      label: seg.nombre,
      amountClp: Math.round(monto)
    });
  }

  // 5. SERVICIOS BÁSICOS
  const servicios = await prisma.presupuestoServicioBasico.findMany({
    where: { anio: year },
    include: { servicio: true }
  });

  const serviciosLines: MonthlyBudgetLine[] = servicios
    .filter(p => p.servicio.activo)
    .map(p => ({
      itemKey: `serv:${p.servicioId}`,
      label: p.servicio.nombre,
      amountClp: Math.round((p as any)[mesNombre] || 0)
    }))
    .filter(l => l.amountClp > 0);

  // 6. SUPERMERCADO
  const supermercado = await prisma.supermercadoPresupuesto.findUnique({
    where: { anio: year }
  });

  const supermercadoLines: MonthlyBudgetLine[] = [];
  if (supermercado) {
    const monto = (supermercado as any)[mesNombre] || 0;
    if (monto > 0) {
      supermercadoLines.push({
        itemKey: 'sm:total',
        label: 'Supermercado',
        amountClp: Math.round(monto)
      });
    }
  }

  // 7. AJUSTES (vacío por default, usuario agrega manual)
  const ajustesLines: MonthlyBudgetLine[] = [];

  // 8. PAGO_TC (vacío por default, se llena con ActualEntry)
  const pagoTcLines: MonthlyBudgetLine[] = [];

  // 9. AHORROS
  const ahorros = await prisma.presupuestoAhorro.findMany({
    where: { anio: year },
    include: { ahorro: true }
  });

  const ahorrosLines: MonthlyBudgetLine[] = ahorros
    .filter(p => p.ahorro.activo)
    .map(p => ({
      itemKey: `ahorro:${p.ahorroId}`,
      label: p.ahorro.nombre,
      amountClp: Math.round((p as any)[mesNombre] || 0)
    }))
    .filter(l => l.amountClp > 0);

  return {
    INGRESOS: ingresosLines,
    SUSCRIPCIONES: suscripcionesLines,
    OBLIGACIONES: obligacionesLines,
    HIPOTECARIO: hipotecarioLines,
    SERVICIOS_BASICOS: serviciosLines,
    SUPERMERCADO: supermercadoLines,
    PAGO_TC: pagoTcLines,
    AJUSTES: ajustesLines,
    AHORROS: ahorrosLines
  };
}
