# Preventa + CxC (al finalizar)

Fecha: 2026-01-20

## Objetivo

Implementar el flujo para "Al finalizar (pago total)" donde la preventa decide entre pago total con factura o crear CxC con primer pago obligatorio.

## Flujo UI (resumen)

1. En `/preorders`, botón **"Completar preventa"**.
2. Si ya existe CxC para la preventa:
   - **Saldo > 0**: abrir **PaymentForm** (permite **Cuota** o **Abono**).
   - **Saldo = 0**: abrir **InvoicePanel** para facturar.
3. Si no existe CxC:
   - Mostrar modal de decisión:
     - **"Pagar todo y facturar"** → InvoicePanel.
     - **"Usar CxC (primer pago)"** → configuración CxC.
     - Si no hay cliente específico (GC-0000), abrir selector de cliente antes de crear CxC.
4. Configuración CxC:
   - Defaults: **1 cuota mensual** (editable).
   - Confirmar crea AR + cuotas y abre PaymentForm para registrar **primer pago**.

## Reglas adicionales (siempre preguntar / manual)

- **Siempre preguntar**: usa el mismo modal de decisión cuando no hay CxC; si ya existe CxC, paga directo (o factura si saldo = 0).
- **Manual (Nunca)**: "Completar preventa" va directo a CxC (primer pago). La conversión a factura será una acción separada y solo con saldo = 0.

## Reglas de datos

- AR creada desde preventa:
  - `originType: 'preorder'`
  - `originId` / `preorderId`
  - `originStage: 'preorder'`
  - `createdFrom: 'preorders'`
- Pagos de CxC heredan los mismos campos en `accountsReceivablePayments`.
- `updateInvoiceTotals`:
  - **Preventa**: actualiza `preorderDetails.paymentStatus`, `balanceDue`, `accumulatedPaid` y **no** cambia `status`.
  - **Factura normal**: mantiene la lógica actual.

## Archivos clave

- `src/modules/sales/pages/PreorderSale/components/PreSaleTable/tableCells.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/ReceivableManagementPanel.tsx`
- `src/firebase/proccessAccountsReceivablePayments/arPaymentUtils.ts`
- `src/utils/accountsReceivable/types.ts`
- `src/firebase/accountsReceivable/fbGetAccountReceivableByInvoiceOnce.ts`
