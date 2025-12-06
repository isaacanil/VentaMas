import {
  UserOutlined,
  ShoppingOutlined,
  CreditCardOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../hooks/useFormatPrice';

const IconLabel = styled.span`
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 35%);
`;

const ModalCard = styled.article`
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  width: min(720px, 92vw);
  max-height: 90vh;
  padding: 20px;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 18px 36px rgb(15 23 42 / 18%);
`;

const ModalHeader = styled.header`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: color 0.2s ease;

  &:hover {
    color: #0f172a;
  }
`;

const ModalBody = styled.div`
  display: grid;
  gap: 14px;
  align-content: flex-start;
  max-height: calc(90vh - 110px);
  padding-right: 8px;
  overflow-y: auto;
`;

const Section = styled.section`
  display: grid;
  gap: 12px;
  padding: 14px;
  text-align: left;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
`;

const SectionTitle = styled.h4`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
`;

const SectionHeader = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

const ToggleButton = styled.button`
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #1d4ed8;
  cursor: pointer;
  background: #fff;
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: #eff6ff;
    border-color: #93c5fd;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $tone }) => $tone};
  background: ${({ $tone }) => `${$tone}1f`};
  border-radius: 999px;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #334155;
  text-align: left;
`;

const InfoLabel = styled.span`
  font-weight: 500;
  color: #0f172a;
`;

const ProductsTable = styled.table`
  width: 100%;
  font-size: 0.85rem;
  border-collapse: collapse;

  thead th {
    padding: 6px 10px;
    font-weight: 600;
    color: #475569;
    text-align: left;
  }

  tbody tr {
    border-top: 1px solid #e2e8f0;
  }

  tbody td {
    padding: 8px 10px;
    vertical-align: top;
    color: #1f2937;
    text-align: left;
  }

  tbody td:last-child,
  thead th:last-child {
    text-align: right;
  }
`;

const PaymentRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #1f2937;
`;

const PaymentTotal = styled(PaymentRow)`
  margin-top: 6px;
  font-size: 1rem;
  font-weight: 600;
`;

const Separator = styled.hr`
  margin: 4px 0;
  border: none;
  border-top: 1px dashed #cbd5f5;
`;

export default function PreorderModal({ preorder, open, onCancel }) {
  const [isClientExpanded, setIsClientExpanded] = useState(false);
  const isReady = Boolean(preorder);
  const visible = open ?? false;
  const status = preorder?.status ?? '';
  const products = preorder?.products ?? [];
  const totalPurchaseValue = Number(preorder?.totalPurchase?.value ?? 0);
  const deliveryStatus = Boolean(preorder?.delivery?.status);
  const deliveryValue = Number(preorder?.delivery?.value ?? 0);
  const subtotalValue = deliveryStatus
    ? Math.max(totalPurchaseValue - deliveryValue, 0)
    : totalPurchaseValue;
  const createdAtSeconds = preorder?.preorderDetails?.date?.seconds;
  const createdAtLabel = createdAtSeconds
    ? new Date(createdAtSeconds * 1000).toLocaleString('es-DO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Fecha no disponible';
  const hasCreatedAt = Boolean(createdAtSeconds);
  const orderNumber = preorder?.preorderDetails?.numberID ?? '—';
  const customerName = preorder?.client?.name ?? 'Cliente sin nombre';
  const customerPhone = preorder?.client?.tel || 'N/A';
  const customerAddress = preorder?.client?.address || 'Sin dirección';
  const hasClientExtra = customerAddress && customerAddress !== 'Sin dirección';

  const getStatusColor = (value) => {
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

  const getStatusName = (value) => {
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

  const closeModal = () => {
    setIsClientExpanded(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
      {isReady && visible && (
        <ModalOverlay onClick={closeModal}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
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
                        <td>{item?.name || 'Sin nombre'}</td>
                        <td>{item?.amountToBuy ?? 0}</td>
                        <td>{item?.size || 'N/A'}</td>
                        <td>
                          {useFormatPrice(Number(item?.pricing?.price ?? 0))}
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
                  <span>{useFormatPrice(subtotalValue)}</span>
                </PaymentRow>
                {deliveryStatus && (
                  <PaymentRow>
                    <span>Entrega</span>
                    <span>{useFormatPrice(deliveryValue)}</span>
                  </PaymentRow>
                )}
                <Separator />
                <PaymentTotal>
                  <span>Total</span>
                  <span>{useFormatPrice(totalPurchaseValue)}</span>
                </PaymentTotal>
              </Section>
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
}
