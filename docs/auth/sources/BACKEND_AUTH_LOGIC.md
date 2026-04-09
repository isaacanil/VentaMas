# 1. Resumen Técnico

## Librerías / dependencias externas

- `bcryptjs`: comparación y hash de contraseñas (bcrypt con cost 10).
- `firebase-functions/v2/https`: `onCall` y `HttpsError`.
- `nanoid`: generación de IDs (usuarios y tokens de sesión v2).
- `process.env`: configuración runtime (duraciones, límites, lockout, etc.).

## Servicios internos / helpers utilizados

Importa desde `../../../../core/config/firebase.js`:

- `db`: acceso a Firestore.
- `Timestamp`, `FieldValue`: timestamps y operaciones de actualización.

Helpers definidos en el mismo archivo (privados):

- Normalización y consultas: `normalizeName`, `findUserByName`, `ensureUserExists`, `ensureUniqueUsername`.
- Control de sesiones: `createSessionToken`, `ensureActiveSession`, `cleanupOldTokens`, `enforceSessionLimit`, `getActiveSessions`, `revokeAllUserSessions`, `syncUserPresence`.
- Auditoría y estado: `logSessionEvent`, `buildSessionPayload`, `buildSessionLogPayload`, `updateUserPresence`.
- Validaciones: `assertPassword`, `assertCanViewSessionLogs`.
- Seguridad/accenso: `assertAdminAccess`.
- Sanitización: `sanitizeUserResponse`.
- Utilidades: `extractRequestInfo`, `toMillis`.

# 2. Análisis de Endpoints Principales

> Todos estos endpoints son **Callable Functions** (`onCall`), consumidos desde el frontend vía `httpsCallable`.

## `clientLogin`

### Input (Request)

Payload esperado en `data`:

```json
{
  "username": "string", // o "name"
  "password": "string",
  "sessionInfo": {
    "deviceId": "string?",
    "deviceLabel": "string?",
    "userAgent": "string?",
    "platform": "string?",
    "metadata": { "timezone": "", "language": "", "...": "" }
  }
}
```

> `sessionInfo` es opcional y el backend también usa `rawRequest.headers` para inferir `userAgent` y `x-forwarded-for`.

### Proceso (Paso a Paso)

1. Normaliza el `username`/`name`.
2. Valida que `password` exista (no valida complejidad).
3. Busca el usuario en Firestore por `user.name`.
4. Verifica bloqueo: `lockUntil` y `loginAttempts`.
5. Compara el hash con `bcrypt.compare`.
6. Si falla, incrementa `loginAttempts` y aplica lockout al superar el máximo.
7. Si ok, resetea `loginAttempts` y `lockUntil`.
8. Aplica límite de sesiones activas (`enforceSessionLimit`).
9. Genera token de sesión **aleatorio** con `nanoid(32)` y guarda en `sessionTokens`.
10. Registra evento en `sessionLogs` (solo `login/logout`).
11. Sincroniza presencia del usuario y devuelve sesiones activas.

### Output (Response)

```json
{
  "ok": true,
  "userId": "<uid>",
  "user": { /* user sanitizado, sin password/loginAttempts/lockUntil/history */ },
  "sessionToken": "<token>",
  "sessionExpiresAt": 173... ,
  "session": { /* payload de la sesión */ },
  "activeSessions": [ /* sesiones activas */ ],
  "businessHasOwners": true
}
```

---

## `clientSignUp`

### Input (Request)

Payload esperado en `data` (y ahora requiere sesión admin):

```json
{
  "sessionToken": "<token>",
  "userData": {
    "name": "string",
    "password": "string",
    "businessID": "string",
    "role": "string",
    "...": "..."
  }
}
```

### Proceso (Paso a Paso)

1. **`assertAdminAccess`**: valida `sessionToken` (o `context.auth.uid`) y rol `admin`.
2. Valida campos obligatorios (`name`, `password`, `businessID`, `role`).
3. Normaliza `name` y verifica unicidad (`ensureUniqueUsername`).
4. Genera `id` con `nanoid(10)`.
5. Hashea contraseña con `bcrypt.hash(password, 10)`.
6. Obtiene numeración secuencial por negocio (`getNextUserNumber`).
7. Construye payload `user` con estado activo y flags de login.
8. Guarda en `users/{id}`.

### Output (Response)

