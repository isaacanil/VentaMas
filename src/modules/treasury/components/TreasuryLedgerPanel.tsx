import { Empty, Table, Tag, Timeline, Typography } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import type {
  BankReconciliationRecord,
  InternalTransfer,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { toMillis } from '@/utils/firebase/toTimestamp';

const { Text } = Typography;

interface TreasuryLedgerPanelProps {
  account: TreasuryLiquidityAccount | null;
  currentBalance: number;
  ledgerEntries: LiquidityLedgerEntry[];
  reconciliations: BankReconciliationRecord[];
  transfers: InternalTransfer[];
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: unknown) => {
  const millis = toMillis(value as never);
  if (!millis) return 'Sin fecha';
  return DateTime.fromMillis(millis).setLocale('es').toFormat('dd/MM/yyyy');
};

export const TreasuryLedgerPanel = ({
  account,
  currentBalance,
  ledgerEntries,
  reconciliations,
  transfers,
}: TreasuryLedgerPanelProps) => {
  if (!account) {
    return (
      <EmptyShell>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Selecciona una cuenta para revisar su actividad."
        />
      </EmptyShell>
    );
  }

  const ledgerColumns = [
    {
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      title: 'Fecha',
      width: 110,
      render: (value: unknown) => formatDate(value),
    },
    {
      dataIndex: 'description',
      key: 'description',
      title: 'Detalle',
      render: (_value: unknown, record: LiquidityLedgerEntry) =>
        record.description || record.reference || 'Movimiento',
    },
    {
      dataIndex: 'sourceType',
      key: 'sourceType',
      title: 'Origen',
      width: 150,
      render: (value: LiquidityLedgerEntry['sourceType']) => (
        <Tag>{value.replaceAll('_', ' ')}</Tag>
      ),
    },
    {
      dataIndex: 'amount',
      key: 'amount',
      title: 'Monto',
      align: 'right' as const,
      width: 150,
      render: (_value: unknown, record: LiquidityLedgerEntry) => (
        <AmountText $negative={record.direction === 'out'}>
          {record.direction === 'out' ? '-' : '+'}
          {formatMoney(record.amount, account.currency)}
        </AmountText>
      ),
    },
  ];

  return (
    <Panel>
      <Header>
        <div>
          <PanelTitle>{account.label}</PanelTitle>
          <PanelMeta>
            {account.kind === 'bank' ? 'Cuenta bancaria' : 'Cuenta de caja'} ·{' '}
            {account.currency}
          </PanelMeta>
        </div>
        <BalanceBlock>
          <BalanceLabel>Balance actual</BalanceLabel>
          <BalanceValue>{formatMoney(currentBalance, account.currency)}</BalanceValue>
        </BalanceBlock>
      </Header>

      <Section>
        <SectionTitle>Ledger</SectionTitle>
        <Table<LiquidityLedgerEntry>
          rowKey="id"
          columns={ledgerColumns}
          dataSource={ledgerEntries}
          pagination={false}
          size="small"
          locale={{ emptyText: 'Sin movimientos registrados.' }}
          scroll={{ y: 280 }}
        />
      </Section>

      <BottomGrid>
        <Section>
          <SectionTitle>Transferencias</SectionTitle>
          {transfers.length ? (
            <Timeline
              items={transfers.map((transfer) => ({
                children: (
                  <TimelineItem>
                    <div>
                      <strong>{formatDate(transfer.occurredAt)}</strong>
                    </div>
                    <div>{formatMoney(transfer.amount, transfer.currency)}</div>
                    <Text type="secondary">
                      {transfer.reference || transfer.notes || 'Transferencia interna'}
                    </Text>
                  </TimelineItem>
                ),
              }))}
            />
          ) : (
            <SmallEmpty>Sin transferencias recientes.</SmallEmpty>
          )}
        </Section>

        <Section>
          <SectionTitle>Conciliaciones</SectionTitle>
          {account.kind === 'cash' ? (
            <SmallEmpty>La conciliación aplica a cuentas bancarias.</SmallEmpty>
          ) : reconciliations.length ? (
            <Timeline
              items={reconciliations.map((reconciliation) => ({
                color: reconciliation.status === 'balanced' ? 'green' : 'orange',
                children: (
                  <TimelineItem>
                    <div>
                      <strong>{formatDate(reconciliation.statementDate)}</strong>
                    </div>
                    <div>
                      Estado banco:{' '}
                      {formatMoney(
                        reconciliation.statementBalance,
                        account.currency,
                      )}
                    </div>
                    <Text type="secondary">
                      Variación:{' '}
                      {formatMoney(reconciliation.variance, account.currency)}
                    </Text>
                  </TimelineItem>
                ),
              }))}
            />
          ) : (
            <SmallEmpty>Sin conciliaciones registradas.</SmallEmpty>
          )}
        </Section>
      </BottomGrid>
    </Panel>
  );
};

const EmptyShell = styled.div`
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-6);
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-4);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const PanelMeta = styled.p`
  margin: 4px 0 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const BalanceBlock = styled.div`
  text-align: right;
`;

const BalanceLabel = styled.span`
  display: block;
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const BalanceValue = styled.span`
  display: block;
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const TimelineItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SmallEmpty = styled.div`
  padding: var(--ds-space-4);
  border: 1px dashed var(--ds-color-border-default);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
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
