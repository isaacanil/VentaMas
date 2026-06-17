# Investigación de costos - Fase 2

## 1. Resumen ejecutivo

`processInvoiceOutbox` sigue siendo el primer objetivo de optimización, pero la evidencia de esta segunda fase cambia la lectura: el pico del 9-11 de junio no parece venir principalmente de requests lentas ni de reintentos automáticos.

Hallazgos clave:

- El trigger productivo es Firestore `document.created` sobre `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}` en `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`.
- La configuración remota de la función indica `RETRY_POLICY_DO_NOT_RETRY`, timeout 60s, max instances 20, concurrency 80 y revisión activa `processinvoiceoutbox-00024-riq` lista desde 2026-05-22. No hay evidencia de deploy de esta función el 9, 10 u 11 de junio.
- Request logs UTC:
  - 2026-06-09: 553 requests, 552 HTTP 200, 1 HTTP 500, p95 3.207s.
  - 2026-06-10: 660 requests, todos HTTP 200, p95 3.464s.
  - 2026-06-11: 516 requests, todos HTTP 200, p95 3.534s.
- Cloud Monitoring mostró horas con miles de segundos facturables aunque hubiera muy pocas requests. Ejemplo: el 2026-06-10 a las 13:00-15:00 UTC hubo 3, 3 y 1 request por hora, pero `billable_instance_time` siguió marcando 2,696.8s, 2,090.4s y 1,716.8s.
- No aparecieron logs GISYS/e-CF entre 2026-06-09 y 2026-06-11 en `processinvoiceoutbox`; por ahora no hay evidencia de proveedor fiscal lento durante el pico.
- Los logs de aplicación están dominados por inventario y cash count:
  - `Stock de producto actualizado`: 293 / 434 / 330 por día.
  - `Batch actualizado`: 293 / 434 / 330 por día.
  - `Movimientos de inventario ajustados`: 280 / 347 / 255 por día.
  - `processInvoiceOutbox error` por cash count: 14 / 11 / 12 por día.
- `attachToCashCount` falla cuando no resuelve caja, pero `failurePolicy.service.js` lo trata como fallo no bloqueante. Esto genera ruido y trabajo extra, pero no parece causar retry automático.

Conclusión de fase: antes de cambiar lógica de facturación, recomiendo instrumentar `processInvoiceOutbox` por etapa y reducir logs por documento/producto. La causa más probable del pico es una combinación de ráfagas de tareas outbox, autoscaling/cold starts y tiempo facturable sostenido de instancias, no una latencia alta de requests ni un loop directo.

## 2. `processInvoiceOutbox`: análisis profundo

Archivo exacto:

- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`

Evento que lo dispara:

- `onDocumentCreated`
- Documento: `businesses/{businessId}/invoicesV2/{invoiceId}/outbox/{taskId}`
- Evento remoto confirmado: `google.cloud.firestore.document.v1.created`
- Retry remoto confirmado: `RETRY_POLICY_DO_NOT_RETRY`

Rutas que crean tareas outbox:

- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
  - `updateInventory`: líneas 556-584.
  - `createCanonicalInvoice`: líneas 592-613.
  - `issueElectronicTaxReceipt`: líneas 621-656, condicional al modelo e-CF.
  - `attachToCashCount`: líneas 658-681.
  - `closePreorder`: líneas 683-707, condicional.
  - `setupAR`: líneas 709-760, condicional.
  - `consumeCreditNotes`: líneas 762-798, condicional.
  - `setupInsuranceAR`: líneas 800-835, condicional.
- `functions/src/app/versions/v2/invoice/services/repairTasks.service.js`
  - `enqueueRepairTask`: líneas 353-407. Puede crear una nueva tarea outbox manual si no existe otra pendiente del mismo tipo.

Datos que lee:

- Siempre:
  - Documento de tarea outbox.
  - Documento `invoicesV2/{invoiceId}`.
- Por `updateInventory`:
  - Prerrequisitos de inventario: productos, batches, `productsStock` y settings contables.
- Por `createCanonicalInvoice`:
  - Factura canónica, cliente, settings de billing, IDs secuenciales, comisiones de servicios y datos de caja preferida.
- Por `attachToCashCount`:
  - Factura canónica.
  - `cashCounts` con `array-contains`.
  - cash count por candidatos de payload/snapshot.
  - fallback de caja abierta.
- Por `setupAR` y `setupInsuranceAR`:
  - Cuentas por cobrar existentes, prerequisitos AR, cuotas, seguro y autorización de seguro.
- Por `issueElectronicTaxReceipt`:
  - Factura `invoicesV2`.
  - Documento `businesses/{businessId}`.
  - `platformConfig/gisysFact`.
  - Configuración GISYS y payload e-CF.
- Al finalizar:
  - `outbox` pending/failed.
  - Factura canónica.
  - settings contables.
  - `ncfUsage`.
  - idempotency doc.

Datos que escribe:

- Documento outbox: `status`, `processedAt`, `attempts`, `lastError`, `result`, `updatedAt`.
- `invoicesV2/{invoiceId}`: estados, timeline, snapshot fiscal/electrónico, `frontendReadyAt`, `committedAt`.
- Factura canónica `businesses/{businessId}/invoices/{invoiceId}`.
- Inventario: productos, batches, `productsStock`, movimientos y eventos COGS cuando aplica.
- Caja: `cashCounts`, `cashMovements`.
- Cuentas por cobrar, cuotas, insurance auth.
- Credit notes y aplicaciones.
- `accountingEvents`, `ncfUsage`, idempotency.
- Si una factura queda failed con fallos bloqueantes, `attemptFinalizeInvoice` llama `scheduleCompensationsInTx`, que crea documentos en `invoicesV2/{invoiceId}/compensations`. Eso dispara otro trigger (`processInvoiceCompensation`), pero no vuelve a crear outbox.

¿Puede crear nuevas tareas outbox?

- El worker normal no crea nuevas tareas outbox.
- `attemptFinalizeInvoice` puede crear compensaciones, no outbox.
- El endpoint/servicio de reparación sí puede crear nuevas tareas outbox manuales.

¿Puede reintentarse?

- Por configuración remota, Eventarc/Functions no reintenta automáticamente (`RETRY_POLICY_DO_NOT_RETRY`).
- El código atrapa errores, marca la tarea `failed` e incrementa `attempts`; como el trigger escucha `created`, esos updates no reactivan el mismo worker.
- Reintento real existe solo si se crea un nuevo documento outbox, por ejemplo vía reparación manual.

Idempotencia:

- Rama principal: hay guard inicial `status === 'pending'` y una segunda lectura dentro de `runTransaction`. Esto mitiga duplicación de tareas ya procesadas.
- `setupAR` revisa si ya existe AR por `invoiceId` antes de crear.
- `attachToCashCount` revisa si la factura ya está en `cashCount.sales` antes de volver a agregar.
- `attemptFinalizeInvoice` sale si la factura ya está `committed` o `failed`.
- e-CF/GISYS usa idempotency key estable: `ventamas:{businessId}:{invoiceId}:ecf:{documentType}:v1`.

Riesgo de procesar la misma tarea más de una vez:

- Bajo para la rama transaccional principal.
- Condicional para `issueElectronicTaxReceipt`: el llamado externo a GISYS ocurre antes de una transacción que marque/claim la tarea. Si hubiera entrega duplicada o ejecución simultánea, dos instancias podrían llamar al proveedor antes de que una marque `done`. La idempotency key reduce riesgo fiscal si GISYS la respeta, pero no elimina costo/latencia de llamadas duplicadas.

Loops indirectos:

- No encontré loop directo outbox -> update outbox -> outbox, porque el trigger es `created`.
- No encontré trigger en repo que observe `authorizationRequests` para encadenar más funciones.
- Sí existe cadena `outbox failed bloqueante -> compensations -> processInvoiceCompensation`, pero usa otra colección.
- Las escrituras a `cashMovements` y `accountingEvents` pueden alimentar listeners frontend, no otro trigger de outbox identificado en esta pasada.

Servicios externos:

- Solo la rama `issueElectronicTaxReceipt` llama servicio externo GISYS (`fetch` en `gisysFactClient.service.js`).
- Usa `AbortController` y limpia el timeout en `finally`.
- Timeout default de config: 20,000ms, configurable por `GISYS_FACT_TIMEOUT_MS` o platform config.
- No hubo logs GISYS/e-CF en la ventana 2026-06-09 a 2026-06-11.

Promesas, concurrencia y batches:

- `loadDeps()` usa `depsPromise = Promise.all([...imports])` cacheado por instancia. No queda una cola propia.
- No hay `Promise.all` masivo dentro del worker para procesar varias tareas; procesa una tarea por invocación.
- Sí hay múltiples documentos outbox por factura, creados por el orquestador.
- Concurrencia remota: 80 requests por instancia; max 20 instancias.

Logs por etapa:

- Hay logs de error y algunos logs informativos, pero no hay telemetría estructurada completa por etapa.
- `auditTx` escribe eventos de auditoría en Firestore, no en Cloud Logging como métricas agregables baratas.
- Faltan `durationMs` por etapa (`loadDeps`, transacción, GISYS, finalize), `taskType`, `taskAgeMs`, `taskStatusBefore`, `claimOutcome`, `docCounts`, `finalOutcome`.

## 3. Explicación probable del pico del 9-11 de junio

### Requests y latencia

| Día UTC | Requests logs | HTTP 200 | HTTP 500 | avg ms | p50 ms | p95 ms | max ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2026-06-09 | 553 | 552 | 1 | 1,481 | 1,344 | 3,207 | 30,583 |
| 2026-06-10 | 660 | 660 | 0 | 1,488 | 1,307 | 3,464 | 11,022 |
| 2026-06-11 | 516 | 516 | 0 | 1,439 | 1,277 | 3,534 | 11,777 |

Lectura:

- No hay evidencia de latencia general alta.
- Solo una request devolvió HTTP 500, el 2026-06-09T18:17:03Z, con latencia reportada 0ms.
- La mayoría de errores de aplicación fueron atrapados por el worker y terminaron como HTTP 200.

### Billable instance time

Cloud Monitoring por hora, con paginación, muestra `billable_instance_time` sostenido:

| Día UTC | Suma horaria `billable_instance_time` | Requests metric sum |
|---|---:|---:|
| 2026-06-09 | 40,805.76s | 553 |
| 2026-06-10 | 83,543.87s | 658 |
| 2026-06-11 | 67,078.93s | 529 |

Ejemplos horarios llamativos:

| Hora UTC | Requests metric | Billable seconds |
|---|---:|---:|
| 2026-06-10T13:00Z | 3 | 2,696.80 |
| 2026-06-10T14:00Z | 3 | 2,090.40 |
| 2026-06-10T15:00Z | 1 | 1,716.80 |
| 2026-06-10T16:00Z | 50 | 7,259.10 |
| 2026-06-10T17:00Z | 48 | 7,240.80 |
| 2026-06-11T03:00Z | 51 | 7,244.40 |
| 2026-06-11T16:00Z | 78 | 7,540.50 |

La consulta daily-aligned de Cloud Monitoring también confirma salto vs 2026-06-08:

| Día | Billable seconds daily-aligned | Requests metric daily-aligned | Seconds/request |
|---|---:|---:|---:|
| 2026-06-08 | 602.78 | 787 | 0.77 |
| 2026-06-09 | 46,935.66 | 738 | 63.60 |
| 2026-06-10 | 106,341.40 | 726 | 146.48 |
| 2026-06-11 | 38,031.50 | 276 | 137.80 |

Nota: las ventanas daily-aligned de Monitoring no coinciden exactamente con los cortes UTC de Cloud Logging y el 2026-06-11 era día en curso. Para requests por día, usé Cloud Logging UTC; para costo, usé Cloud Monitoring como señal de magnitud y patrón.

### Errores, warnings y retries

Logs clasificados por día:

| Clase | 2026-06-09 | 2026-06-10 | 2026-06-11 |
|---|---:|---:|---:|
| `inventory_product_stock_updated` | 293 | 434 | 330 |
| `inventory_batch_updated` | 293 | 434 | 330 |
| `inventory_movements_adjusted` | 280 | 347 | 255 |
| `inventory_products_skipped_missing_ref` | 145 | 120 | 84 |
| `cash_count_candidate_unavailable` | 14 | 11 | 12 |
| `cash_count_fallback_lookup_failed` | 14 | 11 | 12 |
| `cash_count_unresolved` | 14 | 11 | 12 |
| `worker_error` | 14 | 11 | 12 |
| `cash_count_existing_link_verify_failed` | 0 | 1 | 2 |

Autoscaling/cold starts:

| Día UTC | `Starting new instance. Reason: AUTOSCALING` |
|---|---:|
| 2026-06-09 | 14 |
| 2026-06-10 | 24 |
| 2026-06-11 | 9 |

No encontré:

- Logs GISYS/e-CF en esa ventana.
- Logs de `Container called exit`, `SIGTERM` o terminación.
- Cambio remoto de revisión el 9-11 de junio.
- Retries automáticos del trigger.

Diagnóstico por hipótesis:

| Hipótesis | Estado | Evidencia |
|---|---|---|
| Más tráfico | Débil | Requests similares o menores que 2026-06-08 en daily metric; picos horarios existen, pero no explican miles de segundos con 1-3 requests. |
| Tareas más lentas | Débil | p95 se mantiene ~3.2-3.5s. |
| Reintentos automáticos | Falso para Eventarc | `RETRY_POLICY_DO_NOT_RETRY`; HTTP 200 casi total. |
| Loop directo | No confirmado | Trigger es `created`; updates no re-disparan. |
| Integración externa lenta | No confirmado | Cero logs GISYS/e-CF en la ventana. |
| Cambio de código/config productivo | No confirmado | Revisión remota activa desde 2026-05-22. |
| Cold starts/autoscaling | Factor secundario | 47 arranques por autoscaling; acompaña ráfagas, pero no explica solo el billing sostenido. |
| Instancias retenidas/tiempo facturable sostenido | Hipótesis más fuerte | Horas con muy pocas requests y miles de segundos facturables. Falta instrumentación por etapa para probar si es idle/billing behavior o trabajo no reflejado en request latency. |

## 4. Riesgos de loops, retries o duplicación

Riesgos confirmados o condicionales:

- `issueElectronicTaxReceipt` no reclama la tarea antes de llamar a GISYS. Riesgo condicional de doble llamada externa ante entrega duplicada/simultánea.
- `repairTasks.service.js` puede crear nuevas tareas outbox manuales. Tiene guard contra otra tarea pendiente del mismo tipo, pero no contra repetir una tarea ya `done` si un operador la agenda.
- `attachToCashCount` puede fallar repetidamente si se repara manualmente una factura sin caja resoluble. Hoy es no bloqueante, pero genera errores y logs.
- Los logs de inventario son por producto/batch, no agregados. Esto no explica Cloud Run billable seconds por sí solo, pero sí aumenta costo/ruido en Cloud Logging.
- El worker hace muchas escrituras por venta; cada venta puede crear 3+ tareas outbox. Esto amplifica volumen aunque la cantidad de facturas no sea alta.

Riesgos que no confirmé:

- Loop outbox directo.
- Retry automático de Eventarc.
- GISYS como causa del pico.
- Deploy/config change productivo el 9-11 de junio.

## 5. Plan seguro para corregir `processInvoiceOutbox`

No recomiendo cambiar lógica fiscal ni de facturación directamente. El plan seguro es incremental:

1. Agregar instrumentación mínima del worker.
   - Log estructurado `outbox_task_start`, `outbox_task_done`, `outbox_task_failed`.
   - Campos: `taskType`, `statusBefore`, `outcome`, `attemptsBefore`, `manualRetry`, `taskAgeMs`, `totalDurationMs`, `loadDepsMs`, `transactionMs`, `finalizeMs`, `externalProviderMs`, `businessHash`, `invoiceHash`, `taskHash`, `revision`.
   - No loggear payloads, documentos, clientes, RNC, NCF, montos ni datos fiscales.
   - Usar hashes cortos con salt local/runtime no secreto o mascarado determinístico.

2. Reclamar/lease de tarea antes de trabajo caro.
   - En transacción inicial:
     - Releer task.
     - Si `status !== 'pending'`, salir con `duplicate_skipped`.
     - Set `status: 'processing'`, `processingRunId`, `leaseExpiresAt`, `startedAt`, `attempts: increment(1)`.
   - Ejecutar trabajo.
   - Finalizar con `done` o `failed`.
   - Necesita plan de recuperación para `processing` vencido: scheduler o reparación manual controlada.
   - Aplicar primero a `issueElectronicTaxReceipt`, porque ahí está el riesgo más claro de llamada externa antes de claim.

3. Mantener idempotency fiscal.
   - No cambiar `buildGisysFactIdempotencyKey`.
   - Agregar test que dos ejecuciones simultáneas de e-CF no llamen GISYS dos veces si una ya reclamó lease.
   - Si el proveedor responde idempotente pero lento, loggear `providerMs` y status resumido.

4. Reducir logs de inventario.
   - Reemplazar logs por producto/batch por un log agregado:
     - `productsAdjustedCount`
     - `batchesAdjustedCount`
     - `skippedProductsCount`
     - `cogsLinesCount`
   - Mantener detalle solo bajo env var backend, por ejemplo `INVENTORY_DEBUG=true`.
   - Esto baja costo/ruido de Cloud Logging y facilita correlación.

5. Revisar `attachToCashCount`.
   - Como ya es no bloqueante, evaluar si debe marcar `done` con `result: { cashCountStatus: 'unresolved' }` en vez de `failed` para evitar error logs esperables.
   - No hacerlo sin validación de negocio: podría ocultar una caja mal configurada.
   - Alternativa menos riesgosa: mantener `failed`, pero bajar severidad de ciertos logs esperables a `warn` y agregar contador agregado.

6. No bajar `maxInstances` ni concurrency todavía.
   - Sería cambio de configuración productiva y podría crear backlog de eventos.
   - Primero medir duración real por tipo y cola.

Tests/validaciones necesarias:

- Unit tests en `functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js`:
  - skip si task no está `pending`.
  - claim `pending -> processing`.
  - ejecución duplicada sale sin side effects.
  - e-CF no llama GISYS si no pudo reclamar lease.
  - `failed` conserva política no bloqueante de `attachToCashCount`.
  - logs no contienen payload, RNC, cliente, NCF ni montos.
- Emulator test:
  - Crear una factura con tareas base y validar estados finales.
  - Simular dos creates/handlers sobre la misma task.
  - Simular `processing` vencido y recuperación.
- Validación en staging:
  - Comparar `outbox_task_done` por tipo vs request logs.
  - Confirmar p95 por tipo.
  - Confirmar que `issueElectronicTaxReceipt` no duplica llamadas.

## 6. Plan para optimizar `expireAuthorizationRequests`

Estado actual:

- Archivo: `functions/src/app/scheduled/expireAuthorizationRequests.ts`.
- Schedule: cada 5 minutos.
- Lee todos los negocios: `db.collection('businesses').get()`.
- Por negocio consulta `authorizationRequests` con `where('status', '==', 'pending')`, `select('expiresAt', 'expires_at')`, `limit(200)`.
- Filtra expiración en memoria.
- Escribe `status: 'expired'`.
- No usa cursor/checkpoint global.
- No tiene lease.
- Puede solaparse si una ejecución tarda más de 5 minutos.
- `Promise.allSettled(updates)` dispara updates en paralelo sin límite explícito.

Plan de query propuesta:

```ts
db.collectionGroup('authorizationRequests')
  .where('status', '==', 'pending')
  .where('expiresAt', '<=', now)
  .orderBy('expiresAt', 'asc')
  .limit(N)
