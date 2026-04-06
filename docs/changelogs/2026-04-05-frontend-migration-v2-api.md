# Migración Frontend → v2 API + Star Schema
**Fecha:** 5 de Abril 2026  
**Branch:** `refactor/remove-tenpo-bonos-tc-modules`  
**Commits:** `e101365` → `ea5a9a9` (10 commits nuevos sobre master)

---

## Contexto

Migración completa del frontend de React desde datos mock + RSuite hacia Tailwind CSS + API dimensional v2 (Star Schema). El modelo de datos es una base SQLite separada (`dev.db.star`) con esquema dimensional clásico: `dim_account`, `dim_time`, `dim_scenario` + `fact_financial`.

---

## 1. Modelo Dimensional (Star Schema) — Backend

### Schema Prisma (`prisma/schema_star.prisma`)

| Tabla | Descripción |
|---|---|
| `dim_account` | Jerarquía de cuentas: ROOT → INGRESOS/GASTOS/AHORROS → Subcategorías → Miembros base (`isBaseMember=true`) |
| `dim_time` | Dimensión tiempo: año, mes, nombre mes, trimestre, semestre |
| `dim_scenario` | Escenarios: `BUDGET` (presupuesto) y `ACTUAL` (real) |
| `fact_financial` | Tabla de hechos: `(timeId, scenarioId, accountBaseId)` → `amountClp` |

### Prefijos de cuentas

| Prefijo | Tipo | Ejemplo |
|---|---|---|
| `ING.*` | Ingresos | `ING.001` = Sueldo Líquido |
| `GAS.*` | Gastos | `GAS.SUS.*` = Suscripciones |
| `AHO.*` | Ahorros | `AHO.001` = Fondo Emergencia |

---

## 2. API v2 — Endpoints creados/modificados

### Rutas (`src/routes/v2/`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v2/health` | Health check |
| `GET` | `/api/v2/budget/monthly/:year` | Presupuesto por mes (año completo) |
| `GET` | `/api/v2/budget/by-account/:year/:month?` | Presupuesto por cuenta, filtrable por prefijo |
| `GET` | `/api/v2/actual/monthly/:year` | Real por mes |
| `GET` | `/api/v2/actual/by-account/:year/:month?` | Real por cuenta |
| `GET` | `/api/v2/comparison/:year/:month?` | Comparación presupuesto vs real, línea a línea |
| `GET` | `/api/v2/comparison/summary/:year/:month?` | Resumen KPIs de comparación |
| `PUT` | `/api/v2/facts` | Upsert de un hecho financiero |
| `GET` | `/api/v2/accounts` | Listado de cuentas (con filtros) |
| `GET` | `/api/v2/accounts/hierarchy/:scenario/:year/:month?` | Árbol jerárquico con totales |
| `GET` | `/api/v2/accounts/search?q=` | Búsqueda de cuentas |
| **`POST`** | **`/api/v2/accounts`** | **Crear nuevo miembro base** ← nuevo esta sesión |

### POST /api/v2/accounts — Detalle

```json
// Request body
{ "name": "Arriendo Local", "parentCode": "INGRESOS" }

// Response 201
{
  "accountId": 74,
  "accountCode": "ING.006",
  "accountName": "Arriendo Local",
  "accountType": "INGRESO",
  "level": 2,
  "isBaseMember": true
}
```

**Lógica:** auto-genera `ING.XXX` buscando el primer código disponible. Detecta colisiones y continúa incrementando. Hereda `accountType` del padre.

### PUT /api/v2/facts — Detalle

```json
// Request body
{
  "scenario": "BUDGET",
  "year": 2026,
  "month": 3,
  "accountCode": "ING.001",
  "amountClp": 2900000
}
```

Upsert por grain `(timeId, scenarioId, accountBaseId)`. Valida que `amountClp` sea entero.

---

## 3. Frontend — Páginas migradas

### Constantes globales
- `NOW_YEAR = 2026`
- `NOW_MONTH = 3`
- Design tokens: `primary=#175ab1`, `navy-dark=#002948`, `brand-atelier-bg=#FDFCF9`

---

### 3.1 `HomeNew.tsx` → `/`
Dashboard principal con datos reales v2 API.
- KPIs: Total Presupuesto, Ejecución %, alertas
- Commit: `e5ce671`

---

### 3.2 `PresupuestoResumenNew.tsx` → `/presupuesto`
Vista anual del presupuesto agrupado por categoría.
- Tabla con totales por categoría e indicadores de progreso

---

### 3.3 `ActualNew.tsx` → `/actual`
**Commit:** `f8dee45`

