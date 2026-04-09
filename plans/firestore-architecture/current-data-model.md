# Current Data Model

Fecha: 2026-03-12
Base: `C:\Dev\VentaMas`

## Objetivo
Documentar el modelo de datos actual observado en el repo sin entrar a juzgar si esta bien o mal. El foco aqui es descriptivo: entidades, atributos, clasificacion, ownership y relaciones.

## Leyenda
- `Raiz`: coleccion global o tenant root.
- `Subcoleccion`: cuelga de una entidad padre.
- `Canonica`: parece ser la fuente principal del dato.
- `Derivada`: parece depender de otra entidad.
- `Cache`: replica orientada a lectura o UI.
- `Log`: historial o evento.
- `Snapshot`: copia del estado en un momento.
- `Legacy`: activa, pero con semantica o ubicacion historica.

## Vista general

### Colecciones raiz globales observadas
| Ruta | Clasificacion | Uso aparente |
|---|---|---|
| `users/{uid}` | Raiz, canonica global para identidad, espejo operativo para contexto | Usuario, sesion activa, acceso, presencia |
| `businesses/{businessId}` | Raiz tenant | Negocio y contenedor principal de datos operativos |
| `billingAccounts/{billingAccountId}` | Raiz | Billing por owner/cuenta |
| `billingPlanCatalog/{planCode}` | Raiz config | Catalogo de planes |
| `sessionTokens/{tokenId}` | Raiz, log/operativa | Tokens de sesion |
| `sessionLogs/{logId}` | Raiz, log | Auditoria de sesiones |
| `businessInvites/{inviteId}` | Raiz, operativa | Invitaciones de membresia |
| `businessOwnershipClaims/{claimId}` | Raiz, operativa | Reclamaciones de ownership |
| `devBusinessImpersonationAudit/{auditId}` | Raiz, log | Auditoria de impersonacion |
| `changelogs/{id}` | Raiz, log/config | Historial de app |
| `app/{id}` | Raiz, config | Version/app config |
| `rncData/{id}` | Raiz, dataset | Datos RNC |
| `errors/{id}` | Raiz, log | Registro de errores |
| `insuranceAuths/{authId}` | Raiz | Autorizaciones de seguro |

### Rutas raiz legacy observadas
| Ruta | Clasificacion | Nota |
|---|---|---|
| `client/{id}` | Legacy | Variante global de cliente |
| `creditLimit/{clientId}` | Legacy | Variante global de limite de credito |
| `productOutflow/{id}` | Legacy | Variante global de salida de productos |
| `products/{id}` | Legacy/config tecnica | Uso puntual fuera del tenant |

## Modelo por dominio

### 1. Identidad y acceso

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Usuario | `users/{uid}` | Raiz | `uid`, `activeBusinessId`, `lastSelectedBusinessId`, `activeRole`, `accessControl`, `presence`, `platformRoles`, `isDev` | `uid` | Se relaciona con `members`, sesiones y auditorias | Canonica para identidad; derivada/espejo para contexto de negocio |
| Token de sesion | `sessionTokens/{tokenId}` | Raiz | `userId`, estado de sesion, timestamps, metadata | `tokenId`, `userId` | Usuario -> sesiones | Canonica operativa |
| Log de sesion | `sessionLogs/{logId}` | Raiz, log | `userId`, `createdAt`, metadata de acceso | `logId`, `userId`, `createdAt` | Usuario -> sessionLogs | Derivada/log |
| Membresia | `businesses/{businessId}/members/{uid}` | Subcoleccion pivote | `uid`, `userId`, `businessId`, `role`, `status`, `isOwner`, `source`, `invitedBy`, timestamps | `uid`, `businessId`, `role`, `status` | Usuario <-> negocio | Parece canonica para pertenencia negocio-usuario |
| Permisos dinamicos | `businesses/{businessId}/userPermissions/{uid}` | Subcoleccion | payload libre de permisos | `uid` | Usuario -> permisos por negocio | Derivada/config operativa |
| Invite | `businessInvites/{inviteId}` | Raiz | `businessId`, `role`, `status`, `usedCount`, `maxUses`, `createdBy`, `expiresAt` | `inviteId`, `businessId`, `status` | Conduce a membresia | Operativa |
| Ownership claim | `businessOwnershipClaims/{claimId}` | Raiz | `businessId`, `status`, `codePrefix`, owner/actor fields | `claimId`, `businessId`, `status` | Conduce a negocio y membresia | Operativa |

