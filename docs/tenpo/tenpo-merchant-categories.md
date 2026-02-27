# Sistema de Categorías de Comercios Tenpo

## 📋 Overview

Sistema de categorización jerárquica de comercios de Tenpo para organizar gastos y facilitar análisis financiero.

---

## 🎯 Objetivos

- Clasificar comercios de Tenpo en una jerarquía configurable de 3 niveles
- Proporcionar UI para gestionar árbol de categorías
- Integrar categorías en vistas de Actual y Presupuesto como dimensión adicional
- Preparar modelo para analytics futuros

---

## 📊 Modelo de Datos

### Jerarquía de 3 Niveles

```
Nivel 1: Categoría Principal (ej: Alimentos)
  └─ Nivel 2: Subcategoría (ej: Restaurantes)
      └─ Nivel 3: Comercio (ej: McDonald's)
```

**Características:**
- Nivel base siempre es "Comercio" (merchant real)
- Completamente configurable (usuario define categorías)
- Categoría por defecto: "Sin Categorizar"
- Auto-referencia para jerarquía (parent/children)

### Schema Prisma

```prisma
model MerchantCategory {
  id              Int                  @id @default(autoincrement())
  name            String
  parentId        Int?                 @map("parent_id")
  parent          MerchantCategory?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        MerchantCategory[]   @relation("CategoryHierarchy")
  level           Int                  @default(1) // 1, 2, o 3
  order           Int                  @default(0) // Orden visual en UI
  color           String?              // Hex color para UI (#FF5733)
  icon            String?              // Emoji o icon name
  isSystem        Boolean              @default(false) @map("is_system") // Para "Sin Categorizar"
  merchants       MerchantMapping[]
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@map("merchant_categories")
}

model MerchantMapping {
  id              Int                  @id @default(autoincrement())
  merchantName    String               @unique @map("merchant_name") // Nombre del comercio
  categoryId      Int                  @map("category_id")
  category        MerchantCategory     @relation(fields: [categoryId], references: [id])
  matchPattern    String?              @map("match_pattern") // Para futuro auto-matching
  confidence      Float?               // Para futuro ML (0.0 - 1.0)
  assignedBy      String               @default("MANUAL") @map("assigned_by") // MANUAL | AUTO | ML
  createdAt       DateTime             @default(now()) @map("created_at")
  updatedAt       DateTime             @updatedAt @map("updated_at")
  
  @@index([categoryId])
  @@map("merchant_mappings")
}
```

### Campos Preparados para Futuro

**Analytics:**
- `order`: Para ordenar en gráficos y reportes
- `color`: Para consistencia visual en charts
- `confidence`: Score de ML para asignación automática

**Auto-matching:**
- `matchPattern`: Regex o patrón para matching automático
- `assignedBy`: Trazabilidad de cómo se asignó

---

## 🔌 API Routes

### Categorías

**GET /api/tenpo/categories**
- Lista todas las categorías en estructura de árbol
- Query params: `?flat=true` para lista plana

**POST /api/tenpo/categories**
- Crea nueva categoría
- Body: `{ name, parentId?, level, color?, icon?, order? }`

**PUT /api/tenpo/categories/:id**
- Actualiza categoría existente
- Body: `{ name?, parentId?, color?, icon?, order? }`

**DELETE /api/tenpo/categories/:id**
- Elimina categoría (solo si no tiene comercios asignados)
- Mueve children a parent o a "Sin Categorizar"

**GET /api/tenpo/categories/tree**
- Retorna árbol completo con contadores de comercios

### Asignaciones (Mappings)

**GET /api/tenpo/merchants/uncategorized**
- Lista comercios sin categoría asignada
- Para facilitar asignación masiva

**GET /api/tenpo/merchants**
- Lista todos los comercios únicos de TenpoPurchases
- Con su categoría actual (o null)

**POST /api/tenpo/merchants/:merchantName/category**
- Asigna comercio a categoría
- Body: `{ categoryId }`

**DELETE /api/tenpo/merchants/:merchantName/category**
- Remueve asignación (vuelve a "Sin Categorizar")

### Analytics (Futuro)

**GET /api/tenpo/analytics/by-category**
- Gastos agregados por categoría
- Query params: `?year=2026&month=2&level=1`

---

## 🎨 UI Components

### 1. Página de Gestión: `/tenpo/categorias`

