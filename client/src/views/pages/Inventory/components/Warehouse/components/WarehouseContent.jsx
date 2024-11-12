import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDeleteLeft, faEdit } from "@fortawesome/free-solid-svg-icons";
import SectionContainer from "./SectionContainer";
import { WarehouseForm } from "../forms/WarehouseForm/WarehouseForm";
import { createShelf, deleteShelf, listenAllShelves, updateShelf, useListenShelves } from "../../../../../../firebase/warehouse/shelfService";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useListenWarehouse, useListenWarehouses } from "../../../../../../firebase/warehouse/warehouseService";
import { icons } from "../../../../../../constants/icons/icons";
import { ProductsSection } from "./ProductsSection";
import { openShelfForm, setShelfLoading } from "../../../../../../features/warehouse/shelfModalSlice";

const { Modal, Button, List, message, Tag } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
  overflow: hidden;
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
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector(selectUser);

  const { warehouseId } = useParams();
  const [location, setLocation] = useState({ id: warehouseId, type: "Warehouse" })
  const { data: warehouse, loading: warehouseLoading, error: warehouseError } = useListenWarehouse(warehouseId);
  const { data: shelves, loading, error } = useListenShelves(warehouse?.id);

  const [isFormOpen, setIsFormOpen] = useState(false); // Estado para el modal de almacén

  const handleEditWarehouseInfo = () => {
    setIsFormOpen(true);
  };

  const onNavigate = (shelf) => {
    navigate(`shelf/${shelf.id}`);
    dispatch(navigateWarehouse({ view: "shelf", data: shelf }));
  };

  if (warehouseLoading) {
    return <div>Loading warehouse data...</div>;
  }
  const handleUpdateShelf = async (data) => {
    dispatch(setShelfLoading(true));
    dispatch(openShelfForm(data));
  }
  const handleAddShelf = async () => {
    dispatch(openShelfForm());
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
            <p><strong>Capacidad:</strong> <Tag>{warehouse.capacity}</Tag></p>
          </DetailContainer>
        )}
      </WarehouseInfo>
      <Body>
        <ProductsSection
          location={location}
        />
        <SectionContainer
          title="Estantes"
          items={shelves}
          onAdd={handleAddShelf}
          renderItem={(shelf) => (
            <List.Item
              actions={[
                <Button
                  icon={<FontAwesomeIcon icon={faEdit} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateShelf(shelf);
                  }}
                >
                </Button>,
                <Button
                  icon={icons.editingActions.delete}
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: "Eliminar Estante",
                      content: "¿Estás seguro de eliminar este estante?",
                      okText: "Eliminar",
                      okType: "danger",
                      cancelText: "Cancelar",
                      onOk: async () => {
                        try {
                          await deleteShelf(user, warehouse.id, shelf.id);
                          message.success("Estante eliminado correctamente");
                        } catch (error) {
                          console.error("Error al eliminar el estante: ", error);
                          message.error("Error al eliminar el estante");
                        }
                      },
                    });
                  }}
                >
                </Button>,
              ]}
              onClick={() => onNavigate(shelf)}
            >
              <List.Item.Meta
                title={shelf.name}
                description={`Capacidad de Fila: ${shelf.rowCapacity}`}

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
    </Container>
  );
}
