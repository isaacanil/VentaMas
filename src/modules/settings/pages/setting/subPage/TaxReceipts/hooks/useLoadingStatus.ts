import { useMemo } from 'react';

type LoadingEntry = {
  loading: boolean;
  tip?: string;
};

export function useLoadingStatus(entries: LoadingEntry[] = []) {
  return useMemo(() => {
    const isLoading = entries.some((entry) => entry.loading === true);
    const active = entries.find((entry) => entry.loading === true);
    const tip = active ? active.tip : '';

    return { isLoading, tip };
  }, [entries]);
}
