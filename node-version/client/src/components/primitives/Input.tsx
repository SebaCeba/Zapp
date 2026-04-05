import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string; // Material Symbol icon name
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2.5 bg-surface-container/30 border-none rounded-xl text-sm transition-all';
    const focusStyles = 'focus:ring-1 focus:ring-primary focus:outline-none';
    const errorStyles = error ? 'ring-1 ring-error' : '';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              {icon}
            </span>
          )}
          
          <input
            ref={ref}
            className={`${baseStyles} ${focusStyles} ${errorStyles} ${icon ? 'pl-9' : ''} ${className}`}
            {...props}
          />
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

Input.displayName = 'Input';
