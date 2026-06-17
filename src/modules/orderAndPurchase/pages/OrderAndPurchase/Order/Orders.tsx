import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { PageLayout } from '@/components/layout/PageShell';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import useFilter from '@/hooks/search/useSearch';
import { useListenOrders } from '@/modules/orderAndPurchase/hooks/useOrders';
import type { Order } from '@/utils/order/types';
import { FilterBar } from '../shared/components/TransactionFilterBar/FilterBar';
import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from '@/modules/orderAndPurchase/pages/OrderAndPurchase/shared/filterBarTypes';
import { MenuApp } from '@/modules/navigation/public';
import { OrdersTable } from './components/OrderListTable/OrdersTable';
import { createTransactionFilterConfig } from '../shared/createTransactionFilterConfig';

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
}

export const Orders = () => {
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

  const { orders, isLoading } = useListenOrders(filterState) as {
    orders?: Order[];
    isLoading?: boolean;
  };

  const filteredOrders = useFilter(orders, searchTerm) as Order[];

  return (
    <>
      <MenuApp sectionName={'Pedidos'} />
      <Container>
        <ContentArea>
          <FilterBar
            config={filterConfig}
            onChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            dataConfig={dataConfig}
          />
          <OrdersTable orders={filteredOrders} loading={isLoading} />
        </ContentArea>
      </Container>
    </>
  );
};

const Container = styled(PageLayout)`
  width: 100%;
  height: 100%;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;
