import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET all ahorros
router.get('/catalogo', async (_req: Request, res: Response) => {
  try {
    const ahorros = await prisma.ahorro.findMany({
      orderBy: [{ activo: 'desc' }, { orden: 'asc' }]
    });
    res.json(ahorros);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ahorros' });
  }
});

// POST new ahorro
router.post('/catalogo', async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    // Validar nombre único
    const existe = await prisma.ahorro.findFirst({
      where: { nombre, activo: true }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un ahorro con ese nombre' });
    }

    // Obtener el último orden
    const maxOrden = await prisma.ahorro.aggregate({
      _max: { orden: true }
    });

    const ahorro = await prisma.ahorro.create({
      data: {
        nombre,
        activo: true,
        orden: (maxOrden._max.orden || 0) + 1
      }
    });

    res.status(201).json(ahorro);
  } catch (error) {
    res.status(400).json({ error: 'Invalid ahorro data' });
  }
});

// PATCH update ahorro (renombrar)
router.patch('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    // Validar nombre único
    const existe = await prisma.ahorro.findFirst({
      where: { 
        nombre, 
        activo: true,
        NOT: { id: parseInt(id) }
      }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un ahorro con ese nombre' });
    }

    const ahorro = await prisma.ahorro.update({
      where: { id: parseInt(id) },
      data: { nombre }
    });

    res.json(ahorro);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update ahorro' });
  }
});

// PATCH toggle activo/inactivo
router.patch('/catalogo/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ahorroActual = await prisma.ahorro.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ahorroActual) {
      return res.status(404).json({ error: 'Ahorro no encontrado' });
    }

    const ahorro = await prisma.ahorro.update({
      where: { id: parseInt(id) },
      data: { activo: !ahorroActual.activo }
    });

    res.json(ahorro);
  } catch (error) {
    res.status(400).json({ error: 'Failed to toggle ahorro' });
  }
});

// DELETE ahorro (solo si sin presupuestos)
router.delete('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const ahorro = await prisma.ahorro.findUnique({
      where: { id: parseInt(id) },
      include: { presupuestos: true }
    });

    if (!ahorro) {
      return res.status(404).json({ error: 'Ahorro no encontrado' });
    }

    if (ahorro.presupuestos.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un ahorro con presupuestos asociados' });
    }

    await prisma.ahorro.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete ahorro' });
  }
});

// GET presupuestos por año
router.get('/presupuesto/:anio', async (req: Request, res: Response) => {
  try {
    const { anio } = req.params;
    
    const ahorros = await prisma.ahorro.findMany({
      where: { activo: true },
      include: {
        presupuestos: {
          where: { anio: parseInt(anio) }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json(ahorros);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch presupuestos' });
  }
});

// PATCH actualizar un solo mes del presupuesto
router.patch('/presupuesto/:ahorroId/:anio/:mes', async (req: Request, res: Response) => {
  try {
    const { ahorroId, anio, mes } = req.params;
    const { monto } = req.body;

    const mesField = mes.toLowerCase();
    const validMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    if (!validMeses.includes(mesField)) {
      return res.status(400).json({ error: 'Mes inválido' });
    }

    // Obtener presupuesto existente o crear uno nuevo
    let presupuesto = await prisma.presupuestoAhorro.findUnique({
      where: {
        ahorroId_anio: {
          ahorroId: parseInt(ahorroId),
          anio: parseInt(anio)
        }
      }
    });

    if (!presupuesto) {
      presupuesto = await prisma.presupuestoAhorro.create({
        data: {
          ahorroId: parseInt(ahorroId),
          anio: parseInt(anio),
          [mesField]: parseFloat(monto) || 0
        }
      });
    } else {
      presupuesto = await prisma.presupuestoAhorro.update({
        where: {
          ahorroId_anio: {
            ahorroId: parseInt(ahorroId),
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
