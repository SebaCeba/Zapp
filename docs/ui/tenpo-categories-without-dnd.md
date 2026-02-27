# Tenpo Categories - Flujo Sin Drag & Drop

## 📋 Resumen Ejecutivo

Este documento explica el **nuevo flujo de asignación de comercios a categorías** implementado en la página **TenpoMerchantAssignment** (`/tenpo/asignacion`), que **abandona el paradigma de drag & drop** en favor de una interfaz más simple y eficiente basada en **selección múltiple**.

---

## 🚫 Por Qué se Abandonó Drag & Drop

### Problemas Identificados con Drag & Drop

1. **Complejidad Visual Excesiva**
   - El árbol con drag & drop requería múltiples estados visuales (dragging, dragOver, hover)
   - Dificultad para distinguir entre áreas draggables y no-draggables
   - Botones y acciones bloqueaban el inicio del drag (necesitando `data-no-drag`)

2. **Curva de Aprendizaje Alta**
   - Usuarios no intuitivamente entendían que podían arrastrar filas
   - Sensación de "no pesca" - el drag no se iniciaba consistentemente
   - Requería ajustes constantes de sensibilidad (hit area, padding, thresholds)

3. **Limitaciones de RSuite Tree**
   - RSuite Tree v5 tiene problemas con drag & drop personalizado
   - Flechas de expansión duplicadas al combinar drag handlers
   - Conflictos entre RSuite Tree API y HTML5 Drag API nativa

4. **UX en Dispositivos Touch**
   - Drag & drop es difícil en tablets/móviles
   - No hay feedback táctil claro
   - Gestos de scroll confundidos con drag

5. **Escalabilidad**
   - Con 100+ comercios, el drag & drop de uno en uno es ineficiente
   - No hay forma de asignar múltiples comercios a la vez sin drag masivo

### Decisión: Flujo Basado en Selección

Se decidió implementar un **flujo de selección múltiple** que:
- Es más rápido para asignaciones batch
- Tiene curva de aprendizaje cero (select → assign)
- Funciona perfectamente en touch devices
- Es compatible con RSuite Tree sin hacks

---

## 🎯 Nuevo Flujo de Asignación

### Página: `/tenpo/asignacion` (TenpoMerchantAssignment)

### Componentes Principales

1. **Árbol de Categorías (RSuite Tree)**
   - Solo muestra niveles 1 y 2 (excluye level 3)
   - Selección única de categoría destino
   - Searchable para encontrar categorías rápido
   - Muestra contador de comercios por categoría

2. **Selector de Comercios (RSuite TagPicker)**
   - Multi-select de comercios sin categoría
   - Searchable para filtrar por nombre
   - Lista actualizada en tiempo real

3. **Botón "Asignar"**
   - Valida selección de categoría y comercios
   - Llama a `/api/tenpo/merchants/batch-assign`
   - Muestra confirmación/error con toast

---

## 🏗️ Arquitectura Técnica

### 1. Backend Endpoints Utilizados

#### `GET /api/tenpo/categories?flat=true`
**Descripción:** Retorna categorías en lista plana (no jerárquica)

**Response:**
```json
[
  {
    "id": 1,
    "name": "Sin Categorizar",
    "icon": "❓",
    "level": 1,
    "parentId": null,
    "isSystem": true,
    "_count": { "merchants": 45 },
    "parent": null
  },
  {
    "id": 2,
    "name": "Restaurantes",
    "icon": "🍽️",
    "level": 1,
    "parentId": null,
    "isSystem": false,
    "_count": { "merchants": 12 }
  }
  // ... más categorías
]
```

**Filtrado:**
```typescript
const filtered = data.filter(cat => cat.level <= 2);
```

---

#### `GET /api/tenpo/merchants/uncategorized`
**Descripción:** Retorna comercios sin categoría o en "Sin Categorizar"

**Response:**
```json
[
  "UBER EATS",
  "RAPPI",
  "PEDIDOS YA",
  "STARBUCKS",
  "MCDONALDS"
  // ... array de strings
]
```

**Lógica:**
1. Busca todos los merchants únicos en `tenpoPurchase`
2. Filtra los que NO tienen `merchantMapping` (o tienen `categoryId: 1`)
3. Retorna array de strings ordenado

---

#### `POST /api/tenpo/merchants/batch-assign`
**Descripción:** Asigna múltiples comercios a una categoría

**Request Body:**
```json
{
  "merchantNames": ["UBER EATS", "RAPPI", "PEDIDOS YA"],
  "categoryId": 5
}
```

