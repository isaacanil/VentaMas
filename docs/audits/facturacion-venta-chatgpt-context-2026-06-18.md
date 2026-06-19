# Contexto para ChatGPT: arquitectura de facturacion de venta en VentaMas

Fecha de preparacion: 2026-06-18
Repo local: `C:\Dev\VentaMas`
Branch inspeccionada: `jonathan/deep-audit-round-2`
Objetivo: dar a ChatGPT suficiente contexto tecnico para revisar arquitectura, seguridad, consistencia, eficiencia, Firebase, fiscalidad, inventario, CxC, caja y contabilidad del sistema de facturacion al completar una venta.

## Estado del arbol

El arbol esta sucio al momento de preparar este contexto. Hay cambios sin commit en varias superficies fiscales y de facturacion, incluyendo:

- `functions/src/index.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/modules/accountReceivable/functions/customerCreditNotes.js`
- `functions/src/app/modules/accountReceivable/functions/customerCreditNoteOutbox.worker.js`
- `functions/src/app/modules/accountReceivable/functions/customerDebitNoteOutbox.worker.js`
- `functions/src/app/modules/electronicTaxReceipts/*`
- `src/modules/invoice/*`
- `src/utils/taxReceipt.ts`
- `src/types/invoice.ts`
- RNC/location support files nuevos.

Por eso, tratar este documento como foto del checkout actual, no como estado confirmado en produccion.

## Resumen ejecutivo

La facturacion de una venta en VentaMas ya no es un flujo cliente-céntrico. La UI arma y valida el payload, pero la emision real pasa por Cloud Functions.

El flujo principal es:

1. POS / carrito abre `InvoicePanel`.
2. `submitInvoicePanel` ejecuta validaciones de UX/negocio.
3. `useInvoice` llama `submitInvoice`.
4. `invoice.service.ts` construye payload y llama callable `createInvoiceV2`.
5. `createInvoiceV2` valida auth, membresia, suscripcion, NCF/CxC basica y caja abierta.
6. `createPendingInvoice` crea `invoicesV2/{invoiceId}` en transaccion y agenda tareas `outbox`.
7. `processInvoiceOutbox` procesa tareas por trigger Firestore.
8. `attemptFinalizeInvoice` marca `committed` si todo termino, o `failed`/compensaciones si hay errores bloqueantes.
9. El frontend espera `invoicesV2` + factura canonica y puede devolver la factura cuando esta `print_ready`, `print_ready_with_review` o `committed`; `frontend_ready` queda como compatibilidad legacy.

Arquitectonicamente es una saga con outbox sobre Firestore. Es bastante mas robusta que escribir todo desde el cliente, pero hay riesgos importantes alrededor de orden de tareas, definicion exacta de barrera de impresion, validaciones todavia confiadas al frontend, App Check no forzado en `createInvoiceV2`, compensacion manual de inventario y crecimiento/costo de documentos derivados.

## Actualizacion aplicada en esta ronda

Esta seccion refleja cambios locales aplicados el 2026-06-18 y aun no confirma despliegue a produccion.

- `frontend_ready` dejo de ser el nuevo estado que habilita impresion. `createCanonicalInvoice` ahora registra `canonical_ready`; `attemptMarkInvoicePrintReady` evalua la barrera real y escribe `print_ready` o `print_ready_with_review`.
- Fallas no bloqueantes como `attachToCashCount` ya no dejan la factura en limbo: `attemptFinalizeInvoice` puede finalizar como `committed` con campos de revision cuando la politica lo permite.
- `processInvoiceOutbox` separo carga de dependencias: e-CF carga solo dependencias fiscales/electronicas; el resto carga inventario, CxC, caja, seguros, comisiones, etc. bajo demanda.
- `statusTimeline` mantiene dual-write legacy, pero ahora tambien escribe `invoicesV2/{invoiceId}/timeline/{eventId}` para eventos de init, outbox, print-ready y finalize.
- `cashCount.sales` mantiene dual-write legacy, pero ahora tambien escribe `cashCounts/{cashCountId}/sales/{invoiceId}` y read model `cashCountSales/{cashCountId}__{invoiceId}`.
- Lectores backend relevantes prefieren el read model/subcoleccion y caen al array legacy solo como fallback.
- `src/firebase/cashCount/fbAddBillToOpenCashCount.ts` ya no muta `cashCount.sales` desde cliente; delega a callable `addInvoiceToOpenCashCount`.
- `firestore.rules` permite lectura de `invoicesV2/{invoiceId}/timeline/{eventId}`, `cashCounts/{cashCountId}/sales/{invoiceId}` y `cashCountSales/{saleId}` a usuarios con acceso al negocio; escritura queda backend-only.
- Pendiente deliberado: hacer backfill historico de `cashCount.sales` hacia subcoleccion/read model antes de apagar definitivamente el array legacy.

