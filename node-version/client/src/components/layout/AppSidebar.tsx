import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Inicio', icon: 'home' },
  {
    path: '/presupuesto',
    label: 'Presupuesto',
    icon: 'account_balance_wallet',
    children: [
      { path: '/presupuesto', label: 'Resumen', icon: 'summarize' },
      { path: '/presupuesto/ingresos', label: 'Ingresos', icon: 'payments' },
      { path: '/gastos', label: 'Gastos', icon: 'trending_down' },
      { path: '/ahorros', label: 'Ahorros', icon: 'savings' },
    ],
  },
  {
    path: '/actual',
    label: 'Actual',
    icon: 'receipt_long',
    children: [
      { path: '/actual', label: 'Resumen', icon: 'summarize' },
      { path: '/comparacion', label: 'Comparación', icon: 'compare_arrows' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['/presupuesto', '/actual']);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => 
        child.path === location.pathname || 
        (child.children && child.children.some(subchild => subchild.path === location.pathname))
      );
    }
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const active = isActive(item.path);
    const parentActive = isParentActive(item);

    if (hasChildren) {
      return (
        <details key={item.path} open={isExpanded} className={level === 0 ? 'pt-2' : ''}>
          <summary
            onClick={(e) => {
              e.preventDefault();
              toggleExpanded(item.path);
            }}
            className={`flex items-center justify-between px-4 py-3 ${
              parentActive || active
                ? 'text-white bg-white/10'
                : 'text-slate-300/70 hover:text-white hover:bg-white/5'
            } transition-all duration-200 rounded-lg cursor-pointer ${
              level > 0 ? 'font-medium' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span 
                className="material-symbols-outlined text-[20px]"
                style={parentActive || active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className={level > 0 ? 'font-medium' : ''}>{item.label}</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </summary>
          
          <div className={`${level === 0 ? 'ml-4 mt-1 border-l border-white/10' : 'ml-12 mt-1'} space-y-1`}>
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        </details>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 ${
          level === 0 ? 'px-4 py-3' : level === 1 ? 'px-8 py-2.5' : 'py-1.5 text-xs'
        } ${
          active
            ? level === 1
              ? 'bg-white/10 text-white font-medium rounded-lg'
              : 'text-white'
            : 'text-slate-300/70 hover:text-white hover:bg-white/5'
        } transition-all duration-200 ${level <= 1 ? 'rounded-lg' : 'block'}`}
      >
        {item.icon && (
          <span 
            className={`material-symbols-outlined ${level === 0 ? 'text-[20px]' : 'text-[18px]'}`}
            style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {item.icon}
          </span>
        )}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col p-4 z-50 bg-navy-dark text-white shadow-xl overflow-x-hidden">
      {/* Logo */}
      <div className="mb-8 px-4 py-2">
        <h1 className="text-xl font-black text-white tracking-tighter">Zapp</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold opacity-80">
          Financial Atelier
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 sidebar-scroll overflow-y-auto font-['Inter'] text-sm tracking-wide">
        {navItems.map(item => renderNavItem(item))}
      </nav>

      {/* User Profile Area */}
      <div className="mt-auto pt-6 border-t border-white/10 px-2">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              MV
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">Marco Valeri</p>
            <p className="text-[10px] text-slate-400 truncate">Premium Member</p>
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <Link
            to="/config"
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-xs transition-all"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>Configuración</span>
          </Link>
          <button className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white text-xs transition-all">
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
