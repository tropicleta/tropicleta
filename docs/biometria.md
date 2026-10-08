# Biometría y bike fitting orientativo — primera versión

Ruta: `/biometria/`. Acceso en el pie de página → Ayuda y más información; incluida en sitemap. Componentes y estilos propios para evitar interferencias con el calculador de SAG.

## Semáforo y guía visual (8 de octubre de 2026)

- Los segmentos cadera–rodilla y rodilla–tobillo se colorean cuando hay detección válida y las confirmaciones de perfil y postura estática sentada con pedal abajo están activas. Verde: 25–35°. Amarillo: hasta 5° fuera del rango. Rojo: más de 5° fuera. La banda amarilla es una decisión de interfaz para representar distancia; no es una tolerancia biomecánica validada ni demuestra mejoría.
- Sin comparación habilitada, y en todas las posturas de pie, las líneas son azules. Los brazos y el tronco no reciben un juicio de ajuste derivado del parecido con el muñeco.
- La cámara permite ver colores en una postura quieta, sin pedalear, mediante confirmación explícita. No se detecta el pedal ni la fase del ciclo: el usuario debe desmarcar la confirmación antes de moverse. Una captura detenida exige confirmar nuevamente el pedal. Las fotos siguen admitiendo la comparación estática original.
- Resultados con explicación visible: rodilla más extendida o más flexionada, repetir encuadre y apoyo del pie antes de revisar una posible altura excesiva o insuficiente del sillín. No se prescriben milímetros. Verde sólo describe esa referencia de rodilla.
- Ilustraciones con ambas piernas, pedales, apoyo en manetas en ruta/gravel, manillar alto para urbano y sillín bajo al observar de pie. Trail de pie usa una posición de preparación; enduro y DH muestran flexión mayor. Enduro sentado usa una pose distinta de su postura de pie. Proporciones corporales constantes y ángulos calculados con los mismos puntos dibujados.
- La guía aparece también junto a los resultados, para evitar volver al primer paso. La figura muestra una postura ilustrativa, no un objetivo personalizado.

