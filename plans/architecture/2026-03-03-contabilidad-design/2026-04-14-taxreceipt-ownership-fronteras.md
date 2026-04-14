# Ownership recomendado y fronteras de `taxReceipt`

> Fecha: `2026-04-14`
>
> Etapa: `Etapa 1`
>
> Paso: `Paso 2. Declarar ownership recomendado`

Este documento convierte el inventario del paso anterior en una declaración
explícita de ownership por dominio para el refactor fiscal/compliance. La meta
es reducir complejidad accidental antes de mover código: primero se aclara qué
pieza es dueña de cada responsabilidad, qué puede consumir cada módulo y qué
acoplamientos dejan de estar permitidos.

## Decisión de ownership

| Dominio | Dueño de | Consume de otros módulos | No debe adueñarse de |
| --- | --- | --- | --- |
| `Settings > Fiscal` | secuencias autorizadas, tipos documentales, vigencias, alertas de agotamiento, activación de capacidad documental, parámetros visibles del negocio | catálogos jurisdiccionales, servicios backend de documentos fiscales | pricing, cálculo tributario, lógica transaccional de ventas, reportes regulatorios |
| `Ventas / Facturación` | emisión comercial, notas de crédito, selección del tipo documental requerido por la venta, UX de facturación | `Fiscal documents` para reservar/generar número, `Tax calculation` para impuestos, catálogos de documentos | numeración oficial, reglas de secuencia, reglas regulatorias mensuales, seeds fiscales |
| `Compras / Gastos` | captura y consumo de comprobantes recibidos, clasificación operativa de compras/gastos, vínculos con pagos y retenciones | catálogos fiscales, validadores fiscales, proyección fiscal | secuencias emitidas por el negocio, reportes `606/607/608`, reglas contables generales |
| `Contabilidad` | asientos, reportes financieros, conciliación contable, proyecciones financieras | documentos operativos, eventos fiscales, catálogos tributarios cuando aplique | ownership de `NCF/e-NCF`, workflow regulatorio, envío a autoridad tributaria |
| `Fiscal / Compliance` | reportes regulatorios, validaciones por período, auditoría, ledger operativo fiscal, monitoreo y futura capa `e-CF` | ventas, compras, gastos, contabilidad, `Settings > Fiscal` | pricing del producto, captura operativa primaria, UX de checkout o carrito |
| `Fiscal documents` backend | motor canónico de secuencia, reserva, generación, ledger y consistencia documental | configuración fiscal del negocio, catálogos jurisdiccionales, transacciones de negocio | reglas de UI local, impuestos del carrito, render visual hardcodeado |
| `Tax calculation` | cálculo de `ITBIS`, exenciones, montos gravados/exentos y reglas tributarias del documento | documento comercial, catálogos tributarios y perfil fiscal | activación de secuencia NCF, agotamiento de comprobantes, settings de autorización |

## Fronteras obligatorias

### `Settings > Fiscal`

Debe ser la superficie de configuración y consulta, no el motor de negocio. Puede
editar autorizaciones, prefijos, vigencias y flags del negocio, pero las
mutaciones críticas de secuencia deben delegarse al backend canónico.

### `Ventas / Facturación`

Puede decidir si una venta requiere documento fiscal y qué tipo documental pedir,
pero no debe construir ni avanzar secuencias. La venta solicita un documento
fiscal; no implementa el motor.

### `Compras / Gastos`

Debe registrar documentos recibidos y datos requeridos para cumplimiento, pero sin
adueñarse de la semántica global de compliance. Su responsabilidad termina en la
captura y clasificación operativa confiable.

### `Contabilidad`

Consume resultado fiscal para conciliación y reportes, pero no define la verdad
canónica de `NCF/e-NCF`. El dominio contable no debe absorber reglas locales de
DGII ni decisiones de numeración.

### `Fiscal / Compliance`

Es el dueño del cierre mensual, auditoría y adaptadores jurisdiccionales. También
debe absorber herramientas como `ledger insights`, reconstrucción y detección de
duplicados porque son capacidad operativa fiscal, no settings.

## Reglas de no-acoplamiento

1. `taxReceiptEnabled` solo puede significar capacidad documental fiscal del
   negocio. No debe decidir impuestos, pricing ni totales.
2. La numeración oficial vive en backend. Frontend solo puede previsualizar,
   seleccionar o mostrar estado.
3. Ningún módulo operativo debe crear un generador nuevo de secuencia fuera de
   `Fiscal documents`.
4. Las plantillas PDF o headers visuales no deben hardcodear `B01/B02`; deben
   consumir catálogos documentales.
5. `Settings > Fiscal` no debe contener reglas transaccionales de ventas ni lógica
   de cierre mensual.
6. `Contabilidad` no debe convertirse en dueño de `NCF/e-NCF` aunque use esos
   datos para conciliación.
7. `Fiscal / Compliance` consume datos operativos ya capturados; no debe duplicar
   formularios base de ventas, compras o gastos.

## Interfaces recomendadas entre dominios

### De `Settings > Fiscal` hacia `Fiscal documents`

- perfil fiscal del negocio
- secuencias autorizadas
- tipos documentales habilitados
- vigencias y umbrales de alerta

### De `Ventas / Facturación` hacia `Fiscal documents`

- contexto de la transacción
- tipo documental solicitado
- documento afectado en caso de nota de crédito
- identidad del negocio y usuario

### De módulos operativos hacia `Fiscal / Compliance`

- snapshots documentales
- eventos relevantes por período
- anulaciones y modificaciones
- pagos y retenciones aplicables

### De `Fiscal / Compliance` hacia `Contabilidad`

- diferencias explicadas
- cortes mensuales validados
- proyecciones y corridas auditables

## Decisiones concretas para el refactor

- `NCF/e-NCF` queda formalmente fuera de tesorería.
- `NCF/e-NCF` queda fuera del ownership cliente-side de ventas.
- `NCF/e-NCF` tampoco se absorbe dentro de contabilidad.
- `src/firebase/taxReceipt/*` debe tender a ser cliente de servicios fiscales y no
  origen de nuevas reglas de secuencia.
- `functions/src/app/modules/taxReceipt/*` y `invoice v2` deben converger hacia un
  único ownership backend de documentos fiscales.

## Salida del paso

Queda declarado el ownership objetivo para cinco dominios funcionales y dos capas
técnicas transversales (`Fiscal documents` y `Tax calculation`). Con esto, el
siguiente paso ya no es discutir quién es dueño de qué, sino enumerar y priorizar
los acoplamientos peligrosos que deben romperse primero para que el rollout siga
siendo aditivo y seguro.
