# Diseno de conciliacion bancaria

Fecha: `2026-04-05`

Estado: `propuesto`

## Problema

Hoy el repo ya tiene piezas suficientes para abrir conciliacion bancaria, pero todavia no existe un workflow explicito:

- `bankAccounts` ya modela cuenta, moneda y saldo/apertura.
- `cashMovements` ya proyecta movimientos bancarios para `invoice_pos`, `receivable_payment`, `supplier_payment`, `expense` e `internal_transfer`.
- `accountingEvents` y `journalEntries` ya dan trazabilidad contable.

El hueco real no es "crear banca desde cero", sino conectar esas piezas bajo una operacion controlada: extracto, matching, diferencias, cierre y ajuste.

## Objetivo

Definir un workflow minimo viable y compatible con el repo actual para:

- conciliar por `bankAccountId`
- usar `cashMovements` como libro operativo bancario
- usar `journalEntries` como evidencia y ajuste contable
- permitir cierre manual con diferencias explicitas
- dejar un camino implementable por slices sin importar extractos reales en esta fase

## Restricciones

- No reemplazar `cashMovements`, `accountsReceivablePayments`, `accountsPayablePayments` ni `journalEntries`.
- No reconciliar directo contra pagos por dominio como fuente primaria.
- No diseñar matching automatico complejo en esta fase.
- No asumir que todos los movimientos bancarios manuales ya existen en `cashMovements`.

## Decision recomendada

La conciliacion bancaria debe vivir como una capa propia arriba de `bankAccounts` y `cashMovements`.

Unidad canonica para conciliar:

- `cashMovements` con `impactsBankLedger = true`
- `bankAccountId` presente
- `status = posted`

Soporte contable:

- `accountingEvent.treasury.bankAccountId`
- `accountingEvent.treasury.paymentChannel`
- `journalEntries` vinculados por `eventId` o por ajuste manual de conciliacion

Esto deja la operacion asi:

1. el extracto bancario entra como dataset normalizado
2. la conciliacion carga lineas del extracto y candidatos internos del banco
3. el usuario hace matching manual o asistido
4. las diferencias quedan clasificadas
5. si hace falta, se crea un ajuste explicito
6. el periodo de conciliacion se cierra con trazabilidad

## Alternativas descartadas

### 1. Conciliar directo contra `journalEntries`

Descartada como opcion MVP.

Pros:

- es la capa contable final
- incluye asientos manuales

Contras:

- `journalEntries.lines[]` no es un shape comodo para matching operativo
- hoy no expone `bankAccountId` como dimension lista para consulta
- obligaria a resolver ya la relacion exacta cuenta bancaria -> cuenta contable -> linea del asiento

### 2. Conciliar directo contra pagos de `CxC` y `CxP`

Descartada como fuente primaria.

Pros:

- documentos mas cercanos al negocio

Contras:

- fragmenta ventas, compras, gastos y transferencias en workflows distintos
- deja fuera `expense` e `internal_transfer` como ciudadanos de segunda
- rompe la idea ya adoptada en el repo de proyectar tesoreria a `cashMovements`

## Modelo recomendado

### Coleccion 1: sesiones de conciliacion

```ts
type BankReconciliationSession = {
  id: string;
  businessId: string;
  bankAccountId: string;
  bankAccountSnapshot: {
    name: string;
    currency: string;
    institutionName?: string | null;
    accountNumberLast4?: string | null;
  };
  periodStart: TimestampLike;
  periodEnd: TimestampLike;
  statementOpeningBalance: number | null;
  statementClosingBalance: number | null;
  bookOpeningBalance: number | null;
  bookClosingBalance: number | null;
  bookClosingBalanceAfterAdjustments: number | null;
  differenceAmount: number | null;
  status: 'draft' | 'in_review' | 'ready_to_close' | 'closed';
  source: 'manual' | 'statement_import';
  importReference?: string | null;
  totals: {
    statementLines: number;
    matchedStatementAmount: number;
    unmatchedStatementAmount: number;
    unmatchedBookAmount: number;
    adjustmentAmount: number;
  };
  lastClosedSessionId?: string | null;
  closedAt?: TimestampLike | null;
  closedBy?: string | null;
  createdAt: TimestampLike;
  createdBy: string | null;
  updatedAt: TimestampLike;
  updatedBy: string | null;
};
```

Ruta sugerida:

- `businesses/{businessId}/bankReconciliationSessions/{sessionId}`

### Coleccion 2: lineas del extracto

