# Auditoría de Migración de Títulos de Página

Este documento registra la migración de títulos de página al componente estandarizado `PageTitleSection`.

## Páginas Migradas ✅

Las siguientes páginas han sido migradas completamente al nuevo estándar:

### 1. App.tsx (Suscripciones)
**Estado:** ✅ Migrado  
**Cambios:** Eliminados estilos inline, h1 reemplazado por PageTitleSection  
**Acciones:** SelectPicker de año

### 2. Supermercado.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color verde (#2d7a2d) → gris estándar, h1+p reemplazados  
**Acciones:** SelectPicker de año

### 3. ServiciosBasicos.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color verde (#2d7a2d) → gris estándar, eliminado card wrapper  
**Acciones:** SelectPicker de año + Botón "Gestionar Servicios"

### 4. Ingresos.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color verde (#16a34a) → gris estándar, eliminado card wrapper  
**Acciones:** SelectPicker de año + 2 botones (Gestionar Ingresos, Gestionar Bonos)

### 5. Creditos.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color verde (#2d7a2d) → gris estándar, h1+p reemplazados  
**Acciones:** Ninguna (usa YearAndUFSelector aparte)

### 6. Presupuesto.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color azul (#1e40af) → gris estándar, eliminado card wrapper  
**Acciones:** SelectPicker de año

### 7. Hipotecario.tsx
**Estado:** ✅ Migrado  
**Cambios:** Color verde (#2d7a2d) → gris estándar, h1+p reemplazados  
**Acciones:** Ninguna (usa YearAndUFSelector aparte)

### 8. Actual.tsx
**Estado:** ✅ Migrado  
**Cambios:** h1 sin estilos → PageTitleSection, select movido a actions  
**Acciones:** Select nativo de año

## Páginas NO Migradas ⏸️

Las siguientes páginas NO fueron migradas debido a complejidad o uso de patrones especiales:

### 1. Tenpo.tsx
**Razón:** Contiene 2 h1 condicionales con lógica compleja de renderizado  
**Líneas:** 535, 581  
**Riesgo:** Alto - requiere análisis de estados condicionales

### 2. TenpoConfig.tsx
**Razón:** Título simple pero página con estructura de configuración especializada  
**Línea:** 102  
**Riesgo:** Medio - migración segura pero no prioritaria

### 3. ConfiguracionTC.tsx
**Razón:** Usa CSS Modules (styles.configuracionTC__title)  
**Línea:** 75  
**Riesgo:** Alto - requiere refactor de sistema de estilos

## Ejemplo Before/After

### Antes
```tsx
<h1 style={{ marginBottom: '1.5rem', color: '#2d7a2d' }}>🏠 Servicios Básicos</h1>
<p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1rem' }}>
  Planifica el presupuesto anual de tus servicios del hogar
</p>

<div className="card" style={{ marginBottom: '1.5rem' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label style={{ fontWeight: '500', color: '#374151' }}>Año:</label>
      <SelectPicker ... />
    </div>
    <Button ... />
  </div>
</div>
```

### Después
```tsx
<PageTitleSection
  title="🏠 Servicios Básicos"
  description="Planifica el presupuesto anual de tus servicios del hogar"
  actions={
    <>
      <SelectPicker ... />
      <Button ... />
    </>
  }
/>
```

## Resumen de Cambios

- **Total de páginas analizadas:** 11
- **Páginas migradas:** 8 (73%)
- **Páginas pendientes:** 3 (27%)
- **Colores eliminados:** 5 variaciones (#2d7a2d, #16a34a, #1e40af, #666)
- **Líneas de código reducidas:** ~120 líneas eliminadas totalmente

## Beneficios del Estándar

1. **Color unificado:** Todas las páginas usan `var(--gray-900)` (#111827)
2. **Font-weight consistente:** 500 (no bold) en todos los títulos
3. **Sin estilos inline:** Todo controlado por CSS global
4. **Acciones estandarizadas:** Layout predecible de título + descripción + acciones
5. **Mantenibilidad:** Cambiar 1 archivo CSS afecta todas las páginas

## Próximos Pasos

1. Evaluar migración de `TenpoConfig.tsx` (complejidad media)
2. Refactorizar `Tenpo.tsx` para consolidar h1 condicionales
3. Considerar migración de `ConfiguracionTC.tsx` fuera de CSS Modules
4. Documentar patrones de acciones complejas (múltiples botones + SelectPickers)
