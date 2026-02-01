import express from 'express';
import { gmailService } from '../services/gmail.service';

const router = express.Router();

/**
 * GET /api/integrations/google/status
 * Verifica si hay autenticación activa con Google
 */
router.get('/status', async (req, res) => {
  try {
    const { authenticated, tokenExpired, expiryDate } = await gmailService.getAuthStatus();
    res.json({ authenticated, tokenExpired, expiryDate });
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
    
    // Redirigir al frontend con mensaje de éxito
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticación exitosa</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .message {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .success { color: #059669; font-size: 3rem; }
          h1 { color: #1f2937; margin: 1rem 0; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="message">
          <div class="success">✓</div>
          <h1>¡Autenticación exitosa!</h1>
          <p>Puedes cerrar esta ventana y volver a la aplicación.</p>
          <p style="font-size: 0.875rem; margin-top: 1rem;">La página principal se recargará automáticamente.</p>
        </div>
        <script>
          // Cerrar ventana emergente y recargar la ventana padre
          if (window.opener) {
            window.opener.location.reload();
            setTimeout(() => window.close(), 2000);
          }
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error en callback OAuth:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error de autenticación</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .message {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .error { color: #dc2626; font-size: 3rem; }
          h1 { color: #1f2937; margin: 1rem 0; }
          p { color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="message">
          <div class="error">✗</div>
          <h1>Error de autenticación</h1>
          <p>${error.message}</p>
          <p style="font-size: 0.875rem; margin-top: 1rem;">Puedes cerrar esta ventana e intentar nuevamente.</p>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * DELETE /api/integrations/google/auth
 * Elimina el token de autenticación actual
 */
router.delete('/auth', async (req, res) => {
  try {
    await gmailService.clearAuth();
    res.json({ success: true, message: 'Token eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
