# Diagnostico de persistencia Firestore en `functions/`

## Alcance y metodo
- Alcance: solo `functions/`. No se reviso frontend, reglas Firestore ni indices salvo cuando una ruta de `functions/` depende semanticamente de ellos.
- Metodo: lectura de `functions/src/index.js` para separar superficie activa de codigo no desplegado, luego inspeccion manual de controladores, triggers, servicios y crons que leen/escriben Firestore.
- Convenciones:
  - `Hecho confirmado`: observado directamente en codigo.
  - `Inferencia`: conclusion fuerte derivada de varios archivos.
  - `Sospecha`: riesgo plausible no totalmente demostrable solo con `functions/`.

## Resumen ejecutivo
- `Hecho confirmado`: el modelo de persistencia en `functions/` no tiene una sola fuente de verdad por dominio. Usuario/membresia, negocio/billing, factura V2/factura canonica y varias proyecciones derivadas conviven y se pisan entre si. Evidencia principal: `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:343-406`, `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:262-350`, `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266,531-624`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:196-556`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:275-576`.
- `Hecho confirmado`: el flujo de facturacion V2 es el punto mas maduro del backend. Tiene outbox, compensaciones, idempotencia y estados intermedios. Tambien es el punto mas complejo y con mas superficies derivadas. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:47-560`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:139-1073`, `functions/src/app/versions/v2/invoice/services/finalize.service.js:24-103`, `functions/src/app/versions/v2/invoice/services/compensation.service.js:3-150`.
- `Hecho confirmado`: hay triggers de sincronizacion definidos en el repo que no estan exportados en `functions/src/index.js`, por lo que hoy no forman parte de la superficie desplegada. Eso convierte varias denormalizaciones en datos potencialmente obsoletos. Casos claros: `syncClientOnUpdate`, `syncCategoryOnUpdate`, `syncProductBrandOnUpdate`, `syncActiveIngredientOnUpdate`, `stockAlertsOnWrite`, `syncNcfLedger`, `updateStockOnInvoiceCreate`. Evidencia de superficie activa: `functions/src/index.js:117-210`. Evidencia de archivos existentes: `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`, `functions/src/app/modules/products/functions/syncCategoryOnUpdate.js:24-78`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/modules/products/functions/syncActiveIngredientOnUpdate.js:17-71`, `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:63-241`, `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`, `functions/src/app/versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js:6-33`.
- `Hecho confirmado`: hay flujos sensibles a dinero o a estado contable sin idempotencia fuerte ni transaccion de extremo a extremo. Los mas delicados son cobros de cuentas por cobrar y webhook de billing. Evidencia: `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-726`, `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-178`.
- `Hecho confirmado`: hay jobs de reparacion y reconciliacion que escanean todos los negocios o todas las cuentas de billing. Eso es senal de desconfianza estructural en el estado persistido, no solo mantenimiento normal. Evidencia: `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-660`, `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:41-220`, `functions/src/app/scheduled/expireAuthorizationRequests.ts:52-80`, `functions/src/app/versions/v2/billing/services/planCatalog.service.js:667-755`.

## Superficie activa vs codigo presente

### Activo hoy segun `functions/src/index.js`
- Creacion/mutacion directa: `createBusiness`, `clientCreateBusinessForCurrentAccount`, `createClient`, `createProduct`, `createProvider`, `createWarehouse`, `createAccountsReceivable`, `processAccountsReceivablePayment`, `createInvoiceV2`, billing management, invites, ownership claims, PIN, sesiones, presencia, billing crons, inventory crons. Evidencia: `functions/src/index.js:117-210`.
- Triggers activos relevantes: `updatePendingBalance`, `processInvoiceOutbox`, `processInvoiceCompensation`, `syncRealtimePresence`, `syncProductNameOnUpdate`. Evidencia: `functions/src/index.js:121-149,187-210`.

### Archivos de persistencia/sync presentes pero no exportados
- `Hecho confirmado`: `syncClientOnUpdate` existe, pero `functions/src/index.js:117-210` no lo exporta. Archivo: `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`.
- `Hecho confirmado`: `syncCategoryOnUpdate`, `syncProductBrandOnUpdate` y `syncActiveIngredientOnUpdate` existen, pero no aparecen en `functions/src/index.js:117-210`. Archivos: `functions/src/app/modules/products/functions/syncCategoryOnUpdate.js:24-78`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/modules/products/functions/syncActiveIngredientOnUpdate.js:17-71`.
- `Hecho confirmado`: `stockAlertsOnWrite` existe, pero no aparece en `functions/src/index.js:117-210`. Archivo: `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:63-241`.
- `Hecho confirmado`: `syncNcfLedger` existe, pero no aparece en `functions/src/index.js:117-210`. Archivo: `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`.
- `Hecho confirmado`: `updateStockOnInvoiceCreate` existe, pero no aparece en `functions/src/index.js:117-210`. Archivo: `functions/src/app/versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js:6-33`.

## Mapa actual del modelo Firestore desde `functions/`

