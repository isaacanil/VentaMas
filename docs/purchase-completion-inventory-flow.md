# Flujo de Creación de Batches (Lotes) y ProductStock al Completar una Compra

Este documento explica paso a paso qué ocurre en el sistema cuando se **completa una compra** (ruta lógica `fbCompletePurchase`) y cómo se crean / actualizan:

1. El documento de la compra (`purchases/{purchaseId}`)
2. Los lotes o batches (`batches`)
3. Los registros de stock físico (`productsStock`)
4. Los movimientos de inventario (`movements`)
5. El estado de los backorders (`backOrders`)

---

## 1. Punto de Entrada

Archivo clave: `src/firebase/purchase/fbCompletePurchase.js`

Función: `fbCompletePurchase({ user, purchase, localFiles, setLoading })`

Acciones principales:

1. Marca inicio de proceso (`setLoading(true)`)
2. Asegura existencia de un almacén por defecto (`getDefaultWarehouse`)
3. Gestiona adjuntos (subidas / eliminaciones)
4. Actualiza y marca la compra como `completed`
5. Llama a `updatePurchaseWarehouseStock` para crear lotes, stock y movimientos

---

## 2. Estructura de los Replenishments de la Compra

Cada elemento en `purchase.replenishments` representa un producto a ingresar. Campos relevantes:

| Campo                  | Descripción                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `id`                   | ID del producto                                                                               |
| `name`                 | Nombre del producto                                                                           |
| `purchaseQuantity`     | Cantidad total comprometida (incluye backorders)                                              |
| `quantity`             | Cantidad real que entra a stock (si hay backorders, es `purchaseQuantity - suma(backorders)`) |
| `selectedBackOrders[]` | Backorders asociados (cada uno con `id` y `quantity`)                                         |
| `expirationDate`       | Fecha de expiración (puede ser null)                                                          |

Durante la finalización, el código utiliza `item.quantity` para sumar existencias del lote / stock.

---

## 3. Manejo del Almacén por Defecto

Archivo: `src/firebase/warehouse/warehouseService.js`

Función: `getDefaultWarehouse(user)`

Si no existe un almacén con `defaultWarehouse: true`, se crea automáticamente uno:

```json
{
  "name": "Almacen Virtual",
  "shortName": "Virtual",
  "defaultWarehouse": true,
  "number": <autoincremental>,
  "location": "default"
}
```

Este almacén se usa como destino inicial de todos los ingresos de compras.

---

## 4. Agrupación para Crear Batches

Función: `updatePurchaseWarehouseStock(user, purchase, defaultWarehouse)` (dentro de `fbCompletePurchase.js`).

Agrupa las líneas de la compra por la clave:

```
key = `${replenishment.id}_${replenishment.expirationDate}`
```

De este modo, productos con la **misma combinación producto + fecha de expiración** se consolidan en un único lote.

Para cada grupo se calcula:

```js
const totalStock = batch.items.reduce((acc, item) => acc + item.quantity, 0);
```

Luego se genera un `batchId` derivado:

```
batchId = `${purchase.id}_${productId}_${new Date(expirationDate).getTime()}`
```

---

## 5. Creación del Batch

Archivo: `src/firebase/warehouse/batchService.js`

Función utilizada: `createBatch(user, batchData)`

Datos base añadidos automáticamente:

```js
{
  id: <nanoid>,
  status: 'active',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  createdBy: user.uid,
  updatedBy: user.uid,
  isDeleted: false
}
```

Campos provenientes del flujo de compra:

```js
{
  productId,
  purchaseId,
  numberId: await getNextID(user, 'batches'),
  shortName: `${productName}_${YYYY-MM-DD}`,
  batchNumber: batchId,
  quantity: totalStock,
  initialQuantity: totalStock,
  expirationDate,
  providerId: purchase.provider
}
```

Si `totalStock === 0`, el batch se crea con `status: 'inactive'`.

---

## 6. Creación de ProductStock

Archivo: `src/firebase/warehouse/productStockService.js`

Función: `createProductStock(user, productStockData)`

Se crea un documento en `productsStock` que representa la **existencia física** del lote en una ubicación:

Campos relevantes añadidos por la función:

```js
{
  id: <nanoid>,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  isDeleted: false,
  deletedAt: null
}
```

Campos que provee el flujo de compra:

```js
{
  batchId: batchData.id,
  batchNumberId: batchData.numberId,
  location: `${defaultWarehouse.id}`, // NOTA: luego puede evolucionar a un objeto { warehouse, shelf, row, segment }
  productId,
  productName,
  quantity: totalStock,
  initialQuantity: totalStock,
  status: totalStock === 0 ? 'inactive' : 'active',
  expirationDate,
}
```

> Importante: Actualmente `location` se pasa como string simple. La función `createProductStock` espera potencialmente un objeto `{ warehouse, shelf, row, segment }` para construir `locationPath`. Si se mantiene string, no rompe, pero es una oportunidad de mejora para unificar formato.

---

## 7. Registro de Movimiento de Inventario

Dentro de `updatePurchaseWarehouseStock` se crea un documento en `movements` por cada batch ingresado:

```js
{
  id: nanoid(),
  movementType: MovementType.Entry,
  movementReason: MovementReason.Purchase,
  quantity: totalStock,
  productId,
  productName,
  batchId: batchData.id,
  batchNumberId: batchData.numberId,
  destinationLocation: defaultWarehouse.id,
  sourceLocation: null,
  createdAt / updatedAt / createdBy / updatedBy
}
```

