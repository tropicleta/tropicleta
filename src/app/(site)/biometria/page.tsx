import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteUrl } from "@/lib/site-url";
import { BikeFit } from "@/components/biometria/BikeFit";

export const metadata: Metadata = {
  title: "Revisa la altura de tu sillín",
  description: "Revisa la altura del sillín con una foto si estás solo o cámara en vivo con ayuda. Referencia estática de rodilla, análisis local y guía paso a paso.",
  alternates: { canonical: siteUrl("/biometria/") },
};

export default function BiometriaPage() {
  return <>
    <PageHero kicker="Altura de sillín · beta" title="Revisa la altura" highlight="de tu sillín." intro="¿Estás solo? Usa una foto. ¿Estás con alguien? Pide ayuda con la cámara. Te guiamos para revisar la rodilla y entender qué ajustar." />
    <section className="tp-section"><div className="tp-shell"><BikeFit /></div></section>
  </>;
}
