# Plan de implementacion: `AccountingEvent -> journalEntries`

Fecha: `2026-03-24`

## Objetivo

Abrir la capa de libro mayor sin romper el piloto operativo actual.

La secuencia correcta en este repo no es:

- modulo operativo -> asiento directo

La secuencia correcta es:

- modulo operativo
- subledger operativo
- `AccountingEvent`
- `accountingPostingProfiles`
- `journalEntries`
- reportes

## Enfoques evaluados

### Opcion A. Hibrido por fuentes fuertes y puentes temporales

Emitir `AccountingEvent` desde puntos backend ya confiables y usar triggers puente solo donde todavia no existe write path backend fuerte.

Ventajas:

- aprovecha `outbox` en ventas
- aprovecha `onCall` en CxC, CxP y transferencias
- evita esperar una migracion completa de compras y gastos
- reduce riesgo de doble escritura desde frontend

Costo:

- durante una fase conviviran productores fuertes y triggers puente

### Opcion B. Esperar a migrar todo a backend antes de abrir contabilidad

Ventaja:

- pureza arquitectonica

Costo:

- retrasa demasiado la salida de `AccountingEvent`
- deja bloqueado el uso real de `chartOfAccounts` y `postingProfiles`

### Opcion C. Postear directo desde cada modulo al `journal`

No recomendada.

Genera acoplamiento, reglas repetidas y anulaciones fragiles.

## Recomendacion

Tomar la opcion A.

Es la unica que respeta el estado actual del repo y permite abrir contabilidad sin romper ventas, CxC, CxP y tesoreria.

## Fase 0. Cerrar contrato compartido

### Objetivo

Blindar el shape del evento y del journal antes de emitir nada.

### Archivos

| Archivo | Cambio |
| --- | --- |
| `src/types/accounting.ts` | Agregar tipos de `JournalEntry`, `JournalEntryLine`, `AccountingProjectionStatus`, `AccountingEventError` y metadata de proyeccion |
| `src/utils/accounting/accountingEvents.ts` | Mantener catalogo de eventos y agregar helpers de build/normalizacion compartida si hacen falta para admin y tests |
| `src/utils/accounting/postingProfiles.ts` | Consolidar resolucion de `amountSource`, condiciones y prioridad para que el backend replique la misma semantica |
| `functions/src/app/versions/v2/accounting/utils/accountingEvent.util.js` | Nuevo helper para construir `AccountingEvent` canonico, `dedupeKey`, `idempotencyKey` y payload normalizado |
| `functions/src/app/versions/v2/accounting/utils/journalEntry.util.js` | Nuevo helper para balance, reversa, `periodKey` y totalizacion |
| `functions/src/index.js` | Exportar los triggers/controladores contables nuevos cuando existan |

### Reglas de contrato

- `AccountingEvent` debe ser inmutable
- `journalEntries/{eventId}` debe ser deterministicamente reprocesable
- no se debe usar `status` del evento para esconder errores de proyeccion
- conviene agregar `projection` o `projectionStatus` separado de `status`

## Fase 1. Emitir eventos reales

### Objetivo

Emitir el hecho economico desde las fuentes mas confiables del sistema.

### Productores fuertes

| Dominio | Archivo natural | Evento |
| --- | --- | --- |
| Ventas | `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js` | `invoice.committed` |
| Cobro CxC | `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js` | `accounts_receivable.payment.recorded` |
| Reversa cobro CxC | `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js` | `accounts_receivable.payment.voided` |
| Pago CxP | `functions/src/app/modules/purchase/functions/addSupplierPayment.js` | `accounts_payable.payment.recorded` |
| Reversa pago CxP | `functions/src/app/modules/purchase/functions/voidSupplierPayment.js` | `accounts_payable.payment.voided` |
| Transferencia interna | `functions/src/app/modules/treasury/functions/createInternalTransfer.js` | `internal_transfer.posted` |

### Puentes temporales recomendados

| Dominio | Archivo nuevo sugerido | Motivo |
| --- | --- | --- |
| Compras | `functions/src/app/modules/purchase/functions/syncPurchaseAccountingEvent.js` | La compra todavia nace/cierra fuerte desde frontend; usar trigger solo hasta moverla a backend |
| Gastos | `functions/src/app/modules/expenses/functions/syncExpenseAccountingEvent.js` | Hoy el backend visible solo sincroniza `cashMovements`; falta productor contable propio |
| FX settlement | usar el punto backend donde hoy se persiste `accountsReceivableFxSettlements` | Ya existe la liquidacion operativa; falta emitir el evento contable formal |

### Guardrails

- no emitir eventos desde frontend
- no emitir desde snapshots incompletos
- si hay anulacion, emitir evento reverso; no mutar el asiento historico
- si falta mapping contable, el evento se guarda igual y queda proyectable luego

