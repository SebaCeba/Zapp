# Fase 2: Navegación y Layout - RESULTADOS

**Fecha:** 21 de Febrero, 2026  
**Estado:** ✅ COMPLETADA  
**Tiempo estimado:** 12-16 horas  
**Tiempo real:** ~2 horas

---

## 📋 Resumen

Migración del Sidebar y MainLayout a componentes RSuite. La implementación final optó por simplicidad y estabilidad sobre features opcionales (sin modo colapsable, sin localStorage).

- ✅ Sidebar migrado a `<Sidenav>` RSuite con `appearance="subtle"`
- ✅ `<Sidenav.Header>` con branding "💰 Zapps"
- ✅ Submenú "Presupuesto" expandido por defecto via `defaultOpenKeys`
- ✅ Iconos en items principales con `@rsuite/icons`
- ✅ Navegación integrada con React Router (`useNavigate` + `useLocation`)
- ✅ Active state automático basado en `location.pathname`
- ✅ MainLayout con `div` flex puro (sin RSuite Container)
- ✅ Nueva ruta `/presupuesto/resumen` como entry point del contenido de Presupuesto
- ❌ Toggle colapsar/expandir — descartado (ver sección de decisiones)

---

## ❌ Decisiones de diseño — qué se descartó y por qué

| Feature | Razón |
|---------|-------|
| **Toggle colapsar/expandir** | RSuite `<Sidenav>` colapsado no soporta flyout/popout nativo para submenús. Al colapsar, los `<Nav.Menu>` quedan inutilizables (solo icono, sin acceso a hijos). Requeriría implementación custom con `Whisper` + `Popover`. |
| **localStorage para estado expanded** | Sin toggle, no hay estado que persistir. |
| **RSuite `<Container>` + `<Content>` en MainLayout** | Generaba complejidad innecesaria y conflicto de nombres con el componente `Sidebar` local. Un `div` flex logra lo mismo. |
| **`openKeys` controlado en `<Sidenav>`** | Causaba scrollbars horizontales al colapsar porque forzaba submenús abiertos sobre un contenedor colapsado. Reemplazado por `defaultOpenKeys` (modo no controlado). |

---

## 🔧 Estado final de los archivos

### `Sidebar.tsx`

```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidenav, Nav } from 'rsuite';
import DashboardIcon from '@rsuite/icons/Dashboard';
import FunnelIcon from '@rsuite/icons/Funnel';
import PageIcon from '@rsuite/icons/Page';

const menuItems = [
  { key: '/', label: 'Inicio', icon: <DashboardIcon /> },
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
      { key: '/presupuesto/tenpo', label: 'Tenpo TC' }
    ]
  },
  { key: '/actual', label: 'Actual', icon: <PageIcon /> }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ height: '100vh', position: 'sticky', top: 0, ... }}>
      <Sidenav appearance="subtle" defaultOpenKeys={['presupuesto']}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <Sidenav.Header>
          <div style={{ padding: '18px 20px', fontWeight: 700, ... }}>
            💰 <span>Zapps</span>
          </div>
        </Sidenav.Header>
        <Sidenav.Body>
          <Nav activeKey={location.pathname} onSelect={(key) => navigate(key)}>
            {/* Nav.Menu para Presupuesto, Nav.Item para el resto */}
          </Nav>
        </Sidenav.Body>
      </Sidenav>
    </div>
  );
}
```

### `MainLayout.tsx`

```tsx
import Sidebar from '../components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
```

### `router.tsx` — rutas relevantes

```tsx
<Route path="/" element={<Home />} />
<Route path="/presupuesto/resumen" element={<Presupuesto />} />
<Route path="/actual" element={<Actual />} />
<Route path="/ingresos" element={<Ingresos />} />
<Route path="/app" element={<App />} />
<Route path="/creditos" element={<Creditos />} />
<Route path="/hipotecario" element={<Hipotecario />} />
<Route path="/servicios-basicos" element={<ServiciosBasicos />} />
<Route path="/supermercado" element={<Supermercado />} />
<Route path="/presupuesto/tenpo" element={<Tenpo />} />
```

> `/presupuesto` sin subruta no tiene ruta definida. El `key: 'presupuesto'` en el menú es solo identificador de grupo para `defaultOpenKeys`.

---

## 🐛 Issues resueltos durante la fase

| Issue | Causa | Solución |
|-------|-------|----------|
| Warning `openKeys`/`onOpenChange` en `<Nav>` | Props de `<Sidenav>` mal colocados en `<Nav>` | Moverlos a `<Sidenav>` |
| Warning `defaultOpen` en `<Nav.Menu>` | Prop inexistente | Usar `defaultOpenKeys` en `<Sidenav>` |
| Sidebar ocupando 50% del ancho | Faltaba `flexShrink: 0` | Agregado al div wrapper |
| Nombre "Sidebar" en conflicto con RSuite | `import { Sidebar } from 'rsuite'` colisionaba con el componente local | Se eliminó el wrapper RSuite |
| Toggle no fijado al fondo | Posición incorrecta fuera de `<Sidenav>` | `<Sidenav.Footer>` lo fija correctamente |
| Scrollbars horizontales al colapsar | `openKeys` controlado forzaba submenús abiertos sobre contenedor colapsado | `defaultOpenKeys` (no controlado) |

---

## 📊 Impacto

### Código
- ~105 líneas de JSX custom → ~95 líneas con RSuite
- 3 imports de `@rsuite/icons` agregados
- `useState` e importación eliminados (sin estado de collapse)

### CSS pendiente de limpiar (Fase 7)
- Clases `.sidebar`, `.sidebar-toggle`, `.menu-item`, `.menu-title` en `index.css` ya no se usan

### UX
- ✅ Iconos para identificación visual
- ✅ Active state visible en item actual
- ✅ Submenú Presupuesto siempre expandido por defecto
- ✅ Header con branding de la app

---

## 📝 Pendiente para otras fases

- **Fase 7 (Limpieza):** Eliminar clases CSS legacy del sidebar en `index.css`
- **Fase 7 (Limpieza):** `Home.tsx` tiene solo contenido de test RSuite, reemplazar con contenido real
- **Futuro (si se necesita):** Sidebar colapsable con flyout requiere implementación custom usando `Whisper` + `Popover` de RSuite

---

## 💡 Lecciones aprendidas

1. **`defaultOpenKeys` vs `openKeys`:** El modo no controlado es más estable. El modo controlado puede causar layout bugs al colapsar.
2. **RSuite Sidenav no tiene flyout nativo:** A diferencia de Ant Design, al colapsar los `<Nav.Menu>` quedan inaccesibles. Prescindir del collapse es la solución más simple.
3. **`Sidenav.Toggle` pertenece a `Sidenav.Footer`:** Ponerlo fuera del `<Sidenav>` no funciona correctamente.
4. **MainLayout sencillo > RSuite Container:** El `<Container>` de RSuite añade complejidad sin beneficio real en este caso de uso.

---

**Documentado por:** GitHub Copilot  
**Última actualización:** 21 de Febrero, 2026
