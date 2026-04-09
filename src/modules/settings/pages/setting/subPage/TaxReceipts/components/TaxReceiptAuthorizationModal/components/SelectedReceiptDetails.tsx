import { Divider, Typography } from 'antd';
import styled from 'styled-components';

import type { TaxReceiptDocumentWithAuthorizations } from '../types';

const { Text } = Typography;

interface SelectedReceiptDetailsProps {
  receipt: TaxReceiptDocumentWithAuthorizations;
}

export const SelectedReceiptDetails = ({
  receipt,
}: SelectedReceiptDetailsProps) => {
  return (
    <>
      <Divider>Informacion del Comprobante</Divider>

      <ReceiptCard>
        <ReceiptDetails>
          <ReceiptDetailItem>
            <Text strong>Nombre:</Text>
            <Text>{receipt.data.name}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Tipo-Serie:</Text>
            <Text>
              {receipt.data.type}
              {receipt.data.serie}
            </Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Secuencia actual:</Text>
            <Text>{receipt.data.sequence}</Text>
          </ReceiptDetailItem>
          <ReceiptDetailItem>
            <Text strong>Cantidad actual:</Text>
            <Text>{receipt.data.quantity}</Text>
          </ReceiptDetailItem>
        </ReceiptDetails>
      </ReceiptCard>
    </>
  );
};

const ReceiptCard = styled.div`
  padding: 16px;
  margin-bottom: 20px;
  background-color: #f8fafc;
  border: 1px solid #e6e8eb;
  border-radius: 8px;
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