**Features:**
- Tree view jerárquico (3 niveles máximo)
- CRUD inline para categorías
- Drag & drop para reordenar
- Color picker por categoría
- Emoji picker para iconos
- Panel lateral: "Comercios sin categorizar" (N items)
- Asignación rápida: comercio → categoría (autocomplete)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🏷️  Gestión de Categorías                      │
├─────────────────────┬───────────────────────────┤
│  Árbol Categorías   │  Comercios sin Categoría  │
│                     │                           │
│  📁 Alimentos (12)  │  • Comercio X             │
│    ├─ 🍔 Fast Food  │  • Comercio Y   [Asignar]│
│    │   └─ McDonald's│  • Comercio Z             │
│    ├─ 🍕 Restau...  │                           │
│    └─ 🛒 Super...   │  Total: 5 sin asignar     │
│                     │                           │
│  📁 Transporte (8)  │  [Buscar comercio...]     │
│    └─ 🚕 Rideshare  │                           │
│                     │                           │
│  [+ Nueva Categoría]│                           │
└─────────────────────┴───────────────────────────┘
```

**Componentes RSuite:**
- `Tree` para jerarquía
- `Modal` para edición
- `ColorPicker` o custom para colores
- `AutoComplete` para asignación
- `IconButton`, `Button`, `Badge`

### 2. Integración en ActualTenpo

**Cambios:**
- Agregar columna "Categoría" (mostrar nivel 1 o path completo)
- Agregar filtro por categoría en header
- Dashboard: card adicional "Por Categoría" (top 3)
- Sort por categoría
- Badge con color de categoría

### 3. Integración en Dashboard Tenpo

**Nuevo card en DashboardTenpo:**
```tsx
{
  title: "Por Categoría",
  content: "Top 3 categorías del mes"
}
```

---

## 🔄 Flujo de Implementación

### Fase 1: Modelo y Backend
1. ✅ Especificación técnica (este doc)
2. ⏳ Actualizar schema.prisma
3. ⏳ Crear migración
4. ⏳ Seeds: categoría "Sin Categorizar" (isSystem=true)
5. ⏳ Implementar routes de categorías
6. ⏳ Implementar routes de merchants/mappings
7. ⏳ Tests básicos

### Fase 2: UI Gestión
8. ⏳ Crear página TenpoCategories.tsx
9. ⏳ Componente CategoryTree
10. ⏳ Componente UnassignedMerchants
11. ⏳ CRUD modals
12. ⏳ Asignación rápida
13. ⏳ Agregar ruta en Sidebar

### Fase 3: Integración Vistas
14. ⏳ Modificar ActualTenpoTable (columna categoría)
15. ⏳ Agregar filtro por categoría
16. ⏳ Dashboard: card categorías
17. ⏳ Sort por categoría

### Fase 4: Analytics (Futuro)
18. ⏳ Endpoint analytics/by-category
19. ⏳ Gráficos y reportes
20. ⏳ Trends mensuales

---

## 🗃️ Data Seeds Inicial

```typescript
// Crear categoría por defecto al inicializar DB
{
  name: "Sin Categorizar",
  parentId: null,
  level: 1,
  order: 999,
  color: "#999999",
  icon: "❓",
  isSystem: true
}
```

---

## 📐 Reglas de Negocio

1. **Máximo 3 niveles:** UI previene crear nivel 4
2. **Categoría por defecto:** Todo comercio sin mapping → "Sin Categorizar"
3. **Validación de eliminación:** No se puede eliminar categoría con comercios asignados
4. **Categories únicas:** Validar name único por nivel (permitir "Otros" en distintos parents)
5. **System categories:** "Sin Categorizar" no se puede eliminar ni editar name

---

## 🧪 Casos de Uso

### UC1: Crear jerarquía
```
Usuario crea:
  📁 Alimentos
    └─ 🍔 Fast Food
        └─ Asignar "McDonald's", "Burger King"
```

### UC2: Reasignar comercio
```
"Uber Eats" estaba en Transporte
Usuario mueve a: Alimentos > Delivery
```

### UC3: Ver gastos por categoría
```
Vista Actual > Filtro: "Alimentos"
Dashboard muestra: $150,000 en Alimentos este mes
```

### UC4: Comercio nuevo sin categoría
```
Nueva compra en "Comercio Nuevo X"
Aparece automáticamente en "Sin Categorizar"
Usuario asigna manualmente
```

---

## 🚀 Beneficios

- **Organización:** Agrupar gastos de forma significativa
- **Análisis:** Identificar patrones de gasto por área
- **Presupuesto:** Futuro: limitar gasto por categoría
- **Reportes:** "Gasté $X en Alimentos este mes"
- **Flexibilidad:** Usuario define sus propias categorías

---

## 📊 Métricas de Éxito

- % de comercios categorizados (target: >80%)
- Tiempo promedio de categorización
- Número de categorías creadas por usuario
- Uso de filtros por categoría

---

## 🔮 Evolución Futura

### Versión 2.0
- Auto-matching por patrones (regex)
- Sugerencias ML basadas en historial
- Categorías compartidas entre usuarios
- Templates de categorías (presets)

### Versión 3.0
- Presupuesto por categoría
- Alertas de sobregasto por categoría
- Comparación mes a mes por categoría
- Export/Import de configuración de categorías

---

**Fecha:** 2026-02-26  
**Estado:** En Especificación → Implementación  
**Prioridad:** Media-Alta
