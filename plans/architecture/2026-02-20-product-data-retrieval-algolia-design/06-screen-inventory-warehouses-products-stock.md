# Pantalla: `/inventory/warehouses/products-stock`

## Objetivo
Conservar precisión de stock/lote/ubicación y mejorar rendimiento de búsqueda progresivamente.

## Estrategia fase 1
- Firestore realtime como principal:
  - agregados activos de `productStock`,
  - relación con ubicaciones y lotes.
- Filtros operacionales locales sobre dataset agregado de stock activo.

## Estrategia fase 2 (opcional)
- Índice auxiliar en Algolia para búsqueda textual rápida dentro de stock browser
  cuando el volumen lo exija.
- Mantener validación final de stock y detalle de lote en Firestore.

## Criterio de migración
- Solo mover esta pantalla a esquema híbrido si:
  - hay evidencia de latencia en búsqueda del browser,
  - el dataset agregado supera umbrales operativos definidos.
