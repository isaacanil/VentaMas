# Firebase Functions operational safety plan

Fecha: 2026-05-05
Scope: `functions/src` en `C:\Dev\VentaMas`.
Modo: auditoria autonoma, sin produccion, sin deploy, sin migraciones, sin borrado, sin push.

## Criterios

- Seguridad operativa: idempotencia, duplicados, errores, validaciones, logs, retries, estados intermedios, escrituras parciales.
- Cambios permitidos: guards obvios, validacion no ambigua, manejo no destructivo, logs claros, tests existentes.
- Cambios bloqueados: reglas fiscales/contables ambiguas, migraciones, reescritura de flujos, cambios que requieran decision de negocio.

## Superficies revisadas

- Entrypoints exportados: `functions/src/index.js`.
- Facturas V2: `createInvoiceV2`, `createInvoiceV2Http`, `createPendingInvoice`, `processInvoiceOutbox`, `attemptFinalizeInvoice`, `processInvoiceCompensation`.
- NCF/DGII: `reserveNcf`, `reserveCreditNoteNcf`, `syncNcfLedger`, `rebuildNcfLedger`, `getNcfLedgerInsights`, `runMonthlyComplianceReport`, `exportDgiiTxtReport`, builders 606/607/608.
- Contabilidad: `projectAccountingEventToJournalEntry`, `runAccountingEventProjection`, `replayAccountingEventProjection`, `reverseJournalEntry`, cierres y asientos manuales.
- CxC: `processAccountsReceivablePayment`, `voidAccountsReceivablePayment`, conciliacion de balances, cash-count audit.
- CxP/compras: `addSupplierPayment`, `voidSupplierPayment`, `syncAccountsPayablePayment`, `syncPurchaseCommittedAccountingEvent`, `syncVendorBillFromPurchase`, credit notes de suplidor.
- Tesoreria: `createInternalTransfer`, `createBankReconciliation`, `createBankStatementLine`, `resolveBankStatementLineMatch`, `treasuryIdempotency`.
- Gastos/cash movements: `syncExpenseAccountingEvent`, `syncExpenseCashMovement`, builders compartidos de `cashMovement.util.js`.
- Triggers derivados: historial de settings contables, perfiles, cuentas bancarias, chart of accounts, inventario, presencia, billing crons.

## Hallazgos

### Alto - `createPendingInvoice` reusa idempotency key sin comparar payload

