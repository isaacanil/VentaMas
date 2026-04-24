# Reglas operativas: compras, recepcion, inventario y pagos a proveedor

> Estado 2026-04-23: `ARCHIVADO`. Evidencia historica; no usar como guia operativa vigente.

Fecha: `2026-03-18`

## Objetivo

Definir el flujo operativo minimo correcto para `compras + cuentas por pagar` sin meter complejidad accidental.
p
La regla base es separar tres cosas:

- `workflowStatus`: estado operativo de la compra y la recepcion
- `paymentState`: estado financiero de la deuda
- inventario: solo cambia cuando hay recepcion real

## Regla principal

Una compra no significa automaticamente:

- que la mercancia entro
- que la deuda se pago
- que el documento ya no se puede tocar

Por eso la compra deja de depender de un solo `status`.

## Estados recomendados

### Estado operativo de compra y recepcion

`workflowStatus`:

- `pending_receipt`
- `partial_receipt`
- `completed`
- `canceled`

Significado:

- `pending_receipt`: la compra existe, pero aun no ha entrado mercancia
- `partial_receipt`: ya entro parte de la mercancia, pero todavia falta recibir
- `completed`: ya no queda mercancia pendiente por recibir
- `canceled`: la compra se cerro sin recepcion pendiente y ya no admite cambios operativos

### Estado financiero

`paymentState.status`:

- `unpaid`
- `partial`
- `paid`
- `overdue`
- `unknown_legacy`

Regla: `workflowStatus` y `paymentState.status` no se mezclan.

Ejemplos validos:

- `completed + unpaid`
- `partial_receipt + partial`
- `pending_receipt + unpaid`

## Flujo recomendado

### 1. Crear compra

Al crear la compra:

- nace en `workflowStatus = pending_receipt`
- nace con `paymentTerms`
- nace con `paymentState` inicial
- no entra inventario
- no se crea pago automaticamente

Si la compra es al contado, eso no significa que se pague en el mismo write. Significa que el pago esperado es inmediato y luego puede registrarse como pago inicial.

### 2. Recibir mercancia

La recepcion es el hecho que alimenta inventario.

Reglas:

- si se recibe todo, la compra pasa a `completed`
- si se recibe solo una parte, la compra pasa a `partial_receipt`
- el inventario aumenta solo por la cantidad recibida
- pagar no mete inventario

### 3. Registrar pago a proveedor

Los pagos van a `accountsPayablePayments`.

Reglas:

- el source of truth del pago real es `accountsPayablePayments`
- la compra solo conserva el resumen en `paymentState`
- cada pago puede actualizar `nextPaymentAt`, recibo, referencia y evidencia
- un pago genera `supplier_payment` en `cashMovements`

### 4. Cerrar la compra

Una compra queda cerrada operativamente cuando:

- se recibio todo, o
- la parte faltante fue cerrada explicitamente como no esperada

Eso no significa que este pagada.

## Reglas de edicion

### `pending_receipt`

Se puede editar:

- proveedor
- productos y cantidades
- costos
- fechas
- `paymentTerms`
- adjuntos y notas

Se puede cancelar si todavia no hay recepcion ni pagos.

### `partial_receipt`

Se puede editar solo en la parte no recibida.

No se debe poder editar libremente:

- cantidades ya recibidas
- costos que ya impactaron inventario
- lineas ya recibidas

Si hace falta corregir lo recibido, debe hacerse via flujo explicito de ajuste o devolucion, no editando la compra como si nada hubiera pasado.

### `completed`

No se debe poder editar nada que cambie inventario o costo historico.

Solo deben permitirse cambios de baja criticidad, por ejemplo:

- notas
- adjuntos
- referencias administrativas

Los pagos todavia pueden registrarse aunque la compra este `completed`.

### `canceled`

Debe quedar solo lectura.

## Cuando se puede pagar

Para evitar complejidad accidental en esta fase:

- no modelar todavia anticipos de proveedor desacoplados de una compra
- el pago se registra contra una compra existente
- el pago puede ocurrir despues de la primera recepcion o junto con la recepcion final

Si la UX quiere seguir siendo simple, se puede ofrecer:

- `Completar compra y registrar pago inicial`

Pero internamente siguen siendo dos hechos:

1. recepcion/completado de compra
2. pago a proveedor

## Que significa compra completada

`completed` significa:

- recepcion operativa terminada
- no quedan cantidades pendientes por recibir

No significa:

- pagada
- conciliada
- cerrada contablemente

## Entrega parcial

La entrega parcial si debe existir. Es complejidad esencial.

Reglas minimas:

- cada linea debe poder conocer `orderedQuantity`, `receivedQuantity` y `pendingQuantity`
- si alguna linea tiene recibido > 0 y pendiente > 0, la compra puede estar `partial_receipt`
- el inventario entra solo por `receivedQuantity`
- el estado financiero sigue separado

Limite de esta fase:

- no abrir todavia un modulo completo de `purchase orders`, `supplier invoices` y `goods receipts` como documentos separados
- una sola compra puede seguir representando el documento comercial principal, aunque la recepcion sea parcial

## Casos clave

### Caso 1. Compra pendiente

- se crea compra
- queda `pending_receipt + unpaid`
- no entra inventario
- se puede editar completo

### Caso 2. Compra recibida completa y no pagada

- entra toda la mercancia
- pasa a `completed + unpaid`
- el inventario ya entro
- la deuda sigue abierta

### Caso 3. Compra recibida parcial y con abono

- entra parte de la mercancia
- pasa a `partial_receipt`
- se registra un pago parcial
- `paymentState` pasa a `partial`
- debe guardarse `nextPaymentAt` si sigue saldo

### Caso 4. Compra cancelada

- si no hubo recepcion ni pagos, puede cancelarse
- si ya hubo recepcion o pago, no se cancela libremente; requiere flujo de ajuste o cierre del remanente

## Decisiones que no debemos tomar ahora

- no mezclar pago dentro de `workflowStatus`
- no usar `paymentAt` como verdad del pago real
- no meter plan de cuotas completo
- no crear tres documentos distintos para orden, recepcion y factura de proveedor en esta fase
- no permitir editar libremente una compra despues de impactar inventario

## Cambio concreto del flujo actual

El flujo deja de ser:

1. crear compra
2. completar compra
3. asumir pago por fechas/campos sueltos

Y pasa a ser:

1. crear compra en `pending_receipt`
2. recibir parcial o totalmente
3. actualizar inventario por recepcion
4. registrar pagos reales en `accountsPayablePayments`
5. recalcular `paymentState`
6. cerrar operativamente la compra sin mezclar eso con el pago

## Recomendacion final

Si queremos hacerlo bien desde el principio, la siguiente implementacion de compras debe nacer con esta frontera:

- compra = recepcion + costo + documento comercial
- pago proveedor = ledger financiero real
- inventario = solo recepcion
- `completed` != `paid`
