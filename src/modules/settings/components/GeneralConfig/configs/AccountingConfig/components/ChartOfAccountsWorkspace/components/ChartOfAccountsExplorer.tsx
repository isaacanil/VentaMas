import { useState, useMemo } from 'react';
import { Button, Dropdown, Empty, Input, Select, Spin } from 'antd';
import type { MenuProps } from 'antd';
import styled from 'styled-components';

import { AppIcon } from '@/components/ui/AppIcon';
import type { ChartOfAccount, ChartOfAccountType } from '@/types/accounting';
import { CHART_OF_ACCOUNT_TYPE_LABELS } from '@/utils/accounting/chartOfAccounts';

const { Search } = Input;

type StatusFilter = 'all' | ChartOfAccount['status'];
type TypeFilter = 'all' | ChartOfAccountType;

interface ChartOfAccountsExplorerProps {
  accounts: ChartOfAccount[];
  activeAccountsCount: number;
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

const getHierarchyLabel = (account: ChartOfAccount) => {
  if (!account.parentId) {
    return 'Raíz';
  }

  return account.postingAllowed ? 'Posteable' : 'Encabezado';
};

export const ChartOfAccountsExplorer = ({
  accounts,
  activeAccountsCount,
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
    Boolean(search.trim()) || statusFilter !== 'all' || typeFilter !== 'all';
  const isCatalogEmpty = totalAccountsCount === 0;

  const toggleCollapse = (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const visibleAccounts = useMemo(() => {
    if (search || statusFilter !== 'all' || typeFilter !== 'all') {
      return accounts;
    }

    const visible: ChartOfAccount[] = [];
    const hiddenParents = new Set<string>();

    accounts.forEach((account) => {
      // Si alguno de sus padres está oculto, ocultamos este también
      if (account.parentId && hiddenParents.has(account.parentId)) {
        hiddenParents.add(account.id);
        return;
      }

      visible.push(account);

      // Si este nodo está colapsado, marcamos que sus futuros hijos deben ocultarse
      if (collapsedIds.has(account.id)) {
        hiddenParents.add(account.id);
      }
    });

    return visible;
  }, [accounts, collapsedIds, search, statusFilter, typeFilter]);

  return (
    <Panel>
      <Header>
        <HeaderCopy>
          <Title>Gestión de cuentas</Title>
        </HeaderCopy>

        <HeaderActions>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'seed',
                  label: seeding ? 'Completando...' : 'Completar plantilla base',
                  disabled: seeding || loading,
                  onClick: onSeedDefaultChartOfAccounts,
                },
              ] satisfies MenuProps['items'],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              disabled={loading || seeding}
              icon={<AppIcon name="ellipsisVertical" />}
              aria-label="Más opciones"
            />
          </Dropdown>
        </HeaderActions>
      </Header>

      <SummaryStrip>
        <SummaryItem>
          <SummaryValue>{totalAccountsCount}</SummaryValue>
          <SummaryLabel>Cuentas</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryValue>{activeAccountsCount}</SummaryValue>
          <SummaryLabel>Activas</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryValue>{postingAccountsCount}</SummaryValue>
          <SummaryLabel>Posteables</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryValue>{totalAccountsCount - postingAccountsCount}</SummaryValue>
          <SummaryLabel>Encabezados</SummaryLabel>
        </SummaryItem>
      </SummaryStrip>

      <Controls>
        <Search
          allowClear
          placeholder="Buscar por código, nombre o clave del sistema"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <CompactFilters>
          <Select
            options={[...typeFilterOptions]}
            value={typeFilter}
            onChange={(value) => onTypeFilterChange(value)}
            style={{ minWidth: 148 }}
          />
          <Select
            options={[...statusFilterOptions]}
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value)}
            style={{ minWidth: 148 }}
          />
        </CompactFilters>
      </Controls>

