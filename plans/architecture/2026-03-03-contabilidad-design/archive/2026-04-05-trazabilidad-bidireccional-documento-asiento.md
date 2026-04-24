# Trazabilidad bidireccional documento <-> asiento

> Estado 2026-04-23: `ARCHIVADO`. Reemplazado por el plan QA maestro y la auditoria end-to-end de abril.

Fecha: 2026-04-05

## Cobertura activa

| Superficie operativa | Documento origen | Target contable | Criterio exacto |
| --- | --- | --- | --- |
| Compras | Compra | Libro diario + detalle | `sourceDocumentType=purchase`, `sourceDocumentId=purchaseId`, `eventType=purchase.committed` |
| CxP | Pago a suplidor registrado | Libro diario + detalle | `sourceDocumentType=accountsPayablePayment`, `sourceDocumentId=paymentId`, `eventType=accounts_payable.payment.recorded` |
| CxP | Pago a suplidor anulado | Libro diario + detalle | `sourceDocumentType=accountsPayablePayment`, `sourceDocumentId=paymentId`, `eventType=accounts_payable.payment.voided` |
| CxC | Cuenta por cobrar respaldada por factura | Libro diario + detalle | `sourceDocumentType=invoice`, `sourceDocumentId=invoiceId`, `eventType=invoice.committed` |
| CxC | Cobro registrado | Libro diario + detalle | `sourceDocumentType=accountsReceivablePayment`, `sourceDocumentId=paymentId`, `eventType=accounts_receivable.payment.recorded` |
| Contabilidad | Asiento posteado/proyectado | Documento origen | `sourceDocumentType/sourceDocumentId` y payload relacionado |

## Cobertura no forzada

- Preventas que todavia no tienen factura consolidada no exponen `Ver asiento contable`.
- Si el locator llega sin `journalEntryId` y sin `sourceDocumentType + sourceDocumentId`, no se intenta navegar.
- Si hay multiples records para el mismo `sourceDocumentType + sourceDocumentId` y no se aporta `eventType`, el resolver devuelve `null` para evitar abrir un asiento incorrecto.

## Contrato compartido

- Route base: `/contabilidad/libro-diario`
- Query params:
  - `accountingJournalEntryId`
  - `accountingSourceDocumentType`
  - `accountingSourceDocumentId`
  - `accountingEventType`
- Resolver del libro diario:
  - primero intenta `journalEntryId`
  - si no existe, usa `sourceDocumentType + sourceDocumentId`
  - usa `eventType` solo para desambiguar
