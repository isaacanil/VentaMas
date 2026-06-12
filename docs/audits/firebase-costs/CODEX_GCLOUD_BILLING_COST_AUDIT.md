# Auditoria GCloud/Billing: costos reales vs riesgos Firebase

Fecha: 2026-06-11  
Repositorio: VentaMas  
Base cruzada: `CODEX_FIREBASE_COST_AUDIT.md` y `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md`  
Alcance: solo lectura. No se modifico codigo, no se desplego, no se habilitaron APIs, no se crearon recursos, no se cambiaron budgets ni IAM.

## Resumen ejecutivo

No encontre un BigQuery Billing Export accesible para convertir cada riesgo a dolares exactos por SKU. Los proyectos de VentaMas no tienen datasets de BigQuery visibles, y los sinks de Logging son solo `_Required` y `_Default`. Por eso este reporte separa:

- **Costo monetario exacto:** no disponible desde el contexto actual.
- **Costo real operativo:** confirmado con Cloud Monitoring y Cloud Logging: lecturas/escrituras Firestore, listeners activos, Cloud Run requests, billable instance time y ejecuciones de funciones.

La priorizacion cambia frente al reporte estatico:

| Rank | Hallazgo | Estado con datos cloud | Evidencia real principal | Decision |
| --- | --- | --- | --- | --- |
| 1 | `processInvoiceOutbox` | Confirmado, hallazgo adicional | Produccion reporta `204,689.914` billable instance seconds en 30 dias, el mayor valor Cloud Run observado. | Investigar primero como gasto real, aunque no venia como P0 estatico. |
| 2 | `expireAuthorizationRequests` cada 5 min | Confirmado P0 | Produccion `8,766` requests y `26,722.794` billable instance seconds en 30 dias; staging `8,802` requests. | Optimizar antes que otros crons P0 por frecuencia y costo real recurrente. |
| 3 | Listeners completos de `products` / `productsStock` (`Home`, inventario, `useGetProducts`) | Necesita metricas por hook, pero riesgo real confirmado por agregados | Produccion: `5,219,551` reads tipo QUERY, max diario `404` snapshot listeners y `34` conexiones activas. | Instrumentar `snapshot.size` por hook antes de tocar logica amplia; es el area Firestore dominante. |
| 4 | `syncProductsStockCron` | Confirmado P0, costo real medio y riesgo de cascada | Produccion `32` requests, `1,863.070` billable seconds en 30 dias; ultimos 7 dias p95 aprox `64.7s`; escribe `products` y puede alimentar Algolia. | Agregar lock/cursor/presupuesto y revisar escrituras que disparan triggers. |
| 5 | Extension Algolia sobre `products` | Confirmado, hallazgo adicional conectado | `ext-firestore-algolia-search-executeIndexOperation`: `12,058` ejecuciones en 30 dias; trigger en `businesses/{businessID}/products/{documentID}`. | Auditar writes masivos a `products` antes de optimizar solo Firestore. |
| 6 | `quantityZeroToInactivePerBusiness` | Confirmado P0 estatico, costo actual bajo | Produccion `27` requests, `245.234` billable seconds en 30 dias; logs recientes escanean `15-26` docs por coleccion. | Mantener en cola de optimizacion; no es gasto actual alto, pero sigue sin presupuesto/cursor. |
| 7 | Contabilidad/tesoreria listeners historicos | Necesita metricas | Firestore global es alto, pero Monitoring no atribuye reads a rutas. | No tocar todavia sin instrumentacion por pantalla. |
| 8 | `stockAlertsDailyDigest` | Costo bajo, error real | Produccion ultimos 7 dias: `7/7` requests con HTTP `500`; `271.328` billable seconds en 30 dias. | Corregir como desperdicio operativo, no como principal optimizacion de costo. |

## Contexto descubierto

