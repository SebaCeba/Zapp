# UI: Desglose de Costos en Detalle de Compra Tenpo

**Fecha:** 31 enero 2025  
**Versión:** 1.0  
**Autor:** Sistema  
**Estado:** ✅ IMPLEMENTADO

---

## 📋 Resumen Ejecutivo

Se ha actualizado la interfaz de usuario del módulo Tenpo (`client/src/pages/Tenpo.tsx`) para mostrar un **desglose detallado de costos** cuando el usuario expande una compra. 

El nuevo diseño mejora la transparencia financiera al separar visualmente:
- Capital base
- Comisión operacional (fee)
- Base financiada (capital + fee)
- Interés por cuotas
- Total financiado

Además, se añadieron **badges visuales** que distinguen claramente entre datos estimados (proyección) y confirmados (valores reales del banco).

---

## 🎯 Objetivos

1. **Transparencia:** Mostrar todos los componentes del costo financiado
2. **Claridad visual:** Diferenciar ESTIMADO (proyección) vs REAL (confirmado)
3. **No recalcular:** Solo mostrar datos del backend (sin lógica de cálculo en frontend)
4. **UX profesional:** Usar badges y colores semánticos para indicar estado

---

## 🎨 Cambios de UI

### 1. Interface TypeScript Actualizada

**Archivo:** `node-version/client/src/pages/Tenpo.tsx`

**Campos agregados a `Purchase`:**
```typescript
interface Purchase {
  // ... campos existentes
  feePct?: number | null;         // Porcentaje de fee (ej: 0.02 = 2%)
  feeAmountClp?: number | null;   // Monto del fee en CLP
  financedBaseClp?: number | null; // Base sobre la cual se aplica interés
  installments: Installment[];
}
```

**Razón:** Estos campos son computados por el backend (endpoint `GET /api/tenpo/purchases`) y expuestos solo cuando `modoMonto='ESTIMADO'` y existe `metadata.feePct`.

### 2. Sección de Desglose de Costos

**Ubicación:** Líneas 731-811 (dentro del detalle expandido de compra)

**Estructura visual:**
```
┌─────────────────────────────────────────────────────┐
│ ✓ Confirmado  [REAL]                                │
│ ─────────────────────────────────────────────────── │
│ Capital:                        $218,365            │
│ Comisión (2.00%):              +$4,367              │
│ Base financiada:                $222,732            │
│ Interés por cuotas:            +$14,099             │
│ Total financiado:               $236,831            │
└─────────────────────────────────────────────────────┘
```

**Componentes:**

#### A. Header con Badge de Estado

**Modo REAL (Confirmado):**
```tsx
<div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <span style={{ color: '#059669' }}>✓ Confirmado</span>
  <span style={{ 
    backgroundColor: '#d1fae5',  // Verde claro
    color: '#065f46',             // Verde oscuro
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600'
  }}>
    REAL
  </span>
</div>
```

**Modo ESTIMADO (Proyección):**
```tsx
<div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
  <span style={{ color: '#6b7280' }}>Proyección</span>
  <span style={{ 
    backgroundColor: '#f3f4f6',  // Gris claro
    color: '#6b7280',             // Gris medio
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: '600'
  }}>
    ESTIMADO
  </span>
</div>
```

#### B. Grid de Desglose

**Estilo:** Grid de 2 columnas (label | valor)
```tsx
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'auto 1fr', 
  gap: '0.5rem 1rem', 
  fontSize: '0.875rem' 
}}>
  <span style={{ color: '#6b7280' }}>Capital:</span>
  <span style={{ fontWeight: '500' }}>${capital}</span>
  
  {/* Comisión (solo si existe feePct) */}
  {purchase.feePct && purchase.feeAmountClp && (
    <>
      <span style={{ color: '#6b7280' }}>Comisión ({feePct}%):</span>
      <span style={{ fontWeight: '500', color: '#dc2626' }}>+${feeAmount}</span>
    </>
  )}
  
  {/* Base financiada (solo si difiere del capital) */}
  {purchase.financedBaseClp && purchase.financedBaseClp !== purchase.amountTotalClp && (
    <>
      <span style={{ color: '#6b7280' }}>Base financiada:</span>
      <span style={{ fontWeight: '600', color: '#1f2937' }}>${financedBase}</span>
    </>
  )}
  
  {/* Interés (solo si hay más de 1 cuota) */}
  {purchase.installmentsCount > 1 && (
    <>
      <span style={{ color: '#6b7280' }}>Interés por cuotas:</span>
      <span style={{ fontWeight: '500', color: '#dc2626' }}>+${interes}</span>
    </>
  )}
  
  {/* Total financiado (siempre visible) */}
  <span style={{ color: '#6b7280', fontWeight: '600' }}>Total financiado:</span>
  <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: '#1f2937' }}>
    ${totalFinanciado}
  </span>
</div>
```

