# Auditoria semaforo contabilidad - 2026-03-24

Actualizado con lectura de auditoria externa: `2026-04-04`

## Estado del documento

Este documento sigue vigente como auditoria tecnica del flujo y sus invariantes.

No debe leerse como backlog unico ni como ultima palabra de prioridad UX/funcional.

El ajuste principal despues de la auditoria externa es este:

- conciliacion bancaria
- trazabilidad documento↔asiento
- `CxP` navegable
- auditoria / change log / inmutabilidad

dejan de ser "capas avanzadas" y pasan a tratarse como brechas estructurales tempranas.

## Alcance

Contraste del estado actual del repo contra reglas base de contabilidad financiera y fiscal:

- IFRS Conceptual Framework
- IFRS 15 Revenue from Contracts with Customers
- IAS 2 Inventories
- IAS 21 The Effects of Changes in Foreign Exchange Rates
- IFRIC 22 Foreign Currency Transactions and Advance Consideration
- IFRS 9 impairment para cuentas por cobrar
- Lineamientos DGII para NCF

Esto no sustituye criterio contable profesional local. Sirve como auditoria tecnica del flujo y de sus invariantes.

## Veredicto corto

La direccion general del repo es correcta:

- separar operacion, subledgers y libro mayor
- reconocer venta por hecho economico y no por cobro
- separar caja de banco
- mantener NCF/ITBIS como capa fiscal y no como sustituto del journal
- usar moneda funcional, moneda documental y snapshots de tasa

Los huecos grandes siguen aqui:

- gasto demasiado pegado al pago
- semantica de `purchase.committed` todavia sensible a interpretacion
- falta politica cerrada para anticipos y parciales en FX
- no existe todavia el pipeline real `AccountingEvent -> postingProfiles -> journalEntries -> reportes`

## Semaforo por modulo

| Modulo | Estado | Lectura |
| --- | --- | --- |
| Ventas | Verde | La venta puede reconocerse por `invoice.committed` sin depender del cobro. |
| CxC | Verde | El cobro vive separado de la venta y ya proyecta tesoreria aparte. |
| Compras | Amarillo | Va bien solo si `purchase.committed` significa compra validada o recepcionada, no simple pedido. |
| CxP | Amarillo | Existe subledger de pagos, pero falta terminar de cerrar evidencia, recibo y semantica de nacimiento del pasivo. |
| Gastos | Amarillo tirando a rojo | El flujo visible sigue demasiado orientado a pago y caja/banco. |
| Caja / Tesoreria | Verde operativo / Amarillo contable | `cashMovements` funciona como subledger, pero no debe usarse como libro mayor. |
| FX | Amarillo | La base monetaria va bien, pero faltan reglas cerradas para anticipos, parciales y diferencias de cambio. |
| NCF / ITBIS | Verde fiscal | La capa fiscal esta bien orientada si sigue separada del reconocimiento contable. |
| Mayor / Reportes | Rojo | Existen tipos, catalogo y perfiles, pero no el pipeline contable real ni reportes financieros. |

## Matriz priorizada

