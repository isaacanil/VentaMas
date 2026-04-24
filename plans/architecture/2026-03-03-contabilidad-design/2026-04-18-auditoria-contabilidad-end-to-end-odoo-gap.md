# Auditoría end to end de contabilidad vs VentaMas actual y patrón Odoo

Fecha: 2026-04-18

Scope:

- `accountingEvents`
- `accountingPostingProfiles`
- `chartOfAccounts`
- `journalEntries`
- libro diario
- libro mayor
- asientos manuales
- reversos
- cierres
- cumplimiento fiscal
- reportes
- exportes
- pruebas
- relación frontend / backend / Cloud Functions
- integraciones con ventas, compras, CxP, CxC, gastos, tesorería, notas de crédito y cuadre de caja

Fuentes repo principales:

- `functions/src/app/versions/v2/accounting/accountingEventProjection.service.js`
- `functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.js`
- `functions/src/app/modules/accounting/functions/createManualJournalEntry.js`
- `functions/src/app/modules/accounting/functions/reverseJournalEntry.js`
- `functions/src/app/modules/accounting/functions/closeAccountingPeriod.js`
- `functions/src/app/modules/accounting/functions/getAccountingReports.js`
- `functions/src/app/modules/accounting/utils/accountingReports.util.js`
- `functions/src/app/versions/v2/invoice/services/finalize.service.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js`
- `functions/src/app/modules/purchase/functions/syncPurchaseCommittedAccountingEvent.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/app/modules/purchase/functions/syncPurchaseSupplierCreditNote.js`
- `functions/src/app/modules/expenses/functions/syncExpenseAccountingEvent.js`
- `functions/src/app/modules/cashCount/functions/closeCashCount.js`
- `functions/src/app/modules/treasury/functions/createInternalTransfer.js`
- `src/utils/accounting/accountingEvents.ts`
- `src/utils/accounting/postingProfiles.ts`
- `src/utils/accounting/chartOfAccounts.ts`
- `src/utils/accounting/journalEntries.ts`
- `src/modules/accounting/pages/AccountingWorkspace/AccountingWorkspace.tsx`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingWorkspace.ts`
- `src/modules/accounting/pages/AccountingWorkspace/hooks/useAccountingBackendReports.ts`
- `src/modules/accounting/pages/AccountingWorkspace/utils/accountingOrigin.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`

Fuentes externas Odoo usadas como patrón:

- Bank reconciliation: https://www.odoo.com/documentation/master/applications/finance/accounting/bank/reconciliation.html
- Internal transfers: https://www.odoo.com/documentation/master/applications/finance/accounting/bank/internal_transfers.html
- Payments / outstanding credits: https://www.odoo.com/documentation/19.0/applications/finance/accounting/payments.html
- Credit notes and refunds: https://www.odoo.com/documentation/19.0/applications/finance/accounting/customer_invoices/credit_notes.html

## Resumen ejecutivo

Estado real hoy:

- VentaMas ya no está en fase “solo diseño”. Hay cadena real `evento -> proyección -> journalEntries -> reportes`.
- Ya existen mutaciones backend para asiento manual, reverso, cierre y replay de proyección.
- Ya existen productores reales para `invoice.committed`, `accounts_receivable.payment.recorded`, `accounts_receivable.payment.voided`, `purchase.committed`, `accounts_payable.payment.recorded`, `accounts_payable.payment.voided`, `expense.recorded`, `cash_over_short.recorded` e `internal_transfer.posted`.
- Ya existen libro diario visible, libro mayor backend, balanza, estado de resultados y balance general.

Diagnóstico principal:

- núcleo contable ya existe
- cierre de producto todavía no
- mayor gap ya no es “crear contabilidad”
- mayor gap es cerrar consistencia entre módulos, trazabilidad completa, notas de crédito, FX, política de cierre y un solo criterio entre surfaces frontend y backend

Comparación corta vs Odoo:

- Odoo resuelve bien cuatro piezas que aquí siguen parciales:
  1. notas de crédito como reverso contable formal del documento original
  2. créditos/saldos pendientes como outstanding items aplicables y reconciliables
  3. conciliación bancaria con matching, write-off y pendientes no conciliados
  4. lock dates / cierre con guardrails previos al cierre, no solo bloqueo posterior

## Lo fuerte hoy

### 1. Pipeline base ya operativo

- `finalize.service.js` emite `invoice.committed`.
- `processAccountsReceivablePayment.js` y `voidAccountsReceivablePayment.js` emiten eventos de cobro y reversa.
- `syncPurchaseCommittedAccountingEvent.js` y `syncAccountsPayablePayment.js` emiten compra y pago CxP.
- `syncExpenseAccountingEvent.js`, `closeCashCount.js` y `createInternalTransfer.js` emiten gasto, diferencia de caja y transferencia.
- `projectAccountingEventToJournalEntry.js` dispara `runAccountingEventProjection`.
- `accountingEventProjection.service.js` resuelve perfil, arma líneas, persiste `journalEntries/{eventId}` y manda dead letters cuando falla.

Lectura:

- base técnica correcta
- dirección arquitectónica correcta
- patrón de reverso en asientos manuales también correcto

### 2. Configuración contable ya no es mock

- `chartOfAccounts` existe como colección viva por negocio.
- `accountingPostingProfiles` existe como colección viva por negocio.
- hay seed por defecto de catálogo y perfiles.
- historial derivado existe para settings, cuentas y perfiles.

Lectura:

- configuración ya sirve como source de mapeo
- falta completar cobertura de eventos y ciclos, no inventar otra capa

### 3. Reportes backend ya existen

- `getAccountingReports.js` devuelve `generalLedger` y `financialReports`.
- `accountingReports.util.js` construye ledger posteado, balanza, estado de resultados y balance general.
- `GeneralLedgerPanel.tsx` y `FinancialReportsPanel.tsx` ya consumen backend.

Lectura:

- reportes ya salieron de “plan”
- todavía faltan guardrails de completitud antes de venderlos como cierre de producto

## Hallazgos P0

### 1. Tipos y labels van por delante de productores y perfiles reales

Evidencia:

- `src/utils/accounting/accountingEvents.ts` y `functions/src/shared/accountingSchemas.js` declaran `customer_credit_note.*`, `supplier_credit_note.*` y `fx_settlement.recorded`.
- `src/utils/accounting/postingProfiles.ts` solo trae seeds por defecto para venta, cobro, compra, pago CxP, gasto, diferencia de caja, transferencia interna y asiento manual. No trae seeds por defecto para voids, notas de crédito ni FX.
- `functions/src/app/modules/purchase/functions/syncPurchaseSupplierCreditNote.js` crea / actualiza `supplierCreditNotes`, pero no emite `accountingEvent`.
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.js` consume saldo de nota de crédito y crea `creditNoteApplications`, pero no emite `accountingEvent`.
- búsqueda repo no devuelve productor real para `fx_settlement.recorded`.

