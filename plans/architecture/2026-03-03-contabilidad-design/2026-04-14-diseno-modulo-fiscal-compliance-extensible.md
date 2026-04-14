# Diseño de módulo fiscal y compliance extensible

> Estado: `proposal`
>
> Fecha: `2026-04-14`
>
> Este documento propone cómo incorporar cumplimiento fiscal al producto sin acoplar
> el dominio a `DGII` ni a República Dominicana. `DGII` se trata como la primera
> jurisdicción soportada por una capa fiscal reusable.

> Documento complementario: `2026-04-14-mapa-refactor-taxreceipt.md`
>
> Úsalo como guía táctica para intervenir el módulo actual `taxReceipt/NCF`
> sin mezclar ese diagnóstico con la arquitectura fiscal objetivo.

## Notas operativas vigentes

- Este diseño distingue entre `arquitectura objetivo` y `orden real de ejecución`.
- Aunque `e-CF` ya debe considerarse en el modelo, la ejecución inmediata puede
  empezar por `NCF` tradicional (`serie B`) mientras VentaMas no tenga definido:
  - proveedor o integración API de facturación electrónica
  - credenciales de certificación y producción
  - flujo operativo definitivo para firmado y envío
- En esta etapa, el frente de mayor retorno es:
  - calidad de datos fiscales
  - reportes `606`, `607` y `608` con `NCF` tradicional
  - base mensual de impuestos y conciliaciones
- Toda implementación nueva debe salir `e-CF ready`, pero no debe bloquear el avance
  actual por esperar el proveedor final.
- Regla de producto: el dominio debe soportar `traditional` y `electronic`, aunque en
  la primera fase solo se active `traditional`.

## Problema

Hoy el repo ya tiene piezas útiles para facturación fiscal y base contable:

- `NCF` y secuencias fiscales en ventas
- `taxReceipt` en frontend y backend
- módulos operativos de ventas, compras, gastos, `CxC`, `CxP` y tesorería
- pipeline contable real `evento -> asiento -> reporte`

Pero todavía no existe una capa fiscal formal que resuelva, de punta a punta:

- obligaciones periódicas por jurisdicción
- preparación de reportes fiscales mensuales
- conciliación entre operación, contabilidad y cumplimiento
- workflow de validación, envío, rectificación y auditoría
- una estructura extensible para soportar otros países o autoridades

Si se intenta resolver `606/607/608/IR-2` directamente dentro de ventas, compras o
contabilidad, se agregaría complejidad accidental y se endurecería el producto alrededor
de reglas locales.

## Objetivo

Diseñar una capa `fiscal/compliance` que:

- consuma datos operativos y contables ya existentes
- produzca reportes fiscales y controles de cumplimiento
- permita modelar reglas por país, autoridad y régimen
- mantenga a `DGII` como adaptador, no como núcleo del dominio
- encaje con la arquitectura actual de VentaMas

## Restricciones y contexto real

### Restricciones regulatorias relevantes para `DGII`

- La Ley `32-23` de facturación electrónica y el Decreto `587-24` cambian el diseño
  objetivo para República Dominicana: el producto no puede asumir solo un modelo de
  reportes mensuales en lote.
- `606`, `607` y `608` son obligaciones mensuales con vencimiento general el día `15`
  del mes siguiente.
- `606` reporta compras, costos, gastos, adelantos de `ITBIS` y retenciones.
- `607` reporta ventas, operaciones y retenciones realizadas por terceros.
- `608` reporta comprobantes anulados y motivos de anulación.
- `IR-2` es anual y, para sociedades, vence a más tardar `120 días` después del cierre.
- `IR-2` no depende solo de facturación; requiere estados financieros, conciliaciones y
  anexos.
- En `e-CF`, la DGII opera con `XML`, firma digital, autenticación por token, `TrackId`,
  consulta de estados, acuse de recibo y formatos específicos de aprobación comercial.
- La exclusión de `607`, `608` y Libros de Ventas aplica cuando la facturación sea
  `100% electrónica`, según material oficial reciente de la DGII.
- El `606` sigue siendo relevante en arquitectura, incluso en escenarios electrónicos,
  porque convive con compras/gastos no electrónicos, contingencias y obligaciones
  históricas o mixtas.

### Restricciones del repo

- Ya existe un módulo contable activo y no conviene abrir otro pipeline paralelo.
- Ya existe `taxReceipt` con una semilla multi-país básica en
  `src/firebase/taxReceipt/taxReceiptTemplates.ts`.
- El soporte actual de comprobantes dominicanos en el repo todavía está sesgado a
  series `B` tradicionales y debe abrirse para `e-CF` serie `E`.
- La base contable vigente vive en:
  - `functions/src/app/modules/*`
  - `src/modules/accounting/*`
  - `src/modules/settings/components/GeneralConfig/configs/AccountingConfig/*`
  - `plans/architecture/2026-03-03-contabilidad-design/README.md`
- La solución debe reusar los módulos operativos actuales y no duplicar captura de datos.
- Hoy no existe en el proyecto una integración activa confirmada para `e-CF` con API
  final, por lo que el plan de ejecución debe preservar un camino incremental.

## Complejidad esencial vs accidental

### Complejidad esencial

- modelar obligaciones fiscales por jurisdicción
- soportar doble carril documental: comprobantes tradicionales y comprobantes
  electrónicos
