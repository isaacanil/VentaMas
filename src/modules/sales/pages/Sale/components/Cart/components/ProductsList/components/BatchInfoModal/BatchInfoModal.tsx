import { Alert, Modal } from 'antd';
import { useEffect } from 'react';
import styled from 'styled-components';

import { useLocationNames } from '@/hooks/useLocationNames';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import type { Product as CartProduct } from '@/features/cart/types';

type TimestampLike = {
  seconds?: number;
  toDate?: () => Date;
};

type BatchInfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product?: CartProduct | null;
};

const InfoList = styled.div`
  display: grid;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #686868;
`;

const Value = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #3a3a3a;
  text-align: right;
`;

const formatDate = (value?: number | string | TimestampLike | null) => {
  if (!value) {
    return 'N/A';
  }

  let timestamp = null;

  if (typeof value === 'number') {
    timestamp = value;
  } else if (typeof value === 'string') {
    const parsed = Date.parse(value);
    timestamp = Number.isNaN(parsed) ? null : parsed;
  } else if (typeof value === 'object') {
    if (value.seconds !== undefined) {
      timestamp = value.seconds * 1000;
    } else if (typeof value.toDate === 'function') {
      timestamp = value.toDate().getTime();
    }
  }

  if (!timestamp) {
    return 'N/A';
  }

  return formatLocaleDate(timestamp);
};

export const BatchInfoModal = ({
  isOpen,
  onClose,
  product,
}: BatchInfoModalProps) => {
  const batchInfo = product?.batchInfo ?? null;
  const batchNumber =
    batchInfo?.batchNumber ??
    product?.batchNumberId ??
    product?.batchId ??
    'N/A';
  const quantity = batchInfo?.quantity ?? product?.stock ?? 'N/A';
  const expirationDate =
    batchInfo?.expirationDate ?? product?.expirationDate ?? null;
  const locationId =
    batchInfo?.locationId ?? product?.locationId ?? product?.location ?? null;
  const hasBatchData = Boolean(
    batchInfo || product?.batchId || product?.productStockId,
  );
  const { locationNames, fetchLocationName } = useLocationNames();
  const storedLocationName = batchInfo?.locationName ?? null;
  const locationNameInState = locationId ? locationNames[locationId] : null;
  const isStoredPlaceholder =
    storedLocationName === 'Cargando...' || storedLocationName === 'N/A';
  const locationLabel =
    locationNameInState || (!isStoredPlaceholder && storedLocationName) || null;

  useEffect(() => {
    if (!isOpen || !locationId) return;
    if (locationNameInState) return;
    if (storedLocationName && !isStoredPlaceholder) return;
    fetchLocationName(locationId);
  }, [
    fetchLocationName,
    isOpen,
    isStoredPlaceholder,
    locationId,
    locationNameInState,
    storedLocationName,
  ]);

  return (
    <Modal
      title={`Información del lote${product?.name ? ` · ${product.name}` : ''}`}
      open={isOpen}
      onCancel={onClose}
      onOk={onClose}
      okText="Cerrar"
      cancelButtonProps={{ style: { display: 'none' } }}
      centered
    >
      {hasBatchData ? (
        <InfoList>
          <InfoRow>
            <Label>Número de lote</Label>
            <Value>{batchNumber || 'N/A'}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Cantidad disponible</Label>
            <Value>{quantity ?? 'N/A'}</Value>
          </InfoRow>
          <InfoRow>
            <Label>Fecha de vencimiento</Label>
            <Value>{formatDate(expirationDate)}</Value>
          </InfoRow>
          {(locationLabel || locationId) && (
            <InfoRow>
              <Label>Ubicación</Label>
              <Value>{locationLabel || locationId}</Value>
            </InfoRow>
          )}
        </InfoList>
      ) : (
        <Alert
          showIcon
          type="info"
          message="Este producto no tiene un lote asociado."
          description="Puedes seleccionar un lote desde la búsqueda de inventario para ver los detalles aquí."
        />
      )}
    </Modal>
  );
};
