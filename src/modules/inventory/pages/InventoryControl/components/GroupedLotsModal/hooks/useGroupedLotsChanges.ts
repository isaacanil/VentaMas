import { useMemo } from 'react';

import type {
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryGroup,
} from '@/utils/inventory/types';

interface UseGroupedLotsChangesParams {
  group: InventoryGroup | null;
  counts: CountsMap;
  serverCounts: CountsMap;
  expirationEdits: ExpirationEditsMap;
  countsMeta: CountsMetaMap;
}

export function useGroupedLotsChanges({
  group,
  counts,
  serverCounts,
  expirationEdits,
  countsMeta,
}: UseGroupedLotsChangesParams): boolean {
  return useMemo(() => {
    if (!group?._children) return false;
    for (const child of group._children) {
      if ((counts[child.key] ?? null) !== (serverCounts[child.key] ?? null))
        return true;
      if (Array.isArray(child.sources)) {
        for (const src of child.sources) {
          const skey = src.id || src.key;
          if (!skey) continue;
          if ((counts[skey] ?? null) !== (serverCounts[skey] ?? null))
            return true;
        }
      }
    }
    for (const child of group._children) {
      const editedVal = expirationEdits[child.key] ?? null;
      const storedVal = countsMeta[child.key]?.manualExpirationDate ?? null;
      if (editedVal !== storedVal) return true;
      if (Array.isArray(child.sources)) {
        for (const src of child.sources) {
          const skey = src.id || src.key;
          if (!skey) continue;
          const eVal = expirationEdits[skey] ?? null;
          const sVal = countsMeta[skey]?.manualExpirationDate ?? null;
          if (eVal !== sVal) return true;
        }
      }
    }
    return false;
  }, [group, counts, serverCounts, expirationEdits, countsMeta]);
}
