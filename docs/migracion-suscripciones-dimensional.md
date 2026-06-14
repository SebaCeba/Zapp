# Migración de Suscripciones al Modelo Dimensional

## 📋 Resumen

Este documento describe la migración completa del módulo de suscripciones desde la tabla legacy `Subscription` al modelo dimensional estrella. La migración permite que las suscripciones se integren correctamente con el resumen de presupuesto y sigan las convenciones del sistema financiero.

**Fecha de implementación:** 21 de abril de 2026  
**Estado:** ✅ Backend completado, Frontend pendiente

---

## 🎯 Objetivos Logrados

1. **Integración con Presupuesto:** Las suscripciones ahora aparecen en `/presupuesto/resumen` bajo el tipo de gasto "Suscripciones" (GAS.SUS)
2. **Modelo Dimensional:** Uso de `dim_account` + `fact_financial` en lugar de tabla dedicada
3. **Escenarios BUDGET/ACTUAL:** Soporte nativo para presupuestar y registrar gastos reales
4. **Periodicidad Correcta:** Cálculo preciso de meses activos según periodicidad (monthly, quarterly, semiannual, annual)
5. **API v2 Consistente:** Endpoints RESTful siguiendo los patrones de `/api/v2/`

---

## 🏗️ Arquitectura Implementada

### Modelo Dimensional

```
dim_account (Jerarquía)
├── GAS.SUS (parent, is_base_member=false)
│   ├── GAS.SUS.001 - Crunchyroll (is_base_member=true)
│   ├── GAS.SUS.002 - Google One (is_base_member=true)
│   └── GAS.SUS.XXX - [Nuevas suscripciones]

fact_financial (Hechos)
├── scenario = BUDGET (presupuestado)
│   ├── GAS.SUS.001 | 2026-01 | $9,990
│   ├── GAS.SUS.001 | 2026-02 | $9,990
│   └── ... (12 meses si es monthly)
└── scenario = ACTUAL (real)
    ├── GAS.SUS.001 | 2026-01 | $9,990
    └── ... (según gastos reales registrados)
```

### Mapeo Legacy → Dimensional

| Legacy (Subscription) | Dimensional |
|----------------------|-------------|
| `id` (PK) | `dim_account.account_id` |
| `name` | `dim_account.account_name` |
| `periodicity` | Inferido desde `fact_financial` (cantidad de meses) |
| `startDate` | Primer mes en `fact_financial` |
| `price` | `fact_financial.amount_clp` (por cada mes activo) |
| N/A | `dim_scenario.scenario_code` (BUDGET/ACTUAL) |

---

## 🛠️ Implementación Backend

### Archivos Creados

#### 1. `node-version/src/utils/subscriptionPeriodicity.ts`

Utilidades para cálculo de periodicidad (portadas desde frontend):

```typescript
getActiveMonths(startDate, periodicity, year): number[]
calculateAnnualCost(subscription, year): number
calculateMonthlyTotals(subscriptions, year): number[]
isActiveInMonth(subscription, year, month): boolean
inferPeriodicity(activeMonths): Periodicity
```

**Reglas de periodicidad:**
- `monthly`: 12 cargos (todos los meses)
- `quarterly`: 4 cargos (cada 3 meses desde startDate)
- `semiannual`: 2 cargos (cada 6 meses desde startDate)
- `annual`: 1 cargo (en el mes de startDate)
- `weekly`: Aproximado a monthly (simplificación)

#### 2. `node-version/src/routes/v2/subscriptions.ts`

Router completo con 7 endpoints RESTful:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v2/subscriptions` | GET | Lista todas las suscripciones con resumen |
| `/api/v2/subscriptions` | POST | Crea nueva suscripción + hechos presupuestados |
| `/api/v2/subscriptions/:accountCode` | GET | Detalle de suscripción específica con comparación BUDGET vs ACTUAL |
| `/api/v2/subscriptions/:accountCode` | PUT | Actualiza nombre o precio de suscripción |
| `/api/v2/subscriptions/:accountCode` | DELETE | Elimina hechos de un año específico |
| `/api/v2/subscriptions/:accountCode/actuals` | POST | Registra gasto real (ACTUAL) para un mes |

**Funciones helper implementadas:**
- `getNextSubscriptionCode()`: Genera códigos únicos GAS.SUS.001, GAS.SUS.002, etc.
- `getSubscriptionInfo()`: Agrega información desde dim_account + fact_financial

#### 3. `node-version/scripts/migrate-subscriptions-to-dimensional.ts`

Script de migración automática desde tabla legacy:

```bash
# Dry run (simulación sin cambios)
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026 --dry-run

