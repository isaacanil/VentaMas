# Sprint 2: tesoreria canonica

Fecha: `2026-04-13`

Estado: `propuesto para ejecucion`

## Problema

Hoy el repo ya tiene piezas validas para tesoreria, pero el write path sigue roto:

- el frontend registra transferencias internas escribiendo directo en `internalTransfers` y `liquidityLedger`
- el frontend registra conciliaciones escribiendo directo en `bankReconciliations`
- existe un callable backend real para `internalTransfers`, pero la UI no lo usa
- `cashMovements` ya existe como ledger operativo fuerte, pero no es la unica puerta de entrada

La consecuencia es que tesoreria no tiene una frontera canonica. Se pueden crear movimientos visibles sin pasar por:

- validacion uniforme de periodo
- idempotencia
- trazabilidad contable
- invariantes de caja/banco

## Objetivo

Cerrar el write path de tesoreria para que:

- toda mutacion critica entre por backend
- `cashMovements` quede como ledger canonico de liquidez
- `internalTransfers` y `bankReconciliations` dejen de aceptar escrituras directas desde la UI
- el backend soporte idempotencia como contrato obligatorio

## Evidencia del repo

### Escritura directa desde frontend hoy

En `src/modules/treasury/hooks/useTreasuryWorkspace.ts`:

- `recordInternalTransfer` arma `writeBatch` y persiste directo en:
  - `businesses/{businessId}/internalTransfers`
  - `businesses/{businessId}/liquidityLedger`
- `recordBankReconciliation` persiste directo en:
  - `businesses/{businessId}/bankReconciliations`

### Camino backend ya existente

En `functions/src/app/modules/treasury/functions/createInternalTransfer.js` ya existe un callable que:

- valida auth y acceso
- valida cajas/cuentas
- valida periodo abierto
- crea `internalTransfers`
- crea `cashMovements`
- crea `accountingEvents`

Eso confirma que el problema no es falta total de backend, sino falta de adopcion del camino canonico y ausencia de idempotencia unificada.

## Restricciones

- No crear una segunda familia de colecciones (`cashMovementsV2`, `bankReconciliationsV2`).
- No introducir versionado de dominio si estas superficies aun no estan operativas.
- No mantener dos write paths en paralelo mas tiempo del estrictamente necesario.
- No permitir que `liquidityLedger` siga compitiendo con `cashMovements` como fuente primaria.

## Decision recomendada

### Regla principal

Toda mutacion de tesoreria debe entrar por **callable/backend command**.

### Regla de fuente de verdad

- `cashMovements` = ledger canonico
- `internalTransfers` = documento operativo de soporte
- `bankReconciliations` = documento operativo de conciliacion
- `liquidityLedger` = derivado temporal o superficie de lectura, no fuente primaria

### Regla de idempotencia

Todo comando financiero de tesoreria debe exigir:

- `idempotencyKey`
- `businessId`
- `occurredAt`
- `actor`
- `sourceDocumentType`
- `sourceDocumentId`

## Comandos backend obligatorios

### 1. `createInternalTransfer`

Se reutiliza el callable existente, pero se endurece con idempotencia.

Responsabilidades:

- validar origen y destino
- validar estado activo de caja/banco
- validar periodo abierto
- crear `internalTransfers`
- crear dos `cashMovements`
- crear `accountingEvent`
- devolver respuesta reutilizable ante reintento

Payload objetivo:

```ts
type CreateInternalTransferCommand = {
  businessId: string;
  idempotencyKey: string;
  occurredAt?: TimestampLike | number | null;
  reference?: string | null;
  note?: string | null;
  from: {
    type: 'cash' | 'bank';
    cashCountId?: string | null;
    bankAccountId?: string | null;
  };
  to: {
    type: 'cash' | 'bank';
    cashCountId?: string | null;
    bankAccountId?: string | null;
  };
  amount: number;
};
```

### 2. `createBankReconciliation`

Nuevo callable.

Responsabilidades:

- validar `bankAccountId`
- validar periodo o fecha objetivo
- calcular `ledgerBalance` desde `cashMovements`
- registrar `bankReconciliations`
- devolver estado `balanced` o `variance`
- no mutar saldo por si sola

Payload objetivo:

```ts
type CreateBankReconciliationCommand = {
  businessId: string;
  idempotencyKey: string;
  bankAccountId: string;
  statementDate: TimestampLike | number;
  statementBalance: number;
  reference?: string | null;
  note?: string | null;
};
```

### 3. `createTreasuryAdjustment`

No hace falta implementarlo en este sprint, pero debe quedar reservado como siguiente comando canonico cuando una conciliacion con diferencia requiera ajuste real.

Responsabilidades futuras:

- crear `cashMovement`
- crear `accountingEvent`
- vincularse a `bankReconciliation`