---

## 🧠 Rationale UX

### 1. Transparencia Financiera

**Problema:** El usuario no sabía si el total incluía fees adicionales.

**Solución:** Desglosar cada componente del costo:
- **Capital:** El monto original de la compra
- **Comisión:** Fee operacional del banco (si aplica)
- **Base financiada:** Capital + fee (el monto sobre el cual se cobra interés)
- **Interés:** Costo adicional por pagar en cuotas
- **Total:** La suma final que debe pagar

**Beneficio:** El usuario entiende exactamente qué está pagando y por qué.

### 2. Diferenciación Visual: ESTIMADO vs REAL

**Problema:** No quedaba claro si los montos eran definitivos o calculados.

**Solución:**
- **ESTIMADO (gris):** Indica "Proyección" → datos calculados, pueden cambiar
- **REAL (verde + ✓):** Indica "Confirmado" → datos del banco, finales

**Principios de diseño:**
- Verde con checkmark (✓) = confirmación, seguridad
- Gris = neutral, tentativo, no definitivo
- El texto "Proyección" vs "Confirmado" es más claro que solo "ESTIMADO" vs "REAL"

**Beneficio:** El usuario no confunde estimaciones con valores confirmados.

### 3. Progresión Visual de Costos

**Flujo de lectura:**
```
Capital              (punto de partida)
  ↓
+ Comisión           (cargo adicional)
  ↓
= Base financiada    (subtotal)
  ↓
+ Interés            (cargo por cuotas)
  ↓
= Total financiado   (TOTAL FINAL destacado)
```

