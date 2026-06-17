import {
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  SyncOutlined,
} from '@/constants/icons/antd';
import { Button, Space, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';

import {
  CREDIT_NOTE_STATUS,
  CREDIT_NOTE_STATUS_COLOR,
  CREDIT_NOTE_STATUS_LABEL,
} from '@/constants/creditNoteStatus';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';
import {
  resolveElectronicTaxReceiptStatusColor,
  resolveElectronicTaxReceiptStatusLabel,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import { canEditCreditNoteRecord, toCreditNoteDate } from './creditNoteListUtils';

import type { AdvancedTableColumn } from '@/components/ui/AdvancedTable/types/AdvancedTableTypes';
import type {
  CreditNoteRecord,
  CreditNoteStatus,
} from '@/types/creditNote';

type CreditNoteTableRow = CreditNoteRecord & { actions: CreditNoteRecord };

export const useCreditNoteColumns = ({
  creditNotes,
  onView,
  onEdit,
  onRefreshElectronicStatus,
  refreshingCreditNoteId,
}: {
  creditNotes: CreditNoteRecord[];
  onView: (record: CreditNoteRecord) => void;
  onEdit: (record: CreditNoteRecord) => void;
  onRefreshElectronicStatus: (record: CreditNoteRecord) => void;
  refreshingCreditNoteId?: string | null;
}) =>
  useMemo<AdvancedTableColumn<CreditNoteTableRow>[]>(
    () => [
      {
        Header: 'Fecha',
        accessor: 'createdAt',
        minWidth: '120px',
        maxWidth: '150px',
        sortable: true,
        cell: ({ value }) => {
          if (!value) return '-';
          const date = toCreditNoteDate(value as CreditNoteRecord['createdAt']);
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
        cell: ({ value }) => {
          const ncf = typeof value === 'string' ? value : undefined;
          const record = creditNotes.find((cn) => cn.ncf === ncf);
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
          const client = value as CreditNoteRecord['client'];
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
        Header: 'Items',
        accessor: 'items',
        minWidth: '80px',
        maxWidth: '100px',
        align: 'center',
        cell: ({ value }) => {
          const items = Array.isArray(value)
            ? (value as CreditNoteRecord['items'])
            : [];
          return <Tag color="blue">{items?.length || 0} items</Tag>;
        },
      },
      {
        Header: 'Estado de Uso',
        accessor: 'status',
        minWidth: '100px',
        maxWidth: '120px',
        align: 'center',
        cell: ({ value, row }) => {
          const status =
            typeof value === 'string' ? (value as CreditNoteStatus) : undefined;
          const electronicStatusLabel = resolveElectronicTaxReceiptStatusLabel(
            row?.electronicTaxReceipt,
          );
          const usageStatusTag =
            status === CREDIT_NOTE_STATUS.ELECTRONIC_PENDING ||
            status === CREDIT_NOTE_STATUS.ELECTRONIC_FAILED
              ? (
                <Tag color={CREDIT_NOTE_STATUS_COLOR[status]}>
                  {CREDIT_NOTE_STATUS_LABEL[status]}
                </Tag>
                )
              : null;
          const totalAmount = row?.totalAmount ?? 0;
          const hasApplications =
            status === CREDIT_NOTE_STATUS.APPLIED ||
            status === CREDIT_NOTE_STATUS.FULLY_USED ||
            (row?.availableAmount !== undefined &&
              row.availableAmount < totalAmount);

          const useStatusTag =
            usageStatusTag ||
            (hasApplications ? (
              <Tag color="green">
                {status === CREDIT_NOTE_STATUS.FULLY_USED
                  ? 'Totalmente Usada'
                  : 'Parcialmente Usada'}
              </Tag>
            ) : (
              <Tag color="default">Sin Aplicar</Tag>
            ));

          if (!electronicStatusLabel) return useStatusTag;

          return (
            <Space direction="vertical" size={4}>
              {useStatusTag}
              <Tag
                color={resolveElectronicTaxReceiptStatusColor(
                  row?.electronicTaxReceipt,
                )}
              >
                {electronicStatusLabel}
              </Tag>
            </Space>
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
        cell: ({ value, row }) => {
          const totalAmount = typeof value === 'number' ? value : 0;
          const availableAmount = row?.availableAmount ?? totalAmount;
          return (
            <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              <div>{formatPrice(totalAmount)}</div>
              {availableAmount !== totalAmount && (
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
        cell: ({ value }) => {
          const actionValue = value as CreditNoteRecord;
          const record =
            creditNotes.find((cn) => cn.id === actionValue?.id) || actionValue;
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
              {hasSubmissionId && (
                <Tooltip title="Consultar e-CF">
                  <Button
                    icon={<SyncOutlined />}
                    loading={refreshingCreditNoteId === String(record.id)}
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
    [creditNotes, onEdit, onRefreshElectronicStatus, onView, refreshingCreditNoteId],
  );
