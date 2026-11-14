/**
 * Contenido inicial del sitio.
 * ⚠️ CONTENIDO DUMMY: salvo los 3 servicios publicados en tropicleta.com (Mantención completa $50.000,
 * Limpieza de transmisión + encerado SILCA $30.000, Tubeless completo $20.000), precios, descripciones, productos,
 * reservas, órdenes y mensajes son de ejemplo. Reemplázalos desde /admin antes de publicar.
 */
import { sql } from "drizzle-orm";
import type { DB } from "./client";
import * as schema from "./schema";
import { shippingCost } from "../data/shop";

/* =============================== SERVICIOS =============================== */

export const seedServiceCategories = [
  { slug: "mantenciones", name: "Mantenciones", description: "Revisión y puesta a punto general de tu bicicleta, desde lo básico hasta el desarme completo." },
  { slug: "suspensiones", name: "Suspensiones", description: "Servicio a horquillas y amortiguadores de aire y resorte para que tu bici absorba como el primer día." },
  { slug: "transmision", name: "Transmisión", description: "Cadena, cassette, platos y cambios funcionando finos, sin saltos ni ruidos." },
  { slug: "frenos", name: "Frenos", description: "Frenos mecánicos e hidráulicos: ajuste, purga, pastillas y discos." },
  { slug: "ruedas", name: "Ruedas", description: "Tubeless, centrado, pinchazos y armado de ruedas." },
  { slug: "ejes", name: "Ejes y rodamientos", description: "Centro, dirección y bujes girando suaves y sin juego." },
  { slug: "scooters", name: "Scooters eléctricos", description: "Diagnóstico y mantención de scooters eléctricos: frenos, neumáticos y ajustes." },
  { slug: "retiro-entrega", name: "Retiro y entrega", description: "Retiramos y entregamos tu bici en sectores definidos de Tierra Amarilla, Paipote y Copiapó." },
];

type SeedService = {
  cat: string;
  slug: string;
  name: string;
  price: number | null;
  priceFrom?: boolean;
  featured?: boolean;
  duration?: string;
  summary: string;
  description?: string;
  includes?: string[];
};

