# Plan de Backend Enforcement para Suscripciones (2026-03-03)

## Objetivo
Implementar enforcement real de `limits`, `modules` y `addons` en backend, sin introducir ahora una estrategia general de reglas de seguridad de Firestore.

El objetivo de esta fase es:

- centralizar la validacion de suscripcion en Cloud Functions
- aplicar bloqueo real en operaciones criticas
- migrar de forma gradual los flujos que hoy escriben directo desde frontend
- evitar complejidad accidental por mezclar reglas parciales de Firestore con logica de billing

## Decision de arquitectura
- [x] El enforcement principal de suscripcion en esta fase sera `backend/Cloud Functions`.
- [x] No se usaran reglas de Firestore como mecanismo principal para `limits`, `modules` y `addons`.
- [x] Se mantiene compatibilidad con `legacy`.
- [x] El rollout sera gradual por flujo, no por reescritura total.

## Estado actual auditado
- [x] Existe estado de suscripcion por negocio/cuenta.
- [x] Existe normalizacion de `modules`, `addons`, `features` y `moduleAccess`.
- [x] Existe enforcement para estado de suscripcion.
- [x] Existe enforcement para `maxMonthlyInvoices`.
- [x] Existe enforcement para `maxBusinesses`.
- [x] Existe snapshot de uso por negocio.
- [x] El tracking real de uso esta claro para `monthlyInvoices`.
- [x] Existe enforcement central para `requiredModule`.
- [x] Existe enforcement central para `requiredAddon`.
- [ ] No existe tracking consistente para el resto de metricas.
- [ ] Existen multiples escrituras directas desde frontend que pueden saltarse enforcement.

## Alcance

### Incluido
- [x] Guard central de backend para validar estado de suscripcion, `operation`, `requiredModule`, `requiredAddon` y `usageDelta`.
- [x] Catalogo central de operaciones protegidas.
- [x] Migracion gradual de flujos criticos desde frontend directo hacia Cloud Functions.
- [x] Base para tracking consistente de uso.

### Excluido
- [x] Reglas generales de seguridad de Firestore.
- [x] Reescritura completa de todos los modulos en una sola iteracion.
- [x] Enforcement solo cosmetico en UI.
- [x] Reconciliacion avanzada total desde el primer dia.

## Diseno objetivo
- [x] Extender `assertBusinessSubscriptionAccess` para aceptar `requiredModule` y `requiredAddon`.
- [x] Mantener un catalogo central por `operation` con:
  - `metricKey`
  - `incrementBy`
  - `requiredModule`
  - `requiredAddon`
  - `writePath`
  - `notes`
- [x] Separar `enforcement check` de `usage mutation`.
- [ ] Estandarizar errores:
  - `permission-denied` para modulo/addon no habilitado
  - `resource-exhausted` para limite excedido
  - `failed-precondition` para suscripcion inactiva

## P0 - Base tecnica
- [x] Definir contrato unico de enforcement para backend.
- [x] Extender `assertBusinessSubscriptionAccess` con `requiredModule`.
- [x] Extender `assertBusinessSubscriptionAccess` con `requiredAddon`.
- [x] Crear helpers de lectura de entitlements para evitar checks dispersos.
- [x] Extender `limitOperations.config.js` para soportar metadata de modulo/addon.
- [x] Documentar las operaciones ya cubiertas.

## P1 - Cobertura de flujos ya backend
- [x] Facturacion: confirmar que el flujo use el contrato nuevo de enforcement.
- [ ] Creacion de negocio: mantener enforcement de `maxBusinesses` bajo el esquema central.
- [x] Inventario backend ya callable: alinear con el guard nuevo.
- [x] Auditorias/utilidades backend: decidir cuales solo validan estado y cuales modulo/addon.
- [x] Revisar si `accountsReceivable` ya tiene alguna operacion backend aprovechable para ser el primer flujo con `requiredModule`.

