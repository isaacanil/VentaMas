declare module 'virtual:pwa-register/react' {
  type RegisterSWOptions = Record<string, any>;

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void];
    offlineReady: [boolean, (value: boolean) => void];
    updateServiceWorker: (reload?: boolean) => Promise<void>;
  };
}
