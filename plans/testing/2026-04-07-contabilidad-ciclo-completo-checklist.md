# Checklist activo de cierre de ciclo contable

Fecha base: `2026-04-07`

Estado: `activo`

Objetivo: cerrar el ciclo contable de VentaMas con pruebas reales por modulo hasta llegar a un comportamiento robusto tipo ERP, donde cada operacion relevante:

- genera evento contable cuando corresponde
- genera asiento balanceado cuando corresponde
- actualiza el subledger correcto cuando corresponde
- deja trazabilidad entre documento, evento, asiento y vista operativa
- no deja residuos en `pending_account_mapping` ni `failed`

Convencion:

- `[x]` validado con evidencia real en esta corrida
- `[ ]` pendiente o no validado todavia

## Criterios de cierre global

- [x] `accountingEvents` del negocio de prueba quedaron en `pending_account_mapping = 0`
- [x] `accountingEvents` del negocio de prueba quedaron en `failed = 0`
- [ ] existe matriz completa de pruebas automatizadas por modulo contable
- [ ] existe cierre de periodo validado end-to-end sin riesgo operativo
- [ ] existe conciliacion bancaria validada end-to-end
- [ ] existe multi-moneda validada end-to-end
- [ ] existe cobertura de notas de credito y reversos operativos end-to-end

## Alcance validado en esta corrida

Negocio de prueba: `Ventamax Dev`

Usuario de prueba: `dev#3407`

Evidencias principales:

- venta contable: `invoice.committed__98vZJzwPFT6iu2uOtxXiL`
- venta a credito contable: `invoice.committed__85VwNpSqXfPmuvev_wWbs`
- venta mixta contable: `invoice.committed__mixed-cart-1775593088007`
- venta a credito contable 2: `invoice.committed__codex-sale-credit-full-1775601128144`
- venta mixta contable 2: `invoice.committed__codex-sale-mixed-cxc-1775601134051`
- gasto contable: `expense.recorded__NljZVrXgscFykxW9Sm3Rl`
- gasto banco contable: `expense.recorded__codexExpenseBank1775601434046`
- compra contable: `purchase.committed__codexApPurchase20260407A`
- compra contado contable: `purchase.committed__codexCashPurchase1775600637867`
- auditoria rollout compras: `C:\Dev\VentaMas\tmp\purchase-rollout-readiness-20260407\purchase-rollout-readiness.md`
- pago CxP contable: `accounts_payable.payment.recorded__seTZ68grXS3MG-Fm9w-Zz`
- pago CxP parcial 1 contable: `accounts_payable.payment.recorded__obREz70ofw26ZMkYft9-v`
- pago CxP parcial 2 contable: `accounts_payable.payment.recorded__KxhGoYdyUaB58svTBS20f`
- pago CxP banco contable: `accounts_payable.payment.recorded__H71N0oVsz_LBv1PUn-IS3`
- anulacion pago CxP contable: `accounts_payable.payment.voided__KxhGoYdyUaB58svTBS20f`
- cobro CxC contable: `accounts_receivable.payment.recorded__qZw2c9IeRcbUCHDggWKcl`
- cobro CxC parcial 1: `accounts_receivable.payment.recorded__GJEM8pANdv_mEeqry6WUE`
- cobro CxC parcial 2: `accounts_receivable.payment.recorded__HhcKWEMWyA4KIK48imXe`
- anulacion cobro CxC contable: `accounts_receivable.payment.voided__HhcKWEMWyA4KIK48imXe`
- cobro CxC banco contable: `accounts_receivable.payment.recorded__45eIVpZdUKqBx0JvRemGt`
- cobro CxC multi-factura contable: `accounts_receivable.payment.recorded__oboVKl-lIzVLfW2Ptb1nJ`
- captura CxP UI: [accounts-payable-provider-fixed.png](/C:/Dev/VentaMas/tmp/accounts-payable-provider-fixed.png)

## Ventas

