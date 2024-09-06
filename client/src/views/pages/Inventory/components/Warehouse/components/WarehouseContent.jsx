import React, { useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import SectionContainer from "./SectionContainer";
import {WarehouseForm} from "../forms/WarehouseForm/WarehouseForm";
import { ShelfForm } from "../forms/ShelfForm/ShelfForm";

const { Modal, Button, List } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
`;
const WarehouseInfo = styled.div`
  padding: 20px;
 
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5em;
  color: #333;
  
`;

const DetailContainer = styled.div`
  display: grid;
  gap: 0em 0.6em;
 
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

`;
const InfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;


const Body = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

export default function WarehouseContent({ warehouse, onNavigate }) {
  const [shelves, setShelves] = useState([
    { id: 1, name: "Estante A1", products: 150 },
    { id: 2, name: "Estante B2", products: 200 },
    { id: 3, name: "Estante C3", products: 180 },
    { id: 1, name: "Estante A1", products: 150 },
    { id: 2, name: "Estante B2", products: 200 },
    { id: 3, name: "Estante C3", products: 180 },
    { id: 1, name: "Estante A1", products: 150 },
    { id: 2, name: "Estante B2", products: 200 },
    { id: 3, name: "Estante C3", products: 180 },
    { id: 1, name: "Estante A1", products: 150 },
    { id: 2, name: "Estante B2", products: 200 },
    { id: 3, name: "Estante C3", products: 180 },
  ]);

  const [selectedShelf, setSelectedShelf] = useState(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Estado para el modal de almacén
  const [isShelfFormOpen, setIsShelfFormOpen] = useState(false); // Estado para el modal de estantes


  const [products, setProducts] = useState([
    { id: 1, name: "Producto A", quantity: 50, batch: "Lote 001", expirationDate: null },
    { id: 2, name: "Producto B", quantity: 100, batch: "Lote 002", expirationDate: null },
    { id: 1, name: "Producto A", quantity: 50, batch: "Lote 001", expirationDate: null },
    { id: 2, name: "Producto B", quantity: 100, batch: "Lote 002", expirationDate: null },
    { id: 1, name: "Producto A", quantity: 50, batch: "Lote 001", expirationDate: null },
    { id: 2, name: "Producto B", quantity: 100, batch: "Lote 002", expirationDate: null },
  ]);

  const handleEditWarehouseInfo = () => {
    setIsFormOpen(true);
  };

  const handleSaveShelf = (newShelf) => {
    console.log(newShelf);
    setIsShelfFormOpen(false);
  }

  const handleSaveWarehouse = (newWarehouse) => {
    console.log(newWarehouse);
    setIsFormOpen(false);
  }

  return (
    <Container>
      <WarehouseInfo>
      <InfoHeader>
          <SectionTitle>Información del Almacén</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleEditWarehouseInfo}
          >
            Editar
          </Button>
        </InfoHeader>
<DetailContainer>

        <p><strong>#:</strong> {warehouse.number}</p>
        <p><strong>Nombre:</strong> {warehouse.name}</p>
        <p><strong>Nombre Corto:</strong> {warehouse.shortName}</p>
        <p><strong>Descripción:</strong> {warehouse.description}</p>
        <p><strong>Propietario:</strong> {warehouse.owner}</p>
        <p><strong>Ubicación:</strong> {warehouse.location}</p>
        <p><strong>Dirección:</strong> {warehouse.address}</p>
        <p><strong>Dimensiones:</strong> {`Largo: ${warehouse.dimension.length} m, Ancho: ${warehouse.dimension.width} m, Altura: ${warehouse.dimension.height} m`}</p>
        <p><strong>Capacidad:</strong> {warehouse.capacity} m³</p>
        {/* <p><strong>ID del Negocio:</strong> {warehouse.businessId}</p> */}
</DetailContainer>
      </WarehouseInfo>
      <Body>
      <SectionContainer
          title="Productos"
          items={products}
          onAdd={() => setIsProductFormOpen(true)}
          renderItem={(product) => (
            <List.Item>
              <List.Item.Meta
                title={product.name}
                description={`Cantidad: ${product.quantity}, Lote: ${product.batch}`}
              />
            </List.Item>
          )}
        />
          <SectionContainer
          title="Estantes"
          items={shelves}
          onAdd={() => setIsShelfFormOpen(true)}
          renderItem={(shelf) => (
            <List.Item  onClick={() => onNavigate("shelf", shelf, ["Warehouse", shelf.name])}>
              <List.Item.Meta
                title={shelf.name}
                description={`Productos: ${shelf.products} unidades`}
              />
            </List.Item>
          )}
        />
      </Body>
      {/* Modal para agregar/editar productos */}

      <WarehouseForm
        visible={isFormOpen}
        initialData={warehouse}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveWarehouse}
      />
        {/* Modal para agregar/editar estantes */}
        <ShelfForm
        visible={isShelfFormOpen}
        onClose={() => setIsShelfFormOpen(false)}
        onSave={handleSaveShelf}
      />

      <Modal
        title="Añadir/Editar Producto"
        open={isProductFormOpen}
        onCancel={() => setIsProductFormOpen(false)}
        footer={null}
      >
        {/* Aquí puedes agregar el formulario de producto */}
      </Modal>

      {/* Modal para agregar/editar estantes */}
      <Modal
        title="Añadir/Editar Estante"
        open={isShelfFormOpen}
        onCancel={() => setIsShelfFormOpen(false)}
        footer={null}
      >
        {/* Aquí puedes agregar el formulario de estante */}
      </Modal>
    </Container>
  );
}
