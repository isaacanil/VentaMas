# Firestore Entities And Relationships

Fecha: 2026-03-12
Base: `C:\Dev\VentaMas`

## Objetivo
Delimitar las entidades, sus fronteras, ownership y relaciones observadas hoy en el repo. Este documento no asume que el modelo actual este bien; delimita lo que existe y senala donde la frontera es ambigua.

## Leyenda
- `Canonica`: deberia ser la fuente principal segun el uso observado.
- `Espejo`: replica operativa o cache de otra entidad.
- `Read model`: proyeccion derivada, regenerable idealmente.
- `Legacy`: ruta o forma activa pero semanticamente dudosa.

## Fronteras del modelo

### Global
- `users/{uid}`
- `businesses/{businessId}`
- `billingAccounts/{billingAccountId}`
- `billingPlanCatalog/{planCode}`
- `sessionTokens/{tokenId}`
- `sessionLogs/{logId}`
- `businessInvites/{inviteId}`
- `businessOwnershipClaims/{claimId}`
- `devBusinessImpersonationAudit/{auditId}`
- `changelogs/{id}`
- `app/{id}`
- `rncData/{id}`
- `errors/{id}`
- `insuranceAuths/{authId}`: existe global, pero su frontera correcta parece ser de negocio.

### Tenant-scoped bajo `businesses/{businessId}`
- `members/{uid}`
- `settings/*`
- `usage/current`
- `usage/monthly/entries/{month}`
- `counters/{name}`
- `clients/{clientId}`
- `creditLimit/{clientId}`
- `accountsReceivable/{arId}`
- `accountsReceivableInstallments/{id}`
- `accountsReceivablePayments/{id}`
- `accountsReceivableInstallmentPayments/{id}`
- `accountsReceivablePaymentReceipt/{id}`
- `taxReceipts/{serie}`
- `ncfUsage/{usageId}`
- `ncfLedger/{prefix}/entries/{entryId}`
- `invoices/{invoiceId}`
- `previousInvoices/{invoiceId}`
- `invoicesV2/{invoiceId}`
- `invoicesV2/{invoiceId}/outbox/{taskId}`
- `invoicesV2/{invoiceId}/compensations/{id}`
- `creditNotes/{id}`
- `creditNoteApplications/{id}`
- `cashCounts/{cashCountId}`
- `authorizationRequests/{id}`
- `pinAuthLogs/{id}`
- `products/{productId}`
- `productsStock/{stockId}`
- `batches/{batchId}`
- `movements/{movementId}`
- `backOrders/{id}`
- `warehouses/{warehouseId}`
- `shelves/{shelfId}`
- `rows/{rowId}`
- `segments/{segmentId}`
- `warehouseStructure/{type}`
- `inventorySessions/{sessionId}`
- `inventorySessions/{sessionId}/counts/{countId}`
- `providers/{providerId}`
- `purchases/{purchaseId}`
- `expenses/{expenseId}`
- `orders/{orderId}`
- `doctors/{doctorId}`
- `productBrands/{brandId}`
- `categories/{categoryId}`
- `activeIngredients/{ingredientId}`
- `userPermissions/{uid}`

### Legacy / fuera de frontera correcta
- `client/{id}`
- `creditLimit/{clientId}` raiz
- `productOutflow/{id}` raiz
- `products/{id}` raiz

## Entidades principales

