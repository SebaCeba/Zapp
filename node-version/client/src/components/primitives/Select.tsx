import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

/**
 * Custom Select component with Zapp styling
 * Replaces RSuite SelectPicker with native select + Tailwind
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, onChange, className = '', value, ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm transition-all appearance-none';
    const focusStyles = 'focus:ring-1 focus:ring-primary focus:outline-none';
    const errorStyles = error ? 'ring-1 ring-error' : '';
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={handleChange}
            className={`${baseStyles} ${focusStyles} ${errorStyles} pr-10 ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm">
            expand_more
          </span>
        </div>
        
        {error && (
          <p className="mt-1.5 text-xs text-error font-medium">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
