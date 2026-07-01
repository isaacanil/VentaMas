# Venta, facturacion e inventario - release checklist

Fecha: 2026-06-30
Repo local: `C:\Dev\VentaMas`
Branch inspeccionada: `jonathan/release-consolidation-2026-06-24`
Estado: produccion segura parcial. No desplegar todavia.

## Objetivo

Cerrar de forma controlada los riesgos criticos del flujo de venta, facturacion
e inventario, con foco en dinero, saleUnits, venta por peso, inventario,
outbox, notas de credito y release reproducible.

## Estado ejecutivo

El nucleo transaccional quedo mas fuerte: la validacion backend recalcula dinero,
rechaza moneda mixta no verificable, valida producto y saleUnit contra catalogo,
rechaza productos/saleUnits inactivos, valida `baseQuantity` si el payload la
incluye, y el inventario descuenta usando cantidad base recalculada.

El sistema no esta listo para produccion porque el worktree no representa un
paquete de release reproducible. Hay cambios staged ajenos, archivos `MM/AM`,
archivos runtime criticos sin tracking y falta ejecutar un E2E completo del
flujo de venta con datos controlados para normal, presentacion y peso.

## Invariantes confirmados

- Producto normal: `baseQuantity = amountToBuy`.
- Presentacion o unidad de venta: `baseQuantity = amountToBuy * conversionFactorToBase`.
- Producto por peso: `baseQuantity = weightDetail.weight`.
- Si el cliente envia `baseQuantity`, backend ahora la valida contra esos calculos.
- Si el cliente no envia `baseQuantity`, se mantiene compatibilidad legacy y el
  backend de inventario recalcula la cantidad base.
- Notas de credito siguen financieras: no tocan inventario y rechazan intencion
  de devolucion fisica.
- `processInvoiceOutbox` pasa `saleId: invoiceId` para activar ids
  deterministas de movimientos/backorders/COGS.

## Cambios funcionales aplicados en esta ronda

### Notas de credito

Archivos:

- `functions/src/app/modules/accountReceivable/functions/customerCreditNotes.js`
- `functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js`

Resultado:

- `createCustomerCreditNote` y `updateCustomerCreditNote` rechazan intencion de
  devolucion fisica.
- Las notas editables quedan forzadas a:
  - `inventoryEffect: 'financial_only'`
  - `physicalReturn: false`
  - `affectsInventory: false`

### Catalogo y baseQuantity

Archivos:

- `functions/src/app/modules/Inventory/services/Inventory.service.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`

Resultado:

- Productos inactivos/eliminados se rechazan con `PRODUCT_INACTIVE`.
- SaleUnits inactivas se rechazan con `SALE_UNIT_INACTIVE`.
- `baseQuantity` manipulada se rechaza con `BASE_QUANTITY_INCONSISTENT`.
- Cobertura agregada para producto normal, caja x12 y peso.

### Outbox e idempotencia

Archivo:

- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js`

Resultado:

- Test confirma que `updateInventory` llama inventario con identificadores
  idempotentes basados en `invoiceId`.

### Impresion fiscal por peso

Archivos:

- `src/modules/invoice/printPagination/documentModel.ts`
- `src/modules/invoice/printPagination/documentModel.test.ts`

Resultado:

- Productos vendidos por peso imprimen `weightDetail.weight` como cantidad,
  incluso cuando `amountToBuy` conserva el valor legacy `1`.
- Se mantiene la etiqueta de unidad de peso solo cuando el producto realmente
  esta marcado como vendido por peso.

### Export Excel de facturas

Archivos:

- `src/utils/export/excel/formatBill.ts`
- `src/utils/export/excel/formatBill.test.ts`
- `src/utils/export/excel/exportConfig.ts`

Resultado:

- El export detallado conserva `Cantidad Facturada` como cantidad visible
  corregida.
- Agrega columnas separadas:
  - `Cantidad Comercial`
  - `Cantidad Base Inventario`
  - `Peso Vendido`
  - `Unidad Peso`
  - `Cantidad Presentación`
  - `Presentación`
- Para caja x12, exporta cantidad comercial 2 y base 24.
- Para peso con `amountToBuy: 1`, exporta cantidad facturada/peso/base 2.5.

### Export Excel de notas de credito

Archivos:

- `src/utils/export/excel/formatCreditNote.ts`
- `src/utils/export/excel/formatCreditNote.test.ts`

Resultado:

- El export detallado de notas de credito deja de leer `amountToBuy` crudo.
- Reutiliza `resolveInvoiceProductQuantity` para exportar la cantidad visible:
  peso usa `weightDetail.weight` y presentacion usa cantidad comercial.
- Para peso con `amountToBuy: 1`, exporta `Cantidad` 2.5.
- Para caja x12 con `amountToBuy: { unit: 2, total: 24 }`, exporta
  `Cantidad` 2, no la cantidad base 24.

### Analytics de ventas

Archivos:

- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.ts`
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts`

Resultado:

- El modelo de analytics mantiene `items`/`cantidad` como cantidad comercial.
- Agrega metricas separadas en categorias y filas de producto:
  - `baseQuantity`
  - `weightQuantity`
  - `saleUnitQuantity`
- Para caja x12, categoria y detalle de cliente registran cantidad comercial 2,
  base 24 y cantidad de presentacion 2.
- Para peso con `amountToBuy: 1`, categoria y detalle de cliente usan 2.5 como
  cantidad comercial/base/peso.

### Conversion de peso y descuentos por peso

Archivos:

- `functions/src/app/modules/Inventory/utils/weightUnit.util.js`
- `functions/src/app/modules/Inventory/utils/weightUnit.util.test.js`
- `functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.js`
- `functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js`
- `functions/src/app/modules/Inventory/services/Inventory.service.js`
- `functions/src/app/modules/Inventory/services/Inventory.service.test.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`
- `src/domain/products/weightUnits.ts`
- `src/domain/products/weightUnits.test.ts`
- `src/domain/products/saleUnits.ts`
- `src/domain/products/saleUnits.test.ts`
- `src/features/cart/cartSlice.ts`
- `src/features/cart/cartSlice.test.ts`
- `src/features/cart/utils/updateAllTotals.test.ts`
- `src/modules/sales/pages/Sale/Sale.tsx`
- `src/modules/sales/pages/Sale/utils/cartPhysicalStockUsage.ts`
- `src/modules/sales/pages/Sale/utils/cartPhysicalStockUsage.test.ts`
- `src/modules/sales/pages/Sale/utils/productStockSelection.test.ts`
- `src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/hooks/useProductHandling.tsx`
- `src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/hooks/useProductCartAndStock.tsx`
- `src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/utils/stock.utils.test.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductsList/ProductsList.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.test.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/getInvoiceErrorNotification.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.test.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.test.ts`
- `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.tsx`
- `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.test.tsx`
- `src/services/invoice/autoCompletePreorderInvoice.ts`
- `src/modules/invoice/services/autoCompletePreorderInvoice.test.ts`
- `src/utils/invoiceValidation.ts`
- `src/utils/invoiceValidation.test.ts`
- `src/utils/fiscal/dominicanTaxId.ts`
- `src/utils/fiscal/dominicanTaxId.test.ts`
- `src/utils/invoice/product.test.ts`
- `src/utils/pricing.ts`
- `src/utils/pricing.test.ts`

Resultado:

- Peso vendido en `lb`, `oz`, `g` y `mg` se convierte a kg como cantidad base
  de inventario para carrito, validacion backend e inventario.
- En facturas nuevas, la validacion backend rechaza unidades de peso presentes
  y no soportadas antes de confiar el carrito.
- En V2, el producto por peso debe estar marcado como tal en catalogo y debe
  tener `weightDetail.weightUnit` soportada; la unidad de catalogo se vuelve
  server-owned y reemplaza/valida la unidad del payload.
- `adjustProductInventory` tambien rechaza unidades no soportadas antes de
  escribir movimientos, backorders, COGS o descuentos de stock, para cubrir
  outbox/reintentos o llamadas internas que no pasen por el borde V2.
- El helper de conversion conserva fallback 1:1 para unidades legacy al leer
  datos historicos, pero ese fallback ya no autoriza facturas nuevas con unidad
  desconocida.
- La cantidad visible de factura/export/reportes sigue usando el peso comercial
  ingresado; `baseQuantity` queda separado.
- El limite de stock en el input de peso convierte el stock base a la unidad
  visible antes de bloquear.
- Los descuentos individuales en productos por peso ahora afectan subtotal,
  ITBIS y total de forma consistente en POS y validador backend.
- El POS suma `baseQuantity` acumulada por stock fisico
  `productId + productStockId + batchId` para no tratar multiples lineas de
  peso como consumos independientes.
- Agregar desde tarjeta de producto y desde escaneo de codigo bloquea temprano
  si el consumo acumulado excede el stock fisico seleccionado.
- El input editable de peso recibe stock disponible ajustado por otras lineas
  del mismo stock fisico, excluyendo la linea actual cuando se edita.
- El modal manual de lote/ubicacion bloquea `addProduct` y
  `updateProductFields` cuando el lote seleccionado ya esta consumido por
  otras lineas del carrito; al editar, excluye la misma linea para evitar doble
  conteo.
- El estado visual de stock en la tarjeta de producto usa cantidad base
  acumulada, no solo la primera linea encontrada en carrito.
- El frontend conserva fallback legacy de conversion para lectura, pero
  `validateInvoiceCart` y `validateInvoiceSubmissionGuards` bloquean facturas
  nuevas si un producto por peso no trae unidad soportada (`kg`, `lb`, `oz`,
  `g` o `mg`).
- La conversion automatica de preventa a factura ejecuta `validateInvoiceCart`
  antes de verificar caja o llamar `submitInvoice`, evitando que una preventa
  por peso con unidad ambigua llegue directo a `createInvoiceV2`.
- Para comprobantes fiscales detallados, el POS valida RNC/cedula dominicanos
  con longitud y digito verificador antes de emitir; consumidor final conserva
  tolerancia cuando el dato fiscal es opcional.
- Los rechazos GISYS de datos fiscales del comprador (`BUYER_RNC_*` y
  equivalentes) abren accion de correccion del cliente en vez de dejar solo un
  error generico.

Pendiente:

- E2E autenticado de `/sales` con normal, presentacion y peso queda pendiente:
  la validacion de navegador de esta subfase redirigio a `/login` por falta de
  sesion.

### CxC y pago con notas de credito

Archivos:

- `functions/src/app/modules/invoice/utils/invoicePayment.util.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js`
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.js`
- `functions/src/app/versions/v2/invoice/services/creditNotes.service.test.js`

