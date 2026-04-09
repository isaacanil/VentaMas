# Sistema de Autenticación Personalizado (Detalle Técnico)

Fecha: `2026-02-26`

Estado: `Documentación técnica del sistema actual`

## Objetivo

Documentar cómo funciona el sistema de autenticación personalizado en la app:

- login / signup / logout
- refresh automático de sesión
- uso de `sessionToken` propio
- uso de Firebase Auth con `custom token`
- hidratación de estado (`Redux`)
- sincronización con `Firestore` / `Realtime DB`
- endpoints/callables y flujos relacionados

## Resumen Ejecutivo (arquitectura real)

Este sistema **no reemplaza** Firebase Auth, sino que combina dos capas:

1. `Sesión de aplicación` (custom)
- Se crea y valida con documentos en `Firestore` (`sessionTokens`)
- Se usa para la mayoría de `callables` y parte de endpoints HTTP
- Se persiste en `localStorage` (`sessionToken`, expiración, sessionId)

2. `Sesión Firebase Auth`
- Se establece con `signInWithCustomToken(...)`
- El backend genera ese token con `admin.auth().createCustomToken(uid)`
- Se usa para que `request.auth.uid` coincida con `users/{uid}` en reglas y listeners

En otras palabras:

- `Custom session token` = control de sesión, expiración, refresh, logs, revocación, auditoría
- `Firebase custom token` = autenticación Firebase (Firestore/RTDB/Rules)

## Componentes principales (dónde vive cada cosa)

### Frontend (cliente)

- Firebase init (`auth`, `functions`, `db`, `realtimeDB`):
  - `src/firebase/firebaseconfig.tsx:46`
  - `src/firebase/firebaseconfig.tsx:47`
  - `src/firebase/firebaseconfig.tsx:49`

- Login password:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:30`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:108`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:119`

- Auto refresh / boot session:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:216`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:372`

- Local session storage (`localStorage`):
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:1`
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:89`
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:132`

- Logout:
  - `src/firebase/Auth/fbAuthV2/fbSignOut.ts:20`
  - `src/firebase/Auth/fbAuthV2/fbSignOut.ts:26`

- Signup público:
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:30`
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:101`
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:114`

- Login social (Google):
  - `src/modules/auth/pages/Login/components/SocialLogin.tsx:49`
  - `src/modules/auth/pages/Login/components/SocialLogin.tsx:91`
  - `src/modules/auth/pages/Login/components/SocialLogin.tsx:121`

- Estado auth en Redux:
  - `src/features/auth/userSlice.ts:127`
  - `src/features/auth/userSlice.ts:163`
  - `src/features/auth/userSlice.ts:176`
  - `src/features/auth/userSlice.ts:255`
  - `src/features/auth/userSlice.ts:257`

- Boot de la app y bloqueo hasta `authReady`:
  - `src/router/AppRouterLayout.tsx:137`
  - `src/router/AppRouterLayout.tsx:170`

- Listeners globales post-login:
  - `src/router/GlobalListeners.tsx:62`
  - `src/router/GlobalListeners.tsx:63`

- Rehidratación de usuario desde `users/{uid}`:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:52`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:64`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:70`

### Backend (Cloud Functions v2)

- Export de callables auth/contexto:
  - `functions/src/index.js:47`
  - `functions/src/index.js:66`
  - `functions/src/index.js:129`
  - `functions/src/index.js:133`

- Controlador principal de auth custom:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1`

- Controlador de contexto de negocio (relacionado con auth/sesión):
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:321`

- Auth para endpoints HTTP (Bearer Firebase o `x-session-token`):
  - `functions/src/app/versions/v2/auth/services/httpAuth.service.js:35`
  - `functions/src/app/versions/v2/auth/services/httpAuth.service.js:46`
  - `functions/src/app/versions/v2/auth/services/httpAuth.service.js:86`

## Modelo conceptual del sistema

## Capa 1: Identidad Firebase

La app termina autenticada en Firebase Auth usando `signInWithCustomToken(...)`:

- Login por password:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:1`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:95`

- Signup público:
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:1`
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:94`