      <List aria-busy={loading}>
        {loading && totalAccountsCount === 0 ? (
          <LoadingState>
            <Spin tip="Cargando catálogo de cuentas..." />
          </LoadingState>
        ) : visibleAccounts.length > 0 ? (
          visibleAccounts.map((account) => {
            const depth = depthById.get(account.id) ?? 0;
            const hierarchyLabel = getHierarchyLabel(account);
            const isFolder = !account.postingAllowed;
            const isCollapsed = collapsedIds.has(account.id);

            return (
              <RowButton
                key={account.id}
                type="button"
                $selected={selectedAccountId === account.id}
                onClick={() => onSelectAccount(account.id)}
              >
                <TreeLead $depth={depth}>
                  {isFolder && (
                    <CollapseToggle
                      onClick={(event) => toggleCollapse(account.id, event)}
                    >
                      {isCollapsed ? (
                        <AppIcon name="caretRight" sizeToken="sm" />
                      ) : (
                        <AppIcon name="caretDown" sizeToken="sm" />
                      )}
                    </CollapseToggle>
                  )}
                </TreeLead>

                <RowBody>
                  <RowHeading>
                    {account.status !== 'active' ? (
                      <StatusDot
                        title="Cuenta inactiva"
                        aria-label="Cuenta inactiva"
                      />
                    ) : null}
                    <Code>{account.code}</Code>
                    <Name $isRoot={depth === 0}>{account.name}</Name>
                  </RowHeading>
                  <RowMeta>
                    <InlineMeta>{hierarchyLabel}</InlineMeta>
                    <InlineMeta>
                      {CHART_OF_ACCOUNT_TYPE_LABELS[account.type]}
                    </InlineMeta>
                  </RowMeta>
                </RowBody>

                <RowAside>
                  <HierarchyLabel $isPosting={account.postingAllowed}>
                    {hierarchyLabel}
                  </HierarchyLabel>
                </RowAside>

                <RowActions>
                  {!account.postingAllowed ? (
                    <ActionButton
                      type="button"
                      title={`Agregar subcuenta a ${account.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddChartOfAccountClick(account);
                      }}
                    >
                      <AppIcon name="plus" sizeToken="sm" />
                    </ActionButton>
                  ) : null}
                  <ActionButton
                    type="button"
                    title="Editar cuenta"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditAccount(account);
                    }}
                  >
                    <AppIcon name="pencil" sizeToken="sm" />
                  </ActionButton>
                </RowActions>
              </RowButton>
            );
          })
        ) : (
          <EmptyState>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isCatalogEmpty ? (
                  <EmptyDescription>
                    <EmptyTitle>Aún no has cargado el catálogo</EmptyTitle>
                    <EmptyCopy>
                      Empieza con la plantilla base o crea una cuenta manual
                      para estructurar tu plan contable.
                    </EmptyCopy>
                  </EmptyDescription>
                ) : (
                  <EmptyDescription>
                    <EmptyTitle>No hay resultados</EmptyTitle>
                    <EmptyCopy>
                      Ajusta la búsqueda o limpia los filtros para volver a ver
                      cuentas disponibles.
                    </EmptyCopy>
                  </EmptyDescription>
                )
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
                  Completar plantilla base
                </Button>
                <Button disabled={loading} onClick={() => onAddChartOfAccountClick()}>
                  Agregar cuenta manual
                </Button>
              </EmptyActions>
            ) : hasActiveFilters ? (
              <EmptyActions>
                <Button
                  onClick={() => {
                    onSearchChange('');
                    onStatusFilterChange('all');
                    onTypeFilterChange('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              </EmptyActions>
            ) : null}
          </EmptyState>
        )}
      </List>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  overflow: hidden;
  min-height: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  height: 52px;
  padding: 0 var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  flex-shrink: 0;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  flex-shrink: 0;
`;

const SummaryStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-1) var(--ds-space-4);
  padding: var(--ds-space-2) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: var(--ds-color-bg-subtle);
  flex-shrink: 0;
`;

const SummaryItem = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--ds-space-2);
`;

const SummaryValue = styled.span`
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  font-variant-numeric: tabular-nums;
`;

const SummaryLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  white-space: nowrap;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-5);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  flex-shrink: 0;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CompactFilters = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  flex-shrink: 0;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  padding: var(--ds-space-6);
`;

const RowButton = styled.button<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: var(--ds-space-3);
  align-items: center;
  width: 100%;
  padding: var(--ds-space-2) var(--ds-space-5);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: ${(props) =>
    props.$selected
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-surface)'};
  text-align: left;
  transition: background-color 160ms ease;
  cursor: pointer;

  &:hover {
    background: ${(props) =>
      props.$selected ? 'var(--ds-color-interactive-selected-bg)' : 'var(--ds-color-interactive-hover-bg)'};
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: -2px;
  }
`;

const TreeLead = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  margin-left: ${(props) => props.$depth * 16}px;
`;

const CollapseToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
    color: var(--ds-color-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 1px;
  }
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-md);
  background: transparent;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--ds-color-border-default);
    background: var(--ds-color-interactive-hover-bg);
    color: var(--ds-color-text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 1px;
  }
`;

const RowBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const RowHeading = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  min-width: 0;
`;

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ds-color-state-warning);
  flex-shrink: 0;
`;

const Code = styled.span`
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono);
`;

const Name = styled.span<{ $isRoot: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${(props) =>
    props.$isRoot ? 'var(--ds-font-size-md)' : 'var(--ds-font-size-base)'};
  font-weight: ${(props) =>
    props.$isRoot
      ? 'var(--ds-font-weight-semibold)'
      : 'var(--ds-font-weight-medium)'};
  color: var(--ds-color-text-primary);
`;

const RowMeta = styled.div`
  display: none;
  flex-wrap: wrap;
  gap: var(--ds-space-1) var(--ds-space-2);

  @media (max-width: 640px) {
    display: flex;
  }
`;

const InlineMeta = styled.span`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-secondary);
`;

const RowAside = styled.div`
  @media (max-width: 640px) {
    display: none;
  }
`;

const HierarchyLabel = styled.span<{ $isPosting: boolean }>`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  padding: 2px var(--ds-space-2);
  border-radius: var(--ds-radius-pill);
  background: ${(props) => (props.$isPosting ? 'var(--ds-color-state-info-subtle)' : 'var(--ds-color-bg-subtle)')};
  color: ${(props) => (props.$isPosting ? 'var(--ds-color-state-info-text)' : 'var(--ds-color-text-secondary)')};
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const EmptyState = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-4);
  min-height: 280px;
  padding: var(--ds-space-6);
`;

const EmptyDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const EmptyTitle = styled.h4`
  margin: 0;
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const EmptyCopy = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  color: var(--ds-color-text-secondary);
`;

const EmptyActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--ds-space-2);
`;
