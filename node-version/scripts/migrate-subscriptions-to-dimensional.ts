/**
 * Script de Migración: Subscriptions Legacy → Modelo Dimensional
 * 
 * Migra suscripciones desde la tabla legacy `Subscription` al modelo dimensional:
 * - Crea cuentas en dim_account (GAS.SUS.XXX)
 * - Genera hechos presupuestados en fact_financial para cada mes activo
 * 
 * USO: npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026 [--dry-run]
 */

import prisma from '../src/db';
import prismaStar from '../src/db-star';
import { getActiveMonths } from '../src/utils/subscriptionPeriodicity';

interface MigrationStats {
  subscriptionsProcessed: number;
  accountsCreated: number;
  factsCreated: number;
  errors: string[];
  skipped: string[];
}

async function getNextSubscriptionCode(): Promise<string> {
  const existingCount = await prismaStar.dimAccount.count({
    where: { 
      accountCode: { startsWith: 'GAS.SUS.' },
      isBaseMember: true
    }
  });
  
  let attempt = existingCount + 1;
  while (true) {
    const code = `GAS.SUS.${String(attempt).padStart(3, '0')}`;
    const exists = await prismaStar.dimAccount.findUnique({
      where: { accountCode: code }
    });
    if (!exists) return code;
    attempt++;
    if (attempt > 999) {
      throw new Error('Se alcanzó el límite de códigos de suscripción (999)');
    }
  }
}

