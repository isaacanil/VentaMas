# Registro de Diff y Deploy

Fecha: 2026-02-15  
Estado: deploy ejecutado (pendiente QA funcional/E2E)

## 1) Cloud Functions (`functions/`)

### Funciones objetivo desplegadas

- `createInvoiceV2` (update)
- `createInvoiceV2Http` (create)
- `getInvoiceV2Http` (update)
- `repairInvoiceV2Http` (update)
- `autoRepairInvoiceV2Http` (update)
- `auditAccountsReceivableHttp` (update)
- `clientSelectActiveBusiness` (create)
- `createBusinessInvite` (create)
- `redeemBusinessInvite` (create)

### Notas operativas (PowerShell)

- El filtro múltiple en `--only` debe ir entre comillas en PowerShell.
- Sin comillas, Firebase puede responder `No function matches given --only filters`.

### Comandos usados (referencia)

```bash
firebase deploy --only "functions:createInvoiceV2,functions:createInvoiceV2Http"
firebase deploy --only "functions:getInvoiceV2Http,functions:repairInvoiceV2Http,functions:autoRepairInvoiceV2Http,functions:auditAccountsReceivableHttp,functions:clientSelectActiveBusiness,functions:createBusinessInvite,functions:redeemBusinessInvite"
```

Reintentos ejecutados por error transitorio de API:

```bash
firebase deploy --only functions:autoRepairInvoiceV2Http
firebase deploy --only functions:redeemBusinessInvite
```

Comando de verificación solicitado:

```bash
git status --short functions
```

### Pendiente (nuevo): Custom Token para Firebase Auth (por reglas Firestore)

Motivo: con `firestore.rules` endurecido, Firestore requiere `request.auth.uid`.  
El login actual (sessionToken / Google UID) no coincide con el UID legacy (`users/{id}`), causando `permission-denied`.

Funciones tocadas (deben redeployarse):

- `clientLogin`
- `clientLoginWithProvider`
- `clientRefreshSession`

Comando sugerido (PowerShell):

```bash
firebase deploy --only "functions:clientLogin,functions:clientLoginWithProvider,functions:clientRefreshSession"
```

### Pendiente (nuevo): Mantenimiento/Backfill de Suscripciones por Negocio

Motivo: hoy `businesses/{businessId}.subscription` no existe en la mayoría de negocios, por lo que
`assertBusinessSubscriptionAccess` cae en `no-subscription-node` y no aplica política.

Entregables:

- Script admin (one-off): `functions/scripts/backfillBusinessSubscriptions.js`
- Cron (mantenimiento): `ensureBusinessSubscriptionsCron`

Comandos sugeridos:

```bash
# Crear subscription node para todos los negocios (default: active/legacy)
node functions/scripts/backfillBusinessSubscriptions.js --dry-run
node functions/scripts/backfillBusinessSubscriptions.js --write
```

Ejecución confirmada (2026-02-15):

- `dry-run`: `created: 50`, `existing: 0`
- `write`: `created: 50`, `existing: 0`

```bash
# Deploy solo el cron de mantenimiento
firebase deploy --only "functions:ensureBusinessSubscriptionsCron"
```

### Pendiente (nuevo): Reclamo de propiedad por URL token (single-use)

Motivo: permitir que el dueño/admin complete el reclamo desde un enlace
sin ejecutar `clientClaimOwnership` directo desde modal.

Funciones nuevas:

- `createBusinessOwnershipClaimToken`
- `redeemBusinessOwnershipClaimToken`

Comando sugerido (PowerShell):

```bash
firebase deploy --only "functions:createBusinessOwnershipClaimToken,functions:redeemBusinessOwnershipClaimToken"
```

### Pendiente (nuevo): Hardening de endpoints legacy (validación cruzada businessId)

Motivo: cerrar superficie donde se aceptaba `businessId/businessID` desde cliente sin
comprobación robusta de membresía/rol autenticado.

Funciones actualizadas:

- `runCashCountAudit`
- `recalculateProductStockTotals`
- `reconcileBatchStatusFromStocks`
- `ensureDefaultWarehouseForBusiness`

Comando sugerido (PowerShell):

```bash
firebase deploy --only "functions:runCashCountAudit,functions:recalculateProductStockTotals,functions:reconcileBatchStatusFromStocks,functions:ensureDefaultWarehouseForBusiness"
```

Verificación local ejecutada:

- `npm --prefix functions run build` ✅
- `npx eslint` sobre los 4 archivos tocados ✅
- Nota: `npm --prefix functions run lint` global sigue fallando por issues preexistentes
  fuera de este scope (`clientAuth.controller.js`, `pin.controller.js`, `createInvoiceHttp.controller.js`).

### Pendiente (nuevo): Preparación de cleanup legacy en `users/{uid}`

Motivo: preparar retiro de `businessID/role` y espejo `user.*` sin romper login/sesión.

Cambios aplicados:

- Script de auditoría readiness:
  - `functions/scripts/auditLegacyCleanupReadiness.js`
- Script de backfill cache canónica:
  - `functions/scripts/backfillUserMembershipCacheFromCanonical.js`
- Ajuste auth (fallback a `activeBusinessId/activeRole`):
  - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`

Ejecuciones realizadas:

- Auditoría inicial: `151/152` listos por datos + 1 referencia colgante.
- Fix referencia colgante: `users/AWF6tNpoxn` (`RPvpimCiUO4UW4tt50qn` eliminado).
- Backfill cache canónica (`--write`): `usersPatched: 151`.
- Auditoría posterior: `usersReadyByData: 151`, `usersNotReadyByData: 0`.

Deploy sugerido (PowerShell) por cambio en Cloud Function:

```bash
firebase deploy --only "functions:clientLogin,functions:clientLoginWithProvider,functions:clientRefreshSession"
```

Ejecución adicional completada (2026-02-16):

- Script nuevo: `functions/scripts/cleanupLegacyBusinessRoleFields.js`
- Resultado:
  - `dry-run`: `matched: 152`
  - `write`: `patched: 152`
  - `dry-run` post-write: `matched: 0` (`no-legacy-fields: 152`)

Comandos usados:

```bash
node functions/scripts/cleanupLegacyBusinessRoleFields.js --dry-run --limit 5000 --service-account C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json
node functions/scripts/cleanupLegacyBusinessRoleFields.js --write --limit 5000 --service-account C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json
```

### Pendiente (nuevo): Cutover legacy en módulo PIN (membresía canónica)

Motivo: quitar dependencia de `user.businessID` para validación/resumen de PIN.

Cambios aplicados:

- `functions/src/app/versions/v2/auth/controllers/pin.controller.js`
- `functions/src/app/versions/v2/auth/pin/pin.users.js`
- `functions/src/app/versions/v2/auth/pin/pin.utils.js`

Validación local ejecutada:

- `npm --prefix functions run build` ✅

Deploy sugerido (PowerShell):

```bash
firebase deploy --only "functions:generateModulePins,functions:deactivateModulePins,functions:getUserModulePinStatus,functions:getBusinessPinsSummary,functions:validateModulePin,functions:getUserModulePins,functions:autoRotateModulePins,functions:sendPinByEmail"
```

### Pendiente (nuevo): Fallback `activeRole/activeBusinessId` en utilidades administrativas

Motivo: evitar dependencia dura de `role/businessID` legacy tras cleanup fase 1.

Cambios aplicados:

- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/ncfLedgerAccess.util.js`
- `functions/src/app/modules/business/functions/ensureDefaultWarehousesForBusinesses.js`
- `functions/src/app/versions/v2/auth/utils/ownership.util.js`

Deploy sugerido (PowerShell):

```bash
firebase deploy --only "functions:clientSignUp,functions:clientUpdateUser,functions:clientSetUserPassword,functions:clientSendEmailVerification,functions:clientVerifyEmailCode,functions:getNcfLedgerInsights,functions:rebuildNcfLedger,functions:ensureDefaultWarehousesForBusinesses"
```

## 2) Reglas de seguridad Firebase

### Archivos desplegados

- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json` (agregado para permitir `firebase deploy --only firestore:rules`)

### Comandos ejecutados

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Resultado: compilación y release exitosos en `ventamaxpos`.

## 3) Frontend / Router / UX tocado (diff previo)

- `src/modules/auth/pages/BusinessSelectorPage/BusinessSelectorPage.tsx`
- `src/modules/auth/pages/BusinessSelectorPage/useBusinessMetadata.ts`
- `src/modules/auth/utils/businessDisplay.ts`
- `src/modules/navigation/components/MenuApp/MenuApp.tsx`
- `src/modules/navigation/components/MenuApp/MenuData/items/developer.tsx`
- `src/constants/devtools/developerShortcuts.tsx`
- `src/router/routes/routesName.ts`
- `src/router/routes/paths/Dev.tsx`
- `src/router/routes/routePreloaders.ts`

## 4) Scripts de migración / diagnóstico (diff previo)

- `scripts/multi-business/migrateLegacyMemberships.js`
- `scripts/multi-business/reportLegacyFallback.js`

## 5) Planes/documentación relacionados

- `plans/multi-business/PENDIENTE_TASKLIST.md`
- `plans/multi-business/ROLLBACK_PLAN.md`
- `plans/security/2026-02-14-firestore-storage-rules-plan.md`
- `plans/README.md`
- `plans/deploy/2026-02-15-pendientes-diff-deploy.md`

## 6) Siguiente paso recomendado

1. Desplegar funciones pendientes de custom-token/login, cron de suscripciones, claim-token y hardening legacy.
2. Ejecutar smoke tests funcionales (login, selector de negocio, listeners, agregaciones, facturación V2, CxC).
3. Ejecutar validación tenant A vs tenant B en E2E sobre entorno real controlado.
