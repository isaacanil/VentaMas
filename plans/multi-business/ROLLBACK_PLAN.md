# Rollback Plan - Multi-business

Fecha: 2026-02-14
Alcance: membresias canonicas (`businesses/{businessId}/members/{uid}`), lectura dual, escritura dual, enforcement de acceso por negocio.

## Objetivo

Permitir reversión controlada por fases sin perder acceso operativo.

## Fase 0 - Precondiciones

1. Exportar respaldo de Firestore antes de cambios de alto impacto.
2. Ejecutar reporte base:
   - `node scripts/multi-business/reportLegacyFallback.js --limit=5000`
3. Confirmar que las funciones desplegadas usan variables de entorno versionadas.

## Fase 1 - Reversión de escritura canónica

Cuando: incidencias en escritura/lectura del nodo canónico.

Acción:
1. Cambiar variables:
   - `MULTIBUSINESS_DUAL_WRITE_CANONICAL=false`
   - `MULTIBUSINESS_DUAL_WRITE_LEGACY=true`
2. Redeploy de funciones que escriben membresía.

Resultado esperado:
- La app sigue operando con espejo legacy.
- Se conserva compatibilidad con frontend actual.

## Fase 2 - Reversión de enforcement estricto

Cuando: cortes por permisos/subscripción en endpoints críticos.

Acción:
1. Volver a release/tag previo de funciones v2.
2. Desplegar solo funciones afectadas.
3. Mantener scripts de métricas activos para medir recuperación.

Resultado esperado:
- Se restablece comportamiento anterior mientras se corrige.

## Fase 3 - Restauración de datos de membresía

Cuando: inconsistencias masivas en `members`.

Acción:
1. Re-ejecutar migración en modo controlado:
   - `node scripts/multi-business/migrateLegacyMemberships.js --dry-run --limit=1000`
   - Validar resumen.
   - `node scripts/multi-business/migrateLegacyMemberships.js --limit=1000`
2. Si persiste inconsistencia, restaurar respaldo Firestore del punto previo.

## Fase 4 - Validación post-rollback

1. Ejecutar:
   - `node scripts/multi-business/reportLegacyFallback.js --limit=5000`
2. Validar manualmente:
   - login usuario con 1 negocio
   - login usuario con múltiples negocios
   - cambio de negocio
   - creación y canje de invitación

## Criterios para volver a avanzar

1. `usersNeedingFallbackRead` con tendencia estable/descendente.
2. Sin picos de `permission-denied` inesperados en funciones v2.
3. QA básico de selector + endpoints críticos en verde.
