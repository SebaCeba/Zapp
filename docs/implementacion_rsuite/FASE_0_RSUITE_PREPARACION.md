# Fase 0: Preparación para Migración RSuite

**Fecha:** 21 de Febrero, 2026  
**Objetivo:** Preparar el proyecto para migración a RSuite sin romper nada  
**Tiempo estimado:** 4-8 horas  
**Prerequisitos:** Git limpio, proyecto funcionando

---

## 📋 Resumen Ejecutivo

Esta fase prepara el terreno para la migración a RSuite. **NO toca código de componentes**, solo configura infraestructura y documenta el estado actual. Al final de esta fase, tendrás RSuite instalado, probado en ambiente aislado, y listo para migrar componentes.

---

## ✅ Checklist de Pre-requisitos

Antes de empezar, verifica:

- [ ] Todo commiteado en git (`git status` debe estar limpio)
- [ ] Backend corriendo sin errores (`npm run dev`)
- [ ] Frontend corriendo sin errores (`npm run client:dev`)
- [ ] No hay errores en consola del navegador
- [ ] Todas las páginas se cargan correctamente

---

## 🎯 Objetivos de Fase 0

1. ✅ Instalar RSuite y verificar compatibilidad
2. ✅ Crear branch de trabajo
3. ✅ Configurar RSuite imports
4. ✅ Verificar que NO hay conflictos CSS críticos
5. ✅ Crear estructura de archivos para componentes RSuite
6. ✅ Documentar componentes actuales (inventario)
7. ✅ Testing de regresión (asegurar que nada se rompe)

---

## 📝 Paso a Paso

### **Step 1: Backup y Branch de Trabajo**

```powershell
# 1.1 Verificar que git está limpio
git status

# 1.2 Crear branch de trabajo
git checkout -b feat/rsuite-phase-0

# 1.3 Push branch (opcional, para backup remoto)
git push -u origin feat/rsuite-phase-0
```

**Tiempo:** 2 minutos  
**Validación:** `git branch` debe mostrar `feat/rsuite-phase-0` activa

---

### **Step 2: Instalar RSuite**

```powershell
# 2.1 Navegar a client
cd node-version/client

# 2.2 Instalar RSuite
npm install rsuite

# 2.3 Verificar instalación
npm list rsuite
```

**Salida esperada:**
```
zapps-client@1.0.0
└── rsuite@5.x.x
```

**Tiempo:** 2-3 minutos  
**Validación:** `package.json` debe incluir `rsuite` en dependencies

---

### **Step 3: Configurar RSuite en main.tsx**

**Archivo:** `node-version/client/src/main.tsx`

**Antes:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
```

**Después:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import Router from './router';
import 'rsuite/dist/rsuite.min.css';  // ← AGREGAR ESTA LÍNEA
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
```

**⚠️ IMPORTANTE:** El orden de imports es crítico:
1. Primero `rsuite.min.css`
2. Después `index.css` (para que tu CSS sobrescriba RSuite si es necesario)

**Tiempo:** 1 minuto  
**Validación:** Save y verifica que frontend sigue compilando sin errores

---

### **Step 4: Testing Inicial - Verificar que Nada se Rompe**

```powershell
# 4.1 Asegurarte que frontend está corriendo
cd node-version/client
npm run dev

# 4.2 Abrir navegador en http://localhost:5173
# 4.3 Navegar por TODAS las páginas:
#     - / (Home)
#     - /presupuesto
#     - /actual
#     - /app (suscripciones)
#     - /creditos
#     - /hipotecario
#     - /ingresos
#     - /servicios-basicos
#     - /supermercado
#     - /presupuesto/tenpo
```

**Checklist visual:**
- [ ] Home carga sin errores
- [ ] Sidebar se ve igual
- [ ] Dashboard con gráficos funciona
- [ ] Formularios se ven igual
- [ ] Tablas se ven igual
- [ ] Modales abren/cierran correctamente
- [ ] No hay errores en consola (F12)

**Si algo se ve raro:**
Esto es NORMAL. RSuite CSS puede tener algunos estilos globales que afectan tu CSS. Documentarlos para fix después.

**Tiempo:** 10 minutos  
**Validación:** Todas las páginas cargan sin errores críticos

---

### **Step 5: Prueba de Concepto - Un Botón RSuite**

Vamos a probar RSuite en un solo lugar sin romper nada.

**Archivo:** `node-version/client/src/pages/Home.tsx`

**Agregar al inicio del archivo:**
```tsx
import { Button } from 'rsuite';
```

