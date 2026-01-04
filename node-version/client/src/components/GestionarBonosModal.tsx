import React, { useState, useEffect } from 'react';

interface Bono {
  id?: number;
  nombre: string;
  anio: number;
  mes: number;
  monto: number;
  descripcion?: string;
  repartos: RepartoBono[];
}

interface RepartoBono {
  id?: number;
  destino: string;
  monto: number;
  porcentaje?: number;
  mesesDistribucion?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onBonosUpdated: () => void;
  anio: number;
}

const DESTINOS = [
  { value: 'ahorro', label: 'Ahorro' },
  { value: 'deuda', label: 'Deuda' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'apoyo_mensual', label: 'Apoyo Mensual Futuro' },
  { value: 'otros', label: 'Otros' }
];

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
];

export default function GestionarBonosModal({ isOpen, onClose, onBonosUpdated, anio }: Props) {
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [bonoEditando, setBonoEditando] = useState<Bono | null>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [mes, setMes] = useState<number>(1);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [repartos, setRepartos] = useState<RepartoBono[]>([]);
  const [tipoReparto, setTipoReparto] = useState<'porcentaje' | 'monto'>('porcentaje');

  useEffect(() => {
    if (isOpen) {
      cargarBonos();
    }
  }, [isOpen, anio]);

  const cargarBonos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/ingresos/bonos/${anio}`);
      const data = await response.json();
      setBonos(data);
    } catch (error) {
      console.error('Error al cargar bonos:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarNuevoBono = () => {
    setBonoEditando(null);
    setNombre('');
    setMes(1);
    setMonto('');
    setDescripcion('');
    setRepartos([]);
    setTipoReparto('porcentaje');
    setMostrarFormulario(true);
  };

  const editarBono = (bono: Bono) => {
    setBonoEditando(bono);
    setNombre(bono.nombre);
    setMes(bono.mes);
    setMonto(bono.monto.toString());
    setDescripcion(bono.descripcion || '');
    setRepartos(bono.repartos);
    setTipoReparto(bono.repartos[0]?.porcentaje ? 'porcentaje' : 'monto');
    setMostrarFormulario(true);
  };

  const agregarReparto = () => {
    setRepartos([...repartos, {
      destino: 'ahorro',
      monto: 0,
      porcentaje: tipoReparto === 'porcentaje' ? 0 : undefined,
      mesesDistribucion: undefined
    }]);
  };

  const actualizarReparto = (index: number, campo: string, valor: any) => {
    const nuevosRepartos = [...repartos];
    (nuevosRepartos[index] as any)[campo] = valor;
    setRepartos(nuevosRepartos);
  };

  const eliminarReparto = (index: number) => {
    setRepartos(repartos.filter((_, i) => i !== index));
  };

  const calcularMontosDesdeReparto = (): RepartoBono[] => {
    const montoTotal = parseFloat(monto) || 0;
    
    return repartos.map(reparto => {
      if (tipoReparto === 'porcentaje' && reparto.porcentaje !== undefined) {
        return {
          ...reparto,
          monto: (montoTotal * reparto.porcentaje) / 100
        };
      }
      return reparto;
    });
  };

  const validarReparto = (): string | null => {
    if (repartos.length === 0) {
      return 'Debes agregar al menos un destino de reparto';
    }

    const montoTotal = parseFloat(monto) || 0;

    if (tipoReparto === 'porcentaje') {
      const totalPorcentaje = repartos.reduce((sum, r) => sum + (r.porcentaje || 0), 0);
      if (Math.abs(totalPorcentaje - 100) > 0.01) {
        return `El total debe ser 100% (actual: ${totalPorcentaje.toFixed(1)}%)`;
      }
    } else {
      const totalMonto = repartos.reduce((sum, r) => sum + (r.monto || 0), 0);
      if (Math.abs(totalMonto - montoTotal) > 0.01) {
        return `El total debe ser $${montoTotal.toLocaleString('es-CL')} (actual: $${totalMonto.toLocaleString('es-CL')})`;
      }
    }

    // Validar apoyo mensual
    for (const reparto of repartos) {
      if (reparto.destino === 'apoyo_mensual' && (!reparto.mesesDistribucion || reparto.mesesDistribucion < 1)) {
        return 'Debes especificar cuántos meses para "Apoyo Mensual"';
      }
    }

    return null;
  };

  const guardarBono = async () => {
    const error = validarReparto();
    if (error) {
      alert(error);
      return;
    }

    if (!nombre.trim()) {
      alert('Debes ingresar un nombre para el bono');
      return;
    }

    try {
      const repartosFinales = calcularMontosDesdeReparto();
      
      const body = {
        nombre: nombre.trim(),
        anio,
        mes,
        monto: parseFloat(monto),
        descripcion: descripcion.trim() || undefined,
        repartos: repartosFinales
      };

      const url = bonoEditando
        ? `http://localhost:3000/api/ingresos/bonos/${bonoEditando.id}`
        : 'http://localhost:3000/api/ingresos/bonos';

      const response = await fetch(url, {
        method: bonoEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al guardar bono');
        return;
      }

      setMostrarFormulario(false);
      await cargarBonos();
      onBonosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar bono');
    }
  };

  const eliminarBono = async (id: number, nombreBono: string) => {
    if (!confirm(`¿Eliminar bono "${nombreBono}"?`)) return;

    try {
      const response = await fetch(`http://localhost:3000/api/ingresos/bonos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar');

      await cargarBonos();
      onBonosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar bono');
    }
  };

  if (!isOpen) return null;

  const totalReparto = tipoReparto === 'porcentaje'
    ? repartos.reduce((sum, r) => sum + (r.porcentaje || 0), 0)
    : repartos.reduce((sum, r) => sum + (r.monto || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0 }}>Gestionar Bonos - {anio}</h2>
          <button
            onClick={() => {
              setMostrarFormulario(false);
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--gray-400)',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {!mostrarFormulario ? (
            <>
              {/* Lista de bonos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <button onClick={iniciarNuevoBono} className="btn btn-primary">
                  ➕ Agregar Bono
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Cargando...
                </div>
              ) : bonos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No hay bonos para este año. Agrega uno para comenzar.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bonos.map(bono => (
                    <div
                      key={bono.id}
                      style={{
                        padding: '1rem',
                        background: '#fef9e7',
                        borderRadius: '6px',
                        border: '1px solid #f59e0b'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '1.125rem', color: '#92400e' }}>
                            {bono.nombre}
                          </strong>
                          <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: '0.25rem' }}>
                            {MESES.find(m => m.value === bono.mes)?.label} - ${Math.round(bono.monto).toLocaleString('es-CL')}
                          </div>
                          {bono.descripcion && (
                            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                              {bono.descripcion}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => editarBono(bono)} className="btn btn-sm">
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => eliminarBono(bono.id!, bono.nombre)}
                            className="btn btn-sm"
                            style={{ color: '#dc2626' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Repartos */}
                      {bono.repartos.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #fbbf24' }}>
                          <div style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.5rem' }}>
                            <strong>Reparto:</strong>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {bono.repartos.map((reparto, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  background: 'white',
                                  borderRadius: '4px',
                                  color: '#78350f'
                                }}
                              >
                                {DESTINOS.find(d => d.value === reparto.destino)?.label}: ${Math.round(reparto.monto).toLocaleString('es-CL')}
                                {reparto.mesesDistribucion && ` (${reparto.mesesDistribucion} meses)`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Formulario de bono */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>
                  {bonoEditando ? 'Editar Bono' : 'Nuevo Bono'}
                </h3>

                {/* Datos básicos */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Nombre del bono *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Aguinaldo, Bono Septiembre"
                      className="input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Mes *
                    </label>
                    <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className="select">
                      {MESES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Monto total *
                    </label>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="0"
                      className="input"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Tipo de reparto
                    </label>
                    <select
                      value={tipoReparto}
                      onChange={(e) => setTipoReparto(e.target.value as 'porcentaje' | 'monto')}
                      className="select"
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="monto">Monto ($)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Notas adicionales..."
                    className="input"
                  />
                </div>

                {/* Repartos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      Destinos del reparto *
                    </label>
                    <button onClick={agregarReparto} className="btn btn-sm">
                      ➕ Agregar destino
                    </button>
                  </div>

                  {repartos.map((reparto, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: reparto.destino === 'apoyo_mensual' ? '2fr 1fr 1fr 40px' : '2fr 1fr 40px',
                        gap: '0.5rem',
                        marginBottom: '0.5rem',
                        padding: '0.5rem',
                        background: 'var(--gray-50)',
                        borderRadius: '4px'
                      }}
                    >
                      <select
                        value={reparto.destino}
                        onChange={(e) => actualizarReparto(idx, 'destino', e.target.value)}
                        className="select"
                        style={{ fontSize: '0.875rem' }}
                      >
                        {DESTINOS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={tipoReparto === 'porcentaje' ? (reparto.porcentaje || 0) : (reparto.monto || 0)}
                        onChange={(e) => actualizarReparto(idx, tipoReparto === 'porcentaje' ? 'porcentaje' : 'monto', parseFloat(e.target.value) || 0)}
                        placeholder={tipoReparto === 'porcentaje' ? '%' : '$'}
                        className="input"
                        style={{ fontSize: '0.875rem' }}
                      />

                      {reparto.destino === 'apoyo_mensual' && (
                        <input
                          type="number"
                          value={reparto.mesesDistribucion || ''}
                          onChange={(e) => actualizarReparto(idx, 'mesesDistribucion', parseInt(e.target.value) || undefined)}
                          placeholder="Meses"
                          className="input"
                          style={{ fontSize: '0.875rem' }}
                        />
                      )}

                      <button
                        onClick={() => eliminarReparto(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '1.25rem'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {repartos.length > 0 && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: totalReparto === (tipoReparto === 'porcentaje' ? 100 : parseFloat(monto)) ? '#d1fae5' : '#fee2e2',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}>
                      Total: {tipoReparto === 'porcentaje' ? `${totalReparto.toFixed(1)}%` : `$${totalReparto.toLocaleString('es-CL')}`}
                      {tipoReparto === 'porcentaje' && totalReparto !== 100 && ' (debe ser 100%)'}
                      {tipoReparto === 'monto' && totalReparto !== parseFloat(monto) && ` (debe ser $${parseFloat(monto).toLocaleString('es-CL')})`}
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button onClick={() => setMostrarFormulario(false)} className="btn">
                    Cancelar
                  </button>
                  <button onClick={guardarBono} className="btn btn-primary">
                    {bonoEditando ? 'Actualizar' : 'Guardar'} Bono
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!mostrarFormulario && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--gray-200)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button onClick={onClose} className="btn">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
