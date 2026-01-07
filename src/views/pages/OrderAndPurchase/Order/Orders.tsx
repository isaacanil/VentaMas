import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useFbGetProviders } from '@/firebase/provider/useFbGetProvider';
import useFilter from '@/hooks/search/useSearch';
import { useListenOrders } from '@/hooks/useOrders';
import type { Order } from '@/utils/order/types';
import { FilterBar } from '@/views/pages/OrderAndPurchase/Compra/components/FilterBar/FilterBar';
import type {
  DataConfigMap,
  FilterOption,
  FilterState,
} from '@/views/pages/OrderAndPurchase/Compra/components/FilterBar/types';
import { MenuApp } from '@/views/templates/MenuApp/MenuApp';
import { OrdersTable } from './components/OrderListTable/OrdersTable';
import createFilterConfig from './config/filterConfig';

interface ProviderRecord {
  provider?: {
    id?: string;
    name?: string;
  };
}

export const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const config = createFilterConfig();
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

  const filterConfig = useMemo(() => createFilterConfig(), []);

  const handleFilterChange = useCallback((newFilterState: FilterState) => {
    setFilterState(newFilterState);
  }, []);

  const { orders, isLoading } = useListenOrders(filterState) as {
    orders?: Order[];
    isLoading?: boolean;
  };

  const filteredOrders = useFilter(orders, searchTerm) as Order[];

  return (
    <Container>
      <MenuApp sectionName={'Pedidos'} />
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
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color2);
`;

const ContentArea = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  padding: 0.5;
  overflow: hidden;
`;
