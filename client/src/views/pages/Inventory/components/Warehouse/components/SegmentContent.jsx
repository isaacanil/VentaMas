import React, { useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import SegmentForm from "../forms/SegmentForm/SegmentForm";

const { Modal, Button, List } = antd;

// Estilos personalizados usando styled-components
const Container = styled.div`
  display: grid;
  gap: 1em;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;


const SegmentInfo = styled.div`
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
  display: flex;
  align-items: center;
`;

const Body = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

export default function SegmentContent({ segment }) {
  // Estado para almacenar los productos asociados con el segmento
  const [products, setProducts] = useState([
    { id: 1, name: "Producto Y", quantity: 20, batch: "Lote B", expirationDate: "2024-12-31" },
  ]);



  // Estado para manejar la apertura del formulario de productos
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSegmentFormOpen, setIsSegmentFormOpen] = useState(false);

  // Manejar la adición de un nuevo producto al segmento
  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };

  // Manejar la acción de editar la información del segmento
  const handleEditSegmentInfo = () => {
    setIsSegmentFormOpen(true);
  };

  // Manejar la acción de guardar la información del segmento
  const handleSaveSegment = (newSegment) => {
    console.log("Guardar información del segmento", newSegment);
    setIsSegmentFormOpen(false);
  };

  return (
    <Container>
      <SegmentInfo>
        <InfoHeader>
          <SectionTitle>Información del Segmento</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleEditSegmentInfo}
          >
            Editar
          </Button>
        </InfoHeader>
        <p>
          <strong>Nombre:</strong> {segment.name}
        </p>
        <p>
          <strong>Capacidad:</strong> {segment.capacity} unidades
        </p>
        {/* Agregar más detalles si es necesario */}
      </SegmentInfo>

      <Body>
        <SectionContent>
          <SectionHeader>
            <SectionTitle>Productos en el Segmento</SectionTitle>
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
                  description={`Cantidad: ${product.quantity}, Lote: ${product.batch}, Expiración: ${product.expirationDate || "N/A"}`}
                />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>

      <SegmentForm
        visible={isSegmentFormOpen}
        onClose={() => setIsSegmentFormOpen(false)}
        onSave={handleSaveSegment}
        initialData={segment}
      />

      {/* Modal para agregar/editar productos */}
      <Modal
        title="Añadir/Editar Producto"
        open={isProductFormOpen}
        onCancel={() => setIsProductFormOpen(false)}
        footer={null}
      >
        {/* Aquí iría el componente de formulario de producto */}
        {/* <ProductForm onSave={handleSaveProduct} /> */}
      </Modal>
    </Container>
  );
}