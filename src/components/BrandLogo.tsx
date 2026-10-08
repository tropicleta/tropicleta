import Image from "next/image";

export function BrandLogo({ stacked = false }: { stacked?: boolean }) {
  return <span className={`tp-brand-lockup${stacked ? " tp-brand-stacked" : ""}`}>
    <Image src="/brand/mascota-actualizada.webp" alt="" width={1024} height={1024} sizes="72px" className="tp-brand-mascot" />
    {stacked ? <span className="tp-footer-wordmark"><span className="tp-footer-wordmark-crop"><Image src="/brand/wordmark-stacked.webp" alt="Tropicleta" width={700} height={473} sizes="155px" /></span><span className="tp-footer-tagline">Taller de bicicletas</span></span> : <Image src="/brand/wordmark-banner.webp" alt="Tropicleta · Taller de bicicletas" width={1100} height={291} sizes="(max-width: 719px) 160px, 230px" className="tp-brand-wordmark" />}
  </span>;
}
