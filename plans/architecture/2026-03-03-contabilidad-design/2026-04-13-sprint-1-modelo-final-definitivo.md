# Sprint 1: modelo final definitivo

Fecha: `2026-04-13`

Estado: `propuesto para ejecucion`

## Problema

El repo ya tiene piezas reales de contabilidad, `CxP` y tesoreria, pero todavia conviven tres problemas:

- algunas colecciones financieras existen como proyecciones o read models, no como fuente canonica
- tesoreria todavia tiene mutaciones directas desde frontend que rompen la disciplina contable
- `compras` y `gastos` mezclan hecho operativo con hecho financiero

Si el equipo empieza a implementar sin cerrar el modelo definitivo, los siguientes sprints van a meter complejidad accidental: duplicar colecciones, crear `V2` innecesarios o reforzar flujos que luego habra que desmontar.

## Objetivo

Cerrar el modelo final de `CxP`, tesoreria y contabilidad general para que los siguientes sprints implementen sobre una sola lectura del dominio.

Este sprint define:

- entidades finales
- colecciones canonicas y no canonicas
- state machines
- invariantes
- ownership de datos
- reglas de integracion entre `compras`, `gastos`, `CxP`, tesoreria y contabilidad

## Restricciones

- Estas superficies aun no estan operativas de punta a punta, por lo que **no se justifica versionado ni convivencia larga**.
- No se crean `vendorBillsV2`, `cashMovementsV2` ni variantes paralelas.
- Se reutilizan las colecciones ya existentes cuando el shape base es defendible.
- `ventas` y `CxC` quedan fuera del rediseño principal de este sprint salvo referencias necesarias de integracion.

## Decision recomendada

### Colecciones que se reutilizan como fuente de verdad

- `vendorBills`
- `accountsPayablePayments`
- `cashMovements`
- `bankReconciliations`
- `accountingEvents`
- `journalEntries`
- `bankAccounts`
- `cashCounts`
- `internalTransfers`

### Colecciones que se conservan, pero no como fuente financiera primaria

- `purchases`
- `expenses`

### Colecciones o superficies a degradar a read model o derivado

- `liquidityLedger`

## Fuente de verdad final por dominio

### Cuentas por pagar

- **fuente canonica**: `vendorBills`
- **ledger de pagos**: `accountsPayablePayments`
- **documento operativo de origen**: `purchases` o `expenses` cuando aplique

### Tesoreria

- **fuente canonica**: `cashMovements`
- **catalogos maestros**: `bankAccounts`, `cashCounts`
- **documentos de soporte**: `internalTransfers`, `bankReconciliations`

### Contabilidad general

- **fuente canonica de eventos**: `accountingEvents`
- **resultado proyectado**: `journalEntries`

## Ownership del dato

- `purchases` describe la compra operativa, recepcion y contexto comercial.
- `vendorBills` describe la obligacion financiera con el suplidor.
- `accountsPayablePayments` describe pagos y reversiones contra `vendorBills`.
- `cashMovements` describe entradas y salidas reales de caja y banco.
- `bankReconciliations` describe conciliacion operativa y sus diferencias.
- `accountingEvents` describe el hecho contable canonico.
- `journalEntries` describe el asiento proyectado.

Ninguna pantalla ni proceso debe volver a inferir saldo de `CxP` directamente desde `purchase.total` o desde movimientos sueltos fuera de estos contratos.

## Entidades finales

### 1. Vendor Bill

`vendorBills` pasa a ser la entidad financiera primaria de `CxP`.

Campos minimos:

```ts
type VendorBill = {
  id: string;
  businessId: string;
  supplierId: string | null;
  supplierName: string | null;
  vendorReference: string | null;
  sourceDocumentType: 'purchase' | 'expense' | 'manual';
  sourceDocumentId: string | null;
  billDate: TimestampLike | null;
  accountingDate: TimestampLike | null;
  dueDate: TimestampLike | null;
  currency: string;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    paid: number;
    balance: number;
  };
  paymentTerms: {
    condition: string | null;
    originalDueAt: TimestampLike | null;
    nextPaymentAt: TimestampLike | null;
  };
  status: 'draft' | 'approved' | 'partially_paid' | 'paid' | 'voided';
  approvalStatus: 'pending' | 'approved' | 'rejected' | null;
  notes?: string | null;
  attachmentUrls?: string[];
  createdAt: TimestampLike;
  createdBy: string | null;
  updatedAt: TimestampLike;
  updatedBy: string | null;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
};
```

