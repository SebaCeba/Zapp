const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenpoStatus() {
  console.log('🔍 Verificando estado de integración Tenpo...\n');

  try {
    // 1. Verificar autenticación Google
    const tokens = await prisma.googleAuthToken.findFirst();
    console.log('1️⃣  Autenticación Google:');
    if (tokens) {
      console.log('   ✅ Token encontrado');
      console.log(`   📅 Creado: ${tokens.createdAt}`);
      console.log(`   ⏰ Expira: ${tokens.expiryDate}`);
      const expired = new Date() >= tokens.expiryDate;
      console.log(`   ${expired ? '❌ EXPIRADO' : '✅ VIGENTE'}`);
    } else {
      console.log('   ❌ NO HAY TOKEN - Debes autenticarte en la app');
    }

    // 2. Verificar emails descargados
    console.log('\n2️⃣  Emails de Tenpo:');
    const totalEmails = await prisma.tenpoEmail.count();
    const emailsCompras = await prisma.tenpoEmail.count({ where: { labelType: 'COMPRAS' } });
    const emailsPagos = await prisma.tenpoEmail.count({ where: { labelType: 'PAGOS' } });
    const emailsOk = await prisma.tenpoEmail.count({ where: { parsedOk: true } });
    const emailsError = await prisma.tenpoEmail.count({ where: { parsedOk: false } });

    console.log(`   Total emails: ${totalEmails}`);
    console.log(`   📧 Compras: ${emailsCompras}`);
    console.log(`   💰 Pagos: ${emailsPagos}`);
    console.log(`   ✅ Parseados OK: ${emailsOk}`);
    console.log(`   ❌ Con errores: ${emailsError}`);

    if (totalEmails === 0) {
      console.log('\n   ⚠️  NO HAY EMAILS - Debes hacer clic en "Sincronizar" en la app');
    }

    // 3. Verificar compras registradas
    console.log('\n3️⃣  Compras registradas:');
    const totalPurchases = await prisma.tenpoPurchase.count();
    console.log(`   Total compras: ${totalPurchases}`);

    if (totalPurchases > 0) {
      const recentPurchases = await prisma.tenpoPurchase.findMany({
        take: 5,
        orderBy: { purchaseDate: 'desc' },
        select: {
          purchaseDate: true,
          merchant: true,
          amountTotalClp: true,
          installmentsCount: true
        }
      });

      console.log('\n   Últimas 5 compras:');
      recentPurchases.forEach(p => {
        const date = new Date(p.purchaseDate).toLocaleDateString('es-CL');
        const merchant = p.merchant.substring(0, 35).padEnd(35);
        const amount = `$${p.amountTotalClp.toLocaleString('es-CL')}`.padStart(12);
        console.log(`   ${date} | ${merchant} | ${amount} | ${p.installmentsCount}x`);
      });
    } else {
      console.log('   ⚠️  NO HAY COMPRAS REGISTRADAS');
    }

    // 4. Verificar pagos registrados
    console.log('\n4️⃣  Pagos registrados:');
    const totalPayments = await prisma.tenpoPayment.count();
    console.log(`   Total pagos: ${totalPayments}`);

    // 5. Diagnóstico
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNÓSTICO:');
    console.log('='.repeat(60));

    if (!tokens) {
      console.log('❌ Problema: No hay autenticación con Google');
      console.log('   Solución: Ve a la página Tenpo en la app y autentica con Google');
    } else if (totalEmails === 0) {
      console.log('❌ Problema: No se han descargado emails de Gmail');
      console.log('   Solución: Haz clic en el botón "Sincronizar" en la página Tenpo');
    } else if (emailsError > 0) {
      console.log(`⚠️  Hay ${emailsError} emails con errores de parsing`);
      console.log('   Ejecuta: node scripts/check-parse-errors.js');
    } else {
      console.log('✅ Todo está correcto!');
      console.log(`   - ${totalEmails} emails sincronizados`);
      console.log(`   - ${totalPurchases} compras registradas`);
      console.log(`   - ${totalPayments} pagos registrados`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenpoStatus();
