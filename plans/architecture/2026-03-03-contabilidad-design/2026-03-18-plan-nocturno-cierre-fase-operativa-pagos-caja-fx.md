# Plan nocturno integral: cierre de fase operativa de pagos, caja y tasa de cambio

Fecha: `2026-03-18`

## Objetivo

Cerrar por completo la fase operativa que cubre:

- ventas y pago inicial POS
- cuentas por cobrar normales
- cuentas por cobrar de seguros
- compras
- cuentas por pagar a proveedor
- gastos
- cuadre de caja
- proyeccion `cashMovements`
- snapshots monetarios y tasa de cambio aplicada
- nueva estructura de pagos compartida para documentos y eventos

La intencion de este plan no es abrir otra fase de backlog. La intencion es dejar un plan ejecutable para que, al terminarlo, esta fase quede realmente cerrada y no queden huecos operativos entre modulos.

## Frontera exacta de la fase

Esta fase se considera cerrada cuando:

1. Todo documento operativo relevante expone `paymentState` o su equivalente adaptado.
2. Todo pago real relevante vive en un ledger operativo de su dominio.
3. Caja y auditoria leen `cashMovements` como fuente principal.
4. Las compras ya no dependen de `paymentAt` ni de `paid = total`.
5. Existe `accountsPayablePayments` para pagos reales a proveedor.
6. `exchangeRates` y `bankAccounts` existen y participan en snapshots nuevos.
7. La migracion del piloto y el rollout seguro ya estan ejecutados, auditados y listos para expandirse.

Esta fase no incluye como criterio de cierre:

- journal contable completo
- `accountingEvents` globales para journal
- conciliacion bancaria completa
- reportes mayores

Eso pertenece a la fase siguiente de `events -> projections -> journal`.

## Punto de partida real

### Ya resuelto en el piloto

- Existe contrato compartido base de `monetary`, `paymentState` y `cashMovements`.
- `invoicesV2`, `invoices`, `accountsReceivablePayments`, `purchases` y `expenses` ya guardan `monetary` en el piloto.
- `cashMovements` ya cubre `receivable_payment`, `invoice_pos` y `expense` para `X63aIFwHzk3r0gmT8w6P`.
- El piloto ya tiene backfill ejecutado de `receivable_payment`, `invoice_pos` y `expense`.
- El cuadre y la auditoria del piloto ya priorizan `cashMovements` con fallback por fuente.
- Compras ya usa `paymentTerms` y `paymentState` como base y dejo de asumir siempre `paid = total`.
- `exchangeRates/{rateId}` ya existe para escrituras nuevas desde settings.
- `bankAccounts/{bankAccountId}` ya existe con write path y lectura en settings/gastos.
- Gastos ya dejo de depender de `payment.bank` libre para operaciones nuevas y ahora usa `bankAccountId` + `cashMovements`.

### Lo que todavia falta para cerrar la fase

- formalizar `exchangeRates/{rateId}`
- cerrar contrato compartido `paymentEvent`
- introducir `accountsPayablePayments`
- terminar compras/CxP con recibos y evidencia real
- cerrar la capa final de rollout `dual-write -> backfill -> cutover` mas alla del piloto
- decidir y documentar deprecaciones finales de lectura/escritura legacy

## Ejecucion piloto 2026-03-18

### Scripts agregados en esta pasada

- `functions/scripts/auditCashMovementsCoverage.mjs`
- `functions/scripts/backfillInvoicePaymentState.mjs`
- `functions/scripts/backfillPurchasePaymentTermsAndLegacyState.mjs`

### Resultado medido en `X63aIFwHzk3r0gmT8w6P`

Antes del backfill:

- `invoices.missingPaymentState = 867`
- `purchases.missingPaymentTerms = 47`
- `purchases.missingPaymentState = 47`

Despues del backfill:

- `invoices.missingPaymentState = 18`
- `purchases.missingPaymentTerms = 4`
- `purchases.missingPaymentState = 4`

Hallazgos que siguen abiertos en el piloto:

- `bankAccounts.total = 0`
- `exchangeRates.total = 0`
- `invoice_pos` todavia tiene `16` `cashMovements` bancarios sin `bankAccountId`
- `expenses.missingRateId = 1`
- `invoices.missingRateId = 36`
- `purchases.missingRateId = 1`

## Decisiones que no se reabren en este plan

### 1. Metodos canonicos

Durante esta fase los metodos canonicos siguen siendo:

- `cash`
- `card`
- `transfer`
- `creditNote`

Detalles como `credit_card`, `debit_card`, `bank_transfer` o `check` solo viven como metadata opcional o alias de migracion, no como nuevo canone de dominio.

### 2. No existe una sola coleccion operativa global `payments`

La estructura correcta de esta fase es:

- documento con `paymentState`
- ledger operativo por dominio
- proyeccion global `cashMovements`

No se colapsa AR y AP en una sola coleccion fuente.

### 3. Caja no se calcula “como pueda”

El source principal del cuadre debe ser:

- `cashMovements`

`cashCounts` queda como agregado operativo de apertura/cierre, no como motor de descubrimiento de operaciones.

### 4. Compras no se resuelven con heuristicas de pago falso

No se infiere pago historico desde:

- `paymentAt`
- `condition`
- `status`

Si un pago viejo no tiene evidencia real, queda legacy y requiere revision.

## Definicion de terminado por modulo

### Ventas / POS

La fase queda cerrada cuando:

- el pago inicial POS ya tiene contrato estable
- `invoice_pos` se proyecta siempre a `cashMovements`
- las facturas exponen `paymentState`
- los historicos del piloto ya estan backfilleados
- el cuadre ya no depende del calculo legacy de ventas

### CxC normal y seguros

La fase queda cerrada cuando:

- `accountsReceivablePayments` ya esta alineado al contrato comun
- seguros sigue dentro de AR sin ledger aparte
- cada pago real emite `cashMovements`
- la auditoria ya no tiene reglas especiales incoherentes entre UI y backend

### Compras / CxP

La fase queda cerrada cuando:

- `purchases` guarda `paymentTerms`
- `purchases` guarda `paymentState`
- existe `accountsPayablePayments`
- cada pago a proveedor genera recibo y evidencia
- el listado de compras ya distingue recepcion vs pago

### Gastos

La fase queda cerrada cuando:

- `expenses` sigue como source operativo
- cada gasto relevante emite `cashMovements`
- el origen de fondos deja de depender de strings ambiguos
- existe camino confiable server-side para la proyeccion

### Tasa de cambio

La fase queda cerrada cuando:

- existe `exchangeRates`
- la seleccion de tasa `buy/sell` ya no es solo una convencion implcita
- compras/pagos proveedor usan `buyRate`
- ventas/cobros cliente usan `sellRate`
- los snapshots monetarios ya no dependen solo del fallback a moneda funcional

### Caja / cuadre / auditoria

La fase queda cerrada cuando:

- el piloto cierra desde `cashMovements`
- la auditoria y la UI usan la misma semantica
- las diferencias legacy vs nuevo ya estan explicadas o deprecadas
- los totales guardados en `cashCounts` ya no son una verdad paralela independiente

## Arquitectura objetivo al final de esta fase

### Colecciones que deben existir y quedar activas

- `businesses/{businessId}/settings/accounting`
- `businesses/{businessId}/exchangeRates/{rateId}`
- `businesses/{businessId}/bankAccounts/{bankAccountId}`
- `businesses/{businessId}/cashMovements/{movementId}`
- `businesses/{businessId}/accountsReceivablePayments/{paymentId}`
- `businesses/{businessId}/accountsPayablePayments/{paymentId}`
- `businesses/{businessId}/purchases/{purchaseId}`
- `businesses/{businessId}/expenses/{expenseId}`
- `businesses/{businessId}/invoices/{invoiceId}`
- `businesses/{businessId}/invoicesV2/{invoiceId}`

### Contratos minimos que deben quedar cerrados

- `MonetarySnapshot`
- `PaymentMethodEntry`
- `DocumentPaymentState`
- `PaymentEvent`
- `CashMovement`
- `PurchasePaymentTerms`
- `AccountsPayablePayment`

