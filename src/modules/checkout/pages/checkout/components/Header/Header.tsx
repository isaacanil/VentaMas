import { DateTime } from 'luxon';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';
import { formatDateTime } from '@/utils/date/dateUtils';
import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity.js';
import type { TimestampLike } from '@/utils/date/types';
import { InfoItem, Spacing } from '@/modules/checkout/pages/checkout/Style';
import type { InvoiceData } from '@/types/invoice';
import type { AccountsReceivablePaymentReceipt } from '@/utils/accountsReceivable/types';

type BusinessData = {
  name?: string;
  address?: string;
  tel?: string;
};

type DocumentIdentity = {
  label?: string;
  value?: string | number | null;
};

type ReceiptHeaderData = InvoiceData | AccountsReceivablePaymentReceipt;

type HeaderProps = {
  data?: ReceiptHeaderData | null;
};

export const Header = ({ data }: HeaderProps) => {
  const business = useSelector(selectBusinessData) as BusinessData | null;
  const documentIdentity =
    data && 'NCF' in data
      ? (resolveDocumentIdentity(data as InvoiceData) as DocumentIdentity)
      : ({} as DocumentIdentity);
  const rawDate =
    (data as { date?: TimestampLike; createdAt?: TimestampLike } | undefined)
      ?.date ?? (data as { createdAt?: TimestampLike } | undefined)?.createdAt;
  const fechaActual = rawDate
    ? formatDateTime(rawDate)
    : DateTime.now().toFormat('dd/MM/yyyy HH:mm');

  return (
    <Container>
      <Title>{business?.name}</Title>
      <InfoItem
        align="center"
        label={business?.address}
        justifyContent="center"
      />
      <InfoItem
        align="center"
        label={formatPhoneNumber(business?.tel)}
        justifyContent="center"
      />

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
            <InfoItem
              label="TEL"
              value={formatPhoneNumber(data?.client?.tel)}
            />
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
