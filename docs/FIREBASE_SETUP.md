# Activación de Firebase para Project Horseshoe

La aplicación permanece en modo local hasta proporcionar la configuración web de un proyecto Firebase. Esta preparación no incluye claves privadas ni cuentas de servicio.

## Servicios requeridos

1. Firebase Authentication con el proveedor Google.
2. Cloud Firestore en modo producción.
3. Cloud Storage.
4. App Check para la aplicación web, antes de abrir el acceso al público.

## Variables web

Copiar `.env.example` como `.env.local` y completar los seis valores del SDK web de Firebase. Estos identificadores se pueden publicar en el cliente; la protección real depende de `firestore.rules`, `storage.rules`, Authentication y App Check.

En Sites, cargar los mismos valores como variables de producción. No agregar archivos de cuenta de servicio al repositorio.

## Dominios autorizados

Agregar como dominio autorizado en Firebase Authentication:

- `project-horseshoe-mx.lic-gmrg.chatgpt.site`
- El dominio definitivo de la comunidad, cuando exista.

## Seguridad inicial

- El correo `lic.gmrg@gmail.com` se reconoce como Primary Owner.
- Todo usuario nuevo se crea exclusivamente con rol `member`.
- Los roles administrativos se cambian desde una operación autorizada del Primary Owner.
- La bitácora y los sorteos no permiten actualización ni eliminación desde el cliente.
- Las fotografías se limitan a imágenes menores de 5 MB.

## Despliegue de reglas

Los archivos `firebase.json`, `firestore.rules`, `storage.rules` y `firestore.indexes.json` están listos para asociarse al proyecto Firebase seleccionado. Antes de desplegarlos se deben ejecutar las pruebas del emulador con cuentas de member, admin y Primary Owner.
