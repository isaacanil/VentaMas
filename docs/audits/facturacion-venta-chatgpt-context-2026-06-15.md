# Contexto para ChatGPT: facturacion al completar una venta en VentaMas

Fecha de preparacion: 2026-06-15
Repo: `C:\Dev\VentaMas`
Objetivo: entregar a ChatGPT un paquete fiel al codigo actual para que actue como revisor externo y busque mejoras de arquitectura, seguridad, Firebase y operacion.

Este paquete no contiene secretos, tokens, credenciales, datos reales de clientes ni ventas reales. Es una descripcion basada en inspeccion local de codigo, reglas y docs del repo.

## Resumen ejecutivo

El proceso actual de facturacion de una venta ya no es el flujo viejo donde el frontend hacia todas las escrituras criticas. La venta se inicia desde el `InvoicePanel`, pero la emision real pasa por `createInvoiceV2`, una Cloud Function callable. El backend crea una factura V2 en `businesses/{businessId}/invoicesV2/{invoiceId}` con estado `pending`, registra una llave de idempotencia, valida acceso, valida caja abierta, reserva NCF legacy o prepara e-CF, agenda tareas en una subcoleccion `outbox`, y luego workers de Firestore aplican los efectos secundarios.

El patron implementado se parece a una saga con outbox:

1. Frontend arma payload y aplica guards de UX/negocio.
2. Callable `createInvoiceV2` valida identidad, negocio, rol, suscripcion, carrito, NCF/CxC basica y cuadre abierto.
3. `createPendingInvoice` corre una transaccion Firestore y agenda tareas.
4. `processInvoiceOutbox` procesa cada tarea creada en `outbox`.
5. `attemptFinalizeInvoice` marca `committed` solo cuando no quedan tareas pendientes ni fallas bloqueantes.
6. `processInvoiceCompensation` maneja compensaciones cuando una factura falla despues de aplicar efectos.

La arquitectura ya es mucho mas robusta que un checkout 100% cliente, pero hay varios puntos que merecen revision externa:

- Las tareas de outbox se crean juntas y se procesan con triggers `onDocumentCreated`, por lo que no hay orden estricto garantizado entre `createCanonicalInvoice`, `updateInventory`, `setupAR`, `consumeCreditNotes`, `attachToCashCount`, etc.
- El frontend considera la factura usable cuando la factura canonica esta `frontend_ready`, no necesariamente cuando la V2 esta `committed`.
- Varias reglas fuertes todavia dependen del frontend o de normalizacion previa al callable: banco en tarjeta/transferencia, limite de credito, colaborador obligatorio en servicios, calculos/totales/precios.
- El frontend inicializa App Check, pero `createInvoiceV2` no muestra `enforceAppCheck` ni una validacion explicita de `context.app`.
- Las reglas de Firestore cierran escrituras directas a facturas/CxC/caja/contabilidad, pero `products`, `productsStock`, `batches` y `movements` aun permiten write a usuarios con acceso de negocio.
- Las compensaciones existen, pero la compensacion de inventario esta marcada como manejo manual.

## Stack relevante

Frontend:

- React 19, Vite 8, Redux Toolkit, React Query, HeroUI, AntD, styled-components.
- Firebase Web SDK `firebase` `^11.0.1`.
- El frontend inicializa App Check con `ReCaptchaEnterpriseProvider` si `VITE_FIREBASE_APPCHECK_SITE_KEY` existe y no esta en emuladores.
- Firestore usa cache persistente multi-tab en produccion y cache en memoria en dev/emuladores.

Backend:

- Cloud Functions en Node 24.
- `firebase-functions` `^7.2.3`, `firebase-admin` `^12.7.0`.
- Firestore Admin SDK, transacciones, triggers Firestore v2 para workers.
- GISYS FACT como proveedor de comprobantes fiscales electronicos.
- No se encontro Data Connect/SQL Connect implementado en este repo.
- No se encontraron Task Queue Functions/Cloud Tasks para el flujo de factura.

Fuentes oficiales Firebase consultadas para comparacion actual:

- Task Queue Functions con Cloud Tasks: https://firebase.google.com/docs/functions/task-functions
- Firestore TTL policies: https://firebase.google.com/docs/firestore/ttl
- Firebase SQL Connect/Data Connect: https://firebase.google.com/docs/sql-connect
- App Check para Cloud Functions: https://firebase.google.com/docs/app-check/cloud-functions
- App Check general: https://firebase.google.com/docs/app-check

## Mapa de archivos principales

Frontend venta/facturacion:

- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/services/invoice/useInvoice.ts`
- `src/services/invoice/invoice.service.ts`
- `src/services/invoice/types.ts`
- `src/services/invoice/utils/electronicInvoiceReadiness.ts`
- `src/firebase/invoices/fbAddInvoice.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/Body.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/PaymentMethods/PaymentMethods.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts`
- `src/features/cart/cartSlice.ts`
- `src/features/accountsReceivable/accountsReceivableSlice.ts`

Backend Functions:

- `functions/src/index.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/versions/v2/invoice/services/finalize.service.js`
- `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js`
- `functions/src/app/versions/v2/invoice/services/compensation.service.js`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- `functions/src/app/versions/v2/invoice/services/idempotency.service.js`
- `functions/src/app/versions/v2/invoice/services/audit.service.js`
- `functions/src/app/versions/v2/invoice/services/failurePolicy.service.js`
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.js`
- `functions/src/app/versions/v2/invoice/services/repairTasks.service.js`

Servicios tocados por el outbox:

- `functions/src/app/modules/Inventory/services/getInventory.service.js`
- `functions/src/app/modules/Inventory/services/Inventory.service.js`
- `functions/src/app/modules/accountReceivable/services/getAccountReceivable.service.js`
- `functions/src/app/modules/accountReceivable/services/addAccountReceivable.js`
- `functions/src/app/modules/accountReceivable/services/addInstallmentsAccountReceivable.js`
- `functions/src/app/modules/electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js`
- `functions/src/app/modules/commissions/services/serviceCommissions.service.js`
- `functions/src/app/modules/cashCount/utils/cashCountQueries.js`
- `functions/src/app/modules/cashCount/utils/cashCountCheck.js`

Reglas y configuracion:

- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `functions/package.json`
- `package.json`

Docs internos utiles:

- `docs/invoice/explanation/processing.md`
- `docs/invoice/explanation/processing-v2.md`
- `STATE-fiscal-compliance.md`
- `docs/preventa-cxc-al-finalizar.md`
- `docs/investigacion-preventa-cxc.md`

## Flujo frontend

### Entrada de usuario

La UI visible principal es `InvoicePanel.tsx`. Muestra el modal/drawer "Pago de Factura". El boton primario `Facturar` llama a `handleSubmit` de `useInvoicePanelController`.

El panel deshabilita `Facturar` cuando:

- ya se envio (`submitted`);
- no hay ningun metodo de pago activo;
- hay cambio negativo y la venta no esta marcada como CxC.

El panel tambien tiene una opcion para activar/desactivar impresion y otra para cancelar la venta.

### Controller

`useInvoicePanelController.ts` centraliza:

- Redux selectors de carrito, usuario, negocio, cliente, NCF, CxC, seguros y configuracion de impresion.
- Form de AntD para CxC.
- Estado local del panel: `invoice`, `pendingPrint`, `submitted`, `taxReceiptModalOpen`, `loading`.
- `idempotencyKey`, resuelta asi:
  - `cart:{cart.id}` si existe;
  - `cart:{cart.cartId}`;
  - `cart:{cart.cartIdRef}`;
  - fallback `gen:{nanoid()}` hasta que se cierre el panel.
- Comentarios de factura derivados de comentarios por producto.
- Impresion con `react-to-print` o PDF programatico segun plantilla.
- Reset del carrito/desbloqueo de comprobante despues de imprimir o terminar sin imprimir.

### Payload y validaciones del submit

`submitInvoicePanel.ts` ejecuta el flujo de submit:

1. Resuelve si el negocio tiene modelo fiscal electronico activo via `resolveBusinessFiscalRollout`.
2. Si comprobante fiscal esta activo:
   - exige tipo de comprobante;
   - exige cliente identificado si el comprobante lo requiere;
   - para consumidor final bajo RD$250,000 permite cliente generico;
   - para NCF legacy verifica si el tipo de comprobante esta agotado en `taxReceiptData`;
   - bloquea el tipo de NCF mientras procesa.
3. Si hay moneda/documento bloqueada por tasa faltante o vencida, aborta.
4. Llama `validateInvoiceSubmissionGuards`.
5. Si la venta es CxC, ejecuta `form.validateFields`.
6. Calcula `dueDate`.
7. Llama `runInvoice` con cart, usuario, cliente, CxC, seguro, NCF, negocio, comentario e `idempotencyKey`.
8. Espera la respuesta y luego:
   - registra autorizaciones de factura si no es modo prueba;
   - avisa si la factura fue reutilizada por idempotencia;
   - avisa si el estado no es `committed` sino `frontend_ready` o `test-preview`;
   - imprime o limpia el panel.

### Guardas previas del frontend

`validateInvoiceSubmissionGuards.ts` valida:

- Usuario con `businessID` y `uid`.
- Cuadre de caja abierto con `checkOpenCashReconciliation`.
- Productos con `restrictSaleWithoutStock` deben tener `productStockId` y `batchId`; si falta, intenta cargar stock para abrir selector.
- Si comisiones de servicios estan activas:
  - detecta colaborador no elegible;
  - si `requireCollaboratorOnService` esta activo, exige colaborador por servicio.

Punto para revisar: estas validaciones ayudan a UX, pero las reglas de comision de servicio no parecen revalidarse en backend con la misma fuerza. Inventario si tiene una segunda defensa backend usando el producto real.

