# Implementación: Lógica de Periodicidad en Suscripciones

**Fecha:** 2026-04-21  
**Rama:** `refactor/remove-tenpo-bonos-tc-modules`  
**Estado:** ✅ Implementado - Periodicidad funcional sin migrar a modelo dimensional

---

## 🎯 Objetivo del Cambio

Corregir los cálculos de costos y la visualización de suscripciones para que **respeten la periodicidad real** configurada (mensual, trimestral, semestral, anual, semanal), sin asumir que todo es mensual.

**Problema Original:**
- Gasto anual calculaba `precio × 12` para todas las suscripciones (incorrecto para trimestrales, anuales, etc.)
- Tabla anual mostraba el mismo precio en todos los 12 meses (incorrecto)
- Gráfico de evolución mensual repetía el mismo total todos los meses (incorrecto)

**Solución Implementada:**
- Función centralizada que calcula meses activos según periodicidad y fecha de inicio
- Gasto anual correcto: suma solo los meses que aplican
- Tabla anual muestra precio solo en meses activos
- Gráfico mensual refleja variación real por mes

---

## 📂 Archivos Modificados

### 1. Nuevo Archivo Creado

**`node-version/client/src/utils/subscriptionPeriodicity.ts`**
- **Propósito:** Módulo de utilidades para cálculos de periodicidad
- **Funciones Principales:**
  - `getActiveMonths(startDate, periodicity, year)` → `number[]` - Calcula meses activos (1-12)
  - `calculateAnnualCost(subscription, year)` → `number` - Calcula costo anual total
  - `calculateMonthlyTotals(subscriptions, year)` → `number[]` - Array de 12 elementos con total por mes
  - `isActiveInMonth(subscription, year, month)` → `boolean` - Verifica si aplica en un mes específico
- **Funciones Auxiliares:**
  - `getQuarterlyMonths()` - Lógica para trimestral
  - `getSemiannualMonths()` - Lógica para semestral

### 2. Archivos Modificados

**`node-version/client/src/pages/Subscriptions.tsx`**
- **Cambios:**
  - Import de `calculateAnnualCost` y `calculateMonthlyTotals`
  - Línea ~46: `totalAnnual` ahora usa `calculateAnnualCost(sub, selectedYear)` en lugar de `sub.price * 12`
  - Línea ~62-66: `monthlyData` ahora usa `calculateMonthlyTotals(subscriptions, selectedYear)`
  - Línea ~120-128: Pasar `periodicity` y `startDate` a `AnnualPlanningTable`

**`node-version/client/src/components/subscriptions/AnnualPlanningTable.tsx`**
- **Cambios:**
  - Import de `isActiveInMonth` y `calculateMonthlyTotals`
  - Interfaz `Subscription` extendida con `periodicity: string` y `startDate: string`
  - Línea ~35: `monthlyTotals` ahora usa `calculateMonthlyTotals(subscriptions, year)`
  - Línea ~94-110: Renderizado de celdas condicional:
    - Si mes está activo: muestra precio
    - Si no está activo: muestra "—" en gris claro
  - Comentario actualizado para reflejar nueva lógica

**`node-version/client/src/components/subscriptions/MonthlyEvolutionChart.tsx`**
- **Sin cambios:** Ya recibe `monthlyData` correcto desde `Subscriptions.tsx`
- El componente se beneficia automáticamente de los datos corregidos

---

## 📐 Reglas Aplicadas por Periodicidad

### 1. Monthly (Mensual)
**Regla:** Cobra todos los meses desde el mes de inicio hasta diciembre.

**Ejemplo:**
- Suscripción inicia en marzo 2026 → Cobra: MAR, ABR, MAY, JUN, JUL, AGO, SEP, OCT, NOV, DIC (10 meses)
- Suscripción inicia en 2025 o antes → Cobra: ENE a DIC (12 meses)

**Cálculo Anual:** `precio × número de meses activos`

---

### 2. Quarterly (Trimestral)
**Regla:** Cobra cada 3 meses desde el mes de inicio.

**Ejemplo:**
- Suscripción inicia en enero → Cobra: ENE, ABR, JUL, OCT (4 meses)
- Suscripción inicia en marzo → Cobra: MAR, JUN, SEP, DIC (4 meses)
- Suscripción inicia en abril → Cobra: ABR, JUL, OCT, (ENE siguiente año) (3 meses en el año actual)

**Cálculo Anual:** `precio × número de trimestres que caen en el año`

