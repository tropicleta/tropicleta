import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandLogo } from "@/components/BrandLogo";
import { isAdmin } from "@/lib/auth";
import { cookies } from "next/headers";
import { LoginCodeForm } from "@/components/admin/LoginCodeForm";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin/");
  const challenge = (await cookies()).get(process.env.NODE_ENV === "production" ? "__Host-tp_login" : "tp_login")?.value;
  return (
    <div className="tp-login">
      <div className="tp-panel">
        <div className="tp-logo" style={{ marginBottom: 18 }}>
          <BrandLogo />
        </div>
        <h1 className="tp-display tp-category-heading">Panel del taller</h1>
        {process.env.ADMIN_LOGIN_EMAIL && challenge ? <LoginCodeForm /> : <LoginForm />}
      </div>
    </div>
  );
}
