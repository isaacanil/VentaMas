# Testing Plans

Estado: `ACTIVE`

Actualizado: `2026-04-23`

## Lectura correcta

Este directorio contiene planes de prueba. Para finanzas, contabilidad, tesoreria, CxP y CxC, la fuente vigente es:

1. `2026-04-23-finanzas-contabilidad-qa-maestro.md`

Los documentos anteriores siguen como evidencia historica, pero no deben competir con el plan maestro:

- `archive/2026-04-05-contabilidad-cxp-checklist.md`
- `archive/2026-04-07-contabilidad-ciclo-completo-checklist.md`
- `2026-03-17-testing-plan.md`
- `2026-03-17-testing-execution.md`
- `2026-03-17-testing-module-audit.md`

## Regla para nuevos archivos

- No crear otro checklist suelto para contabilidad, tesoreria, CxP o CxC.
- Si es una corrida real, crear evidencia bajo `plans/testing/runs/`.
- Si cambia el alcance de pruebas, actualizar primero `2026-04-23-finanzas-contabilidad-qa-maestro.md`.
- Si un plan viejo queda absorbido, marcarlo desde el README o desde el plan maestro; no duplicar la misma lista.
