import { requireAdmin } from "@/lib/auth";
import { paymentConfiguration } from "@/lib/payment-config";

export const dynamic = "force-dynamic";
export default async function PaymentsAdmin() {
  await requireAdmin();
  const config = paymentConfiguration();
  const checks = [
    ["Mercado Pago", config.mpAvailable ? config.mpTest ? "Disponible para pruebas" : "Configurado para cobros reales" : "Pendiente de configuración"],
    ["Dirección pública HTTPS", config.https ? "Configurada" : "Pendiente para producción"],
    ["Correo de confirmación", process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL ? "Credenciales configuradas; verificar entrega" : "Pendiente de credenciales o correo del administrador"],
    ["Base de datos persistente", process.env.DATABASE_URL || process.env.POSTGRES_URL ? "Configurada" : "Base local de desarrollo"],
  ];
  return <div className="tp-stack"><h1>Preparación de pagos</h1><p>Este panel comprueba la configuración. La conexión y los cobros deben verificarse con una compra de prueba antes de abrir la tienda.</p>
    <div className="tp-panel"><dl className="tp-dl">{checks.map(([name, status]) => <div key={name}><dt>{name}</dt><dd>{status}</dd></div>)}</dl></div>
    <div className="tp-panel"><h2>Activación</h2><p>Mercado Pago: configura MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET y MP_SANDBOX=0. Registra el webhook de pagos en /api/mercadopago/webhook/ usando el dominio público HTTPS.</p><p>Configura NEXT_PUBLIC_SITE_URL con el dominio público. Las credenciales se guardan en las variables privadas del servidor, nunca en el catálogo.</p><p>Para Recomendados solo necesitas los enlaces de afiliado generados por tu cuenta de Mercado Libre. Agrégalos desde el panel Recomendados.</p></div>
  </div>;
}
