# Implementación: Colapsar/Expandir en Resumen de Presupuesto

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Estado:** ✅ Implementado

---

## 🎯 Objetivo del Cambio

Agregar funcionalidad de colapsar/expandir nodos con hijos en la vista jerárquica del resumen de presupuesto para facilitar la lectura y navegación cuando hay muchas categorías.

---

## 📺 Vistas Impactadas

### Vista Anual
✅ **Implementado:** Todos los nodos con hijos pueden expandirse/colapsarse

### Vista Mensual
✅ **Implementado:** Todos los nodos con hijos pueden expandirse/colapsarse

**Consistencia:** Ambas vistas comparten el mismo estado de expansión/colapso para mantener coherencia en la navegación del usuario.

---

## 📂 Archivos Modificados

| Archivo | Cambios Realizados |
|---------|-------------------|
| `node-version/client/src/pages/PresupuestoResumenNew.tsx` | ✅ Agregado estado `expandedNodes` (Set de códigos)<br>✅ Agregada función `toggleNode()` para expandir/colapsar<br>✅ Implementada persistencia en localStorage<br>✅ Modificado renderizado en vista anual para incluir chevrons y lógica de colapso<br>✅ Modificado renderizado en vista mensual para incluir chevrons y lógica de colapso<br>✅ Agregados event handlers en nombre y chevron |

**Nota:** Solo se modificó el archivo frontend. No se tocó backend ni modelo de datos.

---

## ⚙️ Comportamiento Implementado

### 1. Nodos Colapsables

**Regla:** Todo nodo que tenga hijos puede expandirse/colapsarse.

**Aplica a:**
- ✅ Grupos raíz (Ingresos, Gastos, Ahorros)
- ✅ Tipos de gasto (ej: GAS.SUS "Suscripciones")
- ✅ Cualquier nodo con children.length > 0

**No aplica a:**
- ❌ Nodos hoja sin hijos (no muestran chevron)

### 2. Interfaz de Usuario

**Chevron Visual:**
- **Expandido:** ▼ (U+25BC)
- **Colapsado:** ▶ (U+25B6)

**Áreas Clickeables:**
1. **Botón de chevron:** Siempre disponible para nodos con hijos
2. **Nombre del nodo:** Clickeable solo para nodos con hijos (cursor pointer)

**Feedback Visual:**
- Chevron cambia color al hover (slate-400 → slate-600)
- Nombre muestra cursor pointer si tiene hijos
- Transición suave de colores

### 3. Renderizado Condicional

**Cuando un nodo está colapsado:**
- ✅ El nodo padre sigue visible con su subtotal
- ❌ Los hijos NO se renderizan (no aparecen en el DOM)
- ✅ Subtotales del nodo padre permanecen correctos
- ✅ Indentación se mantiene consistente

**Cuando un nodo está expandido:**
- ✅ El nodo padre se muestra normalmente
- ✅ Todos los hijos inmediatos se renderizan
- ✅ Los hijos pueden tener su propio estado de expansión/colapso

### 4. Subtotales

**Comportamiento Crítico:**
Los subtotales de un nodo se calculan y muestran **siempre**, independientemente de si sus hijos están visibles o no.

**Ejemplo:**
```
💸 Gastos - $10,500,000 [▼]
  ├─ Suscripciones - $240,000 [▶]  ← Colapsado
  │  (Netflix, Spotify, etc. ocultos)
  └─ Otros - $10,260,000 [▼]
     └─ ...
```

El total de "Gastos" siempre suma $10,500,000 aunque "Suscripciones" esté colapsado.

---

## 💾 Decisión sobre Persistencia

### Estrategia: localStorage

**Implementado:** ✅ Estado de expansión/colapso persiste entre sesiones

**Mecanismo:**
1. Estado se guarda automáticamente en `localStorage` cuando cambia
2. Se carga desde `localStorage` al inicializar el componente
3. Key: `presupuesto-resumen-expanded-nodes`
4. Formato: Array JSON de códigos expandidos