```json
{
  "ok": true,
  "id": "<uid>",
  "user": {
    /* user sanitizado, sin password/loginAttempts/lockUntil/history */
  }
}
```

---

## `clientValidateUser`

### Input (Request)

Payload esperado en `data`:

```json
{
  "username": "string", // o "name"
  "password": "string",
  "uid": "string?"
}
```

### Proceso (Paso a Paso)

1. Valida que `password` exista.
2. Si viene `uid`, carga `users/{uid}`. Si no, busca por `user.name`.
3. Compara `bcrypt.compare(password, user.password)`.
4. Si falla, lanza `unauthenticated`.

### Output (Response)

```json
{
  "ok": true,
  "userId": "<uid>",
  "user": {
    /* user sanitizado, sin password/loginAttempts/lockUntil/history */
  }
}
```

---

## `clientLoginWithProvider`

### Input (Request)

Payload esperado en `data`:

```json
{
  "idToken": "string",
  "providerId": "google.com|microsoft.com|...",
  "sessionInfo": { "...": "..." }
}
```

### Proceso (Paso a Paso)

1. Verifica el `idToken` con `admin.auth().verifyIdToken`.
2. Obtiene `email`, `uid/sub`, `displayName`, `photoURL`.
3. Busca usuario por `emailLower`.
4. Si existe: vincula proveedor (`providers` + `identities`) y actualiza `meta.lastLoginAt`.
5. Si no existe: crea usuario **solo si** `ALLOW_PUBLIC_SIGNUP=true`.
6. Genera sesión con `createSessionToken`.

### Output (Response)

```json
{
  "ok": true,
  "userId": "<uid>",
  "user": { /* user sanitizado */ },
  "sessionToken": "<token>",
  "sessionExpiresAt": 173...,
  "session": { /* payload de la sesión */ },
  "activeSessions": [ /* sesiones activas */ ],
  "businessHasOwners": true
}
```

---

## `clientClaimOwnership`

### Input (Request)

Payload esperado en `data`:

```json
{
  "sessionToken": "<token>"
}
```

### Proceso (Paso a Paso)

1. Valida sesión con `ensureActiveSession`.
2. Verifica rol admin (legacy) del usuario.
3. Revisa `businesses/{businessId}.owners`:
   - Si hay dueños → rechaza.
   - Si está vacío → agrega `userId`, setea `billingContact` y actualiza rol a `OWNER`.

### Output (Response)

```json
{
  "ok": true,
  "message": "Ahora eres el propietario registrado."
}
```

# 3. Conexión con el Frontend

- El frontend usa `httpsCallable` (Firebase Functions Callable). Ejemplos en:
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts`
  - `src/firebase/Auth/fbAuthV2/fbSignUp.ts`
  - `src/firebase/Auth/fbAuthV2/fbSignIn/fbVerifyUser.ts`
- La comunicación es **payload JSON en `data`**, no un endpoint REST clásico.
- **Headers:** No hay validación explícita de headers en los callables. `extractRequestInfo` solo **lee** `user-agent` y `x-forwarded-for` para auditoría y metadatos.
- **Tokens de sesión:** Para operaciones admin (`clientSignUp`, `clientUpdateUser`, `clientSetUserPassword`) el frontend debe enviar `data.sessionToken`.

# 4. Lógica de Seguridad Actual (Estado Actual)

## Tokens de sesión

- Se generan en `createSessionToken` con `nanoid(32)`.
- Se guardan en Firestore `sessionTokens/{tokenId}` con:
  - `expiresAt`, `createdAt`, `lastActivity`, `deviceId`, `deviceLabel`, `userAgent`, `ipAddress`, `metadata`.
- Validados por `ensureActiveSession`:
  - Si expiran → revoca y rechaza.
  - Si exceden `SESSION_IDLE_TIMEOUT_MS` → revoca y rechaza.

## Validación de contraseñas

- Login y validaciones usan `bcrypt.compare`.
- Hash de nuevas contraseñas usa `bcrypt.hash(..., 10)`.

## Roles / permisos

- `clientSignUp`, `clientUpdateUser`, `clientSetUserPassword` **requieren admin** via `assertAdminAccess`.
  - Se valida `sessionToken` activo o `context.auth.uid`.
  - Se verifica rol `user.role === 'admin'` en Firestore.
- `clientLogin` y `clientValidateUser` **no requieren sesión previa** (son públicos por diseño).
