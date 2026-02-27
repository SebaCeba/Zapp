import { SelectPicker, Stack } from 'rsuite';

interface YearMonthPickerProps {
  year: number;
  month: number;
  onChangeYear: (year: number) => void;
  onChangeMonth: (month: number) => void;
  minYear?: number;
  maxYear?: number;
}

const MESES = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 }
];

export default function YearMonthPicker({
  year,
  month,
  onChangeYear,
  onChangeMonth,
  minYear = 2020,
  maxYear = 2030
}: YearMonthPickerProps) {
  
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => {
      const val = minYear + i;
      return { label: val.toString(), value: val };
    }
  );

  return (
    <Stack spacing={10}>
      <SelectPicker
        data={years}
        value={year}
        onChange={val => val && onChangeYear(val)}
        cleanable={false}
        searchable={false}
        style={{ width: 100 }}
      />
      <SelectPicker
        data={MESES}
        value={month}
        onChange={val => val && onChangeMonth(val)}
        cleanable={false}
        searchable={false}
        style={{ width: 140 }}
      />
    </Stack>
  );
}
