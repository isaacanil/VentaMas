# Inventario de Superficies de Finanzas y Contabilidad

Fecha de corte: 2026-04-04

## Objetivo

Este documento inventaria las superficies del sistema relacionadas con contabilidad, finanzas y operaciones que impactan el circuito contable.

Sirve para:
- detectar ausencias funcionales
- identificar huecos de UX o consistencia
- ubicar modales, drawers y pantallas derivadas
- comparar el estado actual contra el modelo contable deseado

## Alcance

Se incluyeron:
- `http://localhost:5173/contabilidad/...`
- `http://localhost:5173/settings/accounting/...`
- ventas, facturas, preventas
- gastos
- compras y pagos a suplidores
- cuentas por cobrar y pagos
- cuadre de caja

No se encontro una pantalla dedicada independiente para cuentas por pagar. Hoy ese flujo vive embebido dentro de compras mediante modales de pagos a suplidores e historial de pagos.

## Rutas canonicas

### Settings / Accounting

| Pantalla | URL canonica |
| --- | --- |
| Settings de contabilidad | `/settings/accounting` |
| Catalogo de cuentas | `/settings/accounting/catalogo` |
| Perfiles contables | `/settings/accounting/perfiles-contables` |
| Cuentas bancarias | `/settings/accounting/cuentas-bancarias` |
| Tipos de cambio | `/settings/accounting/tasa-cambio` |

### Workspace contable

| Pantalla | URL canonica |
| --- | --- |
| Contabilidad root | `/contabilidad` |
| Libro diario | `/contabilidad/libro-diario` |
| Libro mayor | `/contabilidad/libro-mayor` |
| Asientos manuales | `/contabilidad/asientos-manuales` |
| Reportes | `/contabilidad/reportes` |
| Cierre de periodo | `/contabilidad/cierre-periodo` |

### Operacion financiera relacionada

| Dominio | URL canonica |
| --- | --- |
| Ventas POS | `/sales` |
| Facturas de ventas | `/bills` |
| Analisis de ventas | `/bills/analytics` |
| Preventas | `/preorders` |
| Gastos listado | `/expenses/list` |
| Gastos nuevo | `/expenses/new` |
| Gastos editar | `/expenses/update/:id` |
| Compras listado | `/purchases` |
| Analisis de compras | `/purchases/analytics` |
| Compra nueva | `/purchases/create` |
| Compra editar | `/purchases/update/:id` |
| Completar recepcion de compra | `/purchases/complete/:id` |
| Backorders | `/backorders` |
| Cuentas por cobrar listado | `/account-receivable/list` |
| CxC detalle | `/account-receivable/info/:id` |
| Recibos de CxC | `/account-receivable/receipts` |
| Auditoria CxC | `/account-receivable/audit` |
| Cuadre de caja listado | `/cash-reconciliation` |
| Apertura de caja | `/cash-register-opening` |
| Cierre de caja | `/cash-register-closure/:id` |
| Facturas del cuadre | `/cash-register-invoices-overview` |

## Aliases y redirects relevantes

### Accounting settings

La aplicacion mantiene varios aliases historicos que redirigen a las rutas canonicas actuales:
- `/settings/contabilidad` -> `/settings/accounting`
- `/settings/contabilidad/tasa-cambio` -> `/settings/tasa-cambio`
- `/settings/contabilidad/cuentas-bancarias` -> `/settings/accounting/cuentas-bancarias`
- `/settings/contabilidad/catalogo` -> `/settings/accounting/catalogo`
- `/settings/contabilidad/perfiles-contables` -> `/settings/accounting/perfiles-contables`
- `/settings/general-config/accounting` -> `/settings/accounting`
- `/general-config/contabilidad` -> `/settings/accounting`

Observacion:
- La ruta canonica de tipos de cambio se mantiene en `/settings/tasa-cambio`, aunque funcionalmente pertenece al modulo de accounting y tambien se monta dentro de `AccountingConfig`.

## Superficies de Settings / Accounting

### 1. Settings de contabilidad

**URL**
- `/settings/accounting`

