# CURRENT_SESSION_FLOW

Fecha de analisis: 2026-02-04  
Alcance: Frontend (React) + Backend (Cloud Functions)

## 1. Ciclo de Vida del Token

### 1.1 Creacion (`clientLogin` / `clientLoginWithProvider`)

1. El frontend inicia sesion con `httpsCallable('clientLogin')` (usuario/contrasena) en `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts` o con `httpsCallable('clientLoginWithProvider')` (Google) en `src/modules/auth/pages/Login/components/SocialLogin.tsx`.
2. El backend recibe la solicitud en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js` y genera un token aleatorio con `nanoid(32)` dentro de `createSessionToken`.
3. Se crea el documento `sessionTokens/{tokenId}` con `expiresAt`, `createdAt`, `lastActivity`, `status` y metadatos de dispositivo (deviceId, deviceLabel, userAgent, ipAddress, platform) en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
4. En ambos flujos de login, el backend devuelve `{ sessionToken, sessionExpiresAt, session }` y el frontend lo guarda localmente con `storeSessionLocally` en `src/firebase/Auth/fbAuthV2/sessionClient.ts`.
5. Antes de crear un nuevo token, el backend puede revocar sesiones activas para cumplir el limite de sesiones paralelas (`MAX_PARALLEL_ACTIVE_SESSIONS`) mediante `enforceSessionLimit`, lo que puede cerrar sesiones previas cuando hay un nuevo login en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.

### 1.2 Almacenamiento en el Cliente

1. La sesion se persiste en `localStorage` con las claves `sessionToken`, `sessionExpires`, `sessionId` y `sessionDeviceId` en `src/firebase/Auth/fbAuthV2/sessionClient.ts`.
2. No se usan cookies; el estado en Redux se reconstruye posteriormente (no hay rehidratacion automatica desde Redux en el codigo actual).
3. El `deviceId` se genera y persiste en `localStorage` por `ensureDeviceId` en `src/firebase/Auth/fbAuthV2/sessionClient.ts`.

### 1.3 Refresh (`clientRefreshSession` / `useAutomaticLogin`)

1. En el arranque y luego cada `SESSION_CHECK_INTERVAL` (5 minutos), `useAutomaticLogin` llama a `clientRefreshSession` en `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.
2. El frontend envia `{ sessionToken, extend: true, sessionInfo }`; por defecto `extend` es `true`, lo que habilita renovacion de `expiresAt` en backend.
3. El backend valida y, si `extend` es `true`, actualiza `expiresAt = now + SESSION_EXTENSION_MS` y `lastActivity` en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
4. El frontend guarda el nuevo `session.expiresAt` en `localStorage` como `sessionExpires` con `storeSessionLocally` en `src/firebase/Auth/fbAuthV2/sessionClient.ts`.
5. Si el backend devuelve sesion valida, `useAutomaticLogin` carga el usuario desde Firestore (`users/{userId}`) y actualiza Redux (`login(...)`) en `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.
6. Si hay error de sesion (codigos `unauthenticated`, `permission-denied`, `invalid-argument` o mensajes de expiracion), el frontend muestra modal y ejecuta `handleLogout` (limpia storage, Redux y redirige) en `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.

### 1.4 Que decide que un token ha expirado?

