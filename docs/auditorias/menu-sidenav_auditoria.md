# Auditoría Sidenav

**Fecha:** 27 de Febrero, 2026  
**Versión del proyecto:** React/TypeScript (node-version)

---

## Archivos involucrados

### Archivos principales (React App)
- **`node-version/client/src/components/Sidebar.tsx`** (128 líneas)  
  → Componente principal del sidenav con toda la lógica de navegación
  
- **`node-version/client/src/layout/MainLayout.tsx`** (11 líneas)  
  → Layout wrapper que renderiza el Sidebar + contenido principal
  
- **`node-version/client/src/router.tsx`** (43 líneas)  
  → Configuración de rutas de React Router DOM
  
- **`node-version/client/src/main.tsx`** (11 líneas)  
  → Entry point que importa estilos RSuite y renderiza el Router

### Archivos legacy (no utilizados en React App)
- **`templates/sidebar.html`** (Flask/Jinja2)  
  → Sidebar de la versión Python anterior, no conectado con la app React actual
  
- **`templates/index.html`** (Flask/Jinja2)  
  → Incluye `sidebar.html` via Jinja2 templates

### CSS pendiente de limpieza
- **`node-version/client/src/index.css`** (líneas 241-310)  
  → Clases `.sidebar`, `.sidebar.collapsed`, `.sidebar-toggle`, `.menu-item`, `.menu-title` ya no se utilizan (legacy de implementación pre-RSuite)

---

## Estructura actual del menú

El menú está definido en un array constante `menuItems` dentro de `Sidebar.tsx`:

```
💰 Zapps (Header)
├── 🏠 Inicio [/]
├── 🔽 Presupuesto (expandible)
│   ├── Resumen [/presupuesto/resumen]
│   ├── Ingresos [/ingresos]
│   ├── ──── Gastos ──── (header deshabilitado)
│   ├──   • Suscripciones [/app]
│   ├──   • Créditos y Seguros [/creditos]
│   ├──   • Hipotecario [/hipotecario]
│   ├──   • Servicios Básicos [/servicios-basicos]
│   ├──   • Supermercado [/supermercado]
│   ├──   • Tenpo TC [/presupuesto/tenpo]
│   ├── ──── Ahorros ──── (header deshabilitado)
│   └──   • Ahorros [/ahorros]
└── 📄 Actual (expandible)
    ├── Resumen [/actual]
    ├── ──── Gastos ──── (header deshabilitado)
    ├──   • Suscripciones [/actual/suscripciones]
    ├──   • Créditos y Seguros [/actual/creditos]
    ├──   • Hipotecario [/actual/hipotecario]
    ├──   • Servicios Básicos [/actual/servicios]
    ├──   • Supermercado [/actual/supermercado]
    ├──   • Tenpo TC [/actual/tenpo]
    └── ──── Ahorros ──── (header deshabilitado)
```

### Iconos utilizados
- `DashboardIcon` → Inicio
- `FunnelIcon` → Presupuesto
- `PageIcon` → Actual

---

## Configuración del menú (hardcoded)

**Tipo:** Configuración estática hardcodeada

**Ubicación:** `node-version/client/src/components/Sidebar.tsx` (líneas 8-47)

```typescript
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
      { key: 'gastos-header', label: 'Gastos', disabled: true },
      { key: '/app', label: '  • Suscripciones' },
      // ... más items
    ],
  },
  // ... más secciones
];
```

### Características de la configuración

| Feature | Implementación |
|---------|----------------|
| **Dinámica** | ❌ No - Array constante hardcoded en el componente |
| **Items deshabilitados** | ✅ Sí - Props `disabled: true` para headers de sección |
| **Sub-menús** | ✅ Sí - Propiedad `children` en items principales |
| **Iconos** | ✅ Sí - Props `icon` con componentes de `@rsuite/icons` |
| **Rutas externas** | ❌ No - Todas las rutas son internas |
| **Permisos/roles** | ❌ No - Sin lógica de autorización |

---

## Lógica de activación (activeKey)

### Mecanismo de detección de ruta activa

