# Tropi: fuente del juego y ranking

La fuente de esta carpeta reproduce el juego publicado en `230d0e7` (la única adaptación previa era la ruta del audio). Los módulos antiguos de `public/juegos/tropi/*.mjs` no son la entrada del juego: el HTML carga `bike.js`.

- `npm run build:tropi` regenera el bundle público y la versión compartida del modelo. Ejecutarlo después de modificar el juego; guardar también `ruleset.mjs`, `bike.js` y el HTML actualizado.
- `npm run test:tropi` verifica replay, firmas, apodos, duplicados, errores de red y reintentos.
- `GET /api/tropi/` devuelve los 20 mejores resultados. `POST` inicia una partida, comprueba cada nivel reproduciendo sus controles y guarda al completar los cinco niveles.
- El servidor deriva una clave exclusiva para el juego desde `SESSION_SECRET`. No se envían claves al navegador.
- La migración `0024_tropi_scores.sql` agrega una tabla independiente. En Netlify el rol de la aplicación necesita `SELECT, INSERT` sobre ella. No ejecutar semillas ni migraciones de catálogo para habilitar el ranking.
- Los reintentos en la misma pestaña son válidos. Una recarga a mitad de un nivel puede recuperar el checkpoint del juego, pero sin el recorrido completo no permite registrar ese resultado. Se acepta hasta 16 minutos y 40 segundos de simulación por nivel, incluidos reintentos.
- La tabla aparece al terminar. Los apodos son públicos y opcionales; el juego funciona aunque el ranking no esté disponible.