async function migrateSubscriptions(year: number, isDryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    subscriptionsProcessed: 0,
    accountsCreated: 0,
    factsCreated: 0,
    errors: [],
    skipped: []
  };

  console.log(`\n🚀 Iniciando migración de suscripciones para el año ${year}`);
  console.log(`Modo: ${isDryRun ? 'DRY RUN (simulación)' : 'PRODUCCIÓN'}\n`);

  // 1. Verificar que existe GAS.SUS parent
  const parentAccount = await prismaStar.dimAccount.findUnique({
    where: { accountCode: 'GAS.SUS' }
  });

  if (!parentAccount) {
    stats.errors.push('❌ Cuenta padre GAS.SUS no encontrada en dim_account');
    return stats;
  }

  console.log(`✅ Cuenta padre GAS.SUS encontrada (accountId=${parentAccount.accountId})\n`);

  // 2. Obtener escenario BUDGET
  const budgetScenario = await prismaStar.dimScenario.findUnique({
    where: { scenarioCode: 'BUDGET' }
  });

  if (!budgetScenario) {
    stats.errors.push('❌ Escenario BUDGET no encontrado en dim_scenario');
    return stats;
  }

  console.log(`✅ Escenario BUDGET encontrado (scenarioId=${budgetScenario.scenarioId})\n`);

  // 3. Obtener suscripciones legacy
  const legacySubscriptions = await prisma.subscription.findMany({
    orderBy: { id: 'asc' }
  });

  console.log(`📦 ${legacySubscriptions.length} suscripciones encontradas en tabla legacy\n`);

  if (legacySubscriptions.length === 0) {
    console.log('⚠️ No hay suscripciones para migrar');
    return stats;
  }

  // 4. Procesar cada suscripción
  for (const sub of legacySubscriptions) {
    stats.subscriptionsProcessed++;
    console.log(`\n[${stats.subscriptionsProcessed}/${legacySubscriptions.length}] Procesando: ${sub.name}`);
    console.log(`  - Periodicidad: ${sub.periodicity}`);
    console.log(`  - Precio: $${sub.price.toLocaleString()}`);
    console.log(`  - Fecha inicio: ${sub.startDate.toISOString().split('T')[0]}`);

    try {
      // 4.1 Verificar si ya existe en dim_account
      const existingAccounts = await prismaStar.dimAccount.findMany({
        where: { 
          accountName: sub.name,
          accountCode: { startsWith: 'GAS.SUS.' }
        }
      });

      let dimAccount;
      let accountCode;
      
      if (existingAccounts.length > 0) {
        dimAccount = existingAccounts[0];
        accountCode = dimAccount.accountCode;
        console.log(`  🔍 Cuenta existente: ${accountCode}`);
        
        // Verificar si ya tiene hechos BUDGET para este año
        const existingBudgetFacts = await prismaStar.factFinancial.count({
          where: {
            accountBaseId: dimAccount.accountId,
            scenarioId: budgetScenario.scenarioId,
            time: { year }
          }
        });
        
        if (existingBudgetFacts > 0) {
          stats.skipped.push(`${sub.name} (ya tiene ${existingBudgetFacts} hechos BUDGET en ${year})`);
          console.log(`  ⏭️  SKIP: Ya tiene ${existingBudgetFacts} hechos BUDGET en ${year}`);
          continue;
        }
        
        console.log(`  📝 No tiene hechos BUDGET, se crearán...`);
      } else {
        // 4.2 Generar código único para cuenta nueva
        accountCode = await getNextSubscriptionCode();
        console.log(`  📝 Código asignado: ${accountCode}`);
      }

      // 4.3 Calcular meses activos
      const startDate = sub.startDate.toISOString().split('T')[0];
      const activeMonths = getActiveMonths(startDate, sub.periodicity, year);
      console.log(`  📅 Meses activos en ${year}: [${activeMonths.join(', ')}] (${activeMonths.length} meses)`);

      if (activeMonths.length === 0) {
        stats.skipped.push(`${sub.name} (sin meses activos en ${year})`);
        console.log(`  ⏭️  SKIP: Sin meses activos en ${year}`);
        continue;
      }

      if (!isDryRun) {
        // 4.4 Crear cuenta dimensional solo si no existe
        if (!dimAccount) {
          dimAccount = await prismaStar.dimAccount.create({
            data: {
              accountCode: accountCode,
              accountName: sub.name,
              parentId: parentAccount.accountId,
              level: 3,
              isBaseMember: true,
              accountType: 'GASTO',
              sortOrder: 0,
              isActive: true
            }
          });

          stats.accountsCreated++;
          console.log(`  ✅ Cuenta creada: ${dimAccount.accountCode}`);
        }

        // 4.5 Crear hechos para cada mes activo
        let monthsCreated = 0;
        for (const month of activeMonths) {
          const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
          
          const timeEntry = await prismaStar.dimTime.findUnique({
            where: { yearMonth }
          });

          if (!timeEntry) {
            console.log(`  ⚠️  Mes ${yearMonth} no encontrado en dim_time, saltando`);
            continue;
          }

          await prismaStar.factFinancial.create({
            data: {
              scenarioId: budgetScenario.scenarioId,
              timeId: timeEntry.timeId,
              accountBaseId: dimAccount.accountId,
              amountClp: Math.round(sub.price),
              source: 'migrated_legacy'
            }
          });

          monthsCreated++;
          stats.factsCreated++;
        }

        console.log(`  ✅ ${monthsCreated} hechos creados (BUDGET)`);
      } else {
        console.log(`  [DRY RUN] Se crearían:`);
        if (!dimAccount) {
          console.log(`    - 1 cuenta (${accountCode})`);
          stats.accountsCreated++;
        }
        console.log(`    - ${activeMonths.length} hechos (BUDGET)`);
        stats.factsCreated += activeMonths.length;
      }

    } catch (error: any) {
      const errorMsg = `${sub.name}: ${error.message}`;
      stats.errors.push(errorMsg);
      console.log(`  ❌ ERROR: ${error.message}`);
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const yearArg = args.find(a => a.startsWith('--year='));
  const isDryRun = args.includes('--dry-run');

  if (!yearArg) {
    console.error('❌ Error: Debes especificar el año con --year=YYYY');
    console.error('Ejemplo: npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026 --dry-run');
    process.exit(1);
  }

  const year = parseInt(yearArg.split('=')[1]);
  if (isNaN(year) || year < 2000 || year > 2100) {
    console.error('❌ Error: Año inválido. Debe estar entre 2000 y 2100');
    process.exit(1);
  }

  try {
    const stats = await migrateSubscriptions(year, isDryRun);

    // Imprimir resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Suscripciones procesadas: ${stats.subscriptionsProcessed}`);
    console.log(`✅ Cuentas creadas: ${stats.accountsCreated}`);
    console.log(`✅ Hechos creados: ${stats.factsCreated}`);
    
    if (stats.skipped.length > 0) {
      console.log(`\n⏭️  Omitidas (${stats.skipped.length}):`);
      stats.skipped.forEach(s => console.log(`   - ${s}`));
    }

    if (stats.errors.length > 0) {
      console.log(`\n❌ Errores (${stats.errors.length}):`);
      stats.errors.forEach(e => console.log(`   - ${e}`));
    }

    if (isDryRun) {
      console.log('\n⚠️  Esto fue un DRY RUN. Ningún cambio fue aplicado.');
      console.log('Para ejecutar la migración real, quita el flag --dry-run');
    } else {
      console.log('\n✅ Migración completada exitosamente');
    }

  } catch (error: any) {
    console.error('\n❌ Error fatal en migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await prismaStar.$disconnect();
  }
}

main();
