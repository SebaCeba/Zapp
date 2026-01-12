import express from 'express';
import prisma from '../db';
import { gmailService } from '../services/gmail.service';
import { tenpoParserService } from '../services/tenpo-parser.service';
import { tenpoCalculatorService } from '../services/tenpo-calculator.service';
import { tenpoConfigService } from '../services/tenpo-config.service';
import { startOfMonth, endOfMonth, addMonths } from 'date-fns';

const router = express.Router();

/**
 * GET /api/tenpo/debug/labels
 * Lista todas las etiquetas de Gmail para debug
 */
router.get('/debug/labels', async (req, res) => {
  try {
    const gmail = await gmailService.getAuthenticatedClient();
    const response = await gmail.users.labels.list({ userId: 'me' });
    
    const labels = response.data.labels?.map(l => ({
      id: l.id,
      name: l.name,
      type: l.type
    })) || [];

    res.json(labels);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/sync
 * Sincroniza emails de Gmail con etiquetas Tenpo
 */
router.post('/sync', async (req, res) => {
  console.log('🔄 Iniciando sincronización Tenpo...');
  try {
    const comprasLabel = 'Tenpo/Compras TC Tenpo';
    const pagosLabel = 'Tenpo/Pagos TC Tenpo';

    let newCompras = 0;
    let skippedCompras = 0;
    let newPagos = 0;
    let skippedPagos = 0;
    let errors: string[] = [];

    // Sincronizar compras
    try {
      console.log(`📧 Buscando emails con etiqueta: ${comprasLabel}`);
      const comprasMessages = await gmailService.getEmailsByLabel(comprasLabel);
      console.log(`✅ Encontrados ${comprasMessages.length} mensajes de compras`);
      
      for (const message of comprasMessages) {
        const gmailMessageId = message.id!;
        
        // Verificar si ya existe
        const exists = await prisma.tenpoEmail.findUnique({
          where: { gmailMessageId }
        });

        if (exists) {
          skippedCompras++;
          continue;
        }

        const rawBody = gmailService.extractBodyFromMessage(message);
        const emailDate = gmailService.getMessageDate(message);

        // Parsear compra
        const parsedPurchase = tenpoParserService.parsePurchaseEmail(rawBody);
        
        if (parsedPurchase) {
          // Obtener tasa vigente a la fecha de compra
          const tasaConfig = await tenpoConfigService.getTasaVigente(parsedPurchase.purchaseDate);
          const tasaMensual = tasaConfig?.tasaMensual || 0.0211; // Fallback 2.11%

          // Determinar si tiene interés (default TRUE para compras con n_cuotas > 1)
          const tieneInteres = parsedPurchase.installmentsCount > 1;

          // Calcular cuotas usando el nuevo sistema
          const primeraFechaVencimiento = tenpoParserService.calculateDueDate(parsedPurchase.purchaseDate);
          const { cuotas, totalFinanciado, interesTotal } = tenpoCalculatorService.generarCalendarioCuotas(
            parsedPurchase.amountTotalClp,
            parsedPurchase.installmentsCount,
            primeraFechaVencimiento,
            tieneInteres,
            tasaMensual
          );

          // Crear email y compra
          const email = await prisma.tenpoEmail.create({
            data: {
              gmailMessageId,
              labelType: 'COMPRAS',
              rawBody,
              emailDate,
              parsedOk: true
            }
          });

          // Crear compra con nuevos campos
          await prisma.tenpoPurchase.create({
            data: {
              emailId: email.id,
              purchaseDate: parsedPurchase.purchaseDate,
              merchant: parsedPurchase.merchant,
              amountTotalClp: parsedPurchase.amountTotalClp,
              installmentsCount: parsedPurchase.installmentsCount,
              tieneInteres,
              modoMonto: 'ESTIMADO',
              totalFinanciadoEstimado: totalFinanciado,
              interesTotalEstimado: interesTotal,
              installments: {
                create: cuotas.map((monto, index) => ({
                  installmentNumber: index + 1,
                  baseAmountClp: monto,
                  dueDate: tenpoParserService.calculateDueDate(addMonths(parsedPurchase.purchaseDate, index)),
                  payDateEstimated: tenpoParserService.calculateDueDate(addMonths(parsedPurchase.purchaseDate, index)),
                  estado: 'ESTIMADO',
                  finalMonthlyAmountClp: monto
                }))
              }
            }
          });

          newCompras++;
        } else {
          // Guardar email con error de parsing
          await prisma.tenpoEmail.create({
            data: {
              gmailMessageId,
              labelType: 'COMPRAS',
              rawBody,
              emailDate,
              parsedOk: false,
              parseError: 'No se pudo parsear el email de compra'
            }
          });
          errors.push(`Error parseando compra: ${gmailMessageId}`);
        }
      }
    } catch (error: any) {
      errors.push(`Error sincronizando compras: ${error.message}`);
    }

    // Sincronizar pagos
    try {
      console.log(`📧 Buscando emails con etiqueta: ${pagosLabel}`);
      const pagosMessages = await gmailService.getEmailsByLabel(pagosLabel);
      console.log(`✅ Encontrados ${pagosMessages.length} mensajes de pagos`);
      
      for (const message of pagosMessages) {
        const gmailMessageId = message.id!;
        
        // Verificar si ya existe
        const exists = await prisma.tenpoEmail.findUnique({
          where: { gmailMessageId }
        });

        if (exists) {
          skippedPagos++;
          continue;
        }

        const rawBody = gmailService.extractBodyFromMessage(message);
        const emailDate = gmailService.getMessageDate(message);

        // Parsear pago
        const parsedPayment = tenpoParserService.parsePaymentEmail(rawBody);
        
        if (parsedPayment) {
          // Crear email y pago
          const email = await prisma.tenpoEmail.create({
            data: {
              gmailMessageId,
              labelType: 'PAGOS',
              rawBody,
              emailDate,
              parsedOk: true
            }
          });

          await prisma.tenpoPayment.create({
            data: {
              emailId: email.id,
              payDate: parsedPayment.payDate,
              amountClp: parsedPayment.amountClp,
              paymentMethod: parsedPayment.paymentMethod,
              transactionCode: parsedPayment.transactionCode,
              periodPay: parsedPayment.periodPay,
              periodBill: parsedPayment.periodBill
            }
          });

          newPagos++;
        } else {
          // Guardar email con error de parsing
          await prisma.tenpoEmail.create({
            data: {
              gmailMessageId,
              labelType: 'PAGOS',
              rawBody,
              emailDate,
              parsedOk: false,
              parseError: 'No se pudo parsear el email de pago'
            }
          });
          errors.push(`Error parseando pago: ${gmailMessageId}`);
        }
      }
    } catch (error: any) {
      errors.push(`Error sincronizando pagos: ${error.message}`);
    }

    console.log(`📊 Resumen: ${newCompras} compras nuevas (${skippedCompras} ya existían), ${newPagos} pagos nuevos (${skippedPagos} ya existían)`);
    console.log(`❌ Errores: ${errors.length}`);

    res.json({
      success: true,
      newCompras,
      skippedCompras,
      newPagos,
      skippedPagos,
      errors
    });

  } catch (error: any) {
    console.error('Error en sync:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/debug/search?q=texto
 * Buscar en emails sin parsear y compras
 */
router.get('/debug/search', async (req, res) => {
  try {
    const searchQuery = (req.query.q as string || '');
    
    if (!searchQuery) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log('🔍 Buscando:', searchQuery);

    // Buscar en emails (SQLite es case-insensitive por defecto con LIKE)
    const emails = await prisma.tenpoEmail.findMany({
      where: {
        rawBody: { contains: searchQuery }
      },
      include: {
        purchases: {
          include: {
            installments: true
          }
        },
        payments: true
      }
    });

    // Buscar en compras parseadas
    const purchases = await prisma.tenpoPurchase.findMany({
      where: {
        merchant: { contains: searchQuery }
      },
      include: {
        installments: true,
        email: true
      }
    });

    res.json({
      emailsFound: emails.length,
      purchasesFound: purchases.length,
      emails: emails.map(e => ({
        id: e.id,
        gmailMessageId: e.gmailMessageId,
        labelType: e.labelType,
        parsedOk: e.parsedOk,
        parseError: e.parseError,
        emailDate: e.emailDate,
        rawBodyPreview: e.rawBody.substring(0, 500),
        purchases: e.purchases,
        payments: e.payments
      })),
      purchases
    });

  } catch (error: any) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/forecast?months=12
 * Proyección de cuotas por mes
 */
router.get('/forecast', async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const now = new Date();

    const forecast = [];

    for (let i = 0; i < months; i++) {
      const targetDate = addMonths(now, i);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      // Buscar cuotas con vencimiento en este mes
      const installments = await prisma.tenpoInstallment.findMany({
        where: {
          dueDate: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        include: {
          purchase: true
        }
      });

      const totalEstimated = installments.reduce(
        (sum: number, inst: any) => sum + inst.finalMonthlyAmountClp,
        0
      );

      // Buscar pagos realizados en este mes
      const payments = await prisma.tenpoPayment.findMany({
        where: {
          payDate: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const totalPaid = payments.reduce((sum: number, pay: any) => sum + pay.amountClp, 0);

      forecast.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        totalEstimated,
        totalPaid,
        gap: totalEstimated - totalPaid,
        coverage: totalEstimated > 0 ? (totalPaid / totalEstimated) * 100 : 0,
        installmentsCount: installments.length,
        paymentsCount: payments.length
      });
    }

    res.json(forecast);

  } catch (error: any) {
    console.error('Error en forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/tenpo/installments/:id
 * Editar interés u override de cuota
 */
router.patch('/installments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { overrideInterestRate, overrideMonthlyAmountClp } = req.body;

    const installment = await prisma.tenpoInstallment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!installment) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    // Recalcular monto final
    const finalAmount = tenpoParserService.recalculateInstallmentAmount(
      installment.baseAmountClp,
      overrideInterestRate !== undefined ? overrideInterestRate : installment.overrideInterestRate,
      overrideMonthlyAmountClp !== undefined ? overrideMonthlyAmountClp : installment.overrideMonthlyAmountClp
    );

    const updated = await prisma.tenpoInstallment.update({
      where: { id: parseInt(id) },
      data: {
        overrideInterestRate: overrideInterestRate !== undefined ? overrideInterestRate : installment.overrideInterestRate,
        overrideMonthlyAmountClp: overrideMonthlyAmountClp !== undefined ? overrideMonthlyAmountClp : installment.overrideMonthlyAmountClp,
        finalMonthlyAmountClp: finalAmount
      }
    });

    res.json(updated);

  } catch (error: any) {
    console.error('Error actualizando cuota:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/installments
 * Listar todas las cuotas con opciones de filtro
 */
router.get('/installments', async (req, res) => {
  try {
    const { year, month } = req.query;

    let where: any = {};

    if (year && month) {
      const targetDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      where.dueDate = {
        gte: monthStart,
        lte: monthEnd
      };
    }

    const installments = await prisma.tenpoInstallment.findMany({
      where,
      include: {
        purchase: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    res.json(installments);

  } catch (error: any) {
    console.error('Error obteniendo cuotas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/purchases
 * Listar todas las compras
 */
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await prisma.tenpoPurchase.findMany({
      include: {
        installments: {
          orderBy: {
            installmentNumber: 'asc'
          }
        },
        email: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    res.json(purchases);

  } catch (error: any) {
    console.error('Error obteniendo compras:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/payments
 * Listar todos los pagos
 */
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.tenpoPayment.findMany({
      include: {
        email: true
      },
      orderBy: {
        payDate: 'desc'
      }
    });

    res.json(payments);

  } catch (error: any) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/config/tasa
 * Obtener tasa vigente actual
 */
router.get('/config/tasa', async (req, res) => {
  try {
    const tasaActual = await tenpoConfigService.getTasaVigente(new Date());
    if (!tasaActual) {
      return res.status(404).json({ error: 'No hay tasa configurada' });
    }
    res.json(tasaActual);
  } catch (error: any) {
    console.error('Error obteniendo tasa:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tenpo/config/tasa/historial
 * Obtener historial completo de tasas
 */
router.get('/config/tasa/historial', async (req, res) => {
  try {
    const historial = await tenpoConfigService.getHistorialTasas();
    res.json(historial);
  } catch (error: any) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/config/tasa
 * Crear nueva tasa (cierra automáticamente la anterior)
 * Body: { tasaMensual: number, cae: number, vigenteDesde: Date }
 */
router.post('/config/tasa', async (req, res) => {
  try {
    const { tasaMensual, cae, vigenteDesde } = req.body;

    if (!tasaMensual || !cae || !vigenteDesde) {
      return res.status(400).json({ 
        error: 'Faltan campos: tasaMensual, cae, vigenteDesde' 
      });
    }

    const nuevaTasa = await tenpoConfigService.actualizarTasa(
      tasaMensual,
      cae,
      new Date(vigenteDesde)
    );

    res.json(nuevaTasa);
  } catch (error: any) {
    console.error('Error creando tasa:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/tenpo/purchases/:id/interes
 * Toggle tieneInteres de una compra y recalcular
 * Body: { tieneInteres: boolean }
 */
router.patch('/purchases/:id/interes', async (req, res) => {
  try {
    const { id } = req.params;
    const { tieneInteres } = req.body;

    if (typeof tieneInteres !== 'boolean') {
      return res.status(400).json({ error: 'Campo tieneInteres debe ser boolean' });
    }

    // Obtener compra actual
    const purchase = await prisma.tenpoPurchase.findUnique({
      where: { id: parseInt(id) }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    // No recalcular si está en modo REAL
    if (purchase.modoMonto === 'REAL') {
      return res.status(400).json({ 
        error: 'No se puede modificar compra en modo REAL' 
      });
    }

    // Actualizar flag
    await prisma.tenpoPurchase.update({
      where: { id: parseInt(id) },
      data: { tieneInteres }
    });

    // Recalcular
    const compraRecalculada = await tenpoCalculatorService.recalcularCompra(parseInt(id));

    res.json(compraRecalculada);
  } catch (error: any) {
    console.error('Error toggling interés:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/purchases/:id/confirmar-real
 * Confirmar monto real de cuota (bloquea recálculo)
 * Body: { cuotaReal: number }
 */
router.post('/purchases/:id/confirmar-real', async (req, res) => {
  try {
    const { id } = req.params;
    const { cuotaReal } = req.body;

    if (!cuotaReal || typeof cuotaReal !== 'number') {
      return res.status(400).json({ error: 'Campo cuotaReal es requerido (number)' });
    }

    const compraConfirmada = await tenpoCalculatorService.confirmarValorReal(
      parseInt(id),
      cuotaReal
    );

    res.json(compraConfirmada);
  } catch (error: any) {
    console.error('Error confirmando valor real:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tenpo/recalcular-estimadas
 * Recalcular todas las compras en modo ESTIMADO
 * (usar después de cambiar la tasa global)
 */
router.post('/recalcular-estimadas', async (req, res) => {
  try {
    const resultado = await tenpoCalculatorService.recalcularTodasEstimadas();
    res.json(resultado);
  } catch (error: any) {
    console.error('Error recalculando:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
