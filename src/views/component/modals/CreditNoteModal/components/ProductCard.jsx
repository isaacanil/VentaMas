import { InfoCircleOutlined } from '@ant-design/icons';
import { Card, Checkbox, InputNumber, Typography, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { getTotalPrice } from '../../../../../utils/pricing';

import { formatPrice } from '@/utils/format';

const { Text } = Typography;

export const ProductCard = ({
  product,
  isSelected,
  quantity,
  maxQuantity,
  originalQuantity,
  isView,
  onSelectionChange,
  onQuantityChange,
  creditedByOthers = 0,
}) => {
  const unitPrice = getTotalPrice(product, true, false);
  const tempItem = { ...product, amountToBuy: quantity };
  const total = getTotalPrice(tempItem);
  const itbis = total - total / 1.18;

  return (
    <StyledCard size="small">
      <CardHeader>
        <CheckboxContainer>
          <Checkbox
            checked={isSelected}
            disabled={isView}
            onChange={(e) => onSelectionChange(product.id, e.target.checked)}
          />
        </CheckboxContainer>
        <ProductInfo>
          <ProductName>{product.name}</ProductName>
          <ProductMeta>
            <Text type="secondary">Precio: {formatPrice(unitPrice)}</Text>
          </ProductMeta>
        </ProductInfo>
      </CardHeader>

      <CardBody>
        <QuantitySection>
          <QuantityLabel>Cantidad:</QuantityLabel>
          <QuantityControls>
            {isView || !isSelected ? (
              <QuantityDisplay>
                <span style={{ fontWeight: '500' }}>{quantity}</span>
                <span style={{ fontSize: '11px', color: '#999' }}>
                  /{originalQuantity}
                </span>
              </QuantityDisplay>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <InputNumber
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={onQuantityChange}
                  size="small"
                  style={{ width: '60px' }}
                />
                <Tooltip
                  title={
                    <div>
                      <div>
                        <strong>Cálculo de cantidad máxima:</strong>
                      </div>
                      <div>• Factura original: {originalQuantity}</div>
                      <div>• Otras notas de crédito: {creditedByOthers}</div>
                      <div
                        style={{
                          borderTop: '1px solid #ddd',
                          paddingTop: '4px',
                          marginTop: '4px',
                        }}
                      >
                        <strong>Máximo disponible: {maxQuantity}</strong>
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#999',
                          marginTop: '4px',
                        }}
                      >
                        Fórmula: Factura - Otras NC = {originalQuantity} -{' '}
                        {creditedByOthers} = {maxQuantity}
                      </div>
                    </div>
                  }
                  placement="topLeft"
                >
                  <span
                    style={{ fontSize: '10px', color: '#999', cursor: 'help' }}
                  >
                    /{originalQuantity} <InfoCircleOutlined />
                  </span>
                </Tooltip>
              </div>
            )}
          </QuantityControls>
        </QuantitySection>

        <PriceSection>
          <PriceRow>
            <PriceLabel>ITBIS:</PriceLabel>
            <PriceValue>{formatPrice(itbis)}</PriceValue>
          </PriceRow>
          <PriceRow className="total">
            <PriceLabel>Total:</PriceLabel>
            <PriceValue>{formatPrice(total)}</PriceValue>
          </PriceRow>
        </PriceSection>
      </CardBody>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  margin-bottom: 0.75rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);

  &:last-child {
    margin-bottom: 0;
  }

  .ant-card-body {
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const CheckboxContainer = styled.div`
  padding-top: 2px;
`;

const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProductName = styled.div`
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => props.theme?.text?.primary || '#333'};
  overflow-wrap: anywhere;
`;

const ProductMeta = styled.div`
  font-size: 0.8rem;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const QuantitySection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const QuantityLabel = styled.span`
  font-weight: 500;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
`;

const QuantityDisplay = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#f0f0f0'};
`;

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.total {
    padding-top: 0.25rem;
    margin-top: 0.25rem;
    font-weight: 600;
    border-top: 1px solid ${(props) => props.theme?.border?.color || '#f0f0f0'};
  }
`;

const PriceLabel = styled.span`
  font-size: 0.85rem;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

const PriceValue = styled.span`
  font-family: monospace;
  font-size: 0.85rem;
  color: ${(props) => props.theme?.text?.primary || '#333'};

  .total & {
    font-size: 0.9rem;
    font-weight: 600;
  }
`;
