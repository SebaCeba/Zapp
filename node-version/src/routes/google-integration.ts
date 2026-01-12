import express from 'express';
import { gmailService } from '../services/gmail.service';

const router = express.Router();

/**
 * GET /api/integrations/google/status
 * Verifica si hay autenticación activa con Google
 */
router.get('/status', async (req, res) => {
  try {
    const isAuthenticated = await gmailService.isAuthenticated();
    res.json({ authenticated: isAuthenticated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/google/auth-url
 * Devuelve la URL para iniciar el flujo OAuth2
 */
router.get('/auth-url', (req, res) => {
  try {
    const authUrl = gmailService.getAuthUrl();
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/integrations/google/callback
 * Callback de OAuth2, recibe el code y guarda tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Código de autorización no proporcionado' });
    }

    await gmailService.handleCallback(code);
    
    // Redirigir al frontend
    res.redirect('/presupuesto/tenpo?auth=success');
  } catch (error: any) {
    console.error('Error en callback OAuth:', error);
    res.redirect('/presupuesto/tenpo?auth=error');
  }
});

export default router;
