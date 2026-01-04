import React, { useState, useEffect } from 'react';

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

  if (!isOpen) return null;

  const serviciosActivos = servicios.filter(s => s.activo);
  const serviciosInactivos = servicios.filter(s => !s.activo);

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
        maxWidth: '800px',
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
          <h2 style={{ margin: 0 }}>Gestionar Servicios Básicos</h2>
          <button
            onClick={onClose}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {/* Agregar nuevo servicio */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Nombre del nuevo servicio"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') agregarServicio();
                }}
                className="input"
                style={{ flex: 1 }}
              />
              <button
                onClick={agregarServicio}
                className="btn btn-primary"
              >
                + Agregar
              </button>
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
                        <input
                          type="text"
                          value={editandoNombre}
                          onChange={(e) => setEditandoNombre(e.target.value)}
                          onBlur={() => renombrarServicio(servicio.id, editandoNombre)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') renombrarServicio(servicio.id, editandoNombre);
                            if (e.key === 'Escape') {
                              setEditandoId(null);
                              setEditandoNombre('');
                            }
                          }}
                          autoFocus
                          className="input"
                          style={{ padding: '0.25rem 0.5rem' }}
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
                      <button
                        onClick={() => {
                          setEditandoId(servicio.id);
                          setEditandoNombre(servicio.nombre);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="Renombrar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleActivo(servicio.id, servicio.nombre, servicio.activo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="Desactivar"
                      >
                        🔻
                      </button>
                      {!servicio.esBase && (!servicio.presupuestos || servicio.presupuestos.length === 0) && (
                        <button
                          onClick={() => eliminarServicio(servicio.id, servicio.nombre)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
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
              <button
                onClick={() => setMostrarInactivos(!mostrarInactivos)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'var(--gray-100)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
              >
                <span style={{ fontWeight: '600', color: 'var(--gray-700)', fontSize: '0.875rem' }}>
                  SERVICIOS INACTIVOS ({serviciosInactivos.length})
                </span>
                <span style={{ color: '#666' }}>{mostrarInactivos ? '▼' : '▶'}</span>
              </button>
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
                      <button
                        onClick={() => toggleActivo(servicio.id, servicio.nombre, servicio.activo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                        title="Reactivar"
                      >
                        🔼
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            className="btn"
            style={{ background: 'var(--gray-600)', color: 'white' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
