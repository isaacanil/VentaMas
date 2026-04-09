# ANALISIS_ARQUITECTURA

Fecha: 2026-02-13
Alcance: frontend + backend (auth, sesion, user model, business model, billing)

## 1. Diagnostico del estado actual

### 1.1 Modelo actual User/Business

1. El modelo vigente es 1 usuario -> 1 negocio, con `businessID` y `role` en el documento de usuario.
2. Hay coexistencia de dos formas de usuario en Firestore:
- Campos raiz (ej. `name`, `email`, `businessID`, `role`).
- Espejo legacy dentro de `user.*` (ej. `user.name`, `user.businessID`, `user.role`).
3. El backend lee/escribe ambos formatos en rutas distintas, por lo que la consistencia depende del endpoint.
4. No existe una entidad de membresia canonica por negocio que permita roles distintos por negocio.

Referencias tecnicas observadas:
- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`
- `functions/src/app/triggers/syncUserLegacyMirror.js`
- `functions/scripts/migrateUsersToFlatSchema.js`
- `src/features/auth/userSlice.ts`
- `src/firebase/Auth/fbAuthV2/sessionClient.ts`

### 1.2 Sesion y seleccion de negocio

1. La app usa sesion propia (`sessionTokens`) ademas de Firebase Auth.
2. El frontend persiste `sessionToken`, `sessionExpires`, `sessionId`, `deviceId` y luego hidrata usuario.
3. El flujo actual de login redirige directo a `home`; no existe pantalla intermedia para elegir negocio.
4. No hay `activeBusinessId` formal en sesion backend. El contexto de negocio se infiere del usuario (1:1).

Referencias:
- `src/firebase/Auth/fbAuthV2/fbSignIn/fbSignIn.ts`
- `src/modules/auth/pages/Login/Login.tsx`
- `src/router/AppRouterLayout.tsx`
- `src/router/routes/paths/Auth.tsx`

### 1.3 Registro (Sign Up)

1. Existe UI de signup, pero el flujo publico no esta claramente integrado en rutas productivas.
2. El flujo operativo hoy parece centrado en creacion de usuarios por admin interno con `businessID` explicito.
3. Bajo el nuevo modelo SaaS, falta el flujo atomico: crear negocio + asignar owner + activar membresia inicial + definir negocio activo.

Referencias:
- `src/modules/auth/pages/SignUp/SignUpV2.tsx`
- `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`
- `src/modules/settings/pages/setting/subPage/Users/components/UserForm/UserForm.tsx`

### 1.4 Suscripciones y roles

1. El ownership de negocio existe (`owners`/`billingContact`) pero no se usa como control central de acceso por suscripcion.
2. No se detecto una capa unica que bloquee acceso por estado de suscripcion del negocio.
3. La configuracion `billingSettings` actual es de operacion interna, no un lifecycle de suscripcion SaaS.

Referencias:
- `functions/src/app/modules/business/functions/createBusiness.js`
- `scripts/migrateBusinessOwnership.js`
- `src/firebase/billing/billingSetting.ts`

### 1.5 Riesgos inmediatos

1. Inconsistencia de naming: `businessID` vs `businessId`.
2. Doble esquema (`root` + `user.*`) con sincronizacion parcial.
3. Acoplamiento transversal a `user.businessID` y `user.role` en frontend y backend.
4. Ausencia de autorizacion multi-tenant centralizada por membresia.

## 2. Propuesta de nuevo schema (SaaS multi-negocio)

Recomendacion: modelo hibrido con fuente canonica por negocio y cache ligera por usuario.

### 2.1 Entidades propuestas

1. `users/{uid}`
- Perfil global del usuario (sin rol global ni business unico).
- Cache opcional de membresias para UX rapida (`accessControl`).

2. `businesses/{businessId}`
- Datos del negocio.
- Estado SaaS y referencia de suscripcion.

3. `businesses/{businessId}/members/{uid}` (fuente canonica)
- Rol y estado del usuario dentro de ese negocio.

4. `subscriptions/{subscriptionId}` o embebido en `businesses/{businessId}.subscription`
- Estado de pago SaaS (trial/active/past_due/canceled/etc).

### 2.2 Ejemplo JSON recomendado

```json
{
  "users": {
    "uid_123": {
      "email": "user@acme.com",
      "displayName": "Ana Perez",
      "status": "active",
      "defaultBusinessId": "biz_a",
      "lastSelectedBusinessId": "biz_b",
      "accessControl": [
        {
          "businessId": "biz_a",
          "role": "owner",
          "status": "active"
        },
        {
          "businessId": "biz_b",
          "role": "admin",
          "status": "active"
        }
      ],
      "createdAt": "<timestamp>",
      "updatedAt": "<timestamp>"
    }
  }
}
```

```json
{
  "businesses": {
    "biz_a": {
      "name": "Negocio A",
      "status": "active",
      "owners": ["uid_123"],
      "billingContactUid": "uid_123",
      "subscription": {
        "plan": "pro",
        "status": "active",
        "currentPeriodEnd": "<timestamp>",
        "provider": "stripe",
        "providerRef": "sub_abc"
      },
      "createdAt": "<timestamp>",
      "updatedAt": "<timestamp>"
    }
  }
}
```

```json
{
  "businesses/biz_a/members/uid_456": {
    "uid": "uid_456",
    "email": "staff@acme.com",
    "role": "manager",
    "status": "active",
    "invitedBy": "uid_123",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

Notas de diseno:
- El rol se evalua por membresia, no en el perfil global.
- `accessControl` en `users` es denormalizado para UX; la verdad es `businesses/{id}/members/{uid}`.
- Mantener `defaultBusinessId` y `lastSelectedBusinessId` mejora login sin selector cuando aplica.

## 3. Flujo UX nuevo (Login y Business Selector)

### 3.1 Login (texto-diagrama)

1. Usuario autentica (password/social).
2. Backend valida sesion y retorna perfil base.
3. Sistema obtiene membresias activas del usuario.
4. Decision:
- Si membresias activas = 0 -> ir a onboarding (crear negocio o solicitar invitacion).
- Si membresias activas = 1 -> autoseleccionar ese negocio y entrar.
- Si membresias activas > 1 -> mostrar `Business Selector`.
5. Al seleccionar negocio:
- Validar membresia activa.
- Validar suscripcion del negocio.
- Emitir contexto activo (`activeBusinessId`, `activeRole`) para frontend y backend.
6. Navegar al home del negocio activo.

### 3.2 Regla de friccion baja

1. Si solo hay 1 negocio activo, no mostrar selector.
2. Si hay varios, recordar `lastSelectedBusinessId` y permitir autoentrada opcional cuando siga valido.

## 4. Suscripciones y roles (acceso)

### 4.1 Regla de negocio

1. La suscripcion vive en el negocio.
2. El owner gestiona pago, pero el acceso aplica a todos los miembros segun estado de suscripcion.

### 4.2 Politica recomendada de acceso

1. `subscription.status in ["active", "trialing"]`: acceso normal segun rol.
2. `past_due`: acceso limitado con banner y grace period.
3. `canceled` o `unpaid`: bloquear modulos criticos; permitir owner ir a facturacion.
4. Solo `owner` (o permiso explicito) puede ver/editar facturacion.

### 4.3 Donde validar

1. Backend: middleware central por request (`requireBusinessAccess`).
2. Frontend: guard de ruta para UX, pero no como unica barrera.
3. Token/sesion: incluir `activeBusinessId` y validar server-side en cada endpoint sensible.

## 5. Estado de registro (Sign Up) y brecha funcional

### 5.1 Estado actual

1. Registro publico no esta cerrado end-to-end en rutas/flujo principal.
2. Alta actual depende mucho de creacion de usuario por admin interno.

### 5.2 Flujo target de registro

1. Crear usuario Auth.
2. Crear `business` inicial.
3. Crear `membership` owner para ese usuario en ese negocio.
4. Inicializar `subscription` (trial u otro estado definido).
5. Guardar `defaultBusinessId/lastSelectedBusinessId`.
6. Crear sesion con `activeBusinessId` y redirigir al dashboard de onboarding.

## 6. Estrategia de migracion (Legacy vs New)

### 6.1 Enfoque recomendado: Dual Support por fases

1. Fase 0: Preparacion
- Definir schema final y contratos API.
- Introducir naming unificado (`businessId`, `role` por membership).

2. Fase 1: Escritura dual
- En altas/ediciones nuevas: escribir modelo nuevo (memberships) y mantener legacy (`businessID`,`role`) temporalmente.
- Agregar telemetria para detectar endpoints aun legacy.

3. Fase 2: Lectura dual
- Backend lee primero memberships (nuevo), fallback a legacy.
- Frontend consume endpoint de contexto activo que abstraiga ambos modelos.

4. Fase 3: Migracion historica
- Script batch para crear memberships desde usuarios legacy.
- Backfill de `owners` y `billingContactUid` donde falte.
- Validaciones post-migracion (conteo, muestreo, integridad).

5. Fase 4: Corte controlado
- Feature flag para desactivar fallback legacy por cohortes.
- Monitoreo de errores auth/autorizacion.

6. Fase 5: Cleanup
- Eliminar uso de `user.businessID`, `user.role`, `user.*` mirror.
- Retirar trigger de espejo legacy.
- Eliminar campos legacy y actualizar reglas/indexes/documentacion.

### 6.2 Script de migracion sugerido

1. Input: `users` legacy + `businesses` existentes.
2. Output:
- `businesses/{id}/members/{uid}` creados/actualizados.
- `users/{uid}.accessControl` reconstruido.
- `defaultBusinessId` definido.
3. Idempotencia: si membership existe, solo corrige diferencias.
4. Dry run + reporte CSV/JSON antes de aplicar.

## 7. To-Do tecnico priorizado

### P0 (bloqueante)

1. Disenar contrato `AuthContext` nuevo: `uid`, memberships, `activeBusinessId`, `activeRole`.
2. Crear middleware backend unico para autorizacion por membership + suscripcion.
3. Implementar `Business Selector` route + guard en frontend.
4. Definir y aplicar modelo de suscripcion por negocio.

### P1 (migracion)

1. Implementar lectura dual en auth/session endpoints.
2. Implementar escritura dual en signup/invite/user-management.
3. Crear script de backfill memberships (idempotente + dry run).
4. Agregar metricas de fallback legacy.

### P2 (hardening)

1. Normalizar naming (`businessId`) en backend/frontend.
2. Revisar todos los queries y reglas Firestore para multi-tenant.
3. Añadir tests E2E: login 1 negocio, login multi negocio, negocio sin suscripcion, owner vs admin.

### P3 (cleanup)

1. Apagar fallback legacy por feature flag.
2. Eliminar campos/trigger legacy y codigo muerto.
3. Ejecutar migracion final y checklist de rollback.

## 8. Preguntas abiertas (decisiones requeridas)

1. Politica exacta de bloqueo cuando `past_due` o `canceled`: bloqueo total o parcial por modulo?
2. Queremos permitir que un usuario cree multiples negocios desde UI o solo via owner/admin?
3. Cual es el rol minimo inicial (owner/admin/manager/staff) y su matriz de permisos por modulo?
4. Preferimos suscripcion embebida en `businesses` o coleccion dedicada `subscriptions`?
5. Se requiere soporte de "invitaciones pendientes" (usuario aun no registrado) en `members`?
6. Cual sera la ventana de convivencia legacy (semanas) antes del cleanup definitivo?

## 9. Recomendacion ejecutiva

1. Implementar Dual Support con feature flags, no big-bang.
2. Hacer primero middleware de autorizacion y Business Selector.
3. Migrar datos con script idempotente + validacion de integridad.
4. Cortar legacy solo despues de metricas estables y pruebas E2E completas.
