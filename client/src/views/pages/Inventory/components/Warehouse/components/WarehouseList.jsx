import React, { useState, useMemo } from "react";
import styled from "styled-components";
import { getWarehouses, useListenWarehouses } from "../../../../../../firebase/warehouse/warehouseService";
import { useDispatch, useSelector } from "react-redux";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { useNavigate } from "react-router-dom";
import { MenuApp } from "../../../../..";
import { filterData } from "../../../../../../hooks/search/useSearch";
import WarehouseCard from "./WarehouseCard";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
`;

const WarehouseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 24px;
`;

const Wrapper = styled.div`
`

export default function WarehouseList() {
  const dispatch = useDispatch();
  const navigation = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const {data: warehouses, loading, error} = useListenWarehouses(); // Escucha los cambios en los almacenes

  const filteredWarehouses = useMemo(() => {
    return filterData(warehouses, searchTerm);
  }, [warehouses, searchTerm]);

  const handleSelectWarehouse = (warehouse) => {
    navigation(`/inventory/warehouse/${warehouse.id}`);
    dispatch(navigateWarehouse({ view: "warehouse", data: warehouse })); // Actualiza el estado global de Redux
  };

  return (
    <Wrapper>
      <MenuApp displayName="Almacén" setSearchData={setSearchTerm} />
      <Container>
        <WarehouseGrid>
          {filteredWarehouses.map((warehouse) => (
            <WarehouseCard
              warehouse={warehouse}
              onSelect={() => handleSelectWarehouse(warehouse)}
            />
          ))}
        </WarehouseGrid>
      </Container>
    </Wrapper>
  );
}