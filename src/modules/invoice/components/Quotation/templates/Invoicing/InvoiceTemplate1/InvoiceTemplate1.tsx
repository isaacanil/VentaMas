import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import type { InvoiceBusinessInfo } from '@/types/invoice';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity.js';
import type { QuotationTemplateProps } from '@/modules/invoice/components/Quotation/types';

import { Header } from './components/Header/Header';
import { PaymentArea } from './components/PaymentArea';
import { ProductList } from './components/ProductList';
import { Row } from './components/Table/Row';
import { ThankYouMessage } from './components/ThankYouMessage';
import { WarrantySignature } from './components/WarrantySignature';
import { Container, HiddenPrintWrapper } from './Style';

export const InvoiceTemplate1 = React.forwardRef<
  HTMLDivElement,
  QuotationTemplateProps
>(({ data, ignoreHidden }, ref) => {
  const business = (useSelector(selectBusinessData) || {}) as InvoiceBusinessInfo;
    const documentIdentity = resolveDocumentIdentity(data);
    const ncfType = documentIdentity.description;

    return data ? (
      <HiddenPrintWrapper ignoreHidden={ignoreHidden}>
        <Container ref={ref}>
          <Header data={data} Space={Space} SubTitle={SubTitle} P={P} />
          <Space />
          <Line />
          <Row space>
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
          <PaymentArea P={P} data={data} />
          <WarrantySignature data={data} />
          <ThankYouMessage message={business?.invoice?.invoiceMessage} />
          {/* <WarrantyArea data={data} /> */}
        </Container>
      </HiddenPrintWrapper>
    ) : null;
  },
);

InvoiceTemplate1.displayName = 'InvoiceTemplate1';

type TextAlignProps = { align?: 'left' | 'right' | 'center' };
type SpaceProps = { size?: 'small' | 'medium' | 'large' };

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
