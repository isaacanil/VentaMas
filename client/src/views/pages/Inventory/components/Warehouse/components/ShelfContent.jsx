import React, { useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import { ShelfForm } from "../forms/ShelfForm/ShelfForm";
import RowShelfForm from "../forms/RowShelfForm/RowShelfForm";

const { Modal, Button, List } = antd;

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

export default function ShelfContent({ shelf, onNavigate }) {
  const [rowShelves, setRowShelves] = useState([
    { id: 1, name: "Fila A1", capacity: 50 },
    { id: 2, name: "Fila B2", capacity: 75 },
    { id: 3, name: "Fila C3", capacity: 60 },
  ]);
  const [selectedRowShelf, setSelectedRowShelf] = useState(null);
  const [isRowShelfFormOpen, setIsRowShelfFormOpen] = useState(false);
  const [isOpenShelfForm, setIsOpenShelfForm] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [products, setProducts] = useState([
    { id: 1, name: "Producto X", quantity: 30, batch: "Lote A", expirationDate: null },
  ]);

  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };
  
  const handleSaveRowShelf = (newRowShelf) => {
    setRowShelves([...rowShelves, newRowShelf]);
    setIsRowShelfFormOpen(false);
  };

  const handleEditShelfInfo = () => {
    setIsOpenShelfForm(true);
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
        <p>
          <strong>Nombre:</strong> {shelf.name}
        </p>
        <p>
          <strong>Capacidad:</strong> {shelf.capacity} unidades
        </p>
        {/* Agregar más detalles si es necesario */}
      </ShelfInfo>

      <Body>
        <SectionContent>
          <SectionHeader>
            <SectionTitle>Productos en el Estante</SectionTitle>
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
            <SectionTitle>Filas en el Estante</SectionTitle>
            <AddButton
              type="primary"
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={() => setIsRowShelfFormOpen(true)}
            >
              Añadir
            </AddButton>
          </SectionHeader>
          <List
            dataSource={rowShelves}
            renderItem={(row) => (
              <List.Item onClick={() => onNavigate("rowShelf", row, ["Warehouse", shelf.name, row.name])}>
                <List.Item.Meta title={row.name} description={`Capacidad: ${row.capacity} unidades`} />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>

      <ShelfForm
        visible={isOpenShelfForm}
        onClose={() => setIsOpenShelfForm(false)}
        onSave={handleEditShelfInfo}
      />

      <RowShelfForm
        visible={isRowShelfFormOpen}
        onClose={() => setIsRowShelfFormOpen(false)}
        onSave={handleSaveRowShelf}
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
