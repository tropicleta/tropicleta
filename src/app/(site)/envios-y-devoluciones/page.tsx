import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { shopRules } from "@/data/shop";
import { formatCLP } from "@/lib/format";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/envios-y-devoluciones/") }, title: "Envíos y devoluciones", description: "Despacho, retiro en taller, cambios y devoluciones de la tienda Tropicleta." };

export default function EnviosPage() {
  const rates = Object.entries(shopRules.shippingByCommune)
    .map(([c, v]) => `- ${c}: ${formatCLP(v)}`)
    .join("\n");
  return (
    <LegalPage
      kicker="Tienda"
      title="Envíos y"
      highlight="devoluciones."
      updated="octubre 2026"
      body={`## Retiro en el taller
Sin costo. Te avisamos por WhatsApp cuando tu pedido esté listo para retirar en Tierra Amarilla, con coordinación previa.

## Despacho a domicilio
Despachamos a Tierra Amarilla, Paipote y Copiapó dentro de 1 a 3 días hábiles desde la confirmación del pago.

${rates}

## Envíos a otras comunas de Chile
Solicita una cotización desde el carrito indicando región, comuna y si prefieres domicilio o sucursal. Revisamos la cobertura del transportista y la admisión de los productos antes de confirmar el envío. El costo depende del destino, peso y dimensiones del paquete.

Antes de pagar, te confirmaremos disponibilidad de productos, transportista, costo total y plazo estimado. La consulta por WhatsApp no cobra ni reserva productos. No pagues seleccionando retiro en taller si necesitas un envío nacional: primero coordina la cotización con nosotros. Una vez despachado, te compartiremos el número de seguimiento.

## Cambios y devoluciones
Tienes 10 días desde que recibes tu compra para solicitar un cambio o devolución, siempre que el producto esté sin uso, en su empaque original y con su boleta. Los productos de mantención abiertos (lubricantes, sellantes) no tienen cambio por razones de higiene y seguridad.

## Productos con falla
Si un producto llega con falla, escríbenos dentro de los primeros 10 días y lo cambiamos o te devolvemos el dinero, según prefieras, de acuerdo con la Ley del Consumidor.

## Reembolsos
Los reembolsos se hacen al mismo medio de pago usado en la compra (Mercado Pago) y pueden tardar según los plazos de cada banco.`}
    />
  );
}
