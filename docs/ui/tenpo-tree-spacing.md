# Tenpo Tree Spacing - Excel-like Compact Layout

## Objetivo
Crear un árbol de categorías con estilo compacto tipo Excel/OneStream: filas densas, espaciado mínimo, alineación perfecta en columnas.

## Antes vs Después

### ANTES (RSuite Tree con renderizado custom)
- **Problemas identificados:**
  - Flechas duplicadas de RSuite Tree nativo
  - Padding inconsistente entre niveles (0.5rem, 0.75rem, 1rem)
  - FontSize variables (0.75rem, 0.813rem, 0.875rem, 1rem)
  - Margins grandes entre elementos (0.375rem, 0.5rem, 0.75rem)
  - Bold innecesario en nombres de categorías
  - Espaciado vertical excesivo (minHeight: 36px-48px)
  - Gap grande entre iconos y texto (0.375rem-0.5rem)
  - No alineación en columnas (nombres empujados por iconos de tamaño variable)

### DESPUÉS (Custom TreeRow + CSS dedicado)
- **Mejoras implementadas:**
  - ✅ Filas compactas: height fijo de 28px
  - ✅ Padding horizontal mínimo: 2px 8px
  - ✅ Indent progresivo por nivel: `paddingLeft = 8 + (level - 1) * 14px`
  - ✅ Icono fijo de 22px (mantiene alineación incluso sin emoji)
  - ✅ FontSize uniforme: 13px categorías, 12px merchants
  - ✅ Tag de conteo alineado a la derecha sin empujar el nombre
  - ✅ Sin bold innecesario (font-weight: 400)
  - ✅ Spacing vertical mínimo: border-bottom de 1px
  - ✅ Acciones visibles solo al hover (opacity: 0 → 1)
  - ✅ Merchant rows diferenciadas con fondo #fafbfc y borde izquierdo

## Reglas de Spacing

### 1. Altura de Filas
```css
.tenpoTreeRow {
  height: 28px;           /* Fijo para todas las filas */
  padding: 2px 8px;       /* Vertical mínimo, horizontal estándar */
}
```

### 2. Indentación por Nivel
```tsx
// Nivel 1 (principal): paddingLeft = 8 + (1-1)*14 = 8px
// Nivel 2 (subcategoría): paddingLeft = 8 + (2-1)*14 = 22px
// Nivel 3 (comercio): paddingLeft = 8 + (3-1)*14 = 36px
// Merchants: paddingLeft = 8 + level*14 + 14px (extra para indent)

paddingLeft: `${8 + (category.level - 1) * 14}px`
```

**Ajuste para aumentar/reducir indent:**
- Cambiar el multiplicador `14px` en la fórmula
- Ejemplo más estrecho: `level * 12px`
- Ejemplo más ancho: `level * 18px`

### 3. Iconos y Texto
```css
.tenpoTreeIcon {
  width: 22px;            /* Ancho fijo mantiene alineación */
  height: 22px;
  font-size: 14px;        /* Emoji bien visible */
  margin-right: 4px;      /* Gap mínimo al nombre */
}

.tenpoTreeName {
  font-size: 13px;        /* Categorías */
  font-weight: 400;       /* Sin bold */
}

.tenpoTreeMerchantRow .tenpoTreeName {
  font-size: 12px;        /* Merchants más pequeños */
  color: #586069;         /* Gris más suave */
}
```

**Ajuste de tamaños:**
- Categorías más grandes: `.tenpoTreeName { font-size: 14px; }`
- Iconos más pequeños: `.tenpoTreeIcon { width: 18px; height: 18px; font-size: 12px; }`

### 4. Columna Derecha (Tag + Acciones)
```css
.tenpoTreeRight {
  gap: 6px;               /* Gap entre tag y botones */
  margin-left: 8px;       /* Separación del nombre */
  flex-shrink: 0;         /* No colapsa con nombres largos */
}

.tenpoTreeMerchantCount {
  font-size: 11px;        /* Tag compacto */
  padding: 1px 6px;
}

.tenpoTreeActions {
  opacity: 0;             /* Oculto por defecto */
}

.tenpoTreeRow:hover .tenpoTreeActions {
  opacity: 1;             /* Visible al hover */
}
```

