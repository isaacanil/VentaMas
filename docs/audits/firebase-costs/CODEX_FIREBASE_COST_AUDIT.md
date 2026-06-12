# Auditoria profunda: Firebase, costos y consumo de recursos

Fecha: 2026-06-11  
Repositorio: `C:\Dev\VentaMas`  
Alcance: analisis estatico del repositorio. No se consultaron servicios remotos, no se desplego, no se ejecuto Firebase CLI contra proyectos y no se modifico codigo funcional.

## 1. Resumen ejecutivo

Nivel general de riesgo: **Alto**.

No encontre evidencia estatica de secretos expuestos, loops infinitos confirmados, despliegues automaticos peligrosos ni endpoints publicos sin autenticacion en los flujos criticos revisados. Si encontre varios patrones que pueden disparar costos y latencia cuando crezcan negocios, productos, stock, historiales contables o usuarios conectados:

1. Listeners en tiempo real sin ventana ni paginacion sobre colecciones centrales: `products`, `productsStock`, `accountingEvents`, `journalEntries`, `cashMovements`, `bankStatementLines`.
2. Jobs programados globales que recorren todos los negocios o collection groups, algunos diariamente y uno cada 5 minutos.
3. Herramientas de sincronizacion/migracion dentro de `src/` capaces de enumerar negocios y escribir muchas filas si se invocan desde el cliente.
4. Storage permite cargas y borrados amplios por miembros del negocio, con limite de 25 MB por objeto pero sin optimizacion consistente en imagenes de producto/compra/logo.
5. Las reglas de Firestore/Storage hacen `get()`/`exists()` para validar usuario/miembro/negocio en rutas de alto trafico; esto no es necesariamente una lectura cobrada por cada helper repetido porque Rules puede cachear accesos al mismo path, pero si agrega dependencia de lecturas de reglas y complejidad a listeners amplios.

Areas preocupantes:

- Inventario y catalogo: muchas pantallas leen todo y filtran en memoria.
- Contabilidad y tesoreria: workspaces con listeners de ledger completo.
- Cloud Functions programadas: varios jobs de mantenimiento recorren todos los tenants.
- Storage de imagenes: uploads client-side con controles inconsistentes.
- Reglas: buen bloqueo en finanzas/RRHH, pero superficie amplia de escritura cliente en inventario/catalogo.

Optimizar primero:

1. Acotar listeners de inventario/productos por pagina, busqueda, estado, fecha o warehouse.
2. Convertir crons globales a jobs paginados con cursor, limite por ejecucion y reanudacion.
3. Mover herramientas masivas de `src/` a callable/admin-only o eliminar su acceso desde bundles cliente.
4. Definir ventanas por fecha en contabilidad/tesoreria.
5. Normalizar uploads con compresion, limite local y metadata/cache por tipo de asset.

## 2. Mapa de uso Firebase

### Configuracion y proyectos

| Area | Archivo | Observacion |
| --- | --- | --- |
| Firebase app web | `src/firebase/firebaseconfig.tsx:1` | Inicializa Auth, Firestore, Storage, Functions, RTDB opcional, Remote Config y App Check si existe `VITE_FIREBASE_APPCHECK_SITE_KEY`. |
| Firestore cache | `src/firebase/firebaseconfig.tsx:101` | Usa `persistentLocalCache` en produccion con multiple tabs; positivo para reducir lecturas repetidas locales. |
| Remote Config | `src/firebase/firebaseconfig.tsx:149` | Fetch lazy con intervalo minimo: 60s dev, 1h prod por defecto. |
| Hosting | `firebase.json:1` | Targets prod/staging, `dist`, headers de cache para assets y `index.html` no-cache. |
| Rules | `firestore.rules:1`, `storage.rules:1` | Reglas extensas multi-tenant con helpers de usuario, negocio y membresia. |
| Indexes | `firestore.indexes.json:1` | 70 indices compuestos y TTL para `expiresAt` en items de seeding AI y tokens de sesion. |
| Functions | `functions/src/index.js:1` | Superficie autoritativa de exports; mezcla triggers, callables, HTTP y crons. |

### Conteo estatico de APIs Firebase en `src/`

Conteo bruto por `rg`, excluyendo tests. No representa lecturas reales, solo superficie de uso:

| API | Conteo aproximado | Riesgo principal |
| --- | ---: | --- |
| `onSnapshot` | 318 | Listeners persistentes y costos por cambios. |
| `getDocs` | 237 | Reads masivos o no paginados. |
| `getDoc` | 440 | N+1 y enriquecimiento por documento. |
| `setDoc` | 149 | Escrituras directas cliente. |
| `updateDoc` | 170 | Escrituras directas cliente. |
| `writeBatch` | 128 | Operaciones masivas cliente/admin. |
| `runTransaction` | 90 | Contencion y retries. |
| `httpsCallable` | 134 | Superficie callable amplia. |
| `uploadBytes` | 12 | Cargas Storage client-side. |
| `getDownloadURL` | 19 | Egress y dependencia de objetos. |
| `listAll` | 9 | Listados Storage no paginados. |

