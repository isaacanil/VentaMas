import { Button, Dropdown, Empty, Tag, Typography } from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  RetweetOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { DateTime } from 'luxon';
import styled from 'styled-components';
import type { MenuProps } from 'antd';

import type { BankReconciliationRecord } from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { toMillis } from '@/utils/firebase/toTimestamp';

const { Text } = Typography;

interface TreasuryAccountGridProps {
  currentBalancesByAccountKey: Record<string, number>;
  latestReconciliationsByBankAccountId: Record<string, BankReconciliationRecord>;
  onConfigureAccount: (account: TreasuryLiquidityAccount) => void;
  onOpenReconciliation: (account: TreasuryLiquidityAccount) => void;
  onOpenTransfer: (account: TreasuryLiquidityAccount) => void;
  onToggleAccountStatus: (account: TreasuryLiquidityAccount) => void;
  onSelectAccount: (account: TreasuryLiquidityAccount) => void;
  accounts: TreasuryLiquidityAccount[];
  selectedAccountKey?: string | null;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const getAccountTitle = (account: TreasuryLiquidityAccount) => account.source.name;

const getAccountMetaLine = (account: TreasuryLiquidityAccount) => {
  if (account.kind === 'bank') {
    const details = [
      account.institutionName,
      account.source.accountNumberLast4
        ? `****${account.source.accountNumberLast4}`
        : null,
    ].filter(Boolean);

    return details.join(' · ') || 'Cuenta bancaria';
  }

  return account.location || 'Cuenta de caja';
};

export const TreasuryAccountGrid = ({
  currentBalancesByAccountKey,
  latestReconciliationsByBankAccountId,
  onConfigureAccount,
  onOpenReconciliation,
  onOpenTransfer,
  onToggleAccountStatus,
  onSelectAccount,
  accounts,
  selectedAccountKey,
}: TreasuryAccountGridProps) => {
  if (!accounts.length) {
    return (
      <EmptyState>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Todavía no hay cuentas bancarias ni de caja."
        />
      </EmptyState>
    );
  }

  return (
    <Grid>
      {accounts.map((account) => {
        const currentBalance = currentBalancesByAccountKey[account.key] ?? 0;
        const latestReconciliation =
          account.kind === 'bank'
            ? latestReconciliationsByBankAccountId[account.id]
            : null;
        const reconciliationDate = latestReconciliation?.statementDate
          ? DateTime.fromMillis(
              toMillis(latestReconciliation.statementDate as never) ?? 0,
            ).toFormat('dd/MM/yyyy')
          : null;
        const isSelected = selectedAccountKey === account.key;
        const menuItems: MenuProps['items'] = [
          {
            key: 'configure',
            label: 'Configurar',
          },
          {
            key: 'toggle-status',
            label: account.status === 'active' ? 'Desactivar' : 'Activar',
          },
        ];

        return (
          <Card
            key={account.key}
            $selected={isSelected}
            onClick={() => onSelectAccount(account)}
          >
            <TopRow>
              <Identity>
                <IconBadge $kind={account.kind}>
                  {account.kind === 'bank' ? <BankOutlined /> : <WalletOutlined />}
                </IconBadge>
                <IdentityCopy>
                  <CardTitle>{getAccountTitle(account)}</CardTitle>
                  <MetaLine>{getAccountMetaLine(account)}</MetaLine>
                </IdentityCopy>
              </Identity>

              <StatusGroup>
                {account.status === 'inactive' ? (
                  <Tag color="default">Inactiva</Tag>
                ) : null}
              </StatusGroup>
            </TopRow>

            <BalanceBlock>
              <BalanceLabel>Balance operativo</BalanceLabel>
              <BalanceValue>{formatMoney(currentBalance, account.currency)}</BalanceValue>
            </BalanceBlock>

            <MetaSummary>
              <MetaItem>
                <MetaName>Tipo</MetaName>
                <MetaValue>{account.kind === 'bank' ? 'Banco' : 'Caja'}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaName>Moneda</MetaName>
                <MetaValue>{account.currency}</MetaValue>
              </MetaItem>
              <MetaItem>
                <MetaName>Última conciliación</MetaName>
                <MetaValue>
                  {account.kind === 'cash'
                    ? 'No aplica'
                    : reconciliationDate || 'Pendiente'}
                </MetaValue>
              </MetaItem>
            </MetaSummary>

            <ActionsRow>
              <Button onClick={(event) => {
                event.stopPropagation();
                onOpenTransfer(account);
              }}>
                <RetweetOutlined /> Transferir
              </Button>
              {account.kind === 'bank' ? (
                <Button onClick={(event) => {
                  event.stopPropagation();
                  onOpenReconciliation(account);
                }}>
                  <CheckCircleOutlined /> Conciliar
                </Button>
              ) : null}
              <Dropdown
                menu={{
                  items: menuItems,
                  onClick: ({ key, domEvent }) => {
                    domEvent.stopPropagation();

                    if (key === 'configure') {
                      onConfigureAccount(account);
                      return;
                    }

                    if (key === 'toggle-status') {
                      onToggleAccountStatus(account);
                    }
                  },
                }}
                trigger={['click']}
              >
                <Button
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreOutlined />
                </Button>
              </Dropdown>
            </ActionsRow>
          </Card>
        );
      })}
    </Grid>
  );
};

const EmptyState = styled.div`
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-6);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--ds-space-3);
`;

const Card = styled.article<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid
    ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-brand-primary)'
        : 'var(--ds-color-border-default)'};
  background: var(--ds-color-bg-surface);
  box-shadow: ${({ $selected }) =>
    $selected ? 'var(--ds-shadow-sm)' : 'none'};
  cursor: pointer;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const Identity = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  min-width: 0;
`;

const IconBadge = styled.div<{ $kind: 'bank' | 'cash' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${({ $kind }) =>
    $kind === 'bank'
      ? 'var(--ds-color-fill-secondary)'
      : 'var(--ds-color-fill-tertiary)'};
  color: var(--ds-color-text-primary);
  font-size: 16px;
`;

const IdentityCopy = styled.div`
  min-width: 0;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const MetaLine = styled(Text).attrs({ type: 'secondary' })`
  && {
    display: block;
    margin-top: 2px;
    font-size: var(--ds-font-size-sm);
  }
`;

const StatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const BalanceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BalanceLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ds-color-text-secondary);
`;

const BalanceValue = styled.span`
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const MetaSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-2);
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const MetaName = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const MetaValue = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-primary);
`;

const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;
