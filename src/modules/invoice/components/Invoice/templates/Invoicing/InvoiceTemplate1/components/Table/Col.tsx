import React from 'react';
import styled from 'styled-components';
import type { ReactNode } from 'react';

interface ColProps {
  textAlign?: 'left' | 'center' | 'right';
  children?: ReactNode;
}

export const Col = ({ textAlign, children }: ColProps) => {
  return <Container textAlign={textAlign}>{children}</Container>;
};
const Container = styled.div<{ textAlign?: 'left' | 'center' | 'right' }>`
  display: flex;
  justify-content: ${(props) => props.textAlign};
  width: 100%;
`;