- **Selector de mes** — tabs con solo los meses que tienen datos reales habilitados
- **4 KPIs:**
  - Gasto Real (`navy-dark`)
  - Presupuesto + barra de ejecución
  - Varianza (verde si bajo presupuesto, rojo si sobre)
  - Conteo de cuentas Sobre/Bajo/Ok
- **Gráfico de barras anual** — clic cambia el mes seleccionado
- **Tabla de comparación** — cuentas `GAS.*`, ordenadas por monto real, con barra de ejecución

---

### 3.4 `ComparacionNew.tsx` → `/comparacion`
**Commit:** `c51fd64`

- **Selector de mes** + **filtros** por grupo (Todos / Ingresos / Gastos / Ahorros)
- **4 KPIs** resumen
- **Tabla de 7 columnas:** Cuenta, Presupuesto, Real, Varianza, % vs Presupuesto, Barra, Status
- **Lógica de color inteligente:** ingreso sobre presupuesto = verde; gasto bajo presupuesto = verde
- **Fila de totales** en el footer por grupo seleccionado

---

### 3.5 `PresupuestoIngresosNew.tsx` → `/presupuesto/ingresos`
**Commits:** `9e7f467`, `003e1c7`, `dc9c64d`, `40507b8`, `ea5a9a9`

La página más compleja — tabla matricial interactiva con edición inline.

#### Layout (de arriba a abajo)
1. **Título + badge de estado** ("Al día" / "Guardando…")
2. **Cards de insights:**
   - `md:col-span-2` — Gráfico de estacionalidad mensual (barras)
   - `col-span-1` — Total anual + N fuentes + promedio mensual
3. **Tabla matricial** — filas=cuentas, columnas=meses + Total Anual
4. **Botón "Agregar Ingreso"** — borde punteado, abre modal
5. **Hint de teclado**
6. **Modal overlay** — crear nueva cuenta

#### Componente `EditableCell`

```tsx
interface EditableCellProps {
  value: number;
  accountCode: string;
  month: number;
  onSave: (accountCode: string, month: number, newValue: number) => Promise<void>;
}
```

| Estado | Comportamiento |
|---|---|
| Normal | Muestra valor formateado (guión `—` si es 0); hover muestra ícono pencil |
| Editing | Input numérico pre-seleccionado |
| Saving | Opacidad 40% |
| Error | Borde rojo, no cierra el input |

**Controles:** `Enter` → guardar, `Esc` → cancelar, `onBlur` → guardar, `inputMode="numeric"` en móvil.

#### Estado del componente `PresupuestoIngresosPage`

```typescript
const [accounts, setAccounts] = useState<AccountTotal[]>([]);
const [matrix, setMatrix] = useState<Matrix>({});       // Record<accountCode, Record<month, amountClp>>
const [loading, setLoading] = useState(true);
const [saveCount, setSaveCount] = useState(0);           // operaciones en vuelo

// Modal "Agregar Ingreso"
const [showAddModal, setShowAddModal] = useState(false);
const [newName, setNewName] = useState('');
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState<string | null>(null);
```

#### Carga de datos

```typescript
// 13 llamadas paralelas en mount:
fetchBudgetByAccount(NOW_YEAR, undefined, 'ING')   // lista de cuentas
+ Array.from({length:12}, (_, i) =>
    fetchBudgetByAccount(NOW_YEAR, i+1, 'ING'))    // 12 meses en paralelo
```

#### `handleSave` — Optimistic update

1. Actualiza `matrix` en memoria (UI cambia inmediatamente)
2. Incrementa `saveCount` (muestra "Guardando…")
3. Llama `upsertFact()`
4. En error: lanza excepción → `EditableCell` muestra borde rojo (rollback visual en celda, no en matrix)
5. `finally`: decrementa `saveCount`

#### `handleCreateAccount`

1. Llama `createAccount({ name, parentCode: 'INGRESOS' })`
2. Agrega `AccountTotal` con `totalClp: 0` a la lista
3. Inicializa fila vacía en `matrix[newCode] = {}`
4. La nueva cuenta aparece en la tabla lista para edición

#### Tabla matricial — características técnicas

| Feature | Implementación |
|---|---|
| Scroll horizontal | `overflow-x-auto` en wrapper, `minWidth: 1180px` |
| Columna sticky | `sticky left-0 z-10 bg-white group-hover:bg-brand-atelier-bg` |
| Header sticky | `sticky left-0 bg-surface-container-low z-10` |
| Nombres sin wrap | `whitespace-nowrap` en nombre y valores |
| Columna Total Anual | Fondo `bg-secondary-container/10` |
| Footer | `bg-primary-container text-on-primary-container` |

