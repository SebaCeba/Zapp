# Árbol MVP de dim_account - Basado en Datos Reales del Sistema

**Fecha:** 2026-04-05  
**Objetivo:** Definir jerarquía de cuentas basada EXCLUSIVAMENTE en entidades, catálogos y cargas que existen HOY en el sistema

---

## 1. Árbol Jerárquico dim_account (MVP Real)

```
[1] ROOT (Nodo conceptual)
│
├── [10] INGRESOS
│   └── [100+] Miembros Base Dinámicos (desde IngresoBase)
│       ├── [101] {nombre desde catálogo IngresoBase id=1}
│       ├── [102] {nombre desde catálogo IngresoBase id=2}
│       └── [...] (tantos como existan en IngresoBase)
│
├── [20] GASTOS
│   ├── [210] SUSCRIPCIONES
│   │   └── [2100+] Miembros Base Dinámicos (desde Subscription)
│   │       ├── [2101] {nombre desde catálogo Subscription id=1}
│   │       ├── [2102] {nombre desde catálogo Subscription id=2}
│   │       └── [...] (tantos como existan en Subscription)
│   │
│   ├── [220] SERVICIOS_BASICOS
│   │   └── [2200+] Miembros Base Dinámicos (desde ServicioBasico)
│   │       ├── [2201] {nombre desde catálogo ServicioBasico id=1}
│   │       ├── [2202] {nombre desde catálogo ServicioBasico id=2}
│   │       └── [...] (tantos como existan en ServicioBasico)
│   │
│   ├── [230] OBLIGACIONES
│   │   └── [2300+] Miembros Base Dinámicos (desde Obligacion)
│   │       ├── [2301] {nombre desde catálogo Obligacion id=1}
│   │       ├── [2302] {nombre desde catálogo Obligacion id=2}
│   │       └── [...] (tantos como existan en Obligacion)
│   │
│   ├── [240] HIPOTECARIO
│   │   ├── [2401] Dividendo Hipotecario (único, calculado desde MortgagePayment)
│   │   └── [2402+] Seguros Hipotecarios (desde MortgageInsurance)
│   │       ├── [2402] {nombre desde MortgageInsurance id=1, ej: "Seguro Desgravamen"}
│   │       ├── [2403] {nombre desde MortgageInsurance id=2, ej: "Seguro Incendio"}
│   │       └── [...] (tantos seguros como existan en MortgageInsurance)
│   │
│   ├── [250] SUPERMERCADO
│   │   └── [2501] Supermercado (único miembro, no tiene catálogo)
│   │
│   └── [260] AJUSTES
│       └── [2601] Ajustes Manuales (único miembro genérico, label libre en fact)
│
└── [30] AHORROS
    └── [300+] Miembros Base Dinámicos (desde Ahorro)
        ├── [301] {nombre desde catálogo Ahorro id=1}
        ├── [302] {nombre desde catálogo Ahorro id=2}
        └── [...] (tantos como existan en Ahorro)
```

**Nomenclatura de IDs:**
- `1` = ROOT
- `10` = INGRESOS (nivel 1)
- `20` = GASTOS (nivel 1)
- `30` = AHORROS (nivel 1)
- `210, 220, 230, 240, 250, 260` = Subcategorías de GASTOS (nivel 2)
- `100+, 2100+, 2200+, etc.` = Miembros base (nivel 3 o 4)

---

## 2. Nodos Padre (Agrupadores)

| account_id | account_code | account_name | parent_id | level | is_base_member | Tabla Origen |
|------------|--------------|--------------|-----------|-------|----------------|--------------|
| 1 | ROOT | Root | NULL | 0 | FALSE | N/A (conceptual) |
| 10 | ING | Ingresos | 1 | 1 | FALSE | N/A (agrupador) |
| 20 | GAS | Gastos | 1 | 1 | FALSE | N/A (agrupador) |
| 210 | GAS.SUS | Suscripciones | 20 | 2 | FALSE | N/A (agrupador) |
| 220 | GAS.SER | Servicios Básicos | 20 | 2 | FALSE | N/A (agrupador) |
| 230 | GAS.OBL | Obligaciones | 20 | 2 | FALSE | N/A (agrupador) |
| 240 | GAS.HIP | Hipotecario | 20 | 2 | FALSE | N/A (agrupador) |
| 250 | GAS.SUP | Supermercado | 20 | 2 | FALSE | N/A (agrupador) |
| 260 | GAS.AJU | Ajustes | 20 | 2 | FALSE | N/A (agrupador) |
| 30 | AHO | Ahorros | 1 | 1 | FALSE | N/A (agrupador) |