**Response:**
```json
{
  "message": "3 comercio(s) asignado(s) exitosamente",
  "count": 3
}
```

**Validaciones:**
- `merchantNames` debe ser array con al menos un elemento
- `categoryId` debe existir en `MerchantCategory`
- Todos los `merchantNames` deben existir en `tenpoPurchase`
- Si algún merchant no existe, retorna 404 con lista de no encontrados

**Transacción:**
```typescript
await prisma.$transaction(
  merchantNames.map(merchantName =>
    prisma.merchantMapping.upsert({
      where: { merchantName },
      update: { categoryId, assignedBy: 'MANUAL', updatedAt: new Date() },
      create: { merchantName, categoryId, assignedBy: 'MANUAL' }
    })
  )
);
```

---

### 2. Frontend - TenpoMerchantAssignment.tsx

**Ubicación:** `node-version/client/src/pages/TenpoMerchantAssignment.tsx`

#### Estados Principales

```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [uncategorizedMerchants, setUncategorizedMerchants] = useState<string[]>([]);
const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
```

#### Funciones Clave

**`buildTreeData()`** - Construye árbol RSuite
```typescript
const buildTreeData = (): TreeNode[] => {
  const level1Categories = categories.filter(cat => cat.level === 1);
  
  return level1Categories.map(cat1 => {
    const children = categories
      .filter(cat2 => cat2.parentId === cat1.id && cat2.level === 2)
      .map(cat2 => ({
        value: cat2.id.toString(),
        label: `${cat2.icon || ''} ${cat2.name} (${cat2._count?.merchants || 0})`.trim()
      }));

    return {
      value: cat1.id.toString(),
      label: `${cat1.icon || ''} ${cat1.name} (${cat1._count?.merchants || 0})`.trim(),
      children: children.length > 0 ? children : undefined
    };
  });
};
```

**Por qué excluir level 3:**
- El endpoint `batch-assign` acepta cualquier categoría
- Pero UI limita a level 1-2 para simplificar árbol
- Si se necesita level 3, cambiar filtro: `cat => cat.level <= 3`

---

**`handleAssign()`** - Asignación batch
```typescript
const handleAssign = async () => {
  // Validaciones
  if (!selectedCategoryId) {
    toaster.push(<Message type="warning">Selecciona una categoría destino</Message>);
    return;
  }
  if (selectedMerchants.length === 0) {
    toaster.push(<Message type="warning">Selecciona al menos un comercio</Message>);
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/tenpo/merchants/batch-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchantNames: selectedMerchants,
        categoryId: parseInt(selectedCategoryId)
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al asignar comercios');
    }

    const result = await response.json();
    toaster.push(<Message type="success">{result.message}</Message>);

    // Refrescar y limpiar
    setSelectedMerchants([]);
    setSelectedCategoryId(null);
    await fetchUncategorizedMerchants();
    await fetchCategories(); // Actualizar contadores

  } catch (error: any) {
    toaster.push(<Message type="error">{error.message}</Message>);
  } finally {
    setLoading(false);
  }
};
```

**Flujo post-asignación:**
1. Limpiar selecciones (`setSelectedMerchants`, `setSelectedCategoryId`)
2. Refrescar lista de uncategorized (actualiza TagPicker)
3. Refrescar categorías (actualiza contadores en árbol)
4. Toast de éxito/error

---

### 3. Estilos - tenpo-merchant-assignment.css

**Ubicación:** `node-version/client/src/styles/tenpo-merchant-assignment.css`

#### Layout Principal
```css
.tenpo-merchant-assignment-container {
  max-width: 1000px;  /* Ancho máximo para legibilidad */
  margin: 0 auto;
  padding: 24px;
}
```

#### RSuite Tree Customization
```css
.rs-tree {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 8px;
}

.rs-tree-node {
  padding: 4px 0;  /* Espaciado vertical */
}

.rs-tree-node-label {
  font-size: 14px;
}
```

#### TagPicker Customization
```css
.rs-picker-input {
  min-height: 80px;  /* Espacio para múltiples tags */
}

.rs-tag {
  margin: 2px;  /* Espaciado entre tags */
}
```

#### Stats Panel
```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

---

## 🔄 Integración con TenpoCategories Existente

### Navegación

**Desde TenpoCategories.tsx:**
```tsx
<Button onClick={() => navigate('/tenpo/asignacion')}>
  🏪 Asignar Comercios (Sin Drag & Drop)
</Button>
```

**Desde TenpoMerchantAssignment.tsx:**
```tsx
<Button onClick={() => navigate('/tenpo/categories')}>
  ← Volver a Gestión Categorías
