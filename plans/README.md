# Plans Index

Fecha de organizacion: 2026-02-14

## Estructura

### `plans/multi-business/`

- `ANALISIS_ARQUITECTURA.md`
- `PLANES_TIERED_PRICING.md`
- `ROLES_AND_PERMISSIONS_AUDIT.md`
- `CURRENT_SESSION_FLOW.md`
- `CONTRATO_MEMBRESIAS_BACKEND.md`
- `CONTRATO_BUSINESS_INVITES.md`
- `2026-02-16-legacy-cleanup-plan.md`
- `2026-02-16-backlog-robust-access-model.md`
- `HECHO.md`
- `PENDIENTE_TASKLIST.md`
- `AUDITORIA_MD_RAIZ.md`

Uso: seguimiento del proyecto multi-negocio, roles por negocio, selector de negocio, invitaciones y migracion legacy.

### `plans/architecture/`

- `2026-03-03-contabilidad-design/README.md`
- `fiscal-compliance/README.md`
- `2026-03-23-multi-sucursal-y-analitica-enterprise-plan.md`
- `2026-03-17-vite-8-migration.md`
- `audits/2026-03-07-repo-architecture-audit.md`
- `audits/NAVIGATION_AUDIT.md`
- `audits/PERFORMANCE_AUDIT.md`

Uso: auditorias, bundles de arquitectura por iniciativa y decisiones tecnicas vigentes.

### `plans/security/`

- `2026-02-14-firestore-storage-rules-plan.md`
- `2026-02-15-p4-validacion-y-hallazgos.md`

Uso: plan de hardening de reglas de Firestore y Storage (aislamiento multi-tenant + rollout por fases).

### `plans/testing/`

- `README.md`
- `2026-04-23-finanzas-contabilidad-qa-maestro.md`
- `2026-03-17-testing-plan.md`
- `2026-03-17-testing-execution.md`
- `2026-03-17-testing-module-audit.md`

Uso: estrategia de testing del repo, prioridades por modulo, fases y checklist de cobertura para frontend y Cloud Functions. Para finanzas/contabilidad/CxP/CxC/tesoreria, usar primero `2026-04-23-finanzas-contabilidad-qa-maestro.md`.

### `plans/firestore-architecture/`

- `README.md`
- `audit/firestore-architecture-diagnosis-2026-03-12.md`
- `2026-03-19-nosql-balance-review/README.md`

Uso: auditorias del modelo Firestore, definicion de fronteras de datos y planes de mejora para el modelo documental multi-tenant.

### `plans/deploy/`

- `2026-02-15-pendientes-diff-deploy.md`

Uso: registro operativo de diffs/deploys (comandos usados, reintentos, pendientes y verificación).

### `plans/backlog/`

- `2025-10-10-null-productstockid-followup.md`
- `2025-11-13-stock-field-cleanup.md`
- `2026-02-16-agroveterinaria-gap-backlog-plan.md`
- `2026-02-16-dgii-ecf-backlog-plan.md`

Uso: backlog de iniciativas aún no iniciadas, seguimientos operativos, decisiones pendientes y preguntas de arranque.

## Convencion recomendada para nuevos planes

- Crear archivo dentro de la categoria correcta.
- Nombre sugerido: `YYYY-MM-DD-<tema>.md` cuando sea un plan nuevo.
- No crear archivos nuevos bajo `docs/plans/`; los planes viven dentro de `plans/<categoria>/`.
- Mantener dos documentos de control para iniciativas grandes:
  - `HECHO.md`
  - `PENDIENTE_TASKLIST.md`
