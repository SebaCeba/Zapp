import { Card } from './primitives';
import { Input } from './primitives';
import { Select } from './primitives';

interface YearAndUFProps {
  year: number;
  setYear: (year: number) => void;
  uf: number;
  setUf: (uf: number) => void;
  ufVariation: number;
  setUfVariation: (variation: number) => void;
}

const yearOptions = [2025, 2026, 2027, 2028].map(y => ({ label: y.toString(), value: y }));

const YearAndUFSelector: React.FC<YearAndUFProps> = ({ year, setYear, uf, setUf, ufVariation, setUfVariation }) => {
  return (
    <Card>
      <h3 className="text-base font-semibold text-navy-dark mb-4">Supuestos Anuales</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Año a proyectar"
          options={yearOptions}
          value={year}
          onChange={(value) => setYear(Number(value) || 2025)}
        />
        <Input
          type="number"
          label="Valor UF base (CLP)"
          value={uf}
          onChange={(e) => setUf(Number(e.target.value) || 0)}
          step={0.01}
          min={0}
          placeholder="37500"
        />
        <Input
          type="number"
          label="Variación anual UF (%)"
          value={ufVariation}
          onChange={(e) => setUfVariation(Number(e.target.value) || 0)}
          step={0.01}
          placeholder="3.5"
        />
      </div>
    </Card>
  );
};

export default YearAndUFSelector;
