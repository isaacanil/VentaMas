# Implementacion: facturacion USD nativa

Estado: `PENDING`

Relacionado con:

- `README.md`
- `etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`

## Objetivo

Convertir la etapa de `productos/precios por moneda` en un plan tecnico accionable para habilitar facturacion nativa en `USD` solo para el piloto, sin romper la facturacion actual en `DOP` y sin emitir documentos monetariamente falsos.

## Decision tecnica cerrada

Se elige `USD nativo en factura`, no `conversion tardia al emitir`.

Razon:

- el carrito actual calcula sus importes en una sola moneda implicita
- re-etiquetar una venta `DOP` como `USD` seria economicamente incorrecto
- la complejidad esencial del problema exige que lineas, subtotal, impuestos, total y pagos visibles signifiquen `USD` de verdad cuando el documento es `USD`

## Estado actual del repo

Puntos confirmados:

- `cart` no tiene `documentCurrency` ni `exchangeRate` operativos en `src/features/cart/types.ts`
- los calculos de linea/totales operan sobre `pricing.price` sin moneda estructurada en `src/utils/pricing.ts`
- `updateAllTotals` recalcula subtotal/impuestos/total/pago/cambio sin nocion de moneda en `src/features/cart/utils/updateAllTotals.ts`
- `ProductPricing` hoy es numerico y sin moneda en `src/types/products.ts`
- la normalizacion de producto persiste precios/costos simples en `src/utils/products/normalization.ts`
- la emision de factura ya sabe guardar `monetary` si el documento realmente llega en `USD`, en `src/services/invoice/invoice.service.ts`
- el selector UI actual de moneda esta bloqueado a proposito hasta que el carrito capture importes reales en `USD`

## Alcance

Incluye:

- carrito con moneda documental real
- origen de precio documental por producto
- resumen/pagos/PDF alineados con la moneda documental
- rollout solo para `X63aIFwHzk3r0gmT8w6P`

No incluye:

- compras/gastos/CxC en `USD` desde UI
- reportes multi-moneda
- repricing masivo productivo
- cambio de moneda funcional base

## Alternativas consideradas

### Opcion recomendada: precio documental resuelto al entrar al carrito

Cada producto entra al carrito con un precio documental ya resuelto segun la moneda de la factura.

Ventajas:

- separa mejor producto/catalogo de venta/documento
- mantiene el calculo del carrito deterministico
- evita conversion silenciosa al final

Costo:

- obliga a extender `cart`, `pricing`, `PriceEditor`, resumen y PDF
- exige que el producto tenga precio base `USD` real antes de entrar a una factura `USD`

### Opcion descartada: convertir al emitir

Se descarta porque introduce complejidad accidental:

- el carrito seguiria en `DOP`
- el PDF/documento final podria decir `USD`
- descuentos, impuestos y pagos quedarian ambiguos
- abriria una segunda semantica de precio sin evidencia estable en producto

Decision cerrada:

- para el piloto, `USD` solo se habilita cuando el producto tenga precio base `USD` real
- la conversion explicita `DOP -> USD` al entrar al carrito no se toma como camino operativo inicial

## Contrato minimo nuevo

### En producto

Sin romper el contrato legacy, introducir capacidad futura de referencia base:

```json
{
  "pricing": {
    "currency": "DOP",
    "cost": 580,
    "price": 850,
    "listPrice": 850,
    "cardPrice": 875,
    "offerPrice": 0
  },
  "pricingPolicy": {
    "baseCurrency": "USD",
    "baseCost": 9.75,
    "basePrice": 14.5,
    "baseListPrice": 14.5,
    "conversionMode": "materialized"
  }
}
```

### En item del carrito

Agregar un contrato operativo explicito por documento:

```json
{
  "documentCurrency": "USD",
  "exchangeRate": 59.25,
  "pricing": {
    "currency": "USD",
    "price": 14.5,
    "listPrice": 14.5,
    "tax": 18
  },
  "pricingSource": {
    "mode": "base-price",
    "baseCurrency": "USD"
  }
}
```

Regla:

- el item del carrito debe llevar el precio ya expresado en la moneda documental
- `pricingSource` solo explica de donde salio el valor

Regla de precedencia:

- si la unidad de venta o variante seleccionada tiene precio base `USD`, esa definicion gana
- si la unidad o variante activa no tiene precio base `USD`, se consulta el producto root solo si el contrato del catalogo lo habilita
- si no existe precio base `USD` aplicable, el item no puede entrar a una factura `USD`

## Fases de implementacion por archivos

## Fase A - contratos y estado del carrito

Objetivo: introducir moneda documental sin tocar todavia la experiencia completa.

Archivos principales:

- `src/features/cart/types.ts`
- `src/features/cart/default/default.ts`
- `src/features/cart/cartSlice.ts`
- `src/app/middleware/cartTotalsListener.ts`
- `src/utils/accounting/monetary.ts`

Cambio esperado:

- agregar a `CartData`:
  - `documentCurrency?: 'DOP' | 'USD'`
  - `exchangeRate?: number | null`
  - `rateOverride?: { value: number; reason?: string } | null`
- agregar a `Product.pricing` el campo `currency?: 'DOP' | 'USD'`
- crear accion explicita para cambiar la moneda documental del carrito
- al cambiar moneda, disparar recalculo total del carrito