Fuentes: [Millour et al.](https://pubmed.ncbi.nlm.nih.gov/32022807/) para la referencia estática de rodilla; [Canyon, guía de posición MTB](https://www.canyon.com/en-us/blog-content/mountain-bike-news/mtb-riding-position/b08012025.html) para las diferencias cualitativas entre posición de preparación y ataque. Ninguna fuente se usa para inventar grados ideales por disciplina.

Pruebas: geometría y proporciones de todas las ilustraciones; límites verde/amarillo/rojo, datos ausentes y orientación de los mensajes. La cámara física y la precisión biomecánica no se validaron con estas pruebas.

## Implementación

Módulos por disciplina: Ruta/Gravel/Urbano priorizan rodilla, tronco y apoyo de brazos en toma sentada; XC inicia con rodilla y relación tronco–muslo; Trail ofrece sentado o de pie; Enduro inicia de pie y ofrece pedaleo sentado por separado; DH sólo permite observación de pie. La selección cambia preparación, apoyo de manos, prioridades e interpretación. Sólo la toma sentada habilita comparación estática de rodilla. No se han creado rangos ideales por disciplina ni un diagnóstico de alcance, manetas o control en terreno. Cambiar módulo borra la captura y sus confirmaciones. `node tests/bike-fit-modules.cjs` comprueba recorridos permitidos, prioridad de datos y exclusión del rango sentado en postura de pie. Chequeo de tipos de la sección completado; prueba de navegador actualizada pero no ejecutada debido al bloqueo previo de la herramienta de navegación.

Recorrido simplificado para primera visita (8 de octubre): inicio con dibujo y tres instrucciones breves; disciplina/postura y cifras del dibujo quedan en desplegables opcionales. La foto es la opción inicial y la cámara una alternativa. Resultados no accesibles sin imagen o durante el análisis; comparación y valores reales aparecen después de confirmar perfil y confianza suficiente. El ejemplo evita confirmaciones deshabilitadas y ofrece «Ahora probar con mi foto». Volver a preparación apaga una cámara activa conservando la última captura. Los mensajes diferencian preparación del motor y búsqueda de articulaciones. Verificación de tipos de la sección satisfactoria. En este turno la herramienta de navegación bloqueó la página local: revisión de secuencia basada en código, sin afirmar una navegación real ni ejecutar un navegador alternativo.

Mejora de experiencia: guía SVG de ciclista lateral con cabeza/manos/pies y pedal abajo; ejemplo interactivo con puntos y ángulos **simulados**, usable sin consentimiento/cámara y separado de la comparación de datos reales. El ejemplo desplaza la vista a la captura para hacer visible su resultado. El consentimiento sigue siendo obligatorio para cámara/fotos. Se muestra la cámara o foto mientras se prepara el motor, actividad en vivo, checklist y siguiente paso. Los puntos con confianza suficiente aparecen antes de confirmar perfil; los valores y comparaciones reales siguen requiriendo esa confirmación. El lado inicial se selecciona por visibilidad y se puede corregir manualmente. La comparación estática añade una escala visual y un estado dentro/fuera de referencia; ninguna señal verde certifica un ajuste correcto.

- Cámara con consentimiento explícito, sin audio; preferencia de cámara trasera. HTTPS o localhost requerido. Mensajes para permisos denegados, cámara inexistente/ocupada y navegador incompatible.
- Foto local JPG/PNG/WebP hasta 15 MB. HEIC requiere conversión previa. Sin formularios de subida, almacenamiento, historial ni llamadas a APIs para analizar imágenes.
- MediaPipe Pose Landmarker Lite, Tasks Vision 0.10.32, assets versionados en `public/biometria/vendor/`. Un Web Worker clásico carga el módulo mediante import dinámico: el cargador WASM requiere `importScripts`, por lo que un worker de tipo module no funciona con esta versión.
- Inferencia CPU fuera del hilo de interfaz, imágenes reducidas a máximo 960 px y una única inferencia en curso. Cámara con un intervalo mínimo de 200 ms después de cada resultado (menos de 5 muestras/s). Variante WASM sin SIMD disponible.
- La vista y los puntos corresponden al mismo fotograma analizado. Detener la captura apaga cámara/worker y conserva sólo la última vista en memoria para revisión. Borrar, retirar consentimiento, salir o cambiar de pestaña libera cámara, worker e imágenes.
- Una única persona; selección explícita del lado del ciclista. Filtros de visibilidad 0,75, cabeza y articulaciones del lado elegido dentro del margen de 2,5%, ocupación vertical mínima de 30%, segmentos no degenerados. La presencia/detección global usa 0,65. **El SDK JS fijado expone visibility, no presence por articulación.**
- Confirmación manual de vista lateral y bicicleta completa. El modelo no detecta bicicletas ni valida perspectiva. No se muestran ángulos sin confirmación o cuando falla un filtro.
- Ángulos 2D en coordenadas de píxeles, corrigiendo la proporción ancho/alto. Flexión de rodilla = 180° menos el ángulo cadera–rodilla–tobillo; cadera = hombro–cadera–rodilla; codo = hombro–codo–muñeca; tronco respecto a horizontal. No hay medidas de centímetros.

## Viabilidad y elección

[MediaPipe Tasks Vision](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js) soporta 33 landmarks, imágenes y vídeo, y visibilidad de articulaciones. Google advierte que la inferencia es síncrona: se trasladó a un worker. Lite reduce consumo y peso; CPU evita exigir WebGL dentro del worker. El primer arranque descarga aproximadamente 17–18 MB (modelo ~5,8 MB + una variante WASM ~11 MB + JS), después depende de la caché HTTP del navegador. No se garantiza rendimiento universal ni funcionamiento offline inicial.

También se revisó [TensorFlow.js Pose Detection](https://github.com/tensorflow/tfjs-models/blob/master/pose-detection/README.md), con MoveNet y BlazePose. MoveNet ofrece menos puntos (17; sin heel/toe), y TF.js incorpora una gestión de runtime/backend adicional. Tasks Vision permite este prototipo con un conjunto de assets pequeño y aislado, sin modificar package.json/lockfile. Ambos son modelos generales, no validaciones de bike fitting. No se evaluó precisión comparativa en ciclistas.

## Referencia y límites

### Revisión de criterio de bike fitting (7 de octubre de 2026)

- Recorrido Prepara / Captura / Revisa; selección de disciplina y de condición sentado/de pie accesible durante los tres pasos.
- Ejemplos por disciplina en `src/lib/fit-example.ts`: poses editoriales ilustrativas, sin atribuir sus grados a evidencia ni presentarlos como objetivos ideales. Los valores proceden de los mismos puntos que dibujan el SVG y el ejemplo de resultados. Cambiar disciplina durante el ejemplo actualiza imagen y ángulos; una captura real conserva su geometría.
- Longitudes de tronco, brazos, fémur y tibia constantes entre poses. Ejemplo sentado con pedal abajo; de pie con pedal a nivel. Cambia el manillar ilustrado, no las dimensiones del cuerpo.
- La referencia 25–35° solo se compara en captura estática, con postura sentada, perfil y pedal abajo confirmados. De pie queda deshabilitada en todas las disciplinas, no solo downhill. Elegir enduro o DH ofrece inicialmente el ejemplo de pie, pero permite observar por separado el pedaleo sentado.
- “Cadera” se precisa como ángulo tronco–muslo (hombro–cadera–rodilla); no representa flexión clínica de cadera. Codo es ángulo interno (180° recto); rodilla es flexión (0° recta). No mezclar convenciones ni ángulos tomados arriba/abajo del ciclo.
- Se recomienda repetir con el mismo apoyo de manos, calzado y posición de tobillo. Los grados redondeados no representan precisión clínica. No se indican cambios de milímetros ni se evalúa dolor desde una imagen.
- Consulta de [Holliday y Swart, 2021](https://pubmed.ncbi.nlm.nih.gov/35782160/) y [Wadsworth y Weinrauch, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6818133/): las características individuales y la definición de las medidas importan. No se obtuvo respaldo suficiente para objetivos universales de cadera/codo/tronco por cada disciplina.
- Pruebas de geometría añadidas para todas las disciplinas sentado/de pie; prueba del navegador para cambios de ejemplo y deshabilitación de comparación de pie. La comprobación técnica no valida precisión de bike fitting.

[Millour et al., 2019](https://pubmed.ncbi.nlm.nih.gov/32022807/) describe la referencia estática de flexión de rodilla **25–35°**, sentado con el pedal en el punto más bajo. Su estudio diferencia las condiciones estáticas y dinámicas. Esta versión sólo compara en foto/captura detenida cuando la persona confirma posición del pedal y encuadre. Indica dentro/fuera de referencia sin ordenar cambios de sillín o diagnosticar problemas.

[Bini et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24499342/) evalúa diferencias entre métodos de medición de bike fitting. La carga, el tobillo y la posición de la biela afectan el ángulo; una imagen estática no reproduce un análisis dinámico. No se extrapola el rango estático al pedaleo ni se dan rangos universales de cadera/codo/tronco.

Limitaciones reales: oclusión por bicicleta o ropa, errores de articulaciones, cámara oblicua, distorsión de lente, inclinación, ausencia de calibración y selección incorrecta del lado. No se detecta el pedal ni la fase de giro, no se calcula el mínimo de ciclos y no hay reconstrucción 3D calibrada. Confianza del modelo no equivale a precisión clínica. Requiere validación con ciclistas reales y mediciones profesionales antes de hacer recomendaciones de ajuste. No se publicaron datos ni se desplegó esta versión.

## Verificación

- `node --import tsx tests/bike-fit.test.ts`: geometría rectangular, segmentos degenerados, detección ausente, baja confianza, cuerpo cortado y coordenadas inválidas.
- `node tests/biometria-browser.mjs` contra servidor local en puerto 3012: vista desktop 1440 px y móvil 390 px sin desbordamiento; consentimiento; foto vacía con modelo/WASM real; cámara simulada; borrado; permiso denegado; incompatibilidad; ausencia de errores de página, assets fallidos o solicitudes a terceros.
- El smoke test permite `BIOMETRIA_POSE_FIXTURE` con la foto pública de ejemplo [pose.jpg](https://storage.googleapis.com/mediapipe-assets/pose.jpg) para verificar detección y visualización de ángulos. No es una foto de ciclismo ni una validación de precisión.
- `node node_modules/typescript/bin/tsc --noEmit -p tests/biometria-tsconfig.json`: pasó; revisa la ruta, componente, geometría y pruebas sin depender del caché de rutas generado por servidores concurrentes.
- `npm run typecheck`: pasó inicialmente; después del arranque simultáneo de servidores, falló por sintaxis de `.next/dev/types/routes.d.ts` (tipos generados de Next, fuera de esta sección). No se modificó ni eliminó ese caché compartido. Regenerar tipos o reiniciar un único servidor antes de repetir el chequeo global.
- La foto pública de MediaPipe detectó una persona y mostró los cuatro ángulos (4°, 120°, 172°, 81°). No es un ciclista ni comprueba exactitud biomecánica.

No se probó cámara física de un teléfono ni comparación con goniómetro. Las pruebas con cámara simulada comprueban el flujo técnico, no la precisión biomecánica.