- traducir documentos operativos a eventos fiscales
- validar reglas locales por período y por tipo documental
- conciliar fiscal vs contable vs operativo
- soportar rectificaciones, auditoría y cierres

### Complejidad accidental a evitar

- hardcodear `DGII` dentro de `invoice`, `purchase` o `accounting`
- crear pantallas separadas que dupliquen datos ya capturados en operación
- usar plantillas `606/607/608` como si fueran el dominio principal
- modelar `e-CF` como un simple “exportar XML” sin estados de red ni monitoreo
- mezclar configuración de secuencias fiscales con motor de cumplimiento mensual
- forzar una solución anual `IR-2` antes de cerrar la capa mensual

## Decisión recomendada

Crear un dominio nuevo `fiscal/compliance` con cuatro capas claras:

1. `tax-core`
2. `tax-jurisdictions`
3. `tax-reporting`
4. `tax-operations-ui`
5. `tax-einvoicing`

La estructura conceptual recomendada es esta:

- `tax-core`
  - modelos canónicos y reglas base
- `tax-jurisdictions`
  - adaptadores por país o autoridad, empezando con `DO/DGII`
- `tax-reporting`
  - generación, validación, exportación y versionado de reportes
- `tax-operations-ui`
  - configuración, cierre mensual, bandeja de errores, reportes y trazabilidad
- `tax-einvoicing`
  - emisión electrónica, firma, autenticación, tracking y recepción estructurada

## Alternativas consideradas

### Opción A. Resolver `DGII` directo dentro de módulos operativos

Ventajas:

- más rápida al inicio
- menor inversión de diseño

Desventajas:

- acoplamiento alto
- reglas dispersas entre ventas, compras y contabilidad
- difícil soportar otros países
- alto costo futuro de refactor

Veredicto: descartada.

### Opción B. Resolver solo exportación de archivos `DGII`

Ventajas:

- implementación rápida
- menos superficie de UI

Desventajas:

- no resuelve calidad de datos ni conciliaciones
- deja fuera workflow real de compliance
- no sirve para `IR-2`

Veredicto: insuficiente.

### Opción C. Crear capa fiscal canónica con adaptadores locales

Ventajas:

- bajo acoplamiento
- extensible por país
- reusable para reportes mensuales y anuales
- compatible con el modelo contable vigente

Desventajas:

- requiere diseño inicial más disciplinado
- necesita fases de rollout

Veredicto: recomendada.

### Nota de ejecución sobre la opción recomendada

La opción recomendada no obliga a implementar el adaptador `e-CF` completo desde el
primer sprint.

Puede ejecutarse en dos carriles:

- carril inmediato: `NCF` tradicional + reportes mensuales + base de impuestos
- carril preparatorio: modelo dual `traditional/electronic`, interfaces y estados
  reservados para la integración futura

## Modelo de dominio recomendado

### Entidades núcleo

#### `TaxJurisdiction`

Representa la jurisdicción o autoridad aplicable.

Campos sugeridos:

- `id`
- `countryCode`
- `authorityCode`
- `name`
- `active`
- `timezone`
- `currency`

Ejemplos:

- `DO-DGII`
- `MX-SAT`
- `CO-DIAN`

#### `TaxProfile`

Configuración fiscal del negocio y sus contrapartes.

Campos sugeridos:

- `businessId`
- `jurisdictionId`
- `taxpayerType`
- `taxRegime`
- `filingCalendar`
- `defaultDocumentRules`
- `withholdingRules`
- `filingResponsibilityFlags`

Debe existir para:

- negocio
- cliente
- suplidor

#### `TaxDocument`

Snapshot fiscal del documento operativo.

No reemplaza la factura o la compra. Es la proyección fiscal normalizada.

Campos sugeridos:

- `id`
- `sourceType`
- `sourceId`
- `businessId`
- `jurisdictionId`
- `documentType`
- `documentNumber`
- `modifiedDocumentNumber`
- `documentFormat`
- `governmentSubmissionMode`
- `counterparty`
- `issuedAt`
- `paidAt`
- `voidedAt`
- `status`
- `authorityStatus`
- `authorityTrackId`
- `currency`
- `totals`
- `taxBreakdown`
- `withholdingBreakdown`
- `paymentBreakdown`
- `classification`
- `fiscalAttributes`

#### `TaxEvent`

Evento fiscal canónico derivado de un documento o de un cambio relevante.

Ejemplos:

- `sale.issued`
- `sale.voided`
- `sale.credit_note_issued`
- `purchase.received`
- `purchase.paid`
- `purchase.withholding_recorded`
- `expense.recorded`

Campos sugeridos:

- `id`
- `eventType`
- `businessId`
- `jurisdictionId`
- `occurredAt`
- `sourceDocumentType`
- `sourceDocumentId`
- `taxDocumentId`
- `periodKey`
- `payload`
- `version`

Ejemplos adicionales para electrónico:

- `sale.einvoice_submitted`
- `sale.einvoice_accepted`
- `sale.einvoice_rejected`
- `purchase.einvoice_received`
- `purchase.receipt_acknowledged`
- `purchase.commercial_response_sent`

#### `TaxReportDefinition`

Define un reporte posible dentro de una jurisdicción.

Ejemplos:

- `DGII_606`
- `DGII_607`
- `DGII_608`
- `DGII_IR2`