Riesgo:

- medio; toca estado global del POS

## Fase B - origen del precio documental por producto

Objetivo: definir como un producto se agrega al carrito en `DOP` o `USD`.

Archivos principales:

- `src/types/products.ts`
- `src/utils/products/normalization.ts`
- `src/components/ui/Product/Product/hooks/useProductHandling.tsx`
- `src/components/ui/Product/Product/hooks/useProductCartAndStock.tsx`
- `src/features/cart/cartSlice.ts`

Cambio esperado:

- extender `ProductPricing` con `currency`
- permitir `pricingPolicy` o contrato equivalente de precio/costo base
- al agregar producto al carrito, resolver `pricing.price` segun `documentCurrency`
- si el producto no tiene base `USD`, bloquear su uso en factura `USD`
- si la factura esta en `USD`, el catalogo debe filtrar o bloquear productos no elegibles antes de agregarlos al carrito
- documentar la precedencia entre unidad/variante y producto root para resolver el precio base `USD`

Riesgo:

- alto; aqui vive la decision economica real del documento

## Fase C - motor de calculo del carrito

Objetivo: hacer que subtotal, impuestos, total, descuentos y cambio se calculen en la moneda documental.

Archivos principales:

- `src/utils/pricing.ts`
- `src/features/cart/utils/updateAllTotals.ts`
- `src/features/cart/cartSlice.ts`

Cambio esperado:

- todas las funciones de precio deben respetar `product.pricing.currency`
- `updateAllTotals` debe preservar consistencia entre:
  - `totalPurchaseWithoutTaxes`
  - `totalTaxes`
  - `totalPurchase`
  - `payment`
  - `change`
- redondeo centralizado por moneda

Decision operativa:

- en esta fase solo soportar `DOP` y `USD`
- precision por defecto a 2 decimales para ambas monedas en venta

Riesgo:

- alto; cualquier error aqui rompe importes del POS

## Fase D - UI de venta y edicion de precio

Objetivo: que el usuario vea y edite montos en la moneda documental real.

Archivos principales:

- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/components/PriceEditor/PriceEditor.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/ProductCardForCart/ProductCardForCart.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/PaymentSummary/PaymentSummary.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/PaymentMethods/PaymentMethods.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/CreditSelector/CreditSelector.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ChargedSection/ChargedSection.tsx`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/DocumentCurrencySelector/*`

Cambio esperado:

- mostrar `DOP` o `USD` de forma consistente
- si el carrito esta en `USD`, el editor de precio debe editar `USD`
- pagos y faltante deben operar en la misma moneda documental
- el selector de moneda solo se desbloquea cuando las fases B y C esten completas

Riesgo:

- medio; mucho impacto visual, pero acotado al piloto

## Fase E - payload de factura y snapshot monetario

Objetivo: enviar un documento ya coherente al backend.

Archivos principales:

- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/submitInvoicePanel.ts`
- `src/services/invoice/useInvoice.ts`
- `src/services/invoice/invoice.service.ts`

Cambio esperado:

- `cart.documentCurrency` y `cart.exchangeRate` ya no son metadata decorativa; forman parte del documento operativo
- `buildInvoiceRequestPayload` sigue resolviendo `monetary`, pero ahora desde un carrito que ya viene coherente
- mantener bloqueo de rollout por `businessId`

Riesgo:

- medio; el backend ya esta relativamente preparado

## Fase F - PDF e impresion

Objetivo: que el documento visible emitido coincida con la moneda del carrito y del snapshot.

Archivos principales:

- `src/firebase/quotation/downloadQuotationPDF.ts`
- `src/pdf/invoicesAndQuotation/types.ts`
- `src/pdf/invoicesAndQuotation/invoices/templates/template2/utils/formatters.ts`
- `src/pdf/invoicesAndQuotation/invoices/templates/template2/builders/*`
- `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/utils/processInvoicePrint.ts`

Cambio esperado:

- encabezado, lineas y totales deben mostrar la moneda documental
- no imprimir una factura `USD` con simbolos/formato de `DOP`

Riesgo:

- medio; no debe alterar la emision DOP existente

## Rollout recomendado

1. Contratos del carrito y producto.
2. Resolucion de precio documental al agregar producto.
3. Calculo correcto de totales.
4. UI de venta y pagos.
5. Payload + snapshot.
6. PDF.
7. Desbloqueo controlado de `USD` solo para el piloto.

## Validacion minima

- venta `DOP` sigue funcionando sin cambios
- venta `USD` con producto base `USD`
- producto solo `DOP` bloqueado o filtrado en factura `USD`
- venta `USD` con impuesto
- venta `USD` con descuento individual
- venta `USD` a credito
- unidad de venta con precio base `USD` toma precedencia sobre producto root
- PDF `USD` consistente con la UI
- `/dev/tools/accounting-pilot-audit` muestra:
  - `documentCurrency = USD`
  - `functionalCurrency = DOP`
  - `rate = tasa del documento`

## Criterio de salida

La implementacion queda lista cuando:

- el carrito tiene moneda documental real
- el precio documental no se inventa al final
- la factura `USD` es coherente en UI, payload, persistencia y PDF
- el fallback actual `DOP -> DOP` sigue intacto para negocios fuera del piloto
