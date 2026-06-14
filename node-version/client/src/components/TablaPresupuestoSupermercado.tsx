import { useState, useEffect } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

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
      const response = await fetch(`/api/supermercado/presupuesto/${anio}`);
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
        `/api/supermercado/presupuesto/${anio}/${mes}`,
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, mes: string) => {
    if (e.key === 'Enter') {
      guardarMonto(mes, e.currentTarget.value);
    } else if (e.key === 'Escape') {
      setEditando(null);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>, mes: string) => {
    guardarMonto(mes, e.currentTarget.value);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  // Wrappers compactos para Cell y HeaderCell
  const CompactCell = (props: any) => (
    <Cell
      {...props}
      style={{
        padding: '4px',
        fontSize: '12px',
        ...props.style
      }}
    />
  );
  const CompactHeaderCell = (props: any) => <HeaderCell {...props} style={{ padding: '4px', ...props.style }} />;

  // Crear custom cell editable para cada mes
  const EditableMonthCell = ({ rowData, dataKey, ...props }: any) => {
    // Si es la fila de totales (rowData.isTotal), solo mostrar el valor
    if (rowData.isTotal) {
      return (
        <CompactCell {...props} className="font-bold bg-gray-100">
          {formatearMontoTotal(calcularTotalMes(dataKey))}
        </CompactCell>
      );
    }

    // Fila de datos editables
    const mes = dataKey;
    const valor = presupuesto?.[mes as keyof Presupuesto] as number || 0;
    const estaEditando = editando === mes;
    const estaGuardando = guardando === mes;

    return (
      <CompactCell {...props} className="cursor-pointer hover:bg-blue-50">
        <div onClick={() => !estaGuardando && iniciarEdicion(mes)}>
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
        </div>
      </CompactCell>
    );
  };

  // Datos para la tabla: 2 filas (datos + totales)
  const tableData = [
    { id: 1, categoria: 'Supermercado', isTotal: false },
    { id: 2, categoria: 'Total Mensual', isTotal: true }
  ];

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table
        data={tableData}
        autoHeight
        bordered={true}
        cellBordered={true}
        showHeader={true}
        hover={true}
        rowHeight={30}
        headerHeight={30}
        affixHeader
        affixHorizontalScrollbar
        rowClassName={(rowData) => rowData?.isTotal ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}
      >
        <Column width={160} fixed align="left">
          <CompactHeaderCell className="app-table-header" style={{ textAlign: 'left' }}>
            Categoría
          </CompactHeaderCell>
          <CompactCell dataKey="categoria" className="text-sm font-medium text-gray-900" />
        </Column>

        {MESES.map((mes, index) => (
          <Column key={mes} width={90} align="right">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'center' }}>
              {MESES_DISPLAY[index]}
            </CompactHeaderCell>
            <EditableMonthCell dataKey={mes} />
          </Column>
        ))}

        <Column width={120} align="right" fixed="right">
          <CompactHeaderCell className="app-table-header" style={{ textAlign: 'right' }}>
            Total Anual
          </CompactHeaderCell>
          <CompactCell className="text-sm font-bold text-gray-900 bg-gray-50">
            {() => formatearMontoTotal(calcularTotalAnual())}
          </CompactCell>
        </Column>
      </Table>
    </div>
  );
}
