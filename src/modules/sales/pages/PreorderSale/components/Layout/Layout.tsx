import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: grid;
  height: calc(100vh - 2.75em);
  max-height: 100vh;
`;

const Main = styled.main`
  display: grid;
  flex-grow: 1;
  grid-template-rows: auto 1fr;
  max-width: 112rem;
  margin: 0 auto;
  overflow: auto;
`;

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <Wrapper>
      <Main>{children}</Main>
    </Wrapper>
  );
};

export default Layout;
