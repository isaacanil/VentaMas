# Playbook: Cambiar Logica sin Afectar Produccion

Fecha: `2026-03-17`

## Objetivo

Definir como introducir cambios de logica en produccion sin romper la operacion diaria cuando el cambio vive en:

- una Cloud Function callable o HTTP
- un trigger de Firestore
- un cron o scheduled job
- el frontend
- scripts de backfill o migracion

Este documento no es solo teoria. Es el playbook recomendado para este repo.

## Principio general

No se cambia produccion en un solo paso.

Siempre separar:

1. `deploy`
2. `activacion`
3. `corte de lecturas`
4. `deprecacion`

La regla es:

- primero subes el codigo nuevo
- luego lo activas por flag o por negocio piloto
- luego validas
- luego cambias lecturas
- luego apagas lo viejo

## Patrones que ya existen en este repo

El repo ya tiene buenos ejemplos de rollout controlado:

- versionado por carpetas `functions/src/app/versions/v2/*`
- rollout por negocio con `isAccountingRolloutEnabledForBusiness`
- idempotencia en facturacion
- outbox en `invoicesV2/{invoiceId}/outbox/*`

Evidencia:

- [functions/src/app/versions/v2/invoice/services/orchestrator.service.js](/C:/Dev/VentaMas/functions/src/app/versions/v2/invoice/services/orchestrator.service.js)
- [functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js](/C:/Dev/VentaMas/functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js)
- [functions/src/app/versions/v2/invoice/triggers/outbox.worker.js](/C:/Dev/VentaMas/functions/src/app/versions/v2/invoice/triggers/outbox.worker.js)
- [functions/src/app/versions/v2/accounting/utils/accountingRollout.util.js](/C:/Dev/VentaMas/functions/src/app/versions/v2/accounting/utils/accountingRollout.util.js)

## Reglas base

### 1. No cambiar escritura y lectura en el mismo release

Primero:

- escribes nuevo
- sigues leyendo viejo

Despues:

- validas
- cambias lectura

### 2. Toda nueva logica con side effects debe ser idempotente

Si la function puede:

- crear docs
- mover saldos
- afectar caja
- duplicar pagos

debe tener:

- clave de idempotencia
- marcador de ejecucion
- o una escritura comprobable que impida duplicados

### 3. El rollout debe ser por negocio o por flag, no global

Lo mas seguro en este repo es activar primero por:

- `businessId`
- modulo
- modo `observe` o `shadow`

### 4. El rollback debe ser por configuracion siempre que se pueda

Si para revertir necesitas redeploy urgente, ya llegaste tarde.

La meta es poder apagar:

- la escritura nueva
- la lectura nueva
- o ambas

por flag.

## Caso A: Cloud Function callable o HTTP

Ejemplos de este tipo en el repo:

- `createInvoiceV2`
- `createInvoiceV2Http`
- `processAccountsReceivablePayment`

### Cuando usar `V2` o nombre nuevo

Usa una function nueva si cambia:

- contrato de entrada
- contrato de salida
- semantica fuerte del flujo
- permisos o side effects principales

Ejemplo:

- `processAccountsReceivablePaymentV2`
- `createSupplierPaymentV2`

### Cuando no hace falta `V2`

No hace falta una function nueva si:

- la firma externa no cambia
- el cambio es interno
- el flujo nuevo se puede activar por flag

En ese caso:

- mantienes el mismo endpoint
- haces branching interno por rollout

### Estrategia recomendada

1. Extraer la logica nueva a un handler separado.
2. Mantener el handler viejo intacto.
3. Agregar un router minimo:
   - si flag apagado -> viejo
   - si flag en shadow -> viejo + nuevo en comparacion
   - si flag encendido -> nuevo
4. Loguear diferencias en modo shadow.
5. Solo despues de validar, activar el nuevo camino.

### Modo shadow para callable/HTTP

En `shadow mode`:

- responde usando la logica vieja
- ejecuta la nueva sin side effects o hacia proyecciones aisladas
- compara resultados
- guarda diff y metricas

Usarlo cuando el riesgo es:

- saldo
- caja
- pagos
- impuestos

### Dual-write para callable/HTTP

Si la function crea una nueva estructura, por ejemplo `cashMovements`:

- la verdad operativa vieja se mantiene
- la function escribe tambien en la estructura nueva
- la UI sigue leyendo la vieja

