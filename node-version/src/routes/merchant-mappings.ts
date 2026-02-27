import express from 'express';
import prisma from '../db';

const router = express.Router();

/**
 * GET /api/tenpo/merchants
 * Lista todos los comercios únicos de TenpoPurchases con su categoría actual
 */
router.get('/merchants', async (req, res) => {
  try {
    // Obtener todos los comercios únicos de TenpoPurchases
    const purchases = await prisma.tenpoPurchase.findMany({
      select: { merchant: true },
      distinct: ['merchant'],
      orderBy: { merchant: 'asc' }
    });

    const merchantNames = purchases.map(p => p.merchant);

    // Obtener los mappings existentes
    const mappings = await prisma.merchantMapping.findMany({
      where: {
        merchantName: { in: merchantNames }
      },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        }
      }
    });

    // Crear map para acceso rápido
    const mappingMap = new Map(
      mappings.map(m => [m.merchantName, m])
    );

    // Combinar información
    const merchants = merchantNames.map(name => ({
      name,
      mapping: mappingMap.get(name) || null,
      category: mappingMap.get(name)?.category || null
    }));

    res.json(merchants);
  } catch (error: any) {
    console.error('Error fetching merchants:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/merchants/uncategorized
 * Lista comercios sin categoría asignada (o asignados a "Sin Categorizar")
 */
router.get('/merchants/uncategorized', async (req, res) => {
  try {
    const uncategorizedId = 1; // ID de "Sin Categorizar"

    // Obtener todos los comercios únicos
    const purchases = await prisma.tenpoPurchase.findMany({
      select: { merchant: true },
      distinct: ['merchant']
    });

    const allMerchants = purchases.map(p => p.merchant);

    // Obtener comercios con categoría asignada (que no sea "Sin Categorizar")
    const categorizedMappings = await prisma.merchantMapping.findMany({
      where: {
        merchantName: { in: allMerchants },
        categoryId: { not: uncategorizedId }
      },
      select: { merchantName: true }
    });

    const categorizedNames = new Set(categorizedMappings.map(m => m.merchantName));

    // Filtrar comercios sin categoría o en "Sin Categorizar"
    const uncategorized = allMerchants.filter(name => !categorizedNames.has(name));

    res.json(uncategorized.sort());
  } catch (error: any) {
    console.error('Error fetching uncategorized merchants:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/merchants/:merchantName
 * Obtiene información de un comercio específico
 */
router.get('/merchants/:merchantName', async (req, res) => {
  try {
    const merchantName = decodeURIComponent(req.params.merchantName);

    // Verificar que el comercio existe en purchases
    const exists = await prisma.tenpoPurchase.findFirst({
      where: { merchant: merchantName },
      select: { id: true }
    });

    if (!exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    // Obtener mapping si existe
    const mapping = await prisma.merchantMapping.findUnique({
      where: { merchantName },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        }
      }
    });

    // Contar compras del comercio
    const purchaseCount = await prisma.tenpoPurchase.count({
      where: { merchant: merchantName }
    });

    res.json({
      merchantName,
      purchaseCount,
      mapping: mapping || null,
      category: mapping?.category || null
    });
  } catch (error: any) {
    console.error('Error fetching merchant:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/merchants/:merchantName/category
 * Asigna comercio a categoría
 * Body: { categoryId }
 */
router.post('/merchants/:merchantName/category', async (req, res) => {
  try {
    const merchantName = decodeURIComponent(req.params.merchantName);
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId es requerido' });
    }

    // Verificar que la categoría existe
    const category = await prisma.merchantCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar que el comercio existe en purchases
    const exists = await prisma.tenpoPurchase.findFirst({
      where: { merchant: merchantName }
    });

    if (!exists) {
      return res.status(404).json({ error: 'Comercio no encontrado en compras' });
    }

    // Crear o actualizar mapping
    const mapping = await prisma.merchantMapping.upsert({
      where: { merchantName },
      update: {
        categoryId,
        assignedBy: 'MANUAL',
        updatedAt: new Date()
      },
      create: {
        merchantName,
        categoryId,
        assignedBy: 'MANUAL'
      },
      include: {
        category: {
          include: {
            parent: {
              include: {
                parent: true
              }
            }
          }
        }
      }
    });

    res.json(mapping);
  } catch (error: any) {
    console.error('Error assigning merchant to category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tenpo/merchants/:merchantName/category
 * Remueve asignación de categoría (vuelve a "Sin Categorizar")
 */
router.delete('/merchants/:merchantName/category', async (req, res) => {
  try {
    const merchantName = decodeURIComponent(req.params.merchantName);
    const uncategorizedId = 1; // ID de "Sin Categorizar"

    // Verificar que existe el mapping
    const existing = await prisma.merchantMapping.findUnique({
      where: { merchantName }
    });

    if (!existing) {
      return res.status(404).json({ error: 'No hay asignación para este comercio' });
    }

    // Actualizar a "Sin Categorizar" en lugar de eliminar
    const updated = await prisma.merchantMapping.update({
      where: { merchantName },
      data: {
        categoryId: uncategorizedId,
        assignedBy: 'MANUAL',
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error removing merchant category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/merchants/batch-assign
 * Asigna múltiples comercios a una categoría
 * Body: { merchantNames: string[], categoryId: number }
 */
router.post('/merchants/batch-assign', async (req, res) => {
  try {
    const { merchantNames, categoryId } = req.body;

    if (!Array.isArray(merchantNames) || merchantNames.length === 0) {
      return res.status(400).json({ error: 'merchantNames debe ser un array con al menos un elemento' });
    }

    if (!categoryId) {
      return res.status(400).json({ error: 'categoryId es requerido' });
    }

    // Verificar que la categoría existe
    const category = await prisma.merchantCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Verificar que todos los comercios existen
    const existingMerchants = await prisma.tenpoPurchase.findMany({
      where: { merchant: { in: merchantNames } },
      select: { merchant: true },
      distinct: ['merchant']
    });

    const existingNames = new Set(existingMerchants.map(m => m.merchant));
    const notFound = merchantNames.filter(name => !existingNames.has(name));

    if (notFound.length > 0) {
      return res.status(404).json({ 
        error: `Comercios no encontrados: ${notFound.join(', ')}` 
      });
    }

    // Crear/actualizar mappings en transacción
    const results = await prisma.$transaction(
      merchantNames.map(merchantName =>
        prisma.merchantMapping.upsert({
          where: { merchantName },
          update: {
            categoryId,
            assignedBy: 'MANUAL',
            updatedAt: new Date()
          },
          create: {
            merchantName,
            categoryId,
            assignedBy: 'MANUAL'
          }
        })
      )
    );

    res.json({
      message: `${results.length} comercio(s) asignado(s) exitosamente`,
      count: results.length
    });
  } catch (error: any) {
    console.error('Error batch assigning merchants:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