## Coleccion de idempotencia

Ruta recomendada:

- `businesses/{businessId}/idempotency/{idempotencyKey}`

Shape minimo:

```ts
type IdempotencyRecord = {
  id: string;
  businessId: string;
  command:
    | 'createInternalTransfer'
    | 'createBankReconciliation'
    | 'createTreasuryAdjustment';
  requestHash: string;
  status: 'processing' | 'completed' | 'failed';
  sourceDocumentType: string;
  sourceDocumentId: string | null;
  responseSnapshot?: Record<string, unknown> | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  createdBy: string | null;
};
```

## Regla de idempotencia

### Caso 1. Misma key, mismo payload logico

El backend debe:

- detectar coincidencia por `idempotencyKey`
- comparar `requestHash`
- devolver el resultado ya persistido
- no crear nuevos `cashMovements`

### Caso 2. Misma key, payload distinto

El backend debe:

- rechazar la peticion
- no mutar ningun documento
- devolver `failed-precondition` o error equivalente

### Caso 3. Reintento durante procesamiento

El backend debe:

- detectar `status = processing`
- devolver respuesta controlada o reintento seguro
- evitar carreras que dupliquen transferencias o conciliaciones

## Modelo de lectura despues de Sprint 2

### Ledger de liquidez

La UI debe leer desde `cashMovements` o desde un derivado construido a partir de `cashMovements`.

Decision:

- `liquidityLedger` no vuelve a recibir escrituras directas
- si se mantiene, debe regenerarse desde backend o dejarse como compatibilidad temporal de lectura

### Transferencias

La UI puede seguir leyendo `internalTransfers` como lista de soporte, pero su verdad de saldo sale de `cashMovements`.

### Conciliacion bancaria

La UI puede seguir leyendo `bankReconciliations`, pero ya no las crea ni las muta directo.

## Reglas operativas

### Transferencias internas

- origen y destino deben ser distintos
- `amount > 0`
- si involucra caja, la caja debe estar operativa para ese flujo
- si involucra banco, la cuenta debe estar activa
- toda transferencia genera exactamente dos `cashMovements`

### Conciliaciones bancarias

- siempre ligadas a un `bankAccountId`
- `ledgerBalance` se calcula desde `cashMovements` posteados
- `difference = statementBalance - ledgerBalance`
- si hay diferencia, la conciliacion queda en `variance`, no genera ajuste automatico

## Cambios requeridos en frontend

### `useTreasuryWorkspace`

Debe dejar de:

- hacer `writeBatch` directo para `internalTransfers`
- hacer `writeBatch` directo para `liquidityLedger`
- hacer `writeBatch` directo para `bankReconciliations`

Debe pasar a:

- invocar callables backend
- enviar `idempotencyKey`
- mostrar resultado reutilizado cuando aplique

### Pantallas afectadas

- `TreasuryBankAccountsPage`
- `InternalTransferModal`
- `BankReconciliationModal`
- cualquier wrapper que hoy consuma `recordInternalTransfer` o `recordBankReconciliation`

## Reglas de seguridad

- `firestore.rules` no debe permitir crear ni editar estas colecciones criticas desde cliente final:
  - `cashMovements`
  - `internalTransfers`
  - `bankReconciliations`
  - `idempotency`

Si hoy hay lecturas necesarias desde frontend, se mantienen solo donde aplique. El write path debe quedar restringido al backend.

## No alcance de Sprint 2

- no se implementa matching avanzado de conciliacion bancaria
- no se importan extractos bancarios
- no se construye dashboard completo de liquidez
- no se redisenan reportes de tesoreria
- no se introduce todavia `cashAccount` como entidad aparte si el equipo decide dejarlo para un sprint posterior

## Plan de implementacion

### Slice 1. Contrato e idempotencia

- definir payloads backend
- crear helper comun de idempotencia para tesoreria
- integrar `requestHash` y respuesta reutilizable

### Slice 2. Transferencias internas

- endurecer `createInternalTransfer`
- mover frontend a callable
- cortar write path directo

### Slice 3. Conciliacion bancaria

- crear `createBankReconciliation`
- mover frontend a callable
- cortar write path directo

### Slice 4. Endurecimiento de reglas

- revisar `firestore.rules`
- asegurar que las colecciones criticas no acepten writes desde cliente
- dejar `liquidityLedger` fuera del write path

## Criterios de aceptacion

- no existe escritura directa desde frontend a `internalTransfers`
- no existe escritura directa desde frontend a `bankReconciliations`
- `cashMovements` queda como ledger canonico
- toda transferencia interna entra por backend
- toda conciliacion bancaria entra por backend
- toda mutacion de tesoreria requiere `idempotencyKey`
- un reintento con la misma key no duplica documentos ni movimientos
- una misma key con payload distinto falla de forma controlada