**Código:**
```typescript
// Cargar al inicializar
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
  try {
    const saved = localStorage.getItem('presupuesto-resumen-expanded-nodes');
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Error loading expanded nodes from localStorage:', e);
  }
  return new Set(['ING', 'GAS', 'AHO']); // Default
});

// Guardar al cambiar
useEffect(() => {
  try {
    localStorage.setItem('presupuesto-resumen-expanded-nodes', 
      JSON.stringify([...expandedNodes]));
  } catch (e) {
    console.warn('Error saving expanded nodes to localStorage:', e);
  }
}, [expandedNodes]);
```

**Ventajas:**
- ✅ Simple de implementar (< 20 líneas de código)
- ✅ Sin dependencias adicionales
- ✅ No requiere cambios en backend
- ✅ Mejora significativa de UX
- ✅ Manejo de errores con try/catch

**Limitaciones:**
- ⚠️ Estado no se comparte entre dispositivos/navegadores
- ⚠️ Se pierde si el usuario limpia localStorage
- ⚠️ Específico a cada usuario/navegador

**Alternativa No Implementada:**
- Guardar en backend requeriría crear tabla de user_preferences
- Agregar endpoint para guardar/cargar preferencias
- Considerado excesivo para esta funcionalidad

---

## 🚀 Estado Inicial de Expansión

### Configuración por Defecto

**Cuando NO hay estado guardado en localStorage:**

```typescript
return new Set(['ING', 'GAS', 'AHO']); // Grupos raíz expandidos
```

**Resultado Visual:**
```
💰 Ingresos - $12,000,000 [▼] ← Expandido
  ├─ Sueldo Principal - $8,000,000
  ├─ Sueldo Cónyuge - $3,500,000
  └─ Bonos - $500,000

💸 Gastos - $10,500,000 [▼] ← Expandido
  ├─ Suscripciones - $240,000 [▶] ← Colapsado
  ├─ Alimentación - $3,200,000 [▶] ← Colapsado
  └─ Transporte - $1,800,000 [▶] ← Colapsado

🏦 Ahorros - $1,500,000 [▼] ← Expandido
  ├─ AFP - $800,000
  ├─ Cuenta Vista - $500,000
  └─ Fondo de Emergencia - $200,000
```

**Justificación:**
1. **Grupos raíz expandidos:** Usuario ve inmediatamente las 3 categorías principales
2. **Tipos colapsados:** Reduce scroll inicial, especialmente en Gastos (nivel con más categorías)
3. **Tipos de Ingresos/Ahorros visibles:** Son hojas directas sin subtipo, no agregan mucho scroll
4. **Subtipos de Gastos ocultos:** Nivel más profundo, expandibles a demanda

**Experiencia del Usuario:**
- Primera carga: Vista general con 3 grupos principales
- Click en tipo de gasto: Ver desglose detallado
- Estado persiste: Próxima visita mantiene preferencias

---

## ✅ Validación Funcional Esperada

### Casos de Prueba

#### 1. Expandir/Colapsar Grupo Raíz

**Acción:** Click en "💸 Gastos" o su chevron

**Comportamiento Esperado:**
- ✅ Chevron cambia de ▼ a ▶
- ✅ Todos los tipos de gasto desaparecen
- ✅ Subtotal de "Gastos" sigue visible
- ✅ Fila de "Gastos" permanece en su posición

**Validación:**
```javascript
// Antes
💸 Gastos - $10,500,000 [▼]
  ├─ Suscripciones - $240,000 [▶]
  └─ ...

// Después de click
💸 Gastos - $10,500,000 [▶]
```

#### 2. Expandir Tipo de Gasto

**Acción:** Click en "Suscripciones" con chevron ▶

**Comportamiento Esperado:**
- ✅ Chevron cambia de ▶ a ▼
- ✅ Subtipos aparecen con indentación adicional
- ✅ Subtotal de "Suscripciones" se mantiene

