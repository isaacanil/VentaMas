# Analisis del auth real para preparar un entorno local con Emulator Suite

## 📋 Contexto

Esta pasada fue solo de inspeccion y planificacion. Se reviso el repo, la configuracion Firebase local y el proyecto `ventamaxpos` en modo estrictamente read-only para entender el flujo real de identidad/autorizacion antes de proponer cualquier setup local.

El analisis se aterrizo sobre el usuario de prueba `dev#3407` y su negocio activo `X63aIFwHzk3r0gmT8w6P`.

## 🎯 Objetivos

- Determinar como se autentica realmente el usuario.
- Separar que parte de la identidad vive en Firebase Auth y que parte vive en Firestore.
- Identificar dependencias ocultas entre Auth, Functions, Firestore y Realtime Database.
- Detectar que datos minimos tendran que existir despues en local para reproducir el flujo real.

## ⚙️ Diseño / Arquitectura

### Flujo real de login

El proyecto no usa `signInWithEmailAndPassword`. El login principal es hibrido:

| Paso | Componente real | Observacion |
| --- | --- | --- |
| 1 | Frontend `fbSignIn` | Llama la callable `clientLogin` |
| 2 | Function `clientLogin` | Busca `users/{uid}` por `name`, valida `password` con `bcrypt` y crea `sessionTokens/{token}` |
| 3 | Function `clientLogin` | Genera `firebaseCustomToken` con `admin.auth().createCustomToken(uid)` |
| 4 | Frontend | Hace `signInWithCustomToken(auth, firebaseCustomToken)` |
| 5 | Frontend | Guarda `sessionToken`, expiracion y `sessionId` en `localStorage` |
| 6 | Frontend | Normaliza el contexto del usuario desde Firestore y Redux |

La restauracion de sesion tampoco depende solo de Firebase Auth. Al boot, la app llama `clientRefreshSession`, valida el `sessionToken`, renueva la sesion del backend y vuelve a ejecutar `signInWithCustomToken`.

El login social tambien termina en el mismo patron: provider sign-in temporal, verificacion del ID token en Functions y devolucion de `sessionToken + firebaseCustomToken`.

### Donde vive la identidad real

La identidad operativa esta repartida entre varias capas:

| Capa | Fuente de verdad real | Para que se usa |
| --- | --- | --- |
| Firebase Auth | `auth.currentUser`, ID token derivado por custom token | Habilitar `request.auth`, listeners cliente y headers Bearer |
| Firestore `users/{uid}` | Perfil raiz del usuario | `activeBusinessId`, `lastSelectedBusinessId`, `activeRole`, `platformRoles`, `accessControl`, `memberships`, `authorizationPins`, `roleSimulation` |
| Firestore `sessionTokens/{token}` | Sesion de backend | Validez de sesion, expiracion, device metadata, concurrencia |
| Firestore `businesses/{businessId}/members/{uid}` | Membresia canonica | Rol real por negocio y fuente prioritaria en backend |
| Firestore `businesses/{businessId}/userPermissions/{uid}` | Overlay dinamico | Permisos adicionales o restringidos sobre el rol base |
| Firestore `businesses/{businessId}` | Contexto del negocio | `ownerUid`, `owners`, `subscription`, `business.billingSettings` |
| RTDB `presence/{uid}/{connectionId}` | Presencia en linea | Hook global del frontend y trigger que espeja a `users/{uid}.presence` |

### Auth de Firebase no es la autorizacion real

Hallazgos clave:

- No se encontro uso real de custom claims para permisos.
- No aparecio `setCustomUserClaims` en el repo.
- No aparecio `getIdTokenResult` ni reglas que dependan de `request.auth.token`.
- El custom token de Firebase se usa como sesion derivada, no como fuente principal de roles.

En este sistema la autorizacion real cruza:

