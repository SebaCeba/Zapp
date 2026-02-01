const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearToken() {
  console.log('🗑️  Eliminando tokens de Google...\n');

  try {
    const result = await prisma.googleAuthToken.deleteMany({});
    
    console.log(`✅ Tokens eliminados: ${result.count}`);
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Ve a la página Tenpo en la app');
    console.log('   2. Haz clic en "Autorizar con Google"');
    console.log('   3. Completa el proceso de autenticación');
    console.log('   4. Haz clic en "Sincronizar" para traer tus compras\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearToken();