Resultado:

- La validacion backend rechaza pagos `creditNote` si no existe
  `cart.creditNotePayment` equivalente por el mismo monto.
- Tambien rechaza `creditNotePayment` sin metodo de pago activo equivalente.
- En facturas a credito, `setupAR` ya no copia
  `accountsReceivable.totalReceivable` desde el cliente: recalcula el balance
  pendiente desde `cart.totalPurchase`, pagos reales y notas aplicadas.
- El cliente de CxC se toma desde `payload.client.id` antes que desde el objeto
  `accountsReceivable`, evitando spoofing basico de `clientId`.
- Las entradas duplicadas de la misma nota de credito se agrupan antes de leer
  saldo y escribir aplicaciones; si el acumulado excede disponible, no escribe
  actualizaciones parciales.
- Sigue pendiente E2E/browser con venta a credito y nota de credito real antes
  de declarar produccion lista.

### Moneda y snapshot monetario contable

Archivos:

- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js`
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js`

Resultado:

- Para release seguro inmediato, el backend rechaza facturas donde
  `documentCurrency` no coincide con la moneda funcional permitida por backend.
- El payload cliente ya no puede autodeclarar una `functionalCurrency` distinta
  de la moneda funcional permitida por backend.
- `createInvoiceV2` y `createInvoiceV2Http` leen la configuracion contable
  server-owned del negocio y pasan `functionalCurrency` al validador; si no hay
  configuracion confiable, el default seguro sigue siendo `DOP`.
- El orquestador deja de pasar `payload.cart.monetary` como autoridad al helper
  contable; el snapshot se deriva server-side desde contexto/totales/settings.
- El task `createCanonicalInvoice` ahora prefiere `invoice.snapshot.monetary`
  sobre `payload.cart.monetary`.
- Si no hay snapshot monetario normalizado ni canónica previa, la canónica nueva
  no conserva `cart.monetary` client-owned por arrastre del spread.
- Riesgo restante: moneda extranjera real y moneda mixta quedan fuera de release
  hasta implementar tasas server-owned end-to-end y E2E con datos reales.

### Tabla y preview de facturas

Archivos:

- `src/utils/invoice/amount.ts`
- `src/utils/invoice/product.ts`
- `src/utils/invoice/product.test.ts`
- `src/modules/invoice/pages/InvoicesPage/SaleReportTable/SaleReportTable.tsx`
- `src/modules/invoice/pages/InvoicesPage/InvoicePreview/components/Products.tsx`

Resultado:

- Se centraliza la cantidad visible facturada en `resolveInvoiceProductQuantity`.
- Productos por peso usan `weightDetail.weight` aunque `amountToBuy` sea el
  valor legacy `1`.
- Presentaciones/saleUnits conservan la cantidad comercial visible; la base de
  inventario queda separada para backend/export/analytics.
- `SaleReportTable` deja de sumar `amountToBuy` crudo en `CANT.`.
- `InvoicePreview` deja de leer `amountToBuy` directo para la columna
  `Cantidad`.

### Workspace de facturas, notas de credito y plantillas PDF

Archivos:

- `src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.ts`
- `src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceFormat.ts`
- `src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/components/InvoiceWorkspaceProducts.tsx`
- `src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.ts`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/CreditNoteModal.tsx`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/CreditNoteQuantityControl.tsx`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductCard.tsx`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductList.tsx`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteColumns.tsx`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.ts`
- `src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts`
- `src/pdf/invoicesAndQuotation/utils/formatters.ts`
- `src/pdf/invoicesAndQuotation/utils/formatters.test.ts`
- `src/pdf/invoicesAndQuotation/invoices/templates/template2/builders/content.ts`
- `src/pdf/invoicesAndQuotation/quotations/templates/template2/builders/content.ts`
- `src/pdf/invoicesAndQuotation/invoices/templates/template2-v2/InvoiceLetterDocument.tsx`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2/components/Content/index.tsx`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate3/components/Content/index.tsx`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.ts`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.ts`
- `src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts`

Resultado:

- El workspace de facturas editadas calcula la cantidad visible con
  `resolveInvoiceProductQuantity`.
- Al editar una linea por peso, actualiza `weightDetail.weight` y
  `baseQuantity`; `amountToBuy` queda como compatibilidad legacy.
- Al editar presentaciones o unidades fraccionarias, conserva cantidad
  comercial y recalcula `baseQuantity = quantity * conversionFactorToBase`.
- Los inputs del workspace y nota de credito aceptan `0.01` para peso o
  `allowFractional`, y mantienen paso `1` para unidades enteras.
- La seleccion, edicion, columnas y tarjetas de notas de credito usan cantidad
  visible centralizada y ya no recortan parciales por peso a enteros.
- Las plantillas PDF/fiscales usan peso vendido para cantidad, descuentos y
  total de linea cuando `amountToBuy` conserva el valor legacy `1`.

## Pruebas ejecutadas y resultado

Commands:

```powershell
npm run test:run:functions -- functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js
```

Resultado: 3 archivos, 49 tests passed antes del hardening de `baseQuantity`.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js
```

Resultado: 1 archivo, 28 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js functions/src/app/modules/Inventory/services/getInventory.service.test.js functions/src/app/modules/Inventory/services/Inventory.service.test.js functions/src/app/modules/invoice/functions/invoiceLifecycle.test.js functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js functions/src/app/versions/v2/invoice/services/printReady.service.test.js
```

Resultado: 10 archivos, 101 tests passed.

```powershell
npm run test:run -- src/domain/products/saleUnits.test.ts src/features/cart/cartSlice.test.ts src/features/cart/utils/updateAllTotals.test.ts src/utils/pricing.test.ts src/utils/accounting/lineMonetary.test.ts
```

Resultado: 5 archivos, 35 tests passed.

```powershell
npm run test:run -- src/modules/invoice/printPagination/documentModel.test.ts
```

Resultado: 1 archivo, 9 tests passed.

```powershell
npm run test:run -- src/modules/invoice/printPagination/documentModel.test.ts src/modules/invoice/components/FiscalDocumentPagination/adapters/buildFiscalDocumentPagination.test.tsx src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/PaginatedPrintHost/PaginatedInvoicePrintHost.test.tsx src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/hooks/useInvoicePanelController.printing.test.ts
```

Resultado: 4 archivos, 28 tests passed.

```powershell
npm run test:run -- src/utils/export/excel/formatBill.test.ts src/modules/invoice/pages/ServiceCommissionsReport/utils/serviceCommissionsReportExport.test.ts
```

