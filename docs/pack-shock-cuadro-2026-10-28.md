# Pack solicitado: shock + cuadro

Alta mediante el proceso de datos del despliegue (`src/db/requested-packs.ts`), sin depender del inicio de sesión en el panel. El registro de auditoría impide que se sobrescriban cambios posteriores o se reponga un pack renombrado/eliminado.

- Nombre: Pack shock + cuadro (doble suspensión).
- Slug propuesto: pack-shock-cuadro.
- Precio fijo: $70.000 CLP.
- Componentes obligatorios: servicio-amortiguador ($50.000) y servicio-al-cuadro ($25.000).
- Valor individual: $75.000. Ahorro: $5.000.
- Compatible con bicicleta; solo corresponde a bicicletas de doble suspensión, según el nombre y la descripción. El cotizador actual usa categorías Bicicleta y Scooter, sin selector independiente de doble suspensión.
- Resumen: Servicio de shock y del cuadro de tu bicicleta de doble suspensión.
- No sustituye al pack-doble-suspension de $140.000 que ya está publicado: su composición es distinta.
- Al crear el pack con ambos componentes obligatorios, el motor actual puede reconocerlo al elegir los dos trabajos y evita cobrarlos otra vez como extras.

La inserción comprueba que ambos componentes estén activos, sean compatibles con Bicicleta y cuesten $50.000 y $25.000. Los dos son obligatorios. Prueba automatizada en una base temporal: $70.000 por selección directa y por reconocimiento de los dos servicios; ahorro de $5.000, sin cobro duplicado ni alteración del pack anterior. Un segundo despliegue conserva el precio y estado editados por administración, incluso tras renombrar el servicio.
