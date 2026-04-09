# Reporte integral de contabilidad, modulos y pantallas para asesor

> Estado: `historical snapshot`
>
> Este documento sigue siendo util como inventario amplio para contexto y conversacion con asesoria.
> No debe leerse como plan activo principal.
> Para lectura vigente usar primero:
> `README.md`, `2026-04-04-sync-plan-contabilidad-vs-pdf.md` y `contabilidad-backlog.md`.

Fecha de corte: `2026-03-24`

## Objetivo

Dejar en un solo documento:

- que existe hoy en el repo relacionado a contabilidad
- que pantallas, modales y componentes soportan cada flujo
- que partes estan fuertes, cuales estan parciales y cuales siguen siendo deuda
- que conviene mantener dentro del flujo actual
- que ya deberia moverse a pantalla propia, drawer propio o modulo aparte
- que puntos conviene validar con asesor contable y fiscal antes de seguir creciendo

Este documento esta basado en evidencia real del repo `src/`, `functions/` y `plans/`, no en intencion futura.

## Como leer este documento

- `Operativo fuerte` significa que el flujo ya resuelve una necesidad real del negocio.
- `Contable parcial` significa que existe el flujo operativo, pero todavia no esta cerrado como libro mayor o estados financieros.
- `Mantener` significa que la UX actual sigue teniendo sentido.
- `Separar` significa que la complejidad ya justifica pantalla, drawer o modulo propio.

## Resumen ejecutivo

La direccion general del sistema es correcta:

- ventas, CxC, compras, gastos, caja y NCF ya operan
- existe configuracion contable por negocio
- ya existen `chartOfAccounts`, `accountingPostingProfiles`, `bankAccounts`, `exchangeRates` y politica de uso bancario por modulo
- el sistema ya piensa en moneda funcional, moneda documental y snapshots monetarios
- `cashMovements` y los subledgers operativos ya preparan el terreno correcto

Lo que sigue faltando para decir que "contabilidad general" esta cerrada:

- pipeline real `AccountingEvent -> accountingPostingProfiles -> journalEntries`
- `trialBalance`
- `balanceSheet`
- `incomeStatement`
- cierre formal de FX para anticipos y pagos parciales
- mejor separacion entre gasto incurrido y gasto pagado

Mi lectura tecnica para tu asesor es esta:

- el producto ya no esta en cero en contabilidad
- pero todavia esta en una fase de `operacion + subledgers + configuracion`
- no en una fase de `mayor general + estados financieros`

## Modelo objetivo recomendado

La secuencia correcta para este repo es:

1. modulo operativo
2. subledger operativo
3. `AccountingEvent`
4. `accountingPostingProfiles`
5. `journalEntries`
6. reportes contables

No conviene:

- postear asientos directos desde cada modulo
- usar `cashMovements` como pseudo mayor
- tratar NCF como sustituto de contabilidad general

## Semaforo general por area

| Area | Estado | Pantallas principales | Decision UX |
| --- | --- | --- | --- |
| Configuracion contable base | Parcial avanzada | `settings/accounting/*` | Mantener como pagina con paneles |
| Catalogo de cuentas | Parcial funcional | `settings/accounting/catalogo` | Mantener pagina; modal corto para alta/edicion |
| Perfiles contables | Parcial funcional | `settings/accounting/perfiles-contables` | Mantener pagina; el editor puede crecer luego |
| Cuentas bancarias | Parcial avanzada | `settings/accounting/cuentas-bancarias` | Mantener en settings por ahora |
| Tasa de cambio | Parcial avanzada | `settings/accounting/tasa-cambio` | Mantener en settings por ahora |
| Ventas y facturas | Operativo fuerte | `/sales`, `/bills` | Mantener como modulo propio |
| CxC | Operativo fuerte / contable parcial | `/account-receivable/list`, `/account-receivable/audit` | Mantener lista y auditoria; revisar detalle legacy |
| Compras | Operativo fuerte | `/purchases`, `/purchases/create`, `/purchases/complete/:id` | Mantener como paginas |
| CxP | Parcial funcional | modal de pago y modal de historial en compras | Conviene separar historial/estado de cuenta a futuro |
| Gastos | Operativo fuerte / contable parcial | `/expenses/list` + modal | Mantener modal para simple; abrir pagina si el flujo crece |
| Caja / tesoreria | Operativo fuerte | `/cash-reconciliation/*` | Mantener apertura/cierre como paginas |
| Comprobantes fiscales | Operativo fuerte fiscal | `/settings/tax-receipt` | Mantener pagina aparte |
| Notas de credito | Debil / parcial | `/credit-note` y `CreditNoteCreate` | Rehacer flujo antes de venderlo como modulo contable |
| Seguros | Implementado con deuda puntual | CxC + modulos de seguros | Mantener acoplado a CxC por ahora |