# Ejecución real
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026
```

**Proceso del script:**
1. Valida existencia de cuenta padre `GAS.SUS`
2. Lee suscripciones desde tabla legacy `Subscription`
3. Para cada suscripción:
   - Verifica si ya existe (evita duplicados)
   - Genera código único `GAS.SUS.XXX`
   - Calcula meses activos según periodicidad
   - Crea cuenta en `dim_account`
   - Crea hechos BUDGET en `fact_financial` para cada mes activo
4. Imprime resumen con estadísticas

---

## 📡 API v2 - Referencia Rápida

### GET /api/v2/subscriptions

**Query params:**
- `scenario`: `BUDGET` | `ACTUAL` | `BOTH` (default: `BUDGET`)
- `year`: Año para calcular (requerido)

**Response:**
```json
{
  "subscriptions": [
    {
      "accountId": 123,
      "accountCode": "GAS.SUS.001",
      "accountName": "Spotify Familiar",
      "periodicity": "monthly",
      "startDate": "2026-01-01",
      "monthlyPrice": 16990,
      "activeMonths": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      "totalAnnual": 203880,
      "hasActuals": true,
      "hasBudget": true,
      "lastModified": "2026-04-21T10:30:00Z"
    }
  ],
  "summary": {
    "totalSubscriptions": 8,
    "totalAnnualBudget": 1234567,
    "totalAnnualActual": 1200000
  }
}
```

### POST /api/v2/subscriptions

**Body:**
```json
{
  "name": "Spotify Familiar",
  "periodicity": "monthly",
  "startDate": "2026-01-01",
  "price": 16990,
  "year": 2026,
  "scenario": "BUDGET"
}
```

**Response:**
```json
{
  "subscription": {
    "accountId": 123,
    "accountCode": "GAS.SUS.009",
    "accountName": "Spotify Familiar",
    "periodicity": "monthly",
    "startDate": "2026-01-01",
    "monthlyPrice": 16990,
    "factsCreated": 12
  }
}
```

### GET /api/v2/subscriptions/:accountCode

**Query params:**
- `year`: Año para obtener detalle (requerido)

**Response:**
```json
{
  "subscription": {
    "accountId": 123,
    "accountCode": "GAS.SUS.001",
    "accountName": "Spotify Familiar",
    "periodicity": "monthly",
    "startDate": "2026-01-01",
    "isActive": true,
    "monthlyDetails": [
      {
        "month": 1,
        "budget": 16990,
        "actual": 16990,
        "variance": 0
      },
      {
        "month": 2,
        "budget": 16990,
        "actual": null,
        "variance": null
      }
    ],
    "totals": {
      "budgetAnnual": 203880,
      "actualAnnual": 16990,
      "variance": -186890
    }
  }
}
```

### PUT /api/v2/subscriptions/:accountCode

**Body:**
```json
{
  "name": "Spotify Premium",
  "price": 18990,
  "year": 2026,
  "scenario": "BUDGET"
}
```

**Comportamiento:**
- Si se cambia `name`, actualiza `dim_account.account_name`
- Si se cambia `price`, actualiza todos los hechos del año/escenario especificado

### DELETE /api/v2/subscriptions/:accountCode

**Query params:**
- `year`: Año a eliminar (requerido)
- `scenario`: `BUDGET` | `ACTUAL` | `BOTH` (default: `BUDGET`)

**Comportamiento:**
- Elimina hechos del año/escenario especificado
- Si no quedan hechos, marca la cuenta como `is_active = false`

### POST /api/v2/subscriptions/:accountCode/actuals

**Body:**
```json
{
  "year": 2026,
  "month": 1,
  "amount": 16990
}
```

**Comportamiento:**
- Registra o actualiza gasto real (ACTUAL) para un mes específico
- Permite comparar presupuestado vs real

---

## ✅ Validaciones Implementadas

### Validaciones de Entrada

- **name**: String no vacío
- **periodicity**: Uno de `monthly`, `quarterly`, `semiannual`, `annual`, `weekly`
- **startDate**: Formato `YYYY-MM-DD`
- **price**: Entero positivo (en CLP)
- **year**: Entre 2000-2100
- **month**: Entre 1-12
- **scenario**: `BUDGET` o `ACTUAL`

### Validaciones de Integridad

- Cuenta padre `GAS.SUS` debe existir
- Escenarios `BUDGET` y `ACTUAL` deben existir en `dim_scenario`
- Códigos de cuenta únicos (validación en `getNextSubscriptionCode()`)
- Meses deben existir en `dim_time`

---

## 🔄 Estado de Migración

### ✅ Completado

1. **Backend API v2** (100%)
   - ✅ Utilidades de periodicidad (`subscriptionPeriodicity.ts`)
   - ✅ Router completo con 7 endpoints (`routes/v2/subscriptions.ts`)
   - ✅ Montado en `/api/v2` (`routes/v2/index.ts`)
   - ✅ Validaciones completas
   - ✅ Sin errores de compilación

2. **Script de Migración** (100%)
   - ✅ Migración automática desde legacy
   - ✅ Dry-run mode para pruebas
   - ✅ Logging detallado
   - ✅ Manejo de errores
   - ✅ Estadísticas de migración

### 🚧 Pendiente

3. **Frontend** (0%)
   - ⏳ Actualizar `Subscriptions.tsx` para usar `/api/v2/subscriptions`
   - ⏳ Crear componente `ScenarioSelector` (toggle BUDGET/ACTUAL)
   - ⏳ Actualizar `NewSubscriptionForm.tsx` para POST a API v2
   - ⏳ Implementar "Guardar Plan" (crea hechos BUDGET)
   - ⏳ Modal para registrar gastos reales (ACTUAL)

4. **Testing** (0%)
   - ⏳ Tests E2E de endpoints v2
   - ⏳ Tests de periodicidad
   - ⏳ Tests de script de migración
   - ⏳ Validación de integración con presupuesto

---

## 📝 Próximos Pasos

### Fase 4: Frontend (2 días estimados)

#### A. Componente ScenarioSelector

Crear `node-version/client/src/components/shared/ScenarioSelector.tsx`:

```tsx
interface ScenarioSelectorProps {
  value: 'BUDGET' | 'ACTUAL';
  onChange: (scenario: 'BUDGET' | 'ACTUAL') => void;
}

