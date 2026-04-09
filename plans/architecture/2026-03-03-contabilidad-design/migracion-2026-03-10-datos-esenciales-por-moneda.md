# Migracion: de datos implicitos a datos esenciales por moneda

Estado: `PENDING`

Relacionado con:

- `README.md`
- `etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `implementacion-2026-03-10-facturacion-usd-nativa.md`

## Objetivo

Definir como pasar de la estructura actual, donde muchos montos existen como numeros sin moneda explicita, a una estructura minima y esencial que haga auditable:

- en que moneda existe el precio
- en que moneda existe el documento
- de donde salio el precio documental
- como se congela el snapshot historico hacia `DOP`

La meta no es reescribir todo el modelo. La meta es agregar solo los campos esenciales que hoy faltan.

## Principio de migracion

Regla general:

- conservar el shape legacy que hoy usa la operacion
- agregar metadata monetaria explicita
- evitar migraciones masivas innecesarias
- tratar todo historico sin moneda como `DOP`

En otras palabras:

- pasar de `dato numerico implicito` a `dato numerico + moneda + origen`
- sin romper `products`, `cart` ni `invoices` existentes

## Problema actual

Hoy existen varios campos numericos que son semanticamente ambiguos:

- `pricing.cost`
- `pricing.price`
- `pricing.listPrice`
- `pricing.cardPrice`
- `pricing.offerPrice`
- `cart.totalPurchase.value`
- `cart.totalTaxes.value`
- `invoice.data.totalPurchase.value`

El numero existe, pero no siempre queda claro:

- si esta en `DOP` o `USD`
- si es precio operativo materializado o precio base economico
- si el carrito y la factura hablan la misma moneda

## Regla de oro

No mover todo a un mega-modelo nuevo.

Primero hacer explicito lo esencial:

1. moneda operativa del precio
2. moneda documental del carrito/factura
3. origen del precio documental
4. snapshot historico del documento

## Antes y despues por dominio

## 1. Producto

### Antes

```json
{
  "id": "p1",
  "name": "Aceite",
  "pricing": {
    "cost": 580,
    "price": 850,
    "listPrice": 850,
    "cardPrice": 875,
    "offerPrice": 0,
    "tax": 18
  }
}
```

Problema:

- los valores existen, pero la moneda esta implicita
- no queda claro si el precio economico real vive en `USD`

### Despues minimo

```json
{
  "id": "p1",
  "name": "Aceite",
  "pricing": {
    "currency": "DOP",
    "cost": 580,
    "price": 850,
    "listPrice": 850,
    "cardPrice": 875,
    "offerPrice": 0,
    "tax": 18
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

- `pricing.*` = precio operativo materializado
- `pricing.currency` = moneda de esos valores operativos
- `pricingPolicy.base*` = referencia economica original si el negocio trabaja base `USD`

Default legacy:

- si `pricing.currency` falta, interpretar `DOP`
- si `pricingPolicy` falta, asumir que el producto no tiene base `USD`

Backfill:

- no obligatorio para todo el catalogo
- se puede poblar gradualmente en productos piloto

## 2. Unidad de venta o variacion

### Antes

```json
{
  "id": "u1",
  "unitName": "Caja",
  "quantity": 12,
  "pricing": {
    "price": 14.5,
    "listPrice": 14.5
  }
}
```

Problema:

- no queda claro si ese precio es `DOP` o `USD`
- no existe precedencia clara respecto al producto root

### Despues minimo

```json
{
  "id": "u1",
  "unitName": "Caja",
  "quantity": 12,
  "pricing": {
    "currency": "USD",
    "price": 14.5,
    "listPrice": 14.5,
    "tax": 18
  }
}
```

Regla de precedencia:

- si la unidad/variacion activa tiene precio base `USD`, esa definicion gana
- si no lo tiene, se puede usar el producto root solo si el contrato del catalogo lo permite
- si ninguna capa tiene precio base `USD`, el item no es elegible para factura `USD`

Default legacy:

- si la unidad no tiene `pricing.currency`, interpretar la misma moneda operativa del producto root

Backfill:

- solo necesario en unidades/variaciones que participen en ventas `USD`

## 3. Carrito

### Antes

```json
{
  "products": [
    {
      "id": "p1",
      "amountToBuy": 2,
      "pricing": {
        "price": 850,
        "listPrice": 850,
        "tax": 18
      }
    }
  ],
  "totalPurchase": { "value": 1700 },
  "totalTaxes": { "value": 259.32 }
}
```

Problema:

- el carrito no declara `documentCurrency`
- el item no declara de donde salio su precio documental

### Despues minimo

```json
{
  "documentCurrency": "USD",
  "exchangeRate": 59.25,
  "rateOverride": null,
  "products": [
    {
      "id": "p1",
      "amountToBuy": 2,
      "pricing": {
        "currency": "USD",
        "price": 14.5,
        "listPrice": 14.5,
        "tax": 18
      },
      "pricingSource": {
        "mode": "base-price",
        "baseCurrency": "USD",
        "resolvedFrom": "saleUnit"
      }
    }
  ],
  "totalPurchase": { "value": 29.0 },
  "totalTaxes": { "value": 4.41 }
}
```

Lectura correcta:

- `documentCurrency` define la moneda real del documento en construccion
- cada item ya entra al carrito con precio resuelto en esa moneda
- `pricingSource` explica de donde salio ese valor

Default legacy:

- si `documentCurrency` falta, interpretar `DOP`
- si `exchangeRate` falta en `DOP`, usar `1`

Backfill:

- no aplica a carritos historicos; solo a operacion nueva

## 4. Factura persistida

### Antes

```json
{
  "data": {
    "totalPurchase": { "value": 1700 },
    "totalTaxes": { "value": 259.32 }
  }
}
```

Problema:

- la factura final no deja necesariamente claro en que moneda existe el documento
- el snapshot monetario puede quedar desacoplado de la semantica real del carrito si este no era coherente

### Despues minimo

```json
{
  "data": {
    "documentCurrency": "USD",
    "totalPurchase": { "value": 29.0 },
    "totalTaxes": { "value": 4.41 },
    "monetary": {
      "documentCurrency": {
        "code": "USD"
      },
      "functionalCurrency": {
        "code": "DOP"
      },
      "exchangeRateSnapshot": {
        "quoteCurrency": "USD",
        "baseCurrency": "DOP",
        "rate": 59.25
      },
      "documentTotals": {
        "total": 29.0
      },
      "functionalTotals": {
        "total": 1718.25
      }
    }
  }
}
```

Lectura correcta:

- `data.documentCurrency` y `data.monetary.documentCurrency` deben hablar de la misma moneda
- `documentTotals` representa la factura en su moneda real
- `functionalTotals` representa su equivalencia historica en `DOP`

Default legacy:

- si `data.documentCurrency` falta y no hay snapshot, interpretar `DOP`

Backfill:

- no reescribir historicos masivamente
- tratarlos como `DOP` por regla de compatibilidad

## Tabla de migracion minima

| Dominio | Shape actual | Shape minimo nuevo | Default legacy | Backfill |
|---|---|---|---|---|
| Producto | `pricing.*` numerico | `pricing.currency` + `pricingPolicy` opcional | `DOP` | gradual |
| Unidad/variacion | `pricing.*` numerico | `pricing.currency` | hereda de producto si falta | solo elegibles `USD` |
| Carrito | montos sin moneda documental | `documentCurrency`, `exchangeRate`, `pricingSource` | `DOP` | no |
| Factura | totales legacy + snapshot parcial | `data.documentCurrency` + `data.monetary` coherente | `DOP` | no masivo |

## Decisiones cerradas

- No se elimina el shape legacy actual.
- No se migra el catalogo completo de una vez.
- `USD` solo se habilita para productos/unidades con precio base `USD` real.
- No se usa conversion tardia al emitir como camino operativo inicial.
- Todo historico sin metadata monetaria explicita se sigue tratando como `DOP`.

## Orden recomendado de adopcion

1. Agregar `pricing.currency` al catalogo nuevo o al piloto.
2. Agregar `pricingPolicy` solo en productos que realmente trabajen base `USD`.
3. Agregar `documentCurrency` y `exchangeRate` al carrito.
4. Resolver el precio documental antes de agregar el item al carrito.
5. Persistir `data.documentCurrency` y `data.monetary` coherentes en factura.

## Escenarios minimos de validacion

1. Producto con precio base `USD` entra a carrito `USD` y mantiene montos reales en `USD`.
2. Producto solo `DOP` queda bloqueado o filtrado cuando la factura/documento esta en `USD`.
3. Unidad de venta con precio base `USD` gana sobre el producto root si ambas existen.
4. Cambio posterior de tasa no altera una factura `USD` ya emitida.

## Criterio de salida

Este aterrizaje de datos se considera suficiente cuando:

- deja explicita la moneda de producto, carrito y factura
- no rompe la operacion legacy en `DOP`
- no obliga a una migracion masiva inmediata
- evita que una factura `USD` nazca desde datos economicamente ambiguos