Archivo: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`.

El flujo calcula `requestHash` y persiste `payloadHash`, pero al encontrar `idempotencyRef` existente retorna `invoiceId` sin comparar hash. Reintento real con misma key y payload distinto puede devolver factura vieja, ocultar una venta distinta y dejar al cliente creyendo que se proceso otro carrito.

Cambio seguro: comparar `payloadHash` existente contra `requestHash` y rechazar mismatch con `HttpsError('already-exists')`. No cambia regla fiscal/contable. Alinea factura V2 con CxC, CxP y tesoreria, que ya comparan hash.

Test: agregar caso en `orchestrator.service.test.js`.

### Alto - conciliacion bancaria permite IDs duplicados de movimiento

Archivos:

- `functions/src/app/modules/treasury/functions/createBankStatementLine.js`
- `functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.js`

`movementIds` se normaliza pero no se valida como conjunto unico. Un payload con `['mov-1', 'mov-1']` puede contar dos veces el mismo `cashMovement` para cuadrar una linea; despues solo se actualiza un documento. Resultado: conciliacion aprobada con total artificial.

Cambio seguro: rechazar `movementIds` duplicados antes de abrir transaccion. No toca reglas contables, solo valida integridad de entrada.

Tests: agregar casos en los dos test files de tesoreria.

### Medio - `reserveCreditNoteNcf` no tiene idempotencia de comando

Archivo: `functions/src/app/modules/taxReceipt/functions/reserveCreditNoteNcf.js`.

Cada retry reserva otro NCF. La funcion audita el uso, pero no liga la reserva a una key de comando o a un `creditNoteId`. El cliente actual reserva antes de crear el id de nota de credito, asi que corregirlo bien requiere contrato frontend/backend.

BLOQUEADO: requiere decision de producto/contrato. Opcion segura futura: generar `creditNoteId` antes de reservar, enviar `idempotencyKey`, y persistir `creditNoteNcfReservations/{idempotencyKey}` en transaccion.

### Medio - `runMonthlyComplianceReport` versiona cada click

Archivos: `runMonthlyComplianceReport.js`, `taxReportRun.service.js`.

Cada llamada genera version nueva por `reportCode + periodKey`. Puede ser correcto como corrida auditable, pero no es idempotente por solicitud. Reintentos de red pueden crear versiones extra.

BLOQUEADO: requiere decision fiscal/operativa. Si cada corrida debe ser intencional, UI debe mandar `runIntentId`; si cada click es version legal, dejar como esta.

### Medio - `createBankReconciliation` puede remarcar movimientos ya conciliados

Archivo: `functions/src/app/modules/treasury/functions/createBankReconciliation.js`.

El preview usa todos los `cashMovements` publicados hasta la fecha. Eso es correcto para ledger balance, pero el mismo set se usa para escribir `reconciliationStatus`, sin separar movimientos ya reconciliados. Cambiarlo puede afectar semantica de conciliacion de cierre.

BLOQUEADO: requiere definir si cierre mensual debe incluir movimientos ya conciliados en balance, en conteo, en escritura, o solo en lectura.

## Cambios aplicados

1. `createPendingInvoice` ahora compara `payloadHash`/`requestHash` cuando reusa `idempotencyKey`.
2. `createPendingInvoice` rechaza un registro idempotente sin `invoiceId` valido.
3. `createBankStatementLine` rechaza `movementIds` duplicados antes de acceso/transaccion.
4. `resolveBankStatementLineMatch` rechaza `movementIds` duplicados antes de acceso/transaccion.
5. Tests agregados para mismatch de hash y duplicados en tesoreria.

## Verificacion ejecutada

PowerShell:

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/modules/treasury/functions/createBankStatementLine.test.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.test.js
npm --prefix functions run build
npm --prefix functions run lint
.\node_modules\.bin\eslint.cmd functions/src/app/versions/v2/invoice/services/orchestrator.service.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/modules/treasury/functions/createBankStatementLine.js functions/src/app/modules/treasury/functions/createBankStatementLine.test.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.test.js
npm run test:run:functions
npm run typecheck
```

Resultados:

- PASS: target tests, 3 files, 15 tests.
- PASS: `npm --prefix functions run build`.
- PASS: lint limitado a archivos tocados.
- FAIL previo/no relacionado: `npm run test:run:functions`, 60 files pass, 2 files fail:
  - `functions/src/app/modules/compliance/services/dgiiMonthlyReportValidation.service.test.js`: `pendingGaps` esperado no aparece.
  - `functions/src/app/modules/treasury/functions/createInternalTransfer.test.js`: periodo cerrado esperado rechazar, pero resuelve `ok: true`.
- FAIL previo/no relacionado: `npm --prefix functions run lint`, errores masivos de indent/no-unused en archivos no tocados.
- INCONCLUSO: `npm run typecheck` termino con codigo `-1` sin diagnostico, despues de varios minutos de CPU.

Deploy no ejecutado por instruccion. Si se aprueba despues:

```powershell
firebase deploy --only "functions:createInvoiceV2,functions:createInvoiceV2Http,functions:createBankStatementLine,functions:resolveBankStatementLineMatch"
```

## No tocado

- No se cambiaron reglas DGII 606/607/608.
- No se cambio secuencia NCF.
- No se cambio contabilizacion/posting profile.
- No se ejecuto deploy.
- No se uso produccion.
- No se borro data.
- No se ejecuto migracion.
- No se hizo push.
