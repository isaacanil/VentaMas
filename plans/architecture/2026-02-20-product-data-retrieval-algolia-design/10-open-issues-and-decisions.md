# Open Issues and Decisions Checklist

## Objetivo
Checklist operativo para convertir el diseño en decisiones cerradas y tareas ejecutables.

## A. Decisiones de arquitectura (bloqueantes)
- [ ] Confirmar alcance final de pantallas fase 1:
  - [ ] `/sales`
  - [ ] `/inventory/items`
  - [ ] `/inventory/warehouses/warehouse/:warehouseId`
  - [ ] `/inventory/warehouses/products-stock`
- [ ] Confirmar que `/sales` y `/inventory/items` comparten `ProductSearchService`.
- [ ] Confirmar que `warehouses` queda Firestore-first en fase 1.

## B. Barcode + Batch (consistencia funcional)
- [ ] Aprobar cambio de comportamiento: escáner en `sales` validará lotes igual que clic manual.
- [ ] Definir contrato de `BatchAvailabilityService`.
- [ ] Definir política cuando hay 1 lote vencido (auto-open modal vs bloqueo).
- [ ] Confirmar compatibilidad con barcode de peso variable.
- [ ] Definir pruebas E2E mínimas para scanner + batch.

## C. Filtros y visibilidad en Algolia
- [ ] Confirmar `isVisible=true` como filtro base obligatorio en `sales/items`.
- [ ] Confirmar lista final de filtros query-time:
  - [ ] category
  - [ ] activeIngredients
  - [ ] trackInventory
  - [ ] pricing.tax
  - [ ] promotionActive
  - [ ] restrictSaleWithoutStock
  - [ ] stockLocationIds
  - [ ] stockTotal
- [ ] Confirmar estrategia final de `stockAlertLevel`:
  - [ ] numericFilters dinámicos por thresholds
  - [ ] badge visual en cliente

## D. Status/meta con paginación
- [ ] Confirmar fuente de `productCount` (`nbHits`).
- [ ] Decidir `visibleStockTotal` global:
  - [ ] consulta agregada dedicada
  - [ ] o remover total global en vista paginada

## E. Sincronización, backfill y costos
- [ ] Confirmar implementación de indexación con Cloud Functions propias.
- [ ] Definir batch size de backfill inicial.
- [ ] Definir estrategia de checkpoint/reanudación.
- [ ] Definir segunda pasada incremental (`updatedAt >= startedAt`).
- [ ] Definir hashing/fingerprint para evitar writes redundantes.
- [ ] Definir umbrales/rate-limit para no saturar cuotas.

## F. Offline y resiliencia
- [ ] Confirmar fallback oficial: Algolia -> Firestore cache -> cache local.
- [ ] Definir UX offline para barcode sin match local.
- [ ] Definir qué acciones quedan bloqueadas offline.

## G. Seguridad multi-tenant
- [ ] Confirmar emisión de secured API key desde backend.
- [ ] Confirmar restricciones:
  - [ ] `filters: businessID:{id}`
  - [ ] `validUntil` corto
  - [ ] índices permitidos
- [ ] Definir rotación y renovación de key en frontend.

## H. Implementación por fases (go/no-go)
- [ ] Fase 1: `SaleExperimental` con Algolia + fallback.
- [ ] Fase 2: migrar `/sales`.
- [ ] Fase 2: migrar `/inventory/items`.
- [ ] Fase 3: evaluar `/inventory/warehouses/products-stock` con métrica real.

## I. Criterios de aceptación
- [ ] Sin regresión en scanner.
- [ ] Sin regresión en lotes (`ProductBatchModal` + persistencia `batchInfo`).
- [ ] Mejora de P95 en primera carga de `sales/items`.
- [ ] Reducción de lecturas Firestore por sesión.
