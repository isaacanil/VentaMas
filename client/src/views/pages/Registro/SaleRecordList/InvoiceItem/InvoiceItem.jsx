import React from 'react';
import styled from 'styled-components';
import { Header } from './components/Header';
import { Body } from './components/Body';
import { Footer } from './components/Footer';

export const InvoiceItem = ({ data }) => {

  return (
    <Container>
      <Header data={data} />
      <Body data={data}  />
      <Footer data={data} />
    </Container>
  );
};

const Container = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 0.4em ;
  font-family: 'Arial', sans-serif;
  border: 1px solid #e0e0e0;
`;