### Colecciones raiz observadas
| Ruta | Tipo | Proposito | Evidencia |
|---|---|---|---|
| `users/{uid}` | entidad raiz + espejo operativo | identidad de usuario, contexto activo, `accessControl`, presencia, PINs | `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:29-31,617-621,995-999`; `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:389-398,494-507`; `functions/src/app/versions/v2/auth/triggers/presenceSync.js:114-131`; `functions/src/app/versions/v2/auth/controllers/pin.controller.js:281-299` |
| `sessionTokens/{tokenId}` | sesion | sesiones activas del login custom | `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:30,77,829-890` |
| `sessionLogs/{logId}` | log | auditoria de sesiones | `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:31,78,602-607,1601-1607` |
| `businesses/{businessId}` | entidad raiz | negocio, owner, billingAccountId, snapshots de suscripcion | `functions/src/app/modules/business/functions/createBusiness.js:139-210`; `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:364-406`; `functions/src/app/versions/v2/billing/services/billingAccount.service.js:111-143`; `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266` |
| `businessInvites/{inviteId}` | raiz | invitaciones de membresia | `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:33-40,116-137` |
| `businessOwnershipClaims/{claimId}` | raiz | tokens para reclamar propiedad de negocio | `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:32-42,242-259` |
| `devBusinessImpersonationAudit/{auditId}` | log | auditoria de impersonacion de negocio | `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:33,41,139-166` |
| `billingAccounts/{billingAccountId}` | agregado raiz | cuenta de billing por owner | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:7-19,69-89` |
| `billingPlanCatalog/{planCode}` | config raiz | catalogo de planes | `functions/src/app/versions/v2/billing/services/planCatalog.service.js:20-24,736-755` |
| `insuranceAuths/{authId}` | raiz global | autorizaciones de seguro, hoy globales y no scoped por negocio | `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:11,40-99,132-152` |

### Subcolecciones bajo `businesses/{businessId}`
| Ruta | Tipo | Proposito | Campos observados | Relaciones | Evidencia |
|---|---|---|---|---|---|
| `members/{userId}` | pivote canonico | membresia canonica negocio-usuario | `uid`, `userId`, `businessId`, `role`, `status`, `isOwner`, `source` | espejo a `users.accessControl` | `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:372-398`; `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`; `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:458-501` |
| `settings/billing` | config | alertas stock, modo de facturacion | `billingMode`, `invoiceType`, `authorizationFlowEnabled`, `stockAlertsEnabled`, umbrales | usado por inventory/billing | `functions/src/app/modules/business/functions/createBusiness.js:21-36,140,187-189`; `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js:189-250` |
| `settings/taxReceipt` | config | habilitacion comprobantes | `taxReceiptEnabled` | enlaza con `taxReceipts` y NCF | `functions/src/app/modules/business/functions/createBusiness.js:141-193` |
| `settings/accounting` | config | rollout monetario contable | libre/no consolidado en este corte | consumido por invoices V2 | `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:68-82,153-173` |
| `taxReceipts/{serie}` | config operativa | secuencia NCF por tipo/serie | `data.type`, `data.serie`, `data.sequence`, `data.quantity` | alimenta `ncfUsage` | `functions/src/app/modules/business/functions/createBusiness.js:144-208`; `functions/src/app/versions/v2/invoice/services/ncf.service.js:11-129` |
| `ncfUsage/{usageId}` | log/snapshot | reserva y consumo de NCF | `ncfCode`, `status`, `generatedAt`, `usedAt`, `voidedAt`, `invoiceId` | depende de `taxReceipts`, `invoicesV2`, `invoices` | `functions/src/app/versions/v2/invoice/services/ncf.service.js:115-129`; `functions/src/app/versions/v2/invoice/services/finalize.service.js:6-22`; `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js:67-147` |
| `ncfLedger/{prefix}` y `entries/{entryId}` | read model derivado | ledger por prefijo NCF | metadata agregada e invoices por secuencia | deriva de `invoices` canonicas | `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:83-223,225-304` |
| `usage/current` | agregado | uso actual para limites | `monthlyInvoices`, otros contadores | espejo de `usage/monthly` | `functions/src/app/versions/v2/billing/services/usage.service.js:11-23,103-163`; `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:71-74,535-554` |
| `usage/monthly/entries/{monthKey}` | agregado historico | snapshot mensual de uso | `month`, `monthlyInvoices`, contadores | duplicado parcial de `usage/current` | `functions/src/app/versions/v2/billing/services/usage.service.js:18-23,139-146`; `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:104-131` |
| `clients/{clientId}` | entidad | cliente | `id`, `numberId`, `isDeleted`, timestamps, payload normalizado | snapshot embebido en facturas y recibos | `functions/src/app/modules/client/functions/createClient.js:68-105` |
| `products/{productId}` | entidad | producto | `id`, `businessID`, `stock`, nombre, categoria, etc. | relacionado con `batches`, `productsStock`, `movements` | `functions/src/app/modules/products/functions/createProduct.js:44-171`; `functions/src/app/modules/Inventory/functions/recalculateProductStockTotals.js:169-173` |
| `batches/{batchId}` | entidad | lote de producto | `productId`, `numberId`, `status`, `quantity`, `productName` | relacionado con `productsStock`, `movements` | `functions/src/app/modules/products/functions/createProduct.js:118-131`; `functions/src/app/modules/Inventory/functions/reconcileBatchStatusFromStocks.js:207-256` |
| `productsStock/{stockId}` | entidad operativa | stock por lote/ubicacion | `batchId`, `location`, `status`, `productId`, `quantity` | agregado fisico de inventario | `functions/src/app/modules/products/functions/createProduct.js:133-147`; `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:39-162` |
| `movements/{movementId}` | log | movimientos de inventario | `movementType`, `movementReason`, `sourceLocation`, `destinationLocation`, `quantity` | deriva de producto/lote/venta | `functions/src/app/modules/products/functions/createProduct.js:149-163`; `functions/src/app/versions/v1/modules/inventory/handlers/handleUpdateProductsStock.js:171-197` |
| `backOrders/{backOrderId}` | entidad derivada | faltantes de inventario | `productId`, `saleId`, `pendingQuantity`, `status` | deriva de inconsistencias o faltantes | `functions/src/app/versions/v1/modules/inventory/handlers/handleUpdateProductsStock.js:148-169`; `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:478-541` |
| `warehouses/{warehouseId}` | entidad | almacen | `number`, `owner`, `location`, `defaultWarehouse`, timestamps | usada por inventario | `functions/src/app/modules/warehouse/functions/createWarehouse.js:66-113` |
| `providers/{providerId}` | entidad | proveedor | `provider.name`, `provider.rnc`, `status` | sin pivote canonico separado | `functions/src/app/modules/provider/functions/createProvider.js:114-129` |
| `cashCounts/{cashCountId}` | agregado | cuadre de caja | `cashCount.state`, `cashCount.sales[]`, `cashCount.receivablePayments[]` | enlaza facturas y cobros | `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:639-799`; `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:675-688` |
| `accountsReceivable/{arId}` | entidad | cuenta por cobrar | `arBalance`, `numberId`, `invoiceId`, `clientId`, `isActive`, `isClosed` | padre logico de installments/pagos | `functions/src/app/modules/accountReceivable/services/addAccountReceivable.js:55-92`; `functions/src/app/modules/accountReceivable/functions/createAccountsReceivable.js:58-71` |
| `accountsReceivableInstallments/{instId}` | entidad hija plana | cuotas de CxC | `arId`, `installmentNumber`, `installmentBalance`, `installmentDate` | depende de `accountsReceivable` | `functions/src/app/modules/accountReceivable/services/addInstallmentsAccountReceivable.js:20-62` |
| `accountsReceivableInstallmentPayments/{id}` | log | aplicacion de pago por cuota | `installmentId`, `paymentId`, `paymentAmount`, `clientId`, `arId` | hija de `accountsReceivablePayments` por referencia, no por nesting | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:549-576` |
| `accountsReceivablePayments/{paymentId}` | entidad/log | pago agregado de CxC | `paymentMethods`, `amount`, `clientId`, `arId`, `date` | relacionado con recibo, caja e invoices | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:486-514,670-673` |
| `accountsReceivablePaymentReceipt/{receiptId}` | snapshot | recibo con snapshot cliente/cuentas | `client`, `accounts`, `installmentsPaid`, `user`, `paymentMethods` | denormalizacion fuerte | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:167-208,705-724` |
| `invoices/{invoiceId}` | entidad/read model | factura canonica legada | `data.*`, `accumulatedPaid`, `paymentHistory`, `NCF`, `cashCountId` | proyectada desde V2 y usada por otros modulos | `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:275-576`; `functions/src/app/versions/v2/invoice/services/ncf.service.js:18-25` |
| `invoicesV2/{invoiceId}` | agregado orquestado | estado de workflow V2 | `status`, `statusTimeline[]`, `snapshot.*`, `idempotencyKey` | padre de outbox/audit/compensations y espejo parcial a invoice canonica | `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:196-556` |
| `invoicesV2/{invoiceId}/outbox/{taskId}` | outbox | tareas diferidas por factura | `type`, `status`, `attempts`, `payload`, `result` | ejecutado por trigger | `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:277-519`; `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:139-1073` |
| `invoicesV2/{invoiceId}/audit/{auditId}` | log | auditoria de workflow V2 | `event`, `level`, `data`, `at` | puramente derivado | `functions/src/app/versions/v2/invoice/services/audit.service.js:3-48` |
| `invoicesV2/{invoiceId}/compensations/{compId}` | outbox inverso | rollback de tareas completadas | `taskId`, `type`, `status`, `payload`, `result` | ejecutado por trigger | `functions/src/app/versions/v2/invoice/services/compensation.service.js:3-31`; `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js:24-195` |
| `authorizationRequests/{id}` | entidad operativa | solicitudes de autorizacion | `status`, `expiresAt`/`expires_at` | expira por cron | `functions/src/app/scheduled/expireAuthorizationRequests.ts:4-80` |
| `pinAuthLogs/{id}` | log | auditoria de PIN por negocio | `action`, `modules`, `targetUserId`, `performedBy` | deriva de mutaciones en `users.authorizationPins` | `functions/src/app/versions/v2/auth/pin/pin.audit.js:5-34` |

