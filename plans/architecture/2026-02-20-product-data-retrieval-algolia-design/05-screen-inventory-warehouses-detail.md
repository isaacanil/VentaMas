# Pantalla: `/inventory/warehouses/warehouse/:warehouseId`

Ejemplo real:
- `/inventory/warehouses/warehouse/2Wa56WtYgirBu4bYSL7bg`

## Objetivo
Mantener navegación jerárquica y datos realtime de almacenes con mínima latencia operacional.

## Estrategia
- Mantener Firestore realtime como fuente principal.
- No migrar esta pantalla a Algolia en fase 1.

## Razón
- Estructura jerárquica (`warehouse -> shelf -> row -> segment`) y estado operacional
  tienen mejor ajuste con listeners de Firestore.
- La pantalla prioriza navegación y estado vivo de ubicación, no full-text search masivo.

## Optimización
- Escuchar solo el nodo/rama activa (evitar listeners globales innecesarios).
- Mantener caché local de árbol para navegación fluida entre nodos.
