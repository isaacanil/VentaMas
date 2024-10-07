import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import { DetailContainer } from "./WarehouseContent";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { deleteRowShelf, getAllRowShelves, listenAllRowShelves, useListenRowShelves } from "../../../../../../firebase/warehouse/RowShelfService";
import { useNavigate, useParams } from "react-router-dom";
import { ProductStockForm } from "../forms/ProductStockForm/ProductStockForm";
import { ProductsSection } from "./ProductsSection";
import { icons } from "../../../../../../constants/icons/icons";
import { openRowShelfForm } from "../../../../../../features/warehouse/rowShelfSlice";
import { openShelfForm } from "../../../../../../features/warehouse/shelfSlice";


const { Modal, Button, List, Tag, message } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
`;
const ShelfInfo = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const InfoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5em;
  color: #333;
`;

const SectionContent = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const AddButton = styled(Button)`
  margin-bottom: 0; /* Alineación con el título */
  display: flex;
  align-items: center;
`;

const Body = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const DetailItem = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #333;


  & > strong {
    font-weight: 600;
 /* Color distintivo para los títulos de los detalles */
  }
`;

export default function ShelfContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { shelfId } = useParams();
  const { selectedWarehouse: warehouse, selectedShelf: shelf } = useSelector(selectWarehouse);
  const [location, setLocation] = useState({ id: shelfId, type: "shelf" })

  const [isRowShelfFormOpen, setIsRowShelfFormOpen] = useState(false);
  const [isOpenShelfForm, setIsOpenShelfForm] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const { data : rowShelves, loading, error } = useListenRowShelves(warehouse?.id, shelf?.id);

  const onNavigate = (row) => {
    navigate(`row/${row.id}`);
    dispatch(navigateWarehouse({ view: "rowShelf", data: row })); // Actualiza el estado global de Redux
  };

  const handleEditShelfInfo = () => {
    dispatch(openShelfForm(shelf));
    setIsOpenShelfForm(true);
  }

  const handleAddRowShelf = () => {
    dispatch(openRowShelfForm());
  }
  const handleUpdateShelf = (data) => {
    dispatch(openRowShelfForm(data));
  }
  return (
    <Container>
      <ShelfInfo>
        <InfoHeader>
          <SectionTitle>Información del Estante</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleEditShelfInfo}
          >
            Editar
          </Button>
        </InfoHeader>
        <DetailContainer>
          <DetailItem>
            <strong>Nombre:</strong> {shelf?.name}
          </DetailItem>
          <DetailItem>
            <strong>Nombre Corto:</strong> {shelf?.shortName}
          </DetailItem>
          <DetailItem>
            <strong>Capacidad de Fila:</strong> <Tag>{shelf?.rowCapacity}</Tag>
          </DetailItem>
          <DetailItem>
            <strong>Descripción:</strong> {shelf?.description}
          </DetailItem>
          <DetailItem>
            <strong>Fecha de Creación:</strong> {shelf?.createdAt?.seconds}
          </DetailItem>
          <DetailItem>
            <strong>Última Actualización:</strong> {shelf?.updatedAt?.seconds}
          </DetailItem>
        </DetailContainer>
      </ShelfInfo>
      <Body>
        <ProductsSection
          location={location}
        />
        <SectionContent>
          <SectionHeader>
            <SectionTitle>Filas en el Estante</SectionTitle>
            <AddButton
              type="primary"
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={handleAddRowShelf}
            >
              Añadir
            </AddButton>
          </SectionHeader>
          <List
            dataSource={rowShelves}
            renderItem={(row) => (
              <List.Item
                actions={[
                  <Button
                    icon={<FontAwesomeIcon icon={faEdit} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateShelf(row);
                    }}
                  >
                  </Button>,
                  <Button
                    icon={icons.editingActions.delete}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: "Eliminar Fila de Estante",
                        content: "¿Estás seguro de que deseas eliminar esta fila de estante?",
                        okText: "Eliminar",
                        okType: "danger",
                        cancelText: "Cancelar",
                        onOk: async () => {
                          try {
                            await deleteRowShelf(user, warehouse.id, shelf.id, row.id);
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
                onClick={() => onNavigate(row)}>
                <List.Item.Meta title={row.name} description={`Capacidad: ${row.capacity}`} />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>
      <ProductStockForm
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        location={location}
        initialData={null} // Si es un producto nuevo, null
      />
    </Container>
  );
}