### Metodos de pago

`PaymentMethods.tsx` maneja:

- cash, card, transfer, creditNote y metodos extendidos.
- Montos no negativos.
- Auto-completar tarjeta si es unico metodo activo.
- Precios especiales de tarjeta con confirmacion.
- Politica de cuentas bancarias si contabilidad/bancos esta activa:
  - tarjeta/transferencia requieren una cuenta bancaria activa;
  - usa `bankPaymentPolicy` y cuentas activas para resolver `bankAccountId`.

`invoice.service.ts` tambien normaliza metodos bancarios antes de llamar la function, pero esa normalizacion ocurre en el cliente. El backend callable no parece recalcular la politica bancaria si alguien invoca `createInvoiceV2` directamente.

### Cuentas por cobrar

`ReceivableManagementPanel.tsx`:

- Solo se muestra para cliente no generico.
- Calcula balance a credito usando el cambio negativo de factura.
- Permite frecuencia semanal/mensual, cuotas y fecha de primer pago.
- Carga balance pendiente del cliente.
- Actualiza Redux `accountsReceivable.ar`.
- Auto-selecciona fecha de primer pago segun frecuencia.
- Cierra el panel si ya no hay cambio negativo ni CxC activa.

`useARValidation.ts`:

- Calcula si el cliente esta dentro de limite de credito y limite de numero de facturas activas.
- Consulta numero de CxC activas con React Query.

Punto para revisar: el backend solo exige `accountsReceivable.totalInstallments > 0` cuando `isAddedToReceivables=true`; la fecha de pago y limite de credito se fuerzan sobre todo en frontend/build payload.

### Moneda del documento

`DocumentCurrencySelector` y `useDocumentCurrencyConfig`:

- Leen `settings/accounting` por snapshot.
- Permiten emitir documento en moneda distinta a la funcional si existe tasa de venta vigente del dia.
- Bloquean submit si falta tasa o esta vencida.
- Fijan moneda cuando ya hay productos en carrito.
- Mandan contexto monetario hacia `submitInvoicePanel`, que lo mezcla al cart.

Backend `createPendingInvoice` vuelve a resolver snapshot monetario piloto si contabilidad esta en rollout.

### Factura legacy

`src/firebase/invoices/fbAddInvoice.ts` existe como adaptador legacy. Si otro codigo llama `fbAddInvoice(data, user)`, internamente usa:

- `submitInvoice(...)`
- `waitForInvoiceResult(...)`

O sea: aun los caminos antiguos intentan terminar en `createInvoiceV2`.

## Servicio frontend de factura

`src/services/invoice/invoice.service.ts` arma el request real:

- `createInvoiceCallable = httpsCallable(functions, 'createInvoiceV2')`.
- `buildInvoiceRequestPayload`:
  - normaliza usuario y negocio;
  - normaliza cart y reemplaza `undefined` de `productStockId`/`batchId` por `null`;
  - normaliza NCF;
  - normaliza fechas de CxC/seguro a milisegundos;
  - exige `paymentDate` si `cart.isAddedToReceivables`;
  - normaliza metodos con banco segun settings contables del negocio;
  - resuelve snapshot monetario si no vino en cart;
  - sanitiza `undefined` y numeros no finitos a `null`.
- `submitInvoice` llama el callable y retorna `invoiceId`, `status`, `reused`.
- `waitForInvoiceResult` hace polling cada 700 ms hasta 45 s:
  - lee `businesses/{businessId}/invoicesV2/{invoiceId}`;
  - si status `failed`, busca una tarea fallida y lanza error;
  - si status `frontend_ready` o `committed`, lee `businesses/{businessId}/invoices/{invoiceId}`;
  - para e-CF exige que la factura canonica ya tenga proyeccion electronica antes de devolverla;
  - si se agota el tiempo, lanza timeout.

Punto clave: la UI puede recibir factura canonica en `frontend_ready`, antes de `committed`.

`src/services/invoice/useInvoice.ts`:

- Modo prueba genera factura mock sin persistir.
- En modo real llama `submitInvoice` y `waitForInvoiceResult`.
- Si detecta errores de caja, muestra estrategia de cuadre.
- Tiene un retry especial con nueva idempotencia cuando una factura reutilizada falla con error de timestamp invalido.

## Backend callable y HTTP

### createInvoiceV2

Archivo: `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`

Es un callable. En cada llamada:

1. Crea `traceId`.
2. Resuelve `idempotencyKey` desde header, data o body.
3. Si no hay idempotencia:
   - intenta `cart:{cart.id}`;
   - si no, `hash:{stableHash(data.cart)}`;
   - si no puede, rechaza.
