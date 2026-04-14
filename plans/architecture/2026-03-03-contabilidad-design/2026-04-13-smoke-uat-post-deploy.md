# Smoke/UAT post-deploy contabilidad

Estado: `ACTIVE`

Fecha base: `2026-04-13`

Proyecto Firebase activo verificado localmente: `ventamaxpos`

Objetivo: validar en datos reales que el flujo operativo, tesorería y contabilidad queden consistentes después del deploy reciente, sin depender solo de pruebas unitarias.

## Alcance de esta pasada

Flujos a validar:

1. `purchase -> vendorBill -> pago parcial -> anulacion`
2. `expense` pagado en `cash`
3. `expense` pagado en `bank`
4. `bank reconciliation`
5. `manual journal entry`
6. `close accounting period`

No incluye todavía:

- `processInvoiceOutbox` con tareas reales de outbox
- `accounts receivable payment` full-success en datos reales
- `backfillAccountingCore.js` sobre negocio productivo

## Regla operativa

Este smoke debe ejecutarse primero en:

- un negocio piloto controlado, o
- un negocio interno de pruebas en `ventamaxpos`

No usar un negocio productivo con documentos reales sin antes confirmar:

- `businessId`
- si el negocio está dentro del rollout contable
- que el operador entiende que se crearán documentos reales en Firestore

## Preparación

### 1. Confirmar proyecto CLI

```powershell
npx -y firebase-tools@latest use
```

Resultado esperado:

- salida igual a `ventamaxpos`

### 2. Confirmar functions críticas desplegadas

Esta pasada de smoke asume que ya están desplegadas:

- `addSupplierPayment`
- `voidSupplierPayment`
- `syncAccountsPayablePayment`
- `syncVendorBillFromPurchase`
- `syncPurchaseCommittedAccountingEvent`
- `syncExpenseAccountingEvent`
- `syncExpenseCashMovement`
- `createInternalTransfer`
- `createBankReconciliation`
- `processAccountsReceivablePayment`
- `processInvoiceOutbox`
- `projectAccountingEventToJournalEntry`
- `replayAccountingEventProjection`
- `closeCashCount`
- `createManualJournalEntry`
- `closeAccountingPeriod`
- `getAccountingReports`
- `reverseJournalEntry`

### 3. Datos mínimos que deben existir en el negocio de prueba

- una cuenta bancaria activa en `businesses/{businessId}/bankAccounts`
- una caja/cuenta de efectivo operable
- un cuadre abierto para pruebas en efectivo, si el flujo usa `cash`
- catálogo contable activo con cuentas base
- settings contables con rollout activo

## Evidencia a revisar en cada flujo

Para cada caso documentar:

- `documentId` creado
- timestamps aproximados
- IDs de `cashMovements`
- IDs de `accountingEvents`
- IDs de `journalEntries`
- resultado esperado vs observado

Colecciones a inspeccionar:

- `businesses/{businessId}/purchases`
- `businesses/{businessId}/vendorBills`
- `businesses/{businessId}/accountsPayablePayments`
- `businesses/{businessId}/expenses`
- `businesses/{businessId}/cashMovements`
- `businesses/{businessId}/bankReconciliations`
- `businesses/{businessId}/accountingEvents`
- `businesses/{businessId}/journalEntries`
- `businesses/{businessId}/accountingPeriodClosures`

## Caso 1: compra -> vendorBill -> pago parcial -> anulación

### Acción

1. Crear o tomar una compra nueva del negocio de prueba.
2. Completar la compra con total simple, por ejemplo `100.00`.
3. Verificar que se materialice el `vendorBill`.
4. Registrar un pago parcial, por ejemplo `40.00`.
5. Anular ese pago.

### Validaciones esperadas

#### Después de completar la compra

- existe `vendorBills/purchase:{purchaseId}`
- `vendorBill.status = approved`
- `vendorBill.approvalStatus = approved`
- `vendorBill.totals.total = 100`
- `vendorBill.totals.paid = 0`
- `vendorBill.totals.balance = 100`
- existe `accountingEvent` tipo `purchase.committed`
- existe `journalEntry` asociado al evento si la proyección ya corrió

#### Después del pago parcial

- existe documento en `accountsPayablePayments`
- `payment.sourceDocumentType = vendorBill`
- `payment.vendorBillId = purchase:{purchaseId}`
- `payment.paymentStateSnapshot.paid = 40`
- `vendorBill.status = partially_paid`
- `vendorBill.totals.paid = 40`
- `vendorBill.totals.balance = 60`
- existe `cashMovement` con:
  - `direction = out`
  - `sourceType = supplier_payment`
  - `sourceDocumentType = vendorBill` o rastro canónico en metadata
- existe `accountingEvent` tipo `accounts_payable.payment.recorded`
- existe `journalEntry` proyectado del pago

#### Después de anular el pago

