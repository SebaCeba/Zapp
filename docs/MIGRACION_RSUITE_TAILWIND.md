# Guía de Migración: De RSuite a Tailwind

## 📋 Resumen

Este documento describe cómo migrar las páginas existentes de Zapp desde **RSuite** al nuevo sistema basado en **Tailwind CSS + Componentes Custom**.

---

## 🎯 Objetivos de la Migración

1. ✅ Eliminar dependencia de RSuite (biblioteca opinionada)
2. ✅ Implementar sistema de diseño "Financial Atelier"
3. ✅ Usar Tailwind-first (95%+ estilos con utilities)
4. ✅ Componentes reutilizables y mantenibles
5. ✅ Mejor performance (menos CSS runtime)

---

## 🗺️ Mapeo de Componentes

### RSuite → Custom Components

| RSuite Component | Reemplazo Custom | Ubicación |
|-----------------|------------------|-----------|
| `<Panel>` | `<Card>` | `src/components/primitives/Card.tsx` |
| `<Button>` | `<Button>` | `src/components/primitives/Button.tsx` |
| `<Badge>` | `<Badge>` | `src/components/primitives/Badge.tsx` |
| `<Input>` | `<Input>` | `src/components/primitives/Input.tsx` |
| `<Container>` | `<MainLayout>` | `src/components/layout/MainLayout.tsx` |
| `<Header>` | `<PageHeader>` | `src/components/layout/PageHeader.tsx` |
| `<Sidebar>` | `<AppSidebar>` | `src/components/layout/AppSidebar.tsx` |

---

## 🔄 Ejemplos de Migración

### Ejemplo 1: Panel → Card

**Antes (RSuite):**
```tsx
import { Panel } from 'rsuite';

function MyComponent() {
  return (
    <Panel bordered shaded>
      <h3>Title</h3>
      <p>Content</p>
    </Panel>
  );
}
```

**Después (Tailwind):**
```tsx
import { Card } from '@/components/primitives';

function MyComponent() {
  return (
    <Card variant="rounded" padding="md">
      <h3 className="text-xl font-bold mb-4">Title</h3>
      <p className="text-slate-600">Content</p>
    </Card>
  );
}
```

---

### Ejemplo 2: Button

**Antes (RSuite):**
```tsx
import { Button } from 'rsuite';

<Button appearance="primary" size="lg">
  Guardar
</Button>
```

**Después (Tailwind):**
```tsx
import { Button } from '@/components/primitives';

<Button variant="primary" size="lg">
  Guardar
</Button>
```

---

### Ejemplo 3: Layout Completo

**Antes (RSuite):**
```tsx
import { Container, Header, Content, Sidebar } from 'rsuite';

function MyPage() {
  return (
    <Container>
      <Sidebar>...</Sidebar>
      <Container>
        <Header>...</Header>
        <Content>
          {/* page content */}
        </Content>
      </Container>
    </Container>
  );
}
```

**Después (Tailwind):**
```tsx
import { MainLayout } from '@/components/layout';

function MyPage() {
  const headerProps = {
    year: 2024,
    title: 'Mi Página',
  };

  return (
    <MainLayout headerProps={headerProps}>
      {/* page content */}
    </MainLayout>
  );
}
```

---

## 🎨 Tokens de Diseño Comunes

### Colores Semánticos

```tsx
// ❌ Antes (RSuite colors)
<Panel style={{ backgroundColor: '#3498ff' }}>

// ✅ Después (Design tokens)
<Card className="bg-primary">
```

### Spacing

```tsx
// ❌ Antes (hardcoded)
<div style={{ padding: '24px', gap: '16px' }}>

// ✅ Después (Tailwind scale)
<div className="p-6 gap-4">
```

### Typography

```tsx
// ❌ Antes (inline styles)
<h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>

// ✅ Después (Tailwind utilities)
<h1 className="text-4xl font-black text-navy-dark">
```

---

## 📝 Checklist de Migración por Página

Para cada página a migrar:

