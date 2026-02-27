import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subscriptionRoutes from './routes/subscriptions';
import analyticsRoutes from './routes/analytics';
import obligacionesRoutes from './routes/obligaciones';
import hipotecarioRoutes from './routes/hipotecario';
import serviciosBasicosRoutes from './routes/servicios-basicos';
import ingresosRoutes from './routes/ingresos';
import supermercadoRoutes from './routes/supermercado';
import googleIntegrationRoutes from './routes/google-integration';
import tenpoRoutes from './routes/tenpo';
import merchantCategoriesRoutes from './routes/merchant-categories';
import merchantMappingsRoutes from './routes/merchant-mappings';
import actualRoutes from './routes/actual';
import tcBillingRoutes from './routes/tc-billing';
import { tenpoConfigService } from './services/tenpo-config.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/obligaciones', obligacionesRoutes);
app.use('/api/hipotecario', hipotecarioRoutes);
app.use('/api/servicios-basicos', serviciosBasicosRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/supermercado', supermercadoRoutes);
app.use('/api/integrations/google', googleIntegrationRoutes);
app.use('/api/tenpo', tenpoRoutes);
app.use('/api/tenpo', merchantCategoriesRoutes);
app.use('/api/tenpo', merchantMappingsRoutes);
app.use('/api/actual', actualRoutes);
app.use('/api/tc-billing', tcBillingRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
