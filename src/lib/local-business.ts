import { site } from "@/data/site";
import { siteUrl } from "@/lib/site-url";

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BicycleStore",
    "@id": siteUrl("/#taller"),
    name: site.name,
    description: "Taller de bicicletas en Tierra Amarilla, con retiro y entrega en Copiapó y Paipote y asistencia mecánica para eventos en Atacama.",
    url: siteUrl("/"),
    logo: siteUrl("/brand/mascota-actualizada.webp"),
    image: siteUrl("/taller/equipo-tropicleta.jpeg"),
    telephone: "+" + site.whatsappNumber,
    sameAs: site.socials.map(s => s.href),
    areaServed: site.coverage.map(name => ({ "@type": "Place", name })),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carlos Condell 105",
      addressLocality: "Tierra Amarilla",
      addressRegion: "Atacama",
      addressCountry: "CL",
    },
  };
}