```ts
type BankStatementLine = {
  id: string;
  sessionId: string;
  businessId: string;
  bankAccountId: string;
  bookingDate: TimestampLike | null;
  valueDate: TimestampLike | null;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  externalId?: string | null;
  fingerprint: string;
  status: 'unmatched' | 'matched' | 'adjusted' | 'ignored';
  resolutionType?: 'match' | 'adjustment' | 'timing_difference' | 'ignored' | null;
  matchedMovementIds?: string[];
  matchedJournalEntryIds?: string[];
  adjustmentJournalEntryId?: string | null;
  notes?: string | null;
  raw?: Record<string, unknown>;
  createdAt: TimestampLike;
  createdBy: string | null;
  updatedAt: TimestampLike;
  updatedBy: string | null;
};
```

Ruta sugerida:

- `businesses/{businessId}/bankReconciliationSessions/{sessionId}/statementLines/{lineId}`

### Coleccion 3: matches explicitos

```ts
type BankReconciliationMatch = {
  id: string;
  sessionId: string;
  businessId: string;
  bankAccountId: string;
  statementLineIds: string[];
  cashMovementIds: string[];
  journalEntryIds: string[];
  mode: 'manual' | 'suggested' | 'adjustment';
  status: 'active' | 'void';
  statementAmount: number;
  bookAmount: number;
  deltaAmount: number;
  notes?: string | null;
  createdAt: TimestampLike;
  createdBy: string | null;
  voidedAt?: TimestampLike | null;
  voidedBy?: string | null;
};
```

Ruta sugerida:

- `businesses/{businessId}/bankReconciliationSessions/{sessionId}/matches/{matchId}`

## Reglas del modelo

### Fuente primaria para el lado libro

El lado libro debe salir de:

- `cashMovements`

Filtro minimo:

- `bankAccountId == {session.bankAccountId}`
- `impactsBankLedger == true`
- `status == 'posted'`

Rango cargado:

- movimientos del periodo
- mas movimientos previos no conciliados de esa misma cuenta

### Fuente primaria para el lado extracto

El lado extracto sale de:

- `statementLines`

En esta fase no se diseña importador real. La carga inicial puede ser manual o por un parser futuro.

### Relacion con `journalEntries`

`journalEntries` no es la fuente primaria del matching. Se usa para:

- mostrar el asiento del movimiento conciliado
- verificar trazabilidad contable
- registrar ajustes de conciliacion

### Ajustes

Para que la conciliacion cierre de verdad, un ajuste bancario no debe existir solo como `journalEntry`.

Decision recomendada:

- todo ajuste que cambie saldo bancario debe terminar generando:
  - `journalEntry`
  - `cashMovement` nuevo con `sourceType = 'bank_adjustment'`

Ese `sourceType` no existe hoy y debe entrar en un slice posterior. Sin eso, el libro bancario en `cashMovements` quedaria incompleto frente al extracto.

## Workflow funcional

### Paso 1. Abrir sesion

El usuario elige:

- `bankAccount`
- `periodStart`
- `periodEnd`
- saldo inicial y saldo final del extracto

El sistema calcula:

- ultimo cierre previo para esa cuenta
- `bookOpeningBalance`
- candidatos internos del periodo

### Paso 2. Cargar extracto

El usuario agrega lineas del extracto.

Cada linea se normaliza y recibe:

- `fingerprint`
- `direction`
- `amount`
- `status = unmatched`

### Paso 3. Matching

MVP recomendado:

- soportar `1 statement line -> 1 cashMovement`
- soportar `1 statement line -> N cashMovements`
- no soportar todavia `N statement lines -> 1 cashMovement`

El match se considera valido cuando:

- todos los `cashMovements` pertenecen a la misma cuenta bancaria
- todos siguen `unmatched` en esa sesion
- la diferencia neta queda dentro de tolerancia o se marca como ajuste

### Paso 4. Resolver diferencias

Tipos de diferencia:

- `timing_difference`
- `bank_fee_or_interest`
- `duplicate_statement_line`
- `missing_book_movement`
- `missing_statement_line`
- `amount_mismatch`

Resolucion MVP:

- aceptar diferencia temporal
- ignorar linea con justificacion
- crear ajuste
- dejar abierta para revision

### Paso 5. Cerrar sesion

Una sesion solo puede pasar a `closed` cuando:

- no hay lineas `unmatched` sin clasificar
- no hay `cashMovements` del periodo sin estado
- `differenceAmount` final es `0` o esta totalmente explicada por resoluciones aprobadas

## Estados

