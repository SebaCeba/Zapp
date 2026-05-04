/**
 * Script de Validación: Sincronización Hipotecario → FACT
 * 
 * Ejecuta la sincronización y valida resultados
 * 
 * USO: npx tsx scripts/test-hipotecario-sync.ts [--year=YYYY]
 */

import { syncHipotecarioToFact } from '../src/services/hipotecarioSync';
import prismaStar from '../src/db-star';

async function validateSync() {
  console.log('\n🧪 VALIDACIÓN DE SINCRONIZACIÓN HIPOTECARIO → FACT\n');
  console.log('='.repeat(70));

  // Parsear año desde argumentos
  const yearArg = process.argv.find(arg => arg.startsWith('--year='));
  const year = yearArg ? parseInt(yearArg.split('=')[1]) : undefined;

  // Ejecutar sincronización
  console.log('\n1️⃣  EJECUTANDO SINCRONIZACIÓN...\n');
  const result = await syncHipotecarioToFact(year);

  console.log('\n📊 RESULTADO DE SINCRONIZACIÓN:');
  console.log(`   Año: ${result.year}`);
  console.log(`   Éxito: ${result.success ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   Facts eliminados: ${result.factsDeleted}`);
  console.log(`   Facts creados: ${result.factsCreated}`);
  
  if (result.errors.length > 0) {
    console.log(`\n   ⚠️  Errores (${result.errors.length}):`);
    result.errors.forEach(err => console.log(`      - ${err}`));
  }

  if (!result.success) {
    console.log('\n❌ Sincronización FALLÓ. Abortando validación.\n');
    process.exit(1);
  }

  // Validar facts creados
  console.log('\n2️⃣  VALIDANDO FACTS EN BASE DE DATOS...\n');

  const budgetScenario = await prismaStar.dimScenario.findUnique({
    where: { scenarioCode: 'BUDGET' }
  });

  if (!budgetScenario) {
    console.log('❌ Escenario BUDGET no encontrado\n');
    process.exit(1);
  }

  const factsHipotecario = await prismaStar.factFinancial.findMany({
    where: {
      source: 'hipotecario',
      scenarioId: budgetScenario.scenarioId,
      time: { year: result.year }
    },
    include: {
      time: true,
      account: true
    },
    orderBy: [
      { time: { month: 'asc' } },
      { account: { accountCode: 'asc' } }
    ]
  });

  console.log(`✅ Facts encontrados: ${factsHipotecario.length}`);

  // Agrupar por mes
  const factsByMonth = new Map<number, typeof factsHipotecario>();
  factsHipotecario.forEach(fact => {
    const month = fact.time.month;
    if (!factsByMonth.has(month)) {
      factsByMonth.set(month, []);
    }
    factsByMonth.get(month)!.push(fact);
  });

  console.log(`   Meses con datos: ${factsByMonth.size}`);

  // Totales por tipo
  const dividendo = factsHipotecario.filter(f => f.account.accountCode === 'GAS.HIP.DIV');
  const seguros = factsHipotecario.filter(f => f.account.accountCode.startsWith('GAS.HIP.SEG.'));

  const totalDividendo = dividendo.reduce((sum, f) => sum + f.amountClp, 0);
  const totalSeguros = seguros.reduce((sum, f) => sum + f.amountClp, 0);
  const totalAnual = totalDividendo + totalSeguros;

  console.log(`\n   💰 TOTALES ${result.year}:`);
  console.log(`      Dividendo: $${totalDividendo.toLocaleString()} (${dividendo.length} meses)`);
  console.log(`      Seguros:   $${totalSeguros.toLocaleString()} (${seguros.length} registros)`);
  console.log(`      TOTAL:     $${totalAnual.toLocaleString()}`);

  // Mostrar desglose mensual
  console.log(`\n   📅 DESGLOSE MENSUAL:\n`);
  console.log('   Mes | Dividendo        | Seguros          | Total');
  console.log('   ' + '-'.repeat(60));

  for (let month = 1; month <= 12; month++) {
    const monthFacts = factsByMonth.get(month) || [];
    const divMes = monthFacts.filter(f => f.account.accountCode === 'GAS.HIP.DIV');
    const segMes = monthFacts.filter(f => f.account.accountCode.startsWith('GAS.HIP.SEG.'));

    const divTotal = divMes.reduce((sum, f) => sum + f.amountClp, 0);
    const segTotal = segMes.reduce((sum, f) => sum + f.amountClp, 0);
    const mesTotal = divTotal + segTotal;

    const monthName = new Date(result.year, month - 1, 1).toLocaleDateString('es-CL', { month: 'short' }).toUpperCase();

    console.log(`   ${monthName.padEnd(3)} | ${divTotal.toLocaleString('es-CL').padStart(15)} | ${segTotal.toLocaleString('es-CL').padStart(15)} | ${mesTotal.toLocaleString('es-CL').padStart(15)}`);
  }

  // Validar que aparecen en resumen
  console.log('\n3️⃣  VALIDANDO APARICIÓN EN RESUMEN...\n');

  const accountsWithFacts = await prismaStar.dimAccount.findMany({
    where: {
      accountCode: { startsWith: 'GAS.HIP' },
      facts: {
        some: {
          scenarioId: budgetScenario.scenarioId,
          time: { year: result.year }
        }
      }
    }
  });

  console.log(`✅ Cuentas hipotecarias con facts: ${accountsWithFacts.length}`);
  accountsWithFacts.forEach(acc => {
    console.log(`   - ${acc.accountCode}: ${acc.accountName}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ VALIDACIÓN COMPLETADA EXITOSAMENTE\n');
}

validateSync()
  .catch(error => {
    console.error('\n❌ ERROR EN VALIDACIÓN:', error);
    process.exit(1);
  })
  .finally(async () => {
    const prismaStar = (await import('../src/db-star')).default;
    await prismaStar.$disconnect();
    const prisma = (await import('../src/db')).default;
    await prisma.$disconnect();
  });