Campos sugeridos:

- `id`
- `jurisdictionId`
- `reportCode`
- `frequency`
- `outputFormats`
- `validationRules`
- `deadlinePolicy`
- `supportsZeroFiling`

#### `TaxReportRun`

Instancia ejecutada de un reporte para un período.

Campos sugeridos:

- `id`
- `reportDefinitionId`
- `businessId`
- `periodKey`
- `status`
- `sourceSnapshot`
- `validationSummary`
- `generatedArtifacts`
- `submittedAt`
- `acceptedAt`
- `rejectionSummary`
- `amendsReportRunId`

#### `ElectronicInvoiceEnvelope`

Representa la unidad técnica de intercambio con la autoridad tributaria o con otra parte.

Campos sugeridos:

- `id`
- `businessId`
- `jurisdictionId`
- `documentId`
- `flow`
- `environment`
- `xmlFormat`
- `signedXmlRef`
- `seedRef`
- `certificateRef`
- `requestMeta`
- `responseMeta`
- `trackId`
- `status`
- `errorSummary`
- `attempts`
- `lastAttemptAt`

### Catálogos auxiliares

- `TaxDocumentType`
- `TaxVoidReason`
- `TaxIncomeType`
- `TaxExpenseType`
- `TaxPaymentMethod`
- `TaxWithholdingType`
- `TaxThresholdRule`

Estos catálogos deben ser por jurisdicción y versionables por período.

## Adaptador `DGII` recomendado

`DGII` debe implementarse como `jurisdiction package`, no como lógica suelta.

### Responsabilidades del adaptador `DGII`

- tipos documentales locales: `B01`, `B02`, `B04`, `B15`, otros que luego apliquen
- tipos de `e-CF` locales: `E31`, `E32`, `E33`, `E34` y demás que apliquen
- reglas de identificación: `RNC`, cédula, pasaporte
- clasificación de ingresos y gastos para `607` y `606`
- motivos de anulación para `608`
- reglas de retención de `ITBIS` e `ISR`
- umbrales regulatorios por período
- deadlines y formatos de salida
- reglas de validación entre detalle y resumen
- servicios de autenticación, firma, envío, consulta y tracking de `e-CF`
- formatos auxiliares `ACECF`, `ARECF`, `ANECF` y resumen de factura de consumo

### Lo que no debe vivir dentro del adaptador

- lógica genérica de workflow
- storage del reporte
- gestión de auditoría
- lógica compartida de conciliación
- motor de exportación abstracto

## Módulos funcionales recomendados

### 1. Configuración fiscal

Objetivo:

- parametrizar el negocio antes de declarar

Incluye:

- jurisdicciones activas
- perfil fiscal del negocio
- regímenes
- responsabilidades tributarias
- calendario de obligaciones
- reglas de terceros
- mapeos documentales
- umbrales y overrides permitidos

### 2. Documentos fiscales

Objetivo:

- administrar tipos, secuencias y autorización de documentos

Este módulo no reemplaza el actual `taxReceipt`, sino que lo amplía y lo encapsula
mejor dentro de una visión más general.

Incluye:

- tipos documentales por país
- secuencias autorizadas
- vigencias
- alertas de agotamiento
- reglas de modificación y anulación
- distinción explícita entre `NCF` tradicional y `e-NCF`

### 3. Facturación electrónica

Objetivo:

- operar el intercambio electrónico con la autoridad tributaria y con receptores

Incluye:

- gestión de certificado digital
- autenticación y tokens
- firmado de XML
- envío de `e-CF`
- consulta por `TrackId`
- reintentos y cola de errores
- acuse de recibo
- aprobación o rechazo comercial cuando aplique
- recepción de `XML` de suplidores
- contingencias

Nota de ejecución:

- Este módulo debe diseñarse desde ahora, pero su implementación productiva puede
  quedar en modo `stub` o `disabled` hasta que VentaMas defina el proveedor/API real.
- No debe bloquear la salida de los módulos de cumplimiento mensual basados en `NCF`
  tradicional.

### 4. Cierre fiscal mensual

Objetivo:

- preparar reportes de cumplimiento mensual

Incluye:

- checklist de calidad de datos
- pendientes de clasificación
- pendientes de identificación fiscal
- diferencias entre operación y contabilidad
- validaciones por período
- corrida de generación de reportes

### 5. Reportería regulatoria

Objetivo:

- generar, revisar, exportar y versionar reportes

Incluye:

- `606`
- `607`, cuando aplique
- `608`, cuando aplique
- luego `609`, `623`, `IT-1`, `IR-17`, según prioridad de negocio

### 6. Capa mensual de impuestos

Objetivo:

- consolidar impuestos mensuales sobre una base ya conciliada

Incluye:

- base para `IT-1`
- base para `IR-17`
- conciliación de `ITBIS` facturado, adelantable, retenido y llevado al costo
- diferencias por período

### 7. Cumplimiento anual

Objetivo:

- preparar el paquete anual, empezando por `IR-2`

Incluye:

- conciliación fiscal vs contable
- anexos
- pérdidas de años anteriores
- ajustes fiscales
- beneficiario final y estructura societaria

## Pantallas recomendadas

### `Settings > Fiscal y Compliance`

Subrutas recomendadas:

- `/settings/fiscal`
- `/settings/fiscal/jurisdicciones`
- `/settings/fiscal/documentos`
- `/settings/fiscal/reglas`
- `/settings/fiscal/calendario`
- `/settings/fiscal/mapeos`

### `Compliance > Mensual`

Subrutas recomendadas:

- `/compliance/monthly`
- `/compliance/monthly/:period`
- `/compliance/monthly/:period/issues`
- `/compliance/monthly/:period/reports/606`
- `/compliance/monthly/:period/reports/607`
- `/compliance/monthly/:period/reports/608`

### `Compliance > Facturación Electrónica`

Subrutas recomendadas:

- `/compliance/einvoicing`
- `/compliance/einvoicing/monitor`
- `/compliance/einvoicing/outbox`
- `/compliance/einvoicing/inbox`
- `/compliance/einvoicing/errors`

### `Compliance > Anual`

Subrutas recomendadas:

- `/compliance/annual`
- `/compliance/annual/:fiscalYear`
- `/compliance/annual/:fiscalYear/ir2`
- `/compliance/annual/:fiscalYear/reconciliations`

### `Compliance > Auditoría`

Subrutas recomendadas:

- `/compliance/audit`
- `/compliance/audit/report-runs`
- `/compliance/audit/tax-events`
- `/compliance/audit/exceptions`

## UX recomendada por superficie

### Configuración

Usar páginas con subnavegación, no modales largos.

Motivo:

- es configuración estructural
- requiere contexto y trazabilidad
- tendrá dependencias entre catálogos

### Clasificación pendiente y resolución de errores

Usar workspace tipo bandeja con:

- tabla principal
- panel lateral de detalle
- acciones masivas
- filtros por error, reporte, período y severidad

### Reportes

Usar detalle por período con tres niveles:

1. resumen ejecutivo
2. validaciones
3. detalle exportable

No conviene abrir directamente una pantalla “subir TXT” sin antes mostrar:

- origen de datos
- inconsistencias
- impacto de rectificación

### Monitor de facturación electrónica

Usar consola operacional con:

- estado por documento
- `TrackId`
- acuse y respuesta comercial
- reintentos
- errores DGII
- visibilidad por ambiente (`pre-certificación`, `certificación`, `producción`)

## Encaje con el repo actual

### Piezas existentes a reusar

- `functions/src/app/modules/invoice/*`
- `functions/src/app/modules/purchase/*`
- `functions/src/app/modules/expenses/*`
- `functions/src/app/modules/accounting/*`
- `src/modules/accounting/*`
- `src/modules/accountsPayable/*`
- `src/modules/accountsReceivable/*`
- `src/modules/settings/pages/setting/subPage/TaxReceipts/*`
- `src/firebase/taxReceipt/*`
- `src/types/taxReceipt.ts`

### Hallazgos concretos del repo que afectan este plan

- [taxReceiptTemplates.ts](/c:/Dev/VentaMas/src/firebase/taxReceipt/taxReceiptTemplates.ts:13)
  hoy filtra República Dominicana con series `B` y plantillas `B01`, `B02`, `B15`,
  `B04`.
- [generateNCFCode.ts](/c:/Dev/VentaMas/functions/src/app/modules/taxReceipt/utils/generateNCFCode.ts:36)
  incrementa la secuencia con longitud fija de `10` y construye el comprobante como
  `type + serie + updatedSequence`.
- [header.js](/c:/Dev/VentaMas/functions/src/app/modules/invoice/templates/template2/builders/header.js:9)
  clasifica títulos visibles usando `B01` y `B02`.

Estos puntos confirman que el repo todavía no debe asumirse listo para `e-CF`.

### Piezas nuevas sugeridas

#### Frontend

- `src/modules/compliance/*`
- `src/modules/settings/pages/setting/subPage/FiscalCompliance/*`
- `src/firebase/compliance/*`
- `src/types/compliance.ts`
- `src/utils/compliance/*`

#### Backend

- `functions/src/app/modules/compliance/*`
- `functions/src/app/modules/tax/*`
- `functions/src/app/modules/tax/jurisdictions/do-dgii/*`

### Colecciones sugeridas

- `businesses/{businessId}/settings/fiscal`
- `businesses/{businessId}/taxProfiles`
- `businesses/{businessId}/taxDocuments`
- `businesses/{businessId}/taxEvents`
- `businesses/{businessId}/taxReportRuns`
- `businesses/{businessId}/taxExceptions`
- `businesses/{businessId}/taxMappings`

## Datos mínimos que deben capturarse mejor

### En clientes y suplidores

- tipo de identificación
- número de identificación
- país fiscal
- régimen o perfil fiscal
- sujeto a retención o no
- tipo de retención por defecto

### En documentos de venta

- tipo documental fiscal
- número fiscal
- documento modificado
- formato del documento: `traditional` o `electronic`
- clasificación de ingreso
- monto gravado y exento
- impuestos separados
- retenciones sufridas
- medio de cobro
- estado de anulación
- estado DGII
- `TrackId`
- código de seguridad o referencias de consulta cuando aplique

### En documentos de compra y gasto

- número fiscal recibido
- documento modificado
- tipo de recepción: manual, XML, integración o correo
- clasificación `606`
- bienes vs servicios
- fecha de pago
- `ITBIS` facturado, retenido y llevado al costo
- retención `ISR`
- forma de pago
- acuse de recibo y respuesta comercial cuando aplique

