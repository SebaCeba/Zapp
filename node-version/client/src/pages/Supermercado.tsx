import React, { useState } from 'react';
import { SelectPicker } from 'rsuite';
import MainLayout from '../layout/MainLayout';
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
        <h1 style={{ marginBottom: '1.5rem', color: '#2d7a2d' }}>🛒 Supermercado</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Planifica el presupuesto mensual de compras de supermercado
        </p>

        {/* Controles */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
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
        </div>

        <TablaPresupuestoSupermercado anio={anioSeleccionado} />
      </div>
    </MainLayout>
  );
}
