import { after } from "next/server";
import { retryQueuedEmails } from "@/lib/email-outbox";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { BrandLogo } from "@/components/BrandLogo";
import { pendingCounts } from "@/lib/admin-queries";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Tropicleta" }, robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  after(()=>retryQueuedEmails(2).then(()=>{}).catch(()=>{}));
  const n = await pendingCounts();

  return (
    <div className="tp-admin">
      <aside className="tp-admin-side">
        <Link href="/admin/" className="tp-logo" style={{ fontSize: 22 }}>
          <BrandLogo />
        </Link>
        <AdminNav badges={{ "/admin/reservas/": n.bookings, "/admin/ordenes/": n.orders, "/admin/mensajes/": n.messages }} />
        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          <Link className="tp-btn tp-btn-secondary tp-btn-sm" href="/" target="_blank">
            Ver sitio
          </Link>
          <form action={logout}>
            <button className="tp-btn tp-btn-ghost tp-btn-sm" type="submit">
              Salir
            </button>
          </form>
        </div>
      </aside>
      <main className="tp-admin-main">{children}</main>
    </div>
  );
}
