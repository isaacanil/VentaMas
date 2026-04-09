# NAVIGATION_AUDIT

Date: 2026-02-04
Scope: All route path files, main router layout, menu components, and Home shortcuts.

## 1. Integridad del Layout (Re-rendering)

Files checked:

- `src/router/AppRouterLayout.tsx`
- `src/App.tsx`
- Usage of `MenuApp` across modules (`rg "MenuApp" src/modules`)

Findings:

1. The router layout is correct: `RootElement` renders `AppLayout`, and `AppLayout` owns a single `<Outlet />`. This means routes are nested correctly in React Router.
2. The SideBar is not part of the root layout. It lives inside `MenuApp` (`src/modules/navigation/components/MenuApp/MenuApp.tsx`), and `MenuApp` is instantiated inside many pages across modules.

Answer:

- **Layout principal dentro de rutas hijas?** **NO** (Root layout wraps all routes once, and uses `<Outlet />` correctly).
- **SideBar dentro de rutas hijas?** **SI** (SideBar mounts/unmounts per page because it is inside `MenuApp`, and `MenuApp` is used in most screens).
- **Outlet correcto?** **SI** (AppLayout uses `<Outlet />` inside a `Suspense` boundary).

Impact:

- When navigating between modules, the menu + sidebar re-mount on every screen. This does not break routing, but it can add latency and visual churn if the menu tree is heavy.

## 2. Mecanismo de Enlaces (Link vs a href)

Files checked:

- `src/modules/navigation/components/MenuApp/Components/SideBar.tsx`
- `src/modules/navigation/components/MenuApp/Components/MenuLink.tsx`
- `src/modules/home/pages/Home/components/FeatureCardList/FeatureCard.tsx`
- Global scan for `<a>`, `window.location`, and `location.href` in `src/`

Findings:

1. Menu items use `NavLink` and `useNavigate` (SPA navigation).
2. Home shortcuts use `Link` (SPA navigation).
3. Hard reloads (`window.location.href` or `window.location.reload`) exist only in error/recovery flows and non-core pages (error fallback, welcome landing, storybook, file preview, etc.).

Answer:

- **Navegacion SPA en menus y Home?** **SI** (NavLink/Link/useNavigate).
- **Hard reloads en navegacion principal?** **NO** (hard reloads appear only in error boundaries or non-auth pages).

## 3. Estructura del Arbol de Rutas (Nesting)

Files checked:

- All `src/router/routes/paths/*.tsx`
- `src/router/routes/routes.tsx`

Findings:

1. Most route path files lazy-load the final page component directly (single lazy boundary).
2. Only two path files define nested `children`: `Inventory.tsx` and `Setting.tsx`.
3. In those two, both the parent route element and child route elements are lazy.

Answer:

- **Lazy loading en cascada?** **SI (parcial)**.
  - `src/router/routes/paths/Inventory.tsx`: `Warehouse` (lazy) + child `DetailView` (lazy).
  - `src/router/routes/paths/Setting.tsx`: `Setting`/`GeneralConfig`/`UserAdmin` (lazy) + child pages (lazy).
- **En el resto de rutas?** **NO** (single lazy boundary per route).

Impact:

- Cascaded lazy boundaries can cause sequential fetches when hitting nested routes (especially Settings and Warehouse routes).

### Conclusion

The router layout itself is structurally correct. The biggest architectural contributor to navigation latency is:

1. The menu + sidebar being recreated per screen (MenuApp inside each page).
2. Cascaded lazy loading in Settings and Inventory nested routes.
3. A large number of lazy boundaries across modules causing multiple chunk fetches in dev or cold cache.
