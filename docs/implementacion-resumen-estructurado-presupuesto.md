# Implementación: Resumen Estructurado de Presupuesto

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Estado:** ✅ Implementado

---

## 🎯 Objetivo Implementado

Implementar visualización jerárquica del resumen de presupuesto **en las vistas anual y mensual** respetando la jerarquía funcional confirmada del modelo dimensional.

---

## 📐 Jerarquía Aplicada

### Estructura Implementada

```
INGRESOS (nivel 1) - Grupo raíz
└── Tipo (nivel 2) - Hojas directas

GASTOS (nivel 1) - Grupo raíz
└── Tipo (nivel 2) - Agrupador
    └── Subtipo (nivel 3) - Hojas

AHORROS (nivel 1) - Grupo raíz
└── Tipo (nivel 2) - Hojas directas
```

### Reglas de Renderizado

1. **Ingresos:** 2 niveles visuales (Grupo → Tipo)
   - Código: `ING.xxx`
   - Ejemplo: ING.001 "Sueldo Principal"

2. **Gastos:** 3 niveles visuales (Grupo → Tipo → Subtipo)
   - Código Tipo: `GAS.YYY` (ej: GAS.SUS "Suscripciones")
   - Código Subtipo: `GAS.YYY.zzz` (ej: GAS.SUS.001 "Netflix")

3. **Ahorros:** 2 niveles visuales (Grupo → Tipo)
   - Código: `AHO.xxx`
   - Ejemplo: AHO.001 "AFP"

---

## 📂 Archivos Modificados

### Frontend

| Archivo | Cambios Realizados |
|---------|-------------------|
| `node-version/client/src/pages/PresupuestoResumenNew.tsx` | ✅ Agregada función `buildHierarchy()` para agrupar cuentas jerárquicamente<br>✅ Agregada función `buildHierarchyMonthly()` para agrupar datos mensuales<br>✅ Agregada interfaz `HierarchyNode` para estructura de árbol<br>✅ Agregada interfaz `HierarchyNodeMonthly` para estructura mensual<br>✅ Modificada tabla anual para renderizar jerarquía con indentación<br>✅ Modificada tabla mensual para renderizar jerarquía con indentación<br>✅ Implementado renderizado recursivo de nodos en ambas vistas |

**Nota:** `PresupuestoResumenNew.tsx` contiene AMBAS vistas (anual y mensual) con toggle de navegación entre ellas. La jerarquía se implementó en las dos vistas dentro del mismo archivo.

### Backend

❌ **Sin cambios** - Solo modificaciones en frontend

---

## 🧠 Decisiones Tomadas

### 1. Agrupación Basada en `accountCode`

**Decisión:** Usar el `accountCode` de cada cuenta para derivar la jerarquía automáticamente.

**Justificación:**
- Los códigos siguen un patrón jerárquico consistente (`ING.xxx`, `GAS.YYY.zzz`, `AHO.xxx`)
- No requiere cambios en backend ni modelo de datos
- La agrupación es determinística y sin ambigüedad

**Implementación:**
```typescript
const parts = acc.accountCode.split('.');
const rootPrefix = parts[0]; // ING, GAS, AHO

if (rootPrefix === 'ING' || rootPrefix === 'AHO') {
  // 2 niveles
} else if (rootPrefix === 'GAS') {
  // 3 niveles
}
```

### 2. Renderizado Recursivo

**Decisión:** Implementar función recursiva `renderNode()` para manejar cualquier profundidad de jerarquía.

**Justificación:**
- Escalable a futuros cambios en la jerarquía
- Código más limpio y mantenible
- Evita duplicación de lógica de renderizado

### 3. Indentación Visual Progresiva

**Decisión:** Aplicar `paddingLeft` incremental según profundidad del nodo.

**Fórmula:**
- Nivel 1 (Grupo raíz): `2rem`
- Nivel 2 (Tipo): `3rem`
- Nivel 3 (Subtipo): `4.5rem`

**Justificación:**
- Clara diferenciación visual entre niveles
- Mantiene consistencia con diseño actual
- Legibilidad mejorada

### 4. Estilos Diferenciados por Nivel

