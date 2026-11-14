# Limpieza de transmisión y encerado SILCA

Cambio solicitado por el propietario para www.tropicleta.com y tropicleta-prueba.netlify.app.

- Limpieza de piñón, coronas y roldanas, ultrasonido en cadena, encerado por inmersión con SILCA Secret Chain Blend y retiro/montaje: $30.000.
- Limpieza y reencerado de cadena previamente encerada, sin aceite añadido, con retiro/montaje: $15.000. No incluye limpieza del resto de la transmisión. Desengrase profundo por aceite añadido se cotiza aparte.
- Se usa Secret Chain Blend sin aditivos EnduranceChip ni SpeedChip.
- Nueva imagen: `public/catalogo/compacto/transmision-silca-v2.webp`. El original `6.jpg` se conserva como respaldo; el carrusel usa la nueva ruta para evitar imágenes antiguas en caché.
- Se actualizan las dos bases separadas: `neondb` y `tropicleta_netlify_test`, exclusivamente la ficha existente `limpieza-ultrasonica-encerado` y el nuevo servicio `limpieza-reencerado-cadena`.
- Nuevas claves de caché de catálogo e inicio para reflejar los valores tras el despliegue. No modifica DNS, credenciales ni conexión de Netlify a producción.

Imagen creada con la herramienta integrada ImageGen, modo edición. Prompt: conservar el cartel original, logo, foto y los dos servicios de $15.000; actualizar el bloque inferior a limpieza de transmisión + encerado SILCA $30.000, detallar piñón/coronas/roldanas y ultrasonido en cadena, y añadir limpieza y reencerado $15.000 para cadenas ya enceradas sin aceite añadido. Salida convertida a WebP de 1080 px.
