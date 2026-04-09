# Auditoria tecnica del repo

## Resumen

El plan original era valido como direccion, pero no como contrato ejecutable. El repo confirma que la arquitectura debe bifurcarse por confiabilidad:

- ventas/CxC ya tienen una base backendizable
- compras/gastos aun dependen demasiado del frontend
- caja existe como cuadre operativo, no como banco
- productos siguen con precios/costos numericos sin moneda estructurada

Conclusion operativa: la documentacion debia actualizarse y ademas requeria una auditoria separada.

## Hallazgos principales

### 1. El plan original no distinguia entre fuentes backend fuertes y escrituras frontend fragiles

Problema:

- El plan proponia eventos para ventas, compras, gastos y pagos como si todas las fuentes fueran igual de confiables.

Evidencia:

- ventas: orquestador + outbox + auditoria en backend `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:101-456`
- compras: escritura directa `src/firebase/purchase/fbAddPurchase.ts:31-149`
- cierre de compra: `src/firebase/purchase/fbCompletePurchase.ts:253-336`
- gastos: escritura directa `src/firebase/expenses/Items/fbAddExpense.ts:23-107`
- pagos CxC: escritura directa `src/firebase/accountsReceivable/payment/fbAddPayment.ts:9-45`

Impacto:

- si se intentaba conectar journal o asientos directamente al frontend, se introducia doble escritura y riesgo de inconsistencias.

Recomendacion:

- priorizar eventos fuertes en ventas y luego pagos CxC
- limitar compras/gastos a snapshots monetarios hasta que exista trigger o endpoint backend confiable

Prioridad: alta

### 2. El plan no bajaba a shapes concretos de snapshot monetario

Problema:

- Decia "guardar moneda y tasa", pero no fijaba campos concretos ni diferenciaba total en moneda documento vs funcional.

Evidencia:

- `invoicesV2.snapshot` hoy solo guarda `ncf`, `client`, `totals`, `meta`, `dueDate`, `invoiceComment`: `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:164-176`
- `Purchase` no tipa moneda ni tasa: `src/utils/purchase/types.ts:55-73`
- `Expense` no tipa moneda ni tasa: `src/utils/expenses/types.ts:39-62`
- `AccountsReceivablePayment` no tipa moneda ni tasa: `src/utils/accountsReceivable/types.ts:172-192`

Impacto:

- sin shape exacto no hay invariantes ni validacion automatica posibles

Recomendacion:

- agregar `documentCurrency`, `exchangeRateSnapshot`, `documentTotals`, `functionalTotals`
- para pagos CxC, agregar `documentAmount` y `functionalAmount`

Prioridad: alta

### 3. El dominio bancario estaba subdefinido

Problema:

- el repo usa "bank" como string libre en gastos y "totalTransfer/totalCard" en caja, pero no existe `bankAccounts`.

Evidencia:

- `ExpensePayment.bank?: string`: `src/utils/expenses/types.ts:31-37`
- UI de gastos expone input libre "Banco": `src/modules/expenses/pages/Expenses/ExpensesForm/ExpensesForm.tsx:221-229`
- caja agrega `totalCard` y `totalTransfer`: `functions/src/app/modules/cashCount/functions/closeCashCount.js:171-189`
- auditoria de caja recalcula tarjeta/transferencia como metricas del cuadre: `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js:171-220`

Impacto:

- sin cuentas bancarias estructuradas no existe conciliacion ni proyeccion bancaria real

Recomendacion:

- crear `bankAccounts` y proyectar tarjeta/transferencia a banco o cuenta puente
- no seguir usando `cashCounts` como aproximacion bancaria
- dejar `bankTransactions` como deliverable deferred hasta tener eventos y proyecciones estables

Prioridad: alta

### 4. El plan no cerraba la convivencia `invoicesV2 -> invoices`

Problema:

- el repo confirma que `invoicesV2` es el pipeline real, pero `invoices` sigue siendo contrato legacy activo.

Evidencia:

- `createCanonicalInvoice` en el outbox materializa `businesses/{businessId}/invoices/{invoiceId}`: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:268-532`
- el worker tambien liga `cashCounts` y CxC desde ese pipeline: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:601-874`
- `waitForInvoiceResult` observa ambos lados: `src/services/invoice/invoice.service.ts:382-410`

