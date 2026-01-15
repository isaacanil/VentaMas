import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectBusinessData } from '@/features/auth/businessSlice';
import { SelectInvoiceComment } from '@/features/cart/cartSlice';
import { selectInsuranceData } from '@/features/insurance/insuranceSlice';
import { formatPrice } from '@/utils/format';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import type { InvoiceTemplateProps } from '@/types/invoice';

import { Header } from './components/Header/Header';
import { PaymentArea } from './components/PaymentArea';
import { ProductList } from './components/ProductList';
import { Row } from './components/Table/Row';
import { ThankYouMessage } from './components/ThankYouMessage';
import { WarrantySignature } from './components/WarrantySignature';
import { Container, HiddenPrintWrapper } from './Style';


export const InvoiceTemplate1 = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ data, ignoreHidden }, ref) => {
    const business = useSelector(selectBusinessData) || null;
    const insuranceStatus = data?.insuranceEnabled;
    const insuranceData = useSelector(selectInsuranceData);
    const invoiceComment = useSelector(SelectInvoiceComment);
    const creditNotes = data?.creditNotePayment || [];
    const documentIdentity = resolveDocumentIdentity(data);
    const ncfType = documentIdentity.description;

    return data ? (
      <HiddenPrintWrapper ignoreHidden={ignoreHidden}>
        <Container ref={ref}>
          <Header data={data} />
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
          <PaymentArea data={data} />
          {creditNotes.length > 0 && (
            <CreditNotesSection>
              <Line />
              <P align="center">Notas de Crédito Aplicadas</P>
              <Line />
              {creditNotes.map((note, index) => (
                <Row key={index} cols="2" space>
                  <P>NCF: {note.ncf}</P>
                  <P align="right">{formatPrice(note.amountUsed)}</P>
                </Row>
              ))}
              <Line />
            </CreditNotesSection>
          )}
          {insuranceStatus && (
            <InsuranceInfo>
              <P align="center">Cobertura de Seguro Aplicada</P>
              {insuranceData.authNumber && (
                <P align="center">
                  No. Autorización: {insuranceData.authNumber}
                </P>
              )}
            </InsuranceInfo>
          )}
          {invoiceComment && (
            <CommentSection>
              <P align="center" className="comment-title">
                Comentario de Factura:
              </P>
              <P align="center" className="comment-text">
                {invoiceComment}
              </P>
            </CommentSection>
          )}
          <WarrantySignature data={data} />
          <ThankYouMessage message={business?.invoice?.invoiceMessage} />
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

const InsuranceInfo = styled.div`
  padding: 0.5em 0;
  margin: 0.5em 0;
  border-top: 1px dashed black;
  border-bottom: 1px dashed black;
`;

const CommentSection = styled.div`
  padding: 0.5em 0;
  margin: 0.5em 0;
  border-top: 1px dashed black;
  border-bottom: 1px dashed black;

  .comment-title {
    font-weight: 600;
  }

  .comment-text {
    font-style: italic;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }
`;

const CreditNotesSection = styled.div`
  padding: 0.5em 0;
  margin: 0.5em 0;
  border-top: 1px dashed black;
  border-bottom: 1px dashed black;
`;
