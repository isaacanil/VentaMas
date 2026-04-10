import { useState } from 'react';
import { Button, Dropdown, Empty, Typography } from 'antd';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  BankOutlined,
  CheckCircleOutlined,
  EditOutlined,
  MoreOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import type { BankAccount } from '@/types/accounting';
import { buildBankAccountLabel } from '@/utils/accounting/bankAccounts';
import { toMillis } from '@/utils/firebase/toTimestamp';

const { Text } = Typography;

const BANK_ACCOUNT_TYPE_LABELS: Partial<Record<string, string>> = {
  checking: 'Cuenta corriente',
  savings: 'Cuenta de ahorros',
  credit_card: 'Tarjeta de crédito',
  other: 'Otro tipo de cuenta',
};

interface BankAccountsListProps {
  actionLabel?: string;
  bankAccounts: BankAccount[];
  defaultBankAccountId?: string | null;
  loading: boolean;
  onAddBankAccountClick: () => void;
  onToggleBankAccountStatus: (
    bankAccountId: string,
    status: BankAccount['status'],
  ) => void;
  onEditBankAccountClick: (bankAccount: BankAccount) => void;
  onSetDefaultBankAccountClick: (bankAccountId: string) => void;
  showPrimaryAction?: boolean;
  title?: string;
}

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

type FilterTone = 'active' | 'all' | 'inactive';