4. Resuelve `authUid`, `businessId`, `userId`.
5. Rechaza si falta `businessId` o `userId`.
6. Si hay `authUid`, exige que `userId === authUid`.
7. Llama `assertUserAccess` con roles `INVOICE_OPERATOR`.
8. Llama `assertBusinessSubscriptionAccess` para `INVOICE_CREATE`.
9. Si NCF esta habilitado, exige tipo.
10. Valida carrito con `validateInvoiceCart`:
    - cart existe;
    - `products` existe y es array;
    - al menos un producto;
    - cantidades > 0.
11. Si es CxC, exige `accountsReceivable.totalInstallments > 0`.
12. Busca cuadre abierto del usuario y exige estado `open`.
13. Llama `createPendingInvoice`.
14. Devuelve `{ status: 'pending', invoiceId, reused }`.

Roles permitidos para operar factura: owner, admin, manager, cashier, buyer, dev. El acceso se resuelve por membresia canonica `businesses/{businessId}/members/{authUid}`, cache legacy en user, scope legacy o rol global dev.

Punto para revisar: no se ve `enforceAppCheck` ni validacion explicita de `context.app`.

### createInvoiceV2Http

Archivo: `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js`

Endpoint HTTP alternativo:

- Aplica CORS con `applyHttpCors`.
- Solo permite POST/OPTIONS.
- Exige `Idempotency-Key`; a diferencia del callable, no deriva fallback.
- Resuelve auth con `resolveHttpAuthUser`.
- Repite validaciones de negocio, rol, suscripcion, NCF, cart, CxC y cuadre.
- Llama `createPendingInvoice`.

## Orquestador transaccional

Archivo: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`

`createPendingInvoice` corre dentro de `db.runTransaction`.

Lecturas principales:

- `businesses/{businessId}`
- `businesses/{businessId}/settings/accounting`
- `businesses/{businessId}/settings/taxReceipt`
- `platformConfig/gisysFact`
- `businesses/{businessId}/usage/current`
- `businesses/{businessId}/usage/monthly/entries/{YYYY-MM}`
- `businesses/{businessId}/idempotency/{idempotencyKey}`
- periodos contables si accounting rollout esta activo

Validaciones/decisiones:

- Si idempotency existe:
  - si hash del payload difiere, rechaza `already-exists`;
  - si coincide, retorna invoice existente.
- Si contabilidad esta activa, valida que el periodo contable efectivo no este cerrado.
- Para planes `demo` y `plus`, incrementa/valida limite mensual de facturas.
- Determina `invoiceId` desde preorder/cart/id/nanoid.
- Deriva `dueDate` desde payload o billing.
- Deriva `invoiceComment` desde productos si no llega.
- Resuelve snapshot monetario si aplica.
- Si settings de comprobante fiscal exigen comprobante y payload no trae NCF, rechaza.
- Si NCF/e-CF esta habilitado:
  - exige tipo;
  - exige cliente fiscal identificado salvo consumidor final bajo RD$250,000;
  - si modelo electronico activo:
    - valida config GISYS;
    - resuelve tipo e-CF;
    - prepara snapshot `electronic_pending`;
  - si no es electronico:
    - reserva NCF legacy con `reserveNcf`.

Documento base:

- `businesses/{businessId}/invoicesV2/{invoiceId}`
- Campos clave: `version: 2`, `status: pending`, `businessId`, `userId`, `idempotencyKey`, `requestHash`, `cartHash`, `statusTimeline`, `snapshot`.
- Snapshot contiene ncf, cliente, totales, moneda, meta de preorden/caja, dueDate y comentario.

Outbox creado:

- Siempre:
  - `updateInventory`
  - `createCanonicalInvoice`
  - `attachToCashCount`
- Si e-CF activo:
  - `issueElectronicTaxReceipt`
- Si preorden:
  - `closePreorder`
- Si CxC:
  - `setupAR`
- Si hay notas de credito:
  - `consumeCreditNotes`
- Si seguro tiene CxC/autorizacion:
  - `setupInsuranceAR`

Tambien crea:

- `businesses/{businessId}/idempotency/{idempotencyKey}`
- usage mensual/current con `monthlyInvoices + 1`
- audit entries en `invoicesV2/{invoiceId}/audit`

## Reserva NCF legacy

Archivo: `functions/src/app/versions/v2/invoice/services/ncf.service.js`

`reserveNcf`:

- Lee el tax receipt por tipo dentro de transaccion.
- Verifica `type`, `serie`, `sequence`, `increase`, `quantity`.
- Genera candidato NCF.
- Busca duplicados en `businesses/{businessId}/invoices` por `data.NCF`.
- Intenta hasta 50 candidatos para saltar duplicados.
- Actualiza sequence y quantity.
- Crea `businesses/{businessId}/ncfUsage/{usageId}` con `status: pending`.
- La NCF se marca `used` solo al finalizar `committed`.

Riesgo a revisar: si la factura se imprime o se entrega cuando solo esta `frontend_ready`, el NCF puede estar reservado pero no consumido todavia.

## Outbox worker

Archivo: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`

Trigger:

- `onDocumentCreated` en `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}`
- Region `us-central1`
- Usa secretos GISYS para tarea e-CF.

