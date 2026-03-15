# Rediseño Vista Anual Tenpo - Experiencia Analítica

**Fecha:** 6 de Marzo 2026  
**Alcance:** Vista `/presupuesto/tenpo`  
**Objetivo:** Transformar la vista anual de Tenpo de tabla gigante a experiencia analítica centrada en gráfico interactivo + tabla filtrada + modal de detalle

---

## 🎯 Objetivo

Acercar la vista anual `/presupuesto/tenpo` a la experiencia visual y analítica de `actual/tenpo`, manteniendo la lógica anual y la capacidad de operar sobre compras individuales, pero eliminando la sobrecarga visual de la tabla gigante expandible.

### Problemas de la vista anterior:
- ❌ Tabla gigante con 12 columnas de meses + detalles por compra
- ❌ Información expandida de cuotas directamente en la tabla
- ❌ Sobrecarga visual: demasiada información de una vez
- ❌ Poca priorización analítica (categorías no visibles de manera clara)
- ❌ Operaciones en línea sobre cuotas hacían la tabla más compleja

### Objetivos del rediseño:
- ✅ Gráfico principal como protagonista analítico
- ✅ Categorización como eje principal de análisis
- ✅ Filtrado dinámico desde el gráfico hacia tabla de compras
- ✅ Detalle operativo en modal secundario limpio
- ✅ Mantener capacidadde operar sobre compras individuales
- ✅ Identificar rápido compras sin categorizar

---

## 📊 Diferencias: Vista Anterior vs Nueva Propuesta

### Vista Anterior (Tabla gigante)

#### Estructura:
```
┌─────────────────────────────────────────────────────────────────┐
│ Controles: Año | Sync | Manual | Búsqueda | Totales            │
├─────────────────────────────────────────────────────────────────┤
│ Info Cards: Cierre | Vencimiento | Última Sync                  │
├─────────────────────────────────────────────────────────────────┤
│ TABLA GIGANTE                                                    │
│ ┌───────┬────────┬────────┬─────────┬───┬───┬───┬...┬──────┐   │
│ │Compra │ Fecha  │ Cuotas │ Total   │Ene│Feb│Mar│...│Total │   │
│ ├───────┴────────┴────────┴─────────┴───┴───┴───┴...┴──────┤   │
│ │  ▶ Comercio X (click para expandir)                       │   │
│ │     - Controles inline: interes | confirmar | calendario  │   │
│ │     - Tabla de cuotas (todas las cuotas)  expandida       │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Características:
- Scroll horizontal pesado (12+ columnas)
- Click en fila → expande cuotas inline
- Todas las operaciones dentro de la tabla expandida
- Total de meses visible en filas de totales al fondo
- Sin categorías visibles
- Sin filtros visuales

---

### Nueva Propuesta (Analítica)

#### Estructura:
```
┌─────────────────────────────────────────────────────────────────┐
│ Controles: Año | Sync | Manual                                  │
├─────────────────────────────────────────────────────────────────┤
│ Info Cards: Cierre | Vencimiento | Última Sync                  │
├─────────────────────────────────────────────────────────────────┤
│ GRÁFICO INTERACTIVO ANUAL (Stacked Bar)                         │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Meses en X (Ene - Dic)                                    │   │
│ │ Categorías apiladas con colores                           │   │
│ │ Click en segmento = filtrar mes + categoría               │   │
│ │ Click en leyenda = filtrar categoría                      │   │
│ │ "Sin Categoría" visible y agrupado                        │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ TABLA FILTRADA (por selección del gráfico)                      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Solo compras que coincidan con filtro activo              │  │
│ │ Columnas: Comercio | Categoría | Fecha | Total | Cuotas   │  │
│ │           | Monto mes/año | Estado | [Ver detalle]        │  │
│ │ Click en fila o botón → Abre modal                        │  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│ MODAL DE DETALLE (RSuite Modal)                                 │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ - Info completa de compra                                 │  │
│ │ - Calendario de cuotas (tabla scrollable)                 │  │
│ │ - Operaciones: Toggle interés | Confirmar valor |         │  │
│ │                Ajustar calendario                         │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Características:
- Gráfico como protagonista visual
- Categorías visibles y distinguibles por color
- Filtrado interactivo desde gráfico
- Tabla compacta y enfocada
- Detalle completo en modal secundario
- Sin scroll horizontal pesado
- `Sin Categoría` visible y rastreable

