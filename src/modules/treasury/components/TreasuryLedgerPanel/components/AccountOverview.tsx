import { Button, Empty } from 'antd';
import { CheckCircleOutlined, RetweetOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { formatDate, formatMoney } from '../utils/formatters';

interface AccountOverviewProps {
  account: TreasuryLiquidityAccount | null;
  currentBalance: number;
  inflow: number;
  lastMovementAt: unknown;
  latestReconciliationDate?: unknown;
  onOpenReconciliation?: () => void;
  onOpenTransfer?: () => void;
  outflow: number;
}

export const AccountOverview = ({
  account,
  currentBalance,
  inflow,
  lastMovementAt,
  latestReconciliationDate,
  onOpenReconciliation,
  onOpenTransfer,
  outflow,
}: AccountOverviewProps) => {
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

  return (
    <Hero>
      <IdentityBlock>
        <TitleRow>
          <IdentityTitle>{account.label}</IdentityTitle>
          {account.status === 'inactive' ? (
            <StatusPill>Inactiva</StatusPill>
          ) : null}
        </TitleRow>
        <IdentityMeta>
          {account.kind === 'bank' ? 'Cuenta bancaria' : 'Cuenta de caja'} ·{' '}
          {account.currency}
        </IdentityMeta>
      </IdentityBlock>

      <ActionCluster>
        <Button icon={<RetweetOutlined />} onClick={onOpenTransfer}>
          Transferir
        </Button>
        {account.kind === 'bank' ? (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={onOpenReconciliation}
          >
            Conciliar
          </Button>
        ) : null}
      </ActionCluster>

      <StatsGrid>
        <StatCard>
          <StatLabel>Balance actual</StatLabel>
          <PrimaryValue>{formatMoney(currentBalance, account.currency)}</PrimaryValue>
        </StatCard>
        <StatCard>
          <StatLabel>Entradas registradas</StatLabel>
          <PositiveValue>{formatMoney(inflow, account.currency)}</PositiveValue>
        </StatCard>
        <StatCard>
          <StatLabel>Salidas registradas</StatLabel>
          <NegativeValue>{formatMoney(outflow, account.currency)}</NegativeValue>
        </StatCard>
        <StatCard>
          <StatLabel>Último control</StatLabel>
          <StatValue>
            {account.kind === 'bank'
              ? latestReconciliationDate
                ? formatDate(latestReconciliationDate)
                : 'Pendiente'
              : lastMovementAt
                ? formatDate(lastMovementAt)
                : 'Sin actividad'}
          </StatValue>
        </StatCard>
      </StatsGrid>
    </Hero>
  );
};

const EmptyShell = styled.div`
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-6);
`;

const Hero = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background:
    linear-gradient(
      180deg,
      var(--ds-color-fill-tertiary) 0%,
      var(--ds-color-bg-surface) 100%
    );

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const IdentityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const IdentityTitle = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-2xl);
  line-height: 1.1;
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 var(--ds-space-2);
  border-radius: 999px;
  background: var(--ds-color-fill-tertiary);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const IdentityMeta = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const ActionCluster = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 110px;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const StatLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ds-color-text-secondary);
`;

const PrimaryValue = styled.span`
  color: var(--ds-color-text-primary);
  font-size: clamp(1.2rem, 1.8vw, 1.65rem);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
`;

const StatValue = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;

const PositiveValue = styled(StatValue)`
  color: var(--ds-color-state-successText);
`;

const NegativeValue = styled(StatValue)`
  color: var(--ds-color-state-dangerText);
`;