Esto es el patron correcto para pagos/caja.

### Rollback

Para rollback:

- apagar flag
- volver a ruta vieja
- mantener escrituras nuevas pausadas

No borrar datos nuevos en caliente salvo que haya corrupcion clara y script de compensacion.

### Deploy recomendado

Si introduces una function nueva:

```powershell
firebase deploy --only "functions:NombreDeLaFuncionV2"
```

Si solo cambias una function existente:

```powershell
firebase deploy --only "functions:NombreDeLaFuncion"
```

## Caso B: Trigger de Firestore

Ejemplos de este tipo en el repo:

- `processInvoiceOutbox`
- `processInvoiceCompensation`
- `updatePendingBalance`

### Regla principal

No recomiendo tener dos triggers productivos sobre la misma ruta haciendo side effects fuertes al mismo tiempo.

Ejemplo peligroso:

- trigger viejo actualiza saldo
- trigger nuevo tambien actualiza saldo

Eso duplica escrituras y abre inconsistencias.

### Patron recomendado

#### Opcion 1: un solo trigger, branching interno

Es la opcion preferida cuando el trigger ya es el punto de entrada oficial.

Patron:

1. el trigger sigue siendo uno
2. detecta si aplica rollout
3. ejecuta logica vieja o nueva
4. en shadow solo escribe proyecciones no criticas

#### Opcion 2: trigger fino + worker por outbox

Es mejor cuando la logica es compleja.

Patron:

1. el trigger solo detecta el evento
2. crea una tarea de outbox o work item
3. un worker decide como procesarla

Esto ya existe en facturacion con `invoicesV2/outbox`.

### Cuando usar shadow mode en trigger

Se puede usar si la nueva logica:

- no toca saldos primarios
- o solo escribe una proyeccion nueva

Ejemplo seguro:

- trigger viejo sigue igual
- trigger nuevo o rama nueva solo escribe `cashMovements`

Ejemplo no seguro:

- trigger viejo y nuevo ambos recalculan `accountsReceivable.arBalance`

### Idempotencia en triggers

Como los triggers pueden reintentarse, siempre debes tener:

- marcador de procesamiento
- clave de evento
- comparacion de estado previo y nuevo
- escritura con guardas

Si el trigger emite documentos derivados:

- usa ids deterministas o verificables
- o guarda `sourceEventId`

### Rollback

El rollback ideal en trigger es:

- apagar la rama nueva por flag
- dejar solo la vieja

Si el trigger nuevo solo genera proyecciones:

- puedes dejar los datos proyectados y simplemente dejar de poblarlos

### Deploy recomendado

```powershell
firebase deploy --only "functions:NombreDelTrigger"
```

## Caso C: Scheduled Job / Cron

Ejemplos de este tipo en el repo:

- `reconcilePendingBalanceCron`
- `syncAccountingExchangeRateReferencesDaily`
- `runCashCountAudit`

### Regla principal

Nunca activar un cron nuevo que escriba sobre datos productivos sin una fase previa de observacion.

### Estrategia recomendada

1. Crear la logica nueva en modo `dry-run` o `observe`.
2. Loguear:
   - cuantos docs tocaria
   - cuales diferencias encontro
   - cuales errores encontro
3. Validar en negocio piloto.
4. Encender escritura real por flag.

### Patron seguro

- `mode = observe`
- `mode = shadow-write`
- `mode = active`

En `observe`:

- no cambia datos

En `shadow-write`:

- solo llena colecciones nuevas o logs de comparacion

En `active`:

- ya cambia estado operativo

### Rollback

El rollback es:

- cambiar modo a `observe`
- o deshabilitar el cron

### Deploy recomendado

```powershell
firebase deploy --only "functions:NombreDelCron"
```

## Caso D: Frontend

### Regla principal

El frontend no debe ser el primer lugar donde “cortas” un cambio crítico.

El backend debe estar listo antes.

### Estrategia recomendada

#### Fase 1: backend listo, frontend viejo

- backend ya acepta/escribe nuevo
- frontend sigue leyendo viejo

#### Fase 2: frontend dual-write si aplica

Solo si el frontend todavia escribe directo a Firestore y no hay backend centralizado.

En ese caso:

- escribe viejo + nuevo
- sigue leyendo viejo

#### Fase 3: frontend cambia lectura con fallback

