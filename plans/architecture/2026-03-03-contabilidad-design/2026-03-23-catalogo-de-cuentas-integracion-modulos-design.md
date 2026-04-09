# Diseno: Catalogo de Cuentas + Integracion con Modulos Operativos

Fecha: `2026-03-23`
Actualizado con verificacion de repo: `2026-03-24`

## Objetivo

Definir como introducir `chartOfAccounts` en el sistema sin romper la arquitectura operativa ya acordada para Firestore:

- snapshots en el documento principal
- ledgers operativos por dominio
- backend transaccional para pagos y anulaciones
- tesoreria proyectada en `cashMovements`
- soporte multi-moneda con snapshot historico

La meta no es "agregar cuentas contables" como campos sueltos en ventas, compras o gastos.

La meta es abrir una capa contable general profesional y mantenible, conectada con:

- ventas y POS
- cuentas por cobrar
- compras y cuentas por pagar
- caja
- bancos
- gastos
- transferencias internas
- diferencial cambiario
- impuestos y libros fiscales cuando corresponda

## Respuesta corta

La recomendacion es esta:

1. `chartOfAccounts` no debe entrar como source of truth operativo.
2. Los modulos actuales deben seguir cerrando su propia logica con snapshots y ledgers de dominio.
3. La integracion correcta del catalogo de cuentas debe pasar primero por `AccountingEvents`.
4. `journalEntries` debe ser una proyeccion inmutable desde eventos confirmados.
5. Las pantallas operativas siguen leyendo snapshots del dominio, no el libro mayor.

En otras palabras:

- compra, factura, gasto, pago, caja y banco siguen resolviendo la operacion
- `AccountingEvent` expresa el hecho economico confirmado
- `chartOfAccounts` define donde cae ese hecho
- `journalEntries` registra el asiento resultante

## Estado actual del sistema

Hoy el repo ya tiene una base operativa util para llegar a contabilidad general. Ya existen como configuracion persistente:

- `chartOfAccounts`
- `accountingPostingProfiles`

Lo que todavia no existe como capa funcional completa es:

- `journalEntries`
- `trialBalance`
- `balanceSheet`
- `incomeStatement`

Lo que si existe y ya sirve como base:

- `paymentState` en snapshots operativos
- `accountsReceivable` y pagos CxC
- `accountsPayablePayments` y pagos a suplidor
- `supplierCreditNotes`
- `cashMovements`
- `bankAccounts`
- `exchangeRates`
- `accountsReceivableFxSettlements`
- `internalTransfers`
- UI y persistencia de `chartOfAccounts`
- UI y persistencia de `accountingPostingProfiles`

Esto confirma que el sistema ya esta en fase de subledgers operativos, no de libro mayor.

## Principios no negociables

### 1. El modulo operativo no pierde su verdad principal

- `Purchase.paymentState` sigue siendo la verdad operativa de CxP.
- `AccountReceivable.paymentState` o snapshot equivalente sigue siendo la verdad operativa de CxC.
- `Invoice` sigue siendo la verdad comercial/fiscal de la venta.
- `cashMovements` sigue siendo la proyeccion de tesoreria para caja y banco.

El libro mayor no reemplaza esas lecturas.

## 2. La contabilidad general entra despues del hecho confirmado

No se debe postear a contabilidad desde borradores o pantallas incompletas.

Los disparadores correctos son hechos confirmados como:

- factura emitida
- pago registrado
- pago anulado
- gasto registrado
- transferencia interna posteada
- nota de credito aplicada
- settlement FX confirmado

## 3. Toda anulacion contable se resuelve por reversa

Nunca se debe borrar o mutar el pasado para "cuadrar" el mayor.

Si un pago se anula:

- el documento operativo cambia a `void`
- se registra el movimiento de reversa que corresponda
- se emite el evento de anulacion
- se genera el asiento reverso en el periodo correcto

## 4. La asignacion a cuentas no se hardcodea en cada modulo

Los modulos no deben guardar reglas contables repetidas.

La capa correcta es:

- `chartOfAccounts`: define cuentas
- `postingProfiles`: define reglas de mapeo por evento
- `journal projector`: traduce evento + perfil en asiento

