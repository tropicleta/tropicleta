import Image from "next/image";
import styles from "./home/WorkshopFocus.module.css";
const stories = [
  { image: "suspension", title: "Scott Spark RC", post: "DRp1XCXksWw", position: "50% 40%", fit: "cover" as const },
  { image: "DbzMjzxRlXb", title: "Frank y su 715 DH", post: "DbzMjzxRlXb", position: "50% 25%", fit: "cover" as const },
  { image: "eventos/DcaRGHSNapo", title: "Atacama Desert Race", post: "DcaRGHSNapo", position: "50% 35%", fit: "cover" as const },
];
export function WorkshopGallery() {
  return <section className="tp-section tp-workshop tp-instagram-gallery" aria-labelledby="workshop-title"><div className="tp-shell">
    <div className="tp-workshop-heading"><div><span className="tp-kicker">Trabajos publicados · Instagram</span><h2 id="workshop-title" className="tp-display tp-section-title">Mira el trabajo de cerca.</h2><p className="tp-section-intro">Bicicletas y carreras. Abre una foto para ver la publicación.</p></div><a className="tp-btn tp-btn-secondary" href="https://www.instagram.com/tropicleta/" target="_blank" rel="noopener noreferrer">Más en Instagram ↗</a></div>
    <div className="tp-workshop-grid">{stories.map(story => {
      return <article key={story.post} className={`tp-workshop-card tp-instagram-post ${styles.compactCard}`}>
      <a className={styles.postLink} href={"https://www.instagram.com/p/" + story.post + "/"} target="_blank" rel="noopener noreferrer">
      <div className="tp-instagram-post-header"><Image unoptimized src="/brand/mascota-nitida.webp" alt="" width={32} height={32} /><span><strong>tropicleta</strong><small>Tierra Amarilla · Atacama</small></span><span className="tp-instagram-open" aria-hidden="true">↗</span></div>
      <div className="tp-workshop-photo"><Image src={"/taller/" + story.image + ".jpg"} alt={story.title} fill sizes="(max-width: 639px) 100vw, (max-width: 979px) 50vw, 33vw" style={{objectPosition:story.position, objectFit:story.fit}} /></div>
      <div className={`tp-workshop-caption ${styles.caption}`}><h3>{story.title}<span aria-hidden="true"> ↗</span></h3></div>
      </a>
      </article>;
    })}</div>
  </div></section>;
}
