# Estándar de Títulos de Página

Este documento define el estándar para los bloques de título en todas las páginas de la aplicación.

## Componente PageTitleSection

**Ubicación:** `node-version/client/src/layout/PageTitleSection.tsx`

### Props

```typescript
interface PageTitleSectionProps {
  title: string;        // Título principal de la página
  description?: string; // Descripción opcional (subtítulo)
  actions?: ReactNode;  // Acciones opcionales alineadas a la derecha
}
```

### Uso Básico

```tsx
import PageTitleSection from '../layout/PageTitleSection';

<PageTitleSection 
  title="🛒 Supermercado"
  description="Planifica el presupuesto mensual de compras de supermercado"
/>
```

### Uso con Acciones

```tsx
<PageTitleSection 
  title="💳 Zapps - Planificador de Suscripciones"
  actions={
    <SelectPicker
      data={years}
      value={currentYear}
      onChange={setCurrentYear}
      style={{ width: 120 }}
    />
  }
/>
```

### Uso con Descripción y Acciones

```tsx
<PageTitleSection 
  title="🏠 Servicios Básicos"
  description="Planifica el presupuesto anual de tus servicios del hogar"
  actions={
    <>
      <SelectPicker value={year} onChange={setYear} />
      <Button onClick={openModal}>Gestionar Servicios</Button>
    </>
  }
/>
```

## Estilos CSS

Los estilos están definidos en `node-version/client/src/index.css`:

```css
.page-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: var(--gray-900);
}

.page-description {
  font-size: 1rem;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.page-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
```

## Guías de Implementación

### ✅ Hacer

- Usar `PageTitleSection` para todos los títulos de página
- Incluir emojis en el texto del título si es apropiado
- Agrupar múltiples acciones usando un Fragment (`<>...</>`)
- Mantener descripciones breves (1-2 líneas)
- Usar componentes RSuite para las acciones

### ❌ No Hacer

- No usar estilos inline en el título
- No agregar clases Tailwind al componente
- No modificar los estilos CSS del componente directamente
- No usar el componente para títulos dentro de secciones (usa `<h2>`, `<h3>`)
- No incluir lógica compleja en las acciones

## Páginas Migradas

- ✅ `App.tsx` - Planificador de Suscripciones
- ✅ `Supermercado.tsx` - Presupuesto de Supermercado

## Páginas Pendientes

- ⏳ `ServiciosBasicos.tsx`
- ⏳ `Creditos.tsx`
- ⏳ `Hipotecario.tsx`
- ⏳ `Ingresos.tsx`
- ⏳ `Presupuesto.tsx`
- ⏳ `Tenpo.tsx`
- ⏳ `TenpoConfig.tsx`

## Beneficios

1. **Consistencia visual** - Todos los títulos se ven iguales
2. **Mantenibilidad** - Cambios centralizados en un solo componente
3. **Accesibilidad** - Estructura semántica correcta
4. **Responsive** - Las acciones se adaptan automáticamente
5. **Sin estilos inline** - Todo controlado por CSS global

## Diferencias con el Sistema Anterior

### Antes

```tsx
<h1 style={{ marginBottom: '1.5rem', color: '#2d7a2d' }}>🛒 Supermercado</h1>
<p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
  Planifica el presupuesto mensual de compras de supermercado
</p>

<div className="card" style={{ marginBottom: '1.5rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
    <SelectPicker ... />
  </div>
</div>
```

### Ahora

```tsx
<PageTitleSection
  title="🛒 Supermercado"
  description="Planifica el presupuesto mensual de compras de supermercado"
  actions={<SelectPicker ... />}
/>
```

**Reducción**: De ~15 líneas a 5 líneas (-67%)

## Notas Técnicas

- El componente usa `ReactNode` para las acciones, permitiendo cualquier elemento React
- Los estilos usan variables CSS (`var(--gray-900)`) para consistencia con el tema
- El layout es flexbox con `justify-content: space-between` para alinear acciones a la derecha
- No hay dependencia de Tailwind CSS
- Compatible con todos los componentes RSuite

## Alcance

Este estándar aplica **solo** al bloque superior de las páginas:
- ✅ Título principal de la página
- ✅ Descripción/subtítulo de la página
- ✅ Acciones globales de la página (selectores, botones principales)

**No aplica** a:
- ❌ Headers de RSuite Table (`<HeaderCell>`)
- ❌ Títulos de secciones dentro de la página (`<h2>`, `<h3>`)
- ❌ Títulos de modales
- ❌ Títulos de cards individuales

## Troubleshooting: Si no se ven cambios

Si después de implementar `PageTitleSection` no ves cambios visuales:

1. **Reiniciar servidor de desarrollo** - Detén `npm run dev` y vuelve a iniciarlo para recargar el CSS
2. **Limpiar caché del navegador** - Ctrl+Shift+R (hard refresh) para forzar recarga de estilos
3. **Verificar en inspector** - F12 → Elements → buscar `class="page-title-section"` para confirmar que se renderiza

### Rutas de Import Correctas

```tsx
// Desde páginas en /pages
import PageTitleSection from '../layout/PageTitleSection';

// Desde App.tsx (raíz de /src)
import PageTitleSection from './layout/PageTitleSection';
```

### Confirmación de Implementación

El componente está correctamente implementado si:
- ✅ `node-version/client/src/main.tsx` importa `./index.css`
- ✅ `node-version/client/src/index.css` contiene las clases `.page-title-section`, `.page-title`, etc.
- ✅ El componente se renderiza con `className="page-title-section"`
- ✅ Las variables CSS `--gray-900` y `--gray-700` están definidas en `:root`
