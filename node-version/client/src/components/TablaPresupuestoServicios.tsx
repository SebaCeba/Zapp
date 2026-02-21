import React, { useState, useEffect } from 'react';
import { Button, Input } from 'rsuite';

interface Servicio {
  id: number;
  nombre: string;
  activo: boolean;
  esBase: boolean;
  orden: number;
  presupuestos: Presupuesto[];
}

interface Presupuesto {
  id?: number;
  servicioId: number;
  anio: number;
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
}

interface Props {
  anio: number;
  onOpenCatalogo: () => void;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_DISPLAY = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function TablaPresupuestoServicios({ anio, onOpenCatalogo }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<{ servicioId: number; mes: string } | null>(null);
  const [guardando, setGuardando] = useState<{ servicioId: number; mes: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/servicios-basicos/presupuesto/${anio}`);
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuesto = (servicio: Servicio): Presupuesto => {
    if (servicio.presupuestos && servicio.presupuestos.length > 0) {
      return servicio.presupuestos[0];
    }
    return {
      servicioId: servicio.id,
      anio,
      enero: 0,
      febrero: 0,
      marzo: 0,
      abril: 0,
      mayo: 0,
      junio: 0,
      julio: 0,
      agosto: 0,
      septiembre: 0,
      octubre: 0,
      noviembre: 0,
      diciembre: 0
    };
  };

  const formatearMonto = (monto: number): string => {
    if (monto === 0) return '';
    return Math.round(monto).toLocaleString('es-CL');
  };

  const formatearMontoTotal = (monto: number): string => {
    if (monto === 0) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalServicio = (presupuesto: Presupuesto): number => {
    return MESES.reduce((sum, mes) => sum + (presupuesto[mes as keyof Presupuesto] as number || 0), 0);
  };

  const calcularTotalMes = (mes: string): number => {
    return servicios.reduce((sum, servicio) => {
      const presupuesto = obtenerPresupuesto(servicio);
      return sum + (presupuesto[mes as keyof Presupuesto] as number || 0);
    }, 0);
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, mes) => sum + calcularTotalMes(mes), 0);
  };

  const guardarMonto = async (servicioId: number, mes: string, valor: string) => {
    try {
      setGuardando({ servicioId, mes });
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/servicios-basicos/presupuesto/${servicioId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el servicio específico en el estado local
      setServicios(prevServicios => 
        prevServicios.map(servicio => {
          if (servicio.id === servicioId) {
            const presupuestoActualizado = servicio.presupuestos && servicio.presupuestos.length > 0
              ? { ...servicio.presupuestos[0], [mes]: montoFloat }
              : { servicioId, anio, [mes]: montoFloat };
            
            return {
              ...servicio,
              presupuestos: [presupuestoActualizado]
            };
          }
          return servicio;
        })
      );
    } catch (error) {
      console.error('Error al guardar monto:', error);
      alert('Error al guardar el monto');
    } finally {
      setGuardando(null);
      setEditando(null);
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
        Cargando...
      </div>
    );
  }

  if (servicios.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes servicios básicos configurados.</p>
        <Button
          onClick={onOpenCatalogo}
          appearance="primary"
        >
          Agregar primer servicio
        </Button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-container">
        <table className="monthly-table">
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 1 }}>
                Servicio
              </th>
              {MESES_DISPLAY.map((mesDisplay, idx) => (
                <th key={idx} style={{ textAlign: 'right' }}>
                  {mesDisplay}
                </th>
              ))}
              <th style={{ textAlign: 'right', background: 'var(--gray-100)' }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((servicio) => {
              const presupuesto = obtenerPresupuesto(servicio);
              const total = calcularTotalServicio(presupuesto);

              return (
                <tr key={servicio.id} style={{ cursor: 'default' }}>
                  <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: '500' }}>
                    {servicio.nombre}
                  </td>
                  {MESES.map((mes, idx) => {
                    const valor = presupuesto[mes as keyof Presupuesto] as number;
                    const isEditando = editando?.servicioId === servicio.id && editando?.mes === mes;
                    const isGuardando = guardando?.servicioId === servicio.id && guardando?.mes === mes;

                    return (
                      <td key={idx} style={{ textAlign: 'right' }}>
                        {isEditando ? (
                          <Input
                            autoFocus
                            defaultValue={valor || ''}
                            style={{ width: '100%', textAlign: 'right' }}
                            size="sm"
                            onBlur={(e) => guardarMonto(servicio.id, mes, (e.target as HTMLInputElement).value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                guardarMonto(servicio.id, mes, (e.target as HTMLInputElement).value);
                              }
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              color: valor === 0 ? '#9ca3af' : 'inherit',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            onClick={() => setEditando({ servicioId: servicio.id, mes })}
                          >
                            {isGuardando ? (
                              <span style={{ color: 'var(--primary)' }}>...</span>
                            ) : (
                              formatearMonto(valor) || '0'
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', fontWeight: '600', background: 'var(--gray-50)' }}>
                    {formatearMontoTotal(total)}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: '#e0f2fe', fontWeight: '600' }}>
              <td style={{ position: 'sticky', left: 0, background: '#e0f2fe' }}>
                TOTAL
              </td>
              {MESES.map((mes, idx) => {
                const total = calcularTotalMes(mes);
                return (
                  <td key={idx} style={{ textAlign: 'right' }}>
                    {formatearMontoTotal(total)}
                  </td>
                );
              })}
              <td style={{ textAlign: 'right', fontSize: '1.125rem', background: '#bae6fd', fontWeight: '700' }}>
                ${Math.round(calcularTotalAnual()).toLocaleString('es-CL')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
