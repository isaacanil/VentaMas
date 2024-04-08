import React from 'react'
import styled from 'styled-components';
export const Header = ({data}) => {
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
  )
}

const Container = styled.div`
  display: grid;
  grid-template-columns: min-content 1fr min-content;
  gap: 1.4em;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
    padding-bottom: 8px;
  border-bottom: 1px solid #cfcfcf;
`;
const Client = styled.h4`
  margin: 0;
  font-weight: normal;
`;
const Day = styled.div`
  white-space: nowrap;
  margin: 0;
  text-align: right;
  justify-self: end;
  align-self: center;
`;
const Title = styled.h4`
  margin: 0;
  white-space: nowrap;
`;