- [x] venta de contado genera `invoice.committed`
- [x] venta de contado genera `journalEntry` balanceado
- [x] venta de contado clasifica `paymentTerm = cash`
- [x] venta de contado clasifica `treasury.paymentChannel = cash`
- [x] venta de contado impacta caja y cuenta de ingresos/impuestos
- [x] se corrigio el payload para ignorar metodos de pago en cero
- [x] venta a credito genera `CxC` y asiento inicial
- [x] venta con pago mixto reparte correctamente caja y `CxC`
- [ ] nota de credito de venta revierte ingreso, impuesto y saldo correctamente
- [ ] anulacion/reverso de venta deja trazabilidad y asiento inverso correcto

## Gastos

- [x] gasto pagado en caja genera `expense.recorded`
- [x] gasto pagado en caja genera `journalEntry` balanceado
- [x] gasto pagado en caja acredita tesoreria correctamente
- [x] gasto pagado desde banco genera asiento correcto contra cuenta bancaria
- [ ] gasto a credito crea obligacion contable consistente
- [ ] anulacion/reverso de gasto deja asiento inverso consistente

## Compras

- [x] compra a credito genera `purchase.committed`
- [x] compra a credito genera `journalEntry` balanceado
- [x] compra a credito debita inventario y acredita `CxP`
- [x] compra a credito deja `vendorBill` visible en `CxP`
- [x] `vendorBill` canonico usa id `purchase:{purchaseId}`
- [x] compra de contado acredita caja o banco en vez de `CxP`
- [ ] devolucion de compra revierte inventario y pasivo correctamente
- [x] compras legacy quedaron saneadas sin huecos de `paymentState` ni `paymentTerms`

## Cuentas por cobrar

- [x] cobro CxC genera `accounts_receivable.payment.recorded`
- [x] cobro CxC genera `journalEntry` balanceado
- [x] cobro CxC reduce saldo operativo de la cuenta por cobrar
- [x] cobro CxC genera movimiento de caja
- [x] cobro parcial multiple mantiene aging y saldo correctamente
- [x] anulacion de cobro CxC revierte asiento y restaura saldo
- [x] cobro en banco impacta cuenta bancaria correcta
- [x] aplicacion contra varias facturas conserva trazabilidad completa

## Cuentas por pagar

- [x] pago CxP genera `accounts_payable.payment.recorded`
- [x] pago CxP genera `journalEntry` balanceado
- [x] pago CxP debita `CxP` y acredita caja correctamente
- [x] el negocio de prueba ya tiene perfil contable para pago CxP en efectivo
- [x] la ruta `/accounts-payable/list` carga en produccion
- [x] `CxP` muestra proveedor correcto en vez de `Sin proveedor` para el caso validado
- [x] `CxP` muestra bucket de aging y saldo abierto para compra pendiente
- [x] pago CxP desde banco impacta cuenta bancaria correcta
- [x] pago parcial multiple mantiene saldo y aging correctamente
- [x] anulacion de pago CxP revierte asiento y restaura saldo
- [ ] aplicacion de notas de credito de proveedor queda contablemente cerrada

## Caja y bancos

- [x] la venta de contado validada impacta caja
- [x] el gasto en efectivo validado impacta caja
- [x] el cobro CxC validado impacta caja
- [x] el pago CxP validado impacta caja
- [ ] apertura de caja validada como precondicion operativa del circuito
- [ ] cierre de caja validado con cuadre operativo y contable
- [ ] movimientos bancarios operativos generan asientos correctos
- [ ] transferencias entre cuentas internas generan doble asiento correcto
- [ ] conciliacion bancaria completa fue validada

## Contabilidad general y trazabilidad

- [x] existe proyeccion `accountingEvents -> journalEntries`
- [x] los eventos corregidos hoy no dejaron residuos en estados pendientes
- [x] se repararon eventos legacy pendientes de venta y pago CxP
- [x] existe trazabilidad por `eventId` entre evento y asiento en los casos validados
- [x] `journalEntries` creados hoy quedaron `posted`
- [ ] existe replay seguro validado por callable para soporte operativo
- [ ] existe reverso seguro validado desde UI para todos los casos criticos
- [ ] todos los modulos operativos tienen `Ver asiento contable` o equivalente trazable
- [ ] libro diario, libro mayor y reportes fueron validados contra los casos creados hoy

