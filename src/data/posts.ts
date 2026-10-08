/** Artículos del blog "Consejos" (contenido DUMMY de ejemplo). Cuerpo en párrafos; "## " marca subtítulos. */
export type Post = { slug: string; title: string; excerpt: string; date: string; readingMinutes: number; body: string };

export const posts: Post[] = [
  {
    slug: "cada-cuanto-hacer-mantencion",
    title: "¿Cada cuánto hacerle mantención a tu bici?",
    excerpt: "Una guía simple según cuánto pedaleas, para que tu bici no te deje botado en plena ruta.",
    date: "2026-09-10",
    readingMinutes: 4,
    body: `La respuesta corta: depende de cuánto la uses y en qué condiciones. En el norte, el polvo y la tierra aceleran el desgaste de la transmisión, así que conviene revisar más seguido que en otras zonas.

## Si pedaleas todos los días
Lubrica la cadena cada semana y haz una mantención básica cada 2 o 3 meses. Una mantención completa al año mantiene todo en orden.

## Si sales el fin de semana
Revisa presión y frenos antes de cada salida, lubrica cada 2 o 3 salidas y haz una mantención completa una vez al año, idealmente antes de la temporada de rutas.

## Señales de que necesita taller ya
Cambios que saltan, frenos que chillan o se van al fondo, ruidos en el pedalier o juego en la dirección. No esperes a que empeore: un ajuste a tiempo sale mucho más barato que cambiar piezas.`,
  },
  {
    slug: "tubeless-vale-la-pena",
    title: "Tubeless: ¿vale la pena en Atacama?",
    excerpt: "Espinas, piedras y calor. Te contamos por qué el tubeless es casi obligatorio para el MTB en la zona.",
    date: "2026-08-22",
    readingMinutes: 3,
    body: `El sistema tubeless elimina la cámara y usa un sellante líquido que tapa pinchazos pequeños al instante. En cerros con espinas y piedras sueltas, la diferencia se nota desde la primera salida.

## Ventajas
Menos pinchazos, puedes usar menos presión para tener más agarre y la rueda queda más liviana.

## Lo que hay que cuidar
El sellante se seca con el tiempo, más rápido con calor. Recomendamos revisarlo cada 2 o 3 meses y renovarlo cuando haga falta.

## ¿Mi rueda sirve?
La mayoría de las llantas modernas son compatibles. Tráela al taller y te decimos qué necesita.`,
  },
  {
    slug: "cuidar-la-cadena",
    title: "Cuida tu cadena y aprende a usar los cambios",
    excerpt: "Arranca suave, evita la cadena cruzada y elige cambios que acompañen tu pedaleo. Menos esfuerzo brusco para ti y tu transmisión.",
    date: "2026-08-05",
    readingMinutes: 5,
    body: `Tu cadena une los platos de delante con los piñones de atrás. Ese conjunto transmite tu esfuerzo a la rueda: cuidarlo también significa elegir bien los cambios. Esta guía se refiere a bicicletas con desviador.

## Primero, entiende qué hace cada cambio
Un cambio liviano permite mover los pedales con menos esfuerzo: sirve para arrancar o subir. Uno pesado exige más fuerza y permite avanzar más por pedalada: sirve cuando ya llevas velocidad y el terreno lo permite.

Atrás, un piñón más grande hace el pedaleo más liviano. Si tienes varios platos delante, uno más pequeño también lo hace más liviano. Prueba los cambios en terreno tranquilo para conocer tu bici.

## Antes de detenerte, prepara la próxima partida
Mientras reduces la velocidad y todavía puedes pedalear suavemente, pasa a un cambio más liviano. Cuando vuelvas a partir, acelera de a poco y aumenta el desarrollo a medida que lo necesites.

Si una frenada de emergencia no te deja tiempo, frenar y mantener el control tiene prioridad. Después prepara una partida suave.

## ¿Te quedaste detenido en un cambio pesado?
Evita arrancar con un pisotón. En un lugar seguro, toma algo de movimiento con un impulso suave y pedalea con poca presión mientras buscas un cambio liviano. Si estás en una subida o no puedes partir con control, bájate y prepara la marcha antes de continuar.

En una transmisión con desviador, mover la manilla con la bici quieta no basta para que la cadena cambie de piñón: debe avanzar. No intentes completar el cambio haciendo mucha fuerza de golpe.

## Cambia con los pedales en movimiento y menos fuerza
Anticipa una subida y elige un cambio liviano antes de que pedalear se vuelva muy duro. Al cambiar, sigue girando los pedales pero afloja momentáneamente la presión. Retoma el esfuerzo cuando el cambio haya entrado.

Así reduces los golpes y cambios bruscos en la transmisión. Buen uso y mantención ayudan a cuidar cadena, platos y piñones; no garantizan que nunca aparezca un salto.

## Qué es la cadena cruzada
En bicicletas con dos o tres platos, algunas combinaciones dejan la cadena muy diagonal: plato grande con piñón grande, o plato pequeño con piñón pequeño. Evita mantener esas combinaciones extremas; pueden aumentar el roce, el ruido y el esfuerzo sobre la cadena.

Usa los platos y piñones según el terreno y busca una línea de cadena menos diagonal. Aprovechar el rango significa elegir una marcha cómoda para cada situación, no obligarte a pasar por todas en cada salida.

## Si tienes un solo plato, es diferente
En una bici monoplato, usar siempre ese plato es normal: el sistema está diseñado para trabajar con su cassette compatible. Aprovecha los piñones traseros según la pendiente y tu ritmo. No le apliques la regla de cruces entre dos platos.

## Limpieza, lubricación y desgaste
Limpia la suciedad antes de lubricar. Usa un producto adecuado a tus condiciones y sigue sus instrucciones; en rutas polvorientas evita dejar la cadena cubierta de lubricante sobrante. Una cadena encerada requiere su propio proceso de preparación.

Revisa el desgaste con un medidor adecuado a tu cadena y consulta el criterio del fabricante. Cambiarla a tiempo ayuda a evitar desgaste acelerado de otros componentes.

## Si aparece el “tak tak” o la cadena salta
Afloja el esfuerzo y revisa la transmisión. Puede haber desgaste de cadena o cassette, un cambio mal ajustado u otro problema; el ruido no demuestra por sí solo que doblaste un diente.

Si se repite, conviene un diagnóstico antes de seguir exigiendo la bici. No intentes solucionarlo pedaleando más fuerte.

## Qué recordar en tu próxima salida

- Antes de parar, deja una marcha liviana si puedes hacerlo con control.
- Arranca progresivamente y cambia con menos presión en los pedales.
- Evita cruces extremos si tienes varios platos.
- Mantén la cadena limpia y revisa su desgaste.`,
  },
  {
    slug: "revision-antes-de-salir",
    title: "La revisión de 2 minutos antes de cada salida",
    excerpt: "Cinco chequeos rápidos que evitan la mayoría de los problemas en ruta.",
    date: "2026-07-18",
    readingMinutes: 2,
    body: `No necesitas herramientas para esta revisión. Hazla antes de cada salida y te ahorrarás sorpresas.

## 1. Presión
Aprieta los neumáticos o usa el bombín con manómetro.

## 2. Frenos
Aprieta ambas manillas: deben frenar firme antes de tocar el manubrio.

## 3. Ruedas
Revisa que los cierres o ejes pasantes estén bien apretados.

## 4. Cadena
Que esté lubricada y no haga ruido.

## 5. Kit de emergencia
Cámara o sellante, parches, bombín y multiherramienta. Todo cabe en un bolso pequeño.`,
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