### 2. Negocio y configuracion

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Negocio | `businesses/{businessId}` | Raiz tenant | `ownerUid`, `owners`, `billingAccountId`, `subscription`, `business`, `updatedAt` | `businessId`; nombre y owner parecen necesarios funcionalmente | Padre de todas las subcolecciones tenant | Canonica del tenant, con nesting adicional observado |
| Billing settings | `businesses/{businessId}/settings/billing` | Subcoleccion config | `billingMode`, `invoiceType`, flags y thresholds | No totalmente claro | Negocio -> billing/inventory | Config |
| Tax receipt settings | `businesses/{businessId}/settings/taxReceipt` | Subcoleccion config | `taxReceiptEnabled` | `taxReceiptEnabled` | Negocio -> NCF | Config |
| Accounting settings | `businesses/{businessId}/settings/accounting` | Subcoleccion config | payload contable/monetario | No claro | Negocio -> invoices/billing | Config |
| Current usage | `businesses/{businessId}/usage/current` | Subcoleccion agregado | `businessId`, `monthKey`, contadores (`monthlyInvoices`, etc.) | `businessId` | Negocio -> limites/billing | Derivada/agregado |
| Monthly usage | `businesses/{businessId}/usage/monthly/entries/{month}` | Subcoleccion agregado historico | `businessId`, `month`, contadores | `businessId`, `month` | Negocio -> limites/billing | Derivada/historica |
| Counter | `businesses/{businessId}/counters/{name}` | Subcoleccion tecnica | secuencias numericas por entidad | `name` | Negocio -> IDs incrementales | Tecnica/canonica de secuencia |

### 3. Billing

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Billing account | `billingAccounts/{billingAccountId}` | Raiz | `billingAccountId`, `ownerUid`, `status`, `provider`, timestamps | `billingAccountId`, `ownerUid` | Owner -> billing account -> negocios | Canonica |
| Business link | `billingAccounts/{billingAccountId}/businessLinks/{businessId}` | Subcoleccion pivote | `businessId`, `ownerUid`, `status`, `linkedAt`, `updatedAt` | `businessId`, `ownerUid` | Billing account <-> negocio | Canonica relacional |
| Subscription | `billingAccounts/{billingAccountId}/subscriptions/{subId}` | Subcoleccion | snapshot de plan, lifecycle y fechas | `subId`, `planId`, estados | Billing account -> negocio(s) | Parece canonica |
| Payment history | `billingAccounts/{billingAccountId}/paymentHistory/{paymentId}` | Subcoleccion log | metadata de pago y provider | `paymentId` | Billing account -> pagos | Log |
| Checkout session | `billingAccounts/{billingAccountId}/checkoutSessions/{orderNumber}` | Subcoleccion operativa | estado de checkout, provider data, order number | `orderNumber` | Billing account -> checkout | Operativa |
| Business subscription mirror | `businesses/{businessId}.subscription` | Campo espejo | snapshot de suscripcion | No aplica | Negocio -> billing account | Derivada/espejo |
| Nested business subscription mirror | `businesses/{businessId}.business.subscription` | Campo espejo | snapshot de suscripcion | No aplica | Negocio -> billing account | Derivada/espejo |

### 4. Clientes, credito y cuentas por cobrar

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Cliente | `businesses/{businessId}/clients/{clientId}` | Subcoleccion | `client.*`, `pendingBalance`, `numberId`, `status` | `clientId`, `client.name` parecen necesarios funcionalmente | Cliente -> facturas, AR, credit notes | Canonica |
| Cliente legacy | `client/{id}` | Raiz legacy | `client` embebido | `id` | Ninguna frontera tenant clara | Legacy |
| Limite de credito | `businesses/{businessId}/creditLimit/{clientId}` | Subcoleccion | payload de limite, reglas y valores | `clientId` | Cliente -> limite | Canonica |
| Limite de credito legacy | `creditLimit/{clientId}` | Raiz legacy | payload de limite | `clientId` | Cliente globalizado | Legacy |
| Cuenta por cobrar | `businesses/{businessId}/accountsReceivable/{arId}` | Subcoleccion agregado | `clientId`, `invoiceId`, `arBalance`, `isActive`, `status` | `arId`, `clientId` | Cliente -> AR; Factura -> AR | Canonica |
| Cuota AR | `businesses/{businessId}/accountsReceivableInstallments/{id}` | Subcoleccion | `arId`, `installmentDate`, `installmentBalance`, `isActive`, `isClosed` | `id`, `arId`, `installmentDate` | AR -> cuotas | Canonica hija |
| Pago AR | `businesses/{businessId}/accountsReceivablePayments/{id}` | Subcoleccion log | montos, metodos, actor, fechas | `id`, monto, fecha | AR -> pagos | Canonica/log |
| Pago de cuota AR | `businesses/{businessId}/accountsReceivableInstallmentPayments/{id}` | Subcoleccion log | `installmentId`, `paymentId`, monto aplicado | `id`, `installmentId`, `paymentId` | Cuota <-> pago | Canonica/pivote |
| Receipt de pago AR | `businesses/{businessId}/accountsReceivablePaymentReceipt/{id}` | Subcoleccion snapshot | `client`, `accounts`, `installmentsPaid`, `paymentMethods`, `user` | `id` | Deriva de AR y pagos | Snapshot |
| Insurance auth | `insuranceAuths/{authId}` | Raiz | `businessId`, `clientId`, `insuranceId`, `authNumber`, flags de borrado | `authId`, `businessId`, `clientId` | Cliente -> seguro/autorizacion | Activa, pero fuera de frontera tenant |

