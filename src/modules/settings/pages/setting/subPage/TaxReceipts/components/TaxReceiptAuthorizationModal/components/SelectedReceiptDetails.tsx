import { Alert, Typography } from 'antd';
import styled from 'styled-components';

import type { TaxReceiptDocumentWithAuthorizations } from '../types';
import { resolveReceiptIncrease } from '../utils/taxReceiptAuthorizationModal';

const { Text } = Typography;

interface SelectedReceiptDetailsProps {
  receipt: TaxReceiptDocumentWithAuthorizations;
}

export const SelectedReceiptDetails = ({
  receipt,
}: SelectedReceiptDetailsProps) => {
  const seriesCode = `${receipt.data.type}${receipt.data.serie}`;
  const currentQuantity = parseInt(String(receipt.data.quantity ?? '0'), 10);
  const currentSequence = parseInt(String(receipt.data.sequence ?? '0'), 10);
  const increase = resolveReceiptIncrease(receipt.data.increase);
  const nextAvailableSequence =
    Number.isFinite(currentSequence) && currentSequence >= 0
      ? currentSequence + increase
      : null;

  return (
    <>
      <SectionLabel>Serie seleccionada</SectionLabel>

      {currentQuantity === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Secuencia agotada — este rango actualizará la disponibilidad."
          style={{ marginBottom: 12 }}
        />
      )}

      <ReceiptCard>
        <ReceiptDetails>
          <ReceiptDetailItem>
            <Text strong>Comprobante</Text>
            <Text>{receipt.data.name}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Código DGII</Text>
            <Text>{seriesCode}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Último emitido</Text>
            <Text>{receipt.data.sequence}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Próximo disponible</Text>
            <Text>{nextAvailableSequence ?? 'N/D'}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Disponible actual</Text>
            <Text>{receipt.data.quantity}</Text>
          </ReceiptDetailItem>
        </ReceiptDetails>
      </ReceiptCard>
    </>
  );
};

const SectionLabel = styled.p`
  margin: 0 0 10px;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;

const ReceiptCard = styled.div`
  padding: 16px;
  margin-bottom: 20px;
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
`;

const ReceiptDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
`;

const ReceiptDetailItem = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
`;
