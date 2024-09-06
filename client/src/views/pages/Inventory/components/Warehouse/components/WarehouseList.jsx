// components/WarehouseList.jsx

import React, { useState, useMemo } from "react";
import styled from "styled-components";
import Breadcrumbs from "./Breadcrumbs";
import WarehouseContent from "./WarehouseContent";
import * as antd from "antd"; // Importar todos los componentes de Ant Design
import WarehouseModal from "./WarehouseModel";
import { WarehouseForm } from "../forms/WarehouseForm/WarehouseForm";
const { Modal, Button, Input, List, Card, Breadcrumb, Form } = antd; // Usar destructuring para los componentes específicos que necesitamos

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

const WarehouseCard = styled.div`
  background-color: white;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-1px);
  }
  h2{
    color: #333;
    font-size: 18px;
  }
  p{
    color: #666;
    font-size: 14px;
  }
`;

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState([
    {
      id: "1",
      name: "Central Warehouse",
      description: "Almacén central para distribución principal",
      shortName: "Central",
      number: 1,
      owner: "John Doe",
      address: "123 Main Street, City",
      location: "Downtown",
      dimension: { length: 50, width: 30, height: 20 }, // Dimensiones en metros
      capacity: 5000,
      businessId: "B001"
    },
    {
      id: "2",
      name: "North Warehouse",
      description: "Almacén en el norte para distribución regional",
      shortName: "North",
      number: 2,
      owner: "Jane Smith",
      address: "456 River Avenue, Town",
      location: "Northern District",
      dimension: { length: 40, width: 25, height: 18 }, // Dimensiones en metros
      capacity: 3000,
      businessId: "B002"
    },
    {
      id: "3",
      name: "South Warehouse",
      description: "Almacén al sur para distribución local",
      shortName: "South",
      number: 3,
      owner: "Mike Johnson",
      address: "789 Forest Road, City",
      location: "Southern Suburb",
      dimension: { length: 45, width: 28, height: 22 }, // Dimensiones en metros
      capacity: 4000,
      businessId: "B003"
    },
    {
      id: "4",
      name: "East Warehouse",
      description: "Almacén en la playa este para mercancía delicada",
      shortName: "East",
      number: 4,
      owner: "Emily Davis",
      address: "321 Ocean Avenue, Beach",
      location: "East Beachfront",
      dimension: { length: 35, width: 20, height: 15 }, // Dimensiones en metros
      capacity: 2500,
      businessId: "B004"
    }
  ]);

  const [filters, setFilters] = useState({ search: "" });
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) =>
      warehouse.name.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [warehouses, filters]);

  const handleCreateWarehouse = (newWarehouse) => {
    setWarehouses([...warehouses, newWarehouse]);
    setIsCreateModalOpen(false);
  };

  return (
    <Container>
      <Header>
        <div>
          <h1>Almacenes</h1>
          <Breadcrumbs currentPage="Warehouse Management" />
        </div>
        <Group>
          <Input
            placeholder="Search warehouses..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: "200px", marginRight: "10px" }}
          />
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            Nuevo Almacén
          </Button>
        </Group>
      </Header>

      <WarehouseGrid>
      {filteredWarehouses.map((warehouse) => (
          <WarehouseCard
            key={warehouse.id}
            onClick={() => setSelectedWarehouse(warehouse)}
          >
            <div style={{ padding: "16px" }}>
              <h2>{warehouse.name}</h2>
              <p>{warehouse.address}</p>
              <p>Location: {warehouse.location}</p>
            </div>
            <div style={{ backgroundColor: "#f5f5f5", padding: "16px" }}>
              <p>Capacity: {warehouse.capacity} m²</p>
            </div>
          </WarehouseCard>
        ))}
      </WarehouseGrid>

      {selectedWarehouse && (
        <WarehouseModal
          warehouse={selectedWarehouse}
          onClose={() => setSelectedWarehouse(null)}
        />
      )}

      {/* Modal para Crear Almacén */}
      {isCreateModalOpen && (
  <WarehouseForm
    visible={isCreateModalOpen}
    onClose={() => setIsCreateModalOpen(false)}
    onSave={handleCreateWarehouse}
  />
)}
    </Container>
  );
}

const Group = styled.div` 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;