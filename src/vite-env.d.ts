/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_DEV_ROUTES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
