import { useState, useEffect } from 'react';
import { SelectPicker } from 'rsuite';
import MainLayout from '../layout/MainLayout';import PageTitleSection from '../layout/PageTitleSection';
interface ResumenMensual {
  mes: string;
  ingresos: number;
  suscripciones: number;
  creditos: number;
  hipotecario: number;
  serviciosBasicos: number;
  supermercado: number;
  ahorros: number;
  total: number;
  balance: number;
}

interface DetalleIngreso {
  nombre: string;
  valores: number[];
}

interface DetalleServicio {
  nombre: string;
  valores: number[];
}

interface DetalleHipotecario {
  nombre: string;
  valores: number[];
}

interface DetalleSuscripcion {
  nombre: string;
  valores: number[];
}

interface DetalleObligacion {
  nombre: string;
  valores: number[];
}

interface DetalleSupermercado {
  valores: number[];
}

interface DetalleAhorros {
  nombre: string;
  valores: number[];
}

const Presupuesto: React.FC = () => {
  const [anioActual] = useState(new Date().getFullYear());
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [resumen, setResumen] = useState<ResumenMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [gastosExpanded, setGastosExpanded] = useState(true);
  
  // Detalles por categoría
  const [detalleIngresos, setDetalleIngresos] = useState<DetalleIngreso[]>([]);
  const [detalleServicios, setDetalleServicios] = useState<DetalleServicio[]>([]);
  const [detalleHipotecario, setDetalleHipotecario] = useState<DetalleHipotecario[]>([]);
  const [detalleSuscripciones, setDetalleSuscripciones] = useState<DetalleSuscripcion[]>([]);
  const [detalleObligaciones, setDetalleObligaciones] = useState<DetalleObligacion[]>([]);
  const [detalleSupermercado, setDetalleSupermercado] = useState<DetalleSupermercado | null>(null);
  const [detalleAhorros, setDetalleAhorros] = useState<DetalleAhorros[]>([]);

  const aniosDisponibles = Array.from(
    { length: 11 },
    (_, i) => anioActual - 5 + i
  );

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const MESES_KEYS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  useEffect(() => {
    cargarResumen();
  }, [anioSeleccionado]);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      
      // Cargar datos de todas las fuentes
      const [ingresosRes, serviciosRes, bonosRes, subscriptionsRes, obligacionesRes, paymentsRes, segurosRes, supuestoRes, supermercadoRes, ahorrosRes] = await Promise.all([
        fetch(`http://localhost:3000/api/ingresos/presupuesto/${anioSeleccionado}`),
        fetch(`http://localhost:3000/api/servicios-basicos/presupuesto/${anioSeleccionado}`),
        fetch(`http://localhost:3000/api/ingresos/bonos/${anioSeleccionado}`),
        fetch(`http://localhost:3000/api/subscriptions/`),
        fetch(`http://localhost:3000/api/obligaciones/`),
        fetch(`http://localhost:3000/api/hipotecario/payments`),
        fetch(`http://localhost:3000/api/hipotecario/seguros`),
        fetch(`http://localhost:3000/api/obligaciones/supuestos/${anioSeleccionado}`),
        fetch(`http://localhost:3000/api/supermercado/presupuesto/${anioSeleccionado}`),
        fetch(`http://localhost:3000/api/ahorros/presupuesto/${anioSeleccionado}`)
      ]);

      const ingresosData = await ingresosRes.json();
      const serviciosData = await serviciosRes.json();
      const bonosData = await bonosRes.json();
      const subscriptionsData = await subscriptionsRes.json();
      const obligacionesData = await obligacionesRes.json();
      const paymentsData = await paymentsRes.json();
      const segurosData = await segurosRes.json();
      const supuestoData = await supuestoRes.json();
      const supermercadoData = await supermercadoRes.json();
      const ahorrosData = await ahorrosRes.json();
      
      const valorUF = supuestoData.valorUfBase || 37000;

      // Preparar detalles de ingresos
      const detallesIngs: DetalleIngreso[] = ingresosData.map((ingreso: any) => {
        const presupuesto = ingreso.presupuestos?.[0];
        return {
          nombre: ingreso.nombre,
          valores: MESES_KEYS.map(mes => presupuesto?.[mes] || 0)
        };
      });

      // Agregar bonos al detalle
      const valoresBonos = MESES_KEYS.map((_, idx) => {
        let total = 0;
        const mesNum = idx + 1;
        
        bonosData.forEach((bono: any) => {
          if (bono.mes === mesNum) {
            total += bono.monto;
          }
          
          bono.repartos?.forEach((reparto: any) => {
            if (reparto.destino === 'apoyo_mensual' && reparto.mesesDistribucion) {
              const distribucion = reparto.monto / reparto.mesesDistribucion;
              for (let i = 0; i < reparto.mesesDistribucion; i++) {
                const mesDistribucion = ((bono.mes + i - 1) % 12) + 1;
                if (mesDistribucion === mesNum) {
                  total += distribucion;
                }
              }
            }
          });
        });
        
        return total;
      });

      if (valoresBonos.some(v => v > 0)) {
        detallesIngs.push({
          nombre: 'Bonos + Apoyo Mensual',
          valores: valoresBonos
        });
      }

      setDetalleIngresos(detallesIngs);

      // Preparar detalles de servicios
      const detallesServs: DetalleServicio[] = serviciosData.map((servicio: any) => {
        const presupuesto = servicio.presupuestos?.[0] || {};
        return {
          nombre: servicio.nombre,
          valores: MESES_KEYS.map(mes => Number(presupuesto[mes]) || 0)
        };
      });

      setDetalleServicios(detallesServs);

      // Preparar detalles de hipotecario
      const detallesHipo: DetalleHipotecario[] = [];
      
      // Cuotas hipotecarias por mes
      const valoresCuotas = MESES_KEYS.map((_, idx) => {
        let total = 0;
        const mesNum = idx + 1;
        paymentsData.forEach((payment: any) => {
          const fechaVencimiento = new Date(payment.fechaVencimiento);
          if (fechaVencimiento.getFullYear() === anioSeleccionado && 
              fechaVencimiento.getMonth() + 1 === mesNum) {
            total += payment.totalDivUf * valorUF;
          }
        });
        return total;
      });

      // Seguros por mes (convertir UF a CLP)
      const valoresSeguros = MESES_KEYS.map((_, idx) => {
        let total = 0;
        const mesNum = idx + 1;
        const mesAnio = `${anioSeleccionado}-${mesNum.toString().padStart(2, '0')}`;
        segurosData.forEach((seguro: any) => {
          if (seguro.mesAnio === mesAnio) {
            const montoSeguro = seguro.moneda === 'UF' ? seguro.monto * valorUF : seguro.monto;
            total += montoSeguro;
          }
        });
        return total;
      });

      if (valoresCuotas.some(v => v > 0)) {
        detallesHipo.push({
          nombre: 'Cuota Hipotecaria',
          valores: valoresCuotas
        });
      }

      if (valoresSeguros.some(v => v > 0)) {
        detallesHipo.push({
          nombre: 'Seguros',
          valores: valoresSeguros
        });
      }

      setDetalleHipotecario(detallesHipo);

      // Preparar detalles de suscripciones
      const detallesSubs: DetalleSuscripcion[] = subscriptionsData.map((sub: any) => {
        const valoresMensuales = MESES_KEYS.map((_, idx) => {
          const mes = idx + 1;
          const startDate = new Date(sub.startDate);
          
          // Último día del mes que estamos evaluando
          const yearEnd = new Date(anioSeleccionado, mes, 0); // Día 0 del mes siguiente = último día del mes actual
          
          // Si la suscripción empieza DESPUÉS del mes que evaluamos, no aplica
          if (startDate > yearEnd) return 0;
          
          const monthsDiff = (anioSeleccionado - startDate.getFullYear()) * 12 + (mes - 1 - startDate.getMonth());
          
          let applies = false;
          switch (sub.periodicity) {
            case 'monthly':
              applies = monthsDiff >= 0;
              break;
            case 'quarterly':
              applies = monthsDiff >= 0 && monthsDiff % 3 === 0;
              break;
            case 'semiannual':
              applies = monthsDiff >= 0 && monthsDiff % 6 === 0;
              break;
            case 'annual':
              applies = monthsDiff >= 0 && monthsDiff % 12 === 0;
              break;
            case 'weekly':
              applies = monthsDiff >= 0;
              break;
          }
          
          return applies ? sub.price : 0;
        });

        return {
          nombre: sub.name,
          valores: valoresMensuales
        };
      });

      setDetalleSuscripciones(detallesSubs);

      // Preparar detalles de obligaciones (créditos + seguros)
      const detallesOblig: DetalleObligacion[] = [];
      
      // Créditos (convertir UF a CLP si es necesario)
      obligacionesData.forEach((obl: any) => {
        const valoresMensuales = MESES_KEYS.map((_, idx) => {
          const mes = idx + 1;
          const mesInicio = obl.mesInicio;
          const anioInicio = obl.anioInicio;
          const cuotasTotales = obl.cuotasTotales;
          
          const mesesTranscurridos = (anioSeleccionado - anioInicio) * 12 + (mes - mesInicio);
          
          if (mesesTranscurridos >= 0 && mesesTranscurridos < cuotasTotales) {
            // Convertir de UF a CLP si la moneda es UF
            return obl.moneda === 'UF' ? obl.montoCuota * valorUF : obl.montoCuota;
          }
          
          return 0;
        });
        
        if (valoresMensuales.some(v => v > 0)) {
          detallesOblig.push({
            nombre: obl.nombre,
            valores: valoresMensuales
          });
        }
      });
      
      // Seguros (convertir UF a CLP si es necesario)
      obligacionesData.forEach((obl: any) => {
        if (obl.montoSeguro && obl.montoSeguro > 0) {
          const valoresMensuales = MESES_KEYS.map((_, idx) => {
            const mes = idx + 1;
            const mesInicio = obl.mesInicio;
            const anioInicio = obl.anioInicio;
            const cuotasTotales = obl.cuotasTotales;
            
            const mesesTranscurridos = (anioSeleccionado - anioInicio) * 12 + (mes - mesInicio);
            
            if (mesesTranscurridos >= 0 && mesesTranscurridos < cuotasTotales) {
              // Convertir de UF a CLP si la moneda es UF
              return obl.moneda === 'UF' ? obl.montoSeguro * valorUF : obl.montoSeguro;
            }
            
            return 0;
          });
          
          if (valoresMensuales.some(v => v > 0)) {
            detallesOblig.push({
              nombre: `Seguro ${obl.nombre}`,
              valores: valoresMensuales
            });
          }
        }
      });
      
      setDetalleObligaciones(detallesOblig);

      // Preparar detalles de supermercado
      const valoresSupermercado = MESES_KEYS.map(mesKey => {
        return supermercadoData?.[mesKey] || 0;
      });

      setDetalleSupermercado({ valores: valoresSupermercado });

      // Preparar detalles de ahorros
      const detallesAhorro: DetalleAhorros[] = ahorrosData.map((ahorro: any) => {
        const presupuesto = ahorro.presupuestos?.[0] || {};
        return {
          nombre: ahorro.nombre,
          valores: MESES_KEYS.map(mes => Number(presupuesto[mes]) || 0)
        };
      });

      setDetalleAhorros(detallesAhorro);

      // Calcular obligaciones por mes
      const calcularObligacionesMes = (mes: number): number => {
        return obligacionesData.reduce((sum: number, obl: any) => {
          const mesInicio = obl.mesInicio;
          const anioInicio = obl.anioInicio;
          const cuotasTotales = obl.cuotasTotales;
          
          const mesesTranscurridos = (anioSeleccionado - anioInicio) * 12 + (mes - mesInicio);
          
          if (mesesTranscurridos >= 0 && mesesTranscurridos < cuotasTotales) {
            // Convertir de UF a CLP si es necesario
            const cuota = obl.moneda === 'UF' ? obl.montoCuota * valorUF : obl.montoCuota;
            const seguro = obl.montoSeguro ? (obl.moneda === 'UF' ? obl.montoSeguro * valorUF : obl.montoSeguro) : 0;
            return sum + cuota + seguro;
          }
          
          return sum;
        }, 0);
      };

      // Calcular hipotecario por mes (pagos + seguros)
      const calcularHipotecarioMes = (mes: number): number => {
        let total = 0;
        
        // Pagos del crédito hipotecario
        paymentsData.forEach((payment: any) => {
          const fechaVencimiento = new Date(payment.fechaVencimiento);
          if (fechaVencimiento.getFullYear() === anioSeleccionado && 
              fechaVencimiento.getMonth() + 1 === mes) {
            const cuotaCLP = payment.totalDivUf * valorUF;
            total += cuotaCLP;
          }
        });
        
        // Seguros (pueden estar en CLP o UF)
        const mesAnio = `${anioSeleccionado}-${mes.toString().padStart(2, '0')}`;
        segurosData.forEach((seguro: any) => {
          if (seguro.mesAnio === mesAnio) {
            const montoSeguro = seguro.moneda === 'UF' ? seguro.monto * valorUF : seguro.monto;
            total += montoSeguro;
          }
        });
        
        return total;
      };

      // Calcular resumen mensual
      const resumenMensual: ResumenMensual[] = MESES.map((mes, idx) => {
        const mesKey = MESES_KEYS[idx];
        const mesNum = idx + 1;
        
        // Calcular ingresos
        const totalIngresos = ingresosData.reduce((sum: number, ingreso: any) => {
          const presupuesto = ingreso.presupuestos?.[0];
          return sum + (presupuesto?.[mesKey] || 0);
        }, 0) + valoresBonos[idx];

        // Calcular servicios básicos
        const totalServicios = serviciosData.reduce((sum: number, servicio: any) => {
          const presupuesto = servicio.presupuestos?.[0] || {};
          return sum + (Number(presupuesto[mesKey]) || 0);
        }, 0);

        // Calcular suscripciones desde el detalle (suma de todas las suscripciones del mes)
        const totalSuscripciones = detallesSubs.reduce((sum, sub) => sum + sub.valores[idx], 0);
        const totalCreditos = calcularObligacionesMes(mesNum);
        const totalHipotecario = calcularHipotecarioMes(mesNum);
        
        // Calcular supermercado
        const totalSupermercado = valoresSupermercado[idx];

        // Calcular ahorros
        const totalAhorros = detallesAhorro.reduce((sum, ahorro) => sum + ahorro.valores[idx], 0);

        const totalEgresos = totalSuscripciones + totalCreditos + totalHipotecario + totalServicios + totalSupermercado;
        const balance = totalIngresos - totalEgresos;

        return {
          mes,
          ingresos: totalIngresos,
          suscripciones: totalSuscripciones,
          creditos: totalCreditos,
          hipotecario: totalHipotecario,
          serviciosBasicos: totalServicios,
          supermercado: totalSupermercado,
          ahorros: totalAhorros,
          total: totalEgresos,
          balance
        };
      });

      setResumen(resumenMensual);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearMonto = (monto: number): string => {
    if (monto === 0) return '$0';
    return `$${Math.round(monto).toLocaleString('es-CL')}`;
  };

  const calcularTotalAnual = (campo: keyof ResumenMensual) => {
    return resumen.reduce((sum, mes) => sum + (mes[campo] as number), 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container" style={{ textAlign: 'center', padding: '3rem' }}>
          Cargando...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container">
        <PageTitleSection
          title="Presupuesto Anual"
          description="Estado de resultados consolidado - Ingresos vs Egresos"
          actions={
            <SelectPicker
              data={aniosDisponibles.map(anio => ({ label: anio.toString(), value: anio }))}
              value={anioSeleccionado}
              onChange={(value) => setAnioSeleccionado(value || new Date().getFullYear())}
              cleanable={false}
              searchable={false}
              style={{ width: 120 }}
            />
          }
        />

        {/* Dashboard de resumen */}
        <div className="card">
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="monthly-table" style={{ minWidth: '1600px' }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: 'var(--gray-50)', zIndex: 2, minWidth: '160px' }}>
                    Concepto
                  </th>
                  {MESES.map((mes) => (
                    <th key={mes} style={{ textAlign: 'right', minWidth: 'var(--month-column-width)' }}>
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th style={{ textAlign: 'right', background: 'var(--gray-100)', minWidth: '120px' }}>
                    Total Año
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* INGRESOS */}
                <tr 
                  style={{ background: '#d1fae5', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === 'ingresos' ? null : 'ingresos')}
                >
                  <td style={{ position: 'sticky', left: 0, background: '#d1fae5', zIndex: 1 }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'ingresos' ? '▼' : '▶'}
                    </span>
                    INGRESOS
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.ingresos)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#a7f3d0', fontWeight: '700' }}>
                    {formatearMonto(calcularTotalAnual('ingresos'))}
                  </td>
                </tr>

                {/* Detalle de ingresos */}
                {expandido === 'ingresos' && detalleIngresos.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#ecfdf5' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#ecfdf5', paddingLeft: '2rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#d1fae5', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                {/* GRUPO GASTOS */}
                <tr 
                  style={{ background: '#fee2e2', fontWeight: '700', cursor: 'pointer' }}
                  onClick={() => setGastosExpanded(!gastosExpanded)}
                >
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', zIndex: 1 }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {gastosExpanded ? '▼' : '▶'}
                    </span>
                    Gastos
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.total)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca', fontWeight: '700' }}>
                    {formatearMonto(calcularTotalAnual('total'))}
                  </td>
                </tr>

                {/* EGRESOS (indentados dentro de GASTOS) */}
                {gastosExpanded && <>
                <tr style={{ background: '#fee2e2', cursor: 'pointer' }}
                    onClick={() => setExpandido(expandido === 'suscripciones' ? null : 'suscripciones')}>
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', fontWeight: '500', zIndex: 1, paddingLeft: '2rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'suscripciones' ? '▼' : '▶'}
                    </span>
                    Suscripciones
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.suscripciones)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca' }}>
                    {formatearMonto(calcularTotalAnual('suscripciones'))}
                  </td>
                </tr>

                {/* Detalle de suscripciones */}
                {expandido === 'suscripciones' && detalleSuscripciones.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#fef2f2' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fef2f2', paddingLeft: '3.5rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#fee2e2', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                <tr style={{ background: '#fee2e2', cursor: 'pointer' }}
                    onClick={() => setExpandido(expandido === 'creditos' ? null : 'creditos')}>
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', fontWeight: '500', zIndex: 1, paddingLeft: '2rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'creditos' ? '▼' : '▶'}
                    </span>
                    Créditos y Seguros
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.creditos)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca' }}>
                    {formatearMonto(calcularTotalAnual('creditos'))}
                  </td>
                </tr>

                {/* Detalle de obligaciones (créditos + seguros) */}
                {expandido === 'creditos' && detalleObligaciones.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#fef2f2' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fef2f2', paddingLeft: '3.5rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#fee2e2', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                <tr style={{ background: '#fee2e2', cursor: 'pointer' }}
                    onClick={() => setExpandido(expandido === 'hipotecario' ? null : 'hipotecario')}>
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', fontWeight: '500', zIndex: 1, paddingLeft: '2rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'hipotecario' ? '▼' : '▶'}
                    </span>
                    Hipotecario
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.hipotecario)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca' }}>
                    {formatearMonto(calcularTotalAnual('hipotecario'))}
                  </td>
                </tr>

                {/* Detalle de hipotecario */}
                {expandido === 'hipotecario' && detalleHipotecario.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#fef2f2' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fef2f2', paddingLeft: '3.5rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#fee2e2', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                <tr 
                  style={{ background: '#fee2e2', cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === 'servicios' ? null : 'servicios')}
                >
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', fontWeight: '500', zIndex: 1, paddingLeft: '2rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'servicios' ? '▼' : '▶'}
                    </span>
                    Servicios Básicos
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.serviciosBasicos)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca' }}>
                    {formatearMonto(calcularTotalAnual('serviciosBasicos'))}
                  </td>
                </tr>

                {/* Detalle de servicios */}
                {expandido === 'servicios' && detalleServicios.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#fef2f2' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fef2f2', paddingLeft: '3.5rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#fee2e2', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                {/* SUPERMERCADO */}
                <tr 
                  style={{ background: '#fee2e2', cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === 'supermercado' ? null : 'supermercado')}
                >
                  <td style={{ position: 'sticky', left: 0, background: '#fee2e2', fontWeight: '500', zIndex: 1, paddingLeft: '2rem' }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'supermercado' ? '▼' : '▶'}
                    </span>
                    Supermercado
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.supermercado)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#fecaca' }}>
                    {formatearMonto(calcularTotalAnual('supermercado'))}
                  </td>
                </tr>

                {/* Detalle de supermercado */}
                {expandido === 'supermercado' && detalleSupermercado && (
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#fef2f2', paddingLeft: '3.5rem', fontSize: '0.875rem', zIndex: 1 }}>
                      Compras
                    </td>
                    {detalleSupermercado.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#fee2e2', fontSize: '0.875rem' }}>
                      {formatearMonto(detalleSupermercado.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                )}

                <tr style={{ background: '#fca5a5', fontWeight: '600' }}>
                  <td style={{ position: 'sticky', left: 0, background: '#fca5a5', zIndex: 1, paddingLeft: '2rem' }}>
                    Total Egresos
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.total)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#f87171', fontWeight: '700' }}>
                    {formatearMonto(calcularTotalAnual('total'))}
                  </td>
                </tr>
                </> /* Fin de gastosExpanded */}

                {/* AHORROS */}
                <tr 
                  style={{ background: '#dbeafe', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === 'ahorros' ? null : 'ahorros')}
                >
                  <td style={{ position: 'sticky', left: 0, background: '#dbeafe', zIndex: 1 }}>
                    <span style={{ marginRight: '0.5rem' }}>
                      {expandido === 'ahorros' ? '▼' : '▶'}
                    </span>
                    Ahorros
                  </td>
                  {resumen.map((mes) => (
                    <td key={mes.mes} style={{ textAlign: 'right' }}>
                      {formatearMonto(mes.ahorros)}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', background: '#93c5fd', fontWeight: '700' }}>
                    {formatearMonto(calcularTotalAnual('ahorros'))}
                  </td>
                </tr>

                {/* Detalle de ahorros */}
                {expandido === 'ahorros' && detalleAhorros.map((detalle, idx) => (
                  <tr key={idx} style={{ background: '#eff6ff' }}>
                    <td style={{ position: 'sticky', left: 0, background: '#eff6ff', paddingLeft: '2rem', fontSize: '0.875rem', zIndex: 1 }}>
                      {detalle.nombre}
                    </td>
                    {detalle.valores.map((valor, mesIdx) => (
                      <td key={mesIdx} style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                        {formatearMonto(valor)}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', background: '#dbeafe', fontSize: '0.875rem' }}>
                      {formatearMonto(detalle.valores.reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}

                {/* BALANCE */}
                <tr style={{ background: '#dbeafe', fontWeight: '600', fontSize: '1.125rem' }}>
                  <td style={{ position: 'sticky', left: 0, background: '#dbeafe', zIndex: 1 }}>
                    BALANCE
                  </td>
                  {resumen.map((mes) => (
                    <td 
                      key={mes.mes} 
                      style={{ 
                        textAlign: 'right',
                        color: mes.balance >= 0 ? '#16a34a' : '#dc2626'
                      }}
                    >
                      {formatearMonto(mes.balance)}
                    </td>
                  ))}
                  <td 
                    style={{ 
                      textAlign: 'right', 
                      background: '#93c5fd', 
                      fontWeight: '700',
                      color: calcularTotalAnual('balance') >= 0 ? '#16a34a' : '#dc2626'
                    }}
                  >
                    {formatearMonto(calcularTotalAnual('balance'))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="card" style={{ marginTop: '1.5rem', background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ margin: 0, color: '#78350f', fontSize: '0.875rem' }}>
            <strong>ℹ️ Nota:</strong> Este resumen consolida los datos de los módulos de Ingresos, Suscripciones, 
            Créditos, Hipotecario y Servicios Básicos. Actualiza cada módulo para ver reflejados los cambios aquí.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Presupuesto;
