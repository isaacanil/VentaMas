// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

export const Header = ({ data }) => {
  const numberID = data?.numberID;
  const client = data?.client || {};
  const date = data?.date;
  const formatDate = (seconds) => {
    if (!seconds) return new Date().toLocaleString();
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
  };
  return (
    <Container>
      <Title># {numberID}</Title>
      <Client>{client?.name}</Client>
      <Day> {formatDate(date?.seconds)}</Day>
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
