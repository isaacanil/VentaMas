# Types, Schemas, Enums y Contratos Compartidos - Autofix Plan

Fecha: 2026-05-05

## Alcance

Revision autonoma de tipos, interfaces, schemas, enums, constantes y contratos compartidos en VentaMas. Superficies inspeccionadas:

- Frontend TypeScript: `src/types`, `src/utils`, `src/schema`, `src/features`, `src/modules`.
- Shared schemas: `src/shared/accountingSchemas.js` y `functions/src/shared/accountingSchemas.js`.
- Cloud Functions: `functions/src/app/modules`, `functions/src/app/versions/v2`.
- Modelos Firestore/DTOs por dominio: pagos, cash movements, facturas, compras, gastos, CxC, CxP, tesoreria, contabilidad, monedas y NCF.

## Principio de implementacion

Solo cambios seguros y verificables:

- Centralizar constantes ya existentes sin cambiar valores persistidos.
- Reutilizar tipos ya existentes cuando el contrato es claro.
- Reducir duplicidad entre helpers frontend.
- Marcar como BLOQUEADA cualquier diferencia que pueda implicar migracion, cambio de modelo o regla fiscal/contable.

No hacer:

- Migraciones de datos.
- Cambios a modelos Firestore reales.
- Cambios de reglas contables/fiscales.
- Deletes, deploy, push.

## Hallazgos

### Pago y metodos de pago

Estado:

- Frontend tiene contrato canonico en `src/types/payments.ts` y normalizador en `src/utils/payments/contracts.ts`.
- `src/utils/payments/bankPaymentPolicy.ts` duplicaba `['card', 'transfer']`.
- `src/utils/payments/methods.ts` validaba solo codigos canonicos y no normalizaba aliases legacy antes de decidir si requieren caja/banco.
- UI de pagos a suplidor declara `SupplierPaymentMethodCode` repitiendo subconjunto de metodos canonicos.
- Backend Functions duplica aliases en `functions/src/app/versions/v2/accounting/utils/accountingContract.util.js` y `functions/src/app/modules/purchase/functions/payablePayments.shared.js`.

Riesgo:

- `credit_card`, `debit_card`, `bank_transfer`, `check` pueden comportarse distinto segun helper si no se normalizan antes.
- Backend contable convierte aliases de supplier credit note a `creditNote`, mientras CxP los conserva como `supplierCreditNote`.

Accion segura:

- Frontend: usar `normalizePaymentMethodCode` en helpers de requerimiento caja/banco.
- Frontend: mover `BANK_PAYMENT_METHOD_CODES` y `CASH_PAYMENT_METHOD_CODES` al contrato comun.
- Frontend: hacer que `SupplierPaymentMethodCode` derive de `CanonicalPaymentMethodCode`.

BLOQUEADA:

- Alinear backend `supplierCreditNote` vs `creditNote` en contabilidad. Puede cambiar semantica de eventos contables y reglas de posting. Requiere decision de modelo.

### Cash movements y tesoreria

Estado:

- `LiquidityEntrySourceType` en `src/types/accounting.ts` contiene fuente amplia de tesoreria.
- `CashMovementSourceType` ya fue reducido a alias de `LiquidityEntrySourceType` en `src/types/payments.ts`.
- Hooks y componentes repiten strings como `receivable_payment`, `receivable_payment_void`, `invoice_pos`, `expense`.

Riesgo:

- Componentes de cash count y tesoreria pueden quedar desalineados si se agrega una fuente nueva.

Accion segura:

- Exportar constantes typed para source types de cash movements en `src/types/payments.ts`.
- Reutilizarlas en `usePaymentsForCashCount` y `CashCountMetaData`.

BLOQUEADA:

- Cambiar nombres persistidos de source types. Son modelo Firestore.

### Accounting shared schemas

Estado:

- `src/shared/accountingSchemas.js` y `functions/src/shared/accountingSchemas.js` comparten casi todo el contrato.
- Divergencia puntual: root usa `z.record(z.unknown())` por `zod` 3.x; Functions usa `z.record(z.string(), z.unknown())` por `zod` 4.x.
- Ambos exportan valores de event types, statuses y projection statuses.

