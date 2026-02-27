import { useState } from 'react';
import { SelectPicker } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';

const Gastos: React.FC = () => {
  const [anioActual] = useState(new Date().getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Gastos"
          description="Planifica y visualiza todos tus gastos mensuales"
          actions={
            <SelectPicker
              data={aniosDisponibles.map(anio => ({ label: anio.toString(), value: anio }))}
              value={anioSeleccionado}
              onChange={(value) => setAnioSeleccionado(value || new Date().getFullYear())}
              cleanable={false}
              searchable={false}
              style={{ width: 120 }}
            />
          }
        />

        <div style={{ marginTop: '20px', textAlign: 'center', padding: '40px' }}>
          <h3>Vista de Gastos - {anioSeleccionado}</h3>
          <p style={{ color: '#999', marginTop: '10px' }}>
            Esta sección está lista para mostrar un consolidado de todos tus gastos.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Gastos;
