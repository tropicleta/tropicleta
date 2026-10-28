"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav } from "@/data/site";
import { CartButton } from "./cart/CartButton";
import { BrandLogo } from "./BrandLogo";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);

  // Cierra el menú móvil al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuToggle.current?.focus(); }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  const isActive = (href: string) => pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header ref={headerRef} className="tp-header">
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
            ref={menuToggle}
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
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}

        </nav>
      </div>
    </header>
  );
}