**Agregar en algún lugar visible de la página:**
```tsx
{/* TEST RSuite - Remover después */}
<div style={{ 
  padding: '1rem', 
  background: '#f0f8ff', 
  border: '2px dashed #2563eb',
  marginBottom: '1rem' 
}}>
  <h3>✅ Test RSuite</h3>
  <Button appearance="primary">Botón RSuite Funciona!</Button>
  <Button appearance="subtle" style={{ marginLeft: '1rem' }}>Botón Subtle</Button>
</div>
```

**Resultado esperado:** Deberías ver dos botones con estilo RSuite en la página Home.

**Si funciona:** ✅ RSuite está correctamente instalado y funcionando  
**Si no funciona:** ❌ Revisar console (F12) para errores

**Tiempo:** 5 minutos  
**Validación:** Botones RSuite se ven diferentes a tus botones actuales

---

### **Step 6: Documentar Conflictos CSS (si existen)**

Abre DevTools (F12) y busca warnings/conflictos CSS.

**Crear archivo:** `node-version/client/src/rsuite-conflicts.md`

```markdown
# Conflictos CSS Detectados - RSuite

## Fecha: [Hoy]

### Conflictos Visuales Encontrados

1. **Botones:**
   - [ ] Padding diferente
   - [ ] Border radius diferente
   - [ ] Font size diferente

2. **Inputs:**
   - [ ] Styling diferente
   - [ ] Focus state se ve raro

3. **Modales:**
   - [ ] z-index conflicts
   - [ ] Overlay styling

4. **Tablas:**
   - [ ] Headers se ven diferentes
   - [ ] Borders conflictivas

### Notas
- Todos estos se resolverán en fases posteriores
- Documentar únicamente, NO fixear ahora
```

**Tiempo:** 5-10 minutos  
**Validación:** Documento creado con observaciones

---

### **Step 7: Crear Estructura de Archivos**

Crear directorios para organizar la migración:

```powershell
cd node-version/client/src

# 7.1 Crear directorio para componentes wrappers RSuite
New-Item -ItemType Directory -Path "components/ui"

# 7.2 Crear directorio para temas/estilos custom
New-Item -ItemType Directory -Path "theme"
```

**Estructura objetivo:**
```
client/src/
├── components/
│   ├── ui/              ← Wrappers RSuite (futuro)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   └── [resto de componentes actuales]
│
├── theme/
│   ├── rsuite-custom.css      ← Custom styles RSuite
│   └── rsuite-variables.ts     ← Variables de tema
│
└── [resto de archivos]
```

**Tiempo:** 2 minutos  
**Validación:** Directorios `components/ui` y `theme` existen

---

### **Step 8: Crear Archivo de Variables de Tema**

**Archivo:** `node-version/client/src/theme/rsuite-variables.ts`

```typescript
/**
 * Variables de tema custom para RSuite
 * Basado en tu CSS actual (index.css)
 */

export const customTheme = {
  // Colores primarios (de tu :root)
  '--rs-primary-500': '#2563eb',      // var(--primary)
  '--rs-primary-600': '#1d4ed8',      // var(--primary-dark)
  
  // Grises (de tu :root)
  '--rs-gray-50': '#f9fafb',          // var(--gray-50)
  '--rs-gray-100': '#f3f4f6',         // var(--gray-100)
  '--rs-gray-200': '#e5e7eb',         // var(--gray-200)
  '--rs-gray-300': '#d1d5db',         // var(--gray-300)
  '--rs-gray-700': '#374151',         // var(--gray-700)
  '--rs-gray-900': '#111827',         // var(--gray-900)
  
  // Estados
  '--rs-green-500': '#10b981',        // var(--success)
  '--rs-red-500': '#ef4444',          // var(--danger)
  
  // Tipografía
  '--rs-font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  
  // Border radius (tu estilo actual usa 8px, 6px)
  '--rs-border-radius-base': '6px',
  '--rs-border-radius-md': '8px',
};

/**
 * Aplicar tema custom
 * Llamar en main.tsx después de montar la app
 */
export function applyCustomTheme() {
  const root = document.documentElement;
  Object.entries(customTheme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
```

**Tiempo:** 5 minutos  
**Validación:** Archivo creado con variables de tu CSS actual

---

### **Step 9: Inventario de Componentes (Documentación)**

**Archivo:** `node-version/client/MIGRATION_INVENTORY.md`

