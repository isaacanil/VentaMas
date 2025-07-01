import styled from 'styled-components'
import { MenuApp } from '../../../'
import { OrdersTable } from './components/OrderListTable/OrdersTable'
import { FilterBar } from '../Compra/components/FilterBar/FilterBar'
import { useListenOrders } from '../../../../hooks/useOrders'
import { useCallback, useMemo, useState } from 'react'
import createFilterConfig from './config/filterConfig'
import { useFbGetProviders } from '../../../../firebase/provider/useFbGetProvider'
import useFilter from '../../../../hooks/search/useSearch'

export const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState(() => {
    const config = createFilterConfig()
    return {
      filters: config.defaultValues,
      isAscending: config.defaultSort?.isAscending ?? true,
    }
  })

  const { providers = [], loading } = useFbGetProviders()
  const filterConfig = useMemo(() => createFilterConfig(), [])
  const dataConfig = useMemo(
    () => ({
      providerId: {
        data: providers,
        accessor: (item) => {
          if (!item) return null
          return {
            value: item.provider.id || '',
            label: item.provider.name || 'Sin nombre',
          }
        },
      },
    }),
    [providers]
  )

  const handleFilterChange = useCallback((newFilterState) => {
    setFilterState(newFilterState)
  }, [])

  const { orders, isLoading: isOrderLoading } = useListenOrders(filterState)
  const filteredOrders = useFilter(orders, searchTerm)

  return (
    <Container>
      <MenuApp sectionName="Pedidos" />
      <ContentArea>
        <FilterBar
          config={filterConfig}
          onChange={handleFilterChange}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          dataConfig={dataConfig}
        />
        <OrdersTable
          loading={isOrderLoading}
          orders={filteredOrders}
        />
      </ContentArea>
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--color2);
  display: grid;
  grid-template-rows: min-content 1fr;
`

const ContentArea = styled.div`
  padding: 0.5;
  display: grid;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
`