---

## 🏗️ Por Qué Gráfico + Tabla Filtrada + Modal

### 1. **Gráfico Stacked Bar como protagonista**

**Razón:**  
La vista anual debe priorizar **visión general** antes que detalle. El usuario busca:
- ¿Cuánto gasto por mes?
- ¿En qué categorías estoy gastando más?
- ¿Qué meses tienen picos?
- ¿Qué comercios/compras faltan categorizar?

Un gráfico de barras apiladas responde todas estas preguntas de un vistazo.

**Interacción:**  
- Click en segmento (mes + categoría) → filtra tabla
- Click en leyenda (categoría) → filtra tabla
- Barra "Total" del gráfico → visible pero desenfatizada
- Opacidad reducida para elementos no seleccionados

**Stack:**  
Cada categoría es una serie apilada con color distintivo. `Sin Categoría` aparece en gris marcado, facilitando identificación rápida de compras sin clasificar.

---

### 2. **Tabla Filtrada (no gigante)**

**Razón:**  
La tabla gigante de 12+ columnas es útil para análisis detallado mes a mes, pero sobrecarga la vista general. En la nueva propuesta:

- La tabla muestra **solo las compras relevantes** según el filtro activo
- Si no hay filtro, muestra todas las compras del año
- Si hay mes seleccionado, muestra solo compras con cuotas en ese mes
- Si hay categoría seleccionada, muestra solo compras de esa categoría

**Ventajas:**
- Sin scroll horizontal
- Información condensada y enfocada
- Fácil de escanear visualmente
- Compatible con selección múltiple en el futuro (checkboxes)

**Columnas:**
- Comercio (con info de cuotas/interés)
- Categoría (tag con color)
- Fecha de compra
- Monto total de compra
- Número de cuotas en el periodo filtrado
- Monto del mes/año (según filtro)
- Estado (Estimado/Real)
- Acción: "Ver detalle" → modal

---

### 3. **Modal de Detalle (RSuite Modal)**

**Razón:**  
Las operaciones sobre una compra (confirmar valor real, ajustar calendario, toggle interés) no deben vivir expandidas en la tabla principal porque:

1. Hacen la tabla más pesada visualmente
2. Son operaciones de baja frecuencia (no cada visita)
3. Requieren formularios y validación que ocupan espacio

**Solución:**  
Un modal limpio y enfocado con:

#### Secciones del modal:
```
┌────────────────────────────────────────────┐
│ Detalle de Compra                  [X]     │
├────────────────────────────────────────────┤
│ [Badges: ESTIMADO/REAL | Categoría]       │
│                                             │
│ Info Principal:                             │
│   - Comercio                                │
│   - Fecha de compra                         │
│   - Monto total                             │
│   - Número de cuotas                        │
│   - Con interés: Sí/No                      │
│   - Total financiado (si aplica)            │
│   - Interés total (si aplica)               │
│                                             │
│ ─────────────────────────────────────       │
│                                             │
│ Calendario de Cuotas (12 cuotas)           │
│ ┌────────────────────────────────────────┐ │
│ │ #  │ Vencimiento │ Monto     │ Estado │ │
│ │ 1  │ 05/01/2026  │ $15,000   │ REAL   │ │
│ │ 2  │ 05/02/2026  │ $15,000   │ EST    │ │
│ │ ... (scrollable)                       │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ ─────────────────────────────────────       │
│                                             │
│ Acciones (solo si ESTIMADO):                │
│ ┌────────────────────────────────────────┐ │
│ │ 🔻 Desactivar interés       [Botón]   │ │
│ │ ✓ Confirmar valor real      [Botón]   │ │
│ │ 📅 Ajustar calendario       [Botón]   │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ [Cerrar]                                    │
└────────────────────────────────────────────┘
```

**Interacción:**
- Click en botón → expand inline dentro del modal (no submódulos)
- Confirmar acción → actualiza datos → cierra modal
- Cancelar → cierra sin cambios

**Ventajas vs expandir en tabla:**
- No afecta layout principal
- Toda la info en un contexto limpio
- Formularios más claros
- Backdrop oscurece el resto → foco total

---

## 📁 Archivos Modificados

### Nuevos componentes creados:

1. **`AnnualCategoryStackedChart.tsx`**
   - Ubicación: `node-version/client/src/components/presupuesto/`
   - Función: Gráfico anual stacked bar con meses en X y categorías apiladas
   - Props:
     - `purchases`: array de compras
     - `selectedYear`: año actual
     - `selectedMonth`: mes seleccionado (null = ninguno)
     - `selectedCategory`: categoría seleccionada (null = ninguna)
     - `onSelectSegment`: callback para cambiar filtros
   - Interacción:
     - Click en barra → selecciona mes
     - Click en leyenda → selecciona categoría
     - Tooltip con desglose por categoría
     - Barra "Total" al final con monto agregado

2. **`AnnualTenpoTable.tsx`**
   - Ubicación: `node-version/client/src/components/presupuesto/`
   - Función: Tabla filtrada de compras según selección del gráfico
   - Props:
     - `purchases`: array de compras
     - `selectedYear`: año actual
     - `selectedMonth`: mes filtro activo
     - `selectedCategory`: categoría filtro activa
     - `onPurchaseClick`: callback al hacer click en fila
   - Características:
     - Filtrado automático según props
     - Ordenamiento por columnas (sortable)
     - Columnas: Comercio | Categoría | Fecha | Total Compra | Cuotas en periodo | Monto periodo | Estado | Acción
     - Click en fila completa → abre modal
     - Header con título dinámico según filtros activos

3. **`PurchaseDetailModal.tsx`**
   - Ubicación: `node-version/client/src/components/presupuesto/`
   - Función: Modal de detalle y operaciones sobre una compra
   - Props:
     - `purchase`: compra seleccionada (null cuando cerrado)
     - `open`: boolean de visibilidad
     - `onClose`: callback al cerrar
     - `onDataChange`: callback tras modificar datos
   - Secciones:
     - Info principal con badges
     - Calendario de cuotas (tabla scrollable)
     - Acciones (solo si ESTIMADO):
       - Toggle interés
       - Confirmar valor real (con input)
       - Ajustar calendario (con date picker)
   - Usa componentes RSuite: Modal, Button, Tag, Divider, Input, DatePicker

---

### Archivos modificados:

4. **`Tenpo.tsx`**
   - Ubicación: `node-version/client/src/pages/`
   - Cambios principales:
     - ❌ Eliminada tabla gigante de 12 columnas
     - ❌ Eliminado estado `expandido` para filas
     - ❌ Eliminados modales inline de confirmar/calendario
     - ❌ Eliminadas funciones helper: `getMonthlyData`, `getMonthlyTotal`, `getPurchaseTotal`
     - ❌ Eliminada constante `MESES` (nombres cortos)
     - ❌ Eliminado totales calculados en render (`totalAnualEstimado`, `totalAnualPagado`)
     - ✅ Agregados nuevos imports de componentes
     - ✅ Agregados estados para filtros: `selectedMonth`, `selectedCategory`, `selectedPurchase`, `detailModalOpen`
     - ✅ Agregadas funciones: `handleSelectSegment`, `handlePurchaseClick`, `handleDetailModalClose`
     - ✅ Nuevo layout:
       ```jsx
       <GmailSyncStatusBanner />
       <Controles />
       <InfoCards />
       <AnnualCategoryStackedChart />
       <AnnualTenpoTable />
       <PurchaseDetailModal />
       <ManualPurchaseModal />
       ```
     - ✅ Mantenidos: `handleSync`, `handleCreateManualPurchase`, `loadData`
     - ✅ Simplificados controles: Año | Sync | Manual (búsqueda eliminada por ahora)

---

## 🧑‍💻 Cambios por Archivo

### 1. AnnualCategoryStackedChart.tsx

**Responsabilidad:** Visualización analítica anual con interacción

#### Lógica principal:
```typescript
// 1. Procesar compras → agrupar por mes y categoría
const { chartData, categories, categoryColors } = useMemo(() => {
  const monthsData = MESES_SHORT.map((mes, idx) => ({
    month: mes,
    monthIndex: idx + 1,
    total: 0
  }));

  purchases.forEach(purchase => {
    const catName = purchase.category?.name || 'Sin Categoría';
    purchase.installments.forEach(inst => {
      const dueDate = new Date(inst.dueDate);
      if (dueDate.getFullYear() === selectedYear) {
        const monthIdx = dueDate.getMonth();
        monthsData[monthIdx][catName] += inst.finalMonthlyAmountClp;
        monthsData[monthIdx].total += inst.finalMonthlyAmountClp;
      }
    });
  });

  return { chartData: monthsData, categories, categoryColors };
}, [purchases, selectedYear]);

// 2. onClick: filtrar por mes
const handleBarClick = (data) => {
  const clickedMonth = data.activePayload[0].payload.monthIndex;
  onSelectSegment(clickedMonth, selectedCategory);
};

// 3. onClick leyenda: filtrar por categoría
const handleLegendClick = (entry) => {
  onSelectSegment(selectedMonth, entry.value);
};
```

