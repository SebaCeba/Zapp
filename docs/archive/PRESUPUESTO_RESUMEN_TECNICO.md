# Resumen Técnico/Funcional - Vista Presupuesto

## 1. Modelo de Datos

### 1.1. Entidades Principales (Prisma Schema)

#### Ingresos Base
```prisma
model IngresoBase {
  id                Int                          @id @default(autoincrement())
  nombre            String                       @unique
  activo            Boolean                      @default(true)
  esRecurrente      Boolean                      @default(true)
  orden             Int                          @default(0)
  createdAt         DateTime                     @default(now())
  updatedAt         DateTime                     @updatedAt
  presupuestos      PresupuestoIngreso[]
}

model PresupuestoIngreso {
  id                Int             @id @default(autoincrement())
  ingresoId         Int
  anio              Int
  enero-diciembre   Float           @default(0)  // 12 campos mensuales
  ingreso           IngresoBase     @relation(...)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@unique([ingresoId, anio])
}
```

**Características:**
- Catálogo de ingresos configurable (activo/inactivo)
- Presupuesto mensual independiente por año
- Relación 1:N entre IngresoBase y PresupuestoIngreso

#### Bonos
```prisma
model Bono {
  id                Int             @id @default(autoincrement())
  nombre            String
  anio              Int
  mes               Int             // 1=Enero, 2=Febrero, etc.
  monto             Float
  descripcion       String?
  repartos          RepartoBono[]
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}

model RepartoBono {
  id                Int      @id @default(autoincrement())
  bonoId            Int
  destino           String   // ahorro, deuda, vacaciones, apoyo_mensual, otros
  monto             Float
  porcentaje        Float?
  mesesDistribucion Int?     // solo para apoyo_mensual
  bono              Bono     @relation(...)
  createdAt         DateTime @default(now())
}
```

**Características:**
- Bonos puntuales en mes específico
- Repartos con destino "apoyo_mensual" se distribuyen en N meses

#### Servicios Básicos
```prisma
model ServicioBasico {
  id                Int                              @id @default(autoincrement())
  nombre            String                           @unique
  activo            Boolean                          @default(true)
  esBase            Boolean                          @default(false)
  orden             Int                              @default(0)
  createdAt         DateTime                         @default(now())
  updatedAt         DateTime                         @updatedAt
  presupuestos      PresupuestoServicioBasico[]
}

model PresupuestoServicioBasico {
  id                Int             @id @default(autoincrement())
  servicioId        Int
  anio              Int
  enero-diciembre   Float           @default(0)  // 12 campos mensuales
  servicio          ServicioBasico  @relation(...)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  @@unique([servicioId, anio])
}
```

**Características:**
- Catálogo con servicios base (no eliminables) y personalizados
- Misma estructura mensual que ingresos

#### Supermercado
```prisma
model SupermercadoPresupuesto {
  id                Int      @id @default(autoincrement())
  anio              Int      @unique
  enero-diciembre   Float    @default(0)  // 12 campos mensuales
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Características:**
- Un solo registro por año (unique constraint)
- No requiere catálogo, es una categoría única

#### Suscripciones
```prisma
model Subscription {
  id             Int             @id @default(autoincrement())
  name           String
  price          Float
  periodicity    String // monthly, quarterly, semiannual, annual, weekly
  startDate      DateTime
  startDateId    Int
  calendar       Calendar        @relation(...)
  priceOverrides PriceOverride[]
  createdAt      DateTime        @default(now())
}

model PriceOverride {
  id             Int          @id @default(autoincrement())
  subscriptionId Int
  year           Int
  month          Int
  price          Float
  subscription   Subscription @relation(...)
  
  @@unique([subscriptionId, year, month])
}
```

**Características:**
- Periodicidad configurable (mensual, trimestral, etc.)
- Overrides de precio por año/mes específico
- Cálculo dinámico basado en fecha inicio y periodicidad

#### Obligaciones (Créditos)
```prisma
model Obligacion {
  id           Int      @id @default(autoincrement())
  nombre       String
  tipo         String   // hipotecario, consumo, seguro
  moneda       String   // CLP, UF
  montoCuota   Float
  cuotasTotales Int
  mesInicio    Int
  anioInicio   Int
  createdAt    DateTime @default(now())
}