**Proposito**
- punto de entrada del stack de configuracion contable
- redirige al panel por defecto

**Comportamiento**
- si se entra a `/settings/accounting` sin subruta, redirige al panel por defecto
- hoy el panel por defecto es `Catalogo de cuentas`

**Pantallas hijas**
- Catalogo de cuentas
- Perfiles contables
- Cuentas bancarias
- Tipos de cambio

**Superficies derivadas que puede abrir**
- historial de cambios de tipos de cambio en `Drawer`
- modal de agregar tasa
- modal de agregar cuenta bancaria
- modal de agregar/editar cuenta contable
- modal de agregar/editar perfil contable

### 2. Catalogo de cuentas

**URL**
- `/settings/accounting/catalogo`

**Proposito**
- definir la estructura base del plan de cuentas
- controlar jerarquia, cuentas raiz, cuentas posteables y estados

**Lo que se puede hacer**
- activar o desactivar contabilidad general desde el header del panel
- buscar por codigo, nombre o clave del sistema
- filtrar por tipo de cuenta
- filtrar por estado
- sembrar plantilla base del catalogo
- crear cuenta nueva
- crear subcuenta contextual desde el explorador
- editar cuenta existente
- activar o inactivar cuenta
- inspeccionar relaciones y referencia interna

**Superficies secundarias**
- `AddChartOfAccountModal`
  - crear cuenta
  - editar cuenta
  - crear subcuenta con defaults heredados del padre
- `Drawer` movil del inspector
  - en anchos compactos el detalle sale del flujo principal

**Estructura visible**
- explorador del arbol
- inspector de cuenta
- filtros y stats operativos

**Notas de producto**
- `activo` es estado silencioso
- `inactiva` se muestra como excepcion
- el inspector ya esta simplificado para lectura contable

### 3. Perfiles contables

**URL**
- `/settings/accounting/perfiles-contables`

**Proposito**
- mapear eventos del negocio a reglas de contabilizacion
- definir cobertura por evento, condiciones y lineas de asiento

**Lo que se puede hacer**
- navegar cobertura por evento contable
- ver cantidad de perfiles por evento
- filtrar por estado
- buscar perfiles dentro del evento seleccionado
- sembrar plantilla base de perfiles
- crear perfil nuevo
- editar perfil existente
- activar o inactivar perfil
- inspeccionar condiciones, lineas y cobertura del evento

**Superficies secundarias**
- `AddPostingProfileModal`
  - crear perfil
  - editar perfil
  - bloquear `eventType` segun el evento actual o el perfil en edicion
- `Drawer` movil de eventos
  - lista de eventos contables
- `Drawer` movil de detalle de perfil
  - inspector full-screen

**Comportamiento responsive**
- desktop: cobertura + listado + inspector
- movil: superficie principal de listado, drawer izquierdo para eventos, drawer derecho para detalle

### 4. Cuentas bancarias

**URL**
- `/settings/accounting/cuentas-bancarias`

**Proposito**
- administrar cuentas bancarias activas e inactivas
- definir cuenta predeterminada y politica de resolucion bancaria

**Lo que se puede hacer**
- activar o desactivar el modulo de cuentas bancarias
- ver cuentas activas o inactivas
- agregar cuenta bancaria
- editar cuenta bancaria
- activar o inactivar una cuenta
- marcar cuenta predeterminada
- ajustar politica de pago bancario

**Superficies secundarias**
- `AddBankAccountModal`
  - alta y edicion de cuenta bancaria

**Impacto transversal**
- afecta ventas
- afecta gastos
- afecta cuentas por cobrar
- afecta compras

### 5. Tipos de cambio

**URL**
- `/settings/accounting/tasa-cambio`
- alias historico: `/settings/tasa-cambio`

**Proposito**
- definir monedas habilitadas fuera de la moneda funcional
- comparar tasa manual contra referencia de mercado

**Lo que se puede hacer**
- configurar monedas activas
- cambiar moneda funcional
- agregar o quitar monedas documentales
- ajustar tasa de compra manual
- ajustar tasa de venta manual
- revisar delta contra referencia de mercado
- guardar cambios de exchange
- abrir historial de cambios

