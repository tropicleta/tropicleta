# Biometría y bike fitting orientativo — primera versión

Ruta: `/biometria/`. Acceso en el pie de página → Ayuda y más información; incluida en sitemap. Componentes y estilos propios para evitar interferencias con el calculador de SAG.

## Implementación

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

[Millour et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32022807/) describe la referencia estática de flexión de rodilla **25–35°**, sentado con el pedal en el punto más bajo. Su estudio diferencia las condiciones estáticas y dinámicas. Esta versión sólo compara en foto/captura detenida cuando la persona confirma posición del pedal y encuadre. Indica dentro/fuera de referencia sin ordenar cambios de sillín o diagnosticar problemas.

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
