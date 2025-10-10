import { ShopOutlined, ArrowRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { motion } from 'framer-motion';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
  }
`;

const Content = styled(motion.div)`
  text-align: center;
  padding: 24px 20px;
`;

const IconWrapper = styled.div`
  font-size: 48px;
  margin-bottom: 24px;
  color: var(--primary-color, #1677ff);
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const Total = styled.div`
  font-size: 40px;
  font-weight: 600;
  margin: 32px 0;
  font-feature-settings: "tnum";
  color: var(--primary-color, #1677ff);
`;

const ProductSummary = styled.div`
  text-align: left;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  font-size: 14px;
  max-height: 120px;
  overflow-y: auto;

  code {
    background: none;
    color: inherit;
    padding: 0;
  }

  p {
    margin: 0;
    line-height: 1.4;
  }
`;

const ProductCount = styled.div`
  font-size: 13px;
  color: #666;
  margin-top: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled(motion.button)`
  flex: 1;
  height: 44px;
  border-radius: 22px;
  background: #000;
  color: #fff;
  border: none;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background: var(--primary-color, #1677ff);
  }

  &.secondary {
    background: #f5f5f5;
    color: #000;
    &:hover {
      background: #e8e8e8;
    }
  }
`;

export default function PurchaseCompletionSummary({ visible, onClose, purchase }) {
  const navigate = useNavigate();
  const total = purchase?.replenishments?.reduce((sum, item) => 
    sum + (item.subtotal || 0), 0) || 0;
  const warehouseId = purchase?.warehouse?.id;

  const formatProductsList = (products) => {
    if (!products?.length) return '';
    return products.map(item => 
      `• ${item.quantity} × ${item.name} · $${item.unitCost}`
    ).join('\n');
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
        
        {purchase?.replenishments?.length > 0 && (
          <>
            <ProductSummary>
              <ReactMarkdown>{formatProductsList(purchase.replenishments)}</ReactMarkdown>
            </ProductSummary>
            <ProductCount>
              {purchase.replenishments.length} productos agregados
            </ProductCount>
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
            onClick={() => {
              navigate(`/inventory/warehouses/warehouse/:warehouseId`);
              onClose();
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Ver Almacén <ArrowRightOutlined />
          </ActionButton>
        </ButtonGroup>
      </Content>
    </StyledModal>
  );
}