# UI: Compras Tenpo Manuales

**Fecha:** 2026-02-01  
**Ubicación:** Página Tenpo (`node-version/client/src/pages/Tenpo.tsx`)  
**Objetivo:** Interfaz para crear compras Tenpo manuales sin origen en Gmail.

---

## Componentes Implementados

### 1. Botón "Agregar compra manual"

**Ubicación:** Sección de controles, al lado del botón "Actualizar desde Gmail"

**Línea aproximada:** ~610 (después del botón de sincronización)

**Estilo:**
- Color verde (#10b981) para distinguir de botón de sync (azul)
- Icono: ➕
- Texto: "Agregar compra manual"

**Función:**
- Abre modal `manualModalOpen = true`

### 2. Modal de Creación

**Ubicación:** Final de Tenpo.tsx, antes del Toast

**Línea aproximada:** ~1290-1430

**Estructura:**
- Overlay oscuro (rgba 0,0,0,0.5)
- Card centrado (max-width 500px)
- z-index: 1000 (sobre todo el contenido)

### 3. Formulario

**Campos del formulario:**

1. **Fecha de compra** (requerido)
   - Tipo: date
   - Default: Fecha actual
   - Estado: `manualForm.purchaseDate`

2. **Comercio** (requerido)
   - Tipo: text
   - Placeholder: "Ej: Tienda XYZ"
   - Estado: `manualForm.merchant`

3. **Monto total (CLP)** (requerido)
   - Tipo: number
   - Min: 1
   - Placeholder: "30000"
   - Estado: `manualForm.amountTotalClp`

4. **Número de cuotas** (requerido)
   - Tipo: number
   - Min: 1
   - Default: "1"
   - Estado: `manualForm.installmentsCount`

5. **Tiene interés** (opcional)
   - Tipo: checkbox
   - Default: true (marcado)
   - Estado: `manualForm.tieneInteres`

6. **Fecha primera cuota** (opcional)
   - Tipo: date
   - Dejar vacío para cálculo automático
   - Estado: `manualForm.firstDueDateOverride`
   - Nota: "Dejar vacío para calcular automáticamente"

**Botones:**
- ✅ Crear (verde) → `handleCreateManualPurchase()`
- ❌ Cancelar (gris) → Cierra modal y limpia form

---

## Lógica de Validación

### Cliente (Frontend)

**En `handleCreateManualPurchase()`:**

1. Verificar campos requeridos:
   ```typescript
   if (!merchant || !amountTotalClp || !installmentsCount) {
     toast error: "Completa todos los campos requeridos"
   }
   ```

2. Validar monto:
   ```typescript
   const amountClp = parseFloat(amountTotalClp);
   if (isNaN(amountClp) || amountClp <= 0) {
     toast error: "El monto debe ser mayor a 0"
   }
   ```

3. Validar cuotas:
   ```typescript
   const installments = parseInt(installmentsCount);
   if (isNaN(installments) || installments < 1) {
     toast error: "El número de cuotas debe ser mayor o igual a 1"
   }
   ```

### Request Body

**Construcción:**
```typescript
const body: any = {
  purchaseDate: manualForm.purchaseDate,
  merchant: manualForm.merchant,
  amountTotalClp: amountClp,
  installmentsCount: installments,
  tieneInteres: manualForm.tieneInteres
};

// Si hay override de fecha primera cuota
if (manualForm.firstDueDateOverride) {
  body.scheduleMode = 'MANUAL';
  body.firstDueDateOverride = manualForm.firstDueDateOverride;
}
```

**Endpoint:**
```
POST http://localhost:3000/api/tenpo/purchases/manual
```

---

## Flujo de Usuario

### Caso 1: Compra simple (automática)

1. Usuario hace clic en "➕ Agregar compra manual"
2. Modal se abre con campos vacíos (excepto fecha actual y tiene interés marcado)
3. Usuario completa:
   - Fecha: 2026-02-01
   - Comercio: "Supermercado ABC"
   - Monto: 45000
   - Cuotas: 3
   - Tiene interés: ✓ (marcado)
   - Fecha primera cuota: (vacío)
4. Usuario hace clic en "✅ Crear"
5. Frontend valida campos
6. POST a /api/tenpo/purchases/manual
7. Backend crea compra y cuotas automáticamente
8. Modal se cierra
9. Toast verde: "✅ Compra manual creada exitosamente"
10. Lista de compras se refresca (`loadData()`)

### Caso 2: Compra con fecha manual

1-3. Igual que Caso 1
4. Usuario además completa:
   - Fecha primera cuota: 2026-03-10
5-10. Igual que Caso 1
   - Backend usa scheduleMode='MANUAL' y firstDueDateOverride

### Caso 3: Compra sin interés

1-3. Igual que Caso 1
4. Usuario desmarca "Tiene interés"
5-10. Igual que Caso 1
   - Backend genera cuotas sin interés (monto/n)

### Caso 4: Error de validación

1-3. Igual que Caso 1
4. Usuario deja campo "Comercio" vacío
5. Usuario hace clic en "✅ Crear"
6. Frontend muestra toast rojo: "Completa todos los campos requeridos"
7. Modal permanece abierto
8. Usuario completa campo faltante

### Caso 5: Cancelar

1-3. Igual que Caso 1
4. Usuario hace clic en "❌ Cancelar"
5. Modal se cierra
6. Form se limpia (reset a valores default)
7. No se hace request al backend

---

## Integración con Estado

### Estado del componente

**Nuevos estados agregados:**
```typescript
const [manualModalOpen, setManualModalOpen] = useState(false);
const [manualForm, setManualForm] = useState({
  purchaseDate: new Date().toISOString().split('T')[0],
  merchant: '',
  amountTotalClp: '',
  installmentsCount: '1',
  tieneInteres: true,
  firstDueDateOverride: ''
});
```

### Función de creación

**`handleCreateManualPurchase()`:**
- Valida campos
- Construye body
- Hace POST a /api/tenpo/purchases/manual
- Maneja éxito: cierra modal, limpia form, refresca datos
- Maneja error: muestra toast con mensaje de error

### Refresco de datos

**Después de crear:**
```typescript
await loadData();
```

Esto recarga:
- `purchases` (incluye la nueva compra manual)
- `payments` (sin cambios)

La nueva compra aparecerá en la tabla principal con sus cuotas distribuidas por mes.

---

## Pasos de Prueba

### Prueba 1: Compra en 3 cuotas con interés (modo AUTO)

1. Abrir página Tenpo: http://localhost:5173/presupuesto/tenpo
2. Hacer clic en "➕ Agregar compra manual"
3. Completar:
   - Fecha compra: 2026-02-01
   - Comercio: "Prueba TEST 3 cuotas"
   - Monto: 30000
   - Cuotas: 3
   - Tiene interés: ✓
   - Fecha primera cuota: (vacío)
4. Hacer clic en "✅ Crear"
5. **Resultado esperado:**
   - Toast verde "✅ Compra manual creada exitosamente"
   - Modal se cierra
   - Aparece nueva fila en tabla con "Prueba TEST 3 cuotas"
   - Tiene 3 cuotas distribuidas en meses siguientes
   - Cada cuota tiene interés calculado (~$10,633 c/u)

### Prueba 2: Compra en 1 cuota sin interés

1. Hacer clic en "➕ Agregar compra manual"
2. Completar:
   - Fecha compra: 2026-02-01
   - Comercio: "Compra única"
   - Monto: 15000
   - Cuotas: 1
   - Tiene interés: ✗ (desmarcar)
3. Hacer clic en "✅ Crear"
4. **Resultado esperado:**
   - Nueva compra con 1 cuota de $15,000 exacto (sin interés)

### Prueba 3: Compra con calendario manual

1. Hacer clic en "➕ Agregar compra manual"
2. Completar:
   - Fecha compra: 2026-02-01
   - Comercio: "Fecha manual"
   - Monto: 60000
   - Cuotas: 6
   - Fecha primera cuota: 2026-03-15
3. Hacer clic en "✅ Crear"
4. **Resultado esperado:**
   - Cuotas caen los días 15 de cada mes (no el 5)
   - Primera cuota en Marzo 15, última en Agosto 15

### Prueba 4: Validación de campos vacíos

1. Hacer clic en "➕ Agregar compra manual"
2. Dejar "Comercio" vacío
3. Completar "Monto: 1000"
4. Hacer clic en "✅ Crear"
5. **Resultado esperado:**
   - Toast rojo "Completa todos los campos requeridos"
   - Modal permanece abierto
   - No se crea compra

### Prueba 5: Validación de monto inválido

1. Hacer clic en "➕ Agregar compra manual"
2. Completar:
   - Comercio: "Test"
   - Monto: -500 (negativo)
3. Hacer clic en "✅ Crear"
4. **Resultado esperado:**
   - Toast rojo "El monto debe ser mayor a 0"
   - Modal permanece abierto

### Prueba 6: Cancelar sin guardar

1. Hacer clic en "➕ Agregar compra manual"
2. Completar algunos campos
3. Hacer clic en "❌ Cancelar"
4. **Resultado esperado:**
   - Modal se cierra
   - No se crea compra
   - Si se vuelve a abrir, campos están limpios (reset)

### Prueba 7: Sincronización no afecta manuales

1. Crear compra manual
2. Hacer clic en "🔄 Actualizar desde Gmail"
3. Esperar sincronización
4. **Resultado esperado:**
   - Compra manual sigue apareciendo
   - No se duplica
   - Nuevas compras de Gmail se agregan sin conflicto

---

## Verificación Visual

### Distinguir compras manuales vs Gmail

**Actualmente no hay badge visual**, pero se puede verificar en:

1. **Consola de desarrollador (F12):**
   - Expandir compra en tabla
   - Ver objeto completo en consola
   - Campo `source` debe ser "manual"
   - Campo `emailId` debe ser null

2. **Backend:**
   ```sql
   SELECT id, merchant, source, emailId FROM tenpo_purchases WHERE source = 'manual';
   ```

**Mejora futura sugerida:**
- Badge "Manual" en la fila de la tabla para compras con source="manual"

---

## Troubleshooting

### Modal no se abre

**Problema:** Clic en botón no hace nada

**Solución:**
1. Verificar en consola errores de JavaScript
2. Verificar que `manualModalOpen` cambia a true
3. Verificar z-index del modal (debe ser 1000)

### Error al crear compra

**Problema:** Toast rojo con mensaje de error del backend

**Soluciones comunes:**
1. Verificar que backend esté corriendo (puerto 3000)
2. Verificar formato de fechas (YYYY-MM-DD)
3. Ver consola del backend para error específico
4. Verificar migración de BD aplicada (emailId nullable)

### Compra no aparece en lista

**Problema:** Toast verde pero compra no visible

**Solución:**
1. Verificar año seleccionado (selector de año arriba)
2. Cambiar año si cuotas caen en año distinto
3. Refrescar página completamente

### Cuotas en mes incorrecto

**Problema:** Cuotas aparecen en mes no esperado

**Verificar:**
1. Si usó modo AUTO, primera cuota cae ~día 5 del mes siguiente
2. Si usó fecha manual, verificar firstDueDateOverride
3. Backend usa campo `dueDate` de TenpoInstallment

---

## Archivos Modificados

**Frontend:**
- `node-version/client/src/pages/Tenpo.tsx`
  - Líneas ~67-75: Estado `manualModalOpen` y `manualForm`
  - Líneas ~246-320: Función `handleCreateManualPurchase()`
  - Líneas ~610-625: Botón "Agregar compra manual"
  - Líneas ~1290-1430: Modal y formulario

**Backend:**
- `node-version/src/routes/tenpo.ts`
  - Líneas ~762-878: Endpoint POST /api/tenpo/purchases/manual

**Base de datos:**
- `node-version/prisma/schema.prisma`
  - TenpoPurchase.emailId ahora nullable
  - TenpoPurchase.source nuevo campo

---

## Próximos Pasos (No implementados)

1. **Badge visual:** Mostrar "Gmail" vs "Manual" en tabla
2. **Filtro:** Checkbox para filtrar solo manuales o solo Gmail
3. **Edición:** Permitir editar compras manuales (nombre, monto)
4. **Eliminación:** Botón para borrar compras manuales
5. **Importación CSV:** Subir múltiples compras desde archivo
6. **Categorización:** Asignar categorías a compras manuales (ver tenpo-manual-purchases-audit.md)