---

## 4. API Client (`client/src/api/v2Api.ts`)

### Tipos exportados

```typescript
interface AccountTotal { accountCode: string; accountName: string; totalClp: number; }
interface ComparisonLine { accountCode: string; accountName: string; budget: number; actual: number; variance: number; }
interface ComparisonSummary { totalBudget: number; totalActual: number; variance: number; executionPct: number; }
interface UpsertFactPayload { scenario: 'BUDGET'|'ACTUAL'; year: number; month: number; accountCode: string; amountClp: number; }
interface CreateAccountPayload { name: string; parentCode: string; }
interface CreatedAccount { accountId: number; accountCode: string; accountName: string; accountType: string|null; level: number; isBaseMember: boolean; }
```

### Funciones exportadas

| Función | Método | Endpoint |
|---|---|---|
| `fetchBudgetMonthly(year)` | GET | `/budget/monthly/:year` |
| `fetchBudgetByAccount(year, month?, prefix?)` | GET | `/budget/by-account/:year/:month?` |
| `fetchActualMonthly(year)` | GET | `/actual/monthly/:year` |
| `fetchActualByAccount(year, month?, prefix?)` | GET | `/actual/by-account/:year/:month?` |
| `fetchComparisonLines(year, month?)` | GET | `/comparison/:year/:month?` |
| `fetchComparisonSummary(year, month?)` | GET | `/comparison/summary/:year/:month?` |
| `upsertFact(payload)` | PUT | `/facts` |
| `createAccount(payload)` | POST | `/accounts` |
| `fetchAccountHierarchy(scenario, year, month?)` | GET | `/accounts/hierarchy/...` |

---

## 5. Layout / Navegación

### `AppSidebar.tsx`
**Commit:** `cfde3af`

**Fix scroll horizontal:** `translate-x-1` en ítems activos causaba desborde de 4px → removido + `overflow-x-hidden` en `<aside>`.

**Estructura de navegación:**
```
Presupuesto
  ├── Resumen       → /presupuesto
  ├── Ingresos      → /presupuesto/ingresos
  ├── Gastos        → /gastos (pendiente)
  └── Ahorros       → /ahorros (pendiente)

Actual
  ├── Resumen       → /actual
  └── Comparación   → /comparacion
```

### `router.tsx`

```tsx
<Route path="/"                    element={<HomePage />} />
<Route path="/presupuesto"         element={<PresupuestoResumenPage />} />
<Route path="/presupuesto/ingresos" element={<PresupuestoIngresosPage />} />
<Route path="/actual"              element={<ActualPage />} />
<Route path="/comparacion"         element={<ComparacionPage />} />
```

---

## 6. Fixes aplicados en esta sesión

| Problema | Causa | Solución |
|---|---|---|
| Scroll horizontal en sidebar | `translate-x-1` en ítems activos | Removido + `overflow-x-hidden` en `<aside>` |
| Nombres de cuenta partidos en tabla | Sin `whitespace-nowrap` | Añadido a `<td>` de nombre y valores |
| Encoding roto (`â€"`, `dÃ­a`) | PowerShell `Set-Content` escribe en Windows-1252 | Reemplazados con unicode escapes `\u2014`, `\u2026`, `\u00ED` |
| Header "TIPO DE INGRESO" en 2 líneas | Sin `whitespace-nowrap` | Añadido |
| Filas muy altas | `py-5 py-6` en todas las celdas | Reducido a `py-3 py-4` |
| Cards de insights al fondo | Layout order | Movidas sobre la tabla matricial |

---

## 7. Pendientes

| Página | Ruta | Estado |
|---|---|---|
| Presupuesto / Gastos | `/presupuesto/gastos` | ❌ No iniciado |
| Presupuesto / Ahorros | `/presupuesto/ahorros` | ❌ No iniciado |
| Actualizar sidebar links | Gastos → `/presupuesto/gastos` | ❌ No iniciado |
| `git push` al remoto | branch: `refactor/remove-tenpo-bonos-tc-modules` | ❌ Pendiente |

---

## 8. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend runtime | React 18 + TypeScript + Vite (puerto 5173) |
| Estilos | Tailwind CSS — 100% Tailwind, **sin RSuite** |
| Proxy | Vite → Express en puerto 3000 |
| Backend | Node.js + Express + tsx watch |
| ORM | Prisma con dos clients: legacy (`@prisma/client`) + star (`@prisma/client-star`) |
| Base legacy | SQLite `prisma/dev.db` |
| Base star schema | SQLite `prisma/dev.db.star` |
| Inicio | `start.bat` → `start.ps1` → 2 ventanas PowerShell |
