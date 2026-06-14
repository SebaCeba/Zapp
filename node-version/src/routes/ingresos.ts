import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// ========== INGRESOS BASE (Catálogo) ==========

// GET all ingresos base
router.get('/catalogo', async (_req: Request, res: Response) => {
  try {
    const ingresos = await prisma.ingresoBase.findMany({
      orderBy: [{ activo: 'desc' }, { orden: 'asc' }]
    });
    res.json(ingresos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ingresos base' });
  }
});

// POST new ingreso base
router.post('/catalogo', async (req: Request, res: Response) => {
  try {
    const { nombre, esRecurrente } = req.body;

    // Validar nombre único
    const existe = await prisma.ingresoBase.findFirst({
      where: { nombre, activo: true }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un ingreso con ese nombre' });
    }

    // Obtener el último orden
    const maxOrden = await prisma.ingresoBase.aggregate({
      _max: { orden: true }
    });

    const ingreso = await prisma.ingresoBase.create({
      data: {
        nombre,
        activo: true,
        esRecurrente: esRecurrente !== false,
        orden: (maxOrden._max.orden || 0) + 1
      }
    });

    res.status(201).json(ingreso);
  } catch (error) {
    res.status(400).json({ error: 'Invalid ingreso data' });
  }
});

// PATCH update ingreso base (renombrar)
router.patch('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    // Validar nombre único
    const existe = await prisma.ingresoBase.findFirst({
      where: { 
        nombre, 
        activo: true,
        NOT: { id: parseInt(id) }
      }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un ingreso con ese nombre' });
    }

    const ingreso = await prisma.ingresoBase.update({
      where: { id: parseInt(id) },
      data: { nombre }
    });

    res.json(ingreso);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update ingreso' });
  }
});

// PATCH toggle activo/inactivo
router.patch('/catalogo/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ingresoActual = await prisma.ingresoBase.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ingresoActual) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    const ingreso = await prisma.ingresoBase.update({
      where: { id: parseInt(id) },
      data: { activo: !ingresoActual.activo }
    });

    res.json(ingreso);
  } catch (error) {
    res.status(400).json({ error: 'Failed to toggle ingreso' });
  }
});

// DELETE ingreso base
router.delete('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ingreso = await prisma.ingresoBase.findUnique({
      where: { id: parseInt(id) },
      include: { presupuestos: true }
    });

    if (!ingreso) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    if (ingreso.presupuestos.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un ingreso con presupuestos asociados' });
    }

    await prisma.ingresoBase.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete ingreso' });
  }
});

// ========== PRESUPUESTOS ==========

// GET presupuestos por año
router.get('/presupuesto/:anio', async (req: Request, res: Response) => {
  try {
    const { anio } = req.params;
    
    const ingresos = await prisma.ingresoBase.findMany({
      where: { activo: true },
      include: {
        presupuestos: {
          where: { anio: parseInt(anio) }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json(ingresos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch presupuestos' });
  }
});

// PUT presupuesto para un ingreso y año específico
router.put('/presupuesto', async (req: Request, res: Response) => {
  try {
    const { ingresoId, anio, ...meses } = req.body;

    // Validar que el ingreso existe
    const ingreso = await prisma.ingresoBase.findUnique({
      where: { id: ingresoId }
    });

    if (!ingreso) {
      return res.status(404).json({ error: 'Ingreso no encontrado' });
    }

    // Upsert: crear o actualizar
    const presupuesto = await prisma.presupuestoIngreso.upsert({
      where: {
        ingresoId_anio: {
          ingresoId,
          anio
        }
      },
      update: { ...meses },
      create: {
        ingresoId,
        anio,
        ...meses
      }
    });

    res.json(presupuesto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to save presupuesto' });
  }
});

// PATCH actualizar un solo mes del presupuesto
router.patch('/presupuesto/:ingresoId/:anio/:mes', async (req: Request, res: Response) => {
  try {
    const { ingresoId, anio, mes } = req.params;
    const { monto } = req.body;

    const mesField = mes.toLowerCase();
    const validMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    if (!validMeses.includes(mesField)) {
      return res.status(400).json({ error: 'Mes inválido' });
    }

    // Obtener presupuesto existente o crear uno nuevo
    let presupuesto = await prisma.presupuestoIngreso.findUnique({
      where: {
        ingresoId_anio: {
          ingresoId: parseInt(ingresoId),
          anio: parseInt(anio)
        }
      }
    });

    if (!presupuesto) {
      presupuesto = await prisma.presupuestoIngreso.create({
        data: {
          ingresoId: parseInt(ingresoId),
          anio: parseInt(anio),
          [mesField]: parseFloat(monto) || 0
        }
      });
    } else {
      presupuesto = await prisma.presupuestoIngreso.update({
        where: {
          ingresoId_anio: {
            ingresoId: parseInt(ingresoId),
            anio: parseInt(anio)
          }
        },
        data: {
          [mesField]: parseFloat(monto) || 0
        }
      });
    }

    res.json(presupuesto);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update mes' });
  }
});

export default router;
