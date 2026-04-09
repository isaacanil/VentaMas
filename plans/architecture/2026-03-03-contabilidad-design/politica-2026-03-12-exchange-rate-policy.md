# Politica de Tasas y Paridad

Fecha de ajuste: `2026-03-12`

## Objetivo

Cerrar el contrato de tasas para que la arquitectura soporte:

- una sola `functionalCurrency` por negocio
- `1..N` monedas documentales habilitadas
- una tasa efectiva congelada por documento
- una politica formal de `buyRate` / `sellRate`

Sin convertir esto todavia en un motor FX libre entre todos los pares posibles.

## Regla base

- Cada negocio tiene una `functionalCurrency`.
- Cada documento nace en una sola `documentCurrency`.
- Cada snapshot monetario convierte siempre `documentCurrency -> functionalCurrency`.
- En Fase 1, `exchangeRates` se modela por par `quoteCurrency/baseCurrency`, donde `baseCurrency = functionalCurrency`.

Ejemplo:

- negocio con `functionalCurrency = DOP`
- monedas documentales habilitadas: `DOP`, `USD`, `EUR`
- pares validos en Fase 1: `USD -> DOP`, `EUR -> DOP`

No se exige todavia resolver conversion directa `USD -> EUR` dentro del mismo documento.

## Tipos de tasa

Cada registro vigente de `exchangeRates` debe guardar:

- `quoteCurrency`
- `baseCurrency`
- `buyRate`
- `sellRate`
- `effectiveAt`
- `source`
- `status`

Semantica recomendada:

- `sellRate`: tasa por defecto para documentos de venta, cobro CxC, cotizacion y otros flujos orientados al cliente.
- `buyRate`: tasa por defecto para compras, gastos, pagos a proveedor y otros flujos de salida.

## Tasa efectiva por documento

El documento no guarda solo una referencia a la tabla viva. Debe congelar:

- `rateId`
- `quoteCurrency`
- `baseCurrency`
- `rateType`
- `effectiveRate`
- `referenceRates.buy`
- `referenceRates.sell`
- `effectiveAt`

Regla:

- la politica del negocio sugiere la tasa por defecto
- el documento congela una sola `effectiveRate`
- si hubo override, el snapshot sigue guardando `effectiveRate` y ademas deja rastro en `monetary.override`

## Seleccion por tipo de operacion

Tabla por defecto:

| Operacion | rateType por defecto |
| --- | --- |
| venta | `sell` |
| pago CxC | `sell` |
| compra | `buy` |
| gasto | `buy` |
| pago a proveedor | `buy` |

Si un flujo necesita una excepcion, debe declararse en `exchangeRatePolicy.defaultRateSelectionByOperation`, no en codigo hardcodeado por moneda.

## Override

- Solo se permite al crear el documento.
- Debe quedar auditado con actor, motivo y valor aplicado.
- No se puede reescribir despues de que el documento quede emitido o contabilizable.

## Relacion con banca

- `bankAccounts` conserva su propia `currency`.
- Si un banco opera en moneda no funcional, la tasa documental sigue saliendo del par `quoteCurrency -> functionalCurrency`.
- Una futura metadata FX bancaria puede agregarse despues, pero no cambia el contrato base del snapshot monetario.

## Implicacion para implementacion

1. El dominio deja de asumir `DOP/USD`.
2. El snapshot deja de asumir una sola moneda extranjera global.
3. El codigo puede seguir operando con una moneda funcional unica por negocio.
4. Abrir una nueva moneda documental habilitada deja de requerir reescribir el contrato documental.
