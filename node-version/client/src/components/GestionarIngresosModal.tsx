import React, { useState, useEffect } from 'react';

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
      const response = await fetch('http://localhost:3000/api/ingresos/catalogo');
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
      const response = await fetch('http://localhost:3000/api/ingresos/catalogo', {
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
      const response = await fetch(`http://localhost:3000/api/ingresos/catalogo/${id}`, {
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
      const response = await fetch(`http://localhost:3000/api/ingresos/catalogo/${id}/toggle`, {
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
      const response = await fetch(`http://localhost:3000/api/ingresos/catalogo/${id}`, {
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

  if (!isOpen) return null;

  const ingresosActivos = ingresos.filter(i => i.activo);
  const ingresosInactivos = ingresos.filter(i => !i.activo);

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
          <h2 style={{ margin: 0 }}>Gestionar Ingresos Base</h2>
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
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* Agregar nuevo ingreso */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#374151' }}>
              ➕ Agregar Nuevo Ingreso
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ej: Sueldo líquido, Bonos anuales..."
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarIngreso()}
                className="input"
                style={{ flex: 1 }}
              />
              <button
                onClick={agregarIngreso}
                className="btn btn-primary"
                disabled={!nuevoNombre.trim()}
              >
                Agregar
              </button>
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
                          <input
                            type="text"
                            value={editandoNombre}
                            onChange={(e) => setEditandoNombre(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') renombrarIngreso(ingreso.id, editandoNombre);
                              if (e.key === 'Escape') {
                                setEditandoId(null);
                                setEditandoNombre('');
                              }
                            }}
                            className="input"
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
                              <button
                                onClick={() => renombrarIngreso(ingreso.id, editandoNombre)}
                                className="btn btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setEditandoId(null);
                                  setEditandoNombre('');
                                }}
                                className="btn btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditandoId(ingreso.id);
                                  setEditandoNombre(ingreso.nombre);
                                }}
                                className="btn btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                ✏️ Renombrar
                              </button>
                              <button
                                onClick={() => toggleActivo(ingreso.id, ingreso.nombre, true)}
                                className="btn btn-sm"
                                style={{ fontSize: '0.75rem' }}
                              >
                                👁️ Ocultar
                              </button>
                              {(!ingreso.presupuestos || ingreso.presupuestos.length === 0) && (
                                <button
                                  onClick={() => eliminarIngreso(ingreso.id, ingreso.nombre)}
                                  className="btn btn-sm"
                                  style={{ fontSize: '0.75rem', color: '#dc2626' }}
                                >
                                  🗑️
                                </button>
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
                  <button
                    onClick={() => setMostrarInactivos(!mostrarInactivos)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                      padding: 0
                    }}
                  >
                    {mostrarInactivos ? '▼' : '▶'} Ingresos Ocultos ({ingresosInactivos.length})
                  </button>

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
                            <button
                              onClick={() => toggleActivo(ingreso.id, ingreso.nombre, false)}
                              className="btn btn-sm"
                              style={{ fontSize: '0.75rem' }}
                            >
                              ♻️ Reactivar
                            </button>
                            {(!ingreso.presupuestos || ingreso.presupuestos.length === 0) && (
                              <button
                                onClick={() => eliminarIngreso(ingreso.id, ingreso.nombre)}
                                className="btn btn-sm"
                                style={{ fontSize: '0.75rem', color: '#dc2626' }}
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
              )}
            </>
          )}
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );
}
