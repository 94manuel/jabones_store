# Validación técnica realizada

Fecha de validación: 25 de mayo de 2026.

## Validaciones ejecutadas

- Compilación del backend NestJS: `npm run build` en `apps/api`.
- Pruebas automatizadas del backend: `npm run test` en `apps/api`.
  - Firma de integridad del checkout Wompi.
  - Checksum dinámico de eventos de pago Wompi.
- Compilación de producción del frontend Next.js SSR: `npm run build` en `apps/web`.
- Validación sintáctica de `docker-compose.yml`.
- Validación JSON del workflow importable `automation/n8n-jabones-chat-workflow.json`.

## Alcance no ejecutado en este entorno

No fue posible ejecutar contenedores Docker porque el binario Docker no está disponible en el entorno de generación. El archivo Compose quedó preparado con healthchecks, migración automática de TypeORM y datos iniciales configurables mediante `SEED_DATABASE=true`.
