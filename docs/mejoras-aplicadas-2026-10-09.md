# Correcciones de distribución y funcionamiento

Aplicadas tras la revisión del sitio público y la inspección de sus componentes:

- Icono ICO corregido: las imágenes interiores ahora incluyen RGBA. El error anterior bloqueaba la compilación.
- Página 404 del sitio con su propio contenido, usando el encabezado y pie del diseño existente sin duplicarlos.
- Listas de Garantía y Privacidad separadas correctamente debajo de sus títulos.
- Etiquetas flotantes de Tropi y WhatsApp ocultas; se conservan los dos botones accesibles.
- Controles de cantidad de 44 × 44 píxeles en fichas y carrito.
- Nombres completos en las tarjetas de la tienda y precios alineados abajo.
- Tres líneas reservadas para los títulos de Recomendados, evitando tarjetas excesivamente largas.
- Títulos generales más pequeños y con mejor interlineado en móvil.
- Tarjetas informativas de Taller móvil en una columna para teléfonos estrechos.
- Menos espacio reservado entre títulos y descripciones de las publicaciones de Instagram.
- Disponibilidad en singular cuando queda una unidad.

## Verificación

TypeScript correcto. Compilación completa de Next.js correcta, incluyendo la generación de 29 páginas estáticas. Prueba de renderizado correcta: una lista inmediatamente bajo un título produce elementos de lista y conserva el párrafo posterior.

La última modificación posterior a la compilación ajusta únicamente CSS de títulos y alineación de precios.

## Límite de la revisión

La conexión del navegador se interrumpió en las comprobaciones visuales finales. No se afirma que todas las pantallas o botones estén probados. Queda verificar visualmente en producción móvil y computador, especialmente carrito, filtros y cotización. No se hicieron pagos ni se enviaron formularios.

Se conservan las preferencias del usuario: tarjetas compactas sin fotos de productos, texto Tropi/cleta, borde activo, fondos originales y fondo oscuro únicamente en los iconos del navegador.
