# Flujo de Facturación: InvoicePanel + processInvoice

## 📋 Contexto

El flujo de facturación conecta el panel de cobro (`InvoicePanel`) con el servicio `processInvoice`, coordinando validaciones de carrito, generación de NCF, inventario, cuentas por cobrar e impresión. Es el corazón de la operación diaria de ventas.

## 🎯 Objetivos

- Documentar cómo la UI recolecta datos, bloquea acciones y dispara el servicio central.
- Detallar las etapas críticas del servicio de negocio y sus dependencias (NCF, inventario, AR, seguros).
- Identificar riesgos actuales del flujo V2 y dejar claro que la persistencia principal ya entra por backend/serverless.

## ⚙️ Diseño / Arquitectura

Este documento describe el flujo completo para “hacer la factura” desde el panel de pago en el frontend y el servicio de generación de facturas, incluyendo validaciones, efectos secundarios, manejo de impresión y precondiciones.

### Componentes y archivos clave

- UI principal: `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx:28` (ruta actual).
- Acción principal (submit): `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts:340` delega en `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:214` (ruta actual).
- Servicio cliente: `src/services/invoice/useInvoice.ts:250` y `src/services/invoice/invoice.service.ts:482` llaman la callable `createInvoiceV2`.
- Backend V2 vigente: `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js` delega en `createPendingInvoice` (`functions/src/app/versions/v2/invoice/services/orchestrator.service.js`), y `processInvoiceOutbox` (`functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`) ejecuta las tareas diferidas.
- Compatibilidad/legacy: `functions/src/app/modules/invoice/services/invoice.service.js` (`processInvoiceData`) documenta el flujo historico y no debe presentarse como el camino actual de `createInvoiceV2`.
- Utilidades relacionadas: actualización de inventario, NCF, AR, preórdenes y modo prueba (ver rutas actuales referenciadas más abajo).

---

### InvoicePanel (UI)

Responsable de:

- Recoger forma de pago, CxC (AR), comprobante fiscal (NCF), y datos de impresión.
- Bloquear/desbloquear tipo de comprobante durante el procesamiento.
- Ejecutar `processInvoice` y manejar la impresión/limpieza del estado.

Puntos relevantes:

- `handleCancelShipping`: limpia carrito, cierra panel, borra cliente y datos de seguro cuando corresponde.
- `handleSubmit` (`src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts:340`; `submitInvoicePanel` en `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:214`, ruta actual):
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

### Servicio: processInvoice -> createInvoiceV2

Firma actual: `processInvoice(params)` (`src/services/invoice/useInvoice.ts:250`) envuelve `submitInvoice` (`src/services/invoice/invoice.service.ts:482`) y la callable `createInvoiceV2`. El backend actual crea una factura V2 pendiente con `createPendingInvoice` y agenda tareas de outbox para inventario, CxC, e-CF/DGII, factura canonica y cierre/compensacion.

Nota de ruta: el servicio cliente anterior ya no existe; las referencias siguientes apuntan a la ruta actual o nombran el equivalente del snapshot histórico cuando el nombre cambió.

Parámetros clave:

- `user`, `cart`, `client`.
- `accountsReceivable` (CxC), `insuranceAR`, `insuranceAuth`, `insuranceEnabled`.
- `ncfType`, `taxReceiptEnabled`, `dueDate` (ms), `dispatch`, `isTestMode`.

Flujo principal vigente:

1. Validar carrito y payload en frontend antes de llamar `createInvoiceV2`.
2. Modo prueba (si `isTestMode`): `buildTestModeInvoice` (`src/services/invoice/useInvoice.ts`) retorna una factura simulada sin persistir.
3. Normalizar carrito antes de enviarlo al backend (`src/services/invoice/invoice.service.ts`), forzando `productStockId` y `batchId` a `null` cuando no existan valores reales.
4. `createInvoiceV2` valida autenticacion, negocio, payload y delega en `createPendingInvoice`.
5. `createPendingInvoice` crea `invoicesV2/{invoiceId}`, reserva idempotencia, prepara snapshot y agenda tareas `outbox` como inventario, CxC (`setupAR`), proyeccion canonica, e-CF/DGII y finalizacion.
6. `processInvoiceOutbox` ejecuta cada tarea de forma separada, incluyendo `adjustProductInventory` y la creacion de CxC cuando aplica.
7. `attemptFinalizeInvoice` cierra la factura V2 o agenda compensaciones si una tarea critica falla.
8. Retorno al cliente: `{ invoice }` o resultado equivalente para que la UI imprima y limpie estado.

Errores y garantías:

- Lanza errores con mensajes específicos en cada etapa (cuadre de caja, NCF, cliente, inventario, AR, seguros).
- En modo prueba no hay escrituras a BD; se simula NCF e ID de factura y se logran tiempos de procesamiento realistas.

