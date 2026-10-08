import Link from "next/link";
import { whatsappUrl } from "@/lib/whatsapp";
import styles from "./WorkshopFocus.module.css";

export function TechnicalServices() {
  return <section className={styles.section} aria-labelledby="technical-services-title"><div className="tp-shell">
    <span className="tp-kicker">Mecánica, con detalle</span>
    <h2 id="technical-services-title" className="tp-display">Qué necesita tu bici.</h2>
    <p className={styles.intro}>Frenos, cambios, suspensión y ruedas. Encuentra el trabajo que necesitas y revisa qué incluye en el cotizador; una mantención no reemplaza todos los servicios especializados.</p>
    <div className={styles.cards}>
      <article className={styles.card}><span className={styles.number}>01 · Frenos y transmisión</span><h3>Recupera el ajuste</h3><p>Ajuste de frenos y cambios, sincronización, servicio de pata de cambio y purga de frenos hidráulicos. Cada trabajo tiene sus propias inclusiones.</p><Link href="/servicios/?servicio=ajuste-frenos-cambios">Ver ajuste de frenos y cambios →</Link></article>
      <article className={styles.card}><span className={styles.number}>02 · Suspensión</span><h3>Servicio según tu componente</h3><p>Servicio de botellas, horquilla de aire o mecánica y amortiguador. Confirma el modelo al coordinar; la mantención completa de la bici no incluye suspensión.</p><Link href="/servicios/?servicio=servicio-completo-horquilla">Ver servicio de horquilla →</Link></article>
      <article className={styles.card}><span className={styles.number}>03 · Ruedas y apoyos</span><h3>Ruedas, tubeless y ejes</h3><p>Centrado, armado, tubeless y servicios de ejes, dirección y núcleo. Los trabajos por rueda se seleccionan por separado en el cotizador.</p><Link href="/servicios/?servicio=tubeless-completo">Ver servicio tubeless →</Link></article>
    </div>
    <p className={styles.footnote}>¿No sabes qué seleccionar? <a href={whatsappUrl("Hola Tropicleta, no sé qué servicio necesita mi bicicleta. Quiero consultar por un diagnóstico.")} target="_blank" rel="noopener noreferrer" style={{color:"var(--tp-orange)"}}>Consulta por un diagnóstico gratuito ↗</a></p>
  </div></section>;
}

export function RacePreparation() {
  return <section className={styles.section} aria-labelledby="race-preparation-title"><div className="tp-shell"><div className={styles.race}>
    <div><span className="tp-kicker">Para tu próxima carrera</span><h2 id="race-preparation-title" className="tp-display">Prepara la bici con tiempo.</h2><p>Cuéntanos cuándo compites, qué bicicleta usas y qué quieres revisar. La fecha de atención y entrega se coordina según disponibilidad y repuestos; enviar la solicitud no confirma un plazo.</p><div className="tp-actions"><Link className="tp-btn tp-btn-primary" href="/prepara-tu-carrera/">Preparar mi próxima carrera →</Link><Link className="tp-btn tp-btn-secondary" href="/servicios/?motivo=carrera">Solicitar servicios para mi carrera</Link></div></div>
    <ol className={styles.steps}><li><strong>Revisa y anota</strong><span>Identifica síntomas y conserva tu configuración habitual.</span></li><li><strong>Elige los trabajos</strong><span>Consulta inclusiones y precios en el cotizador.</span></li><li><strong>Coordina la fecha</strong><span>Indica cuándo necesitas la bici y confirma disponibilidad con el taller.</span></li></ol>
  </div></div></section>;
}

export function HomeTools() {
  return <section id="herramientas" className={styles.section} aria-labelledby="home-tools-title"><div className="tp-shell"><span className="tp-kicker">Aprende con tu bici</span><h2 id="home-tools-title" className="tp-display">Entiende tus ajustes.</h2><p className={styles.intro}>Guías gratuitas para medir en casa y llegar al taller con preguntas más claras.</p>
    <div className={`${styles.cards} ${styles.tools}`}>
      <article className={styles.card}><span className={styles.number}>Suspensión · SAG y rebote</span><h3>Mide y comprende tu suspensión</h3><p>Prepara la medición, calcula el hundimiento y sigue una prueba de rebote. Usa el manual de tu modelo como referencia.</p><Link href="/calculador-sag/">Ajustar mi suspensión →</Link></article>
      <article className={styles.card}><span className={styles.number}>Postura · Bike fitting orientativo</span><h3>Observa cómo te colocas</h3><p>Elige el módulo de tu disciplina y usa cámara o foto para observar tus ángulos. Una estimación orientativa, procesada en tu dispositivo sin subir imágenes.</p><Link href="/biometria/">Observar mi postura →</Link></article>
    </div>
  </div></section>;
}
