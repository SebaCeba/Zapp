import { Card } from './primitives';
import { Button } from './primitives';
import { ObligacionFormData } from './ObligacionForm';

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

function clp(amount: number): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount);
}

const VistaPreviaObligacion: React.FC<Props> = ({ data, year, uf, ufVariation, onBack, onSave }) => {
  const { mensualCLP, totalAnual, promedioMensual, cuotas } = calcularProyeccion(data, year, uf, ufVariation);
  const mesesNombre = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-navy-dark">Vista Previa del Impacto Anual</h3>
          <p className="text-sm text-slate-500 mt-1">{data.nombre} - {year}</p>
        </div>
      </div>
      
      {/* Resumen de datos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container/30 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tipo</div>
          <div className="font-semibold text-navy-dark">{data.tipo}</div>
        </div>
        <div className="bg-surface-container/30 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Moneda</div>
          <div className="font-semibold text-navy-dark">{data.moneda}</div>
        </div>
        <div className="bg-surface-container/30 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Cuota</div>
          <div className="font-semibold text-navy-dark">{data.monto.toLocaleString('es-CL')} {data.moneda}</div>
        </div>
        <div className="bg-surface-container/30 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cuotas en {year}</div>
          <div className="font-semibold text-navy-dark">{cuotas.length} de {data.cuotas}</div>
        </div>
      </div>

      {/* Tabla mensual */}
      <div className="overflow-x-auto mb-6 bg-surface-container/20 rounded-xl p-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className="text-left py-2 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mes</th>
              {mesesNombre.map((mes) => (
                <th key={mes} className="text-center px-2 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 pr-4 font-medium text-navy-dark">Monto CLP</td>
              {mensualCLP.map((monto, index) => (
                <td key={index} className={`text-center px-2 py-3 tabular-nums ${
                  monto > 0 ? 'font-bold text-primary' : 'text-slate-300'
                }`}>
                  {monto > 0 ? `$${Math.round(monto).toLocaleString('es-CL')}` : '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-6">
          <div className="text-xs opacity-80 uppercase tracking-widest mb-2">Total Anual</div>
          <div className="text-3xl font-bold tabular-nums">{clp(totalAnual)}</div>
        </div>
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-xl p-6">
          <div className="text-xs opacity-80 uppercase tracking-widest mb-2">Promedio Mensual</div>
          <div className="text-3xl font-bold tabular-nums">{clp(promedioMensual)}</div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onBack} fullWidth>
          Volver
        </Button>
        <Button onClick={onSave} fullWidth>
          Guardar Obligación
        </Button>
      </div>
    </Card>
  );
};

export default VistaPreviaObligacion;
