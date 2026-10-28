import { ServiceIcon } from "./ServiceIcon";
import { serviceVisual, type ServiceVisual } from "@/lib/service-visuals";
import styles from "./PackIcon.module.css";

/** Reuse the workshop's pictograms; the actual included jobs determine the motif. */
export function PackIcon({ name, slug, components }: { name: string; slug: string; components: readonly { name: string; slug: string }[] }) {
  const types = new Set(components.map(serviceVisual));
  let main: ServiceVisual | "toolbox" = serviceVisual({ name, slug });
  let badge: ServiceVisual | undefined;
  if (slug === "mantencion-completa") {
    main = "toolbox";
  } else if (slug === "mantencion-basica") {
    main = "cleaning";
  } else if (types.has("wheel-build") && types.has("tubeless")) {
    main = "wheel-build";
    badge = "sealant";
  } else if (types.has("shock") && types.has("frame")) {
    main = types.has("fork-air") ? "fork-air" : "frame";
    badge = "shock";
  } else if (types.has("bleed")) {
    main = types.has("cleaning") || types.has("headset") || types.has("bottom-bracket") ? "maintenance" : "brake";
    badge = "bleed";
  } else if (types.has("headset") || types.has("bottom-bracket") || types.has("hub-front")) {
    main = "maintenance";
  } else if (types.has("cleaning")) {
    main = "cleaning";
  } else if (types.has("brake") && types.has("shifter")) {
    main = "brake";
    badge = "shifter";
  }
  return <span className={styles.icon} aria-hidden="true">
    <ServiceIcon name={name} slug={slug} visual={main} size={48} />
    {badge && <span className={styles.badge}><ServiceIcon name={name} slug={slug} visual={badge} size={23} /></span>}
  </span>;
}