```

Índice necesario:

- Falta un índice `COLLECTION_GROUP` para:
  - collection group: `authorizationRequests`
  - `status ASC`
  - `expiresAt ASC`
- Los índices existentes de `authorizationRequests` en `firestore.indexes.json` tienen `queryScope: "COLLECTION"` y cubren combinaciones con `invoiceId`, `requestedBy.uid` y `createdAt`; no cubren esta query de collection group por `expiresAt`.
- Si se decide soportar legacy `expires_at` con query separada, se requiere otro índice:
  - collection group: `authorizationRequests`
  - `status ASC`
  - `expires_at ASC`

Compatibilidad `expiresAt` vs `expires_at`:

- El cliente nuevo escribe `expiresAt` como `Timestamp` (`invoiceEditAuthorizations.ts`, `calcExpiresAt` y payload de creación).
- El cron actual todavía acepta `expires_at`.
- Una sola query por `expiresAt` no encontrará documentos legacy con solo `expires_at`.
- Plan recomendado:
  - Fase A: query nueva por `expiresAt`.
  - Fase B: query legacy separada por `expires_at` con límite menor, solo si todavía hay documentos legacy.
  - Fase C: backfill o migración controlada de `expires_at -> expiresAt` en staging antes de eliminar soporte.

Idempotencia y doble procesamiento:

- El update a `expired` es idempotente si cada doc se re-lee en transacción.
- Por cada documento:
  - Transacción lee doc.
  - Si `status !== 'pending'`, skip.
  - Si `expiresAt > now`, skip.
  - Set `status: 'expired'`, `expiredAt`, `expiredBy: 'expireAuthorizationRequests'`, `updatedAt`.
- Con esto, dos crons solapados pueden leer el mismo batch, pero solo uno cambia cada doc.

Lease/lock:

- Para esta tarea, un lock global puede ser complejidad accidental si se usa transacción por doc y límite N.
- Si se observan solapes caros, agregar documento lock:
  - `systemLocks/expireAuthorizationRequests`
  - `ownerRunId`
  - `leaseExpiresAt`
  - TTL corto, por ejemplo 4 minutos.
- No implementar lock global en la primera versión si el batch es pequeño y la transacción por doc es suficiente.

Límite real:

- Definir `N`, por ejemplo 500.
- Procesar en chunks de 100 o 250 para no crear ráfagas de writes.
- Loggear agregado:
  - `scanned`
  - `expired`
  - `skippedStatus`
  - `skippedNotExpired`
  - `errors`
  - `durationMs`
  - `limit`
  - `hasMoreLikely: scanned === limit`

Pruebas en emulador:

1. Seed de 2 negocios con `authorizationRequests` pending vencidas y no vencidas.
2. Seed con `expiresAt` Timestamp.
3. Seed con `expires_at` legacy.
4. Ejecutar handler directamente o mediante Functions emulator.
5. Validar:
   - Solo pending vencidas pasan a expired.
   - Approved/used/rejected no cambian.
   - Doble ejecución no incrementa efectos secundarios.
   - Límite N corta el batch.
   - Logs agregados no contienen datos personales.

Comandos de prueba propuestos, no ejecutados:

```powershell
npm run test:run:functions -- expireAuthorizationRequests
npm run emulators
```

## 7. Instrumentación Firestore propuesta

Objetivo: medir costo de listeners P0 sin loggear documentos ni datos sensibles. Activar solo con:

```powershell
$env:VITE_FIREBASE_COST_DEBUG = 'true'
```

Diseño:

- Crear utilidad frontend, por ejemplo `src/utils/firebaseCostDebug.ts`.
- Exportar wrapper:
  - `isFirebaseCostDebugEnabled()`
  - `hashBusinessId(businessId)`
  - `logSnapshotMetric({ hookName, consumer, route, businessId, snapshot, mountedAt, mountId })`
  - `logListenerMount(...)`
  - `logListenerUnmount(...)`
- Usar `console.info('[firebase-cost-debug]', metric)` solo si `import.meta.env.VITE_FIREBASE_COST_DEBUG === 'true'`.
- No enviar a backend en primera fase.
- No incluir docs, IDs crudos, nombres, montos, clientes ni payloads.

Campos:

- `timestamp`
- `event`: `mount`, `snapshot`, `unmount`, `error`
- `hookName`
- `consumer`
- `route`
- `businessHash`
- `mountId`
- `mountCount`
- `unmountCount`
- `listenerDurationMs`
- `snapshotSize`
- `docChangesLength`
- `queryLabel`

Puntos P0 concretos:

| Superficie | Archivo/hook | Qué medir |
|---|---|---|
| `/home` | `src/modules/home/pages/Home/components/HomeDashboard/hooks/useHomeDashboardData.tsx` | Métricas por listener delegado: invoices today/month, AR, vendorBills, productsStock, products. |
| Productos | `src/firebase/products/fbGetProducts.ts` | Listener principal `products` sin filtros server-side. Loggear `snapshot.size` y `docChanges().length`. |
| Productos con batch | `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts` | Listener `products` completo. Candidato a duplicación con `useGetProducts`. |
| productsStock por filtro | `src/firebase/products/fbGetProducts.ts` | Listeners por warehouse, filtros server-side por `location`, `isDeleted`, `status`. |
| Inventario control | `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts` | `productsStock` con `orderBy(updatedAt)` y filtro client-side; `products` completo con filtro client-side. |
| Stock home | `src/modules/inventory/hooks/useProductStock.ts` | `useListenAllActiveProductsStock` y `useInventoryProductIds`. |
| Accounting | `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts` | `accountingEvents`, `accountingEventProjectionDeadLetters`, `journalEntries`, `accountingPeriodClosures`; hoy son colección completa si `includeLedgerRecords`. |
| Treasury | `src/modules/treasury/hooks/useTreasuryWorkspace.ts` | `cashMovements`, `internalTransfers`, `bankReconciliations`, `bankStatementLines`; hoy colección completa. |

Ejemplo de log esperado:

```ts
{
  event: 'snapshot',
  hookName: 'useAccountingWorkspace',
  consumer: 'AccountingWorkspace',
  route: '/accounting',
  businessHash: 'b:8f3a21c0',
  queryLabel: 'accountingEvents:all',
  snapshotSize: 1240,
  docChangesLength: 12,
  listenerDurationMs: 84231,
  mountId: 'm:4',
  timestamp: '2026-06-11T18:00:00.000Z'
}
```

Validaciones:

- Con env var apagada, no debe emitir logs.
- Con env var encendida, no debe incluir documentos completos.
- En `/home`, abrir/cerrar pantalla y confirmar mount/unmount balanceado.
- En accounting/treasury, confirmar si hay listeners múltiples por pestañas/componentes.

## 8. Cambios que NO recomiendo hacer todavía

- No bajar `maxInstances` ni concurrency de `processInvoiceOutbox` sin medir backlog y duración por tipo.
- No cambiar lógica fiscal/e-CF ni payload GISYS sin tests de idempotencia y staging.
- No convertir todas las tareas outbox a un único worker batch todavía; subiría el blast radius de facturación.
- No crear índices en producción desde esta investigación.
- No activar Billing Export ni nuevas APIs.
- No reemplazar listeners frontend por queries paginadas hasta tener `snapshot.size` real por pantalla.
- No eliminar soporte `expires_at` hasta confirmar si quedan documentos legacy.
- No ocultar fallos `attachToCashCount` como `done` sin decisión de negocio.

## 9. Orden recomendado de implementación

1. Instrumentar `processInvoiceOutbox` por etapa y tipo de tarea.
2. Reducir logs por producto/batch de inventario a logs agregados/gated.
3. Añadir claim/lease para `issueElectronicTaxReceipt` antes de llamar GISYS.
4. Medir en staging con ventas reales controladas: duración por tipo, count por tipo, errores por tipo.
5. Revisar `attachToCashCount`: decidir si sigue como failure no bloqueante o resultado `unresolved`.
6. Implementar `expireAuthorizationRequests` con `collectionGroup`, índice en staging y transacción por doc.
7. Agregar instrumentación frontend `VITE_FIREBASE_COST_DEBUG=true`.
8. Con métricas nuevas, optimizar listeners P0 por impacto real.

## 10. Comandos/logs revisados

Comandos read-only ejecutados o equivalentes revisados:

```powershell
gcloud config list --format=json
gcloud firestore databases list --project=<prod-project> --format=json
gcloud functions describe processInvoiceOutbox --project=<prod-project> --region=us-central1 --gen2 --format=json
gcloud run services describe processinvoiceoutbox --project=<prod-project> --region=us-central1 --format=json
gcloud logging read '<request-log-filter>' --project=<prod-project> --format=json --limit=10000
gcloud logging read '<stdout-stderr-filter>' --project=<prod-project> --format=json --limit=10000
gcloud logging read '<firestore-create-outbox-audit-filter>' --project=<prod-project> --format=json --limit=10000
gcloud auth print-access-token
Invoke-RestMethod -Method Get -Uri 'https://monitoring.googleapis.com/v3/projects/<prod-project>/timeSeries?...'
git log --since='2026-06-01' --until='2026-06-12' --date=iso --pretty=format:'%h %ad %s' -- <paths>
rg -n 'processInvoiceOutbox|outbox|authorizationRequests|onSnapshot' functions src firestore.indexes.json
```

Logs revisados:

- Cloud Run request logs para `processinvoiceoutbox`, 2026-06-09 a 2026-06-11.
- Cloud Run stdout/stderr para `processinvoiceoutbox`, 2026-06-09 a 2026-06-11.
- Cloud Monitoring:
  - `run.googleapis.com/container/billable_instance_time`
  - `run.googleapis.com/request_count`
  - `run.googleapis.com/container/instance_count`
- Firestore audit logs de `CreateDocument` para outbox: sin entradas disponibles.

## 11. Limitaciones

- No consulté payloads completos de facturas ni documentos fiscales.
- No imprimí secretos ni tokens en este reporte.
- No hice deploy ni cambios de producción.
- No modifiqué IAM, budgets, APIs ni Billing Export.
- La query ideal `collectionGroup('outbox').where('createdAt', ...)` falló por falta de índice `COLLECTION_GROUP_ASC` sobre `outbox.createdAt`; no se creó el índice.
- La lectura alternativa amplia de `outbox` con `select` se cortó por timeout para evitar un barrido caro. Por eso no pude desglosar tareas outbox por tipo desde Firestore para esos días.
- Cloud Logging no tenía audit logs de Firestore `CreateDocument` para outbox en la ventana consultada.
- Las métricas de Cloud Monitoring daily-aligned y los cortes UTC de Cloud Logging no siempre cuadran exactamente; usé ambas como señales complementarias.
- Falta instrumentación de aplicación para probar si el tiempo facturable sostenido es idle/retención de instancias, trabajo background no visible en request logs, o una característica de medición/billing de Cloud Run Functions gen2.
