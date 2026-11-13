# Prueba privada de Netlify

Proyecto: tropicleta-prueba. El dominio comercial continúa en Vercel.

## Base de datos aislada

La organización gratuita está administrada por Vercel y rechazó crear un proyecto independiente. Se creó la base vacía `tropicleta_netlify_test` dentro del proyecto actual, con usuario `netlify_test_app` limitado a sus tablas. Comparte cómputo y cuota con la tienda. No se clonaron pedidos, sesiones, mensajes ni clientes reales. Una comprobación de permisos confirmó que ese usuario no puede leer ninguna tabla pública de la base de producción.

Se aplicaron las migraciones de Drizzle y `seedDatabase` con `demo:false`: 17 productos, 51 servicios, cero pedidos y cero mensajes. `scripts/netlify-prepare-test.ts` exige conexión directa a esa base y comprueba que esté vacía antes de inicializarla. El script src/db/deploy.ts está pensado para el catálogo operativo; no ejecutarlo contra producción como parte de estas pruebas. Una base de prueba no reemplaza un respaldo.

## Variables

Configurar mediante Netlify UI/CLI/API, con ámbito que incluya funciones y compilación. No incluir claves en Git, netlify.toml, capturas ni informes. Se necesita un nuevo despliegue para aplicar cambios.

| Variable | Prueba privada |
| --- | --- |
| NEXT_PUBLIC_SITE_URL | https://tropicleta-prueba.netlify.app |
| DATABASE_URL | PostgreSQL aislado; nunca la conexión operativa por defecto |
| CHAT_ENABLED | false |
| MP_ACCESS_TOKEN / MP_WEBHOOK_SECRET | Ausentes hasta disponer de credenciales de prueba |
| TBK_ENV | integration; pagos web siguen deshabilitados en producción sin claves live |
| RESEND_API_KEY / ADMIN_LOGIN_EMAIL / ADMIN_EMAIL | Ausentes para evitar correos reales |
| BLOB_READ_WRITE_TOKEN | Ausente inicialmente; no probar escrituras en el almacén operativo |
| ADMIN_PASSWORD / SESSION_SECRET | Exclusivos de la prueba; no reutilizar los de producción |

No activar la tienda como pública hasta completar las comprobaciones. El proyecto se creó privado y conectado a main; revisar la rama antes de publicar cambios de compatibilidad para no desplegarlos inadvertidamente en Vercel.

## Comprobaciones pendientes

- Catálogo, servicios, recomendados y guías con PostgreSQL de prueba.
- Acceso al panel, sesión, cierre de sesión y rechazo de acceso sin autenticar.
- Alta/edición de producto ficticio e invalidación de caché.
- Carrito, totales y bloqueo de pagos no configurados.
- Reserva/confirmación/repetición de notificación con proveedores simulados; los tests existentes cubren concurrencia e idempotencia localmente.
- Correos y pagos sandbox antes de trasladar claves operativas.
- Subidas con almacenamiento aislado; sin credenciales deben mostrar un aviso sin escribir en el disco temporal.
- Importador de afiliados con Chromium y límites de función en Netlify.
- Verificar cuotas de Netlify, Neon, correo, IA y almacenamiento antes de activar el dominio.

Cambiar DNS y callbacks de pagos es un paso posterior a la validación. Mantener disponible el despliegue de Vercel para poder volver atrás.

Fuentes: https://docs.netlify.com/build/functions/environment-variables/ y https://github.com/neondatabase/website/blob/main/content/docs/manage/branches.md
