# Plan de compatibilidad multi-sucursal y analitica enterprise (2026-03-23)

## Objetivo
Agregar soporte real de `multi-sucursal` sin romper el modelo actual `multi-business`, y redefinir la capa de metricas/reportes para operar con disciplina enterprise:

- un solo contrato de datos por dominio
- una sola definicion de KPIs
- agregados server-side
- permisos por alcance
- trazabilidad y reconciliacion
- vistas separadas para negocio y plataforma

## Decision de arquitectura
- [x] `businessId` sigue siendo el tenant primario del sistema.
- [x] `branchId` se agrega como entidad operativa de primer nivel dentro del negocio.
- [x] `warehouse` no sustituye `branch`; son conceptos distintos.
- [x] `cashCount`, ventas, gastos operativos y reportes gerenciales deben quedar asociados a una `branch`.
- [x] La analitica deja de vivir repartida en frontend y pasa a una capa derivada en backend.
- [x] La migracion debe ser aditiva, idempotente y por fases; no se recomienda un corte big-bang.

## Respuesta corta: es posible o no?
Si, es posible.

La razon es que el repo ya esta organizado por `businesses/{businessId}` y eso nos da una frontera tenant estable. `branchId` puede entrar como una dimension adicional sin reescribir la raiz multi-tenant.

Lo que no es viable es meter `multi-sucursal` como parche cosmetico usando almacenes o creando un `businessId` por sucursal. Eso resolveria una parte de la operacion local, pero romperia:

- consolidacion real por empresa
- permisos por sucursal
- caja por sucursal
- comparativos entre sucursales
- salud global del negocio
- reportes enterprise coherentes

## Estado actual auditado

### Lo que si existe hoy
- `multi-business`: un usuario puede tener o elegir contexto de negocio.
- `multi-warehouse`: un negocio puede tener varios almacenes.
- multiples cajas abiertas por negocio: ya existe limite y flujo operativo.
- inventario con compatibilidad parcial de ubicaciones que tolera `branches` como alias de ruta.

### Lo que no existe hoy
- entidad `branch/sucursal` como concepto canonico del dominio
- `branchId` transversal en facturas, caja, compras, gastos, CxC y fiscal
- selector formal de sucursal dentro de un negocio
- permisos por sucursal
- dashboards por sucursal y consolidado por negocio
- health score multi-sucursal

### Hallazgo importante
Hay una huella parcial de `branches` en inventario/ubicaciones, pero hoy funciona solo como compatibilidad de path o naming. No es soporte enterprise de sucursal. Esto es util para migracion y compatibilidad, pero no debe confundirse con el modelo final.

### Supuesto legacy que debe quedar superado
En `plans/multi-business/PLANES_TIERED_PRICING.md` existe el supuesto:

`1 sucursal/entorno = 1 businessId`

Ese supuesto describe el modelo actual, pero no debe seguir guiando la arquitectura futura si se adopta `multi-sucursal` real.

## Modelo objetivo del dominio

### Niveles del sistema
1. `Plataforma`
2. `Business` = empresa o tenant
3. `Branch` = sucursal / sede / tienda
4. `Warehouse` = almacen fisico o logico
5. `Cash register / cashCount` = caja o turno operativo
6. `User / employee`

### Regla semantica
- `business` responde "de quien es la empresa".
- `branch` responde "donde opera esa empresa".
- `warehouse` responde "donde se guarda o mueve stock".
- `cashCount` responde "desde que caja/turno se opero".

### Entidad nueva recomendada
Ruta:

`businesses/{businessId}/branches/{branchId}`

Shape minimo recomendado:

```json
{
  "id": "branch_central",
  "code": "CENTRAL",
  "name": "Sucursal Central",
  "status": "active",
  "type": "store",
  "address": {
    "line1": "",
    "city": "",
    "country": "DO"
  },
  "contact": {
    "phone": "",
    "email": ""
  },
  "timezone": "America/Santo_Domingo",
  "defaultWarehouseId": "wh_central",
  "managerUserIds": ["uid_1"],
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

### Reglas estructurales obligatorias
- Toda factura nueva debe guardar `branchId` y snapshot de sucursal.
- Toda apertura/cierre de caja debe pertenecer a una sucursal.
- Todo gasto operativo debe poder asociarse a una sucursal.
- Toda compra o recepcion debe conocer `destinationWarehouseId` y, cuando aplique, `branchId`.
- Todo `warehouse` debe tener `branchId` o marcarse como `shared`.
- Todo dashboard ejecutivo debe poder consolidar por negocio y desglosar por sucursal.

### Campos nuevos recomendados por dominio

#### Membresias / acceso
- `defaultBranchId`
- `lastSelectedBranchId`
- `allowedBranchIds` o `branchScope`

#### Facturas
- `branchId`
- `branchCode`
- `branchNameSnapshot`
- `fulfillmentWarehouseId`

#### Cash count / caja
- `branchId`
- `branchNameSnapshot`
- `cashRegisterId` o `stationId` si se quiere granularidad futura

#### Compras
- `branchId`
- `destinationWarehouseId`
- `receivingBranchId` si la recepcion difiere del origen del pedido

#### Gastos
- `branchId`
- `expenseOrigin` (`branch`, `business`, `shared`)

#### Inventario / almacenes
- `branchId` nullable
- `sharedAcrossBranches`

## Invariantes enterprise
- [x] `branchId` nunca sustituye `businessId`.
- [x] Las transacciones historicas deben guardar snapshot de sucursal para no depender de renombres.
- [x] Los agregados analiticos no se calculan en UI.
- [x] Las mutaciones de ventas/caja/inventario que afecten metricas deben salir de backend o quedar reconciliadas por jobs.
- [x] Las metricas deben tener definicion canonica y versionada.
- [x] Los dashboards leen agregados; no colecciones crudas.

## Impacto por modulo

### 1. Auth, sesion y contexto activo
Hoy existe `activeBusinessId`; con multi-sucursal hace falta `activeBranchId` cuando el usuario opere dentro de un negocio con varias sedes.

Regla recomendada:
1. El usuario entra al `business`.
2. Si solo tiene una sucursal activa, se autoselecciona.
3. Si tiene varias, se muestra selector de sucursal.
4. El backend valida membresia al negocio y alcance a la sucursal.

### 2. Ventas / facturas
Es el dominio mas importante porque ya tiene flujo backend V2 relativamente serio.

Cambio requerido:
- `createInvoice.controller` y orquestacion V2 deben aceptar `branchId`.
- `invoicesV2` y la factura canonica deben persistir `branchId` y snapshot.
- las tareas de outbox deben propagar esa dimension a inventario, caja, CxC y fiscal.

### 3. Caja / cuadre
Hoy caja esta modelada por negocio. En enterprise debe quedar por sucursal y opcionalmente por estacion.

Cambio requerido:
- apertura/cierre de caja con `branchId`
- limites y validaciones por sucursal
- descuadre esperado vs real por sucursal, cajero y turno

### 4. Inventario
El inventario ya tiene multiple warehouse. Eso ayuda, pero no reemplaza sucursal.

Modelo recomendado:
- `warehouse` pertenece a una sucursal o es compartido
- las transferencias entre sucursales se modelan explicitamente
- el reporte ejecutivo lee consolidado por negocio, por sucursal y por almacen

### 5. Compras y abastecimiento
El sistema ya puede apuntar compras a un almacen. Debe completar la semantica empresarial:

- quien compra
- para cual sucursal
- a cual almacen entra
- si fue compra centralizada o local

### 6. Gastos
Hoy el gasto sirve para negocio activo. Con multi-sucursal hacen falta dos niveles:

- gasto del negocio completo
- gasto imputado a sucursal

Sin eso, la utilidad por sucursal queda falseada.

### 7. CxC y CxP
Las cuentas deben heredar la sucursal de origen del documento comercial para poder responder:

- que sucursal vende mas a credito
- que sucursal cobra peor
- que sucursal concentra mas morosidad

### 8. Fiscal / NCF
Aunque la numeracion fiscal pueda seguir gestionandose a nivel negocio o serie, el riesgo y el consumo deben ser visibles por sucursal para operacion y soporte.

### 9. Billing, limites y permisos
Si el producto adopta multi-sucursal real, el catalogo de planes eventualmente debe soportar `maxBranches`.

Eso no obliga a cobrar por sucursal desde el dia 1, pero la arquitectura debe quedar preparada para:

- plan sin multi-sucursal
- plan con `N` sucursales
- plan enterprise sin limite practico

## Arquitectura objetivo de metricas y reportes

### Principio
Las metricas deben tener una sola fuente derivada, no varias formulas dispersas entre modulos.

### Niveles de agregacion recomendados

#### Por negocio
- `businesses/{businessId}/analyticsCurrent/overview`
- `businesses/{businessId}/analyticsDaily/{yyyy-mm-dd}`
- `businesses/{businessId}/analyticsMonthly/{yyyy-mm}`
- `businesses/{businessId}/alerts/{alertId}`

#### Por sucursal
- `businesses/{businessId}/branches/{branchId}/analyticsCurrent/overview`
- `businesses/{businessId}/branches/{branchId}/analyticsDaily/{yyyy-mm-dd}`
- `businesses/{businessId}/branches/{branchId}/analyticsMonthly/{yyyy-mm}`
- `businesses/{businessId}/branches/{branchId}/alerts/{alertId}`

#### Plataforma global
- `platformAnalytics/businessCurrent/{businessId}`
- `platformAnalytics/businessBranchCurrent/{businessId}_{branchId}`
- `platformAnalytics/globalCurrent/overview`
- `platformAnalytics/alerts/{alertId}`

### Dimensiones que el sistema debe soportar
- tiempo: hora, dia, semana, mes
- negocio
- sucursal
- almacen
- caja / turno
- usuario / cajero / vendedor
- producto / categoria / marca
- cliente
- proveedor
- metodo de pago
- moneda
- serie fiscal o tipo de comprobante

### KPI dictionary canonico
Antes de construir dashboards definitivos, hay que congelar un diccionario con:

- `metricId`
- `nombre`
- `audiencia`
- `formula`
- `grano`
- `dimensiones validas`
- `fuentes`
- `latencySla`
- `owner tecnico`
- `owner funcional`
- `reglas de alerta`

Ejemplo:

```json
{
  "metricId": "sales.net",
  "nombre": "Ventas netas",
  "audiencia": ["business_owner", "branch_manager", "platform_ops"],
  "formula": "grossSales - discounts - creditNotes - cancellations",
  "grano": ["business", "branch", "day", "month"],
  "fuentes": ["invoices", "creditNotes"],
  "latencySla": "near-real-time"
}
```

## Reporteria objetivo por audiencia

### 1. Dueno / admin del negocio
Debe ver negocio total y breakdown por sucursal.

#### KPIs P0 obligatorios
- ventas brutas, netas y cantidad de facturas
- ticket promedio
- unidades vendidas
- margen bruto y utilidad neta
- ventas por sucursal
- comparativo entre sucursales
- caja esperada vs caja real
- descuadre por sucursal, cajero y turno
- CxC total y vencida
- aging de CxC
- valor de inventario a costo y a precio
- stock critico y quiebres
- gastos por categoria y gasto/venta
- compras por proveedor y categoria
- riesgo fiscal

#### KPIs P1 que una arquitectura enterprise debe habilitar
- margen por sucursal
- rentabilidad por sucursal
- rotacion y cobertura de inventario por sucursal
- baja rotacion y sobrestock
- transferencias entre sucursales
- lead time y fill rate por proveedor
- concentracion de clientes
- recompra y recurrencia
- same-store growth

#### KPIs P2 que requieren telemetria adicional
- perdida estimada por stockout
- tiempo medio de atencion por sucursal/caja
- conversion POS
- efectividad de promociones
- productividad operativa por equipo

### 2. Manager de sucursal
Debe ver solo su sucursal, con drilldown a almacenes, cajas y equipo.

Vista minima:
- ventas del dia/semana/mes
- utilidad de la sucursal
- caja abierta/cerrada y diferencias
- top productos
- productos sin stock
- cobranza pendiente
- gastos de la sucursal
- alertas de operacion

### 3. Dev / soporte / plataforma
Debe ver salud multi-negocio y, ahora tambien, salud multi-sucursal.

#### KPIs P0 obligatorios
- negocios activos con ventas 7/30 dias
- sucursales activas con ventas 7/30 dias
- negocios y sucursales sin actividad
- riesgo de suscripcion
- riesgos de ownership/acceso
- descuadres recurrentes por negocio y sucursal
- stock inconsistente o negativo
- salud de datos maestra
- riesgo fiscal
- drift entre transaccional y agregados

#### KPIs P1 enterprise
- adopcion por modulo
- sucursales por negocio y complejidad operativa
- cohortes de activacion
- DAU/WAU/MAU por negocio y por sucursal
- health score de negocio
- health score de sucursal
- tiempo desde onboarding hasta primera venta y primer cierre de caja

#### KPIs P2 de plataforma madura
- forecast de churn
- forecast de riesgo operativo
- errores funcionales por negocio/sucursal/version
- saturacion de limites y costos por tenant

## Metricas nuevas que solo aparecen cuando existe multi-sucursal real
- ranking de sucursales por ventas y margen
- utilidad consolidada vs utilidad por sucursal
- same-store growth
- contribucion de cada sucursal al negocio
- descuadre recurrente por sucursal
- cobertura de inventario por sucursal
- dependencia de una sola sucursal
- transferencia inter-sucursal y costo logistico
- sucursales con gasto alto y venta baja
- sucursales con cobranza lenta

## Centro de alertas obligatorio

### Alertas del negocio
- caja no cerrada
- caja con diferencia sobre umbral
- ventas de la sucursal muy por debajo del baseline
- gasto anomalo en una sucursal
- CxC vencida por encima del umbral
- inventario critico en SKU top
- sobrestock o baja rotacion
- NCF por agotarse
- data quality: productos sin costo, sin precio o sin categoria

### Alertas de plataforma
- negocio sin owner valido
- negocio o sucursal sin actividad anormal
- drift de analytics
- errores de sync o repair repetidos
- sucursal con demasiados descuadres
- tenant con integridad fiscal en riesgo

## Pipeline recomendado
1. Los controladores/triggers escriben hechos transaccionales con `businessId` y `branchId` cuando aplique.
2. Un agregador incremental actualiza `analyticsCurrent`, `analyticsDaily` y `analyticsMonthly`.
3. Un reconciler nocturno recalcula ultimos `N` dias para corregir drift.
4. Un motor de alertas y health score clasifica negocio y sucursal.
5. Los dashboards leen agregados, no documentos crudos.

## Roadmap de implementacion

### Fase 0 - Contratos y gobierno de datos
- congelar diccionario de KPIs
- definir contrato canonico de `branch`
- definir invariantes por dominio
- definir ownership tecnico de cada agregado

### Fase 1 - Entidad branch y bootstrap compatible
- crear `businesses/{businessId}/branches/{branchId}`
- agregar `main` branch a todos los negocios existentes
- extender membresias/contexto con `defaultBranchId` y alcance
- no romper flujos existentes

### Fase 2 - Dual write en dominios criticos
- ventas/facturas
- cash count
- gastos
- compras/recepciones
- inventario/almacenes
- CxC y CxP

Regla de rollout:
- los documentos nuevos escriben `branchId`
- los historicos se leen con fallback a `main`

### Fase 3 - Read models y dashboards de negocio
- agregados por negocio
- agregados por sucursal
- dashboard ejecutivo del negocio
- dashboard de manager de sucursal
- alertas P0

### Fase 4 - Enforcement operativo
- `branchId` obligatorio para ventas nuevas
- `branchId` obligatorio para apertura/cierre de caja
- gastos operativos imputables a sucursal
- permisos por sucursal en backend

### Fase 5 - Cockpit global de plataforma
- health score por negocio
- health score por sucursal
- ranking de riesgo
- ranking de crecimiento
- observabilidad de calidad de datos

### Fase 6 - Cleanup de legacy
- retirar la suposicion `1 sucursal = 1 business`
- simplificar fallbacks de paths y shape
- cortar lectores que ya no aporten compatibilidad

## Riesgos y mitigacion

### Riesgo 1: confundir sucursal con almacen
Mitigacion:
- documentar semantica
- impedir que UI y backend traten `warehouse` como `branch`

### Riesgo 2: dual write con drift
Mitigacion:
- jobs idempotentes
- reconciler nocturno
- metricas de drift

### Riesgo 3: historicos sin branch
Mitigacion:
- bootstrap de `main`
- fallback controlado solo durante migracion

### Riesgo 4: permisos mas complejos
Mitigacion:
- membresia canonica por negocio
- alcance por sucursal como dato explicito, no inferido

### Riesgo 5: dashboards lentos o inconsistentes
Mitigacion:
- agregados server-side
- una sola definicion de KPI
- no leer colecciones crudas para BI

## Recomendacion ejecutiva
La mejor decision para la app no es simular sucursales con el modelo actual. La mejor decision es introducir `branch` como entidad canonica y redibujar la analitica con cuatro capas:

1. plataforma
2. negocio
3. sucursal
4. detalle operativo

Eso agrega complejidad esencial, no accidental.

La implementacion correcta es:

1. definir contratos y KPIs
2. crear `branch`
3. migrar ventas/caja/inventario/compras/gastos
4. construir agregados de negocio y sucursal
5. montar dashboards y alertas sobre esos agregados

Si se hace asi, Ventamax queda preparado para operar como producto enterprise real, sin seguir acumulando formulas locales, dashboards fragmentados ni workarounds de modelado.
