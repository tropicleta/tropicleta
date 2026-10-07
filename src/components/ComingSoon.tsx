import Link from "next/link";

type Props = {
  kicker: string;
  title: string;
  highlight?: string;
  intro: string;
  phase?: string;
};

/** Página base con el estilo Tropicleta para rutas que se completan en fases posteriores. */
export function ComingSoon({ kicker, title, highlight, intro, phase }: Props) {
  return (
    <section className="tp-hero tp-page-hero">
      <div className="tp-shell" style={{ position: "relative", zIndex: 1 }}>
        <span className="tp-kicker">{kicker}</span>
        <h1 className="tp-display">
          {title} {highlight && <span>{highlight}</span>}
        </h1>
        <p className="tp-hero-copy">{intro}</p>
        <div className="tp-actions">

          <Link className="tp-btn tp-btn-secondary" href="/">
            Volver al inicio
          </Link>
        </div>
        {phase && (<p className="tp-shop-note" style={{ marginTop: 22 }}>
          {phase}
        </p>)}
      </div>
    </section>
  );
}
