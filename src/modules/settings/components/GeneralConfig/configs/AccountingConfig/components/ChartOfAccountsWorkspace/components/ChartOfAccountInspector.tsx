import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ChartOfAccount } from '@/types/accounting';
import {
  CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS,
  CHART_OF_ACCOUNT_TYPE_LABELS,
  buildChartOfAccountLabel,
} from '@/utils/accounting/chartOfAccounts';

interface ChartOfAccountInspectorProps {
  account: ChartOfAccount | null;
  childAccounts: ChartOfAccount[];
  childCount: number;
  depth: number;
  loading: boolean;
  parentAccount: ChartOfAccount | null;
  path: ChartOfAccount[];
  onEditChartOfAccountClick: (account: ChartOfAccount) => void;
  onSelectAccount: (accountId: string) => void;
  onToggleChartOfAccountStatus: (
    chartOfAccountId: string,
    status: ChartOfAccount['status'],
  ) => void;
}

const getLevelLabel = (depth: number, account: ChartOfAccount) => {
  if (depth === 0) return 'Clase';
  if (!account.postingAllowed) return 'Subgrupo';
  return 'Mayor';
};

const getNormalSideLabel = (account: ChartOfAccount) =>
  account.normalSide === 'debit' ? 'Deudora' : 'Acreedora';

const getChildCountLabel = (childCount: number) =>
  childCount === 1 ? '1 subcuenta' : `${childCount} subcuentas`;

export const ChartOfAccountInspector = ({
  account,
  childAccounts,
  childCount,
  depth,
  loading,
  parentAccount,
  path,
  onEditChartOfAccountClick,
  onSelectAccount,
  onToggleChartOfAccountStatus,
}: ChartOfAccountInspectorProps) => {
  if (!account) {
    return (
      <Panel>
        <EmptyState>
          <AppIcon name="buildingColumns" tone="muted" sizeToken="lg" />
          <EmptyTitle>Selecciona una cuenta</EmptyTitle>
          <EmptyCopy>Detalle contable aparece aquí.</EmptyCopy>
        </EmptyState>
      </Panel>
    );
  }

  const isActive = account.status === 'active';

  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'toggle-status',
      label: isActive ? 'Desactivar cuenta' : 'Activar cuenta',
      danger: isActive,
      onClick: () =>
        onToggleChartOfAccountStatus(
          account.id,
          isActive ? 'inactive' : 'active',
        ),
    },
  ];

  return (
    <Panel>
      <DetailCard>
        <CardHeader>
          <CardTitle>
            {account.code} — {account.name}
          </CardTitle>
          <HeaderActions>
            <Button
              size="small"
              disabled={loading}
              icon={<AppIcon name="pencil" />}
              onClick={() => onEditChartOfAccountClick(account)}
            >
              Editar
            </Button>
            <Dropdown
              disabled={loading}
              menu={{ items: moreMenuItems }}
              trigger={['click']}
            >
              <Button
                size="small"
                aria-label="Más acciones"
                icon={<AppIcon name="ellipsisVertical" />}
              />
            </Dropdown>
          </HeaderActions>
        </CardHeader>

        <DefinitionList>
          <DefinitionRow>
            <DefinitionLabel>Tipo</DefinitionLabel>
            <DefinitionValue>
              {CHART_OF_ACCOUNT_TYPE_LABELS[account.type]}
            </DefinitionValue>
          </DefinitionRow>
          <DefinitionRow>
            <DefinitionLabel>Naturaleza</DefinitionLabel>
            <DefinitionValue>{getNormalSideLabel(account)}</DefinitionValue>
          </DefinitionRow>
          <DefinitionRow>
            <DefinitionLabel>Nivel</DefinitionLabel>
            <DefinitionValue>{getLevelLabel(depth, account)}</DefinitionValue>
          </DefinitionRow>
          <DefinitionRow>
            <DefinitionLabel>Moneda</DefinitionLabel>
            <DefinitionValue>
              {CHART_OF_ACCOUNT_CURRENCY_MODE_LABELS[account.currencyMode]}
            </DefinitionValue>
          </DefinitionRow>
          {account.subtype ? (
            <DefinitionRow>
              <DefinitionLabel>Subtipo</DefinitionLabel>
              <DefinitionValue>{account.subtype}</DefinitionValue>
            </DefinitionRow>
          ) : null}
          <DefinitionRow>
            <DefinitionLabel>Estado</DefinitionLabel>
            <DefinitionValue>
              {isActive ? (
                <StatusText>Activa</StatusText>
              ) : (
                <InactiveText>Inactiva</InactiveText>
              )}
            </DefinitionValue>
          </DefinitionRow>
          <BalanceRow>
            <DefinitionLabel>Saldo actual</DefinitionLabel>
            <BalanceValue>—</BalanceValue>
          </BalanceRow>
        </DefinitionList>
      </DetailCard>

      <DetailCard>
        <CardHeader>
          <CardTitle>Relaciones</CardTitle>
        </CardHeader>

        <DefinitionList>
          <DefinitionRow>
            <DefinitionLabel>Cuenta superior</DefinitionLabel>
            {parentAccount ? (
              <LinkButton
                type="button"
                onClick={() => onSelectAccount(parentAccount.id)}
              >
                {buildChartOfAccountLabel(parentAccount)}
              </LinkButton>
            ) : (
              <DefinitionValue>Sin cuenta superior</DefinitionValue>
            )}
          </DefinitionRow>
          <DefinitionRow>
            <DefinitionLabel>Subcuentas</DefinitionLabel>
            <DefinitionValue>{getChildCountLabel(childCount)}</DefinitionValue>
          </DefinitionRow>
          {path.length > 1 ? (
            <PathRow>
              <DefinitionLabel>Ubicación</DefinitionLabel>
              <PathList>
                {path.map((item, index) => (
                  <PathItem key={item.id}>
                    {index > 0 ? <PathSeparator>›</PathSeparator> : null}
                    <PathButton
                      type="button"
                      $current={index === path.length - 1}
                      onClick={() => onSelectAccount(item.id)}
                    >
                      {item.code}
                    </PathButton>
                  </PathItem>
                ))}
              </PathList>
            </PathRow>
          ) : null}
        </DefinitionList>

        {childAccounts.length ? (
          <RelatedList>
            {childAccounts.map((childAccount) => (
              <RelatedButton
                key={childAccount.id}
                type="button"
                onClick={() => onSelectAccount(childAccount.id)}
              >
                <RelatedText>
                  <RelatedCode>{childAccount.code}</RelatedCode>
                  {childAccount.name}
                </RelatedText>
                <AppIcon name="chevronRight" sizeToken="xs" tone="muted" />
              </RelatedButton>
            ))}
          </RelatedList>
        ) : null}
      </DetailCard>
    </Panel>
  );
};

