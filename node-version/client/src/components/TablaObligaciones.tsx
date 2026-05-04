import { useEffect, useState } from 'react';
import { Card } from './primitives';
import { Button } from './primitives';

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
    fetch('http://localhost:3000/api/obligaciones')
      .then(res => res.json())
      .then(data => setObligaciones(data))
      .catch(() => {});
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta obligación?')) return;
    try {
      await fetch(`http://localhost:3000/api/obligaciones/${id}`, { method: 'DELETE' });
      onDelete();
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  return (
    <Card>
      <h3 className="text-base font-semibold text-navy-dark mb-4">Obligaciones Registradas</h3>
      {obligaciones.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500">
            No hay obligaciones registradas. Agrega una nueva para comenzar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-3 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nombre</th>
                <th className="text-center px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                <th className="text-center px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Moneda</th>
                <th className="text-right px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cuota</th>
                <th className="text-center px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Cuotas</th>
                <th className="text-center px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Inicio</th>
                <th className="text-center px-3 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {obligaciones.map((obl) => (
                <tr key={obl.id} className="border-b border-outline-variant/30 hover:bg-surface-container/20 transition-colors">
                  <td className="py-3 pr-4 font-medium text-navy-dark">{obl.nombre}</td>
                  <td className="text-center px-3 py-3 capitalize">{obl.tipo}</td>
                  <td className="text-center px-3 py-3 font-medium">{obl.moneda}</td>
                  <td className="text-right px-3 py-3 font-bold text-primary tabular-nums">
                    {obl.montoCuota.toLocaleString('es-CL')} {obl.moneda}
                  </td>
                  <td className="text-center px-3 py-3 tabular-nums">{obl.cuotasTotales}</td>
                  <td className="text-center px-3 py-3 tabular-nums">
                    {obl.mesInicio.toString().padStart(2, '0')}/{obl.anioInicio}
                  </td>
                  <td className="text-center px-3 py-3">
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(obl.id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
