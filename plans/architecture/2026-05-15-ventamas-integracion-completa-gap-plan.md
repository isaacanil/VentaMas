# Plan de cierre de integracion completa VentaMas

Fecha: 2026-05-15
Rama revisada: `feat/electronic-tax-receipts`
Alcance: venta -> NCF/e-CF -> 606/607/608 -> caja/tesoreria -> CxC/CxP -> accountingEvents -> journalEntries -> reportes.

## Estado verificado

### Base contable

Estado: parcial alto.

Hecho:

- `accountingEvents` ya alimenta `journalEntries`.
- `getAccountingReports` ya cubre libro mayor y reportes financieros.
- asientos manuales, reversas y cierres existen.
- ventas `invoice.committed`, cobros CxC, anulaciones CxC, compras, pagos CxP, anulaciones CxP, gastos, diferencias de caja, transferencias internas y notas de credito de cliente tienen piezas reales.
- perfiles base para void CxC/CxP y notas de credito de cliente ya existen.

Falta para cierre completo:

- eventos y perfiles GL de notas de credito de suplidor.
- evento/perfil GL de settlement FX realizado.
- evento/perfil GL de write-off bancario.
- `cashAccountId` canonico en ventas POS; hoy el movimiento POS de caja queda ligado a `cashCountId`, no a la cuenta de caja.
- diario principal todavia usa calculo cliente (`buildLedgerRecords`) mientras mayor/reportes usan backend.
- backfill operativo de perfiles nuevos en negocios ya sembrados.

### Fiscal mensual DGII

Estado: parcial alto.

Hecho:

- builders mensuales para `DGII_606`, `DGII_607`, `DGII_608`.
- registry mensual `monthlyCompliancePreviewRegistry`.
- corrida auditable `taxReportRuns`.
- callable `runMonthlyComplianceReport`.
- callable `exportDgiiTxtReport` para TXT 606/607/608.
- tests focales pasaron en esta revision.

Falta para cierre completo:

- UI operativa final para correr, revisar, exportar y reintentar reportes.
- regla explicita para e-CF: `fiscalMode: legacy_ncf | electronic_ecf`.
- validacion de 607/608 con `E31/E32/E34/E45` y no solo `Bxx`.
- RFCE / consumo electronico bajo regla DGII si aplica desde GISYS.
- reconciliacion fiscal vs contable por periodo antes de cierre.

Nota: `STATE-fiscal-compliance.md` esta desactualizado. Dice que 606/608 faltan; el codigo actual ya los tiene.

### Tesoreria y banco

Estado: parcial alto.

Hecho:

- UI de tesoreria ahora lee `cashMovements`, no `liquidityLedger`, como ledger operativo.
- cuentas bancarias/caja, transferencias internas, conciliaciones, lineas de estado bancario y match/write-off existen.
- `createBankStatementLine` y `resolveBankStatementLineMatch` tienen tests.

Falta para cierre completo:

- write-off bancario debe crear evento contable o asiento controlado.
- preview/commit de conciliacion debe quedar completamente consistente con GL.
- reglas de sobregiro y fondos disponibles deben quedar canonicas backend + UI.
- caja POS debe propagar `cashAccountId`, no solo `cashCountId`.

### CxC

Estado: alto.

Hecho:

- cobro normal fuerte: documento, cash movement, accounting event.
- void CxC emite reversa y perfiles base existen.
- notas de credito cliente emiten `customer_credit_note.issued` y `customer_credit_note.applied`.

Falta para cierre completo:

- UAT con datos reales: factura -> CxC -> cobro -> void -> nota de credito -> GL -> reportes.
- FX settlement a GL.

### CxP / compras

Estado: parcial alto.

Hecho:

- compra y pago a suplidor emiten eventos contables.
- void CxP emite evento y perfiles base existen.
- sobrepago genera `supplierCreditNotes`.

Falta para cierre completo:

- `supplierCreditNotes` no emite `supplier_credit_note.issued/applied`.
- faltan perfiles base para esos eventos.
- falta decidir vendor bill como fuente canonica o proyeccion derivada.
- UAT compra -> CxP -> pago -> void -> supplier credit -> GL.

