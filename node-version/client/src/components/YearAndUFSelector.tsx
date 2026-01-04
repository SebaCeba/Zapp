import React, { useState } from 'react';

interface YearAndUFProps {
  year: number;
  setYear: (year: number) => void;
  uf: number;
  setUf: (uf: number) => void;
  ufVariation: number;
  setUfVariation: (variation: number) => void;
}

const YearAndUFSelector: React.FC<YearAndUFProps> = ({ year, setYear, uf, setUf, ufVariation, setUfVariation }) => {
  const [inputValue, setInputValue] = useState(ufVariation.toString().replace('.', ','));

  const handleUfVariationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setInputValue(value);
    
    // Convertir coma a punto para parseFloat
    const normalizedValue = value.replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (!isNaN(numValue)) {
      setUfVariation(numValue);
    } else if (normalizedValue === '' || normalizedValue === '-') {
      setUfVariation(0);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ marginBottom: '1rem', color: '#2d7a2d' }}>📊 Supuestos Anuales</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <label className="stat-label">
          Año a proyectar
          <select className="select" value={year} onChange={e => setYear(Number(e.target.value))} style={{ marginTop: '0.5rem' }}>
            {[2025, 2026, 2027, 2028].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="stat-label">
          Valor UF base (CLP)
          <input 
            className="input" 
            type="number" 
            value={uf} 
            onChange={e => setUf(Number(e.target.value))} 
            step="0.01" 
            style={{ 
              marginTop: '0.5rem',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              appearance: 'none'
            }} 
          />
        </label>
        <label className="stat-label">
          Variación anual UF
          <div style={{ position: 'relative', marginTop: '0.5rem' }}>
            <input 
              className="input" 
              type="text" 
              value={inputValue}
              onChange={handleUfVariationChange}
              onBlur={(e) => {
                // Al perder el foco, asegurar que sea un número válido y actualizar la visualización
                const value = e.target.value.replace(',', '.');
                const numValue = parseFloat(value);
                if (isNaN(numValue) || value === '') {
                  setUfVariation(0);
                  setInputValue('0');
                } else {
                  setInputValue(numValue.toString().replace('.', ','));
                }
              }}
              style={{ 
                paddingRight: '2.5rem'
              }} 
            />
            <span style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              pointerEvents: 'none',
              fontWeight: 'bold'
            }}>%</span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default YearAndUFSelector;