### Subcolecciones bajo `billingAccounts/{billingAccountId}`
| Ruta | Tipo | Proposito | Evidencia |
|---|---|---|---|
| `businessLinks/{businessId}` | pivote | relacion cuenta de billing -> negocio | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:91-149` |
| `subscriptions/{subscriptionId}` | historial + estado vigente | snapshots de suscripcion por cuenta | `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:205-243,281-343,531-624` |
| `paymentHistory/{paymentId}` | log | historial de pagos de billing | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:221-253`; `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js:561-610`; `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-142` |
| `checkoutSessions/{orderNumber}` | outbox/integracion externa | sesiones de pago pendientes/verificadas | `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js:672-736,788-889,955-999`; `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:36-45,96-160` |

## Relaciones, espejos y denormalizaciones
- `Hecho confirmado`: `users/{uid}` y `businesses/{businessId}/members/{uid}` representan la misma relacion negocio-usuario, pero la primera funciona como espejo operativo mutable (`accessControl`, `activeBusinessId`, `activeRole`) y la segunda como canonicidad parcial. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:372-398,494-507`; `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`; `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:458-501`.
- `Hecho confirmado`: billing duplica suscripcion en `billingAccounts/{account}/subscriptions/{subId}`, en `businesses/{businessId}.subscription` y en `businesses/{businessId}.business.subscription`. Evidencia: `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266,281-358,531-624`.
- `Hecho confirmado`: invoice V2 guarda snapshot propio, outbox, audit e idempotency; ademas proyecta una factura canonica en `businesses/{businessId}/invoices/{invoiceId}`. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:196-556`; `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:275-576`.
- `Hecho confirmado`: `accountsReceivablePaymentReceipt` es una denormalizacion fuerte que embebe `client`, `accounts`, `installmentsPaid`, `paymentMethods` y datos del usuario. Evidencia: `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:167-208,705-724`.
- `Hecho confirmado`: presencia se refleja desde RTDB a Firestore en `users/{uid}.presence`. Evidencia: `functions/src/app/versions/v2/auth/triggers/presenceSync.js:41-131`.
- `Hecho confirmado`: `ncfLedger` es un read model derivado de `invoices`, no una fuente primaria. Evidencia: `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:83-223,344-360`.

## Funciones y triggers que crean/actualizan/eliminan/sincronizan documentos