**Superficies secundarias**
- `AddExchangeRateModal`
  - agrega monedas y define tasas iniciales
- `Drawer` inferior de historial
  - `AccountingHistoryList`

**Indicadores visibles**
- moneda base
- monedas activas
- monedas con tasa manual
- timestamp de referencia de mercado
- estado por fila: normal, desviada, critica

## Workspace contable

### 6. Contabilidad root

**URL**
- `/contabilidad`

**Proposito**
- shell del workspace contable
- redirige al panel por defecto del workspace

**Comportamiento**
- si se entra a `/contabilidad`, redirige a `/contabilidad/libro-diario`
- monta tabs internas para:
  - libro diario
  - libro mayor
  - asientos manuales
  - reportes
  - cierre de periodo

**Mensajes sistemicos**
- avisa si el negocio no esta en rollout contable piloto
- avisa si faltan cargas parciales de configuracion, catalogo o perfiles
- avisa si la contabilidad general no esta habilitada

### 7. Libro diario

**URL**
- `/contabilidad/libro-diario`

**Proposito**
- consultar historial de asientos contables y navegar al detalle de cada movimiento

**Lo que se puede hacer**
- buscar por factura, cobro, descripcion o cuenta
- filtrar por modulo
- filtrar por rango de fechas
- abrir detalle de un asiento

**Superficies secundarias**
- `JournalEntryDetailDrawer`
  - muestra fecha, origen, modulo, referencia, estado, modo y lineas del asiento

**Datos mostrados**
- fecha
- origen
- modulo
- referencia
- descripcion
- monto
- estado

### 8. Libro mayor

**URL**
- `/contabilidad/libro-mayor`

**Proposito**
- ver el mayor por cuenta con saldo corrido y exportarlo

**Lo que se puede hacer**
- seleccionar cuenta contable
- filtrar por periodo
- buscar por referencia, modulo o descripcion
- exportar libro mayor a Excel
- abrir el asiento origen de un movimiento

**Superficies secundarias**
- `JournalEntryDetailDrawer`
  - abre el asiento fuente del movimiento seleccionado

**Indicadores visibles**
- saldo inicial
- debitos del tramo
- creditos del tramo
- saldo final
- paginacion del detalle

### 9. Asientos manuales

**URL**
- `/contabilidad/asientos-manuales`

**Proposito**
- registrar ajustes manuales y reclasificaciones

**Lo que se puede hacer**
- elegir fecha del asiento
- escribir descripcion y nota
- agregar lineas
- quitar lineas
- seleccionar cuentas posteables
- capturar debito y credito por linea
- validar que el asiento cuadre antes de guardar
- bloquear guardado si el periodo esta cerrado

**Superficies secundarias**
- no abre modal dedicado propio
- toda la captura sucede inline dentro del panel

**Comportamientos especiales**
- al presionar `Enter` o `Tab` en la ultima linea de credito, agrega una nueva linea
- muestra diferencia mientras el asiento no cuadra

### 10. Reportes

**URL**
- `/contabilidad/reportes`

**Proposito**
- generar vistas financieras consolidadas por periodo

**Lo que se puede hacer**
- seleccionar periodo
- exportar reportes a Excel
- revisar balanza de comprobacion
- revisar estado de resultados
- revisar balance general

**Superficies secundarias**
- no abre modal propio

**Reportes incluidos**
- balanza de comprobacion
- estado de resultados
- balance general

**Indicadores visibles**
- debitos acumulados
- creditos acumulados
- resultado neto del periodo

### 11. Cierre de periodo

**URL**
- `/contabilidad/cierre-periodo`

**Proposito**
- cerrar meses contables y dejar historial de cierres

**Lo que se puede hacer**
- revisar estado de periodo seleccionado
- ver movimientos y acumulado del periodo
- ver conteo de periodos abiertos y cerrados
- abrir modal de cierre
- elegir periodo a cerrar
- registrar nota de cierre

**Superficies secundarias**
- `Modal` de cierre de periodo

**Historial**
- periodo
- nota
- usuario que cerro