**Decisión:** Aplicar estilos visuales distintos según nivel de jerarquía.

**Implementación:**
- **Grupo raíz:** Fondo gris, fuente bold, iconos (💰, 💸, 🏦)
- **Tipo:** Fuente semibold, sin fondo especial
- **Subtipo:** Fuente normal, indentado

---

## ✅ Aclaraciones Funcionales

### Sobre "Bono" como Tipo de Ingreso

**Aclaración:**
- ✅ "Bono" **SÍ puede existir** como tipo de ingreso en el resumen estructurado
- ✅ Si existe una cuenta con código `ING.xxx` y nombre "Bonos", se mostrará en la jerarquía
- ❌ **NO se reintrodujo** la lógica de asignación de bonos eliminada en esta rama
- ❌ **NO se crearon** pantallas, flujos ni servicios de asignación de bonos

**Validación:**
La implementación deriva las categorías directamente desde los datos de `dim_account` via API v2. Si "Bonos" existe como cuenta en la base de datos, se mostrará. Si fue eliminado, no aparecerá.

### Categorías Excluidas

Las siguientes categorías **NO se reintrodujeron** porque fueron eliminadas en esta rama:

- ❌ **PAGO_TC** - Módulo de pagos de tarjetas de crédito eliminado
- ❌ **Tenpo** - Sistema completo de categorización de comercios Tenpo eliminado
- ❌ **Asignación de Bonos** - Flujo de asignación mensual de bonos eliminado

**Nota:** La implementación solo renderiza las cuentas que existan en `dim_account`. No se hardcodean categorías.

---

## 🔍 Supuestos Realizados

### 1. Estructura de Códigos de Cuenta

**Supuesto:** Los códigos de cuenta siguen el patrón:
- `ING.xxx` para ingresos
- `GAS.YYY` para tipos de gastos
- `GAS.YYY.zzz` para subtipos de gastos
- `AHO.xxx` para ahorros

**Validación:** Si existen códigos con patrones diferentes, serán ignorados por `buildHierarchy()`.

### 2. Nombres de Tipos en Gastos

**Supuesto:** Cuando una cuenta tiene código `GAS.SUS` (tipo sin subtipo), su `accountName` contiene el nombre del tipo (ej: "Suscripciones").

**Fallback:** Si el tipo no tiene nombre conocido, se genera como `"Tipo GAS.SUS"`.

### 3. Orden por Monto Descendente

**Supuesto:** Los usuarios prefieren ver las categorías ordenadas por monto mayor a menor dentro de cada nivel.

**Implementación:** Se ordenan children por `totalClp` descendente después de construir la jerarquía.

### 4. Sin Expand/Collapse Inicial

**Supuesto:** Mostrar toda la jerarquía expandida por default para facilitar navegación inicial.

**Alternativa Futura:** Se podría agregar funcionalidad de colapsar/expandir nodos si la jerarquía crece demasiado.

---

## ✅ Validación Funcional Esperada

### Casos de Prueba

#### 1. Ingresos con 2 Niveles
**Entrada:**
```
ING.001 "Sueldo Principal" - $8,000,000
ING.002 "Sueldo Cónyuge" - $3,500,000
ING.003 "Bonos" - $500,000
```

**Salida Esperada:**
```
💰 Ingresos - $12,000,000
    Sueldo Principal - $8,000,000
    Sueldo Cónyuge - $3,500,000
    Bonos - $500,000
```

#### 2. Gastos con 3 Niveles
**Entrada:**
```
GAS.SUS "Suscripciones" - $240,000
GAS.SUS.001 "Netflix" - $80,000
GAS.SUS.002 "Spotify" - $80,000
GAS.SUS.003 "Disney+" - $80,000
```

**Salida Esperada:**
```
💸 Gastos - $10,500,000
    Suscripciones - $240,000
        Netflix - $80,000
        Spotify - $80,000
        Disney+ - $80,000
    (otros tipos...)
```

#### 3. Ahorros con 2 Niveles
**Entrada:**
```
AHO.001 "AFP" - $800,000
AHO.002 "Cuenta Vista" - $500,000
AHO.003 "Fondo de Emergencia" - $200,000
```

