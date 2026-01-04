import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

// GET all obligaciones
router.get('/', async (_req: Request, res: Response) => {
  try {
    const obligaciones = await prisma.obligacion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(obligaciones);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch obligaciones' });
  }
});

// POST new obligacion
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, tipo, moneda, montoCuota, cuotasTotales, mesInicio, anioInicio } = req.body;
    
    const obligacion = await prisma.obligacion.create({
      data: {
        nombre,
        tipo,
        moneda,
        montoCuota: parseFloat(montoCuota),
        cuotasTotales: parseInt(cuotasTotales),
        mesInicio: parseInt(mesInicio),
        anioInicio: parseInt(anioInicio)
      }
    });

    res.status(201).json(obligacion);
  } catch (error) {
    res.status(400).json({ error: 'Invalid obligacion data' });
  }
});

// DELETE obligacion
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.obligacion.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Obligacion not found' });
  }
});

// GET/POST supuesto anual
router.get('/supuestos/:anio', async (req: Request, res: Response) => {
  try {
    const anio = parseInt(req.params.anio);
    let supuesto = await prisma.supuestoAnual.findUnique({
      where: { anio }
    });
    
    if (!supuesto) {
      // Crear supuesto por defecto si no existe
      supuesto = await prisma.supuestoAnual.create({
        data: {
          anio,
          valorUfBase: 37000,
          variacionAnualUf: 4.0
        }
      });
    }
    
    res.json(supuesto);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supuesto anual' });
  }
});

router.post('/supuestos', async (req: Request, res: Response) => {
  try {
    const { anio, valorUfBase, variacionAnualUf } = req.body;
    
    const supuesto = await prisma.supuestoAnual.upsert({
      where: { anio: parseInt(anio) },
      update: {
        valorUfBase: parseFloat(valorUfBase),
        variacionAnualUf: parseFloat(variacionAnualUf)
      },
      create: {
        anio: parseInt(anio),
        valorUfBase: parseFloat(valorUfBase),
        variacionAnualUf: parseFloat(variacionAnualUf)
      }
    });
    
    res.json(supuesto);
  } catch (error) {
    res.status(400).json({ error: 'Invalid supuesto data' });
  }
});

export default router;