export const seedServices: SeedService[] = [
  // ---------- Mantenciones ----------
  {
    cat: "mantenciones",
    slug: "mantencion-completa",
    name: "Mantención completa",
    price: 50000,
    featured: true,
    duration: "48 horas",
    summary: "Puesta a punto integral: desarmamos, limpiamos, lubricamos y ajustamos toda la bicicleta.",
    description:
      "La mantención más completa del taller. Desarmamos los componentes principales, limpiamos a fondo cuadro y transmisión, revisamos desgaste y dejamos todo regulado con el torque correcto.\n\nIdeal una o dos veces al año, o antes de una temporada de rutas y competencias.",
    includes: [
      "Desarme, limpieza y lubricación de transmisión",
      "Ajuste de cambios y frenos",
      "Revisión y engrase de dirección y centro",
      "Centrado ligero de ruedas",
      "Revisión de desgaste de cadena, pastillas y neumáticos",
      "Apriete con torque y prueba de rodado",
    ],
  },
  {
    cat: "mantenciones",
    slug: "mantencion-basica",
    name: "Mantención básica",
    price: 25000,
    duration: "24 horas",
    summary: "Ajuste general, lubricación y revisión de seguridad para el uso diario.",
    includes: ["Limpieza exterior y de cadena", "Lubricación", "Ajuste de cambios y frenos", "Calibración de neumáticos", "Revisión de seguridad"],
  },
  {
    cat: "mantenciones",
    slug: "mantencion-ebike",
    name: "Mantención bicicleta eléctrica",
    price: 60000,
    priceFrom: true,
    duration: "48 a 72 horas",
    summary: "Mantención completa adaptada a e-bikes, con revisión de conexiones y sistema eléctrico.",
    includes: ["Todo lo de la mantención completa", "Revisión de conexiones y cableado", "Chequeo de batería y cargador", "Diagnóstico con app del fabricante (si aplica)"],
  },
  {
    cat: "mantenciones",
    slug: "revision-pre-competencia",
    name: "Revisión pre-competencia",
    price: 18000,
    duration: "Mismo día",
    summary: "Chequeo rápido y ajuste fino antes de una carrera o ruta larga.",
    includes: ["Ajuste fino de cambios", "Revisión de frenos", "Presión y sellante", "Apriete de componentes críticos"],
  },
  {
    cat: "mantenciones",
    slug: "armado-bicicleta-nueva",
    name: "Armado de bicicleta nueva",
    price: 30000,
    duration: "24 horas",
    summary: "Armamos tu bici comprada en caja y la dejamos regulada y lista para rodar.",
  },

  // ---------- Suspensiones ----------
  {
    cat: "suspensiones",
    slug: "servicio-basico-horquilla",
    name: "Servicio básico de horquilla",
    price: 30000,
    duration: "48 horas",
    summary: "Servicio de lowers (cada 50 horas): limpieza, retenes y aceite de lubricación.",
    includes: ["Desarme de barras inferiores", "Limpieza de retenes y guardapolvos", "Cambio de aceite de lubricación", "Revisión de barras"],
  },
  {
    cat: "suspensiones",
    slug: "servicio-completo-horquilla",
    name: "Servicio completo de horquilla",
    price: 65000,
    priceFrom: true,
    duration: "3 a 5 días",
    summary: "Servicio de amortiguación (cada 200 horas) con cambio de sellos y aceite del cartucho.",
    description: "El precio varía según marca y modelo. Los kits de sellos se cotizan aparte.",
  },
  {
    cat: "suspensiones",
    slug: "servicio-amortiguador",
    name: "Servicio de amortiguador",
    price: 45000,
    priceFrom: true,
    duration: "3 a 5 días",
    summary: "Servicio de cámara de aire y sellos para amortiguadores traseros.",
  },
  {
    cat: "suspensiones",
    slug: "configuracion-sag",
    name: "Configuración de sag y rebote",
    price: 10000,
    duration: "30 minutos",
    summary: "Ajustamos presión, sag y rebote según tu peso y estilo de manejo.",
  },

  // ---------- Transmisión ----------
  {
    cat: "transmision",
    slug: "limpieza-ultrasonica-encerado",
    name: "Limpieza de transmisión + encerado SILCA",
    price: 30000,
    featured: true,
    duration: "48 horas",
    summary: "Limpieza de piñón, coronas y roldanas; ultrasonido en cadena y encerado en caliente con SILCA Secret Chain Blend.",
    description: "Limpieza de piñón, coronas y roldanas; ultrasonido en cadena y encerado en caliente con SILCA Secret Chain Blend. Incluye retiro y montaje de la cadena. Usamos la cera sin aditivos EnduranceChip ni SpeedChip.",
    includes: ["Limpieza de piñón, coronas y roldanas","Limpieza ultrasónica de cadena","Encerado por inmersión con SILCA Secret Chain Blend","Retiro y montaje de cadena"],
  },
  { cat: "transmision", slug: "limpieza-reencerado-cadena", name: "Limpieza y reencerado de cadena SILCA", price: 15000, summary: "Retiro, limpieza, encerado SILCA y montaje de cadena previamente encerada, sin aceite añadido.", description: "Servicio para cadenas previamente enceradas que no hayan recibido aceite. No incluye limpieza de piñón, coronas ni roldanas. Si requiere desengrase profundo por aceite añadido, se cotiza aparte.", includes: ["Retiro de cadena", "Limpieza de cadena previamente encerada", "Encerado por inmersión con SILCA Secret Chain Blend", "Montaje de cadena"] },
  { cat: "transmision", slug: "ajuste-de-cambios", name: "Ajuste de cambios", price: 8000, duration: "Mismo día", summary: "Regulación de desviadores, tope y tensión de cable." },
  { cat: "transmision", slug: "cambio-de-cadena", name: "Cambio de cadena", price: 6000, duration: "Mismo día", summary: "Instalación de cadena nueva (repuesto aparte) con largo y cierre correctos." },
  {
    cat: "transmision",
    slug: "cambio-transmision-completa",
    name: "Cambio de transmisión completa",
    price: 20000,
    duration: "24 horas",
    summary: "Instalación de cadena, cassette, platos y desviadores nuevos (repuestos aparte).",
  },

  // ---------- Frenos ----------
  {
    cat: "frenos",
    slug: "purga-frenos-hidraulicos",
    name: "Purga de frenos hidráulicos",
    price: 15000,
    duration: "24 horas",
    summary: "Purga completa por freno con aceite mineral o DOT según el sistema.",
    includes: ["Cambio de líquido", "Eliminación de aire", "Centrado de caliper", "Prueba de frenado"],
  },
  { cat: "frenos", slug: "cambio-de-pastillas", name: "Cambio de pastillas", price: 6000, duration: "Mismo día", summary: "Instalación de pastillas nuevas y asentamiento (repuesto aparte)." },
  { cat: "frenos", slug: "ajuste-frenos-mecanicos", name: "Ajuste de frenos mecánicos", price: 7000, duration: "Mismo día", summary: "Regulación de V-brake o disco mecánico, cable y manillas." },
  { cat: "frenos", slug: "cambio-de-disco", name: "Cambio o rectificado de disco", price: 8000, duration: "Mismo día", summary: "Cambio de rotor o corrección de discos doblados." },

  // ---------- Ruedas ----------
  {
    cat: "ruedas",
    slug: "tubeless-completo",
    name: "Tubeless completo",
    price: 20000,
    featured: true,
    duration: "24 horas",
    summary: "Conversión o mantención tubeless de la rueda: cinta, válvula y sellante.",
    includes: ["Limpieza de llanta", "Cinta tubeless", "Válvula tubeless", "Sellante", "Asentamiento y prueba de fugas"],
  },
  { cat: "ruedas", slug: "centrado-de-rueda", name: "Centrado de rueda", price: 8000, duration: "Mismo día", summary: "Centrado lateral y radial con tensión pareja de rayos." },
  { cat: "ruedas", slug: "reparacion-de-pinchazo", name: "Reparación de pinchazo", price: 5000, duration: "Mismo día", summary: "Parche o cambio de cámara (repuesto aparte)." },
  { cat: "ruedas", slug: "cambio-de-neumatico", name: "Cambio de neumático", price: 4000, duration: "Mismo día", summary: "Desmontaje e instalación de neumático nuevo." },
  { cat: "ruedas", slug: "armado-de-rueda", name: "Armado de rueda", price: 35000, priceFrom: true, duration: "3 a 5 días", summary: "Armado de rueda nueva: buje, rayos y llanta a elección." },

  // ---------- Ejes ----------
  { cat: "ejes", slug: "mantencion-de-centro", name: "Mantención de centro (pedalier)", price: 15000, duration: "24 horas", summary: "Limpieza y engrase o cambio de rodamientos de centro." },
  { cat: "ejes", slug: "mantencion-de-direccion", name: "Mantención de dirección", price: 12000, duration: "24 horas", summary: "Limpieza, engrase y ajuste de la caja de dirección." },
  { cat: "ejes", slug: "mantencion-de-bujes", name: "Mantención de bujes", price: 18000, duration: "48 horas", summary: "Servicio de rodamientos y trinquete de bujes delantero y trasero." },

  // ---------- Scooters ----------
  {
    cat: "scooters",
    slug: "mantencion-scooter",
    name: "Mantención general de scooter",
    price: 30000,
    duration: "48 horas",
    summary: "Revisión y ajuste completo de tu scooter eléctrico.",
    includes: ["Diagnóstico eléctrico básico", "Ajuste de frenos", "Revisión de neumáticos", "Apriete de plegado y dirección", "Limpieza"],
  },
  { cat: "scooters", slug: "pinchazo-scooter", name: "Reparación de pinchazo de scooter", price: 12000, duration: "24 horas", summary: "Cambio de cámara o reparación en ruedas de 8,5\" y 10\"." },
  { cat: "scooters", slug: "frenos-scooter", name: "Frenos de scooter", price: 10000, duration: "Mismo día", summary: "Ajuste o cambio de pastillas y regulación de freno." },

  // ---------- Retiro y entrega ----------
  {
    cat: "retiro-entrega",
    slug: "retiro-y-entrega",
    name: "Retiro y entrega a domicilio",
    price: 3000,
    priceFrom: true,
    duration: "Según agenda",
    summary: "Vamos por tu bici y te la devolvemos lista. Tierra Amarilla, Paipote y Copiapó.",
    includes: ["Tierra Amarilla: $3.000", "Paipote: $4.000", "Copiapó (sectores definidos): $5.000"],
  },
];

