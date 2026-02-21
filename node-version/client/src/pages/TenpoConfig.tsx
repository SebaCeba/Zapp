import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import MainLayout from '../layout/MainLayout';
import { showToast } from '../components/Toast';

interface TasaConfig {
  id: number;
  tasaMensual: number;
  cae: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
  createdAt: string;
}

export default function TenpoConfig() {
  const [historial, setHistorial] = useState<TasaConfig[]>([]);
  const [tasaActual, setTasaActual] = useState<TasaConfig | null>(null);
  const [nuevaTasaMensual, setNuevaTasaMensual] = useState('2.11');
  const [nuevoCae, setNuevoCae] = useState('28.4');
  const [vigenteDesde, setVigenteDesde] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasaRes, historialRes] = await Promise.all([
        fetch('http://localhost:3000/api/tenpo/config/tasa'),
        fetch('http://localhost:3000/api/tenpo/config/tasa/historial')
      ]);

      if (tasaRes.ok) {
        const tasaData = await tasaRes.json();
        setTasaActual(tasaData);
      }

      if (historialRes.ok) {
        const historialData = await historialRes.json();
        setHistorial(historialData);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const handleCrearTasa = async (e: React.FormEvent) => {
    e.preventDefault();

    const tasaMensual = parseFloat(nuevaTasaMensual);
    const cae = parseFloat(nuevoCae);

    if (isNaN(tasaMensual) || isNaN(cae) || tasaMensual < 0 || cae < 0) {
      showToast('Valores inválidos', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/tenpo/config/tasa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasaMensual,
          cae,
          vigenteDesde: new Date(vigenteDesde)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear tasa');
      }

      showToast('Tasa actualizada. Se recalcularán las compras en modo ESTIMADO.', 'info');

      // Recalcular compras estimadas
      await fetch('http://localhost:3000/api/tenpo/recalcular-estimadas', {
        method: 'POST'
      });

      showToast('Tasa actualizada y compras recalculadas exitosamente', 'success');

      await loadData();
    } catch (error: any) {
      console.error('Error creando tasa:', error);
      showToast(error.message || 'Error al crear tasa', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  return (
    <MainLayout>
      <div className="container">
        <h1 style={{ marginBottom: '1.5rem', color: '#1e40af' }}>⚙️ Configuración de Tasas Tenpo</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Administra las tasas de interés para el cálculo de cuotas en modo ESTIMADO
        </p>

        {/* Tasa Actual */}
        {tasaActual && (
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #10b981' }}>
            <h3 style={{ marginBottom: '1rem', color: '#065f46' }}>Tasa Vigente Actual</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Tasa Mensual</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#065f46' }}>
                  {(tasaActual.tasaMensual * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>CAE Anual</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#065f46' }}>
                  {tasaActual.cae.toFixed(2)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Vigente Desde</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#065f46' }}>
                  {formatDate(tasaActual.vigenteDesde)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario Nueva Tasa */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>Actualizar Tasa</h3>
          <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
            Al crear una nueva tasa, la anterior se cerrará automáticamente y todas las compras en modo ESTIMADO se recalcularán.
            Las compras confirmadas (modo REAL) no se verán afectadas.
          </p>

          <form onSubmit={handleCrearTasa}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Tasa Mensual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevaTasaMensual}
                  onChange={(e) => setNuevaTasaMensual(e.target.value)}
                  className="input"
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Ejemplo: 2.11 para 2.11%
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  CAE Anual (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCae}
                  onChange={(e) => setNuevoCae(e.target.value)}
                  className="input"
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Ejemplo: 28.4 para 28.4%
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Vigente Desde
                </label>
                <input
                  type="date"
                  value={vigenteDesde}
                  onChange={(e) => setVigenteDesde(e.target.value)}
                  className="input"
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Fecha desde la cual aplica
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button"
              style={{
                backgroundColor: '#10b981',
                color: '#fff',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creando y recalculando...' : '✓ Crear Nueva Tasa'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', color: '#1e40af' }}>Historial de Tasas</h3>
          
          {historial.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No hay historial de tasas
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Tasa Mensual</th>
                    <th>CAE Anual</th>
                    <th>Vigente Desde</th>
                    <th>Vigente Hasta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((tasa) => (
                    <tr key={tasa.id}>
                      <td style={{ fontWeight: '600' }}>
                        {(tasa.tasaMensual * 100).toFixed(2)}%
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        {tasa.cae.toFixed(2)}%
                      </td>
                      <td>{formatDate(tasa.vigenteDesde)}</td>
                      <td>{tasa.vigenteHasta ? formatDate(tasa.vigenteHasta) : '-'}</td>
                      <td>
                        {!tasa.vigenteHasta ? (
                          <span style={{ 
                            backgroundColor: '#10b981', 
                            color: '#fff', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            VIGENTE
                          </span>
                        ) : (
                          <span style={{ 
                            backgroundColor: '#6b7280', 
                            color: '#fff', 
                            padding: '4px 8px', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            CERRADA
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