#### Componente Recharts:
- `<BarChart>` con barras apiladas (`stackId="a"`)
- Cada categoría es un `<Bar>` con `dataKey` dinámico
- Tooltip customizado con desglose por categoría
- Leyenda customizada con interacción (click para filtrar)
- `<Cell>` con opacidad reducida si hay filtro activo y no coincide
- Stroke en barras del mes seleccionado

---

### 2. AnnualTenpoTable.tsx

**Responsabilidad:** Tabla filtrada y ordenable

#### Lógica de filtro:
```typescript
const filteredData = useMemo(() => {
  const rows: PurchaseRow[] = [];

  purchases.forEach(purchase => {
    // Filtrar cuotas por año y mes (si aplica)
    let relevantInstallments = purchase.installments.filter(inst => {
      const dueDate = new Date(inst.dueDate);
      if (dueDate.getFullYear() !== selectedYear) return false;
      if (selectedMonth && dueDate.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });

    // Si hay mes seleccionado, excluir compras sin cuotas en ese mes
    if (selectedMonth && relevantInstallments.length === 0) return;

    // Filtrar por categoría
    const catName = purchase.category?.name || 'Sin Categoría';
    if (selectedCategory && catName !== selectedCategory) return;

    // Calcular monto total del periodo
    const monthTotal = relevantInstallments.reduce(...);

    rows.push({
      purchase,
      merchant,
      category: catName,
      monthTotal,
      cuotasEnMes,
      ...
    });
  });

  // Sorting
  return rows.sort(...);
}, [purchases, selectedYear, selectedMonth, selectedCategory, sortColumn, sortType]);
```

#### Tabla RSuite:
- Usa `<Table>` de RSuite con sorting
- Altura dinámica según cantidad de filas (max 600px)
- `onRowClick` → llama a `onPurchaseClick`
- Columnas sortables: merchant, purchaseDate, amountTotal, monthTotal
- Tags visuales para categoría y estado
- Botón "Ver detalle" en cada fila

---

### 3. PurchaseDetailModal.tsx

**Responsabilidad:** Detalle completo y operaciones sobre compra

#### Estructura:
```typescript
<Modal open={open} onClose={onClose} size="lg" backdrop="static">
  <Modal.Header>Detalle de Compra</Modal.Header>
  
  <Modal.Body>
    {/* Sección 1: Info principal */}
    <h5>{purchase.merchant}</h5>
    <Tags: ESTADO | CATEGORÍA | CALENDARIO_MANUAL />
    <Grid: fecha | monto | cuotas | interes | totales />

    {/* Sección 2: Calendario de cuotas */}
    <h6>Calendario de Cuotas ({purchase.installments.length})</h6>
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      <table>
        {purchase.installments.map(inst => <tr>...)}
      </table>
    </div>

    {/* Sección 3: Acciones (solo ESTIMADO) */}
    {purchase.modoMonto === 'ESTIMADO' && (
      <>
        <Button onClick={handleToggleInteres}>Toggle Interés</Button>
        
        {!confirmingReal ? (
          <Button onClick={() => setConfirmingReal(true)}>Confirmar Valor</Button>
        ) : (
          <Input + Button>Guardar</Button>
        )}
        
        {!adjustingSchedule ? (
          <Button onClick={() => setAdjustingSchedule(true)}>Ajustar Calendario</Button>
        ) : (
          <DatePicker + Button>Aplicar</Button>
        )}
      </>
    )}
  </Modal.Body>

  <Modal.Footer>
    <Button onClick={onClose}>Cerrar</Button>
  </Modal.Footer>
</Modal>
```

#### Handlers internos:
- `handleToggleInteres()`: PATCH `/api/tenpo/purchases/:id/interes`
- `handleConfirmarReal()`: POST `/api/tenpo/purchases/:id/confirmar-real`
- `handleAdjustSchedule()`: PATCH `/api/tenpo/purchases/:id/schedule`
- Cada handler llama a `onDataChange()` tras éxito → recarga datos en página principal
- Cierra modal automáticamente tras confirmar operación

