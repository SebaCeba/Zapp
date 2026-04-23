/**
 * API v2 - Modelo Dimensional Estrella
 * 
 * Rutas principales para el nuevo modelo dimensional que reemplaza
 * las 7+ tablas legacy con una arquitectura estrella unificada.
 * 
 * Estructura:
 * - /api/v2/facts - CRUD de hechos financieros
 * - /api/v2/budget - Endpoints específicos de presupuesto
 * - /api/v2/actual - Endpoints específicos de gastos reales
 * - /api/v2/comparison - Comparaciones presupuesto vs actual
 * - /api/v2/accounts - Jerarquía y gestión de cuentas
 */

import { Router } from 'express';
import factsRoutes from './facts';
import budgetRoutes from './budget';
import actualRoutes from './actual';
import comparisonRoutes from './comparison';
import accountsRoutes from './accounts';
import subscriptionsRoutes from './subscriptions';

const router = Router();

// Montar sub-rutas
router.use('/facts', factsRoutes);
router.use('/budget', budgetRoutes);
router.use('/actual', actualRoutes);
router.use('/comparison', comparisonRoutes);
router.use('/accounts', accountsRoutes);
router.use('/subscriptions', subscriptionsRoutes);

// Health check específico de v2
router.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    model: 'dimensional-star-schema',
    timestamp: new Date().toISOString()
  });
});

export default router;
