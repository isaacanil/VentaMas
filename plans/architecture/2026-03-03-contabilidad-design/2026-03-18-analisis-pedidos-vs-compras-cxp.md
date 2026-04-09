# Analisis: pedidos vs compras con el nuevo modelo de CxP

Fecha: `2026-03-18`

## Decision corta

`pedidos` si sigue teniendo sentido, pero ya no como paso obligatorio del flujo de compras.

La decision recomendada es:

- mantener `pedidos` como flujo opcional de abastecimiento o solicitud al proveedor
- mantener `compras` como documento real de recepcion, inventario y deuda
- no meter `CxP`, `paymentState` ni pagos reales dentro de `pedidos`
- no obligar a pasar por `pedido` para poder comprar

## Evidencia del codigo

Hoy `pedidos` funciona como una capa previa y opcional:

- la compra puede nacer en modo `create` o en modo `convert`
- al convertir, la compra toma `orderId`, pero no todas las compras pasan por ahi
- el selector de pedido dentro de compra solo escucha pedidos pendientes de convertir

Referencias:

- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/hooks/usePurchaseManagementController.ts`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/GeneralForm/components/OrderSelector.tsx`
- `src/firebase/order/fbGetPedingOrder.ts`

Ademas, el tipado actual muestra que `Order` hereda de `Purchase`, lo cual es una señal de mezcla excesiva de dominio:

- `src/utils/order/types.ts`

Y el codigo hoy convive con dos shapes de pedido:

- legacy con `data.state`
- moderno con `status` top-level

Referencias:

- `src/firebase/order/fbGetPedingOrder.ts`
- `src/firebase/order/fbGetOrders.ts`
- `src/firebase/order/fbAddOrder.ts`
- `src/firebase/order/fbDeleteOrder.ts`

Y hay un flujo legacy mas agresivo donde convertir pedido a compra tambien intentaba tocar stock y actualizar el pedido:

- `src/firebase/purchase/fbPreparePurchaseDocument.ts`

Eso confirma que `pedidos` y `compras` historicamente se mezclaron mas de la cuenta.

## Evidencia de datos reales del piloto

Lectura `read-only` del negocio piloto `X63aIFwHzk3r0gmT8w6P` con la key local:

- `orders`: `16`
- `purchases`: `47`
- `backOrders`: `687`
- `accountsPayablePayments`: `0`
- `purchasesWithOrderId`: `6`
- `ordersReferencedByPurchases`: `6`
- `ordersWithSelectedBackOrders`: `2`
- `purchasesWithSelectedBackOrders`: `8`

Interpretacion:

- `compras` es el flujo dominante
- `pedidos` existe, pero no es el camino principal
- `backOrders` tampoco dependen exclusivamente de `pedidos`
- hoy no hay evidencia de que `pedidos` deba absorber pagos o CxP

## Antes

Antes, la idea implícita era esta:

1. crear un `pedido`
2. luego convertirlo a `compra`
3. desde ahi terminar mezclando recepcion, fecha de pago y estado

Problemas:

- `Order` y `Purchase` comparten demasiado shape
- `pedido` arrastra campos que no deberian ser su responsabilidad
- la relacion con `backOrders` existe, pero no justifica convertirlo en el centro del flujo
- si le montamos CxP encima, duplicamos complejidad entre `order` y `purchase`

## Despues

Con el nuevo modelo, la frontera correcta es esta:

### Pedido

`pedido` representa una solicitud o precompromiso de abastecimiento.

Sirve para:

- organizar solicitudes al proveedor
- agrupar faltantes o necesidad de compra
- reservar o asociar `backOrders`
- decidir que luego se convertira en una compra real

No sirve para:

- meter inventario
- registrar pagos
- representar deuda real de proveedor
- representar recepcion final de mercancia

### Compra

`compra` representa el hecho operativo real:

- recepcion
- costo
- inventario
- deuda
- pagos a proveedor via `accountsPayablePayments`

## Flujo recomendado

### Flujo directo

1. crear compra
2. recibir parcial o totalmente
3. alimentar inventario por recepcion
4. registrar pagos reales

### Flujo con pedido

1. crear pedido opcional
2. cuando se confirma, convertir a compra
3. la compra hereda `orderId`
4. recepcion y pago viven ya en compra, no en pedido

## Regla de negocio recomendada

`pedido` debe quedar como opcional.

La app debe soportar dos caminos validos:

- compra directa
- pedido -> compra

Eso coincide con los datos reales del piloto, donde la mayoria de las compras no vienen de `orderId`.

## Estados recomendados para pedidos

No conviene seguir usando `pedido` con la misma semantica de compra.

Recomendacion:

- `requested`
- `converted`
- `canceled`

Mapeo legacy:

- `state_2` -> `requested`
- `state_3` / `completed` -> `converted`
- `state_4` / `canceled` / `cancelled` -> `canceled`

No recomiendo meter:

- `paid`
- `partial`
- `overdue`
- `completed` con sentido de recepcion

Eso le pertenece a `purchase`.

## Implicacion para CxP

`accountsPayablePayments` debe colgar solo de `purchaseId`, no de `orderId`.

Si un usuario quiere pagar algo, eso presupone que ya existe una compra real.

Entonces:

- no hay pagos sobre pedidos
- no hay `paymentState` fuerte sobre pedidos
- no hay `cashMovements` con `sourceType = order`

## Migracion recomendada

No veo necesaria una migracion destructiva.

La estrategia correcta seria:

### 1. Mantener compatibilidad

- conservar la coleccion `orders`
- conservar `orderId` en compras existentes
- no tocar historicos solo para “normalizarlos bonito”

### 2. Cambiar la semantica hacia adelante

- `pedido` deja de ser requisito para crear compra
- `pedido` deja de cargar semantica de pago/recepcion
- `pedido` solo representa solicitud o conversion pendiente

### 3. Migracion suave de estados

No hace falta reescribir todos los documentos legacy ya.

Se puede:

- mapear estados legacy en lectura
- y solo guardar estados nuevos en escrituras futuras
- mantener sincronizados `status` y `data.state` mientras convivan ambos shapes

### 4. Limpiar codigo legacy peligroso

El candidato mas claro a revisar o degradar es:

- `src/firebase/purchase/fbPreparePurchaseDocument.ts`

Porque mezcla conversion, stock y escritura legacy en un solo paso.

## Recomendacion final

`pedidos` no hay que eliminarlo ahora.

Pero tampoco hay que seguir tratandolo como si fuera el primer paso obligatorio de compras.

La recomendacion profesional para este repo es:

- `pedido` = opcion de planeacion / solicitud / abastecimiento
- `compra` = source of truth operativo
- `accountsPayablePayments` = source of truth financiero del pago

Si hubiera que simplificar el sistema mas adelante, `pedidos` seria candidato a quedar como flujo secundario o incluso a salir del camino principal del menu. Pero hoy no lo borraria; solo le reduciria responsabilidad.