**Ausencia detectada**
- no se ve una superficie para reabrir periodo desde esta misma pantalla

## Ventas, facturas y preventas

### 12. Ventas POS

**URL**
- `/sales`

**Proposito**
- ejecutar la venta operativa en caja
- alimentar el circuito que luego impacta facturacion, CxC y contabilidad

**Lo que se puede hacer**
- buscar y agregar productos
- agregar productos por escaneo de codigo de barras
- abrir cliente
- abrir carrito
- abrir panel de facturacion
- trabajar con moneda documental
- gestionar credito, cuentas por cobrar, notas de credito y formas de pago

**Superficies secundarias**
- `InvoicePanel`
- `ProductBatchModal`
- `CashRegisterAlertModal`
- `PreorderModal`
- `PriceAndSaleUnitsModal`
- `InsuranceAuthModal`
- `TaxReceiptDepletedModal`
- `CommentModal`
- `BatchInfoModal`

**Dependencias financieras**
- cuadre de caja abierto
- configuracion fiscal
- configuracion bancaria
- validaciones de CxC

### 13. Facturas de ventas

**URL**
- `/bills`

**Proposito**
- consultar y filtrar facturas emitidas

**Lo que se puede hacer**
- buscar facturas
- filtrar por criterios de factura
- ordenar resultados
- ver tabla o lista segun viewport

**Superficies secundarias**
- `SaleReportTable` en desktop
- `SaleRecordList` en movil

**Relacion financiera**
- es la base visual de documentos que luego conectan con CxC y analytics

### 14. Analisis de ventas

**URL**
- `/bills/analytics`

**Proposito**
- analizar comportamiento comercial y de facturacion

**Lo que se puede hacer**
- aplicar filtros
- ajustar rango de fechas
- cambiar criterio de orden
- ver panel analitico de ventas
- volver a facturas

**Superficies secundarias**
- panel de analytics con charts, breakdowns y resumenes

### 15. Preventas

**URL**
- `/preorders`

**Proposito**
- revisar preventas y preparar su conversion operativa

**Lo que se puede hacer**
- buscar preventas
- filtrar por cliente
- revisar listado de preventas
- abrir el `InvoicePanel` desde el flujo de preventa

**Superficies secundarias**
- `InvoicePanel`
- `ReceivableDecisionModal` dentro de la tabla de preventas

## Gastos

### 16. Gastos listado

**URL**
- `/expenses/list`

**Proposito**
- listar gastos, filtrarlos y abrir el formulario de registro/edicion

**Lo que se puede hacer**
- buscar por texto
- filtrar por categoria, estado y fecha
- ver recibo o evidencia
- editar gasto
- eliminar gasto
- ver grafico o reporte de gastos

**Superficies secundarias**
- `ExpensesForm` modal embebido en la pantalla
- visor de imagen para recibos
- `ExpenseChart`

### 17. Gastos nuevo

**URL**
- `/expenses/new`

**Proposito**
- disparar el mismo formulario de gastos en modo alta

**Lo que se puede hacer**
- registrar gasto
- adjuntar evidencias
- elegir categoria
- elegir metodo de pago
- asociar cuadre de caja si aplica
- usar cuenta bancaria configurada si aplica

**Superficies secundarias**
- `ExpensesForm` modal
- `ManageExpenseCategoriesModal`

### 18. Gastos editar

**URL**
- `/expenses/update/:id`

**Proposito**
- editar gasto existente con el mismo formulario base

**Superficies secundarias**
- `ExpensesForm` modal
- `ManageExpenseCategoriesModal`

## Compras y cuentas por pagar embebidas

### 19. Compras listado

**URL**
- `/purchases`

**Proposito**
- listar compras, filtrarlas y operar pagos a suplidores

**Lo que se puede hacer**
- filtrar compras
- buscar compras
- ver tabla agrupada
- cancelar compra
- registrar pago a suplidor si el rollout contable esta activo
- ver historial de pagos de suplidor si el rollout contable esta activo

**Superficies secundarias**
- `PurchaseCompletionSummary`
- `RegisterSupplierPaymentModal`
- `SupplierPaymentHistoryModal`

