# Auditoria tecnica y funcional de contabilidad y finanzas

Fecha: 2026-05-05
Repo: `C:\Dev\VentaMas`
Alcance: lectura de codigo, rutas, componentes, hooks, servicios, stores, modelos, funciones Cloud Functions, utilidades contables, flujos financieros y documentos existentes.
Restriccion aplicada: no se modifico logica de modelos, datos, migraciones, calculos, pagos ni reglas contables.

## 1. Resumen ejecutivo

VentaMas ya tiene una base contable real: eventos contables (`accountingEvents`), proyeccion a diario (`journalEntries`), catalogo de cuentas, perfiles de contabilizacion, reportes, tesoreria con `cashMovements`, CxC, CxP, compras, gastos, conciliacion bancaria, caja POS, fiscalidad DGII y soporte de moneda/tasa.

La base no esta completa para operacion financiera cerrada. Hay brechas entre documento operacional, tesoreria, fiscalidad y libro mayor:

- Notas de credito de cliente existen en UI/Fiscal/NCF, pero no generan eventos contables ni tienen perfiles base. Impacto: fiscal y saldo cliente pueden cambiar sin reversar AR, ingresos o impuestos en GL.
- Notas de credito de suplidor y sobrepagos existen como `supplierCreditNotes`, pero no generan eventos contables propios ni perfiles base. Impacto: CxP puede quedar correcto operacionalmente y GL no.
- Anulaciones de pagos CxC/CxP si emiten eventos `*.payment.voided`, pero los perfiles base no incluyen esos tipos. Impacto: una anulacion puede quedar como `pending_account_mapping` y no revertir GL por defecto.
- Settlements FX se registran en `accountsReceivableFxSettlements`, pero no hay escritor de `fx_settlement.recorded` ni perfil base. Impacto: ganancias/perdidas cambiarias no quedan contabilizadas automaticamente.
- Write-off de banco crea `cashMovements` de ajuste, pero no evento contable. Impacto: tesoreria cambia y GL no.
- Caja POS y ventas cash usan `cashCountId` como identidad de liquidez cuando no hay `cashAccountId`. Impacto: tesoreria puede mezclar caja operativa con cuenta contable/tesoreria.
- Ruta `/cash-reconciliation` esta registrada dos veces; la primera esta en `Sales.tsx` sin `BusinessFeatureRouteGate`, antes de la ruta treasury-gated. Impacto: posible bypass de disponibilidad `treasury`.

Conclusion: arquitectura apunta bien, pero no hay cierre end-to-end total. Estado recomendado: piloto controlado, no operacion contable completa sin cerrar perfiles/eventos faltantes y reconciliar identidad de caja/banco.

## 2. Evidencia revisada

### Rutas y pantallas

- `src/router/routes/routesName.ts`
- `src/router/routes/routes.tsx`
- `src/router/routes/paths/Accounting.tsx`
- `src/router/routes/paths/CashReconciliation.tsx`
- `src/router/routes/paths/Sales.tsx`
- `src/router/routes/paths/Treasury.tsx`
- `src/router/routes/paths/Setting.tsx`
- `src/router/routes/paths/AccountsPayable.tsx`
- `src/router/routes/paths/AccountReceivable.tsx`
- `src/router/routes/paths/CreditNote.tsx`

### Frontend revisado

- `src/modules/accounting/pages/AccountingWorkspace`
- `src/modules/treasury`
- `src/modules/accountsPayable`
- `src/modules/accountsReceivable`
- `src/modules/cashReconciliation`
- `src/modules/expenses`
- `src/modules/orderAndPurchase`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal`
- `src/firebase/creditNotes`
- `src/firebase/processAccountsReceivablePayments`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks`
- `src/types/accounting.ts`
- `src/types/payments.ts`
- `src/utils/accounting`

### Backend revisado

- `functions/src/index.js`
- `functions/src/shared/accountingSchemas.js`
- `functions/src/app/versions/v2/accounting`
- `functions/src/app/modules/accounting`
- `functions/src/app/modules/accountReceivable`
- `functions/src/app/modules/purchase`
- `functions/src/app/modules/expenses`
- `functions/src/app/modules/treasury`
- `functions/src/app/modules/cashCount`
- `functions/src/app/versions/v2/invoice`
- `functions/src/app/modules/compliance`

### Documentos existentes usados como contexto

- `docs/documentation/inventario-superficies-finanzas-contabilidad.md`
- `plans/architecture/2026-03-03-contabilidad-design/2026-04-18-auditoria-contabilidad-end-to-end-odoo-gap.md`
- `plans/architecture/2026-03-03-contabilidad-design/2026-04-18-auditoria-tesoreria-end-to-end-odoo-gap.md`
- `plans/architecture/2026-03-03-contabilidad-design/2026-04-22-auditoria-qa-finanzas-contabilidad-vitest.md`

