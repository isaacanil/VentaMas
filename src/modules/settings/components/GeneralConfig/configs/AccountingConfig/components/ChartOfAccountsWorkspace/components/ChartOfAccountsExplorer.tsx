import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { Button, Empty, Input, Select, Spin } from 'antd';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ChartOfAccount, ChartOfAccountType } from '@/types/accounting';
import {
  CHART_OF_ACCOUNT_TYPE_LABELS,
  buildChartOfAccountLabel,
} from '@/utils/accounting/chartOfAccounts';

const { Search } = Input;

type StatusFilter = 'all' | ChartOfAccount['status'];
type TypeFilter = 'all' | ChartOfAccountType;

interface ChartOfAccountsExplorerProps {
  accounts: ChartOfAccount[];
  activeAccountsCount: number;
  childCountByParentId: Map<string, number>;
  depthById: Map<string, number>;
  loading: boolean;
  postingAccountsCount: number;
  search: string;
  selectedAccountId: string | null;
  seeding: boolean;
  statusFilter: StatusFilter;
  statusFilterOptions: readonly { label: string; value: StatusFilter }[];
  totalAccountsCount: number;
  typeFilter: TypeFilter;
  typeFilterOptions: readonly { label: string; value: TypeFilter }[];
  onAddChartOfAccountClick: (parentAccount?: ChartOfAccount) => void;
  onEditAccount: (account: ChartOfAccount) => void;
  onSearchChange: (value: string) => void;
  onSeedDefaultChartOfAccounts: () => void;
  onSelectAccount: (accountId: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
}

const getLevelLabel = (depth: number, account: ChartOfAccount) => {
  if (depth === 0) return 'Clase';
  if (!account.postingAllowed) return 'Subgrupo';
  return 'Mayor';
};

const getNormalSideLabel = (account: ChartOfAccount) =>
  account.normalSide === 'debit' ? 'Deudora' : 'Acreedora';

export const ChartOfAccountsExplorer = ({
  accounts,
  activeAccountsCount,
  childCountByParentId,
  depthById,
  loading,
  postingAccountsCount,
  search,
  selectedAccountId,
  seeding,
  statusFilter,
  statusFilterOptions,
  totalAccountsCount,
  typeFilter,
  typeFilterOptions,
  onAddChartOfAccountClick,
  onEditAccount,
  onSearchChange,
  onSeedDefaultChartOfAccounts,
  onSelectAccount,
  onStatusFilterChange,
  onTypeFilterChange,
}: ChartOfAccountsExplorerProps) => {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== 'active' || typeFilter !== 'all';
  const isCatalogEmpty = totalAccountsCount === 0;
  const classCount = useMemo(
    () => accounts.filter((account) => !account.parentId).length,
    [accounts],
  );

  const toggleCollapse = (accountId: string, event: MouseEvent) => {
    event.stopPropagation();
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const visibleAccounts = useMemo(() => {
    if (search.trim() || typeFilter !== 'all') {
      return accounts;
    }

    const visible: ChartOfAccount[] = [];
    const hiddenParents = new Set<string>();

    accounts.forEach((account) => {
      if (account.parentId && hiddenParents.has(account.parentId)) {
        hiddenParents.add(account.id);
        return;
      }

      visible.push(account);

      if (collapsedIds.has(account.id)) {
        hiddenParents.add(account.id);
      }
    });

    return visible;
  }, [accounts, collapsedIds, search, typeFilter]);

  const collapsibleAccountIds = useMemo(
    () =>
      accounts
        .filter((account) => childCountByParentId.has(account.id))
        .map((account) => account.id),
    [accounts, childCountByParentId],
  );

  const handleExpandAll = () => setCollapsedIds(new Set());

  const handleCollapseAll = () =>
    setCollapsedIds(new Set(collapsibleAccountIds));

  const handleRowKeyDown = (
    account: ChartOfAccount,
    event: KeyboardEvent<HTMLTableRowElement>,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onSelectAccount(account.id);
  };

  return (
    <Panel>
      <PageHeader>
        <HeaderCopy>
          <Title>Catálogo de cuentas</Title>
          <Subtitle>
            Plan contable · {activeAccountsCount} cuentas activas · estructura
            por clase, subgrupo y mayor
          </Subtitle>
        </HeaderCopy>

        <HeaderActions>
          <Button
            disabled={loading || seeding}
            loading={seeding}
            icon={<AppIcon name="database" />}
            onClick={onSeedDefaultChartOfAccounts}
          >
            Completar base
          </Button>
          <Button
            type="primary"
            disabled={loading}
            icon={<AppIcon name="plus" tone="inverse" />}
            onClick={() => onAddChartOfAccountClick()}
          >
            Nueva cuenta
          </Button>
        </HeaderActions>
      </PageHeader>

      <Toolbar>
        <SearchBox>
          <Search
            allowClear
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </SearchBox>

        <FilterGroup>
          <FilterLabel>Clase</FilterLabel>
          <Select
            options={[...typeFilterOptions]}
            value={typeFilter}
            onChange={(value) => onTypeFilterChange(value)}
          />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Estado</FilterLabel>
          <Select
            options={[...statusFilterOptions]}
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value)}
          />
        </FilterGroup>
      </Toolbar>

      <TablePanel>
        <TableHeader>
          <TableTitle>
            Estructura del catálogo
            <TableMeta>
              {classCount} clases · {postingAccountsCount} mayores
            </TableMeta>
          </TableTitle>

          <TableActions>
            <TableActionButton
              type="button"
              disabled={!collapsibleAccountIds.length}
              onClick={handleExpandAll}
            >
              Expandir todo
            </TableActionButton>
            <TableActionButton
              type="button"
              disabled={!collapsibleAccountIds.length}
              onClick={handleCollapseAll}
            >
              Colapsar
            </TableActionButton>
          </TableActions>
        </TableHeader>

        <TableScroll aria-busy={loading}>
          <AccountTable>
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Nivel</th>
                <th>Naturaleza</th>
                <th>Tipo</th>
                <th>Saldo</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {loading && totalAccountsCount === 0 ? (
                <tr>
                  <LoadingCell colSpan={6}>
                    <Spin tip="Cargando catálogo de cuentas..." />
                  </LoadingCell>
                </tr>
              ) : visibleAccounts.length > 0 ? (
                visibleAccounts.map((account) => {
                  const depth = depthById.get(account.id) ?? 0;
                  const childCount = childCountByParentId.get(account.id) ?? 0;
                  const isCollapsed = collapsedIds.has(account.id);
                  const isSelected = selectedAccountId === account.id;

                  return (
                    <AccountRow
                      key={account.id}
                      role="button"
                      tabIndex={0}
                      $selected={isSelected}
                      $inactive={account.status !== 'active'}
                      onClick={() => onSelectAccount(account.id)}
                      onKeyDown={(event) => handleRowKeyDown(account, event)}
                    >
                      <AccountCell>
                        <AccountNameWrap $depth={depth}>
                          {childCount > 0 ? (
                            <CollapseToggle
                              type="button"
                              aria-label={
                                isCollapsed
                                  ? `Expandir ${account.name}`
                                  : `Colapsar ${account.name}`
                              }
                              onClick={(event) =>
                                toggleCollapse(account.id, event)
                              }
                            >
                              <AppIcon
                                name={isCollapsed ? 'caretRight' : 'caretDown'}
                                sizeToken="sm"
                              />
                            </CollapseToggle>
                          ) : (
                            <TreeSpacer />
                          )}

                          <AccountIdentity>
                            <AccountName $root={depth === 0}>
                              <AccountCode>{account.code}</AccountCode>
                              {account.name}
                              {childCount > 0 ? (
                                <ChildCount>({childCount})</ChildCount>
                              ) : null}
                            </AccountName>
                            {account.status !== 'active' ? (
                              <InactiveText>Inactiva</InactiveText>
                            ) : null}
                          </AccountIdentity>
                        </AccountNameWrap>
                      </AccountCell>

                      <td>
                        <LevelBadge $posting={account.postingAllowed}>
                          {getLevelLabel(depth, account)}
                        </LevelBadge>
                      </td>
                      <MutedCell>
                        {account.postingAllowed
                          ? getNormalSideLabel(account)
                          : '—'}
                      </MutedCell>
                      <MutedCell>
                        {account.postingAllowed
                          ? CHART_OF_ACCOUNT_TYPE_LABELS[account.type]
                          : '—'}
                      </MutedCell>
                      <BalanceCell>—</BalanceCell>
                      <ActionsCell>
                        {!account.postingAllowed ? (
                          <IconButton
                            type="button"
                            title={`Agregar subcuenta a ${account.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onAddChartOfAccountClick(account);
                            }}
                          >
                            <AppIcon name="plus" sizeToken="sm" />
                          </IconButton>
                        ) : null}
                        <IconButton
                          type="button"
                          title={`Editar ${buildChartOfAccountLabel(account)}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditAccount(account);
                          }}
                        >
                          <AppIcon name="pencil" sizeToken="sm" />
                        </IconButton>
                      </ActionsCell>
                    </AccountRow>
                  );
                })
              ) : (
                <tr>
                  <EmptyCell colSpan={6}>
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        isCatalogEmpty
                          ? 'Aún no has cargado el catálogo.'
                          : 'No hay cuentas con esos filtros.'
                      }
                    />

                    {isCatalogEmpty ? (
                      <EmptyActions>
                        <Button
                          type="primary"
                          disabled={loading}
                          loading={seeding}
                          onClick={onSeedDefaultChartOfAccounts}
                        >
                          Completar base
                        </Button>
                        <Button
                          disabled={loading}
                          onClick={() => onAddChartOfAccountClick()}
                        >
                          Nueva cuenta
                        </Button>
                      </EmptyActions>
                    ) : hasActiveFilters ? (
                      <Button
                        onClick={() => {
                          onSearchChange('');
                          onStatusFilterChange('active');
                          onTypeFilterChange('all');
                        }}
                      >
                        Limpiar filtros
                      </Button>
                    ) : null}
                  </EmptyCell>
                </tr>
              )}
            </tbody>
          </AccountTable>
        </TableScroll>
      </TablePanel>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-width: 0;
  min-height: 0;
`;

const PageHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--ds-font-size-xl);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const SearchBox = styled.div`
  flex: 1 1 280px;
  min-width: 0;

  @media (max-width: 720px) {
    flex-basis: 100%;
  }
`;

const FilterGroup = styled.label`
  display: grid;
  gap: var(--ds-space-1);
  flex: 0 0 164px;
  min-width: 0;

  @media (max-width: 520px) {
    flex: 1 1 100%;
  }
`;

const FilterLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
`;

const TablePanel = styled.section`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  min-height: 48px;
  padding: 0 var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
`;

const TableTitle = styled.h3`
  display: flex;
  align-items: baseline;
  gap: var(--ds-space-2);
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const TableMeta = styled.span`
  font-weight: var(--ds-font-weight-regular);
  color: var(--ds-color-text-secondary);
`;

const TableActions = styled.div`
  display: flex;
  gap: var(--ds-space-3);
`;

const TableActionButton = styled.button`
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  cursor: pointer;

  &:disabled {
    cursor: default;
    color: var(--ds-color-text-disabled);
  }

  &:not(:disabled):hover {
    color: var(--ds-color-action-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
    border-radius: var(--ds-radius-sm);
  }
`;

const TableScroll = styled.div`
  min-height: 0;
  overflow: auto;
`;

const AccountTable = styled.table`
  width: 100%;
  min-width: 840px;
  border-collapse: collapse;

  th {
    height: 36px;
    padding: 0 var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    background: var(--ds-color-bg-subtle);
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    text-align: left;
  }

  th:nth-child(5),
  td:nth-child(5) {
    text-align: right;
  }

  td {
    height: 46px;
    padding: 0 var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    font-size: var(--ds-font-size-sm);
    color: var(--ds-color-text-primary);
  }
`;

const AccountRow = styled.tr<{ $selected: boolean; $inactive: boolean }>`
  background: ${({ $selected }) =>
    $selected
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-surface)'};
  opacity: ${({ $inactive }) => ($inactive ? 0.72 : 1)};
  cursor: pointer;

  &:hover {
    background: ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-selected-bg)'
        : 'var(--ds-color-interactive-hover-bg)'};
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: -2px;
  }
`;

const AccountCell = styled.td`
  min-width: 360px;
`;

const AccountNameWrap = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding-left: ${({ $depth }) => `${Math.min($depth, 4) * 24}px`};
`;

const CollapseToggle = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--ds-color-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 1px;
    border-radius: var(--ds-radius-sm);
  }