export function ScenarioSelector({ value, onChange }: ScenarioSelectorProps) {
  return (
    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => onChange('BUDGET')}
        className={`px-4 py-2 rounded-md transition-colors ${
          value === 'BUDGET'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Presupuesto
      </button>
      <button
        onClick={() => onChange('ACTUAL')}
        className={`px-4 py-2 rounded-md transition-colors ${
          value === 'ACTUAL'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        Real
      </button>
    </div>
  );
}
```

#### B. Actualizar Subscriptions.tsx

Cambios principales:

1. **Estado de escenario:**
```tsx
const [scenario, setScenario] = useState<'BUDGET' | 'ACTUAL'>('BUDGET');
```

2. **Fetch desde API v2:**
```tsx
const response = await fetch(
  `/api/v2/subscriptions?scenario=${scenario}&year=${selectedYear}`
);
const { subscriptions, summary } = await response.json();
```

3. **Agregar selector:**
```tsx
<ScenarioSelector value={scenario} onChange={setScenario} />
```

4. **Implementar "Guardar Plan":**
```tsx
const handleSaveBudget = async () => {
  // Crear hechos BUDGET para suscripciones sin presupuesto
  for (const sub of subscriptions.filter(s => !s.hasBudget)) {
    await fetch(`/api/v2/subscriptions`, {
      method: 'POST',
      body: JSON.stringify({
        name: sub.accountName,
        periodicity: sub.periodicity,
        startDate: sub.startDate,
        price: sub.monthlyPrice,
        year: selectedYear,
        scenario: 'BUDGET'
      })
    });
  }
  // Recargar datos
  await fetchSubscriptions();
};
```

#### C. Formulario de Gastos Reales

Modal para registrar gastos ACTUAL:

```tsx
interface ActualExpenseModalProps {
  subscription: SubscriptionResponse;
  year: number;
  month: number;
  onClose: () => void;
  onSave: () => void;
}

export function ActualExpenseModal({ 
  subscription, 
  year, 
  month, 
  onClose, 
  onSave 
}: ActualExpenseModalProps) {
  const [amount, setAmount] = useState(subscription.monthlyPrice || 0);

  const handleSubmit = async () => {
    await fetch(
      `/api/v2/subscriptions/${subscription.accountCode}/actuals`,
      {
        method: 'POST',
        body: JSON.stringify({ year, month, amount })
      }
    );
    onSave();
  };

  // ... UI implementation
}
```

### Fase 5: Testing (1 día estimado)

#### Tests de Integración

```typescript
describe('Subscriptions API v2', () => {
  it('Crea suscripción mensual con 12 hechos', async () => {
    const response = await fetch('/api/v2/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Monthly',
        periodicity: 'monthly',
        startDate: '2026-01-01',
        price: 10000,
        year: 2026,
        scenario: 'BUDGET'
      })
    });
    expect(response.status).toBe(201);
    const { subscription } = await response.json();
    expect(subscription.factsCreated).toBe(12);
  });

  it('Suscripción trimestral tiene 4 hechos', async () => {
    const response = await fetch('/api/v2/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Quarterly',
        periodicity: 'quarterly',
        startDate: '2026-01-01',
        price: 10000,
        year: 2026,
        scenario: 'BUDGET'
      })
    });
    const { subscription } = await response.json();
    expect(subscription.factsCreated).toBe(4);
  });

  it('Registrar ACTUAL diferente de BUDGET genera varianza', async () => {
    // Crear BUDGET
    const createResponse = await fetch('/api/v2/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Variance',
        periodicity: 'monthly',
        startDate: '2026-01-01',
        price: 10000,
        year: 2026,
        scenario: 'BUDGET'
      })
    });
    const { subscription } = await createResponse.json();

    // Registrar ACTUAL diferente
    await fetch(`/api/v2/subscriptions/${subscription.accountCode}/actuals`, {
      method: 'POST',
      body: JSON.stringify({ year: 2026, month: 1, amount: 15000 })
    });

    // Verificar varianza
    const detailResponse = await fetch(
      `/api/v2/subscriptions/${subscription.accountCode}?year=2026`
    );
    const detail = await detailResponse.json();
    expect(detail.subscription.monthlyDetails[0].variance).toBe(5000);
  });
});
```

#### Tests del Script de Migración

```bash
# 1. Backup de BD
cp node-version/prisma/dev_star.db node-version/prisma/dev_star.db.backup

