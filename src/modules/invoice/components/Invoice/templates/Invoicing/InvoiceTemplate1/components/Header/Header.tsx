import { DateTime } from 'luxon';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { formatDateTime } from '@/utils/date/dateUtils';
import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';
import {
  InfoItem,
  Spacing,
} from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/Style';

interface HeaderProps {
  data?: InvoiceData | null;
}

export const Header = ({ data }: HeaderProps) => {
  const business = (useSelector(selectBusinessData) ||
    {}) as InvoiceBusinessInfo;
  const logoUrl = business?.logoUrl || business?.logo || null;
  const documentIdentity = resolveDocumentIdentity(data);
  const fechaActual = data?.date
    ? formatDateTime(data.date)
    : DateTime.now().toFormat('dd/MM/yyyy HH:mm');

  // Llamar hooks incondicionalmente
  const formattedBusinessPhone = formatPhoneNumber(business?.tel || '');
  const formattedClientPhone = formatPhoneNumber(data?.client?.tel || '');

  return (
    <Container>
      {logoUrl && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
            width: '100%',
            maxHeight: '100px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '150px',
              height: 'auto',
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>
      )}

      <Title>{business?.name}</Title>
      <InfoItem
        align="center"
        label={business?.address}
        justifyContent="center"
      />
      <InfoItem
        align="center"
        label={formattedBusinessPhone}
        justifyContent="center"
      />
      {business?.rnc && (
        <InfoItem
          align="center"
          label="RNC"
          value={business.rnc}
          justifyContent="center"
        />
      )}

      <Spacing size={'large'} />

      <InfoItem label={'Fecha'} value={fechaActual} />
      {documentIdentity.label && (
        <InfoItem
          label={documentIdentity.label}
          value={documentIdentity.value || '-'}
        />
      )}
      <Spacing />
      {data?.client && (
        <div>
          <InfoItem
            label="CLIENTE"
            value={data?.client?.name?.toUpperCase() || 'CLIENTE GENERICO'}
          />
          {data?.client?.personalID && (
            <InfoItem label="CEDULA/RNC" value={data?.client?.personalID} />
          )}
          {data?.client?.tel && (
            <InfoItem label="TEL" value={formattedClientPhone} />
          )}
          {data?.client?.address && (
            <InfoItem label="DIR" value={data?.client?.address} />
          )}
        </div>
      )}
    </Container>
  );
};
const Container = styled.div`
  margin-top: 1em;
  margin-bottom: 0.6em;
`;
const Title = styled.p`
  padding: 0.2em 0;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
`;
// Removed unused Group styled-component per lint
