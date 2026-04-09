import React from 'react';
import type { ReactNode } from 'react';
import styled from 'styled-components';

type ColProps = {
  textAlign?: string;
  children?: ReactNode;
};

export const Col = ({ textAlign, children }: ColProps) => {
  return <Container textAlign={textAlign}>{children}</Container>;
};
type ContainerProps = {
  textAlign?: string;
};

const Container = styled.div<ContainerProps>`
  display: flex;
  justify-content: ${(props) => props.textAlign};
  width: 100%;
`;
