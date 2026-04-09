import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Tag } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { openSegmentForm } from '@/features/warehouse/segmentModalSlice';
import { selectWarehouse } from '@/features/warehouse/warehouseSlice';
import type { LocationRefLike } from '@/utils/inventory/types';

import { ProductsSection } from './ProductsSection';
import { DetailContainer, DetailItem } from './WarehouseContent';

const Container = styled.div`
  display: grid;
  gap: 1em;
`;

const SegmentInfo = styled.div`
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

const SectionTitle = styled.h3`
  font-size: 1.5em;
  color: #333;
`;

const Body = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1em;
`;

type WarehouseState = ReturnType<typeof selectWarehouse>;

type SegmentRecord = WarehouseState['selectedSegment'];

export default function SegmentContent() {
  const dispatch = useDispatch();
  const { segmentId } = useParams<{ segmentId?: string }>();
  const location: LocationRefLike = {
    segmentId,
  };
  const { selectedSegment: segment } = useSelector(
    selectWarehouse,
  ) as WarehouseState;

  const handleUpdateSegment = (segmentData: SegmentRecord) => {
    if (!segmentData) return;
    dispatch(openSegmentForm(segmentData));
  };

  return (
    <Container>
      <SegmentInfo>
        <InfoHeader>
          <SectionTitle>Información del Segmento</SectionTitle>
          <Button
            type="default"
            icon={<FontAwesomeIcon icon={faEdit} />}
            onClick={() => handleUpdateSegment(segment)}
          >
            Editar
          </Button>
        </InfoHeader>
        <DetailContainer>
          <DetailItem>
            <strong>Nombre:</strong> {segment?.name || 'N/A'}
          </DetailItem>
          <DetailItem>
            <strong>Nombre Corto:</strong> {segment?.shortName || 'N/A'}
          </DetailItem>
          <DetailItem>
            <strong>Capacidad:</strong> <Tag>{segment?.capacity || 'N/A'}</Tag>
          </DetailItem>
          <DetailItem>
            <strong>Descripción:</strong> {segment?.description || 'N/A'}
          </DetailItem>
        </DetailContainer>
      </SegmentInfo>

      <Body>
        <ProductsSection location={location} />
      </Body>
    </Container>
  );
}
