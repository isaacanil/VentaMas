# Validacion segunda pasada: Firebase, costos y recursos

Fecha: 2026-06-11  
Base revisada: `CODEX_FIREBASE_COST_AUDIT.md`  
Alcance: validacion estatica mas build production temporal fuera del repo. No se modifico codigo funcional, no se desplego y no se consultaron servicios Firebase/GCP.

## Ranking accionable

| Rank | Hallazgo | Estado | Prioridad real | Por que va aqui |
| --- | --- | --- | --- | --- |
| 1 | Home e inventario montan listeners completos de `productsStock` y `products` | Confirmado | P0 | Impacta pantallas de uso frecuente, incluida `/home`; trae colecciones completas y puede duplicarse. |
| 2 | `useGetProducts` abre un listener completo por cada consumidor | Confirmado | P0 | Se usa en ventas, inventario, facturas y modales; cada montaje crea su propio `onSnapshot`. |
| 3 | `expireAuthorizationRequests` barre todos los negocios cada 5 minutos | Confirmado | P0 | Frecuencia alta, sin cursor, sin lock y con limite parcial por negocio que puede dejar pendientes viejos. |
| 4 | `syncProductsStockCron` barre todos los negocios y escribe productos/stocks/batches/backorders | Confirmado | P0 | Job global con muchas lecturas/escrituras potenciales y sin checkpoint. |
| 5 | `quantityZeroToInactivePerBusiness` hace collection group stream sin limite | Confirmado | P0 | Escanea `batches` y `productsStock` globalmente; no hay presupuesto por ejecucion. |
| 6 | Contabilidad/tesoreria escuchan colecciones historicas completas | Confirmado, necesita metricas | P1 | Riesgo alto por volumen historico; algunas rutas contables ya evitan cargar ledgers. |
| 7 | Gestion de usuarios multiplica listeners por miembros y presencia | Confirmado, necesita metricas | P1 | Escala con staff; tiene cleanup correcto pero abre 1 RTDB listener por usuario listado. |
| 8 | `stockSyncService` en bundle production | Condicional | P1 | El build production emite chunks, pero las rutas dev se filtran por defecto y no estan en el menu. |
| 9 | Indices para optimizaciones propuestas | Confirmado incompleto | P1 | Hay indices parciales, pero faltan los compuestos que habilitan ventanas por fecha/status. |
| 10 | `migrateInventoryCounts` en bundle production | Falso positivo practico | P3 | No encontre imports ni firmas en el build production temporal. El archivo es peligroso solo si se conecta. |

## 1. Herramientas masivas y bundle productivo

### 1.1 `stockSyncService`

Hallazgo original: `C-003 - Herramientas masivas en bundle cliente con capacidad de enumerar y escribir`.

Estado: **condicional**.

Evidencia exacta:

- Imports directos:
  - `src/modules/dev/pages/Prueba/InventoryMigration.tsx:4` importa `syncAllBusinessesProductsStock`.
  - `src/modules/dev/pages/DevTools/SyncDiagnostics/SyncDiagnosticsActions.tsx:4` importa `syncProductsStockFromProductsStock`.
  - `src/modules/dev/pages/DevTools/SyncDiagnostics/syncDiagnosticsColumns.tsx:5` importa `syncProductsStockFromProductsStock`.
- Rutas:
  - `src/router/routes/paths/Dev.tsx:42` carga lazy `InventoryMigrationTool`.
  - `src/router/routes/paths/Dev.tsx:49` carga lazy `SyncDiagnostics`.
  - `src/router/routes/paths/Dev.tsx:211` registra `INVENTORY_MIGRATION` con `devOnly: true`.
  - `src/router/routes/paths/Dev.tsx:219` registra `SYNC_DIAGNOSTICS` con `devOnly: true`.
  - `src/router/routes/routeFiltering.ts:5` usa `import.meta.env.DEV`.
  - `src/router/routes/routeFiltering.ts:6` permite forzar dev routes con `VITE_ENABLE_DEV_ROUTES === 'true'`.
  - `src/router/routes/routeFiltering.ts:16` filtra `route.devOnly` si no es dev ni force enable.
- Menu:
  - `src/modules/navigation/components/MenuApp/MenuData/items/developer.tsx` tiene comentada la entrada de `INVENTORY_MIGRATION`.
  - No encontre entrada visible para `SYNC_DIAGNOSTICS`.
  - `src/utils/menuAccess.ts:17` calcula `developerAccess`.
  - `src/utils/menuAccess.ts:29` bloquea rutas `requiresDevAccess` sin developer access.
  - `src/modules/navigation/components/MenuApp/components/SideBar.tsx:169` elimina el grupo developer si el usuario no tiene developer access.
- Build production temporal:
  - Comando usado: `npm run build -- --mode production --outDir "$env:TEMP\ventamas-cost-audit-prod-build-20260611125923" --emptyOutDir`.
  - El build emitio `assets/InventoryMigrationTool-Crk8KPU3.js`.
  - El build emitio `assets/SyncDiagnostics-DGHGqdtr.js`.
  - El build emitio `assets/stockSyncService-DOExmLIf.js`.
  - En `stockSyncService-DOExmLIf.js` aparece la ruta `businesses`, `products`, `productsStock` y la rama que lista todos los negocios cuando `businessIds` esta vacio.

Riesgo real:

- No parece cargarse por rutas normales de produccion si `VITE_ENABLE_DEV_ROUTES` no esta en `true`.
- Si el build se publica con `VITE_ENABLE_DEV_ROUTES=true`, el riesgo se vuelve real: `/dev/tools/inventory-migration` y `/dev/tools/sync-diagnostics` quedan montadas.
- Aunque las rutas esten filtradas, el codigo queda como asset estatico emitido. Esto no ejecuta Firestore por si solo, pero aumenta superficie publicada.
- El riesgo operacional fuerte es ejecucion accidental por developer/admin si esas rutas se habilitan.

Primera correccion recomendada:

- Sacar estas herramientas del build productivo con import condicional realmente eliminable o moverlas fuera de `src` a script/admin tooling.
- Si deben existir en staging, exigir `VITE_ENABLE_DEV_ROUTES=true` solo en staging y agregar confirmacion backend/admin-only antes de escribir.

Riesgo de romper funcionalidad:

- Medio si DevTools se usan para soporte operativo.
- Bajo para usuarios finales porque las rutas no son flujo productivo normal.

Tests/validaciones necesarias:

```powershell
npm run build -- --mode production --outDir "$env:TEMP\ventamas-prod-check" --emptyOutDir
rg -n "syncAllBusinessesProductsStock|Sincronizar stock declarado|Aplicar sincronizacion global|stockSyncService" "$env:TEMP\ventamas-prod-check"
```

### 1.2 `migrateInventoryCounts`

Hallazgo original: `C-003 - Herramientas masivas en bundle cliente con capacidad de enumerar y escribir`.

Estado: **falso positivo practico para bundle productivo actual**.

Evidencia exacta:

- Archivo existe y es peligroso si se invoca:
  - `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:30` exporta `migrateAllBusinessesInventoryCounts`.
  - `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:58` lista todos los negocios si no recibe `businessIds`.
  - `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:71` recorre `inventorySessions`.
  - `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:76` recorre subcoleccion `counts`.
  - `src/modules/inventory/pages/InventoryControl/tools/migrateInventoryCounts.ts:144` escribe batches si `dryRun` es falso.
- Imports:
  - `rg "migrateInventoryCounts|migrateAllBusinessesInventoryCounts|tools/migrateInventoryCounts" src` no encontro imports fuera del propio archivo.
- Build production temporal:
  - No encontre firmas `migrateAllBusinessesInventoryCounts`, `conteoReal`, `stockSistema`, `diferencia` ni `migrateInventoryCounts` en el build production temporal.

Riesgo real:

- No entra al bundle productivo actual por imports detectables.
- Riesgo residual: si alguien lo importa luego en una pantalla, por defecto `dryRun` es `false`, asi que podria escribir.

Primera correccion recomendada:

- Cambiar default conceptual a herramienta admin/offline antes de conectarla a UI.
- Si se mantiene en `src`, dejar comentario/guardia explicita y export solo bajo carpeta dev tooling.

Riesgo de romper funcionalidad:

- Bajo, porque no hay consumidor detectado.

Tests/validaciones necesarias:

```powershell
rg -n "migrateAllBusinessesInventoryCounts|migrateInventoryCounts|tools/migrateInventoryCounts" src
npm run build -- --mode production --outDir "$env:TEMP\ventamas-prod-check" --emptyOutDir
rg -n "migrateAllBusinessesInventoryCounts|conteoReal|stockSistema" "$env:TEMP\ventamas-prod-check"
```

## 2. Listeners P0/P1

### 2.1 `useGetProducts` en ventas, inventario y modales

Hallazgo original: `P0 - src/firebase/products/fbGetProducts.ts:596`.

Estado: **confirmado**.

Evidencia exacta:

- `src/firebase/products/fbGetProducts.ts:596` inicia el efecto principal.
- `src/firebase/products/fbGetProducts.ts:607` crea `query(productsRef)` sin constraints.
- `src/firebase/products/fbGetProducts.ts:609` abre `onSnapshot`.
- `src/firebase/products/fbGetProducts.ts:619` mapea todos los docs.
- `src/firebase/products/fbGetProducts.ts:647` devuelve `unsubscribe`.
- Montajes detectados:
  - `src/modules/sales/pages/Sale/Sale.tsx:235`.
  - `src/modules/invoice/pages/InvoicesPage/components/InvoiceForm/components/Products/Products.tsx:157`.
  - `src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/components/InvoiceWorkspaceProducts.tsx:89`.
  - `src/modules/orderAndPurchase/pages/OrderAndPurchase/shared/ProductModal.tsx:249`.
  - `src/modules/inventory/pages/InventorySummary/hooks/useInventorySummaryData.ts:79`.
  - `src/modules/inventory/pages/Inventario/pages/ItemsManager/Inventario.tsx:30`.
  - `src/modules/inventory/components/ProductFilter/ProductFilter.tsx:41`.
  - `src/modules/navigation/components/MenuApp/GlobalMenu/Page/InventoryMenuToolbar/InventoryMenuToolbar.tsx:68`.

Riesgo real:

- Cada consumidor monta su propio listener completo.
- Tiene cleanup correcto, asi que no es fuga de listener.
- Si toolbar y pantalla de inventario se montan juntas, puede haber duplicacion.
- Trae coleccion completa `products`; filtros de estado, inventariable, categoria, stock, precio y orden se aplican despues en memoria.

Primera correccion recomendada:

- Reemplazar el hook general por queries por caso de uso: selector liviano, venta, inventario, resumen.
- Para venta, cargar solo campos minimos y filtrar `status/isDeleted` server-side.
- Para inventario, paginar por `updatedAt/name` y mover filtros a Firestore cuando sea posible.

