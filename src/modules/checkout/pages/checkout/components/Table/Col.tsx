import React from 'react';
import styled from 'styled-components';

type Align = 'left' | 'right' | 'center' | string;

type ColProps = {
  textAlign?: Align;
  children?: React.ReactNode;
};

const resolveJustify = (align?: Align) => {
  if (!align) return 'flex-start';
  if (align === 'right') return 'flex-end';
  if (align === 'left') return 'flex-start';
  return align;
};

export const Col = ({ textAlign, children }: ColProps) => {
  return <Container $justify={resolveJustify(textAlign)}>{children}</Container>;
};

const Container = styled.div<{ $justify: string }>`
  display: flex;
  justify-content: ${({ $justify }) => $justify};
  width: 100%;
`;
