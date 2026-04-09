# Diagnostico de reportes y metricas

Fecha: 2026-03-23

## Resumen ejecutivo

El sistema ya tiene varios reportes operativos, pero estan fragmentados por modulo y casi todos se calculan en frontend desde colecciones crudas del negocio activo.

Hoy existen piezas utiles para ventas, utilidad, inventario, compras, gastos, CxC y auditorias tecnicas, pero no existe una capa analitica unificada para responder estas dos preguntas clave:

1. Que necesita ver el dueno/admin de un negocio para dirigir la operacion.
2. Que necesita ver el equipo dev/plataforma para controlar la salud de todos los negocios, la calidad de los datos y el riesgo operativo.

La conclusion es simple:

- Si hay reportes.
- No hay BI consolidado.
- No hay tablero global multi-negocio real.
- No hay definicion unica de KPIs.
- No hay agregados centralizados en backend para analitica.

## Mapa actual del producto

| Dominio | Modulos / archivos observados | Reportes o vistas existentes | Gap principal |
| --- | --- | --- | --- |
| Ventas / Facturas | `src/modules/sales/**`, `src/modules/invoice/pages/InvoicesPage/**` | Tabla de facturas, filtros, panel de analitica de ventas, reporte por cliente, metodos de pago, descuentos, ventas diarias | No hay tablero ejecutivo de ventas y margen por negocio |
| Utilidad / finanzas | `src/modules/utility/pages/Utility/**` | Ventas totales, utilidad neta, mejor dia, distribucion costo/gasto/impuesto/utilidad, series diarias, breakdown de productos | Sigue siendo por negocio activo y calculado en cliente; no hay comparativo corporativo ni metas |
| Inventario | `src/modules/inventory/**` | Resumen de inventario, movimientos, almacenes, sesiones de conteo, resumen exportable | Falta rotacion, cobertura, quiebres, merma, riesgo de vencimiento y salud operativa ejecutiva |
| Cuentas por cobrar | `src/modules/accountsReceivable/**` | Lista, detalle, recibos, auditoria de cobertura factura-CxC | Falta aging serio, morosidad, velocidad de cobro, riesgo por cliente y score de cobranza |
| Caja / cuadre | `src/modules/cashReconciliation/**` | Apertura, cierre, lista de cuadres, resumen de facturas del cuadre, auditoria tecnica en devtools | Falta tendencia de descuadres, control por cajero, SLA de cierres y alertas |
| Compras / abastecimiento | `src/modules/orderAndPurchase/**` | Reporte de compras por dia, proveedor, categoria y series mensuales; backorders | Falta desempeno de suplidores, lead time, fill rate, variacion de costo y aging de cuentas por pagar |
| Gastos | `src/modules/expenses/**` | Reporte diario, por categoria y mensual | Falta control presupuestario, peso del gasto sobre ventas y anomalias |
| Fiscal / NCF | `src/modules/dev/pages/DevTools/FiscalReceiptsAudit/**`, `src/firebase/taxReceipt/**` | Auditoria tecnica, ledger insights, rebuilds, alertas de secuencia | Falta vista amigable de riesgo fiscal para el negocio |
| Negocios / plataforma | `src/modules/controlPanel/CreateBusinessControl/**`, `src/firebase/dev/businesses/**`, billing | Lista de negocios, filtros, salud basica de ownership/subscripcion | Falta cockpit global multi-negocio con actividad comercial, riesgo y adopcion |
| Usuarios / actividad | `src/modules/settings/pages/setting/subPage/Users/UserActivity/**`, `src/firebase/presence/**` | Resumen basico de sesiones por usuario | Falta adopcion por modulo, actividad por rol y productividad |

## Hallazgos estructurales

### 1. La analitica esta repartida y acoplada a la UI

- `src/modules/utility/pages/Utility/hooks/useUtilityDashboard.ts` calcula metricas financieras combinando facturas y gastos en el cliente.
- `src/modules/utility/pages/Utility/utils/metrics.ts` arma ventas, costo, impuestos, gastos, utilidad diaria y horaria desde documentos crudos.
- `src/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/SalesAnalyticsPanel.tsx` expone analitica de ventas dentro del modulo de facturas, no como tablero ejecutivo.
- `src/modules/inventory/pages/InventorySummary/InventorySummary.tsx` y `useInventorySummaryData.ts` generan un resumen de inventario pero aislado.

### 2. Casi todo esta pensado por negocio activo, no para comparacion global

- `src/firebase/invoices/fbGetInvoices.ts` consulta `businesses/{businessID}/invoices`.
- `src/firebase/expenses/Items/useFbGetExpenses.ts` consulta `businesses/{businessID}/expenses`.
- La documentacion de inventario confirma el mismo patron bajo `businesses/{businessID}/...`.

