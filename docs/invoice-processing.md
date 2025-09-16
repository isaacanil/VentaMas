# Flujo de Facturación: InvoicePanel + processInvoice

Este documento describe el flujo completo para “hacer la factura” desde el panel de pago en el frontend y el servicio de generación de facturas, incluyendo validaciones, efectos secundarios, manejo de impresión y precondiciones.

## Componentes y archivos clave

- UI principal: `src/views/component/Cart/components/InvoicePanel/InvoicePanel.jsx:70`
- Acción principal (submit): `src/views/component/Cart/components/InvoicePanel/InvoicePanel.jsx:208`
- Servicio de negocio: `src/services/invoice/invoiceService.js:24`
- Utilidades relacionadas: actualización de inventario, NCF, AR, preórdenes y modo prueba (mismos archivo, ver funciones referenciadas más abajo).

---

## InvoicePanel (UI)

Responsable de:
- Recoger forma de pago, CxC (AR), comprobante fiscal (NCF), y datos de impresión.
- Bloquear/desbloquear tipo de comprobante durante el procesamiento.
- Ejecutar `processInvoice` y manejar la impresión/limpieza del estado.

Puntos relevantes:
- `handleCancelShipping`: limpia carrito, cierra panel, borra cliente y datos de seguro cuando corresponde.
- `handleSubmit` (`InvoicePanel.jsx:208`):
  - Bloquea tipo de NCF mientras procesa.
  - Valida formulario de AR si la venta es a crédito.
  - Calcula `dueDate` según configuración de plazos.
  - Concatena comentarios de productos en `invoiceComment`.
  - Llama a `processInvoice` pasando `cart`, `user`, `client`, `accountsReceivable`, `ncfType`, `insurance*`, `invoiceComment` e `isTestMode`.
  - Si hay que imprimir, prepara el estado y deriva en impresión; si no, ejecuta `handleAfterPrint` directamente.
  - En errores, muestra notificación, libera NCF lock y detiene loading.
- Impresión:
  - `handleInvoicePrinting`: si `invoiceType === 'template2'` usa `downloadInvoiceLetterPdf` (carta/A4); caso contrario usa `useReactToPrint` con `pendingPrint` para asegurar que el estado esté hidratado antes de imprimir.
  - `handleAfterPrint`: resetea estado (carrito, comprobante por defecto, panel), muestra notificación de éxito y desbloquea el NCF.
- Efectos al abrir el panel: garantiza al menos un método de pago activo (o 0 si es CxC), inicializa/normaliza valores del formulario de AR y reinicia flags de envío/submit.

Estados/flags importantes:
- `loading`, `submitted`, `pendingPrint` y `isTestMode` controlan la UX y el flujo de impresión.
- El botón “Facturar” se desactiva si no hay método de pago activo, si hay cambio negativo sin CxC o si ya se envió.

---

## Servicio: processInvoice (negocio)

Firma: `export async function processInvoice(params) -> { invoice }` (`invoiceService.js:24`)

Parámetros clave:
- `user`, `cart`, `client`.
- `accountsReceivable` (CxC), `insuranceAR`, `insuranceAuth`, `insuranceEnabled`.
- `ncfType`, `taxReceiptEnabled`, `dueDate` (ms), `dispatch`, `isTestMode`.

Flujo principal:
1. Validar carrito: `verifyCartItems` (`invoiceService.js:112`).
2. Modo prueba (si `isTestMode`): `processTestModeInvoice` (`invoiceService.js:257`) y retornar mock de factura sin persistir.
3. Validar cuadre de caja: `validateCashReconciliation` (`invoiceService.js:118`). Requiere estado `open` o aborta con estrategia de notificación.
4. NCF (si habilitado): `handleTaxReceiptGeneration` (`invoiceService.js:136`) usando `fbGetAndUpdateTaxReceipt`.
5. Cliente: `retrieveAndUpdateClientData` (`invoiceService.js:147`) con `fbUpsertClient`; usa `GenericClient` como fallback.
6. Generar factura:
   - Si es preorden: `generalInvoiceFromPreorder` (`invoiceService.js:235`) con `fbGenerateInvoiceFromPreorder`.
   - Si es venta normal: `generateFinalInvoice` (`invoiceService.js:164`) que llama a `fbAddInvoice` y adjunta `NCF`, `client` y `cashCountId`. Considera `dueDate` con `checkIfHasDueDate` (`invoiceService.js:100`).
