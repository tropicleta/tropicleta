import Image from "next/image";
import Link from "next/link";
import { workshopComments } from "@/data/workshop-comments";
import styles from "./home/WorkshopFocus.module.css";
const stories = [
  { image: "suspension", title: "Listas para volver al cerro", text: "Una Scott Spark RC lista para su próxima ruta.", post: "DRp1XCXksWw", position: "50% 40%", fit: "cover" as const },
  { image: "DbzMjzxRlXb", title: "Frank vuelve a rodar", text: "Frank y su 715 DH, de vuelta para seguir disfrutando sobre dos ruedas.", post: "DbzMjzxRlXb", position: "50% 25%", fit: "cover" as const },
  { image: "DcTfpyzxZPE-hd", title: "Sophie y su Trek Marlin 4", text: "Una mantención completa para acompañar a Sophie en sus próximas rutas.", post: "DcTfpyzxZPE", position: "50% 35%", fit: "cover" as const },
];
export function WorkshopGallery() {
  return <section className="tp-section tp-workshop tp-instagram-gallery" aria-labelledby="workshop-title"><div className="tp-shell">
    <div className="tp-workshop-heading"><div><span className="tp-kicker">Trabajos publicados · Instagram</span><h2 id="workshop-title" className="tp-display tp-section-title">Mira el trabajo de cerca.</h2><p className="tp-section-intro">Casos publicados por Tropicleta: bicicletas y personas que han pasado por el taller. Abre cada publicación para conocer su historia y los detalles del trabajo.</p></div><a className="tp-btn tp-btn-secondary" href="https://www.instagram.com/tropicleta/" target="_blank" rel="noopener noreferrer">Ver más trabajos en Instagram ↗</a></div>
    <div className="tp-workshop-grid">{stories.map(story => <a key={story.post} className="tp-workshop-card tp-instagram-post" href={"https://www.instagram.com/tropicleta/reel/" + story.post + "/"} target="_blank" rel="noopener noreferrer">
      <div className="tp-instagram-post-header"><Image src="/brand/mascota-oficial.webp" alt="" width={32} height={32} /><span><strong>tropicleta</strong><small>Tierra Amarilla · Atacama</small></span><span className="tp-instagram-open" aria-hidden="true">↗</span></div>
      <div className="tp-workshop-photo"><Image src={"/taller/" + story.image + ".jpg"} alt={story.title} fill sizes="(max-width: 639px) 100vw, (max-width: 979px) 50vw, 33vw" style={{objectPosition:story.position, objectFit:story.fit}} /></div>
      <div className="tp-workshop-caption"><span className="tp-instagram-post-link">Ver publicación en Instagram ↗</span><h3>{story.title}</h3><p>{story.text}</p></div>
    </a>)}</div>
    <div className={styles.comments}>
      <h3 className="tp-display">Lo que comentan quienes pedalean.</h3>
      <p className={styles.intro}>Comentarios públicos en nuestras publicaciones de Instagram. Puedes abrir cada fuente para leer el contexto completo.</p>
      <div className={styles.cards}>{workshopComments.map(comment => <figure className={styles.comment} key={comment.username}>
        <blockquote>“{comment.quote}”</blockquote>
        <figcaption><strong>@{comment.username}</strong><span>{comment.context}</span><a href={comment.url} target="_blank" rel="noopener noreferrer">{comment.excerpt ? "Leer comentario completo ↗" : "Ver comentario original ↗"}</a></figcaption>
      </figure>)}</div>
      <div className="tp-actions" style={{marginTop:24}}><Link className="tp-btn tp-btn-primary" href="/servicios/">Consultar servicios para mi bici →</Link></div>
    </div>
  </div></section>;
}
