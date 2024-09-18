import React, { useEffect, useState } from "react";
import styled from "styled-components";
import * as antd from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit } from "@fortawesome/free-solid-svg-icons";
import { ShelfForm } from "../forms/ShelfForm/ShelfForm";
import RowShelfForm from "../forms/RowShelfForm/RowShelfForm";
import { DetailContainer } from "./WarehouseContent";
import { selectUser } from "../../../../../../features/auth/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { navigateWarehouse, selectWarehouse } from "../../../../../../features/warehouse/warehouseSlice";
import { getAllRowShelves, listenAllRowShelves } from "../../../../../../firebase/warehouse/RowShelfService";
import { useNavigate } from "react-router-dom";


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
  const [rowShelves, setRowShelves] = useState([]);
  const [products, setProducts] = useState([]);
  const user = useSelector(selectUser);

  const { selectedWarehouse, selectedShelf } = useSelector(selectWarehouse);
  const shelf = selectedShelf;

  const [isRowShelfFormOpen, setIsRowShelfFormOpen] = useState(false);
  const [isOpenShelfForm, setIsOpenShelfForm] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    // Llamar a la función de lectura de filas de estante cuando el componente se monte
    const fetchRowShelves = async () => {
      try {
        if (selectedWarehouse && selectedShelf) {
          await listenAllRowShelves(
            user,
            selectedWarehouse?.id,
            selectedShelf?.id,
            setRowShelves
          )
        
        }
      } catch (error) {
        console.error("Error fetching row shelves: ", error);
      }
    };

    fetchRowShelves();
  }, [selectedWarehouse, selectedShelf]);

  const handleSaveProduct = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsProductFormOpen(false);
  };

  const handleSaveRowShelf = (newRowShelf) => {
    setRowShelves([...rowShelves, newRowShelf]);
    setIsRowShelfFormOpen(false);
  };

  const onNavigate = (row) => {
    navigate(`row/${row.id}`);
    dispatch(navigateWarehouse({ view: "rowShelf", data: row })); // Actualiza el estado global de Redux
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
        <DetailContainer>
 
          <DetailItem>
            <strong>Nombre:</strong> {shelf?.name }
          </DetailItem>
          <DetailItem>
            <strong>Nombre Corto:</strong> {shelf?.shortName}
          </DetailItem>
   
          <DetailItem>
            <strong>Capacidad de Fila:</strong> {shelf?.rowCapacity} unidades
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
                  description={`Cantidad: ${product?.quantity}, Lote: ${product?.batch}`}
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
              <List.Item onClick={() => onNavigate(row)}>
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
