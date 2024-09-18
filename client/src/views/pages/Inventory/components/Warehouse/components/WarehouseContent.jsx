import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import SectionContainer from "./SectionContainer";
import { WarehouseForm } from "../forms/WarehouseForm/WarehouseForm";
import { ShelfForm } from "../forms/ShelfForm/ShelfForm";
import { createShelf, deleteShelf, listenAllShelves, updateShelf } from "../../../../../../firebase/warehouse/shelfService";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { useNavigate } from "react-router-dom";
import { ProductStockForm } from "../forms/ProductStockForm/ProductStockForm";

const { Modal, Button, List, message } = antd;

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

export const DetailContainer = styled.div`
  display: grid;
  gap: 0em 0.6em;
 
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));

`;
export const DetailItem = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #333;


  & > strong {
    font-weight: 600;
 /* Color distintivo para los títulos de los detalles */
  }
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

export default function WarehouseContent() {
  const [shelves, setShelves] = useState([]);
  const [products, setProducts] = useState([]);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Estado para el modal de almacén
  const [isShelfFormOpen, setIsShelfFormOpen] = useState(false); // Estado para el modal de estantes
  const { selectedWarehouse } = useSelector(selectWarehouse);
  const warehouse = selectedWarehouse;
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (selectedWarehouse?.id) {
      const unsubscribe = listenAllShelves(user, warehouse.id, setShelves);
      return () => unsubscribe();
    }
  }, [selectedWarehouse, user]);

  const handleEditWarehouseInfo = () => {
    setIsFormOpen(true);
  };

  const onNavigate = (shelf) => {
    navigate(`shelf/${shelf.id}`);
    dispatch(navigateWarehouse({ view: "shelf", data: shelf }));
  };
  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };

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
        {warehouse && (
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
          </DetailContainer>
        )}
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
            <List.Item onClick={() => onNavigate(shelf)}>
              <List.Item.Meta
                title={shelf.name}
                description={
                  <>
                    <p><strong>Nombre Corto:</strong> {shelf.shortName}</p>
                    <p><strong>Capacidad de Fila:</strong> {shelf.rowCapacity}</p>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Body>
      <WarehouseForm
        isOpen={isFormOpen}
        initialData={warehouse}
        onClose={() => setIsFormOpen(false)}
      />
      <ShelfForm
        visible={isShelfFormOpen}
        onClose={() => setIsShelfFormOpen(false)}
      />
      <ProductStockForm
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          locationType="Warehouse" // Tipo de ubicación
          initialData={null} // Si es un producto nuevo, null
          onSave={handleSaveProduct}
        />
    </Container>
  );
}
