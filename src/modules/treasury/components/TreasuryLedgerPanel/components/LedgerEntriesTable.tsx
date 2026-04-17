import { Empty, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import styled from 'styled-components';

import type { LiquidityLedgerEntry } from '@/types/accounting';
import { formatDate, formatMoney, humanizeSourceType } from '../utils/formatters';

interface LedgerEntriesTableProps {
  currency: string;
  entries: LiquidityLedgerEntry[];
}

const buildColumns = (currency: string): ColumnsType<LiquidityLedgerEntry> => [
  {
    dataIndex: 'occurredAt',
    key: 'occurredAt',
    title: 'Fecha',
    width: 120,
    render: (value: unknown) => formatDate(value),
  },
  {
    dataIndex: 'description',
    key: 'description',
    title: 'Movimiento',
    render: (_value: unknown, record: LiquidityLedgerEntry) => (
      <MovementCell>
        <MovementTitle>
          {record.description || record.reference || 'Movimiento'}
        </MovementTitle>
        <MovementMeta>
          {record.reference || humanizeSourceType(record.sourceType)}
        </MovementMeta>
      </MovementCell>
    ),
  },
  {
    dataIndex: 'sourceType',
    key: 'sourceType',
    title: 'Origen',
    width: 190,
    render: (value: LiquidityLedgerEntry['sourceType']) => (
      <SourcePill>{humanizeSourceType(value)}</SourcePill>
    ),
  },
  {
    dataIndex: 'direction',
    key: 'direction',
    title: 'Tipo',
    width: 120,
    render: (value: LiquidityLedgerEntry['direction']) => (
      <DirectionPill $direction={value}>
        {value === 'out' ? 'Salida' : 'Entrada'}
      </DirectionPill>
    ),
  },
  {
    dataIndex: 'amount',
    key: 'amount',
    title: 'Monto',
    align: 'right',
    width: 160,
    render: (_value: unknown, record: LiquidityLedgerEntry) => (
      <AmountText $negative={record.direction === 'out'}>
        {record.direction === 'out' ? '-' : '+'}
        {formatMoney(record.amount, currency)}
      </AmountText>
    ),
  },
];

export const LedgerEntriesTable = ({
  currency,
  entries,
}: LedgerEntriesTableProps) => (
  <TableShell>
    <TableHeader>
      <SectionTitle>Movimientos</SectionTitle>
      <SectionCaption>
        Lectura operativa del ledger de liquidez de esta cuenta.
      </SectionCaption>
    </TableHeader>

    <Table<LiquidityLedgerEntry>
      rowKey="id"
      columns={buildColumns(currency)}
      dataSource={entries}
      pagination={false}
      size="small"
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Sin movimientos registrados."
          />
        ),
      }}
      scroll={{ y: 420 }}
    />
  </TableShell>
);

const TableShell = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ds-space-3);
  min-width: 0;
  min-height: 100%;

  .ant-table-wrapper {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .ant-spin-nested-loading,
  .ant-spin-container,
  .ant-table,
  .ant-table-container {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .ant-table-body {
    flex: 1;
  }
`;

const TableHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const SectionCaption = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const MovementCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const MovementTitle = styled.span`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const MovementMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const SourcePill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--ds-space-2);
  border-radius: 999px;
  background: var(--ds-color-fill-tertiary);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const DirectionPill = styled.span<{ $direction: LiquidityLedgerEntry['direction'] }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 var(--ds-space-2);
  border-radius: 999px;
  background: ${({ $direction }) =>
    $direction === 'out'
      ? 'var(--ds-color-state-dangerSubtle)'
      : 'var(--ds-color-state-successSubtle)'};
  color: ${({ $direction }) =>
    $direction === 'out'
      ? 'var(--ds-color-state-dangerText)'
      : 'var(--ds-color-state-successText)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const AmountText = styled.span<{ $negative: boolean }>`
  display: block;
  width: 100%;
  text-align: right;
  color: ${({ $negative }) =>
    $negative
      ? 'var(--ds-color-state-dangerText)'
      : 'var(--ds-color-state-successText)'};
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;
