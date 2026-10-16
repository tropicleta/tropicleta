import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { footerLinks, site } from "@/data/site";
import { SocialIcon } from "./SocialIcon";

export function Footer() {
  const year = new Date().getFullYear();
  return <footer className="tp-footer tp-footer-compact"><div className="tp-shell">
    <div className="tp-footer-main">
      <div className="tp-footer-brand">
        <Link href="/" className="tp-footer-logo" aria-label="Tropicleta, ir al inicio"><BrandLogo stacked /></Link>
        <div className="tp-socials">{site.socials.map(s => <a key={s.name} href={s.href} target="_blank" rel="noopener" aria-label={s.name}><SocialIcon name={s.name} /></a>)}</div>
      </div>
      <div className="tp-footer-contact">

        <a href="https://www.google.com/maps?cid=16614543370593599727" target="_blank" rel="noopener">{site.address} ↗</a>
        <span>Atención con coordinación previa</span>
        <a href={`tel:+${site.whatsappNumber}`}>{site.whatsappDisplay}</a>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </div>
      <nav className="tp-footer-navigation" aria-label="Enlaces del pie de página">
        <div className="tp-footer-primary-links"><Link href="/servicios/">Servicios y cotización</Link><Link href="/tienda/">Tienda</Link><Link href="/recomendados/">Recomendados</Link><Link href="/eventos/">Taller móvil</Link></div>
        <details className="tp-footer-help"><summary>Ayuda y más información</summary><ul>{[...footerLinks.taller.filter(l => !["/servicios/", "/eventos/"].includes(l.href)), ...footerLinks.ayuda].map(l => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul></details>
      </nav>
    </div>
    <div className="tp-footer-bottom"><span>© {year} {site.domain}</span><span>Diagnóstico gratuito · Garantía 2 semanas</span><small style={{ fontSize: 11, color: "#a8b0b2" }}>Desarrollado por <a href="https://el-arca-six.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>El Arca</a></small></div>
  </div></footer>;
}
