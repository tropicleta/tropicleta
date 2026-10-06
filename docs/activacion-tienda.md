# Activación de la tienda Tropicleta

## Avance de configuración (6 de octubre de 2026)

- Aplicación Mercado Pago creada: **Tropicleta Tienda Web**, ID **8095070185425190**, Checkout Pro con API de Preferences.
- Ambiente de pruebas generado con comprador y vendedor. Token de pruebas instalado únicamente en `.env.local`, excluido de Git.
- Conexión real al servicio de preferencias probada sin efectuar cobros. Checkout local crea la orden y redirige al dominio sandbox de Mercado Pago.
- Credenciales productivas habilitadas por el propietario en Mercado Pago. `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y `MP_SANDBOX=0` actualizados en Vercel, proyecto Tropicleta, únicamente en Producción. Son secretos y necesitan un nuevo despliegue productivo para aplicarse.
- Notificaciones productivas guardadas en la nueva aplicación para eventos payment (Pagos legacy), hacia `https://www.tropicleta.com/api/mercadopago/webhook/`. Firma instalada en Vercel. No configurar otros tipos de eventos que esta ruta no maneja.
- Compilación y comprobación de tipos verificadas; pruebas de catálogo, administración, contabilidad y tienda realizadas.
- Rama de revisión: `codex/tienda-y-recomendados`. Vista previa en Vercel compilada correctamente y comprobada con la base del comercio (un producto publicado, sin incorporar el catálogo demo local). Pendiente publicar en el dominio principal; no se ha realizado un cobro real.

## Recorridos

- `/tienda/`: catálogo propio, carrito, retiro/despacho y pago con Webpay o Mercado Pago.
- `/recomendados/`: selección editorial con enlaces de afiliado; la compra ocurre en Mercado Libre. No comparte carrito con la tienda propia.
- `/admin/recomendados/`: crear, editar, publicar u ocultar recomendaciones. Pegar enlaces reales de la cuenta de afiliados; no se inventan productos ni enlaces.
- `/admin/pagos/`: revisar configuración pendiente sin mostrar secretos. No comprueba conectividad por sí solo.

## Credenciales privadas

No se necesitan las contraseñas personales de Mercado Libre ni de Mercado Pago en el código.

- Webpay: `TBK_ENV=production`, `TBK_COMMERCE_CODE` y `TBK_API_KEY`, proporcionados por Transbank para el comercio habilitado.
- Mercado Pago: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` y `MP_SANDBOX=0` para cobros reales.
- Registrar notificaciones de tipo payment en `https://DOMINIO/api/mercadopago/webhook/`.
- `NEXT_PUBLIC_SITE_URL=https://DOMINIO` debe coincidir con el dominio publicado.
- `DATABASE_URL` o `POSTGRES_URL`: base persistente. Aplicar migraciones con el proceso de despliegue existente; la nueva tabla recommendations se agrega sin borrar datos.
- `RESEND_API_KEY`, `EMAIL_FROM` con dominio verificado y `ADMIN_EMAIL` para los correos de venta.
- `ADMIN_PASSWORD` y `SESSION_SECRET` para proteger el panel.

En producción Webpay permanece deshabilitado sin credenciales productivas y HTTPS. Mercado Pago permanece deshabilitado sin token, firma de notificaciones y HTTPS. En desarrollo Webpay permite integración con credenciales públicas del SDK y muestra aviso de pruebas.

## Verificación antes de cobrar

1. Confirmar precios, stock real y publicar únicamente productos listos para venta. Confirmar tarifas de despacho (actualmente 2.000, 3.000 y 4.000 CLP por sector), cobertura y datos del negocio.
2. Probar cada pasarela con credenciales/cuentas de prueba: aprobado, rechazado, cancelación, abandono y retorno repetido.
3. Verificar importe, moneda CLP, actualización de orden, descuento único de stock, confirmación al cliente y aviso al administrador.
4. En Mercado Pago verificar notificación con firma válida, rechazo de firma inválida, pago pendiente y notificación repetida. La orden debe confirmarse aunque el comprador cierre el navegador.
5. Verificar móvil: producto → carrito → entrega → pago → confirmación; enlaces de afiliado abren Mercado Libre y conservan el carrito propio.
6. Activar credenciales productivas y realizar una compra real controlada, comprobando liquidación y procedimiento de devolución en cada proveedor.

## Límites actuales que requieren atención operativa

- Las pruebas automatizadas usan una base temporal y respuestas simuladas; no certifican cobros ni entrega de correo en las cuentas reales.
- El stock se descuenta al confirmar el pago. No hay reserva temporal de inventario: compras simultáneas de la última unidad requieren revisión del administrador antes de prometer entrega.
- Un fallo de red durante la confirmación de Webpay conserva la orden pendiente y permite reconciliar en un retorno posterior. Un proceso caído durante la confirmación puede necesitar revisión manual en el proveedor.
- El panel informa configuración; no sustituye las pruebas con los proveedores ni la habilitación contractual del comercio.

Documentación oficial: [Webpay Plus](https://transbankdevelopers.com/documentacion/webpay-plus) y [notificaciones de Mercado Pago](https://www.mercadopago.cl/developers/es/docs/links-and-debts/additional-content/your-integrations/notifications?scope=prod).