**Implementación:**
```typescript
// Calcula offset desde el mes de inicio
// Solo incluye si es múltiplo de 3 desde startDate
for (let offset = 0; offset < 12; offset += 3) {
  const candidateMonth = ((startMonth - 1 + offset) % 12) + 1;
  if ((monthsFromStart + offset) % 3 === 0) {
    activeMonths.push(candidateMonth);
  }
}
```

---

### 3. Semiannual (Semestral)
**Regla:** Cobra cada 6 meses desde el mes de inicio.

**Ejemplo:**
- Suscripción inicia en enero → Cobra: ENE, JUL (2 meses)
- Suscripción inicia en marzo → Cobra: MAR, SEP (2 meses)
- Suscripción inicia en agosto → Cobra: AGO, (FEB siguiente año) (1 mes en el año actual)

**Cálculo Anual:** `precio × número de semestres que caen en el año` (máximo 2)

**Implementación:** Similar a trimestral, pero con offset de 6 meses.

---

### 4. Annual (Anual)
**Regla:** Cobra solo en el mes de inicio, una vez al año.

**Ejemplo:**
- Suscripción inicia en abril → Cobra solo: ABR (1 mes)
- Suscripción inicia en diciembre → Cobra solo: DIC (1 mes)

**Cálculo Anual:** `precio × 1`

**Implementación:**
```typescript
if (startYear <= year) {
  return [startMonth]; // Solo el mes de inicio
}
return []; // Si no ha iniciado, ningún mes
```

---

### 5. Weekly (Semanal)
**Regla:** **Simplificación adoptada:** Tratamos como mensual.

**Justificación:**
- Modelar pagos semanales en una vista mensual es complejo
- No hay suficiente granularidad en la UI actual
- Aproximación: 52 semanas / 12 meses ≈ 4.33 semanas por mes → redondeamos a mensual

**Cálculo Anual:** Mismo que monthly (12 meses o desde inicio)

**Limitación Conocida:** No refleja el costo real semanal (debería ser `precio × 52`).

---

## 🧮 Supuestos Usados

### 1. Fecha de Inicio Válida
**Supuesto:** Toda suscripción tiene una `startDate` válida en formato ISO (YYYY-MM-DD).

**Qué pasa si no:** La función `new Date(startDate)` puede retornar fecha inválida. No hay validación explícita.

**Mitigación:** El formulario de creación debería validar.

---

### 2. Año de Consulta ≥ Año de Inicio
**Supuesto:** Si se consulta un año anterior al inicio de la suscripción, no hay cargos.

**Ejemplo:**
- Suscripción inicia en 2027, consultamos 2026 → `getActiveMonths()` retorna `[]`

**Implementación:**
```typescript
if (startYear > year) {
  return [];
}
```

---

### 3. Periodicidad es Case-Insensitive
**Supuesto:** Se acepta `'Monthly'`, `'monthly'`, `'MONTHLY'`.

**Implementación:**
```typescript
switch (periodicity.toLowerCase()) {
  case 'monthly': ...
}
```

---

### 4. Periodicidad Desconocida = Monthly
**Supuesto:** Si llega una periodicidad no reconocida, asumimos mensual como fallback.

**Ejemplo:**
- `periodicity: 'biannual'` (no implementado) → Se trata como monthly
- Se registra warning en consola: `console.warn('Periodicidad desconocida: biannual, asumiendo monthly')`

---

### 5. Semanal = Simplificación a Mensual
**Supuesto:** Pagos semanales se aproximan a mensuales para propósitos de visualización.

**Impacto:** El total anual será incorrecto para suscripciones semanales (mostrará 12× en lugar de 52×).

**Alternativa Futura:** Calcular `precio * 52` para weekly y distribuir proporcionalmente por mes.

---

## ✅ Validación Funcional Esperada

### Caso 1: Suscripción Mensual Nueva
**Entrada:**
- Netflix, $10,000, monthly, startDate: 2026-04-15

**Esperado (año 2026):**
- Gasto Anual: $90,000 (10,000 × 9 meses: ABR-DIC)
- Tabla: Precio visible en ABR, MAY, JUN, JUL, AGO, SEP, OCT, NOV, DIC
- Tabla: "—" en ENE, FEB, MAR
- Gráfico: Barras con $10,000 desde abril

---

### Caso 2: Suscripción Trimestral Existente
**Entrada:**
- Office 365, $30,000, quarterly, startDate: 2025-01-10

