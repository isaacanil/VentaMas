# 2026-02-09 Algolia products route design

## Goal
Expose the existing Algolia products search experiment under a dedicated URL so development and testing can continue without adding a menu entry. The route should be dev-only and accessible by direct URL.

## Scope
- Use the existing component at `src/modules/dev/pages/test/pages/algoliaProductsSearch/AlgoliaProductsSearch.tsx`.
- Add a new dev route at `/prueba/algolia-products`.
- Keep the menu and shortcuts unchanged; access is via URL only.

## Routing plan
- Add `ALGOLIA_PRODUCTS_SEARCH` to `DEV_VIEW_TERM` in `src/router/routes/routesName.ts`.
- Register a lazy route in `src/router/routes/paths/Dev.tsx` that maps to `AlgoliaProductsSearch`.
- Mark the route as `devOnly: true` and `hideInMenu: true`.
- Optionally add a preloader entry in `src/router/routes/routePreloaders.ts` for faster navigation.

## Visibility rules
The route must only appear in development builds, or when `VITE_ENABLE_DEV_ROUTES` is enabled. It should not show in menus or developer shortcuts.

## Validation
- Run the app in dev and navigate to `/prueba/algolia-products`.
- Confirm the page renders and no menu entries are added.
- Confirm access is blocked in production builds unless dev routes are explicitly enabled.