## Fase 2. Proyector `journalEntries`

### Objetivo

Traducir un evento confirmado a un asiento balanceado usando configuracion por negocio.

### Archivos nuevos sugeridos

| Archivo | Responsabilidad |
| --- | --- |
| `functions/src/app/versions/v2/accounting/functions/projectAccountingEvent.js` | Trigger `onDocumentCreated` o `onDocumentWritten` sobre `accountingEvents/{eventId}` |
| `functions/src/app/versions/v2/accounting/utils/postingProfileResolver.util.js` | Resolver perfil activo por `eventType`, condiciones y prioridad |
| `functions/src/app/versions/v2/accounting/utils/journalBuilder.util.js` | Expandir `linesTemplate` a lineas debit/credit con montos funcionales |
| `functions/src/app/versions/v2/accounting/utils/accountResolver.util.js` | Resolver `accountId`, `systemKey`, estado y `postingAllowed` |

### Regla de proyeccion

1. leer `accountingPostingProfiles` activos del negocio
2. elegir el perfil mas especifico y de mayor prioridad efectiva
3. resolver cuentas por `accountId` o `systemKey`
4. mapear `amountSource` contra `monetary`, `tax`, `treasury` y payload del evento
5. validar que debitos = creditos
6. escribir `journalEntries/{eventId}`
7. actualizar el estado de proyeccion del evento

### Monto minimo a soportar primero

- `document_total`
- `net_sales`
- `tax_total`
- `purchase_total`
- `expense_total`
- `accounts_receivable_payment_amount`
- `accounts_payable_payment_amount`
- `transfer_amount`

Dejar `fx_gain` y `fx_loss` para cuando cierre la politica de anticipos y parciales.

## Fase 3. Reportes minimos

### Objetivo

Abrir lectura contable sin meter complejidad accidental demasiado temprano.

### Recomendacion

Primero abrir:

- mayor por cuenta
- `trialBalance`

Despues abrir:

- `incomeStatement`
- `balanceSheet`

No recomiendo persistir `balanceSheet` e `incomeStatement` como documentos en la primera iteracion. Es mas seguro exponer consultas o controladores que lean desde `journalEntries` mientras se estabiliza la capa.

### Archivos sugeridos

| Archivo | Cambio |
| --- | --- |
| `functions/src/app/versions/v2/accounting/controllers/getTrialBalance.controller.js` | Consulta agregada por periodo y cuenta |
| `functions/src/app/versions/v2/accounting/controllers/getAccountLedger.controller.js` | Mayor por cuenta con referencias de origen |
| `functions/src/index.js` | Exportar controladores contables de lectura |

## Fase 4. Controles operativos del mayor

### Objetivo

Hacer la capa reprocesable y auditable.

### Archivos sugeridos

| Archivo | Cambio |
| --- | --- |
| `functions/src/app/versions/v2/accounting/controllers/replayAccountingEvent.controller.js` | Reproceso manual o por lote |
| `functions/src/app/versions/v2/accounting/controllers/getAccountingDeadLetters.controller.js` | Inspeccion de fallos de proyeccion |
| `functions/src/app/versions/v2/accounting/utils/accountingPeriod.util.js` | `periodKey`, locks y reglas de cierre |

### Controles minimos

- `eventVersion`
- `dedupeKey`
- `projectorVersion`
- `reversalOfEventId` o `reversalOfEntryId`
- `periodKey`
- `period lock`
- replay controlado
- cola de fallos o dead letters

## Orden real de ejecucion recomendado

1. Ajustar tipos y contrato compartido.
2. Emitir `AccountingEvent` en ventas y CxC.
3. Emitir `AccountingEvent` en CxP y transferencias.
4. Abrir trigger puente para gastos.
5. Abrir trigger puente para compras.
6. Construir proyector a `journalEntries`.
7. Abrir `trialBalance` y mayor por cuenta.
8. Cerrar FX avanzado, period lock y replay.

## Riesgos que no se deben normalizar

- usar `cashMovements` como sustituto del mayor
- tratar `expense.recorded` como si siempre implicara pago
- disparar `purchase.committed` desde pedido en vez de recepcion o validacion suficiente
- meter cuentas contables directas como verdad primaria de cada modulo
- abrir `fx_gain` o `fx_loss` antes de cerrar politica de anticipos y pagos parciales

## Resultado esperado

Si este plan se sigue, el repo queda con esta secuencia estable:

- ventas, CxC, CxP, gastos y tesoreria siguen operando con sus snapshots
- `AccountingEvent` captura el hecho economico confirmado
- `accountingPostingProfiles` deja de ser solo configuracion pasiva
- `journalEntries` nace como proyeccion trazable e idempotente
- los reportes financieros salen de una capa correcta, no de `cashMovements`
