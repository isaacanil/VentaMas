import { Drawer } from 'antd';
import { useDeferredValue, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useWindowWidth } from '@/hooks/useWindowWidth';
import type { ChartOfAccount, ChartOfAccountType } from '@/types/accounting';
import type { ChartOfAccountDraft } from '@/utils/accounting/chartOfAccounts';
import { sortChartOfAccountsForDisplay } from '@/utils/accounting/chartOfAccounts';
import { ChartOfAccountsExplorer } from './components/ChartOfAccountsExplorer';
import { ChartOfAccountInspector } from './components/ChartOfAccountInspector';

interface ChartOfAccountsListProps {
  accounts: ChartOfAccount[];
  loading: boolean;
  onAddChartOfAccountClick: (
    createDefaults?: Partial<ChartOfAccountDraft>,
  ) => void;
  onEditChartOfAccountClick: (account: ChartOfAccount) => void;
  onSeedDefaultChartOfAccounts: () => void;
  onToggleChartOfAccountStatus: (
    chartOfAccountId: string,
    status: ChartOfAccount['status'],
  ) => void;
  seeding: boolean;
}

const STATUS_FILTER_OPTIONS = [
  { label: 'Todos los estados', value: 'all' },
  { label: 'Activas', value: 'active' },
  { label: 'Inactivas', value: 'inactive' },
] as const;

const TYPE_FILTER_OPTIONS = [
  { label: 'Todos los tipos', value: 'all' },
  { label: 'Activo', value: 'asset' },
  { label: 'Pasivo', value: 'liability' },
  { label: 'Patrimonio', value: 'equity' },
  { label: 'Ingreso', value: 'income' },
  { label: 'Gasto', value: 'expense' },
] as const;

const buildAccountPath = (
  account: ChartOfAccount,
  accountsById: Map<string, ChartOfAccount>,
) => {
  const branch: ChartOfAccount[] = [];
  let current: ChartOfAccount | undefined = account;
  let safety = 0;

  while (current && safety < accountsById.size) {
    branch.unshift(current);
    current = current.parentId
      ? accountsById.get(current.parentId)
      : undefined;
    safety += 1;
  }

  return branch;
};