## 5. Moneda documento y moneda funcional se manejan por separado

El libro mayor debe postear en moneda funcional.

Los documentos operativos deben seguir guardando:

- moneda documento
- moneda funcional
- tasa aplicada
- carrying amount historico cuando aplique

La diferencia cambiaria no se esconde dentro del saldo; se registra como evento y como asiento separado.

## Alcance de modulos afectados

La entrada de `chartOfAccounts` afecta estos modulos:

1. Ventas POS y facturacion
2. Cuentas por cobrar
3. Compras
4. Cuentas por pagar
5. Gastos
6. Caja y cuadre
7. Bancos
8. Transferencias internas
9. Tasa de cambio y settlement FX
10. Impuestos y libros fiscales

## Arquitectura recomendada

## Capa 1: dominio operativo

Colecciones y documentos ya existentes o ya alineados:

- `invoices`
- `accountsReceivable`
- `accountsReceivablePayments`
- `purchases`
- `accountsPayablePayments`
- `supplierCreditNotes`
- `expenses`
- `cashMovements`
- `bankAccounts`
- `internalTransfers`
- `accountsReceivableFxSettlements`

Responsabilidad:

- cerrar la operacion
- guardar snapshots
- mantener estados y balances visibles
- soportar UX, auditoria operativa y recibos

## Capa 2: `AccountingEvents`

Nueva capa recomendada:

- `businesses/{businessId}/accountingEvents/{eventId}`

Responsabilidad:

- expresar un hecho economico confirmado
- ser inmutable
- ser idempotente
- servir de contrato comun para proyecciones

Campos minimos sugeridos:

- `id`
- `businessId`
- `eventType`
- `eventVersion`
- `status`
- `occurredAt`
- `recordedAt`
- `sourceType`
- `sourceId`
- `sourceDocumentType`
- `sourceDocumentId`
- `counterpartyType`
- `counterpartyId`
- `currency`
- `functionalCurrency`
- `monetary`
- `treasury`
- `payload`
- `dedupeKey`
- `idempotencyKey`
- `createdBy`

## Capa 3: `chartOfAccounts`

Coleccion ya existente como configuracion persistente por negocio:

- `businesses/{businessId}/chartOfAccounts/{accountId}`

Responsabilidad:

- definir las cuentas disponibles del negocio
- permitir desactivar cuentas sin perder historial
- soportar plantillas por pais o tipo de negocio

Campos minimos sugeridos:

- `id`
- `code`
- `name`
- `type`: `asset`, `liability`, `equity`, `income`, `expense`
- `subtype`
- `parentId`
- `postingAllowed`
- `status`
- `normalSide`: `debit` o `credit`
- `currencyMode`: `functional_only` o `multi_currency_reference`
- `systemKey` opcional para cuentas canonicas
- `metadata`

## Capa 4: `postingProfiles`

Coleccion ya existente como configuracion persistente por negocio:

- `businesses/{businessId}/accountingPostingProfiles/{profileId}`

Responsabilidad:

- mapear cada evento hacia las cuentas correctas
- permitir overrides por modulo, categoria o tipo de operacion
- evitar `if/else` contable regado por el backend

Campos sugeridos:

- `id`
- `eventType`
- `moduleKey`
- `conditions`
- `linesTemplate`
- `status`
- `priority`

Cada `linesTemplate` debe expresar:

- cuenta debito o credito
- regla de monto
- si la linea usa impuestos
- si la linea usa settlement FX
- si la linea se omite cuando el monto es 0

## Capa 5: `journalEntries`

Nueva capa recomendada:

- `businesses/{businessId}/journalEntries/{entryId}`

Responsabilidad:

- guardar el asiento final
- servir a reportes financieros formales
- dejar trazabilidad entre evento, perfil y lineas resultantes

Campos minimos sugeridos:

- `id`
- `businessId`
- `eventId`
- `eventType`
- `status`
- `entryDate`
- `periodKey`
- `description`
- `currency`
- `functionalCurrency`
- `totals`
- `sourceType`
- `sourceId`
- `lines`
- `createdAt`
- `createdBy`