## Impuestos, inventario y multi-moneda

- [x] la venta validada acredita impuesto por pagar en el asiento
- [x] la compra validada debita inventario en el asiento
- [ ] compra con impuesto recuperable o reglas fiscales mas complejas fue validada
- [ ] costo de venta contable fue validado al vender inventario
- [ ] diferencias cambiarias realizadas fueron validadas
- [ ] diferencias cambiarias no realizadas fueron validadas
- [ ] una venta en moneda extranjera fue validada end-to-end
- [ ] una compra en moneda extranjera fue validada end-to-end

## Permisos, cierre y gobierno

- [ ] usuarios sin permiso no pueden reprocesar ni revertir contabilidad
- [ ] usuarios sin permiso no pueden crear asientos manuales
- [ ] cierre de periodo bloquea operaciones retroactivas
- [ ] reverso en periodo cerrado sigue la politica correcta

## Hallazgos abiertos detectados durante la corrida

- [ ] el modal UI de cobro CxC deja `totalPaid` stale al cambiar de `Cuota` a `Abono a cuenta`, por eso el abono parcial desde pantalla sigue fallando aunque el backend funciona
- [ ] los callables contables administrativos (`reverseJournalEntry`, `closeAccountingPeriod`, `createManualJournalEntry`, `getAccountingReports`, `replayAccountingEventProjection`) siguen cerrados por endpoint publico (`OPTIONS -> 403`), aunque la logica interna y los triggers contables ya funcionan
- [ ] bitacora de cambios criticos fue validada end-to-end desde UI

## Deuda que esta cerrada por esta corrida

- [x] eventos viejos `invoice.committed__AML1Bw5aHqbnlId0X1ZZP` y `accounts_payable.payment.recorded__7vG5M3QwYSRgMuCUzSfKS` quedaron reparados con asiento y `projection.status = projected`
- [x] el bug de clasificacion de `paymentChannel` en ventas quedo corregido
- [x] el motor contable ya soporta venta a credito con abono inicial usando profile `invoiceCreditSplit20260407` y fuentes `sale_cash_received` + `sale_receivable_balance`
- [x] el bug de operadores Firestore en invoice outbox/http/compensation quedo corregido
- [x] la compatibilidad de Zod para `accountingSchemas` quedo corregida
- [x] el fallback de proveedor en `CxP` quedo corregido
- [x] `CxC` backend soporta multiples abonos parciales con asiento y cierre final correcto
- [x] el proyector contable ahora reconoce `payload.paymentCondition` para distinguir compras contado vs credito
- [x] el bug `ReferenceError: stopButtonPropagation is not defined` en `MarkAsReceivableButton` quedo corregido en UI
- [ ] la UI del modal `CxC` sigue desalineada: al cambiar de `Cuota` a `Abono a cuenta` conserva `totalPaid` viejo y envia payload invalido si el pago se intenta desde pantalla

## Datos de prueba activos

- [x] compra de prueba `#128`
- [x] compra de prueba `#129`
- [x] venta de prueba `#957`

Nota: estos datos siguen vivos en el negocio de prueba. Limpiarlos no forma parte del cierre contable; hacerlo es una tarea posterior de higiene.

## Siguiente bloque recomendado

Orden de ataque recomendado para seguir marcando este checklist:

1. `Ventas credito`, `ventas mixtas`, `notas de credito`
2. `CxC voided`, `CxC banco`, `CxC multi-factura`
3. `Compras contado`, `CxP parcial`, `CxP voided`, `CxP banco`
4. `Caja cierre`, `bancos`, `conciliacion bancaria`
5. `inventario + costo de venta`
6. `multi-moneda`
7. `cierre de periodo`, `permisos`, `reporte integral`