Esto permite trazabilidad de entradas de inventario.

---

## 8. Actualización de BackOrders

En `fbAddPurchase` (modo creación) los backorders asociados se marcan como `reserved`.

En `fbCompletePurchase` (dentro de la iteración de batches):

Cada `replenishment` con `selectedBackOrders` provoca la actualización de cada backorder:

```js
status: 'completed',
completedAt: serverTimestamp(),
completedBy: user.uid,
completedWithPurchaseId: purchase.id,
pendingQuantity: 0
```

Esto cierra el ciclo de reserva → cumplimiento.

---

## 9. Orden de Operaciones Resumido

1. Validaciones iniciales y archivos (adjuntos nuevos / eliminación de removidos)
2. Determinar o crear almacén por defecto
3. Persistir cambios de la compra (estado → `completed`)
4. Agrupar replenishments (producto + fecha expiración)
5. Para cada grupo:
   - Calcular `totalStock`
   - Crear batch (`createBatch`)
   - Crear productStock (`createProductStock`)
   - Crear movimiento de entrada
   - Completar backorders asociados (si aplica)

---

## 10. Diferencias Clave: `purchaseQuantity` vs `quantity`

| Campo              | Uso durante la compra                                                                            | Uso al completar                              |
| ------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `purchaseQuantity` | Cantidad total solicitada (incluye backorders)                                                   | Base para validaciones y subtotal             |
| `quantity`         | Cantidad neta que se incorpora físicamente (excluye lo que ya estaba comprometido en backorders) | Se suma a inventario (batches / productStock) |

Esto asegura que al completar una compra no se “sobredoble” el stock de unidades ya comprometidas mediante backorders previos.

---

## 11. Posibles Mejoras / Observaciones

1. `location` en `createProductStock`: Estandarizar siempre a objeto normalizado.
2. Validar coherencia: si `quantity + sum(selectedBackOrders.quantity) !== purchaseQuantity` lanzar advertencia.
3. Añadir control transaccional (`runTransaction`) para evitar condiciones de carrera en lotes masivos.
4. Centralizar lógica de agrupación de batches en un helper reutilizable.
5. Indexación recomendada en Firestore:
   - `batches`: `productId`, `isDeleted`, `status`
   - `productsStock`: `batchId`, `productId`, `isDeleted`, `status`
   - `movements`: `movementType`, `movementReason`, `productId`
6. Auditar diferencias entre `purchase.replenishments[].quantity` y stock final aplicado.

---

## 12. Referencias de Código

| Concepto               | Archivo                                     | Función                                       |
| ---------------------- | ------------------------------------------- | --------------------------------------------- |
| Completar compra       | `firebase/purchase/fbCompletePurchase.js`   | `fbCompletePurchase`                          |
| Crear batch            | `firebase/warehouse/batchService.js`        | `createBatch`                                 |
| Crear productStock     | `firebase/warehouse/productStockService.js` | `createProductStock`                          |
| Almacén por defecto    | `firebase/warehouse/warehouseService.js`    | `getDefaultWarehouse`                         |
| Backorders (reservar)  | `firebase/purchase/fbAddPurchase.js`        | `addPurchase`                                 |
| Backorders (completar) | `firebase/purchase/fbCompletePurchase.js`   | `updatePurchaseWarehouseStock` (loop interno) |
| Movimiento inventario  | `firebase/purchase/fbCompletePurchase.js`   | creación directa con `setDoc`                 |

---

## 13. Ejemplo Simplificado (Pseudo-Flujo)

```mermaid
flowchart TD
  A[fbCompletePurchase] --> B[getDefaultWarehouse]
  B --> C[handleFileAttachments]
  C --> D[update purchase (status=completed)]
  D --> E[Group replenishments]
  E --> F{Por cada grupo}
  F --> G[createBatch]
  G --> H[createProductStock]
  H --> I[create movement]
  F --> J[update backOrders -> completed]
```

---

## 14. Checklist de Integridad

- [x] Compra marcada como `completed`
- [x] Lotes creados por producto+expiración
- [x] Stock generado en `productsStock`
- [x] Movimientos de entrada registrados
- [x] Backorders actualizados a `completed`
- [x] Adjuntos sincronizados (local → remote / eliminados removidos)

---

## 15. Preguntas Frecuentes

**¿Qué ocurre si un replenishment no tiene `expirationDate`?**  
Se agrupa con clave que incluye `null`. Puede causar múltiples lotes diferentes si luego se asigna una fecha. Se recomienda normalizar a una fecha estándar o manejar un batch “sin vencimiento”.

**¿Qué pasa si `quantity` es 0?**  
Se crea batch y productStock con `status: 'inactive'`. Valorar filtrarlo antes para evitar ruido.

**¿Se actualiza el stock del producto global?**  
Sí, en `fbCompletePurchase` se hace `updateDoc` sobre el producto sumando `stock: totalStock` (o dejándolo inactivo si es 0).

**¿Dónde se controla el decremento posterior (ventas, ajustes, etc.)?**  
En otros servicios / movimientos que generan `MovementType.Exit` y/o marcan `productStock` como eliminado o reducen cantidades.

---

Si necesitas ampliar este documento con el flujo inverso (anulación / ajuste) o un diagrama más detallado de datos, avísame y lo agregamos.