Impacto:

- producto aparenta cobertura mayor que la que realmente existe
- notas de crédito y FX quedan fuera del circuito `evento -> asiento -> reporte`
- perfiles por defecto no cubren eventos definidos por contrato
- seed inicial deja huecos exactamente en áreas de corrección/reverso, que son las más sensibles

Gap vs Odoo:

- Odoo trata nota de crédito/refund como reverso formal del documento original y genera el asiento espejo
- aquí existe el vocabulario del evento, pero no el flujo end-to-end equivalente

Recomendación:

- cerrar primero `customer_credit_note.issued/applied`, `supplier_credit_note.issued/applied` y `fx_settlement.recorded`
- exigir que cada `AccountingEventType` productivo tenga:
  - productor real o decisión explícita de no usarlo
  - profile seed mínimo o razón documentada
  - prueba de proyección o prueba de “pending_account_mapping” esperada

### 2. Libro diario y reportes no comparten el mismo motor

Evidencia:

- `AccountingWorkspace.tsx` apaga `includeLedgerRecords` cuando panel activo es `general-ledger` o `financial-reports`.
- `useAccountingWorkspace.ts` escucha Firestore directo para `accountingEvents`, `journalEntries` y `accountingPeriodClosures`, luego arma `ledgerRecords` en cliente con `buildLedgerRecords`.
- `GeneralLedgerPanel.tsx` y `FinancialReportsPanel.tsx` no usan ese cálculo cliente; usan `useAccountingBackendReports` y `getAccountingReports`.
- `JournalBookPanel.tsx` exporta el diario desde `filteredRecords` ya armados en cliente.

Impacto:

- dos criterios de lectura para una misma contabilidad
- riesgo de diferencias entre libro diario, libro mayor y reportes ante bugs de normalización, filtros o paginación
- duplicación de lógica de ledger entre frontend y backend
- mantenimiento caro: cualquier ajuste de semántica contable exige tocar dos superficies

Gap vs Odoo:

- en patrón ERP robusto, diario, mayor y reportes salen del mismo universo de asientos / journal items
- filtros y drilldown pueden variar, pero no cambia el motor semántico

Recomendación:

- mover `JournalBookPanel` al mismo backend report layer o crear endpoint único para journal book
- dejar cálculo cliente solo para preview o fallback temporal, no para surface principal

### 3. Cierre de período es bloqueo posterior, no cierre operativo completo

Evidencia:

- `closeAccountingPeriod.js` solo crea `businesses/{businessId}/accountingPeriodClosures/{periodKey}` si no existe.
- no verifica eventos en `pending_account_mapping`
- no verifica dead letters
- no verifica si hay documentos operativos sin reflejo contable
- no verifica si el período está cuadrado o si el usuario revisó excepciones
- `periodClosure.util.js` solo sirve para impedir nuevas mutaciones futuras sobre ese período

Impacto:

- se puede cerrar un mes con proyecciones fallidas o mapeos pendientes
- el cierre actual protege escritura futura, pero no certifica integridad contable del período
- desde producto, “cerrado” puede significar solo “bloqueado”, no “auditado”

Gap vs Odoo:

- lock dates robustos y cierres sanos se apoyan en revisión previa de pendientes, no solo en candado posterior

Recomendación:

- no parchear rápido aquí
- siguiente paso correcto:
  - preflight de cierre
  - resumen de excepciones por período
  - bloqueo de cierre si existen `failed`, `pending_account_mapping`, dead letters o huecos de origen crítico

## Hallazgos P1

### 4. Trazabilidad `Ver origen` incompleta para source types ya emitidos

Evidencia:

- backend emite `sourceDocumentType` para `cashCount`, `internalTransfer`, `vendorBill`, `bank_reconciliation`, `journalEntry` y otros.
- `src/modules/accounting/pages/AccountingWorkspace/utils/accountingOrigin.ts` solo resuelve:
  - `invoice`
  - `purchase`
  - `expense`
  - `accountsreceivable`
  - `accountsreceivablepayment`
  - `accountspayablepayment`
- todo lo demás cae en `default -> null`.

Impacto:

- asiento existe
- evento existe
- referencia técnica existe
- pero operador no siempre puede saltar al origen desde contabilidad

Recomendación:

- completar rutas para:
  - `cashCount`
  - `internalTransfer`
  - `vendorBill`
  - `bank_reconciliation`
  - `journalEntry`
- si no hay ruta de detalle, mandar al cockpit del módulo con foco prefiltrado

### 5. Exportes existen, pero siguen parciales para cierre de producto

Estado actual:

- `JournalBookPanel`, `GeneralLedgerPanel`, `FinancialReportsPanel` y `PeriodClosePanel` exportan Excel.
- `GeneralLedgerPanel` reconsulta backend con `ledgerPageSize: 100` y avisa cuando exportó solo los primeros 100 movimientos.
- no aparece exporte TXT contable general desde workspace.
- exportes fiscales viven en compliance / DGII, no como parte unificada de cierre contable general.

Impacto:

- Excel ya existe
- exporte masivo de mayor todavía no
- contabilidad y fiscal siguen separadas para salida documental final

Recomendación:

- exporte completo del mayor sin truncar
- decisión explícita sobre TXT fiscales:
  - o quedan solo en fiscal compliance
  - o contabilidad los orquesta con links / estado de generación

### 6. Falta integración formal de vendor bill / supplier credit note al journal

Evidencia:

- `addSupplierPayment.js` y `vendorBill.shared.js` ya manejan `vendorBill` y referencias documentales.
- `syncPurchaseSupplierCreditNote.js` solo materializa `supplierCreditNotes`.
- no aparece evento `supplier_credit_note.issued/applied`.

Impacto:

- CxP tiene piezas operativas
- pero saldo a favor del suplidor queda fuera del journal general
- se rompe comparabilidad con ERP robusto donde refund/vendor credit note sí entra contablemente

Recomendación:

- emitir evento al crear / aplicar saldo a favor
- decidir si el source principal es `supplierCreditNote` o `vendorBill`
- soportar reverso / reapertura si cambia pago o aplicación

### 7. Notas de crédito de clientes siguen fuera del pipeline contable general

Evidencia:

- `creditNotes.service.js` descuenta saldo disponible y crea `creditNoteApplications`.
- no aparece productor real para `customer_credit_note.issued` ni `customer_credit_note.applied`.

Impacto:

- AR operativo sí entiende crédito disponible
- GL no necesariamente entiende cuándo nació y cuándo se consumió ese crédito

Recomendación:

- emitir dos eventos distintos:
  - emisión de nota de crédito
  - aplicación contra factura
- mantener enlace a factura original / NCF modificado / aplicación

