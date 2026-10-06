"use server";
import { validateHierarchy } from "@/lib/package-quote";

import { and, count, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { renameServiceReferences } from "@/lib/service-edit";
import { serviceDeletionBlocker } from "@/lib/service-trash";
import { redirect } from "next/navigation";
import { revalidatePublicData } from "@/lib/revalidate";
import { z } from "zod";
import { db, schema } from "@/db";
import { localDate, methods } from "@/lib/accounting-validation";
import { audit } from "@/lib/audit";
import { adminConfigurationError, checkPassword, clientIp, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { isForeignKeyViolation, isUniqueViolation } from "@/lib/db-errors";
import { emailLayout, escapeHtml, sendEmail } from "@/lib/email";
import { formatCLP, slugify } from "@/lib/format";
import { formToObject, zodErrors, type FormState } from "@/lib/forms";
import { clearLoginFailures, claimLoginAttempt } from "@/lib/login-limit";
import { bookingStatusMessage, canTransitionOrder, orderStatusMessage } from "@/lib/order-status";
import { uploadImage, validateImages } from "@/lib/upload";
import { cookies } from "next/headers";
import { adminAuthFingerprint, signLoginCode } from "@/lib/auth";
import { issueLoginChallenge, removeLoginChallenge, LOGIN_CODE_SECONDS } from "@/lib/admin-login-challenge";

/** Límites de destacados: los que caben en la home. */
const MAX_FEATURED_SERVICES = 3;
const MAX_FEATURED_PRODUCTS = 4;

const idSchema = z.coerce.number().int().positive();

function parseId(fd: FormData, key = "id") {
  const r = idSchema.safeParse(fd.get(key));
  if (!r.success) throw new Error("ID inválido");
  return r.data;
}

async function notify(to: string | null | undefined, subject: string, text: string | null) {
  if (!to || !text) return;
  await sendEmail(to, subject, emailLayout(subject, `<p>${escapeHtml(text)}</p>`));
}

/* ---------------------------- Sesión ---------------------------- */

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (!password || password.length > 256) return { message: "Ingresa una contraseña válida." };
  const configurationError = adminConfigurationError();
  if (configurationError) return { message: "El acceso al panel no está disponible. Contacta al administrador." };
  try {
  // Freno a fuerza bruta por IP, guardado en la BD para que valga entre instancias
  const ip = await clientIp();
  if (!(await claimLoginAttempt(ip))) return { message: "Demasiados intentos. Espera 15 minutos." };

  if (!checkPassword(password)) {
    return { message: "Contraseña incorrecta" };
  }
  if (process.env.ADMIN_LOGIN_EMAIL) {
    if (!process.env.RESEND_API_KEY) return { message: "El envío de códigos no está disponible. Contacta al administrador." };
    if (!(await claimLoginAttempt("admin-email-codes"))) return { message: "Se alcanzó el límite de envío de códigos. Espera 15 minutos." };
    const jar = await cookies(), cookieName = process.env.NODE_ENV === "production" ? "__Host-tp_login" : "tp_login";
    const previous = jar.get(cookieName)?.value;
    if (previous) await removeLoginChallenge(previous);
    jar.delete(cookieName);
    const challenge = await issueLoginChallenge(adminAuthFingerprint(), signLoginCode);
    const sent = await sendEmail(process.env.ADMIN_LOGIN_EMAIL, "Tu código de acceso a Tropicleta", emailLayout("Código de acceso", `<p>Tu código para ingresar al administrador es:</p><p style="font-size:32px;letter-spacing:6px;font-weight:bold">${challenge.code}</p><p>Caduca en 10 minutos. No compartas este código. Si no solicitaste el ingreso, puedes ignorar este mensaje.</p>`));
    if (!sent) { await removeLoginChallenge(challenge.token); return { message: "No pudimos enviar el código. Reintenta en unos minutos." }; }
    jar.set(cookieName, challenge.token, {httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"strict",path:"/",maxAge:LOGIN_CODE_SECONDS});
    return { message: "Código enviado al correo autorizado." };
  }
  // Solo el acceso sin segundo factor puede crear aquí una sesión.
  // Con correo configurado, la sesión la crea verifyLoginCode tras consumir el código.
  await clearLoginFailures(ip);
  await createSession();
  await audit("login", "sesion", null, "Ingreso al panel");
  } catch (error) {
    console.error("[admin-login]", error instanceof Error ? error.name : "UnknownError");
    return { message: "No pudimos verificar el acceso. Reintenta en unos minutos." };
  }
  redirect("/admin/");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login/");
}

/* ---------------------------- Reservas ---------------------------- */

export async function updateBookingStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseId(fd);
  const status = z.enum(schema.bookingStatus.enumValues).parse(fd.get("status"));
  const [b] = await db
    .update(schema.bookings)
    .set({ status })
    .where(and(eq(schema.bookings.id, id), ne(schema.bookings.status, status)))
    .returning();
  if (!b) return { ok: true, message: "Sin cambios" };
  await Promise.all([
    notify(b.email, `Solicitud ${b.code}`, bookingStatusMessage(status, b.code)),
    audit("estado", "reserva", b.id, `${b.code} → ${status}`),
  ]);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Guardado" };
}

