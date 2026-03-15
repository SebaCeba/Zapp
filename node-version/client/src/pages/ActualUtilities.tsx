import { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import { Nav, SelectPicker } from 'rsuite';
import UtilityProviderPanel from '../components/utilities/UtilityProviderPanel';

interface Provider {
  id: number;
  nombre: string;
  esBase: boolean;
  orden: number;
  hasEmailConnector: boolean;
  gmailLabel: string | null;
}

export default function ActualUtilities() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [providers, setProviders] = useState<Provider[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/utilities/providers');
      const data = await response.json();
      setProviders(data);
      if (data.length > 0 && !activeTab) {
        setActiveTab(data[0].nombre);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 11 }, (_, i) => {
    const val = currentDate.getFullYear() - 5 + i;
    return { label: val.toString(), value: val };
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="container">
          <PageTitleSection
            title="Servicios Básicos - Actual"
            description="Gestión de gastos reales en servicios del hogar"
          />
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p>Cargando proveedores...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (providers.length === 0) {
    return (
      <MainLayout>
        <div className="container">
          <PageTitleSection
            title="Servicios Básicos - Actual"
            description="Gestión de gastos reales en servicios del hogar"
          />
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ color: '#999', marginBottom: '1rem' }}>📋 No hay proveedores configurados</h3>
            <p style={{ color: '#666' }}>
              Ve a la sección de Servicios Básicos en Presupuesto para configurar tus proveedores.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Servicios Básicos - Actual"
          description={`Registro anual de ${year}`}
          actions={
            <SelectPicker
              data={years}
              value={year}
              onChange={(val) => val && setYear(val)}
              cleanable={false}
              searchable={false}
              style={{ width: 100 }}
            />
          }
        />

        {/* Tabs dinámicos por provider */}
        <div className="card" style={{ padding: '1rem 1rem 0 1rem', marginBottom: '1rem' }}>
          <Nav appearance="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            {providers.map(provider => (
              <Nav.Item key={provider.nombre} eventKey={provider.nombre}>
                {provider.nombre}
              </Nav.Item>
            ))}
          </Nav>
        </div>

        {/* Panel del provider activo */}
        {activeTab && (
          <UtilityProviderPanel
            provider={activeTab}
            providerConfig={providers.find(p => p.nombre === activeTab)}
            year={year}
            onDataChange={loadProviders}
          />
        )}
      </div>
    </MainLayout>
  );
}
