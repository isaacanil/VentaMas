# Sincronización, Backfill y Partial Updates

## Sincronización continua
- Cloud Functions propias:
  - trigger `onWrite` de productos,
  - trigger de stock/lotes para campos agregados.
- Salida: upsert/borrado en Algolia según estado del documento.

## Backfill inicial masivo
1. Job dedicado (Cloud Run Job o Function HTTP protegida).
2. Lectura paginada por cursor (`orderBy(__name__) + limit + startAfter`).
3. Checkpoint en `algoliaReindexJobs/{jobId}` para reanudación.
4. Batch writes en Algolia por bloques.
5. Segunda pasada incremental por `updatedAt >= startedAt` para cerrar ventana de cambio.

## Control de costos
- 1 lectura por producto en corrida principal (evitar relecturas).
- Throttling configurable para no saturar cuota.
- Evitar N consultas por producto para stock; usar agregados.

## Partial updates (detección de cambios)
1. `buildIndexPayload(before)` y `buildIndexPayload(after)`.
2. Deep diff solo sobre campos indexables.
3. Sin cambios indexables: no llamar Algolia.
4. Cambios simples: `partialUpdateObject`.
5. Cambios estructurales complejos: `saveObject` completo del registro.
6. Guardar `indexFingerprint` para evitar escrituras redundantes.