model SupuestoAnual {
  id               Int      @id @default(autoincrement())
  anio             Int      @unique
  valorUfBase      Float
  variacionAnualUf Float
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Características:**
- Cuotas calculadas por mes de inicio y total cuotas
- Conversión automática UF → CLP usando SupuestoAnual
- Soporte para seguros asociados (montoSeguro opcional)

#### Hipotecario
```prisma
model MortgagePayment {
  id                Int      @id @default(autoincrement())
  numDiv            Int
  amortizacionUf    Float
  interesUf         Float
  comDIn            Float
  totalDivUf        Float
  fechaVencimiento  DateTime
  saldoInsolutoUf   Float
  createdAt         DateTime @default(now())
}

model MortgageInsurance {
  id        Int      @id @default(autoincrement())
  nombre    String
  mesAnio   String   // formato YYYY-MM
  monto     Float
  moneda    String   @default("CLP") // CLP o UF
  createdAt DateTime @default(now())
}
```

**Características:**
- Tabla pre-calculada de cuotas hipotecarias (MortgagePayment)
- Seguros independientes por mes/año
- Conversión UF → CLP en consulta

---

## 2. Métodos de Entrada (API Routes)

### 2.1. Ingresos

**Base URL:** `/api/ingresos`

#### Catálogo
- `GET /catalogo` - Obtener todos los ingresos (ordenados por activo y orden)
- `POST /catalogo` - Crear nuevo ingreso (body: `{nombre, esRecurrente}`)
- `PATCH /catalogo/:id` - Renombrar ingreso (body: `{nombre}`)
- `PATCH /catalogo/:id/toggle` - Activar/Desactivar ingreso
- `DELETE /catalogo/:id` - Eliminar ingreso (solo si no tiene presupuestos)

#### Presupuesto
- `GET /presupuesto/:anio` - Obtener ingresos activos con presupuesto del año
- `PUT /presupuesto` - Upsert presupuesto completo (body: `{ingresoId, anio, enero, febrero, ..., diciembre}`)
- `PATCH /presupuesto/:ingresoId/:anio/:mes` - Actualizar un mes específico (body: `{monto}`)

#### Bonos
- `GET /bonos/:anio` - Obtener bonos del año con repartos
- `POST /bonos` - Crear bono (body: `{nombre, anio, mes, monto, descripcion?, repartos[]}`)
- `PATCH /bonos/:id` - Actualizar bono completo
- `DELETE /bonos/:id` - Eliminar bono

**Lógica Especial:**
- Los repartos con `destino: "apoyo_mensual"` se distribuyen en `mesesDistribucion` meses consecutivos
- En el cálculo mensual, se suma el monto del bono + los aportes distribuidos

---

### 2.2. Servicios Básicos

**Base URL:** `/api/servicios-basicos`

#### Catálogo
- `GET /catalogo` - Obtener todos los servicios
- `POST /catalogo` - Crear servicio personalizado (body: `{nombre}`)
- `PATCH /catalogo/:id` - Renombrar servicio
- `PATCH /catalogo/:id/toggle` - Activar/Desactivar servicio
- `DELETE /catalogo/:id` - Eliminar servicio personalizado (no base, sin presupuestos)

#### Presupuesto
- `GET /presupuesto/:anio` - Obtener servicios activos con presupuesto del año
- `PUT /presupuesto` - Upsert presupuesto completo (body: `{servicioId, anio, enero, ..., diciembre}`)
- `PATCH /presupuesto/:servicioId/:anio/:mes` - Actualizar un mes específico (body: `{monto}`)

**Lógica Especial:**
- Servicios con `esBase: true` no se pueden eliminar
- Solo se muestran servicios activos en presupuesto

---

### 2.3. Supermercado

**Base URL:** `/api/supermercado`

#### Presupuesto
- `GET /presupuesto/:anio` - Obtener presupuesto del año (crea registro si no existe)
- `PATCH /presupuesto/:anio/:mes` - Actualizar un mes específico (body: `{monto}`)

**Lógica Especial:**
- Auto-creación de registro si no existe para el año
- Un único registro por año (constraint unique en anio)

---

### 2.4. Suscripciones

**Base URL:** `/api/subscriptions`

- `GET /` - Obtener todas las suscripciones
- `POST /` - Crear suscripción (body: `{name, price, periodicity, startDate}`)
- `PUT /:id` - Actualizar suscripción
- `DELETE /:id` - Eliminar suscripción

**Cálculo en Frontend:**
```typescript
// Lógica de aplicación mensual según periodicidad
const monthsDiff = (anioEval - startYear) * 12 + (mesEval - startMonth);

switch(periodicity) {
  case 'monthly': applies = monthsDiff >= 0;
  case 'quarterly': applies = monthsDiff >= 0 && monthsDiff % 3 === 0;
  case 'semiannual': applies = monthsDiff >= 0 && monthsDiff % 6 === 0;
  case 'annual': applies = monthsDiff >= 0 && monthsDiff % 12 === 0;
  case 'weekly': applies = monthsDiff >= 0; // simplificado
}
```

---

### 2.5. Obligaciones (Créditos)

**Base URL:** `/api/obligaciones`

- `GET /` - Obtener todas las obligaciones
- `GET /supuestos/:anio` - Obtener supuesto anual (valorUfBase, variacionAnualUf)
- `POST /` - Crear obligación (body: `{nombre, tipo, moneda, montoCuota, cuotasTotales, mesInicio, anioInicio}`)
- `PUT /:id` - Actualizar obligación
- `DELETE /:id` - Eliminar obligación

**Cálculo en Frontend:**
```typescript
// Calcular si aplica cuota en mes específico
const mesesTranscurridos = (anioEval - anioInicio) * 12 + (mesEval - mesInicio);
const aplica = mesesTranscurridos >= 0 && mesesTranscurridos < cuotasTotales;

// Conversión UF → CLP
const montoFinal = moneda === 'UF' ? montoCuota * valorUF : montoCuota;
```

---

### 2.6. Hipotecario

**Base URL:** `/api/hipotecario`

- `GET /payments` - Obtener todas las cuotas hipotecarias (MortgagePayment)
- `GET /seguros` - Obtener todos los seguros (MortgageInsurance)
- `POST /seguros` - Crear seguro (body: `{nombre, mesAnio, monto, moneda}`)
- `DELETE /seguros/:id` - Eliminar seguro

**Cálculo en Frontend:**
```typescript
// Filtrar pagos por mes/año
const pagosMes = payments.filter(p => 
  new Date(p.fechaVencimiento).getFullYear() === anioEval &&
  new Date(p.fechaVencimiento).getMonth() + 1 === mesEval
);

const totalCuota = pagosMes.reduce((sum, p) => sum + p.totalDivUf * valorUF, 0);

// Seguros en formato YYYY-MM
const segurosMes = seguros.filter(s => s.mesAnio === `${anio}-${mes.padStart(2, '0')}`);
const totalSeguro = segurosMes.reduce((sum, s) => 
  sum + (s.moneda === 'UF' ? s.monto * valorUF : s.monto), 0
);
```

---

## 3. Composición de la Vista "Presupuesto"

**Ruta:** `/presupuesto`  
**Componente:** `Presupuesto.tsx` (página principal)  
**Layout:** `MainLayout.tsx`

### 3.1. Estructura de la Vista

```
┌─────────────────────────────────────────────────┐
│ 📊 Presupuesto Anual                            │
│ Estado de resultados consolidado                │
├─────────────────────────────────────────────────┤
│ [Año: 2026 ▼]      Balance Anual: $X.XXX.XXX   │
├─────────────────────────────────────────────────┤
│ TABLA CONSOLIDADA (13 columnas)                 │
│ ┌──────────┬───┬───┬───┬...┬───┬───────┐       │
│ │ Concepto │Ene│Feb│Mar│...│Dic│ Total │       │
│ ├──────────┼───┼───┼───┼...┼───┼───────┤       │
│ │▶INGRESOS │...│...│...│...│...│$XXXXX │ ← expandible
│ │▶Suscripc │...│...│...│...│...│$XXXXX │ ← expandible
│ │▶Créditos │...│...│...│...│...│$XXXXX │ ← expandible
│ │▶Hipoteca │...│...│...│...│...│$XXXXX │ ← expandible
│ │▶Servicios│...│...│...│...│...│$XXXXX │ ← expandible
│ │▶Supermerc│...│...│...│...│...│$XXXXX │ ← expandible
│ ├──────────┼───┼───┼───┼...┼───┼───────┤       │
│ │TOT EGRESO│...│...│...│...│...│$XXXXX │       │
│ │BALANCE   │...│...│...│...│...│$XXXXX │       │
│ └──────────┴───┴───┴───┴...┴───┴───────┘       │
└─────────────────────────────────────────────────┘
```

### 3.2. Flujo de Carga de Datos

```typescript
useEffect(() => {
  cargarResumen();
}, [anioSeleccionado]);

const cargarResumen = async () => {
  // 1. Fetch paralelo de 9 APIs
  const [ingresosRes, serviciosRes, bonosRes, subscriptionsRes, 
         obligacionesRes, paymentsRes, segurosRes, supuestoRes, supermercadoRes] 
    = await Promise.all([...]);

  // 2. Procesar cada fuente de datos
  //    - Calcular valores mensuales (12 valores)
  //    - Aplicar lógica específica (bonos, periodicidad, UF)

  // 3. Consolidar en ResumenMensual[]
  const resumenMensual: ResumenMensual[] = MESES.map((mes, idx) => ({
    mes: string,
    ingresos: number,
    suscripciones: number,
    creditos: number,
    hipotecario: number,
    serviciosBasicos: number,
    supermercado: number,
    total: number,      // suma de egresos
    balance: number     // ingresos - total
  }));

  // 4. Preparar detalles para expansión
  setDetalleIngresos([...]);
  setDetalleServicios([...]);
  setDetalleHipotecario([...]);
  setDetalleSuscripciones([...]);
  setDetalleObligaciones([...]);
  setDetalleSupermercado({...});
};
```

### 3.3. Estado del Componente

```typescript
// Estado principal
const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
const [resumen, setResumen] = useState<ResumenMensual[]>([]);
const [loading, setLoading] = useState(true);
const [expandido, setExpandido] = useState<string | null>(null);

// Detalles por categoría (para expansión)
const [detalleIngresos, setDetalleIngresos] = useState<DetalleIngreso[]>([]);
const [detalleServicios, setDetalleServicios] = useState<DetalleServicio[]>([]);
const [detalleHipotecario, setDetalleHipotecario] = useState<DetalleHipotecario[]>([]);
const [detalleSuscripciones, setDetalleSuscripciones] = useState<DetalleSuscripcion[]>([]);
const [detalleObligaciones, setDetalleObligaciones] = useState<DetalleObligacion[]>([]);
const [detalleSupermercado, setDetalleSupermercado] = useState<DetalleSupermercado | null>(null);
```

### 3.4. Interactividad

#### Expansión de Categorías
- Click en fila de categoría → muestra/oculta detalle
- Estado `expandido` controla qué categoría está expandida
- Detalle se renderiza con indent (paddingLeft: 2rem) y color más claro

```typescript
<tr onClick={() => setExpandido(expandido === 'ingresos' ? null : 'ingresos')}>
  <td>
    <span>{expandido === 'ingresos' ? '▼' : '▶'}</span>
    INGRESOS
  </td>
  ...
</tr>

{expandido === 'ingresos' && detalleIngresos.map(detalle => (
  <tr style={{ background: '#ecfdf5', paddingLeft: '2rem' }}>
    <td>{detalle.nombre}</td>
    {detalle.valores.map(valor => <td>{formatearMonto(valor)}</td>)}
  </tr>
))}
```

#### Selector de Año
- Dropdown con rango de 11 años (anioActual - 5 a anioActual + 5)
- onChange recarga datos automáticamente

#### Indicadores Visuales
- Balance positivo: color verde (#16a34a)
- Balance negativo: color rojo (#dc2626)
- Ingresos: fondo verde (#d1fae5)
- Egresos: fondo rojo (#fee2e2)
- Balance final: fondo azul (#dbeafe)

### 3.5. Formato de Montos

```typescript
const formatearMonto = (monto: number): string => {
  if (monto === 0) return '$0';
  return `$${Math.round(monto).toLocaleString('es-CL')}`;
};
```

---

## 4. Tablas Individuales de Presupuesto

Existen 3 componentes de tabla editable para entrada de datos:

### TablaPresupuestoIngresos
- **Props:** `{anio, onOpenCatalogo, onOpenBonos}`
- **Características:**
  - Edición inline de montos por celda
  - Botón para gestionar catálogo de ingresos
  - Botón para gestionar bonos
  - Fila de bonos distribuidos separada
  - Total anual por ingreso
  - Total mensual consolidado

### TablaPresupuestoServicios
- **Props:** `{anio, onOpenCatalogo}`
- **Características:**
  - Edición inline de montos por celda
  - Botón para gestionar catálogo de servicios
  - Total anual por servicio
  - Total mensual consolidado

### TablaPresupuestoSupermercado
- **Props:** `{anio}`
- **Características:**
  - Edición inline de montos por celda
  - Una sola fila de datos (categoría única)
  - Total anual

**Comportamiento Común:**
- Click en celda → input editable
- Enter o blur → guarda monto
- PATCH individual por celda (`/api/.../presupuesto/:id/:anio/:mes`)
- Indicador de guardado ("...") mientras procesa
- Actualización optimista del estado local

---

## 5. Consideraciones para Implementar "Actuales"

### 5.1. Conceptualización

**Presupuestado vs Actual:**
- **Presupuestado:** Valores actuales en tablas (ingresos, servicios, supermercado)
- **Actual:** Valores reales ejecutados en el periodo

### 5.2. Opciones de Modelo de Datos

#### Opción A: Campos Adicionales en Presupuesto
```prisma
model PresupuestoIngreso {
  // Presupuestado (actual)
  enero             Float   @default(0)
  febrero           Float   @default(0)
  ...
  
  // Real (nuevo)
  eneroReal         Float?  @default(0)
  febreroReal       Float?  @default(0)
  ...
}
```

**Pros:** Simple, misma tabla  
**Contras:** Duplica columnas, dificulta reportes históricos

#### Opción B: Tabla Separada de Reales
```prisma
model RealIngreso {
  id                Int             @id @default(autoincrement())
  ingresoId         Int
  anio              Int
  enero             Float           @default(0)
  febrero           Float           @default(0)
  ...
  ingreso           IngresoBase     @relation(...)
  
  @@unique([ingresoId, anio])
}
```

**Pros:** Separación de concerns, escalable  
**Contras:** Más queries, más complejidad

#### Opción C: Tabla de Transacciones (Detallada)
```prisma
model TransaccionIngreso {
  id                Int        @id @default(autoincrement())
  ingresoId         Int
  fecha             DateTime
  monto             Float
  descripcion       String?
  ingreso           IngresoBase @relation(...)
}
```

**Pros:** Máxima flexibilidad, trazabilidad  
**Contras:** Requiere agregación para reporte mensual

### 5.3. Recomendación

**Opción B (Tabla Separada)** es la más balanceada:

1. **Modelo de Datos:**
```prisma
// Para cada entidad presupuestable
model RealIngreso { ... }
model RealServicioBasico { ... }
model RealSupermercado { ... }
```

2. **API Routes:**
```typescript
// Mismo patrón que presupuesto
GET  /api/ingresos/real/:anio
PATCH /api/ingresos/real/:ingresoId/:anio/:mes
```

3. **Componentes de Vista:**
```tsx
// Dualidad en TablaPresupuesto
<TablaPresupuestoIngresos 
  anio={anio} 
  modo="presupuestado" // o "real"
/>

// O dos columnas por mes en Presupuesto.tsx
<th>Ene (P)</th>
<th>Ene (R)</th>
```

4. **Vista Presupuesto Consolidada:**
```typescript
interface ResumenMensual {
  mes: string;
  // Presupuestado
  ingresosP: number;
  egresosP: number;
  balanceP: number;
  // Real
  ingresosR: number;
  egresosR: number;
  balanceR: number;
  // Varianza
  varianzaIngresos: number;
  varianzaEgresos: number;
  varianzaBalance: number;
}
```

### 5.4. Casos Especiales

#### Suscripciones y Obligaciones
- No requieren tabla de "reales" inicialmente
- Se pueden considerar como valores fijos (salvo overrides)
- Opción: Tabla de "PagosRealizados" para tracking

#### Hipotecario
- Ya tiene estructura de pagos (MortgagePayment)
- Agregar campo `pagado: Boolean` o `fechaPagoReal: DateTime?`

#### Integración Tenpo
- Las transacciones de Tenpo pueden alimentar "Reales" de Supermercado/Servicios
- Requiere categorización/mapeo de transacciones

---

## 6. Extensiones Futuras

### 6.1. Dashboard de Varianzas
- Gráficos de presupuestado vs real
- Alertas de desvíos >10%
- Análisis de tendencias mensuales

### 6.2. Importación Automática
- Integración con cuentas bancarias (API Tenpo, otros)
- Clasificación automática por ML

### 6.3. Proyecciones
- Cálculo de balance futuro basado en históricos
- Simulaciones de escenarios

### 6.4. Multi-moneda Real
- Soporte para gastos en USD/EUR/etc
- Conversión automática a CLP por fecha

---

## 7. Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    PRESUPUESTO (Vista)                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Año Selector → Trigger cargarResumen()          │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Promise.all([9 APIs paralelas])                  │ │
│  │   - Ingresos + Bonos                               │ │
│  │   - Servicios Básicos                              │ │
│  │   - Supermercado                                   │ │
│  │   - Suscripciones                                  │ │
│  │   - Obligaciones + Supuesto UF                     │ │
│  │   - Hipotecario (Payments + Seguros)              │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Procesamiento por Categoría                      │ │
│  │   - Calcular 12 valores mensuales                  │ │
│  │   - Aplicar lógicas específicas                    │ │
│  │     · Bonos: suma puntual + apoyo distribuido      │ │
│  │     · Suscripciones: periodicidad desde startDate  │ │
│  │     · Obligaciones: cuotas por rango de meses      │ │
│  │     · Hipotecario: pagos + seguros con UF→CLP      │ │
│  │   - Generar arrays de detalle para expansión       │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Consolidación ResumenMensual[]                   │ │
│  │   - Ingresos totales por mes                       │ │
│  │   - Egresos por categoría                          │ │
│  │   - Total egresos                                  │ │
│  │   - Balance (ingresos - egresos)                   │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                              │
│                           ▼                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │   Renderizado de Tabla                             │ │
│  │   - Fila resumen por categoría (expandible)        │ │
│  │   - Filas de detalle (al expandir)                 │ │
│  │   - Totales mensuales y anuales                    │ │
│  │   - Indicadores visuales (colores)                 │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

ENTRADA DE DATOS (Tablas Individuales)
┌──────────────────────────┐
│ TablaPresupuestoIngresos │ → PATCH /api/ingresos/presupuesto/:id/:anio/:mes
└──────────────────────────┘

┌───────────────────────────┐
│TablaPresupuestoServicios  │ → PATCH /api/servicios-basicos/presupuesto/:id/:anio/:mes
└───────────────────────────┘

┌─────────────────────────────┐
│TablaPresupuestoSupermercado │ → PATCH /api/supermercado/presupuesto/:anio/:mes
└─────────────────────────────┘
```

---

## 8. Checklist de Implementación de "Actuales"

### Fase 1: Modelo de Datos
- [ ] Crear modelos `RealIngreso`, `RealServicioBasico`, `RealSupermercado`
- [ ] Agregar campo `pagado` o `fechaPagoReal` a `MortgagePayment`
- [ ] Crear migración Prisma
- [ ] Ejecutar migración en DB

### Fase 2: API Routes
- [ ] Implementar `GET /api/ingresos/real/:anio`
- [ ] Implementar `PATCH /api/ingresos/real/:ingresoId/:anio/:mes`
- [ ] Replicar para servicios y supermercado
- [ ] Endpoint de conversión masiva presupuesto → real (opcional)

### Fase 3: Componentes de Entrada
- [ ] Agregar prop `modo: "presupuestado" | "real"` a TablaPresupuesto*
- [ ] Duplicar lógica de guardado para endpoints de real
- [ ] Toggle de modo en UI (botón o tabs)

### Fase 4: Vista Consolidada
- [ ] Modificar `ResumenMensual` para incluir campos `*P` y `*R`
- [ ] Modificar `cargarResumen()` para fetch de datos reales
- [ ] Calcular varianzas por categoría
- [ ] Renderizar columnas duales o vista comparativa

### Fase 5: Reportería
- [ ] Componente de gráfico Presupuestado vs Real
- [ ] Indicadores de % de ejecución mensual
- [ ] Alertas de desvíos significativos

---

## Conclusión

Este resumen proporciona una visión completa del sistema actual de presupuesto. Para implementar "Actuales", se recomienda seguir el patrón de **Tabla Separada (Opción B)**, replicando la estructura de presupuesto pero en modelos paralelos de "Real". La arquitectura modular existente facilita esta extensión sin romper funcionalidad actual.