**Total nodos padre:** 10 (incluye ROOT)

---

## 3. Miembros Base (Hojas Editables/Cargables)

### 3.1 INGRESOS → Desde IngresoBase

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 101, 102, 103... | `IngresoBase` | `id` | `account_base_id = 100 + IngresoBase.id` | Si `IngresoBase.id=1, nombre="Sueldo Principal"` → `account_id=101, nombre="Sueldo Principal"` |

**Características:**
- Catálogo dinámico (admin puede agregar/editar)
- Campo `nombre` → `dim_account.account_name`
- Campo `activo` → `dim_account.is_active`
- Campo `orden` → `dim_account.sort_order`
- Campo `esRecurrente` → metadata JSON en `dim_account`

**Presupuesto actual:** `PresupuestoIngreso` (12 columnas mensuales)  
**Actual actual:** `ActualEntry` con `category='INGRESOS'`, `itemKey='ingreso:X'`

### 3.2 AHORROS → Desde Ahorro

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 301, 302, 303... | `Ahorro` | `id` | `account_base_id = 300 + Ahorro.id` | Si `Ahorro.id=1, nombre="AFP"` → `account_id=301, nombre="AFP"` |

**Características:**
- Catálogo dinámico
- Campo `nombre` → `dim_account.account_name`
- Campo `activo` → `dim_account.is_active`
- Campo `orden` → `dim_account.sort_order`

**Presupuesto actual:** `PresupuestoAhorro` (12 columnas mensuales)  
**Actual actual:** `ActualEntry` con `category='AHORROS'`, `itemKey='ahorro:X'`

### 3.3 SUSCRIPCIONES → Desde Subscription

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 2101, 2102, 2103... | `Subscription` | `id` | `account_base_id = 2100 + Subscription.id` | Si `Subscription.id=5, name="Netflix"` → `account_id=2105, nombre="Netflix"` |

**Características:**
- Catálogo dinámico
- Campo `name` → `dim_account.account_name`
- Campo `periodicity` → metadata JSON (no en dim_account, en tabla auxiliar `budget_rules`)
- Campo `price` → no va a dim (va a fact_financial)
- Cálculo mensual basado en periodicidad

**Presupuesto actual:** Calculado dinámicamente desde `Subscription` + `PriceOverride`  
**Actual actual:** `ActualEntry` con `category='SUSCRIPCIONES'`, `itemKey='sub:X'`

### 3.4 SERVICIOS_BASICOS → Desde ServicioBasico

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 2201, 2202, 2203... | `ServicioBasico` | `id` | `account_base_id = 2200 + ServicioBasico.id` | Si `ServicioBasico.id=3, nombre="Luz (ENEL)"` → `account_id=2203, nombre="Luz (ENEL)"` |

**Características:**
- Catálogo dinámico
- Campo `nombre` → `dim_account.account_name`
- Campo `activo` → `dim_account.is_active`
- Campo `orden` → `dim_account.sort_order`
- Campo `gmailLabel` → metadata JSON (para imports)
- Campo `hasEmailConnector` → metadata JSON

**Presupuesto actual:** `PresupuestoServicioBasico` (12 columnas mensuales)  
**Actual actual:** `ActualEntry` con `category='SERVICIOS_BASICOS'`, `itemKey='serv:X'` o `UtilityTransaction`

### 3.5 OBLIGACIONES → Desde Obligacion

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 2301, 2302, 2303... | `Obligacion` | `id` | `account_base_id = 2300 + Obligacion.id` | Si `Obligacion.id=2, nombre="Préstamo Auto"` → `account_id=2302, nombre="Préstamo Auto"` |