- Refresh automático:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:2`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:213`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:432`

- Login social:
  - `src/modules/auth/pages/Login/components/SocialLogin.tsx:4`
  - `src/modules/auth/pages/Login/components/SocialLogin.tsx:121`

El backend genera el custom token con:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2567`
- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2574`

## Capa 2: Sesión de aplicación (custom session)

La sesión custom vive en Firestore (colección `sessionTokens`):

- colección definida en backend:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:27`

- creación de sesión:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:839`

- validación de sesión activa (expiración / inactividad):
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:803`

- refresh de sesión:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1489`

- revocación/logout:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1625`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1680`

El frontend guarda esa sesión en `localStorage`:

- claves:
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:1`
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:4`

- escritura:
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:117`

- lectura:
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:132`

- limpieza:
  - `src/firebase/Auth/fbAuthV2/sessionClient.ts:152`

## Datos y colecciones relevantes

## `users/{uid}`

Usado como documento raíz del usuario. Contiene, según flujo:

- identidad (`name`, `displayName`, `email`)
- hash de contraseña (`password`) para auth password custom
- contexto de negocio/rol (`activeBusinessId`, `activeRole`, `accessControl`)
- metadatos de login/provider
- presencia resumida (`presence`) en algunos flujos
- email verification temporal (`emailVerification`)
- simulaciones (`roleSimulation`, `devBusinessSimulation`)

Notas:

- El backend sanea respuestas para no devolver `password`, `loginAttempts`, etc.:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2544`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2554`

- El frontend normaliza payloads heterogéneos (legacy/hybrid/new):
  - `src/utils/auth-adapter.ts:213`
  - `src/utils/auth-adapter.ts:353`

## `sessionTokens/{tokenId}`

Sesión custom por dispositivo/cliente:

- `userId`
- `expiresAt`
- `createdAt`
- `lastActivity`
- `status`
- metadata de dispositivo/red (`deviceId`, `deviceLabel`, `userAgent`, `ipAddress`, `platform`, `metadata`)

Referencias:

- creación payload:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:845`
- serialización de respuesta:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:498`

## `sessionLogs`

Auditoría de eventos de sesión (principalmente login/logout).

- colección:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:28`
- write:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:581`
- lectura:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1550`

Importante:

- Hay un whitelist de eventos:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:71`
- `logSessionEvent(...)` descarta eventos fuera del whitelist:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:579`

## `Realtime DB presence/{uid}/{connectionId}` + resumen `users/{uid}.presence`

Esto ya está documentado en más detalle en:

- `plans/architecture/audits/PRESENCE_SYSTEM_BEFORE_AFTER.md`

Puntos clave de acoplamiento con auth:

- `useRealtimePresence` depende del usuario autenticado y del `sessionId` local:
  - `src/router/GlobalListeners.tsx:63`
  - `src/firebase/presence/useRealtimePresence.ts:151`

- backend resume presencia y la refleja en `users/{uid}.presence`:
  - `functions/src/app/versions/v2/auth/triggers/presenceSync.js:43`

## Flujo 1: Boot de la app y restauración automática de sesión

## Qué dispara el boot

`RootElement` llama `useAutomaticLogin()` al iniciar la app:

- `src/router/AppRouterLayout.tsx:137`

Mientras se resuelve, la app bloquea contenido hasta `authReady`:

- `src/router/AppRouterLayout.tsx:139`

## Qué hace `useAutomaticLogin`

Hook central:

- `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:216`

Hace lo siguiente:

1. Lee `sessionToken` desde `localStorage` (`getStoredSession`)
   - `src/firebase/Auth/fbAuthV2/sessionClient.ts:132`
2. Llama `clientRefreshSession`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:397`
3. Si responde OK:
   - actualiza expiración local (`storeSessionLocally`)
     - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:418`
   - asegura sesión Firebase con custom token
     - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:432`
   - carga usuario (desde payload de sesión o `users/{uid}`)
     - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:438`