| Entidad | Ruta | Tipo | Estado observado | Ownership | Comentario |
|---|---|---|---|---|---|
| Usuario | `users/{uid}` | Canonica global para identidad | Activa | Global | Mezcla identidad con contexto de negocio y espejos |
| Negocio | `businesses/{businessId}` | Canonica tenant root | Activa | Global root | Tiene shape ambiguo root + `business` |
| Membresia | `businesses/{businessId}/members/{uid}` | Canonica tenant pivot | Activa | Negocio | Compite con `users.accessControl` |
| Billing account | `billingAccounts/{billingAccountId}` | Canonica global por owner | Activa | Global | Relaciona owners y negocios |
| Suscripcion | `billingAccounts/{acct}/subscriptions/{subId}` | Canonica probable | Activa | Billing | Se espeja en `businesses` |
| Cliente | `businesses/{businessId}/clients/{clientId}` | Canonica tenant | Activa | Negocio | Tambien hay ruta legacy `client/{id}` |
| Limite de credito | `businesses/{businessId}/creditLimit/{clientId}` | Canonica tenant | Activa | Negocio | Tambien hay ruta legacy raiz |
| Cuenta por cobrar | `businesses/{businessId}/accountsReceivable/{arId}` | Canonica tenant | Activa | Negocio | Agregado monetario |
| Cuota AR | `businesses/{businessId}/accountsReceivableInstallments/{id}` | Entidad hija | Activa | Negocio | Depende de AR |
| Pago AR | `businesses/{businessId}/accountsReceivablePayments/{id}` | Log | Activa | Negocio | Relacionado con recibos y cuotas |
| Factura legacy | `businesses/{businessId}/invoices/{invoiceId}` | Read model / canonica legacy | Activa | Negocio | Sigue siendo usada por frontend y caja |
| Factura V2 | `businesses/{businessId}/invoicesV2/{invoiceId}` | Agregado operacional | Activa | Negocio | Workflow principal del backend moderno |
| Outbox factura | `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}` | Outbox | Activa | Factura V2 | Ejecuta side effects |
| NCF receipt | `businesses/{businessId}/taxReceipts/{serie}` | Config operativa | Activa | Negocio | Legacy de secuencia |
| NCF usage | `businesses/{businessId}/ncfUsage/{usageId}` | Log / reserva | Activa | Negocio | Reserva, consume o void |
| NCF ledger | `businesses/{businessId}/ncfLedger/{prefix}/entries/{entryId}` | Read model | Activa parcial | Negocio | Deriva de facturas |
| Cuadre de caja | `businesses/{businessId}/cashCounts/{cashCountId}` | Agregado | Activa | Negocio | Guarda refs a facturas legacy |
| Producto | `businesses/{businessId}/products/{productId}` | Maestro | Activa | Negocio | No deberia ser la unica verdad de stock |
| Stock | `businesses/{businessId}/productsStock/{stockId}` | Operativa | Activa | Negocio | Mejor candidata a verdad operativa de inventario |
| Lote | `businesses/{businessId}/batches/{batchId}` | Operativa | Activa | Negocio | Cantidad duplicada con stock |
| Movimiento | `businesses/{businessId}/movements/{movementId}` | Log | Activa | Negocio | Historial de inventario |
| Back order | `businesses/{businessId}/backOrders/{id}` | Derivada | Activa | Negocio | Consecuencia de faltantes o reconciliacion |
| Ubicacion | `warehouses/shelves/rows/segments` | Canonicas normalizadas | Activas | Negocio | Jerarquia oficial deberia vivir aqui |
| Warehouse structure | `businesses/{businessId}/warehouseStructure/{type}` | Read model / cache | Activa | Negocio | Duplica jerarquia |
| Insurance auth | `insuranceAuths/{authId}` | Dudosa | Activa | Global hoy | Semantica de negocio, no global |

## Relaciones principales

### Relaciones globales
- `users/{uid}` -> `businesses/{businessId}/members/{uid}`
  Tipo: uno a muchos a traves de membresias.
  Comentario: el usuario mantiene espejo parcial en `accessControl`, `activeBusinessId`, `activeRole`.
- `billingAccounts/{billingAccountId}` -> `businesses/{businessId}`
  Tipo: uno a muchos via `businessLinks/{businessId}`.
  Comentario: el negocio tambien guarda `billingAccountId` duplicado.
- `businessInvites/{inviteId}` -> `businesses/{businessId}/members/{uid}`
  Tipo: flujo de creacion de relacion.
- `businessOwnershipClaims/{claimId}` -> `businesses/{businessId}` y `members/{uid}`
  Tipo: transferencia/confirmacion de ownership.

### Relaciones tenant-scoped
- `businesses/{businessId}` -> `members/{uid}`
  Tipo: uno a muchos.
- `businesses/{businessId}` -> `clients/{clientId}`
  Tipo: uno a muchos.
- `clients/{clientId}` -> `creditLimit/{clientId}`
  Tipo: uno a uno logico.
- `clients/{clientId}` -> `accountsReceivable/{arId}`
  Tipo: uno a muchos.
- `accountsReceivable/{arId}` -> `accountsReceivableInstallments/{id}`
  Tipo: uno a muchos.
- `accountsReceivableInstallments/{id}` -> `accountsReceivableInstallmentPayments/{id}`
  Tipo: uno a muchos.
- `accountsReceivablePayments/{id}` -> `accountsReceivablePaymentReceipt/{id}`
  Tipo: uno a uno o uno a pocos segun flujo.
