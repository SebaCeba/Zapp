---
description: "Use when working on ANY frontend code in Zapp: pages, views, layouts, features, styling. Enforces core UI architecture rules: NO RSuite, Tailwind-first, component reuse, design tokens. Broader scope than component-specific instructions."
applyTo: ["**/*.tsx", "**/*.ts"]
---

# Zapp UI Architecture - General Frontend Rules

**Aplica a**: Todas las vistas, páginas, layouts, features y código UI de Zapp  
**Full doc**: [docs/ui-project-rule-zapp.md](../../docs/ui-project-rule-zapp.md)

---

## 🚫 Prohibiciones Absolutas

### Never Use These Libraries
```tsx
// ❌ BLOQUEADO - Nunca importar
import { Table, Button } from 'rsuite';
import { Button } from '@mui/material';
import { Button } from 'antd';
import { Button } from '@chakra-ui/react';
import styled from 'styled-components';
import { css } from '@emotion/react';
```

**Razón**: Zapp usa arquitectura Tailwind-first custom. RSuite y UI libraries opinionadas están permanentemente prohibidas.

### Never Write Inline Styles (Except Dynamic Values)
```tsx
// ❌ PROHIBIDO
<div style={{ padding: '32px', display: 'flex', gap: '24px' }}>

// ✅ CORRECTO
<div className="p-8 flex gap-6">

// ✅ PERMITIDO (valor dinámico)
<div style={{ width: `${progress}%` }} className="h-2 bg-primary">
```

### Never Use CSS Modules as Default
```tsx
// ❌ EVITAR (solo para casos excepcionales)
import styles from './MyView.module.css';

// ✅ USAR
// Tailwind utilities directamente en className
```

---

## ✅ Reglas Obligatorias

### 1. Tailwind-First Always

**95% de estilos deben ser Tailwind utilities**:

```tsx
// ✅ EXCELENTE - Tailwind puro
function DashboardHeader() {
  return (
    <header className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90">
        Nueva Transacción
      </button>
    </header>
  );
}
```

### 2. Reuse Components, Don't Duplicate

**ANTES de escribir JSX, buscar componente existente**:

```tsx
// ❌ MAL - Duplicando markup
function MyView() {
  return (
    <div className="p-6 bg-white rounded-[24px] shadow-sm">
      <h2 className="text-xl font-bold mb-4">Title</h2>
      <p>Content</p>
    </div>
  );
}

// ✅ BIEN - Reutilizando componente
import { Card } from '@/components/primitives/Card';

function MyView() {
  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Title</h2>
      <p>Content</p>
    </Card>
  );
}
```

**Búsqueda obligatoria antes de crear markup**:
- `src/components/primitives/` - Button, Input, Card, Badge
- `src/components/ui/` - MetricCard, DataTable, StatCard
- `src/components/[feature]/` - Componentes específicos

### 3. Design Tokens - Use from Config

**Colores obligatorios**:
```tsx
// ❌ NUNCA hardcodear
className="bg-[#175ab1]"
style={{ backgroundColor: '#175ab1' }}

// ✅ SIEMPRE usar tokens
className="bg-primary"          // #175ab1
className="bg-secondary"        // #4c5e82
className="bg-cream"            // #FDFCF9 (page background)
className="bg-navy-dark"        // #002948 (sidebar)
```

**Spacing - Grid 4px**:
```tsx
// ❌ Valores arbitrarios
className="p-[17px] gap-[13px]"

// ✅ Escala Tailwind
className="p-4 gap-3"    // 16px, 12px
className="p-6 gap-6"    // 24px, 24px
className="p-8 gap-8"    // 32px, 32px
```

**Border Radius**:
```tsx
className="rounded-lg"        // 8px - inputs, badges
className="rounded-xl"        // 12px - buttons
className="rounded-[24px]"    // 24px - cards
className="rounded-[32px]"    // 32px - hero cards
```

### 4. TypeScript Interfaces for Props

```tsx
// ✅ Siempre tipar props
interface DashboardViewProps {
  year: number;
  onYearChange: (year: number) => void;
  isLoading?: boolean;
}

function DashboardView({ year, onYearChange, isLoading = false }: DashboardViewProps) {
  // ...
}
```

### 5. Responsive Mobile-First

```tsx
// ✅ Siempre considerar responsive
<div className="
  grid 
  grid-cols-1           /* mobile: 1 columna */
  md:grid-cols-2        /* tablet: 2 columnas */
  lg:grid-cols-3        /* desktop: 3 columnas */
  gap-6
">
```

---

## 🎨 UX Visual Rules - Quick Checklist

### Acciones vs Datos

```tsx
// ✅ Acciones se ven como acciones
<button className="bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90">
  Guardar
</button>

// ✅ Datos se ven como datos (no clickeables)
<span className="text-gray-900 font-semibold tabular-nums">
  $12,450
</span>
```

### Jerarquía Visual

**Solo UNA acción primaria por vista**:
```tsx
// ✅ Una primaria (bg-primary), otras secundarias o ghost
<div className="flex gap-3">
  <button className="bg-primary text-white px-4 py-2 rounded-xl">
    Guardar  {/* PRIMARIA */}
  </button>
  <button className="bg-transparent text-primary px-4 py-2 rounded-xl hover:bg-primary/10">
    Cancelar  {/* GHOST */}
  </button>
</div>
```

