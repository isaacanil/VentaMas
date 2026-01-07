// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

export const Col = ({ textAlign, children }) => {
  return <Container textAlign={textAlign}>{children}</Container>;
};
const Container = styled.div`
  display: flex;
  justify-content: ${(props) => props.textAlign};
  width: 100%;
`;
