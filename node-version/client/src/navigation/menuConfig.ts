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
  isHeader?: boolean;
  indent?: boolean;
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
      { key: '/presupuesto', label: 'Resumen' },
      { key: '/presupuesto/ingresos', label: 'Ingresos' },
      { key: 'gastos-header', label: 'Gastos', disabled: true, isHeader: true },
      { key: '/suscripciones', label: 'Suscripciones', indent: true },
      { key: '/creditos', label: 'Créditos y Seguros', indent: true },
      { key: '/hipotecario', label: 'Hipotecario', indent: true },
      { key: '/servicios-basicos', label: 'Servicios Básicos', indent: true },
      { key: '/supermercado', label: 'Supermercado', indent: true },
      { key: 'ahorros-header', label: 'Ahorros', disabled: true, isHeader: true },
      { key: '/ahorros', label: 'Ahorros', indent: true },
    ],
  },
  {
    key: 'actual',
    label: 'Actual',
    iconName: 'page',
    children: [
      { key: '/actual', label: 'Resumen' },
      { key: '/comparacion', label: 'Comparación' },
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
