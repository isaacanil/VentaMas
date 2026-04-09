import { MoreOutlined } from '@/constants/icons/antd';
import { Button, Dropdown, Empty, Table, message } from 'antd';
import { useCallback, useMemo } from 'react';

import { formatPrice } from '@/utils/formatters';
import { formatLocaleDate } from '@/utils/date/dateUtils';

import type {
  ReceivableAuditInvoice,
  ReceivablesLookup,
} from '@/utils/accountsReceivable/types';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

interface InvoiceTableProps {
  invoices: ReceivableAuditInvoice[];
  receivablesMap: ReceivablesLookup;
  loading: boolean;
  pagination: TablePaginationConfig;
  totalItems: number;
  onChangePagination: (pagination: TablePaginationConfig) => void;
  onRecoverInvoice?: (invoiceId: string) => void;
  onRecoverInvoiceInNewTab?: (invoiceId: string) => void;
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
  onRecoverInvoiceInNewTab,
  showRecoveryAction = false,
}: InvoiceTableProps) => {
  const handleCopyId = useCallback((invoiceId: string) => {
    if (!invoiceId) return;
    void Promise.resolve(navigator.clipboard?.writeText(invoiceId)).then(
      () => {
        message.success('ID de factura copiado');
      },
      (error) => {
        console.error('[InvoiceTable] copy invoice id failed', error);
        message.error('No se pudo copiar el ID.');
      },
    );
  }, []);

  const columns: ColumnsType<ReceivableAuditInvoice> = useMemo(
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
        render: (value: number) => formatLocaleDate(value) || 'N/D',
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
        render: (_: unknown, record: ReceivableAuditInvoice) =>
          receivablesMap[record.invoiceId] ? 'Creada' : 'Falta',
      },
      {
        title: '',
        key: 'actions',
        align: 'right',
        render: (_: unknown, record: ReceivableAuditInvoice) => {
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
          if (showRecoveryAction) {
            if (typeof onRecoverInvoice === 'function') {
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
            if (typeof onRecoverInvoiceInNewTab === 'function') {
              items.push({
                key: 'recover-new-tab',
                label: (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.preventDefault();
                      onRecoverInvoiceInNewTab(record.invoiceId);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onRecoverInvoiceInNewTab(record.invoiceId);
                      }
                    }}
                    style={{ display: 'block' }}
                  >
                    Recuperar (Nueva pestaña)
                  </span>
                ),
              });
            }
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
    [
      handleCopyId,
      onRecoverInvoice,
      onRecoverInvoiceInNewTab,
      receivablesMap,
      showRecoveryAction,
    ],
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