export const ChartOfAccountsList = ({
  accounts,
  loading,
  onAddChartOfAccountClick,
  onEditChartOfAccountClick,
  onSeedDefaultChartOfAccounts,
  onToggleChartOfAccountStatus,
  seeding,
}: ChartOfAccountsListProps) => {
  const isWideWorkspace = useWindowWidth(1120);
  const [search, setSearch] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    'all' | ChartOfAccount['status']
  >('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ChartOfAccountType>('all');
  const deferredSearch = useDeferredValue(search);

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const orderedAccounts = useMemo(
    () => sortChartOfAccountsForDisplay(accounts),
    [accounts],
  );
  const childCountByParentId = useMemo(
    () =>
      accounts.reduce<Map<string, number>>((accumulator, account) => {
        if (!account.parentId) {
          return accumulator;
        }

        accumulator.set(
          account.parentId,
          (accumulator.get(account.parentId) ?? 0) + 1,
        );
        return accumulator;
      }, new Map()),
    [accounts],
  );
  const childrenByParentId = useMemo(
    () =>
      accounts.reduce<Map<string, ChartOfAccount[]>>((accumulator, account) => {
        if (!account.parentId) {
          return accumulator;
        }

        const currentChildren = accumulator.get(account.parentId) ?? [];
        accumulator.set(account.parentId, [...currentChildren, account]);
        return accumulator;
      }, new Map()),
    [accounts],
  );
  const depthById = useMemo(() => {
    const nextDepths = new Map<string, number>();

    orderedAccounts.forEach((account) => {
      let depth = 0;
      let currentParentId = account.parentId ?? null;
      let safety = 0;

      while (currentParentId && safety < accounts.length) {
        depth += 1;
        currentParentId = accountsById.get(currentParentId)?.parentId ?? null;
        safety += 1;
      }

      nextDepths.set(account.id, depth);
    });

    return nextDepths;
  }, [accounts.length, accountsById, orderedAccounts]);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return orderedAccounts.filter((account) => {
      if (statusFilter !== 'all' && account.status !== statusFilter) {
        return false;
      }

      if (typeFilter !== 'all' && account.type !== typeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        account.code,
        account.name,
        account.subtype ?? '',
        account.systemKey ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [deferredSearch, orderedAccounts, statusFilter, typeFilter]);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.status === 'active'),
    [accounts],
  );
  const postingAccounts = useMemo(
    () => accounts.filter((account) => account.postingAllowed),
    [accounts],
  );

  const selectedAccount = useMemo(() => {
    if (!filteredAccounts.length) {
      return null;
    }

    return (
      filteredAccounts.find((account) => account.id === selectedAccountId) ??
      filteredAccounts[0]
    );
  }, [filteredAccounts, selectedAccountId]);

  const selectedAccountPath = useMemo(
    () =>
      selectedAccount
        ? buildAccountPath(selectedAccount, accountsById)
        : ([] as ChartOfAccount[]),
    [accountsById, selectedAccount],
  );
  const selectedParent = selectedAccount?.parentId
    ? accountsById.get(selectedAccount.parentId) ?? null
    : null;
  const selectedChildren = selectedAccount
    ? [...(childrenByParentId.get(selectedAccount.id) ?? [])].sort((left, right) =>
        left.code.localeCompare(right.code),
      )
    : [];

  const handleSelectAccount = (accountId: string) => {
    setSelectedAccountId(accountId);

    if (!isWideWorkspace) {
      setIsInspectorOpen(true);
    }
  };

  const handleOpenChartOfAccountModal = (parentAccount?: ChartOfAccount) => {
    if (!parentAccount) {
      onAddChartOfAccountClick();
      return;
    }

    onAddChartOfAccountClick({
      parentId: parentAccount.id,
      type: parentAccount.type,
      normalSide: parentAccount.normalSide,
      currencyMode: parentAccount.currencyMode,
      postingAllowed: true,
    });
  };

  const inspectorContent = (
    <ChartOfAccountInspector
      account={selectedAccount}
      childAccounts={selectedChildren}
      childCount={selectedAccount ? childCountByParentId.get(selectedAccount.id) ?? 0 : 0}
      depth={selectedAccount ? depthById.get(selectedAccount.id) ?? 0 : 0}
      loading={loading}
      parentAccount={selectedParent}
      path={selectedAccountPath}
      onEditChartOfAccountClick={onEditChartOfAccountClick}
      onSelectAccount={handleSelectAccount}
      onToggleChartOfAccountStatus={onToggleChartOfAccountStatus}
    />
  );

  return (
    <Workspace>
      <ChartOfAccountsExplorer
        accounts={filteredAccounts}
        activeAccountsCount={activeAccounts.length}
        depthById={depthById}
        loading={loading}
        postingAccountsCount={postingAccounts.length}
        search={search}
        selectedAccountId={selectedAccount?.id ?? null}
        seeding={seeding}
        statusFilter={statusFilter}
        statusFilterOptions={STATUS_FILTER_OPTIONS}
        totalAccountsCount={accounts.length}
        typeFilter={typeFilter}
        typeFilterOptions={TYPE_FILTER_OPTIONS}
        onAddChartOfAccountClick={handleOpenChartOfAccountModal}
        onEditAccount={onEditChartOfAccountClick}
        onSearchChange={setSearch}
        onSeedDefaultChartOfAccounts={onSeedDefaultChartOfAccounts}
        onSelectAccount={handleSelectAccount}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {isWideWorkspace ? inspectorContent : null}

      {!isWideWorkspace ? (
        <Drawer
          destroyOnHidden
          height="78%"
          open={Boolean(selectedAccount) && isInspectorOpen}
          placement="bottom"
          title={selectedAccount ? `${selectedAccount.code} · ${selectedAccount.name}` : 'Detalle de cuenta'}
          onClose={() => setIsInspectorOpen(false)}
          styles={{
            body: {
              padding: 0,
              height: '100%',
            },
          }}
        >
          {inspectorContent}
        </Drawer>
      ) : null}
    </Workspace>
  );
};

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.85fr);
  align-items: stretch;
  flex: 1;
  min-height: 0;

  @media (max-width: 1120px) {
    grid-template-columns: 1fr;
  }
`;
