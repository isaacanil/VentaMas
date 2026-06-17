import { Card } from 'antd';
import styled from 'styled-components';

export const StyledCard = styled(Card)`
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

export const CardHeader = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

export const CheckboxContainer = styled.div`
  padding-top: 2px;
`;

export const ProductInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ProductName = styled.div`
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(props) => props.theme?.text?.primary || '#333'};
  overflow-wrap: anywhere;
`;

export const ProductMeta = styled.div`
  font-size: 0.8rem;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const QuantitySection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const QuantityLabel = styled.span`
  font-weight: 500;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

export const QuantityControls = styled.div`
  display: flex;
  align-items: center;
`;

export const PriceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${(props) => props.theme?.border?.color || '#f0f0f0'};
`;

export const PriceRow = styled.div`
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

export const PriceLabel = styled.span`
  font-size: 0.85rem;
  color: ${(props) => props.theme?.text?.secondary || '#666'};
`;

export const PriceValue = styled.span`
  font-family: monospace;
  font-size: 0.85rem;
  color: ${(props) => props.theme?.text?.primary || '#333'};

  .total & {
    font-size: 0.9rem;
    font-weight: 600;
  }
`;