### Contratos que pueden seguir adaptados, no reescritos

- `invoice.paymentMethod`
- `invoice.accumulatedPaid`
- `invoice.balanceDue`
- `invoice.paymentStatus`

Es valido mantenerlos mientras exista adaptador comun a `paymentState`.

## Recortes prohibidos

### No hacer `accountsPayablePayments` como subcoleccion unica de `purchases/{id}/paymentReceipts`

No para esta fase.

Motivo:

- rompe simetria con CxC
- dificulta reporte transversal
- dificulta cuadre y consultas por proveedor

La subcoleccion puede existir como soporte de UI o evidencia, pero el ledger operativo debe ser transversal.

### No cambiar escritura y lectura en el mismo release

Motivo:

- no deja rollback limpio
- multiplica riesgo en caja y saldos

### No introducir nuevos metodos canonicos ahora

Motivo:

- rompe ventas, CxC, recibos y auditorias existentes
- agrega complejidad accidental sin valor inmediato

### No marcar compras legacy como pagadas por heuristica

Motivo:

- fabrica precision falsa
- destruye confianza en CxP desde el primer corte

### No declarar la fase cerrada solo porque el piloto funciona

Motivo:

- la fase se cierra cuando el plan de expansion, deprecacion y verificacion tambien esta listo y probado

## Workstreams de cierre

## Workstream 0. Congelar contratos y naming

Objetivo:

cerrar el idioma comun para que el resto del plan no derive en variantes nuevas por modulo.

Tareas:

- formalizar `PaymentEvent` y `AccountsPayablePayment`
- decidir naming final de `rateType`, `effectiveRate`, `buyRate`, `sellRate`
- decidir naming final de `bankAccountId`, `cashCountId`, `counterpartyType`
- dejar tabla de aliases legacy -> canonico

Entregables:

- tipos compartidos en `src/types/*`
- equivalentes backend en `functions/src/app/versions/v2/accounting/*`
- documento corto de mapping legacy

Criterio de salida:

- ningun bloque posterior inventa otro shape de pago o tasa

## Workstream 1. Tasa de cambio y cuentas bancarias

Objetivo:

terminar la base operativa de FX y bancos para que compras, ventas, cobros y pagos no dependan de configuracion parcial.

Tareas:

- crear `exchangeRates/{rateId}` inmutable
- crear `bankAccounts/{bankAccountId}`
- terminar `exchange rate policy`
- conectar snapshots nuevos a tasa configurada por negocio
- agregar validaciones de `buyRate` para `purchase` y `payable-payment`
- agregar validaciones de `sellRate` para `sale` y `receivable-payment`

Entregables:

- CRUD o al menos write path controlado para tasas
- CRUD o al menos write path controlado para bancos
- adaptadores compartidos para seleccionar tasa efectiva

No recortar por:

- hardcodear `USD` o `DOP`
- dejar `bank` como string libre cuando ya exista `bankAccountId`

Criterio de salida:

- cualquier snapshot nuevo del piloto puede explicar de donde salio su tasa y a que cuenta bancaria apunta

## Workstream 2. Ventas y nueva estructura de pagos de factura

Objetivo:

dejar ventas completamente alineada a la estructura nueva sin romper `invoices` ni `invoicesV2`.

Tareas:

- formalizar adaptador `invoice -> paymentState`
- dejar `invoice_pos` como `PaymentEvent` implicito del checkout
- mantener snapshot POS en factura
- garantizar proyeccion `invoice_pos -> cashMovements`
- revisar recibos y render de metodos para usar el contrato comun
- decidir si el pago inicial POS se materializa o no en un ledger dedicado adicional

Recomendacion:

- no crear una coleccion operativa extra para `invoice_pos` en esta fase
- tratar el cobro inicial como snapshot POS + proyeccion a `cashMovements`
- reservar `PaymentEvent` formal adicional para la fase siguiente si hace falta journal

Entregables:

- factura con `paymentState` estable
- POS totalmente proyectado a caja
- historicos del piloto backfilleados

