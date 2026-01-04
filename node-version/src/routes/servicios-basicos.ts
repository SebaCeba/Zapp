import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET all servicios básicos
router.get('/catalogo', async (_req: Request, res: Response) => {
  try {
    const servicios = await prisma.servicioBasico.findMany({
      orderBy: [{ activo: 'desc' }, { orden: 'asc' }]
    });
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servicios básicos' });
  }
});

// POST new servicio básico (personalizado)
router.post('/catalogo', async (req: Request, res: Response) => {
  try {
    const { nombre } = req.body;

    // Validar nombre único
    const existe = await prisma.servicioBasico.findFirst({
      where: { nombre, activo: true }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    }

    // Obtener el último orden
    const maxOrden = await prisma.servicioBasico.aggregate({
      _max: { orden: true }
    });

    const servicio = await prisma.servicioBasico.create({
      data: {
        nombre,
        activo: true,
        esBase: false,
        orden: (maxOrden._max.orden || 0) + 1
      }
    });

    res.status(201).json(servicio);
  } catch (error) {
    res.status(400).json({ error: 'Invalid servicio data' });
  }
});

// PATCH update servicio básico (renombrar)
router.patch('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    // Validar nombre único
    const existe = await prisma.servicioBasico.findFirst({
      where: { 
        nombre, 
        activo: true,
        NOT: { id: parseInt(id) }
      }
    });

    if (existe) {
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' });
    }

    const servicio = await prisma.servicioBasico.update({
      where: { id: parseInt(id) },
      data: { nombre }
    });

    res.json(servicio);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update servicio' });
  }
});

// PATCH toggle activo/inactivo
router.patch('/catalogo/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const servicioActual = await prisma.servicioBasico.findUnique({
      where: { id: parseInt(id) }
    });

    if (!servicioActual) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const servicio = await prisma.servicioBasico.update({
      where: { id: parseInt(id) },
      data: { activo: !servicioActual.activo }
    });

    res.json(servicio);
  } catch (error) {
    res.status(400).json({ error: 'Failed to toggle servicio' });
  }
});

// DELETE servicio básico (solo si es personalizado y sin presupuestos)
router.delete('/catalogo/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const servicio = await prisma.servicioBasico.findUnique({
      where: { id: parseInt(id) },
      include: { presupuestos: true }
    });

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (servicio.esBase) {
      return res.status(400).json({ error: 'No se pueden eliminar servicios base' });
    }

    if (servicio.presupuestos.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un servicio con presupuestos asociados' });
    }

    await prisma.servicioBasico.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete servicio' });
  }
});

// GET presupuestos por año
router.get('/presupuesto/:anio', async (req: Request, res: Response) => {
  try {
    const { anio } = req.params;
    
    const servicios = await prisma.servicioBasico.findMany({
      where: { activo: true },
      include: {
        presupuestos: {
          where: { anio: parseInt(anio) }
        }
      },
      orderBy: { orden: 'asc' }
    });

    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch presupuestos' });
  }
});

// POST/PUT presupuesto para un servicio y año específico
router.put('/presupuesto', async (req: Request, res: Response) => {
  try {
    const { servicioId, anio, ...meses } = req.body;

    // Validar que el servicio existe
    const servicio = await prisma.servicioBasico.findUnique({
      where: { id: servicioId }
    });

    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Upsert: crear o actualizar
    const presupuesto = await prisma.presupuestoServicioBasico.upsert({
      where: {
        servicioId_anio: {
          servicioId,
          anio
        }
      },
      update: { ...meses },
      create: {
        servicioId,
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
router.patch('/presupuesto/:servicioId/:anio/:mes', async (req: Request, res: Response) => {
  try {
    const { servicioId, anio, mes } = req.params;
    const { monto } = req.body;

    const mesField = mes.toLowerCase();
    const validMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    if (!validMeses.includes(mesField)) {
      return res.status(400).json({ error: 'Mes inválido' });
    }

    // Obtener presupuesto existente o crear uno nuevo
    let presupuesto = await prisma.presupuestoServicioBasico.findUnique({
      where: {
        servicioId_anio: {
          servicioId: parseInt(servicioId),
          anio: parseInt(anio)
        }
      }
    });

    if (!presupuesto) {
      presupuesto = await prisma.presupuestoServicioBasico.create({
        data: {
          servicioId: parseInt(servicioId),
          anio: parseInt(anio),
          [mesField]: parseFloat(monto) || 0
        }
      });
    } else {
      presupuesto = await prisma.presupuestoServicioBasico.update({
        where: {
          servicioId_anio: {
            servicioId: parseInt(servicioId),
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