Eso significa que el producto resuelve operacion local, pero no gobierno corporativo ni observabilidad transversal.

### 3. El backend no tiene una capa analitica dedicada

Al revisar `functions/src/index.js` y el arbol de `functions/src`, aparecen funciones operativas, crons de mantenimiento y auditorias, pero no funciones de agregacion de KPIs de negocio ni pipeline de analytics multi-negocio.

Hoy hay crons para stock, billing, conciliaciones y tareas tecnicas, no para producir:

- resumen diario por negocio
- resumen global de la plataforma
- score de salud del negocio
- alertas gerenciales automaticas

### 4. El home no es un dashboard de negocio

`src/modules/home/pages/Home/Home.tsx` muestra onboarding, banners y atajos. No es un centro de control ejecutivo.

### 5. El panel dev actual cubre administracion, no BI

`src/modules/controlPanel/CreateBusinessControl/BusinessControl.tsx` muestra total de negocios, ownership y estado de suscripcion. Eso sirve para catalogo y soporte, pero no para responder:

- cuales negocios estan creciendo o cayendo
- cuales tienen riesgo financiero u operativo
- cuales tienen mala calidad de datos
- cuales requieren intervencion

## Lo que ya se puede explotar con los datos actuales

Sin cambiar el modelo base, ya se puede construir un tablero v1 bastante fuerte usando datos existentes de:

- facturas
- gastos
- compras
- inventario
- movimientos de inventario
- cuentas por cobrar
- cuadres de caja
- credit notes / cancelaciones
- datos de suscripcion y ownership

## KPIs obligatorios para dueno o admin del negocio

### P0: imprescindibles y mayormente calculables hoy

| KPI | Para que sirve | Estado probable |
| --- | --- | --- |
| Ventas brutas, ventas netas y cantidad de facturas | Medir volumen real del negocio | Se puede construir ya |
| Ticket promedio | Detectar capacidad de monetizacion por transaccion | Se puede construir ya |
| Unidades vendidas | Separar crecimiento por volumen vs precio | Se puede construir ya |
| Margen bruto y utilidad neta | Saber si vender mas realmente deja dinero | Se puede construir ya |
| Ventas por dia, hora y dia de semana | Identificar picos y horarios muertos | Se puede construir ya |
| Ventas por categoria, producto, cliente, usuario y metodo de pago | Detectar mezcla comercial y dependencia | Se puede construir ya |
| Descuentos y notas de credito como porcentaje de ventas | Vigilar fuga comercial | Parcial, depende de normalizacion de credit notes/cancelaciones |
| Caja esperada vs caja real por cuadre | Detectar descuadres | Se puede construir ya |
| Descuadre por cajero y por turno | Detectar riesgo operativo o fraude | Parcial, depende de consistencia de cash count + usuario |
| CxC total pendiente | Ver dinero vendido pero no cobrado | Se puede construir ya |
| Aging de CxC: 0-30, 31-60, 61-90, 90+ dias | Priorizar cobranza y morosidad | Se puede construir ya |
| Tasa de cobro y recuperacion del mes | Medir eficiencia de cobranza | Se puede construir ya |
| Valor de inventario a costo y a precio lista | Medir capital inmovilizado | Se puede construir ya |
| Productos con stock bajo o cero | Evitar quiebres | Se puede construir ya |
| Gastos por categoria y gasto/venta | Ver si la operacion se esta comiendo el margen | Se puede construir ya |
| Compras por suplidor y categoria | Entender abastecimiento y dependencia | Se puede construir ya |
| Riesgo de NCF: secuencias bajas o agotadas | Evitar bloqueo fiscal de ventas | Se puede construir ya |

### P1: muy importantes, pero requieren consolidacion o normalizacion

| KPI | Para que sirve | Estado probable |
| --- | --- | --- |
| Rotacion de inventario | Saber si compras demasiado o vendes lento | Parcial |
| Dias de cobertura de inventario | Saber cuantos dias puedes operar con stock actual | Parcial |
| Productos de baja rotacion / sin movimiento | Liberar capital atrapado | Parcial |
| Riesgo de vencimiento por lote | Reducir perdidas por expiracion | Parcial |
| Margen por categoria y por producto | Priorizar surtido rentable | Parcial |
| Precio de compra promedio vs precio de venta promedio | Medir spread real | Parcial |
| Fill rate de backorders | Medir capacidad de cumplimiento | Parcial |
| Lead time de suplidores | Medir calidad de abastecimiento | Parcial, depende de fechas confiables en orden/compra |
| Concentracion de clientes | Saber si dependes de pocos clientes | Se puede construir, pero requiere limpieza de clientes |
| Recompra o frecuencia de cliente | Medir recurrencia | Parcial, depende de identidad unificada del cliente |
| Ventas de seguro vs contado vs credito | Entender mezcla de negocio | Parcial |

