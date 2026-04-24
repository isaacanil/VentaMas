# Cuenta bancaria estilo Odoo en VentaMas

## Problema

La configuración bancaria de VentaMas venía centrada en `módulo -> cuenta bancaria`.
Eso sirve para salir del paso, pero no es el modelo más sólido para tesorería.

Odoo trabaja más cerca de este orden:

1. `journal / cuenta de liquidez`
2. `métodos de pago`
3. `transacciones`
4. `conciliación`
5. `transferencias internas`

## Objetivo

Mover VentaMas a una tesorería más robusta y defendible, sin rehacer todo el dominio de golpe.

## Decisión recomendada

Adoptar un enfoque híbrido por fases:

- `P1`: cuenta base + reglas por método (`tarjeta`, `transferencia`) + overrides avanzados por flujo.
- `P2`: dashboard operativo por cuenta/journal con acciones visibles.
- `P3`: ledger de transacciones bancarias, transferencias internas y conciliación.

## Qué ya quedó alineado

- La UI principal ya no prioriza `Uso por módulo`.
- La configuración bancaria ahora prioriza:
  - `Cuenta base`
  - `Tarjeta`
  - `Transferencia`
  - `Ajustes avanzados por flujo`
- La resolución efectiva ahora sigue este orden:
  1. override por flujo
  2. cuenta específica del método
  3. cuenta base
  4. única cuenta activa disponible

## P1 recomendado

### 1. Cuenta base

Una cuenta bancaria operativa principal del negocio.

Se usa cuando:

- el flujo no tiene override
- el método no tiene cuenta específica

### 2. Reglas por método

Cada método bancario debe poder resolver así:

- `Tarjeta` -> cuenta base o cuenta específica
- `Transferencia` -> cuenta base o cuenta específica

Esto se parece más a Odoo que el modelo puramente por módulo.

### 3. Overrides avanzados por flujo

Mantenerlos, pero esconderlos como excepción:

- ventas
- gastos
- cuentas por cobrar
- compras

Solo deben usarse cuando el negocio realmente opera distinto por flujo.

## P2 recomendado

Crear una pantalla operativa de tesorería por cuenta similar al espíritu de Odoo:

- card/lista por cuenta bancaria
- saldo inicial
- estado activa/inactiva
- acciones visibles:
  - ver movimientos
  - transferir
  - configurar
  - conciliar después

## P3 recomendado

### Ledger bancario

Cada cuenta necesita movimientos visibles y auditables:

- cobros
- pagos
- transferencias
- ajustes
- reversos

### Transferencias internas

Flujos mínimos:

- banco -> caja
- caja -> banco
- banco -> banco

### Conciliación

Separar:

- operación bancaria
- conciliación bancaria

La conciliación debe vivir sobre transacciones, no sobre settings.

## No alcance inmediato

- sincronización bancaria
- feeds automáticos
- matching avanzado estilo ERP completo
- conciliación automática compleja
- journals contables completos tipo ERP

## Riesgos

- seguir mezclando settings con operación
- serializar configuración bancaria sin respetar método y cuenta base
- meter conciliación sin ledger previo

## Criterios de éxito de esta dirección

- la UI ya no se siente “módulo -> cuenta”
- `tarjeta` y `transferencia` tienen reglas explícitas y útiles
- la cuenta base existe como concepto central
- los overrides por flujo quedan como excepción avanzada
- la próxima iteración puede construir dashboard y ledger sin rehacer otra vez la base
