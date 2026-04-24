# Limpieza documental finanzas, contabilidad, CxP, tesoreria y tasa

Fecha: `2026-04-23`

Estado: `ACTIVE`

Alcance revisado:

- `plans/architecture/2026-03-03-contabilidad-design/**`
- `plans/testing/**` relacionados con contabilidad, finanzas, CxP y tesoreria
- `plans/architecture/2026-03-03-contabilidad-design/archive/2026-04-08-tesoreria-minima-candado-plan.md`
- `plans/architecture/2026-03-03-contabilidad-design/archive/2026-04-09-banking-odoo-inspired-plan.md`
- `plans/architecture/2026-03-03-contabilidad-design/archive/2026-04-09-tesoreria-odoo-gap-plan.md`
- `plans/2026-04-02-accounting-design-system-v1.md`

## Veredicto corto

Si hay redundancia real. No conviene borrar directo todavia porque varios archivos viejos guardan evidencia de decisiones y datos de piloto, pero si conviene limpiar lectura activa y preparar un lote de archivo.

El paquete debe quedar con esta regla:

- `README.md` dice que leer.
- `2026-04-23-finanzas-contabilidad-qa-maestro.md` gobierna pruebas.
- Auditorias de abril gobiernan brechas actuales.
- Documentos de marzo quedan historicos salvo arquitectura base todavia vigente.
- Planes sueltos de tesoreria fuera del paquete ya fueron archivados.

## Mantener como fuente activa

| Archivo | Motivo |
| --- | --- |
| `README.md` | Indice canonico del paquete. |
| `2026-04-04-sync-plan-contabilidad-vs-pdf.md` | Sincroniza plan viejo con estado real del repo. |
| `2026-04-04-plan-ejecucion-prioridades-contabilidad.md` | Prioridades actuales de contabilidad. |
| `2026-04-18-auditoria-contabilidad-end-to-end-odoo-gap.md` | Brechas actuales contabilidad vs ERP robusto. |
| `2026-04-18-auditoria-tesoreria-end-to-end-odoo-gap.md` | Brechas actuales tesoreria vs ERP robusto. |
| `2026-04-15-comprobante-ledger-gap-vs-erp.md` | Frontera fiscal/documento/ledger aun relevante. |
| `2026-04-22-auditoria-qa-finanzas-contabilidad-vitest.md` | Evidencia QA backend/functions. |
| `2026-04-22-auditoria-qa-frontend-finanzas-contabilidad-vitest.md` | Evidencia QA frontend/estado. |
| `2026-04-05-diseno-conciliacion-bancaria.md` | Diseno especifico de conciliacion bancaria. |
| `2026-03-24-plan-implementacion-accounting-events-journal.md` | Arquitectura base evento -> asiento. |
| `2026-03-23-catalogo-de-cuentas-integracion-modulos-design.md` | Arquitectura base catalogo/perfiles/modulos. |
| `politica-2026-03-12-exchange-rate-policy.md` | Politica compacta vigente de tasa/paridad. |
| `../../testing/2026-04-23-finanzas-contabilidad-qa-maestro.md` | Lista QA vigente. |
| `../../2026-04-02-accounting-design-system-v1.md` | Guia UI local, no compite con arquitectura contable. |

## Mantener como backlog operativo

| Archivo | Motivo | Limpieza sugerida |
| --- | --- | --- |
| `contabilidad-backlog.md` | Backlog corto del paquete. | Actualizar despues de cada cierre QA; no duplicar con planes viejos. |
| `contabilidad-checklist.md` | Checklist historico-operativa corta. | Convertir en resumen o retirar cuando el QA maestro cubra todo. |
| `2026-04-13-sprint-1-modelo-final-definitivo.md` | Todavia util para fuente de verdad final por dominio. | Absorber puntos vigentes en backlog y luego archivar. |
| `2026-04-13-sprint-2-tesoreria-canonica.md` | Todavia util para regla de tesoreria canonica. | Absorber en backlog tesoreria y archivar junto con planes sueltos. |
| `2026-04-13-sprint-3-caja-y-banco.md` | Todavia util para caja/banco. | Absorber en backlog tesoreria y archivar. |

