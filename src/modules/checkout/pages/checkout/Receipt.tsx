import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import {
  resolveDocumentIdentity,
  type DocumentIdentity,
} from '@/utils/invoice/documentIdentity.js';
import type { InvoiceData, InvoiceBusinessInfo } from '@/types/invoice';

import { Header } from './components/Header/Header';
import { PaymentArea } from './components/PaymentArea';
import { ProductList } from './components/ProductList';
import { Row } from './components/Table/Row';
import { ThankYouMessage } from './components/ThankYouMessage';
import { WarrantySignature } from './components/WarrantySignature';
import { Container, HiddenPrintWrapper } from './Style';

type ReceiptProps = {
  data?: InvoiceData | null;
  ignoreHidden?: boolean;
};

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ data, ignoreHidden }, ref) => {
    const business = useSelector(
      selectBusinessData,
    ) as InvoiceBusinessInfo | null;
    const documentIdentity: DocumentIdentity = resolveDocumentIdentity(data);
    const ncfType = documentIdentity.description ?? '';

    if (!data) return null;

    return (
      <HiddenPrintWrapper ignoreHidden={ignoreHidden}>
        <Container ref={ref}>
          <Header data={data} />
          <Space />
          <Line />
          <Row cols="1" space>
            <SubTitle align="center"> {ncfType}</SubTitle>
          </Row>
          <Line />
          <Row cols="3" space>
            <P>DESCRIPCION</P>
            <P align="right">ITBIS</P>
            <P align="right">VALOR</P>
          </Row>
          <Line />
          <ProductList data={data} />
          <Line />
          <PaymentArea data={data} />
          <WarrantySignature data={data} />
          <ThankYouMessage message={business?.invoice?.invoiceMessage} />
          {/* <WarrantyArea data={data} /> */}
        </Container>
      </HiddenPrintWrapper>
    );
  },
);

Receipt.displayName = 'Receipt';

type TextAlign = 'left' | 'right' | 'center';

type TextAlignProps = {
  align?: TextAlign;
};

type SpaceSize = 'small' | 'medium' | 'large';

type SpaceProps = {
  size?: SpaceSize;
};

export const SubTitle = styled.p<TextAlignProps>`
  font-weight: 600;
  line-height: 12px;
  padding: 0;
  margin: 0;
  white-space: nowrap;

  ${(props: TextAlignProps) => {
    switch (props.align) {
      case 'center':
        return 'text-align: center;';
      case 'right':
        return 'text-align: right;';
      default:
        return 'text-align: left;';
    }
  }}
`;

export const P = styled.p<TextAlignProps>`
  margin: 0;
  padding: 0.2em 0;
  text-transform: uppercase;
  ${(props: TextAlignProps) => {
    switch (props.align) {
      case 'center':
        return 'text-align: center;';
      case 'right':
        return 'text-align: right;';
      default:
        return 'text-align: left;';
    }
  }}
`;

export const Line = styled.div`
  border: none;
  border-top: 1px dashed black;
`;

const Space = styled.div<SpaceProps>`
  margin-bottom: 0.6em;
  ${(props: SpaceProps) => {
    switch (props.size) {
      case 'small':
        return 'margin-bottom: 0.2em;';
      case 'medium':
        return 'margin-bottom: 0.8em;';
      case 'large':
        return 'margin-bottom: 1.6em;';
      default:
        return 'margin-bottom: 0.8em;';
    }
  }}
`;
