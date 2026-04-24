# Diseno: Compras + Cuentas por Pagar + Tasa de Cambio

> Estado 2026-04-23: `ARCHIVADO`. Reglas vigentes absorbidas en `../contabilidad-backlog.md`.

Fecha: `2026-03-17`

## Objetivo

Definir una implementacion correcta para llevar a `compras` el manejo real de cuentas por pagar a proveedor, sin meter complejidad accidental y sin dejar la solucion a medias.

La meta no es solo "agregar un campo mas", sino cerrar bien el dominio para que:

- la recepcion de mercancia y el pago al proveedor dejen de ser la misma cosa
- una compra pueda quedar `pendiente`, `parcial` o `pagada` de verdad
- los abonos de proveedor tengan recibos, evidencias y trazabilidad
- la tasa aplicada en compra y en pago quede congelada correctamente
- el UI nazca con un patron claro, como el panel de tasa de cambio, pero adaptado a un flujo transaccional

## Evidencia de la reunion

Del PDF `Cuentas por Pagar y Gestion de Pagos.pdf` salen cinco decisiones fuertes:

1. La deuda del proveedor debe vivir en `compras`, al menos en la primera fase.
   - "puede vivir en la misma pantalla de compras" (PDF p.1)

2. Hay que separar recepcion de mercancia y pago.
   - "en paralelo, y no dependientes ... el tema del pago de la factura" (PDF p.2)

3. El foco inmediato no es un plan de cuotas completo.
   - "sin tener que generar todo un plan de pago" (PDF p.2)

4. Si hay abono parcial, el sistema debe pedir y guardar la proxima fecha.
   - "si debia 100 mil y el abona 50 ... la proxima fecha de pago" (PDF p.2)

5. Cada pago debe generar recibo y guardar evidencia.
   - "generar esos recibos pagados ... con sus evidencias" (PDF p.2)

Tambien queda explicito el objetivo funcional base:

- "que haya un estatus real de que si se pago o no se pago" (PDF p.1)

## Estado actual del repo

### 1. El panel de tasa de cambio ya tiene un patron bueno

El panel de configuracion contable no es solo una lista de inputs.

Tiene:

- una decision principal clara: moneda base
- una seccion editable para tasas manuales
- una referencia externa separada del dato editable
- historial versionado

Evidencia:

- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingSettingsForm.tsx:130`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/ExchangeRateList.tsx:41`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/ExchangeRateMarketReference.tsx:87`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingHistoryList.tsx:76`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig.ts:235`

Conclusion: no conviene copiar ese panel 1:1 en compras, pero si conviene copiar su patron:

- dato editable separado de dato de referencia
- contexto inline
- historial o trazabilidad visible
- contrato persistente y versionable

### 2. Compras hoy tiene fechas, pero no tiene estado financiero real

La UI actual exige:

- proveedor
- condicion
- fecha de entrega
- fecha de pago
- productos
- evidencias generales del documento

Evidencia:

- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/GeneralForm/GeneralForm.tsx:447`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/hooks/usePurchaseManagementController.ts:291`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/hooks/usePurchaseManagementController.ts:304`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/hooks/usePurchaseManagementController.ts:318`

Pero esas fechas no significan todavia:

- monto pagado real
- balance pendiente
- abonos parciales
- recibos de pago
- proxima fecha de pago
- estado vencido

El modelo tipado de compra tampoco tiene contrato cerrado para eso:

- `src/utils/purchase/types.ts:45`

Solo tiene `condition`, `deliveryAt`, `paymentAt`, `status`, `note`, `monetary` y `attachmentUrls`.

### 3. El snapshot monetario de compras asume pago total

Hoy el snapshot monetario de compra se genera con:

- `paid = total`
- `balance = 0`

Evidencia:

- `src/firebase/purchase/fbAddPurchase.ts:65`
- `src/firebase/purchase/fbAddPurchase.ts:69`
- `src/firebase/purchase/fbCompletePurchase.ts:80`
- `src/firebase/purchase/fbCompletePurchase.ts:85`
- `src/firebase/purchase/fbCompletePurchase.ts:89`

Eso contradice directamente el requerimiento de reunion y el backlog vivo del paquete:

- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-backlog.md`
- `plans/architecture/2026-03-03-contabilidad-design/resumen-2026-03-10-flujo-y-alcance-actual.md`

