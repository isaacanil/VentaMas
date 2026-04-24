# Auditoria QA POS/ERP: Finanzas, Contabilidad y Vitest

Fecha: 2026-04-22  
Alcance: VentaMas POS/ERP multi-tenant, React/Vite + Firebase Functions, Grupo A financiero/contable y Grupo B transaccional.

## Resultado

Auditoria fuente hecha sobre modulos de contabilidad, AP, AR, banco/caja, tasa de cambio, ventas, gastos, cuadre de caja, compras y tesoreria.

Validacion enfocada ejecutada:

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/invoice/services/finalize.service.test.js functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js functions/src/app/versions/v2/accounting/utils/cashMovement.util.test.js functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.test.js functions/src/app/modules/purchase/functions/supplierPaymentLifecycle.test.js functions/src/app/modules/expenses/functions/syncExpenseAccountingEvent.test.js functions/src/app/modules/expenses/functions/syncExpenseCashMovement.test.js functions/src/app/modules/cashCount/functions/closeCashCount.test.js
```

Resultado: `8 passed files`, `34 passed tests`.

Tesoreria enfocada:

```powershell
npm run test:run:functions -- functions/src/app/modules/treasury/functions/createInternalTransfer.test.js functions/src/app/modules/treasury/functions/createBankReconciliation.test.js functions/src/app/modules/treasury/functions/resolveBankStatementLineMatch.test.js functions/src/app/modules/treasury/functions/createBankStatementLine.test.js
```

Resultado: `4 passed files`, `15 passed tests`.

## Mapa De Impacto

| Flujo | Impacta | Ruta real | Riesgo |
|---|---|---|---|
| Venta V2 | Caja, Banco, AR, Contabilidad | `createPendingInvoice` crea `invoicesV2`; outbox crea factura canonica, AR, cash movements; `attemptFinalizeInvoice` crea `invoice.committed`. | **P0:** multi-moneda mezcla valores documento con valores funcionales en split caja/AR. |
| Venta a caja | Caja, cash movements | `attachToCashCount` resuelve caja y escribe `cashCount.sales` + `cashMovements`. | **P0:** candidato preferido puede estar cerrado; flujo permite relink sin exigir `state === open`. |
| Cobro AR | AR, Cliente, Caja/Banco, Contabilidad, FX | `processAccountsReceivablePayment` hace transaccion con AR, recibo, cliente, movimientos y evento. | Mejor protegido. Falta test end-to-end con proyeccion contable + FX. |
| Gasto | Caja/Banco, Contabilidad | `syncExpenseCashMovement` y `syncExpenseAccountingEvent` corren como triggers separados. | **P0/P1:** tesoreria puede quedar sin asiento, o asiento sin tesoreria. No reverso contable claro al eliminar/anular. |
| Compra | AP, Contabilidad | `syncVendorBillFromPurchase` crea vendor bill; `syncPurchaseCommittedAccountingEvent` emite `purchase.committed`. | **P1:** trigger no valida periodo cerrado; depende del write path anterior. |
| Pago proveedor | AP, Caja/Banco, Contabilidad | `addSupplierPayment` escribe pago + compra + vendorBill; trigger sincroniza movimientos y eventos. | **P0/P1:** caja/banco validado antes de transaccion; race si caja cierra antes del commit. |
| Cuadre caja | Caja, Contabilidad | `closeCashCount` cierra caja; luego crea `cash_over_short.recorded`. | **P0:** cierre y evento contable no son atomicos. Caja puede cerrar sin asiento de diferencia. |
| Tesoreria | Caja/Banco, Contabilidad | `createInternalTransfer`, `createBankReconciliation`, `resolveBankStatementLineMatch`. | Transferencias mejor cubiertas. Write-off bancario crea movimiento, pero falta evento contable explicito. |

## Observaciones De Arquitectura

### Venta V2

`invoicesV2` funciona como documento de control. Los efectos laterales salen por outbox:

- `createCanonicalInvoice`: crea o actualiza `businesses/{businessId}/invoices/{invoiceId}`.
- `attachToCashCount`: vincula la factura a `cashCount.sales` y crea `cashMovements`.
- `setupAR`: crea `accountsReceivable` e installments.
- `attemptFinalizeInvoice`: cuando no quedan tasks pendientes/fallidas bloqueantes, marca `committed` y crea `accountingEvents/{invoice.committed__invoiceId}`.

Problema principal: separacion outbox mejora resiliencia, pero tests actuales no prueban cadena real completa. Riesgo queda en inconsistencias parciales: factura committed sin asiento proyectado, caja cerrada vinculada, AR creado pero cash movement fallido, o evento contable creado con montos de moneda incorrecta.

### Proyeccion Contable

`accountingEvents` son cola canonica para `journalEntries`. `projectAccountingEventToJournalEntry` valida mapping, cuentas activas y partida doble. Si falla, actualiza `projection.status` y crea dead-letter.

Esto es buen patron, pero no garantiza atomicidad con transaccion operativa. La venta, gasto o cierre puede quedar operativo aunque asiento caiga en dead-letter. Eso puede ser aceptable si existe monitor/repair operacional; hoy las pruebas no validan ese contrato completo.

### Tasa De Cambio

`resolvePilotMonetarySnapshotForBusiness` usa:

- snapshot recibido si existe.
- moneda funcional con tasa 1 si documento esta en moneda funcional.
- tasa manual desde `settings.manualRatesByCurrency` para moneda extranjera.

Brecha: no hay guard de antiguedad. `exchangeRateSnapshot.effectiveAt` usa `settings.updatedAt` o `Timestamp.now()`. No se valida que tasa sea del dia, ni que `currentExchangeRateIdsByCurrency` corresponda al periodo del documento.

### Caja/Banco

`cashMovements` funciona como ledger operativo de caja/banco. Buen punto: movimientos tienen `direction`, `sourceType`, `sourceDocumentId`, `impactsCashDrawer`, `impactsBankLedger`, `reconciliationStatus`.

Riesgo: varias escrituras llegan por triggers independientes. Para gastos y AP, documento principal puede persistir aunque movimiento o evento contable falle.

## Brechas Criticas

1. **Venta USD parcial:** asiento usa `functionalAmount`, pero `payload.paymentMethods[].value` queda en moneda documento. Resultado esperado debe ser DOP, no USD.
2. **Caja cerrada en venta:** `attachToCashCount` puede usar cash count candidato cerrado y aun escribir movimiento.
3. **Cierre caja no atomico:** `closeCashCount` puede cerrar caja y fallar evento contable despues.
4. **Gasto eliminado/anulado:** movimiento puede quedar void/delete, pero reverso contable no queda probado.
5. **Pago proveedor race:** caja abierta validada fuera de transaccion; puede cerrar antes de escribir pago.
6. **Tasa vencida:** no hay guard de antiguedad/maxAge. `exchangeRateSnapshot.effectiveAt` usa `settings.updatedAt` o `Timestamp.now()`.
7. **Write-off bancario:** movimiento ajuste existe; asiento contable de ingreso/gasto bancario no queda garantizado.
8. **Outbox venta:** test actual casi no cubre tareas reales; falta cadena `setupAR + attachToCashCount + finalize`.

## Cobertura Actual

### Fuerte

- Proyector contable valida partida doble, mapping faltante y dead-letter.
- Venta mixta caja + AR tiene prueba contable, pero solo DOP.
- `cashMovement.util` cubre factura POS, cobro AR, reverso AR, gasto, AP y transferencia.
- Cobro AR cubre idempotencia y guards.
- Supplier payment cubre happy path, void y fechas invalidas.
- Tesoreria cubre transferencias, conciliacion y statement-line matching.

### Debil

- Outbox venta real casi sin pruebas.
- Sin prueba end-to-end venta -> caja -> AR -> accountingEvent -> journalEntry.
- Sin prueba multi-moneda funcional/documento.
- Sin prueba de fallo contable post-cierre caja.
- Sin prueba de race en caja para pago proveedor.
- Sin prueba de reverso contable gasto.
- Sin prueba de write-off bancario contable.

## Plan De Pruebas Faltantes

### P0

1. Venta USD parcial: total USD 100, tasa 60, pago caja USD 30. Debe proyectar caja DOP 1,800, AR DOP 4,200, ventas DOP 5,084.75, ITBIS DOP 915.25.
2. `attachToCashCount` con cash count candidato `closed`: debe rechazar o buscar caja abierta; no escribir `cashCount.sales` ni `cashMovements`.
3. `closeCashCount` con diferencia y fallo de `accountingEvents`: no debe cerrar caja sin evento, o debe crear repair/dead-letter explicito.
4. Gasto `active -> deleted/cancelled`: debe emitir reverso contable y anular/eliminar movimiento.
5. `addSupplierPayment`: caja abierta en preflight, cerrada dentro de transaccion simulada. Debe rechazar.

### P1

6. Venta outbox end-to-end con `setupAR`, `attachToCashCount`, `finalize`, `projectAccountingEventToJournalEntry`.
7. Compra comprometida en periodo cerrado directo por trigger: no crear evento o crear dead-letter controlado.
8. Pago proveedor mixto cash+bank: validar `accountsPayablePayments`, `cashMovements`, `vendorBills`, `accountingEvents`, `journalEntries`.
9. Cobro AR multi-moneda con FX settlement: validar asiento AR payment + asiento FX gain/loss o dead-letter explicito.
10. Bank statement write-off: validar movimiento ajuste + evento contable de gasto/ingreso bancario.

## Codigo Ejemplo Vitest

Agregar en:

```text
functions/src/app/versions/v2/accounting/projectAccountingEventToJournalEntry.test.js
```

Debe fallar hoy si proyector usa `paymentMethods[].value` como documento en vez de funcional.

```js
it('projects USD partial sale using functional payment amounts for cash and AR', async () => {
  documentSnapshots.set('businesses/business-1/settings/accounting', {
    rolloutEnabled: true,
    generalAccountingEnabled: true,
    functionalCurrency: 'DOP',
  });

  collectionSnapshots.set('businesses/business-1/accountingPostingProfiles', [
    {
      id: 'profile-sale-credit-fx',
      data: {
        id: 'profile-sale-credit-fx',
        name: 'Venta credito USD con abono',
        eventType: 'invoice.committed',
        status: 'active',
        priority: 10,
        conditions: { paymentTerm: 'credit' },
        linesTemplate: [
          {
            id: 'cash',
            side: 'debit',
            accountSystemKey: 'cash',
            amountSource: 'sale_cash_received',
          },
          {
            id: 'ar',
            side: 'debit',
            accountSystemKey: 'accounts_receivable',
            amountSource: 'sale_receivable_balance',
          },
          {
            id: 'sales',
            side: 'credit',
            accountSystemKey: 'sales',
            amountSource: 'net_sales',
          },
          {
            id: 'tax',
            side: 'credit',
            accountSystemKey: 'tax_payable',
            amountSource: 'tax_total',
          },
        ],
      },
    },
  ]);

  collectionSnapshots.set('businesses/business-1/chartOfAccounts', [
    {
      id: 'cash-1',
      data: {
        id: 'cash-1',
        systemKey: 'cash',
        code: '1100',
        name: 'Caja',
        status: 'active',
        postingAllowed: true,
      },
    },
    {
      id: 'ar-1',
      data: {
        id: 'ar-1',
        systemKey: 'accounts_receivable',
        code: '1120',
        name: 'CxC',
        status: 'active',
        postingAllowed: true,
      },
    },
    {
      id: 'sales-1',
      data: {
        id: 'sales-1',
        systemKey: 'sales',
        code: '4100',
        name: 'Ventas',
        status: 'active',
        postingAllowed: true,
      },
    },
    {
      id: 'tax-1',
      data: {
        id: 'tax-1',
        systemKey: 'tax_payable',
        code: '2200',
        name: 'ITBIS por pagar',
        status: 'active',
        postingAllowed: true,
      },
    },
  ]);

  await projectAccountingEventToJournalEntry({
    params: {
      businessId: 'business-1',
      eventId: 'invoice.committed__inv-usd-1',
    },
    data: {
      data: () => ({
        id: 'invoice.committed__inv-usd-1',
        businessId: 'business-1',
        eventType: 'invoice.committed',
        sourceType: 'invoice',
        sourceId: 'inv-usd-1',
        sourceDocumentId: 'inv-usd-1',
        sourceDocumentType: 'invoice',
        currency: 'USD',
        functionalCurrency: 'DOP',
        monetary: {
          amount: 100,
          taxAmount: 15.25,
          functionalAmount: 6000,
          functionalTaxAmount: 915.25,
        },
        payload: {
          paymentTerm: 'credit',
          paymentMethods: [
            {
              method: 'cash',
              value: 30,
              functionalValue: 1800,
            },
          ],
          paidAmount: 30,
          receivableBalance: 70,
        },
      }),
    },
  });

  const journalEntry = documentSnapshots.get(
    'businesses/business-1/journalEntries/invoice.committed__inv-usd-1',
  );

  expect(journalEntry.totals).toEqual({
    debit: 6000,
    credit: 6000,
  });

  expect(journalEntry.lines).toEqual([
    expect.objectContaining({
      accountSystemKey: 'cash',
      debit: 1800,
      credit: 0,
    }),
    expect.objectContaining({
      accountSystemKey: 'accounts_receivable',
      debit: 4200,
      credit: 0,
    }),
    expect.objectContaining({
      accountSystemKey: 'sales',
      debit: 0,
      credit: 5084.75,
    }),
    expect.objectContaining({
      accountSystemKey: 'tax_payable',
      debit: 0,
      credit: 915.25,
    }),
  ]);
});
```

## Siguiente Corte Recomendado

1. Arreglar unidad monetaria venta USD.
2. Agregar prueba `closed cashCount` en outbox.
3. Cerrar atomicidad/reparacion de `closeCashCount` + `cash_over_short.recorded`.
4. Cubrir reversos de gastos y write-off bancario con evento contable.
