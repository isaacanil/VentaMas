# PENDIENTE_TASKLIST

Fecha corte: 2026-02-15
Objetivo: cerrar migracion multi-negocio + control de acceso + suscripciones por negocio.

## P0 - Critico (bloquea salida controlada)

- [x] Definir contrato canonico backend para membresias por negocio (`businesses/{businessId}/members/{uid}`).
- [x] Crear endpoint/Callable para seleccionar negocio activo (persistir `lastSelectedBusinessId`).
- [x] Enforce server-side de `activeBusinessId` en endpoints sensibles (no confiar solo en frontend).
  - [x] Endpoints v2 reforzados con membresía activa: `createInvoiceV2`, `createInvoiceV2Http`, `getInvoiceV2Http`, `repairInvoiceV2Http`, `autoRepairInvoiceV2Http`, `auditAccountsReceivableHttp`.
- [x] Middleware unificado de autorizacion por rol de membresia (owner/admin/manager/cashier/etc).
  - [x] Base util de membresias/roles aplicada en `clientSelectActiveBusiness`, `createBusinessInvite`, `redeemBusinessInvite`.
- [x] Capa central de validacion de suscripcion por negocio (`trialing/active/past_due/canceled`).
- [x] Definir y aplicar politica de bloqueo por suscripcion en estado `past_due` y `canceled`.
- [x] Backfill y mantenimiento de `subscription` por negocio (para activar enforcement real).
  - [x] Crear nodos `businesses/{businessId}.subscription` para negocios existentes (default: `active/legacy`).
  - [x] Crear cron de mantenimiento para negocios nuevos sin `subscription` (`ensureBusinessSubscriptionsCron`).
  - [x] Deploy del cron `ensureBusinessSubscriptionsCron`.
- [x] Flujo de reclamo de propiedad por URL con token de un solo uso.
  - [x] Cloud Functions: `createBusinessOwnershipClaimToken`, `redeemBusinessOwnershipClaimToken`.
  - [x] Frontend: modal genera enlace y nueva ruta `/claim-business`.
  - [x] Deploy de funciones de reclamo de propiedad.

## P1 - Invitaciones por codigo (nuevo flujo solicitado)

- [x] Diseñar coleccion `businessInvites` (codigo de un solo uso, hash, expiracion, rol objetivo, estado).
- [x] Cloud Function `createBusinessInvite` (solo owner/admin del negocio).
- [x] Cloud Function `redeemBusinessInvite` con transaccion atomica.
- [x] Evitar reuso de codigo (`maxUses = 1`, `status = used/revoked/expired`).
- [x] Formulario "Unirme con codigo" en `/hub`.
- [x] Mostrar resultado UX: negocio agregado a `availableBusinesses` y selector actualizado.
- [x] Registrar auditoria (`createdBy`, `usedBy`, `usedAt`, IP/device opcional).
- [x] Definir comportamiento si el usuario ya pertenece al negocio (rechazar o actualizar rol).

## P2 - Migracion de datos legacy

- [x] Script idempotente: convertir `users.businessID/role` a memberships.
- [x] Escritura dual temporal (nuevo + legacy) durante ventana de transicion.
- [x] Lectura dual con fallback (nuevo primero, legacy despues).
- [x] Metricas de fallback para medir cuanto legacy queda vivo.
- [x] Plan de rollback documentado por fase.

## P3 - Frontend y UX

- [x] Unificar presentacion de negocio en toda la app:
  - [x] Nombre siempre visible.
  - [x] ID solo para `dev`.
- [x] Resolver rutas de test para dev en selector sin afectar usuarios normales.
- [x] Manejar estado "sin negocios" con CTA claro:
  - [x] Crear negocio.
  - [x] Ingresar codigo de invitacion.
- [x] Banner de estado de suscripcion por negocio (cuando aplique).
- [x] Boton "Cambiar negocio" en layouts adicionales si falta.
- [x] Pantalla base de "Suscripción y Pagos" para owner/admin:
  - [x] Ruta y tab en `General Config` (`/general-config/subscription`).
  - [x] Vista de checkout/cambio de plan (frontend).
  - [x] Vista de portal de facturación e historial (frontend).
  - [x] Vista preview de bloqueo por suscripción.

## P4 - Seguridad y cumplimiento

- [x] Reglas Firestore revisadas para aislamiento multi-tenant.
  - [x] `firestore.rules` creado y validado sintaxis.
  - [x] RBAC base aplicado para `owner/admin/cashier` en `businesses`, `invoices`, `products`, `clients`, `billing/subscriptions`.
- [x] Reglas Storage revisadas para aislamiento multi-tenant.
  - [x] `storage.rules` creado y validado sintaxis.
- [x] Deploy de seguridad ejecutado en proyecto `ventamaxpos` (2026-02-15).
  - [x] `firebase deploy --only firestore:rules`
  - [x] `firebase deploy --only storage`