/* =============================== TIENDA =============================== */

export const seedProductCategories = [
  { slug: "repuestos", name: "Repuestos" },
  { slug: "mantencion", name: "Mantención" },
  { slug: "accesorios", name: "Accesorios" },
];

type SeedProduct = {
  cat: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  description: string;
};

export const seedProducts: SeedProduct[] = [
  { cat: "repuestos", slug: "camara-29-valvula-presta", name: "Cámara 29\" válvula presta", price: 6990, stock: 14, featured: true, description: "Cámara de butilo para aro 29 x 1.9–2.4\". Válvula presta de 48 mm." },
  { cat: "repuestos", slug: "camara-27-5-valvula-schrader", name: "Cámara 27.5\" válvula schrader", price: 6490, stock: 9, description: "Cámara de butilo para aro 27.5 x 1.9–2.35\". Válvula de auto." },
  { cat: "repuestos", slug: "neumatico-mtb-29-2-25", name: "Neumático MTB 29 x 2.25", price: 24990, stock: 6, description: "Neumático plegable, compuesto de doble dureza, apto tubeless. Taco versátil para cerro y ripio." },
  { cat: "repuestos", slug: "pastillas-freno-organicas", name: "Pastillas de freno orgánicas", price: 8990, compareAtPrice: 10990, stock: 20, featured: true, description: "Par de pastillas orgánicas, frenado suave y silencioso. Compatibles con los modelos más comunes (consúltanos)." },
  { cat: "repuestos", slug: "cadena-11v", name: "Cadena 11 velocidades", price: 19990, stock: 5, description: "Cadena de 116 eslabones con cierre rápido incluido." },
  { cat: "repuestos", slug: "kit-cable-funda-cambio", name: "Kit cable y funda de cambio", price: 5990, stock: 0, description: "Cable de acero inoxidable y 3 m de funda con terminales." },
  { cat: "mantencion", slug: "lubricante-cadena-seco", name: "Lubricante de cadena seco 120 ml", price: 7990, stock: 18, featured: true, description: "Lubricante de cera para condiciones secas y polvo: ideal para el norte." },
  { cat: "mantencion", slug: "sellante-tubeless-500", name: "Sellante tubeless 500 ml", price: 14990, stock: 8, description: "Sellante de látex con microfibras. Sella pinchazos de hasta 6 mm." },
  { cat: "mantencion", slug: "desengrasante-biodegradable", name: "Desengrasante biodegradable 1 L", price: 9990, stock: 10, description: "Desengrasante concentrado base agua para transmisión y cuadro." },
  { cat: "mantencion", slug: "kit-de-parches", name: "Kit de parches", price: 3490, stock: 30, description: "6 parches, lija y pegamento. Cabe en cualquier bolso." },
  { cat: "accesorios", slug: "luz-trasera-usb", name: "Luz trasera USB", price: 12990, stock: 11, featured: true, description: "Luz roja recargable por USB-C, 5 modos, hasta 10 horas de autonomía." },
  { cat: "accesorios", slug: "luz-delantera-800", name: "Luz delantera 800 lúmenes", price: 29990, compareAtPrice: 34990, stock: 4, description: "Foco LED recargable de 800 lm, carcasa de aluminio y soporte de liberación rápida." },
  { cat: "accesorios", slug: "caramagiola-aluminio", name: "Caramagiola de aluminio", price: 5990, stock: 16, description: "Portabotella liviano de aluminio. Incluye pernos." },
  { cat: "accesorios", slug: "bombin-con-manometro", name: "Bombín de mano con manómetro", price: 17990, stock: 7, description: "Bombín compacto para presta y schrader, con manómetro hasta 100 psi." },
  { cat: "accesorios", slug: "multiherramienta-16", name: "Multiherramienta 16 funciones", price: 14990, stock: 9, description: "Llaves allen, torx, destornilladores y tronchacadenas en una herramienta de bolsillo." },
  { cat: "accesorios", slug: "guantes-ciclismo", name: "Guantes de ciclismo", price: 11990, stock: 12, description: "Guantes de dedo completo con palma acolchada y punta táctil." },
];