```markdown
# Inventario de Componentes - Migración RSuite

## Fecha: 21 Feb 2026
## Estado: FASE 0 - Preparación

---

## ✅ Componentes por Prioridad de Migración

### 🔴 ALTA Prioridad (Fase 1-2)

#### Formularios
- [ ] **AddSubscriptionForm.tsx** (~100 líneas)
  - Inputs: nombre, precio, periodicidad, fecha
  - Button submit
  - Estado: Custom HTML forms
  - Migrar a: `<Form>` + `<Input>` + `<Button>`

- [ ] **TcConfigForm.tsx** (~200 líneas + CSS module)
  - Inputs múltiples (números, fechas)
  - Estado: Custom con CSS modules
  - Migrar a: `<Form>` + `<InputNumber>` + `<DatePicker>`

#### Buttons Globales
- [ ] Todos los buttons `.btn`, `.btn-primary`, `.btn-danger`
  - Cantidad: ~50+ botones en toda la app
  - Estado: CSS custom
  - Migrar a: `<Button>` RSuite con variantes

#### Inputs Globales
- [ ] Todos los `<input className="input">`
- [ ] Todos los `<select className="select">`
  - Cantidad: ~30+ inputs
  - Estado: CSS custom
  - Migrar a: `<Input>`, `<SelectPicker>`

---

### 🟡 MEDIA Prioridad (Fase 3-4)

#### Modales
- [ ] **GestionarBonosModal.tsx** (571 líneas) ⚠️ COMPLEJO
  - Modal custom con overlay
  - Form interno
  - Tabla de repartos
  - Estado: JavaScript puro + CSS
  - Migrar a: `<Modal>` + `<Form>` + `<Table>`

- [ ] **GestionarIngresosModal.tsx** (~300 líneas)
- [ ] **GestionarCatalogoModal.tsx** (~300 líneas)

#### Tablas
- [ ] **SubscriptionTable.tsx** (~150 líneas)
  - Tabla básica con delete
  - Migrar a: `<Table>` con sorting

- [ ] **TcAnnualCyclesTable.tsx** (~150 líneas + CSS module)
  - Tabla con 12 columnas (meses)
  - Migrar a: `<Table>` con custom cells

- [ ] **TablaObligaciones.tsx** (~200 líneas)
- [ ] **TablaPresupuesto*.tsx** (varios)

#### Navegación
- [ ] **Sidebar.tsx** (105 líneas)
  - Menú colapsable custom
  - Submenus expandibles
  - Estado: JavaScript + CSS
  - Migrar a: `<Sidenav>` RSuite

---

### 🟢 BAJA Prioridad (Fase 5-6)

#### Dashboard/Cards
- [ ] **Dashboard.tsx** (140 líneas)
  - Stats cards custom
  - Grid layout manual
  - Migrar a: `<Panel>` + `<FlexboxGrid>`

- [ ] **DashboardObligaciones.tsx**

#### Utilidades
- [ ] **Toast.tsx** (~50 líneas)
  - Notificaciones custom
  - Migrar a: `<Notification>` RSuite

- [ ] **YearAndUFSelector.tsx** (~80 líneas)
  - Selects custom
  - Migrar a: `<SelectPicker>` o `<InputNumber>`

---

## 📊 Estadísticas

- **Total componentes a migrar:** ~25
- **Total líneas de código:** ~2,000+
- **Tiempo estimado:** 2-3 semanas
- **Componentes nuevos RSuite:** ~15-20

---

## 🎯 Métricas de Éxito

- [ ] Reducir CSS custom de 284 líneas → <80 líneas
- [ ] 100% funcionalidad mantenida
- [ ] 0 regresiones visuales
- [ ] Build size <1.5MB gzipped

---

## 📝 Notas

- Recharts NO se toca (compatible con RSuite)
- React Router NO se toca (compatible con RSuite)
- date-fns sigue usándose (complementa RSuite)
```

**Tiempo:** 10 minutos  
**Validación:** Documento creado con inventario completo

---

### **Step 10: Commit de Fase 0**

```powershell
# 10.1 Ver cambios
git status

# Deberías ver:
# - modified: node-version/client/package.json
# - modified: node-version/client/src/main.tsx
# - modified: node-version/client/src/pages/Home.tsx (test RSuite)
# - new: node-version/client/src/theme/rsuite-variables.ts
# - new: node-version/client/src/rsuite-conflicts.md
# - new: node-version/client/MIGRATION_INVENTORY.md

# 10.2 Agregar archivos
git add node-version/client/package.json
git add node-version/client/package-lock.json
git add node-version/client/src/main.tsx
git add node-version/client/src/pages/Home.tsx
git add node-version/client/src/theme/
git add node-version/client/src/rsuite-conflicts.md
git add node-version/client/MIGRATION_INVENTORY.md
git add docs/ARQUITECTURA.md
git add docs/FASE_0_RSUITE_PREPARACION.md

# 10.3 Commit
git commit -m "feat(rsuite): Fase 0 - Setup y preparación

- Instalar RSuite 5.x
- Configurar imports en main.tsx
- Crear estructura de directorios (components/ui, theme)
- Documentar conflictos CSS
- Crear inventario de componentes
- Testing: todas las páginas funcionan
- POC: Botón RSuite en Home (test exitoso)

Refs: docs/FASE_0_RSUITE_PREPARACION.md"

# 10.4 Push
git push
```

