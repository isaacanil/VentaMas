# Product Retrieval Architecture (Modular)

## Objetivo
Separar el diseño en documentos pequeños, cohesionados y reutilizables para reducir acoplamiento y facilitar implementación por módulos.

## Principios
- Modularidad: cada pantalla y cada concern técnico en su propio documento.
- Bajo acoplamiento: decisiones compartidas separadas de detalles de pantalla.
- Alta cohesión: cada archivo cubre un tema único.
- Abstracción: contratos comunes antes que detalles de implementación.
- Simplicidad: fases incrementales con fallback.
- Reutilización: `ProductSearchService` para `sales` e `inventory/items`.

## Mapa de documentos
- `01-current-state.md`: arquitectura actual (as-is).
- `02-shared-target-architecture.md`: arquitectura objetivo compartida.
- `03-screen-sales.md`: diseño específico `/sales` (incluye `?mode=sale`).
- `04-screen-inventory-items.md`: diseño específico `/inventory/items`.
- `05-screen-inventory-warehouses-detail.md`: diseño específico `/inventory/warehouses/warehouse/:warehouseId`.
- `06-screen-inventory-warehouses-products-stock.md`: diseño específico `/inventory/warehouses/products-stock`.
- `07-sync-backfill-and-partial-updates.md`: sincronización, backfill y partial updates.
- `08-offline-and-security.md`: offline, llaves, aislamiento multi-tenant.
- `09-migration-roadmap-and-metrics.md`: plan de migración, métricas y riesgos.
- `10-open-issues-and-decisions.md`: checklist de decisiones abiertas y tareas de cierre.

## Decisión macro
- Compartir arquitectura entre:
  - `/sales`
  - `/inventory/items`
- Mantener arquitectura especializada (Firestore realtime) en:
  - `/inventory/warehouses/warehouse/:warehouseId`
  - `/inventory/warehouses/products-stock`
