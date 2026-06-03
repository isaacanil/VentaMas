import React, { type ReactNode } from 'react';
import styled from 'styled-components';

type ViewportContainerProps = {
  children: ReactNode;
};

export const ViewportContainer = ({ children }: ViewportContainerProps) => {
  return <Container>{children}</Container>;
};

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;

  @supports not (min-height: 100dvh) {
    height: 100vh;
    min-height: 100vh;
  }

  @media (width <= 768px) {
    overflow: hidden;
  }
`;