</Button>
```

### Separación de Responsabilidades

| Página | Responsabilidad |
|--------|----------------|
| **TenpoCategories** | CRUD de categorías, árbol jerárquico, drag & drop de categorías (opcional) |
| **TenpoMerchantAssignment** | Asignación batch de comercios sin categoría |

**Recomendación:** Mantener ambas páginas y permitir al usuario elegir:
- Drag & drop para ajustes rápidos de 1-2 comercios
- Asignación batch para migraciones masivas o categorización inicial

---

## 📊 Comparación: Drag & Drop vs Selección

| Aspecto | Drag & Drop | Selección Múltiple |
|---------|-------------|-------------------|
| **Velocidad para 1 comercio** | ⚡ Rápido | 🐢 3 clicks |
| **Velocidad para 10+ comercios** | 🐢 Muy lento | ⚡⚡⚡ Extremadamente rápido |
| **Compatibilidad touch** | ❌ Difícil | ✅ Perfecto |
| **Curva de aprendizaje** | 📚 Media-Alta | 📘 Muy baja |
| **Feedback visual** | 🎨 Complejo | 🎯 Simple |
| **Mantenimiento código** | 🔧 Alto | ✅ Bajo |
| **Accesibilidad** | ⚠️ Limitada | ✅ Excelente |
| **RSuite compatibility** | ⚠️ Hacks necesarios | ✅ Nativa |

---

## 🧪 Testing Checklist

### Flujo Principal
- [ ] Cargar página `/tenpo/asignacion` sin errores
- [ ] Árbol muestra categorías level 1 y 2 (excluye level 3)
- [ ] Seleccionar categoría level 1 (sin children) → funciona
- [ ] Seleccionar categoría level 2 (child) → funciona
- [ ] TagPicker muestra todos los uncategorized merchants
- [ ] Buscar merchant en TagPicker → filtra correctamente
- [ ] Seleccionar 1 merchant → contador muestra "1 seleccionado"
- [ ] Seleccionar 5+ merchants → todos aparecen como tags

### Asignación
- [ ] Sin categoría seleccionada → toast warning
- [ ] Sin merchants seleccionados → toast warning
- [ ] Con ambos seleccionados → POST exitoso
- [ ] Después de asignar:
  - [ ] TagPicker se limpia (value vacío)
  - [ ] Categoría se deselecciona
  - [ ] Lista uncategorized se actualiza (menos merchants)
  - [ ] Contadores en árbol se actualizan
  - [ ] Toast success con mensaje correcto

### Edge Cases
- [ ] Asignar último merchant uncategorized → lista queda vacía
- [ ] Asignar a "Sin Categorizar" → funciona (aunque es redundante)
- [ ] Network error → toast error
- [ ] Merchant no existe en backend → toast error con detalle

### Navegación
- [ ] Botón "Volver a Gestión Categorías" → navega a `/tenpo/categories`
- [ ] URL directa `/tenpo/asignacion` → página carga correctamente

---

## 🚀 Extensiones Futuras (No Implementadas)

### 1. Reasignación de Merchants Ya Categorizados
**Actualmente:** Solo muestra uncategorized  
**Mejora:** Agregar pestaña para:
- Seleccionar categoría origen (con árbol)
- Ver merchants de esa categoría
- Multi-select y asignar a nueva categoría

**Implementación:**
```typescript
// Nuevo endpoint GET /api/tenpo/merchants?categoryId=5
router.get('/merchants', async (req, res) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
  
  if (categoryId) {
    const mappings = await prisma.merchantMapping.findMany({
      where: { categoryId },
      select: { merchantName: true }
    });
    return res.json(mappings.map(m => m.merchantName));
  }
  
  // ... resto del endpoint actual
});
```

### 2. Preview de Asignación
**Qué es:** Mostrar tabla de "cambios a realizar" antes de confirmar

**UI:**
| Merchant | Categoría Actual | → | Categoría Nueva |
|----------|------------------|---|-----------------|
| UBER EATS | Sin Categorizar | → | 🍽️ Restaurantes |
| RAPPI | Sin Categorizar | → | 🍽️ Restaurantes |

**Botones:**
- "Confirmar Asignación" (verde)
- "Cancelar" (gris)

### 3. Undo/Redo de Asignaciones
**Implementación:**
- Stack de acciones: `{ action: 'BATCH_ASSIGN', merchantNames, fromCategoryId, toCategoryId, timestamp }`
- Botón "Deshacer última asignación" en UI
- Endpoint: `POST /api/tenpo/merchants/batch-reassign`

### 4. Import/Export CSV
**Import:** Subir CSV con `merchantName,categoryName`  
**Export:** Descargar todas las asignaciones actuales

---

## 🐛 Limitaciones Conocidas

### 1. No permite asignar a Level 3
**Razón:** Árbol solo muestra level 1-2 para simplificar  
**Solución:** Cambiar filtro:
```typescript
const filtered = data.filter(cat => cat.level <= 3);
```

### 2. No muestra merchants ya categorizados
**Razón:** Endpoint `/uncategorized` solo retorna sin categoría  
**Solución:** Implementar pestaña "Reasignar" (ver Extensiones)

### 3. No hay validación de categoría eliminada
**Escenario:** Usuario selecciona categoría, admin elimina categoría desde otra sesión, usuario intenta asignar  
**Comportamiento actual:** Backend retorna 404 "Categoría no encontrada"  
**Mejora:** Refrescar árbol cada 30s con `setInterval`

---

## 📚 Referencias Técnicas

### RSuite Components Usados
- [Tree](https://rsuitejs.com/components/tree/) - Árbol de categorías
- [TagPicker](https://rsuitejs.com/components/tag-picker/) - Multi-select de merchants
- [Message](https://rsuitejs.com/components/message/) - Toast notifications
- [Panel](https://rsuitejs.com/components/panel/) - Contenedores visuales
- [Button](https://rsuitejs.com/components/button/) - Botones de acción

### React Router
- [useNavigate](https://reactrouter.com/en/main/hooks/use-navigate) - Navegación programática

### Prisma ORM
- [upsert](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert) - Create or update
- [$transaction](https://www.prisma.io/docs/concepts/components/prisma-client/transactions) - Batch operations

---

## 📝 Archivos Modificados/Creados

### Nuevos Archivos
1. **`node-version/client/src/pages/TenpoMerchantAssignment.tsx`** (302 líneas)
   - Componente principal con árbol + TagPicker
   - Lógica de asignación batch
   - Toast notifications y error handling

2. **`node-version/client/src/styles/tenpo-merchant-assignment.css`** (97 líneas)
   - Layout responsivo
   - Customización RSuite Tree y TagPicker
   - Stats panel con grid

3. **`docs/ui/tenpo-categories-without-dnd.md`** (este archivo)
   - Documentación completa del nuevo flujo
   - Comparación drag & drop vs selección
   - Testing checklist y extensiones futuras

### Archivos Modificados
1. **`node-version/client/src/router.tsx`**
   - Import de `TenpoMerchantAssignment`
   - Nueva ruta: `/tenpo/asignacion`

---

## 🎓 Lecciones Aprendidas

### 1. KISS (Keep It Simple, Stupid)
Drag & drop es visualmente atractivo pero innecesariamente complejo para tareas batch. Una interfaz simple de select → assign es más eficiente.

### 2. Mobile-First Thinking
Aunque la app sea desktop-focused, considerar touch devices desde el diseño previene refactors costosos.

### 3. Library Limitations
RSuite Tree no fue diseñado para drag & drop custom. Forzar features con hacks genera deuda técnica.

### 4. User Testing Early
Los problemas de sensibilidad del drag & drop se identificaron después de implementar. Un wireframe con usuarios hubiera detectado el problema antes.

---

## 👤 Autor y Cambios

**Creado por:** GitHub Copilot  
**Fecha:** 2026-02-27  
**Versión:** 1.0

### Changelog
- **2026-02-27:** Creación inicial del documento
- **2026-02-27:** Implementación completa de TenpoMerchantAssignment
- **2026-02-27:** Agregada ruta `/tenpo/asignacion` en router

---

## 🔗 Documentación Relacionada

- [tenpo-category-structure-analysis.md](../tenpo/tenpo-category-structure-analysis.md) - Análisis del catálogo de categorías
- [tenpo-tree-spacing.md](tenpo-tree-spacing.md) - Guía de espaciado del árbol con drag & drop
- [tenpo-tree-dnd-sensitivity.md](tenpo-tree-dnd-sensitivity.md) - Mejoras de sensibilidad drag & drop (trabajo previo)
- [TENPO_INTEGRATION.md](../tenpo/TENPO_INTEGRATION.md) - Documentación general de integración Tenpo

---

**Nota Final:** Esta página coexiste con `TenpoCategories.tsx` (drag & drop). El usuario puede elegir el flujo según su caso de uso: drag & drop para ajustes rápidos, batch assignment para categorización masiva.
