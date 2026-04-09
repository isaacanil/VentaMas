# As-Is (Estado actual)

## Flujo actual de productos
- `useGetProducts(contextKey)` escucha `businesses/{businessId}/products` completo.
- Filtros y orden se aplican en cliente.
- Búsqueda (`useSearch`) recorre estructuras en memoria.

## Barcode scan actual
- `useBarcodeScanner` en `Sale`, `SaleExperimental` e `Inventario`.
- Resolución por barcode contra mapa local (`productsByBarcode`) construido con todos los productos cargados.
- En `sales`, soporta barcode de peso variable.
- En `sales`, el escáner agrega al carrito directo (`addProduct`) y hoy **no** pasa por validación de lotes en Firestore.

## Lotes (batch) actual
- Selección manual en producto dispara `useProductHandling`.
- Se consulta `productStock` en Firestore:
  - 1 lote válido/no vencido: auto-selección.
  - múltiples/vencido: `ProductBatchModal`.
- El carrito persiste `batchInfo`, `productStockId`, `batchId`.
- Esto crea una asimetría: selección manual sí valida lote; escáner actualmente no.

## Problemas detectados
- Escala pobre en catálogos grandes (lectura masiva + filtro local).
- Latencia de primera carga.
- Costo creciente de lecturas y CPU cliente.
- Dependencia del scanner a tener todo en memoria.
- Comportamiento inconsistente entre escáner y clic manual respecto a reglas de lote/stock estricto.