- `clients/{clientId}` -> `invoices/{invoiceId}` / `invoicesV2/{invoiceId}`
  Tipo: uno a muchos por snapshot embebido, no por foreign key fuerte en todos los casos.
- `creditNotes/{id}` -> `creditNoteApplications/{id}` -> `invoices/{invoiceId}`
  Tipo: muchos a muchos resuelto por pivote/log.
- `invoicesV2/{invoiceId}` -> `outbox/{taskId}`
  Tipo: uno a muchos.
- `invoicesV2/{invoiceId}` -> `compensations/{id}`
  Tipo: uno a muchos.
- `invoices/{invoiceId}` -> `cashCounts/{cashCountId}`
  Tipo: muchos a uno via `cashCount.sales[]` con `DocumentReference`.
- `products/{productId}` -> `batches/{batchId}`
  Tipo: uno a muchos.
- `products/{productId}` -> `productsStock/{stockId}`
  Tipo: uno a muchos.
- `batches/{batchId}` -> `productsStock/{stockId}`
  Tipo: uno a muchos.
- `products/{productId}` / `batches/{batchId}` / `productsStock/{stockId}` -> `movements/{movementId}`
  Tipo: uno a muchos.
- `warehouses/{warehouseId}` -> `shelves/{shelfId}` -> `rows/{rowId}` -> `segments/{segmentId}`
  Tipo: jerarquia uno a muchos.
- `warehouseStructure/{type}` -> `warehouses/shelves/rows/segments`
  Tipo: espejo agregador.

## Relaciones ambiguas o conflictivas

| Conflicto | Rutas implicadas | Problema |
|---|---|---|
| Negocio root vs anidado | `businesses/{id}` y `businesses/{id}.business` | No hay shape unico |
| Membresia canonica vs espejo | `members/{uid}` y `users.accessControl` | Drift de roles, estados y negocio activo |
| Factura primaria vs proyeccion | `invoicesV2/{id}` y `invoices/{id}` | No esta declarada la autoridad final |
| Inventario operativo | `products.stock`, `batches.quantity`, `productsStock.quantity` | Varias verdades parciales |
| Ubicaciones canonicas vs cache | `warehouses/shelves/rows/segments` y `warehouseStructure/{type}` | Doble modelo de lectura |
| Credito tenant vs legacy | `businesses/{id}/creditLimit/{clientId}` y `creditLimit/{clientId}` | Riesgo cross-tenant |
| Cliente tenant vs legacy | `businesses/{id}/clients/{id}` y `client/{id}` | Semantica duplicada |
| Product outflow | `businesses/{id}/productOutflow/{id}` y `productOutflow/{id}` | Inconsistencia de frontera |

## Delimitacion recomendada

### Debe quedar global
- `users`
- `businesses`
- `billingAccounts`
- `billingPlanCatalog`
- `sessionTokens`
- `sessionLogs`
- `businessInvites`
- `businessOwnershipClaims`
- `devBusinessImpersonationAudit`

### Debe quedar por negocio
- Membresias, permisos y contexto operativo
- Clientes, credito, AR, credit notes y autorizaciones
- Facturacion, NCF, caja
- Inventario, productos, lotes, stock, movimientos, ubicaciones
- Configuracion operativa del negocio

### Debe considerarse derivado o eliminable
- `users.accessControl` como autoridad
- `businesses/{id}.business`
- `invoices/{id}` si `invoicesV2` queda primaria
- `warehouseStructure/{type}` si se rehace como read model regenerable
- `previousInvoices` si no hay estrategia formal de versionado

### Debe migrarse o apagarse
- `client/{id}`
- `creditLimit/{clientId}` raiz
- `productOutflow/{id}` raiz
- `products/{id}` raiz
- `insuranceAuths/{authId}` global si no hay motivo formal para mantenerlo fuera del tenant

## Decisiones que faltan
1. Declarar la entidad canonica de membresia.
2. Declarar la entidad canonica de factura.
3. Declarar la fuente primaria de inventario.
4. Declarar si `warehouseStructure` es cache o parte del dominio.
5. Declarar si `insuranceAuths` es global o tenant-scoped.

## Siguiente uso de este documento
- Usarlo como base de migraciones.
- Atar reglas Firestore a estas fronteras.
- Crear tipos canonicos compartidos por dominio.
- Revisar cada relacion conflictiva antes de tocar UI o backend.
