# Penca Chilena

App instalable (PWA) para hacer pronósticos de la Primera División de Chile con tus amigos.
Funciona en Android y iPhone desde un enlace, en tiempo real, y se actualiza sola cada temporada.

**Costo: US$0.** Usa Supabase (base de datos), GitHub Pages (hosting) y GitHub Actions (sincronización), todos en plan gratuito.

Puntos: 8 resultado exacto, 5 ganador y diferencia de goles, 3 ganador, 0 nada.

## Puesta en marcha (30 minutos, desde un computador)

### 1. Base de datos (Supabase)
1. Crea una cuenta en supabase.com y un proyecto nuevo (plan Free).
2. Abre **SQL Editor**, pega todo `supabase/schema.sql` y presiona **Run**.
3. Configura **Authentication** para las cuentas:
   - En **URL Configuration**, usa la URL pública de GitHub Pages con la barra final como **Site URL** y agrégala a **Redirect URLs**.
   - En **Sign In / Providers**, mantén habilitado **Email**. Configura **Custom SMTP** para que Supabase pueda enviar enlaces a los jugadores. Usa la plantilla **Magic Link** con `{{ .ConfirmationURL }}`.
   - Para **Google**, crea un cliente OAuth de tipo aplicación web en Google Cloud. Copia en Google la URL de callback que muestra Supabase. Carga el ID y el secreto del cliente en el proveedor **Google** de Supabase.
   - Activa **Allow manual linking** para que los jugadores con una sesión anónima previa puedan vincular ese mismo perfil.
4. Ve a **Project Settings > API**. Copia la **Project URL** y la clave **anon public** y pégalas en `config.js`.
   Copia también la clave **service_role** (secreta, solo para el paso 3).

### 2. Publicar la app (GitHub Pages)
1. Crea un repositorio **público** en GitHub y sube todo el contenido de esta carpeta.
2. En el repositorio: **Settings > Pages**, elige la rama `main` y la carpeta `/ (root)`.
3. En unos minutos tendrás un enlace tipo `https://tuusuario.github.io/penca-chilena/`.

### 3. Partidos automáticos (ESPN + GitHub Actions)
No necesita clave de datos: usa la API pública de ESPN.
1. En el repositorio: **Settings > Secrets and variables > Actions > New repository secret**. Crea dos:
   - `SUPABASE_URL`: la Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: la clave service_role (o la "secret" si tu panel solo muestra claves nuevas)
2. Ve a **Actions > Sincronizar partidos > Run workflow**. Si sale verde, los partidos ya están en la app.
   Desde ahí corre solo cada 20 minutos.

### 4. Instalar en el celular
Abre el enlace de GitHub Pages. En Android: menú del navegador > **Instalar app**. En iPhone (Safari): **Compartir > Añadir a pantalla de inicio**.
Crea un grupo, comparte el código de 5 letras y listo.

## Cómo funciona
- Cada jugador entra con Google o con un enlace enviado por correo. En el primer acceso elige el nombre que verán sus amigos. Si ya tenía una sesión anónima, puede vincularla a una cuenta desde el navegador original.
- El primer valor queda como borrador en ese navegador. Cuando ambos goles son válidos, la app guarda el marcador automáticamente y muestra su estado en el partido.
- Los pronósticos se cierran al comenzar el partido y lo exige el servidor, no solo la app.
- Cada jugador ve los pronósticos de quienes comparten grupo con él, también de partidos futuros.
- Cada temporada es el año calendario. El script usa el año actual, así que desde enero la nueva temporada aparece sola y las anteriores quedan en el selector.

## Si algo falla
- **El workflow sale en rojo:** abre el registro de la ejecución. ESPN no es una API oficial y podría cambiar; si falla, cargas o corriges partidos a mano en Supabase (**Table Editor > matches**, columnas `hg` y `ag`).
- **Un partido se aplazó:** se corrige solo en la siguiente sincronización.
- **GitHub pausa los workflows programados** si el repositorio pasa 60 días sin cambios. Si ocurre, entra a Actions y reactívalo.

## APK para Android (opcional)
No hace falta para jugar: el enlace ya se instala desde el navegador. Si prefieres un APK para mandar por WhatsApp:
1. Entra a pwabuilder.com, pega el enlace de GitHub Pages y elige **Package for stores > Android**.
2. Descarga el APK y envíalo. Si WhatsApp no deja enviar `.apk`, súbelo a Google Drive y comparte el enlace.
3. Cada amigo debe permitir "instalar apps de orígenes desconocidos" en su Android.
Los iPhone no pueden instalar APK: ellos usan el enlace con "Añadir a pantalla de inicio".

## Tiendas de aplicaciones
Esta versión no está en Google Play ni en App Store porque ambas cobran cuenta de desarrollador (Google US$25 una vez, Apple US$99 al año) y revisan cada app. La versión instalable desde el navegador se ve y funciona igual. Si más adelante quieres las tiendas, esta misma app se puede empaquetar sin reescribirla.