### Negocio, usuarios y contexto
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `createBusiness` | callable | crea negocio base y defaults | `businesses/{id}`, `settings/billing`, `settings/taxReceipt`, `taxReceipts/{serie}` | transaccion para core, post-provision no transaccional | baja | `functions/src/app/modules/business/functions/createBusiness.js:125-277` |
| `clientCreateBusinessForCurrentAccount` | callable | crea negocio y alta owner actual | `businesses/{id}`, `businesses/{id}/members/{uid}`, `users/{uid}`, `usage/*` | transaccion para core + post-provision async | media | `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:343-438` |
| `createBusinessInvite` | callable | crea invitacion | `businessInvites/{inviteId}` | simple write | media | `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:81-147` |
| `redeemBusinessInvite` | callable | consume invitacion y crea membresia | `businessInvites/{inviteId}`, `businesses/{id}/members/{uid}`, `users/{uid}`, `usage/*` | transaccion | media | `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:149-360` |
| `createBusinessOwnershipClaimToken` | callable | crea token de reclamo | `businessOwnershipClaims/{claimId}` | simple write | media | `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:202-274` |
| `redeemBusinessOwnershipClaimToken` | callable | reclama ownership y actualiza usuario/membresia/negocio | `businessOwnershipClaims/{claimId}`, `businesses/{id}`, `businesses/{id}/members/{uid}`, `users/{uid}`, `usage/*` | transaccion | media | `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:401-559` |
| `clientSelectActiveBusiness` | callable | cambia contexto activo | `users/{uid}` | simple write | alta | `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:441-515` |
| `syncRealtimePresence` | RTDB trigger | refleja presencia | `users/{uid}` | simple write | media | `functions/src/app/versions/v2/auth/triggers/presenceSync.js:41-131` |
| `generateModulePins` / `deactivateModulePins` / `autoRotateModulePins` | callable + cron | mutan PINs y auditan | `users/{uid}`, `businesses/{id}/pinAuthLogs/{logId}` | sin transaccion global | baja | `functions/src/app/versions/v2/auth/controllers/pin.controller.js:35-332`; `functions/src/app/versions/v2/auth/pin/pin.audit.js:5-34` |

### Catalogos y maestros de negocio
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `createClient` | callable | crea cliente e incrementa uso | `businesses/{id}/clients/{clientId}`, `usage/*` | transaccion | media | `functions/src/app/modules/client/functions/createClient.js:31-113` |
| `createProduct` | callable | crea producto, batch, stock inicial, movimiento e incrementa uso | `products`, `batches`, `productsStock`, `movements`, `usage/*` | transaccion | media | `functions/src/app/modules/products/functions/createProduct.js:55-178` |
| `createProvider` | callable | crea proveedor e incrementa uso | `providers/{providerId}`, `usage/*` | transaccion | baja | `functions/src/app/modules/provider/functions/createProvider.js:54-137` |
| `createWarehouse` | callable | crea almacen e incrementa uso | `warehouses/{warehouseId}`, `usage/*` | transaccion | baja | `functions/src/app/modules/warehouse/functions/createWarehouse.js:34-121` |
| `syncProductNameOnUpdate` | Firestore trigger activo | sincroniza nombre de producto | `productsStock`, `batches`, `movements`, `backOrders` | BulkWriter, eventual | media | `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:19-100`; activo en `functions/src/index.js:122-123` |
| `syncClientOnUpdate` | trigger no exportado | sincronizaria snapshot de cliente | `invoices`, `invoicesV2`, `accountsReceivablePaymentReceipt`, `approvalLogs` | BulkWriter, eventual | media si estuviera activo | `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`; no aparece en `functions/src/index.js:117-210` |
| `syncCategoryOnUpdate`, `syncProductBrandOnUpdate`, `syncActiveIngredientOnUpdate` | triggers no exportados | sincronizarian denorm de catalogos | `products/*` | BulkWriter, eventual | media si estuvieran activos | `functions/src/app/modules/products/functions/syncCategoryOnUpdate.js:24-78`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/modules/products/functions/syncActiveIngredientOnUpdate.js:17-71` |

### Cuentas por cobrar
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `createAccountsReceivable` | callable | crea cuenta y cuotas | `accountsReceivable/{arId}`, `accountsReceivableInstallments/{instId}` | transaccion | media | `functions/src/app/modules/accountReceivable/functions/createAccountsReceivable.js:18-80`; `functions/src/app/modules/accountReceivable/services/addAccountReceivable.js:55-92`; `functions/src/app/modules/accountReceivable/services/addInstallmentsAccountReceivable.js:20-62` |
| `processAccountsReceivablePayment` | callable | aplica cobro a cuotas, cuenta, caja, invoices, recibo | `accountsReceivable*`, `cashCounts/{id}`, `invoices/{id}`, `accountsReceivablePaymentReceipt/{id}` | `db.batch()`, no transaccion de lectura+escritura | baja | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-726` |
| `updatePendingBalance` | Firestore trigger activo | recalcula saldo pendiente del cliente | `clients/{clientId}` | agregacion + write | media | `functions/src/app/versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js:11-80` |
| `insuranceAuths` helpers | servicios | crea/actualiza/delete autorizaciones | `insuranceAuths/{authId}` | algunas operaciones en tx caller, otras simples | baja | `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:40-152` |

### Facturacion V2, NCF y caja
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `createInvoiceV2` | callable | valida y crea invoice V2 `pending` | `invoicesV2/{invoiceId}`, `outbox/*`, `idempotency/{key}`, `usage/*`, `ncfUsage/*` | transaccion | alta | `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js:49-236`; `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:47-560` |
| `processInvoiceOutbox` | Firestore trigger activo | ejecuta cada tarea del outbox | `invoicesV2/{id}`, `invoices/{id}`, `clients/{id}`, `cashCounts/{id}`, `accountsReceivable*`, `insuranceAuths`, `idempotency/{key}` | transaccion por tarea | media/alta | `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:139-1073` |
| `attemptFinalizeInvoice` | servicio | cierra invoice o agenda compensaciones | `invoicesV2/{id}`, `idempotency/{key}`, `ncfUsage/{usageId}`, `compensations/*` | transaccion | alta | `functions/src/app/versions/v2/invoice/services/finalize.service.js:24-103`; `functions/src/app/versions/v2/invoice/services/compensation.service.js:3-31` |
| `processInvoiceCompensation` | Firestore trigger activo | revierte tareas completadas | `accountsReceivable*`, `creditNotes`, `creditNoteApplications`, `invoices/{id}`, `cashCounts/{id}`, `ncfUsage/{usageId}`, `compensations/{id}` | transaccion por compensacion | media | `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js:24-195`; `functions/src/app/versions/v2/invoice/services/compensation.service.js:35-150` |
| `syncNcfLedger` | trigger no exportado | actualizaria ledger por cambios en `invoices/{id}` | `ncfLedger/{prefix}`, `entries/{entryId}` | transaccion por entry | media si estuviera activo | `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`; `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:83-223` |
| `rebuildNcfLedger` | callable activo | reconstruye ledger manualmente | `ncfLedger/*` | no revisado en detalle aqui | n/a | activo en `functions/src/index.js:150-151` |

