type ReactScanWindow = Window &
  typeof globalThis & {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
  };

export const isReactDevToolsDetected = (
  target: Window | undefined = typeof window !== 'undefined' ? window : undefined,
): boolean => {
  if (!target) return false;

  const reactScanWindow = target as ReactScanWindow;
  return Boolean(reactScanWindow.__REACT_DEVTOOLS_GLOBAL_HOOK__);
};

export const getReactScanDevToolsConflictMessage = (): string =>
  'React Scan no se carga mientras React DevTools este activo. Cierra DevTools o desactiva la extension y recarga la pagina antes de usar REACTSCAN.';

export const shouldAutoLoadReactScan = (
  env: ImportMetaEnv,
  target: Window | undefined = typeof window !== 'undefined' ? window : undefined,
): boolean =>
  Boolean(env.DEV) &&
  env.VITE_ENABLE_REACT_SCAN === 'true' &&
  !isReactDevToolsDetected(target);