Criterio de salida:

- el ciclo `venta al contado -> cuadre -> auditoria` ya no tiene dependencia fuerte del shape legacy

## Workstream 3. CxC normal y seguros

Objetivo:

cerrar CxC como ledger operativo alineado al nuevo lenguaje.

Tareas:

- normalizar `accountsReceivablePayments` al contrato comun
- mantener cuotas y aplicaciones como regla de dominio propia
- revisar `creditNote` para que no genere caja
- terminar soportes de evidencia y referencias
- asegurar que seguros vive en el mismo ledger con metadata clara

Entregables:

- `accountsReceivablePayments` normalizado
- recibos CxC consistentes con metodos canonicos
- `cashMovements` emitidos por pagos reales

Criterio de salida:

- no hay diferencia conceptual entre lo que la UI de cobro muestra y lo que caja/auditoria calculan

## Workstream 4. Compras y CxP real

Objetivo:

cerrar el hueco mas grande de la fase: separar compra, deuda y pago al proveedor.

Tareas:

- introducir `accountsPayablePayments`
- introducir recibos y evidencias por pago
- completar `paymentTerms` y `paymentState` de compra
- agregar `payable-payment` a la logica monetaria
- soportar pagos parciales, pago total y proxima fecha
- agregar columnas y filtros de estado financiero en compras
- dejar `paymentAt` como compatibilidad legacy, no como verdad principal

Entregables:

- ledger operativo `accountsPayablePayments`
- UI de registrar pago a proveedor
- recibos de pago a proveedor
- historial de pagos por compra

No recortar por:

- guardar solo `amountPaid`
- omitir recibos
- reutilizar `accountsReceivablePayments`

Criterio de salida:

- una compra puede quedar `unpaid`, `partial`, `paid`, `overdue`, `unknown_legacy`
- cada cambio de estado se explica por pagos reales o por migracion legacy marcada

## Workstream 5. Gastos

Objetivo:

dejar gastos consistente con caja y con bancos sin inflar alcance.

Tareas:

- terminar trigger o backend confiable de `expense -> cashMovements`
- reemplazar `payment.bank` libre por `bankAccountId` donde aplique
- mantener `expenses` como source operativo
- distinguir gasto de caja vs gasto de banco
- agregar backfill y verificacion del piloto

Entregables:

- gastos proyectando consistentemente a `cashMovements`
- shape de origen de fondos ya no ambiguo

Criterio de salida:

- el cuadre deja de tener tratamiento especial frágil para gastos

## Workstream 6. Cuadre, auditoria y herramientas dev

Objetivo:

cerrar definitivamente caja sobre el modelo nuevo.

Tareas:

- terminar cutover de UI a `cashMovements` por fuente
- terminar cutover del auditor backend
- ajustar devtools que todavia lean legacy puro
- agregar comparadores `legacy vs new` por negocio piloto
- agregar reporte de documentos sin `cashCountId`, sin tasa o sin `paymentState`

Entregables:

- cuadre consistente
- auditoria consistente
- herramientas dev de verificacion

Criterio de salida:

- cualquier diferencia entre legacy y nuevo se puede explicar documentalmente

## Workstream 7. Migracion y backfills

Objetivo:

dejar cubiertos los historicos necesarios para considerar la fase cerrada.

Scripts obligatorios:

- `backfillReceivableCashMovements`
- `backfillInvoicePosCashMovements`
- `backfillExpenseCashMovements`
- `backfillInvoicePaymentState`
- `backfillPurchasePaymentTermsAndLegacyState`
- `backfillAccountsPayableStateFromReceipts`
- `auditCashMovementsCoverage`

Reglas:

- todo script debe tener `dry-run`
- todo script debe tener `write`
- toda escritura debe ser idempotente
- nada inventa pagos historicos de proveedor

Entregables:

- scripts ejecutables por negocio
- resumen de cobertura del piloto
- estrategia de expansion por cohortes

Criterio de salida:

- el piloto no depende de historicos opacos para operar esta fase

## Workstream 8. Rollout y corte global

