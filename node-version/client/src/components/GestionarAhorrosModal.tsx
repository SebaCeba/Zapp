import { useState, useEffect } from 'react';
import { Modal, Button, Input } from 'rsuite';

interface Ahorro {
  id: number;
  nombre: string;
  activo: boolean;
  orden: number;
  presupuestos?: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAhorrosUpdated: () => void;
}

export default function GestionarAhorrosModal({ isOpen, onClose, onAhorrosUpdated }: Props) {
  const [ahorros, setAhorros] = useState<Ahorro[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarAhorros();
    }
  }, [isOpen]);

  const cargarAhorros = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ahorros/catalogo');
      const data = await response.json();
      setAhorros(data);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarAhorro = async () => {
    if (!nuevoNombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    try {
      const response = await fetch('/api/ahorros/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al agregar ahorro');
        return;
      }

      setNuevoNombre('');
      await cargarAhorros();
      onAhorrosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar ahorro');
    }
  };

  const renombrarAhorro = async (id: number, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    try {
      const response = await fetch(`/api/ahorros/catalogo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al renombrar ahorro');
        return;
      }

      setEditandoId(null);
      setEditandoNombre('');
      await cargarAhorros();
      onAhorrosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al renombrar ahorro');
    }
  };

  const toggleActivo = async (id: number, nombre: string, estadoActual: boolean) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    if (!confirm(`¿Seguro que deseas ${accion} el ahorro "${nombre}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ahorros/catalogo/${id}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      await cargarAhorros();
      onAhorrosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar estado del ahorro');
    }
  };

  const eliminarAhorro = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el ahorro "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ahorros/catalogo/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al eliminar ahorro');
        return;
      }

      await cargarAhorros();
      onAhorrosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar ahorro');
    }
  };

  const ahorrosActivos = ahorros.filter(a => a.activo);
  const ahorrosInactivos = ahorros.filter(a => !a.activo);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
    >
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Ahorros</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: '400px', maxHeight: '70vh', overflow: 'auto' }}>
          {/* Agregar nuevo ahorro */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                placeholder="Nombre del nuevo ahorro (ej: Fondo de emergencia)"
                value={nuevoNombre}
                onChange={(value) => setNuevoNombre(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') agregarAhorro();
                }}
                style={{ flex: 1 }}
              />
              <Button
                onClick={agregarAhorro}
                appearance="primary"
              >
                + Agregar
              </Button>
            </div>
          </div>

          {/* Ahorros activos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              AHORROS ACTIVOS
            </h3>
            {loading ? (
              <div style={{ color: '#666' }}>Cargando...</div>
            ) : ahorrosActivos.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No hay ahorros activos</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ahorrosActivos.map((ahorro) => (
                  <div
                    key={ahorro.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--gray-50)',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      {editandoId === ahorro.id ? (
                        <Input
                          value={editandoNombre}
                          onChange={(value) => setEditandoNombre(value)}
                          onBlur={() => renombrarAhorro(ahorro.id, editandoNombre)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renombrarAhorro(ahorro.id, editandoNombre);
                            if (e.key === 'Escape') {
                              setEditandoId(null);
                              setEditandoNombre('');
                            }
                          }}
                          autoFocus
                          size="sm"
                        />
                      ) : (
                        <div>
                          <span style={{ fontWeight: '500' }}>{ahorro.nombre}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        onClick={() => {
                          setEditandoId(ahorro.id);
                          setEditandoNombre(ahorro.nombre);
                        }}
                        size="xs"
                      >
                        ✏️
                      </Button>
                      <Button
                        onClick={() => toggleActivo(ahorro.id, ahorro.nombre, ahorro.activo)}
                        size="xs"
                      >
                        🔻
                      </Button>
                      {(!ahorro.presupuestos || ahorro.presupuestos.length === 0) && (
                        <Button
                          onClick={() => eliminarAhorro(ahorro.id, ahorro.nombre)}
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

          {/* Ahorros inactivos */}
          {ahorrosInactivos.length > 0 && (
            <div>
              <Button
                onClick={() => setMostrarInactivos(!mostrarInactivos)}
                block
                appearance="subtle"
                style={{
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  AHORROS INACTIVOS ({ahorrosInactivos.length})
                </span>
                <span style={{ color: '#666' }}>{mostrarInactivos ? '▼' : '▶'}</span>
              </Button>
              {mostrarInactivos && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {ahorrosInactivos.map((ahorro) => (
                    <div
                      key={ahorro.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'var(--gray-50)',
                        borderRadius: '6px',
                        opacity: 0.6
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>{ahorro.nombre}</span>
                      </div>
                      <Button
                        onClick={() => toggleActivo(ahorro.id, ahorro.nombre, ahorro.activo)}
                        size="xs"
                      >
                        🔼
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