Riesgo:

- Unificar literal de `z.record` sin resolver version de `zod` romperia uno de los runtimes.

Accion segura:

- No tocar schema zod cross-runtime en esta pasada.

BLOQUEADA:

- Extraer `accountingSchemas` a paquete unico real. Requiere estrategia de version `zod` y empaquetado Functions.

### Compras y CxP

Estado:

- `PurchaseWorkflowStatus` vive en `src/utils/purchase/types.ts`.
- `VendorBillStatus` vive en `src/domain/accountsPayable/vendorBills/types.ts`.
- Backend CxP replica flujo en `vendorBill.shared.js`.

Riesgo:

- Estados `completed/canceled` y `approved/partially_paid/paid/voided` representan modelos distintos. Unificarlos seria cambio de dominio.

Accion segura:

- Solo derivar tipos UI de contratos existentes cuando no cambie persistencia.

BLOQUEADA:

- Unificar status de compra con vendor bill. Requiere decision sobre bounded contexts.

### Gastos

Estado:

- `ExpensePaymentMethod` repite aliases de pago legacy: `open_cash`, `cash`, `credit_card`, `check`, `bank_transfer`.
- `src/utils/expenses/payment.ts` tiene sets propios para banco/caja.

Riesgo:

- Expense payment source types (`cash_drawer`, `cash`, `bank`) no son iguales a metodo de pago canonico.

Accion segura:

- Documentar divergencia. No convertir a `PaymentMethodCode` completo por ahora.

BLOQUEADA:

- Cambiar gastos de aliases legacy a canonicos (`card/transfer`) en persistencia o UI. Requiere migracion/compatibilidad.

### Facturas, CxC y payment state

Estado:

- `PaymentState` esta en `src/types/payments.ts`.
- Backend tiene `functions/src/app/versions/v2/accounting/utils/paymentState.util.js` con misma semantica funcional.
- `InvoiceData.paymentStatus` permite string legacy.

Riesgo:

- Endurecer `paymentStatus` romperia data legacy.

Accion segura:

- No restringir mas que lo existente.

BLOQUEADA:

- Migrar `paymentStatus` legacy a `paymentState.status`. Requiere plan de datos.

### Monedas

Estado:

- Frontend canonico: `src/utils/accounting/currencies.ts` con `DOP`, `USD`, `EUR`.
- Backend accounting rollout repite `ACCOUNTING_CURRENCY_CODES` y `DEFAULT_FUNCTIONAL_CURRENCY`.
- Billing usa monedas/formatos propios y proveedores externos.

Riesgo:

- Compartir moneda contable con billing puede mezclar dominio contable con pagos de suscripcion.

Accion segura:

- No mover backend currency constants en esta pasada.

BLOQUEADA:

- Crear paquete shared multi-runtime para moneda contable. Requiere resolver imports JS/TS y versionado Functions.

### NCF y tax receipt

Estado:

- Frontend tiene `TaxReceiptData`, `TaxReceiptDocumentFormat`, `TAX_RECEIPT_NUMERIC_FIELDS`.
- Functions tiene `NCF_TYPES` en `functions/src/app/modules/taxReceipt/config/ncfTypes.ts`.
- Frontend templates incluyen B01/B02/B04/B15; backend config solo activa B01/B02/B15 y deja otros comentados.

Riesgo:

- Activar B04/B11/B12/B14/B16/B17 cambia alcance fiscal.

Accion segura:

- No cambiar `NCF_TYPES`.

BLOQUEADA:

- Canonico unico NCF frontend/backend. Requiere decision fiscal y compatibilidad con configuraciones existentes.

## Cambios seguros planificados

1. Centralizar arrays frontend de metodos de pago canonicos (`cash`, `card`, `transfer`, `creditNote`, `supplierCreditNote`).
2. Normalizar aliases antes de `paymentMethodRequiresBankAccount` y `paymentMethodRequiresCashCount`.
3. Derivar `SupplierPaymentMethodCode` desde `CanonicalPaymentMethodCode`.
4. Exportar constants typed para cash movement source types usados por cash count.
5. Reutilizar constants en hook/componente de cash count.
6. Agregar/ajustar tests enfocados a alias legacy.

