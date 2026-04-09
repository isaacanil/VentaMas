# 1. Resumen Ejecutivo del Sistema de Autenticación

- **Estrategia actual:** El sistema combina un **auth propio v2** (usuario/contraseña en Firestore + tokens de sesión propios en la colección `sessionTokens`) con **flujos legacy** basados en **Firebase Auth** (custom tokens + email/password). Además, existe un **sub-sistema de autorización por PIN** para acciones sensibles (facturación/cuentas por cobrar) con cifrado simétrico.
- **Tecnologías y librerías clave:** Firebase (Auth, Functions Callable, Firestore, Realtime Database), `bcryptjs`, `argon2`, `nanoid`, `firebase-functions`/`firebase-admin`, `crypto` (AES-256-GCM), Redux Toolkit, LocalStorage.

# 2. Arquitectura y Flujos de Datos

**Diagrama de Flujo (Texto/Mermaid):**

```mermaid
flowchart TD
  subgraph Login_v2[Login (v2: username/password + sessionToken)]
    A[UI LoginForm] --> B[fbSignIn -> callable clientLogin]
    B --> C[clientLogin: busca usuario, valida bcrypt, lockout]
    C --> D[createSessionToken: guarda en sessionTokens + sessionLogs]
    D --> E[Respuesta: sessionToken + expiresAt + user]
    E --> F[storeSessionLocally -> localStorage]
    F --> G[Redux login + navegar /home]
  end

  subgraph Registro_v2[Registro (v2)]
    R1[UI/Admin -> fbSignUp] --> R2[callable clientSignUp]
    R2 --> R3[bcrypt hash + users/{id}]
    R3 --> R4[Respuesta ok + user]
  end

  subgraph Refresh_v2[Persistencia/Refresh (v2)]
    S1[useAutomaticLogin] --> S2[clientRefreshSession]
    S2 --> S3[ensureActiveSession + extiende expiresAt]
    S3 --> S4[storeSessionLocally + cargar user doc]
  end

  subgraph Logout_v2[Logout (v2)]
    L1[fbSignOut] --> L2[callable clientLogout]
    L2 --> L3[termina sessionTokens + log]
    L3 --> L4[clear localStorage + Redux logout]
  end

  subgraph Legacy_v1[Login legacy (v1)]
    V1A[Callable authLogin] --> V1B[Valida hash Argon2/Bcrypt]
    V1B --> V1C[Firebase Admin createCustomToken]
    V1C --> V1D[Cliente usa Firebase Auth]
  end
end
```

**Manejo de Estado:**

- **Redux:** `src/features/auth/userSlice.ts` guarda `user`, `businessID`, `role` y permite cambios temporales de negocio/rol.
- **LocalStorage:** `sessionToken`, `sessionExpires`, `sessionId`, `sessionDeviceId` (via `sessionClient.ts`).
- **Firebase Auth (legacy):** Persistencia por defecto del SDK (no control explícito en este repo).

**Persistencia:**

- `useAutomaticLogin` (hook) llama a `clientRefreshSession` en intervalos y al arrancar para renovar el `expiresAt` y rehidratar `user` desde Firestore.
- La pantalla `Login` también revisa `sessionExpiresAt` en localStorage para redirigir si la sesión aún parece válida.
- El RTDB de presencia (`/presence/{userId}/{connectionId}`) mantiene actividad por heartbeat y el backend sincroniza a `users/{userId}.presence`.

# 3. Inventario de Código (Code Map)

