import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { Panel, Input, InputNumber, SelectPicker, Button, DatePicker } from 'rsuite';

export interface ObligacionFormData {
  nombre: string;
  tipo: 'consumo' | 'seguro';
  moneda: 'CLP' | 'UF';
  monto: number;
  cuotas: number;
  mesInicio: number;
  anioInicio: number;
  mesFin?: number;
  anioFin?: number;
}

interface Props {
  onPreview: (data: ObligacionFormData) => void;
}

const tipoData = [
  { label: '💳 Consumo', value: 'consumo' },
  { label: '🛡️ Seguro', value: 'seguro' }
];

const monedaData = [
  { label: '💵 CLP (Pesos chilenos)', value: 'CLP' },
  { label: '📈 UF (Unidad de Fomento)', value: 'UF' }
];

const ObligacionForm: FC<Props> = ({ onPreview }) => {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<ObligacionFormData>({
    nombre: '',
    tipo: 'consumo',
    moneda: 'CLP',
    monto: 0,
    cuotas: 1,
    mesInicio: 1,
    anioInicio: currentYear,
  });

  // Helper para convertir mes/año a Date y viceversa
  const mesAnioToDate = (mes: number, anio: number): Date => {
    return new Date(anio, mes - 1, 1);
  };

  const dateToMesAnio = (date: Date): { mes: number; anio: number } => {
    return {
      mes: date.getMonth() + 1,
      anio: date.getFullYear()
    };
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onPreview(form);
  };

  return (
    <Panel bordered header="➕ Agregar Obligación" style={{ marginBottom: '1.5rem' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <label className="stat-label">
            Nombre de la obligación
            <Input
              name="nombre"
              value={form.nombre}
              onChange={(value) => setForm(f => ({ ...f, nombre: value }))}
              required
              placeholder="Ej: Crédito hipotecario"
              style={{ marginTop: '0.5rem' }}
            />
          </label>
          <label className="stat-label">
            Tipo de obligación
            <SelectPicker
              data={tipoData}
              value={form.tipo}
              onChange={(value) => setForm(f => ({ ...f, tipo: value as 'consumo' | 'seguro' || 'consumo' }))}
              cleanable={false}
              searchable={false}
              block
              style={{ marginTop: '0.5rem' }}
            />
          </label>
          <label className="stat-label">
            Moneda
            <SelectPicker
              data={monedaData}
              value={form.moneda}
              onChange={(value) => setForm(f => ({ ...f, moneda: value as 'CLP' | 'UF' || 'CLP' }))}
              cleanable={false}
              searchable={false}
              block
              style={{ marginTop: '0.5rem' }}
            />
          </label>
          <label className="stat-label">
            Monto de la cuota
            <InputNumber
              name="monto"
              value={form.monto}
              onChange={(value) => setForm(f => ({ ...f, monto: Number(value) || 0 }))}
              required
              placeholder="0"
              prefix={form.moneda === 'CLP' ? '$' : 'UF'}
              step={form.moneda === 'CLP' ? 1000 : 0.01}
              min={0}
              style={{ marginTop: '0.5rem' }}
            />
          </label>
          <label className="stat-label">
            Cantidad total de cuotas
            <InputNumber
              name="cuotas"
              value={form.cuotas}
              onChange={(value) => setForm(f => ({ ...f, cuotas: Number(value) || 1 }))}
              required
              placeholder="1"
              min={1}
              max={999}
              step={1}
              style={{ marginTop: '0.5rem' }}
            />
          </label>
          <label className="stat-label">
            Mes/Año de inicio
            <DatePicker
              format="yyyy-MM"
              value={mesAnioToDate(form.mesInicio, form.anioInicio)}
              onChange={(value) => {
                if (value) {
                  const { mes, anio } = dateToMesAnio(value);
                  setForm(f => ({ ...f, mesInicio: mes, anioInicio: anio }));
                }
              }}
              block
              style={{ marginTop: '0.5rem' }}
            />
          </label>
        </div>
        <Button type="submit" appearance="primary" style={{ marginTop: '1.5rem', width: '100%', fontSize: '1rem' }}>
          🔍 Ver Vista Previa
        </Button>
      </form>
    </Panel>
  );
};

export default ObligacionForm;
