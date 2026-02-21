/**
 * Variables de tema custom para RSuite
 * Basado en el CSS actual (index.css)
 * 
 * Estas variables permiten que RSuite use los mismos colores y estilos
 * que el resto de la aplicación para mantener consistencia visual.
 */

export const customTheme = {
  // Colores primarios (de :root en index.css)
  '--rs-primary-500': '#2563eb',      // var(--primary)
  '--rs-primary-600': '#1d4ed8',      // var(--primary-dark)
  '--rs-primary-700': '#1e40af',      // Darker shade
  
  // Grises (de :root en index.css)
  '--rs-gray-50': '#f9fafb',          // var(--gray-50)
  '--rs-gray-100': '#f3f4f6',         // var(--gray-100)
  '--rs-gray-200': '#e5e7eb',         // var(--gray-200)
  '--rs-gray-300': '#d1d5db',         // var(--gray-300)
  '--rs-gray-700': '#374151',         // var(--gray-700)
  '--rs-gray-900': '#111827',         // var(--gray-900)
  
  // Estados (de :root en index.css)
  '--rs-green-500': '#10b981',        // var(--success)
  '--rs-green-600': '#059669',        // Darker success
  '--rs-red-500': '#ef4444',          // var(--danger)
  '--rs-red-600': '#dc2626',          // Darker danger
  
  // Tipografía (de body en index.css)
  '--rs-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  
  // Border radius (basado en estilos del proyecto)
  '--rs-border-radius-base': '6px',
  '--rs-border-radius-md': '8px',
  '--rs-border-radius-lg': '12px',
  
  // Spacing
  '--rs-padding-base': '0.5rem',
  '--rs-padding-md': '0.75rem',
  '--rs-padding-lg': '1rem',
};

/**
 * Aplicar tema custom a RSuite
 * 
 * Esta función inyecta las variables CSS en el :root del documento
 * para que RSuite las use automáticamente.
 * 
 * NOTA: No es necesario llamar esta función en Fase 0.
 * Se usará en fases posteriores cuando comencemos a customizar componentes.
 * 
 * @example
 * ```tsx
 * // En main.tsx o App.tsx
 * import { applyCustomTheme } from './theme/rsuite-variables';
 * 
 * applyCustomTheme();
 * ```
 */
export function applyCustomTheme() {
  const root = document.documentElement;
  Object.entries(customTheme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Obtener una variable de tema específica
 * 
 * @param key - La clave de la variable (sin '--')
 * @returns El valor de la variable
 * 
 * @example
 * ```tsx
 * const primaryColor = getThemeVariable('rs-primary-500'); // '#2563eb'
 * ```
 */
export function getThemeVariable(key: string): string {
  const fullKey = key.startsWith('--') ? key : `--${key}`;
  return customTheme[fullKey as keyof typeof customTheme] || '';
}

/**
 * Colores exportados para uso directo
 * 
 * Útil para componentes que necesitan colores específicos sin
 * depender de variables CSS.
 */
export const colors = {
  primary: {
    main: '#2563eb',
    dark: '#1d4ed8',
    darker: '#1e40af',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    700: '#374151',
    900: '#111827',
  },
  success: {
    main: '#10b981',
    dark: '#059669',
  },
  danger: {
    main: '#ef4444',
    dark: '#dc2626',
  },
} as const;

/**
 * Border radius exportados para uso directo
 */
export const borderRadius = {
  base: '6px',
  md: '8px',
  lg: '12px',
} as const;

/**
 * Spacing exportados para uso directo
 */
export const spacing = {
  base: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
} as const;

export default {
  customTheme,
  applyCustomTheme,
  getThemeVariable,
  colors,
  borderRadius,
  spacing,
};
