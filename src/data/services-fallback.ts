/** Respaldo estático (textos del sitio original) por si la BD no responde: la home nunca se rompe. */
export const fallbackCategories = [
  { slug: "mantenciones", name: "Mantenciones" },
  { slug: "suspensiones", name: "Suspensiones" },
  { slug: "transmision", name: "Transmisión" },
  { slug: "frenos", name: "Frenos" },
  { slug: "ruedas", name: "Ruedas" },
  { slug: "ejes", name: "Ejes y rodamientos" },
  { slug: "scooters", name: "Scooters eléctricos" },
  { slug: "retiro-entrega", name: "Retiro y entrega" },
];

export const fallbackFeatured = [
  { slug: "mantencion-completa", categorySlug: "mantenciones", categoryName: "Mantención", name: "Mantención completa", price: 50000 as number | null },
  { slug: "limpieza-ultrasonica-encerado", categorySlug: "transmision", categoryName: "Transmisión", name: "Limpieza de transmisión + encerado SILCA", price: 30000 as number | null },
  { slug: "tubeless-completo", categorySlug: "ruedas", categoryName: "Ruedas", name: "Tubeless completo", price: 20000 as number | null },
];
