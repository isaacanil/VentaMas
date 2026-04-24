# Plan maestro QA finanzas y contabilidad

Fecha: `2026-04-23`

Estado: `ACTIVE`

Alcance: `Contabilidad`, `Tesoreria`, `CxP`, `CxC`, `Compras`, `Ventas`, `Gastos`, `Caja`, `Reportes`

## Objetivo

Validar que VentaMas se comporta como sistema contable operacional real: cada documento de negocio genera trazabilidad consistente desde origen hasta asiento y reportes, usando identificadores friendly para negocio y contador.

Este plan reemplaza como guia operativa futura a:

- `archive/2026-04-05-contabilidad-cxp-checklist.md`
- `archive/2026-04-07-contabilidad-ciclo-completo-checklist.md`

Esos archivos quedan como evidencia historica de corridas anteriores.

## Principios de validacion

- Probar primero el flujo real en navegador o emulador; Vitest se agrega despues para cubrir el bug real.
- No aceptar UUID tecnico como referencia principal si existe NCF, factura, recibo, numero de compra o referencia de proveedor.
- Mantener `sourceDocumentId` tecnico para integridad interna; mostrar `documentReference` friendly en UI/export/reportes.
- Todo asiento posteado se corrige con reverso o evento compensatorio, no con edicion directa.
- Cada prueba debe registrar evidencia: documento origen, evento contable, asiento, reporte afectado y enlace de vuelta si aplica.

## Preparacion

| Check | Criterio |
| --- | --- |
| Negocio piloto | `generalAccountingEnabled` y rollout contable activos |
| Catalogo | Cuentas base completas y protegidas |
| Perfiles | Venta, compra, CxC, CxP, gasto, caja, banco, transferencia configurados |
| Caja | Caja abierta cuando el flujo sea efectivo |
| Banco | Al menos una cuenta bancaria activa para pruebas bancarias |
| Fiscal | Secuencia NCF disponible para facturas fiscales |
| Periodo | Periodo contable abierto para fecha de prueba |
| Residuos | `accountingEvents` sin `failed` ni `pending_account_mapping` previos sin clasificar |

## Evidencia minima por caso

| Campo | Ejemplo esperado |
| --- | --- |
| Documento friendly | `B01-000000339`, `Compra #129`, `REC-CXC-0001` |
| Documento tecnico | id Firestore del documento origen |
| Evento | `invoice.committed__<id>` |
| Asiento | `journalEntries/<id>` posted y balanceado |
| Reporte | Libro diario y libro mayor muestran referencia friendly |
| Navegacion | Origen -> `Ver asiento`; asiento -> `Ver origen` cuando aplique |
| Reverso | Asiento inverso o evento `*.voided` si el flujo se anula |

## Fase 0. Smoke sin crear datos

| ID | Prueba | Resultado esperado |
| --- | --- | --- |
| F0-01 | Abrir `/settings/accounting` | Configuracion carga sin errores, cuentas/perfiles visibles |
| F0-02 | Abrir `/contabilidad/libro-diario` | Lista carga, detalle abre, referencia visible no es UUID si existe friendly |
| F0-03 | Abrir `/contabilidad/libro-mayor` | Lineas cargan con documento friendly y enlace de asiento |
| F0-04 | Abrir `/contabilidad/reportes` | Reportes cargan sin romper paginacion/export |
| F0-05 | Abrir `/accounts-payable/list` | CxP carga aging, proveedor, saldo y acciones |
| F0-06 | Abrir facturas existentes | Modal muestra NCF/factura y `Ver asiento` cuando aplica |
| F0-07 | Abrir compras existentes | Accion `Ver asiento contable` apunta al asiento correcto |
| F0-08 | Abrir pagos CxC/CxP existentes | Historial muestra enlace a asiento por pago |

## Fase 1. Ventas, facturas y CxC

| ID | Flujo | Validaciones contables |
| --- | --- | --- |
| V-01 | Venta contado con NCF | `invoice.committed`, asiento balanceado, caja/banco + ingresos + impuestos |
| V-02 | Venta credito | `invoice.committed`, CxC creada, ingreso/impuesto contra cuenta por cobrar |
| V-03 | Venta mixta | Caja/banco y CxC separados correctamente |
| V-04 | Cobro CxC efectivo | `accounts_receivable.payment.recorded`, saldo CxC baja, caja sube |
| V-05 | Cobro CxC banco | Cuenta bancaria correcta, libro mayor muestra recibo/referencia |
| V-06 | Cobro parcial multiple | Aging y saldo quedan correctos en cada abono |
| V-07 | Cobro multi-factura | Trazabilidad conserva facturas relacionadas |
| V-08 | Anular cobro CxC | `accounts_receivable.payment.voided`, reverso contable, saldo restaurado |
| V-09 | Nota de credito venta | Revierte ingreso/impuesto/CxC o caja segun politica |
| V-10 | Factura atrasada | Alias de asientos existentes no cambia al reabrir reportes |

## Fase 2. Compras, CxP y proveedor

| ID | Flujo | Validaciones contables |
| --- | --- | --- |
| P-01 | Compra credito | `purchase.committed`, inventario/gasto contra CxP |
| P-02 | Compra contado efectivo | Debito inventario/gasto, credito caja |
| P-03 | Compra contado banco | Credito cuenta bancaria correcta |
| P-04 | Compra con factura proveedor | Libro diario/mayor muestra referencia proveedor o numero compra |
| P-05 | Pago CxP efectivo | `accounts_payable.payment.recorded`, CxP baja, caja baja |
| P-06 | Pago CxP banco | Banco correcto, referencia de recibo visible |
| P-07 | Pago parcial multiple | Saldo y aging correctos |
| P-08 | Anular pago CxP | `accounts_payable.payment.voided`, reverso, saldo restaurado |
| P-09 | Nota credito proveedor | Reduce CxP o inventario/gasto segun caso |
| P-10 | Devolucion compra | Revierte inventario y pasivo sin romper trazabilidad |

