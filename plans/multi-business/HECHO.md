# HECHO

Fecha corte: 2026-02-14
Estado: trabajo en progreso (base implementada + documentacion inicial)

## 1) Documentacion ya creada en raiz (relacionada al cambio)

- `ANALISIS_ARQUITECTURA.md`
- `PLANES_TIERED_PRICING.md`
- `ROLES_AND_PERMISSIONS_AUDIT.md`
- `CURRENT_SESSION_FLOW.md`

## 2) Definiciones funcionales cerradas en esta conversacion

- Modelo SaaS multi-negocio con roles por negocio.
- Planes tiered:
  - `demo`, `basic`, `plus`, `pro`, y estrategia `legacy`.
  - Ajuste confirmado: Cuentas por Cobrar desde `basic`.
  - Ajuste confirmado: `plus.maxMonthlyInvoices = 15000`.
- UX de selector de negocio:
  - Si 1 negocio: paso directo.
  - Si varios negocios: selector intermedio.
  - Boton de "Cambiar negocio" en navegacion.
- Soporte para pruebas de developer:
  - Acceso a `/hub` desde menu/shortcuts de dev.

## 3) Cambios tecnicos realizados (codigo)

- Tipos base para modelo nuevo:
  - `src/types/models.ts`
  - Incluye `PlanTier`, `User`, `Membership`, `Business`, `BusinessSubscription`.
- Adaptador de compatibilidad auth legacy/nuevo:
  - `src/utils/auth-adapter.ts`
  - Normaliza `accessControl`, `availableBusinesses`, `activeBusinessId`.
- Utilidades de contexto de negocio:
  - `src/modules/auth/utils/businessContext.ts`
- UI de seleccion de negocio:
  - `src/modules/auth/pages/BusinessSelectorPage/BusinessSelectorPage.tsx`
- Guard de rutas con contexto de negocio:
  - `src/modules/auth/components/RequireBusinessContext.tsx`
- Integracion en router:
  - `src/router/routes/routesName.ts`
  - `src/router/routes/paths/Auth.tsx`
  - `src/router/routes/requiereAuthProvider.tsx`
- Boton "Cambiar negocio" en navbar:
  - `src/modules/navigation/components/MenuApp/MenuApp.tsx`
- Atajos dev para abrir selector:
  - `src/modules/navigation/components/MenuApp/MenuData/items/developer.tsx`
  - `src/constants/devtools/developerShortcuts.tsx`
- Modal de sesion (home) redisenado con boton a selector:
  - `src/modules/home/pages/Home/components/PersonalizedGreeting/components/SessionInfoModal.tsx`
- Mejora UX nombre vs ID:
  - Mostrar nombre de negocio por defecto.
  - Mostrar `businessId` solo para usuarios `dev`.
- Backend v2 (inicio TaskList P0/P1):
  - `functions/src/app/versions/v2/auth/controllers/businessContext.controller.js`
    - Callable `clientSelectActiveBusiness`
  - `functions/src/app/versions/v2/auth/controllers/businessInvites.controller.js`
    - Callable `createBusinessInvite`
    - Callable `redeemBusinessInvite`
  - Exportes agregados en `functions/src/index.js`

## 4) Decisiones de negocio registradas

- Al crear negocio nuevo: el creador queda como `owner`.
- El acceso de otros usuarios al negocio objetivo se maneja con rol definido por admin/owner de ese negocio.
- Invitacion por codigo de un solo uso iniciada en backend (creacion y canje base implementados).
- Si un usuario ya pertenece al negocio, el canje retorna `already-member` y no consume el codigo.

## 5) Conversacion resumida (contexto operativo)

- Se evoluciono de modelo legacy 1:1 (`businessID`, `role`) a modelo multi-tenant con membresias.
- Se avanzo de definicion de arquitectura a UX real en frontend.
- Se detecto necesidad de onboarding/control de acceso entre negocios (invitaciones).
- Se pidio dejar trazabilidad y tasklist en carpeta `plans/multi-business/`.
