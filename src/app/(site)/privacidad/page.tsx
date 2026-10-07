import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { alternates: { canonical: siteUrl("/privacidad/") }, title: "Política de privacidad" };

export default function PrivacidadPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Política de"
      highlight="privacidad."
      updated="septiembre 2026"
      body={`## Qué datos recopilamos
Nombre, teléfono, email y, cuando corresponde, dirección de retiro o despacho. Los ingresas tú al solicitar hora, escribirnos o comprar.

## Para qué los usamos
- Coordinar tu atención en el taller y el retiro o entrega.
- Procesar y despachar tus compras.
- Enviarte comprobantes y responder tus mensajes.

No enviamos publicidad sin tu consentimiento ni vendemos tus datos.

## Con quién los compartimos
Solo con los proveedores necesarios para operar: procesadores de pago (Mercado Pago), el servicio de correo transaccional y el proveedor de hosting. Los datos de tu tarjeta los recibe directamente el procesador de pago.

## Almacenamiento local
Guardamos tu carrito de compras en tu navegador para que no se pierda al recargar la página.

## Tus derechos
Puedes pedir acceso, corrección o eliminación de tus datos escribiéndonos a hola@tropicleta.com, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada.`}
    />
  );
}