Resultado: 2 archivos, 3 tests passed.

```powershell
npm run test:run -- src/utils/export/excel/formatCreditNote.test.ts src/utils/invoice/product.test.ts src/utils/invoiceValidation.test.ts src/modules/invoice/services/autoCompletePreorderInvoice.test.ts
```

Resultado: 4 archivos, 21 tests passed.

```powershell
npm run test:run -- src/utils/export/excel/formatCreditNote.test.ts src/utils/export/excel/formatBill.test.ts src/utils/invoice/product.test.ts src/utils/invoiceValidation.test.ts src/modules/invoice/services/autoCompletePreorderInvoice.test.ts
```

Resultado: 5 archivos, 22 tests passed.

```powershell
npm run test:run -- src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts
```

Resultado: 1 archivo, 3 tests passed.

```powershell
npm run test:run -- src/utils/invoice/product.test.ts src/modules/invoice/printPagination/documentModel.test.ts src/utils/export/excel/formatBill.test.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts
```

Resultado: 4 archivos, 18 tests passed.

```powershell
npm run test:run:architecture:functions
npm --prefix functions run build
npm run typecheck:app
npm run build:staging
```

Resultado anterior de esa ronda: todos pasaron.

Actualizacion posterior:

```powershell
npm run typecheck:app
```

Resultado actual: pasa.

```powershell
git diff --check -- functions/src/app/modules/invoice/utils/invoiceValidation.js functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/modules/accountReceivable/functions/customerCreditNotes.js functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js
```

Resultado: sin errores. Solo warnings LF/CRLF.

```powershell
git diff --check -- src/utils/invoice/amount.ts src/utils/invoice/product.ts src/utils/invoice/product.test.ts src/modules/invoice/pages/InvoicesPage/SaleReportTable/SaleReportTable.tsx src/modules/invoice/pages/InvoicesPage/InvoicePreview/components/Products.tsx
```

Resultado: sin errores. Solo warnings LF/CRLF.

```powershell
npm run test:run -- src/pdf/invoicesAndQuotation/utils/formatters.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts src/utils/invoice/product.test.ts src/modules/invoice/printPagination/documentModel.test.ts src/utils/export/excel/formatBill.test.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts
```

Resultado: 10 archivos, 53 tests passed.

```powershell
npm run test:run -- src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx src/features/invoice/invoiceFormSlice.test.ts src/pdf/invoicesAndQuotation/utils/formatters.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts src/utils/invoice/product.test.ts src/domain/products/saleUnits.test.ts src/modules/invoice/printPagination/documentModel.test.ts src/utils/export/excel/formatBill.test.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts
```

Resultado: 14 archivos, 63 tests passed.

```powershell
npm run test:run -- src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.test.tsx src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.test.ts src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.test.ts src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.test.ts
```

Resultado: 4 archivos, 12 tests passed.

```powershell
npm run lint:web
npm run typecheck:app
```

Resultado: ambos gates pasan. `lint:web` quedo verde despues de mover helpers
testeados fuera de archivos de componentes y ajustar memoizacion en
`PriceAndSaleUnitsModal`.

Revalidacion posterior:

```powershell
npm run typecheck:app
npm run lint:web
```

Resultado: ambos gates pasan.

```powershell
git diff --check -- docs/audits/venta-facturacion-inventario-release-checklist-2026-06-30.md src/utils/export/excel/formatCreditNote.ts src/utils/export/excel/formatCreditNote.test.ts
```

Resultado: sin errores. Solo warning LF/CRLF en
`src/utils/export/excel/formatCreditNote.ts`.

```powershell
npm run test:run -- src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx src/features/invoice/invoiceFormSlice.test.ts src/pdf/invoicesAndQuotation/utils/formatters.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts src/utils/invoice/product.test.ts src/domain/products/saleUnits.test.ts src/modules/invoice/printPagination/documentModel.test.ts src/utils/export/excel/formatBill.test.ts src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.test.tsx src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.test.ts src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/CartQuantityCounter/CartQuantityCounter.helpers.test.ts src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.test.ts src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.test.ts
```

Resultado: 19 archivos, 81 tests passed.

```powershell
git diff --check -- src/domain/products/normalization.ts src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.tsx src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.test.ts src/modules/dev/pages/DevTools/ProductStudio/components/sections/pricingSectionValidation.ts src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.tsx src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.test.ts src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.rules.ts src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/PriceAndSaleUnitsModal/PriceAndSaleUnitsModal.tsx src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.tsx src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.test.tsx src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.tsx src/modules/sales/pages/PreorderSale/components/PreSaleTable/preSaleTableRows.ts src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.tsx src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx src/features/invoice/invoiceFormSlice.ts src/features/invoice/invoiceFormSlice.test.ts
```

Resultado: sin errores. Solo warnings LF/CRLF.

```powershell
npm run lint:styles
npm --prefix functions run build
npm run build:staging
```

Resultado: los tres gates pasan. Build staging genero bundles de `Sale`,
`PreorderSale`, `InvoiceForm` e `InvoiceWorkspaceModal` sin error.

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File 'tools/release/verify-sale-release-package.ps1' -MaxOutsideChangesToShow 20
```

Resultado actual: falla por diseno porque el paquete aun no es reproducible.
Tras ampliar el manifiesto con CxC/notas/backfill/UX de peso, encontro 171
archivos, 171 con cambios, 0 rutas faltantes, staged fuera del manifiesto, 12
archivos mixtos `MM/AM` y 376 cambios fuera del manifiesto. Bloqueantes:
staged fuera del paquete y archivos `MM/AM`.

Detalle adicional del bloqueo:

- Dentro del manifiesto solo aparece mixto
  `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`.
- La parte staged de ese archivo mueve `getTaxReceiptAvailability` antes de la
  validacion de cliente fiscal para bloquear comprobantes duplicados/depletados.
- La parte unstaged agrega validacion dominicana de RNC/cedula, accion para
  editar datos fiscales del cliente y manejo de errores con accion
  `edit-client-fiscal-data`.
- Decision de auditoria: `submitInvoicePanel.ts` debe entrar completo en el
  paquete, junto con `submitInvoicePanel.test.ts`,
  `getInvoiceErrorNotification.ts` y `src/utils/fiscal/dominicanTaxId.ts/test`.
  Es parte del riesgo fiscal/e-CF, no un cambio ajeno. El bloqueo restante es
  reconstruir el indice selectivo; eso requiere autorizacion.

```powershell
npm run test:run -- src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.test.ts src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/getInvoiceErrorNotification.test.ts src/utils/fiscal/dominicanTaxId.test.ts
```

Resultado: 3 archivos, 39 tests passed. Cubre bloqueo temprano de RNC/cedula
invalido para comprobantes detallados, tolerancia de consumidor final opcional
y accion de correccion ante rechazos GISYS de comprador.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js
```

Resultado: 3 archivos, 36 tests passed. Cubre que `trustedCart` saneado pasa a
`createPendingInvoice`.

```powershell
npm run test:run -- src/utils/invoice/product.test.ts src/utils/invoiceValidation.test.ts src/modules/invoice/services/autoCompletePreorderInvoice.test.ts src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx
```

Resultado: 5 archivos, 22 tests passed. Cubre cantidades estructuradas de
saleUnits y preventas que no pierden lineas antes de facturar.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js
```

Resultado: 6 archivos, 62 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js
```

Resultado posterior de Fase 3 parcial: 1 archivo, 30 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js
```

Resultado posterior de Fase 3 parcial: 6 archivos, 63 tests passed.

```powershell
npm run typecheck:app
npm run lint:web
npm --prefix functions run build
npm run build:staging
```

Resultado posterior: todos pasan despues del cierre de hallazgos de subagentes.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/services/creditNotes.service.test.js
```

Resultado posterior de CxC/notas: 3 archivos, 63 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/services/creditNotes.service.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js
```

Resultado posterior de CxC/notas con entrypoints: 5 archivos, 70 tests passed.

```powershell
npm --prefix functions run lint -- src/app/modules/invoice/utils/invoiceValidation.js src/app/modules/invoice/utils/invoicePayment.util.js src/app/versions/v2/invoice/services/orchestrator.service.js src/app/versions/v2/invoice/services/creditNotes.service.js src/app/versions/v2/invoice/services/orchestrator.service.test.js src/app/versions/v2/invoice/services/creditNotes.service.test.js
npm --prefix functions run build
```

Resultado posterior de CxC/notas: lint Functions y build Functions pasan.

```powershell
npm run test:run:functions -- functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js
```

Resultado posterior de outbox: 1 archivo, 7 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/products/utils/saleUnitsCacheBackfill.util.test.js functions/src/app/modules/products/utils/backfillProductSaleUnitsCache.script.test.js
```

