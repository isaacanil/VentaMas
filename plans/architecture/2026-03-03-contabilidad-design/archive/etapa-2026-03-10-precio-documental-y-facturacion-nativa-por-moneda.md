# Etapa: precio documental y facturacion nativa por moneda

Estado: `PENDING`

Motivo:

- El plan principal ya menciona productos/precios por moneda como extension futura.
- El backlog y checklist todavia no lo bajan a una etapa concreta.
- Antes de habilitar facturacion nativa en `USD`, hace falta cerrar el contrato de precio documental y el origen real de los importes del carrito.

## Estado en el roadmap

Esta etapa es un prerequisito explicito para habilitar facturacion nativa en `USD`.

Mientras esta etapa no este completada:

- `USD` puede existir en configuracion monetaria
- `USD` puede existir en snapshots y contratos
- pero no debe desbloquearse la emision operativa normal de facturas `USD`

## Objetivo

Definir la etapa previa necesaria para soportar documentos operativos en `USD` sin mentir sobre los montos del documento y sin recalcular precios de forma silenciosa en tiempo de lectura.

Esta etapa existe para evitar el error de "re-etiquetar" una venta en `DOP` como si fuera `USD`.

## Decision de arquitectura

- `DOP` sigue siendo la moneda funcional/base del negocio.
- El documento operativo puede emitirse en `DOP` o `USD`.
- Si un documento se emite en `USD`, sus lineas, subtotal, impuestos, descuentos, total y pagos visibles deben significar `USD` de verdad.
- El snapshot `monetary` sigue guardando:
  - `documentTotals` en moneda documental
  - `functionalTotals` en `DOP`
  - tasa historica exacta
- Los productos no deben recalcularse "al vuelo" en cada lectura por cambio de tasa.
- El repricing por cambio de tasa debe ser un proceso explicito/manual.

## Alcance de la etapa

Incluye:

- cerrar el contrato de precio/costo por moneda para producto
- definir como se resuelve el precio documental al entrar al carrito
- permitir que el carrito opere en `DOP` o `USD`
- alinear resumen, impuestos, pagos y PDF con la moneda documental

No incluye:

- rehacer compras, gastos o pagos CxC en UI
- reportes globales multi-moneda
- journal contable completo
- motor FX libre entre pares

## Contrato recomendado para producto

Mientras siga existiendo compatibilidad legacy, el producto puede convivir con dos capas:

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
    "conversionMode": "materialized",
    "lastRepricedAt": "2026-03-10T00:00:00.000Z"
  }
}
```

Lectura correcta:

- `pricing.*` sigue siendo el valor materializado operativo.
- `pricing.currency` indica en que moneda estan esos valores operativos.
- `pricingPolicy.baseCurrency` y `base*` guardan la referencia economica original si el negocio trabaja base `USD`.
- Si un negocio no usa base `USD`, `pricingPolicy` puede omitirse.

## Regla de origen del precio documental

Para facturacion nativa en `USD`, el carrito no debe inventar el valor documental al final.

Decision cerrada:

- `USD` solo se permite si existe precio base `USD` real para el producto o la unidad de venta.
- No se habilita, en esta etapa, la conversion explicita `DOP -> USD` al entrar al carrito como camino operativo normal.
- Si un producto no tiene precio base `USD`, no debe agregarse a una factura `USD`.
- Si el documento esta en `USD`, el catalogo debe filtrar o bloquear productos no elegibles para `USD` antes de agregarlos al carrito.

La regla operativa es:

1. El producto entra al carrito con un precio documental ya resuelto.
2. Ese precio depende de `documentCurrency`.
3. Si `documentCurrency = DOP`, se usa el precio operativo materializado en `DOP`.
4. Si `documentCurrency = USD`, se usa el precio base `USD` real del producto o de la unidad de venta.
5. Una vez agregado al carrito, los totales y pagos trabajan en la misma moneda documental.

## Regla de precedencia para producto, unidad y variacion

Para evitar ambiguedad de data model:

- si existe una unidad de venta o variante seleccionable con precio base `USD`, esa definicion gana sobre el producto root
- si no existe precio base `USD` en la unidad o variante activa, se puede usar el precio base `USD` del producto root solo si el contrato del producto lo permite explicitamente
- si ni la unidad/variante activa ni el producto root tienen precio base `USD`, el item queda no elegible para factura `USD`

Regla practica:

- la elegibilidad `USD` debe resolverse con la misma seleccion de unidad/variante que llega al carrito
- no se permite mezclar una unidad en `DOP` con una factura documental en `USD`

## Cambios de implementacion esperados

### Estado del carrito

- agregar `documentCurrency`
- agregar `exchangeRate`
- agregar metadata de `rateOverride` cuando aplique
- recalcular lineas/totales en la moneda documental

### Catalogo / producto

- agregar `pricing.currency`
- definir si el producto tendra `pricingPolicy.baseCurrency`
- definir proceso de repricing manual para actualizar valores materializados

### Facturacion

- el selector de moneda no puede desbloquear `USD` hasta que el carrito trabaje importes reales en `USD`
- `InvoiceSummary`, `PaymentSummary`, `PriceEditor`, `CreditSelector` y PDF deben reflejar la moneda documental
- el catalogo debe filtrar o bloquear productos no elegibles cuando la factura este en `USD`

## Dependencias

- `businesses/{businessId}/settings/accounting`
- contrato compartido `monetary`
- soporte de `USD -> DOP` con snapshot historico

## Riesgos que esta etapa reduce

- emitir una factura marcada `USD` con montos realmente calculados en `DOP`
- inconsistencias entre carrito, factura emitida y PDF
- repricing silencioso e imposible de auditar
- mezclar complejidad esencial de moneda con complejidad accidental de conversion tardia

## Criterio de salida

Esta etapa se considera lista cuando:

- el producto puede declarar claramente de donde sale su precio documental
- el carrito opera completo en `DOP` o `USD`
- una factura `USD` representa importes reales en `USD`
- el snapshot `monetary` guarda `USD -> DOP` sin contradiccion con el documento emitido
- el cambio de tasa posterior no altera ventas historicas

## Escenarios minimos de validacion

1. Un producto con precio base `USD` real entra a una factura `USD` y mantiene subtotal/impuestos/total en `USD`.
2. Un producto que solo tiene precio operativo en `DOP` queda filtrado o bloqueado cuando el documento esta en `USD`.
3. Una venta `USD` ya emitida conserva su snapshot historico aunque luego cambie la tasa vigente `USD -> DOP`.

## Relacion con el plan principal

- Esta etapa complementa la seccion `Productos / precios` del plan principal.
- Es un prerequisito para desbloquear `USD` operativo en facturacion.
- No reemplaza la Fase 2 de `accountingEvents`; la prepara para no emitir eventos sobre documentos monetariamente inconsistentes.
- El plan tecnico por archivos vive en `implementacion-2026-03-10-facturacion-usd-nativa.md`.
