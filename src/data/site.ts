/**
 * Datos del negocio. ⚠️ Email, redes, horario y referencia de dirección son DUMMY: confirmar con Tropicleta.
 * WhatsApp, ubicación y zonas de cobertura vienen del sitio original.
 */
export const site = {
  name: "Tropicleta",
  domain: "tropicleta.com",
  location: "Tierra Amarilla · Región de Atacama",
  address: "Carlos Condell 105, Tierra Amarilla",
  addressNote: "Carlos Condell 105, Tierra Amarilla. Atención con coordinación previa.",
  whatsappNumber: "56976614443",
  whatsappDisplay: "+56 9 7661 4443",
  coverage: ["Tierra Amarilla", "Paipote", "Copiapó"],
  email: "hola@tropicleta.com",
  hours: [
    { days: "Atención del taller", time: "Con coordinación previa" },
    { days: "Retiro de bicicletas", time: "Tierra Amarilla y Copiapó, previa coordinación" },
  ],
  socials: [
    { name: "Instagram", href: "https://instagram.com/tropicleta" },
    { name: "Facebook", href: "https://www.facebook.com/tropicleta" },
    { name: "TikTok", href: "https://www.tiktok.com/@tropicleta" },
    { name: "YouTube", href: "https://www.youtube.com/@tropicleta" },
  ],
} as const;

export const nav = [
  { href: "/servicios/", label: "Servicios y cotización" },
  { href: "/tienda/", label: "Tienda" },
  { href: "/recomendados/", label: "Recomendados" },
  { href: "/consejos/", label: "Guías" },
  { href: "/eventos/", label: "Taller móvil" },
  { href: "/nosotros/", label: "Nosotros" },
  { href: "/contacto/", label: "Contacto" },
] as const;

export const footerLinks = {
  taller: [
    { href: "/servicios/", label: "Servicios y cotización" },
    { href: "/eventos/", label: "Taller móvil para eventos" },
    { href: "/consejos/", label: "Consejos" },
    { href: "/biometria/", label: "Biometría y bike fitting" },
    { href: "/calculador-sag/", label: "Calculador de SAG" },
    { href: "/nosotros/", label: "Nosotros" },
  ],
  ayuda: [
    { href: "/preguntas-frecuentes/", label: "Preguntas frecuentes" },
    { href: "/mi-orden/", label: "Seguimiento de compra" },
    { href: "/garantia/", label: "Garantía" },
    { href: "/envios-y-devoluciones/", label: "Envíos y devoluciones" },
    { href: "/terminos/", label: "Términos y condiciones" },
    { href: "/privacidad/", label: "Privacidad" },
  ],
};
