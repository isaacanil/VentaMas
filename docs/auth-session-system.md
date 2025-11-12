# Sistema de autenticación v2

Este documento explica cómo funcionan las Cloud Functions de autenticación v2, el modelo de almacenamiento de sesiones en Firestore y el registro de eventos (session logs). También describe la configuración del TTL de Firestore que se encarga de eliminar automáticamente las sesiones expiradas.

## Componentes principales
- Colecciones de Firestore
  - `users`: perfil del usuario y campos auxiliares (intentos de login, presencia, etc.).
  - `sessionTokens`: sesiones activas generadas por `clientLogin`. Cada documento representa una sesión y contiene la información de expiración.
  - `sessionLogs`: auditoría liviana de eventos de sesión (login, logout y vistas de historial).
- Cloud Functions HTTPS (archivo `functions/src/versions/v2/auth/controllers/clientAuth.controller.js`)
  - `clientLogin`, `clientValidateSession`, `clientRefreshSession`.
  - `clientListSessions`, `clientRevokeSession`, `clientLogout`.
  - `clientListSessionLogs` y utilidades internas como `logSessionEvent`, `terminateSession`, `enforceSessionLimit` y `cleanupOldTokens`.
- Frontend (`fbGetSessionLogs`) que consume `clientListSessionLogs` y muestra los datos en `UserSessionLogs`.

## Flujo de login (`clientLogin`)
1. Normaliza el identificador recibido (`username` o `name`) y verifica la contraseña con `bcrypt.compare`.
2. Controla bloqueos temporales por intentos fallidos (`CLIENT_AUTH_MAX_ATTEMPTS`, `CLIENT_AUTH_LOCK_MS`).
3. Resetea los contadores de intentos al autenticarse correctamente.
4. Llama a `createSessionToken` para generar un nuevo documento en `sessionTokens` y eliminar tokens antiguos mediante `cleanupOldTokens`.
5. Construye `sessionInfo` con metadatos del request (`extractRequestInfo`) y los persiste en el token.
6. Registra el evento `login` en `sessionLogs` con `logSessionEvent`.
7. Actualiza la presencia del usuario (`syncUserPresence`) y devuelve al cliente el token (`sessionToken`) junto con los datos de sesión serializados.

## Modelo `sessionTokens`
Cada documento contiene:
- `userId`: referencia al usuario dueño de la sesión.
- `createdAt`, `lastActivity`: `FieldValue.serverTimestamp()` para auditoría.
- `expiresAt`: fecha en la que la sesión deja de ser válida.
- Información de dispositivo: `deviceId`, `deviceLabel`, `userAgent`, `platform`, `ipAddress`.
- `metadata`: estructura libre enviada por el cliente (ej. zona horaria, label de la app, etc.).
- `status`: `active` por defecto. Al revocar o expirar se elimina el documento.

### Renovación y validación
- `ensureActiveSession` valida la existencia y vigencia del token. Si detecta expiración o inactividad prolongada (`CLIENT_AUTH_MAX_IDLE_MS`), elimina el documento y registra el evento correspondiente (`expired` o `idle-timeout`).
- `clientValidateSession` devuelve el payload de la sesión si es válida.
- `clientRefreshSession` actualiza `lastActivity`, extiende `expiresAt` (`CLIENT_AUTH_SESSION_EXTENSION_MS`) y fusiona nuevos metadatos.

### Límite de sesiones concurrentes
`enforceSessionLimit` revisa todas las sesiones de un usuario y:
- Elimina las sesiones caducadas o inactivas.
- Si aún supera el máximo permitido (`CLIENT_AUTH_MAX_ACTIVE_SESSIONS`), revoca las más antiguas (`auto-revoked`).

### Sincronización de presencia
El estado visible en la interfaz combina dos fuentes:

1. **Realtime Database**: Cada cliente web publica su conexión en `presence/{uid}/{connectionId}` usando `onDisconnect` para marcarse como `offline` automáticamente en cuanto se pierde la conexión. El hook `useRealtimePresence` (`src/firebase/presence/useRealtimePresence.js`) gestiona esta escritura tomando el `sessionId`/`deviceId` local.
2. **Aggregator en Cloud Functions**: `syncRealtimePresence` (`functions/src/versions/v2/auth/triggers/presenceSync.js`) escucha cualquier cambio en esa ruta, calcula cuántas conexiones siguen activas y actualiza `users/{id}/presence` con:
   - `status`: `online` si existe al menos una conexión activa, `offline` en caso contrario.
   - `lastSeen`: `Timestamp` del último `updatedAt` recibido desde Realtime Database.
   - `connectionCount`: número de conexiones activas.

   Como medida anti-zombie, cualquier conexión que permanezca en estado `online` más de ~30 segundos sin nuevos `updatedAt` se fuerza a `offline` automáticamente antes de actualizar Firestore.

