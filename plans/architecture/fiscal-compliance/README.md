# Fiscal Compliance

Estado: `ACTIVE`

Actualizado: `2026-04-23`

Este paquete contiene planes de cumplimiento fiscal, `taxReceipt`, `NCF`, secuencias fiscales, reportes DGII y arquitectura fiscal extensible.

## Lectura correcta

Fiscal no es contabilidad general.

- Contabilidad gobierna `accountingEvents`, `journalEntries`, reportes financieros y cierre.
- Fiscal/compliance consume documentos operativos y contables para reportes fiscales, secuencias, validaciones y auditoria tributaria.
- `DGII` es la primera jurisdiccion, no el dominio completo.

## Leer primero

1. `2026-04-14-diseno-modulo-fiscal-compliance-extensible.md`
2. `2026-04-14-mapa-refactor-taxreceipt.md`
3. `2026-04-14-taxreceipt-freeze-alcance-legado.md`
4. `2026-04-14-taxreceipt-autoridad-secuencia-backend.md`
5. `2026-04-14-taxreceipt-acoplamientos-prioritarios.md`
6. `2026-04-14-taxreceipt-inventario-responsabilidades.md`
7. `2026-04-14-taxreceipt-ownership-fronteras.md`

## Regla de convivencia con contabilidad

- No meter reglas fiscales nuevas dentro del paquete de contabilidad.
- Si un reporte fiscal necesita saldos contables, debe consumir reportes/asientos como fuente, no redefinirlos.
- Si un documento fiscal necesita trazabilidad contable, debe enlazar documento -> evento/asiento, no duplicar ledger.
- Si una regla fiscal depende de `NCF` o `e-CF`, debe vivir aqui o en codigo del dominio fiscal, no en settings contable.
