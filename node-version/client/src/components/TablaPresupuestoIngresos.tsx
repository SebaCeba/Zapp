import React, { useState, useEffect } from 'react';
import { Button, Input, Table } from 'rsuite';

const { Column, HeaderCell, Cell } = Table;

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

interface Bono {
  id: number;
  nombre: string;
  anio: number;
  mes: number;
  monto: number;
  descripcion?: string;
  repartos: RepartoBono[];
}

interface RepartoBono {
  id: number;
  bonoId: number;
  destino: string;
  monto: number;
  porcentaje?: number;
  mesesDistribucion?: number;
}

interface Props {
  anio: number;
  onOpenCatalogo: () => void;
  onOpenBonos: () => void;
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MESES_DISPLAY = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function TablaPresupuestoIngresos({ anio, onOpenCatalogo, onOpenBonos }: Props) {
  const [ingresos, setIngresos] = useState<IngresoBase[]>([]);
  const [bonos, setBonos] = useState<Bono[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<{ ingresoId: number; mes: string } | null>(null);
  const [guardando, setGuardando] = useState<{ ingresoId: number; mes: string } | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [anio]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [ingresosRes, bonosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/ingresos/presupuesto/${anio}`),
        fetch(`http://localhost:3000/api/ingresos/bonos/${anio}`)
      ]);
      const ingresosData = await ingresosRes.json();
      const bonosData = await bonosRes.json();
      setIngresos(ingresosData);
      setBonos(bonosData);
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
    if (monto === 0) return '';
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

  const calcularBonosMes = (mesIndex: number): number => {
    const mesNum = mesIndex + 1;
    let total = 0;

    bonos.forEach(bono => {
      // Bono en el mes específico
      if (bono.mes === mesNum) {
        total += bono.monto;
      }

      // Apoyo mensual distribuido
      bono.repartos.forEach(reparto => {
        if (reparto.destino === 'apoyo_mensual' && reparto.mesesDistribucion) {
          const mesInicio = bono.mes;
          const distribucion = reparto.monto / reparto.mesesDistribucion;
          
          for (let i = 0; i < reparto.mesesDistribucion; i++) {
            const mesDistribucion = ((mesInicio + i - 1) % 12) + 1;
            if (mesDistribucion === mesNum) {
              total += distribucion;
            }
          }
        }
      });
    });

    return total;
  };

  const calcularTotalMes = (mesIndex: number): number => {
    const mes = MESES[mesIndex];
    let total = 0;
    
    // Sumar ingresos base
    ingresos.forEach(ingreso => {
      const presupuesto = obtenerPresupuesto(ingreso);
      total += presupuesto[mes as keyof Presupuesto] as number || 0;
    });

    // Sumar bonos
    total += calcularBonosMes(mesIndex);

    return total;
  };

  const calcularTotalAnual = (): number => {
    return MESES.reduce((sum, _, idx) => sum + calcularTotalMes(idx), 0);
  };

  const guardarMonto = async (ingresoId: number, mes: string, valor: string) => {
    try {
      setGuardando({ ingresoId, mes });
      
      const monto = valor.replace(/\./g, '').replace(/,/g, '.');
      const montoFloat = parseFloat(monto) || 0;

      const response = await fetch(
        `http://localhost:3000/api/ingresos/presupuesto/${ingresoId}/${anio}/${mes}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto: montoFloat })
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
            
            const presupuestoActualizado = { ...presupuestoBase, [mes]: montoFloat };
            
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
    rowType: 'ingreso' | 'bonos' | 'total';
    nombre: string;
    ingresoId?: number;
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

    // Filas de ingresos
    ingresos.forEach((ingreso) => {
      const presupuesto = obtenerPresupuesto(ingreso);
      const total = calcularTotalIngreso(presupuesto);
      
      rows.push({
        id: `ingreso-${ingreso.id}`,
        rowType: 'ingreso',
        nombre: ingreso.nombre,
        ingresoId: ingreso.id,
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

    // Fila de bonos (si hay)
    if (bonos.length > 0) {
      const bonosRow: TableRow = {
        id: 'bonos',
        rowType: 'bonos',
        nombre: 'Bonos + Apoyo Mensual',
        enero: calcularBonosMes(0),
        febrero: calcularBonosMes(1),
        marzo: calcularBonosMes(2),
        abril: calcularBonosMes(3),
        mayo: calcularBonosMes(4),
        junio: calcularBonosMes(5),
        julio: calcularBonosMes(6),
        agosto: calcularBonosMes(7),
        septiembre: calcularBonosMes(8),
        octubre: calcularBonosMes(9),
        noviembre: calcularBonosMes(10),
        diciembre: calcularBonosMes(11),
        total: bonos.reduce((sum, b) => sum + b.monto, 0),
        background: '#fef9e7'
      };
      rows.push(bonosRow);
    }

    // Fila de total
    rows.push({
      id: 'total',
      rowType: 'total',
      nombre: 'TOTAL INGRESOS',
      enero: calcularTotalMes(0),
      febrero: calcularTotalMes(1),
      marzo: calcularTotalMes(2),
      abril: calcularTotalMes(3),
      mayo: calcularTotalMes(4),
      junio: calcularTotalMes(5),
      julio: calcularTotalMes(6),
      agosto: calcularTotalMes(7),
      septiembre: calcularTotalMes(8),
      octubre: calcularTotalMes(9),
      noviembre: calcularTotalMes(10),
      diciembre: calcularTotalMes(11),
      total: calcularTotalAnual(),
      background: '#d1fae5'
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

  if (ingresos.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: '#666', marginBottom: '1rem' }}>No tienes ingresos configurados.</p>
        <Button
          onClick={onOpenCatalogo}
          appearance="primary"
        >
          Agregar primer ingreso
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Resumen de bonos */}
      {bonos.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#fef3c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <strong style={{ color: '#92400e' }}>💰 Bonos del año {anio}</strong>
            <Button onClick={onOpenBonos} size="sm">
              Gestionar
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {bonos.map(bono => (
              <span key={bono.id} style={{ fontSize: '0.875rem', color: '#78350f' }}>
                {MESES_DISPLAY[bono.mes - 1]}: {bono.nombre} (${Math.round(bono.monto).toLocaleString('es-CL')})
              </span>
            ))}
          </div>
        </div>
      )}

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
          rowClassName={(rowData: any) => {
            if (rowData?.rowType === 'total') return 'total-row';
            if (rowData?.rowType === 'bonos') return 'bonos-row';
            return '';
          }}
        >
          {/* Columna Nombre (fija izquierda) */}
          <Column width={160} fixed align="left">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'left' }}>
              Ingreso
            </CompactHeaderCell>
            <CompactCell>
              {(rowData: TableRow) => (
                <div style={{ 
                  fontWeight: rowData.rowType === 'total' ? '700' : rowData.rowType === 'bonos' ? '500' : '500',
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
                  
                  // Si es fila de total o bonos, solo mostrar valor
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

                  if (rowData.rowType === 'bonos') {
                    return (
                      <div style={{ 
                        fontWeight: '500',
                        background: rowData.background || 'transparent',
                        color: valor > 0 ? '#92400e' : '#9ca3af',
                        textAlign: 'right'
                      }}>
                        {valor > 0 ? formatearMonto(valor) : '0'}
                      </div>
                    );
                  }

                  // Fila de ingreso editable
                  const isEditando = editando?.ingresoId === rowData.ingresoId && editando?.mes === mes;
                  const isGuardando = guardando?.ingresoId === rowData.ingresoId && guardando?.mes === mes;

                  if (isEditando) {
                    return (
                      <Input
                        autoFocus
                        defaultValue={valor || ''}
                        style={{ width: '100%', textAlign: 'right', fontSize: '12px' }}
                        size="sm"
                        onBlur={(e) => guardarMonto(rowData.ingresoId!, mes, (e.target as HTMLInputElement).value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            guardarMonto(rowData.ingresoId!, mes, (e.target as HTMLInputElement).value);
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
                      onClick={() => setEditando({ ingresoId: rowData.ingresoId!, mes })}
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
                  background: rowData.rowType === 'total' ? '#6ee7b7' : rowData.rowType === 'bonos' ? '#fef3c7' : 'var(--gray-50)',
                  color: rowData.rowType === 'bonos' ? '#92400e' : 'inherit',
                  fontSize: rowData.rowType === 'total' ? '1.125rem' : 'inherit',
                  textAlign: 'right'
                }}>
                  {formatearMontoTotal(rowData.total)}
                </div>
              )}
            </CompactCell>
          </Column>
        </Table>
      </div>
    </>
  );
}