| Item | Resultado |
| --- | --- |
| Config activa | Cuenta `pos...@gmail.com`; proyecto activo `ventamax-sta***`. |
| Proyectos Firebase del repo | `.firebaserc`: staging `ventamax-sta***`, produccion `ventamax***`. |
| Billing | Ambos proyectos de VentaMas tienen billing habilitado contra la misma cuenta abierta `018909-****-C1865D`. |
| Billing accounts visibles | 1 abierta y 1 cerrada; IDs enmascarados en este reporte. |
| BigQuery CLI | Disponible (`bq` 2.1.32). |
| BigQuery datasets | No hay datasets visibles en `ventamax-sta***`, `ventamax***` ni `nice-aegis-...`; otro proyecto accesible tiene BigQuery API deshabilitada y no se habilito. |
| Logging | Hay logs de Cloud Scheduler y Cloud Run en staging/prod; prod tambien tiene logs Cloud Functions v1. |
| Logging sinks | Solo `_Required` y `_Default`; no vi export a BigQuery desde los proyectos revisados. |
| Custom log metrics | No hay metricas de logs personalizadas. |
| Monitoring | Se consulto por REST porque el SDK local no trae `gcloud monitoring metrics`; hay metricas Firestore, Cloud Run y Cloud Functions disponibles. |

## Limitaciones

- No se pudo producir ranking por dolares reales porque no hay Billing Export accesible. Cloud Billing via `gcloud` confirma cuentas/proyectos, pero no expone costo historico por SKU.
- Puede existir un Billing Export en un proyecto no accesible por esta cuenta; no pude confirmarlo ni descartarlo globalmente.
- Las metricas Firestore agregadas no identifican pantalla, hook ni query exacta de cliente. Sirven para confirmar presion real, no para atribuir `reads` a `Home` vs `Sale` vs `Accounting`.
- Los valores `run.googleapis.com/container/billable_instance_time` se usan como proxy real de costo serverless, no como importe facturado.
- No se reproducen valores de variables de entorno, secretos, tokens, service accounts completos ni emails completos.

## Metricas reales de 30 dias

Ventana usada: `2026-05-12T00:00:00Z` a `2026-06-11T23:59:59Z`.

### Firestore

| Metrica | Staging | Produccion |
| --- | ---: | ---: |
| Document reads `QUERY` | `1,012,761` | `5,219,551` |
| Document reads `LOOKUP` | `247,749` | `1,081,444` |
| Document reads `NOT_FOUND` | `1,107` | `37,547` |
| Document writes | `51,044` | `458,118` |
| Document deletes | `226` | `477` |
| Snapshot listeners max diario | `133` | `404` |
| Active connections max diario | `17` | `34` |
| Data + index storage max | `524,103,470` bytes | `15,171,883,082` bytes |

Lectura FinOps:

- Produccion tiene ~`6.34M` document reads en 30 dias; la mayoria son `QUERY`.
- Los P0 de listeners siguen siendo relevantes porque el costo dominante de Firestore parece venir de consultas/listeners, pero falta atribucion por hook.
- Los `billable_*_units` de Firestore no devolvieron series utiles; use `document/read_count` y `document/write_count`.

### Cloud Run / Functions gen2

Top produccion por billable instance time en 30 dias:

| Servicio | Requests | Billable instance seconds |
| --- | ---: | ---: |
| `processinvoiceoutbox` | `23,107` | `204,689.914` |
| `expireauthorizationrequests` | `8,766` | `26,722.794` |
| `clientrefreshsession` | `77,649` | `22,704.503` |
| `syncrealtimepresence` | `62,237` | `8,150.135` |
| `createinvoicev2` | `17,164` | `6,439.043` |
| `syncproductnameonupdate` | `10,825` | `2,710.222` |
| `clientvalidateuser` | `747` | `2,091.675` |
| `createproduct` | `1,788` | `1,931.280` |
| `syncproductsstockcron` | `32` | `1,863.070` |

Top staging por billable instance time en 30 dias:

| Servicio | Requests | Billable instance seconds |
| --- | ---: | ---: |
| `clientgetbusinessimpersonationstatus` | `59,739` | `9,094.405` |
| `clientrefreshsession` | `14,520` | `5,451.683` |
| `expireauthorizationrequests` | `8,802` | `4,578.497` |
| `createinvoicev2` | `139` | `1,546.665` |
| `applycustomercreditnotes` | n/d top requests | `1,329.602` |
| `syncproductsstockcron` | `19` | `421.120` |

### Logs de ultimos 7 dias

Ventana usada: desde `2026-06-04T00:00:00Z`.