- [ ] Validar que usuario solo lea/escriba recursos de negocios donde tiene membresia activa.
  - [x] Restricción por membresía activa aplicada en reglas.
  - [x] Compilación/deploy de reglas en Firebase completado.
  - [x] Alinear login con Firebase Auth (Custom Token) para que `request.auth.uid` sea el UID interno.
    - [x] Backend: `clientLogin`, `clientLoginWithProvider`, `clientRefreshSession` devuelven `firebaseCustomToken`.
    - [x] Frontend: `signInWithCustomToken` antes de montar listeners/leer Firestore.
    - [x] Deploy de funciones: `clientLogin`, `clientLoginWithProvider`, `clientRefreshSession` (2026-02-16).
    - [ ] Smoke test (login, listeners, agregaciones).
  - [ ] Validación funcional E2E en entorno real controlado (tenant A vs tenant B).
- [x] Revisar endpoints que reciben `businessID` desde cliente sin validacion cruzada.
  - [x] Endpoints v2 críticos reforzados.
  - [x] Auditoría estática inicial completada (2026-02-15).
  - [x] Remediar endpoints legacy detectados sin validación cruzada fuerte:
    - [x] `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`
    - [x] `functions/src/app/modules/Inventory/functions/recalculateProductStockTotals.js`
    - [x] `functions/src/app/modules/Inventory/functions/reconcileBatchStatusFromStocks.js`
    - [x] `functions/src/app/modules/business/functions/ensureDefaultWarehouseForBusiness.js`
  - [ ] Completar auditoría de escrituras directas desde frontend SDK.
- [ ] Establecer matriz de permisos por rol por modulo en backend (fuente de verdad).
  - [x] Matriz inicial de contención en reglas (Owner/Admin/Cashier).
  - [ ] Matriz completa por módulo (ventas, inventario, CxC, settings, auth, etc.).

## P5 - QA y release

- [x] Deploy controlado ejecutado (2026-02-15):
  - [x] Functions objetivo P0/P1 desplegadas.
  - [x] Firestore/Storage rules desplegadas.
- [ ] Pruebas E2E:
  - [ ] Login con 1 negocio.
  - [ ] Login con multiples negocios.
  - [ ] Cambio de negocio.
  - [ ] Acceso denegado por rol.
  - [ ] Acceso denegado por suscripcion.
  - [ ] Flujo de invitacion por codigo (exito/error/caducado/reuso).
- [ ] Checklist de release progresivo por feature flag.
- [ ] Plan de cleanup final de legacy (`businessID`, `role` plano, espejo `user.*` cuando aplique).
  - [x] Auditoría de readiness productiva ejecutada (`functions/scripts/auditLegacyCleanupReadiness.js`).
  - [x] Backfill de cache de membresías (`accessControl/memberships`) desde canonical completado para 151 usuarios.
  - [x] Limpieza de referencia colgante a negocio eliminado (`users/AWF6tNpoxn` -> `RPvpimCiUO4UW4tt50qn`).
  - [x] Cutover backend PIN (`pin.controller`, `pin.users`, `pin.utils`) a membresía canónica + `activeBusinessId` (sin query por `user.businessID`).
  - [x] Cleanup masivo fase 1 ejecutado en producción (`functions/scripts/cleanupLegacyBusinessRoleFields.js`):
    eliminación de `businessID/businessId/role` y espejo `user.businessID/user.businessId/user.role` en 152 usuarios.
  - [x] Migración ownership/dev ejecutada en producción (`functions/scripts/migrateOwnershipAndPlatformDev.js`):
    - `businesses/{businessId}.ownerUid` backfill desde membresías `owner`.
    - normalización de membresías `owner -> admin`.
    - `users.platformRoles.dev = true` para usuarios dev detectados.
    - compat temporal habilitada en reglas (`ownerUid` + fallback legacy por 1-2 deploys).
  - [ ] Cutover de lectura en código (de `businessID/role` hacia `activeBusinessId` + membresías canónicas).
  - [ ] Congelar escritura legacy (`MULTIBUSINESS_DUAL_WRITE_LEGACY=false`) con monitoreo.
  - [ ] Cleanup fase 2: retirar `activeRole`/`user.activeRole` y evaluar retiro de nodo `user.*` si ya no hay consumidores.
  - [ ] Retirar fallback legacy restante en backend/frontend.
  - [ ] Retirar compatibilidad temporal de ownership legacy (`members.role=owner`, `owners[]`, rol `dev` legacy) tras ventana de observación.

## Decisiones abiertas (requiere definicion)

- [x] Si usuario ya pertenece al negocio y canjea otro codigo:
  - [x] Rechazar y mantener rol actual.
  - [ ] O actualizar rol al del codigo.
  - Nota: implementado como `already-member` (no consume código).
- [x] Quien puede crear invitaciones: `owner + admin` (con bypass `dev` global).
- [x] Vigencia por defecto del codigo: 72h (clamp 1h a 7 dias).
- [ ] Canal oficial de envio (copiar link, email, ambos).

## Backlog estrategico (no iniciar sin aprobacion del usuario)

- [ ] Implementar modelo robusto de acceso (owner por negocio + permisos por modulo).
  Ver plan: `plans/multi-business/2026-02-16-backlog-robust-access-model.md`.
  Gate obligatorio: confirmar con el usuario antes de iniciar implementacion.
