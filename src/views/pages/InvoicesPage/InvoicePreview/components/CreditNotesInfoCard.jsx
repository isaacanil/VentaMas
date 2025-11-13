import { faCreditCard, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '../../../../../utils/formatPrice';

export const CreditNotesInfoCard = ({ creditNotes = [] }) => {
  if (!creditNotes.length) {
    return null; // No mostrar nada si no hay notas de crédito generadas
  }

  // Calcular total de notas de crédito generadas
  const totalCreditNotes = creditNotes.reduce(
    (sum, cn) => sum + (cn.totalAmount || 0),
    0,
  );

  return (
    <StyledCard>
      <CardHeader>
        <CardTitle>
          <FontAwesomeIcon icon={faCreditCard} />
          Notas de Crédito Generadas
        </CardTitle>
        <CardSummary>
          <SummaryItem>
            <SummaryLabel>Total:</SummaryLabel>
            <SummaryValue>{formatPrice(totalCreditNotes)}</SummaryValue>
          </SummaryItem>
        </CardSummary>
      </CardHeader>

      <CardContent>
        <Section>
          <SectionTitle>
            Notas de Crédito de esta Factura
            <Tooltip title="Notas de crédito creadas desde esta factura">
              <FontAwesomeIcon
                icon={faCircleInfo}
                style={{ marginLeft: '4px', color: '#999' }}
              />
            </Tooltip>
          </SectionTitle>
          <ItemsList>
            {creditNotes.map((cn, index) => (
              <CreditNoteItem key={cn.id || index}>
                <ItemHeader>
                  <ItemNCF>{cn.ncf || cn.number || 'N/A'}</ItemNCF>
                  <ItemAmount>{formatPrice(cn.totalAmount)}</ItemAmount>
                </ItemHeader>
                <ItemDetails>
                  <ItemDetail>
                    <DetailLabel>Creada:</DetailLabel>
                    <DetailValue>
                      {cn.createdAt?.seconds
                        ? dayjs(new Date(cn.createdAt.seconds * 1000)).format(
                            'DD/MM/YYYY HH:mm',
                          )
                        : dayjs(cn.createdAt).format('DD/MM/YYYY HH:mm')}
                    </DetailValue>
                  </ItemDetail>
                  <ItemDetail>
                    <DetailLabel>Disponible:</DetailLabel>
                    <DetailValue>
                      {formatPrice(cn.availableAmount ?? cn.totalAmount)}
                    </DetailValue>
                  </ItemDetail>
                  <ItemDetail>
                    <DetailLabel>Items:</DetailLabel>
                    <DetailValue>
                      <Tag color="blue" size="small">
                        {cn.items?.length || 0} productos
                      </Tag>
                    </DetailValue>
                  </ItemDetail>
                </ItemDetails>
              </CreditNoteItem>
            ))}
          </ItemsList>
        </Section>
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
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
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

const CardSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
`;

const SummaryItem = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SummaryLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
`;

const SummaryValue = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1890ff;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  display: flex;
  align-items: center;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CreditNoteItem = styled.div`
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const ItemNCF = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const ItemAmount = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1890ff;
`;

const ItemDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ItemDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const DetailLabel = styled.span`
  min-width: 60px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
`;

const DetailValue = styled.span`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: #333;
`;
