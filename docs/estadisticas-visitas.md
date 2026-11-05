# Estadísticas de visitas

Disponibles en `/admin/visitas/` tras desplegar esta versión y aplicar la migración `0022_visits` mediante el proceso habitual de despliegue (`src/db/deploy.ts`). No hay datos históricos anteriores a la activación.

El panel muestra los últimos 30 días en horario de Chile: sesiones estimadas por pestaña (30 minutos de inactividad entre navegaciones), páginas vistas, origen, campaña y totales diarios. Almacenamiento bloqueado puede contar cada página como visita. No identifica personas únicas ni ubicación geográfica.

Enlaces para compartir:

- Instagram: `https://tropicleta.com/?utm_source=instagram&utm_campaign=perfil`
- WhatsApp: `https://tropicleta.com/?utm_source=whatsapp&utm_campaign=promo_noviembre`
- Facebook: `https://tropicleta.com/?utm_source=facebook&utm_campaign=publicacion`

Se conserva la atribución inicial durante la sesión. Sin UTM se usa solo el dominio del referente; si no está disponible, se registra «Directo / desconocido». Se descartan consultas y rutas del referente. Las estadísticas guardan agregados diarios, sin identificadores de visitante ni IP. El limitador de solicitudes existente usa una huella de IP separada. Se respeta Do Not Track y se filtran agentes de bots conocidos; los resultados son aproximados y no están protegidos contra toda manipulación automatizada.

El registro no incluye las páginas del administrador. No instala servicios externos ni requiere una cuenta adicional.
