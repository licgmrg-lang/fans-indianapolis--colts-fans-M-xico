# Plan de aceptación de Firebase y roles

Este plan valida la primera entrega conectada a Firebase antes de marcar el pull request como listo para fusionar.

## Preparación

- Usar un navegador privado para cada identidad y evitar sesiones mezcladas.
- Crear tres cuentas de prueba: un `member`, un `admin` y el `primary_owner` con `lic.gmrg@gmail.com`.
- El Primary Owner debe asignar el rol `admin` desde la consola de administración; ningún administrador puede asignarse roles.
- Conservar la consola de Firebase abierta para confirmar documentos y errores de permisos.

## Matriz de permisos

| Caso | Member | Admin | Primary Owner |
| --- | --- | --- | --- |
| Iniciar sesión y leer datos comunitarios | Permitido | Permitido | Permitido |
| Editar su fotografía y perfil | Permitido | Permitido | Permitido |
| Ver la pestaña Administración | Denegado | Permitido | Permitido |
| Ver el selector Rol Simulado | Denegado | Denegado | Permitido |
| Crear o cerrar eventos y registrar asistencia | Denegado | Permitido | Permitido |
| Moderar publicaciones | Denegado | Permitido | Permitido |
| Cambiar roles de miembros | Denegado | Denegado | Permitido |
| Cambiar correo o rol del Primary Owner | Denegado | Denegado | Denegado |
| Modificar o borrar tómbolas y auditorías existentes | Denegado | Denegado | Denegado |

## Flujos funcionales

1. Registrar un miembro nuevo con correo y contraseña; comprobar que Firestore crea `members/{uid}` con rol `member`.
2. Cerrar sesión e iniciar sesión nuevamente; comprobar que el perfil y la fotografía se conservan.
3. Publicar en el muro como miembro; comprobar estado `pending` y visibilidad para el autor.
4. Aprobar la publicación como administrador; comprobar que los demás miembros pueden verla.
5. Crear una quiniela como miembro y actualizarla; intentar modificar la de otro usuario y comprobar `permission-denied`.
6. Registrar asistencia como administrador y comprobar el incremento correspondiente en el perfil.
7. Ejecutar una tómbola; comprobar que el resultado y la auditoría no pueden editarse ni borrarse.
8. Entrar como Primary Owner, alternar el rol simulado y confirmar que el selector nunca aparece en las otras cuentas.

## Criterio de salida

- El flujo automático de GitHub finaliza en verde.
- Todos los casos anteriores coinciden con la matriz, sin escrituras inesperadas en Firestore.
- No existen errores de consola fuera de rechazos intencionales por permisos.
- Antes de abrir el acceso público, App Check queda habilitado para el dominio definitivo.
