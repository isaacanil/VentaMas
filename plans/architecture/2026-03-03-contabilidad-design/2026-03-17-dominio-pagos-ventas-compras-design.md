# Diseno: Dominio de Pagos para Ventas, CxC, Compras y CxP

Fecha: `2026-03-17`

## Objetivo

Definir una arquitectura de pagos que sirva para:

- ventas/facturas
- cuentas por cobrar
- compras
- futuras cuentas por pagar

sin mezclar dominios que tienen reglas distintas y sin duplicar contratos de forma caotica.

La pregunta central es esta:

- si conviene una sola coleccion de pagos para todo
- o si convienen colecciones separadas
- o si hace falta una estrategia intermedia mas profesional

## Respuesta corta

La recomendacion no es:

- reutilizar `accountsReceivablePayments` para compras
- ni crear dos sistemas totalmente duplicados
- ni mover hoy todo a una sola coleccion global como source of truth

La recomendacion es esta:

1. Mantener los pagos como dominio propio de cada flujo operativo.
2. Compartir un contrato base de pago, recibo y estado de saldo.
3. Dejar que AR y AP tengan sus propios ledgers y sus propias reglas de aplicacion.
4. Si luego hace falta una vista global de caja/banco/tesoreria, crear un read model unificado proyectado desde esos dominios.

Eso es mas cercano a un entorno profesional real:

- el documento comercial no se confunde con el evento de pago
- el estado de saldo del documento no se confunde con el recibo
- la tesoreria global no obliga a romper los dominios operativos

## Estado actual del repo

### 1. Facturas ya tienen un pago inicial embebido

La factura no esta vacia en materia de pagos.

Hoy el checkout de venta ya guarda:

- `paymentMethod[]`
- `payment.value`
- `change.value`

Evidencia:

- `src/features/cart/default/default.ts`
- `src/features/cart/types.ts`
- `src/components/modals/InvoiceForm/components/PaymentInfo/hooks/usePaymentInfo.ts`
- `src/types/invoice.ts`

Ese bloque representa lo cobrado al momento de emitir la factura. No representa todo el ciclo de cobro posterior.

Esto ya da precision para responder:

- cuanto se cobro al emitir
- con que metodo o metodos
- si hubo referencia
- si quedo faltante o cambio

### 2. Facturas tambien tienen un resumen posterior de saldo

Ademas del snapshot inicial, la factura ya guarda:

- `accumulatedPaid`
- `balanceDue`
- `paymentStatus`

Evidencia:

- `src/types/invoice.ts`
- `src/utils/invoice.ts`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `src/firebase/invoices/syncInvoicePaymentsFromAR.ts`

Importante: el worker de facturas parte del pago inicial del checkout y lo usa para sembrar `accumulatedPaid` cuando aplica.

Eso significa que ventas ya tiene un concepto, aunque todavia no este nombrado formalmente, de:

- pago inicial
- saldo acumulado
- balance pendiente

### 3. Cuentas por cobrar llevan los pagos posteriores en otro dominio

Los pagos posteriores de clientes no se guardan dentro de la factura como un documento completo de pago. Se guardan en:

- `accountsReceivablePayments`
- `accountsReceivableInstallmentPayments`
- `accountsReceivablePaymentReceipt`

Evidencia:

- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `src/firebase/accountsReceivable/payment/fbAddPayment.ts`
- `src/firebase/accountsReceivable/fbAddAccountReceivablePaymentReceipt.ts`
- `src/utils/accountsReceivable/types.ts`
- `src/schema/accountsReceivable/paymentAR.ts`

Ese flujo ya soporta cosas serias:

- pagos parciales
- pagos por cuota
- pagos por balance
- varios metodos de pago
- referencias
- recibo
- aplicacion a multiples cuentas en algunos casos

### 4. Compras hoy no tienen ese nivel de precision

Compras pide fecha de pago, pero no modela el pago real.

Evidencia:

- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/GeneralForm/GeneralForm.tsx`
- `src/utils/purchase/types.ts`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/tableConfig.tsx`

Y peor: el snapshot monetario de compra asume que todo quedo pagado.

Evidencia:

- `src/firebase/purchase/fbAddPurchase.ts`
- `src/firebase/purchase/fbCompletePurchase.ts`

