# Hogar al Día — microapp de presupuesto familiar

App estática y gratuita para anotar **presupuestado vs. pagado**, ingresos previstos y recibidos, saldos, presupuesto pendiente y meses independientes. Interfaz responsive para iPhone, Android y computador.

## Funcionalidades

- Control mensual; al pasar a otro mes nuevo, copia categorías y presupuestos anteriores, pero reinicia los pagos y los ingresos recibidos.
- Gasto editable en la misma pantalla, con estados Pendiente / Pago parcial / Pagado / Excedido.
- Editar, crear y eliminar categorías de gastos, añadir notas, registrar múltiples fuentes de ingresos.
- Saldo disponible = ingresos recibidos − gastos pagados.
- Saldo previsto = ingresos previstos − gastos presupuestados.
- Presupuesto pendiente = suma de `máximo(0, presupuestado − pagado)` por categoría, **no necesariamente deudas exigibles**.
- Respaldo/Restauración de todos los meses en JSON; exportación CSV del mes.
- Instalable como PWA y acceso sin conexión tras la primera visita en línea.

## Privacidad

El repositorio solo contiene el **código**, sin datos económicos personales. La app guarda toda la información localmente con `localStorage` del navegador/dispositivo: no requiere servicios adicionales, servidor, cuentas ni claves. No existe sincronización entre dispositivos. Borrar los datos del navegador, desinstalar una PWA o cambiar de dispositivo puede eliminar los registros. Descarga regularmente el respaldo JSON y guárdalo fuera de un repositorio público, idealmente en almacenamiento privado. `localStorage` no está cifrado por la app.

**El archivo privado de ejemplo de la planilla se entrega por separado. No subirlo a GitHub.**

## Publicar gratis con GitHub Pages

1. Crea un repositorio nuevo **público** con nombre sugerido `hogar-al-dia` en GitHub. El plan GitHub Free admite Pages para repositorios públicos.
2. Sube **los archivos individuales** de esta carpeta a la raíz de la rama `main`: `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `favicon.svg`, `icon-192.png`, `icon-512.png`, `.nojekyll` y `README.md` (no subas un ZIP sin extraer).
3. En el repositorio entra a **Settings → Pages**. En **Build and deployment** elige **Deploy from a branch**, rama `main`, carpeta `/(root)` y **Save**.
4. Espera la publicación y entra a `https://TU-USUARIO.github.io/hogar-al-dia/`.
5. En iPhone: abre esa URL en Safari → botón Compartir → **Agregar a pantalla de inicio**. En Android/Chrome: opción **Instalar aplicación** o **Añadir a pantalla principal**.
6. En la microapp usa **Restaurar respaldo** para introducir tus montos privados desde el JSON suministrado aparte. No cargues tu respaldo en el repositorio público.

No hay que contratar Netlify, Supabase, ni comprar dominio. PWA usa rutas relativas, por lo que funciona en la subcarpeta de GitHub Pages.

## Desarrollo local

Cualquier servidor web estático sirve, por ejemplo `python3 -m http.server 8000` y `http://localhost:8000/`. Para desarrollo, el proyecto no necesita Node ni ninguna compilación.

## Nota

Los valores pueden superar el presupuesto, y se distinguen correctamente del total pendiente. Los cálculos son orientativos y no equivalen a un estado de cuenta bancario ni reemplazan el respaldo de datos.

## Sincronización futura

Para usar el mismo presupuesto desde iPhone y computador, se incorporará Supabase Auth + base de datos PostgreSQL con RLS. El esquema SQL preliminar y las instrucciones están en [`supabase/`](./supabase/SETUP.md). **Aún no está activado**: no introduzcas datos reales en más de un dispositivo esperando que se repliquen.
