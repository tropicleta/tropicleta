# Compra ficticia de Mercado Pago

Se completó Checkout Pro en Sandbox usando vendedor y comprador ficticios y la tarjeta de prueba oficial Mastercard terminada en 2580. No se utilizaron medios de pago reales.

- Orden local: `TPC-5QX4UKYKEP`.
- Operación de Mercado Pago: `181800986599`, aprobada, CLP 10.000.
- Base de datos aislada: `.data/mp-purchase-test-20261006`.
- Estado verificado en base de datos: `pagada`.
- Stock del producto 1: 6 antes del pago, 5 después.
- Comprobación TypeScript y `test:shop`: correctas. Las pruebas incluyen rechazo de un receptor real o distinto en Sandbox e idempotencia del descuento de stock.

La API devolvió `live_mode=true` aunque el checkout mostraba Sandbox y ambas cuentas eran ficticias. Se ajustó la validación local para aceptar esta variante solo cuando `/users/me` confirme la etiqueta `test_user` y el ID del vendedor autenticado coincida con `collector_id`. La validación de monto y moneda se mantiene. El ajuste todavía no está publicado.

La confirmación del pedido se hizo mediante la consulta del pago desde la página de retorno. No se verificó entrega externa del webhook a este entorno local HTTP. Tampoco se enviaron correos reales desde este entorno.

Las pruebas automatizadas adicionales verificaron la ruta de notificaciones: firma válida y repetida con respuesta 200, firma ausente o falsa con respuesta 401, pedido aprobado y descuento único de stock sin depender de la página de retorno, y pagos rechazados/cancelados sin descontar inventario. Se ejecutaron en una base temporal con respuestas simuladas de la API; no sustituyen la entrega externa desde Mercado Pago al dominio público.
