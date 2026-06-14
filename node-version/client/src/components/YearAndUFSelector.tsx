import type { FC } from 'react';
import { Panel, InputNumber, SelectPicker } from 'rsuite';

interface YearAndUFProps {
  year: number;
  setYear: (year: number) => void;
  uf: number;
  setUf: (uf: number) => void;
  ufVariation: number;
  setUfVariation: (variation: number) => void;
}

const yearData = [2025, 2026, 2027, 2028].map(y => ({ label: y.toString(), value: y }));

const YearAndUFSelector: FC<YearAndUFProps> = ({ year, setYear, uf, setUf, ufVariation, setUfVariation }) => {
  return (
    <Panel bordered header="📊 Supuestos Anuales" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <label className="stat-label">Año a proyectar</label>
          <SelectPicker
            data={yearData}
            value={year}
            onChange={(value) => setYear(value || 2025)}
            cleanable={false}
            searchable={false}
            placeholder="Seleccionar año"
            style={{ marginTop: '0.5rem', width: '100%' }}
          />
        </div>
        <div>
          <label className="stat-label">Valor UF base (CLP)</label>
          <InputNumber
            prefix="$"
            value={uf}
            onChange={(value) => setUf(Number(value) || 0)}
            step={0.01}
            min={0}
            style={{ marginTop: '0.5rem', width: '100%' }}
          />
        </div>
        <div>
          <label className="stat-label">Variación anual UF</label>
          <InputNumber
            postfix="%"
            value={ufVariation}
            onChange={(value) => setUfVariation(Number(value) || 0)}
            step={0.01}
            style={{ marginTop: '0.5rem', width: '100%' }}
          />
        </div>
      </div>
    </Panel>
  );
};

export default YearAndUFSelector;
