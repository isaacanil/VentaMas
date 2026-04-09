import styled from 'styled-components';

import type { FC } from 'react';

import { BarCode } from '@/components/modals/ProductForm/components/sections/BarCode';
import { QRCode } from '@/components/modals/ProductForm/components/sections/QRCode';
import {
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';
import type { ProductRecord } from '@/types/products';

const EMPTY_PRODUCT = {} as ProductRecord;

const CodesCard = styled(SectionCard)`
  .ant-card-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`;

const CodesSpacer = styled.div`
  flex: 1;
`;

const CodesColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (width <= 1024px) {
    grid-template-columns: 1fr;
  }
`;

interface CodesSectionProps {
  domId: string;
  product?: ProductRecord | null;
}

export const CodesSection: FC<CodesSectionProps> = ({ domId, product }) => (
  <CodesCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Identificadores y códigos</SectionTitle>
      <SectionDescription>
        Conecta tu producto con lectores de barras o QR.
      </SectionDescription>
    </SectionHeader>
    <CodesColumns>
      <QRCode product={product ?? EMPTY_PRODUCT} />
      <BarCode product={product ?? EMPTY_PRODUCT} />
    </CodesColumns>
    <CodesSpacer />
  </CodesCard>
);
