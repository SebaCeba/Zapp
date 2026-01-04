import React, { useState } from 'react';

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

const ObligacionForm: React.FC<Props> = ({ onPreview }) => {
  const [form, setForm] = useState<ObligacionFormData>({
    nombre: '',
    tipo: 'consumo',
    moneda: 'CLP',
    monto: 0,
    cuotas: 1,
    mesInicio: 1,
    anioInicio: new Date().getFullYear(),
  });

  const [montoInput, setMontoInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'monto' || name === 'cuotas' || name.startsWith('mes') || name.startsWith('anio') ? Number(value) : value }));
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setMontoInput(value);
    
    const normalizedValue = value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (!isNaN(numValue)) {
      setForm(f => ({ ...f, monto: numValue }));
    } else if (normalizedValue === '' || normalizedValue === '-') {
      setForm(f => ({ ...f, monto: 0 }));
    }
  };

  return (
    <form className="card" onSubmit={e => { e.preventDefault(); onPreview(form); }} style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>➕ Agregar Obligación</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <label className="stat-label">
          Nombre de la obligación
          <input className="input" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Crédito hipotecario" style={{ marginTop: '0.5rem' }} />
        </label>
        <label className="stat-label">
          Tipo de obligación
          <select className="select" name="tipo" value={form.tipo} onChange={handleChange} style={{ marginTop: '0.5rem' }}>
            <option value="consumo">💳 Consumo</option>
            <option value="seguro">🛡️ Seguro</option>
          </select>
        </label>
        <label className="stat-label">
          Moneda
          <select className="select" name="moneda" value={form.moneda} onChange={handleChange} style={{ marginTop: '0.5rem' }}>
            <option value="CLP">💵 CLP (Pesos chilenos)</option>
            <option value="UF">📈 UF (Unidad de Fomento)</option>
          </select>
        </label>
        <label className="stat-label">
          Monto de la cuota
          <input 
            className="input" 
            name="monto" 
            type="text" 
            value={montoInput} 
            onChange={handleMontoChange}
            onBlur={(e) => {
              const value = e.target.value.replace(',', '.');
              const numValue = parseFloat(value);
              if (isNaN(numValue) || value === '') {
                setForm(f => ({ ...f, monto: 0 }));
                setMontoInput('');
              } else {
                setMontoInput(numValue.toString().replace('.', ','));
              }
            }}
            required 
            placeholder="0,00" 
            style={{ marginTop: '0.5rem' }} 
          />
        </label>
        <label className="stat-label">
          Cantidad total de cuotas
          <input 
            className="input" 
            name="cuotas" 
            type="text" 
            value={form.cuotas === 1 ? '' : form.cuotas} 
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value === '') {
                setForm(f => ({ ...f, cuotas: 1 }));
              } else if (!isNaN(parseInt(value))) {
                setForm(f => ({ ...f, cuotas: parseInt(value) }));
              }
            }}
            required 
            placeholder="1" 
            style={{ marginTop: '0.5rem' }} 
          />
        </label>
        <label className="stat-label">
          Mes/Año de inicio
          <input
            className="input"
            name="mesAnioInicio"
            type="month"
            value={`${form.anioInicio.toString().padStart(4, '0')}-${form.mesInicio.toString().padStart(2, '0')}`}
            onChange={e => {
              const [anio, mes] = e.target.value.split('-').map(Number);
              setForm(f => ({ ...f, mesInicio: mes, anioInicio: anio }));
            }}
            required
            style={{ marginTop: '0.5rem' }}
          />
        </label>
      </div>
      <button type="submit" className="btn" style={{ marginTop: '1.5rem', width: '100%', fontSize: '1rem' }}>🔍 Ver Vista Previa</button>
    </form>
  );
};

export default ObligacionForm;
