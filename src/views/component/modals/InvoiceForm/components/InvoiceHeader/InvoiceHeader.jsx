import {
  faFileInvoice,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DateTime } from 'luxon';
import React from 'react';
import styled from 'styled-components';

export const InvoiceHeader = ({ invoice }) => {
  const ncf = invoice?.NCF || 'N/A';
  const invoiceNumber = invoice?.numberID || 'N/A';
  const date = invoice?.date
    ? DateTime.fromMillis(invoice.date).toFormat('dd/MM/yyyy')
    : DateTime.now().toFormat('dd/MM/yyyy');

  return (
    <Container>
      <HeaderCard>
        <HeaderItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faFileInvoice} />
          </IconWrapper>
          <InfoContent>
            <Label>NCF</Label>
            <Value>{ncf}</Value>
          </InfoContent>
        </HeaderItem>

        <Divider />

        <HeaderItem>
          <InfoContent>
            <Label>Factura</Label>
            <Value>#{invoiceNumber}</Value>
          </InfoContent>
        </HeaderItem>

        <Divider />

        <HeaderItem>
          <IconWrapper>
            <FontAwesomeIcon icon={faCalendarAlt} />
          </IconWrapper>
          <InfoContent>
            <Label>Fecha</Label>
            <Value>{date}</Value>
          </InfoContent>
        </HeaderItem>
      </HeaderCard>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
`;

const HeaderCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;

const HeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #f0f5ff;
  border-radius: 6px;
  color: #1890ff;
  font-size: 14px;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const Label = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const Value = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

const Divider = styled.div`
  width: 1px;
  height: 32px;
  background: #e8e8e8;
`;
