// @ts-nocheck
import { CreditCardOutlined } from '@ant-design/icons';
import { Card, Divider } from 'antd';
import React from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

export const CreditNotesSummary = ({
  selectedCreditNotes = [],
  totalPurchase = 0,
}) => {
  if (!selectedCreditNotes.length) {
    return null;
  }

  const totalCreditNoteAmount = selectedCreditNotes.reduce(
    (sum, note) => sum + (note.amountUsed || 0),
    0,
  );

  return (
    <SummaryCard>
      <CardHeader>
        <CardTitle>
          <CreditCardOutlined />
          Notas de Crédito Aplicadas
        </CardTitle>
        <TotalAmount>{formatPrice(totalCreditNoteAmount)}</TotalAmount>
      </CardHeader>

      <CardContent>
        {selectedCreditNotes.map((note, index) => (
          <CreditNoteItem key={note.id || index}>
            <ItemInfo>
              <NCF>{note.ncf || 'N/A'}</NCF>
              <Amount>{formatPrice(note.amountUsed || 0)}</Amount>
            </ItemInfo>
          </CreditNoteItem>
        ))}

        <Divider style={{ margin: '8px 0' }} />

        <SummaryInfo>
          <SummaryRow>
            <SummaryLabel>Total Aplicado:</SummaryLabel>
            <SummaryValue>{formatPrice(totalCreditNoteAmount)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Restante a Pagar:</SummaryLabel>
            <SummaryValue>
              {formatPrice(Math.max(0, totalPurchase - totalCreditNoteAmount))}
            </SummaryValue>
          </SummaryRow>
        </SummaryInfo>
      </CardContent>
    </SummaryCard>
  );
};

const SummaryCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const CardTitle = styled.h4`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const TotalAmount = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1890ff;
`;

const CardContent = styled.div`
  padding: 12px 16px;
`;

const CreditNoteItem = styled.div`
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
`;

const NCF = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: #333;
`;

const Amount = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1890ff;
`;

const SummaryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SummaryLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const SummaryValue = styled.span`
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #333;
`;
