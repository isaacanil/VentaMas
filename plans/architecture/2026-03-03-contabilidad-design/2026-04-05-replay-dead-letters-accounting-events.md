# Replay y Dead Letters de `accountingEvents -> journalEntries`

## Objetivo del slice

Este corte deja una infraestructura mínima operativa para:

- detectar eventos contables que no pudieron proyectarse a `journalEntries`
- registrar esos errores en una colección dedicada
- reprocesar manualmente un `accountingEvent` sin duplicar el asiento

## Colección de dead letters

Los errores de proyección se registran en:

`businesses/{businessId}/accountingEventProjectionDeadLetters/{eventId}`

Cada documento guarda, como mínimo:

- `eventId`, `eventType`
- `projectionStatus`
- `retryable`
- `attemptCount`
- `replayCount`
- `lastAttemptAt`
- `lastReplayRequestedAt`
- `lastReplayRequestedBy`
- `lastError`

Cuando la proyección termina en `projected`, el dead letter del evento se elimina.

## Replay manual

Se expone el callable:

`replayAccountingEventProjection`

Payload mínimo:

```json
{
  "businessId": "business-1",
  "eventId": "purchase.committed__purchase-1"
}
```

Opcional:

```json
{
  "allowProjected": true
}
```

`allowProjected=true` solo debe usarse para reparar eventos cuyo `journalEntry` ya existe pero cuyo `projection.status` quedó desalineado.

## Seguridad e idempotencia

- El replay usa la misma ruta de proyección que el trigger normal.
- Si el `journalEntry` ya existe con el mismo `eventId`, no crea otro asiento.
- En ese caso solo repara `projection.status`, reatacha `journalEntryId` y limpia el dead letter.
- El callable exige autenticación y rol `INVOICE_OPERATOR`.

## Estados esperados

- `projected`: asiento creado o reutilizado con éxito; dead letter limpiado
- `pending_account_mapping`: falta perfil contable o cuentas resolubles; dead letter abierto
- `failed`: error de proyección no mapeable automáticamente; dead letter abierto

## No cubierto en este slice

- replay masivo o batch backfill
- dashboard UI de dead letters
- cola asíncrona dedicada para reprocesos