## 3. Mapa de superficies

### Contabilidad

Rutas:

- `/accounting`
- `/accounting/journal-book`
- `/accounting/general-ledger`
- `/accounting/manual-entries`
- `/accounting/reports`
- `/accounting/fiscal-compliance`
- `/accounting/period-close`
- alias `/contabilidad/*`

Gate:

- `BusinessFeatureRouteGate feature="accounting"` en `src/router/routes/paths/Accounting.tsx`.

Pantallas:

- `AccountingWorkspace.tsx`
- `JournalBookPanel`
- `GeneralLedgerPanel`
- `ManualEntriesPanel`
- `FinancialReportsPanel`
- `FiscalCompliancePanel`
- `PeriodClosePanel`

Datos principales:

- `businesses/{businessId}/accountingEvents`
- `businesses/{businessId}/journalEntries`
- `businesses/{businessId}/chartOfAccounts`
- `businesses/{businessId}/accountingPostingProfiles`
- `businesses/{businessId}/settings/accounting`
- `businesses/{businessId}/exchangeRates`
- subcolecciones `settings/accounting/history` y `settings/accounting/audit`

Funciones:

- `createManualJournalEntry`
- `reverseJournalEntry`
- `closeAccountingPeriod`
- `getAccountingReports`
- `replayAccountingEventProjection`
- `projectAccountingEventToJournalEntry`
- `syncChartOfAccountsDerivedHistory`
- `syncAccountingPostingProfilesDerivedHistory`
- `syncAccountingSettingsDerivedRecords`
- `syncBankAccountDerivedHistory`
- `syncAccountingExchangeRateReferencesDaily`

### Tesoreria y bancos

Rutas:

- `/treasury`
- `/treasury/bank-accounts`
- `/treasury/accounts/:kind/:accountId`

Pantallas/componentes:

- `TreasuryWorkspace`
- `TreasuryAccountsGrid`
- `TreasuryLedgerPanel`
- `BankStatementImportModal`
- `BankStatementLineModal`
- `BankReconciliationModal`
- `ResolveBankStatementLineModal`
- `InternalTransferModal`
- `AddCashAccountModal`

Datos:

- `businesses/{businessId}/cashMovements`
- `businesses/{businessId}/bankAccounts`
- `businesses/{businessId}/cashAccounts`
- `businesses/{businessId}/internalTransfers`
- `businesses/{businessId}/bankReconciliations`
- `businesses/{businessId}/bankStatementLines`
- `businesses/{businessId}/treasuryIdempotency`

Funciones:

- `createInternalTransfer`
- `previewBankReconciliation`
- `createBankReconciliation`
- `createBankStatementLine`
- `resolveBankStatementLineMatch`

### Caja POS

Rutas:

- `/cash-reconciliation`
- `/cash-register-opening`
- `/cash-register-closure/:id`
- `/cash-register-invoices-overview`

Gate esperado:

- `BusinessFeatureRouteGate feature="treasury"` en `src/router/routes/paths/CashReconciliation.tsx`.

Riesgo de ruta:

- `src/router/routes/paths/Sales.tsx` tambien registra `/cash-reconciliation` sin gate.
- `src/router/routes/routes.tsx` agrega `sales` antes de `cashReconciliation`.

Datos:

- `businesses/{businessId}/cashCounts`
- `businesses/{businessId}/cashMovements`
- `businesses/{businessId}/invoices`
- `businesses/{businessId}/expenses`
- `businesses/{businessId}/accountsReceivablePayments`

Funciones:

- `openCashCount`
- `changeCashCountState`
- `closeCashCount`
- `runCashCountAudit`

### Ventas, facturas y fiscal

Rutas:

- `/sales`
- `/bills`
- `/bills/analytics`
- `/preorders`
- `/credit-note`

Datos:

- `businesses/{businessId}/invoices`
- `businesses/{businessId}/invoiceOutbox`
- `businesses/{businessId}/invoiceCompensations`
- `businesses/{businessId}/creditNotes`
- `businesses/{businessId}/creditNoteApplications`
- `businesses/{businessId}/ncfLedger`
- `businesses/{businessId}/taxReceipt*`

Funciones/servicios:

- `createInvoiceV2`
- `processInvoiceOutbox`
- `processInvoiceCompensation`
- `reserveNcfRange`
- `reserveCreditNoteNcf`
- `syncNcfLedger`
- `processNcfReservation`
- `processNcfLeaseExpiration`
- `reconcileNcfLedger`
- `consumeCreditNotesTx`

