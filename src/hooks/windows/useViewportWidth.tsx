import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => 0;

export function useViewportWidth() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    window.addEventListener('resize', onStoreChange);

    return () => {
      window.removeEventListener('resize', onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    return window.innerWidth;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useViewportWidth;
