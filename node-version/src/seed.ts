import prisma from './db';
import { addDays, startOfYear, endOfYear } from 'date-fns';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create calendar entries for 2025-2028
  const startYear = 2025;
  const endYear = 2028;
  
  for (let year = startYear; year <= endYear; year++) {
    let current = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));

    while (current <= end) {
      await prisma.calendar.upsert({
        where: { date: current },
        update: {},
        create: { date: current }
      });
      current = addDays(current, 1);
    }
  }

  console.log('✅ Calendar populated');

  // Sample subscriptions
  const samples = [
    { name: 'Crunchyroll', price: 4990.0, periodicity: 'monthly', startDate: new Date(2026, 0, 12) },
    { name: 'Google One', price: 8990.0, periodicity: 'monthly', startDate: new Date(2026, 0, 2) },
    { name: 'Lightroom', price: 15000.0, periodicity: 'annual', startDate: new Date(2026, 0, 18) },
    { name: 'Spotify Familiar', price: 8250.0, periodicity: 'monthly', startDate: new Date(2026, 0, 5) },
    { name: 'YouTube Premium', price: 11000.0, periodicity: 'monthly', startDate: new Date(2026, 0, 1) },
    { name: 'Office 365', price: 1490.0, periodicity: 'monthly', startDate: new Date(2026, 0, 7) },
  ];

  for (const sample of samples) {
    const calEntry = await prisma.calendar.findUnique({
      where: { date: sample.startDate }
    });

    if (calEntry) {
      // Verificar si ya existe la suscripción
      const existing = await prisma.subscription.findFirst({
        where: {
          name: sample.name,
          startDate: sample.startDate
        }
      });

      if (!existing) {
        await prisma.subscription.create({
          data: {
            name: sample.name,
            price: sample.price,
            periodicity: sample.periodicity,
            startDate: sample.startDate,
            startDateId: calEntry.id
          }
        });
      }
    }
  }

  console.log('✅ Sample subscriptions created');

  // Servicios Básicos predefinidos
  const serviciosBase = [
    { nombre: 'Luz', orden: 1 },
    { nombre: 'Agua', orden: 2 },
    { nombre: 'Gas', orden: 3 },
    { nombre: 'Internet', orden: 4 },
    { nombre: 'Telefonía', orden: 5 },
    { nombre: 'Gastos Comunes', orden: 6 },
    { nombre: 'Servicios de Aseo', orden: 7 }
  ];

  for (const servicio of serviciosBase) {
    await prisma.servicioBasico.upsert({
      where: { nombre: servicio.nombre },
      update: {},
      create: {
        nombre: servicio.nombre,
        activo: true,
        esBase: true,
        orden: servicio.orden
      }
    });
  }

  console.log('✅ Servicios básicos predefinidos creados');

  // Ingresos Base predefinidos
  const ingresosBase = [
    { nombre: 'Sueldo líquido', orden: 1 },
    { nombre: 'Arriendo propiedades', orden: 2 },
    { nombre: 'Honorarios', orden: 3 }
  ];

  for (const ingreso of ingresosBase) {
    await prisma.ingresoBase.upsert({
      where: { nombre: ingreso.nombre },
      update: {},
      create: {
        nombre: ingreso.nombre,
        activo: true,
        esRecurrente: true,
        orden: ingreso.orden
      }
    });
  }

  console.log('✅ Ingresos base predefinidos creados');

  // Presupuesto de sueldo líquido para 2026 (12 meses)
  const sueldoIngreso = await prisma.ingresoBase.findUnique({
    where: { nombre: 'Sueldo líquido' }
  });

  if (sueldoIngreso) {
    await prisma.presupuestoIngreso.upsert({
      where: {
        ingresoId_anio: {
          ingresoId: sueldoIngreso.id,
          anio: 2026
        }
      },
      update: {},
      create: {
        ingresoId: sueldoIngreso.id,
        anio: 2026,
        enero: 1500000,
        febrero: 1500000,
        marzo: 1500000,
        abril: 1500000,
        mayo: 1500000,
        junio: 1500000,
        julio: 1500000,
        agosto: 1500000,
        septiembre: 1500000,
        octubre: 1500000,
        noviembre: 1500000,
        diciembre: 1500000
      }
    });

    console.log('✅ Presupuesto de sueldo líquido 2026 creado');
  }

  // Bono demo con reparto
  const bonoDemo = await prisma.bono.create({
    data: {
      nombre: 'Aguinaldo Septiembre',
      anio: 2026,
      mes: 9, // Septiembre
      monto: 800000,
      descripcion: 'Bono fiestas patrias',
      repartos: {
        create: [
          {
            destino: 'ahorro',
            monto: 320000,
            porcentaje: 40
          },
          {
            destino: 'deuda',
            monto: 240000,
            porcentaje: 30
          },
          {
            destino: 'vacaciones',
            monto: 160000,
            porcentaje: 20
          },
          {
            destino: 'apoyo_mensual',
            monto: 80000,
            porcentaje: 10,
            mesesDistribucion: 4 // Distribuido en 4 meses
          }
        ]
      }
    }
  });

  console.log('✅ Bono demo con reparto creado');
  console.log('🎉 Seed completed!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
