/**
 * Menu Configuration
 * 
 * Estructura de navegación del sidebar.
 * Exporta la configuración estática del menú sin dependencias de React/JSX.
 */

export interface MenuChild {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface MenuItem {
  key: string;
  label: string;
  iconName?: 'dashboard' | 'funnel' | 'page';
  children?: MenuChild[];
}

export const menuConfig: MenuItem[] = [
  {
    key: '/',
    label: 'Inicio',
    iconName: 'dashboard',
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    iconName: 'funnel',
    children: [
      { key: '/ingresos', label: 'Ingresos' },
      { key: 'gastos-header', label: 'Gastos', disabled: true },
      { key: '/app', label: '    Suscripciones' },
      { key: '/creditos', label: '    Créditos y Seguros' },
      { key: '/hipotecario', label: '    Hipotecario' },
      { key: '/servicios-basicos', label: '    Servicios Básicos' },
      { key: '/supermercado', label: '    Supermercado' },
      { key: 'ahorros-header', label: 'Ahorros', disabled: true },
      { key: '/ahorros', label: '    Ahorros' },
    ],
  },
  {
    key: 'actual',
    label: 'Actual',
    iconName: 'page',
    children: [
      { key: '/actual', label: 'Resumen' },
      { key: 'actual-gastos-header', label: 'Gastos', disabled: true },
      { key: '/actual/suscripciones', label: '    Suscripciones' },
      { key: '/actual/creditos', label: '    Créditos y Seguros' },
      { key: '/actual/hipotecario', label: '    Hipotecario' },
      { key: '/actual/utilities', label: '    Servicios Básicos' },
      { key: '/actual/supermercado', label: '    Supermercado' },
      { key: 'actual-ahorros-header', label: 'Ahorros', disabled: true },
    ],
  },
  {
    key: 'configuracion',
    label: 'Configuración',
    children: [
      { key: '/config/servicios-basicos', label: 'Servicios Básicos' },
    ],
  },
];