## Stack relevante

Frontend:

- React `^19.2.1`
- Vite `^8.0.16`
- TypeScript `^5.9.3`
- Redux Toolkit, React Query, HeroUI, AntD, styled-components
- Firebase Web SDK `^11.0.1`
- App Check cliente preparado con `ReCaptchaEnterpriseProvider` cuando existe `VITE_FIREBASE_APPCHECK_SITE_KEY`.
- Firestore con cache persistente multi-tab en prod y cache en memoria en emuladores/dev.

Backend:

- Cloud Functions Node 24
- `firebase-functions` `^7.2.3`
- `firebase-admin` `^12.7.0`
- Firestore Admin SDK, transacciones y triggers v2.
- GISYS FACT para comprobantes fiscales electronicos.
- No se encontro uso de Cloud Tasks / Task Queue Functions (`onTaskDispatched`) en este flujo.
- No se encontro Data Connect / SQL Connect implementado en este repo.

## Archivos principales

Frontend POS/facturacion:

- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts`
- `src/services/invoice/useInvoice.ts`
- `src/services/invoice/invoice.service.ts`
- `src/services/invoice/utils/electronicInvoiceReadiness.ts`
- `src/firebase/invoices/fbAddInvoice.ts`
- `src/features/cart/cartSlice.ts`
- `src/features/accountsReceivable/accountsReceivableSlice.ts`

Backend principal:

- `functions/src/index.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/versions/v2/invoice/services/finalize.service.js`
- `functions/src/app/versions/v2/invoice/services/compensation.service.js`
- `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- `functions/src/app/versions/v2/invoice/services/idempotency.service.js`
- `functions/src/app/versions/v2/invoice/services/audit.service.js`
- `functions/src/app/versions/v2/invoice/services/failurePolicy.service.js`
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.js`
- `functions/src/app/versions/v2/invoice/services/repairTasks.service.js`

Relacionados:

- `functions/src/app/modules/electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js`
- `functions/src/app/modules/electronicTaxReceipts/mappers/gisysIssuePayload.mapper.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/accountReceivable/functions/customerCreditNotes.js`
- `functions/src/app/modules/accountReceivable/functions/customerCreditNoteOutbox.worker.js`
- `functions/src/app/modules/accountReceivable/functions/customerDebitNotes.js`
- `functions/src/app/modules/accountReceivable/functions/customerDebitNoteOutbox.worker.js`
- `functions/src/app/modules/cashCount/*`
- `functions/src/app/modules/Inventory/*`
- `functions/src/app/modules/commissions/services/serviceCommissions.service.js`
- `functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.js`

Reglas/config:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `package.json`
- `functions/package.json`

## Flujo frontend

La entrada visible es `InvoicePanel`. El boton `Facturar` llama a `handleSubmit` del controller.

El controller:

- Lee carrito, usuario, negocio, cliente, NCF, CxC, seguros y configuracion de impresion desde Redux/hooks.
- Resuelve `idempotencyKey`: `cart:{cart.id}`, `cart:{cart.cartId}`, `cart:{cart.cartIdRef}` o fallback `gen:{nanoid()}` durante la vida del panel.
- Coordina estado `invoice`, `pendingPrint`, `submitted`, modal de comprobante agotado y loading/progreso.
- Imprime con `react-to-print` o generacion PDF segun plantilla.
- Limpia carrito y desbloquea comprobante al terminar/imprimir.

`submitInvoicePanel` valida antes de llamar backend:

- Si comprobante fiscal activo, exige tipo NCF/e-CF.
- Exige cliente fiscal con RNC/cedula cuando el tipo lo requiere.
- Para consumidor final bajo umbral permite cliente generico si la regla fiscal lo permite.
- Para NCF legacy valida agotamiento local antes de llamar.
- Bloquea submit si falta tasa de moneda/documento.
- Llama `validateInvoiceSubmissionGuards`.
- Si es CxC, valida formulario de cuotas.
- Calcula due date.
- Llama `runInvoice`.
- Si el resultado queda en `print_ready_with_review`, avisa que la factura sigue finalizando o requiere revision operativa.

`validateInvoiceSubmissionGuards` cubre:

- Usuario con `businessID` y `uid`.
- Cuadre de caja abierto via `checkOpenCashReconciliation`.
- Productos con `restrictSaleWithoutStock` deben tener `productStockId` y `batchId`; si faltan intenta cargar stocks disponibles.
- Si comisiones de servicios estan activas, bloquea colaborador sin comision configurada.
- Si `requireCollaboratorOnService` esta activo, exige colaborador por servicio.

Riesgo: varias de estas reglas son fuertes en UX pero no todas parecen revalidadas con la misma profundidad en backend.

## Servicio frontend de factura

`src/services/invoice/invoice.service.ts`:

- Usa `httpsCallable(functions, 'createInvoiceV2')`.
- Normaliza usuario, negocio, carrito, NCF, CxC, seguro, fechas y numeros.
- Normaliza metodos de pago bancarios segun settings contables del negocio.
- Resuelve snapshot monetario si no viene en el carrito.
- Sanitiza `undefined` y numeros no finitos.
- `submitInvoice` llama el callable.
- `waitForInvoiceResult` intenta listeners `onSnapshot` sobre `invoicesV2/{invoiceId}` y `invoices/{invoiceId}`; si falla el listener, cae a polling.
- Sale cuando `invoicesV2.status` es `print_ready`, `print_ready_with_review` o `committed` y la factura canonica esta lista; `frontend_ready` se conserva solo por compatibilidad con facturas/flujo anterior.
- Si se espera e-CF, exige proyeccion electronica en la canonica antes de devolver.

Punto clave: la UI ya no deberia usar `frontend_ready` como criterio nuevo de impresion; debe usar `print_ready` o `print_ready_with_review` segun politica de revision.

## Callable `createInvoiceV2`

Archivo: `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`

Es un `onCall` sin opciones visibles de `enforceAppCheck` ni `consumeAppCheckToken`.

Hace:

- Resuelve `idempotencyKey` desde header/data/body; si falta usa `cart.id`, `cartId`, `cartIdRef` o hash estable del carrito.
- Usa `resolveRequiredCallableActorUid(request)`; el `userId` efectivo queda atado al auth uid.
- Exige `businessId`.
- Valida acceso con `assertUserAccess` y roles `INVOICE_OPERATOR`.
- Valida suscripcion con `assertBusinessSubscriptionAccess` y operacion `INVOICE_CREATE`.
- Si NCF activo, exige tipo.
- Valida carrito minimo con `validateInvoiceCart`.
- Si `isAddedToReceivables`, exige `accountsReceivable.totalInstallments > 0`.
- Exige cuadre de caja abierto.
- Llama `createPendingInvoice`.
- Retorna `{ status: 'pending', invoiceId, reused }`.

Roles permitidos por grupo de invoice operator incluyen owner/admin/manager/cashier/buyer/dev segun `repairTasks.service.js`.

## HTTP `createInvoiceV2Http`

Existe endpoint HTTP alternativo:

- `https.onRequest`
- CORS propio.
- Solo POST/OPTIONS.
- Exige `Idempotency-Key`; no usa fallback tan permisivo como callable.
- Resuelve auth HTTP.
- Repite validaciones principales y llama `createPendingInvoice`.

## Orquestador transaccional

Archivo: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`

`createPendingInvoice` corre dentro de `db.runTransaction`.

Lee:

- `businesses/{businessId}`
- `settings/accounting`
- `settings/taxReceipt`
- `platformConfig/gisysFact`
- `usage/current`
- `usage/monthly/entries/{YYYY-MM}`
- `idempotency/{key}`

Valida/deriva:

- Idempotencia por payload hash.
- Periodo contable abierto si accounting rollout esta activo.
- Limite mensual de facturas para planes estrictos (`monthlyInvoices`).
- `invoiceId` desde preorder/cart/id/nanoid.
- `dueDate`.
- Comentario agregado desde productos.
- Snapshot monetario piloto.
- Requerimiento fiscal si `settings/taxReceipt.taxReceiptEnabled`.
- Cliente fiscal requerido segun tipo de comprobante.
- e-CF si negocio tiene modelo electronico activo; NCF legacy si no.

Crea:

- `businesses/{businessId}/invoicesV2/{invoiceId}`
- `businesses/{businessId}/idempotency/{idempotencyKey}`
- incrementos `usage/current.monthlyInvoices` y `usage/monthly/...monthlyInvoices`
- audit entries.

Tareas outbox:

- Siempre: `updateInventory`, `createCanonicalInvoice`, `attachToCashCount`.
- Si e-CF activo: `issueElectronicTaxReceipt`.
- Si preorden: `closePreorder`.
- Si venta a credito: `setupAR`.
- Si pago con notas de credito: `consumeCreditNotes`.
- Si seguro/CxC: `setupInsuranceAR`.

Punto de riesgo: todas las tareas se escriben juntas. Cada documento dispara su propio trigger `onDocumentCreated`; no hay dependencia explicita ni orden garantizado entre tareas.

## Outbox worker

Archivo: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`

Trigger activo exportado: `processInvoiceOutbox`.

Comportamiento:

- Ignora tareas que no estan `pending`.
- Para `issueElectronicTaxReceipt`, llama servicio externo/mapper fuera del bloque principal y luego actualiza en transaccion.
- Para otras tareas, usa `db.runTransaction`.
- Marca factura `committing` si estaba `pending`.
- Aplica efecto, agrega timeline/audit, marca tarea `done`.
- Llama `attemptFinalizeInvoice`.
- Si falla, marca tarea `failed` y registra audit.

Tareas:

`updateInventory`

- Lee productos, productsStock, batches.
- Si producto restringe venta sin stock, exige o intenta resolver seleccion fisica.
- Ajusta stock de producto, batch y stock fisico.
- Crea movimientos.
- Puede crear backorders.
- Si contabilidad activa, puede emitir evento COGS/inventario.

`createCanonicalInvoice`

- Crea/mergea `businesses/{businessId}/invoices/{invoiceId}` con `{ data: canonicalData }`.
- Puede upsert de cliente.
- Resuelve `numberID` con contador `lastInvoiceId`.
- Copia NCF/e-CF, cliente, caja, moneda, dueDate, comentario, history.
- Calcula `accumulatedPaid`.
- Sincroniza `serviceCommissions`.
- Registra `invoice_doc_done` y `canonical_ready`; no debe habilitar impresion por si solo.
- `attemptMarkInvoicePrintReady` decide luego si la factura puede pasar a `print_ready` o `print_ready_with_review`.

Riesgo reducido: la canonica puede ocurrir antes de inventario, CxC, caja, notas o e-CF final, pero ya no debe ser la barrera nueva de impresion. Revisar que todos los clientes usen `print_ready`.

`issueElectronicTaxReceipt`

- Construye payload GISYS desde factura, negocio y task payload.
- Usa idempotencia estable `ventamas:{businessId}:{invoiceId}:ecf:{documentType}:v1`.
- Modo `shadow`: no llama transporte, marca `shadow_ready`.
- Modos `pilot`/`required`: llama GISYS.
- Si falla y modo es `required`, bloquea factura marcando task `failed`.
- Si falla fuera de `required`, puede marcar `local_failed` como `done`.
- Actualiza snapshot electronico en `invoicesV2` y proyeccion en `invoices`.

Endurecimientos recientes:

- Normaliza provincia/municipio a codigos DGII.
- Resuelve `itemKind` para bien/servicio/evento.
- Mantiene `taxAmount: 0` en lineas exentas cuando corresponde.
- Agrupa totales mixtos por indicador de facturacion.
- Incluye refresh de estado DGII para invoices y notas de ajuste.

`attachToCashCount`

- Busca cash count ya vinculado primero por `cashCountSales`, luego por `cashCount.sales array-contains invoiceRef` como fallback legacy.
- Prueba candidatos: preferred cash count, cart cash count, meta V2, canonica.
- Fallback a cuadre abierto.
- Agrega invoiceRef a `cashCount.sales` y tambien escribe `cashCounts/{cashCountId}/sales/{invoiceId}` + `cashCountSales/{cashCountId}__{invoiceId}`.
- Si contabilidad activa, crea `cashMovements`.
- Actualiza snapshot meta con cash count resuelto.

Riesgo reducido: `cashCount.sales` sigue existiendo por compatibilidad, pero el nuevo modelo permite migrar lectores a subcoleccion/read model y luego retirar el array cuando no haya clientes legacy.

`setupAR`

- Busca CxC existente por `invoiceId`.
- Si no existe, crea `accountsReceivable` y cuotas.
- `addAccountReceivable` tambien actualiza balance pendiente del cliente y estado en factura si la encuentra.

Riesgo: si `setupAR` corre antes de `createCanonicalInvoice`, puede escribir estado en `invoicesV2` y la canonica puede quedar sin `data.receivableState` si no absorbe ese estado despues.

`consumeCreditNotes`

- Verifica nota, saldo, estado.
- Descuenta `availableAmount`.
- Marca `fully_used` o `applied`.
- Crea `creditNoteApplications`.

`setupInsuranceAR`

- Crea autorizacion de seguro.
- Crea CxC tipo insurance y cuotas.
- Guarda ids en resultado de task.

## Finalizacion

Archivo: `functions/src/app/versions/v2/invoice/services/finalize.service.js`

`attemptFinalizeInvoice`:

- Si hay tareas pending, retorna.
- Si hay tareas failed:
  - Si solo fallaron tareas no bloqueantes, registra `nonBlockingFailures` y puede marcar `committed` con revision.
  - Si hay falla bloqueante, agenda compensaciones, marca V2 `failed` e idempotency `failed`.
- Si todo esta done:
  - Consume NCF legacy reservado (`ncfUsage.status = used`).
  - Si contabilidad activa, crea `accountingEvents/{invoice.committed__invoiceId}`.
  - Marca V2 `committed`.
  - Marca idempotency `committed`.

Falla no bloqueante actual:

- `attachToCashCount`.

Riesgo actual: una factura puede quedar en `print_ready_with_review` con fallo no bloqueante de caja y luego `committed` con revision. ChatGPT debe validar si esa politica operativa es aceptable o si caja debe volver a ser bloqueante.

## Compensaciones

Archivos: `compensation.service.js` y `compensation.worker.js`.

Compensa:

- `setupAR`: marca CxC/cuotas `voided`, `isActive=false`, `isClosed=true`.
- `setupInsuranceAR`: similar.
- `consumeCreditNotes`: reacredita saldo y borra/apaga aplicaciones.
- `createCanonicalInvoice`: elimina canonica salvo caso especial no bloqueante.
- `attachToCashCount`: remueve referencia de cash count.
- `closePreorder`: agrega history revertida.
- NCF legacy pendiente: `ncfUsage.status = voided`.

Compensacion debil:

- `updateInventory` queda como manejo manual/no automatico en compensacion.

## Modelo de datos Firestore

Principales:

- `businesses/{businessId}/invoicesV2/{invoiceId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/audit/{auditId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/compensations/{compId}`
- `businesses/{businessId}/idempotency/{key}`
- `businesses/{businessId}/invoices/{invoiceId}`
- `businesses/{businessId}/ncfUsage/{usageId}`
- `businesses/{businessId}/taxReceipts/{taxReceiptId}`
- `businesses/{businessId}/products/{productId}`
- `businesses/{businessId}/productsStock/{stockId}`
- `businesses/{businessId}/batches/{batchId}`
- `businesses/{businessId}/movements/{movementId}`
- `businesses/{businessId}/backOrders/{backOrderId}`
- `businesses/{businessId}/cashCounts/{cashCountId}`
- `businesses/{businessId}/cashMovements/{movementId}`
- `businesses/{businessId}/accountsReceivable/{arId}`
- `businesses/{businessId}/accountsReceivableInstallments/{installmentId}`
- `businesses/{businessId}/creditNotes/{creditNoteId}`
- `businesses/{businessId}/creditNoteApplications/{applicationId}`
- `businesses/{businessId}/serviceCommissions/{commissionId}`
- `businesses/{businessId}/accountingEvents/{eventId}`
- `businesses/{businessId}/journalEntries/{entryId}`

## Firestore rules

Protecciones fuertes:

- `invoicesV2` y subcolecciones: read con acceso de negocio; write cliente bloqueado.
- `invoices`: cliente solo puede crear/editar/eliminar borradores seguros sin huella fiscal/contable.
- Bloqueadas a cliente: `creditNotes`, `creditNoteApplications`, CxC, pagos CxC, cuentas por pagar, pagos, serviceCommissions, RRHH, cashMovements, cashCounts, accountingEvents, journalEntries, ncfUsage, ncfLedger, reportes fiscales.

Superficies todavia escribibles por cliente con `hasBusinessWriteAccess`:

- `products`
- `productsImages`
- `clients`
- `providers`
- `warehouses`
- `warehouseStructure`
- `batches`
- `productsStock`
- `movements`
- `inventorySessions`
- `backOrders`
- `orders`

Riesgo: aunque la factura esta backend-first, inventario base/precio/stock sigue mutable desde cliente para usuarios con permiso de escritura.

## e-CF / GISYS

Flujo:

- `createPendingInvoice` decide si va por NCF legacy o e-CF.
- Para e-CF, no reserva NCF legacy; prepara snapshot `electronic_pending`.
- Agenda `issueElectronicTaxReceipt`.
- `electronicTaxReceiptOutbox.service.js` construye payload GISYS con `buildGisysIssuePayload`.
- En `shadow`, marca proyeccion local.
- En `pilot/required`, llama proveedor y guarda `submissionId`, `eNcf`, QR/links/seguridad/status DGII cuando existen.
- `refreshElectronicTaxReceiptStatus` permite refrescar estado remoto para factura, nota de credito o nota de debito.

Puntos para revisar:

- Si `mode=required`, fallo bloquea factura.
- Si `mode=pilot` y falla proveedor, puede quedar `local_failed` pero task done.
- `print_ready` puede depender de proyeccion electronica, pero no necesariamente de aceptacion DGII final si la politica fiscal permite modo `pilot`/revision.

## Notas de credito/debito cliente

Superficie actual exportada en `functions/src/index.js`:

- `createCustomerCreditNote`
- `updateCustomerCreditNote`
- `applyCustomerCreditNotes`
- `processCustomerCreditNoteOutbox`
- `createCustomerDebitNote`
- `updateCustomerDebitNote`
- `processCustomerDebitNoteOutbox`
- `syncCustomerCreditNoteApplicationAccountingEvent`
- `syncCustomerCreditNoteIssuedAccountingEvent`
- `syncCustomerDebitNoteIssuedAccountingEvent`
- `repairCustomerAdjustmentNoteFinancialEffects`
- `reserveCreditNoteNcf`

Riesgo de revision:

- Confirmar que notas de ajuste e-CF tienen la misma solidez de idempotencia, orden, fiscal sequence y compensacion que facturas.
- Confirmar que aplicaciones de nota contra factura no duplican efectos bajo retry.

## Contabilidad

La factura finalizada crea `accountingEvents` cuando accounting rollout esta activo.

Evento principal:

- `invoice.committed`

Luego hay proyeccion:

- `projectAccountingEventToJournalEntry`
- posting profiles
- chart of accounts
- dead-letter si no puede proyectar.

El evento incluye:

- total, impuestos, moneda funcional/documento
- pago inicial/settled amount
- balance CxC
- cashCountId
- paymentMethods
- banco primario y canal de pago
- cliente/counterparty

Riesgos:

- Si la factura queda en `print_ready_with_review` antes de `committed`, puede existir una ventana corta donde el usuario ve factura imprimible con revision pendiente.
- Si pagos bancarios se normalizan solo en frontend, backend puede recibir payload manipulado.
- `cashCount.sales` y `statusTimeline` siguen como arrays legacy, pero ya tienen dual-write hacia subcolecciones/read models.

## Idempotencia

Capas:

- Frontend genera key estable por carrito o `gen:nanoid`.
- Callable deriva key de cart id o hash si falta.
- `idempotency/{key}` guarda `invoiceId`, `payloadHash`, `status`.
- Si la key existe con hash distinto, rechaza.
- Si coincide, reusa factura existente.
- GISYS usa key estable por negocio/factura/tipo e-CF.

Riesgo:

- No se encontro TTL para `idempotency`, `outbox` o `audit`.
- `firestore.indexes.json` tiene TTL para `aiBusinessSeedingExecutionRequestItems.expiresAt`, `rncLookupBuckets.resetAt` y `sessionTokens.expiresAt`, pero no para facturacion.

## Operacion y despliegue

Repo root:

- `npm run deploy -- staging:functions <nombreFuncion>`
- `npm run deploy -- prod:functions <nombreFuncion>`

`functions/package.json` bloquea deploy all desde `functions/` y redirige a la raiz.

Segun la guia del repo, si se modifica codigo en `functions/`, desplegar solo funciones afectadas. Ejemplos:

- `firebase deploy --only "functions:createInvoiceV2"`
- `firebase deploy --only "functions:processInvoiceOutbox"`
- `firebase deploy --only "functions:processInvoiceCompensation"`
- `firebase deploy --only "functions:refreshElectronicTaxReceiptStatus"`

Para la tanda `print_ready` + hotspots Firestore, el despliegue selectivo esperado es:

- `firebase deploy --only "functions:createInvoiceV2,functions:createInvoiceV2Http,functions:processInvoiceOutbox,functions:processInvoiceCompensation,functions:getInvoiceV2Http"`
- `firebase deploy --only "functions:addInvoiceToOpenCashCount"`
- `firebase deploy --only "firestore:rules"`

## Pruebas observadas

Hay pruebas para:

- `orchestrator.service.test.js`: idempotencia, uso mensual, NCF, e-CF shadow, periodo contable.
- `ncf.service.test.js`: duplicados y disponibilidad NCF.
- `finalize.service.test.js`: committed, NCF, evento contable, fallas no bloqueantes.
- `createInvoice.controller.test.js`: frontera auth/payload user.
- `outbox.worker.test.js`: cobertura limitada; principalmente skip de tareas no pending.
- `electronicTaxReceiptOutbox.service.test.js`: estados e-CF, DGII, accepted/rejected/pending, notas de ajuste.
- `gisysIssuePayload.mapper.test.js`: provincia/municipio, tax rates, exentos, itemKind.
- Frontend InvoicePanel utils/tests: submit, guards, moneda/documento, CxC, bootstrap de pago.
- `printReady.service.test.js`: barrera `print_ready`/`print_ready_with_review`.
- `invoiceTimeline.service.test.js`: dual-write de timeline a subcoleccion y compatibilidad legacy.
- `cashCountSales.service.test.js`: dual-write `cashCount.sales`, subcoleccion y read model.

Brecha clara:

- Faltan pruebas fuertes end-to-end del worker con orden/race entre `createCanonicalInvoice`, `setupAR`, `attachToCashCount`, `issueElectronicTaxReceipt`, `consumeCreditNotes` e `updateInventory`.

## Hallazgos/riesgos para que ChatGPT revise

1. Orden del outbox

Las tareas se disparan por documentos Firestore independientes. No hay `dependsOn`, secuencia ni dispatcher unico por factura. Riesgo de carreras entre canonica, CxC, caja, e-CF, inventario y notas.

2. Barrera de impresion antes de `committed`

El sistema ahora distingue `canonical_ready` de `print_ready`. Esto reduce el riesgo original de `frontend_ready`, pero ChatGPT debe revisar si la lista de prerequisitos de `print_ready` cubre inventario, CxC, caja, e-CF, notas y seguro con la politica correcta.

3. CxC vs canonica

`setupAR` puede correr antes que `createCanonicalInvoice`. Revisar si `receivableState` siempre llega a `invoices/{invoiceId}.data`.

4. Compensacion de inventario manual

Si se descuenta inventario y luego falla otra tarea bloqueante, la compensacion de `updateInventory` no parece reponer automaticamente stock/movimientos/backorders/cogs.

5. App Check

Cliente inicializa App Check, pero `createInvoiceV2` no muestra `enforceAppCheck` ni `consumeAppCheckToken`. Para funcion de dinero/fiscalidad, esto merece revision.

6. Backend no recalcula todo

Backend valida carrito minimo, acceso, caja, NCF, periodo y limites, pero no parece recalcular completamente precios, impuestos, descuentos, pagos, cambio, ITBIS, bancos y comisiones desde fuentes canonicas.

7. Pagos bancarios

La normalizacion de `bankAccountId` para tarjeta/transferencia esta en `invoice.service.ts` del cliente. Revisar si backend debe rechazar payment methods sin cuenta cuando la politica contable lo exige.

8. Comisiones de servicio

Frontend bloquea colaborador sin comision y servicio sin colaborador si la configuracion lo exige. Revisar si backend debe enforcear lo mismo leyendo configuracion/RRHH.

9. Reglas de inventario

`productsStock`, `batches`, `movements`, `backOrders` siguen write client-side con `hasBusinessWriteAccess`. Revisar si eso es aceptable por rol o debe ir a backend-only/campos restringidos.

10. Crecimiento/costo

`cashCount.sales` y `statusTimeline` ya tienen dual-write hacia subcolecciones/read models, pero el array legacy sigue activo. `paymentHistory` y subcolecciones permanentes tambien pueden crecer. Hay crons de reconciliacion y scans por negocio. Revisar paginacion, subcolecciones, TTL, backfill y metricas.

11. `syncNcfLedger` no exportado

El archivo existe pero no aparece exportado en `functions/src/index.js`. El ledger NCF depende de rebuild manual o de otro mecanismo, no del trigger activo.

12. CxC payment separado

`processAccountsReceivablePayment` es otro flujo de dinero; historicamente se ha observado como mas debil en idempotencia que factura V2. Revisar si sigue sin key fuerte end-to-end.

13. e-CF modo pilot vs required

Confirmar politica: si proveedor falla en `pilot`, la factura puede seguir con `local_failed`; si `required`, bloquea. ChatGPT debe evaluar si esa politica encaja con obligaciones fiscales.

14. TTL

No aplicar TTL a facturas fiscales/audit obligatorio sin criterio legal, pero evaluar TTL o retencion para `idempotency`, outbox done, traces temporales y logs operativos.

15. SQL Connect/Data Connect

No esta implementado. Podria ser util para reporting/ledger relacional, pero migrar POS transaccional entero seria gran reescritura. Evaluar solo como proyeccion/contabilidad/reporting futuro.

## Preguntas concretas para ChatGPT

1. La barrera `print_ready` actual es suficiente para imprimir, o deberia exigirse `committed` para algunos tipos de factura?
2. Conviene reemplazar Firestore outbox trigger por Task Queue Functions/Cloud Tasks, o basta agregar `dependsOn`, `sequence`, lease y un dispatcher por factura?
3. Que efectos deben ser atomicos antes de exponer factura al usuario: canonica, inventario, NCF/e-CF, CxC, caja, accounting event?
4. Como disenar una compensacion idempotente de inventario que reponga stock y cree movimientos reversos auditables?
5. Que validaciones deben moverse al backend: precios, impuestos, descuentos, pagos, bancos, limite de credito, comisiones?
6. Es aceptable que inventario base siga writable desde cliente con `hasBusinessWriteAccess`?
7. Debe `createInvoiceV2` usar `enforceAppCheck` y limited-use/consume tokens?
8. Cuando conviene apagar el array legacy `cashCount.sales` y dejar solo subcoleccion/read model?
9. Que TTL/retencion recomiendas sin romper auditoria fiscal?
10. SQL Connect: usarlo para ledger/reporting, no usarlo, o plan hibrido?

## Referencias Firebase verificadas el 2026-06-18

- Task Queue Functions / Cloud Tasks: Firebase permite configurar retry/backoff y rate limits en task queue functions.
- App Check para Cloud Functions: en 2nd gen callable existe `enforceAppCheck` y opcional `consumeAppCheckToken`; `request.app` contiene datos de App Check.
- Firestore TTL: una politica TTL designa un campo timestamp por collection group; los documentos suelen borrarse dentro de 24h despues de expirar; cuenta como delete.
- Firebase SQL Connect: servicio relacional con PostgreSQL administrado, schema/query/mutation management y SDKs.

## Prompt listo para pegar en ChatGPT

Actua como arquitecto senior externo especialista en Firebase, POS, facturacion, fiscalidad, seguridad, inventario, CxC, caja y contabilidad.

Te entrego una descripcion del sistema de facturacion de venta de VentaMas basada en inspeccion local del repo `C:\Dev\VentaMas` al 2026-06-18. No inventes hechos fuera del contexto. Si una conclusion requiere codigo no incluido, marcala como hipotesis y pide que Codex lo verifique.

Objetivos:

1. Detectar riesgos reales o probables de arquitectura, seguridad, concurrencia, consistencia fiscal, inventario, CxC, caja, contabilidad, e-CF y eficiencia.
2. Priorizar hallazgos P0/P1/P2 con impacto y evidencia.
3. Proponer mejoras concretas y de bajo riesgo para el sistema actual.
4. Comparar el enfoque actual Firestore outbox con Task Queue Functions/Cloud Tasks.
5. Evaluar App Check enforcement, Firestore TTL y posible SQL Connect/Data Connect para reporting/ledger.
6. Separar cambios urgentes, mejoras medianas y exploraciones futuras.

Formato de respuesta deseado:

- Diagnostico ejecutivo.
- Hallazgos P0/P1/P2.
- Riesgos de eficiencia/costo.
- Preguntas que Codex debe verificar en el codigo.
- Recomendaciones incrementales sin reescribir todo.
- Plan de hardening en fases.

[Pegar todo este documento como contexto.]
