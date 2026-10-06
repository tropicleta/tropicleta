# Acceso al administrador

La contraseña continúa en ADMIN_PASSWORD y no se cambia durante esta actualización.

ADMIN_LOGIN_EMAIL activa el segundo paso por correo. Requiere RESEND_API_KEY y un EMAIL_FROM autorizado por Resend. Configurar solo en Production. El correo elegido por el dueño se guarda como variable de entorno y no en el repositorio.

El código es aleatorio, caduca en 10 minutos, admite 5 intentos y se consume una sola vez. Solo se guarda su firma, junto con una huella de la configuración de acceso. La cookie del paso pendiente es HTTP-only, Secure en producción, SameSite Strict y restringida al host. No se registra el código en consola.

Los envíos se limitan a 5 por 15 minutos; requieren previamente la contraseña correcta. El correo no concede acceso sin completar ese primer paso.

La sesión final usa un identificador aleatorio y firmado, registrado mediante un hash en la base de datos. Caduca a las 8 horas o tras 30 minutos sin actividad de solicitudes autenticadas. Cerrar sesión elimina el registro: una copia de la cookie tampoco vuelve a entrar. Cambiar contraseña, secreto o correo autorizado invalida las sesiones anteriores.

Los intentos de contraseña se reservan de forma atómica, con 5 por IP cada 15 minutos. Esto evita superar el límite mediante solicitudes simultáneas. No equivale a un bloqueo global contra una red distribuida; el segundo paso es la defensa adicional.

## Activación y recuperación

1. Confirmar con el dueño el correo autorizado y guardarlo en ADMIN_LOGIN_EMAIL de Production.
2. Publicar y pedir al dueño que ingrese su contraseña y complete el código recibido. Las sesiones del formato anterior se cierran.
3. Verificar que el código abre el panel, no puede reutilizarse y que Salir impide volver con la misma sesión.
4. Si falla la entrega, corregir Resend/remitente antes de dar por completada la activación. No eliminar el segundo paso para resolverlo sin participación del dueño.

Para cambiar el correo de recuperación hace falta acceso al proyecto en Vercel y participación del dueño. Proteger también ese acceso con el segundo factor pendiente documentado en mejoras-pendientes.md. Esta protección del panel es independiente de la seguridad de la cuenta de Vercel.
