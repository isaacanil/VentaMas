# Pantalla: `/sales` (incluye `?mode=sale`)

## Objetivo
Mejorar búsqueda/filtros/rendimiento sin romper:
- scanner de barcode,
- peso variable,
- flujo de lotes/batch,
- reglas de stock estricto.

## Lectura de productos
- Primario: Algolia (`ProductSearchService.searchProducts`).
- Secundario: fallback Firestore (degradado).
- Paginación: `hitsPerPage` + `page` (no cargar catálogo completo).

## Filtros en esta pantalla
- Van por Algolia:
  - `isVisible=true` como base,
  - categorías, ingredientes activos, inventariable, ITBIS,
    promoción, disponibilidad, requirement, ubicaciones.
- `stockAlertLevel`:
  - `numericFilters` dinámicos con thresholds actuales.

## Barcode scan
1. `useBarcodeScanner` captura.
2. `BarcodeResolver.findByBarcode` en Algolia.
3. Si hay match:
   - validar lotes/stock real en Firestore.
   - aplicar lógica unificada con selección manual (cambio respecto al estado actual):
     - sin stock y estricto: bloquear,
     - 1 lote válido: auto-add,
     - múltiple/vencido: abrir `ProductBatchModal`.

Nota:
- Hoy el escáner en `Sale.tsx` hace `addProduct` directo y omite validación de lotes.
- Esta migración incluye corrección de esa deuda para alinear escáner y clic manual.

## Batch/lotes
- Se mantiene `ProductBatchModal` actual.
- Persistencia de `batchInfo`, `productStockId`, `batchId` igual que hoy.

## StatusMeta con paginación
- `productCount`: usar `nbHits` de Algolia.
- `visibleStockTotal`: no sumar solo los hits de la página actual.
- Opciones:
  - consulta agregada dedicada,
  - o retirar ese total global en vista paginada y mantener solo métricas de página.
