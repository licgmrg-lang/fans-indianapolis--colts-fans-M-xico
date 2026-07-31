# Project Horseshoe — Colts Fans México

PWA privada para la comunidad oficial de aficionados de los Indianapolis Colts en México. Reúne credencial digital con QR, watch parties, asistencias, sorteos, quiniela, muro moderado y memoria histórica en una sola experiencia responsive.

## Estado

- React 19, TypeScript, vinext/Vite y Tailwind CSS 4.
- PWA instalable con soporte offline.
- Persistencia local y respaldos JSON.
- Firebase Web App registrada en `project-indianapolis-mx`.
- Firebase Authentication habilitado para correo/contraseña y Google.
- Adaptador de sincronización en tiempo real para Cloud Firestore.
- Cloud Firestore `(default)` activo en `nam5` con reglas de seguridad publicadas.
- Índices compuestos y reglas de Storage preparados para el despliegue.
- Producción privada en [project-horseshoe-mx.lic-gmrg.chatgpt.site](https://project-horseshoe-mx.lic-gmrg.chatgpt.site/).

La PWA usa Firestore en tiempo real cuando existe una sesión autenticada y conserva `LocalStore` como caché offline. Firebase Storage permanece desactivado porque actualmente exige cambiar del plan gratuito Spark a Blaze.

## Desarrollo local

Requisitos: Node.js 22.13 o superior y pnpm.

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
```

Copiar `.env.example` como `.env.local` y completar la configuración pública del SDK web de Firebase. Nunca agregar cuentas de servicio o claves privadas al repositorio.

## Estructura principal

- `app/HorseshoeApp.tsx`: interfaz, módulos y orquestación de estado.
- `app/firebase/client.ts`: Authentication y sincronización Firestore.
- `app/store.ts`: caché local, sesión demo y respaldos.
- `app/types.ts`: modelo de dominio.
- `firestore.rules`: autorización por identidad y rol.
- `storage.rules`: fotografías de miembros y contenido comunitario.
- `docs/FIREBASE_SETUP.md`: activación y despliegue del backend.

## Identidad y roles

El correo `lic.gmrg@gmail.com` es la única identidad Primary Owner. Solo esa identidad ve el selector de rol simulado. Los registros nuevos nacen como `member`; el Primary Owner puede promover miembros a `admin`.

## Datos

El estado inicial conserva únicamente al Primary Owner. `LocalStore` mantiene una caché offline con prefijo `colts_mx_`. Cuando existe una sesión Firebase y Firestore está activo, las colecciones se sincronizan en tiempo real y la caché local queda como respaldo de continuidad.