Comportamiento general:

- Si la tarea no esta `pending`, la salta.
- Carga dependencias dinamicamente.
- `issueElectronicTaxReceipt` se procesa fuera de la transaccion principal porque llama proveedor externo.
- Las demas tareas corren dentro de `db.runTransaction`.
- Cada tarea:
  - verifica que siga `pending`;
  - lee factura V2;
  - marca `committing` al iniciar;
  - aplica efecto;
  - agrega `statusTimeline`;
  - escribe auditoria;
  - marca tarea `done`;
  - despues llama `attemptFinalizeInvoice`.
- Si falla:
  - marca tarea `failed`;
  - guarda `lastError`;
  - registra audit `task_failed`.

### updateInventory

Usa:

- `collectInventoryPrereqs`
- `adjustProductInventory`

Efectos:

- Lee producto, productsStock y batch.
- Si `restrictSaleWithoutStock` y faltan `productStockId`/`batchId`, intenta auto-resolver stock activo con cantidad > 0; si no, falla.
- Descuenta `productsStock.quantity`.
- Si llega a 0, marca stock inactive.
- Descuenta `products.stock`.
- Descuenta `batches.quantity`.
- Crea `movements` de salida por venta.
- Crea `backorders` si hay cantidad no cubierta.
- Si contabilidad esta activa, crea evento `inventory.cogs.recorded`.

Punto a revisar: `adjustProductInventory` consume hasta donde haya stock y crea backorder por faltante. En productos con venta restringida eso esta protegido por seleccion fisica, pero para no restringidos puede permitir factura con backorder. Confirmar si eso es intencional para todos los negocios.

### createCanonicalInvoice

Efectos:

- Crea/actualiza `businesses/{businessId}/invoices/{invoiceId}` con `{ data: canonicalData }`.
- Puede crear/actualizar cliente.
- Resuelve `numberID` con contador `lastInvoiceId`.
- Copia NCF, cliente, cashCountId, moneda, dueDate, comentario, history.
- Calcula `accumulatedPaid` desde pago inicial.
- Sincroniza comisiones de servicios con `syncServiceCommissionsTx`.
- Agrega timeline `invoice_doc_done`.
- Si aun no estaba listo, marca factura V2 como `frontend_ready` y setea `frontendReadyAt`.
- Actualiza idempotency a `frontend_ready`.

Punto critico a revisar: esta tarea puede marcar la factura como `frontend_ready` antes de que terminen inventario, CxC, notas de credito, seguro o caja. El frontend hace polling y puede devolver/printar factura en ese estado.

### issueElectronicTaxReceipt

Archivo relacionado: `functions/src/app/modules/electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.js`

Efectos:

- Lee negocio, plataforma GISYS y factura V2.
- Construye payload GISYS.
- Genera idempotency estable: `ventamas:{businessId}:{invoiceId}:ecf:{documentType}:v1`.
- Si modo `shadow`:
  - no llama transporte real;
  - marca snapshot electronico `shadow_ready`;
  - actualiza canonica con datos electronicos.
- Si modo `pilot` o `required`:
  - llama `issueGisysFactDocument`;
  - guarda estado, submissionId, eNcf, links, DGII/RFCE statuses, seguridad, QR, etc.
  - si falla en `required`, marca tarea failed y puede bloquear factura.
  - si falla fuera de required, puede marcar `local_failed` como done.

Punto a revisar: confirmar que los modos `shadow`, `pilot` y `required` corresponden al nivel de riesgo fiscal del negocio. En especial, si una factura fiscal real puede quedar no bloqueada cuando el proveedor falla.

### attachToCashCount

Efectos:

- Busca si la factura canonica ya esta en `cashCount.sales`.
- Resuelve cash count por candidatos:
  - preferredCashCountId;
  - cart cashCountId;
  - meta de V2;
  - canonical cashCountId;
  - fallback a cuadre abierto del usuario.
- Agrega referencia de factura canonica a `cashCount.sales`.
- Si contabilidad rollout esta activo, crea `cashMovements` POS a partir de factura.
- Actualiza snapshot meta de cash count resuelto.

Falla no bloqueante:

- `failurePolicy.service.js` define `attachToCashCount` como unico tipo de fallo no bloqueante.
- En `finalize.service.js`, si solo falla esa tarea, se registra `nonBlockingFailures` y `requiresCashCountReview`, pero la funcion retorna sin marcar `committed`.

Punto a revisar: esta politica evita fallar toda la venta por caja, pero podria dejar facturas en `frontend_ready` sin `committed`. Confirmar si se requiere job/repair automatico o estado operativo explicito.

### closePreorder

Efectos:

- Actualiza factura canonica con status `completed`.
- Agrega history `{ type: invoice, status: completed }`.
- Agrega timeline `preorder_closed`.

### setupAR

Efectos:

- Busca si ya existe CxC por `invoiceId`, para idempotencia.
- Si no existe:
  - obtiene contador `lastAccountReceivableId`;
  - crea `accountsReceivable`;
  - crea cuotas en `accountsReceivableInstallments`.
- `addAccountReceivable` tambien:
  - actualiza pending balance del cliente;
  - escribe `receivableState` en la factura encontrada.

Punto critico a revisar: si `setupAR` corre antes de `createCanonicalInvoice`, `addAccountReceivable` no encuentra la factura canonica y escribe `receivableState` en `invoicesV2/{invoiceId}`. Si luego `createCanonicalInvoice` crea la canonica, no es obvio que `data.receivableState` termine tambien en `businesses/{businessId}/invoices/{invoiceId}`. Esto parece una condicion de carrera posible por falta de orden entre tareas.

### consumeCreditNotes

Efectos:

- Por cada nota:
  - verifica que exista;
  - rechaza si esta `cancelled` o `voided`;
  - verifica saldo disponible;
  - descuenta `availableAmount`;
  - marca `fully_used` o `applied`;
  - crea `creditNoteApplications`.

### setupInsuranceAR

Efectos:

- Si seguro/CxC/cliente/autorizacion son validos:
  - obtiene contador CxC;
  - obtiene seguro;
  - registra autorizacion;
  - crea CxC de tipo `insurance`;
  - crea cuotas;
  - guarda `arId` y `authId` en resultado de tarea.

## Finalizacion

Archivo: `functions/src/app/versions/v2/invoice/services/finalize.service.js`

`attemptFinalizeInvoice`:

1. Lee factura V2.
2. Si ya esta `committed` o `failed`, retorna.
3. Si hay outbox pending, retorna.
4. Si hay failed:
   - si solo son fallas no bloqueantes (`attachToCashCount`):
     - escribe `nonBlockingFailures`;
     - agrega timeline `non_blocking_failure`;
     - actualiza idempotency a `frontend_ready` o status actual;
     - retorna sin committed.
   - si son fallas bloqueantes:
     - agenda compensaciones para tareas `done`;
     - marca factura V2 `failed`;
     - idempotency `failed`.
5. Si todo esta done:
   - consume NCF reservado cambiando `ncfUsage.status` a `used`;
   - si contabilidad activa:
     - crea `accountingEvents/{invoice.committed__invoiceId}`;
   - marca V2 `committed`;
   - idempotency `committed`.

Evento contable `invoice.committed` incluye:

- tipo `invoice.committed`;
- source document invoice;
- cliente;
- moneda funcional/documento;
- total, impuestos, pagado, balance CxC;
- cashCountId, banco primario y canal de pago;
- metodos de pago.

## Compensaciones

Archivos:

- `functions/src/app/versions/v2/invoice/services/compensation.service.js`
- `functions/src/app/versions/v2/invoice/triggers/compensation.worker.js`

Cuando finalizacion encuentra fallas bloqueantes:

- Crea docs `invoicesV2/{invoiceId}/compensations/{compId}` para tareas `done`.
- Worker `processInvoiceCompensation` procesa cada compensacion.

Compensaciones implementadas:

- `setupAR`: marca CxC y cuotas como `voided`, `isActive=false`, `isClosed=true`.
- `setupInsuranceAR`: igual que AR.
- `consumeCreditNotes`: reacredita saldo y borra aplicaciones.
- `createCanonicalInvoice`: borra factura canonica, excepto si solo habia falla no bloqueante de caja.
- `attachToCashCount`: remueve referencia de factura en `cashCount.sales`.
- `closePreorder`: agrega history `reverted`.
- NCF legacy pendiente: marca `ncfUsage` como `voided`.

Compensacion parcial/manual:

- `updateInventory`: actualmente loguea que la compensacion de inventario queda para manejo manual. No repone stock automaticamente.

## Modelo de datos Firestore involucrado

Colecciones principales:

- `businesses/{businessId}/invoicesV2/{invoiceId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/audit/{auditId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}/compensations/{compId}`
- `businesses/{businessId}/idempotency/{key}`
- `businesses/{businessId}/invoices/{invoiceId}`
- `businesses/{businessId}/ncfUsage/{usageId}`
- `businesses/{businessId}/taxReceipts/{taxReceiptId}`
- `businesses/{businessId}/products/{productId}`
- `businesses/{businessId}/productsStock/{productStockId}`
- `businesses/{businessId}/batches/{batchId}`
- `businesses/{businessId}/movements/{movementId}`
- `businesses/{businessId}/backorders/{backorderId}`
- `businesses/{businessId}/cashCounts/{cashCountId}`
- `businesses/{businessId}/cashMovements/{movementId}`
- `businesses/{businessId}/accountsReceivable/{arId}`
- `businesses/{businessId}/accountsReceivableInstallments/{installmentId}`
- `businesses/{businessId}/creditNotes/{creditNoteId}`
- `businesses/{businessId}/creditNoteApplications/{applicationId}`
- `businesses/{businessId}/serviceCommissions/{commissionId}`
- `businesses/{businessId}/hrCommissionEntries/{entryId}`
- `businesses/{businessId}/accountingEvents/{eventId}`
- `businesses/{businessId}/journalEntries/{entryId}` via projection posterior.

