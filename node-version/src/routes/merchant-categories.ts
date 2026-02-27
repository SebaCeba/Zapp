import express from 'express';
import prisma from '../db';

const router = express.Router();

/**
 * GET /api/tenpo/categories
 * Lista todas las categorías (árbol o plano)
 * Query: ?flat=true para lista plana
 */
router.get('/categories', async (req, res) => {
  try {
    const flat = req.query.flat === 'true';

    if (flat) {
      // Lista plana con información del parent
      const categories = await prisma.merchantCategory.findMany({
        include: {
          parent: {
            select: { id: true, name: true }
          },
          _count: {
            select: { merchants: true, children: true }
          }
        },
        orderBy: [
          { level: 'asc' },
          { order: 'asc' },
          { name: 'asc' }
        ]
      });

      return res.json(categories);
    }

    // Árbol jerárquico (solo nivel 1 con children anidados)
    const rootCategories = await prisma.merchantCategory.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                _count: {
                  select: { merchants: true }
                }
              },
              orderBy: [{ order: 'asc' }, { name: 'asc' }]
            },
            _count: {
              select: { merchants: true, children: true }
            }
          },
          orderBy: [{ order: 'asc' }, { name: 'asc' }]
        },
        _count: {
          select: { merchants: true, children: true }
        }
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });

    res.json(rootCategories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/categories/:id
 * Obtiene una categoría específica con sus relaciones
 */
router.get('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const category = await prisma.merchantCategory.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        merchants: {
          select: {
            id: true,
            merchantName: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: { merchants: true, children: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/categories
 * Crea nueva categoría
 * Body: { name, parentId?, level, color?, icon?, order? }
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, parentId, level, color, icon, order } = req.body;

    // Validaciones
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!level || level < 1 || level > 3) {
      return res.status(400).json({ error: 'El nivel debe ser 1, 2 o 3' });
    }

    // Si tiene parent, validar que el nivel sea coherente
    if (parentId) {
      const parent = await prisma.merchantCategory.findUnique({
        where: { id: parentId }
      });

      if (!parent) {
        return res.status(404).json({ error: 'Categoría padre no encontrada' });
      }

      // El nivel del hijo debe ser parent.level + 1
      if (level !== parent.level + 1) {
        return res.status(400).json({ 
          error: `El nivel debe ser ${parent.level + 1} (nivel del padre + 1)` 
        });
      }

      // No permitir más de 3 niveles
      if (parent.level >= 3) {
        return res.status(400).json({ error: 'No se pueden crear más de 3 niveles de categorías' });
      }
    } else {
      // Si no tiene parent, debe ser nivel 1
      if (level !== 1) {
        return res.status(400).json({ error: 'Las categorías raíz deben ser nivel 1' });
      }
    }

    const category = await prisma.merchantCategory.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        level,
        color: color || null,
        icon: icon || null,
        order: order || 0
      },
      include: {
        parent: true,
        _count: {
          select: { merchants: true, children: true }
        }
      }
    });

    res.status(201).json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tenpo/categories/:id
 * Actualiza categoría existente
 * Body: { name?, parentId?, color?, icon?, order? }
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, parentId, color, icon, order } = req.body;

    // Verificar que existe
    const existing = await prisma.merchantCategory.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // No permitir editar categorías del sistema
    if (existing.isSystem && name !== undefined && name !== existing.name) {
      return res.status(400).json({ error: 'No se puede cambiar el nombre de categorías del sistema' });
    }

    // Validar cambio de parent (si aplica)
    if (parentId !== undefined && parentId !== existing.parentId) {
      if (parentId === id) {
        return res.status(400).json({ error: 'Una categoría no puede ser su propio padre' });
      }

      // Verificar que el nuevo parent existe
      if (parentId !== null) {
        const newParent = await prisma.merchantCategory.findUnique({
          where: { id: parentId }
        });

        if (!newParent) {
          return res.status(404).json({ error: 'Categoría padre no encontrada' });
        }

        // Verificar que no se cree un ciclo
        // (pendiente: implementar validación de ciclos si es necesario)
      }
    }

    const updated = await prisma.merchantCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parentId !== undefined && { parentId }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order })
      },
      include: {
        parent: true,
        _count: {
          select: { merchants: true, children: true }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tenpo/categories/:id
 * Elimina categoría (solo si no tiene comercios asignados)
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const category = await prisma.merchantCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { merchants: true, children: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // No permitir eliminar categorías del sistema
    if (category.isSystem) {
      return res.status(400).json({ error: 'No se pueden eliminar categorías del sistema' });
    }

    // No permitir eliminar si tiene comercios asignados
    if (category._count.merchants > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar. Tiene ${category._count.merchants} comercio(s) asignado(s)` 
      });
    }

    // Mover hijos a "Sin Categorizar" o al parent de esta categoría
    if (category._count.children > 0) {
      const uncategorizedId = 1; // ID de "Sin Categorizar"
      const newParentId = category.parentId || uncategorizedId;

      await prisma.merchantCategory.updateMany({
        where: { parentId: id },
        data: { 
          parentId: newParentId,
          level: category.level // Mantener el nivel actual
        }
      });
    }

    await prisma.merchantCategory.delete({
      where: { id }
    });

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