### Billing
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `ensureBillingAccountForOwner` | servicio | crea cuenta de billing deterministica | `billingAccounts/{acct}` | simple write | alta por clave deterministica | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:60-89` |
| `linkBusinessToBillingAccount` | servicio | vincula cuenta y negocio y espeja `billingAccountId` | `billingAccounts/{acct}`, `businessLinks/{businessId}`, `businesses/{businessId}` | no transaccional | baja | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:91-149` |
| `assignSubscriptionToBillingAccount` | servicio/callable | crea snapshot de suscripcion y espejos | `billingAccounts/{acct}/subscriptions/{subId}`, `billingAccounts/{acct}`, `businesses/{businessId}` | no transaccional global | baja | `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:281-358` |
| `syncBillingAccountSubscriptionMirrors` | servicio/cron | corrige activo/deprecated y reaplica espejos | `billingAccounts/{acct}/subscriptions/*`, `billingAccounts/{acct}`, `businesses/{businessId}` | writes distribuidas | media | `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:531-624` |
| `createSubscriptionCheckoutSession` | callable | crea checkout externo y persiste sesion pending | `billingAccounts/{acct}/checkoutSessions/{orderNumber}` | simple write | media por `orderNumber` | `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js:672-736,788-889` |
| `verifySubscriptionCheckoutSession` | callable | lee y verifica checkout existente | `billingAccounts/{acct}/checkoutSessions/{orderNumber}` | lectura + posible proveedor externo | media | `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js:936-1000` |
| `azulWebhookAuth2` | HTTP webhook | registra pago, actualiza checkout, reasigna suscripcion | `paymentHistory/{paymentId}`, `checkoutSessions/{orderNumber}`, `subscriptions/{subId}` | no transaccional | baja | `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:47-192` |
| `ensureBusinessSubscriptionsCron`, `reconcileBillingSubscriptionsCron`, `resetMonthlyBillingUsageCron`, `processBillingDunningCron` | cron | scans y reparaciones de billing | `businesses/*`, `billingAccounts/*`, `usage/*`, `subscriptions/*` | por item | baja/media | `functions/src/app/versions/v2/billing/ensureBusinessSubscriptionsCron.js:33-62`; `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:13-220` |

### Inventario y reparaciones
| Superficie | Tipo | Operacion | Rutas afectadas | Atomicidad | Idempotencia | Observacion |
|---|---|---|---|---|---|---|
| `syncProductsStockCron` | cron activo | reconcilia stock, batches, backOrders y productos | `businesses/*/productsStock`, `products`, `batches`, `backOrders` | BulkWriter + scans completos | baja | `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:29-660` |
| `recalculateProductStockTotals` | callable | recalcula `products.stock` desde `productsStock` | `productsStock`, `products` | BulkWriter | media | `functions/src/app/modules/Inventory/functions/recalculateProductStockTotals.js:17-188` |
| `reconcileBatchStatusFromStocks` | callable | recalcula estado/cantidad de lotes | `productsStock`, `batches` | BulkWriter | media | `functions/src/app/modules/Inventory/functions/reconcileBatchStatusFromStocks.js:95-267` |
| `quantityZeroToInactivePerBusiness` | cron activo | apaga docs `active` con `quantity == 0` usando collection group | `batches`, `productsStock` en todos los negocios | BulkWriter | media | `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:1-188` |
| `stockAlertsDailyDigest` | cron activo | escanea negocios y `productsStock` para correo diario | `businesses/*`, `settings/billing`, `productsStock`, `products`, `warehouses` | eventual | baja | `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js:75-417` |
| `stockAlertsOnWrite` | trigger no exportado | alertaria por cruce de umbrales | `productsStock/{stockId}` | eventual | media si estuviera activo | `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:63-241` |
| `updateStockOnInvoiceCreate` | trigger no exportado | flujo legacy de descuento por creacion de invoice | `invoices`, `productsStock`, `batches`, `products`, `backOrders`, `movements` | mezcla tx + batchs | baja | `functions/src/app/versions/v1/modules/inventory/triggers/updateStockOnInvoiceCreate.js:6-33`; `functions/src/app/versions/v1/modules/inventory/handlers/handleUpdateProductsStock.js:38-201` |

## Patrones de atomicidad, batches e idempotencia
- `Hecho confirmado`: el mejor patron de idempotencia esta en facturacion V2. `createPendingInvoice` usa `businesses/{businessId}/idempotency/{key}` y reusa `invoiceId` si la clave ya existe. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:57-64,521-528`.
- `Hecho confirmado`: `processInvoiceOutbox` evita reprocesar tareas si el documento no esta en `pending`. Evidencia: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:160-167,188-193,1023-1033`.
- `Hecho confirmado`: `attemptFinalizeInvoice` tambien es idempotente en el cierre final y en consumo de NCF. Evidencia: `functions/src/app/versions/v2/invoice/services/finalize.service.js:6-22,28-103`.
- `Hecho confirmado`: `processAccountsReceivablePayment` no tiene clave de idempotencia, no usa transaccion de extremo a extremo y escribe un lote amplio despues de leer saldo/cuotas/caja. Un retry del cliente o del runtime puede duplicar cobros y recibos. Evidencia: `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-726`.
- `Hecho confirmado`: `azulWebhookAuth2` tampoco tiene dedupe explicito por `OrderNumber` o `AuthorizationCode` para `paymentHistory`; cada webhook aprobado crea un nuevo `paymentHistory/{autoId}`. Evidencia: `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-142`.
- `Hecho confirmado`: `linkBusinessToBillingAccount` hace tres escrituras paralelas fuera de transaccion. Si una falla, billing account, pivote `businessLinks` y negocio pueden quedar desalineados. Evidencia: `functions/src/app/versions/v2/billing/services/billingAccount.service.js:107-143`.
- `Hecho confirmado`: `assignSubscriptionToBillingAccount` crea suscripcion, actualiza cuenta y luego espeja en negocio(s) sin transaccion global. El espejo de suscripcion puede divergir del historial real. Evidencia: `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:329-358`.
- `Hecho confirmado`: `detachFromCashCount` se invoca dentro de compensaciones transaccionales, pero hace una query directa fuera de `tx.get(...)`. El propio comentario reconoce que es best effort. Eso rompe la coherencia de la compensacion. Evidencia: `functions/src/app/versions/v2/invoice/services/compensation.service.js:128-149`.