- **Archivo:** `src/modules/auth/pages/Login/Login.tsx`
  - **Funciones:** `Login` - _Pantalla de login; precarga imagen, revisa sesión en Redux/localStorage y redirige._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/modules/auth/pages/Login/components/LoginForm.tsx`
  - **Funciones:** `LoginForm` - _Valida formulario, llama a `fbSignIn`, actualiza Redux y navega._
  - **Endpoints:** `[POST] /clientLogin` - _Envía `{ username, password, sessionInfo }` y recibe `{ user, sessionToken, sessionExpiresAt }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts`
  - **Funciones:** `fbSignIn`, `updateAppState` - _Callable a `clientLogin`, guarda sesión local y setea Redux._
  - **Endpoints:** `[POST] /clientLogin` - _Envía `{ username, password, sessionInfo }` y recibe `{ ok, user, sessionToken, sessionExpiresAt }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignIn/checkSession.ts`
  - **Funciones:** `useAutomaticLogin` - _Renueva sesión (`clientRefreshSession`), muestra avisos de expiración/inactividad, hace logout si falla._
  - **Endpoints:**
    - `[POST] /clientRefreshSession` - _Envía `{ sessionToken, extend, sessionInfo }` y recibe `{ session, activeSessions }`._
    - `[POST] /clientLogout` - _Envía `{ sessionToken }` y recibe `{ ok }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/sessionClient.ts`
  - **Funciones:** `buildSessionInfo`, `storeSessionLocally`, `getStoredSession`, `clearStoredSession`, `ensureDeviceId` - _Manejo de storage local y metadatos del dispositivo._
  - **Endpoints:** `N/A` - _Utilidad local._
- **Archivo:** `src/router/AppRouterLayout.tsx`
  - **Funciones:** `RootElement`, `AppLayout` - _Arranque de app, `useAutomaticLogin`, redirecciones públicas/privadas._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/router/routes/requiereAuthProvider.tsx`
  - **Funciones:** `processRoute`, `validateRouteAccess` - _Envuelve rutas privadas con `RequireAuth`._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/modules/auth/components/RequireAuth.tsx`
  - **Funciones:** `RequireAuth` - _Guardia de rutas basada en Redux `user`._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/router/routes/paths/Auth.tsx`
  - **Funciones:** `Routes` - _Define ruta `/login` como pública._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/components/ui/SessionManager.tsx`
  - **Funciones:** `SessionManager` - _Loader visual durante chequeo de sesión._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/features/auth/userSlice.ts`
  - **Funciones:** `login`, `logout`, `addUserData`, `switchToBusiness`, `switchToRole` - _Estado global del usuario y cambios temporales._
  - **Endpoints:** `N/A` - _Redux._
- **Archivo:** `src/constants/sessionConfig.ts`
  - **Funciones:** `SESSION_DURATION`, `INACTIVITY_WARNING`, `SESSION_CHECK_INTERVAL` - _Configuración local del cliente._
  - **Endpoints:** `N/A` - _Constantes._
- **Archivo:** `src/firebase/firebaseconfig.tsx`
  - **Funciones:** `initializeApp`, `getAuth`, `getFunctions`, `initializeFirestore` - _Inicialización Firebase SDK._
  - **Endpoints:** `N/A` - _Infraestructura._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignOut.ts`
  - **Funciones:** `fbSignOut` - _Llama `clientLogout` y limpia localStorage._
  - **Endpoints:** `[POST] /clientLogout` - _Envía `{ sessionToken }` y recibe `{ ok }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignUp.ts`
  - **Funciones:** `fbSignUp` - _Crea usuario en backend v2._
  - **Endpoints:** `[POST] /clientSignUp` - _Envía `{ userData }` y recibe `{ ok, user }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbUpdateUser.ts`
  - **Funciones:** `fbUpdateUser`, `fbUpdateUserPassword` - _Actualiza datos de usuario o cambia password (con password actual)._
  - **Endpoints:**
    - `[POST] /clientUpdateUser` - _Envía `{ userData }` y recibe `{ ok, user }`._
    - `[POST] /clientChangePassword` - _Envía `{ userId, oldPassword, newPassword }` y recibe `{ ok }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbUpdateUserPassword.ts`
  - **Funciones:** `fbUpdateUserPassword` - _Setea password sin validar la anterior (admin)._
  - **Endpoints:** `[POST] /clientSetUserPassword` - _Envía `{ userId, newPassword }` y recibe `{ ok }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbRevokeSession.ts`
  - **Funciones:** `fbRevokeSession` - _Revoca sesiones específicas._
  - **Endpoints:** `[POST] /clientRevokeSession` - _Envía `{ sessionToken, targetToken, targetUserId }` y recibe `{ ok, sessions }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbGetSessionLogs.ts`
  - **Funciones:** `fbGetSessionLogs` - _Lista logs de sesión._
  - **Endpoints:** `[POST] /clientListSessionLogs` - _Envía `{ sessionToken, targetUserId, limit, sessionInfo }` y recibe `{ logs }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser.ts`
  - **Funciones:** `fbValidateUser` - _Verificación de credenciales para autorizaciones secundarias._
  - **Endpoints:** `[POST] /clientValidateUser` - _Envía `{ username, password, uid }` y recibe `{ ok, userId, user }`._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts`
  - **Funciones:** `useUserDocListener` - _Escucha `users/{uid}` y sincroniza Redux._
  - **Endpoints:** `N/A` - _Listener Firestore._