7. Inventario: `adjustProductInventory` (`invoiceService.js:158`) con `fbUpdateProductsStock`.
8. Notas de crédito: si existen en el carrito, `fbConsumeCreditNotes`.
9. Cuentas por cobrar:
   - AR normal: `manageReceivableAccounts` (`invoiceService.js:179`) usa `fbAddAR` y `fbAddInstallmentAR`.
   - AR de seguros: `manageInsuranceReceivableAccounts` (`invoiceService.js:192`) normaliza estructura, obtiene nombre del seguro (`getInsurance`) y registra autorización (`addInsuranceAuth`).
10. Retorno: `{ invoice }`.

Errores y garantías:
- Lanza errores con mensajes específicos en cada etapa (cuadre de caja, NCF, cliente, inventario, AR, seguros).
- En modo prueba no hay escrituras a BD; se simula NCF e ID de factura y se logran tiempos de procesamiento realistas.

---

## Cálculo de fecha de vencimiento (AR)

- `calculateDueDate` (UI) suma meses/semanas/días al tiempo actual.
- `checkIfHasDueDate` (servicio) convierte a `Timestamp` y marca `hasDueDate` para persistencia.

---

## Precondiciones y postcondiciones

Precondiciones:
- Carrito válido (productos, totales) y, si CxC, formulario de AR completo.
- Cuadre de caja abierto para ventas reales (no aplica en modo prueba).
- Si NCF está habilitado, `ncfType` válido y disponible.

Postcondiciones:
- Factura persistida (o simulada en test), inventario actualizado, NCF consumido, AR creada cuando aplica.
- UI limpia: carrito reiniciado, comprobante restablecido, panel cerrado, notificación de éxito.

---

## Integraciones externas (resumen)

- Firestore/Firebase: `fbAddInvoice`, `fbUpdateProductsStock`, `fbAddAR`, `fbAddInstallmentAR`, `fbGenerateInvoiceFromPreorder`, `fbGetAndUpdateTaxReceipt`, `fbConsumeCreditNotes`.
- Seguros: `getInsurance`, `addInsuranceAuth`.
- UI/UX: `useReactToPrint`, `downloadInvoiceLetterPdf` para plantillas tipo carta.

---

## Consideraciones para versión backend

- `processInvoice` ya está modularizado y delimita claramente el contrato de entrada/salida → candidato a trasladar a un endpoint o función serverless.
- Requisitos backend:
  - Autorización/tenancy por `user` y `business`.
  - Transaccionalidad en: consumo de NCF, creación de factura, actualización de inventario, AR e instalación de cuotas.
  - Rutas idempotentes o llaves de deduplicación para evitar facturas duplicadas.
- Contrato sugerido:
  - Input: `{ cart, userId, client, ncfType, taxReceiptEnabled, accountsReceivable, insurance: { enabled, AR, auth }, dueDate, testMode }`.
  - Output: `{ invoice, warnings? }`.

---

## Riesgos y casos borde

- Cambio negativo sin CxC: botón deshabilitado en UI.
- Impresión antes de hidratar estado: mitigado con `pendingPrint` y `useReactToPrint`.
- Falta de cuadre de caja: bloquea proceso y muestra estrategia de notificación.
- Concurrencia de NCF: uso de `fbGetAndUpdateTaxReceipt` para reservar/actualizar.
- Preorden inválida: se aborta en `generalInvoiceFromPreorder` con mensaje claro.

---

## Referencias rápidas

- `src/views/component/Cart/components/InvoicePanel/InvoicePanel.jsx:70`
- `src/views/component/Cart/components/InvoicePanel/InvoicePanel.jsx:208`
- `src/services/invoice/invoiceService.js:24`
- `src/services/invoice/invoiceService.js:100`
- `src/services/invoice/invoiceService.js:112`
- `src/services/invoice/invoiceService.js:118`
- `src/services/invoice/invoiceService.js:136`
- `src/services/invoice/invoiceService.js:147`
- `src/services/invoice/invoiceService.js:158`
- `src/services/invoice/invoiceService.js:164`
- `src/services/invoice/invoiceService.js:179`
- `src/services/invoice/invoiceService.js:192`
- `src/services/invoice/invoiceService.js:235`
- `src/services/invoice/invoiceService.js:257`

