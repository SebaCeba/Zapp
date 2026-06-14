import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidenav, Nav } from 'rsuite';
import DashboardIcon from '@rsuite/icons/Dashboard';
import FunnelIcon from '@rsuite/icons/Funnel';
import PageIcon from '@rsuite/icons/Page';
import { menuConfig } from '../navigation/menuConfig';

// Icon mapping: convierte string names a componentes RSuite
const iconMap = {
  dashboard: <DashboardIcon />,
  funnel: <FunnelIcon />,
  page: <PageIcon />,
};

export default function Sidebar() {
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-open-keys');
    return saved !== null ? JSON.parse(saved) : ['presupuesto'];
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenChange = (keys: (string | number)[]) => {
    const nextKeys = keys.map(String);
    setOpenKeys(nextKeys);
    localStorage.setItem('sidebar-open-keys', JSON.stringify(nextKeys));
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
            {menuConfig.map((item) => {
              const icon = item.iconName ? iconMap[item.iconName] : undefined;
              
              if (item.children) {
                return (
                  <Nav.Menu
                    key={item.key}
                    eventKey={item.key}
                    title={item.label}
                    icon={icon}
                  >
                    {item.children.map((child) => (
                      <Nav.Item 
                        key={child.key} 
                        eventKey={child.key}
                        disabled={child.disabled}
                        style={child.disabled ? { 
                          fontWeight: 600, 
                          color: 'var(--rs-text-secondary)',
                          cursor: 'default',
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid var(--rs-border-primary)',
                        } : {}}
                      >
                        {child.label}
                      </Nav.Item>
                    ))}
                  </Nav.Menu>
                );
              }
              return (
                <Nav.Item key={item.key} eventKey={item.key} icon={icon}>
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
