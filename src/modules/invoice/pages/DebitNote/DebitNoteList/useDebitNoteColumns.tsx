import { EyeOutlined, SyncOutlined } from '@/constants/icons/antd';
import { Button, Space, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';

import {
  DEBIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS_COLOR,
  DEBIT_NOTE_STATUS_LABEL,
} from '@/constants/debitNoteStatus';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import {
  resolveElectronicTaxReceiptStatusColor,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import { toDebitNoteDate } from './debitNoteListUtils';

import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/types/AdvancedTableTypes';
import type {
  DebitNoteRecord,
  DebitNoteStatus,
} from '@/modules/invoice/types/debitNote';

type DebitNoteTableRow = DebitNoteRecord & { actions: DebitNoteRecord };

export const useDebitNoteColumns = ({
  debitNotes,
  onView,
  onRefreshElectronicStatus,
  refreshingDebitNoteId,
}: {
  debitNotes: DebitNoteRecord[];
  onView: (record: DebitNoteRecord) => void;
  onRefreshElectronicStatus: (record: DebitNoteRecord) => void;
  refreshingDebitNoteId?: string | null;
}) =>
  useMemo<AdvancedTableColumn<DebitNoteTableRow>[]>(
    () => [
      {
        Header: 'Fecha',
        accessor: 'createdAt',
        minWidth: '120px',
        maxWidth: '150px',
        sortable: true,
        cell: ({ value }) => {
          if (!value) return '-';
          const date = toDebitNoteDate(value as DebitNoteRecord['createdAt']);
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
        minWidth: '130px',
        maxWidth: '170px',
        sortable: true,
        cell: ({ value }) => {
          const ncf = typeof value === 'string' ? value : undefined;
          const record = debitNotes.find((note) => note.ncf === ncf);
          return (
            <div>
              <div style={{ fontWeight: 600 }}>{ncf || 'N/A'}</div>
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
        cell: ({ value }) => {
          const client = value as DebitNoteRecord['client'];
          return (
            <div>
              <div>{client?.name || '-'}</div>
              {client?.rnc && (
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  RNC: {client.rnc}
                </div>
              )}
            </div>
          );
        },
      },
      {
        Header: 'NCF Afectado',
        accessor: 'invoiceNcf',
        minWidth: '150px',
        maxWidth: '180px',
        sortable: true,
        cell: ({ value }) => {
          const invoiceNcf =
            typeof value === 'string' || typeof value === 'number'
              ? value
              : null;
          return (
            <div style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
              {invoiceNcf || 'N/A'}
            </div>
          );
        },
      },
      {
        Header: 'Estado',
        accessor: 'status',
        minWidth: '110px',
        maxWidth: '140px',
        align: 'center',
        cell: ({ value, row }) => {
          const status =
            typeof value === 'string'
              ? (value as DebitNoteStatus | string)
              : DEBIT_NOTE_STATUS.ISSUED;
          const electronicStatusLabel = resolveElectronicTaxReceiptStatusLabel(
            row?.electronicTaxReceipt,
          );
          return (
            <Tag
              color={
                electronicStatusLabel
                  ? resolveElectronicTaxReceiptStatusColor(
                      row?.electronicTaxReceipt,
                    )
                  : DEBIT_NOTE_STATUS_COLOR[
                      status as keyof typeof DEBIT_NOTE_STATUS_COLOR
                    ] || 'default'
              }
            >
              {electronicStatusLabel ||
                DEBIT_NOTE_STATUS_LABEL[
                  status as keyof typeof DEBIT_NOTE_STATUS_LABEL
                ] ||
                status}
            </Tag>
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
        cell: ({ value }) => {
          const totalAmount = typeof value === 'number' ? value : 0;
          return (
            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {formatPrice(totalAmount)}
            </div>
          );
        },
      },
      {
        Header: 'Acciones',
        accessor: 'actions',
        minWidth: '120px',
        maxWidth: '150px',
        align: 'right',
        keepWidth: true,
        clickable: false,
        cell: ({ value }) => {
          const actionValue = value as DebitNoteRecord;
          const record =
            debitNotes.find((note) => note.id === actionValue?.id) ||
            actionValue;
          const hasSubmissionId = Boolean(
            record.electronicTaxReceipt?.submissionId,
          );
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
              {hasSubmissionId && (
                <Tooltip title="Consultar e-CF">
                  <Button
                    icon={<SyncOutlined />}
                    loading={refreshingDebitNoteId === String(record.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRefreshElectronicStatus(record);
                    }}
                  />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
    ],
    [debitNotes, onRefreshElectronicStatus, onView, refreshingDebitNoteId],
  );
