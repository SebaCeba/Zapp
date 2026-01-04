import { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import TablaPresupuestoIngresos from '../components/TablaPresupuestoIngresos';
import GestionarIngresosModal from '../components/GestionarIngresosModal';
import GestionarBonosModal from '../components/GestionarBonosModal';

const Ingresos: React.FC = () => {
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
        <h1 style={{ marginBottom: '1.5rem', color: '#16a34a' }}>💰 Ingresos</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Planifica tus ingresos mensuales, bonos y distribución anual
        </p>

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="select"
                style={{ width: 'auto', minWidth: '100px' }}
              >
                {aniosDisponibles.map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setModalIngresosAbierto(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>⚙️</span>
              <span>Gestionar Ingresos</span>
            </button>

            <button
              onClick={() => setModalBonosAbierto(true)}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fbbf24', color: '#78350f' }}
            >
              <span>💰</span>
              <span>Gestionar Bonos</span>
            </button>
          </div>
        </div>

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