## Snapshots, logs, outbox y datos derivados
- `Hecho confirmado`: `invoicesV2/{invoiceId}` guarda `snapshot.client`, `snapshot.ncf`, `snapshot.totals`, `snapshot.monetary`, `snapshot.meta`, `dueDate`, `invoiceComment`. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:196-216`.
- `Hecho confirmado`: cada factura V2 crea entre 3 y 6 tareas de outbox segun el caso: `updateInventory`, `createCanonicalInvoice`, `attachToCashCount`, `closePreorder`, `setupAR`, `consumeCreditNotes`, `setupInsuranceAR`. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:277-519`.
- `Hecho confirmado`: `audit` y `compensations` son subcolecciones permanentes por factura. No hay politica de TTL o archivado en `functions/`. Evidencia: `functions/src/app/versions/v2/invoice/services/audit.service.js:3-48`; `functions/src/app/versions/v2/invoice/services/compensation.service.js:3-31`.
- `Hecho confirmado`: billing tambien usa patrones de outbox/log con `checkoutSessions` y `paymentHistory`. Evidencia: `functions/src/app/versions/v2/billing/controllers/billingManagement.controller.js:672-736`; `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-160`.
- `Inferencia`: el sistema compensa complejidad de modelado con mas proyecciones y mas jobs de reparacion, no con entidades claramente canonicas y proyecciones minimizadas.

## Riesgos de consistencia

### 1. Membresia canonica vs espejo de usuario
- `Hecho confirmado`: `members/{uid}` y `users.accessControl` se actualizan desde varios flujos distintos. El backend trata ambas como verdad parcial para seleccionar negocio, roles y permisos. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:46-71,343-398,458-507`; `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:303-330`; `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:475-501`.
- Impacto: drift de roles, negocio activo incorrecto, bugs de autorizacion.

### 2. Reclamo de ownership con semantica inconsistente
- `Hecho confirmado`: al reclamar ownership se escribe `role: admin` en `businesses/{businessId}/members/{actorUserId}`, pero el negocio raiz queda con `ownerUid` y `owners` apuntando al mismo usuario. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:458-472,503-520`.
- Impacto: el root dice "owner" y la membresia canonica dice "admin". Eso es inconsistencia semantica, no solo denormalizacion.

### 3. Triggers de sync definidos pero hoy inactivos
- `Hecho confirmado`: `syncClientOnUpdate` no esta desplegado. Por tanto snapshots de cliente en `invoices`, `invoicesV2`, `accountsReceivablePaymentReceipt` y `approvalLogs` no se corrigen automaticamente. Evidencia: `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`; superficie activa en `functions/src/index.js:117-210`.
- `Hecho confirmado`: `syncNcfLedger` no esta desplegado. El ledger derivado puede quedar obsoleto salvo reconstruccion manual. Evidencia: `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`; `functions/src/index.js:117-210`.
- `Hecho confirmado`: category/brand/ingredient sync tampoco esta desplegado. Si existen campos denormalizados en `products`, hoy no hay sincronizacion backend activa para esas renombradas. Evidencia: `functions/src/app/modules/products/functions/syncCategoryOnUpdate.js:24-78`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/modules/products/functions/syncActiveIngredientOnUpdate.js:17-71`; `functions/src/index.js:117-210`.

### 4. Cobros de CxC sin idempotencia ni transaccion end-to-end
- `Hecho confirmado`: `processAccountsReceivablePayment` lee cuentas/cuotas/invoices/caja, luego hace `db.batch()` con multiples updates y crea recibo. No hay idempotency key, no hay version check y no hay rollback si la entrada se reintenta logicamente. Evidencia: `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-726`.
- Impacto: doble cobro, recibos duplicados, arrays de caja inflados, balances negativos.

### 5. Billing con espejos fragiles y webhook duplicable
- `Hecho confirmado`: `azulWebhookAuth2` crea `paymentHistory` con `doc()` auto-generado y luego reasigna suscripcion sin chequear si ese mismo webhook ya fue procesado. Evidencia: `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-178`.
- `Hecho confirmado`: `linkBusinessToBillingAccount` y `assignSubscriptionToBillingAccount` no usan transaccion global. Evidencia: `functions/src/app/versions/v2/billing/services/billingAccount.service.js:107-143`; `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:329-358`.
- Impacto: duplicacion de pagos de billing, suscripciones activas incoherentes, mirrors de negocio stale.

### 6. Autorizaciones de seguro globales y con unicidad cross-tenant
- `Hecho confirmado`: `insuranceAuths` vive en raiz y la validacion de duplicado solo usa `insuranceId`, `authNumber` y `deleted`, sin `businessId`. Evidencia: `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:64-76`.
- Impacto: un negocio puede bloquear autorizaciones validas de otro. Es una fuga semantica entre tenants.

### 7. Varios flujos de alta de negocio con semanticas distintas
- `Hecho confirmado`: `createBusiness` crea negocio core y defaults, pero no crea `members/{uid}` ni actualiza `users/{uid}`. `clientCreateBusinessForCurrentAccount` si lo hace. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:242-277`; `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:343-438`.
- Impacto: negocios creados por un camino y por otro no quedan modelados igual.

