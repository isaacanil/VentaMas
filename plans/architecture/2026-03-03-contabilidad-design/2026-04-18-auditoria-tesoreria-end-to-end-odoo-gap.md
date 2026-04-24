# Auditoría end to end de tesorería vs VentaMas actual y patrón ERP robusto

Fecha: 2026-04-18

Scope:

- cuentas bancarias
- cuentas de caja
- `cashMovements`
- `liquidityLedger`
- cuadre de caja
- conciliación bancaria
- transferencias internas
- cobros
- pagos
- saldos
- reportes / exportes
- pruebas
- relación frontend / backend / Cloud Functions
- integraciones con ventas, compras, CxP, CxC, gastos, notas de crédito y contabilidad

Fuentes repo:

- `src/modules/treasury/hooks/useTreasuryWorkspace.ts`
- `src/modules/treasury/pages/components/TreasuryBankAccountsWorkspace.tsx`
- `functions/src/app/modules/treasury/functions/createBankReconciliation.js`
- `functions/src/app/modules/treasury/functions/createInternalTransfer.js`
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js`
- `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js`
- `functions/src/app/versions/v2/accounting/utils/cashMovement.util.js`

Fuentes externas:

- Odoo bank reconciliation: https://www.odoo.com/documentation/18.0/applications/finance/accounting/bank/reconciliation.html
- Odoo internal transfers: https://www.odoo.com/documentation/master/applications/finance/accounting/bank/internal_transfers.html
- Odoo payments / outstanding accounts: https://www.odoo.com/documentation/19.0/applications/finance/accounting/payments.html
- Odoo cash reconciliation: https://www.odoo.com/documentation/15.0/applications/finance/accounting/bank/reconciliation_cash.html

## Resumen ejecutivo

Estado actual:

- VentaMas ya tiene piezas reales para tesorería canónica: `bankAccounts`, `cashAccounts`, `internalTransfers`, `bankReconciliations`, `cashMovements`, `accountsReceivablePayments`, `accountsPayablePayments`, `expenses`, `accountingEvents`.
- Flujo fuerte hoy: registrar cobros, pagos a suplidor, gastos, transferencias internas, cuentas bancarias/caja, políticas de pago bancario, eventos contables básicos.
- Flujo débil hoy: vista unificada de saldos y ledger operativo. La UI de tesorería lee `liquidityLedger`, pero la mayoría de movimientos reales se escriben en `cashMovements`.

Diagnóstico principal:

- Tesorería tiene dos verdades compitiendo.
- `cashMovements` es ledger operativo real cross-module.
- `liquidityLedger` solo cubre transferencias internas.
- ventas POS también escriben `cashMovements` vía `outbox.worker`, pero tampoco alimentan `liquidityLedger`.
- Resultado: balances, feed y conciliación visible en UI pueden quedar incompletos aunque backend sí tenga movimiento real.

Comparación contra patrón Odoo:

- Odoo separa documento operativo, cuentas transitorias/outstanding, reconciliación y asiento final.
- VentaMas ya separa bastante bien documento operativo (`accountsReceivablePayments`, `accountsPayablePayments`, `expenses`, `internalTransfers`) y evento contable (`accountingEvents`).
- Lo que falta no es otra colección. Falta consolidar fuente de verdad operativa de liquidez y reconciliación sobre `cashMovements`.

## Hallazgos P0

### 1. Dos fuentes de verdad para saldos de tesorería

Evidencia:

- UI tesorería carga ledger desde `businesses/{businessId}/liquidityLedger` y calcula balances desde ahí: `src/modules/treasury/hooks/useTreasuryWorkspace.ts:139-172`, `300-312`.
- `createInternalTransfer` sí escribe `cashMovements` y `liquidityLedger`: `functions/src/app/modules/treasury/functions/createInternalTransfer.js:363-407`.
- ventas POS escriben `cashMovements`, pero no `liquidityLedger`: `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js:816-835`.
- CxC escribe `cashMovements`, pero no `liquidityLedger`: `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js:1162-1179`.
- CxP sincroniza `cashMovements`, pero no `liquidityLedger`: `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js:363-403`, `519-524`.
- Gastos sincroniza `cashMovements`, pero no `liquidityLedger`: `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js:15-74`.

Impacto:

- ventas cobradas en POS pueden no subir al balance visible de `/treasury`
- balance mostrado en tesorería no refleja cobros CxC, pagos CxP ni gastos
- account detail rail puede parecer “sin movimiento” aunque sí existan movimientos reales
- conciliación manual en UI puede partir de un balance visible distinto al balance backend
- reportes de liquidez por cuenta quedan truncos

Patrón Odoo:

- Odoo reconcilia pagos y movimientos bancarios/caja sobre una sola capa operativa de journal items / outstanding / statement lines; no deja una vista de saldos separada que ignore pagos reales.

Recomendación:

- declarar `cashMovements` como fuente operativa única de liquidez
- usar `liquidityLedger` solo como proyección derivada completa o retirarlo de balances/UI
- no mantener ambos como truth paralelo

### 2. Conciliación bancaria usa balance backend distinto al balance mostrado en UI

Evidencia:

- UI calcula `ledgerBalance` con `currentBalancesByAccountKey` derivado de `liquidityLedger`: `src/modules/treasury/hooks/useTreasuryWorkspace.ts:443-448`.
- backend `createBankReconciliation` calcula `ledgerBalance` desde `cashMovements` + `openingBalance`: `functions/src/app/modules/treasury/functions/createBankReconciliation.js:151-172`.

Impacto:

- mismo usuario puede ver un balance y guardar una conciliación con otro balance
- la varianza visible antes de guardar puede no coincidir con la persistida
- rompe confianza operativa y debugging de diferencias

Patrón Odoo:

- reconciliación debe operar sobre movimientos bancarios pendientes reales y matching sobre outstanding / receivable / payable, no sobre una proyección parcial distinta al motor de persistencia

Recomendación:

- backend queda correcto como verdad operativa
- frontend debe leer balance de conciliación desde la misma base canónica o pedir preview backend

### 3. Falta modelo de conciliación real; hoy es snapshot con varianza

Evidencia:

- `createBankReconciliation` persiste `statementBalance`, `ledgerBalance`, `variance`, `status`; no hace matching de líneas, no marca movimientos conciliados, no genera write-off, no cierra excepciones: `functions/src/app/modules/treasury/functions/createBankReconciliation.js:223-245`.
- búsqueda repo sin hits funcionales para `reconciled`, `unreconciled`, `bankStatement`, `statement line` dentro de tesorería / `cashMovements`.

Impacto:

- conciliación actual sirve como evidencia de corte, no como reconciliación operativa completa
- no existe pipeline para:
  - match automático
  - match manual
  - write-off / ajuste
  - aging de partidas no conciliadas
  - trazabilidad de líneas conciliadas

Patrón Odoo:

- Odoo usa matching de transacciones, reconciliation models, outstanding items, write-offs y pendientes no conciliados.

Recomendación:

- renombrar semanticamente flujo actual a “corte / snapshot de conciliación” o completar modelo real
- siguiente capa mínima:
  - `bankStatementLines`
  - `bankReconciliationMatches`
  - `reconciliationExceptions`
  - write-off controlado

## Hallazgos P1

### 4. Transferencias internas no validan fondos disponibles ni política de sobregiro

Evidencia:

- `createInternalTransfer` valida cuentas activas, moneda, periodo abierto e idempotencia.
- no valida saldo disponible en origen: `functions/src/app/modules/treasury/functions/createInternalTransfer.js:255-361`.

Impacto:

- puede registrar salida interna desde caja/banco sin control de descubierto operativo
- complica cuadre de caja y control de tesorería diaria

Patrón Odoo:

- Odoo soporta transferencias como movimiento entre journals y luego conciliación; control de fondos depende del journal flow y reconciliation evidence. En producto operativo tipo POS/ERP SMB, conviene política explícita.

Recomendación:

- definir por negocio:
  - bloquear saldo negativo
  - permitirlo solo con rol/flag
  - alertarlo en panel de excepciones

### 5. Cuadre de caja y tesorería bancaria siguen en superficies separadas

Evidencia:

- cash count / `cashReconciliation` sigue en módulo legacy aparte.
- tesorería moderna vive en `/treasury` con bancos/cajas/ledger.
- exportes de caja existen en cash reconciliation overview; exportes bancarios/tesorería no.

Impacto:

- caja diaria, caja chica, caja bóveda y bancos no comparten cockpit operativo
- no hay tablero unificado de:
  - cash open vs closed
  - diferencias
  - transferencias pendientes
  - conciliaciones con varianza
  - cuentas sin movimiento o sobregiro

Patrón Odoo:

- cash journals y bank journals viven bajo mismo dominio contable/tesorería; reconciliación y outstanding behavior siguen reglas comunes aunque UI separe vistas.

Recomendación:

- mantener cash count como subflujo, pero subir sus estados/resúmenes a tesorería
- tesorería home debe mostrar:
  - cajas abiertas por usuario
  - variaciones de cierre
  - transferencias internas del día
  - conciliaciones bancarias con variance

### 6. Exportes cubren contabilidad y cuadre; tesorería moderna no tiene exportes propios

Evidencia:

- hay exportes Excel para reportes contables: `FinancialReportsPanel.tsx`, `GeneralLedgerPanel.tsx`, `JournalBookPanel.tsx`, `PeriodClosePanel.tsx`.
- cash reconciliation overview exporta Excel.
- búsqueda repo en `src/modules/treasury` y `functions/src/app/modules/treasury` no devuelve `xlsx`, `csv`, ni `txt`.
- no aparece exporte propio para `/treasury` moderno.

Impacto:

- falta descargar:
  - ledger por cuenta bancaria/caja
  - conciliaciones por periodo
  - transferencias internas
  - movimientos por cuenta / método / contraparte
  - aging de pendientes de conciliación

Recomendación:

- prioridad funcional media:
  - export Excel ledger por cuenta
  - export Excel/TXT conciliaciones con variance
  - export Excel movimientos de liquidez consolidados

### 7. Alertas operativas faltantes

Faltan alertas visibles para:

- cuenta bancaria inactiva aún asignada en policy
- cuenta de caja inactiva aún usada por pagos/gastos
- transferencias sin contrapartida conciliada
- conciliaciones con variance abiertas más de N días
- gasto/cobro/pago bancario sin referencia
- saldo negativo en caja o banco
- caja abierta sin cierre del día anterior
- múltiples cuentas candidatas sin regla determinista

## Hallazgos P2

### 8. Cobros / pagos / gastos ya tienen contrato mejor que antes, pero faltan invariantes de treasury settlement

Lo bueno:

- CxC ya escribe `cashMovements` y `accountingEvents`.
- CxP ya escribe `accountsPayablePayments`, `cashMovements`, `accountingEvents`.
- gastos ya proyectan `cashMovements` y `expense.recorded`.

Lo que falta:

- estado de settlement por movimiento bancario/caja
- marca de reconciled / unreconciled por movimiento
- relación explícita contra extracto o cierre
- excepciones operativas reutilizables

### 9. Notas de crédito existen, pero falta cockpit treasury completo de aplicaciones y reversas

Estado:

- proveedor: `supplierCreditNote` se aplica en pago CxP
- cliente: voids y credit notes existen en capa contable / cobros

Gap:

- tesorería no presenta vista de reversas/aplicaciones que impactan liquidez o saldos pendientes

## Cobertura actual por dominio

### Bancos

Existe:

- alta/edición/estado
- política de pago bancario
- conciliación snapshot
- transferencias internas

Falta:

- extractos bancarios
- importación CSV/OFX
- matching automático
- ledger/exporte bancario propio
- aged unreconciled items

### Cajas

Existe:

- cash accounts modernas
- cash count legacy
- cobros/pagos/gastos con `cashCountId` y/o `cashAccountId`

Falta:

- gobierno único entre caja operativa y cash count
- dashboard consolidado de cajas
- alerta de saldo negativo / no conciliado

### Cobros CxC

Existe:

- pago
- void
- cash movement
- accounting event
- FX settlement

Falta:

- exposure clara en tesorería moderna
- batch reconciliation tipo outstanding items

### Ventas / POS

Existe:

- ventas POS proyectan `cashMovements` desde `outbox.worker`
- soporte de efectivo y banco en `buildInvoicePosCashMovements`
- integración con `cashCountId` cuando aplica

Falta:

- exposure clara en tesorería moderna
- saldo visible consolidado en `/treasury`
- conciliación bancaria/caja sobre esos movimientos desde misma superficie

### Pagos CxP

Existe:

- pago
- void
- credit note application
- cash movement
- accounting event

Falta:

- exposure clara en tesorería moderna
- integración visible con conciliación bancaria / excepciones

### Gastos

Existe:

- cash movement trigger
- accounting event trigger

Falta:

- ledger visible en tesorería moderna
- controles uniformes de settlement / reconciliation status

## Pruebas actuales y huecos

Cobertura encontrada:

- `createBankReconciliation.test.js`
- `createInternalTransfer.test.js`
- `syncAccountsPayablePayment.test.js`
- `processAccountsReceivablePayment.test.js`
- `syncExpenseCashMovement.test.js`
- tests de exportes contables

Huecos fuertes:

- no vi test de integración que pruebe balance de tesorería UI con mezcla de:
  - CxC
  - CxP
  - gastos
  - transferencias internas
- no vi test que garantice que `/treasury` muestra mismos saldos que backend de conciliación
- no vi test de regresión para cuentas con múltiples métodos / múltiples cuentas candidatas
- no vi test de export tesorería porque hoy prácticamente no existe ese export
- no vi smoke test cross-module para reconciled vs unreconciled lifecycle

## Cambios seguros aplicados en esta corrida

1. Endurecida validación de fechas en callables de tesorería.

- `createBankReconciliation` ya no reemplaza `statementDate` inválida con `Date.now()`.
- `createInternalTransfer` ya no reemplaza `occurredAt` inválida con `Date.now()`.

Razón:

- una fecha mala en tesorería rompe periodización, idempotencia y auditoría.

2. Alineada llave de idempotencia frontend de conciliación bancaria.

- se removió `variance` de la llave cliente.
- backend ya deduplicaba por campos estables del request, no por varianza calculada en UI.

Razón:

- evitar duplicados por drift entre balance visible UI y balance backend.

3. Endurecido snapshot transaccional de conciliación bancaria.

- `createBankReconciliation` ahora relee cuenta bancaria y `cashMovements` dentro de la transacción antes de persistir `ledgerBalance` y `variance`.

Razón:

- elimina ventana de carrera entre lectura de movimientos y escritura de la conciliación.

4. Cerrado hueco de loading/envío en alta/edición de cuentas de caja.

- `AddCashAccountModal` ahora bloquea cierre, botones e inputs durante submit.
- `TreasuryBankAccountsWorkspace` ahora mantiene `isCashAccountSubmitting` igual que banco, transferencia y conciliación.

Razón:

- evita doble submit y cierre prematuro del modal mientras Firestore sigue escribiendo.

## Backlog recomendado

### Sprint P0

1. Unificar verdad operativa de liquidez sobre `cashMovements`.
2. Cambiar `/treasury` para leer balance/feed desde fuente canónica o preview backend.
3. Introducir estado `reconciled/unreconciled` por movimiento.
4. Definir política de sobregiro para transferencias internas.
5. Subir resumen de cash count al home de tesorería.

### Sprint P1

1. `bankStatementLines` + import manual CSV.
2. matching manual y automático.
3. write-off controlado de diferencias.
4. exportes Excel de ledger / conciliaciones / transferencias.
5. alertas operativas y tablero de excepciones.

### Sprint P2

1. batch reconciliation CxC/CxP tipo outstanding items.
2. dashboard de aging de partidas no conciliadas.
3. cockpit de notas de crédito / reversas ligadas a tesorería.

## Conclusión

VentaMas no está “vacío” en tesorería. Ya tiene buen núcleo operativo.

Pero producto todavía no cierra como módulo ERP robusto por tres huecos:

1. verdad de liquidez fragmentada
2. conciliación bancaria todavía tipo snapshot, no matching real
3. falta cockpit operativo unificado de caja + banco + excepciones + exportes

Si hubiera que escoger una sola decisión estructural ahora:

- consolidar `cashMovements` como ledger operativo canónico de tesorería

Sin eso, cada mejora adicional en UI, conciliación o reportes seguirá montada sobre saldos parciales.