### e-CF / GISYS

Estado: primer corte backend, no listo para piloto real.

Hecho en diff actual:

- secreto `GISYS_FACT_CLIENT_TOKEN`.
- modulo `functions/src/app/modules/electronicTaxReceipts`.
- config resolver GISYS.
- mapper VentaMas -> `IssueDocumentPayload`.
- cliente HTTP `POST /v1/ecf/issue`.
- outbox task `issueElectronicTaxReceipt`.
- snapshot electronico en `invoicesV2` y `invoices`.
- `processInvoiceOutbox` carga secreto GISYS.
- build/lint/tests focales pasaron en esta revision.

Falta para cierre completo:

- shadow real: hoy `electronicTaxReceiptEnabled` exige `electronicTransportEnabled=true`; con solo `electronicModelEnabled=true` no se agenda dry-run.
- idempotency key GISYS estable: hoy usa `${invoiceId}:${taskId}`; debe ser `ventamas:{businessId}:{invoiceId}:ecf:{documentType}:v1`.
- tests unitarios nuevos del modulo `electronicTaxReceipts`.
- tests de regresion `createPendingInvoice` para legacy vs shadow vs transport.
- status refresh: consultar GISYS status/XML/PDF/QR despues del issue.
- UI minima de estado e-CF en factura/lista/impresion.
- configuracion por negocio y manejo de secrets por ambiente.
- retry/admin repair sin duplicar e-CF.
- credit notes E34 contra GISYS.
- prueba GISYS local, QA/CERT y luego piloto negocio.

## Riesgos P0

1. Shadow no existe en runtime.
   Impacto: no se puede validar payload sin transporte fiscal. Arreglar antes de llamar GISYS real.

2. Idempotencia e-CF depende de `taskId`.
   Impacto: repair/recreacion de task puede duplicar e-CF en proveedor. Cambiar a key estable por factura/documentType.

3. e-CF se escribe en `data.NCF` sin modo fiscal explicito.
   Impacto: reportes legacy pueden tratar `Exx` como `Bxx` sin semantica separada. Agregar `fiscalMode` y adaptar 607/608.

4. Write-off bancario no llega a GL.
   Impacto: tesoreria puede cuadrar y contabilidad no.

5. Supplier credit notes no llegan a GL.
   Impacto: CxP operativo puede quedar bien y libros no.

6. FX settlement no llega a GL.
   Impacto: ganancias/perdidas cambiarias no entran a reportes financieros.

7. Caja POS sin `cashAccountId` canonico.
   Impacto: saldo por cuenta de caja y GL pueden depender de dimension operativa.

## Orden recomendado

### Fase 1. Cerrar e-CF backend seguro

1. Separar flags:
   - `electronicModelEnabled`: construir payload/snapshot shadow.
   - `electronicTransportEnabled`: llamar GISYS.
2. Agenda outbox shadow aun sin transporte.
3. Cambiar idempotency key GISYS a estable.
4. Agregar tests:
   - legacy NCF reserva `Bxx`.
   - shadow no reserva `Bxx` y no llama GISYS.
   - transport no reserva `Bxx` y agenda `issueElectronicTaxReceipt`.
   - mapper E31/E32/E34/E45.
   - error GISYS `required` bloquea, `pilot` no bloquea.

Criterio salida:

- flags apagados: cero cambio funcional.
- shadow genera payload inspeccionable.
- retry no duplica e-CF.

### Fase 2. Estado e-CF y UX minima

1. Agregar servicio refresh status GISYS.
2. Guardar snapshot normalizado:
   - `submissionId`
   - `eNcf`
   - `dgiiTrackId`
   - `requestStatus`
   - `dgiiValidationStatus`
   - `qr`
   - `links.xml/pdf`
   - `lastError`
3. Mostrar estado en:
   - lista de facturas
   - detalle factura
   - plantilla/PDF/RI
4. Agregar accion admin: reintentar/consultar status.

Criterio salida:

- factura electronica visible como `pendiente / emitida / aceptada / rechazada`.
- usuario no imprime RI fiscal final sin snapshot suficiente.

### Fase 3. Compliance con e-CF