---

### 4. Tenpo.tsx

#### Imports agregados:
```typescript
import AnnualCategoryStackedChart from '../components/presupuesto/AnnualCategoryStackedChart';
import AnnualTenpoTable from '../components/presupuesto/AnnualTenpoTable';
import PurchaseDetailModal from '../components/presupuesto/PurchaseDetailModal';
```

#### Estados nuevos:
```typescript
const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
const [detailModalOpen, setDetailModalOpen] = useState(false);
```

#### Estados eliminados:
```typescript
// ❌ const [expandido, setExpandido] = useState<number | null>(null);
// ❌ const [confirmModalOpen, setConfirmModalOpen] = useState(false);
// ❌ const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
// ❌ const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);
// ❌ const [cuotaRealInput, setCuotaRealInput] = useState('');
// ❌ const [scheduleDateInput, setScheduleDateInput] = useState('');
// ❌ const [searchQuery, setSearchQuery] = useState('');
// ❌ const [searching, setSearching] = useState(false);
```

#### Funciones nuevas:
```typescript
const handleSelectSegment = (month: number | null, category: string | null) => {
  setSelectedMonth(month);
  setSelectedCategory(category);
};

const handlePurchaseClick = (purchase: Purchase) => {
  setSelectedPurchase(purchase);
  setDetailModalOpen(true);
};

const handleDetailModalClose = () => {
  setDetailModalOpen(false);
  setSelectedPurchase(null);
};
```

#### Funciones eliminadas:
```typescript
// ❌ handleToggleInteres → movido a modal
// ❌ handleAdjustSchedule → movido a modal
// ❌ handleConfirmarReal → movido a modal
// ❌ getMonthlyData → no necesario (cálculo en componentes)
// ❌ getMonthlyTotal → no necesario
// ❌ getPurchaseTotal → no necesario
// ❌ handleSearch → eliminado por simplicidad (puede volver después)
```

#### JSX reestructurado:
```jsx
// ANTES:
<Controles con search + totales inline>
<Info Cards>
<TABLA GIGANTE con expansión inline>
<Modal confirmar valor real>
<Modal ajustar calendario>
<Modal compra manual>

// DESPUÉS:
<Controles simplificados (año, sync, manual)>
<Info Cards>
<AnnualCategoryStackedChart
  purchases={purchases}
  selectedYear={anioSeleccionado}
  selectedMonth={selectedMonth}
  selectedCategory={selectedCategory}
  onSelectSegment={handleSelectSegment}
/>
<AnnualTenpoTable
  purchases={purchases}
  selectedYear={anioSeleccionado}
  selectedMonth={selectedMonth}
  selectedCategory={selectedCategory}
  onPurchaseClick={handlePurchaseClick}
/>
<PurchaseDetailModal
  purchase={selectedPurchase}
  open={detailModalOpen}
  onClose={handleDetailModalClose}
  onDataChange={loadData}
/>
<Modal compra manual> {/* mantenido sin cambios */}
```

---

## 🧠 Decisiones UX

### 1. Gráfico como punto de entrada visual

**Decisión:** El gráfico stacked bar es lo primero que ve el usuario después de los controles.

**Justificación:**  
La jerarquía visual debe reflejar la prioridad de análisis:
1. ¿Cuánto gasto en el año? → Visión general del gráfico
2. ¿Dónde está concentrado? → Meses con barras más altas
3. ¿Qué categorías dominan? → Colores del stack
4. ¿Qué falta categorizar? → Segmento gris "Sin Categoría"

Solo después de esta visión general, el usuario profundiza en compras específicas.

---

### 2. Filtrado desde gráfico (no filtros tradicionales)

**Decisión:** No hay dropdowns o inputs de filtro tradicionales. El filtro se activa haciendo click en el gráfico.

**Justificación:**  
- **Menos fricción:** No hay que buscar controles de filtro separados
- **Interacción natural:** "Click en lo que quieres ver"
- **Feedback visual inmediato:** El gráfico muestra con opacidad qué está filtrado y qué no
- **Reversible intuitivo:** Botón "Limpiar filtro" visible cuando hay selección activa

**Alternativa considerada:** Dropdowns de mes/categoría arriba.  
**Por qué se descartó:** Añade controles adicionales y rompe la fluidez del gráfico interactivo.

