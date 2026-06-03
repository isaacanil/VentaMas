import { useCallback, useSyncExternalStore } from 'react';

const getServerSnapshot = () => false;

export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined') {
        return () => {};
      }

      const media = window.matchMedia(query);
      media.addEventListener('change', onStoreChange);

      return () => {
        media.removeEventListener('change', onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
