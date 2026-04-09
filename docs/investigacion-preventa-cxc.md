# Investigación: Preventa + Cuentas por Cobrar (CxC)

Fecha: 2026-01-20

## Objetivo

Entender cómo funciona hoy CxC en facturas y qué falta para integrar preventas con CxC, especialmente para el modo de configuración **“Al finalizar (pago total)”**.

## Hallazgos clave (frontend)

### Configuración de facturación

- La UI para configurar el modo y el timing de generación de factura está en:
  - `src/modules/settings/components/GeneralConfig/configs/components/BillingModeConfig.tsx`
- `invoiceGenerationTiming` existe en la UI pero **no se utiliza en lógica** en el flujo de preventas.
- `useInitializeBillingSettings.tsx` no tiene `invoiceGenerationTiming` en los defaults.

### Flujo de preventa

- Guardar preventa (preorden): `src/firebase/invoices/fbAddPreocer.ts`
  - Guarda en `businesses/{id}/invoices/{preorderId}` con:
    - `type: 'preorder'`, `status: 'pending'`
    - `preorderDetails.isOrWasPreorder = true`
    - `preorderDetails.paymentStatus = 'unpaid'` (no se actualiza en ningún otro lugar)
- Actualizar preventa: `src/firebase/invoices/fbUpdatePreorder.ts`
- “Completar preventa” en `/preorders` **solo carga la preventa en el carrito y abre el panel de pago**:
  - `src/modules/sales/pages/PreorderSale/components/PreSaleTable/tableCells.tsx`
- El panel de pago que convierte a factura es el mismo de ventas:
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx`

### Cuentas por cobrar (CxC)

- El panel y configuración CxC viven en:
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body`
- “Agregar a CXC” se muestra cuando hay **cambio negativo**.
- Cuando se marca CxC:
  - `cart.isAddedToReceivables = true`
  - Se prepara configuración en `accountsReceivableSlice`
- En `InvoicePanel`, si `cart.isAddedToReceivables` está activo:
  - Se exige configuración de CxC antes de facturar.
  - Se manda `accountsReceivable` al backend vía `useInvoice`.

## Hallazgos clave (backend)

- El backend V2 crea CxC **solo cuando se genera factura** (no en preventa).
- Orquestación:
  - `functions/src/versions/v2/invoice/services/orchestrator.service.js`
  - Si `cart.isAddedToReceivables === true`, crea tarea `setupAR`.
- Worker:
  - `functions/src/versions/v2/invoice/triggers/outbox.worker.js`
  - `setupAR` crea la cuenta por cobrar y sus cuotas.

## Diferencias entre Preventa y Factura

- Preventa vive en `/invoices` (legacy), factura V2 en `/invoicesV2`.
- Preventa **no crea CxC**.
- CxC depende de la generación de factura, no de la preventa.

## Recomendación para “Al finalizar (pago total)”

Objetivo: abrir panel de pago, **pero sin permitir CxC**, forzando pago completo antes de convertir a factura.

Propuesta de implementación:

1. Leer `invoiceGenerationTiming` desde settings.
2. En `/preorders` y/o en el panel de pago:
   - Si `invoiceGenerationTiming === 'full-payment'`:
     - Deshabilitar UI de CxC.
     - Bloquear botón “Agregar a CXC”.
     - El panel de pago ya impide facturar si el pago es incompleto.

## Archivos relevantes

- Configuración de timing:
  - `src/modules/settings/components/GeneralConfig/configs/components/BillingModeConfig.tsx`
  - `src/firebase/billing/useInitializeBillingSettings.tsx`
- Preventas:
  - `src/firebase/invoices/fbAddPreocer.ts`
  - `src/firebase/invoices/fbUpdatePreorder.ts`
  - `src/modules/sales/pages/PreorderSale/components/PreSaleTable/tableCells.tsx`
- Panel de pago / CxC:
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/Body.tsx`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/AccountsReceivableManager/AccountsReceivableManager.tsx`
- Backend V2:
  - `functions/src/versions/v2/invoice/services/orchestrator.service.js`
  - `functions/src/versions/v2/invoice/triggers/outbox.worker.js`

## Pendientes para el siguiente paso

- Definir exactamente cómo se detecta “pago total” en preventa.
- Implementar lógica UI para deshabilitar CxC en modo `full-payment`.
- Agregar `invoiceGenerationTiming` a defaults en `useInitializeBillingSettings.tsx`.