### 4. El listado de compras no distingue recepcion vs pago

La tabla actual muestra:

- `status`
- `provider`
- `deliveryAt`
- `paymentAt`
- `total`

Evidencia:

- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/tableConfig.tsx:19`

No hay columna para:

- estado de pago
- balance
- fecha del proximo pago
- ultima evidencia de pago

### 5. Hay mezcla de contratos legacy en compras

Persisten dos problemas estructurales:

1. Hay campos viejos y nuevos coexistiendo:
   - `deliveryAt/paymentAt`
   - `deliveryDate/paymentDate`
   - `attachmentUrls/fileList`

2. El estado operativo esta mezclado:
   - el catalogo base declara `pending/delayed/requested/delivered/canceled`
   - el modulo realmente usa `pending/completed/canceled/processing`

Evidencia:

- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/purchaseLogic.ts:37`
- `src/firebase/purchase/fbPreparePurchaseDocument.ts:24`
- `src/firebase/purchase/fbUpdatePurchase.ts:47`
- `src/constants/orderAndPurchaseState.ts:15`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/config/filterConfig.ts:20`
- `src/firebase/purchase/fbCompletePurchase.ts:378`

Si a esta mezcla le agregamos cuentas por pagar sin cerrar el contrato, la complejidad accidental sube mucho.

## Opciones evaluadas

### Opcion A: agregar solo `paymentStatus`, `amountPaid` y `nextPaymentAt` dentro de compra

Ventaja:

- rapida

Problema:

- no deja recibos
- no deja evidencia por pago
- obliga a mutar totales a mano
- no separa bien hecho comercial vs hecho financiero
- deja el historico opaco

Veredicto: rechazada.

### Opcion B: compra con resumen financiero + recibos de pago append-only

Idea:

- la compra conserva su resumen de deuda
- cada abono crea un recibo de pago independiente
- el resumen de `paymentState` se actualiza a partir de esos recibos
- el UI sigue viviendo dentro de compras en fase 1

Ventaja:

- cumple la reunion
- evita hacer un modulo enorme de CxP desde el dia 1
- deja trazabilidad real
- separa recepcion vs pago sin romper el flujo actual de inventario

Costo:

- requiere nuevo contrato de datos
- requiere nuevo write path para registrar pagos

Veredicto: recomendada.

### Opcion C: modulo completo de cuentas por pagar con planes de cuotas, aging global y pagos multi-documento

Ventaja:

- es la solucion mas robusta a largo plazo

Problema:

- hoy no hay evidencia suficiente para justificar ese alcance
- contradice la reunion, donde se dijo que por ahora no se le ve mucho valor a un plan de pago completo
- meterlo ahora seria complejidad accidental

Veredicto: diferida.

## Recomendacion

Implementar `compras + cuentas por pagar fase 1` con frontera de dominio clara:

- `compra` sigue siendo el documento comercial y de recepcion
- `paymentState` resume la deuda de esa compra
- `paymentReceipts` guarda cada abono o pago completo
- `status` de compra queda reservado al estado operativo de recepcion
- el estado financiero se mueve a `paymentState.status`

Esto cumple lo pedido sin montar un motor de cuotas completo.

## Contrato recomendado

### Compra

Agregar a `purchases/{purchaseId}`:

```json
{
  "status": "pending",
  "workflowStatus": "pending",
  "paymentTerms": {
    "condition": "thirty_days",
    "debtStartsAt": 1710710400000,
    "originalDueAt": 1713302400000,
    "nextPaymentAt": 1713302400000,
    "notes": null
  },
  "paymentState": {
    "status": "unpaid",
    "paidDocument": 0,
    "paidFunctional": 0,
    "balanceDocument": 1180,
    "balanceFunctional": 74635,
    "paymentCount": 0,
    "lastPaymentAt": null,
    "lastReceiptId": null,
    "nextPaymentAt": 1713302400000,
    "needsReconciliation": false,
    "updatedAt": 1710710400000,
    "updatedBy": "uid"
  }
}
```

Notas:

- `status` o `workflowStatus` habla de recepcion/completado/cancelado, no de pago.
- `paymentTerms` describe la condicion pactada.
- `paymentState` describe el estado financiero actual.
- `paymentAt` legacy no debe seguir significando "se pago"; debe migrarse a `paymentTerms.originalDueAt`.

### Recibos de pago de proveedor

Crear subcoleccion:

- `businesses/{businessId}/purchases/{purchaseId}/paymentReceipts/{receiptId}`

Contrato recomendado:

```json
{
  "id": "receiptId",
  "purchaseId": "purchaseId",
  "providerId": "providerId",
  "createdAt": 1711300000000,
  "createdBy": "uid",
  "paymentDate": 1711300000000,
  "nextPaymentAt": 1713900000000,
  "note": "abono parcial",
  "paymentMethods": [
    {
      "method": "transfer",
      "value": 50000,
      "reference": "trx-001"
    }
  ],
  "attachments": [],
  "monetary": {},
  "totals": {
    "documentAmount": 790.51,
    "functionalAmount": 50000
  }
}
```

La compra no debe mutar manualmente `paid` o `balance` desde el form.
Debe recalcularse desde el alta del recibo.

## Relacion con tasa de cambio

### Regla

La compra y el pago al proveedor son hechos distintos.

Por eso:

- la compra congela su propio `monetary`
- cada recibo de pago debe congelar su propio `monetary`

Esto importa cuando:

- la compra se registra en `USD`
- el pago ocurre otro dia
- la tasa vigente ya cambio

Si no congelamos ambos snapshots, no podremos explicar:

- costo documental de la compra
- monto funcional efectivamente pagado
- diferencia entre fecha de compra y fecha de pago

### Cambio necesario en utilidades monetarias

El contrato actual solo soporta:

- `sale`
- `purchase`
- `receivable-payment`

Evidencia:

- `src/utils/accounting/monetary.ts:15`

Recomendacion:

- agregar `payable-payment` como nuevo `MonetaryOperationType`
- mapear `purchase` y `payable-payment` a `buyRate`
- mapear `sale` y `receivable-payment` a `sellRate`

Eso deja el contrato simetrico y evita reutilizar semantica de cobro de cliente para pago a proveedor.

## Diseno de UI recomendado

### Patron a reutilizar del panel de tasa de cambio

No copiar la pantalla literal.
Si copiar esta estructura:

1. Decision y contexto arriba.
2. Zona editable bien delimitada.
3. Referencia o resumen en paralelo.
4. Historial visible pero no invasivo.

### Propuesta en compras

#### A. Bloque "Documento y recepcion"

Mantener:

- proveedor
- numero de factura
- evidencia del documento
- fecha de entrega
- productos

Renombrar semanticamente:

- `Fecha de Pago` actual -> `Fecha pactada / vencimiento inicial`

#### B. Bloque "Estado de pago"

Tarjeta resumen con:

- estado: `Pendiente`, `Parcial`, `Pagada`, `Vencida`, `Legacy sin conciliar`
- total documento
- total pagado
- balance
- ultima fecha de pago
- proxima fecha de pago

#### C. Accion "Registrar pago"

Modal inspirado en `MultiPaymentModal`, pero no acoplado a cuentas por cobrar.

Reusar si aplica:

- seleccion de metodo de pago
- validaciones de referencia
- impresion o render de recibo

No reusar:

- logica de cuotas de AR
- lenguaje de cliente/CxC

#### D. Historial

Lista o collapse con:

- recibos emitidos
- monto
- fecha
- metodo
- evidencia
- balance luego del pago

## Recortes que no aceptaria

### 1. Reusar `paymentAt` como si fuera todo

No.

Porque una sola fecha no puede representar al mismo tiempo:

- fecha pactada
- fecha del ultimo pago
- fecha del proximo pago

La reunion pide explicitamente proxima fecha despues del abono parcial.

### 2. Guardar `paymentState` sin recibos

No.

Porque contradice:

- "generar esos recibos pagados ... con sus evidencias" (PDF p.2)

Y deja la trazabilidad incompleta desde el primer dia.

### 3. Mezclar recepcion y pago dentro de `status`

No.

Porque la reunion pide que ambos vayan "en paralelo, y no dependientes" (PDF p.2).

Si metemos todo en `status`, perderemos claridad operativa.

### 4. Seguir asumiendo `paid = total`

No.

Porque ya esta documentado como hueco del rollout monetario:

- `plans/architecture/2026-03-03-contabilidad-design/contabilidad-backlog.md`

### 5. Meter ahora un plan de cuotas completo

Tampoco.

Eso si seria complejidad accidental en esta fase.
La reunion deja claro que por ahora basta con:

- estado real
- abonos
- recibos
- evidencias
- proxima fecha

## Plan propuesto

### Fase 0 - Cerrar contrato antes del UI

1. Normalizar el significado de `status` en compras.
2. Introducir `paymentTerms` y `paymentState`.
3. Extender `monetary.ts` con `payable-payment`.
4. Definir tipos TS de `PurchasePaymentState`, `PurchasePaymentTerms` y `PurchasePaymentReceipt`.

Resultado esperado:

- ya no hay ambiguedad entre recepcion y pago

### Fase 1 - Persistencia correcta

1. Crear write path dedicado para `recordPurchasePayment`.
2. Guardar cada recibo en subcoleccion `paymentReceipts`.
3. Recalcular y persistir `paymentState` en la compra.
4. Mantener compra e inventario como hoy; no mezclar esto con `completePurchaseV2` todavia.

Resultado esperado:

- cada pago deja hecho financiero auditable

### Fase 2 - UI de compras

1. Reemplazar la semantica actual de `Fecha de Pago` por vencimiento inicial.
2. Agregar bloque resumen `Estado de pago`.
3. Agregar modal `Registrar pago`.
4. Agregar historial de recibos y evidencias.
5. Permitir registrar compra pagada de una vez creando automaticamente el primer recibo.

Resultado esperado:

- compras soporta contado, pendiente y parcial sin hacks

### Fase 3 - Listado y reporte

1. Agregar columnas `Estado de pago`, `Balance`, `Proximo pago`.
2. Agregar filtros por `paymentState.status`.
3. Marcar vencidas con semantica real, no por simple comparacion de `paymentAt`.

Resultado esperado:

- compras deja de ser solo informativa y pasa a ser operable financieramente

### Fase 4 - Migracion legacy

1. Mapear `paymentAt` viejo a `paymentTerms.originalDueAt`.
2. No inventar recibos historicos.
3. Marcar compras legacy sin evidencia suficiente como `needsReconciliation = true`.
4. Mostrar badge `Legacy sin conciliar` donde aplique.

Resultado esperado:

- no fingimos que la historia vieja esta limpia cuando no lo esta

### Fase 5 - Endurecimiento posterior

1. Evaluar `recordPurchasePayment` en backend si se quiere idempotencia fuerte.
2. Luego evaluar backendizacion de `completePurchase`.
3. Solo despues conectar compras a eventos contables fuertes.

Esto coincide con lo ya documentado en arquitectura:

- `plans/architecture/2026-03-03-contabilidad-design/README.md:692`
- `plans/architecture/2026-03-03-contabilidad-design/README.md:997`

## Testing minimo para considerarlo bien cerrado

### Dominio

- compra en moneda funcional, sin deuda
- compra en moneda funcional, parcial
- compra en `USD`, deuda abierta
- pago parcial posterior con otra tasa
- pago final que cierra balance
- compra legacy sin recibos

### UI

- crear compra a credito
- registrar primer pago
- registrar segundo pago y actualizar proxima fecha
- cerrar compra al pagar total
- visualizar recibo y evidencia
- ver compra vencida en listado

### Compatibilidad

- compras existentes siguen cargando
- `PurchaseCompletionSummary` deja de mostrar `$` fijo y usa `monetary`
- tablas/reportes no se rompen si una compra vieja no tiene `paymentState`

## Conclusiones

La mejor forma de llevar esta modificacion a compras "bien bien" es:

- no convertir `compras` en un mega modulo de CxP ahora
- pero tampoco maquillar el problema con campos sueltos

La solucion correcta para esta fase es:

- compra como documento comercial
- `paymentState` como resumen
- recibos append-only por pago
- snapshot monetario tanto en compra como en pago
- UI dentro de compras, siguiendo el patron de claridad del panel de tasa de cambio

Ese punto medio no es un recorte.
Es el limite correcto entre complejidad esencial y complejidad accidental para lo que pide la reunion.
