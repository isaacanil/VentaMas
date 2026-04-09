# Plan de Investigacion: React Router DOM (Uso Avanzado + Centralizacion)

## Estado
- Tipo: Investigacion (sin implementacion)
- Fecha: 2026-02-25
- Objetivo: evaluar si estamos usando React Router al maximo, identificar malas practicas y definir una estrategia de mejora incremental

## Problema
Actualmente usamos React Router (incluyendo loaders en algunos flujos), pero el control de acceso, redirects, pending UI y metadata de rutas puede estar disperso entre:
- loaders
- componentes de pagina
- menus / shortcuts
- utilidades de visibilidad

Esto puede producir:
- duplicacion de reglas
- inconsistencias de navegacion
- complejidad accidental
- subuso de capacidades del Data Router

## Objetivo de la investigacion
Responder con evidencia:
- que caracteristicas de React Router ya estamos usando bien
- que caracteristicas estamos subutilizando o no usando
- donde hay anti-patrones / malas practicas de routing
- como centralizar responsabilidades (routing, acceso, metadata, loading/error) sin refactor masivo

## No objetivo (en esta fase)
- Reescribir toda la configuracion de rutas
- Migrar todo a un patron nuevo de una sola vez
- Cambiar UX de navegacion sin necesidad
- Implementar SSR/Remix-like architecture si no aplica al proyecto

## Preguntas de investigacion (a responder)
1. Estamos usando realmente el Data Router (loaders/actions/error boundaries) de forma consistente o solo parcial?
2. Donde se decide el acceso a rutas y se repite en UI/menus?
3. Tenemos metadata de rutas centralizada (`handle`, route meta, visibilidad, permisos)?
4. Como manejamos estados de navegacion (`useNavigation`) y revalidaciones?
5. Estamos usando `useFetcher`/`fetcher.Form` donde ayudaria a evitar acoplar UI a navegacion?
6. Tenemos patrones correctos para redirects (loader vs componente)?
7. Que codigo de routing esta haciendo trabajo que deberia vivir en utilidades/metadatos?
8. Que features nuevas o utiles de React Router deberiamos evaluar para este repo?

## Entregables de esta investigacion
1. Inventario de uso actual de React Router por feature
2. Mapa de responsabilidades (ruta, acceso, visibilidad, redirect, loading, error)
3. Lista de anti-patrones / smells con ejemplos concretos
4. Lista priorizada de mejoras (quick wins vs cambios estructurales)
5. Plan por oleadas para adoptar features sin romper flujos

## Modulos / archivos a revisar (investigacion; no tocar aun)

### 1) Configuracion principal de rutas
- `src/router/**`
- `src/router/routes/**`
- `src/router/routes/loaders/**`
- `src/router/routes/paths/**`

### 2) Metadata / visibilidad / menu routing
- `src/router/routes/routeVisibility*`
- `src/utils/menuAccess.ts`
- `src/modules/navigation/**`
- `src/modules/home/pages/Home/CardData.tsx`

### 3) Redirects y home routing
- `src/modules/auth/utils/defaultHomeRoute.ts`
- `src/modules/auth/**` (login, business selector, claim flows)
- `src/modules/home/**` (home/dev hub routing decisions)

### 4) Error handling y boundaries
- `src/modules/app/pages/ErrorElement/**`
- `errorElement` definidos en rutas (si aplica)
- manejo de errores en loaders vs componentes

### 5) Search params / estado en URL
- pantallas con `useSearchParams` (authorizations, invoices, sales, etc.)
- patrones de sincronizacion URL <-> estado local
- riesgos de loops o estado derivado duplicado

### 6) Navegacion global / listeners
- `src/router/GlobalListeners.tsx`
- patrones de side effects asociados a route change

## Checklist de features React Router a evaluar (potencial de la libreria)

### A) Data Router (base)
- `loader`
- `action`
- `redirect`
- `useLoaderData`
- `useActionData`
- `errorElement`
- `useRouteError`
- `defer` / streaming (si aporta)
- `shouldRevalidate`

### B) UX de navegacion y estado
- `useNavigation` (pending global y por ruta)
- `NavLink` avanzado (`isActive`, `isPending`)
- `ScrollRestoration` (si aplica en SPA)
- `useFetcher` / `fetcher.Form` para acciones sin navegar
- `useRevalidator` para refrescos controlados

### C) Composicion y centralizacion
- `handle` para metadata de rutas (titulos, permisos, breadcrumbs, visibilidad)
- `lazy` route modules para code splitting por ruta
- route-level guards centralizados (en loaders/meta) en lugar de checks repartidos
- helper unico para redirects por acceso/contexto

### D) Calidad y robustez
- validacion de params/search params
- consistencia loader/component para auth y business context
- cancelacion/race handling de loaders
- pruebas de rutas/redirects/acceso

## Posibles malas practicas a buscar (smells)
- redirects desde componente cuando deberian ocurrir en loader (y viceversa)
- checks de acceso duplicados en loader + pagina + menu sin fuente unica
- estado de URL duplicado en `useState` sin necesidad
- `useEffect` para sincronizar derivaciones que podrian resolverse por render o loader
- pantallas que hacen fetch manual cuando el loader seria mas claro
- metadata de rutas repartida en varias utilidades no conectadas
- rutas sin boundary de error donde el flujo lo requiere

## Propuesta de centralizacion (hipotesis a validar, no implementar aun)
1. Definir metadata por ruta (titulo, visibilidad, permisos/capacidades, breadcrumbs)
2. Resolver acceso principal en loaders (redirects) usando helpers CASL
3. Hacer que menu/shortcuts lean esa metadata + abilities en vez de reglas duplicadas
4. Estandarizar pending/error UX con `useNavigation` + `errorElement`
5. Usar `useFetcher` para acciones UI que no deben cambiar de ruta

## Criterios de priorizacion (para futuras oleadas)
Prioridad alta:
- inconsistencias de acceso
- redirects duplicados o conflictivos
- errores de routing que afectan login/home/business context

Prioridad media:
- centralizacion de metadata
- pending UI/revalidation
- search params patterns

Prioridad baja:
- optimizaciones avanzadas (`defer`, streaming) si el beneficio real es bajo

## Riesgos a vigilar
- refactor grande del arbol de rutas con regresiones silenciosas
- mover logica de negocio al router por error
- sobrecentralizar y volver dificil leer la ruta local
- mezclar responsabilidad de autorizacion (CASL) con navegacion sin boundaries claros

## Smoke checks minimos (cuando se implemente)
1. Login -> home correcto por rol/capacidad y contexto de negocio
2. Logout/login sin reload mantiene redirects y menus consistentes
3. Rutas protegidas redirigen igual desde URL directa y navegacion interna
4. Menus/shortcuts no muestran rutas inaccesibles
5. Errores de loaders muestran boundary adecuado
6. Search params mantienen estado esperado al refrescar/compartir URL

## Siguiente paso propuesto (solo investigacion)
Armar un inventario por feature de React Router con este formato:
- Feature
- Se usa? (`si/parcial/no`)
- Donde
- Problema observado (si aplica)
- Oportunidad / recomendacion

Esto permite medir con precision "que tan al maximo" estamos usando la libreria antes de decidir cambios.