### Cuentas por cobrar

Rutas:

- `/account-receivable/list`
- `/account-receivable/info/:id`
- `/account-receivable/receipts`
- `/account-receivable/audit`

Datos:

- `businesses/{businessId}/accountsReceivable`
- `businesses/{businessId}/accountsReceivablePayments`
- `businesses/{businessId}/accountsReceivablePaymentReceipt`
- `businesses/{businessId}/accountsReceivableFxSettlements`
- `businesses/{businessId}/clients`
- `businesses/{businessId}/invoices`

Funciones:

- `createAccountsReceivable`
- `processAccountsReceivablePayment`
- `voidAccountsReceivablePayment`

### Compras y CxP

Rutas:

- `/purchases`
- `/purchases/analytics`
- `/purchases/create`
- `/purchases/update/:id`
- `/purchases/complete/:id`
- `/backorders`
- `/accounts-payable/list`

Datos:

- `businesses/{businessId}/purchases`
- `businesses/{businessId}/vendorBills`
- `businesses/{businessId}/accountsPayablePayments`
- `businesses/{businessId}/supplierCreditNotes`
- `businesses/{businessId}/suppliers`
- `businesses/{businessId}/cashMovements`

Funciones:

- `syncVendorBillFromPurchase`
- `syncPurchaseCommittedAccountingEvent`
- `addSupplierPayment`
- `syncAccountsPayablePayment`
- `voidSupplierPayment`
- `syncPurchaseSupplierCreditNote`

### Gastos

Rutas:

- `/expenses/new`
- `/expenses/update/:id`
- `/expenses/list`

Datos:

- `businesses/{businessId}/expenses`
- `businesses/{businessId}/cashMovements`
- opcional `accountsPayableId` / diferido

Funciones:

- `syncExpenseAccountingEvent`
- `syncExpenseCashMovement`

### Configuracion

Rutas:

- `/settings/accounting`
- `/settings/accounting/chart-of-accounts`
- `/settings/accounting/posting-profiles`
- `/settings/exchange-rates`
- `/settings/tax-receipt`

Datos:

- `settings/accounting`
- `chartOfAccounts`
- `accountingPostingProfiles`
- `exchangeRates`
- `taxReceipt*`

## 4. Flujo contable actual

### Contrato central

Tipos en `functions/src/shared/accountingSchemas.js` y `src/shared/accountingSchemas.js`:

- `invoice.committed`
- `accounts_receivable.payment.recorded`
- `accounts_receivable.payment.voided`
- `customer_credit_note.issued`
- `customer_credit_note.applied`
- `purchase.committed`
- `accounts_payable.payment.recorded`
- `accounts_payable.payment.voided`
- `supplier_credit_note.issued`
- `supplier_credit_note.applied`
- `expense.recorded`
- `cash_over_short.recorded`
- `internal_transfer.posted`
- `manual.entry.recorded`
- `fx_settlement.recorded`

Proyeccion:

- `buildAccountingEvent` construye id, `dedupeKey`, monetario, tesoreria y payload.
- `projectAccountingEventToJournalEntry` escucha `accountingEvents`.
- `runAccountingEventProjection` carga settings, periodo, perfiles, catalogo y escribe `journalEntries/{eventId}`.
- Si no hay perfil activo o cuenta resoluble, el evento queda con `projection.status = pending_account_mapping`.

Perfiles base en `src/utils/accounting/postingProfiles.ts`:

- Cubiertos: ventas, cobros CxC, compras, pagos CxP, gastos, cash over/short, transferencias internas.
- No cubiertos por seed: anulaciones CxC/CxP, notas de credito cliente, notas de credito suplidor, FX settlement.

## 5. Flujos end-to-end

### 5.1 Venta/factura

Ruta operacional:

- UI venta/factura crea factura.
- `createInvoiceV2` crea documento y tareas outbox.
- `processInvoiceOutbox` ejecuta tareas: caja, CxC, nota de credito si aplica.
- `finalize.service.js` consume NCF si estaba reservado, crea evento `invoice.committed` si accounting rollout esta activo y marca factura `committed`.

Tesoreria:

- `buildInvoicePosCashMovements` genera `cashMovements` de `sourceType = invoice_pos`.
- Si no hay arreglo de metodos de pago, usa fallback a cash desde snapshot de pago.

Contabilidad:

- `invoice.committed` tiene perfil base.
- Proyeccion GL depende de perfiles activos y cuentas.

Riesgos:

- Fallback de pago a cash puede clasificar tarjeta/transferencia como efectivo si falta estructura de metodos.
- Movimientos cash de factura pueden tener `cashCountId` sin `cashAccountId`; tesoreria los normaliza usando `cashCountId` como `accountId`.

### 5.2 Nota de credito cliente

Ruta operacional:

- `fbAddCreditNote.ts` reserva NCF con `reserveCreditNoteNcf`.
- Luego escribe `businesses/{businessId}/creditNotes/{id}` desde frontend.
- `consumeCreditNotesTx` descuenta saldo y crea `creditNoteApplications`.
- `processInvoiceCompensation` puede restaurar disponibilidad y borrar aplicaciones.

Tesoreria:

- No debe crear caja/banco por aplicacion de nota, porque no hay efectivo.

Contabilidad:

- Tipos existen: `customer_credit_note.issued`, `customer_credit_note.applied`.
- Reportes saben etiquetarlos.
- No se encontro escritor productivo de `accountingEvents` para esos tipos.
- No hay perfiles base para esos tipos.

Riesgo:

- Critico. Documento fiscal y saldo cliente cambian sin asiento automatico.

### 5.3 Cobro CxC

Ruta operacional:

- `fbProcessClientPaymentAR.ts` llama callable `processAccountsReceivablePayment`.
- Backend crea `accountsReceivablePayments`, recibo, actualiza AR/facturas/cliente.
- Si hay pagos multi-moneda, crea `accountsReceivableFxSettlements`.

Tesoreria:

- `buildReceivablePaymentCashMovements` crea `cashMovements` `sourceType = receivable_payment` para cash/card/transfer.
- `creditNote` no produce cash movement, correcto.

Contabilidad:

- Emite `accounts_receivable.payment.recorded`.
- Tipo tiene perfil base.

Riesgos:

- `fbProcessClientPaymentAR.ts` consume notas de credito despues del callable desde frontend, en `catch` solo loguea. Si el consumo falla, el pago puede quedar procesado sin aplicacion de nota completa.
- FX settlement se guarda como documento, pero no genera `fx_settlement.recorded`.

### 5.4 Anulacion de cobro CxC

Ruta operacional:

- `voidAccountsReceivablePayment` restaura AR/facturas/cliente.
- Marca settlements FX como `void`.
- Crea movimientos reversos con `sourceType = receivable_payment_void`.

Tesoreria:

- Reverso existe en `cashMovements`.
- `TreasuryLedgerPanel` reconoce `receivable_payment_void`.

Contabilidad:

- Emite `accounts_receivable.payment.voided` con `reversalOfEventId`.
- No hay perfil base para `accounts_receivable.payment.voided`.

Riesgos:

- Alto. Void queda emitido, pero no proyecta por defecto.
- `usePaymentsForCashCount.ts`, `CashCountMetaData.tsx` y `runCashCountAudit.controller.js` suman `receivable_payment`, no `receivable_payment_void`. Un cobro anulado puede seguir inflando cuadre si el cierre depende de esas sumas.

### 5.5 Compra y vendor bill

Ruta operacional:

- Compra se crea/completa en modulos de purchase.
- `syncVendorBillFromPurchase` deriva vendor bill.
- `fromPurchase.ts` tambien existe en frontend como constructor/proyeccion cliente.

Contabilidad:

- `syncPurchaseCommittedAccountingEvent` emite `purchase.committed` cuando compra entra a estado comprometido.
- Tiene perfiles base.

Riesgos:

- Hay doble presion de derivacion frontend/backend alrededor de vendor bill. Backend debe ser fuente canonica.
- Estados legacy (`completed`, `delivered`, `posted`) y `workflowStatus` conviven; requiere tests de transicion para no duplicar o saltar eventos.

### 5.6 Pago CxP

Ruta operacional:

- `addSupplierPayment` crea pago con idempotencia y validaciones de metodos.
- `syncAccountsPayablePayment` sincroniza vendor bill, purchase payment state y cash movements.
- `voidSupplierPayment` lleva pago a `void`.

Tesoreria:

- `buildAccountsPayablePaymentCashMovements` genera `sourceType = supplier_payment`, `direction = out`.
- `supplierCreditNote` se normaliza como `creditNote` y no genera cash movement, correcto para tesoreria.

Contabilidad:

- Emite `accounts_payable.payment.recorded`.
- Emite `accounts_payable.payment.voided` en transicion a `void`.
- `recorded` tiene perfil base.
- `voided` no tiene perfil base.

Riesgo:

- Alto. Anulacion de pago CxP no revierte GL por defecto.

