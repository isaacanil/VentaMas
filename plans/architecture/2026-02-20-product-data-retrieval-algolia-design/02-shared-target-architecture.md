# To-Be Compartido (Arquitectura objetivo)

## Principio
- Firestore = fuente de verdad.
- Algolia = capa de lectura para búsqueda/filtros/orden/paginación.
- Fallback a Firestore cuando Algolia no esté disponible.

## Componentes
- `ProductSearchService`:
  - `searchProducts(query)`
  - `findByBarcode(barcode)`
  - `getProductById(productId)` fallback
- `BarcodeResolver`: normaliza barcode y resuelve candidatos.
- `BatchAvailabilityService`: conserva reglas de lotes con Firestore.
- `ProductGateway`:
  - `algoliaAdapter`
  - `firestoreFallbackAdapter`

## Índice Algolia (base)
- Índice principal: `products_v1`.
- Réplicas:
  - `products_v1_price_asc`
  - `products_v1_price_desc`
  - `products_v1_stock_desc`
  - `products_v1_name_asc`

## Filtros (query-time)
- `isVisible` (filtro base obligatorio para ventas/items),
  `category`, `activeIngredients`, `trackInventory`, `pricing.tax`,
  `promotionActive`, `restrictSaleWithoutStock`, `stockLocationIds`, `stockTotal`.
- `stockAlertLevel` por `numericFilters` dinámicos (thresholds actuales), no por post-proceso exclusivo.

## Métricas con paginación (status/meta)
- `productCount` global: usar `nbHits` de Algolia.
- `visibleStockTotal` global:
  - no calcular sumando solo la página actual,
  - obtener por consulta agregada separada (backend/materialized view) o deshabilitar ese total global en pantallas paginadas.
