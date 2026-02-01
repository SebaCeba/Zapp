const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para analizar compras con interés y detectar posibles discrepancias
 * entre valores estimados y reales
 */
async function analizarComprasInteres() {
  console.log('🔍 Analizando compras con interés...\n');

  try {
    // Obtener todas las compras con interés
    const compras = await prisma.tenpoPurchase.findMany({
      where: {
        tieneInteres: true,
        installmentsCount: { gt: 1 }
      },
      include: {
        installments: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    console.log(`📊 Total compras con interés: ${compras.length}\n`);

    if (compras.length === 0) {
      console.log('No hay compras con interés para analizar.');
      return;
    }

    // Agrupar por modo
    const estimadas = compras.filter(c => c.modoMonto === 'ESTIMADO');
    const confirmadas = compras.filter(c => c.modoMonto === 'REAL');

    console.log(`📈 ESTIMADAS: ${estimadas.length}`);
    console.log(`✅ CONFIRMADAS: ${confirmadas.length}\n`);

    console.log('=' .repeat(100));
    console.log('COMPRAS ESTIMADAS (pueden tener sobrestimación)');
    console.log('=' .repeat(100));

    if (estimadas.length > 0) {
      console.log(`${'Merchant'.padEnd(35)} | Capital | Cuotas | Total Est. | Interés Est. | Cuota`);
      console.log('-'.repeat(100));

      for (const compra of estimadas) {
        const merchant = compra.merchant.substring(0, 32).padEnd(35);
        const capital = `$${Math.round(compra.amountTotalClp).toLocaleString('es-CL')}`.padStart(10);
        const nCuotas = `${compra.installmentsCount}x`.padStart(6);
        const total = compra.totalFinanciadoEstimado 
          ? `$${Math.round(compra.totalFinanciadoEstimado).toLocaleString('es-CL')}`.padStart(12)
          : '-'.padStart(12);
        const interes = compra.interesTotalEstimado
          ? `$${Math.round(compra.interesTotalEstimado).toLocaleString('es-CL')}`.padStart(14)
          : '-'.padStart(14);
        const cuota = compra.installments[0]
          ? `$${Math.round(compra.installments[0].finalMonthlyAmountClp).toLocaleString('es-CL')}`.padStart(10)
          : '-'.padStart(10);

        console.log(`${merchant} | ${capital} | ${nCuotas} | ${total} | ${interes} | ${cuota}`);
      }

      console.log('\n💡 Estas compras usan el Sistema Francés para estimación.');
      console.log('   Para obtener valores exactos, confirma el valor real desde tu estado de cuenta Tenpo.\n');
    } else {
      console.log('No hay compras estimadas.\n');
    }

    console.log('=' .repeat(100));
    console.log('COMPRAS CONFIRMADAS (valores reales)');
    console.log('=' .repeat(100));

    if (confirmadas.length > 0) {
      console.log(`${'Merchant'.padEnd(35)} | Capital | Cuotas | Total Real | Interés Real | Cuota`);
      console.log('-'.repeat(100));

      for (const compra of confirmadas) {
        const merchant = compra.merchant.substring(0, 32).padEnd(35);
        const capital = `$${Math.round(compra.amountTotalClp).toLocaleString('es-CL')}`.padStart(10);
        const nCuotas = `${compra.installmentsCount}x`.padStart(6);
        const total = compra.totalFinanciadoEstimado 
          ? `$${Math.round(compra.totalFinanciadoEstimado).toLocaleString('es-CL')}`.padStart(12)
          : '-'.padStart(12);
        const interes = compra.interesTotalEstimado
          ? `$${Math.round(compra.interesTotalEstimado).toLocaleString('es-CL')}`.padStart(14)
          : '-'.padStart(14);
        const cuota = compra.installments[0]
          ? `$${Math.round(compra.installments[0].finalMonthlyAmountClp).toLocaleString('es-CL')}`.padStart(10)
          : '-'.padStart(10);

        console.log(`${merchant} | ${capital} | ${nCuotas} | ${total} | ${interes} | ${cuota}`);
      }

      console.log('\n✅ Estos valores fueron confirmados manualmente y reflejan el estado de cuenta de Tenpo.\n');
    } else {
      console.log('No hay compras confirmadas aún.\n');
    }

    // Análisis de tasas efectivas en confirmadas
    if (confirmadas.length > 0) {
      console.log('=' .repeat(100));
      console.log('ANÁLISIS DE TASAS EFECTIVAS (solo compras confirmadas)');
      console.log('=' .repeat(100));

      for (const compra of confirmadas) {
        if (!compra.totalFinanciadoEstimado || !compra.interesTotalEstimado) continue;

        const capital = compra.amountTotalClp;
        const interes = compra.interesTotalEstimado;
        const nCuotas = compra.installmentsCount;
        
        // Tasa efectiva simple promedio
        const tasaEfectiva = (interes / capital / nCuotas) * 100;
        
        const merchant = compra.merchant.substring(0, 40);
        console.log(`${merchant.padEnd(42)} | ${nCuotas}x | Tasa efectiva: ${tasaEfectiva.toFixed(2)}%`);
      }

      console.log('\n📊 Tasa configurada en el sistema: 2.11% mensual');
      console.log('   Las tasas efectivas reales pueden variar según comercio y fecha.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analizarComprasInteres();
