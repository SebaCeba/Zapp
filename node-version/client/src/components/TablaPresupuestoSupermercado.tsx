import React, { useState, useEffect } from 'react';

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
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<string | null>(null);

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

  const formatearMonto = (monto: number): string => {
    if (monto === 0) return '';
    return Math.round(monto).toLocaleString('es-CL');
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

  const guardarMonto = async (mes: string, valor: string) => {
    try {
      setGuardando(mes);
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/supermercado/presupuesto/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      const data = await response.json();
      setPresupuesto(data);
    } catch (error) {
      console.error('Error al guardar monto:', error);
    } finally {
      setGuardando(null);
      setEditando(null);
    }
  };

  const iniciarEdicion = (mes: string) => {
    setEditando(mes);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, mes: string) => {
    if (e.key === 'Enter') {
      guardarMonto(mes, e.currentTarget.value);
    } else if (e.key === 'Escape') {
      setEditando(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, mes: string) => {
    guardarMonto(mes, e.currentTarget.value);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              {MESES_DISPLAY.map(mesDisplay => (
                <th key={mesDisplay} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {mesDisplay}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Anual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                Supermercado
              </td>
              {MESES.map(mes => {
                const valor = presupuesto?.[mes as keyof Presupuesto] as number || 0;
                const estaEditando = editando === mes;
                const estaGuardando = guardando === mes;

                return (
                  <td
                    key={mes}
                    className="px-4 py-3 text-right text-sm text-gray-900 cursor-pointer hover:bg-blue-50"
                    onClick={() => !estaGuardando && iniciarEdicion(mes)}
                  >
                    {estaEditando ? (
                      <input
                        type="text"
                        defaultValue={formatearMonto(valor)}
                        className="w-full text-right border-blue-500 border-2 rounded px-2 py-1"
                        autoFocus
                        onKeyDown={(e) => handleKeyDown(e, mes)}
                        onBlur={(e) => handleBlur(e, mes)}
                        disabled={estaGuardando}
                      />
                    ) : estaGuardando ? (
                      <span className="text-gray-400">...</span>
                    ) : (
                      <span className={valor === 0 ? 'text-gray-400' : ''}>
                        {formatearMonto(valor)}
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 bg-gray-50">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
            {/* Fila de totales mensuales */}
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-3 text-sm text-gray-900">
                Total Mensual
              </td>
              {MESES.map(mes => (
                <td key={mes} className="px-4 py-3 text-right text-sm text-gray-900">
                  {formatearMontoTotal(calcularTotalMes(mes))}
                </td>
              ))}
              <td className="px-4 py-3 text-right text-sm text-gray-900 bg-gray-200">
                {formatearMontoTotal(calcularTotalAnual())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