# 2. Ejecutar dry-run
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026 --dry-run

# 3. Ejecutar migración real
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026

# 4. Validar resultados
sqlite3 node-version/prisma/dev_star.db "
  SELECT COUNT(*) as subscriptions FROM dim_account WHERE account_code LIKE 'GAS.SUS.%';
  SELECT COUNT(*) as facts FROM fact_financial 
  WHERE account_base_id IN (
    SELECT account_id FROM dim_account WHERE account_code LIKE 'GAS.SUS.%'
  );
"
```

#### Validación de Integración

1. **Verificar visibilidad en presupuesto:**
   - Abrir `/presupuesto/resumen`
   - Expandir "Gastos" → "Suscripciones"
   - Verificar que aparecen todas las suscripciones migradas
   - Verificar totales anuales

2. **Verificar periodicidad:**
   - Abrir `/suscripciones`
   - Verificar que tabla de planificación muestra solo meses activos
   - Crear suscripción trimestral, verificar 4 cargos
   - Crear suscripción semestral, verificar 2 cargos

3. **Verificar escenarios:**
   - Cambiar de BUDGET a ACTUAL
   - Registrar gasto real diferente
   - Verificar que varianza se muestra correctamente

---

## 🚀 Guía de Ejecución

### 1. Ejecutar Migración de Datos

```bash
# Desde node-version/
cd node-version