const Panel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable;
`;

const DetailCard = styled.section`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  min-height: 48px;
  padding: 0 var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

const CardTitle = styled.h3`
  margin: 0;
  min-width: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
`;

const DefinitionList = styled.dl`
  display: flex;
  flex-direction: column;
  margin: 0;
`;

const DefinitionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(110px, 0.7fr) minmax(0, 1fr);
  gap: var(--ds-space-3);
  min-height: 36px;
  align-items: center;
  padding: 0 var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }
`;

const DefinitionLabel = styled.dt`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const DefinitionValue = styled.dd`
  margin: 0;
  justify-self: end;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
`;

const StatusText = styled.span`
  color: var(--ds-color-state-success-text);
`;

const InactiveText = styled.span`
  color: var(--ds-color-state-warning-text);
`;

const BalanceRow = styled(DefinitionRow)`
  min-height: 52px;
`;

const BalanceValue = styled(DefinitionValue)`
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-lg);
  font-variant-numeric: tabular-nums;
`;

const LinkButton = styled.button`
  justify-self: end;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-action-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--ds-radius-sm);
  }
`;

const PathRow = styled(DefinitionRow)`
  align-items: start;
  padding-top: var(--ds-space-2);
  padding-bottom: var(--ds-space-2);
`;

const PathList = styled.dd`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  margin: 0;
`;

const PathItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-1);
`;

const PathSeparator = styled.span`
  color: var(--ds-color-text-secondary);
`;

const PathButton = styled.button<{ $current: boolean }>`
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ $current }) =>
    $current
      ? 'var(--ds-color-text-primary)'
      : 'var(--ds-color-action-primary)'};
  font-family: var(--ds-font-family-mono);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--ds-radius-sm);
  }
`;

const RelatedList = styled.div`
  display: flex;
  flex-direction: column;
`;

const RelatedButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  min-height: 36px;
  padding: 0 var(--ds-space-4);
  border: 0;
  border-top: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-text-primary);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: -2px;
  }
`;

const RelatedText = styled.span`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--ds-font-size-sm);
`;

const RelatedCode = styled.span`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono);
  font-variant-numeric: tabular-nums;
`;

const EmptyState = styled.div`
  display: flex;
  min-height: 220px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: var(--ds-space-2);
  padding: var(--ds-space-6);
`;

const EmptyTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const EmptyCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
