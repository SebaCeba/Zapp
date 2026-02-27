# Auditoría: Gráfico Interactivo de Composición por Categoría (Actual - Tenpo TC)

Este documento detalla el análisis y plan para implementar un gráfico interactivo sobre la tabla de movimientos actuales de Tenpo TC.

## 1. Contexto y Vista Objetivo

*   **Página Principal:** `node-version/client/src/pages/ActualTenpo.tsx`
    *   Gestiona el estado del mes/año seleccionado y obtiene la data (`purchases`).
*   **Componente de Tabla:** `node-version/client/src/components/actual/ActualTenpoTable.tsx`
    *   Renderiza el listado de compras y maneja su propio ordenamiento y búsqueda por texto.

## 2. Mapa de Datos

*   **Origen del Dataset:**
    *   `ActualTenpo.tsx` carga las compras.
    *   El estado `purchases` contiene un array de objetos `Purchase`.
*   **Estructura de Fila (Interfaz `Purchase`):**
    *   Definida en `ActualTenpo.tsx` y `ActualTenpoTable.tsx`.
    *   Campo relevante: `category` (objeto o null).
        ```ts
        category?: {
          id: number;
          name: string;
          icon: string | null;
          color: string | null;
        } | null;
        ```
    *   Otros campos: `merchant` (nombre comercio), `installments` (para calcular montos del mes).
*   **Representación "Sin Categoría":**
    *   El campo `category` es `null` o `undefined`.

## 3. Stack de UI Actual

*   **Librería de Gráficos:**
    *   `recharts` (v2.x) está instalada y en uso en el proyecto.
*   **Componentes de UI:**
    *   `rsuite` se usa para modales, botones y selectores.
    *   Estilos inline y clases CSS estándar (`card`, `category-section`).

## 4. Diseño Propuesto (Mínimo)

### Estado y Ubicación
*   **Estado `selectedCategoryFilter`:**
    *   Ubicación: `ActualTenpo.tsx` (Componente Padre).
    *   Tipo: `string | null` (Nombre de la categoría o ID. Usar Nombre es más fácil para el gráfico, ID es más robusto. Se sugiere usar **Nombre** para agrupar visualmente, manejando "Sin Categoría" como string especial).
*   **Lógica de Filtrado:**
    *   En `ActualTenpo.tsx`, calcular `filteredPurchases` antes de pasarlo a la tabla.
    *   Si `selectedCategoryFilter` es null -> pasar `purchases` completo.
    *   Si tiene valor -> calcular un subset donde `(p.category?.name || 'Sin Categoría') === selectedCategoryFilter`.

### Interacción UI
*   **Nuevo Componente Gráfico:**
    *   Se ubicará entre el `PageTitleSection` y `ActualTenpoTable` en `ActualTenpo.tsx`.
    *   Mostrará un `PieChart` (Donut) con los montos totales por categoría del mes actual.
*   **Wiring:**
    *   Click en segmento del gráfico -> `setSelectedCategoryFilter(payload.name)`.
    *   Si se clickea la misma -> `setSelectedCategoryFilter(null)` (toggle).
    *   Botón "Limpiar Filtro" visible cuando hay selección activa.

## 5. Plan Mínimo de Implementación

### Paso 1: Crear Componente `CategoryCompositionChart`
*   **Archivo:** `node-version/client/src/components/actual/CategoryCompositionChart.tsx`
*   **Props:**
    *   `data`: `Purchase[]`
    *   `selectedCategory`: `string | null`
    *   `onSelectCategory`: `(category: string | null) => void`
*   **Lógica:**
    *   Procesar `data` para sumar `finalMonthlyAmountClp` de las cuotas del mes actual, agrupando por `category.name` (o "Sin Categoría").
    *   Renderizar `Recharts` (`PieChart` con `Pie` innerRadius > 0 para efecto Donut).
    *   Manejar `onClick` (`entry.name`).

### Paso 2: Agregar Estado y Wiring en `ActualTenpo.tsx`
*   Agregar `const [categoryFilter, setCategoryFilter] = useState<string | null>(null);`
*   Computar datos filtrados:
    ```typescript
    const filteredPurchases = useMemo(() => {
      if (!categoryFilter) return purchases;
      return purchases.filter(p => {
        const catName = p.category?.name || 'Sin Categoría';
        return catName === categoryFilter;
      });
    }, [purchases, categoryFilter]);
    ```
*   Renderizar `<CategoryCompositionChart />` pasando `purchases` (data completa) y setters.

### Paso 3: Actualizar renderizado de Tabla
*   Cambiar la prop pasada a `ActualTenpoTable`:
    *   Antes: `<ActualTenpoTable purchases={purchases} ... />`
    *   Después: `<ActualTenpoTable purchases={filteredPurchases} ... />`
*   *Nota:* Como `ActualTenpoTable` muestra totales basados en sus props, al recibir datos filtrados, los totales de la tabla reflejarán solo la categoría seleccionada, lo cual es el comportamiento deseado.

### Paso 4: QA Checklist
1.  Verificar que el gráfico sume correctamente los montos *del mes seleccionado* (no el total de la compra original).
    *   *Detalle técnico:* Hay que iterar sobre las cuotas (`installments`) de cada compra y sumar solo las que corresponden al mes/año visible.
2.  Click en gráfico filtra tabla y actualiza totales de la tabla.
3.  Click en "Sin Categoría" filtra correctamente los items null/undefined.
4.  El buscador de texto de la tabla (existente) funciona sobre el subconjunto filtrado por categoría.

## 6. Checklist de Aceptación
- [ ] Archivo `CategoryCompositionChart.tsx` creado.
- [ ] `ActualTenpo.tsx` modificado para incluir el gráfico y estado de filtro.
- [ ] Interacción bidireccional (Gráfico -> Filtro Tabla -> UI feedback en gráfico).
- [ ] Manejo robusto de `category` null/undefined.
- [ ] Estética consistente (colores de gráfico coinciden con colores de categoría si existen, o paleta por defecto).