## Riesgos de costo y escalabilidad
- `Hecho confirmado`: `expireAuthorizationRequests` escanea todos los negocios cada 5 minutos y luego hasta 200 pending requests por negocio. Evidencia: `functions/src/app/scheduled/expireAuthorizationRequests.ts:52-80`.
- `Hecho confirmado`: `reconcileBillingSubscriptionsCron` escanea todos los negocios y luego todas las `billingAccounts`. Evidencia: `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:41-89`.
- `Hecho confirmado`: `resetMonthlyBillingUsageCron` reescribe `usage/current` y `usage/monthly` para todos los negocios el primer dia de cada mes. Evidencia: `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:92-143`.
- `Hecho confirmado`: `processBillingDunningCron` escanea todas las `billingAccounts` y lee hasta 20 suscripciones por cuenta. Evidencia: `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:146-220`.
- `Hecho confirmado`: `syncProductsStockCron` escanea todos los negocios y dentro de cada uno `productsStock`, `products` y `batches`. Evidencia: `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-660`.
- `Hecho confirmado`: `quantityZeroToInactivePerBusiness` hace `collectionGroup` sobre `batches` y `productsStock`, con comentario explicito de dependencia a indices compuestos. Evidencia: `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:1-188`.
- `Hecho confirmado`: `stockAlertsDailyDigest` reescanea negocios y stock; si falla `orderBy` hace fallback sin orden ni paginacion. Evidencia: `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js:113-129,189-285`.
- `Hecho confirmado`: `assertPlanCatalogDeletable` hace scan de todos los negocios y de todas las cuentas de billing, y en cada cuenta consulta `subscriptions`, `paymentHistory` y `checkoutSessions`. Evidencia: `functions/src/app/versions/v2/billing/services/planCatalog.service.js:667-755`.
- `Hecho confirmado`: `cashCount.sales` y `cashCount.receivablePayments` son arrays en el mismo documento. Eso crece sin cota clara y encarece lecturas/escrituras. Evidencia: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:771-799`; `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:675-688`.
- `Hecho confirmado`: `invoicesV2.statusTimeline` usa `arrayUnion` para cada fase, error y compensacion. Es crecimiento monotono en un documento hot. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:206,263-266`; `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:223-229,263-267,538-550,605-609,789-790,882-886,917-921,1003-1007`; `functions/src/app/versions/v2/invoice/services/finalize.service.js:53-58,80-83`.

