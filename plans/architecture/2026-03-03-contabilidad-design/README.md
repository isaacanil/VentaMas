# Contabilidad

Estado del paquete: `ACTIVE`

Actualizado: `2026-04-23`

Este paquete concentra el frente de contabilidad operativa y general del sistema:

- configuracion contable por negocio
- subledgers operativos (`CxC`, `CxP`, caja/tesoreria)
- workspace contable (`/contabilidad/*`)
- reglas de convivencia entre ventas, compras, gastos, bancos, impuestos y mayor

## Lectura correcta hoy

La lectura vigente ya no es "todavia no existe contabilidad".

La lectura correcta es esta:

- ya existe una base real de configuracion contable en `settings/accounting`
- ya existen superficies visibles de `libro-diario`, `libro-mayor`, `reportes` y `cierre-periodo`
- ya existe una cadena contable real `evento -> asiento -> reporte` en codigo
- ya existen mutaciones backend para asiento manual, reverso y cierre de periodo
- ya existen productores reales para `invoice.committed`, `purchase.committed`, `accounts_payable.payment.*` y `expense.recorded`
- ya existe proyector `accountingEvents -> journalEntries` con `dead letters + replay` en primer corte
- ya existen reportes backend para mayor, balanza, estado de resultados y balance general con paginacion base en el mayor
- `CxP` ya es operable como submodulo con `aging`, evidencia y acceso a contabilidad
- ya existe bitacora visible en `settings/accounting`
- pero la capa contable todavia no esta cerrada de punta a punta

No conviene leer este paquete como si todo estuviera en fase "solo diseño", ni como si ya existiera un mayor general completamente consolidado.

## Leer primero

### Fuente de verdad actual

1. `2026-04-04-sync-plan-contabilidad-vs-pdf.md`
2. `2026-04-04-plan-ejecucion-prioridades-contabilidad.md`
3. `../../testing/2026-04-23-finanzas-contabilidad-qa-maestro.md`
4. `2026-04-18-auditoria-contabilidad-end-to-end-odoo-gap.md`
5. `2026-04-18-auditoria-tesoreria-end-to-end-odoo-gap.md`
6. `2026-04-15-comprobante-ledger-gap-vs-erp.md`
7. `2026-04-23-limpieza-documental-finanzas.md`

### Fuente QA vigente

- `../../testing/README.md`
- `../../testing/2026-04-23-finanzas-contabilidad-qa-maestro.md`

Los checklists viejos de `plans/testing` quedan como evidencia historica. No crear otro checklist suelto de contabilidad/CxP/tesoreria sin actualizar primero el plan maestro QA.

### Documentos activos por frente

- `2026-03-24-plan-implementacion-accounting-events-journal.md`
- `2026-03-23-catalogo-de-cuentas-integracion-modulos-design.md`
- `2026-04-13-sprint-1-modelo-final-definitivo.md`
- `2026-04-13-sprint-2-tesoreria-canonica.md`
- `2026-04-13-sprint-3-caja-y-banco.md`
- `2026-04-05-diseno-conciliacion-bancaria.md`
- `2026-04-18-auditoria-contabilidad-end-to-end-odoo-gap.md`
- `2026-04-18-auditoria-tesoreria-end-to-end-odoo-gap.md`
- `2026-04-22-auditoria-qa-finanzas-contabilidad-vitest.md`
- `2026-04-22-auditoria-qa-frontend-finanzas-contabilidad-vitest.md`
- `politica-2026-03-12-exchange-rate-policy.md`
- `../../2026-04-02-accounting-design-system-v1.md`
- `2026-04-23-limpieza-documental-finanzas.md`

### Paquetes relacionados

- `../fiscal-compliance/README.md`: fiscal, `taxReceipt`, `NCF`, DGII y compliance. No mezclar ese frente con contabilidad general salvo por trazabilidad documento/asiento.

### Snapshots historicos, no lectura principal