Las rutas HTTPS (`clientLogin`, `clientRefreshSession`, etc.) siguen llamando a `syncUserPresence` como redundancia para limpiar sesiones caducadas, pero la señal más precisa proviene de Realtime Database.

## Registro de eventos en `sessionLogs`
- `logSessionEvent` solo acepta eventos listados en `SESSION_LOG_WHITELIST` (`login`, `logout`, `view-session-logs`).
- Cada evento almacena `userId`, `sessionId`, `event`, `context` y `createdAt`.
- `terminateSession` fusiona la información del token (device, metadata, IP) con el contexto recibido para garantizar que el `logout` incluya los mismos datos que se capturaron al iniciar sesión.
- `assertCanViewSessionLogs` restringe la lectura de historial a:
  - El propio usuario.
  - Roles privilegiados (`admin`, `dev`, `owner`) cuando consultan a terceros.
- `clientListSessionLogs` ejecuta la consulta, respeta el `limit` solicitado (máximo `CLIENT_AUTH_SESSION_LOG_LIMIT`) y registra un evento adicional `view-session-logs` cuando un usuario autorizado inspecciona los registros de otra persona.
- En el frontend, `fbGetSessionLogs` envía el token de sesión y un `sessionInfo` con metadata (`requestSource`, `requestedAt`); esa información queda guardada en los logs para trazabilidad.

## Operaciones complementarias
- `clientListSessions`: devuelve la lista de sesiones activas y la marca como `currentSessionId`.
- `clientRevokeSession`: elimina una sesión específica (propia) y registra `logout` o `revoked` según corresponda.
- `clientLogout`: cierra la sesión actual; en caso de que ya esté expirada devuelve `ok: true` con `status: 'already-expired'`.

## TTL de Firestore para sesiones expiradas
Firestore cuenta con un sistema de TTL (time-to-live) que borra documentos automáticamente cuando el campo configurado queda en el pasado. Para `sessionTokens`:
1. En la consola de Firebase, abre Firestore > Settings > TTL.
2. Agrega una política para la colección `sessionTokens` usando el campo `expiresAt`.
3. Verifica que el campo esté indexado como `timestamp` (con `Timestamp.fromMillis` garantizamos ese tipo).
4. Opcional: activa notificaciones de borrado con Cloud Monitoring si se requiere auditoría.

Aunque el TTL elimina las sesiones expiradas sin intervención, mantenemos utilidades adicionales:
- `cleanupOldTokens`: borra tokens obsoletos durante cada login para evitar acumulación en casos donde el TTL tarde en procesar los documentos.
- `terminateSession`: asegura que la expiración manual (idle, revocación) también genere un log antes de borrar el documento.

## Variables de configuración relevantes
- `CLIENT_AUTH_SESSION_DURATION_MS`: duración inicial del token (por defecto 60 días).
- `CLIENT_AUTH_SESSION_EXTENSION_MS`: extensión al refrescar la sesión (si no se define utiliza la duración inicial).
- `CLIENT_AUTH_MAX_IDLE_MS`: tiempo máximo de inactividad antes de cerrar sesión automáticamente.
- `CLIENT_AUTH_MAX_ACTIVE_SESSIONS`: número de sesiones simultáneas permitidas por usuario.
- `CLIENT_AUTH_SESSION_LOG_LIMIT`: límite superior para `clientListSessionLogs`.
- `CLIENT_AUTH_MAX_ATTEMPTS` y `CLIENT_AUTH_LOCK_MS`: control de bloqueos por intentos fallidos.
- `CLIENT_AUTH_TOKEN_CLEANUP_MS`: ventana de tiempo para eliminar tokens antiguos en el side cleanup.

Todas estas variables pueden definirse como parámetros de Functions o variables de entorno locales; los defaults actuales están en el archivo del controlador.

## Referencias
- Código fuente principal: `functions/src/versions/v2/auth/controllers/clientAuth.controller.js`.
- Frontend que consume los logs: `src/firebase/Auth/fbAuthV2/fbGetSessionLogs.js` y `src/views/pages/setting/subPage/Users/UserSessionLogs.jsx`.
- Documentación general de TTL: [Firestore TTL documentation](https://firebase.google.com/docs/firestore/ttl) (en producción seguir las políticas de seguridad internas antes de habilitar nuevas reglas).

Con esta arquitectura se obtiene un historial consistente de sesiones, limpieza automática de tokens vencidos y herramientas para auditar el acceso desde el panel administrativo.
