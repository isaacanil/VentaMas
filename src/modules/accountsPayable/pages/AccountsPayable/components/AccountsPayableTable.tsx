import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';
import {
  EyeOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { DollarCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import type { ColumnConfig } from '@/components/ui/AdvancedTable/types/ColumnTypes';
import { formatPrice } from '@/utils/format/formatPrice';

import type {
  AccountsPayableGroupBy,
  AccountsPayableRow,
} from '../utils/accountsPayableDashboard';

interface AccountsPayableTableProps {
  groupBy: AccountsPayableGroupBy;
  loading: boolean;
  onOpenDetail: (row: AccountsPayableRow) => void;
  onOpenPayments: (row: AccountsPayableRow) => void;
  onOpenPurchase: (row: AccountsPayableRow) => void;
  onRegisterPayment: (row: AccountsPayableRow) => void;
  rows: AccountsPayableRow[];
}

const formatDate = (value: number | null) =>
  value ? DateTime.fromMillis(value).toFormat('dd/MM/yyyy') : 'Sin fecha';

const AgingBadge = ({ row }: { row: AccountsPayableRow }) => (
  <AgingPill $tone={row.agingTone}>{row.agingLabel}</AgingPill>
);

const TraceabilityCell = ({ row }: { row: AccountsPayableRow }) => (
  <TraceabilityBlock>
    <strong>{row.traceabilitySummary}</strong>
    <span>Compra {row.reference}</span>
  </TraceabilityBlock>
);

const RowActions = ({
  row,
  onOpenDetail,
  onOpenPayments,
  onOpenPurchase,
  onRegisterPayment,
}: {
  row: AccountsPayableRow;
  onOpenDetail: (row: AccountsPayableRow) => void;
  onOpenPayments: (row: AccountsPayableRow) => void;
  onOpenPurchase: (row: AccountsPayableRow) => void;
  onRegisterPayment: (row: AccountsPayableRow) => void;
}) => {
  const items: MenuProps['items'] = [
    {
      key: 'view-detail',
      icon: <EyeOutlined />,
      label: 'Ver detalle',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenDetail(row);
      },
    },
    {
      key: 'open-purchase',
      icon: <ShoppingCartOutlined />,
      label: 'Abrir compra',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenPurchase(row);
      },
    },
    {
      key: 'view-payments',
      icon: <HistoryOutlined />,
      label: 'Ver pagos',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onOpenPayments(row);
      },
    },
    {
      key: 'register-payment',
      icon: <DollarCircleOutlined />,
      label: 'Registrar pago',
      onClick: ({ domEvent }) => {
        domEvent?.stopPropagation();
        onRegisterPayment(row);
      },
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <ActionButton
        icon={<MoreOutlined />}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        aria-label="Acciones de la cuenta por pagar"
      />
    </Dropdown>
  );
};

const columns: ColumnConfig<AccountsPayableRow>[] = [
  {
    Header: 'Compra',
    accessor: 'reference',
    minWidth: '120px',
    maxWidth: '120px',
  },
  {
    Header: 'Proveedor',
    accessor: 'providerName',
    minWidth: '220px',
  },
  {
    Header: 'Condición',
    accessor: 'conditionLabel',
    minWidth: '120px',
  },
  {
    Header: 'Vence',
    accessor: 'dueAt',
    minWidth: '120px',
    cell: ({ value }) => <span>{formatDate((value as number | null) ?? null)}</span>,
  },
  {
    Header: 'Aging',
    accessor: 'agingLabel',
    minWidth: '180px',
    cell: ({ row }) => <AgingBadge row={row as AccountsPayableRow} />,
  },
  {
    Header: 'Pagado',
    accessor: 'paidAmount',
    minWidth: '130px',
    align: 'right',
    cell: ({ value }) => <span>{formatPrice(Number(value ?? 0))}</span>,
  },
  {
    Header: 'Balance',
    accessor: 'balanceAmount',
    minWidth: '140px',
    align: 'right',
    cell: ({ value }) => <strong>{formatPrice(Number(value ?? 0))}</strong>,
  },
  {
    Header: 'Trazabilidad',
    accessor: 'traceabilitySummary',
    minWidth: '200px',
    cell: ({ row }) => <TraceabilityCell row={row as AccountsPayableRow} />,
  },
];

export const AccountsPayableTable = ({
  groupBy,
  loading,
  onOpenDetail,
  onOpenPayments,
  onOpenPurchase,
  onRegisterPayment,
  rows,
}: AccountsPayableTableProps) => {
  const data = rows.map((row) => ({
    ...row,
    actions: row,
  }));

  const groupedBy =
    groupBy === 'provider'
      ? 'providerGroup'
      : groupBy === 'aging'
        ? 'agingGroup'
        : null;

  const actionColumn: ColumnConfig<AccountsPayableRow> = {
    Header: ' ',
    accessor: 'actions',
    minWidth: '56px',
    maxWidth: '56px',
    keepWidth: true,
    fixed: 'right',
    cell: ({ value }) => (
      <RowActions
        row={value as AccountsPayableRow}
        onOpenDetail={onOpenDetail}
        onOpenPayments={onOpenPayments}
        onOpenPurchase={onOpenPurchase}
        onRegisterPayment={onRegisterPayment}
      />
    ),
  };

  return (
    <AdvancedTable
      columns={[...columns, actionColumn]}
      data={data}
      emptyText="No hay cuentas por pagar para mostrar con esos filtros."
      footerLeftSide={
        <VisibleRowsInfo>{rows.length} registros visibles</VisibleRowsInfo>
      }
      groupBy={groupedBy}
      loading={loading}
      onRowClick={onOpenDetail}
      rowBorder="#e5e7eb"
      rowSize="large"
      showPagination
      tableName="accounts-payable-table"
    />
  );
};

const AgingPill = styled.span<{ $tone: 'danger' | 'warning' | 'neutral' | 'success' }>`
  display: inline-flex;
  width: fit-content;
  padding: 4px 10px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'danger'
      ? 'rgba(255, 77, 79, 0.12)'
      : $tone === 'warning'
        ? 'rgba(250, 173, 20, 0.14)'
        : $tone === 'success'
          ? 'rgba(82, 196, 26, 0.12)'
          : 'rgba(140, 140, 140, 0.12)'};
  color: ${({ $tone }) =>
    $tone === 'danger'
      ? '#cf1322'
      : $tone === 'warning'
        ? '#ad6800'
        : $tone === 'success'
          ? '#389e0d'
          : '#595959'};
  font-size: 12px;
  font-weight: 600;
`;

const TraceabilityBlock = styled.div`
  display: grid;
  gap: 2px;

  strong {
    color: var(--ds-color-text-primary, #111);
  }

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 12px;
  }
`;

const ActionButton = styled(Button)`
  width: 32px;
  min-width: 32px;
  height: 32px;
  padding-inline: 0;
  justify-content: center;
`;

const VisibleRowsInfo = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--ds-color-text-secondary, #666);
  white-space: nowrap;
`;