### P2: valiosas, pero requieren nueva captura de eventos

| KPI | Para que sirve | Estado requerido |
| --- | --- | --- |
| Quiebres con perdida estimada de venta | Cuanto dejas de vender por no tener stock | Nueva telemetria |
| Conversion POS: productos agregados vs facturas cerradas | Detectar abandono o friccion | Nueva telemetria |
| Tiempo promedio de atencion / cierre por venta | Medir productividad operativa | Nueva telemetria |
| Efectividad de promociones por campana | Medir retorno promocional | Nueva telemetria |
| Funnel de uso por modulo del negocio | Saber si el negocio adopta toda la plataforma | Nueva telemetria |

## KPIs obligatorios para dev / plataforma / soporte

### P0: imprescindibles y en gran parte construibles ya

| KPI | Para que sirve | Estado probable |
| --- | --- | --- |
| Negocios activos con ventas en 7/30 dias | Saber quien usa realmente el producto | Se puede construir ya |
| Negocios sin dueno, sin suscripcion o con suscripcion en riesgo | Priorizar soporte y revenue ops | Se puede construir ya |
| Negocios con cero ventas, cero compras o cero gastos por periodos largos | Detectar abandono o setup incompleto | Se puede construir ya |
| Negocios con alto saldo vencido en CxC | Detectar riesgo financiero | Se puede construir ya |
| Negocios con descuadres de caja recurrentes | Detectar riesgo operativo | Parcial |
| Negocios con stock negativo, bajo o inconsistente | Detectar riesgo de inventario | Se puede construir ya |
| Invoices sin CxC cuando deberian tener CxC | Detectar inconsistencia de negocio y datos | Ya existe auditoria parcial |
| Riesgo fiscal por agotamiento o anomalias NCF | Detectar bloqueo operativo | Ya existe base tecnica |
| Negocios con errores de sync, repair o recovery frecuentes | Detectar deuda tecnica visible al cliente | Ya existe base tecnica |
| Calidad maestra de datos: productos sin costo, sin precio, sin categoria, sin stock valido | Detectar problemas antes de que escalen | Parcial |

### P1: muy importantes para escalar la plataforma

| KPI | Para que sirve | Estado probable |
| --- | --- | --- |
| Cohortes de negocios por fecha de activacion, industria y tamano | Entender retencion y expansion | Parcial |
| Uso por modulo: ventas, inventario, compras, gastos, CxC, fiscal | Medir adopcion real | Nueva telemetria o derivacion parcial |
| DAU, WAU, MAU por negocio y por rol | Medir stickiness | Nueva telemetria / presence consolidada |
| Trial-to-paid y churn por cohorte | Medir salud comercial | Parcial con billing |
| Health score por negocio | Priorizar soporte proactivo | Requiere capa analitica |
| Tiempo desde onboarding hasta primera venta / primera compra / primer cuadre | Medir activacion | Parcial |

### P2: para una plataforma madura

| KPI | Para que sirve | Estado requerido |
| --- | --- | --- |
| Screen analytics y eventos por feature | Priorizar roadmap y UX | Nueva telemetria |
| Errores funcionales por negocio / modulo / version | Soporte proactivo y quality engineering | Nueva telemetria unificada |
| Forecast de churn o riesgo operacional | Intervencion anticipada | Capa analitica + historico |

## Reportes que faltan si o si

### 1. Dashboard ejecutivo del negocio

Debe responder en menos de 30 segundos:

- cuanto vendi
- cuanto gane
- cuanto me deben
- cuanto tengo en inventario
- donde estoy perdiendo dinero
- que productos y categorias me mueven el negocio
- si la caja cuadra
- si tengo riesgo fiscal

Vista recomendada:

- fila 1: ventas netas, ticket promedio, utilidad neta, CxC vencida, descuadre de caja, valor de inventario
- fila 2: ventas por dia/hora, margen por categoria, gastos por categoria
- fila 3: top productos, productos sin rotacion, productos con stock critico, aging de CxC
- fila 4: alertas accionables

### 2. Dashboard global de plataforma

Debe responder:

- cuantos negocios estan sanos
- cuales estan en riesgo
- cuales estan creciendo
- cuales tienen problemas de datos
- cuales necesitan soporte

