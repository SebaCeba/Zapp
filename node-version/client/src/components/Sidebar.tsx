import { useState } from 'react';

interface MenuItem {
  label: string;
  href?: string;
  subItems?: { label: string; href: string }[];
}

const menuItems: MenuItem[] = [
  { label: 'Inicio', href: '/' },
  { 
    label: 'Presupuesto',
    href: '/presupuesto',
    subItems: [
      { label: 'Ingresos', href: '/ingresos' },
      { label: 'Suscripciones', href: '/app' },
      { label: 'Créditos y Seguros', href: '/creditos' },
      { label: 'Hipotecario', href: '/hipotecario' },
      { label: 'Servicios Básicos', href: '/servicios-basicos' },
      { label: 'Supermercado', href: '/supermercado' },
      { label: 'Tenpo TC', href: '/presupuesto/tenpo' }
    ]
  },
  { label: 'Actual', href: '/actual' }
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>('Presupuesto');

  const toggleSubmenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  return (
    <aside className={`sidebar${open ? '' : ' collapsed'}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle sidebar"
      >
        {open ? '⏴' : '⏵'}
      </button>
      <div className="menu-title">Menú</div>
      <nav>
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              <>
                <a
                  href={item.href}
                  className="menu-item"
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontWeight: '600'
                  }}
                >
                  <span>{item.label}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSubmenu(item.label);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      padding: '0 0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    {expandedMenu === item.label ? '▼' : '▶'}
                  </button>
                </a>
                {expandedMenu === item.label && (
                  <div style={{ paddingLeft: '1rem' }}>
                    {item.subItems.map((subItem) => (
                      <a
                        key={subItem.href}
                        href={subItem.href}
                        className="menu-item"
                        style={{ fontSize: '0.9rem', paddingLeft: '1rem' }}
                      >
                        {subItem.label}
                      </a>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <a href={item.href} className="menu-item">
                {item.label}
              </a>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