`;

const TreeSpacer = styled.span`
  width: 20px;
  flex-shrink: 0;
`;

const AccountIdentity = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const AccountName = styled.span<{ $root: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
  font-weight: ${({ $root }) =>
    $root ? 'var(--ds-font-weight-semibold)' : 'var(--ds-font-weight-medium)'};
  color: var(--ds-color-text-primary);
`;

const AccountCode = styled.span`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono);
  font-variant-numeric: tabular-nums;
`;

const ChildCount = styled.span`
  color: var(--ds-color-text-secondary);
  font-weight: var(--ds-font-weight-regular);
`;

const InactiveText = styled.span`
  color: var(--ds-color-state-warning-text);
  font-size: var(--ds-font-size-xs);
`;

const LevelBadge = styled.span<{ $posting: boolean }>`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  background: ${({ $posting }) =>
    $posting
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-subtle)'};
  color: ${({ $posting }) =>
    $posting
      ? 'var(--ds-color-interactive-selected-text)'
      : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const MutedCell = styled.td`
  color: var(--ds-color-text-secondary);
`;

const BalanceCell = styled.td`
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-mono);
  font-variant-numeric: tabular-nums;
`;

const ActionsCell = styled.td`
  width: 92px;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: var(--ds-space-1);
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-sm);
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;

  &:hover {
    border-color: var(--ds-color-border-default);
    background: var(--ds-color-bg-surface);
    color: var(--ds-color-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 1px;
  }
`;

const LoadingCell = styled.td`
  height: 240px;
  text-align: center;
`;

const EmptyCell = styled.td`
  height: 280px;
  text-align: center;
`;

const EmptyActions = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--ds-space-2);
`;