1. **Backend (autoridad):** `ensureActiveSession` valida `expiresAt` y `lastActivity` contra `SESSION_IDLE_TIMEOUT_MS`; si expira o esta inactiva, termina la sesion y devuelve `unauthenticated` en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
2. **Backend HTTP:** `resolveHttpAuthUser` y `verifySessionToken` aplican la misma logica para endpoints HTTP que usan `X-Session-Token` en `functions/src/app/versions/v2/auth/services/httpAuth.service.js`.
3. **Frontend (heuristico):** el login screen redirige si `Date.now() < sessionExpiresAt` (solo local) en `src/modules/auth/pages/Login/Login.tsx`, y `useAutomaticLogin` interpreta codigos/mensajes para decidir logout en `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.
4. **Otras causas de invalidacion:** `clientLogout`, `clientRevokeSession` y la revocacion automatica por exceso de sesiones paralelas (`MAX_PARALLEL_ACTIVE_SESSIONS`) eliminan el token antes de que expire, en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.

## 2. Mecanismos de Persistencia

### 2.1 Recarga de Pagina (F5)

1. El token persiste en `localStorage` (`sessionToken`, `sessionExpires`, `sessionId`) en `src/firebase/Auth/fbAuthV2/sessionClient.ts`.
2. En el arranque, `RootElement` ejecuta `useAutomaticLogin`; esto llama `clientRefreshSession`, rehidrata el usuario desde Firestore y actualiza Redux en `src/router/AppRouterLayout.tsx` y `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.
3. El `Login` page puede redirigir a `/home` si encuentra un `sessionExpiresAt` local vigente, sin confirmar aun con backend en `src/modules/auth/pages/Login/Login.tsx`.

### 2.2 Posibles Race Conditions al arrancar

1. **Redirect optimista:** `Login` redirige solo por `sessionExpiresAt` local, aun si el token fue revocado/expirado en backend; luego `useAutomaticLogin` puede fallar y hacer logout, causando un rebote a `/login`.
2. **Llamadas tempranas con token expirado:** `functionsApiClient` usa `X-Session-Token` desde `localStorage` para HTTP calls en `src/services/functionsApiClient.ts`; si el token esta expirado en backend pero aun en storage, estas llamadas pueden fallar con 401 hasta que `useAutomaticLogin` limpie la sesion.
3. **Sesion revocada por login paralelo:** el backend revoca sesiones antiguas cuando hay un nuevo login y `MAX_PARALLEL_ACTIVE_SESSIONS` es 1, lo que puede sentirse como "se les sale el sistema" en el dispositivo anterior en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.

## 3. Configuraciones de Tiempo

### 3.1 Backend (Cloud Functions)

1. `SESSION_DURATION_MS`: `CLIENT_AUTH_SESSION_DURATION_MS` (default 60 dias) en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
2. `SESSION_EXTENSION_MS`: `CLIENT_AUTH_SESSION_EXTENSION_MS` (default = duracion) usado en refresh en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
3. `SESSION_IDLE_TIMEOUT_MS`: `CLIENT_AUTH_MAX_IDLE_MS` (default = duracion) para inactividad en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js` y `functions/src/app/versions/v2/auth/services/httpAuth.service.js`.
4. `TOKEN_CLEANUP_MS`: `CLIENT_AUTH_TOKEN_CLEANUP_MS` (default 60 dias) para limpieza de tokens en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
5. `DISABLE_SESSION_EXPIRY`: si `true`, el backend no expira ni por `expiresAt` ni por inactividad en `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js` y `functions/src/app/versions/v2/auth/services/httpAuth.service.js`.

### 3.2 Frontend

1. `SESSION_CHECK_INTERVAL = 5 min` y `ACTIVITY_CHECK_INTERVAL = 15 min` en `src/constants/sessionConfig.ts`.
2. `INACTIVITY_WARNING = 55 dias` (solo warning UI) en `src/constants/sessionConfig.ts`.
3. Ventana de aviso por expiracion: `EXPIRY_WARNING_WINDOW_MS = 24 h` en `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`.
4. `SESSION_DURATION = 60 dias` existe en `src/constants/sessionConfig.ts`, pero el vencimiento real usa el `sessionExpiresAt` devuelto por backend y guardado en `localStorage`.

### 3.3 Coinciden?

1. Por defecto, backend usa 60 dias y el frontend tiene constantes alineadas (60 dias + warning 55 dias).
2. Si los valores de entorno del backend cambian, el frontend no ajusta sus warnings automaticamente; sin embargo, el `sessionExpiresAt` que el frontend guarda proviene del backend, por lo que la expiracion efectiva sigue siendo la del servidor.
