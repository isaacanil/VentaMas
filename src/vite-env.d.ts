/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_AI_LOCATION?: string;
  readonly VITE_FIREBASE_AI_MODEL?: string;
  readonly VITE_FIREBASE_AI_REMOTE_CONFIG?: string;
  readonly VITE_FIREBASE_AI_REMOTE_CONFIG_FETCH_TIMEOUT_MS?: string;
  readonly VITE_FIREBASE_AI_REMOTE_CONFIG_MIN_FETCH_MS?: string;
  readonly VITE_FIREBASE_AI_REMOTE_LOCATION_KEY?: string;
  readonly VITE_FIREBASE_AI_REMOTE_MODEL_KEY?: string;
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string;
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