4. Marca `authReady`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:590`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:596`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:605`

## Refresh periódico y manejo de errores

Configuración local:

- intervalos:
  - `src/constants/sessionConfig.ts:4`
  - `src/constants/sessionConfig.ts:5`

En el hook:

- retries cortos (`2s`, `5s`) y luego backoff al intervalo normal:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:32`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:268`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:270`
- clasificación de errores auth vs transitorios:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:43`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:49`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:164`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:169`
- modal de sesión expirada:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:357`
- warning por inactividad:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:529`

## Flujo 2: Login con usuario/contraseña (custom)

## Frontend

El formulario de login llama `fbSignIn(...)`:

- `src/modules/auth/pages/Login/components/LoginForm.tsx:433`
- actualiza Redux con `updateAppState(...)`:
  - `src/modules/auth/pages/Login/components/LoginForm.tsx:442`

`fbSignIn(...)`:

1. construye `sessionInfo` (deviceId, userAgent, metadata)
   - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:108`
   - `src/firebase/Auth/fbAuthV2/sessionClient.ts:89`
2. llama `clientLogin`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:30`
3. asegura Firebase Auth con `firebaseCustomToken`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:68`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:95`
4. guarda sesión custom en local storage
   - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:121`

## Backend (`clientLogin`)

Callable:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1024`

Proceso:

1. valida input y extrae `sessionInfo`
2. busca usuario por nombre (`findUserByName`)
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:373`
3. compara password con `bcrypt.compare`
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1048`
4. aplica lockout por intentos fallidos
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:37`
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:38`
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1055`
5. crea sesión custom (`sessionTokens`)
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1081`
6. registra log de login
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1097`
7. sincroniza presencia resumida y sesiones activas
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1108`
8. genera `firebaseCustomToken`
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1116`

Respuesta incluye:

- `sessionToken`
- `sessionExpiresAt`
- `session`
- `activeSessions`
- `user`
- `businessHasOwners`
- `firebaseCustomToken`

## Flujo 3: Signup público (password) y autologin

## Frontend

Formulario de signup:

- `src/modules/auth/pages/SignUp/components/SignUpAccountForm.tsx:335`
- si sale OK, despacha `login(...)` con el usuario retornado:
  - `src/modules/auth/pages/SignUp/components/SignUpAccountForm.tsx:342`

Wrapper:

- `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:30`
- también usa `signInWithCustomToken`:
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:1`
  - `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:94`

## Backend (`clientPublicSignUp`)

Callable:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:899`

Proceso (resumen):

- valida flag `ALLOW_PUBLIC_SIGNUP`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:51`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:900`
- valida email y password
- crea usuario con password hasheado (`bcrypt`)
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:936`
- crea sesión custom
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:985`
- registra `login` en `sessionLogs`
- sincroniza presencia
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1008`
- genera `firebaseCustomToken`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1009`

## Flujo 4: Login social (Google) + re-mapeo a UID interno

## Frontend (`SocialLogin`)

Componente:

- `src/modules/auth/pages/Login/components/SocialLogin.tsx:49`

Flujo:

1. `signInWithPopup(auth, GoogleProvider)` para obtener `idToken` Google/Firebase
   - `src/modules/auth/pages/Login/components/SocialLogin.tsx:91`
2. envía `idToken` a `clientLoginWithProvider`
   - `src/modules/auth/pages/Login/components/SocialLogin.tsx:95`
3. guarda `sessionToken` custom
   - `src/modules/auth/pages/Login/components/SocialLogin.tsx:108`
4. hace `signOut(auth)` y luego `signInWithCustomToken(...)` con UID interno
   - `src/modules/auth/pages/Login/components/SocialLogin.tsx:121`
5. actualiza Redux
   - `src/modules/auth/pages/Login/components/SocialLogin.tsx:128`

Motivo de este paso:

- unificar `auth.currentUser.uid` con el `userId` interno (`users/{id}`)
- evitar mismatch entre UID del proveedor y UID de documentos legacy

## Backend (`clientLoginWithProvider`)

Callable:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1136`

Proceso:

