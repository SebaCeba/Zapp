import React from 'react';
import { Panel, Button, Table } from 'rsuite';
import { ObligacionFormData } from './ObligacionForm';

const { Column, HeaderCell, Cell } = Table;

interface Props {
  data: ObligacionFormData;
  year: number;
  uf: number;
  ufVariation: number;
  onBack: () => void;
  onSave: () => void;
}

function calcularProyeccion(
  data: ObligacionFormData,
  year: number,
  uf: number,
  ufVariation: number
) {
  // Calcular UF estimada por mes
  const meses = Array.from({ length: 12 }, (_, i) => i + 1);
  const ufMensual = [uf];
  const tasaMensual = Math.pow(1 + ufVariation / 100, 1 / 12) - 1;
  for (let i = 1; i < 12; i++) {
    ufMensual[i] = ufMensual[i - 1] * (1 + tasaMensual);
  }

  // Determinar meses activos y cuotas
  const cuotas = [];
  let mes = data.mesInicio;
  let anio = data.anioInicio;
  for (let i = 0; i < data.cuotas; i++) {
    if (anio > year || (anio === year && mes > 12)) break;
    if (anio === year && mes >= 1 && mes <= 12) {
      cuotas.push(mes);
    }
    mes++;
    if (mes > 12) {
      mes = 1;
      anio++;
    }
  }

  // Calcular montos mensuales en CLP
  const mensualCLP = Array(12).fill(0);
  cuotas.forEach(m => {
    if (data.moneda === 'CLP') {
      mensualCLP[m - 1] = data.monto;
    } else {
      mensualCLP[m - 1] = data.monto * ufMensual[m - 1];
    }
  });

  const totalAnual = mensualCLP.reduce((a, b) => a + b, 0);
  const promedioMensual = totalAnual / cuotas.length || 0;

  return { mensualCLP, totalAnual, promedioMensual, cuotas };
}

const VistaPreviaObligacion: React.FC<Props> = ({ data, year, uf, ufVariation, onBack, onSave }) => {
  const { mensualCLP, totalAnual, promedioMensual, cuotas } = calcularProyeccion(data, year, uf, ufVariation);
  const mesesNombre = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
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
  const tableData = [{
    id: 'monto-clp',
    label: 'Monto CLP',
    ...mesesNombre.reduce((acc, _, i) => ({ ...acc, [`mes${i}`]: mensualCLP[i] }), {})
  }];
  
  return (
    <Panel header="👁️ Vista Previa del Impacto Anual" bordered style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#666' }}>📅 {data.nombre} - {year}</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: '#f0f9f0', borderRadius: '8px', border: '1px solid #d0e7d0' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Tipo</div>
          <div style={{ fontWeight: 'bold', color: '#2d7a2d' }}>{data.tipo}</div>
        </div>
        <div style={{ padding: '1rem', background: '#f0f9f0', borderRadius: '8px', border: '1px solid #d0e7d0' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Moneda</div>
          <div style={{ fontWeight: 'bold', color: '#2d7a2d' }}>{data.moneda}</div>
        </div>
        <div style={{ padding: '1rem', background: '#f0f9f0', borderRadius: '8px', border: '1px solid #d0e7d0' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Monto cuota</div>
          <div style={{ fontWeight: 'bold', color: '#2d7a2d' }}>{data.monto.toLocaleString('es-CL')} {data.moneda}</div>
        </div>
        <div style={{ padding: '1rem', background: '#f0f9f0', borderRadius: '8px', border: '1px solid #d0e7d0' }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Cuotas en {year}</div>
          <div style={{ fontWeight: 'bold', color: '#2d7a2d' }}>{cuotas.length} de {data.cuotas}</div>
        </div>
      </div>

      <Table
        data={tableData}
        autoHeight
        bordered={true}
        cellBordered={true}
        showHeader={true}
        hover={false}
        rowHeight={30}
        headerHeight={30}
        style={{ marginBottom: '1.5rem' }}
      >
        {/* Columna Label (fija izquierda) */}
        <Column width={160} fixed align="left">
          <CompactHeaderCell className="app-table-header" style={{ textAlign: 'left' }}>
            Mes
          </CompactHeaderCell>
          <CompactCell>
            {(rowData: any) => (
              <div style={{ fontWeight: '500' }}>
                {rowData.label}
              </div>
            )}
          </CompactCell>
        </Column>

        {/* Columnas de meses */}
        {mesesNombre.map((mes, index) => (
          <Column key={mes} width={90} align="center">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'center' }}>
              {mes}
            </CompactHeaderCell>
            <CompactCell>
              {(rowData: any) => {
                const monto = rowData[`mes${index}`];
                return (
                  <div style={{ 
                    textAlign: 'center',
                    fontWeight: monto > 0 ? 'bold' : 'normal',
                    color: monto > 0 ? '#2d7a2d' : '#ccc',
                    background: monto > 0 ? '#f0f9f0' : 'transparent'
                  }}>
                    {monto > 0 ? `$${Math.round(monto).toLocaleString('es-CL')}` : '-'}
                  </div>
                );
              }}
            </CompactCell>
          </Column>
        ))}
      </Table>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #2d7a2d' }}>
          <div style={{ fontSize: '0.85rem', color: '#1b5e20', marginBottom: '0.5rem' }}>💰 Total Anual</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d7a2d' }}>{totalAnual.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
        </div>
        <div style={{ padding: '1.25rem', background: '#e3f2fd', borderRadius: '8px', border: '2px solid #1976d2' }}>
          <div style={{ fontSize: '0.85rem', color: '#0d47a1', marginBottom: '0.5rem' }}>📊 Promedio Mensual</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>{promedioMensual.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button appearance="default" onClick={onBack} style={{ flex: 1 }}>← Volver</Button>
        <Button appearance="primary" onClick={onSave} style={{ flex: 1, background: '#2d7a2d' }}>✓ Guardar Obligación</Button>
      </div>
    </Panel>
  );
};

export default VistaPreviaObligacion;
