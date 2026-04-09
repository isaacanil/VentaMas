# feat/accounting-foundation

## Objetivo

Abrir la base tecnica del modulo de contabilidad sin romper el sistema actual, empezando por monedas, tasas de cambio, bancos y eventos contables.

## Rama base

- creada desde `feat/public-signup-home-onboarding`

## Estado

- activa
- suscripciones queda como base heredada, pero la prioridad pasa a contabilidad

## Alcance inicial

- modelo de monedas por negocio
- tasas de cambio historicas
- bancos y cuentas bancarias
- snapshots monetarios en documentos operativos
- `accountingEvents` como capa paralela

## Decisiones tomadas

1. El namespace nuevo debe ser `accounting`, no `billing`.
2. `DOP` se asume como moneda base/funcional inicial.
3. La tasa se guarda como snapshot historico por documento.
4. La capa contable no reemplaza aun las lecturas legacy.
5. La primera integracion fuerte debe apoyarse en eventos confirmados, no en reescritura de UI.

## Riesgos principales

1. Doble contrato de facturas: `invoicesV2` y `invoices`.
2. Saldos derivados redundantes en CxC, clientes y caja.
3. Compras y gastos siguen con escritura directa desde frontend.
4. Posible mezcla conceptual entre contabilidad del negocio y billing SaaS.

## Documentos relacionados

- [README](/C:/Dev/VentaMas/plans/architecture/2026-03-03-contabilidad-design/README.md)
- [2026-03-09-repo-audit.md](/C:/Dev/VentaMas/plans/architecture/2026-03-03-contabilidad-design/audit/2026-03-09-repo-audit.md)
- [contabilidad-backlog.md](/C:/Dev/VentaMas/plans/architecture/2026-03-03-contabilidad-design/contabilidad-backlog.md)
- [contabilidad-checklist.md](/C:/Dev/VentaMas/plans/architecture/2026-03-03-contabilidad-design/contabilidad-checklist.md)

## Regla de comentarios para esta rama

Comentar solo si agrega valor tecnico real. Casos validos:

- por que un snapshot monetario no puede recalcularse
- por que un flujo mantiene compatibilidad legacy
- por que un evento contable sale de un punto exacto del proceso
- por que una proyeccion no es source of truth

## Siguientes pasos

1. Definir Fase 0 con colecciones y campos exactos.
2. Elegir primer punto de emision de `accountingEvents`.
3. Separar semanticamente `accounting` de `billing` en backend y frontend.

