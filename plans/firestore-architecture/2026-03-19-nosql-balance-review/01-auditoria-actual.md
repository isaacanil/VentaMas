# Auditoria Actual

Fecha: 2026-03-19
Enfoque: equilibrio real de NoSQL en Firestore, evitando simulacion accidental de SQL.

## Alcance revisado
- `firestore.rules`
- `firestore.indexes.json`
- `functions/src/app/modules/business/functions/createBusiness.js`
- `functions/src/app/versions/v2/billing/services/subscriptionSnapshot.service.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js`
- `functions/src/app/modules/cashCount/services/cashCount.service.js`
- `functions/src/index.js`
- `src/firebase/businessInfo/fbGetBusinessInfo.ts`
- `src/firebase/users/fbGetUsers.ts`
- `src/firebase/warehouse/warehouseNestedServise.ts`
- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts`
- `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts`
- `src/firebase/accountsReceivable/fbGetCreditLimit.ts`
- `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts`
- `src/services/invoice/invoice.service.ts`
- `src/components/modals/addClient/AddClientModal.tsx`
- `src/firebase/firebaseconfig.tsx`
- `src/utils/users/normalizeFirestoreUser.ts`

## Resumen ejecutivo
- El repo ya tiene una base tenant-first razonable porque la mayor parte del dato operativo vive bajo `businesses/{businessId}/...`.
- La deuda fuerte no viene de "demasiada duplicacion", sino de duplicacion sin contrato: negocio, membresia, suscripcion, factura e inventario siguen repartidos entre rutas y formas que compiten entre si.
- El backend moderno va mejor encaminado que el frontend. `invoicesV2`, outbox, idempotencia y checks por membresia son patrones compatibles con Firestore. La UI todavia compensa parte del drift con joins manuales, listeners en cascada y normalizadores tolerantes.
- El sistema aun tiene fugas claras de modelo legacy: rutas raiz tenant-unsafe, reglas totalmente abiertas, indices no gobernados y escrituras criticas desde cliente.

## Lo que SI esta alineado con Firestore

### 1. Tenant root claro
La mayoria del dato operativo cuelga de `businesses/{businessId}`. Eso esta bien para Firestore porque:

- acota consultas por tenant,
- facilita reglas por negocio,
- y evita collection groups globales innecesarios para casi todo el dominio.

### 2. Uso valido de duplicacion documental
Hay duplicacion que si tiene sentido en NoSQL:

- snapshots de suscripcion dentro del negocio para lectura rapida,
- `snapshot` e `outbox` en `invoicesV2`,
- campos duplicados de lectura como `productName` o metadatos de factura,
- contadores y `usage/current` para evitar agregaciones costosas en caliente.

Eso no es "simular SQL". Eso es modelar para lectura rapida, que es correcto en Firestore, siempre que exista una autoridad clara.

### 3. Backend con ownership mas fuerte
El flujo moderno de factura muestra una direccion mas sana:

- `invoicesV2` como agregado operacional,
- outbox para side effects,
- idempotencia,
- reserva de NCF del lado servidor,
- control por `members/{uid}` en varios controladores v2.

Ese patron se acerca mas al uso correcto de Firestore que muchos flujos legacy del cliente.

## Donde hoy se esta simulando SQL o introduciendo complejidad accidental

### 1. Una misma entidad sigue viviendo en varias formas
El problema no es solo duplicar. El problema es duplicar sin declarar cual ruta manda.

Casos visibles:

- Negocio en `businesses/{id}` y tambien en `businesses/{id}.business`, mientras el frontend incluso soporta `business.business`.
- Suscripcion en `billingAccounts/{acct}/subscriptions/{subId}` y tambien en `businesses/{id}.subscription` y `businesses/{id}.business.subscription`.
- Membresia en `businesses/{id}/members/{uid}` y tambien en `users.accessControl`.
- Factura en `invoicesV2` y en `invoices`.
- Inventario repartido entre `products.stock`, `productsStock.quantity`, `batches.quantity` y `backOrders`.

Esto genera el peor escenario posible para NoSQL: duplicacion sin autoridad.

### 2. El frontend reconstruye relaciones con joins manuales
Hay varios puntos donde la app compensa el modelo como si Firestore fuera SQL:

- `src/firebase/users/fbGetUsers.ts` escucha `members` y luego abre queries chunked a `users` por `documentId() in`.
- `src/firebase/accountsReceivable/dueDatesReceivable.repository.ts` reconstruye AR, clientes e invoices por lotes para armar una vista.
- `src/services/invoice/invoice.service.ts` hace polling de `invoicesV2` y luego vuelve a leer `invoices`.
- `src/firebase/warehouse/warehouseNestedServise.ts` arma la jerarquia con listeners por warehouse, shelf, row y stock.

Eso no significa que falte normalizacion. Significa que faltan read models o documentos de pantalla mejor pensados.

### 3. Persisten rutas raiz que rompen el limite del tenant
Siguen activas escrituras o lecturas sobre rutas globales para datos que semanticamente son del negocio:

- `client/{id}`
- `creditLimit/{clientId}`
- `productOutflow/{id}`
- `products/6dssod`

Esto rompe dos cosas:

- el aislamiento natural del tenant,
- y la capacidad de endurecer reglas sin excepciones historicas.

### 4. Aun existen escrituras criticas desde cliente
Hay operaciones que deberian ser cien por ciento server-side:

- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts` hace read-calculate-write sin transaccion,
- `src/firebase/accountsReceivable/fbUpdateCreditLimit.ts` actualiza la ruta legacy raiz,
- varias lecturas realtime estan envueltas como promesas one-shot sin ciclo de vida limpio, por ejemplo `fbGetCreditLimit`.

