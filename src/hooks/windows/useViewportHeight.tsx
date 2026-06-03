import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => 0;

export const useViewportHeight = () => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    window.addEventListener('resize', onStoreChange);
    window.addEventListener('orientationchange', onStoreChange);

    return () => {
      window.removeEventListener('resize', onStoreChange);
      window.removeEventListener('orientationchange', onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    return window.visualViewport?.height ?? window.innerHeight;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
