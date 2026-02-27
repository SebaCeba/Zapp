import { useState, useEffect } from 'react';
import { Button, Table } from 'rsuite';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const { Column, HeaderCell, Cell } = Table;

interface DashboardProps {
  year: number;
  refreshKey: number;
}

interface YearData {
  monthlyTotals: number[];
  monthlyCounts: number[];
  cumulative: number[];
  perSubscription: Array<{ name: string; total: number }>;
  perSubscriptionMonthly: Array<{ id: number; name: string; monthly: number[] }>;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard({ year, refreshKey }: DashboardProps) {
  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYearData();
  }, [year, refreshKey]);

  const fetchYearData = async () => {
    try {
      const response = await fetch(`/api/analytics/year-data?year=${year}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching year data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    window.location.href = `/api/analytics/download-csv?year=${year}`;
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

  if (loading) return <div className="loading">Cargando datos...</div>;
  if (!data) return <div className="loading">No hay datos disponibles</div>;

  const yearTotal = data.monthlyTotals.reduce((sum, val) => sum + val, 0);
  const avgMonthly = Math.round(yearTotal / 12);
  const totalSubscriptions = data.perSubscription.length;

  const chartData = MONTHS.map((month, idx) => ({
    month,
    total: data.monthlyTotals[idx],
    count: data.monthlyCounts[idx]
  }));

  return (
    <>
      <div className="grid grid-4">
        <div className="stat-card">
          <div className="stat-label">Total Año</div>
          <div className="stat-value">${yearTotal.toLocaleString('es-CL')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Promedio Mensual</div>
          <div className="stat-value">${avgMonthly.toLocaleString('es-CL')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Suscripciones</div>
          <div className="stat-value">{totalSubscriptions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Acción</div>
          <Button appearance="primary" onClick={downloadCSV} style={{ marginTop: '0.5rem' }}>
            📥 Descargar CSV
          </Button>
        </div>
      </div>

      <div className="card">
        <h2>📊 Gastos Mensuales {year}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
            />
            <Legend />
            <Bar dataKey="total" fill="#2563eb" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>💰 Por Suscripción</h2>
        <Table
          data={data.perSubscriptionMonthly
            ?.sort((a, b) => {
              const totalA = a.monthly.reduce((sum, val) => sum + val, 0);
              const totalB = b.monthly.reduce((sum, val) => sum + val, 0);
              return totalB - totalA;
            }) || []}
          autoHeight
          bordered={true}
          cellBordered={true}
          showHeader={true}
          hover={true}
          rowHeight={30}
          headerHeight={30}
          affixHeader
          affixHorizontalScrollbar
        >
          {/* Columna Suscripción (fija izquierda) */}
          <Column width={160} fixed align="left">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'left' }}>
              Suscripción
            </CompactHeaderCell>
            <CompactCell>
              {(rowData: any) => (
                <div style={{ fontWeight: '500' }}>
                  {rowData.name}
                </div>
              )}
            </CompactCell>
          </Column>

          {/* Columnas de meses */}
          {MONTHS.map((mes, index) => (
            <Column key={mes} width={90} align="right">
              <CompactHeaderCell className="app-table-header" style={{ textAlign: 'center' }}>
                {mes}
              </CompactHeaderCell>
              <CompactCell>
                {(rowData: any) => {
                  const val = rowData.monthly[index];
                  return (
                    <div style={{ textAlign: 'right' }}>
                      {val > 0 ? `$${val.toLocaleString('es-CL')}` : '-'}
                    </div>
                  );
                }}
              </CompactCell>
            </Column>
          ))}

          {/* Columna Total (fija derecha) */}
          <Column width={120} align="right" fixed="right">
            <CompactHeaderCell className="app-table-header" style={{ textAlign: 'right' }}>
              Total {year}
            </CompactHeaderCell>
            <CompactCell>
              {(rowData: any) => {
                const total = rowData.monthly.reduce((sum: number, val: number) => sum + val, 0);
                return (
                  <div style={{ 
                    fontWeight: '700',
                    background: 'var(--gray-50)',
                    textAlign: 'right'
                  }}>
                    ${total.toLocaleString('es-CL')}
                  </div>
                );
              }}
            </CompactCell>
          </Column>
        </Table>
      </div>
    </>
  );
}
