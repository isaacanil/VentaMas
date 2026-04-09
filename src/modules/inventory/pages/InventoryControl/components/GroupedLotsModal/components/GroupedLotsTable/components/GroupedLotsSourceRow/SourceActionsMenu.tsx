import { Button, Dropdown } from 'antd';
import React from 'react';

import { CLEAR_SENTINEL } from '@/utils/inventory/constants';
import {
  formatInputDate,
  getEffectiveCount,
  getPersistedCount,
} from '../../../../../inventoryTableUtils';

import type {
  CountsMap,
  CountsMetaMap,
  ExpirationEditsMap,
  InventoryChild,
  InventorySource,
} from '@/utils/inventory/types';
import type { MenuProps } from 'antd';

interface SourceActionsMenuProps {
  readOnly: boolean;
  record: InventoryChild;
  source: InventorySource;
  sourceKey: string;
  counts: CountsMap;
  countsMeta: CountsMetaMap;
  serverCounts: CountsMap;
  expirationEdits: ExpirationEditsMap;
  baselineCounts: CountsMap;
  stock: number;
  sourceDateValue: unknown;
  srcBaseStr: string;
  onChangeCount: (key: string, value: number) => void;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  syncSameLotDates: (
    changedSourceKey: string,
    newDate: string | null | undefined,
    currentSource: InventorySource,
  ) => void;
}

export function SourceActionsMenu({
  readOnly,
  record,
  source,
  sourceKey,
  counts,
  countsMeta,
  serverCounts,
  expirationEdits,
  baselineCounts,
  stock,
  sourceDateValue,
  srcBaseStr,
  onChangeCount,
  onChangeExpiration,
  syncSameLotDates,
}: SourceActionsMenuProps) {
  if (readOnly) {
    return null;
  }

  const menuItems: NonNullable<MenuProps['items']> = [];
  const originalDate = source.expirationDate || record.expirationDate;
  const srcHasChanged = Boolean(
    countsMeta[sourceKey]?.manualExpirationDate ||
      expirationEdits[sourceKey] !== undefined ||
      (originalDate &&
        formatInputDate(originalDate) !==
          (expirationEdits[sourceKey] ||
            countsMeta[sourceKey]?.manualExpirationDate ||
            '')),
  );

  if (record.type === 'batch' && originalDate) {
    menuItems.push({
      key: 'restore-date',
      label: 'Restablecer fecha de vencimiento original',
      disabled: !srcHasChanged,
      onClick: () => {
        const formattedDate = formatInputDate(originalDate);
        onChangeExpiration?.(sourceKey, formattedDate);
        syncSameLotDates(sourceKey, formattedDate, source);
      },
    });
  }

  const hasCurrentDate = Boolean(sourceDateValue || srcBaseStr);
  if ((record.type === 'batch' || record.type === 'noexp') && hasCurrentDate) {
    if (menuItems.length) menuItems.push({ type: 'divider' });
    menuItems.push({
      key: 'clear-date',
      label: 'Borrar fecha de vencimiento',
      onClick: () => {
        onChangeExpiration?.(sourceKey, CLEAR_SENTINEL);
        syncSameLotDates(sourceKey, CLEAR_SENTINEL, source);
      },
    });
  }

  const persistedSourceCount = getPersistedCount(serverCounts, sourceKey, stock);
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
      onClick: () => onChangeCount(sourceKey, Number(persistedSourceCount)),
    });
  }

  if (canRestoreBaseline) {
    if (!hasEditedSourceCount && menuItems.length) {
      menuItems.push({ type: 'divider' });
    }
    menuItems.push({
      key: 'restore-count-baseline',
      label: 'Restablecer conteo original',
      onClick: () => onChangeCount(sourceKey, Number(baselineSourceCount)),
    });
  }

  if (!menuItems.length) {
    return null;
  }

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button size="small">...</Button>
    </Dropdown>
  );
}