**Características:**
- Catálogo dinámico
- Campo `nombre` → `dim_account.account_name`
- Campo `tipo` → metadata JSON ('hipotecario' | 'consumo' | 'seguro')
- Campo `montoCuota` → no en dim (va a fact_financial)
- Campo `cuotasTotales`, `mesInicio`, `anioInicio` → metadata en tabla auxiliar `budget_rules`

**Presupuesto actual:** Calculado desde `Obligacion` según vigencia de cuotas  
**Actual actual:** `ActualEntry` con `category='OBLIGACIONES'`, `itemKey='oblig:X'`

### 3.6 HIPOTECARIO → Desde MortgagePayment + MortgageInsurance

#### 3.6.1 Dividendo Hipotecario (único)

| account_id | account_code | account_name | Tabla Origen | Tipo |
|------------|--------------|--------------|--------------|------|
| 2401 | GAS.HIP.DIV | Dividendo Hipotecario | `MortgagePayment` | Importación CSV |

**Características:**
- Miembro base único (no catálogo)
- Importado desde CSV mensual (tabla de amortización)
- Campo `totalDivUf` → convertido a CLP con `SupuestoAnual.valorUfBase`

**Presupuesto actual:** Calculado desde `MortgagePayment` filtrado por año  
**Actual actual:** `ActualEntry` con `category='HIPOTECARIO'`, `itemKey='hip:dividendo'`

#### 3.6.2 Seguros Hipotecarios (dinámicos)

| Rango account_id | Tabla Origen | Campo ID | Mapeo | Ejemplo |
|------------------|--------------|----------|-------|---------|
| 2402, 2403, 2404... | `MortgageInsurance` | `id` | `account_base_id = 2401 + MortgageInsurance.id` | Si `MortgageInsurance.id=1, nombre="Seguro Desgravamen"` → `account_id=2402, nombre="Seguro Desgravamen"` |

**Características:**
- Catálogo dinámico (admin puede agregar seguros)
- Campo `nombre` → `dim_account.account_name`
- Campo `mesAnio` → tiempo en fact_financial
- Campo `monto` + `moneda` → conversión a CLP con UF si aplica

**Presupuesto actual:** `MortgageInsurance` filtrado por `mesAnio`  
**Actual actual:** `ActualEntry` con `category='HIPOTECARIO'`, `itemKey='hip:seguro:X'`

### 3.7 SUPERMERCADO → SupermercadoPresupuesto (único)

| account_id | account_code | account_name | Tabla Origen | Tipo |
|------------|--------------|--------------|--------------|------|
| 2501 | GAS.SUP.TOT | Supermercado | `SupermercadoPresupuesto` | Presupuesto simple |

**Características:**
- Miembro base único (no catálogo de ítems)
- No hay subcategorías (ej: verduras, carnes, etc.)

**Presupuesto actual:** `SupermercadoPresupuesto` (12 columnas mensuales)  
**Actual actual:** `ActualEntry` con `category='SUPERMERCADO'`, `itemKey='sm:total'`

### 3.8 AJUSTES → ActualEntry con label libre (único genérico)

| account_id | account_code | account_name | Tabla Origen | Tipo |
|------------|--------------|--------------|--------------|------|
| 2601 | GAS.AJU.MAN | Ajustes Manuales | `ActualEntry` | Ajustes adhoc |

**Características:**
- Miembro base genérico (catch-all)
- No tiene catálogo
- Campo `label` en `ActualEntry` es libre (ej: "Reembolso supermercado", "Gasto imprevisto")
- Solo existe en ACTUAL, no en PRESUPUESTO (típicamente)

**Presupuesto actual:** No aplica (ajustes son solo en actual)  
**Actual actual:** `ActualEntry` con `category='AJUSTES'`, `label` libre

**Nota:** El `label` libre puede guardarse en `fact_financial.metadata` o en campo `note` adicional.

---

## 4. Origen Actual de Cada Miembro Base

### Tabla Resumen