## Fase 3. Gastos, caja y tesoreria

| ID | Flujo | Validaciones contables |
| --- | --- | --- |
| T-01 | Gasto efectivo | `expense.recorded`, gasto contra caja |
| T-02 | Gasto banco | Gasto contra cuenta bancaria correcta |
| T-03 | Gasto credito | Obligacion pendiente coherente si el flujo existe |
| T-04 | Anular gasto | Reverso consistente |
| T-05 | Apertura caja | Estado operativo correcto, sin asiento si politica no lo exige |
| T-06 | Cierre caja | Cuadre operativo vs movimientos y asientos del turno |
| T-07 | Transferencia interna | `internal_transfer.posted`, salida y entrada balanceadas |
| T-08 | Importar estado bancario | Lineas importadas sin duplicar |
| T-09 | Conciliacion bancaria | Matching correcto, diferencias controladas |
| T-10 | Resolver linea bancaria | Ajuste crea asiento o vinculo segun politica |

## Fase 4. Reportes contables

| ID | Reporte | Validaciones |
| --- | --- | --- |
| R-01 | Libro diario | Fecha, asiento, documento friendly, origen, debito/credito |
| R-02 | Libro mayor | Cuenta, documento friendly, saldo, paginacion, export |
| R-03 | Balanza | Debitos = creditos, cuentas con saldo esperado |
| R-04 | Estado resultados | Ventas, costos, gastos e impuestos coherentes |
| R-05 | Balance general | Activos = pasivos + patrimonio |
| R-06 | Export libro diario | Referencias friendly estables |
| R-07 | Export libro mayor | No trunca registros del rango probado |
| R-08 | Asiento atrasado | No renumera alias ya visibles |

## Fase 5. Gobierno, seguridad y periodo

| ID | Prueba | Resultado esperado |
| --- | --- | --- |
| G-01 | Usuario sin permiso crea asiento manual | Bloqueado |
| G-02 | Usuario sin permiso reversa asiento | Bloqueado |
| G-03 | Cerrar periodo | Operaciones retroactivas bloqueadas o requieren politica explicita |
| G-04 | Reverso en periodo cerrado | Usa fecha/politica permitida, no edita asiento cerrado |
| G-05 | Replay evento | Idempotente, sin duplicar asientos |
| G-06 | Dead letter | Error visible, reprocesable y auditable |
| G-07 | Pending account mapping | Queda en cero o con cola explicada |
| G-08 | Cambio de perfil contable | Versionado o efecto futuro, no rompe asientos historicos |

## Fase 6. Multi-moneda y fiscal

| ID | Flujo | Validaciones |
| --- | --- | --- |
| FX-01 | Venta USD | Tasa guardada, asiento en moneda base, referencia moneda visible |
| FX-02 | Compra USD | Inventario/CxP con conversion correcta |
| FX-03 | Cobro parcial moneda extranjera | Diferencia cambiaria realizada si aplica |
| FX-04 | Pago parcial moneda extranjera | Diferencia cambiaria realizada si aplica |
| FX-05 | Revaluacion | Diferencia no realizada si la politica lo soporta |
| FISC-01 | Secuencia NCF | Backend reserva y UI muestra NCF correcto |
| FISC-02 | Nota credito fiscal | NCF propio y vinculo a factura original |
| FISC-03 | Reporte fiscal mensual | Documentos contables/fiscales conciliables |

## Automatizacion requerida despues de probar manual

| Capa | Tests |
| --- | --- |
| Functions unit | Builders de eventos, proyeccion, reportes, reversos |
| Functions integration | Venta, compra, CxC, CxP, gasto, transferencia, conciliacion |
| Frontend unit | Helpers de referencia friendly, alias estable, links contables |
| Frontend component | Modales factura/compra/pagos con `Ver asiento` |
| Browser smoke | Ruta completa documento -> asiento -> libro -> origen |
| Regression | Factura atrasada no renumera alias |

## Registro de corrida

Copiar esta tabla en cada corrida bajo `plans/testing/runs/YYYY-MM-DD-<tema>.md`.

| ID | Estado | Evidencia | Hallazgo | Accion |
| --- | --- | --- | --- | --- |
| F0-01 | pendiente |  |  |  |
| V-01 | pendiente |  |  |  |
| P-01 | pendiente |  |  |  |
| T-01 | pendiente |  |  |  |
| R-01 | pendiente |  |  |  |

## Orden recomendado de ejecucion

1. Fase 0: smoke sin crear datos.
2. Fase 1: venta contado, venta credito, cobro CxC, anulacion CxC.
3. Fase 2: compra credito, pago CxP, anulacion CxP.
4. Fase 3: gasto, transferencia, conciliacion bancaria.
5. Fase 4: libro diario, libro mayor, balanza, exportes.
6. Fase 5: permisos, cierre, replay, dead letters.
7. Fase 6: multi-moneda y fiscal.

## Criterio de cierre

- Todas las pruebas P0/P1 quedan ejecutadas con evidencia.
- Ningun flujo critico deja `accountingEvents.failed` sin explicar.
- Ningun flujo critico deja `pending_account_mapping` sin ruta de correccion.
- Todo documento operativo probado puede llegar a su asiento.
- Todo asiento probado puede explicar su origen.
- Reportes muestran identificadores de negocio, no ids tecnicos, cuando el documento tiene referencia friendly.
