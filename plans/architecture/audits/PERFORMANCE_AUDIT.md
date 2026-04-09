# PERFORMANCE_AUDIT

Date: 2026-02-04  
Scope: Vite config, routing, PWA registration

**1. Code Splitting (Lazy Loading)**
Observations:

1. The route tree imports are almost entirely `React.lazy` across `src/router/routes/paths/*.tsx` (example: `src/router/routes/paths/Inventory.tsx`) and `src/router/AppRouterLayout.tsx`.
2. There are additional lazy boundaries in UI layers (ex: `src/components/modals/ModalManager.tsx`, `src/modules/home/pages/Home/Home.tsx`).
3. There are explicit route prefetchers in `src/router/routes/routePreloaders.ts` and dev-only prefetch in `src/modules/navigation/components/MenuApp/Components/SideBar.tsx` (limited but still a source of extra requests).

Impact in dev:

1. In Vite dev mode, every dynamic import becomes a separate request. With many lazy routes, the browser can be flooded with requests and waterfall delays.
2. This gets worse if a route loads several nested lazy components or if prefetchers run immediately.

Risk:

1. Too many small chunks in dev will inflate load time (5s+ is plausible), even though this is good for production bundle size.

Recommendations:

1. Use eager imports in dev for the top-level routes and frequently visited screens, while keeping lazy imports in production. Example approach: a small helper that returns `lazy` in prod and direct import in dev.
2. Reduce dev prefetchers (or trigger on-hover only). The `SideBar` dev prefetch can be gated or reduced further.
3. Consider grouping routes by domain (sales, inventory, settings) so dev loads fewer modules per navigation.

**2. Vite / Bundler Configuration**
Observations (from `vite.config.ts`):

1. `VitePWA` is enabled but has `devOptions: { enabled: false }`, so SW should not run in dev.
2. `vite-plugin-compression2` is included globally (no explicit `apply: 'build'`).
3. `build.rollupOptions.output.advancedChunks` is highly granular (many vendor groups). This affects production chunking, not dev.
4. `optimizeDeps.include` only lists `react-compiler-runtime`.

Potential dev bottlenecks:

1. The React compiler Babel plugin and styled-components plugin can slow dev transforms, especially with many files.
2. Over-granular production chunking can create a large number of files (fine in prod, but not related to dev slowness).
3. Missing `optimizeDeps.include` for heavy libs (firebase, antd, icons, react-router) can slow dev cold start.

Recommendations:

1. Ensure compression/analyzer plugins are build-only (set `apply: 'build'`) to avoid any dev overhead.
2. Consider expanding `optimizeDeps.include` for heavy deps that are used on initial route (firebase, antd, @ant-design/icons, react-router, @tanstack).
3. Keep `advancedChunks` for production only; no change needed for dev unless build times are also slow.

**3. Service Workers in Development**
Observations:

1. PWA registration is done via `useRegisterSW` in `src/components/PwaUpdatePrompt/PwaUpdatePrompt.tsx`.
2. The PWA plugin has `devOptions.enabled: false`, so the SW should not register in dev.
3. There is no manual `navigator.serviceWorker.register` found elsewhere.

Risk:

1. If a stale SW was previously registered (from a prod build or another host), it can still intercept dev requests and cause cache issues or slow loads.
2. The PWA update prompt runs in all environments, even though it only shows notifications in prod.

Recommendations:

1. In dev, consider explicitly unregistering any existing SW on startup to avoid ghost caching.
2. Optionally mount `PwaUpdatePrompt` only in prod to remove any dev overhead.

**Strategy to Restore Fast Dev HMR**

1. Switch lazy routes to eager imports in dev for core screens, keep lazy in production.
2. Reduce or disable dev prefetchers unless explicitly needed.
3. Confirm PWA is fully disabled in dev and unregister any existing SW.
4. Expand `optimizeDeps.include` for large deps to speed dev startup.
5. Keep production chunking and PWA behavior unchanged for release builds.