**Validación:**
```javascript
// Antes
  ├─ Suscripciones - $240,000 [▶]

// Después de click
  ├─ Suscripciones - $240,000 [▼]
  │  ├─ Netflix - $80,000
  │  ├─ Spotify - $80,000
  │  └─ Disney+ - $80,000
```

#### 3. Persistencia en localStorage

**Acción:** 
1. Colapsar "Gastos"
2. Expandir "Suscripciones"
3. Recargar página (F5)

**Comportamiento Esperado:**
- ✅ "Gastos" sigue colapsado
- ✅ "Suscripciones" sigue expandido
- ✅ Estado se restaura exactamente como se dejó

**Validación:**
```javascript
localStorage.getItem('presupuesto-resumen-expanded-nodes')
// Debe retornar: ["ING","AHO","GAS.SUS"]
```

#### 4. Nodos Hoja Sin Chevron

**Acción:** Observar nodos sin hijos (ej: "Netflix", "Sueldo Principal")

**Comportamiento Esperado:**
- ✅ No muestran chevron
- ✅ Tienen espacio en blanco donde iría el chevron (alineación)
- ✅ Nombre no es clickeable (cursor default)

**Validación:**
```javascript
// Nodo con hijos
<button>▼</button> Suscripciones

// Nodo hoja
<span class="w-4"></span> Netflix  ← Espacio vacío en lugar de botón
```

#### 5. Consistencia entre Vistas

**Acción:**
1. En vista anual: colapsar "Gastos"
2. Cambiar a vista mensual

**Comportamiento Esperado:**
- ✅ "Gastos" también está colapsado en vista mensual
- ✅ Ambas vistas comparten el mismo estado

**Validación:**
```javascript
// Ambas vistas leen del mismo Set<string>
expandedNodes.has('GAS') // false en ambas
```

#### 6. Totales Correctos con Nodos Colapsados

**Acción:** Colapsar todos los grupos raíz

**Comportamiento Esperado:**
- ✅ Footer muestra total correcto ($24,000,000)
- ✅ Totales individuales se mantienen
- ✅ Cálculos no se ven afectados por la visualización

**Validación:**
```javascript
// Footer debe seguir mostrando
Total Presupuesto Anual: $24,000,000
```

---

## ⚠️ Riesgos y Limitaciones

### Riesgos Identificados

#### 1. Performance con Muchas Categorías

**Escenario:** Usuario con > 200 cuentas

**Riesgo:** 
- ⚠️ Renderizado inicial puede ser lento si todos los nodos están expandidos
- ⚠️ Toggle puede tener lag si hay muchos hijos

**Mitigación Actual:**
- ✅ Estado inicial colapsa tipos de gasto (reduce nodos renderizados)
- ✅ React solo re-renderiza filas afectadas
- ✅ `rowIdx` se mantiene consistente para keys estables

**Mitigación Futura (si es necesario):**
- Virtualización de tabla con react-window
- Paginación por grupo
- Lazy loading de subtipos

#### 2. localStorage Puede Fallar

**Escenario:** 
- Navegación privada
- Límite de 5MB excedido
- Usuario bloquea localStorage

**Riesgo:** 
- ⚠️ Estado no persiste
- ⚠️ Vuelve a default cada vez

**Mitigación Actual:**
- ✅ try/catch envuelve todas las operaciones
- ✅ console.warn informa el error
- ✅ Fallback a estado default funcional

**No Implementado:**
- ❌ UI para avisar al usuario del error
- ❌ Alternativa de almacenamiento

#### 3. Conflictos de Código entre Nodos

**Escenario:** Dos nodos con el mismo código (ej: duplicados en data)

**Riesgo:** 
- ⚠️ Ambos se expanden/colapsan juntos
- ⚠️ Comportamiento inesperado

**Mitigación Actual:**
- ✅ accountCode es único por diseño del modelo
- ✅ buildHierarchy crea códigos únicos (ING, GAS.SUS, etc.)