| Servicio | Proyecto | Requests | Status | p95 aprox | Lectura |
| --- | --- | ---: | --- | ---: | --- |
| `expireauthorizationrequests` | staging | `2,181` | `200` | `1.37s` | Frecuencia alta estable. |
| `expireauthorizationrequests` | prod | `2,184` | `200` | `4.89s` | Frecuencia alta y latencia mayor en prod. |
| `syncproductsstockcron` | staging | `8` | `200` | `22.31s` | Job diario con duracion relevante. |
| `syncproductsstockcron` | prod | `8` | `200` | `64.72s` | Job diario mucho mas pesado en prod. |
| `quantityzerotoinactiveperbusiness` | prod | `8` | `200` | `10.00s` | Escaneo actual pequeno, pero global. |
| `stockalertsdailydigest` | prod | `7` | `500` | `11.21s` | Error recurrente y costo desperdiciado. |
| `processinvoiceoutbox` | prod | `714` | `200` | `3.52s` | No falla, pero 30 dias muestra gasto muy alto. |

## Hallazgos accionables

### 1. `processInvoiceOutbox` domina el gasto real de Cloud Run

Hallazgo original: no estaba priorizado como P0 en la auditoria estatica; surge de datos reales.

Estado: **confirmado por costo operativo real**.

Evidencia exacta:

- Cloud Monitoring produccion, 30 dias: `processinvoiceoutbox` = `204,689.914` billable instance seconds, top 1 observado.
- Cloud Monitoring produccion, 30 dias: `23,107` requests.
- Cloud Logging produccion, ultimos 7 dias: `714` requests, todos HTTP `200`, p95 aprox `3.52s`.
- Serie diaria:
  - `2026-06-08`: `603.677` billable seconds.
  - `2026-06-09`: `46,815.561` billable seconds.
  - `2026-06-10`: `106,341.403` billable seconds.
  - `2026-06-11`: `33,443.600` billable seconds.
- Config actual: Cloud Function gen2 activa, Firestore trigger `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}`, timeout `60s`, max instances `20`, concurrency `80`.
- Codigo: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:149` exporta `processInvoiceOutbox` con `onDocumentCreated`.

Riesgo real:

- Es el mayor consumidor real serverless observado.
- El salto de billable time del 9 al 11 de junio no se explica solo por requests; puede indicar instancias retenidas, trabajo async prolongado, reintentos internos, cambios de carga o comportamiento posterior al evento.
- Si este patron sigue, optimizar crons P0 no atacara el gasto principal de Cloud Run.

Primera correccion recomendada:

- No cambiar codigo todavia. Primero abrir una investigacion dedicada:
  - logs por `execution_id` en `2026-06-09` a `2026-06-11`;
  - duracion por etapa interna del outbox;
  - conteo de tareas creadas por factura;
  - retries o loops de procesamiento;
  - correlacion con proveedor fiscal/electronico y timeouts.

Riesgo de romper funcionalidad:

- Alto. Es flujo de facturacion/outbox; cualquier cambio puede afectar comprobantes, compensaciones o integraciones fiscales.

Tests/validaciones necesarias:

```powershell
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="processinvoiceoutbox" AND timestamp>="2026-06-09T00:00:00Z"' --project=<PROD_PROJECT> --format=json --limit=5000
```

Agregar, en una tarea posterior, metricas internas por etapa sin registrar datos fiscales sensibles.

### 2. `expireAuthorizationRequests` es el P0 estatico con mayor costo recurrente confirmado

Hallazgo original: `expireAuthorizationRequests` barre todos los negocios cada 5 minutos.

Estado: **confirmado**.

Evidencia exacta:

- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:13`: hallazgo P0 por frecuencia alta, sin cursor ni lock.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:706-715`: `onSchedule`, `every 5 minutes`, lee todos los negocios, itera cada negocio, consulta `authorizationRequests`, filtra `pending`, limita `200` por negocio y actualiza `expired`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:52`: exporta la funcion programada.
- `functions/src/index.js:85` y `functions/src/index.js:185`: import/export en el bundle de functions.
- Cloud Scheduler prod/staging: job `firebase-schedule-expireAuthorizationRequests-us-central1`, schedule `every 5 minutes`, `ENABLED`.
- Cloud Monitoring prod, 30 dias: `8,766` requests y `26,722.794` billable instance seconds.
- Cloud Monitoring staging, 30 dias: `8,802` requests y `4,578.497` billable instance seconds.
- Cloud Logging prod, ultimos 7 dias: `2,184` requests, todos `200`, p95 aprox `4.89s`.
- stdout/stderr recientes: no hay logs utiles de documentos/negocios procesados.