Ambos archivos persisten:

- `paid: total`
- `balance: 0`

por lo que compras hoy tiene muy poca precision financiera real.

### 5. La conciliacion de caja ya sufre por no tener un contrato comun

El sistema ya necesita juntar dos fuentes distintas para saber dinero cobrado:

- pagos POS dentro de facturas
- pagos posteriores de `accountsReceivablePayments`

Evidencia:

- `src/hooks/cashCount/usePaymentsForCashCount.ts`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData.tsx`
- `functions/src/app/versions/v2/cashCount/controllers/runCashCountAudit.controller.js`

Eso no quiere decir que haya que colapsar todo en una sola coleccion operativa.

Lo que si demuestra es que hace falta una frontera formal entre:

- documento comercial
- evento de pago
- resumen de saldo
- vista global de tesoreria

## Que precision da el sistema actual

### Ventas / facturas

Precision actual: media-alta en el pago inicial, media en el ciclo completo.

Lo bueno:

- sabe cuanto se cobro al emitir
- sabe con que metodos
- soporta referencias
- puede recalcular saldo acumulado
- puede distinguir `unpaid`, `partial`, `paid`

Lo flojo:

- el contrato esta repartido entre factura y CxC
- hay duplicacion entre `paymentHistory` de factura y pagos reales en CxC
- no existe una abstraccion comun reutilizable para compras
- caja y auditoria tienen que unir shapes distintos

### Cuentas por cobrar

Precision actual: alta para aplicacion operativa, media para arquitectura compartida.

Lo bueno:

- modela pagos reales
- soporta cuotas
- genera recibos
- guarda metodos y referencias
- actualiza saldos

Lo flojo:

- el shape esta muy orientado a AR
- el nombre y la semantica no sirven tal cual para proveedores
- mezcla un poco pago, asignacion y recibo dentro del mismo flujo
- `paymentAR.ts` nace con metodos fijos y no refleja toda la variabilidad actual del dominio

### Compras

Precision actual: baja.

Hoy el sistema sabe:

- cuando se esperaba pagar

Pero no sabe bien:

- cuanto se pago realmente
- con que metodo
- cuando se abono
- que balance queda
- cual es el proximo pago
- cual evidencia respalda el pago

## Opciones de arquitectura

### Opcion A: una sola coleccion global de pagos para todo

Ejemplo:

- `businesses/{businessId}/payments/{paymentId}`

con campos como:

- `direction`
- `documentType`
- `documentId`
- `counterpartyType`
- `counterpartyId`

Ventajas:

- una sola fuente para reportes globales
- tesoreria y conciliacion futuras se simplifican
- menos dispersion de nombres

Problemas:

- AR y AP no son el mismo problema
- AR hoy necesita cuotas, multiples cuentas, recibos y reglas de aplicacion propias
- AP fase 1 necesita pagos a compra/proveedor, no un motor genericamente sobrecargado
- si todo entra en la misma coleccion operativa, aparecen campos opcionales por todas partes y la complejidad accidental sube
- la migracion desde `accountsReceivablePayments` seria mas costosa y arriesgada que el valor que entrega hoy

Conclusion:

No la recomiendo como source of truth operacional en esta etapa.

### Opcion B: dos colecciones separadas, pero cada una inventa su propio contrato

Ejemplo:

- `accountsReceivablePayments`
- `accountsPayablePayments`

sin una base comun real.

Ventajas:

- implementacion rapida
- cada dominio queda aislado

Problemas:

- se duplica validacion
- se duplica UI
- se duplican tipos
- se repite el mismo problema de drift que ya existe entre factura y CxC
- cualquier reporte global vuelve a mezclar shapes incompatibles

Conclusion:

Tampoco la recomiendo.

### Opcion C: contratos compartidos + ledgers por dominio + read model global opcional

Esta es la recomendada.

La idea es:

- AR sigue teniendo su ledger propio
- AP tendra su ledger propio
- ventas mantiene su snapshot de cobro inicial
- ambos lados comparten contratos base y utilidades
- si se necesita una vision global, se proyecta a un ledger de tesoreria

Ventajas:

- reduce complejidad accidental
- respeta las reglas reales de cada dominio
- permite compartir UI, validaciones y tipos
- deja un camino limpio para caja, auditoria y conciliacion

## Recomendacion de diseno

### 1. Separar cuatro conceptos que hoy estan mezclados

#### A. Snapshot de cobro del documento

Es lo que pasa al emitir una factura en caja.

En ventas ya existe y debe mantenerse como snapshot del checkout:

- metodos usados en ese momento
- monto cobrado en ese momento
- cambio o faltante en ese momento

No conviene forzar esto dentro de `accountsReceivablePayments`, porque no siempre es un cobro posterior de CxC. A veces es un cobro inmediato del POS.

#### B. Estado de pago del documento

Todo documento comercial debe tener un resumen financiero compacto.

Ejemplo:

```ts
type DocumentPaymentState = {
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  total: number;
  paid: number;
  balance: number;
  lastPaymentAt?: TimestampLike | null;
  nextPaymentAt?: TimestampLike | null;
  paymentCount?: number;
};
```

En facturas eso ya existe de forma parcial en:

- `accumulatedPaid`
- `balanceDue`
- `paymentStatus`

En compras hay que introducirlo de forma explicita.

#### C. Evento de pago

Cada pago real debe existir como hecho append-only.

Ese evento debe guardar:

- monto
- fecha real
- actor
- metodos
- referencias
- evidencia
- snapshot monetario

#### D. Recibo de pago

El recibo no es el pago en si ni el estado del documento.

Es una evidencia imprimible/auditable del pago aplicado.

## Contrato base compartido

Conviene crear algo como `src/types/payments.ts` con piezas reutilizables:

```ts
type PaymentDirection = 'inbound' | 'outbound';
type PaymentCounterpartyKind = 'client' | 'supplier';
type PaymentDocumentKind = 'invoice' | 'purchase';

