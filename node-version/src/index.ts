import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subscriptionRoutes from './routes/subscriptions';
import analyticsRoutes from './routes/analytics';
import obligacionesRoutes from './routes/obligaciones';
import hipotecarioRoutes from './routes/hipotecario';
import serviciosBasicosRoutes from './routes/servicios-basicos';
import ingresosRoutes from './routes/ingresos';
import ahorrosRoutes from './routes/ahorros';
import supermercadoRoutes from './routes/supermercado';
import googleIntegrationRoutes from './routes/google-integration';
import gmailRoutes from './routes/gmail';
import tenpoRoutes from './routes/tenpo';
import merchantCategoriesRoutes from './routes/merchant-categories';
import merchantMappingsRoutes from './routes/merchant-mappings';
import actualRoutes from './routes/actual';
import tcBillingRoutes from './routes/tc-billing';
import utilitiesRoutes from './routes/utilities';
import { tenpoConfigService } from './services/tenpo-config.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const apiKey = process.env.API_KEY;

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (req, res, next) => {
  if (!apiKey) {
    return next();
  }
  if (req.method === 'GET' && req.path === '/integrations/google/callback') {
    return next();
  }

  if (req.header('x-api-key') === apiKey) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
});

// API Routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/obligaciones', obligacionesRoutes);
app.use('/api/hipotecario', hipotecarioRoutes);
app.use('/api/servicios-basicos', serviciosBasicosRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/ahorros', ahorrosRoutes);
app.use('/api/supermercado', supermercadoRoutes);
app.use('/api/integrations/google', googleIntegrationRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/tenpo', tenpoRoutes);
app.use('/api/tenpo', merchantCategoriesRoutes);
app.use('/api/tenpo', merchantMappingsRoutes);
app.use('/api/actual', actualRoutes);
app.use('/api/tc-billing', tcBillingRoutes);
app.use('/api/utilities', utilitiesRoutes);

// Inicializar tasa default al arrancar
async function initializeDefaults() {
  try {
    await tenpoConfigService.inicializarTasaDefault();
    console.log('✅ Tasa Tenpo inicializada');
  } catch (error) {
    console.error('❌ Error inicializando tasa:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await initializeDefaults();
});

export default app;