- valida `idToken` y `providerId`
- verifica `idToken` con Admin SDK
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1160`
- verifica consistencia proveedor/token
- busca usuario por email o lo crea (si `ALLOW_PUBLIC_SIGNUP`)
- linkea provider en `providers` / `identities.*`
- crea sesión custom, logs, presencia, `firebaseCustomToken`

## Flujo 5: Logout

## Frontend

`fbSignOut()`:

- `src/firebase/Auth/fbAuthV2/fbSignOut.ts:20`
- marca flag `logoutInProgress`
  - `src/firebase/Auth/fbAuthV2/fbSignOut.ts:26`
- llama `clientLogout` si hay `sessionToken`
  - `src/firebase/Auth/fbAuthV2/fbSignOut.ts:31`
- limpia `localStorage`
  - `src/firebase/Auth/fbAuthV2/fbSignOut.ts:37`

`useAutomaticLogin` también tiene `handleLogout()` propio para expiración/errores:

- `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:287`
- limpia sesión local y hace `signOut(auth)`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:310`

## Backend (`clientLogout`)

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1680`

Hace:

- valida sesión activa (`ensureActiveSession`)
- termina la sesión (`terminateSession`)
- sincroniza presencia agregada

Si la sesión ya estaba expirada:

- devuelve `ok` con `status: already-expired` (no falla de forma dura)

## Flujo 6: Refresco de sesión / expiración / límites

## Parámetros backend (env)

Configurables:

- duración de sesión:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:30`
- cleanup de tokens:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:33`
- timeout por inactividad:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:35`
- límite intentos login:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:37`
- lock duración:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:38`
- máximas sesiones:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:40`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:42`
- extensión al refresh:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:46`
- desactivar expiración:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:48`

## Lógica principal

- `ensureActiveSession(...)` valida expiración e inactividad:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:803`
- si expiró / idle:
  - termina sesión
  - actualiza presencia offline
- `createSessionToken(...)` crea nuevas sesiones:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:839`
- `enforceSessionLimit(...)` revoca sesiones viejas/stale:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:683`
- `cleanupOldTokens(...)` borra tokens expirados/antiguos:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:458`

## Flujo 7: Hidratación del usuario y sincronización de estado en frontend

## Primera carga (boot)

`useAutomaticLogin` despacha `login(...)` con payload de sesión o con lectura de `users/{uid}`:

- `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:438`
- `src/features/auth/userSlice.ts:127`

## Sincronización posterior en tiempo real

`useUserDocListener` escucha `users/{uid}`:

- `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:52`
- `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:64`

Características:

- reconstruye payload legacy-compatible
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:9`
- deduplica por firma `JSON.stringify(payload)`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:70`
- actualiza `Redux userSlice`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:75`

## Normalización de shape de usuario

Hay dos capas:

1. `normalizeCurrentUserContext(...)`
- `src/utils/auth-adapter.ts:213`
- unifica legacy/hybrid/new
- resuelve `activeBusinessId`, `activeRole`, `accessControl`, `availableBusinesses`

2. `userSlice` normaliza aliases y roles en reducers
- `src/features/auth/userSlice.ts:127`
- `src/features/auth/userSlice.ts:166`

Esto permite compatibilidad con módulos legacy que leen:

- `uid` / `id`
- `businessID` / `businessId` / `activeBusinessId`
- `role` / `activeRole`

## Flujos administrativos / relacionados (auth-adjacent pero importantes)

## Validación de credenciales para acciones sensibles (`clientValidateUser`)

Frontend wrapper:

- `src/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser.ts:21`

Usos detectados:

- `src/components/modals/PeerReviewAuthorization/PeerReviewAuthorization.tsx:71`
- `src/components/modals/PinAuthorizationModal/PinAuthorizationModal.tsx:553`

Backend callable:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1707`

## Gestión de usuarios por admin (`clientSignUp`, `clientUpdateUser`)

Frontend wrappers:

- signup admin:
  - `src/firebase/Auth/fbAuthV2/fbSignUp.ts:27`
  - `src/firebase/Auth/fbAuthV2/fbSignUp.ts:60`
- update user:
  - `src/firebase/Auth/fbAuthV2/fbUpdateUser.ts:31`
  - `src/firebase/Auth/fbAuthV2/fbUpdateUser.ts:50`

