import { useEffect, useState } from 'react';

interface Props {
  year: number;
  uf: number;
  ufVariation: number;
  refreshKey: number;
}

interface Obligacion {
  id: number;
  nombre: string;
  tipo: string;
  moneda: string;
  montoCuota: number;
  cuotasTotales: number;
  mesInicio: number;
  anioInicio: number;
}

interface ObligacionConMontos extends Obligacion {
  monthlyAmounts: number[];
}

export default function DashboardObligaciones({ year, uf, ufVariation, refreshKey }: Props) {
  const [totalAnual, setTotalAnual] = useState(0);
  const [obligacionesActivas, setObligacionesActivas] = useState(0);
  const [promedioMensual, setPromedioMensual] = useState(0);
  const [monthlyTotals, setMonthlyTotals] = useState<number[]>(Array(12).fill(0));
  const [obligacionesConMontos, setObligacionesConMontos] = useState<ObligacionConMontos[]>([]);

  useEffect(() => {
    fetch('/api/obligaciones')
      .then(res => res.json())
      .then((obligaciones: Obligacion[]) => {
        const monthly = Array(12).fill(0);
        const ufMensual = calcularUfMensual(uf, ufVariation);
        let activas = 0;
        const oblConMontos: ObligacionConMontos[] = [];

        obligaciones.forEach(obl => {
          const cuotasEnAnio = calcularCuotasEnAnio(obl, year);
          if (cuotasEnAnio.length > 0) {
            activas++;
            const monthlyAmounts = Array(12).fill(0);
            cuotasEnAnio.forEach(mes => {
              const montoCLP = obl.moneda === 'CLP' 
                ? obl.montoCuota 
                : obl.montoCuota * ufMensual[mes - 1];
              monthly[mes - 1] += montoCLP;
              monthlyAmounts[mes - 1] = montoCLP;
            });
            oblConMontos.push({ ...obl, monthlyAmounts });
          }
        });

        const total = monthly.reduce((a, b) => a + b, 0);
        const promedio = activas > 0 ? total / 12 : 0;

        setMonthlyTotals(monthly);
        setTotalAnual(total);
        setPromedioMensual(promedio);
        setObligacionesActivas(activas);
        setObligacionesConMontos(oblConMontos);
      })
      .catch(() => {});
  }, [year, uf, ufVariation, refreshKey]);

  const calcularUfMensual = (ufBase: number, variacion: number) => {
    const ufMensual = [ufBase];
    const tasaMensual = Math.pow(1 + variacion / 100, 1 / 12) - 1;
    for (let i = 1; i < 12; i++) {
      ufMensual[i] = ufMensual[i - 1] * (1 + tasaMensual);
    }
    return ufMensual;
  };

  const calcularCuotasEnAnio = (obl: Obligacion, anio: number) => {
    const cuotas = [];
    let mes = obl.mesInicio;
    let anioActual = obl.anioInicio;
    
    for (let i = 0; i < obl.cuotasTotales; i++) {
      if (anioActual === anio && mes >= 1 && mes <= 12) {
        cuotas.push(mes);
      }
      mes++;
      if (mes > 12) {
        mes = 1;
        anioActual++;
      }
      if (anioActual > anio) break;
    }
    return cuotas;
  };

  const mesesNombre = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const tipoEmoji: { [key: string]: string } = {
    'consumo': '💳',
    'seguro': '🛡️'
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>📊 Resumen Anual {year}</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #2d7a2d' }}>
          <div style={{ fontSize: '0.85rem', color: '#1b5e20', marginBottom: '0.5rem' }}>💰 Total Anual</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d7a2d' }}>
            {totalAnual.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
          </div>
        </div>
        <div style={{ padding: '1.25rem', background: '#e3f2fd', borderRadius: '8px', border: '2px solid #1976d2' }}>
          <div style={{ fontSize: '0.85rem', color: '#0d47a1', marginBottom: '0.5rem' }}>📊 Promedio Mensual</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
            {promedioMensual.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
          </div>
        </div>
        <div style={{ padding: '1.25rem', background: '#fff3e0', borderRadius: '8px', border: '2px solid #f57c00' }}>
          <div style={{ fontSize: '0.85rem', color: '#e65100', marginBottom: '0.5rem' }}>📋 Obligaciones Activas</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>{obligacionesActivas}</div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd', minWidth: '150px' }}>Crédito</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd', width: '50px' }}>Tipo</th>
              {mesesNombre.map((mes, i) => (
                <th key={i} style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd', fontSize: '0.85rem' }}>{mes}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {obligacionesConMontos.map(obl => (
              <tr key={obl.id}>
                <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>{obl.nombre}</td>
                <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #eee', fontSize: '1.2rem' }}>
                  {tipoEmoji[obl.tipo] || '📄'}
                </td>
                {obl.monthlyAmounts.map((monto, i) => (
                  <td key={i} style={{ 
                    padding: '0.75rem', 
                    textAlign: 'center',
                    fontWeight: monto > 0 ? 'bold' : 'normal', 
                    color: monto > 0 ? '#2d7a2d' : '#ccc',
                    background: monto > 0 ? '#f0f9f0' : 'transparent',
                    borderBottom: '1px solid #eee',
                    fontSize: '0.85rem'
                  }}>
                    {monto > 0 ? `$${Math.round(monto).toLocaleString('es-CL')}` : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
