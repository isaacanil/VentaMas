# Modelo de Datos de Inventario

Este documento describe la estructura de las colecciones clave en Firestore para inventario: products, batches, productsStock y movements. Todas viven bajo `businesses/{businessID}/…`.

- `businesses/{businessID}/products/{productId}`
- `businesses/{businessID}/batches/{batchId}`
- `businesses/{businessID}/productsStock/{productStockId}`
- `businesses/{businessID}/movements/{movementId}`

Campos de auditoría comunes que se usan en varias colecciones:
- `createdAt: Timestamp`
- `createdBy: string`
- `updatedAt?: Timestamp`
- `updatedBy?: string`
- `deletedAt?: Timestamp`
- `deletedBy?: string`
- `isDeleted?: boolean`

---

## Products
Ruta: `businesses/{businessID}/products/{productId}`

Campos principales (según `src/models/Products/Product.ts` y usos actuales):
- `id: string` – Identificador del producto.
- `name: string` | `productName: string` – Nombre. En la app se usa `name` en la mayoría de flujos; `productName` existe en datos antiguos o utilidades.
- `productImageURL?: string` – URL de imagen.
- `category: string` – Categoría.
- `pricing: {`  
  `cost: number; price: number; listPrice?: number; avgPrice?: number; minPrice?: number; tax: number|string }` – Precios e impuesto. En algunos flujos se trata como número.
- `promotions?: { start?: Date; end?: Date; discount?: number; isActive?: boolean }`
- `weightDetail?: { isSoldByWeight?: boolean; weightUnit?: string; weight?: number }`
- `warranty?: { status?: boolean; unit?: string; quantity?: number }`
- `size?: string`
- `type?: string`
- `stock: number` – Stock total agregado del producto.
- `netContent?: string`
- `amountToBuy?: number` – Cantidad solicitada en flujos de venta.
- `isVisible?: boolean`
- `trackInventory?: boolean` – Control de inventario activado.
- `qrcode?: string`
- `barcode?: string`
- `hasExpDate: boolean` – Si controla fecha de expiración.

Ejemplo:
```json
{
  "id": "PRD123",
  "name": "Cerveza Corona",
  "category": "Bebidas",
  "pricing": { "cost": 50, "price": 100, "tax": 18 },
  "stock": 42,
  "trackInventory": true,
  "hasExpDate": false,
  "barcode": "7501064193695"
}
```

---

## Batches (Lotes)
Ruta: `businesses/{businessID}/batches/{batchId}`

Campos principales (según `src/models/Warehouse/Batch.ts` y creación en `fbCompletePurchase.js` / `batchService`):
- `id: string`
- `productId: string` – Referencia al producto.
- `productName?: string` – Desnormalizado en algunos flujos.
- `shortName: string` – Alias legible, p.ej. `Producto_YYYY-MM-DD`.
- `batchNumber: string` – Identificador técnico/compuesto del lote (cuando aplica).
- `numberId: number` – Correlativo autoincremental de lote.
- `manufacturingDate?: Date`
- `expirationDate?: Date`
- `receivedDate?: Date`
- `providerId?: string`
- `notes?: string`
- `status: 'active' | 'inactive' | 'expired' | 'pending'`
- `quantity: number` – Cantidad actual total en el lote.
- `initialQuantity: number` – Cantidad inicial del lote.
- Auditoría común (`createdAt`, `createdBy`, …, `isDeleted`).

Ejemplo:
```json
{
  "id": "BAT_abc123",
  "productId": "PRD123",
  "shortName": "Cerveza_2025-09-10",
  "batchNumber": "PUR_9f8e_PRD123_1757452800000",
  "numberId": 257,
  "expirationDate": "2025-09-10T00:00:00.000Z",
  "receivedDate": "2025-09-07T12:00:00.000Z",
  "status": "active",
  "quantity": 120,
  "initialQuantity": 120
}
```

---

## ProductsStock (Stock físico por ubicación)
Ruta: `businesses/{businessID}/productsStock/{productStockId}`

Representa la existencia física de un producto–lote en una ubicación específica.

Campos principales (según `src/models/Warehouse/ProductStock.ts` y `productStockService`):
- `id: string`
- `productId: string`
- `productName?: string` – Desnormalizado en algunos flujos.
- `batchId: string` – Lote asociado.
- `batchNumberId?: number` – Correlativo del lote.
- `location: string` – Ruta lógica de ubicación. Formato actual: `warehouseId[/shelfId/rowId/segmentId]`.
- `expirationDate?: Date` – Si aplica.
- `quantity: number` – Cantidad en esta ubicación.
- `initialQuantity: number` – Cantidad inicial en esta ubicación.
- `status: 'active' | 'inactive'`
- `isDeleted?: boolean`
- Auditoría común (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `deletedAt`, `deletedBy`).