**Validación:**
- Códigos siempre siguen patrón ING.xxx, GAS.YYY.zzz, AHO.xxx

#### 4. Estado Desincronizado entre Vistas

**Escenario:** Bug en toggle que actualiza solo una vista

**Riesgo:** 
- ⚠️ Usuario ve inconsistencia al cambiar de vista

**Mitigación Actual:**
- ✅ Ambas vistas usan el mismo Set `expandedNodes`
- ✅ Un solo setState actualiza ambas

**Validación:**
- Testeado manualmente con éxito

### Limitaciones Conocidas

#### 1. No hay "Expandir/Colapsar Todo"

**Limitación:** 
Usuario debe expandir/colapsar nodo por nodo.

**Justificación:**
- Funcionalidad opcional que agregaría complejidad UI
- Estado actual es suficiente para MVP
- Puede agregarse en iteración futura

**Implementación Futura:**
```typescript
// Botón en header
<button onClick={() => setExpandedNodes(new Set())}>
  Colapsar Todo
</button>
<button onClick={() => {
  const allCodes = getAllNodeCodes(hierarchy);
  setExpandedNodes(new Set(allCodes));
}}>
  Expandir Todo
</button>
```

#### 2. No hay Indicador de Cantidad de Hijos

**Limitación:** 
Usuario no sabe cuántos hijos tiene un nodo colapsado.

**Ejemplo Actual:**
```
Suscripciones - $240,000 [▶]
```

**Posible Mejora:**
```
Suscripciones (3) - $240,000 [▶]
```

**Justificación:**
- No solicitado en requerimientos
- Puede agregar ruido visual
- Subtotal ya da idea de magnitud

#### 3. No hay Animación de Transición

**Limitación:** 
Filas aparecen/desaparecen instantáneamente.

**Justificación:**
- Animaciones CSS en tablas son complejas
- Puede causar problemas de performance
- Cambio instantáneo es suficientemente claro

**Implementación Futura:**
- Usar react-transition-group
- O cambiar a divs con CSS transitions

#### 4. Estado No Se Comparte entre Usuarios

**Limitación:** 
Cada usuario/navegador tiene su propio estado.

**Justificación:**
- Preferencias visuales son personales
- Backend persistence agregaría complejidad
- localStorage es suficiente para este caso de uso

---

## 🔧 Detalles Técnicos de Implementación

### Estructura de Estado

```typescript
// Set de códigos de nodos expandidos
const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
  new Set(['ING', 'GAS', 'AHO'])
);
```

**Por qué Set en lugar de Array:**
- ✅ Lookup O(1) en lugar de O(n)
- ✅ No permite duplicados automáticamente
- ✅ `.has()` más legible que `.includes()`

**Códigos Usados:**
- Grupos raíz: `ING`, `GAS`, `AHO`
- Tipos de gasto: `GAS.SUS`, `GAS.ALI`, etc.
- Subtipos: `GAS.SUS.001`, `GAS.SUS.002`, etc.
- Tipos de ingreso/ahorro: `ING.001`, `AHO.001`, etc.

### Función Toggle

```typescript
const toggleNode = (nodeCode: string) => {
  setExpandedNodes(prev => {
    const next = new Set(prev);
    if (next.has(nodeCode)) {
      next.delete(nodeCode);
    } else {
      next.add(nodeCode);
    }
    return next;
  });
};
```

**Características:**
- ✅ Inmutable (crea nuevo Set)
- ✅ Toggle booleano (agregar si no existe, eliminar si existe)
- ✅ React detecta cambio y re-renderiza

### Renderizado Condicional

```typescript
// Vista Anual
const hasChildren = node.children.length > 0;
const isExpanded = expandedNodes.has(node.code);

// Renderizar chevron solo si tiene hijos
{hasChildren && (
  <button onClick={() => toggleNode(node.code)}>
    {isExpanded ? '▼' : '▶'}
  </button>
)}

// Renderizar hijos solo si está expandido
if (node.children.length > 0 && isExpanded) {
  node.children.forEach(child => renderNode(child, depth + 1));
}
```

