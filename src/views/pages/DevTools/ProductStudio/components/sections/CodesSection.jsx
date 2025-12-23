import { Form, Input } from 'antd';
import styled from 'styled-components';

import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '@/views/pages/DevTools/ProductStudio/components/SectionLayout';

const CodesCard = styled(SectionCard)`
  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 340px;
  }
`;

const CodesSpacer = styled.div`
  flex: 1;
  min-height: 150px;
`;

export const CodesSection = ({ domId }) => (
  <CodesCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Identificadores y códigos</SectionTitle>
      <SectionDescription>
        Conecta tu producto con lectores de barras o QR.
      </SectionDescription>
    </SectionHeader>
    <FieldGrid>
      <Form.Item name="barcode" label="Código de barras">
        <Input placeholder="Escanea o pega el código" />
      </Form.Item>
      <Form.Item name="qrcode" label="Código QR">
        <Input placeholder="Enlace o valor codificado" />
      </Form.Item>
    </FieldGrid>
    <CodesSpacer />
  </CodesCard>
);
