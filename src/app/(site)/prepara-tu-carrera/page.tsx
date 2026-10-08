import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { RaceChecklist } from "@/components/home/RaceChecklist";
import { HomeTools } from "@/components/home/WorkshopFocus";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = { title: "Prepara tu bicicleta para una carrera", description: "Organiza tu revisión mecánica, conserva tus ajustes y coordina los servicios con Tropicleta antes de tu próxima carrera en Atacama.", alternates: { canonical: siteUrl("/prepara-tu-carrera/") } };
export default function RacePage() {
  return <>
    <PageHero kicker="Para ciclistas que compiten" title="Tu próxima carrera" highlight="empieza antes." intro="Revisa, anota y coordina. Una guía para preparar tu bici y explicar al taller qué necesitas, sin dejar la fecha de entrega al azar."><Link className="tp-btn tp-btn-primary" href="#revision">Preparar mi revisión ↓</Link><Link className="tp-btn tp-btn-secondary" href="/servicios/?motivo=carrera">Ya sé qué servicio necesito →</Link></PageHero>
    <section className="tp-section" id="revision"><div className="tp-shell"><RaceChecklist /></div></section>
    <HomeTools />
  </>;
}
