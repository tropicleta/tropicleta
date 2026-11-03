# Tropibot en Administración

Ruta: `/admin/tropibot/`. Requiere sesión de administrador en página, API y guardado.

La conversación prepara un borrador; solo el botón Confirmar y guardar escribe datos. Usa OPENAI_API_KEY y OPENAI_CHAT_MODEL existentes, solo en servidor. Sin clave hay formulario manual. Se envía al proveedor únicamente la conversación escrita en esta pantalla; no se envía la base de clientes. La conversación no persiste al recargar.

La migración 0021_tropibot agrega una tabla sin modificar registros existentes. Ejecutar las migraciones antes de desplegar. Cada registro y su movimiento de caja se guardan en una transacción; reintentos del mismo registro no duplican el cobro.

Permite servicio realizado, venta presencial y gasto, con fecha, cliente/proveedor, descripción, monto total, pago completo, medio y origen (incluido recomendador). Los pagos completos alimentan Contabilidad; los pendientes no crean caja. Las estadísticas por origen incluyen únicamente registros de Tropibot y excluyen de los importes los cobros anulados. No son clientes únicos ni atribución automática de visitas.

Primera versión: no descuenta stock, no admite abonos, no enlaza pedidos online, no envía recordatorios y no permite cobrar posteriormente un pendiente desde Tropibot. Esos cobros pueden registrarse en Contabilidad, pero no se enlazan automáticamente al registro pendiente ni a sus estadísticas de origen. La fecha del registro pagado es también la fecha del cobro. No duplicar movimientos ya existentes.

Verificación: `node --conditions=react-server --import tsx tests/tropibot.test.ts`, `npm run test:accounting`, `npm run typecheck`, `npm run build`.