type PaymentMethodEntry = {
  method: string;
  amount: number;
  reference?: string | null;
  status?: boolean;
};

type PaymentEvidence = {
  id: string;
  url: string;
  name?: string | null;
  mimeType?: string | null;
  uploadedAt?: TimestampLike | null;
  uploadedBy?: string | null;
};

type PaymentEventBase = {
  id: string;
  businessId: string;
  direction: PaymentDirection;
  counterpartyKind: PaymentCounterpartyKind;
  counterpartyId: string;
  documentKind: PaymentDocumentKind;
  documentId: string;
  amount: number;
  paymentDate: TimestampLike;
  methods: PaymentMethodEntry[];
  comments?: string;
  evidence?: PaymentEvidence[];
  createdAt: TimestampLike;
  createdBy: string;
  monetary?: Record<string, unknown> | null;
};
```

Esto no sustituye AR o AP.

Esto define el idioma comun.

## Como aplicar esto a ventas y CxC

### Factura

La factura debe seguir guardando:

- snapshot de checkout
- resumen del saldo del documento

Recomendacion pragmatica:

- no renombrar de golpe `accumulatedPaid`, `balanceDue` y `paymentStatus`
- crear un adaptador comun que los exponga como `paymentState`
- si mas adelante vale la pena, migrar el storage

Eso evita una migracion grande sin beneficio inmediato.

### Cuentas por cobrar

`accountsReceivablePayments` debe seguir existiendo como ledger de AR.

Pero debe alinearse con el contrato base:

- usar el tipo comun de `methods`
- soportar `evidence`
- soportar mejor metodos no triviales como `creditNote`
- dejar claro que el documento guarda el pago, y las cuotas guardan la aplicacion

En AR hay una distincion adicional que debe quedarse:

- pago
- asignacion del pago a cuotas/cuentas

Eso es propio del dominio y no hay que borrarlo para “generalizar”.

## Como aplicar esto a compras y futuras CxP

### Compra

La compra debe quedar como documento comercial y de recepcion, no como ledger de pago.

Debe agregar:

- `paymentTerms`
- `paymentState`

Y debe dejar de asumir:

- `paid = total`
- `balance = 0`

### Pago a proveedor

Aqui recomiendo crear un ledger propio de AP.

Dos alternativas de naming validas:

1. `businesses/{businessId}/accountsPayablePayments/{paymentId}`
2. `businesses/{businessId}/purchases/{purchaseId}/paymentReceipts/{receiptId}`

Mi preferencia:

- si el roadmap va a crecer a cuentas por pagar como modulo, usar `accountsPayablePayments`
- si la fase 1 vive estrictamente dentro de compras, usar `purchases/{id}/paymentReceipts`

Dado lo que pide la reunion y el estado del repo, el mejor equilibrio hoy es:

- compra con `paymentState`
- recibos/pagos append-only ligados a la compra
- contrato compatible con un futuro `accountsPayablePayments`

## Decidir entre una o dos colecciones

La respuesta profesional, para este repo, es:

- dos ledgers operativos por dominio
- un contrato comun
- un read model global si llega a hacer falta

En otras palabras:

- `accountsReceivablePayments` para cobros a clientes
- `accountsPayablePayments` o `purchase paymentReceipts` para pagos a proveedores
- no una sola coleccion operativa para todo

Pero tampoco dos contratos inventados por separado.

## Por que esto es mas preciso

Con el modelo actual:

- ventas sabe bien el cobro inicial
- CxC sabe bien el cobro posterior
- compras no sabe casi nada del pago real
- tesoreria global tiene que juntar shapes a mano

Con el cambio propuesto:

- cada pago real queda trazable
- el documento mantiene un resumen claro del saldo
- compras gana la misma precision que hoy solo tiene CxC
- metodos, referencias, evidencia y fecha se vuelven consistentes
- caja y reportes pueden consumir un contrato comun

## Por que esto es mas facil de mantener

Porque cada capa tiene una responsabilidad:

- documento: resumen y contexto comercial
- pago: hecho monetario real
- asignacion: a que saldo/cuota/aplicacion afecta
- recibo: evidencia auditada

Cuando esas cuatro cosas se mezclan, aparecen problemas como los actuales:

- la compra parece pagada aunque no lo este
- la factura necesita sincronizaciones extras
- caja debe hacer merges manuales
- UI y tipos empiezan a divergir

## Antipatrones que no recomiendo

### 1. Reutilizar `accountsReceivablePayments` para compras

No lo recomiendo porque su semantica hoy es de cliente, cuenta por cobrar y cuotas.

### 2. Copiar AR a AP cambiando nombres

Eso arrastra complejidad de cuotas y flujos que compras fase 1 no necesita.

### 3. Seguir guardando historial resumido sin recibos reales

`paymentHistory` en factura puede servir como resumen auxiliar, pero no debe ser la unica evidencia del pago.

### 4. Crear una sola coleccion global sin separar source of truth de reporting

Eso parece elegante al inicio y termina creando un pseudo-ERP generico con demasiados campos opcionales.

## Fases recomendadas

### Fase 0: contrato comun

1. Crear tipos compartidos de pagos.
2. Crear helpers para sumar metodos, balance y status.
3. Extender `monetary` para soportar pagos salientes a proveedor.

### Fase 1: compras / CxP

1. Introducir `paymentTerms` y `paymentState` en compras.
2. Crear recibos/pagos append-only ligados a compras.
3. Actualizar UI de compras para mostrar saldo real, ultimo pago y proximo pago.

### Fase 2: alinear ventas / CxC

1. Crear adaptador `invoice -> paymentState`.
2. Alinear `accountsReceivablePayments` al contrato base.
3. Agregar evidencia y limpiar drift de metodos.

### Fase 3: vista global de tesoreria

1. Crear un read model tipo `paymentEvents` o `treasuryMovements`.
2. Alimentarlo desde ventas POS, CxC y AP.
3. Usarlo para caja, conciliacion y auditoria global.

## Decision final

Si la pregunta es:

- "una sola coleccion o dos colecciones?"

la respuesta correcta para este sistema es:

- dos dominios operativos
- un solo contrato base
- una proyeccion global futura si hace falta

Si la pregunta es:

- "deberiamos hacer en facturas algo parecido a compras?"

la respuesta es:

- conceptualmente si
- pero no porque facturas este vacia
- sino porque ya tiene piezas correctas que hay que formalizar y alinear con compras

Facturas ya tiene parte del modelo.
Compras es la que esta atrasada.

La estrategia correcta no es “copiar compras en facturas” sino:

- definir el dominio de pagos una sola vez
- adaptar ventas/CxC a ese contrato
- implementar compras/AP correctamente desde el inicio