## Malas practicas y decisiones dudosas
- `Hecho confirmado`: codigo de sync presente pero no desplegado. Esto es peor que no tenerlo, porque transmite una arquitectura que no existe en runtime real. Evidencia: archivos de triggers citados arriba vs `functions/src/index.js:117-210`.
- `Hecho confirmado`: ownership claim promociona a `admin` en membresia canonica pero marca owner en negocio raiz. Eso mezcla identidad juridica y rol operativo. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:458-520`.
- `Hecho confirmado`: `insuranceAuths` es global cuando todo lo demas relevante es business-scoped. Evidencia: `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:11,64-76,132-152`.
- `Hecho confirmado`: billing duplica snapshot en root y nested business node. Evidencia: `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266`.
- `Hecho confirmado`: hay mezcla de estrategias canonica/eventual/best effort dentro del mismo dominio. Ejemplo: invoice V2 intenta ser estricto, billing usa mirrors fragiles, compensacion de caja hace query fuera de tx. Evidencia: `functions/src/app/versions/v2/invoice/services/compensation.service.js:128-149`; `functions/src/app/versions/v2/billing/services/billingAccount.service.js:107-143`.
- `Inferencia`: el repo esta absorbiendo deuda de modelado con "repair crons" en vez de limpiar la canonicidad del modelo.

## Quick wins
- Exportar o eliminar `syncClientOnUpdate`, `syncNcfLedger`, `syncCategoryOnUpdate`, `syncProductBrandOnUpdate`, `syncActiveIngredientOnUpdate`, `stockAlertsOnWrite` y `updateStockOnInvoiceCreate`. Mantener codigo muerto de persistencia es caro y enganoso.
- Corregir `redeemBusinessOwnershipClaimToken` para que la membresia canonica sea `owner` si el root del negocio pasa a ese usuario, o dejar de escribir owner fields en el root.
- Agregar idempotencia explicita a `processAccountsReceivablePayment`, idealmente con clave del request y dedupe por recibo/pago.
- Hacer dedupe en `azulWebhookAuth2` por `OrderNumber` + `AuthorizationCode` antes de crear `paymentHistory`.
- Mover `insuranceAuths` a `businesses/{businessId}/insuranceAuths/{authId}` o, como minimo, agregar `businessId` al criterio de unicidad.
- Reemplazar `cashCount.sales[]` y `cashCount.receivablePayments[]` por subcolecciones.
- Poner `detachFromCashCount` bajo lectura transaccional real o sacarlo fuera del callback de transaccion y modelarlo como compensacion best effort explicita.
- Consolidar una sola entrada oficial para crear negocios y deprecar la otra.

## Refactors medianos
- Unificar membresias: `businesses/{businessId}/members/{uid}` como canonico; `users/{uid}` deberia guardar solo cache de UX, no autoridad de permisos.
- Unificar billing: `billingAccounts/{acct}/subscriptions/{subId}` como canonico; `businesses/{id}.subscription` como proyeccion materializada por un solo projector.
- Convertir `accountsReceivableInstallments` y `accountsReceivableInstallmentPayments` en verdaderas subcolecciones del AR si el acceso siempre es por cuenta, o documentar claramente por que son flat collections globales del negocio.
- Separar logs/auditoria de snapshots operativos para facturas: `audit`, `outbox`, `compensations` ya existen, pero la factura V2 sigue siendo un documento muy cargado.
- Reducir crons globales y reemplazarlos por colas o paginacion con checkpoint.

## Refactors grandes / modelo objetivo
- `Modelo objetivo`: factura V2 como unica fuente de verdad operativa; `invoices/{id}` solo como proyeccion de lectura si todavia hace falta compatibilidad.
- `Modelo objetivo`: `cashCounts/{cashCountId}/sales/{invoiceId}` y `cashCounts/{cashCountId}/receivablePayments/{paymentId}` en subcolecciones. El documento de caja solo guarda totales y metadatos.
- `Modelo objetivo`: `billingAccounts/{acct}` como agregado raiz y un solo pipeline de proyeccion hacia negocio. Nada de escribir manualmente root y nested subscription desde multiples servicios.
- `Modelo objetivo`: `insuranceAuths` por negocio, no global.
- `Modelo objetivo`: membership y ownership alineados. Si hay owner juridico y admin operativo, deben ser dos conceptos explicitos, no un root diciendo owner y un member diciendo admin.
- `Modelo objetivo`: eliminar triggers no exportados o reactivarlos con una estrategia clara. Hoy son ruido arquitectonico.

## Plan de migracion gradual
1. Congelar nuevas denormalizaciones en `functions/`. Ningun modulo nuevo deberia escribir espejos sin declarar un documento canonico.
2. Resolver superficie activa: decidir que triggers de sync siguen vivos y borrar el resto del codigo muerto.
3. Introducir idempotency keys en cobros de CxC y dedupe en webhooks de billing.
4. Migrar arrays de caja a subcolecciones con doble escritura temporal y lectura backward-compatible.
5. Corregir ownership/membership y migrar documentos inconsistentes.
6. Migrar `insuranceAuths` a ambito de negocio con script de backfill y dual-read temporal.
7. Consolidar una sola via de creacion de negocio y apagar la otra.
8. Si `ncfLedger` es realmente requerido, exportar su trigger o convertir el ledger en rebuild on demand y dejar de tratarlo como proyeccion supuestamente viva.

## Preguntas abiertas
- `Pregunta`: `syncClientOnUpdate` y `syncNcfLedger` estan deshabilitados a proposito o simplemente quedaron fuera de `index.js` por accidente.
- `Pregunta`: que flujo es el canonico para alta de negocio en produccion: `createBusiness` o `clientCreateBusinessForCurrentAccount`.
- `Pregunta`: el negocio necesita distinguir `owner` juridico de `admin` operativo, o el caso de ownership claim es un bug semantico.
- `Pregunta`: `ncfLedger` se usa en reportes productivos hoy, o solo como herramienta interna via `rebuildNcfLedger` / `getNcfLedgerInsights`.
- `Pregunta`: que volumen real tiene `cashCount.sales` y `cashCount.receivablePayments`; si ya son grandes, esto deberia priorizarse antes que mas refactors cosmicos.

## Matriz final de prioridad
| Hallazgo | Severidad | Impacto | Dificultad | Recomendacion | Archivos implicados |
|---|---|---|---|---|---|
| Triggers de sync definidos pero no desplegados (`syncClientOnUpdate`, `syncNcfLedger`, category/brand/ingredient, `stockAlertsOnWrite`) | Alta | Datos derivados stale y falsa sensacion de cobertura | Baja | Exportarlos o borrarlos; no dejar sincronizacion "fantasma" | `functions/src/index.js:117-210`; `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`; `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`; `functions/src/app/modules/products/functions/syncCategoryOnUpdate.js:24-78`; `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`; `functions/src/app/modules/products/functions/syncActiveIngredientOnUpdate.js:17-71`; `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:63-241` |
| Ownership claim deja `business.ownerUid` en un usuario cuya membresia canonica queda `admin` | Alta | Inconsistencia semantica de ownership y permisos | Media | Alinear root y membership; `owner` debe ser `owner` en ambos lados o explicitar dos conceptos distintos | `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:458-520` |
| Cobros de CxC sin idempotencia y con `db.batch()` sobre estado monetario | Alta | Riesgo de doble cobro, balances errados y recibos duplicados | Media | Agregar idempotency key y migrar a patron transaccional u outbox | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-726` |
| Webhook de billing crea `paymentHistory` sin dedupe y reasigna suscripcion en cada retry | Alta | Duplicacion de pagos y drift de billing | Media | Deducir por `OrderNumber` + `AuthorizationCode`; usar doc deterministico o marca de procesamiento | `functions/src/app/versions/v2/billing/controllers/webhookManagement.controller.js:110-178` |
| `insuranceAuths` es global y la unicidad no incluye `businessId` | Alta | Colision cross-tenant y modelo incoherente | Media | Mover a subcoleccion por negocio o incluir `businessId` en unicidad y queries | `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:64-76,132-152` |
| Billing account, pivote `businessLinks` y negocio se actualizan sin transaccion | Media | Drift entre raiz de billing y negocio | Media | Encapsular el enlace en transaccion o compensacion explicita | `functions/src/app/versions/v2/billing/services/billingAccount.service.js:91-149` |
| Snapshot de suscripcion duplicado en `businesses.subscription` y `businesses.business.subscription` | Media | Drift y ambiguedad de lectura | Media | Dejar un solo espejo materializado y documentar fuente canonica | `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266,531-624` |
| Arrays crecientes en caja y `statusTimeline` de invoices V2 | Media | Documentos hot, costo creciente y riesgo de 1 MiB | Media | Mover items a subcolecciones y dejar solo agregados/totales en el root doc | `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:771-799`; `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:675-688`; `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:206`; `functions/src/app/versions/v2/invoice/services/finalize.service.js:53-58,80-83` |
| Reconciliaciones y crons full-scan sobre todos los negocios/cuentas | Media | Costo lineal y peor latencia operacional al crecer | Media | Paginacion con checkpoint, colas por negocio y reparaciones dirigidas | `functions/src/app/scheduled/expireAuthorizationRequests.ts:52-80`; `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:41-220`; `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-660`; `functions/src/app/versions/v2/billing/services/planCatalog.service.js:667-755` |
| Dos flujos distintos para alta de negocio dejan persistencia distinta | Media | Negocios modelados de forma desigual segun entrypoint | Media | Elegir una sola via canonica y deprecar la otra | `functions/src/app/modules/business/functions/createBusiness.js:242-277`; `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:343-438` |
| `detachFromCashCount` hace query fuera de `tx.get(...)` dentro de compensacion transaccional | Media | Compensacion no atomica, rollback incompleto | Baja | Sacarlo de la transaccion o rehacerlo con lectura transaccional valida | `functions/src/app/versions/v2/invoice/services/compensation.service.js:128-149` |
| `updatePendingBalance` agrega saldo del cliente en cada write de AR | Baja | Costo recurrente por agregacion y write adicional | Baja | Mantenerlo solo si ese snapshot evita suficiente lectura; si no, calcular on demand | `functions/src/app/versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js:11-80` |
