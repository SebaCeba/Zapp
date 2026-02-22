import { useState } from 'react';
import { SelectPicker } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import TablaPresupuestoSupermercado from '../components/TablaPresupuestoSupermercado';

export default function Supermercado() {
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
          title="Supermercado"
          description="Planifica el presupuesto mensual de compras de supermercado"
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

        <TablaPresupuestoSupermercado anio={anioSeleccionado} />
      </div>
    </MainLayout>
  );
}
