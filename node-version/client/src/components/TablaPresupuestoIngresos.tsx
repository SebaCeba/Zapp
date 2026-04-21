import { useState, useEffect } from 'react';
import { Button } from './primitives';
import { EditableCell, LoadingSpinner, EmptyState } from './ui';

interface IngresoBase {
  id: number;
  nombre: string;
  activo: boolean;
  esRecurrente: boolean;
  orden: number;
  presupuestos: Presupuesto[];
}

interface Presupuesto {
  id?: number;
  ingresoId: number;
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

export default function TablaPresupuestoIngresos({ anio, onOpenCatalogo }: Props) {
  const [ingresos, setIngresos] = useState<IngresoBase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const ingresosRes = await fetch(`http://localhost:3000/api/ingresos/presupuesto/${anio}`);
      const ingresosData = await ingresosRes.json();
      setIngresos(ingresosData);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerPresupuesto = (ingreso: IngresoBase): Presupuesto => {
    if (ingreso.presupuestos && ingreso.presupuestos.length > 0) {
      return ingreso.presupuestos[0];
    }
    return {
      ingresoId: ingreso.id,
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
    if (monto === 0) return '—';
    return Math.round(monto).toLocaleString('es-CL');
  };

  const formatearMontoTotal = (monto: number): string => {
    if (monto === 0) return '$0';
    
    // Formato en millones si es > 1,000,000
    if (Math.abs(monto) >= 1000000) {
      const millones = monto / 1000000;
      return `$${millones.toFixed(1).replace('.', ',')} MM`;
    }
    
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalIngreso = (presupuesto: Presupuesto): number => {
    return MESES.reduce((sum, mes) => sum + (presupuesto[mes as keyof Presupuesto] as number || 0), 0);
  };

  const calcularTotalMes = (mesIndex: number): number => {
    const mes = MESES[mesIndex];
    let total = 0;
    
    // Sumar ingresos base
    ingresos.forEach(ingreso => {
      const presupuesto = obtenerPresupuesto(ingreso);
      total += presupuesto[mes as keyof Presupuesto] as number || 0;
    });

    return total;
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, _, idx) => sum + calcularTotalMes(idx), 0);
  };

  const guardarMonto = async (ingresoId: number, mes: string, valor: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/ingresos/presupuesto/${ingresoId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: valor })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el ingreso específico en el estado local
      setIngresos(prevIngresos => 
        prevIngresos.map(ingreso => {
          if (ingreso.id === ingresoId) {
            const presupuestoBase = ingreso.presupuestos && ingreso.presupuestos.length > 0
              ? ingreso.presupuestos[0]
              : {
                  ingresoId,
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
            
            const presupuestoActualizado = { ...presupuestoBase, [mes]: valor };
            
            return {
              ...ingreso,
              presupuestos: [presupuestoActualizado]
            };
          }
          return ingreso;
        })
      );
    } catch (error) {
      console.error('Error al guardar monto:', error);
      alert('Error al guardar el monto');
    } finally {
      setEditando(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (ingresos.length === 0) {
    return (
      <EmptyState
        icon="payments"
        title="No tienes ingresos configurados"
        action={
          <Button onClick={onOpenCatalogo} variant="primary">
            Agregar primer ingreso
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
                Ingreso
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
            {ingresos.map((ingreso) => {
              const presupuesto = obtenerPresupuesto(ingreso);
              const total = calcularTotalIngreso(presupuesto);

              return (
                <tr key={ingreso.id} className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-2 font-medium text-on-surface">
                    {ingreso.nombre}
                  </td>
                  {MESES.map((mes) => (
                    <EditableCell
                      key={mes}
                      value={presupuesto[mes as keyof Presupuesto] as number}
                      onSave={(valor) => guardarMonto(ingreso.id, mes, valor)}
                    />
                  ))}
                  <td className="px-4 py-3 text-right font-semibold text-on-surface tabular-nums sticky right-0 bg-surface/80 backdrop-blur-sm">
                    {formatearMontoTotal(total)}
                  </td>
                </tr>
              );
            })}
            
            {/* Fila de total */}
            <tr className="bg-primary-container/20 font-bold border-t-2 border-primary">
              <td className="px-4 py-3 text-on-surface">
                TOTAL INGRESOS
              </td>
              {MESES.map((_, index) => (
                <td key={index} className="px-3 py-3 text-right tabular-nums text-on-surface whitespace-nowrap">
                  {formatearMontoTotal(calcularTotalMes(index))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-lg tabular-nums text-primary sticky right-0 bg-primary-container/20 backdrop-blur-sm">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