**Tiempo:** 3 minutos  
**Validación:** Commit exitoso con mensaje descriptivo

---

## ✅ Checklist Final de Fase 0

Al terminar esta fase, deberías tener:

### Instalación
- [x] RSuite instalado en `package.json`
- [x] RSuite CSS importado en `main.tsx`
- [x] Orden de imports correcto (RSuite antes de index.css)

### Testing
- [x] Backend corriendo sin errores
- [x] Frontend compilando sin errores
- [x] Todas las páginas cargan correctamente
- [x] POC de botón RSuite funciona en Home

### Documentación
- [x] `rsuite-conflicts.md` creado (documentar conflictos)
- [x] `MIGRATION_INVENTORY.md` creado (inventario componentes)
- [x] `theme/rsuite-variables.ts` creado (variables de tema)
- [x] `ARQUITECTURA.md` actualizado
- [x] `FASE_0_RSUITE_PREPARACION.md` creado (este documento)

### Estructura
- [x] `src/components/ui/` directorio creado
- [x] `src/theme/` directorio creado

### Git
- [x] Branch `feat/rsuite-phase-0` creada
- [x] Commit de Fase 0 realizado
- [x] Push a remote

---

## 🚨 Troubleshooting

### Problema: "Cannot find module 'rsuite'"

**Causa:** RSuite no se instaló correctamente

**Solución:**
```powershell
cd node-version/client
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

### Problema: Frontend no compila después de agregar RSuite

**Causa:** Conflicto de versiones de React

**Solución:**
```powershell
npm list react
# Verificar que React sea 18.x
# Si no, reinstalar:
npm install react@18 react-dom@18
```

---

### Problema: Estilos se ven completamente rotos

**Causa:** Orden incorrecto de imports CSS

**Solución:** Verificar `main.tsx`:
```tsx
// ❌ INCORRECTO
import './index.css';
import 'rsuite/dist/rsuite.min.css';

// ✅ CORRECTO
import 'rsuite/dist/rsuite.min.css';
import './index.css';
```

---

### Problema: Botón RSuite en Home no se ve

**Causa:** Import incorrecto o typo

**Solución:** Verificar import exacto:
```tsx
import { Button } from 'rsuite';  // ← Correcto
// NO: import Button from 'rsuite/Button';
```

---

## 📈 Métricas de Fase 0

Al completar Fase 0, tu proyecto debe tener:

| Métrica | Antes | Después | Cambio |
|---------|-------|---------|--------|
| **Dependencies** | ~15 | ~16 | +rsuite |
| **Bundle size** | ~100KB | ~350KB | +250KB |
| **Líneas CSS** | 284 | 284 | Sin cambio |
| **Componentes** | ~25 | ~25 | Sin cambio |
| **Funcionalidad** | 100% | 100% | Sin cambio |
| **Errores console** | 0 | 0 | Sin cambio |

**¡NO debe haber cambios funcionales en Fase 0!** Solo preparación.

---

## 🎯 Siguiente Paso: Fase 1

Una vez Fase 0 completada, el siguiente paso es **Fase 1: Componentes Base** del plan de implementación RSuite.

Ver: `docs/PLAN_IMPLEMENTACION_RSUITE.md` - Sección Fase 1

**Tiempo estimado Fase 1:** 2-3 días  
**Componentes afectados:** Buttons, Inputs, Selects básicos

---

## 📞 Ayuda y Referencias

### Documentación RSuite
- **Sitio oficial:** https://rsuitejs.com/
- **Components:** https://rsuitejs.com/components/overview/
- **Customization:** https://rsuitejs.com/guide/customization/
- **TypeScript:** https://rsuitejs.com/guide/typescript/

### Documentación Interna
- [`ARQUITECTURA.md`](ARQUITECTURA.md) - Arquitectura completa del sistema
- [`PLAN_IMPLEMENTACION_RSUITE.md`](PLAN_IMPLEMENTACION_RSUITE.md) - Plan completo 7 fases
- [`DESARROLLO.md`](DESARROLLO.md) - Comandos de desarrollo

---

**Última actualización:** 21 de Febrero, 2026  
**Autor:** Sistema Zapps  
**Estado:** 📝 Listo para ejecutar