## Fases recomendadas

### Fase 0. Fundaciones de dominio

Alcance:

- crear tipos y colecciones canónicas
- definir jurisdicción `DO-DGII`
- crear catálogos locales iniciales
- unificar naming y snapshots mínimos

Resultado esperado:

- VentaMas tiene dominio fiscal base aunque todavía no genere todos los reportes

Nota:

- Esta fase debe dejar activado el modelo dual `traditional/electronic`, aunque la
  operación inicial use solo `traditional`.

### Fase 1. Facturación electrónica base

Alcance:

- soportar `NCF` tradicional y `e-NCF`
- certificados, semilla, token y firmado
- emisión de `XML`
- consulta de estados y `TrackId`
- monitor operativo de envío

Resultado esperado:

- VentaMas puede convivir con el calendario actual de obligatoriedad de la Ley `32-23`

Nota de gating:

- Si al iniciar esta fase todavía no existe API/proveedor decidido, se ejecutará solo la
  parte interna:
  - estados
  - interfaces
  - almacenamiento
  - monitoreo vacío o simulado
- El envío real a DGII queda explícitamente fuera de alcance hasta definir proveedor.

### Fase 2. Calidad de datos y preparación mensual

Alcance:

- enriquecer clientes, suplidores y documentos
- generar `taxDocuments` y `taxEvents`
- bandeja de pendientes y validaciones

Resultado esperado:

- el sistema detecta qué falta antes del cierre mensual

Nota:

- Esta fase sí puede y debe ejecutarse inmediatamente usando `NCF` tradicional.

### Fase 3. `606/607/608`

Alcance:

- generar reportes
- validar reglas `DGII`
- exportar artefactos
- guardar historial de corrida

Resultado esperado:

- cierre mensual operable y auditable

Nota:

- Esta fase es prioritaria aun sin `e-CF`, porque genera valor inmediato con la
  operación actual de VentaMas.
- Debe considerar desde el inicio un filtro por `documentFormat`, aunque en el corto
  plazo procese principalmente `traditional`.

### Fase 4. `IT-1` e `IR-17`

Alcance:

- base de impuestos mensuales
- conciliación `ITBIS` y retenciones
- preparación consistente para obligaciones mensuales

Resultado esperado:

- la capa mensual deja de ser solo informativa y pasa a sostener cumplimiento tributario real

### Fase 5. Conciliación

Alcance:

- cruces fiscal vs contabilidad vs operación
- diferencias explicadas
- aprobaciones internas

Resultado esperado:

- menor riesgo de rechazo o inconsistencias aguas abajo

### Fase 6. `IR-2`

Alcance:

- preparación anual
- anexos prioritarios
- pérdidas, ajustes y conciliación fiscal
- beneficiario final si se decide soportarlo dentro del producto

Resultado esperado:

- base anual defendible, no solo exportación superficial

## Priorización recomendada

Orden recomendado:

1. modelo canónico fiscal
2. soporte dual `NCF/e-NCF`
3. motor de facturación electrónica `DGII`
4. calidad de datos y clasificación
5. `606/607/608`
6. `IT-1` e `IR-17`
7. conciliación
8. `IR-2`
9. otras obligaciones locales

No conviene empezar por `IR-2` porque depende de casi todo lo anterior.

### Prioridad ejecutable si hoy no existe API de `e-CF`

Si VentaMas todavía no tiene proveedor/API de `e-CF`, el orden operativo sugerido para
trabajo real es este:

1. modelo canónico fiscal con soporte dual
2. calidad de datos fiscales en clientes, suplidores y documentos
3. `606`
4. `607`
5. `608`
6. base mensual para `IT-1` e `IR-17`
7. interfaces y estados internos de `e-CF`
8. integración real `e-CF`
9. conciliación avanzada
10. `IR-2`

Este orden evita bloquear valor inmediato por una dependencia externa no resuelta.

## Riesgos

### Riesgos de producto

- intentar vender “cumplimiento total” antes de cerrar datos fuente
- mezclar fiscalidad con contabilidad general sin una capa intermedia
- sobrediseñar multi-país antes de tener una primera jurisdicción sólida

### Riesgos técnicos

- duplicidad de datos entre documentos operativos y snapshots fiscales
- reglas de validación dispersas en frontend y backend
- falta de versionado por período regulatorio
- dificultad para rectificar reportes sin historial inmutable

### Riesgos operativos

- diferencias entre lo emitido y lo cobrado/pagado
- documentos incompletos en compras
- terceros sin identificación fiscal correcta
- cambios normativos no versionados

## Rollout seguro y migración sin impacto en producción

### Principio rector

Los cambios a `NCF/taxReceipt/fiscal` deben ejecutarse como migración controlada,
nunca como reemplazo brusco del flujo activo de facturación.

El objetivo no es “mover carpetas”, sino:

- introducir el nuevo dominio sin interrumpir ventas
- mantener compatibilidad backward durante la transición
- validar con negocios piloto antes de cambiar la fuente oficial
- asegurar rollback rápido si aparecen diferencias funcionales

### Regla de convivencia

Mientras el rollout no se cierre, deben coexistir:

- flujo actual:
  - `settings/taxReceipt`
  - colección `taxReceipts`
  - lógica actual de generación de NCF
- capa nueva:
  - modelo canónico fiscal
  - nuevos snapshots o proyecciones
  - reportes y validaciones nuevas

