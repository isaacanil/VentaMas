# Schema Ideal V3 (Plano) – Omni‑Auth + Compatibilidad Legacy

## 1) Diseño “Schema Ideal V3” (Plano)

### Principios

- **Campos de identidad y autorización a la raíz** para consultas simples.
- **Sub‑objetos solo cuando agrupa semánticamente** (ej: `presence`, `identities`, `meta`).
- **Compatibilidad temporal**: mantener un objeto `user` legacy con espejo de campos críticos mientras se migra el frontend.

### Estructura propuesta (raíz plana)

```json
{
  "id": "<uid>",
  "name": "<username>",
  "displayName": "<display>",
  "realName": "<real>",
  "businessID": "<businessId>",
  "role": "admin|manager|...",
  "number": 1,
  "active": true,

  "password": "<bcrypt-hash>",
  "loginAttempts": 0,
  "lockUntil": null,
  "passwordChangedAt": "<Timestamp>",

  "email": "juan@dominio.com",
  "emailLower": "juan@dominio.com",
  "emailVerified": true,

  "phoneNumber": "+18095551234",
  "phoneNumberE164": "+18095551234",
  "phoneVerified": true,

  "providers": ["username_password_legacy", "password_v2", "google", "phone"],

  "identities": {
    "google": {
      "uid": "google-sub",
      "email": "juan@dominio.com",
      "linkedAt": "<Timestamp>"
    },
    "microsoft": {
      "id": "ms-oid",
      "email": "juan@dominio.com",
      "linkedAt": "<Timestamp>"
    },
    "apple": {
      "sub": "apple-sub",
      "email": "<private-or-real>",
      "isPrivateEmail": true,
      "linkedAt": "<Timestamp>"
    },
    "phone": {
      "phoneNumber": "+18095551234",
      "linkedAt": "<Timestamp>"
    }
  },

  "presence": {
    "status": "online|offline",
    "updatedAt": "<Timestamp>",
    "lastSeen": "<Timestamp>",
    "connectionCount": 1
  },

  "meta": {
    "primaryProvider": "password_v2",
    "createdAt": "<Timestamp>",
    "updatedAt": "<Timestamp>",
    "lastLoginAt": "<Timestamp>"
  },

  "authorizationPins": { "...": "..." },
  "authorizationPin": { "...": "..." }
}
```

---

## 2) Plan de Transición (Backward Compatibility)

### Problema actual

El frontend actual lee `doc.data().user.name` y campos dentro de `user`.

### Solución temporal recomendada

- **Mantener un objeto `user` legacy como espejo** de los campos críticos.
- Implementar un **Cloud Function Trigger** que sincronice **raíz → user** en cada escritura.
- Esto permite migrar el frontend gradualmente sin romper lectura legacy.

### Estrategia

1. **Nueva escritura**: backend escribe en raíz (schema V3).
2. **Trigger onWrite**: copia los campos esenciales a `user`.
3. **Frontend legacy** sigue funcionando con `user.*`.
4. **Frontend nuevo** usa directamente la raíz.
5. Cuando todo esté migrado, se elimina el espejo `user`.

### Campos a espejar en `user` (mínimo viable)

- `id`, `name`, `displayName`, `realName`, `businessID`, `role`, `number`, `active`
- `password`, `loginAttempts`, `lockUntil`, `passwordChangedAt`
- `email`, `emailLower`, `emailVerified`
- `phoneNumber`, `phoneNumberE164`, `phoneVerified`
- `providers`
- `meta` (opcional) o subset relevante

---

### Pseudocódigo Trigger `onWrite`