**Salida Esperada:**
```
🏦 Ahorros - $1,500,000
    AFP - $800,000
    Cuenta Vista - $500,000
    Fondo de Emergencia - $200,000
```

### Validación de Totales

**Regla:** La suma de todos los nodos hoja debe coincidir con el total del grupo raíz.

**Fórmula de Validación (Vista Anual):**
```typescript
totalIngresos === sum(ingresosNode.children.map(c => c.totalClp))
totalGastos === sum(gastosNode.children.map(c => c.totalClp))
totalAhorros === sum(ahorrosNode.children.map(c => c.totalClp))
```

**Fórmula de Validación (Vista Mensual):**
```typescript
// Para cada mes i (0-11)
ingresosNode.monthlyAmounts[i] === sum(ingresosNode.children.map(c => c.monthlyAmounts[i]))
gastosNode.monthlyAmounts[i] === sum(gastosNode.children.map(c => c.monthlyAmounts[i]))
ahorrosNode.monthlyAmounts[i] === sum(ahorrosNode.children.map(c => c.monthlyAmounts[i]))
```

### Validación Visual

**Checklist Vista Anual:**
- ✅ Grupos raíz tienen fondo gris y fuente bold
- ✅ Tipos tienen indentación de 1.5rem adicional
- ✅ Subtipos tienen indentación de 3rem adicional
- ✅ Iconos 💰, 💸, 🏦 aparecen solo en grupos raíz
- ✅ Porcentajes suman 100% al final de la tabla
- ✅ Orden descendente por monto dentro de cada nivel

**Checklist Vista Mensual:**
- ✅ Grupos raíz tienen fondo gris y fuente bold
- ✅ Tipos tienen indentación de 1rem adicional
- ✅ Subtipos tienen indentación de 2.5rem adicional
- ✅ Iconos 💰, 💸, 🏦 aparecen solo en grupos raíz
- ✅ Columna "Cuenta" sticky a la izquierda durante scroll horizontal
- ✅ Columna "Total" sticky a la derecha durante scroll horizontal
- ✅ 12 columnas mensuales entre código y total
- ✅ Footer muestra totales mensuales correctos
- ✅ Orden descendente por monto total dentro de cada nivel

#### Ejemplo Vista Mensual

**Entrada:**
```
GAS.SUS "Suscripciones"
GAS.SUS.001 "Netflix" - Ene: $10k, Feb: $10k, ..., Total: $120k
GAS.SUS.002 "Spotify" - Ene: $8k, Feb: $8k, ..., Total: $96k
```

**Salida Esperada:**
```
| Cuenta              | Código      | Ene    | Feb    | ... | Dic    | Total     |
|---------------------|-------------|--------|--------|-----|--------|-----------|
| 💸 Gastos           | GAS         | $500k  | $480k  | ... | $520k  | $5,800k   |
|   Suscripciones     | GAS.SUS     | $18k   | $18k   | ... | $18k   | $216k     |
|     Netflix         | GAS.SUS.001 | $10k   | $10k   | ... | $10k   | $120k     |
|     Spotify         | GAS.SUS.002 | $8k    | $8k    | ... | $8k    | $96k      |
```

---

## 🔧 Implementación Técnica

### Función `buildHierarchy()`

**Signature:**
```typescript
function buildHierarchy(accounts: AccountTotal[]): HierarchyNode[]
```

**Algoritmo:**
1. Inicializar 3 nodos raíz: Ingresos, Gastos, Ahorros
2. Iterar sobre todas las cuentas
3. Parsear `accountCode` y determinar jerarquía
4. Para ING/AHO: crear nodos de nivel 2 directos
5. Para GAS: crear nodos de nivel 2 (Tipo) y nivel 3 (Subtipo)
6. Acumular `totalClp` hacia arriba en la jerarquía
7. Ordenar children por monto descendente
8. Retornar array de 3 nodos raíz

**Complejidad:**
- Tiempo: O(n log n) donde n = número de cuentas (por sorting)
- Espacio: O(n) para almacenar jerarquía

### Función `buildHierarchyMonthly()`

