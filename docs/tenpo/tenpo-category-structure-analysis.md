# Análisis de Estructura de Categorías de Tenpo

## 1. Archivos Fuente

### Backend (Base de Datos y API)
- **`node-version/prisma/schema.prisma`** (líneas 307-340)
  - Modelo `MerchantCategory`: Define la estructura de categorías con self-referential relation
  - Modelo `MerchantMapping`: Mapea comercios a categorías

- **`node-version/src/routes/merchant-categories.ts`** (306 líneas)
  - GET `/api/tenpo/categories` - Lista árbol jerárquico o plano con `?flat=true`
  - GET `/api/tenpo/categories/:id` - Detalle de categoría
  - POST `/api/tenpo/categories` - Crear categoría
  - PUT `/api/tenpo/categories/:id` - Actualizar categoría
  - DELETE `/api/tenpo/categories/:id` - Eliminar categoría

- **`node-version/src/routes/merchant-mappings.ts`** 
  - GET `/api/tenpo/merchants` - Lista comercios con sus categorías
  - GET `/api/tenpo/merchants/uncategorized` - Comercios sin categoría
  - POST `/api/tenpo/merchants/:merchantName/category` - Asignar categoría
  - DELETE `/api/tenpo/merchants/:merchantName/category` - Remover categoría
  - POST `/api/tenpo/merchants/batch-assign` - Asignación por lotes

- **`node-version/prisma/seed.ts`**
  - Crea categoría sistema "Sin Categorizar" (`isSystem: true`)

### Frontend
- **`node-version/client/src/pages/TenpoCategories.tsx`** (924 líneas)
  - Interface `Category` (líneas 10-25)
  - Gestión completa de categorías con drag & drop
  - Batch assignment de comercios

## 2. Shape Actual (Interfaces)

### Backend (Prisma Schema)
```prisma
model MerchantCategory {
  id              Int                  @id @default(autoincrement())
  name            String
  parentId        Int?                 @map("parent_id")
  parent          MerchantCategory?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        MerchantCategory[]   @relation("CategoryHierarchy")
  level           Int                  @default(1) // 1, 2, o 3
  order           Int                  @default(0) // Orden visual
  color           String?              // Hex color (#FF5733)
  icon            String?              // Emoji o icon name
  isSystem        Boolean              @default(false) @map("is_system")
  merchants       MerchantMapping[]
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}

model MerchantMapping {
  id              Int                  @id @default(autoincrement())
  merchantName    String               @unique @map("merchant_name")
  categoryId      Int                  @map("category_id")
  category        MerchantCategory     @relation(fields: [categoryId], references: [id])
  matchPattern    String?              @map("match_pattern")
  confidence      Float?               // 0.0 - 1.0
  assignedBy      String               @default("MANUAL")
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
}
```

### Frontend (TypeScript Interface)
```typescript
interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;            // 1 (principal), 2 (subcategoría), 3 (comercio)
  order: number;            // Orden visual en UI
  color: string | null;     // Hex color para UI
  icon: string | null;      // Emoji o icon name
  isSystem: boolean;        // true para "Sin Categorizar"
  children?: Category[];    // Recursivo - anidamiento hasta nivel 3
  _count?: {
    merchants: number;      // Cantidad de comercios asignados
    children: number;       // Cantidad de subcategorías
  };
}

interface Merchant {
  name: string;
  category: Category | null;
}
```

## 3. Jerarquía

**SÍ, es jerárquica** con self-referential relation:

### Características:
- **Máximo 3 niveles de profundidad**:
  1. **Nivel 1**: Categorías principales (parentId: null)
  2. **Nivel 2**: Subcategorías (parentId → Nivel 1)
  3. **Nivel 3**: Comercios individuales (parentId → Nivel 2)

- **Estructura recursiva**: 
  - `parentId` apunta al ID del padre
  - `children` contiene array de hijos anidados
  - El backend devuelve el árbol completo con todos los children anidados

