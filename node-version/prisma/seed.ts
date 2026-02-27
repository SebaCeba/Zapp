import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear categoría por defecto "Sin Categorizar"
  const uncategorized = await prisma.merchantCategory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Sin Categorizar',
      parentId: null,
      level: 1,
      order: 999,
      color: '#999999',
      icon: '❓',
      isSystem: true,
    },
  });

  console.log('✅ Categoría por defecto creada:', uncategorized.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