## 1. Configuracion contable base

### Que existe hoy

Existe una pagina real de configuracion contable con rutas dedicadas:

- `/settings/accounting`
- `/settings/accounting/catalogo`
- `/settings/accounting/perfiles-contables`
- `/settings/accounting/cuentas-bancarias`
- `/settings/accounting/tasa-cambio`

Piezas principales:

- `AccountingConfig.tsx`
- `AccountingSettingsForm.tsx`
- `AccountingPanelNav.tsx`
- `useAccountingConfig.ts`
- `useChartOfAccounts.ts`
- `useAccountingPostingProfiles.ts`

Colecciones y configuracion asociada:

- `businesses/{businessId}/settings/accounting`
- `businesses/{businessId}/chartOfAccounts`
- `businesses/{businessId}/accountingPostingProfiles`
- `businesses/{businessId}/bankAccounts`
- `businesses/{businessId}/exchangeRates`

### Lectura funcional

Esta parte ya no es diseño. Ya existe:

- configuracion por negocio
- historial de cambios
- activacion de contabilidad general
- activacion de banca
- definicion de moneda funcional
- monedas documentales
- tasas manuales
- cuentas bancarias activas
- politica bancaria por modulo
- seed de catalogo de cuentas
- seed de perfiles contables

### Diagnostico contable

La configuracion base esta bien orientada. El problema ya no es falta de pantallas, sino que:

- el mayor todavia no consume esa configuracion en vivo
- el catalogo y los perfiles estan listos, pero todavia no controlan el journal

### Recomendacion UX

Mantener esta area como pagina con subrutas, no como modal.

Motivo:

- es configuracion estructural
- tiene impacto transversal
- necesita contexto, comparacion y trazabilidad
- no es captura rapida

## 2. Catalogo de cuentas

### Que existe hoy

Piezas visibles:

- `ChartOfAccountsWorkspace/ChartOfAccountsList.tsx`
- `ChartOfAccountsExplorer.tsx`
- `ChartOfAccountInspector.tsx`
- `AddChartOfAccountModal.tsx`

Capacidades actuales:

- listar cuentas
- filtrar por estado y tipo
- ver jerarquia
- ver padre e hijas
- activar o inactivar
- editar
- sembrar plantilla base

### Lectura funcional

El catalogo ya tiene una UX correcta para etapa piloto:

- explorador a la izquierda
- inspector a la derecha
- modal corto para alta o edicion

### Diagnostico contable

Esta area ya esta madura a nivel de interfaz y persistencia.

Lo que falta no es UX sino integracion:

- que los eventos realmente resuelvan `accountId` o `systemKey`
- que las cuentas posteables activas sean las que alimenten `journalEntries`

### Recomendacion UX

Mantener el catalogo como pagina.

Mantener `AddChartOfAccountModal` para alta o edicion simple.

Solo consideraria una pantalla aparte de "editor avanzado de cuenta" si luego aparecen:

- reglas por moneda
- restricciones por sucursal
- cierre por periodo
- equivalencias fiscales

## 3. Perfiles contables

### Que existe hoy

Piezas visibles:

- `PostingProfilesWorkspace/PostingProfilesList.tsx`
- `PostingProfileInspector.tsx`
- `AccountingEventCoverageList.tsx`
- `AddPostingProfileModal.tsx`

Capacidades actuales:

- ver cobertura por `AccountingEvent`
- listar perfiles por evento
- filtrar por estado
- ver prioridad
- sembrar plantilla base
- crear y editar perfiles

Semillas contables visibles en codigo:

- venta al contado
- venta a credito
- cobro CxC en caja
- compra registrada
- pago CxP por banco

### Lectura funcional

La UX actual es buena para administracion tecnica:

- cobertura del evento
- seleccion del perfil
- inspector del perfil
- modal de alta/edicion

### Diagnostico contable