Objetivo:

salir del piloto sin meter un corte inseguro.

Secuencia:

1. dual-write nuevo apagado fuera del piloto
2. dual-write nuevo encendido en piloto
3. backfill del piloto
4. lectura nueva en piloto
5. auditoria estable
6. cohortes pequenas
7. expansion general
8. deprecacion funcional legacy

Flags obligatorios:

- por `businessId`
- por modulo
- por lectura/escritura

Criterio de salida:

- el sistema puede apagar el camino nuevo o viejo por configuracion sin rollback destructivo

## Workstream 9. Limpieza y deprecacion

Objetivo:

cerrar la fase sin dejar ramas zombie.

Deprecar:

- `cashCount.sales[]` como fuente primaria de calculo
- `cashCount.receivablePayments[]`
- `purchase.paymentAt` como verdad de pago
- `invoice.paymentHistory` como verdad primaria
- `expense.payment.bank` como string libre

Conservar temporalmente:

- `invoices`
- `invoicesV2`
- `accountsReceivablePayments`
- `accountsReceivablePaymentReceipt`
- `purchases`
- `expenses`

Criterio de salida:

- queda claro que es source of truth, que es read model y que esta solo en compatibilidad

## Orden exacto de ejecucion recomendado

1. Workstream 0
2. Workstream 1
3. Workstream 2
4. Workstream 3
5. Workstream 5
6. Workstream 6 para piloto
7. Workstream 4
8. Workstream 7
9. Workstream 8
10. Workstream 9

Razon del orden:

- primero se cierra el idioma
- luego FX y bancos
- luego ventas/CxC/gastos/caja que ya tienen traccion
- despues se mete CxP con base ya estable
- al final migracion global y limpieza

## Matriz de validacion final

### Ventas

- venta al contado en moneda funcional
- venta mixta `cash + card`
- venta a credito sin cobro inicial
- venta con `creditNote` parcial

### CxC

- cobro parcial normal
- cobro por cuota
- cobro de seguro
- recibo con referencia y evidencia

### Compras / CxP

- compra al contado pagada al recibir
- compra a credito sin pago
- compra con abono parcial
- pago final con cierre de balance
- compra legacy sin evidencia

### Gastos

- gasto por caja abierta
- gasto por transferencia con `bankAccountId`
- gasto legacy con `payment.bank` y migracion

### Caja

- cierre con ventas POS
- cierre con cobros CxC
- cierre con gastos
- cierre mixto con todo junto
- auditoria legacy vs nuevo sin diferencias materiales

### FX

- venta en moneda no funcional con `sellRate`
- compra en moneda no funcional con `buyRate`
- pago proveedor en fecha distinta con nueva tasa
- cobro cliente en fecha distinta con nueva tasa

## Criterios formales de cierre de fase

La fase se declara cerrada solo si:

- el piloto ya no tiene huecos operativos en ventas, CxC, gastos, compras/CxP y caja
- existe plan probado de expansion por cohortes
- los historicos esenciales del piloto ya estan migrados o marcados como legacy revisable
- los documentos nuevos ya no usan contratos ambiguos
- la tasa de cambio ya esta formalizada para operaciones nuevas
- los bancos ya existen como referencia estructurada

## Condiciones para detener el trabajo y no forzar un falso cierre

Se debe parar si ocurre cualquiera de estas:

- `accountsPayablePayments` exige inventar pagos legacy
- `exchangeRates` todavia no tiene politica clara de `buy/sell`
- `cashMovements` empieza a duplicar fuentes en cohortes fuera del piloto
- el equipo intenta cerrar la fase sin pasar por cohortes de rollout

## Resultado ideal al terminar este plan

- ventas, CxC, seguros, gastos y compras/CxP hablan el mismo idioma de pagos
- caja y auditoria usan `cashMovements`
- FX queda formalizado en snapshots y referencias
- no hay pagos falsos ni saldos opacos en compras
- el repo queda listo para pasar a la fase siguiente de `accountingEvents`, proyecciones fuertes y journal, sin deuda accidental en la capa operativa