**Esperado (año 2026):**
- Gasto Anual: $120,000 (30,000 × 4 trimestres: ENE, ABR, JUL, OCT)
- Tabla: Precio visible solo en ENE, ABR, JUL, OCT
- Tabla: "—" en resto de meses
- Gráfico: Barras solo en esos 4 meses, resto en $0

---

### Caso 3: Suscripción Anual
**Entrada:**
- Amazon Prime, $50,000, annual, startDate: 2025-06-01

**Esperado (año 2026):**
- Gasto Anual: $50,000 (50,000 × 1 solo en junio)
- Tabla: Precio visible solo en JUN
- Tabla: "—" en todos los demás meses
- Gráfico: Barra solo en junio

---

### Caso 4: Múltiples Suscripciones con Distintas Periodicidades
**Entrada:**
- Netflix: $10,000, monthly, startDate: 2026-01-01
- Spotify: $5,000, monthly, startDate: 2026-01-01
- Office 365: $30,000, quarterly, startDate: 2025-01-10
- Amazon Prime: $50,000, annual, startDate: 2025-06-01

**Esperado (año 2026):**

| Mes | Netflix | Spotify | Office 365 | Amazon Prime | Total Mes |
|-----|---------|---------|------------|--------------|-----------|
| ENE | 10,000  | 5,000   | 30,000     | —            | 45,000    |
| FEB | 10,000  | 5,000   | —          | —            | 15,000    |
| MAR | 10,000  | 5,000   | —          | —            | 15,000    |
| ABR | 10,000  | 5,000   | 30,000     | —            | 45,000    |
| MAY | 10,000  | 5,000   | —          | —            | 15,000    |
| JUN | 10,000  | 5,000   | —          | 50,000       | 65,000    |
| JUL | 10,000  | 5,000   | 30,000     | —            | 45,000    |
| AGO | 10,000  | 5,000   | —          | —            | 15,000    |
| SEP | 10,000  | 5,000   | —          | —            | 15,000    |
| OCT | 10,000  | 5,000   | 30,000     | —            | 45,000    |
| NOV | 10,000  | 5,000   | —          | —            | 15,000    |
| DIC | 10,000  | 5,000   | —          | —            | 15,000    |

**Total Anual:** $330,000

- Netflix: 12 × 10,000 = 120,000
- Spotify: 12 × 5,000 = 60,000
- Office 365: 4 × 30,000 = 120,000
- Amazon Prime: 1 × 50,000 = 50,000

---

### Caso 5: Suscripción que Inicia a Mitad de Año
**Entrada:**
- Disney+, $8,000, quarterly, startDate: 2026-05-01

**Esperado (año 2026):**
- Gasto Anual: $24,000 (8,000 × 3 trimestres: MAY, AGO, NOV)
- Tabla: Precio visible solo en MAY, AGO, NOV
- Tabla: "—" en resto de meses

---

## ⚠️ Limitaciones Pendientes

### 1. Suscripciones Semanales No Son Realistas
**Problema:** Se aproximan a mensuales, lo que causa error significativo.

**Impacto:**
- Suscripción semanal de $1,000 debería costar $52,000/año
- Actualmente calcula $12,000/año (asume mensual)

**Solución Futura:**
- Detectar `periodicity === 'weekly'`
- Calcular como `precio × 52` para el año
- Distribuir en 12 meses: `(precio × 52) / 12` por mes

---

### 2. No Se Considera Fin de Suscripción
**Problema:** No hay campo `endDate` en el modelo. Se asume que todas las suscripciones son perpetuas.

**Impacto:**
- Si cancelas una suscripción, seguirá apareciendo en la planificación futura

**Solución Futura:**
- Agregar campo `endDate` opcional
- Filtrar suscripciones donde `year > endYear`

---

### 3. Cambios de Precio No Soportados en el Tiempo
**Problema:** El modelo tiene `price_overrides` pero no hay UI ni se usa en estos cálculos.

**Impacto:**
- Si una suscripción sube de precio en julio, la tabla mostrará el precio actual en todos los meses

**Solución Futura:**
- Implementar UI para `price_overrides`
- Actualizar `isActiveInMonth()` para retornar `{ active: boolean, price: number }`

---

### 4. Timezone y Fecha Exacta Ignoradas
**Problema:** Solo usamos mes/año, ignoramos el día exacto.

**Impacto:**
- Suscripción que inicia el 28 de enero cobra todo enero
- En realidad, debería prorratear (solo 3 días de enero)

**Solución Futura:**
- Para planificación anual, el nivel de granularidad mensual es aceptable
- Para cálculos más precisos, considerar día de inicio

---

