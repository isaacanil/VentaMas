import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
} from '@/constants/icons/antd';
import { Button, Space, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';

import { CREDIT_NOTE_STATUS } from '@/constants/creditNoteStatus';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';

import { canEditCreditNoteRecord, toCreditNoteDate } from './creditNoteListUtils';

import type {
  CreditNoteRecord,
  CreditNoteStatus,
} from '@/types/creditNote';

type CellProps<T> = {
  value: T;
};

export const useCreditNoteColumns = ({
  creditNotes,
  onView,
  onEdit,
}: {
  creditNotes: CreditNoteRecord[];
  onView: (record: CreditNoteRecord) => void;
  onEdit: (record: CreditNoteRecord) => void;
}) =>
  useMemo(
    () => [
      {
        Header: 'Fecha',
        accessor: 'createdAt',
        minWidth: '120px',
        maxWidth: '150px',
        sortable: true,
        cell: ({ value }: CellProps<CreditNoteRecord['createdAt']>) => {
          if (!value) return '-';
          const date = toCreditNoteDate(value);
          return (
            <div>
              <div>{formatLocaleDate(date)}</div>
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                {date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          );
        },
      },
      {
        Header: 'Numero',
        accessor: 'ncf',
        minWidth: '120px',
        maxWidth: '150px',
        sortable: true,
        cell: ({ value }: CellProps<string | undefined>) => {
          const record = creditNotes.find((cn) => cn.ncf === value);
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{value || 'N/A'}</div>
              {record?.number && (
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  Ref: {record.number}
                </div>
              )}
            </div>
          );
        },
      },
      {
        Header: 'Cliente',
        accessor: 'client',
        minWidth: '200px',
        sortable: true,
        cell: ({ value }: CellProps<CreditNoteRecord['client']>) => (
          <div>
            <div>{value?.name || '-'}</div>
            {value?.rnc && (
              <div style={{ fontSize: '0.8em', color: '#666' }}>
                RNC: {value.rnc}
              </div>
            )}
          </div>
        ),
      },
      {
        Header: 'NCF Afectado',
        accessor: 'invoiceNcf',
        minWidth: '150px',
        maxWidth: '180px',
        sortable: true,
        cell: ({ value }: CellProps<string | number | undefined>) => (
          <div style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
            {value || 'N/A'}
          </div>
        ),
      },
      {
        Header: 'Items',
        accessor: 'items',
        minWidth: '80px',
        maxWidth: '100px',
        align: 'center',
        cell: ({ value }: CellProps<CreditNoteRecord['items']>) => (
          <Tag color="blue">{value?.length || 0} items</Tag>
        ),
      },
      {
        Header: 'Estado de Uso',
        accessor: 'status',
        minWidth: '100px',
        maxWidth: '120px',
        align: 'center',
        cell: ({ value }: CellProps<CreditNoteStatus | undefined>) => {
          const record = creditNotes.find((cn) => cn.status === value);
          const hasApplications =
            value === CREDIT_NOTE_STATUS.APPLIED ||
            value === CREDIT_NOTE_STATUS.FULLY_USED ||
            (record?.availableAmount !== undefined &&
              record.availableAmount < record.totalAmount);

          return hasApplications ? (
            <Tag color="green">
              {value === CREDIT_NOTE_STATUS.FULLY_USED
                ? 'Totalmente Usada'
                : 'Parcialmente Usada'}
            </Tag>
          ) : (
            <Tag color="default">Sin Aplicar</Tag>
          );
        },
      },
      {
        Header: 'Monto',
        accessor: 'totalAmount',
        minWidth: '120px',
        maxWidth: '150px',
        align: 'right',
        sortable: true,
        cell: ({ value }: CellProps<number | undefined>) => {
          const record = creditNotes.find((cn) => cn.totalAmount === value);
          const availableAmount = record?.availableAmount ?? value;
          return (
            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              <div>{formatPrice(value || 0)}</div>
              {availableAmount !== value && (
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  Disponible: {formatPrice(availableAmount)}
                </div>
              )}
            </div>
          );
        },
      },
      {
        Header: 'Acciones',
        accessor: 'actions',
        minWidth: '150px',
        maxWidth: '180px',
        align: 'right',
        keepWidth: true,
        clickable: false,
        cell: ({ value }: CellProps<CreditNoteRecord>) => {
          const record = creditNotes.find((cn) => cn.id === value?.id) || value;
          return (
            <Space size="small">
              <Tooltip title="Ver">
                <Button
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(record);
                  }}
                />
              </Tooltip>
              {canEditCreditNoteRecord(record) ? (
                <Tooltip title="Editar">
                  <Button
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip
                  title={
                    record.status === CREDIT_NOTE_STATUS.APPLIED ||
                    record.status === CREDIT_NOTE_STATUS.FULLY_USED ||
                    (record.availableAmount !== undefined &&
                      record.availableAmount < record.totalAmount)
                      ? 'No se puede editar: nota ya aplicada'
                      : 'Edicion deshabilitada (fuera de plazo)'
                  }
                >
                  <Button icon={<LockOutlined />} disabled />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
    ],
    [creditNotes, onEdit, onView],
  );
