import { faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, List, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { openRowShelfForm } from '@/features/warehouse/rowShelfModalSlice';
import { openShelfForm } from '@/features/warehouse/shelfModalSlice';
import {
  navigateWarehouse,
  selectWarehouse,
} from '@/features/warehouse/warehouseSlice';
import {
  deleteRowShelf,
  useListenRowShelves,
} from '@/firebase/warehouse/RowShelfService';
import type { InventoryUser } from '@/utils/inventory/types';
import type { RowShelf } from '@/models/Warehouse/RowShelf';

import { ProductStockForm } from '@/views/pages/Inventory/components/Warehouse/forms/ProductStockForm/ProductStockForm';
import { ProductsSection } from './ProductsSection';
import { DetailContainer, DetailItem } from './WarehouseContent';

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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  display: flex;
  align-items: center;
  margin-bottom: 0;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1em;
`;

const DetailText = styled.p`
  margin: 8px 0;
  font-size: 14px;
  color: #333;

  & > strong {
    font-weight: 600;
  }
`;

type WarehouseState = ReturnType<typeof selectWarehouse>;

type RowShelfRecord = ReturnType<typeof useListenRowShelves>['data'][number];

export default function ShelfContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as InventoryUser | null;
  const { shelfId } = useParams<{ shelfId?: string }>();
  const { selectedWarehouse: warehouse, selectedShelf: shelf } = useSelector(
    selectWarehouse,
  ) as WarehouseState;
  const location = useMemo(() => ({ id: shelfId, type: 'shelf' }), [shelfId]);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const { data: rowShelves } = useListenRowShelves(warehouse?.id, shelf?.id);
  const createdAtSeconds = (shelf as { createdAt?: { seconds?: number } } | null)?.createdAt?.seconds;
  const updatedAtSeconds = (shelf as { updatedAt?: { seconds?: number } } | null)?.updatedAt?.seconds;

  const onNavigate = (row: RowShelfRecord) => {
    if (!row?.id) return;
    navigate(`row/${row.id}`);
    const normalizedRow = row as RowShelf;
    dispatch(navigateWarehouse({ view: 'rowShelf', data: normalizedRow }));
  };

  const handleEditShelfInfo = () => {
    if (!shelf) return;
    dispatch(openShelfForm({ data: shelf }));
  };

  const handleAddRowShelf = () => dispatch(openRowShelfForm({}));

  const handleUpdateShelf = (data: RowShelfRecord) =>
    dispatch(openRowShelfForm({ data }));

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
          <DetailText>
            <strong>Nombre:</strong> {shelf?.name}
          </DetailText>
          <DetailText>
            <strong>Nombre Corto:</strong> {shelf?.shortName}
          </DetailText>
          <DetailText>
            <strong>Capacidad de Fila:</strong>{' '}
            <Tag>{shelf?.rowCapacity}</Tag>
          </DetailText>
          <DetailText>
            <strong>Descripción:</strong> {shelf?.description}
          </DetailText>
          <DetailText>
            <strong>Fecha de Creación:</strong> {createdAtSeconds ?? ''}
          </DetailText>
          <DetailText>
            <strong>Última Actualización:</strong> {updatedAtSeconds ?? ''}
          </DetailText>
        </DetailContainer>
      </ShelfInfo>
      <Body>
        <ProductsSection location={location} />
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
            dataSource={rowShelves ?? []}
            renderItem={(row) => (
              <List.Item
                key={row.id}
                actions={[
                  <Button
                    key="edit-row"
                    icon={<FontAwesomeIcon icon={faEdit} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateShelf(row);
                    }}
                  />,
                  <Button
                    key="delete-row"
                    icon={icons.editingActions.delete}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      Modal.confirm({
                        title: 'Eliminar Fila de Estante',
                        content:
                          '¿Estás seguro de que deseas eliminar esta fila de estante?',
                        okText: 'Eliminar',
                        okType: 'danger',
                        cancelText: 'Cancelar',
                        onOk: async () => {
                          try {
                            if (!user || !warehouse?.id || !shelf?.id || !row.id) {
                              message.error('No se pudo determinar la ubicación.');
                              return;
                            }
                            await deleteRowShelf(
                              user,
                              warehouse.id,
                              shelf.id,
                              row.id,
                            );
                            message.success('Estante eliminado correctamente');
                          } catch (error) {
                            console.error('Error al eliminar el estante: ', error);
                            message.error('Error al eliminar el estante');
                          }
                        },
                      });
                    }}
                  />,
                ]}
                onClick={() => onNavigate(row)}
              >
                <List.Item.Meta
                  title={row.name}
                  description={`Capacidad: ${row.capacity}`}
                />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>
      <ProductStockForm
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        location={location}
        initialData={null}
      />
    </Container>
  );
}