| Categoría | Tabla Catálogo | Tabla Presupuesto | Tabla Actual | Tipo de Carga |
|-----------|----------------|-------------------|--------------|---------------|
| **INGRESOS** | `IngresoBase` | `PresupuestoIngreso` | `ActualEntry` | Manual (catálogo + 12 meses) |
| **AHORROS** | `Ahorro` | `PresupuestoAhorro` | `ActualEntry` | Manual (catálogo + 12 meses) |
| **SUSCRIPCIONES** | `Subscription` | Calculado dinámico | `ActualEntry` | Manual/Calculado (periodicidad) |
| **SERVICIOS_BASICOS** | `ServicioBasico` | `PresupuestoServicioBasico` | `ActualEntry` + `UtilityTransaction` | Manual + Import Gmail |
| **OBLIGACIONES** | `Obligacion` | Calculado dinámico | `ActualEntry` | Manual/Calculado (cuotas) |
| **HIPOTECARIO - Dividendo** | N/A | `MortgagePayment` | `ActualEntry` | Importación CSV |
| **HIPOTECARIO - Seguros** | `MortgageInsurance` | `MortgageInsurance` | `ActualEntry` | Manual (por mes) |
| **SUPERMERCADO** | N/A | `SupermercadoPresupuesto` | `ActualEntry` | Manual (12 meses) |
| **AJUSTES** | N/A | N/A | `ActualEntry` | Manual adhoc (solo actual) |

### Flujo de Datos Actual → fact_financial

**Presupuesto (scenario_id = 1):**

1. **INGRESOS, AHORROS, SERVICIOS_BASICOS:**
   - Explotar 12 columnas mensuales → 12 registros en `fact_financial`
   - `account_base_id` desde mapeo tabla catálogo
   - `time_id` desde `(año, mes)` → dim_time

2. **SUSCRIPCIONES, OBLIGACIONES:**
   - Calcular mensualización desde reglas (periodicidad, cuotas)
   - Materializar en `fact_financial` con `source='calculated'`
   - Alternativamente: dejar como vista calculada (no materializar)

3. **HIPOTECARIO:**
   - Dividendo: desde `MortgagePayment.totalDivUf` * UF → CLP
   - Seguros: desde `MortgageInsurance.monto` (convertir UF si aplica)

4. **SUPERMERCADO:**
   - Explotar 12 columnas → 12 registros
   - `account_base_id = 2501` (fijo)

**Actual (scenario_id = 2):**

1. **Todas las categorías:**
   - Migrar desde `ActualEntry`:
     - Parse `itemKey` → obtener `account_base_id`
     - `(year, month)` → `time_id`
     - `amountClp` → `amount_clp`
     - `isPaid` → `is_paid`
   - Desechar `category`, `label` (redundantes, se obtienen desde dim_account)

2. **SERVICIOS_BASICOS (imports):**
   - `UtilityTransaction` → staging
   - Agrupar por `(providerKey, year-month)` → suma mensual
   - Escribir en `fact_financial` con `source='import_gmail'`

---

## 5. Nodos que NO Deben Crearse Todavía

### 5.1 Jerarquías de Negocio No Existentes

❌ **No crear subniveles de INGRESOS:**
- "Ingresos Recurrentes" vs "Ingresos No Recurrentes" → **NO EXISTE** en sistema actual
- Todos los ingresos están al mismo nivel en `IngresoBase`
- Solo hay flag `esRecurrente` (metadata), pero no agrupación visual

❌ **No crear subniveles de GASTOS:**
- "Gastos Fijos" vs "Gastos Variables" → **NO EXISTE** como navegación
- Usuario navega directamente a Suscripciones, Servicios Básicos, etc.
- No hay un padre "Gastos Fijos" en la UI actual

❌ **No crear subcategorías de SUPERMERCADO:**
- "Verduras", "Carnes", "Lácteos" → **NO EXISTE**
- Solo hay un monto total mensual
- No hay desglose de ítems

❌ **No crear subcategorías de AJUSTES:**
- AJUSTES es catch-all con label libre
- No hay catálogo de tipos de ajuste

### 5.2 Funcionalidades Planificadas pero No Implementadas

