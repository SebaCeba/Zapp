import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/primitives/Card';
import { Button } from '../components/primitives/Button';
import { Input } from '../components/primitives/Input';
import { Select } from '../components/primitives/Select';
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
    const headerProps = {
      year: anioProyectado,
      title: 'Presupuesto Hipotecario',
    };
    
    return (
      <MainLayout headerProps={headerProps}>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-500">Cargando supuestos anuales...</p>
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

  const headerProps = {
    year: anioProyectado,
    title: 'Presupuesto Hipotecario',
  };

  return (
    <MainLayout headerProps={headerProps}>
      <div className="space-y-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabla de Amortización */}
          <Card>
            <h3 className="text-base font-semibold text-navy-dark mb-4">Tabla de Amortización</h3>
            <p className="text-sm text-slate-600 mb-4">
              Importa un archivo CSV con las columnas: num_div, amortizacion_uf, interes_uf, com_d_in, total_div_uf, fecha_vencimiento (dd/mm/yyyy), saldo_insoluto_uf.
              Usa punto y coma (;) como separador.
            </p>
            <div className="flex gap-4 items-center flex-wrap">
              <Button as="label" variant="primary">
                Importar CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  className="hidden"
                />
              </Button>
              {payments.length > 0 && (
                <span className="px-4 py-2 bg-green-50 rounded-lg text-sm text-green-700 font-medium">
                  {payments.length} cuotas cargadas
                </span>
              )}
              {payments.length === 0 && (
                <span className="px-4 py-2 bg-red-50 rounded-lg text-sm text-red-700 font-medium">
                  Sin tabla cargada
                </span>
              )}
            </div>
          </Card>

          {/* Seguros */}
          <Card>
            <h3 className="text-base font-semibold text-navy-dark mb-4">Seguros Anuales</h3>
            <p className="text-sm text-slate-600 mb-4">
              Define seguros mensuales recurrentes para todo el año. Se aplican automáticamente a los 12 meses.
            </p>
            
            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                type="text"
                value={newSeguroNombre}
                onChange={(e) => setNewSeguroNombre(e.target.value)}
                placeholder="Nombre del seguro"
                className="flex-1 min-w-[200px] px-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <input
                type="number"
                value={newSeguroMonto}
                onChange={(e) => setNewSeguroMonto(e.target.value)}
                placeholder="Monto mensual"
                step="0.01"
                min="0"
                className="w-[120px] px-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm transition-all focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <Select
                options={[
                  { label: 'CLP', value: 'CLP' },
                  { label: 'UF', value: 'UF' }
                ]}
                value={newSeguroMoneda}
                onChange={(value) => setNewSeguroMoneda(value)}
                className="w-[100px]"
              />
              <Button variant="primary" onClick={handleAddSeguro}>
                Agregar
              </Button>
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Nombre</th>
                        <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Año</th>
                        <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Monto Mensual</th>
                        <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Moneda</th>
                        <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segurosUnicos.map((seguro: any) => (
                        <tr key={`${seguro.nombre}_${seguro.anio}`} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-semibold">{seguro.nombre}</td>
                          <td className="px-3 py-3 text-center tabular-nums">{seguro.anio}</td>
                          <td className="px-3 py-3 text-right font-semibold text-green-700 tabular-nums">
                            {seguro.monto.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-blue-600">
                            {seguro.moneda}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteSeguro(seguro.nombre, parseInt(seguro.anio))}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
            {seguros.length === 0 && (
              <p className="text-slate-400 text-center py-4 text-sm">
                Sin seguros registrados
              </p>
            )}
          </Card>
        </div>

        {/* E) Tabla Presupuesto del Año */}
        {payments.length > 0 ? (
          <Card>
            <h3 className="text-base font-semibold text-navy-dark mb-4">Presupuesto {anioProyectado}</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Mes</th>
                    <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Fecha</th>
                    <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">N° Div</th>
                    <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Cuota UF</th>
                    <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Cuota CLP</th>
                    <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Seguro CLP</th>
                    <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b-2 border-slate-200">Total CLP</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuestoAnual.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="px-3 py-3">{row.mes}</td>
                      {row.sinDato ? (
                        <>
                          <td colSpan={4} className="px-3 py-3 text-center text-slate-400 italic">
                            Sin cuota para este mes
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {row.seguroClp > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                ${Math.round(row.seguroClp).toLocaleString('es-CL')}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {row.totalClp > 0 ? (
                              <span className="font-semibold text-green-700">
                                ${Math.round(row.totalClp).toLocaleString('es-CL')}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-3 text-center">{row.fechaVencimiento}</td>
                          <td className="px-3 py-3 text-center font-semibold tabular-nums">{row.numDiv}</td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {row.cuotaUf?.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-3 text-right text-blue-600 font-semibold tabular-nums">
                            ${Math.round(row.cuotaClp || 0).toLocaleString('es-CL')}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {row.seguroClp > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                ${Math.round(row.seguroClp).toLocaleString('es-CL')}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold text-green-700 bg-green-50 tabular-nums">
                            ${Math.round(row.totalClp).toLocaleString('es-CL')}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <h3 className="text-slate-400 mb-4 text-base font-semibold">Sin tabla cargada</h3>
            <p className="text-slate-500 text-sm">
              Importa un archivo CSV para visualizar el presupuesto anual.
            </p>
          </Card>
        )}

        {/* F) Totales */}
        {payments.length > 0 && (
          <Card>
            <h3 className="text-base font-semibold text-navy-dark mb-4">Totales Anuales {anioProyectado}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-widest mb-2">Total Cuotas CLP</div>
                <div className="text-2xl font-bold text-blue-600 tabular-nums">
                  ${Math.round(totalCuotasClp).toLocaleString('es-CL')}
                </div>
              </div>
              <div className="p-5 bg-orange-50 rounded-2xl border-2 border-orange-200">
                <div className="text-[11px] font-bold text-orange-900 uppercase tracking-widest mb-2">Total Seguros CLP</div>
                <div className="text-2xl font-bold text-orange-600 tabular-nums">
                  ${Math.round(totalSegurosClp).toLocaleString('es-CL')}
                </div>
              </div>
              <div className="p-5 bg-green-50 rounded-2xl border-2 border-green-200">
                <div className="text-[11px] font-bold text-green-900 uppercase tracking-widest mb-2">Total Anual CLP</div>
                <div className="text-2xl font-bold text-green-700 tabular-nums">
                  ${Math.round(totalAnualClp).toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
