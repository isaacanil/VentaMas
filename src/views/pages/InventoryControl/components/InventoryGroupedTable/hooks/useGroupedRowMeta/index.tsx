import { useCallback, useMemo } from 'react';

import { buildGroupedRowMeta } from './utils/buildGroupedRowMeta';

import type { InventoryRowMeta, UseGroupedRowMetaParams } from './types';
import type { InventoryGroup } from '@/utils/inventory/types';

export function useGroupedRowMeta({
  baselineSnapshot,
  groups,
  counts,
  countsMeta,
  expirationEdits,
  locationNamesMap,
  onChangeCount,
  onChangeExpiration,
  readOnly,
  resolvingLocations,
  resolvingUIDs,
  serverCounts,
  usersNameCache,
  setModalGroup,
}: UseGroupedRowMetaParams) {
  const rowMetaMap = useMemo(() => {
    const map = new WeakMap<InventoryGroup, InventoryRowMeta>();
    (groups || []).forEach((group) => {
      if (!group) return;
      map.set(
        group,
        buildGroupedRowMeta({
          group,
          baselineSnapshot,
          counts,
          countsMeta,
          expirationEdits,
          locationNamesMap,
          onChangeCount,
          onChangeExpiration,
          readOnly,
          resolvingLocations,
          resolvingUIDs,
          serverCounts,
          usersNameCache,
          setModalGroup,
        }),
      );
    });
    return map;
  }, [
    baselineSnapshot,
    groups,
    counts,
    countsMeta,
    expirationEdits,
    locationNamesMap,
    onChangeCount,
    onChangeExpiration,
    readOnly,
    resolvingLocations,
    resolvingUIDs,
    serverCounts,
    usersNameCache,
    setModalGroup,
  ]);

  const getRowMeta = useCallback(
    (row: InventoryGroup) => rowMetaMap.get(row) ?? ({} as InventoryRowMeta),
    [rowMetaMap],
  );

  return getRowMeta;
}