Backend:

- `clientSignUp`:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2005`
- `clientUpdateUser`:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2199`

## Contraseñas (dos rutas distintas)

Existen dos operaciones diferentes:

1. `clientChangePassword` (usuario cambia su propia contraseña con contraseña anterior)
- frontend wrapper en `src/firebase/Auth/fbAuthV2/fbUpdateUser.ts:38`
- callable en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2359`

2. `clientSetUserPassword` (admin cambia contraseña de otro usuario)
- frontend wrapper en `src/firebase/Auth/fbAuthV2/fbUpdateUserPassword.ts:17`
- callable en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2390`

Ambas:

- hashean con `bcrypt`
- revocan sesiones activas del usuario por seguridad
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2385`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2406`

## Sesiones: logs y revocación

Frontend:

- listar logs:
  - `src/firebase/Auth/fbAuthV2/fbGetSessionLogs.ts:30`
  - `src/firebase/Auth/fbAuthV2/fbGetSessionLogs.ts:52`
- revocar sesión:
  - `src/firebase/Auth/fbAuthV2/fbRevokeSession.ts:27`

UI:

- `UserActivity` revoca sesión:
  - `src/modules/settings/pages/setting/subPage/Users/UserActivity.tsx:94`
- `UserActivityData` carga logs:
  - `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:138`

Backend:

- `clientListSessionLogs`: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1550`
- `clientListSessions`: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1610`
- `clientRevokeSession`: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1625`

## Verificación de email (admin)

Frontend wrappers:

- `src/firebase/Auth/fbAuthV2/fbEmailVerification.ts:34`
- `src/firebase/Auth/fbAuthV2/fbEmailVerification.ts:39`

Backend:

- `clientSendEmailVerification`: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2599`
- `clientVerifyEmailCode`: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2697`

Notas:

- Código se guarda hasheado con `bcrypt`
- Se guarda temporalmente dentro de `users/{uid}.emailVerification`
- Tiene expiración e intentos máximos

## Contexto de negocio y simulación dev (acoplado al auth por `sessionToken`)

Aunque no es “login”, sí forma parte del contexto de autenticación/autorización efectivo.

## Backend (`businessContext.controller`)

- `clientSelectActiveBusiness`:
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:321`
- `clientStartBusinessImpersonation`:
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:398`
- `clientStopBusinessImpersonation`:
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:500`
- `clientGetBusinessImpersonationStatus`:
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:558`

Todos pueden resolver usuario desde `sessionToken`:

- `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:277`

Y actualizan `users/{uid}` para reflejar contexto/simulación:

- `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:172`
- `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:474`

## Frontend (wrappers dev impersonation)

- `src/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness.ts:34`
- `src/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness.ts:39`
- `src/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness.ts:44`

Usos detectados:

- `src/hooks/usePersistentDeveloperBusiness.ts:39`
- `src/components/devtools/DeveloperSessionHelper.tsx:253`

## HTTP endpoints protegidos por auth custom (además de callables)

El servicio `resolveHttpAuthUser(req)` acepta:

1. `Bearer <Firebase ID Token>`
2. `x-session-token` (o body/query `sessionToken`)

Referencias:

- `functions/src/app/versions/v2/auth/services/httpAuth.service.js:35`
- `functions/src/app/versions/v2/auth/services/httpAuth.service.js:46`
- `functions/src/app/versions/v2/auth/services/httpAuth.service.js:86`

Uso en endpoints HTTP (ejemplos):

- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js:94`
- `functions/src/app/versions/v2/invoice/controllers/getInvoiceHttp.controller.js:128`
- `functions/src/app/versions/v2/accountsReceivable/controllers/auditAccountsReceivableHttp.controller.js:651`

Esto extiende el alcance del sistema custom más allá de `httpsCallable`.

## Seguridad y controles implementados (actual)

## Controles positivos

- `bcrypt` para contraseñas y códigos de verificación:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:936`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2617`

- límite de intentos + lock temporal:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:37`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:38`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1055`

- expiración e inactividad de sesiones:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:803`

