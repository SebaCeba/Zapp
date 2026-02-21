# Inventario de Componentes - Migración RSuite

## Fecha: 21 de Febrero, 2026
## Estado: FASE 0 - Preparación Completada

---

## ✅ Componentes por Prioridad de Migración

### 🔴 ALTA Prioridad (Fase 1-2) - Semana 1

#### Formularios
- [ ] **AddSubscriptionForm.tsx** (~100 líneas)
  - Inputs: nombre, precio, periodicidad, fecha
  - Button submit
  - Estado actual: Custom HTML forms
  - Migrar a: `<Form>` + `<Input>` + `<InputNumber>` + `<Button>`
  - Complejidad: **BAJA**
  - Tiempo estimado: 2-3 horas

- [ ] **TcConfigForm.tsx** (~200 líneas + CSS module)
  - Inputs múltiples (números, fechas)
  - Estado actual: Custom con CSS modules
  - Migrar a: `<Form>` + `<InputNumber>` + `<DatePicker>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 4-6 horas

- [ ] **ObligacionForm.tsx** (~150 líneas)
  - Form para crear/editar obligaciones
  - Inputs: texto, números, selects
  - Migrar a: `<Form>` + `<Input>` + `<SelectPicker>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 3-4 horas

#### Buttons Globales
- [ ] Todos los buttons `.btn`, `.btn-primary`, `.btn-danger`
  - Cantidad: ~50+ botones en toda la app
  - Estado actual: CSS custom en index.css
  - Migrar a: `<Button>` RSuite con variantes
  - Complejidad: **BAJA** (búsqueda y reemplazo)
  - Tiempo estimado: 4-6 horas (todas las páginas)

#### Inputs Globales
- [ ] Todos los `<input className="input">`
- [ ] Todos los `<select className="select">`
  - Cantidad: ~30+ inputs
  - Estado actual: CSS custom
  - Migrar a: `<Input>`, `<SelectPicker>`, `<InputNumber>`
  - Complejidad: **BAJA-MEDIA**
  - Tiempo estimado: 6-8 horas

---

### 🟡 MEDIA Prioridad (Fase 3-4) - Semana 2

#### Modales
- [ ] **GestionarBonosModal.tsx** (571 líneas) ⚠️ COMPLEJO
  - Modal custom con overlay
  - Form interno complejo
  - Tabla de repartos de bonos
  - Estado actual: JavaScript puro + CSS
  - Migrar a: `<Modal>` + `<Form>` + `<Table>`
  - Complejidad: **ALTA**
  - Tiempo estimado: 8-10 horas
  - Nota: Requiere testing extensivo

- [ ] **GestionarIngresosModal.tsx** (~300 líneas)
  - Modal para gestión de ingresos
  - Form + tabla interna
  - Migrar a: `<Modal>` + `<Form>` + `<Table>`
  - Complejidad: **MEDIA-ALTA**
  - Tiempo estimado: 4-6 horas

- [ ] **GestionarCatalogoModal.tsx** (~300 líneas)
  - Modal para catálogo de subscripciones
  - Similar a GestionarIngresosModal
  - Migrar a: `<Modal>` + `<Form>` + `<Table>`
  - Complejidad: **MEDIA-ALTA**
  - Tiempo estimado: 4-6 horas

#### Tablas
- [ ] **SubscriptionTable.tsx** (~150 líneas)
  - Tabla básica con delete/edit
  - Migrar a: `<Table>` con acciones
  - Complejidad: **BAJA-MEDIA**
  - Tiempo estimado: 3-4 horas

- [ ] **TcAnnualCyclesTable.tsx** (~150 líneas + CSS module)
  - Tabla compleja con 12 columnas (meses)
  - Cálculos de ciclos de facturación
  - Migrar a: `<Table>` con custom cells
  - Complejidad: **MEDIA-ALTA**
  - Tiempo estimado: 6-8 horas

- [ ] **TablaObligaciones.tsx** (~200 líneas)
  - Tabla de obligaciones financieras
  - Migrar a: `<Table>` con sorting/filtering
  - Complejidad: **MEDIA**
  - Tiempo estimado: 4-5 horas

- [ ] **TablaPresupuestoIngresos.tsx** (~150 líneas)
  - Tabla de presupuesto de ingresos
  - Migrar a: `<Table>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 3-4 horas

- [ ] **TablaPresupuestoServicios.tsx** (~150 líneas)
  - Similar a TablaPresupuestoIngresos
  - Migrar a: `<Table>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 3-4 horas

- [ ] **TablaPresupuestoSupermercado.tsx** (~150 líneas)
  - Similar a TablaPresupuestoIngresos
  - Migrar a: `<Table>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 3-4 horas

#### Paneles/Componentes TC
- [ ] **TcOverridesTable.tsx** (~100 líneas + CSS module)
  - Tabla de overrides de TC
  - Migrar a: `<Table>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 3-4 horas