### 5. Facturacion, NCF y caja

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Factura legacy | `businesses/{businessId}/invoices/{invoiceId}` | Subcoleccion | normalmente `data.*` con cliente, montos, NCF, user ref | `invoiceId`, `data.id` | Factura -> cliente, caja, AR, credit notes | Sigue activa; parece canonica para modulos legacy |
| Snapshot previo de factura | `businesses/{businessId}/previousInvoices/{invoiceId}` | Subcoleccion snapshot | `data.*`, `savedAt` | `invoiceId` | Factura -> historico | Snapshot |
| Factura V2 | `businesses/{businessId}/invoicesV2/{invoiceId}` | Subcoleccion agregado | `version`, `status`, `snapshot`, `statusTimeline[]`, `idempotencyKey`, `businessId`, `userId` | `invoiceId`, `version`, `status`, `businessId`, `userId` | Factura -> outbox -> side effects | Canonica del flujo moderno |
| Outbox task | `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}` | Subcoleccion outbox | `type`, `status`, `attempts`, `payload`, `result`, timestamps | `taskId`, `type`, `status`, `payload` | Factura V2 -> tareas | Derivada/operativa |
| Compensation task | `businesses/{businessId}/invoicesV2/{invoiceId}/compensations/{id}` | Subcoleccion | `taskId`, `type`, `status`, `payload`, `result` | `id`, `type`, `status` | Factura V2 -> compensaciones | Derivada/operativa |
| Idempotency key | `businesses/{businessId}/idempotency/{key}` | Subcoleccion tecnica | `key`, `invoiceId`, `payloadHash`, `status` | `key`, `invoiceId` | Factura V2 -> idempotencia | Tecnica |
| Tax receipt | `businesses/{businessId}/taxReceipts/{serie}` | Subcoleccion config operativa | `data.type`, `data.serie`, `data.sequence`, `data.quantity`, `data.increase`, `data.sequenceLength` | `serie`, `type`, `sequence` | Factura/NCF -> secuencia | Canonica legacy de secuencia |
| NCF usage | `businesses/{businessId}/ncfUsage/{usageId}` | Subcoleccion log | `ncfCode`, `taxReceiptName`, `status`, `generatedAt`, `usedAt`, `invoiceId` | `usageId`, `ncfCode`, `status` | Tax receipt -> invoice | Canonica para reserva/uso |
| NCF ledger meta | `businesses/{businessId}/ncfLedger/{prefix}` | Subcoleccion read model | `prefix`, `lastNumber`, `duplicatesCount`, `totalEntries` | `prefix` | Ledger -> entries | Derivada |
| NCF ledger entry | `businesses/{businessId}/ncfLedger/{prefix}/entries/{entryId}` | Subcoleccion read model | `ncf`, `sequenceNumber`, `invoices[]`, `activeCount`, `duplicatesCount` | `entryId`, `ncf` | Deriva de facturas | Derivada |
| Cuadre de caja | `businesses/{businessId}/cashCounts/{cashCountId}` | Subcoleccion agregado | `cashCount.state`, `cashCount.opening.employee`, `cashCount.sales[]`, `stateHistory[]`, `opening.date` | `cashCountId`, `state`, `opening.employee` | Caja -> usuario y facturas | Canonica para caja |
| Authorization request | `businesses/{businessId}/authorizationRequests/{id}` | Subcoleccion operativa | `status`, `expiresAt` o `expires_at`, modulo/target | `id`, `status` | Flujos de autorizacion | Operativa |
| PIN auth log | `businesses/{businessId}/pinAuthLogs/{id}` | Subcoleccion log | actor, modulo, resultado, timestamps | `id` | Usuario -> autorizaciones | Log |

