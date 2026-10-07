import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/garantia/") }, title: "Garantía", description: "Garantía de 2 semanas en los servicios del taller Tropicleta." };

export default function GarantiaPage() {
  return (
    <LegalPage
      kicker="Ayuda"
      title="Garantía de"
      highlight="2 semanas."
      intro="Todos nuestros servicios tienen garantía sobre la mano de obra."
      updated="septiembre 2026"
      body={`## Qué cubre
Si dentro de los 14 días siguientes a la entrega un ajuste o trabajo realizado por Tropicleta presenta fallas, lo revisamos y corregimos sin costo de mano de obra.

## Qué no cubre
- Desgaste normal por uso (cadenas, pastillas, neumáticos).
- Daños por caídas, golpes, mal uso o intervenciones de terceros.
- Repuestos aportados por el cliente.
- Componentes que advertimos en el diagnóstico que debían cambiarse y el cliente decidió no reemplazar.

## Repuestos
Los repuestos que vendemos o instalamos tienen la garantía legal del fabricante. Te ayudamos a gestionarla.

## Cómo hacerla válida
Solicita la revisión desde Contacto, indicando tu código de solicitud o boleta. Si la bici está en Tierra Amarilla, Paipote o Copiapó podemos retirarla según disponibilidad.`}
    />
  );
}