export const BankAccountsList = ({
  actionLabel = 'Nueva cuenta bancaria',
  bankAccounts,
  defaultBankAccountId,
  loading,
  onAddBankAccountClick,
  onToggleBankAccountStatus,
  onEditBankAccountClick,
  onSetDefaultBankAccountClick,
  showPrimaryAction = true,
  title = 'Cuentas bancarias',
}: BankAccountsListProps) => {
  const [filter, setFilter] = useState<FilterTone>('active');

  const activeAccountsCount = bankAccounts.filter(
    (account) => account.status === 'active',
  ).length;
  const inactiveAccountsCount = bankAccounts.length - activeAccountsCount;

  const visibleAccounts = bankAccounts.filter((account) => {
    if (filter === 'all') {
      return true;
    }

    return account.status === (filter === 'active' ? 'active' : 'inactive');
  });

  return (
    <Section>
      <Header>
        <HeaderCopy>
          <TitleRow>
            <Title>{title}</Title>
          </TitleRow>
          {!defaultBankAccountId && activeAccountsCount > 1 ? (
            <HeaderNotice>
              Elige una cuenta predeterminada desde el menú de una cuenta
              activa.
            </HeaderNotice>
          ) : null}
        </HeaderCopy>

        {showPrimaryAction ? (
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={onAddBankAccountClick}
          >
            {actionLabel}
          </Button>
        ) : null}
      </Header>

      {!!bankAccounts.length && (
        <FilterBar>
          <FilterChip
            $tone="active"
            $selected={filter === 'active'}
            onClick={() => setFilter('active')}
          >
            {activeAccountsCount} activas
          </FilterChip>
          <FilterChip
            $tone="all"
            $selected={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {bankAccounts.length} todas
          </FilterChip>
          <FilterChip
            $tone="inactive"
            $selected={filter === 'inactive'}
            onClick={() => setFilter('inactive')}
          >
            {inactiveAccountsCount} inactivas
          </FilterChip>
        </FilterBar>
      )}

      {!bankAccounts.length ? (
        <EmptyState>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              loading
                ? 'Cargando cuentas bancarias...'
                : 'No hay cuentas bancarias configuradas.'
            }
          />
        </EmptyState>
      ) : visibleAccounts.length === 0 ? (
        <EmptyState>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`No hay cuentas ${
              filter === 'active'
                ? 'activas'
                : filter === 'inactive'
                  ? 'inactivas'
                  : 'disponibles'
            }.`}
          />
        </EmptyState>
      ) : (
        <Rows>
          {visibleAccounts.map((account) => {
            const accountLabel = buildBankAccountLabel(account);
            const isActive = account.status === 'active';
            const isDefault = account.id === defaultBankAccountId;
            const accountTypeLabel = account.type
              ? (BANK_ACCOUNT_TYPE_LABELS[account.type] ?? account.type)
              : null;
            const openingBalanceDateMillis = toMillis(
              account.openingBalanceDate as any,
            );

            const menuItems = [
              {
                key: 'edit',
                label: 'Editar',
                icon: <EditOutlined />,
                onClick: () => onEditBankAccountClick(account),
              },
              isDefault
                ? {
                    key: 'current-default',
                    label: 'Cuenta predeterminada actual',
                    icon: <CheckCircleOutlined />,
                    disabled: true,
                  }
                : isActive
                  ? {
                      key: 'set-default',
                      label: 'Marcar como predeterminada',
                      icon: <CheckCircleOutlined />,
                      onClick: () => onSetDefaultBankAccountClick(account.id),
                    }
                  : null,
              {
                key: 'toggle',
                label: isActive ? 'Desactivar' : 'Activar',
                icon: <PoweroffOutlined />,
                danger: isActive,
                onClick: () =>
                  onToggleBankAccountStatus(
                    account.id,
                    isActive ? 'inactive' : 'active',
                  ),
              },
            ].filter(Boolean) as MenuProps['items'];

            return (
              <Item key={account.id} $featured={isDefault}>
                <ItemHeaderRow>
                  <IdentityBlock>
                    <BankIconContainer $featured={isDefault}>
                      <BankOutlined />
                    </BankIconContainer>

                    <IdentityCopy>
                      <ItemTitle>{accountLabel}</ItemTitle>
                    </IdentityCopy>
                  </IdentityBlock>

                  <ItemActions>
                    {isDefault ? (
                      <StatusBadge $tone="default">Predeterminada</StatusBadge>
                    ) : null}
                    {!isActive ? (
                      <StatusBadge $tone="inactive">Inactiva</StatusBadge>
                    ) : null}

                    <DropdownWrapper>
                      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                        <ActionButton
                          $featured={isDefault}
                          aria-label={`Acciones para ${accountLabel}`}
                          icon={<MoreOutlined style={{ fontSize: 15 }} />}
                        />
                      </Dropdown>
                    </DropdownWrapper>
                  </ItemActions>
                </ItemHeaderRow>

                <MetaGrid>
                  {accountTypeLabel ? (
                    <MetaCard>
                      <MetaLabel $featured={isDefault}>Tipo</MetaLabel>
                      <MetaValue $featured={isDefault}>{accountTypeLabel}</MetaValue>
                    </MetaCard>
                  ) : null}

                  {typeof account.openingBalance === 'number' ? (
                    <MetaCard>
                      <MetaLabel $featured={isDefault}>Balance inicial</MetaLabel>
                      <MetaValue $featured={isDefault}>
                        {formatCurrency(
                          account.openingBalance,
                          account.currency,
                        )}
                      </MetaValue>
                    </MetaCard>
                  ) : null}

                  {openingBalanceDateMillis ? (
                    <MetaCard>
                      <MetaLabel $featured={isDefault}>Vigente desde</MetaLabel>
                      <MetaValue $featured={isDefault}>
                        {DateTime.fromMillis(openingBalanceDateMillis)
                          .setLocale('es')
                          .toFormat('dd/MM/yyyy')}
                      </MetaValue>
                    </MetaCard>
                  ) : null}
                </MetaGrid>

                {account.notes ? (
                  <NoteSection>
                    <NoteDivider $featured={isDefault} />
                    <ItemNote>{account.notes}</ItemNote>
                  </NoteSection>
                ) : null}
              </Item>
            );
          })}
        </Rows>
      )}
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: var(--ds-space-4);
  height: 52px;
  padding: 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const HelpText = styled(Text).attrs({ type: 'secondary' })`
  && {
    display: block;
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-normal);
    color: var(--ds-color-text-secondary);
  }
`;

const HeaderNotice = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-state-warningText);
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
  padding: var(--ds-space-2) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const FilterChip = styled.button<{
  $tone: 'active' | 'all' | 'inactive';
  $selected: boolean;
}>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-md);
  cursor: pointer;
  transition: opacity 0.15s ease, box-shadow 0.15s ease;
  border: 1px solid
    ${({ $tone, $selected }) =>
      $tone === 'active'
        ? $selected
          ? 'var(--ds-color-state-success)'
          : 'var(--ds-color-border-default)'
        : $tone === 'all'
          ? $selected
            ? 'var(--ds-color-interactive-selected-border)'
            : 'var(--ds-color-border-default)'
        : $selected
          ? 'var(--ds-color-border-default)'
          : 'var(--ds-color-border-default)'};
  background: ${({ $tone, $selected }) =>
    $tone === 'active'
      ? $selected
        ? 'var(--ds-color-state-successSubtle)'
        : 'var(--ds-color-bg-subtle)'
      : $tone === 'all'
        ? $selected
          ? 'var(--ds-color-interactive-selected-bg)'
          : 'var(--ds-color-bg-subtle)'
      : $selected
        ? 'var(--ds-color-bg-subtle)'
        : 'transparent'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: ${({ $tone, $selected }) =>
    $tone === 'active'
      ? $selected
        ? 'var(--ds-color-state-successText)'
        : 'var(--ds-color-text-secondary)'
      : $tone === 'all'
        ? $selected
          ? 'var(--ds-color-interactive-selected-text)'
          : 'var(--ds-color-text-secondary)'
      : $selected
        ? 'var(--ds-color-text-secondary)'
        : 'var(--ds-color-text-secondary)'};
  opacity: ${({ $selected }) => ($selected ? 1 : 0.6)};

  &:hover {
    opacity: 1;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  margin: var(--ds-space-4) var(--ds-space-5);
  padding: var(--ds-space-6);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: var(--ds-space-3);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--ds-space-4) var(--ds-space-5);
`;

const Item = styled.div<{ $featured: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  border: 1px solid
    ${({ $featured }) =>
      $featured
        ? 'var(--ds-color-interactive-selected-border)'
        : 'var(--ds-color-border-default)'};
  border-radius: var(--ds-radius-lg);
  background: ${({ $featured }) =>
    $featured
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-surface)'};
`;

const ItemHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const IdentityBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  min-width: 0;
`;

const BankIconContainer = styled.div<{ $featured: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ds-radius-lg);
  background: ${({ $featured }) =>
    $featured
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${({ $featured }) =>
    $featured
      ? 'var(--ds-color-interactive-selected-text)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-lg);
  flex-shrink: 0;
`;

const IdentityCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const ItemTitle = styled(Text)`
  && {
    display: block;
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-semibold);
    line-height: 1.45;
    color: var(--ds-color-text-primary);
  }
`;

const ItemActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
  margin-left: auto;
`;

const DropdownWrapper = styled.div`
  margin-left: auto;
`;

const StatusBadge = styled.span<{
  $tone: 'active' | 'inactive' | 'default';
}>`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  border: 1px solid
    ${({ $tone }) => {
      if ($tone === 'active') {
        return 'var(--ds-color-state-success)';
      }

      if ($tone === 'default') {
        return 'var(--ds-color-interactive-selected-border)';
      }

      return 'var(--ds-color-border-default)';
    }};
  background: ${({ $tone }) => {
    if ($tone === 'active') {
      return 'var(--ds-color-state-successSubtle)';
    }

    if ($tone === 'default') {
      return 'var(--ds-color-interactive-selected-bg)';
    }

    return 'var(--ds-color-bg-subtle)';
  }};
  color: ${({ $tone }) => {
    if ($tone === 'active') {
      return 'var(--ds-color-state-successText)';
    }

    if ($tone === 'default') {
      return 'var(--ds-color-interactive-selected-text)';
    }

    return 'var(--ds-color-text-secondary)';
  }};
`;

const ActionButton = styled(Button)<{ $featured: boolean }>`
  && {
    width: 28px;
    height: 28px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--ds-radius-md);
    border: 1px solid transparent;
    box-shadow: none;
    color: ${({ $featured }) =>
      $featured
        ? 'var(--ds-color-interactive-selected-text)'
        : 'var(--ds-color-text-secondary)'};
    background: transparent;

    &:hover,
    &:focus {
      box-shadow: none;
      color: ${({ $featured }) =>
        $featured
          ? 'var(--ds-color-interactive-selected-text)'
          : 'var(--ds-color-text-primary)'};
      background: ${({ $featured }) =>
        $featured
          ? 'var(--ds-color-bg-surface)'
          : 'var(--ds-color-bg-muted)'};
      border-color: ${({ $featured }) =>
        $featured
          ? 'var(--ds-color-interactive-selected-border)'
          : 'var(--ds-color-border-strong)'};
    }
  }
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--ds-space-3);
`;

const MetaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span<{ $featured: boolean }>`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const MetaValue = styled.span<{ $featured: boolean }>`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: ${({ $featured }) =>
    $featured
      ? 'var(--ds-color-interactive-selected-text)'
      : 'var(--ds-color-text-primary)'};
  font-variant-numeric: tabular-nums;
`;

const NoteSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: calc(var(--ds-space-2) - var(--ds-space-4));
`;

const NoteDivider = styled.hr<{ $featured: boolean }>`
  margin: 0;
  border: none;
  border-top: 1px solid
    ${({ $featured }) =>
      $featured
        ? 'var(--ds-color-interactive-selected-border)'
        : 'var(--ds-color-border-default)'};
  opacity: 0.5;
`;

const ItemNote = styled.p`
  margin: 0;
  padding-top: 2px;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;
