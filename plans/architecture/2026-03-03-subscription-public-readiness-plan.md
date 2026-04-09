# Plan de Readiness Publica para Suscripciones (2026-03-03)

## Objetivo
Preparar el sistema de suscripciones para exponerlo al publico sin depender todavia de una integracion final de pasarela, pero eliminando mocks publicos, hardcodes criticos, drift entre frontend y backend, y caminos que hoy permiten operar fuera del contrato real de billing.

## Criterio de salida
- [ ] El backend no permite escrituras protegidas sin snapshot valido de suscripcion.
- [ ] Todo plan publicable recibe enforcement real de estado, limites y entitlements.
- [ ] El bootstrap operativo de catalogo, cuentas y snapshots ya no depende de pasos manuales implicitos.
- [ ] El frontend consume una sola fuente de verdad para estado/plan/permisos de suscripcion.
- [ ] Los flujos mock/manual quedan restringidos a dev/staging o tooling interno.
- [ ] Las rutas legacy dejan de duplicar el hub canonico de suscripciones.

## Estado auditado
- [x] Existe guard central de backend para estado, limites y entitlements.
- [x] Existe catalogo de planes en Firestore con soporte de versiones.
- [x] Existe hub canonico nuevo en `/account/subscription/*`.
- [x] Existe compatibilidad legacy para snapshots/entitlements viejos.
- [ ] El provider default sigue siendo `manual`.
- [ ] El checkout real todavia usa monto fijo.
- [ ] El sistema todavia tolera negocios sin nodo de suscripcion en escrituras.
- [ ] El frontend aun mezcla snapshots nuevos y fallbacks legacy.
- [ ] Persisten aliases y lecturas legacy del rollout.

## P0 - Bloqueos de salida publica
- [ ] Cambiar el guard para que ausencia de snapshot deje de devolver `no-subscription-node` como permitido en runtime publico.
- [ ] Quitar la restriccion de enforcement cuantitativo solo a `demo` y `plus`; cualquier plan activo del catalogo debe aplicar limites segun su version publicada.
- [ ] Sacar `manual` como provider default para runtime publico.
- [ ] Restringir o despublicar `processMockSubscriptionScenario` para que no quede disponible a owner/admin en produccion.
- [ ] Resolver el monto dinamico del checkout desde `billingPlanCatalog` en vez de usar el fijo `150000`.
- [ ] Reemplazar URLs productivas hardcodeadas por configuracion explicita por entorno.

## P1 - Bootstrap, migracion y reparacion
- [x] Existe script de seed para `billingPlanCatalog`.
- [ ] Convertir el seed de catalogo en paso operativo obligatorio y reproducible por entorno.
- [ ] Garantizar que `createBusiness` deje siempre una suscripcion/snapshot consistente en todos los caminos.
- [ ] Implementar reparacion real en `ensureBusinessSubscriptionsCron` en vez de `noop_missing_subscriptions`.
- [ ] Completar backfill de `billingAccounts/{id}/subscriptions` para cuentas migradas desde legacy.
- [ ] Revisar scripts de migracion para que no dependan de entorno local acoplado a un usuario especifico.

## P2 - Source of truth y consistencia funcional
- [ ] Consolidar una sola lectura de suscripcion en frontend para overview, selector de negocios, banner y session info.
- [ ] Eliminar lecturas paralelas desde `root.subscription` / `business.subscription` fuera de la capa centralizada.
- [ ] Unificar una sola politica de `blocked statuses`.
- [ ] Unificar una sola politica de `canManagePayments`.
- [ ] Asegurar que el frontend lea snapshots respaldados por backend y no reconstrucciones ad hoc.
- [x] El contrato estructural del field catalog sigue centralizado en codigo.
- [ ] Reducir el frontend a consumidor pasivo del catalogo remoto donde hoy todavia escribe configuracion manual compartida.

## P3 - Limpieza de rollout legacy
- [ ] Dejar `/account/subscription/*` como unico hub canonico.
- [x] Actualizar `routePreloaders` para precargar el layout/paginas reales y no `SubscriptionManagementPage`.
- [x] Eliminar o archivar componentes dev huérfanos como `DeveloperSubscriptionPaymentModal` y `DeveloperSubscriptionVersioningModal`.
- [x] Retirar `SubscriptionManagementPage` y convertir `blocked-preview` en redirect canonico.
- [x] Corregir aliases viejos de `/settings/account/subscription/*` para que apunten a la subpagina canonica correcta.
- [x] Convertir aliases `blocked-preview` de settings/general-config en redirects puros al hub vigente.
- [x] Limpiar copy y accesos de navegacion que seguian describiendo el flujo viejo como temporal o bloqueado.
- [ ] Reducir `/settings/subscription*` a redirect canonico o eliminar aliases legacy sobrantes.
- [ ] Actualizar la documentacion de arquitectura que todavia referencia archivos ya eliminados.

## P4 - Operacion, dunning y reconciliacion
- [ ] Revisar la logica de reconciliacion para que no reactive automaticamente suscripciones no activas sin una decision explicita.
- [ ] Definir flujo real de dunning para `paymentFailures`, `past_due`, `paused` y `canceled`.
- [ ] Completar reconciliacion general de `usage/current` y no solo scripts sesgados a casos dev.
- [ ] Confirmar que los contadores mensuales no queden limitados a `monthlyInvoices`.
- [ ] Estandarizar errores de billing (`permission-denied`, `resource-exhausted`, `failed-precondition`).
- [ ] Mejorar logs operativos por modulo/addon denegado, limite excedido y reparacion automatica.

## P5 - Cierre para habilitar publico
- [ ] Validar seed + migracion + crons en staging con data representativa.
- [ ] Confirmar que un negocio nuevo queda con billing account, link y snapshot consistente sin intervencion manual.
- [ ] Confirmar que un owner normal no puede ejecutar flows mock ni mutar estados por tooling dev.
- [ ] Confirmar que overview, banner, business selector y settings muestran el mismo estado/plan.
- [ ] Confirmar que los planes publicos renderizados coinciden con catalogo/version backend.
- [ ] Habilitar la UI en produccion solo despues de cerrar P0 y P1.

## Legacy que no conviene borrar todavia
- [x] Mantener compatibilidad con `features`, `moduleAccess` y `capabilities` legacy mientras existan datos viejos.
- [x] Mantener builtin `demo`, `plus` y `legacy` mientras el bootstrap del sistema siga apoyandose en ellos.
- [ ] Revaluar eliminacion de compatibilidad legacy despues de completar migraciones y backfills.

## Referencias base
- [x] Auditoria de source of truth de planes: `plans/architecture/2026-03-02-subscription-plans-source-of-truth-review-request.md`
- [x] Auditoria de field catalog: `plans/architecture/2026-03-02-subscription-field-catalog-review-request.md`
- [x] Plan de enforcement backend: `plans/architecture/2026-03-03-backend-subscription-enforcement-plan.md`
- [x] Este documento consolida readiness publica, limpieza legacy y pendientes no cubiertos por la pasarela.
