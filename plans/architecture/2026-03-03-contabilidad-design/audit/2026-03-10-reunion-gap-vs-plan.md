# Comparacion: reunion 2026-03-10 vs plan actual de contabilidad y tasa de cambio

Documento comparado:

- `C:\Users\jonat\Downloads\transcripcion_anotada_reunion_ventamax_10_03_2026_sin_labels.pdf`

Base comparada:

- `README.md`
- `contabilidad-backlog.md`
- `contabilidad-checklist.md`
- `etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `implementacion-2026-03-10-facturacion-usd-nativa.md`
- `pending-2026-03-09-purchases-payment-state-gap.md`
- `audit/2026-03-09-repo-audit.md`
- `resumen-2026-03-10-flujo-y-alcance-actual.md`

## Veredicto corto

El plan actual si cubre la direccion central de la reunion:

- moneda documental por documento
- snapshot historico
- `USD` real y no re-etiquetado
- producto con moneda/precio base
- no mezclar semanticas monetarias en una misma venta
- separacion caja vs banco
- compras con hueco real en pagos a proveedor

## Actualizacion posterior al ajuste 2026-03-12

Despues de revisar el plan con el objetivo de adoptar modelo 3, el paquete documental quedo ajustado en estos puntos:

- el contrato principal deja de asumir `DOP/USD` y pasa a `1 functionalCurrency + 1..N documentCurrencies`
- `exchangeRates` deja de definirse como `quoteCurrency -> DOP` y pasa a definirse por par `quoteCurrency/baseCurrency`
- se agrega `politica-2026-03-12-exchange-rate-policy.md` para cerrar `buyRate`, `sellRate`, `rateType` y `effectiveRate`
- backlog y checklist quedan reescritos en lenguaje agnostico a moneda

Con ese ajuste, el hueco principal de politica de tasa queda cerrado a nivel documental. Los huecos que siguen abiertos son sobre todo compras/proveedor, politica de costo y futuras consideraciones FX bancarias.

Pero la reunion agrega varios detalles operativos que hoy no estan cerrados en el plan. Los faltantes mas claros son:

1. flujo funcional de pagos a proveedor como dominio separado o claramente desacoplado de recepcion/inventario
2. rediseño documental de compras para parecerse mas a factura + comprobantes del proveedor
3. reglas operativas de compras para metodos de pago, cuenta origen y pagos parciales/multiples
4. politica de costo de producto frente a nuevas compras
5. posible metadata cambiaria por banco para escenarios multi-moneda bancarios

Nota de foco inmediato:

- las modificaciones mas amplias de `purchases` discutidas en la reunion no entran en ejecucion inmediata
- por ahora quedan en `backlog`
- el equipo se concentra en cerrar a fondo el proceso actual de tasa de cambio y los modulos ya mencionados en el plan vigente
- compras se retoma despues, cuando este estable la base monetaria/documental ya abierta

## Lo que si queda cubierto por el plan actual

### 1. Una venta o documento debe tener una sola moneda documental

Cubierto.

El plan ya dice que el carrito y el documento operan en una moneda documental real y que pagos/totales deben seguir esa misma moneda. Tambien bloquea productos no elegibles cuando el documento es `USD`.

## 2. `USD` debe ser real, no una conversion tardia maquillada

Cubierto.

La reunion insiste en que no se puede calcular en `DOP` y al final solo cambiar la etiqueta a `USD`. Eso ya esta recogido como decision cerrada del plan.

## 3. Producto con precio base en una moneda y conversion a nivel documental

Cubierto en direccion, aunque mas formalizado que en la reunion.

El plan propone:

- `pricing.currency` para el valor operativo materializado
- `pricingPolicy.baseCurrency` y `base*` como referencia economica original
- bloqueo de productos sin base `USD` real cuando la factura es `USD`

Eso es consistente con lo discutido en la reunion: un producto no deberia manejar multiples precios operativos por moneda como camino principal, sino una base y una conversion/regla controlada.

## 4. Alcance multi-modulo

Cubierto.

La reunion menciona impacto en:

- ventas
- cuentas por cobrar
- pagos
- compras
- gastos
- notas de credito
- cotizaciones
- cuadre/caja

El plan ya reparte ese impacto entre snapshots monetarios, eventos, proyecciones y la etapa de facturacion nativa por moneda.

## 5. Caja no es banco

Cubierto.

La reunion abre conciliacion bancaria y distingue entradas/salidas bancarias versus operacion de caja. El plan actual ya deja eso explicitamente separado y no usa `cashCounts` como banco.

## 6. Compras tienen un hueco real en pago al proveedor

Cubierto como riesgo, no como solucion.

La reunion lo trae con fuerza y el plan actual ya tiene un pendiente dedicado para eso.

## Lo que queda cubierto solo parcialmente

### 1. Cotizaciones

Parcial.

La reunion menciona cotizacion como modulo impactado. El plan si toca el PDF compartido de factura/cotizacion y la moneda documental en impresion, pero no existe una bajada funcional especifica para cotizaciones como dominio separado.

## 2. Notas de credito y notas de debito

Parcial.

`credit_note.applied` ya existe en el roadmap de eventos y en escenarios de validacion. Pero la reunion tambien habla de notas de debito, sobre todo del lado de compras/proveedor. Esa parte no aparece cerrada en el plan actual.

## 3. Compras como documento mas parecido a factura

Parcial.

El plan reconoce que compras tiene que madurar, pero todavia no aterriza:

- contrato de documento de compra tipo factura
- comprobante fiscal del proveedor
- RNC
- relacion compra -> factura proveedor
- soporte formal para nota de credito/debito del proveedor

Hoy el plan solo llega claramente hasta `paymentState` pendiente y futuros eventos/proyecciones.

## 4. Pagos de compra desacoplados de recepcion de inventario

Parcial.

La reunion plantea algo importante: el flujo del dinero y el flujo del inventario van en hilos paralelos. El plan ya pregunta si compra y pago deben vivir en el mismo documento o en eventos separados, pero aun no lo decide.

## 5. Metodos de pago de compras y cuenta origen

Parcial.

La reunion pide que en compras quede claro:

- si fue efectivo, transferencia, tarjeta o cheque
- desde que cuenta sale
- si fue pagado total o parcial

El plan actual apunta a `bankAccounts`, cuentas puente y conciliacion, pero no baja aun este contrato operativo concreto para compras.

## 6. Conciliacion bancaria con pagos y salidas

Parcial.

El plan ya tiene banca, proyecciones y conciliacion en el roadmap. Tambien reconoce que hoy solo hay una lectura mas fuerte de entradas ligadas a ventas. Pero todavia no existe un diseño operativo completo para salidas por compras/gastos/pagos a proveedor.

## Lo que faltaba en el plan original y lo que sigue abierto

### 1. Tasa de compra y tasa de venta

Quedo cerrado documentalmente con el ajuste `2026-03-12`.

Ahora el plan principal y la politica de tasas ya distinguen:

- `buyRate`
- `sellRate`
- `rateType`
- `effectiveRate`

Tambien queda claro que la tabla viva define referencias del par y que cada documento congela luego una sola tasa efectiva para su snapshot.

## 2. Politica de costo del producto

Faltante claro.

La reunion cuestiona si el costo del producto debe salir de la ultima compra, de recalculo al actualizar compras o de otra politica. El plan actual cubre moneda/costo base, pero no cierra la politica economica del costo:

- ultimo costo
- promedio ponderado
- costo manual
- costo documental por lote

Sin esa decision, la parte monetaria de compras e inventario queda incompleta a nivel de negocio.

## 3. Dominio formal de pagos a proveedor / cuentas por pagar

Faltante claro.

El pendiente actual de compras reconoce el hueco, pero todavia no existe un plan dedicado para:

- registrar pagos a proveedor
- permitir pagos parciales o multiples
- separar compra vs pago
- mapear pago a caja/banco
- preparar cuentas por pagar

La reunion lo plantea como pieza necesaria para que contabilidad y conciliacion bancaria tengan sentido real.

## 4. Rediseño documental de compras y comprobantes del proveedor

Faltante claro.

La reunion pide acercar compras a una familia documental mas rica:

- documento de compra
- una o varias facturas del proveedor
- notas de credito
- notas de debito
- fechas de pago
- terminos de financiamiento

Nada de eso esta todavia convertido en backlog explicito dentro del plan actual.

## 5. Metadata cambiaria por banco

Faltante menor, pero real.

La reunion menciona que una cuenta bancaria podria requerir contemplar su propia tasa o consideracion cambiaria para cuadrar transacciones multi-moneda. El plan actual habla de `bankAccounts` con moneda y opening balance, pero no de tasa bancaria o FX propio del banco.

Esto puede quedar fuera de fase inmediata, pero conviene dejarlo anotado para no perderlo.

## Recomendacion de ajuste documental

Antes de seguir implementando, conviene agregar o mantener en backlog estas piezas nuevas:

1. Un plan dedicado de `purchases + supplier payments` que cierre:
   - `paymentState`
   - pagos parciales/multiples
   - compra vs pago como hechos separados
   - metodos de pago
   - cuenta origen
   - puente hacia `accountsPayable`
2. Un documento de `purchase documents roadmap` para:
   - factura de proveedor
   - nota de credito proveedor
   - nota de debito proveedor
   - metadata fiscal basica
3. Una decision economica documentada sobre politica de costo del producto.
4. Una nota pequena en `bankAccounts` sobre posible metadata futura de FX bancario.

Importante:

- estos puntos nuevos no cambian la prioridad inmediata del rollout actual
- lo relacionado con rediseño amplio de compras y pagos a proveedor queda documentado como siguiente capa de backlog
- primero debe cerrarse el proceso en curso de tasa de cambio, moneda documental y modulos ya incluidos en el alcance actual

## Prioridad sugerida

Orden sugerido segun impacto real de la reunion:

1. pagos a proveedor y `paymentState`
2. documento de compra y comprobantes del proveedor
3. metodos de pago + cuenta origen en compras
4. politica de costo del producto
5. metadata FX por banco

## Conclusión

La base del plan si va por el camino correcto y cubre la mayor parte de la direccion tecnica de la reunion.

Con el ajuste del 2026-03-12, la base monetaria del plan ya queda mejor cerrada. Lo que sigue faltando no es cambiar el norte, sino bajar mejor estas decisiones operativas:

- compras necesita un flujo financiero propio, no pegado al inventario
- compras necesita madurar como familia documental
- producto/costo necesita una regla economica mas concreta

Nota final de ejecucion:

- por ahora no se abre ese frente de compras como implementacion inmediata
- esas modificaciones quedan en backlog
- el foco sigue siendo terminar bien tasa de cambio y los modulos monetarios ya abiertos para cerrar el proceso actual
