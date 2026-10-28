import Link from "next/link";
import { site } from "@/data/site";
import { WorkshopVideo } from "./WorkshopVideo";
import styles from "./WorkshopIntro.module.css";

export function WorkshopIntro() {
  return (
    <section className={`tp-section ${styles.section}`} aria-labelledby="taller-local">
      <div className={`tp-shell ${styles.layout}`}>
        <div className={styles.copy}>
          <h2 id="taller-local" className="tp-display">Mantención y reparación para tu próxima ruta.</h2>
          <p>¿Tu bicicleta necesita un ajuste de cambios, revisión de frenos o mantención completa? En Tropicleta revisamos tu bici y te entregamos un presupuesto antes de realizar el trabajo.</p>
          <p>El diagnóstico es gratuito y la mano de obra tiene 2 semanas de garantía. Los repuestos y los trabajos adicionales se cotizan aparte.</p>
          <Link className="tp-btn tp-btn-primary" href="/servicios/">Ver servicios y cotizar</Link>
        </div>
        <WorkshopVideo />
        <div className={styles.location}>
          <h3>En Tierra Amarilla, cerca de tu próxima salida.</h3>
          <p>Estamos en {site.address}. Atendemos con coordinación previa y ofrecemos retiro y entrega en sectores de Copiapó y Paipote. Confirma disponibilidad y costo según tu ubicación.</p>
          <div className={styles.links}>
            <Link href="/contacto/">Cómo llegar y consultar por retiro <span aria-hidden="true">↗</span></Link>
            <a href={`tel:+${site.whatsappNumber}`}>{site.whatsappDisplay}</a>
          </div>
        </div>
      </div>
    </section>
  );
}
