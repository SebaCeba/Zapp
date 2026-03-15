import { useState, useRef } from 'react';
import { Popover, Whisper, Button } from 'rsuite';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PayPeriodPickerProps {
  value: { payYear: number; payMonth: number } | string | null;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function PayPeriodPicker({ 
  value, 
  onChange, 
  disabled = false,
  size = 'xs'
}: PayPeriodPickerProps) {
  // Parse value
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;

  if (value) {
    if (typeof value === 'string') {
      // Format "YYYY-MM"
      const [y, m] = value.split('-').map(Number);
      if (y && m) {
        currentYear = y;
        currentMonth = m;
      }
    } else if (typeof value === 'object' && value.payYear && value.payMonth) {
      currentYear = value.payYear;
      currentMonth = value.payMonth;
    }
  }

  const [viewYear, setViewYear] = useState(currentYear);
  const whisperRef = useRef<any>(null);

  const handleMonthClick = (month: number) => {
    onChange(viewYear, month);
    // Close popover
    if (whisperRef.current) {
      whisperRef.current.close();
    }
  };

  const handlePrevYear = () => {
    setViewYear(prev => prev - 1);
  };

  const handleNextYear = () => {
    setViewYear(prev => prev + 1);
  };

  const displayValue = currentMonth && currentYear 
    ? format(new Date(currentYear, currentMonth - 1, 1), 'MMM yyyy', { locale: es })
    : 'Seleccionar mes';

  const speaker = (
    <Popover style={{ padding: 0 }}>
      <div style={{ width: '240px', padding: '1rem' }}>
        {/* Header con año y navegación */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <button
            onClick={handlePrevYear}
            style={{
              background: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ◀
          </button>
          <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {viewYear}
          </div>
          <button
            onClick={handleNextYear}
            style={{
              background: 'transparent',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            ▶
          </button>
        </div>

        {/* Grid de meses 3x4 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem'
        }}>
          {MONTHS.map((monthName, index) => {
            const monthNum = index + 1;
            const isSelected = monthNum === currentMonth && viewYear === currentYear;
            
            return (
              <button
                key={monthNum}
                onClick={() => handleMonthClick(monthNum)}
                style={{
                  padding: '0.5rem',
                  border: isSelected ? '2px solid #1e40af' : '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: isSelected ? '#eff6ff' : 'white',
                  color: isSelected ? '#1e40af' : '#333',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </div>
    </Popover>
  );

  return (
    <Whisper
      ref={whisperRef}
      placement="bottomStart"
      trigger="click"
      speaker={speaker}
      disabled={disabled}
    >
      <Button
        size={size}
        appearance="default"
        disabled={disabled}
        style={{
          width: '110px',
          textAlign: 'left',
          fontWeight: currentMonth && currentYear ? 'normal' : 'normal',
          color: currentMonth && currentYear ? '#333' : '#999'
        }}
      >
        {displayValue}
      </Button>
    </Whisper>
  );
}