**Signature:**
```typescript
function buildHierarchyMonthly(monthlyData: AccountMonthlyData[]): HierarchyNodeMonthly[]
```

**Algoritmo:**
1. Inicializar 3 nodos raíz con arrays de 12 meses
2. Iterar sobre todas las cuentas mensuales
3. Parsear `accountCode` y determinar jerarquía
4. Para ING/AHO: crear nodos de nivel 2 directos con monthlyAmounts
5. Para GAS: crear nodos de nivel 2 (Tipo) y nivel 3 (Subtipo)
6. Acumular `monthlyAmounts[i]` y `totalClp` hacia arriba
7. Ordenar children por monto descendente
8. Retornar array de 3 nodos raíz

**Diferencias con buildHierarchy():**
- Trabaja con `AccountMonthlyData[]` en lugar de `AccountTotal[]`
- Cada nodo contiene `monthlyAmounts: number[]` (12 elementos)
- Acumulación mensual: `typeNode.monthlyAmounts[i] += acc.monthlyAmounts[i]`

**Complejidad:**
- Tiempo: O(n log n + 12n) ≈ O(n log n)
- Espacio: O(12n) ≈ O(n)

### Renderizado Recursivo

#### Vista Anual

**Función:** `renderNode(node: HierarchyNode, depth: number)`

**Lógica:**
1. Calcular padding según profundidad
2. Determinar estilos según nivel del nodo
3. Renderizar fila con datos del nodo
4. Llamada recursiva para children

**Resultado:** Array plano de `JSX.Element[]` para renderizar en `<tbody>`

#### Vista Mensual

**Función:** `renderNodeMonthly(node: HierarchyNodeMonthly, depth: number)`

**Lógica:**
1. Calcular padding según profundidad
2. Determinar estilos según nivel del nodo
3. Renderizar fila con nombre, código, 12 columnas mensuales y total
4. Llamada recursiva para children

**Diferencias con vista anual:**
- Columnas sticky (left y right) para scrolling horizontal
- 12 columnas de montos mensuales entre código y total
- Background colors aplicados a columnas sticky

---

## 🚀 Deploy y Rollout

### Estrategia

**Fase 1:** Deploy a rama `refactor/remove-tenpo-bonos-tc-modules`
- ✅ Implementación completa (ambas vistas)
- ✅ Sin feature flags (cambio directo)

**Fase 2:** Validación con datos reales
- [ ] Verificar que categorías aparecen correctamente en vista anual
- [ ] Verificar que categorías aparecen correctamente en vista mensual
- [ ] Validar totales coinciden con cards de resumen
- [ ] Validar totales mensuales en footer
- [ ] Probar scroll horizontal en vista mensual
- [ ] Verificar columnas sticky funcionan correctamente
- [ ] Probar en diferentes resoluciones

**Fase 3:** Merge a `master`
- [ ] Code review
- [ ] Merge pull request
- [ ] Deploy a producción

### Rollback Plan

**Si hay problemas:**
1. Revertir commit en `PresupuestoResumenNew.tsx`
2. Ambas vistas (anual y mensual) volverán a tabla plana
3. Sin cambios en backend → rollback sin riesgo
4. Sin cambios en API → sin dependencias externas

**Riesgo:** 🟢 Bajo
- Solo modificaciones visuales en frontend
- No hay cambios de estado ni persistencia
- Revertir un solo archivo restaura funcionalidad completa

---

## 📊 Impacto y Métricas

### Cambios de UX

**Antes:**
- Tabla plana de todas las cuentas ordenadas por monto
- Sin agrupación visual
- Difícil identificar categorías principales
- Vista anual y mensual independientes sin estructura común

**Después:**
- Jerarquía clara con 3 grupos principales en ambas vistas
- Subagrupación por tipo y subtipo
- Indentación visual y estilos diferenciados
- Iconos para identificación rápida (💰, 💸, 🏦)
- **Vista Anual:** Columnas simplificadas (Cuenta, Código, Total, %)
- **Vista Mensual:** Scrolling horizontal con columnas sticky (Cuenta fija a izquierda, Total fijo a derecha)
- Consistencia visual entre ambas vistas

### Performance