### 6. Inventario y ubicaciones

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Producto | `businesses/{businessId}/products/{productId}` | Subcoleccion maestro | `id`, `businessID`, `name`, `brand`, `category`, `stock`, `trackInventory` | `productId`, `businessID`, `name` | Producto -> lotes, stocks, movimientos | Canonica para catalogo; no necesariamente para stock |
| Producto root legacy | `products/{id}` | Raiz legacy | `ingredientList[]` en caso puntual | `id` | Uso puntual | Legacy |
| Lote | `businesses/{businessId}/batches/{batchId}` | Subcoleccion operativa | `id`, `productId`, `productName`, `numberId`, `quantity`, `status`, `expirationDate`, `providerId` | `batchId`, `productId`, `quantity` | Producto -> lote -> stocks | Canonica parcial |
| Stock por ubicacion | `businesses/{businessId}/productsStock/{stockId}` | Subcoleccion operativa | `id`, `productId`, `batchId`, `location`, `quantity`, `status`, `isDeleted`, `initialQuantity` | `stockId`, `productId`, `location`, `quantity` | Producto/lote -> stock -> movimientos | Mejor candidata a verdad operativa |
| Movimiento | `businesses/{businessId}/movements/{movementId}` | Subcoleccion log | `productId`, `batchId`, `sourceLocation`, `destinationLocation`, `quantity`, `movementType`, `movementReason`, `createdAt` | `movementId`, `productId`, `quantity`, `movementType` | Stock/lote/producto -> movimiento | Log |
| Back order | `businesses/{businessId}/backOrders/{id}` | Subcoleccion derivada | `productId`, `saleId`, `pendingQuantity`, `status` | `id`, `productId` | Deriva de faltantes | Derivada |
| Warehouse | `businesses/{businessId}/warehouses/{warehouseId}` | Subcoleccion | `id`, `name`, `defaultWarehouse`, `owner`, `location` | `warehouseId`, `name` | Warehouse -> shelves | Canonica |
| Shelf | `businesses/{businessId}/shelves/{shelfId}` | Subcoleccion | `id`, `name`, `warehouseId` | `shelfId`, `warehouseId` | Warehouse -> shelves -> rows | Canonica |
| Row | `businesses/{businessId}/rows/{rowId}` | Subcoleccion | `id`, `name`, `warehouseId`, `shelfId` | `rowId`, `shelfId` | Shelf -> rows -> segments | Canonica |
| Segment | `businesses/{businessId}/segments/{segmentId}` | Subcoleccion | `id`, `name`, `warehouseId`, `shelfId`, `rowShelfId` | `segmentId`, `rowShelfId` | Row -> segments | Canonica |
| Warehouse structure | `businesses/{businessId}/warehouseStructure/{type}` | Subcoleccion cache/read model | `elements.{id}` con `name`, `location`, `updatedAt`, `updatedBy`, `isDeleted` | `type`, `elements` | Duplica warehouses/shelves/rows/segments | Cache / read model |
| Inventory session | `businesses/{businessId}/inventorySessions/{sessionId}` | Subcoleccion | metadata de conteo/sesion | `sessionId` | Sesion -> counts | Canonica operativa |
| Inventory count | `businesses/{businessId}/inventorySessions/{sessionId}/counts/{countId}` | Subcoleccion hija | conteos y metadata | `countId`, `sessionId` | Session -> counts | Canonica hija |
| Product outflow tenant | `businesses/{businessId}/productOutflow/{id}` | Subcoleccion | `productList`, actor, timestamps | `id`, `productList` | Salida de inventario | Operativa |
| Product outflow root | `productOutflow/{id}` | Raiz legacy | `productList` | `id` | Variante global | Legacy |

### 7. Catalogos y maestros operativos

| Entidad | Ruta | Tipo | Atributos observados | Requeridos aparentes | Relaciones | Canonica / derivada |
|---|---|---|---|---|---|---|
| Provider | `businesses/{businessId}/providers/{providerId}` | Subcoleccion | `provider.*`, `status` | `providerId`, nombre | Producto/lote/compra | Canonica |
| Purchase | `businesses/{businessId}/purchases/{purchaseId}` | Subcoleccion | datos de compra, proveedor, productos, montos | `purchaseId` | Provider -> purchases -> inventory | Canonica |
| Expense | `businesses/{businessId}/expenses/{expenseId}` | Subcoleccion | `expense.*`, fechas, payment/cash register | `expenseId` | Caja y reportes | Canonica |
| Order | `businesses/{businessId}/orders/{orderId}` | Subcoleccion | estado, cliente, productos | `orderId` | Cliente -> orders | Canonica |
| Doctor | `businesses/{businessId}/doctors/{doctorId}` | Subcoleccion | `name`, `specialty`, `status` | `doctorId`, `name` | Seguro/pacientes/ventas | Canonica |
| Product brand | `businesses/{businessId}/productBrands/{brandId}` | Subcoleccion | `name` o `brandName` | `brandId`, nombre | Productos | Canonica catalogo |
| Category | `businesses/{businessId}/categories/{categoryId}` | Subcoleccion | `category.name` u otras formas | `categoryId`, nombre | Productos | Canonica catalogo |
| Active ingredient | `businesses/{businessId}/activeIngredients/{ingredientId}` | Subcoleccion | nombre y metadata | `ingredientId`, nombre | Productos | Canonica catalogo |

