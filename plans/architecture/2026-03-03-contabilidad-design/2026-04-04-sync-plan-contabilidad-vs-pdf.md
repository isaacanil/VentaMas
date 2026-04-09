# Sync plan contabilidad vs auditoria PDF

Fecha original: `2026-04-04`
Actualizado con estado real del repo: `2026-04-05`

## Objetivo

Sincronizar el paquete de planes de contabilidad con:

- el estado real del repo
- la pasada reciente de `UI/UX` en `settings/accounting` y `/contabilidad`
- la auditoria externa del modulo contable

Este documento no reemplaza los planes detallados por frente. Sirve como capa de alineacion para decidir que sigue vigente, que ya cambio y que subio de prioridad.

## Lo que sigue siendo verdad

- `settings/accounting/catalogo` y `settings/accounting/perfiles-contables` ya son configuracion viva, no diseño teorico.
- `bankAccounts` y `exchangeRates` ya existen como base estructurada.
- la operacion fuerte sigue estando en ventas, `CxC`, compras, gastos y caja.
- el sistema sigue mejor modelado como `operacion -> subledger -> evento -> journal` que como `modulo -> asiento directo`.

## Lo que cambio desde marzo

### 1. La UI ya no esta en estado bruto

Estas superficies ya tuvieron una pasada fuerte de consistencia visual y jerarquia:

- `/settings/accounting/catalogo`
- `/settings/accounting/perfiles-contables`
- `/settings/accounting/cuentas-bancarias`
- `/settings/tasa-cambio`
- `/contabilidad/*` shell y paneles base

Por tanto, estos frentes no deben seguir apareciendo como si el problema principal fuera "falta de pantalla". El problema ahora es contrato, trazabilidad, control interno y cierre contable.

### 2. Ya existe una primera cadena contable parcial en codigo

Hoy ya existen en el repo:

- `createManualJournalEntry`
- `reverseJournalEntry`
- `closeAccountingPeriod`
- productor `invoice.committed`
- productor `purchase.committed`
- proyector `accountingEvents -> journalEntries`
- reportes backend para mayor, balanza, estado de resultados y balance general
- ruta propia de `CxP`

Eso obliga a dejar de describir `P1` y `P3` como si siguieran completamente vacios.

La lectura correcta ahora es:

- el pipeline contable ya tiene un primer corte real en codigo
- ese corte todavia no esta completo ni endurecido

### 3. Hay superficies visibles de mayor, pero no mayor cerrado

Hoy existen:

- `/contabilidad/libro-diario`
- `/contabilidad/libro-mayor`
- `/contabilidad/reportes`
- `/contabilidad/cierre-periodo`

Eso no significa que el pipeline `AccountingEvent -> postingProfiles -> journalEntries -> EEFF` este cerrado.

La lectura correcta es:

- existe el workspace contable visible
- existe un primer corte backend para reportes
- no existe todavia una capa contable plenamente confiable, reprocesable y completa

### 4. La auditoria externa sigue cambiando el orden de prioridades

La auditoria empuja cuatro brechas estructurales al frente de la cola:

1. conciliacion bancaria explicita
2. `CxP` navegable
3. trazabilidad documento↔asiento↔reporte
4. auditoria / change log / inmutabilidad

Esto sigue obligando a dejar de tratar esos frentes como "mejoras avanzadas" o "fase tardia sin fecha".

## Decision recomendada

Trabajar con tres tracks en paralelo, sin mezclar su naturaleza:

### Track A. Brechas estructurales

- implementacion de conciliacion bancaria a partir del diseno ya aterrizado
- ampliacion de cobertura de trazabilidad documento↔asiento
- politica de periodo y correccion operativa
- limpieza de datos reales del piloto

### Track B. Endurecimiento operativo

- datos reales del piloto
- evidencia y recibo de pagos proveedor
- cohortes fuera del piloto
- limpieza de lecturas legacy

### Track C. Pipeline contable

- endurecimiento de `pending_account_mapping` y replay operativo
- quitar fallback amplio de reglas
- estrategia de performance de aperturas del mayor
- exportacion estable y decision sobre `libro diario` backend

## Cambios concretos al paquete

### Se consideran documentos vivos

- `README.md`
- `contabilidad-backlog.md`
- `contabilidad-checklist.md`
- `2026-04-04-plan-ejecucion-prioridades-contabilidad.md`
- `2026-03-23-estado-actual-modulos-contables.md`
- `audit/2026-03-24-auditoria-semaforo-contabilidad.md`
- `2026-03-24-plan-implementacion-accounting-events-journal.md`
- `../../2026-04-02-accounting-design-system-v1.md`

### Se consideran snapshots historicos

- `2026-03-18-fase-siguiente-cierre-piloto-cohortes-y-eventos.md`
- `2026-03-24-reporte-integral-contabilidad-pantallas-asesor.md`
- `resumen-2026-03-10-flujo-y-alcance-actual.md`

## Preguntas abiertas que siguen bloqueando arquitectura

- como endurecer `pending_account_mapping` sin volver manual el cierre contable
- como cerrar aperturas del mayor sin leer historico completo
- como estabilizar exportaciones grandes del mayor
- cual es el documento base y la trazabilidad correcta en compras / `CxP` / recibos proveedor
- cual es la politica de `FX` para anticipos, parciales y revaluacion
- que politica de cierre se tomara: `reopen` o `lock dates + excepciones`
- si el ciclo de vida de asientos se queda en `posted/reversed` o si aparece `draft` mas adelante
- cuando el libro diario tambien debe pasar a un modelo backend equivalente

## Regla de mantenimiento

Antes de agregar un plan nuevo en este paquete:

- actualizar `README.md`
- decidir si el documento sera vivo o historico
- enlazarlo desde el backlog, checklist o desde la fuente de verdad correspondiente

Si no cumple eso, agrega ruido en vez de claridad.
