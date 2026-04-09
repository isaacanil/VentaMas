import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { navigateWarehouse } from '@/features/warehouse/warehouseSlice';
import { useListenWarehouses } from '@/firebase/warehouse/warehouseService';
import { filterData } from '@/hooks/search/useSearch';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import WarehouseCard from './WarehouseCard';

import type { Warehouse } from '@/models/Warehouse/Warehouse';

const Container = styled.div`
  max-width: 1200px;
  padding: 16px;
  margin: 0 auto;
`;

const WarehouseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
`;

const Wrapper = styled.div``;

export default function WarehouseList() {
  const dispatch = useDispatch();
  const navigation = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: warehouses } = useListenWarehouses();
  type WarehouseRecord = (typeof warehouses)[number];

  const filteredWarehouses = useMemo(() => {
    return filterData(warehouses, searchTerm);
  }, [warehouses, searchTerm]);

  const handleSelectWarehouse = (warehouse: WarehouseRecord) => {
    const warehouseId = warehouse?.id ? String(warehouse.id) : '';
    if (!warehouseId) return;
    navigation(`/inventory/warehouse/${warehouseId}`);
    const normalizedWarehouse = { ...warehouse, id: warehouseId } as Warehouse;
    dispatch(
      navigateWarehouse({ view: 'warehouse', data: normalizedWarehouse }),
    ); // Actualiza el estado global de Redux
  };

  return (
    <Wrapper>
      <MenuApp displayName="Almacén" setSearchData={setSearchTerm} />
      <Container>
        <WarehouseGrid>
          {filteredWarehouses.map((warehouse, index) => (
            <WarehouseCard
              key={warehouse?.id ?? index}
              warehouse={warehouse}
              onSelect={() => handleSelectWarehouse(warehouse)}
            />
          ))}
        </WarehouseGrid>
      </Container>
    </Wrapper>
  );
}