## Reporte de verificacion esperado

- `npm run typecheck:all`
- `npm run lint -- all`
- `npm run test:run`
- `npm run test:run:functions`
- `npm run build`

Si falla por deuda no relacionada, registrar error exacto y separar de regresion propia.

## Reporte final

### Tipos y contratos centralizados

- `src/utils/payments/contracts.ts`: arrays canonicos `CASH_PAYMENT_METHOD_CODES`, `BANK_PAYMENT_METHOD_CODES`, `CREDIT_PAYMENT_METHOD_CODES`, `CANONICAL_PAYMENT_METHOD_CODES` y set `CANONICAL_PAYMENT_METHOD_CODE_SET`.
- `src/utils/payments/bankPaymentPolicy.ts`: `BANK_PAYMENT_METHOD_CODES` ahora sale del contrato comun.
- `src/utils/payments/methods.ts`: decision caja/banco normaliza aliases legacy antes de evaluar.
- `src/types/payments.ts`: constants typed para `CashMovementSourceType` y grupo `RECEIVABLE_CASH_MOVEMENT_SOURCE_TYPES`.
- `src/modules/orderAndPurchase/components/supplierPayments/utils/supplierPaymentMethods.ts`: `SupplierPaymentMethodCode` deriva de `CanonicalPaymentMethodCode`.

### Archivos modificados por esta pasada

- `docs/audits/types-schemas-autofix-plan.md`
- `src/types/payments.ts`
- `src/utils/payments/contracts.ts`
- `src/utils/payments/contracts.test.ts`
- `src/utils/payments/methods.ts`
- `src/utils/payments/methods.test.ts`
- `src/utils/payments/bankPaymentPolicy.ts`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.ts`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/hooks/usePaymentsForCashCount.test.ts`
- `src/domain/cashCount/cashCountMetaData.ts`
- `src/domain/cashCount/cashCountMetaData.test.ts`
- `src/modules/orderAndPurchase/components/supplierPayments/utils/supplierPaymentMethods.ts`

### Verificacion ejecutada

- `npx vitest run src\utils\payments\bankPaymentPolicy.test.ts src\utils\payments\methods.test.ts src\utils\payments\contracts.test.ts src\modules\cashReconciliation\pages\CashReconciliation\page\CashRegisterClosure\hooks\usePaymentsForCashCount.test.ts src\domain\cashCount\cashCountMetaData.test.ts --pool forks`: PASS, 5 files, 35 tests.
- `npm run test:run`: PASS, 96 files, 357 tests.
- `npm run test:run:functions`: PASS, 62 files, 230 tests.
- `npm run build`: PASS. Vite mantiene warning de chunks > 1600 kB.
- `npx prettier --check ...archivos tocados...`: PASS.
- `npm run typecheck:all`: FAIL por deuda global existente. En archivos tocados de pagos ya no hay errores. Siguen errores fuera de esta pasada, por ejemplo `CashReconciliationTable.tsx`, `FilterCashReconciliation.tsx`, `TextareaV2.tsx`, `CashDenominationCalculator.tsx`.
- `npm run lint -- all`: FAIL por deuda global existente, 401 problemas. Ejemplos: `.tmp/*` sin globals Node, multiples `React is not defined`, `src/types/products.ts` `SupportedDocumentCurrency is not defined`.

### Riesgos y bloqueos

- No se cambio persistencia Firestore.
- No se tocaron reglas contables/fiscales.
- No se alineo backend `supplierCreditNote` vs `creditNote`; BLOQUEADA por semantica contable.
- No se unifico schema zod frontend/functions; BLOQUEADA por diferencia zod 3.x vs 4.x.
- No se desplego, no se hizo push.

### Proximos pasos

1. Limpiar gates globales `typecheck:all` y `lint -- all` por grupos, empezando por config de ESLint/ambient globals y tipos cashReconciliation no tocados.
2. Definir decision de modelo para `supplierCreditNote` contable antes de tocar backend.
3. Si se quiere shared real frontend/functions, resolver primero paquete/version `zod`.
