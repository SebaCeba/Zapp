import type { CSSProperties } from 'react';
import { Message } from 'rsuite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GmailSyncStatus } from '../../types/gmailIntegration';

interface GmailSyncStatusBannerProps {
  status: GmailSyncStatus;
  serviceName: string; // e.g., "Tenpo TC", "Servicios Básicos", "Gmail"
  lastSync?: Date | null;
  onReauthorize?: () => void;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reusable banner component for displaying Gmail integration sync status
 * 
 * Supports any Gmail-based integration (email parsing, label-based workflows, etc.)
 * Shows appropriate message and actions based on current status.
 * 
 * Usage:
 * ```tsx
 * <GmailSyncStatusBanner
 *   status="expired"
 *   serviceName="Tenpo TC"
 *   lastSync={lastSyncDate}
 *   onReauthorize={() => window.open(authUrl, '_blank')}
 * />
 * ```
 */
export default function GmailSyncStatusBanner({
  status,
  serviceName,
  lastSync,
  onReauthorize,
  className,
  style,
}: GmailSyncStatusBannerProps) {
  // Only show banner for non-ok statuses
  if (status === 'ok') {
    return null;
  }

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  const getMessageConfig = () => {
    switch (status) {
      case 'expired':
        return {
          type: 'warning' as const,
          icon: '⚠️',
          title: 'Sincronización deshabilitada',
          description: `Tu token de Gmail ha expirado. Puedes ver los datos guardados de ${serviceName}, pero no sincronizar nuevos hasta que vuelvas a autorizar.`,
        };
      
      case 'unavailable':
        return {
          type: 'info' as const,
          icon: '🔐',
          title: 'Autorización requerida',
          description: `Para sincronizar datos de ${serviceName} desde Gmail, necesitas autorizar el acceso a tu cuenta.`,
        };
      
      case 'error':
        return {
          type: 'error' as const,
          icon: '❌',
          title: 'Error de sincronización',
          description: `No se pudo conectar con Gmail para sincronizar ${serviceName}. Verifica tu conexión e intenta nuevamente.`,
        };
      
      default:
        return {
          type: 'info' as const,
          icon: 'ℹ️',
          title: 'Estado desconocido',
          description: 'No se pudo determinar el estado de sincronización con Gmail.',
        };
    }
  };

  const config = getMessageConfig();

  return (
    <div className={className} style={{ marginBottom: '1.5rem', ...style }}>
      <Message showIcon type={config.type} style={{ borderRadius: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              {config.icon} {config.title}
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              {config.description}
            </p>
            {lastSync && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>
                Última sincronización: {formatDateTime(lastSync)}
              </p>
            )}
          </div>
          {onReauthorize && (status === 'expired' || status === 'unavailable') && (
            <button
              onClick={onReauthorize}
              className="button"
              style={{
                backgroundColor: '#3b82f6',
                color: '#fff',
                padding: '0.5rem 1rem',
                whiteSpace: 'nowrap',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
              }}
            >
              🔄 {status === 'expired' ? 'Re-autorizar con Google' : 'Autorizar con Google'}
            </button>
          )}
        </div>
      </Message>
    </div>
  );
}
