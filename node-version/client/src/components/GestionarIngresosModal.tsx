import { useState, useEffect } from 'react';
import { Modal, Button, Input } from 'rsuite';

interface IngresoBase {
  id: number;
  nombre: string;
  activo: boolean;
  esRecurrente: boolean;
  orden: number;
  presupuestos?: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onIngresosUpdated: () => void;
}

export default function GestionarIngresosModal({ isOpen, onClose, onIngresosUpdated }: Props) {
  const [ingresos, setIngresos] = useState<IngresoBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarIngresos();
    }
  }, [isOpen]);

  const cargarIngresos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ingresos/catalogo');
      const data = await response.json();
      setIngresos(data);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarIngreso = async () => {
    if (!nuevoNombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    try {
      const response = await fetch('/api/ingresos/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim(), esRecurrente: true })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al agregar ingreso');
        return;
      }

      setNuevoNombre('');
      await cargarIngresos();
      onIngresosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar ingreso');
    }
  };

  const renombrarIngreso = async (id: number, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    try {
      const response = await fetch(`/api/ingresos/catalogo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al renombrar ingreso');
        return;
      }

      setEditandoId(null);
      setEditandoNombre('');
      await cargarIngresos();
      onIngresosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al renombrar ingreso');
    }
  };

  const toggleActivo = async (id: number, nombreIngreso: string, activo: boolean) => {
    const accion = activo ? 'desactivar' : 'reactivar';
    const mensaje = activo
      ? `¿Desactivar ${nombreIngreso}? Se ocultará de la tabla de presupuesto pero conservará sus datos.`
      : `¿Reactivar ${nombreIngreso}? Volverá a aparecer en la tabla de presupuesto.`;

    if (!confirm(mensaje)) return;

    try {
      const response = await fetch(`/api/ingresos/catalogo/${id}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Error al ' + accion);

      await cargarIngresos();
      onIngresosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al ' + accion + ' ingreso');
    }
  };

  const eliminarIngreso = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar definitivamente "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ingresos/catalogo/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al eliminar ingreso');
        return;
      }

      await cargarIngresos();
      onIngresosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar ingreso');
    }
  };

  const ingresosActivos = ingresos.filter(i => i.activo);
  const ingresosInactivos = ingresos.filter(i => !i.activo);

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose}
      size="md"
      backdrop={true}
      keyboard={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Ingresos Base</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: '400px', maxHeight: '70vh', overflow: 'auto' }}>
          {/* Agregar nuevo ingreso */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#374151' }}>
              ➕ Agregar Nuevo Ingreso
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                placeholder="Ej: Sueldo líquido, Bonos anuales..."
                value={nuevoNombre}
                onChange={(value) => setNuevoNombre(value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarIngreso()}
                style={{ flex: 1 }}
              />
              <Button
                onClick={agregarIngreso}
                appearance="primary"
                disabled={!nuevoNombre.trim()}
              >
                Agregar
              </Button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Cargando...
            </div>
          ) : (
            <>
              {/* Ingresos activos */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#16a34a' }}>
                  ✓ Ingresos Activos ({ingresosActivos.length})
                </h3>
                {ingresosActivos.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    No hay ingresos activos. Agrega uno arriba.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ingresosActivos.map(ingreso => (
                      <div
                        key={ingreso.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: 'var(--gray-50)',
                          borderRadius: '6px',
                          border: '1px solid var(--gray-200)'
                        }}
                      >
                        {editandoId === ingreso.id ? (
                          <Input
                            value={editandoNombre}
                            onChange={(value) => setEditandoNombre(value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renombrarIngreso(ingreso.id, editandoNombre);
                              if (e.key === 'Escape') {
                                setEditandoId(null);
                                setEditandoNombre('');
                              }
                            }}
                            autoFocus
                            style={{ flex: 1, marginRight: '0.5rem' }}
                          />
                        ) : (
                          <span style={{ fontWeight: '500', color: '#374151', flex: 1 }}>
                            {ingreso.nombre}
                          </span>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {editandoId === ingreso.id ? (
                            <>
                              <Button
                                onClick={() => renombrarIngreso(ingreso.id, editandoNombre)}
                                size="xs"
                                appearance="primary"
                              >
                                Guardar
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditandoId(null);
                                  setEditandoNombre('');
                                }}
                                size="xs"
                                appearance="subtle"
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setEditandoId(ingreso.id);
                                  setEditandoNombre(ingreso.nombre);
                                }}
                                size="xs"
                              >
                                ✏️ Renombrar
                              </Button>
                              <Button
                                onClick={() => toggleActivo(ingreso.id, ingreso.nombre, true)}
                                size="xs"
                              >
                                👁️ Ocultar
                              </Button>
                              {(!ingreso.presupuestos || ingreso.presupuestos.length === 0) && (
                                <Button
                                  onClick={() => eliminarIngreso(ingreso.id, ingreso.nombre)}
                                  size="xs"
                                  color="red"
                                  appearance="primary"
                                >
                                  🗑️
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingresos inactivos (opcional) */}
              {ingresosInactivos.length > 0 && (
                <div>
                  <Button
                    onClick={() => setMostrarInactivos(!mostrarInactivos)}
                    appearance="link"
                    style={{
                      color: '#9ca3af',
                      marginBottom: '1rem',
                      padding: 0
                    }}
                  >
                    {mostrarInactivos ? '▼' : '▶'} Ingresos Ocultos ({ingresosInactivos.length})
                  </Button>

                  {mostrarInactivos && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {ingresosInactivos.map(ingreso => (
                        <div
                          key={ingreso.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem',
                            background: '#fafafa',
                            borderRadius: '6px',
                            border: '1px solid var(--gray-200)',
                            opacity: 0.6
                          }}
                        >
                          <span style={{ color: '#9ca3af' }}>{ingreso.nombre}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                              onClick={() => toggleActivo(ingreso.id, ingreso.nombre, false)}
                              size="xs"
                            >
                              ♻️ Reactivar
                            </Button>
                            {(!ingreso.presupuestos || ingreso.presupuestos.length === 0) && (
                              <Button
                                onClick={() => eliminarIngreso(ingreso.id, ingreso.nombre)}
                                size="xs"
                                color="red"
                                appearance="primary"
                              >
                                🗑️
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
