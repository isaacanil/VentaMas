# Auditoría de sincronización de stock (products / batches / productsStock)

## 🎯 Alcance y fuentes

Se revisaron los flujos que crean o consumen inventario para mantener alineados `products.stock` (campo “congelado” que usa el resto de la app), `batches.quantity` y los registros físicos de `productsStock`. El análisis incluye las rutas vigentes en frontend (`src/firebase/**/*`, `src/services/invoice/**`) y los servicios serverless (`functions/src/modules/**`, `functions/src/versions/**`). Se conservaron los modelos existentes; todas las recomendaciones proponen cambios compatibles con los campos actuales.

## 🔎 Cómo fluye hoy el stock

### Creación y edición de productos

- **Alta nueva** `fbAddProduct` (`src/firebase/products/fbAddProduct.js:10-115`): ejecuta una transacción que crea `products`, `batches`, `productsStock` y un `movement` inicial apuntando al almacén por defecto. El stock del producto queda igual al del lote inicial.
- **Edición** `fbUpdateProduct` (`src/firebase/products/fbUpdateProduct.js:5-11`): actualiza el documento completo sin invariantes; cualquier cambio manual en `stock` o banderas de inventario se persiste tal cual.

### Entradas (compras)

- `fbCompletePurchase` (`src/firebase/purchase/fbCompletePurchase.js:25-230`) agrupa `purchase.replenishments` por producto+fecha y, para cada grupo:
  1. Actualiza el `product.stock` con `stock: totalStock` (sin acumular el stock existente).
  2. Crea lote (`createBatch`) y `productsStock`.
  3. Inserta un `movement` de tipo “purchase”.
  4. Marca `backOrders` como completados.
- No se usan transacciones; cualquier fallo intermedio deja estructuras parciales. Además, el `productStockData.location` se envía como string aunque `createProductStock` espera `{ warehouse, shelf, row, segment }` (`src/firebase/warehouse/productStockService.js:55-90`).

### Salidas (ventas)

Dos implementaciones conviven:

1. **Backend (recomendado)** – `processInvoiceData` llama a `collectInventoryPrereqs` y `adjustProductInventory` dentro de una transacción (`functions/src/modules/invoice/services/invoice.service.js:18-108`). `adjustProductInventory` (`functions/src/modules/Inventory/services/Inventory.service.js:16-258`) descuenta stock de `productsStock`, `batches`, `products`, registra movimientos y crea backorders cuando faltan unidades.
2. **Frontend legacy** – `processInvoice` continúa usando `fbUpdateProductsStock` (`src/services/invoice/invoiceService.js:151-158`). Esta utilidad baja `products.stock` con `FieldValue.increment`, pero solo toca `batches` y `productsStock` cuando el producto tiene `hasExpirationDate`; los demás quedan desincronizados.

### Ajustes físicos e inventarios cíclicos

- **Sesiones de inventario** (`finalizeInventorySession`) ajustan cantidades, crean lotes sintéticos y generan backorders cuando el conteo es negativo (`functions/src/versions/v1/modules/inventory/handlers/finalizeInventorySession.js:1-688`). Antes de cerrar la sesión:
  - Se clampa `products.stock` para evitar negativos (`líneas 525-545`) y luego se recalcula como la suma de `productsStock` activos (`líneas 553-605`).
  - Se guarda un `snapshot` con los valores congelados (`líneas 607-665`) para auditar diferencias futuras.
- **Movimientos manuales** (`src/firebase/warehouse/productMovementService.js:1-213`) permiten transferir cantidades entre ubicaciones, pero operan sin transacciones: si una escritura falla a mitad del proceso, origen y destino quedan incoherentes.

### Salvaguardas y tareas automáticas

- `quantityZeroToInactivePerBusiness` desactiva lotes/stocks con `quantity <= 0` (`functions/src/modules/Inventory/functions/quantityZeroToInactivePerBusiness.js`).
- `reconcileBatchStatusFromStocks` recalcula `status` y `quantity` de cada batch a partir de sus `productsStock` (`functions/src/modules/Inventory/functions/reconcileBatchStatusFromStocks.js`).
- `finalizeInventorySession` + el cron de batches funcionan como mecanismos de reconciliación, pero dependen de ejecuciones manuales/periódicas.

## ⚠️ Casos de desincronización detectados

1. **Compras sobrescriben el stock del producto**  
   En `fbCompletePurchase` se hace `updateDoc(productRef, { stock: totalStock })` (`src/firebase/purchase/fbCompletePurchase.js:76-88`). Si un producto tiene varios lotes o stock previo, el último grupo procesado deja el `stock` igual al subtotal del lote, no a la suma total.

2. **Creación de productStock desde compras lanza error**  
   `productStockData.location` llega como string (`"warehouseId"`), pero `createProductStock` intenta desestructurar `{ warehouse, shelf, row, segment }` (`src/firebase/warehouse/productStockService.js:67-70`). El flujo rompe antes de insertar el registro físico y la compra queda incompleta.

