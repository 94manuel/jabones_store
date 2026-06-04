# CocoEsencia — Tienda virtual de jabones artesanales

Plataforma de vitrina y comercio electrónico para jabones artesanales, construida con **Next.js SSR (App Router)**, **NestJS**, **TypeORM**, **PostgreSQL**, **MinIO** y **Docker Compose**. Incluye marca y logo vectorial propios, catálogo, carrito, autenticación, panel administrativo, pagos con Wompi, rastreo de pedidos, carga de archivos y chat conectado a n8n.

## Módulos entregados

| Área | Funcionalidad |
| --- | --- |
| Vitrina | Inicio SSR, tienda, productos destacados, detalle de producto, quiénes somos y contacto |
| Cliente | Registro, inicio de sesión, carrito, checkout, historial de pedidos, direcciones y rastreo por código |
| Administración | Dashboard, agregar/editar/eliminar productos, gestionar estado de pedidos y consultar contactos |
| Archivos | Carga administrativa de cualquier tipo de archivo en MinIO y publicación por URL para clientes |
| Pagos | Checkout Wompi para tarjeta/PSE y demás métodos disponibles, firma de integridad en backend y webhook verificado |
| Automatización | Widget de chat y proxy seguro a un webhook n8n; flujo demostrativo importable |
| Infraestructura | Docker Compose con PostgreSQL, MinIO, API, web y perfil opcional de n8n |

## Arquitectura

```text
Navegador
  │
  ├── Next.js 16 SSR :3000 ── Route Handlers/BFF ──► NestJS API :4000
  │                                                   │
  │                                                   ├── TypeORM + migraciones ─► PostgreSQL :5432
  │                                                   ├── MinIO ─► Archivos e imagenes :9000
  │                                                   ├── Wompi Checkout + webhook
  │                                                   └── n8n webhook :5678/opcional
  └── Wompi Widget externo (no almacena datos de tarjeta en la tienda)
```

El frontend usa Server Components y consultas `no-store` para renderizar catálogo y paneles desde el servidor. El navegador nunca recibe el secreto de integridad de Wompi: NestJS calcula la firma SHA-256 requerida por la pasarela.

## Inicio rápido con Docker Compose

1. Copie las variables de entorno:

```bash
cp .env.example .env
```

2. Para pagos reales o pruebas en sandbox, configure en `.env` las tres credenciales de Wompi (`WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`). Sin credenciales reales, toda la tienda funciona salvo la apertura del widget de pago.

3. Levante la aplicación:

```bash
docker compose up --build
```

4. Abra:

- Tienda: `http://localhost:3001`
- API Swagger: `http://localhost:4001/docs`
- Health API: `http://localhost:4001/api/v1/health`
- Consola MinIO: `http://localhost:9001`

El contenedor API aplica la migración versionada de TypeORM y carga datos iniciales automáticamente cuando `SEED_DATABASE=true`.

## Archivos con MinIO

La implementación de archivos usa **MinIO**. Desde el panel administrativo hay una sección **Archivos en MinIO** para subir imágenes, PDF, hojas de cálculo o cualquier otro formato. Cada carga genera una URL pública servida por la propia aplicación en `GET /api/backend/files/public?key=...`, de modo que los clientes pueden abrir o descargar el archivo sin exponer directamente el bucket.

Variables clave para MinIO:

- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`
- `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- `MINIO_PUBLIC_BASE_URL`
- `MINIO_AUTO_CREATE_BUCKET`, `MINIO_MAX_FILE_SIZE_MB`

Si en el futuro mueve MinIO a un servidor externo en InterServer, solo necesita apuntar esas variables a la nueva instancia y mantener `MINIO_PUBLIC_BASE_URL` con la URL publica correcta del frontend.

### Usuario administrador inicial

Las credenciales se toman de `.env`:

```text
Correo: admin@cocoessencia.co
Clave:  Admin123!
```

Cámbielas antes de usar el sistema fuera de un ambiente local.

## Activar chat con n8n

