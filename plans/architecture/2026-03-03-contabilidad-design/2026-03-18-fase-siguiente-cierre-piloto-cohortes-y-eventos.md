# Fase siguiente: cierre del piloto, cohortes y arranque de eventos contables

> Estado: `historical snapshot`
>
> Este documento se mantiene como referencia del corte de marzo.
> Para prioridades y lectura vigente usar primero:
> `README.md`, `2026-04-04-sync-plan-contabilidad-vs-pdf.md` y `contabilidad-backlog.md`.

Fecha: `2026-03-18`

Actualizacion `2026-03-24`:

- `chartOfAccounts` y `accountingPostingProfiles` ya existen como capa de configuracion en `settings/accounting`
- sigue pendiente su conexion a productores reales de eventos, `journalEntries` y reportes contables

## Resumen

El frente operativo ya no esta en cero. El piloto `X63aIFwHzk3r0gmT8w6P` ya tiene:

- `cashMovements` para `invoice_pos`, `receivable_payment`, `expense` y `supplier_payment`
- `paymentState` y `paymentTerms` en compras
- `accountsPayablePayments` como ledger operativo inicial
- `monetary`, `bankAccounts` y `exchangeRates` como base de configuracion
- `chartOfAccounts` y `accountingPostingProfiles` como configuracion persistente en frontend + Firestore

La siguiente fase ya no debe ser "seguir agregando piezas sueltas". Debe dividirse en dos bloques:

1. cerrar de verdad la fase operativa para dejar el piloto limpio y listo para cohortes
2. abrir la fase de `AccountingEvents + projections`, pero sin saltar todavia a `journal`

## Que nos falta antes de salir de la fase operativa

### 1. Cerrar datos y referencias del piloto

- poblar `exchangeRates/{rateId}` reales por negocio
- poblar `bankAccounts/{bankAccountId}` reales y usarlos como referencia obligatoria
- resolver los huecos legacy que aun queden en `paymentState`, `paymentTerms`, `rateId` y `bankAccountId`
- correr auditoria final del piloto y dejarlo sin diferencias materiales

### 2. Endurecer CxP y trazabilidad de proveedor

- pasar de "registro de pago" a flujo operativo completo con evidencia usable
- agregar recibo printable o vista formal de pago a proveedor
- agregar historial por compra y luego historial por proveedor
- dejar `purchase.paymentAt` solo como compatibilidad legacy
- dejar claro que el source of truth del pago proveedor es `accountsPayablePayments`

### 3. Cerrar rollout mas alla del piloto

- preparar una cohorte pequena de expansion
- aplicar `dual-write -> backfill -> audit -> cutover`
- no abrir corte global mientras una cohorte pequena no cierre limpia
- mantener `syncAccountingExchangeRateReferencesDaily` fuera de este corte

### 4. Limpiar deuda funcional legacy

- `invoice.paymentHistory` deja de ser verdad primaria
- `expense.payment.bank` deja de ser dato canonico
- `purchase.paymentAt` deja de representar el pago real
- los read models deben quedar documentados contra sus sources of truth

## Siguiente macrofase recomendada

Una vez cerrado lo anterior, la siguiente macrofase ya si debe ser:

- `AccountingEvents`
- `dead letters + replay`
- proyecciones auxiliares

Todavia no:

- integracion de `chartOfAccounts` y `accountingPostingProfiles` con `journalEntries`
- `journalEntries`
- conciliacion bancaria completa

## Workstreams de la siguiente macrofase

### 1. Productores de eventos contables

- `invoice.committed`
- `receivable.payment_recorded`
- `supplier.payment_recorded`
- `expense.recorded`

La regla es la misma en todos los casos: eventos inmutables, idempotentes y emitidos desde backend o trigger confiable, no desde mutaciones optimistas del frontend.

### 2. Infraestructura de eventos

- contrato formal `AccountingEvent`
- `dedupeKey`, `eventVersion`, `idempotencyKey`
- `dead letters`
- replay seguro de proyecciones

### 3. Proyecciones iniciales

- estado de cuenta por cliente
- estado de cuenta por proveedor
- balances bancarios y cuentas puente
- flujo monetario por moneda

### 4. Reglas de periodo y gobierno

- `period lock`
- politica de override de tasa
- permisos para tasas, bancos, replay y recovery

## Orden recomendado

1. cerrar datos y referencias del piloto
2. endurecer CxP y trazabilidad de proveedor
3. validar una cohorte pequena fuera del piloto
4. abrir `AccountingEvents`
5. construir proyecciones auxiliares
6. solo despues pasar a `journal` usando `chartOfAccounts` y `postingProfiles` ya persistidos

## Criterios de cierre de la fase operativa

- el piloto no tiene huecos materiales de `rateId`, `bankAccountId`, `paymentState` ni `paymentTerms`
- compras y pagos a proveedor ya no dependen de heuristicas legacy
- caja y auditoria pueden operar por `cashMovements` sin diferencias materiales
- existe al menos una cohorte pequena validada fuera del piloto
- los campos legacy conflictivos quedan degradados a compatibilidad, no a verdad principal

## Criterios de entrada a la fase de eventos

- los documentos operativos ya guardan `monetary` de forma consistente
- pagos cliente y proveedor ya tienen ledger operativo usable
- FX y bancos ya tienen referencia estructurada en operaciones nuevas
- la capa operativa deja de cambiar de shape cada pocos cortes

## Relacion con los planes anteriores

Este documento toma como base:

- `archive/2026-03-18-plan-nocturno-cierre-fase-operativa-pagos-caja-fx.md`
- `archive/2026-03-17-dominio-pagos-ventas-compras-design.md`
- `archive/2026-03-17-migracion-pagos-caja-design.md`

Su objetivo es marcar el punto de quiebre entre:

- terminar bien la fase operativa
- y arrancar la fase de eventos y proyecciones sin mezclar ambas
