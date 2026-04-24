# Plan de Migracion: Pagos y Movimientos de Caja

> Estado 2026-04-23: `ARCHIVADO`. Reglas vigentes absorbidas en `../contabilidad-backlog.md`.

Fecha: `2026-03-17`

## Objetivo

Migrar desde el modelo actual, donde pagos y caja viven repartidos por modulo, hacia una estructura mas clara para:

- seguimiento de pagos
- seguimiento de saldos por documento
- cuadre de caja
- trazabilidad por metodo, referencia, evidencia y actor

sin hacer un big bang, sin romper operaciones diarias y sin borrar colecciones que todavia son fuente primaria del negocio.

## Alcance

Este plan cubre:

- ventas y facturas
- pago inicial de ventas en POS
- cuentas por cobrar normales
- cuentas por cobrar de seguros
- compras
- futuros pagos a proveedor
- gastos
- cuadre de caja
- notas de credito solo como instrumento de aplicacion, no como efectivo

No cubre en esta fase:

- reemplazar `invoicesV2` por otra factura primaria
- conciliacion bancaria completa
- rediseñar suscripciones SaaS
- convertir gastos en cuentas por pagar

## Principios de migracion

### 1. No borrar primero

Si una coleccion hoy sostiene:

- caja
- saldos
- recibos
- impresion
- reportes activos

no se elimina en fase 1.

Primero:

1. se agrega contrato nuevo
2. se hace dual-write
3. se hace backfill
4. se cambian lecturas
5. se audita
6. recien ahi se depreca

### 2. Caja no debe leer “como pueda” de cada modulo

La mejora central no es tener una sola coleccion de pagos.

La mejora central es que el cuadre lea una proyeccion uniforme:

- `cashMovements`

### 3. El source of truth operacional sigue siendo por dominio

No recomiendo introducir una coleccion global `payments` como verdad primaria de todo.

La estructura objetivo es:

- el documento guarda `paymentState`
- cada dominio guarda sus pagos reales
- caja consume `cashMovements`

## Estructura objetivo

### Documentos con resumen financiero

#### Facturas

Mantienen:

- snapshot POS actual
- `accumulatedPaid`
- `balanceDue`
- `paymentStatus`

Y se les agrega una capa adaptadora comun:

- `paymentState`

No hace falta migrar de golpe el storage interno de facturas.

#### Compras

Se les agrega:

- `paymentTerms`
- `paymentState`

Y se deja de asumir:

- `paid = total`
- `balance = 0`

### Ledgers operativos

#### CxC

Se conservan:

- `accountsReceivable`
- `accountsReceivableInstallments`
- `accountsReceivablePayments`
- `accountsReceivableInstallmentPayments`
- `accountsReceivablePaymentReceipt`

pero con contrato mas limpio y con mejor alineacion hacia caja.

#### CxP / pagos a proveedor

Se introduce:

- `businesses/{businessId}/accountsPayablePayments/{paymentId}`

y cada `purchase` guarda solo el resumen en `paymentState`.

No recomiendo usar una subcoleccion en `purchases/{id}/paymentReceipts` como unica ruta si el objetivo central es seguimiento y reporte transversal. La simetria con CxC y la consulta para caja favorecen `accountsPayablePayments`.

### Proyeccion de caja

Se introduce:

- `businesses/{businessId}/cashMovements/{movementId}`

Contrato sugerido:

```ts
type CashMovement = {
  id: string;
  businessId: string;
  direction: 'in' | 'out';
  sourceType:
    | 'invoice_pos'
    | 'receivable_payment'
    | 'supplier_payment'
    | 'expense'
    | 'credit_note_application'
    | 'cash_adjustment';
  sourceId: string;
  sourceDocumentId?: string | null;
  cashCountId?: string | null;
  method: string;
  amount: number;
  counterpartyType?: 'client' | 'supplier' | 'insurance' | null;
  counterpartyId?: string | null;
  reference?: string | null;
  evidenceUrls?: string[];
  impactsCashDrawer: boolean;
  impactsBankLedger: boolean;
  occurredAt: TimestampLike;
  createdAt: TimestampLike;
  createdBy: string | null;
  status?: 'posted' | 'void';
};
```

Importante:

- `cashMovements` es proyeccion operativa para caja y reportes
- no sustituye pagos de AR ni pagos de AP

## Estado actual y destino por modulo

### 1. Ventas / facturas

#### Estado actual

