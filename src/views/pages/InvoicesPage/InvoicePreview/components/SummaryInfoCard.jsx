import { faFileInvoice, faShoppingCart, faCalculator, faDollarSign, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Divider } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { useFormatPrice } from '../../../../../hooks/useFormatPrice';

const SummaryInfoCard = ({ summaryData }) => {
  const {
    sourceOfPurchase,
    totalShoppingItems,
    totalPurchaseWithoutTaxes,
    totalTaxes,
    payment
  } = summaryData;

  return (
    <StyledCard>
      <CardHeader>
        <CardTitle>
          <FontAwesomeIcon icon={faFileInvoice} />
          Resumen
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <InfoSection>
          <InfoItem>
            <InfoLabel>
              <FontAwesomeIcon icon={faTag} />
              Método de Compra:
            </InfoLabel>
            <InfoValue>{sourceOfPurchase || 'N/A'}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>
              <FontAwesomeIcon icon={faShoppingCart} />
              Total de Artículos:
            </InfoLabel>
            <InfoValue>{totalShoppingItems?.value || 'N/A'}</InfoValue>
          </InfoItem>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <InfoItem>
            <InfoLabel>
              <FontAwesomeIcon icon={faCalculator} />
              Subtotal:
            </InfoLabel>
            <InfoValue>{useFormatPrice(totalPurchaseWithoutTaxes?.value) || 'N/A'}</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>
              <FontAwesomeIcon icon={faCalculator} />
              Impuestos:
            </InfoLabel>
            <InfoValue>{useFormatPrice(totalTaxes?.value) || 'N/A'}</InfoValue>
          </InfoItem>
          
          <TotalItem>
            <TotalLabel>
              <FontAwesomeIcon icon={faDollarSign} />
              Total Pagado:
            </TotalLabel>
            <TotalValue>{useFormatPrice(payment?.value) || 'N/A'}</TotalValue>
          </TotalItem>
        </InfoSection>
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const CardHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const InfoValue = styled.span`
  font-size: 0.93rem;
  color: #333;
  font-weight: 500;
  font-family: ${props => props.theme?.fonts?.mono || 'monospace'};
`;

const TotalItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #f8f9fa;
  margin-top: 0.5rem;
`;

const TotalLabel = styled.span`
  font-size: 0.93rem;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TotalValue = styled.span`
  font-size: 1.05rem;
  color: #1890ff;
  font-weight: 700;
  font-family: monospace;
`;

export default SummaryInfoCard;