- [ ] Identificar todos los componentes RSuite usados
- [ ] Reemplazar con componentes custom equivalentes
- [ ] Convertir inline styles a Tailwind classes
- [ ] Usar `<MainLayout>` como wrapper principal
- [ ] Agregar `headerProps` para configurar header
- [ ] Verificar responsive (mobile-first)
- [ ] Probar navegación desde sidebar
- [ ] Validar estados de carga/error
- [ ] Verificar TypeScript (sin errores)

---

## 🚀 Proceso Paso a Paso

### 1. Análisis

Abre la página existente y lista:
- Componentes RSuite usados
- Estilos inline
- Layout structure

### 2. Crear Nueva Versión

```bash
# Crear copia con sufijo "New"
cp src/pages/MiPagina.tsx src/pages/MiPaginaNew.tsx
```

### 3. Reemplazar Imports

```tsx
// Eliminar
import { Panel, Button, Badge } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';

// Agregar
import { MainLayout } from '@/components/layout';
import { Card, Button, Badge } from '@/components/primitives';
```

### 4. Migrar JSX

Reemplaza estructura RSuite por Tailwind components.

### 5. Agregar al Router

```tsx
// router.tsx
import { MiPaginaNew } from './pages/MiPaginaNew';

<Route path="/new/mi-pagina" element={<MiPaginaNew />} />
```

### 6. Probar

```bash
npm run dev
# Visita http://localhost:5173/new/mi-pagina
```

### 7. Validar

```bash
npm run build  # Verificar sin errores TS
```

---

## ⚠️ Advertencias Comunes

### 1. No usar inline styles

```tsx
// ❌ EVITAR
<div style={{ padding: '12px' }}>

// ✅ USAR
<div className="p-3">
```

### 2. Verificar responsive

```tsx
// ✅ Mobile-first
<div className="
  grid 
  grid-cols-1       /* mobile */
  md:grid-cols-2    /* tablet */
  lg:grid-cols-3    /* desktop */
">
```

### 3. Usar design tokens

```tsx
// ❌ Hardcoded colors
className="bg-[#175ab1]"

// ✅ Design token
className="bg-primary"
```

---

## 📊 Progreso de Migración

### ✅ Completadas (3 páginas)

- [x] HomeNew.tsx (Dashboard)
- [x] ActualNew.tsx (Transacciones)
- [x] PresupuestoResumenNew.tsx (Budget Overview)

### 🔲 Pendientes (8 páginas)

- [ ] Ingresos.tsx
- [ ] Gastos.tsx
- [ ] Ahorros.tsx
- [ ] Supermercado.tsx
- [ ] ServiciosBasicos.tsx
- [ ] Creditos.tsx
- [ ] Hipotecario.tsx
- [ ] ConfigServiciosBasicos.tsx

---

## 🧹 Limpieza Post-Migración

Una vez todas las páginas estén migradas:

1. **Eliminar RSuite del package.json:**
```bash
npm uninstall rsuite
```

2. **Eliminar imports de RSuite CSS:**
```tsx
// Buscar y eliminar
import 'rsuite/dist/rsuite.min.css';
```

3. **Actualizar rutas en router.tsx:**
```tsx
// Cambiar de /new/* a rutas principales
<Route path="/" element={<HomePage />} />
```

4. **Eliminar archivos legacy:**
```bash
rm src/pages/Home.tsx  # después de validar HomeNew
```

---

## 💡 Tips de Productividad

### Usar snippets

Crea snippets en VS Code para componentes comunes:

```json
{
  "Zapp Card": {
    "prefix": "zcard",
    "body": [
      "<Card variant=\"${1:rounded}\" padding=\"${2:md}\">",
      "  $0",
      "</Card>"
    ]
  }
}
```

### Copilot Context

Cuando uses GitHub Copilot, menciona:
> "Usando componentes de @/components/primitives y Tailwind utilities, sin RSuite"

---

## 📚 Referencias

- Design System: `stitch_zapp_visual_style/financial_atelier/DESIGN.md`
- Componentes: `node-version/client/src/components/primitives/`
- Instrucciones: `.github/instructions/ui-architecture-zapp.instructions.md`
- Tailwind Config: `node-version/client/tailwind.config.js`

---

**Última actualización**: Abril 5, 2026
