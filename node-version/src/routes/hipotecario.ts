import { Router, Request, Response } from 'express';
import prisma from '../db';
import multer from 'multer';
import { syncHipotecarioToFact } from '../services/hipotecarioSync';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET config (año proyectado)
router.get('/config', async (_req: Request, res: Response) => {
  try {
    let config = await prisma.mortgageBudgetConfig.findFirst();
    if (!config) {
      config = await prisma.mortgageBudgetConfig.create({
        data: { anioProyectado: new Date().getFullYear() }
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

// PUT config (actualizar año proyectado)
router.put('/config', async (req: Request, res: Response) => {
  try {
    const { anioProyectado } = req.body;
    let config = await prisma.mortgageBudgetConfig.findFirst();
    
    if (!config) {
      config = await prisma.mortgageBudgetConfig.create({
        data: { anioProyectado: parseInt(anioProyectado) }
      });
    } else {
      config = await prisma.mortgageBudgetConfig.update({
        where: { id: config.id },
        data: { anioProyectado: parseInt(anioProyectado) }
      });
    }
    
    // Sincronizar con FACT después de cambiar el año
    const syncResult = await syncHipotecarioToFact(parseInt(anioProyectado));
    if (!syncResult.success) {
      console.log('[HipotecarioAPI] ⚠️ Sincronización con FACT falló:', syncResult.errors);
    }
    
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: 'Invalid config data' });
  }
});

// GET payments
router.get('/payments', async (_req: Request, res: Response) => {
  try {
    const payments = await prisma.mortgagePayment.findMany({
      orderBy: { numDiv: 'asc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST import CSV
router.post('/import-csv', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV vacío o inválido' });
    }

    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    
    // Validar columnas requeridas (com_d_in_uf es el nombre real en el CSV de Itaú)
    const requiredCols = ['num_div', 'amortizacion_uf', 'interes_uf', 'com_d_in_uf', 'total_div_uf', 'fecha_vencimiento', 'saldo_insoluto_uf'];
    const missingCols = requiredCols.filter(col => !headers.includes(col));
    
    if (missingCols.length > 0) {
      return res.status(400).json({ 
        error: `Faltan columnas requeridas: ${missingCols.join(', ')}` 
      });
    }

    // Limpiar tabla anterior
    await prisma.mortgagePayment.deleteMany();

    // Parsear y guardar
    const payments = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      // Parse con soporte para coma decimal
      const parseDecimal = (val: string) => {
        return parseFloat(val.replace(/\./g, '').replace(',', '.'));
      };

      const parseFecha = (val: string) => {
        // Acepta tanto dd/mm/yyyy como dd-mm-yyyy
        const [day, month, year] = val.split(/[/-]/);
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      };

      payments.push({
        numDiv: parseInt(row.num_div),
        amortizacionUf: parseDecimal(row.amortizacion_uf),
        interesUf: parseDecimal(row.interes_uf),
        comDIn: parseDecimal(row.com_d_in_uf),
        totalDivUf: parseDecimal(row.total_div_uf),
        fechaVencimiento: parseFecha(row.fecha_vencimiento),
        saldoInsolutoUf: parseDecimal(row.saldo_insoluto_uf)
      });
    }

    await prisma.mortgagePayment.createMany({ data: payments });

    // Sincronizar con FACT después de importar
    const syncResult = await syncHipotecarioToFact();
    if (!syncResult.success) {
      console.log('[HipotecarioAPI] ⚠️ Sincronización con FACT falló:', syncResult.errors);
    }

    res.json({ 
      success: true, 
      count: payments.length,
      message: `${payments.length} cuotas importadas exitosamente`,
      factsCreated: syncResult.success ? syncResult.factsCreated : 0
    });
  } catch (error: any) {
    console.error('CSV Import Error:', error);
    res.status(400).json({ error: error.message || 'Error al procesar CSV' });
  }
});

// GET seguros
router.get('/seguros', async (_req: Request, res: Response) => {
  try {
    const seguros = await prisma.mortgageInsurance.findMany({
      orderBy: { mesAnio: 'asc' }
    });
    res.json(seguros);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seguros' });
  }
});

// POST seguro - crea 12 registros (uno por cada mes del año)
router.post('/seguros', async (req: Request, res: Response) => {
  try {
    const { nombre, anio, monto, moneda = 'CLP' } = req.body;
    
    if (!nombre || !anio || !monto) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, anio, monto' });
    }

    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat)) {
      return res.status(400).json({ error: 'Monto inválido' });
    }
    
    // Crear 12 registros, uno por cada mes
    const seguros = [];
    for (let mes = 1; mes <= 12; mes++) {
      const mesAnio = `${anio}-${mes.toString().padStart(2, '0')}`;
      seguros.push({
        nombre,
        mesAnio,
        monto: montoFloat,
        moneda
      });
    }
    
    await prisma.mortgageInsurance.createMany({ data: seguros });
    
    // Sincronizar con FACT después de agregar seguro
    const syncResult = await syncHipotecarioToFact();
    if (!syncResult.success) {
      console.log('[HipotecarioAPI] ⚠️ Sincronización con FACT falló:', syncResult.errors);
    }
    
    res.json({ 
      success: true, 
      count: 12, 
      message: `Seguro "${nombre}" agregado para todo ${anio}`,
      factsCreated: syncResult.success ? syncResult.factsCreated : 0
    });
  } catch (error) {
    console.error('Error al crear seguro:', error);
    res.status(400).json({ error: 'Invalid seguro data' });
  }
});

// DELETE seguro por nombre y año (elimina los 12 meses)
rout// Sincronizar con FACT después de eliminar seguro
    const syncResult = await syncHipotecarioToFact(parseInt(anio));
    if (!syncResult.success) {
      console.log('[HipotecarioAPI] ⚠️ Sincronización con FACT falló:', syncResult.errors);
    }
    
    er.delete('/seguros/:nombre/:anio', async (req: Request, res: Response) => {
  try {
    const { nombre, anio } = req.params;
    
    await prisma.mortgageInsurance.deleteMany({
      where: {
        nombre,
        mesAnio: { startsWith: `${anio}-` }
      }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: 'Seguro not found' });
  }
});

export default router;
