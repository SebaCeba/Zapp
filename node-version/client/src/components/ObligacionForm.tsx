import { useState } from 'react';
import { Card } from './primitives';
import { Input } from './primitives';
import { Select } from './primitives';
import { Button } from './primitives';

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

const tipoOptions = [
  { label: 'Consumo', value: 'consumo' },
  { label: 'Seguro', value: 'seguro' }
];

const monedaOptions = [
  { label: 'CLP (Pesos chilenos)', value: 'CLP' },
  { label: 'UF (Unidad de Fomento)', value: 'UF' }
];

const ObligacionForm: React.FC<Props> = ({ onPreview }) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreview(form);
  };

  // Formatear el valor del input type="month" (YYYY-MM)
  const getMonthValue = () => {
    const mes = form.mesInicio.toString().padStart(2, '0');
    return `${form.anioInicio}-${mes}`;
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [anio, mes] = e.target.value.split('-');
    setForm(f => ({ 
      ...f, 
      mesInicio: Number(mes), 
      anioInicio: Number(anio) 
    }));
  };

  return (
    <Card>
      <h3 className="text-base font-semibold text-navy-dark mb-4">Agregar Obligación</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            type="text"
            label="Nombre de la obligación"
            value={form.nombre}
            onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
            required
            placeholder="Ej: Crédito hipotecario"
          />
          <Select
            label="Tipo de obligación"
            options={tipoOptions}
            value={form.tipo}
            onChange={(value) => setForm(f => ({ ...f, tipo: value as 'consumo' | 'seguro' }))}
          />
          <Select
            label="Moneda"
            options={monedaOptions}
            value={form.moneda}
            onChange={(value) => setForm(f => ({ ...f, moneda: value as 'CLP' | 'UF' }))}
          />
          <Input
            type="number"
            label={`Monto de la cuota (${form.moneda})`}
            value={form.monto}
            onChange={(e) => setForm(f => ({ ...f, monto: Number(e.target.value) || 0 }))}
            required
            placeholder="0"
            step={form.moneda === 'CLP' ? 1000 : 0.01}
            min={0}
          />
          <Input
            type="number"
            label="Cantidad total de cuotas"
            value={form.cuotas}
            onChange={(e) => setForm(f => ({ ...f, cuotas: Number(e.target.value) || 1 }))}
            required
            placeholder="1"
            min={1}
            max={999}
            step={1}
          />
          <Input
            type="month"
            label="Mes/Año de inicio"
            value={getMonthValue()}
            onChange={handleMonthChange}
            required
          />
        </div>
        <Button type="submit" fullWidth>
          Ver Vista Previa
        </Button>
      </form>
    </Card>
  );
};

export default ObligacionForm;