Resultado posterior de backfill saleUnits: 2 archivos, 10 tests passed.

```powershell
node functions/scripts/backfillProductSaleUnitsCache.js --help
node functions/scripts/backfillProductSaleUnitsCache.js --businessId business-1 --limit nope --dry-run
```

Resultado posterior de backfill saleUnits: `--help` pasa y el limite invalido
falla antes de inicializar Firestore con `--limit debe ser un entero positivo.`

```powershell
npx eslint src/app/modules/products/utils/saleUnitsCacheBackfill.util.js src/app/modules/products/utils/saleUnitsCacheBackfill.util.test.js src/app/modules/products/utils/backfillProductSaleUnitsCache.script.test.js scripts/backfillProductSaleUnitsCache.js
npm --prefix functions run build
```

Resultado posterior de backfill saleUnits: lint focal y build Functions pasan.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js
```

Resultado posterior de moneda/snapshot monetario: 3 archivos, 60 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/utils/invoiceValidation.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js functions/src/app/versions/v2/invoice/services/finalize.service.test.js functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js
```

Resultado posterior de moneda/snapshot monetario con entrypoints/finalize:
6 archivos, 79 tests passed.

```powershell
npx eslint src/app/modules/invoice/utils/invoiceValidation.js src/app/modules/invoice/utils/invoiceValidation.test.js src/app/versions/v2/invoice/services/orchestrator.service.js src/app/versions/v2/invoice/services/orchestrator.service.test.js src/app/versions/v2/invoice/triggers/outbox.worker.js src/app/versions/v2/invoice/triggers/outbox.worker.test.js
npm --prefix functions run build
```

Resultado posterior de moneda/snapshot monetario: lint focal y build Functions
pasan.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/functions/invoiceLifecycle.test.js
```

Resultado posterior de anulacion fisica segura: 1 archivo, 7 tests passed.

```powershell
npm run test:run:functions -- functions/src/app/modules/invoice/functions/invoiceLifecycle.test.js functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js functions/src/app/versions/v2/invoice/services/creditNotes.service.test.js functions/src/app/versions/v2/invoice/triggers/compensation.worker.test.js
```

Resultado posterior de anulacion/notas/devolucion financiera: 4 archivos,
39 tests passed.

```powershell
npx eslint src/app/modules/invoice/functions/invoiceLifecycle.js src/app/modules/invoice/functions/invoiceLifecycle.test.js
npm --prefix functions run build
```

Resultado posterior de anulacion fisica segura: lint focal y build Functions
pasan.

```powershell
npm --prefix functions run build
```

Resultado posterior de Fase 3 parcial: pasa.

```powershell
npm --prefix functions run lint -- src/app/modules/invoice/utils/invoiceValidation.js src/app/modules/invoice/utils/invoiceValidation.test.js
```

Resultado: pasa. Nota: el script ejecuta `eslint .` aunque se pasen rutas; se
corrigio el unico error reportado (`amountToBuy` sin uso en
`Inventory.service.js`).

```powershell
npm run test:run:functions -- functions/src/app/modules/Inventory/services/Inventory.service.test.js functions/src/app/modules/invoice/utils/invoiceValidation.test.js
```

Resultado: 2 archivos, 43 tests passed.

```powershell
git diff --check -- src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2/components/Content/index.tsx src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate3/components/Content/index.tsx src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.ts src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/CreditNoteModal.tsx src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/CreditNoteQuantityControl.tsx src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductCard.tsx src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductList.tsx src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteColumns.tsx src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.ts src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/components/InvoiceWorkspaceProducts.tsx src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceFormat.ts src/pdf/invoicesAndQuotation/utils/formatters.ts src/pdf/invoicesAndQuotation/utils/formatters.test.ts src/pdf/invoicesAndQuotation/invoices/templates/template2/builders/content.ts src/pdf/invoicesAndQuotation/quotations/templates/template2/builders/content.ts src/pdf/invoicesAndQuotation/invoices/templates/template2-v2/InvoiceLetterDocument.tsx
```

Resultado: sin errores. Solo warnings LF/CRLF.

```powershell
git diff --check -- src/features/invoice/invoiceFormSlice.ts src/features/invoice/invoiceFormSlice.test.ts src/modules/invoice/pages/InvoicesPage/components/InvoiceForm/components/Products/Products.tsx src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.tsx src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.tsx src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx
```

Resultado: sin errores. Solo warnings LF/CRLF.

Validacion en navegador integrado:

- `http://localhost:5173/bills` en servidor Vite staging existente.
- Rango aplicado: `01/01/2026 - 31/12/2026`.
- Tabla de facturas renderizo 169 facturas reales.
- Columna `CANT.` visible sin overflow en desktop.
- Modal `Ver detalle` de factura `#800` abrio correctamente.
- `InvoicePreview` mostro la tabla de productos con columna `Cantidad` y
  resumen `Total de Artículos: 137`.
- Consola: sin errores de render. Warnings preexistentes de Pressable/foco y
  auto-refresh e-CF.

Validacion posterior de esta subfase:

- Se recargo `http://localhost:5173/bills` en el navegador integrado.
- Se aplico el preset `Este año`, quedando el rango
  `01/01/2026 - 31/12/2026`.
- La tabla renderizo 169 facturas reales; la fila `#800` mostro `CANT. = 137`.
- Se abrio `Ver detalle` de factura `#800`.
- El modal de factura mostro `Productos`, columna `Cantidad`, lineas de producto
  y resumen `Total de Artículos: 137`.
- Screenshot desktop:
  `C:\Dev\VentaMas\tmp-ventamas-bills-detail-weight-quantity-2026-06-30.png`.
- Screenshot movil:
  `C:\Dev\VentaMas\tmp-ventamas-bills-detail-weight-quantity-mobile-2026-06-30.png`.
- En desktop no se observaron solapes ni overflow visible en la tabla principal
  del modal.
- En movil no hubo overflow horizontal global; la tabla de productos usa scroll
  horizontal interno y deja `Precio Unitario/Total` fuera de la primera vista,
  comportamiento existente aceptable para esta subfase pero mejorable.
- Consola: sin errores nuevos de render. Persisten warnings preexistentes de
  Pressable/foco y auto-refresh e-CF.

Validacion navegador de preventas:

- Se intento abrir `http://localhost:5173/preorders` en navegador integrado, pero
  el webview no pudo adjuntar nuevas pestañas.
- Se intento con Chrome DevTools; la ruta cargo pero redirigio a
  `http://localhost:5173/login` por falta de sesion autenticada en ese perfil.
- No se ingresaron credenciales ni se hicieron acciones con efectos externos.
- La validacion visual autenticada de `/preorders` queda pendiente; se cubrio la
  logica visible con tests de `PreSaleTable` y `PreorderModal`.

Validacion navegador posterior de rutas protegidas:

- Se verifico que la ruta singular `http://127.0.0.1:5173/sale` no es valida y
  muestra `Pagina no encontrada`.
- Se navego a la ruta real `http://127.0.0.1:5173/sales`; al completar carga
  redirigio a `http://127.0.0.1:5173/login` por falta de sesion autenticada.
- Se navego a `http://127.0.0.1:5173/preorders`; al completar carga redirigio a
  `http://127.0.0.1:5173/login` por falta de sesion autenticada.
- Consola en `/sales`: solo mensajes Vite/React DevTools, sin errores.
- Consola en `/preorders`: solo mensajes Vite, sin errores.
- Screenshot de bloqueo en ventas:
  `C:\Dev\VentaMas\tmp-ventamas-sales-route-validation-2026-07-01.png`.
- Screenshot de bloqueo en preventas:
  `C:\Dev\VentaMas\tmp-ventamas-preorders-login-blocker-2026-07-01.png`.
- La pantalla de login se vio centrada y sin overflow visible en viewport
  desktop ancho; el flujo interno POS/preventas sigue pendiente por auth.

## Bloqueantes de release reproducible

### 1. Indice de Git no confiable

El indice actual mezcla cambios ajenos staged con cambios unstaged. No hacer
commit con el indice actual.

Ejemplos de alto riesgo:

- `functions/src/index.js` esta `MM`.
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts` esta `MM`.
- Hay cambios staged de contabilidad que no pertenecen al paquete minimo de
  venta/facturacion/inventario.

### 2. Archivos runtime criticos sin tracking

Estos archivos son necesarios para build/test/runtime o para cubrir el flujo, y
siguen `??`:

- `functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.js`
- `functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js`
- `src/domain/products/saleUnits.ts`
- `src/domain/products/saleUnits.test.ts`
- `src/modules/sales/pages/Sale/utils/saleUnitProductEntries.ts`
- `src/modules/sales/pages/Sale/utils/saleUnitProductEntries.test.ts`
- `src/modules/sales/pages/Sale/utils/saleBarcodeIndex.ts`
- `src/modules/sales/pages/Sale/utils/saleBarcodeIndex.test.ts`
- `src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/utils/stock.utils.test.ts`

Tambien son relevantes para fiscalidad/e-CF:

- `functions/src/app/modules/electronicTaxReceipts/utils/dominicanTaxId.util.js`
- `functions/src/app/modules/electronicTaxReceipts/utils/dominicanTaxId.util.test.js`
- `src/utils/fiscal/dominicanTaxId.ts`
- `src/utils/fiscal/dominicanTaxId.test.ts`

### 3. QA E2E de flujo completo pendiente

No cerrar Fase 8/9 como lista para produccion hasta ejecutar flujo controlado
de venta real en staging/local con:

- producto normal
- presentacion/saleUnit
- producto por peso
- stock insuficiente
- descuento/ITBIS/delivery/seguro
- anulacion
- nota de credito financiera

Brechas de reportes/export/impresion cerradas en esta ronda:

- `src/modules/invoice/printPagination/documentModel.ts`: impresion fiscal
  ahora usa `weightDetail.weight` para productos vendidos por peso, aunque
  `amountToBuy` venga como valor legacy `1`.
- `src/utils/export/excel/formatBill.ts`: export detallado ahora separa
  cantidad comercial, base de inventario, peso y presentacion.
- `src/utils/export/excel/formatCreditNote.ts`: export detallado de notas de
  credito ahora usa cantidad visible centralizada para peso y presentaciones.
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.ts`:
  el modelo de analytics ahora separa cantidad comercial, base, peso y
  presentacion en categorias/detalle de cliente.
- `src/modules/invoice/pages/InvoicesPage/SaleReportTable/SaleReportTable.tsx`:
  `CANT.` ahora usa cantidad visible facturada centralizada.
- `src/modules/invoice/pages/InvoicesPage/InvoicePreview/components/Products.tsx`:
  preview ahora usa cantidad visible facturada centralizada.

### 4. Typecheck app revalidado

En una corrida anterior `npm run typecheck:app` fallo por dos errores `TS2367`
en:

- `src/modules/accountsPayable/pages/AccountsPayable/components/AccountsPayablePaymentRunsModal.tsx:226`
- `src/modules/accountsPayable/pages/AccountsPayable/components/AccountsPayablePaymentRunsModal.tsx:227`

Revalidacion posterior: en el estado actual del worktree el gate vuelve a pasar
sin tocar CxP. No ampliar `ManageAccountsPayablePaymentRunAction` para incluir
`record_payment` o `void_payment`; esas acciones pertenecen a la bitacora de
eventos/pagos, no al callable de gestion de corridas.

### 5. Hallazgos residuales cerrados en subfase posterior

Archivos:

- `src/features/invoice/invoiceFormSlice.ts` y
  `src/features/invoice/invoiceFormSlice.test.ts`
- `src/modules/invoice/pages/InvoicesPage/components/InvoiceForm/components/Products/Products.tsx`
- `src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.tsx`
- `src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx`
- `src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.tsx`
- `src/modules/sales/pages/PreorderSale/components/PreSaleTable/preSaleTableRows.ts`
- `src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts`

Resultado:

- El formulario legacy `InvoiceForm` ya usa cantidad visible centralizada para
  leer/mostrar productos.
- Al editar una linea legacy por peso, actualiza `weightDetail.weight` y
  `baseQuantity`, manteniendo `amountToBuy` como compatibilidad.
- Al editar una presentacion legacy, recalcula `baseQuantity` con
  `conversionFactorToBase`.
- El legacy ya no mezcla el mismo producto vendido con distintas unidades de
  venta en una sola linea.
- Preventas ahora usan cantidad visible en la columna `Articulos` y en el modal.
- El modal de preventa muestra precio activo de `selectedSaleUnit` cuando aplica.

### 6. Gates de lint y build cerrados en subfase posterior

Archivos:

- `src/domain/products/normalization.ts`
- `src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.tsx`
- `src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.test.ts`
- `src/modules/dev/pages/DevTools/ProductStudio/components/sections/pricingSectionValidation.ts`
- `src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.tsx`
- `src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.test.ts`
- `src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.rules.ts`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/PriceAndSaleUnitsModal/PriceAndSaleUnitsModal.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.test.tsx`

Resultado:

- `lint:web` pasa.
- El input de peso ya no sincroniza estado derivado con `setState` dentro de
  `useEffect`; mantiene edicion local mientras esta enfocado y refleja cambios
  externos cuando no se esta editando.
- `PriceAndSaleUnitsModal` conserva memoizacion con dependencias primitivas.
- Helpers testeados de ProductStudio/ProductEditor se movieron fuera de archivos
  de componente para cumplir `react-refresh/only-export-components`.
- `npm run build:staging` pasa en el estado actual.

### 7. Hallazgos de subagentes cerrados en subfase posterior

Archivos:

- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js`
- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js`
- `src/utils/invoice/product.ts`
- `src/utils/invoice/product.test.ts`
- `src/utils/invoiceValidation.ts`
- `src/utils/invoiceValidation.test.ts`
- `src/services/invoice/autoCompletePreorderInvoice.ts`
- `src/modules/invoice/services/autoCompletePreorderInvoice.test.ts`
- `src/utils/export/excel/formatCreditNote.ts`
- `src/utils/export/excel/formatCreditNote.test.ts`
- `tools/release/verify-sale-release-package.ps1`

Resultado:

- `validateInvoiceCartAgainstCatalog` ahora devuelve `trustedCart`.
- El `trustedCart` fuerza `baseQuantity` y `selectedSaleUnit.conversionFactorToBase`
  desde catalogo, incluso cuando el payload omite `baseQuantity` o trae un
  factor cercano/manipulado.
- `createInvoiceV2` callable y HTTP pasan el carrito saneado a
  `createPendingInvoice`; el outbox de inventario queda alimentado por la
  linea confiable.
- La cantidad visible frontend ahora prioriza `amountToBuy.unit/value/quantity`
  para lineas con `selectedSaleUnit`, antes que `amountToBuy.total`.
- `validateInvoiceCart` y `autoCompletePreorderInvoice` ya no filtran con
  `Number(amountToBuy)`, evitando perder preventas con cantidades estructuradas.
- El export detallado de notas de credito usa la misma cantidad visible para
  no reportar peso como `1` ni presentaciones como cantidad base.
- Se agrego un verificador no destructivo de paquete de release que falla si el
  indice tiene staged fuera del manifiesto o archivos `MM/AM`.

### 8. Fase 3 parcial: fuente canonica de saleUnits en backend

Archivos:

- `functions/src/app/modules/Inventory/services/Inventory.service.js`
- `functions/scripts/backfillProductSaleUnitsCache.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.js`
- `functions/src/app/modules/invoice/utils/invoiceValidation.test.js`
- `functions/src/app/modules/products/utils/backfillProductSaleUnitsCache.script.test.js`
- `functions/src/app/modules/products/utils/saleUnitsCacheBackfill.util.js`
- `functions/src/app/modules/products/utils/saleUnitsCacheBackfill.util.test.js`
- `src/firebase/products/saleUnits/fbUpdateSaleUnit.ts`
- `src/firebase/products/saleUnits/fbUpdateSaleUnit.test.ts`

Decision actual:

- Para la ruta productiva actual, `products.saleUnits` queda tratado como la
  fuente canonica porque ProductEditor/ProductStudio crean y editan ese arreglo
  embebido, la lista de ventas genera tarjetas desde ese arreglo y el barcode
  principal indexa esas presentaciones.
- `products/{productId}/saleUnits` se mantiene como fallback legacy solo cuando
  el producto no trae `saleUnits` embebido.
- Si ambos existen y la subcoleccion esta vieja, el backend valida contra el
  embebido confiable del producto y no bloquea la venta por una subcoleccion
  stale.

Resultado:

- `validateInvoiceCartAgainstCatalog` ya no da mas peso a una subcoleccion
  legacy que al arreglo embebido usado por los flujos actuales.
- El `trustedCart` sigue forzando factor, precio, ITBIS y `baseQuantity` desde
  el catalogo server-side.
- Se conserva compatibilidad legacy: si `products.saleUnits` esta vacio y la
  subcoleccion tiene la presentacion, el backend la usa para validar.
- Se agrego un backfill no destructivo y dry-run por defecto para materializar
  `products.saleUnits` desde `products/{productId}/saleUnits` solo cuando el
  arreglo embebido esta vacio.
- El backfill no pisa `products.saleUnits` cuando ya existe; en ese caso solo
  puede reparar `saleUnitsCount` si esta desfasado respecto al arreglo canonico.
- `fbUpsetSaleUnits` y `fbDeleteSaleUnit` ya no dependen de incrementos de
  contador: despues de escribir/borrar en la subcoleccion vuelven a publicar
  `products.saleUnits` y `saleUnitsCount` completos desde la subcoleccion.
- Se corrigio un lint menor en `Inventory.service.js`: se elimino una
  desestructuracion muerta de `amountToBuy`; inventario ya usa
  `resolveInventoryBaseQuantity(prod)`.
- El script de backfill tiene cobertura directa: `dryRun: true` planifica sin
  llamar `product.ref.update`, `dryRun: false` escribe solo el patch planeado,
  y `productId` evita escanear toda la coleccion.
- `--limit` invalido ahora falla antes de inicializar Firestore para evitar un
  escaneo completo accidental.
- En modo `--write`, el script se detiene antes de cualquier escritura si el
  plan encuentra `invalidUnits` o `duplicateIds`; primero hay que revisar esos
  productos.
- `node functions/scripts/backfillProductSaleUnitsCache.js --help` arranca
  correctamente y confirma que `--dry-run` es el modo por defecto.

Riesgo restante:

- Falta ejecutar el backfill en dry-run contra el/los negocios reales cuando se
  confirme `businessId` antes de autorizar `--write`.
- Falta decidir si `fbUpsetSaleUnits` debe mantenerse como compatibilidad
  legacy o deprecarse despues del backfill.
- Fase 3 no queda cerrada al 100% hasta ejecutar ese dry-run, revisar el
  reporte de productos afectados y correr browser/E2E.

### 9. Riesgos criticos detectados por subagentes

Backend/CxC:

- Riesgo cerrado por backend en esta ronda:
  `accountsReceivable.totalReceivable` se recalcula server-side para
  `setupAR`, los pagos `creditNote` requieren detalle equivalente, y las notas
  duplicadas se agrupan antes de consumir saldo.
- Riesgo restante: falta E2E/browser con venta a credito parcial, venta con
  nota de credito y retry de outbox para confirmar UX, estados y datos reales.

Devoluciones/anulacion:

- Riesgo critico cerrado en modo seguro: `voidInvoiceFinancialDocument` ya no
  restaura solo `products.stock` cuando la factura tuvo inventario fisico pero
  no hay COGS detallado suficiente.
- Si la factura contiene inventario fisico, la anulacion automatica exige COGS
  posteado y lineas con `productId`, `productStockId`, `batchId` y cantidad; si
  falta ese detalle, falla con `failed-precondition` antes de escribir estado,
  stock agregado, `productsStock`, `batches`, COGS o auditoria.
- Riesgo restante: esto no implementa devolucion fisica parcial/total; solo
  evita una anulacion incompleta. Las facturas legacy sin COGS detallado
  requieren revision manual/backfill antes de anular.

Frontend/POS:

- Riesgo de descuentos individuales en productos por peso fue reproducido y
  corregido en esta ronda: subtotal, ITBIS, total y selector de descuento ahora
  usan peso vendido como cantidad comercial.
- Riesgo de multiples lineas por peso contra el mismo stock fisico fue cerrado
  en POS: tarjeta, escaneo, input editable y modal manual de lote/ubicacion
  acumulan consumo por `productId + productStockId + batchId` antes de permitir
  mas peso.
- Riesgo de unidad de peso desconocida en frontend fue cerrado con bloqueo
  temprano en `validateInvoiceCart`, guard final de `InvoicePanel` y conversion
  automatica de preventas antes de llamar `submitInvoice`.

## Paquete minimo recomendado

No ejecutar estos comandos sin decidir primero que se reconstruira el staging.
`git restore --staged -- .` solo cambia el indice; no borra el working tree.
Aunque no borra archivos, requiere autorizacion porque cambia que quedaria listo
para commit/release.

```powershell
Set-Location 'C:\Dev\VentaMas'

git restore --staged -- .