**Impacto:** ⚙️ Mínimo
- Función `buildHierarchy()` se ejecuta una sola vez después de cargar datos anuales
- Función `buildHierarchyMonthly()` se ejecuta una sola vez después de cargar datos mensuales
- Complejidad O(n log n) aceptable para ~50-100 cuentas típicas
- No hay renderizados adicionales (misma cantidad de filas)
- Vista mensual: 12 operaciones de acumulación por cuenta (O(12n) = O(n))

**Mediciones Esperadas:**
- buildHierarchy(): < 5ms para 100 cuentas
- buildHierarchyMonthly(): < 10ms para 100 cuentas × 12 meses
- Renderizado: Idéntico a tabla plana (mismo número de filas JSX)

---

## 🔮 Mejoras Futuras (No Implementadas)

### 1. Expand/Collapse por Grupo

**Descripción:** Permitir colapsar/expandir grupos raíz y tipos.

**Implementación Sugerida:**
```typescript
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['ING', 'GAS', 'AHO']));
```

**Beneficio:** Reducir scroll en pantalla cuando hay muchas categorías.

### 2. Filtros por Tipo

**Descripción:** Agregar filtros para mostrar solo Ingresos, Gastos o Ahorros.

**Beneficio:** Análisis focalizado en una categoría específica.

### 3. Vista Comparativa Anual

**Descripción:** Mostrar jerarquía con columnas de múltiples años para comparación.

**Beneficio:** Análisis de tendencias año a año.

### 4. Drill-Down a Detalle Mensual

**Descripción:** Click en un tipo/subtipo abre vista mensual filtrada.

**Beneficio:** Navegación fluida entre vistas agregadas y detalladas.

### 5. Export a Excel con Jerarquía

**Descripción:** Exportar tabla jerárquica manteniendo indentación y agrupación.

**Beneficio:** Análisis offline con herramientas externas.

### 6. Sparklines en Vista Mensual

**Descripción:** Agregar gráficos de tendencia pequeños en cada fila de la vista mensual.

**Beneficio:** Visualización rápida de patrones mensuales sin navegar columnas.

### 7. Resaltar Outliers Mensuales

**Descripción:** Destacar meses con montos significativamente diferentes al promedio.

**Beneficio:** Identificación rápida de anomalías o variaciones estacionales.

---

## ✅ Confirmaciones Finales

### Backend
✅ **Confirmado:** No se modificó ningún archivo de backend  
✅ **Confirmado:** No se modificaron endpoints existentes  
✅ **Confirmado:** No se migró a tablas dimensional  

### Frontend
✅ **Confirmado:** Solo se modificó `PresupuestoResumenNew.tsx`  
✅ **Confirmado:** No se tocó `Actual.tsx` ni otros componentes  
✅ **Confirmado:** Se mantiene compatibilidad con API v2 existente  
✅ **Confirmado:** Se mantiene el toggle entre vista anual y vista mensual (ambas ahora jerárquicas)  
✅ **Confirmado:** La jerarquía se implementó en AMBAS vistas (anual y mensual)  

### Módulos Eliminados
✅ **Confirmado:** No se reintrodujo asignación de bonos  
✅ **Confirmado:** No se reintrodujo módulo Tenpo  
✅ **Confirmado:** No se reintrodujo módulo PAGO_TC  

### Categorías
✅ **Confirmado:** "Bono" puede existir como tipo de ingreso válido  
✅ **Confirmado:** Categorías derivadas desde data real, no hardcoded  
✅ **Confirmado:** No se inventaron categorías ni subtipos  

---

## 📚 Referencias

- [docs/resumen-estructurado-presupuesto.md](resumen-estructurado-presupuesto.md) — Base funcional de la implementación
- [node-version/client/src/pages/PresupuestoResumenNew.tsx](../node-version/client/src/pages/PresupuestoResumenNew.tsx) — Archivo modificado
- [node-version/client/src/api/v2Api.ts](../node-version/client/src/api/v2Api.ts) — API utilizada (sin cambios)

---

**Autor:** GitHub Copilot  
**Implementación:** 2026-04-21  
**Estado:** ✅ Completo - Listo para validación