Cada linea debe guardar:

- `lineNumber`
- `accountId`
- `accountCode`
- `accountName`
- `debit`
- `credit`
- `reference`
- `costCenterId` opcional
- `departmentId` opcional
- `metadata`

## Flujo general del sistema

El flujo correcto queda asi:

1. el modulo operativo confirma una transaccion
2. el modulo actualiza su snapshot y su ledger operativo
3. el backend emite `AccountingEvent`
4. el proyector contable toma el evento
5. busca el `postingProfile` aplicable
6. genera `journalEntry`
7. las proyecciones financieras consumen `journalEntries`

Regla clave:

- si falla la proyeccion contable, la operacion no debe quedar ambigua
- el dominio operativo sigue consistente
- el evento queda disponible para replay

## Reglas por modulo

## 1. Ventas POS y facturacion

### Evento base

- `invoice.committed`

### Regla operativa

- la factura sigue guardando su snapshot comercial, fiscal y monetario
- el pago inicial sigue viviendo en el checkout/factura
- si la venta fue a credito, el modulo de CxC abre el documento correspondiente

### Regla contable

Caso `cash sale`:

- debito: caja o banco segun metodo
- credito: ingresos por ventas
- credito: impuesto por pagar si aplica

Caso `credit sale`:

- debito: cuentas por cobrar clientes
- credito: ingresos por ventas
- credito: impuesto por pagar si aplica

### Regla de integracion

El modulo de ventas no debe decidir por si solo "que cuenta usar".

Debe emitir un evento con:

- monto neto
- impuestos
- metodo de pago
- si es contado o credito
- moneda
- referencias de caja/banco

## 2. Cuentas por cobrar

### Eventos base

- `receivable.created`
- `receivable.payment_recorded`
- `receivable.payment_voided`
- `receivable.fx_settlement_recorded`

### Regla operativa

- el snapshot del saldo sigue en `accountsReceivable`
- cuotas, pagos parciales y balance vencido siguen en el dominio CxC
- la UI de cobranza no lee `journalEntries`

### Regla contable

Cobro normal:

- debito: caja o banco
- credito: cuentas por cobrar clientes

Anulacion del cobro:

- debito: cuentas por cobrar clientes
- credito: caja o banco

Settlement FX de cobro:

- si hubo ganancia: credito a ingreso por diferencial cambiario
- si hubo perdida: debito a gasto por diferencial cambiario

La cuenta por cobrar se cierra por su valor funcional historico, no por la tasa del dia.

## 3. Compras

### Evento base

- `purchase.committed`

### Regla operativa

- `Purchase` sigue siendo el documento maestro del MVP
- `paymentState` y `paymentTerms` siguen siendo la verdad operativa del saldo
- recepcion, disputa y total vigente siguen resolviendose en el dominio de compras

### Regla contable

Compra de inventario a credito:

- debito: inventario
- debito: ITBIS acreditable o impuesto recuperable, si aplica
- credito: cuentas por pagar proveedores

Compra pagada de contado:

- debito: inventario o gasto segun naturaleza
- debito: ITBIS acreditable si aplica
- credito: caja o banco

## 4. Cuentas por pagar

### Eventos base

- `supplier.payment_recorded`
- `supplier.payment_voided`
- `supplier.credit_note_recorded`
- `supplier.credit_note_applied`

### Regla operativa

- `Purchase.paymentState` sigue resolviendo saldo visible
- `accountsPayablePayments` sigue siendo el ledger operativo
- `supplierCreditNotes` sigue siendo el ledger del saldo a favor

### Regla contable

Pago a proveedor:

- debito: cuentas por pagar proveedores
- credito: caja o banco

Anulacion del pago:

- debito: caja o banco
- credito: cuentas por pagar proveedores

Nota de credito de proveedor por devolucion o ajuste:

- debito: cuentas por pagar proveedores
- credito: inventario, devoluciones sobre compras o gasto ajustado segun origen

Saldo a favor por sobrepago:

- no debe perderse ni esconderse
- debe reflejarse como anticipo a proveedor o cuenta puente de credito a proveedor