---

### Cálculo de fecha de vencimiento (AR)

- `calculateDueDate` (UI) suma meses/semanas/días al tiempo actual.
- `checkIfHasDueDate` (servicio) convierte a `Timestamp` y marca `hasDueDate` para persistencia.

---

### Precondiciones y postcondiciones

Precondiciones:

- Carrito válido (productos, totales) y, si CxC, formulario de AR completo.
- Cuadre de caja abierto para ventas reales (no aplica en modo prueba).
- Si NCF está habilitado, `ncfType` válido y disponible.

Postcondiciones:

- Factura persistida (o simulada en test), inventario actualizado, NCF consumido, AR creada cuando aplica.
- UI limpia: carrito reiniciado, comprobante restablecido, panel cerrado, notificación de éxito.

---

### Integraciones externas (resumen)

- Firestore/Firebase: `createInvoiceV2`, `createPendingInvoice`, `processInvoiceOutbox`, tareas `outbox` de inventario/CxC/e-CF y servicios legacy solo como compatibilidad historica.
- Seguros: `getInsurance`, `addInsuranceAuth`.
- UI/UX: `useReactToPrint`, `downloadInvoiceLetterPdf` para plantillas tipo carta.

---

### Consideraciones backend

- `processInvoice` ya entra por `createInvoiceV2`; el foco pendiente no es migrar a backend, sino endurecer idempotencia, monitoreo de outbox y compatibilidad con lectores legacy.
- Requisitos backend:
  - Autorización/tenancy por `user` y `business`.
  - Transaccionalidad en: consumo de NCF, creación de factura, actualización de inventario, AR e instalación de cuotas.
  - Rutas idempotentes o llaves de deduplicación para evitar facturas duplicadas.
- Contrato sugerido:
  - Input: `{ cart, userId, client, ncfType, taxReceiptEnabled, accountsReceivable, insurance: { enabled, AR, auth }, dueDate, testMode }`.
  - Output: `{ invoice, warnings? }`.

---

### Riesgos y casos borde

- Cambio negativo sin CxC: botón deshabilitado en UI.
- Impresión antes de hidratar estado: mitigado con `pendingPrint` y `useReactToPrint`.
- Falta de cuadre de caja: bloquea proceso y muestra estrategia de notificación.
- Concurrencia de NCF: el flujo V2 debe mantenerse en reserva server-side; `fbGetAndUpdateTaxReceipt` queda como referencia legacy/congelada para no crecer.
- Preorden inválida: se aborta en `generalInvoiceFromPreorder` con mensaje claro.

---

## 📈 Impacto / Trade-offs

- 👍 Permite facturar desde frontend con respuestas inmediatas (modo test incluye simulación sin persistir).
- 👍 Orquesta dependencias críticas (NCF, inventario, AR, seguros) en una sola llamada.
- ⚠️ La UI todavía prepara mucho payload y conserva dependencias legacy, aunque la persistencia critica ya vive en la callable V2 y su outbox.
- ⚠️ No existen transacciones multi-servicio: fallas intermedias dejan estados parciales y dependen de jobs correctivos.

## 🔜 Seguimiento / Próximos pasos

- [ ] Diseñar versión backend/serverless que encapsule `processInvoice` con garantías ACID.
- [ ] Cubrir el flujo con pruebas automatizadas y mocks de servicios externos.
- [ ] Registrar y documentar mensajes para los casos de error recurrentes (NCF agotado, cuadre cerrado, stock insuficiente).

### Referencias rápidas

- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel.tsx:28`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.ts:340`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts:214`
- `src/services/invoice/useInvoice.ts:45`
- `src/services/invoice/useInvoice.ts:250`
- `src/services/invoice/invoice.service.ts:174`
- `src/services/invoice/invoice.service.ts:482`
- `functions/src/app/modules/invoice/services/invoice.service.js:25`
- `functions/src/app/modules/invoice/utils/invoiceValidation.js:34`
- `functions/src/app/modules/cashCount/utils/cashCountCheck.js:13`
- `functions/src/app/modules/taxReceipt/services/taxReceiptAdmin.service.js:76`
- `functions/src/app/modules/client/services/clientAdmin.service.js:22`
- `functions/src/app/modules/invoice/services/invoiceGeneration.service.js:25`
- `functions/src/app/modules/invoice/services/invoiceGeneration.service.js:35`
- `functions/src/app/modules/invoice/services/invoiceGeneration.service.js:94`
- `functions/src/app/modules/Inventory/services/Inventory.service.js:127`
- `functions/src/app/modules/accountReceivable/services/accountReceivable.service.js:6`
- `functions/src/app/modules/accountReceivable/services/insuranceAccountReceivable.service.js:8`
