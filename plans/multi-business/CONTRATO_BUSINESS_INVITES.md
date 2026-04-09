# CONTRATO_BUSINESS_INVITES

Fecha: 2026-02-14
Estado: parcialmente implementado (backend base listo, UI pendiente)

## Objetivo

Permitir que owner/admin de un negocio genere un código de un solo uso para otorgar acceso a otro usuario con rol predefinido.

## Colección propuesta

- `businessInvites/{inviteId}`

Campos:

- `inviteId: string`
- `businessId: string`
- `codeHash: string` (nunca guardar código plano)
- `codePrefix: string` (opcional para soporte visual, ej. `AB12`)
- `role: string`
- `status: 'active' | 'used' | 'revoked' | 'expired'`
- `maxUses: number` (default `1`)
- `usedCount: number` (default `0`)
- `expiresAt: Timestamp`
- `createdBy: string`
- `usedBy?: string`
- `usedAt?: Timestamp`
- `delivery?: { channel?: 'copy' | 'email'; recipientEmail?: string }`
- `createdAt`, `updatedAt`

Índices sugeridos:

- `businessId + status + expiresAt`
- `businessId + createdAt`

## Flujo funcional

1. `createBusinessInvite`:
   - actor autenticado (session token)
   - actor con rol `owner|admin|dev` dentro de `businessId`
   - define `role` objetivo y expiración
   - genera código aleatorio, guarda solo hash
   - retorna código plano una sola vez

2. `redeemBusinessInvite`:
   - usuario autenticado ingresa código
   - backend busca hash válido (`active`, no expirado, `usedCount < maxUses`)
   - transacción:
     - marca invite como `used`
     - crea/actualiza membership del usuario en negocio objetivo
     - sincroniza cache `users/{uid}.accessControl`

## Política recomendada (decisión operativa adoptada por defecto)

- Si el usuario ya pertenece al negocio:
  - no escalar automáticamente por código
  - devolver `already-member` y no consumir código

## Seguridad

- Validación y canje siempre en backend.
- Hash con salt (ej. `bcrypt` o `sha256+salt` de servidor).
- Rate limiting por usuario/IP para intento de canje.
- Auditoría obligatoria de `createdBy`, `usedBy`, timestamps.

## Estado de implementación actual

Implementado en backend:

- `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js`
  - `createBusinessInvite`
  - `redeemBusinessInvite`
- Exportado en `functions/src/index.js`

Pendiente:

- Formulario frontend "Unirme con código" en `/hub`.
- Feedback UX completo (código inválido/expirado/ya usado/ya miembro).