Puede usar su instancia de n8n existente o levantar la incluida:

```bash
docker compose --profile automation up --build
```

1. Ingrese a n8n en `http://localhost:5678`.
2. Importe `automation/n8n-jabones-chat-workflow.json`.
3. Active el workflow y copie la **Production URL** del nodo Webhook.
4. Asigne esa URL a `N8N_CHAT_WEBHOOK_URL` en `.env` y reinicie `api`.

El backend envía `{ message, sessionId, customer }` y espera una respuesta con campo `output` o `text`.

## Configurar pagos con tarjeta y PSE

La implementación utiliza el Widget Checkout de Wompi:

1. Registre el comercio y obtenga las llaves sandbox/producción.
2. Configure las variables Wompi en `.env`.
3. En el dashboard Wompi configure la URL de eventos:

```text
https://SU-DOMINIO/api/v1/payments/webhooks/wompi
```

En desarrollo local necesitará exponer temporalmente el backend mediante un túnel HTTPS para recibir webhooks reales. El widget permite escoger tarjeta, PSE y los métodos habilitados por la cuenta Wompi; la aplicación registra pedidos como pagados únicamente después de validar el evento.

## Desarrollo local sin Docker para las aplicaciones

Mantenga PostgreSQL activo mediante Docker:

```bash
docker compose up -d postgres
cp .env.example .env
# Cambie DATABASE_URL para usar localhost:5433
npm install
npm run dev
```

Ajuste `DATABASE_URL` a `localhost:5433`, `API_INTERNAL_URL=http://localhost:4000/api/v1`, `FRONTEND_URL=http://localhost:3000` y `NEXT_PUBLIC_SITE_URL=http://localhost:3000` cuando ejecute API y web fuera de contenedores.

En VS Code tambien puede presionar F5 y elegir **F5: CocoEsencia dev full stack**. Esa configuracion levanta Postgres y MinIO con Docker Compose, inyecta las variables locales necesarias y ejecuta API + web con el depurador de JavaScript habilitado.

Si ejecuta MinIO fuera de Docker Compose, cambie tambien `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` y `MINIO_PUBLIC_BASE_URL` para que apunten a su instancia local o remota.

## Endpoints principales

| Método | Endpoint | Acceso |
| --- | --- | --- |
| POST | `/api/v1/auth/register`, `/api/v1/auth/login` | Público |
| POST | `/api/v1/files/upload` | Administrador |
| GET | `/api/v1/files/admin` | Administrador |
| GET | `/api/v1/files/public?key=...` | Público |
| GET | `/api/v1/products`, `/products/:slug` | Público |
| POST/PATCH/DELETE | `/api/v1/products` | Administrador |
| POST | `/api/v1/orders` | Cliente autenticado |
| GET | `/api/v1/orders/mine`, `/orders/tracking/:code` | Cliente / Público |
| PATCH | `/api/v1/orders/admin/:id/status` | Administrador |
| POST | `/api/v1/payments/checkout` | Cliente autenticado |
| POST | `/api/v1/payments/webhooks/wompi` | Webhook Wompi verificado |
| POST | `/api/v1/chat/message` | Público |
| POST | `/api/v1/contact` | Público |
| GET | `/api/v1/admin/summary` | Administrador |

## Seguridad incorporada

- Contraseñas con `bcryptjs`; JWT almacenado como cookie `httpOnly` desde Next.js.
- Autorización por roles en operaciones administrativas.
- DTOs validados con `class-validator` y `ValidationPipe` estricto.
- Helmet y CORS restringido al frontend configurado.
- Firma del checkout y verificación dinámica de eventos Wompi en servidor.
- La tienda no recibe ni persiste datos de tarjetas o credenciales PSE.

## Consideraciones para producción

Configure HTTPS, cambie todos los secretos, use una base de datos administrada con respaldos, ubique MinIO en almacenamiento persistente o en un servidor externo, establezca políticas de privacidad y tratamiento de datos, e implemente transportadora real para generar guías y eventos de entrega.