- `users/{uid}.accessControl`
- `users/{uid}.activeRole`
- `users/{uid}.platformRoles.dev`
- `businesses/{businessId}/members/{uid}`
- `businesses/{businessId}/userPermissions/{uid}`
- `businesses/{businessId}.ownerUid`
- `businesses/{businessId}.subscription`

### Inconsistencias reales que el entorno local no debe "arreglar"

El negocio de prueba confirma que el modelo actual mezcla varias fuentes de autoridad:

- Usuario inspeccionado: `users/BdNGtDt3y0`
- `platformRoles.dev = true`
- `activeBusinessId = X63aIFwHzk3r0gmT8w6P`
- `activeRole = cashier`
- `accessControl[X63aIFwHzk3r0gmT8w6P].role = cashier`
- Membresia canonica: `businesses/X63aIFwHzk3r0gmT8w6P/members/BdNGtDt3y0.role = cashier`
- Negocio raiz: `businesses/X63aIFwHzk3r0gmT8w6P.ownerUid = BdNGtDt3y0`

Eso significa que hoy coexisten al menos tres nociones de privilegio:

1. Rol global de plataforma.
2. Rol activo por negocio.
3. Propiedad del negocio por `ownerUid`.

Algunas Functions usan la membresia canonica, otras leen campos del user root y otras usan `ownerUid`. Por eso el seed futuro debe preservar esta combinacion real, no simplificarla.

### Dependencias ocultas detectadas

#### 1. Realtime Database es dependencia funcional, no opcional cosmetica

`GlobalListeners` monta `useRealtimePresence` para todo usuario autenticado. Ese hook escribe en RTDB y usa `onDisconnect`. Luego `syncRealtimePresence` replica el estado a Firestore.

Implicacion:

- Si el frontend local no redirige RTDB al emulador, va a intentar escribir presencia contra la URL real definida en `.env`.

#### 2. `connectFunctionsEmulator` no alcanza por si solo

La app no consume solo callables. Tambien tiene clientes HTTP que construyen URLs de Functions con:

- `VITE_FIREBASE_FUNCTIONS_BASE_URL`, o
- `https://{region}-{project}.cloudfunctions.net`

Implicacion:

- Aunque se conecten las callables al emulador, los endpoints HTTP seguirian apuntando a produccion si no se sobreescribe esa base URL.

#### 3. Firestore local usa cache persistente

`src/firebase/firebaseconfig.tsx` inicializa Firestore con `persistentLocalCache(...)`.

Implicacion:

- El futuro setup local tendra riesgo de datos stale si no se agrega una estrategia explicita para emulador.

#### 4. El arranque crea documentos si faltan

Se detectaron dos autocreaciones relevantes:

- `settings/billing` se crea si no existe.
- `taxReceipts` default se crea si la coleccion esta vacia.

Implicacion:

- Para un seed controlado conviene incluir esos documentos desde el inicio y evitar escrituras automaticas al boot.

### Hallazgos concretos del negocio `X63aIFwHzk3r0gmT8w6P`

Inspeccion read-only sobre el negocio activo de `dev#3407`:

| Coleccion / subcoleccion | Conteo observado | Comentario |
| --- | --- | --- |
| `members` | 18 | Roles `admin` y `cashier` |
| `userPermissions` | 2 | Overlay de permisos dinamicos |
| `products` | 779 | Demasiado grande para clonar completo |
| `clients` | 16 | Coleccion manejable, pero no todos son necesarios |
| `invoices` | 831 | Canonica legacy aun viva |
| `invoicesV2` | 237 | Pipeline nuevo; algunos docs con `outbox/*` |
| `accountsReceivable` | 130 | Depende de clientes e invoices |
| `accountsReceivablePayments` | 147 | Dominio de pagos repartido |
| `cashCounts` | 37 | Query global al arrancar |
| `purchases` | 46 | Ligada a inventario |
| `expenses` | 11 | Ligada a caja y categorias |
| `settings` | 3 | Incluye `billing`; `taxReceipt` no existe en este negocio |
| `taxReceipts` | 4 | Evita autocreacion al boot |
| `counters` | 14 | Criticos para IDs y flujos de escritura |

