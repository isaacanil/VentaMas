import { Button, Dropdown, InputNumber, Modal, Tag, Tooltip } from 'antd';
import { DateTime } from 'luxon';

import DatePicker from '@/components/DatePicker';
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';

import { EditorsList } from '../../../../inventoryTableComponents';
import {
  Diff,
  formatInputDate,
  formatNumber,
  getEffectiveCount,
  getPersistedCount,
  normalizeExpirationValue,
  shortenLocationPath,
} from '../../../../inventoryTableUtils';

import { LotNameCell } from './LotNameCell';

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
  const stock = useChildFrozen ? Number(record.stock ?? sourceLive) : sourceLive;
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
  let sourceDateValue = null;
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <DatePicker
            value={sourceDateValue}
            format="DD/MM/YYYY"
            allowClear
            disabled={readOnly}
            placeholder={record.type === 'batch' ? 'Sin fecha' : 'Sin asignar'}
            onChange={(date) => {
              if (!date) {
                const hadExisting =
                  !!source.expirationDate ||
                  !!sMeta?.manualExpirationDate ||
                  !!sourceDateValue;
                if (!hadExisting) {
                  onChangeExpiration && onChangeExpiration(sourceKey, undefined);
                  return;
                }
                if (record.type === 'batch') {
                  const prevVal = sMeta?.manualExpirationDate
                    ? formatInputDate(sMeta.manualExpirationDate)
                    : formatInputDate(
                        source.expirationDate || record.expirationDate,
                      );
                  onChangeExpiration && onChangeExpiration(sourceKey, undefined);
                  Modal.confirm({
                    title: 'Eliminar fecha de lote',
                    content:
                      'La fecha se quitará de esta partida y todas las partidas del mismo lote. ¿Continuar?',
                    okText: 'Sí, eliminar',
                    cancelText: 'Cancelar',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      onChangeExpiration &&
                        onChangeExpiration(sourceKey, CLEAR_SENTINEL);
                      syncSameLotDates(sourceKey, CLEAR_SENTINEL, source);
                    },
                    onCancel: () => {
                      if (prevVal)
                        onChangeExpiration &&
                          onChangeExpiration(sourceKey, prevVal);
                    },
                  });
                } else if (record.type === 'noexp') {
                  onChangeExpiration && onChangeExpiration(sourceKey, undefined);
                }
                return;
              }
              const iso = date.toISODate();
              onChangeExpiration && onChangeExpiration(sourceKey, iso);
              syncSameLotDates(sourceKey, iso, source);
            }}
          />
        </div>
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
        {!readOnly &&
          (() => {
            const menuItems = [];
            const originalDate = source.expirationDate || record.expirationDate;
            const srcHasChanged = !!(
              countsMeta[sourceKey]?.manualExpirationDate ||
              expirationEdits[sourceKey] !== undefined ||
              (originalDate &&
                formatInputDate(originalDate) !==
                  (expirationEdits[sourceKey] ||
                    countsMeta[sourceKey]?.manualExpirationDate ||
                    ''))
            );
            if (record.type === 'batch' && originalDate) {
              menuItems.push({
                key: 'restore-date',
                label: 'Restablecer fecha de vencimiento original',
                disabled: !srcHasChanged,
                onClick: () => {
                  const formattedDate = formatInputDate(originalDate);
                  onChangeExpiration &&
                    onChangeExpiration(sourceKey, formattedDate);
                  syncSameLotDates(sourceKey, formattedDate, source);
                },
              });
            }
            const hasCurrentDate = sourceDateValue || srcBaseStr;
            if (
              (record.type === 'batch' || record.type === 'noexp') &&
              hasCurrentDate
            ) {
              if (menuItems.length) menuItems.push({ type: 'divider' });
              menuItems.push({
                key: 'clear-date',
                label: 'Borrar fecha de vencimiento',
                onClick: () => {
                  onChangeExpiration &&
                    onChangeExpiration(sourceKey, CLEAR_SENTINEL);
                  syncSameLotDates(sourceKey, CLEAR_SENTINEL, source);
                },
              });
            }
            const persistedSourceCount = getPersistedCount(
              serverCounts,
              sourceKey,
              stock,
            );
            const baselineSourceCount = baselineCounts[sourceKey];
            const effectiveSourceVal = getEffectiveCount(
              counts,
              serverCounts,
              sourceKey,
              stock,
            );
            const hasEditedSourceCount =
              counts[sourceKey] !== undefined &&
              Number(counts[sourceKey]) !== persistedSourceCount;
            const canRestoreBaseline =
              baselineSourceCount !== undefined &&
              Number(baselineSourceCount) !== effectiveSourceVal;
            if (hasEditedSourceCount) {
              if (menuItems.length) menuItems.push({ type: 'divider' });
              menuItems.push({
                key: 'restore-count-persisted',
                label: 'Restablecer conteo guardado',
                onClick: () =>
                  onChangeCount(sourceKey, Number(persistedSourceCount)),
              });
            }
            if (canRestoreBaseline) {
              if (!hasEditedSourceCount && menuItems.length)
                menuItems.push({ type: 'divider' });
              menuItems.push({
                key: 'restore-count-baseline',
                label: 'Restablecer conteo original',
                onClick: () =>
                  onChangeCount(sourceKey, Number(baselineSourceCount)),
              });
            }
            if (!menuItems.length) return null;
            return (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button size="small">⋯</Button>
              </Dropdown>
            );
          })()}
      </td>
    </tr>
  );
}