- **Archivo:** `src/firebase/Auth/fbAuthV2/fbCheckIfUserExists.ts`
  - **Funciones:** `fbCheckIfUserExists` - _Valida duplicados en `users`._
  - **Endpoints:** `N/A` - _Lectura Firestore._
- **Archivo:** `src/firebase/Auth/fbAuthV2/types.ts`
  - **Funciones:** `SessionInfo`, `StoredSession` - _Tipos del sistema de sesiones._
  - **Endpoints:** `N/A` - _Tipos._
- **Archivo:** `src/firebase/presence/useRealtimePresence.ts`
  - **Funciones:** `useRealtimePresence` - _Registra presencia en RTDB usando `sessionId` y `deviceId`._
  - **Endpoints:** `N/A` - _RTDB._
- **Archivo:** `src/firebase/authorization/pinAuth.ts`
  - **Funciones:** `fbGenerateUserPin`, `fbValidateUserPin`, `fbGetUserPinStatus`, `fbViewUserPins` - _Autorización por PIN (módulos)._
  - **Endpoints:**
    - `[POST] /generateModulePins`
    - `[POST] /validateModulePin`
    - `[POST] /getUserModulePinStatus`
    - `[POST] /getUserModulePins`
    - `[POST] /getBusinessPinsSummary`
- **Archivo:** `src/hooks/useAuthorizationPin.ts`
  - **Funciones:** `useAuthorizationPin` - _Hook para abrir/cerrar modal PIN._
  - **Endpoints:** `N/A` - _UI._
- **Archivo:** `src/components/modals/PinAuthorizationModal/PinAuthorizationModal.tsx`
  - **Funciones:** `PinAuthorizationModal` - _Valida PIN (6 dígitos) o password fallback._
  - **Endpoints:**
    - `[POST] /validateModulePin`
    - `[POST] /clientValidateUser`
- **Archivo:** `src/components/modals/PeerReviewAuthorization/PeerReviewAuthorization.tsx`
  - **Funciones:** `PeerReviewAuthorization` - _Validación de credenciales para acciones sensibles._
  - **Endpoints:** `[POST] /clientValidateUser`
- **Archivo:** `src/firebase/Auth/fbLogin.ts`
  - **Funciones:** `fbLogin` - _Login legacy via Firebase Auth email/password._
  - **Endpoints:** `N/A` - _SDK Firebase Auth._
- **Archivo:** `src/firebase/Auth/fbSignInWithUsernameAndPassword.ts`
  - **Funciones:** `authenticateUser` - _Login legacy leyendo credenciales desde Firestore._
  - **Endpoints:** `N/A` - _Lectura Firestore + Firebase Auth._
- **Archivo:** `src/firebase/Auth/fbSignUpWithUsernameAndPassoword/functions/registerUser.ts`
  - **Funciones:** `registerUser` - _Crea usuario Firebase Auth, guarda token en localStorage y restaura sesión._
  - **Endpoints:** `N/A` - _SDK Firebase Auth._
- **Archivo:** `src/firebase/Auth/fbSignUpWithUsernameAndPassoword/fbSignUpWithUsernameAndPassword.ts`
  - **Funciones:** `fbSignUpUserAccount` - _Wrapper del registro legacy._
  - **Endpoints:** `N/A` - _SDK Firebase Auth._

- **Archivo:** `functions/src/index.js`
  - **Funciones:** `clientLogin`, `clientSignUp`, `clientLogout`, `authLogin`, `authLogout`, `generateModulePins`, etc. - _Exports de Cloud Functions._
  - **Endpoints:** _Todos los callable/HTTP/scheduled exportados por Firebase._
