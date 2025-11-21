import { Button, Dropdown, Empty, Table, message } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useCallback, useMemo } from 'react';

import type { ReceivableInvoice, ReceivablesLookup } from '../types';
import { formatDate, formatPrice } from '../utils/formatters';

interface InvoiceTableProps {
  invoices: ReceivableInvoice[];
  receivablesMap: ReceivablesLookup;
  loading: boolean;
  pagination: TablePaginationConfig;
  totalItems: number;
  onChangePagination: (pagination: TablePaginationConfig) => void;
  onRecoverInvoice?: (invoiceId: string) => void;
  showRecoveryAction?: boolean;
}

export const InvoiceTable = ({
  invoices,
  receivablesMap,
  loading,
  pagination,
  totalItems,
  onChangePagination,
  onRecoverInvoice,
  showRecoveryAction = false,
}: InvoiceTableProps) => {
  const handleCopyId = useCallback(async (invoiceId: string) => {
    if (!invoiceId) return;
    try {
      await navigator.clipboard?.writeText(invoiceId);
      message.success('ID de factura copiado');
    } catch (err) {
      console.error('[InvoiceTable] copy invoice id failed', err);
      message.error('No se pudo copiar el ID.');
    }
  }, []);

  const columns: ColumnsType<ReceivableInvoice> = useMemo(
    () => [
      {
        title: 'Número',
        dataIndex: 'number',
        key: 'number',
        render: (value: string | number | null) => value ?? 'N/D',
      },
      { title: 'Cliente', dataIndex: 'clientName', key: 'clientName' },
      {
        title: 'NCF',
        dataIndex: 'ncf',
        key: 'ncf',
        render: (value: string | null) => value || 'N/D',
      },
      {
        title: 'Total',
        dataIndex: 'totalAmount',
        key: 'totalAmount',
        render: (value: number) => formatPrice(value),
        align: 'right',
      },
      {
        title: 'Fecha',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: number) => formatDate(value),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        render: (value: string | null) => value || 'N/D',
      },
      {
        title: 'CxC',
        key: 'receivableStatus',
        render: (_: unknown, record: ReceivableInvoice) =>
          receivablesMap[record.invoiceId] ? 'Creada' : 'Falta',
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_: unknown, record: ReceivableInvoice) => {
          const items = [
            {
              key: 'copy',
              label: (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleCopyId(record.invoiceId);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void handleCopyId(record.invoiceId);
                    }
                  }}
                  style={{ display: 'block' }}
                >
                  Copiar ID de factura
                </span>
              ),
            },
          ];
          if (showRecoveryAction && typeof onRecoverInvoice === 'function') {
            items.push({
              key: 'recover',
              label: (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.preventDefault();
                    onRecoverInvoice(record.invoiceId);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRecoverInvoice(record.invoiceId);
                    }
                  }}
                  style={{ display: 'block' }}
                >
                  Recuperar (Dev)
                </span>
              ),
            });
          }
          return (
            <Dropdown menu={{ items }} trigger={['click']}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                style={{ display: 'flex', alignItems: 'center' }}
              />
            </Dropdown>
          );
        },
      },
    ],
    [handleCopyId, onRecoverInvoice, receivablesMap, showRecoveryAction],
  );

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={invoices}
      rowKey={(record) => record.invoiceId}
      loading={loading}
      pagination={{
        ...pagination,
        total: totalItems,
        showSizeChanger: false,
      }}
      onChange={(paginationState) => onChangePagination(paginationState)}
      locale={{ emptyText: <Empty description="Sin registros" /> }}
    />
  );
};
