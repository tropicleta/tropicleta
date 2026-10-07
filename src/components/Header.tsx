"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/data/site";
import { CartButton } from "./cart/CartButton";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Cierra el menú móvil al navegar
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="tp-header">
      <div className="tp-shell">
        <div className="tp-header-inner">
          <Link href="/" className="tp-logo" aria-label="Tropicleta, ir al inicio">
            <BrandLogo />
          </Link>

          <nav className="tp-nav" aria-label="Principal">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="tp-header-actions">


          <CartButton />

          <button
            type="button"
            className="tp-menu-toggle"
            aria-expanded={open}
            aria-controls="tp-mobile-nav"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
          </button>
          </div>
        </div>

        <nav id="tp-mobile-nav" className="tp-mobile-nav" aria-label="Principal móvil" hidden={!open}>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}

        </nav>
      </div>
    </header>
  );
}