### 5.7 Nota de credito suplidor / sobrepago

Ruta operacional:

- `syncPurchaseSupplierCreditNote` crea/actualiza `supplierCreditNotes/purchase_overpaid_{purchaseId}` cuando compra queda sobrepagada.
- Aplicaciones/restauraciones via pagos CxP quedan en metadata de pagos.

Contabilidad:

- Tipos existen: `supplier_credit_note.issued`, `supplier_credit_note.applied`.
- No se encontro escritor productivo de eventos para esos tipos.
- No hay perfiles base.

Riesgo:

- Critico. Credito suplidor puede existir y aplicarse sin asiento propio.

### 5.8 Gastos

Ruta operacional:

- UI de gastos escribe `expenses`.
- `syncExpenseAccountingEvent` emite `expense.recorded` cuando estado entra a activo/posteado/completado/pagado.
- `syncExpenseCashMovement` crea o borra movimiento de tesoreria si el gasto es inmediato.

Tesoreria:

- Diferido/CxP/pending no impacta cash movement.
- Cash/card/transfer si impactan.

Contabilidad:

- `expense.recorded` tiene perfiles base.

Riesgos:

- Correcto como base. Falta revisar con datos reales si gasto diferido tambien produce vendor bill/CxP o queda solo como metadata `accountsPayableId`.

### 5.9 Caja POS

Ruta operacional:

- Apertura/cierre de caja con `openCashCount`, `changeCashCountState`, `closeCashCount`.
- Cierre emite `cash_over_short.recorded` cuando hay discrepancia y rollout contable activo.

Tesoreria:

- Caja lee `cashMovements` por `cashCountId`.
- `runCashCountAudit` recalcula con `invoice_pos`, `receivable_payment` y `expense`.

Contabilidad:

- `cash_over_short.recorded` tiene perfil base.

Riesgos:

- No incluye `receivable_payment_void` en sumas principales.
- `cash_over_short.recorded` lleva `cashCountId`, pero no necesariamente `cashAccountId`.
- Duplicidad de ruta `/cash-reconciliation` puede saltar gate `treasury`.

### 5.10 Transferencia interna

Ruta operacional:

- `createInternalTransfer` valida idempotencia, periodo abierto, saldo origen y sobregiro.
- Crea dos `cashMovements`.
- Emite `internal_transfer.posted`.

Contabilidad:

- Tiene perfil base.

Riesgos:

- Buen cierre actual. Requiere mantener identidad clara `cashAccountId` vs `cashCountId`.

### 5.11 Conciliacion bancaria

Ruta operacional:

- `previewBankReconciliation` calcula balance libro desde `cashMovements`.
- `createBankReconciliation` crea `bankReconciliations` y `bankStatementLines`, y marca movimientos elegibles como reconciliados.
- `resolveBankStatementLineMatch` resuelve lineas pendientes por match exacto o write-off.

Tesoreria:

- Write-off crea `cashMovements/{bsladj_statementLineId}` con `sourceType = bank_statement_adjustment`.

Contabilidad:

- No se encontro evento contable para `bank_statement_adjustment`.
- No hay `AccountingEventType` equivalente.

Riesgo:

- Alto. Banco puede cuadrar en tesoreria con ajuste que no existe en GL.

### 5.12 Tasa de cambio y FX

Ruta operacional:

- `syncAccountingSettingsDerivedRecords` deriva `exchangeRates` desde `settings/accounting`.
- `syncAccountingExchangeRateReferencesDaily` trae referencias de mercado.
- `accountingRollout.util.js` normaliza moneda, snapshot y tasa segun operacion.
- CxC genera `accountsReceivableFxSettlements`.

Contabilidad:

- Tipo `fx_settlement.recorded` existe.
- Reportes y UI conocen etiqueta/modulo.
- No se encontro escritor productivo del evento.
- No hay perfil base.

Riesgo:

- Alto. Ganancia/perdida cambiaria no entra al GL automaticamente.

## 6. Hallazgos priorizados

### Critico 1. Notas de credito cliente no llegan a GL

Evidencia:

- `src/firebase/creditNotes/fbAddCreditNote.ts`
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.js`
- `functions/src/shared/accountingSchemas.js`
- `src/utils/accounting/postingProfiles.ts`

Impacto:

- NCF y saldo cliente pueden estar correctos.
- Diario, mayor, balance y reportes financieros quedan incompletos.
- Riesgo fiscal-contable: documento fiscal con efecto economico no contabilizado.

Correccion esperada:

- Mover alta de nota de credito a callable/backend transaccional o trigger robusto.
- Emitir `customer_credit_note.issued`.
- Emitir `customer_credit_note.applied` al aplicar.
- Agregar perfiles base y pruebas de proyeccion.

### Critico 2. Notas de credito suplidor no llegan a GL

Evidencia:

- `functions/src/app/modules/purchase/functions/syncPurchaseSupplierCreditNote.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/shared/accountingSchemas.js`
- `src/utils/accounting/postingProfiles.ts`

Impacto:

- Sobrepago/saldo a favor puede existir sin asiento.
- Aplicacion de credito puede reducir pago/CxP sin traza contable separada.

Correccion esperada:

- Emitir `supplier_credit_note.issued`.
- Emitir `supplier_credit_note.applied`.
- Definir perfiles por naturaleza de compra y aplicacion.

### Critico 3. Anulaciones de pagos emiten eventos sin perfiles base

Evidencia:

- `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `src/utils/accounting/postingProfiles.ts`

Impacto:

- Eventos `accounts_receivable.payment.voided` y `accounts_payable.payment.voided` quedan sin ruta base de contabilizacion.
- Riesgo de GL que conserva cobro/pago original despues del void.

Correccion esperada:

- Agregar perfiles base inversos para void.
- Probar `reversalOfEventId`, montos, cuentas y periodo.

### Alto 4. FX settlement sin asiento

Evidencia:

- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/shared/accountingSchemas.js`
- `src/utils/accounting/accountingEvents.ts`
- `src/utils/accounting/postingProfiles.ts`

Impacto:

- Diferencias cambiarias realizadas quedan como documento auxiliar, no GL.

Correccion esperada:

- Emitir `fx_settlement.recorded` por settlement.
- Agregar perfiles base para ganancia/perdida FX.
- Definir tratamiento por moneda funcional/documento.

### Alto 5. Write-off bancario no tiene evento contable

Evidencia:

- `functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.js`
- `src/types/accounting.ts`
- `src/utils/accounting/postingProfiles.ts`

Impacto:

- Banco puede cuadrar en tesoreria y no en contabilidad.

Correccion esperada:

- Crear evento contable para ajuste bancario o reutilizar `manual.entry.recorded` con enlace controlado.
- Agregar perfiles/cuentas para comisiones, diferencia bancaria, otros.

### Alto 6. Identidad de caja mezcla `cashCountId` y `cashAccountId`

Evidencia:

- `functions/src/app/versions/v2/accounting/utils/cashMovement.util.js`
- `src/modules/treasury/utils/records.ts`
- `functions/src/app/modules/cashCount/functions/closeCashCount.js`

Impacto:

- Movimientos de venta/caja sin `cashAccountId` se agrupan por `cashCountId`.
- Cuenta de efectivo configurada y caja operativa quedan acopladas.

Correccion esperada:

- Resolver cuenta de efectivo canonica al abrir caja o al registrar venta.
- Mantener `cashCountId` como dimension operacional, no como cuenta.

### Alto 7. `/cash-reconciliation` puede saltar gate treasury

Evidencia:

- `src/router/routes/paths/Sales.tsx`
- `src/router/routes/paths/CashReconciliation.tsx`
- `src/router/routes/routes.tsx`

Impacto:

- La ruta se registra primero desde ventas sin `BusinessFeatureRouteGate`.

Correccion esperada:

- Eliminar duplicado de `Sales.tsx` o envolverlo con el mismo gate.
- Agregar test de registro/ruta si existe harness.

### Medio 8. Tipos de `cashMovements` no estan alineados

Evidencia:

- `src/types/accounting.ts` incluye `receivable_payment_void`, `internal_transfer`, `manual_adjustment`, `bank_reconciliation`, `opening_balance`.
- `src/types/payments.ts` no incluye varios de esos source types.

Impacto:

- Casts, normalizadores o UI pueden quedar inconsistentes.

Correccion esperada:

- Unificar tipo compartido de source types para tesoreria.

### Medio 9. Cierre/auditoria de caja ignora movimientos void CxC

Evidencia:

- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.ts`
- `src/domain/cashCount/cashCountMetaData.ts`
- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`

Impacto:

- Cobros CxC anulados pueden quedar en totales si el calculo usa solo `receivable_payment`.

Correccion esperada:

- Incluir `receivable_payment_void` como salida/reduccion o calcular por signo de `cashMovements`.

### Medio 10. Consumo de notas de credito CxC desde frontend no es atomico con pago

Evidencia:

- `src/firebase/processAccountsReceivablePayments/fbProcessClientPaymentAR.ts`

Impacto:

- Pago puede completarse y fallo posterior de consumo de nota queda solo en `console.error`.

Correccion esperada:

- Consumir notas de credito en el callable de pago o en una tarea backend idempotente.

### Medio 11. Vendor bill tiene derivacion duplicada frontend/backend

Evidencia:

- `src/domain/accountsPayable/vendorBills/fromPurchase.ts`
- `src/firebase/purchase/syncVendorBillFromPurchase.ts`
- `functions/src/app/modules/purchase/functions/syncVendorBillFromPurchase.js`

Impacto:

- Riesgo de divergencia de estado CxP si cliente y backend no construyen exactamente igual.

Correccion esperada:

- Backend como fuente canonica.
- Frontend solo preview/lectura, no autoridad de vendor bill final.

## 7. Cobertura de perfiles base

| Evento | Writer encontrado | Perfil base | Estado |
| --- | --- | --- | --- |
| `invoice.committed` | Si | Si | Operable |
| `accounts_receivable.payment.recorded` | Si | Si | Operable |
| `accounts_receivable.payment.voided` | Si | No | Riesgo alto |
| `customer_credit_note.issued` | No | No | Brecha critica |
| `customer_credit_note.applied` | No | No | Brecha critica |
| `purchase.committed` | Si | Si | Operable |
| `accounts_payable.payment.recorded` | Si | Si | Operable |
| `accounts_payable.payment.voided` | Si | No | Riesgo alto |
| `supplier_credit_note.issued` | No | No | Brecha critica |
| `supplier_credit_note.applied` | No | No | Brecha critica |
| `expense.recorded` | Si | Si | Operable |
| `cash_over_short.recorded` | Si | Si | Operable con caveat de cuenta cash |
| `internal_transfer.posted` | Si | Si | Operable |
| `manual.entry.recorded` | Callable directo | No aplica seed | Operable manual |
| `fx_settlement.recorded` | No | No | Brecha alta |

## 8. Riesgos funcionales por modulo

### Contabilidad

- Proyeccion robusta cuando hay perfil/cuenta.
- Reportes consumen `journalEntries`; si evento no proyecta, reporte no ve el impacto.
- Reversas manuales de `reverseJournalEntry` escriben asiento reverso, pero no evento `accountingEvents`; trazabilidad contable queda en journal, no en event stream.

### Tesoreria

- `cashMovements` es la fuente efectiva de liquidez.
- Conciliacion bancaria se apoya en `cashMovements`, correcto para tesoreria.
- Write-off cambia liquidez sin GL.
- `liquidityLedger` legacy no aparece como fuente principal actual; evitar revivirlo sin migracion clara.

### Caja POS

- Integracion a `cashMovements` existe.
- Void CxC no entra en calculos principales observados.
- Identidad cash debe separarse: caja operativa (`cashCountId`) vs cuenta financiera (`cashAccountId`).

### Fiscal

- NCF y DGII tienen rutas propias.
- Credit note fiscal existe.
- Falta cierre contable del documento fiscal.

### CxC

- Cobro normal fuerte: AR, recibo, tesoreria, accounting event.
- Void operativo existe.
- Credit note y FX son los huecos.

### CxP

- Pago normal fuerte: idempotencia, cash movement, accounting event.
- Void emite evento pero sin perfil base.
- Supplier credit note hueco.

### Gastos

- Diferido vs inmediato bien separado en cash movement.
- Falta confirmar si diferido crea/actualiza CxP canonico en todos los caminos.

## 9. Validaciones ejecutadas

Objetivo: verificar sin tocar logica critica.

### `npm run lint:fast`

Resultado: paso.

- `oxlint src functions/src -f stylish`
- 0 errores.
- 224 warnings existentes.

Warnings relevantes al alcance:

- `functions/src/app/modules/treasury/functions/createBankReconciliation.js`: `bankAccountRef` declarado y no usado.
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`: import no usado.
- `functions/src/app/modules/purchase/functions/voidSupplierPayment.js`: imports no usados.
- `src/modules/accounting/pages/AccountingWorkspace/components/PeriodClosePanel.tsx`: multiples styled/components no usados.
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingBackendReports.ts`: parametro no usado.
- `src/modules/treasury/hooks/useTreasuryWorkspace.ts`: `variance` no usado.

### `npm run test:run:functions -- functions/src/app/versions/v2/accounting/utils/cashMovement.util.test.js functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.test.js functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.test.js functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.test.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.test.js`

Resultado: paso.

- Test files: 5 passed.
- Tests: 25 passed.
- Duracion: 176.06s.

### `npm run typecheck`

Resultado: fallo por memoria de Node, sin errores TypeScript impresos.

- Comando: `tsc --noEmit --project tsconfig.json`
- Error: `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`
- Ocurrio cerca de 2GB heap.

Reintento:

- Comando: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit --project tsconfig.json`
- Resultado: excedio tiempo razonable sin salida; proceso `node` detenido manualmente.

