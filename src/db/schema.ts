import {
  boolean,
  check,
  uniqueIndex,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const cashEntries = pgTable("cash_entries", {
  id: serial("id").primaryKey(),
  requestId: varchar("request_id", { length: 36 }).notNull(),
  date: date("date").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  area: varchar("area", { length: 16 }).$type<"productos" | "servicios" | "general">().notNull().default("general"),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  method: varchar("method", { length: 30 }).notNull(),
  reference: varchar("reference", { length: 120 }).notNull().default(""),
  bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  voidReason: text("void_reason"),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("cash_request_unique").on(t.requestId), check("cash_positive", sql`${t.amount} > 0`), check("cash_type", sql`${t.type} in ('ingreso', 'gasto')`), check("cash_area",sql`${t.area} in ('productos', 'servicios', 'general')`)]);

/* ============================ SERVICIOS ============================ */

export const quoteVehicles = pgTable("quote_vehicles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 60 }).notNull(),
  removed: boolean("removed").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(), // coincide con las anclas /servicios/#slug
  name: text("name").notNull(),
  description: text("description"),
  sort: integer("sort").notNull().default(0),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  summary: text("summary"),
  description: text("description"),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  price: integer("price"), // CLP entero; null = "a cotizar"
  priceFrom: boolean("price_from").notNull().default(false), // muestra "desde"
  duration: text("duration"),
  kind: varchar("kind", { length: 16 }).notNull().default("individual"),
  components: jsonb("components").$type<import("../lib/package-quote").Component[]>().notNull().default([]),
  vehicles: jsonb("vehicles").$type<import("../lib/package-quote").Vehicle[]>().notNull().default(["bicicleta", "electrica"]),
  individuallySelectable: boolean("individually_selectable").notNull().default(true),
  requiresDoubleSuspension: boolean("requires_double_suspension").notNull().default(false),
  excludesDoubleSuspension: boolean("excludes_double_suspension").notNull().default(false),
  removed: boolean("removed").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
}, (t) => [check("service_kind_valid", sql`${t.kind} in ('individual', 'package')`)]);

/* ============================ TIENDA ============================ */

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  reason: text("reason").notNull(),
  url: text("url").notNull(),
  imageUrl: text("image_url"),
  price: integer("price"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  name: text("name").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  categoryId: integer("category_id").references(() => productCategories.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  removed: boolean("removed").notNull().default(false),
  stock: integer("stock").notNull().default(0),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================ RESERVAS ============================ */

export const bookingStatus = pgEnum("booking_status", [
  "nueva",
  "confirmada",
  "en_taller",
  "lista",
  "entregada",
  "cancelada",
]);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: text("name").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: text("email"),
  vehicleType: varchar("vehicle_type", { length: 20 }).notNull(), // bicicleta | scooter
  vehicleDetails: text("vehicle_details"),
  serviceNames: jsonb("service_names").$type<string[]>().notNull().default([]),
  preferredDate: date("preferred_date").notNull(),
  timeSlot: varchar("time_slot", { length: 20 }).notNull(), // manana | tarde
  pickup: boolean("pickup").notNull().default(false),
  pickupCommune: text("pickup_commune"),
  pickupAddress: text("pickup_address"),
  quoteSnapshot: jsonb("quote_snapshot").$type<Record<string, unknown>>(),
  notes: text("notes"),
  status: bookingStatus("status").notNull().default("nueva"),
  internalNotes: text("internal_notes"), // solo visible en el panel
  quotedPrice: integer("quoted_price"), // presupuesto o precio final acordado (CLP)
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================ ÓRDENES ============================ */

export const orderStatus = pgEnum("order_status", [
  "pendiente",
  "pagada",
  "rechazada",
  "anulada",
  "lista",
  "entregada",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 26 }).notNull().unique(), // buyOrder Webpay (máx 26)
  status: orderStatus("status").notNull().default("pendiente"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  deliveryMethod: varchar("delivery_method", { length: 20 }).notNull(), // retiro | despacho
  commune: text("commune"),
  address: text("address"),
  notes: text("notes"),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  total: integer("total").notNull(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // webpay | mercadopago
  paymentToken: text("payment_token"),
  paymentId: text("payment_id"),
  authorizationCode: text("authorization_code"),
  paymentDetails: jsonb("payment_details"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

/* ============================ CONTACTO ============================ */

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: varchar("subject", { length: 40 }).notNull().default("contacto"), // contacto | eventos
  phone: varchar("phone", { length: 20 }),
  email: text("email"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================ PANEL ============================ */

/** Intentos fallidos de ingreso al panel por IP (compartido entre instancias). */
export const loginAttempts = pgTable("login_attempts", {
  key: varchar("key", { length: 80 }).primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

/** Historial de cambios hechos desde el panel. */
export const adminAudit = pgTable("admin_audit", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 60 }).notNull(),
  entity: varchar("entity", { length: 40 }).notNull(),
  entityId: varchar("entity_id", { length: 40 }),
  summary: text("summary").notNull(),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Service = typeof services.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductCategory = typeof productCategories.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type BookingStatus = (typeof bookingStatus.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
