import { DateTime } from 'luxon';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '../../../../../../../../features/auth/businessSlice';
import DateUtils from '../../../../../../../../utils/date/dateUtils';
import { formatPhoneNumber } from '../../../../../../../../utils/format/formatPhoneNumber';
import { resolveDocumentIdentity } from '../../../../../../../../utils/invoice/documentIdentity.js';
import { InfoItem, Spacing } from '../../Style';

export const Header = ({ data }) => {
  let business = useSelector(selectBusinessData) || '';
  const documentIdentity = resolveDocumentIdentity(data);
  const fechaActual = data?.date
    ? DateUtils.convertMillisToISODate(
        DateUtils.convertTimestampToMillis(data.date),
        'dd/MM/yyyy HH:mm',
      )
    : DateTime.now().toFormat('dd/MM/yyyy HH:mm');
  
  // Formatear teléfonos
  const formattedBusinessPhone = formatPhoneNumber(business?.tel || '');
  const formattedClientPhone = formatPhoneNumber(data?.client?.tel || '');

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
        label={formattedBusinessPhone}
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
              value={formattedClientPhone}
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
