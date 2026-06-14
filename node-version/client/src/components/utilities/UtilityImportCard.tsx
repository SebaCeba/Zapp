import { Button } from 'rsuite';
import type { ChangeEvent } from 'react';

interface UtilityImportCardProps {
  provider: string;
  hasEmailConnector: boolean;
  gmailLabel: string | null;
  onImport: (file: File) => void;
  onImportEmail: () => void;
  onAddManual: () => void;
  importingEmail?: boolean;
}

export default function UtilityImportCard({ 
  provider, 
  hasEmailConnector, 
  gmailLabel,
  onImport, 
  onImportEmail,
  onAddManual,
  importingEmail = false
}: UtilityImportCardProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>
        📤 Importar / Agregar Gastos - {provider}
      </h3>
      
      {hasEmailConnector && gmailLabel && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '6px',
          marginBottom: '1rem',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.25rem' }}>
            ✉️ <strong>Email Connector habilitado</strong>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            Gmail Label: <code style={{ 
              padding: '2px 6px', 
              backgroundColor: '#fff', 
              borderRadius: '3px',
              fontSize: '0.75rem'
            }}>{gmailLabel}</code>
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#1e40af', 
            marginTop: '0.5rem',
            padding: '0.5rem',
            backgroundColor: '#dbeafe',
            borderRadius: '4px'
          }}>
            💡 <strong>Importante:</strong> Importar desde Gmail registra pagos ya realizados en "Actual" (flujo de caja). 
            No registra deudas ni boletas pendientes.
          </div>
        </div>
      )}
      
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Importa un archivo CSV con formato: <code>fecha,monto,descripcion</code>
        <br />
        <small>Ejemplo: 2026-01-15,45000,Pago mensual</small>
      </p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {hasEmailConnector && (
          <Button 
            appearance="primary" 
            color="green"
            onClick={onImportEmail}
            loading={importingEmail}
            disabled={importingEmail}
          >
            {importingEmail ? '📧 Cargando...' : '📧 Importar (preparar registros)'}
          </Button>
        )}

        <Button appearance="primary" as="label" style={{ cursor: 'pointer' }}>
          📄 Importar CSV
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </Button>

        <Button appearance="ghost" onClick={onAddManual}>
          ➕ Agregar Manual
        </Button>
      </div>
    </div>
  );
}
