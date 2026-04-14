# Autoridad backend de secuencia fiscal

> Estado: `draft`
>
> Fecha: `2026-04-14`
>
> Objetivo: arrancar `Etapa 2 / Paso 6` declarando una única autoridad de
> secuencia fiscal y congelando el crecimiento de numeración cliente-side.

## Decisión

La autoridad canónica para reservar secuencias fiscales debe ser backend:

- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- función canónica: `reserveNcf(tx, { businessId, userId, ncfType })`

Razones:

- reserva en transacción
- verifica duplicados contra `invoices`
- actualiza `taxReceipts`
- registra `ncfUsage` en estado `pending`
- ya está integrada al flujo `invoice v2`

## Inventario actual de helpers de numeración

### Backend canónico o reutilizable

- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
  - `reserveNcf`
  - clasificación: `canónico`
- `functions/src/app/modules/taxReceipt/services/getTaxReceipt.js`
  - `getTaxReceiptDocFromTx`
  - clasificación: `reutilizable`

### Backend legacy que no debe seguir creciendo

- `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js`
  - clasificación: `legacy backend`
- `functions/src/app/modules/taxReceipt/services/taxReceiptService.ts`
  - clasificación: `wrapper legacy`
- `functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts`
  - clasificación: `util duplicado legacy`
- `functions/src/app/modules/taxReceipt/utils/rncUtils.ts`
  - clasificación: `legacy mixed helper`

### Frontend solo preview o compatibilidad

- `src/features/taxReceipt/increaseSequence.ts`
  - clasificación: `preview-only`
- `src/features/taxReceipt/taxReceiptSlice.ts`
  - `updateComprobante`
  - `generateNCFCode`
  - `getUpdatedSequenceForInvoice`
  - clasificación: `ui-only / preview-only`

### Frontend que todavía muta secuencia real y debe migrarse primero

- `src/firebase/taxReceipt/fbGetAndUpdateTaxReceipt.ts`
  - clasificación: `legacy mutation path`
  - estado: no aceptar nuevos callers
- `src/firebase/creditNotes/fbAddCreditNote.ts`
  - dependencia actual de `fbGetAndUpdateTaxReceipt`
  - estado: primer candidato a migración

## Regla operativa desde ahora

- no crear nuevos helpers cliente-side para avanzar secuencias
- no agregar nuevos callers a `fbGetAndUpdateTaxReceipt`
- cualquier emisión o reserva nueva debe pasar por backend
- los helpers frontend existentes quedan explícitamente limitados a preview,
  compatibilidad temporal o deuda documentada

## Siguiente movimiento técnico recomendado

Mover la reserva de NCF para notas de crédito fuera de:

- `src/firebase/creditNotes/fbAddCreditNote.ts`

hacia un wrapper backend que reutilice:

- `reserveNcf`

sin cambiar todavía el resto de flujos `taxReceipt` legacy.
