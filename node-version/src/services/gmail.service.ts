import { google } from 'googleapis';
import prisma from '../db';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export class GmailService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/integrations/google/callback'
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async handleCallback(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    // Guardar tokens en DB
    await prisma.googleAuthToken.deleteMany({}); // Solo un token activo
    await prisma.googleAuthToken.create({
      data: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: new Date(tokens.expiry_date!),
        scope: tokens.scope!,
        tokenType: tokens.token_type || 'Bearer'
      }
    });

    return tokens;
  }

  async getAuthenticatedClient() {
    const tokenRecord = await prisma.googleAuthToken.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!tokenRecord) {
      throw new Error('No hay tokens de autenticación. Debe autenticarse primero.');
    }

    this.oauth2Client.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: tokenRecord.expiryDate.getTime(),
      scope: tokenRecord.scope,
      token_type: tokenRecord.tokenType
    });

    // Verificar si el token expiró y refrescarlo
    if (new Date() >= tokenRecord.expiryDate) {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await prisma.googleAuthToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: credentials.access_token!,
          expiryDate: new Date(credentials.expiry_date!),
        }
      });

      this.oauth2Client.setCredentials(credentials);
    }

    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const tokenRecord = await prisma.googleAuthToken.findFirst();
      return !!tokenRecord;
    } catch {
      return false;
    }
  }

  async getAuthStatus(): Promise<{ authenticated: boolean; tokenExpired: boolean; expiryDate: Date | null }> {
    try {
      const tokenRecord = await prisma.googleAuthToken.findFirst();
      
      if (!tokenRecord) {
        return { authenticated: false, tokenExpired: false, expiryDate: null };
      }

      const isExpired = new Date() >= tokenRecord.expiryDate;
      
      return {
        authenticated: true,
        tokenExpired: isExpired,
        expiryDate: tokenRecord.expiryDate
      };
    } catch {
      return { authenticated: false, tokenExpired: false, expiryDate: null };
    }
  }

  async clearAuth() {
    await prisma.googleAuthToken.deleteMany({});
  }

  async getLabelIdByName(labelName: string): Promise<string | null> {
    const gmail = await this.getAuthenticatedClient();
    
    const response = await gmail.users.labels.list({
      userId: 'me'
    });

    const label = response.data.labels?.find(
      l => l.name === labelName
    );

    console.log(`🏷️  Buscando etiqueta: "${labelName}"`);
    console.log(`🔍 Encontrada: ${label ? `✅ ID=${label.id}` : '❌ NO ENCONTRADA'}`);

    return label?.id || null;
  }

  async getEmailsByLabel(labelName: string, maxResults: number = 0) {
    const gmail = await this.getAuthenticatedClient();
    
    // Convertir nombre de etiqueta a ID
    const labelId = await this.getLabelIdByName(labelName);
    
    if (!labelId) {
      console.warn(`⚠️  Etiqueta no encontrada: ${labelName}`);
      return [];
    }

    console.log(`📬 Buscando mensajes con labelId: ${labelId}`);

    let allMessageIds: any[] = [];
    let pageToken: string | undefined = undefined;

    // Obtener TODOS los IDs de mensajes usando paginación
    do {
      const response = await gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        maxResults: 500, // Máximo por página que permite Gmail API
        pageToken
      });

      if (response.data.messages) {
        allMessageIds = allMessageIds.concat(response.data.messages);
      }

      pageToken = response.data.nextPageToken as string | undefined;
      
      if (pageToken) {
        console.log(`📄 Página ${Math.ceil(allMessageIds.length / 500)}: ${allMessageIds.length} mensajes acumulados...`);
      }
    } while (pageToken); // Continuar hasta obtener TODOS

    console.log(`📊 Total mensajes encontrados: ${allMessageIds.length}`);

    if (allMessageIds.length === 0) {
      return [];
    }

    // Si maxResults > 0, limitar a esa cantidad (para testing)
    const messagesToFetch = maxResults > 0 ? allMessageIds.slice(0, maxResults) : allMessageIds;

    console.log(`📥 Descargando ${messagesToFetch.length} mensajes completos (esto puede tomar varios minutos)...`);

    // Descargar en lotes de 50 para no saturar la API
    const batchSize = 50;
    const messages: any[] = [];

    for (let i = 0; i < messagesToFetch.length; i += batchSize) {
      const batch = messagesToFetch.slice(i, i + batchSize);
      const batchMessages = await Promise.all(
        batch.map(async (message) => {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });
          return msg.data;
        })
      );
      messages.push(...batchMessages);
      
      if (i + batchSize < messagesToFetch.length) {
        console.log(`   Progreso: ${i + batchSize}/${messagesToFetch.length} mensajes descargados...`);
      }
    }

    console.log(`✅ Descarga completa: ${messages.length} mensajes`);

    return messages;
  }

  extractBodyFromMessage(message: any): string {
    let body = '';

    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
        if (part.mimeType === 'text/html' && part.body.data && !body) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return body;
  }

  getMessageDate(message: any): Date {
    const dateHeader = message.payload.headers.find(
      (h: any) => h.name.toLowerCase() === 'date'
    );
    return dateHeader ? new Date(dateHeader.value) : new Date(parseInt(message.internalDate));
  }
}

export const gmailService = new GmailService();