Cuando el cliente coordina escrituras multi-documento o reservas sensibles, Firestore deja de ser rapido y predecible y pasa a depender de suerte de concurrencia.

### 5. Existen documentos calientes y arrays crecientes
Hay varios documentos que crecen o concentran escrituras:

- `cashCount.sales[]`,
- `cashCount.stateHistory[]`,
- `warehouseStructure/{type}`,
- arrays dentro de algunos read models de factura y NCF.

Firestore premia documentos chicos y ownership simple. Estos patrones van en la direccion contraria.

## Evaluacion por dominio

### Negocio y membresia
Estado actual:

- `members/{uid}` ya aparece como autoridad operativa en gran parte del backend v2.
- `users.accessControl` sigue vivo como espejo y el frontend normaliza `activeRole`, `businessID` y otros aliases para sobrevivir.
- `businesses/{id}` todavia no esta aplanado.

Lectura NoSQL correcta:

- `businesses/{id}` plano para metadata base,
- `members/{uid}` como autoridad de acceso,
- `users/{uid}` solo para identidad global y preferencias personales.

Juicio:
- buen rumbo en backend,
- contrato aun incompleto,
- espejo legacy todavia demasiado influyente.

### Billing y suscripcion
Estado actual:

- La autoridad real parece vivir en `billingAccounts/{acct}/subscriptions/{subId}`.
- El negocio guarda snapshots para lectura rapida.

Lectura NoSQL correcta:

- mantener el snapshot en negocio esta bien,
- pero como read model explicito, no como fuente competidora.

Juicio:
- dominio compatible con Firestore,
- falta declarar que el mirror del negocio es solo lectura derivada.

### Facturacion
Estado actual:

- `invoicesV2` es el workflow serio.
- `invoices` sigue siendo necesario para partes del frontend y caja.
- la UI espera confirmacion con polling y doble lectura.

Lectura NoSQL correcta:

- elegir una fuente primaria,
- proyectar una vista secundaria para compatibilidad,
- evitar que la pantalla tenga que decidir entre dos rutas.

Juicio:
- buena arquitectura interna en V2,
- mala resolucion de convivencia con el legado.

