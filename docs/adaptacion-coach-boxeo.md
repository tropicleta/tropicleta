# Revisión de coach-boxeo como referencia para bike fitting

Solicitud: 8 de octubre de 2026. Repositorio indicado por el usuario: https://github.com/clacof/coach-boxeo.git. Revisado mediante acceso Git autorizado, commit `3108bd49a2d677f09b8d27db1608234add584469`.

## Hallazgos

- Ambos proyectos emplean MediaPipe Pose Landmarker y procesamiento de cámara en el navegador. Tropicleta ya dispone de assets locales y análisis en un worker; no hace falta reemplazar ese motor para adoptar mejoras de presentación.
- coach-boxeo usa MediaPipe 0.10.14, Vite y TypeScript. Tropicleta utiliza el runtime 0.10.32 con Next.js. No trasladar sin adaptar los imports, el ciclo de vida del detector ni la configuración de assets.
- Aspectos aprovechables: filtros de coordenadas (EMA/One Euro), estabilización temporal y banda muerta de avisos, estados neutrales cuando faltan datos, guía de encuadre y consejo prioritario.
- Las reglas de guardia, golpes, combos y las puntuaciones de boxeo no sirven como criterio biomecánico de ciclismo. Tampoco se deben aplicar los grados de una ilustración como objetivos universales.
- Las coordenadas 3D estimadas por el modelo no equivalen a una medición 3D calibrada. Mantener la toma de perfil y los límites explícitos de las comparaciones estáticas.
- Si se estabilizan colores, neutralizar inmediatamente la lectura cuando falta confianza o se retira una confirmación. No conservar un verde anterior sobre datos inválidos. Explicar cualquier promedio o demora; las fotos no necesitan estabilización temporal.
- No se encontró un archivo LICENSE en la copia revisada. Se pueden desarrollar las mejoras con implementación propia a partir de estas ideas, sin copiar archivos del repositorio.

## Alcance confirmado e implementación

El usuario confirmó mejorar el bike fitting de Tropicleta y crear un repositorio privado. Se preparó una versión independiente llamada `tropicleta-bike-fitting`, con el componente, assets y pruebas, sin tienda, bases de datos, cuentas o credenciales.

Implementación propia: suavizado exponencial de coordenadas únicamente en cámara; la confianza no se suaviza. Tres lecturas de rodilla con variación máxima de 3° habilitan la comparación en vivo una vez confirmada la postura estática. Es una condición de estabilidad visual, no una prueba de precisión ni detección del pedal. Pérdida de confianza, cambio de lado, resolución o sesión reinician el filtro. La foto y la captura detenida conservan los puntos sin suavizado. Las referencias de rodilla no cambian.

El código de referencia sólo se descargó para lectura; no se instalaron dependencias ni se ejecutó.