$saleReleaseFiles = @(
  'functions/src/app/modules/Inventory/services/Inventory.service.js',
  'functions/src/app/modules/Inventory/services/Inventory.service.test.js',
  'functions/src/app/modules/Inventory/services/getInventory.service.js',
  'functions/src/app/modules/Inventory/services/getInventory.service.test.js',
  'functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.js',
  'functions/src/app/modules/Inventory/utils/saleUnitQuantity.util.test.js',
  'functions/src/app/modules/Inventory/utils/weightUnit.util.js',
  'functions/src/app/modules/Inventory/utils/weightUnit.util.test.js',
  'functions/src/app/modules/invoice/utils/invoicePayment.util.js',
  'functions/src/app/versions/v2/invoice/services/creditNotes.service.js',
  'functions/src/app/versions/v2/invoice/services/creditNotes.service.test.js',
  'functions/src/app/modules/products/functions/createProduct.js',
  'functions/src/app/modules/products/functions/createProduct.test.js',
  'functions/src/app/modules/products/utils/backfillProductSaleUnitsCache.script.test.js',
  'functions/src/app/modules/products/utils/saleUnitsCacheBackfill.util.js',
  'functions/src/app/modules/products/utils/saleUnitsCacheBackfill.util.test.js',
  'functions/scripts/backfillProductSaleUnitsCache.js',
  'functions/src/app/modules/invoice/utils/invoiceValidation.js',
  'functions/src/app/modules/invoice/utils/invoiceValidation.test.js',
  'functions/src/app/modules/invoice/services/invoice.service.js',
  'functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js',
  'functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.test.js',
  'functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js',
  'functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.test.js',
  'functions/src/app/versions/v2/invoice/services/finalize.service.js',
  'functions/src/app/versions/v2/invoice/services/finalize.service.test.js',
  'functions/src/app/versions/v2/invoice/services/orchestrator.service.js',
  'functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js',
  'functions/src/app/versions/v2/invoice/triggers/outbox.worker.js',
  'functions/src/app/versions/v2/invoice/triggers/outbox.worker.test.js',
  'functions/src/app/modules/invoice/functions/invoiceLifecycle.js',
  'functions/src/app/modules/invoice/functions/invoiceLifecycle.test.js',
  'functions/src/app/modules/accountReceivable/functions/customerCreditNotes.js',
  'functions/src/app/modules/accountReceivable/functions/customerCreditNotes.test.js',
  'src/domain/products/normalization.ts',
  'src/domain/products/priceInputFocus.ts',
  'src/domain/products/pricingForm.ts',
  'src/domain/products/pricingForm.test.ts',
  'src/domain/products/saleUnits.ts',
  'src/domain/products/saleUnits.test.ts',
  'src/domain/products/weightUnits.ts',
  'src/domain/products/weightUnits.test.ts',
  'src/domain/products/weightPriceDisplay.ts',
  'src/domain/products/weightPriceDisplay.test.ts',
  'src/features/cart/cartSlice.ts',
  'src/features/cart/cartSlice.test.ts',
  'src/features/cart/types.ts',
  'src/features/cart/utils/updateAllTotals.test.ts',
  'src/features/invoice/invoiceFormSlice.ts',
  'src/features/invoice/invoiceFormSlice.test.ts',
  'src/firebase/products/fbAddProducts.ts',
  'src/firebase/products/fbAddProducts.test.ts',
  'src/firebase/products/fbGetProduct.ts',
  'src/firebase/products/fbGetProducts.ts',
  'src/firebase/products/fbUpdateProduct.ts',
  'src/firebase/products/fbUpdateProduct.test.ts',
  'src/firebase/products/saleUnits/fbUpdateSaleUnit.ts',
  'src/firebase/products/saleUnits/fbUpdateSaleUnit.test.ts',
  'src/firebase/warehouse/productStockService.ts',
  'src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.tsx',
  'src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductBatchModal/ProductBatchModal.test.tsx',
  'src/modules/sales/pages/Sale/Sale.tsx',
  'src/modules/sales/pages/Sale/hooks/useSellableStockAvailability.ts',
  'src/modules/sales/pages/Sale/utils/cartPhysicalStockUsage.ts',
  'src/modules/sales/pages/Sale/utils/cartPhysicalStockUsage.test.ts',
  'src/modules/sales/pages/Sale/utils/saleUnitProductEntries.ts',
  'src/modules/sales/pages/Sale/utils/saleUnitProductEntries.test.ts',
  'src/modules/sales/pages/Sale/utils/saleBarcodeIndex.ts',
  'src/modules/sales/pages/Sale/utils/saleBarcodeIndex.test.ts',
  'src/modules/sales/pages/Sale/utils/sellableStockAvailability.ts',
  'src/modules/sales/pages/Sale/utils/sellableStockAvailability.test.ts',
  'src/modules/sales/pages/Sale/utils/productStockSelection.ts',
  'src/modules/sales/pages/Sale/utils/productStockSelection.test.ts',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/Product.tsx',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/components/ProductFooter.tsx',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/components/ProductHeader.tsx',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/hooks/useProductCartAndStock.tsx',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/hooks/useProductHandling.tsx',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/utils/stock.utils.ts',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductCard/Product/utils/stock.utils.test.ts',
  'src/modules/sales/pages/Sale/components/ProductControl/components/ProductList.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/getInvoiceErrorNotification.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.test.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/validateInvoiceSubmissionGuards.test.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductsList/ProductsList.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/CartQuantityCounter/CartQuantityCounter.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/CartQuantityCounter/CartQuantityCounter.helpers.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/CartQuantityCounter/CartQuantityCounter.helpers.test.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/PriceEditor/PriceEditor.tsx',
  'src/types/invoice.ts',
  'src/types/products.ts',
  'src/utils/pricing.ts',
  'src/utils/pricing.test.ts',
  'src/utils/invoiceValidation.ts',
  'src/utils/invoiceValidation.test.ts',
  'src/utils/fiscal/dominicanTaxId.ts',
  'src/utils/fiscal/dominicanTaxId.test.ts',
  'src/utils/invoice/amount.ts',
  'src/utils/invoice/product.ts',
  'src/utils/invoice/product.test.ts',
  'src/services/invoice/autoCompletePreorderInvoice.ts',
  'src/modules/invoice/services/autoCompletePreorderInvoice.test.ts',
  'src/modules/invoice/pages/InvoicesPage/SaleReportTable/SaleReportTable.tsx',
  'src/modules/invoice/pages/InvoicesPage/InvoicePreview/components/Products.tsx',
  'src/modules/invoice/pages/InvoicesPage/components/InvoiceForm/components/Products/Products.tsx',
  'src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.ts',
  'src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceEdit.test.ts',
  'src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/utils/invoiceWorkspaceFormat.ts',
  'src/modules/invoice/pages/InvoicesPage/InvoiceWorkspaceModal/components/InvoiceWorkspaceProducts.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.ts',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/utils/quantity.test.ts',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/CreditNoteModal.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/CreditNoteQuantityControl.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductCard.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/components/ProductList.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteColumns.tsx',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.ts',
  'src/modules/invoice/pages/CreditNote/components/CreditNoteModal/hooks/useCreditNoteSelection.helpers.test.ts',
  'src/modules/invoice/printPagination/documentModel.ts',
  'src/modules/invoice/printPagination/documentModel.test.ts',
  'src/pdf/invoicesAndQuotation/utils/formatters.ts',
  'src/pdf/invoicesAndQuotation/utils/formatters.test.ts',
  'src/pdf/invoicesAndQuotation/invoices/templates/template2/builders/content.ts',
  'src/pdf/invoicesAndQuotation/quotations/templates/template2/builders/content.ts',
  'src/pdf/invoicesAndQuotation/invoices/templates/template2-v2/InvoiceLetterDocument.tsx',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2/components/Content/index.tsx',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate3/components/Content/index.tsx',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.ts',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/utils/index.test.ts',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.ts',
  'src/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3_1/utils/index.test.ts',
  'src/utils/export/excel/formatBill.ts',
  'src/utils/export/excel/formatBill.test.ts',
  'src/utils/export/excel/formatCreditNote.ts',
  'src/utils/export/excel/formatCreditNote.test.ts',
  'src/utils/export/excel/exportConfig.ts',
  'src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.ts',
  'src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/analyticsSummary.test.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.tsx',
  'src/modules/dev/pages/DevTools/ProductStudio/components/sections/PricingSection.test.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/components/sections/pricingSectionValidation.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/ProductStudio.tsx',
  'src/modules/dev/pages/DevTools/ProductStudio/components/form/ProductForm.tsx',
  'src/modules/dev/pages/DevTools/ProductStudio/components/sections/SaleUnitsSection.tsx',
  'src/modules/dev/pages/DevTools/ProductStudio/hooks/useProductStudioController.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/utils/productStudioForm.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/utils/productStudioForm.test.ts',
  'src/modules/dev/pages/DevTools/ProductStudio/utils/sections.ts',
  'src/modules/products/components/ProductEditorModal/components/General/General.tsx',
  'src/modules/products/components/ProductEditorModal/components/General/hooks/useGeneralProductForm.tsx',
  'src/modules/products/components/ProductEditorModal/components/General/hooks/useGeneralProductForm.helpers.ts',
  'src/modules/products/components/ProductEditorModal/components/General/hooks/useGeneralProductForm.helpers.test.ts',
  'src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.tsx',
  'src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.test.ts',
  'src/modules/products/components/ProductEditorModal/components/sections/PriceCalculator.rules.ts',
  'src/modules/products/components/ProductEditorModal/components/sections/SaleUnitsInfo.tsx',
  'src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.tsx',
  'src/modules/sales/pages/PreorderSale/components/PreSaleTable/preSaleTableRows.ts',
  'src/modules/sales/pages/PreorderSale/components/PreSaleTable/PreSaleTable.test.ts',
  'src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.tsx',
  'src/modules/sales/pages/PreorderSale/components/PreorderModal/PreorderModal.test.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/PriceAndSaleUnitsModal/PriceAndSaleUnitsModal.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.test.tsx',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.ts',
  'src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/WeightInput/WeightInput.helpers.test.ts',
  'docs/audits/venta-facturacion-inventario-release-checklist-2026-06-30.md',
  'tools/release/verify-sale-release-package.ps1'
)