Aqui ya existe gran parte de la capa de reglas.

La deuda real es de motor:

- el backend todavia no proyecta todos los eventos al journal usando estos perfiles

### Recomendacion UX

Mantener como pagina.

Mantener el modal para creacion o cambios cortos.

Si mas adelante crecen mucho las condiciones, conviene pasar de modal a drawer o editor completo con:

- preview del asiento resultante
- validacion del balance
- sandbox por evento

## 4. Cuentas bancarias

### Que existe hoy

Piezas visibles:

- `BankAccountsList.tsx`
- `AddBankAccountModal.tsx`
- `BankPaymentPolicySection.tsx`

Capacidades actuales:

- alta de cuentas bancarias
- activacion o inactivacion
- definicion de cuenta por defecto
- override por modulo
- uso operativo cuando el rollout contable esta activo

Modulos impactados por politica bancaria:

- ventas
- gastos
- CxC
- compras / CxP

### Lectura funcional

Esta area ya funciona como configuracion transversal y esta bien ubicada en settings.

### Diagnostico contable

Lo que falta no es otra pantalla sino:

- cerrar datos reales del piloto
- eliminar huecos de `bankAccountId`
- abrir luego conciliacion bancaria formal

### Recomendacion UX

Mantener en settings por ahora.

No abrir un modulo bancario completo todavia, salvo que se quiera soportar:

- conciliacion bancaria
- estados de cuenta bancarios
- cargos bancarios
- transferencias entre bancos con mas trazabilidad
- arqueo o saldo bancario historico

En ese momento si convendra un modulo aparte de tesoreria/bancos.

## 5. Tasa de cambio

### Que existe hoy

Piezas visibles:

- `ExchangeRateList.tsx`
- `ExchangeRateMarketReference.tsx`
- `AddExchangeRateModal.tsx`
- `useAccountingConfig.ts`

Capacidades actuales:

- moneda funcional
- monedas documentales activas
- `buyRate` y `sellRate`
- referencia de mercado
- historial de configuracion
- materializacion de `exchangeRates`

### Lectura funcional

La UI actual es suficiente para la etapa en la que estan:

- panel de tasa dentro de contabilidad
- alta corta de monedas activas
- vista de referencia de mercado

### Diagnostico contable

La base tecnica esta bien.

La deuda real es normativa/contable:

- anticipos en moneda extranjera
- pagos parciales
- realized FX
- eventual revaluacion de saldos monetarios

### Recomendacion UX

Mantener dentro de settings mientras FX sea configuracion y snapshot.

Separar a modulo propio solo cuando exista:

- liquidacion FX
- ganancias/perdidas cambiarias visibles
- revaluacion de partidas monetarias
- reportes por diferencia cambiaria

## 6. Ventas, facturas y comprobantes fiscales

### Que existe hoy

Pantallas principales:

- `/sales`
- `/bills`
- `InvoicesPage.tsx`
- `SaleReportTable`
- `SalesAnalyticsPanel`
- `InvoicePreview`

Piezas relacionadas:

- `TaxReceiptDepletedModal`
- `CreditSelector`
- recibos e impresiones

Backend y servicios relevantes:

- `createInvoice.controller.js`
- `orchestrator.service.js`
- `ncf.service.js`
- `finalize.service.js`
- `outbox.worker.js`
- `ncfLedger.worker.js`
- `ncfLedger.service.js`

### Lectura funcional

Ventas es uno de los modulos mas fuertes del sistema:

- facturacion
- NCF en ventas
- inventario
- CxC
- seguros
- caja
- reportes y analytics

### Diagnostico contable

Contablemente, la base esta bien si la venta se reconoce por hecho economico y no por cobro.

Fiscalmente:

- hay gestion de NCF
- hay reserva y consumo de NCF
- existe `ncfLedger`

Pendiente:

- que `invoice.committed` quede formalmente emitido y proyectado al mayor

### Recomendacion UX

Mantener ventas y facturas como modulo propio, no mover a modal.

Mantener la configuracion fiscal en pagina aparte.

No mezclar la administracion NCF dentro de la pantalla de contabilidad general: fiscal y mayor deben convivir, pero no fusionarse.

## 7. Cuentas por cobrar

### Que existe hoy

Pantallas principales:

- `/account-receivable/list`
- `/account-receivable/info/:id`
- `/account-receivable/receipts`
- `/account-receivable/audit`

