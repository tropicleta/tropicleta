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
  const desktopMore = useRef<HTMLDetailsElement>(null);
  const mobileMore = useRef<HTMLDetailsElement>(null);
  const secondary = nav.filter(item => ["/consejos/", "/eventos/", "/nosotros/"].includes(item.href));
  const primary = nav.filter(item => !secondary.includes(item));

  // Cierra el menú móvil al navegar
  useEffect(() => {
    setOpen(false);
    if (desktopMore.current) desktopMore.current.open = false;
    if (mobileMore.current) mobileMore.current.open = false;
  }, [pathname]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      for (const ref of [desktopMore, mobileMore]) {
        if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  const isActive = (href: string) => pathname.startsWith(href.replace(/\/$/, ""));

  return (
    <header className="tp-header">
      <div className="tp-shell">
        <div className="tp-header-inner">
          <Link href="/" className="tp-logo" aria-label="Tropicleta, ir al inicio">
            <BrandLogo />
          </Link>

          <nav className="tp-nav" aria-label="Principal">
            {primary.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
            <details className="tp-nav-more" ref={desktopMore} onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
              <summary data-active={secondary.some(item => isActive(item.href)) || undefined}>Más <span aria-hidden="true">⌄</span></summary>
              <div className="tp-nav-more-links">{secondary.map(item => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} onClick={() => { if (desktopMore.current) desktopMore.current.open = false; }}>{item.label}</Link>)}</div>
            </details>
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
          {primary.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
          <details className="tp-nav-more" ref={mobileMore} onKeyDown={event => { if (event.key === "Escape") event.currentTarget.open = false; }}>
            <summary data-active={secondary.some(item => isActive(item.href)) || undefined}>Más <span aria-hidden="true">⌄</span></summary>
            <div className="tp-nav-more-links">{secondary.map(item => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>)}</div>
          </details>

        </nav>
      </div>
    </header>
  );
}