Ademas:

- El negocio raiz ya tiene snapshot de `subscription` util para los chequeos de billing.
- `settings/billing` tiene `authorizationFlowEnabled = true`.
- Los modulos de autorizacion activos incluyen `invoices`, `accountsReceivable` y `cashRegister`.
- El usuario inspeccionado tiene `authorizationPins.version = 2`.

### Reglas y diferencias entre repo y produccion

Se detecto una divergencia relevante:

- Reglas locales en repo para Firestore: `allow read, write: if request.auth != null;`
- Reglas desplegadas observadas en produccion: abiertas (`if true`)

Esto no cambia el plan del emulador, pero si cambia la expectativa:

- Un entorno local basado en reglas del repo puede bloquear operaciones que hoy pasan en produccion.
- Esa diferencia debe tratarse como riesgo conocido hasta que las reglas se reconcilien.

### Servicios que el auth real obliga a considerar para local

| Servicio | Estado | Motivo |
| --- | --- | --- |
| Firestore | Obligatorio | Users, businesses, memberships, sessions, catalogos, transacciones |
| Functions | Obligatorio | `clientLogin`, `clientRefreshSession`, `clientSelectActiveBusiness` y writes de negocio |
| Auth | Obligatorio | `signInWithCustomToken`, `auth.currentUser`, ID tokens para HTTP |
| Realtime Database | Obligatorio | Presencia global del frontend |
| Storage | Opcional en Fase 1 | Necesario solo para flujos de subida/imagenes |
| Pub/Sub | Opcional | Solo si luego se quieren cubrir cron jobs y tests scheduler/pubsub |
| Eventarc | No requerido hoy | No se encontraron custom Eventarc handlers propios; los triggers de Firestore/RTDB ya se cubren con sus emuladores |

## 📈 Impacto / Trade-offs

- El entorno local no puede montarse como un simple `Auth + Firestore`.
- Firebase Auth por si solo no modela la autorizacion de este sistema.
- No usar custom claims simplifica el seed del Auth Emulator.
- El verdadero costo esta en preservar la relacion `user root -> active business -> canonical member -> business subscription -> dynamic permissions`.
- El mayor riesgo operativo es una redireccion parcial que deje RTDB o HTTP Functions pegando a produccion.

## 🔜 Seguimiento / Próximos pasos

- Documentar una estrategia futura para login local con password local-only y sesion real via `clientLogin`.
- Documentar el dataset minimo y el orden de poblado para `X63aIFwHzk3r0gmT8w6P`.
- Añadir una estrategia futura de redireccion total del frontend a emuladores, incluyendo RTDB y HTTP Functions.
- Resolver en una fase posterior la divergencia entre reglas locales y reglas desplegadas.

Fuentes revisadas en esta pasada:

- Repo: `src/firebase/Auth/fbAuthV2`, `src/services/functionsApiClient.ts`, `src/router/GlobalListeners.tsx`, `src/firebase/presence/useRealtimePresence.ts`, `functions/src/app/versions/v2/auth`, `functions/src/app/versions/v2/invoice`, `functions/src/app/modules/*`
- Firebase read-only: proyecto `ventamaxpos`, Functions desplegadas, reglas, usuario `dev#3407`, negocio `X63aIFwHzk3r0gmT8w6P`
- Documentacion oficial Firebase Emulator Suite:
  - https://firebase.google.com/docs/emulator-suite/connect_auth
  - https://firebase.google.com/docs/emulator-suite/connect_functions
  - https://firebase.google.com/docs/emulator-suite/connect_firestore
  - https://firebase.google.com/docs/emulator-suite/connect_rtdb
  - https://firebase.google.com/docs/emulator-suite/connect_storage
  - https://firebase.google.com/docs/emulator-suite/install_and_configure
