"use server";

import { allowPublicSubmission } from "@/lib/public-limit";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import type { FormState } from "@/lib/forms";

export async function lookupOrder(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!(await allowPublicSubmission("lookupOrder"))) return { message: "Demasiados intentos. Espera 15 minutos antes de volver a intentar." };
  const code = String(fd.get("code") ?? "").trim().toUpperCase();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const values = { code, email };
  if (!code || !email) return { message: "Ingresa el número de orden y tu email.", values };

  const [order] = await db
    .select({ code: schema.orders.code })
    .from(schema.orders)
    .where(and(eq(schema.orders.code, code), eq(sql`lower(${schema.orders.customerEmail})`, email)))
    .limit(1);
  if (!order) return { message: "No encontramos una orden con esos datos. Revisa el número en tu correo de confirmación.", values };
  redirect(`/checkout/gracias/?orden=${order.code}`);
}