---

### 3. Tabla sin expandir inline

**Decisión:** La tabla no tiene filas expandibles. El detalle se abre en modal.

**Justificación:**  
- **Consistencia:** Similar a `actual/tenpo` donde operaciones críticas están en panel lateral
- **Foco:** El modal aisla la operación del resto de la UI
- **Simplicidad:** La tabla mantiene altura consistente, sin saltos visuales al expandir
- **Accesibilidad:** Modal con backdrop oscuro → foco claro en la tarea

**Alternativa considerada:** Expandir inline como antes.  
**Por qué se descartó:** Hace la tabla más pesada, genera scroll vertical dentro de scroll de página, y mezcla contextos (análisis vs operación).

---

### 4. "Sin Categoría" como categoría explícita

**Decisión:** Las compras sin categoría se agrupan bajo `Sin Categoría` con color gris distintivo.

**Justificación:**  
- **Visibilidad:** Es crítico identificar qué falta categorizar
- **Análisis:** "Sin Categoría" puede representar un monto significativo que el usuario debe revisar
- **Accionable:** Ver el gris en el gráfico motiva a categorizar
- **Priorización:** En el gráfico, "Sin Categoría" aparece al final (después de categorías reales)

---

### 5. Modal sin sub-modales

**Decisión:** Las operaciones dentro del modal (confirmar valor, ajustar calendario) se expanden inline dentro del mismo modal, no abren modales adicionales.

**Justificación:**  
- **Evita modal sobre modal:** Mala UX tener que cerrar capas anidadas
- **Contexto persistente:** La info de la compra sigue visible mientras operas
- **Formularios simples:** Un input o date picker no justifican modal separado

**Implementación:**  
- Estado local `confirmingReal`, `adjustingSchedule`
- Al hacer click, se expande el formulario inline
- Botones "Guardar" y "Cancelar" vuelven al estado inicial

---

### 6. Eliminación de búsqueda global (temporal)

**Decisión:** Se eliminó la barra de búsqueda global "Buscar compra...".

**Justificación:**  
- **Simplificación del MVP:** Reducir complejidad inicial
- **Reemplazable por filtros visuales:** El gráfico + tabla filtrada cubre la mayoría de casos de uso
- **Puede volver después:** Si hay demanda, se puede agregar como control adicional

**Caso de uso perdido:**  
Usuario que busca una compra específica por nombre de comercio.

**Mitigación:**  
- Tabla es sortable por comercio
- Filtro por categoría reduce el set de búsqueda
- En futuro se puede restaurar (búsqueda simple sobre tabla filtrada actual)

---

### 7. Totales anuales no visibles en controles

**Decisión:** Se eliminaron los totales "Total Estimado: $X" y "Total Pagado: $Y" de los controles superiores.

**Justificación:**  
- **Redundancia:** El gráfico ya muestra el total anual de forma visual (altura total de barras)
- **Enfoque analítico:** La pregunta importante no es "¿cuánto en total?" sino "¿cuánto por mes/categoría?"
- **Puede agregarse si se necesita:** Fácil añadir card de "Total Anual" en info cards

---

## ⚠️ Riesgos / Límites del MVP

### 1. **Performance con muchas compras**

**Riesgo:** Si hay 100+ compras en un año, el gráfico y la tabla pueden ser lentos.

**Mitigación actual:**
- `useMemo` en cálculos del gráfico
- `useMemo` en filtrado de tabla
- Recharts es performante con datasets medianos (< 1000 puntos)

**Si se vuelve problema:**
- Paginación en tabla
- Limit de compras mostradas (ej: solo últimas 50)
- Virtualización de tabla (react-window)

---

### 2. **Sin búsqueda global**

**Riesgo:** Usuario acostumbrado a buscar "Falabella" directamente puede sentir la falta.

**Mitigación actual:**
- Filtro por categoría reduce búsqueda
- Tabla sortable facilita encontrar comercios alfabéticamente

**Si se necesita:**
- Restaurar barra de búsqueda arriba de la tabla
- Filtrado simple `merchant.includes(query)` sobre `filteredData`

---

### 3. **Categorías no definidas bloquean análisis**

**Riesgo:** Si muchas compras están "Sin Categoría", el gráfico tiene un segmento gris gigante poco útil.

**Mitigación actual:**
- "Sin Categoría" es visible → motiva acción
- Botón "Categorías" en header → fácil acceso a asignar

