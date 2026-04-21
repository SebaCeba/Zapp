import { useState, useEffect } from 'react';
import { Button } from './primitives';
import { EditableCell, LoadingSpinner, EmptyState } from './ui';

interface Servicio {
  id: number;
  nombre: string;
  activo: boolean;
  esBase: boolean;
  orden: number;
  presupuestos: Presupuesto[];
}

interface Presupuesto {
  id?: number;
  servicioId: number;
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

export default function TablaPresupuestoServicios({ anio, onOpenCatalogo }: Props) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/servicios-basicos/presupuesto/${anio}`);
      const data = await response.json();
      setServicios(data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuesto = (servicio: Servicio): Presupuesto => {
    if (servicio.presupuestos && servicio.presupuestos.length > 0) {
      return servicio.presupuestos[0];
    }
    return {
      servicioId: servicio.id,
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

  const formatearMontoTotal = (monto: number): string => {
    if (monto === 0) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalServicio = (presupuesto: Presupuesto): number => {
    return MESES.reduce((sum, mes) => sum + (presupuesto[mes as keyof Presupuesto] as number || 0), 0);
  };

  const calcularTotalMes = (mes: string): number => {
    return servicios.reduce((sum, servicio) => {
      const presupuesto = obtenerPresupuesto(servicio);
      return sum + (presupuesto[mes as keyof Presupuesto] as number || 0);
    }, 0);
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, mes) => sum + calcularTotalMes(mes), 0);
  };

  const guardarMonto = async (servicioId: number, mes: string, valor: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/servicios-basicos/presupuesto/${servicioId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: valor })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el servicio específico en el estado local
      setServicios(prevServicios => 
        prevServicios.map(servicio => {
          if (servicio.id === servicioId) {
            const presupuestoActualizado = servicio.presupuestos && servicio.presupuestos.length > 0
              ? { ...servicio.presupuestos[0], [mes]: valor }
              : { servicioId, anio, [mes]: valor };
            
            return {
              ...servicio,
              presupuestos: [presupuestoActualizado as Presupuesto]
            };
          }
          return servicio;
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

  if (servicios.length === 0) {
    return (
      <EmptyState
        icon="build"
        title="No tienes servicios básicos configurados"
        action={
          <Button onClick={onOpenCatalogo} variant="primary">
            Agregar primer servicio
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
                Servicio
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
            {servicios.map((servicio) => {
              const presupuesto = obtenerPresupuesto(servicio);
              const total = calcularTotalServicio(presupuesto);

              return (
                <tr key={servicio.id} className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-on-surface">
                    {servicio.nombre}
                  </td>
                  {MESES.map((mes) => (
                    <EditableCell
                      key={mes}
                      value={presupuesto[mes as keyof Presupuesto] as number}
                      onSave={(valor) => guardarMonto(servicio.id, mes, valor)}
                    />
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-on-surface tabular-nums sticky right-0 bg-surface/80 backdrop-blur-sm">
                    {formatearMontoTotal(total)}
                  </td>
                </tr>
              );
            })}
            
            {/* Fila de total */}
            <tr className="bg-secondary-container/20 font-bold border-t-2 border-secondary">
              <td className="px-4 py-3 text-on-surface">
                TOTAL SERVICIOS
              </td>
              {MESES.map((mes) => (
                <td key={mes} className="px-3 py-3 text-right tabular-nums text-on-surface whitespace-nowrap">
                  {formatearMontoTotal(calcularTotalMes(mes))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-lg tabular-nums text-secondary sticky right-0 bg-secondary-container/20 backdrop-blur-sm">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