Vista recomendada:

- fila 1: negocios activos, trial, pagos, en riesgo, sin dueno, con errores criticos
- fila 2: ranking de negocios por ventas y por riesgo
- fila 3: salud de datos: CxC, caja, stock, fiscal, sync
- fila 4: adopcion por modulo y health score

### 3. Centro de alertas operativas

Alertas minimas:

- caja no cerrada
- caja con diferencia mayor al umbral
- CxC vencida por encima del umbral
- NCF por agotarse
- productos sin costo o sin precio
- productos en stock cero con ventas historicas altas
- productos proximos a vencer
- negocio sin ventas en X dias
- negocio con errores de sincronizacion repetidos

## Propuesta de arquitectura analitica

## Principio

Mantener las colecciones actuales como fuente de verdad y crear una capa derivada de analytics. No mover la logica ejecutiva a la UI.

## Modelo recomendado

### Por negocio

- `businesses/{businessId}/analyticsDaily/{yyyy-mm-dd}`
- `businesses/{businessId}/analyticsMonthly/{yyyy-mm}`
- `businesses/{businessId}/analyticsCurrent/overview`
- `businesses/{businessId}/alerts/{alertId}`

### Global plataforma

- `platformAnalytics/businessDaily/{businessId}_{yyyy-mm-dd}`
- `platformAnalytics/businessCurrent/{businessId}`
- `platformAnalytics/globalCurrent/overview`
- `platformAnalytics/alerts/{alertId}`

## Dominios que debe contener cada agregado

- `sales`
- `cash`
- `receivables`
- `inventory`
- `purchases`
- `expenses`
- `fiscal`
- `users`
- `integrity`
- `billing`

## Flujo recomendado

1. Triggers o controladores actualizan hechos base al crear o modificar factura, gasto, compra, pago CxC, cuadre, movimiento de inventario o cambio de suscripcion.
2. Un reconciler nocturno recalcula los ultimos 7-30 dias para corregir drift.
3. Un job de health scoring clasifica cada negocio.
4. Los dashboards leen solo agregados, no colecciones crudas.

## Regla para evitar complejidad accidental

- v1 diario para casi todo
- horario solo para ventas y caja
- una sola definicion de KPI
- una sola capa de agregados
- una sola fuente de alertas

## KPI dictionary minimo

Antes de construir dashboards, hay que congelar definiciones:

- ventas brutas
- ventas netas
- utilidad bruta
- utilidad neta
- gasto operativo
- CxC activa
- CxC vencida
- valor de inventario a costo
- descuadre de caja
- negocio activo
- negocio en riesgo

Si eso no se define primero, terminaran con numeros distintos en cada modulo.

## Roadmap recomendado

### Fase 1: negocio v1

Objetivo: darle al dueno/admin un dashboard serio usando datos ya disponibles.

Entregables:

- ventas
- utilidad
- caja
- CxC
- inventario
- gastos
- compras
- alertas basicas

### Fase 2: plataforma v1

Objetivo: darle a dev/ops/soporte un cockpit multi-negocio.

Entregables:

- health score por negocio
- ranking de riesgo
- ranking de crecimiento
- integridad de datos
- actividad comercial basica
- estado de suscripcion y ownership

### Fase 3: normalizacion y profundidad

Objetivo: mejorar calidad y profundidad de KPIs.

Entregables:

- aging formal
- margen por categoria
- rotacion y cobertura
- lead time de suplidor
- descuadre por cajero
- devoluciones y credit notes integradas

### Fase 4: telemetria de producto

Objetivo: medir adopcion y comportamiento, no solo resultados contables.

Entregables:

- eventos por modulo
- DAU/WAU/MAU
- embudos de activacion
- uso por rol
- riesgo de churn

## Prioridad real de implementacion

Si tuviera que elegir que hacer primero en este repo, haria esto:

1. Definir KPI dictionary.
2. Crear agregados diarios por negocio.
3. Montar dashboard ejecutivo del negocio.
4. Montar dashboard global de plataforma.
5. Agregar alertas y health score.
6. Agregar telemetria de producto.

## Conclusiones directas

- El repo ya tiene suficiente data para un dashboard v1 fuerte.
- Lo que falta no es solo UI; falta una capa analitica comun.
- Hoy el negocio ve fragmentos; no ve el negocio completo.
- Hoy dev ve auditorias tecnicas y catalogo de negocios; no ve la salud economica y operativa global.
- El siguiente salto de valor no es otro reporte aislado: es un sistema de metricas centralizado, con agregados, alertas y dos vistas claras:
  - vista negocio: dirigir
  - vista plataforma: gobernar
