# Tenpo - Estilos y Configuración de Gráficos

Consolidación de especificaciones de estilo para gráficos analíticos de Tenpo.

---

## 📊 Vista Anual - Gráficos Coordinados

### Descripción
Dos gráficos sincronizados (barras + líneas) para análisis de categorías y comercios.

### Características
- **Coordinación**: Zoom y pan sincronizados entre gráficos
- **Filtros**: Por categoría, comercio y rango de fechas
- **Altura**: Optimizada para visualización sin scroll excesivo
- **Interactividad**: Tooltips, hover, selección de rangos

### Archivos de Referencia
- Implementación en: `node-version/client/src/pages/TenpoCategories.tsx`
- Detalles en commits: Feb-Mar 2026

---

## 🎨 Estándares de Etiquetas

### Etiquetas en Gráficos de Barras
- **Font-size**: Optimizado para legibilidad (12-14px según densidad)
- **Posición**: Centradas o al final de barra según espacio
- **Formato**: Moneda CLP con separadores de miles
- **Color**: Contraste suficiente con fondo de barra

### Etiquetas en Gráficos de Líneas
- **Puntos de datos**: Visibles en hover
- **Formato**: Consistente con gráficos de barras
- **Tooltips**: Información contextual completa (fecha, monto, categoría)

### Uniformidad
Todos los gráficos de Tenpo siguen el mismo estándar de presentación:
- Paleta de colores consistente
- Formato de moneda uniforme
- Comportamiento de interacción predecible
- Responsive design en todos los tamaños de pantalla

---

## 📐 Ajustes de Altura y Layout

### Vista Anual
- **Altura contenedor**: `calc(100vh - header - controls)`
- **Grid layout**: Responsive con breakpoints
- **Gráficos**: Altura fija o proporcional según viewport

### Vista Mensual
- **Tablas**: Compact mode con scroll virtual
- **Controles**: Sticky header para acceso rápido
- **Panel lateral**: Fixed position para contexto persistente

---

## 🔧 Configuración Técnica

### Bibliotecas Utilizadas
- **Recharts**: Gráficos principales
- **date-fns**: Manejo de fechas
- **Tailwind CSS**: Estilos y responsive design

### Optimizaciones
- Memoización de cálculos pesados
- Lazy loading de datos históricos
- Debounce en filtros interactivos

---

_Para detalles de implementación específicos, consultar commits y PRs de Feb-Mar 2026_