Riesgo real:

- Alto y recurrente. Aunque cada ejecucion sea pequena, corre ~288 veces por dia por proyecto.
- El costo real ya aparece como top 2 de Cloud Run en produccion.
- Sin cursor/checkpoint, el costo escala con cantidad de negocios, no solo con requests vencidos.
- Sin lock visible en la validacion estatica, puede solaparse si una ejecucion se acerca al intervalo de 5 minutos.

Primera correccion recomendada:

- Pasar de barrido por negocio a query `collectionGroup` por `status == pending` y `expiresAt <= now`, con `limit` por ejecucion.
- Agregar checkpoint/continuation o particionar por ventana temporal.
- Agregar lock idempotente o lease para evitar solapes.
- Agregar logs agregados: negocios escaneados, docs leidos, docs expirados, duracion, `snapshot.size` o count de query, cursor usado.

Riesgo de romper funcionalidad:

- Medio. Cambiar la estrategia de expiracion puede dejar solicitudes pendientes si el indice/query no cubre el modelo completo o si existen formatos antiguos sin `expiresAt`.

Tests/validaciones necesarias:

- Emulador con requests vencidos/no vencidos en multiples negocios.
- Caso con mas de `limit` pendientes.
- Caso sin `expiresAt` o con fecha invalida.
- Validar indice nuevo antes de deploy.

### 3. Listeners completos de productos e inventario siguen siendo el mayor riesgo Firestore, pero requieren instrumentacion

Hallazgo original: Home/inventario montan listeners completos de `productsStock` y `products`; `useGetProducts` abre listener completo por consumidor.

Estado: **necesita metricas por hook; riesgo global confirmado**.

Evidencia exacta:

- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:11-12`: ambos hallazgos estan rankeados P0.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:309-318`: `/home` monta `Home`, llama `useListenAllActiveProductsStock` y `useInventoryProductIds`; `productStockService` consulta `productsStock` con `status == active` e `isDeleted == false`.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:326`: hay filtros server-side para `productsStock`, pero sin `limit`.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:342`: se propuso loggear `home.productsStock.active.snapshot.size`.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:124-162`: `useGetProducts` se usa en ventas, inventario, facturas y modales.
- Cloud Monitoring prod, 30 dias:
  - `5,219,551` document reads tipo `QUERY`.
  - `1,081,444` reads tipo `LOOKUP`.
  - max diario `404` snapshot listeners.
  - max diario `34` conexiones activas.
- Cloud Monitoring staging, 30 dias:
  - `1,012,761` document reads tipo `QUERY`.
  - max diario `133` snapshot listeners.

Riesgo real:

- Firestore es el componente con mayor volumen agregado.
- La evidencia cloud confirma que hay muchos reads y listeners, pero no permite atribuirlos a `Home`, `Sale`, `InventoryControl`, `Accounting` o `Treasury`.
- Optimizar sin medicion por hook puede romper flujos de venta/inventario y atacar el lugar equivocado.

Primera correccion recomendada:

- Antes de cambiar queries, agregar instrumentacion no invasiva en los listeners P0/P1:
  - `hookName`.
  - `businessId` enmascarado/hash.
  - `snapshot.size`.
  - filtros activos.
  - contador de montajes/unmounts.
  - duracion de listener.
- Prioridad de medicion:
  1. `home.productsStock.active.snapshot.size`.
  2. `useGetProducts[consumer].snapshot.size`.
  3. `inventoryControl.productsStock.raw.snapshot.size`.
  4. `accounting.*.snapshot.size`.
  5. `treasury.*.snapshot.size`.

Riesgo de romper funcionalidad:

- Alto si se cambia la fuente de datos sin mapa de consumidores. `useGetProducts` esta compartido por ventas, facturacion, inventario, compras y modales.

Tests/validaciones necesarias:

- Pruebas de venta con busqueda/productos activos/inactivos.
- Inventario con productos sin stock sintetico.
- Facturas y modales que consumen productos.
- Validar que cleanup de listeners sigue ejecutandose.

### 4. `syncProductsStockCron` tiene costo real medio, duracion alta y posible cascada a Algolia

Hallazgo original: `syncProductsStockCron` barre todos los negocios y escribe productos/stocks/batches/backorders.

Estado: **confirmado**.

Evidencia exacta:

- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:14`: P0 por barrido global y escrituras.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:568-578`: cron diario, lee `productsStock` sin `limit`, lee todos los `products`, crea promesas para batch IDs, usa BulkWriter, puede actualizar `productsStock`, `products`, crear `backOrders`, lee todos los negocios y procesa secuencialmente.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564`: exporta `onSchedule`.
- `functions/src/index.js:6` y `functions/src/index.js:310`: import/export.
- Cloud Scheduler prod/staging: job `firebase-schedule-syncProductsStockCron-us-central1`, schedule `0 3 * * *`, `ENABLED`, deadline `540s`.
- Cloud Monitoring prod, 30 dias: `32` requests, `1,863.070` billable instance seconds.
- Cloud Monitoring staging, 30 dias: `19` requests, `421.120` billable instance seconds.
- Cloud Logging prod, ultimos 7 dias: `8` requests, todos `200`, p95 aprox `64.72s`.
- Logs prod recientes: `104` stdout/stderr entries relacionadas a `stock`; muestras incluyen `productsStock sin producto asociado`, `Inventario con productId invalido` y `Finalizado`.
- Extension Algolia prod: `ext-firestore-algolia-search-executeIndexOperation` activa sobre `businesses/{businessID}/products/{documentID}`, `12,058` ejecuciones en 30 dias, `maxInstances=3000`.