- **Archivo:** `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`
  - **Funciones:** `clientLogin`, `clientLoginWithProvider`, `clientClaimOwnership`, `clientValidateUser`, `clientSignUp`, `clientUpdateUser`, `clientChangePassword`, `clientSetUserPassword`, `clientRefreshSession`, `clientListSessionLogs`, `clientListSessions`, `clientRevokeSession`, `clientLogout`, `clientValidateSession` - _Core del auth v2 + sesiones._
  - **Endpoints:**
    - `[POST] /clientLogin` - _Recibe `{ username, password, sessionInfo }`, devuelve `{ sessionToken, sessionExpiresAt, user }`._
    - `[POST] /clientLoginWithProvider` - _Recibe `{ idToken, providerId, sessionInfo }`, devuelve `{ sessionToken, sessionExpiresAt, user }`._
    - `[POST] /clientValidateUser` - _Recibe `{ username/password }`, devuelve `{ userId, user }`._
    - `[POST] /clientSignUp` - _Recibe `{ userData }`, devuelve `{ ok, user }`._
    - `[POST] /clientUpdateUser` - _Recibe `{ userData }`, devuelve `{ ok, user }`._
    - `[POST] /clientChangePassword` - _Recibe `{ userId, oldPassword, newPassword }`, devuelve `{ ok }`._
    - `[POST] /clientSetUserPassword` - _Recibe `{ userId, newPassword }`, devuelve `{ ok }`._
    - `[POST] /clientRefreshSession` - _Recibe `{ sessionToken, extend, sessionInfo }`, devuelve `{ session, activeSessions }`._
    - `[POST] /clientListSessionLogs` - _Recibe `{ sessionToken, targetUserId, limit }`, devuelve `{ logs }`._
    - `[POST] /clientListSessions` - _Recibe `{ sessionToken }`, devuelve `{ sessions }`._
    - `[POST] /clientRevokeSession` - _Recibe `{ sessionToken, targetToken, targetUserId }`, devuelve `{ sessions }`._
    - `[POST] /clientLogout` - _Recibe `{ sessionToken }`, devuelve `{ ok }`._
    - `[POST] /clientClaimOwnership` - _Recibe `{ sessionToken }`, devuelve `{ ok, message }`._
- **Archivo:** `functions/src/app/versions/v2/auth/services/httpAuth.service.js`
  - **Funciones:** `resolveHttpAuthUser`, `verifySessionToken`, `verifyFirebaseToken` - _Auth para endpoints HTTP (Bearer ID token o X-Session-Token)._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v2/auth/triggers/presenceSync.js`
  - **Funciones:** `syncRealtimePresence` - _Trigger RTDB para sincronizar presencia en Firestore._
  - **Endpoints:** `[RTDB Trigger] /presence/{userId}/{connectionId}` - _Actualiza `users/{userId}.presence`._
- **Archivo:** `functions/src/app/versions/v2/auth/controllers/pin.controller.js`
  - **Funciones:** `generateModulePins`, `deactivateModulePins`, `getUserModulePinStatus`, `getBusinessPinsSummary`, `validateModulePin`, `getUserModulePins`, `autoRotateModulePins` - _Autorización por PIN y rotación programada._
  - **Endpoints:**
    - `[POST] /generateModulePins`
    - `[POST] /deactivateModulePins`
    - `[POST] /getUserModulePinStatus`
    - `[POST] /getBusinessPinsSummary`
    - `[POST] /validateModulePin`
    - `[POST] /getUserModulePins`
    - `[SCHEDULE] autoRotateModulePins` - _Cron 0 3 _ \* _ (America/Santo_Domingo)._
- **Archivo:** `functions/src/app/versions/v2/auth/pin/pin.crypto.js`
  - **Funciones:** `generatePinValue`, `encryptPin`, `decryptPin` - _AES-256-GCM para PIN._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v2/auth/pin/pin.constants.js`
  - **Funciones:** `EXPIRATION_HOURS`, `ALLOWED_MODULES` - _Config de PIN (24h, módulos permitidos)._
  - **Endpoints:** `N/A` - _Constantes._
