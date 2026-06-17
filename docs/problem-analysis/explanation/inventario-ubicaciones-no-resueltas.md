# Ubicaciones sin resolver en Control de Inventario

## 📝 Descripción

### Resumen rápido

- **Fecha de detección:** 2025-12-30
- **Reportado por:** Usuario (Control de Inventario)
- **Impacto actual:** Se muestran IDs o paths de ubicación en lugar de nombres legibles en tabla y modal de lotes.

### Evidencia

- En `InventoryGroupedTable` se usa `locationNamesMap[loc] || shortenLocationPath(loc)`, por lo que el ID aparece mientras se resuelve o cuando la resolución falla.
- En `GroupedLotsModal` se renderiza `locationRaw` aunque `resolvingLocations[locationRaw]` esté activo; el tooltip dice “Resolviendo ubicación…”, pero el tag muestra el ID.
- `resolveLocationLabel` devuelve abreviaciones basadas en IDs cuando no encuentra nombres o cuando hay timeout; `useLocationNames` lo cachea como valor definitivo.

### Pasos para reproducir

1. Abrir Control de Inventario.
2. Filtrar un producto con ubicaciones configuradas.
3. Revisar la columna “Ubicaciones” y abrir “Editar lotes”.
4. Resultado observado: se ven IDs/paths antes o en lugar del nombre resuelto.

## Campos / parámetros

### Datos técnicos relevantes

- `useLocationNames` resuelve claves vía `getItemLocationKey` y guarda resultados en `locationNames`.
- `getLocationKey`/`getItemLocationKey` aceptan objetos con `path`/`pathSegments`, pero no normalizan prefijos de colección (`businesses`, `warehouses`, etc.).
- `resolveLocationLabel` espera claves en formato `warehouseId/shelfId/rowId/segmentId` y consulta `warehouses`, `locations`, `branches`, `shelves`, `rows`, `segments`.
- `exportInventoryToExcel` utiliza `child.locations` ya resueltas o con fallback, por lo que los IDs también pueden salir en el Excel.

### Hipótesis iniciales

1. **Clave incompatible:** si `location` llega como DocumentReference o path completo, `resolveLocationLabel` interpreta segmentos incorrectos y termina devolviendo IDs.
2. **Fallback cacheado:** `resolveLocationLabel` devuelve abreviaciones/IDs cuando no hay nombre o hay timeout y `useLocationNames` lo considera resuelto, por lo que no reintenta.
3. **UI muestra IDs en carga:** aunque `resolvingLocations[loc]` esté activo, los tags renderizan el ID como fallback visible.

## APIs / rutas

- Firestore: `businesses/{businessID}/warehouses`, `locations`, `branches`, `shelves`, `rows`, `segments`.
- `productsStock.location` (modelo) debería ser `warehouseId[/shelfId/rowId/segmentId]`.

## Versionado / compatibilidad

- El contrato activo de `productsStock.location` está documentado como string con IDs; si se guarda DocumentReference o paths con colecciones, el resolver actual no es compatible.
- `getLocationKey` usa `path`/`pathSegments` sin normalizar, rompiendo el contrato esperado por `resolveLocationLabel`.

## Recursos relacionados

- `src/modules/inventory/pages/InventoryControl/hooks/useInventoryLocationNames.ts`
- `src/modules/inventory/pages/InventoryControl/utils/inventoryHelpers.ts`
- `src/modules/inventory/pages/InventoryControl/utils/buildInventoryGroups.ts`
- `src/modules/inventory/pages/InventoryControl/components/InventoryGroupedTable/InventoryGroupedTable.tsx`
- `src/modules/inventory/pages/InventoryControl/components/GroupedLotsModal/GroupedLotsModal.tsx`
- `src/modules/inventory/pages/InventoryControl/utils/exportInventoryToExcel.ts`
- `docs/inventory/reference/data-model-es.md`

## 🔜 Seguimiento / Próximos pasos

- [ ] Normalizar claves en `getLocationKey`/`getItemLocationKey` para producir siempre `warehouseId/shelfId/rowId/segmentId`.
- [ ] Evitar mostrar IDs en UI: usar “Cargando ubicación…” mientras `resolvingLocations` y “Ubicación sin nombre” cuando no exista etiqueta.
- [ ] Ajustar `resolveLocationLabel` para devolver `null` cuando no encuentra nombres y permitir reintentos en `useLocationNames`.
- [ ] Revisar la persistencia de `productsStock.location` para garantizar formato canónico.

## 📈 Impacto / Trade-offs

- Ocultar IDs reduce señales de depuración; se puede mantener en logs internos si se requiere.
- Normalizar rutas implica validar datos antiguos y posibles migraciones o capas de compatibilidad.

## Resultado / Notas de cierre

- Pendiente.