Riesgo real:

- El costo directo es menor que `expireAuthorizationRequests` y `processInvoiceOutbox`, pero la duracion por ejecucion es alta.
- Al escribir `products`, puede disparar triggers/extension de Algolia. No puedo atribuir las `12,058` ejecuciones de Algolia exclusivamente a este cron, pero la ruta de cascada existe.
- Sin checkpoint/presupuesto, el costo crece con negocios, productos, stocks y batches.

Primera correccion recomendada:

- Agregar lock/lease por ejecucion.
- Agregar cursor/checkpoint por negocio o particion.
- Agregar presupuesto por ejecucion: max negocios, max docs, max writes.
- Registrar contadores agregados: negocios procesados, productsStock leidos, products leidos, batches leidos, writes por coleccion, triggers esperados.
- Revisar si las escrituras a `products` pueden evitarse cuando el valor derivado no cambio.

Riesgo de romper funcionalidad:

- Alto. Toca inventario, stock visible, backorders y potencialmente sincronizacion de busqueda.

Tests/validaciones necesarias:

- Emulador con multiples negocios y batches invalidos.
- Caso con stocks negativos/cero.
- Caso idempotente: no escribir si no hay cambios.
- Validar que Algolia no recibe writes redundantes despues de optimizar.

### 5. Extension Algolia sobre `products` es un costo real conectado a escrituras

Hallazgo original: no estaba separado como P0; aparece como efecto de arquitectura.

Estado: **confirmado**.

Evidencia exacta:

- Cloud Functions prod, 30 dias: `ext-firestore-algolia-search-executeIndexOperation` tuvo `12,058` ejecuciones.
- `gcloud functions describe` prod:
  - runtime `nodejs20`;
  - status `ACTIVE`;
  - trigger `providers/cloud.firestore/eventTypes/document.write`;
  - resource `businesses/{businessID}/products/{documentID}`;
  - max instances `3000`;
  - labels de Firebase Extension `firestore-algolia-search`.
- Cloud Run/Functions prod tambien muestra `syncproductnameonupdate` con `10,825` requests y `2,710.222` billable seconds.

Riesgo real:

- Cualquier optimizacion que reduzca writes redundantes a `products` puede ahorrar Firestore writes, Cloud Functions extension executions y costo externo de Algolia.
- Cualquier cron o trigger que actualice `products` masivamente puede amplificar costo fuera de Firestore.