## Historicos que no deben ser lectura principal

| Archivo | Razon |
| --- | --- |
| `resumen-2026-03-10-flujo-y-alcance-actual.md` | Snapshot temprano; el repo ya avanzo. |
| `audit/2026-03-09-repo-audit.md` | Auditoria base historica. |
| `audit/2026-03-10-reunion-gap-vs-plan.md` | Comparacion historica con reunion. |
| `audit/2026-03-24-auditoria-semaforo-contabilidad.md` | Semaforo reemplazado por auditorias de abril. |
| `2026-03-23-estado-actual-modulos-contables.md` | Estado de marzo, superado por README y auditorias de abril. |
| `2026-03-24-reporte-integral-contabilidad-pantallas-asesor.md` | Reporte para asesor; no guia operativa. |
| `2026-03-18-fase-siguiente-cierre-piloto-cohortes-y-eventos.md` | Ya marcado como historical snapshot. |
| `archive/2026-03-18-plan-nocturno-cierre-fase-operativa-pagos-caja-fx.md` | Ejecucion/piloto historico. |
| `archive/2026-04-13-smoke-uat-post-deploy.md` | Reemplazado por QA maestro y `plans/testing/runs/`. |
| `../../testing/archive/2026-04-05-contabilidad-cxp-checklist.md` | Reemplazado por QA maestro. |
| `../../testing/archive/2026-04-07-contabilidad-ciclo-completo-checklist.md` | Evidencia historica de corrida, no plan vigente. |

## Redundancia fuerte detectada

### Grupo 1. Compras, CxP y pagos de marzo

Estos archivos se pisan entre si y ya fueron absorbidos parcialmente por codigo, backlog y auditorias posteriores:

- `archive/2026-03-17-compras-cuentas-por-pagar-design.md`
- `archive/2026-03-17-dominio-pagos-ventas-compras-design.md`
- `archive/2026-03-17-migracion-pagos-caja-design.md`
- `archive/2026-03-18-analisis-pedidos-vs-compras-cxp.md`
- `archive/2026-03-18-reglas-operativas-compras-cxp-recepcion-pagos.md`

Accion aplicada:

1. Se extrajeron reglas vigentes a `contabilidad-backlog.md`.
2. Se movieron a `archive/`.
3. No leerlos en nuevas tareas salvo auditoria de decision vieja.

### Grupo 2. Tesoreria/banking fuera del paquete

Estos tres documentos duplican los sprints de abril y la auditoria end-to-end de tesoreria:

- `archive/2026-04-08-tesoreria-minima-candado-plan.md`
- `archive/2026-04-09-banking-odoo-inspired-plan.md`
- `archive/2026-04-09-tesoreria-odoo-gap-plan.md`

Accion aplicada:

1. `2026-04-18-auditoria-tesoreria-end-to-end-odoo-gap.md` queda como fuente vigente de brechas de tesoreria.
2. Los tres planes quedan archivados como evidencia historica, no como lectura activa.

### Grupo 3. Tasa de cambio y USD nativo

Estos documentos son un trio de implementacion temprana:

- `archive/etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `archive/implementacion-2026-03-10-facturacion-usd-nativa.md`
- `archive/migracion-2026-03-10-datos-esenciales-por-moneda.md`

La politica compacta vigente debe ser:

- `politica-2026-03-12-exchange-rate-policy.md`

Accion aplicada:

1. Mantener politica.
2. Archivar el trio como evidencia historica; no usarlo como fuente activa.

### Grupo 4. Fiscal/taxReceipt

Estos archivos son utiles, pero ya no estan en el paquete de contabilidad y no deben competir con contabilidad/CxP/tesoreria:

Movidos el `2026-04-23` a `../fiscal-compliance/`:

- `../fiscal-compliance/2026-04-14-diseno-modulo-fiscal-compliance-extensible.md`
- `../fiscal-compliance/2026-04-14-mapa-refactor-taxreceipt.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-acoplamientos-prioritarios.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-autoridad-secuencia-backend.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-freeze-alcance-legado.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-inventario-responsabilidades.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-ownership-fronteras.md`

Accion aplicada:

1. No borrar.
2. Crear paquete separado `plans/architecture/fiscal-compliance/`.
3. Dejar en README de contabilidad solo una referencia cruzada.

## Archivado aplicado

Lote A, archivado el `2026-04-23`:

- `archive/2026-03-18-analisis-pedidos-vs-compras-cxp.md`
- `archive/2026-03-18-reglas-operativas-compras-cxp-recepcion-pagos.md`
- `archive/2026-04-05-trazabilidad-bidireccional-documento-asiento.md`
- `archive/2026-04-13-smoke-uat-post-deploy.md`
- `../../testing/archive/2026-04-05-contabilidad-cxp-checklist.md`

Lote B, reglas absorbidas y archivado el `2026-04-23`:

- `archive/2026-03-17-compras-cuentas-por-pagar-design.md`
- `archive/2026-03-17-dominio-pagos-ventas-compras-design.md`
- `archive/2026-03-17-migracion-pagos-caja-design.md`
- `archive/2026-03-18-plan-nocturno-cierre-fase-operativa-pagos-caja-fx.md`
- `../../testing/archive/2026-04-07-contabilidad-ciclo-completo-checklist.md`

Lote C, fiscal movido a otro paquete:

- `../fiscal-compliance/2026-04-14-diseno-modulo-fiscal-compliance-extensible.md`
- `../fiscal-compliance/2026-04-14-mapa-refactor-taxreceipt.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-acoplamientos-prioritarios.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-autoridad-secuencia-backend.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-freeze-alcance-legado.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-inventario-responsabilidades.md`
- `../fiscal-compliance/2026-04-14-taxreceipt-ownership-fronteras.md`

Lote D, tesoreria suelta archivada el `2026-04-23`:

- `archive/2026-04-08-tesoreria-minima-candado-plan.md`
- `archive/2026-04-09-banking-odoo-inspired-plan.md`
- `archive/2026-04-09-tesoreria-odoo-gap-plan.md`

Lote E, FX/moneda archivado el `2026-04-23`:

- `archive/etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `archive/implementacion-2026-03-10-facturacion-usd-nativa.md`
- `archive/migracion-2026-03-10-datos-esenciales-por-moneda.md`

## Candidatos a borrar

No recomiendo borrar directo en esta pasada.

Razon:

- Muchos documentos no son lectura activa, pero conservan contexto de decisiones.
- Hay referencias internas desde README/backlog/sync-plan.
- Borrar antes de archivar o absorber rompe trazabilidad de auditoria.

El borrado seguro seria una segunda pasada:

1. Mover a `archive/`.
2. Correr una corrida QA/documental usando solo README + QA maestro + auditorias activas.
3. Si nadie necesita el archivo archivado, borrar en otro commit.

## Accion aplicada en esta pasada

- Se creo este inventario de limpieza.
- Se redujo la lectura activa en `README.md`.
- Se dejo el QA maestro como unica fuente para pruebas.
- Se archivo el Lote A sin borrar archivos.
- Se absorbieron reglas vigentes del Lote B en `contabilidad-backlog.md`.
- Se archivo el Lote B sin borrar archivos.
- Se movio fiscal/taxReceipt a `plans/architecture/fiscal-compliance/`.
- Se archivo tesoreria suelta y queda la auditoria 2026-04-18 como fuente vigente.
- Se archivo el trio FX/moneda y queda `politica-2026-03-12-exchange-rate-policy.md` como fuente vigente.

## Siguiente accion recomendada

Ejecutar QA maestro de finanzas/contabilidad contra codigo actual.

Si el objetivo es una limpieza agresiva, el orden correcto es:

1. Ejecutar QA maestro.
2. Registrar corrida en `../../testing/runs/`.
3. Solo despues borrar archivos archivados si ya no aportan evidencia.
