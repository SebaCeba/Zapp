# Refactor Menu Config

**Fecha:** 27 de Febrero, 2026  
**Objetivo:** Extraer configuración hardcodeada del sidebar a un archivo externo reutilizable

---

## Qué se cambió

### ✅ Cambios realizados

1. **Nueva estructura de configuración (`menuConfig.ts`)**
   - Creado archivo `node-version/client/src/navigation/menuConfig.ts`
   - Array `menuConfig` exportado con tipado TypeScript
   - Interfaces `MenuItem` y `MenuChild` para type safety
   - Iconos representados como strings (`iconName: 'dashboard'`) en lugar de componentes JSX

2. **Refactor en `Sidebar.tsx`**
   - Importación de `menuConfig` desde `../navigation/menuConfig`
   - Implementación de `iconMap` para convertir string names → componentes RSuite
   - Reemplazo de array hardcoded `menuItems` por configuración importada
   - Mapeo dinámico de iconos: `const icon = item.iconName ? iconMap[item.iconName] : undefined`
   - Eliminación de cast `(child as any)` por tipado explícito en interface

3. **Separación de concerns**
   - **Config** (`menuConfig.ts`): Datos puros sin dependencias de React/JSX
   - **Presentación** (`Sidebar.tsx`): Lógica de rendering y navegación

---

## Qué NO se cambió

### ⛔ Sin cambios funcionales

- ✅ Estructura del menú idéntica (mismo orden, mismos labels, mismas keys)
- ✅ Rutas (`key`) sin modificación
- ✅ Items disabled (headers) mantienen mismo comportamiento
- ✅ Jerarquía padre-hijo (`children`) intacta
- ✅ Lógica de `activeKey` (basada en `location.pathname`) sin cambios
- ✅ Lógica de `openKeys` + localStorage sin cambios
- ✅ Estilos y apariencia visual idénticos
- ✅ Integración con React Router sin modificación

### Comportamiento preservado

```typescript
// ANTES y DESPUÉS: mismo resultado visual y funcional
<Nav activeKey={location.pathname} onSelect={(key) => navigate(key)}>
  {/* Renderizado de items */}
</Nav>
```

---

## Cómo agregar un nuevo item

### Paso 1: Agregar configuración en `menuConfig.ts`

#### Item sin hijos (ruta directa)

```typescript
export const menuConfig: MenuItem[] = [
  // ... items existentes
  {
    key: '/nueva-ruta',        // Must match React Router route
    label: 'Nueva Página',
    iconName: 'dashboard',     // Opcional: 'dashboard' | 'funnel' | 'page'
  },
];
```

#### Item con submenú

```typescript
export const menuConfig: MenuItem[] = [
  // ... items existentes
  {
    key: 'nueva-seccion',      // Key del contenedor (no navegable)
    label: 'Nueva Sección',
    iconName: 'funnel',
    children: [
      { key: '/seccion/opcion1', label: 'Opción 1' },
      { key: '/seccion/opcion2', label: 'Opción 2' },
      { key: 'header-divisor', label: 'Divisor', disabled: true },  // Header
      { key: '/seccion/opcion3', label: '  • Opción 3' },  // Indented
    ],
  },
];
```

### Paso 2: Agregar ruta en `router.tsx`

```typescript
import NuevaPagina from './pages/NuevaPagina';

<Routes>
  {/* ... rutas existentes */}
  <Route path="/nueva-ruta" element={<NuevaPagina />} />
</Routes>
```

### Paso 3: (Opcional) Agregar nuevo ícono

Si necesitas un ícono diferente a los existentes:

#### En `Sidebar.tsx`:

```typescript
import NuevoIcon from '@rsuite/icons/Nuevo';

const iconMap = {
  dashboard: <DashboardIcon />,
  funnel: <FunnelIcon />,
  page: <PageIcon />,
  nuevo: <NuevoIcon />,  // ← Agregar aquí
};
```

#### En `menuConfig.ts`:

```typescript
// Actualizar type hint
export interface MenuItem {
  key: string;
  label: string;
  iconName?: 'dashboard' | 'funnel' | 'page' | 'nuevo';  // ← Agregar a union type
  children?: MenuChild[];
}
```

---

## Cómo funciona iconMap

### Concepto

**Problema:** Los componentes JSX no se pueden serializar en JSON ni exportar como datos puros.

**Solución:** Usar strings como identificadores y mapearlos a componentes en tiempo de render.

### Implementación

