import { resolveLocationDisplay } from '../../../../inventoryTableUtils';

import { GroupedLotsRecordRow } from './GroupedLotsRecordRow';
import { GroupedLotsSourceRow } from './GroupedLotsSourceRow';

import type {
  BaselineSnapshot,
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryChild,
  InventoryGroup,
  InventorySource,
  LocationNamesMap,
  ResolvingMap,
} from '@/utils/inventory/types';

interface GroupedLotsTableBodyProps {
  group: InventoryGroup;
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  usersNameCache: Record<string, string>;
  locationNamesMap: LocationNamesMap;
  resolvingLocations: ResolvingMap;
  expirationEdits: ExpirationEditsMap;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  onChangeCount: (key: string, value: number) => void;
  serverCounts: CountsMap;
  readOnly: boolean;
  baselineSnapshot?: BaselineSnapshot;
}

export function GroupedLotsTableBody({
  group,
  counts,
  countsMeta,
  usersNameCache,
  locationNamesMap,
  resolvingLocations,
  expirationEdits,
  onChangeExpiration,
  onChangeCount,
  serverCounts,
  readOnly,
  baselineSnapshot,
}: GroupedLotsTableBodyProps) {
  const children = group._children || [];
  const baselineCounts = baselineSnapshot?.counts || {};
  const baselineExp = baselineSnapshot?.expirations || {};

  const getLocationDisplay = (locKey: string | null | undefined, fallbackLabel?: string | null) =>
    resolveLocationDisplay(
      locKey,
      fallbackLabel || '',
      locationNamesMap,
      resolvingLocations,
    );

  // Sincronizar fecha en sources que comparten el mismo lote
  const syncSameLotDates = (
    changedSourceKey: string,
    newDate: string | null | undefined,
    currentSource: InventorySource,
  ) => {
    if (!group?._children || !onChangeExpiration) return;
    const currentLotId = currentSource.batchId || currentSource.batchNumberId;
    if (!currentLotId) return;
    for (const child of group._children) {
      if (!child.sources) continue;
      for (const src of child.sources) {
        const srcKey = src.id || src.key;
        if (!srcKey || srcKey === changedSourceKey) continue;
        const srcLotId = src.batchId || src.batchNumberId;
        if (srcLotId === currentLotId) onChangeExpiration(srcKey, newDate);
      }
    }
  };

  // Sincronizar fecha entre registros (sin sources) del mismo lote
  const syncSameLotRecords = (
    changedRecordKey: string,
    newDate: string | null | undefined,
    currentRecord: InventoryChild,
  ) => {
    if (!group?._children || !onChangeExpiration) return;
    const currentLotId = currentRecord.batchId || currentRecord.batchNumberId;
    if (!currentLotId) return;
    for (const child of group._children) {
      if (child.key === changedRecordKey) continue;
      if (child.type !== 'batch') continue;
      const childLotId = child.batchId || child.batchNumberId;
      if (childLotId === currentLotId) onChangeExpiration(child.key, newDate);
    }
  };

  return (
    <tbody>
      {children.flatMap((record) => {
        if (
          (record.type === 'batch' || record.type === 'noexp') &&
          (record.sources?.length || 0) > 0
        ) {
          return record.sources?.map((src, idx) => {
            const sourceKey = String(
              src.id ?? src.key ?? `${record.key}-src-${idx}`,
            );
            return (
              <GroupedLotsSourceRow
                key={sourceKey}
                record={record}
                source={src}
                sourceKey={sourceKey}
                counts={counts}
                countsMeta={countsMeta}
                serverCounts={serverCounts}
                expirationEdits={expirationEdits}
                usersNameCache={usersNameCache}
                baselineCounts={baselineCounts}
                baselineExp={baselineExp}
                readOnly={readOnly}
                onChangeCount={onChangeCount}
                onChangeExpiration={onChangeExpiration}
                syncSameLotDates={syncSameLotDates}
                getLocationDisplay={getLocationDisplay}
              />
            );
          });
        }

        return [
          <GroupedLotsRecordRow
            key={record.key}
            record={record}
            counts={counts}
            countsMeta={countsMeta}
            serverCounts={serverCounts}
            expirationEdits={expirationEdits}
            usersNameCache={usersNameCache}
            baselineCounts={baselineCounts}
            baselineExp={baselineExp}
            readOnly={readOnly}
            onChangeCount={onChangeCount}
            onChangeExpiration={onChangeExpiration}
            syncSameLotRecords={syncSameLotRecords}
            getLocationDisplay={getLocationDisplay}
            canEditAtTop={group.canEditAtTop}
            topKey={group.topKey}
            childrenCount={children.length}
          />,
        ];
      })}
    </tbody>
  );
}
