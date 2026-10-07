import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/terminos/") }, title: "Términos y condiciones", robots: { index: true } };

export default function TerminosPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Términos y"
      highlight="condiciones."
      updated="septiembre 2026"
      body={`## 1. Sobre este sitio
tropicleta.com es operado por Tropicleta, taller de bicicletas ubicado en Tierra Amarilla, Región de Atacama, Chile. Al usar el sitio aceptas estos términos.

## 2. Servicios del taller
Las solicitudes de hora hechas en el sitio son una preferencia de fecha. La hora queda confirmada cuando Tropicleta la confirma por WhatsApp o correo. Los precios publicados corresponden a mano de obra y pueden variar tras el diagnóstico; siempre informaremos el presupuesto antes de trabajar.

## 3. Compras en la tienda
Los precios están en pesos chilenos e incluyen IVA. La compra se confirma una vez aprobado el pago por Mercado Pago. Si un producto quedara sin stock después del pago, te contactaremos para ofrecer un cambio o la devolución total.

## 4. Medios de pago
Los pagos se procesan en la plataforma de Mercado Pago. Tropicleta no almacena datos de tarjetas.

## 5. Garantía y devoluciones
Se rigen por nuestras políticas de Garantía y de Envíos y devoluciones, y por la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores.

## 6. Contacto
Para cualquier consulta sobre estos términos escríbenos por WhatsApp o a hola@tropicleta.com.`}
    />
  );
}
