# PENDIENTE_TASKLIST - React Router Adoption

Fecha corte: 2026-02-26
Objetivo: reducir lógica manual de enrutado/redirecciones/metadata y adoptar capacidades nativas de React Router de forma incremental, segura y sin romper la UX actual.

## P0 - Diagnostico y baseline (hecho)

- [x] Auditar uso actual de React Router en el proyecto (router, loaders, redirecciones, errores, navegación, menú).
- [x] Identificar features subutilizadas de alto impacto (`handle`, `useMatches`, `actions`, `fetcher`, `index routes`, `shouldRevalidate`, `defer/Await`).
- [x] Confirmar baseline actual: alto uso de rutas + bajo uso de Data Router (loaders limitados, sin `action`, sin `fetcher`).
- [x] Documentar oportunidades concretas por archivo (`routeVisibility`, `Seo`, `GeneralConfig`, `UserAdmin`, `routePreloaders`, `MenuLink`).
- [x] Crear tasklist por fases para ejecución incremental.

## P1 - Metadata de rutas con `handle` + `useMatches`

- [x] Definir contrato de `handle` para metadata de ruta (title, metaDescription, flags de acceso/menú, breadcrumbs opcionales).
- [x] Migrar metadata básica (`title`, `metaDescription`) desde `AppRoute` a `handle` sin romper compatibilidad temporal.
- [x] Refactor `src/Seo/Seo.tsx` para usar `useMatches()` en vez de lookup manual por `pathname`.
- [ ] Evaluar reemplazo gradual de `routeVisibility.getRouteMeta()` por lectura desde matches/route config (sin map global por path).
- [x] Mantener fallback de SEO para rutas sin metadata.

## P2 - Tipado de rutas alineado a React Router (`RouteObject`)

- [x] Ajustar `AppRoute` para extender/componer `RouteObject` y tipar `loader/action/errorElement/handle/id/index/lazy`.
- [x] Agregar `id` a rutas/layouts clave para habilitar `useRouteLoaderData` y acceso cruzado entre rutas.
- [x] Eliminar dependencias de `[key: string]: unknown` donde se pueda reemplazar por tipos explícitos.
- [x] Validar que `processRoutes` y `filterRoutes` sigan funcionando con el nuevo contrato de rutas.

## P3 - Redirecciones declarativas y nested routes (menos `useEffect(navigate)`)

- [x] Migrar redirects de rutas base a `index` routes + `loader` (ej. `general-config`).
- [x] Revisar `UserAdmin` y mover lógica de fallback/landing a rutas hijas (`index`) o loader de layout cuando sea posible.
- [x] Reducir redirects post-render en componentes (`useEffect + navigate`) que realmente son reglas de routing.
- [ ] Verificar que no haya flicker visual al pasar redirects al router.

## P4 - Data Router para mutaciones (piloto con `action` / `useFetcher`)

- [ ] Seleccionar módulo piloto (recomendado: `Users` o `GeneralConfig`) para introducir `action` y `useFetcher`.
- [ ] Implementar un flujo no crítico con submit vía `fetcher.submit` (manteniendo UI AntD).
- [ ] Manejar `pending/error/success` con estado de `fetcher` en vez de estado manual local.
- [ ] Evaluar necesidad de `shouldRevalidate` para evitar recargas innecesarias tras acciones.
- [ ] Documentar patrón reutilizable para otros formularios del proyecto.

## P5 - Errores, retries y boundaries por segmento

- [ ] Estandarizar loaders para lanzar errores idiomáticos (`throw Response` / `throw json`) en vez de errores manuales con `status`.
- [ ] Agregar `errorElement` por módulos/rutas sensibles (no depender solo del global).
- [ ] Mejorar `RouteErrorFallback` para retry usando APIs del router (`useNavigate` / `useRevalidator`) cuando aplique.
- [ ] Revisar estrategia de `ErrorBoundary` en `processRoute` vs `errorElement` para evitar duplicidad/confusión.

## P6 - Limpieza de utilidades manuales de paths/query/prefetch

- [ ] Reemplazar usos seleccionados de construcción manual de URLs por `generatePath` y `createSearchParams`.
- [ ] Revisar `replacePathParams.ts` y decidir: deprecar, envolver `generatePath`, o mantener solo casos especiales.
- [ ] Revisar `getConfigRoute.ts`/helpers de rutas y simplificar donde React Router ya cubra el caso.
- [ ] Evaluar migración gradual de `routePreloaders` manuales hacia `route.lazy` (manteniendo `lazyRoute` si sigue aportando retry/warmup).
- [ ] Revisar si `MenuLink`/`SideBar` pueden reducir prefetch/matching manual con APIs nativas (`NavLink`, `useMatches`, data preloading futuro).

## P7 - UX y navegación avanzada (opt-in)

- [ ] Evaluar `ScrollRestoration` para mejorar back/forward en pantallas largas.
- [ ] Evaluar `useBlocker` / `useBeforeUnload` en formularios críticos con cambios sin guardar.
- [ ] Definir criterios de adopción (qué módulos sí/no migran a `actions/fetchers`).

## P8 - QA y rollout incremental

- [ ] Definir checklist de regresión de navegación (auth, redirects, menús, deep-links, rutas dinámicas).
- [ ] Probar SEO/títulos/meta tras migrar a `handle`.
- [ ] Probar errores de loaders y boundaries por ruta.
- [ ] Medir impacto en UX (flicker de redirects, estados pending, tiempos de navegación percibidos).
- [ ] Cerrar fase con documentación de patrones adoptados para futuras rutas.

## Decisiones abiertas (requiere definicion antes de P4/P6)

- [ ] Módulo piloto para `action` + `useFetcher`: `Users` o `GeneralConfig`.
- [ ] Mantener `lazyRoute` como wrapper propio o migrar a `route.lazy` puro en nuevas rutas.
- [ ] Alcance inicial de `handle`: solo SEO + menú, o incluir breadcrumbs/ACL también.
- [ ] Estrategia de compatibilidad temporal para `routeVisibility` durante migración.