**Mejora futura:**
- Asignación masiva de categoría desde tabla (checkboxes + acción batch)
- Sugerencias automáticas de categoría basadas en merchant

---

### 4. **Compras multi-año no bien representadas**

**Riesgo:** Compra en cuotas que empieza en 2025 y termina en 2027 solo muestra cuotas de 2026 en vista de 2026.

**Situación actual:**
- Es correcto: vista anual solo muestra impacto de ese año
- Pero puede confundir si el usuario espera ver la compra completa

**Mitigación:**
- En modal, el calendario de cuotas muestra TODAS las cuotas (no solo del año)
- Tooltip en tabla puede indicar "Compra en curso desde 2025"

**Mejora futura:**
- Badge en tabla: "Multi-año" si hay cuotas fuera del año actual
- Filtro para incluir compras iniciadas en años anteriores

---

### 5. **Interacción móvil no optimizada**

**Riesgo:** Gráfico Recharts puede ser difícil de interactuar en mobile (áreas pequeñas de click).

**Estado actual:**
- Layout responsivo básico (RSuite + CSS flex)
- Gráfico ajusta tamaño con `<ResponsiveContainer>`
- Tabla de RSuite tiene scroll horizontal en mobile

**No implementado aún:**
- Touch gestures optimizados en gráfico
- Vista alternativa para mobile (ej: lista de cards en lugar de gráfico)

**Si se requiere:**
- Detectar `isMobile` → cambiar a vista de lista simplificada
- O hacer áreas de click más grandes en gráfico mobile

---

## ✅ Validación Manual Recomendada

### Test 1: Gráfico interactivo
1. Abrir `/presupuesto/tenpo`
2. Verificar que gráfico carga con barras apiladas
3. Click en una barra (ej: Marzo) → tabla debe filtrar solo compras de Marzo
4. Click en leyenda de categoría (ej: "Cata") → tabla debe filtrar solo esa categoría
5. Verificar que botón "Limpiar filtro" aparece y funciona
6. Verificar opacidad reducida en segmentos no seleccionados

### Test 2: Tabla filtrada
1. Sin filtro: tabla debe mostrar todas las compras del año
2. Con filtro de mes: verificar que "Cuotas en mes" muestra solo las del mes
3. Con filtro de categoría: verificar que solo aparecen compras de esa categoría
4. Ordenar por columnas: verificar que sorting funciona
5. Click en fila → debe abrir modal

### Test 3: Modal de detalle
1. Click en una compra de la tabla → modal abre
2. Verificar info principal (fecha, monto, cuotas, categoría)
3. Scroll en calendario de cuotas → debe ser scrollable
4. Si compra es ESTIMADO:
   - Click "Activar/Desactivar interés" → debe refrescar y recalcular
   - Click "Confirmar valor real" → mostrar input → guardar → cerrar modal y refrescar tabla
   - Click "Ajustar calendario" → mostrar date picker → aplicar → cerrar modal y refrescar tabla
5. Cerrar modal → volver a tabla filtrada activa

### Test 4: Compras sin categoría
1. Crear/encontrar compra sin categoría
2. Verificar que aparece en segmento "Sin Categoría" (gris) del gráfico
3. Click en segmento gris → tabla filtra solo sin categoría
4. Ir a `/tenpo/categorias` → asignar categoría
5. Volver a `/presupuesto/tenpo` → verificar que compra ahora aparece en categoría correcta

### Test 5: Sincronización
1. Click en botón "Actualizar desde Gmail"
2. Verificar que últimas compras se importan
3. Verificar que gráfico y tabla se actualizan automáticamente
4. Verificar que compras nuevas aparecen en "Sin Categoría" si no tienen meta de categoría

### Test 6: Compra manual
1. Click en "Agregar compra manual"
2. Llenar formulario → crear
3. Verificar que aparece en gráfico (en "Sin Categoría")
4. Verificar que aparece en tabla
5. Abrir modal de esa compra → verificar calendario generado

---

## 🚀 Siguiente Paso Recomendado

### Prioridad 1: Asignación masiva de categorías

**Problema actual:**  
Si hay muchas compras sin categorizar, el usuario debe ir una por una a `/tenpo/categorias`, buscar el merchant, y asignar.

