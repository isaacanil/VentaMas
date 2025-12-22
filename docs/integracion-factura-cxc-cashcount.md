# Flujo actual de facturación, cuentas por cobrar y cuadre de caja

## Componentes clave
- Frontend: `src/services/invoice/useInvoice.js` orquesta la llamada y maneja errores de cuadre; `src/services/invoice/invoice.service.js` construye el payload para el callable y normaliza datos (números, fechas, cliente, NCF, cuentas por cobrar).
- UI POS: `src/views/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.jsx` arma el `idempotencyKey` (usa `cart.id` o genera uno) y dispara `processInvoice`.
- Cloud Functions: `functions/src/versions/v2/invoice/controllers/createInvoice.controller.js` valida y crea la factura en `invoicesV2` en estado `pending`; `functions/src/versions/v2/invoice/services/orchestrator.service.js` agenda tareas en la outbox; `functions/src/versions/v2/invoice/triggers/outbox.worker.js` ejecuta las tareas; `functions/src/versions/v2/invoice/services/finalize.service.js` cierra el flujo; `functions/src/versions/v2/invoice/triggers/compensation.worker.js` revierte efectos si fallan tareas.
- Cash count helpers: `functions/src/modules/cashCount/utils/cashCountQueries.js` y `functions/src/modules/cashCount/utils/cashCountCheck.js` determinan si el usuario tiene cuadre abierto.

## Resumen rápido end-to-end
1) POS arma payload y `idempotencyKey` y llama a `createInvoiceV2` (callable).
2) El callable valida carrito, usuario/negocio y que el usuario tenga un cuadre abierto (estado `open`).
3) Se crea `invoicesV2/{invoiceId}` en estado `pending` y se dejan tareas en la outbox (inventario, factura canónica, enlace a cuadre, AR, notas de crédito, seguros, preorden).
4) El worker de outbox ejecuta cada tarea y va actualizando `statusTimeline`. Cuando la tarea `createCanonicalInvoice` termina, el frontend ya puede leer la factura en `invoices/{invoiceId}` (`frontend_ready`).
5) Si todas las tareas terminan, `attemptFinalizeInvoice` marca la factura como `committed` y consume el NCF reservado. Si algo falla, se marca `failed` y se programan compensaciones.

## Flujo en el POS
1) El panel de factura arma el payload (carrito, cliente, NCF, comentarios agregados desde productos, dueDate calculado si aplica) y un `idempotencyKey`.  
2) `buildInvoiceRequestPayload` exige `businessId` y `userId`, normaliza números y fechas, y si `cart.isAddedToReceivables` obliga a tener `paymentDate`/`totalInstallments`.  
3) `submitInvoice` llama al callable `createInvoiceV2`; `waitForInvoiceResult` sondea `invoicesV2/{invoiceId}` hasta ver `frontend_ready` o `committed` y luego lee la factura canónica en `invoices/{invoiceId}`.  
4) Manejo de cuadre en frontend: `useInvoice` inspecciona los errores (`cashCount-none`, `cashCount-closing`, `cashCount-closed` o mensajes en español) y dispara estrategias de UI (`getCashCountStrategy`) que piden abrir/reabrir el cuadre; si no hay cuadre lanza `No se puede procesar la factura sin cuadre de caja`.

## Flujo en Cloud Functions (createInvoiceV2)
- Validaciones iniciales: verifica `businessId`/`userId`, pertenencia del usuario al negocio, NCF cuando está habilitado, carrito válido y que `isAddedToReceivables` tenga cuotas > 0. Luego busca un cuadre abierto del usuario; si no hay, responde `No hay cuadre de caja abierto` (HttpsError `failed-precondition`).
- `createPendingInvoice` crea `invoicesV2/{invoiceId}` con `status: pending`, `snapshot` (cliente, totales, dueDate derivado de `billing.duePeriod` si no llega, comentario derivado de comentarios en productos) y guarda un `preferredCashCountId`. Si NCF está activo, lo reserva y agrega la entrada `ncf_reserved`.
- Tareas que deja en la outbox (todas con estado `pending`):
  - `updateInventory`: descuenta stock de productos que tienen `trackInventory`.
  - `createCanonicalInvoice`: crea/mergea `businesses/{biz}/invoices/{invoiceId}` con `cashCountId`, `numberID` secuencial si falta, `dueDate` y `invoiceComment`, actualiza/crea el cliente y marca `frontend_ready`.
  - `attachToCashCount`: enlaza la factura al cuadre. Usa candidatos (`preferredCashCountId`, `cart.cashCountId`, meta previa o `cashCountId` del canónico); si ninguno sirve, intenta el cuadre abierto actual. Añade la referencia a `cashCount.sales` y registra `resolvedCashCountId`/estado.
  - `closePreorder`: solo si era preorden, marca el historial como completado.
  - `setupAR`: cuando `isAddedToReceivables` está activo, crea `accountsReceivable` + cuotas; si ya existía para la factura, marca la tarea como saltada.
  - `consumeCreditNotes`: registra aplicaciones y descuenta saldo.
  - `setupInsuranceAR`: crea cuentas por cobrar de seguros y autorización asociada si hay datos de seguro.
