import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import YearAndUFSelector from '../components/YearAndUFSelector';

interface MortgagePayment {
  id: number;
  numDiv: number;
  amortizacionUf: number;
  interesUf: number;
  comDIn: number;
  totalDivUf: number;
  fechaVencimiento: string;
  saldoInsolutoUf: number;
}

interface MortgageInsurance {
  id: number;
  nombre: string;
  mesAnio: string;
  monto: number;
  moneda: string;
}

export default function Hipotecario() {
  const [anioProyectado, setAnioProyectado] = useState(new Date().getFullYear());
  const [uf, setUf] = useState<number | null>(null);
  const [ufVariation, setUfVariation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [payments, setPayments] = useState<MortgagePayment[]>([]);
  const [seguros, setSeguros] = useState<MortgageInsurance[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [newSeguroNombre, setNewSeguroNombre] = useState('');
  const [newSeguroMonto, setNewSeguroMonto] = useState('');
  const [newSeguroMoneda, setNewSeguroMoneda] = useState('CLP');

  // Cargar supuestos anuales UF
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:3000/api/obligaciones/supuestos/${anioProyectado}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUf(data.valorUfBase);
          setUfVariation(data.variacionAnualUf);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [anioProyectado]);

  // Guardar supuestos UF cuando cambien
  useEffect(() => {
    if (uf === null || ufVariation === null || loading) return;
    
    const timer = setTimeout(() => {
      fetch('http://localhost:3000/api/obligaciones/supuestos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anio: anioProyectado,
          valorUfBase: uf,
          variacionAnualUf: ufVariation
        })
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [uf, ufVariation, anioProyectado, loading]);

  // Cargar payments y seguros
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/hipotecario/payments').then(r => r.json()),
      fetch('http://localhost:3000/api/hipotecario/seguros').then(r => r.json())
    ]).then(([paymentsData, segurosData]) => {
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setSeguros(Array.isArray(segurosData) ? segurosData : []);
    }).catch(() => {
      setPayments([]);
      setSeguros([]);
    });
  }, [refreshKey]);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:3000/api/hipotecario/import-csv', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setRefreshKey(prev => prev + 1);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error al importar CSV');
    }
    
    e.target.value = '';
  };

  const handleAddSeguro = async () => {
    if (!newSeguroNombre || !newSeguroMonto) {
      alert('Ingresa nombre y monto');
      return;
    }

    const montoNumerico = parseFloat(newSeguroMonto.replace(',', '.'));
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/hipotecario/seguros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newSeguroNombre,
          anio: anioProyectado,
          monto: montoNumerico,
          moneda: newSeguroMoneda
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'No se pudo guardar el seguro'}`);
        return;
      }
      
      const result = await response.json();
      alert(result.message);
      
      setNewSeguroNombre('');
      setNewSeguroMonto('');
      setNewSeguroMoneda('CLP');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error al guardar seguro:', error);
      alert('Error al guardar seguro');
    }
  };

  const handleDeleteSeguro = async (nombre: string, anio: number) => {
    if (!confirm(`¿Eliminar "${nombre}" para todo el año ${anio}?`)) return;
    try {
      await fetch(`http://localhost:3000/api/hipotecario/seguros/${encodeURIComponent(nombre)}/${anio}`, {
        method: 'DELETE'
      });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      alert('Error al eliminar');
    }
  };

  const calcularUfParaMes = (anio: number, mes: number, ufBase: number, variacion: number, anioBase: number) => {
    // Calcular cuántos meses han pasado desde enero del año base
    const mesesDesdeBase = (anio - anioBase) * 12 + (mes - 1);
    // Aplicar variación mensual compuesta
    const variacionMensual = variacion / 12 / 100;
    return ufBase * Math.pow(1 + variacionMensual, mesesDesdeBase);
  };

  const getSeguroForMonth = (mesAnio: string): number => {
    // Sumar todos los seguros del mismo mes
    const segurosDelMes = seguros.filter(s => s.mesAnio === mesAnio);
    
    // Extraer año y mes del formato YYYY-MM
    const [anio, mesStr] = mesAnio.split('-');
    const mes = parseInt(mesStr);
    
    return segurosDelMes.reduce((total, seguro) => {
      // Si es UF, convertir a CLP usando el valor UF del mes específico
      if (seguro.moneda === 'UF') {
        const ufMes = calcularUfParaMes(parseInt(anio), mes, uf, ufVariation, anioProyectado);
        return total + (seguro.monto * ufMes);
      }
      return total + seguro.monto;
    }, 0);
  };

  if (loading || uf === null || ufVariation === null) {
    return (
      <MainLayout>
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#666' }}>Cargando supuestos anuales...</p>
        </div>
      </MainLayout>
    );
  }

  // Filtrar cuotas del año proyectado
  const cuotasDelAnio = payments
    .filter(p => {
      const fecha = new Date(p.fechaVencimiento);
      return fecha.getFullYear() === anioProyectado;
    })
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());

  // Generar presupuesto mensual (12 meses)
  const mesesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const presupuestoAnual = mesesNombre.map((nombre, idx) => {
    const mes = idx + 1;
    const mesAnio = `${anioProyectado}-${mes.toString().padStart(2, '0')}`;
    const cuota = cuotasDelAnio.find(c => {
      const fecha = new Date(c.fechaVencimiento);
      return fecha.getMonth() + 1 === mes;
    });

    if (!cuota) {
      return {
        mes: nombre,
        mesAnio,
        sinDato: true,
        cuotaClp: 0,
        seguroClp: getSeguroForMonth(mesAnio),
        totalClp: getSeguroForMonth(mesAnio)
      };
    }

      const ufMes = calcularUfParaMes(anioProyectado, mes, uf, ufVariation, anioProyectado);
    const cuotaClp = cuota.totalDivUf * ufMes;
    const interesClp = cuota.interesUf * ufMes;
    const amortClp = cuota.amortizacionUf * ufMes;
    const seguroClp = getSeguroForMonth(mesAnio);
    const totalClp = cuotaClp + seguroClp;

    return {
      mes: nombre,
      mesAnio,
      sinDato: false,
      fechaVencimiento: new Date(cuota.fechaVencimiento).toLocaleDateString('es-CL'),
      numDiv: cuota.numDiv,
      cuotaUf: cuota.totalDivUf,
      interesUf: cuota.interesUf,
      amortUf: cuota.amortizacionUf,
      cuotaClp,
      interesClp,
      amortClp,
      seguroClp,
      totalClp
    };
  });

  const totalCuotasClp = presupuestoAnual.reduce((sum, m) => sum + (m.cuotaClp || 0), 0);
  const totalSegurosClp = presupuestoAnual.reduce((sum, m) => sum + m.seguroClp, 0);
  const totalAnualClp = totalCuotasClp + totalSegurosClp;

  return (
    <MainLayout>
      <div className="container">
        <h1 style={{ marginBottom: '1.5rem', color: '#2d7a2d' }}>🏠 Presupuesto Hipotecario</h1>
        <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
          Proyección anual del crédito hipotecario en CLP. Importa la tabla de amortización y define el año a presupuestar.
        </p>

        {/* A) Supuestos Anuales UF + Año a Proyectar */}
        <YearAndUFSelector
          year={anioProyectado}
          setYear={setAnioProyectado}
          uf={uf}
          setUf={setUf}
          ufVariation={ufVariation}
          setUfVariation={setUfVariation}
        />

        {/* C) Importación y Seguros - Lado a lado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Tabla de Amortización */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>📁 Tabla de Amortización</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Importa un archivo CSV con las columnas: num_div, amortizacion_uf, interes_uf, com_d_in, total_div_uf, fecha_vencimiento (dd/mm/yyyy), saldo_insoluto_uf.
              Usa punto y coma (;) como separador.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
                📤 Importar CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
              </label>
              {payments.length > 0 && (
                <span style={{ padding: '0.5rem 1rem', background: '#e8f5e9', borderRadius: '4px', fontSize: '0.9rem', color: '#2d7a2d' }}>
                  ✅ {payments.length} cuotas cargadas
                </span>
              )}
              {payments.length === 0 && (
                <span style={{ padding: '0.5rem 1rem', background: '#ffebee', borderRadius: '4px', fontSize: '0.9rem', color: '#c62828' }}>
                  ⚠️ Sin tabla cargada
                </span>
              )}
            </div>
          </div>

          {/* Seguros */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>🛡️ Seguros Anuales</h3>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
              Define seguros mensuales recurrentes para todo el año. Se aplican automáticamente a los 12 meses.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                className="input"
                type="text"
                value={newSeguroNombre}
                onChange={e => setNewSeguroNombre(e.target.value)}
                placeholder="Nombre del seguro"
                style={{ flex: '1 1 200px' }}
              />
              <input
                className="input"
                type="text"
                value={newSeguroMonto}
                onChange={e => setNewSeguroMonto(e.target.value)}
                placeholder="Monto mensual"
                style={{ flex: '0 0 120px' }}
              />
              <select
                className="input"
                value={newSeguroMoneda}
                onChange={e => setNewSeguroMoneda(e.target.value)}
                style={{ flex: '0 0 80px' }}
              >
                <option value="CLP">CLP</option>
                <option value="UF">UF</option>
              </select>
              <button className="btn" onClick={handleAddSeguro}>
                ➕ Agregar
              </button>
            </div>

            {seguros.length > 0 && (() => {
              // Agrupar seguros por nombre y año
              const segurosAgrupados = seguros.reduce((acc: any, seguro) => {
                const anio = seguro.mesAnio.split('-')[0];
                const key = `${seguro.nombre}_${anio}`;
                if (!acc[key]) {
                  acc[key] = {
                    nombre: seguro.nombre,
                    anio,
                    monto: seguro.monto,
                    moneda: seguro.moneda,
                    count: 1
                  };
                } else {
                  acc[key].count++;
                }
                return acc;
              }, {});

              const segurosUnicos = Object.values(segurosAgrupados);

              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nombre</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Año</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Monto Mensual</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Moneda</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segurosUnicos.map((seguro: any) => (
                        <tr key={`${seguro.nombre}_${seguro.anio}`} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{seguro.nombre}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{seguro.anio}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#2d7a2d' }}>
                            {seguro.monto.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: seguro.moneda === 'UF' ? '#1976d2' : '#2d7a2d' }}>
                            {seguro.moneda}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteSeguro(seguro.nombre, parseInt(seguro.anio))}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            {seguros.length === 0 && (
              <p style={{ color: '#999', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>
                Sin seguros registrados
              </p>
            )}
          </div>
        </div>

        {/* E) Tabla Presupuesto del Año */}
        {payments.length > 0 ? (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>📊 Presupuesto {anioProyectado}</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Mes</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Fecha</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #ddd' }}>N° Div</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Cuota UF</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Cuota CLP</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Seguro CLP</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #ddd', fontWeight: 'bold' }}>Total CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestoAnual.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem' }}>{row.mes}</td>
                      {row.sinDato ? (
                        <>
                          <td colSpan={4} style={{ padding: '0.75rem', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                            ⚠️ Sin cuota para este mes
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: row.seguroClp > 0 ? '#f57c00' : '#ccc' }}>
                            {row.seguroClp > 0 ? `$${Math.round(row.seguroClp).toLocaleString('es-CL')}` : '-'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: row.totalClp > 0 ? '#2d7a2d' : '#ccc' }}>
                            {row.totalClp > 0 ? `$${Math.round(row.totalClp).toLocaleString('es-CL')}` : '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.fechaVencimiento}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{row.numDiv}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {row.cuotaUf?.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1976d2', fontWeight: 'bold' }}>
                            ${Math.round(row.cuotaClp || 0).toLocaleString('es-CL')}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: row.seguroClp > 0 ? '#f57c00' : '#ccc' }}>
                            {row.seguroClp > 0 ? `$${Math.round(row.seguroClp).toLocaleString('es-CL')}` : '-'}
                          </td>
                          <td style={{ 
                            padding: '0.75rem', 
                            textAlign: 'right', 
                            fontWeight: 'bold', 
                            color: '#2d7a2d',
                            background: '#f0f9f0'
                          }}>
                            ${Math.round(row.totalClp).toLocaleString('es-CL')}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#999', marginBottom: '1rem' }}>📋 Sin tabla cargada</h3>
            <p style={{ color: '#666' }}>
              Importa un archivo CSV para visualizar el presupuesto anual.
            </p>
          </div>
        )}

        {/* F) Totales */}
        {payments.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>💰 Totales Anuales {anioProyectado}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: '#e3f2fd', borderRadius: '8px', border: '2px solid #1976d2' }}>
                <div style={{ fontSize: '0.85rem', color: '#0d47a1', marginBottom: '0.5rem' }}>Total Cuotas CLP</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                  ${Math.round(totalCuotasClp).toLocaleString('es-CL')}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: '#fff3e0', borderRadius: '8px', border: '2px solid #f57c00' }}>
                <div style={{ fontSize: '0.85rem', color: '#e65100', marginBottom: '0.5rem' }}>Total Seguros CLP</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57c00' }}>
                  ${Math.round(totalSegurosClp).toLocaleString('es-CL')}
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: '#e8f5e9', borderRadius: '8px', border: '2px solid #2d7a2d' }}>
                <div style={{ fontSize: '0.85rem', color: '#1b5e20', marginBottom: '0.5rem' }}>Total Anual CLP</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2d7a2d' }}>
                  ${Math.round(totalAnualClp).toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