/* =============================== DEMO (panel) =============================== */

const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const demoBookings = [
  { code: "TP-DEMO01", name: "Camila Rojas", phone: "56900000001", email: "camila@example.com", vehicleType: "bicicleta", vehicleDetails: "MTB aro 29", serviceNames: ["Mantención completa"], preferredDate: daysFromNow(2), timeSlot: "manana", pickup: false, status: "nueva" as const },
  { code: "TP-DEMO02", name: "Diego Muñoz", phone: "56900000002", email: null, vehicleType: "bicicleta", vehicleDetails: "Ruta carbono", serviceNames: ["Limpieza ultrasónica + encerado", "Ajuste de cambios"], preferredDate: daysFromNow(3), timeSlot: "tarde", pickup: true, pickupCommune: "Copiapó", pickupAddress: "Av. Ejemplo 1234", status: "confirmada" as const },
  { code: "TP-DEMO03", name: "Valentina Soto", phone: "56900000003", email: "vale@example.com", vehicleType: "scooter", vehicleDetails: "Scooter 10\"", serviceNames: ["Reparación de pinchazo de scooter"], preferredDate: daysFromNow(1), timeSlot: "manana", pickup: false, status: "en_taller" as const },
  { code: "TP-DEMO04", name: "Matías Pérez", phone: "56900000004", email: null, vehicleType: "bicicleta", vehicleDetails: "E-bike urbana", serviceNames: ["Purga de frenos hidráulicos"], preferredDate: daysFromNow(-2), timeSlot: "tarde", pickup: true, pickupCommune: "Paipote", pickupAddress: "Pasaje Demo 45", status: "lista" as const },
];