- `attemptFinalizeInvoice` se ejecuta tras cada tarea; si ninguna quedó en `pending` y no hay fallidas, pasa a `status: committed` y marca el NCF reservado como usado. Si hay fallas, pone `failed`, programa compensaciones y marca la idempotencia como `failed`.

## Estados y colecciones resultantes
- `invoicesV2/{invoiceId}`: seguimiento del pipeline (timeline `pending` → `committing` → `frontend_ready` → `committed` o `failed`), snapshot con NCF/dueDate/comentario y metadatos de cuadre (`meta.cashCount.intended/resolved...`).
- `invoices/{invoiceId}` (canónico): factura que consume el frontend, con `cashCountId`, `numberID`, `dueDate/hasDueDate`, `invoiceComment`, `client`, historial y datos de pago.
- `cashCounts/{cashCountId}`: el array `cashCount.sales` contiene referencias a las facturas asociadas; `attachToCashCount` añade y loguea si hubo relink cuando el cuadre preferido no estaba abierto.
- `accountsReceivable/{arId}` y `accountsReceivableInstallments`: se crean cuando la venta es a crédito; `setupInsuranceAR` escribe otro AR con `type: insurance` y metadatos del seguro/autorización.
- Notas de crédito: las aplicaciones quedan en `creditNoteApplications` y el saldo en `creditNotes` se ajusta desde la tarea `consumeCreditNotes`.

## Qué ocurre en caso de error
- Sin cuadre abierto: el callable falla antes de crear la factura; el frontend muestra la estrategia de cuadre y el mensaje estándar.
- Fallo en tareas de outbox: la factura queda en `failed` y se generan compensaciones (`compensations/*`) que anulan ARs, devuelven saldo de notas de crédito, desenlazan la factura del cuadre, eliminan el canónico y marcan NCF como `voided` si seguía pendiente. El inventario no se compensa automáticamente (se deja log de advertencia).

## Responsabilidades por capa
- Frontend (POS): valida carrito, reúne parámetros (cliente, NCF, dueDate, AR, notas de crédito), deriva `idempotencyKey`, inicia la factura y muestra errores/estrategias de cuadre. Lectura final: `invoices/{invoiceId}`.
- Cloud Functions: aplica validaciones críticas, asegura cuadre abierto, crea `invoicesV2` y orquesta efectos laterales mediante outbox/compensations.
- Firestore (datos persistidos):
  - `invoicesV2` = pipeline y estado transaccional.
  - `invoices` = factura canónica usada por el front para mostrar/imprimir.
  - `cashCounts` = almacena ventas vinculadas y estados del cuadre.
  - `accountsReceivable*` = créditos (normal y seguro) con cuotas y estado.

## Cash count: reglas clave
- Se consulta el cuadre solo del usuario actual (`cashCount.opening.employee == user.uid`) y debe estar `open`; `closing` o ausencia bloquean la factura.
- Se guarda `preferredCashCountId` al iniciar; `attachToCashCount` intenta usarlo y, si no sirve, cae al cuadre abierto actual.
- Cada factura queda referenciada en `cashCount.sales` (array de refs a `invoices/{invoiceId}`) y se registran metadatos `intended/resolvedState`.

## Factura y cuenta por cobrar
- `isAddedToReceivables` en el carrito activa la tarea `setupAR`; exige `accountsReceivable.totalInstallments > 0` y `paymentDate`.
- El AR se crea con vínculo `invoiceId` y se generan cuotas en `accountsReceivableInstallments`.
- Seguros: `insuranceEnabled` + `insuranceAR` + `insuranceAuth` crean un AR `type: insurance` con autorización guardada.
