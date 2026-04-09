/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_DEV_ROUTES?: string;
  readonly VITE_ENABLE_REACT_SCAN?: string;
  readonly VITE_ENABLE_LAZY_ROUTE_WARMUP?: string;
  readonly VITE_ENABLE_DEV_ROUTE_PREFETCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_BUILD_ID__: string;
declare const __APP_BUILD_TIME__: string;