Ejemplo:
```json
{
  "id": "PS_1a2b3c",
  "productId": "PRD123",
  "productName": "Cerveza Corona",
  "batchId": "BAT_abc123",
  "batchNumberId": 257,
  "location": "WH_DEF",
  "quantity": 60,
  "initialQuantity": 120,
  "status": "active"
}
```

---

## Movements (Movimientos de inventario)
Ruta: `businesses/{businessID}/movements/{movementId}`

Eventos que registran entradas/salidas y transferencias.

Enums (ver `src/models/Warehouse/Movement.ts`):
- `movementType: 'in' | 'out'`
- `movementReason: 'sale' | 'purchase' | 'adjustment' | 'return' | 'initial_stock' | 'damaged' | 'expired' | 'lost' | 'transfer' | 'backorder'`

Campos principales (según `productMovementService`, `fbCompletePurchase.js` y funciones de inventario):
- `id: string`
- `productId: string`
- `productName: string`
- `productStockId?: string` – Usado en algunos flujos.
- `batchId?: string`
- `batchNumberId?: number`
- `saleId?: string` – En movimientos por ventas.
- `movementType: 'in' | 'out'`
- `movementReason: enum`
- `quantity: number`
- `sourceLocation: string|null` – Origen; `null` en entradas externas.
- `destinationLocation: string|null` – Destino; `null` en salidas a cliente/merma.
- `notes?: string`
- `isDeleted?: boolean`
- Auditoría común (`createdAt`, `createdBy`, `updatedAt`, `updatedBy`).

Ejemplos:

Entrada por compra:
```json
{
  "id": "MV_001",
  "productId": "PRD123",
  "productName": "Cerveza Corona",
  "batchId": "BAT_abc123",
  "batchNumberId": 257,
  "movementType": "in",
  "movementReason": "purchase",
  "quantity": 120,
  "sourceLocation": null,
  "destinationLocation": "WH_DEF"
}
```

Salida por venta:
```json
{
  "id": "MV_002",
  "saleId": "SALE_999",
  "productId": "PRD123",
  "productName": "Cerveza Corona",
  "batchId": "BAT_abc123",
  "batchNumberId": 257,
  "movementType": "out",
  "movementReason": "sale",
  "quantity": 2,
  "sourceLocation": "WH_DEF",
  "destinationLocation": null
}
```

---

## Relaciones entre colecciones
- Un `batch` pertenece a un `product` vía `productId`.
- Un `productsStock` referencia un `product` (`productId`) y un `batch` (`batchId`).
- Un `movement` referencia siempre un `product` y opcionalmente un `batch` y/o `productStock`.

---

## Notas de implementación
- `location` actualmente se maneja como string. Hay funciones que aceptan `{ warehouse, shelf, row, segment }` y construyen un path; unificar este formato evitaría ambigüedades.
- `pricing.tax` puede venir como `number` o `string` según flujo; estandarizar a `number` simplifica cálculos.
- Algunos flujos rellenan campos desnormalizados (`productName`, `batchNumberId`) para facilitar consultas y reportes.

---

## Sesiones de inventario (`inventorySessions`)
- Ruta: `businesses/{businessID}/inventorySessions/{sessionId}`
- Estados soportados: `open` | `processing` | `closed`.
  - `open`: edición normal (conteos, fechas, etc.).
  - `processing`: el backend está aplicando ajustes; la UI debe ser de solo lectura.
  - `closed`: sesión finalizada; no editable.
- Subcolección: `counts/{productStockId|noexp:*|batchGroup:*}` con campos:
  - `stockSistema: number`
  - `conteoReal: number`
  - `diferencia: number`
  - `updatedBy: string`, `updatedByName: string`, `updatedAt: Timestamp`
  - `manualExpirationDate?: string|'__REMOVE__'` (YYYY-MM-DD) para cambios por grupo.
- Campos al cerrar:
  - `frozenChildrenStock: { [groupKey]: number }` – snapshot de stock base por grupo.
  - `frozenProductTotals: { [productId|name]: number }` – totales por producto.
  - `finalizeSummary: { productsUpdated, batchesUpdated, adjustments, expirationUpdates }`
  - Si el snapshot excede ~800KB se guarda en `inventorySessions/{id}/snapshots/{autoId}` y se referencia con `frozenSnapshotPath`.