### 2. Accounts Payable Payment

`accountsPayablePayments` pasa a ser el ledger operativo de pagos de suplidor.

Campos minimos:

```ts
type AccountsPayablePayment = {
  id: string;
  businessId: string;
  supplierId: string | null;
  vendorBillId: string;
  sourceDocumentType: 'vendor_bill_payment';
  sourceDocumentId: string;
  method: string;
  settlementKind: 'cash' | 'bank' | 'credit_note' | 'mixed';
  cashCountId?: string | null;
  bankAccountId?: string | null;
  amount: number;
  currency: string;
  reference?: string | null;
  note?: string | null;
  status: 'draft' | 'posted' | 'voided';
  idempotencyKey: string;
  occurredAt: TimestampLike;
  createdAt: TimestampLike;
  createdBy: string | null;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
  reversalOf?: string | null;
};
```

### 3. Cash Movement

`cashMovements` queda como ledger canonico de tesoreria.

Campos minimos:

```ts
type CashMovement = {
  id: string;
  businessId: string;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  method: string | null;
  status: 'pending' | 'posted' | 'voided';
  cashCountId?: string | null;
  bankAccountId?: string | null;
  sourceType:
    | 'invoice_pos'
    | 'receivable_payment'
    | 'supplier_payment'
    | 'expense'
    | 'internal_transfer'
    | 'bank_adjustment'
    | 'manual_adjustment';
  sourceId: string;
  sourceDocumentType: string;
  sourceDocumentId: string;
  counterpartyType?: 'customer' | 'supplier' | null;
  counterpartyId?: string | null;
  reference?: string | null;
  occurredAt: TimestampLike;
  createdAt: TimestampLike;
  createdBy: string | null;
  reversalOf?: string | null;
};
```

### 4. Bank Reconciliation

`bankReconciliations` queda como documento operativo de conciliacion bancaria.

Campos minimos:

```ts
type BankReconciliation = {
  id: string;
  businessId: string;
  bankAccountId: string;
  statementDate: TimestampLike;
  statementBalance: number;
  ledgerBalance: number;
  difference: number;
  status: 'draft' | 'in_review' | 'balanced' | 'variance' | 'adjusted' | 'voided';
  reference?: string | null;
  note?: string | null;
  createdAt: TimestampLike;
  createdBy: string | null;
  approvedAt?: TimestampLike | null;
  approvedBy?: string | null;
};
```

### 5. Accounting Event

`accountingEvents` sigue como evento contable canonico append-only.

Campos obligatorios minimos:

- `id`
- `businessId`
- `eventType`
- `sourceType`
- `sourceId`
- `sourceDocumentType`
- `sourceDocumentId`
- `occurredAt`
- `recordedAt`
- `monetary`
- `status`
- `projection`

### 6. Journal Entry

`journalEntries` sigue como resultado proyectado desde `accountingEvents`.

Campos obligatorios minimos:

- `id`
- `businessId`
- `eventId`
- `status`
- `entryNumber`
- `occurredAt`
- `lines[]`
- `totals.debits`
- `totals.credits`

## State machines

### Vendor Bill

- `draft -> approved`
- `draft -> voided`
- `approved -> partially_paid`
- `approved -> paid`
- `approved -> voided`
- `partially_paid -> paid`
- `partially_paid -> voided` solo si no queda pago activo sin reversar

Reglas:

- `overdue` no se persiste como estado principal
- `overdue` se deriva cuando `dueDate < now` y `balance > 0`

### Accounts Payable Payment

- `draft -> posted`
- `posted -> voided`

Reglas:

- un pago posteado no se edita
- una correccion se hace con reversa o anulacion, no con overwrite