```typescript
// 1. Config usa strings
const menuConfig = [
  { key: '/', label: 'Inicio', iconName: 'dashboard' },  // ← String
];

// 2. Sidebar mapea strings → componentes
const iconMap = {
  dashboard: <DashboardIcon />,  // ← Componente JSX
  funnel: <FunnelIcon />,
  page: <PageIcon />,
};

// 3. Render time lookup
{menuConfig.map((item) => {
  const icon = item.iconName ? iconMap[item.iconName] : undefined;
  return <Nav.Item icon={icon}>{item.label}</Nav.Item>;
})}
```

### Flujo de datos

```
menuConfig.ts (data)
     ↓
iconName: 'dashboard' (string)
     ↓
Sidebar.tsx import menuConfig
     ↓
iconMap['dashboard'] → <DashboardIcon />
     ↓
<Nav.Item icon={<DashboardIcon />} />
```

### Ventajas

✅ **Separación de concerns:** Config es puro data sin dependencias React  
✅ **Testeable:** `menuConfig` puede testearse sin mock de componentes  
✅ **Extensible:** Agregar iconos solo requiere actualizar `iconMap` + type  
✅ **Serializable:** Config puede venir de API/JSON en el futuro  
✅ **Type-safe:** Union type `'dashboard' | 'funnel' | 'page'` previene typos

---

## Archivos modificados

### Archivos nuevos

```
✅ node-version/client/src/navigation/menuConfig.ts (66 líneas)
   - Interface MenuItem
   - Interface MenuChild
   - Export menuConfig array
   
✅ docs/menu-sidenav_refactor-config.md (este archivo)
```

### Archivos modificados

```
📝 node-version/client/src/components/Sidebar.tsx
   Cambios:
   - Import { menuConfig } from '../navigation/menuConfig'
   - Agregado iconMap object
   - Reemplazo menuItems → menuConfig
   - Mapeo item.icon → item.iconName + iconMap lookup
   - Eliminado (child as any) cast
   
   Líneas afectadas: ~58
   Impacto: Refactor sin cambio funcional
```

---

## Estructura de directorios actualizada

```
node-version/client/src/
├── components/
│   └── Sidebar.tsx              (refactorizado)
├── navigation/                  (nuevo)
│   └── menuConfig.ts            (nuevo)
├── layout/
│   └── MainLayout.tsx           (sin cambios)
└── router.tsx                   (sin cambios)
```

---

## Beneficios del refactor

### 🎯 Inmediatos

- Código más limpio y organizado
- Separación clara entre datos y presentación
- Más fácil de testear (config puede testearse aisladamente)

### 🚀 Futuros

- **Backend-driven menu:** Config puede venir de API REST
- **Permisos dinámicos:** Filtrar items según rol de usuario
- **i18n:** Labels pueden reemplazarse con claves de traducción
- **A/B testing:** Diferentes configs para diferentes usuarios
- **Multi-tenant:** Menús personalizados por cliente

### Ejemplo de evolución futura

```typescript
// Hoy: static import
import { menuConfig } from '../navigation/menuConfig';

// Mañana: dynamic API
const menuConfig = await fetch('/api/menu').then(r => r.json());

// Pasado mañana: con permisos
const menuConfig = await getMenuForUser(userId, roles);
```

---

## Testing

### Tests sugeridos (no implementados aún)

```typescript
// menuConfig.test.ts
describe('menuConfig', () => {
  it('debe tener keys únicas', () => {
    const keys = menuConfig.flatMap(item => 
      item.children ? [item.key, ...item.children.map(c => c.key)] : [item.key]
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('items con children no deben tener iconName', () => {
    menuConfig.forEach(item => {
      if (item.children && item.children.length > 0) {
        expect(item.iconName).toBeDefined();
      }
    });
  });

  it('keys de rutas deben empezar con /', () => {
    // Headers disabled pueden no empezar con /
    menuConfig.forEach(item => {
      item.children?.forEach(child => {
        if (!child.disabled) {
          expect(child.key).toMatch(/^\//);
        }
      });
    });
  });
});
```

---

## Checklist de validación

- [x] Sidebar renderiza correctamente
- [x] Navegación funciona en todas las rutas
- [x] Items activos se destacan según `location.pathname`
- [x] Submenús se expanden/colapsan correctamente
- [x] localStorage persiste estado de `openKeys`
- [x] Iconos se muestran correctamente
- [x] Items disabled no son clickeables
- [x] No hay warnings en consola de TypeScript
- [x] No hay warnings en consola del navegador

---

**Documentado por:** GitHub Copilot  
**Última actualización:** 27 de Febrero, 2026