### Sesion

- `draft`: creada, aun editable sin revisiones
- `in_review`: ya tiene lineas o matches y se esta trabajando
- `ready_to_close`: todas las diferencias tienen resolucion
- `closed`: cierre confirmado y bloqueado salvo reapertura administrativa futura

### Statement line

- `unmatched`
- `matched`
- `adjusted`
- `ignored`

### Match

- `active`
- `void`

## Decisiones operativas

### 1. La conciliacion es por cuenta bancaria, no por modulo

La misma vista debe cubrir:

- cobros `CxC`
- pagos `CxP`
- gastos
- transferencias internas

porque todos ya confluyen en `cashMovements`.

### 2. No mutar pagos operativos para guardar el estado de conciliacion

La trazabilidad operativa debe quedar en la capa de conciliacion y, si hace falta denormalizar, el primer candidato es `cashMovements`, no `accountsReceivablePayments` ni `accountsPayablePayments`.

### 3. El cierre no debe depender de heuristicas

Cada match debe ser explicito y auditable. La sugerencia automatica puede existir despues, pero nunca sustituir el registro final del usuario.

## Riesgos

### Riesgo 1. Movimientos bancarios manuales fuera de `cashMovements`

Impacto:

- el libro bancario quedaria incompleto

Mitigacion:

- introducir `bank_adjustment` como nuevo `sourceType`
- exigirlo para ajustes de conciliacion

### Riesgo 2. Saldos de apertura inconsistentes

Impacto:

- una sesion podria arrancar ya descuadrada

Mitigacion:

- usar ultimo cierre conciliado como base
- si no existe, usar `bankAccount.openingBalance` y marcar sesion como primer corte

### Riesgo 3. Batch settlements

Impacto:

- una linea del extracto puede agrupar varios cobros

Mitigacion:

- soportar `1 -> N` desde el primer corte
- dejar `N -> 1` para una fase posterior solo si aparece una necesidad real

### Riesgo 4. Performance

Impacto:

- una cuenta con mucho movimiento puede cargar demasiado volumen

Mitigacion:

- traer por ventana de fechas
- traer solo `unmatched` historicos previos
- paginar `statementLines` y candidatos internos por separado

## Backlog por slices

### Slice 1. Modelo y sesion base

- crear `bankReconciliationSessions`
- crear `statementLines`
- cargar candidatos internos desde `cashMovements`
- calcular resumen y diferencias base

### Slice 2. Matching manual

- crear `matches`
- permitir `1 -> 1`
- permitir `1 -> N`
- reflejar estado resumido en `statementLines`

### Slice 3. Ajustes

- crear flujo de ajuste bancario
- emitir `journalEntry` de ajuste
- proyectar `cashMovement` con `sourceType = bank_adjustment`
- volver conciliable el ajuste dentro de la misma sesion

### Slice 4. Cierre y auditoria

- bloquear sesion cerrada
- guardar snapshot final del cierre
- exponer bitacora de cambios y de decisiones por linea

### Slice 5. Asistencia y mejoras

- sugerencias de matching por monto, fecha, referencia y `bankAccountId`
- importador/parser de extractos
- reapertura administrativa

## Criterios de aceptacion por fase

### Fase 1

- se puede abrir una sesion por `bankAccountId`
- se pueden cargar lineas del extracto
- se ven candidatos internos desde `cashMovements`
- el sistema calcula diferencia preliminar

### Fase 2

- se puede crear y anular un match
- una linea cambia entre `unmatched` y `matched`
- el match deja trazabilidad a `cashMovement`, documento origen y `journalEntry` si existe

### Fase 3

- un ajuste bancario genera `journalEntry` y `cashMovement`
- el ajuste afecta el saldo conciliado
- el ajuste queda rastreable desde la sesion

### Fase 4

- no se puede cerrar con diferencias abiertas sin resolver
- una sesion cerrada deja snapshot final y actor
- el siguiente corte toma ese cierre como base de apertura

## Orden recomendado

1. Slice 1
2. Slice 2
3. Slice 4
4. Slice 3
5. Slice 5

Nota:

Si aparecen diferencias reales que obliguen ajustes antes del cierre, entonces `Slice 3` sube antes de `Slice 4`. El orden recomendado asume que primero conviene validar workflow y dataset antes de abrir asientos de ajuste.

## Referencias del repo actual

- `src/utils/accounting/bankAccounts.ts`
- `functions/src/app/versions/v2/accounting/utils/cashMovement.util.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js`
- `src/types/accounting.ts`
