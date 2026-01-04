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

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