La capa nueva no debe bloquear la emisión actual ni sustituirla de inmediato.

### Estrategia recomendada

#### Fase R0. Observabilidad antes de tocar comportamiento

Objetivo:

- medir cómo se usa hoy el módulo y detectar dependencias ocultas

Acciones:

- inventariar todos los usos de `taxReceiptEnabled`, `ncfType`, `NCF` y `taxReceipts`
- registrar qué pantallas leen o mutan secuencias
- identificar negocios activos que usan comprobantes fiscales
- capturar métricas de:
  - secuencias generadas por día
  - errores de duplicidad
  - anulaciones
  - notas de crédito

Salida:

- baseline de comportamiento productivo

#### Fase R1. Cambios aditivos de modelo

Objetivo:

- extender el dominio sin romper contratos actuales

Acciones:

- agregar campos nuevos sin eliminar los viejos
- no renombrar aún `taxReceipt`
- introducir campos como:
  - `documentFormat`
  - `fiscalSeries`
  - `fiscalType`
  - `authorityStatus`
  - `trackId`

Regla:

- todos los readers actuales deben seguir funcionando aunque ignoren los campos nuevos

#### Fase R2. Backend paralelo canónico

Objetivo:

- crear una fuente nueva de verdad sin cambiar todavía el flujo oficial

Acciones:

- implementar un servicio backend canónico para secuencias/documentos fiscales
- mantener el motor actual como fallback
- no delegar la generación oficial a frontend

Regla:

- la nueva capa corre en paralelo, no reemplaza todavía la salida productiva

#### Fase R3. Lectura dual y comparaciones

Objetivo:

- comparar resultados antes del switch

Acciones:

- generar en paralelo la proyección nueva y la actual
- comparar:
  - código fiscal generado
  - secuencia siguiente
  - cantidad disponible
  - prefijo usado
  - impacto en nota de crédito
- registrar mismatches en bitácora técnica

Regla:

- si hay discrepancias, la capa nueva no se vuelve obligatoria

#### Fase R4. Piloto por negocio

Objetivo:

- validar con cohortes controladas

Acciones:

- activar flags por `businessId`
- usar negocios internos o de baja criticidad primero
- monitorear:
  - emisión
  - cancelaciones
  - ledger de secuencias
  - reportes mensuales

Regla:

- no activar por defecto a toda la base instalada

#### Fase R5. Switch controlado

Objetivo:

- volver canónica la nueva capa cuando ya haya evidencia suficiente

Acciones:

- cambiar la fuente primaria de lectura para los negocios piloto
- mantener fallback operativo por un tiempo definido
- desactivar gradualmente la lógica vieja en frontend

Regla:

- el switch debe ser reversible durante la ventana de estabilización

#### Fase R6. Limpieza final

Objetivo:

- retirar deuda legacy cuando el rollout esté cerrado

Acciones:

- remover paths redundantes
- congelar acciones legacy
- simplificar slices y helpers obsoletos
- actualizar documentación y checklist operativa

### Feature flags recomendados

Crear flags explícitos por negocio en settings, evitando toggles ambiguos.

Sugeridos:

- `fiscal.domainV2Enabled`
- `fiscal.sequenceEngineV2Enabled`
- `fiscal.reportingEnabled`
- `fiscal.monthlyComplianceEnabled`
- `fiscal.electronicModelEnabled`
- `fiscal.electronicTransportEnabled`

Regla:

- `electronicModelEnabled` puede activarse antes que `electronicTransportEnabled`
- así el sistema soporta el modelo `e-CF` sin depender todavía del proveedor/API

### Compatibilidad backward

Debe mantenerse compatibilidad con:

- colección `businesses/{businessId}/taxReceipts`
- setting `businesses/{businessId}/settings/taxReceipt`
- documentos que solo tengan `NCF`
- flujo actual de notas de crédito
- impresiones y PDFs existentes

No se debe exigir migración completa de datos para que la app siga funcionando.

### Riesgos específicos de producción

#### Riesgo 1. Cambiar impuestos sin querer

Hoy existen acoplamientos entre `taxReceiptEnabled` y pricing/impuestos.

Mitigación:

- separar ese cambio del resto
- introducir una fuente nueva para cálculo tributario
- comparar totales antes y después

#### Riesgo 2. Divergencia de secuencias

Hoy hay múltiples generadores de NCF en frontend/backend.

Mitigación:

- declarar backend como autoridad final
- usar lectura dual antes del switch
- auditar duplicados y saltos de numeración

#### Riesgo 3. Impacto en ventas activas

Un cambio brusco puede afectar caja, facturación y notas de crédito.

Mitigación:

- no tocar flujo visible de POS en primeras fases
- pilotear por negocio
- definir rollback operacional

### Backfill recomendado

Si se crean nuevas colecciones como:

- `taxDocuments`
- `taxEvents`
- `taxReportRuns`

el backfill debe:

- ser idempotente
- procesar por negocio y por período
- registrar progreso y errores
- no reescribir documentos operativos
- permitir replay controlado

### Criterios para salir a piloto

- cero cambios funcionales en emisión tradicional para negocios no habilitados
- backend nuevo produce resultados equivalentes en casos base
- no hay diferencias de secuencia en muestra controlada
- el equipo de soporte sabe identificar qué motor generó cada comprobante