## 3. Hallazgos criticos

No confirme una severidad **Critica inmediata** como secreto expuesto, regla publica de escritura global, trigger autorecursivo sin guardas o endpoint financiero sin autenticacion. Los siguientes hallazgos son criticos para escalabilidad/costo porque pueden convertirse en incidentes de costo o latencia con crecimiento normal de datos.

### C-001 - Lecturas en tiempo real sin ventana sobre colecciones centrales

Severidad: **Alta, potencialmente critica al escalar**  
Estado: confirmado por codigo.

Descripcion:

Varias pantallas escuchan colecciones completas y luego filtran/ordenan en memoria. Esto multiplica lecturas iniciales, lecturas por cambios, memoria del cliente y renders. El riesgo aumenta cuando un negocio acumula miles de productos, stocks, eventos contables o movimientos.

Archivos afectados:

- `src/firebase/products/fbGetProducts.ts:596`: `useGetProducts` abre `onSnapshot(query(productsRef))` para todos los productos.
- `src/hooks/products/useGetProductsWithBatch.ts:37`: listener de todos los productos con lote.
- `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:52`: listener de `productsStock` ordenado por `updatedAt` sin `limit`.
- `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:91`: listener de todos los `products`.
- `src/firebase/warehouse/productStockService.ts:472`: listener de stocks activos sin limite.
- `src/firebase/warehouse/productStockService.ts:500`: listener de productos del negocio sin limite.

Por que sube el costo:

- Cada apertura de pantalla descarga el conjunto completo.
- Cada cambio en cualquier documento escuchado genera eventos aunque el usuario solo necesite una parte.
- Los filtros client-side no reducen lecturas cobradas.
- Si varias pantallas montan listeners similares, el mismo dataset puede leerse varias veces.

Como confirmarlo:

- Medir reads al abrir `/app/inventory` y pantallas de venta/catalogo en Emulator Suite o Firebase Usage.
- Agregar logging local de `snapshot.size` y duracion por listener durante QA.
- Revisar React Profiler para renders causados por cambios masivos.

Fix recomendado:

- Usar ventanas por `limit`, `startAfter`, busqueda y filtros server-side.
- Separar consultas por caso de uso: listado, selector, detalle, busqueda.
- Mantener listeners solo para datos realmente vivos; usar `getDocs` paginado para historicos.
- Crear indice/consulta por `status`, `isDeleted`, `warehouseId`, `updatedAt` segun pantalla.

### C-002 - Jobs programados globales con barrido de tenants/collection groups

Severidad: **Alta, potencialmente critica al escalar**  
Estado: confirmado por codigo.

Descripcion:

Hay Cloud Functions programadas que recorren todos los negocios o collection groups completos. Algunas tienen limites por query, pero el patron general es global y recurrente. Si crece el numero de negocios o documentos, estos jobs concentran lecturas, escrituras, memoria y tiempo de ejecucion.

Archivos afectados:

- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:591`: lee todos los negocios y sincroniza inventario por negocio.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:63`: collection group scan sobre `batches` y `productsStock`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:58`: cada 5 minutos lee todos los negocios y revisa autorizaciones pendientes.
- `functions/src/app/billing/billingMaintenanceCron.js:48`: reconciliacion diaria lee todos los negocios.
- `functions/src/app/billing/billingMaintenanceCron.js:100`: reset mensual lee todos los negocios y escribe mirrors.
- `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:143`: lee todos los negocios y reconcilia AR/clientes.

Por que sube el costo:

- El costo crece con todos los tenants, aunque solo algunos tengan actividad.
- Los crons pueden solaparse si una ejecucion se acerca al timeout.
- Los collection group scans pueden tocar muchos shards logicos.
- Las escrituras derivadas amplifican costos e invocan triggers adicionales.

Como confirmarlo:

- Revisar Cloud Logging por duracion, read count estimado, memoria y timeout.
- Medir numero de negocios procesados y documentos tocados por ejecucion.
- Simular con emulador y datasets grandes antes de activar cambios.

Fix recomendado:

- Procesar por cursor y limite por ejecucion.
- Usar colas o task documents por negocio activo.
- Ejecutar solo tenants con cambios pendientes.
- Guardar checkpoints (`lastProcessedBusinessId`, `lastRunAt`, `nextCursor`).
- Definir presupuesto por job: max negocios, max docs, max writes.

### C-003 - Herramientas masivas en bundle cliente con capacidad de enumerar y escribir

Severidad: **Alta, potencialmente critica si se expone en UI no dev**  
Estado: confirmado por codigo; exposicion final debe verificarse en rutas/build.

Descripcion:

Existen servicios/herramientas en `src/` que pueden leer todos los negocios, recorrer inventario y escribir correcciones. Aunque sean utiles para migraciones, vivir en el bundle cliente aumenta el riesgo de ejecucion accidental, costos masivos o abuso por usuarios con permisos amplios.

Archivos afectados:

- `src/firebase/warehouse/stockSyncService.ts:143`: lee todos los `productsStock` activos.
- `src/firebase/warehouse/stockSyncService.ts:201`: `syncAllBusinessesProductsStock` puede leer todos los negocios si no recibe `businessIds`.
- `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:58`: si no recibe negocios, lee todos.
- `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:71`: recorre sesiones y subcolecciones de conteos.
- `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:144`: escribe batches si `dryRun` es falso.

Por que sube el costo:

- Enumeracion global desde cliente.
- Multiples queries y escrituras por negocio/producto/sesion.
- Riesgo de repetir procesos manuales sin idempotencia operacional centralizada.

Como confirmarlo:

- Buscar imports reales de estas herramientas en rutas de UI.
- Inspeccionar bundle para confirmar si se incluyen en produccion.
- Verificar permisos/rules requeridos para ejecutar escrituras masivas.

Fix recomendado:

- Mover migraciones a `functions/` como callable admin-only o script offline.
- Requerir `dryRun` por defecto y confirmacion explicita.
- Eliminar imports desde UI productiva.
- Registrar auditoria y limites por ejecucion.

## 4. Hallazgos high

### H-001 - Contabilidad y tesoreria escuchan ledgers completos

Severidad: **Alta**  
Estado: confirmado por codigo.

Descripcion:

Los workspaces de contabilidad y tesoreria abren listeners completos para colecciones historicas. Son datos que crecen indefinidamente y normalmente no necesitan realtime global.

Archivos afectados:

- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:167`: `accountingEvents`.
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:210`: `accountingEventProjectionDeadLetters`.
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:256`: `journalEntries`.
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:295`: `accountingPeriodClosures`.
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts:156`: `cashMovements`.
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts:191`: `internalTransfers`.
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts:226`: `bankReconciliations`.
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts:266`: `bankStatementLines`.

Por que sube el costo:

- Historial financiero crece mes a mes.
- Cada cambio contable notifica a todos los clientes con workspace abierto.
- Ordenar/filtrar en memoria traslada costo al cliente.

Fix recomendado:

- Ventanas por periodo fiscal, mes, estado y cuenta.
- Listener solo para items recientes o pendientes.
- Historico por `getDocs` paginado.
- Agregar resumenes materializados para dashboard.

### H-002 - Gestion de usuarios multiplica listeners por miembros y presencia

Severidad: **Alta/Media**  
Estado: confirmado por codigo.

Descripcion:

La pantalla de usuarios combina listener del negocio, listener de miembros, listeners por chunks de usuarios y un listener RTDB por usuario para presencia.

Archivos afectados:

- `src/modules/settings/pages/setting/subPage/Users/hooks/useUserListData.ts:110`: listener de business doc.
- `src/modules/settings/pages/setting/subPage/Users/hooks/useUserListData.ts:233`: `onValue(ref(rtdb, presence/${uid}))` por usuario.
- `src/firebase/users/fbGetUsers.ts:224`: listener de `businesses/{businessId}/members`.
- `src/firebase/users/fbGetUsers.ts:262`: listeners de `/users` por chunks de 30 IDs.

Por que sube el costo:

- Escala lineal con cantidad de usuarios.
- RTDB mantiene conexiones/listeners por usuario listado.
- Abrir la pantalla puede activar N listeners aunque solo se vea una pagina.

Fix recomendado:

- Paginacion de miembros.
- Presencia solo para usuarios visibles en la pagina actual.
- Agregacion de presencia en un documento resumido si se requiere vista global.

### H-003 - Triggers de denormalizacion con fan-out en catalogo/inventario

Severidad: **Alta**  
Estado: confirmado por codigo.

Descripcion:

Cambios en nombre/categoria/marca/ingrediente disparan actualizaciones masivas en productos, stocks, lotes, movimientos o backorders. Es una estrategia valida de denormalizacion, pero cada cambio administrativo puede fanoutear a muchos documentos.

Archivos afectados:

- `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:71`: stream por colecciones relacionadas y bulk update.
- `functions/src/app/modules/Inventory/functions/syncCategoryOnUpdate.js:60`: actualiza productos por categoria.
- `functions/src/app/modules/Inventory/functions/syncProductBrandOnUpdate.js:59`: actualiza productos por `brandId`.
- `functions/src/app/modules/Inventory/functions/syncActiveIngredientOnUpdate.js:53`: actualiza productos por ingrediente activo.

Por que sube el costo:

- Una edicion administrativa puede tocar cientos o miles de documentos.
- Escrituras derivadas pueden disparar otros listeners abiertos en clientes.
- BulkWriter reduce riesgo tecnico, pero no elimina costo.

Fix recomendado:

- Confirmar que cada trigger corre solo cuando el campo relevante cambia.
- Agregar metricas por cantidad de documentos actualizados.
- Para datasets grandes, migrar a job asincrono con cursor y progreso.

### H-004 - Reportes DGII hacen consultas mensuales completas y enriquecimientos N+1

Severidad: **Alta/Media**  
Estado: confirmado por codigo.

Descripcion:

Los reportes fiscales mensuales consultan colecciones por rango de fecha y luego enriquecen proveedores, compras o facturas con `doc().get()` por referencia. Es aceptable para volumen bajo, pero costoso en meses grandes.

Archivos afectados:

- `functions/src/app/modules/dgii/services/dgii606MonthlyReport.service.js:122`: tres consultas por campos de fecha para gastos.
- `functions/src/app/modules/dgii/services/dgii606MonthlyReport.service.js:815`: enriquecimiento de proveedores N+1.
- `functions/src/app/modules/dgii/services/dgii606MonthlyReport.service.js:883`: carga de compras vinculadas N+1.
- `functions/src/app/modules/dgii/services/dgii606MonthlyReport.service.js:1044`: consultas mensuales de compras/gastos/pagos AP.
- `functions/src/app/modules/dgii/services/dgii607MonthlyReport.service.js:568`: enriquecimiento de NCF de factura N+1.
- `functions/src/app/modules/dgii/services/dgii607MonthlyReport.service.js:642`: carga de facturas vinculadas N+1.
- `functions/src/app/modules/dgii/services/dgii607MonthlyReport.service.js:711`: consultas mensuales de facturas/notas/retenciones.

Por que sube el costo:

- El usuario puede ejecutar reportes grandes bajo demanda.
- Cada enriquecimiento individual suma reads.
- Reruns del mismo mes no parecen cachear resultado materializado.

Fix recomendado:

- Cachear reportes por negocio/periodo/hash de entrada.
- Cargar referencias en batches con deduplicacion.
- Guardar snapshots fiscales al momento de registrar documentos.

### H-005 - Superficie amplia de escritura cliente en inventario/catalogo

Severidad: **Alta/Media**  
Estado: confirmado por reglas.

Descripcion:

Las reglas bloquean correctamente escrituras directas en varias colecciones financieras/RRHH, pero mantienen escritura cliente para muchos documentos de catalogo, inventario y operaciones. Esto puede ser deseado por la arquitectura actual, pero cualquier bug de cliente en esos paths puede generar escrituras masivas.

Archivos afectados:

- `firestore.rules:728`: `products/{document=**}` read/write con acceso de negocio.
- `firestore.rules:748`: `warehouses`.
- `firestore.rules:769`: `batches`.
- `firestore.rules:775`: `productsStock`.
- `firestore.rules:778`: `movements`.
- `firestore.rules:781`: `inventorySessions`.
- `firestore.rules:826`: `expenses`.
- `firestore.rules:841`: `userPermissions`.

Por que sube el costo:

- Escrituras cliente de alto volumen pueden amplificar triggers/listeners.
- Validacion de forma/cotas parece vivir mas en cliente/servicios que en reglas.

Fix recomendado:

- Definir invariantes minimas en rules para paths de alto impacto.
- Mover operaciones masivas a callables con limites y auditoria.
- Separar permisos de lectura, escritura puntual y escritura masiva.

### H-006 - Storage de negocio permite upload/delete amplio por miembro

Severidad: **Alta/Media**  
Estado: confirmado por reglas y clientes.

Descripcion:

Los miembros con acceso al negocio pueden leer, escribir y borrar objetos bajo `businesses/{businessId}/...`. Las reglas limitan tipo y tamano maximo a 25 MB, pero no distinguen carpetas sensibles ni aplican ownership por asset.

Archivos afectados:

- `storage.rules:80`: validacion de upload de negocio.
- `storage.rules:113`: read/write/delete por `hasBusinessAccess`.
- `src/firebase/img/fbUploadFileAndGetURL.ts:58`: validacion local solo si el caller pasa opciones.
- `src/firebase/products/productsImg/fbAddProductImg.ts:19`: upload de imagen de producto sin compresion/tamano local.
- `src/firebase/purchase/addPurchaseImg.ts:20`: valida tipo, no tamano ni compresion.
- `src/firebase/businessInfo/fbAddBusinessInfo.ts:126`: upload de logo directo.

Por que sube el costo:

- Objetos grandes incrementan almacenamiento y egress.
- Borrados accidentales por cualquier miembro con acceso afectan disponibilidad.
- Sin thumbnails, pantallas pueden descargar imagenes mas pesadas de lo necesario.

Fix recomendado:

- Reglas por subruta: logos, productos, compras, firmas, reportes.
- Limites mas bajos por tipo de asset.
- Compresion obligatoria en cliente antes de upload.
- Thumbnails o variantes optimizadas.
- Soft-delete/admin-only para rutas criticas.

## 5. Hallazgos medium/low

| ID | Severidad | Hallazgo | Evidencia | Recomendacion |
| --- | --- | --- | --- | --- |
| M-001 | Media | `stockAlertsOnWrite` lee settings por cada cambio de cantidad y puede enviar email/escribir alertas. Tiene guarda contra self-loop porque sale si quantity no cambio. | `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:87`, `:101`, `:230` | Cachear settings por negocio en memoria durante instancia o denormalizar flags minimos. |
| M-002 | Media | Reporte de actividad de usuario ejecuta 5 queries paralelas con `limit(100)`. Esta acotado, pero puede ser costoso si se abre mucho. | `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserRealActivity.ts:92` | Mantener lazy/on-demand y agregar cache por usuario/ventana. |
| M-003 | Media | `hrCommissionPeriods` esta bastante acotado, pero lineas/entries por periodo no tienen `limit`; un periodo grande puede cargar mucho. | `src/firebase/hrPayroll/useHrCommissionPeriods.ts:1290`, `:1356` | Paginacion dentro del periodo o resumen por corte. |
| M-004 | Media | Imagen de login usa `listAll` de Storage. Es pequeno hoy, pero `listAll` no es ideal para crecimiento. | `src/modules/auth/repositories/authBackgroundImage.repository.ts:7`, `src/modules/controlPanel/AppConfig/LoginImageConfig.tsx:80` | Guardar URL activa en Firestore/Remote Config y evitar listar. |
| M-005 | Media | Indice de `productsStock` contiene campo `isDelete`, posiblemente typo de `isDeleted`; puede ser indice inutil y missing intended index. | `firestore.indexes.json:1234` | Confirmar si existe campo real; eliminar o corregir indice. |
| M-006 | Baja | No se encontro uso de `offset()` de Firestore; el unico `offset(10)` es de UI flotante. | `src/modules/inventory/components/InventoryLocationSelector.tsx` | Sin accion de costo Firestore. |
| M-007 | Baja | Hosting tiene headers de cache correctos para assets e index. | `firebase.json` | Mantener al agregar rutas/assets nuevos. |
| M-008 | Baja | App Check esta soportado pero depende de env var. | `src/firebase/firebaseconfig.tsx:45` | Verificar que staging/prod tengan `VITE_FIREBASE_APPCHECK_SITE_KEY`. |

## 6. Queries/listeners sospechosos

| Prioridad | Tipo | Archivo | Patron | Riesgo | Fix sugerido |
| --- | --- | --- | --- | --- | --- |
| P0 | Listener | `src/firebase/products/fbGetProducts.ts:596` | Todos los productos en realtime | Reads iniciales y por cambio en catalogo completo | `limit`, filtros server-side, busqueda paginada |
| P0 | Listener | `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:52` | `productsStock` completo por `updatedAt` | Inventario crece por lotes/almacenes | Ventana por warehouse/status, paginacion |
| P0 | Listener | `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:91` | Todos los productos para control inventario | Duplicacion con otros listeners de productos | Selector paginado/cache compartido |
| P0 | Listener | `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:167` | `accountingEvents` completo | Ledger historico infinito | Filtro por periodo/estado |
| P0 | Listener | `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:256` | `journalEntries` completo | Alto volumen contable | Paginacion por fecha/cuenta |
| P0 | Listener | `src/modules/treasury/hooks/useTreasuryWorkspace.ts:156` | `cashMovements` completo | Movimientos historicos | Mes activo + paginacion |
| P0 | Listener | `src/modules/treasury/hooks/useTreasuryWorkspace.ts:266` | `bankStatementLines` completo | Extractos bancarios crecen rapido | Cuenta+periodo+limit |
| P1 | Listener | `src/firebase/users/fbGetUsers.ts:262` | Un listener `/users where in` por chunk de 30 | Escala con staff | Paginar miembros |
| P1 | RTDB listener | `src/modules/settings/pages/setting/subPage/Users/hooks/useUserListData.ts:233` | `presence/{uid}` por usuario | N conexiones/listeners RTDB | Presencia solo visible |
| P1 | Read | `src/firebase/warehouse/productStockService.ts:109` | `getAllProductStocks` sin limit | Reads masivos one-shot | Requerir filtro o pagina |
| P1 | Listener | `src/firebase/warehouse/productStockService.ts:472` | Stocks activos sin limite | Realtime global del negocio | Filtro por warehouse/producto |
| P1 | Read/write | `src/firebase/warehouse/stockSyncService.ts:201` | Sync all businesses desde cliente | Operacion masiva desde bundle | Mover a admin/callable |
| P1 | Read/write | `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:58` | Migracion puede leer todos los negocios | Alto costo accidental | Admin-only script/function |
| P2 | Read | `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserRealActivity.ts:92` | 5 queries `limit(100)` | Costo moderado bajo demanda | Cache por ventana |
| P2 | Listener | `src/firebase/hrPayroll/useHrCommissionPeriods.ts:1290` | Entries por periodo sin limit | Periodos grandes | Paginacion por corte |

## 7. Cloud Functions sospechosas

| Prioridad | Funcion/export | Archivo | Trigger | Patron costoso | Fix sugerido |
| --- | --- | --- | --- | --- | --- |
| P0 | `syncProductsStockCron` | `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564` | Schedule diario | Lee todos los negocios y sincroniza productos/stocks/backorders | Cursor por negocio, solo tenants con cambios, presupuesto por run |
| P0 | `quantityZeroToInactivePerBusiness` | `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:106` | Schedule diario | Collection group scan en `batches` y `productsStock` | Queue por negocio o indice de pendientes |
| P0 | `expireAuthorizationRequests` | `functions/src/app/scheduled/expireAuthorizationRequests.ts:52` | Cada 5 min | Lee todos los negocios, luego pendientes por negocio | Collection group por `status/expiresAt`, TTL o task queue |
| P1 | `stockAlertsDailyDigest` | `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js:92` | Schedule | Hasta 100 negocios por defecto, multiples queries por negocio con limite 500 | Cursor, shard por negocio, metricas de truncamiento |
| P1 | `reconcilePendingBalanceCron` | `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js:135` | Schedule diario | Todos los negocios, AR paginada y clientes con pendingBalance | Procesar negocios activos/dirty only |
| P1 | `billingDailyReconcile` | `functions/src/app/billing/billingMaintenanceCron.js:41` | Schedule diario | Todos los negocios y billing accounts | Cursor y cambios incrementales |
| P1 | `billingMonthlyUsageReset` | `functions/src/app/billing/billingMaintenanceCron.js:92` | Schedule mensual | Promise.allSettled sobre todos los negocios | Limitar concurrencia y paginar |
| P1 | `syncProductNameOnUpdate` | `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:26` | Product update | Fan-out a stocks/lotes/movimientos/backorders | Job asincrono con progreso para catalogos grandes |
| P1 | `syncCategoryOnUpdate` | `functions/src/app/modules/Inventory/functions/syncCategoryOnUpdate.js:24` | Category update | Fan-out a productos | Bulk con limite y metricas |
| P1 | `syncProductBrandOnUpdate` | `functions/src/app/modules/Inventory/functions/syncProductBrandOnUpdate.js:17` | Brand update | Fan-out por `brandId` y nombre viejo | Evitar nombre denormalizado si no es necesario |
| P1 | `runMonthlyComplianceReport` | `functions/src/app/modules/dgii/functions/runMonthlyComplianceReport.js:20` | Callable | Reporte mensual bajo demanda con consultas y N+1 | Cache por periodo, batch reads |
| P2 | `createInvoiceV2Http` | `functions/src/app/versions/v2/invoices/http/createInvoiceHttp.controller.js:58` | HTTP | Bien autenticado/idempotente; sin rate limiting explicito | Rate limit por negocio/usuario si hay abuso |
| P2 | `getInvoiceV2Http` | `functions/src/app/versions/v2/invoices/http/getInvoiceHttp.controller.js:108` | HTTP | Queries auxiliares por factura | Cache o proyeccion si se consulta mucho |
| P2 | `azulWebhookAuth2` | `functions/src/app/modules/billing/functions/webhookManagement.controller.js:68` | HTTP webhook | Verificacion HMAC correcta; sin rate limit explicito | Mantener HMAC, agregar logging de abuso |

Nota de despliegue futuro: esta auditoria no modifica `functions/`, por lo que no requiere deploy. Si se corrige una funcion, desplegar solo la afectada. Ejemplos PowerShell:

```powershell
firebase deploy --only "functions:syncProductsStockCron"
firebase deploy --only "functions:quantityZeroToInactivePerBusiness"
firebase deploy --only "functions:expireAuthorizationRequests"
```

## 8. Storage/assets

### Reglas actuales

| Ruta | Regla | Riesgo |
| --- | --- | --- |
| `/app-config/login-image/**` | Lectura publica, escritura platform dev, imagen <= 5 MB | Correcto para login, pero listar objetos no escala. |
| `/businesses/{businessId}/reports/stock-digest/**` | Read por negocio, write dev-only | Bien restringido. |
| `/businesses/{businessId}/**` | Read/write/delete por miembro con acceso; upload <= 25 MB y content type permitido | Superficie amplia para miembros; borrar no tiene distincion por subruta. |
| `/purchase/**` legacy | Read/write por `userAuthenticatedAndActive` | Ruta legacy global; conviene migrar o restringir por negocio. |

### Clientes de upload

| Archivo | Observacion | Recomendacion |
| --- | --- | --- |
| `src/firebase/img/fbUploadFileAndGetURL.ts:58` | Helper soporta maxSize/allowedTypes, pero solo si el caller los pasa. | Hacer defaults seguros por tipo. |
| `src/firebase/products/productsImg/fbAddProductImg.ts:19` | Producto sube imagen sin compresion/tamano local. | Comprimir y limitar antes de upload. |
| `src/firebase/purchase/addPurchaseImg.ts:20` | Valida MIME de imagen, no tamano. | Limite local y compresion. |
| `src/firebase/businessInfo/fbAddBusinessInfo.ts:126` | Logo y firma se suben directo. | Reusar pipeline optimizado de imagen. |
| `src/modules/controlPanel/AppConfig/LoginImageConfig.tsx:146` | Login image si comprime antes de upload. | Buen patron a reutilizar. |

Riesgos de costo:

- Storage GB-mes por imagenes grandes.
- Egress al mostrar imagenes sin thumbnail.
- `getDownloadURL` y cargas repetidas en pantallas con muchas imagenes.
- `listAll` en rutas que podrian crecer.

Acciones recomendadas:

1. Definir tabla de limites: producto 1-2 MB, compra 3-5 MB, logo/firma < 1 MB.
2. Generar thumbnails o variantes `small/medium/original`.
3. Guardar metadata de `downloadURL`, `width`, `height`, `size`, `contentHash`.
4. Restringir delete en Storage a owner/admin para rutas sensibles.
5. Migrar `/purchase/**` legacy a `/businesses/{businessId}/purchase/**`.

## 9. Security Rules

### Fortalezas

- Finanzas/RRHH sensibles estan mayormente backend-only:
  - `firestore.rules:419`: `journalEntries` write false.
  - `firestore.rules:428`: `accountingEvents` write false.
  - `firestore.rules:542`: `invoicesV2` write false.
  - `firestore.rules:552`: colecciones financieras con write false.
  - `firestore.rules:612`: HR payroll/commissions con write false en rutas sensibles.
- Catch-all bajo negocio permite read y bloquea write para rutas no especificadas:
  - `firestore.rules:846`.
- Storage valida tamano/tipo para negocio:
  - `storage.rules:80`.

### Riesgos

| Area | Evidencia | Riesgo | Recomendacion |
| --- | --- | --- | --- |
| Reglas dependen de docs auxiliares | `firestore.rules:17`, `:69`, `:77`; `storage.rules:12`, `:54` | Cada request/listener necesita evaluar usuario, negocio y membresia; Rules puede cachear paths repetidos, pero listeners amplios siguen multiplicando evaluaciones. | Mantener helpers simples y evitar listeners masivos. |
| Lectura de usuarios amplia | `firestore.rules:362` | Cualquier usuario activo puede leer `/users/{userId}`. Puede ser intencional para resolucion de nombres, pero es amplio. | Restringir campos publicos o crear `publicUserProfiles`. |
| Escritura cliente amplia en inventario | `firestore.rules:728`, `:748`, `:775`, `:781` | Bugs cliente pueden escribir mucho. | Validaciones de shape/cotas y operaciones masivas backend-only. |
| Storage delete por miembro | `storage.rules:113` | Miembro con acceso puede borrar assets del negocio. | Delete admin-only o soft-delete. |
| Ruta legacy Storage | `storage.rules:119` | `/purchase/**` no esta namespaced por negocio. | Migrar y cerrar ruta legacy. |

Punto importante:

No se debe asumir que cada llamada repetida al mismo helper dentro de una regla se cobra como lectura separada; Firestore Rules cachea accesos al mismo documento durante la evaluacion. El problema confirmado es que las consultas/listeners amplios dependen de reglas con lecturas auxiliares y eso aumenta latencia, complejidad y potencial costo cuando cambian paths o no hay cache compartido entre requests.

## 10. Prioridades futuras

### Sprint 1 - Contener lecturas masivas visibles

1. Reemplazar listeners de `products` y `productsStock` por consultas paginadas y filtros server-side.
2. Agregar limites a `useInventoryStocksProducts`.
3. Separar selectors livianos de productos de vistas administrativas completas.
4. Medir `snapshot.size` antes/despues en emulador.

Validacion sugerida:

```powershell
npm run typecheck:app
npm run lint:web
npm run test:run
```

### Sprint 2 - Crons con presupuesto operacional

1. `syncProductsStockCron`: cursor por negocio y max docs por run.
2. `quantityZeroToInactivePerBusiness`: queue por negocio o solo documentos marcados como pendientes.
3. `expireAuthorizationRequests`: collection group por `status/expiresAt` o TTL.
4. `billingMonthlyUsageReset`: limitar concurrencia.

Validacion sugerida:

```powershell
npm --prefix functions run build
npm run test:run:functions
```

Deploy futuro si se toca `functions/`:

```powershell
firebase deploy --only "functions:nombreDeLaFuncion"
```

### Sprint 3 - Storage y reglas

1. Centralizar compresion/validacion de imagenes.
2. Limites por ruta en `storage.rules`.
3. Migrar `/purchase/**` legacy.
4. Revisar `/users/{userId}` y crear perfiles publicos si aplica.

Validacion sugerida:

```powershell
npm run typecheck:app
npm run lint:web
npm --prefix functions run build
```

### Sprint 4 - Finanzas historicas

1. Ventanas por periodo para contabilidad y tesoreria.
2. Resumenes materializados para dashboards.
3. Cache de reportes DGII por negocio/periodo.
4. Deduplicacion/batch loading en enriquecimientos N+1.

## 11. Preguntas al equipo

1. Cuantos productos, stocks, movimientos, journal entries y cash movements tiene el negocio mas grande hoy?
2. Cuales pantallas deben ser realtime de verdad y cuales pueden ser paginadas/on-demand?
3. Las herramientas `stockSyncService` y `migrateInventoryCounts` estan accesibles desde UI productiva o solo desde flujos dev?
4. Quien debe poder borrar imagenes de producto, compras, logos y firmas?
5. `/users/{userId}` necesita ser legible por cualquier usuario activo o solo por miembros del mismo negocio?
6. Los crons globales tienen SLO/budget definido: max duracion, max docs, max writes?
7. Hay metricas actuales de Cloud Functions por invocacion, memoria y timeout para los jobs diarios?
8. Los reportes DGII se regeneran frecuentemente para el mismo periodo o se ejecutan una vez al cierre?
9. Que volumen maximo esperado tiene un periodo de comisiones RRHH?
10. El indice `isDelete` en `firestore.indexes.json` corresponde a un campo real?

## 12. Log de investigacion

### Metodologia

- Analisis estatico local.
- Sin llamadas a Firebase/GCP.
- Sin despliegues.
- Sin modificaciones funcionales.
- Sin pruebas de carga reales.
- Se respeto el criterio de complejidad: no se introdujo complejidad accidental; el unico cambio es este reporte documental.

### Archivos revisados

- `package.json`
- `functions/package.json`
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `storage.rules`
- `firestore.indexes.json`
- `src/firebase/firebaseconfig.tsx`
- `src/firebase/products/fbGetProducts.ts`
- `src/hooks/products/useGetProductsWithBatch.ts`
- `src/firebase/warehouse/productStockService.ts`
- `src/firebase/warehouse/stockSyncService.ts`
- `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts`
- `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts`
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts`
- `src/firebase/hrPayroll/useHrCommissionPeriods.ts`
- `src/modules/settings/pages/setting/subPage/Users/hooks/useUserListData.ts`
- `src/firebase/users/fbGetUsers.ts`
- `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserRealActivity.ts`
- `src/modules/auth/repositories/authBackgroundImage.repository.ts`
- `src/modules/controlPanel/AppConfig/LoginImageConfig.tsx`
- `src/firebase/img/fbUploadFileAndGetURL.ts`
- `src/firebase/businessInfo/fbAddBusinessInfo.ts`
- `src/firebase/purchase/addPurchaseImg.ts`
- `src/firebase/products/productsImg/fbAddProductImg.ts`
- `functions/src/index.js`
- `functions/src/app/core/config/firebase.ts`
- `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js`
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js`
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js`
- `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js`
- `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js`
- `functions/src/app/modules/Inventory/functions/syncCategoryOnUpdate.js`
- `functions/src/app/modules/Inventory/functions/syncProductBrandOnUpdate.js`
- `functions/src/app/modules/Inventory/functions/syncActiveIngredientOnUpdate.js`
- `functions/src/app/scheduled/expireAuthorizationRequests.ts`
- `functions/src/app/versions/v2/accountsReceivable/reconcilePendingBalanceCron.js`
- `functions/src/app/billing/billingMaintenanceCron.js`
- `functions/src/app/modules/dgii/functions/runMonthlyComplianceReport.js`
- `functions/src/app/modules/dgii/services/dgii606MonthlyReport.service.js`
- `functions/src/app/modules/dgii/services/dgii607MonthlyReport.service.js`
- `functions/src/app/versions/v2/invoices/http/createInvoiceHttp.controller.js`
- `functions/src/app/versions/v2/invoices/http/getInvoiceHttp.controller.js`
- `functions/src/app/modules/billing/functions/webhookManagement.controller.js`
- `functions/src/app/versions/v2/invoices/workers/outbox.worker.js`
- `functions/src/app/versions/v2/invoices/workers/compensation.worker.js`
- `functions/src/app/modules/accounting/functions/syncPurchaseCommittedAccountingEvent.js`
- `functions/src/app/modules/accounting/functions/syncExpenseAccountingEvent.js`
- `functions/src/app/modules/accounting/functions/projectAccountingEventToJournalEntry.js`

### Comandos locales usados

Los comandos fueron de lectura:

```powershell
git status --short --branch
rg --files
rg -n "onSnapshot|getDocs|getDoc|collectionGroup|query\\(|limit\\(|orderBy\\(|where\\(|startAfter\\(|offset\\(" src functions
rg -n "onSchedule|onRequest|onCall|onDocument|BulkWriter|recursiveDelete|listAll|uploadBytes|getDownloadURL" functions src
Get-Content -LiteralPath "firebase.json"
Get-Content -LiteralPath "firestore.rules"
Get-Content -LiteralPath "storage.rules"
Get-Content -LiteralPath "firestore.indexes.json"
```

### Limitaciones

- No hay medicion real de reads/writes/egress por pantalla o funcion.
- No se validaron imports finales en bundle de produccion.
- No se consulto Cloud Logging, Usage Dashboard ni Billing.
- No se simularon datasets grandes.
- Algunas severidades dependen de volumen real y frecuencia de uso.

### Siguiente medicion recomendada

1. En staging/emulador, instrumentar `snapshot.size` y duracion por listener.
2. Tomar muestra de Cloud Logging de cada cron: duracion, memoria, documentos procesados.
3. Medir Storage: tamano promedio de imagen por tipo y egress mensual.
4. Revisar Billing por producto: Firestore reads, writes, Storage egress, Functions invocations.
5. Validar si las herramientas masivas de `src/` estan en rutas productivas.

