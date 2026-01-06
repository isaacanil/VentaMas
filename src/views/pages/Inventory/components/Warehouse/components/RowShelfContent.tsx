import { faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Button, List, Tag, message } from 'antd';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { openRowShelfForm } from '@/features/warehouse/rowShelfModalSlice';
import { openSegmentForm } from '@/features/warehouse/segmentModalSlice';
import {
  navigateWarehouse,
  selectWarehouse,
} from '@/features/warehouse/warehouseSlice';
import {
  deleteSegment,
  useListenAllSegments,
} from '@/firebase/warehouse/segmentService';
import type { InventoryUser } from '@/utils/inventory/types';
import type { Segment } from '@/models/Warehouse/Segment';

import { ProductsSection } from './ProductsSection';
import { DetailContainer, DetailItem } from './WarehouseContent';

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

type SegmentRecord = ReturnType<typeof useListenAllSegments>['data'][number];

type WarehouseState = ReturnType<typeof selectWarehouse>;

export default function RowShelfContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { rowId, warehouseId, shelfId } = useParams<{
    rowId?: string;
    warehouseId?: string;
    shelfId?: string;
  }>();
  const user = useSelector(selectUser) as InventoryUser | null;
  const location = useMemo(() => ({ id: rowId, type: 'rowShelf' }), [rowId]);
  const { selectedRowShelf: rowShelf } = useSelector(
    selectWarehouse,
  ) as WarehouseState;
  const { data: segments } = useListenAllSegments(
    warehouseId,
    shelfId,
    rowId,
  );

  useEffect(() => {
    if (!warehouseId || !shelfId || !rowId) {
      message.warning(
        'Faltan IDs para cargar los datos correctamente. Verifique la URL o la selección.',
      );
      navigate('/warehouses');
    }
  }, [warehouseId, shelfId, rowId, navigate]);

  const handleUpdateRowShelf = () => {
    if (!rowShelf) return;
    dispatch(openRowShelfForm({ data: rowShelf }));
  };

  const onNavigate = useCallback(
    (segment: SegmentRecord) => {
      if (!segment?.id) return;
      navigate(`segment/${segment.id}`);
      const normalizedSegment = segment as Segment;
      dispatch(navigateWarehouse({ view: 'segment', data: normalizedSegment }));
    },
    [navigate, dispatch],
  );

  const handleDeleteSegment = useCallback(
    async (segment: SegmentRecord) => {
      try {
        if (!user || !warehouseId || !shelfId || !rowId || !segment?.id) {
          message.error('No se pudo determinar la ubicación del segmento.');
          return;
        }
        await deleteSegment(user, warehouseId, shelfId, rowId, segment.id);
        message.success('Segmento eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el segmento: ', error);
        message.error('Error al eliminar el segmento');
      }
    },
    [user, warehouseId, shelfId, rowId],
  );

  const handleAddSegment = () => {
    dispatch(openSegmentForm({}));
  };

  const handleUpdateSegment = useCallback(
    (segment: SegmentRecord) => {
      dispatch(openSegmentForm({ data: segment }));
    },
    [dispatch],
  );

  const renderActions = useCallback(
    (segment: SegmentRecord) => [
      <Button
        key="edit-segment"
        icon={<FontAwesomeIcon icon={faEdit} />}
        onClick={(e) => {
          e.stopPropagation();
          handleUpdateSegment(segment);
        }}
      />,
      <Button
        key="delete-segment"
        icon={icons.editingActions.delete}
        danger
        onClick={(e) => {
          e.stopPropagation();
          Modal.confirm({
            title: 'Eliminar Segmento de Fila',
            content: '¿Estás seguro de que deseas eliminar este segmento?',
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: () => handleDeleteSegment(segment),
          });
        }}
      />,
    ],
    [handleDeleteSegment, handleUpdateSegment],
  );

  return (
    <Container>
      <RowShelfInfo>
        <InfoHeader>
          <SectionTitle>Información de la Fila</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={handleUpdateRowShelf}
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
            <strong>Capacidad:</strong> <Tag>{rowShelf?.capacity}</Tag>
          </DetailItem>
          <DetailItem>
            <strong>Descripción:</strong> {rowShelf?.description}
          </DetailItem>
        </DetailContainer>
      </RowShelfInfo>
      <Body>
        <ProductsSection location={location} />
        <SectionContent>
          <SectionHeader>
            <SectionTitle>Segmentos en la Fila</SectionTitle>
            <AddButton
              type="primary"
              icon={<FontAwesomeIcon icon={faPlusCircle} />}
              onClick={handleAddSegment}
            >
              Añadir
            </AddButton>
          </SectionHeader>
          <List
            dataSource={segments ?? []}
            renderItem={(segment) => (
              <List.Item
                key={segment.id}
                actions={renderActions(segment)}
                onClick={() => onNavigate(segment)}
              >
                <List.Item.Meta
                  title={segment.name}
                  description={`Capacidad: ${segment.capacity} unidades`}
                />
              </List.Item>
            )}
          />
        </SectionContent>
      </Body>
    </Container>
  );
}