- `invoicesV2` es el pipeline real.
- `invoices` sigue siendo la vista legacy usada por frontend y caja.
- el pago inicial vive dentro de la factura con `paymentMethod`, `payment`, `change`.
- caja se engancha a `cashCount.sales[]` con referencias a `invoices/{invoiceId}`.

Evidencia:

- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `src/features/cart/default/default.ts`
- `src/types/invoice.ts`
- `functions/src/app/modules/cashCount/services/cashCount.service.js`

#### Cambio objetivo

- ventas sigue guardando el snapshot POS en factura
- se proyectan `cashMovements` por cada metodo que realmente impacte caja/banco
- la factura expone `paymentState`

#### Migracion

1. Crear adaptador `invoice -> paymentState`.
2. Emitir `cashMovements` desde el punto backend confiable del worker V2.
3. Backfillear movimientos historicos a partir de `invoices`/`invoicesV2`.
4. Cambiar cuadre para leer `cashMovements` y no recalcular desde `cashCount.sales[]`.

#### Eliminacion / deprecacion

- `cashCount.sales[]`: deprecada como fuente para cuadre
- `paymentHistory` en factura: deprecado como fuente primaria

No se elimina en fase 1:

- `invoices`
- `invoicesV2`

### 2. CxC normal

#### Estado actual

Colecciones activas:

- `accountsReceivable`
- `accountsReceivableInstallments`
- `accountsReceivablePayments`
- `accountsReceivableInstallmentPayments`
- `accountsReceivablePaymentReceipt`

Evidencia:

- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `src/firebase/accountsReceivable/payment/fbAddPayment.ts`
- `src/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt.ts`

#### Cambio objetivo

- `accountsReceivablePayments` sigue siendo el ledger operativo
- el shape del pago se normaliza
- cada pago emite `cashMovements`
- la factura se actualiza via `paymentState`

#### Migracion

1. Extender `accountsReceivablePayments` con contrato comun.
2. Agregar campos de migracion si faltan:
   - `direction = inbound`
   - `counterpartyType = client`
   - `documentType = invoice`
3. Emitir `cashMovements` por metodo realmente cobrado.
4. Backfillear `cashMovements` historicos desde `accountsReceivablePayments`.

#### Eliminacion / deprecacion

No se elimina:

- `accountsReceivablePayments`
- `accountsReceivableInstallmentPayments`
- `accountsReceivablePaymentReceipt`

Se depreca:

- lectura directa de CxC desde cuadre para sumar cobranzas

### 3. CxC de seguros

#### Estado actual

No es un ledger aparte.

Es una variante de AR con:

- `accountsReceivable.type = 'insurance'`
- pagos multiples por `MultiPaymentModal`
- flags como `isInsurancePayment`
- metadatos `insuranceId`

Evidencia:

- `functions/src/app/modules/accountReceivable/services/insuranceAccountReceivable.service.js`
- `src/firebase/proccessAccountsReceivablePayments/insurance/fbProcessMultiplePaymentsAR.ts`

#### Cambio objetivo

Seguros se mantiene dentro del mismo dominio AR.

No se crea:

- `insuranceReceivablePayments`
- ni otro ledger paralelo

Lo que cambia es:

- mejor tipado de `counterpartyType`
- mejor emision de `cashMovements`
- mejor trazabilidad de `insuranceId`

#### Migracion

1. Backfillear `counterpartyType = insurance` cuando aplique.
2. Backfillear `cashMovements` desde pagos de seguros.
3. Mantener `accountsReceivableInstallmentPayments` como ledger de aplicacion.

#### Eliminacion / deprecacion

Ninguna coleccion nueva de seguros.

### 4. Compras

#### Estado actual

Coleccion activa:

- `purchases`

Problemas actuales:

- solo hay `paymentAt` como fecha
- no hay pagos reales append-only
- el snapshot monetario asume pagado completo

Evidencia:

- `src/utils/purchase/types.ts`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/GeneralForm/GeneralForm.tsx`
- `src/firebase/purchase/fbAddPurchase.ts`
- `src/firebase/purchase/fbCompletePurchase.ts`

#### Cambio objetivo

Agregar:

- `paymentTerms`
- `paymentState`
- `accountsPayablePayments`

#### Migracion

1. Migrar `paymentAt` a `paymentTerms.expectedPaymentAt`.
2. Crear `paymentState` en compras nuevas.
3. Introducir `accountsPayablePayments` para pagos reales a proveedor.
4. Dejar de escribir `paid = total`, `balance = 0` por defecto.

#### Backfill de compras historicas

Aqui no recomiendo inventar pagos que no existen.

Regla:

- no crear `accountsPayablePayments` retroactivos si no hay evidencia real
- si solo existe `paymentAt`, se migra a `paymentTerms.expectedPaymentAt`
- si no hay recibo real, la compra historica debe quedar marcada como:
  - `paymentState.status = 'unknown_legacy'` o equivalente de compatibilidad
  - `paymentState.migratedFromLegacy = true`
  - `paymentState.requiresReview = true`

Si hay un caso excepcional con evidencia fuerte de pago completo, esa migracion se hace por script controlado, no por heuristica general.

#### Eliminacion / deprecacion

Se depreca:

- `paymentAt` como campo primario de pago

No se elimina:

- `purchases`

Se crea:

- `accountsPayablePayments`

### 5. Gastos

#### Estado actual

Coleccion activa:

- `expenses`

El gasto ya guarda:

- monto
- `payment.method`
- `payment.cashRegister`
- `payment.bank`

pero con shape libre y sin referencia estructurada a banco.

Evidencia:

- `src/utils/expenses/types.ts`
- `src/firebase/expenses/Items/fbAddExpense.ts`
- `src/firebase/cashCount/fbLoadExpensesForCashCount.ts`

#### Cambio objetivo

El gasto sigue siendo su propia fuente operativa.

No recomiendo crear en fase 1 una coleccion `expensePayments`.

Lo correcto es:

- enriquecer `expense.payment`
- emitir `cashMovements` desde gastos

#### Migracion

1. Mantener `expenses` como source of truth.
2. Backfillear `cashMovements` de salida (`direction = out`) desde `expenses`.
3. Introducir referencia estructurada a banco/caja si aplica.

#### Eliminacion / deprecacion

Se depreca:

- `expense.payment.bank` como string libre

No se elimina:

- `expenses`

### 6. Notas de credito

#### Estado actual

Colecciones:

- `creditNotes`
- `creditNoteApplications`

Evidencia:

- `src/firebase/creditNotes/fbConsumeCreditNotes.ts`

#### Cambio objetivo

La nota de credito no se trata como entrada de efectivo.

En el nuevo modelo:

- puede aparecer como metodo dentro de un `paymentEvent`
- puede modificar `paymentState`
- no debe generar `cashMovement` de entrada

#### Migracion

1. Mantener `creditNoteApplications`.
2. Etiquetar esos casos para que cuadre no los trate como caja.

#### Eliminacion / deprecacion

Ninguna en esta fase.

### 7. Caja

#### Estado actual

`cashCounts` hoy mezcla:

- apertura/cierre y billetes
- referencias a ventas
- snapshots de `receivablePayments`
- totales agregados

Evidencia:

- `functions/src/app/modules/cashCount/services/cashCount.service.js`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData.tsx`

#### Cambio objetivo

`cashCounts` sigue existiendo como agregado operativo de apertura/cierre.

Pero deja de ser:

- el lugar donde se descubre qué operaciones componen el cuadre

Ese rol pasa a:

- `cashMovements`

#### Migracion

1. Crear `cashMovements`.
2. Hacer dual-write desde:
   - ventas POS
   - CxC
   - CxC seguros
   - gastos
   - pagos a proveedor
3. Cambiar auditor de caja y UI de cuadre para usar `cashMovements`.
4. Dejar `cashCounts.total*` como read model derivado o persistido, pero no como verdad independiente.

#### Eliminacion / deprecacion

Se depreca:

- `cashCount.receivablePayments[]`
- uso de `cashCount.sales[]` como fuente de calculo

No se elimina:

- `cashCounts`

## Matriz de colecciones: destino y decision

| Coleccion actual | Rol actual | Destino | Decision |
|---|---|---|---|
| `invoicesV2` | pipeline operativo de venta | se mantiene | conservar |
| `invoices` | read model legacy de factura | se mantiene por compatibilidad | conservar temporalmente |
| `accountsReceivable` | saldo/documento CxC | se mantiene | conservar |
| `accountsReceivableInstallments` | cuotas AR | se mantiene | conservar |
| `accountsReceivablePayments` | pagos AR | se mantiene y normaliza | conservar |
| `accountsReceivableInstallmentPayments` | aplicacion de pago a cuotas | se mantiene | conservar |
| `accountsReceivablePaymentReceipt` | recibos AR | se mantiene como snapshot/evidencia | conservar |
| `purchases` | documento de compra | se enriquece con `paymentState` | conservar |
| `expenses` | documento de gasto | se mantiene y proyecta a caja | conservar |
| `cashCounts` | apertura/cierre de caja | se mantiene | conservar |
| `creditNotes` | agregado monetario | se mantiene | conservar |
| `creditNoteApplications` | aplicacion de nota | se mantiene | conservar |