**Técnicas:**
- Labels en gris (#6b7280) para roles secundarios
- Valores en negrita para énfasis
- Rojo (#dc2626) para cargos adicionales (fee e interés) → señal de "costo extra"
- Total en negrita extra (#1f2937, 700 weight) → jerarquía visual

**Beneficio:** El usuario sigue naturalmente la construcción del costo total.

### 4. Renderizado Condicional Inteligente

**Regla 1:** Mostrar comisión **solo si existe**
```tsx
{purchase.feePct && purchase.feeAmountClp && (
  // mostrar comisión
)}
```
**Razón:** No confundir al usuario con líneas de "Comisión: $0" si no hay fee.

**Regla 2:** Mostrar base financiada **solo si difiere del capital**
```tsx
{purchase.financedBaseClp && purchase.financedBaseClp !== purchase.amountTotalClp && (
  // mostrar base financiada
)}
```
**Razón:** Si no hay fee, base = capital (redundante mostrar ambos).

**Regla 3:** Mostrar interés **solo si hay más de 1 cuota**
```tsx
{purchase.installmentsCount > 1 && (
  // mostrar interés
)}
```
**Razón:** Compras de 1 cuota no tienen interés (incluso si tieneInteres=true).

**Beneficio:** UI limpia, sin información redundante.

### 5. Consistencia con Backend

**Principio:** El frontend **NO recalcula** nada.

**Implementación:**
- Todos los valores vienen del backend (`GET /api/tenpo/purchases`)
- El backend computa `feePct`, `feeAmountClp`, `financedBaseClp` solo para modo ESTIMADO
- El frontend solo formatea y muestra los datos recibidos

**Beneficio:** 
- Fuente única de verdad (backend)
- No hay inconsistencias entre frontend y backend
- Mantenimiento más simple (lógica de negocio centralizada)

---

## 📦 Componentes Tocados

### 1. `node-version/client/src/pages/Tenpo.tsx`

**Líneas modificadas:** 8-21 (interface), 731-811 (UI detalle)

**Cambios:**
1. **Interface `Purchase`:**
   - Agregados: `feePct?`, `feeAmountClp?`, `financedBaseClp?`
   
2. **Sección de detalle expandido:**
   - **Antes:** Una línea simple con capital → total (+ interés)
   - **Después:** Grid estructurado con:
     - Header con badge (ESTIMADO/REAL)
     - Capital
     - Comisión (condicional)
     - Base financiada (condicional)
     - Interés (condicional)
     - Total financiado (destacado)

**Dependencias:** Ninguna (solo estilos inline)

---

## 🎨 Paleta de Colores Utilizada

| Elemento | Color | Código | Semántica |
|----------|-------|--------|-----------|
| Badge REAL (fondo) | Verde claro | `#d1fae5` | Confirmación positiva |
| Badge REAL (texto) | Verde oscuro | `#065f46` | Confirmación positiva |
| Badge REAL (icono) | Verde medio | `#059669` | ✓ Confirmado |
| Badge ESTIMADO (fondo) | Gris claro | `#f3f4f6` | Neutral, tentativo |
| Badge ESTIMADO (texto) | Gris medio | `#6b7280` | Neutral, tentativo |
| Labels (descripción) | Gris medio | `#6b7280` | Texto secundario |
| Valores estándar | Negro suave | `#1f2937` | Texto primario |
| Cargos adicionales | Rojo | `#dc2626` | Advertencia de costo extra |
| Contenedor (fondo) | Gris muy claro | `#f9fafb` | Fondo sutil |
| Contenedor (borde) | Gris borde | `#e5e7eb` | Separación visual |

**Inspiración:** Tailwind CSS color palette (escala gray-* y emerald-*).

---

## 📊 Ejemplos Visuales

### Ejemplo 1: Compra ESTIMADA con Fee

**Datos:**
- Capital: $218,365
- Fee: 2% → $4,367
- Base financiada: $222,732
- Interés: $14,099
- Total: $236,831

**Renderizado:**
```
┌────────────────────────────────────────────┐
│ Proyección  [ESTIMADO]                     │
│ ──────────────────────────────────────────│
│ Capital:                    $218,365       │
│ Comisión (2.00%):          +$4,367         │  (rojo)
│ Base financiada:            $222,732       │  (negrita)
│ Interés por cuotas:        +$14,099        │  (rojo)
│ Total financiado:           $236,831       │  (extra negrita)
└────────────────────────────────────────────┘
```

### Ejemplo 2: Compra REAL sin Fee

**Datos:**
- Capital: $100,000
- Fee: null
- Interés: $6,330
- Total: $106,330

**Renderizado:**
```
┌────────────────────────────────────────────┐
│ ✓ Confirmado  [REAL]                       │  (verde)
│ ──────────────────────────────────────────│
│ Capital:                    $100,000       │
│ Interés por cuotas:         +$6,330        │  (rojo)
│ Total financiado:           $106,330       │  (extra negrita)
└────────────────────────────────────────────┘
```

**Nota:** No se muestra "Comisión" ni "Base financiada" porque no hay fee.

### Ejemplo 3: Compra 1 Cuota (sin interés)

**Datos:**
- Capital: $50,000
- Cuotas: 1
- tieneInteres: false

**Renderizado:**
```
┌────────────────────────────────────────────┐
│ Proyección  [ESTIMADO]                     │
│ ──────────────────────────────────────────│
│ Capital:                     $50,000       │
│ Total financiado:            $50,000       │
└────────────────────────────────────────────┘
```

**Nota:** No se muestra interés porque `installmentsCount === 1`.

---

## ✅ Checklist de Validación UX

### Pre-Implementación

- [x] Definir paleta de colores semántica (verde = confirmado, gris = estimado)
- [x] Diseñar jerarquía visual (total destacado > valores > labels)
- [x] Establecer reglas de renderizado condicional
- [x] Asegurar que frontend NO recalcula (solo muestra datos del backend)

### Post-Implementación (verificar manualmente)

#### 1. Estados Visuales

- [ ] **Badge ESTIMADO:**
  - Compra con `modoMonto='ESTIMADO'` muestra badge gris con texto "Proyección"
  - Badge tiene fondo `#f3f4f6` y texto `#6b7280`

- [ ] **Badge REAL:**
  - Compra con `modoMonto='REAL'` muestra badge verde con ✓ y texto "Confirmado"
  - Badge tiene fondo `#d1fae5` y texto `#065f46`

#### 2. Desglose de Costos

- [ ] **Capital:**
  - Siempre visible
  - Formato: `$XXX.XXX` (separador de miles)

- [ ] **Comisión:**
  - Visible solo si `feePct && feeAmountClp` existen
  - Muestra porcentaje: "Comisión (2.00%)"
  - Valor en rojo (#dc2626) con signo "+"
  - NO visible si feePct es null

- [ ] **Base financiada:**
  - Visible solo si `financedBaseClp !== amountTotalClp`
  - En negrita (#1f2937, weight 600)
  - NO visible si no hay fee (redundante)

- [ ] **Interés por cuotas:**
  - Visible solo si `installmentsCount > 1`
  - Valor en rojo (#dc2626) con signo "+"
  - NO visible en compras de 1 cuota

- [ ] **Total financiado:**
  - Siempre visible
  - Extra negrita (weight 700, fontSize: 0.9375rem)
  - Destacado visualmente del resto

#### 3. Casos Edge

- [ ] **Compra sin fee:**
  - No muestra línea "Comisión"
  - No muestra línea "Base financiada"
  - Solo muestra Capital + Interés (si n>1) + Total

- [ ] **Compra 1 cuota:**
  - No muestra línea "Interés por cuotas"
  - Total = Capital (o Capital + Fee si tiene fee)

- [ ] **Compra REAL:**
  - Badge verde con ✓
  - Todos los valores son finales (no editables)

- [ ] **Compra sin interés (`tieneInteres=false`):**
  - El desglose NO se muestra (está dentro del bloque `{purchase.tieneInteres && ...}`)
  - Solo aparece checkbox "Con interés" sin el desglose

#### 4. Responsive y UX

- [ ] **Contenedor:**
  - Fondo gris claro (#f9fafb)
  - Borde sutil (#e5e7eb)
  - Padding adecuado (0.75rem)
  - Bordes redondeados (0.375rem)

- [ ] **Grid:**
  - Labels alineados a la izquierda
  - Valores alineados a la derecha
  - Gap consistente (0.5rem vertical, 1rem horizontal)

- [ ] **Legibilidad:**
  - Labels en gris (#6b7280) → texto secundario
  - Valores en negro (#1f2937) → texto primario
  - Cargos en rojo (#dc2626) → alerta visual de costo extra

---

## 🚀 Próximas Mejoras (Futuro)

### 1. Tooltips Explicativos

Agregar tooltips (ℹ️) en hover sobre términos técnicos:
- **Base financiada:** "Monto sobre el cual se aplica el interés (Capital + Comisión)"
- **Interés por cuotas:** "Costo adicional por pagar en cuotas (2.11% mensual × n meses)"

### 2. Gráfico Visual de Desglose

Barra de progreso apilada mostrando proporción de cada componente:
```
[████ Capital ████][█ Fee █][███ Interés ███]
```

### 3. Comparador ESTIMADO vs REAL

Si una compra fue recalculada de ESTIMADO a REAL, mostrar comparación:
```
Proyección original: $236,831
Valor confirmado:    $236,500  (-$331 menos de lo estimado)
```

### 4. Exportar Detalle a PDF

Botón para exportar el desglose de costos a PDF con logo y formato profesional.

### 5. Indicador de Precisión

Para compras ESTIMADAS, mostrar nivel de confianza:
```
⚠️ Estimación (±2%): Valores pueden variar al confirmar con el banco
```

---

## 📚 Referencias

- [tenpo_addon_fee_base.md](./tenpo_addon_fee_base.md) - Fórmula de cálculo con fee
- [tenpo_fee_exposure.md](./tenpo_fee_exposure.md) - Exposición de campos en API
- [Tenpo.tsx](../node-version/client/src/pages/Tenpo.tsx) - Componente React actualizado
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) - Paleta de colores utilizada

---

## 📝 Notas Técnicas

### Renderizado Condicional

**Por qué no mostrar "Comisión: $0"?**
- UX Cluttered: Líneas innecesarias confunden
- Semántica incorrecta: Si no hay fee, no hay comisión (no es "comisión de $0")
- Principio de parsimonia: Mostrar solo información relevante

**Por qué no mostrar "Base financiada" si es igual a Capital?**
- Redundancia visual: Capital y Base serían el mismo número
- Confusión conceptual: El usuario podría preguntarse "¿por qué hay dos líneas iguales?"
- Simplificación: Si no hay fee, no hay razón para introducir el concepto de "base financiada"

### Formateo de Montos

**Uso de `Math.round()`:**
```tsx
${Math.round(purchase.amountTotalClp).toLocaleString('es-CL')}
```

**Razón:**
- Los valores del backend pueden tener decimales por precisión de cálculo
- El peso chileno no usa decimales en transacciones (no hay centavos)
- `toLocaleString('es-CL')` agrega separadores de miles (`.` en Chile)

**Ejemplo:**
- Backend: `218365.4832`
- Frontend: `$218.365` (redondeado a entero)

---

**FIN DEL DOCUMENTO**