**Ubicación:** `node-version/client/src/components/Sidebar.tsx` (líneas 49-88)

```typescript
const navigate = useNavigate();
const location = useLocation();

// ...

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
            <Nav.Item 
              key={child.key} 
              eventKey={child.key}
              disabled={(child as any).disabled}
              style={(child as any).disabled ? { 
                fontWeight: 600, 
                color: 'var(--rs-text-secondary)',
                cursor: 'default',
                marginTop: '8px'
              } : {}}
            >
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
```

### Explicación del flujo

1. **`useLocation()` (React Router):**  
   Obtiene el objeto `location` con `pathname` actual (ej: `/presupuesto/tenpo`)

2. **`activeKey={location.pathname}`:**  
   RSuite `<Nav>` compara `activeKey` con cada `eventKey` de los `<Nav.Item>`

3. **Matching automático:**  
   - Si `location.pathname === eventKey` → el item se marca como activo (RSuite aplica estilos visuales)
   - No requiere lógica manual de comparación

4. **Navegación:**  
   - `onSelect={(key) => navigate(key)}` → al hacer clic, React Router navega a la ruta

5. **Items deshabilitados:**  
   - `disabled={true}` → previene navegación y aplicación de estilos activos
   - Se usan para headers decorativos (ej: "Gastos", "Ahorros")

### Estado de expansión de menús

**Ubicación:** `node-version/client/src/components/Sidebar.tsx` (líneas 49-60)

```typescript
const [openKeys, setOpenKeys] = useState<string[]>(() => {
  const saved = localStorage.getItem('sidebar-open-keys');
  return saved !== null ? JSON.parse(saved) : ['presupuesto'];
});

const handleOpenChange = (keys: string[]) => {
  setOpenKeys(keys);
  localStorage.setItem('sidebar-open-keys', JSON.stringify(keys));
};

// ...

<Sidenav
  appearance="subtle"
  openKeys={openKeys}
  onOpenChange={handleOpenChange}
  // ...
>
```

**Funcionamiento:**
- `openKeys` es un array de strings con las `key` de menús expandidos (ej: `['presupuesto', 'actual']`)
- Se persiste en `localStorage` con clave `'sidebar-open-keys'`
- Default: `['presupuesto']` → Menú "Presupuesto" expandido al cargar
- Modo controlado: Se usa `openKeys` + `onOpenChange` (no `defaultOpenKeys`)

---

## Dependencias utilizadas

### NPM Packages

| Package | Versión | Uso |
|---------|---------|-----|
| **`rsuite`** | `^6.1.2` | UI component library - Sidenav, Nav, Nav.Menu, Nav.Item |
| **`@rsuite/icons`** | (incluido con rsuite) | Dashboard, Funnel, Page icons |
| **`react-router-dom`** | `^7.11.0` | Routing - useNavigate, useLocation, BrowserRouter, Routes, Route |
| **`react`** | `^18.2.0` | useState hook |

### Imports en Sidebar.tsx

```typescript
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidenav, Nav } from 'rsuite';
import DashboardIcon from '@rsuite/icons/Dashboard';
import FunnelIcon from '@rsuite/icons/Funnel';
import PageIcon from '@rsuite/icons/Page';
```

### Estilos globales

**Archivo:** `node-version/client/src/main.tsx`

```typescript
import 'rsuite/dist/rsuite.min.css';
import './index.css';
```

- `rsuite.min.css` → estilos completos de RSuite (importado antes de custom CSS)
- `index.css` → estilos custom de la app (incluye legacy CSS no utilizado)

---

## Integración con React Router

### Flujo de navegación

```
Usuario hace clic en item del menú
          ↓
onSelect={(key) => navigate(key)}
          ↓
React Router DOM cambia la URL
          ↓
useLocation() detecta cambio en pathname
          ↓
<Nav activeKey={location.pathname}> se re-renderiza
          ↓
RSuite aplica estilo activo al Nav.Item con eventKey matching
```

### Rutas definidas (router.tsx)

**Total de rutas:** 16

