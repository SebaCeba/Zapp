import { useState, useEffect } from 'react';
import { EditableCell, LoadingSpinner } from './ui';

interface Presupuesto {
  id?: number;
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
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_DISPLAY = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function TablaPresupuestoSupermercado({ anio }: Props) {
  const [presupuesto, setPresupuesto] = useState<Presupuesto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/supermercado/presupuesto/${anio}`);
      const data = await response.json();
      setPresupuesto(data);
    } catch (error) {
      console.error('Error al cargar presupuesto de supermercado:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMontoTotal = (monto: number): string => {
    if (monto === 0) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalMes = (mes: string): number => {
    if (!presupuesto) return 0;
    return presupuesto[mes as keyof Presupuesto] as number || 0;
  };

  const calcularTotalAnual = (): number => {
    if (!presupuesto) return 0;
    return MESES.reduce((sum, mes) => sum + calcularTotalMes(mes), 0);
  };

  const guardarMonto = async (mes: string, valor: number) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/supermercado/presupuesto/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: valor })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      const data = await response.json();
      setPresupuesto(data);
    } catch (error) {
      console.error('Error al guardar monto:', error);
      alert('Error al guardar el monto');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!presupuesto) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">shopping_cart</span>
        <p className="text-slate-600">No hay presupuesto configurado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-surface-container z-10">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-on-surface-variant border-b border-outline-variant">
                Categoría
              </th>
              {MESES_DISPLAY.map((mes) => (
                <th key={mes} className="px-3 py-2 text-center font-semibold text-on-surface-variant border-b border-outline-variant whitespace-nowrap">
                  {mes}
                </th>
              ))}
              <th className="px-4 py-2 text-right font-semibold text-on-surface-variant border-b border-outline-variant sticky right-0 bg-surface-container">
                Total Anual
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Fila de datos editables */}
            <tr className="border-b border-outline-variant/30 hover:bg-surface-container/50 transition-colors">
              <td className="px-4 py-2 font-medium text-on-surface">
                Supermercado
              </td>
              {MESES.map((mes) => (
                <EditableCell
                  key={mes}
                  value={presupuesto[mes as keyof Presupuesto] as number}
                  onSave={(valor) => guardarMonto(mes, valor)}
                />
              ))}
              <td className="px-4 py-3 text-right font-semibold text-on-surface tabular-nums sticky right-0 bg-surface/80 backdrop-blur-sm">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
            
            {/* Fila de total mensual */}
            <tr className="bg-surface-container font-bold">
              <td className="px-4 py-3 text-on-surface">
                Total Mensual
              </td>
              {MESES.map((mes) => (
                <td key={mes} className="px-3 py-3 text-right tabular-nums text-on-surface whitespace-nowrap">
                  {formatearMontoTotal(calcularTotalMes(mes))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-lg tabular-nums text-primary sticky right-0 bg-surface-container">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
