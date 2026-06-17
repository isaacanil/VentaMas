import { useCallback, useMemo, useState } from 'react';

import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import useFilter from '@/hooks/search/useSearch';
import { useListenPurchases } from '@/modules/orderAndPurchase/hooks/usePurchases';
import type { Purchase } from '@/utils/purchase/types';

import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from '../../shared/filterBarTypes';
import { createTransactionFilterConfig } from '../../shared/createTransactionFilterConfig';

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
}

export const usePurchasesViewState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const config = createTransactionFilterConfig();
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

  const filterConfig = useMemo(() => createTransactionFilterConfig(), []);

  const handleFilterChange = useCallback((newFilterState: FilterState) => {
    setFilterState(newFilterState);
  }, []);

  const { purchases, isLoading } = useListenPurchases(filterState) as {
    purchases?: Purchase[];
    isLoading?: boolean;
  };

  const filteredPurchases = useFilter(purchases, searchTerm) as Purchase[];

  return {
    dataConfig,
    filterConfig,
    filteredPurchases,
    handleFilterChange,
    isLoading: Boolean(isLoading),
    searchTerm,
    setSearchTerm,
  };
};
