# Estado del sistema por módulos operativos y contables

Fecha de corte original: `2026-03-23`
Actualizado con verificacion de repo: `2026-03-24`
Sincronizado con auditoria externa y limpieza del paquete: `2026-04-04`

## Estado del documento

Este documento sigue vivo como inventario tecnico de modulos y superficies.

No es la fuente unica de prioridad.

Para orden de lectura y prioridades vigentes usar primero:

- `README.md`
- `2026-04-04-sync-plan-contabilidad-vs-pdf.md`
- `contabilidad-backlog.md`

## Objetivo

Dejar un estado claro de cómo va el sistema en estos frentes:

- catálogo de cuentas
- cuentas bancarias
- tasa de cambio
- gastos
- compras y cuentas por pagar
- ventas y cuentas por cobrar
- seguros
- comprobantes fiscales
- cuadre de caja
- base contable transversal y demás módulos relacionados

Este documento está basado en evidencia real del repo (`src/`, `functions/`, `docs/`, `plans/`), no en intención futura.

## Resumen ejecutivo

### Lo que ya está fuerte a nivel operativo

- ventas y facturación
- cuentas por cobrar
- gastos
- cuadre de caja
- comprobantes fiscales
- seguros

### Lo que ya existe como base contable, pero sigue en rollout/piloto

- configuración contable por negocio en `settings/accounting`
- `chartOfAccounts` y `accountingPostingProfiles` como capa de configuracion persistente por negocio
- monedas activas y moneda funcional
- tasas manuales y colección `exchangeRates`
- cuentas bancarias y política de uso por módulo
- snapshots monetarios
- `cashMovements` como proyección operativa
- `accountsPayablePayments` como ledger inicial de pagos a suplidor

### Lo que todavía no está cerrado

- integracion de `chartOfAccounts` y `postingProfiles` al libro mayor
- `accountingEvents` formal
- `journalEntries`
- `trialBalance`
- `balanceSheet`
- `incomeStatement`
- conciliacion bancaria end-to-end
- `CxP` navegable como submodulo formal
- trazabilidad documento↔asiento↔reporte
- bitacora visible de cambios e inmutabilidad por reverso

### Aclaracion importante

Ya existen superficies visibles de:

- `/contabilidad/libro-diario`
- `/contabilidad/libro-mayor`
- `/contabilidad/reportes`
- `/contabilidad/cierre-periodo`

Eso no significa que el pipeline contable de fondo este cerrado.

La lectura correcta hoy es:

- existe workspace contable visible
- no existe todavia mayor general plenamente confiable e idempotente

## Estado por módulo

| Módulo | Estado | Lectura corta |
| --- | --- | --- |
| Catálogo de cuentas | Parcial funcional | Ya hay UI, rutas, hooks y persistencia Firestore por negocio; falta conectarlo a eventos, journal y reportes. |
| Perfiles contables | Parcial funcional | Ya hay UI y persistencia `accountingPostingProfiles`; falta uso real para generar asientos desde eventos. |
| Cuentas bancarias | Parcial avanzado | Ya hay UI, tipos, colección y uso en pagos; todavía depende del piloto y faltan datos reales cerrados. |
| Tasa de cambio | Parcial avanzado | Ya hay configuración, historial, snapshots y `exchangeRates`; falta validación operativa completa fuera del piloto. |
| Gastos | Implementado con integración contable parcial | El módulo existe y ya conversa con caja y banca; la capa de mayor contable aún no existe. |
| Compras | Implementado | El flujo de compras existe y mueve inventario; ya se está endureciendo para deuda real y pagos. |
| Cuentas por pagar | Parcial funcional | Ya existe ledger inicial de pagos a suplidor, pero faltan modulo navegable, recibos/evidencias y trazabilidad más sólida. |
| Ventas | Implementado fuerte | Es uno de los núcleos del sistema y ya integra NCF, inventario, CxC, seguros y caja. |
| Cuentas por cobrar | Implementado fuerte | Hay módulo, detalle, pagos, cuotas, auditoría y recuperación; aún hay riesgos de consistencia heredados. |
| Seguros | Implementado con deuda puntual | Ya existe configuración y AR de seguros, pero hay riesgo por autorizaciones globales. |
| Comprobantes fiscales | Implementado fuerte | Hay configuración, secuencias, ledger NCF y herramientas de reconstrucción/auditoría. |
| Cuadre de caja | Implementado fuerte | Existe apertura, cierre, vista, auditoría y dependencia operativa en ventas/cobros/pagos/gastos. |
| Base contable transversal | Parcial avanzada | El sistema ya está en fase de subledgers operativos y workspace visible; el journal real todavía no cierra el circuito. |

## Detalle por área

### 1. Catalogo de cuentas y perfiles contables

Estado: `parcial funcional`

Qué sí existe:

- Un diseño explícito para introducir `chartOfAccounts` sin romper módulos operativos.
- Una decisión arquitectónica clara: el catálogo de cuentas no debe ser source of truth de ventas, compras, gastos, caja o CxC.
- UI y rutas activas dentro de `settings/accounting` para catálogo y perfiles contables.
- Lectura, alta, edición, activación y seed inicial de `chartOfAccounts` por negocio.
- Lectura, alta, edición, activación y seed inicial de `accountingPostingProfiles` por negocio.

