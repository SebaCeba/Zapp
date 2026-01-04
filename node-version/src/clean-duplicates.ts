import prisma from './db';

async function cleanDuplicates() {
  console.log('🧹 Limpiando duplicados...');

  const subs = await prisma.subscription.findMany({
    orderBy: { id: 'asc' }
  });

  const seen = new Map<string, number>();
  let deletedCount = 0;

  for (const sub of subs) {
    const key = `${sub.name}-${sub.startDate.toISOString()}`;
    
    if (seen.has(key)) {
      await prisma.subscription.delete({
        where: { id: sub.id }
      });
      console.log(`Eliminado duplicado: ${sub.name}`);
      deletedCount++;
    } else {
      seen.set(key, sub.id);
    }
  }

  console.log(`✅ ${deletedCount} duplicados eliminados`);
}

cleanDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