- [ ] **TcRecalculationPanel.tsx** (~150 líneas + CSS module)
  - Panel de recálculo de TC
  - Botones + mensajes
  - Migrar a: `<Panel>` + `<Button>` + `<Message>`
  - Complejidad: **BAJA-MEDIA**
  - Tiempo estimado: 2-3 horas

---

### 🟢 BAJA Prioridad (Fase 5-6) - Semana 3

#### Navegación
- [ ] **Sidebar.tsx** (105 líneas)
  - Menú colapsable custom
  - Submenus expandibles
  - Estado actual: JavaScript + CSS
  - Migrar a: `<Sidenav>` RSuite
  - Complejidad: **MEDIA-ALTA**
  - Tiempo estimado: 6-8 horas
  - Nota: Puede requerir customización extensa

#### Dashboard/Cards
- [ ] **Dashboard.tsx** (140 líneas)
  - Stats cards custom
  - Grid layout manual
  - Gráficos Recharts (NO tocar)
  - Migrar a: `<Panel>` + `<FlexboxGrid>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 4-5 horas

- [ ] **DashboardObligaciones.tsx** (~150 líneas)
  - Similar a Dashboard.tsx
  - Migrar a: `<Panel>` + `<FlexboxGrid>`
  - Complejidad: **MEDIA**
  - Tiempo estimado: 4-5 horas

- [ ] **VistaPreviaObligacion.tsx** (~100 líneas)
  - Vista previa de obligación
  - Card custom
  - Migrar a: `<Panel>`
  - Complejidad: **BAJA**
  - Tiempo estimado: 2-3 horas

#### Utilidades
- [ ] **Toast.tsx** (~50 líneas)
  - Notificaciones custom
  - Migrar a: `<Notification>` o `<Message>` RSuite
  - Complejidad: **BAJA**
  - Tiempo estimado: 1-2 horas

- [ ] **YearAndUFSelector.tsx** (~80 líneas)
  - Selects custom para año y UF
  - Migrar a: `<SelectPicker>` o `<InputNumber>`
  - Complejidad: **BAJA**
  - Tiempo estimado: 2-3 horas

---

## 📊 Estadísticas Globales

### Totales
- **Total componentes a migrar:** 25 componentes
- **Total líneas de código (aprox):** ~3,500+ líneas
- **Tiempo estimado total:** 90-120 horas (2-3 semanas a tiempo completo)

### Por Complejidad
- **BAJA:** 8 componentes (~25 horas)
- **MEDIA:** 10 componentes (~40 horas)
- **MEDIA-ALTA:** 4 componentes (~25 horas)
- **ALTA:** 3 componentes (~30 horas)

### Por Fase
- **Fase 1 (Botones/Inputs):** ~15-20 horas
- **Fase 2 (Forms):** ~10-15 horas
- **Fase 3 (Tablas básicas):** ~15-20 horas
- **Fase 4 (Modales):** ~20-25 horas
- **Fase 5 (Navegación):** ~10-15 horas
- **Fase 6 (Dashboard/Cards):** ~15-20 horas
- **Fase 7 (Testing/Polish):** ~10-15 horas

---

## 🎯 Métricas de Éxito

Al completar la migración completa, esperamos:

### Código
- [ ] Reducir CSS custom de **284 líneas → <80 líneas**
- [ ] Eliminar todos los CSS modules (`.module.css`)
- [ ] Consistencia visual 100% con RSuite
- [ ] TypeScript sin errores

### Funcionalidad
- [ ] **100% funcionalidad mantenida**
- [ ] 0 regresiones funcionales
- [ ] 0 regresiones visuales críticas
- [ ] Todos los tests pasando (si existen)

### Performance
- [ ] Build size **<1.5MB gzipped** (actualmente ~1.2MB)
- [ ] First Contentful Paint **<1.5s**
- [ ] Time to Interactive **<2.5s**
- [ ] No degradación de performance vs. estado actual

### Developer Experience
- [ ] Reducir tiempo de desarrollo de nuevas features en 30-40%
- [ ] Consistencia en componentes (todos usan RSuite)
- [ ] Mejor TypeScript intellisense
- [ ] Documentación de componentes inline

---

## 🔍 Componentes NO Afectados

Estos componentes **NO se tocarán** durante la migración:

### Gráficos (Recharts)
- **Recharts** - Library de gráficos (100% compatible con RSuite)
  - BarChart, LineChart, PieChart, etc.
  - Ubicación: páginas Dashboard, Actual, etc.

### Routing
- **React Router** - Navigation (100% compatible con RSuite)
  - BrowserRouter, Routes, Route
  - Ubicación: `router.tsx`

### API Layer
- Todos los archivos en `src/api/`
  - No requieren cambios

### Types
- Todos los archivos en `src/types/`
  - No requieren cambios

### Layout
- **MainLayout.tsx** - Layout principal
  - Puede requerir ajustes menores para Sidebar RSuite
  - Pero estructura general se mantiene

---

## 📝 Notas Técnicas

### CSS Modules a Eliminar
Estos archivos CSS module se eliminarán durante migración:
```
- TcAnnualCyclesTable.module.css
- TcConfigForm.module.css
- TcOverridesTable.module.css
- TcRecalculationPanel.module.css
```

### CSS Global a Reducir
`index.css` (284 líneas) se reducirá eliminando:
- `.btn`, `.btn-primary`, `.btn-danger` (reemplazados por RSuite Button)
- `.input`, `.select` (reemplazados por RSuite Input/SelectPicker)
- `.card` (reemplazado por RSuite Panel)
- `.modal`, `.modal-overlay` (reemplazados por RSuite Modal)
- `.table` (reemplazado por RSuite Table)

Se mantendrán:
- Variables CSS en `:root` (para mantener colores del proyecto)
- Reset CSS (`*` selector)
- `.container` (layout global)
- Estilos específicos de Recharts (si existen)

---

## 🚀 Plan de Ejecución

### Fase 0: Preparación ✅ (HOY - 21 Feb 2026)
- [x] Instalar RSuite
- [x] Configurar imports
- [x] Crear estructura de archivos
- [x] Documentar componentes
- [x] Testing inicial
- [x] POC de RSuite funcionando

### Fase 1: Botones e Inputs (22-23 Feb)
- [ ] Migrar todos los buttons
- [ ] Migrar todos los inputs básicos
- [ ] Testing de regresión

### Fase 2: Forms (24-25 Feb)
- [ ] AddSubscriptionForm.tsx
- [ ] ObligacionForm.tsx
- [ ] TcConfigForm.tsx
- [ ] Testing de regresión

### Fase 3: Tablas Básicas (26-27 Feb)
- [ ] SubscriptionTable.tsx
- [ ] TablaPresupuesto*.tsx (3 componentes)
- [ ] TablaObligaciones.tsx
- [ ] Testing de regresión

### Fase 4: Modales y Tablas Complejas (28 Feb - 2 Mar)
- [ ] GestionarIngresosModal.tsx
- [ ] GestionarCatalogoModal.tsx
- [ ] TcAnnualCyclesTable.tsx
- [ ] GestionarBonosModal.tsx (⚠️ complejo)
- [ ] Testing extensivo

### Fase 5: Navegación (3-4 Mar)
- [ ] Sidebar.tsx → Sidenav RSuite
- [ ] Testing de navegación completa

### Fase 6: Dashboard/Cards (5-6 Mar)
- [ ] Dashboard.tsx
- [ ] DashboardObligaciones.tsx
- [ ] VistaPreviaObligacion.tsx
- [ ] Toast.tsx
- [ ] YearAndUFSelector.tsx
- [ ] TcOverridesTable.tsx
- [ ] TcRecalculationPanel.tsx

### Fase 7: Testing y Polish (7-9 Mar)
- [ ] Testing completo cross-browser
- [ ] Testing mobile responsive
- [ ] Cleanup CSS (eliminar CSS modules)
- [ ] Reducir index.css
- [ ] Performance audit
- [ ] Documentación final
- [ ] Merge a master

---

## 📞 Referencias

### Documentación Proyecto
- [`ARQUITECTURA.md`](../../docs/ARQUITECTURA.md) - Arquitectura completa
- [`PLAN_IMPLEMENTACION_RSUITE.md`](../../docs/implementacion_rsuite/PLAN_IMPLEMENTACION_RSUITE.md) - Plan detallado 7 fases
- [`FASE_0_RSUITE_PREPARACION.md`](../../docs/implementacion_rsuite/FASE_0_RSUITE_PREPARACION.md) - Esta fase

### RSuite Docs
- **Componentes:** https://rsuitejs.com/components/overview/
- **Button:** https://rsuitejs.com/components/button/
- **Input:** https://rsuitejs.com/components/input/
- **Form:** https://rsuitejs.com/components/form/
- **Table:** https://rsuitejs.com/components/table/
- **Modal:** https://rsuitejs.com/components/modal/
- **Sidenav:** https://rsuitejs.com/components/sidenav/
- **Customization:** https://rsuitejs.com/guide/customization/
- **TypeScript:** https://rsuitejs.com/guide/typescript/

---

**Última actualización:** 21 de Febrero, 2026 - Fase 0 Completada ✅  
**Next Step:** Fase 1 - Migración de Botones e Inputs (22 Feb)