Qué no existe todavía:

- productores reales que consuman `postingProfiles`
- `AccountingEvent` formal emitido como source of truth
- `journalEntries`
- `trialBalance`
- `balanceSheet`
- `incomeStatement`

Conclusión:

Catalogo y perfiles ya dejaron de estar solo en diseño. Hoy existen como capa de configuracion viva en frontend + Firestore por negocio; lo que sigue pendiente es conectarlos al pipeline de eventos y al libro mayor.

Evidencia:

- `src/router/routes/paths/Setting.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/AccountingConfig.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingSettingsForm.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`
- `plans/architecture/2026-03-03-contabilidad-design/2026-03-23-catalogo-de-cuentas-integracion-modulos-design.md`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md`

### 2. Cuentas bancarias

Estado: `parcial avanzado`

Qué existe:

- Tipos y normalización de `BankAccount`.
- Configuración visible en ajustes contables.
- Alta de cuentas bancarias, activación/desactivación y política por módulo.
- Validación real en pagos bancarios de compras, gastos, ventas y cobros CxC cuando el rollout está activo.

Qué falta:

- cerrar uso real con cuentas bancarias válidas en el piloto
- eliminar huecos de `bankAccountId`
- rollout validado fuera del piloto

Conclusión:

No está en cero. Ya es una base operativa usable, pero todavía no se puede vender como módulo completamente cerrado a escala general.

Evidencia:

- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/AccountingConfig.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingSettingsForm.tsx`
- `src/utils/accounting/bankAccounts.ts`
- `src/types/accounting.ts`
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md`

### 3. Tasa de cambio

Estado: `parcial avanzado`

Qué existe:

- Moneda funcional por negocio.
- Monedas documentales activas.
- Tasas manuales `buyRate` / `sellRate`.
- Historial de configuración.
- Materialización de `exchangeRates/{rateId}`.
- Uso de snapshots monetarios y referencia de tasa para documentos.

Qué falta:

- cerrar datos reales de `rateId` en el piloto
- asegurar uso real validado de `exchangeRates` en toda la operación
- completar rollout fuera del piloto

Conclusión:

La base técnica está bien encaminada. La deuda ya no es de modelado, sino de cierre operativo y cobertura real.

Evidencia:

- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingSettingsForm.tsx`
- `src/utils/accounting/exchangeRates.ts`
- `src/utils/accounting/monetary.ts`
- `functions/src/app/versions/v2/accounting/exchangeRateReferenceDailyCron.js`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-backlog.md`

### 4. Gastos

Estado: `implementado con integración contable parcial`

Qué existe:

- Módulo de gastos con formulario, listado y reportes.
- Categorías de gasto.
- Integración con cuadre de caja.
- Integración con cuentas bancarias activas cuando el pago es bancario.
- Función backend para sincronizar movimientos de caja derivados de gastos.

Qué falta:

- pasar de proyección operativa a asiento contable formal
- consolidar rollout contable fuera del piloto

Conclusión:

Gastos ya es un módulo operativo real. Lo pendiente es la capa de contabilidad general encima de ese flujo.

Evidencia:

- `src/modules/expenses/pages/Expenses/ExpensesForm/ExpensesForm.tsx`
- `src/modules/expenses/pages/Expenses/ExpensesForm/hooks/useExpenseForm.ts`
- `src/modules/expenses/pages/Expenses/ExpensesList/ExpensesList.tsx`
- `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js`
- `docs/migration-progress.md`

### 5. Compras y cuentas por pagar

#### Compras

Estado: `implementado`

Qué existe:

- Gestión de compras.
- Preparación del documento.
- finalización de compra
- integración con inventario
- manejo de adjuntos

Brecha relevante:

- El repo venía con una mezcla legacy en estados/campos y estaba asumiendo pago total en partes del snapshot.

#### Cuentas por pagar

Estado: `parcial funcional`

Qué existe:

- `paymentTerms`
- `paymentState`
- pagos a suplidor
- ledger inicial `accountsPayablePayments`
- soporte de métodos de pago con caja/cuenta bancaria/nota de crédito de suplidor

Qué falta:

- recibo realmente usable
- evidencia de pago mejor integrada
- trazabilidad más fuerte por suplidor/compra
- limpieza de datos legacy

Conclusión:

Compras está operando. CxP ya dejó de ser solo idea, pero todavía está en fase 1 y necesita más cierre para quedar redondo.

Evidencia:

- `src/firebase/purchase/fbAddPurchase.ts`
- `src/firebase/purchase/fbCompletePurchase.ts`
- `src/firebase/purchase/fbAddAccountsPayablePayment.ts`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/RegisterSupplierPaymentModal.tsx`
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `plans/architecture/2026-03-03-contabilidad-design/archive/2026-03-17-compras-cuentas-por-pagar-design.md`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md`

### 6. Ventas y cuentas por cobrar

#### Ventas

Estado: `implementado fuerte`

Qué existe:

- flujo de facturación
- integración con NCF
- integración con inventario
- integración con CxC
- integración con seguros
- dependencia de cuadre abierto para venta real

#### Cuentas por cobrar

Estado: `implementado fuerte`

Qué existe:

- módulo propio de CxC
- lista, detalle, cuotas y recibos
- pagos CxC
- integración con ventas
- soporte de CxC de seguros
- auditoría y utilidades de recuperación

Riesgos todavía abiertos:

- algunos problemas heredados de consistencia e idempotencia
- necesidad de seguir endureciendo balance y sincronización en casos borde

Conclusión:

Ventas y CxC ya son parte madura del sistema. Aquí la conversación no es “si existe”, sino qué tanto seguimos blindando consistencia y recuperación.

Evidencia:

- `src/modules/sales/pages/Sale/Sale.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx`
- `src/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList.tsx`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `docs/invoice/explanation/processing.md`
- `docs/accounts-receivable/explanation/sync-audit.md`
- `docs/problem-analysis/explanation/account-receivable-balance-avendys-lockhart.md`

### 7. Seguros

Estado: `implementado con deuda puntual`

Qué existe:

- configuración de aseguradoras
- tipos y términos de seguro
- captura de autorización en venta
- integración con CxC de seguros

Qué preocupa:

- las autorizaciones de seguro siguen teniendo riesgo por diseño global y unicidad cross-tenant

Conclusión:

Seguros ya está integrado al flujo comercial y de cobro, pero necesita saneamiento estructural en autorizaciones.

Evidencia:

- `src/modules/insurance/pages/Insurance/InsuranceConfig/InsuraceConfig.tsx`
- `src/modules/insurance/pages/Insurance/InsuranceConfigForm/InsuranceConfigForm.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InsuranceAuthFields/InsuranceAuthFields.tsx`
- `functions/src/app/modules/accountReceivable/services/insuranceAuth.js`
- `docs/invoice/explanation/processing.md`
- `diagnostico-functions-firestore.md`

### 8. Comprobantes fiscales

Estado: `implementado fuerte`

Qué existe:

- configuración de comprobantes fiscales
- consumo de secuencias
- validaciones
- ledger de NCF
- reconstrucción del ledger
- auditoría fiscal interna

Conclusión:

Es uno de los módulos más completos del sistema, tanto en operación como en tooling de soporte.

Evidencia:

- `src/modules/settings/pages/setting/subPage/TaxReceipts`
- `src/firebase/taxReceipt`
- `functions/src/app/modules/taxReceipt/services/taxReceiptService.ts`
- `functions/src/app/versions/v2/invoice/services/ncfLedger.service.js`
- `docs/ncf-ledger/explanation/rebuild-flow.md`

### 9. Cuadre de caja

Estado: `implementado fuerte`

Qué existe:

- apertura y cierre de cuadre
- vistas de resumen
- lectura de facturas, cobros y gastos asociados
- auditoría de discrepancias
- dependencia operativa en ventas y pagos en efectivo

Conclusión:

Caja ya es un dominio fuerte y además sirve como pieza clave para el rollout contable operativo.

Evidencia:

- `src/modules/cashReconciliation/pages/CashReconciliation/CashReconciliation.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterOpening/`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/`
- `functions/src/app/modules/cashCount/functions/openCashCount.js`
- `functions/src/app/modules/cashCount/functions/closeCashCount.js`
- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`
- `docs/testing/2026-02-08-e2e-data-coherence-X63aIFwHzk3r0gmT8w6P.md`

## Base contable transversal y demás módulos

Estado: `parcial avanzado`

Hoy el sistema ya tiene una capa operativa contable bastante más seria que antes:

- `settings/accounting`
- `exchangeRates`
- `bankAccounts`
- `monetary`
- `cashMovements`
- `accountsPayablePayments`
- `accountsReceivableFxSettlements`
- auditoría del piloto

La lectura correcta no es que “ya tenemos contabilidad general”.

La lectura correcta es:

1. Ya tenemos subledgers operativos y snapshots monetarios.
2. Ya existe una base para multimoneda, banca y tesorería.
3. Todavía falta abrir el libro mayor de verdad.

Evidencia:

- `docs/branches/feat-accounting-foundation.md`
- `src/utils/accounting/monetary.ts`
- `src/modules/dev/pages/DevTools/AccountingPilotAudit/AccountingPilotAudit.tsx`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md`
- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-backlog.md`

## Conclusión general

El sistema no está “arrancando” en estos módulos. Ya tiene una operación fuerte en ventas, CxC, gastos, caja, seguros y comprobantes fiscales. Compras y CxP ya entraron en una fase funcional real. La base contable nueva de monedas, tasas, cuentas bancarias y tesorería también existe y ya se está usando en piloto.

Lo que todavía no ha entrado es la contabilidad general formal:

- catálogo de cuentas
- eventos contables formales
- journal
- balances y estados financieros

En términos prácticos, el repo hoy está en fase de `subledgers operativos + base contable`, no en fase de `libro mayor completo`.