❌ **No crear nodos para PAGO_TC:**
- Categoría `PAGO_TC` en `ActualEntry` está siendo **eliminada** (branch actual: `refactor/remove-tenpo-bonos-tc-modules`)
- Módulos de Tenpo TC fueron desmontados

❌ **No crear ramas de "Ingresos por Inversiones":**
- No existe funcionalidad de tracking de inversiones hoy

❌ **No crear "Gastos por Proyecto" o "Gastos por Categoría Personalizada":**
- Sistema actual no soporta categorización libre multidimensional

### 5.3 Miembros Base Específicos Inventados

❌ **No pre-poblar miembros base específicos como:**
- "Sueldo Principal", "Sueldo Cónyuge" → depende de datos reales en `IngresoBase`
- "Netflix", "Spotify" → depende de datos reales en `Subscription`
- "Luz (ENEL)", "Agua (Aguas Andinas)" → depende de datos reales en `ServicioBasico`

**Regla:** Miembros base se crean dinámicamente desde catálogos existentes, no hardcodeados en schema.

---

## 6. Observaciones de Mapeo a fact_financial

### 6.1 Estrategia de Mapeo de IDs

**Función de mapeo:**

```typescript
function getAccountBaseId(categoria: string, entidadId: number): number {
  const baseOffsets = {
    'INGRESOS': 100,          // IngresoBase.id=1 → account_id=101
    'AHORROS': 300,           // Ahorro.id=1 → account_id=301
    'SUSCRIPCIONES': 2100,    // Subscription.id=5 → account_id=2105
    'SERVICIOS_BASICOS': 2200,// ServicioBasico.id=3 → account_id=2203
    'OBLIGACIONES': 2300,     // Obligacion.id=2 → account_id=2302
    'HIPOTECARIO_SEGURO': 2401 // MortgageInsurance.id=1 → account_id=2402
  };
  
  return baseOffsets[categoria] + entidadId;
}
```

**Casos especiales sin catálogo:**

```typescript
const fixedAccountIds = {
  'HIPOTECARIO_DIVIDENDO': 2401,  // Único, no dinámico
  'SUPERMERCADO': 2501,           // Único, no dinámico
  'AJUSTES': 2601                 // Genérico catch-all
};
```

### 6.2 Parsing de itemKey Actual → account_base_id

**ActualEntry actual:**

```typescript
interface ActualEntry {
  category: 'INGRESOS' | 'SUSCRIPCIONES' | ...;
  itemKey: string; // 'ingreso:1', 'sub:5', 'serv:3', etc.
}
```

**Mapeo a account_base_id:**

```typescript
function parseItemKeyToAccountId(category: string, itemKey: string): number {
  const [prefix, idStr] = itemKey.split(':');
  const entidadId = parseInt(idStr);
  
  const prefixMap = {
    'ingreso': 'INGRESOS',
    'ahorro': 'AHORROS',
    'sub': 'SUSCRIPCIONES',
    'serv': 'SERVICIOS_BASICOS',
    'oblig': 'OBLIGACIONES',
    'sm': 'SUPERMERCADO',       // 'sm:total' → 2501
    'hip': 'HIPOTECARIO',       // 'hip:dividendo' → 2401, 'hip:seguro:X' → 2401+X
  };
  
  if (itemKey === 'sm:total') return 2501;
  if (itemKey === 'hip:dividendo') return 2401;
  if (itemKey.startsWith('hip:seguro:')) {
    const seguroId = parseInt(itemKey.split(':')[2]);
    return 2401 + seguroId; // 2402, 2403, etc.
  }
  
  return getAccountBaseId(prefixMap[prefix], entidadId);
}
```

### 6.3 Denormalización de Labels

**❌ Problema actual:** Labels duplicados

```sql
-- ActualEntry tiene label denormalizado
ActualEntry {
  category: 'INGRESOS',
  itemKey: 'ingreso:1',
  label: 'Sueldo Principal' -- ❌ Duplicado de IngresoBase.nombre
}
```

**✅ Solución dimensional:**

