import { useCallback, useMemo, useState } from 'react';

import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import { useListenVendorBills } from '@/hooks/useVendorBills';
import useFilter from '@/hooks/search/useSearch';
import { isOpenVendorBill } from '@/utils/vendorBills/fromPurchase';
import type { VendorBill } from '@/utils/vendorBills/types';
import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from '@/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/FilterBar/types';

import {
  buildAccountsPayableRow,
  buildAccountsPayableSummary,
  matchesAccountsPayableTraceabilityFilter,
  type AccountsPayableAgingBucket,
  type AccountsPayableGroupBy,
  type AccountsPayableRow,
  type AccountsPayableTraceabilityFilter,
} from '../utils/accountsPayableDashboard';
import createAccountsPayableFilterConfig from '../utils/createAccountsPayableFilterConfig';

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
}

export const useAccountsPayableViewState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [agingBucketFilter, setAgingBucketFilter] = useState<
    AccountsPayableAgingBucket | 'all'
  >('all');
  const [traceabilityFilter, setTraceabilityFilter] =
    useState<AccountsPayableTraceabilityFilter>('all');
  const [groupBy, setGroupBy] = useState<AccountsPayableGroupBy>('provider');
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const config = createAccountsPayableFilterConfig();
    return {
      filters: config.defaultValues,
      isAscending: config.defaultSort?.isAscending ?? true,
    };
  });

  const { providers = [] } = useFbGetProviders() as {
    providers?: ProviderRecord[];
  };

  const dataConfig = useMemo<DataConfigMap>(
    () => ({
      providerId: {
        data: providers,
        accessor: (item: unknown): FilterOption => {
          const providerItem = item as ProviderRecord;
          return {
            value: providerItem?.provider?.id || '',
            label: providerItem?.provider?.name || 'Sin nombre',
          };
        },
      },
    }),
    [providers],
  );

  const providerNameById = useMemo(() => {
    const entries = providers
      .map((providerItem) => {
        const providerId = providerItem?.provider?.id?.trim();
        const providerName = providerItem?.provider?.name?.trim();
        return providerId && providerName ? [providerId, providerName] : null;
      })
      .filter(Boolean) as Array<[string, string]>;

    return new Map<string, string>(entries);
  }, [providers]);

  const filterConfig = useMemo(() => createAccountsPayableFilterConfig(), []);

  const handleFilterChange = useCallback((nextFilterState: FilterState) => {
    setFilterState(nextFilterState);
  }, []);

  const { vendorBills: listenedVendorBills, isLoading } = useListenVendorBills(
    filterState,
  ) as {
    vendorBills?: VendorBill[];
    isLoading?: boolean;
  };

  const matchedVendorBills = useFilter(
    listenedVendorBills,
    searchTerm,
  ) as VendorBill[];

  const openVendorBills = useMemo(
    () => matchedVendorBills.filter((vendorBill) => isOpenVendorBill(vendorBill)),
    [matchedVendorBills],
  );

  const accountsPayableRows = useMemo<AccountsPayableRow[]>(
    () =>
      openVendorBills.map((vendorBill) =>
        buildAccountsPayableRow(
          vendorBill,
          vendorBill.supplierId
            ? providerNameById.get(vendorBill.supplierId) ?? null
            : null,
        ),
      ),
    [openVendorBills, providerNameById],
  );

  const filteredRows = useMemo(
    () =>
      accountsPayableRows.filter((row) => {
        if (agingBucketFilter !== 'all' && row.agingBucket !== agingBucketFilter) {
          return false;
        }

        return matchesAccountsPayableTraceabilityFilter(row, traceabilityFilter);
      }),
    [accountsPayableRows, agingBucketFilter, traceabilityFilter],
  );

  const summary = useMemo(
    () => buildAccountsPayableSummary(accountsPayableRows),
    [accountsPayableRows],
  );

  return {
    accountsPayableRows: filteredRows,
    dataConfig,
    filterConfig,
    groupBy,
    handleFilterChange,
    setAgingBucketFilter,
    setGroupBy,
    setTraceabilityFilter,
    isLoading: Boolean(isLoading),
    searchTerm,
    setSearchTerm,
    summary,
    traceabilityFilter,
    agingBucketFilter,
  };
};
