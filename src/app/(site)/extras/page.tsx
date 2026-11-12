import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import styles from "./extras.module.css";
import { PageHero } from "@/components/PageHero";
import { posts } from "@/data/posts";
import { GuideImage } from "@/components/guides/GuideImage";
import guideStyles from "@/components/guides/GuideImage.module.css";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Extras: guías y juego de Tropi",
  description: "Guías para cuidar y ajustar tu bicicleta y el juego de Tropi por el desierto, la costa y las estrellas de Atacama.",
  alternates: { canonical: siteUrl("/extras/") },
};

const guides = [
  { href: "/biometria/", title: "Altura de sillín", description: "Una herramienta orientativa para revisar tu posición.", action: "Revisar mi sillín" },
  { href: "/calculador-sag/", title: "Ajusta tu suspensión", description: "Aprende a medir el SAG y a afinar el rebote paso a paso.", action: "Abrir la guía de SAG" },
];

export default function ExtrasPage() {
  return <>
    <PageHero kicker="Extras" title="Aprende y" highlight="sal a jugar." intro="Guías para conocer mejor tu bici y una aventura con Tropi por Atacama." />
    <section className="tp-section" aria-labelledby="juego-title"><div className="tp-shell">
      <div className={styles.game}>
        <a className={styles.preview} href="/juegos/tropi/index.html" aria-label="Jugar con Tropi: Copiapó, desierto, Caldera, noche y Viñita Azul">
          <Image src="/juegos/tropi/vista-previa.png" alt="Tropi en su bicicleta recorriendo las pistas del desierto al atardecer" fill sizes="(max-width: 800px) 92vw, 60vw" />
          <span className={styles.previewLabel}>Una aventura por Atacama</span>
          <span className={styles.play} aria-hidden="true">▶</span>
          <span className={styles.previewCaption}>Así se juega con Tropi <span aria-hidden="true">↗</span></span>
        </a>
        <div className={styles.copy}>
        <span className="tp-kicker">El juego de Tropicleta</span>
        <h2 id="juego-title" className="tp-display tp-section-title">Tropi<span className={styles.subtitle}>De Copiapó a Viñita Azul</span></h2>
        <p>Salta, cambia de pista y pedalea por Atacama. Cuida la flora y fauna mientras encuentras tu camino.</p>
        <div className={styles.facts}><span>5 niveles</span><span>25 partes · 12,5 km</span><span>Gratis</span></div>
        <a className="tp-btn tp-btn-primary" href="/juegos/tropi/index.html">Jugar con Tropi →</a>
        <small className={styles.controls}>En tu celular o con flechas y espacio.</small>
        </div>
      </div>
    </div></section>
    <section id="guias" className="tp-section tp-about-guides" aria-labelledby="guias-title"><div className="tp-shell">
      <h2 id="guias-title" className="tp-display tp-section-title">Guías del taller</h2>
      <p className="tp-section-intro">Herramientas y consejos para conocer mejor tu bici y cuidarla entre visitas.</p>
      <div className="tp-post-grid">{guides.map(guide => <Link key={guide.href} className="tp-panel" href={guide.href}><h3>{guide.title}</h3><p className="tp-hint">{guide.description}</p><span className="tp-service-link">{guide.action} →</span></Link>)}{posts.map(post => <Link key={post.slug} href={`/consejos/${post.slug}/`} className={`tp-post-card ${guideStyles.card}`}><GuideImage guide={post.slug} /><div className={guideStyles.body}><span className="tp-meta">{post.readingMinutes} min de lectura</span><h2 className="tp-display">{post.title}</h2><p>{post.excerpt}</p><span className="tp-service-link">Leer la guía →</span></div></Link>)}</div>
    </div></section>
  </>;
}
