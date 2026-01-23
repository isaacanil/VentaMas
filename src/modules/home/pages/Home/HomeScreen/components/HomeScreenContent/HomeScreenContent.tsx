import styled from 'styled-components';

import { Body } from './Body';
import { Header } from './Header';

import type { JSX } from 'react';

export const HomeScreenContent = (): JSX.Element => {
  return (
    <Container>
      <Header />
      <Body />
      {/* <Footer /> */}
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  width: 100%;
  background-color: #0084ff;
`;
