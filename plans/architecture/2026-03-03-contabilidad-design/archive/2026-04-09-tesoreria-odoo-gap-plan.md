# Tesorería estilo Odoo: gap analysis y plan para VentaMas

## Problema

VentaMas ya tiene piezas de tesorería, pero todavía no tiene un módulo robusto al estilo Odoo.

Hoy existe:

- `bankAccounts`
- `cashCount`
- `cashMovements` parciales en cuadre de caja
- resolución bancaria en pagos
- base contable para eventos como `internal_transfer.posted`

Pero aún falta una capa operativa coherente de tesorería.

## Qué hace Odoo

La investigación en documentación oficial muestra que Odoo organiza banca/tesorería alrededor de estas piezas:

1. `Bank and cash accounts`
2. `Journals`
3. `Payments`
4. `Transactions`
5. `Bank reconciliation`
6. `Reconciliation models`
7. `Internal transfers`
8. `Bank synchronization`

Fuentes oficiales:

- [Bank and cash accounts](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank.html)
- [Payments](https://www.odoo.com/documentation/19.0/applications/finance/accounting/payments.html)
- [Bank reconciliation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html)
- [Reconciliation models](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation_models.html)
- [Journals](https://www.odoo.com/documentation/19.0/applications/finance/accounting/get_started/journals.html)

## Lectura correcta del modelo de Odoo

Odoo no piensa principalmente en:

- `módulo -> cuenta bancaria`

Piensa más bien en:

- `cuenta/journal -> método de pago -> transacciones -> conciliación`

Eso significa:

- la cuenta bancaria es una entidad operativa viva
- los movimientos bancarios tienen su propia vista
- la conciliación vive sobre transacciones, no sobre settings
- las transferencias internas son un flujo explícito
- caja y banco se tratan como liquidez hermana, no como hacks aislados

## Qué ya tiene VentaMas

### 1. Cuentas bancarias

Existe una entidad formal de cuenta bancaria:

- [bankAccounts.ts](/c:/Dev/VentaMas/src/utils/accounting/bankAccounts.ts)

Incluye:

- nombre
- moneda
- tipo
- institución
- últimos 4 dígitos
- balance inicial
- estado activa/inactiva

### 2. Cuadre de caja

Existe una entidad operativa fuerte de cuadre:

- [types.ts](/c:/Dev/VentaMas/src/utils/cashCount/types.ts)

Incluye:

- apertura
- cierre
- billetes
- ventas
- pagos CxC
- gastos
- discrepancias

### 3. Movimientos de caja

Ya existe una capa parcial de `cashMovements` usada por cuadre:

- [usePaymentsForCashCount.ts](/c:/Dev/VentaMas/src/hooks/cashCount/usePaymentsForCashCount.ts)

### 4. Resolución bancaria en pagos

Ya existe lógica para:

- métodos bancarios
- cuenta base
- cuenta específica por método

principalmente en:

- [bankPaymentPolicy.ts](/c:/Dev/VentaMas/src/utils/payments/bankPaymentPolicy.ts)
- [methods.ts](/c:/Dev/VentaMas/src/utils/payments/methods.ts)

### 5. Base contable para transferencias

El dominio contable ya contempla:

- `internal_transfer.posted`
- `transfer_amount`

en:

- [postingProfiles.ts](/c:/Dev/VentaMas/src/utils/accounting/postingProfiles.ts)

## Qué falta respecto a Odoo

### Gap 1. Falta `cashAccount`

Hoy existe `cashCount`, pero no una entidad explícita de `cuenta de caja` comparable a la cuenta bancaria.

Esto impide separar bien:

- `caja como liquidez`
- `cuadre como sesión operativa`

### Gap 2. Falta `journal / liquidity account` unificado

Odoo trata banco y caja como journals de liquidez.

VentaMas hoy tiene:

- `bankAccounts` por un lado
- `cashCount` y `cashMovements` por otro

pero no una abstracción operativa común de liquidez.

### Gap 3. Falta ledger bancario

No vi una vista o colección equivalente a:

- transacciones bancarias
- líneas pendientes
- historial bancario reconciliable

La banca todavía está más cerca de `settings + selección de cuenta` que de un libro operativo.

### Gap 4. Falta conciliación bancaria real

No encontré:

- vista de conciliación bancaria
- transacciones por conciliar
- matching contra cobros/pagos
- write-off manual
- modelos de conciliación

Esto en Odoo es una parte central, no opcional.

### Gap 5. Faltan transferencias internas operativas

La base contable existe, pero no vi un flujo robusto y visible para:

- banco -> caja
- caja -> banco
- banco -> banco

### Gap 6. Falta dashboard operativo por cuenta

Odoo no deja la banca como una pantalla puramente de configuración.
Cada journal/cuenta tiene acciones operativas claras.

En VentaMas todavía falta una pantalla tipo:

- ver movimientos
- transferir
- revisar saldo
- conciliar

### Gap 7. Falta capa de `transactions first`

Odoo concilia transacciones.
VentaMas todavía resuelve mucho desde:

- settings
- formularios
- selecciones de cuenta

Eso está bien para `P1`, pero no alcanza para una tesorería madura.

## Decisión recomendada

No copiar Odoo completo.

Sí adoptar su estructura conceptual por fases:

## Alcance aprobado

Estos son los frentes aprobados para llevar VentaMas hacia una tesorería más robusta:

1. `cashAccount` explícita
2. un concepto unificado de liquidez tipo `journal/cuenta`
3. ledger bancario
4. transferencias internas operativas
5. conciliación bancaria real
6. dashboard operativo por cuenta

### Fase 1. Base operativa mínima

- `bankAccount` robusta
- `cashAccount` explícita
- resolución por `cuenta base + método`
- sin reglas ocultas por módulo

### Fase 2. Tesorería operativa

- dashboard de cuentas de liquidez
- acciones visibles por cuenta:
  - ver movimientos
  - transferir
  - configurar

### Fase 3. Ledger y conciliación

- ledger bancario
- ledger de caja
- transferencias internas
- conciliación bancaria

## P1 prioritario para VentaMas

### 1. Crear `cashAccount`

Entidad hermana de `bankAccount`.

Campos mínimos:

- `id`
- `businessId`
- `name`
- `currency`
- `status`
- `openingBalance`
- `openingBalanceDate`
- `notes`

### 2. Enlazar `cashCount` a `cashAccountId`

El cuadre no debe ser la cuenta.
Debe operar sobre una cuenta.

### 3. Consolidar `liquidity source`

Todo pago debe terminar apuntando a una fuente de liquidez real:

- `cash` -> `cashAccountId`

## Estado de implementación

### Vertical slice implementado en esta iteración

- `cashAccount` explícita con colección y modal de alta/edición
- dashboard operativo de tesorería con cuentas bancarias y de caja
- concepto unificado de liquidez en UI y hooks (`bank` + `cash`)
- ledger de liquidez en lectura para cuentas seleccionadas
- transferencias internas operativas con doble registro en ledger
- conciliación bancaria manual con registro de balance ledger y variación
- compatibilidad mínima con `cashCount.cashAccountId`

### Pendiente para una tesorería más profunda

- usar `cashAccountId` en apertura/cierre real de cuadre de caja
- generar ledger automático desde cobros/pagos/gastos existentes
- matching de conciliación contra transacciones individuales
- write-offs y modelos de conciliación
- dashboard separado por journal/cuenta si el volumen operativo crece
- `card/transfer` -> `bankAccountId`
- exponer selección manual de `bankAccount` o `cashAccount` en flujos operativos cuando exista ambigüedad real

### 4. Mantener la configuración bancaria ya simplificada

Dejar solo:

- `Cuenta base`
- `Tarjeta`
- `Transferencia`

sin lógica oculta por módulo.

### 5. Crear `Internal Transfer` mínimo

Flujos:

- `cash -> bank`
- `bank -> cash`

con asiento/evento contable correspondiente.

## P2 prioritario

### Dashboard de tesorería

Pantalla principal con tarjetas o filas por cuenta:

- cuentas bancarias
- cuentas de caja
- saldo inicial
- estado
- acciones

### Acciones mínimas

- `Ver movimientos`
- `Transferir`
- `Configurar`

### Resolución operativa en flujos de pago

Odoo resuelve rápido cuando el método ya está configurado, pero deja elegir
`journal` cuando la operación no tiene una cuenta única clara.

VentaMas debe hacer lo mismo:

- si hay una cuenta válida única para el método, resolver automáticamente
- si hay cuenta fija del método, usarla
- si hay cuenta de respaldo válida, usarla
- si hay `2+` cuentas válidas y no existe una regla clara, pedir selección manual

Esto aplica al menos a:

- `Ventas`
- `Compras`
- `Gastos`
- `CxC`
- `CxP`

Pendiente crítico de UX:

- mostrar selector de `Cuenta bancaria` o `Cuenta de caja` en el modal/formulario
  solo cuando exista ambigüedad real
- no pedir selección cuando solo haya una opción válida

## P3 prioritario

### Ledger bancario

Registrar movimientos visibles por cuenta:

- cobros
- pagos
- transferencias
- ajustes
- reversos

### Conciliación bancaria

Mínimo viable:

- transacción bancaria
- match manual con cobro/pago
- write-off / ajuste
- estado `pendiente / conciliada`

## No alcance todavía

- bank sync automático
- feeds bancarios
- modelos avanzados de conciliación automática
- batch payments estilo ERP completo
- journal engine completo a nivel Odoo

## Riesgos

- intentar construir conciliación sin ledger previo
- seguir mezclando caja con cuadre
- seguir dejando la cuenta bancaria como settings y no como operación
- meter demasiada complejidad antes de tener `cashAccount`

## Criterios de éxito

- banco y caja quedan modelados como liquidez explícita
- la UI bancaria deja de depender de lógica oculta por módulo
- existe transferencia interna mínima
- el sistema queda listo para ledger y conciliación sin rehacerse otra vez

## Orden recomendado

1. `cashAccount`
2. `cashCount.cashAccountId`
3. `internal transfer`
4. dashboard de tesorería
5. ledger de liquidez
6. conciliación bancaria