```js
// functions/src/app/triggers/syncUserLegacyMirror.js
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { db, FieldValue } from '../core/config/firebase.js';

export const syncUserLegacyMirror = onDocumentWritten(
  'users/{userId}',
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const data = after.data() || {};
    const userId = event.params.userId;

    // Evitar loop: si el write fue solo para el espejo legacy, salir
    if (data.__legacyMirrorUpdated) return;

    const legacyUser = {
      id: data.id || userId,
      name: data.name || null,
      displayName: data.displayName || null,
      realName: data.realName || null,
      businessID: data.businessID || null,
      role: data.role || null,
      number: data.number ?? null,
      active: data.active ?? true,

      password: data.password || null,
      loginAttempts: data.loginAttempts ?? 0,
      lockUntil: data.lockUntil ?? null,
      passwordChangedAt: data.passwordChangedAt ?? null,

      email: data.email || null,
      emailLower: data.emailLower || null,
      emailVerified: data.emailVerified ?? false,
      phoneNumber: data.phoneNumber || null,
      phoneNumberE164: data.phoneNumberE164 || null,
      phoneVerified: data.phoneVerified ?? false,

      providers: Array.isArray(data.providers) ? data.providers : [],
    };

    await db.doc(`users/${userId}`).set(
      {
        user: legacyUser,
        __legacyMirrorUpdated: true,
        __legacyMirrorUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
```

**Notas del trigger:**

- Se usa un **flag interno** (`__legacyMirrorUpdated`) para evitar loops.
- Se puede limpiar ese flag en una función programada o dejarlo como marcador interno.
- Si se desea evitar contaminaciones, usar un `eventId` guardado en memoria/DB para deduplicar.

---

## 3) JSON Final (Usuario completo con Google + Legacy)

```json
{
  "id": "u_9Qv2hX3A",
  "name": "juan",
  "displayName": "Juan Perez",
  "realName": "Juan Perez",
  "businessID": "b_123",
  "role": "admin",
  "number": 12,
  "active": true,

  "password": "$2a$10$abcdef...",
  "loginAttempts": 0,
  "lockUntil": null,
  "passwordChangedAt": "2026-02-01T20:10:00Z",

  "email": "juan@gmail.com",
  "emailLower": "juan@gmail.com",
  "emailVerified": true,

  "phoneNumber": "+18095551234",
  "phoneNumberE164": "+18095551234",
  "phoneVerified": true,

  "providers": ["password_v2", "google", "phone"],

  "identities": {
    "google": {
      "uid": "google-sub-123",
      "email": "juan@gmail.com",
      "linkedAt": "2026-02-01T20:11:00Z"
    },
    "phone": {
      "phoneNumber": "+18095551234",
      "linkedAt": "2026-02-01T20:11:30Z"
    }
  },

  "presence": {
    "status": "online",
    "updatedAt": "2026-02-01T20:12:00Z",
    "lastSeen": "2026-02-01T20:12:00Z",
    "connectionCount": 1
  },

  "meta": {
    "primaryProvider": "password_v2",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-02-01T20:12:00Z",
    "lastLoginAt": "2026-02-01T20:12:00Z"
  },

  "authorizationPins": { "...": "..." },
  "authorizationPin": { "...": "..." },

  "user": {
    "id": "u_9Qv2hX3A",
    "name": "juan",
    "displayName": "Juan Perez",
    "realName": "Juan Perez",
    "businessID": "b_123",
    "role": "admin",
    "number": 12,
    "active": true,

    "password": "$2a$10$abcdef...",
    "loginAttempts": 0,
    "lockUntil": null,
    "passwordChangedAt": "2026-02-01T20:10:00Z",

    "email": "juan@gmail.com",
    "emailLower": "juan@gmail.com",
    "emailVerified": true,

    "phoneNumber": "+18095551234",
    "phoneNumberE164": "+18095551234",
    "phoneVerified": true,

    "providers": ["password_v2", "google", "phone"]
  },

  "__legacyMirrorUpdated": true,
  "__legacyMirrorUpdatedAt": "2026-02-01T20:12:00Z"
}
```

---

### Recomendación final

- Migrar **lecturas** del frontend a la raíz en fases.
- Mantener el espejo `user` solo durante la transición.
- Definir un cutoff (por ejemplo 2 releases) para eliminar el mirror.
