# Configuración de producción — CocoEsencia

## Variables obligatorias

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión PostgreSQL exclusiva de la tienda usada por TypeORM. |
| `SEED_DATABASE` | En `true`, carga administrador y catálogo inicial al iniciar la API. |
| `JWT_SECRET` | Secreto de firma JWT, aleatorio y de alta entropía. |
| `FRONTEND_URL` | Dominio HTTPS del frontend autorizado por CORS. |
| `WOMPI_PUBLIC_KEY` | Llave pública Wompi del ambiente correspondiente. |
| `WOMPI_INTEGRITY_SECRET` | Secreto con el cual NestJS firma el checkout. |
| `WOMPI_EVENTS_SECRET` | Secreto para validar eventos recibidos de Wompi. |
| `N8N_CHAT_WEBHOOK_URL` | URL de producción del webhook de chat n8n. |

## Flujo de pago

1. El cliente genera un pedido autenticado.
2. NestJS crea una referencia única de pago y firma monto, moneda, expiración y secreto de integridad.
3. Next.js abre el widget Wompi usando únicamente los datos públicos y la firma generada.
4. Wompi notifica el cambio de estado al endpoint `/api/v1/payments/webhooks/wompi`.
5. NestJS reconstruye el checksum de acuerdo con `signature.properties`, valida monto/moneda y únicamente entonces marca el pedido como pagado.

## Lista mínima antes de publicar

- Habilitar HTTPS para web, API, webhook Wompi y n8n.
- Sustituir todas las credenciales iniciales y excluir `.env` del repositorio.
- Restringir el acceso al panel administrativo y rotar claves regularmente.
- Configurar respaldos y monitoreo de PostgreSQL.
- Registrar textos legales: términos, privacidad, tratamiento de datos, cambios/devoluciones y condiciones de envío.
- Verificar información técnica del producto, lotes y rotulado aplicable antes de comercializar jabones.
