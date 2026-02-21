import express from 'express';
import { tcBillingCycleService } from '../services/tcBillingCycle.service';

const router = express.Router();

/**
 * GET /api/tc-billing/config?tcKey=TENPO
 * Obtiene configuración y overrides de una TC
 */
router.get('/config', async (req, res) => {
  try {
    const tcKey = req.query.tcKey as string;

    if (!tcKey) {
      return res.status(400).json({ error: 'tcKey es requerido' });
    }

    const config = await tcBillingCycleService.getConfig(tcKey);

    if (!config) {
      return res.status(404).json({ error: `No existe configuración para TC: ${tcKey}` });
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error obteniendo config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tc-billing/config
 * Crea o actualiza configuración de una TC
 * Body: { tcKey, closingDay, dueDay, businessDayRule }
 */
router.put('/config', async (req, res) => {
  try {
    const { tcKey, closingDay, dueDay, businessDayRule } = req.body;

    if (!tcKey || !closingDay || !dueDay || !businessDayRule) {
      return res.status(400).json({ 
        error: 'tcKey, closingDay, dueDay y businessDayRule son requeridos' 
      });
    }

    // Validar closingDay
    if (closingDay < 1 || closingDay > 31) {
      return res.status(400).json({ error: 'closingDay debe estar entre 1 y 31' });
    }

    // Validar dueDay
    if (dueDay < 1 || dueDay > 31) {
      return res.status(400).json({ error: 'dueDay debe estar entre 1 y 31' });
    }

    // Validar businessDayRule
    const validRules = ['PREVIOUS', 'NEXT', 'NONE'];
    if (!validRules.includes(businessDayRule)) {
      return res.status(400).json({ 
        error: `businessDayRule debe ser uno de: ${validRules.join(', ')}` 
      });
    }

    const config = await tcBillingCycleService.upsertConfig(
      tcKey,
      closingDay,
      dueDay,
      businessDayRule
    );

    res.json(config);
  } catch (error: any) {
    console.error('Error guardando config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tc-billing/cycles?tcKey=TENPO&year=2026
 * Obtiene tabla anual de ciclos (12 meses)
 */
router.get('/cycles', async (req, res) => {
  try {
    const tcKey = req.query.tcKey as string;
    const year = parseInt(req.query.year as string, 10);

    if (!tcKey || !year) {
      return res.status(400).json({ error: 'tcKey y year son requeridos' });
    }

    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'year inválido' });
    }

    const cycles = await tcBillingCycleService.buildAnnualCycles(tcKey, year);

    res.json({
      tcKey,
      year,
      cycles: cycles.map(c => ({
        month: c.month,
        fromDate: c.fromDate.toISOString().split('T')[0],
        toDate: c.toDate.toISOString().split('T')[0],
        nominalToDate: c.nominalToDate.toISOString().split('T')[0],
        ruleApplied: c.ruleApplied,
        overrideApplied: c.overrideApplied
      }))
    });
  } catch (error: any) {
    console.error('Error obteniendo ciclos:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/tc-billing/overrides
 * Crea o actualiza override mensual
 * Body: { tcKey, year, month, effectiveCloseDate }
 */
router.put('/overrides', async (req, res) => {
  try {
    const { tcKey, year, month, effectiveCloseDate } = req.body;

    if (!tcKey || !year || !month || !effectiveCloseDate) {
      return res.status(400).json({ 
        error: 'tcKey, year, month y effectiveCloseDate son requeridos' 
      });
    }

    // Validar month
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'month debe estar entre 1 y 12' });
    }

    // Parsear fecha
    const date = new Date(effectiveCloseDate);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'effectiveCloseDate inválida' });
    }

    const override = await tcBillingCycleService.upsertOverride(
      tcKey,
      year,
      month,
      date
    );

    res.json(override);
  } catch (error: any) {
    console.error('Error guardando override:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/tc-billing/overrides?tcKey=TENPO&year=2026&month=2
 * Elimina override mensual
 */
router.delete('/overrides', async (req, res) => {
  try {
    const tcKey = req.query.tcKey as string;
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    if (!tcKey || !year || !month) {
      return res.status(400).json({ error: 'tcKey, year y month son requeridos' });
    }

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'year o month inválidos' });
    }

    await tcBillingCycleService.deleteOverride(tcKey, year, month);

    res.json({ 
      success: true,
      message: `Override eliminado para ${tcKey} ${year}-${month}` 
    });
  } catch (error: any) {
    console.error('Error eliminando override:', error);
    
    // Manejar caso de override no encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Override no encontrado' });
    }

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/tc-billing/recalculate
 * Recalcula fechas de compras según ciclos
 * Body: { tcKey, year, scope, dryRun? }
 */
router.post('/recalculate', async (req, res) => {
  try {
    const { tcKey, year, scope, dryRun = false } = req.body;

    if (!tcKey || !year || !scope) {
      return res.status(400).json({ 
        error: 'tcKey, year y scope son requeridos' 
      });
    }

    // Validar scope
    const validScopes = ['FUTURE_ONLY', 'ALL_NON_REAL_NON_MANUAL'];
    if (!validScopes.includes(scope)) {
      return res.status(400).json({ 
        error: `scope debe ser uno de: ${validScopes.join(', ')}` 
      });
    }

    const result = await tcBillingCycleService.recalculate({
      tcKey,
      year,
      scope,
      dryRun
    });

    if (dryRun) {
      res.json({
        dryRun: true,
        wouldChangeCount: result.wouldChangeCount,
        sampleChanges: result.sampleChanges?.map(c => ({
          purchaseId: c.purchaseId,
          installmentId: c.installmentId,
          oldDate: c.oldDate.toISOString().split('T')[0],
          newDate: c.newDate.toISOString().split('T')[0]
        }))
      });
    } else {
      res.json({
        success: true,
        changedCount: result.changedCount,
        message: `${result.changedCount} cuotas recalculadas correctamente`
      });
    }
  } catch (error: any) {
    console.error('Error recalculando:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
