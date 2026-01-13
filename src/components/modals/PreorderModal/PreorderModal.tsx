import {
  UserOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
} from '@/constants/icons/antd';
import { useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

type PreorderModalProps = {
  preorder?: InvoiceData | null;
  visible?: boolean;
  open?: boolean;
  isReady?: boolean;
  onCancel?: () => void;
};

const resolveTimestampSeconds = (value: InvoiceData['date']): number | null => {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Math.floor(parsed.getTime() / 1000);
    }
  }
  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }
  if (typeof value === 'object') {
    if (typeof value.seconds === 'number') return value.seconds;
    if (typeof value.toMillis === 'function') {
      const millis = value.toMillis();
      return Number.isFinite(millis) ? Math.floor(millis / 1000) : null;
    }
  }
  return null;
};

export const PreorderModal = ({
  preorder,
  visible,
  open,
  isReady = true,
  onCancel,
}: PreorderModalProps) => {
  const [isClientExpanded, setIsClientExpanded] = useState(false);
  const status =
    typeof preorder?.preorderDetails?.status === 'string'
      ? preorder.preorderDetails.status
      : null;
  const products = (preorder?.products ?? []) as InvoiceProduct[];
  const totalPurchaseValue = Number(preorder?.totalPurchase?.value ?? 0);
  const deliveryStatus = Boolean(preorder?.delivery?.status);
  const deliveryValue = Number(preorder?.delivery?.value ?? 0);
  const subtotalValue = deliveryStatus
    ? Math.max(totalPurchaseValue - deliveryValue, 0)
    : totalPurchaseValue;
  const createdAtSeconds = resolveTimestampSeconds(
    preorder?.preorderDetails?.date ?? null,
  );
  const createdAtLabel = createdAtSeconds
    ? new Date(createdAtSeconds * 1000).toLocaleString('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Fecha no disponible';
  const hasCreatedAt = Boolean(createdAtSeconds);
  const orderNumberValue = preorder?.preorderDetails?.numberID;
  const orderNumber =
    typeof orderNumberValue === 'string' || typeof orderNumberValue === 'number'
      ? String(orderNumberValue)
      : '—';
  const customerName =
    typeof preorder?.client?.name === 'string'
      ? preorder.client.name
      : 'Cliente sin nombre';
  const customerPhone =
    typeof preorder?.client?.tel === 'string' ? preorder.client.tel : 'N/A';
  const customerAddress =
    typeof preorder?.client?.address === 'string'
      ? preorder.client.address
      : 'Sin dirección';
  const hasClientExtra = customerAddress && customerAddress !== 'Sin dirección';

  const getStatusColor = (value: string | null | undefined) => {
    switch ((value || '').toLowerCase()) {
      case 'pending':
        return '#ea580c';
      case 'completed':
        return '#15803d';
      case 'cancelled':
        return '#dc2626';
      default:
        return '#475569';
    }
  };

  const getStatusName = (value: string | null | undefined) => {
    switch ((value || '').toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const statusTone = getStatusColor(status);
  const isVisible = typeof open === 'boolean' ? open : visible;
  const shouldRender = !!isVisible && isReady !== false;

  const closeModal = () => {
    setIsClientExpanded(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
      {shouldRender && (
        <ModalOverlay onClick={closeModal}>
          <ModalCard
            onClick={(event: React.MouseEvent<HTMLDivElement>) =>
              event.stopPropagation()
            }
          >
            <ModalHeader>
              <ModalTitle>
                <IconLabel>
                  <ShoppingOutlined />
                  Pedido #{orderNumber}
                </IconLabel>
              </ModalTitle>
              <CloseButton onClick={closeModal} aria-label="Cerrar">
                <CloseOutlined />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <StatusBadge $tone={statusTone}>
                <span>{getStatusName(status)}</span>
                {hasCreatedAt && <span>•</span>}
                <span>
                  {hasCreatedAt ? createdAtLabel : 'Fecha no disponible'}
                </span>
              </StatusBadge>

              <Section>
                <SectionHeader>
                  <SectionTitle>
                    <UserOutlined /> Cliente
                  </SectionTitle>
                  {hasClientExtra && (
                    <ToggleButton
                      type="button"
                      onClick={() => setIsClientExpanded((prev) => !prev)}
                      aria-expanded={isClientExpanded}
                      aria-label={
                        isClientExpanded
                          ? 'Ocultar detalles del cliente'
                          : 'Ver detalles del cliente'
                      }
                    >
                      {isClientExpanded ? <UpOutlined /> : <DownOutlined />}
                      {isClientExpanded ? 'Ocultar' : 'Ver detalles'}
                    </ToggleButton>
                  )}
                </SectionHeader>
                <InfoGrid>
                  <InfoLabel>{customerName}</InfoLabel>
                  <span>
                    <InfoLabel>Teléfono:</InfoLabel> {customerPhone}
                  </span>
                  {isClientExpanded && hasClientExtra && (
                    <span>
                      <InfoLabel>Dirección:</InfoLabel> {customerAddress}
                    </span>
                  )}
                </InfoGrid>
              </Section>

              <Section>
                <SectionTitle>
                  <ShoppingOutlined /> Productos ({products.length})
                </SectionTitle>
                <ProductsTable>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Cant.</th>
                      <th>Tamaño</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item, index) => (
                      <tr key={`${item?.name || 'producto'}-${index}`}>
                        <td>
                          {typeof item?.name === 'string'
                            ? item.name
                            : 'Sin nombre'}
                        </td>
                        <td>
                          {typeof item?.amountToBuy === 'number'
                            ? item.amountToBuy
                            : Number(item?.amountToBuy ?? 0) || 0}
                        </td>
                        <td>
                          {typeof item?.size === 'string' && item.size
                            ? item.size
                            : 'N/A'}
                        </td>
                        <td>
                          {formatPrice(Number(item?.pricing?.price ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ProductsTable>
              </Section>

              <Section>
                <SectionTitle>
                  <CreditCardOutlined /> Resumen
                </SectionTitle>
                <PaymentRow>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalValue)}</span>
                </PaymentRow>
                {deliveryStatus && (
                  <PaymentRow>
                    <span>Entrega</span>
                    <span>{formatPrice(deliveryValue)}</span>
                  </PaymentRow>
                )}
                <Separator />
                <PaymentTotal>
                  <span>Total</span>
                  <span>{formatPrice(totalPurchaseValue)}</span>
                </PaymentTotal>
              </Section>
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const IconLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #6b7280;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

type StatusBadgeStyleProps = { $tone?: string };

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${(props: StatusBadgeStyleProps) => props.$tone || '#475569'};
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  transition: color 0.2s;

  &:hover {
    color: #1d4ed8;
  }
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #374151;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const ProductsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th {
    text-align: left;
    padding: 8px;
    background: #f3f4f6;
    color: #374151;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #374151;
`;

const Separator = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 8px 0;
`;

const PaymentTotal = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

export default PreorderModal;
