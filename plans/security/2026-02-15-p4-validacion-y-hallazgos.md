# P4 - Validación y Hallazgos

Fecha: 2026-02-15  
Proyecto: `ventamaxpos`

## 1) Validación ejecutada

- Deploy de reglas:
  - `firebase deploy --only firestore:rules`
  - `firebase deploy --only storage`
- Resultado:
  - `firestore.rules` compilado y publicado.
  - `storage.rules` compilado y publicado.

## 2) Hallazgos de auditoría estática (backend)

Se revisaron funciones que reciben `businessId/businessID` desde cliente.

### Endpoints reforzados (OK con validación de membresía/rol)

- `createInvoiceV2`
- `createInvoiceV2Http`
- `getInvoiceV2Http`
- `repairInvoiceV2Http`
- `autoRepairInvoiceV2Http`
- `auditAccountsReceivableHttp`
- `clientSelectActiveBusiness`
- `createBusinessInvite`
- `redeemBusinessInvite`

### Endpoints legacy remediados (2026-02-16)

- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`
  - Ahora exige `context.auth.uid` y valida acceso por membresía/rol (`AUDIT`).
  - Modo `ALL` restringido a rol global `dev`.
- `functions/src/app/modules/Inventory/functions/recalculateProductStockTotals.js`
  - Ahora exige `req.auth.uid` y cruce de membresía/rol (`MAINTENANCE`) por negocio.
- `functions/src/app/modules/Inventory/functions/reconcileBatchStatusFromStocks.js`
  - Ahora exige `req.auth.uid` y cruce de membresía/rol (`MAINTENANCE`) por negocio.
- `functions/src/app/modules/business/functions/ensureDefaultWarehouseForBusiness.js`
  - Reemplaza validación de rol global por membresía activa + rol de mantenimiento.

## 3) Estado de P4 después de esta ejecución

- Hecho:
  - Reglas base Firestore/Storage desplegadas.
  - Auditoría estática inicial de endpoints completada.
  - Endpoints legacy críticos remediados con validación cruzada de negocio.
- Pendiente:
  - Validación funcional E2E en entorno real controlado (tenant A vs tenant B).
  - Matriz de permisos completa por módulo.

## 4) Hallazgo runtime (frontend): `permission-denied` masivo tras hardening

Síntoma:

- Listeners/consultas en Firestore fallan con `Missing or insufficient permissions`.
- Ejemplo observado: `RunAggregationQuery` a subcolecciones de `businesses/{businessId}`.

Causa:

- Las reglas dependen de `request.auth.uid`, pero el frontend entraba con:
  - login por `sessionToken` sin Firebase Auth (entonces `request.auth == null`), o
  - login Google con UID de Google (no coincide con `users/{id}` legacy / `members/{id}`).

Mitigación implementada (pendiente deploy + QA):

- Cloud Functions emiten `firebaseCustomToken` (UID = userId interno).
- Frontend hace `signInWithCustomToken` antes de despachar `login`/montar listeners.

## 5) Hallazgo billing: falta `subscription` en negocios existentes

Síntoma:

- `assertBusinessSubscriptionAccess` no aplica política real porque la mayoría de negocios no tiene
  `businesses/{businessId}.subscription.status`.

Mitigación implementada:

- Script admin: `functions/scripts/backfillBusinessSubscriptions.js` (default: `active/legacy`).
  - Ejecutado (2026-02-15): `created: 50`, `existing: 0` (50/50).
- Cron: `ensureBusinessSubscriptionsCron` para negocios nuevos que se creen sin `subscription`.
  - Pendiente: deploy del cron.
