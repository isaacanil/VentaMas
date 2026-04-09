import { InputNumber, Tag, Tooltip } from 'antd';
import { DateTime } from 'luxon';

import { EditorsList } from '../../../../inventoryTableComponents';
import {
  Diff,
  formatInputDate,
  formatNumber,
  getEffectiveCount,
  normalizeExpirationValue,
  shortenLocationPath,
} from '../../../../inventoryTableUtils';

import { LotNameCell } from './LotNameCell';
import { SourceActionsMenu } from './GroupedLotsSourceRow/SourceActionsMenu';
import { SourceExpirationCell } from './GroupedLotsSourceRow/SourceExpirationCell';

import type {
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryChild,
  InventorySource,
} from '@/utils/inventory/types';

interface LocationDisplay {
  label: string;
  isLoading: boolean;
}

interface GroupedLotsSourceRowProps {
  record: InventoryChild;
  source: InventorySource;
  sourceKey: string;
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  serverCounts: CountsMap;
  expirationEdits: ExpirationEditsMap;
  usersNameCache: Record<string, string>;
  baselineCounts: CountsMap;
  baselineExp: Record<string, string>;
  readOnly: boolean;
  onChangeCount: (key: string, value: number) => void;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  syncSameLotDates: (
    changedSourceKey: string,
    newDate: string | null | undefined,
    currentSource: InventorySource,
  ) => void;
  getLocationDisplay: (
    locKey: string | null | undefined,
    fallbackLabel?: string | null,
  ) => LocationDisplay;
}

export function GroupedLotsSourceRow({
  record,
  source,
  sourceKey,
  counts,
  countsMeta,
  serverCounts,
  expirationEdits,
  usersNameCache,
  baselineCounts,
  baselineExp,
  readOnly,
  onChangeCount,
  onChangeExpiration,
  syncSameLotDates,
  getLocationDisplay,
}: GroupedLotsSourceRowProps) {
  const sourceLive = Number(source.quantity ?? source.stock ?? 0) || 0;
  const useChildFrozen =
    (record.sources?.length || 0) === 1 &&
    Number.isFinite(Number(record.stock));
  const stock = useChildFrozen
    ? Number(record.stock ?? sourceLive)
    : sourceLive;
  const sReal =
    counts[sourceKey] ?? serverCounts[sourceKey] ?? source.real ?? sourceLive;
  const sDiff = Number(sReal ?? 0) - stock;
  const sMeta = countsMeta[sourceKey];
  const locationKey = source.locationKey || source.location || '';
  const { label: locationLabel, isLoading: isLoadingLoc } = getLocationDisplay(
    locationKey,
    source.locationLabel,
  );
  const tagLocationLabel = shortenLocationPath(locationLabel);
  const srcEditVal = expirationEdits[sourceKey];
  const srcPersistedVal = sMeta?.manualExpirationDate;

  const srcEffective = getEffectiveCount(
    counts,
    serverCounts,
    sourceKey,
    stock,
  );
  const baseSrcCount = baselineCounts[sourceKey];
  const srcCountChangedPersisted =
    baseSrcCount !== undefined && Number(srcEffective) !== Number(baseSrcCount);
  let currentSrcPersistedExp =
    srcPersistedVal && srcPersistedVal !== CLEAR_SENTINEL
      ? srcPersistedVal
      : source.expirationDate
        ? formatInputDate(source.expirationDate)
        : record.type === 'batch'
          ? formatInputDate(record.expirationDate)
          : '';
  currentSrcPersistedExp = normalizeExpirationValue(currentSrcPersistedExp);
  const baseSrcExp = baselineExp[sourceKey];
  const srcExpChangedPersisted =
    baseSrcExp !== undefined && currentSrcPersistedExp !== baseSrcExp;
  const srcHasPendingExpEdit =
    srcEditVal !== undefined && srcEditVal !== srcPersistedVal;
  const sourceModified =
    srcCountChangedPersisted || srcExpChangedPersisted || srcHasPendingExpEdit;

  const srcHasEditState = Object.prototype.hasOwnProperty.call(
    expirationEdits,
    sourceKey,
  );
  let sourceDateValue: DateTime | null = null;
  let srcBaseStr = '';
  if (srcHasEditState) {
    if (srcEditVal === CLEAR_SENTINEL) srcBaseStr = '';
    else if (srcEditVal) srcBaseStr = srcEditVal;
  } else {
    if (
      sMeta?.manualExpirationDate &&
      sMeta.manualExpirationDate !== CLEAR_SENTINEL
    )
      srcBaseStr = formatInputDate(sMeta.manualExpirationDate);
    else if (source.expirationDate)
      srcBaseStr = formatInputDate(source.expirationDate);
    else if (record.type === 'batch' && record.expirationDate)
      srcBaseStr = formatInputDate(record.expirationDate);
  }
  if (srcBaseStr) {
    const d = DateTime.fromISO(srcBaseStr);
    if (d.isValid) sourceDateValue = d;
  }

  const lotLabel = (
    <>
      Lote{' '}
      {source.batchNumberId ||
        source.batchId ||
        record.batchNumberId ||
        record.batchId ||
        'x'}
    </>
  );

  return (
    <tr>
      <td>
        <LotNameCell label={lotLabel} showEditedTag={sourceModified} />
      </td>
      <td>
        <SourceExpirationCell
          readOnly={readOnly}
          record={record}
          source={source}
          sourceKey={sourceKey}
          sourceDateValue={sourceDateValue}
          sourceManualExpirationDate={sMeta?.manualExpirationDate}
          onChangeExpiration={onChangeExpiration}
          syncSameLotDates={syncSameLotDates}
        />
      </td>
      <td>
        <Tooltip title={locationLabel}>
          <Tag>
            <span style={isLoadingLoc ? { opacity: 0.7 } : undefined}>
              {tagLocationLabel}
            </span>
          </Tag>
        </Tooltip>
      </td>
      <td style={{ textAlign: 'right' }}>
        <strong>{formatNumber(stock)}</strong>
      </td>
      <td style={{ textAlign: 'right' }}>
        <InputNumber
          min={0}
          value={sReal}
          onChange={(val) => onChangeCount(sourceKey, Number(val ?? 0))}
          style={{ width: 90 }}
          disabled={readOnly}
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <Diff $value={sDiff}>{formatNumber(sDiff)}</Diff>
      </td>
      <td>
        {sMeta?.updatedBy ? (
          <EditorsList
            editors={[
              {
                uid: sMeta.updatedBy,
                name:
                  usersNameCache[sMeta.updatedBy] ||
                  sMeta.updatedByName ||
                  sMeta.updatedBy,
                updatedAt: sMeta.updatedAt,
              },
            ]}
          />
        ) : (
          <span>-</span>
        )}
      </td>
      <td style={{ textAlign: 'center' }}>
        <SourceActionsMenu
          readOnly={readOnly}
          record={record}
          source={source}
          sourceKey={sourceKey}
          counts={counts}
          countsMeta={countsMeta}
          serverCounts={serverCounts}
          expirationEdits={expirationEdits}
          baselineCounts={baselineCounts}
          stock={stock}
          sourceDateValue={sourceDateValue}
          srcBaseStr={srcBaseStr}
          onChangeCount={onChangeCount}
          onChangeExpiration={onChangeExpiration}
          syncSameLotDates={syncSameLotDates}
        />
      </td>
    </tr>
  );
}
