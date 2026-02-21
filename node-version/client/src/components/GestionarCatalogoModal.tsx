import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from 'rsuite';

interface Servicio {
  id: number;
  nombre: string;
  activo: boolean;
  esBase: boolean;
  orden: number;
  presupuestos?: any[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onServiciosUpdated: () => void;
}

export default function GestionarCatalogoModal({ isOpen, onClose, onServiciosUpdated }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoNombre, setEditandoNombre] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  useEffect(() => {
    if (isOpen) {
      cargarServicios();
    }
  }, [isOpen]);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/servicios-basicos/catalogo');
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const agregarServicio = async () => {
    if (!nuevoNombre.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/servicios-basicos/catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al agregar servicio');
        return;
      }

      setNuevoNombre('');
      await cargarServicios();
      onServiciosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al agregar servicio');
    }
  };

  const renombrarServicio = async (id: number, nuevoNombre: string) => {
    if (!nuevoNombre.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/servicios-basicos/catalogo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoNombre.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al renombrar servicio');
        return;
      }

      setEditandoId(null);
      setEditandoNombre('');
      await cargarServicios();
      onServiciosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al renombrar servicio');
    }
  };

  const toggleActivo = async (id: number, nombreServicio: string, activo: boolean) => {
    const accion = activo ? 'desactivar' : 'reactivar';
    const mensaje = activo
      ? `¿Desactivar ${nombreServicio}? Se ocultará de la tabla de presupuesto pero conservará sus datos.`
      : `¿Reactivar ${nombreServicio}? Volverá a aparecer en la tabla de presupuesto.`;

    if (!confirm(mensaje)) return;

    try {
      const response = await fetch(`http://localhost:3000/api/servicios-basicos/catalogo/${id}/toggle`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Error al ' + accion);

      await cargarServicios();
      onServiciosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al ' + accion + ' servicio');
    }
  };

  const eliminarServicio = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar definitivamente "${nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/servicios-basicos/catalogo/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Error al eliminar servicio');
        return;
      }

      await cargarServicios();
      onServiciosUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar servicio');
    }
  };

  const serviciosActivos = servicios.filter(s => s.activo);
  const serviciosInactivos = servicios.filter(s => !s.activo);

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose}
      size="md"
      backdrop={true}
      keyboard={true}
    >
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Servicios Básicos</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: '400px', maxHeight: '70vh', overflow: 'auto' }}>
          {/* Agregar nuevo servicio */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Input
                placeholder="Nombre del nuevo servicio"
                value={nuevoNombre}
                onChange={(value) => setNuevoNombre(value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') agregarServicio();
                }}
                style={{ flex: 1 }}
              />
              <Button
                onClick={agregarServicio}
                appearance="primary"
              >
                + Agregar
              </Button>
            </div>
          </div>

          {/* Servicios activos */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '600', color: 'var(--gray-700)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
              SERVICIOS ACTIVOS
            </h3>
            {loading ? (
              <div style={{ color: '#666' }}>Cargando...</div>
            ) : serviciosActivos.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No hay servicios activos</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {serviciosActivos.map((servicio) => (
                  <div
                    key={servicio.id}
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
                      {editandoId === servicio.id ? (
                        <Input
                          value={editandoNombre}
                          onChange={(value) => setEditandoNombre(value)}
                          onBlur={() => renombrarServicio(servicio.id, editandoNombre)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renombrarServicio(servicio.id, editandoNombre);
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
                          <span style={{ fontWeight: '500' }}>{servicio.nombre}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                            {servicio.esBase ? '(Base)' : '(Personalizado)'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        onClick={() => {
                          setEditandoId(servicio.id);
                          setEditandoNombre(servicio.nombre);
                        }}
                        size="xs"
                      >
                        ✏️
                      </Button>
                      <Button
                        onClick={() => toggleActivo(servicio.id, servicio.nombre, servicio.activo)}
                        size="xs"
                      >
                        🔻
                      </Button>
                      {!servicio.esBase && (!servicio.presupuestos || servicio.presupuestos.length === 0) && (
                        <Button
                          onClick={() => eliminarServicio(servicio.id, servicio.nombre)}
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

          {/* Servicios inactivos */}
          {serviciosInactivos.length > 0 && (
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
                  SERVICIOS INACTIVOS ({serviciosInactivos.length})
                </span>
                <span style={{ color: '#666' }}>{mostrarInactivos ? '▼' : '▶'}</span>
              </Button>
              {mostrarInactivos && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {serviciosInactivos.map((servicio) => (
                    <div
                      key={servicio.id}
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
                        <span style={{ fontWeight: '500', color: 'var(--gray-700)' }}>{servicio.nombre}</span>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                          {servicio.esBase ? '(Base)' : '(Personalizado)'}
                        </span>
                      </div>
                      <Button
                        onClick={() => toggleActivo(servicio.id, servicio.nombre, servicio.activo)}
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
        </div>

        {/* Footer */}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