git add -- $saleReleaseFiles
git -c color.ui=false diff --cached --name-status
git -c color.ui=false diff --cached --check
```

Si `functions/src/index.js` o `submitInvoicePanel.ts` deben entrar, revisar con:

```powershell
git diff --cached -- functions/src/index.js
git diff -- functions/src/index.js
git diff --cached -- src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts
git diff -- src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts
```

## Deploy sugerido, no ejecutado

No desplegar hasta que el paquete este aislado y validado.

Funciones probablemente impactadas por este paquete:

```powershell
firebase deploy --only "functions:createInvoiceV2"
firebase deploy --only "functions:createInvoiceV2Http"
firebase deploy --only "functions:processInvoiceOutbox"
firebase deploy --only "functions:updateInvoiceFinancialDocument"
firebase deploy --only "functions:voidInvoiceFinancialDocument"
firebase deploy --only "functions:createCustomerCreditNote"
firebase deploy --only "functions:updateCustomerCreditNote"
firebase deploy --only "functions:applyCustomerCreditNotes"
firebase deploy --only "functions:createProduct"
```

Camino preferido del repo, si se autoriza deploy staging:

```powershell
npm run deploy -- staging:functions createInvoiceV2,createInvoiceV2Http,processInvoiceOutbox,updateInvoiceFinancialDocument,voidInvoiceFinancialDocument,createCustomerCreditNote,updateCustomerCreditNote,applyCustomerCreditNotes,createProduct --dry-run
```

Luego, solo si el dry-run y validaciones pasan, ejecutar sin `--dry-run`.

## Checklist predeploy

- [ ] Aislar staging selectivo y confirmar que no incluye contabilidad/CxP ajena.
- [ ] Confirmar que `functions/src/index.js` no queda `MM`.
- [ ] Confirmar que todos los archivos runtime criticos dejan de estar `??`.
- [ ] Correr gates focales de Functions y frontend.
- [ ] Correr `npm --prefix functions run build`.
- [ ] Correr `npm run typecheck:app`.
- [ ] Correr `npm run build:staging`.
- [ ] Validar flujo en navegador integrado:
  - producto normal x3
  - caja x12 x2
  - media caja
  - peso 2.5
  - stock insuficiente con `restrictSaleWithoutStock`
  - descuento + ITBIS + delivery + seguro
  - anulacion
  - nota de credito financiera
- [ ] Revisar consola, network, loading/empty/error y responsive.
- [ ] Descargar o inspeccionar factura/preview/impresion/export si entra Fase 7.

## Checklist postdeploy

- [ ] Crear venta smoke en staging.
- [ ] Confirmar `invoicesV2/{invoiceId}` y factura canonica.
- [ ] Confirmar tarea `updateInventory` en `done`.
- [ ] Confirmar movement/backorder/COGS sin duplicados en retry.
- [ ] Confirmar stock/productStock/batch con cantidad base esperada.
- [ ] Confirmar nota de credito financiera sin movimiento de inventario.
- [ ] Revisar logs de `createInvoiceV2`, `processInvoiceOutbox` y notas de credito.

## Rollback

- No hay rollback automatico preparado para datos de inventario ya escritos.
- Para codigo, revertir el commit del paquete aislado y redeployar solo las
  funciones afectadas.
- Para datos, usar repair/manual audit segun invoiceId/movementId/backOrderId.
- No ejecutar scripts de reparacion masivos sin snapshot previo y dry-run.

## Proxima fase recomendada

Antes de release: aislar paquete y limpiar el indice.

Luego:

1. Ejecutar Fase 3 operativa: dry-run real del backfill `products.saleUnits`
   por negocio, revisar reporte y solo luego autorizar `--write`.
2. Fase 4: moneda mixta/tasas server-owned.
3. Fase 5: devolucion fisica real.
4. Fase 6: conversion kg/lb/oz cerrada en backend y POS para cantidad base,
   unidad server-owned, error temprano de unidad desconocida y consumo
   acumulado por stock fisico; falta E2E/browser autenticado con datos reales.
5. Fase 7: reportes/export/impresion con metricas separadas.
6. Fase 8: QA E2E/browser.
7. Fase 9: release final.

## Resumen para ChatGPT

1. Fase trabajada: Fase 2 + auditoria de release, con cierres parciales de
   Fase 3 y Fase 4.
2. Objetivo: cerrar riesgos criticos inmediatos sin deploy.
3. Que se cambio: notas de credito financieras blindadas, catalogo inactivo
   rechazado, `baseQuantity` manipulada rechazada, test outbox idempotente,
   impresion fiscal por peso corregida, export detallado con cantidades
   separadas, export detallado de notas de credito con cantidad visible,
   analytics con cantidades separadas en el modelo, workspace de
   facturas editadas con cantidad por peso/presentacion corregida, notas de
   credito parciales por peso/fraccionarias corregidas, y plantillas PDF
   alineadas con cantidad visible centralizada; luego se cerro cantidad por
   peso/presentacion en `InvoiceForm` legacy y preventas; despues se definio
   `products.saleUnits` embebido como fuente canonica backend para la ruta
   actual y la subcoleccion como fallback legacy; luego se cerro el riesgo CxC
   de `totalReceivable` cliente-owned y el pago con notas de credito sin detalle
   equivalente; tambien se endurecio el backfill legacy de `saleUnitsCache` y
   se cerro la confianza directa en `cart.monetary` cliente-owned para el
   snapshot monetario contable; despues se endurecio peso para que nuevas
   facturas solo acepten unidades soportadas, la unidad de peso venga del
   catalogo y `adjustProductInventory` bloquee unidades desconocidas antes de
   escribir inventario; despues se cerro en POS el consumo acumulado de
   multiples lineas por peso contra el mismo stock fisico y el error temprano
   de unidad de peso desconocida, incluyendo auto-completado de preventas.
4. Archivos modificados: `customerCreditNotes.js/test`, `invoiceValidation.js/test`,
   `invoiceLifecycle.js/test`, `outbox.worker.test.js`, `documentModel.ts/test`, `formatBill.ts/test`,
   `formatCreditNote.ts/test`,
   `exportConfig.ts`, `analyticsSummary.ts/test`, helpers de `InvoiceWorkspace`,
   helpers/componentes de `CreditNoteModal`, `formatters.ts/test` de PDF y
   plantillas `InvoiceTemplate2`, `InvoiceTemplate3`, `InvoiceTemplate2V3` y
   `InvoiceTemplate2V3_1`, `invoiceFormSlice.ts/test`, productos del
   `InvoiceForm` legacy y `PreorderModal`/`PreSaleTable` con tests.
5. Pruebas ejecutadas: focales, gate Functions 101, gate frontend 35,
   arquitectura Functions, build Functions, typecheck app, build staging,
   `lint:web`, `lint:styles` y validacion navegador en `/bills`; ademas,
   bateria focal actual de 10 archivos/53 tests, 14 archivos/63 tests y
   revalidacion ampliada de 19 archivos/81 tests; luego export de notas de
   credito con 4 archivos/21 tests y foco export/invoice con 5 archivos/22 tests;
   Fase 3 parcial con `invoiceValidation` 30 tests, backend focal 6 archivos/63
   tests, backfill saleUnits 2 archivos/10 tests y build Functions; CxC/notas
   con 3 archivos/63 tests, entrypoints con 5 archivos/70 tests, lint Functions
   y build Functions; moneda/snapshot con 3 archivos/60 tests, entrypoints con
   6 archivos/79 tests, lint focal y build Functions; anulacion fisica segura
   con 1 archivo/7 tests, bateria anulacion/notas 4 archivos/39 tests, lint
   focal y build Functions; Fase 6 peso/unidades con 3 archivos/61 tests,
   bateria ampliada 9 archivos/109 tests, lint Functions y build Functions.
   UX/POS de peso acumulado con 9 archivos/57 tests, `typecheck:app`, lint
   focal y `build:staging`; error temprano de unidad de peso con 4 archivos/33
   tests, lint focal y `typecheck:app`; fiscalidad cliente POS/GISYS con
   3 archivos/39 tests, lint focal y `typecheck:app`.
6. Resultado: pruebas focales verdes; `lint:web`, `typecheck:app`,
   `lint:styles`, build Functions y `build:staging` verdes en el estado actual.
7. Bugs encontrados: bypass de devolucion fisica en update, catalogo inactivo
   aceptable, `baseQuantity` snapshot manipulable, release package no reproducible.
8. Bugs corregidos: los tres primeros y brechas de cantidad visible en reportes,
   preview, workspace, nota de credito, plantillas de impresion/PDF,
   `InvoiceForm` legacy, preventas, `totalReceivable` cliente-owned en ventas a
   credito, pago `creditNote` sin `creditNotePayment` equivalente, duplicados
   de la misma nota antes de consumir saldo, `cart.monetary` cliente-owned como
   fuente preferida del canonico, `documentCurrency` distinta de la moneda
   funcional server-owned sin rechazo temprano, `functionalCurrency`
   cliente-owned usada como moneda permitida de validacion, fallback de
   outbox a `cart.monetary` cuando faltaba `invoice.snapshot.monetary`, y
   anulacion automatica que podia restaurar solo `products.stock` sin
   `productsStock`/`batches` cuando faltaba COGS detallado, unidad de peso
   cliente-owned en facturas nuevas, catalogo por peso sin unidad confiable y
   mutador de inventario aceptando unidad desconocida si se invocaba fuera del
   borde V2, POS que subcontaba multiples lineas por peso del mismo
   `productStockId/batchId`, y POS/preventa automatica que podia esperar al
   backend para rechazar una unidad de peso desconocida, y comprobantes
   detallados que podian llegar a emision con RNC/cedula invalido o con rechazo
   GISYS sin accion directa de correccion del cliente.
9. Riesgos que quedan: release verifier sigue en rojo por staged fuera del
   manifiesto, 12 archivos `MM/AM`, 376 cambios fuera del paquete, runtime
   untracked, validacion visual autenticada de `/sales` y `/preorders` pendiente
   por sesion, E2E completo de venta normal/presentacion/peso pendiente antes de
   release, E2E de CxC/notas de credito pendiente antes de produccion, dry-run
   real de backfill saleUnits legacy pendiente por `businessId`, devolucion
   fisica completa pendiente de diseno/implementacion, facturas legacy sin COGS
   detallado pendientes de revision manual/backfill, y moneda extranjera/mixta
   real pendiente hasta tasas server-owned end-to-end.
10. Decisiones pendientes: paquete release selectivo, `businessId` para dry-run
    real de backfill saleUnits legacy, moneda mixta/tasas server-owned y
    devolucion fisica.
11. Proxima fase recomendada: aislar release package, despues ejecutar dry-run
    real de Fase 3, validar CxC/nota de credito en navegador/datos reales,
    completar E2E autenticado de peso/presentacion, y disenar soporte de moneda
    extranjera solo con tasas server-owned.
12. Preguntas: autorizar reconstruccion del indice y dry-run de backfill
    saleUnits?
