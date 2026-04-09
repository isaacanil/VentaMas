# CONTRATO_MEMBRESIAS_BACKEND

Fecha: 2026-02-14
Estado: vigente (base definida)

## Objetivo

Definir el contrato canónico para acceso multi-negocio, con compatibilidad temporal legacy.

## Fuente de verdad recomendada

- `businesses/{businessId}/members/{uid}`

Campos mínimos:

- `uid: string`
- `businessId: string`
- `role: 'owner' | 'admin' | 'manager' | 'cashier' | 'buyer' | 'dev' | string`
- `status: 'active' | 'invited' | 'inactive' | 'suspended' | 'revoked'`
- `permissions?: string[]`
- `createdAt`, `updatedAt`
- `invitedBy?: string`
- `source?: 'manual' | 'invite_code' | 'migration'`

## Cache denormalizada en user (compatibilidad UX)

Documento: `users/{uid}`

- `accessControl: Array<{ businessId, role, status, businessName? }>`
- `defaultBusinessId?: string`
- `lastSelectedBusinessId?: string`
- `activeBusinessId?: string` (opcional de sesión/UI)

## Regla de lectura recomendada (dual support)

1. Leer memberships canónicas (`businesses/{id}/members/{uid}`) cuando existan.
2. Si no existen, fallback a:
   - `users/{uid}.accessControl`
   - legacy `businessID/businessId + role`
3. Responder al frontend en formato normalizado:
   - `availableBusinesses[]`
   - `activeBusinessId`
   - `activeRole`
   - `hasMultipleBusinesses`

## Callable implementado (fase inicial P0)

- `clientSelectActiveBusiness`
  - Archivo: `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js`
  - Exportado en: `functions/src/index.js`
  - Función:
    - valida sesión (`sessionToken` o `auth.uid`)
    - valida acceso del usuario al `businessId`
    - persiste `lastSelectedBusinessId` y contexto activo legacy-compatible

## Nota de compatibilidad

Durante transición se mantiene escritura en campos legacy:

- `businessID`, `businessId`, `role`
- espejo `user.businessID`, `user.role`

Hasta completar migración de consumers dependientes.

