import { useState, useEffect } from 'react';
import { SelectPicker, Button } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import TablaPresupuestoServicios from '../components/TablaPresupuestoServicios';
import GestionarCatalogoModal from '../components/GestionarCatalogoModal';

const ServiciosBasicos: React.FC = () => {
  const [anioActual] = useState(new Date().getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  const handleServiciosUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="container">
        <h1 style={{ marginBottom: '1.5rem', color: '#2d7a2d' }}>🏠 Servicios Básicos</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Planifica el presupuesto anual de tus servicios del hogar
        </p>

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
              <SelectPicker
                data={aniosDisponibles.map(anio => ({ label: anio.toString(), value: anio }))}
                value={anioSeleccionado}
                onChange={(value) => setAnioSeleccionado(value || new Date().getFullYear())}
                cleanable={false}
                searchable={false}
                style={{ width: 120 }}
              />
            </div>

            <Button
              appearance="primary"
              onClick={() => setModalAbierto(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>⚙️</span>
              <span>Gestionar Catálogo</span>
            </Button>
          </div>
        </div>

        {/* Tabla principal */}
        <TablaPresupuestoServicios 
          key={`${anioSeleccionado}-${refreshKey}`}
          anio={anioSeleccionado}
          onOpenCatalogo={() => setModalAbierto(true)}
        />

        {/* Modal de gestión */}
        <GestionarCatalogoModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onServiciosUpdated={handleServiciosUpdated}
        />
      </div>
    </MainLayout>
  );
};

export default ServiciosBasicos;
