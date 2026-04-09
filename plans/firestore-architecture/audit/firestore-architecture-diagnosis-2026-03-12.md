# Diagnostico Arquitectonico Firestore - VentaMas

Fecha: 2026-03-12
Alcance: `src/`, `functions/`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`

## Leyenda
- `[Confirmado]`: observado directamente en codigo del repo.
- `[Inferencia]`: conclusion fuerte derivada de varios archivos.
- `[Sospecha]`: riesgo plausible no totalmente demostrable solo con codigo estatico.

## Resumen ejecutivo
- `[Confirmado]` No existe una sola fuente de verdad por dominio. El mismo concepto vive en multiples rutas: negocio en root y anidado; membresia en `members` y en `users.accessControl`; suscripcion en `billingAccounts` y tambien dentro de `businesses`; factura en `invoicesV2` y en `invoices`. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:166-184`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:25-53`, `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`, `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:196-556`, `src/services/invoice/invoice.service.ts:451-513`.
- `[Confirmado]` La seguridad actual es debil para un sistema multi-tenant. Las reglas permiten lectura y escritura a cualquier documento a cualquier usuario autenticado, sin validar negocio, rol ni ownership. Evidencia: `firestore.rules:1-7`.
- `[Confirmado]` El proyecto usa muchas queries compuestas y listeners amplios, pero el archivo de indices esta vacio. Eso no solo es riesgo de errores de consulta: tambien indica gobierno de acceso y costo reactivo, no planeado. Evidencia: `firestore.indexes.json:1-3`, `functions/src/app/modules/cashCount/functions/openCashCount.js:91-96`, `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1601-1603`, `src/hooks/creditNote/useFbGetAvailableCreditNotes.ts:34-39`.
- `[Confirmado]` Hay rutas tenant-scoped y rutas globales legacy activas para entidades que deberian estar bajo negocio. Casos claros: `client`, `creditLimit`, `productOutflow` y `products/6dssod`. Evidencia: `src/components/modals/addClient/AddClientModal.tsx:59-63`, `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts:21-28`, `src/firebase/ProductOutflow/fbAddProductOutflow.ts:55-66`, `src/firebase/ProductOutflow/fbDeleteItemFromProductOutflow.ts:17-21`, `src/firebase/firebaseconfig.tsx:129-149`.
- `[Confirmado]` Inventario tiene al menos cuatro verdades parciales: `products.stock`, `productsStock.quantity`, `batches.quantity` y `backOrders`. Parte del sistema intenta reconciliarlas con crons y triggers; otra parte las muta desde cliente sin transaccion. Evidencia: `functions/src/app/modules/products/functions/createProduct.js:115-170`, `src/firebase/warehouse/productMovementService.ts:193-271`, `src/firebase/warehouse/productStockService.ts:194-300`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:29-47`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-620`.
- `[Confirmado]` Facturacion V2 es el flujo mas serio del backend, pero convive con la factura canonica legacy y con polling cliente. Funciona como mini-saga con outbox, compensaciones e idempotencia; tambien agrega mucha complejidad accidental y duplicacion. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:47-560`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:140-1073`, `functions/src/app/versions/v2/invoice/services/finalize.service.js:24-103`, `src/services/invoice/invoice.service.ts:431-530`.
- `[Confirmado]` Hay sincronizaciones definidas en `functions/` que no estan exportadas en `functions/src/index.js`. Eso deja denormalizaciones potencialmente obsoletas en runtime. Evidencia: `functions/src/index.js:117-212`, `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42`.
- `[Inferencia]` El sistema ha evolucionado por compatibilidad incremental, no por un modelo de datos gobernado. Las lecturas toleran multiples formas del mismo documento (`raw.data || raw`, `raw.client || raw`, `root + business + business.business`), lo que prueba drift semantico real, no hipotetico. Evidencia: `src/firebase/businessInfo/fbGetBusinessInfo.ts:29-39`, `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:144-170`, `functions/src/app/versions/v2/billing/services/billingAccount.service.js:22-35`.

## Mapa actual del modelo Firestore

### Colecciones raiz observadas
- `users/{uid}`: identidad, contexto activo, `accessControl`, presencia, PINs, espejos de negocio. Evidencia: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:31-31`, `functions/src/app/versions/v2/auth/triggers/presenceSync.js:41-131`, `src/firebase/Auth/fbGetUser.ts:13-27`.
- `businesses/{businessId}`: raiz tenant principal. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:166-184`.
- `billingAccounts/{billingAccountId}` y `billingPlanCatalog/{planCode}`: billing global por owner, no por negocio. Evidencia: `functions/src/app/versions/v2/billing/services/billingAccount.service.js:7-19`, `functions/src/app/versions/v2/billing/services/planCatalog.service.js:19-24`.
- `sessionTokens/{tokenId}` y `sessionLogs/{logId}`: sesiones y auditoria de sesiones. Evidencia: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:30-31`, `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:602-608`.
- `businessInvites/{inviteId}`, `businessOwnershipClaims/{claimId}`, `devBusinessImpersonationAudit/{auditId}`: onboarding y control operativo global. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:34-40`, `functions/src/app/versions/v2/auth/controllers/businessOwnershipClaims.controller.js:33-42`, `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:33-41`.
- `changelogs/{id}`, `app/{id}`, `rncData/{id}`, `errors/{id}`: config/log/utility globales. Evidencia: `src/firebase/AppUpdate/fbAddAppUpdate.ts:20-20`, `src/firebase/app/fbGetAppVersion.ts:12-12`, `src/firebase/rnc/fbAddRncData.ts:17-17`, `src/firebase/errors/fbRecordError.ts:26-26`.
- `[Confirmado]` Existen rutas raiz legacy activas que rompen el tenant scoping: `client/{id}`, `creditLimit/{clientId}`, `productOutflow/{id}` y `products/{id}`. Evidencia: `src/components/modals/addClient/AddClientModal.tsx:59-63`, `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts:21-28`, `src/firebase/ProductOutflow/fbDeleteItemFromProductOutflow.ts:17-21`, `src/firebase/firebaseconfig.tsx:132-149`.
- `[Confirmado]` `insuranceAuths/{authId}` aparece como raiz global para autorizaciones de seguro aunque su semantica es de negocio. Evidencia: `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:40-152`.

### Subcolecciones observadas bajo `businesses/{businessId}`
- Config y gobierno: `settings/billing`, `settings/taxReceipt`, `settings/accounting`, `usage/current`, `usage/monthly/entries/{month}`, `counters/{name}`. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:187-193`, `functions/src/app/versions/v2/billing/services/usage.service.js:11-23`, `functions/src/app/core/utils/getNextID.js:21-21`.
- Membresia y permisos: `members/{uid}`, `userPermissions/{uid}`. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`, `src/services/dynamicPermissions.ts:284-318`.
- Clientes y credito: `clients/{clientId}`, `creditLimit/{clientId}`, `accountsReceivable/{arId}`, `accountsReceivableInstallments/{id}`, `accountsReceivablePayments/{id}`, `accountsReceivableInstallmentPayments/{id}`, `accountsReceivablePaymentReceipt/{id}`. Evidencia: `functions/src/app/modules/client/functions/createClient.js:68-105`, `src/firebase/accountsReceivable/fbUpsertCreditLimit.ts:35-63`, `functions/src/app/modules/accountReceivable/services/addAccountReceivable.js:55-93`, `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:406-724`.
- Facturacion y NCF: `invoices/{invoiceId}`, `previousInvoices/{invoiceId}`, `invoicesV2/{invoiceId}`, `invoicesV2/{invoiceId}/outbox/{taskId}`, `invoicesV2/{invoiceId}/compensations/{id}`, `taxReceipts/{serie}`, `ncfUsage/{usageId}`, `ncfLedger/{prefix}/entries/{entryId}`, `idempotency/{key}`. Evidencia: `src/firebase/invoices/fbAddInvoice.ts:37-41`, `src/firebase/invoices/fbUpdateInvoice.ts:26-35`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:115-118`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:277-528`, `functions/src/app/versions/v2/invoice/services/ncf.service.js:115-129`, `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:103-110`.
- Caja y autorizaciones: `cashCounts/{cashCountId}`, `authorizationRequests/{id}`, `pinAuthLogs/{logId}`. Evidencia: `functions/src/app/modules/cashCount/functions/openCashCount.js:119-145`, `functions/src/app/scheduled/expireAuthorizationRequests.ts:63-74`, `functions/src/app/versions/v2/auth/pin/pin.audit.js:5-34`.
- Inventario y ubicaciones: `products/{productId}`, `productsStock/{stockId}`, `batches/{batchId}`, `movements/{movementId}`, `backOrders/{id}`, `warehouses/{warehouseId}`, `shelves/{shelfId}`, `rows/{rowId}`, `segments/{segmentId}`, `warehouseStructure/{type}`, `inventorySessions/{sessionId}`, `inventorySessions/{sessionId}/counts/{countId}`. Evidencia: `functions/src/app/modules/products/functions/createProduct.js:115-163`, `src/firebase/warehouse/warehouseStructureService.ts:23-25`, `src/firebase/inventorySessions/inventorySessions.repository.ts:42-168`.
- Otros maestros operativos observados: `providers`, `purchases`, `expenses`, `orders`, `doctors`, `productBrands`, `categories`, `activeIngredients`, `productsStock` derivados de seguro. Evidencia: `functions/src/app/modules/provider/functions/createProvider.js:114-129`, `src/firebase/purchase/fbAddPurchase.ts:34-180`, `src/firebase/expenses/Items/fbAddExpense.ts:16-121`, `src/firebase/orders/orders.repository.ts:22-170`, `src/firebase/doctors/useFbGetDoctors.ts:18-53`.

## Entidades detectadas

| Ruta | Tipo aparente | Proposito | Campos observados | Req vs opcionales | IDs / refs / relaciones |
|---|---|---|---|---|---|
| `users/{uid}` | entidad raiz + espejo operativo | identidad y contexto activo | `activeBusinessId`, `lastSelectedBusinessId`, `activeRole`, `accessControl`, `presence` | Req: `uid`; opt: mirrors de negocio y presencia | Relacion con `businesses/{id}/members/{uid}` y `sessionTokens/sessionLogs` |
| `businesses/{businessId}` | entidad raiz tenant | negocio, owner, datos base, suscripcion espejo | `ownerUid`, `owners`, `billingAccountId`, `subscription`, `business` | Req: `businessId`; opt: casi todo lo demas | Relacion con todas las subcolecciones tenant |
| `businesses/{businessId}/members/{uid}` | pivote canonico | membresia negocio-usuario | `uid`, `userId`, `businessId`, `role`, `status`, `isOwner`, `source` | Req: `uid`, `businessId`, `role`, `status`; opt: `source`, `invitedBy` | Duplica semantica de `users.accessControl` |
| `billingAccounts/{acct}` | agregado raiz | billing por owner | `billingAccountId`, `ownerUid`, `status`, `provider` | Req: `billingAccountId`, `ownerUid`; opt: snapshots | Relacion con `businessLinks`, `subscriptions`, `paymentHistory`, `checkoutSessions` |
| `businesses/{businessId}/settings/*` | config | comportamiento por negocio | `billingMode`, `taxReceiptEnabled`, settings contables | Variable | Alimenta facturacion, billing e inventario |
| `businesses/{businessId}/taxReceipts/{serie}` | config operativa | secuencia NCF legacy | `data.type`, `data.serie`, `data.sequence`, `data.quantity`, `data.increase` | Req: `type`, `serie`, `sequence`; opt: `quantity` | Fuente para `ncfUsage` |
| `businesses/{businessId}/ncfUsage/{usageId}` | log / reserva | reserva, uso o void de NCF | `ncfCode`, `status`, `generatedAt`, `usedAt`, `invoiceId` | Req: `ncfCode`, `status`; opt: `invoiceId` | Relacion con `taxReceipts`, `invoicesV2`, `invoices` |
| `businesses/{businessId}/ncfLedger/{prefix}/entries/{entryId}` | read model derivado | ledger por prefijo / secuencia | `prefix`, `sequenceNumber`, `invoices[]`, `duplicatesCount` | Req: `prefix`, `normalizedDigits`; opt: metadatos de factura | Deriva de `invoices/{invoiceId}` |
| `businesses/{businessId}/clients/{clientId}` | entidad | cliente comercial | `client.*`, `pendingBalance`, `numberId`, `status` | Req: `id`; opt: snapshots y balances | Relacion con facturas, AR, credit notes y autorizaciones |
| `businesses/{businessId}/creditLimit/{clientId}` | config por cliente | limite de credito | payload libre de limite y reglas | Req: `clientId`; opt: campos de negocio | Tiene ruta legacy raiz conflictiva |
| `businesses/{businessId}/invoices/{invoiceId}` | snapshot / documento canonico legacy | factura utilizable por frontend y modulos legacy | normalmente `data.*` | Req: `data.id`; opt: snapshots embebidos | Relacion con `cashCounts`, AR, credit notes, NCF |
| `businesses/{businessId}/previousInvoices/{invoiceId}` | historico | snapshot previo de una factura | `data.*`, `savedAt` | Req: `data.id` | Historial simple, no versionado fuerte |
| `businesses/{businessId}/invoicesV2/{invoiceId}` | agregado operacional | factura V2 source-of-workflow | `version`, `status`, `snapshot`, `statusTimeline[]`, `idempotencyKey` | Req: `version`, `status`, `businessId`, `userId` | Relacion con `outbox`, `compensations`, `idempotency`, `ncfUsage` |
| `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}` | outbox | tareas asincronas de una factura | `type`, `status`, `attempts`, `payload`, `result` | Req: `type`, `status`, `payload` | Ejecuta side effects sobre inventario, caja, AR, canonica |
| `businesses/{businessId}/accountsReceivable/{arId}` | agregado | cuenta por cobrar | `clientId`, `invoiceId`, `arBalance`, `isActive`, `status` | Req: `clientId`; opt: invoice snapshot | Relacion con installments, payments, client |
| `businesses/{businessId}/accountsReceivableInstallments/{id}` | entidad hija | cuotas de AR | `arId`, `installmentDate`, `installmentBalance`, `isActive` | Req: `arId`, `installmentDate` | Relacion con installmentPayments |
| `businesses/{businessId}/accountsReceivablePayments/{id}` | log | pagos aplicados a AR | `createdAt`, `clientId`, importes | Req: monto, fecha, actor | Relacion con receipts e installments |
| `businesses/{businessId}/creditNotes/{id}` | agregado monetario | notas de credito disponibles / aplicadas | `availableAmount`, `totalAmount`, `status`, `client` | Req: monto total, cliente | Relacion con `creditNoteApplications`, invoices |
| `businesses/{businessId}/creditNoteApplications/{id}` | pivote / log | aplicacion de nota a factura | `creditNoteId`, `invoiceId`, `amountApplied`, `clientId` | Req: `creditNoteId`, `invoiceId`, `amountApplied` | Derivado de creditNotes + invoices |
| `businesses/{businessId}/cashCounts/{cashCountId}` | agregado | cuadre de caja | `cashCount.state`, `cashCount.opening.employee`, `cashCount.sales[]`, `stateHistory[]` | Req: `state`, actor, fechas | Relacion por `DocumentReference` a `users` e `invoices` |
| `businesses/{businessId}/products/{productId}` | entidad | maestro de producto | `name`, `brand`, `category`, `stock`, flags de inventario | Req: `id`, `businessID`; opt: muchos campos comerciales | Relacion con `batches`, `productsStock`, `movements`, `backOrders` |
| `businesses/{businessId}/productsStock/{stockId}` | entidad operativa | stock por lote y ubicacion | `productId`, `batchId`, `location`, `quantity`, `status`, `isDeleted` | Req: `productId`, `quantity`, `location` | Fuente parcial de verdad de inventario |
| `businesses/{businessId}/batches/{batchId}` | entidad operativa | lote / caducidad / cantidad | `productId`, `quantity`, `status`, `productName` | Req: `productId`, `quantity`; opt: provider, expiration | Fuente parcial de verdad de inventario |
| `businesses/{businessId}/movements/{movementId}` | log | movimientos de stock | `productId`, `batchId`, `sourceLocation`, `destinationLocation`, `quantity`, `movementType` | Req: `productId`, `quantity`, `movementType` | Deriva de ventas, compras y traslados |
| `businesses/{businessId}/warehouseStructure/{type}` | read model / cache | mapa agregado de almacenes/estantes/filas/segmentos | `elements.{id}` | Req: `elements` | Duplica jerarquia ya guardada en colecciones normales |

## Relaciones detectadas
- `[Confirmado]` `users/{uid}` y `businesses/{businessId}/members/{uid}` modelan la misma relacion negocio-usuario, pero ninguna esta tratada de forma consistente como unica autoridad. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js:46-70`, `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`, `src/firebase/users/fbGetUsers.ts:174-291`.
- `[Confirmado]` `businesses/{businessId}` tiene dos capas de nesting semantico: root y `business`, y el frontend aun tolera un tercer nivel `business.business`. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:175-183`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:29-39`.
- `[Confirmado]` billing duplica snapshots de suscripcion en `billingAccounts/{acct}/subscriptions/{subId}`, `businesses/{businessId}.subscription` y `businesses/{businessId}.business.subscription`. Evidencia: `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:245-266`, `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:531-624`.
- `[Confirmado]` `invoicesV2/{invoiceId}` es el agregado operacional y `invoices/{invoiceId}` sigue siendo la proyeccion canonica legacy. El cliente consulta ambas. Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:313-340`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:275-558`, `src/services/invoice/invoice.service.ts:451-513`.
- `[Confirmado]` `cashCounts/{id}.cashCount.sales[]` guarda `DocumentReference` a `invoices/{invoiceId}`. Eso acopla caja al path exacto de la factura legacy. Evidencia: `functions/src/app/modules/cashCount/services/cashCount.service.js:33-43`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:645-649`.
- `[Confirmado]` Inventario conecta `products`, `batches`, `productsStock`, `movements` y `backOrders` por `productId`, `batchId` y `location`, sin una unica autoridad formalizada. Evidencia: `functions/src/app/modules/products/functions/createProduct.js:115-163`, `src/firebase/warehouse/productMovementService.ts:193-271`, `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:19-99`.
- `[Confirmado]` `warehouseStructure/{type}` duplica la jerarquia ya persistida en `warehouses`, `shelves`, `rows` y `segments`. Evidencia: `src/firebase/warehouse/warehouseStructureService.ts:22-91`, `src/firebase/warehouse/warehouseStructureService.ts:98-180`.
- `[Confirmado]` `insuranceAuths` vive como raiz global aunque la semantica y las operaciones la tratan como dato de negocio/cliente. Evidencia: `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:40-152`.
- `[Inferencia]` `previousInvoices`, `ncfLedger`, `accountsReceivablePaymentReceipt` y `warehouseStructure` son read models o snapshots auxiliares, no fuentes primarias. Hoy no siempre esta claro cuales pueden regenerarse y cuales no.

## Patrones de acceso detectados

### Queries
- `[Confirmado]` Hay queries compuestas sobre `cashCounts` (`state in` + `opening.employee ==`). Evidencia: `functions/src/app/modules/cashCount/functions/openCashCount.js:91-96`, `src/firebase/cashCount/useIsOpenCashReconciliation.ts:131-137`.
- `[Confirmado]` Hay queries por `userId` con `orderBy(createdAt desc)` sobre `sessionLogs`. Evidencia: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1601-1606`.
- `[Confirmado]` Hay queries por rango y filtros sobre `accountsReceivableInstallments`, `creditNotes`, `expenses`, `movements` y `authorizationRequests`. Evidencia: `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:192-219`, `src/hooks/creditNote/useFbGetAvailableCreditNotes.ts:34-39`, `src/firebase/expenses/Items/useFbGetExpenses.ts:100-101`, `src/firebase/warehouse/useListenMovementsByParams.ts:146-184`, `functions/src/app/scheduled/expireAuthorizationRequests.ts:64-69`.
- `[Confirmado]` Hay uso intenso de `documentId() in` y batch-by-10 para joins manuales desde cliente. Evidencia: `src/firebase/users/fbGetUsers.ts:262-290`, `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:111-170`, `src/firebase/accountsReceivable/fbGetAccountReceivableDetails.ts:98-163`.
- `[Confirmado]` No se detecto uso de `offset`. Se usa `startAfter` en algunos procesos server-side. Evidencia: `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:26-33`, `functions/src/app/versions/v2/invoice/controllers/rebuildNcfLedger.controller.js:101-104`.

### Listeners realtime
- `[Confirmado]` `subscribeToBusinessInfo` escucha el root del negocio y luego mergea formas incompatibles. Evidencia: `src/firebase/businessInfo/fbGetBusinessInfo.ts:95-113`.
- `[Confirmado]` `fbGetUsers` abre un listener a `members` y luego varios listeners chunked a `users`. El costo escala con cantidad de miembros. Evidencia: `src/firebase/users/fbGetUsers.ts:224-291`.
- `[Confirmado]` `warehouseNestedServise.ts` hace fan-out listeners por warehouse, shelf, row y stock por ubicacion. Evidencia: `src/firebase/warehouse/warehouseNestedServise.ts:76-307`.
- `[Confirmado]` `fbGetCreditLimit` envuelve `onSnapshot` dentro de una `Promise` y descarta correctamente el ciclo de vida de la suscripcion. Evidencia: `src/firebase/accountsReceivable/fbGetCreditLimit.ts:14-44`.

### Transacciones, batch writes y BulkWriter
- `[Confirmado]` Se usan transacciones en `createProduct`, `openCashCount`, `createInvoiceV2`, `reserveNcf`, `fbConsumeCreditNotes`. Evidencia: `functions/src/app/modules/products/functions/createProduct.js:101-170`, `functions/src/app/modules/cashCount/functions/openCashCount.js:111-145`, `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:59-557`, `functions/src/app/versions/v2/invoice/services/ncf.service.js:11-131`, `src/firebase/creditNotes/fbConsumeCreditNotes.ts:55-153`.
- `[Confirmado]` Se usan `batch()` y `BulkWriter()` para reconciliaciones y syncs, lo que revela necesidad de reparacion periodica del estado. Evidencia: `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:59-79`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:285-345`, `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:61-96`.
- `[Confirmado]` Tambien hay escrituras multi-documento no atomicas desde frontend que deberian ser servidor/transaccion: mover stock, borrar stock, legacy tax receipts, algunas sincronizaciones de credit notes. Evidencia: `src/firebase/warehouse/productMovementService.ts:218-268`, `src/firebase/warehouse/productStockService.ts:285-300`, `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts:31-85`, `src/firebase/creditNotes/fbConsumeCreditNotes.ts:155-160`.

## Riesgos de escalabilidad
- `[Alta][Confirmado]` `warehouseStructure/{type}` guarda un `elements` map por tipo. Ese documento crece con cada nodo y obliga a leer/escribir bloques cada vez mayores. Evidencia: `src/firebase/warehouse/warehouseStructureService.ts:41-90`, `src/firebase/warehouse/warehouseStructureService.ts:107-176`.
- `[Alta][Confirmado]` `cashCount.sales[]` y `cashCount.stateHistory[]` son arrays de crecimiento abierto dentro de un mismo documento. Evidencia: `functions/src/app/modules/cashCount/functions/openCashCount.js:138-142`, `functions/src/app/modules/cashCount/services/cashCount.service.js:41-43`.
- `[Alta][Confirmado]` `ncfLedger.entries/{entryId}.invoices[]` crece por cada colision/duplicado y se reescribe como array. Evidencia: `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:129-169`.
- `[Alta][Confirmado]` Hay crons que escanean todos los negocios y/o todas las cuentas de billing. Esto no escala linealmente con clientes ni con historico. Evidencia: `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-620`, `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:143-155`, `functions/src/app/scheduled/expireAuthorizationRequests.ts:58-79`, `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:48-153`.
- `[Media][Confirmado]` Los contadores por negocio (`counters/{name}`) concentran escrituras secuenciales para `lastInvoiceId`, `lastCashCountId`, `batches`, etc. Son documentos calientes por negocio. Evidencia: `functions/src/app/core/utils/getNextID.js:21-21`, `functions/src/app/modules/cashCount/functions/openCashCount.js:112-117`, `src/firebase/invoices/fbAddInvoice.ts:26-33`.
- `[Media][Confirmado]` El frontend hace fan-out listeners por jerarquia de ubicaciones e IDs chunked. A mayor negocio, mayor costo de sockets, listeners y merges cliente. Evidencia: `src/firebase/users/fbGetUsers.ts:262-290`, `src/firebase/warehouse/warehouseNestedServise.ts:105-307`.
- `[Media][Confirmado]` `syncProductsStockCron` y otros jobs de reparacion existen porque el estado operativo ya no es confiable por si mismo. Eso introduce costo y latencia de convergencia. Evidencia: `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:29-47`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:285-345`.

## Riesgos de consistencia
- `[Alta][Confirmado]` El documento de negocio no tiene shape canonico. Se escribe en root y dentro de `business`; el frontend ademas acepta `business.business`. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:175-183`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:29-39`.
- `[Alta][Confirmado]` Membresia y rol activo se duplican entre `users` y `members`, y se actualizan en multiples flujos. Riesgo claro de drift por escrituras parciales. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:318-330`, `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2541-2564`, `src/utils/users/normalizeFirestoreUser.ts:68-107`.
- `[Alta][Confirmado]` `fbGetAndUpdateTaxReceipt` hace read-calculate-write sin transaccion. Dos clientes concurrentes pueden reservar la misma secuencia. Evidencia: `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts:31-85`.
- `[Alta][Confirmado]` `moveProduct` y `deleteProductStock` impactan multiples documentos sin transaccion global. Si falla una parte, el inventario queda desincronizado. Evidencia: `src/firebase/warehouse/productMovementService.ts:218-268`, `src/firebase/warehouse/productStockService.ts:285-300`.
- `[Alta][Confirmado]` `fbConsumeCreditNotes` actualiza notas en transaccion pero crea `creditNoteApplications` despues del commit. Si la segunda fase falla, el saldo cambia sin trazabilidad completa. Evidencia: `src/firebase/creditNotes/fbConsumeCreditNotes.ts:55-160`.
- `[Alta][Confirmado]` `linkBusinessToBillingAccount` y parte del mirroring de suscripciones hacen escrituras distribuidas no transaccionales entre `billingAccounts` y `businesses`. Evidencia: `functions/src/app/versions/v2/billing/services/billingAccount.service.js:113-143`, `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:256-266`.
- `[Media][Confirmado]` Las lecturas toleran esquemas incompatibles (`raw.data || raw`, `raw.client || raw`). Eso evita romper UI, pero normaliza inconsistencia en vez de corregirla. Evidencia: `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:144-170`, `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:22-43`.
- `[Media][Confirmado]` Existen sync triggers definidos pero no exportados. La data denormalizada puede quedar permanentemente vieja. Evidencia: `functions/src/index.js:117-212`, `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`.

## Riesgos de costo
- `[Alta][Confirmado]` `waitForInvoiceResult` hace polling de `invoicesV2` y, en estados listos, vuelve a leer `invoices`. Eso multiplica lecturas por factura confirmada. Evidencia: `src/services/invoice/invoice.service.ts:431-530`.
- `[Alta][Confirmado]` `fbGetUsers` combina listener general a `members` con listeners chunked a `users`. Cada cambio de membresia puede reconstruir todo el set. Evidencia: `src/firebase/users/fbGetUsers.ts:224-291`.
- `[Alta][Confirmado]` `warehouseNestedServise.ts` abre listeners por cada nodo de ubicacion y por stock relacionado. En negocios grandes es una fabrica de lecturas vivas. Evidencia: `src/firebase/warehouse/warehouseNestedServise.ts:76-307`.
- `[Media][Confirmado]` Los procesos de reconciliacion escanean colecciones completas de `productsStock`, `products`, `clients`, `businesses` y `billingAccounts`. Evidencia: `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:39-47`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:164-167`, `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:21-33`, `functions/src/app/versions/v2/billing/services/planCatalog.service.js:670-755`.
- `[Media][Confirmado]` Presence mirror escribe en Firestore desde RTDB. Aunque evita heartbeats triviales, sigue siendo costo operativo de un espejo adicional. Evidencia: `functions/src/app/versions/v2/auth/triggers/presenceSync.js:20-39`, `functions/src/app/versions/v2/auth/triggers/presenceSync.js:41-131`.

## Riesgos de seguridad
- `[Alta][Confirmado]` Las reglas actuales equivalen a "si estas autenticado, puedes leer y escribir todo". No hay enforcement de tenant, ownership ni roles en Firestore. Evidencia: `firestore.rules:1-7`.
- `[Alta][Confirmado]` Con reglas tan abiertas, cualquier bug de path o UI puede escribir en negocio ajeno si conoce el `businessId`. Esto agrava todas las rutas dinamicas y los mirrors legacy. Evidencia: `src/firebase/warehouse/locationService.ts:102-109`, `src/firebase/accountsReceivable/fbUpsertCreditLimit.ts:35-63`, `src/firebase/invoices/fbAddInvoice.ts:37-41`.
- `[Media][Confirmado]` `insuranceAuths` es global y no tenant-scoped. Si no hay validacion estricta en cada callable, el aislamiento depende solo de codigo de aplicacion. Evidencia: `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:40-152`.
- `[Media][Confirmado]` Hay escrituras sensibles iniciadas desde cliente a rutas legacy o tecnicas (`creditLimit`, `productOutflow`, `products`). Con reglas abiertas, el blast radius es alto. Evidencia: `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts:21-28`, `src/firebase/ProductOutflow/fbDeleteItemFromProductOutflow.ts:17-21`, `src/firebase/firebaseconfig.tsx:132-149`.

## Malas practicas encontradas
- `[Confirmado]` Documento con schema ambiguo y anidacion redundante: `businesses/{id}` + `businesses/{id}.business` + tolerancia a `business.business`. Evidencia: `functions/src/app/modules/business/functions/createBusiness.js:175-183`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:29-39`.
- `[Confirmado]` Relaciones muchos-a-muchos resueltas con espejo mutable en usuario (`accessControl`) y pivote canonico parcial en `members`. Evidencia: `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:303-330`, `src/utils/users/normalizeFirestoreUser.ts:50-107`.
- `[Confirmado]` Duplicacion inconsistente de suscripcion y billing account ID dentro del negocio. Evidencia: `functions/src/app/versions/v2/billing/services/billingAccount.service.js:132-141`, `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js:256-266`.
- `[Confirmado]` Joins manuales caros desde cliente para AR, usuarios y ubicaciones. Evidencia: `src/firebase/accountsReceivable/fbGetAccountReceivableDetails.ts:51-197`, `src/firebase/users/fbGetUsers.ts:224-291`, `src/firebase/warehouse/locationService.ts:131-143`.
- `[Confirmado]` Rutas dinamicas y fallback de paths (`warehouses`, `locations`, `branches`) para resolver la misma semantica. Evidencia: `src/firebase/warehouse/locationService.ts:131-143`.
- `[Confirmado]` Escrituras frecuentes sobre documentos calientes: `counters/{name}`, `cashCounts/{id}`, `warehouseStructure/{type}`. Evidencia: `functions/src/app/core/utils/getNextID.js:21-21`, `functions/src/app/modules/cashCount/services/cashCount.service.js:33-43`, `src/firebase/warehouse/warehouseStructureService.ts:75-90`.
- `[Confirmado]` Colecciones con esquemas inconsistentes: clientes y facturas a veces vienen envueltos en `client` o `data`, a veces no. Evidencia: `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:144-170`.
- `[Confirmado]` Legacy writes fuera del tenant principal para entidades de negocio. Evidencia: `src/components/modals/addClient/AddClientModal.tsx:59-63`, `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts:21-28`, `src/firebase/ProductOutflow/fbDeleteItemFromProductOutflow.ts:17-21`.
- `[Confirmado]` Uso de arrays crecientes para historico u operacion (`statusTimeline[]`, `stateHistory[]`, `sales[]`, `ingredientList[]`, `invoices[]`). Evidencia: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:206-215`, `functions/src/app/modules/cashCount/functions/openCashCount.js:138-142`, `src/firebase/firebaseconfig.tsx:132-149`, `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:137-169`.

## Decisiones dudosas o ambiguas
- `[Confirmado]` No esta claro cual es la entidad canonica para negocio: `businesses/{id}` root o `businesses/{id}.business`.
- `[Confirmado]` No esta claro cual es la entidad canonica para membresia y rol: `members/{uid}` o `users.accessControl` + `activeRole`.
- `[Confirmado]` No esta claro cual es la factura canonica: `invoicesV2` o `invoices`.
- `[Confirmado]` No esta claro cual es la fuente primaria de stock: `products.stock`, `productsStock.quantity` o `batches.quantity`.
- `[Confirmado]` No esta claro cual es la jerarquia de ubicacion oficial: colecciones normalizadas o `warehouseStructure`.
- `[Sospecha]` Parte de los read models se usa como fuente operativa por conveniencia, no por diseno. Eso explicaria varios crons de reparacion.

## Quick wins
- Cerrar reglas Firestore por negocio y rol antes de cualquier otra optimizacion. Minimo: acceso a `businesses/{businessId}/**` solo si `members/{uid}` existe y esta activo.
- Crear y versionar indices reales para las queries ya existentes. El archivo actual vacio es incompatible con el uso real del repo.
- Prohibir nuevas escrituras a rutas legacy raiz (`client`, `creditLimit`, `productOutflow`, `products`) y dejar telemetria de uso restante.
- Mover la reserva/consumo de NCF definitivamente al backend y eliminar `fbGetAndUpdateTaxReceipt` del cliente.
- Corregir `fbGetCreditLimit` para que sea hook/listener real o fetch one-shot real; hoy es un hibrido defectuoso.
- Exportar los triggers de sync que realmente se necesitan o borrarlos del repo. Tenerlos definidos pero no desplegados es peor que no tenerlos.
- Centralizar builders de paths Firestore por dominio para evitar fallback de rutas y bugs de tenant.

## Refactors medianos
- Aplanar `businesses/{id}` y migrar todos los lectores a un shape unico, sin `business.business`.
- Definir `members/{uid}` como autoridad canonica de membresia; dejar `users.accessControl` solo como cache opcional o eliminarlo.
- Definir `invoicesV2` como source of truth y convertir `invoices` en read model explicito con contrato acotado, o eliminarlo.
- Reescribir operaciones de inventario criticas (`moveProduct`, `deleteProductStock`, stock updates por factura) como callables server-side transaccionales.
- Reubicar `insuranceAuths` dentro de `businesses/{businessId}` o justificar formalmente por que es global.
- Eliminar `warehouseStructure` como documento mutable manual y regenerarlo como read model derivado o resolver la UI directo desde colecciones normalizadas.
- Unificar schema de clientes, facturas y credit limits para eliminar `raw.data || raw` y `raw.client || raw`.

## Refactors grandes
- Rediseñar Firestore como arquitectura tenant-first: root global minimo (`users`, `businesses`, `billingAccounts`, catalogos globales) y todo dato operativo de negocio estrictamente bajo `businesses/{businessId}`.
- Separar fuentes primarias de read models. Un agregado se edita; un read model se deriva y se puede regenerar.
- Formalizar un pipeline de proyeccion server-side para denormalizaciones relevantes (cliente, producto, billing, NCF, caja), con superficie desplegada completa y monitoreada.
- Consolidar inventario alrededor de una sola verdad operativa. Recomendacion pragmatica: `productsStock` por ubicacion/lote como fuente; `products.stock` y `batches.quantity` como derivados.
- Sustituir crons de full scan por reconciliaciones incrementales, colas o jobs por negocio afectados.

## Propuesta de modelo objetivo

### Principios
- Root global pequeno y estable.
- Todo dato operativo de negocio bajo `businesses/{businessId}`.
- Una sola fuente primaria por agregado.
- Read models explicitos, regenerables y etiquetados como tales.
- Seguridad basada en membresia activa, no en "usuario autenticado".

### Modelo sugerido
- `users/{uid}`: solo identidad global, flags de plataforma y preferencias personales. Sin `accessControl` autoritativo.
- `businesses/{businessId}`: metadata plana del negocio (`name`, `ownerUid`, `billingAccountId`, timestamps, status`). Sin nesting `business`.
- `businesses/{businessId}/members/{uid}`: autoridad canonica de acceso, rol, estado y alcance.
- `billingAccounts/{acct}`: billing global por owner; `businessLinks/{businessId}` solo como relacion entre bounded contexts.
- `businesses/{businessId}/invoices/{invoiceId}` o `invoicesV2/{invoiceId}`: elegir una primaria. Mi recomendacion practica es conservar `invoicesV2` como primaria y renombrar/proyectar una vista `invoiceViews/{invoiceId}` para compatibilidad de frontend.
- `businesses/{businessId}/inventory/products/{productId}`: maestro de producto.
- `businesses/{businessId}/inventory/stocks/{stockId}`: stock por ubicacion/lote como verdad operativa.
- `businesses/{businessId}/inventory/batches/{batchId}` y `inventory/movements/{movementId}`: entidades relacionadas, con cantidades derivadas desde stocks o mantenidas solo server-side.
- `businesses/{businessId}/clients/{clientId}` + `clients/{clientId}/creditProfile/current` o `creditLimits/{clientId}` dentro del mismo negocio.
- `businesses/{businessId}/authorizations/{id}` y `businesses/{businessId}/insuranceAuths/{id}`: sin datos operativos globales innecesarios.
- `businesses/{businessId}/locations/*`: una sola jerarquia oficial (`warehouses`, `shelves`, `rows`, `segments`) sin `warehouseStructure` mutable manual.

## Plan de migracion gradual
1. Congelar el modelo actual: inventario de colecciones reales en produccion, conteos y volumen por negocio.
2. Introducir builders centralizados de paths y tipos canonicos por dominio.
3. Bloquear nuevas escrituras a rutas legacy raiz y registrar telemetria de uso restante.
4. Crear migraciones server-side para aplanar `businesses/{id}` y normalizar membresias.
5. Habilitar dual-write temporal solo en dominios de mayor riesgo: membresia, billing, invoices, inventory.
6. Migrar lecturas frontend modulo por modulo hacia las rutas canonicas nuevas.
7. Exportar o eliminar triggers de sync pendientes; cada read model debe tener pipeline explicito.
8. Endurecer reglas Firestore una vez que las lecturas criticas ya dependan de `members/{uid}`.
9. Retirar rutas legacy, code paths de compatibilidad y crons de reparacion obsoletos.

## Preguntas abiertas / supuestos
- `[Pregunta]` Cual de `invoicesV2` o `invoices` se considera oficialmente "la factura" para UI, auditoria y exportacion fiscal.
- `[Pregunta]` `users.accessControl` sigue siendo requerido por producto o solo por compatibilidad.
- `[Pregunta]` `warehouseStructure` existe por rendimiento real medido o por conveniencia de implementacion.
- `[Pregunta]` `insuranceAuths` necesita alcance cross-business legitimo o es un error historico de modelado.
- `[Pregunta]` Hay datos de produccion aun activos en rutas legacy raiz (`client`, `creditLimit`, `productOutflow`, `products`) y cual es su volumen.
- `[Supuesto]` No se revisaron datos reales de Firestore; el diagnostico se basa en codigo, reglas e infraestructura declarada.

## Tabla final de prioridad

| Hallazgo | Severidad | Impacto | Dificultad | Recomendacion | Archivos implicados |
|---|---|---|---|---|---|
| Reglas Firestore abiertas a cualquier usuario autenticado | Alta | Riesgo directo de fuga y corrupcion cross-tenant | Media | Implementar reglas por negocio, membresia activa y rol | `firestore.rules:1-7` |
| Shape ambiguo de `businesses/{id}` con nesting redundante | Alta | Drift semantico, lectores complejos y bugs de merge | Media | Aplanar schema y migrar lectores | `functions/src/app/modules/business/functions/createBusiness.js:175-183`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:25-53` |
| Membresia duplicada entre `members` y `users.accessControl` | Alta | Roles inconsistentes, acceso incorrecto, mayor complejidad | Alta | Definir autoridad canonica y degradar/eliminar espejo | `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js:285-330`, `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:2541-2564`, `src/utils/users/normalizeFirestoreUser.ts:68-107` |
| Rutas legacy raiz para datos de negocio (`client`, `creditLimit`, `productOutflow`, `products`) | Alta | Rompe tenant scoping y complica migracion/reglas | Baja | Bloquear nuevas escrituras y migrar datos remanentes | `src/components/modals/addClient/AddClientModal.tsx:59-63`, `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts:21-28`, `src/firebase/ProductOutflow/fbDeleteItemFromProductOutflow.ts:17-21`, `src/firebase/firebaseconfig.tsx:132-149` |
| `fbGetAndUpdateTaxReceipt` no transaccional | Alta | Duplicacion de NCF y riesgo fiscal | Media | Eliminarlo del cliente y usar solo reserva server-side | `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts:31-85`, `functions/src/app/versions/v2/invoice/services/ncf.service.js:11-131` |
| Inventario sin una fuente primaria clara | Alta | Stock corrupto, reparaciones continuas, costo alto | Alta | Consolidar autoridad operativa y mover mutaciones al backend | `functions/src/app/modules/products/functions/createProduct.js:115-163`, `src/firebase/warehouse/productMovementService.ts:193-271`, `src/firebase/warehouse/productStockService.ts:194-300`, `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-620` |
| `warehouseStructure/{type}` como documento agregado mutable | Alta | Crecimiento no acotado y escrituras pesadas | Media | Reemplazar por read model derivado o lecturas directas normalizadas | `src/firebase/warehouse/warehouseStructureService.ts:32-91`, `src/firebase/warehouse/warehouseStructureService.ts:98-180` |
| `invoicesV2` y `invoices` conviven como dualidad no resuelta | Alta | Complejidad accidental, polling extra, inconsistencias | Alta | Declarar una primaria y la otra como proyeccion temporal | `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:313-340`, `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:275-558`, `src/services/invoice/invoice.service.ts:451-513` |
| Triggers de sync presentes pero no exportados | Media | Denormalizaciones obsoletas y comportamiento no determinista | Baja | Exportarlos o borrarlos explicitamente | `functions/src/index.js:117-212`, `functions/src/app/modules/client/functions/syncClientOnUpdate.js:41-209`, `functions/src/app/modules/products/functions/syncProductBrandOnUpdate.js:17-96`, `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js:13-42` |
| Indices no declarados pese a queries compuestas reales | Media | Errores operativos, performance impredecible, deuda de despliegue | Baja | Versionar indices a partir de queries existentes | `firestore.indexes.json:1-3`, `functions/src/app/modules/cashCount/functions/openCashCount.js:91-96`, `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js:1601-1603`, `src/hooks/creditNote/useFbGetAvailableCreditNotes.ts:34-39` |
| `fbGetCreditLimit` mezcla Promise con listener realtime | Media | Fugas de suscripcion y semantica API incorrecta | Baja | Reescribir como fetch one-shot o hook listener real | `src/firebase/accountsReceivable/fbGetCreditLimit.ts:14-44` |
| Crons de full scan sobre `businesses`, `productsStock`, `clients`, `billingAccounts` | Media | Costo creciente y dependencia de reparaciones diferidas | Media | Reemplazar con procesos incrementales por negocio afectado | `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564-620`, `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:143-155`, `functions/src/app/scheduled/expireAuthorizationRequests.ts:58-79`, `functions/src/app/versions/v2/billing/billingMaintenanceCron.js:48-153` |
| `cashCount.sales[]` y otros arrays crecientes en documentos calientes | Media | Limites de documento, reescrituras caras, contencion | Media | Pasar a subcolecciones o eventos append-only | `functions/src/app/modules/cashCount/functions/openCashCount.js:138-142`, `functions/src/app/modules/cashCount/services/cashCount.service.js:33-43`, `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js:137-169` |
| `insuranceAuths` como coleccion global | Media | Aislamiento fragil y dominio mal encapsulado | Media | Reubicar bajo negocio o documentar por que es global | `functions/src/app/modules/accountReceivable/services/insuranceAuth.js:40-152` |
| Fallback de rutas y schemas incompatibles en cliente | Media | Normaliza deuda estructural y dificulta migraciones | Media | Tipar schema canonico y eliminar compatibilidad silenciosa | `src/firebase/warehouse/locationService.ts:131-143`, `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts:144-170`, `src/firebase/businessInfo/fbGetBusinessInfo.ts:29-39` |
