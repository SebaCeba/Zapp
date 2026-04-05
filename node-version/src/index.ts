import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subscriptionRoutes from './routes/subscriptions';
import obligacionesRoutes from './routes/obligaciones';
import hipotecarioRoutes from './routes/hipotecario';
import serviciosBasicosRoutes from './routes/servicios-basicos';
import ingresosRoutes from './routes/ingresos';
import ahorrosRoutes from './routes/ahorros';
import supermercadoRoutes from './routes/supermercado';
import googleIntegrationRoutes from './routes/google-integration';
import gmailRoutes from './routes/gmail';
import actualRoutes from './routes/actual';
import utilitiesRoutes from './routes/utilities';
// V2 API - Modelo Dimensional Estrella
import v2Routes from './routes/v2';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes v2 (Modelo Dimensional Estrella)
app.use('/api/v2', v2Routes);

// API Routes legacy (mantener para compatibilidad)
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/obligaciones', obligacionesRoutes);
app.use('/api/hipotecario', hipotecarioRoutes);
app.use('/api/servicios-basicos', serviciosBasicosRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/ahorros', ahorrosRoutes);
app.use('/api/supermercado', supermercadoRoutes);
app.use('/api/integrations/google', googleIntegrationRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/actual', actualRoutes);
app.use('/api/utilities', utilitiesRoutes);

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 V2 API (Dimensional Model): http://localhost:${PORT}/api/v2/health`);
});

export default app;
