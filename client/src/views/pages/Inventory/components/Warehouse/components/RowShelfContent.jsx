import React, { useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import RowShelfForm from "../forms/RowShelfForm/RowShelfForm";
import SegmentForm from "../forms/SegmentForm/SegmentForm";

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

export default function RowShelfContent({ rowShelf, onNavigate }) {
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [products, setProducts] = useState([
    { id: 1, name: "Producto Z", quantity: 20, batch: "Lote Z", expirationDate: null },
    { id: 2, name: "Producto W", quantity: 30, batch: "Lote W", expirationDate: null },
    { id: 3, name: "Producto X", quantity: 25, batch: "Lote X", expirationDate: null },
    { id: 4, name: "Producto Y", quantity: 15, batch: "Lote Y", expirationDate: null },
    { id: 5, name: "Producto V", quantity: 10, batch: "Lote V", expirationDate: null },
  ]);

  const [segments, setSegments] = useState([
    { id: 1, name: "Segmento 1", capacity: 30 },
    { id: 2, name: "Segmento 2", capacity: 20 },
  ]);

  const [isRowShelfFormOpen, setIsRowShelfFormOpen] = useState(false);
  const [isSegmentFormOpen, setIsSegmentFormOpen] = useState(false);

  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };

  const handleEditRowShelfInfo = () => {
    setIsRowShelfFormOpen(true);
  };

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
        <p>
          <strong>Nombre:</strong> {rowShelf.name}
        </p>
        <p>
          <strong>Capacidad:</strong> {rowShelf.capacity} unidades
        </p>
        {/* Agregar más detalles si es necesario */}
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
              <List.Item onClick={() => onNavigate("segment", segment, ["Warehouse", rowShelf.name, segment.name])}>
                <List.Item.Meta title={segment.name} description={`Capacidad: ${segment.capacity} unidades`} />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>

      <RowShelfForm 
        visible={isRowShelfFormOpen}
        onClose={() => setIsRowShelfFormOpen(false)}
        onSave={(newRowShelf) => console.log(newRowShelf)}
      />

      <SegmentForm
        visible={isSegmentFormOpen}
        onClose={() => setIsSegmentFormOpen(false)}
        onSave={(newSegment) => console.log(newSegment)}
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
