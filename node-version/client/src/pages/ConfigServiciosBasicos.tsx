import { useState, useEffect } from 'react';
import { Panel, Tabs, Toggle, SelectPicker, Button, Loader, Message } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { showToast } from '../components/Toast';

interface Provider {
  id: number;
  nombre: string;
  hasEmailConnector: boolean;
  gmailLabel: string | null;
}

interface GmailLabel {
  id: string;
  name: string;
  type: string;
}

interface GoogleAuthStatus {
  authenticated: boolean;
  tokenExpired: boolean;
  expiryDate: string | null;
}

export default function ConfigServiciosBasicos() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({ 
    authenticated: false, 
    tokenExpired: false, 
    expiryDate: null 
  });
  const [loading, setLoading] = useState(true);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [authUrl, setAuthUrl] = useState('');
  
  // Estados por provider (key = provider nombre)
  const [configs, setConfigs] = useState<Record<string, { 
    hasEmailConnector: boolean; 
    gmailLabel: string | null;
    saving: boolean;
  }>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar providers, auth status y auth URL en paralelo
      const [providersRes, authStatusRes, authUrlRes] = await Promise.all([
        fetch('/api/utilities/providers'),
        fetch('/api/integrations/google/status'),
        fetch('/api/integrations/google/auth-url')
      ]);

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData);
        
        // Inicializar configs con valores actuales
        const initialConfigs: typeof configs = {};
        providersData.forEach((p: Provider) => {
          initialConfigs[p.nombre] = {
            hasEmailConnector: p.hasEmailConnector,
            gmailLabel: p.gmailLabel,
            saving: false
          };
        });
        setConfigs(initialConfigs);
        
        // Setear primer tab
        if (providersData.length > 0 && !activeTab) {
          setActiveTab(providersData[0].nombre);
        }
      }

      if (authStatusRes.ok) {
        const authData = await authStatusRes.json();
        setAuthStatus(authData);
        
        // Si está autenticado, cargar labels
        if (authData.authenticated) {
          loadGmailLabels();
        }
      }

      if (authUrlRes.ok) {
        const authUrlData = await authUrlRes.json();
        setAuthUrl(authUrlData.authUrl);
      }

    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('Error al cargar la configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadGmailLabels = async () => {
    setLabelsLoading(true);
    try {
      const response = await fetch('/api/gmail/labels');
      
      if (response.ok) {
        const labels = await response.json();
        setGmailLabels(labels);
      } else if (response.status === 401) {
        // No autenticado
        setAuthStatus({ authenticated: false, tokenExpired: false, expiryDate: null });
      }
    } catch (error) {
      console.error('Error cargando labels de Gmail:', error);
    } finally {
      setLabelsLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    if (authUrl) {
      const popup = window.open(authUrl, '_blank', 'width=600,height=700');
      
      // Escuchar cuando se cierre el popup
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          // Recargar datos después de autenticación
          setTimeout(() => {
            loadData();
          }, 1000);
        }
      }, 500);
    }
  };

  const handleToggleChange = (provider: string, value: boolean) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        hasEmailConnector: value,
        // Si se desactiva, limpiar label
        gmailLabel: value ? prev[provider].gmailLabel : null
      }
    }));
  };

  const handleLabelChange = (provider: string, value: string | null) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        gmailLabel: value
      }
    }));
  };

  const handleSave = async (provider: string) => {
    const config = configs[provider];
    
    if (!config) return;

    // Validaciones
    if (config.hasEmailConnector && !config.gmailLabel) {
      showToast('Advertencia: Email connector habilitado sin label configurado. No se importará nada hasta que selecciones un label.', 'warning');
    }

    setConfigs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], saving: true }
    }));

    try {
      const response = await fetch(`/api/utilities/providers/${provider}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasEmailConnector: config.hasEmailConnector,
          gmailLabel: config.gmailLabel
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar configuración');
      }

      const updated = await response.json();
      
      // Actualizar provider en la lista
      setProviders(prev => 
        prev.map(p => p.nombre === provider ? updated : p)
      );

      showToast(`Configuración guardada para ${provider}`, 'success');

    } catch (error: any) {
      console.error('Error guardando configuración:', error);
      showToast(error.message || 'Error al guardar configuración', 'error');
    } finally {
      setConfigs(prev => ({
        ...prev,
        [provider]: { ...prev[provider], saving: false }
      }));
    }
  };

  const hasChanges = (provider: string): boolean => {
    const config = configs[provider];
    const original = providers.find(p => p.nombre === provider);
    
    if (!config || !original) return false;
    
    return config.hasEmailConnector !== original.hasEmailConnector ||
           config.gmailLabel !== original.gmailLabel;
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Loader size="lg" content="Cargando configuración..." />
        </div>
      </MainLayout>
    );
  }

  const labelOptions = gmailLabels.map(label => ({
    label: label.name,
    value: label.name
  }));

  return (
    <MainLayout>
      <PageTitleSection 
        title="⚙️ Configuración de Servicios Básicos"
        subtitle="Asocia labels de Gmail para importar automáticamente facturas de cada servicio"
      />

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Estado de Google OAuth */}
        <Panel 
          bordered 
          style={{ 
            marginBottom: '24px', 
            backgroundColor: authStatus.authenticated ? '#f0fdf4' : '#fef2f2',
            borderLeft: `4px solid ${authStatus.authenticated ? '#10b981' : '#ef4444'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ 
                margin: 0, 
                marginBottom: '8px', 
                color: authStatus.authenticated ? '#065f46' : '#991b1b' 
              }}>
                {authStatus.authenticated ? '✅ Google Conectado' : '❌ Google No Conectado'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                {authStatus.authenticated 
                  ? `Acceso a Gmail configurado${authStatus.expiryDate ? ` (expira: ${new Date(authStatus.expiryDate).toLocaleString()})` : ''}`
                  : 'Necesitas conectar tu cuenta de Google para listar labels y validar configuraciones'
                }
              </p>
            </div>
            {!authStatus.authenticated && (
              <Button 
                appearance="primary" 
                color="blue"
                onClick={handleConnectGoogle}
              >
                Conectar Google
              </Button>
            )}
            {authStatus.authenticated && (
              <Button 
                appearance="ghost" 
                onClick={loadGmailLabels}
                loading={labelsLoading}
              >
                Recargar Labels
              </Button>
            )}
          </div>
        </Panel>

        {/* Mensaje de ayuda */}
        {!authStatus.authenticated && (
          <Message type="warning" showIcon style={{ marginBottom: '24px' }}>
            <strong>Conecta Google primero</strong> para poder seleccionar labels de Gmail y validar la configuración.
          </Message>
        )}

        {/* Tabs por Provider */}
        <Panel bordered>
          <Tabs 
            activeKey={activeTab} 
            onSelect={setActiveTab}
            appearance="subtle"
          >
            {providers.map(provider => {
              const config = configs[provider.nombre];
              
              if (!config) return null;

              return (
                <Tabs.Tab 
                  key={provider.nombre} 
                  eventKey={provider.nombre} 
                  title={provider.nombre}
                >
                  <div style={{ padding: '24px 0' }}>
                    
                    {/* Toggle Email Connector */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <Toggle
                          checked={config.hasEmailConnector}
                          onChange={(value) => handleToggleChange(provider.nombre, value)}
                        />
                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                          Habilitar Email Connector
                        </span>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        paddingLeft: '56px', 
                        fontSize: '0.875rem', 
                        color: '#666' 
                      }}>
                        Si está habilitado, podrás importar facturas automáticamente desde Gmail
                      </p>
                    </div>

                    {/* Selector de Label */}
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ 
                        display: 'block', 
                        fontWeight: 600, 
                        marginBottom: '8px' 
                      }}>
                        Gmail Label
                      </label>
                      <SelectPicker
                        data={labelOptions}
                        value={config.gmailLabel}
                        onChange={(value) => handleLabelChange(provider.nombre, value)}
                        placeholder="Selecciona un label..."
                        searchable
                        cleanable
                        disabled={!config.hasEmailConnector || !authStatus.authenticated}
                        loading={labelsLoading}
                        style={{ width: '100%', maxWidth: '500px' }}
                        locale={{
                          searchPlaceholder: 'Buscar label...',
                          noResultsText: 'No se encontró el label'
                        }}
                      />
                      <p style={{ 
                        margin: 0, 
                        marginTop: '8px', 
                        fontSize: '0.75rem', 
                        color: '#666' 
                      }}>
                        {!config.hasEmailConnector 
                          ? 'Habilita el Email Connector primero para seleccionar un label'
                          : !authStatus.authenticated
                          ? 'Conecta Google para ver los labels disponibles'
                          : 'Selecciona el label exacto donde Gmail filtra las facturas de este servicio'
                        }
                      </p>
                    </div>

                    {/* Ayuda */}
                    {config.hasEmailConnector && !config.gmailLabel && (
                      <Message type="info" showIcon style={{ marginBottom: '24px' }}>
                        <strong>Sin label configurado:</strong> El conector no importará nada hasta que selecciones un label de Gmail.
                      </Message>
                    )}

                    {/* Botón Guardar */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Button
                        appearance="primary"
                        color="green"
                        onClick={() => handleSave(provider.nombre)}
                        disabled={!hasChanges(provider.nombre) || config.saving}
                        loading={config.saving}
                      >
                        Guardar Configuración
                      </Button>
                      
                      {hasChanges(provider.nombre) && (
                        <span style={{ fontSize: '0.875rem', color: '#666' }}>
                          Tienes cambios sin guardar
                        </span>
                      )}
                    </div>

                  </div>
                </Tabs.Tab>
              );
            })}
          </Tabs>
        </Panel>

        {/* Footer con ayuda adicional */}
        <div style={{ 
          marginTop: '32px', 
          padding: '16px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#666'
        }}>
          <p style={{ margin: 0, marginBottom: '8px' }}>
            <strong>💡 Tip:</strong> Para que la importación funcione correctamente:
          </p>
          <ul style={{ margin: 0, paddingLeft: '24px' }}>
            <li>Crea labels en Gmail con nombres descriptivos (ej: "Facturación ENEL", "Facturación VTR")</li>
            <li>Configura filtros en Gmail para que las facturas se etiqueten automáticamente</li>
            <li>El nombre del label debe coincidir exactamente (incluyendo mayúsculas y espacios)</li>
            <li>Después de configurar, ve a "Actual → Servicios Básicos" para importar facturas</li>
          </ul>
        </div>

      </div>
    </MainLayout>
  );
}