Impacto:

- enganchar contabilidad en el punto incorrecto rompe compatibilidad o duplica efectos

Recomendacion:

- disparar `invoice.committed` desde el pipeline V2 ya materializado
- mantener `invoices` como vista/contrato legacy hasta una migracion posterior

Prioridad: alta

### 5. El modelo de productos/precios sigue siendo DOP-implicito

Problema:

- los precios y costos existen como numeros simples sin moneda estructurada

Evidencia:

- `ProductPricing` no incluye `currency`: `src/types/products.ts:10-22`
- la normalizacion persiste `cost`, `price`, `listPrice`, `cardPrice`, `offerPrice` como numeros: `src/utils/products/normalization.ts:102-119`
- compra deriva `baseCost`, `unitCost`, `subtotal` desde esos numeros: `src/features/purchase/addPurchaseSlice.ts:142-152`, `:315-337`

Impacto:

- el modulo de moneda no puede apoyarse todavia en un dominio de producto multi-moneda maduro

Recomendacion:

- no bloquear Fase 1 por esto
- introducir una politica futura de precio/costo base por moneda y repricing materializado

Prioridad: media

### 6. Faltaban reglas de idempotencia, replay y reverso para `accountingEvents`

Problema:

- el plan decia "eventos contables" pero no cerraba `dedupeKey`, versionado, dead letters ni compensacion.

Por que aplica aqui:

- precisamente porque ventas ya usa outbox y auditoria, el siguiente paso natural es mantener ese nivel de rigor.

Recomendacion:

- `eventVersion`
- `dedupeKey`
- `idempotencyKey`
- `status`
- `reversalOfEventId`
- cola de `deadLetters`

Prioridad: alta

### 7. Faltaba gobernanza explicita

Problema:

- sin reglas de backdate, lock de periodo y cambio de moneda base, el sistema queda abierto a corrupcion historica.

Recomendacion:

- `functionalCurrency` fija en Fase 1
- tasa usada no editable, solo supersedida
- periodo bloqueado implica correccion por evento compensatorio, no por reescritura

Prioridad: media

## Zonas de mayor riesgo para introducir contabilidad hoy

1. `src/firebase/purchase/fbCompletePurchase.ts`
2. `src/firebase/expenses/Items/fbAddExpense.ts`
3. `src/firebase/accountsReceivable/payment/fbAddPayment.ts`
4. cualquier intento de mezclar `accounting` con `functions/src/app/versions/v2/billing/*`

## Huecos cerrados por la actualizacion documental

1. Invariantes de moneda base, snapshot historico y reporte historico vs tasa actual.
2. Diferencia caja vs banco vs cuenta puente.
3. Criterio de confiabilidad por dominio para emitir eventos.
4. Shape minimo de snapshots monetarios.
5. Lifecycle minimo de `accountingEvents`.
6. Fases con criterio de done y escenarios de prueba.

## Huecos que siguen abiertos y requieren implementacion

1. Contratos `MonetarySnapshot` y `AccountingEvent` aun no existen en codigo.
2. `invoicesV2` aun no guarda `snapshot.monetary`.
3. `accountsReceivablePayments` aun no guarda snapshot monetario.
4. Compras y gastos siguen sin punto backend robusto para evento fuerte.
5. `bankAccounts` aun no existe en Firestore ni en backend.

## Recomendacion final

La mejor primera victoria sigue siendo esta:

- toda compra, venta, gasto y cobro nuevo sabe en que moneda ocurrio
- toda operacion nueva guarda la tasa exacta usada
- al menos ventas y pagos CxC pueden emitir un evento backend auditable

Precision operativa adicional:

- `invoice.committed` debe emitirse desde el pipeline backend V2 ya finalizado, no desde `createInvoiceV2` ni desde frontend.
- `receivable.payment_recorded` debe emitirse solo despues de `batch.commit()` exitoso del pago CxC.
- `bankTransactions` no entra en la fase inicial como ledger primario.

No recomiendo entrar primero por journal, ni por conciliacion, ni por una falsa abstraccion multi-moneda global. El orden correcto es fundacion monetaria, snapshots, eventos, proyecciones y luego journal.