Piezas visibles:

- `AccountReceivableList.tsx`
- `AccountReceivableTable`
- `FilterAccountReceivable`
- `PaymentForm.tsx`
- `AccountsReceivablePaymentReceipt`
- `ReceivablePaymentReceipt`
- `AccountReceivableAudit.tsx`

Backend relevante:

- `createAccountsReceivable.js`
- `processAccountsReceivablePayment.js`
- `voidAccountsReceivablePayment.js`
- `accountsReceivablePaymentReceipt`

### Lectura funcional

CxC esta fuerte operacionalmente:

- listado
- filtros
- cuotas
- cobros
- recibos
- auditoria

Ademas, ya existe avance real hacia contabilidad:

- ya hay contrato de `AccountingEvent`
- ya se estan emitiendo eventos reales para `accounts_receivable.payment.recorded`
- ya se estan emitiendo eventos reales para `accounts_receivable.payment.voided`

### Diagnostico contable

CxC esta mejor parado que otros modulos para abrir mayor.

Pendiente:

- proyector a `journalEntries`
- deterioro o politica de impairment si luego se quieren estados financieros mas serios

### Recomendacion UX

Mantener `PaymentForm` como modal para cobro rapido.

Motivo:

- es flujo de caja/cajero
- la accion es puntual
- ya tiene resumen, metodos de pago, credito y recibo

Mantener `AccountReceivableAudit` como pagina.

Recomendacion importante:

- `AccountReceivableInfo.tsx` se ve legacy y menos alineado que el resto del modulo
- conviene redisenarlo o fusionarlo con una vista de detalle moderna
- no parece la mejor vista para entregar trazabilidad contable de largo plazo

## 8. Compras

### Que existe hoy

Pantallas principales:

- `/purchases`
- `/purchases/create`
- `/purchases/update/:id`
- `/purchases/complete/:id`

Piezas visibles:

- `Purchases.tsx`
- `PurchaseTable`
- `PurchaseManagement.tsx`
- `GeneralForm.tsx`
- `PurchaseReceiptForm.tsx`
- `PurchaseWarehouseModal.tsx`
- `PurchaseCompletionSummary`
- `EvidenceUploadDrawer`
- `BackOrdersModal`

### Lectura funcional

Compras ya opera como modulo propio:

- creacion y edicion
- seleccion de proveedor
- productos
- adjuntos
- backorders
- recepcion o completion
- impacto en inventario

`PurchaseManagement` ya esta bien separado entre:

- pantalla de preparacion
- pantalla de recepcion/completion

Eso es sano y no conviene llevarlo a modales.

### Diagnostico contable

La duda contable principal no es de interfaz sino de semantica:

- `purchase.committed` debe significar compra validada o recepcionada
- no simple pedido

Tambien hace falta cerrar mejor:

- pasivo
- credito fiscal si aplica
- integracion al mayor

### Recomendacion UX

Mantener compras como paginas completas.

Mantener `PurchaseReceiptForm` como pagina de recepcion, no modal.

Eso ya esta bien resuelto porque:

- requiere contexto
- requiere detalle por linea
- requiere historia de recepciones

## 9. Cuentas por pagar

### Que existe hoy

Piezas visibles:

- `RegisterSupplierPaymentModal.tsx`
- `SupplierPaymentHistoryModal.tsx`
- `SupplierPaymentMethods.tsx`
- hooks de `useAccountsPayablePayments`
- hooks de `useSupplierCreditNotes`

Backend relevante:

- `addSupplierPayment.js`
- `voidSupplierPayment.js`
- `syncAccountsPayablePayment.js`
- `accountsPayablePayments`

### Lectura funcional

CxP ya no es idea. Ya existe:

- pago a suplidor
- pago parcial
- fecha de proximo pago
- uso de caja
- uso de banco
- uso de nota de credito de suplidor
- historial
- anulacion de pago

### Diagnostico contable

Sigue siendo un subledger inicial.

Falta:

- recibo mas fuerte
- mejor evidencia
- mejor trazabilidad por proveedor
- mejor narrativa del nacimiento del pasivo
- mayor integracion con compra validada y no solo con pago

### Recomendacion UX

`RegisterSupplierPaymentModal` esta bien para abonos puntuales sobre una compra.

Pero recomiendo separar a futuro:

- historial de pagos por suplidor
- estado de cuenta por suplidor
- recibo o voucher de pago a suplidor
- conciliacion de notas de credito de suplidor

Mi recomendacion concreta es esta:

- mantener el modal para `registrar pago rapido`
- mover el historial completo y el estado de cuenta a una pantalla o drawer dedicado por suplidor o por compra

Porque la complejidad de CxP ya esta creciendo mas alla de una accion corta.

## 10. Gastos

### Que existe hoy

Pantallas principales:

- `/expenses/list`
- `/expenses/new`
- `/expenses/update/:id`

Piezas visibles:

- `ExpensesList.tsx`
- `ExpensesTable`
- `ExpensesForm.tsx`
- `ManageExpenseCategoriesModal.tsx`
- `EvidenceUpload`

Backend relevante:

- `syncExpenseCashMovement.js`

### Lectura funcional

Gastos opera bien para el dia a dia:

- listado
- captura
- categorias
- adjuntos
- caja
- banco

Pero la captura principal hoy vive dentro de `ExpensesForm`, que es un modal.

### Diagnostico contable

Este es uno de los puntos mas sensibles.

El flujo visible sigue demasiado centrado en:

- metodo de pago
- caja
- banco

Eso puede servir operativamente, pero contablemente deja la pregunta:

- el gasto nace cuando se incurre o cuando se paga

Si luego se quieren provisiones, gastos por pagar, gastos diferidos o centros de costo mas fuertes, este modal se queda corto.

### Recomendacion UX

Mantener el modal para gasto simple o gasto de caja chica.

Abrir una pantalla propia cuando el gasto requiera cualquiera de estas cosas:

- registro a credito
- fecha de documento distinta a fecha de pago
- NCF obligatorio con validaciones mas fuertes
- varios adjuntos
- distribucion por cuentas o centros
- aprobacion
- amortizacion o periodificacion

En corto:

- modal para gasto rapido
- pagina para gasto contable mas serio

## 11. Caja, tesoreria y transferencias internas

### Que existe hoy

Pantallas principales:

- `/cash-reconciliation`
- `/cash-reconciliation/opening`
- `/cash-reconciliation/closure`
- `/cash-reconciliation/invoice-overview`

Piezas visibles:

- `CashReconciliation.tsx`
- `CashRecociliationTable`
- `CashRegisterOpening.tsx`
- `CashRegisterClosure.tsx`
- `CashupInvoicesOverview.tsx`
- modales de autorizacion por PIN o password

Backend y utilidades relevantes:

- `cashMovements`
- `openCashCount.js`
- `closeCashCount.js`
- `createInternalTransfer.js`

### Lectura funcional

Tesoreria operativa esta fuerte:

- apertura
- cierre
- autorizacion
- resumen de facturas
- dependencias con cobros y gastos

Ademas, ya existe avance contable puntual:

- ya hay evento real `internal_transfer.posted`

### Diagnostico contable

La regla clave aqui es:

- `cashMovements` debe quedarse como subledger operativo
- no como libro mayor general

### Recomendacion UX

Mantener apertura y cierre como paginas dedicadas.

Motivo:

- hay control
- hay autorizacion
- hay contexto
- hay riesgo operativo

Mantener `CashupInvoicesOverview` como drawer.

Abrir modulo de tesoreria aparte solo cuando se quiera soportar:

- transferencias bancarias mas complejas
- conciliacion formal
- fees bancarios
- saldos entre bancos y caja como tablero propio

## 12. Comprobantes fiscales, NCF y e-CF

### Que existe hoy

Pantalla principal:

- `/settings/tax-receipt`

Piezas visibles:

- `TaxReceIptSetting.tsx`
- `ReceiptSettingsSection`
- `ReceiptTableSection`
- `TaxReceiptForm`
- `TaxReceiptAuthorizationModal`
- `AddReceiptDrawer`
- `FiscalReceiptsAlertWidget`

Backend relevante:

- `ncf.service.js`
- `ncfLedger.worker.js`
- `ncfLedger.service.js`
- `rebuildNcfLedger.controller.js`

### Lectura funcional

La capa fiscal de NCF en ventas esta fuerte:

- configuracion
- secuencias
- reserva
- consumo
- ledger
- reconstruccion

### Diagnostico contable

A nivel de contabilidad general:

- esto esta bien si sigue separado del mayor
- NCF no debe decidir el asiento contable por si solo

Punto a dejarle claro al asesor:

- tenemos NCF tradicional interno fuerte
- no vi e-CF DGII cerrado en flujo principal

### Recomendacion UX

Mantener esta configuracion en pagina separada.

No moverla dentro de `settings/accounting`.

Fiscal y contable deben conversar, pero no mezclarse en la misma UI.

## 13. Inventario, costo, seguros y otros modulos relacionados

### Inventario

Relacion contable:

- ventas impactan salida de inventario
- compras impactan entrada
- el costo de venta formal todavia depende de abrir bien el mayor

Pantallas relacionadas:

- compras
- ventas
- inventario y movimientos

Lectura:

- inventario ya funciona operacionalmente
- contablemente todavia falta cerrar la bajada al journal y la semantica del costo

### Seguros

Relacion contable:

- participa en cuentas por cobrar
- afecta origen y trazabilidad del documento

Lectura:

- operativamente existe
- contablemente se debe seguir tratando dentro de CxC y no como modulo contable aparte

### Notas de credito

Punto importante:

- `CreditNoteCreate.tsx` se ve todavia placeholder o mock
- no parece listo para venderse como flujo contable/fiscal cerrado

Recomendacion:

- rehacerlo como flujo real
- ligarlo a factura origen, NCF, impacto en CxC, inventario y mayor

## 14. Estado real de la capa contable

### Lo que ya existe

- `chartOfAccounts`
- `accountingPostingProfiles`
- catalogo de `AccountingEvent`
- contrato de `JournalEntry`
- seeds de perfiles contables
- parte de los productores reales de evento

### Productores reales ya visibles

- `accounts_receivable.payment.recorded`
- `accounts_receivable.payment.voided`
- `internal_transfer.posted`

### Productores que todavia faltan o estan incompletos

- `invoice.committed`
- `purchase.committed`
- `accounts_payable.payment.recorded`
- `accounts_payable.payment.voided`
- `expense.recorded`
- `fx_settlement.recorded`

### Lo que sigue faltando

- proyector real a `journalEntries`
- `trialBalance`
- `balanceSheet`
- `incomeStatement`
- cierres contables
- `period lock`
- `dead letters`
- replay controlado

## 15. Recomendaciones estructurales de UX

## Mantener como pagina

- `settings/accounting/*`
- catalogo de cuentas
- perfiles contables
- compras create/update/complete
- facturas
- CxC auditoria
- caja apertura y cierre
- configuracion de comprobantes fiscales

## Mantener como modal o drawer

- alta corta de cuenta bancaria
- alta corta de moneda activa
- alta o edicion de cuenta contable
- alta o edicion de perfil contable mientras el editor siga simple
- cobro rapido de CxC
- vista drawer de facturas dentro del cuadre

## Separar pronto a vista propia

- detalle moderno de CxC en lugar del `AccountReceivableInfo` legacy
- historial / estado de cuenta de CxP por proveedor
- flujo real de nota de credito
- gasto contable avanzado cuando ya no sea solo caja chica

## No mezclar

- NCF con mayor general en la misma pantalla
- caja con mayor general
- configuracion bancaria con conciliacion bancaria avanzada

## 16. Preguntas concretas para tu asesor

1. La politica contable de compras debe reconocer el pasivo y el inventario en la recepcion, en la factura del suplidor o en otra validacion interna?
2. El modulo de gastos debe seguir aceptando solo gasto pagado en su flujo principal o conviene abrir ya gasto por pagar?
3. Como quieren tratar `credito fiscal` y `ITBIS por pagar` dentro del mayor, especialmente para compras, gastos y ventas?
4. Que politica exacta quieren para anticipos y pagos parciales en moneda extranjera?
5. Quieren deterioro de CxC en esta etapa o se deja fuera del piloto?
6. Para CxP, les basta con pago por compra o necesitan estado de cuenta por suplidor como vista primaria?
7. Las notas de credito deben vivir como modulo comercial, fiscal o contable-mixto?
8. Quieren que gastos complejos se sigan capturando por modal o prefieren pagina formal con aprobacion y adjuntos?

## 17. Orden sugerido para evolucion