## P2 - Migracion de flujos frontend directo
- [x] `product.create`
- [x] `client.create`
- [x] `supplier.create`
- [x] `warehouse.create`
- [x] `cashRegister.open`
- [x] altas/invitaciones de usuario que consuman `maxUsers`
- [x] pagos u operaciones que dependan de `accountsReceivable`

## P3 - Tracking de uso
- [x] Crear estrategia unica para actualizar `usage/current`.
- [ ] Definir que metricas tambien requieren `usage/monthly`.
- [x] Implementar conteo backend para `productsTotal`.
- [x] Implementar conteo backend para `clientsTotal`.
- [x] Implementar conteo backend para `suppliersTotal`.
- [x] Implementar conteo backend para `warehousesTotal`.
- [x] Implementar conteo backend para `usersTotal`.
- [x] Implementar conteo backend para `openCashRegisters`.
- [ ] Asegurar que el frontend lea solo snapshots respaldados por backend.

## P4 - Reconciliacion y observabilidad
- [ ] Agregar job o script de reconciliacion de uso real vs snapshot.
- [ ] Detectar desvio entre colecciones reales y `usage/current`.
- [ ] Dejar logs claros por modulo/addon denegado.
- [ ] Dejar logs claros por limite excedido.
- [ ] Documentar cobertura por operacion y cobertura pendiente.

## Priorizacion funcional

### Alta
- [ ] `maxProducts`
- [ ] `maxClients`
- [ ] `maxSuppliers`
- [ ] `maxWarehouses`
- [x] `maxUsers`
- [x] `accountsReceivable` como modulo protegido

### Media
- [ ] `maxOpenCashRegisters`
- [ ] addons `advancedReports`
- [ ] addons `salesAnalyticsPanel`
- [ ] addons `ai`
- [ ] addons `api`

### Baja en esta fase
- [ ] enforcement fino por lecturas
- [ ] optimizaciones de UX
- [ ] reglas de Firestore

## Riesgos y mitigacion
- [x] Evitar inconsistencia entre flujos viejos y nuevos documentando cobertura real.
- [ ] No asumir que `usage/current` ya es confiable para todas las metricas.
- [x] Evitar checks manuales por controlador; todo debe pasar por el guard central.
- [ ] Mantener `legacy` ilimitado para evitar regresiones en clientes existentes.

## Entregables esperados
- [x] guard central extendido
- [x] catalogo de operaciones enriquecido
- [x] primera tanda de flujos backend protegidos
- [x] plan de migracion de mutaciones frontend directo
- [ ] mensajes de error consistentes
- [x] documentacion de cobertura por operacion

## Criterio de terminado de esta fase
- [x] Existe un mecanismo unico y reutilizable de enforcement en backend.
- [x] `modules` y `addons` ya no son solo datos decorativos.
- [x] Los flujos criticos migrados ya no dependen de chequeos de frontend.
- [x] El equipo sabe exactamente que operaciones estan protegidas y cuales aun faltan.

## Primera iteracion recomendada
- [x] extender `assertBusinessSubscriptionAccess`
- [x] agregar `requiredModule` y `requiredAddon` al catalogo de operaciones
- [x] proteger un flujo de modulo y un flujo de limite
- [x] documentar cobertura pendiente

## Cobertura actual por operacion
- [x] `invoice.create`: backend protegido, modulo `sales`, contador `monthlyInvoices`
- [x] `product.create`: backend protegido, modulo `inventory`, contador `productsTotal`
- [x] `client.create`: backend protegido, contador `clientsTotal`
- [x] `supplier.create`: backend protegido, contador `suppliersTotal`
- [x] `warehouse.create`: backend protegido, modulo `inventory`, contador `warehousesTotal`
- [x] `cashRegister.open`: backend protegido, contador `openCashRegisters` con decremento al cerrar
- [x] `user.create`: backend protegido en `clientSignUp`, `redeemBusinessInvite` y flujos de creacion de negocio
- [x] `business.create`: usa contrato central para resolver `maxBusinesses` aunque el conteo viva en `billingAccount/businessLinks`
- [x] `accountsReceivable.payment`: backend protegido, modulo `accountsReceivable`
