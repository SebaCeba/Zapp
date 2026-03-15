import express from 'express';
import { gmailService } from '../services/gmail.service';

const router = express.Router();

/**
 * GET /api/gmail/labels
 * Lista labels reales del Gmail autenticado (solo labels de usuario, sin system labels)
 */
router.get('/labels', async (req, res) => {
  try {
    // Verificar autenticación antes de intentar obtener labels
    const { authenticated } = await gmailService.getAuthStatus();
    
    if (!authenticated) {
      return res.status(401).json({ 
        error: 'No autenticado con Google. Conecta Google desde Integraciones.'
      });
    }

    // Obtener cliente autenticado (con auto-refresh si es necesario)
    const gmail = await gmailService.getAuthenticatedClient();
    
    // Listar todos los labels
    const response = await gmail.users.labels.list({ userId: 'me' });
    
    // Filtrar solo labels de usuario (excluir system labels)
    const userLabels = (response.data.labels || [])
      .filter(label => label.type === 'user')
      .map(label => ({
        id: label.id,
        name: label.name,
        type: label.type
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Ordenar alfabéticamente

    res.json(userLabels);

  } catch (error: any) {
    console.error('[Gmail API] Error listando labels:', error);
    
    // Si el error es de autenticación (token revocado/inválido)
    if (error.message?.includes('vuelve a autenticarte') || 
        error.message?.includes('Debe autenticarse primero')) {
      return res.status(401).json({ 
        error: 'No autenticado con Google. Conecta Google desde Integraciones.'
      });
    }

    // Otros errores
    res.status(500).json({ 
      error: 'Error al obtener labels de Gmail. Intenta nuevamente.'
    });
  }
});

export default router;