**Solución propuesta:**  
Desde la tabla de `AnnualTenpoTable`, permitir:
1. Checkboxes en cada fila
2. Seleccionar múltiples compras
3. Botón "Asignar categoría a X seleccionadas"
4. TreePicker de categorías
5. Aplicar batch

**Implementación:**
- Agregar estado `selectedMerchants: Set<string>` en tabla
- Checkbox column en tabla
- Botón flotante (sticky bottom) cuando hay selección
- Modal con TreePicker de categorías
- Endpoint bulk: `PATCH /api/tenpo/purchases/batch-category { purchaseIds[], categoryId }`

---

### Prioridad 2: Restaurar búsqueda global (opcional)

**Si hay feedback del usuario pidiendo búsqueda:**

Agregar input de búsqueda arriba de la tabla (no en controles principales):

```jsx
<AnnualTenpoTable>
  <input 
    placeholder="Buscar por comercio..."
    onChange={setSearchQuery}
  />
  {/* Filtrar filteredData con merchant.includes(searchQuery) */}
</AnnualTenpoTable>
```

**Integración con filtros:**
- Búsqueda se aplica DESPUÉS de filtros de gráfico
- Ej: Si filtro "Marzo + Cata", búsqueda busca dentro de ese set

---

### Prioridad 3: Vista de detalle año completo (sin filtro)

**Petición potencial del usuario:**  
"Quiero ver una tabla anual completa con 12 columnas como antes, pero solo cuando lo necesito".

**Solución:**
- Botón toggle: "Vista Analítica" (actual) vs "Vista Completa" (tabla gigante)
- Guardar preferencia en localStorage
- Componente separado `AnnualCompactTable` vs `AnnualFullTable`

**Trade-off:**
- Mantener ambas vistas requiere mantener más código
- Si hay demanda real, vale la pena
- Si no, mejor eliminar tabla vieja completamente

---

### Prioridad 4: Exportar a Excel/CSV

**Común en vistas analíticas:**  
Permitir exportar los datos filtrados a archivo.

**Implementación:**
- Botón "Exportar" en header de tabla
- Librería: `xlsx` o `papaparse`
- Exportar `filteredData` actual con formato CSV/Excel

---

## 📊 Resumen de Impacto

### Antes vs Después

| Métrica | Antes (Tabla Gigante) | Después (Analítica) |
|---------|----------------------|---------------------|
| **Componentes principales** | 1 (Tenpo.tsx) | 4 (Tenpo + 3 nuevos) |
| **Líneas en Tenpo.tsx** | ~1200 | ~650 |
| **Scroll horizontal** | Siempre (12+ columnas) | Nunca |
| **Filas expandibles** | Sí (inline) | No (modal) |
| **Categorías visibles** | No | Sí (gráfico) |
| **Filtrado dinámico** | No | Sí (desde gráfico) |
| **Operaciones inline** | Sí (en tabla expandida) | No (en modal) |
| **Complejidad visual** | Alta | Media-baja |
| **UX analítica** | Baja | Alta |

### Funcionalidades mantenidas:
✅ Selección de año  
✅ Sincronización con Gmail  
✅ Creación de compra manual  
✅ Toggle interés  
✅ Confirmar valor real  
✅ Ajustar calendario  
✅ Info de cierre y vencimiento  

### Funcionalidades nuevas:
✅ Gráfico anual interactivo  
✅ Filtrado por mes y categoría desde gráfico  
✅ Tabla compacta y enfocada  
✅ Modal de detalle limpio  
✅ Visibilidad de "Sin Categoría"  

### Funcionalidades eliminadas (temporal o permanente):
❌ Búsqueda global por merchant  
❌ Totales anuales en controles  
❌ Tabla gigante de 12 columnas  

---

## 🎯 Conclusión

El rediseño transforma la vista anual de Tenpo de una herramienta operativa pesada (tabla gigante) a una experiencia analítica fluida (gráfico + filtro + detalle modal).

**Objetivos cumplidos:**
- ✅ Categorización como eje principal de análisis
- ✅ Gráfico interactivo como protagonista
- ✅ Filtrado dinámico y visual
- ✅ Detalle operativo accesible pero no invasivo
- ✅ Identificación rápida de compras sin categorizar
- ✅ Consistencia visual con `actual/tenpo`

**Próximos pasos:**
1. Validación manual completa
2. Feedback de usuario real
3. Implementar asignación masiva de categorías
4. Considerar restaurar búsqueda si hay demanda

---

**Fin del documento**