```sql
-- fact_financial NO tiene label
fact_financial {
  account_base_id: 101, -- FK a dim_account
  amount_clp: 2500000
}

-- Label se obtiene con JOIN
SELECT 
  a.account_name AS label,
  f.amount_clp
FROM fact_financial f
JOIN dim_account a ON f.account_base_id = a.account_id;
```

**Ventaja:** Cambio de nombre en dim_account no requiere UPDATE de millones de facts.

### 6.4 Metadata de Miembros Base

**Campos que van a dim_account.metadata (JSON):**

- **INGRESOS:** `{"esRecurrente": true}`
- **SERVICIOS_BASICOS:** `{"gmailLabel": "Facturación ENEL", "hasEmailConnector": true}`
- **SUSCRIPCIONES:** Solo metadatos de visualización; reglas de cálculo van a tabla auxiliar `budget_rules`
- **OBLIGACIONES:** Solo metadatos de visualización; reglas van a `budget_rules`

**Campos que NO van a dim_account (van a tablas auxiliares):**

- Periodicidad de suscripciones → `budget_rules`
- Cuotas de obligaciones → `budget_rules`
- Precios/montos → `fact_financial` directamente

### 6.5 Manejo de Categoría "AJUSTES"

**Problema:** AJUSTES no tiene catálogo, label es libre.

**Opciones:**

**Opción A:** Un solo miembro base genérico
- `account_id = 2601` → "Ajustes Manuales"
- `fact_financial.metadata` = `{"label": "Reembolso supermercado"}`
- Pros: Simplicidad, no contamina dim_account
- Cons: Pierde estructura de ajustes (no se puede agregar por tipo)

**Opción B:** Crear miembros base dinámicos en dim_account al agregar ajuste
- Primer ajuste "Reembolso supermercado" → crear `account_id=2602` en dim_account
- Próximo ajuste del mismo tipo reutiliza `2602`
- Próximo ajuste de otro tipo crea `2603`
- Pros: Mantiene estructura, permite agregación por tipo
- Cons: Escritura en dim_account (dimensión debe ser estable)

**Recomendación MVP:** Opción A (simplicidad), evaluar Opción B si uso de ajustes crece significativamente.

### 6.6 Conversión de 12 Columnas → Registros Normalizados

**Ejemplo de migración de PresupuestoIngreso:**

**Antes (1 registro, 12 columnas):**

```sql
PresupuestoIngreso {
  id: 1,
  ingresoId: 1, -- "Sueldo Principal"
  anio: 2026,
  enero: 2500000,
  febrero: 2500000,
  marzo: 2500000,
  abril: 2500000,
  ...
  diciembre: 2500000
}
```

**Después (12 registros en fact_financial):**

```sql
-- Enero 2026
fact_financial { time_id: 13, scenario_id: 1, account_base_id: 101, amount_clp: 2500000 }

-- Febrero 2026
fact_financial { time_id: 14, scenario_id: 1, account_base_id: 101, amount_clp: 2500000 }

-- ...

-- Diciembre 2026
fact_financial { time_id: 24, scenario_id: 1, account_base_id: 101, amount_clp: 2500000 }
```

**Script de migración:**

```typescript
async function migratePresupuestoIngreso() {
  const presupuestos = await prisma.presupuestoIngreso.findMany({
    include: { ingreso: true }
  });
  
  for (const pres of presupuestos) {
    const accountBaseId = 100 + pres.ingresoId;
    
    for (let month = 1; month <= 12; month++) {
      const mesNombre = MESES[month]; // 'enero', 'febrero', etc.
      const amount = pres[mesNombre];
      
      if (amount > 0) {
        const timeId = await getOrCreateTimeId(pres.anio, month);
        
        await prisma.factFinancial.upsert({
          where: {
            unique_fact: { // composite unique
              time_id: timeId,
              scenario_id: 1, // BUDGET
              account_base_id: accountBaseId
            }
          },
          update: { amount_clp: Math.round(amount) },
          create: {
            time_id: timeId,
            scenario_id: 1,
            account_base_id: accountBaseId,
            amount_clp: Math.round(amount),
            source: 'manual'
          }
        });
      }
    }
  }
}
```

