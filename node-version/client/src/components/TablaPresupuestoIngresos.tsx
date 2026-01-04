import React, { useState, useEffect } from 'react';

interface IngresoBase {
  id: number;
  nombre: string;
  activo: boolean;
  esRecurrente: boolean;
  orden: number;
  presupuestos: Presupuesto[];
}

interface Presupuesto {
  id?: number;
  ingresoId: number;
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

interface Bono {
  id: number;
  nombre: string;
  anio: number;
  mes: number;
  monto: number;
  descripcion?: string;
  repartos: RepartoBono[];
}

interface RepartoBono {
  id: number;
  bonoId: number;
  destino: string;
  monto: number;
  porcentaje?: number;
  mesesDistribucion?: number;
}

interface Props {
  anio: number;
  onOpenCatalogo: () => void;
  onOpenBonos: () => void;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_DISPLAY = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function TablaPresupuestoIngresos({ anio, onOpenCatalogo, onOpenBonos }: Props) {
  const [ingresos, setIngresos] = useState<IngresoBase[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<{ ingresoId: number; mes: string } | null>(null);
  const [guardando, setGuardando] = useState<{ ingresoId: number; mes: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ingresosRes, bonosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/ingresos/presupuesto/${anio}`),
        fetch(`http://localhost:3000/api/ingresos/bonos/${anio}`)
      ]);
      const ingresosData = await ingresosRes.json();
      const bonosData = await bonosRes.json();
      setIngresos(ingresosData);
      setBonos(bonosData);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuesto = (ingreso: IngresoBase): Presupuesto => {
    if (ingreso.presupuestos && ingreso.presupuestos.length > 0) {
      return ingreso.presupuestos[0];
    }
    return {
      ingresoId: ingreso.id,
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
    
    // Formato en millones si es > 1,000,000
    if (Math.abs(monto) >= 1000000) {
      const millones = monto / 1000000;
      return `$${millones.toFixed(1).replace('.', ',')} MM`;
    }
    
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalIngreso = (presupuesto: Presupuesto): number => {
    return MESES.reduce((sum, mes) => sum + (presupuesto[mes as keyof Presupuesto] as number || 0), 0);
  };

  const calcularBonosMes = (mesIndex: number): number => {
    const mesNum = mesIndex + 1;
    let total = 0;

    bonos.forEach(bono => {
      // Bono en el mes específico
      if (bono.mes === mesNum) {
        total += bono.monto;
      }

      // Apoyo mensual distribuido
      bono.repartos.forEach(reparto => {
        if (reparto.destino === 'apoyo_mensual' && reparto.mesesDistribucion) {
          const mesInicio = bono.mes;
          const distribucion = reparto.monto / reparto.mesesDistribucion;
          
          for (let i = 0; i < reparto.mesesDistribucion; i++) {
            const mesDistribucion = ((mesInicio + i - 1) % 12) + 1;
            if (mesDistribucion === mesNum) {
              total += distribucion;
            }
          }
        }
      });
    });

    return total;
  };

  const calcularTotalMes = (mesIndex: number): number => {
    const mes = MESES[mesIndex];
    let total = 0;
    
    // Sumar ingresos base
    ingresos.forEach(ingreso => {
      const presupuesto = obtenerPresupuesto(ingreso);
      total += presupuesto[mes as keyof Presupuesto] as number || 0;
    });

    // Sumar bonos
    total += calcularBonosMes(mesIndex);

    return total;
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, _, idx) => sum + calcularTotalMes(idx), 0);
  };

  const guardarMonto = async (ingresoId: number, mes: string, valor: string) => {
    try {
      setGuardando({ ingresoId, mes });
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/ingresos/presupuesto/${ingresoId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el ingreso específico en el estado local
      setIngresos(prevIngresos => 
        prevIngresos.map(ingreso => {
          if (ingreso.id === ingresoId) {
            const presupuestoBase = ingreso.presupuestos && ingreso.presupuestos.length > 0
              ? ingreso.presupuestos[0]
              : {
                  ingresoId,
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
            
            const presupuestoActualizado = { ...presupuestoBase, [mes]: montoFloat };
            
            return {
              ...ingreso,
              presupuestos: [presupuestoActualizado]
            };
          }
          return ingreso;
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

  if (ingresos.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes ingresos configurados.</p>
        <button
          onClick={onOpenCatalogo}
          className="btn btn-primary"
        >
          Agregar primer ingreso
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Resumen de bonos */}
      {bonos.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#fef3c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ color: '#92400e' }}>💰 Bonos del año {anio}</strong>
            <button onClick={onOpenBonos} className="btn btn-sm" style={{ fontSize: '0.875rem' }}>
              Gestionar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {bonos.map(bono => (
              <span key={bono.id} style={{ fontSize: '0.875rem', color: '#78350f' }}>
                {MESES_DISPLAY[bono.mes - 1]}: {bono.nombre} (${Math.round(bono.monto).toLocaleString('es-CL')})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="monthly-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 1 }}>
                  Ingreso
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
              {/* Ingresos base */}
              {ingresos.map((ingreso) => {
                const presupuesto = obtenerPresupuesto(ingreso);
                const total = calcularTotalIngreso(presupuesto);

                return (
                  <tr key={ingreso.id} style={{ cursor: 'default' }}>
                    <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: '500' }}>
                      {ingreso.nombre}
                    </td>
                    {MESES.map((mes, idx) => {
                      const valor = presupuesto[mes as keyof Presupuesto] as number;
                      const isEditando = editando?.ingresoId === ingreso.id && editando?.mes === mes;
                      const isGuardando = guardando?.ingresoId === ingreso.id && guardando?.mes === mes;

                      return (
                        <td key={idx} style={{ textAlign: 'right' }}>
                          {isEditando ? (
                            <input
                              type="text"
                              autoFocus
                              defaultValue={valor || ''}
                              className="input"
                              style={{ width: '100%', padding: '0.25rem 0.5rem', textAlign: 'right' }}
                              onBlur={(e) => guardarMonto(ingreso.id, mes, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  guardarMonto(ingreso.id, mes, (e.target as HTMLInputElement).value);
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
                              onClick={() => setEditando({ ingresoId: ingreso.id, mes })}
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

              {/* Fila de bonos (si hay) */}
              {bonos.length > 0 && (
                <tr style={{ background: '#fef9e7', fontWeight: '500' }}>
                  <td style={{ position: 'sticky', left: 0, background: '#fef9e7' }}>
                    Bonos + Apoyo Mensual
                  </td>
                  {MESES.map((_, idx) => {
                    const totalBonos = calcularBonosMes(idx);
                    return (
                      <td key={idx} style={{ textAlign: 'right', color: totalBonos > 0 ? '#92400e' : '#9ca3af' }}>
                        {totalBonos > 0 ? formatearMonto(totalBonos) : '0'}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', background: '#fef3c7', color: '#92400e' }}>
                    {formatearMontoTotal(bonos.reduce((sum, b) => sum + b.monto, 0))}
                  </td>
                </tr>
              )}

              {/* Total */}
              <tr style={{ background: '#d1fae5', fontWeight: '600' }}>
                <td style={{ position: 'sticky', left: 0, background: '#d1fae5' }}>
                  TOTAL INGRESOS
                </td>
                {MESES.map((_, idx) => {
                  const total = calcularTotalMes(idx);
                  return (
                    <td key={idx} style={{ textAlign: 'right' }}>
                      {formatearMontoTotal(total)}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'right', fontSize: '1.125rem', background: '#6ee7b7', fontWeight: '700' }}>
                  {formatearMontoTotal(calcularTotalAnual())}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
