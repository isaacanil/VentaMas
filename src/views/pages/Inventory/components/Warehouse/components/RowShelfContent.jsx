import { faPlusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as antd from 'antd';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '../../../../../../constants/icons/icons';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { openRowShelfForm } from '../../../../../../features/warehouse/rowShelfModalSlice';
import { openSegmentForm } from '../../../../../../features/warehouse/segmentModalSlice';
import {
  navigateWarehouse,
  selectWarehouse,
} from '../../../../../../features/warehouse/warehouseSlice';
import {
  deleteSegment,
  useListenAllSegments,
} from '../../../../../../firebase/warehouse/segmentService';

import { ProductsSection } from './ProductsSection';
import { DetailContainer, DetailItem } from './WarehouseContent';

const { Modal, Button, List, Tag, message } = antd;

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
  margin-bottom: 0; /* Alineación con el título */
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1em;
`;

export default function RowShelfContent() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { rowId, warehouseId, shelfId } = useParams();
  const user = useSelector(selectUser);
  const location = useMemo(() => ({ id: rowId, type: 'rowShelf' }), [rowId]);
  const { selectedRowShelf: rowShelf } = useSelector(selectWarehouse);
  const { data: segments } = useListenAllSegments(warehouseId, shelfId, rowId);

  useEffect(() => {
    if (!warehouseId || !shelfId || !rowId) {
      message.warning(
        'Faltan IDs para cargar los datos correctamente. Verifique la URL o la selección.',
      );
      navigate('/warehouses'); // Redirigir al usuario si faltan IDs
      return;
    }
  }, [warehouseId, shelfId, rowId, dispatch, navigate]);

  const handleUpdateRowShelf = () => {
    dispatch(openRowShelfForm(rowShelf));
  };

  const onNavigate = useCallback(
    (segment) => {
      navigate(`segment/${segment?.id}`);
      dispatch(navigateWarehouse({ view: 'segment', data: segment }));
    },
    [navigate, dispatch],
  );

  const handleDeleteSegment = async (segment) => {
    try {
      await deleteSegment(user, warehouseId, shelfId, rowId, segment.id);
      message.success('Segmento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el segmento: ', error);
      message.error('Error al eliminar el segmento');
    }
  };

  const handleAddSegment = () => {
    dispatch(openSegmentForm());
  };

  const handleUpdateSegment = (segment) => {
    dispatch(openSegmentForm(segment));
  };

  const renderActions = useCallback(
    (segment) => [
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