### 6.7 Materialización vs Cálculo On-Demand

**Suscripciones y Obligaciones:**

**Actual:** Se calculan en runtime (`consolidado.ts::getMonthlyBudget()`)

**Opciones para modelo dimensional:**

**A. Materializar en fact_financial:**
- Job nocturno que calcula y escribe facts
- Pros: Queries simples, performance consistente
- Cons: Require job scheduler, posible desfase si regla cambia

**B. Vista calculada (no escribir en fact):**
- `Subscription`, `Obligacion` permanecen como auxiliares
- Vista SQL que calcula on-demand
- Pros: Siempre actualizado, no duplica datos
- Cons: Queries más complejas, performance variable

**Recomendación MVP:** Opción A (materializar) para simplicidad y consistencia con resto de facts.

---

## 7. Resumen Ejecutivo

### 7.1 Árbol MVP Validado

**Niveles totales:** 4 máximo (ROOT → GASTOS → SUSCRIPCIONES → [Netflix])

**Nodos totales:** 10 nodos padre + N miembros base (dinámicos desde catálogos)

**Miembros base fijos:** 3 (Dividendo Hipotecario, Supermercado, Ajustes)

**Miembros base dinámicos:** 6 catálogos (IngresoBase, Ahorro, Subscription, ServicioBasico, Obligacion, MortgageInsurance)

### 7.2 Integridad del Mapeo

✅ **Todas las vistas actuales están cubiertas:**
- `/ingresos` → rama `INGRESOS` (account_id=10)
- `/ahorros` → rama `AHORROS` (account_id=30)
- `/app` (suscripciones) → rama `GASTOS/SUSCRIPCIONES` (account_id=210)
- `/servicios-basicos` → rama `GASTOS/SERVICIOS_BASICOS` (account_id=220)
- `/creditos` → rama `GASTOS/OBLIGACIONES` (account_id=230)
- `/hipotecario` → rama `GASTOS/HIPOTECARIO` (account_id=240)
- `/supermercado` → rama `GASTOS/SUPERMERCADO` (account_id=250)

✅ **Todas las categorías de ActualEntry están cubiertas:**
- `INGRESOS` → account_base_id 101+
- `AHORROS` → account_base_id 301+
- `SUSCRIPCIONES` → account_base_id 2101+
- `SERVICIOS_BASICOS` → account_base_id 2201+
- `OBLIGACIONES` → account_base_id 2301+
- `HIPOTECARIO` → account_base_id 2401+
- `SUPERMERCADO` → account_base_id 2501
- `AJUSTES` → account_base_id 2601
- `PAGO_TC` → ❌ **NO MIGRAR** (módulo eliminado)

### 7.3 Validación de No-Invención

✅ **No se inventaron ramas que no existen:**
- No hay "Gastos Fijos" vs "Gastos Variables" agrupadores
- No hay "Ingresos Recurrentes" vs "No Recurrentes" agrupadores
- No hay subcategorías de Supermercado
- No hay jerarquía de Ajustes

✅ **Miembros base reflejan catálogos reales:**
- No se hardcodearon nombres específicos ("Netflix", "Spotify")
- Todo se mapea dinámicamente desde tablas existentes
- IDs se calculan con offset, no se inventan

### 7.4 Siguiente Paso

**Implementación sugerida:**

1. **Script de población inicial de dim_account:**
   - Crear 10 nodos padre (ROOT + INGRESOS + GASTOS + subcategorías + AHORROS)
   - Leer catálogos existentes (IngresoBase, Ahorro, etc.)
   - Crear miembros base dinámicos con IDs calculados
   - Popular metadata desde campos auxiliares

2. **Script de migración de facts:**
   - Presupuesto: explotar 12 columnas → fact_financial (scenario_id=1)
   - Actual: parsear itemKey → account_base_id, escribir en fact_financial (scenario_id=2)

3. **Validación:**
   - COUNT(*) antes vs después
   - SUM(amount) por categoría antes vs después
   - Consultas de comparación Presupuesto vs Actual (deben dar mismo resultado)

---

**Fin del documento**