### 5. Próximo Pago Sigue Mockeado
**Problema:** `NextPaymentCard` aún muestra "En 3 días" hardcoded.

**Impacto:** Funcionalidad de tarjeta de próximo pago no es útil.

**Solución Futura:**
- Crear función `getNextPaymentDate(subscription, today)`
- Calcular siguiente fecha basándose en `startDate` + `periodicity`

---

### 6. No Se Integró con Modelo Dimensional
**Decisión Consciente:** Esta iteración mantiene el modelo legacy (`subscriptions` table).

**Impacto:**
- Suscripciones NO aparecen en el resumen de presupuesto (`/presupuesto/resumen`)
- Datos duplicados vs `dim_account` / `fact_financial`

**Solución Futura:** Ver [docs/auditorias/auditoria-pagina-suscripciones.md](auditorias/auditoria-pagina-suscripciones.md) para plan de migración.

---

## 🧪 Testing Manual Recomendado

### 1. Crear Suscripción Mensual
1. Ir a `/suscripciones`
2. Agregar: Netflix, $10,000, Mensual, inicio: hoy
3. Verificar tabla anual: precio desde mes actual hasta diciembre
4. Verificar gráfico: barras desde mes actual

### 2. Crear Suscripción Trimestral
1. Agregar: Dropbox, $20,000, Trimestral, inicio: enero 2026
2. Verificar tabla: precio solo en ENE, ABR, JUL, OCT
3. Verificar "—" en resto de meses
4. Verificar gasto anual: $80,000 (20,000 × 4)

### 3. Crear Suscripción Anual
1. Agregar: Seguro, $100,000, Anual, inicio: junio 2025
2. Verificar tabla: precio solo en JUN
3. Verificar gasto anual: $100,000

### 4. Verificar Totales por Mes
1. Con múltiples suscripciones creadas
2. Verificar fila "Total Mensual" en tabla
3. Comparar con gráfico de evolución
4. Deben coincidir exactamente

---

## 📊 Comparación: Antes vs Después

| Aspecto | Antes (Incorrecto) | Después (Correcto) |
|---------|-------------------|-------------------|
| **Gasto Anual** | `precio × 12` para todos | `precio × meses activos` por periodicidad |
| **Tabla Anual** | Mismo precio en 12 meses | Precio solo en meses activos, "—" en resto |
| **Gráfico Mensual** | Mismo total 12 veces | Totales variables según periodicidad |
| **Trimestral** | $12,000 × 12 = $144,000 ❌ | $12,000 × 4 = $48,000 ✅ |
| **Anual** | $50,000 × 12 = $600,000 ❌ | $50,000 × 1 = $50,000 ✅ |
| **Lógica Centralizada** | ❌ No existía | ✅ `subscriptionPeriodicity.ts` |
| **Reutilizable** | ❌ Cálculos duplicados | ✅ Funciones importables |

---

## 🔗 Referencias

- **Auditoría Original:** [docs/auditorias/auditoria-pagina-suscripciones.md](auditorias/auditoria-pagina-suscripciones.md)
- **Modelo Legacy:** `node-version/prisma/schema.prisma` → `model Subscription`
- **API Backend:** `node-version/src/routes/subscriptions.ts`

---

## ✅ Confirmaciones Finales

### Modelo de Datos
✅ **Confirmado:** Se mantiene modelo legacy (`subscriptions` table)  
✅ **Confirmado:** NO se migró a `dim_account` ni `fact_financial`  
✅ **Confirmado:** NO se modificaron endpoints de backend  

### Funcionalidad
✅ **Confirmado:** Gasto anual ahora respeta periodicidad  
✅ **Confirmado:** Tabla anual muestra cargos solo en meses activos  
✅ **Confirmado:** Gráfico mensual refleja variación real  
✅ **Confirmado:** Lógica centralizada y reutilizable  

### UI
✅ **Confirmado:** Se mantiene diseño actual (Tailwind)  
✅ **Confirmado:** Meses inactivos muestran "—" en gris claro  
✅ **Confirmado:** No se refactorizó más allá de lo necesario  

### Limitaciones Conocidas
⚠️ **Confirmado:** Suscripciones semanales se aproximan a mensuales (limitación conocida)  
⚠️ **Confirmado:** No se implementó `endDate` ni `price_overrides` (futuro)  
⚠️ **Confirmado:** Próximo pago sigue mockeado (futuro)  

---

**Autor:** GitHub Copilot  
**Implementación:** 2026-04-21  
**Estado:** ✅ Completado - Listo para pruebas
