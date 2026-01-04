import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET presupuesto por año
router.get('/presupuesto/:anio', async (req: Request, res: Response) => {
  try {
    const anio = parseInt(req.params.anio);
    
    let presupuesto = await prisma.supermercadoPresupuesto.findUnique({
      where: { anio }
    });

    // Si no existe, crear uno nuevo con valores en 0
    if (!presupuesto) {
      presupuesto = await prisma.supermercadoPresupuesto.create({
        data: { anio }
      });
    }

    res.json(presupuesto);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch presupuesto' });
  }
});

// PATCH actualizar un mes específico
router.patch('/presupuesto/:anio/:mes', async (req: Request, res: Response) => {
  try {
    const anio = parseInt(req.params.anio);
    const mes = req.params.mes;
    const { monto } = req.body;

    // Validar que el mes sea válido
    const mesesValidos = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    if (!mesesValidos.includes(mes)) {
      return res.status(400).json({ error: 'Mes inválido' });
    }

    // Buscar o crear presupuesto
    let presupuesto = await prisma.supermercadoPresupuesto.findUnique({
      where: { anio }
    });

    if (!presupuesto) {
      presupuesto = await prisma.supermercadoPresupuesto.create({
        data: { anio }
      });
    }

    // Actualizar el mes específico
    const updated = await prisma.supermercadoPresupuesto.update({
      where: { anio },
      data: {
        [mes]: parseFloat(monto) || 0
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update presupuesto' });
  }
});

export default router;
