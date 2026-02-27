import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidenav, Nav } from 'rsuite';
import DashboardIcon from '@rsuite/icons/Dashboard';
import FunnelIcon from '@rsuite/icons/Funnel';
import PageIcon from '@rsuite/icons/Page';

const menuItems = [
  {
    key: '/',
    label: 'Inicio',
    icon: <DashboardIcon />,
  },
  {
    key: 'presupuesto',
    label: 'Presupuesto',
    icon: <FunnelIcon />,
    children: [
      { key: '/presupuesto/resumen', label: 'Resumen' },
      { key: '/ingresos', label: 'Ingresos' },
      { key: '/app', label: 'Suscripciones' },
      { key: '/creditos', label: 'Créditos y Seguros' },
      { key: '/hipotecario', label: 'Hipotecario' },
      { key: '/servicios-basicos', label: 'Servicios Básicos' },
      { key: '/supermercado', label: 'Supermercado' },
      { key: '/presupuesto/tenpo', label: 'Tenpo TC' },
    ],
  },
  {
    key: 'actual',
    label: 'Actual',
    icon: <PageIcon />,
    children: [
      { key: '/actual', label: 'Resumen' },
      { key: '/actual/tenpo', label: 'Tenpo TC' },
    ],
  },
];

export default function Sidebar() {
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-open-keys');
    return saved !== null ? JSON.parse(saved) : ['presupuesto'];
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
    localStorage.setItem('sidebar-open-keys', JSON.stringify(keys));
  };

  return (
    <div style={{ height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      <Sidenav
        appearance="subtle"
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <Sidenav.Header>
          <div style={{
            padding: '18px 20px',
            fontWeight: 700,
            fontSize: '1rem',
            letterSpacing: '0.02em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--rs-text-primary)',
          }}>
            💰 <span>Zapps</span>
          </div>
        </Sidenav.Header>
        <Sidenav.Body>
          <Nav activeKey={location.pathname} onSelect={(key) => navigate(key)}>
            {menuItems.map((item) => {
              if (item.children) {
                return (
                  <Nav.Menu
                    key={item.key}
                    eventKey={item.key}
                    title={item.label}
                    icon={item.icon}
                  >
                    {item.children.map((child) => (
                      <Nav.Item key={child.key} eventKey={child.key}>
                        {child.label}
                      </Nav.Item>
                    ))}
                  </Nav.Menu>
                );
              }
              return (
                <Nav.Item key={item.key} eventKey={item.key} icon={item.icon}>
                  {item.label}
                </Nav.Item>
              );
            })}
          </Nav>
        </Sidenav.Body>
      </Sidenav>
    </div>
  );
}
