import React from 'react';
import styled from 'styled-components';

import { Body } from './components/Body/Body';
import { Header } from './components/Header';

export const ConfigModal = ({ config }) => {
  return (
    <Backdrop>
      <Container>
        <Header config={config} />
        <Body config={config} />
      </Container>
    </Backdrop>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  width: 100%;
  max-width: 1000px;
  height: 100%;
  max-height: 520px;
  overflow: hidden;
  background-color: white;
  border-radius: var(--border-radius);
`;
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: rgb(0 0 0 / 50%);
`;