**Nota importante**
- aqui vive hoy la parte mas visible de cuentas por pagar
- no existe una pantalla independiente de CxP

### 20. Analisis de compras

**URL**
- `/purchases/analytics`

**Proposito**
- revisar tendencias y resumenes de compras

**Lo que se puede hacer**
- aplicar filtros
- buscar
- revisar panel analitico de compras
- volver al listado

**Superficies secundarias**
- `PurchasesAnalyticsPanel`

### 21. Compra nueva

**URL**
- `/purchases/create`

**Proposito**
- capturar una compra nueva

**Lo que se puede hacer**
- llenar formulario general de compra
- adjuntar evidencias
- elegir suplidor y datos generales
- confirmar almacen
- enviar compra

**Superficies secundarias**
- `PurchaseWarehouseModal`
- `PurchaseCompletionSummary`

### 22. Compra editar

**URL**
- `/purchases/update/:id`

**Proposito**
- editar compra existente

**Superficies secundarias**
- `PurchaseWarehouseModal`
- `PurchaseCompletionSummary`

### 23. Completar recepcion de compra

**URL**
- `/purchases/complete/:id`

**Proposito**
- registrar recepcion o completado de una compra

**Lo que se puede hacer**
- usar `PurchaseReceiptForm`
- registrar cantidades recibidas
- cerrar el ciclo operativo de la compra

**Superficies secundarias**
- `PurchaseWarehouseModal`
- `PurchaseCompletionSummary`

### 24. Backorders

**URL**
- `/backorders`

**Proposito**
- monitorear productos con pendientes de suplido

**Lo que se puede hacer**
- buscar producto
- filtrar por fecha
- filtrar por estado
- ordenar grupos
- exportar backorders a Excel
- abrir modal para cubrir pendiente

**Superficies secundarias**
- `FulfillModal`
- `InventoryMenu`

## Cuentas por cobrar

### 25. CxC listado

**URL**
- `/account-receivable/list`

**Proposito**
- ver las cuentas por cobrar activas o historicas y abrir detalle

**Lo que se puede hacer**
- buscar
- filtrar por fecha
- filtrar por estado
- filtrar por tipo de cliente
- filtrar por cliente puntual
- filtrar por estado de pago
- ordenar
- abrir detalle por fila

**Superficies secundarias**
- modal de detalle disparado por `setARDetailsModal`
- toolbar global de CxC con `MultiPaymentModal` para pagos multiples de aseguradora

### 26. CxC detalle

**URL**
- `/account-receivable/info/:id`

**Proposito**
- mostrar detalle de una cuenta por cobrar concreta

**Lo que se puede hacer hoy**
- revisar resumen de cuenta
- revisar cuotas
- revisar historial de pagos
- revisar pagos aplicados

**Acciones visibles**
- `Registrar Pago`
- `Editar Cuenta`
- `Generar Reporte`

**Problemas detectados**
- pantalla legacy
- estilos viejos
- acciones visibles no conectadas a un flujo fuerte
- boton `Back` sin integracion clara

### 27. Auditoria CxC

**URL**
- `/account-receivable/audit`

**Proposito**
- detectar inconsistencias entre facturas y cuentas por cobrar

**Lo que se puede hacer**
- recalcular muestra
- definir tamano de muestra
- filtrar por con CxC o sin CxC
- buscar por factura, numero o cliente
- exportar a Excel
- abrir recuperacion tecnica de factura si el usuario tiene acceso developer

**Superficies secundarias**
- exportacion Excel
- navegacion a `/dev/tools/invoice-v2-recovery`

### 28. Recibos de CxC

**URL**
- `/account-receivable/receipts`

**Estado actual**
- placeholder
- hoy solo renderiza `ReceivablePaymentReceipt`

**Lectura**
- superficie prevista pero no implementada realmente como pagina funcional

## Pagos CxC no route-backed pero importantes

### 29. Modal de pago de cuenta por cobrar

**Superficie**
- `PaymentForm`

**Donde vive**
- flujo de CxC y pagos puntuales

