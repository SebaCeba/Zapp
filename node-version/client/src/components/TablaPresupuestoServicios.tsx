import React, { useState, useEffect } from 'react';
import { Button, Input, Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

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
  const [editando, setEditando] = useState<{ servicioId: number; mes: string } | null>(null);
  const [guardando, setGuardando] = useState<{ servicioId: number; mes: string } | null>(null);

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

  const formatearMonto = (monto: number): string => {
    if (monto === 0) return '';
    return Math.round(monto).toLocaleString('es-CL');
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

  const guardarMonto = async (servicioId: number, mes: string, valor: string) => {
    try {
      setGuardando({ servicioId, mes });
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/servicios-basicos/presupuesto/${servicioId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
        }
      );

      if (!response.ok) throw new Error('Error al guardar');

      // Actualizar solo el servicio específico en el estado local
      setServicios(prevServicios => 
        prevServicios.map(servicio => {
          if (servicio.id === servicioId) {
            const presupuestoActualizado = servicio.presupuestos && servicio.presupuestos.length > 0
              ? { ...servicio.presupuestos[0], [mes]: montoFloat }
              : { servicioId, anio, [mes]: montoFloat };
            
            return {
              ...servicio,
              presupuestos: [presupuestoActualizado]
            };
          }
          return servicio;
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
    rowType: 'servicio' | 'total';
    nombre: string;
    servicioId?: number;
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

    // Filas de servicios
    servicios.forEach((servicio) => {
      const presupuesto = obtenerPresupuesto(servicio);
      const total = calcularTotalServicio(presupuesto);
      
      rows.push({
        id: `servicio-${servicio.id}`,
        rowType: 'servicio',
        nombre: servicio.nombre,
        servicioId: servicio.id,
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
      background: '#e0f2fe'
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

  if (servicios.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes servicios básicos configurados.</p>
        <Button
          onClick={onOpenCatalogo}
          appearance="primary"
        >
          Agregar primer servicio
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
            Servicio
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

                // Fila de servicio editable
                const isEditando = editando?.servicioId === rowData.servicioId && editando?.mes === mes;
                const isGuardando = guardando?.servicioId === rowData.servicioId && guardando?.mes === mes;

                if (isEditando) {
                  return (
                    <Input
                      autoFocus
                      defaultValue={valor || ''}
                      style={{ width: '100%', textAlign: 'right', fontSize: '12px' }}
                      size="sm"
                      onBlur={(e) => guardarMonto(rowData.servicioId!, mes, (e.target as HTMLInputElement).value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          guardarMonto(rowData.servicioId!, mes, (e.target as HTMLInputElement).value);
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
                    onClick={() => setEditando({ servicioId: rowData.servicioId!, mes })}
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
                background: rowData.rowType === 'total' ? '#bae6fd' : 'var(--gray-50)',
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
