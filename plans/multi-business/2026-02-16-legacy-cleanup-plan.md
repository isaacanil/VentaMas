# Plan Cleanup Legacy - `businessID` / `role` / `user.*`

Fecha: 2026-02-16  
Estado: iniciado (fase de preparación completada)

## Objetivo

Eliminar gradualmente dependencia de campos legacy en `users/{uid}`:

- `businessID`, `businessId`
- `role`, `activeRole`
- espejo `user.businessID`, `user.businessId`, `user.role`, `user.activeRole`

sin romper login, permisos, listeners ni selects por negocio.

## Línea base verificada (producción)

Auditoría real con key de servicio (read-only):

- Script: `functions/scripts/auditLegacyCleanupReadiness.js`
- Resultado final:
  - `scannedUsers: 152`
  - `usersWithBusinessReference: 151`
  - `usersWithAnyCanonicalMembership: 151`
  - `usersWithFullCanonicalCoverage: 151`
  - `usersWithDanglingBusinessReferences: 0`
  - `usersWithMembershipCache: 151`
  - `usersReadyByData: 151`
  - `usersNotReadyByData: 0`

## Acciones ejecutadas en esta fase

1. Se creó auditor de readiness:
   - `functions/scripts/auditLegacyCleanupReadiness.js`
2. Se corrigió referencia colgante a negocio eliminado:
   - `users/AWF6tNpoxn`: `businessID` y `user.businessID` limpiados.
3. Se creó y ejecutó backfill de cache desde membresías canónicas:
   - `functions/scripts/backfillUserMembershipCacheFromCanonical.js`
   - ejecución `--write`: `usersPatched: 151`
4. Se redujo dependencia backend de `businessID/role` legacy en auth:
   - `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`
   - ahora también considera `activeBusinessId/activeRole`.
5. Se migró flujo PIN backend a membresías canónicas:
   - `functions/src/app/versions/v2/auth/controllers/pin.controller.js`
   - `functions/src/app/versions/v2/auth/pin/pin.users.js`
   - `functions/src/app/versions/v2/auth/pin/pin.utils.js`
   - se reemplazaron consultas por `user.businessID` por resolución de miembros activos en `businesses/{businessId}/members/{uid}`.
6. Se ejecutó cleanup masivo fase 1 en producción:
   - Script: `functions/scripts/cleanupLegacyBusinessRoleFields.js`
   - `dry-run`: `matched: 152`
   - `write`: `patched: 152`
   - validación post-write (`dry-run`): `matched: 0`, `skipReasons.no-legacy-fields: 152`.

## Hallazgo crítico (bloqueador de borrado masivo hoy)

Aunque los datos están listos, el **código todavía consume** `businessID`/`role`
en múltiples áreas (frontend y algunos controladores v2).

Conclusión:

- **No ejecutar aún borrado masivo** de `businessID/role` o `user.*` espejo.
- Primero completar cutover de lectura a `activeBusinessId` + membresías.

## Fases siguientes

### Fase 1 - Cutover de lectura (código)

- Backend:
  - reemplazar lecturas directas de `businessID/role` por:
    - membresía canónica (`businesses/{businessId}/members/{uid}`)
    - fallback controlado a `activeBusinessId/activeRole` mientras dure transición.
- Frontend:
  - centralizar uso de contexto en `normalizeCurrentUserContext`.
  - evitar dependencia directa de `user.businessID` donde sea posible.

### Fase 2 - Congelar escritura legacy

- Configurar:
  - `MULTIBUSINESS_DUAL_WRITE_CANONICAL=true`
  - `MULTIBUSINESS_DUAL_WRITE_LEGACY=false`
- Mantener ventana de observación con métricas.

### Fase 3 - Cleanup por lotes (dry-run -> write)

- Primera ola (completada):
  - limpiado `businessID`, `businessId`, `role`, `user.businessID`, `user.businessId`, `user.role`.
  - preservado `activeBusinessId`/`activeRole` para compatibilidad.
- Segunda ola (pendiente):
  - retirar `activeRole`/`user.activeRole` tras corte total de consumidores.
  - evaluar reducción final de nodo `user.*` si no hay dependencias.

### Fase 4 - Cierre

- Retirar fallback legacy en reglas/backend.
- Desactivar/eliminar trigger `syncUserLegacyMirror` cuando ya no sea necesario.

## Comandos de referencia

```bash
# Auditoría readiness (read-only)
node functions/scripts/auditLegacyCleanupReadiness.js --limit 5000

# Backfill cache desde canonical (primero dry-run)
node functions/scripts/backfillUserMembershipCacheFromCanonical.js --dry-run --limit 5000
node functions/scripts/backfillUserMembershipCacheFromCanonical.js --write --limit 5000
```