const demoOrders = [
  { code: "TPC-DEMO000001", status: "pagada" as const, customerName: "Ignacio Vega", customerEmail: "ignacio@example.com", customerPhone: "56900000005", deliveryMethod: "retiro", items: [["camara-29-valvula-presta", 2], ["kit-de-parches", 1]] as const },
  { code: "TPC-DEMO000002", status: "lista" as const, customerName: "Fernanda Castro", customerEmail: "fernanda@example.com", customerPhone: "56900000006", deliveryMethod: "despacho", commune: "Copiapó", address: "Calle Demo 321", items: [["luz-delantera-800", 1], ["luz-trasera-usb", 1]] as const },
  { code: "TPC-DEMO000003", status: "entregada" as const, customerName: "Tomás Díaz", customerEmail: "tomas@example.com", customerPhone: "56900000007", deliveryMethod: "retiro", items: [["sellante-tubeless-500", 1]] as const },
];

const demoMessages = [
  { name: "Javiera Lagos", subject: "contacto", email: "javiera@example.com", phone: null, message: "Hola, ¿hacen mantención a bicicletas de niño? Es aro 20." },
  { name: "Club Ciclista Demo", subject: "eventos", email: "club@example.com", phone: "56900000008", message: "Queremos cotizar el taller móvil para una cicletada familiar de 150 personas en Copiapó, un domingo en la mañana." },
];

