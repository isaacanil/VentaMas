# Plan de tesoreria minima para cerrar el candado (2026-04-08)

## Problema
Hoy VentaMas ya distingue parcialmente entre efectivo y banco, pero lo hace con dos modelos asimetricos:

- `bankAccounts` existe como entidad explicita y configurable.
- `cashCount` existe como flujo operativo de apertura, cierre y cuadre.

El hueco es que `cashCount` esta cargando dos responsabilidades a la vez:

- sesion operativa de caja por cajero/turno
- fuente de liquidez para pagos en efectivo

Eso funciona para POS simple, pero se queda corto en cuanto el sistema mezcla ventas, CxC, CxP, gastos, diferencias de caja y transferencias internas.

## Objetivo
Cerrar el candado minimo de tesoreria sin meter sobreingenieria ni convertir esta fase en un ERP completo.

El objetivo de esta fase no es resolver toda la tesoreria enterprise. Es dejar una base defendible para:

- separar `caja` de `cuadre`
- separar `efectivo` de `banco`
- exigir una fuente de liquidez valida por movimiento
- soportar transferencias internas basicas

## Estado actual resumido

### Lo que ya existe
- `bankAccounts` como entidad formal y configurable.
- `cashCount` como flujo operativo de apertura/cierre/cuadre.
- reglas donde `cash` exige `cashCountId`.
- reglas donde `card` y `transfer` exigen `bankAccountId`.
- perfiles contables con cuentas `cash`, `bank`, diferencias de caja y transferencia interna.

### Lo que falta
- `cashAccount` como entidad operativa explicita equivalente a `bankAccount`.
- relacion formal `cashCount -> cashAccountId`.
- flujo operativo consistente para `caja -> banco` y `banco -> caja`.
- una frontera clara entre:
  - sesion operativa de caja
  - cuenta de liquidez en efectivo

## Restricciones
- No romper el flujo actual de ventas ni el cuadre de caja existente.
- No introducir conciliacion bancaria avanzada en esta fase.
- No redisenar toda la capa contable.
- No convertir esta iniciativa en un backlog infinito de tesoreria.

## Decision recomendada
Implementar una fase `P1` minima de tesoreria con cuatro piezas:

1. Crear `cashAccounts` como entidad explicita.
2. Enlazar cada `cashCount` a una `cashAccountId`.
3. Hacer que los pagos en efectivo dependan de `cashAccountId` y usen `cashCountId` solo como contexto operativo.
4. Implementar transferencias internas minimas:
   - `caja -> banco`
   - `banco -> caja`

Esto deja la base correcta sin meterse aun en reconciliacion bancaria avanzada, cajas compartidas complejas ni ledger enterprise completo.

## Alternativas descartadas

### 1. Seguir solo con `cashCount`
Descartada porque mantiene mezcladas las dos responsabilidades y sigue empujando logica de tesoreria dentro del cuadre.

### 2. Rehacer toda tesoreria de una vez
Descartada porque agrega complejidad accidental y retrasa valor. El repo no necesita un modulo full ERP para cerrar esta brecha ahora mismo.

### 3. Tratar caja solo como cuenta contable abstracta
Descartada porque no resuelve la capa operativa. Sirve para asientos, no para modelar la fuente real de efectivo en los flujos de negocio.

## Alcance P1

### 1. Entidad `cashAccount`
Ruta sugerida:

`businesses/{businessId}/cashAccounts/{cashAccountId}`

Shape minimo sugerido:

```json
{
  "name": "Caja principal",
  "status": "active",
  "currency": "DOP",
  "openingBalance": 0,
  "openingBalanceDate": null,
  "notes": null,
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

### 2. `cashCount` ligado a `cashAccountId`
Cada apertura de caja debe quedar asociada a una cuenta de caja concreta.

Regla:
- `cashCount` representa la sesion operativa
- `cashAccount` representa donde vive el efectivo

### 3. Regla uniforme por metodo de pago
- `cash` requiere `cashAccountId`
- `card` requiere `bankAccountId`
- `transfer` requiere `bankAccountId`
- `cashCountId` no sustituye una cuenta de liquidez; solo aporta contexto de turno/cajero

### 4. Transferencias internas minimas
Casos obligatorios:
- retiro de caja hacia banco
- reposicion de caja desde banco

Cada transferencia debe guardar:
- origen
- destino
- monto
- fecha
- usuario
- referencia o comentario

## Fuera de alcance por ahora
- conciliacion bancaria avanzada
- sync o feeds bancarios
- multiples cajas por sucursal con reglas complejas
- ledger unico de liquidez para todos los dominios
- cash pooling, forecast de tesoreria o controles enterprise avanzados

## Riesgos
- Mezclar una migracion de dominio con cambios de UI demasiado grandes.
- Seguir usando `cashCountId` como atajo aunque exista `cashAccountId`.
- Crear `cashAccount` pero no mover las validaciones, dejando el modelo duplicado.
- Querer resolver reportes avanzados antes de fijar el dominio base.

## Criterios de aceptacion
- Existe `cashAccount` configurable por negocio.
- Todo `cashCount` nuevo guarda `cashAccountId`.
- Todo flujo nuevo de efectivo exige `cashAccountId`.
- Todo flujo bancario exige `bankAccountId`.
- Se pueden registrar transferencias `caja -> banco` y `banco -> caja`.
- El cuadre de caja sigue funcionando sin degradar la operacion actual.

## Plan de implementacion

### Fase 1. Modelo y contratos
- Crear `cashAccounts` y sus tipos compartidos.
- Definir normalizacion, validaciones y estado minimo.
- Agregar `cashAccountId` al contrato operativo de `cashCount`.

### Fase 2. Reglas de negocio
- Ajustar utilidades de metodos de pago para depender de cuenta de liquidez y no solo de cuadre.
- Mantener `cashCountId` como contexto operativo cuando aplique.
- Alinear ventas, CxC, CxP y gastos para respetar la misma regla.

### Fase 3. Transferencias internas
- Crear flujo minimo para `caja -> banco` y `banco -> caja`.
- Registrar fuente, destino y monto de forma auditable.
- Reusar los perfiles contables existentes de transferencia interna donde ya aplique.

### Fase 4. Migracion controlada
- Permitir convivir temporalmente con datos legacy.
- No exigir backfill masivo antes de activar el nuevo flujo.
- Usar defaults controlados por negocio mientras se crean las primeras `cashAccounts`.

## Testing
- pruebas de validacion por metodo de pago
- pruebas de apertura de `cashCount` con `cashAccountId`
- pruebas de transferencia interna caja/banco
- pruebas de no regresion en facturacion, CxC, CxP y gastos en efectivo

## Prioridad recomendada

### Hacer ahora
- `cashAccount`
- `cashCount.cashAccountId`
- validacion uniforme por metodo de pago
- transferencias internas minimas

### Dejar para despues
- ledger completo de tesoreria
- conciliacion bancaria avanzada
- multiples cajas complejas por sucursal
- reporteria avanzada de liquidez

## Respuesta corta
Si VentaMas quiere parecerse mas a Odoo en tesoreria sin sobredisenar, la siguiente pieza correcta no es otra pantalla de cuadre: es introducir `cashAccount` y anclar el sistema de caja a una cuenta de liquidez real.
