import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";
import Breadcrumbs from "./Breadcrumbs";
import * as antd from "antd"; // Importar todos los componentes de Ant Design
import WarehouseModal from "./WarehouseLayout";
import { WarehouseForm } from "../forms/WarehouseForm/WarehouseForm";
import { getWarehouses } from "../../../../../../firebase/warehouse/warehouseService";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { useNavigate } from "react-router-dom";
import { MenuApp } from "../../../../..";
import { filterData } from "../../../../../../hooks/search/useSearch";
import WarehouseCard from "./WarehouseCard";
const { Button, Input } = antd; // Usar destructuring para los componentes específicos que necesitamos

// Estilos con styled-components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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
  const user = useSelector(selectUser)
  const { selectedWarehouse } = useSelector(selectWarehouse);
  const [warehouses, setWarehouses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch warehouses on component mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const warehouseData = await getWarehouses(user); // Llama al servicio para obtener los almacenes
        setWarehouses(warehouseData);
      } catch (error) {
        console.error('Error fetching warehouses: ', error);
      }
    };

    fetchWarehouses();
  }, [user]);

  const filteredWarehouses = useMemo(() => {
    return filterData(warehouses, searchTerm);
  }, [warehouses, searchTerm]);

  const handleCreateWarehouse = (newWarehouse) => {
    setWarehouses([...warehouses, newWarehouse]);
    setIsCreateModalOpen(false);
  };

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

const Group = styled.div` 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;