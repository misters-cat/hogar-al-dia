# Próximo paso: sincronización entre iPhone y computador

La versión actual funciona únicamente **en el dispositivo donde la abres**. Este directorio prepara la migración futura a Supabase; no activa sincronización por sí solo.

## Pasos
1. Crear un proyecto **separado** de Supabase para Hogar al Día (preferible a mezclarlo con AutoWallet).
2. Configurar Supabase Auth por correo y URL de redirección hacia `https://misters-cat.github.io/hogar-al-dia/`.
3. Ejecutar `schema.sql` en SQL Editor para crear tabla y políticas RLS.
4. Integrar en la app la URL del proyecto y la **publishable key**. Ambas se pueden usar públicamente **solo si RLS está correctamente activado y probado**. Nunca guardar una `service_role` o contraseña en GitHub Pages.
5. Agregar pantalla de sesión, sincronización por mes y tratamiento de conflictos (no sobrescribir silenciosamente cambios simultáneos). Probar desde dos dispositivos con el mismo usuario y desde otro usuario, que no debe poder leer esos datos.
6. Hacer un respaldo JSON antes de migrar datos locales y permitir importar una sola vez después del inicio de sesión.

## Seguridad y presupuesto
- GitHub Pages aloja archivos públicos de la interfaz; **nunca** subas JSON con tus gastos, contraseñas, tokens de sesión o claves privadas.
- Los datos se guardarán en Supabase y se protegerán con RLS por usuario. El acceso a la aplicación no implica acceso libre a sus datos.
- Gratis mientras el uso se mantenga dentro de los límites vigentes del plan gratuito; Supabase puede pausar proyectos inactivos y cambiar condiciones. Consultar el plan antes de activar.
- Aun con sincronización, se recomienda mantener exportación de respaldo.