Primera correccion recomendada:

- Auditar escrituras a `products` por origen antes de tocar codigo:
  - `syncProductsStockCron`;
  - `syncProductNameOnUpdate`;
  - `createProduct`;
  - ediciones manuales;
  - migraciones/dev tools.
- Agregar metrica/log por origen de write si no existe.

Riesgo de romper funcionalidad:

- Medio/alto. Cambios pueden afectar busqueda de productos y consistencia en Algolia.

Tests/validaciones necesarias:

- Crear/editar producto y confirmar indexacion.
- Confirmar que writes no-op no disparen extension.
- Validar recuento de ejecuciones antes/despues en Monitoring.

### 6. `quantityZeroToInactivePerBusiness` sigue siendo P0 por diseno, pero hoy no es gasto alto

Hallazgo original: hace collection group stream sin limite sobre `batches` y `productsStock`.

Estado: **confirmado, costo actual bajo**.

Evidencia exacta:

- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:15`: P0 por collection group stream sin limite.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:640-648`: default diario, targets `batches,productsStock`, `DRY_RUN=false`, procesa collection group, filtra `status == active`, `quantity <= 0` o `quantity == 0`, usa `q.stream()`, BulkWriter y timeout `540s`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:106`: exporta `onSchedule`.
- `functions/src/index.js:3`: exporta la funcion.
- Cloud Scheduler prod/staging: job `firebase-schedule-quantityZeroToInactivePerBusiness-us-central1`, schedule `0 1 * * *`, `ENABLED`.
- Cloud Monitoring prod, 30 dias: `27` requests, `245.234` billable instance seconds.
- Cloud Logging prod reciente:
  - `productsStock`: `scanned=24`, `eligible=1`, `scheduledUpdates=1` en `2026-06-11`.
  - `batches`: `scanned=15`, `eligible=1`, `scheduledUpdates=1` en `2026-06-11`.
  - `productsStock`: `scanned=26`, `eligible=3`, `scheduledUpdates=3` en `2026-06-09`.

Riesgo real:

- Hoy el volumen observado es pequeno.
- El riesgo sigue siendo real porque el query global no tiene presupuesto/cursor; si crece el inventario, el costo crece con toda la coleccion group.

Primera correccion recomendada:

- Mantener el rediseño en backlog, pero no desplazar a `expireAuthorizationRequests` ni `processInvoiceOutbox`.
- Agregar `limit`, cursor y checkpoint antes de que el volumen crezca.
- Mantener logs de `scanned`, `eligible`, `scheduledUpdates` porque ya son utiles.

Riesgo de romper funcionalidad:

- Medio. Cambiar a procesamiento por cursor puede retrasar inactivaciones si el presupuesto es bajo.

Tests/validaciones necesarias:

- Emulador con mas docs que el limite.
- Reanudacion desde cursor.
- Idempotencia si el job se repite.

### 7. Contabilidad y tesoreria: riesgo estatico alto, sin atribucion cloud suficiente

Hallazgo original: contabilidad/tesoreria escuchan colecciones historicas completas.

Estado: **necesita metricas**.

Evidencia exacta:

- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:432-438`: accounting workspace llama hooks que escuchan `accountingEvents`, `accountingEventProjectionDeadLetters`, `journalEntries`, `accountingPeriodClosures` sin constraints.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:476-481`: treasury escucha `cashMovements`, `internalTransfers`, `bankReconciliations`, `bankStatementLines`.
- `CODEX_FIREBASE_COST_AUDIT_VALIDATION.md:459-462` y `502-505`: se propuso loggear `snapshot.size` por coleccion.
- Cloud Monitoring solo muestra Firestore agregado; no separa estas rutas.

Riesgo real:

- Alto si las pantallas se usan con historial grande.
- No hay evidencia cloud suficiente para ponerlo encima de P0 con costo medido.

Primera correccion recomendada:

- Instrumentar `snapshot.size` por pantalla antes de reescribir queries.
- Luego aplicar ventanas server-side por `businessId`, `period`, `date`, `status`.

Riesgo de romper funcionalidad:

- Alto para reportes historicos y conciliaciones si se ocultan datos necesarios.

Tests/validaciones necesarias:

- Reportes por periodo.
- Libro diario/historico.
- Tesoreria por cuenta y fecha.
- Conciliaciones abiertas/cerradas.

### 8. `stockAlertsDailyDigest` falla en produccion y consume poco, pero es desperdicio real

Hallazgo original: no era P0 principal de costo.

Estado: **confirmado como desperdicio operativo**.

Evidencia exacta:

- Cloud Scheduler prod: `firebase-schedule-stockAlertsDailyDigest-us-central1`, schedule `50 14 * * *`, `ENABLED`, ultimo status code `13`.
- Cloud Logging prod, ultimos 7 dias: `7` requests, todos HTTP `500`.
- Cloud Monitoring prod, 30 dias: `29` requests, `271.328` billable instance seconds.

Riesgo real:

- Costo bajo, pero fallas diarias consumen tiempo y ocultan problemas de alertas.

Primera correccion recomendada:

- Revisar logs de error y configuracion de correo/recipients en una tarea separada.
- No mezclarlo con la optimizacion de Firestore.

Riesgo de romper funcionalidad:

- Medio si las alertas son operativas para stock bajo.

Tests/validaciones necesarias:

- Dry-run sin envio.
- Envio con recipient permitido.
- Caso sin recipients.

## Ranking revisado por accion

1. **Investigar `processInvoiceOutbox`** por gasto real dominante. No optimizar crons antes de entender el salto de `2026-06-09` a `2026-06-11`.
2. **Optimizar `expireAuthorizationRequests`**: collection group por `status/expiresAt`, limit, cursor y lock.
3. **Instrumentar listeners P0/P1** (`Home`, `useGetProducts`, inventario, accounting, treasury) con `snapshot.size`; despues rankear por datos de pantalla.
4. **Reducir escrituras redundantes de `products`** y medir impacto en Algolia.
5. **Agregar presupuesto/cursor a `syncProductsStockCron`**; priorizar no-op writes y cascadas.
6. **Mantener `quantityZeroToInactivePerBusiness` bajo observacion**; costo actual bajo, pero diseno no acotado.
7. **Corregir `stockAlertsDailyDigest`** como error recurrente de bajo costo.

## Comandos de lectura usados

Comandos principales ejecutados en PowerShell:

```powershell
gcloud config list
gcloud auth list
gcloud billing accounts list --format=json
gcloud billing projects describe <STAGING_PROJECT> --format=json
gcloud billing projects describe <PROD_PROJECT> --format=json
gcloud projects list --format=json
bq version
bq ls --format=json --project_id=<STAGING_PROJECT>
bq ls --format=json --project_id=<PROD_PROJECT>
gcloud logging logs list --project=<PROD_PROJECT> --format=json --limit=300
gcloud logging sinks list --project=<PROD_PROJECT> --format=json
gcloud functions list --project=<PROD_PROJECT> --format=json
gcloud run services list --project=<PROD_PROJECT> --platform=managed --format=json
gcloud scheduler jobs list --project=<PROD_PROJECT> --location=us-central1 --format=json
gcloud logging read '<filtros de Cloud Run requests/stdout/stderr>' --project=<PROD_PROJECT> --format=json --limit=5000
```

Para Monitoring use `Invoke-RestMethod` contra:

```powershell
https://monitoring.googleapis.com/v3/projects/<PROJECT>/metricDescriptors
https://monitoring.googleapis.com/v3/projects/<PROJECT>/timeSeries
```

El token se capturo en memoria con `gcloud auth print-access-token` y no se imprimio en el reporte.

## Datos que faltan para cerrar costo monetario

Para convertir este reporte a dolares reales por servicio/SKU hace falta una de estas opciones de solo lectura:

- acceso a un BigQuery Billing Export ya existente;
- acceso de Billing Account Viewer/Costs Manager suficiente para leer Cost Table/Reports exportados;
- un CSV descargado desde Billing Reports por el usuario;
- permisos a un dataset central de FinOps si existe fuera de los proyectos visibles.

No recomiendo activar Billing Export como parte de esta tarea porque el usuario pidio explicitamente no crear ni modificar recursos.