- `2026-03-18-fase-siguiente-cierre-piloto-cohortes-y-eventos.md`
- `2026-03-24-reporte-integral-contabilidad-pantallas-asesor.md`
- `resumen-2026-03-10-flujo-y-alcance-actual.md`
- `2026-03-23-estado-actual-modulos-contables.md`
- `archive/2026-03-17-compras-cuentas-por-pagar-design.md`
- `archive/2026-03-17-dominio-pagos-ventas-compras-design.md`
- `archive/2026-03-17-migracion-pagos-caja-design.md`
- `archive/2026-03-18-analisis-pedidos-vs-compras-cxp.md`
- `archive/2026-03-18-reglas-operativas-compras-cxp-recepcion-pagos.md`
- `archive/2026-03-18-plan-nocturno-cierre-fase-operativa-pagos-caja-fx.md`
- `archive/2026-04-08-tesoreria-minima-candado-plan.md`
- `archive/2026-04-09-banking-odoo-inspired-plan.md`
- `archive/2026-04-09-tesoreria-odoo-gap-plan.md`
- `archive/2026-04-05-trazabilidad-bidireccional-documento-asiento.md`
- `archive/2026-04-13-smoke-uat-post-deploy.md`
- `archive/etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `archive/implementacion-2026-03-10-facturacion-usd-nativa.md`
- `archive/migracion-2026-03-10-datos-esenciales-por-moneda.md`
- `../../testing/archive/2026-04-05-contabilidad-cxp-checklist.md`
- `../../testing/archive/2026-04-07-contabilidad-ciclo-completo-checklist.md`

Estos documentos siguen sirviendo como contexto, pero ya no deben competir con la fuente de verdad actual.

## Prioridades vigentes

### Track A. Brechas estructurales

1. Implementar conciliacion bancaria a partir del workflow ya disenado
2. Cerrar politica de periodo
3. Completar cobertura de trazabilidad documento↔asiento↔reporte
4. Validar datos reales del piloto y limpiar huecos legacy

### Track B. Endurecimiento operativo

1. Quitar el fallback global de `firestore.rules`
2. Endurecer `pending_account_mapping` y mapeo contable
3. Estabilizar exportacion y performance del mayor
4. Validar cohortes fuera del piloto

### Track C. Pipeline contable y endurecimiento backend

1. Completar coberturas faltantes de `Ver asiento contable`
2. Materializar estrategia de saldos/aperturas por periodo si el mayor lo exige
3. Decidir si el libro diario tambien migra al mismo modelo backend
4. Cerrar `FX` de anticipos, parciales y revaluacion

## Que ya esta hecho en codigo

- rollout aislado por `businessId` en piloto
- `monetary` reutilizado entre factura, pago, compra y gasto
- `cashMovements` para `invoice_pos`, `receivable_payment`, `expense` y `supplier_payment`
- `paymentState` y `paymentTerms` en compras
- `accountsPayablePayments` como ledger operativo inicial
- `bankAccounts` y `exchangeRates` como base estructurada del piloto
- configuracion visible de contabilidad en frontend
- `chartOfAccounts` y `accountingPostingProfiles` como configuracion persistente en `settings/accounting`
- historial tecnico en `settings/accounting`, `chartOfAccounts`, `accountingPostingProfiles` y `bankAccounts`
- bitacora visible en `settings/accounting`
- alta de asiento manual via callable backend
- reverso de asiento via callable backend
- cierre de periodo via callable backend
- productor real `invoice.committed`
- productor real `purchase.committed`
- productores reales `accounts_payable.payment.recorded`, `accounts_payable.payment.voided` y `expense.recorded`
- proyector `accountingEvents -> journalEntries`
- `dead letters + replay` en primer corte para el proyector
- reportes backend para `libro mayor`, `balanza`, `estado de resultados` y `balance general`
- paginacion backend base del `libro mayor`
- ruta propia de `CxP` en `/accounts-payable/list`
- `CxP` usable con `aging`, evidencia y acceso a contabilidad
- `Ver origen` desde la capa contable hacia documentos operativos soportados
- `Ver asiento contable` al menos en cobros, compras y pagos proveedor soportados

## Que sigue pendiente real

- conciliacion bancaria end-to-end con sesiones, matching y cierre
- politica de periodo cerrada (`reopen` vs `lock dates + excepciones`)
- quitar el fallback global `allow read, write: if isSignedIn()` en `firestore.rules`
- cobertura completa de trazabilidad documento↔evento↔asiento en todos los documentos operativos
- endurecimiento de `pending_account_mapping`, backfill y reproceso operacional
- estrategia de performance para aperturas del mayor sin leer todos los periodos previos
- exportacion estable del mayor sin truncar resultados grandes
- decidir si el libro diario tambien debe migrar al mismo modelo backend
- validacion operativa fuera del piloto y limpieza de datos legacy
- `FX` de anticipos, parciales y revaluacion

## Regla de lectura del paquete

- Si el documento responde "como funciona hoy" o "que falta cerrar", debe alinearse con el estado real del repo y no con supuestos de marzo.
- Si el documento es historico, debe decirlo explicitamente.
- Si un plan cambia prioridad, `README`, backlog y checklist deben reflejarlo primero.
