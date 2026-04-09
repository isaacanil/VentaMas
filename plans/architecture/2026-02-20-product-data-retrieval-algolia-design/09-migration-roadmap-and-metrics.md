# Roadmap y Métricas

## Fase 1
- Implementar capa compartida (`ProductSearchService`) en `SaleExperimental`.
- Mantener fallback Firestore.
- No tocar aún `warehouses`.

## Fase 2
- Migrar `/sales`.
- Migrar `/inventory/items`.
- Validar barcode + batch con pruebas de regresión.

## Fase 3
- Optimizar `/inventory/warehouses/products-stock` solo si métricas lo justifican.

## Métricas de éxito
- P95 de primera carga menor al baseline.
- Menor consumo de lecturas Firestore en `sales/items`.
- Tiempo de búsqueda interactiva estable con catálogos grandes.
- Tasa de fallback controlada.
- 0 regresiones en:
  - barcode,
  - selección de lotes,
  - reglas de stock estricto.

## Riesgos
- Desincronización Firestore/Algolia.
- Diferencia entre stock indexado y stock real.
- Complejidad de thresholds dinámicos.

## Mitigación
- Reindex programado + checksum (`indexFingerprint`).
- Validación final en Firestore antes de confirmar operaciones sensibles.
- Tests E2E de los 4 paths objetivo.
