import { Modal } from 'antd';
import { DateTime } from 'luxon';
import React from 'react';

import DatePicker from '@/components/DatePicker';
import { CLEAR_SENTINEL } from '@/utils/inventory/constants';

import { formatInputDate } from '../../../../../inventoryTableUtils';

import type { InventoryChild, InventorySource } from '@/utils/inventory/types';

interface SourceExpirationCellProps {
  readOnly: boolean;
  record: InventoryChild;
  source: InventorySource;
  sourceKey: string;
  sourceDateValue: DateTime | null;
  sourceManualExpirationDate?: string | null;
  onChangeExpiration?: (key: string, value: string | null | undefined) => void;
  syncSameLotDates: (
    changedSourceKey: string,
    newDate: string | null | undefined,
    currentSource: InventorySource,
  ) => void;
}

export function SourceExpirationCell({
  readOnly,
  record,
  source,
  sourceKey,
  sourceDateValue,
  sourceManualExpirationDate,
  onChangeExpiration,
  syncSameLotDates,
}: SourceExpirationCellProps) {
  return (
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
              !!sourceManualExpirationDate ||
              !!sourceDateValue;
            if (!hadExisting) {
              onChangeExpiration?.(sourceKey, undefined);
              return;
            }
            if (record.type === 'batch') {
              const prevVal = sourceManualExpirationDate
                ? formatInputDate(sourceManualExpirationDate)
                : formatInputDate(source.expirationDate || record.expirationDate);
              onChangeExpiration?.(sourceKey, undefined);
              Modal.confirm({
                title: 'Eliminar fecha de lote',
                content:
                  'La fecha se quitara de esta partida y todas las partidas del mismo lote. Continuar?',
                okText: 'Si, eliminar',
                cancelText: 'Cancelar',
                okButtonProps: { danger: true },
                onOk: () => {
                  onChangeExpiration?.(sourceKey, CLEAR_SENTINEL);
                  syncSameLotDates(sourceKey, CLEAR_SENTINEL, source);
                },
                onCancel: () => {
                  if (prevVal) {
                    onChangeExpiration?.(sourceKey, prevVal);
                  }
                },
              });
            } else if (record.type === 'noexp') {
              onChangeExpiration?.(sourceKey, undefined);
            }
            return;
          }

          const iso = date.toISODate();
          if (record.type === 'batch') {
            onChangeExpiration?.(sourceKey, iso);
            syncSameLotDates(sourceKey, iso, source);
            return;
          }
          onChangeExpiration?.(sourceKey, iso);
        }}
      />
    </div>
  );
}