## Firestore rules relevantes

`firestore.rules` actualmente:

- Permite leer `invoices` e `invoicesV2` con `hasBusinessAccess`.
- Bloquea create/update/delete directos a `invoicesV2` y subcolecciones.
- Para `invoices`, permite create/update/delete directo solo para borradores seguros, no documentos fiscales/contables bloqueados.
- Bloquea escrituras cliente a:
  - `accountingEvents`;
  - `journalEntries`;
  - `accountsReceivable`;
  - `accountsReceivablePayments`;
  - `accountsReceivableInstallments`;
  - `creditNotes`;
  - `creditNoteApplications`;
  - `serviceCommissions`;
  - `cashMovements`;
  - `cashCounts`;
  - `ncfUsage`;
  - `ncfLedger`;
  - reportes fiscales.
- Permite escritura cliente con `hasBusinessWriteAccess` en:
  - `products`;
  - `productsStock`;
  - `batches`;
  - `movements`;
  - `inventorySessions`;
  - `orders`;
  - `clients`;
  - `providers`;
  - estructuras de almacen.

Punto a revisar: aunque la emision de factura esta backend-first, los datos base de inventario/precio/stock siguen siendo mutables desde cliente para usuarios con permisos de negocio. ChatGPT deberia evaluar si eso es aceptable por rol o si se debe limitar mas para dinero/inventario.

## Idempotencia

En frontend:

- Se intenta usar `cart.id`, `cart.cartId`, `cart.cartIdRef`.
- Fallback por panel `gen:nanoid`.

En callable:

- Lee header/body/data.
- Si falta, deriva de cart id o hash estable del cart.

En backend:

- `idempotency/{key}` guarda invoiceId, payloadHash, status.
- Si se repite key con mismo hash, retorna invoice existente.
- Si se repite key con otro hash, rechaza.
- Status avanza a `frontend_ready`, `committed` o `failed`.

Punto a revisar: no se vio TTL/retencion explicita para idempotency/outbox/audit de facturacion. Firestore TTL existe en el proyecto para otros `expiresAt`, pero no parece aplicado aqui. Cuidado: facturas/fiscal audit deben conservarse, pero registros operativos de idempotencia quizas pueden tener retencion controlada.

## Pruebas existentes

Cobertura detectada:

- `functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js`
  - idempotencia;
  - dueDate/comment/usage;
  - NCF faltante;
  - cliente fiscal requerido;
  - e-CF shadow;
  - NCF legacy;
  - comprobante requerido si negocio lo exige;
  - periodo contable cerrado/abierto.
- `functions/src/app/versions/v2/invoice/services/ncf.service.test.js`
  - salta NCF duplicados;
  - valida cantidad suficiente;
  - valida serie/tipo.
