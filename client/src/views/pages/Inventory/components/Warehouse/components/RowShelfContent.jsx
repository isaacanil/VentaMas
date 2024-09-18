import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import RowShelfForm from "../forms/RowShelfForm/RowShelfForm";
import SegmentForm from "../forms/SegmentForm/SegmentForm";
import { DetailContainer, DetailItem } from "./WarehouseContent";
import { getAllRowShelves, listenAllRowShelves } from "../../../../../../firebase/warehouse/RowShelfService";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { getAllSegments, listenAllSegments } from "../../../../../../firebase/warehouse/SegmentService";
import { useNavigate } from "react-router-dom";

const { Modal, Button, List } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
`;
const RowShelfInfo = styled.div`
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

export default function RowShelfContent( ) {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const { selectedWarehouse, selectedShelf, selectedRowShelf } = useSelector(selectWarehouse);
  const rowShelf = selectedRowShelf;
  const [products, setProducts] = useState([]);
  const user = useSelector(selectUser);
  const [segments, setSegments] = useState([]);
  const [isRowShelfFormOpen, setIsRowShelfFormOpen] = useState(false);
  const [isSegmentFormOpen, setIsSegmentFormOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchRowShelves = async () => {
      try {
        if (selectedWarehouse && selectedShelf) {
         await listenAllSegments(
            user,
            selectedWarehouse?.id,
            selectedShelf?.id,
            selectedRowShelf?.id,
            setSegments
          )

        }
      } catch (error) {
        console.error("Error fetching row shelves: ", error);
      }
    };

    fetchRowShelves();
  }, [selectedWarehouse, selectedShelf]);

console.log("Rows: ", segments);

  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };

  const handleEditRowShelfInfo = () => {
    setIsRowShelfFormOpen(true);
  };
  
  const onNavigate = (segment) => {
    navigate(`segment/${segment?.id}`);
    dispatch(navigateWarehouse({ view: "segment", data: segment }))
  }
  return (
    <Container>
      <RowShelfInfo>
        <InfoHeader>
          <SectionTitle>Información de la Fila</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleEditRowShelfInfo}
          >
            Editar
          </Button>
        </InfoHeader>
        <DetailContainer>
 
          <DetailItem>
            <strong>Nombre:</strong> {rowShelf?.name}
          </DetailItem>
          <DetailItem>
            <strong>Nombre Corto:</strong> {rowShelf?.shortName}
          </DetailItem>
          <DetailItem>
            <strong>Capacidad:</strong> {rowShelf?.capacity}
          </DetailItem>
          <DetailItem>
            <strong>Descripción:</strong> {rowShelf?.description}
          </DetailItem>
   
        </DetailContainer>
      </RowShelfInfo>
      <Body>
        <SectionContent>
          <SectionHeader>
            <SectionTitle>Productos en la Fila</SectionTitle>
            <AddButton
              type="primary"
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={() => setIsProductFormOpen(true)}
            >
              Añadir
            </AddButton>
          </SectionHeader>
          <List
            dataSource={products}
            renderItem={(product) => (
              <List.Item>
                <List.Item.Meta
                  title={product.name}
                  description={`Cantidad: ${product.quantity}, Lote: ${product.batch}`}
                />
              </List.Item>
            )}
          />
        </SectionContent>

        <SectionContent>
          <SectionHeader>
            <SectionTitle>Segmentos en la Fila</SectionTitle>
            <AddButton
              type="primary"
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={() => setIsSegmentFormOpen(true)}
            >
              Añadir
            </AddButton>
          </SectionHeader>
          <List
            dataSource={segments}
            renderItem={(segment) => (
              <List.Item onClick={() => onNavigate(segment)}>
                <List.Item.Meta title={segment.name} description={`Capacidad: ${segment.capacity} unidades`} />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>

      <RowShelfForm
        visible={isRowShelfFormOpen}
        onClose={() => setIsRowShelfFormOpen(false)}
      />

      <SegmentForm
        visible={isSegmentFormOpen}
        onClose={() => setIsSegmentFormOpen(false)}
      />

      {/* Modal para agregar/editar productos */}
      <Modal
        title="Añadir/Editar Producto"
        open={isProductFormOpen}
        onCancel={() => setIsProductFormOpen(false)}
        footer={null}
      >
        {/* <ProductForm onSave={handleSaveProduct} /> */}
      </Modal>
    </Container>
  );
}