# Dry run primero (recomendado)
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026 --dry-run

# Si todo se ve bien, ejecutar migración real
npx tsx scripts/migrate-subscriptions-to-dimensional.ts --year=2026
```

**Output esperado:**
```
🚀 Iniciando migración de suscripciones para el año 2026
Modo: PRODUCCIÓN

✅ Cuenta padre GAS.SUS encontrada (accountId=42)
✅ Escenario BUDGET encontrado (scenarioId=1)
📦 8 suscripciones encontradas en tabla legacy

[1/8] Procesando: Crunchyroll
  - Periodicidad: monthly
  - Precio: $9,990
  - Fecha inicio: 2024-01-01
  📝 Código asignado: GAS.SUS.009
  📅 Meses activos en 2026: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] (12 meses)
  ✅ Cuenta creada: GAS.SUS.009
  ✅ 12 hechos creados (BUDGET)

...

============================================================
📊 RESUMEN DE MIGRACIÓN
============================================================
✅ Suscripciones procesadas: 8
✅ Cuentas creadas: 8
✅ Hechos creados: 96

✅ Migración completada exitosamente
```

### 2. Verificar Datos Migrados

```bash
# Verificar cuentas
sqlite3 node-version/prisma/dev_star.db "
  SELECT account_code, account_name, is_base_member 
  FROM dim_account 
  WHERE account_code LIKE 'GAS.SUS.%' 
  ORDER BY account_code;
"

# Verificar hechos
sqlite3 node-version/prisma/dev_star.db "
  SELECT 
    da.account_code,
    dt.year_month,
    ff.amount_clp,
    ds.scenario_code
  FROM fact_financial ff
  JOIN dim_account da ON ff.account_base_id = da.account_id
  JOIN dim_time dt ON ff.time_id = dt.time_id
  JOIN dim_scenario ds ON ff.scenario_id = ds.scenario_id
  WHERE da.account_code LIKE 'GAS.SUS.%'
  ORDER BY da.account_code, dt.year_month
  LIMIT 20;
"
```

### 3. Probar API v2

```bash
# Obtener todas las suscripciones
curl "http://localhost:3002/api/v2/subscriptions?scenario=BUDGET&year=2026"

# Obtener detalle de una suscripción
curl "http://localhost:3002/api/v2/subscriptions/GAS.SUS.001?year=2026"

# Crear nueva suscripción
curl -X POST http://localhost:3002/api/v2/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Netflix Premium",
    "periodicity": "monthly",
    "startDate": "2026-05-01",
    "price": 17990,
    "year": 2026,
    "scenario": "BUDGET"
  }'

# Registrar gasto real
curl -X POST http://localhost:3002/api/v2/subscriptions/GAS.SUS.009/actuals \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2026,
    "month": 5,
    "amount": 17990
  }'
