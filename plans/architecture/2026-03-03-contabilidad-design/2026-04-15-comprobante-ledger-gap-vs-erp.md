# Comprobante, InvoiceV2 y Ledger: Gap vs ERP robusto

Fecha: 2026-04-15

## Contexto

Este documento resume la revisión del dominio de comprobantes, `invoiceV2`, pagos de cuentas por cobrar y `ncfLedger` en VentaMas.

Pregunta principal:

- si la lógica actual de comprobantes e historial está alineada con prácticas robustas tipo ERP
- si `ncfLedger` cumple rol correcto o mezcla responsabilidades
- qué parte debe quedarse como fuente primaria y qué parte debe pasar a ser proyección o índice derivado

El punto de comparación conceptual fue Odoo:

- factura posteada separada de pago
- pago separado de reconciliación
- libro contable separado de documento fiscal
- correcciones mediante reversas o notas de crédito, no mutación libre del documento posteado

## Resumen ejecutivo

`invoiceV2` es una base buena y bastante madura para resiliencia operativa:

- idempotencia
- outbox
- compensaciones
- finalize separado
- emisión posterior de evento contable

El problema principal no está en resiliencia de creación. Está en frontera de responsabilidades.

Hoy el sistema mezcla en varias zonas:

- documento fiscal
- historial operativo de UI
- evidencia de cobro
- estado de cuentas por cobrar
- proyección contable
- índice fiscal por secuencia NCF

Eso introduce complejidad accidental. Funciona, pero cuesta más mantener, reparar y auditar.

## Hallazgos principales

### 1. `invoiceV2` sí parece dirección correcta

La creación V2 hace lo más importante bien:

- crea base de factura en `pending`
- registra idempotencia
- difiere efectos laterales al outbox
- finaliza solo cuando tareas terminan
- compensa cuando algo falla

Eso se acerca más a un backend robusto que a un flujo puramente frontend.

## 2. `ncfLedger` no es ledger real

`ncfLedger` agrupa facturas por prefijo y secuencia NCF y detecta duplicados. Eso sirve para:

- auditoría de secuencia
- detección de huecos
- reconstrucción de correlativos
- soporte interno

No sirve como:

- libro mayor
- fuente de verdad de pagos
- reconciliación
- evidencia contable inmutable

Llamarlo `ledger` confunde porque el proyecto ya tiene un dominio contable separado:

- `accountingEvents`
- `journalEntries`

Conclusión:

`ncfLedger` debe tratarse como índice fiscal derivado, no como ledger contable.

## 3. `ncfLedger` hoy además puede quedar obsoleto

Existe trigger `syncNcfLedger`, pero no está exportado desde `functions/src/index.js`.

Implicación:

- el índice puede quedar stale
- hoy depende de reconstrucciones manuales con `rebuildNcfLedger`
- cualquier pantalla o proceso que lo trate como estado vivo corre riesgo

Conclusión:

o se activa y despliega como proyección soportada, o se baja explícitamente a herramienta diagnóstica/manual.

## 4. El cobro CxC se registra en demasiados lugares

Cuando se registra un cobro de cuentas por cobrar, el flujo actual:

- actualiza cuenta por cobrar
- actualiza cuotas
- registra recibo propio
- actualiza cliente
- agrega `paymentHistory` dentro de la factura
- registra cash movements
- emite `accountingEvent`

Eso significa que una sola intención de negocio deja rastro en muchas superficies.

Problema:

- más riesgo de drift
- más costo de reparación
- más acoplamiento entre módulos
- más dificultad para saber cuál registro es fuente primaria

Conclusión:

el cobro debe tener una fuente primaria clara y los historiales visibles en factura deben derivarse de esa fuente, no mutarse como si fueran verdad primaria paralela.

## 5. La factura canónica se reconstruye con demasiados fallbacks

En `outbox.worker.js`, la factura canónica se arma mezclando:

- snapshot de `invoiceV2`
- `cart`
- documento canónico existente
- historial previo
- fallback de NCF
- fallback de `cashCountId`
- fallback de fechas

Eso es útil como mecanismo de recovery o compatibilidad legado.

No es ideal como política steady-state para documento fiscal posteado.

En un ERP robusto:

- la factura posteada se congela semánticamente
- los ajustes posteriores usan reversa, nota de crédito o documento complementario
- no se rehace libremente el documento con heurísticas cada vez

Conclusión:

hay que separar modo recovery/admin de modo normal de posteo fiscal.

## 6. Identidad fiscal todavía está borrosa

El sistema sigue aceptando `NCF` y `comprobante` como alias funcionales.

Eso ayuda migración. Pero deja varias consecuencias:

- normalización repetida en lectura
- ambigüedad en contratos
- más ramas legacy
- más riesgo de inconsistencias semánticas

Conclusión:

debe existir un solo campo fiscal canónico. Los aliases deben quedar encapsulados en adapters o migraciones.

## Modelo actual resumido

Hoy, conceptualmente, el dominio luce así:

- `invoicesV2`: agregado orquestado para crear factura de forma resiliente
- `invoices`: read model canónico/legado usado por otros módulos
- `ncfUsage`: rastro de reserva/uso/anulación de NCF
- `ncfLedger`: índice derivado por prefijo/secuencia
- `accountsReceivablePayments`: evento operativo de cobro
- `accountsReceivablePaymentReceipt`: comprobante/recibo del cobro
- `accountingEvents`: evento económico fuente para contabilidad
- `journalEntries`: proyección contable

Problema central:

la separación ya existe en piezas, pero todavía no está cerrada en naming, ownership y reglas de mutación.

## Modelo objetivo recomendado

### 1. Documento fiscal

Fuente primaria:

- factura canónica posteada
- `ncfUsage` para reserva/consumo/anulación de NCF

Reglas:

- una vez posteada, identidad fiscal no debe mutarse por heurística normal
- correcciones fiscales deben salir por reversa o nota de crédito
- `invoiceV2` sigue siendo orquestador, no documento fiscal final soberano

### 2. Pago / cobro

Fuente primaria:

- `accountsReceivablePayments`
- `accountsReceivablePaymentReceipt`

Reglas:

- el cobro existe por sí mismo como evento/documento operativo
- historial visible en factura debe ser derivado desde pagos vinculados
- `paymentHistory` embebido en factura debe pasar a rol de caché/read model o eliminarse gradualmente

### 3. Contabilidad

Fuente primaria:

- `accountingEvents`

Proyección:

- `journalEntries`

Reglas:

- ni `ncfLedger` ni `paymentHistory` ni `history` de factura deben competir con contabilidad
- la contabilidad debe derivar de eventos económicos, no de read models mezclados

### 4. Índice fiscal

Fuente primaria:

- ninguna

Rol:

- índice derivado para secuencia NCF
- detección de huecos y duplicados
- soporte y auditoría fiscal operativa

Recomendación:

- renombrar gradualmente `ncfLedger` a algo más preciso como `ncfSequenceIndex` o `ncfAuditIndex`

### 5. Historial UI / timeline

Fuente:

- proyecciones de eventos relevantes

Reglas:

- `statusTimeline`, `history`, `paymentHistory` deben entenderse como read models
- idealmente migrar a subcolecciones append-only si siguen creciendo
- no usarlos como fuente primaria de negocio cuando ya existe documento/evento específico

## Gap vs Odoo

Comparado con Odoo, VentaMas ya tiene algo mejor en resiliencia de creación de factura:

- idempotencia explícita
- outbox
- compensaciones

Pero queda por debajo en estas fronteras:

### Frontera 1. Documento vs pago

Odoo separa claramente:

- invoice
- payment
- reconciliation

VentaMas todavía mezcla pago dentro de historia de factura además del documento de pago.

### Frontera 2. Fiscal vs contable

Odoo no llama ledger a un índice de secuencia fiscal. El ledger real vive en journal items y journal entries.

VentaMas tiene ya `accountingEvents` y `journalEntries`, pero el nombre `ncfLedger` compite semánticamente con ellos.

### Frontera 3. Corrección posterior

Odoo privilegia reversas y documentos compensatorios.

VentaMas todavía permite que la factura canónica se rehaga con muchos fallbacks, lo cual es útil para recovery, pero no debería ser comportamiento normal de posteo.

## Decisiones recomendadas

### Decisión 1. Bajar `ncfLedger` de estatus conceptual

Adoptar explícitamente:

- no es ledger contable
- sí es índice fiscal derivado

Impacto:

- reduce ambigüedad
- limpia lenguaje en backend, frontend y soporte

### Decisión 2. Definir una sola fuente primaria por intención

- emitir factura: factura canónica + `ncfUsage`
- cobrar deuda: `accountsReceivablePayments`
- contabilizar: `accountingEvents`
- visualizar historial: read models derivados

### Decisión 3. Congelar semánticamente factura posteada

Permitir solo:

- proyecciones derivadas
- actualizaciones técnicas no documentales
- reversas mediante documentos explícitos

Evitar:

- reconstrucción abierta de identidad/documento fiscal como steady-state

### Decisión 4. Encapsular legado fiscal

Adoptar `NCF` como único campo canónico.

Mantener `comprobante` solo como:

- adapter de lectura legacy
- script de migración
- compatibilidad temporal controlada

## Roadmap sugerido

### Fase 1. Claridad semántica

- documentar ownership de `invoicesV2`, `invoices`, `ncfUsage`, `ncfLedger`, `accountingEvents`
- renombrar conceptualmente `ncfLedger` en docs y pantallas internas
- marcar `paymentHistory` y `history` como read models no soberanos

### Fase 2. Fuente primaria de cobros

- dejar `accountsReceivablePayments` + receipt como evidencia primaria
- dejar de expandir responsabilidad de `invoice.paymentHistory`
- crear proyección de historial visible desde pagos enlazados

### Fase 3. Freeze de factura posteada

- separar claramente flujo normal de posteo vs herramientas de repair
- restringir merges heurísticos en factura canónica una vez posteada
- mover recovery fuerte a tooling admin explícito

### Fase 4. Índice fiscal derivado soportado

Elegir una:

- activar y desplegar `syncNcfLedger`
- o declarar `ncfLedger` como índice manual y dejar de depender de frescura online

La peor opción es estado actual híbrido.

### Fase 5. Limpieza de contrato fiscal

- migrar consumidores a `NCF`
- encapsular `comprobante`
- auditar frontend, PDFs, reportes y funciones legacy

## Riesgos de no actuar

- drift entre factura, pago, recibo e índice fiscal
- reparaciones operativas más frecuentes
- dificultad para auditoría o soporte fiscal
- crecimiento accidental de lógica duplicada
- colisión conceptual entre dominio fiscal y dominio contable

## Criterio final

La conclusión no es que el sistema esté mal diseñado por completo.

La conclusión es más precisa:

- `invoiceV2` va bien como orquestación resiliente
- contabilidad nueva también va en dirección correcta
- el área débil está en la separación entre comprobante fiscal, historial operativo, pago y ledger

El siguiente paso correcto no es meter más lógica.

Es reducir ambigüedad:

- una fuente primaria por intención
- menos historiales soberanos
- `ncfLedger` tratado como índice fiscal
- factura posteada más inmutable
- recovery separado de flujo normal