| Hallazgo | Impacto | Prioridad | Cambio recomendado |
| --- | --- | --- | --- |
| `cashMovements` corre el riesgo de convertirse en pseudo mayor | Duplicidad conceptual, reportes inconsistentes y reconciliacion dificil | Alta | Congelar su rol como tesoreria y definir el contrato formal hacia `journalEntries` en vez de expandirlo como ledger general |
| `expense.recorded` esta demasiado acoplado al pago | Estados financieros pueden subestimar pasivos y mezclar gasto devengado con desembolso | Alta | Separar `expense.recorded` de `expense.payment.recorded` o crear una variante clara para gasto por pagar / gasto acumulado |
| `purchase.committed` no esta blindado semanticamente | Riesgo de reconocer inventario o pasivo demasiado temprano o demasiado tarde | Alta | Fijar por documento y por codigo que `purchase.committed` solo nace cuando existe recepcion o validacion contable suficiente |
| FX no cierra anticipos ni pagos parciales | Tasas historicas, liquidaciones y ganancias/perdidas cambiarias pueden quedar mal calculadas | Alta | Definir politica de anticipos, parciales, realized FX y eventual revaluacion de saldos monetarios |
| No existen productores reales de `AccountingEvent` y `journalEntries` | No hay mayor ni estados financieros confiables aunque la operacion ya exista | Alta | Emitir eventos reales desde ventas, CxC, CxP y gastos antes de proyectar balances |
| Faltan controles de libro mayor | Reprocesos, duplicados y cierres inseguros | Media alta | Formalizar `eventVersion`, `dedupeKey`, idempotencia, dead letters, replay y period lock |
| No hay politica visible de deterioro de CxC | Riesgo de sobreestimar activos si mas adelante quieren estados financieros serios | Media | Dejarlo fuera del piloto, pero abrir backlog especifico para impairment bajo IFRS 9 |

## Orden recomendado de backend

1. Cerrar contratos fuente antes del mayor.

   Definir con precision semantica de `purchase.committed`, `expense.recorded`, `accounts_payable.payment.recorded` y la politica FX de anticipos y parciales.

2. Emitir `AccountingEvent` reales desde fuentes fuertes.

   Empezar por `invoice.committed`, `accounts_receivable.payment.recorded`, `accounts_payable.payment.recorded` y el flujo de gastos ya estabilizado.

3. Aplicar `accountingPostingProfiles` sobre eventos reales.

   El catalogo de cuentas y los perfiles ya existen como configuracion persistida. Lo pendiente es conectarlos al evento y persistir `journalEntries`.

4. Proyectar reportes sobre el journal.

   Abrir `trialBalance`, `balanceSheet` e `incomeStatement` solo despues de tener asientos trazables e idempotentes.

5. Agregar controles contables.

   Cierre de periodo, replay controlado, dead letters, versionado de evento y llaves de deduplicacion.

6. Abrir capa avanzada.

   Deterioro de `CxC`, `FX` realizado/no realizado y estados de cuenta mas completos.

## Ajuste de prioridad 2026-04-04

La recomendacion original de dejar conciliacion bancaria formal para una capa avanzada ya no es la mas conveniente.

Nueva lectura:

- conciliacion bancaria formal pasa a `P0/P1` estructural
- trazabilidad documento↔asiento tambien pasa a `P0/P1`
- auditoria visible y politica de reversos tambien pasan a `P0/P1`

Lo que si puede seguir diferido es:

- deterioro de `CxC`
- `FX` no realizado / revaluacion avanzada
- estados de cuenta mas ricos o localizaciones avanzadas

## Evidencia repo usada para esta lectura

- `src/utils/accounting/accountingEvents.ts`
- `src/types/accounting.ts`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`
- `plans/architecture/2026-03-03-contabilidad-design/politica-2026-03-12-exchange-rate-policy.md`

## Fuentes externas contrastadas

- IFRS Conceptual Framework: https://www.ifrs.org/content/dam/ifrs/meetings/2018/october/wss/wss5b-conceptual-framework.pdf
- IFRS 15: https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2024/issued/part-a/ifrs-15-revenue-from-contracts-with-customers.pdf?bypass=on
- IAS 2: https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/
- IAS 21: https://www.ifrs.org/issued-standards/list-of-standards/ias-21-the-effects-of-changes-in-foreign-exchange-rates/
- IFRIC 22: https://www.ifrs.org/issued-standards/list-of-standards/ifric-22-foreign-currency-transactions-and-advance-consideration/
- IFRS 9 impairment: https://www.ifrs.org/content/dam/ifrs/project/pir-9-impairment/rfi-iasb-2023-1-ifrs9-impairment.pdf
- DGII NCF: https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/facturacion/Documents/Comprobantes%20Fiscales/2-Guia-Informativa-NCF.pdf
- Portal DGII facturacion: https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/facturacion/Paginas/inicio.aspx