const bookingDetailsSchema = z.object({
  internalNotes: z.string().trim().max(4000).optional(),
  quotedPrice: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(/\D/g, ""))))
    .pipe(z.number().int().min(0).max(100_000_000).nullable()),
});

export async function saveBookingDetails(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseId(fd);
  const values = formToObject(fd);
  const parsed = bookingDetailsSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const [b] = await db
    .update(schema.bookings)
    .set({ internalNotes: parsed.data.internalNotes || null, quotedPrice: parsed.data.quotedPrice })
    .where(eq(schema.bookings.id, id))
    .returning({ code: schema.bookings.code });
  if (!b) return { message: "La reserva no existe." };
  await audit("editar", "reserva", id, `${b.code}: notas/presupuesto`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Guardado" };
}

const bookingPaymentSchema = z.object({
  requestId: z.uuid(),
  date: z.iso.date().refine((v) => v <= localDate(), "La fecha no puede ser futura"),
  amount: z.coerce.number({ error: "Monto requerido" }).int().min(1, "Monto mayor a cero").max(2_000_000_000),
  method: z.enum(methods),
  reference: z.string().trim().max(120).default(""),
});

/** Registra el cobro de una reserva como ingreso en el libro de caja, enlazado a la reserva. */
export async function registerBookingPayment(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseId(fd);
  const values = formToObject(fd);
  const parsed = bookingPaymentSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const [b] = await db.select().from(schema.bookings).where(eq(schema.bookings.id, id)).limit(1);
  if (!b) return { message: "La reserva no existe." };
  const d = parsed.data;
  const inserted = await db
    .insert(schema.cashEntries)
    .values({
      requestId: d.requestId,
      date: d.date,
      type: "ingreso",
      category: "Taller",
      area: "servicios",
      description: `Reserva ${b.code} · ${b.name}`,
      amount: d.amount,
      method: d.method,
      reference: d.reference || b.code,
      bookingId: b.id,
    })
    .onConflictDoNothing({ target: schema.cashEntries.requestId })
    .returning({ id: schema.cashEntries.id });
  if (inserted.length) await audit("cobro", "reserva", b.id, `${b.code}: ${formatCLP(d.amount)} ${d.method}`);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Cobro registrado en contabilidad." };
}

/* ---------------------------- Órdenes ---------------------------- */

export async function updateOrderStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseId(fd);
  const status = z.enum(schema.orderStatus.enumValues).parse(fd.get("status"));
  const restock = fd.get("restock") === "on";

  const result = await db.transaction(async (tx) => {
    const [o] = await tx.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!o) return { error: "La orden no existe." };
    if (o.status === status) return { error: null, order: null };
    if (!canTransitionOrder(o.status, status)) return { error: "Ese cambio de estado no está permitido." };

    // El where con el estado leído evita pisar un cambio simultáneo
    const [updated] = await tx
      .update(schema.orders)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(schema.orders.id, id), eq(schema.orders.status, o.status)))
      .returning();
    if (!updated) return { error: "La orden cambió mientras tanto. Recarga la página." };

    if (status === "anulada" && restock) {
      const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id));
      for (const it of items) {
        if (!it.productId) continue;
        await tx
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} + ${it.quantity}` })
          .where(eq(schema.products.id, it.productId));
      }
    }
    return { error: null, order: updated, from: o.status };
  });

  if (result.error) return { message: result.error };
  if (!result.order) return { ok: true, message: "Sin cambios" };
  const o = result.order;
  await Promise.all([
    notify(o.customerEmail, `Pedido ${o.code}`, orderStatusMessage(status, o.code, o.deliveryMethod)),
    audit("estado", "orden", o.id, `${o.code}: ${result.from} → ${status}${status === "anulada" && restock ? " (stock repuesto)" : ""}`),
  ]);
  revalidatePublicData();
  return { ok: true, message: "Estado actualizado" };
}

/* ---------------------------- Mensajes ---------------------------- */

export async function toggleMessageRead(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  const read = fd.get("read") === "true";
  await db.update(schema.contactMessages).set({ read }).where(eq(schema.contactMessages.id, id));
  revalidatePath("/admin", "layout");
}

/* ---------------------------- Servicios ---------------------------- */

const money = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : Number(v.replace(/\D/g, ""))))
  .pipe(z.number().int().min(0).max(10_000_000).nullable());

const serviceSchema = z.object({
  hierarchy: z.string().transform((text, ctx) => { try { return JSON.parse(text); } catch { ctx.addIssue({ code: "custom", message: "Configuración de paquete inválida" }); return z.NEVER; } }).pipe(z.object({ kind: z.enum(["individual", "package"]), vehicles: z.array(z.string().min(1).max(20)).min(1), requiresDoubleSuspension: z.boolean().default(false), excludesDoubleSuspension: z.boolean().default(false), individuallySelectable: z.boolean(), components: z.array(z.object({ slug: z.string().min(1), required: z.boolean(), recommended: z.boolean().optional() })).max(43) })),
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(2, "Nombre requerido").max(120),
  slug: z.string().trim().max(120).optional(),
  categoryId: z.coerce.number({ error: "Elige una categoría" }).int().positive("Elige una categoría"),
  summary: z.string().trim().max(300).optional(),
  description: z.string().trim().max(4000).optional(),
  includes: z.string().optional(),
  price: money,
  priceFrom: z.string().optional(),
  duration: z.string().trim().max(60).optional(),
  featured: z.string().optional(),
  active: z.string().optional(),
  sort: z.coerce.number().int().default(0),
});

export async function saveService(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formToObject(fd);
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;
  const data = {
    name: d.name,
    slug: slugify(d.slug || d.name),
    categoryId: d.categoryId,
    summary: d.summary || null,
    description: d.description || null,
    includes: (d.includes ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    price: d.price,
    priceFrom: d.priceFrom === "on",
    duration: d.duration || null,
    featured: d.featured === "on",
    active: d.active === "on",
    sort: d.sort,
    ...d.hierarchy,
  };
  if (data.featured && data.active) {
    const s = schema.services;
    const [{ n }] = await db
      .select({ n: count() })
      .from(s)
      .where(and(eq(s.featured, true), eq(s.active, true), d.id ? ne(s.id, d.id) : undefined));
    if (n >= MAX_FEATURED_SERVICES)
      return { errors: { featured: `Ya hay ${MAX_FEATURED_SERVICES} servicios destacados. Quita uno antes.` }, message: `Ya hay ${MAX_FEATURED_SERVICES} servicios destacados. Quita uno antes.`, values };
  }
  try {
    await db.transaction(async tx => {
      const rows = await tx.select().from(schema.services).for("update");
      const current = rows.find(s => s.id === d.id);
      if (d.id && !current) throw Error("El servicio ya no existe.");
      if (current?.removed) throw Error("Recupera este servicio antes de editarlo.");

      const candidate = { ...current, ...data };
      const updatedRows=current?renameServiceReferences(rows,current.slug,data.slug):rows;
      const extras=candidate.components.filter(c=>c.recommended);
      if(extras.length>3)throw Error("Selecciona hasta tres extras recomendados.");
      for(const extra of extras){const target=updatedRows.find(s=>s.slug===extra.slug);if(!target||target.removed||!target.active||target.kind!=="individual"||!target.individuallySelectable||candidate.vehicles.some(v=>!target.vehicles.includes(v))||target.slug===candidate.slug)throw Error("Un extra recomendado no está disponible o no es compatible.");}
      validateHierarchy([...updatedRows.filter(s => s.id !== d.id), candidate]);
      if(current && current.slug!==data.slug){
        for(const parent of updatedRows.filter(s=>s.id!==d.id&&rows.find(old=>old.id===s.id)!.components.some(c=>c.slug===current.slug))){
          await tx.update(schema.services).set({components:parent.components}).where(eq(schema.services.id,parent.id));
        }
      }
      if (d.id) await tx.update(schema.services).set(data).where(eq(schema.services.id, d.id));
      else await tx.insert(schema.services).values(data);
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { errors: { slug: "Ya existe un servicio con ese slug" }, values };
    return { message: e instanceof Error ? e.message : "No se pudo guardar la configuración.", values };
  }
  await audit(d.id ? "editar" : "crear", "servicio", d.id ?? null, data.name);
  revalidatePublicData();
  revalidatePath("/admin/servicios", "layout");
  redirect("/admin/servicios/?guardado=1");
}

export async function hideService(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  // Se desactiva en vez de borrar para no romper enlaces ni historial
  let s;
  try {
    s = await db.transaction(async tx => {
      const rows = await tx.select().from(schema.services).for("update");
      validateHierarchy(rows.map(s=>s.id===id?{...s,active:false}:s));
      const [updated] = await tx.update(schema.services).set({active:false}).where(eq(schema.services.id,id)).returning();
      return updated;
    });
  } catch { redirect(`/admin/servicios/${id}/?dependencias=1`); }
  if (s) await audit("ocultar", "servicio", id, s.name);
  revalidatePublicData();
}

/* ---------------------------- Productos ---------------------------- */

const productSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(2, "Nombre requerido").max(140),
  slug: z.string().trim().max(140).optional(),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
  newCategory: z.string().trim().max(60).optional(),
  description: z.string().trim().max(4000).optional(),
  price: money,
  compareAtPrice: money,
  stock: z.coerce.number({ error: "Stock requerido" }).int().min(0, "No puede ser negativo"),
  images: z.string().optional(),
  featured: z.string().optional(),
  active: z.string().optional(),
});

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formToObject(fd);
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;
  if (d.active === "on" && (!d.price || d.price <= 0))
    return { errors: { price: "Confirma un precio mayor que cero antes de publicar" }, values };
  if (d.id) {
    const [current] = await db.select().from(schema.products).where(eq(schema.products.id,d.id)).limit(1);
    if (!current || current.removed) return { message:"Recupera este producto antes de editarlo.", values };
  }

  const files = fd.getAll("uploads").filter((f): f is File => f instanceof File && f.size > 0);
  const fileError = validateImages(files);
  if (fileError) return { errors: { images: fileError }, values };

  const featured = d.featured === "on";
  const active = d.active === "on";
  if (featured && active) {
    const p = schema.products;
    const [{ n }] = await db
      .select({ n: count() })
      .from(p)
      .where(and(eq(p.featured, true), eq(p.active, true), d.id ? ne(p.id, d.id) : undefined));
    if (n >= MAX_FEATURED_PRODUCTS)
      return { errors: { featured: `Ya hay ${MAX_FEATURED_PRODUCTS} productos destacados. Quita uno antes.` }, message: `Ya hay ${MAX_FEATURED_PRODUCTS} productos destacados. Quita uno antes.`, values };
  }

  let categoryId = d.categoryId;
  if (d.newCategory) {
    const [cat] = await db
      .insert(schema.productCategories)
      .values({ name: d.newCategory, slug: slugify(d.newCategory) })
      .onConflictDoUpdate({ target: schema.productCategories.slug, set: { name: d.newCategory } })
      .returning();
    categoryId = cat.id;
  }

  const slug = slugify(d.slug || d.name);
  const images = (d.images ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\/|^\//.test(s));
  try {
    for (const f of files) images.push(await uploadImage(f, slug));
  } catch (e) {
    console.error("[upload]", e);
    return { errors: { images: "No se pudo subir la imagen. Intenta nuevamente." }, values };
  }

  const data = {
    name: d.name,
    slug,
    categoryId,
    description: d.description || null,
    price: d.price ?? 0,
    compareAtPrice: d.compareAtPrice,
    stock: d.stock,
    images,
    featured,
    active,
  };
  try {
    if (d.id) await db.update(schema.products).set(data).where(eq(schema.products.id, d.id));
    else await db.insert(schema.products).values(data);
  } catch (e) {
    // Las imágenes ya subidas se conservan en el formulario para no perderlas
    if (isUniqueViolation(e)) return { errors: { slug: "Ya existe un producto con ese slug" }, values: { ...values, images: images.join("\n") } };
    throw e;
  }
  await audit(d.id ? "editar" : "crear", "producto", d.id ?? null, `${data.name} · stock ${data.stock} · ${formatCLP(data.price)}`);
  revalidatePublicData();
  redirect("/admin/productos/");
}

export async function archiveProduct(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  const [p] = await db.update(schema.products).set({ active: false }).where(eq(schema.products.id, id)).returning();
  if (p) await audit("archivar", "producto", id, p.name);
  revalidatePublicData();
}

/** Baja recuperable: conserva referencias, stock e historial. */
export async function removeProduct(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  const [p] = await db.update(schema.products).set({ active:false, featured:false, removed:true }).where(eq(schema.products.id,id)).returning();
  if (p) await audit("quitar", "producto", id, p.name);
  revalidatePublicData();
}

export async function restoreProduct(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  const [p] = await db.update(schema.products).set({ removed:false, active:false }).where(eq(schema.products.id,id)).returning();
  if (p) await audit("recuperar", "producto", id, p.name);
  revalidatePublicData();
}

export async function deleteProductPermanently(fd: FormData) {
  await requireAdmin();
  const id=parseId(fd);
  const result=await db.transaction(async tx=>{
    const [product]=await tx.select().from(schema.products).where(eq(schema.products.id,id)).for("update");
    if (!product) return null;
    const [used]=await tx.select({id:schema.orderItems.id}).from(schema.orderItems).where(eq(schema.orderItems.productId,id)).limit(1);
    if (!product.removed || used) return {blocked:true,name:product.name};
    await tx.delete(schema.products).where(and(eq(schema.products.id,id),eq(schema.products.removed,true)));
    return {blocked:false,name:product.name};
  });
  if (result?.blocked) redirect("/admin/productos/papelera/?bloqueado=1");
  if (result) await audit("eliminar definitivamente","producto",id,result.name);
  revalidatePublicData();
  revalidatePath("/admin/productos","layout");
  redirect("/admin/productos/papelera/?eliminado=1");
}

export async function removeService(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  const result = await db.transaction(async tx => {
    const rows = await tx.select().from(schema.services).for("update");
    const s = rows.find(s => s.id === id);
    if (!s) return null;
    const parents = rows.filter(p => !p.removed && p.id !== id && p.components.some(c => !c.recommended && c.slug === s.slug));
    if (parents.length) return { blocked:true, name:s.name };
    for(const parent of rows.filter(p=>p.id!==id&&p.components.some(c=>c.recommended&&c.slug===s.slug))){
      await tx.update(schema.services).set({components:parent.components.filter(c=>!c.recommended||c.slug!==s.slug)}).where(eq(schema.services.id,parent.id));
    }
    await tx.update(schema.services).set({ active:false, featured:false, removed:true }).where(eq(schema.services.id,id));
    return { blocked:false, name:s.name };
  });
  if (result?.blocked) redirect(`/admin/servicios/${id}/?dependencias=1`);
  if (result) await audit("quitar", "servicio", id, result.name);
  revalidatePublicData();
}

export async function restoreService(fd: FormData) {
  await requireAdmin();
  const id = parseId(fd);
  let s;
  try {
    s = await db.transaction(async tx=>{
      const rows = await tx.select().from(schema.services).for("update");
      validateHierarchy(rows.map(s=>s.id===id?{...s,removed:false,active:false}:s));
      const [updated] = await tx.update(schema.services).set({ removed:false, active:false }).where(eq(schema.services.id,id)).returning();
      return updated;
    });
  } catch {redirect(`/admin/servicios/${id}/?recuperacion=1`);}
  if (s) await audit("recuperar", "servicio", id, s.name);
  revalidatePublicData();
}

export async function deleteServicePermanently(fd: FormData) {
  await requireAdmin();
  const id=parseId(fd);
  const result=await db.transaction(async tx=>{
    const catalog=await tx.select().from(schema.services).for("update");
    const service=catalog.find(s=>s.id===id);
    if (!service) return null;
    const bookings=await tx.select({serviceNames:schema.bookings.serviceNames,quoteSnapshot:schema.bookings.quoteSnapshot}).from(schema.bookings);
    const blocked=serviceDeletionBlocker(service,catalog,bookings);
    if (blocked) return {blocked,name:service.name,slug:service.slug};
    for(const parent of catalog.filter(p=>p.id!==id&&p.components.some(c=>c.recommended&&c.slug===service.slug))){
      await tx.update(schema.services).set({components:parent.components.filter(c=>!c.recommended||c.slug!==service.slug)}).where(eq(schema.services.id,parent.id));
    }
    await tx.delete(schema.services).where(and(eq(schema.services.id,id),eq(schema.services.removed,true)));
    return {blocked:null,name:service.name,slug:service.slug};
  });
  if (result?.blocked) redirect(`/admin/servicios/?quitados=1&bloqueado=${id}`);
  if (result) await audit("eliminar definitivamente","servicio",id,`${result.name} · URL liberada: ${result.slug}`);
  revalidatePublicData();
  revalidatePath("/admin/servicios","layout");
  redirect("/admin/servicios/?quitados=1&eliminado=1");
}

/* ---------------------------- Categorías ---------------------------- */

const categorySchema = z.object({
  kind: z.enum(["producto", "servicio"]),
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Nombre requerido").max(60),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(500).optional(),
  sort: z.coerce.number().int().default(0),
});

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formToObject(fd);
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), message: Object.values(zodErrors(parsed.error))[0], values };
  const d = parsed.data;
  const base = { name: d.name, slug: slugify(d.slug || d.name).slice(0, 60), sort: d.sort };
  try {
    if (d.kind === "producto") {
      const t = schema.productCategories;
      if (d.id) await db.update(t).set(base).where(eq(t.id, d.id));
      else await db.insert(t).values(base);
    } else {
      const t = schema.serviceCategories;
      const data = { ...base, description: d.description || null };
      if (d.id) await db.update(t).set(data).where(eq(t.id, d.id));
      else await db.insert(t).values(data);
    }
  } catch (e) {
    if (isUniqueViolation(e)) return { message: "Ya existe una categoría con ese slug.", values };
    throw e;
  }
  await audit(d.id ? "editar" : "crear", `categoría ${d.kind}`, d.id ?? null, d.name);
  revalidatePublicData();
  return { ok: true, message: "Guardado" };
}

export async function deleteCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = parseId(fd);
  const kind = z.enum(["producto", "servicio"]).parse(fd.get("kind"));
  try {
    const t = kind === "producto" ? schema.productCategories : schema.serviceCategories;
    // Los productos quedan "sin categoría" (FK set null); los servicios la bloquean (FK restrict)
    const [c] = await db.delete(t).where(eq(t.id, id)).returning({ name: t.name });
    if (c) await audit("eliminar", `categoría ${kind}`, id, c.name);
  } catch (e) {
    if (isForeignKeyViolation(e)) return { message: "Tiene servicios asociados: muévelos a otra categoría antes de eliminarla." };
    throw e;
  }
  revalidatePublicData();
  return { ok: true };
}

export async function saveVehicleCatalog(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await db.transaction(async tx => {
      const rows = await tx.select().from(schema.services).for("update");
      const vehicles=await tx.select().from(schema.quoteVehicles).where(eq(schema.quoteVehicles.removed,false));
      const keys=vehicles.map(v=>v.slug);
      const updates=rows.filter(s=>!s.removed).map(s=>{
        const selected=keys.filter(key=>fd.get(`vehicle-${key}-${s.id}`)==="on");
        const preserved=s.vehicles.filter(key=>!keys.includes(key));
        if(!selected.length&&!preserved.length) throw Error(`Selecciona al menos un vehículo para “${s.name}”. Para ocultarlo, desactívalo desde su ficha.`);
        return {...s,vehicles:[...selected,...preserved],requiresDoubleSuspension:false,excludesDoubleSuspension:false};
      });
      validateHierarchy([...updates,...rows.filter(s=>s.removed)]);
      for(const s of updates) await tx.update(schema.services).set({vehicles:s.vehicles,requiresDoubleSuspension:s.requiresDoubleSuspension,excludesDoubleSuspension:s.excludesDoubleSuspension}).where(eq(schema.services.id,s.id));
    });
    await audit("editar","vehículos del cotizador",null,"Compatibilidad de servicios y packs actualizada");
    revalidatePublicData();
    return {ok:true,message:"Vehículos guardados. El cotizador ya usa esta configuración."};
  } catch(e) { return {message:e instanceof Error?e.message:"No se pudo guardar la configuración."}; }
}

export async function manageQuoteVehicle(_prev:FormState,fd:FormData):Promise<FormState>{
  await requireAdmin();
  const intent=z.enum(["add","remove","restore"]).safeParse(fd.get("intent"));
  if(!intent.success)return {message:"Acción inválida."};
  try{
    if(intent.data==="add"){
      const parsed=z.string().trim().min(2).max(60).safeParse(fd.get("name"));
      if(!parsed.success)return {message:"Escribe un nombre de entre 2 y 60 caracteres."};
      const name=parsed.data;const slug=slugify(name).slice(0,20);
      if(!slug)return {message:"Escribe un nombre válido."};
      const [vehicle]=await db.insert(schema.quoteVehicles).values({name,slug}).returning();
      await audit("crear","vehículo",vehicle.id,name);
    }else{
      const id=parseId(fd);
      await db.transaction(async tx=>{
        const vehicles=await tx.select().from(schema.quoteVehicles).for("update");
        const vehicle=vehicles.find(v=>v.id===id);if(!vehicle)throw Error("El vehículo ya no existe.");
        if(intent.data==="remove"&&!vehicle.removed&&vehicles.filter(v=>!v.removed).length<=1)throw Error("Conserva al menos un vehículo para el cotizador.");
        await tx.update(schema.quoteVehicles).set({removed:intent.data==="remove"}).where(eq(schema.quoteVehicles.id,id));
      });
      await audit(intent.data==="remove"?"quitar":"recuperar","vehículo",id,"Vehículo del cotizador");
    }
    revalidatePublicData();return {ok:true,message:intent.data==="add"?"Vehículo añadido. Ahora asigna sus servicios y packs.":"Vehículos actualizados."};
  }catch(e){return {message:isUniqueViolation(e)?"Ya existe ese vehículo. Puedes recuperarlo si fue quitado.":e instanceof Error?e.message:"No se pudo guardar el vehículo."};}
}