### Cash Movement

- `pending -> posted`
- `posted -> voided`

Reglas:

- el movimiento original nunca se borra
- un `voided` debe tener trazabilidad a su reversa o anulacion

### Bank Reconciliation

- `draft -> in_review`
- `in_review -> balanced`
- `in_review -> variance`
- `variance -> adjusted`
- `draft -> voided`
- `in_review -> voided`

### Journal Entry

- `draft -> posted`
- `posted -> reversed`

## Invariantes

### Invariantes de `vendorBills`

- `totals.balance = totals.total - totals.paid`
- `totals.balance >= 0`
- `totals.paid >= 0`
- si `status = 'paid'`, entonces `totals.balance = 0`
- si `status = 'draft'`, no puede existir pago activo aplicado
- un `vendorBill` `voided` no puede aceptar pagos nuevos

### Invariantes de `accountsPayablePayments`

- todo pago `posted` debe tener `vendorBillId` valido
- todo pago `posted` debe tener `amount > 0`
- un pago `cash` requiere `cashCountId`
- un pago `bank` requiere `bankAccountId`
- misma `idempotencyKey` + mismo comando debe devolver el mismo resultado
- misma `idempotencyKey` + payload distinto debe fallar

### Invariantes de `cashMovements`

- todo `cashMovement` debe tener `sourceDocumentType` y `sourceDocumentId`
- todo `cashMovement` debe apuntar a caja o banco
- no se aceptan movimientos `posted` sin documento origen
- el ledger es append-only; las correcciones generan reversa

### Invariantes de `bankReconciliations`

- la conciliacion siempre referencia un `bankAccountId`
- `difference = statementBalance - ledgerBalance` salvo ajuste posterior explicitamente guardado
- una conciliacion `balanced` no puede quedar con diferencia no cero

### Invariantes de `journalEntries`

- debitos = creditos
- un asiento posteado no se edita en sitio
- toda reversa debe quedar vinculada al asiento original

## Reglas de integracion

### Compras

- `purchase` sigue siendo documento operativo
- una compra puede originar un `vendorBill`
- el saldo de `CxP` se calcula desde `vendorBills`, no desde `purchase.paymentState`
- `purchase.paymentState` puede sobrevivir como resumen o compatibilidad temporal, pero no como fuente primaria

### Gastos

- un `expense` pagado al momento genera `cashMovement` + `accountingEvent`
- un `expense` a credito debe originar un `vendorBill` o pasivo equivalente
- no se permite un egreso de efectivo sin `cashCountId` o `bankAccountId` segun corresponda

### Pagos a suplidor

- un `accountsPayablePayment` reduce saldo de un `vendorBill`
- un `accountsPayablePayment` puede generar `cashMovement`
- un `accountsPayablePayment` debe generar `accountingEvent`

### Conciliacion bancaria

- `bankReconciliations` no cambia saldo por si sola
- si existe ajuste de conciliacion, debe terminar en `cashMovement` + `accountingEvent`

## No alcance de Sprint 1

- no se implementa todavia el workflow backend
- no se migran datos
- no se redisenan pantallas
- no se reescribe el proyector contable
- no se resuelve todavia `CxC` ni revaluacion `FX`

## Cambios implicados para los siguientes sprints

1. Quitar escrituras directas de tesoreria desde frontend
2. Reorientar `accountsPayablePayments` a `vendorBillId` como referencia primaria
3. Convertir `vendorBills` de proyeccion derivada a documento canonico
4. Endurecer `cashMovements` como ledger oficial de caja y banco
5. Degradar `liquidityLedger` a read model o eliminarlo

## Criterios de aceptacion de Sprint 1

- Existe una sola lectura aprobada del modelo de `CxP`, tesoreria y contabilidad general
- Queda explicito que colecciones se reutilizan y cuales dejan de ser fuente primaria
- Todas las entidades principales tienen state machine
- Todos los invariantes criticos estan documentados
- Queda claro como se integran `compras`, `gastos`, `CxP`, tesoreria y contabilidad
- El equipo puede empezar Sprint 2 sin reabrir el diseno base
