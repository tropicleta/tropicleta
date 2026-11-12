# Fiabilidad y consumo antes del lanzamiento

## Existencias
Las unidades fisicas se descuentan al confirmar un pago, conservando el flujo validado. La reserva de 30 minutos impide iniciar dos checkouts de la ultima unidad: el control comparte bloqueos de producto entre checkout y confirmacion. Un rechazo o error de pasarela libera su reserva. Las reservas vencidas se ignoran en la disponibilidad. Un pago tardio nunca toma unidades reservadas por otro comprador: si falta stock queda pagado con stock_status=review, visible en panel y recibo; se bloquea preparar/entregar hasta asignar stock desde el panel. No se hacen devoluciones automaticas. Para resolver, reponer y usar Comprobar y asignar existencias, o coordinar devolucion y anulacion sin reponer stock que no se desconto.

## Correos
Avisos persistidos en email_outbox con lease de 60s, timeout10s y clave de idempotencia Resend. Hasta8 intentos con espera exponencial; se reintentan al abrir el panel (2) y manualmente desde Avisos por correo (5, una vez/minuto). Nuevos avisos intentan enviarse al encolarse. No existe una tarea periodica contratada ni promesa de envio mientras nadie use el sitio/panel. Los codigos de acceso son inmediatos y no se encolan, para no entregar codigos vencidos. Tras enviar se borran destinatario/asunto/cuerpo de la cola, conservando la clave para no repetir. Revisar la cuota de Resend si permanecen pendientes.

## Chat
Defaults200 interacciones/dia UTC y3000/mes UTC, compartidos en PostgreSQL entre instancias, ademas de los limites por minuto anteriores. Cada interaccion puede realizar dos llamadas a IA. CHAT_ENABLED=false lo detiene; CHAT_DAILY_LIMIT y CHAT_MONTHLY_LIMIT cambian los cortes. No equivalen a un importe monetario fijo. Agotar el cupo no detiene reservas/tienda y el chat ofrece WhatsApp.

## Consultas y visitas
Catalogo/recomendados/vehiculos/sitemap con cache24h invalidada al editar, productos5min; variantes de URL reutilizan instantaneas. Checkout consulta precio/stock real. Portada muestra el contenido principal sin esperar a la vista previa de recomendados y soporta fallo de esa consulta opcional. Contador: entrada de visita, una por navegador30min, una sola escritura SQL; las navegaciones internas/repeticiones/bots/DNT no escriben. La cookie firmada y el freno en memoria no sustituyen un firewall distribuido. El panel explica que las vistas historicas tienen otra granularidad.

## Recursos y fallos
Recomendados muestra12 productos/pagina. Carrusel carga imagen activa y vecinas, se pausa fuera de pantalla. YouTube se difiere hasta carga del documento y pausa en pestana oculta. Se cachea MP3 versionado un año y archivos del detector24h; al cambiar el audio hay que cambiar su nombre/version. Boundary publico permite reintento y contacto sin mostrar detalles internos.

## Despliegue
Migracion0023 agrega reservas, cola y stock_status por defecto legacy para pedidos anteriores; no cambia cuotas ni planes, no borra ventas, ni dispara pagos/emails de prueba reales. El build de Vercel ya ejecuta migraciones antes de compilar. Revisar quotas/backup/proveedor aparte: estas mejoras no amplian los planes gratuitos.
