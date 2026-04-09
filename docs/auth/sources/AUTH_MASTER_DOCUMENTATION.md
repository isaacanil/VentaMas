# 1. Arquitectura de Alto Nivel

## Resumen

El Frontend (React) se autentica contra Firebase Functions **Callable** usando `httpsCallable`. El flujo principal es **auth propio v2** con credenciales (username/password) en Firestore y **tokens de sesión propios** almacenados en la colección `sessionTokens`. El cliente guarda el `sessionToken` en `localStorage` y lo renueva periódicamente mediante `clientRefreshSession` (hook `useAutomaticLogin`).

## Componentes Clave

- **Backend (Functions v2):**
  - `bcryptjs` para hashing y comparación de contraseñas.
  - `nanoid` para generar `sessionToken` aleatorio.
  - `firebase-functions` (v2) para `onCall` y manejo de errores (`HttpsError`).
  - Firestore (`db`, `Timestamp`, `FieldValue`) para usuarios y sesiones.
- **Frontend (React + Ant Design):**
  - Ant Design `Form` + `Input.Password` con reglas de validación reutilizables.
  - Firebase Functions SDK (`httpsCallable`) para invocar endpoints.
  - Redux para estado de usuario (`userSlice`).
  - `localStorage` para persistencia del `sessionToken` y `sessionExpiresAt`.

# 2. Mecanismos de Seguridad (Estado Actual)

## Generación de Tokens

- `sessionToken` se genera con **`nanoid(32)`** (cadena aleatoria de 32 caracteres).
- Se guarda en Firestore `sessionTokens/{tokenId}` junto con metadatos de dispositivo y expiración.

## Protección de Datos

- Respuestas al cliente **no incluyen** campos sensibles. Se sanitizan y se eliminan:
  - `password`
  - `loginAttempts`
  - `lockUntil`
  - `history`

## Almacenamiento de Contraseñas

- Contraseñas se guardan **hasheadas** en `users/{id}.user.password` usando **bcrypt** (`bcryptjs`).
- Comparaciones siempre con `bcrypt.compare`.

# 3. Matriz de Validación de Contraseñas (Frontend vs Backend)

| Regla           | Frontend (React Forms)                                                            | Backend (Controller)                                                                                        | ¿Coinciden? |
| :-------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- | :---------- |
| Longitud Mínima | **8 caracteres** (`PASSWORD_STRENGTH_RULE`)                                       | **8 caracteres** (regex en `assertPassword`)                                                                | **Sí**      |
| Complejidad     | 1 Mayúscula + 1 Minúscula + 1 Número                                              | Regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`                                                             | **Sí**      |
| Casos de Uso    | Registro y cambios de contraseña (UserForm, ChangePassword, ChangerPasswordModal) | `clientSignUp`, `clientUpdateUser` (si actualiza password), `clientChangePassword`, `clientSetUserPassword` | **Sí**      |

**Nota sobre Login:**

- El Login **NO** aplica reglas de complejidad para evitar bloquear usuarios legacy. Se valida solo existencia y coincidencia de hash.

# 4. Flujos de Datos Detallados (Step-by-Step)

## A. Inicio de Sesión (Login)

1. **Frontend** (`LoginForm`) envía `{ username, password, sessionInfo }` vía `httpsCallable('clientLogin')`.
2. **Backend**:
   - Normaliza el username.
   - Verifica intentos fallidos y lockout.
   - `bcrypt.compare` con hash guardado.
   - Genera `sessionToken` con `nanoid(32)`.
   - Guarda sesión en `sessionTokens` con metadatos (dispositivo, userAgent, IP, expiración).
   - Registra evento `login` en `sessionLogs`.
3. **Backend** responde con objeto `user` **sanitizado**, `sessionToken`, `sessionExpiresAt`, `session`.
4. **Frontend** guarda el token en `localStorage` y actualiza Redux (`userSlice`).

## B. Creación de Usuario (SignUp)

1. **Frontend** valida contraseña con `PASSWORD_STRENGTH_RULE`.
2. **Frontend** envía `{ sessionToken, userData }` vía `httpsCallable('clientSignUp')`.
3. **Backend**:
   - **Valida sesión + rol admin** (`assertAdminAccess`).
   - Aplica `assertPassword` (regex fuerte).
   - Hash con `bcrypt.hash`.
   - Guarda usuario en `users/{id}`.
4. **Backend** responde con `user` sanitizado (sin `password`).

## C. Restauración de Sesión

1. **Frontend** (`useAutomaticLogin`) lee `sessionToken` desde `localStorage`.
2. Llama a `clientRefreshSession` para extender expiración si la sesión es válida.
3. **Backend** (`ensureActiveSession`) valida expiración e inactividad.
4. Si es válida, actualiza `lastActivity` y devuelve el estado de sesión.
5. **Frontend** rehidrata datos del usuario desde Firestore (`useUserDocListener`).

## D. Login con Proveedor (Google/Microsoft)

1. **Frontend** (`SocialLogin`) obtiene `idToken` con Firebase Auth y llama `clientLoginWithProvider`.
2. **Backend**:
   - Verifica el `idToken` con `admin.auth().verifyIdToken`.
   - Busca usuario por `email`.
   - Si existe: vincula proveedor (`providers` + `identities`) y actualiza `meta.lastLoginAt`.
   - Si no existe: crea usuario **solo si** `ALLOW_PUBLIC_SIGNUP=true`; en caso contrario rechaza.
3. **Backend** responde igual que `clientLogin` (incluye `sessionToken`, `sessionExpiresAt`, `user` sanitizado y `businessHasOwners`).

## E. Reclamo de Propiedad (Legacy Admins)

1. **Frontend** muestra modal si `role === admin` y `businessHasOwners === false`.
2. Llama `clientClaimOwnership` con `sessionToken`.
3. **Backend** valida sesión y rol admin; si el negocio no tiene `owners`, agrega al usuario y actualiza `billingContact` + `role=OWNER`.
4. **Frontend** actualiza el rol local a `OWNER` y oculta el modal.

# 5. Control de Acceso (Roles)

- **Funciones críticas**:
  - `clientSignUp`, `clientUpdateUser`, `clientSetUserPassword` requieren **rol admin**.
- **Validación de código**:
  - `assertAdminAccess` valida que el request tenga un `sessionToken` válido (o `context.auth.uid`) y que el usuario tenga `role === 'admin'`.
  - Si no cumple, lanza `HttpsError('permission-denied', 'Acceso denegado: Se requieren permisos de administrador')`.

---

Este documento refleja el estado actual del sistema luego de los refactors de seguridad y estandarización.