### Criterios para generalizar

- piloto estable durante al menos un ciclo mensual relevante
- reportes `606/607/608` consistentes en negocio piloto
- incidencias de duplicidad o saltos bajo umbral aceptable
- rollback probado y documentado

### Rollback

Debe existir rollback simple por negocio:

- apagar flags `fiscal.*V2Enabled`
- volver a usar lectura y emisión legacy
- preservar datos generados por la capa nueva para auditoría

Regla:

- rollback desactiva la capa nueva como fuente operativa, pero no borra evidencia

## Criterios de aceptación del diseño

- `DGII` queda modelado como adaptador y no como dominio central.
- Un nuevo país puede agregarse sin tocar la lógica base de ventas o compras.
- `606`, `607` y `608` pueden generarse a partir de `taxDocuments/taxEvents`.
- los documentos electrónicos pueden monitorearse por estado y `TrackId`.
- El cierre mensual detecta errores antes de generar archivos.
- La auditoría puede responder qué documento originó cada línea de reporte.
- La preparación de `IR-2` puede reutilizar datos mensuales y estados contables.

## Testing recomendado

### Backend

- tests unitarios por regla fiscal local
- tests de mapping `source -> taxDocument`
- tests de generación por reporte
- tests de rectificación y versionado

### Frontend

- tests de validación de formularios fiscales
- tests de bandeja de pendientes
- tests de filtros y resolución de errores

### Integración

- `invoice -> taxEvent -> reportRun`
- `invoice -> electronicInvoiceEnvelope -> trackId -> authorityStatus`
- `purchase -> taxEvent -> reportRun`
- `supplier XML -> intake -> taxDocument -> expense/purchase`
- `credit note/void -> adjustment -> reportRun`
- conciliación `accounting report vs tax report`

## Recomendación final

La forma correcta de incorporar esto en VentaMas no es “hacer DGII”.

La forma correcta es:

- crear una capa de `fiscal/compliance`
- usar `DGII` como el primer paquete de reglas
- tratar `e-CF` como capacidad de primer nivel dentro de ese dominio
- cerrar primero el ciclo mensual y los impuestos mensuales
- dejar `IR-2` como fase anual dependiente de una base mensual y contable ya sólida

## Decisión operativa de corto plazo

Mientras VentaMas no tenga `e-NCF` ni API/proveedor de integración definidos, la
decisión recomendada es:

- avanzar con `NCF` tradicional y reportes `606/607/608`
- dejar el modelo de datos y los estados preparados para `e-CF`
- no posponer el frente fiscal mensual por esperar la integración electrónica
- tratar la integración `e-CF` como un bloque posterior conectable sobre el mismo dominio

Eso permite capturar valor ahora sin hipotecar la arquitectura futura.

## Ejecución paso a paso segura

Esta sección unifica los tres frentes recomendados en un solo recorrido:

1. aclarar y refactorizar el módulo actual `taxReceipt`
2. ejecutar una fase técnica segura y aditiva
3. arrancar `606/607/608` sobre una base menos frágil

La intención es avanzar sin prisa artificial, pero también sin poner en riesgo
producción.

### Etapa 1. Aclarar ownership y límites del módulo actual

#### Objetivo

Determinar qué hace hoy `taxReceipt`, a qué módulo realmente pertenece y qué partes
están conceptualmente mal acopladas.

#### Paso 1. Inventariar responsabilidades actuales

Revisar y clasificar todo lo que hoy hace `taxReceipt`:

- configuración de secuencias
- activación/desactivación de comprobantes
- generación de números fiscales
- alertas por agotamiento
- integración con ventas
- integración con notas de crédito
- dependencias con pricing e impuestos

Resultado esperado:

- una tabla simple con columnas:
  - responsabilidad
  - archivo actual
  - módulo dueño correcto
  - acción sugerida

#### Paso 2. Declarar ownership recomendado

La regla sugerida para VentaMas es esta:

- `Settings > Fiscal`
  - dueño de secuencias, tipos documentales, alertas y configuración local
- `Ventas / Facturación`
  - dueña de emitir facturas y solicitar un documento fiscal
- `Compras / Gastos`
  - dueños de consumir o registrar documentos fiscales recibidos
- `Contabilidad`
  - dueña de asientos, reportes financieros y conciliación contable
- `Fiscal / Compliance`
  - dueño de reportes regulatorios, cumplimiento mensual y capa futura `e-CF`

Decisión explícita:

- `NCF/e-NCF` no pertenece a `tesorería`
- `NCF/e-NCF` no debe quedarse como lógica cliente-side de `ventas`
- `NCF/e-NCF` no es submódulo de `contabilidad`, aunque contabilidad lo consuma

#### Paso 3. Identificar acoplamientos peligrosos

Marcar como deuda prioritaria cualquier punto donde hoy se mezclen dominios:

- comprobante fiscal con cálculo de impuestos
- secuencia fiscal con estado del carrito
- documento fiscal con pricing de producto
- configuración fiscal con lógica de UI local
- generación de número fiscal en frontend

Resultado esperado:

- lista corta de “acoplamientos a romper primero”

#### Paso 4. Congelar alcance legado

Antes de seguir creciendo el módulo, dejar una regla de equipo:

- no agregar nuevas dependencias a `taxReceiptSlice`
- no usar `taxReceiptEnabled` para nuevas decisiones de impuestos o pricing
- no implementar nuevos generadores de secuencia fuera del backend

