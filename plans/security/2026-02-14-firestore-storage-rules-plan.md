# Plan Firestore + Storage Rules

Fecha: 2026-02-14  
Estado: listo para ejecutar (faseado)  
Objetivo: salir de reglas abiertas (`allow read, write: if true`) sin romper operación multi-negocio.

## 1) Contexto actual y riesgo

- Hoy Firestore y Storage están totalmente abiertos.
- Eso permite lectura/escritura cross-tenant, borrado de archivos y escalamiento de privilegios.
- En este repo ya existe contrato de membresía canónico:
  - `businesses/{businessId}/members/{uid}`
- También existe fallback legacy en:
  - `users/{uid}.accessControl`, `users/{uid}.memberships`, `businessID/businessId`.

## 2) Estrategia recomendada (por fases)

### Fase A - Contención inmediata (hoy)

1. Crear/guardar reglas en repo:
   - `firestore.rules`
   - `storage.rules`
2. Aplicar aislamiento por tenant:
   - Firestore: acceso a `businesses/{businessId}/**` solo si hay membresía activa.
   - Storage: acceso a `businesses/{businessId}/**` solo si hay membresía activa.
3. Proteger colecciones sensibles:
   - `members`, `settings`, `counters` con rol alto (`owner/admin/dev` o `dev` global).
4. Mantener `app-config/login-image` con lectura pública (login sin sesión).

### Fase B - Validación funcional (antes de prod)

1. Probar en entorno real controlado (staging/prod con cuentas de prueba) con casos mínimos:
   - usuario miembro activo (lectura/escritura en su negocio),
   - usuario de otro negocio (denegado),
   - usuario sin membresía (denegado),
   - usuario `dev` (acceso global).
2. Verificar rutas críticas:
   - facturación V2,
   - CxC,
   - inventario/caja,
   - selector de negocio/invitaciones.

### Fase C - Endurecimiento fino (siguiente iteración P4)

1. Reemplazar regla genérica de write en `businesses/{businessId}/**` por matriz por módulo/rol.
2. Restringir más `users/{uid}` para evitar cambios directos de campos privilegiados.
3. Mover/remediar rutas legacy de Storage (por ejemplo `purchase/**`) hacia namespace por negocio.

## 3) Entregables creados en esta iteración

- Reglas base:
  - `firestore.rules`
  - `storage.rules`
- Este plan:
  - `plans/security/2026-02-14-firestore-storage-rules-plan.md`

## 4) Mapa mínimo de paths cubiertos

### Firestore

- `businesses/{businessId}` y subcolecciones:
  - `members`
  - `settings`
  - `counters`
  - resto de subcolecciones con aislamiento por membresía activa.
- Colecciones globales:
  - `users`
  - `sessionTokens`
  - `sessionLogs`
  - `businessInvites`
  - `app`
  - `changelogs`
  - `errors`
  - `rncData`
  - `productOutflow`
  - `creditLimit`

### Storage

- `businesses/{businessId}/**` (tenant-scoped)
- `reports/stock-digest/{businessId}/**` (tenant read + global write)
- `app-config/login-image/**` (read público, write global)
- `purchase/**` (legacy, restringido a global)

## 5) Comandos de validación y despliegue

### Variables (PowerShell)

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:/Dev/keys/VentaMas/ventamaxpos-firebase-adminsdk-r55lp-41498ebe9e.json"
```

### Validar sintaxis con Firebase MCP (si está disponible)

- Firestore: validar `firestore.rules`
- Storage: validar `storage.rules`

### Deploy controlado

```powershell
firebase deploy --only firestore:rules
firebase deploy --only storage
```

## 6) Checklist de go-live

- [x] Deploy de reglas ejecutado en `ventamaxpos` (2026-02-15).
- [ ] Login funciona con imagen de fondo en `app-config/login-image`.
- [ ] Usuario de negocio A no lee/escribe datos de negocio B.
- [ ] Endpoints v2 críticos siguen operando para miembros activos.
- [ ] Invitaciones por código siguen creando membresía canónica.
- [ ] Subidas y lecturas de archivos por negocio funcionan.
- [ ] Logs sin picos de `permission-denied` inesperados.

## 7) Rollback rápido

Si hay corte operativo:

1. Revertir a reglas previas en consola (snapshot guardado).
2. Ajustar rule conflictivo y validar nuevamente en entorno real controlado.
3. Re-desplegar solo el producto afectado:
   - `firebase deploy --only firestore:rules` o
   - `firebase deploy --only storage`

## 8) Nota importante

Estas reglas son una **base de contención** para cerrar exposición inmediata.  
El siguiente paso es una matriz por módulo/rol (P4) para reducir permisos de escritura en subcolecciones específicas.
