import { useState, useEffect } from 'react';
import { Button } from 'rsuite';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="monthly-table">
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 1 }}>Suscripción</th>
                {MONTHS.map((m) => (
                  <th key={m}>{m}</th>
                ))}
                <th style={{ fontWeight: 700 }}>Total {year}</th>
              </tr>
            </thead>
            <tbody>
              {data.perSubscriptionMonthly
                ?.sort((a, b) => {
                  const totalA = a.monthly.reduce((sum, val) => sum + val, 0);
                  const totalB = b.monthly.reduce((sum, val) => sum + val, 0);
                  return totalB - totalA;
                })
                .map((sub) => {
                  const total = sub.monthly.reduce((sum, val) => sum + val, 0);
                  return (
                    <tr key={sub.id}>
                      <td style={{ position: 'sticky', left: 0, background: 'white', fontWeight: 500, zIndex: 1 }}>
                        {sub.name}
                      </td>
                      {sub.monthly.map((val, idx) => (
                        <td key={idx} style={{ textAlign: 'right' }}>
                          {val > 0 ? `$${val.toLocaleString('es-CL')}` : '-'}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right', fontWeight: 700, background: 'var(--gray-50)' }}>
                        ${total.toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
