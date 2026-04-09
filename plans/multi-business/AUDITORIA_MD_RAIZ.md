# AUDITORIA_MD_RAIZ

Fecha: 2026-02-14
Objetivo: revisar documentos `.md` originalmente en raiz relacionados con rol, multi-negocio y suscripcion.

## Documentos revisados

- `plans/multi-business/ANALISIS_ARQUITECTURA.md`
- `plans/multi-business/PLANES_TIERED_PRICING.md`
- `plans/multi-business/ROLES_AND_PERMISSIONS_AUDIT.md`
- `plans/multi-business/CURRENT_SESSION_FLOW.md`

## Hallazgos clave

### 1) Coherencia general

- La direccion estrategica es consistente:
  - Multi-negocio con memberships.
  - Suscripcion asociada a negocio.
  - Necesidad de dual support legacy->new.

### 2) Planes y pricing

- El documento de planes ya incorpora:
  - `demo/basic/plus/pro`.
  - Ajustes locales confirmados:
    - AR desde `basic`.
    - `plus` con 15,000 facturas/mes.
- Falta conectar formalmente enforcement con middleware/backend.

### 3) Roles y permisos

- Existe desalineacion front/back de catalogo de roles (auditado).
- No hay aun fuente unica de verdad para autorizacion por rol en backend.

### 4) Sesion y auth

- El flujo de sesion actual esta bien documentado.
- Falta cerrar el contrato final de `activeBusinessId` + enforcement transversal server-side.

## Gaps no cubiertos en MD base (pendientes)

- Flujo formal de invitacion por codigo de un solo uso.
- Manejo de expiracion/revocacion/reuso de codigo.
- Politica cuando usuario ya pertenece al negocio y recibe nueva invitacion.
- Auditoria tecnica del alta automatica a `owner` al crear negocio bajo modelo nuevo.

## Accion tomada en carpeta `plans/multi-business/`

- `plans/multi-business/HECHO.md`: resumen de lo ya avanzado y decisiones cerradas.
- `plans/multi-business/PENDIENTE_TASKLIST.md`: backlog priorizado para terminar migracion y nuevo flujo de acceso.
