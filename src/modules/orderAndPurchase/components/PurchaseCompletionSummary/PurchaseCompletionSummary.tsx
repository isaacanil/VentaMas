import {
  ShopOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Modal } from 'antd';
import { m } from 'framer-motion';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import type { Purchase, PurchaseReplenishment } from '@/utils/purchase/types';

interface PurchaseCompletionSummaryProps {
  visible: boolean;
  onClose: () => void;
  purchase?: Purchase | null;
}

/** Safely coerce Firestore values (may arrive as strings) to number. */
const toNum = (v: unknown): number => Number(v) || 0;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: rgb(255 255 255 / 98%);
    border-radius: 16px;
    backdrop-filter: blur(20px);
  }
`;

const Content = styled(m.div)`
  padding: 24px 20px;
  text-align: center;
`;

const IconWrapper = styled.div`
  margin-bottom: 24px;
  font-size: 48px;
  color: var(--primary-color, #1677ff);
`;

const Title = styled.div`
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 500;
`;

const Total = styled.div`
  margin: 32px 0;
  font-size: 40px;
  font-weight: 600;
  font-feature-settings: 'tnum';
  color: var(--primary-color, #1677ff);
`;

const ProductSummary = styled.div`
  max-height: 120px;
  padding: 16px;
  margin: 16px 0;
  overflow-y: auto;
  font-size: 14px;
  text-align: left;
  background: rgb(0 0 0 / 2%);
  border-radius: 12px;

  & code {
    padding: 0;
    color: inherit;
    background: none;
  }

  & p {
    margin: 0;
    line-height: 1.4;
  }
`;

const ProductCount = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #666;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled(m.button)`
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 15px;
  color: #fff;
  cursor: pointer;
  background: #000;
  border: none;
  border-radius: 22px;

  &:hover {
    background: var(--primary-color, #1677ff);
  }

  &.secondary {
    color: #000;
    background: #f5f5f5;

    &:hover {
      background: #e8e8e8;
    }
  }

  &:disabled {
    color: #666;
    cursor: not-allowed;
    background: #d9d9d9;
    opacity: 0.5;
  }
`;

export default function PurchaseCompletionSummary({
  visible,
  onClose,
  purchase,
}: PurchaseCompletionSummaryProps) {
  const navigate = useNavigate();
  const items = purchase?.replenishments ?? [];
  const total = items.reduce((sum, item) => sum + toNum(item.subtotal), 0);
  const destinationWarehouseId = purchase?.destinationWarehouseId;
  const warehouseNavigationPath = destinationWarehouseId
    ? `/inventory/warehouses/warehouse/${destinationWarehouseId}`
    : null;

  const formatProductsList = (products: PurchaseReplenishment[]) => {
    if (!products.length) return '';
    return products
      .map((item) => `• ${item.quantity} × ${item.name} · $${item.unitCost}`)
      .join('\n');
  };

  return (
    <StyledModal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      closable={false}
    >
      <Content
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <IconWrapper>
          <ShopOutlined />
        </IconWrapper>

        <Title>¡Compra Completada!</Title>

        {items.length > 0 && (
          <>
            <ProductSummary>
              <ReactMarkdown>{formatProductsList(items)}</ReactMarkdown>
            </ProductSummary>
            <ProductCount>{items.length} productos agregados</ProductCount>
          </>
        )}

        <Total>
          ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Total>

        <ButtonGroup>
          <ActionButton
            className="secondary"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CloseOutlined /> Cerrar
          </ActionButton>
          <ActionButton
            disabled={!warehouseNavigationPath}
            onClick={() => {
              if (!warehouseNavigationPath) return;
              navigate(warehouseNavigationPath);
              onClose();
            }}
            whileHover={warehouseNavigationPath ? { scale: 1.02 } : undefined}
            whileTap={warehouseNavigationPath ? { scale: 0.98 } : undefined}
          >
            Ver Almacén <ArrowRightOutlined />
          </ActionButton>
        </ButtonGroup>
      </Content>
    </StyledModal>
  );
}