## Relaciones resumidas

### Usuario y negocio
- Un `user` puede pertenecer a muchos `businesses` via `members`.
- Un `business` tiene muchos `members`.
- `users.accessControl` parece reflejar la misma relacion de forma embebida.

### Billing y negocio
- Un `billingAccount` puede enlazar muchos `businesses`.
- Un `business` guarda `billingAccountId` como espejo.
- Las suscripciones viven en billing y se reflejan en el negocio.

### Cliente y monetario
- Un `client` puede tener un `creditLimit`.
- Un `client` puede tener muchas `accountsReceivable`.
- Una `accountsReceivable` tiene muchas `installments`.
- Un `payment` puede aplicarse a muchas `installments` via `installmentPayments`.
- Una `creditNote` puede aplicarse a muchas `invoices` via `creditNoteApplications`.

### Facturacion
- `invoicesV2` genera side effects por `outbox`.
- `invoices` sigue siendo referenciada por caja y otros modulos.
- `taxReceipts` alimenta `ncfUsage`.
- `ncfUsage` alimenta/acompaña a la factura.
- `ncfLedger` deriva de facturas emitidas.

### Inventario
- Un `product` puede tener muchos `batches`.
- Un `product` puede tener muchos `productsStock`.
- Un `batch` puede tener muchos `productsStock`.
- `movements` registra eventos sobre producto/lote/ubicacion.
- `backOrders` representa faltantes derivados.
- La jerarquia de ubicaciones es `warehouses -> shelves -> rows -> segments`.
- `warehouseStructure` replica esa jerarquia como cache agregada.

## Entidades que parecen canónicas hoy
- `users/{uid}` para identidad.
- `businesses/{businessId}` para tenant root.
- `businesses/{businessId}/members/{uid}` para membresia.
- `billingAccounts/{billingAccountId}/subscriptions/{subId}` para billing/subscription.
- `businesses/{businessId}/clients/{clientId}` para cliente.
- `businesses/{businessId}/accountsReceivable/{arId}` para cuenta por cobrar.
- `businesses/{businessId}/invoicesV2/{invoiceId}` para flujo moderno de factura.
- `businesses/{businessId}/taxReceipts/{serie}` y `ncfUsage/{usageId}` para secuencia/reserva NCF.
- `businesses/{businessId}/cashCounts/{cashCountId}` para caja.
- `businesses/{businessId}/products/{productId}` para catalogo de producto.
- `businesses/{businessId}/productsStock/{stockId}` como mejor candidata a canonicidad operativa de stock.
- `businesses/{businessId}/warehouses|shelves|rows|segments` para ubicaciones.

## Entidades que parecen derivadas, cache, snapshot o legacy
- `users.accessControl` dentro del usuario: espejo operativo.
- `businesses/{businessId}.business`: nesting derivado/legacy.
- `businesses/{businessId}.subscription` y `business.business.subscription`: espejos.
- `previousInvoices/{invoiceId}`: snapshot.
- `accountsReceivablePaymentReceipt/{id}`: snapshot.
- `ncfLedger/*`: read model derivado.
- `warehouseStructure/{type}`: cache/read model.
- `client/{id}`: legacy.
- `creditLimit/{clientId}` raiz: legacy.
- `productOutflow/{id}` raiz: legacy.
- `products/{id}` raiz: legacy/config tecnica.

## Archivos base usados para esta delimitacion
- `reports/firestore-architecture-diagnosis-2026-03-12.md`
- `functions/src/app/modules/business/functions/createBusiness.js`
- `functions/src/app/versions/v2/auth/controllers/*.js`
- `functions/src/app/versions/v2/billing/services/*.js`
- `functions/src/app/versions/v2/invoice/services/*.js`
- `functions/src/app/modules/products/functions/createProduct.js`
- `src/firebase/**/*`
