# Tropicleta — Next.js

Sitio completo de [tropicleta.com](https://tropicleta.com): home clonada 1:1 del original + catálogo de servicios,
solicitud de hora, tienda con carrito, checkout con Webpay Plus y Mercado Pago, y panel de administración.
Roadmap y pendientes: doc **"Tropicleta — Roadmap Next.js"** del proyecto en Claude.

## Puesta en marcha

**Modo demo (cero configuración):**

```bash
npm install
npm run dev          # http://localhost:3000  ·  panel: /admin (clave "tropicleta")
```

Sin `DATABASE_URL` se usa **PGlite** (Postgres embebido en `./.data/pglite`). Al primer arranque aplica las
migraciones y carga todo el contenido demo: 29 servicios, 16 productos con imagen, reservas, órdenes y mensajes.
`npm run db:reset-local` borra esa BD y se vuelve a crear al iniciar.

**Con Postgres real (producción o local con Docker):**

```bash
cp .env.example .env.local        # descomenta DATABASE_URL y define ADMIN_PASSWORD y SESSION_SECRET
docker compose up -d
npm run db:migrate
npm run db:seed                   # servicios y productos
SEED_DEMO=1 npm run db:seed       # + reservas, órdenes y mensajes de ejemplo
npm run dev
```

## Contenido dummy

Todo el contenido editable vive en `src/db/seed-data.ts` (servicios, productos, demo del panel), `src/data/site.ts`
(email, redes, horario), `src/data/faq.ts`, `src/data/posts.ts` y los textos de `nosotros`, `eventos` y páginas legales.
Solo son reales: WhatsApp, ubicación, zonas de cobertura, diagnóstico gratuito, garantía de 2 semanas y los precios de
Mantención completa ($50.000), Limpieza ultrasónica + encerado ($35.000) y Tubeless completo ($20.000).
Los textos legales son de ejemplo: revísalos con asesoría legal antes de publicar.

## Qué incluye

| Ruta | Función |
| --- | --- |
| `/` | Home idéntica al original. Servicios destacados y productos destacados salen de la BD (con respaldo estático si la BD no responde). |
| `/servicios/`, `/servicios/[slug]/` | Catálogo por categoría (anclas `#mantenciones`, `#ruedas`…), precio o "A cotizar", detalle con CTA. |
| `/agendar/` | Solicitud de hora: servicios, vehículo, fecha y bloque, retiro a domicilio, datos. Email al taller y al cliente. `?servicio=slug` preselecciona. |
| `/tienda/`, `/tienda/[slug]/` | Grilla con filtro por categoría y orden por precio, ficha con stock y JSON-LD. |
| Carrito | Drawer + `/carrito/`, persistido en localStorage, límite por stock. |
| `/checkout/` | Datos, retiro o despacho por comuna, Webpay o Mercado Pago. Total recalculado en el servidor, validación de stock. |
| `/checkout/gracias/` | Estado de la orden (pagada, en proceso, rechazada/anulada) y vaciado del carrito. |
| `/contacto/` | Datos, horario, cobertura, mapa y formulario (guardado en BD + email). |
| `/nosotros/`, `/eventos/` | Historia y valores; taller móvil con formulario de cotización (llega a Mensajes con etiqueta Evento). |
| `/consejos/` | Blog con 4 artículos (`src/data/posts.ts`). |
| `/preguntas-frecuentes/` | FAQ con acordeón y JSON-LD FAQPage. |
| `/garantia/`, `/envios-y-devoluciones/`, `/terminos/`, `/privacidad/` | Páginas de ayuda y legales. |
| `/mi-orden/` | Seguimiento de compra con número de orden + email. |
| `/admin/` | Login con contraseña. Resumen, reservas (cambio de estado, link a WhatsApp del cliente), órdenes, mensajes, CRUD de servicios y productos. |
| SEO | `sitemap.xml` dinámico, `robots.txt`, metadatos por página, JSON-LD LocalBusiness y Product. |

## Pagos

La preparación actual de tienda, recomendados y credenciales está documentada en [docs/activacion-tienda.md](docs/activacion-tienda.md). Pruebas de tienda: `npm run test:shop`.

**Webpay Plus** (`transbank-sdk`): `startCheckout` crea la orden `pendiente` → `create()` → POST de `token_ws` a Webpay →
`/api/webpay/retorno/` hace `commit()` **una sola vez por token** (reclamo atómico en BD), valida monto y orden, y
marca `pagada` (descuenta stock y envía emails) o `rechazada`. `TBK_TOKEN` = anulado por el usuario; solo
`TBK_ORDEN_COMPRA` = timeout.

Prueba en integración: tarjeta VISA `4051 8856 0044 6623`, CVV `123`, fecha futura; en el simulador RUT `11.111.111-1`, clave `123`.
Producción: `TBK_ENV=production` + código de comercio y API key propios.

**Mercado Pago**: preferencia con `external_reference` = código de orden. El webhook `/api/mercadopago/webhook/`
(firma verificada si hay `MP_WEBHOOK_SECRET`) consulta el pago en la API antes de marcar la orden. La página de
gracias también verifica `payment_id` por si el cliente vuelve antes que el webhook. `auto_return` y
`notification_url` solo se envían con `NEXT_PUBLIC_SITE_URL` en https (usa un túnel tipo ngrok para probar local).

## Estructura

```
src/
  app/
    (site)/            # Sitio público (header, footer, carrito)
    admin/             # login + (panel)
    api/               # webpay/retorno, mercadopago/webhook
    globals.css        # CSS original portado 1:1 (tokens --tp-*)
    ui.css             # Componentes nuevos con los mismos tokens
  actions/             # Server actions: booking, contact, checkout, admin
  components/          # Header, Footer, cart/, shop/, forms/, admin/
  db/                  # schema.ts (Drizzle), index.ts, seed.ts
  data/                # site.ts (WhatsApp, zonas), shop.ts (despacho), respaldo de servicios
  lib/                 # queries, orders, payments/, auth, email, validation (zod), format
drizzle/               # migraciones SQL
```

Scripts: `db:generate` (tras cambiar el schema), `db:migrate`, `db:seed`, `db:studio`, `typecheck`.

## Notas

- El botón naranjo usa texto blanco como en el original; para mejor contraste cambia `color` en `.tp-btn-primary` a `#111`.
- Solo 3 servicios tienen precio real publicado; el resto queda "A cotizar" hasta cargar precios en `/admin/servicios`.
- Costos de despacho, horario y dirección están **por confirmar** (`.env.local` y `src/app/(site)/contacto/page.tsx`).
- Las imágenes de productos se cargan por URL. Para subir archivos, integrar Vercel Blob en `ProductForm`.
