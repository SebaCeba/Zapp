import { useState, useEffect } from 'react';
import { Modal, Button, Input, InputNumber, SelectPicker, IconButton, Panel } from 'rsuite';
import CloseIcon from '@rsuite/icons/Close';

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
      const response = await fetch(`/api/ingresos/bonos/${anio}`);
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
        ? `/api/ingresos/bonos/${bonoEditando.id}`
        : '/api/ingresos/bonos';

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
      const response = await fetch(`/api/ingresos/bonos/${id}`, {
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

  const totalReparto = tipoReparto === 'porcentaje'
    ? repartos.reduce((sum, r) => sum + (r.porcentaje || 0), 0)
    : repartos.reduce((sum, r) => sum + (r.monto || 0), 0);

  return (
    <Modal 
      open={isOpen} 
      onClose={() => {
        setMostrarFormulario(false);
        onClose();
      }}
      size="lg"
      backdrop={true}
      keyboard={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Bonos - {anio}</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: '400px', maxHeight: '70vh', overflow: 'auto' }}>
          {!mostrarFormulario ? (
            <>
              {/* Lista de bonos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <Button onClick={iniciarNuevoBono} appearance="primary">
                  ➕ Agregar Bono
                </Button>
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
                          <Button onClick={() => editarBono(bono)} size="xs">
                            ✏️ Editar
                          </Button>
                          <Button
                            onClick={() => eliminarBono(bono.id!, bono.nombre)}
                            size="xs"
                            color="red"
                            appearance="primary"
                          >
                            🗑️
                          </Button>
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
                    <Input
                      value={nombre}
                      onChange={(value) => setNombre(value)}
                      placeholder="Ej: Aguinaldo, Bono Septiembre"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Mes *
                    </label>
                    <SelectPicker
                      data={MESES}
                      value={mes}
                      onChange={(value) => setMes(value as number)}
                      searchable={false}
                      cleanable={false}
                      block
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Monto total *
                    </label>
                    <InputNumber
                      value={parseFloat(monto) || 0}
                      onChange={(value) => setMonto(value?.toString() || '')}
                      placeholder="0"
                      prefix="$"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Tipo de reparto
                    </label>
                    <SelectPicker
                      data={[
                        { label: 'Porcentaje (%)', value: 'porcentaje' },
                        { label: 'Monto ($)', value: 'monto' }
                      ]}
                      value={tipoReparto}
                      onChange={(value) => setTipoReparto(value as 'porcentaje' | 'monto')}
                      searchable={false}
                      cleanable={false}
                      block
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>
                    Descripción (opcional)
                  </label>
                  <Input
                    value={descripcion}
                    onChange={(value) => setDescripcion(value)}
                    placeholder="Notas adicionales..."
                  />
                </div>

                {/* Repartos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                      Destinos del reparto *
                    </label>
                    <Button onClick={agregarReparto} size="sm" appearance="ghost">
                      ➕ Agregar destino
                    </Button>
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
                      <SelectPicker
                        data={DESTINOS}
                        value={reparto.destino}
                        onChange={(value) => actualizarReparto(idx, 'destino', value as string)}
                        searchable={false}
                        cleanable={false}
                        block
                        size="sm"
                      />

                      <InputNumber
                        value={tipoReparto === 'porcentaje' ? (reparto.porcentaje || 0) : (reparto.monto || 0)}
                        onChange={(value) => actualizarReparto(idx, tipoReparto === 'porcentaje' ? 'porcentaje' : 'monto', value || 0)}
                        placeholder={tipoReparto === 'porcentaje' ? '%' : '$'}
                        size="sm"
                        postfix={tipoReparto === 'porcentaje' ? '%' : undefined}
                        prefix={tipoReparto === 'monto' ? '$' : undefined}
                      />

                      {reparto.destino === 'apoyo_mensual' && (
                        <InputNumber
                          value={reparto.mesesDistribucion || 0}
                          onChange={(value) => actualizarReparto(idx, 'mesesDistribucion', value || undefined)}
                          placeholder="Meses"
                          size="sm"
                        />
                      )}

                      <IconButton
                        icon={<CloseIcon />}
                        circle
                        size="xs"
                        color="red"
                        appearance="primary"
                        onClick={() => eliminarReparto(idx)}
                      />
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
                  <Button onClick={() => setMostrarFormulario(false)} appearance="subtle">
                    Cancelar
                  </Button>
                  <Button onClick={guardarBono} appearance="primary">
                    {bonoEditando ? 'Actualizar' : 'Guardar'} Bono
                  </Button>
                </div>
              </div>
            </>
          )}
      </Modal.Body>

      {!mostrarFormulario && (
        <Modal.Footer>
          <Button onClick={onClose} appearance="subtle">
            Cerrar
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
