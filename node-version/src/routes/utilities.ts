import express from 'express';
import prisma from '../db';
import { startOfMonth, endOfMonth } from 'date-fns';
import { gmailService } from '../services/gmail.service';
import { utilitiesParserService } from '../services/utilities-parser.service';

const router = express.Router();

/**
 * GET /api/utilities/providers
 * Obtiene lista de providers activos de Servicios Básicos
 */
router.get('/providers', async (_req, res) => {
  try {
    const providers = await prisma.servicioBasico.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        nombre: true,
        esBase: true,
        orden: true,
        hasEmailConnector: true,
        gmailLabel: true
      }
    });

    res.json(providers);
  } catch (error: any) {
    console.error('Error fetching utility providers:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/utilities/providers/:provider/config
 * Actualiza la configuración de email connector para un provider
 * Body: { hasEmailConnector: boolean, gmailLabel: string | null }
 */
router.patch('/providers/:provider/config', async (req, res) => {
  try {
    const { provider } = req.params;
    const { hasEmailConnector, gmailLabel } = req.body;

    if (typeof hasEmailConnector !== 'boolean') {
      return res.status(400).json({ error: 'Se requiere el campo hasEmailConnector (boolean)' });
    }

    // Buscar provider
    const servicioBasico = await prisma.servicioBasico.findUnique({
      where: { nombre: provider }
    });

    if (!servicioBasico) {
      return res.status(404).json({ error: 'Provider no encontrado' });
    }

    let finalGmailLabel: string | null = null;

    // Si está habilitado, validar el label
    if (hasEmailConnector) {
      if (gmailLabel && gmailLabel.trim() !== '') {
        // Validar que el label existe en Gmail
        const labelId = await gmailService.getLabelIdByName(gmailLabel);
        
        if (!labelId) {
          return res.status(400).json({ 
            error: `El label "${gmailLabel}" no existe en Gmail. Por favor verifica el nombre exacto.`
          });
        }
        
        finalGmailLabel = gmailLabel;
      }
      // Si hasEmailConnector=true pero gmailLabel está vacío, permitir (usuario puede configurarlo después)
    }

    // Si está deshabilitado, limpiar el label
    if (!hasEmailConnector) {
      finalGmailLabel = null;
    }

    // Actualizar provider
    const updated = await prisma.servicioBasico.update({
      where: { nombre: provider },
      data: {
        hasEmailConnector,
        gmailLabel: finalGmailLabel
      },
      select: {
        id: true,
        nombre: true,
        esBase: true,
        orden: true,
        hasEmailConnector: true,
        gmailLabel: true
      }
    });

    console.log(`✅ Configuración actualizada para ${provider}: hasEmailConnector=${hasEmailConnector}, gmailLabel=${finalGmailLabel}`);

    res.json(updated);
  } catch (error: any) {
    console.error('Error actualizando configuración de provider:', error);
    
    // Si el error es de autenticación con Gmail
    if (error.message?.includes('vuelve a autenticarte') || 
        error.message?.includes('Debe autenticarse primero')) {
      return res.status(401).json({ 
        error: 'No autenticado con Google. Conecta Google primero para validar labels.'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/utilities/:provider
 * Obtiene transacciones de un provider específico
 * Query params: year, month (opcionales)
 */
router.get('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { year, month } = req.query;

    const whereClause: any = {
      providerKey: provider
    };

    // Filtrar por mes/año si se especifica
    if (year && month) {
      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = endOfMonth(startDate);

      whereClause.transactionDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const transactions = await prisma.utilityTransaction.findMany({
      where: whereClause,
      orderBy: {
        transactionDate: 'desc'
      },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching utility transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/utilities/:provider/import-email/preview
 * Obtiene preview de transacciones desde Gmail (NO guarda en BD)
 */
router.post('/:provider/import-email/preview', async (req, res) => {
  try {
    const { provider } = req.params;

    // Buscar provider y validar configuración
    const servicioBasico = await prisma.servicioBasico.findUnique({
      where: { nombre: provider }
    });

    if (!servicioBasico) {
      return res.status(404).json({ error: 'Provider no encontrado' });
    }

    if (!servicioBasico.hasEmailConnector) {
      return res.status(400).json({ error: 'Este provider no tiene email connector habilitado' });
    }

    if (!servicioBasico.gmailLabel) {
      return res.status(400).json({ error: 'Este provider no tiene Gmail label configurado' });
    }

    // Verificar autenticación con Gmail
    const authStatus = await gmailService.getAuthStatus();
    if (!authStatus.authenticated) {
      return res.status(401).json({ 
        error: 'No estás autenticado con Gmail. Autentícate primero en la configuración de servicios básicos.'
      });
    }

    const gmailLabel = servicioBasico.gmailLabel;
    console.log(`📧 Preview de Gmail label: "${gmailLabel}" para provider: ${provider}`);

    // Obtener emails desde Gmail (últimos 50 para no saturar en primera importación)
    const messages = await gmailService.getEmailsByLabel(gmailLabel, 50);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        gmailLabel,
        message: `No se encontraron emails con la etiqueta "${gmailLabel}"`
      });
    }

    console.log(`📬 Encontrados ${messages.length} emails con label "${gmailLabel}"`);

    // Parsear emails a transacciones
    const parsedTransactions = utilitiesParserService.parseMultipleEmails(
      messages,
      (msg) => gmailService.extractBodyFromMessage(msg),
      (msg) => gmailService.getMessageDate(msg),
      provider
    );

    if (parsedTransactions.length === 0) {
      return res.status(200).json({
        success: true,
        items: [],
        gmailLabel,
        message: `Se encontraron ${messages.length} emails, pero no se pudo extraer información de factura de ninguno`
      });
    }

    // Filtrar duplicados: verificar que no existan transacciones con el mismo gmailMessageId
    const existingTransactions = await prisma.utilityTransaction.findMany({
      where: {
        providerKey: provider,
        source: 'gmail'
      },
      select: {
        metadata: true
      }
    });

    const existingMessageIds = new Set(
      existingTransactions
        .map((t: any) => {
          if (!t.metadata) return null;
          try {
            const meta = JSON.parse(t.metadata);
            return meta.gmailMessageId;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    );

    // Crear items de preview (sin guardar)
    const previewItems = parsedTransactions
      .filter(t => {
        const messageId = t.metadata?.gmailMessageId;
        return messageId && !existingMessageIds.has(messageId);
      })
      .map(t => {
        // Extraer emailDate del metadata o usar transactionDate como fallback
        const emailDate = t.metadata?.emailDate || t.transactionDate;
        
        return {
          gmailMessageId: t.metadata?.gmailMessageId,
          emailDate: emailDate,
          amount: t.amount,
          description: t.description,
          metadata: t.metadata,
          suggestedPayMonth: t.metadata?.payMonth || null // YYYY-MM si el parser lo calculó
        };
      });

    console.log(`✅ ${previewItems.length} items para preview (${parsedTransactions.length - previewItems.length} duplicados ignorados)`);

    res.status(200).json({
      success: true,
      items: previewItems,
      gmailLabel,
      totalFound: parsedTransactions.length,
      duplicates: parsedTransactions.length - previewItems.length,
      message: `${previewItems.length} transacciones listas para confirmar`
    });
  } catch (error: any) {
    console.error('❌ Error en preview de Gmail:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/utilities/:provider/import-email/confirm
 * Guarda transacciones previamente parseadas, con mes/año de pago elegido por usuario
 */
router.post('/:provider/import-email/confirm', async (req, res) => {
  try {
    const { provider } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere array de items no vacío' });
    }

    // Validar estructura de cada item
    for (const item of items) {
      if (!item.gmailMessageId || !item.payYear || !item.payMonth || !item.amount) {
        return res.status(400).json({ 
          error: 'Cada item debe tener: gmailMessageId, payYear, payMonth, amount' 
        });
      }
    }

    // Buscar provider
    const servicioBasico = await prisma.servicioBasico.findUnique({
      where: { nombre: provider }
    });

    if (!servicioBasico) {
      return res.status(404).json({ error: 'Provider no encontrado' });
    }

    // Verificar duplicados
    const existingTransactions = await prisma.utilityTransaction.findMany({
      where: {
        providerKey: provider,
        source: 'gmail'
      },
      select: {
        metadata: true
      }
    });

    const existingMessageIds = new Set(
      existingTransactions
        .map((t: any) => {
          if (!t.metadata) return null;
          try {
            const meta = JSON.parse(t.metadata);
            return meta.gmailMessageId;
          } catch {
            return null;
          }
        })
        .filter(Boolean)
    );

    // Filtrar items que ya existen
    const newItems = items.filter((item: any) => 
      !existingMessageIds.has(item.gmailMessageId)
    );

    if (newItems.length === 0) {
      return res.status(200).json({
        success: true,
        imported: 0,
        message: 'Todas las transacciones ya fueron importadas previamente'
      });
    }

    // Crear transacciones en la base de datos
    const created = await prisma.utilityTransaction.createMany({
      data: newItems.map((item: any) => {
        // transaction_date = primer día del mes elegido
        const transactionDate = new Date(item.payYear, item.payMonth - 1, 1);

        // Agregar emailDate al metadata
        const metadata = {
          ...(item.metadata || {}),
          emailDate: item.emailDate || new Date().toISOString(),
          gmailMessageId: item.gmailMessageId,
          userSelectedPayMonth: `${item.payYear}-${String(item.payMonth).padStart(2, '0')}`
        };

        return {
          providerKey: provider,
          transactionDate,
          amount: item.amount,
          description: item.description || `Factura ${provider}`,
          source: 'gmail',
          metadata: JSON.stringify(metadata)
        };
      })
    });

    console.log(`✅ Confirmadas ${created.count} transacciones para ${provider}`);

    res.status(201).json({
      success: true,
      imported: created.count,
      skipped: items.length - newItems.length,
      mode: 'cashflow_actual',
      message: `Importadas ${created.count} transacciones confirmadas`
    });
  } catch (error: any) {
    console.error('❌ Error confirmando transacciones:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/utilities/:provider/import-email
 * DEPRECATED: Usar /import-email/preview + /import-email/confirm
 * Mantenido temporalmente para compatibilidad
 */
router.post('/:provider/import-email', async (req, res) => {
  res.status(410).json({ 
    error: 'Endpoint deprecado. Usar /import-email/preview seguido de /import-email/confirm'
  });
});

/**
 * POST /api/utilities/:provider/import
 * Importa transacciones desde CSV (por ahora solo manual)
 * Body: { transactions: [{ date, amount, description }] }
 */
router.post('/:provider/import', async (req, res) => {
  try {
    const { provider } = req.params;
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de transacciones' });
    }

    // Verificar que el provider existe
    const providerExists = await prisma.servicioBasico.findUnique({
      where: { nombre: provider }
    });

    if (!providerExists) {
      return res.status(404).json({ error: 'Provider no encontrado' });
    }

    // Crear transacciones en batch
    const created = await prisma.utilityTransaction.createMany({
      data: transactions.map((t: any) => ({
        providerKey: provider,
        transactionDate: new Date(t.date),
        amount: parseFloat(t.amount),
        description: t.description || null,
        source: 'csv',
        metadata: t.metadata ? JSON.stringify(t.metadata) : null
      }))
    });

    res.status(201).json({ 
      success: true, 
      imported: created.count 
    });
  } catch (error: any) {
    console.error('Error importing utility transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/utilities/:provider
 * Crea una transacción manual
 * Body: { date, amount, description? }
 */
router.post('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { date, amount, description } = req.body;

    if (!date || !amount) {
      return res.status(400).json({ error: 'Se requiere fecha y monto' });
    }

    // Verificar que el provider existe
    const providerExists = await prisma.servicioBasico.findUnique({
      where: { nombre: provider }
    });

    if (!providerExists) {
      return res.status(404).json({ error: 'Provider no encontrado' });
    }

    const transaction = await prisma.utilityTransaction.create({
      data: {
        providerKey: provider,
        transactionDate: new Date(date),
        amount: parseFloat(amount),
        description: description || null,
        source: 'manual'
      },
      include: {
        provider: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Error creating utility transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/utilities/:provider/transactions/:id/pay-period
 * Actualiza el período de pago (mes/año) de una transacción guardada
 * Recalcula transaction_date como primer día del mes
 * NOTA: Debe estar ANTES de DELETE /:provider/:id para evitar conflictos de ruta
 */
router.patch('/:provider/transactions/:id/pay-period', async (req, res) => {
  try {
    const { id, provider } = req.params;
    const { payYear, payMonth, payPeriod } = req.body;

    // Extraer payYear/payMonth si viene payPeriod en formato YYYY-MM
    let year = payYear;
    let month = payMonth;
    
    if (payPeriod && typeof payPeriod === 'string') {
      const [y, m] = payPeriod.split('-').map(Number);
      year = y;
      month = m;
    }

    // Validaciones
    if (!year || !month) {
      return res.status(400).json({ 
        error: 'Se requiere payYear y payMonth, o payPeriod en formato YYYY-MM' 
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'payMonth debe estar entre 1 y 12' });
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear - 5 || year > currentYear + 5) {
      return res.status(400).json({ 
        error: `payYear debe estar entre ${currentYear - 5} y ${currentYear + 5}` 
      });
    }

    // Verificar que la transacción existe y pertenece al provider
    const transaction = await prisma.utilityTransaction.findFirst({
      where: {
        id: parseInt(id),
        providerKey: provider
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    // Calcular nuevo transaction_date (primer día del mes)
    const newTransactionDate = new Date(year, month - 1, 1);

    // Actualizar metadata preservando campos existentes
    let metadata: any = {};
    if (transaction.metadata) {
      try {
        metadata = JSON.parse(transaction.metadata);
      } catch {
        metadata = {};
      }
    }

    // Agregar/actualizar userSelectedPayMonth
    metadata.userSelectedPayMonth = `${year}-${String(month).padStart(2, '0')}`;

    // Actualizar en BD
    const updated = await prisma.utilityTransaction.update({
      where: { id: parseInt(id) },
      data: {
        transactionDate: newTransactionDate,
        metadata: JSON.stringify(metadata)
      }
    });

    console.log(`✅ Actualizado período de pago: transaction ${id} → ${year}-${month}`);

    res.status(200).json({
      success: true,
      transaction: updated,
      message: 'Período de pago actualizado'
    });
  } catch (error: any) {
    console.error('❌ Error actualizando período de pago:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/utilities/:provider/:id
 * Elimina una transacción
 */
router.delete('/:provider/:id', async (req, res) => {
  try {
    const { id, provider } = req.params;

    // Verificar que la transacción existe y pertenece al provider
    const transaction = await prisma.utilityTransaction.findFirst({
      where: {
        id: parseInt(id),
        providerKey: provider
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    await prisma.utilityTransaction.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting utility transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/utilities/:provider/summary
 * Obtiene resumen mensual de transacciones
 * Query params: year (requerido)
 */
router.get('/:provider/summary', async (req, res) => {
  try {
    const { provider } = req.params;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Se requiere el parámetro year' });
    }

    const yearNum = parseInt(year as string);

    // Obtener todas las transacciones del año
    const transactions = await prisma.utilityTransaction.findMany({
      where: {
        providerKey: provider,
        transactionDate: {
          gte: new Date(yearNum, 0, 1),
          lte: new Date(yearNum, 11, 31, 23, 59, 59)
        }
      }
    });

    // Agrupar por mes
    const summary = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.transactionDate);
        return date.getMonth() + 1 === month;
      });

      return {
        month,
        total: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
        count: monthTransactions.length
      };
    });

    res.json(summary);
  } catch (error: any) {
    console.error('Error fetching utility summary:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