### Inventario
Estado actual:

- el cron `syncProductsStockCron` recalcula `products.stock` desde `productsStock`,
- corrige negativos,
- repara batches,
- crea backOrders por diferencias.

La propia implementacion ya delata cual es la verdad operativa mas fuerte: `productsStock`.

Lectura NoSQL correcta:

- `productsStock` como verdad operacional por ubicacion y lote,
- `products.stock` como agregado de lectura,
- `batches.quantity` como derivado o solo mantenido server-side.

Juicio:
- el dominio ya muestra cual deberia ser la autoridad,
- pero el contrato todavia no esta explicitado,
- por eso existen crons de reparacion.

### Clientes y cuentas por cobrar
Estado actual:

- el modelo tenant-scoped existe,
- pero sobreviven rutas raiz legacy y joins cliente para recomponer pantallas.

Lectura NoSQL correcta:

- `clients/{clientId}` y `creditLimit/{clientId}` solo bajo negocio,
- AR con snapshots minimos del cliente si la pantalla lo necesita,
- vistas listas para pantalla cuando haya joins repetidos.

Juicio:
- dominio razonable,
- contaminado por restos legacy y lectura demasiado ensamblada del lado cliente.

### Ubicaciones e inventario visual
Estado actual:

- la jerarquia vive en colecciones separadas,
- la UI la recompone con listeners en cascada,
- y ademas existe `warehouseStructure/{type}` como cache agregado.

Lectura NoSQL correcta:

- o se lee directo desde la jerarquia normalizada con una estrategia mas acotada,
- o se materializa una vista derivada por pantalla con ownership claro.

Juicio:
- hoy conviven dos soluciones parciales,
- ninguna esta formalizada como la oficial.

## Hallazgos prioritarios

### Alta prioridad
1. `firestore.rules` sigue abierto a cualquier usuario autenticado.
2. El shape de negocio sigue ambiguo: root + `business`.
3. Membresia canonicamente mejora en backend, pero `users.accessControl` sigue siendo espejo activo.
4. La dualidad `invoicesV2` vs `invoices` sigue sin resolverse.
5. Inventario sigue reparandose por cron, senal de autoridad incompleta.
6. Persisten rutas raiz tenant-unsafe para datos de negocio.
7. `fbGetAndUpdateTaxReceipt` sigue permitiendo colisiones por concurrencia.

### Prioridad media
1. `firestore.indexes.json` no muestra gobierno real del patron de queries.
2. `warehouseNestedServise.ts` hace fan-out de listeners costoso.
3. `fbGetCreditLimit` mezcla listener realtime con API tipo Promise.
4. `cashCount.sales[]` sigue creciendo en un documento caliente.

## Decision arquitectonica recomendada

### Mantener
- `businesses/{businessId}/...` como frontera tenant principal.
- `members/{uid}` como autoridad de acceso.
- `billingAccounts/.../subscriptions/...` como fuente primaria de billing.
- `invoicesV2` como agregado operacional.
- `productsStock` como mejor candidato a fuente operativa de inventario.

### Congelar
- nuevas escrituras a `client`, `creditLimit`, `productOutflow` raiz y `products/6dssod`,
- nuevas dependencias de `users.accessControl` como autoridad,
- nuevas pantallas que necesiten reconstruir datos con joins cliente.

### Migrar
- negocio root + `business` hacia shape plano,
- `invoices` hacia read model explicito,
- `products.stock` y `batches.quantity` hacia derivados declarados,
- `warehouseStructure` hacia vista derivada medible o eliminarlo.

## Conclusiones
La base actual no esta "mal por duplicar". Esta mal porque mezcla tres tipos de dato sin frontera clara:

- dato canonico,
- espejo de lectura,
- y compatibilidad legacy.

La mejora no pasa por normalizar mas. Pasa por declarar mejor:

- una autoridad por agregado,
- una razon valida para cada duplicacion,
- y una superficie de lectura que no obligue al cliente a simular joins.
