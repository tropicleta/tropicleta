import Image from "next/image";
import styles from "./home/WorkshopFocus.module.css";
import community from "./home/Tropicleteros.module.css";
import { SocialFeedback } from "./home/SocialFeedback";
const stories = [
  { image: "suspension", title: "Scott Spark RC", post: "DRp1XCXksWw", position: "50% 40%", fit: "cover" as const },
  { image: "DbzMjzxRlXb", title: "Frank y su 715 DH", post: "DbzMjzxRlXb", position: "50% 25%", fit: "cover" as const },
  { image: "eventos/DcaRGHSNapo", title: "Atacama Desert Race", post: "DcaRGHSNapo", position: "50% 35%", fit: "cover" as const },
];
export function WorkshopGallery() {
  return <section id="comunidad" className="tp-section tp-workshop tp-instagram-gallery" aria-labelledby="workshop-title"><div className={`tp-shell ${community.layout}`}>
    <div className={community.heading}><span className="tp-kicker">Nuestra comunidad</span><h2 id="workshop-title" className="tp-display tp-section-title">Tropicleteros.</h2><p className="tp-section-intro">Las personas, las bicis y las rutas que compartimos. Fotos y comentarios desde nuestras redes.</p></div>
    <div className={community.comments}><SocialFeedback /></div>
    <div className={`tp-workshop-grid ${community.photos}`}>{stories.map(story => {
      return <article key={story.post} className={`tp-workshop-card tp-instagram-post ${styles.compactCard}`}>
      <a className={styles.postLink} href={"https://www.instagram.com/p/" + story.post + "/"} target="_blank" rel="noopener noreferrer">
      <div className="tp-instagram-post-header"><Image unoptimized src="/brand/mascota-nitida.webp" alt="" width={32} height={32} /><span><strong>tropicleta</strong><small>Tierra Amarilla · Atacama</small></span><span className="tp-instagram-open" aria-hidden="true">↗</span></div>
      <div className="tp-workshop-photo"><Image src={"/taller/" + story.image + ".jpg"} alt={story.title} fill sizes="(max-width: 700px) 46vw, (max-width: 1000px) 30vw, 22vw" style={{objectPosition:story.position, objectFit:story.fit}} /></div>
      <div className={`tp-workshop-caption ${styles.caption}`}><h3>{story.title}<span aria-hidden="true"> ↗</span></h3></div>
      </a>
      </article>;
    })}</div>
  </div></section>;
}
