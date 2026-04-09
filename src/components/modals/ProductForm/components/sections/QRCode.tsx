import { memo } from 'react';
import { Card, Input, Form, QRCode as AntdQRCode } from 'antd';
import type { ProductRecord } from '@/types/products';
import styled from 'styled-components';

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;

  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const QRCodeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  height: 180px;
`;

const FormItemContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
`;

const FooterSpace = styled.div`
  height: 52px; /* A bit taller to match BarCode Footer Button + Validation Message */
  width: 100%;
`;

type QRCodeProps = {
  product: ProductRecord;
};

const QRCodeComponent = ({ product }: QRCodeProps) => {
  return (
    <StyledCard
      title={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minHeight: '24px' }}>
          Código QR
        </div>
      }
      size="small"
    >
      <ContentContainer>
        <QRCodeContainer>
          <AntdQRCode size={120} value={product?.qrcode || '-'} bordered={false} />
        </QRCodeContainer>

        <FormItemContainer>
          <Form.Item
            name="qrcode"
            label="Código QR"
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Ingresa el código QR" maxLength={60} />
          </Form.Item>
        </FormItemContainer>

        {/* Placeholder to match BarCode footer height exactly */}
        <FooterSpace />
      </ContentContainer>
    </StyledCard>
  );
};

const areQRCodePropsEqual = (prev: QRCodeProps, next: QRCodeProps) => {
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.qrcode === next.product?.qrcode
  );
};

export const QRCode = memo(QRCodeComponent, areQRCodePropsEqual);