### 5. Spacing Vertical
```css
.tenpoTreeRow {
  border-bottom: 1px solid #f0f0f0;  /* Línea sutil entre filas */
  /* Sin margin-bottom ni gap */
}
```

**Ajuste para más/menos densidad:**
- Más espacio: Agregar `margin-bottom: 2px;`
- Líneas más gruesas: `border-bottom: 2px solid #e0e0e0;`
- Sin líneas: `border-bottom: none;`

### 6. Filas de Merchants
```css
.tenpoTreeMerchantRow {
  background-color: #fafbfc;         /* Fondo diferenciado */
  border-left: 2px solid #e1e4e8;    /* Borde izquierdo sutil */
}
```

## Dónde Ajustar Tamaños

### Para cambiar altura total de filas:
**Archivo:** `node-version/client/src/styles/tenpo-tree.css`
**Línea:** `.tenpoTreeRow { height: 28px; }`
**Valores sugeridos:**
- Más compacto: `24px`
- Más espacioso: `32px`
- Excel-like: `28px` (actual)

### Para cambiar indentación entre niveles:
**Archivo:** `node-version/client/src/pages/TenpoCategories.tsx`
**Función:** `TreeRow` y `MerchantRow` components
**Línea:** `paddingLeft: \`\${8 + (category.level - 1) * 14}px\``
**Valores sugeridos:**
- Más estrecho: `* 10px` o `* 12px`
- Más ancho: `* 16px` o `* 18px`
- Excel-like: `* 14px` (actual)

### Para cambiar tamaños de fuente:
**Archivo:** `node-version/client/src/styles/tenpo-tree.css`
**Líneas clave:**
```css
.tenpoTreeName { font-size: 13px; }              /* Categorías */
.tenpoTreeMerchantRow .tenpoTreeName { font-size: 12px; }  /* Merchants */
.tenpoTreeIcon { font-size: 14px; }              /* Emoji iconos */
.tenpoTreeMerchantCount { font-size: 11px; }     /* Tag conteo */
```

### Para cambiar ancho del icono (afecta alineación):
**Archivo:** `node-version/client/src/styles/tenpo-tree.css`
**Línea:** `.tenpoTreeIcon { width: 22px; height: 22px; }`
**⚠️ IMPORTANTE:** Si cambias el ancho, la alineación del texto cambiará. Todas las categorías comparten el mismo ancho de icono para mantener columnas perfectas.

### Para mostrar/ocultar acciones sin hover:
**Archivo:** `node-version/client/src/styles/tenpo-tree.css`
**Líneas:**
```css
.tenpoTreeActions { opacity: 0; }              /* Cambiar a opacity: 1 para siempre visible */
.tenpoTreeRow:hover .tenpoTreeActions { opacity: 1; }  /* Eliminar para deshabilitar hover */
```

## Layout General

### Estructura de TreeRow
```
┌─────────────────────────────────────────────────────────────┐
│ [▶] [🚗] Transporte              [5]  [+Sub] [✏️] [🗑️]    │ 28px
├─────────────────────────────────────────────────────────────┤
│     [▼] [⛽] Combustible         [3]  [+Sub] [✏️] [🗑️]    │ 28px
├─────────────────────────────────────────────────────────────┤
│         [📍] Copec                    [🗑️]                 │ 28px (merchant)
├─────────────────────────────────────────────────────────────┤
│         [📍] Shell                    [🗑️]                 │ 28px (merchant)
└─────────────────────────────────────────────────────────────┘
         ↑      ↑                        ↑     ↑
      expand  icon                     tag  actions
       14px   22px                     auto  hover-only
```

### Indent Calculation
```
Base: 8px
Level 1: 8 + (1-1)*14 = 8px
Level 2: 8 + (2-1)*14 = 22px  (+14px)
Level 3: 8 + (3-1)*14 = 36px  (+14px)
Merchant in Level 2: 8 + 2*14 + 14 = 50px  (+extra 14px)
```

## Componentes Implementados

### 1. TreeRow Component
**Props:**
- `category: Category` - Datos de la categoría
- `isDragOver: boolean` - Estado de drag over
- `onDragStart/End/Over/Leave/Drop` - Handlers de drag & drop
- `onToggleExpand` - Función para expandir/colapsar
- `isExpanded: boolean` - Estado de expansión

