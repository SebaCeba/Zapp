import { useState } from 'react';
import type { FC } from 'react';
import { SelectPicker, Button } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import TablaPresupuestoIngresos from '../components/TablaPresupuestoIngresos';
import GestionarIngresosModal from '../components/GestionarIngresosModal';
import GestionarBonosModal from '../components/GestionarBonosModal';

const Ingresos: FC = () => {
  const [anioActual] = useState(new Date().getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [modalIngresosAbierto, setModalIngresosAbierto] = useState(false);
  const [modalBonosAbierto, setModalBonosAbierto] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  const handleIngresosUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBonosUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Ingresos"
          description="Planifica tus ingresos mensuales, bonos y distribución anual"
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
                onClick={() => setModalIngresosAbierto(true)}
              >
                💼 Gestionar Ingresos
              </Button>
              <Button
                appearance="primary"
                color="yellow"
                onClick={() => setModalBonosAbierto(true)}
              >
                💰 Gestionar Bonos
              </Button>
            </>
          }
        />

        {/* Tabla principal */}
        <TablaPresupuestoIngresos 
          key={`${anioSeleccionado}-${refreshKey}`}
          anio={anioSeleccionado}
          onOpenCatalogo={() => setModalIngresosAbierto(true)}
          onOpenBonos={() => setModalBonosAbierto(true)}
        />

        {/* Modales */}
        <GestionarIngresosModal
          isOpen={modalIngresosAbierto}
          onClose={() => setModalIngresosAbierto(false)}
          onIngresosUpdated={handleIngresosUpdated}
        />

        <GestionarBonosModal
          isOpen={modalBonosAbierto}
          onClose={() => setModalBonosAbierto(false)}
          onBonosUpdated={handleBonosUpdated}
          anio={anioSeleccionado}
        />
      </div>
    </MainLayout>
  );
};

export default Ingresos;