/* =============================== SEED =============================== */

export async function seedDatabase(db: DB, opts: { demo?: boolean } = {}) {
  const log = (m: string) => console.info(`[seed] ${m}`);

  log("categorías de servicio");
  for (const [i, c] of seedServiceCategories.entries()) {
    await db
      .insert(schema.serviceCategories)
      .values({ ...c, sort: i })
      .onConflictDoUpdate({ target: schema.serviceCategories.slug, set: { name: c.name, description: c.description, sort: i } });
  }
  const cats = await db.select().from(schema.serviceCategories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  log(`${seedServices.length} servicios`);
  for (const [i, s] of seedServices.entries()) {
    const values = {
      slug: s.slug,
      name: s.name,
      categoryId: catId(s.cat),
      price: s.price,
      priceFrom: s.priceFrom ?? false,
      featured: s.featured ?? false,
      duration: s.duration ?? null,
      summary: s.summary,
      description: s.description ?? null,
      includes: s.includes ?? [],
      sort: i,
    };
    const { slug: _slug, ...update } = values;
    await db.insert(schema.services).values(values).onConflictDoUpdate({ target: schema.services.slug, set: update });
  }

  log("categorías de productos");
  for (const [i, c] of seedProductCategories.entries()) {
    await db
      .insert(schema.productCategories)
      .values({ ...c, sort: i })
      .onConflictDoUpdate({ target: schema.productCategories.slug, set: { name: c.name, sort: i } });
  }
  const pcats = await db.select().from(schema.productCategories);

  log(`${seedProducts.length} productos`);
  for (const [i, p] of seedProducts.entries()) {
    const values = {
      slug: p.slug,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      featured: p.featured ?? false,
      description: p.description,
      images: [`/productos/${p.slug}.svg`],
      categoryId: pcats.find((c) => c.slug === p.cat)!.id,
      // orden estable en "Más recientes"
      createdAt: new Date(Date.UTC(2026, 8, 1) + (seedProducts.length - i) * 60000),
    };
    const { slug: _slug, ...update } = values;
    await db.insert(schema.products).values(values).onConflictDoUpdate({ target: schema.products.slug, set: update });
  }

  if (!opts.demo) return;

  log("reservas, órdenes y mensajes demo");
  for (const b of demoBookings) {
    await db.insert(schema.bookings).values(b).onConflictDoNothing({ target: schema.bookings.code });
  }

  const prods = await db.select().from(schema.products);
  for (const o of demoOrders) {
    const lines = o.items.map(([slug, qty]) => ({ p: prods.find((x) => x.slug === slug)!, qty }));
    const subtotal = lines.reduce((n, l) => n + l.p.price * l.qty, 0);
    const shipping = shippingCost(o.deliveryMethod as "retiro" | "despacho", "commune" in o ? o.commune : null);
    const [order] = await db
      .insert(schema.orders)
      .values({
        code: o.code,
        status: o.status,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        customerPhone: o.customerPhone,
        deliveryMethod: o.deliveryMethod,
        commune: "commune" in o ? o.commune : null,
        address: "address" in o ? o.address : null,
        subtotal,
        shipping,
        total: subtotal + shipping,
        paymentMethod: "webpay",
        authorizationCode: "DEMO",
        paidAt: new Date(),
      })
      .onConflictDoNothing({ target: schema.orders.code })
      .returning();
    if (order) {
      await db.insert(schema.orderItems).values(
        lines.map((l) => ({ orderId: order.id, productId: l.p.id, name: l.p.name, unitPrice: l.p.price, quantity: l.qty })),
      );
    }
  }

  const [{ n }] = (await db.execute<{ n: number }>(sql`select count(*)::int as n from contact_messages`)).rows;
  if (n === 0) await db.insert(schema.contactMessages).values(demoMessages);
}
