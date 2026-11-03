# Seguridad previa al lanzamiento — 2 de noviembre de 2026

## Cambios

- Límites de formularios públicos en la base de datos: cinco intentos por IP y operación cada quince minutos. Si la base no responde, no se permite enviar. No modifica el límite del acceso administrativo.
- Chat: ocho intentos por IP por minuto y cien en total por minuto, compartidos entre instancias. Reduce consumo abusivo; no es un límite monetario ni reemplaza la protección del alojamiento.
- Lectura del cuerpo limitada a 64 KiB en el chat y 16 KiB en el webhook de Mercado Pago, incluso sin Content-Length. Se rechazan JSON inválidos y avisos de pago con identificadores inválidos.
- Cabeceras contra incrustación en otras páginas, detección incorrecta de tipos de archivo y filtración innecesaria de referencias. Se oculta la cabecera de Next.js.

## Dependencias y verificación

Actualizados Next.js a 16.4.4, React/React DOM a 19.3.1, Zod directo a 4.6.7 y Puppeteer a 25.16.0, además de follow-redirects, source-map-js y undici. Auditoría de producción: bajó de once alertas (una crítica) a cuatro altas, sin críticas. Las cuatro restantes corresponden a una cadena compartida de Vercel Blob → OIDC → cli-config → Zod anidado antiguo. No se forzó Zod 4 sobre consumidores de Zod 3 ni se degradó Blob a 2.4.0: requieren comprobar compatibilidad con la autenticación y las subidas actuales. Quedan pendientes.

Pasaron comprobación de tipos, pruebas de administración (incluida concurrencia), pagos Mercado Pago/Webpay, duplicados, stock, recuperación de fallos y pruebas de lectura JSON limitada. Las pruebas usan datos aislados y simulación de pasarelas, sin cobros reales.

Se agregaron tiempos máximos de conexión (10 segundos) y consultas (15 segundos) en PostgreSQL, con conexiones inactivas liberadas tras 30 segundos.

La compilación de producción terminó correctamente.

## Controles existentes revisados

- Checkout recalcula los importes desde la base; no acepta el precio indicado por el navegador.
- Mercado Pago exige firma del webhook en producción y consulta el pago con credenciales del servidor. Comprueba monto, CLP y ambiente antes de marcar una orden pagada.
- Confirmación de pagos transaccional e idempotente para no descontar existencias dos veces.
- Acciones administrativas revisadas requieren autorización en el servidor. Sesiones firmadas con comprobación del lado servidor.
- `.env.local` no está seguido por Git; no se copiaron secretos al informe.

## Configuración externa pendiente de comprobar

El 3 de noviembre se comprobó el proyecto en Vercel y la presencia de las variables privadas de pagos, sesión y PostgreSQL, sin leer ni exponer sus valores. No se verificó la configuración interna de la cuenta de Mercado Pago, permisos de retiro, firewall ni restauración de respaldos.

1. Activar autenticación de dos factores en Mercado Pago, Vercel, GitHub y el correo de recuperación. Revisar colaboradores, sesiones abiertas y permisos para retirar dinero.
2. Confirmar en producción MP_WEBHOOK_SECRET, MP_ACCESS_TOKEN, SESSION_SECRET aleatorio y contraseña administrativa fuerte. Mantener secretos solo en variables privadas. Revisar ambiente real de pagos antes de habilitar compras.
3. Configurar protección contra bots y límites en el firewall del alojamiento, especialmente `/api/chat/`, checkout y formularios. No bloquear las notificaciones legítimas de Mercado Pago ni los retornos de Webpay. Los límites en la aplicación no evitan que el tráfico llegue al servidor.
4. Configurar alertas de gasto y límites disponibles en Vercel y el proveedor de IA. Verificar si cada límite detiene realmente el gasto o solo notifica.
5. Habilitar copias automáticas de la base y probar restauración. Evitar usar la base local para producción.
6. Después de publicar: probar compra con importe pequeño, firma rechazada, confirmación única, acceso administrativo, formularios y cabeceras HTTPS. No se realizaron cobros, retiros ni ataques de carga en esta revisión.

## Alcance

Revisión del código y dependencias locales. No constituye una prueba de penetración integral ni garantiza disponibilidad frente a ataques distribuidos. Las alertas de dependencias no prueban por sí solas que una vulnerabilidad sea explotable en este sitio.