1. Cerrar semantica contable de compras, gastos y FX.
2. Completar productores reales de `AccountingEvent`.
3. Proyectar `journalEntries` desde `accountingPostingProfiles`.
4. Abrir `trialBalance` y mayor por cuenta.
5. Separar UX donde ya haya demasiada complejidad contable.

## 18. Conclusiones practicas

- La arquitectura va bien.
- El sistema ya tiene una base contable real, no solo ideas.
- La mayor parte de la deuda ya no es de "falta de pantalla", sino de integracion contable y semantica.
- No hace falta mover todo a modulos nuevos.
- Si conviene separar pronto lo que ya esta dejando de ser captura rapida: detalle CxC legacy, historial fuerte de CxP, nota de credito real y gasto avanzado.

## 19. Evidencia principal del repo

- `src/router/routes/paths/Setting.tsx`
- `src/router/routes/paths/Sales.tsx`
- `src/router/routes/paths/Purchases.tsx`
- `src/router/routes/paths/AccountReceivable.tsx`
- `src/router/routes/paths/CashReconciliztion.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/AccountingConfig.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/components/AccountingSettingsForm.tsx`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingConfig.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useChartOfAccounts.ts`
- `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/hooks/useAccountingPostingProfiles.ts`
- `src/modules/settings/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx`
- `src/modules/invoice/pages/InvoicesPage/InvoicesPage.tsx`
- `src/modules/accountsReceivable/components/PaymentForm/PaymentForm.tsx`
- `src/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList.tsx`
- `src/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableAudit/AccountReceivableAudit.tsx`
- `src/modules/accountsReceivable/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/GeneralForm/GeneralForm.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/PurchaseManagement/components/PurchaseReceiptForm/PurchaseReceiptForm.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/RegisterSupplierPaymentModal.tsx`
- `src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesTable/components/SupplierPaymentHistoryModal.tsx`
- `src/modules/expenses/pages/Expenses/ExpensesList/ExpensesList.tsx`
- `src/modules/expenses/pages/Expenses/ExpensesForm/ExpensesForm.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/CashReconciliation.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure.tsx`
- `src/modules/cashReconciliation/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview.tsx`
- `src/utils/accounting/accountingEvents.ts`
- `src/utils/accounting/postingProfiles.ts`
- `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`
- `functions/src/app/versions/v2/invoice/services/ncf.service.js`
- `functions/src/app/versions/v2/invoice/services/finalize.service.js`
- `functions/src/app/versions/v2/invoice/triggers/outbox.worker.js`
- `functions/src/app/versions/v2/invoice/triggers/ncfLedger.worker.js`
- `functions/src/app/modules/accountReceivable/functions/processAccountsReceivablePayment.js`
- `functions/src/app/modules/accountReceivable/functions/voidAccountsReceivablePayment.js`
- `functions/src/app/modules/purchase/functions/addSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/voidSupplierPayment.js`
- `functions/src/app/modules/purchase/functions/syncAccountsPayablePayment.js`
- `functions/src/app/modules/expenses/functions/syncExpenseCashMovement.js`
- `functions/src/app/modules/treasury/functions/createInternalTransfer.js`

## 20. Fuentes externas para contraste contable y fiscal

- IFRS Conceptual Framework: https://www.ifrs.org/content/dam/ifrs/meetings/2018/october/wss/wss5b-conceptual-framework.pdf
- IFRS 15: https://www.ifrs.org/content/dam/ifrs/publications/pdf-standards/english/2024/issued/part-a/ifrs-15-revenue-from-contracts-with-customers.pdf?bypass=on
- IAS 2: https://www.ifrs.org/issued-standards/list-of-standards/ias-2-inventories/
- IAS 21: https://www.ifrs.org/issued-standards/list-of-standards/ias-21-the-effects-of-changes-in-foreign-exchange-rates/
- IFRIC 22: https://www.ifrs.org/issued-standards/list-of-standards/ifric-22-foreign-currency-transactions-and-advance-consideration/
- IFRS 9 impairment: https://www.ifrs.org/content/dam/ifrs/project/pir-9-impairment/rfi-iasb-2023-1-ifrs9-impairment.pdf
- DGII NCF: https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/facturacion/Documents/Comprobantes%20Fiscales/2-Guia-Informativa-NCF.pdf
- Portal DGII facturacion: https://dgii.gov.do/publicacionesOficiales/bibliotecaVirtual/contribuyentes/facturacion/Paginas/inicio.aspx