**Estructura de rutas:**
```typescript
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/presupuesto/resumen" element={<Presupuesto />} />
    <Route path="/actual" element={<Actual />} />
    <Route path="/actual/tenpo" element={<ActualTenpo />} />
    <Route path="/app" element={<App />} />
    <Route path="/creditos" element={<Creditos />} />
    <Route path="/hipotecario" element={<Hipotecario />} />
    <Route path="/servicios-basicos" element={<ServiciosBasicos />} />
    <Route path="/ingresos" element={<Ingresos />} />
    <Route path="/ahorros" element={<Ahorros />} />
    <Route path="/gastos" element={<Gastos />} />
    <Route path="/supermercado" element={<Supermercado />} />
    <Route path="/presupuesto/tenpo" element={<Tenpo />} />
    <Route path="/presupuesto/tenpo/config" element={<TenpoConfig />} />
    <Route path="/tenpo/categorias" element={<TenpoCategories />} />
    <Route path="/tenpo/asignacion" element={<TenpoMerchantAssignment />} />
    <Route path="/configuracion-tc/:tcKey" element={<ConfiguracionTC />} />
  </Routes>
</BrowserRouter>
```

### Rutas NO presentes en el sidebar

Las siguientes rutas existen en `router.tsx` pero **no** tienen enlaces en el sidebar:

- `/presupuesto/tenpo/config`
- `/tenpo/categorias`
- `/tenpo/asignacion`
- `/configuracion-tc/:tcKey`
- `/gastos`
- `/actual/suscripciones`
- `/actual/creditos`
- `/actual/hipotecario`
- `/actual/servicios`
- `/actual/supermercado`

**Nota:** Las rutas bajo `/actual/*` (excepto `/actual`) no están en el sidebar, pero algunas secciones "Actual" tienen items hijos desactivados que podrían ser placeholders para implementación futura.

---

## Layout rendering (MainLayout.tsx)

**Ubicación:** `node-version/client/src/layout/MainLayout.tsx`

```typescript
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

**Características:**
- Layout flex horizontal
- Sidebar fijo a la izquierda
- Main content con scroll vertical
- Sin uso de `<Container>`, `<Header>`, `<Content>` de RSuite (decisión de simplicidad documentada en `docs/implementacion_rsuite/fase-2/FASE_2_RESULTADOS.md`)

---

## Observaciones y pendientes

### ✅ Implementado
- Sidebar completamente funcional con RSuite `Sidenav`
- Navegación integrada con React Router DOM
- Active state automático basado en `location.pathname`
- Persistencia de estado de expansión en `localStorage`
- Headers de sección con `disabled: true`
- Iconos visuales en items principales
- Submenús expandibles (Presupuesto, Actual)

### ⚠️ Limitaciones actuales
- **Sin toggle de colapsar/expandir:** RSuite `Sidenav` colapsado no soporta flyout/popout nativo para submenús. Implementar requeriría custom logic con `Whisper` + `Popover`.
- **Configuración hardcoded:** No hay configuración dinámica basada en permisos, roles o datos del backend.
- **Algunas rutas huérfanas:** Existen rutas en `router.tsx` sin enlaces en el sidebar (ej: páginas de configuración de Tenpo, ConfiguracionTC).

### 🧹 Limpieza pendiente
- **CSS legacy:** Eliminar clases `.sidebar`, `.sidebar.collapsed`, `.sidebar-toggle`, `.menu-item`, `.menu-title` de `index.css` (líneas 241-310)
- **Templates Flask:** Archivos `templates/sidebar.html`, `templates/index.html` no utilizados por la app React (pueden removerse si no se mantiene versión Flask en paralelo)

### 📝 Mejoras potenciales
- Agregar enlaces a rutas huérfanas en el sidebar (ej: configuración TC, categorías Tenpo)
- Implementar configuración dinámica del menú desde backend/JSON
- Agregar badge/notificaciones en items del menú (RSuite soporta con `<Badge>`)
- Implementar breadcrumbs en MainLayout basado en ruta activa
- Agregar lógica de permisos/roles para ocultar/deshabilitar items según usuario

---

**Documentado por:** GitHub Copilot  
**Última actualización:** 27 de Febrero, 2026