- **Archivo:** `functions/src/app/versions/v2/auth/pin/pin.status.js`
  - **Funciones:** `calcExpiration`, `summarizeModules`, `buildLegacyStatus` - _Cálculo de expiración y estado de PIN._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v2/auth/pin/pin.users.js`
  - **Funciones:** `resolveActorContext`, `ensureBusinessMatch` - _Validaciones de actor/negocio._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v2/auth/pin/pin.audit.js`
  - **Funciones:** `logPinAction` - _Auditoría en `businesses/{businessID}/pinAuthLogs`._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v1/modules/auth/handle/handleLogin.js`
  - **Funciones:** `authLogin`, `authCheck`, `authLogout`, `expireSessions` - _Auth legacy con Firebase Auth custom tokens y job de expiración._
  - **Endpoints:**
    - `[POST] /authLogin` - _Recibe `{ username, password }`, devuelve `{ token, userId }`._
    - `[POST] /authCheck` - _Recibe `{ username, password }`, devuelve `{ valid }`._
    - `[POST] /authLogout` - _Revoca refresh tokens de Firebase Auth._
    - `[SCHEDULE] expireSessions` - _Desactiva usuarios expirados cada 60 min._
- **Archivo:** `functions/src/app/versions/v1/modules/auth/utils/hash.util.js`
  - **Funciones:** `verifyAndUpgrade` - _Compatibilidad bcrypt → argon2id._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v1/modules/auth/utils/user.util.js`
  - **Funciones:** `createFailedLoginFields`, `isAccountLocked`, `createLoginResponse` - _Lockout + respuestas estándar._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v1/modules/auth/utils/auth.util.js`
  - **Funciones:** `hashPassword`, `validatePermissions`, `prepareUserCreationData` - _Creación/actualización de usuarios._
  - **Endpoints:** `N/A` - _Servicio interno._
- **Archivo:** `functions/src/app/versions/v2/invoice/controllers/getInvoiceHttp.controller.js`
  - **Funciones:** `getInvoiceV2Http` - _Endpoint HTTP protegido por `resolveHttpAuthUser`._
  - **Endpoints:** `[GET] /getInvoiceV2Http` - _Requiere Bearer ID token o X-Session-Token._
- **Archivo:** `functions/src/app/versions/v2/invoice/controllers/repairInvoiceHttp.controller.js`
  - **Funciones:** `repairInvoiceV2Http` - _Endpoint HTTP protegido por `resolveHttpAuthUser`._
  - **Endpoints:** `[POST] /repairInvoiceV2Http` - _Requiere Bearer ID token o X-Session-Token._
- **Archivo:** `functions/src/app/versions/v2/invoice/controllers/autoRepairInvoiceHttp.controller.js`
  - **Funciones:** `autoRepairInvoiceV2Http` - _Endpoint HTTP protegido por `resolveHttpAuthUser`._
  - **Endpoints:** `[POST] /autoRepairInvoiceV2Http` - _Requiere Bearer ID token o X-Session-Token._
- **Archivo:** `functions/src/app/versions/v2/accountsReceivable/controllers/auditAccountsReceivableHttp.controller.js`
  - **Funciones:** `auditAccountsReceivableHttp` - _Endpoint HTTP protegido por `resolveHttpAuthUser`._
  - **Endpoints:** `[POST] /auditAccountsReceivableHttp` - _Requiere Bearer ID token o X-Session-Token._

# 4. Seguridad y Criptografía

- **Contraseñas:**
  - **v2:** `bcryptjs` (`bcrypt.hash(..., 10)`) almacenado en `users/{id}.user.password`.
  - **v1:** `argon2id` con parámetros (`memoryCost 64 MiB`, `timeCost 3`, `parallelism 1`) y upgrade automático desde bcrypt.
- **Tokens:**
  - **v2 (principal):** `sessionToken` propio (ID de documento en Firestore `sessionTokens/{tokenId}`), **no es JWT**. Expiración por `expiresAt` y `lastActivity`.
  - **v1 (legacy):** `admin.auth().createCustomToken(uid)` (Firebase Auth custom token) usado con el SDK de Firebase Auth.
  - **HTTP APIs:** `resolveHttpAuthUser` acepta **Bearer Firebase ID Token** o **X-Session-Token**.
- **PIN de autorización:**
  - **v2:** PIN de 6 dígitos cifrado con **AES-256-GCM** (`PIN_ENCRYPTION_KEY` base64 de 32 bytes).
  - **Legacy:** PIN almacenado con `bcrypt` en `authorizationPin`.
- **Protección de Rutas / Guards:**
  - **Frontend:** `RequireAuth` (Redux `user`), `useAutomaticLogin` (refresh periódico).
  - **Backend v2:** `ensureActiveSession(sessionToken)` en callables y `resolveHttpAuthUser` en endpoints HTTP.
  - **Backend v1:** `authLogin/authCheck` + Firebase Auth tokens.

# 5. Modelos de Datos

- **Colección `users/{userId}` (Firestore):**
  - Campo `user`: `{ id, name, displayName, realName, businessID, role, password, number, active, loginAttempts, lockUntil, passwordChangedAt, createAt, lastSuccessfulAuth, lastFailedAttempt, expirationDate? }`.
  - Campo `authorizationPins` (v2):
    - `modules.<module>`: `{ cipherText, iv, authTag, algorithm, version, isActive, status, createdAt, updatedAt, lastGeneratedAt, expiresAt, createdBy, lastGeneratedBy }`.
  - Campo `authorizationPin` (legacy): `{ pin (bcrypt), modules, isActive, expiresAt, createdAt, createdBy, ... }`.
  - Campo `presence`: `{ status, updatedAt, lastSeen, connectionCount }` (sincronizado desde RTDB).
- **Colección `sessionTokens/{tokenId}` (Firestore):**
  - `{ userId, expiresAt, createdAt, lastActivity, status, deviceId, deviceLabel, userAgent, ipAddress, platform, metadata, userDisplayName, userRealName, username }`.
- **Colección `sessionLogs/{logId}` (Firestore):**
  - `{ userId, sessionId, event (login/logout), context, createdAt }`.
- **Colección `businesses/{businessId}/counters/users`:**
  - `{ value, updatedAt }` para numeración secuencial de usuarios.
- **Colección `businesses/{businessId}/pinAuthLogs`:**
  - `{ action, reason, module(s), targetUserId, performedBy, timestamp }`.
- **RTDB `presence/{userId}/{connectionId}`:**
  - `{ state, updatedAt, sessionId, deviceId, businessId, actor }`.

# 6. Observaciones Técnicas (Análisis Estático)

- **Tokens en localStorage:** `sessionToken` se guarda en localStorage (no httpOnly) y también puede enviarse por query/body en HTTP; riesgo elevado ante XSS y exposición en logs. **Estado:** PENDIENTE.
- **Session token predecible:** el ID se construye como `${userId}_${timestamp}`; no es aleatorio criptográficamente. **Estado:** RESUELTO (ahora se usa `nanoid(32)` en `createSessionToken`).
- **Exposición de hash de contraseña:** `clientLogin`, `clientValidateUser`, `clientSignUp` y `clientUpdateUser` retornan el objeto `user` completo, que incluye `password` (hash). Debe filtrarse antes de responder. **Estado:** RESUELTO (respuesta sanitizada con `sanitizeUserResponse`).
- **Funciones v2 sin control de actor:** `clientSignUp`, `clientUpdateUser` y `clientSetUserPassword` no validan `request.auth` ni `sessionToken`; podrían ser invocadas sin autenticación y permitir cambios críticos (roles/password). **Estado:** RESUELTO (se valida con `assertAdminAccess`).
- **Passwords sin política mínima:** `assertPassword` solo valida existencia, sin requisitos de complejidad. **Estado:** RESUELTO en backend v2 (regex de complejidad + min 8); el login sigue sin exigir complejidad por compatibilidad legacy.
- **Login legacy inseguro:** `authenticateUser` compara password en texto plano leído de Firestore (`users/{username}`), indicando riesgo de credenciales en claro si se usa. **Estado:** PENDIENTE.
- **Mismatch de tokens en registro legacy:** `registerUser` guarda un **ID token** y luego usa `signInWithCustomToken` (espera **custom token**). Flujo puede fallar o crear estados inconsistentes. **Estado:** PENDIENTE.
- **Logs parciales:** `SESSION_LOG_WHITELIST` solo permite `login/logout`; eventos como `view-session-logs` no se guardan aunque se intenten registrar. **Estado:** PENDIENTE.
- **Expiraciones laxas:** duración por defecto de sesión v2 es 60 días y puede desactivarse totalmente (`CLIENT_AUTH_DISABLE_SESSION_EXPIRY=true`). **Estado:** PENDIENTE.
- **Reglas de seguridad no auditables:** `firebase.json` referencia `firestore.rules` y `storage.rules`, pero no están presentes en este workspace; no se puede validar control de acceso a nivel de reglas. **Estado:** PENDIENTE.