- `functions/src/app/versions/v2/invoice/services/finalize.service.test.js`
  - fallas no bloqueantes;
  - committed y consumo NCF;
  - evento contable.
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js`
  - por ahora solo confirma que tareas no `pending` se saltan.
- Tests relacionados de contabilidad, cash movements, e-CF readiness, tax receipt utils.

Brecha clara:

- Faltan tests fuertes del worker para orden/race entre tareas, CxC, inventario, caja, notas de credito, seguro, comisiones y e-CF.

## Observaciones preliminares para que ChatGPT revise

Estas son hipotesis de riesgo. No tratarlas como conclusion final sin verificarlas con pruebas o lectura adicional.

1. Orden del outbox

Las tareas se crean juntas y cada doc dispara un trigger independiente. No se ve una cola secuencial ni dependencias explicitas. Esto puede causar:

- factura canonica y `frontend_ready` antes de inventario;
- `setupAR` antes de factura canonica;
- `attachToCashCount` antes o despues de canonical;
- e-CF antes o despues de canonical;
- impresion antes de commit final.

Preguntar a ChatGPT: conviene migrar a Task Queue Functions/Cloud Tasks, o mantener Firestore outbox pero con `dependsOn`, `sequence`, lease y un unico dispatcher por factura?

2. `frontend_ready` vs `committed`

El frontend retorna la factura cuando existe la canonica en estado `frontend_ready` o cuando esta `committed`. Para UX eso reduce espera, pero para fiscal/inventario/CxC puede ser riesgoso.

Preguntar a ChatGPT: para venta POS, se debe imprimir solo en `committed`? O se puede imprimir en `frontend_ready` con restricciones? Como manejar e-CF/NCF si luego falla inventario o CxC?

3. CxC y race de canonica

`setupAR` actualiza `receivableState` en la factura que encuentre: canonical si existe, si no `invoicesV2`. Como outbox no tiene orden, puede quedar CxC creada pero factura canonica sin `data.receivableState`.

Preguntar a ChatGPT: esto debe ser una dependencia obligatoria `createCanonicalInvoice -> setupAR`, o `createCanonicalInvoice` debe leer/absorber `receivableState` desde V2/AR al crear la canonica?

4. Compensacion de inventario

Si inventario se descuenta y luego falla otra tarea, se agenda compensacion, pero `updateInventory` queda como manejo manual.

Preguntar a ChatGPT: para un sistema POS, es aceptable compensacion manual de inventario? Que estrategia idempotente y auditable recomienda para reponer stock/movimientos/backorders/cogs?

5. App Check

El frontend inicializa App Check, pero `createInvoiceV2` no muestra enforcement. Otras funciones AI si tienen config App Check.

Preguntar a ChatGPT: debe `createInvoiceV2` exigir `enforceAppCheck`/`consumeAppCheckToken` o validar `context.app`, considerando que es un endpoint de dinero/facturacion?

6. Validacion backend de totales y precios

Backend valida estructura minima del carrito, pero no parece recalcular precios, impuestos, descuentos, metodo de pago, cambio, total, ITBIS, ni reglas de banco desde catalogo/config. El canonical invoice copia mucho del cart.

Preguntar a ChatGPT: que calculos deben moverse/repetirse en backend para evitar manipulacion de payload?

7. Banco y pagos

La normalizacion fuerte de banco para tarjeta/transferencia esta en frontend service antes del callable. Si un cliente invoca callable directamente, backend no parece aplicar `bankPaymentPolicy`.

Preguntar a ChatGPT: donde deberia validarse `bankAccountId`, `paymentMethod`, referencias, suma de pagos y reconciliacion de caja?

8. Comisiones de servicios

El frontend bloquea servicio sin colaborador si la configuracion lo exige. Backend sincroniza comisiones si hay snapshot, pero no parece impedir factura si falta colaborador.

Preguntar a ChatGPT: debe backend bloquear `requireCollaboratorOnService` y elegibilidad de colaborador leyendo settings/HR, o basta UX?

9. Firestore rules de inventario

Facturas/CxC/caja/contabilidad estan cerradas a write cliente, pero inventario/productos/lotes/movimientos siguen write cliente con business write access.

Preguntar a ChatGPT: en POS con inventario y dinero, que colecciones deberian pasar a backend-only o a reglas por rol/campos?

10. Data Connect / SQL Connect

El sistema usa Firestore para transacciones operativas y contabilidad. Firebase SQL Connect ofrece PostgreSQL administrado con schema, queries/mutations seguras y SDKs.

Preguntar a ChatGPT: conviene evaluar SQL Connect para contabilidad/reporting/ledger relacional sin romper el POS Firestore? O mantener Firestore + proyecciones/journalEntries?

11. Task Queue Functions

Firebase Task Queue Functions usa Cloud Tasks para trabajo asincrono pesado o con reintentos. Nuestro flujo usa Firestore triggers por tarea.

Preguntar a ChatGPT: para outbox de facturacion, que gana/perderia con Cloud Tasks: retry/backoff, rate limit, control de orden, dead-letter, observabilidad, costo, complejidad?

12. TTL

Firestore TTL puede eliminar datos obsoletos por campo timestamp. Idempotency, outbox done y audit operativo pueden crecer.

Preguntar a ChatGPT: que datos se pueden limpiar con TTL sin comprometer obligaciones fiscales/auditoria? Que retencion sugerir para `idempotency` y `outbox`?

## Prompt sugerido para ChatGPT

Actua como arquitecto senior externo, especialista en Firebase, POS/facturacion, seguridad y sistemas fiscales. Codex inspecciono el repo `C:\Dev\VentaMas` y te entrega este contexto sin secretos.

Necesito que analices el proceso de facturacion al completar una venta. No inventes hechos del repo: usa solo el contexto dado. Si una conclusion depende de codigo no incluido, marcala como hipotesis y pide que Codex lo verifique.

Objetivos:

1. Detectar riesgos reales o probables de arquitectura, seguridad, concurrencia, consistencia fiscal, inventario, CxC, caja, contabilidad y e-CF.
2. Priorizar hallazgos por severidad e impacto operativo.
3. Proponer mejoras concretas y de bajo riesgo para el sistema actual.
4. Comparar el uso actual de Firebase con opciones modernas: Task Queue Functions/Cloud Tasks, App Check enforcement, Firestore TTL y Firebase SQL Connect/Data Connect.
5. Distinguir entre cambios urgentes, mejoras medianas y exploraciones futuras.

Formato deseado:

- Resumen de diagnostico.
- Hallazgos P0/P1/P2 con evidencia del contexto.
- Preguntas de verificacion para Codex.
- Recomendaciones Firebase actuales y trade-offs.
- Plan incremental de mejoras sin reescribir todo.

Contexto tecnico:

[Pegar este documento completo o una version resumida con las secciones anteriores.]