## Hallazgos P2

### 8. Política de reverso está mejor que edición directa, pero coverage no es homogéneo

Lo bueno:

- `reverseJournalEntry.js` revierte por contrapartida, marca original como `reversed` y conserva metadata de enlace.
- patrón correcto para ERP.

Lo pendiente:

- mismo principio todavía no está cerrado en todos los documentos correctivos
- notas de crédito deberían entrar a la familia de correcciones formales, no quedar como saldo operativo aislado

### 9. Pruebas core buenas; huecos claros en credit notes, FX y trazabilidad

Bueno:

- hay tests para:
  - projector
  - replay
  - manual entries
  - reverse
  - close period
  - reports
  - invoice finalize
  - AR payment / void
  - purchase committed
  - AP payment
  - expense accounting event
  - cash over/short
  - internal transfer

Huecos visibles:

- no aparece test dedicado para `syncPurchaseSupplierCreditNote.js`
- no aparece flujo contable probado para `customer_credit_note.*`
- no aparece flujo contable probado para `supplier_credit_note.*`
- no aparece flujo contable probado para `fx_settlement.recorded`
- `accountingOrigin.ts` no tiene cobertura equivalente a todos los source types emitidos backend

### 10. Docs del paquete estaban mezclando estado actual con snapshots viejos

Hallazgo:

- `2026-03-23-estado-actual-modulos-contables.md` sigue útil como inventario, pero ya no debe leerse como documento rector porque conserva afirmaciones que hoy quedaron superadas o parciales.

Decisión aplicada en esta corrida:

- no eliminé docs
- no había evidencia suficiente para borrar sin riesgo de perder contexto útil
- sí dejé esta auditoría nueva como referencia vigente y ajusté `README.md` del paquete para priorizarla

## Matriz rápida por frente

| Frente | Estado real | Comentario |
| --- | --- | --- |
| `accountingEvents` | Parcial avanzado | Motor real vivo, pero catálogo de eventos supera productores reales. |
| `postingProfiles` | Parcial avanzado | Config y seeds útiles, cobertura incompleta en voids, credit notes, FX. |
| `chartOfAccounts` | Funcional | Base persistente y usable. |
| `journalEntries` | Funcional parcial | Proyección real + manual + reverso; falta cerrar todos los documentos correctivos. |
| Libro diario | Funcional parcial | Visible y exportable, pero calculado en cliente. |
| Libro mayor | Funcional parcial | Backend real, exporte truncable a 100 filas. |
| Reportes | Funcional parcial | Balanza, ER y BG reales; dependen de completitud del pipeline. |
| Cierre | Básico | Candado posterior, no cierre operativo integral. |
| Fiscal compliance | Parcial avanzado | Vive en módulo propio; no totalmente orquestado como salida final de cierre contable. |
| Excel/TXT/fiscal exports | Parcial | Excel sí; TXT fiscales y cierre integral todavía separados. |
| Ventas | Integrado | `invoice.committed` real. |
| CxC | Integrado parcial | cobro y void sí; credit notes no. |
| Compras | Integrado | `purchase.committed` real. |
| CxP | Integrado parcial | pago y void sí; supplier credits no. |
| Gastos | Integrado | `expense.recorded` real. |
| Tesorería / caja | Integrado parcial | transferencias y cash over/short sí; conciliación robusta sigue aparte. |

## Recomendación de cierre de producto

Orden correcto siguiente:

1. cerrar notas de crédito cliente/suplidor como eventos + asientos + trazabilidad
2. cerrar `fx_settlement.recorded`
3. unificar libro diario con mismo motor backend del mayor/reportes
4. crear preflight real de cierre de período
5. completar `Ver origen` para todos los source types emitidos
6. decidir estrategia única de exportes de cierre contable + fiscal

No recomiendo ahora:

- inventar otra colección contable
- reescribir catálogo de cuentas
- mover toda fiscalidad dentro del workspace contable
- vender “contabilidad cerrada” solo porque ya hay journal, mayor y reportes

## Cambios seguros aplicados en esta corrida

- nueva auditoría end-to-end creada en este paquete
- `README.md` del paquete ajustado para apuntar a esta auditoría como lectura vigente
- sin cambios de lógica
- sin cambios en `functions/`

## Funciones que deberían entrar en próxima ronda si se decide cerrar gaps

- `projectAccountingEventToJournalEntry`
- `replayAccountingEventProjection`
- `closeAccountingPeriod`
- `getAccountingReports`
- productores faltantes de notas de crédito cliente/suplidor
- productor faltante de `fx_settlement.recorded`