## 5. Gastos

### Eventos base

- `expense.recorded`
- `expense.voided`
- `expense.payable_created` cuando aplique

### Regla operativa

Hay dos caminos validos:

1. gasto pagado al instante
2. gasto que se convierte en cuenta por pagar

### Regla contable

Gasto inmediato:

- debito: cuenta de gasto
- credito: caja o banco

Gasto por pagar:

- debito: cuenta de gasto
- credito: cuentas por pagar proveedores

Pago posterior del gasto por pagar:

- debito: cuentas por pagar proveedores
- credito: caja o banco

## 6. Caja y cuadre

### Evento base

- no toda apertura o cierre de caja necesita un asiento
- lo que si necesita asiento es el movimiento economico real que afecte fondos

### Regla operativa

- `cashMovements` sigue siendo el ledger de tesoreria para cuadre
- el cuadre de caja no debe depender del libro mayor para cerrar rapido
- si se anula un pago con el turno ya cerrado, la reversa monetaria cae en el turno actual o en ajuste pendiente

### Regla contable

- el asiento de caja se deriva del evento de origen
- no se genera un asiento extra solo por existir `cashMovement`
- `cashMovement` y `journalEntry` deben quedar enlazados por `eventId`

## 7. Bancos

### Regla operativa

- `bankAccounts` sigue siendo maestro de tesoreria
- los pagos bancarios deben referenciar `bankAccountId`
- la UI bancaria futura debe leer saldos de tesoreria y luego conciliar contra banco real

### Regla contable

- toda salida o entrada bancaria que nace de venta, cobro, pago, gasto o transferencia produce su asiento correspondiente
- la cuenta bancaria es una cuenta de activo del catalogo

## 8. Transferencias internas

### Evento base

- `internal_transfer.posted`
- `internal_transfer.voided` si luego se habilita

### Regla operativa

- `internalTransfers` sigue siendo el documento maestro de ese movimiento
- `cashMovements` registra un `out` y un `in`
- no es gasto ni ingreso

### Regla contable

Caja hacia banco:

- debito: banco
- credito: caja

Banco hacia caja:

- debito: caja
- credito: banco

Banco a banco:

- debito: banco destino
- credito: banco origen

## 9. Tasa de cambio y diferencial cambiario

### Eventos base

- `fx_settlement.recorded`
- `fx_settlement.voided`

### Regla operativa

- el documento original mantiene su snapshot historico
- el pago guarda su snapshot monetario propio
- el saldo operativo llega a 0 por el valor documento pactado

### Regla contable

La diferencia entre:

- carrying amount funcional historico del documento
- monto funcional real del settlement

debe caer en:

- ingreso por diferencial cambiario, o
- gasto por diferencial cambiario

Nunca se debe esconder dentro del balance del documento.

## 10. Impuestos y libro fiscal

### Regla operativa

- `ncfLedger` y libros fiscales no son el libro mayor
- siguen siendo una capa fiscal/regulatoria

### Regla contable

- los impuestos de venta y compra deben tener cuentas propias en el catalogo
- la capa fiscal puede compartir `sourceDocumentId` y `eventId`, pero no se fusiona con el mayor

## Catalogo de cuentas minimo sugerido

No hace falta abrir un plan gigante desde el primer corte.

Hace falta una semilla minima, profesional y extensible.

### Activos

- caja general
- cajas por sucursal o punto de venta
- bancos operativos
- cuentas por cobrar clientes
- anticipos a proveedores
- inventario
- ITBIS acreditable o impuesto recuperable
- transferencias internas en transito, si se necesita cuenta puente

### Pasivos

- cuentas por pagar proveedores
- impuestos por pagar
- salarios y acumulaciones por pagar
- anticipos de clientes, si luego se habilita

### Patrimonio

- capital
- resultados acumulados

### Ingresos

- ventas gravadas
- ventas exentas
- otros ingresos
- ganancia por diferencial cambiario

### Gastos

- costo o compras segun modelo que se adopte
- energia electrica
- internet y telecom
- nomina
- alquiler
- mantenimiento
- comisiones bancarias
- perdida por diferencial cambiario
- devoluciones y ajustes si se quieren separar