**Lo que permite**
- pagar cuenta o balance
- seleccionar concepto de pago
- manejar metodos de pago
- usar selector de notas de credito
- imprimir recibo
- auto completar con factura si aplica

**Superficies secundarias**
- `AutoCompleteResultModal`
- `TaxReceiptDepletedModal`
- recibo imprimible de pago

### 30. Modal de pago multiple de aseguradora

**Superficie**
- `MultiPaymentModal`

**Donde vive**
- toolbar global de CxC

**Lo que permite**
- seleccionar multiples cuentas
- filtrar por aseguradora
- seleccionar metodos de pago
- imprimir recibo consolidado
- procesar pago multiple de aseguradora

## Cuadre de caja

### 31. Cuadre de caja listado

**URL**
- `/cash-reconciliation`

**Proposito**
- listar cuadres de caja y entrar al cierre de un cuadre concreto

**Lo que se puede hacer**
- filtrar por estado
- filtrar por usuario
- filtrar por rango de fecha
- ordenar ascendente o descendente
- abrir un cuadre especifico

**Superficies secundarias**
- tabla avanzada
- al hacer click en fila navega a cierre de caja

### 32. Apertura de caja

**URL**
- `/cash-register-opening`

**Proposito**
- registrar la apertura del cuadre de caja

**Lo que se puede hacer**
- contar efectivo de apertura
- escribir comentario de apertura
- autorizar apertura
- cancelar apertura

**Superficies secundarias**
- `CashDenominationCalculator`
- `PeerReviewAuthorization`
- `PinAuthorizationModal`

### 33. Cierre de caja

**URL**
- `/cash-register-closure/:id`

**Proposito**
- cerrar el cuadre de caja y autorizar el cierre

**Lo que se puede hacer**
- revisar body del cierre
- restaurar el estado a abierto si aplica
- ejecutar autorizacion de cierre

**Superficies secundarias**
- `PeerReviewAuthorization`
- `PinAuthorizationModal`
- componentes internos para ver resumen de transacciones, facturas y gastos

**Observacion**
- el detalle de facturas del cuadre se apoya en otra superficie: `CashupInvoicesOverview`

### 34. Facturas del cuadre

**URL**
- `/cash-register-invoices-overview`

**Proposito**
- ver facturas asociadas a un cuadre de caja

**Lo que se puede hacer**
- abrir listado de facturas en drawer
- exportar facturas del cuadre

**Superficies secundarias**
- `Drawer` bottom full-screen
- `ExportInvoice`

## Mapa de ausencias o huecos detectados

### Ausencias funcionales fuertes

- No existe una pantalla dedicada de `Cuentas por pagar` como modulo independiente.
- `/account-receivable/receipts` esta sin implementar de forma real.
- `AccountReceivableInfo` sigue siendo una pantalla legacy con acciones flojas y sin integracion moderna fuerte.
- En `Cierre de periodo` no se ve una accion equivalente para reabrir periodo.

### Ausencias de inventario contable a revisar

- relacion explicita entre `compras` y `cuentas por pagar` como dominio navegable
- relacion explicita entre `ventas/facturas` y `asientos generados`
- dashboard ejecutivo financiero consolidado
- detalle navegable desde reportes a cuenta o asiento origen

## Recomendaciones de uso de este documento

- usarlo como checklist de cobertura funcional
- marcar por pantalla:
  - OK
  - incompleta
  - legacy
  - faltante
- comparar cada superficie contra:
  - necesidad operativa
  - necesidad contable
  - consistencia de UX
  - consistencia con design system

## Fuente principal

Este inventario se construyo leyendo rutas y componentes en:
- `src/router/routes/routesName.ts`
- `src/router/routes/paths/Accounting.tsx`
- `src/router/routes/paths/Setting.tsx`
- `src/router/routes/paths/Sales.tsx`
- `src/router/routes/paths/Purchases.tsx`
- `src/router/routes/paths/Expenses.tsx`
- `src/router/routes/paths/AccountReceivable.tsx`
- `src/router/routes/paths/CashReconciliztion.tsx`
- y las pantallas/componentes principales de cada modulo funcional
