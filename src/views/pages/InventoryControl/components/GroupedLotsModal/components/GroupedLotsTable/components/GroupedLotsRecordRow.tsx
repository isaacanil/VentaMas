import { Button, Dropdown, InputNumber, Modal, Tag, Tooltip } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';

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
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';

import { LotNameCell } from './LotNameCell';

import type {
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryChild,
} from '@/utils/inventory/types';
import type { MenuProps } from 'antd';

interface LocationDisplay {
  label: string;
  isLoading: boolean;
}

interface GroupedLotsRecordRowProps {
  record: InventoryChild;
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
  syncSameLotRecords: (
    changedRecordKey: string,
    newDate: string | null | undefined,
    currentRecord: InventoryChild,
  ) => void;
  getLocationDisplay: (
    locKey: string | null | undefined,
    fallbackLabel?: string | null,
  ) => LocationDisplay;
  canEditAtTop?: boolean;
  topKey?: string;
  childrenCount: number;
}

export function GroupedLotsRecordRow({
  record,
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
  syncSameLotRecords,
  getLocationDisplay,
  canEditAtTop,
  topKey,
  childrenCount,
}: GroupedLotsRecordRowProps) {
  let aggregatedTopCount;
  if (canEditAtTop && topKey && counts[topKey] !== undefined)
    aggregatedTopCount = counts[topKey];
  else if (canEditAtTop && topKey && serverCounts[topKey] !== undefined)
    aggregatedTopCount = serverCounts[topKey];

  const real =
    counts[record.key] !== undefined
      ? counts[record.key]
      : aggregatedTopCount !== undefined && childrenCount === 1
        ? aggregatedTopCount
        : serverCounts[record.key] !== undefined
          ? serverCounts[record.key]
          : record.real;
  const diff = Number(real ?? 0) - Number(record.stock ?? 0);
  const meta = countsMeta[record.key];
  const editVal = expirationEdits[record.key];
  const hasEditState = Object.prototype.hasOwnProperty.call(
    expirationEdits,
    record.key,
  );
  const persistedVal = meta?.manualExpirationDate;
  const isMarkedForRemoval =
    editVal === CLEAR_SENTINEL || persistedVal === CLEAR_SENTINEL;

  const effectiveCount = getEffectiveCount(
    counts,
    serverCounts,
    record.key,
    Number(record.stock ?? 0),
  );
  const baselineCount = baselineCounts[record.key];
  const countChangedPersisted =
    baselineCount !== undefined &&
    Number(effectiveCount) !== Number(baselineCount);

  let currentPersistedExp =
    meta?.manualExpirationDate && meta.manualExpirationDate !== CLEAR_SENTINEL
      ? meta.manualExpirationDate
      : record.type === 'batch'
        ? formatInputDate(record.expirationDate)
        : '';
  currentPersistedExp = normalizeExpirationValue(currentPersistedExp);
  const baseExp = baselineExp[record.key];
  const expChangedPersisted =
    baseExp !== undefined && currentPersistedExp !== baseExp;
  const hasPendingExpEdit = editVal !== undefined && editVal !== persistedVal;
  const rowModified =
    countChangedPersisted || expChangedPersisted || hasPendingExpEdit;

  let dateValue: DateTime | null = null;
  let baseStr = '';
  if (hasEditState) {
    if (editVal === CLEAR_SENTINEL) baseStr = '';
    else if (editVal) baseStr = editVal;
  } else {
    if (
      meta?.manualExpirationDate &&
      meta.manualExpirationDate !== CLEAR_SENTINEL
    )
      baseStr = formatInputDate(meta.manualExpirationDate);
    else if (record.type === 'batch')
      baseStr = formatInputDate(record.expirationDate);
  }
  if (baseStr) {
    const d = DateTime.fromISO(baseStr);
    if (d.isValid) dateValue = d;
  }
  const originalDateStr =
    record.type === 'batch' ? formatInputDate(record.expirationDate) : '';
  const currentEditStr = isMarkedForRemoval
    ? CLEAR_SENTINEL
    : dateValue
      ? dateValue.toFormat('yyyy-LL-dd')
      : '';
  const isDifferentFromOriginal =
    record.type === 'batch' &&
    (currentEditStr === CLEAR_SENTINEL ||
      (!!originalDateStr && currentEditStr !== originalDateStr) ||
      (!currentEditStr && !!originalDateStr));

  const lotLabel =
    record.type === 'noexp' ? (
      <Tag color="default" style={{ marginInlineEnd: 0 }}>
        Sin vencimiento
      </Tag>
    ) : (
      <>
        Lote {record.batchNumberId ?? record.batchId ?? 'x'}
      </>
    );

  return (
    <tr>
      <td>
        <LotNameCell label={lotLabel} showEditedTag={rowModified} />
      </td>
      <td>
        <DatePicker
          value={dateValue}
          format="DD/MM/YYYY"
          allowClear
          disabled={readOnly}
          placeholder={record.type === 'batch' ? 'Sin fecha' : 'Sin asignar'}
          onChange={(date) => {
            if (!date) {
              const hadExisting =
                !!record.expirationDate ||
                !!meta?.manualExpirationDate ||
                !!dateValue;
              if (!hadExisting) {
                onChangeExpiration && onChangeExpiration(record.key, undefined);
                return;
              }
              if (record.type === 'batch') {
                const prevVal = meta?.manualExpirationDate
                  ? formatInputDate(meta.manualExpirationDate)
                  : formatInputDate(record.expirationDate);
                onChangeExpiration && onChangeExpiration(record.key, undefined);
                Modal.confirm({
                  title: 'Eliminar fecha de lote',
                  content:
                    'La fecha se quitará de este lote y todos los lotes con el mismo número. ¿Continuar?',
                  okText: 'Sí, eliminar',
                  cancelText: 'Cancelar',
                  okButtonProps: { danger: true },
                  onOk: () => {
                    onChangeExpiration &&
                      onChangeExpiration(record.key, CLEAR_SENTINEL);
                    syncSameLotRecords(record.key, CLEAR_SENTINEL, record);
                  },
                  onCancel: () => {
                    if (prevVal)
                      onChangeExpiration &&
                        onChangeExpiration(record.key, prevVal);
                  },
                });
              } else {
                onChangeExpiration && onChangeExpiration(record.key, undefined);
              }
              return;
            }
            const iso = date.toISODate();
            onChangeExpiration && onChangeExpiration(record.key, iso);
            if (record.type === 'batch')
              syncSameLotRecords(record.key, iso, record);
          }}
        />
      </td>
      <td>
        {record.locations?.length ? (
          <TagsWrap>
            {record.locations.map((location, idx) => {
              const locationKey = location.locationKey || location.location || '';
              const { label, isLoading } = getLocationDisplay(
                locationKey,
                location.locationLabel,
              );
              const shortened = shortenLocationPath(label);
              return (
                <Tooltip key={`${record.key}-loc-${idx}`} title={label}>
                  <Tag>
                    <span style={isLoading ? { opacity: 0.7 } : undefined}>
                      {shortened}
                    </span>
                  </Tag>
                </Tooltip>
              );
            })}
          </TagsWrap>
        ) : (
          <span>-</span>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        <strong>{formatNumber(record.stock)}</strong>
      </td>
      <td style={{ textAlign: 'right' }}>
        <InputNumber
          min={0}
          value={real}
          onChange={(val) => onChangeCount(record.key, Number(val ?? 0))}
          style={{ width: 90 }}
          disabled={readOnly}
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <Diff $value={diff}>{formatNumber(diff)}</Diff>
      </td>
      <td>
        {meta?.updatedBy ? (
          <EditorsList
            editors={[
              {
                uid: meta.updatedBy,
                name:
                  usersNameCache[meta.updatedBy] ||
                  meta.updatedByName ||
                  meta.updatedBy,
                updatedAt: meta.updatedAt,
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
            const menuItems: NonNullable<MenuProps['items']> = [];
            if (record.type === 'batch' && originalDateStr) {
              menuItems.push({
                key: 'restore-date',
                label: 'Restablecer fecha de vencimiento original',
                disabled: !isDifferentFromOriginal,
                onClick: () => {
                  onChangeExpiration &&
                    onChangeExpiration(record.key, originalDateStr);
                  syncSameLotRecords(record.key, originalDateStr, record);
                },
              });
            }
            const hasCurrentDate = dateValue || baseStr;
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
                    onChangeExpiration(record.key, CLEAR_SENTINEL);
                  if (record.type === 'batch')
                    syncSameLotRecords(record.key, CLEAR_SENTINEL, record);
                },
              });
            }
            if (!record.sources?.length) {
              const persistedRecordCount = getPersistedCount(
                serverCounts,
                record.key,
                Number(record.stock ?? 0),
              );
              const hasEditedRecordCount =
                counts[record.key] !== undefined &&
                Number(counts[record.key]) !== persistedRecordCount;
              const baselineRecordCount = baselineCounts[record.key];
              const effectiveRecordVal = getEffectiveCount(
                counts,
                serverCounts,
                record.key,
                Number(record.stock ?? 0),
              );
              const canRestoreBaseline =
                baselineRecordCount !== undefined &&
                Number(baselineRecordCount) !== effectiveRecordVal;
              if (hasEditedRecordCount) {
                if (menuItems.length) menuItems.push({ type: 'divider' });
                menuItems.push({
                  key: 'restore-count-persisted',
                  label: 'Restablecer conteo guardado',
                  onClick: () =>
                    onChangeCount(
                      record.key,
                      Number(persistedRecordCount),
                    ),
                });
              }
              if (canRestoreBaseline) {
                if (!hasEditedRecordCount && menuItems.length)
                  menuItems.push({ type: 'divider' });
                menuItems.push({
                  key: 'restore-count-baseline',
                  label: 'Restablecer conteo original',
                  onClick: () =>
                    onChangeCount(
                      record.key,
                      Number(baselineRecordCount),
                    ),
                });
              }
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

const TagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