## Reglas de configuracion

## 1. Semilla por negocio

Cada negocio debe iniciar con una plantilla base:

- por pais
- por tipo de empresa
- con codigos recomendados

El negocio luego puede:

- renombrar cuentas
- desactivar cuentas no usadas
- agregar subcuentas

## 2. Cuentas canonicas por `systemKey`

Para no romper integraciones, varias cuentas deben tener `systemKey` estable:

- `cash_main`
- `bank_operating`
- `accounts_receivable_trade`
- `accounts_payable_trade`
- `inventory_merchandise`
- `tax_payable_sales`
- `tax_credit_purchases`
- `fx_gain`
- `fx_loss`

El usuario puede cambiar nombre o codigo, pero no la identidad logica.

## 3. `postingProfiles` con override gradual

Orden recomendado de resolucion:

1. override especifico del documento o categoria
2. perfil del modulo
3. perfil canonico del negocio
4. plantilla por defecto

Esto evita que una venta o gasto quede sin cuenta por un hueco de configuracion.

## 4. Politica de bloqueos

Si falta una cuenta obligatoria para postear:

- la operacion operativa no debe quedar corrupta
- el evento debe quedar en estado `pending_account_mapping`
- el proyector debe reintentar cuando se cierre el hueco

## Reglas de consistencia en Firestore

## 1. Un solo source of truth por responsabilidad

- documento operativo: verdad operativa
- `AccountingEvent`: verdad del hecho economico confirmado
- `journalEntry`: verdad del asiento
- proyeccion financiera: verdad del reporte

No dupliques el mismo saldo como verdad primaria en varios lados.

## 2. Idempotencia obligatoria

Cada evento debe poder reprocesarse sin duplicar asiento.

Por eso se necesitan:

- `dedupeKey`
- `eventVersion`
- `projectorVersion`
- `status`

## 3. Reversas en vez de mutacion destructiva

Los `void` deben producir:

- evento de anulacion
- asiento reverso
- referencia cruzada con el evento original

## 4. Los snapshots no se recalculan desde `journal`

No se debe abrir una tabla de compras o CxC leyendo lineas del mayor para calcular balance.

Eso rompe costo, latencia y claridad del dominio.

## Fases recomendadas

## Fase 0

- cerrar shape de `AccountingEvent`
- inventariar eventos por modulo
- validar `chartOfAccounts` minimo ya persistido
- completar `postingProfiles` canonicos ya persistidos

## Fase 1

- emitir eventos desde ventas, CxC, CxP, gastos y transferencias internas
- dejar replay y dead letters

## Fase 2

- crear proyector de `journalEntries`
- soportar asiento directo y asiento reverso
- validar balance por evento

## Fase 3

- trial balance
- mayor por cuenta
- estado de resultados
- balance general

## Decisiones concretas recomendadas

1. No meter `accountId` contable directo en cada documento operativo como verdad primaria.
2. Completar `chartOfAccounts` y `postingProfiles` por negocio y usarlos como configuracion, no como source of truth operativo.
3. Abrir primero `AccountingEvents`.
4. Postear a `journalEntries` por proyeccion, no directamente desde frontend.
5. Mantener `cashMovements` como ledger de tesoreria y no reemplazarlo por el libro mayor.
6. Mantener `ncfLedger` como capa fiscal separada.
7. Tratar FX como evento y asiento explicito.

## Resultado esperado

Si el sistema sigue este diseno:

- ventas, compras, CxC, CxP, gastos, caja y bancos seguiran operando rapido
- Firestore seguira leyendo snapshots donde importa
- el catalogo de cuentas entrara sin romper la fase operativa
- el libro mayor sera auditable y reprocesable
- los reportes financieros podran nacer sobre una capa consistente

Si se intenta meter `chartOfAccounts` directo dentro de cada modulo sin eventos ni perfiles de posteos:

- aumentara el acoplamiento
- habra reglas duplicadas
- las anulaciones seran mas fragiles
- y el costo de mantener multi-moneda y tesoreria subira mucho
