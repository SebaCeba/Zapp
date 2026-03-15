import { useState, useEffect } from 'react';
import { Button, Input, Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

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
  const [editando, setEditando] = useState<{ ahorroId: number; mes: string } | null>(null);
  const [guardando, setGuardando] = useState<{ ahorroId: number; mes: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/ahorros/presupuesto/${anio}`);
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

  const guardarMonto = async (ahorroId: number, mes: string, valor: string) => {
    try {
      setGuardando({ ahorroId, mes });
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/ahorros/presupuesto/${ahorroId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
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
            
            const presupuestoActualizado: Presupuesto = { ...basePresupuesto, [mes]: montoFloat };
            
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
    } finally {
      setGuardando(null);
      setEditando(null);
    }
  };

  // Wrappers compactos siguiendo TABLE_STANDARD_V1
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

  const CompactHeaderCell = (props: any) => (
    <HeaderCell
      {...props}
      style={{
        padding: '4px',
        ...props.style
      }}
    />
  );

  // Preparar datos para la tabla
  interface TableRow {
    id: string;
    rowType: 'ahorro' | 'total';
    nombre: string;
    ahorroId?: number;
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
    total: number;
    background?: string;
  }

  const prepararDatosTabla = (): TableRow[] => {
    const rows: TableRow[] = [];

    // Filas de ahorros
    ahorros.forEach((ahorro) => {
      const presupuesto = obtenerPresupuesto(ahorro);
      const total = calcularTotalAhorro(presupuesto);
      
      rows.push({
        id: `ahorro-${ahorro.id}`,
        rowType: 'ahorro',
        nombre: ahorro.nombre,
        ahorroId: ahorro.id,
        enero: presupuesto.enero,
        febrero: presupuesto.febrero,
        marzo: presupuesto.marzo,
        abril: presupuesto.abril,
        mayo: presupuesto.mayo,
        junio: presupuesto.junio,
        julio: presupuesto.julio,
        agosto: presupuesto.agosto,
        septiembre: presupuesto.septiembre,
        octubre: presupuesto.octubre,
        noviembre: presupuesto.noviembre,
        diciembre: presupuesto.diciembre,
        total
      });
    });

    // Fila de total
    rows.push({
      id: 'total',
      rowType: 'total',
      nombre: 'TOTAL',
      enero: calcularTotalMes('enero'),
      febrero: calcularTotalMes('febrero'),
      marzo: calcularTotalMes('marzo'),
      abril: calcularTotalMes('abril'),
      mayo: calcularTotalMes('mayo'),
      junio: calcularTotalMes('junio'),
      julio: calcularTotalMes('julio'),
      agosto: calcularTotalMes('agosto'),
      septiembre: calcularTotalMes('septiembre'),
      octubre: calcularTotalMes('octubre'),
      noviembre: calcularTotalMes('noviembre'),
      diciembre: calcularTotalMes('diciembre'),
      total: calcularTotalAnual(),
      background: '#dbeafe'
    });

    return rows;
  };

  const tableData = prepararDatosTabla();

  if (loading) {
    return (
      <div className="loading" style={{ textAlign: 'center', padding: '3rem' }}>
        Cargando...
      </div>
    );
  }

  if (ahorros.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes ahorros configurados.</p>
        <Button
          onClick={onOpenCatalogo}
          appearance="primary"
        >
          Agregar primer ahorro
        </Button>
      </div>
    );
  }

  return (
    <div className="card">
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
        rowClassName={(rowData: any) => rowData?.rowType === 'total' ? 'total-row' : ''}
      >
        {/* Columna Nombre (fija izquierda) */}
        <Column width={160} fixed align="left">
          <CompactHeaderCell className="app-table-header" style={{ textAlign: 'left' }}>
            Ahorro
          </CompactHeaderCell>
          <CompactCell>
            {(rowData: TableRow) => (
              <div style={{ 
                fontWeight: rowData.rowType === 'total' ? '700' : '500',
                background: rowData.background || 'transparent'
              }}>
                {rowData.nombre}
              </div>
            )}
          </CompactCell>
        </Column>

        {/* Columnas de meses */}
        {MESES.map((mes, index) => (
          <Column key={mes} width={90} align="right">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'center' }}>
              {MESES_DISPLAY[index]}
            </CompactHeaderCell>
            <CompactCell>
              {(rowData: TableRow) => {
                const valor = rowData[mes as keyof TableRow] as number;
                
                // Si es fila de total, solo mostrar valor
                if (rowData.rowType === 'total') {
                  return (
                    <div style={{ 
                      fontWeight: '600',
                      background: rowData.background || 'transparent',
                      textAlign: 'right'
                    }}>
                      {formatearMontoTotal(valor)}
                    </div>
                  );
                }

                // Fila de ahorro editable
                const isEditando = editando?.ahorroId === rowData.ahorroId && editando?.mes === mes;
                const isGuardando = guardando?.ahorroId === rowData.ahorroId && guardando?.mes === mes;

                if (isEditando) {
                  return (
                    <Input
                      autoFocus
                      defaultValue={valor || ''}
                      style={{ width: '100%', textAlign: 'right', fontSize: '12px' }}
                      size="sm"
                      onBlur={(e) => guardarMonto(rowData.ahorroId!, mes, (e.target as HTMLInputElement).value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          guardarMonto(rowData.ahorroId!, mes, (e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  );
                }

                return (
                  <div
                    style={{
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      color: valor === 0 ? '#9ca3af' : 'inherit',
                      textAlign: 'right'
                    }}
                    onClick={() => setEditando({ ahorroId: rowData.ahorroId!, mes })}
                  >
                    {isGuardando ? (
                      <span style={{ color: 'var(--primary)' }}>...</span>
                    ) : (
                      formatearMonto(valor) || '0'
                    )}
                  </div>
                );
              }}
            </CompactCell>
          </Column>
        ))}

        {/* Columna Total (fija derecha) */}
        <Column width={120} align="right" fixed="right">
          <CompactHeaderCell className="app-table-header" style={{ textAlign: 'right' }}>
            Total
          </CompactHeaderCell>
          <CompactCell>
            {(rowData: TableRow) => (
              <div style={{ 
                fontWeight: rowData.rowType === 'total' ? '700' : '600',
                background: rowData.rowType === 'total' ? '#93c5fd' : 'var(--gray-50)',
                fontSize: rowData.rowType === 'total' ? '1.125rem' : 'inherit',
                textAlign: 'right'
              }}>
                {rowData.rowType === 'total' 
                  ? `$${Math.round(rowData.total).toLocaleString('es-CL')}`
                  : formatearMontoTotal(rowData.total)
                }
              </div>
            )}
          </CompactCell>
        </Column>
      </Table>
    </div>
  );
}
