import React from 'react';
import type { InvoiceData } from '@/types/invoice';
import styled from 'styled-components';
import { resolveTimestampSeconds } from '@/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils';

type HeaderProps = {
  data: InvoiceData;
};

export const Header = ({ data }: HeaderProps) => {
  const numberID = data?.numberID;
  const client = data?.client || {};
  const date = data?.date;
  const formatDate = (seconds?: number | null) => {
    if (!seconds) return new Date().toLocaleString();
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
  };
  const dateSeconds = resolveTimestampSeconds(date ?? null);
  return (
    <Container>
      <Title># {numberID}</Title>
      <Client>{client?.name}</Client>
      <Day> {formatDate(dateSeconds)}</Day>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: 1.4em;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 1px solid #cfcfcf;
`;
const Client = styled.h4`
  margin: 0;
  font-weight: normal;
`;
const Day = styled.div`
  place-self: center end;
  margin: 0;
  text-align: right;
  white-space: nowrap;
`;
const Title = styled.h4`
  margin: 0;
  white-space: nowrap;
`;