1. Agregar `fiscalMode` y `documentFormat`.
2. Adaptar 607/608 para leer `electronicTaxReceipt.eNcf` y estados.
3. Distinguir `legacy_ncf` de `electronic_ecf` en preview/export.
4. Validar E31/E32/E34/E45.
5. Definir RFCE/E32 con GISYS.

Criterio salida:

- 607/608 no mezclan Bxx y Exx sin etiqueta.
- reporte fiscal mensual puede explicar origen por documento.

### Fase 4. GL faltante

1. Supplier credit notes:
   - emitir `supplier_credit_note.issued`.
   - emitir `supplier_credit_note.applied`.
   - crear perfiles base.
   - tests proyeccion.
2. FX settlement:
   - emitir `fx_settlement.recorded`.
   - perfiles `fx_gain/fx_loss`.
   - reporte conciliado.
3. Bank write-off:
   - agregar evento contable o asiento controlado.
   - perfiles/cuentas de diferencia bancaria.
4. POS cash:
   - propagar `cashAccountId` desde apertura de caja hacia venta y cash movement.

Criterio salida:

- ningun documento financiero critico cambia saldo operativo sin asiento o decision explicita.

### Fase 5. Operacion y rollout

1. Backfill/seed perfiles nuevos en negocios existentes.
2. Actualizar `STATE-fiscal-compliance.md`.
3. Ejecutar UAT browser:
   - venta legacy
   - venta e-CF shadow
   - venta e-CF transport local
   - E31/E32
   - nota credito cliente
   - compra/CxP/supplier credit
   - conciliacion banco write-off
   - cierre periodo
4. Probar GISYS local.
5. Probar GISYS QA/CERT.
6. Activar un negocio piloto con flags.

Criterio salida:

- piloto controlado sin duplicados, con e-CF trazable y GL reconciliado.

## Verificacion ejecutada en esta revision

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js functions/src/app/versions/v2/invoice/services/finalize.service.test.js
```

Resultado: `3` files, `11` tests passed.

```powershell
Push-Location functions; npm run lint -- src/app/modules/electronicTaxReceipts src/app/versions/v2/invoice/services/orchestrator.service.js src/app/versions/v2/invoice/triggers/outbox.worker.js; Pop-Location
```

Resultado: paso.

```powershell
Push-Location functions; npm run build; Pop-Location
```

Resultado: paso.

```powershell
npm run test:run:functions -- functions/src/app/modules/compliance/services/dgii606MonthlyReport.service.test.js functions/src/app/modules/compliance/services/dgii607MonthlyReport.service.test.js functions/src/app/modules/compliance/services/dgii608MonthlyReport.service.test.js functions/src/app/modules/compliance/functions/exportDgiiTxtReport.test.js functions/src/app/modules/compliance/functions/runMonthlyComplianceReport.test.js functions/src/app/modules/compliance/services/taxReportRun.service.test.js
```

Resultado: `6` files, `30` tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/accountReceivable/functions/syncCustomerCreditNoteAccountingEvents.test.js functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.test.js functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.test.js functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js functions/src/app/modules/treasury/functions/createBankStatementLine.test.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.test.js
```

Resultado: `6` files, `25` tests passed.

## Deploy cuando se publique el corte e-CF actual

Codigo en `functions/` cambio. Si se publica este corte, desplegar solo funciones afectadas:

```powershell
firebase deploy --only "functions:createInvoiceV2,functions:createInvoiceV2Http,functions:processInvoiceOutbox"
```

Agregar funciones nuevas si se implementa refresh/status en siguiente fase.

## Decision de estado

No estamos en "integracion completa". Estamos en base avanzada + primer corte e-CF backend.

Estado honesto:

- contabilidad/finanzas: 70-80% producto base, falta cierre de excepciones.
- fiscal mensual: 75-85%, falta UI/operacion/e-CF semantics.
- e-CF GISYS: 35-45%, falta shadow real, idempotencia, status, UI, QA/CERT.
- piloto real: todavia no.

Siguiente trabajo correcto: Fase 1 e-CF backend seguro. Sin eso, piloto electronico queda riesgoso.