Esto evita agrandar la deuda mientras se ordena el dominio.

### Etapa 2. Fase técnica segura y aditiva

#### Objetivo

Preparar la base nueva sin romper el flujo activo.

#### Paso 5. Introducir modelo nuevo sin borrar el viejo

Agregar campos y tipos nuevos de forma aditiva:

- `documentFormat`
- `fiscalSeries`
- `fiscalType`
- `authorityStatus`
- `trackId`

Regla:

- los documentos actuales con solo `NCF` deben seguir leyendo y guardando igual

#### Paso 6. Declarar el backend como autoridad de secuencia

Tomar una decisión formal:

- el número fiscal final válido se genera en backend
- frontend solo muestra, selecciona o previsualiza

Acción técnica:

- inventariar helpers legacy de generación en frontend
- marcar cuáles quedan solo para preview
- bloquear nueva lógica de numeración fuera de backend

#### Paso 7. Separar impuestos de comprobantes

Esto es cambio crítico pero debe hacerse en fase controlada.

Acción:

- crear una fuente de verdad nueva para tributación del producto/documento
- dejar `taxReceiptEnabled` limitado a capacidad documental

Regla:

- el cálculo de `ITBIS` no debe depender de si el negocio tiene secuencia NCF activa

Mitigación:

- no reemplazar de golpe
- introducir lectura paralela y comparar resultados

#### Paso 8. Crear flags de rollout

Habilitar flags por negocio para la capa nueva:

- `fiscal.domainV2Enabled`
- `fiscal.sequenceEngineV2Enabled`
- `fiscal.reportingEnabled`

Regla:

- nada nuevo se vuelve obligatorio para toda la base instalada desde el día uno

#### Paso 9. Implementar observabilidad y comparaciones

Antes de cambiar fuente oficial:

- loggear secuencias generadas
- detectar duplicados o saltos
- comparar viejo vs nuevo motor
- registrar divergencias por negocio

Resultado esperado:

- confianza técnica antes de tocar producción real

#### Paso 10. Pilotear con negocios controlados

Elegir pocos negocios para validar:

- internos
- de baja criticidad
- con operación entendible

Validar:

- emisión de facturas
- notas de crédito
- consumo de secuencia
- alertas
- impacto en reportes fiscales

### Etapa 3. Arranque seguro de `606/607/608`

#### Objetivo

Construir cumplimiento mensual usando `NCF` tradicional sobre una base estable.

#### Paso 11. Cerrar datos fiscales mínimos

No empezar por el TXT. Empezar por la calidad de datos.

Validar que ventas, compras, gastos, clientes y suplidores tengan:

- tipo de comprobante
- identificación fiscal
- clasificación correcta
- fechas requeridas
- impuestos separados
- anulaciones y notas relacionadas

#### Paso 12. Definir fuente de verdad por reporte

Para cada reporte, dejar escrito qué fuente manda:

- `606`
  - compras, gastos, pagos y retenciones
- `607`
  - ventas y retenciones sufridas
- `608`
  - anulaciones de comprobantes

Regla:

- el reporte no lee directamente cualquier pantalla; lee una proyección fiscal definida

#### Paso 13. Implementar validaciones antes de exportar

El primer valor del módulo no es “descargar TXT”.

El primer valor es:

- detectar faltantes
- identificar inconsistencias
- impedir que el usuario exporte basura

Tipos de validación:

- documento sin identificación requerida
- tipo documental inválido
- nota sin documento afectado
- anulación sin motivo
- montos/impuestos inconsistentes

#### Paso 14. Generar corridas auditables

Cada corrida de `606/607/608` debe guardar:

- período
- versión
- usuario
- resumen de errores
- artefacto generado
- snapshot fuente

Así se soporta:

- auditoría
- rectificación
- comparación entre corridas

#### Paso 15. Salir primero con piloto mensual

No generalizar de inmediato.

Probar el cierre mensual con uno o pocos negocios y revisar:

- consistencia contra documentos fuente
- consistencia contra contabilidad
- facilidad operativa del usuario

#### Paso 16. Generalizar después del ciclo validado

Solo después de un ciclo mensual estable:

- ampliar cohortes
- endurecer reglas
- promover el workspace de compliance como superficie oficial

### Orden resumido

Si el equipo necesita una versión corta y ejecutable, el orden es este:

1. mapear el módulo actual `taxReceipt`
2. declarar ownership correcto
3. congelar nueva deuda sobre el módulo legado
4. agregar modelo fiscal nuevo de forma aditiva
5. declarar backend como motor oficial de secuencias
6. desacoplar impuestos de comprobantes
7. activar flags y observabilidad
8. pilotear capa nueva
9. cerrar calidad de datos para `606/607/608`
10. construir validaciones y corridas auditables
11. pilotear cierre mensual
12. generalizar

### Regla final de seguridad

Si un paso compromete cualquiera de estos puntos, no se promueve:

- emisión de facturas activas
- numeración ya autorizada
- cálculo visible de impuestos
- notas de crédito activas
- trazabilidad histórica

Cuando haya duda entre rapidez y estabilidad, aquí debe ganar estabilidad.

Ese camino mantiene simplicidad defendible, reduce acoplamiento y deja espacio real
para soportar otros mercados sin rehacer el producto.