Patron:

- intenta leer nuevo
- si falta, cae a viejo

Esto es ideal para:

- `paymentState`
- `cashMovements`
- nuevas proyecciones

#### Fase 4: frontend deja de leer viejo

Solo cuando el backfill y la auditoria ya cerraron.

### Qué no hacer en frontend

- cambiar lectura y escritura en el mismo PR
- asumir que todos los documentos historicos ya tienen el shape nuevo
- borrar compatibilidad antes de correr backfill

## Caso E: Scripts de Backfill o Migracion

### Regla principal

Los scripts de backfill no deben inventar verdad operativa.

Ejemplo:

- compras legacy sin recibo real

No debes:

- crear pagos ficticios

Debes:

- migrar lo verificable
- marcar lo incierto como legacy o revisar manualmente

### Estrategia recomendada

1. Script `dry-run`.
2. Muestra:
   - docs leidos
   - docs a modificar
   - campos calculados
   - errores
3. Validacion manual de muestra.
4. Ejecucion acotada por negocio piloto.
5. Ejecucion por lotes con checkpoint.

### Rollback

Para datos de backfill:

- guardar `migratedAt`
- guardar `migrationVersion`
- guardar `migratedFromLegacy`

Si el cambio es reversible:

- guardar snapshot previo

Si no es reversible:

- no correrlo hasta validar completamente el `dry-run`

## Playbook recomendado por tipo de cambio

### 1. Cambio en una callable/HTTP crítica

Patron:

1. handler nuevo separado
2. flag por negocio
3. shadow mode
4. dual-write si hay nueva proyeccion
5. activar piloto
6. cambiar frontend
7. apagar camino viejo

### 2. Cambio en un trigger crítico

Patron:

1. un solo trigger
2. branching por flag
3. side effects nuevos solo a proyeccion nueva al inicio
4. activar piloto
5. validar
6. cambiar camino principal

### 3. Cambio en cron

Patron:

1. observe
2. shadow-write
3. active

### 4. Cambio en frontend

Patron:

1. escribir compatible
2. leer viejo
3. fallback nuevo/viejo
4. cortar viejo

## Aplicacion concreta al dominio de pagos y caja

### Si cambiamos `processAccountsReceivablePayment`

No haria esto:

- editar la function actual y cambiar todo de golpe

Haria esto:

1. extraer `buildCashMovementsFromReceivablePayment`
2. dejar `processAccountsReceivablePayment` igual en saldo y recibo
3. agregar dual-write de `cashMovements` por negocio piloto
4. comparar cuadre viejo vs `cashMovements`
5. luego migrar lecturas de caja

### Si cambiamos el worker de `invoicesV2`

No haria esto:

- cambiar el attach a caja y la proyeccion de pagos de una vez

Haria esto:

1. usar el worker actual como punto oficial
2. emitir `cashMovements` en paralelo
3. no tocar todavia la lectura del cuadre
4. validar piloto
5. mover el cuadre a la nueva proyeccion

### Si agregamos pagos a proveedor

Haria esto:

1. crear `accountsPayablePayments`
2. no tocar compras legacy
3. dual-write a `cashMovements`
4. leer caja desde `cashMovements`

## Checklist antes de activar

Antes de prender una logica nueva en produccion:

1. Tiene flag por negocio o modulo.
2. Tiene estrategia de rollback.
3. Tiene idempotencia.
4. No cambia lectura y escritura a la vez.
5. Puede correr en shadow sin side effects criticos.
6. Tiene logs de comparacion.
7. Tiene plan de backfill si introduce estructura nueva.
8. Tiene validacion sobre negocio piloto.

## Checklist antes de cortar lo viejo

1. La estructura nueva ya se esta poblando.
2. El backfill ya corrio.
3. La UI soporta fallback.
4. La auditoria entre viejo y nuevo da estable.
5. El rollback sigue siendo posible.

## Decision final

Para este repo, el patron recomendado es:

- callable/HTTP: `V2` o branching por flag segun cambie o no el contrato
- trigger: un solo trigger con branching interno o trigger fino + outbox
- cron: `observe -> shadow-write -> active`
- frontend: dual-write y fallback antes del corte

Si hubiera que resumirlo en una frase:

- no despliegues cambios criticos como reemplazo inmediato; despliegalos como compatibilidad nueva, activalos por flag y corta despues de validar.