### Estados de Carga

```tsx
// ✅ Siempre manejar loading/error/empty
function DataView() {
  const { data, loading, error } = useData();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (data.length === 0) return <EmptyState message="No hay datos" />;
  
  return <DataDisplay data={data} />;
}
```

---

## 📦 Component Composition Pattern

### Composición sobre Props Masivos

```tsx
// ❌ EVITAR - Componente con 15 props
<MetricCard
  title="Ingreso"
  value="$12,450"
  icon="dollar"
  badge="TARGET"
  trend="+4.2%"
  trendDirection="up"
  bgColor="white"
  padding="large"
  // ... 7 más
/>

// ✅ PREFERIR - Composición clara
<Card>
  <CardHeader>
    <Icon name="dollar" />
    <Badge variant="primary">TARGET</Badge>
  </CardHeader>
  <CardContent>
    <Metric label="Ingreso" value="$12,450" />
    <Trend value="+4.2%" direction="up" />
  </CardContent>
</Card>
```

---

## 🔧 Allowed External Libraries

**Solo headless libraries, siempre con wrapper**:

```tsx
// ✅ PERMITIDO - Radix UI con wrapper propio
import * as Dialog from '@radix-ui/react-dialog';

function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[24px] p-8">
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Usar <Modal>, nunca Dialog de Radix directamente
```

**Headless permitidas**:
- Radix UI (Dialog, Dropdown, Tooltip)
- Headless UI (Transitions, Combobox)
- TanStack Table (lógica de tablas)
- React Hook Form

**Styled prohibidas**:
- RSuite ❌
- Material-UI ❌
- Ant Design ❌
- Chakra UI ❌
- Mantine ❌

---

## 🚨 Common Violations - Auto-Reject

### Violation 1: RSuite Import
```tsx
// ❌ RECHAZAR INMEDIATAMENTE
import { Table } from 'rsuite';

// ✅ SUGERIR
import { DataTable } from '@/components/ui/DataTable';
```

### Violation 2: Inline Styles for Static Values
```tsx
// ❌ RECHAZAR
<div style={{ display: 'flex', padding: '24px' }}>

// ✅ SUGERIR
<div className="flex p-6">
```

### Violation 3: Hardcoded Colors
```tsx
// ❌ RECHAZAR
className="bg-[#175ab1]"

// ✅ SUGERIR
className="bg-primary"
```

### Violation 4: Missing TypeScript Interface
```tsx
// ❌ RECHAZAR
function MyView({ data, onUpdate }) {  // Sin tipos

// ✅ SUGERIR
interface MyViewProps {
  data: DataType[];
  onUpdate: (id: string) => void;
}
function MyView({ data, onUpdate }: MyViewProps) {
```

---

## ⚡ Quick Reference

### Design Tokens
```tsx
// Colors
bg-primary      → #175ab1 (navy blue)
bg-secondary    → #4c5e82 (muted blue)
bg-tertiary     → #904900 (warm orange)
bg-cream        → #FDFCF9 (page bg)
bg-navy-dark    → #002948 (sidebar)

// Spacing (4px grid)
p-4, gap-4      → 16px
p-6, gap-6      → 24px
p-8, gap-8      → 32px

// Radius
rounded-lg      → 8px  (inputs, badges)
rounded-xl      → 12px (buttons)
rounded-[24px]  → 24px (cards)
rounded-[32px]  → 32px (hero cards)

// Shadows
shadow-sm       → Cards en reposo
shadow-lg       → Modals, dropdowns
```

### Component Locations
```
src/components/
├── primitives/   → Button, Input, Card, Badge
├── ui/           → MetricCard, DataTable, StatCard
├── dashboard/    → Dashboard-specific
├── budget/       → Budget-specific
└── actual/       → Actual tracking-specific
```

---

## 🎯 Before Committing Code

**5-Second Validation**:

1. ✅ ¿Usa Tailwind para estilos (no inline, no CSS modules)?
2. ✅ ¿Reutiliza componentes existentes de `/components/`?
3. ✅ ¿NO importa RSuite, Material-UI, Ant Design?
4. ✅ ¿Usa design tokens (`bg-primary`, no `bg-[#175ab1]`)?
5. ✅ ¿Tiene TypeScript interfaces para props?
6. ✅ ¿Es responsive (funciona en mobile)?
7. ✅ ¿Una sola acción primaria visible por vista?
8. ✅ ¿Maneja estados loading/error/empty?

**Si falla alguna**: Refactorizar antes de continuar.

---

## 📚 More Resources

- **Full rule**: [docs/ui-project-rule-zapp.md](../../docs/ui-project-rule-zapp.md)
- **Component-specific**: [.github/instructions/ui-components-zapp.instructions.md](./ui-components-zapp.instructions.md)
- **Decisions context**: [docs/ui-mapping-decisions-zapp.md](../../docs/ui-mapping-decisions-zapp.md)

---

**Enforcement**: Obligatorio para TODO código UI  
**Violations**: Rechazar en code review  
**Questions**: Ver full doc o consultar con lead
