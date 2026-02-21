# Integración Tenpo - Gmail API

Esta integración permite sincronizar automáticamente emails de Tenpo desde Gmail para gestionar compras y pagos de tu tarjeta de crédito prepago.

## Configuración Inicial

### 1. Obtener credenciales de Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Gmail API**:
   - Menú lateral → "APIs & Services" → "Library"
   - Busca "Gmail API" y haz clic en "Enable"

4. Crear credenciales OAuth 2.0:
   - Menú lateral → "APIs & Services" → "Credentials"
   - Clic en "Create Credentials" → "OAuth client ID"
   - Tipo de aplicación: "Web application"
   - Nombre: "Zapps Tenpo Integration"
   - URIs de redireccionamiento autorizados:
     - `http://localhost:3000/api/integrations/google/callback`
     - Si despliegas en producción, agrega tu URL de producción

5. Descarga el JSON con las credenciales o copia:
   - Client ID
   - Client Secret

### 2. Configurar variables de entorno

Edita el archivo `.env` en la carpeta `node-version`:

```env
DATABASE_URL="file:./dev.db"
PORT=3000
NODE_ENV=development

# Google OAuth2 para Gmail API
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google/callback"
```

### 3. Configurar etiquetas en Gmail

Crea las siguientes etiquetas en tu Gmail:
- `Tenpo/Compras TC Tenpo`
- `Tenpo/Pagos TC Tenpo`

Configura filtros automáticos para etiquetar los emails de Tenpo:
- De: `notificaciones@tenpo.cl` (o el email que usa Tenpo)
- Asunto contiene "compra" → Aplicar etiqueta "Tenpo/Compras TC Tenpo"
- Asunto contiene "pago" → Aplicar etiqueta "Tenpo/Pagos TC Tenpo"

### 4. Ejecutar migraciones

```bash
cd node-version
npx prisma migrate dev
```

### 5. Iniciar el servidor

```bash
npm run dev
```

## Uso

1. Navega a `/presupuesto/tenpo` en tu aplicación
2. Si es la primera vez, verás un botón "Autorizar con Google"
3. Haz clic y autoriza el acceso a tu Gmail
4. Una vez autorizado, podrás usar el botón "Actualizar desde Gmail" para sincronizar emails

## Funcionalidades

### Backend Endpoints

- `GET /api/integrations/google/status` - Verifica si hay autenticación activa
- `GET /api/integrations/google/auth-url` - Obtiene URL para OAuth2
- `GET /api/integrations/google/callback` - Callback de OAuth2
- `POST /api/tenpo/sync` - Sincroniza emails de Gmail
- `GET /api/tenpo/forecast?months=12` - Proyección mensual
- `GET /api/tenpo/installments` - Lista cuotas (filtrable por año/mes)
- `GET /api/tenpo/purchases` - Lista todas las compras
- `GET /api/tenpo/payments` - Lista todos los pagos
- `PATCH /api/tenpo/installments/:id` - Edita interés de una cuota

### Frontend

- **Dashboard**: Muestra resumen del mes actual
  - Estimado mes
  - Pagado mes
  - Brecha
  - % Cobertura

- **Proyección 12 meses**: Tabla con estimación y pagos por mes

- **Detalle de cuotas**: 
  - Tabla editable de cuotas del mes seleccionado
  - Permite editar % de interés (usar coma decimal: 1,5%)
  - Recalcula automáticamente el monto final

## Reglas de negocio Tenpo

- **Cierre**: Día 21 de cada mes
- **Vencimiento**: Día 5 del mes siguiente a la factura
- Si el vencimiento cae sábado o domingo, se mueve al viernes anterior
- Por defecto, las cuotas no tienen interés (0%)
- Se puede agregar interés manualmente por cuota

## Formato de emails esperados

### Email de Compra
```
Fecha: 05-12-2024
Comercio: SPOTIFY
Monto: $4.990
Cuotas: 1
```

### Email de Pago
```
Monto transacción: $350.000
Fecha: 05/12/2024
Hora: 14:30
Medio: Cuenta RUT
Código transacción: ABC123456
```

## Base de datos

### Modelos creados

- `GoogleAuthToken`: Almacena tokens de OAuth2
- `TenpoEmail`: Emails sincronizados de Gmail
- `TenpoPurchase`: Compras parseadas
- `TenpoInstallment`: Cuotas individuales
- `TenpoPayment`: Pagos realizados

## Notas

- Los tokens de acceso se refrescan automáticamente cuando expiran
- Solo se sincroniza una vez cada email (detecta duplicados por `gmailMessageId`)
- Los emails que no se pueden parsear se guardan con `parsedOk=false` y un mensaje de error
- El sistema es idempotente: puedes ejecutar sync múltiples veces sin crear duplicados
