const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkParseErrors() {
  try {
    console.log('🔍 Verificando errores de parsing...\n');

    // Emails con errores de parsing
    const emailsWithErrors = await prisma.tenpoEmail.findMany({
      where: {
        parsedOk: false
      },
      orderBy: {
        emailDate: 'desc'
      }
    });

    console.log(`❌ Emails con errores de parsing: ${emailsWithErrors.length}\n`);

    if (emailsWithErrors.length > 0) {
      console.log('Primeros 10 errores:\n');
      emailsWithErrors.slice(0, 10).forEach((email, idx) => {
        console.log(`${idx + 1}. Gmail ID: ${email.gmailMessageId}`);
        console.log(`   Fecha: ${email.emailDate}`);
        console.log(`   Label: ${email.labelType}`);
        console.log(`   Error: ${email.parseError}`);
        
        // Buscar PENALOLE
        if (email.rawBody.includes('PENALOLE')) {
          console.log(`   ⚠️  CONTIENE "PENALOLE" ⚠️`);
          
          // Mostrar fragmento del body
          const lines = email.rawBody.split('\n');
          const comercioIdx = lines.findIndex(l => l.includes('Comercio'));
          if (comercioIdx >= 0) {
            console.log(`   Body (líneas ${comercioIdx}-${comercioIdx + 5}):`);
            lines.slice(comercioIdx, comercioIdx + 6).forEach(l => {
              console.log(`     ${l}`);
            });
          }
        }
        console.log('');
      });
    }

    // Emails parseados correctamente
    const emailsOk = await prisma.tenpoEmail.findMany({
      where: {
        parsedOk: true
      }
    });

    console.log(`\n✅ Emails parseados correctamente: ${emailsOk.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParseErrors();