### Ejemplo de estructura jerárquica:
```json
[
  {
    "id": 1,
    "name": "Auto",
    "parentId": null,
    "level": 1,
    "icon": "🚗",
    "children": [
      {
        "id": 2,
        "name": "Combustible",
        "parentId": 1,
        "level": 2,
        "children": [
          {
            "id": 3,
            "name": "Copec",
            "parentId": 2,
            "level": 3,
            "_count": { "merchants": 5 }
          }
        ]
      }
    ]
  }
]
```

## 4. Función de Transformación Implementada

### Ubicación
**`node-version/client/src/pages/TenpoCategories.tsx`** (después de la función `flatCategories()`)

### Firma
```typescript
const toMultiCascadeTreeData = (
  source: Category[]
): Array<{
  label: string;
  value: number;
  children?: Array<{
    label: string;
    value: number;
    children?: Array<{
      label: string;
      value: number
    }>
  }>
}> => { ... }
```

### Implementación
```typescript
/**
 * Transforma el catálogo de categorías jerárquico a formato TreeNode compatible con RSuite MultiCascadeTree
 * @param source - Array de categorías con estructura recursiva (children)
 * @returns Array de TreeNode con { label, value, children }
 */
const toMultiCascadeTreeData = (source: Category[]): Array<{
  label: string;
  value: number;
  children?: Array<{
    label: string;
    value: number;
    children?: Array<{ label: string; value: number }>
  }>
}> => {
  return source.map(category => {
    const node: {
      label: string;
      value: number;
      children?: Array<{
        label: string;
        value: number;
        children?: Array<{ label: string; value: number }>
      }>
    } = {
      label: `${category.icon || ''} ${category.name}`.trim(),
      value: category.id
    };

    // Recursivamente agregar children si existen
    if (category.children && category.children.length > 0) {
      node.children = toMultiCascadeTreeData(category.children);
    }

    return node;
  });
};
```

### Características:
- **Recursiva**: Maneja jerarquías de 1 a 3 niveles automáticamente
- **Incluye iconos**: Combina emoji/icon con nombre en el label
- **Compatible con RSuite**: Formato `{ label, value, children }`
- **Type-safe**: Tipado completo con inferencia hasta 3 niveles

### Uso
```typescript
// En el componente
const treeData = toMultiCascadeTreeData(categories);

// Ejemplo con MultiCascadeTree (RSuite)
<MultiCascadeTree
  data={treeData}
  labelKey="label"
  valueKey="value"
  childrenKey="children"
/>
```

## 5. API Endpoints Disponibles

### Categorías
- `GET /api/tenpo/categories` - Árbol jerárquico completo
- `GET /api/tenpo/categories?flat=true` - Lista plana con parent info
- `GET /api/tenpo/categories/:id` - Detalle con children
- `POST /api/tenpo/categories` - Crear (body: name, parentId?, level, icon?, color?)
- `PUT /api/tenpo/categories/:id` - Actualizar
- `DELETE /api/tenpo/categories/:id` - Eliminar (valida children y merchants)

### Merchants
- `GET /api/tenpo/merchants` - Todos con category populated
- `GET /api/tenpo/merchants/uncategorized` - Sin categoría
- `POST /api/tenpo/merchants/:merchantName/category` - Asignar (body: categoryId)
- `DELETE /api/tenpo/merchants/:merchantName/category` - Remover
- `POST /api/tenpo/merchants/batch-assign` - Batch (body: merchantNames[], categoryId)

## 6. Consideraciones

### Limitaciones
- Máximo 3 niveles de profundidad (validado en backend)
- Categoría "Sin Categorizar" (isSystem: true) no se puede editar/eliminar
- No se puede mover categoría a sus propios descendientes (validación de ciclos)

### Features Implementadas
- Drag & drop de merchants a categorías
- Drag & drop de categorías para cambiar jerarquía
- Batch assignment de múltiples merchants
- Expansión/colapso de categorías
- Visualización de cantidad de merchants por categoría
- Búsqueda y filtrado en tiempo real
- Keyboard shortcuts (Ctrl+K, /, Escape)

### Próximos Pasos Sugeridos
1. Implementar visualización con MultiCascadeTree de RSuite
2. Agregar auto-categorización con matchPattern (regex)
3. Implementar ML scoring con campo confidence
4. Agregar analytics por categoría (totales, promedios)
