# Plan de Investigacion: CASL + Centralizacion de Autorizacion (Frontend)

## Estado
- Tipo: Investigacion (sin implementacion)
- Fecha: 2026-02-25
- Objetivo: revisar y definir como centralizar autorizacion con CASL sin agregar complejidad accidental

## Problema
La app mezcla varios mecanismos de autorizacion:
- checks directos por `role`
- grupos de roles (`CORE_PRIVILEGED_ROLES`, etc.)
- checks CASL (`abilities.can(...)`)
- reglas repartidas entre rutas, UI, hooks y queries

Esto genera riesgo de inconsistencias (ejemplo: ruta permite acceso pero UI no muestra herramientas).

## Objetivo de la investigacion
Definir una estrategia de centralizacion donde:
- CASL sea la fuente de verdad para autorizacion (no identidad)
- las capacidades sean semanticas (ej. billing owner-level, approval, dev access)
- loaders, UI, hooks y queries consuman helpers/predicados consistentes
- se mantenga la jerarquia real de negocio:
  - `dev > owner > admin > manager > cashier > buyer`

## No objetivo (en esta fase)
- No refactorizar todo el repo
- No cambiar backend/enforcement de funciones
- No rediseñar flujos de negocio
- No eliminar inmediatamente todos los helpers legacy

## Preguntas de investigacion (a responder antes de seguir)
1. Que reglas son de autorizacion y cuales son de identidad/UX (labels, mensajes, analytics)?
2. Que capacidades deben existir en CASL (nombre semantico) vs derivarse de `manage all`?
3. Que casos requieren distincion explicita `owner > admin`?
4. Donde mantener compatibilidad temporal con APIs legacy (`allowedRoles`, `roleGroups`)?
5. Que reglas deben ser contextuales (ej. owner por `ownerUid`) y no solo por rol activo?

## Entregables de esta investigacion
1. Matriz de capacidades por rol (`dev/owner/admin/manager/cashier/buyer`)
2. Inventario de puntos de decision de autorizacion (ruta/UI/hook/query/modal)
3. Lista de helpers CASL semanticos recomendados en `src/utils/access/*`
4. Lista de legacy a deprecar (`roleGroups`, `allowedRoles`) con estrategia de migracion
5. Plan por oleadas con riesgo/impacto por modulo

## Modulos a revisar (investigacion; no tocar aun)

### 1) Core de autorizacion / CASL
- `src/abilities/index.ts`
- `src/abilities/roles/*.ts`
- `src/hooks/abilities/useAbilities.ts`
- `src/utils/access/*` (crear/normalizar mapa de helpers)
- `src/utils/roles/roleGroups.ts` (legacy/compatibilidad)

### 2) Routing y control de acceso de rutas
- `src/router/routes/loaders/accessLoaders.ts`
- `src/router/routes/*` (meta de rutas / visibilidad / guards)
- `src/modules/auth/utils/defaultHomeRoute.ts`

### 3) Navegacion / menu / shortcuts (autorizacion UI)
- `src/utils/menuAccess.ts`
- `src/modules/home/pages/Home/CardData.tsx`
- `src/modules/navigation/components/MenuApp/**`
- `src/modules/home/**` (shortcuts / developer hub / business workspace)

### 4) Modulo de autorizaciones (PIN, aprobacion, logs)
- `src/modules/authorizations/**`
- `src/modules/settings/pages/setting/subPage/AuthorizationConfig/**`
- `src/components/modals/PinAuthorizationModal/PinAuthorizationModal.tsx`
- `src/hooks/useAuthorizationPin.ts`

### 5) Billing / owner-level / multi-business
- `src/modules/settings/pages/subscription/**`
- `src/modules/auth/pages/BusinessSelectorPage/**`
- `src/modules/home/pages/Home/components/BusinessInfoPill/**`
- `src/modules/auth/components/ClaimOwnershipModal.tsx`
- `src/modules/auth/pages/ClaimBusinessPage/**`

### 6) Ventas / descuentos / autorizacion contextual
- `src/modules/sales/**/InvoiceSummary.tsx`
- `src/modules/invoice/pages/InvoicesPage/hooks/useInvoiceEditAuthorization.tsx`
- otros modales de autorizacion contextual relacionados

### 7) Queries y restricciones por privilegio (frontend data access)
- `src/firebase/invoices/**`
- `src/firebase/accountsReceivable/**`
- `src/firebase/cashCount/**`
- cualquier hook/query que filtre por `uid` vs privilegio

## Criterios para decidir si una regla va a CASL
La regla va a CASL si:
- define quien puede hacer/ver algo (autorizacion)
- se reutiliza en mas de un lugar (ruta + UI + query + modal)
- la semantica de negocio importa (ej. owner-level vs admin)

La regla no va a CASL (o no de inmediato) si:
- solo cambia copy/label/estetica
- es telemetria o segmentacion no sensible
- es presentacion del rol para UX

## Estrategia recomendada (investigacion -> implementacion)
1. Mapear capacidades semanticas (sin tocar UI aun)
2. Validar jerarquia con negocio (owner vs admin, manager, buyer)
3. Definir helpers puros por capacidad en `src/utils/access/*`
4. Migrar por verticales (ruta + UI + hook + query del mismo flujo)
5. Mantener compatibilidad temporal donde exista API legacy

## Riesgos a vigilar
- Falsos positivos por `can('manage', 'all')` en capacidades de tipo "restriccion"
- Mezclar rol activo con ownership contextual (`ownerUid`)
- Inconsistencias entre HMR/estado de abilities en logout/login
- Cambios de comportamiento silenciosos en flujos sensibles (billing, cash count, PIN)

## Smoke checks minimos despues de cada oleada (cuando se implemente)
1. Cambio de sesion `cashier -> dev` sin reload mantiene tools correctas
2. `cashier` requiere PIN para descuento; `admin/owner/dev` no
3. `manager` puede aprobar autorizaciones si aplica, pero no billing owner-level
4. `owner` puede gestionar suscripcion y crear negocio bajo cuota; `admin` no
5. Menus/rutas/queries muestran el mismo comportamiento para el mismo usuario

## Siguiente paso propuesto (solo investigacion)
Crear la matriz de capacidades por rol y marcar cada modulo anterior con:
- `listo` (ya bastante centralizado)
- `parcial` (mezcla CASL + role legacy)
- `legacy` (predomina role/group checks)

Esto permite priorizar la siguiente oleada sin romper flujos.
