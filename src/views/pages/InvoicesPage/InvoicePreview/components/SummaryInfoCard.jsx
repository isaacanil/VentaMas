import {
  faFileInvoice,
  faShoppingCart,
  faCalculator,
  faDollarSign,
  faTag,
} from '@fortawesome/free-solid-svg-icons';
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
    payment,
    change,
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
            <InfoValue>
              {useFormatPrice(totalPurchaseWithoutTaxes?.value) || 'N/A'}
            </InfoValue>
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

          <InfoItem>
            <InfoLabel>
              <FontAwesomeIcon icon={faDollarSign} />
              Cambio / Faltante:
            </InfoLabel>
            <InfoValue>
              {useFormatPrice(change?.value ?? payment?.change) || 'N/A'}
            </InfoValue>
          </InfoItem>
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
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const CardTitle = styled.h3`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
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
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
`;

const InfoLabel = styled.span`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 500;
  color: #666;
`;

const InfoValue = styled.span`
  font-family: ${(props) => props.theme?.fonts?.mono || 'monospace'};
  font-size: 0.93rem;
  font-weight: 500;
  color: #333;
`;

const TotalItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-top: 0.5rem;
  background: #f8f9fa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
`;

const TotalLabel = styled.span`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.93rem;
  font-weight: 600;
  color: #333;
`;

const TotalValue = styled.span`
  font-family: monospace;
  font-size: 1.05rem;
  font-weight: 700;
  color: #1890ff;
`;

export default SummaryInfoCard;
