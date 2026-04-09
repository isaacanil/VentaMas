# ARCHITECTURE_V3_STATUS.md

# 1. El Nuevo Modelo de Datos (Flat Schema)

## Ejemplo JSON real (post‑migración)

> Nota: el documento ahora expone campos críticos **en la raíz** y mantiene un espejo `user` para compatibilidad legacy.

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

  "__legacyMirrorUpdatedAt": "2026-02-01T20:12:00Z",
  "__legacyMirrorUpdatedBy": "syncUserLegacyMirror"
}
```

**Campos clave en la raíz:**

- `email`, `providers`, `role`, `active`, `phoneNumber`, `identities`

**Compatibilidad legacy:**

- El objeto `user` sigue presente y refleja los campos críticos para frontend antiguo.

---

# 2. Mecanismo de Compatibilidad (The Mirror)

## Cloud Function: `syncUserLegacyMirror`

- Trigger **Firestore v2** `onDocumentWritten` en `users/{userId}`.
- Detecta cambios en campos raíz (name, email, role, etc.).
- Si hay cambios, **copia** valores a `user` (legacy) con `merge: true`.
- No actúa si el documento fue borrado.

### Diagrama de Flujo (Texto)

1. **Escritura en raíz** (Frontend nuevo / Admin / migración)
2. **Trigger detecta cambios** en campos raíz
3. **Copia a `user` legacy** con merge
4. **Frontend viejo** sigue leyendo `doc.data().user.*`

### Medidas anti‑loop

- Solo escribe si **detecta cambios reales** en los campos raíz.
- Compara el espejo actual y evita escribir si ya está sincronizado.
- Usa marcas internas (`__legacyMirrorUpdatedAt`, `__legacyMirrorUpdatedBy`) para trazabilidad.

---

# 3. Estrategia Omni‑Auth (Preparado para el Futuro)

La base ya tiene “slots” listos para conectar proveedores:

- **Google / Microsoft / Apple**
  - `identities.google.uid`, `identities.microsoft.id`, `identities.apple.sub`
  - `email` / `emailLower` para matching y linking

- **Teléfono**
  - `phoneNumber` y `phoneNumberE164`

- **Legacy**
  - `providers: ["username_password_legacy"]` (o coexistente con otros)

---

# 4. Impacto en el Desarrollo

- **Frontend Viejo:** **NO** requiere cambios inmediatos.
  - Sigue leyendo desde `doc.data().user.*`.

- **Frontend Nuevo:** debe leer **desde la raíz**.
  - Ej: `doc.data().name`, `doc.data().email`, `doc.data().providers`.

---

Este documento describe el estado actual de la arquitectura de datos V3 y el mecanismo de compatibilidad legacy en producción.
