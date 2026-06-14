import { useState, useEffect } from 'react';
import { Button } from './primitives';
import { EditableCell, LoadingSpinner, EmptyState } from './ui';

interface Ahorro {
  id: number;
  nombre: string;
  activo: boolean;
  orden: number;
  presupuestos: Presupuesto[];
}

interface Presupuesto {
  id?: number;
  ahorroId: number;
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

interface Props {
  anio: number;
  onOpenCatalogo: () => void;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_DISPLAY = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function TablaPresupuestoAhorros({ anio, onOpenCatalogo }: Props) {
  const [ahorros, setAhorros] = useState<Ahorro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ahorros/presupuesto/${anio}`);
      const data = await response.json();
      setAhorros(data);
    } catch (error) {
      console.error('Error al cargar ahorros:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuesto = (ahorro: Ahorro): Presupuesto => {
    if (ahorro.presupuestos && ahorro.presupuestos.length > 0) {
      return ahorro.presupuestos[0];
    }
    return {
      ahorroId: ahorro.id,
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
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalAhorro = (presupuesto: Presupuesto): number => {
    return MESES.reduce((sum, mes) => sum + (presupuesto[mes as keyof Presupuesto] as number || 0), 0);
  };

  const calcularTotalMes = (mes: string): number => {
    return ahorros.reduce((sum, ahorro) => {
      const presupuesto = obtenerPresupuesto(ahorro);
      return sum + (presupuesto[mes as keyof Presupuesto] as number || 0);
    }, 0);
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, mes) => sum + calcularTotalMes(mes), 0);
  };

  const guardarMonto = async (ahorroId: number, mes: string, valor: number) => {
    try {
      const response = await fetch(
        `/api/ahorros/presupuesto/${ahorroId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: valor })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el ahorro específico en el estado local
      setAhorros(prevAhorros => 
        prevAhorros.map(ahorro => {
          if (ahorro.id === ahorroId) {
            const basePresupuesto = ahorro.presupuestos && ahorro.presupuestos.length > 0
              ? ahorro.presupuestos[0]
              : {
                  ahorroId,
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
            
            const presupuestoActualizado: Presupuesto = { ...basePresupuesto, [mes]: valor };
            
            return {
              ...ahorro,
              presupuestos: [presupuestoActualizado]
            };
          }
          return ahorro;
        })
      );
    } catch (error) {
      console.error('Error al guardar monto:', error);
      alert('Error al guardar el monto');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (ahorros.length === 0) {
    return (
      <EmptyState
        icon="savings"
        title="No tienes ahorros configurados"
        action={
          <Button onClick={onOpenCatalogo} variant="primary">
            Agregar primer ahorro
          </Button>
        }
      />
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-surface-container z-10">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-on-surface-variant border-b border-outline-variant">
                Ahorro
              </th>
              {MESES_DISPLAY.map((mes) => (
                <th key={mes} className="px-3 py-2 text-center font-semibold text-on-surface-variant border-b border-outline-variant whitespace-nowrap">
                  {mes}
                </th>
              ))}
              <th className="px-4 py-2 text-right font-semibold text-on-surface-variant border-b border-outline-variant sticky right-0 bg-surface-container">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {ahorros.map((ahorro) => {
              const presupuesto = obtenerPresupuesto(ahorro);
              const total = calcularTotalAhorro(presupuesto);

              return (
                <tr key={ahorro.id} className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-on-surface">
                    {ahorro.nombre}
                  </td>
                  {MESES.map((mes) => (
                    <EditableCell
                      key={mes}
                      value={presupuesto[mes as keyof Presupuesto] as number}
                      onSave={(valor) => guardarMonto(ahorro.id, mes, valor)}
                    />
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-on-surface tabular-nums sticky right-0 bg-surface/80 backdrop-blur-sm">
                    {formatearMontoTotal(total)}
                  </td>
                </tr>
              );
            })}
            
            {/* Fila de total */}
            <tr className="bg-tertiary-container/20 font-bold border-t-2 border-tertiary">
              <td className="px-4 py-3 text-on-surface">
                TOTAL AHORROS
              </td>
              {MESES.map((mes) => (
                <td key={mes} className="px-3 py-3 text-right tabular-nums text-on-surface whitespace-nowrap">
                  {formatearMontoTotal(calcularTotalMes(mes))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-lg tabular-nums text-tertiary sticky right-0 bg-tertiary-container/20 backdrop-blur-sm">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
