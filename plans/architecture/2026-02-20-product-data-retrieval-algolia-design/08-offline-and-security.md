# Offline y Seguridad Multi-tenant

## Offline
- Algolia requiere conectividad.
- Estrategia:
  - online: Algolia como primario,
  - offline/error de red: fallback a Firestore cache + cache local de últimas búsquedas.
- En barcode:
  - intentar resolver desde cache/fallback,
  - si no hay dato local, mostrar bloqueo explícito.

## Seguridad de llaves
- No exponer Admin API key.
- Emitir secured API key temporal por sesión desde backend:
  - filtro obligatorio `businessID:{actual}`,
  - `validUntil` corto,
  - restricción de índices permitidos.

## Aislamiento por negocio
- El cliente solo puede consultar su negocio aunque manipule UI.
- Validación de negocio autorizada en backend (Firebase Auth + claims/rol).