Colecciones nuevas:

- `accountsPayablePayments`
- `cashMovements`

Elementos candidatos a deprecacion funcional:

- `purchase.paymentAt`
- `invoice.paymentHistory` como verdad de pago
- `cashCount.sales[]` como insumo principal de cuadre
- `cashCount.receivablePayments[]`
- `expense.payment.bank` como string libre

## Fases de migracion

### Fase 0: congelar contrato y feature flags

1. Definir tipos compartidos:
   - `PaymentMethodEntry`
   - `DocumentPaymentState`
   - `CashMovement`
2. Crear flags de rollout para lecturas y escrituras nuevas.
3. Declarar reglas de no-regresion para caja.

### Fase 1: dual-write nuevo sin cortar lecturas legacy

1. Ventas POS emite `cashMovements`.
2. CxC emite `cashMovements`.
3. Gastos emiten `cashMovements`.
4. Compras nuevas usan `paymentTerms` y `paymentState`.
5. AP nuevo escribe `accountsPayablePayments`.

Lecturas siguen iguales.

### Fase 2: backfill historico

Scripts necesarios:

1. `backfillCashMovementsFromInvoicesV2`
2. `backfillCashMovementsFromARPayments`
3. `backfillCashMovementsFromInsuranceARPayments`
4. `backfillCashMovementsFromExpenses`
5. `backfillInvoicePaymentState`
6. `backfillPurchasePaymentTermsAndLegacyState`

Regla fuerte:

- no backfillear pagos ficticios a compras

### Fase 3: migracion de lecturas

1. `usePaymentsForCashCount` deja de consultar directo CxC.
2. `CashCountMetaData` pasa a leer `cashMovements`.
3. el auditor de caja usa `cashMovements`.
4. reportes de caja usan `cashMovements`.

### Fase 4: limpieza controlada

1. cortar escritura de `cashCount.receivablePayments[]`
2. cortar dependencia de `cashCount.sales[]` para calculo
3. marcar `paymentAt` de compra como legacy
4. marcar `paymentHistory` de factura como auxiliar

### Fase 5: deprecacion final

Solo si la auditoria da estable por un periodo acordado:

1. dejar de poblar snapshots legacy no usados
2. documentar rutas obsoletas
3. decidir si algun snapshot puede regenerarse y entonces borrarse

## Orden recomendado de implementacion

1. `cashMovements`
2. dual-write desde ventas POS
3. dual-write desde CxC normal y seguros
4. dual-write desde gastos
5. `paymentState` comun para facturas
6. `paymentTerms/paymentState` en compras
7. `accountsPayablePayments`
8. cambio de lecturas de cuadre

Este orden reduce riesgo porque primero estabiliza el caso que te importa mas:

- el cuadre de caja

## Riesgos y decisiones duras

### Riesgo 1: compras legacy sin verdad de pago

Decision:

- no falsificar pagos historicos
- migrar solo a `paymentTerms`
- marcar saldo legacy para revision

### Riesgo 2: caja contara como efectivo algo que no es efectivo

Decision:

- `creditNote` no genera `cashMovement` de entrada
- tarjeta y transferencia generan movimiento, pero no caja fisica

### Riesgo 3: seguros se separen innecesariamente

Decision:

- seguros se mantiene en AR
- se diferencia por metadatos, no por coleccion nueva

### Riesgo 4: `cashCounts` siga siendo fuente y proyeccion a la vez

Decision:

- `cashCounts` queda como agregado operativo
- `cashMovements` pasa a ser la base del cuadre

## Validacion de migracion

Antes de deprecar lecturas legacy, por negocio piloto se debe validar:

1. suma de `cashMovements` vs cuadre actual
2. suma de pagos AR vs saldo AR
3. suma de gastos vs salidas esperadas
4. factura con pago POS completo
5. factura a credito con abono posterior
6. pago multiple de seguros
7. compra nueva con pago parcial y pago posterior
8. compra legacy sin pago verificable

## Decision final

La migracion correcta no es mover todo a una sola coleccion nueva.

La migracion correcta es:

1. mantener los ledgers operativos por dominio
2. introducir `paymentState` donde falta
3. introducir `accountsPayablePayments`
4. introducir `cashMovements`
5. cortar el cuadre para que lea de ahi

Si hubiera que resumirlo en una sola frase:

- el cambio principal no es “nuevo modulo de pagos”, es “nuevo modelo de caja basado en movimientos normalizados y pagos trazables”.
