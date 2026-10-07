import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { siteUrl } from "@/lib/site-url";
import { BikeFit } from "@/components/biometria/BikeFit";

export const metadata: Metadata = {
  title: "Biometría y bike fitting orientativo",
  description: "Observa tu posición sobre la bicicleta con análisis local de cámara o fotografía. Ángulos orientativos, sin diagnóstico ni almacenamiento de imágenes.",
  alternates: { canonical: siteUrl("/biometria/") },
};

export default function BiometriaPage() {
  return <>
    <PageHero kicker="Biometría · beta" title="Conoce tu" highlight="posición." intro="Una mirada orientativa a tu postura sobre la bici, desde tu cámara. Tus imágenes se procesan en tu dispositivo." />
    <section className="tp-section"><div className="tp-shell"><BikeFit /></div></section>
  </>;
}
