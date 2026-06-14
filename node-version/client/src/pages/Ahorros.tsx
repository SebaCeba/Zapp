import { useState } from 'react';
import type { FC } from 'react';
import { SelectPicker, Button } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import TablaPresupuestoAhorros from '../components/TablaPresupuestoAhorros';
import GestionarAhorrosModal from '../components/GestionarAhorrosModal';

const Ahorros: FC = () => {
  const [anioActual] = useState(new Date().getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  const handleAhorrosUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Ahorros"
          description="Planifica el presupuesto anual de tus metas de ahorro"
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
                💰 Gestionar Ahorros
              </Button>
            </>
          }
        />

        {/* Tabla principal */}
        <TablaPresupuestoAhorros 
          key={`${anioSeleccionado}-${refreshKey}`}
          anio={anioSeleccionado}
          onOpenCatalogo={() => setModalAbierto(true)}
        />

        {/* Modal de gestión */}
        <GestionarAhorrosModal
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onAhorrosUpdated={handleAhorrosUpdated}
        />
      </div>
    </MainLayout>
  );
};

export default Ahorros;
