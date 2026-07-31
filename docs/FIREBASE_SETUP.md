# Firebase para Project Horseshoe

Proyecto vinculado: `project-indianapolis-mx` (`1040303816366`). La app web registrada se llama **Project Horseshoe Web**.

## Configuración ya realizada

- Firebase Web App registrada.
- Plan Spark conservado, sin facturación.
- Authentication habilitado con correo/contraseña.
- Google Sign-In habilitado con `lic.gmrg@gmail.com` como correo de soporte.
- Nombre público OAuth: `Project Horseshoe México`.
- Variables públicas del SDK cargadas en Sites.
- Cliente de Authentication y sincronización Firestore implementado en `app/firebase/client.ts`.
- Cloud Firestore `(default)` creado en modo producción y región `nam5`.
- `firestore.rules` publicado correctamente desde la consola.

## Estado de backend

La base Standard utiliza `nam5 (United States)`, ubicación permanente confirmada por el propietario. El plan Spark se mantiene sin facturación.

Siguientes tareas operativas:

1. Publicar `firestore.indexes.json` cuando se incorporen consultas compuestas; la implementación actual sincroniza colecciones completas y no depende de esos índices.
2. Probar registro, inicio de sesión y permisos con cuentas `member`, `admin` y `primary_owner`.
3. Activar App Check antes de abrir el acceso al público.

Cloud Storage se evaluó y Firebase exige actualizar el proyecto a Blaze. No se activó facturación; las fotografías continúan usando URL o datos locales sincronizados mientras se decide el proveedor de archivos.

## Variables web

Copiar `.env.example` como `.env.local` y completar los valores del SDK web. Son identificadores públicos; la protección real depende de Authentication, reglas y App Check. No agregar cuentas de servicio al repositorio.

## Dominios y proveedores

La consola de Firebase rechazó tanto `project-horseshoe-mx.lic-gmrg.chatgpt.site` como `lic-gmrg.chatgpt.site` como dominios OAuth autorizados. Por eso:

- Correo/contraseña es el proveedor compatible con la URL actual de Sites.
- Google Sign-In se muestra solo en `localhost`, `*.firebaseapp.com` y `*.web.app`.
- Un dominio propio futuro deberá añadirse a **Authentication → Configuración → Dominios autorizados** antes de mostrar Google Sign-In allí.

## Reglas de seguridad

- `lic.gmrg@gmail.com` se reconoce como Primary Owner mediante el token autenticado.
- Los usuarios nuevos solo pueden crear su propio documento con rol `member`; el Primary Owner puede crear su registro protegido.
- Los cambios administrativos requieren rol `admin` o `primary_owner`.
- Bitácora y sorteos son inmutables desde operaciones normales del cliente.
- Las fotografías se limitan a imágenes menores de 5 MB en `storage.rules`.