- `accountsPayablePayments/{paymentId}.status = void`
- `vendorBill.status = approved`
- `vendorBill.totals.paid = 0`
- `vendorBill.totals.balance = 100`
- existe `accountingEvent` tipo `accounts_payable.payment.voided`
- existe `journalEntry` de reversa o contrapartida según proyección

### Criterio de pase

- el saldo del `vendorBill` vuelve exactamente a `100`
- no quedan `cashMovements` duplicados
- no quedan dos eventos de pago activo para el mismo pago

## Caso 2: gasto pagado en cash

### Acción

1. Crear un gasto pequeño pagado en efectivo.
2. Asociarlo a una caja operable o cuadre abierto.

### Validaciones esperadas

- el gasto queda guardado con referencia explícita a caja/cash account
- existe `cashMovement`:
  - `direction = out`
  - `sourceType = expense`
  - `method = cash`
- existe `accountingEvent` tipo `expense.recorded`
- el payload contable refleja `settlementTiming = immediate`
- el payload contable refleja `documentNature` consistente con la categoría
- existe `journalEntry` proyectado

### Criterio de pase

- no se acepta gasto en cash sin fuente de tesorería
- el egreso impacta caja y contabilidad al mismo tiempo lógico

## Caso 3: gasto pagado en bank

### Acción

1. Crear un gasto pequeño pagado con transferencia o banco.
2. Seleccionar una `bankAccount` activa.

### Validaciones esperadas

- el gasto guarda `bankAccountId`
- existe `cashMovement`:
  - `direction = out`
  - `impactsBankLedger = true`
  - `bankAccountId` correcto
- existe `accountingEvent` tipo `expense.recorded`
- existe `journalEntry` proyectado

### Criterio de pase

- el gasto no intenta usar `cashCountId` cuando es bancario
- no queda movimiento huérfano sin banco

## Caso 4: conciliación bancaria

### Acción

1. Ejecutar conciliación sobre una cuenta bancaria activa.
2. Usar una fecha de extracto y balance de estado conocidos.

### Validaciones esperadas

- existe documento en `bankReconciliations`
- `bankReconciliation.bankAccountId` correcto
- `ledgerBalance` calculado
- `variance` consistente con el balance del extracto
- `status = balanced` si diferencia `0`
- `status = variance` si diferencia distinta de `0`
- reintento con la misma `idempotencyKey` no duplica conciliación

### Criterio de pase

- una misma solicitud no crea dos conciliaciones
- el cálculo ignora movimientos futuros o `draft/void`

## Caso 5: asiento manual

### Acción

1. Crear un asiento manual balanceado con dos líneas.
2. Usar fecha del período abierto actual.

### Validaciones esperadas

- existe nuevo documento en `journalEntries`
- `eventType = manual.entry.recorded`
- `status = posted`
- `totals.debit = totals.credit`
- `periodKey` correcto

### Criterio de pase

- un asiento descuadrado debe fallar
- un asiento balanceado debe quedar persistido y consultable

## Caso 6: cierre de período

### Acción

1. Cerrar el período actual o un período de prueba.
2. Reintentar el mismo cierre.
3. Intentar registrar una operación nueva con fecha en ese período, idealmente en staging o negocio de prueba.

### Validaciones esperadas

- existe `accountingPeriodClosures/{periodKey}`
- `status = closed`
- reintento devuelve `reused = true`
- registrar pago/asiento/transferencia en ese período debe fallar con `failed-precondition`

### Criterio de pase

- el período cerrado bloquea mutaciones contables críticas
- el cierre es idempotente

## Secuencia sugerida de ejecución

Orden recomendado:

1. Caso 5 `manual journal entry`
2. Caso 6 `close accounting period`
3. Caso 1 `purchase -> vendorBill -> partial payment -> void`
4. Caso 2 `expense cash`
5. Caso 3 `expense bank`
6. Caso 4 `bank reconciliation`

Motivo:

- primero validar que la capa general contable responde;
- luego subledger `CxP`;
- después gastos/tesorería;
- y al final conciliación.

## Comandos útiles para esta pasada

Ver proyecto activo:

```powershell
npx -y firebase-tools@latest use
```

Si luego decides hacer backfill en negocio controlado:

```powershell
node functions/scripts/backfillAccountingCore.js --service-account C:/ruta/service-account.json --business TU_BUSINESS_ID
```

## Resultado mínimo aceptable para aprobar el smoke

Se aprueba esta pasada solo si:

- los 6 casos pasan
- no hay duplicados por idempotencia
- no hay `vendorBills` con saldo incoherente
- no hay `cashMovements` sin documento fuente
- no hay `accountingEvents` críticos sin `journalEntry`
- no aparecen errores de período en fechas abiertas

## Siguiente paso después de este smoke

Si esta corrida pasa:

1. ejecutar `AR payment` full-success en datos reales
2. ampliar smoke a `processInvoiceOutbox`
3. correr `backfillAccountingCore.js` sobre un negocio controlado
4. hacer checklist de go-live
