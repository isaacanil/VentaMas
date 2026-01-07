// @ts-nocheck
import { useMemo } from 'react';

export function useLoadingStatus(entries) {
  // entries: Array<{ loading: boolean, tip: string }>
  // Utilizamos useMemo para evitar recálculos innecesarios
  const result = useMemo(() => {
    const isLoading =
      Array.isArray(entries) && entries.some((entry) => entry.loading === true);
    const active =
      Array.isArray(entries) && entries.find((entry) => entry.loading === true);
    const tip = active ? active.tip : '';
    return { isLoading, tip };
  }, [entries]);

  return result;
}
