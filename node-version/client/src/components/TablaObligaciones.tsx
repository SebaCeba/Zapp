import React, { useEffect, useState } from 'react';

interface Props {
  refreshKey: number;
  onDelete: () => void;
}

interface Obligacion {
  id: number;
  nombre: string;
  tipo: string;
  moneda: string;
  montoCuota: number;
  cuotasTotales: number;
  mesInicio: number;
  anioInicio: number;
}

export default function TablaObligaciones({ refreshKey, onDelete }: Props) {
  const [obligaciones, setObligaciones] = useState<Obligacion[]>([]);

  useEffect(() => {
    fetch('/api/obligaciones')
      .then(res => res.json())
      .then(data => setObligaciones(data))
      .catch(() => {});
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta obligación?')) return;
    try {
      await fetch(`/api/obligaciones/${id}`, { method: 'DELETE' });
      onDelete();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const tipoEmoji: Record<string, string> = {
    consumo: '💳',
    seguro: '🛡️'
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>📋 Obligaciones Registradas</h3>
      {obligaciones.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
          No hay obligaciones registradas. Agrega una nueva para comenzar.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nombre</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Tipo</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Moneda</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Cuota</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Cuotas</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Inicio</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {obligaciones.map((obl) => (
                <tr key={obl.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.75rem' }}>{obl.nombre}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {tipoEmoji[obl.tipo]} {obl.tipo}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{obl.moneda}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#2d7a2d' }}>
                    {obl.montoCuota.toLocaleString('es-CL')} {obl.moneda}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>{obl.cuotasTotales}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {obl.mesInicio.toString().padStart(2, '0')}/{obl.anioInicio}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(obl.id)}
                      style={{ 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
