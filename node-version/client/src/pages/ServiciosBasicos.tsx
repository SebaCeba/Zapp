import { useState, useEffect } from 'react';
import { SelectPicker, Button } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
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
        <PageTitleSection
          title="Servicios Básicos"
          description="Planifica el presupuesto anual de tus servicios del hogar"
          actions={
            <>
              <SelectPicker
                data={aniosDisponibles.map(anio => ({ label: anio.toString(), value: anio }))}
                value={anioSeleccionado}
                onChange={(value) => setAnioSeleccionado(value || new Date().getFullYear())}
                cleanable={false}
                searchable={false}
                style={{ width: 120 }}
              />
              <Button
                appearance="primary"
                onClick={() => setModalAbierto(true)}
              >
                ⚙️ Gestionar Servicios
              </Button>
            </>
          }
        />

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