**Vista Mensual:**
Idéntica lógica aplicada en `renderNodeMonthly()`.

---

## 📊 Impacto en UX

### Antes

**Problema:**
- Tabla con 50-100 filas siempre visibles
- Scroll extenso para llegar al footer
- Difícil encontrar categoría específica
- Vista abrumadora en primera carga

### Después

**Mejora:**
- ✅ Vista inicial compacta (3 grupos raíz + tipos top-level)
- ✅ Usuario expande solo lo que necesita ver
- ✅ Navegación más rápida y focalizada
- ✅ Estado persiste entre sesiones (memoriza preferencias)

### Ejemplo Concreto

**Antes (todas las filas visibles):**
- 3 grupos raíz
- 15 tipos
- 45 subtipos
- **Total: 63 filas** → Scroll extenso

**Después (estado inicial):**
- 3 grupos raíz (expandidos)
- 15 tipos (visibles)
- 0 subtipos (colapsados)
- **Total: 18 filas** → Vista manejable

**Usuario puede expandir selectivamente:**
- Solo "Gastos" → Ver 8 tipos de gasto
- Solo "Suscripciones" → Ver 5 servicios
- Resto colapsado → Foco en lo relevante

---

## ✅ Confirmaciones Finales

### Backend
✅ **Confirmado:** No se modificó ningún archivo de backend  
✅ **Confirmado:** No se modificaron endpoints existentes  
✅ **Confirmado:** No se agregaron nuevas llamadas a API  

### Frontend
✅ **Confirmado:** Solo se modificó `PresupuestoResumenNew.tsx`  
✅ **Confirmado:** No se tocó `Actual.tsx` ni otros componentes  
✅ **Confirmado:** No se modificó lógica de agrupación (`buildHierarchy`, `buildHierarchyMonthly`)  
✅ **Confirmado:** Se mantiene compatibilidad total con datos existentes  

### Módulos Eliminados
✅ **Confirmado:** No se reintrodujo asignación de bonos  
✅ **Confirmado:** No se reintrodujo módulo Tenpo  
✅ **Confirmado:** No se reintrodujo módulo PAGO_TC  

### Funcionalidad
✅ **Confirmado:** Implementado en vista anual  
✅ **Confirmado:** Implementado en vista mensual  
✅ **Confirmado:** Persistencia en localStorage funcional  
✅ **Confirmado:** Estado inicial configurado (grupos raíz expandidos)  
✅ **Confirmado:** Manejo de errores con try/catch  

---

## 📚 Referencias

- [docs/implementacion-resumen-estructurado-presupuesto.md](implementacion-resumen-estructurado-presupuesto.md) — Implementación base de jerarquía
- [node-version/client/src/pages/PresupuestoResumenNew.tsx](../node-version/client/src/pages/PresupuestoResumenNew.tsx) — Archivo modificado

---

## 🚀 Próximos Pasos (Opcionales)

### Mejoras Futuras No Implementadas

1. **Botón "Expandir/Colapsar Todo"**
   - Ubicación: Header de tabla
   - Complejidad: Baja
   - Valor: Medio

2. **Indicador de Cantidad de Hijos**
   - Formato: `Suscripciones (3)`
   - Complejidad: Baja
   - Valor: Bajo

3. **Animación de Transición**
   - Librería: react-transition-group
   - Complejidad: Media
   - Valor: Bajo (visual)

4. **Persistencia en Backend**
   - Requiere: Tabla `user_preferences`
   - Complejidad: Alta
   - Valor: Medio (para multi-dispositivo)

5. **Keyboard Shortcuts**
   - Ejemplo: Space/Enter para toggle
   - Complejidad: Baja
   - Valor: Alto (accesibilidad)

---

**Autor:** GitHub Copilot  
**Implementación:** 2026-04-21  
**Estado:** ✅ Completo y Funcional
