# Web orientada a ciclistas y competición

Cambios locales del 8 de octubre de 2026. No se desplegó la web ni se enviaron solicitudes, mensajes o publicaciones externas.

## Recorrido del cliente

- Portada: servicio técnico y coordinación como acciones principales. Tres entradas concretas a frenos/cambios, suspensión y tubeless enlazan servicios del catálogo confirmado. No se creó un pack de revisión precompetencia (ese servicio está excluido del catálogo).
- Preparación de carrera: bloque propio y página `/prepara-tu-carrera/`, con lista interactiva de revisión. Marcas «por revisar», «lo revisé» y «consultar al taller», sin certificar el estado de la bici. No se almacenan las marcas fuera de la página.
- Cotizador: la fecha de carrera y los puntos seleccionados se llevan a una nota editable. La fecha preferida de atención y la fecha de carrera son distintas; atención, repuestos y entrega siguen requiriendo coordinación. No se inventaron plazos ni disponibilidad.
- SAG y bike fitting: visibles en portada y en el índice de Guías, accesible desde el menú principal. La nueva guía de carrera enlaza ambas herramientas. No se modificaron los cálculos de SAG ni bike fitting en este cambio.
- Evidencia: galería existente trasladada antes de la tienda y presentada como trabajos publicados, con enlaces a sus fuentes. No se atribuyen citas u opiniones a los clientes.
- Equipo y presentación: «Nosotros» muestra una foto propia ya disponible en el proyecto. Se retiró la historia del garaje que estaba marcada como contenido de ejemplo y una afirmación de procedimiento de entrega no verificada. No se inventaron años de experiencia, nombres, certificaciones o marcas autorizadas.
- Navegación y descubrimiento: guía de carrera incluida en sitemap y pie de página; accesos a carrera y postura añadidos al índice de Guías. La tienda y recomendados siguen disponibles.

## Fuentes

- Servicios y exclusiones: `src/data/official-services.ts`, catálogo confirmado por Tropicleta el 30 de septiembre de 2026. Los precios siguen perteneciendo al cotizador; no se duplicó una lista de precios en la portada.
- Preparación: [Trek, revisión antes de salir](https://www.trekbikes.com/us/en_US/pre-ride-checklist/) y [SRAM AXS, consejos técnicos](https://www.sram.com/en/learn/road-axs-welcome-guide/tech-tips-and-tuning), junto a las referencias existentes de SAG. No se prescriben presiones, aprietes o intervalos universales.
- Instagram: búsquedas sin opiniones verificables y error al abrir reels. [Selección de candidatos](./instagram-candidatos-compilado.md) con Frank, Sophie y Scott Spark RC, a partir de la galería existente. No hay material suficiente verificado para producir un video de testimonios. No se descargaron videos ni se contactó a los clientes.

## Verificación

- `node tests/race-preparation.cjs`: pasó. Comprueba fechas reales (incluidos días imposibles y año bisiesto), filtrado de puntos desconocidos, conservación del contexto de carrera y que los servicios enlazados no estén excluidos del catálogo confirmado.
- `npm run typecheck`: pasó antes de la compilación de producción.
- La primera compilación compiló los módulos, pero el sandbox bloqueó el subproceso de TypeScript con `spawn EPERM`; se solicitó ejecutar el mismo build con permisos de proceso.
- `npm run build` con permisos de proceso: pasó. Compilación, TypeScript y generación de páginas completados, incluida `/prepara-tu-carrera/`.
- Revisión visual en navegador pendiente: la herramienta de navegación había bloqueado la página local en esta conversación. No se utilizó otro navegador para eludir ese bloqueo.