3. **Ventas legadas solo bajan `products.stock`**  
   `fbUpdateProductsStock` (`src/firebase/products/fbUpdateProductStock.js:43-134`) actualiza `productsStock` y `batches` únicamente si `hasExpirationDate` es `true`. Para el resto de productos, la salida de inventario solo impacta el campo congelado de `products`, dejando los lotes con cantidades viejas.

4. **Ediciones manuales del producto ignoran invariantes**  
   `fbUpdateProduct` sobrescribe cualquier atributo sin validaciones (`src/firebase/products/fbUpdateProduct.js:5-11`), por lo que un usuario puede ajustar `stock`, `trackInventory` o `status` sin tocar `productsStock`. Esto rompe la relación “stock agregado = suma física” hasta que un inventario cíclico vuelva a reconciliar.

5. **Eliminación de productStock no es atómica**  
   `deleteProductStock` aplica cuatro escrituras independientes (`src/firebase/warehouse/productStockService.js:214-274`). Si se interrumpe entre la baja del lote y la del producto, `products.stock` puede quedar negativo hasta que otro proceso lo repare.

6. **Movimientos y transferencias sin transacción**  
   `moveProduct` resta en el origen y luego suma/crea en destino (`src/firebase/warehouse/productMovementService.js:103-150`). Un corte entre ambas fases deja stock “fantasma” congelado en `products.stock` porque no hay re-cálculo automático inmediato.

7. **Sola reconciliación cuando se finaliza inventario**  
   El clamp + suma (`functions/src/versions/v1/modules/inventory/handlers/finalizeInventorySession.js:525-605`) solo ocurre al cerrar una sesión. Si un negocio no ejecuta inventarios con frecuencia, los drifts generados por los puntos anteriores permanecen visibles en el campo congelado.

## 🏗️ Recomendaciones (sin cambiar el esquema)

1. **Normalizar todas las escrituras de stock en el backend**
   - Migrar `fbCompletePurchase` y `fbUpdateProductsStock` a funciones HTTPS/onCall que repitan el patrón de `adjustProductInventory`: transacciones end-to-end, `FieldValue.increment` para `products.stock` y actualización simultánea de lotes/stocks/movimientos.
   - Reutilizar el motor de prerequisitos (`collectInventoryPrereqs`) para validar `productStockId` y `batchId` antes de aceptar compras o ajustes manuales.

2. **Tratar `movements` como ledger único**
   - Cada movimiento ya captura `movementType`, `movementReason`, lote y ubicación. Se puede agregar un “inventory outbox” (similar al de `invoicesV2`) que procese cola de movimientos y aplique cambios a `productsStock`/`products`.
   - Esto permitiría recalcular `products.stock` releyendo `movements` cuando exista duda, sin depender de snapshots intermedios.

3. **Agregar triggers onWrite sobre `productsStock`**
   - Un `functions.firestore.document('businesses/{bid}/productsStock/{sid}')` que, en cada creación/actualización, compute el delta y aplique `FieldValue.increment` a `products/{pid}.stock` mantendría el campo congelado consistente con los registros físicos.
   - El trigger puede etiquetar un campo `lastStockProjectionAt` para auditar cuándo se recalculó por última vez.

4. **Blindar compras**
   - Encapsular `updatePurchaseWarehouseStock` dentro de `runTransaction` y usar `increment(totalStock)` en lugar de sobrescribir el stock.
   - Convertir el destino a `{ warehouse: destinationWarehouse.id }` (o construir el `locationPath` antes de llamar a `createProductStock`) para evitar errores de desestructuración.

5. **Lineamientos para flujos manuales**
   - Forzar que `fbUpdateProduct` ignore cambios en `stock`, `quantity`, `initialQuantity` o `trackInventory` a menos que el caller sea un job de reconciliación.
   - Para `deleteProductStock` y `moveProduct`, envolver las escrituras en una transacción o en `writeBatch` con retry, replicando el enfoque de `finalizeInventorySession`.

6. **Monitoreo y alertas**
   - Reutilizar el cálculo de `finalizeInventorySession` para un job ligero que compare `products.stock` contra `SUM(productsStock.quantity)` cada noche y solo dispare alertas cuando la diferencia supere un umbral (sin bloquear operaciones).
   - Complementar con métricas del cron `reconcileBatchStatusFromStocks` para detectar negocios con muchos lotes reactivados automáticamente.

## ✅ Próximos pasos sugeridos

1. Corregir de inmediato el bug de `stock` en `fbCompletePurchase` y el formato de `location`, ya que impiden registrar compras con varios lotes.
2. Desplegar `adjustProductInventory` como el único camino de facturación (frontend debe delegar al backend).
3. Diseñar la función onWrite sobre `productsStock` para mantener `products.stock` sincronizado sin depender de inventarios manuales.
4. Documentar una política de operación: compras → función backend, ventas → outbox, ajustes → sesión de inventario o endpoints dedicados.

Estas acciones mantienen el campo congelado (`products.stock`) alineado con los registros físicos aunque existan múltiples lotes por producto y reducen la probabilidad de drift aun en escenarios con alta concurrencia.