Lectura: typecheck queda bloqueado por memoria/rendimiento de herramienta en esta corrida. No confirma errores TS.

## 10. Recomendacion de correccion por fases

### Fase 1. Cerrar integridad GL minima

1. Agregar perfiles base para:
   - `accounts_receivable.payment.voided`
   - `accounts_payable.payment.voided`
2. Tests:
   - evento void CxC proyecta reversa de cobro
   - evento void CxP proyecta reversa de pago
   - `reversalOfEventId` queda enlazado

Razon: los writers ya existen. Es el cierre mas corto y de menor riesgo.

### Fase 2. Notas de credito

1. Backend canonico para crear nota de credito cliente.
2. Evento `customer_credit_note.issued`.
3. Evento `customer_credit_note.applied`.
4. Evento `supplier_credit_note.issued`.
5. Evento `supplier_credit_note.applied`.
6. Perfiles base y tests de proyeccion.
7. Validar DGII/NCF no se rompe.

Razon: mayor brecha fiscal-contable.

### Fase 3. FX

1. Definir modelo contable de ganancia/perdida FX realizada.
2. Emitir `fx_settlement.recorded`.
3. Perfiles base para ganancia/perdida.
4. Reporte de settlements conciliado con GL.

Razon: ya existe documento auxiliar; falta asiento.

### Fase 4. Banco/write-off

1. Definir evento contable para `bank_statement_adjustment`.
2. Agregar cuentas de comisiones/diferencias bancarias.
3. Enlazar `bankStatementLine`, `cashMovement`, `journalEntry`.

Razon: conciliacion bancaria no debe cambiar tesoreria sin GL.

### Fase 5. Caja y tipos

1. Resolver `cashAccountId` canonico en apertura/venta/cierre.
2. Mantener `cashCountId` como dimension.
3. Alinear `CashMovementSourceType`.
4. Recalcular cierre/auditoria por signo de movimientos, no por lista parcial de source types.
5. Corregir duplicidad de `/cash-reconciliation`.

Razon: reduce inconsistencias transversales sin tocar reglas fiscales.

## 11. Checklist de completitud actual

| Area | Estado | Nota |
| --- | --- | --- |
| Catalogo de cuentas | Parcial alto | Existe y se protege, depende de seed/perfiles |
| Perfiles de contabilizacion | Parcial | Faltan void/credit/FX/write-off |
| Diario y mayor | Parcial alto | Funciona sobre `journalEntries`; incompleto si faltan eventos/perfiles |
| Reportes financieros | Parcial | Correctos respecto a journal, no respecto a documentos no contabilizados |
| Ventas | Parcial alto | Factura committed emite evento; credit note falta |
| CxC | Parcial alto | Cobro normal fuerte; void sin perfil; FX/credit note faltan |
| Compras | Parcial alto | Compra committed emite evento; supplier credit falta |
| CxP | Parcial alto | Pago normal fuerte; void sin perfil |
| Gastos | Parcial alto | Directo/diferido razonable; confirmar CxP diferido total |
| Tesoreria | Parcial alto | `cashMovements` fuerte; write-off sin GL; identidad cash pendiente |
| Banco | Parcial | Conciliacion existe; ajustes sin GL |
| Caja POS | Parcial | Movimientos existen; void CxC y cashAccountId pendientes |
| FX | Parcial bajo | Settings/snapshots existen; asiento no |
| Fiscal DGII/NCF | Parcial alto | Fiscal existe; cierre contable de notas falta |
| Reversas | Parcial | Manual reverse existe; eventos void faltan perfil |

## 12. Decisiones recomendadas antes de implementar

- Fuente de verdad de notas de credito: backend, no frontend.
- Fuente de verdad de vendor bill: backend.
- Fuente de verdad de liquidez: `cashMovements`.
- Identidad de caja: `cashAccountId` para cuenta, `cashCountId` para turno/cuadre.
- Eventos contables: todo documento con efecto economico debe emitir evento o asiento manual controlado.
- Perfiles base: ningun writer productivo debe emitir tipo sin perfil seed razonable, salvo decision explicita de bloquear con `pending_account_mapping`.

## 13. No tocado

- No se tocaron modelos.
- No se tocaron migraciones.
- No se tocaron calculos.
- No se tocaron pagos.
- No se tocaron Cloud Functions.
- No se cambio UI.
- No se corrio emulador ni navegador para datos reales.
