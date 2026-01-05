import { useMemo } from 'react';

import {
  getPersistedCount,
  normalizeExpirationValue,
} from '../../inventoryTableUtils';
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';

import type {
  BaselineSnapshot,
  CountsMap,
  CountsMetaMap,
  InventoryGroup,
} from '@/utils/inventory/types';

interface UseBaselineSnapshotParams {
  groups?: InventoryGroup[];
  serverCounts: CountsMap;
  countsMeta: CountsMetaMap;
}

export function useBaselineSnapshot({
  groups,
  serverCounts,
  countsMeta,
}: UseBaselineSnapshotParams): BaselineSnapshot {
  return useMemo(() => {
    if (!groups || !groups.length) {
      return { counts: {}, expirations: {} };
    }

    const countsBase: CountsMap = {};
    const expBase: Record<string, string> = {};
    const norm = (d: Parameters<typeof normalizeExpirationValue>[0]) =>
      normalizeExpirationValue(d);

    groups.forEach((g) => {
      (g._children || []).forEach((ch) => {
        const key = ch.key;
        if (key && countsBase[key] === undefined) {
          const persistedCount = getPersistedCount(
            serverCounts,
            key,
            Number(ch.stock ?? 0),
          );
          countsBase[key] = Number(persistedCount);
        }
        if (key && expBase[key] === undefined) {
          const metaVal = countsMeta[key]?.manualExpirationDate;
          if (metaVal && metaVal !== CLEAR_SENTINEL) expBase[key] = norm(metaVal);
          else if (ch.type === 'batch' && ch.expirationDate)
            expBase[key] = norm(ch.expirationDate);
          else expBase[key] = '';
        }
        if (Array.isArray(ch.sources)) {
          ch.sources.forEach((src) => {
            const skey = src.id || src.key;
            if (!skey) return;
            if (countsBase[skey] === undefined) {
              const persisted = getPersistedCount(
                serverCounts,
                skey,
                Number(src.stock ?? src.quantity ?? 0),
              );
              countsBase[skey] = Number(persisted);
            }
            if (expBase[skey] === undefined) {
              const sMetaVal = countsMeta[skey]?.manualExpirationDate;
              if (sMetaVal && sMetaVal !== CLEAR_SENTINEL)
                expBase[skey] = norm(sMetaVal);
              else if (src.expirationDate)
                expBase[skey] = norm(src.expirationDate);
              else if (ch.type === 'batch' && ch.expirationDate)
                expBase[skey] = norm(ch.expirationDate);
              else expBase[skey] = '';
            }
          });
        }
      });
      // Baseline también para claves agregadas (topKey) cuando aplique
      if (g.topKey) {
        // Counts baseline para topKey
        if (countsBase[g.topKey] === undefined) {
          const firstChild = (g._children || [])[0] || {};
          const persistedTop = getPersistedCount(
            serverCounts,
            g.topKey,
            Number(firstChild.stock ?? 0),
          );
          countsBase[g.topKey] = Number(persistedTop);
        }
        // Expiration baseline para topKey: manual del grupo o fecha original del primer hijo (si es batch)
        if (expBase[g.topKey] === undefined) {
          const firstChild = (g._children || [])[0] || {};
          const m = countsMeta[g.topKey]?.manualExpirationDate;
          if (m && m !== CLEAR_SENTINEL) expBase[g.topKey] = norm(m);
          else if (firstChild.type === 'batch' && firstChild.expirationDate)
            expBase[g.topKey] = norm(firstChild.expirationDate);
          else expBase[g.topKey] = '';
        }
      }
    });

    return { counts: countsBase, expirations: expBase };
  }, [groups, serverCounts, countsMeta]);
}
