/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - Blue
        'primary': '#175ab1',
        'primary-container': '#3b73cc',
        'primary-fixed': '#d7e2ff',
        'primary-fixed-dim': '#acc7ff',
        'on-primary': '#ffffff',
        'on-primary-container': '#fefcff',
        'on-primary-fixed': '#001a40',
        'on-primary-fixed-variant': '#004591',
        'inverse-primary': '#acc7ff',
        
        // Secondary colors - Supporting shades
        'secondary': '#4c5e82',
        'secondary-container': '#c2d5fe',
        'secondary-fixed': '#d7e2ff',
        'secondary-fixed-dim': '#b4c7f0',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#4a5c7f',
        'on-secondary-fixed': '#051b3b',
        'on-secondary-fixed-variant': '#354769',
        
        // Tertiary colors - Warm accent
        'tertiary': '#904900',
        'tertiary-container': '#b25e0d',
        'tertiary-fixed': '#ffdcc5',
        'tertiary-fixed-dim': '#ffb783',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'on-tertiary-fixed': '#301400',
        'on-tertiary-fixed-variant': '#703700',
        
        // Error colors
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        
        // Background & Surface
        'background': '#f9f9ff',
        'cream': '#FDFCF9', // Page background
        'on-background': '#191c21',
        
        'surface': '#f9f9ff',
        'surface-dim': '#d8d9e1',
        'surface-bright': '#f9f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f3fb',
        'surface-container': '#ecedf5',
        'surface-container-high': '#e7e8f0',
        'surface-container-highest': '#e1e2ea',
        'on-surface': '#191c21',
        'on-surface-variant': '#424752',
        
        'surface-variant': '#e1e2ea',
        'surface-tint': '#1b5cb4',
        'inverse-surface': '#2e3036',
        'inverse-on-surface': '#eff0f8',
        
        // Outline
        'outline': '#737783',
        'outline-variant': '#c2c6d4',
        
        // Custom colors
        'navy-dark': '#002948', // Sidebar background
      },
      fontFamily: {
        'headline': ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'label': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',    // 4px
        'lg': '0.5rem',        // 8px
        'xl': '0.75rem',       // 12px
        '2xl': '1rem',         // 16px
        '3xl': '1.5rem',       // 24px
        'full': '9999px',
      },
      spacing: {
        // Following 4px grid
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      fontSize: {
        'xs': ['0.625rem', { lineHeight: '0.875rem' }],   // 10px
        'sm': ['0.75rem', { lineHeight: '1rem' }],        // 12px
        'base': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'lg': ['1rem', { lineHeight: '1.5rem' }],         // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],    // 18px
        '2xl': ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        '3xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '4xl': ['2rem', { lineHeight: '2.5rem' }],        // 32px
        '5xl': ['2.5rem', { lineHeight: '3rem' }],        // 40px
        '6xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
