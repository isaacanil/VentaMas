# Investigación: Centralización de Guards en React Router (pre-render)

## Objetivo

Identificar qué validaciones deberían ocurrir en el `protectedRouteLoader` (antes de renderizar) y qué casos de la app todavía están resolviendo acceso dentro del componente.

## Estado actual (resumen)

- La app ya usa un guard central para rutas privadas:
  - `src/router/index.tsx` -> `loader: protectedRouteLoader`
  - `src/router/routes/loaders/accessLoaders.ts`
- También existe protección adicional en componentes (`<Navigate />`, `useEffect + navigate`) para algunos casos de permisos/contexto.
- Esto evita accesos indebidos, pero introduce duplicación y flashes potenciales de UI.

## Cambio aplicado en esta iteración

Se introdujo metadata de ruta `requiresDevAccess`, `requiresManageAllAccess` y `requiredCapabilities` (en `AppRoute`) y se integró al `protectedRouteLoader`.

### Rutas migradas a metadata `requiresDevAccess`

- `Developer Hub` (`src/router/routes/paths/Basic.tsx`)
- `BusinessControl` (`src/router/routes/paths/Dev.tsx`)
- `AI Business Seeding` (`src/router/routes/paths/Dev.tsx`)
- `Subscription Maintenance (Developer)` (`src/router/routes/paths/Dev.tsx`)
- `FiscalReceiptsAudit` (`src/router/routes/paths/Dev.tsx`)
- `InvoiceV2Recovery` (`src/router/routes/paths/Dev.tsx`)
- `BSeriesInvoices` (`src/router/routes/paths/Dev.tsx`)
- `TestPlayground` (`src/router/routes/paths/Dev.tsx`)

### Rutas migradas a metadata `requiresManageAllAccess`

- `AccountReceivableAudit` (`src/router/routes/paths/AccountReceivable.tsx`)
  - Usa CASL `manage all` (`admin/owner/dev`) en el guard central, sin roles hardcodeados en la ruta.

### Rutas migradas a metadata `requiredCapabilities`

- `Authorizations` (`src/router/routes/paths/Authorizations.tsx`)
  - Usa `requiredCapabilities` con modo `any` para acceso por CASL:
    - `authorizationPinSelfGenerate`
    - `authorizationApprove`
    - `authorizationRequestsView`
  - Esto permite que el guard central y el menú autoricen la ruta por capacidad, aunque no exista regla `access` explícita por path.

### Beneficio

- La validación ocurre antes de pintar la pantalla (loader + `redirect(...)`).
- Se reduce lógica de permisos dentro del componente.
- El menú puede alinearse con metadata de ruta para evitar mostrar enlaces que terminarían en redirect.

## Casos que todavía usan validación dentro del componente (candidatos a migrar)

### 1) `AccountSubscriptionPage` (redirect por modo developerOnly) [Revisado / cleanup aplicado]

- Archivo: `src/modules/settings/pages/subscription/AccountSubscriptionPage.tsx`
- Estado actual:
  - La ruta developer-only ya está protegida por metadata `requiresDevAccess` + `protectedRouteLoader`.
  - Se removió el redirect local duplicado dentro del componente.
- Pendiente futuro (opcional):
  - modelar un capability específico de mantenimiento de billing si la regla deja de ser estrictamente dev-only.

### 2) `InvoiceV2Recovery` (dev access en `useEffect`) [Migrado]

- Archivo: `src/modules/dev/pages/DevTools/InvoiceV2Recovery/InvoiceV2Recovery.tsx`
- Patrón actual:
  - espera abilities
  - valida `abilities.can('developerAccess', 'all')`
  - redirige con `navigate('/home')` desde `useEffect`
- Riesgo:
  - render parcial/spinner antes de redirigir
  - duplicación con acceso por ruta
- Oportunidad:
  - mover acceso base a loader central (`requiresDevAccess`)
  - dejar en componente solo permisos finos si depende de datos cargados

### 3) `FiscalReceiptsAudit` (dev access en `useEffect`) [Migrado]

- Archivo: `src/modules/dev/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit.tsx`
- Patrón actual:
  - valida en componente con `abilities`
  - muestra warning + `navigate('/home')`
- Oportunidad:
  - igual que `InvoiceV2Recovery`: guard central para acceso base
  - componente solo para validaciones operativas/filtros

### 4) `RequireBusinessContext` (redirección con `useEffect`) [Revisado]

- Archivo: `src/modules/auth/components/RequireBusinessContext.tsx`
- Patrón actual:
  - resuelve negocio activo / selector / auto-selección dentro de componente
  - navega con `useEffect`
- Observación:
  - parte de esta lógica ya existe en `protectedRouteLoader` (`accessLoaders.ts`)
- Estado actual:
  - Se marcó como `@deprecated`.
  - La lógica principal de resolución/redirección de contexto ya vive en `protectedRouteLoader`.
  - La búsqueda en `src/` no mostró usos actuales (quedó como compat/legacy).

### 5) `RequireAuth` (componente) vs `protectedRouteLoader` (loader)

- Archivo: `src/modules/auth/components/RequireAuth.tsx`
- Patrón actual:
  - rutas privadas ya pasan por `protectedRouteLoader`
  - además `processRoute()` envuelve con `RequireAuth`