```

---

## 🔍 Troubleshooting

### Error: "Cuenta padre GAS.SUS no encontrada"

**Solución:** Crear cuenta padre manualmente:

```sql
INSERT INTO dim_account (
  account_code, account_name, parent_id, level, 
  is_base_member, account_type, sort_order, is_active
) VALUES (
  'GAS.SUS', 'Suscripciones', 
  (SELECT account_id FROM dim_account WHERE account_code = 'GAS'),
  2, 0, 'GASTO', 0, 1
);
```

### Error: "Escenario BUDGET no encontrado"

**Solución:** Verificar tabla `dim_scenario`:

```sql
SELECT * FROM dim_scenario;
```

Si falta, insertar:

```sql
INSERT INTO dim_scenario (scenario_code, scenario_name, is_default, sort_order)
VALUES ('BUDGET', 'Presupuesto', 1, 1);
```

### Suscripciones no aparecen en /presupuesto/resumen

**Diagnóstico:**
1. Verificar que existen hechos BUDGET:
```sql
SELECT COUNT(*) FROM fact_financial ff
JOIN dim_account da ON ff.account_base_id = da.account_id
JOIN dim_scenario ds ON ff.scenario_id = ds.scenario_id
WHERE da.account_code LIKE 'GAS.SUS.%' AND ds.scenario_code = 'BUDGET';
```

2. Verificar que el endpoint `/api/v2/budget/totals` las incluye:
```bash
curl "http://localhost:3002/api/v2/budget/totals/account?year=2026"
```

3. Si aún no aparecen, revisar función `getTotalsByAccount()` en `routes/v2/budget.ts`

---

## 📊 Comparación: Legacy vs Dimensional

| Aspecto | Legacy (Subscription) | Dimensional (API v2) |
|---------|----------------------|---------------------|
| **Modelo** | Tabla dedicada `Subscription` | `dim_account` + `fact_financial` |
| **Jerarquía** | No soportada | Integrada (GAS.SUS.XXX) |
| **Periodicidad** | Aproximada (frontend only) | Precisa (backend + frontend) |
| **Escenarios** | Un solo "plan", sin actuals | BUDGET y ACTUAL separados |
| **Integración Presupuesto** | ❌ No visible en resumen | ✅ Visible y totalizadoinclusive |
| **Varianza** | ❌ No calculable | ✅ BUDGET vs ACTUAL automático |
| **API** | `/api/subscriptions` (CRUD simple) | `/api/v2/subscriptions` (RESTful completo) |
| **Flexibilidad** | Baja (campo fijo `price`) | Alta (hechos por mes, ajustables) |

---

## ✅ Checklist de Migración

### Backend
- [x] Crear `subscriptionPeriodicity.ts` (utils)
- [x] Crear `routes/v2/subscriptions.ts` (7 endpoints)
- [x] Montar router en `routes/v2/index.ts`
- [x] Crear script de migración
- [x] Validar sin errores de compilación

### Migración de Datos
- [ ] Backup de `dev_star.db`
- [ ] Ejecutar dry-run del script
- [ ] Ejecutar migración real
- [ ] Verificar cuentas creadas en `dim_account`
- [ ] Verificar hechos creados en `fact_financial`
- [ ] Validar integración con `/presupuesto/resumen`

### Frontend
- [ ] Crear `ScenarioSelector.tsx`
- [ ] Actualizar `Subscriptions.tsx` para API v2
- [ ] Actualizar `NewSubscriptionForm.tsx` para API v2
- [ ] Implementar botón "Guardar Plan"
- [ ] Crear modal de registro de gastos reales
- [ ] Actualizar `AnnualPlanningTable.tsx` si necesario

### Testing
- [ ] Tests unitarios de periodicidad
- [ ] Tests E2E de endpoints v2
- [ ] Tests de migración script
- [ ] Validación manual de integración
- [ ] Tests de varianza BUDGET vs ACTUAL

### Documentación
- [x] Documentar migración (este archivo)
- [ ] Actualizar README principal
- [ ] Deprecar endpoints legacy
- [ ] Documentar API v2 en Postman/OpenAPI

---

## 🎓 Lecciones Aprendidas

1. **Periodicidad es complejo:** Semanal no se puede mapear perfectamente a mensual; se requiere aproximación o manejo especial.

2. **Inferencia de periodicidad:** Es posible inferir periodicidad desde la cantidad de meses con hechos, pero requiere validar patrones (ej: 4 meses no siempre es quarterly).

3. **Códigos únicos:** Necesidad de función `getNextSubscriptionCode()` para evitar colisiones al crear cuentas dinámicamente.

4. **Escenarios son clave:** Separar BUDGET y ACTUAL desde el inicio simplifica comparaciones y reporting.

5. **Migración gradual:** Mantener API legacy mientras se migra frontend permite transición sin downtime.

---

## 📚 Referencias

- [Diseño API v2 Suscripciones](./diseno-api-v2-suscripciones.md)
- [Auditoría Página Suscripciones](./auditorias/auditoria-pagina-suscripciones.md)
- [Implementación Periodicidad Suscripciones](./implementacion-periodicidad-suscripciones.md)
- [DATABASE_MODEL.md](./DATABASE_MODEL.md) - Modelo dimensional completo

---

**Última actualización:** 21 de abril de 2026  
**Autor:** GitHub Copilot + SebaCeba  
**Estado:** Backend completado ✅ | Frontend pendiente 🚧