**Responsabilidades:**
- Renderiza una sola fila de categoría
- Maneja el indent según `category.level`
- Muestra icono fijo de 22px
- Muestra tag con conteo de merchants
- Muestra botones de acción al hover
- Aplica clases CSS según estado (dragging, dragOver, system)

### 2. MerchantRow Component
**Props:**
- `merchantName: string` - Nombre del comercio
- `categoryLevel: number` - Nivel de la categoría padre (para indent)
- `onDragStart/End` - Handlers de drag
- `onRemove` - Handler para eliminar

**Responsabilidades:**
- Renderiza una sola fila de merchant
- Indent extra respecto a categoría padre
- Icono fijo 📍
- Fondo diferenciado (#fafbfc)
- Borde izquierdo para indicar que es hijo

### 3. renderTreeRecursive Function
**Parámetros:**
- `cats: Category[]` - Array de categorías a renderizar

**Retorno:**
- `JSX.Element[]` - Array de elementos React

**Lógica:**
1. Recorre cada categoría
2. Renderiza TreeRow
3. Si expandida, renderiza merchants hijos
4. Recursivamente renderiza children categories

## Drag & Drop Preservado

### Estados de drag mantenidos:
- `draggedMerchant: string | null`
- `draggedCategory: Category | null`
- `dragOverCategoryId: number | null`

### Handlers preservados:
- `handleDragStart(e, merchantName, sourceCategoryId)`
- `handleCategoryDragStart(e, category)`
- `handleDragEnd(e)`
- `handleDragOver(e, categoryId)`
- `handleDragLeave(e)`
- `handleDrop(e, categoryId)`

### Visual feedback:
```css
.tenpoTreeRow.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.tenpoTreeRow.dragOver {
  background-color: #e3f2fd;
  border: 1px dashed #2196f3;
}
```

## Testing Checklist

- [ ] Nivel 1 categorías muestran indent de 8px
- [ ] Nivel 2 categorías muestran indent de 22px
- [ ] Nivel 3 categorías muestran indent de 36px
- [ ] Merchants tienen indent extra (+14px del padre)
- [ ] Iconos de 22px mantienen alineación perfecta
- [ ] Nombres no se empujan con iconos variables
- [ ] Tag de conteo aparece a la derecha
- [ ] Acciones visibles solo al hover
- [ ] Drag & drop funciona en categorías
- [ ] Drag & drop funciona en merchants
- [ ] Expandir/colapsar funciona
- [ ] Categorías sistema no son draggables
- [ ] Filas tienen exactamente 28px de altura
- [ ] No hay espacios verticales extra entre filas

## Referencias de Archivos

### CSS Principal
- **`node-version/client/src/styles/tenpo-tree.css`**
  - Todas las clases de estilo
  - Spacing, sizing, colors
  - Hover states
  - Drag visual feedback

### Componente React
- **`node-version/client/src/pages/TenpoCategories.tsx`**
  - Import de Tag desde rsuite (línea 3)
  - Import del CSS (línea 9)
  - Interface TreeRowProps (después de toMultiCascadeTreeData)
  - TreeRow component
  - MerchantRow component
  - renderTreeRecursive function
  - Reemplazo del placeholder (línea ~648)

## Extensiones Futuras

### 1. Resizable Columns
Actualmente el layout usa `justify-content: space-between`. Para hacer columnas redimensionables:
- Cambiar a `display: grid` en `.tenpoTreeRow`
- Definir `grid-template-columns: 1fr auto auto`
- Agregar resize handles entre columnas

### 2. Virtual Scrolling
Para árboles con miles de nodos:
- Implementar `react-window` o `react-virtualized`
- Calcular altura total basado en nodos visibles
- Renderizar solo items del viewport

### 3. Multi-select
Para batch actions en merchants:
- Agregar checkbox en `.tenpoTreeLeft`
- Estado `selectedMerchants: Set<string>`
- Acciones batch en toolbar superior

### 4. Keyboard Navigation
- Tab/Shift+Tab: mover entre filas
- Arrow Up/Down: navegar tree
- Arrow Right/Left: expand/collapse
- Enter: editar
- Delete: eliminar