- Oportunidad:
  - evaluar si sigue siendo necesaria la doble protección
  - si se mantiene, documentar claramente el rol de cada capa:
    - loader: redirect pre-render + business context
    - componente: fallback defensivo si el store cambia después

### 6) Redirects de UX en componente (no necesariamente “guards”)

- Ejemplo: `Home` redirige dev -> `DeveloperHub`
  - Archivo: `src/modules/home/pages/Home/Home.tsx`
- Nota:
  - esto puede quedarse en componente si es UX condicional
  - pero si se quiere cero duplicación, mover a loader por metadata o regla central (parte ya existe en `protectedRouteLoader`)

## Qué más podemos validar en el guard central (antes de renderizar)

Estas validaciones son buenas candidatas para loaders/metadata porque previenen flashes y centralizan reglas:

1. `requiresAuth`
- Ya existe implícitamente en `protectedRouteLoader` para todas las rutas privadas.

2. `requiresDevAccess`
- Implementado en esta iteración.

3. `requiresBusinessContext`
- Redirigir al selector de negocio o autoseleccionar antes de render.
- Gran parte ya está en `protectedRouteLoader`; se puede formalizar como metadata.

4. `requiresManageAllAccess`
- Implementado (CASL `manage all` -> `admin/owner/dev`)
- Útil para pantallas privilegiadas donde no entra `cashier/manager`

5. `requiresOwnerOrDev`
- Útil para pantallas owner-level (ej. billing/suscripción de cuenta).
- Evita checks duplicados en páginas de suscripción/configuración.

6. `requiresCapability`
- Metadata genérica basada en CASL/capability (ej. `billingAccountManage`, `businessOwnershipClaimIssue`)
- Requiere resolver abilities/capacidades en loader de forma segura (sin hooks).

   Estado: ya existe implementación inicial como `requiredCapabilities` + `requiredCapabilitiesMode` en `AppRoute`, con evaluación central en loader y filtrado de menú.

7. `requiresFeatureFlag`
- Mostrar/ocultar acceso por feature flag sin montar la pantalla.
- Puede leer env/config/Remote Config cacheado.

8. `requiresQueryParams`
- Validar params obligatorios (ej. `businessId`, `invoiceId`) y redirigir o devolver `400` amigable.

9. `requiresEntity`
- Validar existencia/estado de una entidad antes de render (404/403 tempranos).
- Recomendado para pantallas que dependen 100% de un ID.

10. `requiresSubscriptionState`
- Evitar pintar pantallas que dependen de suscripción activa si el negocio está bloqueado.
- Podría centralizar políticas hoy dispersas.

## Propuesta de diseño (siguiente paso)

### Opción recomendada (incremental, baja complejidad accidental)

Mantener `protectedRouteLoader` único y agregar metadata explícita de acceso en `AppRoute`:

- `requiresDevAccess?: boolean`
- `requiresBusinessContext?: boolean` (o `skipBusinessContextGuard?: boolean`)
- `requiresManageAllAccess?: boolean`
- `requiresOwnerOrDev?: boolean`
- `requiredCapabilities?: string[]` (etapa posterior)

Luego el loader aplica validaciones en orden:

1. Auth
2. Redirects globales (`/home` -> `/developer-hub` para dev, etc.)
3. Metadata de acceso (`requiresDevAccess`, etc.)
4. Contexto de negocio
5. Redirects canónicos / query manager

## Riesgos / consideraciones

- `getRouteMeta(pathname)` hoy funciona por coincidencia exacta de `path`.
  - Para rutas dinámicas futuras (`/x/:id`) puede requerir usar matching del router o `matchRoutes`.
- No todas las reglas deben ir al loader:
  - validaciones dependientes de data muy específica de la pantalla pueden quedarse en el componente/loader propio.
- El backend sigue siendo la autoridad final en acciones sensibles.

## Nota sobre lint (bloqueos / lentitud)

Se detectó que la mayor parte de la lentitud del lint venía del modo TypeScript type-aware (`typescript-eslint` con `projectService: true`) en lint puntual por archivo.

### Ajuste aplicado

- `eslint.config.js`
  - Lint normal (por defecto): usa reglas TS no type-aware (`projectService: false`)
  - Lint type-aware: queda opt-in con `ESLINT_TYPED=true`
- `package.json`
  - script nuevo: `lint:path:typed`

### Uso recomendado

- Validación rápida de cambios locales:
  - `npm run lint:path -- <archivo>`
- Validación estricta puntual (cuando haga falta):
  - `npm run lint:path:typed -- <archivo>`

## Checklist de migración sugerido (prioridad)

1. Revisar otros DevTools y migrar los que aún validan permisos en componente (ya migrados: `InvoiceV2Recovery`, `FiscalReceiptsAudit`; además se cerraron `BSeriesInvoices` y `TestPlayground` con `requiresDevAccess`)
2. Revisar `AccountSubscriptionPage` y mover el redirect `developerOnly` al guard central/meta de ruta
3. Auditar `RequireBusinessContext` vs `protectedRouteLoader` para eliminar duplicidad
4. Diseñar metadata owner-level/capabilities (`requiresOwnerOrDev`, `requiredCapabilities`) [Parcial]
   - `requiredCapabilities` ya está implementado (loader + menú)
   - pendiente: expandir rutas owner-level/contextuales (`billingAccountManage`, etc.) con metadata/política adecuada
