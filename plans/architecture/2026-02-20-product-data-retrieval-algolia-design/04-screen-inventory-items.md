# Pantalla: `/inventory/items`

## Objetivo
Compartir arquitectura con `/sales` para evitar duplicación y mantener consistencia funcional.

## Lectura de productos
- Primario: Algolia.
- Fallback: Firestore.
- Paginación server-side para tabla/lista.

## Búsqueda y filtros
- Búsqueda textual por Algolia.
- Filtros principales por Algolia.
- Mantener filtros visuales en UI conectados al mismo `ProductQuery`.

## Barcode scan en items
- Mantener `useBarcodeScanner`.
- Resolver producto por Algolia (`findByBarcode`).
- Abrir modal de edición del producto encontrado (misma UX actual).
- Fallback a Firestore si Algolia falla.

## Acciones de negocio
- Edición, eliminación, impresión barcode y operaciones CRUD continúan en Firestore.