- revocación de sesiones al cambiar contraseña:
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2385`
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2406`

- deduplicación de payload de `useUserDocListener` (reduce churn):
  - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:70`

## Riesgos / observaciones (para revisar)

## 1) `sessionToken` en `localStorage`

Se guarda en `localStorage`:

- `src/firebase/Auth/fbAuthV2/sessionClient.ts:126`
- `src/firebase/Auth/fbAuthV2/sessionClient.ts:143`

Tradeoff:

- práctico para persistencia y refresh
- expuesto a XSS si hubiera una vulnerabilidad de scripting

## 2) Convivencia de dos tokens (complejidad accidental)

Hay que coordinar:

- `sessionToken` custom (Firestore)
- Firebase ID token / custom token (Firebase Auth)

La complejidad está contenida, pero requiere cuidado en:

- refresh
- logout
- account switching
- social login -> remapeo a UID interno

## 3) Naming confuso en wrappers de password

Hay dos `fbUpdateUserPassword` exportados en archivos distintos:

- `src/firebase/Auth/fbAuthV2/fbUpdateUser.ts:60` (`clientChangePassword`)
- `src/firebase/Auth/fbAuthV2/fbUpdateUserPassword.ts:22` (`clientSetUserPassword`)

No es bug funcional, pero sí una fuente de confusión/mal uso.

## 4) `SESSION_LOG_WHITELIST` restringe eventos

Whitelist actual:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:71`

Como `logSessionEvent(...)` filtra por whitelist:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:579`

Algunos eventos invocados con `logSessionEvent` podrían no persistirse (si no están en whitelist).

## 5) Endpoints expuestos pero sin wrapper/uso frontend visible (hoy)

No encontré consumidor frontend directo para:

- `clientValidateSession`
- `clientListSessions`
- `clientSelectActiveBusiness` (callable backend existe, pero no vi wrapper/uso directo en `src/`)

Esto puede ser:

- funcionalidad futura
- uso desde otro cliente
- código legado no referenciado actualmente

## Notas de diseño (complejidad y principios)

## Complejidad esencial

- gestionar usuarios, sesiones, expiración, refresh, revocación
- alinear auth Firebase con un modelo de usuario legacy propio
- soportar roles y multi-negocio

## Complejidad accidental presente

- doble capa de sesión (necesaria, pero costosa cognitivamente)
- compatibilidad legacy (`uid/id`, `businessID/businessId/...`)
- mezcla de responsabilidades auth + contexto de negocio + simulación dev en la misma capa

## Puntos fuertes del diseño actual

- buena trazabilidad de sesión (`sessionTokens`, `sessionLogs`)
- control de expiración e inactividad en backend (no solo frontend)
- refresh automático robusto con reintentos
- uso de Firebase custom token para compatibilidad con Rules/Firestore/RTDB

## Checklist rápido para auditar un bug de auth

1. Verificar `localStorage` (`sessionToken`, `sessionExpires`, `sessionId`)
   - `src/firebase/Auth/fbAuthV2/sessionClient.ts:132`
2. Verificar `sessionTokens/{tokenId}` en Firestore
3. Confirmar que `clientRefreshSession` responde `ok`
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1489`
4. Confirmar que frontend recibe `firebaseCustomToken`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:432`
5. Confirmar que `auth.currentUser.uid` coincide con `users/{uid}`
6. Confirmar que `useUserDocListener` está activo y despacha `login`
   - `src/router/GlobalListeners.tsx:62`
   - `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:75`
7. Revisar `authReady`/route loaders si la UI queda bloqueada
   - `src/features/auth/userSlice.ts:257`
   - `src/router/routes/loaders/accessLoaders.ts:210`

## Corrección importante (respecto a una suposición previa)

Sí se usa `signInWithCustomToken(...)` en el frontend actual.

Referencias claras:

- `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts:95`
- `src/firebase/Auth/fbAuthV2/fbPublicSignUp.ts:94`
- `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts:213`
- `src/modules/auth/pages/Login/components/SocialLogin.tsx:121`

El backend lo soporta generando tokens con:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2574`