Riesgo de romper funcionalidad:

- Alto, porque `useGetProducts` es un hook compartido por flujos de venta, facturacion, inventario y compras.

Tests/validaciones necesarias:

- Loggear:
  - `products.full.snapshot.size`.
  - `products.full.docChanges.length`.
  - `contextKey`.
  - `businessId`.
  - `consumer` si se separa por caller.

```powershell
npm run typecheck:app
npm run lint:web
npm run test:run
```

### 2.2 Filtro por almacenes dentro de `useGetProducts`

Hallazgo original: `P0/P1 - src/firebase/products/fbGetProducts.ts:437`.

Estado: **confirmado**.

Evidencia exacta:

- `src/firebase/products/fbGetProducts.ts:437` monta efecto si `stockFilterActive`.
- `src/firebase/products/fbGetProducts.ts:455` crea un listener por cada `selectedWarehouse`.
- `src/firebase/products/fbGetProducts.ts:458` usa rango por `location`.
- `src/firebase/products/fbGetProducts.ts:462` filtra `isDeleted == false`.
- `src/firebase/products/fbGetProducts.ts:463` filtra `status == active`.
- `src/firebase/products/fbGetProducts.ts:519` limpia todos los unsubscribes.

Riesgo real:

- No trae toda la coleccion si hay warehouses seleccionados, pero si puede montar multiples listeners.
- Cada listener trae todos los `productsStock` de ese rango de `location`.
- Riesgo depende de cantidad de warehouses seleccionados y cantidad de stock por warehouse.

Primera correccion recomendada:

- Preferir campo normalizado `warehouseId` en `productsStock` si existe o agregarlo.
- Limitar por vista/pagina y no mantener listeners por warehouses que no estan visibles.

Riesgo de romper funcionalidad:

- Medio, porque cambia calculo visible de stock filtrado por ubicacion.

Tests/validaciones necesarias:

- Loggear:
  - `productsStock.locationFilter.listenerCount`.
  - `productsStock.locationFilter[warehouseId].snapshot.size`.
  - `selectedWarehouses.length`.

### 2.3 `useGetProductsWithBatch`

Hallazgo original: `P0/P1 - src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts:37`.

Estado: **confirmado, alcance mas acotado**.

Evidencia exacta:

- `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts:37` crea `query(productsRef)` sin constraints.
- `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts:40` abre `onSnapshot`.
- `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts:43` mapea todos los docs.
- `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/hooks/useGetProductsWithBatch.ts:84` limpia con `unsubscribe?.()`.
- Montaje detectado:
  - `src/modules/inventory/pages/Inventory/components/Warehouse/forms/ProductStockForm/ProductStockForm.tsx:113`.

Riesgo real:

- Se monta en formulario de stock, no globalmente.
- Trae `products` completo para un form que probablemente necesita selector/busqueda.
- Cleanup correcto.

Primera correccion recomendada:

- Selector paginado/buscable para productos.
- Si se necesita batch/expiracion, filtrar `trackInventory/status/isDeleted`.

Riesgo de romper funcionalidad:

- Medio, por UX de formulario.

Tests/validaciones necesarias:

- Loggear `products.withBatch.snapshot.size`.
- Probar creacion/edicion de stock con busqueda de producto.

### 2.4 `InventoryControl` escucha `productsStock` y `products` completos

Hallazgo original: `P0 - useInventoryStocksProducts`.

Estado: **confirmado**.

Evidencia exacta:

- Ruta:
  - `src/router/routes/paths/Inventory.tsx:91` monta `InventoryControl` en `INVENTORY_CONTROL_SESSION`.
  - `src/modules/inventory/pages/InventoryControl/InventoryControl.tsx:53` llama `useInventoryStocksProducts`.
- Listener de stock:
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:52` referencia `productsStock`.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:53` ordena por `updatedAt desc`.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:54` abre `onSnapshot`.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:61` filtra `isDeleted/status` en memoria.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:86` limpia.
- Listener de productos:
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:93` referencia `products`.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:94` abre `onSnapshot` sin query.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:101` filtra en memoria.
  - `src/modules/inventory/pages/InventoryControl/hooks/useInventoryStocksProducts.ts:123` limpia.

Riesgo real:

- Se montan dos listeners completos al entrar a una sesion de control de inventario.
- Cleanup correcto.
- Trae colecciones completas y crea filas sinteticas para productos sin stock.
- Riesgo alto si un negocio tiene muchos productos/lotes/stock.

Primera correccion recomendada:

- Para una sesion, escuchar solo stocks/productos incluidos o necesarios para esa sesion.
- Server-side filters: `isDeleted == false`, `status == active`, `updatedAt` con ventana o cursor.
- Cargar productos sin stock por pagina o por busqueda, no todos.

Riesgo de romper funcionalidad:

- Alto, porque InventoryControl depende de ver productos con y sin stock.

Tests/validaciones necesarias:

- Loggear:
  - `inventoryControl.productsStock.raw.snapshot.size`.
  - `inventoryControl.productsStock.active.count`.
  - `inventoryControl.products.raw.snapshot.size`.
  - `inventoryControl.products.active.count`.
- Probar guardar conteos, exportar y finalizar inventario.

### 2.5 Dashboard `/home` monta stock global activo y productos globales

Hallazgo original: `P1 - listenActiveProductStocks/listenBusinessProducts`.

Estado: **confirmado y sube prioridad**.

Evidencia exacta:

- Ruta:
  - `src/router/routes/paths/Basic.tsx:46` monta `Home`.
  - `src/modules/home/pages/Home/components/HomeDashboard/hooks/useHomeDashboardData.tsx:45` llama `useListenAllActiveProductsStock`.
  - `src/modules/home/pages/Home/components/HomeDashboard/hooks/useHomeDashboardData.tsx:47` llama `useInventoryProductIds`.
- Hooks:
  - `src/hooks/useProductStock.ts:97` monta listener de active stock.
  - `src/hooks/useProductStock.ts:100` llama `listenActiveProductStocks`.
  - `src/hooks/useProductStock.ts:127` monta listener de productos.
  - `src/hooks/useProductStock.ts:130` llama `listenBusinessProducts`.
- Servicios:
  - `src/firebase/warehouse/productStockService.ts:472` consulta `productsStock` con `status == active` y `isDeleted == false`.
  - `src/firebase/warehouse/productStockService.ts:478` abre `onSnapshot`.
  - `src/firebase/warehouse/productStockService.ts:500` define `listenBusinessProducts`.
  - `src/firebase/warehouse/productStockService.ts:513` abre `onSnapshot(productsRef)` sin constraints.

Riesgo real:

- Se paga desde el dashboard de inicio, no solo desde pantallas de inventario.
- `productsStock` tiene filtros server-side, pero sin `limit`.
- `products` trae coleccion completa.
- Cleanup correcto porque los hooks retornan el unsubscribe del servicio.

Primera correccion recomendada:

- Reemplazar dashboard por resumen materializado: conteos de productos en bajo/critico/sin stock.
- Si se mantiene listener, limitar a stocks bajo umbral y productos inventariables activos.

Riesgo de romper funcionalidad:

- Medio. El dashboard puede degradarse a resumen eventual sin romper venta/inventario.

Tests/validaciones necesarias:

- Loggear:
  - `home.productsStock.active.snapshot.size`.
  - `home.products.snapshot.size`.
  - `home.stockSummary.lowCount`.
  - `home.stockSummary.criticalCount`.

### 2.6 `WarehouseProductStock` monta stock global activo y productos globales

Hallazgo original: `P1 - listenActiveProductStocks/listenBusinessProducts`.

Estado: **confirmado**.

Evidencia exacta:

- Ruta:
  - `src/router/routes/paths/Inventory.tsx:109` monta `WarehouseProductStock`.
  - `src/router/routes/paths/Inventory.tsx:113` monta detalle de producto stock.
- Montaje:
  - `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductStockBrowser/ProductStockBrowser.tsx:180` llama `useListenAllActiveProductsStock`.
  - `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductStockBrowser/ProductStockBrowser.tsx:182` llama `useInventoryProductIds`.

Riesgo real:

- Similar al dashboard, pero dentro de vista de inventario.
- Puede coincidir con otros listeners de inventario si toolbar o subcomponentes montan datos.

Primera correccion recomendada:

- Usar query paginada por producto/warehouse/status.
- Evitar escuchar todos los productos solo para filtrar IDs inventariados.

Riesgo de romper funcionalidad:

- Medio/alto por tabla de stock.

Tests/validaciones necesarias:

- Loggear:
  - `productStockBrowser.productsStock.active.snapshot.size`.
  - `productStockBrowser.products.snapshot.size`.

### 2.7 Listeners por ubicacion y producto en Warehouse

Hallazgo original: P1 relacionado con `productStockService`.

Estado: **confirmado, menor prioridad que los globales**.

Evidencia exacta:

- `src/modules/inventory/pages/Inventory/components/Warehouse/Warehouse.tsx:78` llama `useListenProductsStockByLocation(path)`.
- `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductsSection.tsx:34` vuelve a llamar `useListenProductsStockByLocation(location)`.
- `src/hooks/useProductStock.ts:44` retorna listener por ubicacion.
- `src/firebase/warehouse/productStockService.ts:427` filtra `location == normalizedLocation`.
- `src/firebase/warehouse/productStockService.ts:430` filtra `isDeleted == false`.
- `src/firebase/warehouse/productStockService.ts:431` filtra `status == active`.
- `src/firebase/warehouse/productStockService.ts:434` abre `onSnapshot`.
- `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductStockOverview/ProductStockOverview.tsx:182` usa `useListenProductsStock(productId)`.
- `src/firebase/warehouse/productStockService.ts:374` filtra por `productId`.

Riesgo real:

- No trae coleccion completa; tiene filtros server-side.
- Puede duplicarse en Warehouse porque se llama en `Warehouse.tsx` y `ProductsSection.tsx`.
- Prioridad menor salvo ubicaciones con miles de stocks.

Primera correccion recomendada:

- Eliminar llamada sin consumidor en `Warehouse.tsx` si no produce efecto necesario.
- Compartir resultado por contexto si `ProductsSection` ya lo usa.

Riesgo de romper funcionalidad:

- Bajo/medio, depende de si `Warehouse.tsx:78` se usaba como precarga implicita.

Tests/validaciones necesarias:

- Loggear:
  - `warehouse.locationStock[path].snapshot.size`.
  - `warehouse.locationStock.listenerCountForPath`.
  - `productStockOverview[productId].snapshot.size`.

### 2.8 Accounting workspace ledgers

Hallazgo original: `H-001 - Contabilidad escucha ledgers completos`.

Estado: **confirmado, necesita metricas de volumen**.

Evidencia exacta:

- Rutas:
  - `src/router/routes/paths/Accounting.tsx:37` a `:75` montan `AccountingWorkspace` en varias rutas.
  - `src/modules/accounting/pages/AccountingWorkspace/AccountingWorkspace.tsx:50` desactiva ledger para `general-ledger`, `financial-reports`, `fiscal-compliance`.
  - `src/modules/accounting/pages/AccountingWorkspace/AccountingWorkspace.tsx:86` llama `useAccountingWorkspace`.
- Listeners:
  - `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:167` escucha `accountingEvents` sin constraints.
  - `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:210` escucha `accountingEventProjectionDeadLetters` sin constraints.
  - `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:256` escucha `journalEntries` sin constraints.
  - `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts:295` escucha `accountingPeriodClosures` sin constraints.
  - Todos devuelven `unsubscribe` en `:188`, `:234`, `:277`, `:312`.

Riesgo real:

- Se monta una instancia por `AccountingWorkspace`.
- En rutas `general-ledger`, `financial-reports` y `fiscal-compliance`, `includeLedgerRecords` es falso para los tres ledgers principales. Esto reduce el riesgo original.
- En `journal-book`, `manual-entries`, `accounting-monitor` y `period-close`, si accounting esta habilitado, trae colecciones completas.

Primera correccion recomendada:

- Mantener el gating actual y agregar periodo/estado a las rutas que si cargan ledgers.
- `accountingEventProjectionDeadLetters` puede quedarse realtime pero limitado a `active/pending` o ultimos N.

Riesgo de romper funcionalidad:

- Medio/alto por navegacion entre paneles contables y busqueda de origen.

Tests/validaciones necesarias:

- Loggear:
  - `accounting.accountingEvents.snapshot.size`.
  - `accounting.deadLetters.snapshot.size`.
  - `accounting.journalEntries.snapshot.size`.
  - `accounting.periodClosures.snapshot.size`.
  - `activePanel` y `includeLedgerRecords`.

### 2.9 Treasury workspace historicos

Hallazgo original: `H-001 - Tesoreria escucha ledgers completos`.

Estado: **confirmado, necesita metricas de volumen**.

Evidencia exacta:

- Rutas:
  - `src/router/routes/paths/Treasury.tsx:20` monta `TreasuryBankAccountsPage`.
  - `src/router/routes/paths/Treasury.tsx:24` monta la misma pagina para detalle.
  - `src/modules/treasury/pages/components/TreasuryBankAccountsWorkspace.tsx:113` llama `useTreasuryWorkspace`.
- Listeners:
  - `src/modules/treasury/hooks/useTreasuryWorkspace.ts:156` escucha `cashMovements`.
  - `src/modules/treasury/hooks/useTreasuryWorkspace.ts:191` escucha `internalTransfers`.
  - `src/modules/treasury/hooks/useTreasuryWorkspace.ts:226` escucha `bankReconciliations`.
  - `src/modules/treasury/hooks/useTreasuryWorkspace.ts:266` escucha `bankStatementLines`.
  - Devuelven cleanup en `:185`, `:220`, `:260`, `:300`.

Riesgo real:

- Se monta en la vista principal y detalle de tesoreria.
- Todas las colecciones son historicas y no tienen filtros server-side.
- Cleanup correcto.

Primera correccion recomendada:

- Ventana por cuenta y periodo: `accountId/kind`, `statementDate/occurredAt`, `status`.
- Para dashboard, usar ultimos N o resumen materializado.

Riesgo de romper funcionalidad:

- Medio/alto por vistas de conciliacion, saldos y movimientos.

Tests/validaciones necesarias:

- Loggear:
  - `treasury.cashMovements.snapshot.size`.
  - `treasury.internalTransfers.snapshot.size`.
  - `treasury.bankReconciliations.snapshot.size`.
  - `treasury.bankStatementLines.snapshot.size`.
  - `routeAccountKey`.

### 2.10 Gestion de usuarios y presencia

Hallazgo original: `H-002 - Gestion de usuarios multiplica listeners`.

Estado: **confirmado, necesita metricas**.

Evidencia exacta:

- Ruta:
  - `src/router/routes/paths/Setting.tsx:150` monta `/users`.
  - `src/router/routes/paths/Setting.tsx:161` monta `UserList`.
  - `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:66` llama `useUserListData`.
- Listeners:
  - `src/modules/settings/pages/setting/subPage/Users/components/UsersList/hooks/useUserListData.ts:114` escucha el doc del negocio.
  - `src/modules/settings/pages/setting/subPage/Users/components/UsersList/hooks/useUserListData.ts:157` llama `fbGetUsers`.
  - `src/firebase/users/fbGetUsers.ts:224` escucha `businesses/{businessId}/members`.
  - `src/firebase/users/fbGetUsers.ts:262` parte miembros en chunks.
  - `src/firebase/users/fbGetUsers.ts:266` abre un listener `/users where documentId in chunk`.
  - `src/modules/settings/pages/setting/subPage/Users/components/UsersList/hooks/useUserListData.ts:233` abre `presence/{uid}` por usuario.
- Cleanup:
  - Business doc cleanup en `useUserListData.ts:138`.
  - Users cleanup en `useUserListData.ts:174`.
  - `fbGetUsers.ts:303` limpia chunks y members.
  - Presence cleanup en `useUserListData.ts:266`.

Riesgo real:

- No es fuga; cleanup es correcto.
- El costo escala con miembros activos: 1 business doc listener, 1 members listener, `ceil(N/30)` user listeners y N RTDB presence listeners.
- La lista trae todos los miembros activos, no pagina.

Primera correccion recomendada:

- Paginar miembros.
- Presence solo para filas visibles.
- Considerar resumen de presencia por negocio si se necesita vista total.

Riesgo de romper funcionalidad:

- Medio por filtros, presencia y permisos de usuarios.

Tests/validaciones necesarias:

- Loggear:
  - `users.businessDoc.snapshot.exists`.
  - `users.members.snapshot.size`.
  - `users.userChunks.count`.
  - `users.userChunk[index].snapshot.size`.
  - `users.presence.listenerCount`.

## 3. Crons P0

### 3.1 `syncProductsStockCron`

Hallazgo original: `C-002/P0 - syncProductsStockCron`.

Estado: **confirmado**.

Evidencia exacta:

- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:6` cron diario por env, default `0 3 * * *`.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:45` lee `productsStock` filtrado, sin `limit`.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:164` lee todos los `products`, sin `limit`.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:181` crea promesas para todos los batch IDs unicos.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:285` usa BulkWriter.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:300` puede actualizar `productsStock` negativos.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:461` puede actualizar `products`.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:477` puede crear `backOrders`.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:564` define `onSchedule` con timeout 540s y 1GiB.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:591` lee todos los negocios.
- `functions/src/app/versions/v2/inventory/syncProductsStockCron.js:596` procesa cada negocio secuencialmente.

Cursor/checkpoint:

- No hay cursor persistido.
- No hay checkpoint por negocio.
- No hay lock/lease para evitar solape.

Solape:

- Puede solaparse si una corrida sigue viva cuando entra la siguiente programacion o si hay retry externo.
- La probabilidad es menor por ser diario, pero no hay defensa en codigo.

Limite real por ejecucion:

- No hay limite global de negocios.
- No hay limite global de docs por negocio.
- Hay `select` para reducir payload, pero no para reducir cardinalidad.

Escrituras que podrian disparar otros triggers:

- Actualiza `productsStock`; `stockAlertsOnWrite` se invoca en `functions/src/app/modules/Inventory/functions/stockAlertsOnWrite.js:76`, aunque sale si `status` no es active o si `quantity` no cambio.
- Actualiza `products`; `syncProductNameOnUpdate` se invoca en `functions/src/app/modules/Inventory/functions/syncProductNameOnUpdate.js:26`, pero sale si el nombre no cambio en `:46`.
- Crea `backOrders`; no confirme trigger directo sobre `backOrders`, pero si notifica listeners cliente.
- Actualiza batches; puede afectar listeners cliente y jobs de inventario.

Riesgo real:

- Alto por lectura/escritura global y fan-out a listeners/triggers.

Primera correccion recomendada:

- Convertir a job por negocio con cursor y presupuesto:
  - `maxBusinessesPerRun`.
  - `maxStockDocsPerBusiness`.
  - `maxProductsPerBusiness`.
  - `lastProcessedBusinessId`.
  - `runLeaseExpiresAt`.

Riesgo de romper funcionalidad:

- Alto. Este cron corrige drift de stock; cambiarlo sin backstop puede dejar stock inconsistente.

Tests/validaciones necesarias:

```powershell
npm --prefix functions run build
npm run test:run:functions -- functions/src/app/versions/v2/inventory
```

- Validar en emulador con negocios multiples y stock negativo.
- Validar idempotencia ejecutando dos veces.
- Validar que no cree backorders duplicados.

### 3.2 `quantityZeroToInactivePerBusiness`

Hallazgo original: `C-002/P0 - collection group scan`.

Estado: **confirmado**.

Evidencia exacta:

- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:20` default diario `0 1 * * *`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:24` targets default `batches,productsStock`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:30` default `DRY_RUN=false`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:63` procesa collection group.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:69` filtra `status == active`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:71` filtra `quantity <= 0` o `quantity == 0`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:75` usa `q.stream()`.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:88` agenda update con BulkWriter.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:106` define `onSchedule` con timeout 540s y 512MiB.
- `functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js:141` procesa todos los target collections.

Cursor/checkpoint:

- No hay cursor.
- No hay checkpoint.
- No hay limite por cantidad de documentos.
- Puede limitarse por env a un negocio si los docs tienen `businessId`, pero default es global.

Solape:

- Puede solaparse si el stream tarda mas que el intervalo o hay retry.
- No hay lock/lease.

Limite real por ejecucion:

- No hay limite real de docs.
- El stream reduce memoria pero no presupuesto.

Escrituras que podrian disparar otros triggers:

- Actualiza `productsStock` status a `inactive`; `stockAlertsOnWrite` se invoca, pero sale temprano si `after.status !== active` en `stockAlertsOnWrite.js:91`.
- Actualiza `batches`; no confirme trigger directo, pero afecta listeners/consultas de inventario.

Riesgo real:

- Alto si hay muchos docs activos con cantidad cero o negativa.
- Tambien puede gastar aunque no actualice, porque escanea matches.

Primera correccion recomendada:

- Mantener un indice/cola de documentos candidatos al momento de escribir stock/batch.
- Alternativa: job por negocio con cursor y max docs.

Riesgo de romper funcionalidad:

- Medio. Cambia estados automaticos; riesgo de dejar activos docs en cero por mas tiempo.

Tests/validaciones necesarias:

```powershell
npm --prefix functions run build
npm run test:run:functions -- functions/src/app/modules/Inventory/functions/quantityZeroToInactivePerBusiness
```

- Emulador con `batches` y `productsStock` en varios negocios.
- Validar que `isDeleted` se respete.
- Validar que no inactiva cantidades positivas.

### 3.3 `expireAuthorizationRequests`

Hallazgo original: `C-002/P0 - expireAuthorizationRequests`.

Estado: **confirmado y mejor primera correccion**.

Evidencia exacta:

- `functions/src/app/scheduled/expireAuthorizationRequests.ts:52` define `onSchedule`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:54` corre `every 5 minutes`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:59` lee todos los negocios.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:63` itera cada negocio.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:64` consulta subcoleccion `authorizationRequests`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:66` filtra `status == pending`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:68` limita a 200 por negocio.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:71` evalua expiracion en memoria.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:73` actualiza `status: expired`.
- `functions/src/app/scheduled/expireAuthorizationRequests.ts:78` ejecuta `Promise.allSettled(updates)`.

Cursor/checkpoint:

- No hay cursor.
- No hay checkpoint.
- No hay lock.

Solape:

- Alto riesgo relativo porque corre cada 5 minutos.
- Si una corrida tarda mas de 5 minutos, puede procesar los mismos negocios/documentos.

Limite real por ejecucion:

- Limite por negocio: 200 pendientes.
- Sin limite de negocios.
- Sin `orderBy('expiresAt')`, por lo que los 200 no necesariamente son los mas viejos.

Escrituras que podrian disparar otros triggers:

- No confirme trigger de Cloud Functions sobre `authorizationRequests`.
- Si hay listeners UI activos, recibiran cambios.

Riesgo real:

- Alto por frecuencia.
- Puede dejar pendientes expirados si hay mas de 200 por negocio o si Firestore devuelve un conjunto que no incluye los mas vencidos.

Primera correccion recomendada:

- Reemplazar barrido por collection group:
  - `collectionGroup('authorizationRequests')`
  - `where('status', '==', 'pending')`
  - `where('expiresAt', '<=', now)`
  - `orderBy('expiresAt')`
  - `limit(N)`
- Guardar `businessId` en cada doc si falta para update/auditoria.
- Alternativa: TTL si el estado `expired` no necesita escribirse explicitamente.

Riesgo de romper funcionalidad:

- Bajo/medio. Cambia mecanismo de expiracion, no flujo de aprobacion.

Tests/validaciones necesarias:

```powershell
npm --prefix functions run build
npm run test:run:functions -- functions/src/app/scheduled
```

- Emulador con mas de 200 pendientes por negocio.
- Validar expirados por `expiresAt` y legacy `expires_at`.
- Validar dos ejecuciones concurrentes/idempotentes.

## 4. Indices para optimizaciones propuestas

### 4.1 `products`

Hallazgo original: revisar indices para `products` por `status/isDeleted/updatedAt/category/brand`.

Estado: **confirmado incompleto**.

Evidencia exacta:

- Existen indices de `products` entre `firestore.indexes.json:790` y `:1111`.
- Los existentes se concentran en `pricing.*`, `promotions.isActive`, `trackInventory`, `product.category`, `product.productName`, `product.size`, `product.type`, `size`, `type`, `name`.
- No encontre compuesto para `status + isDeleted + updatedAt`.
- No encontre compuesto para `brandId/brand + status/isDeleted`.
- Hay mezcla de campos legacy/nested: `product.category` y tambien filtros en codigo por `category`/`name`/`trackInventory`.

Riesgo real:

- Antes de optimizar `useGetProducts`, hay que decidir campos canonicos.
- Agregar queries nuevas sin indices puede romper en runtime con error de indice requerido.

Primera correccion recomendada:

- Definir shape canonico de producto:
  - `status`
  - `isDeleted`
  - `updatedAt`
  - `categoryId` o `category`
  - `brandId`
  - `name` o `product.productName`
- Luego agregar solo indices usados por pantallas reales.

Riesgo de romper funcionalidad:

- Medio. Indices no rompen, pero cambiar queries/campos si.

Tests/validaciones necesarias:

- Emulador con query real de venta, inventario y selector.
- Validar que no aparece error de indice.

### 4.2 `productsStock`

Hallazgo original: revisar indices para `productsStock` por `warehouseId/status/updatedAt/productId`.

Estado: **confirmado incompleto**.

Evidencia exacta:

- `firestore.indexes.json:1130` tiene collection group `productsStock` por `quantity/status`.
- `firestore.indexes.json:1149` tiene collection index con `batchId/isDeleted/productId/status/quantity`.
- `firestore.indexes.json:1180` tiene `isDeleted/status/location`.
- `firestore.indexes.json:1203` tiene `isDeleted/status/location/quantity`.
- `firestore.indexes.json:1230` tiene `location.id/isDelete`; `firestore.indexes.json:1238` usa `isDelete`, probable typo.
- `firestore.indexes.json:1249` tiene `status/quantity`.
- No encontre `warehouseId/status/updatedAt`.
- No encontre `productId/status/isDeleted/updatedAt`.

Riesgo real:

- Las optimizaciones por warehouse seran mejores si existe `warehouseId` materializado; hoy el codigo usa rangos sobre `location`.
- El typo `isDelete` probablemente no ayuda a queries reales con `isDeleted`.

Primera correccion recomendada:

- Confirmar si `warehouseId` existe en docs actuales. Si no, agregarlo en escrituras futuras y backfill.
- Corregir/remover indice `isDelete` si no hay campo real.
- Crear indices despues de definir queries finales.

Riesgo de romper funcionalidad:

- Bajo para agregar indices; medio si se migra de `location` a `warehouseId`.

Tests/validaciones necesarias:

- Query emulator para:
  - `where('warehouseId','==',id), where('status','==','active'), where('isDeleted','==',false), orderBy('updatedAt','desc'), limit(N)`.
  - `where('productId','==',id), where('status','==','active'), where('isDeleted','==',false)`.

### 4.3 Accounting y Treasury

Hallazgo original: revisar indices por `businessId/period/date/status`.

Estado: **confirmado faltante para nuevas ventanas**.

Evidencia exacta:

- No hay entradas `collectionGroup` para `accountingEvents`, `journalEntries`, `cashMovements`, `internalTransfers`, `bankReconciliations` ni `bankStatementLines` en `firestore.indexes.json`.
- Las colecciones viven bajo `businesses/{businessId}/...`, por lo que `businessId` esta en el path, no necesariamente como field.
- Los listeners actuales no usan queries con filtros, por eso no han necesitado indices compuestos.

Riesgo real:

- Cambiar a ventanas por periodo/fecha/status requerira indices nuevos segun campo elegido.

Primera correccion recomendada:

- Definir queries por pantalla antes de indices:
  - Accounting events: `status`, `occurredAt` o `recordedAt`, `eventType`.
  - Journal entries: `entryDate`, `status`, `periodKey` si existe.
  - Cash movements: `occurredAt`, `accountKey`, `status`.
  - Bank statement lines: `statementDate`, `bankAccountId`, `status`.

Riesgo de romper funcionalidad:

- Medio, por cambios de historico y orden.

Tests/validaciones necesarias:

- Fixtures con varios periodos.
- Validar conteos antes/despues para un periodo.
- Validar navegacion desde origen contable.

### 4.4 `authorizationRequests`

Hallazgo original: revisar indice para collection group `status/expiresAt`.

Estado: **confirmado faltante**.

Evidencia exacta:

- `firestore.indexes.json:271`, `:294`, `:317` tienen indices `authorizationRequests` con `queryScope: COLLECTION`.
- Los indices actuales cubren `invoiceId/status/approvedAt`, `requestedBy.uid/status/createdAt`, `status/createdAt`.
- No hay `queryScope: COLLECTION_GROUP` para `authorizationRequests`.
- No hay indice `status/expiresAt`.

Riesgo real:

- La correccion propuesta para `expireAuthorizationRequests` necesita un indice collection group nuevo.
- Hay dos campos de expiracion en codigo: `expiresAt` y `expires_at`. Conviene escoger canonico.

Primera correccion recomendada:

- Migrar/canonizar a `expiresAt`.
- Agregar indice collection group:
  - `collectionGroup: authorizationRequests`
  - `queryScope: COLLECTION_GROUP`
  - `status ASC`
  - `expiresAt ASC`
- Si se mantiene legacy, decidir si se procesa por segundo job temporal o backfill.

Riesgo de romper funcionalidad:

- Bajo para agregar indice.
- Medio si se ignora `expires_at` legacy.

Tests/validaciones necesarias:

- Emulador con docs bajo varios negocios.
- Validar que el query collection group expira solo pendientes vencidos.

## 5. Ranking final de primeras correcciones

1. `expireAuthorizationRequests`: pasar a collection group `status/expiresAt` con indice nuevo. Riesgo bajo/medio y alto retorno por frecuencia cada 5 minutos.
2. Dashboard `/home`: reemplazar listeners globales de stock/productos por resumen materializado o query limitada. Alto retorno porque se monta temprano.
3. `useGetProducts`: dividir por casos de uso y evitar listener completo en venta/inventario/modales. Alto retorno, pero riesgo alto.
4. `syncProductsStockCron`: agregar lock/cursor/presupuesto antes de cualquier otro cambio de logica. Alto retorno, riesgo alto.
5. `quantityZeroToInactivePerBusiness`: reemplazar stream global por cola/cursor. Alto retorno, riesgo medio.
6. Accounting/Treasury: agregar ventanas por periodo/fecha y preparar indices. Alto retorno cuando crezca el historico.
7. Users/presence: presencia solo de filas visibles. Retorno medio, riesgo medio.
8. `stockSyncService`: sacar DevTools del build productivo o asegurar que dev routes nunca se publiquen forzadas. Retorno de seguridad operacional, no costo diario.
9. `migrateInventoryCounts`: no urgente; mantener desconectado.

## 6. Log de validacion

Comandos de lectura/validacion usados:

```powershell
rg -n "stockSyncService|syncAllBusinessesProductsStock|syncProductsStockFromProductsStock|migrateInventoryCounts|migrateAllBusinessesInventoryCounts" src
rg -n "useInventoryStocksProducts|useGetProductsWithBatch|useGetProducts\\(|listenActiveProductStocks|listenBusinessProducts|useAccountingWorkspace|useTreasuryWorkspace|useUserListData" src
npm run build -- --mode production --outDir "$env:TEMP\ventamas-cost-audit-prod-build-20260611125923" --emptyOutDir
rg -n "Sincronizar stock declarado|Aplicar sincronizacion global|syncAllBusinessesProductsStock|migrateAllBusinessesInventoryCounts|conteoReal|stockSistema" "$env:TEMP\ventamas-cost-audit-prod-build-20260611125923"
Get-Content -LiteralPath "firestore.indexes.json" -Raw | ConvertFrom-Json
```

Limitaciones:

- El build temporal confirma assets generados, no ejecucion en produccion.
- No se consulto Hosting real ni Cloud Logging.
- No se midieron reads/writes reales.
- No se verifico con datasets grandes.
- Las prioridades P0/P1 asumen que las pantallas se usan con frecuencia normal.
